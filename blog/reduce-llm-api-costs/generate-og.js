const { Resvg } = require("@resvg/resvg-js");
const fs = require("fs");
const path = require("path");

const SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0A0E1A"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Grid -->
  <g opacity="0.04" stroke="#10b981" stroke-width="1">
    <line x1="0" y1="100" x2="1200" y2="100"/>
    <line x1="0" y1="200" x2="1200" y2="200"/>
    <line x1="0" y1="300" x2="1200" y2="300"/>
    <line x1="0" y1="400" x2="1200" y2="400"/>
    <line x1="0" y1="500" x2="1200" y2="500"/>
    <line x1="200" y1="0" x2="200" y2="630"/>
    <line x1="400" y1="0" x2="400" y2="630"/>
    <line x1="600" y1="0" x2="600" y2="630"/>
    <line x1="800" y1="0" x2="800" y2="630"/>
    <line x1="1000" y1="0" x2="1000" y2="630"/>
  </g>

  <!-- Brand mark -->
  <rect x="80" y="60" width="44" height="44" rx="10" fill="#10b981"/>
  <text x="102" y="90" font-family="monospace" font-size="24" font-weight="700" text-anchor="middle" fill="#fff">R</text>
  <text x="140" y="90" font-family="sans-serif" font-size="22" font-weight="600" fill="#E8EAED">RealAICost</text>

  <!-- Label -->
  <text x="80" y="180" font-family="monospace" font-size="13" fill="#10b981" letter-spacing="2">COST OPTIMIZATION</text>

  <!-- Headline -->
  <text x="80" y="240" font-family="sans-serif" font-size="48" font-weight="700" fill="#E8EAED">How to Reduce</text>
  <text x="80" y="300" font-family="sans-serif" font-size="48" font-weight="700" fill="#10b981">LLM API Costs</text>
  <text x="80" y="355" font-family="sans-serif" font-size="28" font-weight="500" fill="#9098a8">7 strategies that actually work</text>

  <!-- Savings badges -->
  <rect x="80" y="410" width="180" height="80" rx="10" fill="#141a2a" stroke="#1f2940" stroke-width="1"/>
  <text x="100" y="438" font-family="monospace" font-size="10" fill="#8b93a8" letter-spacing="1">PROMPT CACHING</text>
  <text x="100" y="472" font-family="monospace" font-size="28" font-weight="600" fill="#10b981">-60%</text>

  <rect x="280" y="410" width="180" height="80" rx="10" fill="#141a2a" stroke="#1f2940" stroke-width="1"/>
  <text x="300" y="438" font-family="monospace" font-size="10" fill="#8b93a8" letter-spacing="1">BATCH API</text>
  <text x="300" y="472" font-family="monospace" font-size="28" font-weight="600" fill="#10b981">-50%</text>

  <rect x="480" y="410" width="180" height="80" rx="10" fill="#141a2a" stroke="#1f2940" stroke-width="1"/>
  <text x="500" y="438" font-family="monospace" font-size="10" fill="#8b93a8" letter-spacing="1">MODEL ROUTING</text>
  <text x="500" y="472" font-family="monospace" font-size="28" font-weight="600" fill="#10b981">-80%</text>

  <rect x="680" y="410" width="180" height="80" rx="10" fill="#141a2a" stroke="#1f2940" stroke-width="1"/>
  <text x="700" y="438" font-family="monospace" font-size="10" fill="#8b93a8" letter-spacing="1">PROMPT TRIMMING</text>
  <text x="700" y="472" font-family="monospace" font-size="28" font-weight="600" fill="#10b981">-30%</text>

  <!-- Stacked label -->
  <rect x="80" y="510" width="200" height="28" rx="14" fill="#10b981" opacity="0.15"/>
  <text x="180" y="529" font-family="monospace" font-size="12" text-anchor="middle" fill="#10b981" letter-spacing="1">STACKED: UP TO -73%</text>

  <!-- Domain -->
  <rect x="1000" y="560" width="160" height="36" rx="18" fill="#1f2940"/>
  <text x="1080" y="584" font-family="monospace" font-size="14" text-anchor="middle" fill="#10b981">realaicost.com</text>
</svg>
`;

const resvg = new Resvg(SVG, { fitTo: { mode: "width", value: 1200 } });
const pngData = resvg.render();
fs.writeFileSync(path.join(__dirname, "og.png"), pngData.asPng());
console.log("og.png generated (1200x630)");
