import type { Article } from "../types";

export const CASES_A_ARTICLES: Record<string, Article> = {
  // ---------------------------------------------------------------- Uber
  "uber-1": {
    minutes: 6,
    overview:
      "Every giant system starts as a small one. This stage looks at what Uber's first version had to do in a single city: keep track of riders, drivers and trips, and never lose or mix up a trip. Afterwards you will be able to size a small launch and explain why one app server plus one relational database is the right first move.",
    problem:
      "It is Friday night in San Francisco. A rider taps 'Request', and two drivers nearby both see the offer and tap 'Accept' within the same second. If the system lets both accepts succeed, two cars drive to the same corner and one driver wastes twenty minutes. The very first job of the backend is to be the single, trustworthy source of truth for every trip, even when requests race each other.",
    sections: [
      {
        icon: "users",
        heading: "Three nouns: rider, driver, trip",
        paragraphs: [
          "Most of early Uber fits into three entities. A rider requests rides, a driver accepts them, and a trip links the two with a pickup point, a destination and a price.",
          "The trip is the interesting one because it moves through states. Thinking of it as a state machine (a fixed list of states plus the allowed moves between them) makes the rules clear and makes bugs easy to spot.",
        ],
        bullets: [
          "requested: the rider asked, no driver yet",
          "accepted: one driver committed to the pickup",
          "in progress: the rider is in the car",
          "completed: the car arrived at the destination",
          "paid: the fare was charged and the driver credited",
        ],
      },
      {
        icon: "database",
        heading: "Why a relational database fits",
        paragraphs: [
          "Trips need transactions. A transaction is a group of changes the database applies all together or not at all, so a trip can never be half accepted. Relational (SQL) databases such as PostgreSQL and MySQL have done this reliably for decades.",
          "The double-accept race is solved with a conditional update: 'set driver = X and status = accepted where id = 42 and status = requested'. The first driver's update matches and wins; the second finds the status already changed and gets a polite 'trip taken'.",
          "Writes are more expensive than reads. Each write updates indexes and is recorded in a log before it counts as safe. The game models this: a SQL read costs 1 unit and a write costs 4.",
        ],
      },
      {
        icon: "server",
        heading: "One server is a feature, not a bug",
        paragraphs: [
          "A monolith is one application that contains all the business logic in one codebase and one deployable unit. It is fast to build, easy to debug and cheap to run, which is exactly what a team proving an idea in one city needs.",
          "Keep the app server stateless: it holds no trip data in memory between requests, and everything important lives in the database. That one habit is what lets you add more app servers later without rewriting anything.",
        ],
      },
      {
        icon: "gauge",
        heading: "Sizing the launch",
        paragraphs: [
          "Before placing anything, do the back-of-the-envelope math. Add up requests per second at each component and compare it with what one instance can carry. For example, 300 reads and 50 writes per second cost the database 300 x 1 + 50 x 4 = 500 units.",
          "Aim for comfortable headroom rather than 99% utilisation, because latency climbs sharply as a component nears its limit. Only add a component when a number tells you to: a cache or load balancer you do not need is just extra cost.",
        ],
      },
    ],
    diagrams: [
      {
        title: "The launch-day request path",
        nodes: ["client", "app", "sqldb"],
        caption: "Rider and driver apps call one app server, which reads and writes trips in one SQL database.",
        steps: [
          "A rider taps Request, or a nearby driver taps Accept on that trip offer.",
          "The single app server checks the request and turns it into a trip read or a conditional update.",
          "The SQL database saves the trip in a transaction, so only the first driver's accept wins.",
        ],
      },
    ],
    numbers: [
      { value: "~1,000 req/s", label: "one app server instance" },
      { value: "1 vs 4 units", label: "a SQL read vs a SQL write" },
      { value: "~3,000 units/s", label: "one SQL primary" },
      { value: "standby only", label: "a second SQL instance (failover, not capacity)" },
    ],
    compare: {
      headers: ["Monolith", "Microservices"],
      rows: [
        ["Time to first launch", "Fast: one codebase, one deploy", "Slow: many services, contracts and pipelines"],
        ["Debugging", "One process, one log", "Requests hop across services; needs tracing"],
        ["Scaling teams", "Gets crowded past a few dozen engineers", "Teams own and deploy services independently"],
        ["Right moment", "Day one, one city", "Once traffic and team size force a split"],
      ],
    },
    realWorld: [
      {
        company: "Uber",
        text: "Uber's early backend was a monolith backed by PostgreSQL. As the company grew it split into many services and, in a widely read 2016 engineering post, explained its move from PostgreSQL to MySQL and its own Schemaless storage layer. The simple start bought the time to make those decisions with real data.",
      },
      {
        company: "Shopify",
        text: "Shopify has run one of the largest Ruby on Rails monoliths for many years, splitting it into well-defined modules inside the same codebase instead of rushing into microservices. It shows a monolith can go very far when the code is kept organised.",
      },
    ],
    mistakes: [
      "Starting with microservices, sharding or Kafka for a few hundred requests per second. It slows the launch and adds failure modes nobody needs yet.",
      "Accepting a trip with a plain update instead of a conditional one, so two drivers can both win the race.",
      "Adding a second SQL instance and counting it as double capacity. A primary's twin is a standby for failover; it does not serve extra writes.",
    ],
    interview: {
      tip: "Open with scope and numbers: one city or global, riders and drivers only or also food delivery, and how many trips per day. Then show that the smallest design that fits is a stateless app tier plus a relational database.",
      questions: [
        "What are the core entities and the states of a trip?",
        "How do you stop two drivers from accepting the same trip?",
        "Why SQL rather than NoSQL for trips and payments?",
        "What would you change first if traffic grew 10x?",
      ],
    },
    quiz: [
      {
        question: "Two drivers tap 'Accept' on the same trip at the same moment. What prevents both from winning?",
        options: [
          "A cache in front of the database",
          "A conditional update that only succeeds while the trip is still 'requested'",
          "A second SQL instance as a standby",
          "Running two app servers instead of one",
        ],
        answer: 1,
        explain: "The database applies the conditional update atomically. The first accept changes the status, so the second no longer matches and fails cleanly.",
      },
      {
        question: "Your app sends 200 reads and 100 writes per second to SQL. How many capacity units does the database spend?",
        options: ["300", "500", "600", "1,200"],
        answer: 2,
        explain: "Reads cost 1 unit and writes cost 4: 200 x 1 + 100 x 4 = 600 units per second.",
      },
    ],
  },

  "uber-2": {
    minutes: 7,
    overview:
      "To show cars moving on the map and to match riders with drivers, Uber needs to know where every online driver is right now. This stage explains location streaming: why it is a completely different workload from trips, and why it belongs in memory behind a persistent connection rather than in SQL behind an app server.",
    problem:
      "The rider opens the app and sees little cars gliding along the streets. Each of those cars is a driver's phone reporting its GPS position every few seconds. With tens of thousands of drivers online, that is thousands of updates per second, and each one is out of date a few seconds after it arrives. Pushing all of that through the same app server and database as trips would drown the part of the system that actually matters: the trips.",
    sections: [
      {
        icon: "map-pin",
        heading: "What a location ping is",
        paragraphs: [
          "A ping is a tiny message: driver id, latitude, longitude, heading, speed and a timestamp. Uber has described driver apps sending one every few seconds (around every 4 seconds) while the driver is online.",
          "The rate is simple to estimate: online drivers divided by the ping interval. 20,000 drivers pinging every 4 seconds produce 5,000 updates per second, all day, even when nobody is booking a trip.",
        ],
      },
      {
        icon: "layers",
        heading: "Ephemeral data vs durable data",
        paragraphs: [
          "Durable data must survive anything: trips, payments, ratings. Ephemeral data is only useful for a short time, and losing some of it is harmless. Driver positions are ephemeral: only the latest one matters, and if one is lost the next arrives seconds later.",
          "That difference decides where the data lives. Durable data goes to a database that writes to disk and replicates. Ephemeral, high-rate data goes to memory, where an update is cheap and a crash only means a few seconds of blank map while drivers ping again.",
        ],
      },
      {
        icon: "zap",
        heading: "Persistent connections instead of a request per ping",
        paragraphs: [
          "If every ping were a fresh HTTP request, each one would repeat connection setup, headers and authentication, and an app server would spend its time on overhead rather than work. A WebSocket is a connection the phone opens once and keeps open, so later pings are small frames on an existing pipe.",
          "A realtime gateway is a server built to hold many of these connections and forward small messages quickly. In the game one gateway carries about 10,000 messages per second, roughly ten times what an app server handles, because it skips the heavy per-request work.",
        ],
      },
      {
        icon: "globe",
        heading: "A geo index: where is everyone?",
        paragraphs: [
          "A geo index is an in-memory store organised by location. The map is split into cells, and each cell keeps the list of drivers inside it. An update moves a driver from their old cell to their new one; a search reads a few cells instead of every driver.",
          "Redis GEO is a common way to start; Uber built its own. In the game the geo index absorbs about 20,000 updates per second. The same update written to SQL costs 4 units, rewrites indexes and fills logs with data that is stale before it is safely on disk.",
        ],
      },
    ],
    diagrams: [
      {
        title: "Location path (new)",
        nodes: ["client", "ws", "geo"],
        caption: "Driver apps hold a WebSocket to the realtime gateway, which writes each ping into the in-memory geo index.",
        steps: [
          "A driver's app sends its GPS position about every 4 seconds while the driver is online.",
          "The realtime gateway receives the ping over the driver's already open WebSocket, with no new connection per update.",
          "Updates the driver's position in an in-memory spatial index so nearby searches see it within a second.",
        ],
      },
      {
        title: "Trip path (unchanged)",
        nodes: ["client", "app", "sqldb"],
        caption: "Requests, accepts and trip status keep their own path to durable SQL storage.",
        steps: [
          "A rider requests a ride, a driver accepts it, or either one checks the trip status.",
          "The app server applies the trip state rules, like only moving a trip from requested to accepted once.",
          "The SQL database durably stores the trip change, costing 4 units per write and 1 per read.",
        ],
      },
    ],
    numbers: [
      { value: "every ~4 s", label: "one ping per online driver" },
      { value: "~10,000 msg/s", label: "one realtime gateway" },
      { value: "20,000/s", label: "one geo index node" },
      { value: "4 units", label: "cost of each location write if sent to SQL" },
    ],
    compare: {
      headers: ["New HTTP request per ping", "Persistent WebSocket"],
      rows: [
        ["Setup cost", "Paid on every ping", "Paid once per session"],
        ["Bytes per update", "Headers and auth each time", "A small frame"],
        ["Server-to-phone push", "Not possible; the phone must ask", "Server can push any time"],
        ["Server work", "Full app server request", "Cheap forward by a realtime gateway"],
      ],
    },
    realWorld: [
      {
        company: "Uber",
        text: "Uber keeps live driver state in memory and spreads it across many servers with Ringpop, an open-source library it released in 2015. Ringpop puts servers on a hash ring (consistent hashing decides which server owns which key) and uses gossip, servers chatting with each other, to notice when one joins or dies.",
      },
      {
        company: "Slack",
        text: "Slack clients keep a WebSocket open to Slack's servers, which push new messages, typing indicators and presence changes down it. It is the same trade Uber makes for locations: one long-lived connection is far cheaper than a stream of separate requests.",
      },
    ],
    mistakes: [
      "Writing every ping to the trips database. It burns SQL capacity on data that is worthless seconds later.",
      "Keeping a full history of positions in the hot path. If you need history for analytics, ship it off to a separate pipeline.",
      "Treating the in-memory store as durable. If trips depend on it, a restart loses real business data.",
    ],
    interview: {
      tip: "Name the split out loud: durable business data in SQL, ephemeral high-rate data in memory, each with its own path. Then estimate the ping rate from driver count and interval.",
      questions: [
        "How many location updates per second do you expect, and how did you get that number?",
        "What happens to driver positions if a geo index node crashes?",
        "Why a WebSocket rather than HTTP for location updates?",
        "Where would you store location history for analytics or disputes?",
      ],
    },
    quiz: [
      {
        question: "30,000 drivers each send a ping every 5 seconds. What is the location write rate?",
        options: ["1,500 per second", "6,000 per second", "30,000 per second", "150,000 per second"],
        answer: 1,
        explain: "Rate = drivers / interval = 30,000 / 5 = 6,000 updates per second.",
      },
      {
        question: "Why is it acceptable to keep driver positions only in memory?",
        options: [
          "Memory is more durable than disk",
          "Positions are encrypted",
          "Each position is replaced within seconds, so a lost one is quickly refilled",
          "SQL cannot store latitude and longitude",
        ],
        answer: 2,
        explain: "Location data is ephemeral. After a crash, drivers keep pinging and the index rebuilds itself within seconds; nothing of lasting value is lost.",
      },
      {
        question: "Which component should carry the stream of pings from driver phones?",
        options: ["An app server", "A realtime gateway holding WebSocket connections", "Object storage", "A read replica"],
        answer: 1,
        explain: "A realtime gateway keeps one open connection per phone and forwards small messages cheaply, about ten times more per instance than an app server.",
      },
    ],
  },

  "uber-3": {
    minutes: 7,
    overview:
      "Matching is the heart of Uber: a rider asks for a car, and within seconds the system offers the trip to a good nearby driver. This stage explains the dispatch flow, how a hexagonal grid called H3 turns 'nearby' into a cheap lookup, and why the app tier now needs a load balancer.",
    problem:
      "A rider stands outside a stadium after a match and taps 'Request'. Hundreds of other people do the same. For each request the system must find available drivers close by, guess who can get there fastest and offer them the trip, all before the rider gets impatient. If the 'who is near me' question is answered by scanning a database table, each search is slow, and when a thousand arrive at once the database falls over and every rider sees 'no cars available'.",
    sections: [
      {
        icon: "repeat",
        heading: "The matching flow, step by step",
        paragraphs: [
          "The service that does this is usually called dispatch. It turns one request into a short loop of lookups and offers, and every step must be fast because the rider is staring at a spinner.",
        ],
        bullets: [
          "The rider requests a trip with a pickup point.",
          "Dispatch asks the geo index for drivers in the pickup cell and the cells around it.",
          "It filters out busy drivers and the wrong vehicle types.",
          "It ranks the rest by estimated time to pickup (ETA) along real roads, not straight-line distance.",
          "It offers the trip to the best driver and waits a few seconds.",
          "If the driver declines or the timer runs out, it offers the trip to the next one.",
        ],
      },
      {
        icon: "globe",
        heading: "Hexagons: how H3 divides the map",
        paragraphs: [
          "To make 'nearby' cheap, the map is cut into cells and each driver is filed under the cell they are in. Uber built H3, an open-source system that covers the globe with hexagons at many sizes, from continent-wide down to a few metres.",
          "Hexagons have a neat property: all six neighbours are the same distance from the centre. Square cells have eight neighbours at two different distances (edge and corner), which makes 'everything within one ring' uneven. With H3, a nearby search is 'this cell plus the ring around it'.",
        ],
      },
      {
        icon: "database",
        heading: "Why a SQL scan fails for nearby searches",
        paragraphs: [
          "A naive query looks like 'find drivers where latitude is between A and B and longitude is between C and D'. The database has to check many rows, and those rows change every few seconds as drivers move, so indexes are constantly being rewritten.",
          "The game prices this honestly: a nearby search costs 10 units in SQL but only 2 in the geo index. Sending nearby traffic to the database is the fastest way to melt it.",
        ],
      },
      {
        icon: "scale",
        heading: "Scaling the app tier",
        paragraphs: [
          "Matching is not the only thing growing. Rider apps check trip status over and over while waiting, so reads climb too. One app server handles about 1,000 requests per second, so total app traffic now needs several instances.",
          "Several instances need a load balancer in front: a component that spreads incoming requests evenly so no single server is overloaded. Because the app servers are stateless, any of them can handle any request, which is what makes this work.",
        ],
      },
    ],
    diagrams: [
      {
        title: "Nearby search path",
        nodes: ["client", "lb", "app", "geo"],
        caption: "Requests are spread across app servers, which ask the geo index for nearby drivers instead of SQL.",
        steps: [
          "A rider opens the app to see the drivers near their pickup point.",
          "The load balancer hands the search to whichever app server is least busy right now.",
          "The app server turns the rider's location into a nearby query instead of scanning drivers in SQL.",
          "The geo index returns drivers in the rider's cell and its neighbours for 2 units, versus 10 in SQL.",
        ],
      },
      {
        title: "Location stream (unchanged)",
        nodes: ["client", "ws", "geo"],
        caption: "Driver pings keep flowing into the same geo index that dispatch reads from.",
        steps: [
          "Each online driver's app keeps sending its current position every few seconds.",
          "The realtime gateway forwards each ping arriving on the driver's long-lived WebSocket connection.",
          "The geo index overwrites the driver's old position, so dispatch always reads fresh locations.",
        ],
      },
    ],
    numbers: [
      { value: "10 vs 2 units", label: "one nearby search in SQL vs in the geo index" },
      { value: "~1,000 req/s", label: "one app server instance" },
      { value: "20,000 req/s", label: "one load balancer" },
      { value: "6", label: "equal-distance neighbours of a hexagon cell" },
    ],
    compare: {
      headers: ["Square cells (geohash)", "Hexagon cells (H3)"],
      rows: [
        ["Neighbours", "8, at two different distances", "6, all at the same distance"],
        ["Ring search", "Uneven: corners are farther than edges", "Even rings around a centre"],
        ["Familiarity", "Simple, built into many databases", "A separate library to learn"],
        ["Typical use", "Quick 'roughly nearby' lookups", "Dispatch, pricing and demand analysis by area"],
      ],
    },
    realWorld: [
      {
        company: "Uber",
        text: "Uber open-sourced H3 in 2018. Besides dispatch, it uses the same hexagons to analyse supply and demand by area, which is how pricing can differ from one part of a city to the next.",
      },
      {
        company: "Uber (dispatch)",
        text: "Uber engineers have described their dispatch system in public talks: it keeps supply and demand in memory, sharded by geography across many servers, and earlier versions reportedly used Google's S2 cells before H3 existed. Matching optimises for ETA, not raw distance, because a driver across a river may be close but slow.",
      },
    ],
    mistakes: [
      "Ranking drivers by straight-line distance. A driver on the other side of a highway can be 'close' and ten minutes away.",
      "Sending nearby searches to SQL. It works in a demo and collapses at real traffic.",
      "Adding app servers without a load balancer, so riders cannot actually reach the new instances.",
    ],
    interview: {
      tip: "Walk through matching as a sequence: request, nearby lookup, filter, rank by ETA, offer, timeout, next driver. Then mention how the geo index is sharded by area.",
      questions: [
        "How does the system find drivers near a rider?",
        "What happens if the best driver ignores the offer?",
        "Why hexagons rather than squares or plain latitude and longitude?",
        "How would you shard the geo index, and what happens in a very busy cell?",
        "How do you stop two riders being matched to the same driver?",
      ],
    },
    quiz: [
      {
        question: "Why are hexagons attractive for a ride-hailing grid?",
        options: [
          "They use less memory than squares",
          "All six neighbours are the same distance from the centre",
          "They line up exactly with city blocks",
          "SQL databases index them natively",
        ],
        answer: 1,
        explain: "Equal-distance neighbours make 'this cell plus the ring around it' a fair approximation of a circle, which keeps nearby searches even.",
      },
      {
        question: "Your design sends 1,000 nearby searches per second to SQL. What does that cost the database?",
        options: ["1,000 units", "2,000 units", "4,000 units", "10,000 units"],
        answer: 3,
        explain: "A nearby search costs 10 units in SQL, so 1,000 searches is 10,000 units per second, far beyond one primary. In the geo index it would cost 2,000.",
      },
    ],
  },

  "uber-4": {
    minutes: 7,
    overview:
      "When a trip ends, money has to move: the fare is calculated, the rider is charged, the driver is credited and a receipt goes out. This stage shows why that work is done asynchronously through a queue and background workers, and how idempotency keeps a retry from charging anyone twice.",
    problem:
      "It is 6 pm on a weekday and thousands of trips end within the same few minutes. Each one calls a payment provider that sometimes takes seconds to answer, and sometimes times out. If the 'trip ended' screen waits for all of that, riders stare at spinners, app servers pile up waiting threads, and the database is hammered by a burst of writes at exactly the moment it is busiest. One slow dependency turns rush hour into an outage.",
    sections: [
      {
        icon: "coins",
        heading: "What happens when a trip ends",
        paragraphs: [
          "Ending a trip kicks off a chain of jobs. Only the first one needs to happen before the rider sees the trip summary; the rest can follow seconds later without anyone noticing.",
        ],
        bullets: [
          "Mark the trip completed (must be immediate).",
          "Calculate the final fare from time, distance and pricing.",
          "Charge the rider's card through a payment provider.",
          "Credit the driver's earnings.",
          "Email or push the receipt.",
          "Record the trip for analytics and fraud checks.",
        ],
      },
      {
        icon: "inbox",
        heading: "Take slow work off the request path",
        paragraphs: [
          "A message queue is a buffer between the part that creates work (the producer) and the part that does it (the consumer). The app server drops a 'trip 42 ended' job on the queue and answers the rider right away. Workers pull jobs off the queue and process them at a steady pace.",
          "This smooths bursts: during the peak the queue grows, and after it the workers catch up. The price is delay, called lag. Lag is roughly the backlog divided by how fast the workers drain it. In the game one worker handles about 300 jobs per second, and the brief sets a limit on how much lag is acceptable.",
          "Watch the drain rate. If jobs arrive faster than workers finish them for long enough, the backlog never shrinks and receipts arrive minutes late.",
        ],
      },
      {
        icon: "shield",
        heading: "Idempotency: never charge twice",
        paragraphs: [
          "Queues usually guarantee at-least-once delivery: every job is processed, but a job can be processed twice if a worker crashes after charging but before marking the job done. For payments, a duplicate is a real customer complaint.",
          "The fix is an idempotency key, a unique id for the operation such as 'charge-trip-42'. The worker sends it with the charge, the payment provider and your database remember it, and a repeat with the same key returns the first result instead of charging again. A unique constraint on the key in the database is the safety net.",
        ],
      },
      {
        icon: "zap",
        heading: "Protect the database with a cache",
        paragraphs: [
          "While all of this runs, riders keep refreshing trip status. Those reads are repetitive, so a cache (an in-memory store like Redis) can answer most of them. In the game a cache answers about 80% of reads and sends only misses to SQL.",
          "Every read the cache absorbs leaves database capacity for the workers' writes. Remember that SQL writes cost 4 units each, so the database's budget runs out much faster on writes than on reads.",
        ],
      },
    ],
    diagrams: [
      {
        title: "Trip completion (async)",
        nodes: ["client", "lb", "app", "queue", "worker", "sqldb"],
        caption: "The app enqueues the job and answers at once; workers charge, credit and write results at a pace SQL can sustain.",
        steps: [
          "The driver taps End Trip when the rider reaches the destination.",
          "The load balancer sends the request to any healthy app server.",
          "The app server marks the trip done, enqueues a payment job and replies to the driver right away.",
          "The queue holds the payment job safely until a worker is free, absorbing the end-of-rush spike.",
          "A worker charges the rider's card and credits the driver, handling about 300 jobs per second.",
          "The SQL database records the fare and payment results at a pace it can sustain.",
        ],
      },
      {
        title: "Trip status reads",
        nodes: ["client", "lb", "app", "cache", "sqldb"],
        caption: "Most status checks are answered from the cache; only misses reach the database.",
        steps: [
          "A rider's app checks where the trip stands, like whether the driver is almost there.",
          "The load balancer spreads these frequent status checks across the app servers.",
          "The app server looks up the trip status, asking the cache first.",
          "The cache answers about 80% of status checks from memory in about 1 ms.",
          "Only cache misses read the trip from SQL, and the answer is put back in the cache.",
        ],
      },
    ],
    numbers: [
      { value: "~300 jobs/s", label: "one background worker" },
      { value: "50,000/s", label: "jobs one queue can accept" },
      { value: "~80%", label: "reads answered by a cache" },
      { value: "backlog / drain", label: "queue lag in seconds" },
    ],
    compare: {
      headers: ["Synchronous payment", "Asynchronous payment"],
      rows: [
        ["Rider waits for", "The provider, the database, the email", "Only 'trip completed' to be saved"],
        ["Provider is slow", "App threads pile up; timeouts spread", "Jobs wait in the queue; the app stays fast"],
        ["Rush-hour burst", "Hits the database all at once", "Spread out by the workers' pace"],
        ["New risk", "Fewer moving parts", "Lag and duplicates; needs idempotency and monitoring"],
      ],
    },
    realWorld: [
      {
        company: "Uber",
        text: "Uber is one of the largest users of Apache Kafka, a durable log that works as a queue at huge scale. Its engineers have written publicly about pairing Kafka with retry topics and dead-letter queues, a holding area for jobs that keep failing, so a broken payment is set aside for inspection instead of blocking everything behind it.",
      },
      {
        company: "Stripe",
        text: "Stripe's API accepts an idempotency key on requests that create charges. If a network glitch makes the client retry, Stripe sees the same key and returns the original result rather than charging the card a second time. It is the textbook example of the pattern.",
      },
    ],
    mistakes: [
      "Retrying payments without an idempotency key, so a timeout followed by a retry charges the rider twice.",
      "Adding a queue but too few workers. The queue hides the problem for a while, then lag grows without end.",
      "Putting the 'trip completed' state change itself on the queue, so the rider's app shows the trip still running.",
    ],
    interview: {
      tip: "Whenever money moves, say 'at-least-once delivery with an idempotency key' and explain what happens when a worker crashes halfway through a job.",
      questions: [
        "What must happen synchronously when a trip ends, and what can wait?",
        "How do you guarantee a rider is never charged twice?",
        "What happens if the payment provider is down for ten minutes?",
        "How would you monitor queue lag, and what would you do when it grows?",
        "Where do failed jobs go?",
      ],
    },
    quiz: [
      {
        question: "Jobs arrive at 900 per second during a burst and two workers drain 600 per second. What happens?",
        options: [
          "Jobs are dropped at once",
          "The backlog grows by about 300 jobs per second until the burst ends",
          "The queue speeds the workers up",
          "Nothing; queues have unlimited throughput",
        ],
        answer: 1,
        explain: "Arrivals exceed the drain rate by 300 per second, so the backlog and lag grow. Once the burst passes, the workers catch up, as long as the lag stays within your limit.",
      },
      {
        question: "A worker charges a card, then crashes before marking the job done. The job is redelivered. What prevents a double charge?",
        options: ["A faster worker", "A cache in front of SQL", "An idempotency key for the charge", "A second load balancer"],
        answer: 2,
        explain: "The repeat request carries the same idempotency key, so the provider and the database recognise it and return the first result instead of charging again.",
      },
    ],
  },

  "uber-5": {
    minutes: 7,
    overview:
      "New Year's Eve is famously Uber's busiest night: demand jumps in minutes, and something always breaks at the worst moment. This stage covers pre-scaling for a known peak, running every critical tier with spare capacity (N+1), and degrading gracefully instead of failing.",
    problem:
      "At 11:59 pm the city is quiet. At 12:01 am hundreds of thousands of people walk out of parties and open the app at once. Ride requests, nearby searches and status checks all spike together, and drivers' location pings rise as more come online. In the middle of this, one app server crashes, a geo index node restarts and a realtime gateway drops its connections. A design that was 'just enough' at 11:59 is now an outage on the night everyone remembers.",
    sections: [
      {
        icon: "trending-up",
        heading: "Why a cliff is different from growth",
        paragraphs: [
          "Autoscaling adds servers when it sees load rising, but it needs minutes to notice, start machines and warm them up. A cliff like midnight arrives faster than that, so autoscaling is still catching up when the peak has already hit.",
          "For known peaks, pre-scale: add capacity before the event based on last year's numbers plus growth. It costs money for a few hours, which is far cheaper than losing the most valuable night of the year.",
        ],
      },
      {
        icon: "shield",
        heading: "N+1 on every critical tier",
        paragraphs: [
          "N+1 means running one more instance than the peak needs, so losing any one still leaves enough. The test is simple: take one instance away and check that the rest are still below 100% at the peak.",
          "Apply it to everything on the critical path, not just app servers. A single load balancer, a single realtime gateway or a single geo index node is a single point of failure: when it goes, its whole path goes with it.",
          "Several realtime gateways need something in front to spread connections across them, just like app servers. When a gateway dies, its phones reconnect and the load balancer sends them to the survivors, which must be able to carry the extra load.",
        ],
      },
      {
        icon: "alert",
        heading: "Degrade gracefully",
        paragraphs: [
          "When demand is higher than supply, the goal is a slower experience rather than a broken one. Show a longer ETA instead of an error, and temporarily switch off non-essential features (such as fancy map animations or promotions) to save capacity for booking trips.",
          "Surge pricing is partly a demand-management tool. Higher prices in a busy area encourage some riders to wait and more drivers to come online, which keeps waits bounded instead of letting the queue of riders grow without limit.",
        ],
      },
      {
        icon: "activity",
        heading: "Find the first thing that breaks",
        paragraphs: [
          "Before the peak, walk every path and compute its peak load against its capacity, including the case where one instance has failed. Whatever runs out first is where to spend money first.",
        ],
        bullets: [
          "Location pings: do the gateways and geo index have room for double traffic minus one node?",
          "Nearby searches: are they all going to the geo index, never SQL?",
          "Reads and writes: can the app tier lose one server at the peak?",
          "Payments: will workers drain the queue within the allowed lag?",
          "Front door: is there a second load balancer?",
        ],
      },
    ],
    diagrams: [
      {
        title: "Redundant location path",
        nodes: ["client", "lb", "ws", "geo"],
        caption: "A load balancer spreads connections across several gateways, which write into a multi-node geo index.",
        steps: [
          "A driver's app connects to send live location pings during the Friday night peak.",
          "The load balancer picks a healthy realtime gateway and skips any that has failed.",
          "One of several gateways holds the driver's WebSocket, with one spare beyond peak need.",
          "A multi-node geo index stores the position, so losing one node does not blank the rider's map.",
        ],
      },
      {
        title: "Redundant trip path",
        nodes: ["client", "lb", "app", "queue", "worker", "sqldb"],
        caption: "Enough app servers to lose one at the peak, with payments still flowing through the queue.",
        steps: [
          "A rider requests or finishes a trip during the busiest hour of the night.",
          "The load balancer routes around any app server that crashes, so riders never notice.",
          "One of N+1 app servers handles the trip, so the fleet survives losing one at peak.",
          "The queue keeps payment jobs safe even if a worker dies halfway through the night.",
          "Workers charge riders and pay drivers, and a spare worker picks up jobs when another fails.",
          "The SQL primary stores trips and payments, with a hot standby ready to take over.",
        ],
      },
    ],
    numbers: [
      { value: "N+1", label: "instances: peak need plus one spare" },
      { value: "~10,000 msg/s", label: "one realtime gateway" },
      { value: "20,000/s", label: "one geo index node" },
      { value: "minutes", label: "how long autoscaling takes to react" },
    ],
    compare: {
      headers: ["Autoscaling", "Pre-scaling"],
      rows: [
        ["Trigger", "Reacts to load it already sees", "Planned before a known event"],
        ["Speed", "Minutes behind a sudden cliff", "Ready before the first request"],
        ["Cost", "Pay only when busy", "Pay for spare capacity for a few hours"],
        ["Best for", "Gradual daily curves", "Midnights, launches, big matches"],
      ],
    },
    realWorld: [
      {
        company: "Uber",
        text: "Uber has long described New Year's Eve as one of its busiest nights of the year and plans capacity for it well in advance. It is also the night surge pricing became famous, as high multipliers at midnight pulled more drivers onto the road and made headlines.",
      },
      {
        company: "Netflix",
        text: "Netflix built Chaos Monkey, a tool that randomly shuts down production servers during working hours. It forces every service to survive losing an instance, so a real failure on a busy night is routine instead of a surprise.",
      },
    ],
    mistakes: [
      "Making the app tier redundant but leaving one load balancer, one gateway or one geo node as a single point of failure.",
      "Sizing for the peak without checking the peak minus one failed instance.",
      "Relying on autoscaling alone for a cliff that arrives in seconds.",
    ],
    interview: {
      tip: "Close every design by stress-testing it: 'traffic doubles at midnight and one node of each tier fails; what breaks first?' Then fix the weakest link.",
      questions: [
        "Traffic doubles in five minutes. What breaks first in your design?",
        "How do you remove single points of failure from the location path?",
        "What happens to connected drivers when a realtime gateway dies?",
        "Which features would you switch off to protect booking?",
        "How does surge pricing help the system, not just revenue?",
      ],
    },
    quiz: [
      {
        question: "A tier needs 9,000 req/s at peak and each instance handles 1,000. How many instances satisfy N+1?",
        options: ["9", "10", "12", "18"],
        answer: 1,
        explain: "Nine instances carry the peak exactly; one more means any single failure still leaves nine. Many teams add a little extra headroom on top.",
      },
      {
        question: "Why does adding a load balancer in front of the realtime gateways help when one gateway fails?",
        options: [
          "It caches location pings",
          "It makes each gateway faster",
          "Reconnecting phones are sent to the surviving gateways instead of the dead one",
          "It writes pings directly to the geo index",
        ],
        answer: 2,
        explain: "Without a load balancer, phones pinned to the dead gateway have nowhere to go. With one, they reconnect and are spread across the remaining instances.",
      },
    ],
  },

  // ---------------------------------------------------------------- WhatsApp
  "whatsapp-1": {
    minutes: 6,
    overview:
      "At its heart WhatsApp does one thing: take a message from one phone and deliver it to another, reliably. This stage explains the life of a message, store-and-forward delivery, and why a write-heavy chat workload belongs in a sharded key-value store rather than a single SQL database.",
    problem:
      "You send 'On my way' to a friend whose phone is in a tunnel. The message cannot be delivered yet, but it must not be lost, and when your friend comes out of the tunnel it should appear once, in the right order, with the right ticks on your side. Now multiply that by thousands of messages per second, nearly all of them new writes that are read once and then forgotten.",
    sections: [
      {
        icon: "message",
        heading: "The life of a message",
        paragraphs: [
          "WhatsApp uses store-and-forward delivery. The server stores the message until the recipient's phone confirms it has received it, then forwards it, and the recipient's phone keeps the long-term copy. WhatsApp says it deletes delivered messages from its servers and drops undelivered ones after about 30 days.",
          "Each step sends a receipt back to the sender, which is what the ticks mean:",
        ],
        bullets: [
          "One grey tick: the server has the message.",
          "Two grey ticks: the recipient's phone has it.",
          "Two blue ticks: the recipient opened the chat (if read receipts are on).",
        ],
      },
      {
        icon: "database",
        heading: "The shape of message data",
        paragraphs: [
          "A message record is small: conversation id, message id, sender, timestamp and an encrypted body. Messages are append-only, meaning new records are added and old ones are almost never changed.",
          "The workload is write-heavy. Every message is a write, and every receipt is another small write. Most messages are read once, by one device, shortly after being written. That is the opposite of a product catalogue, where a few writes feed millions of reads.",
        ],
      },
      {
        icon: "split",
        heading: "Sharding by conversation",
        paragraphs: [
          "Sharding splits data across several database servers called shards. A shard key decides where each record goes; hashing the conversation id is a natural choice, so all of one chat's messages live together and loading a chat touches one shard.",
          "Capacity then grows with the number of shards: double the shards, double the writes you can absorb. The risk is a hot shard, where one very busy conversation or key gets more traffic than its shard can handle.",
        ],
      },
      {
        icon: "gauge",
        heading: "Why one SQL database struggles",
        paragraphs: [
          "A single SQL primary takes every write on one machine, and each write pays for indexes and logs. In the game a SQL write costs 4 units out of about 3,000 per second, so a chat workload runs out of room quickly, and a second SQL instance is only a standby.",
          "A sharded NoSQL store gives up joins and cross-shard transactions, which chat barely needs, and in exchange each write costs 1 unit and every shard adds about 4,000 per second. Features that need to look across all chats, like search, can run on the phone, which already holds the history.",
        ],
      },
    ],
    diagrams: [
      {
        title: "Send and store a message",
        nodes: ["client", "lb", "app", "nosql"],
        caption: "Requests are spread across app servers, which write each message to the shard that owns its conversation.",
        steps: [
          "A user types a chat message and taps Send.",
          "The load balancer spreads incoming messages across the app servers.",
          "The app server checks the sender and works out which shard owns this conversation.",
          "The conversation's NoSQL shard stores the message, at up to 4,000 writes per second per shard.",
        ],
      },
    ],
    numbers: [
      { value: "4,000/s", label: "writes one NoSQL shard handles" },
      { value: "4 units", label: "one SQL write (vs 1 in NoSQL)" },
      { value: "~1,000 req/s", label: "one app server instance" },
      { value: "~30 days", label: "how long WhatsApp keeps an undelivered message" },
    ],
    compare: {
      headers: ["Single SQL database", "Sharded NoSQL"],
      rows: [
        ["Write cost", "High: indexes, logs, one machine", "Low: append to one shard"],
        ["Scaling writes", "Bigger machine; a second instance is a standby", "Add shards; capacity grows with each"],
        ["Queries", "Rich joins and ad-hoc queries", "Lookups by key, such as one conversation"],
        ["Fits", "Accounts, billing, settings", "High-volume, append-only messages"],
      ],
    },
    realWorld: [
      {
        company: "WhatsApp",
        text: "WhatsApp's servers act as a delivery service, not an archive: messages wait on the server only until they reach the recipient's device. Early versions reportedly kept this transient state in Mnesia, Erlang's built-in distributed database, which fit a team that built almost everything on Erlang.",
      },
      {
        company: "Discord",
        text: "Discord has written in detail about storing billions of messages in Cassandra (and later ScyllaDB), partitioned by channel and a time bucket. It is the same idea as sharding by conversation: keep one chat's recent messages together so loading it is a single cheap lookup.",
      },
    ],
    mistakes: [
      "Sharding by user id for one-to-one chat, so every conversation's messages are split across two shards.",
      "Putting chat messages in a single SQL primary and expecting the standby to add write capacity.",
      "Forgetting that receipts are writes too, which can nearly double the write rate.",
    ],
    interview: {
      tip: "Write the message schema (conversation_id, message_id, sender, timestamp, body) and say what the shard key is and why. Mention that receipts are extra writes.",
      questions: [
        "How do you store messages for users who are offline?",
        "What is your shard key, and what happens with a very busy group?",
        "How do you keep messages in order within a conversation?",
        "How do delivery and read receipts work?",
        "How would you support searching old messages?",
      ],
    },
    quiz: [
      {
        question: "What does 'store-and-forward' mean for a messaging server?",
        options: [
          "It keeps every message forever as a backup",
          "It holds a message until the recipient's device receives it, then forwards it",
          "It forwards messages without ever storing them",
          "It stores messages only on the sender's phone",
        ],
        answer: 1,
        explain: "The server is a temporary holding point: it stores the message until delivery is confirmed, which is what lets messages reach phones that were offline.",
      },
      {
        question: "Why is hashing the conversation id a good shard key for chat?",
        options: [
          "It keeps one chat's messages on one shard, so loading a chat is a single lookup",
          "It makes global search fast",
          "It guarantees every shard gets exactly the same traffic",
          "It lets SQL joins work across shards",
        ],
        answer: 0,
        explain: "Grouping by conversation means the common operation, 'load this chat', touches one shard. It does not prevent hot shards for very busy chats.",
      },
      {
        question: "1,600 messages per second go to SQL. How many units does that cost the database?",
        options: ["1,600", "3,200", "6,400", "16,000"],
        answer: 2,
        explain: "Each SQL write costs 4 units: 1,600 x 4 = 6,400, more than twice one primary's capacity. In NoSQL the same traffic costs 1,600 units.",
      },
    ],
  },

  "whatsapp-2": {
    minutes: 7,
    overview:
      "A chat app feels instant only if the server can push a message to the recipient the moment it arrives. This stage explains persistent connections, what a realtime gateway does, how the system finds which server a user is connected to, and how storage keeps up as volume grows.",
    problem:
      "Imagine every phone asking the server 'any new messages?' every few seconds. With millions of phones online, the servers spend nearly all their time answering 'no', batteries drain, and messages still arrive seconds late. WhatsApp's answer was to keep one connection open to every phone and push messages down it, which means holding an enormous number of connections at once.",
    sections: [
      {
        icon: "zap",
        heading: "Push, not poll",
        paragraphs: [
          "Polling means the client asks repeatedly whether something changed. It is simple, but most answers are empty and the delay is up to one polling interval.",
          "With a persistent connection the phone connects once and stays connected. When a message arrives the server pushes it immediately, and the phone does nothing while there is nothing to say, apart from a small heartbeat now and then to keep the connection alive.",
        ],
      },
      {
        icon: "network",
        heading: "What a realtime gateway does",
        paragraphs: [
          "A realtime gateway (sometimes called a chat server or connection server) holds these long-lived connections. Its job is narrow: accept a message from one connection, hand it to storage, and push it to the recipient's connection.",
          "Because it skips the heavy work of a general app server, it is far cheaper per message. In the game one gateway carries about 10,000 messages per second, while an app server handles about 1,000 requests. Normal requests like loading the chat list or a profile still go through app servers.",
        ],
      },
      {
        icon: "users",
        heading: "Who is connected where?",
        paragraphs: [
          "With many gateways, the sender's gateway must find the recipient's. A presence registry is a fast lookup from user id to 'connected to gateway 17' (or 'offline'), updated every time a phone connects or disconnects.",
          "If the recipient is online, the message is routed to their gateway and pushed. If they are offline, it stays in storage, and the system sends a mobile push notification through Apple's or Google's service to wake the app up.",
        ],
      },
      {
        icon: "split",
        heading: "Storage grows with shards",
        paragraphs: [
          "Every message is still stored until delivered, so storage writes grow with message volume. A sharded store scales by adding shards, about 4,000 writes per second each in the game.",
          "Adding shards later means moving some data. Consistent hashing (placing shards on a ring so only a fraction of keys move when one is added) keeps that migration small.",
        ],
      },
    ],
    diagrams: [
      {
        title: "Message path",
        nodes: ["client", "lb", "ws", "nosql"],
        caption: "Phones hold connections to realtime gateways, which store each message in its conversation's shard and push it to the recipient.",
        steps: [
          "A user sends a chat message over the connection their phone keeps open.",
          "The load balancer assigns each phone's long-lived connection to a realtime gateway.",
          "The realtime gateway takes the message, saves it, and pushes it down the recipient's open connection.",
          "The conversation's NoSQL shard stores the message, keeping it up to 30 days if the recipient is offline.",
        ],
      },
      {
        title: "Read path",
        nodes: ["client", "lb", "app", "cache", "nosql"],
        caption: "Chat lists and profiles go through app servers, with a cache absorbing repeated reads.",
        steps: [
          "A user opens WhatsApp and loads their chat list and contacts' profile pictures.",
          "The load balancer spreads these reads across the app servers.",
          "The app server gathers the chat list and profiles, checking the cache first.",
          "The cache answers about 80% of repeated reads, like popular profiles, straight from memory.",
          "Only misses read from the NoSQL shards, and the result is cached for next time.",
        ],
      },
    ],
    numbers: [
      { value: "~10,000 msg/s", label: "one realtime gateway" },
      { value: "~1,000 req/s", label: "one app server instance" },
      { value: "4,000/s", label: "writes per NoSQL shard" },
      { value: "2 million+", label: "connections on one server, reported by WhatsApp in 2012" },
    ],
    compare: {
      headers: ["Polling", "Persistent push"],
      rows: [
        ["Delivery delay", "Up to one polling interval", "Near instant"],
        ["Wasted work", "Most requests return nothing", "Traffic only when there is news"],
        ["Battery and data", "Radio wakes up on every poll", "Small heartbeats only"],
        ["Server design", "Stateless and simple", "Stateful: needs a presence registry"],
      ],
    },
    realWorld: [
      {
        company: "WhatsApp",
        text: "WhatsApp built its servers in Erlang on FreeBSD. Erlang runs each connection as a very lightweight process, and in 2012 the team wrote that a single server held over 2 million concurrent connections. That density is a big reason a famously small engineering team could serve hundreds of millions of users.",
      },
      {
        company: "Discord",
        text: "Discord's real-time gateway is written in Elixir, which runs on the same Erlang virtual machine. Its engineers have written about scaling it to millions of concurrent users, showing the model WhatsApp proved still works for modern chat.",
      },
    ],
    mistakes: [
      "Sending every message as an HTTP request through app servers, paying full request cost for a tiny payload.",
      "Forgetting the presence registry, so gateways have no idea where to deliver a message.",
      "Scaling gateways but not storage, so every message is accepted quickly and then stuck behind a full shard.",
    ],
    interview: {
      tip: "Describe the send path end to end: sender's gateway, storage, presence lookup, recipient's gateway, push, delivery receipt back to the sender. Then cover the offline case.",
      questions: [
        "How does the sender's server find the recipient's connection?",
        "What happens when the recipient is offline?",
        "How many connections can one server hold, and what limits it?",
        "What happens to connected users when a gateway is deployed or restarted?",
        "How do you add storage shards without downtime?",
      ],
    },
    quiz: [
      {
        question: "What is the main job of a presence registry?",
        options: [
          "Storing message history",
          "Mapping each online user to the gateway they are connected to",
          "Encrypting messages",
          "Balancing HTTP requests across app servers",
        ],
        answer: 1,
        explain: "With many gateways, the system must know which one holds the recipient's connection. The presence registry answers that in one fast lookup.",
      },
      {
        question: "10,000 messages per second must be stored. How many NoSQL shards are needed at minimum in the game's model?",
        options: ["1", "2", "3", "10"],
        answer: 2,
        explain: "Each shard handles about 4,000 writes per second, so two shards (8,000) are not enough and three (12,000) is the minimum. Real systems leave extra headroom.",
      },
    ],
  },

  "whatsapp-3": {
    minutes: 6,
    overview:
      "Festive midnights produce WhatsApp's biggest spikes, as whole countries send greetings at the same moment. This stage covers sizing for the spike instead of the average, surviving a gateway or load balancer failure at the peak, and making retries safe so nobody gets the same message twice.",
    problem:
      "At midnight on New Year's Eve, millions of people send 'Happy New Year' within the same minute, and the wave repeats as midnight moves across each time zone. Traffic jumps far above a normal evening. Right at the peak, one gateway crashes and a load balancer instance fails. Every phone connected to that gateway drops off at once and immediately tries to reconnect, adding a stampede on top of the spike.",
    sections: [
      {
        icon: "trending-up",
        heading: "Size for the spike, not the average",
        paragraphs: [
          "A system sized for an average evening runs out of room in the first minute after midnight. Capacity planning starts from the peak: the highest messages per second you expect, per tier, plus a margin.",
          "Check every tier separately. Gateways carry about 10,000 messages per second each, and every message also lands on a storage shard at about 4,000 writes per second each, so the spike hits storage just as hard as the gateways.",
        ],
      },
      {
        icon: "shield",
        heading: "Losing a node at the worst second",
        paragraphs: [
          "When a gateway dies, its connections drop and those phones reconnect through the load balancer to the remaining gateways. The survivors must absorb the full peak between them, so the rule is: after losing one, the rest must still fit the spike.",
          "The front door needs the same care. A single load balancer is a single point of failure for every user. Running two instances means one can fail while the other keeps routing traffic.",
        ],
      },
      {
        icon: "repeat",
        heading: "Retries without duplicates",
        paragraphs: [
          "WhatsApp queues outgoing messages on the phone. If sending fails, the phone keeps the message (you see the clock icon) and retries later, so a brief server failure becomes a short delay instead of a lost greeting.",
          "Retries are only safe if they cannot create duplicates. Each message gets a unique id created on the phone; if the server already has that id, it acknowledges again instead of storing a second copy.",
        ],
        bullets: [
          "Exponential backoff: wait longer after each failed try (1 s, 2 s, 4 s...).",
          "Jitter: add a random amount to each wait so millions of phones do not retry in lockstep.",
          "Idempotent ids: the same message id always means the same message.",
        ],
      },
    ],
    diagrams: [
      {
        title: "Redundant message path",
        nodes: ["client", "lb", "ws", "nosql"],
        caption: "Two load balancers and spare gateways keep the path alive when any single instance fails, with enough shards for the spike.",
        steps: [
          "Millions of users send messages at once, like at midnight on New Year's Eve.",
          "Two load balancers share the traffic, so losing one does not cut anyone off.",
          "Spare realtime gateways take over phone connections from any gateway that fails.",
          "Enough NoSQL shards absorb the spike, each storing up to 4,000 messages per second.",
        ],
      },
    ],
    numbers: [
      { value: "~10,000 msg/s", label: "one realtime gateway" },
      { value: "4,000/s", label: "writes per NoSQL shard" },
      { value: "20,000/s", label: "one load balancer" },
      { value: "100 billion+", label: "messages a day, as WhatsApp's owner has said publicly" },
    ],
    compare: {
      headers: ["Sized for the average", "Sized for the peak"],
      rows: [
        ["Cost", "Lower most of the year", "Spare capacity sits idle most nights"],
        ["Midnight spike", "Overload, timeouts, retry storms", "Absorbed with headroom"],
        ["One node fails", "Survivors are pushed past 100%", "Survivors still fit the load"],
        ["User experience", "Clock icons and failed sends", "Greetings arrive on time"],
      ],
    },
    realWorld: [
      {
        company: "WhatsApp",
        text: "WhatsApp and its parent company have reported record traffic on New Year's Eve, including more than a billion voice and video calls on the last night of 2020. Client-side queues and retries mean that when a server struggles, users mostly see a delay rather than lost messages.",
      },
      {
        company: "Twitter",
        text: "In 2013, during a TV broadcast of the film 'Castle in the Sky' in Japan, Twitter recorded a then-record peak of over 143,000 tweets per second. Its engineers wrote that the redesign it had done after earlier overloads let it absorb that spike without an outage.",
      },
    ],
    mistakes: [
      "Running exactly enough gateways for the peak, so losing one pushes the rest over the edge.",
      "Retrying immediately and in lockstep, turning a short failure into a self-inflicted traffic storm.",
      "Generating message ids on the server, so a retried send cannot be recognised as a duplicate.",
    ],
    interview: {
      tip: "Mention client-side retries with exponential backoff and jitter, and idempotent message ids created on the device so retries never duplicate messages.",
      questions: [
        "How do you prepare for a spike you know is coming?",
        "What happens to users connected to a gateway that crashes?",
        "How do you avoid duplicate messages when clients retry?",
        "What is a thundering herd, and how do you prevent one?",
        "Which tier would you watch most closely at midnight?",
      ],
    },
    quiz: [
      {
        question: "Why add random jitter to client retry delays?",
        options: [
          "To make messages arrive in order",
          "So millions of clients do not retry at exactly the same moment",
          "To encrypt the retry",
          "To make the server respond faster",
        ],
        answer: 1,
        explain: "Without jitter, every phone that failed at the same second retries at the same second, creating a new spike. Randomness spreads retries out.",
      },
      {
        question: "The peak is 18,000 messages per second and each gateway carries 10,000. What is the smallest gateway count that survives losing one?",
        options: ["2", "3", "4", "18"],
        answer: 1,
        explain: "Two gateways (20,000) fit the peak, but losing one leaves only 10,000. Three gateways leave 20,000 after a failure, which still covers 18,000.",
      },
    ],
  },

  "whatsapp-4": {
    minutes: 7,
    overview:
      "Photos, videos and voice notes are a small share of messages but most of the bytes. This stage explains why media travels on its own path: uploaded once to object storage, referenced by a tiny chat message, and downloaded from a CDN, all while staying end-to-end encrypted.",
    problem:
      "A family group shares a holiday video. If the video traveled through the chat gateways and message store like a text, every gateway and shard would be busy moving megabytes instead of tiny messages, and every member's download would hit the origin servers. A few popular videos could slow down texting for everyone. The fix is to treat 'the message' and 'the file' as two different things.",
    sections: [
      {
        icon: "film",
        heading: "Messages are small, media is huge",
        paragraphs: [
          "A text message is a few hundred bytes. A photo is often hundreds of kilobytes and a video can be many megabytes. Systems tuned for millions of tiny writes per second are the wrong place to push big files.",
          "So media goes to object storage: cheap, durable storage for files, like Amazon S3. The chat message then carries only a pointer to the file plus the information needed to open it.",
        ],
      },
      {
        icon: "hard-drive",
        heading: "The upload path",
        paragraphs: [
          "The sender's phone compresses the media, encrypts it with a fresh random key, and uploads the encrypted file. Uploads go through app servers on their way to object storage, and they are heavier than normal requests: in the game an upload costs 3 units at the app tier.",
          "Once stored, the phone sends a normal, tiny chat message through the gateway containing the file's location, the key and a hash (a fingerprint used to check the file was not changed).",
        ],
      },
      {
        icon: "globe",
        heading: "The download path: a CDN",
        paragraphs: [
          "A CDN (content delivery network) is a set of servers spread around the world that keep copies of popular files close to users. In a group chat many people download the same file, so most requests are answered by a nearby edge server.",
          "In the game a CDN serves about 90% of static downloads from its cache and forwards the rest to object storage, the origin. The app servers and chat path never see download traffic at all.",
        ],
      },
      {
        icon: "lock",
        heading: "End-to-end encryption and media",
        paragraphs: [
          "End-to-end encryption means only the sender's and recipients' devices hold the keys, so the servers in between cannot read the content. WhatsApp completed its rollout of end-to-end encryption, based on the Signal protocol, in 2016.",
          "For media, the random file key travels inside the encrypted chat message. Storage and CDN only ever see scrambled bytes, which they can store and cache like any other file; only a recipient's device can decrypt it.",
        ],
      },
    ],
    diagrams: [
      {
        title: "Upload path",
        nodes: ["client", "lb", "app", "blob"],
        caption: "The phone uploads the encrypted file through app servers into object storage, then sends a tiny message with the pointer and key.",
        steps: [
          "A user picks a photo to send, and the phone encrypts it before uploading.",
          "The load balancer sends the upload to an app server with spare capacity.",
          "The app server streams the encrypted file to storage, costing 3 units per upload.",
          "Object storage durably keeps the file and returns a pointer the phone puts in the chat message.",
        ],
      },
      {
        title: "Download path",
        nodes: ["client", "cdn", "blob"],
        caption: "Recipients fetch the encrypted file from a nearby CDN edge; only misses reach object storage.",
        steps: [
          "The recipient taps the photo in the chat to download it.",
          "A nearby CDN edge serves the encrypted file from its cache about 90% of the time.",
          "On a CDN miss, object storage sends the file and the edge keeps a copy for the next request.",
        ],
      },
    ],
    numbers: [
      { value: "~90%", label: "downloads served from CDN cache" },
      { value: "3 units", label: "one upload at the app tier" },
      { value: "100,000/s", label: "one CDN" },
      { value: "50,000/s", label: "one object storage origin" },
    ],
    compare: {
      headers: ["Media inside the message", "Media by reference"],
      rows: [
        ["Message size", "Megabytes", "A few hundred bytes"],
        ["Gateway and shard load", "Huge; slows texting for everyone", "Unchanged by media"],
        ["Group of 20 downloading", "20 reads from the message store", "Mostly CDN cache hits"],
        ["Encryption", "Whole payload in the chat stream", "Encrypted file plus a key in the message"],
      ],
    },
    realWorld: [
      {
        company: "WhatsApp",
        text: "WhatsApp's published security whitepaper describes this design: the sender encrypts the attachment with a random key, uploads the encrypted blob, and sends the recipient a normal encrypted message holding the key, a hash of the blob and a pointer to it. The servers store and serve files they cannot read.",
      },
      {
        company: "Facebook",
        text: "Facebook's Haystack paper (2010) described a storage system built just for billions of photos, with a CDN in front for popular images. It is a classic example of giving large files their own storage path instead of forcing them into a general database.",
      },
    ],
    mistakes: [
      "Sending media bytes through the realtime gateway and message store along with text.",
      "Serving downloads straight from object storage or app servers with no CDN, so every group member hits the origin.",
      "Forgetting that uploads are heavier than normal requests, so the app tier runs out of room once media launches.",
    ],
    interview: {
      tip: "Draw the media path separately from the message path, and explain how the file key reaches the recipient inside the encrypted message.",
      questions: [
        "Why not send photos through the chat servers directly?",
        "How can a CDN cache files that are end-to-end encrypted?",
        "How would you handle large video uploads on a flaky mobile connection?",
        "How long do you keep media on the server, and who deletes it?",
        "What happens when a photo is forwarded to many chats?",
      ],
    },
    quiz: [
      {
        question: "How does the recipient get the key to decrypt a photo?",
        options: [
          "The CDN decrypts it before sending",
          "It is inside the end-to-end encrypted chat message that points to the file",
          "Object storage keeps a copy of every key",
          "It is embedded in the file name",
        ],
        answer: 1,
        explain: "The random file key travels inside the encrypted message, so only the recipient's device can read it. Storage and CDN only handle encrypted bytes.",
      },
      {
        question: "6,000 media downloads per second go through a CDN with a 90% hit rate. How many reach object storage?",
        options: ["60", "600", "5,400", "6,000"],
        answer: 1,
        explain: "10% of requests miss the cache: 6,000 x 0.1 = 600 per second reach the origin, an easy load for object storage.",
      },
      {
        question: "Why does adding media uploads put pressure on the app tier?",
        options: [
          "Uploads are routed through the geo index",
          "Each upload costs about three times a normal request at the app server",
          "App servers must decrypt every file",
          "Uploads bypass the load balancer",
        ],
        answer: 1,
        explain: "Moving a file through the app server is heavier work than a normal request; the game charges 3 units per upload, so app capacity must grow when media launches.",
      },
    ],
  },
};
