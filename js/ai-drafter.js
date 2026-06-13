/* ============================================================
   AI Drafter – PVCS DMS  v2.1
   WebLLM in-browser inference.  Robust loading with:
     • multiple CDN fallbacks
     • verified current model IDs (MLC-AI v0.2.x)
     • WebGPU availability check before attempting load
     • clear per-step error messages
     • automatic template fallback
   ============================================================ */

// ── WebLLM CDN sources (tried in order) ──────────────────────
// esm.run re-exports from jsDelivr and is reliable for ESM.
// We also try unpkg and cdn.jsdelivr.net directly as fallbacks.
const WEBLLM_CDNS = [
  'https://esm.run/@mlc-ai/web-llm@0.2.73',
  'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.73/+esm',
  'https://unpkg.com/@mlc-ai/web-llm@0.2.73/lib/index.js',
];

// ── Available models ──────────────────────────────────────────
// IDs are verified against the MLC-AI prebuilt model registry.
// Use smaller q4f32 variants for better cross-device compat.
const WEBLLM_MODELS = [
  {
    id:      'Qwen2.5-1.5B-Instruct-q4f32_1-MLC',
    label:   'Qwen 2.5 · 1.5B · Fast',
    desc:    'Best balance of speed and quality for formal writing',
    size:    '~1.1 GB',
    speed:   'Fast',
    quality: 'Good',
    default: true,
  },
  {
    id:      'Qwen2.5-3B-Instruct-q4f32_1-MLC',
    label:   'Qwen 2.5 · 3B · Better Quality',
    desc:    'Richer vocabulary and better paragraph structure',
    size:    '~2.0 GB',
    speed:   'Medium',
    quality: 'Better',
    default: false,
  },
  {
    id:      'Llama-3.2-1B-Instruct-q4f32_1-MLC',
    label:   'Llama 3.2 · 1B · Lightweight',
    desc:    'Smallest model – fastest to download',
    size:    '~0.7 GB',
    speed:   'Very Fast',
    quality: 'Moderate',
    default: false,
  },
  {
    id:      'Llama-3.2-3B-Instruct-q4f32_1-MLC',
    label:   'Llama 3.2 · 3B · Balanced',
    desc:    'Good English quality, moderate size',
    size:    '~1.9 GB',
    speed:   'Medium',
    quality: 'Good',
    default: false,
  },
  {
    id:      'Phi-3.5-mini-instruct-q4f16_1-MLC',
    label:   'Phi-3.5 Mini · Microsoft',
    desc:    'Strong instruction following',
    size:    '~2.2 GB',
    speed:   'Medium',
    quality: 'Good',
    default: false,
  },
  {
    id:      'gemma-2-2b-it-q4f16_1-MLC',
    label:   'Gemma 2 · 2B · Google',
    desc:    'Google\'s instruction-tuned model',
    size:    '~1.5 GB',
    speed:   'Fast',
    quality: 'Good',
    default: false,
  },
];

// ── AI runtime state ──────────────────────────────────────────
const AI = {
  engine:          null,
  modelId:         null,
  status:          'idle',   // idle | checking | loading | ready | error | fallback
  loadProgress:    0,
  lastError:       '',
  statusCallbacks: [],

  onStatusChange(fn) { this.statusCallbacks.push(fn); },
  _emit() {
    this.statusCallbacks.forEach(fn =>
      fn(this.status, this.loadProgress, this.modelId, this.lastError)
    );
  },
  setStatus(s, progress = 0, err = '') {
    this.status       = s;
    this.loadProgress = progress;
    this.lastError    = err;
    this._emit();
    updateAIStatusBadge();
  },
};

// ── WebLLM module cache ───────────────────────────────────────
let webllmModule = null;

// ── Step 1: Check WebGPU availability ────────────────────────
function checkWebGPU() {
  if (!navigator.gpu) {
    return {
      ok: false,
      reason: 'WebGPU is not available. Use Chrome 113+, Edge 113+, or enable WebGPU flags.',
    };
  }
  return { ok: true };
}

// ── Step 2: Load the WebLLM ESM module ───────────────────────
async function loadWebLLMModule() {
  if (webllmModule) return { mod: webllmModule, source: 'cached' };

  for (const cdn of WEBLLM_CDNS) {
    try {
      console.log(`[AI] Trying CDN: ${cdn}`);
      const mod = await import(/* @vite-ignore */ cdn);
      // Validate the module has what we need
      if (!mod.MLCEngine && !mod.CreateMLCEngine && !mod.CreateWebWorkerMLCEngine) {
        console.warn(`[AI] CDN loaded but MLCEngine not found at ${cdn}`, Object.keys(mod));
        continue;
      }
      webllmModule = mod;
      console.log(`[AI] WebLLM loaded from ${cdn}`);
      return { mod, source: cdn };
    } catch (e) {
      console.warn(`[AI] CDN failed (${cdn}):`, e.message);
    }
  }
  return { mod: null, source: null };
}

// ── Step 3: Create the engine ────────────────────────────────
function createEngine(wllm) {
  // Different versions export differently
  if (typeof wllm.CreateMLCEngine === 'function') return null; // async factory, handled below
  if (typeof wllm.MLCEngine === 'function') return new wllm.MLCEngine();
  // Very old API
  if (typeof wllm.ChatModule === 'function') return new wllm.ChatModule();
  return null;
}

// ── Main init function ────────────────────────────────────────
async function initAI(forceModelId) {
  const modelId = forceModelId
    || (await Settings.get('aiModel'))
    || WEBLLM_MODELS.find(m => m.default).id;

  // Already loaded with this model
  if (AI.engine && AI.modelId === modelId && AI.status === 'ready') {
    showToast('AI model already ready', 'info', 1500);
    return true;
  }

  // Clean up any previous engine
  if (AI.engine) {
    try { await AI.engine.unload?.(); } catch (_) {}
    AI.engine = null;
  }

  // ── Check 1: WebGPU ──
  AI.setStatus('checking');
  _updateBannerText('Checking WebGPU support…');

  const gpuCheck = checkWebGPU();
  if (!gpuCheck.ok) {
    AI.setStatus('fallback', 0, gpuCheck.reason);
    showModal(`
      <div style="padding:16px">
        <h3 style="color:var(--danger);margin-bottom:12px">⚠️ WebGPU Not Available</h3>
        <p style="margin-bottom:12px">${escHtml(gpuCheck.reason)}</p>
        <div style="background:#fff8e1;padding:12px;border-radius:6px;font-size:0.85rem;margin-bottom:16px">
          <strong>To enable WebGPU in Chrome:</strong><br>
          Go to <code>chrome://flags</code> → search "WebGPU" → Enable<br><br>
          <strong>To enable in Edge:</strong><br>
          Go to <code>edge://flags</code> → search "WebGPU" → Enable
        </div>
        <p style="font-size:0.85rem;color:var(--text-muted)">
          The application will continue using the <strong>template drafting system</strong> which works perfectly without AI.
        </p>
        <button class="btn btn-primary mt-8" onclick="hideModal()">OK, Use Templates</button>
      </div>
    `, '480px');
    return false;
  }

  // ── Check 2: Load module ──
  AI.setStatus('loading', 2);
  _updateBannerText('Loading WebLLM library…');

  const { mod: wllm, source } = await loadWebLLMModule();
  if (!wllm) {
    const errMsg = 'Could not load WebLLM from any CDN. Check your internet connection.';
    AI.setStatus('error', 0, errMsg);
    showModal(`
      <div style="padding:16px">
        <h3 style="color:var(--danger);margin-bottom:12px">❌ WebLLM Library Failed to Load</h3>
        <p style="margin-bottom:12px">Could not load WebLLM from any CDN source.</p>
        <div style="background:#fde8e8;padding:12px;border-radius:6px;font-size:0.85rem;margin-bottom:12px">
          <strong>Possible causes:</strong>
          <ul style="margin:8px 0 0 16px">
            <li>No internet connection (required for first download)</li>
            <li>CDN blocked by firewall or browser extension</li>
            <li>Browser does not support dynamic ESM imports</li>
          </ul>
        </div>
        <p style="font-size:0.85rem;color:var(--text-muted)">
          Continuing with template drafting mode. All other features work normally.
        </p>
        <button class="btn btn-primary mt-8" onclick="hideModal()">OK</button>
      </div>
    `, '480px');
    return false;
  }

  // ── Check 3: Load model weights ──
  try {
    AI.modelId = modelId;
    _updateBannerText(`Downloading model: ${modelId.split('-').slice(0,3).join(' ')}…`);

    // Handle both CreateMLCEngine (async) and MLCEngine (sync constructor) APIs
    if (typeof wllm.CreateMLCEngine === 'function') {
      AI.engine = await wllm.CreateMLCEngine(modelId, {
        initProgressCallback: _handleProgress,
      });
    } else {
      const engine = createEngine(wllm);
      if (!engine) throw new Error('No compatible engine constructor found in WebLLM module.');
      AI.engine = engine;
      await AI.engine.reload(modelId, {
        initProgressCallback: _handleProgress,
      });
    }

    AI.setStatus('ready', 100);
    showToast('✅ AI model ready', 'success', 2500);
    return true;

  } catch (err) {
    console.error('[AI] Model load error:', err);
    AI.engine = null;

    // Friendly error classification
    let userMsg = err.message || 'Unknown error';
    let detail  = '';

    if (userMsg.includes('not found') || userMsg.includes('404')) {
      userMsg = `Model "${modelId}" not found in the registry.`;
      detail  = 'Try selecting a different model in Settings.';
    } else if (userMsg.includes('memory') || userMsg.includes('OOM')) {
      userMsg = 'Not enough GPU memory to load this model.';
      detail  = 'Try a smaller model (e.g. Llama 3.2 1B) or close other browser tabs.';
    } else if (userMsg.includes('network') || userMsg.includes('fetch')) {
      userMsg = 'Network error while downloading model weights.';
      detail  = 'Check your internet connection and try again.';
    } else if (userMsg.includes('WebGPU') || userMsg.includes('gpu')) {
      userMsg = 'WebGPU error during model load.';
      detail  = 'Your GPU may not fully support WebGPU. Try a different browser or device.';
    }

    AI.setStatus('error', 0, userMsg);
    showModal(`
      <div style="padding:16px">
        <h3 style="color:var(--danger);margin-bottom:12px">❌ Model Load Failed</h3>
        <p style="margin-bottom:8px"><strong>${escHtml(userMsg)}</strong></p>
        ${detail ? `<p style="margin-bottom:12px;font-size:0.88rem">${escHtml(detail)}</p>` : ''}
        <div style="background:#fde8e8;padding:10px 14px;border-radius:6px;font-size:0.78rem;font-family:monospace;margin-bottom:16px;overflow-wrap:anywhere">
          ${escHtml(err.message || '')}
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="hideModal();handleLoadAI()">🔄 Retry</button>
          <button class="btn btn-outline" onclick="hideModal();navigateTo('settings')">⚙️ Change Model</button>
          <button class="btn btn-outline" onclick="hideModal()">Use Templates</button>
        </div>
      </div>
    `, '500px');
    return false;
  }
}

// ── Progress callback helper ──────────────────────────────────
function _handleProgress(info) {
  // info.progress is 0–1, info.text is a description string
  const pct = Math.round((info.progress || 0) * 100);
  AI.setStatus('loading', pct);

  const bar = document.getElementById('ai-progress-bar');
  const txt = document.getElementById('ai-progress-text');
  if (bar) bar.style.width = Math.max(pct, 3) + '%';
  if (txt) {
    // Show friendly progress: "Fetching weights 34%" or the raw text
    const msg = info.text
      ? info.text.replace(/\[.*?\]/g, '').trim().slice(0, 80)
      : `Downloading… ${pct}%`;
    txt.textContent = msg;
  }
}

// ── Banner text helper ────────────────────────────────────────
function _updateBannerText(msg) {
  const sub = document.getElementById('ai-banner-sub');
  if (sub) sub.textContent = msg;
  const stxt = document.getElementById('ai-gen-status-text');
  if (stxt) stxt.textContent = msg;
}

// ── Topbar badge ──────────────────────────────────────────────
function updateAIStatusBadge() {
  const badge = document.getElementById('ai-status-badge');
  if (!badge) return;

  const map = {
    idle:     { text: '🤖 AI',              cls: 'ai-idle'     },
    checking: { text: '🔍 Checking…',       cls: 'ai-loading'  },
    loading:  { text: `⏳ ${AI.loadProgress}%`, cls: 'ai-loading' },
    ready:    { text: '✅ AI Ready',         cls: 'ai-ready'    },
    error:    { text: '⚠️ AI Error',         cls: 'ai-error'    },
    fallback: { text: '📋 Templates',        cls: 'ai-fallback' },
  };
  const cfg = map[AI.status] || map.idle;
  badge.textContent = cfg.text;
  badge.className   = `ai-status-badge ${cfg.cls}`;
}

// ============================================================
// System prompts
// ============================================================

const SYSTEM_PROMPT_BASE = `You are the Official Drafting Officer of an Indian Cooperative Society.

Your responsibility is to draft professional correspondence addressed to:
- Government Departments
- District Cooperative Officers
- Block Cooperative Officers
- Registrars
- Cooperative Federations
- Public Authorities
- Banks
- Unions
- Public Institutions

Draft letters in the style commonly used by Government Offices, Cooperative Societies, Statutory Bodies, and Public Sector Organizations.

STRICT RULES:
- Never write like a chatbot.
- Never use phrases such as: "I am writing to inform you", "We are looking forward to", "Fresh ideas and energy", "Please let us know", "Hope you are doing well", "Please find attached", "Feel free to", "Don't hesitate to", "As per our conversation".
- Use formal administrative language exclusively.
- Preferred phrases: "I am directed to submit that...", "It is respectfully submitted that...", "It is therefore requested that...", "The matter is submitted for kind consideration.", "Necessary action may kindly be taken.", "Your favourable consideration shall be highly appreciated.", "In this connection, it is stated that...", "Reference is invited to...", "With reference to the above-cited subject...", "The undersigned is directed to state that...".
- Never invent facts, names, amounts, dates, or designations not provided by the user.
- Only use facts provided in the user's instructions. Expand them into proper official correspondence.
- Maintain professional and neutral language throughout.
- Avoid emotional language, marketing language, and conversational language.
- Draft as if the letter may become part of an official government or cooperative record.
- Use Indian administrative drafting style.
- Use cooperative society terminology where appropriate: Managing Committee, General Body, bye-laws, share capital, reserve fund, registered society, affiliated union.
- Output ONLY the letter body — from salutation to signature block.
- Do NOT output explanations, commentary, notes, headings, or preamble of any kind.
- Do NOT repeat the society's address or registration number in the signature block.

Society: PATNA SADAR BLOCK PRIMARY VEGETABLES GROWERS COOPERATIVE SOCIETY LIMITED
Registration: 26/HQR/2018 | Bihar Cooperative Societies Act, 1935`;

const STYLE_ADDENDUM = {
  'Government Official': `
Style: Government Official
- Follow formal government correspondence conventions strictly.
- Open with: "I am directed to submit that..." or "It is respectfully submitted that..."
- State background in one paragraph, facts in subsequent paragraphs, close with a clear prayer/request.
- Close with: "It is, therefore, requested that necessary action may kindly be taken at the earliest."`,

  'Cooperative Society': `
Style: Cooperative Society
- Use cooperative sector terminology throughout: Managing Committee, General Body, bye-laws, affiliated union, share capital, reserve fund.
- Reference Bihar Cooperative Societies Act, 1935 where it strengthens the submission.
- Maintain tone of a registered cooperative society addressing a superior cooperative or government authority.
- Open with: "It is respectfully submitted that the above-named society..." or "With reference to the subject cited above..."`,

  'Legal': `
Style: Legal
- Use precise, unambiguous legal language.
- Reference applicable Acts, Sections, and Clauses where relevant and only where they apply.
- State the legal basis for the request or grievance with clarity.
- Where inaction would cause legal consequences, state so factually and without any threat.
- Open with: "In terms of Section ___ of the Bihar Cooperative Societies Act, 1935..." or "It is submitted that the undersigned society is entitled under..."`,

  'Business Formal': `
Style: Business Formal
- Professional, clear, and concise.
- Avoid passive constructions where possible.
- Use numbered points for lists of facts or requests when there are more than two items.
- Open with: "This is to bring to your kind notice that..." or "With reference to the matter cited above..."`,

  'Strong Representation': `
Style: Strong Representation
- Assertive, firm, and consistently respectful.
- Emphasize urgency and importance factually — state impact, not emotion.
- Where prior communications went unanswered, reference them specifically.
- Close with a firm timeframe: "It is, therefore, urgently requested that appropriate action may be taken within ___ days."
- Do NOT use aggressive or threatening language.`,

  'Reminder / Follow-Up': `
Style: Reminder / Follow-Up
- Open by citing the original letter with its reference number and date.
- Express concern about non-receipt of response factually: "It is regretted that no response has been received to the aforementioned communication."
- Restate the original request in one concise paragraph.
- Close with: "It is once again requested that the matter may be expedited and a response communicated at the earliest."`,
};

// ============================================================
// Prompt builders
// ============================================================

function buildEnglishPrompt(params) {
  const {
    recipientDesignation, recipientOrganization, recipientLocation,
    senderRole, senderName, letterType, subject, draftStyle, facts,
    refNumber, letterDate,
  } = params;

  const styleExtra   = STYLE_ADDENDUM[draftStyle] || '';
  const recipientStr = [recipientDesignation, recipientOrganization, recipientLocation]
    .filter(Boolean).join(', ');

  const systemPrompt = SYSTEM_PROMPT_BASE + '\n\n' + styleExtra;

  const userPrompt =
`Draft a ${letterType} letter in ENGLISH only.

LETTER DETAILS:
Reference No.: ${refNumber || '[To be inserted]'}
Date: ${letterDate}
From: ${senderName}, ${senderRole}
      PATNA SADAR BLOCK PRIMARY VEGETABLES GROWERS COOPERATIVE SOCIETY LIMITED
To: ${recipientStr}
Subject: ${subject}
Drafting Style: ${draftStyle}

USER-PROVIDED FACTS AND INSTRUCTIONS:
${facts}

DRAFTING INSTRUCTIONS:
- Begin directly with "Respected Sir/Madam,"
- Expand the above facts into 3 to 5 well-structured formal paragraphs.
- Do NOT copy the facts verbatim — rewrite them in formal administrative language.
- Do NOT invent any additional facts, names, amounts, or dates.
- End with the following signature block exactly:

Yours faithfully,

(Signature)
____________________________
${senderName}
${senderRole}`;

  return { systemPrompt, userPrompt };
}

function buildHindiPrompt(params, englishDraft) {
  const {
    recipientDesignation, recipientOrganization, recipientLocation,
    senderRole, senderName, letterType, subject, draftStyle, facts,
    letterDate,
  } = params;

  const recipientStr = [recipientDesignation, recipientOrganization, recipientLocation]
    .filter(Boolean).join(', ');

  const systemPrompt =
`आप एक भारतीय सहकारी समिति के आधिकारिक हिंदी प्रारूप अधिकारी हैं।

आपका दायित्व है कि आप सरकारी विभागों, सहकारी महासंघों, रजिस्ट्रार कार्यालयों, जिला अधिकारियों, बैंकों और सार्वजनिक संस्थानों को संबोधित पेशेवर हिंदी पत्र तैयार करें।

अनिवार्य नियम:
- चैटबॉट की भाषा में कभी न लिखें।
- निम्नलिखित जैसे वाक्यांशों का उपयोग न करें: "मैं आपको सूचित करना चाहता हूँ", "उम्मीद है आप ठीक होंगे", "कृपया हमें बताएं"।
- विशुद्ध औपचारिक सरकारी हिंदी प्रशासनिक भाषा का प्रयोग करें।
- पसंदीदा वाक्यांश: "सविनय निवेदन है कि...", "उपरोक्त विषयक अवगत कराना है कि...", "अतः अनुरोध है कि...", "समुचित कार्रवाई करने की कृपा करें।", "विषयान्तर्गत आवश्यक आदेश देने का कष्ट करें।", "मामले को उचित संज्ञान में लेकर आवश्यक कार्यवाही की जाए।"
- केवल उपयोगकर्ता द्वारा दिए गए तथ्यों का उपयोग करें। कोई नया तथ्य, नाम, राशि या तिथि न जोड़ें।
- भावनात्मक, विपणन या बोलचाल की भाषा से बचें।
- पत्र को इस प्रकार लिखें जैसे यह किसी आधिकारिक अभिलेख का हिस्सा बनेगा।
- यह एक स्वतंत्र हिंदी पत्र होना चाहिए — अंग्रेजी का शब्द-दर-शब्द अनुवाद नहीं।
- हस्ताक्षर खंड में समिति का पता या पंजीकरण संख्या न दोहराएं।
- केवल पत्र का मुख्य भाग प्रस्तुत करें। कोई टिप्पणी, व्याख्या या शीर्षक नहीं।
- समिति: पटना सदर प्रखंड प्राथमिक सब्जी उत्पादक सहकारी समिति लिमिटेड
- पंजीकरण: 26/HQR/2018 | बिहार सहकारी समिति अधिनियम, 1935`;

  // If English draft exists, use it as semantic source (not word-for-word)
  // If not, work from raw facts
  const sourceBlock = englishDraft
    ? `नीचे दिए गए अंग्रेजी पत्र के भाव एवं तथ्यों के आधार पर एक स्वतंत्र हिंदी पत्र प्रारूप तैयार करें। शब्द-दर-शब्द अनुवाद न करें:

${englishDraft.slice(0, 1200)}`
    : `नीचे दिए गए तथ्यों एवं निर्देशों के आधार पर हिंदी पत्र प्रारूप तैयार करें:

${facts}`;

  const userPrompt =
`${letterType} श्रेणी का एक पूर्ण हिंदी पत्र प्रारूप तैयार करें।

पत्र विवरण:
दिनांक: ${letterDate}
प्रेषक: ${senderName}, ${senderRole}
प्राप्तकर्ता: ${recipientStr}
विषय: ${subject}
शैली: ${draftStyle}

${sourceBlock}

प्रारूप निर्देश:
- "महोदय," या "महोदया," से आरंभ करें।
- 3 से 5 सुव्यवस्थित अनुच्छेद लिखें।
- तथ्यों को औपचारिक प्रशासनिक हिंदी में विस्तारित करें — हूबहू न दोहराएं।
- लेटरहेड, संदर्भ संख्या और पते की पंक्तियाँ अलग से जोड़ी जाएंगी — उन्हें यहाँ शामिल न करें।
- अंत में यह हस्ताक्षर खंड लिखें:

भवदीय,

(हस्ताक्षर)
____________________________
${senderName}
${senderRole}`;

  return { systemPrompt, userPrompt };
}

function buildImprovementPrompt(existingDraft, language) {
  const isHindi = language === 'hi';

  const systemPrompt = isHindi
    ? `आप एक वरिष्ठ सरकारी हिंदी पत्र संपादक हैं।
नियम:
- केवल भाषा, व्याकरण और शैली सुधारें।
- कोई नया तथ्य न जोड़ें और कोई तथ्य न हटाएं।
- औपचारिक सरकारी हिंदी बनाए रखें।
- चैटबॉट वाक्यांशों से बचें।
- केवल बेहतर प्रारूप प्रस्तुत करें — कोई टिप्पणी नहीं।`
    : `You are a senior government correspondence editor.
Rules:
- Fix grammar, sentence structure, and formal tone only.
- Do NOT add any new facts. Do NOT remove any existing facts.
- Eliminate chatbot phrases: "I am writing to inform you", "Hope you are doing well", "Please let us know", "Feel free to", etc.
- Replace informal phrases with formal administrative equivalents.
- Output ONLY the improved draft — no commentary, no notes, no explanations.`;

  const userPrompt = isHindi
    ? `निम्नलिखित हिंदी पत्र प्रारूप में सुधार करें:
- व्याकरण एवं विराम चिह्नों को ठीक करें
- औपचारिक सरकारी हिंदी शैली सुनिश्चित करें
- सभी तथ्य एवं संरचना अपरिवर्तित रखें
- केवल बेहतर प्रारूप प्रस्तुत करें

मौजूदा प्रारूप:
${existingDraft}`
    : `Improve the following government letter draft.

Rules:
- Fix grammar, punctuation, and sentence structure.
- Replace any chatbot or informal phrases with formal administrative language.
- Use preferred government phrases: "It is submitted that...", "It is therefore requested that...", "Necessary action may kindly be taken.", "Your favourable consideration is solicited."
- Preserve ALL facts exactly — do not add or remove any content.
- Return ONLY the improved draft.

Draft to improve:
${existingDraft}`;

  return { systemPrompt, userPrompt };
}

// ============================================================
// Core generation – streaming
// ============================================================

async function generateWithAI(systemPrompt, userPrompt, onChunk) {
  if (!AI.engine || AI.status !== 'ready') {
    return { text: null, usedAI: false };
  }

  const temperature = parseFloat(await Settings.get('aiTemperature') || '0.4');
  const maxTokens   = parseInt(await Settings.get('aiMaxTokens')    || '800', 10);

  try {
    let fullText = '';

    const stream = await AI.engine.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   },
      ],
      temperature,
      max_tokens: maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content || '';
      if (delta) {
        fullText += delta;
        if (onChunk) onChunk(fullText, delta);
      }
    }

    return { text: fullText.trim(), usedAI: true };

  } catch (err) {
    console.error('[AI] Generation error:', err);
    // Don't crash – return fallback flag
    return { text: null, usedAI: false };
  }
}

// ============================================================
// High-level API
// ============================================================

async function draftEnglishLetter(params, templateFallbackFn, onChunk) {
  const { systemPrompt, userPrompt } = buildEnglishPrompt(params);
  const result = await generateWithAI(systemPrompt, userPrompt, onChunk);
  if (!result.usedAI || !result.text) {
    return { text: templateFallbackFn ? templateFallbackFn() : '', usedAI: false };
  }
  return result;
}

async function draftHindiLetter(params, englishDraft, templateFallbackFn, onChunk) {
  const { systemPrompt, userPrompt } = buildHindiPrompt(params, englishDraft);
  const result = await generateWithAI(systemPrompt, userPrompt, onChunk);
  if (!result.usedAI || !result.text) {
    return { text: templateFallbackFn ? templateFallbackFn() : '', usedAI: false };
  }
  return result;
}

async function improveDraft(existingText, language, onChunk) {
  if (!existingText.trim()) return { text: existingText, usedAI: false };
  const { systemPrompt, userPrompt } = buildImprovementPrompt(existingText, language);
  const result = await generateWithAI(systemPrompt, userPrompt, onChunk);
  return (result.usedAI && result.text) ? result : { text: existingText, usedAI: false };
}

// ============================================================
// Unload
// ============================================================

async function unloadAIModel() {
  if (AI.engine) {
    try { await AI.engine.unload?.(); } catch (_) {}
    AI.engine = null;
    AI.modelId = null;
  }
  AI.setStatus('idle');
  showToast('AI model unloaded', 'info', 1500);
}

// ============================================================
// Diagnostics helper – call from browser console
// ============================================================

window.pvcsAIDiag = async function () {
  console.group('PVCS AI Diagnostics');
  console.log('WebGPU available:', !!navigator.gpu);
  if (navigator.gpu) {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      console.log('GPU adapter:', adapter ? adapter.toString() : 'null – GPU not supported');
    } catch (e) { console.warn('GPU adapter error:', e.message); }
  }
  console.log('AI status:', AI.status);
  console.log('AI model:', AI.modelId);
  console.log('AI engine:', AI.engine ? 'loaded' : 'null');
  console.log('WebLLM module:', webllmModule ? 'loaded' : 'null');
  // Try loading module
  console.log('Testing CDN imports…');
  for (const cdn of WEBLLM_CDNS) {
    try {
      const m = await import(/* @vite-ignore */ cdn);
      console.log(`  ✅ ${cdn} → keys: ${Object.keys(m).slice(0,8).join(', ')}`);
    } catch (e) {
      console.log(`  ❌ ${cdn} → ${e.message}`);
    }
  }
  console.groupEnd();
};
