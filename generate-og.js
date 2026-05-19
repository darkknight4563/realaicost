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
  <g opacity="0.04" stroke="#4ECDC4" stroke-width="1">
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
  <rect x="80" y="60" width="44" height="44" rx="10" fill="#4ECDC4"/>
  <text x="102" y="90" font-family="monospace" font-size="24" font-weight="700" text-anchor="middle" fill="#0A0E1A">R</text>
  <text x="140" y="90" font-family="sans-serif" font-size="22" font-weight="600" fill="#E8EAED">RealAICost</text>

  <!-- Headline -->
  <text x="80" y="220" font-family="sans-serif" font-size="54" font-weight="700" fill="#E8EAED">The Honest</text>
  <text x="80" y="290" font-family="sans-serif" font-size="54" font-weight="700" fill="#4ECDC4">AI Cost Calculator</text>

  <!-- Subtitle -->
  <text x="80" y="350" font-family="sans-serif" font-size="24" fill="#9098a8">Claude · GPT · Gemini · 20+ models</text>

  <!-- Fake price cards -->
  <rect x="80" y="400" width="220" height="110" rx="10" fill="#141a2a" stroke="#1f2940" stroke-width="1"/>
  <text x="100" y="430" font-family="monospace" font-size="10" fill="#8b93a8" letter-spacing="1">ANTHROPIC</text>
  <text x="100" y="458" font-family="sans-serif" font-size="16" font-weight="600" fill="#E8EAED">Sonnet 4.6</text>
  <text x="100" y="492" font-family="monospace" font-size="26" font-weight="600" fill="#4ECDC4">$0.0312</text>

  <rect x="320" y="400" width="220" height="110" rx="10" fill="#141a2a" stroke="#1f2940" stroke-width="1"/>
  <text x="340" y="430" font-family="monospace" font-size="10" fill="#8b93a8" letter-spacing="1">OPENAI</text>
  <text x="340" y="458" font-family="sans-serif" font-size="16" font-weight="600" fill="#E8EAED">GPT-5.4</text>
  <text x="340" y="492" font-family="monospace" font-size="26" font-weight="600" fill="#E8EAED">$0.0287</text>

  <rect x="560" y="400" width="220" height="110" rx="10" fill="#141a2a" stroke="#1f2940" stroke-width="1"/>
  <text x="580" y="430" font-family="monospace" font-size="10" fill="#8b93a8" letter-spacing="1">GOOGLE</text>
  <text x="580" y="458" font-family="sans-serif" font-size="16" font-weight="600" fill="#E8EAED">Gemini 2.5 Pro</text>
  <text x="580" y="492" font-family="monospace" font-size="26" font-weight="600" fill="#E8EAED">$0.0218</text>

  <!-- Cheapest badge -->
  <rect x="560" y="490" width="80" height="18" rx="9" fill="#50FA7B" opacity="0.15"/>
  <text x="600" y="503" font-family="monospace" font-size="9" text-anchor="middle" fill="#50FA7B" letter-spacing="1">CHEAPEST</text>

  <!-- Domain -->
  <rect x="1000" y="560" width="160" height="36" rx="18" fill="#1f2940"/>
  <text x="1080" y="584" font-family="monospace" font-size="14" text-anchor="middle" fill="#4ECDC4">realaicost.com</text>
</svg>
`;

const resvg = new Resvg(SVG, { fitTo: { mode: "width", value: 1200 } });
const pngData = resvg.render();
fs.writeFileSync(path.join(__dirname, "og.png"), pngData.asPng());
console.log("✓ og.png generated (1200x630)");
