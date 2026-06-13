/* ============================================================
   Settings Page – PVCS DMS
   Includes Recipient Management (Designations / Organizations / Locations)
   ============================================================ */

async function renderSettingsPage() {
  const container = document.getElementById('page-settings');

  const [defaultSender, defaultPriority, perPage, letterSuffix] = await Promise.all([
    Settings.get('defaultSender')  .then(v => v || 'Secretary'),
    Settings.get('defaultPriority').then(v => v || 'Normal'),
    Settings.get('perPage')        .then(v => v || '15'),
    Settings.get('letterSuffix')   .then(v => v || 'PS'),
  ]);

  container.innerHTML = `
    <div class="section-title">⚙️ Settings</div>

    <!-- ── General Settings ───────────────────────────────── -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
      <div class="card">
        <div class="card-header"><div class="card-title">Default Letter Settings</div></div>
        <div class="form-group">
          <label class="form-label">Default Sender</label>
          <select class="form-control" id="s-default-sender">
            ${Object.keys(SENDER_MAP).map(k =>
              `<option value="${k}" ${defaultSender===k?'selected':''}>${k}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Default Priority</label>
          <select class="form-control" id="s-default-priority">
            ${['Normal','Important','Urgent','Confidential'].map(p =>
              `<option value="${p}" ${defaultPriority===p?'selected':''}>${p}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Archive: Letters per page</label>
          <select class="form-control" id="s-per-page">
            ${['10','15','25','50'].map(n =>
              `<option value="${n}" ${perPage===n?'selected':''}>${n}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">DID Suffix</label>
          <input type="text" class="form-control" id="s-did-suffix"
            value="${escHtml(letterSuffix)}" maxlength="6" />
          <div class="form-hint">Used in Document ID: PVCS-YYYY-000001-<strong>${escHtml(letterSuffix)}</strong></div>
        </div>
        <button class="btn btn-primary" id="btn-save-settings">Save Settings</button>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">Society Details (Read-Only)</div></div>
        <div class="form-group">
          <label class="form-label">Society Name (English)</label>
          <div class="form-control" style="background:#f8f9fa;font-size:0.82rem;height:auto;padding:8px 12px">
            PATNA SADAR BLOCK PRIMARY VEGETABLES GROWERS COOPERATIVE SOCIETY LIMITED
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Society Name (Hindi)</label>
          <div class="form-control hindi" style="background:#f8f9fa;font-size:0.9rem;height:auto;padding:8px 12px">
            पटना सदर प्रखंड प्राथमिक सब्जी उत्पादक सहकारी समिति लिमिटेड
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Registration Number</label>
          <div class="form-control" style="background:#f8f9fa">26/HQR/2018</div>
        </div>
      </div>
    </div>

    <!-- ── Recipient Management ────────────────────────────── -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">📋 Recipient Management</div>
        <div style="font-size:0.8rem;color:var(--text-muted)">
          Abbreviations control how recipients appear in reference numbers
        </div>
      </div>

      <!-- Tabs -->
      <div style="display:flex;gap:0;border-bottom:2px solid var(--border);margin-bottom:16px">
        ${['Designations','Organizations','Locations'].map((tab, i) => `
          <button class="rec-tab ${i===0?'active':''}" data-tab="${tab.toLowerCase()}"
            style="padding:8px 20px;border:none;background:none;cursor:pointer;font-size:0.9rem;
            font-weight:600;color:${i===0?'var(--primary)':'var(--text-muted)'};
            border-bottom:3px solid ${i===0?'var(--primary)':'transparent'};margin-bottom:-2px">
            ${tab}
          </button>`).join('')}
      </div>

      <!-- Tab content panels -->
      <div id="rec-tab-designations"  class="rec-tab-panel"></div>
      <div id="rec-tab-organizations" class="rec-tab-panel hidden"></div>
      <div id="rec-tab-locations"     class="rec-tab-panel hidden"></div>
    </div>

    <!-- ── Office Bearers ─────────────────────────────────── -->
    <div class="card">
      <div class="card-header"><div class="card-title">Office Bearers (Read-Only)</div></div>
      <div class="table-container">
        <table>
          <thead>
            <tr><th>Role</th><th>Name</th><th>Ref Code</th></tr>
          </thead>
          <tbody>
            ${Object.entries(SENDER_MAP).map(([role, info]) => `
              <tr>
                <td>${escHtml(role)}</td>
                <td><strong>${escHtml(info.name)}</strong></td>
                <td><code style="background:#f0f4f8;padding:2px 8px;border-radius:4px;font-size:0.82rem">${escHtml(info.code)}</code></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── About ─────────────────────────────────────────── -->
    <div class="card">
      <div class="card-header"><div class="card-title">About This System</div></div>
      <div style="font-size:0.88rem;line-height:1.8;color:var(--text-muted)">
        <strong style="color:var(--primary)">PVCS Document Management System</strong> — Version 2.0 | Offline PWA<br/>
        All data is stored locally using IndexedDB. No server. No cloud. Works fully offline.<br/><br/>
        <strong>Stack:</strong> HTML5 · CSS3 · Vanilla JS · IndexedDB · PDF.js · Fuse.js · Lunr.js · pdf-lib · docx.js · QRCode.js · WebLLM<br/>
        <strong>Hosting:</strong> GitHub Pages (static only)
      </div>
    </div>
  `;

  // ── General settings save ──
  document.getElementById('btn-save-settings').addEventListener('click', async () => {
    await Promise.all([
      Settings.set('defaultSender',   document.getElementById('s-default-sender').value),
      Settings.set('defaultPriority', document.getElementById('s-default-priority').value),
      Settings.set('perPage',         document.getElementById('s-per-page').value),
      Settings.set('letterSuffix',    document.getElementById('s-did-suffix').value),
    ]);
    showToast('Settings saved', 'success');
  });

  // ── Recipient tabs ──
  document.querySelectorAll('.rec-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.rec-tab').forEach(b => {
        b.style.color = 'var(--text-muted)';
        b.style.borderBottomColor = 'transparent';
        b.classList.remove('active');
      });
      btn.style.color = 'var(--primary)';
      btn.style.borderBottomColor = 'var(--primary)';
      btn.classList.add('active');
      document.querySelectorAll('.rec-tab-panel').forEach(p => p.classList.add('hidden'));
      document.getElementById(`rec-tab-${btn.dataset.tab}`).classList.remove('hidden');
    });
  });

  // ── Load recipient panels ──
  await renderRecipientPanel('designations');
  await renderRecipientPanel('organizations');
  await renderRecipientPanel('locations');
}

// ── Render one recipient master list panel ──
async function renderRecipientPanel(type) {
  const panel = document.getElementById(`rec-tab-${type}`);
  if (!panel) return;

  const getList = {
    designations:  () => RecipientMaster.getDesignations(),
    organizations: () => RecipientMaster.getOrganizations(),
    locations:     () => RecipientMaster.getLocations(),
  }[type];

  const saveList = {
    designations:  (l) => RecipientMaster.saveDesignations(l),
    organizations: (l) => RecipientMaster.saveOrganizations(l),
    locations:     (l) => RecipientMaster.saveLocations(l),
  }[type];

  const list = await getList();
  const singular = { designations:'Designation', organizations:'Organization', locations:'Location' }[type];

  panel.innerHTML = `
    <!-- Add new entry -->
    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:flex-end">
      <div style="flex:3;min-width:160px">
        <label class="form-label" style="font-size:0.78rem">${singular} Name</label>
        <input type="text" class="form-control" id="rec-new-name-${type}"
          placeholder="e.g. ${type==='designations'?'Chief Engineer':type==='organizations'?'Bihar Cooperative Bank':'Gaya'}" />
      </div>
      <div style="flex:1;min-width:80px">
        <label class="form-label" style="font-size:0.78rem">Abbreviation</label>
        <input type="text" class="form-control" id="rec-new-abbr-${type}"
          placeholder="e.g. ${type==='designations'?'CE':type==='organizations'?'BCB':'GAYA'}"
          maxlength="8" style="text-transform:uppercase" />
      </div>
      <button class="btn btn-primary btn-sm" onclick="addRecipientEntry('${type}')">+ Add</button>
      <button class="btn btn-outline btn-sm" onclick="resetRecipientDefaults('${type}')">↺ Reset Defaults</button>
    </div>

    <!-- Search filter -->
    <input type="text" class="form-control" id="rec-filter-${type}"
      placeholder="Filter…" style="margin-bottom:10px;max-width:320px"
      oninput="filterRecipientTable('${type}')" />

    <!-- Table -->
    <div class="table-container">
      <table id="rec-table-${type}">
        <thead>
          <tr>
            <th style="width:40%">${singular} Name</th>
            <th style="width:20%">Abbreviation</th>
            <th style="width:25%">Used in Ref No. as</th>
            <th style="width:15%">Actions</th>
          </tr>
        </thead>
        <tbody id="rec-tbody-${type}">
          ${renderRecipientRows(list, type)}
        </tbody>
      </table>
    </div>
    <div style="font-size:0.78rem;color:var(--text-muted);margin-top:8px">${list.length} entries</div>
  `;
}

function renderRecipientRows(list, type) {
  if (!list.length) return `<tr><td colspan="4" class="table-empty">No entries yet.</td></tr>`;
  return list.map((entry, idx) => `
    <tr id="rec-row-${type}-${idx}">
      <td>
        <input type="text" class="form-control" style="font-size:0.85rem;padding:5px 8px"
          id="rec-name-${type}-${idx}" value="${escHtml(entry.name)}" />
      </td>
      <td>
        <input type="text" class="form-control" style="font-size:0.85rem;padding:5px 8px;text-transform:uppercase;width:90px"
          id="rec-abbr-${type}-${idx}" value="${escHtml(entry.abbr)}" maxlength="8" />
      </td>
      <td>
        <code style="font-size:0.8rem;background:#f0f4f8;padding:2px 8px;border-radius:4px">
          ${escHtml(entry.abbr)}
        </code>
      </td>
      <td>
        <div style="display:flex;gap:4px">
          <button class="btn btn-sm btn-primary" onclick="saveRecipientRow('${type}',${idx})">✓</button>
          <button class="btn btn-sm btn-danger"  onclick="deleteRecipientRow('${type}',${idx})">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterRecipientTable(type) {
  const q = document.getElementById(`rec-filter-${type}`)?.value.toLowerCase() || '';
  const rows = document.querySelectorAll(`#rec-tbody-${type} tr`);
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(q) ? '' : 'none';
  });
}

async function addRecipientEntry(type) {
  const nameInput = document.getElementById(`rec-new-name-${type}`);
  const abbrInput = document.getElementById(`rec-new-abbr-${type}`);
  const name = nameInput?.value.trim();
  const abbr = abbrInput?.value.trim().toUpperCase();

  if (!name) { showToast('Enter a name first', 'warning'); return; }

  const adder = {
    designations:  () => RecipientMaster.addDesignation(name, abbr),
    organizations: () => RecipientMaster.addOrganization(name, abbr),
    locations:     () => RecipientMaster.addLocation(name, abbr),
  }[type];

  await adder();
  if (nameInput) nameInput.value = '';
  if (abbrInput) abbrInput.value = '';
  await renderRecipientPanel(type);
  showToast(`Added: ${name}`, 'success', 2000);
}

async function saveRecipientRow(type, idx) {
  const name = document.getElementById(`rec-name-${type}-${idx}`)?.value.trim();
  const abbr = document.getElementById(`rec-abbr-${type}-${idx}`)?.value.trim().toUpperCase();
  if (!name || !abbr) { showToast('Name and abbreviation are required', 'warning'); return; }

  const getList = {
    designations:  () => RecipientMaster.getDesignations(),
    organizations: () => RecipientMaster.getOrganizations(),
    locations:     () => RecipientMaster.getLocations(),
  }[type];
  const saveList = {
    designations:  (l) => RecipientMaster.saveDesignations(l),
    organizations: (l) => RecipientMaster.saveOrganizations(l),
    locations:     (l) => RecipientMaster.saveLocations(l),
  }[type];

  const list = await getList();
  list[idx] = { name, abbr };
  await saveList(list);
  await renderRecipientPanel(type);
  showToast('Saved', 'success', 1500);
}

async function deleteRecipientRow(type, idx) {
  const ok = await confirmDialog('Delete this entry? It will be removed from future dropdowns and reference number generation.');
  if (!ok) return;

  const getList = {
    designations:  () => RecipientMaster.getDesignations(),
    organizations: () => RecipientMaster.getOrganizations(),
    locations:     () => RecipientMaster.getLocations(),
  }[type];
  const saveList = {
    designations:  (l) => RecipientMaster.saveDesignations(l),
    organizations: (l) => RecipientMaster.saveOrganizations(l),
    locations:     (l) => RecipientMaster.saveLocations(l),
  }[type];

  const list = await getList();
  list.splice(idx, 1);
  await saveList(list);
  await renderRecipientPanel(type);
  showToast('Deleted', 'info', 1500);
}

async function resetRecipientDefaults(type) {
  const ok = await confirmDialog(`Reset ${type} to factory defaults? All custom entries will be replaced.`);
  if (!ok) return;
  const defaults = {
    designations:  DEFAULT_DESIGNATIONS,
    organizations: DEFAULT_ORGANIZATIONS,
    locations:     DEFAULT_LOCATIONS,
  }[type];
  const saver = {
    designations:  (l) => RecipientMaster.saveDesignations(l),
    organizations: (l) => RecipientMaster.saveOrganizations(l),
    locations:     (l) => RecipientMaster.saveLocations(l),
  }[type];
  await saver([...defaults]);
  await renderRecipientPanel(type);
  showToast(`${type} reset to defaults`, 'success');
}
