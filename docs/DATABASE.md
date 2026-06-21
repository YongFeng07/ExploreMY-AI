# ExploreMY AI — PostgreSQL Database Architecture

> **Author:** Senior Database Architect
> **Version:** 1.0
> **Target:** PostgreSQL 16 + PostGIS 3.4 + pgvector 0.7
> **ORM Layer:** Prisma 6 (typesafe client) over raw SQL where needed

---

## Table of Contents

1. [Entity Relationship Diagram](#1-entity-relationship-diagram)
2. [Schema Design](#2-schema-design)
3. [Table Definitions](#3-table-definitions)
4. [Indexing Strategy](#4-indexing-strategy)
5. [Constraint Matrix](#5-constraint-matrix)
6. [PostGIS Spatial Design](#6-postgis-spatial-design)
7. [Full-Text Search](#7-full-text-search)
8. [AI Vector Search](#8-ai-vector-search)
9. [Partitioning Strategy](#9-partitioning-strategy)
10. [Materialized Views](#10-materialized-views)
11. [Scaling Architecture](#11-scaling-architecture)
12. [Operations & Maintenance](#12-operations--maintenance)

---

## 1. Entity Relationship Diagram

```
                                    ┌──────────────────────┐
                                    │    achievements      │
                                    │  (reference data)    │
                                    └──────────┬───────────┘
                                               │ 1
                                               │
                                               │ N
                                    ┌──────────▼───────────┐
                                    │  user_achievements   │
                                    └──────────┬───────────┘
                                               │ N
                                               │
┌──────────────────────┐            ┌──────────▼───────────┐
│  subscriptions       │            │                      │
│  (Stripe-managed)    │◄───────────│       users          │
└──────────┬───────────┘  1:1..N    │    (core entity)     │
           │                         └──┬──┬──┬──┬──┬──┬──┘
┌──────────▼───────────┐             │  │  │  │  │  │  │
│  business_accounts   │             │  │  │  │  │  │  │
│  (claims places)     │             │  │  │  │  │  │  │
└──┬───────┬───────┬───┘             │  │  │  │  │  │  │
   │       │       │                 │  │  │  │  │  │  │
   │1      │1      │1               1│ 1│ 1│ 1│ 1│ 1│ 1│
   │       │       │                 │  │  │  │  │  │  │
   ▼       ▼       ▼                 ▼  ▼  ▼  ▼  ▼  ▼  ▼
┌──────┐ ┌──────┐ ┌──────────┐   ┌─────────────────────────────────┐
│promo │ │adv   │ │ places   │   │ profiles  favorites  reviews     │
│tions │ │slots │ │(core)    │   │ photos    trips     search_hist  │
└──────┘ └──────┘ └┬──┬──┬───┘   │ loc_hist  notifs    ai_recs      │
                   │  │  │       │ user_pref follows   social_posts  │
                   │  │  │       └─────────────────────────────────┘
                   │  │  │
          ┌────────┘  │  └────────────┐
          │1          │1              │1
          ▼           ▼               ▼
    ┌──────────┐ ┌──────────┐ ┌──────────────┐
    │ reviews  │ │  events  │ │ trip_stops   │
    └────┬─────┘ └──────────┘ └──────┬───────┘
         │                           │N
         │1                          │
         ▼                           ▼
    ┌──────────┐              ┌──────────────┐
    │  photos  │              │  trip_days   │
    └──────────┘              └──────┬───────┘
                                    │N
                                    │
                                    ▼
                              ┌──────────┐
                              │  trips   │
                              └────┬─────┘
                                   │
                                   │ ┌──────────────┐
                                   └─┤ social_posts │
                                     └──────────────┘

                    ┌──────────────────────────────┐
                    │         routes               │
                    │  origin ─────► destination   │
                    └──────────┬───────────────────┘
                               │1
                               │N
                               ▼
                    ┌──────────────────────┐
                    │  transport_options   │
                    └──────────────────────┘

                    ┌──────────────────────┐
                    │   content_reports    │
                    │ (polymorphic FK)     │
                    └──────────────────────┘

                    ┌──────────────────────┐
                    │   api_audit_logs     │
                    └──────────────────────┘
```

### Relationship Summary

| Parent | Child | Cardinality | Delete Rule |
|--------|-------|-------------|-------------|
| `users` | `profiles` | 1:1 | CASCADE |
| `users` | `reviews` | 1:N | CASCADE |
| `users` | `photos` | 1:N | CASCADE |
| `users` | `favorites` | 1:N | CASCADE |
| `users` | `favorite_lists` | 1:N | CASCADE |
| `users` | `trips` | 1:N | CASCADE |
| `users` | `search_history` | 1:N | CASCADE |
| `users` | `location_history` | 1:N | CASCADE |
| `users` | `notifications` | 1:N | CASCADE |
| `users` | `ai_recommendations` | 1:N | CASCADE |
| `users` | `user_achievements` | 1:N | CASCADE |
| `users` | `user_preferences` | 1:1 | CASCADE |
| `users` | `social_posts` | 1:N | CASCADE |
| `users` | `social_comments` | 1:N | CASCADE |
| `users` | `social_likes` | 1:N | CASCADE |
| `users` | `user_follows` (follower) | 1:N | CASCADE |
| `users` | `user_follows` (following) | 1:N | CASCADE |
| `users` | `business_accounts` | 1:N | CASCADE |
| `users` | `subscriptions` | 1:N | CASCADE |
| `users` | `user_devices` | 1:N | CASCADE |
| `users` | `user_sessions` | 1:N | CASCADE |
| `users` | `content_reports` | 1:N | CASCADE |
| `places` | `reviews` | 1:N | CASCADE |
| `places` | `photos` | 1:N | SET NULL |
| `places` | `favorites` | 1:N | CASCADE |
| `places` | `trip_stops` | 1:N | CASCADE |
| `places` | `routes` (origin) | 1:N | CASCADE |
| `places` | `routes` (destination) | 1:N | CASCADE |
| `places` | `events` | 1:N | CASCADE |
| `places` | `ai_recommendations` | 1:N | SET NULL |
| `places` | `location_history` | 1:N | SET NULL |
| `places` | `social_posts` | 1:N | SET NULL |
| `places` | `place_views` | 1:N | CASCADE |
| `business_accounts` | `places` (claimed) | 1:N | SET NULL |
| `business_accounts` | `promotions` | 1:N | CASCADE |
| `business_accounts` | `advertising_slots` | 1:N | CASCADE |
| `business_accounts` | `subscriptions` | 1:N | SET NULL |
| `trips` | `trip_days` | 1:N | CASCADE |
| `trip_days` | `trip_stops` | 1:N | CASCADE |
| `routes` | `transport_options` | 1:N | CASCADE |
| `achievements` | `user_achievements` | 1:N | CASCADE |
| `social_posts` | `social_comments` | 1:N | CASCADE |
| `social_posts` | `social_likes` | 1:N | CASCADE |
| `social_comments` | `social_comments` (reply) | 1:N | SET NULL |

---

## 2. Schema Design

### 2.1 Namespace Strategy

```sql
-- Production schema layout
CREATE SCHEMA IF NOT EXISTS app;        -- Application tables
CREATE SCHEMA IF NOT EXISTS analytics;  -- Materialized views, aggregates
CREATE SCHEMA IF NOT EXISTS audit;      -- Audit logs
CREATE SCHEMA IF NOT EXISTS extensions; -- PostGIS, pgvector, etc.
```

### 2.2 Data Type Decisions

| Concern | Type | Rationale |
|---------|------|-----------|
| Primary Keys | `UUID` (gen_random_uuid_v7) | Time-sortable, globally unique, no collision in multi-master |
| Timestamps | `TIMESTAMPTZ` | Timezone-aware — Malaysia is UTC+8, users span globally |
| Money | `NUMERIC(12,2)` or `INT` (cents) | Avoids float rounding. Use cents for precise calculations |
| Coordinates | `geometry(Point, 4326)` | PostGIS native, SRID 4326 = WGS84 (GPS) |
| JSON | `JSONB` | Indexable, compressible, flexible schema for metadata |
| Text Search | `tsvector` (GIN-indexed) | Malay + English stemming via `simple` dictionary |
| Embeddings | `vector(1536)` | OpenAI text-embedding-3-small dimensionality |
| Enums | Native `ENUM` type | Type safety at DB level, prevents invalid states |
| Soft text | `CITEXT` | Case-insensitive email/user comparison |

### 2.3 Naming Conventions

```
Tables:      snake_case, plural         → users, business_accounts
Columns:     snake_case                 → display_name, created_at
PKs:         id (UUID)                  → users.id
FKs:         {table}_id or meaningful   → user_id, origin_place_id
Indexes:     idx_{table}_{cols}         → idx_places_category_rating
Unique:      uq_{table}_{cols}          → uq_reviews_user_place
Check:       ck_{table}_{rule}          → ck_reviews_rating_range
Foreign Keys: fk_{table}_{ref}          → fk_reviews_user
Default:     meaningful                 → 0, false, 'en', now()
```

---

## 3. Table Definitions

### 3.1 Core User Tables

```sql
-- =============================================================================
-- USERS — Central identity table. All user-scoped entities FK here.
-- =============================================================================
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    clerk_id            VARCHAR(255) NOT NULL,
    email               CITEXT NOT NULL,
    display_name        VARCHAR(100) NOT NULL,
    avatar_url          VARCHAR(2048),
    bio                 VARCHAR(500),
    home_city           VARCHAR(100),
    home_state          VARCHAR(100),
    preferred_language  VARCHAR(10) NOT NULL DEFAULT 'en',
    travel_style        travel_style,
    dietary_preferences JSONB,
    accessibility_needs JSONB,
    role                user_role NOT NULL DEFAULT 'user',
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at          TIMESTAMPTZ,
    last_login_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_users_clerk_id UNIQUE (clerk_id),
    CONSTRAINT uq_users_email UNIQUE (email)
);

-- =============================================================================
-- PROFILES — Denormalized counters for fast reads. Updated via triggers.
-- =============================================================================
CREATE TABLE profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id             UUID NOT NULL,
    followers_count     INTEGER NOT NULL DEFAULT 0,
    following_count     INTEGER NOT NULL DEFAULT 0,
    reviews_count       INTEGER NOT NULL DEFAULT 0,
    photos_count        INTEGER NOT NULL DEFAULT 0,
    achievements_count  INTEGER NOT NULL DEFAULT 0,
    trips_count         INTEGER NOT NULL DEFAULT 0,
    favorites_count     INTEGER NOT NULL DEFAULT 0,
    hidden_gems_found   INTEGER NOT NULL DEFAULT 0,
    level               INTEGER NOT NULL DEFAULT 1,
    xp                  INTEGER NOT NULL DEFAULT 0,
    is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
    is_business_owner   BOOLEAN NOT NULL DEFAULT FALSE,
    social_links        JSONB,
    travel_stats        JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_profiles_user_id UNIQUE (user_id),
    CONSTRAINT fk_profiles_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT ck_profiles_level CHECK (level >= 1),
    CONSTRAINT ck_profiles_xp CHECK (xp >= 0)
);

-- =============================================================================
-- USER PREFERENCES — 1:1 with User. Stores personalization + privacy config.
-- =============================================================================
CREATE TABLE user_preferences (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id                     UUID NOT NULL,
    dietary_restrictions        JSONB,     -- ["halal","vegetarian","no-pork"]
    cuisine_preferences         JSONB,     -- {"malay":0.9,"chinese":0.7,...}
    activity_preferences        JSONB,     -- ["hiking","shopping","beach"]
    budget_level                INTEGER,   -- 1=Budget..4=Luxury
    preferred_transport         JSONB,     -- ["mrt","grab","walking"]
    accessibility               JSONB,     -- {wheelchair:true,hearing:false}
    notification_settings       JSONB,     -- {push:true,email:false,...}
    privacy_settings            JSONB,     -- {shareLocation:true,...}
    ai_personalization_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_prefs_user_id UNIQUE (user_id),
    CONSTRAINT fk_prefs_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
);

-- =============================================================================
-- USER DEVICES — Push notification tokens per platform.
-- =============================================================================
CREATE TABLE user_devices (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id       UUID NOT NULL,
    device_token  VARCHAR(512) NOT NULL,
    platform      VARCHAR(20) NOT NULL,   -- 'ios', 'android', 'web'
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    last_used_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_device_user_token UNIQUE (user_id, device_token),
    CONSTRAINT fk_devices_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
);

-- =============================================================================
-- USER SESSIONS — Active session tracking for security.
-- =============================================================================
CREATE TABLE user_sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id     UUID NOT NULL,
    token       VARCHAR(512) NOT NULL,
    ip_address  INET,
    user_agent  VARCHAR(512),
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_sessions_token UNIQUE (token),
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
);
```

### 3.2 Place Tables

```sql
-- =============================================================================
-- PLACES — Core discovery entity. Hybrid of Google Places data + internal enrichment.
-- =============================================================================
CREATE TABLE places (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    google_place_id         VARCHAR(255),
    slug                    VARCHAR(255) NOT NULL,
    name                    VARCHAR(255) NOT NULL,
    description             TEXT,
    category                place_category NOT NULL,
    subcategory             VARCHAR(100),
    address                 VARCHAR(500),
    city                    VARCHAR(100),
    state                   VARCHAR(100),
    postcode                VARCHAR(10),
    country                 VARCHAR(100) NOT NULL DEFAULT 'Malaysia',
    lat                     DOUBLE PRECISION NOT NULL,
    lng                     DOUBLE PRECISION NOT NULL,
    location                geometry(Point, 4326) GENERATED ALWAYS AS
                                (ST_SetSRID(ST_MakePoint(lng, lat), 4326)) STORED,
    phone                   VARCHAR(20),
    website                 VARCHAR(2048),
    email                   CITEXT,
    price_level             INTEGER,          -- 0=Free, 1=Inexpensive..4=Very Expensive
    rating                  REAL NOT NULL DEFAULT 0,
    review_count            INTEGER NOT NULL DEFAULT 0,
    photos                  JSONB,            -- Primary photo URLs
    opening_hours           JSONB,            -- Structured: {monday:{open:"0800",close:"2200"},...}
    amenities               JSONB,            -- ["wifi","parking","halal","wheelchair",...]
    is_hidden_gem           BOOLEAN NOT NULL DEFAULT FALSE,
    hidden_gem_score        REAL NOT NULL DEFAULT 0,
    is_trending             BOOLEAN NOT NULL DEFAULT FALSE,
    trending_score          REAL NOT NULL DEFAULT 0,
    popularity_score        REAL NOT NULL DEFAULT 0,
    is_claimed              BOOLEAN NOT NULL DEFAULT FALSE,
    claimed_by_business_id  UUID,
    is_permanently_closed   BOOLEAN NOT NULL DEFAULT FALSE,
    metadata                JSONB,
    search_vector           tsvector GENERATED ALWAYS AS (
                                to_tsvector('english', coalesce(name, '') || ' ' ||
                                coalesce(description, '') || ' ' ||
                                coalesce(address, '') || ' ' ||
                                coalesce(city, '') || ' ' ||
                                coalesce(state, ''))
                            ) STORED,
    embedding               vector(1536),     -- OpenAI text-embedding-3-small
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_places_google_place_id UNIQUE (google_place_id),
    CONSTRAINT uq_places_slug UNIQUE (slug),
    CONSTRAINT ck_places_rating CHECK (rating >= 0 AND rating <= 5),
    CONSTRAINT ck_places_price CHECK (price_level >= 0 AND price_level <= 4),
    CONSTRAINT fk_places_business FOREIGN KEY (claimed_by_business_id)
        REFERENCES business_accounts (id) ON DELETE SET NULL
);

-- =============================================================================
-- PLACE VIEWS — Analytics: track every place detail view for popularity.
-- =============================================================================
CREATE TABLE place_views (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    place_id    UUID NOT NULL,
    user_id     UUID,
    source      VARCHAR(50),      -- 'search', 'map', 'nearby', 'trip', 'social', 'ai'
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_place_views_place FOREIGN KEY (place_id)
        REFERENCES places (id) ON DELETE CASCADE,
    CONSTRAINT fk_place_views_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE SET NULL
);
```

### 3.3 Review & Photo Tables

```sql
-- =============================================================================
-- REVIEWS — User reviews with moderation pipeline.
-- =============================================================================
CREATE TABLE reviews (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id           UUID NOT NULL,
    place_id          UUID NOT NULL,
    rating            INTEGER NOT NULL,
    title             VARCHAR(255),
    content           TEXT,
    photos            JSONB,          -- Array of photo URLs
    visit_date        DATE,
    spend_per_person  NUMERIC(10,2),
    tags              JSONB,          -- ["halal","cheap","romantic","family-friendly"]
    is_verified_visit BOOLEAN NOT NULL DEFAULT FALSE,
    helpful_count     INTEGER NOT NULL DEFAULT 0,
    moderation_status review_moderation_status NOT NULL DEFAULT 'pending',
    moderated_by      UUID,
    moderated_at      TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_review_user_place UNIQUE (user_id, place_id),
    CONSTRAINT ck_review_rating CHECK (rating >= 1 AND rating <= 5),
    CONSTRAINT fk_reviews_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_place FOREIGN KEY (place_id)
        REFERENCES places (id) ON DELETE CASCADE
);

-- =============================================================================
-- HELPFUL MARKS — Tracks which users found which reviews helpful.
-- =============================================================================
CREATE TABLE helpful_marks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    review_id   UUID NOT NULL,
    user_id     UUID NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_helpful_review_user UNIQUE (review_id, user_id),
    CONSTRAINT fk_helpful_review FOREIGN KEY (review_id)
        REFERENCES reviews (id) ON DELETE CASCADE,
    CONSTRAINT fk_helpful_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
);

-- =============================================================================
-- PHOTOS — User-uploaded photos with location + AI tags.
-- =============================================================================
CREATE TABLE photos (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id           UUID NOT NULL,
    place_id          UUID,
    review_id         UUID,
    url               VARCHAR(2048) NOT NULL,
    thumbnail_url     VARCHAR(2048),
    caption           VARCHAR(500),
    location_lat      DOUBLE PRECISION,
    location_lng      DOUBLE PRECISION,
    exif_data         JSONB,          -- Camera, lens, aperture, ISO
    is_ai_processed   BOOLEAN NOT NULL DEFAULT FALSE,
    ai_tags           JSONB,          -- ["food:nasi-lemak","ambience:cozy"]
    moderation_status photo_moderation_status NOT NULL DEFAULT 'pending',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_photos_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_photos_place FOREIGN KEY (place_id)
        REFERENCES places (id) ON DELETE SET NULL,
    CONSTRAINT fk_photos_review FOREIGN KEY (review_id)
        REFERENCES reviews (id) ON DELETE SET NULL
);
```

### 3.4 Favorites Tables

```sql
-- =============================================================================
-- FAVORITE LISTS — Named collections (public or private).
-- =============================================================================
CREATE TABLE favorite_lists (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id     UUID NOT NULL,
    name        VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    is_public   BOOLEAN NOT NULL DEFAULT FALSE,
    cover_photo VARCHAR(2048),
    place_count INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_fav_lists_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
);

-- =============================================================================
-- FAVORITES — Individual saved places, optionally in a list.
-- =============================================================================
CREATE TABLE favorites (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id     UUID NOT NULL,
    place_id    UUID NOT NULL,
    list_id     UUID,
    notes       VARCHAR(500),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_fav_user_place UNIQUE (user_id, place_id),
    CONSTRAINT fk_fav_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_fav_place FOREIGN KEY (place_id)
        REFERENCES places (id) ON DELETE CASCADE,
    CONSTRAINT fk_fav_list FOREIGN KEY (list_id)
        REFERENCES favorite_lists (id) ON DELETE SET NULL
);
```

### 3.5 Trip Planning Tables

```sql
-- =============================================================================
-- TRIPS — User-created or AI-generated trip plans.
-- =============================================================================
CREATE TABLE trips (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id           UUID NOT NULL,
    title             VARCHAR(255) NOT NULL,
    description       TEXT,
    cover_photo       VARCHAR(2048),
    destination_city  VARCHAR(100),
    destination_state VARCHAR(100),
    start_date        DATE,
    end_date          DATE,
    budget            NUMERIC(12,2),
    budget_currency   VARCHAR(3) NOT NULL DEFAULT 'MYR',
    travel_style      travel_style,
    is_ai_generated   BOOLEAN NOT NULL DEFAULT FALSE,
    ai_prompt         TEXT,
    ai_model          VARCHAR(50),
    status            trip_status NOT NULL DEFAULT 'draft',
    collaborators     JSONB,
    total_cost        NUMERIC(12,2),
    total_distance    REAL,            -- meters
    carbon_footprint  REAL,            -- grams CO2
    day_count         INTEGER NOT NULL DEFAULT 0,
    is_public         BOOLEAN NOT NULL DEFAULT FALSE,
    share_token       VARCHAR(64),
    view_count        INTEGER NOT NULL DEFAULT 0,
    like_count        INTEGER NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_trips_share_token UNIQUE (share_token),
    CONSTRAINT ck_trips_day_count CHECK (day_count >= 0),
    CONSTRAINT fk_trips_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
);

-- =============================================================================
-- TRIP DAYS — A single day within a trip plan.
-- =============================================================================
CREATE TABLE trip_days (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    trip_id     UUID NOT NULL,
    day_number  INTEGER NOT NULL,
    date        DATE,
    notes       TEXT,
    weather     JSONB,          -- Cached weather: {temp,condition,icon}
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_trip_day_number UNIQUE (trip_id, day_number),
    CONSTRAINT ck_trip_day_number CHECK (day_number >= 1),
    CONSTRAINT fk_trip_days_trip FOREIGN KEY (trip_id)
        REFERENCES trips (id) ON DELETE CASCADE
);

-- =============================================================================
-- TRIP STOPS — Individual place stops within a trip day.
-- =============================================================================
CREATE TABLE trip_stops (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    trip_day_id                 UUID NOT NULL,
    place_id                    UUID NOT NULL,
    "order"                     INTEGER NOT NULL,
    start_time                  TIME,
    end_time                    TIME,
    duration_minutes            INTEGER,
    notes                       TEXT,
    transport_from_previous     transport_mode,
    cost_estimate               NUMERIC(10,2),
    distance_from_previous      REAL,

    CONSTRAINT ck_trip_stop_order CHECK ("order" >= 1),
    CONSTRAINT fk_trip_stops_day FOREIGN KEY (trip_day_id)
        REFERENCES trip_days (id) ON DELETE CASCADE,
    CONSTRAINT fk_trip_stops_place FOREIGN KEY (place_id)
        REFERENCES places (id) ON DELETE CASCADE
);
```

### 3.6 Route & Transport Tables

```sql
-- =============================================================================
-- ROUTES — Pre-computed routes between places. Cached with TTL.
-- =============================================================================
CREATE TABLE routes (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    origin_place_id             UUID NOT NULL,
    destination_place_id        UUID NOT NULL,
    transport_mode              transport_mode NOT NULL,
    polyline                    TEXT,          -- Encoded polyline
    distance_meters             REAL,
    duration_seconds            REAL,
    duration_in_traffic_seconds REAL,
    cost_estimate               NUMERIC(10,2),
    currency                    VARCHAR(3) NOT NULL DEFAULT 'MYR',
    carbon_footprint_grams      REAL,
    waypoints                   JSONB,
    steps                       JSONB,         -- Turn-by-turn instructions
    route_type                  route_type NOT NULL DEFAULT 'fastest',
    scenic_score                REAL NOT NULL DEFAULT 0,
    food_density_score          REAL NOT NULL DEFAULT 0,
    tourist_density_score       REAL NOT NULL DEFAULT 0,
    metadata                    JSONB,
    expires_at                  TIMESTAMPTZ,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_routes_origin FOREIGN KEY (origin_place_id)
        REFERENCES places (id) ON DELETE CASCADE,
    CONSTRAINT fk_routes_dest FOREIGN KEY (destination_place_id)
        REFERENCES places (id) ON DELETE CASCADE
);

-- =============================================================================
-- TRANSPORT OPTIONS — Individual transport choices for a route.
-- =============================================================================
CREATE TABLE transport_options (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    route_id         UUID NOT NULL,
    type             transport_mode NOT NULL,
    provider         VARCHAR(100),     -- 'Grab', 'RapidKL', 'KTM', 'AirAsia'
    price            NUMERIC(10,2),
    currency         VARCHAR(3) NOT NULL DEFAULT 'MYR',
    duration_minutes INTEGER,
    departure_time   TIMESTAMPTZ,
    arrival_time     TIMESTAMPTZ,
    booking_url      VARCHAR(2048),
    metadata         JSONB,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_transport_route FOREIGN KEY (route_id)
        REFERENCES routes (id) ON DELETE CASCADE
);
```

### 3.7 AI & Search Tables

```sql
-- =============================================================================
-- AI RECOMMENDATIONS — Prompt/response log for cost tracking + feedback.
-- =============================================================================
CREATE TABLE ai_recommendations (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id        UUID NOT NULL,
    type           ai_recommendation_type NOT NULL,
    prompt         TEXT NOT NULL,
    response       JSONB,
    model          VARCHAR(50),      -- 'gpt-4o', 'gemini-2.5-flash'
    tokens_used    INTEGER,
    cost_incurred  NUMERIC(10,6),
    latency_ms     INTEGER,
    feedback       VARCHAR(10) DEFAULT 'none',
    feedback_note  TEXT,
    place_id       UUID,
    trip_id        UUID,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_ai_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_ai_place FOREIGN KEY (place_id)
        REFERENCES places (id) ON DELETE SET NULL
);

-- =============================================================================
-- SEARCH HISTORY — User search behavior for personalization.
-- =============================================================================
CREATE TABLE search_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id         UUID NOT NULL,
    query           VARCHAR(500) NOT NULL,
    filters         JSONB,
    results_count   INTEGER,
    clicked_place_id UUID,
    session_id      VARCHAR(100),
    search_lat      DOUBLE PRECISION,
    search_lng      DOUBLE PRECISION,
    duration_ms     INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_search_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_search_place FOREIGN KEY (clicked_place_id)
        REFERENCES places (id) ON DELETE SET NULL
);
```

### 3.8 Notification Table

```sql
-- =============================================================================
-- NOTIFICATIONS — In-app + push notification store.
-- =============================================================================
CREATE TABLE notifications (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id       UUID NOT NULL,
    type          notification_type NOT NULL,
    title         VARCHAR(255) NOT NULL,
    body          TEXT NOT NULL,
    data          JSONB,         -- {placeId, tripId, userId, deepLink}
    image_url     VARCHAR(2048),
    is_read       BOOLEAN NOT NULL DEFAULT FALSE,
    read_at       TIMESTAMPTZ,
    is_actioned   BOOLEAN NOT NULL DEFAULT FALSE,
    actioned_at   TIMESTAMPTZ,
    expires_at    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_notif_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
);
```

### 3.9 Gamification Tables

```sql
-- =============================================================================
-- ACHIEVEMENTS — Reference table of all possible achievements.
-- =============================================================================
CREATE TABLE achievements (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    code        VARCHAR(50) NOT NULL,
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    icon        VARCHAR(100),
    category    VARCHAR(50) NOT NULL,
    xp_reward   INTEGER NOT NULL DEFAULT 0,
    tier        INTEGER NOT NULL DEFAULT 1,   -- 1=Bronze,2=Silver,3=Gold,4=Platinum
    is_hidden   BOOLEAN NOT NULL DEFAULT FALSE,
    criteria    JSONB NOT NULL,               -- {type, threshold, description}

    CONSTRAINT uq_achievements_code UNIQUE (code),
    CONSTRAINT ck_achievement_xp CHECK (xp_reward >= 0),
    CONSTRAINT ck_achievement_tier CHECK (tier >= 1 AND tier <= 4)
);

-- =============================================================================
-- USER ACHIEVEMENTS — Progress tracking per user per achievement.
-- =============================================================================
CREATE TABLE user_achievements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id         UUID NOT NULL,
    achievement_id  UUID NOT NULL,
    progress        REAL NOT NULL DEFAULT 0,  -- 0.0 to 1.0
    is_completed    BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at    TIMESTAMPTZ,
    notified_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_user_achievement UNIQUE (user_id, achievement_id),
    CONSTRAINT ck_ua_progress CHECK (progress >= 0 AND progress <= 1),
    CONSTRAINT fk_ua_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_ua_achievement FOREIGN KEY (achievement_id)
        REFERENCES achievements (id) ON DELETE CASCADE
);
```

### 3.10 Event Table

```sql
-- =============================================================================
-- EVENTS — Local events (festivals, concerts, food fairs, etc.)
-- =============================================================================
CREATE TABLE events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    place_id    UUID,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    start_date  TIMESTAMPTZ NOT NULL,
    end_date    TIMESTAMPTZ,
    type        VARCHAR(100),   -- 'festival','concert','food_fair','exhibition','sports'
    price_range JSONB,          -- {min, max, currency}
    photos      JSONB,
    website     VARCHAR(2048),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    source      VARCHAR(100),   -- 'google','ticketmaster','user_submitted'
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_events_place FOREIGN KEY (place_id)
        REFERENCES places (id) ON DELETE SET NULL
);
```

### 3.11 Business & Monetization Tables

```sql
-- =============================================================================
-- BUSINESS ACCOUNTS — Business owners who claim/manage places.
-- =============================================================================
CREATE TABLE business_accounts (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id                 UUID NOT NULL,
    business_name           VARCHAR(255) NOT NULL,
    business_type           VARCHAR(100),
    registration_number     VARCHAR(50),
    phone                   VARCHAR(20),
    email                   CITEXT,
    website                 VARCHAR(2048),
    description             TEXT,
    logo_url                VARCHAR(2048),
    verification_status     business_verification_status NOT NULL DEFAULT 'unverified',
    verified_at             TIMESTAMPTZ,
    subscription_tier       subscription_plan NOT NULL DEFAULT 'free',
    subscription_expires_at TIMESTAMPTZ,
    analytics               JSONB,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_business_reg_no UNIQUE (registration_number),
    CONSTRAINT fk_business_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
);

-- =============================================================================
-- SUBSCRIPTIONS — Stripe-managed subscriptions.
-- =============================================================================
CREATE TABLE subscriptions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id                 UUID NOT NULL,
    business_id             UUID,
    plan                    subscription_plan NOT NULL,
    status                  subscription_status NOT NULL,
    stripe_subscription_id  VARCHAR(255),
    stripe_customer_id      VARCHAR(255),
    current_period_start    TIMESTAMPTZ,
    current_period_end      TIMESTAMPTZ,
    canceled_at             TIMESTAMPTZ,
    trial_end_at            TIMESTAMPTZ,
    metadata                JSONB,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_subs_stripe_id UNIQUE (stripe_subscription_id),
    CONSTRAINT fk_subs_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_subs_business FOREIGN KEY (business_id)
        REFERENCES business_accounts (id) ON DELETE SET NULL
);

-- =============================================================================
-- PROMOTIONS — Time-limited deals created by business owners.
-- =============================================================================
CREATE TABLE promotions (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    business_id        UUID NOT NULL,
    place_id           UUID,
    title              VARCHAR(255) NOT NULL,
    description        TEXT,
    discount_type      VARCHAR(50),       -- 'percentage','fixed','bogo','free_item'
    discount_value     NUMERIC(10,2),
    promo_code         VARCHAR(50),
    terms_conditions   TEXT,
    start_date         TIMESTAMPTZ NOT NULL,
    end_date           TIMESTAMPTZ NOT NULL,
    is_active          BOOLEAN NOT NULL DEFAULT TRUE,
    redemption_count   INTEGER NOT NULL DEFAULT 0,
    metadata           JSONB,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_promotions_business FOREIGN KEY (business_id)
        REFERENCES business_accounts (id) ON DELETE CASCADE,
    CONSTRAINT ck_promo_dates CHECK (end_date > start_date)
);

-- =============================================================================
-- ADVERTISING SLOTS — Paid ad placements.
-- =============================================================================
CREATE TABLE advertising_slots (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    business_id   UUID NOT NULL,
    name          VARCHAR(200) NOT NULL,
    slot_type     VARCHAR(50) NOT NULL,     -- 'search_promoted','home_banner','category_featured'
    place_id      UUID,
    image_url     VARCHAR(2048),
    target_url    VARCHAR(2048),
    budget        NUMERIC(12,2),
    impressions   INTEGER NOT NULL DEFAULT 0,
    clicks        INTEGER NOT NULL DEFAULT 0,
    start_date    TIMESTAMPTZ NOT NULL,
    end_date      TIMESTAMPTZ NOT NULL,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_ads_business FOREIGN KEY (business_id)
        REFERENCES business_accounts (id) ON DELETE CASCADE,
    CONSTRAINT ck_ads_dates CHECK (end_date > start_date)
);

-- =============================================================================
-- COUPONS — Promo codes that users can redeem at businesses.
-- =============================================================================
CREATE TABLE coupons (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    promotion_id    UUID,
    business_id     UUID NOT NULL,
    code            VARCHAR(50) NOT NULL,
    discount_type   VARCHAR(50) NOT NULL,    -- 'percentage','fixed','free_item'
    discount_value  NUMERIC(10,2) NOT NULL,
    min_spend       NUMERIC(10,2),
    max_discount    NUMERIC(10,2),
    usage_limit     INTEGER,                 -- NULL = unlimited
    used_count      INTEGER NOT NULL DEFAULT 0,
    user_limit      INTEGER NOT NULL DEFAULT 1,  -- per-user usage limit
    start_date      TIMESTAMPTZ NOT NULL,
    end_date        TIMESTAMPTZ NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    terms           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_coupons_code UNIQUE (code),
    CONSTRAINT ck_coupon_dates CHECK (end_date > start_date),
    CONSTRAINT ck_coupon_usage CHECK (used_count >= 0),
    CONSTRAINT fk_coupons_promotion FOREIGN KEY (promotion_id)
        REFERENCES promotions (id) ON DELETE SET NULL,
    CONSTRAINT fk_coupons_business FOREIGN KEY (business_id)
        REFERENCES business_accounts (id) ON DELETE CASCADE
);

-- =============================================================================
-- COUPON REDEMPTIONS — Tracks individual coupon usage.
-- =============================================================================
CREATE TABLE coupon_redemptions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    coupon_id   UUID NOT NULL,
    user_id     UUID NOT NULL,
    place_id    UUID,
    discount_applied NUMERIC(10,2),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_coupon_user UNIQUE (coupon_id, user_id),
    CONSTRAINT fk_redemption_coupon FOREIGN KEY (coupon_id)
        REFERENCES coupons (id) ON DELETE CASCADE,
    CONSTRAINT fk_redemption_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
);
```

### 3.12 Social Tables

```sql
-- =============================================================================
-- SOCIAL POSTS — User-generated content in the social feed.
-- =============================================================================
CREATE TABLE social_posts (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id       UUID NOT NULL,
    content       TEXT,
    photos        JSONB,         -- [{url, thumbnailUrl, caption, aiTags}]
    place_id      UUID,
    trip_id       UUID,
    like_count    INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0,
    share_count   INTEGER NOT NULL DEFAULT 0,
    view_count    INTEGER NOT NULL DEFAULT 0,
    is_public     BOOLEAN NOT NULL DEFAULT TRUE,
    location_lat  DOUBLE PRECISION,
    location_lng  DOUBLE PRECISION,
    location_name VARCHAR(255),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_posts_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_posts_place FOREIGN KEY (place_id)
        REFERENCES places (id) ON DELETE SET NULL,
    CONSTRAINT fk_posts_trip FOREIGN KEY (trip_id)
        REFERENCES trips (id) ON DELETE SET NULL
);

-- =============================================================================
-- SOCIAL COMMENTS — Nested comment threads on posts.
-- =============================================================================
CREATE TABLE social_comments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    post_id     UUID NOT NULL,
    user_id     UUID NOT NULL,
    parent_id   UUID,                -- NULL = top-level, else reply
    content     TEXT NOT NULL,
    like_count  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_comments_post FOREIGN KEY (post_id)
        REFERENCES social_posts (id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id)
        REFERENCES social_comments (id) ON DELETE SET NULL
);

-- =============================================================================
-- SOCIAL LIKES — Many-to-many: users ↔ posts.
-- =============================================================================
CREATE TABLE social_likes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    post_id     UUID NOT NULL,
    user_id     UUID NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_like_post_user UNIQUE (post_id, user_id),
    CONSTRAINT fk_likes_post FOREIGN KEY (post_id)
        REFERENCES social_posts (id) ON DELETE CASCADE,
    CONSTRAINT fk_likes_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
);

-- =============================================================================
-- USER FOLLOWS — Many-to-many: users ↔ users.
-- =============================================================================
CREATE TABLE user_follows (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    follower_id   UUID NOT NULL,
    following_id  UUID NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_follow UNIQUE (follower_id, following_id),
    CONSTRAINT ck_follow_not_self CHECK (follower_id <> following_id),
    CONSTRAINT fk_follow_follower FOREIGN KEY (follower_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_follow_following FOREIGN KEY (following_id)
        REFERENCES users (id) ON DELETE CASCADE
);
```

### 3.13 Content Moderation Table

```sql
-- =============================================================================
-- CONTENT REPORTS — User reports for moderation. Polymorphic target.
-- =============================================================================
CREATE TABLE content_reports (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    reporter_id      UUID NOT NULL,
    reason           content_report_reason NOT NULL,
    description      TEXT,
    status           content_report_status NOT NULL DEFAULT 'pending',
    target_review_id UUID,
    target_photo_id  UUID,
    target_post_id   UUID,
    target_comment_id UUID,
    target_user_id   UUID,
    reviewed_by      UUID,
    reviewed_at      TIMESTAMPTZ,
    resolution       TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id)
        REFERENCES users (id) ON DELETE CASCADE
);
```

### 3.14 Location History Table

```sql
-- =============================================================================
-- LOCATION HISTORY — GPS breadcrumb trail. HIGH WRITE VOLUME — partitioned.
-- =============================================================================
CREATE TABLE location_history (
    id          UUID DEFAULT gen_random_uuid_v7(),
    user_id     UUID NOT NULL,
    lat         DOUBLE PRECISION NOT NULL,
    lng         DOUBLE PRECISION NOT NULL,
    accuracy    REAL,
    speed       REAL,
    heading     REAL,
    altitude    REAL,
    activity    VARCHAR(50),
    place_id    UUID,
    city        VARCHAR(100),
    state       VARCHAR(100),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_loc_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_loc_place FOREIGN KEY (place_id)
        REFERENCES places (id) ON DELETE SET NULL
) PARTITION BY RANGE (recorded_at);

-- Monthly partitions (created via pg_partman or manual DDL)
CREATE TABLE location_history_2026_07
    PARTITION OF location_history
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

CREATE TABLE location_history_2026_08
    PARTITION OF location_history
    FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
```

### 3.15 Analytics & Audit Tables

```sql
-- =============================================================================
-- API AUDIT LOG — Every API request for security + compliance.
-- =============================================================================
CREATE TABLE audit.api_audit_logs (
    id           UUID DEFAULT gen_random_uuid_v7(),
    user_id      UUID,
    method       VARCHAR(10) NOT NULL,
    path         VARCHAR(500) NOT NULL,
    status_code  INTEGER NOT NULL,
    duration_ms  INTEGER NOT NULL,
    ip_address   INET,
    user_agent   VARCHAR(512),
    request_id   VARCHAR(100),
    metadata     JSONB,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (created_at);

-- =============================================================================
-- DAILY ANALYTICS SNAPSHOT — Materialized from raw tables for dashboards.
-- =============================================================================
CREATE TABLE analytics.daily_snapshots (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    snapshot_date       DATE NOT NULL,
    metric_name         VARCHAR(100) NOT NULL,
    dimension           VARCHAR(100),       -- 'category', 'city', 'plan'
    dimension_value     VARCHAR(255),
    metric_value        NUMERIC NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_daily_snapshot UNIQUE (snapshot_date, metric_name, dimension, dimension_value)
);
```

---

## 4. Indexing Strategy

### 4.1 Index Design Principles

| Principle | Implementation |
|-----------|---------------|
| **Hot path first** | Index the WHERE + JOIN + ORDER BY columns of top 20 queries |
| **Covering indexes** | INCLUDE frequently selected columns to avoid heap fetches |
| **Partial indexes** | Index only active/visible rows to reduce index size |
| **BRIN for time-series** | Block Range INdex for append-only tables (location_history, audit_logs) |
| **GIN for JSON/tsvector** | Generalized Inverted Index for full-text + JSON containment |
| **GiST for spatial** | PostGIS spatial index for ST_DWithin, ST_Distance, && (bbox) |
| **B-tree for sort/range** | Default index type — covers equality, range, sort operations |
| **No redundant indexes** | (a,b) covers (a) — don't create both |

### 4.2 Critical Indexes

```sql
-- =============================================================================
-- USERS — Fast Clerk lookup + email search
-- =============================================================================
CREATE INDEX idx_users_clerk_id ON users (clerk_id);
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role ON users (role) WHERE is_deleted = FALSE;
CREATE INDEX idx_users_created ON users (created_at) WHERE is_deleted = FALSE;

-- =============================================================================
-- PLACES — Spatial + category + full-text search
-- =============================================================================
-- Spatial index (PostGIS GiST)
CREATE INDEX idx_places_location ON places USING GIST (location);

-- Category + rating for filtered discovery
CREATE INDEX idx_places_category_rating ON places (category, rating DESC)
    WHERE is_permanently_closed = FALSE;

-- City-based browsing
CREATE INDEX idx_places_city_category ON places (city, category)
    WHERE is_permanently_closed = FALSE;

-- Hidden gem discovery — partial index
CREATE INDEX idx_places_hidden_gems ON places (hidden_gem_score DESC)
    WHERE is_hidden_gem = TRUE AND is_permanently_closed = FALSE;

-- Trending — partial index
CREATE INDEX idx_places_trending ON places (trending_score DESC)
    WHERE is_trending = TRUE AND is_permanently_closed = FALSE;

-- Popularity for general ranking
CREATE INDEX idx_places_popularity ON places (popularity_score DESC)
    WHERE is_permanently_closed = FALSE;

-- Slugs for URL lookups
CREATE INDEX idx_places_slug ON places (slug);

-- Full-text search (GIN)
CREATE INDEX idx_places_search_vector ON places USING GIN (search_vector);

-- Embedding similarity (IVFFlat for pgvector)
CREATE INDEX idx_places_embedding ON places
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Covering index for place list queries (avoids heap fetch)
CREATE INDEX idx_places_list ON places (category, rating DESC, review_count DESC)
    INCLUDE (id, slug, name, lat, lng, price_level, is_open, photos)
    WHERE is_permanently_closed = FALSE;

-- Name search with trigram similarity
CREATE INDEX idx_places_name_trgm ON places USING GIN (name gin_trgm_ops);

-- =============================================================================
-- REVIEWS — Place reviews with moderation filter
-- =============================================================================
CREATE INDEX idx_reviews_place_rating ON reviews (place_id, rating DESC)
    WHERE moderation_status = 'approved';
CREATE INDEX idx_reviews_place_created ON reviews (place_id, created_at DESC)
    WHERE moderation_status = 'approved';
CREATE INDEX idx_reviews_user ON reviews (user_id, created_at DESC);
CREATE INDEX idx_reviews_moderation ON reviews (moderation_status, created_at)
    WHERE moderation_status = 'pending';

-- =============================================================================
-- FAVORITES — User favorites lookup
-- =============================================================================
CREATE INDEX idx_favorites_user ON favorites (user_id, created_at DESC);
CREATE INDEX idx_favorites_place ON favorites (place_id);
CREATE INDEX idx_favorites_list ON favorites (list_id);

-- =============================================================================
-- TRIPS — User trip management
-- =============================================================================
CREATE INDEX idx_trips_user_status ON trips (user_id, status);
CREATE INDEX idx_trips_public ON trips (is_public, like_count DESC)
    WHERE is_public = TRUE;
CREATE INDEX idx_trips_share ON trips (share_token) WHERE share_token IS NOT NULL;

-- =============================================================================
-- TRIP STOPS — Ordered stops within a day
-- =============================================================================
CREATE INDEX idx_trip_stops_day ON trip_stops (trip_day_id, "order");
CREATE INDEX idx_trip_stops_place ON trip_stops (place_id);

-- =============================================================================
-- ROUTES — Route lookup by origin-destination pair
-- =============================================================================
CREATE INDEX idx_routes_od ON routes (origin_place_id, destination_place_id, transport_mode);
CREATE INDEX idx_routes_expiry ON routes (expires_at) WHERE expires_at IS NOT NULL;

-- =============================================================================
-- LOCATION HISTORY — Time-series (partitioned by month)
-- =============================================================================
CREATE INDEX idx_loc_history_user_time ON location_history (user_id, recorded_at DESC);
CREATE INDEX idx_loc_history_time ON location_history USING BRIN (recorded_at);
CREATE INDEX idx_loc_history_place ON location_history (place_id);

-- =============================================================================
-- NOTIFICATIONS — Unread-first query pattern
-- =============================================================================
CREATE INDEX idx_notif_user_unread ON notifications (user_id, created_at DESC)
    WHERE is_read = FALSE;

-- =============================================================================
-- SOCIAL — Feed queries
-- =============================================================================
CREATE INDEX idx_posts_user_created ON social_posts (user_id, created_at DESC);
CREATE INDEX idx_posts_created ON social_posts (created_at DESC);
CREATE INDEX idx_comments_post ON social_comments (post_id, created_at);
CREATE INDEX idx_likes_post ON social_likes (post_id);
CREATE INDEX idx_follows_follower ON user_follows (follower_id);
CREATE INDEX idx_follows_following ON user_follows (following_id);

-- =============================================================================
-- AI RECOMMENDATIONS — User history
-- =============================================================================
CREATE INDEX idx_ai_user_type ON ai_recommendations (user_id, type, created_at DESC);

-- =============================================================================
-- SEARCH HISTORY — User search logging
-- =============================================================================
CREATE INDEX idx_search_user ON search_history (user_id, created_at DESC);
CREATE INDEX idx_search_session ON search_history (session_id);

-- =============================================================================
-- BUSINESS — Claimed places lookup
-- =============================================================================
CREATE INDEX idx_business_user ON business_accounts (user_id);
CREATE INDEX idx_business_verification ON business_accounts (verification_status);

-- =============================================================================
-- PROMOTIONS / ADS / COUPONS — Active + date-range queries
-- =============================================================================
CREATE INDEX idx_promos_active_dates ON promotions (is_active, start_date, end_date)
    WHERE is_active = TRUE;
CREATE INDEX idx_ads_active_dates ON advertising_slots (is_active, slot_type, start_date, end_date)
    WHERE is_active = TRUE;
CREATE INDEX idx_coupons_code ON coupons (code);
CREATE INDEX idx_coupons_active_dates ON coupons (is_active, start_date, end_date)
    WHERE is_active = TRUE;

-- =============================================================================
-- PLACE VIEWS — Analytics queries
-- =============================================================================
CREATE INDEX idx_place_views_place_time ON place_views (place_id, created_at);
CREATE INDEX idx_place_views_source ON place_views (source, created_at);

-- =============================================================================
-- AUDIT LOGS — Partitioned by month, BRIN index
-- =============================================================================
CREATE INDEX idx_audit_user ON audit.api_audit_logs (user_id);
CREATE INDEX idx_audit_time ON audit.api_audit_logs USING BRIN (created_at);
CREATE INDEX idx_audit_status ON audit.api_audit_logs (status_code, created_at);
```

### 4.3 Index Summary Matrix

| Table | Indexes | Type | Notes |
|-------|---------|------|-------|
| `users` | 4 | B-tree | Clerk ID, email, role, created |
| `places` | 12 | GiST, GIN, B-tree, IVFFlat | Spatial, FTS, category, embeddings |
| `reviews` | 5 | B-tree (partial) | Moderation-filtered for public queries |
| `favorites` | 3 | B-tree | User, place, list lookups |
| `trips` | 3 | B-tree | User+status composite |
| `trip_stops` | 2 | B-tree | Day+order, place FK |
| `routes` | 2 | B-tree | Origin-destination composite |
| `location_history` | 3 | BRIN + B-tree | Partitioned, time-series |
| `notifications` | 1 | B-tree (partial) | Unread-only index |
| `social_*` | 6 | B-tree | Feed, comment thread, like queries |
| `ai_recommendations` | 1 | B-tree | User+type composite |
| `search_history` | 2 | B-tree | User, session queries |
| `business_*` | 2 | B-tree | User, verification status |
| `promotions/ads/coupons` | 5 | B-tree (partial) | Active + date-range composites |
| `place_views` | 2 | B-tree | Time-series place analytics |
| `audit_logs` | 3 | BRIN + B-tree | Partitioned, compliance queries |
| **Total** | **56** | | |

---

## 5. Constraint Matrix

### 5.1 Check Constraints

| Table | Constraint | Rule |
|-------|-----------|------|
| `users` | — | `is_deleted` boolean only |
| `profiles` | `ck_profiles_level` | `level >= 1` |
| `profiles` | `ck_profiles_xp` | `xp >= 0` |
| `places` | `ck_places_rating` | `rating >= 0 AND rating <= 5` |
| `places` | `ck_places_price` | `price_level >= 0 AND price_level <= 4` |
| `reviews` | `ck_review_rating` | `rating >= 1 AND rating <= 5` |
| `trips` | `ck_trips_day_count` | `day_count >= 0` |
| `trip_days` | `ck_trip_day_number` | `day_number >= 1` |
| `trip_stops` | `ck_trip_stop_order` | `"order" >= 1` |
| `achievements` | `ck_achievement_xp` | `xp_reward >= 0` |
| `achievements` | `ck_achievement_tier` | `tier >= 1 AND tier <= 4` |
| `user_achievements` | `ck_ua_progress` | `progress >= 0 AND progress <= 1` |
| `promotions` | `ck_promo_dates` | `end_date > start_date` |
| `advertising_slots` | `ck_ads_dates` | `end_date > start_date` |
| `coupons` | `ck_coupon_dates` | `end_date > start_date` |
| `coupons` | `ck_coupon_usage` | `used_count >= 0` |
| `user_follows` | `ck_follow_not_self` | `follower_id <> following_id` |

### 5.2 Unique Constraints

| Table | Constraint | Columns |
|-------|-----------|---------|
| `users` | `uq_users_clerk_id` | `clerk_id` |
| `users` | `uq_users_email` | `email` |
| `profiles` | `uq_profiles_user_id` | `user_id` |
| `user_preferences` | `uq_prefs_user_id` | `user_id` |
| `places` | `uq_places_google_place_id` | `google_place_id` |
| `places` | `uq_places_slug` | `slug` |
| `reviews` | `uq_review_user_place` | `user_id, place_id` |
| `helpful_marks` | `uq_helpful_review_user` | `review_id, user_id` |
| `favorites` | `uq_fav_user_place` | `user_id, place_id` |
| `trip_days` | `uq_trip_day_number` | `trip_id, day_number` |
| `user_achievements` | `uq_user_achievement` | `user_id, achievement_id` |
| `achievements` | `uq_achievements_code` | `code` |
| `trips` | `uq_trips_share_token` | `share_token` |
| `social_likes` | `uq_like_post_user` | `post_id, user_id` |
| `user_follows` | `uq_follow` | `follower_id, following_id` |
| `user_devices` | `uq_device_user_token` | `user_id, device_token` |
| `user_sessions` | `uq_sessions_token` | `token` |
| `coupons` | `uq_coupons_code` | `code` |
| `coupon_redemptions` | `uq_coupon_user` | `coupon_id, user_id` |
| `subscriptions` | `uq_subs_stripe_id` | `stripe_subscription_id` |
| `business_accounts` | `uq_business_reg_no` | `registration_number` |
| `analytics.daily_snapshots` | `uq_daily_snapshot` | `snapshot_date, metric_name, dimension, dimension_value` |

### 5.3 Foreign Key Cascades

| Delete Rule | Tables | Rationale |
|-------------|--------|-----------|
| **CASCADE** | Users → {profile, reviews, favorites, trips, social_posts, social_comments, achievements, etc.} | User deletion removes all personal data (GDPR) |
| **CASCADE** | Places → {reviews, favorites, trip_stops, routes} | Removing a place invalidates dependent data |
| **CASCADE** | Business → {promotions, coupons, advertising_slots} | Business closure removes active campaigns |
| **CASCADE** | Trips → {trip_days → trip_stops} | Deep cascade: trip deletion removes all days + stops |
| **SET NULL** | Places → {photos, social_posts, events, ai_recommendations} | Content survives without place reference |
| **SET NULL** | Reviews → photos | Photos survive if review is deleted |
| **SET NULL** | Business → {places(claimed), subscriptions} | Place remains but loses business claim |

---

## 6. PostGIS Spatial Design

### 6.1 Geometry Column

```sql
-- Stored generated column — auto-computed from lat/lng
ALTER TABLE places ADD COLUMN location geometry(Point, 4326)
    GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lng, lat), 4326)) STORED;
```

### 6.2 Common Spatial Queries

```sql
-- =============================================================================
-- NEARBY DISCOVERY — Find places within radius (meters)
-- =============================================================================
SELECT id, name, category, rating,
       ST_Distance(location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography) AS distance_m
FROM places
WHERE ST_DWithin(
    location,
    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
    :radius_meters
)
AND is_permanently_closed = FALSE
AND (:category IS NULL OR category = :category)
ORDER BY distance_m
LIMIT 20;

-- =============================================================================
-- MAP BOUNDS — Places within visible map viewport
-- =============================================================================
SELECT id, name, lat, lng, category, rating
FROM places
WHERE location && ST_MakeEnvelope(:sw_lng, :sw_lat, :ne_lng, :ne_lat, 4326)
AND is_permanently_closed = FALSE
LIMIT 100;

-- =============================================================================
-- CLUSTERING — Count places per hexagon (H3 or S2 grid)
-- =============================================================================
SELECT ST_GeoHash(location, 7) AS geohash,
       COUNT(*) AS place_count,
       AVG(rating) AS avg_rating
FROM places
WHERE location && ST_MakeEnvelope(:sw_lng, :sw_lat, :ne_lng, :ne_lat, 4326)
GROUP BY geohash;
```

---

## 7. Full-Text Search

### 7.1 Configuration

```sql
-- Create Malaysian-optimized text search configuration
CREATE TEXT SEARCH DICTIONARY malay_simple (
    TEMPLATE = pg_catalog.simple
);

CREATE TEXT SEARCH CONFIGURATION malay (COPY = simple);
ALTER TEXT SEARCH CONFIGURATION malay
    ALTER MAPPING FOR asciiword, word, hword_asciipart, hword_part
    WITH malay_simple;

-- Update place search_vector trigger
CREATE OR REPLACE FUNCTION places_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('malay', coalesce(NEW.name, '')), 'A') ||
        setweight(to_tsvector('malay', coalesce(NEW.description, '')), 'B') ||
        setweight(to_tsvector('malay', coalesce(NEW.address, '')), 'C') ||
        setweight(to_tsvector('malay', coalesce(NEW.city, '')), 'B') ||
        setweight(to_tsvector('malay', coalesce(NEW.state, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_places_search_vector
    BEFORE INSERT OR UPDATE ON places
    FOR EACH ROW EXECUTE FUNCTION places_search_vector_update();
```

### 7.2 Search Queries

```sql
-- Ranked full-text search with spatial bias
SELECT id, name, category, rating,
       ts_rank(search_vector, plainto_tsquery('malay', :query)) *
       (1.0 / (1.0 + ST_Distance(location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography) / 1000.0))
       AS combined_score
FROM places
WHERE search_vector @@ plainto_tsquery('malay', :query)
  AND is_permanently_closed = FALSE
ORDER BY combined_score DESC
LIMIT 20;
```

---

## 8. AI Vector Search

### 8.1 Embedding Storage

```sql
-- OpenAI text-embedding-3-small → 1536 dimensions
-- Generated by backend when place is created/updated
ALTER TABLE places ADD COLUMN embedding vector(1536);

-- IVFFlat index for approximate nearest neighbor search
-- Rebuild after significant data changes (e.g., weekly)
CREATE INDEX idx_places_embedding ON places
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
```

### 8.2 Semantic Similarity Query

```sql
-- Find semantically similar places based on AI description embedding
SELECT id, name, category,
       1 - (embedding <=> :query_embedding) AS similarity
FROM places
WHERE is_permanently_closed = FALSE
  AND embedding IS NOT NULL
ORDER BY embedding <=> :query_embedding
LIMIT 10;
```

---

## 9. Partitioning Strategy

### 9.1 Partitioned Tables

| Table | Partition Key | Interval | Retention | Rationale |
|-------|--------------|----------|-----------|-----------|
| `location_history` | `recorded_at` | Monthly | 6 months | High write (1K+ rows/sec at 500K MAU), old data archived |
| `audit.api_audit_logs` | `created_at` | Monthly | 12 months | Compliance requirement, rarely queried beyond 30 days |
| `search_history` | `created_at` | Monthly | 3 months | High write, low query beyond recent history |

### 9.2 Partition Management

```sql
-- Automated via pg_partman extension or cron-triggered script:
-- 1. Create next month's partition 3 days before month end
-- 2. Detach + archive partitions older than retention period
-- 3. Run ANALYZE on new partition after creation

-- Example: Create next month partition
CREATE TABLE location_history_2026_09
    PARTITION OF location_history
    FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

-- Example: Detach old partition
ALTER TABLE location_history DETACH PARTITION location_history_2026_01;
-- Then: pg_dump → archive to S3 → DROP TABLE
```

---

## 10. Materialized Views

### 10.1 Analytics Views

```sql
-- =============================================================================
-- MV: Place leaderboard by category + city (refreshed hourly)
-- =============================================================================
CREATE MATERIALIZED VIEW analytics.place_leaderboard AS
SELECT category, city, id, name, slug, rating, review_count,
       trending_score, hidden_gem_score,
       rank() OVER (PARTITION BY category, city ORDER BY trending_score DESC) AS rank
FROM places
WHERE is_permanently_closed = FALSE
  AND review_count >= 5;

CREATE INDEX idx_leaderboard_cat_city ON analytics.place_leaderboard (category, city, rank);

-- =============================================================================
-- MV: Daily active users (refreshed daily at midnight)
-- =============================================================================
CREATE MATERIALIZED VIEW analytics.daily_active_users AS
SELECT date_trunc('day', recorded_at) AS day,
       COUNT(DISTINCT user_id) AS dau
FROM location_history
WHERE recorded_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY day
ORDER BY day DESC;

-- =============================================================================
-- MV: Place popularity trend (refreshed hourly)
-- =============================================================================
CREATE MATERIALIZED VIEW analytics.place_popularity AS
SELECT place_id,
       COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') AS views_24h,
       COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS views_7d,
       COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS views_30d,
       COUNT(DISTINCT user_id) AS unique_viewers_30d
FROM place_views
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY place_id;

CREATE INDEX idx_popularity_24h ON analytics.place_popularity (views_24h DESC);
```

### 10.2 Refresh Schedule

```sql
-- Cron-based refresh via pg_cron extension:
SELECT cron.schedule('refresh-leaderboard',  '0 * * * *',  'REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.place_leaderboard');
SELECT cron.schedule('refresh-dau',          '0 1 * * *',  'REFRESH MATERIALIZED VIEW analytics.daily_active_users');
SELECT cron.schedule('refresh-popularity',   '0 * * * *',  'REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.place_popularity');
```

---

## 11. Scaling Architecture

### 11.1 Connection Pooling (PgBouncer)

```
                    ┌──────────────┐
                    │  NestJS App   │
                    │  (instances)  │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  PgBouncer   │  ← Transaction pooling mode
                    │  (sidecar)   │     Max 200 connections to DB
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Primary  │ │ Replica 1│ │ Replica 2│
        │ (Read/   │ │ (Read    │ │ (Read    │
        │  Write)  │ │  Only)   │ │  Only)   │
        └──────────┘ └──────────┘ └──────────┘
```

**Pooling Configuration:**
```
pool_mode = transaction     # Safe for Prisma (releases connection after each tx)
default_pool_size = 25      # Per user (app user)
max_client_conn = 200       # Total DB connections
reserve_pool_size = 5       # Emergency reserve
reserve_pool_timeout = 3    # Seconds to wait for reserve
```

### 11.2 Read/Write Splitting

```typescript
// Prisma read replica configuration
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,           // Primary (write)
    },
  },
});

// Use read replica for heavy queries
const readPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_REPLICA,   // Replica (read-only)
    },
  },
});
```

**Query Routing:**
- All writes → Primary
- Place discovery, search, profile view → Replica
- Reviews, favorites mutations → Primary (then read from primary for consistency)
- Analytics dashboards → Replica (stale reads acceptable)

### 11.3 Vertical Scaling Tiers

| Tier | MAU | DB Spec | Replicas | PgBouncer Pool |
|------|-----|---------|----------|----------------|
| Dev | — | 1 vCPU, 2 GB | 0 | 25 |
| Launch | <50K | 2 vCPU, 8 GB | 1 | 50 |
| Growth | 50K–200K | 4 vCPU, 16 GB | 2 | 100 |
| Scale | 200K–500K | 8 vCPU, 32 GB | 3 | 200 |
| Enterprise | 500K+ | 16 vCPU, 64 GB | 4+ | 400 |

### 11.4 Caching Layer (Redis)

```
┌────────────────────────────────────────────────────┐
│                  Redis Cache Strategy               │
├──────────────┬──────────────┬──────────────────────┤
│  Hot Places  │  User Session│  Rate Limiting       │
│  TTL: 5 min  │  TTL: 24h   │  Sliding Window      │
│  Key: place: │  Key: sess:  │  Key: rl:{userId}    │
│  {slug}      │  {token}     │                      │
├──────────────┼──────────────┼──────────────────────┤
│  Nearby      │  AI Response │  Trending Scores     │
│  TTL: 30s    │  TTL: 1h     │  TTL: 1h             │
│  Key: nearby │  Key: ai:    │  Key: trending:      │
│  :{lat}:{lng}│  {hash}      │  {city}:{category}   │
└──────────────┴──────────────┴──────────────────────┘
```

### 11.5 Table Size Estimates (at 500K MAU)

| Table | Est. Rows | Est. Size | Growth Rate |
|-------|-----------|-----------|-------------|
| `users` | 500K | ~200 MB | Linear (signups) |
| `profiles` | 500K | ~100 MB | Linear |
| `places` | 500K | ~1.5 GB | Slow (curated) |
| `reviews` | 2M | ~800 MB | Linear |
| `photos` | 5M | ~500 MB | Linear |
| `favorites` | 10M | ~600 MB | Linear |
| `trips` | 1M | ~400 MB | Linear |
| `location_history` | 500M | ~20 GB | **Fast** (partitioned) |
| `place_views` | 100M | ~4 GB | Fast |
| `notifications` | 50M | ~2 GB | Linear (pruned) |
| `search_history` | 20M | ~1 GB | Linear (partitioned) |
| `api_audit_logs` | 1B+ | ~50 GB+ | **Fastest** (partitioned) |
| **Total (live)** | | **~30 GB** | |
| **Total (archived)** | | **~80 GB** | |

---

## 12. Operations & Maintenance

### 12.1 Backup Strategy

```
┌──────────────────────────────────────────────────────────────┐
│                      Backup Strategy                          │
├──────────────┬──────────────────┬────────────────────────────┤
│  Continuous  │  Daily           │  Weekly                    │
│  WAL Archiving│  pg_dump (full) │  Base backup               │
│  (PITR)      │  → S3 / Supabase│  → Cold storage            │
│  RPO: <1s    │  RPO: 24h       │  RPO: 7 days              │
│  RTO: 5 min  │  RTO: 30 min    │  RTO: 2 hours             │
└──────────────┴──────────────────┴────────────────────────────┘
```

**Implementation (Railway Managed PostgreSQL):**
- Continuous WAL shipping enabled (Point-in-Time Recovery)
- Automated daily snapshots retained for 7 days
- Weekly backups retained for 30 days

**Verification:**
```sql
-- Monthly restore test to staging environment
-- 1. Restore latest production backup
-- 2. Run data integrity checks
-- 3. Verify all FK relationships intact
-- 4. Verify index usage on critical queries
```

### 12.2 Vacuum Strategy

```sql
-- Per-table autovacuum tuning (in postgresql.conf or per-table ALTER)
ALTER TABLE location_history SET (
    autovacuum_vacuum_scale_factor = 0.01,   -- More aggressive (1% dead tuples)
    autovacuum_analyze_scale_factor = 0.005,
    autovacuum_vacuum_cost_limit = 2000
);

ALTER TABLE notifications SET (
    autovacuum_vacuum_scale_factor = 0.05
);
```

### 12.3 Monitoring Queries

```sql
-- Top 10 bloated tables
SELECT schemaname, relname,
       pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
       n_dead_tup, n_live_tup,
       round(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 1) AS dead_pct
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 10;

-- Unused indexes (reset after deploy, check after 1 week)
SELECT schemaname, relname, indexrelname,
       pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
       idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- Slow queries (>100ms) in the last hour
SELECT queryid, query,
       calls, mean_exec_time_ms,
       total_exec_time_ms,
       rows
FROM pg_stat_statements
WHERE mean_exec_time_ms > 100
ORDER BY total_exec_time_ms DESC
LIMIT 20;
```

### 12.4 Data Retention Policies

| Table | Retention | Action |
|-------|-----------|--------|
| `location_history` | 6 months | Partition detach → archive to S3 → DROP |
| `api_audit_logs` | 12 months | Partition detach → archive to S3 → DROP |
| `search_history` | 3 months | Partition detach → DROP |
| `notifications` | 90 days | `DELETE WHERE created_at < NOW() - INTERVAL '90 days'` (batched) |
| `user_sessions` | 30 days (expired) | `DELETE WHERE expires_at < NOW()` (cron) |
| `routes` | 7 days | `DELETE WHERE expires_at < NOW()` (cron) |
| `soft-deleted users` | 30 days | `DELETE WHERE is_deleted AND deleted_at < NOW() - INTERVAL '30 days'` |

### 12.5 Migration Safety Rules

```
1. NEVER rename a column — add new, backfill, switch reads, drop old
2. NEVER drop a column in the same deploy — deprecate, then drop next deploy
3. Add indexes CONCURRENTLY (avoid table locks)
4. Default values for NOT NULL columns in separate ALTER
5. Validate FK constraints before enforcing (check orphaned rows)
6. Run migrations in a transaction (when safe) or with --transaction=false
7. Always test migration on staging with production data volume
8. Keep migration + app deploy decoupled (expand-contract pattern)
```

---

## Appendix A: Enum Definitions

```sql
CREATE TYPE place_category AS ENUM (
    'restaurant', 'cafe', 'street_food', 'food_court', 'night_market',
    'attraction', 'shopping_mall', 'hotel', 'hostel', 'resort',
    'pharmacy', 'hospital', 'clinic', 'petrol_station', 'ev_charger',
    'public_toilet', 'park', 'beach', 'hiking_trail',
    'museum', 'temple', 'mosque', 'church', 'viewpoint',
    'market', 'entertainment', 'convenience_store', 'library',
    'coworking_space', 'other'
);

CREATE TYPE transport_mode AS ENUM (
    'walking', 'driving', 'motorcycle', 'grab',
    'bus', 'mrt', 'lrt', 'ktm', 'ets',
    'flight', 'ferry', 'bicycle'
);

CREATE TYPE trip_status AS ENUM ('draft', 'planned', 'active', 'completed', 'cancelled');
CREATE TYPE notification_type AS ENUM (
    'review_request', 'achievement_unlocked', 'new_follower',
    'trip_reminder', 'place_verified', 'promotion_available',
    'business_reply', 'system', 'social_like', 'social_comment',
    'trip_invite', 'favorite_price_drop', 'nearby_hidden_gem', 'weekly_digest'
);
CREATE TYPE subscription_plan AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE subscription_status AS ENUM (
    'active', 'past_due', 'canceled', 'incomplete',
    'incomplete_expired', 'trialing', 'unpaid', 'paused'
);
CREATE TYPE travel_style AS ENUM (
    'budget', 'mid_range', 'luxury', 'adventure',
    'foodie', 'cultural', 'family', 'solo', 'backpacker'
);
CREATE TYPE ai_recommendation_type AS ENUM (
    'food', 'attraction', 'route', 'weekend_plan',
    'full_trip', 'hidden_gem', 'trending'
);
CREATE TYPE route_type AS ENUM ('fastest', 'cheapest', 'scenic', 'tourist', 'food');
CREATE TYPE user_role AS ENUM ('user', 'verified_user', 'business_owner', 'premium_user', 'moderator', 'admin', 'super_admin');
CREATE TYPE photo_moderation_status AS ENUM ('pending', 'approved', 'rejected', 'flagged');
CREATE TYPE review_moderation_status AS ENUM ('pending', 'approved', 'rejected', 'flagged');
CREATE TYPE business_verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
CREATE TYPE content_report_reason AS ENUM ('spam', 'inappropriate', 'fake', 'offensive', 'copyright', 'other');
CREATE TYPE content_report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');
```

## Appendix B: Trigger Functions

```sql
-- =============================================================================
-- Auto-update profile counters when reviews are created/deleted
-- =============================================================================
CREATE OR REPLACE FUNCTION update_profile_review_count() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE profiles SET reviews_count = reviews_count + 1,
                            updated_at = now()
        WHERE user_id = NEW.user_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE profiles SET reviews_count = GREATEST(reviews_count - 1, 0),
                            updated_at = now()
        WHERE user_id = OLD.user_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_review_count
    AFTER INSERT OR DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_profile_review_count();

-- =============================================================================
-- Auto-update place rating when reviews are inserted/updated/deleted
-- =============================================================================
CREATE OR REPLACE FUNCTION update_place_rating() RETURNS trigger AS $$
BEGIN
    UPDATE places SET
        rating = (SELECT COALESCE(AVG(rating)::REAL, 0) FROM reviews WHERE place_id = COALESCE(NEW.place_id, OLD.place_id) AND moderation_status = 'approved'),
        review_count = (SELECT COUNT(*) FROM reviews WHERE place_id = COALESCE(NEW.place_id, OLD.place_id) AND moderation_status = 'approved'),
        updated_at = now()
    WHERE id = COALESCE(NEW.place_id, OLD.place_id);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_place_rating
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_place_rating();
```

---

*This document defines the complete PostgreSQL database architecture for ExploreMY AI. All DDL, indexes, constraints, and operational procedures are production-grade and designed for scale from day one.*
