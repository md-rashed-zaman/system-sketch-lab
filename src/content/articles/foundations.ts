import type { Article } from "../types";

export const FOUNDATIONS_ARTICLES: Record<string, Article> = {
  "hello-server": {
    minutes: 6,
    overview:
      "Every web system, from a blog to a bank, starts with the same path: a user sends a request, an application server runs code, and a database stores the data. After this page you will be able to draw that path, explain what each box is for, and spot which box limits the whole system.",
    problem:
      "A small bookshop wants to sell online. Customers will browse book pages and place orders, and the shop cannot lose an order just because a machine restarts. Before thinking about scale, the owner needs the simplest setup that works: something to run the shop's code and something to remember the orders.",
    sections: [
      {
        icon: "network",
        heading: "What happens when a user clicks",
        paragraphs: [
          "A request is a message from the user's browser or phone app asking the system to do something, like 'show me this book' or 'place this order'. It travels over the internet, gets handled, and a response comes back.",
          "Each step on that trip takes time. The total time the user waits is called latency, usually measured in milliseconds (ms).",
        ],
        bullets: [
          "The browser looks up the server's address (DNS) and opens a connection to it.",
          "It sends an HTTP request, for example GET /books/42.",
          "The app server runs your code: checks who the user is, validates input, decides what to do.",
          "If it needs stored data, it queries the database and waits for the answer.",
          "The app server builds the response (HTML or JSON) and sends it back.",
        ],
      },
      {
        icon: "server",
        heading: "Why the app server sits in the middle",
        paragraphs: [
          "The application server (app server) is a machine running your code, written in something like Node.js, Python or Java. Users never talk to the database directly, because the database would happily run any query it is given, including 'delete all orders'.",
          "The app server is the gatekeeper. It checks permissions, rejects bad input, applies business rules (is this book in stock?) and turns raw rows into a response the client understands.",
          "A good app server keeps nothing important in its own memory between requests. That property is called being stateless, and it is what lets you add more servers later.",
        ],
      },
      {
        icon: "database",
        heading: "The database: memory that survives",
        paragraphs: [
          "A program's memory (RAM) is wiped when the process restarts or the machine reboots. A database writes data to disk so it survives crashes, restarts and deploys. That guarantee is called durability.",
          "A SQL database (like PostgreSQL or MySQL) stores data in tables and supports transactions: a group of changes that either all happen or none happen. For an order, that means you never charge a card without also recording the order.",
          "Writes are more expensive than reads. To save a row the database must update indexes and append to a log on disk before it can confirm. In the simulator a write costs 4 capacity units while a read costs 1.",
        ],
      },
      {
        icon: "gauge",
        heading: "Latency adds up, capacity is set by the weakest box",
        paragraphs: [
          "Latency is additive: the user waits for every hop on the path. A busy component adds even more, because requests queue up waiting for their turn.",
          "Capacity is the number of requests per second (req/s) a component can handle. The whole system can only go as fast as its slowest component, the bottleneck. A huge database does not help if the app server in front of it is overloaded.",
          "So the first design habit is simple arithmetic. For example, 1,000 reads plus 200 writes per second costs a SQL database 1,000 + 200 x 4 = 1,800 units per second, well inside its 3,000 units of capacity.",
        ],
      },
    ],
    diagrams: [
      {
        title: "The basic request path",
        nodes: ["client", "app", "sqldb"],
        caption: "Users send requests to the app server, which reads and writes the database. Every system in this game grows from this shape.",
        steps: [
          "A customer opens a book page or places an order in the bookshop's web store.",
          "Runs the shop's code, building the page or checking the order; one server handles about 1,000 requests per second.",
          "Saves books and orders to disk so nothing is lost on restart; each write costs 4 units versus 1 for a read.",
        ],
      },
    ],
    numbers: [
      { value: "~1,000 req/s", label: "one app server instance in the simulator" },
      { value: "~100 ns", label: "reading from RAM" },
      { value: "~0.1 ms", label: "a random read from an SSD" },
      { value: "~150 ms", label: "a network round trip between continents" },
    ],
    compare: {
      headers: ["Keep data in app memory", "Store data in a database"],
      rows: [
        ["Speed", "Fastest possible, no network hop", "A few ms per query"],
        ["Survives a restart", "No, it is lost", "Yes, it is written to disk"],
        ["Shared between servers", "No, each server has its own copy", "Yes, every server sees the same data"],
        ["Good for", "Short-lived scratch data", "Orders, users, anything you must not lose"],
      ],
    },
    realWorld: [
      {
        company: "Instagram",
        text: "Instagram's early engineering posts describe a simple stack: Django app servers in front of PostgreSQL. They added caching, replicas and sharding only as traffic forced each step.",
      },
      {
        company: "Stack Overflow",
        text: "Stack Overflow has publicly described serving a very large site from a surprisingly small number of web servers and SQL Server machines. It shows how far a plain app-server-plus-database design can go when each piece is well tuned.",
      },
    ],
    mistakes: [
      "Letting clients query the database directly, which skips validation and permission checks.",
      "Storing important data (sessions, carts, orders) only in the app server's memory, where a restart erases it.",
      "Adding queues, caches and microservices before any number says you need them.",
    ],
    interview: {
      tip: "Open every design by drawing client, app server and database, then state the expected requests per second for reads and writes. Add a component only when a number forces you to.",
      questions: [
        "Why shouldn't the client talk to the database directly?",
        "What does it mean for an app server to be stateless, and why does it matter?",
        "Why are database writes more expensive than reads?",
        "Where does latency come from on this path, and which hop would you measure first?",
      ],
    },
    quiz: [
      {
        question: "Your app server is at 95% utilisation while the database is at 20%. What limits the system right now?",
        options: ["The database", "The app server", "The network between users and the app", "Nothing, 20% means there is plenty of room"],
        answer: 1,
        explain: "The whole path is only as fast as its busiest box. The app server is the bottleneck; spare database capacity cannot help requests that are stuck waiting at the app tier.",
      },
      {
        question: "Why do orders go into a database instead of a variable in the app server's memory?",
        options: [
          "Memory is too slow for orders",
          "Databases are cheaper than RAM",
          "The database writes them to disk, so they survive restarts and every server can see them",
          "App servers cannot store numbers",
        ],
        answer: 2,
        explain: "Memory is fast but lost on restart and private to one process. A database gives durability and one shared source of truth.",
      },
      {
        question: "A SQL database has 3,000 units per second. Reads cost 1 unit and writes cost 4. Which load fits?",
        options: ["2,000 reads and 400 writes per second", "1,000 reads and 600 writes per second", "3,000 reads and 100 writes per second", "500 reads and 700 writes per second"],
        answer: 1,
        explain: "1,000 + 600 x 4 = 3,400 is too much? No: check each. 2,000 + 1,600 = 3,600 (over), 1,000 + 2,400 = 3,400 (over), 3,000 + 400 = 3,400 (over), 500 + 2,800 = 3,300 (over).",
      },
    ],
  },

  "scale-out": {
    minutes: 7,
    overview:
      "When one server cannot keep up, you either buy a bigger machine or add more machines. This page explains both, how a load balancer spreads traffic across many servers, and why servers slow down sharply long before they reach 100% busy.",
    problem:
      "The bookshop gets mentioned on a popular podcast and traffic climbs all afternoon. The single app server's CPU hits 100%, pages take seconds to load, and some requests time out. Upgrading to a bigger machine means downtime and only buys a little room. The shop needs a way to add capacity in small steps, without anyone noticing.",
    sections: [
      {
        icon: "scale",
        heading: "Two ways to grow: up or out",
        paragraphs: [
          "Vertical scaling (scaling up) means replacing a server with a bigger one: more CPU cores, more RAM. It needs no code changes, but the biggest machines are very expensive and there is always a largest size you can buy.",
          "Horizontal scaling (scaling out) means running many copies of the same server and splitting the traffic between them. Capacity grows roughly in a straight line: ten servers at about 1,000 req/s each handle about 10,000 req/s.",
          "Most systems scale app servers out, because it has no hard ceiling and lets you add or remove one machine at a time.",
        ],
      },
      {
        icon: "split",
        heading: "How a load balancer works",
        paragraphs: [
          "Users need one address to connect to, not a list of servers. A load balancer (LB) is that single front door. It receives every request and forwards it to one of the servers behind it, then passes the response back.",
          "It also runs health checks: every few seconds it pings each server, and if one stops answering it stops sending traffic there. Users never see the dead server.",
        ],
        bullets: [
          "Round robin: send requests to each server in turn. Simple and fine when requests are similar.",
          "Least connections: send to the server with the fewest requests in progress. Better when some requests are slow.",
          "Hashing: send the same user to the same server. Useful for caching, but it makes load less even.",
        ],
      },
      {
        icon: "layers",
        heading: "Stateless servers make scaling easy",
        paragraphs: [
          "If server A remembers that a user is logged in, and the next request lands on server B, the user is suddenly logged out. Keeping per-user data in one server's memory is called server-side state, and it breaks horizontal scaling.",
          "The fix is to make app servers stateless: any server can handle any request. Sessions and carts move to a shared store such as a cache or the database, or into a signed token the client sends with each request.",
          "Once servers are stateless, adding capacity is just starting another copy and registering it with the load balancer.",
        ],
      },
      {
        icon: "trending-up",
        heading: "Why 100% busy is far too busy",
        paragraphs: [
          "Utilisation is how much of a component's capacity is in use. At 50% a new request usually finds the server free and is answered immediately. As utilisation climbs, requests arrive while others are still being processed and start waiting in a queue.",
          "That waiting grows slowly at first, then very steeply above about 70-80%. Near 100% the queue grows faster than it drains and latency explodes. In the simulator the same thing happens: p95 latency (the time 95% of requests finish within) jumps as a component nears its limit.",
          "So size for the peak with headroom. If peak traffic is 2,500 req/s and each server does about 1,000, three servers would sit at 83%; four keeps each near 63%.",
        ],
      },
    ],
    diagrams: [
      {
        title: "Scaled-out app tier",
        nodes: ["client", "lb", "app", "sqldb"],
        caption: "Users reach one load balancer address. It spreads requests across several identical app server instances, which all share the same database.",
        steps: [
          "Podcast listeners flood the bookshop, all sending requests to the same single address.",
          "Receives every request and hands it to the least busy app server, handling up to 20,000 requests per second itself.",
          "One of several identical copies runs the request; each adds about 1,000 requests per second, so add more as traffic climbs.",
          "All app servers share this one database, so it now holds every book and order no matter which server took the request.",
        ],
      },
    ],
    numbers: [
      { value: "~1,000 req/s", label: "one app server instance in the simulator" },
      { value: "~70-80%", label: "utilisation where latency starts climbing steeply" },
      { value: "~60-70%", label: "a comfortable peak utilisation target" },
      { value: "~20,000 req/s", label: "one load balancer instance in the simulator" },
    ],
    compare: {
      headers: ["Vertical scaling (bigger machine)", "Horizontal scaling (more machines)"],
      rows: [
        ["How", "Replace the server with a larger one", "Add identical servers behind a load balancer"],
        ["Code changes", "None", "Servers must be stateless"],
        ["Limit", "The largest machine you can buy", "Practically none for app servers"],
        ["Cost curve", "Gets expensive fast at the top end", "Grows roughly in proportion to capacity"],
        ["Failure", "One machine, one outage", "Losing one server removes only a slice of capacity"],
      ],
    },
    realWorld: [
      {
        company: "Netflix",
        text: "Netflix runs its services as stateless instances on AWS in auto scaling groups behind load balancers, so it can add or remove servers as viewing traffic rises and falls through the day.",
      },
      {
        company: "Google",
        text: "Google published a paper on Maglev, its software network load balancer. It runs on ordinary servers and is itself scaled out, so the front door grows the same way as the servers behind it.",
      },
    ],
    mistakes: [
      "Adding more app instances without a load balancer in front, so all traffic still lands on one of them.",
      "Planning for 100% utilisation at peak, which leaves no room before latency explodes.",
      "Keeping sessions in app server memory, so users get logged out when the load balancer picks a different server.",
    ],
    interview: {
      tip: "Do the capacity math out loud: peak req/s, capacity per server, target utilisation, number of servers. Then mention that the servers are stateless and sessions live in a shared store.",
      questions: [
        "How would you decide how many app servers you need?",
        "Where do user sessions live once you have many app servers?",
        "Which load balancing algorithm would you pick if some requests take ten times longer than others?",
        "When would you choose vertical scaling instead of horizontal?",
      ],
    },
    quiz: [
      {
        question: "Peak traffic is 4,000 req/s and each app server handles about 1,000. Which choice best balances cost and latency?",
        options: ["4 servers", "5 servers", "6 servers", "8 servers"],
        answer: 2,
        explain: "Six servers puts each near 67% at peak, in the comfortable zone. Four would run at 100% and five at 80%, where queueing makes latency climb steeply. Eight works but wastes money.",
      },
      {
        question: "Users keep getting logged out at random after you add a second app server. What is the most likely cause?",
        options: [
          "The load balancer is too slow",
          "Sessions are stored in each app server's memory",
          "The database cannot handle two servers",
          "Round robin is broken",
        ],
        answer: 1,
        explain: "When a user's next request goes to the other server, that server has never seen their session. Moving sessions to a shared store fixes it.",
      },
    ],
  },

  "no-single-point-of-failure": {
    minutes: 7,
    overview:
      "Machines crash, deploys go wrong and whole data centres lose power. This page teaches you to find single points of failure, add redundancy so one broken part is not an outage, and reason about availability in 'nines'.",
    problem:
      "The bookshop now has a load balancer and a few app servers. One evening a bad kernel update reboots the load balancer. For four minutes every customer sees an error page, even though every app server was healthy. The servers had backups; the front door did not.",
    sections: [
      {
        icon: "alert",
        heading: "What a single point of failure is",
        paragraphs: [
          "A single point of failure (SPOF) is any component whose loss takes the whole system down. If there is only one of something on the request path, it is a SPOF.",
          "SPOFs hide in boring places: the load balancer, a DNS provider, one network switch, the one database. Scaling out the app tier does nothing if the box in front of it is still alone.",
        ],
        bullets: [
          "Walk the request path box by box.",
          "For each box ask: 'what happens if this dies right now?'",
          "If the answer is 'everything stops', you found a SPOF.",
        ],
      },
      {
        icon: "shield",
        heading: "Redundancy and N+1",
        paragraphs: [
          "Redundancy means running more copies than you strictly need, so a failed copy can be absorbed. The common rule is N+1: if N instances carry the load, run at least one more.",
          "Redundancy is about capacity, not just count. If three servers each run at 90%, losing one pushes the other two to 135% and they fall over too. The survivors must be able to carry the full load.",
          "For example, with 2,400 req/s and servers of about 1,000 req/s, three servers survive losing one only barely (1,200 req/s each). Four leaves the remaining three near 80%.",
        ],
      },
      {
        icon: "activity",
        heading: "Detecting failure and routing around it",
        paragraphs: [
          "Redundancy only helps if traffic stops going to the broken copy. Load balancers do this with health checks: a small request every few seconds, and a server that fails several in a row is taken out of rotation.",
          "Load balancers themselves are made redundant in pairs. Two instances share a virtual IP address or are both listed in DNS, and if one dies the other takes all the traffic.",
          "There is always a short gap between a failure and its detection. During those seconds some requests fail, which is why clients should retry.",
        ],
      },
      {
        icon: "clock",
        heading: "Counting nines",
        paragraphs: [
          "Availability is the fraction of time (or of requests) the system works. It is quoted in nines: 99.9% is 'three nines'. Each extra nine cuts allowed downtime by ten.",
          "Components in a chain multiply: two parts at 99% each give about 98% together, because either one can break the request. Redundant copies in parallel work the other way: two 99% copies, where either is enough, give about 99.99%.",
          "That is why redundancy is so effective, and why every extra box in a chain without a backup quietly lowers your availability.",
        ],
      },
    ],
    diagrams: [
      {
        title: "Redundant at every hop",
        nodes: ["client", "lb", "app", "sqldb"],
        caption: "Two load balancer instances and several app instances. Health checks remove a dead instance and the survivors carry its share. The database is still a SPOF here; later lessons fix that.",
        steps: [
          "A customer browses the shop while one of the machines behind the scenes has just crashed.",
          "Two load balancer instances share the front door, so a reboot of one no longer shows customers an error page.",
          "Health checks skip a dead app server, and the surviving instances, about 1,000 requests per second each, absorb its share.",
          "Still a single machine here, so if it fails every request fails; later lessons add a standby to fix that.",
        ],
      },
    ],
    numbers: [
      { value: "~43 min", label: "downtime per month allowed by 99.9%" },
      { value: "~4 min", label: "downtime per month allowed by 99.99%" },
      { value: "~3.6 h", label: "downtime per month allowed by 99.5%" },
      { value: "N+1", label: "run at least one more instance than the load needs" },
    ],
    compare: {
      headers: ["Active-active", "Active-passive"],
      rows: [
        ["Normal day", "All copies serve traffic", "One copy serves, the other waits"],
        ["On failure", "Survivors absorb the share instantly", "The spare must be switched on (failover)"],
        ["Cost efficiency", "Every copy does useful work", "The spare sits idle"],
        ["Typical use", "Stateless app servers, load balancers", "Primary databases with a standby"],
      ],
    },
    realWorld: [
      {
        company: "Netflix",
        text: "Netflix built Chaos Monkey, a tool that randomly shuts down production instances during working hours. Engineers are forced to design every service so that losing any one instance is a non-event.",
      },
      {
        company: "Amazon Web Services",
        text: "In 2017 a mistyped command during S3 maintenance in one AWS region removed more servers than intended, and many websites that depended only on that region went down. AWS's public summary is a classic lesson in hidden single points of failure.",
      },
    ],
    mistakes: [
      "Making app servers redundant but leaving a single load balancer in front of them.",
      "Counting instances instead of capacity: N+1 servers that are each near full cannot absorb a failure.",
      "Assuming failover is instant and not adding retries for the few seconds before health checks react.",
    ],
    interview: {
      tip: "After drawing a design, walk it box by box and say what happens when each one dies. Then state your availability target and what it allows per month.",
      questions: [
        "Where are the single points of failure in your design?",
        "If one of your app servers dies at peak, do the rest stay under their limit?",
        "How does the load balancer know a server is dead, and how long does that take?",
        "What does 99.99% availability mean in minutes per month, and what would it cost you?",
      ],
    },
    quiz: [
      {
        question: "Peak is 3,000 req/s and each server handles about 1,000. You run 3 servers. One crashes. What happens?",
        options: [
          "Nothing, the other two absorb it easily",
          "The two survivors are pushed to about 150% and start failing",
          "The load balancer adds a new server automatically",
          "Only reads fail",
        ],
        answer: 1,
        explain: "N+1 is about spare capacity. Three servers at 100% have no spare; the survivors would need to handle 1,500 req/s each, well beyond their limit.",
      },
      {
        question: "Two components, each 99% available, are both required to serve a request. What is the combined availability?",
        options: ["About 99.99%", "About 99.5%", "About 98%", "About 99%"],
        answer: 2,
        explain: "In a chain, availabilities multiply: 0.99 x 0.99 = 0.98. Every required box lowers the total, which is why each one needs a backup.",
      },
    ],
  },

  "cache-the-hot-reads": {
    minutes: 8,
    overview:
      "A cache keeps recent answers in memory so you do not have to ask the database again. This page explains why caching works so well, the cache-aside pattern step by step, how to keep cached data fresh, and the ways caches go wrong.",
    problem:
      "A news site publishes a big story. Thousands of readers per second open the same article, and every view runs the same query against the database. The database CPU hits 100%, queries slow down, and even the comment form stops working. The article text has not changed in an hour, yet the database is computing it again for every single reader.",
    sections: [
      {
        icon: "zap",
        heading: "Why caching works",
        paragraphs: [
          "Real traffic is skewed: a small set of items (today's top story, the home page, a popular product) gets most of the reads. These are hot keys, and they change rarely compared with how often they are read.",
          "Memory is also far faster than disk. A cache such as Redis or Memcached keeps data in RAM on a separate server, and a lookup over the network returns in about a millisecond.",
          "The hit ratio is the share of reads the cache answers. In the simulator a cache answers about 80% of reads, so the database only sees the other 20%: 10,000 reads per second become 2,000.",
        ],
      },
      {
        icon: "repeat",
        heading: "Cache-aside, step by step",
        paragraphs: [
          "The most common pattern is cache-aside (also called lazy loading). The app owns the logic; the cache is just a fast key-value store beside it.",
        ],
        bullets: [
          "The app receives a read and builds a key, like article:123.",
          "It asks the cache for that key. If it is there (a hit), it returns the value immediately.",
          "If not (a miss), it reads the database, returns the result, and stores it in the cache with an expiry time.",
          "Writes go to the database, and the app deletes or updates the cached key so the next read sees fresh data.",
        ],
      },
      {
        icon: "clock",
        heading: "Keeping the cache fresh",
        paragraphs: [
          "A cached value can go stale: the database changes but the cache still holds the old copy. A TTL (time to live) is an expiry time on each key, so stale data is replaced after at most that long.",
          "Pick the TTL from how stale the data may be. A product description can be minutes old; a bank balance should not be cached loosely at all.",
          "For faster freshness, invalidate on write: when the app updates a row, it deletes the matching cache key. Deleting is usually safer than overwriting, because two racing writers can leave the wrong value behind.",
        ],
      },
      {
        icon: "alert",
        heading: "What goes wrong",
        paragraphs: [
          "A cache shifts load, it does not remove it. Every request still passes through the app servers, and writes still go to the database at full cost. Check the app tier and the write load, not only reads.",
        ],
        bullets: [
          "Thundering herd: a hot key expires and thousands of requests miss at once, all hitting the database. Fix with a lock so one request refills it, or with staggered TTLs.",
          "Cold start: a fresh or restarted cache is empty, so every read goes to the database until it warms up.",
          "Treating the cache as a database: it can evict or lose data at any time, so the source of truth must stay in the database.",
        ],
      },
    ],
    diagrams: [
      {
        title: "Cache-aside read path",
        nodes: ["client", "lb", "app", "cache", "sqldb"],
        caption: "Reads try the cache first. Only misses reach the database. Writes go to the database directly, and the app invalidates the cached copy.",
        steps: [
          "A reader opens the big news story that thousands of others are reading at the same moment.",
          "Spreads the flood of article views across the app servers so no single server takes them all.",
          "Asks the cache for the article first, and on a miss loads it from the database and stores a copy.",
          "Checks memory first: about 8 in 10 reads are answered here in ~1 ms, the rest continue to the database.",
          "Only sees cache misses and writes, so the same story no longer runs the same query thousands of times.",
        ],
      },
    ],
    numbers: [
      { value: "~1 ms", label: "a cache hit over the network" },
      { value: "~80%", label: "of reads answered by a cache in the simulator" },
      { value: "3,000 units/s", label: "SQL database capacity in the simulator" },
      { value: "4 units", label: "cost of one write at the SQL database" },
    ],
    compare: {
      headers: ["Cache-aside", "Write-through"],
      rows: [
        ["On a write", "Write the database, delete the cache key", "Write the cache and the database together"],
        ["On a read miss", "App loads from the database and fills the cache", "Rare, data is usually already cached"],
        ["Freshness", "Stale until TTL or invalidation", "Cache stays in step with the database"],
        ["Downside", "First read after a change is slow", "Writes are slower, and rarely read data fills the cache"],
        ["Typical use", "Most read-heavy web apps", "Data that is read right after it is written"],
      ],
    },
    realWorld: [
      {
        company: "Facebook",
        text: "Facebook's paper 'Scaling Memcache at Facebook' describes huge memcached clusters in front of MySQL. They added 'leases' to stop thundering herds and stale sets when hot keys are invalidated.",
      },
      {
        company: "Netflix",
        text: "Netflix built EVCache, a memcached-based caching layer, to serve personalisation and metadata reads quickly and to keep load off its databases. It replicates data across availability zones so a zone failure does not empty the cache.",
      },
    ],
    mistakes: [
      "Adding a cache and forgetting that every request still passes through the app tier, which may also be at its limit.",
      "Caching without a TTL or invalidation plan, so users see old data indefinitely.",
      "Letting a hot key expire for everyone at once and stampeding the database.",
    ],
    interview: {
      tip: "When you add a cache, say four things: what you cache, the expected hit ratio, the TTL, and how you handle writes (invalidate or update).",
      questions: [
        "What hit ratio do you expect, and how much load does that remove from the database?",
        "How do you keep cached data from going stale after a write?",
        "What happens when the cache restarts empty during peak traffic?",
        "What data would you refuse to cache, and why?",
      ],
    },
    quiz: [
      {
        question: "5,000 reads per second hit a cache with an 80% hit ratio. How many reads per second reach the database?",
        options: ["4,000", "1,000", "800", "5,000"],
        answer: 1,
        explain: "80% are hits, so 20% miss: 5,000 x 0.2 = 1,000 reads per second reach the database.",
      },
      {
        question: "You add a cache, and the database is now comfortable, but p95 latency is still terrible. What should you check first?",
        options: [
          "The cache hit ratio is too high",
          "The app tier, since every request still passes through it",
          "The TTL is too long",
          "The load balancer algorithm",
        ],
        answer: 1,
        explain: "A cache sits behind the app servers. It removes database load but not app load, so an overloaded app tier still slows every request.",
      },
      {
        question: "A popular key expires and the database suddenly spikes. What is this called?",
        options: ["Replication lag", "A cold start", "A thundering herd", "Write amplification"],
        answer: 2,
        explain: "Many requests miss the same key at the same moment and all go to the database. A refill lock or staggered TTLs prevents it.",
      },
    ],
  },

  "go-to-the-edge": {
    minutes: 7,
    overview:
      "Images, stylesheets, scripts and videos are the same for every user, so they should never use up your app servers. This page explains how a content delivery network (CDN) caches these files close to users, why object storage is its origin, and how to update a file that is cached all over the world.",
    problem:
      "A photo-heavy online store loads dozens of images on every product page. Each image request goes through the load balancer to an app server, which reads the file from disk and sends it. The app servers spend most of their time copying bytes, real requests like 'add to cart' wait in line, and users far from the data centre wait even longer.",
    sections: [
      {
        icon: "layers",
        heading: "Static versus dynamic traffic",
        paragraphs: [
          "Static content is a file that is identical for every user: product photos, logos, CSS, JavaScript bundles, video segments. Dynamic content is computed per request: your cart, search results, your order history.",
          "On a typical page, most requests are static. Separating the two lets you send static files to a system built only for serving files, and keep your app servers for the work only they can do.",
        ],
      },
      {
        icon: "globe",
        heading: "How a CDN works",
        paragraphs: [
          "A CDN is a network of edge servers in many cities, called points of presence (PoPs). When a user requests a file, they are routed to the nearest PoP instead of your data centre.",
        ],
        bullets: [
          "The user's request for logo.png is routed (by DNS or anycast) to a nearby edge server.",
          "If the edge has the file cached (a hit), it answers immediately from close by.",
          "If not (a miss), it fetches the file from your origin, returns it, and keeps a copy for the next user.",
          "Cache-Control headers from the origin tell the edge how long the copy may be reused.",
        ],
      },
      {
        icon: "hard-drive",
        heading: "Object storage as the origin",
        paragraphs: [
          "The origin is the place a CDN fetches files from on a miss. Using app servers as the origin works, but they are slow and expensive per file. Object storage (like Amazon S3) is built for this: cheap, durable storage of files that are fetched by name.",
          "In the simulator a CDN serves about 90% of static requests and forwards the rest to its origin. That means 10,000 static requests per second become about 1,000 at Object Storage and none at your app servers.",
          "Dynamic requests do not change. They still go through the load balancer to the app tier, which is now free to handle them.",
        ],
      },
      {
        icon: "alert",
        heading: "Updating cached files and other traps",
        paragraphs: [
          "Once a file is cached at hundreds of edges, changing it is hard. Asking the CDN to purge it is slow and easy to forget. The standard trick is versioned file names: app.3f9a2c.js. A new version gets a new name, so it can be cached forever and never served stale.",
        ],
        bullets: [
          "Never cache personalised responses (a page with the user's name) as if they were static.",
          "Without an origin, misses have nowhere to go and fail.",
          "CDNs bill by data transferred, so for a tiny site a single server can be cheaper.",
        ],
      },
    ],
    diagrams: [
      {
        title: "Static files at the edge",
        nodes: ["client", "cdn", "blob"],
        caption: "Users fetch images and scripts from a nearby CDN edge. Only misses travel to Object Storage, the origin.",
        steps: [
          "A shopper's browser loads the dozens of product photos, stylesheets and scripts on a product page.",
          "A nearby edge server answers about 90% of these files from its own copy, without touching your servers.",
          "The origin that holds every file; it only serves the roughly 1 in 10 requests the CDN does not have yet.",
        ],
      },
      {
        title: "Dynamic requests stay on the main path",
        nodes: ["client", "lb", "app", "sqldb"],
        caption: "Reads and writes that need your code still go through the load balancer and app servers, which now handle far less traffic.",
        steps: [
          "The shopper does something that needs your code, like adding an item to the cart or checking out.",
          "Spreads these dynamic requests across the app servers, now free of the image traffic the CDN took over.",
          "Runs the cart and checkout logic; with no images to copy, each server's ~1,000 requests per second go to real work.",
          "Reads and saves the cart and order, which must be correct for each user and so cannot come from a CDN.",
        ],
      },
    ],
    numbers: [
      { value: "~90%", label: "of static requests served by the CDN in the simulator" },
      { value: "~10-30 ms", label: "a round trip to a nearby edge server" },
      { value: "~150 ms", label: "a round trip to a data centre on another continent" },
      { value: "~100,000 req/s", label: "one CDN in the simulator" },
    ],
    compare: {
      headers: ["App servers serve files", "CDN plus object storage"],
      rows: [
        ["Where files come from", "Your data centre, for every user", "A nearby edge, origin only on a miss"],
        ["Load on app servers", "Every file request", "None for static files"],
        ["Latency for distant users", "A full cross-world round trip", "A short trip to the nearest edge"],
        ["Updating a file", "Just replace it", "Use versioned names or purge"],
        ["Cost", "Expensive app capacity per file", "Cheap per request at scale"],
      ],
    },
    realWorld: [
      {
        company: "Netflix",
        text: "Netflix built Open Connect, its own CDN. It places caching appliances inside internet providers' networks, so most video is streamed from a box very close to the viewer instead of from a central data centre.",
      },
      {
        company: "Wikipedia",
        text: "The Wikimedia Foundation runs caching servers in several data centres around the world. Most page and image views by logged-out readers are answered by these caches without reaching the application servers.",
      },
    ],
    mistakes: [
      "Adding a CDN but leaving it without an origin, so every miss fails.",
      "Overwriting a file under the same name and wondering why users still see the old one.",
      "Caching responses that contain user-specific data, and showing one user's page to another.",
    ],
    interview: {
      tip: "Split traffic into static and dynamic early. Moving static files to a CDN often removes most of the load before you design anything else.",
      questions: [
        "Which of your requests are static, and what share of traffic are they?",
        "How would you deploy a new version of your JavaScript bundle without users seeing a stale one?",
        "What is the origin for your CDN, and what happens when it is slow?",
        "When would a CDN not be worth it?",
      ],
    },
    quiz: [
      {
        question: "20,000 static requests per second go through a CDN that serves 90% from cache. What reaches the origin?",
        options: ["About 18,000 req/s", "About 2,000 req/s", "About 200 req/s", "Nothing"],
        answer: 1,
        explain: "10% are misses, so 20,000 x 0.1 = 2,000 req/s travel to Object Storage. The app servers see none of them.",
      },
      {
        question: "You deployed a new style.css but many users still see the old design. What is the cleanest fix for the future?",
        options: [
          "Turn off the CDN",
          "Lower the TTL to one second",
          "Put a content hash in the file name so every version has a new URL",
          "Serve CSS from the app servers",
        ],
        answer: 2,
        explain: "Versioned names mean a new file is a new URL that no edge has cached yet, while old files can still be cached for a long time.",
      },
    ],
  },

  "flash-sale": {
    minutes: 7,
    overview:
      "Traffic is rarely flat. A sale, a push notification or a viral post can multiply load within seconds. This page teaches you to size for the peak, use cheap layers to absorb spikes, and degrade gracefully when even that is not enough.",
    problem:
      "A sneaker brand announces a limited drop at noon. At 11:59 traffic is normal. At 12:00 hundreds of thousands of fans refresh the product page, load its images and try to buy. A system sized for the average day collapses in the first minute, and the brand trends online for the wrong reason.",
    sections: [
      {
        icon: "trending-up",
        heading: "Average versus peak",
        paragraphs: [
          "Average load tells you what a normal day costs. Peak load tells you whether you survive. The peak-to-average ratio is how many times busier the worst moment is than a typical one.",
          "Always size for the peak, with headroom so peak utilisation stays around 60-70%. A design that runs perfectly at average and falls over at the peak still has an outage, and outages happen exactly when the most users are watching.",
        ],
      },
      {
        icon: "layers",
        heading: "Let cheap layers take the hit",
        paragraphs: [
          "Think of your system as a funnel. Each layer answers part of the traffic and passes on less to the expensive layers behind it.",
          "Caches and CDNs handle far more traffic per credit than app servers, and app servers far more than databases. So the cheapest way to survive a spike is to make sure most of it never reaches the database.",
        ],
        bullets: [
          "CDN: absorbs about 90% of static files before they reach you.",
          "Load balancer and app tier: handle every dynamic request, so size them for the full peak.",
          "Cache: answers about 80% of reads before they reach the database.",
          "Database: sees only cache misses plus all writes. Writes cannot be cached away.",
        ],
      },
      {
        icon: "clock",
        heading: "Autoscaling is too slow for a cliff",
        paragraphs: [
          "Autoscaling adds servers automatically when load rises. It is great for slow daily curves, but it reacts in minutes: it must notice the load, start a machine, boot it and pass health checks.",
          "A flash sale goes from calm to peak in seconds. If you know the event is coming, pre-scale: add capacity before it starts, then remove it afterwards.",
        ],
      },
      {
        icon: "shield",
        heading: "When it is still too much",
        paragraphs: [
          "Sometimes serving everyone is not worth the cost. Graceful degradation means failing in a controlled way instead of crashing for everyone.",
        ],
        bullets: [
          "A virtual waiting room lets users in at a rate the system can handle.",
          "Load shedding rejects excess requests fast with a 'try again' page, which is cheaper than slow timeouts.",
          "Turn off non-essential features (recommendations, reviews) during the peak.",
          "Watch for hot spots: everyone buying one product means many writes to one inventory row.",
        ],
      },
    ],
    diagrams: [
      {
        title: "A spike-ready funnel",
        nodes: ["client", "cdn", "blob"],
        caption: "Static files from the spike are absorbed at the edge. Object Storage only sees a small share of misses.",
        steps: [
          "At noon, hundreds of thousands of fans refresh the sneaker page at once and load its images.",
          "Absorbs the burst at the edge, serving about 90% of images and scripts and handling up to 100,000 requests per second.",
          "Only receives the small share of misses, so the spike never reaches it at full size.",
        ],
      },
      {
        title: "Dynamic path with a cache",
        nodes: ["client", "lb", "app", "cache", "sqldb"],
        caption: "The app tier is sized for the full peak of dynamic requests, and the cache keeps most reads away from the database.",
        steps: [
          "A fan refreshes the drop page for stock and taps buy the second the sneakers go live.",
          "Spreads the peak across every app server and stays far below its own limit of 20,000 requests per second.",
          "Sized for the peak, not the average day, so enough instances at ~1,000 requests per second each are already running.",
          "Answers about 80% of the repeated stock and product reads in ~1 ms, keeping them off the database.",
          "Handles the remaining reads and the purchases, where each order write costs 4 units of its capacity.",
        ],
      },
    ],
    numbers: [
      { value: "~60-70%", label: "target utilisation at the peak" },
      { value: "minutes", label: "how long autoscaling takes to add capacity" },
      { value: "~80% / ~90%", label: "reads absorbed by a cache / static files by a CDN in the simulator" },
    ],
    compare: {
      headers: ["Autoscaling", "Pre-scaling"],
      rows: [
        ["Trigger", "Measured load crosses a threshold", "You add capacity before a known event"],
        ["Reaction time", "Minutes", "Already in place when traffic arrives"],
        ["Best for", "Gradual daily or weekly curves", "Launches, sales, scheduled broadcasts"],
        ["Risk", "Too late for a sudden spike", "Paying for capacity you may not use"],
      ],
    },
    realWorld: [
      {
        company: "Ticketmaster",
        text: "The 2022 presale for Taylor Swift's Eras Tour drew far more traffic than Ticketmaster had planned for. Queues stalled and the sale was disrupted, a widely reported example of a flash crowd beating capacity planning.",
      },
      {
        company: "Alibaba",
        text: "Alibaba prepares for its Singles' Day shopping festival with months of capacity planning and large-scale stress tests that replay simulated peak traffic through the full production system before the day.",
      },
    ],
    mistakes: [
      "Sizing the system for average traffic and hoping autoscaling will cover the peak.",
      "Adding a cache but forgetting that the app tier still sees every dynamic request at peak.",
      "Forgetting that writes (orders, inventory updates) still all reach the database during the spike.",
    ],
    interview: {
      tip: "State both the average and the peak, then walk the funnel: how much traffic each layer absorbs and what reaches the database at peak.",
      questions: [
        "What is the peak-to-average ratio, and how did you size for it?",
        "How much of the spike reaches your database?",
        "Why not rely on autoscaling for this event?",
        "If demand is ten times your capacity, how do you fail gracefully?",
      ],
    },
    quiz: [
      {
        question: "During a spike, 10,000 reads and 400 writes per second arrive. A cache answers 80% of reads. What load (in units) reaches a SQL database where writes cost 4?",
        options: ["2,400 units/s", "3,600 units/s", "10,400 units/s", "2,000 units/s"],
        answer: 1,
        explain: "Reads that miss: 10,000 x 0.2 = 2,000 units. Writes are not cached: 400 x 4 = 1,600 units. Total 3,600, which is over a 3,000-unit database. Writes matter.",
      },
      {
        question: "A product launch is scheduled for 9:00. Traffic will jump fivefold within seconds. What is the best plan?",
        options: [
          "Rely on autoscaling to react",
          "Pre-scale before 9:00 and keep caches warm",
          "Restart all servers at 8:59 to clear memory",
          "Size for the average and accept errors",
        ],
        answer: 1,
        explain: "Autoscaling reacts in minutes, too slow for a cliff. Known events should be pre-scaled, and warm caches avoid a flood of misses at the start.",
      },
    ],
  },

  "read-replicas": {
    minutes: 7,
    overview:
      "A read replica is a copy of your database that serves reads, so reads stop competing with writes on the primary. This page explains how replication works, why replicas can return slightly old data, and how to route queries so users still see their own changes.",
    problem:
      "A social app shows feeds, profiles and comments. Even with a cache in front, the cache misses alone keep the primary database busy, and every new post adds expensive write work on top. Queries start to slow down, and posting gets slower too, because reads and writes are fighting over the same machine.",
    sections: [
      {
        icon: "database",
        heading: "Reads and writes compete on one machine",
        paragraphs: [
          "The primary database is the one machine that accepts writes and holds the authoritative copy of the data. Most apps are read-heavy: many more reads than writes. Yet both share the same CPU, memory and disk.",
          "In the simulator the primary has 3,000 units per second, reads cost 1 and writes cost 4. With 400 writes per second, writes alone use 1,600 units, leaving only 1,400 for reads.",
        ],
      },
      {
        icon: "repeat",
        heading: "How replication works",
        paragraphs: [
          "Every database keeps a log of changes it applies (PostgreSQL's write-ahead log, MySQL's binlog). A replica connects to the primary, receives that log as a stream and replays every change, so it holds a near-identical copy.",
        ],
        bullets: [
          "The app sends a write to the primary, which commits it and appends it to its log.",
          "The primary streams the log entry to each replica.",
          "Each replica replays the change on its own copy.",
          "The app sends read-only queries to replicas, spreading reads across them.",
        ],
      },
      {
        icon: "clock",
        heading: "Replication lag and read-your-own-writes",
        paragraphs: [
          "Replication is usually asynchronous: the primary confirms the write without waiting for replicas. The delay before a replica catches up is replication lag. It is often well under a second, but can grow to seconds or more when the primary is busy.",
          "Lag causes a classic bug: a user edits their profile, the page reloads from a replica that has not caught up, and their change seems to vanish. The fix is read-your-own-writes: send a user's reads to the primary for a short time after they write, or for data they just changed.",
        ],
      },
      {
        icon: "alert",
        heading: "What replicas do not fix",
        paragraphs: [
          "Replicas multiply read capacity only. Every write still goes to the one primary, and every replica must replay every write too, so replicas never add write capacity.",
          "Replicas stack well with a cache: the cache absorbs hot reads, and its misses go to a replica instead of the primary. That keeps the primary free for writes.",
        ],
        bullets: [
          "Do not send writes to a replica; it is read-only and will reject them.",
          "Watch lag; a replica far behind is serving stale data.",
          "Each extra replica adds a little work on the primary to stream its log.",
        ],
      },
    ],
    diagrams: [
      {
        title: "Reads to replicas, writes to the primary",
        nodes: ["client", "lb", "app", "cache", "replica"],
        caption: "Reads try the cache, and misses go to a read replica. Writes take a separate link from the app servers to the primary SQL database, which streams changes to the replica.",
        steps: [
          "A user scrolls their feed and opens profiles and comments in the social app.",
          "Spreads feed and profile requests across the app servers.",
          "Sends reads toward the cache and replica, and sends new posts and comments over a separate link to the primary.",
          "Answers about 80% of feed and profile reads from memory; only misses go on to the replica.",
          "A read-only copy that serves up to 3,000 reads per second, so misses stop competing with writes on the primary.",
        ],
      },
    ],
    numbers: [
      { value: "3,000 reads/s", label: "one read replica in the simulator" },
      { value: "4 units", label: "cost of one write on the primary" },
      { value: "< 1 s", label: "typical replication lag on a healthy system" },
      { value: "0", label: "write capacity a replica adds" },
    ],
    compare: {
      headers: ["Asynchronous replication", "Synchronous replication"],
      rows: [
        ["When the write is confirmed", "As soon as the primary commits", "After a replica also has it"],
        ["Write latency", "Lower", "Higher, waits for a network round trip"],
        ["Data on the replica", "May lag behind", "Always up to date"],
        ["If the primary dies", "Recent writes may be lost", "No confirmed write is lost"],
        ["Typical use", "Read replicas for scaling reads", "Standbys for failover"],
      ],
    },
    realWorld: [
      {
        company: "Wikipedia",
        text: "MediaWiki, the software behind Wikipedia, sends writes to a primary MySQL/MariaDB server and spreads reads across many replicas. Its database layer checks replica lag and avoids replicas that have fallen too far behind.",
      },
      {
        company: "Amazon Aurora",
        text: "Amazon's Aurora database lets you add many read replicas that share the same underlying storage, so a new replica can start serving reads without copying the whole dataset first.",
      },
    ],
    mistakes: [
      "Adding replicas to fix a write bottleneck. They only help reads.",
      "Reading a user's own data from a lagging replica right after they changed it.",
      "Removing the link from the app to the primary, so writes have nowhere to go.",
    ],
    interview: {
      tip: "When you add replicas, mention replication lag and read-your-own-writes in the same breath. It shows you know the catch, not just the trick.",
      questions: [
        "How do you route reads and writes between the primary and replicas?",
        "A user edits a post and it disappears on refresh. What happened, and how do you fix it?",
        "Your write traffic doubles. Do more replicas help?",
        "How do you monitor replication lag, and what do you do when it grows?",
      ],
    },
    quiz: [
      {
        question: "The primary is at 100%, mostly from writes. What helps most?",
        options: ["Adding read replicas", "Adding app servers", "Reducing write cost or splitting the data across more primaries", "Lowering the cache TTL"],
        answer: 2,
        explain: "Every replica must replay every write, and all writes still land on the one primary. Replicas cannot relieve a write bottleneck.",
      },
      {
        question: "A user updates their name and the profile page still shows the old one for a second. Why?",
        options: [
          "The cache hit ratio is too low",
          "The read went to a replica that had not caught up yet",
          "The write was rejected",
          "The load balancer sent the request to the wrong app server",
        ],
        answer: 1,
        explain: "Asynchronous replication means replicas lag a little. Reads of data the user just changed should go to the primary.",
      },
    ],
  },

  failover: {
    minutes: 7,
    overview:
      "Replicas keep reads alive, but writes need a working primary. This page explains how a hot standby takes over when the primary dies, the difference between losing data and losing availability, and the dangerous split-brain problem.",
    problem:
      "An online store runs a primary database with a read replica. One afternoon the primary's disk fails. Product pages keep loading from the replica, so at first nobody notices. But every checkout fails: there is nowhere to write orders. For twenty minutes the store takes no money while an engineer manually promotes a new primary.",
    sections: [
      {
        icon: "database",
        heading: "Why the primary is special",
        paragraphs: [
          "In a primary-replica setup only the primary accepts writes. If it dies, reads may keep working from replicas, but every write fails. The primary is a single point of failure for writes.",
          "A hot standby is a second database server that receives every change from the primary and is ready to take its place within seconds. It is 'hot' because it is running and up to date, not a backup you restore from.",
        ],
      },
      {
        icon: "repeat",
        heading: "How automatic failover works",
        paragraphs: [
          "Failover is the act of switching from the failed primary to the standby. Done automatically, it looks like this:",
        ],
        bullets: [
          "A monitor sends heartbeats to the primary every second or so.",
          "After several missed heartbeats it declares the primary dead.",
          "It promotes the standby: the standby starts accepting writes.",
          "It redirects clients, by moving a virtual IP, updating DNS or reconfiguring a proxy.",
          "The old primary, if it comes back, must rejoin as a standby, never as a second primary.",
        ],
      },
      {
        icon: "shield",
        heading: "Durability versus availability",
        paragraphs: [
          "Durability means no confirmed data is lost. Availability means the system still accepts requests. Failover gives you availability; how the standby is fed decides durability.",
          "With synchronous replication the primary waits until the standby has each write before confirming it, so failover loses nothing, at the cost of slightly slower writes. With asynchronous replication, the last few writes may be lost.",
          "A standby adds no capacity on a normal day. In the simulator a SQL database's second instance is a standby: it does not double throughput, it keeps writes alive when the primary crashes.",
        ],
      },
      {
        icon: "alert",
        heading: "Split brain and other failover traps",
        paragraphs: [
          "Split brain happens when both nodes think they are primary, for example when a network problem cuts the monitor off from a healthy primary. Both accept writes, the data diverges, and merging it later is painful.",
        ],
        bullets: [
          "Use a consensus system or a third 'witness' vote so only a majority can promote a new primary.",
          "Fence the old primary: cut it off so it cannot accept writes after it is replaced.",
          "Failover takes seconds, so clients must retry writes with backoff, and retries must be safe to repeat (idempotent).",
          "Test failover regularly. One that has never run will fail when you need it.",
        ],
      },
    ],
    diagrams: [
      {
        title: "Primary with a hot standby",
        nodes: ["client", "lb", "app", "sqldb"],
        caption: "Writes go to the primary SQL database, which keeps a standby in sync. If the primary dies, the standby is promoted and writes continue.",
        steps: [
          "A shopper presses checkout, which must write a new order to the database.",
          "Sends the checkout request to a healthy app server.",
          "Writes the order to whichever database is currently the primary, and retries briefly if a failover is in progress.",
          "The primary saves the order and keeps a hot standby in sync; if it dies, the standby is promoted and checkouts resume.",
        ],
      },
      {
        title: "Reads stay on the replica path",
        nodes: ["client", "lb", "app", "cache", "replica"],
        caption: "Reads keep flowing through the cache to the read replica during the failover. Only writes depend on the primary.",
        steps: [
          "Another shopper keeps browsing product pages while the primary database is failing over.",
          "Keeps spreading these page views across the app servers as usual.",
          "Sends reads to the cache and replica, which do not depend on the primary being alive.",
          "Answers about 80% of product page reads from memory, even while the primary is down.",
          "Serves the remaining reads from its copy, so pages keep loading during the failover; only writes have to wait.",
        ],
      },
    ],
    numbers: [
      { value: "~seconds to a minute", label: "typical automatic failover time" },
      { value: "0", label: "extra capacity a standby adds on a normal day" },
      { value: "0 writes lost", label: "on failover with a synchronous standby" },
      { value: "~20 min+", label: "a manual promotion when nobody planned for it" },
    ],
    compare: {
      headers: ["Hot standby", "Read replica"],
      rows: [
        ["Purpose", "Take over writes if the primary dies", "Serve reads to add capacity"],
        ["Replication", "Usually synchronous", "Usually asynchronous"],
        ["Serves traffic normally", "No, it waits", "Yes, read-only queries"],
        ["Data lost on promotion", "None", "Possibly the last few writes"],
        ["Adds capacity", "No", "Read capacity only"],
      ],
    },
    realWorld: [
      {
        company: "GitHub",
        text: "GitHub uses an open-source tool called orchestrator to detect MySQL primary failures and promote replicas. Its public write-up of an October 2018 incident shows how a brief network partition triggered a cross-site failover and led to about a day of degraded service.",
      },
      {
        company: "Amazon RDS",
        text: "Amazon RDS Multi-AZ keeps a synchronous standby in a second availability zone. If the primary fails, RDS promotes the standby and points the database's DNS name at it, so apps reconnect without config changes.",
      },
    ],
    mistakes: [
      "Assuming a read replica protects writes. Without a standby or promotion plan, writes stop when the primary dies.",
      "Expecting the standby to add capacity. It is insurance, not extra throughput.",
      "Letting the old primary come back and accept writes, causing split brain.",
    ],
    interview: {
      tip: "Separate durability (no confirmed data lost) from availability (still accepting writes), and say which replication mode gives you each.",
      questions: [
        "What happens to writes in your design if the primary database dies?",
        "How does the system decide the primary is really dead and not just slow?",
        "How do you prevent split brain?",
        "Would you use synchronous or asynchronous replication for the standby, and why?",
      ],
    },
    quiz: [
      {
        question: "The primary database crashes. Reads keep working, but every write fails. What is missing?",
        options: ["A read replica", "A larger cache", "A standby that can be promoted to primary", "More app servers"],
        answer: 2,
        explain: "Replicas serve reads but cannot accept writes. A hot standby, promoted on failure, keeps writes available.",
      },
      {
        question: "You add a second instance as a hot standby. How much more write throughput do you get on a normal day?",
        options: ["Double", "About 50% more", "None", "It depends on the cache"],
        answer: 2,
        explain: "A standby only receives changes and waits. It buys availability during a failure, not capacity.",
      },
      {
        question: "During a network glitch both database nodes accept writes. What is this called?",
        options: ["Replication lag", "Split brain", "A thundering herd", "Failback"],
        answer: 1,
        explain: "Two primaries mean diverging data. Consensus or a witness, plus fencing the old primary, prevents it.",
      },
    ],
  },

  "shard-it": {
    minutes: 8,
    overview:
      "When writes outgrow one machine, the only way forward is to split the data across many machines. This page explains sharding, how to choose a shard key, the main ways to map keys to shards, and what you give up in return.",
    problem:
      "An analytics service records every click from thousands of websites. Writes far outnumber reads, and one SQL primary can only commit so many writes per second. Bigger hardware buys a few months. Replicas do not help at all, because every one of them must replay every write. The data has to be split.",
    sections: [
      {
        icon: "alert",
        heading: "The write ceiling",
        paragraphs: [
          "A single primary handles all writes. Caches absorb reads, replicas absorb reads, but nothing so far reduces the write load on that one machine.",
          "In the simulator a SQL database has 3,000 units per second and each write costs 4, so it tops out around 750 writes per second no matter how many replicas you add.",
        ],
      },
      {
        icon: "split",
        heading: "How sharding works",
        paragraphs: [
          "Sharding (also called horizontal partitioning) splits one big dataset into pieces called shards. Each shard is stored on its own machine and owns a slice of the data. Each shard handles only its slice of the writes, so write capacity grows with every shard you add.",
        ],
        bullets: [
          "Choose a shard key, a field present on every record, like user_id or site_id.",
          "For each request, compute which shard owns that key.",
          "Send the read or write only to that shard.",
          "Many NoSQL stores (like DynamoDB or Cassandra) do this routing for you.",
        ],
      },
      {
        icon: "map-pin",
        heading: "Choosing a shard key",
        paragraphs: [
          "A good shard key spreads load evenly and keeps the data a request needs on one shard. Sharding an analytics service by site_id keeps one site's events together, and sharding a social app by user_id keeps one user's data together.",
          "A bad key creates a hot shard: one shard gets far more traffic than the others and becomes the new bottleneck. Sharding by date sends all of today's writes to one shard; sharding by country puts most traffic on a few large countries.",
          "Very popular keys (a celebrity account) can overload a shard even with a good key. A common fix is to add a random suffix to that key and spread it over several shards.",
        ],
      },
      {
        icon: "network",
        heading: "Mapping keys to shards, and the price you pay",
        paragraphs: [
          "Plain hashing (hash(key) mod N) spreads keys evenly, but changing N moves almost every key. Consistent hashing places shards and keys on a ring, so adding a shard moves only the keys next to it.",
          "Many systems also create many small logical shards up front and map them to fewer physical machines. Growing then means moving whole logical shards, not re-splitting data.",
        ],
        bullets: [
          "Joins across shards are slow or impossible; you design data so one request hits one shard.",
          "Transactions across shards are hard; keep related records under the same key.",
          "Resharding live data is painful, so estimate growth before choosing the shard count.",
        ],
      },
    ],
    diagrams: [
      {
        title: "Sharded write path",
        nodes: ["client", "lb", "app", "cache", "nosql"],
        caption: "App servers route each request by its key to the shard that owns it. Each shard handles only its slice, so adding shards adds write capacity. The cache still absorbs repeated reads.",
        steps: [
          "A website reports a visitor's click to the analytics service, one of a constant stream of writes.",
          "Spreads the stream of click events across the app servers.",
          "Looks at the request's key, such as the site id, and sends it to the one shard that owns that key.",
          "Absorbs repeated dashboard reads from memory, about 80% of them, so the shards can spend their capacity on writes.",
          "Each shard stores only its slice of clicks at about 4,000 per second, so adding shards adds write capacity.",
        ],
      },
    ],
    numbers: [
      { value: "~750 writes/s", label: "ceiling of one SQL primary in the simulator (3,000 units / 4)" },
      { value: "4,000/s", label: "one Sharded NoSQL shard in the simulator" },
      { value: "1 unit", label: "cost of a write in Sharded NoSQL" },
    ],
    compare: {
      headers: ["Range sharding", "Hash sharding"],
      rows: [
        ["How keys are assigned", "By key ranges, like A-F, G-M", "By a hash of the key"],
        ["Range queries", "Easy, neighbours live together", "Hard, neighbours are scattered"],
        ["Load balance", "Risk of hot ranges (today's dates)", "Even for most keys"],
        ["Adding shards", "Split a busy range", "Needs consistent hashing to avoid mass moves"],
        ["Typical use", "Time series, ordered scans", "User data, key-value lookups"],
      ],
    },
    realWorld: [
      {
        company: "Instagram",
        text: "Instagram sharded PostgreSQL into thousands of logical shards mapped onto fewer physical servers. Their 'Sharding & IDs at Instagram' post explains how each ID embeds its shard, so any server can route a request without a lookup.",
      },
      {
        company: "Amazon DynamoDB",
        text: "DynamoDB splits each table into partitions by the partition key you choose. AWS documentation warns that keys with uneven access create hot partitions, and recommends high-cardinality keys that spread traffic evenly.",
      },
    ],
    mistakes: [
      "Adding read replicas to fix a write bottleneck instead of splitting the data.",
      "Picking a shard key like date or country that sends most traffic to one shard.",
      "Designing queries that must visit every shard for common requests.",
    ],
    interview: {
      tip: "Name your shard key and explain why it spreads load and keeps one request on one shard. 'Shard by user_id because every query is per user' beats 'we will shard it'.",
      questions: [
        "What is your shard key, and why does it avoid hot spots?",
        "How do you handle a query that needs data from many shards?",
        "How would you add shards later without moving all the data?",
        "What do you do about one extremely popular key?",
      ],
    },
    quiz: [
      {
        question: "A SQL primary is overloaded by writes. You add three read replicas. What happens to write capacity?",
        options: ["It quadruples", "It stays the same", "It doubles", "It drops to zero"],
        answer: 1,
        explain: "All writes still go to the one primary, and every replica replays every write. Only sharding adds write capacity.",
      },
      {
        question: "You shard an event log by event date. What problem will you most likely see?",
        options: [
          "Joins become faster",
          "All of today's writes land on one hot shard",
          "Reads stop working",
          "Shards become too small",
        ],
        answer: 1,
        explain: "With a date key, every new event belongs to the same range, so one shard takes all the writes while the rest sit idle.",
      },
      {
        question: "Why do many systems use consistent hashing instead of hash(key) mod N?",
        options: [
          "It is faster to compute",
          "It makes range queries possible",
          "Adding a shard moves only a small share of keys",
          "It removes the need for a shard key",
        ],
        answer: 2,
        explain: "With mod N, changing N remaps almost every key. On a consistent hashing ring, a new shard only takes keys from its neighbours.",
      },
    ],
  },
};
