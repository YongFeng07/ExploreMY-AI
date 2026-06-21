# ExploreMY AI — Business Cloud Ecosystem

> **Author:** Chief Revenue Officer / Principal SaaS Architect  
> **Version:** 1.0  
> **Target Market:** 50,000+ Malaysian businesses  
> **Revenue Model:** SaaS subscriptions + advertising + transaction fees  
> **Platform:** Web dashboard + mobile companion

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     BUSINESS CLOUD ECOSYSTEM                             │
│                                                                          │
│  ┌───────────────────────┐  ┌───────────────────────┐                   │
│  │   BUSINESS PORTAL      │  │   MERCHANT MOBILE      │                  │
│  │   (Next.js Web App)    │  │   (Companion App)      │                  │
│  │                        │  │                        │                  │
│  │  • Dashboard           │  │  • Real-time alerts    │                  │
│  │  • Analytics           │  │  • Review replies      │                  │
│  │  • Campaign Manager    │  │  • Quick promotions    │                  │
│  │  • Listing Editor      │  │  • Scan-to-verify      │                  │
│  │  • Billing & Subs      │  │  • QR menu access      │                  │
│  └───────────┬───────────┘  └───────────┬───────────┘                   │
│              │                          │                                │
│              └──────────┬───────────────┘                                │
│                         ▼                                                │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    BUSINESS API GATEWAY                           │    │
│  │                    (RBAC: owner, manager, staff, viewer)          │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                         │                                                │
│  ┌───────────────────────▼─────────────────────────────────────────┐    │
│  │                    BUSINESS SERVICES                              │    │
│  │                                                                   │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │    │
│  │  │ Claiming │ │ Analytics│ │Promotions│ │Advertising│           │    │
│  │  │ Service  │ │ Engine   │ │ Engine   │ │ Platform │           │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │    │
│  │  │Restaurant│ │  Hotel   │ │Attraction│ │  Loyalty │           │    │
│  │  │ Manager  │ │ Manager  │ │ Manager  │ │  Engine  │           │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │    │
│  │  │Billing & │ │Review    │ │ Campaign │ │Merchant  │           │    │
│  │  │Subs Mgmt │ │Manager   │ │ Analytics│ │API/WH    │           │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                         │                                                │
│  ┌───────────────────────▼─────────────────────────────────────────┐    │
│  │                    DATA LAYER                                     │    │
│  │  PostgreSQL · Redis · Supabase Storage · Stripe · SendGrid       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Pricing Tiers

| Plan | Price (MYR/mo) | Listings | Promotions | Ads Credit | Analytics | API Access |
|------|---------------|----------|------------|------------|-----------|------------|
| **Free** | RM 0 | 1 | 0 | 0 | Basic | No |
| **Pro** | RM 99 | 3 | 5 active | RM 50 | Advanced | No |
| **Business** | RM 299 | 10 | 20 active | RM 200 | Full + Export | Yes |
| **Enterprise** | RM 999 | Unlimited | Unlimited | RM 1,000 | Full + API | Yes + White-label |

### RBAC Roles (Business Level)

| Role | Capabilities |
|------|-------------|
| **Owner** | Full access — billing, staff management, claim ownership |
| **Manager** | Edit listings, manage promotions, view analytics, reply to reviews |
| **Staff** | Reply to reviews, view basic analytics, create promotions (needs approval) |
| **Viewer** | Read-only access to analytics and listings |
| **Accountant** | Billing, invoices, subscription management only |

---

## Section 8.1: Merchant Dashboard

### 8.1.1 Dashboard Home

The dashboard home provides an at-a-glance view of business performance with actionable insights.

#### Component Layout

```
┌──────────────────────────────────────────────────────────────┐
│  👋 Good morning, Ahmad!           [Pro Plan]  [⚙ Settings]  │
│  Nasi Lemak Tanglin · Kuala Lumpur                            │
├──────────┬──────────┬──────────┬──────────┬──────────────────┤
│  👁 Views │ 🧭 Direct │ ⭐ Rating │ 💬 Reviews│ 📈 Conversion   │
│  12.4K   │  3.2K    │  4.7 ★   │  238      │  8.3%           │
│  +12% ▲  │  +5% ▲   │  +0.1 ▲  │  12 new   │  +2.1% ▲        │
├──────────┴──────────┴──────────┴──────────┴──────────────────┤
│                                                               │
│  📊 Performance Trend (30 days)                    [Export]   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇         │ │
│  │  Views by day · Avg 413/day · Peak: Sat 12pm-2pm        │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  🔥 What's Working                 ⚡ Quick Actions           │
│  ┌────────────────────────┐  ┌────────────────────────────┐ │
│  │ • "Nasi lemak" search  │  │ [+ Create Promotion]       │ │
│  │   driving 45% of views │  │ [✎ Update Hours]           │ │
│  │ • Saturday brunch peak │  │ [📷 Add Photos]            │ │
│  │ • Photos with food 🍛   │  │ [💬 Reply to 3 reviews]    │ │
│  │   get 3x more clicks   │  │ [📊 View Full Report]      │ │
│  └────────────────────────┘  └────────────────────────────┘ │
│                                                               │
│  📝 Recent Reviews                        [Reply All →]      │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ ★★★★★ "Best nasi lemak in KL!" — Sarah C.  · 2h ago   │ │
│  │ ★★★★☆ "Great sambal, long queue" — Raj P. · 1d ago    │ │
│  │ ★★★★★ "Worth the trip from Singapore!" — John T. · 2d  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  💡 AI Insight                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ ✨ Your "nasi lemak with rendang" combo gets 2.4x more  │ │
│  │    clicks than other photos. Feature it in your gallery.│ │
│  │    Restaurants with 10+ photos get 45% more direction   │ │
│  │    requests. You have 6 — add 4 more.                   │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

#### API: Dashboard Overview

```
GET /business/dashboard/overview?period=7d|30d|90d|year
```

**Response:**
```json
{
  "data": {
    "period": "30d",
    "metrics": {
      "views": { "value": 12400, "change": 12.5, "trend": "up" },
      "directionRequests": { "value": 3200, "change": 5.2, "trend": "up" },
      "averageRating": { "value": 4.7, "change": 0.1, "trend": "up" },
      "reviewCount": { "value": 238, "change": 12, "trend": "up" },
      "conversionRate": { "value": 8.3, "change": 2.1, "trend": "up" },
      "favorites": { "value": 890, "change": 45, "trend": "up" },
      "calls": { "value": 560, "change": -3.2, "trend": "down" },
      "websiteClicks": { "value": 340, "change": 15.8, "trend": "up" }
    },
    "topSearchTerms": ["nasi lemak kl", "halal breakfast", "malay food near me"],
    "peakHours": [
      { "day": "Saturday", "hour": 11, "views": 89 },
      { "day": "Sunday", "hour": 10, "views": 76 }
    ],
    "trafficSources": {
      "nearbySearch": 45, "keywordSearch": 28, "mapBrowse": 15, "tripPlan": 8, "socialPost": 4
    },
    "aiInsight": {
      "title": "Photo opportunity",
      "description": "Restaurants with 10+ photos get 45% more direction requests. You have 6 — add 4 more.",
      "action": { "label": "Add Photos", "url": "/business/places/123/photos" }
    }
  }
}
```

### 8.1.2 Analytics APIs

```
GET /business/dashboard/analytics/views?period=&granularity=day|week|month
  → Time-series view data with comparison to previous period

GET /business/dashboard/analytics/search?period=
  → Search queries driving traffic, CTR per query, ranking position

GET /business/dashboard/analytics/audience?period=
  → Demographics: local vs tourist, origin cities, device types, languages

GET /business/dashboard/analytics/competitors?radius=3000
  → Top 5 competitors in area: their rating, review count, trending status, price level

GET /business/dashboard/analytics/conversion?period=
  → Funnel: impression → view detail → direction request → visit estimate
```

#### Traffic Analytics Response

```json
{
  "data": {
    "funnel": {
      "mapImpressions": 85000,
      "detailViews": 12400,
      "directionRequests": 3200,
      "callClicks": 560,
      "websiteClicks": 340,
      "estimatedVisits": 2800
    },
    "conversionRates": {
      "impressionToView": "14.6%",
      "viewToDirection": "25.8%",
      "viewToVisit": "22.6%"
    },
    "byDayOfWeek": [
      { "day": "Mon", "views": 340, "directions": 82 },
      { "day": "Tue", "views": 380, "directions": 95 },
      { "day": "Wed", "views": 410, "directions": 102 },
      { "day": "Thu", "views": 420, "directions": 108 },
      { "day": "Fri", "views": 450, "directions": 115 },
      { "day": "Sat", "views": 580, "directions": 168 },
      { "day": "Sun", "views": 520, "directions": 142 }
    ],
    "byHour": [
      { "hour": 8, "views": 320 }, { "hour": 9, "views": 480 },
      { "hour": 10, "views": 680 }, { "hour": 11, "views": 750 },
      { "hour": 12, "views": 820 }, { "hour": 13, "views": 690 }
    ]
  }
}
```

### 8.1.3 Dashboard Database Tables

```sql
-- Aggregated daily metrics per business place
CREATE TABLE business_daily_metrics (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    business_id     UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    place_id        UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    date            DATE NOT NULL,
    views           INTEGER NOT NULL DEFAULT 0,
    direction_requests INTEGER NOT NULL DEFAULT 0,
    call_clicks     INTEGER NOT NULL DEFAULT 0,
    website_clicks  INTEGER NOT NULL DEFAULT 0,
    favorites_added INTEGER NOT NULL DEFAULT 0,
    reviews_written INTEGER NOT NULL DEFAULT 0,
    search_appearances INTEGER NOT NULL DEFAULT 0,
    search_clicks   INTEGER NOT NULL DEFAULT 0,
    UNIQUE (place_id, date)
);

CREATE INDEX idx_biz_metrics_date ON business_daily_metrics (business_id, date);
CREATE INDEX idx_biz_metrics_place ON business_daily_metrics (place_id, date);

-- Search query analytics
CREATE TABLE business_search_analytics (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    business_id     UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    place_id        UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    date            DATE NOT NULL,
    query           VARCHAR(500) NOT NULL,
    impressions     INTEGER NOT NULL DEFAULT 0,
    clicks          INTEGER NOT NULL DEFAULT 0,
    avg_position    REAL,
    UNIQUE (place_id, date, query)
);

-- Competitor tracking
CREATE TABLE competitor_tracking (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    business_id     UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    place_id        UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    competitor_place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    distance_meters INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (place_id, competitor_place_id)
);
```

---

## Section 8.2: Business Claiming System

### 8.2.1 Verification Workflow

```
MERCHANT DISCOVERS LISTING
  │
  ▼
1. CLAIM REQUEST
   ├─→ Search for business on ExploreMY
   ├─→ Tap "Claim this business"
   └─→ Submit claim form
  │
  ▼
2. VERIFICATION (TIERED)
   │
   ├─→ Tier 1: Instant Verification (low-risk)
   │     • Phone OTP (SMS to business phone on listing)
   │     • OR Email verification (code to business email)
   │     → Immediate claim for category: RESTAURANT, CAFE, STREET_FOOD
   │
   ├─→ Tier 2: Document Verification (medium-risk)
   │     • Business registration number (SSM lookup)
   │     • OR utility bill showing business name + address
   │     • OR tenancy agreement
   │     → Required for: HOTEL, HOSPITAL, PHARMACY
   │     → Review time: 1–3 business days
   │
   └─→ Tier 3: Enhanced Verification (high-risk)
         • Government-issued business license
         • SSM certificate of incorporation
         • Photo ID of owner/director
         • Physical address verification (postcard or video call)
         → Required for: claimed-by-multiple, disputes, flagged listings
         → Review time: 3–7 business days
  │
  ▼
3. FRAUD DETECTION CHECKS (automated)
   ├─→ Is this listing already claimed by another verified user?
   ├─→ Does the claimer's IP/location match the business area?
   ├─→ Has this user claimed multiple businesses in different cities?
   ├─→ Is the phone number associated with fraud reports?
   ├─→ Does the email domain match the business website?
   └─→ Risk score: 0–100
  │
  ▼
4. APPROVAL / REJECTION
   ├─→ Auto-approve: riskScore < 20 + Tier 1
   ├─→ Manual review: riskScore 20–60 or Tier 2
   └─→ Auto-reject: riskScore > 60 (with appeal option)
  │
  ▼
5. POST-CLAIM
   ├─→ Business Dashboard activated
   ├─→ 14-day grace period (monitor for disputes)
   ├─→ Original lister notified (if user-submitted place)
   └─→ Analytics tracking begins
```

### 8.2.2 Database Tables

```sql
CREATE TABLE business_claims (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    place_id            UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_name       VARCHAR(255) NOT NULL,
    business_type       VARCHAR(100),
    registration_number VARCHAR(50),
    phone               VARCHAR(20),
    email               VARCHAR(320),
    website             VARCHAR(2048),
    verification_tier   VARCHAR(20) NOT NULL DEFAULT 'tier_1',
    verification_method VARCHAR(30), -- 'phone_otp', 'email', 'document', 'government'

    -- Verification status
    status              VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- pending → phone_verified → document_submitted → under_review → approved | rejected

    -- Documents
    documents           JSONB,     -- [{ type, url, verified }]

    -- Fraud detection
    fraud_risk_score    REAL DEFAULT 0,
    fraud_flags         JSONB,

    -- Review
    reviewed_by         UUID REFERENCES users(id),
    reviewed_at         TIMESTAMPTZ,
    reviewer_notes      TEXT,
    rejection_reason    VARCHAR(500),

    -- Metadata
    ip_address          INET,
    user_agent          VARCHAR(512),
    claim_source        VARCHAR(50) DEFAULT 'app', -- 'app', 'web', 'api', 'partner'

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (place_id, user_id) -- One claim attempt per user per place
);

CREATE INDEX idx_claims_status ON business_claims (status, created_at);
CREATE INDEX idx_claims_place ON business_claims (place_id);
CREATE INDEX idx_claims_risk ON business_claims (fraud_risk_score);
```

### 8.2.3 APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/business/claims` | user | Submit claim request |
| `GET` | `/business/claims/status/:placeId` | user | Check claim status |
| `POST` | `/business/claims/:id/verify-phone` | user | Submit phone OTP |
| `POST` | `/business/claims/:id/verify-email` | user | Submit email code |
| `POST` | `/business/claims/:id/documents` | user | Upload verification docs |
| `GET` | `/admin/claims/pending` | admin | Pending claims queue |
| `PATCH` | `/admin/claims/:id/review` | admin | Approve/reject claim |
| `POST` | `/admin/claims/:id/request-more` | admin | Request additional docs |
| `POST` | `/business/claims/:id/dispute` | user | Dispute a rejection |

---

## Section 8.3: Restaurant Management Platform

### 8.3.1 Feature Set

```
RESTAURANT MANAGEMENT
├── Menu Management
│   ├── Digital menu (structured: sections, items, prices, descriptions, photos)
│   ├── QR code generation (links to ExploreMY menu view)
│   ├── Dietary labels (halal, vegetarian, vegan, gluten-free, no-pork)
│   ├── Spice level indicators (🌶, 🌶🌶, 🌶🌶🌶)
│   ├── Featured items (pinned to top of place detail)
│   └── Menu versioning + change history
│
├── Operations
│   ├── Business hours (regular + special/holiday)
│   ├── Temporary closures (PH, renovation, private event)
│   ├── Capacity/availability (for reservations)
│   ├── Service types: dine-in, takeaway, delivery
│   └── Accepted payment methods
│
├── Media Gallery
│   ├── Photo upload with AI tagging (food recognition)
│   ├── Video upload (30s clips, Instagram Reels style)
│   ├── 360° virtual tour integration
│   ├── Photo ordering (drag-to-reorder)
│   └── A/B testing: which hero photo drives more clicks?
│
├── Customer Insights
│   ├── Review sentiment analysis over time
│   ├── Most-mentioned dishes (NLP extraction from reviews)
│   ├── Customer demographics (local vs tourist, origin cities)
│   ├── Peak hour predictions (ML model)
│   └── Competitor benchmarking
│
└── Promotions (see Section 8.6)
```

### 8.3.2 Menu Database Schema

```sql
CREATE TABLE menus (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    place_id        UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL DEFAULT 'Main Menu',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    version         INTEGER NOT NULL DEFAULT 1,
    language        VARCHAR(10) DEFAULT 'en',
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (place_id, name, version)
);

CREATE TABLE menu_sections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    menu_id         UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL, -- "Appetizers", "Nasi Lemak", "Drinks"
    description     VARCHAR(500),
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE menu_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    section_id      UUID NOT NULL REFERENCES menu_sections(id) ON DELETE CASCADE,
    name            VARCHAR(300) NOT NULL,
    description     VARCHAR(1000),
    price           NUMERIC(10,2) NOT NULL,
    currency        VARCHAR(3) DEFAULT 'MYR',
    photos          JSONB,               -- [{ url, thumbnail }]
    dietary_labels  JSONB,               -- ["halal", "vegetarian"]
    spice_level     INTEGER CHECK (spice_level BETWEEN 0 AND 5),
    is_available    BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
    is_bestseller   BOOLEAN NOT NULL DEFAULT FALSE,
    preparation_time_min INTEGER,
    calories        INTEGER,
    tags            JSONB,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Customer favorite items (extracted from reviews)
CREATE TABLE menu_insights (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    place_id        UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    item_name       VARCHAR(300) NOT NULL,
    mention_count   INTEGER NOT NULL DEFAULT 0,
    positive_ratio  REAL NOT NULL DEFAULT 0,
    avg_rating_impact REAL,
    last_updated    TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (place_id, item_name)
);
```

### 8.3.3 APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/business/restaurant/:placeId/menu` | Get current menu |
| `PUT` | `/business/restaurant/:placeId/menu` | Update full menu |
| `POST` | `/business/restaurant/:placeId/menu/sections` | Add section |
| `PATCH` | `/business/restaurant/:placeId/menu/sections/:id` | Update section |
| `DELETE` | `/business/restaurant/:placeId/menu/sections/:id` | Delete section |
| `POST` | `/business/restaurant/:placeId/menu/items` | Add item |
| `PATCH` | `/business/restaurant/:placeId/menu/items/:id` | Update item |
| `DELETE` | `/business/restaurant/:placeId/menu/items/:id` | Delete item |
| `GET` | `/business/restaurant/:placeId/insights` | Customer insights |
| `GET` | `/business/restaurant/:placeId/competitors` | Competitor analysis |
| `GET` | `/business/restaurant/:placeId/qr-menu` | Generate QR code for menu |
| `PATCH` | `/business/restaurant/:placeId/hours` | Update operating hours |
| `PATCH` | `/business/restaurant/:placeId/gallery` | Manage photo gallery |

---

## Section 8.4: Hotel Management Platform

### 8.4.1 Feature Set

```
HOTEL MANAGEMENT
├── Hotel Profile
│   ├── Property details (star rating, room count, check-in/out times)
│   ├── Amenities (pool, gym, spa, parking, breakfast, WiFi, airport shuttle)
│   ├── Property photos + virtual tour
│   ├── Location advantages (near LRT, beachfront, city center)
│   └── Languages spoken by staff
│
├── Room Management
│   ├── Room types (single, double, suite, family, dorm)
│   ├── Room inventory per type
│   ├── Pricing: base rate + seasonal adjustments
│   ├── Availability calendar
│   ├── Room amenities per type
│   └── Room photos per type
│
├── Booking Integration
│   ├── Direct booking link (redirect to hotel website / OTA)
│   ├── Booking.com price comparison
│   ├── Agoda price comparison
│   ├── Real-time rate display
│   └── Click-through conversion tracking
│
├── Promotions
│   ├── Seasonal packages (Ramadan special, Merdeka deal, Year-end sale)
│   ├── Length-of-stay discounts
│   ├── Early bird discounts
│   ├── Last-minute deals
│   └── Package deals (room + nearby attraction)
│
└── Analytics
    ├── Occupancy rate estimates (based on review velocity + season)
    ├── Average daily rate (ADR) benchmarking
    ├── Guest origin analysis
    ├── Length-of-stay distribution
    └── Review sentiment by category (cleanliness, location, service, value)
```

### 8.4.2 Database Schema

```sql
CREATE TABLE hotel_profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    place_id            UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    star_rating         INTEGER CHECK (star_rating BETWEEN 1 AND 5),
    room_count          INTEGER,
    check_in_time       TIME DEFAULT '14:00',
    check_out_time      TIME DEFAULT '12:00',
    amenities           JSONB,
    languages_spoken    JSONB,
    booking_url         VARCHAR(2048),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (place_id)
);

CREATE TABLE room_types (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    hotel_id        UUID NOT NULL REFERENCES hotel_profiles(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    base_price      NUMERIC(10,2),
    currency        VARCHAR(3) DEFAULT 'MYR',
    max_occupancy   INTEGER DEFAULT 2,
    bed_type        VARCHAR(50),
    room_size_sqm   REAL,
    amenities       JSONB,
    photos          JSONB,
    inventory_count INTEGER DEFAULT 1,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE room_availability (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    room_type_id    UUID NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
    date            DATE NOT NULL,
    available_rooms INTEGER NOT NULL,
    price_override  NUMERIC(10,2),
    reason          VARCHAR(200),

    UNIQUE (room_type_id, date)
);

CREATE TABLE hotel_packages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    hotel_id        UUID NOT NULL REFERENCES hotel_profiles(id) ON DELETE CASCADE,
    name            VARCHAR(300) NOT NULL,
    description     TEXT,
    discount_type   VARCHAR(50),
    discount_value  NUMERIC(10,2),
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    min_stay_nights INTEGER DEFAULT 1,
    promo_code      VARCHAR(50),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 8.4.3 APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/business/hotel/:placeId/profile` | Get hotel profile |
| `PUT` | `/business/hotel/:placeId/profile` | Update hotel profile |
| `GET` | `/business/hotel/:placeId/rooms` | List room types |
| `POST` | `/business/hotel/:placeId/rooms` | Add room type |
| `PATCH` | `/business/hotel/:placeId/rooms/:id` | Update room type |
| `DELETE` | `/business/hotel/:placeId/rooms/:id` | Remove room type |
| `GET` | `/business/hotel/:placeId/availability` | Availability calendar |
| `PUT` | `/business/hotel/:placeId/availability` | Update availability |
| `GET` | `/business/hotel/:placeId/packages` | List packages |
| `POST` | `/business/hotel/:placeId/packages` | Create package |
| `GET` | `/business/hotel/:placeId/analytics` | Hotel analytics |

---

## Section 8.5: Attraction Management Platform

### 8.5.1 Feature Set

```
ATTRACTION MANAGEMENT
├── Listing Management
│   ├── Attraction details (type, duration, best time to visit)
│   ├── Ticket price tiers (adult, child, senior, foreigner, MyKad)
│   ├── Operating hours + seasonal variations
│   ├── Accessibility information
│   ├── Age restrictions / suitability
│   └── What to bring / dress code
│
├── Ticketing Integration
│   ├── Direct booking link (Klook, Trip.com, own website)
│   ├── QR code ticket validation (for on-site scanning)
│   ├── Real-time availability display
│   └── Skip-the-line / fast pass options
│
├── Visitor Analytics
│   ├── Visitor origin analysis
│   ├── Peak visitation times
│   ├── Average dwell time
│   ├── Review sentiment trends
│   └── Photo-taking hotspots (heatmap)
│
└── Promotions
    ├── Combo tickets (attraction + transport)
    ├── Group discounts
    ├── Student/senior discounts
    ├── Seasonal pricing
    └── Local resident discounts (MyKad)
```

### 8.5.2 Database Schema

```sql
CREATE TABLE attraction_profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    place_id            UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    attraction_type     VARCHAR(50),
    typical_duration_min INTEGER,
    best_time_to_visit  VARCHAR(500),
    age_restriction     VARCHAR(200),
    dress_code          VARCHAR(300),
    what_to_bring       JSONB,
    accessibility_info  TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (place_id)
);

CREATE TABLE ticket_tiers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    attraction_id   UUID NOT NULL REFERENCES attraction_profiles(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL, -- "Adult", "Child (3-12)", "Senior (60+)", "Foreigner"
    price           NUMERIC(10,2) NOT NULL,
    currency        VARCHAR(3) DEFAULT 'MYR',
    description     VARCHAR(500),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE attraction_visitor_analytics (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    attraction_id   UUID NOT NULL REFERENCES attraction_profiles(id) ON DELETE CASCADE,
    date            DATE NOT NULL,
    estimated_visitors INTEGER,
    direction_requests INTEGER DEFAULT 0,
    review_count    INTEGER DEFAULT 0,
    avg_rating      REAL,
    peak_hour       INTEGER,
    UNIQUE (attraction_id, date)
);
```

### 8.5.3 APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/business/attraction/:placeId/profile` | Get attraction profile |
| `PUT` | `/business/attraction/:placeId/profile` | Update profile |
| `GET` | `/business/attraction/:placeId/tickets` | List ticket tiers |
| `POST` | `/business/attraction/:placeId/tickets` | Add ticket tier |
| `PATCH` | `/business/attraction/:placeId/tickets/:id` | Update tier |
| `GET` | `/business/attraction/:placeId/analytics` | Visitor analytics |

---

## Section 8.6: Promotion Engine

### 8.6.1 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROMOTION ENGINE                               │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              PROMOTION TYPES                                  │ │
│  │                                                               │ │
│  │  1. Percentage Discount  2. Fixed Discount                   │ │
│  │  3. Buy One Get One      4. Free Item with Purchase          │ │
│  │  5. Happy Hour Special   6. Seasonal Campaign                │ │
│  │  7. Combo Deal           8. Loyalty Reward                   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                           │                                       │
│  ┌─────────────────────────▼───────────────────────────────────┐ │
│  │              DELIVERY CHANNELS                                │ │
│  │                                                               │ │
│  │  • Place Detail Page (pinned banner)                         │ │
│  │  • Nearby Search Results (promoted badge + highlight)        │ │
│  │  • AI Recommendations ("20% off at your saved cafe!")        │ │
│  │  • Push Notifications (targeted by location + interest)      │ │
│  │  • Email Newsletter (weekly digest for subscribed users)     │ │
│  │  • Social Feed (sponsored post)                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                           │                                       │
│  ┌─────────────────────────▼───────────────────────────────────┐ │
│  │              TARGETING ENGINE                                 │ │
│  │                                                               │ │
│  │  • Geographic (within X km)                                  │ │
│  │  • Demographic (age, language, tourist vs local)             │ │
│  │  • Behavioral (visited similar places, saved to favorites)   │ │
│  │  • Temporal (lunch time, weekend, holiday)                   │ │
│  │  • Budget-aware (show relevant discounts to budget travelers)│ │
│  └─────────────────────────────────────────────────────────────┘ │
│                           │                                       │
│  ┌─────────────────────────▼───────────────────────────────────┐ │
│  │              REDEMPTION TRACKING                              │ │
│  │                                                               │ │
│  │  • QR Code / Promo Code → Scan at business                  │ │
│  │  • Automatic tracking: views → clicks → redemptions          │ │
│  │  • Fraud prevention: per-user limits, time-window checks     │ │
│  │  • ROI calculation: (revenue from promo) - (discount cost)   │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 8.6.2 Database Schema

```sql
CREATE TABLE promotions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    business_id         UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    place_id            UUID REFERENCES places(id),
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    promotion_type      VARCHAR(50) NOT NULL,
    -- 'percentage_discount', 'fixed_discount', 'bogo', 'free_item',
    -- 'happy_hour', 'seasonal', 'combo_deal', 'loyalty_reward'

    discount_value      NUMERIC(10,2),
    max_discount        NUMERIC(10,2),
    min_spend           NUMERIC(10,2),

    promo_code          VARCHAR(50),
    is_auto_generated_code BOOLEAN DEFAULT FALSE,

    start_date          TIMESTAMPTZ NOT NULL,
    end_date            TIMESTAMPTZ NOT NULL,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,

    -- Targeting
    target_audience     JSONB,
    target_radius_km    INTEGER,
    target_user_segments JSONB,

    -- Delivery
    delivery_channels   JSONB,

    -- Limits
    total_redemption_limit INTEGER,
    per_user_limit      INTEGER DEFAULT 1,
    daily_limit         INTEGER,

    -- Metrics
    views               INTEGER DEFAULT 0,
    clicks              INTEGER DEFAULT 0,
    redemptions         INTEGER DEFAULT 0,
    revenue_generated   NUMERIC(12,2) DEFAULT 0,
    discount_given      NUMERIC(12,2) DEFAULT 0,

    -- Metadata
    terms_and_conditions TEXT,
    banner_image        VARCHAR(2048),
    created_by          UUID REFERENCES users(id),
    approved_by         UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT ck_promo_dates CHECK (end_date > start_date),
    CONSTRAINT ck_promo_discount CHECK (discount_value > 0)
);

CREATE INDEX idx_promos_active ON promotions (is_active, start_date, end_date);
CREATE INDEX idx_promos_business ON promotions (business_id, is_active);
CREATE INDEX idx_promos_place ON promotions (place_id, is_active);

CREATE TABLE promotion_redemptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    promotion_id    UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coupon_id       UUID REFERENCES coupons(id),
    place_id        UUID REFERENCES places(id),
    discount_amount NUMERIC(10,2),
    transaction_ref VARCHAR(200),
    redeemed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (promotion_id, user_id, redeemed_at)
);

CREATE INDEX idx_promo_redemptions ON promotion_redemptions (promotion_id, redeemed_at);
```

### 8.6.3 APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/business/promotions` | List promotions |
| `POST` | `/business/promotions` | Create promotion |
| `PATCH` | `/business/promotions/:id` | Update promotion |
| `DELETE` | `/business/promotions/:id` | Deactivate |
| `GET` | `/business/promotions/:id/analytics` | Performance stats |
| `GET` | `/promotions/nearby?lat=&lng=` | Discover active promos |
| `POST` | `/promotions/:id/redeem` | Redeem promotion |
| `GET` | `/promotions/:id/validate?code=` | Validate promo code |

---

## Section 8.7: Advertising Platform

### 8.7.1 Architecture

```
AD TYPES:
  ├── Search Promoted (top of search results for keywords)
  ├── Category Featured (top of category browse)
  ├── Nearby Boost (higher ranking in nearby results)
  ├── Home Banner (hero banner on explore page for city)
  ├── Trip Planner Insertion (suggested stop in AI itineraries)
  └── Social Feed Sponsor (promoted post in feed)

BIDDING:
  ├── Cost Per Click (CPC): RM 0.50–5.00
  ├── Cost Per Mille (CPM): RM 5–50 per 1000 impressions
  └── Flat Rate: RM X/day for Home Banner

BUDGET CONTROLS:
  ├── Daily budget cap
  ├── Total campaign budget
  ├── Auto-pause when budget exhausted
  └── Budget pacing (smooth delivery across day)
```

### 8.7.2 Database Schema

```sql
CREATE TABLE ad_campaigns (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    business_id     UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    name            VARCHAR(300) NOT NULL,
    ad_type         VARCHAR(50) NOT NULL,
    -- 'search_promoted', 'category_featured', 'nearby_boost',
    -- 'home_banner', 'trip_planner', 'social_feed'

    status          VARCHAR(20) NOT NULL DEFAULT 'draft',
    -- 'draft', 'pending_review', 'active', 'paused', 'completed', 'rejected'

    -- Creative
    headline        VARCHAR(200),
    description     VARCHAR(500),
    image_url       VARCHAR(2048),
    target_url      VARCHAR(2048),
    cta_text        VARCHAR(50),

    -- Targeting
    target_keywords JSONB,
    target_categories JSONB,
    target_locations JSONB,
    target_radius_km INTEGER,
    target_demographics JSONB,

    -- Budget & Bidding
    bid_type        VARCHAR(20) DEFAULT 'cpc',
    bid_amount      NUMERIC(10,4),
    daily_budget    NUMERIC(10,2),
    total_budget    NUMERIC(10,2),
    spent_amount    NUMERIC(10,2) DEFAULT 0,

    -- Schedule
    start_date      TIMESTAMPTZ NOT NULL,
    end_date        TIMESTAMPTZ NOT NULL,

    -- Performance
    impressions     INTEGER DEFAULT 0,
    clicks          INTEGER DEFAULT 0,
    ctr             REAL GENERATED ALWAYS AS (
        CASE WHEN impressions > 0 THEN (clicks::REAL / impressions) * 100 ELSE 0 END
    ) STORED,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ad_impressions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    campaign_id     UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id),
    place_id        UUID REFERENCES places(id),
    source          VARCHAR(100),
    cost            NUMERIC(10,6),
    clicked         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ad_impressions_campaign ON ad_impressions (campaign_id, created_at);
```

### 8.7.3 APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/business/ads` | List campaigns |
| `POST` | `/business/ads` | Create campaign |
| `PATCH` | `/business/ads/:id` | Update campaign |
| `POST` | `/business/ads/:id/pause` | Pause campaign |
| `POST` | `/business/ads/:id/resume` | Resume campaign |
| `GET` | `/business/ads/:id/analytics` | Campaign performance |
| `GET` | `/business/ads/:id/impressions` | Detailed impression log |
| `POST` | `/ads/track/impression` | Track impression (internal) |
| `POST` | `/ads/track/click` | Track click (internal) |
| `GET` | `/ads/serve?lat=&lng=&category=&query=` | Serve relevant ad (internal) |

---

## Section 8.8: Subscription & Billing

### 8.8.1 Billing Architecture

```
STRIPE INTEGRATION
  │
  ├── Subscription Plans (Product IDs in Stripe)
  │     FREE     → price_free        (RM 0/mo)
  │     PRO      → price_pro_monthly (RM 99/mo)
  │     BUSINESS → price_biz_monthly (RM 299/mo)
  │     ENTERPRISE → price_ent_monthly (RM 999/mo)
  │
  ├── Checkout Flow
  │     1. User selects plan → POST /subscriptions/checkout
  │     2. Stripe Checkout Session created
  │     3. User completes payment on Stripe
  │     4. Stripe webhook → subscription.created → activate
  │
  ├── Billing Cycle
  │     • Monthly billing (1st of month or signup date)
  │     • Annual billing (20% discount: RM 950/yr for Pro)
  │     • Pro-rated upgrades/downgrades
  │     • 14-day free trial for Pro (no card required)
  │
  ├── Invoice Management
  │     • Auto-generated by Stripe
  │     • Downloadable PDFs in dashboard
  │     • GST/SST tax handling (6% for Malaysian businesses)
  │     • Payment receipt email
  │
  └── Dunning Management
        • Failed payment → retry after 3, 7, 14 days
        • Grace period: 7 days past due before features locked
        • Customer notification at each stage
```

### 8.8.2 APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/subscriptions/plans` | List plans with pricing |
| `GET` | `/subscriptions/me` | Current subscription |
| `POST` | `/subscriptions/checkout` | Create checkout session |
| `POST` | `/subscriptions/portal` | Customer billing portal |
| `POST` | `/subscriptions/cancel` | Cancel subscription |
| `POST` | `/subscriptions/resume` | Resume canceled |
| `PATCH` | `/subscriptions/change-plan` | Upgrade/downgrade |
| `GET` | `/business/billing/invoices` | Invoice history |
| `GET` | `/business/billing/invoices/:id/pdf` | Download invoice PDF |

---

## Section 8.9: Customer Loyalty Engine

### 8.9.1 Architecture

```
LOYALTY PROGRAM (per business)
  │
  ├── Points System
  │     • Earn: 1 point per RM 1 spent (verified via receipt scan or promo code)
  │     • Bonus points: double points on weekdays, triple on birthday month
  │     • Referral bonus: 50 points for referring a new customer
  │
  ├── Tier System
  │     • Silver (0–500 points)
  │     • Gold (500–2000 points)
  │     • Platinum (2000+ points)
  │     • Perks increase with tier: discounts, priority booking, free items
  │
  ├── Rewards Catalog
  │     • 100 points → Free drink
  │     • 300 points → 10% off next meal
  │     • 500 points → Free main dish
  │     • 1000 points → Free meal for 2
  │
  └── Visit Streak
        • 3 visits in a month → bonus 50 points
        • 5 visits → bonus 100 points
        • 10 visits → bonus 250 points + Gold tier fast-track
```

### 8.9.2 Database Schema

```sql
CREATE TABLE loyalty_programs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    business_id     UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    points_per_myr  REAL DEFAULT 1.0,
    tier_config     JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (business_id)
);

CREATE TABLE loyalty_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    program_id      UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points_balance  INTEGER DEFAULT 0,
    lifetime_points INTEGER DEFAULT 0,
    tier            VARCHAR(20) DEFAULT 'silver',
    visit_count     INTEGER DEFAULT 0,
    last_visit_at   TIMESTAMPTZ,
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (program_id, user_id)
);

CREATE TABLE loyalty_transactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    member_id       UUID NOT NULL REFERENCES loyalty_members(id) ON DELETE CASCADE,
    type            VARCHAR(20) NOT NULL, -- 'earn', 'redeem', 'bonus', 'expiry', 'adjustment'
    points          INTEGER NOT NULL,
    description     VARCHAR(500),
    reference       VARCHAR(200),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Section 8.10: Review Manager

### 8.10.1 Features

```
REVIEW MANAGEMENT
├── Response Management
│   ├── Reply to reviews (text + photo)
│   ├── Response templates (quick replies for common feedback)
│   ├── Auto-suggest responses (AI-drafted based on review sentiment)
│   ├── Response time tracking (SLA: respond within 24h)
│   └── Bulk reply for similar reviews
│
├── Review Analytics
│   ├── Sentiment trend (weekly/monthly)
│   ├── Topic analysis (what are customers talking about?)
│   ├── Rating drivers (what correlates with 5★ vs 1★?)
│   └── Competitive benchmarking (your rating vs nearby similar businesses)
│
├── Flagging & Reporting
│   ├── Report fake/suspicious reviews
│   ├── Report competitor sabotage
│   ├── Request removal (with evidence)
│   └── Track report status
│
└── Review Generation
    ├── QR code for easy review (scan → opens review form)
    ├── Review request timing (send push 2h after visit detected)
    └── Incentive integration (offer loyalty points for honest reviews)
```

### 8.10.2 APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/business/reviews?status=&rating=&page=` | List reviews |
| `POST` | `/business/reviews/:id/reply` | Reply to review |
| `PATCH` | `/business/reviews/:id/reply/:replyId` | Edit reply |
| `DELETE` | `/business/reviews/:id/reply/:replyId` | Delete reply |
| `POST` | `/business/reviews/:id/report` | Report review |
| `GET` | `/business/reviews/analytics` | Review analytics |
| `GET` | `/business/reviews/templates` | Response templates |
| `POST` | `/business/reviews/ai-suggest/:reviewId` | AI reply suggestion |
| `GET` | `/business/reviews/qr-code` | Generate review QR code |

---

## Section 8.11: Merchant API & Webhooks

### 8.11.1 Public API (Business+ Plans)

```
External Merchant API (API Key auth)
  │
  ├── Places
  │     GET    /merchant/v1/places
  │     GET    /merchant/v1/places/:id
  │     PATCH  /merchant/v1/places/:id
  │
  ├── Reviews
  │     GET    /merchant/v1/reviews?since=&page=
  │     POST   /merchant/v1/reviews/:id/reply
  │
  ├── Analytics
  │     GET    /merchant/v1/analytics/overview?period=
  │     GET    /merchant/v1/analytics/daily?start=&end=
  │
  ├── Promotions
  │     GET    /merchant/v1/promotions
  │     POST   /merchant/v1/promotions
  │
  └── Webhooks
        POST   /merchant/v1/webhooks/register
        Events:
          • review.created
          • review.updated
          • promotion.expired
          • subscription.renewed
          • subscription.canceled
          • campaign.budget_exhausted
```

### 8.11.2 Webhook Delivery

```
Webhook Config:
  • URL: customer-provided HTTPS endpoint
  • Secret: HMAC-SHA256 signing key
  • Retry: 3 attempts (1min, 5min, 15min delays)
  • Timeout: 10s per attempt
  • Dashboard: delivery log with success/failure status

Header:
  X-ExploreMY-Signature: t=1700000000,v1=abc123def456...
  X-ExploreMY-Event: review.created
  X-ExploreMY-Delivery: 3a5b7c9d

Payload:
  {
    "event": "review.created",
    "created": "2026-06-14T10:30:00+08:00",
    "data": { ... }
  }
```

---

## NestJS Module Map

```
src/modules/business/
├── dashboard/             # 8.1 — Analytics dashboard
├── claiming/              # 8.2 — Business claiming + verification
├── restaurant/            # 8.3 — Restaurant management
├── hotel/                 # 8.4 — Hotel management
├── attraction/            # 8.5 — Attraction management
├── promotions/            # 8.6 — Promotion engine
├── advertising/           # 8.7 — Advertising platform
├── subscriptions/         # 8.8 — Stripe billing
├── loyalty/               # 8.9 — Customer loyalty
├── reviews-manager/       # 8.10 — Review management
├── merchant-api/          # 8.11 — External API + webhooks
└── notifications/         # Business notification service
```

## Complete Business API Summary

| Module | Endpoints | Auth Level |
|--------|-----------|------------|
| Dashboard + Analytics | 12 | business_owner+ |
| Claiming | 9 | user + admin |
| Restaurant Management | 14 | business_owner+ |
| Hotel Management | 13 | business_owner+ |
| Attraction Management | 9 | business_owner+ |
| Promotions | 8 | business_owner+ |
| Advertising | 10 | business_owner+ |
| Subscription & Billing | 9 | user + business_owner |
| Loyalty | 8 | user + business_owner |
| Review Manager | 9 | business_owner+ |
| Merchant API | 12 | business_owner+ (API key) |
| **Total** | **113** | |

---

*End of Business Cloud Ecosystem Specification.*
