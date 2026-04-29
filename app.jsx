const { useState, useEffect, useMemo, useRef, useCallback } = React;

const DEFAULT_PROMPT = `You are a senior support engineer for Stripe. Answer the customer's question using the provided docs. Be concise but complete.

Rules:
- If the answer requires an API call, show a minimal curl example using their test key.
- Never invent endpoints. If unsure, say so and link to the nearest relevant doc.
- Refunds older than 90 days require a dashboard action, not the API.

<docs>
{retrieved_docs}
</docs>

<conversation_history>
{conversation_history}
</conversation_history>

Customer: {question}`;

const DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "accent": "teal",
  "font": "inter",
  "density": "roomy",
  "animate": true
}/*EDITMODE-END*/;

const ACCENTS = {
  teal:   { dark: "#4ECDC4", light: "#0aa89f" },
  violet: { dark: "#a78bfa", light: "#6d28d9" },
  amber:  { dark: "#FFB86B", light: "#b35f00" },
  green:  { dark: "#50FA7B", light: "#1a7f37" },
};

/* ------------------------------- URL state ------------------------------- */
function readURLState() {
  try {
    const p = new URLSearchParams(location.hash.slice(1));
    const get = (k, def) => p.get(k) ?? def;
    return {
      model: get("m", "sonnet-4-6"),
      outputTokens: parseInt(get("o", "500")) || 500,
      requestsPerDay: parseInt(get("r", "1000")) || 1000,
      cacheOn: get("c", "1") === "1",
      cachePct: parseInt(get("cp", "70")) || 70,
      batch: get("b", "0") === "1",
      opusMult: parseFloat(get("om", "1.2")) || 1.2,
      prompt: p.get("t") ? decodeURIComponent(p.get("t")) : DEFAULT_PROMPT,
    };
  } catch (e) {
    return null;
  }
}
function writeURLState(s) {
  const p = new URLSearchParams();
  p.set("m", s.model);
  p.set("o", s.outputTokens);
  p.set("r", s.requestsPerDay);
  p.set("c", s.cacheOn ? 1 : 0);
  p.set("cp", s.cachePct);
  p.set("b", s.batch ? 1 : 0);
  p.set("om", s.opusMult);
  // Only include prompt in URL if it's reasonably short
  if (s.prompt && s.prompt.length < 1200) p.set("t", encodeURIComponent(s.prompt));
  history.replaceState(null, "", "#" + p.toString());
}

/* ------------------------------- App ------------------------------- */
function App() {
  const tweaks = useTweaks(DEFAULTS);
  const [advOpen, setAdvOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);

  // Initialize state from URL if present
  const initial = useMemo(() => readURLState() || {
    model: "sonnet-4-6",
    outputTokens: 500,
    requestsPerDay: 1000,
    cacheOn: true,
    cachePct: 70,
    batch: false,
    opusMult: 1.2,
    prompt: DEFAULT_PROMPT,
  }, []);

  const [model, setModel] = useState(initial.model);
  const [prompt, setPrompt] = useState(initial.prompt);
  const [outputTokens, setOutputTokens] = useState(initial.outputTokens);
  const [requestsPerDay, setRequestsPerDay] = useState(initial.requestsPerDay);
  const [cacheOn, setCacheOn] = useState(initial.cacheOn);
  const [cachePct, setCachePct] = useState(initial.cachePct);
  const [batch, setBatch] = useState(initial.batch);
  const [opusMult, setOpusMult] = useState(initial.opusMult);
  const [custom, setCustom] = useState({ input: 1, output: 3, ctx: 128000, cacheRead: null, tokenizer: "o200k" });

  // Exact-token state from tokenizer hook (set via TokenInput's onTokensResolved callback)
  const [exactTokens, setExactTokens] = useState(null);
  const [tokenSource, setTokenSource] = useState("empty");

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tweaks.values.theme);
  }, [tweaks.values.theme]);

  // Apply font
  useEffect(() => {
    document.documentElement.setAttribute("data-font", tweaks.values.font);
  }, [tweaks.values.font]);

  // Apply accent
  useEffect(() => {
    const a = ACCENTS[tweaks.values.accent] || ACCENTS.teal;
    document.documentElement.style.setProperty("--accent", tweaks.values.theme === "light" ? a.light : a.dark);
  }, [tweaks.values.accent, tweaks.values.theme]);

  // Sync URL
  useEffect(() => {
    writeURLState({ model, outputTokens, requestsPerDay, cacheOn, cachePct, batch, opusMult, prompt });
  }, [model, outputTokens, requestsPerDay, cacheOn, cachePct, batch, opusMult, prompt]);

  const selectedModel = useMemo(() => {
    if (model === "custom") {
      return { id: "custom", name: "Custom model", provider: "Custom",
        input: custom.input, output: custom.output, ctx: custom.ctx,
        cacheRead: custom.cacheRead, cacheWrite: null, tokenizer: custom.tokenizer };
    }
    return MODELS.find(m => m.id === model) || MODELS[0];
  }, [model, custom]);

  // Prefer exact count from the tokenizer hook (tiktoken or API); fall back to approx.
  const inputTokens = useMemo(() => {
    if (typeof exactTokens === "number" && (tokenSource === "tiktoken" || tokenSource === "api" || tokenSource === "fallback")) {
      return exactTokens;
    }
    return approxTokens(prompt, selectedModel.tokenizer, opusMult);
  }, [exactTokens, tokenSource, prompt, selectedModel.tokenizer, opusMult]);

  const result = useMemo(() => computeCost({
    model: selectedModel,
    inputTokens,
    outputTokens,
    cachePct: cacheOn ? cachePct : 0,
    batch,
    requestsPerDay,
  }), [selectedModel, inputTokens, outputTokens, cacheOn, cachePct, batch, requestsPerDay]);

  // pulse when result.perRequest changes (used for subtle highlight)
  useEffect(() => { setPulseKey(k => k + 1); }, [result.perRequest]);

  // Advanced panel derived helper
  const advState = { outputTokens, requestsPerDay, cacheOn, cachePct, batch };
  const setAdv = (patch) => {
    if (patch.outputTokens !== undefined) setOutputTokens(patch.outputTokens);
    if (patch.requestsPerDay !== undefined) setRequestsPerDay(patch.requestsPerDay);
    if (patch.cacheOn !== undefined) setCacheOn(patch.cacheOn);
    if (patch.cachePct !== undefined) setCachePct(patch.cachePct);
    if (patch.batch !== undefined) setBatch(patch.batch);
  };

  const copyURL = () => {
    navigator.clipboard.writeText(location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const isOpus47 = selectedModel.id === "opus-4-7";

  return (
    <>
      {/* Top bar */}
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">R</div>
          <span className="brand-name">RealAICost</span>
          <span className="brand-slash">/</span>
          <span className="brand-sub">exact tokens, honest numbers</span>
        </div>
        <div className="topbar-links">
          <a href="#comparison">Compare</a>
          <a href="#about">About</a>
          <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
          <button className="icon-btn" onClick={() => tweaks.setKeys({ theme: tweaks.values.theme === "dark" ? "light" : "dark" })} title="Toggle theme">
            {tweaks.values.theme === "dark" ? <IconSun size={14}/> : <IconMoon size={14}/>}
          </button>
        </div>
      </header>

      <main className="page">
        {/* Hero */}
        <section className="hero">
          <div className="eyebrow"><span className="dot"/>live · no account · client-side</div>
          <h1 className="hero-title">
            The <span className="accent">honest</span> cost of running an LLM,<br/>
            down to four decimal places.
          </h1>
          <p className="hero-sub">
            Every other calculator quotes the sticker price. This one accounts for the things that actually move your bill:
            the <code>Opus 4.7</code> tokenizer change, prompt caching, batch discounts, and the fact that your RAG prompt is probably longer than you think.
          </p>
        </section>

        {/* Calculator */}
        <div className="calc-grid">
          {/* Left: inputs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Prompt */}
            <div className="panel">
              <div className="panel-header">
                <span>01 — Your prompt</span>
                <span style={{ color: "var(--text-faint)", textTransform: "none", fontFamily: "var(--font-sans)" }}>
                  counted with <span className="mono" style={{ color: "var(--text-dim)" }}>{selectedModel.tokenizer}</span>
                </span>
              </div>
              <div className="panel-body">
                <TokenInput value={prompt} onChange={setPrompt} model={selectedModel} opusMult={opusMult}
                  onTokensResolved={(tok, src) => { setExactTokens(tok); setTokenSource(src); }}/>
              </div>
            </div>

            {/* Model */}
            <div className="panel">
              <div className="panel-header">
                <span>02 — Model</span>
                <span style={{ color: "var(--text-faint)", textTransform: "none", fontFamily: "var(--font-sans)" }}>
                  {selectedModel.name} · ${selectedModel.input}/M in · ${selectedModel.output}/M out
                </span>
              </div>
              <div className="panel-body">
                <ModelSelector value={model} onChange={setModel} custom={custom} onCustomChange={setCustom}/>
              </div>
              {isOpus47 && <OpusWarning mult={opusMult} setMult={setOpusMult} usingApi={tokenSource === "api"}/>}
              <button className="advanced-toggle" onClick={() => setAdvOpen(v => !v)}>
                <span>03 — Advanced inputs</span>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ textTransform: "none", fontFamily: "var(--font-sans)" }}>
                    {outputTokens} out · {fmtInt(requestsPerDay)}/day
                    {cacheOn && selectedModel.cacheRead != null && ` · ${cachePct}% cached`}
                    {batch && ` · batch −50%`}
                  </span>
                  <IconChevron size={12} style={{ transform: advOpen ? "rotate(180deg)" : "none", transition: "transform 160ms" }}/>
                </span>
              </button>
              {advOpen && (
                <AdvancedPanel s={advState} setS={setAdv} modelHasCache={selectedModel.cacheRead != null}/>
              )}
            </div>

            {/* Share */}
            <div className="share-bar">
              <span style={{ color: "var(--text-faint)" }}>#</span>
              <input className="share-url" value={location.href} readOnly onFocus={e => e.target.select()}/>
              <button className="share-copy" onClick={copyURL}>
                {copied ? <><IconCheck size={10}/> copied</> : <><IconCopy size={10}/> copy link</>}
              </button>
            </div>
          </div>

          {/* Right: results */}
          <ResultsPanel result={result} model={selectedModel} state={{ requestsPerDay, textLength: prompt.length }} onRecommend={setModel}/>
        </div>

        {/* Comparison */}
        <div id="comparison" className="section-head">
          <div>
            <h2>All models, same prompt</h2>
            <p>We tokenize your prompt through each provider’s tokenizer (approximately), apply your settings, and rank.
              Click a row to make it the active model. The cheapest one rarely has the right context window.</p>
          </div>
        </div>
        <ComparisonTable
          inputTokens={inputTokens}
          outputTokens={outputTokens}
          state={{ cacheOn, cachePct, batch, requestsPerDay, textLength: prompt.length }}
          currentModelId={model}
          onSelect={setModel}
          density={tweaks.values.density}
          opusMult={opusMult}
        />

        {/* About */}
        <section id="about" className="about">
          <div>
            <div className="about-kicker">About</div>
            <h2>Why token prices lie.</h2>
          </div>
          <div className="prose">
            <p>
              Every LLM vendor posts a tidy <code>$3 / $15 per million tokens</code> table. Those numbers are correct, and they’re also misleading.
              Three things can turn a quoted price into a bill that is 2–5× higher than you expected.
            </p>

            <h3>1. The tokenizer is not neutral.</h3>
            <p>
              A “token” is whatever the model’s tokenizer decided a token is. Anthropic’s tokenizer, OpenAI’s <code>o200k</code>, and Google’s SentencePiece
              disagree on how to chop up the same English sentence — and they disagree far more on code, JSON, and anything other than English.
              <strong> When Anthropic shipped Opus 4.7, the new tokenizer produced 1.0–1.46× more tokens than Opus 4.6</strong> for the same input.
              At the same sticker price, that’s a quiet 20% price hike on average and a 46% hike in the worst case.
            </p>

            <h3>2. Your prompt is longer than you think.</h3>
            <p>
              The message your user types is a small fraction of what you send. System prompt, tool definitions, retrieved docs, conversation history
              — all of that is input tokens, every single request. We pre-loaded a RAG prompt that’s probably closer to your actual shape than “hello”.
            </p>

            <h3>3. Caching and batching actually matter.</h3>
            <p>
              Prompt caching drops input cost by up to 10× on the cached portion. Batch API drops the whole request by 50%. Most calculators pretend these don’t exist.
              If you’re running any kind of production workload without at least one of them, you’re leaving real money on the table — toggle them above and watch.
            </p>

            <h3>What this tool is (and isn’t).</h3>
            <p>
              It’s a client-side calculator. No server, no account, no tracking, no ads. All math happens in your browser; share a URL and your settings travel with it.
              Tokenization is a character-based approximation calibrated per model family — accurate enough to make purchase decisions, but if you need an exact bill, tokenize with the vendor’s official library.
            </p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div>
          <div className="mono">RealAICost · v0.3.5 · exact tokenization</div>
          <div>Not affiliated with any model provider. Prices checked April 2026; verify against vendor docs before committing.</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="mono">press <kbd style={{ border: "1px solid var(--border)", borderRadius: 4, padding: "1px 5px", fontFamily: "var(--font-mono)", fontSize: 11 }}>?</kbd> for tweaks</div>
        </div>
      </footer>

      {/* Tweaks panel */}
      <TweaksPanel title="Tweaks" tweaks={tweaks}>
        <TweakSection title="Appearance">
          <TweakRadio tweaks={tweaks} k="theme" label="Theme" options={[{value:"dark",label:"Dark"},{value:"light",label:"Light"}]}/>
          <TweakRadio tweaks={tweaks} k="accent" label="Accent" options={[
            {value:"teal",label:"Teal"},{value:"violet",label:"Violet"},{value:"amber",label:"Amber"},{value:"green",label:"Green"}
          ]}/>
          <TweakSelect tweaks={tweaks} k="font" label="Font" options={[
            {value:"inter",label:"Inter + JetBrains Mono"},
            {value:"geist",label:"Geist + Geist Mono"},
            {value:"ibm",label:"IBM Plex Sans + Mono"},
            {value:"system",label:"System default"},
          ]}/>
        </TweakSection>
        <TweakSection title="Table">
          <TweakRadio tweaks={tweaks} k="density" label="Density" options={[{value:"roomy",label:"Roomy"},{value:"compact",label:"Compact"}]}/>
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
