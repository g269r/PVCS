/* ============================================================
   Create Letter Page – PVCS DMS
   WebLLM AI drafting + structured 3-part recipient
   ============================================================ */

let createLetterState = {
  sender:                'Secretary',
  recipientDesignation:  '',
  recipientOrganization: '',
  recipientLocation:     '',
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
  draftStyle:            'Government Official',
  editingDID:            null,
  createdAt:             null,
};

let recipientPanelHandle = null;
let aiGenerating = false;

// ── Draft styles ──
const DRAFT_STYLES = [
  'Government Official',
  'Cooperative Society',
  'Legal',
  'Business Formal',
  'Strong Representation',
  'Reminder / Follow-Up',
];

// ============================================================
// Page render
// ============================================================

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
      templateId: 'general', draftStyle: 'Government Official',
      editingDID: null, createdAt: null,
    };
  }

  const container = document.getElementById('page-create-letter');

  container.innerHTML = `
    <div class="section-title">✍️ Create New Letter</div>

    <!-- ── AI Status Banner ─────────────────────────────── -->
    <div id="ai-banner" class="ai-banner">
      <div class="ai-banner-left">
        <span id="ai-banner-icon">🤖</span>
        <div>
          <div id="ai-banner-title" style="font-weight:700;font-size:0.9rem">AI Drafting</div>
          <div id="ai-banner-sub" style="font-size:0.78rem;color:var(--text-muted)">Load a model to enable intelligent letter drafting</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <div id="ai-progress-wrap" class="hidden" style="min-width:160px">
          <div style="font-size:0.75rem;margin-bottom:3px" id="ai-progress-text">Loading…</div>
          <div class="progress-bar-outer"><div class="progress-bar-inner" id="ai-progress-bar"></div></div>
        </div>
        <button class="btn btn-sm btn-primary" id="btn-load-ai">⚡ Load AI Model</button>
        <button class="btn btn-sm btn-outline" id="btn-unload-ai" style="display:none">⏹ Unload</button>
      </div>
    </div>

    <form id="letter-form" autocomplete="off">

      <!-- ── Card 1: Letter Details ─────────────────────── -->
      <div class="card">
        <div class="card-header"><div class="card-title">Letter Details</div></div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Signed By <span class="req">*</span></label>
            <select class="form-control" id="f-sender">
              ${Object.keys(SENDER_MAP).map(k =>
                `<option value="${k}" ${createLetterState.sender===k?'selected':''}>${k} – ${SENDER_MAP[k].name}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Priority <span class="req">*</span></label>
            <select class="form-control" id="f-priority">
              ${['Normal','Important','Urgent','Confidential'].map(p =>
                `<option value="${p}" ${createLetterState.priority===p?'selected':''}>${p}</option>`
              ).join('')}
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Recipient <span class="req">*</span></label>
          <div id="recipient-panel-container"></div>
          <div class="recipient-list" style="margin-top:8px" id="quick-recipients">
            ${[
              {d:'District Cooperative Officer',    o:'',                            l:'Patna'},
              {d:'Block Cooperative Officer',       o:'',                            l:'Patna'},
              {d:'Registrar Cooperative Societies', o:'Cooperative Department Bihar',l:'Patna'},
              {d:'District Magistrate',             o:'Patna District Government',   l:'Patna'},
              {d:'Chief Executive Officer',         o:'',                            l:'Patna'},
            ].map(r =>
              `<span class="recipient-tag" onclick="setRecipientQuick('${escHtml(r.d)}','${escHtml(r.o)}','${escHtml(r.l)}')">
                ${r.d.split(' ').slice(0,2).join(' ')}…
              </span>`
            ).join('')}
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Letter Type <span class="req">*</span></label>
            <select class="form-control" id="f-type">
              ${Object.keys(TYPE_CODE_MAP).map(t =>
                `<option value="${t}" ${createLetterState.letterType===t?'selected':''}>${t}</option>`
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
            placeholder="e.g. Request for Land Allocation for Cold Storage Construction"
            value="${escHtml(createLetterState.subject)}" />
        </div>
      </div>

      <!-- ── Card 2: AI Drafting ─────────────────────────── -->
      <div class="card" id="ai-draft-card">
        <div class="card-header">
          <div class="card-title">🤖 AI Drafting</div>
          <div id="ai-mode-badge" class="badge badge-normal">Template Mode</div>
        </div>

        <!-- Draft Style -->
        <div class="form-row" style="margin-bottom:12px">
          <div class="form-group">
            <label class="form-label">Draft Style</label>
            <select class="form-control" id="f-draft-style">
              ${DRAFT_STYLES.map(s =>
                `<option value="${s}" ${createLetterState.draftStyle===s?'selected':''}>${s}</option>`
              ).join('')}
            </select>
            <div class="form-hint">Controls tone, structure, and language register</div>
          </div>
          <div class="form-group">
            <label class="form-label">Template (Fallback)</label>
            <select class="form-control" id="f-template-select">
              ${TEMPLATES.map(t =>
                `<option value="${t.id}" ${createLetterState.templateId===t.id?'selected':''}>
                  ${t.icon} ${t.name}
                </option>`
              ).join('')}
            </select>
            <div class="form-hint">Used if AI is unavailable</div>
          </div>
        </div>

        <!-- Facts / Instructions -->
        <div class="form-group">
          <label class="form-label">
            Facts &amp; Instructions
            <span style="font-size:0.75rem;font-weight:400;color:var(--text-muted);margin-left:8px">
              (AI transforms these into professional correspondence)
            </span>
          </label>
          <textarea class="form-control" id="f-purpose" rows="5"
            placeholder="Enter facts, notes, or instructions for the AI. Examples:
• Previous branch manager joined August 2025, performance unsatisfactory, services terminated, need replacement
• Request 10,000 sq ft land for Hyper Bazaar and Cold Storage, members will benefit, society registered since 2018
• Audit observations received, compliance report attached, request para dropping">${escHtml(createLetterState.purpose)}</textarea>
          <div class="form-hint">
            💡 Write bullet points or notes — the AI will convert them into formal paragraphs.
          </div>
        </div>

        <!-- Generate buttons -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <button type="button" class="btn btn-primary" id="btn-gen-both">
            ⚡ Generate English + Hindi
          </button>
          <button type="button" class="btn btn-outline" id="btn-gen-en-only">
            🇬🇧 English Only
          </button>
          <button type="button" class="btn btn-outline" id="btn-gen-hi-only">
            🇮🇳 Hindi Only
          </button>
          <span id="ai-generating-indicator" class="hidden" style="display:inline-flex;align-items:center;gap:6px;font-size:0.82rem;color:var(--primary)">
            <span class="spinner" style="width:16px;height:16px;border-width:2px"></span>
            <span id="ai-gen-status-text">Generating…</span>
          </span>
        </div>
      </div>

      <!-- ── Card 3: Reference Number ───────────────────── -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Reference Number &amp; Document ID</div>
          <button type="button" class="btn btn-sm btn-outline" id="btn-gen-ref">🔄 Generate</button>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Reference Number</label>
            <div class="ref-display">
              <span id="ref-display-text">${escHtml(createLetterState.refNumber || 'Click Generate →')}</span>
              <button type="button" class="btn btn-sm btn-outline" id="btn-edit-ref">✏️ Edit</button>
            </div>
            <input type="text" class="form-control hidden mt-8" id="f-ref-manual"
              placeholder="Manual: YYYY/SENDER-PVCS/MM/DCO-PATNA/DD/REQ/001"
              value="${escHtml(createLetterState.refNumber)}" />
          </div>
          <div class="form-group">
            <label class="form-label">Permanent Document ID (DID)</label>
            <div class="did-display" id="did-display-text">
              ${escHtml(createLetterState.did || 'Auto-generated on save')}
            </div>
            <div class="form-hint">PVCS-YYYY-000001-PS — permanent, never reused</div>
          </div>
        </div>
      </div>

      <!-- ── Card 4: Draft Editor ────────────────────────── -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Letter Draft – Bilingual Editor</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button type="button" class="btn btn-sm btn-outline" id="btn-improve-en"
              title="Improve English draft with AI">✨ Improve EN</button>
            <button type="button" class="btn btn-sm btn-outline" id="btn-improve-hi"
              title="Improve Hindi draft with AI">✨ Improve HI</button>
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
              placeholder="English draft will appear here…">${escHtml(createLetterState.draftEn)}</textarea>
          </div>
          <div class="draft-panel hindi">
            <div class="draft-panel-header">
              <span>🇮🇳 Hindi Draft (हिंदी प्रारूप)</span>
              <button type="button" class="btn btn-sm"
                style="background:rgba(255,255,255,0.15);color:#fff;border:none"
                onclick="copyDraft('hi')">Copy</button>
            </div>
            <textarea class="draft-editor hindi-editor" id="draft-hi"
              placeholder="हिंदी प्रारूप यहाँ दिखाई देगा…">${escHtml(createLetterState.draftHi)}</textarea>
          </div>
        </div>
        <!-- Streaming status -->
        <div id="draft-stream-status" class="hidden"
          style="padding:8px 12px;background:#f0f7ff;border-radius:0 0 6px 6px;font-size:0.8rem;color:var(--primary);border-top:1px solid var(--border)">
          <span class="spinner" style="width:14px;height:14px;border-width:2px;margin-right:6px"></span>
          <span id="draft-stream-text">AI is writing…</span>
        </div>
      </div>

      <!-- ── Sticky Action Bar ──────────────────────────────── -->
      <div class="action-bar">
        <button type="button" class="btn btn-primary btn-lg" id="btn-save-letter">💾 Save to Archive</button>
        <button type="button" class="btn btn-outline" id="btn-preview-letter">👁 Preview</button>
        <button type="button" class="btn btn-outline" onclick="navigateTo('archive')">← Back</button>
      </div>
    </form>
  `;

  // ── Recipient panel ──
  recipientPanelHandle = await buildRecipientPanel(
    document.getElementById('recipient-panel-container'), {
      designation:  createLetterState.recipientDesignation,
      organization: createLetterState.recipientOrganization,
      location:     createLetterState.recipientLocation,
    }
  );

  // ── Template card sync with select ──
  document.getElementById('f-template-select').addEventListener('change', (e) => {
    createLetterState.templateId = e.target.value;
    const tmpl = getTemplate(e.target.value);
    if (tmpl) {
      const sel = document.getElementById('f-type');
      if (sel) sel.value = tmpl.type;
    }
  });

  document.getElementById('f-type').addEventListener('change', (e) => {
    const best = getBestTemplate(e.target.value);
    if (best) {
      createLetterState.templateId = best.id;
      const sel = document.getElementById('f-template-select');
      if (sel) sel.value = best.id;
    }
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

  // ── AI buttons ──
  document.getElementById('btn-load-ai').addEventListener('click', handleLoadAI);
  document.getElementById('btn-unload-ai').addEventListener('click', async () => {
    await unloadAIModel();
    refreshAIBanner();
  });
  document.getElementById('btn-gen-both').addEventListener('click', () => runAIDraft('both'));
  document.getElementById('btn-gen-en-only').addEventListener('click', () => runAIDraft('en'));
  document.getElementById('btn-gen-hi-only').addEventListener('click', () => runAIDraft('hi'));
  document.getElementById('btn-improve-en').addEventListener('click', () => runImprove('en'));
  document.getElementById('btn-improve-hi').addEventListener('click', () => runImprove('hi'));

  // ── Save / Preview ──
  document.getElementById('btn-save-letter').addEventListener('click', saveLetter);
  document.getElementById('btn-preview-letter').addEventListener('click', previewLetter);

  if (createLetterState.editingDID && createLetterState.refNumber) {
    document.getElementById('ref-display-text').textContent = createLetterState.refNumber;
  }

  // ── Reflect AI state ──
  refreshAIBanner();
}

// ============================================================
// AI banner management
// ============================================================

function refreshAIBanner() {
  const banner    = document.getElementById('ai-banner');
  const title     = document.getElementById('ai-banner-title');
  const sub       = document.getElementById('ai-banner-sub');
  const icon      = document.getElementById('ai-banner-icon');
  const loadBtn   = document.getElementById('btn-load-ai');
  const unloadBtn = document.getElementById('btn-unload-ai');
  const modeBadge = document.getElementById('ai-mode-badge');
  const progWrap  = document.getElementById('ai-progress-wrap');
  if (!banner) return;

  const modelLabel = WEBLLM_MODELS.find(m => m.id === AI.modelId)?.label || AI.modelId || 'None';

  const cfg = {
    idle: {
      bannerClass: 'ai-banner-idle',
      icon: '🤖', title: 'AI Drafting – Not Loaded',
      sub: 'Click "Load AI Model" to enable intelligent letter drafting',
      showLoad: true, showUnload: false, showProg: false,
      badgeText: 'Template Mode', badgeClass: 'badge-normal',
    },
    loading: {
      bannerClass: 'ai-banner-loading',
      icon: '⏳', title: `Loading: ${modelLabel}`,
      sub: 'Downloading model weights… this may take a few minutes on first use',
      showLoad: false, showUnload: false, showProg: true,
      badgeText: 'Loading…', badgeClass: 'badge-important',
    },
    ready: {
      bannerClass: 'ai-banner-ready',
      icon: '✅', title: `AI Ready — ${modelLabel.split('(')[0].trim()}`,
      sub: 'Enter facts below and click Generate. The AI will write the full letter.',
      showLoad: false, showUnload: true, showProg: false,
      badgeText: 'AI Mode', badgeClass: 'badge-success',
    },
    error: {
      bannerClass: 'ai-banner-error',
      icon: '⚠️', title: 'AI Model Failed to Load',
      sub: 'Using template fallback. Check browser console for details.',
      showLoad: true, showUnload: false, showProg: false,
      badgeText: 'Template Mode', badgeClass: 'badge-normal',
    },
    fallback: {
      bannerClass: 'ai-banner-fallback',
      icon: '📋', title: 'Template Mode Active',
      sub: 'WebLLM is unavailable in this browser. Using pre-built templates.',
      showLoad: false, showUnload: false, showProg: false,
      badgeText: 'Template Mode', badgeClass: 'badge-normal',
    },
  }[AI.status] || {};

  banner.className     = `ai-banner ${cfg.bannerClass || ''}`;
  if (icon)      icon.textContent      = cfg.icon || '🤖';
  if (title)     title.textContent     = cfg.title || '';
  if (sub)       sub.textContent       = cfg.sub || '';
  if (loadBtn)   loadBtn.style.display = cfg.showLoad  ? '' : 'none';
  if (unloadBtn) unloadBtn.style.display = cfg.showUnload ? '' : 'none';
  if (progWrap)  progWrap.classList.toggle('hidden', !cfg.showProg);
  if (modeBadge) {
    modeBadge.textContent = cfg.badgeText || '';
    modeBadge.className   = `badge ${cfg.badgeClass || 'badge-normal'}`;
  }
}

async function handleLoadAI() {
  const btn = document.getElementById('btn-load-ai');
  if (btn) btn.disabled = true;
  refreshAIBanner();
  await initAI();
  if (btn) btn.disabled = false;
  refreshAIBanner();
}

// ============================================================
// Draft generation
// ============================================================

function buildAIParams() {
  const sender      = document.getElementById('f-sender')?.value || 'Secretary';
  const senderInfo  = SENDER_MAP[sender] || { name: sender, title: sender };
  const rv          = getRecipientValues();
  const subject     = document.getElementById('f-subject')?.value.trim() || '';
  const purpose     = document.getElementById('f-purpose')?.value.trim() || '';
  const letterType  = document.getElementById('f-type')?.value || 'General';
  const draftStyle  = document.getElementById('f-draft-style')?.value || 'Government Official';
  const date        = document.getElementById('f-date')?.value || todayISO();
  const refNumber   = createLetterState.refNumber || '';

  return {
    sender, senderRole: sender, senderName: senderInfo.name,
    recipientDesignation:  rv.designation,
    recipientOrganization: rv.organization,
    recipientLocation:     rv.location,
    subject, facts: purpose, letterType, draftStyle,
    refNumber, letterDate: date,
  };
}

function getTemplateFallback(lang, params) {
  return () => {
    const senderInfo = SENDER_MAP[params.sender] || { name: params.sender, title: params.sender };
    const recipient  = [params.recipientDesignation, params.recipientOrganization, params.recipientLocation]
      .filter(Boolean).join('\n');
    const drafts = generateLetterDrafts(
      createLetterState.templateId || 'general',
      { ref: params.refNumber, date: params.letterDate, recipient, subject: params.subject, purpose: params.facts, senderInfo }
    );
    return lang === 'en' ? drafts.en : drafts.hi;
  };
}

function setGenerating(active, msg = 'Generating…') {
  aiGenerating = active;
  const ind = document.getElementById('ai-generating-indicator');
  const txt = document.getElementById('ai-gen-status-text');
  const status = document.getElementById('draft-stream-status');
  const stxt = document.getElementById('draft-stream-text');
  if (ind)    ind.classList.toggle('hidden', !active);
  if (txt)    txt.textContent = msg;
  if (status) status.classList.toggle('hidden', !active);
  if (stxt)   stxt.textContent = msg;
  // Disable generate buttons while running
  ['btn-gen-both','btn-gen-en-only','btn-gen-hi-only','btn-improve-en','btn-improve-hi'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = active;
  });
}

async function runAIDraft(mode) {
  if (aiGenerating) return;

  const params = buildAIParams();

  // Validation
  if (!params.recipientDesignation) { showToast('Please enter a recipient designation', 'warning'); return; }
  if (!params.subject)              { showToast('Please enter a subject', 'warning'); return; }
  if (!params.facts)                { showToast('Please enter facts/instructions for the AI', 'warning'); return; }

  // Generate ref if missing
  if (!createLetterState.refNumber) await genRef();
  params.refNumber = createLetterState.refNumber;

  const aiAvailable = AI.status === 'ready';

  if (mode === 'both' || mode === 'en') {
    setGenerating(true, aiAvailable ? '🤖 AI writing English draft…' : '📋 Generating from template…');
    const enTA = document.getElementById('draft-en');
    if (enTA) enTA.value = '';

    const enResult = await draftEnglishLetter(
      params,
      getTemplateFallback('en', params),
      aiAvailable ? (text) => { if (enTA) enTA.value = text; } : null
    );

    if (enTA) enTA.value = enResult.text || '';
    createLetterState.draftEn = enTA?.value || '';

    if (!aiAvailable && enResult.text) {
      showToast('Used template (AI not loaded)', 'info', 2500);
    }
  }

  if (mode === 'both' || mode === 'hi') {
    setGenerating(true, aiAvailable ? '🤖 AI writing Hindi draft…' : '📋 Generating Hindi from template…');
    const hiTA = document.getElementById('draft-hi');
    if (hiTA) hiTA.value = '';

    const englishDraft = mode === 'both' ? (document.getElementById('draft-en')?.value || '') : '';

    const hiResult = await draftHindiLetter(
      params,
      englishDraft,
      getTemplateFallback('hi', params),
      aiAvailable ? (text) => { if (hiTA) hiTA.value = text; } : null
    );

    if (hiTA) hiTA.value = hiResult.text || '';
    createLetterState.draftHi = hiTA?.value || '';
  }

  setGenerating(false);

  // Sync state
  const rv = getRecipientValues();
  Object.assign(createLetterState, {
    subject: params.subject, purpose: params.facts, sender: params.sender,
    letterType: params.letterType, draftStyle: params.draftStyle,
    recipient: [rv.designation, rv.organization, rv.location].filter(Boolean).join('\n'),
    recipientDesignation: rv.designation,
    recipientOrganization: rv.organization,
    recipientLocation: rv.location,
  });

  showToast(aiAvailable ? '✅ AI draft complete' : '✅ Draft generated', 'success');
}

async function runImprove(lang) {
  if (aiGenerating) return;
  if (AI.status !== 'ready') {
    showToast('Load AI model first to use Improve', 'warning');
    return;
  }

  const ta = document.getElementById(`draft-${lang}`);
  if (!ta?.value.trim()) { showToast('Draft is empty', 'warning'); return; }

  setGenerating(true, `✨ Improving ${lang === 'en' ? 'English' : 'Hindi'} draft…`);
  const original = ta.value;
  ta.value = '';

  const result = await improveDraft(original, lang, (text) => { ta.value = text; });
  ta.value = result.text || original;

  if (lang === 'en') createLetterState.draftEn = ta.value;
  else               createLetterState.draftHi = ta.value;

  setGenerating(false);
  showToast('Draft improved', 'success');
}

// ============================================================
// Recipient / ref helpers (unchanged logic, updated for AI)
// ============================================================

async function setRecipientQuick(designation, organization, location) {
  createLetterState.recipientDesignation  = designation;
  createLetterState.recipientOrganization = organization;
  createLetterState.recipientLocation     = location;
  const panelContainer = document.getElementById('recipient-panel-container');
  if (panelContainer) {
    recipientPanelHandle = await buildRecipientPanel(panelContainer, { designation, organization, location });
  }
  showToast(`Recipient: ${designation}`, 'info', 1500);
}

function getRecipientValues() {
  if (!recipientPanelHandle) return { designation:'', organization:'', location:'', displayString:'' };
  return recipientPanelHandle.getValue();
}

async function genRef() {
  const sender = document.getElementById('f-sender')?.value;
  const type   = document.getElementById('f-type')?.value;
  const date   = document.getElementById('f-date')?.value;
  const rv     = getRecipientValues();
  if (!sender || !rv.designation || !rv.location || !type || !date) {
    showToast('Fill Sender, Designation, Location, Type and Date first', 'warning'); return;
  }
  const ref = await generateRefNumber(sender, rv.designation, rv.organization, rv.location, type, date);
  createLetterState.refNumber = ref;
  document.getElementById('ref-display-text').textContent = ref;
  document.getElementById('f-ref-manual').value = ref;
  showToast('Reference number generated', 'success', 1500);
}

// ============================================================
// Save
// ============================================================

async function saveLetter() {
  const sender    = document.getElementById('f-sender')?.value;
  const type      = document.getElementById('f-type')?.value;
  const subject   = document.getElementById('f-subject')?.value.trim();
  const purpose   = document.getElementById('f-purpose')?.value.trim();
  const priority  = document.getElementById('f-priority')?.value;
  const date      = document.getElementById('f-date')?.value;
  const draftEn   = document.getElementById('draft-en')?.value || '';
  const draftHi   = document.getElementById('draft-hi')?.value || '';
  const manualRef = document.getElementById('f-ref-manual')?.value.trim() || '';
  const rv        = getRecipientValues();

  if (!sender)         { showToast('Select a sender',               'warning'); return; }
  if (!rv.designation) { showToast('Enter a recipient designation', 'warning'); return; }
  if (!rv.location)    { showToast('Enter a recipient location',    'warning'); return; }
  if (!subject)        { showToast('Enter a subject',               'warning'); return; }
  if (!draftEn.trim()) { showToast('Generate or write the English draft first', 'warning'); return; }

  let ref = manualRef || createLetterState.refNumber;
  if (!ref) ref = await generateRefNumber(sender, rv.designation, rv.organization, rv.location, type, date);

  const btn = document.getElementById('btn-save-letter');
  btn.disabled = true; btn.textContent = 'Saving…';

  try {
    let did = createLetterState.editingDID || createLetterState.did;
    if (!did) did = await generateDID(date);

    const senderInfo       = SENDER_MAP[sender] || { name: sender, title: sender };
    const displayRecipient = rv.displayString || rv.designation;
    const now              = new Date().toISOString();

    const letter = {
      did, refNumber: ref, letterDate: date,
      sender, senderName: senderInfo.name, senderTitle: senderInfo.title,
      recipientDesignation:  rv.designation,
      recipientOrganization: rv.organization,
      recipientLocation:     rv.location,
      recipient:             displayRecipient,
      letterType: type, subject, purpose, priority,
      draftEn, draftHi,
      draftStyle:  createLetterState.draftStyle,
      templateId:  createLetterState.templateId,
      yearMonth:   yearMonth(date),
      createdAt:   createLetterState.editingDID ? (createLetterState.createdAt || now) : now,
      updatedAt:   now,
    };

    await Letters.save(letter);
    await RecipientMaster.persistFromLetter(rv.designation, rv.organization, rv.location);

    showToast(`Letter saved! DID: ${did}`, 'success');
    setTimeout(() => {
      createLetterState = {
        sender: 'Secretary',
        recipientDesignation: '', recipientOrganization: '', recipientLocation: '',
        recipient: '', letterType: 'General', subject: '', purpose: '', priority: 'Normal',
        letterDate: todayISO(), refNumber: '', did: '', draftEn: '', draftHi: '',
        templateId: 'general', draftStyle: 'Government Official', editingDID: null, createdAt: null,
      };
      navigateTo('archive');
    }, 800);

  } catch (err) {
    console.error(err);
    showToast('Save failed: ' + err.message, 'error');
    btn.disabled = false; btn.textContent = '💾 Save to Archive';
  }
}

// ============================================================
// Preview
// ============================================================

function previewLetter() {
  const draftEn = document.getElementById('draft-en')?.value || '';
  const draftHi = document.getElementById('draft-hi')?.value || '';
  const subject = document.getElementById('f-subject')?.value || '';
  const rv      = getRecipientValues();
  const ref     = createLetterState.refNumber || '(Not Generated)';
  const date    = document.getElementById('f-date')?.value || '';
  const display = rv.displayString || rv.designation || '(Recipient)';

  showModal(`
    <div class="letter-view-header">
      <div>
        <div style="font-size:0.8rem;opacity:0.7">Preview – Not Yet Saved</div>
        <div style="font-weight:700">${escHtml(subject || '(No Subject)')}</div>
        <div style="font-size:0.8rem;opacity:0.75;margin-top:2px">${escHtml(ref)}</div>
      </div>
    </div>
    <div class="letter-view-body">
      <div style="border:2px solid var(--primary);padding:24px 32px;margin-bottom:16px;background:#fff">
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
        <div style="background:#f0f4f8;padding:6px 10px;font-weight:600;font-size:0.88rem;margin-bottom:12px">
          Subject: ${escHtml(subject)}
        </div>
        <div style="font-size:0.88rem;white-space:pre-wrap;line-height:1.85">${escHtml(draftEn)}</div>
      </div>
      ${draftHi ? `
        <div style="border:2px solid #7b341e;padding:24px 32px;background:#fff">
          <div style="font-size:0.82rem;font-weight:700;color:#7b341e;margin-bottom:10px">🇮🇳 हिंदी प्रारूप</div>
          <div class="hindi" style="font-size:0.88rem;white-space:pre-wrap;line-height:1.85">${escHtml(draftHi)}</div>
        </div>` : ''}
    </div>
  `);
}

// ============================================================
// Editor utilities
// ============================================================

function swapDrafts() {
  const en = document.getElementById('draft-en');
  const hi = document.getElementById('draft-hi');
  if (!en || !hi) return;
  const tmp = en.value; en.value = hi.value; hi.value = tmp;
}

function clearDrafts() {
  const en = document.getElementById('draft-en');
  const hi = document.getElementById('draft-hi');
  if (en) en.value = '';
  if (hi) hi.value = '';
  showToast('Drafts cleared', 'info', 1500);
}

function copyDraft(lang) {
  const el = document.getElementById(`draft-${lang}`);
  if (!el) return;
  navigator.clipboard.writeText(el.value)
    .then(() => showToast('Copied to clipboard', 'success', 1500))
    .catch(() => showToast('Copy failed – use Ctrl+A, Ctrl+C', 'warning'));
}
