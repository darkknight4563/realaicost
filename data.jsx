// Pricing data. All prices in USD per 1M tokens.
// `lastVerified` = date pricing was confirmed against primary sources.
// `lastVerified: null` = pricing shown but not independently verified (marked "unverified" in UI).
// Context-tiered models: `longCtx*` applies when prompt exceeds `longCtxThreshold`.
const MODELS = [
  // ─────────── Anthropic ───────────
  { id: "opus-4-7", provider: "Anthropic", name: "Claude Opus 4.7",
    input: 5, output: 25, cacheRead: 0.50, cacheWrite: 6.25, ctx: 1000000, maxOutput: 128000,
    release: "2026-04-16", lastVerified: "2026-04-24",
    tokenizer: "claude-opus-4-7", flagship: true,
    tags: ["flagship", "new"],
    note: "New tokenizer produces 1.0–1.35× more tokens vs 4.6 (up to ~1.46× observed on technical content)." },
  { id: "opus-4-6", provider: "Anthropic", name: "Claude Opus 4.6",
    input: 5, output: 25, cacheRead: 0.50, cacheWrite: 6.25, ctx: 1000000, maxOutput: 128000,
    release: "2026-02-20", lastVerified: "2026-04-24",
    tokenizer: "claude", tags: ["previous-flagship"] },
  { id: "sonnet-4-6", provider: "Anthropic", name: "Claude Sonnet 4.6",
    input: 3, output: 15, cacheRead: 0.30, cacheWrite: 3.75, ctx: 1000000, maxOutput: 64000,
    release: "2026-02-20", lastVerified: "2026-04-24",
    tokenizer: "claude", tags: ["balanced", "recommended-default"] },
  { id: "haiku-4-5", provider: "Anthropic", name: "Claude Haiku 4.5",
    input: 1, output: 5, cacheRead: 0.10, cacheWrite: 1.25, ctx: 200000, maxOutput: 64000,
    release: "2025-10-01", lastVerified: "2026-04-24",
    tokenizer: "claude", tags: ["fast", "cheap"] },

  // ─────────── OpenAI ───────────
  { id: "gpt-5-5", provider: "OpenAI", name: "GPT-5.5",
    input: 5, output: 30, cacheRead: 0.50, cacheWrite: null, ctx: 1000000, maxOutput: 128000,
    release: "2026-04-23", lastVerified: "2026-04-24",
    tokenizer: "o200k", flagship: true,
    tags: ["flagship", "new"],
    note: "2× the per-token price of GPT-5.4, but more token-efficient on Codex tasks." },
  { id: "gpt-5-4", provider: "OpenAI", name: "GPT-5.4",
    input: 2.50, output: 15, cacheRead: 0.25, cacheWrite: null, ctx: 1000000, maxOutput: 128000,
    release: "2026-03-05", lastVerified: "2026-04-24",
    tokenizer: "o200k", tags: ["balanced"] },
  { id: "gpt-5-4-mini", provider: "OpenAI", name: "GPT-5.4 mini",
    input: 0.25, output: 2.00, cacheRead: 0.025, cacheWrite: null, ctx: 400000, maxOutput: 64000,
    release: "2026-03-17", lastVerified: null,
    tokenizer: "o200k", tags: ["cheap"] },
  { id: "gpt-5-4-nano", provider: "OpenAI", name: "GPT-5.4 nano",
    input: 0.05, output: 0.40, cacheRead: 0.005, cacheWrite: null, ctx: 200000, maxOutput: 32000,
    release: "2026-03-17", lastVerified: null,
    tokenizer: "o200k", tags: ["cheapest-openai"] },
  { id: "gpt-5", provider: "OpenAI", name: "GPT-5",
    input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: null, ctx: 400000, maxOutput: 128000,
    release: "2025-08-07", lastVerified: "2026-04-24",
    tokenizer: "o200k", tags: ["legacy"] },

  // ─────────── Google ───────────
  { id: "gemini-3-1-pro", provider: "Google", name: "Gemini 3.1 Pro Preview",
    input: 2.00, output: 12, cacheRead: 0.20, cacheWrite: null, ctx: 1000000, maxOutput: 65000,
    longCtxThreshold: 200000, longCtxInput: 4.00, longCtxOutput: 18.00,
    release: "2026-02-19", lastVerified: "2026-04-24",
    tokenizer: "gemini", flagship: true,
    tags: ["flagship-google", "context-tiered"],
    note: "Context-tiered: $4/$18 when prompt exceeds 200K tokens (applies to entire prompt, not just overage)." },
  { id: "gemini-3-flash", provider: "Google", name: "Gemini 3 Flash Preview",
    input: 0.50, output: 3.00, cacheRead: 0.05, cacheWrite: null, ctx: 1000000, maxOutput: 65000,
    release: "2026-03-09", lastVerified: null,
    tokenizer: "gemini", tags: ["new"] },
  { id: "gemini-2-5-pro", provider: "Google", name: "Gemini 2.5 Pro",
    input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: null, ctx: 2000000, maxOutput: 65000,
    longCtxThreshold: 200000, longCtxInput: 2.50, longCtxOutput: 15.00,
    release: "2025-06-17", lastVerified: "2026-04-24",
    tokenizer: "gemini", tags: ["2M-context", "context-tiered"],
    note: "Context-tiered: $2.50/$15 when prompt exceeds 200K tokens." },
  { id: "gemini-2-5-flash", provider: "Google", name: "Gemini 2.5 Flash",
    input: 0.30, output: 2.50, cacheRead: 0.075, cacheWrite: null, ctx: 1000000, maxOutput: 65000,
    release: "2025-06-17", lastVerified: "2026-04-24",
    tokenizer: "gemini", tags: ["cheap"] },
  { id: "gemini-2-5-flash-lite", provider: "Google", name: "Gemini 2.5 Flash-Lite",
    input: 0.10, output: 0.40, cacheRead: 0.025, cacheWrite: null, ctx: 1000000, maxOutput: 65000,
    release: "2025-06-17", lastVerified: "2026-04-24",
    tokenizer: "gemini", tags: ["cheapest-google"] },

  // ─────────── Meta ───────────
  { id: "llama-3-3-70b", provider: "Meta", name: "Llama 3.3 70B",
    input: 0.60, output: 0.60, cacheRead: null, cacheWrite: null, ctx: 128000, maxOutput: 8000,
    release: "2024-12-06", lastVerified: null,
    tokenizer: "llama", tags: ["open-source"],
    note: "Typical Together AI rate. Actual cost varies by host (Groq, Fireworks, etc.)." },

  // ─────────── DeepSeek ───────────
  { id: "deepseek-v3-2", provider: "DeepSeek", name: "DeepSeek V3.2",
    input: 0.14, output: 0.28, cacheRead: 0.014, cacheWrite: null, ctx: 128000, maxOutput: 8000,
    release: "2026-01-15", lastVerified: null,
    tokenizer: "llama", tags: ["cheapest-overall"] },
];

// Tokenizer approximations. Chars-per-token calibrated against published benchmarks.
const TOKENIZER_RATIOS = {
  "claude": 3.5,            // Claude 3/4 family (pre-4.7)
  "claude-opus-4-7": 2.9,   // ~1.2x more tokens than 4.6 (3.5 / 1.2 ≈ 2.92)
  "o200k": 3.8,             // GPT-4o / GPT-5 family
  "gemini": 4.0,
  "llama": 3.6,
};

// Approximate tokens from character count given a model tokenizer.
function approxTokens(text, tokenizerId, opusMultiplier) {
  if (!text) return 0;
  let ratio = TOKENIZER_RATIOS[tokenizerId] || 3.5;
  if (tokenizerId === "claude-opus-4-7" && typeof opusMultiplier === "number") {
    ratio = TOKENIZER_RATIOS["claude"] / opusMultiplier;
  }
  return Math.max(1, Math.round(text.length / ratio));
}

// Resolve effective prices given prompt size (handles context-tiered models).
function effectivePrices(model, inputTokens) {
  if (model.longCtxThreshold && inputTokens > model.longCtxThreshold) {
    return {
      input: model.longCtxInput ?? model.input,
      output: model.longCtxOutput ?? model.output,
      cacheRead: model.cacheRead, // cache rate isn't typically tiered
      tiered: true,
    };
  }
  return { input: model.input, output: model.output, cacheRead: model.cacheRead, tiered: false };
}

// Cost math in USD. Prices are per 1M tokens.
function computeCost({ model, inputTokens, outputTokens, cachePct, batch, requestsPerDay }) {
  const prices = effectivePrices(model, inputTokens);
  const cacheFrac = Math.max(0, Math.min(1, (cachePct || 0) / 100));
  const hasCacheRead = prices.cacheRead != null;
  const effCacheFrac = hasCacheRead ? cacheFrac : 0;

  const fullInput = inputTokens * (1 - effCacheFrac);
  const cachedInput = inputTokens * effCacheFrac;

  const inputCost = (fullInput / 1e6) * prices.input;
  const cacheCost = (cachedInput / 1e6) * (prices.cacheRead ?? prices.input);
  const outputCost = (outputTokens / 1e6) * prices.output;

  const baselineInput = (inputTokens / 1e6) * prices.input;
  const cacheSavings = baselineInput - (inputCost + cacheCost);

  let perRequest = inputCost + cacheCost + outputCost;
  let batchSavings = 0;
  if (batch) {
    batchSavings = perRequest * 0.5;
    perRequest = perRequest * 0.5;
  }

  const daily = perRequest * (requestsPerDay || 0);
  return {
    perRequest,
    daily,
    monthly: daily * 30,
    yearly: daily * 365,
    tiered: prices.tiered,
    effectivePrices: prices,
    breakdown: {
      input: (batch ? 0.5 : 1) * inputCost,
      cache: (batch ? 0.5 : 1) * cacheCost,
      output: (batch ? 0.5 : 1) * outputCost,
      cacheSavings,
      batchSavings,
    },
  };
}

function fmtUSD(n, decimals = 4) {
  if (!isFinite(n)) return "$0.0000";
  if (n === 0) return "$0.0000";
  const abs = Math.abs(n);
  if (abs >= 1000) return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (abs >= 10) return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return "$" + n.toFixed(decimals);
}

function fmtInt(n) {
  return (n || 0).toLocaleString("en-US");
}

function fmtReleaseDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

Object.assign(window, {
  MODELS, TOKENIZER_RATIOS, approxTokens, computeCost, effectivePrices,
  fmtUSD, fmtInt, fmtReleaseDate,
});
