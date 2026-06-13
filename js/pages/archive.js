/* ============================================================
   Letter Archive Page – PVCS DMS
   ============================================================ */

let archiveState = {
  query: '',
  filterType: '',
  filterSender: '',
  filterPriority: '',
  filterYear: '',
  page: 1,
  perPage: 15,
  allLetters: [],
  filtered: [],
};

async function renderArchive() {
  const container = document.getElementById('page-archive');
  container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;padding:60px"><div class="spinner"></div></div>`;

  archiveState.allLetters = await Letters.getAll();
  archiveState.allLetters.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  archiveState.filtered = [...archiveState.allLetters];
  archiveState.page = 1;

  // Get unique years for filter
  const years = [...new Set(archiveState.allLetters.map(l => l.letterDate ? l.letterDate.slice(0,4) : '').filter(Boolean))].sort().reverse();

  container.innerHTML = `
    <div class="section-title">🗂️ Letter Archive</div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">Search & Filter</div>
        <button class="btn btn-sm btn-outline" id="btn-clear-filters">Clear Filters</button>
      </div>
      <div class="search-bar">
        <input type="text" class="form-control" id="archive-search" placeholder="Search by subject, ref no., recipient, keyword..." value="${escHtml(archiveState.query)}" style="flex:2;min-width:220px" />
        <select class="form-control" id="filter-type" style="min-width:130px">
          <option value="">All Types</option>
          ${Object.keys(TYPE_CODE_MAP).map(t => `<option value="${t}" ${archiveState.filterType===t?'selected':''}>${t}</option>`).join('')}
        </select>
        <select class="form-control" id="filter-sender" style="min-width:150px">
          <option value="">All Senders</option>
          ${Object.keys(SENDER_MAP).map(s => `<option value="${s}" ${archiveState.filterSender===s?'selected':''}>${s}</option>`).join('')}
        </select>
        <select class="form-control" id="filter-priority" style="min-width:120px">
          <option value="">All Priority</option>
          ${['Normal','Important','Urgent','Confidential'].map(p => `<option value="${p}" ${archiveState.filterPriority===p?'selected':''}>${p}</option>`).join('')}
        </select>
        <select class="form-control" id="filter-year" style="min-width:100px">
          <option value="">All Years</option>
          ${years.map(y => `<option value="${y}" ${archiveState.filterYear===y?'selected':''}>${y}</option>`).join('')}
        </select>
      </div>
      <div id="archive-results-info" class="text-muted" style="font-size:0.82rem;margin-bottom:8px"></div>
    </div>

    <div class="card" style="padding:0;overflow:hidden">
      <div class="table-container">
        <table id="archive-table">
          <thead>
            <tr>
              <th>DID / Ref No.</th>
              <th>Date</th>
              <th>Sender</th>
              <th>Recipient</th>
              <th>Subject</th>
              <th>Type</th>
              <th>Priority</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="archive-tbody"></tbody>
        </table>
      </div>
      <div id="archive-pagination" class="pagination" style="padding:12px"></div>
    </div>
  `;

  renderArchiveTable();
  bindArchiveFilters();
}

function bindArchiveFilters() {
  const search = document.getElementById('archive-search');
  const typeF = document.getElementById('filter-type');
  const senderF = document.getElementById('filter-sender');
  const priorityF = document.getElementById('filter-priority');
  const yearF = document.getElementById('filter-year');

  const doFilter = debounce(() => {
    archiveState.query = search.value;
    archiveState.filterType = typeF.value;
    archiveState.filterSender = senderF.value;
    archiveState.filterPriority = priorityF.value;
    archiveState.filterYear = yearF.value;
    archiveState.page = 1;
    applyArchiveFilters();
    renderArchiveTable();
  }, 250);

  search.addEventListener('input', doFilter);
  typeF.addEventListener('change', doFilter);
  senderF.addEventListener('change', doFilter);
  priorityF.addEventListener('change', doFilter);
  yearF.addEventListener('change', doFilter);

  document.getElementById('btn-clear-filters').addEventListener('click', () => {
    search.value = ''; typeF.value = ''; senderF.value = ''; priorityF.value = ''; yearF.value = '';
    Object.assign(archiveState, { query:'', filterType:'', filterSender:'', filterPriority:'', filterYear:'', page:1 });
    applyArchiveFilters(); renderArchiveTable();
  });
}

function applyArchiveFilters() {
  let letters = [...archiveState.allLetters];
  const q = archiveState.query.toLowerCase();

  if (q) {
    letters = letters.filter(l =>
      (l.subject && l.subject.toLowerCase().includes(q)) ||
      (l.refNumber && l.refNumber.toLowerCase().includes(q)) ||
      (l.did && l.did.toLowerCase().includes(q)) ||
      (l.recipient && l.recipient.toLowerCase().includes(q)) ||
      (l.sender && l.sender.toLowerCase().includes(q)) ||
      (l.draftEn && l.draftEn.toLowerCase().includes(q))
    );
  }

  if (archiveState.filterType) letters = letters.filter(l => l.letterType === archiveState.filterType);
  if (archiveState.filterSender) letters = letters.filter(l => l.sender === archiveState.filterSender);
  if (archiveState.filterPriority) letters = letters.filter(l => l.priority === archiveState.filterPriority);
  if (archiveState.filterYear) letters = letters.filter(l => l.letterDate && l.letterDate.startsWith(archiveState.filterYear));

  archiveState.filtered = letters;
}

function renderArchiveTable() {
  const tbody = document.getElementById('archive-tbody');
  const info = document.getElementById('archive-results-info');
  const pagination = document.getElementById('archive-pagination');

  const total = archiveState.filtered.length;
  const perPage = archiveState.perPage;
  const totalPages = Math.ceil(total / perPage);
  const start = (archiveState.page - 1) * perPage;
  const pageLetters = archiveState.filtered.slice(start, start + perPage);

  if (info) info.textContent = `Showing ${pageLetters.length} of ${total} letters`;

  if (pageLetters.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="table-empty">
      <div style="font-size:2rem;margin-bottom:8px">📭</div>
      ${archiveState.query || archiveState.filterType ? 'No letters match your search.' : 'No letters yet. <a href="#" onclick="navigateTo(\'create-letter\')">Create one</a>.'}
    </td></tr>`;
    if (pagination) pagination.innerHTML = '';
    return;
  }

  tbody.innerHTML = pageLetters.map(l => `
    <tr>
      <td>
        <div class="did-display" style="font-size:0.72rem">${escHtml(l.did || '')}</div>
        <div style="font-size:0.75rem;color:var(--text-muted);font-family:monospace;margin-top:3px">${escHtml(truncate(l.refNumber || '', 30))}</div>
      </td>
      <td style="white-space:nowrap">${formatDateShort(l.letterDate)}</td>
      <td>
        <div style="font-size:0.82rem;font-weight:600">${escHtml(l.sender || '')}</div>
        <div style="font-size:0.75rem;color:var(--text-muted)">${escHtml(SENDER_MAP[l.sender]?.name || '')}</div>
      </td>
      <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(l.recipient || '')}</td>
      <td style="max-width:200px">
        <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escHtml(l.subject || '')}">${escHtml(truncate(l.subject || '', 50))}</div>
        <div style="font-size:0.75rem;color:var(--text-muted)">${escHtml(l.letterType || '')}</div>
      </td>
      <td><span style="font-size:0.78rem">${escHtml(l.letterType || '')}</span></td>
      <td>${priorityBadge(l.priority)}</td>
      <td>
        <div style="display:flex;gap:4px;flex-wrap:nowrap">
          <button class="btn btn-sm btn-outline" onclick="viewLetter('${escHtml(l.did)}')">👁</button>
          <button class="btn btn-sm btn-outline" onclick="editLetter('${escHtml(l.did)}')">✏️</button>
          <button class="btn btn-sm btn-outline" onclick="archivePDFExport('${escHtml(l.did)}')">📄</button>
          <button class="btn btn-sm btn-danger" onclick="deleteLetter('${escHtml(l.did)}')">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');

  // Pagination
  if (pagination) {
    if (totalPages <= 1) { pagination.innerHTML = ''; return; }
    let pages = '';
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - archiveState.page) <= 2) {
        pages += `<button class="page-btn ${i === archiveState.page ? 'active' : ''}" onclick="goArchivePage(${i})">${i}</button>`;
      } else if (Math.abs(i - archiveState.page) === 3) {
        pages += `<span style="padding:0 4px;align-self:center">…</span>`;
      }
    }
    pagination.innerHTML = `
      <button class="page-btn" onclick="goArchivePage(${archiveState.page-1})" ${archiveState.page===1?'disabled':''}>‹</button>
      ${pages}
      <button class="page-btn" onclick="goArchivePage(${archiveState.page+1})" ${archiveState.page===totalPages?'disabled':''}>›</button>
    `;
  }
}

function goArchivePage(n) {
  const totalPages = Math.ceil(archiveState.filtered.length / archiveState.perPage);
  if (n < 1 || n > totalPages) return;
  archiveState.page = n;
  renderArchiveTable();
  document.getElementById('page-archive').scrollTo(0, 0);
}

async function viewLetter(did) {
  const letter = await Letters.get(did);
  if (!letter) { showToast('Letter not found', 'error'); return; }

  const senderInfo = SENDER_MAP[letter.sender] || { name: letter.sender || '', title: '' };

  // Generate QR
  const qrData = JSON.stringify({ did: letter.did, ref: letter.refNumber, subject: truncate(letter.subject, 40) });

  showModal(`
    <div class="letter-view-header">
      <div>
        <div style="font-size:0.8rem;opacity:0.7">${escHtml(letter.did)}</div>
        <div style="font-weight:700;font-size:1rem">${escHtml(letter.subject || '(No Subject)')}</div>
        <div style="font-size:0.8rem;opacity:0.75;margin-top:3px">${escHtml(letter.refNumber)}</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${priorityBadge(letter.priority)}
        <button class="btn btn-sm btn-accent" onclick="archivePDFExport('${did}')">📄 PDF</button>
        <button class="btn btn-sm btn-outline" style="color:#fff;border-color:rgba(255,255,255,0.5)" onclick="archiveDOCXExport('${did}')">📝 DOCX</button>
        <button class="btn btn-sm btn-outline" style="color:#fff;border-color:rgba(255,255,255,0.5)" onclick="archiveHTMLExport('${did}')">🌐 HTML</button>
        <button class="btn btn-sm btn-outline" style="color:#fff;border-color:rgba(255,255,255,0.5)" onclick="editLetter('${did}');hideModal()">✏️ Edit</button>
      </div>
    </div>
    <div class="letter-view-body">
      <!-- Metadata row -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:16px">
        <div><div class="form-label">Date</div><div style="font-size:0.9rem">${formatDate(letter.letterDate)}</div></div>
        <div><div class="form-label">Sender</div><div style="font-size:0.9rem;font-weight:600">${escHtml(letter.sender)}</div><div style="font-size:0.78rem;color:var(--text-muted)">${escHtml(senderInfo.name)}</div></div>
        <div><div class="form-label">Recipient</div><div style="font-size:0.9rem">${escHtml(letter.recipient)}</div></div>
        <div><div class="form-label">Type</div><div style="font-size:0.9rem">${escHtml(letter.letterType)}</div></div>
        <div><div class="form-label">Created</div><div style="font-size:0.82rem;color:var(--text-muted)">${new Date(letter.createdAt).toLocaleString('en-IN')}</div></div>
        <div>
          <div class="form-label">QR Code</div>
          <div id="qr-container" style="margin-top:4px"></div>
        </div>
      </div>

      <hr class="divider" />

      <!-- English Draft -->
      <div style="margin-bottom:20px">
        <div style="font-size:0.82rem;font-weight:700;color:var(--primary);margin-bottom:8px;display:flex;align-items:center;gap:8px">
          🇬🇧 ENGLISH DRAFT
        </div>
        <div class="letter-content" style="border:1px solid var(--border);border-radius:6px;padding:20px 24px;background:#fffef8;font-size:0.9rem;line-height:1.85;white-space:pre-wrap">${escHtml(letter.draftEn || '')}</div>
      </div>

      ${letter.draftHi ? `
        <div>
          <div style="font-size:0.82rem;font-weight:700;color:#7b341e;margin-bottom:8px">🇮🇳 HINDI DRAFT</div>
          <div class="letter-content hindi" style="border:1px solid #e8b090;border-radius:6px;padding:20px 24px;background:#fffdf8;font-size:0.9rem;line-height:1.85;white-space:pre-wrap">${escHtml(letter.draftHi)}</div>
        </div>
      ` : ''}

      <hr class="divider" />
      <div class="did-display" style="text-align:center">Document ID: ${escHtml(letter.did)} | ${escHtml(letter.refNumber)}</div>
    </div>
  `);

  // Render QR code
  setTimeout(() => {
    const qrEl = document.getElementById('qr-container');
    if (qrEl && window.QRCode) {
      try {
        new QRCode(qrEl, { text: qrData, width: 70, height: 70, colorDark: '#1a3a5c', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
      } catch(e) {}
    }
  }, 100);
}

async function editLetter(did) {
  const letter = await Letters.get(did);
  if (!letter) { showToast('Letter not found', 'error'); return; }
  Object.assign(createLetterState, {
    ...letter,
    // map structured fields (handle old letters that only have flat recipient)
    recipientDesignation:  letter.recipientDesignation  || letter.recipient || '',
    recipientOrganization: letter.recipientOrganization || '',
    recipientLocation:     letter.recipientLocation     || '',
    editingDID: did,
    createdAt: letter.createdAt,
  });
  navigateTo('create-letter');
}

async function deleteLetter(did) {
  const ok = await confirmDialog('Delete this letter permanently? This cannot be undone.');
  if (!ok) return;
  await Letters.delete(did);
  showToast('Letter deleted', 'info');
  await renderArchive();
}

async function archivePDFExport(did) {
  const letter = await Letters.get(did);
  if (!letter) return;
  showToast('Generating PDF...', 'info', 2000);
  await exportLetterToPDF(letter);
}

async function archiveDOCXExport(did) {
  const letter = await Letters.get(did);
  if (!letter) return;
  await exportLetterToDOCX(letter);
}

async function archiveHTMLExport(did) {
  const letter = await Letters.get(did);
  if (!letter) return;
  exportLetterToHTML(letter);
}
