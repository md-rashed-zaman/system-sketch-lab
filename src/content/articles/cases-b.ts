import type { Article } from "../types";

export const CASES_B_ARTICLES: Record<string, Article> = {
  // ---------------------------------------------------------------- Netflix

  "netflix-1": {
    minutes: 7,
    overview:
      "When you open Netflix, the first thing you see is the home page: rows of posters picked for your profile. This stage explains how a read-heavy page like that is served cheaply and fast. After it you will know how to size an app tier, put a cache in front of a database, and spot work that can be done ahead of time.",
    problem:
      "It is Friday evening and millions of people open Netflix at once. Each of them loads a home page with a dozen rows, each row with dozens of titles, each title with artwork, a name and a match score. If every one of those page loads ran fresh queries against one database, the database would melt long before anyone pressed play. Yet almost nothing on that page changed since the last time it was loaded.",
    sections: [
      {
        icon: "layers",
        heading: "What happens when the home page loads",
        paragraphs: [
          "Your device sends a request to Netflix's servers. A load balancer (a component that spreads requests across many identical servers) picks one app server. The app server gathers what the page needs: your profile, your 'continue watching' list, and the rows recommended for you.",
          "Most of this is metadata: titles, descriptions, artwork links, row order. Metadata is small, and it changes rarely. That makes it a perfect fit for a cache.",
        ],
        bullets: [
          "Load balancer: spreads traffic so no single app server is overwhelmed.",
          "App servers: stateless (they keep no user data in memory between requests), so you can add more of them freely.",
          "Cache: an in-memory store that answers repeat reads in about a millisecond.",
          "Database: the source of truth, touched only when the cache does not have the answer.",
        ],
      },
      {
        icon: "zap",
        heading: "Why caching works so well here",
        paragraphs: [
          "A cache keeps recently used data in memory. When a request finds its answer there, that is a cache hit; when it does not, that is a miss and the request continues to the database. In this game a cache answers about 80% of reads, so only about 1 in 5 reads reaches the database.",
          "Netflix's catalogue is the same for millions of viewers in a region, and your personal rows are already computed. So the hit rate in real life is very high. The database only sees misses and the small stream of writes such as ratings and watch progress.",
        ],
      },
      {
        icon: "cpu",
        heading: "Precompute, then just read",
        paragraphs: [
          "Choosing which rows you see is expensive: it uses machine learning models over your history. Netflix does much of that work offline, in batch jobs that run ahead of time, and stores the results. When you open the app, the server reads a ready answer instead of computing one.",
          "The trade-off is freshness. A precomputed list can be a few hours old. For recommendations that is fine; nobody notices if a row updates this afternoon instead of this second.",
        ],
      },
      {
        icon: "gauge",
        heading: "Sizing the tiers",
        paragraphs: [
          "Every component has a limit. An app server in this game handles about 1,000 requests per second, so divide your total traffic by that and add headroom: servers running near 100% get slow and fall over at the first bump.",
          "Writes are different from reads. A SQL write costs about four times as much as a read, because the database must update indexes and write a durable log. A small number of writes can still eat a big share of the database, so count them separately.",
        ],
      },
    ],
    diagrams: [
      {
        title: "Home page read path",
        nodes: ["client", "lb", "app", "cache", "sqldb"],
        caption: "Reads check the cache first. Only misses and writes reach the SQL database.",
        steps: [
          "A viewer opens Netflix on their TV or phone and asks for their personalised home page.",
          "Picks one of the identical app servers so no single server takes all the Friday evening traffic.",
          "Gathers the profile, 'continue watching' list and precomputed rows; one server handles about 1,000 requests per second.",
          "Returns row and artwork metadata from memory in about 1 ms; about 8 in 10 reads stop here.",
          "Answers only cache misses and writes like ratings and watch progress; each write costs four times a read.",
        ],
      },
    ],
    numbers: [
      { value: "~1,000 req/s", label: "one app server" },
      { value: "~80%", label: "of reads answered by the cache" },
      { value: "~1 ms vs ~5 ms", label: "cache lookup vs database query" },
      { value: "4 units", label: "cost of one SQL write (a read costs 1)" },
    ],
    compare: {
      headers: ["Compute on request", "Precompute offline"],
      rows: [
        ["Freshness", "Always up to the second", "Minutes to hours old"],
        ["Page load cost", "Heavy: runs models on every visit", "Light: one cache or database read"],
        ["Behaviour under load", "Slows down as traffic grows", "Stays flat; reads scale with caches"],
        ["Good for", "Search results, account balance", "Recommendations, catalogue rows"],
      ],
    },
    realWorld: [
      {
        company: "Netflix",
        text: "Netflix built EVCache, a distributed in-memory cache based on memcached, and runs it in front of its data stores on AWS. Data is replicated across availability zones (separate data centres in one region), so losing one zone does not empty the cache.",
      },
      {
        company: "Netflix",
        text: "Netflix has written publicly about personalising not just which titles you see but which artwork is shown for each title. Much of this personalisation is computed ahead of time so the home page itself is mostly fast reads.",
      },
    ],
    mistakes: [
      "Sending every read straight to the database and scaling the database instead of adding a cache.",
      "Running app servers at 100% of capacity with no headroom, so any extra traffic causes timeouts.",
      "Forgetting that writes cost more than reads on a SQL database, and sizing it only by the request count.",
    ],
    interview: {
      tip: "Before drawing boxes, separate the home page into what is personal, what is shared, and what can be precomputed. That split decides where caches go.",
      questions: [
        "How would you invalidate cached catalogue data when a title's artwork or description changes?",
        "What happens to the database if the cache is restarted and comes back empty?",
        "How would you store and serve 'continue watching', which updates while someone is watching?",
        "How stale can recommendations be before users notice, and how would you measure it?",
      ],
    },
    quiz: [
      {
        question: "The home page gets 5,000 reads per second and the cache answers 80% of them. How many reads reach the database?",
        options: ["About 4,000", "About 1,000", "About 500", "None, the cache answers everything"],
        answer: 1,
        explain: "80% of 5,000 is 4,000 hits, so the remaining 20%, about 1,000 reads, are misses that go on to the database.",
      },
      {
        question: "Why does Netflix precompute personalised rows instead of computing them when the page loads?",
        options: [
          "Because recommendations must be identical for every user",
          "Because databases cannot store recommendation results",
          "Because running the models on every page load is expensive, and slightly stale results are acceptable",
          "Because caches only work for data that never changes",
        ],
        answer: 2,
        explain: "Precomputing moves the expensive work out of the request path. The cost is freshness, which barely matters for recommendations.",
      },
      {
        question: "50 writes per second sounds tiny next to 5,000 reads. Why still count them carefully?",
        options: [
          "Writes skip the load balancer",
          "Each SQL write costs several times a read, and writes cannot be answered by the cache",
          "Writes are always slower than 100 ms",
          "Writes go to the read replica",
        ],
        answer: 1,
        explain: "Writes must reach the primary database and cost more per request (indexes and logs), so they take a bigger slice of capacity than their count suggests.",
      },
    ],
  },

  "netflix-2": {
    minutes: 8,
    overview:
      "Video is the heaviest thing Netflix serves, and it never goes through the app servers. This stage explains how a content delivery network (CDN) serves video segments from close to the viewer. After it you will know how to route static traffic to the edge and what the origin behind it does.",
    problem:
      "A viewer in a small town presses play on a two-hour film. If that video had to travel from a data centre on another continent, every second of it would cross long, crowded internet links, and buffering would be constant. Now multiply that by millions of viewers at the same hour. No fleet of app servers can push that much data, and no network budget could pay for it.",
    sections: [
      {
        icon: "film",
        heading: "Video is just many small files",
        paragraphs: [
          "Netflix does not send a film as one giant file. Each title is encoded at several quality levels and cut into short segments, a few seconds of video each. The player downloads segments one after another.",
          "This enables adaptive bitrate streaming: before each segment, the player checks how fast the network is and picks the quality that will arrive in time. On a slow connection it drops to a lower quality instead of freezing.",
          "Because segments never change once encoded, they are static files. Static files can be copied anywhere and cached forever.",
        ],
      },
      {
        icon: "globe",
        heading: "What a CDN does",
        paragraphs: [
          "A CDN is a network of servers spread around the world, called edge servers. They keep copies of popular files close to viewers. When a player asks for a segment, the nearest edge answers if it has the file.",
          "If the edge does not have it, that is a miss, and the edge fetches the file from the origin: the central place where every file lives. In this game the origin is object storage (cheap, durable storage for files, like Amazon S3), and the CDN answers about 90% of static requests itself.",
        ],
        bullets: [
          "Edge hit: fast, short network path, no load on your systems.",
          "Edge miss: one trip to object storage, then the edge keeps a copy for the next viewer.",
          "Origin: sees only about 1 in 10 static requests.",
        ],
      },
      {
        icon: "split",
        heading: "Two paths: control and data",
        paragraphs: [
          "When you press play, two different things happen. First the app asks Netflix's servers for permission: are you logged in, is this title available in your country, which edge should you use? That is small, dynamic traffic and it stays on the app tier.",
          "Then the player streams segments directly from the CDN. That is huge, static traffic and it never touches the app servers. Keeping these paths apart is the main design idea of this stage.",
        ],
      },
      {
        icon: "alert",
        heading: "What goes wrong without it",
        paragraphs: [
          "If static files are served by app servers, each segment request takes a slot that a login or browse request needed. App servers are built for logic, not for pushing bytes, so you would need an enormous fleet just to keep up, and browse requests would start failing too.",
          "Even with a CDN, watch the origin. A cold edge (one that has just started, or a brand new title) sends many misses at once, so the origin must cope with the miss rate, not just the average.",
        ],
      },
    ],
    diagrams: [
      {
        title: "Video segments (data path)",
        nodes: ["client", "cdn", "blob"],
        caption: "The edge answers most segment requests. Misses are fetched once from object storage, the origin.",
        steps: [
          "The viewer presses play and the player asks for the next few seconds of video.",
          "Serves the video segment from a server near the viewer; about 9 in 10 segments never reach the origin.",
          "Holds every encoded segment as the origin; an edge fetches from it only on a miss, then keeps a copy.",
        ],
      },
      {
        title: "Playback authorisation (control path)",
        nodes: ["client", "lb", "app", "cache", "sqldb"],
        caption: "Login, browsing and 'may I play this?' stay on the app tier, unchanged from the first stage.",
        steps: [
          "The viewer presses play and the app asks Netflix whether this title may be played.",
          "Sends the small authorisation request to an app server; the heavy video bytes never pass through here.",
          "Checks the login, whether the title is available in the viewer's country, and which CDN edge to use.",
          "Answers most account and title lookups from memory in about 1 ms.",
          "Is asked only on cache misses, and records changes such as a new device or watch progress.",
        ],
      },
    ],
    numbers: [
      { value: "~90%", label: "of static files served by the CDN" },
      { value: "1 in 10", label: "segment requests reach the origin" },
      { value: "~15 ms vs ~40 ms", label: "edge response vs object storage" },
      { value: "~1,000 req/s", label: "one app server, far too few for video" },
    ],
    compare: {
      headers: ["Serve from app servers", "Serve from a CDN"],
      rows: [
        ["Distance to viewer", "One central region", "An edge near the viewer"],
        ["Load on your systems", "Every segment request", "Only misses, about 1 in 10"],
        ["Cost at scale", "Huge server and bandwidth bill", "Cheap per byte, paid to the CDN or built once"],
        ["Effect on other traffic", "Video crowds out browse and login", "Browse and login are untouched"],
      ],
    },
    realWorld: [
      {
        company: "Netflix",
        text: "Netflix built its own CDN called Open Connect. It places Open Connect Appliances, servers full of disks, inside internet service providers' networks and at internet exchange points, at no charge to the ISP. Popular titles are copied onto them during quiet off-peak hours, so evening viewing is served from inside the viewer's own ISP.",
      },
      {
        company: "Google (YouTube)",
        text: "Google uses a similar idea called Google Global Cache: Google-owned caching servers placed inside ISP networks to serve YouTube and other content. Companies at this scale build their own edge; most others rent capacity from commercial CDNs.",
      },
    ],
    mistakes: [
      "Routing video or image requests through the app servers because 'they are already there'.",
      "Forgetting the origin: a CDN with nothing behind it cannot serve a miss.",
      "Moving the browse and login traffic to the CDN too; dynamic, personal responses belong on the app tier.",
    ],
    interview: {
      tip: "Always split 'design Netflix' into the control plane (accounts, browse, playback authorisation) and the data plane (video bytes). Interviewers want to see that video never touches your app servers.",
      questions: [
        "How does the player decide which quality to download next?",
        "A new season launches tonight. How do you make sure edges already have it?",
        "What happens when an edge server fails mid-stream?",
        "Would you build your own CDN or rent one? What would change your answer?",
      ],
    },
    quiz: [
      {
        question: "40,000 segment requests per second hit the CDN, which serves about 90% from cache. How many reach object storage?",
        options: ["About 400", "About 4,000", "About 36,000", "All 40,000"],
        answer: 1,
        explain: "The CDN misses about 10% of requests, and 10% of 40,000 is 4,000. Those are fetched from the origin.",
      },
      {
        question: "Why are video segments a good fit for a CDN?",
        options: [
          "They are personalised for each viewer",
          "They change every few seconds",
          "They are static files that are identical for everyone who watches that title at that quality",
          "They are too small to store in object storage",
        ],
        answer: 2,
        explain: "CDNs cache files that many people request unchanged. An encoded segment never changes, so one copy at the edge can serve thousands of viewers.",
      },
      {
        question: "With a CDN in place, which traffic should still go to the app servers?",
        options: ["Video segments", "Artwork images", "Playback authorisation and browse requests", "Nothing at all"],
        answer: 2,
        explain: "Dynamic, per-user requests like 'may this account play this title?' need business logic, so they stay on the app tier.",
      },
    ],
  },

  "netflix-3": {
    minutes: 8,
    overview:
      "A big release sends a huge crowd to the same place at the same minute, and parts of the system will fail while it happens. This stage covers designing for the peak, removing single points of failure, and what Netflix learned from breaking its own systems on purpose. After it you will be able to keep a design up when a component dies mid-spike.",
    problem:
      "A hit season drops worldwide at a fixed time. In the minutes after release, browse traffic and video starts jump far above a normal evening. Right at the peak, one cache node crashes and a load balancer goes with it. If your design had exactly one of each, the whole service is now down at the moment the most people are watching.",
    sections: [
      {
        icon: "trending-up",
        heading: "Design for the peak, not the average",
        paragraphs: [
          "A system that is fine on an average night can fail on launch night. Capacity must be sized for the highest point of the spike, with some headroom on top, because the spike is exactly when users judge you.",
          "Known events are a gift: you can prepare. Netflix knows release dates in advance, so it can copy new episodes to edge servers and fill caches before the crowd arrives. This is called pre-warming.",
        ],
      },
      {
        icon: "shield",
        heading: "Single points of failure",
        paragraphs: [
          "A single point of failure is any component whose loss takes the whole service down. One load balancer in front of everything is the classic example: when it dies, nothing can reach the app servers, however many you have.",
          "The fix is redundancy: run at least two of anything critical, and make sure one alone can carry the load. Two half-loaded load balancers survive losing one. Two load balancers both at 90% do not.",
        ],
        bullets: [
          "Ask of every box: 'what happens if this disappears right now?'",
          "Redundant copies must each have spare capacity, or failover just moves the overload.",
          "Stateless tiers (load balancers, app servers) are easy to duplicate.",
        ],
      },
      {
        icon: "database",
        heading: "When a cache node dies",
        paragraphs: [
          "A cache failure is sneaky. Nothing errors at first; the reads that node used to answer simply become misses and fall through to the database. At peak traffic that sudden flood can be several times what the database normally sees.",
          "A read replica (a read-only copy of the database that stays in sync with the primary) gives those misses somewhere to land. In this game a replica handles about 3,000 reads per second, and it leaves the primary free for writes. Spreading the cache over more than one node also means one failure only loses part of the cached data.",
        ],
      },
      {
        icon: "activity",
        heading: "Chaos engineering",
        paragraphs: [
          "You only know your redundancy works if you test it. Netflix made this famous with Chaos Monkey, a tool that randomly shuts down production servers during working hours. Engineers are forced to build services that shrug off a lost instance, because it happens every day.",
          "The idea scaled up over time: Netflix also practises losing a whole AWS region and moving traffic to the others. The lesson for this stage is simple: assume parts will fail during the spike, and make sure the rest can carry the load.",
        ],
      },
    ],
    diagrams: [
      {
        title: "Browse path with somewhere for misses to go",
        nodes: ["client", "lb", "app", "cache", "replica"],
        caption: "Redundant load balancers and cache nodes, with a read replica catching misses so the primary only takes writes.",
        steps: [
          "Millions of viewers open Netflix at once to find the premiere on their home page.",
          "Spreads the spike across app servers; a second load balancer takes over if one fails.",
          "Builds each home page, with spare servers ready so losing one at the peak does no harm.",
          "Answers about 80% of browse reads from memory, spread over redundant cache nodes.",
          "Catches the roughly 20% of reads that miss, about 3,000 per second each, so the primary only takes writes.",
        ],
      },
      {
        title: "Video path during the premiere",
        nodes: ["client", "cdn", "blob"],
        caption: "Pre-warmed edges keep the origin's share of the spike small.",
        steps: [
          "Viewers press play on the premiere the moment it goes live.",
          "Serves segments from edges pre-warmed with the new title, so even the first plays are cache hits.",
          "Sees only the small share of segment requests the warm edges miss, staying well under its limit.",
        ],
      },
    ],
    numbers: [
      { value: "2+", label: "of every critical component, each with spare room" },
      { value: "~20%", label: "of reads miss the cache even when every node is healthy" },
      { value: "~3,000 reads/s", label: "one read replica" },
      { value: "~20,000 req/s", label: "one load balancer" },
    ],
    compare: {
      headers: ["Wait for demand", "Pre-warm before launch"],
      rows: [
        ["First minutes", "Cold caches, many misses, slow starts", "Warm caches and edges, fast starts"],
        ["Load on origin and database", "Spikes hardest at the worst moment", "Spread out over the quiet hours before"],
        ["Cost", "Nothing spent on titles nobody watches", "Bandwidth spent even if the title flops"],
        ["Works for", "Unpredictable traffic", "Known events like releases and live shows"],
      ],
    },
    realWorld: [
      {
        company: "Netflix",
        text: "Netflix created Chaos Monkey around the time it moved to AWS and later open-sourced it. It randomly terminates instances in production so teams must design for failure. The wider 'Simian Army' included tools that simulated the loss of a whole region.",
      },
      {
        company: "Netflix",
        text: "Netflix also published Hystrix, a library for fallbacks and circuit breakers: when a dependency is failing, a service stops calling it and returns a simpler answer, such as a generic row instead of a personalised one. A degraded page is better than an error page.",
      },
    ],
    mistakes: [
      "Running one load balancer and calling the design highly available because there are many app servers behind it.",
      "Adding a second cache node but no fallback for misses, so a cache failure still overloads the primary database.",
      "Sizing for the average evening and hoping the launch spike is short.",
    ],
    interview: {
      tip: "For any spike question, walk through one failure out loud: 'this node dies at peak; here is where its traffic goes and why that place can absorb it.'",
      questions: [
        "How would you pre-warm caches and edges for a release without wasting bandwidth on titles that flop?",
        "A cache node dies at peak. How do you stop the resulting misses from taking down the database?",
        "What would you show on a dashboard during a global launch, and what would page an engineer?",
        "How would you safely run chaos experiments in production?",
      ],
    },
    quiz: [
      {
        question: "You have one load balancer and many app servers. The load balancer fails. What happens?",
        options: [
          "The app servers take over load balancing automatically",
          "Nothing can reach the app servers, so the service is down",
          "Only half of the requests fail",
          "The CDN serves the browse pages instead",
        ],
        answer: 1,
        explain: "A lone load balancer is a single point of failure: every request passes through it, so losing it cuts off everything behind it.",
      },
      {
        question: "Why is a read replica useful when a cache node fails?",
        options: [
          "It makes writes faster",
          "It replaces the cache entirely",
          "It gives the extra cache misses a place to go, so the primary is not flooded",
          "It stores video segments",
        ],
        answer: 2,
        explain: "When a cache node dies, its reads become misses. A replica absorbs them, keeping the primary database free for writes.",
      },
      {
        question: "What is the main point of Chaos Monkey?",
        options: [
          "To test new features on a small group of users",
          "To prove services survive instance failures by causing them on purpose",
          "To reduce cloud costs by shutting down idle servers",
          "To load test the CDN",
        ],
        answer: 1,
        explain: "Randomly killing instances in production forces every team to build for failure and proves the redundancy really works.",
      },
    ],
  },

  "netflix-4": {
    minutes: 9,
    overview:
      "Before anyone can stream a title, Netflix must turn one studio master file into many versions for different screens, networks and languages. This stage covers the batch pipeline behind that: object storage, queues, parallel workers and a database that can take heavy write traffic. After it you will be able to design a job pipeline and tell a temporary spike from a steady overload.",
    problem:
      "A studio delivers the master file for a new film: a very large, very high quality video. Netflix needs dozens of versions of it: several resolutions, several codecs for different devices, plus audio and subtitle tracks. Encoding all of that on one machine would take far too long. Meanwhile, every step of every job reports its progress, and those status updates arrive faster than a single SQL database can write them.",
    sections: [
      {
        icon: "hard-drive",
        heading: "Step 1: upload to object storage",
        paragraphs: [
          "Large files belong in object storage, not in a database. The app server checks who is uploading and where the file should go, then the bytes land in storage. Uploads are heavier work for an app server than an ordinary request, so count them generously.",
          "Once the master is stored, the app does not encode it. It records a job and puts a message on a queue saying 'this title needs encoding'. The upload request can then return quickly.",
        ],
      },
      {
        icon: "inbox",
        heading: "Step 2: queue and parallel workers",
        paragraphs: [
          "A message queue holds jobs until a worker is free. A worker is a background process that pulls a job, does it, and writes the result. In this game a worker handles about 300 jobs per second.",
          "Netflix splits each video into chunks and encodes the chunks in parallel on many workers, then stitches them back together. If one chunk fails, only that chunk is retried. This turns one very long job into many short ones.",
        ],
        bullets: [
          "Job lag: how long a job waits in the queue before a worker picks it up.",
          "Lag stays low only if workers drain jobs at least as fast as they arrive.",
          "Retries must be safe to repeat (idempotent), because a worker can crash halfway.",
        ],
      },
      {
        icon: "alert",
        heading: "A queue smooths spikes, not steady overload",
        paragraphs: [
          "A queue is a buffer. If jobs arrive in a short burst faster than workers can handle, the queue holds the extra and workers catch up afterwards. That is its job.",
          "But if jobs arrive faster than they are processed all the time, the backlog grows every second and never shrinks. Lag climbs without limit. Putting a queue in front of a database that is too slow does not fix the database; it only delays the failure.",
        ],
      },
      {
        icon: "database",
        heading: "Step 3: a store built for writes",
        paragraphs: [
          "Every encoding step writes a status update: queued, encoding, checking quality, done, or failed. On a SQL primary each write costs about four read units, so a steady stream of status writes can exceed what one primary can ever do. A standby copy of the primary adds safety, not write capacity.",
          "Sharded NoSQL is a key-value store split into shards (independent pieces, each owning part of the keys). Writes are cheap, and every added shard adds capacity; in this game each shard handles about 4,000 operations per second. Job status is a natural key-value record: look it up by job id, overwrite it as the job moves on.",
        ],
      },
    ],
    diagrams: [
      {
        title: "Upload and encoding pipeline",
        nodes: ["client", "lb", "app", "queue", "worker", "nosql"],
        caption: "The app stores the master and enqueues jobs. Workers process them and write job status to sharded NoSQL.",
        steps: [
          "A studio uploads the master file of a new film to be encoded.",
          "Routes the upload request to an app server with spare capacity.",
          "Stores the master and puts encoding jobs on the queue instead of encoding while the studio waits.",
          "Holds encoding jobs until a worker is free, so a burst of uploads does not overwhelm the workers.",
          "Pulls a job and encodes one version of the film; one worker handles about 300 jobs per second.",
          "Records each job's status, like queued, encoding or done, on shards that each take about 4,000 operations per second.",
        ],
      },
      {
        title: "Masters land in storage",
        nodes: ["client", "lb", "app", "blob"],
        caption: "Large files go to object storage, which is also the CDN's origin for the finished segments.",
        steps: [
          "A studio uploads a large master file for a new title.",
          "Routes the upload to an app server with spare capacity.",
          "Accepts the upload, which costs about three normal requests, and writes the file to object storage.",
          "Keeps the master and the finished segments durably; it is also the origin the CDN fetches from.",
        ],
      },
    ],
    numbers: [
      { value: "~300 jobs/s", label: "one worker" },
      { value: "~4,000 ops/s", label: "one NoSQL shard" },
      { value: "4 units", label: "one SQL write, so status writes add up fast" },
      { value: "arrival > drain", label: "means lag grows forever" },
    ],
    compare: {
      headers: ["Status in the SQL primary", "Status in sharded NoSQL"],
      rows: [
        ["Write cost", "About 4 units each (indexes, logs)", "Cheap, spread across shards"],
        ["Scaling writes", "Limited to one primary", "Add shards"],
        ["Queries", "Rich joins and transactions", "Look up by key, simple queries"],
        ["Fits", "Accounts, billing, catalogue", "High-volume job and event records"],
      ],
    },
    realWorld: [
      {
        company: "Netflix",
        text: "Netflix encodes each title into many versions and has written about per-title encoding: instead of one fixed set of bitrates for everything, the encoding settings are tuned to each title, so a simple cartoon can look good at a lower bitrate than a dark action film. The work runs as large parallel batch jobs in the cloud.",
      },
      {
        company: "Netflix",
        text: "Netflix is one of the best-known users of Apache Cassandra, a distributed NoSQL database built for heavy write traffic. It has described using Cassandra for high-volume data such as viewing history, where writes are constant and records are looked up by key.",
      },
    ],
    mistakes: [
      "Storing large video files in a database instead of object storage.",
      "Adding a queue in front of an overloaded SQL database and expecting the lag to stay low.",
      "Making retries unsafe, so a worker that crashes and retries produces duplicate or corrupt output.",
    ],
    interview: {
      tip: "Describe the job's life as a state machine (queued, running, done, failed) and say where each state is stored. It shows you think about retries and visibility, not just throughput.",
      questions: [
        "How do you know a title is ready to publish when its chunks finished on many different workers?",
        "A worker crashes halfway through a chunk. What happens to that job?",
        "How would you prioritise encoding a big release over the back catalogue?",
        "Where do jobs go after failing several times, and who gets told?",
      ],
    },
    quiz: [
      {
        question: "Jobs arrive at 1,200 per second all day, and your workers can process 900 per second in total. What happens to job lag?",
        options: [
          "It stays flat because the queue absorbs the difference",
          "It grows without limit, because the backlog increases every second",
          "It drops to zero once the queue fills up",
          "It only matters during spikes",
        ],
        answer: 1,
        explain: "A queue only buffers temporary bursts. With a steady shortfall of 300 jobs per second, the backlog and the wait keep growing.",
      },
      {
        question: "Why is job status a good fit for sharded NoSQL?",
        options: [
          "It needs multi-table transactions",
          "It is a high-volume stream of simple writes looked up by job id",
          "It is rarely written",
          "NoSQL is always faster than SQL for every workload",
        ],
        answer: 1,
        explain: "Status records are simple key-value updates arriving constantly. Sharded NoSQL makes those writes cheap and adds capacity with each shard.",
      },
      {
        question: "Why split a video into chunks before encoding?",
        options: [
          "So many workers can encode parts at the same time, and a failure only retries one chunk",
          "Because object storage cannot hold large files",
          "So the CDN can cache the master file",
          "To avoid needing a queue",
        ],
        answer: 0,
        explain: "Chunking turns one long job into many short parallel ones, which finishes faster and makes retries cheap.",
      },
    ],
  },

  // ---------------------------------------------------------------- X / Twitter

  "twitter-1": {
    minutes: 7,
    overview:
      "Every timeline design starts with the simplest version: store posts, store who follows whom, and build the timeline when someone asks for it. This stage explains that naive design, its data model, and how post IDs are made. After it you will be able to build the baseline every 'design Twitter' answer evolves from.",
    problem:
      "A small social network launches. People write short posts and read posts from accounts they follow. On day one there are a few thousand users and the obvious design works: when you open the app, fetch recent posts from everyone you follow and sort them by time. The question is how far that design goes, and what to put in front of the database so it lasts as long as possible.",
    sections: [
      {
        icon: "database",
        heading: "The data model",
        paragraphs: [
          "Two tables do most of the work. A posts table holds each post's id, author, text and time. A follows table holds pairs: follower and the account they follow.",
          "Building a timeline means: look up everyone you follow, fetch their recent posts, merge them, sort by time, and return the newest few dozen. This is called fan-out on read, because the work of gathering posts happens when you read.",
        ],
        bullets: [
          "posts: id, author_id, text, created_at (indexed by author and time)",
          "follows: follower_id, followee_id (indexed by follower)",
          "Timeline query: posts where author is in my follow list, newest first, limit 50",
        ],
      },
      {
        icon: "zap",
        heading: "Reads dominate, so cache them",
        paragraphs: [
          "People scroll far more than they post. Each app open is a read, and popular posts and profiles get read over and over. A cache in front of the database answers those repeats from memory; in this game it catches about 80% of reads.",
          "Writes are different. A new post must reach the primary database, so the app writes directly to it. On SQL a write costs about four times a read, which is why a few hundred posts per second already take a real share of the database.",
        ],
      },
      {
        icon: "clock",
        heading: "Giving every post an id",
        paragraphs: [
          "A single database can hand out ids by counting up: 1, 2, 3. Once many servers write posts in parallel, one shared counter becomes a bottleneck and a single point of failure.",
          "Twitter solved this with Snowflake: a 64-bit id built from a timestamp, a machine number and a per-machine sequence. Any server can generate ids on its own, ids never collide, and sorting by id is roughly sorting by time, which is exactly what a timeline needs.",
        ],
      },
      {
        icon: "alert",
        heading: "Where the naive design breaks",
        paragraphs: [
          "The read-time merge gets slower the more accounts you follow. Following a thousand accounts means touching a thousand authors' posts for every app open. At large scale this is the main problem the later stages solve.",
          "For now the traffic is modest, so the right move is the simple one: a load balancer, a few app servers, a cache for reads and one SQL database. Do not build fan-out machinery before you need it.",
        ],
      },
    ],
    diagrams: [
      {
        title: "Naive timeline",
        nodes: ["client", "lb", "app", "cache", "sqldb"],
        caption: "Reads try the cache first. Posts are written straight to the SQL primary.",
        steps: [
          "A user opens X to read their home timeline, or posts a new tweet.",
          "Spreads requests across a few app servers so none is overloaded.",
          "Builds the timeline by merging recent tweets from every account the user follows.",
          "Answers about 80% of timeline reads from memory in about 1 ms.",
          "Stores every tweet with a Snowflake id and answers cache misses; each new tweet costs four read units.",
        ],
      },
    ],
    numbers: [
      { value: "~1,000 req/s", label: "one app server" },
      { value: "~80%", label: "of reads answered by the cache" },
      { value: "4 units", label: "one SQL write; a read costs 1" },
      { value: "64 bits", label: "a Snowflake id: time + machine + sequence" },
    ],
    compare: {
      headers: ["Auto-increment id", "Snowflake-style id"],
      rows: [
        ["Who generates it", "The one database", "Any server, independently"],
        ["Bottleneck", "Single counter for all writes", "None shared"],
        ["Sortable by time", "Yes, on one database", "Roughly, across all servers"],
        ["Works with many databases", "Hard: ids collide or need coordination", "Yes"],
      ],
    },
    realWorld: [
      {
        company: "Twitter",
        text: "Twitter started as a Ruby on Rails application on a MySQL database. As it grew it became known for frequent outages, shown to users as the 'fail whale' page, and it gradually moved hot paths onto separate JVM-based services and storage built for its scale.",
      },
      {
        company: "Twitter",
        text: "Twitter announced Snowflake in 2010 when it moved away from MySQL auto-increment ids. The time-ordered 64-bit format became widely copied; Discord and Instagram, for example, have described using similar time-based id schemes.",
      },
    ],
    mistakes: [
      "Starting with fan-out services and sharded stores for a network with a few thousand users.",
      "Sending writes through the cache and expecting the database to stay correct.",
      "Using one shared auto-increment counter once many servers or databases are writing posts.",
    ],
    interview: {
      tip: "Open with this naive design on purpose, then say exactly where it breaks: people who follow thousands of accounts make every read expensive. Interviewers want to see the evolution, not a final answer pulled from memory.",
      questions: [
        "What indexes do the posts and follows tables need for the timeline query?",
        "How would you generate unique, time-sortable ids across many servers?",
        "How do you show a user their own new post immediately after they publish it?",
        "At what point does the read-time merge become too slow, and how would you notice?",
      ],
    },
    quiz: [
      {
        question: "Why is the naive timeline called fan-out on read?",
        options: [
          "Because the post is copied to every follower when it is written",
          "Because the work of gathering posts from everyone you follow happens when you open the timeline",
          "Because reads are sent to many caches",
          "Because it uses read replicas",
        ],
        answer: 1,
        explain: "Nothing is precomputed. Each timeline read fans out to all the accounts you follow and merges their posts.",
      },
      {
        question: "What is the main benefit of Snowflake ids over a database auto-increment counter?",
        options: [
          "They are shorter",
          "They are random, so they are harder to guess",
          "Many servers can create unique, roughly time-ordered ids without coordinating",
          "They remove the need for a posts table",
        ],
        answer: 2,
        explain: "Each id embeds time, machine and sequence, so servers generate ids independently and ids still sort by time.",
      },
    ],
  },

  "twitter-2": {
    minutes: 8,
    overview:
      "Once hundreds of millions of people open the app every day, timeline reads dwarf everything else. This stage covers serving those reads from memory, using read replicas for misses, and keeping the primary database for writes. After it you will be able to separate the read path from the write path and estimate how much memory a timeline cache needs.",
    problem:
      "Your network took off. Each app open loads dozens of posts, and people open the app many times a day. Reads now outnumber posts many times over. The single SQL database is handling the cache misses and every new post at once, and it is close to its limit. Adding app servers alone will not help, because they all lean on the same database.",
    sections: [
      {
        icon: "split",
        heading: "Split reads from writes",
        paragraphs: [
          "The primary database is the only place that accepts writes, and SQL writes are expensive. So you want it doing as little else as possible.",
          "A read replica is a read-only copy of the primary. The primary streams every change to it, and it serves reads. In this game a replica handles about 3,000 reads per second. Point cache misses at replicas and leave the primary to handle new posts.",
        ],
        bullets: [
          "Reads: app, then cache, then a replica on a miss.",
          "Writes: app straight to the primary.",
          "Add replicas to grow read capacity; the primary's write capacity does not grow.",
        ],
      },
      {
        icon: "zap",
        heading: "Cache the timeline itself",
        paragraphs: [
          "Caching individual posts helps, but the big win is caching each user's timeline: the list of post ids to show them, already in order. Opening the app becomes one memory lookup plus fetching the post bodies, which are also cached.",
          "Twitter kept these timelines in Redis, an in-memory data store, and only kept the most recent few hundred entries per user (reportedly around 800). Almost nobody scrolls further, and the cap keeps memory under control.",
        ],
      },
      {
        icon: "coins",
        heading: "Estimate the memory",
        paragraphs: [
          "A quick estimate shows whether the plan is realistic: number of active users times entries per timeline times bytes per entry. A Snowflake id is 8 bytes, and you might store a little extra per entry such as the author id.",
          "For example, 100 million active users times 800 entries times about 16 bytes is around 1.3 terabytes, before replication. That is large but very doable spread across a cluster of cache machines. This kind of arithmetic is what interviewers mean by a back-of-the-envelope estimate.",
        ],
      },
      {
        icon: "clock",
        heading: "Replication lag",
        paragraphs: [
          "Replicas copy changes a little after the primary, usually milliseconds but sometimes seconds under load. This delay is replication lag. A user who posts and then immediately reloads might read from a replica that has not caught up yet, and their post seems to vanish.",
          "A common fix is read-your-own-writes: for a short time after a user writes, serve that user's own reads from the primary, or add their new post to the response directly in the app.",
        ],
      },
    ],
    diagrams: [
      {
        title: "Read path and write path",
        nodes: ["client", "lb", "app", "cache", "replica"],
        caption: "Reads are answered from cache, with misses going to a replica. Posts go from the app straight to the SQL primary.",
        steps: [
          "A user refreshes their home timeline, or posts a tweet.",
          "Spreads timeline reads and posts across the app servers behind it.",
          "Serves timeline reads here, while new tweets go straight to the SQL primary instead.",
          "Returns cached timelines of about 800 tweet ids; about 8 in 10 reads end here.",
          "Answers misses at about 3,000 reads per second each, though it may lag the primary by a moment.",
        ],
      },
    ],
    numbers: [
      { value: "~80%", label: "of timeline reads answered by the cache" },
      { value: "~3,000 reads/s", label: "one read replica" },
      { value: "~800", label: "entries per cached timeline (reportedly, at Twitter)" },
      { value: "8 bytes", label: "one 64-bit post id" },
    ],
    compare: {
      headers: ["Primary only", "Primary plus read replicas"],
      rows: [
        ["Read capacity", "Shared with writes on one machine", "Grows with each replica"],
        ["Write capacity", "One primary", "Still one primary"],
        ["Consistency", "Always up to date", "Replicas may lag slightly"],
        ["Failure impact", "Primary down means reads and writes down", "Reads keep working from replicas"],
      ],
    },
    realWorld: [
      {
        company: "Twitter",
        text: "Twitter engineers described in public talks that home timelines were stored in large Redis clusters, with each user's timeline as a list of recent post ids. Reading a timeline meant fetching that list and then hydrating it: looking up the post bodies and author details from other caches and services.",
      },
      {
        company: "Facebook",
        text: "Facebook published a well-known paper on scaling memcache, describing a huge in-memory cache tier in front of MySQL that serves the vast majority of reads. Like Twitter, the core idea is that the database should mostly see writes and the few reads the cache cannot answer.",
      },
    ],
    mistakes: [
      "Sending cache misses to the primary, so it runs out of room for writes.",
      "Trying to send writes to a read replica; replicas cannot accept writes.",
      "Ignoring replication lag, so users sometimes cannot see their own new post.",
    ],
    interview: {
      tip: "Do the memory estimate out loud: users x timeline length x bytes per entry. It takes thirty seconds and shows you can sanity-check a design.",
      questions: [
        "How much memory does the timeline cache need, and how would you split it across machines?",
        "What happens if the timeline cache loses a node? How do you rebuild those timelines?",
        "How do you make sure users see their own posts right after posting?",
        "Would you store whole posts in the timeline cache or just ids? Why?",
      ],
    },
    quiz: [
      {
        question: "What is the main job of a read replica in this design?",
        options: [
          "Accept new posts when the primary is busy",
          "Serve reads that miss the cache, so the primary can focus on writes",
          "Store video files",
          "Replace the cache",
        ],
        answer: 1,
        explain: "Replicas are read-only copies. They add read capacity and protect the primary, which still takes every write.",
      },
      {
        question: "A user posts, reloads instantly, and their post is missing. What is the most likely cause?",
        options: [
          "The load balancer dropped the write",
          "The cache is too big",
          "Replication lag: the read hit a replica that had not received the new post yet",
          "Snowflake ids are not unique",
        ],
        answer: 2,
        explain: "Replicas trail the primary slightly. Serving a user's own reads from the primary for a moment after writing avoids this.",
      },
      {
        question: "Why did Twitter cap cached timelines at a few hundred entries?",
        options: [
          "Redis cannot store more than 1,000 items",
          "Almost nobody scrolls that far, and the cap keeps memory per user bounded",
          "Older posts are deleted from the database",
          "To make posting faster",
        ],
        answer: 1,
        explain: "Memory is the cost driver for timeline caches. Keeping only recent entries covers nearly all reads at a predictable cost.",
      },
    ],
  },

  "twitter-3": {
    minutes: 9,
    overview:
      "Instead of building each timeline when it is read, Twitter builds it when a post is written: the post id is pushed into every follower's timeline ahead of time. This stage covers that fan-out on write, why it needs a queue and workers, and why the timeline store moves to sharded NoSQL. After it you will be able to compare fan-out on write with fan-out on read.",
    problem:
      "Timeline reads are now so frequent that merging posts at read time is too slow, especially for people who follow thousands of accounts. The idea is to do the work once, when someone posts, so every read is a simple lookup. But one post from someone with 5,000 followers now means 5,000 timeline inserts, and those inserts arrive far faster than a SQL database can write them.",
    sections: [
      {
        icon: "repeat",
        heading: "How fan-out on write works",
        paragraphs: [
          "When you post, the post is saved once. Then a fan-out service looks up your followers and inserts the new post id at the top of each follower's timeline list.",
          "Now reading a timeline is just 'fetch my list'. No merging, no sorting across authors. The expensive work happened earlier, once per post, instead of on every app open.",
        ],
        bullets: [
          "1. Save the post.",
          "2. Put a fan-out job on a queue and return to the user immediately.",
          "3. Workers look up followers and insert the id into each timeline.",
          "4. Followers read their ready-made timeline.",
        ],
      },
      {
        icon: "inbox",
        heading: "Why the fan-out goes through a queue",
        paragraphs: [
          "The user who posted should not wait while thousands of inserts happen. So the app puts a job on a message queue and responds right away; workers do the inserts in the background. In this game each worker handles about 300 jobs per second.",
          "The price is delay. A follower sees the post only after a worker has processed it, so you track fan-out lag: how long jobs wait. Lag stays low only while workers drain the queue at least as fast as jobs arrive.",
        ],
      },
      {
        icon: "database",
        heading: "A store built for many small writes",
        paragraphs: [
          "Fan-out multiplies writes. Each insert is tiny ('add this id to that user's list'), but there are huge numbers of them. On a SQL primary every write costs about four units and write capacity does not grow, so the primary becomes the wall.",
          "Sharded NoSQL splits the data by key, here the user id, so each shard owns some users' timelines. Writes are cheap and each shard adds capacity; in this game a shard handles about 4,000 operations per second. Remember the shards also serve the reads the cache misses.",
        ],
      },
      {
        icon: "alert",
        heading: "What fan-out on write costs",
        paragraphs: [
          "Work is done for every follower, including people who have not opened the app in months. That is wasted inserts and wasted memory, so Twitter reportedly skipped long-inactive users and rebuilt their timeline when they came back.",
          "It also gets slow for accounts with millions of followers: one post becomes millions of inserts, and followers at the end of the list wait a long time. That is the celebrity problem, and it is the next stage.",
        ],
      },
    ],
    diagrams: [
      {
        title: "Write path: fan-out",
        nodes: ["client", "lb", "app", "queue", "worker", "nosql"],
        caption: "The app enqueues the post; workers insert its id into each follower's timeline in sharded NoSQL.",
        steps: [
          "A user posts a tweet to their followers.",
          "Sends the post request to an app server with spare room.",
          "Saves the tweet and enqueues a fan-out job, then replies right away instead of waiting.",
          "Holds fan-out jobs so a burst of tweets is smoothed out instead of dropped.",
          "Inserts the tweet id into each follower's timeline list; one worker handles about 300 jobs per second.",
          "Stores every user's timeline, split across shards by user id, each taking about 4,000 operations per second.",
        ],
      },
      {
        title: "Read path: one lookup",
        nodes: ["client", "lb", "app", "cache", "nosql"],
        caption: "Timelines are read from cache, with misses going to the NoSQL shards that hold them.",
        steps: [
          "A user opens X and asks for their home timeline.",
          "Routes the timeline read to an app server.",
          "Fetches the user's ready-made timeline with one lookup instead of merging hundreds of accounts.",
          "Returns the precomputed timeline from memory; about 80% of reads stop here.",
          "Answers the misses from the shard that owns this user's timeline.",
        ],
      },
    ],
    numbers: [
      { value: "1 post", label: "becomes one insert per follower" },
      { value: "~300 jobs/s", label: "one worker" },
      { value: "~4,000 ops/s", label: "one NoSQL shard, inserts and misses combined" },
      { value: "~1,000 req/s", label: "one app server, enqueueing counts too" },
    ],
    compare: {
      headers: ["Fan-out on write (push)", "Fan-out on read (pull)"],
      rows: [
        ["When the work happens", "Once, when a post is written", "Every time a timeline is read"],
        ["Read cost", "One lookup of a ready list", "Merge posts from every followed account"],
        ["Write cost", "One insert per follower", "One insert, done"],
        ["Freshness", "Delayed by fan-out lag", "Always current"],
        ["Weak spot", "Accounts with huge follower counts", "Users who follow thousands of accounts"],
      ],
    },
    realWorld: [
      {
        company: "Twitter",
        text: "Twitter's home timeline used fan-out on write: when a post was created, its id was inserted into the Redis timeline lists of the author's followers. Engineers described aiming to deliver posts to follower timelines within seconds, with the cached lists replicated for safety.",
      },
      {
        company: "Twitter",
        text: "For durable storage at this scale, Twitter built Manhattan, its own distributed key-value database, and described it publicly in 2014. Key-value stores fit the access pattern: look up a user's data by id, write small records very often.",
      },
    ],
    mistakes: [
      "Doing the fan-out inside the post request, so the author waits for thousands of inserts.",
      "Writing timeline inserts into the SQL primary, whose write capacity cannot grow.",
      "Adding a queue but too few workers, so lag climbs forever under steady traffic.",
    ],
    interview: {
      tip: "Draw both fan-out models side by side and name the user who breaks each one: the celebrity breaks push, the heavy follower breaks pull. Then pick per user.",
      questions: [
        "What happens to fan-out jobs if a worker crashes halfway through a follower list?",
        "How do you handle a post being deleted after it has been fanned out?",
        "Should inactive users get fan-out inserts? How would you handle them instead?",
        "How would you shard the timeline store, and what is the shard key?",
      ],
    },
    quiz: [
      {
        question: "With fan-out on write, what does reading a home timeline involve?",
        options: [
          "Merging the latest posts of every followed account",
          "Fetching the user's precomputed list of post ids",
          "Scanning the whole posts table",
          "Asking each followed account's server for posts",
        ],
        answer: 1,
        explain: "The timeline was built when posts were written, so a read is a single lookup of a ready-made list.",
      },
      {
        question: "Fan-out jobs arrive at 3,000 per second. Why does adding a queue alone not keep lag low?",
        options: [
          "Queues lose jobs under load",
          "Workers must still drain jobs at least as fast as they arrive, or the backlog grows",
          "Queues can only be read by app servers",
          "Lag only depends on the cache",
        ],
        answer: 1,
        explain: "A queue buffers, it does not process. Enough workers must pull jobs off it, or the wait keeps increasing.",
      },
      {
        question: "Which user is the worst case for fan-out on write?",
        options: [
          "Someone who follows 5,000 accounts",
          "Someone who never posts",
          "An account with tens of millions of followers",
          "A brand new account",
        ],
        answer: 2,
        explain: "Every post from a huge account triggers one insert per follower, which is millions of writes and a long delay for some followers.",
      },
    ],
  },

  "twitter-4": {
    minutes: 9,
    overview:
      "Fan-out on write breaks when one account has tens of millions of followers. This stage explains Twitter's hybrid answer, how a timeline read merges two sources, and how to keep the read path standing when a viral post sends a burst of traffic and a server dies at the peak. After it you will be able to design for hot accounts and sudden spikes.",
    problem:
      "A celebrity with a huge following posts something that goes viral. With pure fan-out on write, that one post means a separate insert for every follower, and it could take a long time before the last follower sees it. Meanwhile everyone is refreshing at once, reads spike far above normal, and right at the peak one of your app servers crashes.",
    sections: [
      {
        icon: "users",
        heading: "The hybrid approach",
        paragraphs: [
          "Twitter's answer was to treat accounts differently. Normal accounts keep fan-out on write: their posts are pushed into followers' timelines. Accounts above a follower threshold are not fanned out at all.",
          "Instead, when you open your timeline, the app reads your precomputed list and also fetches recent posts from the few big accounts you follow, then merges them. This is fan-out on read, but only for a handful of accounts per user, so it stays cheap.",
        ],
        bullets: [
          "Below the threshold: push the post to every follower (write time).",
          "Above the threshold: store the post once; followers pull it (read time).",
          "Timeline read = precomputed list + recent posts from followed celebrities, merged by id.",
        ],
      },
      {
        icon: "zap",
        heading: "Hot keys and the cache",
        paragraphs: [
          "When one post goes viral, millions of requests ask for the same data: that post and that author's recent posts. A key read far more than others is called a hot key. Celebrity posts are the textbook example.",
          "Hot keys are exactly what caches are good at, since one cached copy answers everyone. But one cache node can only take so much, so spread the load over more cache nodes, and keep in mind that around 20% of reads still miss and fall through to the store behind the cache.",
        ],
      },
      {
        icon: "trending-up",
        heading: "Viral moments spike reads more than writes",
        paragraphs: [
          "A viral post is one write. The storm is the reads: refreshes, replies being loaded, the post being viewed again and again. So the read path, meaning the app tier and the cache, needs the most headroom for the burst.",
          "Fan-out keeps running underneath. Workers still have to keep up with inserts from all the normal accounts posting replies and reactions, so watch the queue lag during the spike too.",
        ],
      },
      {
        icon: "shield",
        heading: "Losing a server at the peak",
        paragraphs: [
          "Plan for N+1: enough app servers to carry the peak even with one of them gone. If the tier only just copes when everything is healthy, losing one server pushes the rest past their limit and requests start failing exactly when everyone is watching.",
          "Each app server handles about 1,000 requests per second in this game, and there is a cap on how many you can run. When you are close to that cap, every bit of work you can take off the app tier matters.",
        ],
      },
    ],
    diagrams: [
      {
        title: "Hybrid timeline read",
        nodes: ["client", "lb", "app", "cache", "nosql"],
        caption: "The app reads the precomputed timeline and the followed celebrities' recent posts, mostly from cache, and merges them.",
        steps: [
          "A user opens X during a huge live event to see what everyone is saying.",
          "Spreads the spike across app servers, with one spare server ready in case one fails.",
          "Merges the user's precomputed timeline with recent tweets from the celebrities they follow.",
          "Serves both the timeline and the celebrities' hot recent tweets from memory for about 80% of reads.",
          "Answers the roughly 20% of reads that miss, from the shard holding that user's timeline.",
        ],
      },
      {
        title: "Fan-out for normal accounts",
        nodes: ["client", "lb", "app", "queue", "worker", "nosql"],
        caption: "Posts from accounts below the threshold are still pushed into followers' timelines by workers.",
        steps: [
          "A user with a normal follower count posts a tweet or reply.",
          "Sends the post to an app server.",
          "Sees the author is below the celebrity threshold and enqueues a fan-out job for their followers.",
          "Holds fan-out jobs during the spike; watch its lag so timelines do not fall behind.",
          "Inserts the tweet id into each follower's timeline; one worker handles about 300 jobs per second.",
          "Stores the updated timelines across shards that each take about 4,000 operations per second.",
        ],
      },
    ],
    numbers: [
      { value: "N+1", label: "app servers: survive one loss at peak" },
      { value: "~1,000 req/s", label: "one app server" },
      { value: "~20%", label: "of reads still miss the cache" },
      { value: "~300 jobs/s", label: "one fan-out worker" },
    ],
    compare: {
      headers: ["Celebrity on fan-out on write", "Celebrity on fan-out on read"],
      rows: [
        ["Cost of one post", "One insert per follower, millions", "One write"],
        ["Delivery time", "Minutes for the last followers", "Visible on the next read"],
        ["Cost per timeline read", "Nothing extra", "Fetch and merge a few accounts"],
        ["Best for", "Accounts with normal follower counts", "The few accounts with huge followings"],
      ],
    },
    realWorld: [
      {
        company: "Twitter",
        text: "Twitter described this hybrid publicly: most posts were fanned out on write into Redis timelines, while posts from accounts with very large followings were merged in at read time. The mix let reads stay fast without one celebrity post triggering millions of inserts.",
      },
      {
        company: "Twitter",
        text: "Viral moments also drive search and trends. Twitter built Earlybird, a real-time search engine on top of Apache Lucene, so new posts became searchable within seconds, and trending topics are found by spotting terms whose volume suddenly rises above their normal level, not just the most common terms.",
      },
    ],
    mistakes: [
      "Applying fan-out on write to every account, including those with tens of millions of followers.",
      "Sizing the app tier so it only just copes at peak, leaving no room for a server to fail.",
      "Relying on one cache node for a hot key that every user is requesting at once.",
    ],
    interview: {
      tip: "State the threshold rule clearly, then walk through one timeline read step by step: fetch the list, fetch celebrity posts, merge by id, return. Concrete steps beat vague 'hybrid' hand-waving.",
      questions: [
        "How would you choose the follower threshold, and what happens when an account crosses it?",
        "How do you merge the precomputed list with celebrity posts efficiently?",
        "A single post becomes the hottest key in the system. How do you keep one cache node from melting?",
        "How would you detect trending topics from the stream of new posts?",
      ],
    },
    quiz: [
      {
        question: "In the hybrid model, how does a follower see a new post from a celebrity?",
        options: [
          "A worker inserts it into every follower's timeline",
          "The app fetches the celebrity's recent posts at read time and merges them into the timeline",
          "The follower must visit the celebrity's profile",
          "It is emailed to each follower",
        ],
        answer: 1,
        explain: "Accounts above the threshold are not fanned out. Their posts are pulled and merged when a follower reads their timeline.",
      },
      {
        question: "During a viral spike, which part of the system needs the most extra headroom?",
        options: [
          "The write path, because the viral post is written many times",
          "The read path: app servers and cache, because refreshes explode",
          "Object storage",
          "Nothing, because the cache answers every read",
        ],
        answer: 1,
        explain: "A viral post is one write but millions of reads, so the app tier and cache absorb the burst.",
      },
      {
        question: "Your app tier handles the peak only when every server is healthy. One server fails at the peak. What happens?",
        options: [
          "The load balancer queues the extra requests forever without errors",
          "The remaining servers are pushed past capacity and requests fail or slow sharply",
          "The cache takes over the app servers' work",
          "Nothing, because fan-out workers pick up the requests",
        ],
        answer: 1,
        explain: "Without N+1 headroom, losing one server moves its share onto servers that are already full. Plan capacity so the peak fits with one server down.",
      },
    ],
  },
};
