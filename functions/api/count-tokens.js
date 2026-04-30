// Deploys as a Cloudflare Pages Function.
// Requires env var ANTHROPIC_API_KEY set in
// Cloudflare dashboard → Pages project → Settings → Environment variables.
// The Anthropic count_tokens API is free; this proxy exists to keep the key server-side.
//
// Request:  POST { model, messages, system? }
// Response: 200 { input_tokens, cached, source: "api" }
//       or: 200 { input_tokens: null, fallback: true, error: "<reason>" }  ← frontend must degrade

const ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages/count_tokens";
const ANTHROPIC_VERSION = "2023-06-01";
const CACHE_TTL_SECONDS = 3600;
const MAX_PAYLOAD_BYTES = 200 * 1024;       // 200KB raw JSON
const MAX_TEXT_CHARS = 500_000;              // total characters across messages + system

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "content-type": "application/json", ...(init.headers || {}) },
  });
}

function corsHeaders(request) {
  // Same-origin only: echo the request origin if it matches this deployment's host.
  const origin = request.headers.get("origin") || "";
  const url = new URL(request.url);
  const sameOrigin = origin === `${url.protocol}//${url.host}`;
  return {
    "access-control-allow-origin": sameOrigin ? origin : url.origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "vary": "origin",
  };
}

async function sha256Hex(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function onRequestPost({ request, env }) {
  const cors = corsHeaders(request);

  if (!env.ANTHROPIC_API_KEY) {
    return json(
      { input_tokens: null, fallback: true, error: "ANTHROPIC_API_KEY not configured" },
      { status: 200, headers: cors }
    );
  }

  let payload;
  let rawText;
  try {
    rawText = await request.text();
    if (rawText.length > MAX_PAYLOAD_BYTES) {
      return json(
        { input_tokens: null, fallback: true, error: "payload too large" },
        { status: 200, headers: cors }
      );
    }
    payload = JSON.parse(rawText);
  } catch {
    return json({ input_tokens: null, fallback: true, error: "invalid json" }, { status: 200, headers: cors });
  }

  const { model: rawModel, messages, system } = payload || {};
  if (!rawModel || !Array.isArray(messages)) {
    return json(
      { input_tokens: null, fallback: true, error: "missing model or messages[]" },
      { status: 200, headers: cors }
    );
  }

  // Normalize short IDs (e.g. "opus-4-7") to the full Claude alias the API accepts.
  const CLAUDE_ID_MAP = {
    "opus-4-7":   "claude-opus-4-7",
    "opus-4-6":   "claude-opus-4-6",
    "sonnet-4-6": "claude-sonnet-4-6",
    "sonnet-4-5": "claude-sonnet-4-5",
    "haiku-4-5":  "claude-haiku-4-5",
    "sonnet-3-7": "claude-sonnet-3-7",
    "sonnet-3-5": "claude-sonnet-3-5",
    "haiku-3-5":  "claude-haiku-3-5",
  };
  const model = CLAUDE_ID_MAP[rawModel] ?? rawModel;

  // Total text length guard — sum content across messages + system.
  let textChars = (typeof system === "string" ? system.length : 0);
  for (const m of messages) {
    if (typeof m?.content === "string") textChars += m.content.length;
    else if (Array.isArray(m?.content)) {
      for (const part of m.content) {
        if (typeof part?.text === "string") textChars += part.text.length;
      }
    }
    if (textChars > MAX_TEXT_CHARS) break;
  }
  if (textChars > MAX_TEXT_CHARS) {
    return json(
      { input_tokens: null, fallback: true, error: "payload too large" },
      { status: 200, headers: cors }
    );
  }

  // Cache key: hash the canonical request so identical prompts are free after the first hit.
  const cacheBody = JSON.stringify({ model, messages, system: system || null });
  const hash = await sha256Hex(cacheBody);
  const cacheKey = new Request(`https://cache.realaicost.internal/anthropic/${hash}`, { method: "GET" });
  const cache = caches.default;

  const hit = await cache.match(cacheKey);
  if (hit) {
    const cached = await hit.json();
    return json({ ...cached, cached: true, source: "api" }, { status: 200, headers: cors });
  }

  // Forward to Anthropic. Any failure → fallback flag, HTTP 200.
  let upstream;
  try {
    upstream = await fetch(ANTHROPIC_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({ model, messages, ...(system ? { system } : {}) }),
    });
  } catch (e) {
    return json(
      { input_tokens: null, fallback: true, error: `upstream network: ${e.message || e}` },
      { status: 200, headers: cors }
    );
  }

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    return json(
      { input_tokens: null, fallback: true, error: `upstream ${upstream.status}: ${text.slice(0, 200)}` },
      { status: 200, headers: cors }
    );
  }

  let data;
  try {
    data = await upstream.json();
  } catch (e) {
    return json(
      { input_tokens: null, fallback: true, error: "upstream returned non-json" },
      { status: 200, headers: cors }
    );
  }

  const result = { input_tokens: data.input_tokens ?? null, source: "api" };

  // Cache for 1h, same-origin CORS preserved on miss path too.
  const cachedResp = new Response(JSON.stringify(result), {
    headers: {
      "content-type": "application/json",
      "cache-control": `public, max-age=${CACHE_TTL_SECONDS}`,
    },
  });
  // Best-effort; ignore waitUntil if not available.
  try { await cache.put(cacheKey, cachedResp.clone()); } catch {}

  return json({ ...result, cached: false }, { status: 200, headers: cors });
}
