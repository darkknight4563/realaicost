// Tokenizer service. Exposes window.Tokenizer with:
//   - countTokensAsync(model, text, opusMult) → Promise<{ tokens, source, pending?, error? }>
//     where source ∈ "tiktoken" | "api" | "fallback"
//   - countApprox(model, text, opusMult) → number  (synchronous, used by comparison table)
//   - subscribe(fn) → unsubscribe  (fires on every state change for active request)
//
// Dynamic import of js-tiktoken only happens on first OpenAI model select.

const FALLBACK_RATIOS = {
  default: 3.5,    // English prose
  code: 2.8,       // code-heavy
};

// per-model encoding for OpenAI
const OPENAI_ENCODING = {
  "gpt-5": "o200k_base",
  "gpt-5-mini": "o200k_base",
  "gpt-5-nano": "o200k_base",
  "gpt-4o": "o200k_base",
  // add cl100k_base entries here for older models if added to MODELS
};

// Detect code-heavy text → use 2.8 chars/tok instead of 3.5
function isCodeHeavy(text) {
  if (!text) return false;
  if (/```/.test(text)) return true;
  const nonAlpha = (text.match(/[^a-zA-Z\s]/g) || []).length;
  return nonAlpha / text.length > 0.20;
}

function charApprox(text, modelId, tokenizerId, opusMult) {
  if (!text) return 0;
  const base = isCodeHeavy(text) ? FALLBACK_RATIOS.code : FALLBACK_RATIOS.default;
  let ratio = base;
  // Tokenizer-specific adjustment (Gemini slightly roomier, Llama similar to Claude)
  if (tokenizerId === "gemini") ratio = base * (4.0 / 3.5);
  else if (tokenizerId === "o200k") ratio = base * (3.8 / 3.5);
  else if (tokenizerId === "llama") ratio = base * (3.6 / 3.5);
  // Opus 4.7 verbosity multiplier
  if (tokenizerId === "claude-opus-4-7" && typeof opusMult === "number") {
    ratio = ratio / opusMult;
  }
  return Math.max(1, Math.round(text.length / ratio));
}

// ---- tiktoken loader (cached) ----
let tiktokenModulePromise = null;
const encoderCache = new Map(); // encoding name → encoder instance

function loadTiktoken() {
  if (!tiktokenModulePromise) {
    tiktokenModulePromise = import("https://esm.sh/js-tiktoken@1.0.15").catch(err => {
      tiktokenModulePromise = null;  // allow retry
      throw err;
    });
  }
  return tiktokenModulePromise;
}

async function getEncoder(encodingName) {
  if (encoderCache.has(encodingName)) return encoderCache.get(encodingName);
  const mod = await loadTiktoken();
  // js-tiktoken exposes getEncoding(name) → encoder with .encode(text)
  const enc = mod.getEncoding(encodingName);
  encoderCache.set(encodingName, enc);
  return enc;
}

// ---- API proxy (Claude / Gemini) ----
async function fetchExact(provider, model, text) {
  const endpoint = provider === "google" ? "/api/count-tokens-gemini" : "/api/count-tokens";
  const body = {
    model,
    messages: [{ role: "user", content: text }],
  };
  const resp = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  if (data.fallback) throw new Error(data.error || "fallback flag set");
  return data.input_tokens;
}

// ---- public: async count ----
async function countTokensAsync(model, text, opusMult) {
  if (!text) return { tokens: 0, source: "empty" };

  const provider = model.provider?.toLowerCase();

  // OpenAI → tiktoken (client-side)
  if (provider === "openai") {
    const encodingName = OPENAI_ENCODING[model.id] || "o200k_base";
    try {
      const enc = await getEncoder(encodingName);
      const tokens = enc.encode(text).length;
      return { tokens, source: "tiktoken" };
    } catch (e) {
      console.warn("[realaicost:fallback]", "tiktoken load failed:", e.message || e);
      return { tokens: charApprox(text, model.id, model.tokenizer, opusMult), source: "fallback", error: e.message };
    }
  }

  // Anthropic → proxy
  if (provider === "anthropic") {
    try {
      const tokens = await fetchExact("anthropic", model.id, text);
      if (typeof tokens !== "number") throw new Error("no input_tokens in response");
      // Opus 4.7 multiplier is NOT applied when API is authoritative.
      return { tokens, source: "api" };
    } catch (e) {
      console.warn("[realaicost:fallback]", `anthropic proxy failed: ${e.message || e}`);
      return { tokens: charApprox(text, model.id, model.tokenizer, opusMult), source: "fallback", error: e.message };
    }
  }

  // Google → proxy
  if (provider === "google") {
    try {
      // Gemini API uses the published model id (e.g. "gemini-2.5-pro")
      const apiModel = model.id.replace(/-/g, ".").replace(/gemini\.(\d)\.(\d)\.(pro|flash)/, "gemini-$1.$2-$3");
      // Simpler: hard map
      const modelIdMap = {
        "gemini-2-5-pro": "gemini-2.5-pro",
        "gemini-2-5-flash": "gemini-2.5-flash",
      };
      const tokens = await fetchExact("google", modelIdMap[model.id] || model.id, text);
      if (typeof tokens !== "number") throw new Error("no input_tokens in response");
      return { tokens, source: "api" };
    } catch (e) {
      console.warn("[realaicost:fallback]", `google proxy failed: ${e.message || e}`);
      return { tokens: charApprox(text, model.id, model.tokenizer, opusMult), source: "fallback", error: e.message };
    }
  }

  // Meta/Llama → no free count API
  return { tokens: charApprox(text, model.id, model.tokenizer, opusMult), source: "fallback" };
}

// ---- React hook: debounced, with pending state + tokenizer-loading flag ----
function useTokenCount(model, text, opusMult, debounceMs = 500) {
  const [state, setState] = React.useState({ tokens: 0, source: "empty", pending: false, loadingTokenizer: false });
  const reqIdRef = React.useRef(0);

  React.useEffect(() => {
    if (!model || !text) {
      setState({ tokens: 0, source: "empty", pending: false, loadingTokenizer: false });
      return;
    }

    const provider = model.provider?.toLowerCase();

    // Instant path: custom model with no text → 0. Otherwise show synchronous approx immediately
    // then resolve with the real count.
    const approx = charApprox(text, model.id, model.tokenizer, opusMult);

    // Determine if we need to load tiktoken (first OpenAI select w/ encoder not cached)
    const encodingName = OPENAI_ENCODING[model.id];
    const loadingTokenizer = provider === "openai" && encodingName && !encoderCache.has(encodingName);

    setState(s => ({ tokens: approx, source: "pending", pending: true, loadingTokenizer }));

    const myReq = ++reqIdRef.current;
    const t = setTimeout(async () => {
      const result = await countTokensAsync(model, text, opusMult);
      if (reqIdRef.current !== myReq) return;  // stale
      setState({ ...result, pending: false, loadingTokenizer: false });
    }, debounceMs);

    return () => clearTimeout(t);
  }, [model?.id, text, opusMult, debounceMs]);

  return state;
}

Object.assign(window, {
  Tokenizer: {
    countTokensAsync,
    countApprox: charApprox,
    OPENAI_ENCODING,
    encoderCache,
  },
  useTokenCount,
});
