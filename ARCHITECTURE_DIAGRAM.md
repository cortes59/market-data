# 📊 Market Data Platform - Target Architecture

> **Version:** 2.0  
> **Last Updated:** 2026-01-22  
> **Status:** Aspirational — see "Current Implementation Status" below for what's deployed today

---

## Target Scalable Architecture

```mermaid
flowchart TB
    subgraph External["🌐 External Data Sources"]
        CG["CoinGecko API<br/>(Rate Limited: 10-30 req/min)"]
    end

    subgraph LB["⚖️ Load Balancer Layer"]
        ALB["Application Load Balancer<br/>(nginx / AWS ALB)"]
        SSELB["SSE Sticky Session LB<br/>(Connection Affinity)"]
    end

    subgraph Workers["🔄 Ingestion Worker Pool"]
        W1["Worker Node 1<br/>IngestionService"]
        W2["Worker Node 2<br/>IngestionService"]
        WN["Worker Node N<br/>(Horizontal Scale)"]
    end

    subgraph EventBus["📡 Event Bus Layer"]
        EE2["EventEmitter2<br/>(In-Process Events)"]
        REDIS_PS["Redis Pub/Sub<br/>(Cross-Process Events)"]
    end

    subgraph Cache["⚡ Caching Layer"]
        REDIS_C["Redis Cache<br/>(Hot Price Data)"]
    end

    subgraph Persistence["💾 Persistence Layer"]
        PG[("PostgreSQL<br/>Drizzle ORM")]
        PG_R[("PostgreSQL<br/>Read Replica")]
    end

    subgraph API["🚀 API Gateway Layer"]
        API1["NestJS API Node 1<br/>(REST + SSE)"]
        API2["NestJS API Node 2<br/>(REST + SSE)"]
        APIN["API Node N<br/>(Horizontal Scale)"]
    end

    subgraph SSE["📤 SSE Delivery Layer"]
        SSE1["RealtimeController<br/>Connection Pool 1"]
        SSE2["RealtimeController<br/>Connection Pool 2"]
        SSEN["Connection Pool N"]
    end

    subgraph Frontend["🖥️ Frontend Clients"]
        direction TB
        RC["React Client<br/>(Vite + TanStack Query)"]
        ZS["Zustand Store<br/>(Client State)"]
    end

    %% External to Workers
    CG --> |"HTTP GET<br/>@Interval(30s)"| W1
    CG --> |"Batched Request"| W2
    CG --> |"Circuit Breaker"| WN

    %% Workers to Event Bus
    W1 --> |"market.price_update"| EE2
    W2 --> |"Publish"| REDIS_PS
    WN --> |"Events"| REDIS_PS

    %% Workers to Persistence
    W1 --> |"INSERT market_data"| PG
    W2 --> |"Drizzle ORM"| PG
    WN --> |"Write"| PG

    %% Event Bus Distribution
    EE2 --> |"Subscribe"| SSE1
    REDIS_PS --> |"Subscribe"| SSE1
    REDIS_PS --> |"Subscribe"| SSE2
    REDIS_PS --> |"Broadcast"| SSEN

    %% Cache Layer
    REDIS_C --> |"Cache Read"| API1
    REDIS_C --> |"Cache Read"| API2
    PG --> |"Cache Miss"| REDIS_C

    %% Persistence Replication
    PG --> |"Replication"| PG_R

    %% API Layer
    ALB --> API1
    ALB --> API2
    ALB --> APIN
    API1 --> |"Query Latest"| PG_R
    API2 --> |"Query Latest"| PG_R
    APIN --> |"Read"| REDIS_C

    %% SSE Layer
    SSELB --> |"Sticky Session"| SSE1
    SSELB --> |"Sticky Session"| SSE2
    SSELB --> |"Affinity"| SSEN
    API1 -.-> SSE1
    API2 -.-> SSE2
    APIN -.-> SSEN

    %% Frontend Hybrid Flow
    RC --> |"1️⃣ REST: GET /api/prices<br/>(Initial Hydration)"| ALB
    RC --> |"2️⃣ SSE: /realtime/prices<br/>(Live Updates)"| SSELB
    SSE1 --> |"EventSource<br/>price_update events"| RC
    SSE2 --> |"Server-Sent Events"| RC
    RC --> |"Zustand Actions"| ZS

    %% Styling
    classDef external fill:#e1f5fe,stroke:#01579b
    classDef worker fill:#fff3e0,stroke:#e65100
    classDef cache fill:#fce4ec,stroke:#880e4f
    classDef db fill:#e8f5e9,stroke:#1b5e20
    classDef api fill:#f3e5f5,stroke:#4a148c
    classDef frontend fill:#e8eaf6,stroke:#1a237e
    classDef event fill:#fff8e1,stroke:#ff6f00

    class CG external
    class W1,W2,WN worker
    class REDIS_C,REDIS_PS cache
    class PG,PG_R db
    class API1,API2,APIN,SSE1,SSE2,SSEN api
    class RC,ZS frontend
    class EE2 event
```

---

## 🔄 Data Flow - Technical Explanation

### Phase 1: Data Ingestion (Pull Model)

```
CoinGecko API ──[@Interval(30s)]──► IngestionService ──► PostgreSQL
                                          │
                                          └──► EventEmitter2.emit('market.price_update')
```

**Architecture Decision:** We use a **pull-based polling model** rather than WebSocket push because:
1. CoinGecko's free tier only provides REST endpoints (no WebSocket)
2. 30-second intervals respect rate limits while maintaining data freshness
3. Circuit breaker pattern (5 consecutive failures) prevents cascade failures
4. Exponential backoff on rate limits (429) preserves API access

**Resilience Features:**
- `consecutiveFailures` counter triggers circuit breaker
- `backoffMultiplier` implements exponential delay (1, 2, 4, 8... intervals)
- Graceful degradation: SSE continues serving cached data during outages

---

### Phase 2: Event Distribution (Internal Pub/Sub)

```
IngestionService ──► EventEmitter2 ──► RealtimeController (same process)
        │
        └──► Redis Pub/Sub ──► All API Nodes (cross-process, scalable)
```

**Current Implementation:** `EventEmitter2` for single-node simplicity.

**Scalable Path:** When horizontally scaling API nodes, events must cross process boundaries. Redis Pub/Sub provides:
- O(1) message broadcasting to all subscribers
- No message persistence (fire-and-forget for real-time data)
- Decoupled worker and API node lifecycles

---

### Phase 3: SSE Delivery (Push to Clients)

```
RealtimeController ──► Observable<MessageEvent> ──► EventSource (Browser)
        │
        ├── concat(of(connectionEvent), priceStream$)
        └── RxJS: fromEvent ──► map ──► catchError ──► finalize
```

**Key Design Patterns:**
1. **Connection Tracking:** `activeConnections` counter for observability
2. **Initial Event:** Immediate `connection` event so clients don't wait 30s
3. **Graceful Cleanup:** `finalize()` operator decrements counter on disconnect
4. **Error Isolation:** `catchError` returns `EMPTY` to prevent stream termination

**Scalability Considerations:**
- SSE requires sticky sessions (client must reconnect to same node)
- Load balancer uses connection affinity (IP hash or cookie-based)
- Each node manages its own connection pool independently

---

### Phase 4: Frontend Hybrid Hydration

```
Page Load ──► REST: GET /api/prices ──► Zustand.hydratePricesWithHistory()
                                                    │
                                                    ▼
              SSE: /realtime/prices ──────────► Zustand.updatePrice()
```

**Why Hybrid?** Pure SSE would leave the UI blank until the first event arrives (up to 30s). The hybrid approach:

| Step | Action | Purpose |
|------|--------|---------|
| 1️⃣ | `useQuery({ queryKey: ['prices', 'initial'] })` | Immediate data from DB |
| 2️⃣ | `hydratePricesWithHistory(prices, history)` | Populate Zustand store |
| 3️⃣ | `useSSE('/realtime/prices')` | Subscribe to live updates |
| 4️⃣ | `updatePrice(event.data)` | Merge SSE events into store |

**State Management Strategy:**
- `isHydrated` flag prevents REST data from overwriting fresher SSE data
- Selector pattern (`selectPrice(symbol)`) isolates re-renders per symbol
- `useShallow` for array comparisons (sparkline history)

---

## 🏗️ Scalability Path (Future)

### Horizontal Scaling Matrix

| Component | Scale Strategy | Bottleneck Mitigation |
|-----------|---------------|----------------------|
| **Ingestion Workers** | Partition by symbol | Leader election for same symbols |
| **API Nodes** | Stateless, add more | Load balancer round-robin |
| **SSE Nodes** | Sticky sessions | Connection-aware LB |
| **PostgreSQL** | Read replicas | Write to primary, read from replicas |
| **Redis** | Cluster mode | Shard by key prefix |

### Production Checklist

- [ ] **Redis Pub/Sub** for cross-node event distribution
- [ ] **Redis Cache** for hot price data (TTL: 30s)
- [ ] **PostgreSQL Read Replicas** for REST API queries
- [ ] **Health Checks** on `/health` endpoint
- [ ] **Metrics** (Prometheus): `sse_active_connections`, `ingestion_latency_ms`
- [ ] **Distributed Tracing** (OpenTelemetry) for request flows

---

## 📁 Current Implementation Status

| Layer | Status | Technology |
|-------|--------|------------|
| Ingestion | ✅ Implemented | `@nestjs/schedule`, `CoinGeckoClient` |
| Persistence | ✅ Implemented | Drizzle ORM, PostgreSQL |
| Events | ✅ Implemented | EventEmitter2 (single-node) |
| SSE Delivery | ✅ Implemented | `RealtimeController`, RxJS |
| REST API | ✅ Implemented | `PricesController` |
| Frontend | ✅ Implemented | React, Zustand, TanStack Query |
| Redis Cache | 🔲 Planned | Redis, `ioredis` |
| Redis Pub/Sub | 🔲 Planned | Cross-node events |
| Load Balancer | 🔲 Planned | nginx / AWS ALB |

---

> **Note:** The diagram above represents the **target scalable architecture**, not the current deployment. Today's implementation is single-node: one NestJS process with EventEmitter2 for in-process events. Redis and load balancing are the primary upgrade path for horizontal scaling.

