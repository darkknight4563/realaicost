// Health check for Cloudflare Pages Functions deployment.
// Returns which API keys are bound to this environment without leaking the values.
// Hit /api/health to confirm secrets are attached AND that Functions are intercepting /api/*
// (if this returns the SPA HTML instead of JSON, Functions routing is broken — see _routes.json).

export async function onRequestGet({ env }) {
  return new Response(JSON.stringify({
    ok: true,
    routes_ok: true,
    bindings: {
      anthropic: !!env.ANTHROPIC_API_KEY,
      google: !!env.GOOGLE_API_KEY,
    },
    runtime: "cloudflare-pages-functions",
    version: "v0.4.1",
    timestamp: new Date().toISOString(),
  }, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}
