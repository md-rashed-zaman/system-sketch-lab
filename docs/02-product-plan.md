# System Sketch Lab - Product plan

## 1. Vision

**Learn system design by breaking it.** Every lesson is a puzzle level: a short concept explanation, then a live canvas where you place components with a fixed credit budget, run real traffic and injected failures, and earn up to three stars. Failures come with a plain-English post-mortem. Case studies (How Uber works, How WhatsApp works...) are multi-stage campaigns where your design carries over as the product grows.

Who it is for:

| Learner | What they need | How we serve them |
| --- | --- | --- |
| Interview candidates (2-8 years) | A repeatable way to reason about scale and trade-offs | Ordered path, interview tips on every level, case-study campaigns |
| Engineers from service companies or small startups | Intuition for systems they never operated | Watching bottlenecks and outages happen, safely |
| Students and juniors | A gentle start | Level 1 is three boxes; each level adds one idea |

## 2. Core loop (one level, about 5-10 minutes)

1. **Read** a 2-minute concept card: the idea, when to use it, trade-offs, what interviewers listen for.
2. **Brief:** the scenario, traffic, targets (uptime, p95 latency) and the credit budget.
3. **Build:** drag components (or click to add) onto the canvas, connect them, set instance counts. Every instance costs credits; you cannot exceed the budget.
4. **Run:** 40 simulated minutes of traffic with ramps, spikes and failures. Edges animate with traffic; nodes turn green, amber or red with load.
5. **Post-mortem:** stars earned, metrics, and an explanation of each problem ("Your single database hit 190% of capacity at minute 22").
6. **Iterate** for three stars: tighter budget, faster p95, or surviving failures.

## 3. Game mechanics

| Mechanic | Rule | Why |
| --- | --- | --- |
| Credits | Each level has a fixed credit budget; each instance has a price | Makes trade-offs concrete: a fourth replica means no cache |
| Stars | 1 star = targets met; 2nd and 3rd stars for level-specific stretch goals (lower cost, faster p95, survive a failure) | Replay value and mastery |
| Failure injection | Levels kill instances mid-run | Teaches redundancy by experience |
| Hints | Three per level; reading them is free but recorded | Unblocks without spoiling |
| XP and ranks | 50 XP per new star (75 in case studies, 30 in daily); ranks Intern, Junior, Engineer, Senior, Staff, Principal, Distinguished | Progress you can feel |
| Streaks | Days in a row with a passed run | Habit |
| Badges | First deploy, first 3-star, chapter clears, Frugal Architect, Zero Downtime, Uber Architect, 7-day streak | Collection and sharing |
| Daily challenge | Same seeded scenario for everyone each day; share a spoiler-free score card | Virality (Wordle loop) and a reason to return |
| Leaderboards | All-time XP and today's daily challenge | Competition |

## 4. Curriculum

The full path targets about 120 levels in 12 chapters. The MVP ships 18 levels in 6 chapters, 4 case studies and the daily challenge.

| Chapter | Levels (MVP in bold) | Planned later |
| --- | --- | --- |
| 1. Foundations | **Hello, Server · Scale Out · No Single Point of Failure** | Latency numbers, back-of-envelope estimation |
| 2. Caching | **Cache the Hot Reads · Go to the Edge · Flash Sale** | Cache invalidation, write-through vs write-back, thundering herd |
| 3. Databases | **Read Replicas · Failover · Shard It** | Indexes, consistent hashing, hot partitions |
| 4. Async processing | **Queue the Writes · Keep the Lag Down · Uploads Belong in Object Storage** | Exactly-once myths, dead-letter queues, sagas |
| 5. Protecting the system | **Rate Limiting · Survive the Outage · Cost Crunch** | Circuit breakers, retries with backoff, bulkheads |
| 6. Real-time and location | **Real-time Gateway · Find Nearby · Black Friday (boss)** | Fan-out, presence, pub/sub |
| 7-12 (planned) | Consistency and consensus, search, observability, multi-region, data pipelines, AI serving | |

Each level has: concept card, interview tip, brief, palette (components unlocked so far), starting graph (sometimes a broken design to fix), traffic, failures, budget, objectives, three hints and a hidden reference solution used in automated tests.

## 5. Case studies (playable campaigns)

A case study is 4-5 stages. Your design carries over to the next stage, the budget grows, and new traffic arrives.

| Case study | Access | Stages |
| --- | --- | --- |
| **How Uber works** | Free | Launch in one city · Drivers stream locations · Find a nearby driver · Payments and receipts · New Year's Eve |
| How WhatsApp works | Pro | 1:1 chat · Millions online (real-time gateway) · Offline delivery (queue) · Photos and voice notes |
| How Netflix works | Pro | Catalogue browsing · Streaming from the edge · Global premiere spike · Uploading new titles |
| How X/Twitter timelines work | Pro | Posting · Reading the home timeline · Fan-out on write · Celebrity problem |
| Coming soon | Pro | YouTube, Dropbox, Ticketmaster, Google Docs, payments ledger, incident replays of real outages |

## 6. Monetisation

| | Free | Pro |
| --- | --- | --- |
| Chapters 1-3 (9 levels) | Yes | Yes |
| Chapters 4-6 and every later chapter | Preview only | Yes |
| Uber case study | Yes | Yes |
| Other case studies | Locked with outline | Yes |
| Daily challenge, leaderboards, sandbox | Yes | Yes |
| Price | $0 | $9/month, $59/year, $149 lifetime; regional discounts (India, Bangladesh, Pakistan...) |

Pricing undercuts ByteByteGo ($189-399/yr) and Hello Interview ($78-95/yr) while offering something they do not: a working simulator. Payments go through a merchant of record (Lemon Squeezy, which supports Bangladeshi payouts) so global VAT is handled. The app ships with a test-mode checkout and a signed webhook endpoint ready for the live keys.

## 7. Growth plan

1. **Daily challenge share cards** ("System Sketch Lab #41 ⭐⭐⭐ 74 credits · p95 62 ms") on X, LinkedIn and Reddit.
2. **SEO concept pages:** one public page per concept and case study (`/learn/...`), each with a playable level embedded.
3. **Incident replays:** within days of a big public outage, publish a playable "what went wrong" level; real outages draw huge attention (427 upvotes for one AWS root-cause post).
4. **Reddit and YouTube:** short videos of designs failing under load; answer "how do I practise system design" threads with the free path.
5. **Referral:** give a month of Pro for each friend who becomes Pro.
6. **Launches:** Product Hunt, Hacker News Show HN, r/leetcode, r/ExperiencedDevs (following each community's rules).
7. **University and bootcamp licences** later.

## 8. Metrics

| Metric | Target after 90 days |
| --- | --- |
| Visitors who start level 1 | 40% |
| Starters who finish chapter 1 | 50% |
| Daily challenge players returning next day | 25% |
| Free to Pro conversion | 2-4% |
| Monthly churn (Pro monthly) | under 8% |

## 9. Roadmap

| Phase | Scope |
| --- | --- |
| MVP (this build) | 18 levels, Uber free, 3 Pro case studies, daily challenge, XP, ranks, streaks, badges, leaderboards, auth, Pro gating, test-mode checkout, full test suite |
| Month 2 | Live payments, chapters 7-8, 2 incident replays, public solution histograms ("your cost beat 82% of players") |
| Month 3 | AI coach that explains your specific design, interview mode (timed, requirements first), team and classroom plans |
| Month 4+ | Mobile layout for case-study reading, more case studies every two weeks, community-made levels |

## 10. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Simplified model teaches wrong intuitions | Documented model with realistic ratios; each level is reviewed; post-mortems mention where reality is messier |
| Puzzles with one "right" answer feel like trivia | Multiple valid designs per level; stars reward trade-offs, not a fixed shape |
| Competitors copy the canvas | Moat is level design, content depth and the daily-challenge community |
| Low willingness to pay in some regions | Generous free tier and regional pricing |
