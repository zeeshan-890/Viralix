# Viralix System Design Plan for Millions of Users

This document is a practical system design blueprint for scaling Viralix to millions of users while keeping reliability, performance, and cost under control.

It answers:
- What your system looks like today
- What system design concepts/technologies apply
- Whether each should be used in Viralix (`Yes now`, `Yes later`, `No`)
- Why each choice makes sense
- A phased implementation plan

---

## 1) Current System Deep Analysis (As-Is)

## Product and traffic profile
- Viralix is a multi-tenant social media SaaS with heavy write workflows (create/schedule/publish), external API fan-out (Meta/TikTok/YouTube), analytics aggregation, inbox/reply automation, and media handling.
- Real bottlenecks are mostly integration latency, queue throughput, scheduler correctness under scale, and analytics computation cost.

## Current architecture snapshot
- **Frontend:** Next.js App Router client (`frontend`) with centralized API client.
- **Backend:** Node.js + Express monolith (`backend/server.js`) with many route modules.
- **Primary DB:** MongoDB (Mongoose models).
- **Queue:** Bull + Redis for publishing jobs.
- **Scheduler:** node-cron running in app process every minute.
- **External systems:** Facebook/Instagram/TikTok/YouTube APIs, Cloudinary, SMTP, Gemini AI.

## Strengths already present
- Async publish queue exists (good foundation).
- Domain separation by route/service/model is clear.
- Platform integrations are modularized.
- Token encryption at rest exists.
- Core indexes exist on several important collections.

## Primary scaling risks now
- In-memory rate limiting (not shared across instances).
- Synchronous fan-out in API request path (analytics/sync endpoints can block and time out).
- Potential N+1 integration calls in sync/refresh flows.
- Scheduler in app process can duplicate work in multi-replica deployments.
- Large media processing in request/worker memory can pressure instances.
- Limited observability (hard to enforce SLOs during scale).

---

## 2) Target Architecture (To-Be)

## High-level target
- Keep a **modular monolith + async workers** initially.
- Add **strong queue-driven async boundaries** around heavy operations.
- Introduce **shared cache**, **distributed rate limiting**, and **observability-first** operations.
- Move to selective service extraction only when domain throughput/team boundaries justify it.

## Recommended reference architecture
1. Edge + WAF + CDN
2. API layer (multiple stateless backend replicas)
3. Worker layer (publish/sync/analytics workers, separately autoscaled)
4. Redis (queue + cache + rate-limit store)
5. MongoDB (primary OLTP), optional read replicas
6. Object/media storage + CDN (Cloudinary or hybrid)
7. Observability stack (metrics, logs, traces, alerting)
8. Event bus/stream (later phase, only if needed)

---

## 3) System Design Concepts: Can We Use in Viralix or Not?

Legend:
- `Yes now` = high impact, implement in near term
- `Yes later` = useful but phase after core bottlenecks
- `No` = not appropriate for current product profile

## Core architecture patterns

| Concept | Use in Viralix? | Why Yes / Why Not | Where to apply |
|---|---|---|---|
| Modular Monolith | Yes now | Current codebase already fits this; fastest path with least migration risk | Keep backend as modular monolith while hardening internals |
| Microservices | Yes later | Adds complexity (ops, consistency, ownership); not needed before queues/cache/observability are mature | Extract only high-churn or high-throughput domains later (publishing/analytics) |
| Event-Driven Architecture | Yes now (partial), Yes later (full) | You already use queues; expand async events for sync/analytics refresh to remove request blocking | Publish, sync, analytics recompute, notification workflows |
| CQRS | Yes later (selective) | Useful for analytics/read-heavy dashboards, but adds complexity if done globally | Keep writes in Mongo; create read-optimized materialized views for dashboards |
| Saga pattern | Yes later | Useful when workflows span multiple systems with compensations | Multi-platform publish state transitions, subscription/billing side effects |

## Compute and deployment

| Concept | Use in Viralix? | Why Yes / Why Not | Where to apply |
|---|---|---|---|
| Stateless API replicas | Yes now | Horizontal scaling baseline | All Express API pods/instances |
| Dedicated worker pools | Yes now | Isolates heavy jobs from user API latency | Publish worker, sync worker, analytics worker |
| Auto-scaling | Yes now | Required for burst workloads | Separate policies for API and workers |
| Multi-region active-active | Yes later | High complexity; only after global scale and strict latency/SLA needs | Future enterprise/global expansion |
| Serverless for all backend | No | Long-running jobs + queues + stable connections suit containerized workers better | Keep serverless only for narrow edge functions if needed |

## Data and storage

| Concept | Use in Viralix? | Why Yes / Why Not | Where to apply |
|---|---|---|---|
| MongoDB primary OLTP | Yes now | Existing fit for document-heavy social content models | Posts, accounts, jobs, rules, inbox entities |
| Read replicas | Yes now | Offload heavy reads/analytics from primary | Dashboard reads, reporting endpoints |
| Sharding | Yes later | Needed when single-cluster write/read pressure grows | Shard by tenant/userId-oriented key strategy |
| Polyglot persistence (e.g., ClickHouse/BigQuery for analytics) | Yes later | Excellent for large analytical scans but unnecessary before query bottlenecks are proven | Historical analytics, cohort/trend queries |
| Raw event store | Yes later | High value for analytics replay/debugging, but more infra | Store engagement/sync events for downstream processing |

## Caching

| Concept | Use in Viralix? | Why Yes / Why Not | Where to apply |
|---|---|---|---|
| Redis cache-aside | Yes now | Big latency/cost reduction for repeated reads | Connected accounts, platform metadata, dashboard summaries |
| Materialized aggregates | Yes now | Avoid expensive on-demand fan-out aggregations | Overview analytics precompute tables/docs |
| CDN caching | Yes now | Static assets/media and public resources | Frontend assets + media delivery |
| Write-through cache everywhere | No | Overkill and consistency-heavy for mixed workload | Use targeted cache-aside only |

## Messaging and queues

| Concept | Use in Viralix? | Why Yes / Why Not | Where to apply |
|---|---|---|---|
| Bull/Redis queues | Yes now | Already present and effective | Continue for publish/sync/analytics jobs |
| Queue partitioning by job type | Yes now | Prevents one workload starving others | Separate queues: publish, sync, analytics-refresh, webhook-processing |
| Kafka/PubSub stream backbone | Yes later | Useful at very high event volume, but heavy ops overhead now | Cross-domain events, audit/event replay, downstream analytics |

## Consistency and reliability

| Concept | Use in Viralix? | Why Yes / Why Not | Where to apply |
|---|---|---|---|
| Idempotency keys | Yes now | Critical for retries and duplicate webhook/job safety | Publish triggers, webhook handlers, sync jobs |
| Distributed locks/leader election | Yes now | Prevent duplicate scheduler execution across replicas | Scheduler singleton behavior |
| Outbox pattern | Yes later | Improves reliability between DB state and emitted events | Publish state updates + event emission |
| Exactly-once delivery | No (practically) | Too expensive/complex; use at-least-once + idempotency | All queue/event processing |

## API and traffic governance

| Concept | Use in Viralix? | Why Yes / Why Not | Where to apply |
|---|---|---|---|
| API gateway | Yes later | Helpful for auth, quota, observability centralization at larger scale | Multi-client/public API phase |
| Distributed rate limiting (Redis-backed) | Yes now | Must replace per-instance memory limiter | Auth, AI, publish endpoints |
| Backpressure and admission control | Yes now | Protects system during spikes | Queue depth and worker concurrency guards |
| GraphQL federation | No (for now) | REST is sufficient; federation adds major complexity | Revisit only for many independent frontend domains |

## Observability and operations

| Concept | Use in Viralix? | Why Yes / Why Not | Where to apply |
|---|---|---|---|
| Structured logging | Yes now | Required for searchability and incident response | API, workers, platform integrations |
| Metrics + SLOs | Yes now | Needed to run reliable high-scale SaaS | P95 latency, error rate, queue lag, publish success |
| Distributed tracing | Yes now | Essential for external API fan-out debugging | Request -> queue -> worker -> platform API |
| Chaos engineering | Yes later | Valuable after baseline observability/reliability exists | Worker retries, platform outage drills |

## Security and compliance

| Concept | Use in Viralix? | Why Yes / Why Not | Where to apply |
|---|---|---|---|
| Secrets manager | Yes now | Avoid env sprawl and secret leakage | API keys, OAuth secrets, encryption keys |
| KMS-backed encryption | Yes later | Better key rotation and compliance posture | Token encryption key lifecycle |
| RBAC + audit logs | Yes now | Important for enterprise features and support auditing | Admin actions, account changes, publish actions |
| Zero-trust internal mTLS | Yes later | Useful with service sprawl; heavy for current monolith | Adopt if/when microservices expand |

---

## 4) Practical Technology Choices for Viralix

## Immediate practical stack (recommended)
- **Runtime/Compute:** Dockerized Node.js API + worker deployments on Kubernetes/ECS/Fly/Render equivalent that supports separate autoscaling.
- **Queue:** Keep Bull + Redis now; split by queue type and tune concurrency/retries.
- **Cache + Rate limit:** Redis for both cache and distributed rate limiting.
- **DB:** MongoDB Atlas with read replicas + tuned indexes.
- **Observability:** OpenTelemetry + Prometheus/Grafana + centralized logs (ELK/Loki/Datadog/Sentry).
- **API protection:** WAF/CDN + bot protection + per-tenant quotas.

## Later practical stack (when needed)
- **Analytical DB:** ClickHouse or BigQuery for long-range analytics/reporting.
- **Stream bus:** Kafka/Redpanda/PubSub for large event throughput.
- **Search:** OpenSearch/Elasticsearch for fast inbox/content search if Mongo queries become insufficient.

---

## 5) Domain-by-Domain Design

## A) Publishing pipeline
### Current
- Good queue-based async foundation.
### Gaps
- Job isolation, idempotency, and observability need strengthening.
### Design upgrades
1. Queue split: `publish-high`, `publish-normal`, `sync`, `analytics-refresh`.
2. Idempotency key on publish request (`userId + postId + platform + scheduledAt`).
3. Dead-letter queue and retry policies per platform class.
4. Circuit breaker per external platform API.
5. Per-tenant concurrency caps (prevent noisy-neighbor effects).

## B) Analytics
### Current
- Some endpoints perform synchronous refresh/fan-out and aggregation.
### Gaps
- Expensive request-time computation and external dependency coupling.
### Design upgrades
1. Move refresh to async jobs.
2. Materialize overview and deep aggregates periodically/event-driven.
3. Serve analytics from precomputed docs + short TTL cache.
4. Backfill pipeline for historical recompute.

## C) Platform sync
### Current
- Direct sync endpoints can become long-running under many accounts.
### Design upgrades
1. Trigger async sync jobs and return job id immediately.
2. Batch API calls and respect platform rate windows.
3. Store sync cursors/checkpoints.
4. Add per-platform backoff and jitter policies.

## D) Inbox and auto-reply
### Current
- Core CRUD exists; delivery path maturity varies.
### Design upgrades
1. Reliable outbound delivery worker.
2. At-least-once delivery + dedupe keys.
3. SLA metrics: message lag, send success, retry depth.

---

## 6) Multi-Tenancy and Data Isolation Strategy

- Keep tenant scope by `userId` in all entities.
- Enforce tenant guardrails in every query path.
- Add per-tenant quotas:
  - Scheduled posts/day
  - Publish throughput/min
  - AI requests/min
  - Sync jobs/hour
- For future enterprise:
  - Optional logical tenant partitioning (org/team id)
  - Strong audit logs and export controls

---

## 7) Capacity and SLO Planning

## Suggested SLOs (starting point)
- API availability: `99.9%`
- P95 API latency (read): `< 300 ms` (cached), `< 800 ms` (uncached)
- Publish job enqueue latency: `< 200 ms`
- Publish execution start delay (queue lag): `< 30 s` normal load
- Analytics dashboard load: `< 1.2 s` P95 from precomputed store
- Webhook processing ack: `< 1 s`

## Capacity signals to monitor
- Queue depth by type
- Worker utilization/concurrency saturation
- Mongo primary CPU/IOPS
- Redis memory/eviction rate
- External API error/429 rates by platform

---

## 8) Rollout Plan (Phased)

## Phase 0 (0-2 weeks): Foundation hardening
1. Replace in-memory rate limiter with Redis-backed limiter.
2. Add structured logs + trace ids across API and workers.
3. Add dashboards/alerts for queue lag, API P95, worker failures.
4. Ensure scheduler singleton (leader lock/distributed lock).

## Phase 1 (2-6 weeks): Remove synchronous bottlenecks
1. Convert analytics refresh + heavy sync calls to async jobs.
2. Add materialized analytics documents + cache layer.
3. Introduce idempotency keys for publish/sync/webhook operations.
4. Split queues and tune worker concurrency by job class.

## Phase 2 (6-12 weeks): Scale-ready operations
1. Read replicas + index optimization from real query telemetry.
2. Per-tenant quotas/backpressure policies.
3. DLQ/replay tooling and runbooks.
4. Chaos/load testing against realistic platform API failures.

## Phase 3 (12+ weeks): Selective advanced architecture
1. Evaluate analytical database for long-range reporting.
2. Introduce stream/event backbone if event volume justifies.
3. Extract services only where throughput/team boundaries demand.

---

## 9) What Not To Do Early

- Do not jump to microservices before fixing queues/cache/rate-limit/observability.
- Do not attempt exactly-once semantics globally; use idempotency and retries.
- Do not move everything to serverless for long-running publish/sync jobs.
- Do not add multiple databases prematurely without proven bottlenecks.

---

## 10) “Yes/No” Executive Summary

- **Must do now:** Redis-backed rate limit, async heavy flows, queue partitioning, idempotency, scheduler lock, observability.
- **Should do next:** materialized analytics, read replicas, per-tenant quotas/backpressure, DLQ/replay.
- **Do later only when required:** microservices, Kafka-scale streaming, polyglot analytics DB, multi-region active-active.
- **Avoid for now:** exactly-once guarantees, premature full service decomposition, global serverless migration.

---

## 11) Mapping to Existing Viralix Code Areas

- API composition: `backend/server.js`, `backend/routes/*`
- Queue + worker: `backend/services/queue/*`
- Scheduler: `backend/services/scheduler.js`
- Analytics heavy paths: `backend/routes/analytics.js`, `backend/services/analytics/platformDeepAnalytics.js`
- Sync heavy paths: `backend/routes/platform-sync.js`
- Rate limiting: `backend/middleware/rateLimiter.js`
- Frontend analytics + deep analytics consumers: `frontend/src/components/analytics/*`, `frontend/src/lib/api.js`

Use this mapping to execute each phase incrementally without a risky rewrite.

---

## 12) P0 Operations Runbook (Implemented)

### Environment variables
- `RATE_LIMIT_USE_REDIS=1` (default enabled; set `0` to force memory fallback)
- `SCHEDULER_LOCK_KEY=viralix:scheduler:lock` (optional override)
- `SCHEDULER_LOCK_TTL_MS=55000` (optional override)
- `SCHEDULER_LOCK_HEARTBEAT_MS=15000` (optional override)
- `METRICS_ENABLED=1` (default enabled; set `0` to disable `/api/metrics`)
- `ANALYTICS_REFRESH_QUEUE_WAITING_LIMIT=200` (reject refresh enqueue above this waiting depth)
- `ANALYTICS_REFRESH_QUEUE_DELAYED_LIMIT=200` (reject refresh enqueue above this delayed depth)
- `PLATFORM_SYNC_QUEUE_WAITING_LIMIT=120` (reject sync enqueue above this waiting depth)
- `PLATFORM_SYNC_QUEUE_DELAYED_LIMIT=120` (reject sync enqueue above this delayed depth)
- `PUBLISH_WORKER_CONCURRENCY=6` (publish worker pool size per process)
- `ANALYTICS_REFRESH_WORKER_CONCURRENCY=2` (analytics refresh worker pool size per process)
- `PLATFORM_SYNC_WORKER_CONCURRENCY=3` (platform sync worker pool size per process)
- `CACHE_ENABLED=1` (default enabled; set `0` to disable Redis cache-aside)
- `CACHE_DEFAULT_TTL_SEC=120` (default cache TTL for read endpoints)
- `ANALYTICS_OVERVIEW_CACHE_TTL_SEC=180` (overview cache TTL)
- `PUBLISH_QUEUE_WAITING_LIMIT=300` (reject publish enqueue above this waiting depth)
- `PUBLISH_QUEUE_DELAYED_LIMIT=300` (reject publish enqueue above this delayed depth)
- `ACCOUNTS_CACHE_TTL_SEC=300` (connected accounts cache TTL)
- `WEBHOOK_IDEMPOTENCY_TTL_SEC=86400` (webhook dedupe cache TTL)
- `MONGODB_READ_URI` (optional dedicated Mongo read replica connection string)
- `MONGODB_READ_PREFERENCE=secondaryPreferred` (optional query read preference)
- `PROCESS_TYPE=all|api|worker` (split API and worker runtime roles)
- `TENANT_QUOTA_PUBLISH_DAILY=200` (max publish requests per user per day)
- `TENANT_QUOTA_SYNC_HOURLY=24` (max sync requests per user per hour)
- `TENANT_QUOTA_ANALYTICS_REFRESH_HOURLY=12` (max analytics refresh requests per user per hour)
- `TENANT_QUOTA_AI_MINUTELY=20` (max AI requests per user per minute)
- `CIRCUIT_BREAKER_FAILURE_THRESHOLD=5` (open circuit after consecutive platform failures)
- `CIRCUIT_BREAKER_RESET_TIMEOUT_MS=60000` (circuit half-open retry delay)

### Health and metrics checks
- API health: `GET /api/health`
- Metrics scrape: `GET /api/metrics`
- Confirm key series:
  - `viralix_http_requests_total`
  - `viralix_http_request_duration_ms`
  - `viralix_scheduler_lock_events_total`
  - `viralix_queue_jobs_total`
  - `viralix_queue_depth`
  - `viralix_queue_job_duration_ms`

### SLO-focused alerts
- API p95 latency alert: `ViralixApiP95LatencyHigh` (>800ms over 10m)
- Queue failure ratio alert: `ViralixQueueFailureRatioHigh` (>10% over 10m)

### Scheduler lock verification
1. Run two backend replicas against the same Redis.
2. Observe logs for lock behavior:
   - One instance emits acquire/renew/release events.
   - Other instance logs lock miss/skip cycles.
3. Stop active scheduler instance and verify lock takeover on remaining instance.

### Rate limiting verification
1. Hit general API endpoint repeatedly from same client.
2. Confirm 429 is triggered at configured threshold.
3. Repeat against auth and AI routes to validate independent buckets.

### Trace propagation verification
1. Call publish endpoint with/without `x-trace-id`.
2. Confirm response includes `x-trace-id`.
3. Confirm publish enqueue payload includes trace ID.
4. Confirm worker structured logs include same trace ID.

### Queue backpressure verification
1. Temporarily reduce queue limits to a low value (for example `1`) in local env.
2. Trigger multiple analytics refresh/sync requests concurrently.
3. Confirm API begins returning `429` with queue counters once limits are crossed.
4. Restore production limits and verify requests enqueue normally again.

### Materialized analytics verification
1. Trigger analytics refresh (`POST /api/analytics/refresh`).
2. Poll job status until `completed`.
3. Call `GET /api/analytics/overview` and confirm `source` is `materialized` or `cache`.
4. Trigger another refresh and verify overview updates after completion.

### Audit log verification
1. Publish a post and confirm `publish.requested` and completion audit events are written.
2. Trigger platform sync and confirm `platform_sync.requested` and `platform_sync.completed` events.
3. Query `AuditLog` collection filtered by `actorId` and `traceId`.

### Webhook idempotency verification
1. Replay the same Instagram/Facebook webhook payload twice.
2. Confirm only the first delivery is processed (duplicate log message appears).
3. Verify `WebhookEvent` contains one record per `platform + eventId`.

### Connected accounts cache verification
1. Call `GET /api/platforms/connected` twice and confirm second response has `source: cache`.
2. Connect/disconnect an account and confirm cache invalidates (`source: live` on next read).

### Read replica verification
1. Set `MONGODB_READ_URI` to Atlas read replica SRV connection.
2. Restart API and confirm `/api/health` reports `readDb: connected`.
3. Hit read-heavy endpoints (`/api/analytics/overview`, `/api/audit/logs`) and verify normal responses.

### CDN cache header verification
1. Call `GET /api/analytics/overview` with auth and inspect `Cache-Control` + `Vary: Authorization`.
2. Build frontend and verify static assets return long-lived cache headers from `next.config.js`.

### Autoscaling / process split verification
1. Heroku: scale `web=2` and `worker=2` dynos using updated `Procfile`.
2. Kubernetes: apply manifests in `backend/ops/deploy/kubernetes/` and confirm HPA targets.
3. Confirm API dyno runs with `PROCESS_TYPE=api` and worker dyno runs `worker-process.js`.

### Tenant quota verification
1. Lower a quota (for example `TENANT_QUOTA_SYNC_HOURLY=1`) in local env.
2. Trigger sync twice within the window and confirm second request returns `429` with quota metadata.
3. Restore production limits and verify normal enqueue behavior.

### DLQ replay verification
1. Force a publish job to fail beyond retry attempts.
2. Confirm `PublishDlqJob` record is created with `status: dead_lettered`.
3. Call `GET /api/posts/dlq` and `POST /api/posts/dlq/:dlqJobId/replay`.
4. Verify job is re-enqueued and audit event `publish.dlq_replayed` is written.

### Index optimization verification
1. Run `npm run ensure-indexes` in `backend/`.
2. Confirm startup logs show indexes ensured for all hot-path models.
3. Validate query plans in Mongo for:
   - `Post.find({ user, createdAt })`
   - `PublishJob.find({ userId, postId, idempotencyKey })`
   - `AuditLog.find({ actorId }).sort({ createdAt: -1 })`

### Load and chaos drills
1. Smoke load: `LOAD_TEST_BASE_URL=http://localhost:5000 npm run load:smoke`
2. Auth read load: set `LOAD_TEST_AUTH_TOKEN` then run `npm run load:read`
3. Circuit chaos drill: `npm run chaos:circuit` and confirm `circuitOpened: true`


