# System Sketch Lab - Market research

Working name: **System Sketch Lab** (check trademark and domain before launch). Research date: 24 Oct 2026.

## Bottom line

System design learning is crowded at both ends. Big course platforms (Educative, DesignGurus, ByteByteGo, Hello Interview) teach by reading and watching. A new wave of simulators (SystemLore, PRISM, algoSD, open-source sims) lets you drag boxes and push traffic, but they are mostly sandboxes or interview drills with thin teaching. Nobody combines a **complete, ordered curriculum** with **puzzle-game mechanics** (fixed credit budgets, failure injection, star ratings) and **playable case studies**. That combination is our wedge.

## Course platforms

Prices are list or sale prices reported by comparison sites in Oct 2026; they change often.

| Platform | Format | Price (Oct 2026) | Strengths | Weaknesses we can exploit |
| --- | --- | --- | --- | --- |
| [Educative - Grokking Modern System Design](https://www.designgurus.io/answers/detail/is-grokking-modern-system-design-interview-worth-it) | Interactive text, quizzes | In Educative subscription (about $149/yr on sale) | Breadth, bundled with other courses | Mostly reading; diagrams are static; confusing split with DesignGurus' original Grokking |
| [DesignGurus - Grokking the System Design Interview](https://www.designgurus.io/blog/best-system-design-interview-courses-2026) | Text, video, illustrated diagrams | $59 lifetime on sale ($148 list) | Proven interview framework, cheap | Passive; no way to test a design; you never see it fail |
| [ByteByteGo](https://www.systemdesign.academy/best-system-design-course) | Illustrated chapters, newsletter | $189-399/yr, $499-999 lifetime | Best visuals, author of the best-known books | Expensive; beautiful but static pictures; no practice loop |
| [Hello Interview](https://hellointerview.com/practice) | Written breakdowns, videos, AI-guided practice | About $47/month, $78-95/yr, $275-319 lifetime | Most-mentioned on Reddit; strong free content; AI feedback on 34 problems | Practice is text answers judged by AI, not a running system; human mocks ended 31 May 2026 |
| [Codemia](https://javarevisited.blogspot.com/2026/06/codemia-vs-designgurus-which-is-better-for-system-design-interviews.html) | 120+ problems with AI feedback | About $55-99/yr | Volume of problems | Text and whiteboard answers; little teaching of fundamentals |
| [systemdesign.academy](https://www.systemdesign.academy/best-system-design-course) | 770 lessons, AI tutor per lesson | $49 once | Cheap, huge volume | Volume over craft; reading plus chat |
| Free: YouTube, NeetCode, DDIA book, freeCodeCamp | Video, book | $0 | Free and deep | No structure, no feedback, no practice |

## Simulator and game competitors

| Product | What it is | Gap |
| --- | --- | --- |
| [SystemLore](https://systemlore.com/) | "Keep the internet alive" incident game; campaign unlocks concepts when a design survives; studio canvas | Arcade-style runs; shallow on written teaching, trade-offs and case studies |
| [PRISM](https://www.prismhld.com/) | Build, stress-test, score on a 5-part interview rubric; AI interview | Interview-centric; learning path is light |
| [algoSD](https://algosd.fun/) | 37 components, 37 problems, AI interviewer, trade-off cards | Solo project; sandbox plus scoring, no progression design |
| [System Design Playground](https://sysdesignplayground.com/), open-source sims ([vijaygupta18](https://github.com/vijaygupta18/system-design-simulator), [Yash121l](https://github.com/Yash121l/system-design-simulator), [SystemDesignSim](https://github.com/javanhut/SystemDesignSim)) | Free canvases with traffic animation | No curriculum, no game design, no accounts |

Lesson: a canvas alone is a commodity. The value is in **level design** (each puzzle teaches exactly one idea and fails in an instructive way), **explanations of why it failed**, and **progression**.

## What learners say (Reddit, Oct 2025 - Oct 2026)

We pulled 13,001 posts from r/leetcode, r/ExperiencedDevs, r/cscareerquestions, r/csMajors, r/learnprogramming and r/systemdesign through the free Arctic Shift archive; 484 mention system design.

- **Most-mentioned resources:** Hello Interview (17 posts), NeetCode (15), YouTube (14), DDIA (6), ByteByteGo (4), Educative (3).
- **Pains (share of system-design posts, keyword match, rough):** no hands-on practice or real-world exposure 12%; depth and trade-offs 10%; juniors or service-company engineers with no large-scale experience 9%; overwhelm / where to start 3%; price 3%.
- **What gets attention:** "[Folks preparing for System Design: read the recent AWS outage root cause](https://www.reddit.com/r/leetcode/comments/1oe4s15/)" (427 upvotes) and a "[90-day challenge: design a system every day](https://www.reddit.com/r/leetcode/comments/1o0y5jk/)" (443 upvotes). Real incidents and daily rituals pull people in.
- **Typical failure story:** "[Messed up first system design round ever in 6 YOE](https://www.reddit.com/r/leetcode/comments/1o86vy9/)": experienced developers who never operated large systems.

## Positioning

**"Learn system design by breaking it."** A puzzle game where every lesson is a level: a scenario, a fixed credit budget, live traffic and injected failures. You win stars by meeting latency and uptime targets within budget, and every failure comes with a plain-English post-mortem.

| Need | Incumbents | System Sketch Lab |
| --- | --- | --- |
| Hands-on practice | Read, watch, or write answers | Build and run a live simulation every lesson |
| Why a design fails | Told, not shown | Shown: the bottleneck lights up, then a post-mortem explains it |
| Where to start | Long chapter lists | One ordered path; each level adds one concept |
| Trade-offs | Prose | Enforced by credits: every server costs; stars reward cheaper designs |
| Case studies | Static articles | Playable campaigns: Uber grows from 1k to 10M rides a day, stage by stage |
| Habit | None | Daily challenge with a shareable score grid, streaks, XP, leaderboard |
| Price | $55-999 | Free core path, Pro from $9/month, regional pricing |

## Risks

- Competitors can copy the canvas; the moat is level design, content depth and community (daily challenge, solution sharing).
- A simplified simulator can teach wrong intuitions; each model rule is documented and reviewed against real numbers (see `03-technical-design.md`).
- Interview prep is seasonal and price-sensitive; regional pricing and a generous free tier matter.
