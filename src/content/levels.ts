import { design } from "@/engine/design";
import type { Chapter, Level } from "./types";

type LessonInput = Omit<Level, "kind" | "pro" | "xpPerStar" | "chapter">;

const lesson = (chapter: number, pro: boolean, l: LessonInput): Level => ({ ...l, kind: "lesson", chapter, pro, xpPerStar: 50 });

// ---------------------------------------------------------------- Chapter 1: Foundations

const helloServer = lesson(1, false, {
  id: "hello-server",
  title: "Hello, Server",
  tagline: "Every system starts with a request, a server and a database.",
  concept: {
    intro:
      "A user's browser sends a request; an application server runs your code; a database stores what must survive a restart. Almost every system you will ever design is a more elaborate version of this path.",
    points: [
      "Users never talk to the database directly: the app server checks permissions, validates input and shapes the response.",
      "Latency adds up along the path. Every hop costs time, and a busy component costs more.",
      "Capacity is per component. The weakest box on the path limits the whole system.",
    ],
    tradeoffs: [
      "One server is cheap and simple, but it is also one thing that can break.",
      "Keeping data in the app server's memory is fast but disappears on restart; the database is slower but durable.",
    ],
    interviewTip:
      "Start every design by drawing this simple path and stating the requests per second it must handle. Interviewers want to see you add complexity only when a number forces you to.",
  },
  brief:
    "A small bookshop is going online: 300 page views and 50 orders per second at peak. Connect Users to an App Server and the App Server to a SQL Database.",
  palette: ["app", "sqldb"],
  start: design([], []),
  scenario: { traffic: { read: 300, write: 50 }, curve: "steady" },
  budget: 60,
  objectives: { minAvailability: 0.99, maxP95: 100 },
  stretch: [
    { kind: "credits", value: 40 },
    { kind: "p95", value: 40 },
  ],
  hints: [
    "Drag an App Server and a SQL Database onto the canvas.",
    "Draw a connection from Users to the App Server, then from the App Server to the database. Direction matters: requests flow along the arrow.",
    "One instance of each is enough for this traffic.",
  ],
  solution: design([["app", "app"], ["db", "sqldb"]], ["users>app", "app>db"]),
});

const scaleOut = lesson(1, false, {
  id: "scale-out",
  title: "Scale Out",
  tagline: "When one server is not enough, add more and spread the load.",
  concept: {
    intro:
      "A single app server handles about 1,000 requests per second here. You can buy a bigger machine (vertical scaling) only up to a point; after that you add more machines (horizontal scaling) and put a load balancer in front to spread requests across them.",
    points: [
      "A load balancer gives users one address and forwards each request to a healthy server behind it.",
      "Stateless app servers (no user data kept in memory between requests) can be added or removed freely.",
      "Utilisation matters: at 50% load a server answers fast; above about 70-80% requests start waiting in line and latency climbs steeply.",
    ],
    tradeoffs: [
      "More servers cost more credits; too few and latency explodes at peak.",
      "Horizontal scaling needs stateless servers: sessions move to a shared store such as a cache or database.",
    ],
    interviewTip:
      "Do the arithmetic out loud: '1,900 requests per second at peak, about 1,000 per server, so three servers keeps each near 65%.'",
  },
  brief:
    "The bookshop went viral. Traffic ramps up to 1,800 reads and 100 writes per second. One app server will melt. Add a Load Balancer and enough App Server instances.",
  palette: ["lb", "app", "sqldb"],
  start: design([["app", "app"], ["db", "sqldb"]], ["users>app", "app>db"]),
  scenario: { traffic: { read: 1800, write: 100 }, curve: "ramp" },
  budget: 90,
  objectives: { minAvailability: 0.99, maxP95: 120 },
  stretch: [
    { kind: "credits", value: 70 },
    { kind: "p95", value: 75 },
  ],
  hints: [
    "Select the App Server and raise its instance count in the inspector panel.",
    "Multiple instances only help with a Load Balancer in front: Users → Load Balancer → App Server.",
    "Three app instances keep utilisation near 65% at peak.",
  ],
  solution: design([["lb", "lb"], ["app", "app", 3], ["db", "sqldb"]], ["users>lb", "lb>app", "app>db"]),
});

const noSpof = lesson(1, false, {
  id: "no-single-point-of-failure",
  title: "No Single Point of Failure",
  tagline: "Things break. Design so that one broken thing is not an outage.",
  concept: {
    intro:
      "Hardware fails, deploys go wrong, data centres lose power. A single point of failure (SPOF) is any component whose loss takes the whole system down. Redundancy means running at least one more of everything critical than you strictly need (N+1).",
    points: [
      "Load balancers are critical too: run two, so either can take all traffic.",
      "Keep spare capacity: if one of three app servers dies, the other two must absorb its share without overloading.",
      "Health checks let the load balancer stop sending traffic to a dead server within seconds.",
    ],
    tradeoffs: [
      "Redundancy costs money that sits mostly idle on a good day.",
      "Availability targets drive the spend: 99.9% allows about 43 minutes of downtime a month, 99.99% about 4.",
    ],
    interviewTip: "When you finish a design, walk through it box by box and ask 'what happens if this dies?'. Interviewers love that habit.",
  },
  brief:
    "Steady traffic of 1,500 reads and 100 writes per second. During the run one app instance crashes, and later one load balancer instance dies. Keep availability at 99.5% or better.",
  palette: ["lb", "app", "sqldb"],
  start: design([["lb", "lb"], ["app", "app", 3], ["db", "sqldb"]], ["users>lb", "lb>app", "app>db"]),
  scenario: {
    traffic: { read: 1500, write: 100 },
    curve: "steady",
    failures: [
      { at: 12, duration: 8, type: "app", count: 1 },
      { at: 26, duration: 8, type: "lb", count: 1 },
    ],
  },
  budget: 100,
  objectives: { minAvailability: 0.995, maxP95: 150 },
  stretch: [
    { kind: "failureAvailability", value: 0.999 },
    { kind: "credits", value: 80 },
  ],
  hints: [
    "Run the starting design first and watch what happens at second 26.",
    "Give the Load Balancer two instances.",
    "With three app instances, losing one still leaves enough capacity for 1,600 requests per second.",
  ],
  solution: design([["lb", "lb", 2], ["app", "app", 3], ["db", "sqldb"]], ["users>lb", "lb>app", "app>db"]),
});

// ---------------------------------------------------------------- Chapter 2: Caching

const cacheHotReads = lesson(2, false, {
  id: "cache-the-hot-reads",
  title: "Cache the Hot Reads",
  tagline: "Most reads ask for the same few things. Remember the answers.",
  concept: {
    intro:
      "Popular data is read far more often than it changes. A cache such as Redis keeps recent answers in memory: a hit returns in about a millisecond and never touches the database. In this simulator a cache answers 80% of reads.",
    points: [
      "Cache-aside: the app checks the cache first; on a miss it reads the database and stores the result for next time.",
      "Every hit is load the database never sees, so one cheap cache can replace several database upgrades.",
      "Set an expiry (TTL) so stale data eventually refreshes.",
    ],
    tradeoffs: [
      "Cached data can be stale for up to the TTL; fine for a product page, risky for a bank balance.",
      "A cold or crashed cache sends every read to the database at once (the thundering herd).",
    ],
    interviewTip: "Say what you cache, the expected hit ratio, the TTL, and what happens when the data changes (invalidate or update on write).",
  },
  brief:
    "A news site serves 4,000 article reads and 100 comments per second. The database can do about 3,000 units per second and writes cost 4. Add a cache so the database survives.",
  palette: ["lb", "app", "cache", "sqldb"],
  start: design([["lb", "lb"], ["app", "app", 4], ["db", "sqldb"]], ["users>lb", "lb>app", "app>db"]),
  scenario: { traffic: { read: 4000, write: 100 }, curve: "steady" },
  budget: 120,
  objectives: { minAvailability: 0.99, maxP95: 100 },
  stretch: [
    { kind: "credits", value: 115 },
    { kind: "p95", value: 65 },
  ],
  hints: [
    "Connect the App Server to a Cache. Reads always try the cache first.",
    "The cache needs somewhere to send misses: connect it to the database, or keep the App Server → database link (cache-aside).",
    "The app tier itself is near its limit too: 4,100 requests per second needs at least five instances.",
  ],
  solution: design(
    [["lb", "lb"], ["app", "app", 6], ["cache", "cache"], ["db", "sqldb"]],
    ["users>lb", "lb>app", "app>cache", "cache>db", "app>db"],
  ),
});

const goToTheEdge = lesson(2, false, {
  id: "go-to-the-edge",
  title: "Go to the Edge",
  tagline: "Images and scripts should never touch your app servers.",
  concept: {
    intro:
      "Static files (images, CSS, JavaScript, video segments) are identical for everyone. A content delivery network (CDN) caches them on edge servers close to users. Your origin, usually object storage, only sees the misses.",
    points: [
      "A CDN answers about 90% of static requests here, and it is close to users, so it is fast.",
      "Put files in Object Storage (like S3) as the CDN's origin instead of serving them from app servers.",
      "Dynamic requests still go to your load balancer and app servers.",
    ],
    tradeoffs: [
      "Changing a cached file needs versioned file names or a purge.",
      "CDNs charge per gigabyte; for tiny sites a single server may be cheaper.",
    ],
    interviewTip: "Separate static from dynamic traffic early in the interview: it often removes most of the load from the problem.",
  },
  brief:
    "A photo-heavy store gets 8,000 static file requests, 1,000 reads and 50 writes per second. Today app servers serve the images too and are drowning.",
  palette: ["cdn", "blob", "lb", "app", "cache", "sqldb"],
  start: design([["lb", "lb"], ["app", "app", 3], ["db", "sqldb"]], ["users>lb", "lb>app", "app>db"]),
  scenario: { traffic: { static: 8000, read: 1000, write: 50 }, curve: "steady" },
  budget: 120,
  objectives: { minAvailability: 0.99, maxP95: 150 },
  stretch: [
    { kind: "credits", value: 95 },
    { kind: "p95", value: 60 },
  ],
  hints: [
    "Static files prefer a CDN when Users connect to one.",
    "Connect the CDN to Object Storage so misses have an origin.",
    "With static files gone, two app instances handle the rest.",
  ],
  solution: design(
    [["cdn", "cdn"], ["blob", "blob"], ["lb", "lb"], ["app", "app", 2], ["db", "sqldb"]],
    ["users>cdn", "cdn>blob", "users>lb", "lb>app", "app>db"],
  ),
});

const flashSale = lesson(2, false, {
  id: "flash-sale",
  title: "Flash Sale",
  tagline: "Traffic is calm, then everyone arrives at once.",
  concept: {
    intro:
      "Real traffic is spiky: a push notification, a sale, a celebrity post. You size for the peak, not the average, and you use caches and CDNs so the spike mostly hits cheap layers.",
    points: [
      "Look at the peak-to-average ratio. Here the spike is 2.5x the normal level.",
      "Caches and CDNs absorb spikes cheaply because they scale far further per credit than app servers or databases.",
      "Autoscaling helps in real life but reacts in minutes; for sudden spikes you pre-scale.",
    ],
    tradeoffs: [
      "Capacity for the peak sits idle most of the day.",
      "Shedding load gracefully (a waiting room, a 'try again' page) can be cheaper than serving everyone.",
    ],
    interviewTip: "State both average and peak load, and size for the peak with headroom.",
  },
  brief:
    "A sneaker drop: background traffic, then a short spike of 6,000 reads, 300 writes and 3,000 static files per second. Survive the spike with 99% availability.",
  palette: ["cdn", "blob", "lb", "app", "cache", "sqldb"],
  start: design([["lb", "lb"], ["app", "app", 4], ["db", "sqldb"]], ["users>lb", "lb>app", "app>db"]),
  scenario: { traffic: { read: 6000, write: 300, static: 3000 }, curve: "spike" },
  budget: 190,
  objectives: { minAvailability: 0.99, maxP95: 150 },
  stretch: [
    { kind: "credits", value: 170 },
    { kind: "p95", value: 100 },
  ],
  hints: [
    "Move static files to a CDN backed by Object Storage.",
    "Put a cache between the app tier and the database.",
    "At the peak the app tier sees about 6,300 requests per second: plan for 8 or 9 instances.",
  ],
  solution: design(
    [["cdn", "cdn"], ["blob", "blob"], ["lb", "lb"], ["app", "app", 8], ["cache", "cache"], ["db", "sqldb"]],
    ["users>cdn", "cdn>blob", "users>lb", "lb>app", "app>cache", "cache>db", "app>db"],
  ),
});

// ---------------------------------------------------------------- Chapter 3: Databases

const readReplicas = lesson(3, false, {
  id: "read-replicas",
  title: "Read Replicas",
  tagline: "Copy the database so reads stop competing with writes.",
  concept: {
    intro:
      "A read replica is a copy of the primary database that receives every change and serves read-only queries. Reads spread across replicas; all writes still go to the single primary.",
    points: [
      "Replicas multiply read capacity; they do nothing for write capacity.",
      "Replication is usually asynchronous, so a replica may be a few hundred milliseconds behind.",
      "Route reads that must see the user's own latest write (their profile right after editing) to the primary.",
    ],
    tradeoffs: [
      "Replica lag means stale reads.",
      "Each replica costs as much as a database node and adds load to the primary for streaming changes.",
    ],
    interviewTip: "Mention read-your-own-writes consistency when you add replicas; it shows you know the catch.",
  },
  brief:
    "A social app: 6,000 reads and 500 writes per second. Even with a cache, misses plus heavy writes overload the primary. Add read replicas.",
  palette: ["lb", "app", "cache", "sqldb", "replica"],
  start: design(
    [["lb", "lb"], ["app", "app", 8], ["cache", "cache"], ["db", "sqldb"]],
    ["users>lb", "lb>app", "app>cache", "cache>db", "app>db"],
  ),
  scenario: { traffic: { read: 6000, write: 500 }, curve: "steady" },
  budget: 170,
  objectives: { minAvailability: 0.99, maxP95: 120 },
  stretch: [
    { kind: "credits", value: 155 },
    { kind: "p95", value: 100 },
  ],
  hints: [
    "Connect the app tier (or the cache) to a Read Replica. Reads prefer replicas over the primary.",
    "Writes still need the primary SQL Database; keep that connection.",
    "One replica is enough here.",
  ],
  solution: design(
    [["lb", "lb"], ["app", "app", 8], ["cache", "cache"], ["db", "sqldb"], ["replica", "replica"]],
    ["users>lb", "lb>app", "app>cache", "cache>replica", "app>db"],
  ),
});

const failover = lesson(3, false, {
  id: "failover",
  title: "Failover",
  tagline: "When the primary dies, a standby takes over.",
  concept: {
    intro:
      "Replicas keep reads alive, but writes need a primary. A hot standby receives every change synchronously and is promoted automatically if the primary fails. In this simulator a SQL Database with two instances is a primary plus standby.",
    points: [
      "Synchronous standby: no data lost on failover, slightly slower writes.",
      "Automatic failover takes seconds; plan for them with retries.",
      "A standby adds no capacity on a good day: it is insurance.",
    ],
    tradeoffs: [
      "Paying for an idle standby vs losing writes during an outage.",
      "Split brain: if both nodes think they are primary, data diverges. Real systems use consensus or a witness to prevent it.",
    ],
    interviewTip: "Separate durability (no data lost) from availability (still accepting writes). Failover gives you the second.",
  },
  brief:
    "4,000 reads and 400 writes per second. Ten seconds into the second half, the primary database crashes. Keep 99.5% availability.",
  palette: ["lb", "app", "cache", "sqldb", "replica"],
  start: design(
    [["lb", "lb"], ["app", "app", 6], ["cache", "cache"], ["db", "sqldb"], ["replica", "replica"]],
    ["users>lb", "lb>app", "app>cache", "cache>replica", "app>db"],
  ),
  scenario: {
    traffic: { read: 4000, write: 400 },
    curve: "steady",
    failures: [{ at: 15, duration: 10, type: "sqldb", count: 1 }],
  },
  budget: 180,
  objectives: { minAvailability: 0.995, maxP95: 150 },
  stretch: [
    { kind: "failureAvailability", value: 0.999 },
    { kind: "credits", value: 165 },
  ],
  hints: [
    "Run it once: reads survive the crash because of the replica, but every write fails.",
    "Select the SQL Database and give it two instances (primary plus standby).",
    "Six app instances keep utilisation comfortable.",
  ],
  solution: design(
    [["lb", "lb"], ["app", "app", 6], ["cache", "cache"], ["db", "sqldb", 2], ["replica", "replica"]],
    ["users>lb", "lb>app", "app>cache", "cache>replica", "app>db"],
  ),
});

const shardIt = lesson(3, false, {
  id: "shard-it",
  title: "Shard It",
  tagline: "When writes outgrow one machine, split the data.",
  concept: {
    intro:
      "Replicas do not help writes: every write must reach the one primary. Sharding splits the data by key (user id, order id) across many machines, each owning a slice, so write capacity grows with every shard. Many NoSQL stores shard automatically.",
    points: [
      "Pick a shard key that spreads load evenly; a bad key creates a hot shard.",
      "Queries that need data from many shards get slow and complicated.",
      "Consistent hashing lets you add shards without reshuffling everything.",
    ],
    tradeoffs: [
      "You lose easy joins and cross-shard transactions.",
      "Resharding later is painful, so estimate growth up front.",
    ],
    interviewTip: "Name your shard key and explain why it avoids hot spots. 'Shard by user_id' with a reason beats 'we'll shard it'.",
  },
  brief:
    "An analytics collector: 4,000 events written and 2,000 dashboards read per second. A SQL primary cannot absorb 16,000 write units. Move to sharded NoSQL.",
  palette: ["lb", "app", "cache", "sqldb", "replica", "nosql"],
  start: design(
    [["lb", "lb"], ["app", "app", 8], ["cache", "cache"], ["db", "sqldb"]],
    ["users>lb", "lb>app", "app>cache", "cache>db", "app>db"],
  ),
  scenario: { traffic: { write: 4000, read: 2000 }, curve: "steady" },
  budget: 170,
  objectives: { minAvailability: 0.99, maxP95: 120 },
  stretch: [
    { kind: "credits", value: 155 },
    { kind: "p95", value: 90 },
  ],
  hints: [
    "Replace the SQL Database with Sharded NoSQL (instances are shards).",
    "Writes cost one unit per shard-request in NoSQL; each shard handles about 4,000 units per second.",
    "Two shards and eight app instances are enough.",
  ],
  solution: design(
    [["lb", "lb"], ["app", "app", 8], ["cache", "cache"], ["kv", "nosql", 2]],
    ["users>lb", "lb>app", "app>cache", "cache>kv", "app>kv"],
  ),
});

// ---------------------------------------------------------------- Chapter 4: Async processing (Pro)

const queueTheWrites = lesson(4, true, {
  id: "queue-the-writes",
  title: "Queue the Writes",
  tagline: "Accept work now, do it a moment later.",
  concept: {
    intro:
      "Not every write must finish before you answer the user. A message queue accepts the job instantly and workers process it at a steady pace. Spikes turn into a temporary backlog instead of an overloaded database.",
    points: [
      "Producers (app servers) enqueue; consumers (workers) dequeue and write to the database.",
      "The database only sees the workers' steady rate, which you control.",
      "Lag is the cost: work finishes seconds later. Show the user 'order received', not 'order shipped'.",
    ],
    tradeoffs: [
      "Eventual consistency: the result is not visible immediately.",
      "You must handle retries and duplicate messages (make processing idempotent).",
    ],
    interviewTip: "Use queues for anything slow or spiky that the user does not need to wait for: emails, thumbnails, analytics, order fulfilment.",
  },
  brief:
    "A ticket shop: 1,000 reads and up to 900 purchases per second during a spike. Synchronous writes overload the database at the peak. Put a queue and workers in between, and keep queue lag under 30 seconds.",
  palette: ["lb", "app", "cache", "sqldb", "replica", "queue", "worker"],
  start: design(
    [["lb", "lb"], ["app", "app", 3], ["cache", "cache"], ["db", "sqldb"]],
    ["users>lb", "lb>app", "app>cache", "cache>db", "app>db"],
  ),
  scenario: { traffic: { read: 1000, write: 900 }, curve: "spike" },
  budget: 130,
  objectives: { minAvailability: 0.99, maxP95: 100, maxLagSec: 30 },
  stretch: [
    { kind: "credits", value: 111 },
    { kind: "lag", value: 5 },
  ],
  hints: [
    "Connect the App Server to a Message Queue: writes prefer the queue when one is connected.",
    "Connect the Queue to a Worker, and the Worker to the SQL Database.",
    "Two workers drain 600 jobs per second, which the database can absorb.",
  ],
  solution: design(
    [["lb", "lb"], ["app", "app", 3], ["cache", "cache"], ["db", "sqldb"], ["queue", "queue"], ["worker", "worker", 2]],
    ["users>lb", "lb>app", "app>cache", "cache>db", "app>queue", "queue>worker", "worker>db"],
  ),
});

const keepLagDown = lesson(4, true, {
  id: "keep-the-lag-down",
  title: "Keep the Lag Down",
  tagline: "A queue is only as good as the workers draining it.",
  concept: {
    intro:
      "If jobs arrive faster than workers finish them, the backlog grows forever and 'eventually' becomes 'never'. Size the worker pool for the arrival rate with headroom, and make sure the store behind the workers can take their combined write rate.",
    points: [
      "Little's law: items waiting = arrival rate x time waiting. Watch backlog and lag as first-class metrics.",
      "Scale workers on queue depth, not CPU.",
      "The slowest dependency of the workers sets the real drain rate.",
    ],
    tradeoffs: [
      "More workers drain faster but move the bottleneck to the database.",
      "Batching writes is more efficient but adds latency per item.",
    ],
    interviewTip: "When you add a queue, say how you would monitor it: depth, age of the oldest message, and consumer error rate.",
  },
  brief:
    "A notification service ingests 2,000 events per second, steady, into a queue. Three workers cannot keep up and the backlog grows without end. Keep queue lag under 10 seconds.",
  palette: ["lb", "app", "cache", "nosql", "queue", "worker"],
  start: design(
    [["lb", "lb"], ["app", "app", 4], ["cache", "cache"], ["kv", "nosql"], ["queue", "queue"], ["worker", "worker", 3]],
    ["users>lb", "lb>app", "app>cache", "cache>kv", "app>queue", "queue>worker", "worker>kv"],
  ),
  scenario: { traffic: { write: 2000, read: 500 }, curve: "steady" },
  budget: 170,
  objectives: { minAvailability: 0.99, maxP95: 100, maxLagSec: 10 },
  stretch: [
    { kind: "credits", value: 156 },
    { kind: "lag", value: 2 },
  ],
  hints: [
    "Each worker drains about 300 jobs per second.",
    "2,000 events per second needs at least seven workers.",
    "One NoSQL shard handles the combined write rate comfortably.",
  ],
  solution: design(
    [["lb", "lb"], ["app", "app", 4], ["cache", "cache"], ["kv", "nosql"], ["queue", "queue"], ["worker", "worker", 7]],
    ["users>lb", "lb>app", "app>cache", "cache>kv", "app>queue", "queue>worker", "worker>kv"],
  ),
});

const uploads = lesson(4, true, {
  id: "uploads-object-storage",
  title: "Uploads Belong in Object Storage",
  tagline: "Databases store facts. Files go somewhere built for files.",
  concept: {
    intro:
      "Photos, videos and documents are large and rarely change. Object storage (S3, GCS) stores them cheaply and durably; the database keeps only the file's key and metadata. A CDN in front serves them back to users.",
    points: [
      "Uploads are heavy for app servers (each costs about three normal requests here).",
      "In real systems clients often upload straight to storage with a pre-signed URL, skipping the app tier entirely.",
      "Store the object key in the database row, never the file bytes.",
    ],
    tradeoffs: [
      "Object storage is slower per request than memory or SSD databases, but nearly infinitely scalable.",
      "Two writes (file plus metadata) can get out of sync; clean up orphans with a background job.",
    ],
    interviewTip: "Mention pre-signed upload URLs; it shows you know how to keep large payloads off your servers.",
  },
  brief:
    "A recipe site: 300 photo uploads, 1,500 reads and 4,000 image views per second. There is nowhere to put uploads, and app servers serve every image.",
  palette: ["cdn", "blob", "lb", "app", "cache", "sqldb"],
  start: design(
    [["lb", "lb"], ["app", "app", 3], ["cache", "cache"], ["db", "sqldb"]],
    ["users>lb", "lb>app", "app>cache", "cache>db", "app>db"],
  ),
  scenario: { traffic: { upload: 300, read: 1500, static: 4000 }, curve: "steady" },
  budget: 140,
  objectives: { minAvailability: 0.99, maxP95: 150 },
  stretch: [
    { kind: "credits", value: 130 },
    { kind: "p95", value: 100 },
  ],
  hints: [
    "Uploads can only finish in Object Storage: connect the App Server to it.",
    "Serve images from a CDN with the same Object Storage as origin.",
    "Uploads cost three units each at the app tier: 2,400 units needs three instances, four for fast responses.",
  ],
  solution: design(
    [["cdn", "cdn"], ["blob", "blob"], ["lb", "lb"], ["app", "app", 4], ["cache", "cache"], ["db", "sqldb"]],
    ["users>cdn", "cdn>blob", "users>lb", "lb>app", "app>cache", "cache>db", "app>db", "app>blob"],
  ),
});

// ---------------------------------------------------------------- Chapter 5: Protecting the system (Pro)

const rateLimiting = lesson(5, true, {
  id: "rate-limiting",
  title: "Rate Limiting",
  tagline: "Not every request deserves an answer.",
  concept: {
    intro:
      "Scrapers, credential-stuffing bots and buggy clients can send far more traffic than real users. An API gateway enforces limits per client or per key (for example a token bucket of 100 requests per minute) and rejects the excess with HTTP 429 before it costs you anything.",
    points: [
      "Rate limit at the edge, before expensive work happens.",
      "Token bucket: each client gets tokens that refill at a steady rate; a request spends one.",
      "Return 429 with a Retry-After header so well-behaved clients back off.",
    ],
    tradeoffs: [
      "Limits too tight block real power users; too loose and bots get through.",
      "Distributed rate limiting needs a shared counter (often Redis), which adds a hop.",
    ],
    interviewTip: "Say where the limiter lives, what key it limits on (IP, user, API key) and what the client sees when limited.",
  },
  brief:
    "A pricing API: 2,000 reads and 200 writes per second from real users, plus 6,000 per second from scrapers. Bot traffic does not count toward availability, but it eats your capacity.",
  palette: ["gateway", "lb", "app", "cache", "sqldb"],
  start: design(
    [["lb", "lb"], ["app", "app", 3], ["cache", "cache"], ["db", "sqldb"]],
    ["users>lb", "lb>app", "app>cache", "cache>db", "app>db"],
  ),
  scenario: { traffic: { read: 2000, write: 200, abuse: 6000 }, curve: "steady" },
  budget: 110,
  objectives: { minAvailability: 0.99, maxP95: 120 },
  stretch: [
    { kind: "credits", value: 90 },
    { kind: "p95", value: 75 },
  ],
  hints: [
    "An API Gateway blocks bot traffic.",
    "A gateway also spreads traffic across app instances, so it can replace the load balancer.",
    "Users → API Gateway → App Server (3) → Cache → Database.",
  ],
  solution: design(
    [["gw", "gateway"], ["app", "app", 3], ["cache", "cache"], ["db", "sqldb"]],
    ["users>gw", "gw>app", "app>cache", "cache>db", "app>db"],
  ),
});

const surviveOutage = lesson(5, true, {
  id: "survive-the-outage",
  title: "Survive the Outage",
  tagline: "Four failures in one run. Leave nothing single.",
  concept: {
    intro:
      "Mature systems assume every component will fail and practise it (chaos engineering). This level breaks the load balancer, an app server, the cache and the database primary, one after another.",
    points: [
      "Every tier needs redundancy: load balancer, app, cache and database.",
      "A dead cache is dangerous: all reads suddenly hit the database. A second cache node keeps hit rates up.",
      "Spare capacity must cover the largest single failure.",
    ],
    tradeoffs: [
      "Full redundancy roughly doubles infrastructure cost.",
      "Some systems accept brief degradation (read-only mode) instead of paying for everything twice.",
    ],
    interviewTip: "Name the failure modes you design for and the ones you consciously accept.",
  },
  brief: "3,000 reads and 300 writes per second, steady. The load balancer, an app server, the cache and the primary database each fail for a while. Hold 99.5% availability.",
  palette: ["lb", "app", "cache", "sqldb", "replica"],
  start: design(
    [["lb", "lb"], ["app", "app", 4], ["cache", "cache"], ["db", "sqldb"]],
    ["users>lb", "lb>app", "app>cache", "cache>db", "app>db"],
  ),
  scenario: {
    traffic: { read: 3000, write: 300 },
    curve: "steady",
    failures: [
      { at: 6, duration: 6, type: "lb", count: 1 },
      { at: 14, duration: 6, type: "app", count: 1 },
      { at: 22, duration: 6, type: "cache", count: 1 },
      { at: 30, duration: 6, type: "sqldb", count: 1 },
    ],
  },
  budget: 175,
  objectives: { minAvailability: 0.995, maxP95: 200 },
  stretch: [
    { kind: "failureAvailability", value: 0.999 },
    { kind: "credits", value: 160 },
  ],
  hints: [
    "Two instances each for the load balancer and the database.",
    "Give the cache two instances so losing one keeps most reads off the database.",
    "Five app instances leave enough headroom when one dies.",
  ],
  solution: design(
    [["lb", "lb", 2], ["app", "app", 5], ["cache", "cache", 2], ["db", "sqldb", 2]],
    ["users>lb", "lb>app", "app>cache", "cache>db", "app>db"],
  ),
});

const costCrunch = lesson(5, true, {
  id: "cost-crunch",
  title: "Cost Crunch",
  tagline: "The CFO wants the bill halved. Users must not notice.",
  concept: {
    intro:
      "Good architects design for cost as well as scale. The cheapest request is the one your servers never see: CDNs and caches serve most traffic at a fraction of the price of app servers and databases.",
    points: [
      "Look at what each component costs per request it serves.",
      "Over-provisioned replicas and servers are common: measure utilisation before adding more.",
      "Cheap layers first: CDN, then cache, then app, then database.",
    ],
    tradeoffs: [
      "Running hot saves money but leaves less headroom for spikes.",
      "Every cache adds staleness and another thing to operate.",
    ],
    interviewTip: "If asked to cut cost, find the traffic that does not need to reach the expensive tier.",
  },
  brief:
    "This design costs 160 credits against a budget of 135, and it is still too slow. Traffic: 3,000 reads, 200 writes and 4,000 static files per second. Make it cheaper and faster.",
  palette: ["cdn", "blob", "lb", "app", "cache", "sqldb", "replica"],
  start: design(
    [["lb", "lb"], ["app", "app", 8], ["db", "sqldb"], ["r1", "replica", 2]],
    ["users>lb", "lb>app", "app>db", "app>r1"],
  ),
  scenario: { traffic: { read: 3000, write: 200, static: 4000 }, curve: "steady" },
  budget: 135,
  objectives: { minAvailability: 0.99, maxP95: 150 },
  stretch: [
    { kind: "credits", value: 130 },
    { kind: "p95", value: 100 },
  ],
  hints: [
    "Static files are 55% of traffic: give them a CDN and Object Storage.",
    "A cache in front of the database removes the need for replicas.",
    "Four app instances are enough once static traffic is gone.",
  ],
  solution: design(
    [["cdn", "cdn"], ["blob", "blob"], ["lb", "lb"], ["app", "app", 4], ["cache", "cache"], ["db", "sqldb"]],
    ["users>cdn", "cdn>blob", "users>lb", "lb>app", "app>cache", "cache>db", "app>db"],
  ),
});

// ---------------------------------------------------------------- Chapter 6: Real-time and location (Pro)

const realtime = lesson(6, true, {
  id: "realtime-gateway",
  title: "Real-time Gateway",
  tagline: "Millions of open connections, tiny messages, all the time.",
  concept: {
    intro:
      "Chat, live scores and ride tracking keep a connection open (WebSockets) so the server can push updates instantly. A dedicated real-time gateway holds those connections cheaply and forwards messages to a store built for heavy writes.",
    points: [
      "Polling every second wastes requests; a persistent connection only sends when something changes.",
      "A gateway instance can hold hundreds of thousands of idle connections; app servers cannot.",
      "Chat messages are append-heavy: sharded NoSQL fits better than a single SQL primary.",
    ],
    tradeoffs: [
      "Stateful connections make deploys and load balancing harder (connection draining, sticky routing).",
      "You need a way to find which gateway a user is connected to (a presence service).",
    ],
    interviewTip: "When the prompt says 'real time', ask about delivery guarantees (at-least-once?) and what happens when the receiver is offline.",
  },
  brief: "A team chat app: 8,000 messages and 1,000 page reads per second. Routing messages through app servers into SQL is slow and expensive.",
  palette: ["ws", "lb", "app", "cache", "sqldb", "nosql", "queue", "worker"],
  start: design([["lb", "lb"], ["app", "app", 4], ["db", "sqldb"]], ["users>lb", "lb>app", "app>db"]),
  scenario: { traffic: { message: 8000, read: 1000 }, curve: "steady" },
  budget: 150,
  objectives: { minAvailability: 0.99, maxP95: 100 },
  stretch: [
    { kind: "credits", value: 135 },
    { kind: "p95", value: 50 },
  ],
  hints: [
    "Users → Realtime Gateway carries chat messages; messages prefer it over the load balancer.",
    "Store messages in Sharded NoSQL: three shards cover 8,000 writes per second.",
    "Page reads still go Users → Load Balancer → App → Cache → NoSQL.",
  ],
  solution: design(
    [["ws", "ws"], ["kv", "nosql", 3], ["lb", "lb"], ["app", "app", 2], ["cache", "cache"]],
    ["users>ws", "ws>kv", "users>lb", "lb>app", "app>cache", "cache>kv", "app>kv"],
  ),
});

const findNearby = lesson(6, true, {
  id: "find-nearby",
  title: "Find Nearby",
  tagline: "Ten thousand moving dots, and you need the five closest.",
  concept: {
    intro:
      "Location apps write positions constantly and ask 'what is near this point?'. A normal database index cannot answer that cheaply. Geospatial indexes (geohashes, quadtrees, Redis GEO, H3 cells) split the map into cells so a nearby search only checks a few cells.",
    points: [
      "Location updates are frequent and disposable: keep them in memory, not in a durable SQL table.",
      "Geohash: nearby points share a prefix, so 'near me' becomes a prefix lookup.",
      "Send updates over a persistent connection (Realtime Gateway) to avoid per-request overhead.",
    ],
    tradeoffs: [
      "In-memory indexes lose data on restart; that is fine for positions that refresh every few seconds.",
      "Cell size: too large scans too many points, too small misses neighbours at cell edges.",
    ],
    interviewTip: "Mention geohash or quadtree by name and explain how you query neighbouring cells at boundaries.",
  },
  brief: "Drivers send 10,000 location updates per second; riders run 1,500 nearby searches and 500 reads per second. SQL cannot keep up.",
  palette: ["lb", "ws", "app", "cache", "sqldb", "geo", "nosql"],
  start: design([["lb", "lb"], ["app", "app", 6], ["db", "sqldb"]], ["users>lb", "lb>app", "app>db"]),
  scenario: { traffic: { loc: 10000, nearby: 1500, read: 500 }, curve: "steady" },
  budget: 150,
  objectives: { minAvailability: 0.99, maxP95: 100 },
  stretch: [
    { kind: "credits", value: 135 },
    { kind: "p95", value: 55 },
  ],
  hints: [
    "A Geo Index handles both location updates and nearby searches.",
    "Send location updates through a Realtime Gateway (two instances, behind the load balancer).",
    "Nearby searches go Load Balancer → App → Geo Index; normal reads go App → Cache → SQL.",
  ],
  solution: design(
    [["lb", "lb"], ["ws", "ws", 2], ["app", "app", 3], ["geo", "geo"], ["cache", "cache"], ["db", "sqldb"]],
    ["users>lb", "lb>ws", "ws>geo", "lb>app", "app>geo", "app>cache", "cache>db", "app>db"],
  ),
});

const blackFriday = lesson(6, true, {
  id: "black-friday",
  title: "Black Friday (Boss Level)",
  tagline: "Everything you learned, at once, under fire.",
  concept: {
    intro:
      "The final exam combines spiky traffic, static files, bots, uploads and a failure at the worst moment. There is no single right answer: put each kind of traffic on the cheapest layer that can serve it and leave nothing single.",
    points: [
      "Static to CDN, bots blocked at the gateway, reads to cache and replicas, writes to a queue.",
      "Redundancy where failures happen.",
      "Leave headroom for the spike.",
    ],
    tradeoffs: ["Every credit spent on redundancy is one not spent on capacity; balance them against the targets."],
    interviewTip: "In open-ended interviews, prioritise: handle the biggest traffic first, then the riskiest failure.",
  },
  brief:
    "A retailer's biggest day: a spike of 8,000 reads, 600 orders, 10,000 static files, 100 uploads and 5,000 bot requests per second. An app server dies mid-spike.",
  palette: ["cdn", "blob", "gateway", "lb", "app", "cache", "sqldb", "replica", "queue", "worker"],
  start: design([["lb", "lb"], ["app", "app", 6], ["db", "sqldb"]], ["users>lb", "lb>app", "app>db"]),
  scenario: {
    traffic: { read: 8000, write: 600, static: 10000, upload: 100, abuse: 5000 },
    curve: "spike",
    failures: [{ at: 19, duration: 5, type: "app", count: 1 }],
  },
  budget: 300,
  objectives: { minAvailability: 0.99, maxP95: 200, maxLagSec: 30 },
  stretch: [
    { kind: "failureAvailability", value: 0.995 },
    { kind: "credits", value: 280 },
  ],
  hints: [
    "CDN plus Object Storage for static files and uploads; an API Gateway in front of the app tier for bots.",
    "Cache plus one replica for reads; a queue with workers for orders.",
    "About 11 app instances handle the peak even with one down.",
  ],
  solution: design(
    [
      ["cdn", "cdn"],
      ["blob", "blob"],
      ["gw", "gateway", 2],
      ["app", "app", 11],
      ["cache", "cache"],
      ["db", "sqldb"],
      ["replica", "replica"],
      ["queue", "queue"],
      ["worker", "worker", 3],
    ],
    ["users>cdn", "cdn>blob", "users>gw", "gw>app", "app>cache", "cache>replica", "app>db", "app>queue", "queue>worker", "worker>db", "app>blob"],
  ),
});

export const CHAPTERS: Chapter[] = [
  { id: 1, title: "Foundations", blurb: "Requests, servers, databases, scaling out and redundancy.", pro: false, levels: [helloServer, scaleOut, noSpof] },
  { id: 2, title: "Caching", blurb: "Caches, CDNs and surviving spikes.", pro: false, levels: [cacheHotReads, goToTheEdge, flashSale] },
  { id: 3, title: "Databases", blurb: "Replicas, failover and sharding.", pro: false, levels: [readReplicas, failover, shardIt] },
  { id: 4, title: "Async processing", blurb: "Queues, workers, lag and object storage.", pro: true, levels: [queueTheWrites, keepLagDown, uploads] },
  { id: 5, title: "Protecting the system", blurb: "Rate limiting, chaos and cost.", pro: true, levels: [rateLimiting, surviveOutage, costCrunch] },
  { id: 6, title: "Real-time and location", blurb: "WebSockets, geo indexes and the boss level.", pro: true, levels: [realtime, findNearby, blackFriday] },
];

export const LESSONS: Level[] = CHAPTERS.flatMap((c) => c.levels);
