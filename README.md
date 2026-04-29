# RealAICost

The honest LLM pricing calculator. Live at [realaicost.com](https://realaicost.com).

## What it does

Calculates real cost of running Claude, GPT, Gemini, DeepSeek, and Llama models — accounting for the things other calculators miss:

- Tokenizer differences (especially Opus 4.7's new tokenizer that produces 1.0–1.46x more tokens)
- Prompt caching discounts (up to 90% off cached input)
- Batch API discounts (50% off async)
- Context-tiered pricing (Gemini Pro models double over 200K tokens)

Token counts are exact for OpenAI (client-side via tiktoken) and exact for Anthropic/Google (via official counting APIs through a same-origin proxy). Llama and DeepSeek use character-based approximations.

## Stack

- Static HTML + Babel JSX (client-side rendering)
- Cloudflare Pages Functions for token-counting proxy
- No build step, no framework lock-in
- No tracking, no accounts, no ads

## Local development

Open `index.html` in a browser. That's it.

## Deployment

Auto-deploys to Cloudflare Pages on every push to `main`. Requires these env vars in Cloudflare:

- `ANTHROPIC_API_KEY` — for Claude token counting
- `GOOGLE_API_KEY` — for Gemini token counting

## Pricing data

All prices verified against vendor pricing pages on the dates shown in `data.jsx`. Prices marked `unverified` come from third-party hosts and display an amber badge in the UI. PRs welcome with primary-source corrections.
