# Viralix System Design — Architecture Diagrams

This document is the visual companion to [`SYSTEM_DESIGN_MILLION_USERS_PLAN.md`](./SYSTEM_DESIGN_MILLION_USERS_PLAN.md). All diagrams reflect the **current implemented architecture** (modular monolith + async workers + Kafka domain events).

---

## 1) System Context

Who interacts with Viralix and which external systems it depends on.

```mermaid
flowchart TB
    subgraph Users["Users & Clients"]
        U1[Creators / Marketers]
        U2[Admin / Support]
        U3[Mobile & Web Browsers]
    end

    subgraph Viralix["Viralix Platform"]
        V[Viralix SaaS]
    end

    subgraph Social["Social Platforms"]
        IG[Instagram / Meta]
        FB[Facebook]
        TT[TikTok]
        YT[YouTube]
    end

    subgraph Infra["Managed Services"]
        CL[Cloudinary Media]
        AI[Gemini AI]
        SMTP[Email SMTP]
    end

    U1 --> U3
    U2 --> U3
    U3 -->|HTTPS| V
    V <-->|OAuth + APIs| IG
    V <-->|OAuth + APIs| FB
    V <-->|OAuth + APIs| TT
    V <-->|OAuth + APIs| YT
    V --> CL
    V --> AI
    V --> SMTP
    IG -->|Webhooks| V
    FB -->|Webhooks| V
```



---

## 2) Container Architecture (C4 Level 2)

Major deployable units and how they connect.

```mermaid
flowchart TB
    subgraph Edge["Edge Layer"]
        CDN[CDN / Static Assets]
        WAF[WAF / TLS Termination]
    end

    subgraph Client["Client Tier"]
        FE[Next.js Frontend<br/>frontend/]
    end

    subgraph Compute["Compute Tier"]
        API[Express API<br/>server.js<br/>PROCESS_TYPE=api]
        WRK[Worker Process<br/>worker-process.js<br/>PROCESS_TYPE=worker]
    end

    subgraph Data["Data Tier"]
        MONGO[(MongoDB Primary<br/>OLTP)]
        MONGO_R[(MongoDB Read Replica<br/>optional)]
        REDIS[(Redis<br/>Queue + Cache + Rate Limit + Locks)]
        KAFKA[[Kafka / Redpanda<br/>Domain Events Stream]]
    end

    subgraph External["External Integrations"]
        PLAT[Social Platform APIs]
        MEDIA[Cloudinary]
        GEMINI[Gemini AI]
    end

    subgraph Ops["Observability"]
        PROM[Prometheus /metrics]
        LOGS[Structured JSON Logs]
        OTEL[OpenTelemetry OTLP<br/>optional]
    end

    FE -->|REST + JWT| WAF
    WAF --> API
    CDN --> FE

    API --> MONGO
    API --> MONGO_R
    API --> REDIS
    API --> KAFKA
    API --> PLAT
    API --> MEDIA
    API --> GEMINI

    WRK --> MONGO
    WRK --> REDIS
    WRK --> KAFKA
    WRK --> PLAT

    API --> PROM
    WRK --> PROM
    API --> LOGS
    WRK --> LOGS
    API -.-> OTEL
    WRK -.-> OTEL
```



---

## 3) Deployment Topology

How processes scale in production (Heroku, Kubernetes, or Docker Compose).

```mermaid
flowchart LR
    subgraph LB["Load Balancer"]
        ALB[ALB / Heroku Router]
    end

    subgraph APIPool["API Pool — autoscaled"]
        API1[API Pod 1<br/>PROCESS_TYPE=api]
        API2[API Pod 2<br/>PROCESS_TYPE=api]
        APIN[API Pod N]
    end

    subgraph WorkerPool["Worker Pool — autoscaled"]
        W1[Worker 1<br/>publish + sync + analytics workers<br/>scheduler + kafka consumer]
        W2[Worker 2]
        WN[Worker N]
    end

    subgraph Shared["Shared Infrastructure"]
        R[(Redis)]
        M[(MongoDB Atlas)]
        K[[Kafka Cluster]]
    end

    ALB --> API1
    ALB --> API2
    ALB --> APIN

    API1 & API2 & APIN --> R
    API1 & API2 & APIN --> M
    API1 & API2 & APIN --> K

    W1 & W2 & WN --> R
    W1 & W2 & WN --> M
    W1 & W2 & WN --> K

    W1 -.->|scheduler lock<br/>only one leader| R
```



**Key split:** API handles HTTP only; workers handle Bull queues, cron scheduler (with distributed lock), and optional Kafka consumer.

---

## 4) Modular Monolith — Internal Structure

Domain modules inside the backend monolith and their seams for future extraction.

```mermaid
flowchart TB
    subgraph Frontend["frontend/"]
        APP[Next.js App Router]
        API_CLIENT[lib/api.js]
    end

    subgraph Backend["backend/ — Modular Monolith"]
        subgraph Gateway["HTTP Layer"]
            SERVER[server.js]
            ROUTES[routes/*]
            MW[middleware/<br/>auth · rateLimiter · trace · tenantQuota · requireRole]
        end

        subgraph Modules["modules/ — Extraction Seams"]
            PUB_MOD[publishing]
            ANA_MOD[analytics]
            SYNC_MOD[platformSync]
        end

        subgraph Services["services/"]
            QUEUE[queue/* workers]
            ANALYTICS_SVC[analytics/*]
            EVENTS[events/* + domainEvents]
            AUDIT[audit.service]
            SCHED[scheduler + schedulerLock]
        end

        subgraph Models["models/"]
            POST[Post · PublishJob · PublishDlqJob]
            ANALYTICS_M[AnalyticsOverviewSnapshot<br/>AnalyticsDailyRollup · AnalyticsRefreshJob]
            SYNC_M[PlatformSyncJob]
            EVENT_M[DomainEvent · AuditLog · WebhookEvent]
        end
    end

    APP --> API_CLIENT
    API_CLIENT --> SERVER
    SERVER --> MW --> ROUTES
    ROUTES --> Services
    Services --> Models

    PUB_MOD -.-> QUEUE
    ANA_MOD -.-> ANALYTICS_SVC
    SYNC_MOD -.-> SYNC_M
```



---

## 5) API Request Lifecycle

Path of an authenticated request through cross-cutting concerns.

```mermaid
sequenceDiagram
    autonumber
    participant C as Client
    participant CDN as CDN
    participant API as Express API
    participant TRACE as traceMiddleware
    participant RL as rateLimiter
    participant AUTH as auth JWT
    participant QUOTA as tenantQuota
    participant ROUTE as Route Handler
    participant CACHE as Redis Cache
    participant DB as MongoDB

    C->>CDN: GET static assets
    C->>API: API request + Authorization
    API->>TRACE: x-trace-id / traceparent
    TRACE-->>C: x-trace-id + traceparent
    API->>RL: check Redis rate bucket
    alt rate limited
        RL-->>C: 429 Too Many Requests
    end
    API->>AUTH: verify JWT
    API->>QUOTA: check per-tenant quota
    alt quota exceeded
        QUOTA-->>C: 429 + quota metadata
    end
    API->>ROUTE: business logic
  opt read-heavy endpoint
        ROUTE->>CACHE: cache-aside lookup
        alt cache miss
            ROUTE->>DB: query (read replica optional)
            ROUTE->>CACHE: set TTL
        end
    end
    ROUTE-->>C: JSON response + cache headers
```



---

## 6) Publishing Pipeline

End-to-end flow from publish request to platform APIs and domain events.

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant API as POST /api/posts/*
    participant QUOTA as tenantQuota
    participant ADM as queueAdmission
    participant Q as Bull publish queue
    participant W as publish.worker
    participant CB as circuitBreaker
    participant PLAT as Platform APIs
    participant M as MongoDB
    participant EVT as domainEvents
    participant K as Kafka

    U->>API: Publish request + idempotency-key
    API->>QUOTA: enforce publish quota
    API->>ADM: check queue depth limits
    API->>M: create PublishJob (idempotent)
    API->>Q: enqueue job + traceId
    API-->>U: 202 job accepted

    Q->>W: process job (withWorkerSpan)
    W->>M: load Post + User tokens
    loop each platform
        W->>CB: runWithCircuitBreaker
        CB->>PLAT: publish API call
        PLAT-->>CB: result / error
        CB-->>W: success or failure
    end
    W->>M: update PublishJob status
    alt all retries exhausted
        W->>M: PublishDlqJob (dead letter)
    end
    W->>EVT: emitDomainEvent
    EVT->>M: DomainEvent outbox insert
    EVT->>K: publish envelope to topic
    W->>M: AuditLog entry
```



---

## 7) Analytics Pipeline

Async refresh, materialization, rollups, and read paths.

```mermaid
flowchart TB
    subgraph Trigger["Triggers"]
        USER[POST /api/analytics/refresh]
        CRON[Manual / scheduled refresh]
    end

    subgraph Async["Async Processing"]
        ARQ[analytics-refresh queue]
        ARW[analyticsRefresh.worker]
        REFRESH[refreshAnalyticsForUser]
        MAT[materializeAnalyticsOverview]
    end

    subgraph Storage["Read Models"]
        SNAP[(AnalyticsOverviewSnapshot)]
        ROLLUP[(AnalyticsDailyRollup)]
        CACHE[(Redis overview cache)]
    end

    subgraph Reads["Read APIs"]
        OV[GET /api/analytics/overview]
        TR[GET /api/analytics/trends]
        PERF[GET /api/analytics/performance<br/>90d/1y uses rollups]
        DEEP[GET /api/analytics/deep/:platform]
    end

    subgraph Events["Events"]
        EVT[emitDomainEvent<br/>analytics.materialized]
        KAFKA[[Kafka topic]]
    end

    USER --> ARQ
    CRON --> ARQ
    ARQ --> ARW --> REFRESH --> MAT
    MAT --> SNAP
    MAT --> ROLLUP
    MAT --> CACHE
    MAT --> EVT --> KAFKA

    OV --> CACHE
    OV --> SNAP
    TR --> ROLLUP
    PERF --> ROLLUP
    DEEP --> MONGO[(MongoDB Posts + platform APIs)]
```



---

## 8) Platform Sync Pipeline

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant API as POST /api/platform-sync
    participant QUOTA as tenantQuota
    participant ADM as queueAdmission
    participant Q as platform-sync queue
    participant W as platformSync.worker
    participant SVC as platformSync.service
    participant PLAT as Platform API
    participant M as MongoDB
    participant EVT as domainEvents

    U->>API: sync request + idempotency-key
    API->>QUOTA: enforce sync quota
    API->>ADM: check queue depth
    API->>M: PlatformSyncJob (idempotent)
    API->>Q: enqueue + traceId
    API-->>U: jobId for polling

    Q->>W: process (withWorkerSpan)
    W->>SVC: executePlatformSync
    SVC->>PLAT: batched API calls
    PLAT-->>SVC: synced data
    SVC->>M: update posts / accounts
    W->>M: mark job completed
    W->>EVT: platform_sync.completed
    W->>M: AuditLog
```



---

## 9) Domain Events — Outbox + Kafka

Reliable event emission pattern (outbox-lite) with Kafka as the stream backbone.

```mermaid
flowchart LR
    subgraph Producers["Event Producers"]
        PW[publish.worker]
        SW[platformSync.worker]
        AS[overviewStore<br/>materialize]
    end

    subgraph Outbox["Transactional Outbox"]
        SVC[domainEvents.service]
        DE[(DomainEvent collection)]
    end

    subgraph Bus["Event Bus"]
        K[[Kafka / Redpanda<br/>viralix.domain-events]]
        R[Redis pub/sub<br/>optional]
    end

    subgraph Consumers["Consumers"]
        KC[kafkaDomainEventsConsumer<br/>worker process]
        FUTURE[Future: analytics ETL<br/>notifications · audit fan-out]
    end

    PW --> SVC
    SW --> SVC
    AS --> SVC
    SVC --> DE
    SVC --> K
    SVC -.-> R
    K --> KC
    K -.-> FUTURE
```



**Event envelope fields:** `eventId`, `eventType`, `userId`, `traceId`, `aggregateType`, `aggregateId`, `payload`, `version`.

**Partition key:** `userId` (per-tenant ordering within partition).

---

## 10) Queue Topology (Bull + Redis)

Partitioned job queues with admission control and DLQ.

```mermaid
flowchart TB
    subgraph API["API Layer"]
        P_ROUTE[posts routes]
        A_ROUTE[analytics routes]
        S_ROUTE[platform-sync routes]
    end

    subgraph Admission["Backpressure"]
        QA[queueAdmission<br/>waiting + delayed limits]
        TQ[tenantQuota]
    end

    subgraph Queues["Bull Queues on Redis"]
        PQ[social-publish]
        AQ[analytics-refresh]
        SQ[platform-sync]
    end

    subgraph Workers["Worker Concurrency Pools"]
        PW[publish.worker<br/>PUBLISH_WORKER_CONCURRENCY]
        AW[analyticsRefresh.worker<br/>ANALYTICS_REFRESH_WORKER_CONCURRENCY]
        SW[platformSync.worker<br/>PLATFORM_SYNC_WORKER_CONCURRENCY]
    end

    subgraph Reliability["Reliability"]
        DLQ[PublishDlqJob<br/>GET/POST /api/posts/dlq]
        CB[circuitBreaker per platform]
        IDEM[idempotency keys]
    end

    P_ROUTE --> TQ --> QA --> PQ --> PW
    A_ROUTE --> TQ --> QA --> AQ --> AW
    S_ROUTE --> TQ --> QA --> SQ --> SW

    PW --> CB
    PW --> DLQ
    P_ROUTE --> IDEM
    S_ROUTE --> IDEM
```



---

## 11) Scheduler — Distributed Singleton

Prevents duplicate scheduled-post execution across replicas.

```mermaid
sequenceDiagram
    autonumber
    participant CRON as node-cron (every minute)
    participant W1 as Worker Replica 1
    participant W2 as Worker Replica 2
    participant LOCK as Redis schedulerLock
    participant Q as publish queue
    participant M as MongoDB

    par Every minute on all workers
        W1->>CRON: tick
        W2->>CRON: tick
    end

    W1->>LOCK: acquire lock (SET NX + TTL)
    LOCK-->>W1: acquired
    W2->>LOCK: acquire lock
    LOCK-->>W2: miss — skip cycle

    W1->>M: find due scheduled posts
    W1->>Q: enqueue publish jobs
    W1->>LOCK: renew heartbeat
    W1->>LOCK: release on shutdown
```



---

## 12) Webhook Ingestion

Idempotent processing of Instagram/Facebook webhook events.

```mermaid
flowchart TB
    PLAT[Platform Webhook POST] --> API[webhook route handler]
    API --> CLAIM[webhookIdempotency.claimEvent]
    CLAIM --> REDIS[(Redis fast dedupe)]
    CLAIM --> WE[(WebhookEvent unique index)]
    CLAIM -->|duplicate| SKIP[skip processing — 200 OK]
    CLAIM -->|new event| PROC[process comment / message]
    PROC --> INBOX[update inbox / auto-reply rules]
```



---

## 13) Caching & Read Replica Strategy

```mermaid
flowchart TB
    subgraph Reads["Read Paths"]
        R1[/api/analytics/overview]
        R2[/api/platforms/connected]
        R3[/api/audit/logs]
        R4[/api/analytics/trends]
    end

    subgraph Cache["Redis Cache-Aside"]
        C1[overview cache<br/>ANALYTICS_OVERVIEW_CACHE_TTL_SEC]
        C2[accounts cache<br/>ACCOUNTS_CACHE_TTL_SEC]
    end

    subgraph DB["MongoDB"]
        PRIMARY[(Primary — writes)]
        REPLICA[(Read Replica<br/>MONGODB_READ_URI)]
    end

    R1 --> C1
    C1 -->|miss| REPLICA
    R1 -->|materialized| SNAP[(AnalyticsOverviewSnapshot)]

    R2 --> C2
    C2 -->|miss| PRIMARY

    R3 --> REPLICA
    R4 --> REPLICA
    R4 --> ROLLUP[(AnalyticsDailyRollup)]

    WRITE[All writes] --> PRIMARY
```



---

## 14) Data Storage Map

Primary collections and their roles (simplified).

```mermaid
erDiagram
    User ||--o{ Post : owns
    User ||--o{ PublishJob : triggers
    User ||--o{ PlatformSyncJob : triggers
    User ||--o{ AnalyticsRefreshJob : triggers
    User ||--o{ AnalyticsOverviewSnapshot : has
    User ||--o{ AnalyticsDailyRollup : has
    User ||--o{ DomainEvent : emits
    User ||--o{ AuditLog : actor

    Post ||--o{ PublishJob : publishes
    PublishJob ||--o| PublishDlqJob : may_dead_letter

    Post {
        ObjectId user
        array platforms
        object analytics
        date scheduledAt
    }

    PublishJob {
        string jobId
        string idempotencyKey
        string status
        string traceId
    }

    AnalyticsDailyRollup {
        string dateKey
        object metrics
        object platformBreakdown
    }

    DomainEvent {
        string eventId
        string eventType
        string aggregateType
        string status
    }
```



---

## 15) Observability Architecture

```mermaid
flowchart TB
    subgraph App["Application"]
        API[Express API]
        WRK[Workers]
    end

    subgraph Signals["Telemetry Signals"]
        LOGS[Structured JSON logs<br/>traceId in every line]
        METRICS[Prometheus metrics<br/>/api/metrics]
        TRACE[W3C traceparent + OTEL spans<br/>withWorkerSpan]
    end

    subgraph Backend_Ops["Ops Backend"]
        PROM[Prometheus scrape]
        GRAF[Grafana dashboards<br/>ops/monitoring/]
        ALERT[Alert rules<br/>P95 latency · queue failures]
        OTLP[OTLP collector<br/>optional]
    end

    API --> LOGS
    WRK --> LOGS
    API --> METRICS
    WRK --> METRICS
    API --> TRACE
    WRK --> TRACE

    METRICS --> PROM --> GRAF
    PROM --> ALERT
    TRACE -.-> OTLP
```



**Key metrics:** `viralix_http_request_duration_ms`, `viralix_queue_depth`, `viralix_queue_job_duration_ms`, `viralix_scheduler_lock_events_total`.

---

## 16) Security & Multi-Tenancy Boundaries

```mermaid
flowchart TB
    subgraph Edge_Sec["Edge Security"]
        TLS[TLS / HTTPS]
        HELMET[helmet middleware]
        CORS[CORS allowlist]
    end

    subgraph AuthZ["Authorization"]
        JWT[JWT auth middleware]
        RBAC[requireRole admin]
        TENANT[tenantQuota per userId]
    end

    subgraph Data_Sec["Data Protection"]
        ENC[Token encryption at rest]
        SECRETS[secrets adapter]
        AUDIT[AuditLog + DomainEvent trail]
    end

    subgraph Query_Guard["Tenant Isolation"]
        QF[Every query scoped by userId]
        IDEM[idempotency per user + resource]
    end

    REQ[Incoming Request] --> TLS --> HELMET --> CORS
    CORS --> JWT --> TENANT
    JWT --> QF
    JWT --> RBAC
    QF --> ENC
    RBAC --> AUDIT
```



---

## 17) Analytical Data Flow (Current + Future)

```mermaid
flowchart LR
    subgraph Now["Implemented Now"]
        MAT[materializeAnalyticsOverview]
        ROLLUP[(AnalyticsDailyRollup)]
        TRENDS[GET /api/analytics/trends]
        EXPORT[npm run export:rollups]
    end

    subgraph Later["Future — When Volume Demands"]
        ETL[Kafka consumer ETL]
        CH[(ClickHouse / BigQuery)]
        ADAPTER[trendsAdapter external backend]
    end

    MAT --> ROLLUP --> TRENDS
    ROLLUP --> EXPORT
    EXPORT -->|HTTP POST| CH
    ROLLUP -.->|change stream| ETL --> CH
    CH --> ADAPTER --> TRENDS
```



---

## 18) Evolution Path — Modular Monolith to Selective Services

Recommended extraction order when scale or team boundaries require it.

```mermaid
flowchart LR
    subgraph Today["Today — Modular Monolith"]
        MONO[Viralix Backend<br/>modules/publishing<br/>modules/analytics<br/>modules/platformSync]
    end

    subgraph Step1["Step 1 — Extract Publishing"]
        PUB_SVC[Publishing Service]
        MONO -->|highest churn| PUB_SVC
    end

    subgraph Step2["Step 2 — Extract Analytics"]
        ANA_SVC[Analytics Service]
        MONO -->|read-heavy| ANA_SVC
    end

    subgraph Step3["Step 3 — Shared Platform"]
        KAFKA[[Kafka Event Bus]]
        REDIS[(Redis)]
        MONGO[(MongoDB)]

        PUB_SVC --> KAFKA
        ANA_SVC --> KAFKA
        MONO --> KAFKA
    end

    PUB_SVC --> REDIS
    ANA_SVC --> MONGO
```



**Rule:** extract only after queues, cache, observability, and idempotency are mature — all of which are in place today.

---

## 19) Phase Rollout Map

What was built in each phase (implementation status).

```mermaid
flowchart LR
    P0["Phase 0<br/>Foundation"] --> P1["Phase 1<br/>Async Boundaries"]
    P1 --> P2["Phase 2<br/>Scale Operations"]
    P2 --> P3["Phase 3<br/>Read Models"]
    P3 --> P4["Phase 4<br/>Platform Maturity"]
    P4 --> FUTURE["Future<br/>Warehouse and Scale-out"]
```

| Phase | Status | Deliverables |
|-------|--------|--------------|
| **Phase 0 — Foundation** | Done | Redis rate limiting, scheduler distributed lock, structured logs, trace IDs, Prometheus metrics, alerts |
| **Phase 1 — Async Boundaries** | Done | Queue partitioning, async analytics refresh, async platform sync, idempotency keys, materialized analytics, cache-aside Redis |
| **Phase 2 — Scale Operations** | Done | Read replicas, per-tenant quotas, DLQ replay, circuit breaker, load and chaos drills, hot-path indexes |
| **Phase 3 — Advanced Read Models** | Done | Domain events outbox, daily rollups, trends API, module boundaries |
| **Phase 4 — Platform Maturity** | Done | OTEL tracing hooks, rollup export stub, Kafka domain events |
| **Future** | Planned | ClickHouse or BigQuery, full microservices, multi-region active-active |



---

## 20) Local Development Topology

Docker Compose services for local scale testing.

```mermaid
flowchart TB
    subgraph Dev["Developer Machine"]
        FE[npm run dev<br/>frontend :3000]
        API[node server.js<br/>:5000 PROCESS_TYPE=api]
        WRK[node worker-process.js<br/>PROCESS_TYPE=worker]
    end

    subgraph Compose["docker-compose.scale.yml"]
        REDIS[(redis :6379)]
        KAFKA[[redpanda :9092]]
    end

    subgraph External_Dev["External / Cloud"]
        MONGO[(MongoDB Atlas)]
        CLOUD[Cloudinary · Gemini · Social APIs]
    end

    FE --> API
    API --> REDIS
    API --> KAFKA
    API --> MONGO
    API --> CLOUD
    WRK --> REDIS
    WRK --> KAFKA
    WRK --> MONGO
    WRK --> CLOUD
```



**Start infra:**

```bash
docker compose -f backend/ops/deploy/docker-compose.scale.yml up -d redis kafka
```

---

## Diagram Index


| #   | Diagram                  | Purpose                               |
| --- | ------------------------ | ------------------------------------- |
| 1   | System Context           | External actors and dependencies      |
| 2   | Container Architecture   | Deployable units and data stores      |
| 3   | Deployment Topology      | API vs worker scaling                 |
| 4   | Modular Monolith         | Code structure and module seams       |
| 5   | API Request Lifecycle    | Middleware and cross-cutting concerns |
| 6   | Publishing Pipeline      | Publish queue end-to-end              |
| 7   | Analytics Pipeline       | Refresh, materialize, read paths      |
| 8   | Platform Sync Pipeline   | Async sync flow                       |
| 9   | Domain Events            | Outbox + Kafka pattern                |
| 10  | Queue Topology           | Bull queues, DLQ, backpressure        |
| 11  | Scheduler Lock           | Singleton cron across replicas        |
| 12  | Webhook Ingestion        | Idempotent webhook handling           |
| 13  | Caching & Read Replicas  | Cache-aside and read routing          |
| 14  | Data Storage Map         | Core MongoDB collections              |
| 15  | Observability            | Logs, metrics, traces                 |
| 16  | Security & Multi-Tenancy | Auth, quotas, isolation               |
| 17  | Analytical Data Flow     | Rollups now, warehouse later          |
| 18  | Evolution Path           | Monolith to selective services        |
| 19  | Phase Rollout Map        | Implementation timeline               |
| 20  | Local Development        | Docker Compose dev setup              |


---

## Related Documents

- [SYSTEM_DESIGN_MILLION_USERS_PLAN.md](./SYSTEM_DESIGN_MILLION_USERS_PLAN.md) — decisions, yes/no matrix, runbooks, env vars
- [backend/ops/monitoring/](./backend/ops/monitoring/) — Prometheus, Grafana, alerts
- [backend/ops/deploy/](./backend/ops/deploy/) — Docker, Kubernetes, Render manifests

