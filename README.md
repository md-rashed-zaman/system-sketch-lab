# System Sketch Lab

**Learn system design by breaking it.** A puzzle game where every lesson is a level: read a short concept card, build an architecture on a live canvas with a fixed credit budget, run real traffic, spikes and server crashes through it, and earn up to three stars. Playable case studies (How Uber works, WhatsApp, Netflix, X/Twitter timelines) carry your design forward as the product grows.

## What is in the box

- 18 lessons in 6 chapters (chapters 1-3 free, 4-6 Pro). Each opens on a full explanation page (how it works, request-path diagrams, numbers to know, comparisons, real-world examples, common mistakes, interview questions and a quiz), then the canvas challenge with a mission, three hints and a tested reference solution
- Every case-study stage has the same kind of explanation page
- Light and dark themes (follows the system setting, with a toggle in the header)
- 4 playable case studies (Uber free; WhatsApp, Netflix, X/Twitter Pro), 4 more listed as coming soon
- Daily challenge generated per day, with leaderboard and spoiler-free share text
- Sandbox with editable traffic
- Accounts, XP, ranks, streaks, 14 badges, all-time and daily leaderboards, profile
- Pricing, test-mode checkout, Pro gating, Lemon Squeezy live checkout and signed webhooks
- A deterministic simulation engine shared by browser and server, with plain-English post-mortems

## Docs

- [Market research](docs/01-market-research.md): competitors, their weaknesses, what learners say
- [Product plan](docs/02-product-plan.md): mechanics, curriculum, monetisation, growth, roadmap
- [Technical design](docs/03-technical-design.md): architecture, simulation model, data, security

## Run it

```bash
pnpm install
cp .env.example .env.local   # then set BETTER_AUTH_SECRET
pnpm dev                     # migrates the database, serves http://localhost:3100
```

## Test it

```bash
pnpm test        # unit tests: engine, every level's solvability and article, 120 days of dailies, server logic
pnpm test:e2e    # Playwright: builds for production and drives every feature in Chromium
pnpm typecheck
pnpm lint
pnpm levels:report   # utilisation report for content authors
```

See the technical design for the local-disk setup this machine needs (the Projects drive is a slow FUSE mount).
