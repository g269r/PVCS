/* ============================================================
   AI Drafter – PVCS DMS
   WebLLM-powered in-browser letter drafting.
   Falls back to template system if WebLLM unavailable.
   ============================================================ */

// ---- Available models ----
const WEBLLM_MODELS = [
  {
    id:       'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    label:    'Qwen 2.5 1.5B Instruct (Recommended)',
    size:     '~1.0 GB',
    speed:    'Fast',
    quality:  'Good',
    default:  true,
  },
  {
    id:       'Qwen2.5-3B-Instruct-q4f16_1-MLC',
    label:    'Qwen 2.5 3B Instruct (Better Quality)',
    size:     '~1.9 GB',
    speed:    'Medium',
    quality:  'Better',
    default:  false,
  },
  {
    id:       'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    label:    'Llama 3.2 1B Instruct (Lightweight)',
    size:     '~0.7 GB',
    speed:    'Very Fast',
    quality:  'Moderate',
    default:  false,
  },
  {
    id:       'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    label:    'Llama 3.2 3B Instruct (Balanced)',
    size:     '~1.9 GB',
    speed:    'Medium',
    quality:  'Good',
    default:  false,
  },
  {
    id:       'Phi-3.5-mini-instruct-q4f16_1-MLC',
    label:    'Phi-3.5 Mini Instruct (Microsoft)',
    size:     '~2.2 GB',
    speed:    'Medium',
    quality:  'Good',
    default:  false,
  },
  {
    id:       'gemma-2-2b-it-q4f16_1-MLC',
    label:    'Gemma 2 2B Instruct (Google)',
    size:     '~1.5 GB',
    speed:    'Fast',
    quality:  'Good',
    default:  false,
  },
];

// ---- AI state ----
const AI = {
  engine:       null,
  modelId:      null,
  status:       'idle',   // idle | loading | ready | error | fallback
  loadProgress: 0,
  statusCallbacks: [],

  onStatusChange(fn) { this.statusCallbacks.push(fn); },
  _emit() { this.statusCallbacks.forEach(fn => fn(this.status, this.loadProgress, this.modelId)); },

  setStatus(s, progress = 0) {
    this.status      = s;
    this.loadProgress = progress;
    this._emit();
    updateAIStatusBadge();
  },
};

// ---- WebLLM CDN (loaded dynamically to avoid breaking offline when unavailable) ----
const WEBLLM_CDN = 'https://esm.run/@mlc-ai/web-llm';

let webllmModule = null;

async function loadWebLLMModule() {
  if (webllmModule) return webllmModule;
  try {
    // Dynamic ESM import – works in modern browsers, no build step needed
    webllmModule = await import(WEBLLM_CDN);
    return webllmModule;
  } catch (e) {
    console.warn('[AI] WebLLM module load failed:', e.message);
    return null;
  }
}

// ---- Load / initialise the AI model ----
async function initAI(forceModelId) {
  const modelId = forceModelId
    || (await Settings.get('aiModel'))
    || WEBLLM_MODELS.find(m => m.default).id;

  // Already loaded with this model
  if (AI.engine && AI.modelId === modelId && AI.status === 'ready') return true;

  AI.setStatus('loading', 0);

  const wllm = await loadWebLLMModule();
  if (!wllm) {
    AI.setStatus('fallback');
    showToast('WebLLM unavailable – using template drafting', 'warning');
    return false;
  }

  try {
    AI.modelId = modelId;
    AI.engine  = new wllm.MLCEngine();

    await AI.engine.reload(modelId, {
      initProgressCallback: (info) => {
        const pct = Math.round((info.progress || 0) * 100);
        AI.setStatus('loading', pct);
        const bar = document.getElementById('ai-progress-bar');
        const txt = document.getElementById('ai-progress-text');
        if (bar) bar.style.width = pct + '%';
        if (txt) txt.textContent = info.text || `Loading model… ${pct}%`;
      },
    });

    AI.setStatus('ready', 100);
    showToast('AI model ready', 'success', 2000);
    return true;

  } catch (err) {
    console.error('[AI] Model load error:', err);
    AI.engine = null;
    AI.setStatus('error');
    showToast('AI model failed to load – using template drafting', 'warning');
    return false;
  }
}

// ---- Update topbar AI badge ----
function updateAIStatusBadge() {
  const badge = document.getElementById('ai-status-badge');
  if (!badge) return;
  const cfg = {
    idle:     { text: '🤖 AI Ready',         cls: 'ai-idle'     },
    loading:  { text: `⏳ AI Loading ${AI.loadProgress}%`, cls: 'ai-loading' },
    ready:    { text: '✅ AI Ready',          cls: 'ai-ready'    },
    error:    { text: '⚠️ AI Error',          cls: 'ai-error'    },
    fallback: { text: '📋 Template Mode',     cls: 'ai-fallback' },
  }[AI.status] || { text: '🤖 AI', cls: 'ai-idle' };

  badge.textContent = cfg.text;
  badge.className   = `ai-status-badge ${cfg.cls}`;
}

// ============================================================
// System prompts
// ============================================================

const SYSTEM_PROMPT_BASE = `You are an expert drafting officer for an Indian Cooperative Society.
You prepare professional correspondence for government departments, cooperative federations, unions, registrars, district authorities, and public institutions in Bihar, India.

STRICT RULES:
- Write in formal Indian administrative / government correspondence style.
- Maintain respectful, deferential language throughout.
- Use proper government and cooperative society terminology.
- Do NOT copy the user's notes verbatim – transform them into polished formal prose.
- Do NOT use informal expressions, slang, or casual language.
- Do NOT exaggerate facts or make claims not supported by the given information.
- Do NOT add imaginary facts, names, amounts, or dates not provided.
- Organize content logically: background → facts → request/complaint → expected action.
- Use "Respected Sir/Madam" as salutation. Close with "Yours faithfully,".
- Paragraphs should be well-structured, each making one clear point.
- Society full name: PATNA SADAR BLOCK PRIMARY VEGETABLES GROWERS COOPERATIVE SOCIETY LIMITED
- Society Hindi name: पटना सदर प्रखंड प्राथमिक सब्जी उत्पादक सहकारी समिति लिमिटेड
- Registration: 26/HQR/2018 | Bihar Cooperative Societies Act, 1935`;

const STYLE_ADDENDUM = {
  'Government Official': `
- Use formal government correspondence conventions.
- Refer to government schemes, acts, and official designations correctly.
- Structure: Reference → Subject → Respectful opener → Background → Prayer/Request → Closing.`,

  'Cooperative Society': `
- Use cooperative sector terminology (Managing Committee, General Body, bye-laws, share capital, etc.).
- Reference Bihar Cooperative Societies Act, 1935 where appropriate.
- Maintain the tone of a registered cooperative body addressing a superior authority.`,

  'Legal': `
- Use precise legal language.
- Reference applicable acts, sections, and clauses where relevant.
- Make the request or grievance legally clear without ambiguity.
- Note consequences if action is not taken, where appropriate.`,

  'Business Formal': `
- Professional business tone while maintaining government formality.
- Clear, concise sentences.
- Use headings for long letters to improve readability.`,

  'Strong Representation': `
- Assertive but respectful tone.
- Emphasize urgency and importance clearly.
- State consequences of inaction firmly but without aggression.
- Suitable for escalation letters or follow-ups on long-pending matters.`,

  'Reminder / Follow-Up': `
- Reference the original communication explicitly (date, reference number if available).
- Express concern about lack of response politely but firmly.
- Reiterate the original request concisely.
- Request specific action with a reasonable timeframe.`,
};

// ============================================================
// Build prompts
// ============================================================

function buildEnglishPrompt(params) {
  const {
    recipientDesignation, recipientOrganization, recipientLocation,
    senderRole, senderName, letterType, subject, draftStyle, facts,
    refNumber, letterDate, temperature,
  } = params;

  const styleExtra = STYLE_ADDENDUM[draftStyle] || '';
  const recipientStr = [recipientDesignation, recipientOrganization, recipientLocation]
    .filter(Boolean).join(', ');

  const systemPrompt = SYSTEM_PROMPT_BASE + '\n' + styleExtra;

  const userPrompt = `Write a complete, professional ${letterType} letter in ENGLISH only.

LETTER DETAILS:
- Reference Number: ${refNumber || 'To be assigned'}
- Date: ${letterDate}
- From: ${senderName}, ${senderRole}
  PATNA SADAR BLOCK PRIMARY VEGETABLES GROWERS COOPERATIVE SOCIETY LIMITED
- To: ${recipientStr}
- Subject: ${subject}
- Drafting Style: ${draftStyle}

FACTS AND INSTRUCTIONS PROVIDED (transform these into formal correspondence – do NOT copy verbatim):
${facts}

OUTPUT FORMAT:
Write ONLY the letter body starting from the salutation "Respected Sir/Madam," and ending with the signature block. Do NOT include the letterhead, reference number, date, or address blocks – those are handled separately.
Include 3–5 well-structured paragraphs.
End with:
Yours faithfully,

(Signature)
____________________________
${senderName}
${senderRole}
PATNA SADAR BLOCK PRIMARY VEGETABLES GROWERS COOPERATIVE SOCIETY LIMITED`;

  return { systemPrompt, userPrompt };
}

function buildHindiPrompt(params, englishDraft) {
  const {
    recipientDesignation, recipientOrganization, recipientLocation,
    senderRole, senderName, letterType, subject, draftStyle, facts,
    refNumber, letterDate,
  } = params;

  const recipientStr = [recipientDesignation, recipientOrganization, recipientLocation]
    .filter(Boolean).join(', ');

  const systemPrompt = `आप एक भारतीय सहकारी समिति के विशेषज्ञ प्रारूपण अधिकारी हैं।
आप सरकारी विभागों, सहकारी महासंघों, रजिस्ट्रार कार्यालयों और जिला प्रशासन को पेशेवर पत्र-व्यवहार तैयार करते हैं।
नियम:
- औपचारिक हिंदी सरकारी पत्र-व्यवहार शैली में लिखें।
- सम्मानजनक और विनम्र भाषा का प्रयोग करें।
- उपलब्ध तथ्यों को पेशेवर पत्र में रूपांतरित करें।
- अनौपचारिक शब्दों का प्रयोग न करें।
- समिति का नाम: पटना सदर प्रखंड प्राथमिक सब्जी उत्पादक सहकारी समिति लिमिटेड
- पंजीकरण: 26/HQR/2018`;

  const userPrompt = `निम्नलिखित ${letterType} पत्र का हिंदी प्रारूप तैयार करें।

पत्र विवरण:
- दिनांक: ${letterDate}
- प्रेषक: ${senderName}, ${senderRole}
- प्राप्तकर्ता: ${recipientStr}
- विषय: ${subject}
- शैली: ${draftStyle}

${englishDraft ? `अंग्रेजी प्रारूप का हिंदी अनुवाद एवं रूपांतरण करें:
${englishDraft.slice(0, 800)}` : `तथ्य एवं निर्देश:
${facts}`}

केवल पत्र का मुख्य भाग लिखें, "महोदय/महोदया," से शुरू करें और हस्ताक्षर खंड तक। लेटरहेड अलग से जोड़ा जाएगा।
अंत में:
भवदीय,

(हस्ताक्षर)
____________________________
${senderName}
${senderRole}
पटना सदर प्रखंड प्राथमिक सब्जी उत्पादक सहकारी समिति लिमिटेड`;

  return { systemPrompt, userPrompt };
}

function buildImprovementPrompt(existingDraft, language) {
  const isHindi = language === 'hi';

  const systemPrompt = isHindi
    ? `आप एक हिंदी सरकारी पत्र संपादक हैं। मौजूदा पत्र प्रारूप को बेहतर बनाएं।`
    : `You are a professional government letter editor. Improve the existing draft.`;

  const userPrompt = isHindi
    ? `निम्नलिखित हिंदी पत्र प्रारूप को बेहतर बनाएं:
- व्याकरण सुधारें
- स्पष्टता बढ़ाएं  
- औपचारिकता बनाए रखें
- तथ्य न बदलें
- मूल संरचना बनाए रखें

मौजूदा प्रारूप:
${existingDraft}

केवल बेहतर प्रारूप दें, कोई स्पष्टीकरण नहीं।`
    : `Improve the following government letter draft:
- Fix grammar and punctuation
- Improve clarity and flow
- Enhance professional tone
- Preserve all facts exactly
- Maintain the original structure and intent
- Do NOT add or remove factual content

Existing draft:
${existingDraft}

Return ONLY the improved draft, no explanations or commentary.`;

  return { systemPrompt, userPrompt };
}

// ============================================================
// Core generation function
// ============================================================

/**
 * Generate a letter draft using WebLLM.
 * Returns { text, usedAI } – usedAI=false means template fallback was used.
 */
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
        { role: 'system',  content: systemPrompt },
        { role: 'user',    content: userPrompt   },
      ],
      temperature,
      max_tokens: maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content || '';
      fullText += delta;
      if (onChunk) onChunk(fullText, delta);
    }

    return { text: fullText.trim(), usedAI: true };

  } catch (err) {
    console.error('[AI] Generation error:', err);
    return { text: null, usedAI: false };
  }
}

// ============================================================
// High-level API used by create-letter page
// ============================================================

/**
 * Draft an English letter. Streams tokens into the textarea if onChunk provided.
 * Falls back to template if AI unavailable.
 */
async function draftEnglishLetter(params, templateFallbackFn, onChunk) {
  const { systemPrompt, userPrompt } = buildEnglishPrompt(params);
  const result = await generateWithAI(systemPrompt, userPrompt, onChunk);

  if (!result.usedAI || !result.text) {
    // Template fallback
    const draft = templateFallbackFn ? templateFallbackFn() : '';
    return { text: draft, usedAI: false };
  }

  return { text: result.text, usedAI: true };
}

/**
 * Draft a Hindi letter. Can use the English draft as source for translation.
 */
async function draftHindiLetter(params, englishDraft, templateFallbackFn, onChunk) {
  const { systemPrompt, userPrompt } = buildHindiPrompt(params, englishDraft);
  const result = await generateWithAI(systemPrompt, userPrompt, onChunk);

  if (!result.usedAI || !result.text) {
    const draft = templateFallbackFn ? templateFallbackFn() : '';
    return { text: draft, usedAI: false };
  }

  return { text: result.text, usedAI: true };
}

/**
 * Improve an existing draft.
 */
async function improveDraft(existingText, language, onChunk) {
  if (!existingText.trim()) return { text: existingText, usedAI: false };
  const { systemPrompt, userPrompt } = buildImprovementPrompt(existingText, language);
  const result = await generateWithAI(systemPrompt, userPrompt, onChunk);
  return result.usedAI ? result : { text: existingText, usedAI: false };
}

// ============================================================
// Unload model to free VRAM/RAM
// ============================================================
async function unloadAIModel() {
  if (AI.engine) {
    try { await AI.engine.unload(); } catch (_) {}
    AI.engine = null;
    AI.modelId = null;
    AI.setStatus('idle');
  }
}
