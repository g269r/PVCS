/* ============================================================
   Settings Page – PVCS DMS
   ============================================================ */

async function renderSettingsPage() {
  const container = document.getElementById('page-settings');
  const defaultSender = await Settings.get('defaultSender') || 'Secretary';
  const defaultPriority = await Settings.get('defaultPriority') || 'Normal';
  const perPage = await Settings.get('perPage') || '15';
  const letterSuffix = await Settings.get('letterSuffix') || 'PS';

  container.innerHTML = `
    <div class="section-title">⚙️ Settings</div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
      <!-- Default Values -->
      <div class="card">
        <div class="card-header"><div class="card-title">Default Letter Settings</div></div>
        <div class="form-group">
          <label class="form-label">Default Sender</label>
          <select class="form-control" id="s-default-sender">
            ${Object.keys(SENDER_MAP).map(k => `<option value="${k}" ${defaultSender===k?'selected':''}>${k}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Default Priority</label>
          <select class="form-control" id="s-default-priority">
            ${['Normal','Important','Urgent','Confidential'].map(p => `<option value="${p}" ${defaultPriority===p?'selected':''}>${p}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Archive: Letters per page</label>
          <select class="form-control" id="s-per-page">
            ${['10','15','25','50'].map(n => `<option value="${n}" ${perPage===n?'selected':''}>${n}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">DID Suffix</label>
          <input type="text" class="form-control" id="s-did-suffix" value="${escHtml(letterSuffix)}" maxlength="6" />
          <div class="form-hint">Used in Document ID: PVCS-YYYY-000001-<strong>${escHtml(letterSuffix)}</strong></div>
        </div>
        <button class="btn btn-primary" id="btn-save-settings">Save Settings</button>
      </div>

      <!-- Society Info Display -->
      <div class="card">
        <div class="card-header"><div class="card-title">Society Details (Read-Only)</div></div>
        <div class="form-group">
          <label class="form-label">Society Name (English)</label>
          <div class="form-control" style="background:#f8f9fa;font-size:0.82rem">PATNA SADAR BLOCK PRIMARY VEGETABLES GROWERS COOPERATIVE SOCIETY LIMITED</div>
        </div>
        <div class="form-group">
          <label class="form-label">Society Name (Hindi)</label>
          <div class="form-control hindi" style="background:#f8f9fa;font-size:0.9rem">पटना सदर प्रखंड प्राथमिक सब्जी उत्पादक सहकारी समिति लिमिटेड</div>
        </div>
        <div class="form-group">
          <label class="form-label">Registered Office</label>
          <div class="form-control" style="background:#f8f9fa;font-size:0.82rem">E-8, Chitrakut Vihar Colony, Bhagwat Nagar, P.O. Bahadurpur Colony, Patna Sadar, Patna District, Bihar – 800026</div>
        </div>
        <div class="form-group">
          <label class="form-label">Registration Number</label>
          <div class="form-control" style="background:#f8f9fa">26/HQR/2018</div>
        </div>
      </div>
    </div>

    <!-- Office Bearers -->
    <div class="card">
      <div class="card-header"><div class="card-title">Office Bearers (Read-Only)</div></div>
      <div class="table-container">
        <table>
          <thead>
            <tr><th>Role</th><th>Name</th><th>Code (used in Ref No.)</th></tr>
          </thead>
          <tbody>
            ${Object.entries(SENDER_MAP).map(([role, info]) => `
              <tr>
                <td>${escHtml(role)}</td>
                <td><strong>${escHtml(info.name)}</strong></td>
                <td><code style="background:#f0f4f8;padding:2px 8px;border-radius:4px;font-size:0.82rem">${escHtml(info.code)}</code></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- About -->
    <div class="card">
      <div class="card-header"><div class="card-title">About This System</div></div>
      <div style="font-size:0.88rem;line-height:1.8;color:var(--text-muted)">
        <strong style="color:var(--primary)">PVCS Document Management System</strong><br/>
        Version 1.0 | Offline PWA<br/><br/>
        Operated exclusively by the society. All data is stored locally in your browser using IndexedDB.
        No data is sent to any server. Works fully offline.<br/><br/>
        <strong>Technology:</strong> HTML5, CSS3, JavaScript, IndexedDB, PDF.js, Fuse.js, Lunr.js, pdf-lib, docx.js, QRCode.js<br/>
        <strong>Hosting:</strong> GitHub Pages (static)<br/>
        <strong>Storage:</strong> Browser IndexedDB (local only)
      </div>
    </div>
  `;

  document.getElementById('btn-save-settings').addEventListener('click', async () => {
    await Settings.set('defaultSender', document.getElementById('s-default-sender').value);
    await Settings.set('defaultPriority', document.getElementById('s-default-priority').value);
    await Settings.set('perPage', document.getElementById('s-per-page').value);
    await Settings.set('didSuffix', document.getElementById('s-did-suffix').value);
    showToast('Settings saved', 'success');
  });
}
