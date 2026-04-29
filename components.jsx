const { useState, useEffect, useMemo, useRef, useCallback } = React;

/* ------------------------------- Icons (inline SVG, lucide-style) ------------------------------- */
const Icon = ({ children, size = 14, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...rest}>{children}</svg>
);
const IconSun = (p) => <Icon {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></Icon>;
const IconMoon = (p) => <Icon {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></Icon>;
const IconInfo = (p) => <Icon {...p}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></Icon>;
const IconAlert = (p) => <Icon {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></Icon>;
const IconCheck = (p) => <Icon {...p}><path d="M20 6L9 17l-5-5"/></Icon>;
const IconCopy = (p) => <Icon {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></Icon>;
const IconChevron = (p) => <Icon {...p}><polyline points="6 9 12 15 18 9"/></Icon>;
const IconZap = (p) => <Icon {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Icon>;
const IconSlash = (p) => <Icon {...p}><line x1="18" y1="6" x2="6" y2="18"/></Icon>;

/* ------------------------------- Helpers ------------------------------- */
function useAnimatedNumber(value, duration = 250) {
  const [display, setDisplay] = useState(value);
  const raf = useRef(null);
  useEffect(() => {
    const start = performance.now();
    const from = display;
    const to = value;
    if (from === to) return;
    cancelAnimationFrame(raf.current);
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (to - from) * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);
  return display;
}

function Tooltip({ text, children }) {
  return (
    <span className="help-dot" title={text}>?</span>
  );
}

/* ------------------------------- Model Selector ------------------------------- */
function ModelSelector({ value, onChange, custom, onCustomChange }) {
  const groups = useMemo(() => {
    const m = {};
    MODELS.forEach(x => { (m[x.provider] = m[x.provider] || []).push(x); });
    return m;
  }, []);

  return (
    <div>
      {Object.entries(groups).map(([prov, list]) => (
        <div key={prov} style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-faint)", marginBottom: 6 }}>{prov}</div>
          <div className="model-grid">
            {list.map(m => (
              <button key={m.id} className={"model-card" + (value === m.id ? " selected" : "")}
                onClick={() => onChange(m.id)}>
                <div className="mc-provider">
                  {m.provider}
                  {m.tags?.includes("new") && <span className="mc-tag mc-tag-new">new</span>}
                  {m.tags?.includes("legacy") && <span className="mc-tag mc-tag-legacy">legacy</span>}
                  {m.longCtxThreshold && <span className="mc-tag mc-tag-tiered" title={`$${m.longCtxInput}/$${m.longCtxOutput} over ${m.longCtxThreshold/1000}K tokens`}>tiered</span>}
                  {m.lastVerified === null && <span className="mc-tag mc-tag-unverified" title="Pricing not independently verified">unverified</span>}
                </div>
                <div className="mc-name">{m.name}</div>
                <div className="mc-meta">
                  <span>${m.input}<span className="slash">/</span>${m.output}</span>
                  <span style={{ color: "var(--text-faint)" }}>{m.ctx >= 1000000 ? (m.ctx/1000000) + "M" : (m.ctx/1000).toFixed(0) + "K"} ctx</span>
                </div>
                {m.release && (
                  <div className="mc-release">
                    {fmtReleaseDate(m.release)}
                    {m.lastVerified && <span className="mc-verified-dot" title={`Verified ${m.lastVerified}`}>·</span>}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-faint)", marginBottom: 6 }}>Custom</div>
      <button className={"model-card custom" + (value === "custom" ? " selected" : "")} style={{ width: "100%" }}
        onClick={() => onChange("custom")}>
        <div className="mc-provider">Your model</div>
        <div className="mc-name">Custom pricing</div>
        {value === "custom" ? (
          <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }} onClick={e => e.stopPropagation()}>
            <label style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-dim)", display: "flex", alignItems: "center", gap: 6 }}>
              $in/M <input type="number" className="num-input" value={custom.input}
                onChange={e => onCustomChange({ ...custom, input: parseFloat(e.target.value) || 0 })} step="0.01" style={{ width: 80 }}/>
            </label>
            <label style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-dim)", display: "flex", alignItems: "center", gap: 6 }}>
              $out/M <input type="number" className="num-input" value={custom.output}
                onChange={e => onCustomChange({ ...custom, output: parseFloat(e.target.value) || 0 })} step="0.01" style={{ width: 80 }}/>
            </label>
            <label style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-dim)", display: "flex", alignItems: "center", gap: 6 }}>
              ctx <input type="number" className="num-input" value={custom.ctx}
                onChange={e => onCustomChange({ ...custom, ctx: parseInt(e.target.value) || 0 })} step="1000" style={{ width: 90 }}/>
            </label>
          </div>
        ) : (
          <div className="mc-meta"><span>Override prices</span></div>
        )}
      </button>
    </div>
  );
}

/* ------------------------------- Token Input ------------------------------- */
function TokenBadge({ source, pending, loadingTokenizer }) {
  if (loadingTokenizer) {
    return <span className="tt-badge tt-badge-loading">loading tokenizer…</span>;
  }
  if (pending) {
    return <span className="tt-badge tt-badge-pending">counting…</span>;
  }
  if (source === "tiktoken" || source === "api") {
    return <span className="tt-badge tt-badge-verified"><IconCheck size={10}/> verified</span>;
  }
  if (source === "fallback") {
    return <span className="tt-badge tt-badge-estimated"><IconInfo size={10}/> estimated</span>;
  }
  return null;
}

function TokenInfoPopover({ onClose }) {
  return (
    <div className="tt-popover" onClick={e => e.stopPropagation()}>
      <div className="tt-popover-title">How counting works</div>
      <ul className="tt-popover-list">
        <li><strong>OpenAI</strong> counts use tiktoken (exact, client-side).</li>
        <li><strong>Anthropic &amp; Google</strong> counts come from their official counting APIs via our proxy, cached for 1 hour.</li>
        <li><strong>Meta / Llama</strong> counts are character-based approximations — no free count API is currently available.</li>
        <li>Actual billing may differ by 5–10 tokens due to provider-side system overhead.</li>
      </ul>
      <button className="tt-popover-close" onClick={onClose}>got it</button>
    </div>
  );
}

function TokenInput({ value, onChange, model, opusMult, onTokensResolved }) {
  const chars = value.length;
  const state = useTokenCount(model, value, opusMult, 500);
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    if (!state.pending && typeof onTokensResolved === "function") {
      onTokensResolved(state.tokens, state.source);
    }
  }, [state.tokens, state.source, state.pending]);

  const tokenizerLabel = state.source === "tiktoken" ? "tiktoken · " + (Tokenizer.OPENAI_ENCODING[model?.id] || "o200k_base")
    : state.source === "api" ? (model?.provider === "Anthropic" ? "anthropic api" : "gemini api")
    : state.source === "fallback" ? "char approx"
    : (model?.tokenizer || "—");

  return (
    <div>
      <textarea className="token-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Paste your prompt here. Include your full system prompt, tool definitions, and any RAG context you pass every request — that's what you actually pay for."
        spellCheck={false}
      />
      <div className="counter-row">
        <div className="counter-cell">
          <span className="counter-label">chars</span>
          <span className="counter-value">{fmtInt(chars)}</span>
        </div>
        <div className="counter-cell">
          <span className="counter-label">input tokens</span>
          <span className={"counter-value highlight" + (state.pending ? " tt-count-pulse" : "")}>{fmtInt(state.tokens)}</span>
        </div>
        <div className="counter-cell" style={{ position: "relative" }}>
          <span className="counter-label">
            source
            <button className="tt-info-btn" onClick={() => setPopoverOpen(v => !v)} aria-label="How counting works">
              <IconInfo size={11}/>
            </button>
          </span>
          <span className="counter-value"><TokenBadge source={state.source} pending={state.pending} loadingTokenizer={state.loadingTokenizer}/></span>
          {popoverOpen && <TokenInfoPopover onClose={() => setPopoverOpen(false)}/>}
        </div>
        <div className="counter-cell" style={{ marginLeft: "auto" }}>
          <span className="counter-label">tokenizer</span>
          <span className="counter-value" style={{ fontSize: 11 }}>{tokenizerLabel}</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Advanced Panel ------------------------------- */
function AdvancedPanel({ s, setS, modelHasCache }) {
  return (
    <div className="advanced-body">
      <div className="row">
        <div className="row-label">
          Expected output tokens
          <span className="sub">per response</span>
        </div>
        <input type="range" className="slider" min="0" max="8000" step="50"
          value={s.outputTokens} onChange={e => setS({ outputTokens: parseInt(e.target.value) })}/>
        <input type="number" className="num-input" value={s.outputTokens}
          onChange={e => setS({ outputTokens: parseInt(e.target.value) || 0 })}/>
      </div>

      <div className="row">
        <div className="row-label">
          Requests per day
          <span className="sub">volume estimate</span>
        </div>
        <input type="range" className="slider" min="0" max="100000" step="100"
          value={Math.min(100000, s.requestsPerDay)} onChange={e => setS({ requestsPerDay: parseInt(e.target.value) })}/>
        <input type="number" className="num-input" value={s.requestsPerDay}
          onChange={e => setS({ requestsPerDay: parseInt(e.target.value) || 0 })}/>
      </div>

      <div className="row">
        <div className="row-label">
          Prompt caching
          <span className="sub">{modelHasCache ? "cached input at discounted rate" : "not supported for this model"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="toggle" role="switch" aria-checked={s.cacheOn} disabled={!modelHasCache}
            onClick={() => setS({ cacheOn: !s.cacheOn })}/>
          {s.cacheOn && modelHasCache && (
            <>
              <input type="range" className="slider" min="0" max="100" step="1" style={{ flex: 1, minWidth: 120 }}
                value={s.cachePct} onChange={e => setS({ cachePct: parseInt(e.target.value) })}/>
              <span className="row-value">{s.cachePct}%</span>
            </>
          )}
        </div>
        <div></div>
      </div>

      <div className="row">
        <div className="row-label">
          Batch API
          <span className="sub">50% off, async processing</span>
        </div>
        <div><button className="toggle" role="switch" aria-checked={s.batch}
          onClick={() => setS({ batch: !s.batch })}/></div>
        <div className="row-value">{s.batch ? "−50%" : "off"}</div>
      </div>
    </div>
  );
}

/* ------------------------------- Opus Warning ------------------------------- */
function OpusWarning({ mult, setMult, usingApi }) {
  return (
    <div className="warning">
      <span className="warning-icon"><IconAlert size={16}/></span>
      <div style={{ flex: 1 }}>
        <strong>Opus 4.7 uses a new tokenizer.</strong> It produces 1.0–1.46× more tokens than Opus 4.6 for the same text — more verbose on code, JSON, and non-English. {usingApi ? "You're getting exact counts from Anthropic's API, so the multiplier below is informational only." : "We apply a 1.2× average multiplier by default. Adjust if you've measured your own ratio."}
        <div className="warning-slider" style={usingApi ? { opacity: 0.5 } : {}}>
          <input type="range" className="slider" min="1.0" max="1.46" step="0.01"
            value={mult} disabled={usingApi}
            onChange={e => setMult(parseFloat(e.target.value))}/>
          <span className="mono" style={{ fontSize: 12, color: "var(--warn)" }}>
            {mult.toFixed(2)}× {usingApi && <span style={{ color: "var(--text-faint)" }}>(not applied)</span>}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Results Panel ------------------------------- */
function AnimatedUSD({ value, decimals = 4, big = false }) {
  const display = useAnimatedNumber(value, 220);
  return <span className="tabular">{fmtUSD(display, decimals)}</span>;
}

function ResultsPanel({ result, model, state, onRecommend }) {
  const totalBillable = result.breakdown.input + result.breakdown.cache + result.breakdown.output;
  const pctInput = totalBillable ? (result.breakdown.input / totalBillable) * 100 : 0;
  const pctCache = totalBillable ? (result.breakdown.cache / totalBillable) * 100 : 0;
  const pctOutput = totalBillable ? (result.breakdown.output / totalBillable) * 100 : 0;

  // recommendation: Opus selected, monthly > $100 — suggest Sonnet
  const recommendation = useMemo(() => {
    if (!model || !result.monthly) return null;
    if (!(model.id === "opus-4-7" || model.id === "opus-4-6")) return null;
    if (result.monthly < 100) return null;
    const sonnet = MODELS.find(m => m.id === "sonnet-4-6");
    // approximate monthly at sonnet rates by ratio of blended price
    const blendedOpus = model.input + model.output;
    const blendedSonnet = sonnet.input + sonnet.output;
    const sonnetMonthly = result.monthly * (blendedSonnet / blendedOpus);
    const save = result.monthly - sonnetMonthly;
    if (save < 30) return null;
    return { target: sonnet, save };
  }, [model, result.monthly]);

  return (
    <div className="panel results">
      <div className="panel-header">
        <span>Results</span>
        <span style={{ color: "var(--text-faint)", textTransform: "none", fontFamily: "var(--font-sans)" }}>live</span>
      </div>
      <div className="panel-body">
        <div className="results-kpis">
          <div className="kpi big">
            <div className="kpi-label">Cost per request</div>
            <div className="kpi-value"><AnimatedUSD value={result.perRequest} decimals={4}/></div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Per day</div>
            <div className="kpi-value"><AnimatedUSD value={result.daily} decimals={2}/></div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Per month</div>
            <div className="kpi-value"><AnimatedUSD value={result.monthly} decimals={2}/></div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Per year</div>
            <div className="kpi-value"><AnimatedUSD value={result.yearly} decimals={0}/></div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Vol / month</div>
            <div className="kpi-value tabular">{fmtInt(state.requestsPerDay * 30)}</div>
          </div>
        </div>

        <div className="breakdown">
          <div className="breakdown-title">Cost breakdown — per request</div>
          <div className="bar">
            <div className="bar-seg bar-input" style={{ width: pctInput + "%" }}/>
            <div className="bar-seg bar-cache" style={{ width: pctCache + "%" }}/>
            <div className="bar-seg bar-output" style={{ width: pctOutput + "%" }}/>
          </div>
          <div className="legend">
            <div className="legend-row">
              <span><span className="dot" style={{ background: "var(--accent)" }}></span>Input</span>
              <span className="amt">{fmtUSD(result.breakdown.input, 5)}</span>
            </div>
            <div className="legend-row">
              <span><span className="dot" style={{ background: "color-mix(in srgb, var(--accent) 50%, #6b72ff)" }}></span>Output</span>
              <span className="amt">{fmtUSD(result.breakdown.output, 5)}</span>
            </div>
            <div className="legend-row">
              <span><span className="dot" style={{ background: "color-mix(in srgb, var(--good) 70%, var(--bg))" }}></span>Cached input</span>
              <span className="amt">{fmtUSD(result.breakdown.cache, 5)}</span>
            </div>
            {result.breakdown.cacheSavings > 0 && (
              <div className="legend-row savings">
                <span>Cache savings</span>
                <span className="amt">−{fmtUSD(result.breakdown.cacheSavings, 5)}</span>
              </div>
            )}
            {result.breakdown.batchSavings > 0 && (
              <div className="legend-row savings">
                <span>Batch savings</span>
                <span className="amt">−{fmtUSD(result.breakdown.batchSavings, 5)}</span>
              </div>
            )}
          </div>
        </div>

        {recommendation && (
          <div className="recommendation">
            <IconZap size={16} style={{ color: "var(--good)", flexShrink: 0, marginTop: 2 }}/>
            <div>
              <strong>Switch to {recommendation.target.name}</strong> to save about <strong>{fmtUSD(recommendation.save, 2)}/month</strong> at this volume.{" "}
              <button className="rec-link" onClick={() => onRecommend(recommendation.target.id)}>Try it →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- Comparison Table ------------------------------- */
function ComparisonTable({ inputTokens, outputTokens, state, currentModelId, onSelect, density, opusMult }) {
  const [sort, setSort] = useState({ col: "perRequest", dir: "asc" });

  const rows = useMemo(() => {
    return MODELS.map(m => {
      // recompute tokens for each model's tokenizer
      const tok = TOKENIZER_RATIOS[m.tokenizer] || 3.5;
      let ratio = tok;
      if (m.tokenizer === "claude-opus-4-7") ratio = TOKENIZER_RATIOS["claude"] / opusMult;
      const modelTokens = state.textLength ? Math.max(1, Math.round(state.textLength / ratio)) : inputTokens;
      const r = computeCost({
        model: m, inputTokens: modelTokens, outputTokens,
        cachePct: state.cacheOn ? state.cachePct : 0,
        batch: state.batch, requestsPerDay: state.requestsPerDay,
      });
      const longCtxActive = m.longCtxThreshold && modelTokens > m.longCtxThreshold;
      return {
        ...m,
        inputTokens: modelTokens,
        perRequest: r.perRequest,
        monthly: r.monthly,
        yearly: r.yearly,
        longCtxActive,
      };
    });
  }, [inputTokens, outputTokens, state, opusMult]);

  const sorted = useMemo(() => {
    const s = [...rows].sort((a, b) => {
      const va = a[sort.col]; const vb = b[sort.col];
      if (typeof va === "string") return sort.dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      return sort.dir === "asc" ? va - vb : vb - va;
    });
    return s;
  }, [rows, sort]);

  const cheapest = useMemo(() => {
    let min = Infinity, id = null;
    rows.forEach(r => { if (r.perRequest > 0 && r.perRequest < min) { min = r.perRequest; id = r.id; } });
    return id;
  }, [rows]);
  const bestValue = useMemo(() => {
    // cheapest that handles a typical "long context" job — ctx >= 200K
    let min = Infinity, id = null;
    rows.forEach(r => {
      if (r.ctx >= 200000 && r.perRequest > 0 && r.perRequest < min) { min = r.perRequest; id = r.id; }
    });
    return id;
  }, [rows]);

  const setCol = c => setSort(s => ({ col: c, dir: s.col === c && s.dir === "asc" ? "desc" : "asc" }));

  return (
    <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: 10 }}>
      <table className={"cmp-table" + (density === "compact" ? " compact" : "")}>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }} onClick={() => setCol("name")} className={sort.col === "name" ? "active" : ""}>Model</th>
            <th onClick={() => setCol("input")} className={sort.col === "input" ? "active" : ""}>$ in / M</th>
            <th onClick={() => setCol("output")} className={sort.col === "output" ? "active" : ""}>$ out / M</th>
            <th onClick={() => setCol("ctx")} className={sort.col === "ctx" ? "active" : ""}>Context</th>
            <th onClick={() => setCol("inputTokens")} className={sort.col === "inputTokens" ? "active" : ""}>Prompt toks</th>
            <th onClick={() => setCol("perRequest")} className={sort.col === "perRequest" ? "active" : ""}>$ / request</th>
            <th onClick={() => setCol("monthly")} className={sort.col === "monthly" ? "active" : ""}>$ / month</th>
            <th onClick={() => setCol("yearly")} className={sort.col === "yearly" ? "active" : ""}>$ / year</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(r => (
            <tr key={r.id} className={r.id === currentModelId ? "current" : ""}
              style={{ cursor: "pointer" }}
              onClick={() => onSelect(r.id)}>
              <td className="name">
                {r.name}
                {r.id === cheapest && <span className="badge cheap">cheapest</span>}
                {r.id === bestValue && r.id !== cheapest && <span className="badge value">best value</span>}
                {r.longCtxActive && <span className="badge tier-warn" title={`Over ${r.longCtxThreshold/1000}K tokens — billed at $${r.longCtxInput}/$${r.longCtxOutput}`}>⚠ 2× over {r.longCtxThreshold/1000}K</span>}
                {r.lastVerified === null && <span className="badge unverified" title="Pricing not independently verified">unverified</span>}
                <span className="prov">{r.provider}</span>
              </td>
              <td>
                ${r.input.toFixed(2)}
                {r.longCtxThreshold && <div className="tier-sub">→ ${r.longCtxInput.toFixed(2)} &gt;{r.longCtxThreshold/1000}K</div>}
              </td>
              <td>
                ${r.output.toFixed(2)}
                {r.longCtxThreshold && <div className="tier-sub">→ ${r.longCtxOutput.toFixed(2)} &gt;{r.longCtxThreshold/1000}K</div>}
              </td>
              <td>{r.ctx >= 1000000 ? (r.ctx/1000000) + "M" : (r.ctx/1000).toFixed(0) + "K"}</td>
              <td>{fmtInt(r.inputTokens)}</td>
              <td>{fmtUSD(r.perRequest, 4)}</td>
              <td>{fmtUSD(r.monthly, 2)}</td>
              <td>{fmtUSD(r.yearly, 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

Object.assign(window, {
  IconSun, IconMoon, IconInfo, IconAlert, IconCheck, IconCopy, IconChevron, IconZap, Icon,
  Tooltip, ModelSelector, TokenInput, TokenBadge, AdvancedPanel, OpusWarning, ResultsPanel, ComparisonTable,
});
