import type { Article } from "../types";

/** Full explanation pages for chapters 4-6 (async processing, protecting the system, real-time and location). */
export const ADVANCED_ARTICLES: Record<string, Article> = {
  "queue-the-writes": {
    minutes: 7,
    overview:
      "A message queue lets your app accept a write instantly and hand the slow part to background workers. After this page you will know how producers, queues and consumers fit together, when a write can safely be asynchronous, and what you give up in exchange.",
    problem:
      "A ticket shop opens sales for a popular concert. For two minutes, purchases jump from a trickle to hundreds per second, and every purchase is a database write that costs several times more than a read. The database saturates, so every request slows down, even people who are only browsing. Timeouts pile up, frustrated users click 'Buy' again, and the extra clicks add even more load. Averaged over ten minutes the database could handle the traffic easily; it is the peak that breaks it.",
    sections: [
      {
        icon: "inbox",
        heading: "How a queue works",
        paragraphs: [
          "A message queue is a buffer that sits between the code that creates work and the code that does it. The app server that adds jobs is the producer. The background process that takes jobs off the queue is the consumer, usually called a worker.",
          "The key idea is that the user only waits for the job to be safely stored in the queue, not for the job to be finished. Storing a message is fast and cheap, so the response comes back in milliseconds even when the real work takes much longer.",
        ],
        bullets: [
          "1. The app server validates the request (is the seat free, is the user logged in).",
          "2. It writes a message such as 'create order 42 for seat B7' to the queue.",
          "3. The queue stores the message durably and confirms within a few milliseconds.",
          "4. The app replies '202 Accepted: order received' to the user.",
          "5. A worker pulls the message, writes the order to the database, then acknowledges it.",
          "6. Only after the acknowledgement (ack) does the queue delete the message. If the worker crashes first, the message becomes visible again and another worker retries it.",
        ],
      },
      {
        icon: "gauge",
        heading: "Why it protects the database",
        paragraphs: [
          "Without a queue, the database sees exactly the rate users send. With a queue, it sees the rate your workers write, and you control that number by choosing how many workers to run. The workers become a dial between the outside world and your most fragile component.",
          "During a spike, jobs arrive faster than workers drain them, so a backlog builds up in the queue. That is fine: the queue is designed to hold it. When the spike passes, workers keep going at full speed and the backlog shrinks back to zero.",
          "The price is lag: how long a job waits before it is processed. A simple estimate is lag = backlog / drain rate. If 30,000 jobs are waiting and workers finish 600 per second, the newest job will be processed in about 50 seconds.",
        ],
      },
      {
        icon: "split",
        heading: "When to go async, and when not to",
        paragraphs: [
          "Asynchronous means 'the result comes later'. That only works when the user does not need the final result to continue. Your UI must be honest about it: show 'order received, confirmation on its way', not 'order shipped'.",
          "Reads never go through a queue. A user loading a page needs an answer now, so reads keep their fast, synchronous path through the cache and database.",
        ],
        bullets: [
          "Good fits: order fulfilment, sending emails and push notifications, generating thumbnails, analytics events, webhooks to other services.",
          "Poor fits: checking a password at login, showing a search result, anything where the next screen depends on the outcome.",
          "Middle ground: payments are often authorised synchronously (the user must know if the card was declined) while receipts, fraud scoring and stock updates happen async.",
        ],
      },
      {
        icon: "repeat",
        heading: "What goes wrong",
        paragraphs: [
          "Most queues guarantee at-least-once delivery: a message is never lost, but it might be delivered twice, for example when a worker finishes the job but crashes just before the ack. Your workers must be idempotent, meaning running the same job twice has the same effect as running it once.",
        ],
        bullets: [
          "Duplicates: store an idempotency key (such as the order id) and skip jobs you have already processed.",
          "Poison messages: a job that always fails will be retried forever. After a few attempts, move it to a dead-letter queue (DLQ) for a human to inspect.",
          "Eventual consistency: for a few seconds the order exists in the queue but not in the database. Anything that reads the database will not see it yet.",
          "Ordering: many queues do not guarantee that jobs are processed in the order they arrived, especially with several workers.",
        ],
      },
    ],
    diagrams: [
      {
        title: "The write path",
        nodes: ["client", "lb", "app", "queue", "worker", "sqldb"],
        caption: "The app enqueues the write and replies at once. Workers write to the database at a pace you choose.",
        steps: ["A fan clicks Buy for a concert ticket the moment sales open, along with hundreds of others.", "Spreads the burst of purchase requests evenly across the app servers.", "Validates the purchase, puts an order message on the queue and replies right away, without touching the database.", "Stores the order message durably and confirms in a few milliseconds, so the fan is not kept waiting.", "Pulls orders off the queue at about 300 jobs per second each, a pace the database can handle.", "Saves each ticket order; at 4 units per write, the steady pace from workers keeps it from saturating."],
      },
      {
        title: "The read path",
        nodes: ["client", "lb", "app", "cache", "sqldb"],
        caption: "Reads still take the fast synchronous path. A queue is for work the user does not wait for.",
        steps: ["A shopper browses the event page to see seats and prices while sales are busy.", "Sends the read to any app server with spare room.", "Handles the read synchronously, because the shopper is waiting for this answer on screen.", "Answers most event page reads from memory in about a millisecond.", "Serves only the cache misses, and stays responsive because the queued writes no longer flood it."],
      },
    ],
    numbers: [
      { value: "~1-20 ms", label: "to enqueue a message, depending on the queue product" },
      { value: "~300 jobs/s", label: "drained by one worker in this game" },
      { value: "4 units", label: "cost of one SQL write here, versus 1 for a read" },
      { value: "backlog / drain", label: "queue lag in seconds" },
    ],
    compare: {
      headers: ["Synchronous write", "Queued (async) write"],
      rows: [
        ["User waits for", "The database write to finish", "The message to be stored in the queue"],
        ["Database sees", "Every spike, at full height", "A steady rate set by the workers"],
        ["Result visible", "Immediately", "After the lag, usually seconds"],
        ["On failure", "User sees an error and retries", "The queue retries for you; you handle duplicates"],
        ["Moving parts", "Fewer", "Queue, workers, dead-letter queue, monitoring"],
      ],
    },
    realWorld: [
      {
        company: "Amazon",
        text: "Amazon built SQS (Simple Queue Service) to decouple its own services, and it was one of the very first AWS products offered publicly. Placing an order and actually fulfilling it are separate steps connected by asynchronous messaging, which is why you get an 'order received' email before a 'shipped' one.",
      },
      {
        company: "LinkedIn",
        text: "LinkedIn created Apache Kafka to move huge streams of activity events (page views, clicks, updates) between systems, and open-sourced it in 2011. Producers write events to Kafka, and many independent consumers process them at their own pace.",
      },
    ],
    mistakes: [
      "Workers that are not idempotent, so a redelivered message sends two emails or charges a card twice.",
      "Telling the user something is done when it is only queued. The UI should say 'processing' until the worker confirms.",
      "Adding a queue without checking that the workers' combined write rate fits in the database. The queue moves the spike; it does not make it disappear.",
    ],
    interview: {
      tip: "Use queues for anything slow or spiky that the user does not need to wait for. When you add one, immediately mention idempotency and a dead-letter queue: it shows you know what at-least-once delivery means.",
      questions: [
        "What happens if a worker crashes halfway through processing a message?",
        "How do you make sure a customer is never charged twice when a message is delivered twice?",
        "How does the user find out that their queued order actually succeeded or failed?",
        "Would you pick Kafka or a simple queue like SQS or RabbitMQ here, and why?",
      ],
    },
    quiz: [
      {
        question: "During a spike, 900 writes per second arrive and the workers drain 600 per second. What happens while the spike lasts?",
        options: [
          "The database overloads, just as it would without a queue",
          "The backlog grows by about 300 jobs every second, then drains after the spike",
          "The queue rejects the extra 300 writes per second",
          "The workers automatically speed up to 900 per second",
        ],
        answer: 1,
        explain: "The database only ever sees the workers' 600 per second. The difference between arrival and drain rate piles up in the queue as backlog, and lag grows until traffic drops below the drain rate again.",
      },
      {
        question: "Which of these is the worst candidate for a queue?",
        options: ["Sending a welcome email", "Generating image thumbnails", "Checking a password at login", "Recording analytics events"],
        answer: 2,
        explain: "The user cannot continue until they know whether the password was right, so the result is needed immediately. The other three can safely finish a few seconds later.",
      },
      {
        question: "Your queue delivers the message 'charge order 42' twice. What is the best defence?",
        options: [
          "Switch to a faster queue",
          "Make the worker idempotent: record processed order ids and skip repeats",
          "Add more workers so the duplicate is processed quickly",
          "Delete the message before processing it, so it can never be redelivered",
        ],
        answer: 1,
        explain: "At-least-once delivery means duplicates will happen, so the worker must make them harmless. Deleting before processing avoids duplicates but loses the job entirely if the worker then crashes.",
      },
    ],
  },

  "keep-the-lag-down": {
    minutes: 6,
    overview:
      "A queue only helps if the workers drain it faster than work arrives. On this page you will learn to size a worker pool from the arrival rate, to read backlog and lag, and to find the real bottleneck hiding behind the workers.",
    problem:
      "A notification service launches with a handful of workers. On day one everything looks healthy: no errors, normal CPU, every component green. But jobs arrive slightly faster than the workers can finish them, so the queue grows a little every second. By evening, 'your driver has arrived' notifications show up twenty minutes late, long after the rider has left. Nothing crashed; the backlog just grew silently.",
    sections: [
      {
        icon: "trending-up",
        heading: "Arrival rate versus drain rate",
        paragraphs: [
          "Every queue has two numbers that matter: the arrival rate (jobs per second coming in) and the drain rate (jobs per second the workers finish). The backlog changes each second by arrival minus drain.",
          "If arrival is higher than drain for a long time, the backlog grows without limit. With 1,000 jobs per second arriving and 900 draining, you gain 100 jobs every second. After an hour that is 360,000 jobs, and the lag is 360,000 / 900, about 400 seconds.",
          "Spiky and steady traffic need different thinking. For a short spike, the queue can absorb the excess as long as drain beats arrival on average. For steady traffic there is no quiet period to catch up, so drain must beat the arrival rate all the time.",
        ],
      },
      {
        icon: "gauge",
        heading: "Sizing the worker pool",
        paragraphs: [
          "Start with the minimum: workers needed = arrival rate / jobs per worker, rounded up. With 1,200 jobs per second and workers that do 300 each, that is 4 workers.",
          "Then add headroom. A pool running at exactly 100% can never catch up after a hiccup such as a slow database moment or a worker restart, and latency rises steeply once any component goes above about 70-80% utilisation. Keeping drain about 20-30% above arrival means a backlog clears quickly instead of lingering.",
          "Little's law gives you a sanity check: items waiting = arrival rate x time waiting. If 2,000 jobs per second arrive and you allow 5 seconds of lag, the queue may hold about 10,000 jobs at most.",
        ],
      },
      {
        icon: "database",
        heading: "The bottleneck moves downstream",
        paragraphs: [
          "Workers do not process jobs in a vacuum: each one writes somewhere. The combined write rate is the number of workers times the jobs each one finishes. If the store behind them cannot take that rate, workers stall waiting on it, and the real drain rate is set by the database, not by the worker count.",
          "Check the store before adding workers. In this game a SQL write costs 4 capacity units, so writes eat a single primary quickly. A sharded NoSQL store scales differently: every shard you add brings more write capacity. Batching (writing 100 rows in one call) also raises throughput, at the cost of a little extra delay per item.",
        ],
      },
      {
        icon: "activity",
        heading: "What to monitor and how to scale",
        paragraphs: [
          "Treat the queue as a first-class part of the system with its own dashboard and alerts. The metrics below tell you whether 'eventually' is still a reasonable promise.",
        ],
        bullets: [
          "Queue depth: how many jobs are waiting right now.",
          "Age of the oldest message: the most direct measure of lag that users feel.",
          "Consumer error rate and dead-letter queue size: are jobs failing rather than finishing?",
          "Worker throughput: jobs per second actually completed.",
          "Autoscale workers on depth or oldest-message age, not on CPU. Workers that spend their time waiting on a database can show low CPU while the backlog explodes.",
        ],
      },
    ],
    diagrams: [
      {
        title: "Drain rate in practice",
        nodes: ["client", "lb", "app", "queue", "worker", "nosql"],
        caption: "Drain rate = workers x jobs per worker, capped by what the store behind them can absorb.",
        steps: ["A driver taps 'I have arrived', which should trigger a notification to the waiting rider.", "Passes the request to an app server.", "Creates a notification job, adds it to the queue and returns immediately.", "Holds jobs until a worker is free; if jobs arrive faster than they drain, the backlog and lag grow.", "Each worker sends about 300 notifications per second, so 1,000 jobs per second needs at least 4 workers.", "Records each sent notification; if it cannot keep up, adding workers will not reduce the lag."],
      },
    ],
    numbers: [
      { value: "~300 jobs/s", label: "drained by one worker in this game" },
      { value: "L = λ x W", label: "Little's law: items waiting = arrival rate x wait time" },
      { value: "~70-80%", label: "utilisation where latency starts climbing steeply" },
      { value: "~20-30%", label: "headroom to keep the drain rate above arrival" },
    ],
    compare: {
      headers: ["Scale workers on CPU", "Scale workers on queue depth or age"],
      rows: [
        ["Measures", "How busy the worker machines are", "How much work is waiting, and for how long"],
        ["Workers waiting on I/O", "Looks idle, so it never scales up", "Sees the backlog and scales up"],
        ["Matches user impact", "Indirectly at best", "Directly: oldest message age is the lag"],
        ["Typical tools", "Default autoscaling policies", "Queue metrics such as SQS backlog per instance or Kafka consumer lag"],
      ],
    },
    realWorld: [
      {
        company: "AWS",
        text: "The EC2 Auto Scaling documentation recommends scaling SQS consumers on 'backlog per instance' (messages waiting divided by running workers) compared against an acceptable latency, rather than on CPU. It is Little's law turned into an autoscaling policy.",
      },
      {
        company: "LinkedIn",
        text: "LinkedIn, which runs Kafka at very large scale, open-sourced Burrow, a tool dedicated to monitoring consumer lag. They built it because lag, not broker health, is what tells you whether consumers are keeping up.",
      },
    ],
    mistakes: [
      "Sizing the pool to exactly match the arrival rate, leaving no headroom to recover after any hiccup.",
      "Autoscaling workers on CPU, so I/O-bound workers never scale while the backlog grows.",
      "Adding workers without checking the database behind them, which just moves the bottleneck one hop downstream.",
    ],
    interview: {
      tip: "When you add a queue, say how you would monitor it: depth, age of the oldest message, and consumer error rate. Then size the consumers out loud from the arrival rate, with headroom.",
      questions: [
        "How many consumers do you need, and how did you get that number?",
        "Which metric would you alert on for this queue, and at what threshold?",
        "The backlog is growing but the workers sit at 20% CPU. What is going on?",
        "How would you handle a sudden 10x burst of events without losing any?",
      ],
    },
    quiz: [
      {
        question: "Jobs arrive at a steady 1,500 per second and each worker drains 300 per second. Which pool size is the sensible choice?",
        options: [
          "4 workers: the queue will absorb the difference",
          "5 workers: exactly matches the arrival rate",
          "6 workers: matches arrival with headroom",
          "15 workers: ten times safer",
        ],
        answer: 2,
        explain: "Four workers lose 300 jobs per second forever. Five run at 100%, so any hiccup leaves a backlog that never clears. Six give about 20% headroom. Fifteen wastes money and may overload the store behind them.",
      },
      {
        question: "The queue holds 60,000 jobs and the workers drain 2,000 per second. Roughly how long will a new job wait?",
        options: ["3 seconds", "30 seconds", "120 seconds", "2,000 seconds"],
        answer: 1,
        explain: "Lag = backlog / drain rate = 60,000 / 2,000 = 30 seconds.",
      },
      {
        question: "You double the number of workers but the lag barely improves. What is the most likely cause?",
        options: [
          "The queue is too small",
          "The database behind the workers is saturated",
          "Clients are sending jobs too slowly",
          "The workers need more memory",
        ],
        answer: 1,
        explain: "When the store the workers write to is full, extra workers just wait on it. The real drain rate is set by the slowest dependency, so you need more database capacity, not more workers.",
      },
    ],
  },

  "uploads-object-storage": {
    minutes: 7,
    overview:
      "Photos, videos and documents belong in object storage, not in your database or on your app servers' disks. You will learn what object storage is, how uploads and downloads flow through a system, and how a CDN uses storage as its origin.",
    problem:
      "A recipe site stores each photo on the app server's local disk. When traffic grows, the team adds a second app server, and suddenly half the photos are broken: a picture uploaded to server A simply does not exist on server B. They move the bytes into the database instead. Now the database grows by gigabytes a day, backups take hours, and every image view drags megabytes through an app server and a database that were built for small rows.",
    sections: [
      {
        icon: "hard-drive",
        heading: "What object storage is",
        paragraphs: [
          "Object storage (Amazon S3, Google Cloud Storage, Azure Blob Storage) is a service for storing files, called objects. You put an object into a bucket under a key such as 'recipes/123/hero.jpg', and later get it back by that key over HTTP. There are no folders, tables or queries, just keys and bytes.",
          "It is built to be cheap per gigabyte, to scale almost without limit, and to be extremely durable: S3, for example, is designed for 99.999999999% durability by keeping copies across several data centres. The trade-off is speed. Each request takes tens of milliseconds, far slower than a cache, so it suits large files, not tiny hot records.",
          "Objects are written whole. You cannot change byte 500 of a video in place; you upload a new version. That is perfect for photos and documents, which rarely change once created.",
        ],
      },
      {
        icon: "database",
        heading: "Bytes in storage, facts in the database",
        paragraphs: [
          "The database keeps what you query: the owner, the title, the upload time, the size, and the object key. The bytes live in object storage. A recipe row might hold 'photo_key = recipes/123/hero.jpg' and nothing more about the image itself.",
          "This keeps the database small and fast, backups quick, and every app server stateless: any server can handle any request because no file lives on its local disk.",
        ],
      },
      {
        icon: "inbox",
        heading: "How an upload flows",
        paragraphs: [
          "The simplest flow sends the file through your app server: the server checks the user is allowed to upload, streams the bytes to storage, then saves the metadata row. It works, but each upload ties up the server for much longer than a normal request. In this game an upload costs about three normal requests at the app tier.",
        ],
        bullets: [
          "Pre-signed URL: real systems often let the app server create a short-lived, signed link that permits one upload to one key. The client uploads straight to storage and the bytes never touch your servers.",
          "After the upload, the client tells the app 'done' and the app writes the metadata row.",
          "Large files use multipart upload: the file is sent in chunks that can be retried individually.",
          "Post-processing such as thumbnails or virus scanning is a classic background job for a queue and workers.",
        ],
      },
      {
        icon: "globe",
        heading: "Serving files back with a CDN",
        paragraphs: [
          "Object storage is a great home for files but a slow way to deliver them to users all over the world. A CDN (content delivery network) puts caching servers near users and uses object storage as its origin: the place it fetches from on a cache miss.",
          "On the first request for an image, the CDN fetches it from storage, returns it, and keeps a copy at the edge. Later requests are answered by the edge. In this game the CDN serves about 90% of static requests from its cache, so storage only sees the misses.",
          "Give each file a unique, never-reused key (for example include a content hash in the name). Then cached copies never go stale and you can tell the CDN to keep them for a long time.",
        ],
      },
    ],
    diagrams: [
      {
        title: "Uploading a photo",
        nodes: ["client", "lb", "app", "blob"],
        caption: "The app checks permissions and stores the file in object storage; only the key and metadata go into the database.",
        steps: ["A cook uploads a photo of a finished dish to their recipe page.", "Sends the upload to any app server, since none of them keep files on local disk.", "Checks the user may edit this recipe, stores the file in object storage and saves only its key.", "Keeps the photo bytes durably and cheaply, reachable from every app server and the CDN."],
      },
      {
        title: "Viewing a photo",
        nodes: ["client", "cdn", "blob"],
        caption: "The CDN answers most image views from its edge cache and fetches misses from object storage, its origin.",
        steps: ["A visitor opens a recipe page and their browser asks for the dish photo.", "Returns the photo from a nearby edge cache about 90% of the time, without touching your servers.", "Acts as the CDN's origin, sending the photo only on a cache miss, after which the edge keeps a copy."],
      },
    ],
    numbers: [
      { value: "11 nines", label: "S3's designed durability (99.999999999%)" },
      { value: "~3x", label: "cost of an upload versus a normal request at the app tier in this game" },
      { value: "~90%", label: "static requests the CDN answers from cache in this game" },
      { value: "~40 ms", label: "latency an object storage request adds in this game" },
    ],
    compare: {
      headers: ["Files in the database", "Files in object storage"],
      rows: [
        ["Cost per GB", "High: fast disks, replicas, backups", "Low: built for bulk storage"],
        ["Scaling", "Bloats the database and slows everything", "Grows almost without limit"],
        ["Backups", "Slow and huge", "Database stays small; storage handles its own durability"],
        ["Delivering to users", "Every view passes through app and database", "CDN serves directly from storage"],
        ["Strength", "Transactions with the rest of the row", "Cheap, durable, simple HTTP access"],
      ],
    },
    realWorld: [
      {
        company: "Netflix",
        text: "Netflix keeps its media files and many other assets in Amazon S3, then delivers video to viewers through its own CDN, Open Connect. Storage holds the master copies; the CDN does the heavy lifting of delivery.",
      },
      {
        company: "Dropbox",
        text: "Dropbox originally stored users' file blocks in Amazon S3 while keeping metadata in its own databases. In 2016 it moved most of that data to Magic Pocket, an in-house object storage system, showing how central this kind of storage is to a file product.",
      },
    ],
    mistakes: [
      "Storing file bytes in database columns, which bloats the database, slows backups and pushes every download through the database.",
      "Saving uploads on an app server's local disk, which breaks as soon as there is more than one server.",
      "Leaving a bucket publicly readable or writable by accident. Private files should be served with short-lived signed URLs.",
    ],
    interview: {
      tip: "Mention pre-signed upload URLs: it shows you know how to keep large payloads off your servers. Then say where the metadata lives and how files reach users (CDN with storage as origin).",
      questions: [
        "How would you let users upload a 2 GB video without tying up your servers?",
        "What happens if the file upload succeeds but writing the metadata row fails?",
        "How do you make sure only the owner can see a private photo that is served through a CDN?",
        "Where would you generate thumbnails, and what triggers that work?",
      ],
    },
    quiz: [
      {
        question: "Where should a profile photo's bytes and its metadata live?",
        options: [
          "Both in the SQL database, so they stay in one transaction",
          "Bytes in object storage; key and metadata in the database",
          "Bytes on the app server's disk; the file path in the database",
          "Both in the cache, for speed",
        ],
        answer: 1,
        explain: "Object storage is cheap and durable for large files, while the database keeps the small facts you query. App server disks break with more than one server, and a cache is not durable.",
      },
      {
        question: "What does a pre-signed upload URL let you do?",
        options: [
          "Let the client upload directly to storage for a short time, without your servers streaming the bytes",
          "Make a file public forever",
          "Compress the file before it is stored",
          "Skip writing metadata to the database",
        ],
        answer: 0,
        explain: "The app server signs a link that allows one upload to one key for a few minutes. The heavy bytes go straight to storage, and the server only handles small requests before and after.",
      },
      {
        question: "A CDN sits in front of object storage. What happens on a cache miss?",
        options: [
          "The CDN returns a 404 error",
          "The CDN fetches the object from storage, returns it and keeps a copy for next time",
          "The request is sent to an app server instead",
          "The user is permanently redirected to the storage bucket",
        ],
        answer: 1,
        explain: "Object storage is the CDN's origin. A miss costs one trip to storage; after that, the edge serves the file until the cached copy expires.",
      },
    ],
  },

  "rate-limiting": {
    minutes: 7,
    overview:
      "Rate limiting caps how many requests each client may send in a period of time, so bots and buggy clients cannot crowd out real users. You will learn the main algorithms, where the limiter should live, and what a well-behaved API tells a client that hits the limit.",
    problem:
      "A pricing API serves a few thousand real customers. One day a competitor points a scraper at it that fetches every price, over and over, sending three times more traffic than all real users combined. The servers are not broken, they are busy: busy answering the wrong people. Real customers see slow responses and timeouts, and the cloud bill climbs as autoscaling adds servers to feed the scraper.",
    sections: [
      {
        icon: "shield",
        heading: "Where the limiter lives",
        paragraphs: [
          "An API gateway is a front door that every request passes through before reaching your app servers. It can authenticate callers, route requests to the right service and enforce rate limits. In this game, the API gateway blocks bot traffic and can handle about 20 times more requests per instance than an app server.",
          "Limiting at the edge is the whole point. A request rejected at the gateway costs almost nothing. The same request rejected inside your app, after a database query, has already cost you a full app server slot and a database read.",
        ],
        bullets: [
          "Per IP address: simple, but offices and mobile carriers put many users behind one IP, and bots rotate IPs.",
          "Per user or per API key: fairer and harder to dodge, but needs the caller to be identified.",
          "Per endpoint: expensive or sensitive endpoints such as login or search get tighter limits than cheap ones.",
        ],
      },
      {
        icon: "clock",
        heading: "The algorithms",
        paragraphs: [
          "The token bucket is the most common. Each client has a bucket that holds up to B tokens and refills at R tokens per second. Each request spends one token; if the bucket is empty, the request is rejected. This allows short bursts of up to B requests while holding the long-run average to R per second.",
        ],
        bullets: [
          "Fixed window: count requests per calendar minute and reset at the boundary. Very simple, but a client can send a full minute's quota at 12:00:59 and another at 12:01:00, twice the limit in two seconds.",
          "Sliding window: counts over the last 60 seconds from now, which removes the boundary burst at the cost of a little more bookkeeping.",
          "Token bucket: allows controlled bursts, smooth long-run rate, two numbers per client. The default choice for APIs.",
          "Leaky bucket: requests drain out at a fixed rate like water from a hole, which smooths traffic towards a fragile backend.",
        ],
      },
      {
        icon: "network",
        heading: "Limits across many servers",
        paragraphs: [
          "With several gateway instances, each sees only part of a client's traffic. To enforce a true limit, they share counters in a fast store, often Redis, using an atomic 'increment and expire' per client and window. That adds a network hop of about a millisecond to every request.",
          "The alternative is approximate local limits: each instance enforces its share of the limit on its own. It is faster and has no shared dependency, but less exact. You also need to decide what happens if the shared store goes down: fail open (allow everything) or fail closed (reject everything).",
        ],
      },
      {
        icon: "alert",
        heading: "What the client should see",
        paragraphs: [
          "A limited request should get HTTP 429 Too Many Requests, ideally with a Retry-After header saying how long to wait. Many APIs also return headers showing the limit and how many requests remain, so clients can slow down before they are cut off.",
          "Good clients respond with exponential backoff and jitter: wait 1 second, then 2, then 4, each with some randomness so thousands of clients do not retry in the same instant. Sophisticated bots ignore all this, so rate limits are usually combined with authentication and bot detection.",
        ],
      },
    ],
    diagrams: [
      {
        title: "Rate limiting at the front door",
        nodes: ["client", "gateway", "app", "cache", "sqldb"],
        caption: "The gateway rejects excess and bot traffic before it costs anything; only real requests reach the app tier.",
        steps: ["A real customer requests a price, while a scraper elsewhere fires thousands of the same requests.", "Counts requests per client and rejects the scraper's excess with a 429 before it costs anything.", "Handles only real customer requests, so its 1,000 requests per second go to the right people.", "Answers most price lookups from memory, keeping repeated reads off the database.", "Receives only the few cache misses from legitimate traffic, instead of the scraper's flood."],
      },
    ],
    numbers: [
      { value: "429", label: "HTTP status code for Too Many Requests" },
      { value: "~20,000 req/s", label: "one API gateway instance in this game, versus ~1,000 for an app server" },
      { value: "2x", label: "the burst a fixed window can let through at a window boundary" },
      { value: "~1 ms", label: "extra hop to a shared Redis counter in the same data centre" },
    ],
    compare: {
      headers: ["Token bucket", "Fixed window"],
      rows: [
        ["How it counts", "Tokens refill continuously; each request spends one", "Counts requests per clock window, resets at the boundary"],
        ["Bursts", "Allowed up to the bucket size, by design", "Up to 2x the limit around a boundary, by accident"],
        ["State per client", "Token count and last refill time", "One counter per window"],
        ["Best for", "Public APIs with bursty but legitimate clients", "Simple quotas where precision does not matter"],
      ],
    },
    realWorld: [
      {
        company: "Stripe",
        text: "Stripe has written publicly about its rate limiters: token buckets per user stored in Redis, plus load shedders that drop low-priority traffic when the whole system is under strain, so critical requests like payments keep working.",
      },
      {
        company: "GitHub",
        text: "GitHub's REST API documents a limit of 5,000 requests per hour for authenticated users and a much lower one for anonymous callers. Every response carries headers showing the limit and the remaining requests, and over-limit calls are rejected with an error.",
      },
    ],
    mistakes: [
      "Limiting only by IP address, which punishes everyone behind one office network and barely slows bots that rotate IPs.",
      "Enforcing the limit deep inside the app after the expensive work is done, so blocked requests still cost a database query.",
      "Returning 500 errors or silently dropping requests instead of 429 with Retry-After, so clients retry immediately and make the overload worse.",
    ],
    interview: {
      tip: "Say where the limiter lives, what key it limits on (IP, user, API key) and what the client sees when limited. Then pick an algorithm and explain the burst behaviour you want.",
      questions: [
        "Design a rate limiter for 10 million users across many gateway servers.",
        "Would you choose a token bucket or a sliding window here, and why?",
        "What should happen if the Redis that stores the counters goes down?",
        "How would you stop a bot that rotates through thousands of IP addresses?",
      ],
    },
    quiz: [
      {
        question: "A fixed-window limit allows 100 requests per minute. A client sends 100 at 12:00:59 and 100 more at 12:01:00. What happens?",
        options: [
          "All 200 are allowed within about a second",
          "Only the first 100 are allowed",
          "All 200 are blocked",
          "The gateway averages them over two minutes",
        ],
        answer: 0,
        explain: "Each burst lands in a different window, and each window allows 100. This boundary burst is the main weakness of fixed windows, and the reason sliding windows and token buckets exist.",
      },
      {
        question: "A token bucket holds 10 tokens and refills 1 token per second. A client is idle for a minute, then sends 15 requests at once. How many are allowed immediately?",
        options: ["1", "10", "15", "60"],
        answer: 1,
        explain: "The bucket refills only up to its capacity of 10, however long the client was idle. Ten requests spend the ten tokens; the other five are rejected until tokens refill.",
      },
      {
        question: "Why enforce rate limits at the gateway instead of in app code after the database lookup?",
        options: [
          "Gateways count more accurately than application code",
          "A rejected request should cost as little as possible, so it must be stopped before the expensive work",
          "App servers cannot count requests",
          "Only gateways are allowed to return HTTP 429",
        ],
        answer: 1,
        explain: "The goal is to protect capacity. If the app has already run a query before saying no, the bot has consumed exactly the resources you wanted to protect.",
      },
    ],
  },

  "survive-the-outage": {
    minutes: 8,
    overview:
      "Every component fails eventually: servers crash, disks die, deploys go wrong. This page shows how to find single points of failure, how much spare capacity to keep, and why losing a cache can quietly take down a database.",
    problem:
      "At 3 a.m. an engineer restarts the only cache node to apply a security patch. It comes back empty, so every read now goes straight to the database. The database was sized assuming the cache answered most reads; suddenly it receives five times its normal load. It slows to a crawl, app servers time out waiting for it, and the whole site goes down. Nothing was 'broken' except one empty cache, but the system had been silently depending on it.",
    sections: [
      {
        icon: "alert",
        heading: "Find every single point of failure",
        paragraphs: [
          "A single point of failure (SPOF) is any component whose loss takes the whole system down. To find them, walk the request path box by box and ask: 'if this dies right now, what happens?' Any answer of 'the site goes down' needs a fix.",
        ],
        bullets: [
          "Load balancer: run two. Health checks or a shared virtual address move traffic to the survivor.",
          "App servers: keep them stateless so any instance can serve any request. The load balancer stops sending traffic to a dead one.",
          "Cache: use more than one node. Losing one node then loses only part of the cached data, not all of it.",
          "Database primary: keep a hot standby, a copy that receives every change and can be promoted automatically. In this game the second SQL instance is a standby for failover, not extra capacity.",
        ],
      },
      {
        icon: "scale",
        heading: "N+1: spare capacity that covers a failure",
        paragraphs: [
          "Redundancy only helps if the survivors can carry the load. If you need N instances at peak, run N+1 so that losing any one still leaves enough capacity. This is called N+1 redundancy.",
          "Example: 2,400 requests per second need three app servers at about 80% each. If one dies, two servers must carry 2,400 requests with only 2,000 of capacity, and they overload. With four servers, losing one leaves three at a healthy utilisation. Always do this math at peak traffic, because failures do not wait for quiet hours.",
        ],
      },
      {
        icon: "database",
        heading: "The cache is load-bearing",
        paragraphs: [
          "A cache with an 80% hit rate means the database sees only 20% of reads. Lose the whole cache and the database suddenly sees all of them: five times more read load in an instant. A database sized for life behind a cache rarely survives that.",
          "Several cache nodes spread the keys between them, so one node failing removes only a slice of the hit rate. Other defences: warm a new cache before it takes traffic, let only one request rebuild a missing key while others wait (request coalescing), and shed low-priority load when the database is struggling.",
        ],
      },
      {
        icon: "repeat",
        heading: "Practise failure on purpose",
        paragraphs: [
          "Chaos engineering is the practice of breaking things deliberately, in a controlled way, to prove the system survives. A standby that has never been promoted and a backup that has never been restored are only hopes.",
        ],
        bullets: [
          "Failover is not instant: detecting a dead primary and promoting the standby often takes from seconds to a minute or so. Plan for errors during that window.",
          "Use timeouts and retries with backoff so callers notice failures quickly and do not pile up waiting.",
          "Degrade gracefully: serve stale cached data, switch to read-only mode, or hide non-essential features instead of failing completely.",
        ],
      },
    ],
    diagrams: [
      {
        title: "Redundancy at every tier",
        nodes: ["client", "lb", "app", "cache", "sqldb"],
        caption: "Every box on this path needs a spare: a second load balancer, extra app servers, more than one cache node, and a standby database.",
        steps: ["A user loads a page at 3 a.m., just as an engineer restarts a cache node.", "Runs as a pair, so if one load balancer dies the other keeps accepting traffic.", "Spare app servers absorb the load when one crashes, so the rest stay below their limit.", "With several nodes, losing one empties only part of the cache instead of sending every read to the database.", "A hot standby takes over if the primary fails, and headroom absorbs the extra misses after a cache restart."],
      },
    ],
    numbers: [
      { value: "N+1", label: "instances: enough that losing any one still covers peak load" },
      { value: "99.9%", label: "availability allows ~8.8 hours of downtime a year" },
      { value: "99.99%", label: "availability allows ~53 minutes of downtime a year" },
      { value: "~5x", label: "jump in database reads if an 80% hit-rate cache disappears" },
    ],
    compare: {
      headers: ["Active-passive", "Active-active"],
      rows: [
        ["What the spare does", "Waits idle, ready to take over", "Serves traffic all the time"],
        ["Failover", "Needs detection and promotion, seconds or more", "Survivors simply absorb the traffic"],
        ["Cost efficiency", "Paying for a machine that does no work", "Every machine earns its keep"],
        ["Typical use", "Database primaries, where only one may accept writes", "Stateless app servers, load balancers, cache nodes"],
      ],
    },
    realWorld: [
      {
        company: "Netflix",
        text: "Netflix built Chaos Monkey, a tool that randomly terminates production servers during working hours, and open-sourced it in 2012. Because instances disappear regularly, every team must build services that survive it, and failures become routine rather than emergencies.",
      },
      {
        company: "AWS",
        text: "AWS splits each region into several Availability Zones: separate data centres with independent power and networking. Its guidance is to run every tier across at least two zones so that losing a whole data centre does not take the application down.",
      },
    ],
    mistakes: [
      "Making the app tier redundant but leaving a single load balancer or a single database, so one box can still take everything down.",
      "Sizing spare capacity for average traffic, so losing one instance at peak overloads the rest.",
      "Never testing failover. The standby, the backups and the runbook only count once you have seen them work.",
    ],
    interview: {
      tip: "Name the failure modes you design for and the ones you consciously accept. Walking the request path tier by tier and asking 'what if this dies?' is a clear structure interviewers like.",
      questions: [
        "Walk me through what happens, second by second, when the primary database dies.",
        "Your cache cluster restarts and the database falls over. How do you prevent that?",
        "How much spare capacity would you keep, and how did you decide?",
        "Which failures would you accept rather than pay to prevent?",
      ],
    },
    quiz: [
      {
        question: "Peak traffic needs three app servers at healthy utilisation. How many should you run to survive one dying at peak?",
        options: ["3", "4", "6", "2, with autoscaling to add more"],
        answer: 1,
        explain: "N+1: with four, losing one leaves the three you need. Six is more than needed, and autoscaling takes minutes to add servers, far too slow to cover a sudden failure.",
      },
      {
        question: "10,000 reads per second hit a cache with an 80% hit rate. The cache dies. How many reads per second reach the database?",
        options: ["From 2,000 to 10,000", "From 8,000 to 10,000", "It stays at 2,000", "From 2,000 to 4,000"],
        answer: 0,
        explain: "With the cache up, only the 20% misses (2,000) reach the database. With it gone, all 10,000 do, a fivefold jump.",
      },
      {
        question: "In this game, what does a second SQL Database instance give you?",
        options: [
          "Double the write capacity",
          "A hot standby that takes over if the primary fails",
          "A read replica that serves half the reads",
          "Nothing at all",
        ],
        answer: 1,
        explain: "Only one primary accepts writes at a time. The second instance keeps a live copy and is promoted when the primary fails. For more read capacity you would add read replicas or a cache instead.",
      },
    ],
  },

  "cost-crunch": {
    minutes: 6,
    overview:
      "Good architects design for cost as well as scale. You will learn to estimate the cost per request at each tier, spot over-provisioned parts, and move traffic to the cheapest layer that can serve it, without users noticing.",
    problem:
      "A startup's cloud bill doubled in six months while traffic grew only a little. Someone finally looks: eight app servers running at low utilisation, two read replicas doing very little, and every logo, stylesheet and product image served by the app servers. The CFO asks for a much smaller bill, and the product team insists the site must not get slower. Both are possible, because most of the money is going to the wrong layer.",
    sections: [
      {
        icon: "coins",
        heading: "Think in cost per request",
        paragraphs: [
          "Each component has a price and a capacity. Dividing one by the other tells you what it costs to serve a request on that tier. In this game the numbers rank the layers very clearly.",
        ],
        bullets: [
          "CDN: 25 credits for 100,000 requests per second, about 0.25 credits per 1,000 requests per second.",
          "Cache: 15 credits for 20,000, about 0.75 per 1,000.",
          "App server: 10 credits for 1,000, about 10 per 1,000.",
          "SQL database: 30 credits for 3,000 units, about 10 per 1,000 reads, and four times that for writes.",
        ],
      },
      {
        icon: "layers",
        heading: "Cheap layers first",
        paragraphs: [
          "The cheapest request is the one your expensive tiers never see. Put the cheapest layer that can answer a request in front, and everything behind it shrinks: a CDN in front of static files, then a cache in front of hot reads, then app servers, then the database.",
          "Removing static files from the app tier can free a large share of its capacity at once. A cache with an 80% hit rate cuts database reads by five times, which can make read replicas unnecessary.",
        ],
      },
      {
        icon: "gauge",
        heading: "Right-size by measuring utilisation",
        paragraphs: [
          "Utilisation is how busy a component is compared with its capacity. For stateless tiers, a common target is about 60-70% at peak: enough headroom for a spike or a failure, not so much that you pay for idle machines. A tier sitting far below that at peak is over-provisioned.",
          "Order matters. First move traffic to cheaper layers, then measure again, then remove the instances you no longer need. Cutting first and moving traffic later is how cost projects cause outages.",
        ],
      },
      {
        icon: "alert",
        heading: "Where cost cutting goes wrong",
        paragraphs: ["Every saving trades against something else. Know what you are giving up before you take it."],
        bullets: [
          "Running hot: above about 70-80% utilisation latency rises steeply, and there is no room left for a spike.",
          "Removing redundancy: the bill shrinks until the first failure, which can cost far more than you saved.",
          "Longer cache lifetimes: higher hit rates, but users see stale data for longer.",
          "Hidden costs in real clouds: data transfer out of the cloud, idle test environments and forgotten resources often matter as much as server count.",
        ],
      },
    ],
    diagrams: [
      {
        title: "Static files",
        nodes: ["client", "cdn", "blob"],
        caption: "Images and stylesheets come from the edge with object storage as origin, almost free per request.",
        steps: ["A visitor loads the startup's homepage, which pulls in the logo, stylesheets and product images.", "Serves most of these files from its edge cache, which costs far less per request than an app server.", "Stores the original files cheaply and is only asked when the CDN does not have a copy."],
      },
      {
        title: "Dynamic requests",
        nodes: ["client", "lb", "app", "cache", "sqldb"],
        caption: "The cache absorbs most reads before they reach the most expensive tier.",
        steps: ["A logged-in customer opens their account page, which needs fresh data.", "Spreads the requests across only as many app servers as the traffic actually needs.", "Runs the page logic; with static files moved to the CDN, fewer app servers are enough.", "Answers about 80% of reads cheaply from memory, so fewer read replicas are needed.", "Handles the remaining misses, the most expensive kind of request, so keeping their number low saves the most."],
      },
    ],
    numbers: [
      { value: "~0.25", label: "credits per 1,000 req/s served by the CDN in this game" },
      { value: "~10", label: "credits per 1,000 req/s served by app servers in this game" },
      { value: "~40", label: "credits per 1,000 SQL writes/s (4 units each) in this game" },
      { value: "~60-70%", label: "a healthy peak utilisation target for stateless tiers" },
    ],
    compare: {
      headers: ["Add more servers", "Serve it from a cheaper layer"],
      rows: [
        ["Cost", "Grows in step with traffic", "Grows far more slowly"],
        ["Latency", "Unchanged at best", "Usually better: caches and edges are closer and faster"],
        ["New risks", "Few", "Stale data, cache invalidation, another component to run"],
        ["Best when", "Traffic really needs your logic or fresh data", "Traffic is static or repeated reads"],
      ],
    },
    realWorld: [
      {
        company: "Netflix",
        text: "Netflix built Open Connect, its own CDN, and offers its caching appliances to internet providers to install inside their networks. Most viewing traffic is served from those nearby boxes, which cuts the cost of moving video across the internet and improves quality.",
      },
      {
        company: "Amazon Prime Video",
        text: "In 2023 the Prime Video team wrote about rebuilding a video quality monitoring service from many serverless components into a single process, which they reported cut its infrastructure cost by about 90%. The lesson: measure what each part of a design costs instead of assuming.",
      },
    ],
    mistakes: [
      "Removing instances before moving traffic to cheaper layers, which turns a cost project into an outage.",
      "Adding read replicas to handle repeated reads that a much cheaper cache would absorb.",
      "Cutting redundancy to save money, then paying far more in downtime at the first failure.",
    ],
    interview: {
      tip: "If asked to cut cost, find the traffic that does not need to reach the expensive tier. Do the cost-per-request math out loud and say which trade-off (staleness, headroom, redundancy) you are accepting.",
      questions: [
        "Our bill is too high. Where would you look first?",
        "How would you estimate the cost per request of this design?",
        "What is the trade-off of a longer cache TTL?",
        "Which savings would you refuse to make, and why?",
      ],
    },
    quiz: [
      {
        question: "On a site where about half of all requests are images and stylesheets, which change usually saves the most?",
        options: [
          "A bigger database",
          "A CDN with object storage as its origin",
          "More app servers",
          "Another read replica",
        ],
        answer: 1,
        explain: "Static files are the easiest traffic to move to a much cheaper layer. Once the CDN serves them, the app tier loses a large part of its load and can shrink.",
      },
      {
        question: "Your app tier runs at 25% utilisation at peak and latency is fine. What does that tell you?",
        options: [
          "It is under-provisioned and needs more servers",
          "It is over-provisioned: you can likely remove instances and still stay below ~70%",
          "The database must be slow",
          "You need a cache in front of it",
        ],
        answer: 1,
        explain: "25% at peak means you are paying for capacity you never use. Removing some instances raises utilisation towards a healthy target while keeping headroom for spikes.",
      },
      {
        question: "Why can adding a cache let you remove read replicas?",
        options: [
          "The cache also stores writes",
          "With an 80% hit rate the database sees only a fifth of the reads, which often fits on the primary alone",
          "Replicas are slower than the primary database",
          "Caches never miss",
        ],
        answer: 1,
        explain: "Replicas exist to absorb read load. A cache absorbs most of that load far more cheaply per request, so the remaining misses may no longer need extra database copies.",
      },
    ],
  },

  "realtime-gateway": {
    minutes: 7,
    overview:
      "Real-time features like chat, live scores and ride tracking push data the moment it changes over long-lived connections. You will learn how WebSockets differ from polling, why a dedicated gateway holds those connections, and where the messages should be stored.",
    problem:
      "A team chat app checks for new messages by polling: every two seconds, every open tab asks the server 'anything new?'. With 100,000 people online that is 50,000 requests per second, and almost every answer is 'no'. Each poll still travels through an app server and a database query. Despite all that work, messages still feel slow, because a new one can wait up to two seconds for the next poll.",
    sections: [
      {
        icon: "message",
        heading: "From polling to push",
        paragraphs: [
          "Polling means the client asks repeatedly on a timer. It is simple, but the cost grows with the number of users times the poll frequency, whether anything happened or not. Push means the server sends data the moment it exists, over a connection that stays open.",
        ],
        bullets: [
          "Polling: a request every few seconds. Wasteful and adds delay up to one interval.",
          "Long polling: the server holds each request open until there is news or a timeout, then the client immediately asks again.",
          "Server-Sent Events (SSE): one long HTTP response the server keeps writing to. One-way, server to client.",
          "WebSocket: starts as an HTTP request that 'upgrades' into a persistent two-way connection. Both sides can send small messages at any time.",
        ],
      },
      {
        icon: "network",
        heading: "Why a dedicated realtime gateway",
        paragraphs: [
          "A WebSocket connection is mostly idle: it sits open for minutes or hours and carries a small message now and then. Servers built for this use event-driven networking and can hold hundreds of thousands of idle connections on one machine. Typical app servers, built for short request and response cycles, run out of threads or memory long before that.",
          "The realtime gateway authenticates the user when the connection opens, sends heartbeats to detect dead connections, receives messages and forwards them to storage, and pushes new messages out to the right connections. In this game one realtime gateway handles about 10,000 messages per second, against about 1,000 requests per second for an app server.",
        ],
      },
      {
        icon: "database",
        heading: "Where messages live",
        paragraphs: [
          "Chat is append-heavy: a constant stream of small new records, read back by conversation in time order. That pattern fits a store partitioned by channel id and sorted by time, where new shards add write capacity.",
          "A single SQL primary struggles here: in this game each SQL write costs 4 capacity units, and only one primary accepts writes. Sharded NoSQL spreads the writes across shards, so capacity grows as you add them.",
        ],
      },
      {
        icon: "users",
        heading: "The hard parts of stateful connections",
        paragraphs: ["Long-lived connections make the gateway stateful: it matters which server a user is connected to. That brings new problems that stateless request handling never had."],
        bullets: [
          "Routing and presence: if user A is on gateway 1 and user B on gateway 7, something must know where B is. Usually a presence registry or a pub/sub layer connects the gateways.",
          "Deploys: restarting a gateway drops its connections. Drain them gradually, and have clients reconnect with random delays so they do not all return at once.",
          "Delivery guarantees: give each message an id and have clients acknowledge it, so lost messages can be resent and duplicates ignored.",
          "Offline users: store the message, send a push notification, and let the client fetch missed history when it reconnects.",
        ],
      },
    ],
    diagrams: [
      {
        title: "Chat messages",
        nodes: ["client", "ws", "nosql"],
        caption: "Each user keeps one open connection. The gateway writes each message to sharded storage and pushes it to the recipients.",
        steps: ["A teammate sends a chat message over the WebSocket connection their tab already holds open.", "Receives the message, saves it and pushes it to every online recipient, handling about 10,000 messages per second.", "Stores the message in a shard picked by conversation, so cheap writes scale as you add shards."],
      },
      {
        title: "Page loads and history",
        nodes: ["client", "lb", "app", "cache", "nosql"],
        caption: "Ordinary pages and message history still use normal request and response through the app tier.",
        steps: ["A user opens a chat channel and scrolls back to read older messages.", "Sends this normal request to an app server.", "Fetches the requested page of message history and builds the response.", "Answers recent, popular channels from memory without hitting storage.", "Returns older messages from the shard that holds this conversation."],
      },
    ],
    numbers: [
      { value: "~10,000 msg/s", label: "one realtime gateway in this game" },
      { value: "~1,000 req/s", label: "one app server in this game, for comparison" },
      { value: "2-14 bytes", label: "WebSocket frame header, versus hundreds of bytes of HTTP headers per poll" },
      { value: "4 units", label: "cost of one SQL write in this game, versus 1 on a NoSQL shard" },
    ],
    compare: {
      headers: ["Polling", "WebSockets"],
      rows: [
        ["Delay for a new message", "Up to one polling interval", "Milliseconds"],
        ["Wasted work", "Most requests return nothing", "Data is sent only when something changes"],
        ["Server state", "None: any server answers any poll", "Each connection lives on one specific server"],
        ["Operational effort", "Low", "Presence, reconnection, connection draining on deploys"],
      ],
    },
    realWorld: [
      {
        company: "Slack",
        text: "Slack clients keep a WebSocket open to Slack's gateway servers, which push messages, typing indicators and presence changes in real time. Slack's engineering blog describes a layer of gateway servers holding client connections, backed by channel servers that fan messages out to subscribers.",
      },
      {
        company: "Discord",
        text: "Discord runs its real-time gateway on Elixir to hold millions of concurrent connections, and stores messages in a NoSQL database partitioned by channel and time. It moved from Cassandra to ScyllaDB and has written publicly about storing trillions of messages.",
      },
    ],
    mistakes: [
      "Using short polling for chat, so most of your capacity goes to answering 'nothing new'.",
      "Pushing a constant stream of small message writes into a single SQL primary instead of a store that scales writes with shards.",
      "Ignoring reconnection storms: after a deploy or outage, every client reconnects at the same instant unless you add random delays.",
    ],
    interview: {
      tip: "When the prompt says 'real time', ask about delivery guarantees (at-least-once?) and what happens when the receiver is offline. Then explain how a message finds the gateway its recipient is connected to.",
      questions: [
        "User A sends a message to user B, who is connected to a different gateway server. How does it get there?",
        "What happens when the recipient is offline?",
        "How would you deploy a new gateway version without dropping a million connections at once?",
        "How do you make sure messages in a channel show up in the right order?",
      ],
    },
    quiz: [
      {
        question: "Why is polling every second wasteful for a chat app?",
        options: [
          "Polling requests cannot carry message data",
          "Most polls return nothing new, yet each one costs a full request",
          "WebSockets use less bandwidth for images",
          "Browsers do not support polling",
        ],
        answer: 1,
        explain: "Cost grows with users times polls per second, regardless of activity. Push only does work when there is actually something to send.",
      },
      {
        question: "Why use a dedicated realtime gateway instead of app servers to hold WebSocket connections?",
        options: [
          "It is built to hold many long-lived, mostly idle connections and move small messages cheaply",
          "App servers cannot use TCP",
          "The gateway stores messages permanently",
          "WebSockets only work with SQL databases",
        ],
        answer: 0,
        explain: "Holding a connection open is cheap for an event-driven gateway but expensive for a request-oriented app server. Messages still need a durable store behind the gateway.",
      },
      {
        question: "A chat system writes 8,000 new messages per second, read back by channel in time order. Which store fits best?",
        options: [
          "A single SQL primary with a standby",
          "Sharded NoSQL partitioned by channel id",
          "The cache only",
          "Object storage",
        ],
        answer: 1,
        explain: "Sharding by channel spreads writes across machines and keeps each channel's messages together for reading. A single primary caps write capacity, a cache is not durable, and object storage is too slow per request for tiny records.",
      },
    ],
  },

  "find-nearby": {
    minutes: 8,
    overview:
      "Location apps keep asking 'what is near me?' while positions change every few seconds. You will learn why normal database indexes struggle with this, how geohashes, quadtrees and hexagon grids split the map into cells, and where live positions should be stored.",
    problem:
      "A ride app stores each driver's position in a SQL table and updates the row every few seconds. A rider asks for the five nearest drivers, so the query searches for latitude and longitude within a small box. The index on latitude finds every driver in a thin strip that wraps around the whole planet, and the database then filters that strip by longitude and computes distances one by one. Meanwhile, thousands of durable writes per second rewrite positions that will be stale a few seconds later.",
    sections: [
      {
        icon: "map-pin",
        heading: "Why normal indexes struggle",
        paragraphs: [
          "A regular database index (a B-tree) sorts rows by one value, which is great for 'find user 42' or 'orders from last week'. A location has two values, latitude and longitude, and 'near' depends on both at once.",
          "An index on latitude narrows the search to a horizontal band, but everything in that band at every longitude still matches. The database has to scan and filter many rows to find a few neighbours. In this game, a nearby search costs 10 capacity units at a SQL database, against 2 at a geo index.",
        ],
      },
      {
        icon: "layers",
        heading: "Split the map into cells",
        paragraphs: [
          "Geospatial indexes divide the map into cells, so a search only has to look at a handful of cells instead of the whole table. The main families are below.",
          "Every approach answers a nearby search the same way: find the cell the user is in, look at that cell and its neighbours, then compute exact distances only for the few points found and keep the closest.",
        ],
        bullets: [
          "Geohash: interleaves the bits of latitude and longitude into a short string such as 'u4pruyd'. Each extra character makes the cell about 32 times smaller, and nearby points usually share a long prefix, so 'near me' becomes a prefix lookup.",
          "Quadtree: starts with one square and splits any square holding too many points into four. Busy city centres get tiny cells; empty oceans stay as one big cell.",
          "Hexagon grids (such as Uber's H3): every neighbour of a hexagon is the same distance away, which makes distance and coverage calculations more even than with squares.",
        ],
      },
      {
        icon: "zap",
        heading: "Keep live positions in memory",
        paragraphs: [
          "Live positions are frequent and disposable: a driver's location from ten seconds ago is already useless. They belong in an in-memory geo index such as Redis GEO, not in a durable SQL table that pays for indexes and logs on every write.",
          "If the in-memory index restarts, it refills within seconds as drivers send their next updates. Data you must keep, such as completed trip routes, can be written to durable storage separately and asynchronously.",
          "Drivers send updates very often, so they usually use a persistent connection (a realtime gateway) rather than a new HTTP request each time.",
        ],
      },
      {
        icon: "alert",
        heading: "What goes wrong",
        paragraphs: ["Cell-based indexes are simple in principle, but a few details decide whether results are correct and fast."],
        bullets: [
          "Boundaries: a driver five metres away may sit just across a cell edge with a completely different geohash. Always search the neighbouring cells too.",
          "Cell size: too large and each search scans too many points; too small and you need many cells to cover the search radius.",
          "Hot spots: a stadium or airport packs thousands of points into one cell. Use smaller cells there or split the hot area across machines.",
          "Stale points: drivers who go offline must expire, for example by dropping any position not updated in the last 30 seconds.",
        ],
      },
    ],
    diagrams: [
      {
        title: "Location updates",
        nodes: ["client", "ws", "geo"],
        caption: "Drivers stream positions over a persistent connection into the in-memory geo index.",
        steps: ["A driver's phone sends its current position every few seconds while they are on shift.", "Keeps the driver's connection open and forwards each position update cheaply, about 10,000 messages per second.", "Overwrites the driver's position in memory, filed under its map cell, handling about 20,000 updates per second."],
      },
      {
        title: "Nearby searches",
        nodes: ["client", "lb", "app", "geo"],
        caption: "The app asks the geo index for points in the rider's cell and its neighbours, then ranks them by distance.",
        steps: ["A rider opens the app and asks for the closest available drivers.", "Sends the search to any app server.", "Works out the rider's map cell, asks the geo index for nearby drivers, then ranks them by distance.", "Looks up drivers in the rider's cell and its neighbours in memory, at about 20,000 lookups per second."],
      },
    ],
    numbers: [
      { value: "~20,000/s", label: "operations one geo index handles in this game" },
      { value: "~1.2 km", label: "width of a 6-character geohash cell" },
      { value: "9 cells", label: "your cell plus its 8 neighbours, checked on a typical search" },
      { value: "5x", label: "cheaper nearby search on a geo index than on SQL in this game (2 units vs 10)" },
    ],
    compare: {
      headers: ["Geohash", "Quadtree"],
      rows: [
        ["Structure", "Fixed grid encoded as strings", "Tree of squares that split when crowded"],
        ["Adapts to density", "No: every cell at a level is the same size", "Yes: crowded areas get smaller cells"],
        ["Storage", "Just a string column or sorted key, works in many databases", "Usually a custom in-memory structure"],
        ["Neighbour lookup", "Compute the 8 neighbouring hashes", "Walk the tree to adjacent nodes"],
        ["Moving points", "Recompute one string per update", "Points move between nodes; nodes may split or merge"],
      ],
    },
    realWorld: [
      {
        company: "Uber",
        text: "Uber built and open-sourced H3, a hexagonal grid system that covers the globe in cells at many resolutions. Uber uses it to group supply and demand by area, for example when analysing marketplace pricing across a city.",
      },
      {
        company: "Redis",
        text: "Redis offers built-in geo commands (GEOADD, GEOSEARCH) that store each point's geohash as the score in a sorted set. That turns 'find everything within 2 km' into a few fast range lookups in memory, which is why it is a popular choice for live locations.",
      },
    ],
    mistakes: [
      "Writing every location update as a durable row in a SQL table, paying for indexes and logs on data that is stale seconds later.",
      "Searching only the user's own cell, which misses the closest result whenever it sits just across a boundary.",
      "Never expiring old positions, so riders are matched with drivers who logged off an hour ago.",
    ],
    interview: {
      tip: "Mention geohash or quadtree by name and explain how you query neighbouring cells at boundaries. Then say why live positions can live in memory and what you do with data that must be kept.",
      questions: [
        "How do you find the nearest five drivers when the closest one is just across a cell boundary?",
        "How would you split the geo index across machines for a whole country?",
        "A stadium empties and 50,000 people request rides from one cell. What breaks first?",
        "How often should drivers send updates, and what does a shorter interval cost you?",
      ],
    },
    quiz: [
      {
        question: "Why does a nearby search check the neighbouring cells as well as the user's own cell?",
        options: [
          "Neighbouring cells are cheaper to read",
          "A point a few metres away may sit just across the edge, in another cell",
          "Geohash libraries always require nine lookups",
          "It sorts the results by distance",
        ],
        answer: 1,
        explain: "Cells have hard edges, but distance does not. The user may stand near an edge, so the closest point can be in the next cell over.",
      },
      {
        question: "Where should live driver positions that refresh every four seconds be stored?",
        options: [
          "A durable SQL table with indexes on latitude and longitude",
          "An in-memory geo index; losing a few seconds of data on restart is acceptable",
          "Object storage",
          "The CDN",
        ],
        answer: 1,
        explain: "The data is disposable and refreshes constantly, so speed matters far more than durability. If the index restarts, the next round of updates refills it.",
      },
      {
        question: "Two geohashes share a long prefix, for example 'u4pruyd' and 'u4pruyf'. What does that usually tell you?",
        options: [
          "The points are close together",
          "The points belong to the same user",
          "The points were recorded at the same time",
          "Nothing useful",
        ],
        answer: 0,
        explain: "A longer shared prefix means both points fall in the same small cell. The reverse is not always true: two close points on either side of a boundary can have different prefixes.",
      },
    ],
  },

  "black-friday": {
    minutes: 8,
    overview:
      "The boss level combines everything: a traffic spike, static files, uploads, bots, orders and a server failure at the worst moment. This page gives you a repeatable method for open-ended designs: classify the traffic, route each kind to its cheapest path, size for the peak, and plan for failure.",
    problem:
      "A retailer prepares all year for one day. At midnight traffic jumps many times above normal within minutes: shoppers browsing, product images loading, sellers uploading photos, orders pouring in, and bots hammering prices and stock levels. Then, at the busiest moment, one app server crashes. Every earlier lesson solved one of these problems. Today they all arrive together, on a fixed budget.",
    sections: [
      {
        icon: "split",
        heading: "Step 1: classify the traffic",
        paragraphs: [
          "Do not start by drawing boxes. Start by listing each kind of request and its rate, then ask which is the cheapest layer that can serve it. Each class has its own best path, and you have met all of them already.",
        ],
        bullets: [
          "Static files: a CDN with object storage as origin.",
          "Uploads: through the app tier into object storage, never into the database.",
          "Bot traffic: blocked at an API gateway before it reaches anything expensive.",
          "Reads: a cache first, with replicas behind it for misses if the primary cannot cope.",
          "Orders (writes): a queue and workers, so the spike becomes a backlog instead of an overloaded database.",
        ],
      },
      {
        icon: "gauge",
        heading: "Step 2: size each tier for the peak",
        paragraphs: [
          "Work out how much traffic actually reaches each tier after the layers in front of it have done their job. Then divide by per-instance capacity and leave headroom, since latency rises steeply above about 70-80% utilisation.",
        ],
        bullets: [
          "App servers: about 1,000 requests per second each, and remember that uploads cost more than normal requests.",
          "Database: only cache misses and writes reach it, and SQL writes cost 4 units each.",
          "Workers: about 300 jobs per second each. A spike may build a backlog, so check that lag = backlog / drain rate stays within target.",
          "Gateway and CDN: high capacity, but bots and static files are large volumes, so check them too.",
        ],
      },
      {
        icon: "shield",
        heading: "Step 3: plan for the failure",
        paragraphs: [
          "Failures arrive at the worst moment, because peak load is when things break. The tier that can fail must have N+1 capacity at peak: the survivors must still carry the full spike, not the average.",
          "Every component on the critical path is a single point of failure until it has a partner. Spend redundancy where failures are likely and where a loss would take everything down; a component that only delays background work can sometimes stay single.",
        ],
      },
      {
        icon: "trending-up",
        heading: "Step 4: check, then trim",
        paragraphs: [
          "Run the design, then read the results: which component is hottest, and which barely works? Fix the hottest bottleneck first, then remove capacity that is clearly idle. Repeat until every tier has headroom and the bill fits.",
          "In real companies this happens weeks before the big day: load tests at expected peak and beyond, freezes on risky changes, capacity added ahead of time because autoscaling reacts too slowly to a midnight spike, and switches to turn off non-essential features if checkout needs the capacity.",
        ],
      },
    ],
    diagrams: [
      {
        title: "Static files and images",
        nodes: ["client", "cdn", "blob"],
        caption: "The bulk of the traffic is served from the edge, with object storage as origin.",
        steps: ["A shopper browses deals at midnight, loading product images and stylesheets.", "Serves most images and files from the edge, keeping this huge share of the spike off your servers.", "Holds every product image and acts as origin for the few CDN misses."],
      },
      {
        title: "Orders",
        nodes: ["client", "gateway", "app", "queue", "worker", "sqldb"],
        caption: "Bots are stopped at the gateway; orders are queued and written by workers at a pace the database can take.",
        steps: ["A shopper places an order at the peak, while bots hammer stock and price endpoints.", "Blocks bot and abusive traffic at the door, so only real orders reach the app tier.", "Validates the order, queues it and confirms immediately; spare servers cover the one that crashes.", "Absorbs the midnight spike of orders instantly and holds them until workers are free.", "Each worker processes about 300 orders per second, writing them at a steady pace.", "Saves each order, at 4 units per write, at a rate it can sustain instead of the raw spike."],
      },
    ],
    numbers: [
      { value: "~1,000 req/s", label: "one app server in this game" },
      { value: "~300 jobs/s", label: "one worker in this game" },
      { value: "~70%", label: "peak utilisation to aim for, leaving room for a failure" },
      { value: "4 units", label: "cost of one SQL write in this game" },
    ],
    compare: {
      headers: ["Pre-scale before the event", "Autoscale during it"],
      rows: [
        ["Reaction time", "Capacity is already there", "Minutes to start new servers, after load has risen"],
        ["Cost", "Paying for capacity before it is needed", "Pay only for what you use"],
        ["Risk in a sudden spike", "Low", "High: the spike can arrive faster than new servers"],
        ["Best for", "Known events: sales, launches, live broadcasts", "Gradual, unpredictable growth"],
      ],
    },
    realWorld: [
      {
        company: "Amazon",
        text: "Amazon's Prime Day is one of the largest shopping events of the year, and AWS publishes posts after each one describing the scale its services handled, with request rates far above normal days. Preparation includes extensive load testing and capacity planning well ahead of the event.",
      },
      {
        company: "Shopify",
        text: "Shopify's engineering team has written about preparing for Black Friday and Cyber Monday with large-scale load tests that simulate peak traffic across the platform months in advance, so bottlenecks are found before merchants' biggest sales weekend.",
      },
    ],
    mistakes: [
      "Throwing more app servers at everything instead of moving static files, bots and orders to the layers built for them.",
      "Sizing tiers for the peak with everything healthy, so a single failure at the peak pushes the survivors over the edge.",
      "Relying on autoscaling for a sudden spike. By the time new servers are ready, users have already seen errors.",
    ],
    interview: {
      tip: "In open-ended interviews, prioritise: handle the biggest traffic first, then the riskiest failure. Saying 'let me classify the traffic before I draw anything' signals structured thinking.",
      questions: [
        "Traffic will be 10x normal for one day. What do you do in the weeks before?",
        "Which part of this design fails first if traffic is twice your estimate?",
        "Which features would you switch off to protect checkout?",
        "How do you make sure an order is never lost if a worker crashes mid-job?",
      ],
    },
    quiz: [
      {
        question: "Which kind of traffic should never reach your app servers?",
        options: ["Uploads", "Bot traffic", "Orders", "Reads that miss the cache"],
        answer: 1,
        explain: "Bots should be rejected at the gateway before they use any expensive capacity. Uploads, orders and cache misses are real work the app tier has to handle.",
      },
      {
        question: "Ten app servers run at 85% at peak, all healthy. One of them dies. What happens?",
        options: [
          "Nothing: the load balancer handles it",
          "The other nine must run at about 94% each, so latency spikes and requests may fail",
          "The database takes over the dead server's work",
          "The queue absorbs the extra reads",
        ],
        answer: 1,
        explain: "The same traffic is now split across nine servers: 85% x 10 / 9 is about 94%. Far above the ~70-80% comfort zone, queueing delay explodes. The spare capacity had to be there before the failure.",
      },
      {
        question: "Orders arrive at 500 per second during a 60-second spike and 100 per second otherwise. Workers drain 300 per second. What happens?",
        options: [
          "The backlog grows forever",
          "The backlog reaches about 12,000 jobs, lag peaks around 40 seconds, then it drains after the spike",
          "200 orders per second are lost during the spike",
          "The database overloads during the spike",
        ],
        answer: 1,
        explain: "During the spike the backlog grows by 200 per second, reaching 12,000 after a minute. Lag = 12,000 / 300 = 40 seconds. Afterwards workers drain 200 more than arrive each second, so it clears. The database only sees the workers' rate.",
      },
    ],
  },
};
