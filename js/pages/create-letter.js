/* ============================================================
   Create Letter Page – PVCS DMS
   ============================================================ */

let createLetterState = {
  sender: 'Secretary',
  recipient: '',
  letterType: 'General',
  subject: '',
  purpose: '',
  priority: 'Normal',
  letterDate: todayISO(),
  refNumber: '',
  did: '',
  draftEn: '',
  draftHi: '',
  templateId: 'general',
  editingDID: null,
};

let recipientDropdown = null;

async function renderCreateLetter(prefill) {
  if (prefill) Object.assign(createLetterState, prefill);
  else createLetterState = {
    sender: 'Secretary', recipient: '', letterType: 'General',
    subject: '', purpose: '', priority: 'Normal', letterDate: todayISO(),
    refNumber: '', did: '', draftEn: '', draftHi: '',
    templateId: 'general', editingDID: null,
  };

  const container = document.getElementById('page-create-letter');
  const allRecipients = await Recipients.getAll();

  container.innerHTML = `
    <div class="section-title">✍️ Create New Letter</div>

    <form id="letter-form" autocomplete="off">
      <!-- Row 1: Sender + Priority -->
      <div class="card">
        <div class="card-header"><div class="card-title">Letter Details</div></div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Signed By <span class="req">*</span></label>
            <select class="form-control" id="f-sender">
              ${Object.keys(SENDER_MAP).map(k => `<option value="${k}" ${createLetterState.sender===k?'selected':''}>${k} – ${SENDER_MAP[k].name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Priority <span class="req">*</span></label>
            <select class="form-control" id="f-priority">
              ${['Normal','Important','Urgent','Confidential'].map(p => `<option value="${p}" ${createLetterState.priority===p?'selected':''}>${p}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Recipient <span class="req">*</span></label>
            <div id="recipient-dropdown-container"></div>
            <div class="recipient-list" id="quick-recipients">
              ${['DCO Patna','BCO Patna','Registrar Cooperative Societies','District Magistrate, Patna','Bihar Government'].map(r =>
                `<span class="recipient-tag" onclick="setRecipientQuick('${r}')">${r}</span>`
              ).join('')}
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Letter Type <span class="req">*</span></label>
            <select class="form-control" id="f-type">
              ${Object.keys(TYPE_CODE_MAP).map(t => `<option value="${t}" ${createLetterState.letterType===t?'selected':''}>${t}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Letter Date <span class="req">*</span></label>
            <input type="date" class="form-control" id="f-date" value="${createLetterState.letterDate}" />
          </div>
          <div class="form-group">
            <label class="form-label">Subject <span class="req">*</span></label>
            <input type="text" class="form-control" id="f-subject" placeholder="e.g. Request for land allocation for Hyper Bazaar..." value="${escHtml(createLetterState.subject)}" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Purpose / Details</label>
          <textarea class="form-control" id="f-purpose" rows="4" placeholder="Describe the purpose and key details of the letter...">${escHtml(createLetterState.purpose)}</textarea>
          <div class="form-hint">This text will be inserted into the letter body.</div>
        </div>
      </div>

      <!-- Reference Number -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Reference Number & Document ID</div>
          <button type="button" class="btn btn-sm btn-outline" id="btn-gen-ref">🔄 Regenerate</button>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Reference Number</label>
            <div class="ref-display">
              <span id="ref-display-text">${escHtml(createLetterState.refNumber || 'Click Generate →')}</span>
              <button type="button" class="btn btn-sm btn-outline" id="btn-edit-ref">✏️ Edit</button>
            </div>
            <input type="text" class="form-control hidden mt-8" id="f-ref-manual" placeholder="Manual override..." value="${escHtml(createLetterState.refNumber)}" />
            <div class="form-hint">Format: YYYY/SENDER-PVCS/MM/RECIPIENT/DD/TYPE/SERIAL</div>
          </div>
          <div class="form-group">
            <label class="form-label">Permanent Document ID (DID)</label>
            <div class="did-display" id="did-display-text">${escHtml(createLetterState.did || 'Auto-generated on save')}</div>
            <div class="form-hint">PVCS-YYYY-000001-PS format. Never changes.</div>
          </div>
        </div>
      </div>

      <!-- Template Selector -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Letter Template</div>
          <button type="button" class="btn btn-sm btn-primary" id="btn-gen-draft">⚡ Generate Draft</button>
        </div>
        <div class="template-grid" id="template-selector">
          ${TEMPLATES.map(t => `
            <div class="template-card ${createLetterState.templateId===t.id?'active':''}" data-tid="${t.id}" onclick="selectTemplate('${t.id}')">
              <div class="template-card-icon">${t.icon}</div>
              <div class="template-card-name">${t.name}</div>
              <div class="template-card-desc">${t.desc}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Draft Editor -->
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
              <button type="button" class="btn btn-sm" style="background:rgba(255,255,255,0.15);color:#fff;border:none" onclick="copyDraft('en')">Copy</button>
            </div>
            <textarea class="draft-editor" id="draft-en" placeholder="English letter content will appear here after generating draft...">${escHtml(createLetterState.draftEn)}</textarea>
          </div>
          <div class="draft-panel hindi">
            <div class="draft-panel-header">
              <span>🇮🇳 Hindi Draft (हिंदी प्रारूप)</span>
              <button type="button" class="btn btn-sm" style="background:rgba(255,255,255,0.15);color:#fff;border:none" onclick="copyDraft('hi')">Copy</button>
            </div>
            <textarea class="draft-editor hindi-editor" id="draft-hi" placeholder="हिंदी पत्र सामग्री यहाँ दिखाई देगी...">${escHtml(createLetterState.draftHi)}</textarea>
          </div>
        </div>
      </div>

      <!-- Action Bar -->
      <div class="action-bar">
        <button type="button" class="btn btn-primary btn-lg" id="btn-save-letter">💾 Save to Archive</button>
        <button type="button" class="btn btn-outline" id="btn-preview-letter">👁 Preview</button>
        <button type="button" class="btn btn-outline" onclick="navigateTo('archive')">← Back to Archive</button>
      </div>
    </form>
  `;

  // Init recipient dropdown
  const rdContainer = document.getElementById('recipient-dropdown-container');
  recipientDropdown = buildSearchableDropdown(rdContainer, allRecipients, 'Search or type recipient name...', (val) => {
    createLetterState.recipient = val;
  }, createLetterState.recipient);

  // Auto-select template on type change
  document.getElementById('f-type').addEventListener('change', (e) => {
    const best = getBestTemplate(e.target.value);
    if (best) selectTemplate(best.id, false);
  });

  // Style active template card
  function highlightTemplate(id) {
    document.querySelectorAll('.template-card').forEach(c => {
      c.style.borderColor = c.dataset.tid === id ? 'var(--primary)' : '';
      c.style.background = c.dataset.tid === id ? 'rgba(26,58,92,0.05)' : '';
    });
  }
  highlightTemplate(createLetterState.templateId);

  // Generate ref
  document.getElementById('btn-gen-ref').addEventListener('click', genRef);
  document.getElementById('btn-edit-ref').addEventListener('click', () => {
    const inp = document.getElementById('f-ref-manual');
    inp.classList.toggle('hidden');
    if (!inp.classList.contains('hidden')) inp.focus();
  });

  document.getElementById('f-ref-manual').addEventListener('input', (e) => {
    createLetterState.refNumber = e.target.value;
    document.getElementById('ref-display-text').textContent = e.target.value;
  });

  // Generate draft
  document.getElementById('btn-gen-draft').addEventListener('click', genDraft);

  // Save
  document.getElementById('btn-save-letter').addEventListener('click', saveLetter);

  // Preview
  document.getElementById('btn-preview-letter').addEventListener('click', previewLetter);

  // Auto-generate ref if editing
  if (createLetterState.editingDID && createLetterState.refNumber) {
    document.getElementById('ref-display-text').textContent = createLetterState.refNumber;
  }
}

function setRecipientQuick(name) {
  createLetterState.recipient = name;
  const inp = document.querySelector('#recipient-dropdown-container .sd-input');
  if (inp) inp.value = name;
  showToast(`Recipient set: ${name}`, 'info', 1500);
}

function selectTemplate(id, updateTypeSelect = true) {
  createLetterState.templateId = id;
  document.querySelectorAll('.template-card').forEach(c => {
    c.style.borderColor = c.dataset.tid === id ? 'var(--primary)' : '';
    c.style.background = c.dataset.tid === id ? 'rgba(26,58,92,0.05)' : '';
    c.style.boxShadow = c.dataset.tid === id ? '0 4px 12px rgba(26,58,92,0.15)' : '';
  });
  const tmpl = getTemplate(id);
  if (tmpl && updateTypeSelect) {
    const sel = document.getElementById('f-type');
    if (sel) sel.value = tmpl.type;
    createLetterState.letterType = tmpl.type;
  }
}

async function genRef() {
  const sender = document.getElementById('f-sender').value;
  const recipient = recipientDropdown ? recipientDropdown.getValue() : createLetterState.recipient;
  const type = document.getElementById('f-type').value;
  const date = document.getElementById('f-date').value;

  if (!sender || !recipient || !type || !date) {
    showToast('Please fill Sender, Recipient, Type and Date first', 'warning');
    return;
  }

  const ref = await generateRefNumber(sender, recipient, type, date);
  createLetterState.refNumber = ref;
  document.getElementById('ref-display-text').textContent = ref;
  document.getElementById('f-ref-manual').value = ref;
  showToast('Reference number generated', 'success', 1500);
}

async function genDraft() {
  const sender = document.getElementById('f-sender').value;
  const recipient = recipientDropdown ? recipientDropdown.getValue() : createLetterState.recipient;
  const subject = document.getElementById('f-subject').value.trim();
  const purpose = document.getElementById('f-purpose').value.trim();
  const date = document.getElementById('f-date').value;
  const type = document.getElementById('f-type').value;

  if (!recipient) { showToast('Please select a recipient first', 'warning'); return; }
  if (!subject) { showToast('Please enter a subject', 'warning'); return; }

  // Generate ref if not already
  if (!createLetterState.refNumber) await genRef();

  const ref = createLetterState.refNumber || document.getElementById('f-ref-manual').value || 'PVCS/REF';
  const senderInfo = SENDER_MAP[sender] || { name: sender, title: sender };

  const templateId = createLetterState.templateId || 'general';
  const tmpl = getTemplate(templateId) || TEMPLATES[TEMPLATES.length - 1];

  const drafts = generateLetterDrafts(templateId, {
    ref, date, recipient, subject, purpose, senderInfo,
  });

  document.getElementById('draft-en').value = drafts.en;
  document.getElementById('draft-hi').value = drafts.hi;
  createLetterState.draftEn = drafts.en;
  createLetterState.draftHi = drafts.hi;
  createLetterState.subject = subject;
  createLetterState.purpose = purpose;
  createLetterState.sender = sender;
  createLetterState.recipient = recipient;

  showToast('Draft generated successfully', 'success');
}

async function saveLetter() {
  const sender = document.getElementById('f-sender').value;
  const recipient = recipientDropdown ? recipientDropdown.getValue() : createLetterState.recipient;
  const type = document.getElementById('f-type').value;
  const subject = document.getElementById('f-subject').value.trim();
  const purpose = document.getElementById('f-purpose').value.trim();
  const priority = document.getElementById('f-priority').value;
  const date = document.getElementById('f-date').value;
  const draftEn = document.getElementById('draft-en').value;
  const draftHi = document.getElementById('draft-hi').value;
  const manualRef = document.getElementById('f-ref-manual').value;

  // Validation
  if (!sender) { showToast('Please select a sender', 'warning'); return; }
  if (!recipient) { showToast('Please enter a recipient', 'warning'); return; }
  if (!subject) { showToast('Please enter a subject', 'warning'); return; }
  if (!draftEn.trim()) { showToast('Please generate or write the letter draft', 'warning'); return; }

  // Generate ref if missing
  let ref = manualRef || createLetterState.refNumber;
  if (!ref) {
    ref = await generateRefNumber(sender, recipient, type, date);
  }

  const btn = document.getElementById('btn-save-letter');
  btn.disabled = true; btn.textContent = 'Saving...';

  try {
    // Generate DID
    let did = createLetterState.editingDID || createLetterState.did;
    if (!did) {
      did = await generateDID(date);
    }

    const ym = yearMonth(date);
    const senderInfo = SENDER_MAP[sender] || { name: sender, title: sender };
    const now = new Date().toISOString();

    const letter = {
      did,
      refNumber: ref,
      letterDate: date,
      sender,
      senderName: senderInfo.name,
      senderTitle: senderInfo.title,
      recipient,
      letterType: type,
      subject,
      purpose,
      priority,
      draftEn,
      draftHi,
      templateId: createLetterState.templateId,
      yearMonth: ym,
      createdAt: createLetterState.editingDID ? (createLetterState.createdAt || now) : now,
      updatedAt: now,
    };

    await Letters.save(letter);
    showToast(`Letter saved! DID: ${did}`, 'success');

    // Reset form
    setTimeout(() => {
      createLetterState = {
        sender: 'Secretary', recipient: '', letterType: 'General',
        subject: '', purpose: '', priority: 'Normal', letterDate: todayISO(),
        refNumber: '', did: '', draftEn: '', draftHi: '',
        templateId: 'general', editingDID: null,
      };
      navigateTo('archive');
    }, 800);
  } catch (err) {
    console.error(err);
    showToast('Save failed: ' + err.message, 'error');
    btn.disabled = false; btn.textContent = '💾 Save to Archive';
  }
}

function previewLetter() {
  const draftEn = document.getElementById('draft-en').value;
  const draftHi = document.getElementById('draft-hi').value;
  const subject = document.getElementById('f-subject').value;
  const recipient = recipientDropdown ? recipientDropdown.getValue() : createLetterState.recipient;
  const ref = createLetterState.refNumber || '(Not Generated)';
  const date = document.getElementById('f-date').value;

  showModal(`
    <div class="letter-view-header">
      <div>
        <div style="font-size:0.8rem;opacity:0.7">Preview – Not Saved</div>
        <div style="font-weight:700">${escHtml(subject)}</div>
      </div>
    </div>
    <div class="letter-view-body">
      <div style="border:2px solid var(--primary);padding:24px 32px;margin-bottom:16px;background:#fff;">
        <div style="border-bottom:3px double var(--primary);padding-bottom:10px;margin-bottom:14px">
          <div class="hindi" style="font-size:1rem;font-weight:800;color:var(--primary)">पटना सदर प्रखंड प्राथमिक सब्जी उत्पादक सहकारी समिति लिमिटेड</div>
          <div style="font-size:0.82rem;font-weight:700;color:var(--primary-light)">PATNA SADAR BLOCK PRIMARY VEGETABLES GROWERS COOPERATIVE SOCIETY LIMITED</div>
          <div style="font-size:0.75rem;color:var(--text-muted)">E-8, Chitrakut Vihar Colony, Bhagwat Nagar, Patna Sadar, Patna – 800026 | Reg. No.: 26/HQR/2018</div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:10px">
          <span><strong>Ref:</strong> ${escHtml(ref)}</span>
          <span><strong>Date:</strong> ${formatDate(date)}</span>
        </div>
        <div class="letter-content" style="font-size:0.88rem;white-space:pre-wrap;line-height:1.8">${escHtml(draftEn)}</div>
      </div>
      ${draftHi ? `
        <div style="border:2px solid #7b341e;padding:24px 32px;background:#fff;">
          <div style="font-size:0.82rem;font-weight:700;color:#7b341e;margin-bottom:10px">हिंदी प्रारूप</div>
          <div class="letter-content hindi" style="font-size:0.88rem;white-space:pre-wrap;line-height:1.8">${escHtml(draftHi)}</div>
        </div>
      ` : ''}
    </div>
  `);
}

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
