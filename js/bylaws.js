/* ============================================================
   Bylaw Search Engine – PVCS DMS
   PDF.js extraction + Fuse.js + Lunr.js local search
   ============================================================ */

let bylawsIndex = null;
let bylawsFuse = null;
let bylawsPages = [];

// ---- Load Bylaws from IndexedDB ----
async function loadBylawsIndex() {
  bylawsPages = await Bylaws.getAll();
  if (bylawsPages.length === 0) return false;
  buildSearchIndex();
  return true;
}

function buildSearchIndex() {
  // Build Lunr index
  bylawsIndex = lunr(function () {
    this.ref('page');
    this.field('text', { boost: 10 });
    this.field('section', { boost: 5 });
    bylawsPages.forEach(p => this.add({
      page: String(p.page),
      text: p.text || '',
      section: p.section || '',
    }));
  });

  // Build Fuse index for fuzzy search
  bylawsFuse = new Fuse(bylawsPages, {
    keys: ['text', 'section'],
    threshold: 0.35,
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 3,
    useExtendedSearch: true,
  });
}

// ---- Extract PDF Text ----
async function extractBylawsPDF(file, onProgress) {
  return new Promise(async (resolve, reject) => {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });

      loadingTask.onProgress = (data) => {
        if (data.total && onProgress) {
          onProgress(Math.round((data.loaded / data.total) * 30));
        }
      };

      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;
      const pages = [];

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const text = textContent.items
          .map(item => item.str)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        // Try to detect section headings
        const sectionMatch = text.match(/^(CHAPTER|PART|SECTION|RULE|ARTICLE|CLAUSE|SCHEDULE)\s+[\dIVXivx]+[.\s:–-]/i);
        const section = sectionMatch ? sectionMatch[0].trim() : '';

        if (text.length > 20) {
          pages.push({ page: i, text, section, charCount: text.length });
        }

        if (onProgress) {
          onProgress(30 + Math.round((i / totalPages) * 60));
        }
      }

      if (onProgress) onProgress(100);
      resolve(pages);
    } catch (err) {
      reject(err);
    }
  });
}

// ---- Search Bylaws ----
function searchBylaws(query, limit = 20) {
  if (!query || query.trim().length < 2) return [];
  if (!bylawsIndex && !bylawsFuse) return [];

  const q = query.trim();
  const results = new Map();

  // 1. Lunr search (exact/stemmed)
  try {
    const lunrResults = bylawsIndex.search(q);
    for (const r of lunrResults.slice(0, limit)) {
      const page = bylawsPages.find(p => String(p.page) === r.ref);
      if (page) {
        results.set(page.page, { page, score: r.score, source: 'lunr' });
      }
    }
  } catch (e) {
    // Lunr may throw on malformed queries – fall back to fuse
  }

  // 2. Fuse search (fuzzy)
  const fuseResults = bylawsFuse.search(q, { limit });
  for (const r of fuseResults) {
    if (!results.has(r.item.page)) {
      results.set(r.item.page, { page: r.item, score: r.score || 0.5, source: 'fuse', matches: r.matches });
    }
  }

  // 3. Simple substring search for multi-word queries
  const lq = q.toLowerCase();
  for (const p of bylawsPages) {
    if (p.text && p.text.toLowerCase().includes(lq) && !results.has(p.page)) {
      results.set(p.page, { page: p, score: 0.3, source: 'substring' });
    }
  }

  return Array.from(results.values())
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, limit);
}

// ---- Extract context snippet around keyword ----
function getSnippet(text, query, contextChars = 300) {
  if (!text || !query) return text ? text.slice(0, contextChars) : '';
  const ltext = text.toLowerCase();
  const lquery = query.toLowerCase();
  const idx = ltext.indexOf(lquery);
  if (idx === -1) return text.slice(0, contextChars) + (text.length > contextChars ? '…' : '');
  const start = Math.max(0, idx - Math.floor(contextChars / 2));
  const end = Math.min(text.length, idx + query.length + Math.floor(contextChars / 2));
  let snippet = (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
  return snippet;
}
