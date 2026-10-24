import { design } from "@/engine/design";
import type { CaseStudy, Level } from "./types";

type StageInput = Omit<Level, "kind" | "pro" | "xpPerStar" | "caseStudy" | "id">;

const stage = (slug: string, n: number, pro: boolean, s: StageInput): Level => ({
  ...s,
  id: `${slug}-${n}`,
  kind: "case",
  pro,
  xpPerStar: 75,
  caseStudy: { slug, stage: n },
});

// ---------------------------------------------------------------- Uber (free)

const uber1Solution = design([["app", "app"], ["db", "sqldb"]], ["users>app", "app>db"]);
const uber2Solution = design(
  [["ws", "ws"], ["geo", "geo"], ["app", "app"], ["db", "sqldb"]],
  ["users>ws", "ws>geo", "users>app", "app>db"],
);
const uber3Solution = design(
  [["ws", "ws"], ["geo", "geo"], ["lb", "lb"], ["app", "app", 4], ["db", "sqldb"]],
  ["users>ws", "ws>geo", "users>lb", "lb>app", "app>geo", "app>db"],
);
const uber4Solution = design(
  [["ws", "ws"], ["geo", "geo"], ["lb", "lb"], ["app", "app", 5], ["cache", "cache"], ["db", "sqldb"], ["queue", "queue"], ["worker", "worker", 2]],
  ["users>ws", "ws>geo", "users>lb", "lb>app", "app>geo", "app>cache", "cache>db", "app>queue", "queue>worker", "worker>db"],
);

const uberStages: Level[] = [
  stage("uber", 1, false, {
    title: "Launch in one city",
    tagline: "Riders book trips, drivers accept them. Start simple.",
    concept: {
      intro:
        "Uber's first version in San Francisco was a simple app: riders request a ride, the server stores the trip, a driver accepts it. At city scale that is a few hundred requests per second, and a single app server with one relational database is the right call.",
      points: [
        "Core entities: rider, driver, trip. A trip moves through states: requested, accepted, in progress, completed, paid.",
        "Trips and payments need transactions, so a relational database fits.",
        "Do not over-build: no microservices on day one.",
      ],
      tradeoffs: ["A monolith is fastest to build and cheapest to run, but it will need splitting as teams and traffic grow."],
      interviewTip: "Clarify scope first: one city or global? Riders and drivers only, or also food delivery? Then size the traffic.",
    },
    brief: "Launch day: 400 reads (trip status, history) and 100 writes (ride requests, accepts) per second.",
    palette: ["lb", "app", "cache", "sqldb"],
    start: design([], []),
    scenario: { traffic: { read: 400, write: 100 }, curve: "steady" },
    budget: 90,
    objectives: { minAvailability: 0.99, maxP95: 100 },
    stretch: [
      { kind: "credits", value: 40 },
      { kind: "p95", value: 50 },
    ],
    hints: ["Users → App Server → SQL Database.", "One app instance handles 500 requests per second at half load.", "Skip the cache for now: it would only cost credits."],
    solution: uber1Solution,
  }),
  stage("uber", 2, false, {
    title: "Drivers stream their location",
    tagline: "Every active driver sends a GPS ping every few seconds.",
    concept: {
      intro:
        "To show cars moving on the rider's map and to match riders with drivers, every online driver sends its position every 4 seconds. 24,000 drivers means 6,000 writes per second of data that is stale within seconds. That is a very different workload from trips.",
      points: [
        "Location pings are high-volume and disposable: losing one is harmless because another arrives in 4 seconds.",
        "Keep them in an in-memory geo index (Uber built its own on top of a ring of servers; Redis GEO is a common start).",
        "A persistent connection (WebSocket) avoids the overhead of 6,000 new HTTP requests per second.",
      ],
      tradeoffs: ["In-memory positions vanish on a crash, which is fine; trips must never vanish, so they stay in SQL."],
      interviewTip: "Split the workload: durable business data in SQL, ephemeral high-rate data in memory. Interviewers look for that separation.",
    },
    brief: "Add 6,000 location updates per second on top of trip traffic. Writing them to SQL through the app server will not work.",
    palette: ["lb", "app", "cache", "sqldb", "ws", "geo", "nosql"],
    start: uber1Solution,
    scenario: { traffic: { read: 400, write: 100, loc: 6000 }, curve: "steady" },
    budget: 120,
    objectives: { minAvailability: 0.99, maxP95: 100 },
    stretch: [
      { kind: "credits", value: 75 },
      { kind: "p95", value: 40 },
    ],
    hints: [
      "Users → Realtime Gateway carries location updates.",
      "The gateway should write into a Geo Index.",
      "Keep Users → App → SQL for trips.",
    ],
    solution: uber2Solution,
  }),
  stage("uber", 3, false, {
    title: "Find me a driver",
    tagline: "Matching starts with 'which drivers are near this rider?'.",
    concept: {
      intro:
        "When a rider requests a trip, the dispatch service asks the geo index for available drivers nearby, ranks them by estimated pickup time and offers the trip to the best one. Uber indexes the map with H3 hexagonal cells so 'nearby' means 'this cell and its neighbours'.",
      points: [
        "Nearby searches must hit the geo index, never a SQL table scan.",
        "Rider apps also poll trip status, so reads grow too: scale the app tier behind a load balancer.",
        "Dispatch is latency-sensitive: a slow match feels like no cars available.",
      ],
      tradeoffs: ["Hexagonal cells (H3) have equal-distance neighbours, unlike square geohash cells, at the cost of a less familiar library."],
      interviewTip: "Explain the matching flow step by step: request, nearby lookup, rank by ETA, offer, timeout, next driver.",
    },
    brief: "Add 1,500 nearby searches per second, reads grow to 1,000 and writes to 200. The single app server and SQL cannot cope.",
    palette: ["lb", "app", "cache", "sqldb", "ws", "geo", "nosql"],
    start: uber2Solution,
    scenario: { traffic: { read: 1000, write: 200, loc: 6000, nearby: 1500 }, curve: "steady" },
    budget: 160,
    objectives: { minAvailability: 0.99, maxP95: 100 },
    stretch: [
      { kind: "credits", value: 115 },
      { kind: "p95", value: 60 },
    ],
    hints: [
      "Connect the App Server to the Geo Index so nearby searches skip SQL.",
      "Put a Load Balancer in front of the app tier and give it four instances.",
      "Users → Load Balancer → App; keep Users → Realtime Gateway for locations.",
    ],
    solution: uber3Solution,
  }),
  stage("uber", 4, false, {
    title: "Payments and receipts",
    tagline: "When a trip ends, charge the card, pay the driver, email a receipt.",
    concept: {
      intro:
        "Trip completion triggers a chain of work: calculate the fare, charge the rider, credit the driver, send a receipt, update analytics. None of it needs to block the 'trip ended' screen, and payment providers are slow and flaky. Uber moves this work onto queues (Kafka) processed by background workers.",
      points: [
        "Payments must be idempotent: a retried job must never charge twice (use an idempotency key per trip).",
        "Queues absorb the evening rush when thousands of trips end at once.",
        "Workers write the results to the database at a pace it can sustain.",
      ],
      tradeoffs: ["The receipt arrives a few seconds later; in exchange the database never melts at rush hour."],
      interviewTip: "Whenever money moves, say 'idempotency key' and 'at-least-once delivery with deduplication'.",
    },
    brief: "Rush hour: trip completions spike to 1,200 writes per second. Synchronous writes overload the database at the peak. Keep queue lag under 30 seconds.",
    palette: ["lb", "app", "cache", "sqldb", "ws", "geo", "nosql", "queue", "worker"],
    start: uber3Solution,
    scenario: { traffic: { read: 1000, write: 1200, loc: 6000, nearby: 1500 }, curve: "spike" },
    budget: 210,
    objectives: { minAvailability: 0.99, maxP95: 100, maxLagSec: 30 },
    stretch: [
      { kind: "credits", value: 170 },
      { kind: "lag", value: 10 },
    ],
    hints: [
      "App → Message Queue → Worker → SQL Database moves writes off the request path.",
      "Two workers drain 600 jobs per second, which the database can take alongside reads.",
      "Add a cache in front of SQL for trip-status reads, and a fifth app instance for the peak.",
    ],
    solution: uber4Solution,
  }),
  stage("uber", 5, false, {
    title: "New Year's Eve",
    tagline: "Double the traffic at midnight, and things break.",
    concept: {
      intro:
        "Midnight on New Year's Eve is Uber's hardest night: demand doubles in minutes worldwide. Uber pre-scales, sheds non-essential features (surge pricing explains the wait instead of failing) and runs every tier redundantly, because something always breaks at the worst moment.",
      points: [
        "Pre-scale before known peaks; autoscaling is too slow for a cliff.",
        "Every tier on the critical path needs N+1: gateways, app servers, the geo index.",
        "Degrade gracefully: if matching is slow, show a longer ETA instead of an error.",
      ],
      tradeoffs: ["Paying for peak capacity a few nights a year is cheaper than losing the busiest night."],
      interviewTip: "Close every design by stress-testing it: '10x traffic tomorrow, what breaks first?'.",
    },
    brief:
      "Midnight spike: 2,000 reads, 1,200 writes, 12,000 location updates and 3,000 nearby searches per second. An app server, a geo index node and a realtime gateway each fail during the spike.",
    palette: ["lb", "app", "cache", "sqldb", "ws", "geo", "nosql", "queue", "worker"],
    start: uber4Solution,
    scenario: {
      traffic: { read: 2000, write: 1200, loc: 12000, nearby: 3000 },
      curve: "spike",
      failures: [
        { at: 18, duration: 5, type: "app", count: 1 },
        { at: 19, duration: 5, type: "geo", count: 1 },
        { at: 21, duration: 4, type: "ws", count: 1 },
      ],
    },
    budget: 400,
    objectives: { minAvailability: 0.99, maxP95: 150, maxLagSec: 60 },
    stretch: [
      { kind: "failureAvailability", value: 0.995 },
      { kind: "credits", value: 330 },
    ],
    hints: [
      "Several realtime gateway instances need a load balancer in front: Users → Load Balancer → Realtime Gateway.",
      "Give the load balancer two instances, the gateway three, and the geo index three.",
      "Nine app instances survive losing one at the peak.",
    ],
    solution: design(
      [["lb", "lb", 2], ["ws", "ws", 3], ["geo", "geo", 3], ["app", "app", 9], ["cache", "cache"], ["db", "sqldb"], ["queue", "queue"], ["worker", "worker", 2]],
      ["users>lb", "lb>ws", "ws>geo", "lb>app", "app>geo", "app>cache", "cache>db", "app>queue", "queue>worker", "worker>db"],
    ),
  }),
];

// ---------------------------------------------------------------- WhatsApp (Pro)

const wa1 = design([["lb", "lb"], ["app", "app", 3], ["kv", "nosql"]], ["users>lb", "lb>app", "app>kv"]);
const wa2 = design(
  [["lb", "lb"], ["ws", "ws", 2], ["kv", "nosql", 4], ["app", "app", 2], ["cache", "cache"]],
  ["users>lb", "lb>ws", "ws>kv", "lb>app", "app>cache", "cache>kv", "app>kv"],
);
const wa3 = design(
  [["lb", "lb", 2], ["ws", "ws", 3], ["kv", "nosql", 5], ["app", "app", 2], ["cache", "cache"]],
  ["users>lb", "lb>ws", "ws>kv", "lb>app", "app>cache", "cache>kv", "app>kv"],
);

const whatsappStages: Level[] = [
  stage("whatsapp", 1, true, {
    title: "One-to-one chat",
    tagline: "Send a message, store it, deliver it.",
    concept: {
      intro:
        "At its core WhatsApp stores a message and delivers it to the recipient's device. Messages are small, written constantly and read mostly once, which suits a write-optimised, sharded store keyed by conversation.",
      points: ["Shard messages by conversation id so one chat's history lives together.", "Messages are append-only; updates are rare (edits, reactions).", "Delivery receipts (sent, delivered, read) are more small writes."],
      tradeoffs: ["Sharding by conversation makes 'search all my messages' expensive, which WhatsApp solves on the device instead."],
      interviewTip: "State the message schema (conversation_id, message_id, sender, timestamp, body) and the shard key.",
    },
    brief: "1,500 messages and 500 reads per second. SQL charges 4 units per write; pick a better store.",
    palette: ["lb", "app", "cache", "sqldb", "nosql"],
    start: design([], []),
    scenario: { traffic: { message: 1500, read: 500 }, curve: "steady" },
    budget: 100,
    objectives: { minAvailability: 0.99, maxP95: 100 },
    stretch: [
      { kind: "credits", value: 65 },
      { kind: "p95", value: 60 },
    ],
    hints: ["Users → Load Balancer → App → Sharded NoSQL.", "Three app instances keep the tier around 67%.", "One shard holds 2,000 units per second easily."],
    solution: wa1,
  }),
  stage("whatsapp", 2, true, {
    title: "Millions online",
    tagline: "Keep a connection open to every phone.",
    concept: {
      intro:
        "WhatsApp famously served millions of concurrent connections per server using Erlang. Each phone keeps one long-lived connection; the server pushes messages down it instantly. HTTP request-per-message would be far too expensive.",
      points: ["A realtime gateway holds connections and routes messages to the right recipient's gateway.", "Message storage must scale with shards as volume grows.", "Reads (chat list, profile) still go through normal app servers."],
      tradeoffs: ["Stateful connections need a presence registry: which gateway is this user connected to?"],
      interviewTip: "Describe the send path end to end: sender's gateway, storage, recipient lookup, recipient's gateway, delivery receipt.",
    },
    brief: "Messages jump to 12,000 per second plus 1,000 reads. App servers cannot carry this.",
    palette: ["lb", "app", "cache", "sqldb", "nosql", "ws"],
    start: wa1,
    scenario: { traffic: { message: 12000, read: 1000 }, curve: "steady" },
    budget: 220,
    objectives: { minAvailability: 0.99, maxP95: 100 },
    stretch: [
      { kind: "credits", value: 180 },
      { kind: "p95", value: 40 },
    ],
    hints: ["Load Balancer → Realtime Gateway (two instances) for messages.", "Four NoSQL shards hold 12,000 writes per second.", "Keep Load Balancer → App → Cache → NoSQL for reads."],
    solution: wa2,
  }),
  stage("whatsapp", 3, true, {
    title: "Midnight greetings",
    tagline: "Everyone texts 'Happy New Year' at the same second.",
    concept: {
      intro:
        "Festive midnights produce WhatsApp's biggest spikes: billions of messages within minutes. The system must absorb the spike and survive node failures at peak load.",
      points: ["Size shards and gateways for the spike, not the average.", "Run gateways and load balancers redundantly.", "Messages queue on the sender's phone and retry, so brief failures degrade gracefully."],
      tradeoffs: ["Over-provisioning for one night a year vs a visible outage on the most emotional night."],
      interviewTip: "Mention client-side retries with backoff and idempotent message ids, so retries never duplicate messages.",
    },
    brief: "A spike to 18,000 messages per second, while a gateway and a load balancer instance fail.",
    palette: ["lb", "app", "cache", "sqldb", "nosql", "ws"],
    start: wa2,
    scenario: {
      traffic: { message: 18000, read: 1500 },
      curve: "spike",
      failures: [
        { at: 18, duration: 5, type: "ws", count: 1 },
        { at: 20, duration: 4, type: "lb", count: 1 },
      ],
    },
    budget: 280,
    objectives: { minAvailability: 0.99, maxP95: 120 },
    stretch: [
      { kind: "failureAvailability", value: 0.995 },
      { kind: "credits", value: 235 },
    ],
    hints: ["Two load balancer instances.", "Three gateways survive losing one at 18,000 messages per second.", "Five shards keep NoSQL below 100%."],
    solution: wa3,
  }),
  stage("whatsapp", 4, true, {
    title: "Photos and voice notes",
    tagline: "Media is 1% of messages and 99% of the bytes.",
    concept: {
      intro:
        "Photos, videos and voice notes are uploaded once to object storage; the chat message only carries a link and encryption key. Recipients download from a CDN.",
      points: ["Upload media to object storage, send a small message with its key.", "Serve downloads from a CDN.", "End-to-end encryption means the server stores only encrypted blobs."],
      tradeoffs: ["CDN egress is a large cost line; WhatsApp compresses media aggressively on the device."],
      interviewTip: "Separate the media path from the message path explicitly in your diagram.",
    },
    brief: "Add 400 media uploads and 6,000 media downloads per second on top of chat traffic.",
    palette: ["lb", "app", "cache", "sqldb", "nosql", "ws", "cdn", "blob"],
    start: wa3,
    scenario: { traffic: { message: 12000, read: 1000, upload: 400, static: 6000 }, curve: "steady" },
    budget: 300,
    objectives: { minAvailability: 0.99, maxP95: 120 },
    stretch: [
      { kind: "credits", value: 270 },
      { kind: "p95", value: 60 },
    ],
    hints: ["App → Object Storage for uploads.", "Users → CDN → Object Storage for downloads.", "Uploads cost three units at the app tier: add app instances."],
    solution: design(
      [["lb", "lb", 2], ["ws", "ws", 2], ["kv", "nosql", 4], ["app", "app", 4], ["cache", "cache"], ["cdn", "cdn"], ["blob", "blob"]],
      ["users>lb", "lb>ws", "ws>kv", "lb>app", "app>cache", "cache>kv", "app>kv", "app>blob", "users>cdn", "cdn>blob"],
    ),
  }),
];

// ---------------------------------------------------------------- Netflix (Pro)

const nf1 = design([["lb", "lb"], ["app", "app", 7], ["cache", "cache"], ["db", "sqldb"]], ["users>lb", "lb>app", "app>cache", "cache>db", "app>db"]);
const nf2 = design(
  [["cdn", "cdn"], ["blob", "blob"], ["lb", "lb"], ["app", "app", 7], ["cache", "cache"], ["db", "sqldb"]],
  ["users>cdn", "cdn>blob", "users>lb", "lb>app", "app>cache", "cache>db", "app>db"],
);
const nf3 = design(
  [["cdn", "cdn"], ["blob", "blob"], ["lb", "lb", 2], ["app", "app", 12], ["cache", "cache", 2], ["db", "sqldb"], ["replica", "replica"]],
  ["users>cdn", "cdn>blob", "users>lb", "lb>app", "app>cache", "cache>replica", "app>db"],
);

const netflixStages: Level[] = [
  stage("netflix", 1, true, {
    title: "Browse the catalogue",
    tagline: "Rows of posters, personalised for every profile.",
    concept: {
      intro:
        "Opening Netflix loads your home page: rows of titles, artwork and 'continue watching'. These reads are huge in volume and highly cacheable; Netflix runs a massive in-memory caching layer (EVCache) in front of its databases.",
      points: ["Catalogue metadata changes rarely: cache it aggressively.", "Personalised rows are precomputed offline, then read like any other data.", "Reads outnumber writes by orders of magnitude."],
      tradeoffs: ["Precomputing recommendations makes them a few hours stale but makes the home page instant."],
      interviewTip: "Point out what can be precomputed offline; it often turns a hard real-time problem into a cache read.",
    },
    brief: "5,000 browse reads and 50 writes (ratings, watch history) per second.",
    palette: ["lb", "app", "cache", "sqldb", "replica"],
    start: design([], []),
    scenario: { traffic: { read: 5000, write: 50 }, curve: "steady" },
    budget: 140,
    objectives: { minAvailability: 0.99, maxP95: 100 },
    stretch: [
      { kind: "credits", value: 125 },
      { kind: "p95", value: 70 },
    ],
    hints: ["Users → Load Balancer → App → Cache → SQL.", "Seven app instances keep the tier near 70%.", "One cache absorbs 80% of reads."],
    solution: nf1,
  }),
  stage("netflix", 2, true, {
    title: "Stream from the edge",
    tagline: "Video is most of the internet's traffic. Keep it off your servers.",
    concept: {
      intro:
        "Netflix streams from Open Connect, its own CDN of appliances placed inside internet providers' networks. Video is split into small segments; players fetch segments from the nearest edge, and the origin only serves misses.",
      points: ["Video segments are static files: perfect for a CDN.", "Popular titles are pre-positioned at the edge overnight.", "The app tier only handles playback authorisation and metadata."],
      tradeoffs: ["Building your own CDN only pays off at Netflix scale; everyone else rents one."],
      interviewTip: "Mention adaptive bitrate streaming: the player switches quality per segment based on bandwidth.",
    },
    brief: "Add 40,000 video segment requests per second.",
    palette: ["lb", "app", "cache", "sqldb", "replica", "cdn", "blob"],
    start: nf1,
    scenario: { traffic: { read: 5000, write: 50, static: 40000 }, curve: "steady" },
    budget: 180,
    objectives: { minAvailability: 0.99, maxP95: 120 },
    stretch: [
      { kind: "credits", value: 160 },
      { kind: "p95", value: 80 },
    ],
    hints: ["Users → CDN → Object Storage.", "Static traffic prefers the CDN.", "The rest of the design can stay."],
    solution: nf2,
  }),
  stage("netflix", 3, true, {
    title: "Global premiere",
    tagline: "A hit season drops worldwide at the same minute.",
    concept: {
      intro:
        "Big releases send everyone to the same title at once. Netflix pre-warms caches and edges, and its chaos engineering (Chaos Monkey) means the platform is built to keep streaming when instances die.",
      points: ["Pre-warm caches before a known launch.", "Redundant load balancers and cache nodes.", "Read replicas absorb cache misses during the spike."],
      tradeoffs: ["Pre-warming costs bandwidth for titles that might flop."],
      interviewTip: "Chaos engineering is a great talking point: you prove resilience by breaking things on purpose in production.",
    },
    brief: "Premiere spike: 9,000 browse reads, 100 writes and 60,000 segments per second. A cache node and a load balancer fail mid-spike.",
    palette: ["lb", "app", "cache", "sqldb", "replica", "cdn", "blob"],
    start: nf2,
    scenario: {
      traffic: { read: 9000, write: 100, static: 60000 },
      curve: "spike",
      failures: [
        { at: 18, duration: 5, type: "cache", count: 1 },
        { at: 21, duration: 4, type: "lb", count: 1 },
      ],
    },
    budget: 260,
    objectives: { minAvailability: 0.99, maxP95: 150 },
    stretch: [
      { kind: "failureAvailability", value: 0.995 },
      { kind: "credits", value: 255 },
    ],
    hints: ["Two load balancer instances and two cache nodes.", "A read replica catches misses when a cache node dies.", "Twelve app instances for 9,100 requests per second at the peak."],
    solution: nf3,
  }),
  stage("netflix", 4, true, {
    title: "Encoding new titles",
    tagline: "Studios upload masters; Netflix encodes dozens of versions.",
    concept: {
      intro:
        "Every title is encoded into many resolutions, codecs and languages. Netflix splits each video into chunks and encodes them in parallel on a fleet of workers, coordinated through queues.",
      points: ["Uploads go straight to object storage.", "Encoding jobs go on a queue; workers process chunks in parallel.", "Job status writes go to the database at the workers' pace."],
      tradeoffs: ["Chunked parallel encoding finishes fast but needs careful stitching and retries per chunk."],
      interviewTip: "Batch pipelines are design questions too: talk about job states, retries, and how you know a title is ready.",
    },
    brief:
      "Add 150 master uploads and 1,200 encoding-status writes per second, steady, while streaming continues. 4,800 write units a second is more than the SQL primary can take, even through a queue. Keep job lag under 30 seconds.",
    palette: ["lb", "app", "cache", "sqldb", "replica", "cdn", "blob", "queue", "worker", "nosql"],
    start: nf3,
    scenario: { traffic: { read: 6000, write: 1200, static: 40000, upload: 150 }, curve: "steady" },
    budget: 320,
    objectives: { minAvailability: 0.99, maxP95: 120, maxLagSec: 30 },
    stretch: [
      { kind: "credits", value: 305 },
      { kind: "lag", value: 5 },
    ],
    hints: [
      "App → Object Storage for uploads.",
      "A queue smooths spikes but cannot fix a steady overload: write job status into Sharded NoSQL via Queue → Workers.",
      "Four workers drain 1,200 jobs per second; ten app instances cover reads, uploads and enqueues.",
    ],
    solution: design(
      [["cdn", "cdn"], ["blob", "blob"], ["lb", "lb", 2], ["app", "app", 10], ["cache", "cache", 2], ["db", "sqldb"], ["replica", "replica"], ["queue", "queue"], ["worker", "worker", 4], ["kv", "nosql"]],
      ["users>cdn", "cdn>blob", "users>lb", "lb>app", "app>cache", "cache>replica", "app>db", "app>blob", "app>queue", "queue>worker", "worker>kv"],
    ),
  }),
];

// ---------------------------------------------------------------- X / Twitter timelines (Pro)

const tw1 = design([["lb", "lb"], ["app", "app", 3], ["cache", "cache"], ["db", "sqldb"]], ["users>lb", "lb>app", "app>cache", "cache>db", "app>db"]);
const tw2 = design(
  [["lb", "lb"], ["app", "app", 12], ["cache", "cache"], ["db", "sqldb"], ["replica", "replica"]],
  ["users>lb", "lb>app", "app>cache", "cache>replica", "app>db"],
);
const tw3 = design(
  [["lb", "lb"], ["app", "app", 16], ["cache", "cache"], ["kv", "nosql", 2], ["queue", "queue"], ["worker", "worker", 10]],
  ["users>lb", "lb>app", "app>cache", "cache>kv", "app>kv", "app>queue", "queue>worker", "worker>kv"],
);

const twitterStages: Level[] = [
  stage("twitter", 1, true, {
    title: "Posting",
    tagline: "Write a post, read posts from people you follow.",
    concept: {
      intro:
        "The naive timeline: when you open the app, query the posts of everyone you follow, merge and sort them. It works for a small network and is the starting point of every timeline interview.",
      points: ["Posts table keyed by author; follows table keyed by follower.", "Reads vastly outnumber writes.", "Cache hot posts and profiles."],
      tradeoffs: ["Query-time merging is simple but gets slow for people who follow thousands of accounts."],
      interviewTip: "Start with the naive read-time merge, then say why it breaks at scale. Interviewers want to see the evolution.",
    },
    brief: "2,000 timeline reads and 300 posts per second.",
    palette: ["lb", "app", "cache", "sqldb", "replica"],
    start: design([], []),
    scenario: { traffic: { read: 2000, write: 300 }, curve: "steady" },
    budget: 110,
    objectives: { minAvailability: 0.99, maxP95: 100 },
    stretch: [
      { kind: "credits", value: 85 },
      { kind: "p95", value: 80 },
    ],
    hints: ["Users → Load Balancer → App → Cache → SQL.", "Three app instances.", "Keep App → SQL for writes."],
    solution: tw1,
  }),
  stage("twitter", 2, true, {
    title: "The home timeline",
    tagline: "Hundreds of millions open the app every day.",
    concept: {
      intro:
        "Timeline reads dominate: every app open loads dozens of posts. Twitter served home timelines from in-memory caches backed by replicated storage so most reads never touched a primary database.",
      points: ["Cache rendered timelines per user.", "Read replicas catch cache misses.", "The primary handles only writes."],
      tradeoffs: ["Caching whole timelines uses lots of memory; Twitter kept only the most recent ~800 entries per user."],
      interviewTip: "Quantify memory: users x timeline length x id size. It shows you can sanity-check a design.",
    },
    brief: "Timeline reads grow to 9,000 per second with 300 posts per second.",
    palette: ["lb", "app", "cache", "sqldb", "replica"],
    start: tw1,
    scenario: { traffic: { read: 9000, write: 300 }, curve: "steady" },
    budget: 220,
    objectives: { minAvailability: 0.99, maxP95: 120 },
    stretch: [
      { kind: "credits", value: 195 },
      { kind: "p95", value: 90 },
    ],
    hints: ["Twelve app instances for 9,300 requests per second.", "Cache → Read Replica for misses.", "App → SQL primary for posts."],
    solution: tw2,
  }),
  stage("twitter", 3, true, {
    title: "Fan-out on write",
    tagline: "Push each post into every follower's timeline when it is written.",
    concept: {
      intro:
        "Instead of merging at read time, Twitter precomputes timelines: when you post, a fan-out service inserts the post id into each follower's timeline. One post becomes thousands of small writes, done asynchronously by workers into a store built for heavy writes.",
      points: ["Reads become a single lookup of a precomputed list.", "Writes multiply by follower count: queue them.", "Timeline inserts suit sharded NoSQL."],
      tradeoffs: ["Fan-out on write wastes work for inactive followers and is slow for accounts with millions of followers."],
      interviewTip: "Compare fan-out on write vs fan-out on read and say which you pick for which users.",
    },
    brief: "Fan-out turns posts into 3,000 timeline inserts per second, with 9,000 reads. Keep fan-out lag under 20 seconds.",
    palette: ["lb", "app", "cache", "sqldb", "replica", "nosql", "queue", "worker"],
    start: tw2,
    scenario: { traffic: { read: 9000, write: 3000 }, curve: "steady" },
    budget: 340,
    objectives: { minAvailability: 0.99, maxP95: 120, maxLagSec: 20 },
    stretch: [
      { kind: "credits", value: 330 },
      { kind: "lag", value: 5 },
    ],
    hints: ["App → Queue → Workers → Sharded NoSQL for timeline inserts.", "Ten workers drain 3,000 per second; sixteen app instances carry 12,000 requests.", "Two NoSQL shards hold inserts plus cache misses."],
    solution: tw3,
  }),
  stage("twitter", 4, true, {
    title: "The celebrity problem",
    tagline: "One post, 100 million followers.",
    concept: {
      intro:
        "Fan-out on write breaks for celebrities: one post means 100 million inserts. Twitter's hybrid: fan out normal accounts on write, but merge celebrity posts at read time. Spikes still happen when a celebrity post goes viral, so reads must survive a burst.",
      points: ["Hybrid fan-out: write path for most users, read path for accounts above a follower threshold.", "Viral moments spike reads more than writes.", "Size caches and app tier for the burst."],
      tradeoffs: ["Hybrid logic is more complex to build and debug than either pure approach."],
      interviewTip: "Name the threshold rule and explain how a timeline read merges the precomputed list with celebrity posts.",
    },
    brief: "A celebrity post goes viral: a spike of 12,000 reads and 2,000 inserts per second, and an app server fails at the peak.",
    palette: ["lb", "app", "cache", "sqldb", "replica", "nosql", "queue", "worker"],
    start: tw3,
    scenario: {
      traffic: { read: 12000, write: 2000 },
      curve: "spike",
      failures: [{ at: 19, duration: 5, type: "app", count: 1 }],
    },
    budget: 400,
    objectives: { minAvailability: 0.99, maxP95: 150, maxLagSec: 30 },
    stretch: [
      { kind: "failureAvailability", value: 0.995 },
      { kind: "credits", value: 385 },
    ],
    hints: ["Twenty app instances (the maximum) cover the peak with one down.", "Two cache nodes for 12,000 reads.", "Seven workers outpace 2,000 inserts per second; three shards keep NoSQL cool."],
    solution: design(
      [["lb", "lb"], ["app", "app", 20], ["cache", "cache", 2], ["kv", "nosql", 3], ["queue", "queue"], ["worker", "worker", 7]],
      ["users>lb", "lb>app", "app>cache", "cache>kv", "app>kv", "app>queue", "queue>worker", "worker>kv"],
    ),
  }),
];

const comingSoon = (slug: string, title: string, company: string, blurb: string): CaseStudy => ({
  slug,
  title,
  company,
  blurb,
  pro: true,
  comingSoon: true,
  learn: [],
  stages: [],
});

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: "uber",
    title: "How Uber works",
    company: "Uber",
    blurb: "From one city to New Year's Eve worldwide: trips, live driver locations, matching, payments and surviving the busiest night of the year.",
    pro: false,
    learn: ["Separating durable data from ephemeral data", "Geo indexes for live locations", "Async payments with queues", "Redundancy under peak load"],
    stages: uberStages,
  },
  {
    slug: "whatsapp",
    title: "How WhatsApp works",
    company: "WhatsApp",
    blurb: "Billions of messages a day over persistent connections, with media on the side.",
    pro: true,
    learn: ["Write-optimised sharded storage", "Realtime gateways", "Surviving midnight spikes", "Separating media from messages"],
    stages: whatsappStages,
  },
  {
    slug: "netflix",
    title: "How Netflix works",
    company: "Netflix",
    blurb: "Catalogue caching, streaming from the edge, global premieres and the encoding pipeline.",
    pro: true,
    learn: ["Aggressive caching", "CDNs for video", "Chaos-ready redundancy", "Batch pipelines with queues"],
    stages: netflixStages,
  },
  {
    slug: "twitter",
    title: "How X/Twitter timelines work",
    company: "X (Twitter)",
    blurb: "From naive timelines to fan-out on write, and the celebrity problem.",
    pro: true,
    learn: ["Read-heavy caching", "Fan-out on write vs read", "Async inserts at scale", "Viral spikes"],
    stages: twitterStages,
  },
  comingSoon("youtube", "How YouTube works", "YouTube", "Uploads, transcoding and recommendations at planet scale."),
  comingSoon("dropbox", "How Dropbox works", "Dropbox", "File sync, chunking and deduplication."),
  comingSoon("ticketmaster", "How Ticketmaster works", "Ticketmaster", "Virtual waiting rooms and selling one seat exactly once."),
  comingSoon("google-docs", "How Google Docs works", "Google Docs", "Real-time collaborative editing."),
];
