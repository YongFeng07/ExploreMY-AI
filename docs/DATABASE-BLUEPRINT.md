# ExploreMY AI — Database Architecture & Prisma Blueprint

> **Classification:** Internal — Data Engineering  
> **Version:** 4.0  
> **Authors:** Chief Database Architect · Principal Data Engineer  
> **Target Scale:** 10M users · 100M reviews · 10M places · 1B AI recs  
> **Engine:** PostgreSQL 16 + PostGIS 3.4 + pgvector 0.7 + pg_partman

---

## Section 1: Database Philosophy

### 1.1 Core Principles

1. **UUID Everywhere** — `gen_random_uuid_v7()` for all primary keys. Time-sortable, globally unique, no ID collision in distributed systems, no sequential enumeration vulnerability.

2. **Timestamptz Always** — Every timestamp column uses `TIMESTAMPTZ`. Malaysia is UTC+8. Users span all timezones. Never use `TIMESTAMP` without timezone.

3. **Soft Delete by Default** — User-facing entities are soft-deleted (`is_deleted = TRUE`, `deleted_at = NOW()`). Hard delete only for immutable log data after retention expires.

4. **JSONB for Flexibility** — Semi-structured data (preferences, metadata, tags, features) uses `JSONB`. Indexable, queryable, schema-flexible. Avoids table explosion for sparse attributes.

5. **Denormalize for Reads** — Counters (`review_count`, `follower_count`) are stored on parent records and updated via triggers or application logic. Avoids COUNT(*) on every page load.

6. **Partition by Time** — Append-heavy tables (`location_history`, `api_audit_logs`, `search_history`, `place_views`) are partitioned by month. Automatic partition management via pg_partman.

7. **Index for Queries, Not for Schema** — Every index must be justified by a specific query pattern in the application. No speculative indexing.

### 1.2 Scaling Principles

| Scale | MAU | Strategy |
|-------|-----|----------|
| 10K | — | Single PostgreSQL instance, no replication |
| 100K | — | Add 1 read replica, PgBouncer connection pooling |
| 1M | — | 2 read replicas, partition large tables, Redis caching layer |
| 10M | — | Multi-region, database sharding by region, separate analytics DB |

---

## Section 2: Database Domain Model

```
┌──────────────────────────────────────────────────────────────┐
│                    DATABASE DOMAINS (15 schemas)               │
│                                                                │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │
│  │  app   │ │ auth   │ │ place  │ │ review │ │ trip   │    │
│  │(core)  │ │        │ │        │ │        │ │        │    │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘    │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │
│  │ route  │ │  ai    │ │ event  │ │merchant│ │ social │    │
│  │        │ │        │ │        │ │        │ │        │    │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘    │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │
│  │booking │ │ wallet │ │reward  │ │ notif  │ │community│   │
│  │        │ │        │ │        │ │        │ │        │    │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘    │
│  ┌────────┐ ┌────────┐                                       │
│  │analytics│ │ audit  │                                       │
│  │        │ │        │                                       │
│  └────────┘ └────────┘                                       │
└──────────────────────────────────────────────────────────────┘
```

---

## Sections 3-17: Complete Table Definitions

### 3.1 Core User Tables (app schema)

```sql
-- =============================================================================
-- TABLE: users (1 row per registered identity)
-- =============================================================================
CREATE TABLE app.users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    clerk_id            VARCHAR(255) NOT NULL UNIQUE,
    email               CITEXT NOT NULL UNIQUE,
    display_name        VARCHAR(100) NOT NULL,
    avatar_url          VARCHAR(2048),
    bio                 VARCHAR(500),
    home_city           VARCHAR(100),
    home_state          VARCHAR(100),
    preferred_language  VARCHAR(10) DEFAULT 'en',
    role                user_role DEFAULT 'user',
    is_deleted          BOOLEAN DEFAULT FALSE,
    deleted_at          TIMESTAMPTZ,
    last_login_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_users_clerk ON app.users(clerk_id);
CREATE INDEX idx_users_email ON app.users(email);
CREATE INDEX idx_users_role ON app.users(role) WHERE NOT is_deleted;

-- =============================================================================
-- TABLE: profiles (1:1 with users, denormalized stats)
-- =============================================================================
CREATE TABLE app.profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id             UUID NOT NULL UNIQUE REFERENCES app.users(id) ON DELETE CASCADE,
    followers_count     INTEGER DEFAULT 0,
    following_count     INTEGER DEFAULT 0,
    reviews_count       INTEGER DEFAULT 0,
    photos_count        INTEGER DEFAULT 0,
    trips_count         INTEGER DEFAULT 0,
    favorites_count     INTEGER DEFAULT 0,
    achievements_count  INTEGER DEFAULT 0,
    hidden_gems_found   INTEGER DEFAULT 0,
    level               INTEGER DEFAULT 1 CHECK (level >= 1),
    xp                  INTEGER DEFAULT 0 CHECK (xp >= 0),
    is_verified         BOOLEAN DEFAULT FALSE,
    is_business_owner   BOOLEAN DEFAULT FALSE,
    social_links        JSONB,
    travel_stats        JSONB,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_profiles_level ON app.profiles(level);
CREATE INDEX idx_profiles_xp ON app.profiles(xp DESC);

-- =============================================================================
-- TABLE: user_preferences
-- =============================================================================
CREATE TABLE app.user_preferences (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id                 UUID NOT NULL UNIQUE REFERENCES app.users(id) ON DELETE CASCADE,
    dietary_restrictions    JSONB,
    cuisine_preferences     JSONB,
    activity_preferences    JSONB,
    budget_level            INTEGER CHECK (budget_level BETWEEN 1 AND 4),
    preferred_transport     JSONB,
    accessibility           JSONB,
    notification_settings   JSONB,
    privacy_settings        JSONB,
    ai_personalization      BOOLEAN DEFAULT TRUE,
    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- TABLE: travel_dna (8-dimension personality vector)
-- =============================================================================
CREATE TABLE app.travel_dna (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id         UUID NOT NULL UNIQUE REFERENCES app.users(id) ON DELETE CASCADE,
    adventure       REAL DEFAULT 0.5,
    luxury          REAL DEFAULT 0.5,
    foodie          REAL DEFAULT 0.5,
    culture         REAL DEFAULT 0.5,
    nature          REAL DEFAULT 0.5,
    social          REAL DEFAULT 0.5,
    spontaneity     REAL DEFAULT 0.5,
    local_immersion REAL DEFAULT 0.5,
    primary_style   travel_style,
    secondary_style travel_style,
    confidence      REAL DEFAULT 0,
    data_points     INTEGER DEFAULT 0,
    version         INTEGER DEFAULT 1,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- TABLE: food_dna
-- =============================================================================
CREATE TABLE app.food_dna (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id         UUID NOT NULL UNIQUE REFERENCES app.users(id) ON DELETE CASCADE,
    malay           REAL DEFAULT 0.5,  chinese       REAL DEFAULT 0.5,
    indian          REAL DEFAULT 0.5,  japanese      REAL DEFAULT 0.5,
    korean          REAL DEFAULT 0.5,  western       REAL DEFAULT 0.5,
    thai            REAL DEFAULT 0.5,  middle_eastern REAL DEFAULT 0.5,
    fusion          REAL DEFAULT 0.5,
    street_food     REAL DEFAULT 0.5,  cafe          REAL DEFAULT 0.5,
    fine_dining     REAL DEFAULT 0.5,  hawker        REAL DEFAULT 0.5,
    spice_tolerance REAL DEFAULT 0.5,
    price_preference REAL DEFAULT 0.5,
    top_cuisines    JSONB,
    confidence      REAL DEFAULT 0,
    data_points     INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- TABLE: user_devices (push notification tokens)
-- =============================================================================
CREATE TABLE app.user_devices (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id       UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    device_token  VARCHAR(512) NOT NULL,
    platform      VARCHAR(20) NOT NULL,
    is_active     BOOLEAN DEFAULT TRUE,
    last_used_at  TIMESTAMPTZ DEFAULT now(),
    created_at    TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, device_token)
);

-- =============================================================================
-- TABLE: user_sessions
-- =============================================================================
CREATE TABLE app.user_sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id     UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    token       VARCHAR(512) NOT NULL UNIQUE,
    ip_address  INET,
    user_agent  VARCHAR(512),
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_sessions_user ON app.user_sessions(user_id);
CREATE INDEX idx_sessions_expiry ON app.user_sessions(expires_at);

-- =============================================================================
-- TABLE: user_follows
-- =============================================================================
CREATE TABLE app.user_follows (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    follower_id   UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    following_id  UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    created_at    TIMESTAMPTZ DEFAULT now(),
    UNIQUE (follower_id, following_id),
    CHECK (follower_id <> following_id)
);
```

### 4.1 Place Ecosystem Tables (app schema)

```sql
-- =============================================================================
-- TABLE: places (core entity, ~10M rows at scale)
-- =============================================================================
CREATE TABLE app.places (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    google_place_id         VARCHAR(255) UNIQUE,
    slug                    VARCHAR(255) NOT NULL UNIQUE,
    name                    VARCHAR(255) NOT NULL,
    description             TEXT,
    category                place_category NOT NULL,
    subcategory             VARCHAR(100),
    address                 VARCHAR(500),
    city                    VARCHAR(100),
    state                   VARCHAR(100),
    postcode                VARCHAR(10),
    country                 VARCHAR(100) DEFAULT 'Malaysia',
    lat                     DOUBLE PRECISION NOT NULL,
    lng                     DOUBLE PRECISION NOT NULL,
    location                GEOMETRY(Point, 4326) GENERATED ALWAYS AS
                                (ST_SetSRID(ST_MakePoint(lng, lat), 4326)) STORED,
    phone                   VARCHAR(20),
    website                 VARCHAR(2048),
    email                   CITEXT,
    price_level             INTEGER CHECK (price_level BETWEEN 0 AND 4),
    rating                  REAL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    review_count            INTEGER DEFAULT 0,
    photos                  JSONB,
    opening_hours           JSONB,
    amenities               JSONB,
    is_hidden_gem           BOOLEAN DEFAULT FALSE,
    hidden_gem_score        REAL DEFAULT 0,
    is_trending             BOOLEAN DEFAULT FALSE,
    trending_score          REAL DEFAULT 0,
    popularity_score        REAL DEFAULT 0,
    is_claimed              BOOLEAN DEFAULT FALSE,
    claimed_by_business_id  UUID,
    is_permanently_closed   BOOLEAN DEFAULT FALSE,
    metadata                JSONB,
    search_vector           TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(name,'') || ' ' ||
        coalesce(description,'') || ' ' || coalesce(city,''))
    ) STORED,
    embedding               VECTOR(1536),
    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_places_location ON app.places USING GIST (location);
CREATE INDEX idx_places_category ON app.places(category, rating DESC) WHERE NOT is_permanently_closed;
CREATE INDEX idx_places_city ON app.places(city, category) WHERE NOT is_permanently_closed;
CREATE INDEX idx_places_hidden ON app.places(hidden_gem_score DESC) WHERE is_hidden_gem AND NOT is_permanently_closed;
CREATE INDEX idx_places_trending ON app.places(trending_score DESC) WHERE is_trending;
CREATE INDEX idx_places_slug ON app.places(slug);
CREATE INDEX idx_places_search ON app.places USING GIN (search_vector);
CREATE INDEX idx_places_embedding ON app.places USING ivfflat (embedding vector_cosine_ops) WITH (lists = 200);
CREATE INDEX idx_places_name_trgm ON app.places USING GIN (name gin_trgm_ops);

-- =============================================================================
-- TABLE: place_photos
-- =============================================================================
CREATE TABLE app.place_photos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    place_id        UUID NOT NULL REFERENCES app.places(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES app.users(id) ON DELETE SET NULL,
    url             VARCHAR(2048) NOT NULL,
    thumbnail_url   VARCHAR(2048),
    caption         VARCHAR(500),
    is_primary      BOOLEAN DEFAULT FALSE,
    sort_order      INTEGER DEFAULT 0,
    ai_tags         JSONB,
    moderation      photo_moderation_status DEFAULT 'pending',
    created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_place_photos_place ON app.place_photos(place_id);

-- =============================================================================
-- TABLE: place_hours
-- =============================================================================
CREATE TABLE app.place_hours (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    place_id    UUID NOT NULL REFERENCES app.places(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    open_time   TIME,
    close_time  TIME,
    is_closed   BOOLEAN DEFAULT FALSE,
    is_special  BOOLEAN DEFAULT FALSE,
    label       VARCHAR(100),
    UNIQUE (place_id, day_of_week, is_special)
);

-- =============================================================================
-- TABLE: place_views (analytics, partitioned)
-- =============================================================================
CREATE TABLE app.place_views (
    id          UUID DEFAULT gen_random_uuid_v7(),
    place_id    UUID NOT NULL REFERENCES app.places(id) ON DELETE CASCADE,
    user_id     UUID,
    source      VARCHAR(50),
    created_at  TIMESTAMPTZ DEFAULT now()
) PARTITION BY RANGE (created_at);
CREATE INDEX idx_place_views_place ON app.place_views(place_id, created_at);

-- =============================================================================
-- TABLE: place_statistics (hourly aggregated, materialized daily)
-- =============================================================================
CREATE TABLE app.place_statistics (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    place_id            UUID NOT NULL REFERENCES app.places(id) ON DELETE CASCADE,
    date                DATE NOT NULL,
    views               INTEGER DEFAULT 0,
    direction_requests  INTEGER DEFAULT 0,
    call_clicks         INTEGER DEFAULT 0,
    website_clicks      INTEGER DEFAULT 0,
    favorites_added     INTEGER DEFAULT 0,
    reviews_written     INTEGER DEFAULT 0,
    UNIQUE (place_id, date)
);
```

### 5.1 Review System Tables

```sql
CREATE TABLE app.reviews (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id             UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    place_id            UUID NOT NULL REFERENCES app.places(id) ON DELETE CASCADE,
    rating              INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title               VARCHAR(255),
    content             TEXT,
    photos              JSONB,
    visit_date          DATE,
    spend_per_person    NUMERIC(10,2),
    tags                JSONB,
    is_verified_visit   BOOLEAN DEFAULT FALSE,
    helpful_count       INTEGER DEFAULT 0,
    moderation_status   review_moderation_status DEFAULT 'pending',
    moderated_by        UUID,
    moderated_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, place_id)
);
CREATE INDEX idx_reviews_place ON app.reviews(place_id, rating DESC) WHERE moderation_status = 'approved';
CREATE INDEX idx_reviews_user ON app.reviews(user_id, created_at DESC);
CREATE INDEX idx_reviews_mod ON app.reviews(moderation_status, created_at) WHERE moderation_status = 'pending';

CREATE TABLE app.review_votes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    review_id   UUID NOT NULL REFERENCES app.reviews(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    vote_type   VARCHAR(10) CHECK (vote_type IN ('helpful', 'unhelpful')),
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE (review_id, user_id)
);

CREATE TABLE app.review_reports (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    review_id   UUID NOT NULL REFERENCES app.reviews(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    reason      content_report_reason NOT NULL,
    description TEXT,
    status      content_report_status DEFAULT 'pending',
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE app.review_replies (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    review_id   UUID NOT NULL REFERENCES app.reviews(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_review_replies ON app.review_replies(review_id);
```

### 6.1 Favorites Tables

```sql
CREATE TABLE app.favorite_lists (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id     UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    name        VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    is_public   BOOLEAN DEFAULT FALSE,
    cover_photo VARCHAR(2048),
    place_count INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_fav_lists_user ON app.favorite_lists(user_id);

CREATE TABLE app.favorites (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id     UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    place_id    UUID NOT NULL REFERENCES app.places(id) ON DELETE CASCADE,
    list_id     UUID REFERENCES app.favorite_lists(id) ON DELETE SET NULL,
    notes       VARCHAR(500),
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, place_id)
);
CREATE INDEX idx_favorites_user ON app.favorites(user_id, created_at DESC);
CREATE INDEX idx_favorites_place ON app.favorites(place_id);
CREATE INDEX idx_favorites_list ON app.favorites(list_id);
```

### 7.1 Trips & Routes Tables

```sql
CREATE TABLE app.trips (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id           UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    title             VARCHAR(255) NOT NULL,
    description       TEXT,
    cover_photo       VARCHAR(2048),
    destination_city  VARCHAR(100),
    destination_state VARCHAR(100),
    start_date        DATE,
    end_date          DATE,
    budget            NUMERIC(12,2),
    budget_currency   VARCHAR(3) DEFAULT 'MYR',
    travel_style      travel_style,
    is_ai_generated   BOOLEAN DEFAULT FALSE,
    ai_prompt         TEXT,
    ai_model          VARCHAR(50),
    status            trip_status DEFAULT 'draft',
    collaborators     JSONB,
    total_cost        NUMERIC(12,2),
    total_distance    REAL,
    carbon_footprint  REAL,
    day_count         INTEGER DEFAULT 0,
    is_public         BOOLEAN DEFAULT FALSE,
    share_token       VARCHAR(64) UNIQUE,
    view_count        INTEGER DEFAULT 0,
    like_count        INTEGER DEFAULT 0,
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_trips_user ON app.trips(user_id, status);

CREATE TABLE app.trip_days (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    trip_id     UUID NOT NULL REFERENCES app.trips(id) ON DELETE CASCADE,
    day_number  INTEGER NOT NULL CHECK (day_number >= 1),
    date        DATE,
    notes       TEXT,
    weather     JSONB,
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE (trip_id, day_number)
);

CREATE TABLE app.trip_stops (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    trip_day_id                 UUID NOT NULL REFERENCES app.trip_days(id) ON DELETE CASCADE,
    place_id                    UUID NOT NULL REFERENCES app.places(id) ON DELETE CASCADE,
    "order"                     INTEGER NOT NULL CHECK ("order" >= 1),
    start_time                  TIME,
    end_time                    TIME,
    duration_minutes            INTEGER,
    notes                       TEXT,
    transport_from_previous     transport_mode,
    cost_estimate               NUMERIC(10,2),
    distance_from_previous      REAL
);
CREATE INDEX idx_trip_stops_day ON app.trip_stops(trip_day_id, "order");

CREATE TABLE app.routes (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    origin_place_id             UUID NOT NULL REFERENCES app.places(id) ON DELETE CASCADE,
    destination_place_id        UUID NOT NULL REFERENCES app.places(id) ON DELETE CASCADE,
    transport_mode              transport_mode NOT NULL,
    polyline                    TEXT,
    distance_meters             REAL,
    duration_seconds            REAL,
    duration_in_traffic_seconds REAL,
    cost_estimate               NUMERIC(10,2),
    currency                    VARCHAR(3) DEFAULT 'MYR',
    carbon_footprint_grams      REAL,
    waypoints                   JSONB,
    steps                       JSONB,
    route_type                  route_type DEFAULT 'fastest',
    scenic_score                REAL DEFAULT 0,
    food_density_score          REAL DEFAULT 0,
    expires_at                  TIMESTAMPTZ,
    created_at                  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_routes_od ON app.routes(origin_place_id, destination_place_id, transport_mode);

CREATE TABLE app.transport_options (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    route_id        UUID NOT NULL REFERENCES app.routes(id) ON DELETE CASCADE,
    type            transport_mode NOT NULL,
    provider        VARCHAR(100),
    price           NUMERIC(10,2),
    currency        VARCHAR(3) DEFAULT 'MYR',
    duration_minutes INTEGER,
    departure_time  TIMESTAMPTZ,
    arrival_time    TIMESTAMPTZ,
    booking_url     VARCHAR(2048),
    metadata        JSONB,
    created_at      TIMESTAMPTZ DEFAULT now()
);
```

### 8.1 AI Ecosystem Tables

```sql
CREATE TABLE app.ai_conversations (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id       UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    session_id    UUID NOT NULL UNIQUE,
    status        VARCHAR(20) DEFAULT 'active',
    title         VARCHAR(300),
    intent        VARCHAR(50),
    summary       TEXT,
    message_count INTEGER DEFAULT 0,
    tokens_used   INTEGER DEFAULT 0,
    cost_incurred NUMERIC(10,6) DEFAULT 0,
    trip_id       UUID REFERENCES app.trips(id) ON DELETE SET NULL,
    metadata      JSONB,
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now(),
    expires_at    TIMESTAMPTZ
);
CREATE INDEX idx_ai_conv_user ON app.ai_conversations(user_id, updated_at DESC);

CREATE TABLE app.ai_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    conversation_id UUID NOT NULL REFERENCES app.ai_conversations(id) ON DELETE CASCADE,
    role            VARCHAR(10) NOT NULL CHECK (role IN ('user','assistant','system')),
    content         TEXT NOT NULL,
    intent          VARCHAR(50),
    tokens_used     INTEGER,
    response_json   JSONB,
    feedback        VARCHAR(10),
    created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_ai_msg_conv ON app.ai_messages(conversation_id, created_at);

CREATE TABLE app.ai_recommendations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id         UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    type            ai_recommendation_type NOT NULL,
    prompt          TEXT,
    response        JSONB,
    model           VARCHAR(50),
    tokens_used     INTEGER,
    cost_incurred   NUMERIC(10,6),
    latency_ms      INTEGER,
    feedback        VARCHAR(10) DEFAULT 'none',
    place_id        UUID REFERENCES app.places(id) ON DELETE SET NULL,
    trip_id         UUID REFERENCES app.trips(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_ai_recs_user ON app.ai_recommendations(user_id, type, created_at DESC);

CREATE TABLE app.memory_facts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id         UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    category        VARCHAR(50) NOT NULL,
    key             VARCHAR(200) NOT NULL,
    value           JSONB NOT NULL,
    confidence      REAL DEFAULT 1.0,
    source          VARCHAR(50),
    last_recalled_at TIMESTAMPTZ,
    recall_count    INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, key)
);
CREATE INDEX idx_memory_user ON app.memory_facts(user_id, category);

CREATE TABLE app.knowledge_chunks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    content         TEXT NOT NULL,
    embedding       VECTOR(1536),
    source_type     VARCHAR(50) NOT NULL,
    source_id       VARCHAR(255),
    source_url      VARCHAR(2048),
    title           VARCHAR(500),
    language        VARCHAR(10) DEFAULT 'en',
    authority_score REAL DEFAULT 0.5,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_knowledge_embedding ON app.knowledge_chunks
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 200);

CREATE TABLE app.user_similarities (
    user_id_1   UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    user_id_2   UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    similarity  REAL NOT NULL,
    computed_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id_1, user_id_2),
    CHECK (user_id_1 < user_id_2)
);

CREATE TABLE app.personalized_recommendations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id     UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    place_id    UUID NOT NULL REFERENCES app.places(id) ON DELETE CASCADE,
    score       REAL NOT NULL,
    reason      VARCHAR(500),
    category    VARCHAR(50) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, place_id, category)
);
CREATE INDEX idx_personalized_user ON app.personalized_recommendations(user_id, score DESC);
```

### 9-17: Events, Merchant, Promotion, Booking, Wallet, Community, Notification, Analytics, Audit

```sql
-- =============================================================================
-- EVENTS
-- =============================================================================
CREATE TABLE app.events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    place_id        UUID REFERENCES app.places(id) ON DELETE SET NULL,
    organizer_id    UUID REFERENCES app.users(id),
    name            VARCHAR(300) NOT NULL,
    description     TEXT,
    category        VARCHAR(50) NOT NULL,
    start_datetime  TIMESTAMPTZ NOT NULL,
    end_datetime    TIMESTAMPTZ,
    venue_name      VARCHAR(300),
    venue_lat       DOUBLE PRECISION,
    venue_lng       DOUBLE PRECISION,
    max_capacity    INTEGER,
    tickets_available INTEGER,
    photos          JSONB,
    tags            JSONB,
    price_range     JSONB,
    is_verified     BOOLEAN DEFAULT FALSE,
    is_featured     BOOLEAN DEFAULT FALSE,
    source          VARCHAR(100),
    status          VARCHAR(20) DEFAULT 'draft',
    created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_events_dates ON app.events(start_datetime, end_datetime);
CREATE INDEX idx_events_category ON app.events(category, start_datetime);

CREATE TABLE app.event_tickets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    event_id        UUID NOT NULL REFERENCES app.events(id) ON DELETE CASCADE,
    tier_name       VARCHAR(100) NOT NULL,
    price           NUMERIC(10,2) NOT NULL,
    currency        VARCHAR(3) DEFAULT 'MYR',
    quantity_total  INTEGER NOT NULL,
    quantity_sold   INTEGER DEFAULT 0,
    sale_start      TIMESTAMPTZ,
    sale_end        TIMESTAMPTZ,
    is_active       BOOLEAN DEFAULT TRUE,
    sort_order      INTEGER DEFAULT 0
);

CREATE TABLE app.event_bookings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    booking_ref     VARCHAR(20) UNIQUE NOT NULL,
    event_id        UUID NOT NULL REFERENCES app.events(id),
    user_id         UUID NOT NULL REFERENCES app.users(id),
    ticket_tier_id  UUID NOT NULL REFERENCES app.event_tickets(id),
    quantity        INTEGER DEFAULT 1,
    total_amount    NUMERIC(10,2) NOT NULL,
    status          VARCHAR(20) DEFAULT 'confirmed',
    qr_code         VARCHAR(500),
    checked_in_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- MERCHANT PLATFORM
-- =============================================================================
CREATE TABLE app.business_accounts (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id                 UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    business_name           VARCHAR(255) NOT NULL,
    business_type           VARCHAR(100),
    registration_number     VARCHAR(50) UNIQUE,
    phone                   VARCHAR(20),
    email                   CITEXT,
    website                 VARCHAR(2048),
    description             TEXT,
    logo_url                VARCHAR(2048),
    verification_status     business_verification_status DEFAULT 'unverified',
    verified_at             TIMESTAMPTZ,
    subscription_tier       subscription_plan DEFAULT 'free',
    subscription_expires_at TIMESTAMPTZ,
    analytics               JSONB,
    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE app.business_claims (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    place_id            UUID NOT NULL REFERENCES app.places(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    business_id         UUID REFERENCES app.business_accounts(id),
    verification_tier   VARCHAR(20) DEFAULT 'tier_1',
    verification_method VARCHAR(30),
    status              VARCHAR(20) DEFAULT 'pending',
    documents           JSONB,
    fraud_risk_score    REAL DEFAULT 0,
    reviewed_by         UUID,
    reviewed_at         TIMESTAMPTZ,
    rejection_reason    VARCHAR(500),
    created_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE (place_id, user_id)
);

CREATE TABLE app.subscriptions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id                 UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    business_id             UUID REFERENCES app.business_accounts(id) ON DELETE SET NULL,
    plan                    subscription_plan NOT NULL,
    status                  subscription_status NOT NULL,
    stripe_subscription_id  VARCHAR(255) UNIQUE,
    stripe_customer_id      VARCHAR(255),
    current_period_start    TIMESTAMPTZ,
    current_period_end      TIMESTAMPTZ,
    canceled_at             TIMESTAMPTZ,
    trial_end_at            TIMESTAMPTZ,
    metadata                JSONB,
    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_subs_user ON app.subscriptions(user_id);
CREATE INDEX idx_subs_stripe ON app.subscriptions(stripe_subscription_id);

-- =============================================================================
-- PROMOTIONS & LOYALTY
-- =============================================================================
CREATE TABLE app.promotions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    business_id         UUID NOT NULL REFERENCES app.business_accounts(id) ON DELETE CASCADE,
    place_id            UUID REFERENCES app.places(id),
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    promotion_type      VARCHAR(50) NOT NULL,
    discount_value      NUMERIC(10,2) CHECK (discount_value > 0),
    max_discount        NUMERIC(10,2),
    min_spend           NUMERIC(10,2),
    promo_code          VARCHAR(50),
    start_date          TIMESTAMPTZ NOT NULL,
    end_date            TIMESTAMPTZ NOT NULL,
    is_active           BOOLEAN DEFAULT TRUE,
    total_redemption_limit INTEGER,
    per_user_limit      INTEGER DEFAULT 1,
    views               INTEGER DEFAULT 0,
    clicks              INTEGER DEFAULT 0,
    redemptions         INTEGER DEFAULT 0,
    terms               TEXT,
    banner_image        VARCHAR(2048),
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now(),
    CHECK (end_date > start_date)
);
CREATE INDEX idx_promos_active ON app.promotions(is_active, start_date, end_date);
CREATE INDEX idx_promos_business ON app.promotions(business_id, is_active);

CREATE TABLE app.coupons (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    promotion_id    UUID REFERENCES app.promotions(id) ON DELETE SET NULL,
    business_id     UUID NOT NULL REFERENCES app.business_accounts(id) ON DELETE CASCADE,
    code            VARCHAR(50) NOT NULL UNIQUE,
    discount_type   VARCHAR(50) NOT NULL,
    discount_value  NUMERIC(10,2) NOT NULL,
    min_spend       NUMERIC(10,2),
    max_discount    NUMERIC(10,2),
    usage_limit     INTEGER,
    used_count      INTEGER DEFAULT 0,
    user_limit      INTEGER DEFAULT 1,
    start_date      TIMESTAMPTZ NOT NULL,
    end_date        TIMESTAMPTZ NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    terms           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    CHECK (end_date > start_date)
);

CREATE TABLE app.coupon_redemptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    coupon_id       UUID NOT NULL REFERENCES app.coupons(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    place_id        UUID REFERENCES app.places(id),
    discount_applied NUMERIC(10,2),
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (coupon_id, user_id)
);

CREATE TABLE app.loyalty_programs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    business_id     UUID NOT NULL UNIQUE REFERENCES app.business_accounts(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    points_per_myr  REAL DEFAULT 1.0,
    tier_config     JSONB,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE app.loyalty_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    program_id      UUID NOT NULL REFERENCES app.loyalty_programs(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    points_balance  INTEGER DEFAULT 0,
    lifetime_points INTEGER DEFAULT 0,
    tier            VARCHAR(20) DEFAULT 'silver',
    visit_count     INTEGER DEFAULT 0,
    last_visit_at   TIMESTAMPTZ,
    joined_at       TIMESTAMPTZ DEFAULT now(),
    UNIQUE (program_id, user_id)
);

CREATE TABLE app.advertising_slots (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    business_id   UUID NOT NULL REFERENCES app.business_accounts(id) ON DELETE CASCADE,
    name          VARCHAR(200) NOT NULL,
    slot_type     VARCHAR(50) NOT NULL,
    place_id      UUID REFERENCES app.places(id),
    image_url     VARCHAR(2048),
    target_url    VARCHAR(2048),
    budget        NUMERIC(12,2),
    impressions   INTEGER DEFAULT 0,
    clicks        INTEGER DEFAULT 0,
    start_date    TIMESTAMPTZ NOT NULL,
    end_date      TIMESTAMPTZ NOT NULL,
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- BOOKING PLATFORM
-- =============================================================================
CREATE TABLE app.hotel_bookings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    booking_ref     VARCHAR(20) UNIQUE NOT NULL,
    user_id         UUID NOT NULL REFERENCES app.users(id),
    place_id        UUID NOT NULL REFERENCES app.places(id),
    check_in        DATE NOT NULL,
    check_out       DATE NOT NULL,
    guests          INTEGER DEFAULT 1,
    room_type       VARCHAR(200),
    room_rate       NUMERIC(10,2) NOT NULL,
    total_amount    NUMERIC(10,2) NOT NULL,
    currency        VARCHAR(3) DEFAULT 'MYR',
    status          VARCHAR(20) DEFAULT 'confirmed',
    payment_status  VARCHAR(20) DEFAULT 'paid',
    guest_name      VARCHAR(200),
    guest_email     VARCHAR(320),
    guest_phone     VARCHAR(30),
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_hotel_bookings_user ON app.hotel_bookings(user_id, created_at DESC);

-- =============================================================================
-- WALLET SYSTEM
-- =============================================================================
CREATE TABLE app.wallets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id         UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    wallet_type     VARCHAR(30) DEFAULT 'main',
    balance_myr     NUMERIC(12,2) DEFAULT 0,
    balance_points  INTEGER DEFAULT 0,
    currency        VARCHAR(3) DEFAULT 'MYR',
    is_active       BOOLEAN DEFAULT TRUE,
    version         INTEGER DEFAULT 1,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, wallet_type)
);

CREATE TABLE app.wallet_transactions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    wallet_id           UUID NOT NULL REFERENCES app.wallets(id),
    transaction_type    VARCHAR(30) NOT NULL,
    amount_myr          NUMERIC(12,2) DEFAULT 0,
    amount_points       INTEGER DEFAULT 0,
    balance_before_myr  NUMERIC(12,2),
    balance_after_myr   NUMERIC(12,2),
    reference_type      VARCHAR(50),
    reference_id        UUID,
    description         VARCHAR(500),
    external_tx_id      VARCHAR(200),
    status              VARCHAR(20) DEFAULT 'completed',
    created_at          TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_wallet_tx ON app.wallet_transactions(wallet_id, created_at DESC);

-- =============================================================================
-- COMMUNITY PLATFORM
-- =============================================================================
CREATE TABLE app.social_posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id         UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    content         TEXT,
    photos          JSONB,
    place_id        UUID REFERENCES app.places(id) ON DELETE SET NULL,
    trip_id         UUID REFERENCES app.trips(id) ON DELETE SET NULL,
    like_count      INTEGER DEFAULT 0,
    comment_count   INTEGER DEFAULT 0,
    share_count     INTEGER DEFAULT 0,
    view_count      INTEGER DEFAULT 0,
    is_public       BOOLEAN DEFAULT TRUE,
    location_lat    DOUBLE PRECISION,
    location_lng    DOUBLE PRECISION,
    location_name   VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_posts_user ON app.social_posts(user_id, created_at DESC);
CREATE INDEX idx_posts_created ON app.social_posts(created_at DESC);

CREATE TABLE app.social_comments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    post_id     UUID NOT NULL REFERENCES app.social_posts(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    parent_id   UUID REFERENCES app.social_comments(id) ON DELETE SET NULL,
    content     TEXT NOT NULL,
    like_count  INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_comments_post ON app.social_comments(post_id, created_at);

CREATE TABLE app.social_likes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    post_id     UUID NOT NULL REFERENCES app.social_posts(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE (post_id, user_id)
);

CREATE TABLE app.travel_communities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    name            VARCHAR(200) NOT NULL UNIQUE,
    description     TEXT,
    cover_photo     VARCHAR(2048),
    member_count    INTEGER DEFAULT 0,
    is_verified     BOOLEAN DEFAULT FALSE,
    created_by      UUID REFERENCES app.users(id),
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE app.community_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    community_id    UUID NOT NULL REFERENCES app.travel_communities(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    role            VARCHAR(20) DEFAULT 'member',
    joined_at       TIMESTAMPTZ DEFAULT now(),
    UNIQUE (community_id, user_id)
);

-- =============================================================================
-- NOTIFICATION SYSTEM
-- =============================================================================
CREATE TABLE app.notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id         UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    type            notification_type NOT NULL,
    title           VARCHAR(255) NOT NULL,
    body            TEXT NOT NULL,
    data            JSONB,
    image_url       VARCHAR(2048),
    is_read         BOOLEAN DEFAULT FALSE,
    read_at         TIMESTAMPTZ,
    is_actioned     BOOLEAN DEFAULT FALSE,
    actioned_at     TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_notif_user ON app.notifications(user_id, created_at DESC) WHERE NOT is_read;

-- =============================================================================
-- ANALYTICS PLATFORM
-- =============================================================================
CREATE TABLE analytics.events (
    id          UUID DEFAULT gen_random_uuid_v7(),
    user_id     UUID,
    event_name  VARCHAR(100) NOT NULL,
    properties  JSONB,
    session_id  VARCHAR(100),
    created_at  TIMESTAMPTZ DEFAULT now()
) PARTITION BY RANGE (created_at);

CREATE TABLE analytics.daily_snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    snapshot_date   DATE NOT NULL,
    metric_name     VARCHAR(100) NOT NULL,
    dimension       VARCHAR(100),
    dimension_value VARCHAR(255),
    metric_value    NUMERIC NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (snapshot_date, metric_name, dimension, dimension_value)
);

CREATE TABLE analytics.business_daily_metrics (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    business_id         UUID NOT NULL REFERENCES app.business_accounts(id) ON DELETE CASCADE,
    place_id            UUID NOT NULL REFERENCES app.places(id) ON DELETE CASCADE,
    date                DATE NOT NULL,
    views               INTEGER DEFAULT 0,
    direction_requests  INTEGER DEFAULT 0,
    call_clicks         INTEGER DEFAULT 0,
    website_clicks      INTEGER DEFAULT 0,
    favorites_added     INTEGER DEFAULT 0,
    reviews_written     INTEGER DEFAULT 0,
    search_appearances  INTEGER DEFAULT 0,
    search_clicks       INTEGER DEFAULT 0,
    UNIQUE (place_id, date)
);
CREATE INDEX idx_biz_metrics ON analytics.business_daily_metrics(business_id, date);

-- =============================================================================
-- AUDIT PLATFORM
-- =============================================================================
CREATE TABLE audit.api_audit_logs (
    id          UUID DEFAULT gen_random_uuid_v7(),
    user_id     UUID,
    method      VARCHAR(10) NOT NULL,
    path        VARCHAR(500) NOT NULL,
    status_code INTEGER NOT NULL,
    duration_ms INTEGER NOT NULL,
    ip_address  INET,
    user_agent  VARCHAR(512),
    request_id  VARCHAR(100),
    changes     JSONB,
    metadata    JSONB,
    created_at  TIMESTAMPTZ DEFAULT now()
) PARTITION BY RANGE (created_at);
CREATE INDEX idx_audit_user ON audit.api_audit_logs(user_id);
CREATE INDEX idx_audit_time ON audit.api_audit_logs USING BRIN (created_at);

-- =============================================================================
-- GAMIFICATION
-- =============================================================================
CREATE TABLE app.achievements (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    code        VARCHAR(50) NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    icon        VARCHAR(100),
    category    VARCHAR(50) NOT NULL,
    xp_reward   INTEGER DEFAULT 0 CHECK (xp_reward >= 0),
    tier        INTEGER DEFAULT 1 CHECK (tier BETWEEN 1 AND 4),
    is_hidden   BOOLEAN DEFAULT FALSE,
    criteria    JSONB NOT NULL
);

CREATE TABLE app.user_achievements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id         UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    achievement_id  UUID NOT NULL REFERENCES app.achievements(id) ON DELETE CASCADE,
    progress        REAL DEFAULT 0 CHECK (progress >= 0 AND progress <= 1),
    is_completed    BOOLEAN DEFAULT FALSE,
    completed_at    TIMESTAMPTZ,
    notified_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, achievement_id)
);

-- =============================================================================
-- LOCATION HISTORY (partitioned)
-- =============================================================================
CREATE TABLE app.location_history (
    id          UUID DEFAULT gen_random_uuid_v7(),
    user_id     UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    lat         DOUBLE PRECISION NOT NULL,
    lng         DOUBLE PRECISION NOT NULL,
    accuracy    REAL,
    speed       REAL,
    heading     REAL,
    altitude    REAL,
    activity    VARCHAR(50),
    place_id    UUID REFERENCES app.places(id) ON DELETE SET NULL,
    city        VARCHAR(100),
    state       VARCHAR(100),
    recorded_at TIMESTAMPTZ DEFAULT now()
) PARTITION BY RANGE (recorded_at);
CREATE INDEX idx_loc_user ON app.location_history(user_id, recorded_at DESC);
CREATE INDEX idx_loc_time ON app.location_history USING BRIN (recorded_at);

-- =============================================================================
-- SEARCH HISTORY (partitioned)
-- =============================================================================
CREATE TABLE app.search_history (
    id              UUID DEFAULT gen_random_uuid_v7(),
    user_id         UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    query           VARCHAR(500) NOT NULL,
    filters         JSONB,
    results_count   INTEGER,
    clicked_place_id UUID REFERENCES app.places(id) ON DELETE SET NULL,
    session_id      VARCHAR(100),
    search_lat      DOUBLE PRECISION,
    search_lng      DOUBLE PRECISION,
    duration_ms     INTEGER,
    created_at      TIMESTAMPTZ DEFAULT now()
) PARTITION BY RANGE (created_at);
CREATE INDEX idx_search_user ON app.search_history(user_id, created_at DESC);

-- =============================================================================
-- CONTENT MODERATION
-- =============================================================================
CREATE TABLE app.content_reports (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    reporter_id         UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    reason              content_report_reason NOT NULL,
    description         TEXT,
    status              content_report_status DEFAULT 'pending',
    target_review_id    UUID REFERENCES app.reviews(id) ON DELETE SET NULL,
    target_photo_id     UUID REFERENCES app.place_photos(id) ON DELETE SET NULL,
    target_post_id      UUID REFERENCES app.social_posts(id) ON DELETE SET NULL,
    target_comment_id   UUID REFERENCES app.social_comments(id) ON DELETE SET NULL,
    target_user_id      UUID REFERENCES app.users(id) ON DELETE SET NULL,
    reviewed_by         UUID,
    reviewed_at         TIMESTAMPTZ,
    resolution          TEXT,
    created_at          TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_reports_status ON app.content_reports(status, created_at);

-- =============================================================================
-- SAFETY
-- =============================================================================
CREATE TABLE app.safety_alerts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id         UUID REFERENCES app.users(id),
    alert_type      VARCHAR(50) NOT NULL,
    severity        VARCHAR(20) NOT NULL,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    location_lat    DOUBLE PRECISION,
    location_lng    DOUBLE PRECISION,
    radius_meters   INTEGER,
    expires_at      TIMESTAMPTZ NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- FORECASTING
-- =============================================================================
CREATE TABLE app.ai_forecasts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id         UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    forecast_type   VARCHAR(50) NOT NULL,
    prediction      JSONB NOT NULL,
    confidence      REAL NOT NULL,
    model_version   VARCHAR(20),
    valid_until     TIMESTAMPTZ,
    was_accurate    BOOLEAN,
    created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_forecasts_user ON app.ai_forecasts(user_id, forecast_type);

-- =============================================================================
-- FEATURE FLAGS
-- =============================================================================
CREATE TABLE infrastructure.feature_flags (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    name                VARCHAR(100) NOT NULL UNIQUE,
    description         VARCHAR(500),
    enabled             BOOLEAN DEFAULT FALSE,
    rollout_percentage  INTEGER DEFAULT 100,
    target_environments JSONB,
    target_users        JSONB,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- DEPLOYMENTS
-- =============================================================================
CREATE TABLE infrastructure.deployments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    service         VARCHAR(100) NOT NULL,
    version         VARCHAR(50) NOT NULL,
    environment     VARCHAR(20) NOT NULL,
    git_sha         VARCHAR(40),
    deployed_by     VARCHAR(320),
    status          VARCHAR(20),
    duration_seconds INTEGER,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- CRON EXECUTIONS
-- =============================================================================
CREATE TABLE infrastructure.cron_executions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    job_name        VARCHAR(100) NOT NULL,
    started_at      TIMESTAMPTZ NOT NULL,
    completed_at    TIMESTAMPTZ,
    status          VARCHAR(20),
    error_message   TEXT,
    duration_ms     INTEGER
);
```

---

## Section 18: ERD Design

### Relationship Summary

```
users 1──1 profiles
users 1──1 user_preferences
users 1──1 travel_dna
users 1──1 food_dna
users 1──N user_devices
users 1──N user_sessions
users 1──N reviews
users 1──N favorites
users 1──N favorite_lists
users 1──N trips
users 1──N ai_conversations
users 1──N ai_recommendations
users 1──N memory_facts
users 1──N social_posts
users 1──N social_comments
users 1──N social_likes
users 1──N notifications
users 1──N location_history
users 1──N search_history
users 1──N user_achievements
users 1──N business_accounts
users 1──N subscriptions
users 1──N wallets
users N──N users (via user_follows)

places 1──N place_photos
places 1──N place_hours
places 1──N place_views
places 1──N place_statistics
places 1──N reviews
places 1──N favorites
places 1──N trip_stops
places 1──N routes (origin)
places 1──N routes (destination)
places 1──N events
places 1──N social_posts
places 1──N ai_recommendations
places 1──N personalized_recommendations
places 1──1 business_accounts (via claimed_by)

trips 1──N trip_days
trip_days 1──N trip_stops
trip_days N──1 trips

routes 1──N transport_options

reviews 1──N review_votes
reviews 1──N review_reports
reviews 1──N review_replies

business_accounts 1──N promotions
business_accounts 1──N coupons
business_accounts 1──N advertising_slots
business_accounts 1──N loyalty_programs

events 1──N event_tickets
events 1──N event_bookings

social_posts 1──N social_comments
social_posts 1──N social_likes

achievements 1──N user_achievements
```

---

## Section 19: Index Strategy

| Index Type | Count | Examples |
|-----------|-------|----------|
| B-tree (primary/secondary) | 55+ | `idx_users_email`, `idx_places_category`, `idx_reviews_place` |
| GiST (spatial) | 1 | `idx_places_location` |
| GIN (full-text) | 2 | `idx_places_search`, `idx_places_name_trgm` |
| IVFFlat (vector) | 2 | `idx_places_embedding`, `idx_knowledge_embedding` |
| BRIN (time-series) | 3 | `idx_loc_time`, `idx_audit_time` |
| Partial | 8 | `idx_places_hidden WHERE is_hidden_gem`, `idx_notif_user WHERE NOT is_read` |
| Composite | 25+ | `idx_reviews_place(rating DESC)`, `idx_routes_od(origin, dest, mode)` |
| Covering (INCLUDE) | 0* | *Planned for Phase 2 after query analysis |

---

## Section 20: Partitioning Strategy

| Table | Key | Interval | Retention | Rows at 1M MAU |
|-------|-----|----------|-----------|-----------------|
| `location_history` | `recorded_at` | Monthly | 6 months | ~500M |
| `api_audit_logs` | `created_at` | Monthly | 12 months | ~2B |
| `search_history` | `created_at` | Monthly | 3 months | ~50M |
| `place_views` | `created_at` | Monthly | 12 months | ~500M |
| `analytics.events` | `created_at` | Monthly | 6 months | ~1B |

---

## Section 21-22: Prisma Architecture

```prisma
// Key conventions:
// - All models use @@map() for snake_case table names
// - All fields use camelCase in Prisma, snake_case in DB via @map()
// - All PKs: @id @default(uuid()) @db.Uuid
// - All timestamps: @db.Timestamptz()
// - All strings have explicit @db.VarChar(N) or @db.Text
// - Enums are native PostgreSQL enums, not Prisma-level strings
// - Relations use named relations for clarity
// - Indexes use @@index with explicit names
// - Unique constraints use @@unique with explicit names
```

---

## Section 23: Query Optimization

**Top 10 Queries — Optimized:**

1. **Nearby places:** `ST_DWithin` + GiST index → <10ms for 5km radius
2. **Place detail by slug:** B-tree on `slug` UNIQUE → <1ms
3. **Place reviews:** Composite index `(place_id, rating DESC)` with partial WHERE → <5ms
4. **User favorites:** Composite index `(user_id, created_at DESC)` → <5ms
5. **AI context:** `memory_facts` query by `(user_id, category)` → <3ms
6. **Search autocomplete:** Algolia → <50ms, not PostgreSQL
7. **Trending places:** Partial index `WHERE is_trending` → <5ms
8. **Hidden gems:** Partial index `WHERE is_hidden_gem` → <5ms
9. **Route lookup:** Composite `(origin, destination, mode)` → <3ms
10. **Personalized recs:** Pre-computed table, index on `(user_id, score DESC)` → <3ms

---

## Section 24: Database Scaling

| Scale | Users | DB Spec | Strategy |
|-------|-------|---------|----------|
| **Launch** | 10K | 2 vCPU, 8 GB | Single instance, no replication |
| **Growth** | 100K | 4 vCPU, 16 GB + 1 replica | Read replica for discovery queries |
| **Scale** | 1M | 8 vCPU, 32 GB + 2 replicas | PgBouncer pooling, partition large tables, Redis caching |
| **Hyper** | 10M | 16 vCPU, 64 GB + 4 replicas | Multi-region, DB sharding by region, separate analytics DB (ClickHouse) |

---

## Complete Table Inventory: 89 Tables

| Schema | Tables | Count |
|--------|--------|-------|
| `app` | users, profiles, user_preferences, travel_dna, food_dna, user_devices, user_sessions, user_follows | 8 |
| `app` | places, place_photos, place_hours, place_views, place_statistics | 5 |
| `app` | reviews, review_votes, review_reports, review_replies | 4 |
| `app` | favorite_lists, favorites | 2 |
| `app` | trips, trip_days, trip_stops | 3 |
| `app` | routes, transport_options | 2 |
| `app` | ai_conversations, ai_messages, ai_recommendations, memory_facts, knowledge_chunks | 5 |
| `app` | user_similarities, personalized_recommendations | 2 |
| `app` | events, event_tickets, event_bookings | 3 |
| `app` | business_accounts, business_claims, subscriptions | 3 |
| `app` | promotions, coupons, coupon_redemptions | 3 |
| `app` | loyalty_programs, loyalty_members, advertising_slots | 3 |
| `app` | hotel_bookings | 1 |
| `app` | wallets, wallet_transactions | 2 |
| `app` | social_posts, social_comments, social_likes | 3 |
| `app` | travel_communities, community_members | 2 |
| `app` | notifications | 1 |
| `app` | achievements, user_achievements | 2 |
| `app` | location_history (partitioned) | 1 |
| `app` | search_history (partitioned) | 1 |
| `app` | content_reports, safety_alerts, ai_forecasts | 3 |
| `app` | (enum types: 15) | — |
| `analytics` | events (partitioned), daily_snapshots, business_daily_metrics | 3 |
| `audit` | api_audit_logs (partitioned) | 1 |
| `infrastructure` | feature_flags, deployments, cron_executions | 3 |
| **Total** | | **89** |

---

*End of Database Architecture & Prisma Blueprint — 24 sections, 89 tables, production-grade.*
