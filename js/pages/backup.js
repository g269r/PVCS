/* ============================================================
   Backup & Restore Page – PVCS DMS
   ============================================================ */

async function renderBackupPage() {
  const container = document.getElementById('page-backup');
  const total = await Letters.countAll();
  const bylawsCount = await Bylaws.count();
  const lastBackup = await Settings.get('lastBackup');

  container.innerHTML = `
    <div class="section-title">💾 Backup & Restore</div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
      <!-- Export Section -->
      <div class="card">
        <div class="card-header"><div class="card-title">📤 Export Backup</div></div>
        <div style="background:#f0f7ef;border-radius:6px;padding:14px;margin-bottom:16px">
          <div style="font-size:0.85rem;color:var(--success);font-weight:700;margin-bottom:6px">Current Data</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.85rem">
            <div>📝 Letters: <strong>${total}</strong></div>
            <div>📖 Bylaw Pages: <strong>${bylawsCount}</strong></div>
          </div>
          ${lastBackup ? `<div style="font-size:0.75rem;color:var(--text-muted);margin-top:6px">Last backup: ${new Date(lastBackup).toLocaleString('en-IN')}</div>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <button class="btn btn-primary btn-lg" onclick="exportFullBackup()">
            💾 Export Full Backup (JSON)
          </button>
          <button class="btn btn-outline" onclick="exportLettersOnly()">
            📝 Export Letters Only (JSON)
          </button>
          <button class="btn btn-outline" onclick="exportCSV()">
            📊 Export Letter Register (CSV)
          </button>
        </div>
        <div style="margin-top:16px;padding:12px;background:#fff8e1;border-radius:6px;font-size:0.82rem;color:#856404">
          ℹ️ Backup includes all letters, bylaw index, counters, and settings. Store securely on your device or external storage.
        </div>
      </div>

      <!-- Import Section -->
      <div class="card">
        <div class="card-header"><div class="card-title">📥 Restore Backup</div></div>
        <div class="upload-zone" id="backup-drop-zone" onclick="document.getElementById('backup-file-input').click()">
          <div class="upload-icon">📂</div>
          <div style="font-weight:600;margin-bottom:6px">Click to upload backup file</div>
          <div style="font-size:0.8rem;color:var(--text-muted)">Accepts: .json backup files only</div>
        </div>
        <input type="file" id="backup-file-input" accept=".json" style="display:none" />
        <div style="margin-top:16px;padding:12px;background:#fde8e8;border-radius:6px;font-size:0.82rem;color:#c0392b">
          ⚠️ Restoring a backup will REPLACE all existing data. Ensure you have exported a current backup before restoring.
        </div>
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="card" style="border:1.5px solid var(--danger);margin-top:20px">
      <div class="card-header"><div class="card-title" style="color:var(--danger)">⚠️ Danger Zone</div></div>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <button class="btn btn-danger" onclick="clearAllLetters()">🗑 Delete All Letters</button>
        <button class="btn btn-danger" onclick="clearBylawsData()">🗑 Clear Bylaw Index</button>
        <button class="btn btn-danger" onclick="resetAllData()">💥 Reset All Data</button>
      </div>
      <div style="font-size:0.8rem;color:var(--text-muted);margin-top:10px">These actions are irreversible. Export a backup first.</div>
    </div>

    <!-- Data Integrity -->
    <div class="card">
      <div class="card-header"><div class="card-title">🔍 Data Integrity Check</div></div>
      <button class="btn btn-outline" onclick="runIntegrityCheck()">Run Check</button>
      <div id="integrity-results" style="margin-top:12px"></div>
    </div>
  `;

  bindBackupPage();
}

function bindBackupPage() {
  const fileInput = document.getElementById('backup-file-input');
  const dropZone = document.getElementById('backup-drop-zone');

  if (!fileInput || !dropZone) return;

  fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) processBackupFile(e.target.files[0]);
  });

  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.json'))) processBackupFile(file);
    else showToast('Please drop a .json backup file', 'warning');
  });
}

async function exportFullBackup() {
  try {
    showToast('Preparing backup...', 'info', 2000);
    const data = await Backup.exportAll();
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    downloadJSON(data, `PVCS-Backup-${ts}.json`);
    await Settings.set('lastBackup', new Date().toISOString());
    showToast('Full backup exported successfully', 'success');
  } catch (err) {
    showToast('Backup failed: ' + err.message, 'error');
  }
}

async function exportLettersOnly() {
  try {
    const letters = await Letters.getAll();
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    downloadJSON({ version: 1, letters, exportedAt: new Date().toISOString() }, `PVCS-Letters-${ts}.json`);
    showToast('Letters exported', 'success');
  } catch (err) {
    showToast('Export failed: ' + err.message, 'error');
  }
}

async function exportCSV() {
  try {
    const letters = await Letters.getAll();
    const headers = ['DID', 'Ref Number', 'Date', 'Sender', 'Sender Name', 'Recipient', 'Letter Type', 'Subject', 'Priority', 'Created At'];
    const rows = letters.map(l => [
      l.did, l.refNumber, l.letterDate, l.sender, l.senderName || '',
      l.recipient, l.letterType, l.subject, l.priority,
      l.createdAt ? new Date(l.createdAt).toLocaleString('en-IN') : '',
    ].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','));

    const csv = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 10);
    downloadBlob(blob, `PVCS-Letter-Register-${ts}.csv`);
    showToast('CSV register exported', 'success');
  } catch (err) {
    showToast('CSV export failed: ' + err.message, 'error');
  }
}

async function processBackupFile(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!data.version || !data.society) {
      showToast('Invalid backup file format', 'error');
      return;
    }

    const ok = await confirmDialog(`This will restore backup from ${new Date(data.exportedAt).toLocaleString('en-IN')} containing ${data.letters?.length || 0} letters. ALL current data will be replaced. Continue?`);
    if (!ok) return;

    showToast('Restoring backup...', 'info', 3000);
    await Backup.importAll(data);
    showToast('Backup restored successfully! Refreshing...', 'success');
    setTimeout(() => { window.location.reload(); }, 1500);
  } catch (err) {
    console.error(err);
    showToast('Restore failed: ' + err.message, 'error');
  }
}

async function clearAllLetters() {
  const ok = await confirmDialog('Delete ALL letters permanently? This cannot be undone. Export a backup first.');
  if (!ok) return;
  await dbClear(STORES.LETTERS);
  await dbClear(STORES.COUNTERS);
  showToast('All letters deleted', 'warning');
  renderBackupPage();
}

async function clearBylawsData() {
  const ok = await confirmDialog('Clear the bylaw search index? You can re-upload the PDF to rebuild it.');
  if (!ok) return;
  await dbClear(STORES.BYLAWS_PAGES);
  bylawsLoaded = false;
  bylawsIndex = null;
  bylawsFuse = null;
  bylawsPages = [];
  showToast('Bylaw index cleared', 'warning');
  renderBackupPage();
}

async function resetAllData() {
  const ok = await confirmDialog('RESET ALL DATA? This deletes every letter, bylaw index, and settings. This is completely irreversible.');
  if (!ok) return;
  const ok2 = await confirmDialog('Are you absolutely sure? Type "yes" in the prompt to confirm.');
  if (!ok2) return;
  const confirm2 = window.prompt('Type "RESET" to confirm complete data reset:');
  if (confirm2 !== 'RESET') { showToast('Reset cancelled', 'info'); return; }

  for (const store of Object.values(STORES)) {
    try { await dbClear(store); } catch(e) {}
  }
  showToast('All data reset. Refreshing...', 'warning');
  setTimeout(() => window.location.reload(), 1200);
}

async function runIntegrityCheck() {
  const container = document.getElementById('integrity-results');
  container.innerHTML = '<div class="spinner"></div>';

  try {
    const letters = await Letters.getAll();
    const issues = [];
    const seen = new Set();

    for (const l of letters) {
      if (!l.did) issues.push(`Letter missing DID: ${l.refNumber || 'unknown'}`);
      if (!l.refNumber) issues.push(`Letter missing ref number: ${l.did || 'unknown'}`);
      if (!l.draftEn) issues.push(`Letter missing English draft: ${l.did}`);
      if (seen.has(l.did)) issues.push(`Duplicate DID: ${l.did}`);
      if (l.did) seen.add(l.did);
    }

    const bylawsC = await Bylaws.count();

    container.innerHTML = `
      <div style="padding:12px;background:${issues.length === 0 ? '#f0f7ef' : '#fff8f0'};border-radius:6px;border:1px solid ${issues.length === 0 ? '#c3e6c3' : '#ffcc88'}">
        <div style="font-weight:700;color:${issues.length === 0 ? 'var(--success)' : 'var(--warning)'}">
          ${issues.length === 0 ? '✅ All data is healthy' : `⚠️ ${issues.length} issue(s) found`}
        </div>
        <div style="font-size:0.82rem;margin-top:8px">
          Letters: ${letters.length} | Bylaw pages: ${bylawsC}
        </div>
        ${issues.length > 0 ? `<ul style="margin-top:10px;font-size:0.82rem;padding-left:16px">${issues.map(i => `<li style="margin-bottom:4px">${escHtml(i)}</li>`).join('')}</ul>` : ''}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div style="color:var(--danger)">Check failed: ${escHtml(err.message)}</div>`;
  }
}

// Expose STORES for clearing
const STORES = {
  LETTERS: 'letters',
  BYLAWS_PAGES: 'bylaws_pages',
  COUNTERS: 'counters',
  SETTINGS: 'settings',
  RECIPIENTS: 'recipients',
};

async function dbClear(store) {
  await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).clear();
    req.onsuccess = () => res();
    req.onerror = () => rej(req.error);
  });
}
