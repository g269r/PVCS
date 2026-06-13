/* ============================================================
   Create Letter Page – PVCS DMS
   Structured 3-part recipient: Designation / Organization / Location
   ============================================================ */

let createLetterState = {
  sender:               'Secretary',
  // structured recipient parts
  recipientDesignation:  '',
  recipientOrganization: '',
  recipientLocation:     '',
  // derived display / ref string (kept for archive display)
  recipient:             '',
  letterType:            'General',
  subject:               '',
  purpose:               '',
  priority:              'Normal',
  letterDate:            todayISO(),
  refNumber:             '',
  did:                   '',
  draftEn:               '',
  draftHi:               '',
  templateId:            'general',
  editingDID:            null,
  createdAt:             null,
};

let recipientPanelHandle = null;

async function renderCreateLetter(prefill) {
  if (prefill) {
    Object.assign(createLetterState, prefill);
  } else {
    createLetterState = {
      sender: 'Secretary',
      recipientDesignation: '', recipientOrganization: '', recipientLocation: '',
      recipient: '',
      letterType: 'General', subject: '', purpose: '', priority: 'Normal',
      letterDate: todayISO(),
      refNumber: '', did: '', draftEn: '', draftHi: '',
      templateId: 'general', editingDID: null, createdAt: null,
    };
  }

  const container = document.getElementById('page-create-letter');
  container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;padding:40px"><div class="spinner"></div></div>`;

  container.innerHTML = `
    <div class="section-title">✍️ Create New Letter</div>

    <form id="letter-form" autocomplete="off">

      <!-- ── Card 1: Letter Details ─────────────────────────── -->
      <div class="card">
        <div class="card-header"><div class="card-title">Letter Details</div></div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Signed By <span class="req">*</span></label>
            <select class="form-control" id="f-sender">
              ${Object.keys(SENDER_MAP).map(k =>
                `<option value="${k}" ${createLetterState.sender === k ? 'selected' : ''}>
                  ${k} – ${SENDER_MAP[k].name}
                </option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Priority <span class="req">*</span></label>
            <select class="form-control" id="f-priority">
              ${['Normal','Important','Urgent','Confidential'].map(p =>
                `<option value="${p}" ${createLetterState.priority === p ? 'selected' : ''}>${p}</option>`
              ).join('')}
            </select>
          </div>
        </div>

        <!-- ── Structured Recipient ── -->
        <div class="form-group">
          <label class="form-label">Recipient <span class="req">*</span></label>
          <div id="recipient-panel-container"></div>
        </div>

        <!-- Quick-select common designations -->
        <div class="form-group" style="margin-top:-8px">
          <div class="form-hint" style="margin-bottom:6px">Quick select:</div>
          <div class="recipient-list" id="quick-recipients">
            ${[
              { d:'District Cooperative Officer', o:'',  l:'Patna' },
              { d:'Block Cooperative Officer',    o:'',  l:'Patna' },
              { d:'Registrar Cooperative Societies', o:'Cooperative Department Bihar', l:'Patna' },
              { d:'District Magistrate',          o:'Patna District Government', l:'Patna' },
              { d:'Chief Executive Officer',      o:'',  l:'Patna' },
            ].map(r =>
              `<span class="recipient-tag"
                onclick="setRecipientQuick('${escHtml(r.d)}','${escHtml(r.o)}','${escHtml(r.l)}')"
              >${r.d.replace(/\w+/g, w => w[0].toUpperCase()+w.slice(1).toLowerCase()).split(' ').map((w,i)=>i<2?w:'').filter(Boolean).join(' ')}…
              </span>`
            ).join('')}
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Letter Type <span class="req">*</span></label>
            <select class="form-control" id="f-type">
              ${Object.keys(TYPE_CODE_MAP).map(t =>
                `<option value="${t}" ${createLetterState.letterType === t ? 'selected' : ''}>${t}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Letter Date <span class="req">*</span></label>
            <input type="date" class="form-control" id="f-date" value="${createLetterState.letterDate}" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Subject <span class="req">*</span></label>
          <input type="text" class="form-control" id="f-subject"
            placeholder="e.g. Request for land allocation for Hyper Bazaar..."
            value="${escHtml(createLetterState.subject)}" />
        </div>

        <div class="form-group">
          <label class="form-label">Purpose / Details</label>
          <textarea class="form-control" id="f-purpose" rows="4"
            placeholder="Describe the purpose and key details of the letter...">${escHtml(createLetterState.purpose)}</textarea>
          <div class="form-hint">This text will be inserted into the letter body automatically.</div>
        </div>
      </div>

      <!-- ── Card 2: Reference Number ───────────────────────── -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Reference Number &amp; Document ID</div>
          <button type="button" class="btn btn-sm btn-outline" id="btn-gen-ref">🔄 Generate / Refresh</button>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Reference Number</label>
            <div class="ref-display">
              <span id="ref-display-text">${escHtml(createLetterState.refNumber || 'Click Generate →')}</span>
              <button type="button" class="btn btn-sm btn-outline" id="btn-edit-ref">✏️ Edit</button>
            </div>
            <input type="text" class="form-control hidden mt-8" id="f-ref-manual"
              placeholder="Manual override – format: YYYY/SENDER-PVCS/MM/RECIPIENT/DD/TYPE/SERIAL"
              value="${escHtml(createLetterState.refNumber)}" />
            <div class="form-hint">Auto-format: <code>YYYY/SENDER-PVCS/MM/DCO-PATNA/DD/REQ/001</code></div>
          </div>
          <div class="form-group">
            <label class="form-label">Permanent Document ID (DID)</label>
            <div class="did-display" id="did-display-text">${escHtml(createLetterState.did || 'Auto-generated on save')}</div>
            <div class="form-hint">PVCS-YYYY-000001-PS format. Permanent, never reused.</div>
          </div>
        </div>
      </div>

      <!-- ── Card 3: Template Selector ───────────────────────── -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Letter Template</div>
          <button type="button" class="btn btn-sm btn-primary" id="btn-gen-draft">⚡ Generate Draft</button>
        </div>
        <div class="template-grid" id="template-selector">
          ${TEMPLATES.map(t => `
            <div class="template-card" data-tid="${t.id}" onclick="selectTemplate('${t.id}')">
              <div class="template-card-icon">${t.icon}</div>
              <div class="template-card-name">${t.name}</div>
              <div class="template-card-desc">${t.desc}</div>
            </div>`).join('')}
        </div>
      </div>

      <!-- ── Card 4: Draft Editor ────────────────────────────── -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Letter Draft – Bilingual Editor</div>
          <div style="display:flex;gap:8px">
            <button type="button" class="btn btn-sm btn-outline" onclick="swapDrafts()">⇄ Swap</button>
            <button type="button" class="btn btn-sm btn-outline" onclick="clearDrafts()">🗑 Clear</button>
          </div>
        </div>
        <div class="draft-grid">
          <div class="draft-panel">
            <div class="draft-panel-header">
              <span>🇬🇧 English Draft</span>
              <button type="button" class="btn btn-sm"
                style="background:rgba(255,255,255,0.15);color:#fff;border:none"
                onclick="copyDraft('en')">Copy</button>
            </div>
            <textarea class="draft-editor" id="draft-en"
              placeholder="English letter content appears here after generating draft...">${escHtml(createLetterState.draftEn)}</textarea>
          </div>
          <div class="draft-panel hindi">
            <div class="draft-panel-header">
              <span>🇮🇳 Hindi Draft (हिंदी प्रारूप)</span>
              <button type="button" class="btn btn-sm"
                style="background:rgba(255,255,255,0.15);color:#fff;border:none"
                onclick="copyDraft('hi')">Copy</button>
            </div>
            <textarea class="draft-editor hindi-editor" id="draft-hi"
              placeholder="हिंदी पत्र सामग्री यहाँ दिखाई देगी...">${escHtml(createLetterState.draftHi)}</textarea>
          </div>
        </div>
      </div>

      <!-- ── Sticky Action Bar ────────────────────────────────── -->
      <div class="action-bar">
        <button type="button" class="btn btn-primary btn-lg" id="btn-save-letter">💾 Save to Archive</button>
        <button type="button" class="btn btn-outline" id="btn-preview-letter">👁 Preview</button>
        <button type="button" class="btn btn-outline" onclick="navigateTo('archive')">← Back to Archive</button>
      </div>
    </form>
  `;

  // ── Build structured recipient panel ──
  const panelContainer = document.getElementById('recipient-panel-container');
  recipientPanelHandle = await buildRecipientPanel(panelContainer, {
    designation:  createLetterState.recipientDesignation,
    organization: createLetterState.recipientOrganization,
    location:     createLetterState.recipientLocation,
  });

  // ── Highlight active template ──
  highlightTemplate(createLetterState.templateId);

  // ── Auto-select best template on type change ──
  document.getElementById('f-type').addEventListener('change', (e) => {
    const best = getBestTemplate(e.target.value);
    if (best) selectTemplate(best.id, false);
  });

  // ── Ref number ──
  document.getElementById('btn-gen-ref').addEventListener('click', genRef);
  document.getElementById('btn-edit-ref').addEventListener('click', () => {
    const inp = document.getElementById('f-ref-manual');
    inp.classList.toggle('hidden');
    if (!inp.classList.contains('hidden')) inp.focus();
  });
  document.getElementById('f-ref-manual').addEventListener('input', (e) => {
    createLetterState.refNumber = e.target.value;
    document.getElementById('ref-display-text').textContent = e.target.value || '…';
  });

  // ── Draft / Save / Preview ──
  document.getElementById('btn-gen-draft').addEventListener('click', genDraft);
  document.getElementById('btn-save-letter').addEventListener('click', saveLetter);
  document.getElementById('btn-preview-letter').addEventListener('click', previewLetter);

  // ── Restore ref display if editing ──
  if (createLetterState.editingDID && createLetterState.refNumber) {
    document.getElementById('ref-display-text').textContent = createLetterState.refNumber;
  }
}

// ── Quick-select a pre-set recipient ──
async function setRecipientQuick(designation, organization, location) {
  createLetterState.recipientDesignation  = designation;
  createLetterState.recipientOrganization = organization;
  createLetterState.recipientLocation     = location;

  // Re-render just the recipient panel
  const panelContainer = document.getElementById('recipient-panel-container');
  if (panelContainer) {
    recipientPanelHandle = await buildRecipientPanel(panelContainer, { designation, organization, location });
  }
  showToast(`Recipient: ${designation}`, 'info', 1500);
}

// ── Template selection ──
function highlightTemplate(id) {
  document.querySelectorAll('.template-card').forEach(c => {
    const active = c.dataset.tid === id;
    c.style.borderColor = active ? 'var(--primary)' : '';
    c.style.background  = active ? 'rgba(26,58,92,0.06)' : '';
    c.style.boxShadow   = active ? '0 4px 12px rgba(26,58,92,0.14)' : '';
  });
}

function selectTemplate(id, updateTypeSelect = true) {
  createLetterState.templateId = id;
  highlightTemplate(id);
  const tmpl = getTemplate(id);
  if (tmpl && updateTypeSelect) {
    const sel = document.getElementById('f-type');
    if (sel) { sel.value = tmpl.type; createLetterState.letterType = tmpl.type; }
  }
}

// ── Read current recipient values from the panel ──
function getRecipientValues() {
  if (!recipientPanelHandle) return { designation:'', organization:'', location:'', displayString:'' };
  return recipientPanelHandle.getValue();
}

// ── Generate reference number ──
async function genRef() {
  const sender   = document.getElementById('f-sender').value;
  const type     = document.getElementById('f-type').value;
  const date     = document.getElementById('f-date').value;
  const rv       = getRecipientValues();

  if (!sender || !rv.designation || !rv.location || !type || !date) {
    showToast('Fill in Sender, Designation, Location, Type and Date first', 'warning');
    return;
  }

  const ref = await generateRefNumber(sender, rv.designation, rv.organization, rv.location, type, date);
  createLetterState.refNumber = ref;
  document.getElementById('ref-display-text').textContent = ref;
  document.getElementById('f-ref-manual').value = ref;
  showToast('Reference number generated', 'success', 1500);
}

// ── Generate letter drafts ──
async function genDraft() {
  const sender  = document.getElementById('f-sender').value;
  const subject = document.getElementById('f-subject').value.trim();
  const purpose = document.getElementById('f-purpose').value.trim();
  const date    = document.getElementById('f-date').value;
  const rv      = getRecipientValues();

  if (!rv.designation) { showToast('Please enter a recipient designation', 'warning'); return; }
  if (!subject)        { showToast('Please enter a subject', 'warning'); return; }

  if (!createLetterState.refNumber) await genRef();

  const ref        = createLetterState.refNumber || 'PVCS/REF';
  const senderInfo = SENDER_MAP[sender] || { name: sender, title: sender };
  const recipient  = rv.displayString || rv.designation;

  const drafts = generateLetterDrafts(createLetterState.templateId || 'general', {
    ref, date, recipient, subject, purpose, senderInfo,
  });

  document.getElementById('draft-en').value = drafts.en;
  document.getElementById('draft-hi').value = drafts.hi;

  Object.assign(createLetterState, {
    draftEn: drafts.en, draftHi: drafts.hi,
    subject, purpose, sender,
    recipient,
    recipientDesignation:  rv.designation,
    recipientOrganization: rv.organization,
    recipientLocation:     rv.location,
  });

  showToast('Draft generated', 'success');
}

// ── Save letter to archive ──
async function saveLetter() {
  const sender   = document.getElementById('f-sender').value;
  const type     = document.getElementById('f-type').value;
  const subject  = document.getElementById('f-subject').value.trim();
  const purpose  = document.getElementById('f-purpose').value.trim();
  const priority = document.getElementById('f-priority').value;
  const date     = document.getElementById('f-date').value;
  const draftEn  = document.getElementById('draft-en').value;
  const draftHi  = document.getElementById('draft-hi').value;
  const manualRef= document.getElementById('f-ref-manual').value.trim();
  const rv       = getRecipientValues();

  // ── Validation ──
  if (!sender)          { showToast('Please select a sender', 'warning'); return; }
  if (!rv.designation)  { showToast('Please enter a recipient designation', 'warning'); return; }
  if (!rv.location)     { showToast('Please enter a recipient location', 'warning'); return; }
  if (!subject)         { showToast('Please enter a subject', 'warning'); return; }
  if (!draftEn.trim())  { showToast('Please generate or write the English draft', 'warning'); return; }

  // ── Ref number ──
  let ref = manualRef || createLetterState.refNumber;
  if (!ref) {
    ref = await generateRefNumber(sender, rv.designation, rv.organization, rv.location, type, date);
  }

  const btn = document.getElementById('btn-save-letter');
  btn.disabled = true; btn.textContent = 'Saving…';

  try {
    // ── DID ──
    let did = createLetterState.editingDID || createLetterState.did;
    if (!did) did = await generateDID(date);

    const senderInfo = SENDER_MAP[sender] || { name: sender, title: sender };
    const displayRecipient = rv.displayString || rv.designation;
    const now = new Date().toISOString();

    const letter = {
      did,
      refNumber:             ref,
      letterDate:            date,
      sender,
      senderName:            senderInfo.name,
      senderTitle:           senderInfo.title,
      // structured recipient
      recipientDesignation:  rv.designation,
      recipientOrganization: rv.organization,
      recipientLocation:     rv.location,
      recipient:             displayRecipient,   // human-readable for display / archive
      letterType:            type,
      subject,
      purpose,
      priority,
      draftEn,
      draftHi,
      templateId:            createLetterState.templateId,
      yearMonth:             yearMonth(date),
      createdAt:             createLetterState.editingDID
                               ? (createLetterState.createdAt || now)
                               : now,
      updatedAt:             now,
    };

    await Letters.save(letter);

    // ── Auto-persist new recipient parts to master lists ──
    await RecipientMaster.persistFromLetter(rv.designation, rv.organization, rv.location);

    showToast(`Letter saved! DID: ${did}`, 'success');

    setTimeout(() => {
      createLetterState = {
        sender: 'Secretary',
        recipientDesignation: '', recipientOrganization: '', recipientLocation: '',
        recipient: '',
        letterType: 'General', subject: '', purpose: '', priority: 'Normal',
        letterDate: todayISO(),
        refNumber: '', did: '', draftEn: '', draftHi: '',
        templateId: 'general', editingDID: null, createdAt: null,
      };
      navigateTo('archive');
    }, 800);

  } catch (err) {
    console.error(err);
    showToast('Save failed: ' + err.message, 'error');
    btn.disabled = false; btn.textContent = '💾 Save to Archive';
  }
}

// ── Preview letter ──
function previewLetter() {
  const draftEn  = document.getElementById('draft-en').value;
  const draftHi  = document.getElementById('draft-hi').value;
  const subject  = document.getElementById('f-subject').value;
  const rv       = getRecipientValues();
  const ref      = createLetterState.refNumber || '(Not Generated)';
  const date     = document.getElementById('f-date').value;
  const display  = rv.displayString || rv.designation || '(Recipient)';

  showModal(`
    <div class="letter-view-header">
      <div>
        <div style="font-size:0.8rem;opacity:0.7">Preview – Not Yet Saved</div>
        <div style="font-weight:700">${escHtml(subject || '(No Subject)')}</div>
        <div style="font-size:0.8rem;opacity:0.75;margin-top:2px">${escHtml(ref)}</div>
      </div>
    </div>
    <div class="letter-view-body">
      <div style="border:2px solid var(--primary);padding:24px 32px;margin-bottom:16px;background:#fff;">
        <div style="border-bottom:3px double var(--primary);padding-bottom:10px;margin-bottom:14px">
          <div class="hindi" style="font-size:1rem;font-weight:800;color:var(--primary)">पटना सदर प्रखंड प्राथमिक सब्जी उत्पादक सहकारी समिति लिमिटेड</div>
          <div style="font-size:0.82rem;font-weight:700;color:var(--primary-light)">PATNA SADAR BLOCK PRIMARY VEGETABLES GROWERS COOPERATIVE SOCIETY LIMITED</div>
          <div style="font-size:0.75rem;color:var(--text-muted)">E-8, Chitrakut Vihar Colony, Bhagwat Nagar, Patna Sadar, Patna – 800026 | Reg. No.: 26/HQR/2018</div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:12px">
          <span><strong>Ref:</strong> ${escHtml(ref)}</span>
          <span><strong>Date:</strong> ${formatDate(date)}</span>
        </div>
        <div style="font-size:0.88rem;margin-bottom:10px;line-height:1.7">
          <strong>To,</strong><br>
          <span style="white-space:pre-line">${escHtml(display)}</span>
        </div>
        <div style="background:#f0f4f8;padding:6px 10px;font-weight:600;font-size:0.88rem;margin-bottom:10px">
          Subject: ${escHtml(subject)}
        </div>
        <div style="font-size:0.88rem;white-space:pre-wrap;line-height:1.85">${escHtml(draftEn)}</div>
      </div>
      ${draftHi ? `
        <div style="border:2px solid #7b341e;padding:24px 32px;background:#fff;">
          <div style="font-size:0.82rem;font-weight:700;color:#7b341e;margin-bottom:10px">🇮🇳 हिंदी प्रारूप</div>
          <div class="hindi" style="font-size:0.88rem;white-space:pre-wrap;line-height:1.85">${escHtml(draftHi)}</div>
        </div>
      ` : ''}
    </div>
  `);
}

// ── Utility functions for draft editor ──
function swapDrafts() {
  const en = document.getElementById('draft-en');
  const hi = document.getElementById('draft-hi');
  const tmp = en.value; en.value = hi.value; hi.value = tmp;
}

function clearDrafts() {
  document.getElementById('draft-en').value = '';
  document.getElementById('draft-hi').value = '';
  showToast('Drafts cleared', 'info', 1500);
}

function copyDraft(lang) {
  const el = document.getElementById(`draft-${lang}`);
  if (!el) return;
  navigator.clipboard.writeText(el.value).then(() => showToast('Copied to clipboard', 'success', 1500));
}
