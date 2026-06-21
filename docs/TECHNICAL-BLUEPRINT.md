# ExploreMY AI — System Architecture & Technical Blueprint

> **Classification:** Internal — Engineering Leadership  
> **Version:** 3.0  
> **Authors:** CTO · Principal Software Architect · Principal Cloud Architect  
> **Target Scale:** 10M users · 100M reviews · 10M places · 1B recommendations  
> **Last Updated:** June 2026

---

## Section 1: Architectural Principles

### 1.1 Scalability

> *"Design for 10x. Deploy for 1x. Monitor for 0.1x."*

Every component must scale horizontally. No component shall maintain server-local state that cannot be reconstructed. Database queries must be optimized for the target scale before launch. The architecture must support a 100x growth in traffic without fundamental redesign — only resource allocation changes.

**Implementation:** Stateless application servers behind load balancers. Database replication for read scaling. Redis caching layers. CDN edge caching. Eventual consistency where strong consistency is not required.

### 1.2 Maintainability

> *"Code is read 10x more than written. Optimize for reading."*

Modules shall have clear boundaries, explicit dependencies, and consistent internal structure. Every module must have a single responsibility. Shared kernel provides cross-cutting concerns. Naming conventions must be obvious to any engineer joining the team.

**Implementation:** NestJS modules with explicit imports. Barrel exports (`index.ts`). Colocation of tests. Consistent file naming: `*.service.ts`, `*.controller.ts`, `*.module.ts`, `*.dto.ts`.

### 1.3 Reliability

> *"The platform must degrade gracefully, never fail catastrophically."*

No single point of failure. Every external dependency must have a fallback. User-facing features must work in degraded mode when backend services are unavailable.

**Implementation:** Circuit breakers on external API calls. Fallback data for Maps, Places, AI. Graceful degradation: map unavailable → list view. Redis unavailable → direct DB queries (slower but functional). Health checks with automated failover.

### 1.4 Availability

> *"99.95% uptime. That's 4.38 hours of downtime per year. Budget it carefully."*

Target: 99.5% (Phase 1), 99.95% (Phase 3+). Deployments must be zero-downtime. Database migrations must be backward-compatible. Feature flags enable progressive rollouts with instant rollback.

### 1.5 Security

> *"Security is not a feature. It is a property of the system."*

Defense in depth: Cloudflare WAF → API Gateway → Application Guards → Input Validation → Parameterized Queries → Row-Level Security → Encryption at Rest. Principle of least privilege for all service accounts.

### 1.6 Observability

> *"You cannot improve what you cannot measure. You cannot fix what you cannot see."*

Every request must be traceable (request-id). Every error must be logged with context. Every dependency must be monitored. Dashboards must exist for: API performance, business metrics, error rates, system health.

---

## Section 2: System Overview

### 2.1 Context Diagram (C4 — Level 1)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         EXPLOREMY AI SYSTEM                           │
│                                                                       │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │Tourists  │    │  Locals  │    │Businesses│    │  Admins  │      │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘      │
│       │               │               │               │              │
│       └───────────────┼───────────────┼───────────────┘              │
│                       │               │                              │
│              ┌────────▼────────────────▼────────┐                    │
│              │        CLOUDFLARE CDN/WAF         │                    │
│              └────────┬────────────────┬────────┘                    │
│                       │                │                              │
│           ┌───────────▼──┐    ┌───────▼──────────┐                   │
│           │  VERCEL       │    │  RAILWAY          │                  │
│           │  Next.js Web  │    │  NestJS API       │                  │
│           └───────┬───────┘    └───────┬──────────┘                   │
│                   │                    │                              │
│         ┌─────────┼────────────────────┼──────────┐                  │
│         │         ▼                    ▼          │                  │
│         │  ┌──────────┐    ┌──────────────────┐  │                  │
│         │  │PostgreSQL│    │  Redis (Upstash) │  │                  │
│         │  │(Railway) │    │  Cache/Queue     │  │                  │
│         │  └──────────┘    └──────────────────┘  │                  │
│         │                                         │                  │
│         │  ┌──────────┐    ┌──────────────────┐  │                  │
│         │  │ Supabase │    │  Algolia Search  │  │                  │
│         │  │ Storage  │    │                  │  │                  │
│         │  └──────────┘    └──────────────────┘  │                  │
│         └─────────────────────────────────────────┘                  │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                   EXTERNAL SERVICES                              │ │
│  │  Clerk (Auth) │ Google Maps │ OpenAI │ Gemini │ Stripe │ PostHog│ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 System Boundaries

| Boundary | Technology | Responsibility |
|----------|-----------|----------------|
| **CDN / Edge** | Cloudflare | DDoS protection, WAF, static asset caching, image optimization |
| **Frontend** | Next.js 15 on Vercel | SSR/ISR, client-side rendering, BFF API routes, PWA |
| **Backend** | NestJS on Railway | Business logic, data access, AI orchestration, queue processing |
| **Database** | PostgreSQL 16 on Railway | Primary data store, PostGIS for spatial, pgvector for embeddings |
| **Cache** | Redis on Upstash | Session cache, query cache, rate limiting, job queue (BullMQ) |
| **Search** | Algolia | Full-text search, geo-search, faceting, instant search |
| **Storage** | Supabase Storage | User uploads, photos, merchant assets, documents |
| **Auth** | Clerk | User identity, JWT issuance, social login, MFA |
| **Maps** | Google Maps Platform | Base map tiles, Places API, Directions API, Distance Matrix |
| **AI** | OpenAI + Gemini | Trip planning, recommendations, embeddings, chat |
| **Payments** | Stripe | Subscription billing, payment processing |
| **Analytics** | PostHog | Product analytics, session recording, feature flags |

### 2.3 Domain Boundaries

```
┌────────────────────────────────────────────────────────────┐
│                       CORE DOMAINS                           │
│                                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐      │
│  │  AUTH   │  │  USERS  │  │ PLACES  │  │ REVIEWS  │      │
│  │(Clerk)  │  │         │  │         │  │          │      │
│  └─────────┘  └─────────┘  └─────────┘  └──────────┘      │
│                                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐      │
│  │  MAPS   │  │ ROUTES  │  │   AI    │  │  RECOMM  │      │
│  │(Google) │  │         │  │         │  │  END     │      │
│  └─────────┘  └─────────┘  └─────────┘  └──────────┘      │
│                                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐      │
│  │ SEARCH  │  │EVENTS   │  │  SOCIAL │  │ NOTIF    │      │
│  │(Algolia)│  │         │  │         │  │          │      │
│  └─────────┘  └─────────┘  └─────────┘  └──────────┘      │
│                                                              │
├────────────────────────────────────────────────────────────┤
│                     SUPPORTING DOMAINS                        │
│                                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐      │
│  │MERCHANT │  │ BOOKING │  │ WALLET  │  │ REWARDS  │      │
│  │         │  │         │  │         │  │          │      │
│  └─────────┘  └─────────┘  └─────────┘  └──────────┘      │
│                                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐      │
│  │ANALYTICS│  │LOCATION │  │  TRIPS  │  │FAVORITES │      │
│  │         │  │         │  │         │  │          │      │
│  └─────────┘  └─────────┘  └─────────┘  └──────────┘      │
└────────────────────────────────────────────────────────────┘
```

---

## Section 3: Monorepo Architecture

### 3.1 Structure

```
ExploreMY-AI/
├── apps/
│   ├── web/                      # Next.js 15 frontend (Vercel)
│   │   ├── src/
│   │   │   ├── app/              # App Router (pages, layouts, API routes)
│   │   │   ├── components/       # React components by domain
│   │   │   ├── hooks/            # Custom React hooks
│   │   │   ├── stores/           # Zustand state stores
│   │   │   ├── services/         # Client-side API service layer
│   │   │   ├── providers/        # React context providers
│   │   │   ├── lib/              # Pure utilities
│   │   │   ├── styles/           # Global CSS
│   │   │   └── types/            # Frontend-specific types
│   │   ├── public/               # Static assets
│   │   ├── next.config.ts
│   │   ├── middleware.ts         # Clerk auth middleware
│   │   └── package.json
│   │
│   └── api/                      # NestJS backend (Railway)
│       ├── src/
│       │   ├── modules/          # Feature modules (17 domains)
│       │   ├── common/           # Shared kernel
│       │   ├── config/           # Configuration
│       │   ├── database/         # Prisma service
│       │   ├── queue/            # BullMQ processors
│       │   ├── health/           # Health checks
│       │   └── main.ts           # Entry point
│       └── package.json
│
├── packages/                     # Shared libraries
│   ├── shared/                   # @exploremy/shared — types, enums, validation
│   ├── database/                 # @exploremy/database — Prisma schema + client
│   ├── config/                   # @exploremy/config — env validation
│   └── ui/                       # @exploremy/ui — shared design system
│
├── services/                     # Extractable microservices (Phase 3+)
│   ├── recommendation/
│   ├── notification/
│   ├── search-sync/
│   └── analytics/
│
├── tooling/                      # Dev-only configuration
│   ├── eslint/                   # Shared ESLint configs
│   └── typescript/               # Shared TS configs
│
├── infrastructure/               # IaC
│   ├── terraform/
│   └── kubernetes/
│
├── docker/                       # Dockerfiles + compose
├── .github/workflows/            # CI/CD pipelines
├── scripts/                      # Automation scripts
├── docs/                         # All documentation
├── turbo.json                    # Turborepo pipeline
├── pnpm-workspace.yaml
└── package.json                  # Root workspace
```

### 3.2 Dependency Flow

```
apps/web ──→ packages/shared
apps/web ──→ packages/database (types only)
apps/web ──→ packages/ui
apps/web ──→ packages/config

apps/api ──→ packages/shared
apps/api ──→ packages/database
apps/api ──→ packages/config

packages/database ──→ packages/config
packages/ui ──→ packages/shared

# Rule: apps/* NEVER import from other apps/*
# Rule: packages/* NEVER import from apps/*
# Rule: tooling/* is NEVER imported by application code
```

---

## Section 4: Domain-Driven Design

### 4.1 Places Domain

```
AGGREGATE ROOT: Place
  ├── ENTITY: Place (id, name, slug, category, lat, lng, rating, photos, ...)
  ├── VALUE OBJECT: Address (line, city, state, postcode, country)
  ├── VALUE OBJECT: GeoLocation (lat, lng, location geometry)
  ├── VALUE OBJECT: OpeningHours (day → {open, close})
  ├── VALUE OBJECT: PriceLevel (0-4)
  ├── ENTITY: Review (id, userId, rating, content, photos, tags)
  ├── ENTITY: Photo (id, url, thumbnailUrl, caption, aiTags)
  └── VALUE OBJECT: HiddenGemScore

DOMAIN SERVICES:
  ├── PlaceDiscoveryService: nearby(), search(), filter()
  ├── HiddenGemScoringService: calculateScore()
  ├── TrendingScoreService: calculateTrending()
  └── PlaceSyncService: syncFromGooglePlaces()

REPOSITORY:
  └── PlaceRepository: CRUD + spatial queries
```

### 4.2 Users Domain

```
AGGREGATE ROOT: User
  ├── ENTITY: User (id, clerkId, email, displayName, role)
  ├── VALUE OBJECT: TravelDNA (8 dimensions, confidence)
  ├── VALUE OBJECT: FoodDNA (cuisine preferences, spice tolerance)
  ├── ENTITY: UserPreferences (dietary, budget, transport, privacy)
  ├── ENTITY: Favorite (userId, placeId, listId, notes)
  └── ENTITY: FavoriteList (name, isPublic, coverPhoto)

DOMAIN SERVICES:
  ├── TravelDNAEngine: calculateDNA(), evolveDNA()
  ├── FoodDNAEngine: calculateFoodDNA()
  └── UserProfileService: getProfile(), updateProfile()
```

### 4.3 Trips Domain

```
AGGREGATE ROOT: Trip
  ├── ENTITY: Trip (title, destination, budget, status, shareToken)
  ├── ENTITY: TripDay (dayNumber, date, notes, weather)
  ├── ENTITY: TripStop (order, startTime, endTime, transportFromPrevious)
  └── VALUE OBJECT: TripBudget (total, breakdown by category)

DOMAIN SERVICES:
  ├── TripPlannerService: create(), addDay(), addStop(), reorder()
  ├── TripOptimizerService: optimize route order (TSP)
  └── TripExportService: export PDF, GPX
```

### 4.4 Routes Domain

```
AGGREGATE ROOT: Route
  ├── ENTITY: Route (origin, destination, transportMode, polyline, distance, duration)
  ├── ENTITY: TransportOption (type, provider, price, departureTime, arrivalTime)
  └── VALUE OBJECT: RouteType (FASTEST, CHEAPEST, SCENIC, TOURIST, FOOD)

DOMAIN SERVICES:
  ├── RoutePlanningService: plan(), compare()
  ├── RouteOptimizerService: optimize() — A* + TSP
  └── CarbonCalculatorService: calculateFootprint()
```

---

## Section 5: Frontend Architecture

### 5.1 State Management Strategy

```
┌─────────────────────────────────────────────────────────┐
│                  STATE MANAGEMENT                         │
│                                                           │
│  SERVER STATE (TanStack Query)                            │
│  ├── Nearby places (30s stale)                           │
│  ├── Place detail (5min stale)                           │
│  ├── Search results (instant refetch)                    │
│  ├── Reviews (1min stale)                                │
│  └── Favorites (optimistic updates)                      │
│                                                           │
│  CLIENT STATE (Zustand)                                   │
│  ├── Map viewport (center, zoom)                         │
│  ├── User location (lat, lng, accuracy)                  │
│  ├── UI state (active sheet, selected place)             │
│  ├── Search state (query, filters)                       │
│  └── Onboarding progress                                 │
│                                                           │
│  PERSISTED STATE (Zustand + localStorage)                 │
│  ├── User preferences                                    │
│  ├── Recent searches                                     │
│  ├── Onboarding completion                               │
│  └── Theme preference                                    │
│                                                           │
│  URL STATE (Next.js searchParams)                         │
│  ├── Current page/route                                  │
│  ├── Place slug                                          │
│  └── Share tokens                                        │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Component Architecture

```
Each feature module follows this structure:

features/{feature}/
├── components/        # UI components
│   ├── {Feature}Card.tsx
│   ├── {Feature}List.tsx
│   ├── {Feature}Detail.tsx
│   └── {Feature}Form.tsx
├── hooks/             # Feature-specific hooks
│   ├── use{Feature}.ts
│   └── use{Feature}List.ts
├── services/          # API calls
│   └── {feature}.service.ts
├── stores/            # Zustand store (if needed)
│   └── {feature}-store.ts
└── types.ts           # Feature-specific types
```

---

## Section 6: Backend Architecture

### 6.1 NestJS Module Pattern

```typescript
// Every module follows this exact structure:

modules/{domain}/
├── {domain}.module.ts      // DI registration
├── {domain}.controller.ts  // Route handlers
├── {domain}.service.ts     // Business logic
├── dto/
│   ├── create-{domain}.dto.ts
│   ├── update-{domain}.dto.ts
│   └── query-{domain}.dto.ts
├── entities/
│   └── {domain}.entity.ts  // If not using Prisma types directly
├── {domain}.controller.spec.ts
└── {domain}.service.spec.ts
```

### 6.2 Service Layer Rules

1. **Controllers** handle HTTP concerns only: parsing requests, returning responses, HTTP status codes. Zero business logic.
2. **Services** contain all business logic. Services are the only classes that call repositories/external APIs.
3. **DTOs** use `class-validator` decorators for validation. Every endpoint has input DTOs.
4. **Repositories** are thin wrappers around Prisma. They exist for testability (easy to mock).
5. **No circular dependencies.** If Service A needs Service B and vice versa, extract shared logic into a third service.

---

## Section 7: API Architecture

### 7.1 URL Structure

```
/api/v1/{resource}[/{id}][/{sub-resource}][/{sub-id}]

Examples:
  GET    /api/v1/places/nearby?lat=&lng=&radius=
  GET    /api/v1/places/:slug
  GET    /api/v1/places/:id/reviews
  POST   /api/v1/places/:id/reviews
  GET    /api/v1/users/me/favorites
  POST   /api/v1/favorites
  DELETE /api/v1/favorites/:placeId
  POST   /api/v1/ai/plan-trip
  GET    /api/v1/routes/directions?originLat=&originLng=&destLat=&destLng=&mode=
```

### 7.2 Pagination Standard

```
Request:  ?page=1&limit=20
Response: {
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 243,
    "totalPages": 13
  }
}
Header: X-Total-Count: 243
```

### 7.3 Filtering & Sorting

```
?category=RESTAURANT,CAFE     // IN filter
?priceLevel=1,2               // Range
?rating=4                     // Minimum rating (>=)
?openNow=true                 // Boolean filter
?sortBy=distance              // Sort field
?sortOrder=asc                // asc | desc
```

### 7.4 Error Response Standard

```json
{
  "statusCode": 422,
  "error": "Unprocessable Entity",
  "message": "Validation failed",
  "errors": [
    { "field": "rating", "message": "Rating must be between 1 and 5" }
  ],
  "requestId": "req_abc123",
  "timestamp": "2026-06-14T10:30:00+08:00"
}
```

---

## Section 8: Authorization Architecture

### 8.1 RBAC Implementation

```typescript
// Role hierarchy: higher roles inherit lower role permissions
const ROLE_HIERARCHY = {
  guest:        [],
  user:         ['guest'],
  verified_user: ['user'],
  premium_user: ['verified_user'],
  business_owner: ['user'],
  moderator:    ['verified_user'],
  admin:        ['moderator', 'business_owner', 'premium_user'],
  super_admin:  ['admin'],
};

// Permission check:
// 1. Clerk validates JWT signature
// 2. Extract user role from JWT claims
// 3. NestJS RolesGuard checks: @Roles('admin') → user.role must be 'admin' or inherit from it
```

### 8.2 Permission Decorators

```typescript
@Public()           // No auth required
@Roles('admin')     // Require specific role
@Owner('placeId')   // User must own the resource (business owner)
@RateLimit(100)     // Custom rate limit for this endpoint
```

---

## Section 9: Event-Driven Architecture

### 9.1 Event Catalog

| Event | Publisher | Consumers | Priority |
|-------|-----------|-----------|----------|
| `user.registered` | Auth | User (create profile), Analytics | High |
| `place.viewed` | Places | Analytics (increment counter) | Low |
| `review.created` | Reviews | Places (update rating), Analytics, Notification, Search Sync | High |
| `favorite.added` | Favorites | Recommendation (update signals), Analytics | Medium |
| `trip.created` | Trips | Analytics, Recommendation, Notification | Medium |
| `route.planned` | Routes | Analytics | Low |
| `ai.plan.generated` | AI | Analytics (cost tracking) | Medium |
| `promotion.created` | Merchant | Recommendation (targeted delivery) | Medium |
| `achievement.unlocked` | Gamification | Notification | Medium |

### 9.2 Event Envelope

```typescript
{
  eventId: "evt_3a5b7c9d",           // UUID v7 (time-sortable)
  eventType: "review.created",        // {domain}.{action}
  version: "1.0",                     // Schema version
  timestamp: "2026-06-14T10:30:00Z",  // ISO 8601
  source: "review-service",           // Publishing service
  correlationId: "corr_abc123",       // For distributed tracing
  payload: { ... }                    // Event-specific data
}
```

---

## Section 10: Queue Architecture

### 10.1 Queue Design (BullMQ)

```
Queue               Concurrency  Retries  Backoff       DLQ
────────────────────────────────────────────────────────────
ai.recommendation    3            3        1m, 5m, 15m   ✓
ai.trip-planning     2            2        2m, 10m        ✓
notification.push    10           5        30s, 2m, 10m   ✓
notification.email   5            3        1m, 5m         ✓
search.sync          5            3        1m, 5m         ✓
analytics.event      5            3        1m, 5m         ✓
place.sync           3            3        5m, 30m, 2h    ✓
photo.process        3            2        1m, 5m         ✓
```

### 10.2 Retry Strategy

```typescript
{
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
  removeOnComplete: { age: 3600, count: 1000 },
  removeOnFail: { age: 7 * 24 * 3600 },
}
// After 3 failures → move to DLQ → manual inspection
```

---

## Section 11: Cache Architecture

### 11.1 Redis Key Design

```
Key Pattern                              TTL       Purpose
────────────────────────────────────────────────────────────
place:{slug}                             5m        Place detail
place:nearby:{lat}:{lng}:{cat}           30s       Nearby results
route:{origin}:{dest}:{mode}             1h        Route cache
ai:response:{hash}                       24h       AI response cache
ai:rate-limit:{userId}                   1m        AI rate limit
recommendation:{userId}:{type}           1h        Personalized recs
search:suggestion:{prefix}               10m       Autocomplete
traffic:{lat}:{lng}                      5m        Traffic data
weather:{city}                           30m       Weather data
rate-limit:{ip}:{endpoint}               60s       Rate limiting
```

### 11.2 Cache Invalidation

- **TTL-based:** Default strategy. Let data expire naturally.
- **Write-invalidate:** On place update, delete `place:{slug}` key.
- **Stale-while-revalidate:** Serve cached data while fetching fresh data in background.

---

## Section 12: Search Architecture

### 12.1 Algolia Index Design

```
Index: places
  searchableAttributes:
    - name (ordered)
    - description (unordered)
    - address, city, state (unordered)
    - tags (unordered)
  attributesForFaceting:
    - category (filter only)
    - priceLevel (filter only)
    - city, state (filter only)
    - rating (filter only)
  customRanking:
    - desc(rating)
    - desc(reviewCount)
    - desc(trendingScore)
  geo: { lat, lng }
  replicas:
    - places_rating_desc
    - places_distance_asc
```

### 12.2 Sync Pipeline

```
Prisma write → Debezium/Kafka (future) OR
Prisma write → Queue job (search.sync) → Algolia API (upsert/delete)

Hourly full reindex as safety net
```

---

## Section 13: File Storage Architecture

```
User Upload Flow:
  Browser → Pre-signed URL (Supabase) → Direct upload to bucket → URL stored in DB

Buckets:
  user-content/       — Public read, owner write (RLS)
  merchant-assets/    — Public read, business_owner write (RLS)
  documents/          — Private (verification docs)
  static/             — Public read, CDN cached

Image Transformations:
  ?width=200&height=200&format=webp&quality=80   (thumbnail)
  ?width=800&format=webp&quality=85              (card)
  ?width=1200&format=webp&quality=90             (hero)
```

---

## Section 14: Maps Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    MAPS PLATFORM                           │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ @vis.gl/react-google-maps (React wrapper)            │ │
│  │                                                       │ │
│  │  <APIProvider>                                        │ │
│  │    <Map>                                              │ │
│  │      <AdvancedMarker> × N (place markers)            │ │
│  │      <AdvancedMarker> × 1 (user location)            │ │
│  │      <Polyline> (route display)                      │ │
│  │    </Map>                                             │ │
│  │  </APIProvider>                                       │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Google Maps APIs:                                         │
│  ├── Maps JavaScript API (map rendering)                  │
│  ├── Places API (nearby search, place details)            │
│  ├── Directions API (route planning)                      │
│  ├── Distance Matrix API (multi-origin comparison)        │
│  └── Geocoding API (address → lat/lng)                   │
│                                                            │
│  Internal Services:                                        │
│  ├── PlacesService (proprietary place data + scoring)     │
│  ├── RouteOptimizer (A* + TSP with custom weights)       │
│  └── TransportComparison (12-mode comparison)             │
└──────────────────────────────────────────────────────────┘
```

---

## Section 15: AI System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    AI PLATFORM                              │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              ORCHESTRATION LAYER                      │ │
│  │                                                       │ │
│  │  User Request → Intent Router → Context Builder      │ │
│  │       → Model Selector → Prompt Compiler             │ │
│  │       → LLM Call → Response Parser → Validator       │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              MODEL ROUTING                            │ │
│  │                                                       │ │
│  │  GPT-4o:        Complex trip planning (8s, $0.02)    │ │
│  │  Gemini Flash:   Fast recommendations (2s, $0.003)   │ │
│  │  Custom ML:      Ranking, classification (100ms)     │ │
│  │  text-embed-3:   Embeddings for vector search        │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              MEMORY LAYER                             │ │
│  │                                                       │ │
│  │  Short-term:  Conversation window (last 5 turns)     │ │
│  │  Long-term:   MemoryFact table (persistent facts)    │ │
│  │  Semantic:    pgvector similarity search             │ │
│  │  Behavioral:  Patterns extracted from history        │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              RAG PIPELINE                             │ │
│  │                                                       │ │
│  │  Sources: Tourism Malaysia, reviews, place data      │ │
│  │  → Chunk (512 tokens) → Embed (1536d)                │ │
│  │  → Store (pgvector) → Retrieve (top_k=20)            │ │
│  │  → Re-rank (cross-encoder) → Inject into prompt      │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## Section 16-18: Booking, Analytics & Notifications

These are Phase 2-3 concerns. The architecture is defined in the [Business Cloud Specification](BUSINESS-CLOUD.md) and [Infrastructure Blueprint](INFRASTRUCTURE.md).

### Summary

| System | Architecture | Phase |
|--------|-------------|-------|
| Booking | Event-sourced, Stripe payment, supplier API integration | Phase 3 |
| Analytics | PostHog (product) + ClickHouse/BigQuery (business) | Phase 2 |
| Notifications | BullMQ workers → FCM (push) + SendGrid (email) + Twilio (SMS) | Phase 2 |

---

## Section 19: Observability

### 19.1 Three Pillars

```
METRICS (Prometheus)
  ├── http_requests_total{method, path, status}
  ├── http_request_duration_seconds (histogram, p50/p95/p99)
  ├── db_query_duration_seconds
  ├── redis_hit_ratio
  ├── ai_requests_total{model, type}
  └── ai_cost_total{model}

LOGS (Pino → JSON)
  ├── Every log: { level, time, msg, requestId, userId, ... }
  ├── Levels: trace < debug < info < warn < error < fatal
  └── PII redacted: email → e***@domain, phone → ****1234

TRACES (OpenTelemetry)
  ├── Span: HTTP → Service → DB query
  ├── trace-id propagated across services
  └── Slow spans (>100ms) flagged
```

### 19.2 Alert Rules

| Alert | Condition | Severity |
|-------|-----------|----------|
| High error rate | 5xx > 5% for 5min | Critical |
| High latency | p95 > 2s for 10min | Warning |
| DB connection pool | Usage > 85% | Critical |
| Redis down | ping fails | Critical |
| OpenAI quota | > 90% daily | Warning |

---

## Section 20: Scalability Strategy

### 20.1 Evolution Plan

```
PHASE 1 (0-50K MAU) — Modular Monolith
  • Single NestJS app on Railway (2 vCPU, 8 GB)
  • Single PostgreSQL (4 vCPU, 16 GB)
  • Redis 1 GB (Upstash)
  • Cost: ~RM 3,000/mo

PHASE 2 (50K-200K MAU) — Service Extraction Begins
  • NestJS app × 2 instances
  • PostgreSQL + 1 read replica
  • Redis 4 GB
  • Extract: Recommendation service, Notification service
  • Cost: ~RM 15,000/mo

PHASE 3 (200K-1M MAU) — Full Microservices
  • 8 services on Railway/K8s
  • PostgreSQL + 2 read replicas + PgBouncer
  • Redis 16 GB (or self-hosted cluster)
  • RabbitMQ for event bus
  • Cost: ~RM 50,000/mo

PHASE 4 (1M-10M MAU) — Multi-Region
  • Multi-region (KL + SG + BKK)
  • DB sharding by region
  • CDN edge caching
  • Kubernetes with HPA
  • Cost: ~RM 200,000/mo
```

---

## Section 21: Disaster Recovery

| Scenario | RPO | RTO | Procedure |
|----------|-----|-----|-----------|
| DB instance failure | <1s | 5 min | Auto-failover to replica |
| Region failure | <1s | 15 min | Promote cross-region replica |
| Accidental delete | <1s | 30 min | Point-in-time recovery |
| Full outage | 24h | 2 hours | Restore from daily backup |

**Backups:** WAL archiving (continuous) + Daily pg_dump (30-day retention) + Weekly base backup (90-day retention).

---

## Section 22: Technical Decision Records

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Framework** | Next.js 15 + NestJS | Mature ecosystems, TypeScript-native, large hiring pool |
| **Database** | PostgreSQL + PostGIS | Spatial queries native, pgvector for AI, proven at scale |
| **ORM** | Prisma | Type-safe, great migration tooling, active development |
| **Cache** | Redis (Upstash) | Serverless, no ops, global replication |
| **Search** | Algolia | Managed, geo-search native, instant typo-tolerant search |
| **Auth** | Clerk | Multi-provider, JWT templates, webhooks, generous free tier |
| **AI (Complex)** | GPT-4o | Best reasoning for trip planning, structured JSON output |
| **AI (Simple)** | Gemini 2.5 Flash | Fast + cheap for recommendations, 2s latency |
| **Storage** | Supabase | S3-compatible, RLS policies, built-in CDN, generous free tier |
| **Maps** | Google Maps | Best data quality in Malaysia, mature APIs |
| **Payments** | Stripe | Best developer experience, Malaysia support |
| **Analytics** | PostHog | Open-source, session recording, feature flags |
| **Monorepo** | Turborepo + pnpm | Fast builds, caching, workspace protocol |
| **Queue** | BullMQ (Redis) | Zero infra overhead initially, great NestJS integration |
| **Deployment** | Vercel + Railway | Zero-ops deployment, auto-scaling, preview environments |

---

## Section 23: Engineering Guidelines

### 23.1 Naming Conventions

```
Files:         kebab-case.ts         → place-card.tsx, use-nearby-places.ts
Components:    PascalCase            → PlaceCard, NearbyList
Functions:     camelCase             → getNearbyPlaces, formatDistance
Variables:     camelCase             → userLocation, isOpen
Constants:     UPPER_SNAKE_CASE      → MAX_RADIUS, DEFAULT_ZOOM
Types:         PascalCase            → PlaceResult, NearbyQuery
Interfaces:    PascalCase (no I)     → PlaceDetail, PaginatedResponse
Enums:         PascalCase            → PlaceCategory, TransportMode
DB Tables:     snake_case, plural    → places, business_accounts
DB Columns:    snake_case            → display_name, created_at
API Routes:    kebab-case            → /places/nearby, /ai/plan-trip
Git Branches:  kebab-case            → feat/nearby-search, fix/map-marker
```

### 23.2 Code Standards

```typescript
// ✅ DO: barrel exports
export { PlaceCard } from './place-card';
export { NearbyList } from './nearby-list';

// ✅ DO: explicit return types on service methods
async findNearby(lat: number, lng: number, radius: number): Promise<PlaceResult[]> { ... }

// ✅ DO: typed API responses
interface ApiResponse<T> { data: T; meta?: PaginationMeta; }

// ❌ DON'T: any
const data: any = await fetchPlaces();

// ❌ DON'T: magic numbers
if (distance < 5000) { ... }  // What is 5000?

// ✅ DO: named constants
const DEFAULT_SEARCH_RADIUS_M = 5000;
if (distance < DEFAULT_SEARCH_RADIUS_M) { ... }

// ❌ DON'T: inline styles
<div style={{ color: 'red' }}>

// ✅ DO: Tailwind classes
<div className="text-red-500">
```

---

## Section 24: System Diagrams

### 24.1 Sequence: Nearby Discovery Flow

```
User        Browser        BFF (/api)      NestJS          PostgreSQL     Google Maps
 │              │               │              │                │              │
 │  open app    │               │              │                │              │
 │─────────────►│               │              │                │              │
 │              │  GET /api/    │              │                │              │
 │              │  places/nearby│              │                │              │
 │              │──────────────►│              │                │              │
 │              │               │  GET /places │                │              │
 │              │               │  /nearby     │                │              │
 │              │               │─────────────►│                │              │
 │              │               │              │  SELECT * FROM │              │
 │              │               │              │  places WHERE  │              │
 │              │               │              │  ST_DWithin()  │              │
 │              │               │              │───────────────►│              │
 │              │               │              │◄───────────────│              │
 │              │               │              │                │              │
 │              │               │              │  (optional)    │              │
 │              │               │              │  Google Places │              │
 │              │               │              │  API call      │              │
 │              │               │              │─────────────────────────────►│
 │              │               │              │◄─────────────────────────────│
 │              │               │◄─────────────│                │              │
 │              │◄──────────────│              │                │              │
 │◄─────────────│               │              │                │              │
 │  render map  │               │              │                │              │
 │  + markers   │               │              │                │              │
```

### 24.2 Sequence: AI Trip Planning

```
User        Browser        BFF (/api)      NestJS AI       OpenAI        DB
 │              │               │              │              │            │
 │  fill form   │               │              │              │            │
 │─────────────►│               │              │              │            │
 │              │  POST /api/ai/│              │              │            │
 │              │  plan-trip    │              │              │            │
 │              │──────────────►│              │              │            │
 │              │               │  planTrip()  │              │            │
 │              │               │─────────────►│              │            │
 │              │               │              │  Build       │            │
 │              │               │              │  Context     │            │
 │              │               │              │─────────────►│ (user DNA) │
 │              │               │              │◄─────────────│            │
 │              │               │              │              │            │
 │              │               │              │  GPT-4o API  │            │
 │              │               │              │─────────────►│            │
 │              │               │              │◄─────────────│            │
 │              │               │              │              │            │
 │              │               │              │  Validate    │            │
 │              │               │              │  places exist│            │
 │              │               │              │─────────────►│ (places)   │
 │              │               │              │◄─────────────│            │
 │              │               │◄─────────────│              │            │
 │              │◄──────────────│              │              │            │
 │◄─────────────│               │              │              │            │
 │  render      │               │              │              │            │
 │  itinerary   │               │              │              │            │
```

---

*End of System Architecture & Technical Blueprint — 24 sections complete.*
