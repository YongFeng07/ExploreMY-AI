# ExploreMY AI — Business Cloud Ecosystem Blueprint

> **Classification:** Internal — Revenue & Business Engineering  
> **Version:** 7.0  
> **Authors:** CRO · Principal SaaS Architect · Principal Business Systems Architect  
> **Revenue Target:** RM 500M ARR by Year 5  
> **Target Businesses:** 50,000+ claimed · 10,000+ paying subscribers

---

## Section 1: Business Claiming System

### 1.1 Claim Workflow

```
MERCHANT discovers their listing on ExploreMY
  │
  ▼
TAPS "Claim this business"
  │
  ▼
STEP 1: IDENTITY VERIFICATION (choose one)
  ├── Phone OTP → SMS to business phone on listing → instant (Tier 1)
  ├── Email verification → code to business email → instant (Tier 1)
  ├── SSM registration number → automated lookup → 1-3 days (Tier 2)
  └── Document upload → manual review → 3-7 days (Tier 3)
  │
  ▼
STEP 2: BUSINESS PROFILE
  ├── Business name (pre-filled from listing, editable)
  ├── Business type (Restaurant, Hotel, Attraction, etc.)
  ├── Contact details
  └── Logo upload
  │
  ▼
STEP 3: FRAUD CHECK (automated)
  ├── Risk score <20 → auto-approve
  ├── Risk score 20-60 → manual review queue
  └── Risk score >60 → auto-reject with appeal option
  │
  ▼
STEP 4: ONBOARDING
  ├── Welcome email + dashboard access
  ├── 14-day monitoring period
  └── "Complete your profile" checklist
```

### 1.2 Fraud Detection Rules

```typescript
const FRAUD_CHECKS = [
  { check: 'ip_location_mismatch',      weight: 20, desc: 'IP ≠ business location' },
  { check: 'multiple_claims_different_cities', weight: 30, desc: 'User claimed businesses in 3+ cities' },
  { check: 'phone_associated_with_fraud',      weight: 40, desc: 'Phone number flagged in previous reports' },
  { check: 'email_domain_mismatch',     weight: 15, desc: 'Email domain ≠ business website domain' },
  { check: 'rapid_claim_submission',    weight: 10, desc: 'Multiple claims in <1 hour' },
  { check: 'registration_number_invalid', weight: 50, desc: 'SSM lookup failed' },
];
```

### 1.3 Database

```sql
CREATE TABLE business_claims (
    id                  UUID PK DEFAULT gen_random_uuid_v7(),
    place_id            UUID NOT NULL REFERENCES places(id),
    user_id             UUID NOT NULL REFERENCES users(id),
    business_name       VARCHAR(255) NOT NULL,
    business_type       VARCHAR(100),
    registration_number VARCHAR(50),
    phone               VARCHAR(20),
    email               VARCHAR(320),
    verification_tier   VARCHAR(20) DEFAULT 'tier_1',
    verification_method VARCHAR(30),
    status              VARCHAR(20) DEFAULT 'pending',
    documents           JSONB,
    fraud_risk_score    REAL DEFAULT 0,
    fraud_flags         JSONB,
    reviewed_by         UUID,
    reviewed_at         TIMESTAMPTZ,
    rejection_reason    VARCHAR(500),
    ip_address          INET,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE (place_id, user_id)
);
```

---

## Section 2: Merchant Dashboard

### 2.1 Dashboard Layout

```
┌──────────────────────────────────────────────────────────────┐
│  👋 Selamat pagi, Ahmad!              [Pro Plan] [⚙️]       │
│  Nasi Lemak Tanglin · Kuala Lumpur                            │
├──────────┬──────────┬──────────┬──────────┬──────────────────┤
│ 👁 12.4K │ 🧭 3.2K  │ ⭐ 4.7   │ 💬 238   │ 📈 8.3%          │
│  Views   │ Direct.  │  Rating  │ Reviews  │ Conversion       │
│  +12% ▲  │  +5% ▲   │  +0.1 ▲  │  12 new  │  +2.1% ▲         │
├──────────┴──────────┴──────────┴──────────┴──────────────────┤
│  📊 Performance (30d)                            [Export]    │
│  ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇█▇▆▅▄▃▂▁                       │
│                                                               │
│  📝 Recent Reviews                          [Reply All →]    │
│  ★★★★★ "Best nasi lemak in KL!" — Sarah    2h ago           │
│  ★★★★☆ "Great sambal, long queue" — Raj    1d ago           │
│                                                               │
│  💡 AI Insight                                               │
│  ✨ Photos with food get 3× more clicks. You have 6 photos  │
│     — adding 4 more could increase direction requests 45%.  │
│                                                               │
│  ⚡ Quick Actions                                            │
│  [+ Promotion] [📷 Add Photos] [✎ Update Hours] [💬 Reply]  │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Dashboard Metrics (24 endpoints)

```typescript
interface DashboardMetrics {
  period: '7d' | '30d' | '90d' | '1y';
  views:          { value: number; change: number; trend: 'up' | 'down' | 'flat' };
  directionRequests: { value: number; change: number };
  calls:          { value: number; change: number };
  websiteClicks:  { value: number; change: number };
  favorites:      { value: number; change: number };
  reviews:        { value: number; change: number };
  averageRating:  { value: number; change: number };
  conversionRate: { value: number; change: number };
  topSearchTerms: string[];
  peakHours:      { day: string; hour: number; views: number }[];
  trafficSources: Record<string, number>; // { nearbySearch: 45, keywordSearch: 28, ... }
  demographics:   { localVsTourist: { local: number; tourist: number }; topOrigins: string[] };
  aiInsight:      { title: string; description: string; action: { label: string; url: string } };
}
```

---

## Section 3: Restaurant Management

### 3.1 Menu Management

```sql
CREATE TABLE menus (
    id          UUID PK DEFAULT gen_random_uuid_v7(),
    place_id    UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    name        VARCHAR(200) DEFAULT 'Main Menu',
    is_active   BOOLEAN DEFAULT TRUE,
    version     INTEGER DEFAULT 1,
    language    VARCHAR(10) DEFAULT 'en',
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE (place_id, name, version)
);

CREATE TABLE menu_sections (
    id          UUID PK DEFAULT gen_random_uuid_v7(),
    menu_id     UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    name        VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    sort_order  INTEGER DEFAULT 0
);

CREATE TABLE menu_items (
    id              UUID PK DEFAULT gen_random_uuid_v7(),
    section_id      UUID NOT NULL REFERENCES menu_sections(id) ON DELETE CASCADE,
    name            VARCHAR(300) NOT NULL,
    description     VARCHAR(1000),
    price           NUMERIC(10,2) NOT NULL,
    currency        VARCHAR(3) DEFAULT 'MYR',
    photos          JSONB,
    dietary_labels  JSONB,        -- ["halal","vegetarian","gluten-free"]
    spice_level     INTEGER CHECK (spice_level BETWEEN 0 AND 5),
    is_available    BOOLEAN DEFAULT TRUE,
    is_featured     BOOLEAN DEFAULT FALSE,
    is_bestseller   BOOLEAN DEFAULT FALSE,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);
```

### 3.2 Restaurant APIs

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
| `PATCH` | `/business/restaurant/:placeId/hours` | Update hours |
| `PATCH` | `/business/restaurant/:placeId/gallery` | Manage photos |
| `GET` | `/business/restaurant/:placeId/qr-menu` | Generate QR code |

---

## Section 4-5: Hotel & Attraction Management

### 4.1 Hotel Database

```sql
CREATE TABLE hotel_profiles (
    id              UUID PK DEFAULT gen_random_uuid_v7(),
    place_id        UUID NOT NULL UNIQUE REFERENCES places(id),
    star_rating     INTEGER CHECK (star_rating BETWEEN 1 AND 5),
    room_count      INTEGER,
    check_in_time   TIME DEFAULT '15:00',
    check_out_time  TIME DEFAULT '12:00',
    amenities       JSONB,
    booking_url     VARCHAR(2048),
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE room_types (
    id              UUID PK DEFAULT gen_random_uuid_v7(),
    hotel_id        UUID NOT NULL REFERENCES hotel_profiles(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    base_price      NUMERIC(10,2) NOT NULL,
    max_occupancy   INTEGER DEFAULT 2,
    bed_config      VARCHAR(100),
    amenities       JSONB,
    photos          JSONB,
    inventory_count INTEGER DEFAULT 1,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE room_inventory (
    id              UUID PK DEFAULT gen_random_uuid_v7(),
    room_type_id    UUID NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
    date            DATE NOT NULL,
    total_rooms     INTEGER NOT NULL,
    booked_rooms    INTEGER DEFAULT 0,
    price_override  NUMERIC(10,2),
    UNIQUE (room_type_id, date)
);
```

### 5.1 Attraction Database

```sql
CREATE TABLE attraction_profiles (
    id                  UUID PK DEFAULT gen_random_uuid_v7(),
    place_id            UUID NOT NULL UNIQUE REFERENCES places(id),
    attraction_type     VARCHAR(50),
    typical_duration_min INTEGER,
    age_restriction     VARCHAR(200),
    dress_code          VARCHAR(300),
    accessibility_info  TEXT,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ticket_tiers (
    id              UUID PK DEFAULT gen_random_uuid_v7(),
    attraction_id   UUID NOT NULL REFERENCES attraction_profiles(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    price           NUMERIC(10,2) NOT NULL,
    currency        VARCHAR(3) DEFAULT 'MYR',
    max_per_day     INTEGER,
    requires_time_slot BOOLEAN DEFAULT FALSE,
    is_active       BOOLEAN DEFAULT TRUE,
    sort_order      INTEGER DEFAULT 0
);

CREATE TABLE pricing_rules (
    id              UUID PK DEFAULT gen_random_uuid_v7(),
    ticket_id       UUID NOT NULL REFERENCES ticket_tiers(id) ON DELETE CASCADE,
    rule_type       VARCHAR(50) NOT NULL,
    condition       JSONB NOT NULL,
    price_modifier  NUMERIC(5,2) NOT NULL,
    priority        INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE
);
```

---

## Section 6-7: Campaign Manager & Coupon Engine

### 6.1 Promotion Types

| Type | Example | Discount |
|------|---------|----------|
| `percentage_discount` | "20% off all meals" | % of total |
| `fixed_discount` | "RM 5 off your bill" | Fixed RM |
| `bogo` | "Buy 1 main, get 1 free" | 1 free item |
| `happy_hour` | "50% off 2-5 PM weekdays" | Time-based % |
| `combo_deal` | "Nasi lemak + teh tarik = RM 10" | Package price |
| `seasonal` | "Ramadan buffet special" | Event-based |

### 6.2 Promotion Database

```sql
CREATE TABLE promotions (
    id                  UUID PK DEFAULT gen_random_uuid_v7(),
    business_id         UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    place_id            UUID REFERENCES places(id),
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
    total_limit         INTEGER,
    per_user_limit      INTEGER DEFAULT 1,
    delivery_channels   JSONB,      -- ["place_detail","nearby_search","push","email"]
    target_audience     JSONB,
    views               INTEGER DEFAULT 0,
    clicks              INTEGER DEFAULT 0,
    redemptions         INTEGER DEFAULT 0,
    revenue_generated   NUMERIC(12,2) DEFAULT 0,
    discount_given      NUMERIC(12,2) DEFAULT 0,
    terms               TEXT,
    banner_image        VARCHAR(2048),
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now(),
    CHECK (end_date > start_date)
);
CREATE INDEX idx_promos_active ON promotions(is_active, start_date, end_date);

CREATE TABLE coupons (
    id              UUID PK DEFAULT gen_random_uuid_v7(),
    promotion_id    UUID REFERENCES promotions(id) ON DELETE SET NULL,
    business_id     UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
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
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE coupon_redemptions (
    id              UUID PK DEFAULT gen_random_uuid_v7(),
    coupon_id       UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    place_id        UUID REFERENCES places(id),
    discount_applied NUMERIC(10,2),
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (coupon_id, user_id)
);
```

---

## Section 8: Loyalty Engine

### 8.1 Tier System

```
DIAMOND  10,000+ pts/yr  5% cashback, free cancellation, priority support
PLATINUM  5,000+ pts/yr  3% cashback, 1 free cancel/mo, priority support
GOLD      2,000+ pts/yr  2% cashback, birthday bonus, early sale access
SILVER      500+ pts/yr  1% cashback, birthday bonus
EXPLORER         0 pts   Base — earn 1 pt per RM 1 spent
```

### 8.2 Points Earning Rules

| Action | Points |
|--------|--------|
| Hotel booking (per RM 1) | 10 pts |
| Attraction ticket (per RM 1) | 5 pts |
| Event ticket (per RM 1) | 5 pts |
| Review written (approved) | 50 pts |
| Photo uploaded (approved) | 20 pts |
| Referral (friend signs up) | 200 pts |
| Referral (friend books) | 500 pts |
| Daily streak bonus | 5–25 pts |

### 8.3 Loyalty Database

```sql
CREATE TABLE loyalty_programs (
    id              UUID PK DEFAULT gen_random_uuid_v7(),
    business_id     UUID NOT NULL UNIQUE REFERENCES business_accounts(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    points_per_myr  REAL DEFAULT 1.0,
    tier_config     JSONB,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE loyalty_members (
    id              UUID PK DEFAULT gen_random_uuid_v7(),
    program_id      UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points_balance  INTEGER DEFAULT 0,
    lifetime_points INTEGER DEFAULT 0,
    tier            VARCHAR(20) DEFAULT 'silver',
    visit_count     INTEGER DEFAULT 0,
    last_visit_at   TIMESTAMPTZ,
    joined_at       TIMESTAMPTZ DEFAULT now(),
    UNIQUE (program_id, user_id)
);

CREATE TABLE loyalty_transactions (
    id          UUID PK DEFAULT gen_random_uuid_v7(),
    member_id   UUID NOT NULL REFERENCES loyalty_members(id) ON DELETE CASCADE,
    type        VARCHAR(20) NOT NULL, -- earn, redeem, bonus, expire, adjust
    points      INTEGER NOT NULL,
    description VARCHAR(500),
    reference   VARCHAR(200),
    created_at  TIMESTAMPTZ DEFAULT now()
);
```

---

## Section 9-10: CRM & Analytics

### 9.1 Customer Segmentation

```typescript
const SEGMENTS = {
  HIGH_VALUE:    'visited >5 times AND avg_spend > RM 50' ,
  AT_RISK:       'last_visit > 90 days ago AND previously visited >3 times',
  NEW:           'first_visit < 30 days ago',
  LOYAL:         'loyalty_tier IN (Gold, Platinum, Diamond)',
  WEEKEND_ONLY:  '80%+ visits on Sat-Sun',
  LUNCH_REGULAR: '60%+ visits between 11AM-2PM on weekdays',
};
```

### 9.2 Analytics Database

```sql
CREATE TABLE analytics.business_daily_metrics (
    id                  UUID PK DEFAULT gen_random_uuid_v7(),
    business_id         UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    place_id            UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    date                DATE NOT NULL,
    views               INTEGER DEFAULT 0,
    direction_requests  INTEGER DEFAULT 0,
    call_clicks         INTEGER DEFAULT 0,
    website_clicks      INTEGER DEFAULT 0,
    favorites_added     INTEGER DEFAULT 0,
    reviews_written     INTEGER DEFAULT 0,
    search_appearances  INTEGER DEFAULT 0,
    search_clicks       INTEGER DEFAULT 0,
    promotion_views     INTEGER DEFAULT 0,
    promotion_clicks    INTEGER DEFAULT 0,
    promotion_redemptions INTEGER DEFAULT 0,
    ad_impressions      INTEGER DEFAULT 0,
    ad_clicks           INTEGER DEFAULT 0,
    revenue_estimated   NUMERIC(12,2),
    UNIQUE (place_id, date)
);
```

---

## Section 11: Advertising Platform

### 11.1 Ad Types & Pricing

| Ad Type | Placement | Model | Price Range |
|---------|-----------|-------|-------------|
| **Search Promoted** | Top of search results | CPC | RM 0.50–3.00/click |
| **Category Featured** | Top of category browse | CPM | RM 10–30/1000 views |
| **Nearby Boost** | Higher rank in nearby | CPC | RM 0.30–2.00/click |
| **Home Banner** | Hero banner on explore | Flat/day | RM 50–500/day |
| **Trip Planner Insertion** | Suggested in AI itinerary | CPA | RM 5–20/booking |

### 11.2 Ad Campaign Database

```sql
CREATE TABLE advertising_campaigns (
    id              UUID PK DEFAULT gen_random_uuid_v7(),
    business_id     UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    ad_type         VARCHAR(50) NOT NULL,
    status          VARCHAR(20) DEFAULT 'draft',
    headline        VARCHAR(200),
    description     VARCHAR(500),
    image_url       VARCHAR(2048),
    target_url      VARCHAR(2048),
    bid_type        VARCHAR(20) DEFAULT 'cpc',
    bid_amount      NUMERIC(10,4),
    daily_budget    NUMERIC(10,2),
    total_budget    NUMERIC(10,2),
    spent_amount    NUMERIC(10,2) DEFAULT 0,
    impressions     INTEGER DEFAULT 0,
    clicks          INTEGER DEFAULT 0,
    ctr             REAL GENERATED ALWAYS AS (
        CASE WHEN impressions > 0 THEN (clicks::REAL/impressions)*100 ELSE 0 END
    ) STORED,
    start_date      TIMESTAMPTZ NOT NULL,
    end_date        TIMESTAMPTZ NOT NULL,
    target_keywords  JSONB,
    target_locations JSONB,
    target_radius_km INTEGER,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE advertising_impressions (
    id              UUID PK DEFAULT gen_random_uuid_v7(),
    campaign_id     UUID NOT NULL REFERENCES advertising_campaigns(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id),
    place_id        UUID REFERENCES places(id),
    source          VARCHAR(100),
    cost            NUMERIC(10,6),
    clicked         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT now()
) PARTITION BY RANGE (created_at);
```

---

## Section 12: Business Verification

### 12.1 Verification Tiers

| Tier | Method | Time | Required For |
|------|--------|------|-------------|
| **Tier 1** | Phone OTP or Email | Instant | Restaurants, Cafes, Street Food |
| **Tier 2** | SSM Registration or Utility Bill | 1-3 days | Hotels, Shopping Malls |
| **Tier 3** | Government License + Photo ID | 3-7 days | Pharmacies, Hospitals, Disputed claims |

### 12.2 Verification Status Machine

```
UNVERIFIED → PENDING (claim submitted)
  ├──→ PHONE_VERIFIED (Tier 1 passed)
  ├──→ DOCUMENT_SUBMITTED (Tier 2/3 docs uploaded)
  │     ├──→ UNDER_REVIEW
  │     │     ├──→ VERIFIED ✅
  │     │     └──→ REJECTED ❌ (with reason + appeal link)
  │     └──→ MORE_INFO_REQUESTED (admin asks for additional docs)
  └──→ AUTO_REJECTED (fraud score > 60)
```

---

## Section 13-14: Merchant Billing & Subscriptions

### 13.1 Pricing Plans

| Plan | Price (RM/mo) | Listings | Promotions | Ads Credit | Analytics | API |
|------|-------------|----------|------------|------------|-----------|-----|
| **Free** | RM 0 | 1 | 0 | 0 | Basic | No |
| **Pro** | RM 99 | 3 | 5 active | RM 50 | Advanced | No |
| **Business** | RM 299 | 10 | 20 active | RM 200 | Full + Export | Yes |
| **Enterprise** | RM 999 | Unlimited | Unlimited | RM 1,000 | Full + Custom | Yes |

### 13.2 Billing Flow

```
1. Merchant selects plan → POST /subscriptions/checkout
2. Stripe Checkout Session created → redirect to Stripe
3. Payment completed → Stripe webhook: checkout.session.completed
4. Activate subscription → update business_accounts.subscription_tier
5. Monthly renewal → Stripe auto-charges → invoice.created webhook
6. Payment failed → dunning: retry 3d, 7d, 14d → cancel if all fail
7. Upgrade: pro-rated credit for unused days → new plan starts immediately
8. Downgrade: current plan active until period end → new plan next cycle
```

### 13.3 Subscription Database

```sql
CREATE TABLE subscriptions (
    id                      UUID PK DEFAULT gen_random_uuid_v7(),
    user_id                 UUID NOT NULL REFERENCES users(id),
    business_id             UUID REFERENCES business_accounts(id),
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
```

---

## Section 15: Revenue Analytics

### 15.1 Revenue Dashboard (Admin)

```typescript
interface RevenueOverview {
  period: string;
  mrr: number;                          // Monthly Recurring Revenue
  arr: number;                          // Annualized Run Rate
  totalRevenue: number;                 // All-time revenue
  revenueBySource: {                    // Breakdown
    subscriptions: number;
    advertising: number;
    bookingCommissions: number;
    other: number;
  };
  subscriptionMetrics: {
    totalSubscribers: number;
    newThisMonth: number;
    churnRate: number;                  // %
    avgRevenuePerUser: number;
    lifetimeValue: number;
  };
  advertisingMetrics: {
    totalAdSpend: number;
    platformRevenue: number;
    avgCPC: number;
    avgCTR: number;
  };
  monthlyTrend: { month: string; revenue: number }[];  // Last 12 months
}
```

---

## Section 16: Review Management

### 16.1 Review Response Tools

```typescript
// Business owner capabilities:
- Reply to any review on claimed places
- Edit reply within 24 hours
- Report fake/suspicious reviews (with evidence)
- AI-suggested reply drafts based on review sentiment
- Response templates for common feedback
- Bulk reply for similar reviews
- Response time tracking (SLA dashboard)
```

### 16.2 Review APIs

| Method | Endpoint | Permission |
|--------|----------|------------|
| `GET` | `/business/reviews?status=&rating=&page=` | business_owner |
| `POST` | `/business/reviews/:id/reply` | business_owner |
| `PATCH` | `/business/reviews/:id/reply/:replyId` | business_owner |
| `DELETE` | `/business/reviews/:id/reply/:replyId` | business_owner |
| `POST` | `/business/reviews/:id/report` | business_owner |
| `POST` | `/business/reviews/:id/ai-suggest` | business_owner |
| `GET` | `/business/reviews/analytics` | business_owner |

---

## Section 17: Customer Segmentation (AI-Powered)

```typescript
interface CustomerSegment {
  name: string;
  size: number;
  avgSpend: number;
  visitFrequency: number;
  preferredDay: string;
  preferredTime: string;
  topCategories: string[];
  retentionRate: number;
}

// Segments auto-computed weekly:
// 1. Loyal Regulars (visited 10+ times, high spend)
// 2. Weekend Warriors (only Sat-Sun visits)
// 3. Lunch Crowd (weekday 11AM-2PM)
// 4. New Explorers (first visit <30d ago)
// 5. At Risk (not visited in 90d, previously regular)
// 6. Tourists (home city ≠ business city)
// 7. High Value (top 10% by spend)
```

---

## Section 18: AI Business Insights

### 18.1 Insight Types

| Insight | Trigger | Example |
|---------|---------|---------|
| **Photo Opportunity** | Photos < 10 and competitor has 20+ | "Add 4 more photos — businesses with 10+ photos get 45% more direction requests" |
| **Response Gap** | Unreplied reviews > 3 | "You have 5 unreplied reviews. Businesses that reply see 16% higher ratings" |
| **Peak Hour Optimization** | New peak detected | "Your Saturday 11AM-1PM traffic is up 25%. Consider staffing up for this window" |
| **Competitor Alert** | Nearby competitor's rating improved | "Restoran XYZ nearby just hit 4.5★. Here's what they're doing differently" |
| **Menu Optimization** | Dish mentioned positively in reviews | "'Rendang' appears in 45% of 5★ reviews. Feature it in your hero photo" |
| **Pricing Insight** | Price level mismatch with area | "Your price level ($$$) is higher than 80% of nearby restaurants. Consider highlighting your premium value" |

---

## Section 19: Merchant APIs

### 19.1 Public API (Business+ Plan)

```
Authentication: API Key (generated in dashboard)
Rate Limit: 1000 req/hour (Business), 5000 req/hour (Enterprise)

PLACES:
  GET    /merchant/v1/places                        List claimed places
  GET    /merchant/v1/places/:id                    Get place details
  PATCH  /merchant/v1/places/:id                    Update place

REVIEWS:
  GET    /merchant/v1/reviews?since=&page=          List reviews
  POST   /merchant/v1/reviews/:id/reply             Reply to review

ANALYTICS:
  GET    /merchant/v1/analytics/overview?period=    Dashboard summary
  GET    /merchant/v1/analytics/daily?start=&end=   Daily metrics

PROMOTIONS:
  GET    /merchant/v1/promotions                    List promotions
  POST   /merchant/v1/promotions                    Create promotion
  PATCH  /merchant/v1/promotions/:id                Update promotion

WEBHOOKS:
  POST   /merchant/v1/webhooks/register             Register webhook URL
  Events: review.created, review.updated, promotion.expired,
          subscription.renewed, subscription.canceled
```

### 19.2 Webhook Security

```
Header: X-ExploreMY-Signature: t=1700000000,v1=HMAC_SHA256(secret, payload)
Verification: recipient computes HMAC, compares to header → reject if mismatch
Retry: 3 attempts (1min, 5min, 15min delays), then disable webhook
```

---

## Section 20: Enterprise Accounts

### 20.1 Enterprise Features

| Feature | Pro | Business | Enterprise |
|---------|-----|----------|------------|
| Listings | 3 | 10 | Unlimited |
| Staff accounts | 1 | 5 | Unlimited + RBAC |
| API access | No | Yes | Yes + higher limits |
| White-label | No | No | Yes |
| Custom analytics | No | No | Yes |
| Dedicated support | No | No | Yes (Slack + phone) |
| SLA | None | 99.5% | 99.9% |
| Multi-location | No | Yes | Yes + hierarchy |
| SSO | No | No | Yes (SAML/OIDC) |

### 20.2 Enterprise RBAC

| Role | Capabilities |
|------|-------------|
| **Owner** | Full access: billing, staff, all locations |
| **Admin** | Manage listings, promotions, analytics, staff |
| **Manager** | Edit listings, reply reviews, view analytics |
| **Staff** | Reply reviews, view basic analytics |
| **Viewer** | Read-only access |
| **Accountant** | Billing, invoices only |

---

## Business Module Summary

| Module | DB Tables | APIs | Permission |
|--------|-----------|------|------------|
| Claiming | 1 | 8 | user + admin |
| Dashboard | 2 | 12 | business_owner |
| Restaurant | 3 | 14 | business_owner |
| Hotel | 3 | 12 | business_owner |
| Attraction | 3 | 10 | business_owner |
| Promotions | 1 | 8 | business_owner |
| Coupons | 2 | 8 | business_owner |
| Loyalty | 3 | 10 | user + biz |
| Advertising | 2 | 10 | business_owner |
| Reviews | 1 | 7 | business_owner |
| Subscriptions | 1 | 9 | user + biz |
| Merchant API | — | 15 | API key |
| **Total** | **22** | **123** | |

---

*End of Business Cloud Ecosystem Blueprint — 20 sections complete.*
