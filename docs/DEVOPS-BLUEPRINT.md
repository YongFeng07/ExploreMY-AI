# ExploreMY AI — Enterprise Infrastructure & DevOps Platform

> **Classification:** Internal — Infrastructure Engineering  
> **Version:** 10.0  
> **Authors:** CTO · Principal Cloud Architect · Principal SRE  
> **Target:** 10M users · 100K concurrent · 99.95% uptime  
> **Cloud:** Vercel + Railway (Phase 1-2) → AWS EKS (Phase 3+)

---

## Section 1: Cloud Strategy

### 1.1 Phase-Based Cloud Architecture

```
PHASE 1 (0–50K MAU): Vercel + Railway
  Frontend:  Vercel (Edge Network, automatic SSL, preview deploys)
  Backend:   Railway (managed PostgreSQL + Redis, zero-ops)
  Storage:   Supabase (S3-compatible, RLS, CDN)
  Search:    Algolia (managed, geo-search)
  CI/CD:     GitHub Actions

PHASE 2 (50K–200K MAU): Hybrid
  Frontend:  Vercel (Enterprise)
  Backend:   Railway × 3 instances + read replicas
  Cache:     Upstash Redis (4 GB)
  Queue:     BullMQ on Upstash

PHASE 3 (200K–1M MAU): AWS Migration
  Compute:   AWS EKS (Kubernetes) or ECS Fargate
  Database:  RDS PostgreSQL + 2 read replicas + PgBouncer
  Cache:     ElastiCache Redis cluster
  Queue:     Amazon MQ (RabbitMQ) or MSK (Kafka)
  CDN:       CloudFront + Cloudflare (dual CDN for resilience)

PHASE 4 (1M–10M MAU): Multi-Region
  Regions:   ap-southeast-1 (Singapore) + ap-southeast-3 (KL, future)
  Database:  Aurora PostgreSQL global database
  CDN:       Cloudflare global edge
  DNS:       Route 53 with latency-based routing
```

### 1.2 Global Edge (Cloudflare)

```
Cloudflare Services:
  ├── DNS: exploremy.ai, api.exploremy.ai
  ├── CDN: Cache static assets, images, API responses
  ├── WAF: OWASP rules, rate limiting, bot management
  ├── DDoS: Layer 3/4/7 protection
  ├── Workers: Edge computing (A/B testing, geo-redirects)
  └── Images: On-the-fly optimization (resize, format, quality)
```

---

## Section 2: Monorepo Platform

```
ExploreMY-AI/
├── apps/
│   ├── web/                     # Next.js 15 (Vercel, port 3000)
│   └── api/                     # NestJS monolith → gateway (Railway, port 3001)
├── packages/                    # Shared: shared, database, config, ui
├── tooling/                     # eslint, typescript configs
├── infrastructure/
│   ├── terraform/               # AWS/K8s IaC
│   │   ├── environments/        # prod, staging
│   │   └── modules/             # database, redis, compute
│   └── kubernetes/              # K8s manifests (Phase 3)
│       ├── base/                # Common configs
│       └── overlays/            # prod, staging patches
├── docker/                      # Dockerfiles + compose
├── .github/workflows/           # CI/CD
│   ├── ci.yml                   # Lint, test, build
│   ├── deploy-preview.yml       # Vercel preview per PR
│   └── deploy-production.yml    # Production deploy
└── turbo.json                   # Pipeline: build → test → deploy
```

---

## Section 3: Docker Platform

### 3.1 Docker Compose (Local Dev)

```yaml
services:
  postgres:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_USER: exploremy
      POSTGRES_PASSWORD: exploremy
      POSTGRES_DB: exploremy_dev
    ports: ['5432:5432']
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U exploremy']
      interval: 10s

  redis:
    image: redis:7-alpine
    ports: ['6379:6379']
    command: redis-server --appendonly yes
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s

  web:
    build: { context: ., dockerfile: docker/Dockerfile.web }
    ports: ['3000:3000']
    depends_on: [api]
    environment: [NODE_ENV=development]

  api:
    build: { context: ., dockerfile: docker/Dockerfile.api }
    ports: ['3001:3001']
    depends_on: [postgres, redis]
    environment:
      DATABASE_URL: postgresql://exploremy:exploremy@postgres:5432/exploremy_dev
      REDIS_URL: redis://redis:6379

volumes:
  pgdata:
```

### 3.2 Production Dockerfile (Multi-stage)

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/*/package.json ./packages/
RUN corepack enable && pnpm install --frozen-lockfile --filter @exploremy/web

# Stage 2: Build
FROM deps AS builder
COPY . .
RUN pnpm turbo run build --filter=@exploremy/web

# Stage 3: Run
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs nextjs
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
```

---

## Section 4: Kubernetes Platform (Phase 3)

### 4.1 Cluster Architecture

```
NAMESPACES:
  production/
  ├── web/               # Next.js frontend (Vercel handles, not in K8s)
  ├── api-gateway/       # Kong / Cloudflare API Gateway
  ├── services/
  │   ├── places/        # Place discovery
  │   ├── reviews/       # Review management
  │   ├── routes/        # Route planning
  │   ├── ai/            # AI orchestration
  │   ├── recommendation/# Recommendation engine
  │   ├── notification/  # Push/email/SMS
  │   ├── booking/       # Booking engine (Phase 3)
  │   └── merchant/      # Business dashboard
  ├── infrastructure/
  │   ├── monitoring/    # Prometheus + Grafana
  │   ├── logging/       # Loki + Fluentd
  │   └── tracing/       # Tempo + OpenTelemetry
  └── data/
      ├── postgres/      # Only if self-hosted (not RDS)
      └── redis/         # Only if self-hosted (not ElastiCache)
```

### 4.2 HPA Configuration

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: places-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: places-service
  minReplicas: 3
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
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
    scaleUp:
      stabilizationWindowSeconds: 60
```

### 4.3 Resource Allocation

| Service | CPU Req | CPU Lim | Mem Req | Mem Lim | Min Pods | Max Pods |
|---------|---------|---------|---------|---------|----------|----------|
| api-gateway | 250m | 1000m | 256Mi | 1Gi | 3 | 10 |
| places | 500m | 2000m | 512Mi | 2Gi | 3 | 20 |
| ai | 500m | 4000m | 1Gi | 8Gi | 2 | 10 |
| recommendation | 500m | 2000m | 512Mi | 4Gi | 2 | 10 |
| notification | 250m | 1000m | 256Mi | 1Gi | 2 | 5 |
| booking | 250m | 2000m | 512Mi | 2Gi | 2 | 10 |

---

## Section 5: API Gateway

### 5.1 Routing Rules

```yaml
# Kong declarative config (Phase 3)
routes:
  - name: places
    paths: ['/api/v1/places']
    strip_path: false
    upstream: places-service.production.svc:3001

  - name: ai
    paths: ['/api/v1/ai']
    strip_path: false
    upstream: ai-service.production.svc:3001

  - name: bookings
    paths: ['/api/v1/bookings', '/api/v1/hotels']
    strip_path: false
    upstream: booking-service.production.svc:3001

plugins:
  - name: rate-limiting
    config: { minute: 100, policy: local }
  - name: cors
    config: { origins: ['https://exploremy.ai'], credentials: true }
  - name: jwt
    config: { claims_to_verify: ['exp'] }
```

---

## Section 6: Microservices Blueprint

| Service | Responsibility | DB | Cache | Queue Dependencies |
|---------|---------------|-----|-------|-------------------|
| **api-gateway** | Routing, auth, rate limiting | — | — | — |
| **places** | CRUD, nearby, search, hidden gems | PostgreSQL + PostGIS | Redis | search-sync queue |
| **reviews** | CRUD, moderation, helpful votes | PostgreSQL | Redis | notification queue |
| **routes** | Directions, optimization, comparison | PostgreSQL | Redis (route cache) | — |
| **ai** | GPT-4o/Gemini orchestration, trip planning | PostgreSQL | Redis (AI cache) | ai queue |
| **recommendation** | CF + CB hybrid, personalization | PostgreSQL | Redis (pre-computed) | — |
| **notification** | Push (FCM/APNs), email, SMS | PostgreSQL | BullMQ | — |
| **booking** | Hotel, attraction, event bookings | PostgreSQL | Redis | payment queue |
| **merchant** | Dashboard, analytics, promotions | PostgreSQL | Redis | — |
| **analytics** | Event processing, aggregation | PostgreSQL (analytics) | — | analytics queue |

---

## Section 7-8: Redis & Message Queue

### 7.1 Redis Architecture

```
UPSTASH REDIS (managed, serverless):
  Region: ap-southeast-1 (Singapore)
  Plan: Pro 4 GB (Phase 2) → Enterprise 16 GB (Phase 3)

KEY PATTERNS:
  place:{slug}                      5m     Place detail cache
  place:nearby:{lat}:{lng}:{cat}    30s    Nearby results (hot path)
  route:{o}:{d}:{mode}              1h     Route cache
  ai:response:{hash}                24h    AI response cache (high value)
  recommendation:{uid}:{type}       1h     Pre-computed recommendations
  session:{uid}                     24h    User session
  rate-limit:{ip}:{ep}              60s    Rate limiting (sliding window)
```

### 7.2 Queue Architecture (BullMQ → RabbitMQ)

```
PHASE 1-2: BullMQ (Redis-backed)
  8 queues, exponential backoff, DLQ per queue

PHASE 3: RabbitMQ
  Durable queues, topic exchanges, dead letter exchanges

QUEUES:
  ai.recommendation    concurrency:3  retries:3  backoff:1m,5m,15m
  ai.trip-planning     concurrency:2  retries:2  backoff:2m,10m
  notification.push    concurrency:10 retries:5  backoff:30s,2m,10m
  notification.email   concurrency:5  retries:3  backoff:1m,5m
  search.sync          concurrency:5  retries:3  backoff:1m,5m
  analytics.event      concurrency:5  retries:3  backoff:1m,5m
  place.sync           concurrency:3  retries:3  backoff:5m,30m,2h
```

---

## Section 9-12: Observability

### 9.1 Three Pillars

```
METRICS (Prometheus + Grafana)
  • Golden signals: latency, traffic, errors, saturation
  • App metrics: requests/sec, db query time, cache hit ratio
  • Business metrics: signups, bookings, AI requests, revenue

LOGS (Pino → Loki)
  • Structured JSON: { level, msg, requestId, userId, duration }
  • PII redaction: email → e***@domain, phone → ****1234
  • Retention: 30 days hot, 90 days cold

TRACES (OpenTelemetry → Tempo)
  • End-to-end: HTTP → Service → DB query
  • Correlation: trace-id + span-id across services
  • Sampling: 10% in production, 100% in staging
```

### 9.2 Prometheus Alert Rules

```yaml
groups:
  - name: critical
    rules:
      - alert: High5xxRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels: { severity: critical }
        annotations: { summary: "5xx error rate >5% for 5 minutes" }

      - alert: P95LatencyHigh
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 2
        for: 10m
        labels: { severity: warning }

      - alert: DatabasePoolExhausted
        expr: db_pool_active / db_pool_max > 0.85
        for: 5m
        labels: { severity: critical }

      - alert: RedisUnavailable
        expr: redis_up == 0
        for: 1m
        labels: { severity: critical }

      - alert: AIQuotaNearLimit
        expr: ai_daily_cost / ai_daily_budget > 0.9
        labels: { severity: warning }
```

### 9.3 Grafana Dashboards

```
OPERATIONAL (4 panels):
  • API Overview: RPS, p50/p95/p99, error rate, 4xx/5xx split
  • Database: Connections, query latency, cache hit, deadlocks
  • Redis: Memory, hit ratio, evictions, clients
  • Queue: Depth, process rate, failures, DLQ size

BUSINESS (4 panels):
  • User Growth: Signups/day, DAU/WAU/MAU, retention cohorts
  • Engagement: Searches, reviews, favorites, trips created
  • AI: Requests/day, tokens, cost, model distribution
  • Revenue: MRR, ARPU, subscription mix, ad revenue

TECHNICAL (3 panels):
  • Deployments: Deploy frequency, lead time, failure rate
  • Error Budget: Remaining budget, burn rate, SLO compliance
  • Infrastructure: CPU, memory, disk, network per service
```

### 9.4 Sentry Configuration

```typescript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: 0.05,
  release: process.env.GIT_SHA,
  beforeSend(event) {
    delete event.user?.email;
    delete event.user?.ip_address;
    return event;
  },
});

// Alert routing:
// P1 (critical spike) → PagerDuty (on-call engineer, 5 min response)
// P2 (new error type) → Slack #eng-alerts
// P3 (performance degradation) → Slack #eng-perf
```

---

## Section 13-14: CI/CD & Environments

### 13.1 GitHub Actions Pipeline

```yaml
PULL REQUEST → develop:
  ├── Lint (ESLint + Prettier)           5 min
  ├── Type Check (tsc --noEmit)          3 min
  ├── Unit Tests (Jest)                  8 min
  ├── Build Check (next build)           10 min
  └── Preview Deploy (Vercel)            5 min
      └── Comment preview URL on PR

MERGE to develop:
  ├── Integration Tests (Supertest + test DB)  12 min
  └── Deploy to Staging                         5 min
      └── E2E Tests (Playwright against staging) 15 min

MERGE to main:
  ├── Production Build                          10 min
  ├── Deploy Web (Vercel)                       5 min
  ├── Deploy API (Railway)                      5 min
  ├── Database Migration                         3 min
  ├── Health Check                               2 min
  └── Slack Notification                         1 min
```

### 13.2 Environment Matrix

| Environment | URL | DB | Deploy Trigger | Protection |
|-------------|-----|-----|---------------|------------|
| **Local** | localhost:3000 | Docker | Manual | None |
| **Preview** | `*.vercel.app` | Shared staging | Per PR | None |
| **Staging** | staging.exploremy.ai | Railway staging | Merge to develop | Branch protection |
| **Production** | exploremy.ai | Railway production | Merge to main | Required reviewers + status checks |

---

## Section 15: Backup & Disaster Recovery

| Scenario | RPO | RTO | Procedure |
|----------|-----|-----|-----------|
| DB instance failure | <1s | 5 min | Auto-failover to read replica |
| Region failure | <1s | 15 min | Promote cross-region replica |
| Accidental delete | <1s | 30 min | Point-in-time recovery |
| Data corruption | <1s | 1 hour | PITR to pre-corruption timestamp |
| Full outage | 24h | 2 hours | Restore from daily backup + WAL |

```
BACKUP SCHEDULE:
  Continuous: WAL archiving (PITR, RPO <1s)
  Daily:      pg_dump full backup → encrypted S3 bucket (30-day retention)
  Weekly:     Base backup → cold storage (90-day retention)
  Monthly:    Restore test to staging environment (verify backups work)
```

---

## Section 16: Data Warehouse

```
PIPELINE: PostgreSQL → Airbyte/Fivetran (ELT) → BigQuery

dbt TRANSFORMATION LAYER:
  dim_tables:   dim_users, dim_places, dim_dates, dim_hotels
  fact_tables:  fact_views, fact_reviews, fact_searches, fact_bookings, fact_routes

BI LAYER (Metabase / Looker Studio):
  • Executive Dashboard (CEO/CTO)
  • Product Dashboard (PM team)
  • Marketing Dashboard (Growth team)
  • Business Dashboard (Merchant-facing, Phase 2)

CLICKHOUSE (Real-time analytics — Phase 3):
  • place_views (1B+ rows/month) → sub-second aggregation
  • ad_impressions (100M+/month)
  • search_queries (50M+/month)
  Materialized views for real-time rollups
```

---

## Section 17: SRE Platform

### 17.1 SLI / SLO / SLA

| Service | SLI | SLO | SLA |
|---------|-----|-----|-----|
| Web App | Availability | 99.95% | 99.9% |
| Core API | p95 Latency | <200ms | <500ms |
| Core API | Availability | 99.95% | 99.9% |
| AI Recommendations | p95 Latency | <3s | <8s |
| Search | p95 Latency | <100ms | <300ms |
| Database | Availability | 99.99% | 99.95% |
| Image Delivery | p95 Latency | <200ms | <1s |

### 17.2 Error Budget

```
Monthly Error Budget (99.95% SLO):
  30 days × 24h × 60min = 43,200 minutes
  0.05% allowed downtime = 21.6 minutes/month

Burn Rate Alerts:
  • 2% budget consumed in 1 hour → P2 (Slack #eng-alerts)
  • 5% budget consumed in 1 hour → P1 (PagerDuty)
  • 10% budget consumed in 30 min → Critical Incident (all-hands)
```

### 17.3 Incident Severity

| Level | Response | Resolution | Example |
|-------|----------|-----------|---------|
| **P1 Critical** | 5 min | 1 hour | Complete outage, data loss, security breach |
| **P2 High** | 15 min | 4 hours | Major feature broken |
| **P3 Medium** | 1 hour | 24 hours | Partial feature broken, workaround exists |
| **P4 Low** | 24 hours | Next sprint | Minor bug, cosmetic |

---

## Section 18: Scaling Strategy

```
10K MAU (LAUNCH):
  Vercel Pro + Railway 2 vCPU 8 GB
  PostgreSQL 4 vCPU 16 GB (single)
  Redis 1 GB (Upstash)
  Cost: ~RM 3,000/mo

100K MAU (GROWTH):
  Vercel Enterprise + Railway 4 vCPU 16 GB × 3
  PostgreSQL + 1 read replica + PgBouncer
  Redis 4 GB (Upstash)
  Cost: ~RM 15,000/mo

1M MAU (SCALE):
  AWS EKS (K8s) × 10 nodes, 8 vCPU 32 GB each
  RDS PostgreSQL + 2 replicas
  ElastiCache Redis 16 GB
  RabbitMQ cluster
  CloudFront + Cloudflare dual CDN
  Cost: ~RM 80,000/mo

10M MAU (HYPERSCALE):
  Multi-region K8s (ap-southeast-1, ap-southeast-3)
  Aurora Global Database
  Redis Cluster (self-hosted, 64 GB)
  Kafka for event streaming
  ClickHouse for real-time analytics
  Cost: ~RM 400,000/mo
```

---

## Section 19: Cost Optimization

### 19.1 Monthly Infrastructure Budget (Year 1)

| Service | Provider | Plan | Monthly Cost |
|---------|----------|------|-------------|
| Frontend | Vercel | Pro | RM 100 |
| Backend | Railway | Pro (2 vCPU, 8 GB) | RM 400 |
| Database | Railway (managed PG) | 4 vCPU, 16 GB | RM 800 |
| Redis | Upstash | 1 GB Standard | RM 100 |
| Search | Algolia | Growth | RM 500 |
| Storage | Supabase | Pro | RM 150 |
| Auth | Clerk | Free (up to 10K MAU) | RM 0 |
| AI (OpenAI) | Pay-per-use | ~10K requests/mo | RM 300 |
| AI (Gemini) | Pay-per-use | ~30K requests/mo | RM 100 |
| CDN | Cloudflare | Free | RM 0 |
| Monitoring | Sentry | Team | RM 200 |
| Analytics | PostHog | Cloud (1M events) | RM 200 |
| CI/CD | GitHub Actions | Free (2000 min) | RM 0 |
| **Total** | | | **~RM 2,850** |

---

## Section 20: Enterprise Infrastructure Roadmap

```
YEAR 1 (2026-2027): Foundation
  Q3: Vercel + Railway deployment, GitHub Actions CI/CD
  Q4: Upstash Redis caching, Sentry error tracking, PostHog analytics
  Q1: Database read replica, PgBouncer connection pooling
  Q2: Load testing (k6), Grafana dashboards, alert rules

YEAR 2 (2027-2028): Maturation
  Q3: Extract recommendation service, notification service
  Q4: RabbitMQ event bus, OpenTelemetry tracing
  Q1: AWS migration planning, Terraform IaC
  Q2: Kubernetes pilot (staging environment)

YEAR 3 (2028-2029): Scale
  Q3: Full AWS EKS migration
  Q4: Multi-region (Singapore + Kuala Lumpur)
  Q1: ClickHouse for real-time analytics
  Q2: Chaos engineering, disaster recovery drills

YEAR 5 (2030): Global
  ASEAN multi-region (3+ regions)
  Aurora Global Database
  Custom CDN rules per country
  99.99% uptime SLO
  Fully automated canary deployments
```

---

*End of Enterprise Infrastructure & DevOps Platform — 20 sections complete.*
