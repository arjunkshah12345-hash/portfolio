<div align="center">

# arjunshah.xyz

**crafted software and AI-led experiences**

[![Live Site](https://img.shields.io/badge/live-arjunshah.xyz-f2f0e9?style=for-the-badge&labelColor=1c1c1a)](https://arjunshah.xyz)
[![License](https://img.shields.io/badge/license-MIT-1c1c1a?style=for-the-badge&labelColor=6b6a65)](LICENSE)

</div>

---

A minimalist portfolio site — editorial typography, quiet motion, and intentional layout. Built with React, Framer Motion, and Tailwind. Designed with [Jasmine](https://tryjasmine.dev).

## live

**[arjunshah.xyz](https://arjunshah.xyz)**

## pages

| route | content |
|:------|:--------|
| `/` | introduction |
| `/about` | trajectory — rooted.ai, ideatr, current focus |
| `/work` | selected projects with detail views |
| `/writing` | essays on agents, compression, distribution |
| `/contact` | email, x, github, linkedin |

## featured work

- [**Loopy**](https://loopy.yachts) — autonomous software engineer
- [**Supercompress**](https://supercompress.dev) — neural context compression for AI agents
- [**Pincer**](https://trypincer.netlify.app) — dyslexia-friendly browser extension
- [**rooted.ai**](https://rooted-ai.vercel.app) — Stanford GSB LISA winner
- [**tryjasmine.dev**](https://tryjasmine.dev) — AI frontend design with taste

## stack

- React 18 + Framer Motion
- Tailwind CSS
- Newsreader + JetBrains Mono
- Deployed on Vercel

## local dev

```bash
git clone https://gitlab.com/arjunkshah/portfolio.git
cd portfolio
# open index.html or serve with any static server
python3 -m http.server 8080
```

## bid — payments + storage

`/bid` is a self-contained surface styled like the live site with minimal HTML/CSS/JS. It talks to Vercel Serverless Functions in `api/bid/*`.

- `GET /api/bid/leaderboard` — return board JSON
- `POST /api/bid/checkout` — create Stripe Checkout Session; returns `{ url }`
- `POST /api/bid/webhook` — verify signature; upsert paid listing
- `GET /api/bid/click/:id` — increment click then redirect

Environment variables (copy `.env.example`):

- `STRIPE_SECRET_KEY` — Stripe restricted key (`rk_...`) that can create Checkout Sessions
- `STRIPE_WEBHOOK_SECRET` — webhook signing secret for the “/api/bid/webhook” endpoint
- `KV_REST_API_URL`, `KV_REST_API_TOKEN` — Vercel KV (Upstash) credentials
- Optional tuning: `BID_TAKEOVER_PRICE_CENTS` (default 100000), `BID_MIN_ENTER_CENTS` (default 10000), `BID_MAX_ENTRIES` (default 50)

Webhook URL to add in Stripe:

```
https://<your-vercel-domain>/api/bid/webhook
```

Deployment notes:

- No secrets are committed. Set env vars on Vercel after deploying.
- When KV + Stripe are present the status shows “live”; otherwise the page runs in demo mode and does not insert paid listings.
- The board stores entries under one KV key `bid:entries:v1` and seeds the current three (SuperCompress $500, Beacon $250, CoinCell $100) on first boot.

## connect

- **email** — [arjunkshah21@gmail.com](mailto:arjunkshah21@gmail.com)
- **x** — [@arjunkshah21](https://x.com/arjunkshah21)
- **github** — [github.com/arjunkshah](https://github.com/arjunkshah)
- **linkedin** — [linkedin.com/in/arjun-k-shah](https://www.linkedin.com/in/arjun-k-shah)

---

<div align="center">

<sub>signed, a.s. · made with <a href="https://tryjasmine.dev">Jasmine</a></sub>

</div>
