const {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback
} = React;
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
} /*EDITMODE-END*/;
const ACCENTS = {
  teal: {
    dark: "#4ECDC4",
    light: "#0aa89f"
  },
  violet: {
    dark: "#a78bfa",
    light: "#6d28d9"
  },
  amber: {
    dark: "#FFB86B",
    light: "#b35f00"
  },
  green: {
    dark: "#50FA7B",
    light: "#1a7f37"
  }
};

/* ------------------------------- URL state ------------------------------- */
function readURLState() {
  try {
    const p = new URLSearchParams(location.hash.slice(1));
    const get = (k, def) => p.get(k) ?? def;
    return {
      model: get("m", window.__defaultModel ?? "sonnet-4-6"),
      outputTokens: parseInt(get("o", "500")) || 500,
      requestsPerDay: parseInt(get("r", "1000")) || 1000,
      cacheOn: get("c", "1") === "1",
      cachePct: parseInt(get("cp", "70")) || 70,
      batch: get("b", "0") === "1",
      opusMult: parseFloat(get("om", "1.2")) || 1.2,
      prompt: p.get("t") ? decodeURIComponent(p.get("t")) : DEFAULT_PROMPT
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
    prompt: DEFAULT_PROMPT
  }, []);
  const [model, setModel] = useState(initial.model);
  const [prompt, setPrompt] = useState(initial.prompt);
  const [outputTokens, setOutputTokens] = useState(initial.outputTokens);
  const [requestsPerDay, setRequestsPerDay] = useState(initial.requestsPerDay);
  const [cacheOn, setCacheOn] = useState(initial.cacheOn);
  const [cachePct, setCachePct] = useState(initial.cachePct);
  const [batch, setBatch] = useState(initial.batch);
  const [opusMult, setOpusMult] = useState(initial.opusMult);
  const [custom, setCustom] = useState({
    input: 1,
    output: 3,
    ctx: 128000,
    cacheRead: null,
    tokenizer: "o200k"
  });

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
    writeURLState({
      model,
      outputTokens,
      requestsPerDay,
      cacheOn,
      cachePct,
      batch,
      opusMult,
      prompt
    });
  }, [model, outputTokens, requestsPerDay, cacheOn, cachePct, batch, opusMult, prompt]);
  const selectedModel = useMemo(() => {
    if (model === "custom") {
      return {
        id: "custom",
        name: "Custom model",
        provider: "Custom",
        input: custom.input,
        output: custom.output,
        ctx: custom.ctx,
        cacheRead: custom.cacheRead,
        cacheWrite: null,
        tokenizer: custom.tokenizer
      };
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
    requestsPerDay
  }), [selectedModel, inputTokens, outputTokens, cacheOn, cachePct, batch, requestsPerDay]);

  // pulse when result.perRequest changes (used for subtle highlight)
  useEffect(() => {
    setPulseKey(k => k + 1);
  }, [result.perRequest]);

  // Advanced panel derived helper
  const advState = {
    outputTokens,
    requestsPerDay,
    cacheOn,
    cachePct,
    batch
  };
  const setAdv = patch => {
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
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("header", {
    className: "topbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "brand"
  }, /*#__PURE__*/React.createElement("div", {
    className: "brand-mark"
  }, "R"), /*#__PURE__*/React.createElement("span", {
    className: "brand-name"
  }, "RealAICost"), /*#__PURE__*/React.createElement("span", {
    className: "brand-slash"
  }, "/"), /*#__PURE__*/React.createElement("span", {
    className: "brand-sub"
  }, "exact tokens, honest numbers")), /*#__PURE__*/React.createElement("div", {
    className: "topbar-links"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#comparison"
  }, "Compare"), /*#__PURE__*/React.createElement("a", {
    href: "#about"
  }, "About"), /*#__PURE__*/React.createElement("a", {
    href: "https://github.com",
    target: "_blank",
    rel: "noreferrer"
  }, "GitHub"), /*#__PURE__*/React.createElement("button", {
    className: "icon-btn",
    "aria-label": "Toggle dark mode",
    onClick: () => tweaks.setKeys({
      theme: tweaks.values.theme === "dark" ? "light" : "dark"
    }),
    title: "Toggle theme"
  }, tweaks.values.theme === "dark" ? /*#__PURE__*/React.createElement(IconSun, {
    size: 14
  }) : /*#__PURE__*/React.createElement(IconMoon, {
    size: 14
  })))), /*#__PURE__*/React.createElement("main", {
    className: "page"
  }, /*#__PURE__*/React.createElement("section", {
    className: "hero"
  }, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot"
  }), "live \xB7 no account \xB7 client-side"), /*#__PURE__*/React.createElement("h1", {
    className: "hero-title"
  }, "The ", /*#__PURE__*/React.createElement("span", {
    className: "accent"
  }, "honest"), " cost of running an LLM,", /*#__PURE__*/React.createElement("br", null), "down to four decimal places."), /*#__PURE__*/React.createElement("p", {
    className: "hero-sub"
  }, "Every other calculator quotes the sticker price. This one accounts for the things that actually move your bill: the ", /*#__PURE__*/React.createElement("code", null, "Opus 4.7"), " tokenizer change, prompt caching, batch discounts, and the fact that your RAG prompt is probably longer than you think.")), /*#__PURE__*/React.createElement("div", {
    className: "calc-grid"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel-header"
  }, /*#__PURE__*/React.createElement("span", null, "01 \u2014 Your prompt"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-faint)",
      textTransform: "none",
      fontFamily: "var(--font-sans)"
    }
  }, "counted with ", /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      color: "var(--text-dim)"
    }
  }, selectedModel.tokenizer))), /*#__PURE__*/React.createElement("div", {
    className: "panel-body"
  }, /*#__PURE__*/React.createElement(TokenInput, {
    value: prompt,
    onChange: setPrompt,
    model: selectedModel,
    opusMult: opusMult,
    onTokensResolved: (tok, src) => {
      setExactTokens(tok);
      setTokenSource(src);
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "panel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel-header"
  }, /*#__PURE__*/React.createElement("span", null, "02 \u2014 Model"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-faint)",
      textTransform: "none",
      fontFamily: "var(--font-sans)"
    }
  }, selectedModel.name, " \xB7 $", selectedModel.input, "/M in \xB7 $", selectedModel.output, "/M out")), /*#__PURE__*/React.createElement("div", {
    className: "panel-body"
  }, /*#__PURE__*/React.createElement(ModelSelector, {
    value: model,
    onChange: setModel,
    custom: custom,
    onCustomChange: setCustom
  })), isOpus47 && /*#__PURE__*/React.createElement(OpusWarning, {
    mult: opusMult,
    setMult: setOpusMult,
    usingApi: tokenSource === "api"
  }), /*#__PURE__*/React.createElement("button", {
    className: "advanced-toggle",
    onClick: () => setAdvOpen(v => !v)
  }, /*#__PURE__*/React.createElement("span", null, "03 \u2014 Advanced inputs"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      textTransform: "none",
      fontFamily: "var(--font-sans)"
    }
  }, outputTokens, " out \xB7 ", fmtInt(requestsPerDay), "/day", cacheOn && selectedModel.cacheRead != null && ` · ${cachePct}% cached`, batch && ` · batch −50%`), /*#__PURE__*/React.createElement(IconChevron, {
    size: 12,
    style: {
      transform: advOpen ? "rotate(180deg)" : "none",
      transition: "transform 160ms"
    }
  }))), advOpen && /*#__PURE__*/React.createElement(AdvancedPanel, {
    s: advState,
    setS: setAdv,
    modelHasCache: selectedModel.cacheRead != null
  })), /*#__PURE__*/React.createElement("div", {
    className: "share-bar"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-faint)"
    }
  }, "#"), /*#__PURE__*/React.createElement("input", {
    className: "share-url",
    "aria-label": "Shareable calculation URL",
    value: location.href,
    readOnly: true,
    onFocus: e => e.target.select()
  }), /*#__PURE__*/React.createElement("button", {
    className: "share-copy",
    onClick: copyURL
  }, copied ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(IconCheck, {
    size: 10
  }), " copied") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(IconCopy, {
    size: 10
  }), " copy link")))), /*#__PURE__*/React.createElement(ResultsPanel, {
    result: result,
    model: selectedModel,
    state: {
      requestsPerDay,
      textLength: prompt.length
    },
    onRecommend: setModel
  })), /*#__PURE__*/React.createElement("div", {
    id: "comparison",
    className: "section-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", null, "All models, same prompt"), /*#__PURE__*/React.createElement("p", null, "We tokenize your prompt through each provider\u2019s tokenizer (approximately), apply your settings, and rank. Click a row to make it the active model. The cheapest one rarely has the right context window."))), /*#__PURE__*/React.createElement(ComparisonTable, {
    inputTokens: inputTokens,
    outputTokens: outputTokens,
    state: {
      cacheOn,
      cachePct,
      batch,
      requestsPerDay,
      textLength: prompt.length
    },
    currentModelId: model,
    onSelect: setModel,
    density: tweaks.values.density,
    opusMult: opusMult
  }), /*#__PURE__*/React.createElement("section", {
    id: "about",
    className: "about"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "about-kicker"
  }, "About"), /*#__PURE__*/React.createElement("h2", null, "Why token prices lie.")), /*#__PURE__*/React.createElement("div", {
    className: "prose"
  }, /*#__PURE__*/React.createElement("p", null, "Every LLM vendor posts a tidy ", /*#__PURE__*/React.createElement("code", null, "$3 / $15 per million tokens"), " table. Those numbers are correct, and they\u2019re also misleading. Three things can turn a quoted price into a bill that is 2\u20135\xD7 higher than you expected."), /*#__PURE__*/React.createElement("h3", null, "1. The tokenizer is not neutral."), /*#__PURE__*/React.createElement("p", null, "A \u201Ctoken\u201D is whatever the model\u2019s tokenizer decided a token is. Anthropic\u2019s tokenizer, OpenAI\u2019s ", /*#__PURE__*/React.createElement("code", null, "o200k"), ", and Google\u2019s SentencePiece disagree on how to chop up the same English sentence \u2014 and they disagree far more on code, JSON, and anything other than English.", /*#__PURE__*/React.createElement("strong", null, " When Anthropic shipped Opus 4.7, the new tokenizer produced 1.0\u20131.46\xD7 more tokens than Opus 4.6"), " for the same input. At the same sticker price, that\u2019s a quiet 20% price hike on average and a 46% hike in the worst case."), /*#__PURE__*/React.createElement("h3", null, "2. Your prompt is longer than you think."), /*#__PURE__*/React.createElement("p", null, "The message your user types is a small fraction of what you send. System prompt, tool definitions, retrieved docs, conversation history \u2014 all of that is input tokens, every single request. We pre-loaded a RAG prompt that\u2019s probably closer to your actual shape than \u201Chello\u201D."), /*#__PURE__*/React.createElement("h3", null, "3. Caching and batching actually matter."), /*#__PURE__*/React.createElement("p", null, "Prompt caching drops input cost by up to 10\xD7 on the cached portion. Batch API drops the whole request by 50%. Most calculators pretend these don\u2019t exist. If you\u2019re running any kind of production workload without at least one of them, you\u2019re leaving real money on the table \u2014 toggle them above and watch."), /*#__PURE__*/React.createElement("h3", null, "What this tool is (and isn\u2019t)."), /*#__PURE__*/React.createElement("p", null, "It\u2019s a client-side calculator. No server, no account, no tracking, no ads. All math happens in your browser; share a URL and your settings travel with it. Tokenization is a character-based approximation calibrated per model family \u2014 accurate enough to make purchase decisions, but if you need an exact bill, tokenize with the vendor\u2019s official library.")))), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 900,
      margin: "0 auto",
      padding: "0 32px 40px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "mono",
    style: {
      fontSize: 11,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: "var(--text-faint)",
      marginBottom: 14
    }
  }, "Specific calculators"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "/calculator/claude-opus-4-7-cost/",
    style: {
      display: "block",
      padding: "12px 14px",
      border: "1px solid var(--border)",
      borderRadius: 8,
      background: "var(--bg-raised)",
      color: "var(--text)",
      textDecoration: "none",
      fontSize: 13,
      fontWeight: 500
    }
  }, "Claude Opus 4.7", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-faint)",
      fontWeight: 400
    }
  }, "New tokenizer cost impact")), /*#__PURE__*/React.createElement("a", {
    href: "/calculator/gpt-5-5-cost/",
    style: {
      display: "block",
      padding: "12px 14px",
      border: "1px solid var(--border)",
      borderRadius: 8,
      background: "var(--bg-raised)",
      color: "var(--text)",
      textDecoration: "none",
      fontSize: 13,
      fontWeight: 500
    }
  }, "GPT-5.5", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-faint)",
      fontWeight: 400
    }
  }, "2\xD7 price hike breakdown")), /*#__PURE__*/React.createElement("a", {
    href: "/calculator/gemini-2-5-pro-cost/",
    style: {
      display: "block",
      padding: "12px 14px",
      border: "1px solid var(--border)",
      borderRadius: 8,
      background: "var(--bg-raised)",
      color: "var(--text)",
      textDecoration: "none",
      fontSize: 13,
      fontWeight: 500
    }
  }, "Gemini 2.5 Pro", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-faint)",
      fontWeight: 400
    }
  }, "200K tier trap explained")), /*#__PURE__*/React.createElement("a", {
    href: "/compare/claude-vs-gpt/",
    style: {
      display: "block",
      padding: "12px 14px",
      border: "1px solid var(--border)",
      borderRadius: 8,
      background: "var(--bg-raised)",
      color: "var(--text)",
      textDecoration: "none",
      fontSize: 13,
      fontWeight: 500
    }
  }, "Claude vs GPT", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-faint)",
      fontWeight: 400
    }
  }, "Side-by-side comparison")), /*#__PURE__*/React.createElement("a", {
    href: "/calculator/llm-api-pricing/",
    style: {
      display: "block",
      padding: "12px 14px",
      border: "1px solid var(--border)",
      borderRadius: 8,
      background: "var(--bg-raised)",
      color: "var(--text)",
      textDecoration: "none",
      fontSize: 13,
      fontWeight: 500
    }
  }, "All LLMs", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-faint)",
      fontWeight: 400
    }
  }, "16 models, 5 providers")))), /*#__PURE__*/React.createElement("footer", {
    className: "footer"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "mono"
  }, "RealAICost \xB7 v0.7.0"), /*#__PURE__*/React.createElement("div", null, "Not affiliated with any model provider. Prices checked May 2026; verify against vendor docs before committing.")), /*#__PURE__*/React.createElement("section", {
    className: "recent-posts"
  }, /*#__PURE__*/React.createElement("h3", null, "Recent analysis"), /*#__PURE__*/React.createElement("a", {
    href: "/blog/long-context-cost/"
  }, "The Hidden Cost of Long Context Windows"), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("a", {
    href: "/blog/gpt-5-5-cost-tax/",
    style: {
      marginTop: 4,
      display: "inline-block"
    }
  }, "GPT-5.5 Costs 2\xD7 More Than GPT-5.4 for the Same Job")), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "mono"
  }, "press ", /*#__PURE__*/React.createElement("kbd", {
    style: {
      border: "1px solid var(--border)",
      borderRadius: 4,
      padding: "1px 5px",
      fontFamily: "var(--font-mono)",
      fontSize: 11
    }
  }, "?"), " for tweaks"))), /*#__PURE__*/React.createElement(TweaksPanel, {
    title: "Tweaks",
    tweaks: tweaks
  }, /*#__PURE__*/React.createElement(TweakSection, {
    title: "Appearance"
  }, /*#__PURE__*/React.createElement(TweakRadio, {
    tweaks: tweaks,
    k: "theme",
    label: "Theme",
    options: [{
      value: "dark",
      label: "Dark"
    }, {
      value: "light",
      label: "Light"
    }]
  }), /*#__PURE__*/React.createElement(TweakRadio, {
    tweaks: tweaks,
    k: "accent",
    label: "Accent",
    options: [{
      value: "teal",
      label: "Teal"
    }, {
      value: "violet",
      label: "Violet"
    }, {
      value: "amber",
      label: "Amber"
    }, {
      value: "green",
      label: "Green"
    }]
  }), /*#__PURE__*/React.createElement(TweakSelect, {
    tweaks: tweaks,
    k: "font",
    label: "Font",
    options: [{
      value: "inter",
      label: "Inter + JetBrains Mono"
    }, {
      value: "geist",
      label: "Geist + Geist Mono"
    }, {
      value: "ibm",
      label: "IBM Plex Sans + Mono"
    }, {
      value: "system",
      label: "System default"
    }]
  })), /*#__PURE__*/React.createElement(TweakSection, {
    title: "Table"
  }, /*#__PURE__*/React.createElement(TweakRadio, {
    tweaks: tweaks,
    k: "density",
    label: "Density",
    options: [{
      value: "roomy",
      label: "Roomy"
    }, {
      value: "compact",
      label: "Compact"
    }]
  }))));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(App, null));