function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback
} = React;

/* ------------------------------- Icons (inline SVG, lucide-style) ------------------------------- */
const Icon = ({
  children,
  size = 14,
  ...rest
}) => /*#__PURE__*/React.createElement("svg", _extends({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, rest), children);
const IconSun = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "4"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
}));
const IconMoon = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
  d: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
}));
const IconInfo = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "10"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 16v-4M12 8h.01"
}));
const IconAlert = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
  d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 9v4M12 17h.01"
}));
const IconCheck = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
  d: "M20 6L9 17l-5-5"
}));
const IconCopy = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("rect", {
  x: "9",
  y: "9",
  width: "13",
  height: "13",
  rx: "2"
}), /*#__PURE__*/React.createElement("path", {
  d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
}));
const IconChevron = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("polyline", {
  points: "6 9 12 15 18 9"
}));
const IconZap = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("polygon", {
  points: "13 2 3 14 12 14 11 22 21 10 12 10 13 2"
}));
const IconSlash = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("line", {
  x1: "18",
  y1: "6",
  x2: "6",
  y2: "18"
}));

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
    const tick = t => {
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
function Tooltip({
  text,
  children
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "help-dot",
    title: text
  }, "?");
}

/* ------------------------------- Model Selector ------------------------------- */
function ModelSelector({
  value,
  onChange,
  custom,
  onCustomChange
}) {
  const groups = useMemo(() => {
    const m = {};
    MODELS.forEach(x => {
      (m[x.provider] = m[x.provider] || []).push(x);
    });
    return m;
  }, []);
  return /*#__PURE__*/React.createElement("div", null, Object.entries(groups).map(([prov, list]) => /*#__PURE__*/React.createElement("div", {
    key: prov,
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "var(--text-faint)",
      marginBottom: 6
    }
  }, prov), /*#__PURE__*/React.createElement("div", {
    className: "model-grid"
  }, list.map(m => /*#__PURE__*/React.createElement("button", {
    key: m.id,
    className: "model-card" + (value === m.id ? " selected" : ""),
    onClick: () => onChange(m.id)
  }, /*#__PURE__*/React.createElement("div", {
    className: "mc-provider"
  }, m.provider, m.tags?.includes("new") && /*#__PURE__*/React.createElement("span", {
    className: "mc-tag mc-tag-new"
  }, "new"), m.tags?.includes("legacy") && /*#__PURE__*/React.createElement("span", {
    className: "mc-tag mc-tag-legacy"
  }, "legacy"), m.longCtxThreshold && /*#__PURE__*/React.createElement("span", {
    className: "mc-tag mc-tag-tiered",
    title: `$${m.longCtxInput}/$${m.longCtxOutput} over ${m.longCtxThreshold / 1000}K tokens`
  }, "tiered"), m.lastVerified === null && /*#__PURE__*/React.createElement("span", {
    className: "mc-tag mc-tag-unverified",
    title: "Pricing not independently verified"
  }, "unverified")), /*#__PURE__*/React.createElement("div", {
    className: "mc-name"
  }, m.name), /*#__PURE__*/React.createElement("div", {
    className: "mc-meta"
  }, /*#__PURE__*/React.createElement("span", null, "$", m.input, /*#__PURE__*/React.createElement("span", {
    className: "slash"
  }, "/"), "$", m.output), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-faint)"
    }
  }, m.ctx >= 1000000 ? m.ctx / 1000000 + "M" : (m.ctx / 1000).toFixed(0) + "K", " ctx")), m.release && /*#__PURE__*/React.createElement("div", {
    className: "mc-release"
  }, fmtReleaseDate(m.release), m.lastVerified && /*#__PURE__*/React.createElement("span", {
    className: "mc-verified-dot",
    title: `Verified ${m.lastVerified}`
  }, "\xB7"))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "var(--text-faint)",
      marginBottom: 6
    }
  }, "Custom"), /*#__PURE__*/React.createElement("button", {
    className: "model-card custom" + (value === "custom" ? " selected" : ""),
    style: {
      width: "100%"
    },
    onClick: () => onChange("custom")
  }, /*#__PURE__*/React.createElement("div", {
    className: "mc-provider"
  }, "Your model"), /*#__PURE__*/React.createElement("div", {
    className: "mc-name"
  }, "Custom pricing"), value === "custom" ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      marginTop: 10,
      flexWrap: "wrap"
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      color: "var(--text-dim)",
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, "$in/M ", /*#__PURE__*/React.createElement("input", {
    type: "number",
    "aria-label": "Custom model input price per million tokens",
    className: "num-input",
    value: custom.input,
    onChange: e => onCustomChange({
      ...custom,
      input: parseFloat(e.target.value) || 0
    }),
    step: "0.01",
    style: {
      width: 80
    }
  })), /*#__PURE__*/React.createElement("label", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      color: "var(--text-dim)",
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, "$out/M ", /*#__PURE__*/React.createElement("input", {
    type: "number",
    "aria-label": "Custom model output price per million tokens",
    className: "num-input",
    value: custom.output,
    onChange: e => onCustomChange({
      ...custom,
      output: parseFloat(e.target.value) || 0
    }),
    step: "0.01",
    style: {
      width: 80
    }
  })), /*#__PURE__*/React.createElement("label", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      color: "var(--text-dim)",
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, "ctx ", /*#__PURE__*/React.createElement("input", {
    type: "number",
    "aria-label": "Custom model context window size",
    className: "num-input",
    value: custom.ctx,
    onChange: e => onCustomChange({
      ...custom,
      ctx: parseInt(e.target.value) || 0
    }),
    step: "1000",
    style: {
      width: 90
    }
  }))) : /*#__PURE__*/React.createElement("div", {
    className: "mc-meta"
  }, /*#__PURE__*/React.createElement("span", null, "Override prices"))));
}

/* ------------------------------- Token Input ------------------------------- */
function TokenBadge({
  source,
  pending,
  loadingTokenizer
}) {
  if (loadingTokenizer) {
    return /*#__PURE__*/React.createElement("span", {
      className: "tt-badge tt-badge-loading"
    }, "loading tokenizer\u2026");
  }
  if (pending) {
    return /*#__PURE__*/React.createElement("span", {
      className: "tt-badge tt-badge-pending"
    }, "counting\u2026");
  }
  if (source === "tiktoken" || source === "api") {
    return /*#__PURE__*/React.createElement("span", {
      className: "tt-badge tt-badge-verified"
    }, /*#__PURE__*/React.createElement(IconCheck, {
      size: 10
    }), " verified");
  }
  if (source === "fallback") {
    return /*#__PURE__*/React.createElement("span", {
      className: "tt-badge tt-badge-estimated"
    }, /*#__PURE__*/React.createElement(IconInfo, {
      size: 10
    }), " estimated");
  }
  return null;
}
function TokenInfoPopover({
  onClose
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "tt-popover",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "tt-popover-title"
  }, "How counting works"), /*#__PURE__*/React.createElement("ul", {
    className: "tt-popover-list"
  }, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("strong", null, "OpenAI"), " counts use tiktoken (exact, client-side)."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("strong", null, "Anthropic & Google"), " counts come from their official counting APIs via our proxy, cached for 1 hour."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("strong", null, "Meta / Llama"), " counts are character-based approximations \u2014 no free count API is currently available."), /*#__PURE__*/React.createElement("li", null, "Actual billing may differ by 5\u201310 tokens due to provider-side system overhead.")), /*#__PURE__*/React.createElement("button", {
    className: "tt-popover-close",
    onClick: onClose
  }, "got it"));
}
function TokenInput({
  value,
  onChange,
  model,
  opusMult,
  onTokensResolved
}) {
  const chars = value.length;
  const state = useTokenCount(model, value, opusMult, 500);
  const [popoverOpen, setPopoverOpen] = useState(false);
  useEffect(() => {
    if (!state.pending && typeof onTokensResolved === "function") {
      onTokensResolved(state.tokens, state.source);
    }
  }, [state.tokens, state.source, state.pending]);
  const tokenizerLabel = state.source === "tiktoken" ? "tiktoken · " + (Tokenizer.OPENAI_ENCODING[model?.id] || "o200k_base") : state.source === "api" ? model?.provider === "Anthropic" ? "anthropic api" : "gemini api" : state.source === "fallback" ? "char approx" : model?.tokenizer || "—";
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("textarea", {
    className: "token-input",
    value: value,
    onChange: e => onChange(e.target.value),
    placeholder: "Paste your prompt here. Include your full system prompt, tool definitions, and any RAG context you pass every request \u2014 that's what you actually pay for.",
    spellCheck: false
  }), /*#__PURE__*/React.createElement("div", {
    className: "counter-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "counter-cell"
  }, /*#__PURE__*/React.createElement("span", {
    className: "counter-label"
  }, "chars"), /*#__PURE__*/React.createElement("span", {
    className: "counter-value"
  }, fmtInt(chars))), /*#__PURE__*/React.createElement("div", {
    className: "counter-cell"
  }, /*#__PURE__*/React.createElement("span", {
    className: "counter-label"
  }, "input tokens"), /*#__PURE__*/React.createElement("span", {
    className: "counter-value highlight" + (state.pending ? " tt-count-pulse" : "")
  }, fmtInt(state.tokens))), /*#__PURE__*/React.createElement("div", {
    className: "counter-cell",
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "counter-label"
  }, "source", /*#__PURE__*/React.createElement("button", {
    className: "tt-info-btn",
    onClick: () => setPopoverOpen(v => !v),
    "aria-label": "How counting works"
  }, /*#__PURE__*/React.createElement(IconInfo, {
    size: 11
  }))), /*#__PURE__*/React.createElement("span", {
    className: "counter-value"
  }, /*#__PURE__*/React.createElement(TokenBadge, {
    source: state.source,
    pending: state.pending,
    loadingTokenizer: state.loadingTokenizer
  })), popoverOpen && /*#__PURE__*/React.createElement(TokenInfoPopover, {
    onClose: () => setPopoverOpen(false)
  })), /*#__PURE__*/React.createElement("div", {
    className: "counter-cell",
    style: {
      marginLeft: "auto"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "counter-label"
  }, "tokenizer"), /*#__PURE__*/React.createElement("span", {
    className: "counter-value",
    style: {
      fontSize: 11
    }
  }, tokenizerLabel))));
}

/* ------------------------------- Advanced Panel ------------------------------- */
function AdvancedPanel({
  s,
  setS,
  modelHasCache
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "advanced-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "row-label"
  }, "Expected output tokens", /*#__PURE__*/React.createElement("span", {
    className: "sub"
  }, "per response")), /*#__PURE__*/React.createElement("input", {
    type: "range",
    "aria-label": "Expected output tokens (slider)",
    className: "slider",
    min: "0",
    max: "8000",
    step: "50",
    value: s.outputTokens,
    onChange: e => setS({
      outputTokens: parseInt(e.target.value)
    })
  }), /*#__PURE__*/React.createElement("input", {
    type: "number",
    "aria-label": "Expected output tokens (numeric)",
    className: "num-input",
    value: s.outputTokens,
    onChange: e => setS({
      outputTokens: parseInt(e.target.value) || 0
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "row-label"
  }, "Requests per day", /*#__PURE__*/React.createElement("span", {
    className: "sub"
  }, "volume estimate")), /*#__PURE__*/React.createElement("input", {
    type: "range",
    "aria-label": "Requests per day (slider)",
    className: "slider",
    min: "0",
    max: "100000",
    step: "100",
    value: Math.min(100000, s.requestsPerDay),
    onChange: e => setS({
      requestsPerDay: parseInt(e.target.value)
    })
  }), /*#__PURE__*/React.createElement("input", {
    type: "number",
    "aria-label": "Requests per day (numeric)",
    className: "num-input",
    value: s.requestsPerDay,
    onChange: e => setS({
      requestsPerDay: parseInt(e.target.value) || 0
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "row-label"
  }, "Prompt caching", /*#__PURE__*/React.createElement("span", {
    className: "sub"
  }, modelHasCache ? "cached input at discounted rate" : "not supported for this model")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "toggle",
    role: "switch",
    "aria-label": "Enable prompt caching",
    "aria-checked": s.cacheOn,
    disabled: !modelHasCache,
    onClick: () => setS({
      cacheOn: !s.cacheOn
    })
  }), s.cacheOn && modelHasCache && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("input", {
    type: "range",
    "aria-label": "Cache hit percentage",
    className: "slider",
    min: "0",
    max: "100",
    step: "1",
    style: {
      flex: 1,
      minWidth: 120
    },
    value: s.cachePct,
    onChange: e => setS({
      cachePct: parseInt(e.target.value)
    })
  }), /*#__PURE__*/React.createElement("span", {
    className: "row-value"
  }, s.cachePct, "%"))), /*#__PURE__*/React.createElement("div", null)), /*#__PURE__*/React.createElement("div", {
    className: "row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "row-label"
  }, "Batch API", /*#__PURE__*/React.createElement("span", {
    className: "sub"
  }, "50% off, async processing")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
    className: "toggle",
    role: "switch",
    "aria-label": "Enable Batch API discount",
    "aria-checked": s.batch,
    onClick: () => setS({
      batch: !s.batch
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "row-value"
  }, s.batch ? "−50%" : "off")));
}

/* ------------------------------- Opus Warning ------------------------------- */
function OpusWarning({
  mult,
  setMult,
  usingApi
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "warning"
  }, /*#__PURE__*/React.createElement("span", {
    className: "warning-icon"
  }, /*#__PURE__*/React.createElement(IconAlert, {
    size: 16
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("strong", null, "Opus 4.7 uses a new tokenizer."), " It produces 1.0\u20131.46\xD7 more tokens than Opus 4.6 for the same text \u2014 more verbose on code, JSON, and non-English. ", usingApi ? "You're getting exact counts from Anthropic's API, so the multiplier below is informational only." : "We apply a 1.2× average multiplier by default. Adjust if you've measured your own ratio.", /*#__PURE__*/React.createElement("div", {
    className: "warning-slider",
    style: usingApi ? {
      opacity: 0.5
    } : {}
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    "aria-label": "Opus 4.7 token multiplier",
    className: "slider",
    min: "1.0",
    max: "1.46",
    step: "0.01",
    value: mult,
    disabled: usingApi,
    onChange: e => setMult(parseFloat(e.target.value))
  }), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 12,
      color: "var(--warn)"
    }
  }, mult.toFixed(2), "\xD7 ", usingApi && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-faint)"
    }
  }, "(not applied)")))));
}

/* ------------------------------- Results Panel ------------------------------- */
function AnimatedUSD({
  value,
  decimals = 4,
  big = false
}) {
  const display = useAnimatedNumber(value, 220);
  return /*#__PURE__*/React.createElement("span", {
    className: "tabular"
  }, fmtUSD(display, decimals));
}
function ResultsPanel({
  result,
  model,
  state,
  onRecommend
}) {
  const totalBillable = result.breakdown.input + result.breakdown.cache + result.breakdown.output;
  const pctInput = totalBillable ? result.breakdown.input / totalBillable * 100 : 0;
  const pctCache = totalBillable ? result.breakdown.cache / totalBillable * 100 : 0;
  const pctOutput = totalBillable ? result.breakdown.output / totalBillable * 100 : 0;

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
    return {
      target: sonnet,
      save
    };
  }, [model, result.monthly]);
  return /*#__PURE__*/React.createElement("div", {
    className: "panel results"
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel-header"
  }, /*#__PURE__*/React.createElement("span", null, "Results"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-faint)",
      textTransform: "none",
      fontFamily: "var(--font-sans)"
    }
  }, "live")), /*#__PURE__*/React.createElement("div", {
    className: "panel-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "results-kpis"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi big"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi-label"
  }, "Cost per request"), /*#__PURE__*/React.createElement("div", {
    className: "kpi-value"
  }, /*#__PURE__*/React.createElement(AnimatedUSD, {
    value: result.perRequest,
    decimals: 4
  }))), /*#__PURE__*/React.createElement("div", {
    className: "kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi-label"
  }, "Per day"), /*#__PURE__*/React.createElement("div", {
    className: "kpi-value"
  }, /*#__PURE__*/React.createElement(AnimatedUSD, {
    value: result.daily,
    decimals: 2
  }))), /*#__PURE__*/React.createElement("div", {
    className: "kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi-label"
  }, "Per month"), /*#__PURE__*/React.createElement("div", {
    className: "kpi-value"
  }, /*#__PURE__*/React.createElement(AnimatedUSD, {
    value: result.monthly,
    decimals: 2
  }))), /*#__PURE__*/React.createElement("div", {
    className: "kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi-label"
  }, "Per year"), /*#__PURE__*/React.createElement("div", {
    className: "kpi-value"
  }, /*#__PURE__*/React.createElement(AnimatedUSD, {
    value: result.yearly,
    decimals: 0
  }))), /*#__PURE__*/React.createElement("div", {
    className: "kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi-label"
  }, "Vol / month"), /*#__PURE__*/React.createElement("div", {
    className: "kpi-value tabular"
  }, fmtInt(state.requestsPerDay * 30)))), /*#__PURE__*/React.createElement("div", {
    className: "breakdown"
  }, /*#__PURE__*/React.createElement("div", {
    className: "breakdown-title"
  }, "Cost breakdown \u2014 per request"), /*#__PURE__*/React.createElement("div", {
    className: "bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bar-seg bar-input",
    style: {
      width: pctInput + "%"
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "bar-seg bar-cache",
    style: {
      width: pctCache + "%"
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "bar-seg bar-output",
    style: {
      width: pctOutput + "%"
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "legend"
  }, /*#__PURE__*/React.createElement("div", {
    className: "legend-row"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    className: "dot",
    style: {
      background: "var(--accent)"
    }
  }), "Input"), /*#__PURE__*/React.createElement("span", {
    className: "amt"
  }, fmtUSD(result.breakdown.input, 5))), /*#__PURE__*/React.createElement("div", {
    className: "legend-row"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    className: "dot",
    style: {
      background: "color-mix(in srgb, var(--accent) 50%, #6b72ff)"
    }
  }), "Output"), /*#__PURE__*/React.createElement("span", {
    className: "amt"
  }, fmtUSD(result.breakdown.output, 5))), /*#__PURE__*/React.createElement("div", {
    className: "legend-row"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    className: "dot",
    style: {
      background: "color-mix(in srgb, var(--good) 70%, var(--bg))"
    }
  }), "Cached input"), /*#__PURE__*/React.createElement("span", {
    className: "amt"
  }, fmtUSD(result.breakdown.cache, 5))), result.breakdown.cacheSavings > 0 && /*#__PURE__*/React.createElement("div", {
    className: "legend-row savings"
  }, /*#__PURE__*/React.createElement("span", null, "Cache savings"), /*#__PURE__*/React.createElement("span", {
    className: "amt"
  }, "\u2212", fmtUSD(result.breakdown.cacheSavings, 5))), result.breakdown.batchSavings > 0 && /*#__PURE__*/React.createElement("div", {
    className: "legend-row savings"
  }, /*#__PURE__*/React.createElement("span", null, "Batch savings"), /*#__PURE__*/React.createElement("span", {
    className: "amt"
  }, "\u2212", fmtUSD(result.breakdown.batchSavings, 5))))), recommendation && /*#__PURE__*/React.createElement("div", {
    className: "recommendation"
  }, /*#__PURE__*/React.createElement(IconZap, {
    size: 16,
    style: {
      color: "var(--good)",
      flexShrink: 0,
      marginTop: 2
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "Switch to ", recommendation.target.name), " to save about ", /*#__PURE__*/React.createElement("strong", null, fmtUSD(recommendation.save, 2), "/month"), " at this volume.", " ", /*#__PURE__*/React.createElement("button", {
    className: "rec-link",
    onClick: () => onRecommend(recommendation.target.id)
  }, "Try it \u2192")))));
}

/* ------------------------------- Comparison Table ------------------------------- */
function ComparisonTable({
  inputTokens,
  outputTokens,
  state,
  currentModelId,
  onSelect,
  density,
  opusMult
}) {
  const [sort, setSort] = useState({
    col: "perRequest",
    dir: "asc"
  });
  const rows = useMemo(() => {
    return MODELS.map(m => {
      // recompute tokens for each model's tokenizer
      const tok = TOKENIZER_RATIOS[m.tokenizer] || 3.5;
      let ratio = tok;
      if (m.tokenizer === "claude-opus-4-7") ratio = TOKENIZER_RATIOS["claude"] / opusMult;
      const modelTokens = state.textLength ? Math.max(1, Math.round(state.textLength / ratio)) : inputTokens;
      const r = computeCost({
        model: m,
        inputTokens: modelTokens,
        outputTokens,
        cachePct: state.cacheOn ? state.cachePct : 0,
        batch: state.batch,
        requestsPerDay: state.requestsPerDay
      });
      const longCtxActive = m.longCtxThreshold && modelTokens > m.longCtxThreshold;
      return {
        ...m,
        inputTokens: modelTokens,
        perRequest: r.perRequest,
        monthly: r.monthly,
        yearly: r.yearly,
        longCtxActive
      };
    });
  }, [inputTokens, outputTokens, state, opusMult]);
  const sorted = useMemo(() => {
    const s = [...rows].sort((a, b) => {
      const va = a[sort.col];
      const vb = b[sort.col];
      if (typeof va === "string") return sort.dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      return sort.dir === "asc" ? va - vb : vb - va;
    });
    return s;
  }, [rows, sort]);
  const cheapest = useMemo(() => {
    let min = Infinity,
      id = null;
    rows.forEach(r => {
      if (r.perRequest > 0 && r.perRequest < min) {
        min = r.perRequest;
        id = r.id;
      }
    });
    return id;
  }, [rows]);
  const bestValue = useMemo(() => {
    // cheapest that handles a typical "long context" job — ctx >= 200K
    let min = Infinity,
      id = null;
    rows.forEach(r => {
      if (r.ctx >= 200000 && r.perRequest > 0 && r.perRequest < min) {
        min = r.perRequest;
        id = r.id;
      }
    });
    return id;
  }, [rows]);
  const setCol = c => setSort(s => ({
    col: c,
    dir: s.col === c && s.dir === "asc" ? "desc" : "asc"
  }));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      overflowX: "auto",
      border: "1px solid var(--border)",
      borderRadius: 10
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "cmp-table" + (density === "compact" ? " compact" : "")
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "left"
    },
    onClick: () => setCol("name"),
    className: sort.col === "name" ? "active" : ""
  }, "Model"), /*#__PURE__*/React.createElement("th", {
    onClick: () => setCol("input"),
    className: sort.col === "input" ? "active" : ""
  }, "$ in / M"), /*#__PURE__*/React.createElement("th", {
    onClick: () => setCol("output"),
    className: sort.col === "output" ? "active" : ""
  }, "$ out / M"), /*#__PURE__*/React.createElement("th", {
    onClick: () => setCol("ctx"),
    className: sort.col === "ctx" ? "active" : ""
  }, "Context"), /*#__PURE__*/React.createElement("th", {
    onClick: () => setCol("inputTokens"),
    className: sort.col === "inputTokens" ? "active" : ""
  }, "Prompt toks"), /*#__PURE__*/React.createElement("th", {
    onClick: () => setCol("perRequest"),
    className: sort.col === "perRequest" ? "active" : ""
  }, "$ / request"), /*#__PURE__*/React.createElement("th", {
    onClick: () => setCol("monthly"),
    className: sort.col === "monthly" ? "active" : ""
  }, "$ / month"), /*#__PURE__*/React.createElement("th", {
    onClick: () => setCol("yearly"),
    className: sort.col === "yearly" ? "active" : ""
  }, "$ / year"))), /*#__PURE__*/React.createElement("tbody", null, sorted.map(r => /*#__PURE__*/React.createElement("tr", {
    key: r.id,
    className: r.id === currentModelId ? "current" : "",
    style: {
      cursor: "pointer"
    },
    onClick: () => onSelect(r.id)
  }, /*#__PURE__*/React.createElement("td", {
    className: "name"
  }, r.name, r.id === cheapest && /*#__PURE__*/React.createElement("span", {
    className: "badge cheap"
  }, "cheapest"), r.id === bestValue && r.id !== cheapest && /*#__PURE__*/React.createElement("span", {
    className: "badge value"
  }, "best value"), r.longCtxActive && /*#__PURE__*/React.createElement("span", {
    className: "badge tier-warn",
    title: `Over ${r.longCtxThreshold / 1000}K tokens — billed at $${r.longCtxInput}/$${r.longCtxOutput}`
  }, "\u26A0 2\xD7 over ", r.longCtxThreshold / 1000, "K"), r.lastVerified === null && /*#__PURE__*/React.createElement("span", {
    className: "badge unverified",
    title: "Pricing not independently verified"
  }, "unverified"), /*#__PURE__*/React.createElement("span", {
    className: "prov"
  }, r.provider)), /*#__PURE__*/React.createElement("td", null, "$", r.input.toFixed(2), r.longCtxThreshold && /*#__PURE__*/React.createElement("div", {
    className: "tier-sub"
  }, "\u2192 $", r.longCtxInput.toFixed(2), " >", r.longCtxThreshold / 1000, "K")), /*#__PURE__*/React.createElement("td", null, "$", r.output.toFixed(2), r.longCtxThreshold && /*#__PURE__*/React.createElement("div", {
    className: "tier-sub"
  }, "\u2192 $", r.longCtxOutput.toFixed(2), " >", r.longCtxThreshold / 1000, "K")), /*#__PURE__*/React.createElement("td", null, r.ctx >= 1000000 ? r.ctx / 1000000 + "M" : (r.ctx / 1000).toFixed(0) + "K"), /*#__PURE__*/React.createElement("td", null, fmtInt(r.inputTokens)), /*#__PURE__*/React.createElement("td", null, fmtUSD(r.perRequest, 4)), /*#__PURE__*/React.createElement("td", null, fmtUSD(r.monthly, 2)), /*#__PURE__*/React.createElement("td", null, fmtUSD(r.yearly, 0)))))));
}
Object.assign(window, {
  IconSun,
  IconMoon,
  IconInfo,
  IconAlert,
  IconCheck,
  IconCopy,
  IconChevron,
  IconZap,
  Icon,
  Tooltip,
  ModelSelector,
  TokenInput,
  TokenBadge,
  AdvancedPanel,
  OpusWarning,
  ResultsPanel,
  ComparisonTable
});