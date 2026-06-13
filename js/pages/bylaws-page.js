/* ============================================================
   Bylaw Search Page – PVCS DMS
   ============================================================ */

let bylawsLoaded = false;

async function renderBylawsPage() {
  const container = document.getElementById('page-bylaws');
  bylawsLoaded = await loadBylawsIndex();

  container.innerHTML = `
    <div class="section-title">📖 Society Bylaw Search</div>

    ${!bylawsLoaded ? `
      <!-- Upload Section -->
      <div class="card">
        <div class="card-header"><div class="card-title">Load Model Bylaws PDF</div></div>
        <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:16px">
          Upload the Model Bylaws PDF to enable full-text search. The document will be extracted, indexed, and stored locally in your browser. No data leaves your device.
        </p>
        <div class="upload-zone" id="bylaw-drop-zone" onclick="document.getElementById('bylaw-file-input').click()">
          <div class="upload-icon">📄</div>
          <div style="font-weight:600;margin-bottom:6px">Click to upload or drag & drop</div>
          <div style="font-size:0.8rem;color:var(--text-muted)">Accepts: PDF files only (Model Bylaws document)</div>
        </div>
        <input type="file" id="bylaw-file-input" accept=".pdf" style="display:none" />
        <div id="bylaw-progress-container" class="hidden" style="margin-top:12px">
          <div style="font-size:0.85rem;margin-bottom:6px" id="bylaw-progress-text">Extracting text from PDF...</div>
          <div class="progress-bar-outer"><div class="progress-bar-inner" id="bylaw-progress-bar"></div></div>
        </div>
      </div>
    ` : `
      <!-- Bylaws Loaded – Search Interface -->
      <div class="card" style="border-top:3px solid var(--success)">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
          <span style="font-size:1.3rem">✅</span>
          <div>
            <div style="font-weight:700;color:var(--success)">Bylaws Indexed</div>
            <div style="font-size:0.8rem;color:var(--text-muted)">${bylawsPages.length} pages loaded and searchable</div>
          </div>
          <button class="btn btn-sm btn-outline" style="margin-left:auto" onclick="reloadBylaws()">🔄 Reload PDF</button>
        </div>
      </div>
    `}

    <!-- Search Interface (always visible but grayed if not loaded) -->
    <div class="card ${!bylawsLoaded ? 'disabled-card' : ''}">
      <div class="card-header"><div class="card-title">Search Bylaws</div></div>
      <div class="search-bar">
        <input type="text" class="form-control" id="bylaw-search-input"
          placeholder="Search: quorum, membership, AGM, audit, secretary, loan, reserve fund..."
          ${!bylawsLoaded ? 'disabled' : ''}
          style="flex:1" />
        <button class="btn btn-primary" id="btn-bylaw-search" ${!bylawsLoaded ? 'disabled' : ''}>Search</button>
      </div>

      <!-- Quick Search Tags -->
      <div style="margin-top:8px">
        <span style="font-size:0.8rem;color:var(--text-muted);margin-right:8px">Quick:</span>
        ${['quorum','membership','AGM','audit','secretary','chairperson','committee','reserve fund','share capital','loan','general meeting','election','dissolution','penalty'].map(kw => `
          <span class="recipient-tag" onclick="quickBylawSearch('${kw}')" style="${!bylawsLoaded ? 'opacity:0.5;pointer-events:none' : ''}">${kw}</span>
        `).join('')}
      </div>
    </div>

    <!-- Results -->
    <div id="bylaw-results-container"></div>
  `;

  // Bind upload
  if (!bylawsLoaded) bindBylawUpload();
  else bindBylawSearch();
}

function bindBylawUpload() {
  const fileInput = document.getElementById('bylaw-file-input');
  const dropZone = document.getElementById('bylaw-drop-zone');

  if (!fileInput || !dropZone) return;

  fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) processBylawPDF(e.target.files[0]);
  });

  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') processBylawPDF(file);
    else showToast('Please drop a PDF file', 'warning');
  });
}

async function processBylawPDF(file) {
  const progress = document.getElementById('bylaw-progress-container');
  const progressBar = document.getElementById('bylaw-progress-bar');
  const progressText = document.getElementById('bylaw-progress-text');

  if (progress) progress.classList.remove('hidden');
  showToast('Processing PDF...', 'info', 3000);

  try {
    const pages = await extractBylawsPDF(file, (pct) => {
      if (progressBar) progressBar.style.width = pct + '%';
      if (progressText) {
        if (pct < 30) progressText.textContent = 'Loading PDF...';
        else if (pct < 90) progressText.textContent = `Extracting text from pages... ${pct}%`;
        else progressText.textContent = 'Building search index...';
      }
    });

    if (pages.length === 0) {
      showToast('No text found in PDF. Ensure the PDF contains selectable text.', 'error');
      return;
    }

    await Bylaws.savePages(pages);
    bylawsPages = pages;
    buildSearchIndex();
    bylawsLoaded = true;

    showToast(`✅ ${pages.length} pages indexed successfully!`, 'success');
    await renderBylawsPage();
  } catch (err) {
    console.error('PDF processing error:', err);
    showToast('Error processing PDF: ' + err.message, 'error');
  }
}

function reloadBylaws() {
  bylawsLoaded = false;
  bylawsIndex = null;
  bylawsFuse = null;
  bylawsPages = [];
  renderBylawsPage();
}

function bindBylawSearch() {
  const input = document.getElementById('bylaw-search-input');
  const btn = document.getElementById('btn-bylaw-search');

  if (!input || !btn) return;

  btn.addEventListener('click', () => performBylawSearch(input.value));
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') performBylawSearch(input.value); });
}

function quickBylawSearch(kw) {
  const input = document.getElementById('bylaw-search-input');
  if (input) {
    input.value = kw;
    performBylawSearch(kw);
  }
}

function performBylawSearch(query) {
  const container = document.getElementById('bylaw-results-container');
  if (!query.trim()) {
    container.innerHTML = '';
    return;
  }

  const results = searchBylaws(query, 25);

  if (results.length === 0) {
    container.innerHTML = `
      <div class="card text-center" style="padding:40px">
        <div style="font-size:2rem;margin-bottom:10px">🔍</div>
        <div style="font-size:0.9rem;color:var(--text-muted)">No results found for "<strong>${escHtml(query)}</strong>"</div>
        <div style="font-size:0.82rem;color:var(--text-muted);margin-top:8px">Try different keywords or broader search terms.</div>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div style="margin-bottom:12px;font-size:0.85rem;color:var(--text-muted)">
      Found <strong>${results.length}</strong> relevant sections for "<strong>${escHtml(query)}</strong>"
    </div>
    ${results.map(r => {
      const snippet = getSnippet(r.page.text, query, 400);
      return `
        <div class="bylaw-result">
          <div class="bylaw-result-page">
            📄 Page ${r.page.page}
            ${r.page.section ? ` — <span style="color:var(--primary)">${escHtml(r.page.section)}</span>` : ''}
            <span style="float:right;opacity:0.6;font-size:0.7rem">${r.source === 'lunr' ? '● Exact Match' : r.source === 'fuse' ? '● Fuzzy Match' : '● Keyword Match'}</span>
          </div>
          <div class="bylaw-result-text">${highlightText(snippet, query)}</div>
          <button class="btn btn-sm btn-outline mt-8" onclick="showFullPage(${r.page.page})">Show Full Page →</button>
        </div>
      `;
    }).join('')}
  `;
}

async function showFullPage(pageNum) {
  const page = bylawsPages.find(p => p.page === pageNum);
  if (!page) return;

  const q = document.getElementById('bylaw-search-input')?.value || '';

  showModal(`
    <div style="padding:0">
      <div style="background:var(--primary);color:#fff;padding:14px 20px;border-radius:6px 6px 0 0">
        <div style="font-weight:700">Page ${page.page}</div>
        ${page.section ? `<div style="font-size:0.8rem;opacity:0.75">${escHtml(page.section)}</div>` : ''}
      </div>
      <div style="padding:20px 24px">
        <div style="font-size:0.9rem;line-height:1.9;white-space:pre-wrap;background:#fffef8;padding:16px;border:1px solid var(--border);border-radius:6px">
          ${q ? highlightText(page.text, q) : escHtml(page.text)}
        </div>
        <div style="margin-top:12px;display:flex;gap:8px">
          ${pageNum > 1 ? `<button class="btn btn-sm btn-outline" onclick="showFullPage(${pageNum-1})">← Prev Page</button>` : ''}
          ${bylawsPages.find(p => p.page === pageNum+1) ? `<button class="btn btn-sm btn-outline" onclick="showFullPage(${pageNum+1})">Next Page →</button>` : ''}
        </div>
      </div>
    </div>
  `);
}
