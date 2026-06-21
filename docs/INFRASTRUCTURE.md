# ExploreMY AI — Enterprise Infrastructure & Platform Engineering

> **Author:** CTO / Principal Cloud Architect
> **Version:** 1.0
> **Target Scale:** 1M users · 10M places · 100M reviews · 1B recommendations
> **Cloud:** Vercel (frontend) + Railway (backend) + Supabase (storage) + Upstash (Redis)
> **SLO:** 99.95% uptime · <200ms p95 API latency · <2s page load

---

## Section 9.1: System Architecture

### 9.1.1 Modular Monolith → Microservices Strategy

```
PHASE 1 (Current — 0–50K MAU)
  Modular Monolith on Railway
  apps/api (NestJS) — all modules in single deployable
  ✅ Fast iteration, simple CI/CD, low ops overhead

PHASE 2 (50K–200K MAU)
  Extract high-load services:
  apps/api (core) + services/recommendation + services/notification
  ✅ Independent scaling of CPU-intensive services

PHASE 3 (200K–1M MAU)
  Full service extraction:
  Each service owns its own database (DB-per-service)
  Event-driven communication via message queue
  ✅ Independent deploy, scale, and failure isolation
```

### 9.1.2 Service Boundaries

```
┌──────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (Kong / Cloudflare)              │
│                      Auth · Rate Limit · Routing · Versioning     │
└──────┬───────┬───────┬───────┬───────┬───────┬───────┬──────────┘
       │       │       │       │       │       │       │
       ▼       ▼       ▼       ▼       ▼       ▼       ▼
┌──────────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│Auth      │ │User  │ │Place │ │Review│ │Route │ │AI    │ │Reco- │
│Service   │ │Svc   │ │Svc   │ │Svc   │ │Svc   │ │Svc   │ │mmend │
│(Clerk)   │ │      │ │      │ │      │ │      │ │      │ │Svc   │
└──────────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘
       │       │       │       │       │       │       │       │
┌──────┴───────┴───────┴───────┴───────┴───────┴───────┴──────┐
│                      EVENT BUS (RabbitMQ / Kafka)              │
│                      Async Communication Layer                 │
└──────┬───────┬───────┬───────┬───────┬───────┬───────┬──────┘
       │       │       │       │       │       │       │
       ▼       ▼       ▼       ▼       ▼       ▼       ▼
┌──────────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────┐
│Notif     │ │Search│ │Analyt│ │Merch │ │Booking│ │Event     │
│Svc       │ │Svc   │ │ics   │ │ant   │ │Svc    │ │Svc       │
│(Push/    │ │(Algo-│ │Svc   │ │Svc   │ │(Future│ │          │
│Email/SMS)│ │lia)  │ │      │ │      │ │)      │ │          │
└──────────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────────┘
```

### 9.1.3 Monorepo Structure

```
ExploreMY-AI/
├── apps/
│   ├── web/                    # Next.js 15 (Vercel)
│   └── api/                    # NestJS Monolith → Gateway (Railway)
│
├── services/                   # Extractable microservices (Phase 2+)
│   ├── recommendation/         # AI rec engine
│   ├── notification/           # Push/Email/SMS
│   ├── search-sync/            # Algolia indexer
│   ├── analytics/              # Event processing
│   └── merchant/               # Business dashboard backend
│
├── packages/                   # Shared libraries
├── infrastructure/             # IaC
│   ├── terraform/
│   └── kubernetes/
├── docker/
├── .github/workflows/
└── docs/
```

---

## Section 9.2: Microservices Blueprint

| Service | Responsibility | DB | Cache | Communication |
|---------|---------------|-----|-------|---------------|
| **Auth** | Clerk integration, JWT validation, webhook handling | Clerk | — | Sync REST |
| **User** | Profile CRUD, preferences, follow system | PostgreSQL | Redis | Sync REST + Events |
| **Place** | Place CRUD, search indexing, nearby discovery, hidden gem scoring | PostgreSQL + PostGIS | Redis | Sync REST + Events |
| **Review** | Review CRUD, moderation, helpful votes | PostgreSQL | Redis | Sync REST + Events |
| **Route** | Directions API, route optimization, transport comparison | PostgreSQL | Redis (route cache) | Sync REST |
| **AI** | OpenAI/Gemini orchestration, trip planning, recommendations | PostgreSQL | Redis (response cache) | Sync REST |
| **Recommendation** | Collaborative + content-based filtering, scoring | PostgreSQL (similarity matrices) | Redis (pre-computed) | Async |
| **Notification** | Push (FCM/APNs), email (SendGrid), SMS, in-app | PostgreSQL | BullMQ | Async |
| **Search Sync** | Prisma → Algolia indexing, full-text sync | — | BullMQ | Async |
| **Analytics** | Event processing, daily aggregation, materialized views | PostgreSQL (analytics schema) | — | Async |
| **Merchant** | Business dashboard, claiming, promotions, ads | PostgreSQL | Redis | Sync REST |
| **Booking** | (Future) Reservation system, availability | PostgreSQL | Redis | Sync REST + Events |

### Event Contracts

```typescript
interface EventEnvelope<T> {
  eventId: string;          // UUID v7
  eventType: string;        // "user.registered", "review.created"
  timestamp: string;        // ISO 8601
  version: string;          // "1.0"
  source: string;           // "user-service"
  correlationId: string;    // For tracing
  payload: T;
}
```

---

## Section 9.3: API Gateway

### 9.3.1 Architecture (Cloudflare / Kong)

```
CLIENT → Cloudflare DNS → Cloudflare WAF → API Gateway → Service
                                    │
                              Rate Limiting (per user/IP)
                              JWT Validation (Clerk public key)
                              Request Validation (schema check)
                              Routing (path → upstream service)
                              Versioning (header: API-Version)
```

### 9.3.2 Rate Limiting Tiers

| Tier | Requests/min | Burst | Window |
|------|-------------|-------|--------|
| Anonymous | 30 | 60 | Sliding 60s |
| User | 100 | 150 | Sliding 60s |
| Verified | 200 | 300 | Sliding 60s |
| Premium | 500 | 750 | Sliding 60s |
| Business | 300 | 450 | Sliding 60s |
| Admin | 1000 | 1500 | Sliding 60s |

### 9.3.3 API Versioning

```
URL path:   /api/v1/places/nearby  (default)
Header:     API-Version: 2026-06-01 (date-based)
Accept:     application/vnd.exploremy.v1+json
```

---

## Section 9.4: Event-Driven Architecture

### 9.4.1 Event Catalog

| Event | Publisher | Consumers |
|-------|-----------|-----------|
| `user.registered` | Auth Service | User Service (create profile), Analytics, Notification (welcome email) |
| `user.onboarding.completed` | User Service | Travel DNA (initialize), Recommendation (first recs), Analytics |
| `place.viewed` | Place Service | Analytics (increment counter), Recommendation (update signals) |
| `review.created` | Review Service | Place (update rating), Analytics, Recommendation, Notification (business owner), Search Sync |
| `review.replied` | Review Service | Notification (review author) |
| `favorite.added` | User Service | Recommendation (update signals), Analytics |
| `trip.created` | Trip Service | Recommendation, Analytics, Notification (collaborators) |
| `route.planned` | Route Service | Analytics, Recommendation |
| `ai.recommendation.generated` | AI Service | Analytics (cost tracking), User (notification) |
| `promotion.created` | Merchant Service | Recommendation, Notification (targeted users) |
| `booking.completed` | Booking Service | Analytics, Notification, Loyalty Engine |
| `achievement.unlocked` | Gamification | Notification, Analytics, User (profile update) |

### 9.4.2 Event Schema Example

```json
{
  "eventId": "evt_3a5b7c9d",
  "eventType": "review.created",
  "timestamp": "2026-06-14T10:30:00+08:00",
  "version": "1.0",
  "source": "review-service",
  "correlationId": "corr_abc123",
  "payload": {
    "reviewId": "uuid",
    "userId": "uuid",
    "placeId": "uuid",
    "rating": 5,
    "placeCategory": "RESTAURANT",
    "tags": ["halal", "cheap"],
    "createdAt": "2026-06-14T10:30:00+08:00"
  }
}
```

---

## Section 9.5: Message Queue Architecture

### 9.5.1 Selection: BullMQ (Phase 1) → RabbitMQ (Phase 3)

```
Phase 1–2: BullMQ (Redis-backed)
  ✅ Zero infrastructure overhead (uses existing Redis)
  ✅ Simple API, great NestJS integration (@nestjs/bullmq)
  ✅ Sufficient for <1M events/day

Phase 3: RabbitMQ
  ✅ Persistent, durable queues
  ✅ Complex routing (topic exchanges, headers)
  ✅ Dead letter exchanges built-in
  ✅ Better for 10M+ events/day
```

### 9.5.2 Queue Design

```
Queue Name             Concurrency  Retry      Backoff      DLQ
────────────────────────────────────────────────────────────────
ai.recommendation       3           3          1m,5m,15m   ai.recommendation.dlq
ai.trip-planning        2           2          2m,10m       ai.trip-planning.dlq
notification.push       10          5          30s,2m,10m   notification.push.dlq
notification.email      5           3          1m,5m        notification.email.dlq
search.sync             5           3          1m,5m        search.sync.dlq
analytics.process       5           3          1m,5m        analytics.process.dlq
place.sync              3           3          5m,30m,2h    place.sync.dlq
photo.process           3           2          1m,5m        photo.process.dlq
```

### 9.5.3 Retry Strategy

```typescript
const defaultRetryStrategy = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,        // start at 1s
  },
  removeOnComplete: {
    age: 3600,          // keep completed for 1h
    count: 1000,        // max 1000 completed jobs
  },
  removeOnFail: {
    age: 7 * 24 * 3600, // keep failed for 7 days
  },
};
```

---

## Section 9.6: Redis Architecture

### 9.6.1 Key Design

```
Key Pattern                          TTL       Purpose
───────────────────────────────────────────────────────────────────
session:{userId}                     24h       User session data
user:{userId}:preferences            1h        Cached preferences
place:{slug}                         5m        Place detail cache
place:nearby:{lat}:{lng}:{cat}       30s       Nearby search results
place:trending:{city}                1h        Trending places by city
place:photos:{placeId}               1h        Place photo URLs
route:{origin}:{dest}:{mode}         1h        Cached route
ai:response:{hash}                   24h       AI response cache
ai:rate-limit:{userId}               1m        AI request rate limit
recommendation:{userId}:{type}       1h        Pre-computed recommendations
search:suggestions:{prefix}          10m       Autocomplete suggestions
traffic:{lat}:{lng}                  5m        Traffic data cache
weather:{city}                       30m       Weather data cache
rate-limit:{ip}:{endpoint}           60s       Rate limit counter
leaderboard:{type}:{period}          1h        Gamification leaderboard
```

### 9.6.2 Memory Budget (at 500K MAU)

| Category | Key Count | Avg Size | Memory |
|----------|-----------|----------|--------|
| Session | 50K | 2 KB | 100 MB |
| Place cache | 20K | 5 KB | 100 MB |
| Route cache | 10K | 3 KB | 30 MB |
| AI cache | 5K | 8 KB | 40 MB |
| Recommendations | 50K | 4 KB | 200 MB |
| Rate limiting | 100K | 0.5 KB | 50 MB |
| Other | — | — | 80 MB |
| **Total** | | | **~600 MB** |
| **With overhead** | | | **~1 GB** |

**Recommendation:** Upstash Pro (2 GB) for launch, scale to 8 GB at 500K MAU.

---

## Section 9.7: Database Scaling

### 9.7.1 PostgreSQL Topology

```
                    ┌──────────────┐
                    │  PgBouncer   │  Transaction pooling
                    │  (sidecar)   │  pool_size=25, max_conn=200
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Primary  │ │ Replica 1│ │ Replica 2│
        │ (R/W)    │ │ (R/O)    │ │ (R/O)    │
        │ 8 vCPU   │ │ 4 vCPU   │ │ 4 vCPU   │
        │ 32 GB    │ │ 16 GB    │ │ 16 GB    │
        └──────────┘ └──────────┘ └──────────┘
```

### 9.7.2 Query Routing

```typescript
// Writes → Primary
prisma.user.create(...)
prisma.review.create(...)

// Reads → Replica (stale reads acceptable for discovery)
readPrisma.place.findMany({ where: { ... } })
readPrisma.review.findMany({ where: { ... } })

// Critical reads → Primary (after write)
prisma.review.findFirst({ where: { userId, placeId } })  // Check duplicate
```

### 9.7.3 Partitioning

| Table | Partition Key | Interval | Retention |
|-------|--------------|----------|-----------|
| `location_history` | `recorded_at` | Monthly | 6 months |
| `api_audit_logs` | `created_at` | Monthly | 12 months |
| `search_history` | `created_at` | Monthly | 3 months |
| `place_views` | `created_at` | Monthly | 12 months |
| `ad_impressions` | `created_at` | Monthly | 6 months |

### 9.7.4 Backup Strategy

| Type | Frequency | Retention | RPO | RTO |
|------|-----------|-----------|-----|-----|
| WAL Archiving | Continuous | 7 days | <1s | 5 min |
| Full Backup | Daily (03:00 MYT) | 30 days | 24h | 30 min |
| Base Backup | Weekly (Sun 03:00) | 90 days | 7 days | 2 hours |

---

## Section 9.8: Search Architecture

### 9.8.1 Algolia (Primary Search Engine)

```
Index Design:
  places (primary)
    • searchableAttributes: [name, description, address, city, tags]
    • attributesForFaceting: [category, priceLevel, city, state, rating, isOpen]
    • ranking: [typo, geo, words, filters, proximity, attribute, exact, custom]
    • customRanking: [desc(rating), desc(reviewCount), desc(trendingScore)]
    • replicas: places_rating_desc, places_distance_asc, places_trending_desc

  users (secondary)
    • searchableAttributes: [displayName, bio]
    • ranking: [typo, words, proximity, attribute]

  trips (secondary)
    • searchableAttributes: [title, description, destinationCity]
    • ranking: [typo, words, filters]
```

### 9.8.2 Search Sync Pipeline

```
Prisma DB Change → Queue (search.sync) → Algolia Indexer
  │
  ├── place.created → addObject
  ├── place.updated → partialUpdateObject
  ├── place.deleted → deleteObject
  ├── review.created → update place.reviewCount + rating
  └── hourly full reindex (safety net)
```

---

## Section 9.9: Storage Architecture

### 9.9.1 Supabase Storage (Primary)

```
Buckets:
  user-content/        # User photos, avatars
    • RLS: owner-only write, public read
    • Transformations: 200px, 400px, 800px, 1200px webp

  merchant-assets/     # Business photos, menus, logos
    • RLS: business_owner write, public read

  documents/           # Verification documents (private)
    • RLS: owner + admin only

  static/              # App static assets
    • Public read, CDN-cached
```

### 9.9.2 CDN Strategy

```
User Upload
  → Supabase Storage (origin)
    → Cloudflare CDN (automatic)
      → cache-control: public, max-age=31536000, immutable (images)
      → cache-control: public, max-age=3600 (other assets)
      → Image Resizing: ?width=400&format=webp&quality=80
```

---

## Section 9.10: Docker Platform

### 9.10.1 Docker Compose (Local Dev)

```yaml
services:
  postgres:    postgis/postgis:16-3.4
  redis:       redis:7-alpine
  web:         node:20-alpine (Next.js dev on :3000)
  api:         node:20-alpine (NestJS dev on :3001)
  pgadmin:     dpage/pgadmin4 (optional, :5050)
  redisinsight: redis/redisinsight (optional, :5540)
```

### 9.10.2 Production Dockerfiles

Multi-stage builds (already specified in docker/Dockerfile.web, docker/Dockerfile.api):
- Stage 1 (deps): Install workspace dependencies
- Stage 2 (builder): Turborepo build
- Stage 3 (runner): Alpine + non-root user + standalone output

---

## Section 9.11: Kubernetes Platform (Phase 3)

### 9.11.1 Cluster Design

```
Namespaces:
  production/
  ├── web/           # Next.js frontend (Vercel handles this)
  ├── api/           # Core NestJS API
  ├── services/      # Microservices
  │   ├── recommendation/
  │   ├── notification/
  │   ├── analytics/
  │   └── search-sync/
  ├── infrastructure/
  │   ├── ingress-nginx/
  │   ├── cert-manager/
  │   ├── prometheus/
  │   └── grafana/
  └── databases/     # Only if self-hosted
```

### 9.11.2 Auto-Scaling Rules

```yaml
apiVersion: autoscaling/v2
spec:
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

### 9.11.3 Resource Allocation

| Service | CPU Request/Limit | Memory Request/Limit | Min Replicas |
|---------|-------------------|---------------------|--------------|
| api (core) | 500m/2000m | 512Mi/2Gi | 3 |
| recommendation | 250m/1000m | 512Mi/2Gi | 2 |
| notification | 100m/500m | 256Mi/1Gi | 2 |
| analytics | 250m/1000m | 512Mi/2Gi | 2 |
| search-sync | 100m/500m | 256Mi/1Gi | 2 |
| ai | 250m/2000m | 1Gi/4Gi | 2 |

---

## Section 9.12: CI/CD Pipeline

### 9.12.1 GitHub Actions Workflow

```
PUSH TO BRANCH
  │
  ├─→ PR to main/develop
  │     │
  │     ├─→ Lint (ESLint + Prettier)
  │     ├─→ Type Check (tsc --noEmit)
  │     ├─→ Unit Tests (Jest)
  │     ├─→ Integration Tests (Supertest + test DB)
  │     ├─→ Build Check
  │     ├─→ Bundle Analysis
  │     └─→ Security Scan (Snyk + npm audit)
  │
  ├─→ Merge to develop
  │     │
  │     ├─→ Deploy to Staging (Vercel Preview + Railway Staging)
  │     └─→ E2E Tests (Playwright against staging)
  │
  └─→ Merge to main
        │
        ├─→ Deploy to Production (Vercel + Railway)
        ├─→ Database Migration (prisma migrate deploy)
        ├─→ Health Check (curl /health)
        ├─→ Smoke Tests
        └─→ Slack Notification
```

### 9.12.2 Environment Strategy

| Environment | URL | DB | Purpose |
|-------------|-----|-----|---------|
| **Development** | localhost:3000 | Docker Postgres | Local dev |
| **Preview** | `*.vercel.app` (per PR) | Shared staging DB | PR review |
| **Staging** | staging.exploremy.ai | Railway staging | Pre-prod validation |
| **Production** | exploremy.ai | Railway production | Live |

---

## Section 9.13: Observability Platform

### 9.13.1 Three Pillars

```
METRICS (Prometheus + Grafana)
  ├── Application: request count, latency, error rate
  ├── Database: connection pool, query latency, dead tuples
  ├── Redis: memory usage, hit rate, evictions
  ├── External APIs: latency, error rate (Google Maps, OpenAI, Algolia)
  └── Business: signups, searches, reviews, AI requests

LOGS (Pino → Loki / Railway Logs)
  ├── Structured JSON logs
  ├── Correlation IDs (x-request-id)
  ├── Levels: trace, debug, info, warn, error, fatal
  └── PII redaction (email, phone, IP)

TRACES (OpenTelemetry → Grafana Tempo)
  ├── Span: HTTP request → service call → DB query
  ├── Correlation across services (trace-id header)
  └── Slow query identification (>100ms spans highlighted)
```

### 9.13.2 NestJS OpenTelemetry Setup

```typescript
// instrumentation.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: 'https://tempo.example.com/v1/traces',
  }),
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
    new PrismaInstrumentation(),
    new RedisInstrumentation(),
  ],
});
sdk.start();
```

---

## Section 9.14: Prometheus Metrics

### 9.14.1 Key Metrics

```
http_requests_total{method, path, status}       // Counter
http_request_duration_seconds{method, path}      // Histogram
http_requests_in_flight{method, path}            // Gauge

db_queries_total{operation, model}               // Counter
db_query_duration_seconds{operation, model}      // Histogram
db_pool_connections_active                       // Gauge
db_pool_connections_idle                         // Gauge

redis_commands_total{command}                    // Counter
redis_command_duration_seconds{command}           // Histogram
redis_hit_ratio                                  // Gauge

external_api_requests_total{api, status}         // Counter
external_api_duration_seconds{api}               // Histogram

ai_requests_total{model, type}                   // Counter
ai_tokens_used_total{model}                      // Counter
ai_cost_total{model}                             // Counter

business_signups_total                           // Counter
business_views_total{place_id}                   // Counter
business_reviews_total{place_id, rating}         // Counter
```

### 9.14.2 Alert Rules

```yaml
groups:
  - name: exploremy-critical
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels: { severity: critical }
        annotations: { summary: "5xx error rate >5%" }

      - alert: HighLatency
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 2
        for: 10m
        labels: { severity: warning }
        annotations: { summary: "p95 latency >2s" }

      - alert: DatabaseConnectionPoolExhausted
        expr: db_pool_connections_active / db_pool_connections_max > 0.85
        for: 5m
        labels: { severity: critical }

      - alert: RedisDown
        expr: up{job="redis"} == 0
        for: 1m
        labels: { severity: critical }

      - alert: ExternalAPIDegraded
        expr: rate(external_api_requests_total{status="error"}[10m]) > 0.1
        for: 10m
        labels: { severity: warning }
```

---

## Section 9.15: Grafana Dashboards

### 9.15.1 Dashboard Categories

```
OPERATIONAL DASHBOARDS
  ├── API Overview: requests/sec, latency p50/p95/p99, error rate, 4xx/5xx ratio
  ├── Database: connections, query latency, transaction rate, deadlocks
  ├── Redis: memory, hit ratio, evictions, connected clients
  ├── Queue: queue depth, processing rate, failures, DLQ size
  └── External APIs: latency per API, error rate, rate limit remaining

BUSINESS DASHBOARDS
  ├── User Growth: signups/day, DAU/WAU/MAU, retention cohort, churn
  ├── Engagement: searches/day, reviews/day, favorites/day, trips created
  ├── AI Usage: requests/day, tokens/day, cost/day, model distribution
  ├── Revenue: MRR, ARPU, subscription breakdown, ad revenue
  └── Places: places indexed, claimed rate, hidden gems discovered

TECHNICAL DASHBOARDS
  ├── Deployments: deploy frequency, lead time, failure rate
  ├── Build Pipeline: build duration, cache hit rate, flaky tests
  └── Error Budget: remaining budget, burn rate, SLO compliance
```

---

## Section 9.16: Sentry

### 9.16.1 Error Tracking

```typescript
// sentry.config.ts
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,        // 10% in production
  profilesSampleRate: 0.05,     // 5% profiling
  release: process.env.GIT_SHA,
  beforeSend(event) {
    // Strip PII
    delete event.user?.email;
    delete event.user?.ip_address;
    return event;
  },
});
```

### 9.16.2 Alert Routing

| Condition | Channel | Priority |
|-----------|---------|----------|
| New unhandled error type | #eng-alerts (Slack) | P2 |
| Error rate spike (>3σ) | PagerDuty | P1 |
| Performance degradation | #eng-alerts | P3 |
| Release health degraded | #eng-releases | P2 |

---

## Section 9.17: Security Architecture

### 9.17.1 Defense in Depth

```
Layer 1: Cloudflare DDoS + WAF + Bot Management
Layer 2: API Gateway JWT validation + Rate Limiting
Layer 3: NestJS Guards (RBAC per endpoint)
Layer 4: Input Validation (Zod + class-validator)
Layer 5: Parameterized Queries (Prisma → SQL injection prevention)
Layer 6: Row-Level Security (Supabase Storage)
Layer 7: Encryption at Rest (AES-256, TLS 1.3 everywhere)
Layer 8: Audit Logging (all mutations logged)
```

### 9.17.2 Secrets Management

```
Development: .env.local (gitignored)
CI/CD: GitHub Actions Encrypted Secrets
Production: Railway Environment Variables + Vercel Environment Variables
Rotation: Stripe keys (90d), API keys (180d), JWT signing keys (30d)
```

### 9.17.3 Audit Log Schema

```sql
CREATE TABLE audit.api_audit_logs (
    id UUID DEFAULT gen_random_uuid_v7(),
    user_id UUID,
    method VARCHAR(10) NOT NULL,
    path VARCHAR(500) NOT NULL,
    status_code INTEGER NOT NULL,
    duration_ms INTEGER NOT NULL,
    ip_address INET,
    user_agent VARCHAR(512),
    request_id VARCHAR(100),
    changes JSONB,      -- { field: { old, new } }
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (created_at);
```

---

## Section 9.18: Disaster Recovery

### 9.18.1 RTO / RPO Targets

| Scenario | RPO | RTO | Strategy |
|----------|-----|-----|----------|
| Database failure | <1s | 5 min | WAL streaming + automated failover to replica |
| Region failure | <1s | 15 min | Multi-region replica promotion |
| Accidental deletion | <1s | 30 min | Point-in-time recovery (PITR) |
| Complete outage | 24h | 2 hours | Restore from daily backup + WAL replay |
| Data corruption | <1s | 1 hour | PITR to point before corruption |

### 9.18.2 Failover Procedure

```
1. Health check detects primary DB failure (3 consecutive failures, 10s apart)
2. PagerDuty alert → on-call engineer
3. Automated: promote highest-lag replica to primary (<5 min)
4. Update DATABASE_URL in Railway → app restarts
5. Manual: verify data integrity, notify stakeholders
6. Post-mortem within 24h
```

---

## Section 9.19: Data Warehouse

### 9.19.1 Analytics Pipeline

```
Source Systems (PostgreSQL)
  │
  ▼
Airbyte / Fivetran (ELT)
  │  Hourly sync of analytics tables
  ▼
BigQuery (Data Warehouse)
  │
  ├── Raw datasets (raw_*)
  ├── Transformed datasets (dbt models)
  │   ├── dim_users, dim_places, dim_dates
  │   └── fact_views, fact_reviews, fact_searches, fact_routes
  │
  ▼
Metabase / Looker Studio (BI Layer)
  ├── Executive Dashboard (CEO/CTO)
  ├── Product Dashboard (PMs)
  ├── Marketing Dashboard (Growth team)
  └── Business Dashboard (Merchant-facing)
```

### 9.19.2 ClickHouse (Alternative — Real-Time Analytics)

```
For sub-second analytics on large event streams:
  • place_views (1B+ rows/month)
  • ad_impressions (100M+/month)
  • search_queries (50M+/month)

ClickHouse advantages:
  ✅ Columnar storage → 10x compression
  ✅ Vectorized query execution → 100x faster than PostgreSQL for aggregates
  ✅ Materialized views for real-time rollups
```

---

## Section 9.20: SRE Platform

### 9.20.1 SLIs / SLOs / SLAs

| Service | SLI | SLO | SLA |
|---------|-----|-----|-----|
| Web App | Availability | 99.95% | 99.9% |
| Core API | Latency (p95) | <200ms | <500ms |
| Core API | Availability | 99.95% | 99.9% |
| AI Recommendations | Latency (p95) | <3s | <8s |
| Search (Algolia) | Latency (p95) | <100ms | <300ms |
| Map Tiles | Load time (p95) | <500ms | <2s |
| Image Delivery | Latency (p95) | <200ms | <1s |
| Database | Availability | 99.99% | 99.95% |

### 9.20.2 Error Budget

```
Monthly Error Budget (99.95% SLO):
  30 days × 24h × 60min × 0.05% = 21.6 minutes/month

Burn Rate Alerts:
  • 2% budget consumed in 1h → P2 Slack alert
  • 5% budget consumed in 1h → P1 PagerDuty
  • 10% budget consumed in 30min → Critical incident
```

### 9.20.3 Incident Management

```
SEVERITY LEVELS:
  P1 (Critical): Complete outage, data loss, security breach
    → Response: 5 min, Resolution: 1 hour

  P2 (High): Major feature broken, significant degradation
    → Response: 15 min, Resolution: 4 hours

  P3 (Medium): Partial feature broken, workaround available
    → Response: 1 hour, Resolution: 24 hours

  P4 (Low): Minor bug, cosmetic issue
    → Response: 24 hours, Resolution: next sprint

ON-CALL ROTATION:
  • Weekly rotation (Mon–Sun)
  • Primary + Secondary per shift
  • Follow-the-sun (MYT + UTC + PST)
  • Escalation: Secondary → Engineering Manager → CTO

POST-MORTEM PROCESS:
  1. Blameless post-mortem within 24h of resolution
  2. Document: timeline, impact, root cause, resolution, action items
  3. Action items tracked in GitHub Issues with owner + due date
  4. Review in weekly engineering meeting
```

### 9.20.4 Runbook Index

```
RUNBOOKS:
  RB-001: Database failover procedure
  RB-002: Redis cache flush and recovery
  RB-003: Algolia index rebuild
  RB-004: Stripe webhook failure recovery
  RB-005: OpenAI API degradation fallback
  RB-006: Google Maps API quota exceeded
  RB-007: Rate limit incident response
  RB-008: Certificate expiry renewal
  RB-009: DNS failover procedure
  RB-010: Full disaster recovery test (quarterly)
```

---

## Infrastructure Database Tables

```sql
-- Deployment tracking
CREATE TABLE infrastructure.deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    service VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL,
    environment VARCHAR(20) NOT NULL,
    git_sha VARCHAR(40),
    deployed_by VARCHAR(320),
    status VARCHAR(20), -- 'started', 'success', 'failed', 'rolled_back'
    duration_seconds INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Feature flags
CREATE TABLE infrastructure.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500),
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    rollout_percentage INTEGER DEFAULT 100,
    target_environments JSONB,
    target_users JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rate limit tracking
CREATE TABLE infrastructure.rate_limit_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id UUID,
    ip_address INET,
    endpoint VARCHAR(200),
    exceeded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cron job execution log
CREATE TABLE infrastructure.cron_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    job_name VARCHAR(100) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    status VARCHAR(20), -- 'running', 'success', 'failed'
    error_message TEXT,
    duration_ms INTEGER
);
```

---

## NestJS Infrastructure Modules

```
apps/api/src/
├── common/
│   ├── middleware/request-id.middleware.ts
│   ├── middleware/audit-log.middleware.ts
│   ├── interceptors/logging.interceptor.ts
│   ├── interceptors/metrics.interceptor.ts
│   ├── interceptors/cache.interceptor.ts
│   ├── filters/all-exceptions.filter.ts
│   └── pipes/validation.pipe.ts
│
├── health/
│   ├── health.module.ts
│   └── health.controller.ts       # /health, /health/ready, /health/live
│
├── metrics/
│   ├── metrics.module.ts
│   ├── metrics.controller.ts      # /metrics (Prometheus scrape)
│   └── metrics.service.ts
│
├── config/
│   ├── app.config.ts
│   ├── database.config.ts
│   ├── redis.config.ts
│   ├── queue.config.ts
│   └── sentry.config.ts
│
├── queue/
│   ├── queue.module.ts
│   ├── queue.service.ts
│   └── processors/
│       ├── ai-recommendation.processor.ts
│       ├── ai-trip-planning.processor.ts
│       ├── notification-push.processor.ts
│       ├── notification-email.processor.ts
│       ├── search-sync.processor.ts
│       ├── analytics-event.processor.ts
│       ├── place-sync.processor.ts
│       └── photo-processing.processor.ts
│
└── events/
    ├── events.module.ts
    ├── events.service.ts          # Event publishing
    └── consumers/
        ├── user-events.consumer.ts
        ├── place-events.consumer.ts
        ├── review-events.consumer.ts
        └── analytics-events.consumer.ts
```

---

## Scalability Summary

| Component | 50K MAU (Now) | 200K MAU (Phase 2) | 1M MAU (Phase 3) |
|-----------|--------------|-------------------|------------------|
| **Web** | Vercel Pro | Vercel Enterprise | Vercel Enterprise |
| **API** | Railway 2vCPU/8GB | Railway 4vCPU/16GB × 3 | K8s 8vCPU/32GB × 10 |
| **DB** | Railway PG 4vCPU/16GB | 8vCPU/32GB + 2 replicas | 16vCPU/64GB + 4 replicas + sharding |
| **Redis** | Upstash 1GB | Upstash 4GB | Upstash 16GB or self-hosted cluster |
| **Search** | Algolia Growth | Algolia Pro | Algolia Enterprise |
| **Queue** | BullMQ (Redis) | BullMQ (Redis) | RabbitMQ cluster |
| **CDN** | Cloudflare Free | Cloudflare Pro | Cloudflare Enterprise |
| **Monitoring** | Railway logs + Sentry | + Grafana Cloud | + Prometheus + Loki + Tempo |
| **Cost/mo (est.)** | ~RM 3,000 | ~RM 15,000 | ~RM 80,000 |

---

*End of Enterprise Infrastructure & Platform Engineering Specification — 20 sections complete.*
