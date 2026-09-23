# mikkaiser.com

[![CI](https://github.com/Mikkaiser/mikkaiser-portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/Mikkaiser/mikkaiser-portfolio/actions/workflows/ci.yml)
[![Live](https://img.shields.io/badge/live-mikkaiser--portfolio.vercel.app-000?logo=vercel)](https://mikkaiser-portfolio.vercel.app)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-000?logo=nextdotjs)](https://nextjs.org)
[![License: MIT](https://img.shields.io/badge/code-MIT-blue.svg)](LICENSE)

Personal site of **Mikael Ribeiro Simoes** — full stack developer in Abu Dhabi. One page, statically
generated, built from a claude.ai/design file and tuned for Core Web Vitals and search.

**Live:** https://mikkaiser-portfolio.vercel.app

## Highlights

- **Static by design.** `/` is prerendered to plain HTML at build time (`○ Static` in `next build`).
  All copy, headings, metadata and JSON-LD are in the HTML; JavaScript only adds interactivity.
- **SEO.** Metadata API (title, description, canonical, Open Graph, Twitter, robots), `Person`
  JSON-LD, `sitemap.xml`, `robots.txt`, a single `<h1>`, semantic sections, `alt` text everywhere.
- **Performance.** Self-hosted fonts via `next/font` (zero layout shift), AVIF/WebP + responsive
  sizes via `next/image`, inline SVG brand icons (no icon CDN), inlined critical CSS,
  `content-visibility: auto` below the fold, 30-day cache headers on assets.
- **"Ask about me".** A route handler calls OpenAI through the official `openai` SDK with
  the CV facts as its system prompt, so visitors can ask about experience, stack and projects.
- **Details from the design.** Dark/light theme with a view-transition reveal, hover-to-colour
  photos, work cards that expand on hover, reference popovers, a marquee of the stack, a
  "match the stack" memory game, and a live Abu Dhabi clock.

## Lighthouse (production, mobile · desktop)

| | Performance | Accessibility | Best Practices | SEO | CLS |
|---|---|---|---|---|---|
| Desktop | **100** | 100 | 100 | 100 | 0 |
| Mobile (slow 4G, 4× CPU throttle) | **87** (79–91 across runs) | 100 | 100 | 100 | 0 |

On a real device the largest content (the hero lead) paints at first contentful paint (~0.3–0.5 s);
the remaining mobile spread in the lab score is the simulator plus React hydration, the accepted
cost of `next/image`, `next/font`, the Metadata API and the built-in API route.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · plain CSS with design tokens (no Tailwind) ·
`openai` · `resend` · `simple-icons` · deployed on Vercel.

```
app/            layout (fonts, metadata, JSON-LD, theme boot), page, tokens.css, globals.css,
                sitemap.ts, robots.ts, api/ask/route.ts
components/     one file per section (Header, Hero, Marquee, Work, Experience, Awards, Ask,
                Offline, Contact, Footer) plus small client pieces (ThemeProvider, StackGame,
                Reveal, Clock, ContactForm, BackToTop)
lib/bio.ts      facts used as the agent's system prompt
public/assets/  photos, logos, work screenshots, CV
```

## Develop

```bash
npm install
cp .env.example .env.local     # add OPENAI_API_KEY and RESEND_API_KEY
npm run dev                    # http://localhost:3000
npm run lint && npm run typecheck && npm run build
npm start                      # serve the production build
```

Node 20+ (see `.nvmrc`).

## CI/CD

- **CI** (`.github/workflows/ci.yml`): on every push to `main` and every pull request — `npm ci`,
  lint, type-check (`next typegen && tsc --noEmit`), production build, and an assertion that `/`
  was prerendered to static HTML.
- **Deploy** (`.github/workflows/deploy.yml`): builds with the Vercel CLI and deploys — every push
  to `main` goes to production, every pull request gets a preview deployment whose URL is posted
  as a PR comment. Uses the `VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` repository
  secrets. (If the repo is later connected through Vercel's GitHub integration, delete this
  workflow to avoid double deploys.)
- **Dependabot** (`.github/dependabot.yml`): weekly PRs for npm packages (minor/patch grouped)
  and GitHub Actions; CI and a preview deploy validate each one.

## Configuration

| Variable | Where | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | Vercel → Settings → Environment Variables (Production), `.env.local` for dev | Enables `/api/ask` (the CV agent). Without it the UI shows a friendly "not configured" message. |
| `RESEND_API_KEY` | Same | Enables `/api/contact` (the contact form). Sends from `noreply@mikkaiser.com`. |
| `VERCEL_TOKEN` | GitHub → Settings → Secrets → Actions | Lets the deploy workflow publish to Vercel (create at vercel.com/account/tokens). |
| `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | GitHub Actions secrets | Identify the Vercel project (values from `.vercel/project.json` after `vercel link`). |

## Licence

Code is MIT (see `LICENSE`). Photos, logos and the written content are personal material and are
not licensed for reuse.
