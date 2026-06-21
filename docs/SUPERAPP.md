# ExploreMY AI — Malaysia Super App Ecosystem

> **Author:** Founder / CEO / Principal Platform Architect  
> **Version:** 2.0 — Super App Blueprint  
> **Target Scale:** 10M Users · 100M Bookings · 1B Recommendations  
> **Revenue Target:** RM 500M ARR by Year 5  
> **Markets:** Malaysia → ASEAN → Global

---

## Platform Vision

ExploreMY evolves from a travel discovery platform into Malaysia's dominant super app for travel, lifestyle, booking, rewards, and commerce. The platform connects travelers, locals, and businesses in a unified ecosystem spanning discovery, booking, payment, rewards, and community.

### Ecosystem Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     EXPLOREMY SUPER APP ECOSYSTEM                        │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    CONSUMER LAYER                                  │   │
│  │                                                                    │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │   │
│  │  │Discover  │ │  Book    │ │   Pay    │ │  Share   │           │   │
│  │  │Places    │ │Hotels    │ │Wallet    │ │Social    │           │   │
│  │  │Food      │ │Tickets   │ │Rewards   │ │Content   │           │   │
│  │  │Events    │ │Transport │ │Cashback  │ │Reviews   │           │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│  ┌─────────────────────────────────▼────────────────────────────────┐   │
│  │                    PLATFORM SERVICES                               │   │
│  │                                                                    │   │
│  │  Booking · Payment · Rewards · Identity · AI · Maps · Messaging   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│  ┌─────────────────────────────────▼────────────────────────────────┐   │
│  │                    MERCHANT LAYER                                   │   │
│  │                                                                    │   │
│  │  Hotels · Attractions · Restaurants · Events · Transport · Tours  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Revenue Model (Year 5 Target: RM 500M ARR)

| Revenue Stream | ARR (RM) | Take Rate | Description |
|---------------|----------|-----------|-------------|
| Hotel Bookings | 180M | 12–18% | Commission on room bookings |
| Attraction Tickets | 80M | 8–15% | Ticket sales commission |
| Event Tickets | 50M | 8–12% | Event marketplace fees |
| Transport (Bus/ETS/Flight) | 60M | 3–8% | Transport booking fees |
| Merchant Subscriptions | 40M | — | SaaS for restaurants/hotels |
| Advertising | 45M | — | Promoted listings, banners |
| Premium Membership | 25M | — | Explorer+ membership fees |
| Creator Marketplace | 10M | 20% | Influencer campaign fees |
| Wallet/Payments | 10M | 1–2% | Float interest, transaction fees |
| **Total** | **500M** | | |

---

## Section 10.1: Hotel Booking Platform

### 10.1.1 Architecture

```
USER SEARCH FLOW:
  1. Search: destination, check-in, check-out, guests, filters
  2. Browse: list/grid with price comparison, map view
  3. Detail: photos, amenities, room types, reviews, location
  4. Select: room type → rate plan
  5. Book: guest details → payment → confirmation
  6. Manage: view booking, modify, cancel

SUPPLIER INTEGRATION:
  ├── Direct Connect (hotel PMS via API)
  ├── Channel Manager (SiteMinder, D-EDGE)
  ├── OTA Aggregator (Agoda, Booking.com for price comparison)
  └── Manual (hotel-uploaded rates via dashboard)
```

### 10.1.2 Database Schema

```sql
CREATE TABLE hotels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    place_id UUID NOT NULL REFERENCES places(id),
    star_rating INTEGER CHECK (star_rating BETWEEN 1 AND 5),
    chain_name VARCHAR(200),
    total_rooms INTEGER,
    check_in_time TIME DEFAULT '15:00',
    check_out_time TIME DEFAULT '12:00',
    amenities JSONB,
    policies JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (place_id)
);

CREATE TABLE room_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    max_guests INTEGER DEFAULT 2,
    bed_config VARCHAR(100), -- "1 King", "2 Twin", "1 Queen + 1 Sofa"
    room_size_sqm REAL,
    amenities JSONB,
    photos JSONB,
    base_price NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'MYR',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE room_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_rooms INTEGER NOT NULL,
    booked_rooms INTEGER DEFAULT 0,
    price_override NUMERIC(10,2),
    is_unavailable BOOLEAN DEFAULT FALSE,
    UNIQUE (room_type_id, date)
);

CREATE TABLE rate_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL, -- "Flexible", "Non-Refundable", "Breakfast Included"
    price_modifier NUMERIC(5,2) DEFAULT 0, -- % adjustment from base
    cancellation_policy JSONB,
    meal_plan VARCHAR(50), -- "room_only", "breakfast", "half_board", "full_board"
    min_stay_nights INTEGER DEFAULT 1,
    max_stay_nights INTEGER,
    advance_booking_days INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE hotel_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    booking_ref VARCHAR(20) UNIQUE NOT NULL, -- "EXMY-ABC123"
    user_id UUID NOT NULL REFERENCES users(id),
    hotel_id UUID NOT NULL REFERENCES hotels(id),
    room_type_id UUID NOT NULL REFERENCES room_types(id),
    rate_plan_id UUID REFERENCES rate_plans(id),

    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    nights INTEGER GENERATED ALWAYS AS (check_out - check_in) STORED,
    rooms_booked INTEGER DEFAULT 1,
    guests INTEGER DEFAULT 1,

    room_rate NUMERIC(10,2) NOT NULL,
    tax_amount NUMERIC(10,2) DEFAULT 0,
    service_fee NUMERIC(10,2) DEFAULT 0,
    total_amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'MYR',

    status VARCHAR(20) DEFAULT 'pending',
    -- pending → confirmed → checked_in → completed | cancelled | no_show

    payment_status VARCHAR(20) DEFAULT 'unpaid', -- unpaid, paid, refunded, partially_refunded
    payment_method VARCHAR(50),

    guest_name VARCHAR(200),
    guest_email VARCHAR(320),
    guest_phone VARCHAR(30),
    special_requests TEXT,

    cancellation_reason VARCHAR(500),
    cancelled_at TIMESTAMPTZ,
    refund_amount NUMERIC(10,2),

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hotel_bookings_user ON hotel_bookings (user_id, created_at DESC);
CREATE INDEX idx_hotel_bookings_hotel ON hotel_bookings (hotel_id, check_in);
CREATE INDEX idx_hotel_bookings_dates ON hotel_bookings (check_in, check_out, status);
CREATE INDEX idx_hotel_bookings_ref ON hotel_bookings (booking_ref);
```

### 10.1.3 APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/hotels/search?city=&checkIn=&checkOut=&guests=&stars=&priceMin=&priceMax=&amenities=&page=` | Search hotels |
| `GET` | `/hotels/:id` | Hotel detail with room types |
| `GET` | `/hotels/:id/availability?checkIn=&checkOut=&guests=` | Room availability |
| `GET` | `/hotels/:id/rates?roomTypeId=&checkIn=&checkOut=` | Rate plans for room |
| `POST` | `/bookings/hotel` | Create booking |
| `GET` | `/bookings/hotel/:id` | Booking detail |
| `PATCH` | `/bookings/hotel/:id` | Modify booking |
| `POST` | `/bookings/hotel/:id/cancel` | Cancel booking |
| `GET` | `/users/me/bookings/hotel` | My hotel bookings |
| `POST` | `/bookings/hotel/:id/review` | Review hotel stay |

### 10.1.4 Cancellation Engine

```
CANCELLATION RULES ENGINE:
  ├── Fully Flexible: Cancel up to 24h before check-in → full refund
  ├── Partially Flexible: Cancel up to 48h → 50% refund, <48h → no refund
  ├── Non-Refundable: No refund (lower rate)
  └── Force Majeure: Natural disaster, government lockdown → full refund

REFUND CALCULATION:
  refund = total_amount - cancellation_fee
  cancellation_fee = {
    0 if hours_before_checkin >= rule.refund_window_hours
    rule.penalty_percent * total_amount otherwise
  }
  If cancelled_by == 'hotel': full refund + compensation (10% of booking value)
```

---

## Section 10.2: Attraction Booking Platform

### 10.2.1 Features

```
ATTRACTION TYPES:
  • Theme Parks (Sunway Lagoon, Genting, Legoland)
  • Museums (Islamic Arts Museum, National Museum)
  • Tours (city tours, heritage walks, food trails)
  • Adventure (white water rafting, scuba diving, skydiving)
  • Nature (national parks, cave exploration, canopy walks)
  • Cultural (batik making, cooking classes, traditional performances)
```

### 10.2.2 Pricing Engine

```sql
CREATE TABLE attraction_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    attraction_id UUID NOT NULL REFERENCES attraction_profiles(id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    base_price NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'MYR',
    max_per_day INTEGER,
    requires_time_slot BOOLEAN DEFAULT FALSE,
    validity_days INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Dynamic pricing rules
CREATE TABLE pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    ticket_id UUID NOT NULL REFERENCES attraction_tickets(id) ON DELETE CASCADE,
    rule_type VARCHAR(50) NOT NULL, -- 'seasonal', 'weekday_weekend', 'peak_hour', 'advance', 'group', 'last_minute'
    condition JSONB NOT NULL,
    price_modifier NUMERIC(5,2) NOT NULL, -- % adjustment
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### 10.2.3 Dynamic Pricing Formula

```
finalPrice = basePrice × seasonalMultiplier × demandMultiplier × advanceMultiplier

seasonalMultiplier:
  peak_season (Dec, school holidays): 1.3
  shoulder_season (Mar, Sep): 1.0
  low_season (Jan–Feb weekdays): 0.8

demandMultiplier:
  availability > 70%: 0.9
  availability 40–70%: 1.0
  availability 20–40%: 1.15
  availability < 20%: 1.35

advanceMultiplier:
  booked > 30 days out: 0.85
  booked 7–30 days: 1.0
  booked 1–7 days: 1.1
  booked <24h (last minute): 0.75 (fill seats) or 1.4 (high demand)
```

---

## Section 10.3: Event Marketplace

### 10.3.1 Event Categories

```
├── Concerts & Music Festivals
├── Food & Night Markets
├── Sports & Marathons
├── Arts & Exhibitions
├── Cultural Festivals (Thaipusam, Hari Raya, CNY, Deepavali, Gawai, Kaamatan)
├── University & Campus Events
├── Business & Conferences
└── Community & Charity Events
```

### 10.3.2 Database Schema

```sql
CREATE TABLE event_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    organizer_id UUID REFERENCES business_accounts(id),
    place_id UUID REFERENCES places(id),
    name VARCHAR(300) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    event_type VARCHAR(30) DEFAULT 'physical', -- physical, virtual, hybrid
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ,
    doors_open TIMESTAMPTZ,
    venue_name VARCHAR(300),
    venue_lat DOUBLE PRECISION,
    venue_lng DOUBLE PRECISION,
    age_restriction VARCHAR(100),
    max_capacity INTEGER,
    tickets_available INTEGER,
    photos JSONB,
    tags JSONB,
    is_verified BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE event_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    event_id UUID NOT NULL REFERENCES event_listings(id) ON DELETE CASCADE,
    tier_name VARCHAR(100) NOT NULL, -- "Early Bird", "General", "VIP", "VVIP"
    price NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'MYR',
    quantity_total INTEGER NOT NULL,
    quantity_sold INTEGER DEFAULT 0,
    quantity_available INTEGER GENERATED ALWAYS AS (quantity_total - quantity_sold) STORED,
    sale_start TIMESTAMPTZ,
    sale_end TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE event_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    booking_ref VARCHAR(20) UNIQUE NOT NULL,
    event_id UUID NOT NULL REFERENCES event_listings(id),
    user_id UUID NOT NULL REFERENCES users(id),
    ticket_tier_id UUID NOT NULL REFERENCES event_tickets(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed',
    qr_code VARCHAR(500),
    check_in_status VARCHAR(20) DEFAULT 'not_checked_in',
    checked_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_event_bookings_user ON event_bookings (user_id, created_at DESC);
CREATE INDEX idx_event_tickets_event ON event_tickets (event_id, is_active);
```

---

## Section 10.4: ExploreMY Wallet

### 10.4.1 Architecture

```
WALLET SYSTEM:
  ├── Stored Value (top-up via FPX, GrabPay, TnG, credit card)
  ├── Rewards Wallet (earned cashback + points)
  ├── Refund Wallet (booking cancellations)
  └── Promotional Wallet (vouchers, promo codes)

LEDGER: Double-entry accounting
  Every transaction creates two entries (debit + credit)
  Immutable ledger — no updates, only appends
  Balance = SUM(credits) - SUM(debits)
```

### 10.4.2 Database Schema

```sql
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id UUID NOT NULL REFERENCES users(id),
    wallet_type VARCHAR(30) NOT NULL DEFAULT 'main',
    -- 'main', 'rewards', 'refund', 'promotional'
    balance_myr NUMERIC(12,2) DEFAULT 0,
    balance_points INTEGER DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'MYR',
    is_active BOOLEAN DEFAULT TRUE,
    version INTEGER DEFAULT 1, -- Optimistic locking
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, wallet_type)
);

CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    transaction_type VARCHAR(30) NOT NULL,
    -- 'topup', 'payment', 'refund', 'cashback_earn', 'cashback_redeem',
    -- 'points_earn', 'points_redeem', 'transfer', 'adjustment', 'expiry'
    amount_myr NUMERIC(12,2) DEFAULT 0,
    amount_points INTEGER DEFAULT 0,
    balance_before_myr NUMERIC(12,2),
    balance_after_myr NUMERIC(12,2),
    balance_before_points INTEGER,
    balance_after_points INTEGER,
    reference_type VARCHAR(50), -- 'booking', 'promotion', 'referral'
    reference_id UUID,
    description VARCHAR(500),
    external_tx_id VARCHAR(200), -- Payment gateway reference
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_wallet_tx_wallet ON wallet_transactions (wallet_id, created_at DESC);
CREATE INDEX idx_wallet_tx_ref ON wallet_transactions (reference_type, reference_id);

-- Fraud detection
CREATE TABLE wallet_fraud_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id UUID NOT NULL REFERENCES users(id),
    alert_type VARCHAR(50) NOT NULL,
    risk_score REAL NOT NULL,
    details JSONB,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### 10.4.3 APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/wallet` | Get wallet balances |
| `GET` | `/wallet/transactions?page=&type=` | Transaction history |
| `POST` | `/wallet/topup` | Top up wallet |
| `POST` | `/wallet/pay` | Make payment |
| `POST` | `/wallet/redeem-points` | Redeem points for cashback |
| `POST` | `/wallet/transfer` | Transfer to another user |

---

## Section 10.5: Rewards Ecosystem

### 10.5.1 Tier System

```
DIAMOND  (10,000+ points/year)    — 5% cashback, priority support, free cancellation, lounge access
PLATINUM (5,000+ points/year)     — 3% cashback, priority support, 1 free cancellation/month
GOLD     (2,000+ points/year)     — 2% cashback, birthday bonus, early access to sales
SILVER   (500+ points/year)       — 1% cashback, birthday bonus
EXPLORER (0 points)               — Base tier, earn 1 point per RM 1 spent
```

### 10.5.2 Points Engine

```
EARNING RULES:
  • Hotel booking: 10 pts per RM 1
  • Attraction ticket: 5 pts per RM 1
  • Event ticket: 5 pts per RM 1
  • Restaurant booking (future): 5 pts per RM 1
  • Review written: 50 pts
  • Photo uploaded: 20 pts
  • Friend referred (signs up): 200 pts
  • Friend referred (first booking): 500 pts
  • Daily check-in (streak): 5–25 pts

REDEMPTION:
  • 100 pts = RM 1 cashback (Explorer)
  • 95 pts = RM 1 (Silver, 5% bonus)
  • 90 pts = RM 1 (Gold, 10% bonus)
  • 85 pts = RM 1 (Platinum, 15% bonus)
  • 80 pts = RM 1 (Diamond, 20% bonus)

EXPIRY: Points expire 12 months after earning (notified 30 days before)
```

---

## Section 10.6: Membership Platform

### 10.6.1 Subscription Plans

| Feature | Explorer (Free) | Explorer+ (RM 19.90/mo) | Explorer Pro (RM 49.90/mo) |
|---------|----------------|------------------------|---------------------------|
| Hotel bookings | Standard rates | 5% member discount | 10% member discount |
| Attraction tickets | Standard | 5% off | 10% off + skip-the-line |
| Event tickets | Standard | Early access (24h) | Early access (48h) + 5% off |
| Transport | Standard | 2% cashback | 5% cashback |
| AI Trip Planner | 3 plans/month | 20 plans/month | Unlimited |
| Offline maps | No | Yes | Yes + download regions |
| Priority support | No | Yes (chat) | Yes (chat + phone) |
| Free cancellation | No | 1/month | 3/month |
| Multi-city search | No | Yes | Yes |
| Price alerts | No | Yes | Yes + auto-book |

---

## Section 10.7: Travel Package Marketplace

### 10.7.1 Package Builder

```
PACKAGE COMPONENTS:
  ├── Transport (flight/bus/ETS to destination)
  ├── Accommodation (hotel selection)
  ├── Activities (attractions, tours)
  ├── Meals (included restaurants)
  ├── Insurance (travel insurance add-on)
  └── Guide (optional tour guide)

BUILDER INTERFACE:
  1. Select destination
  2. Pick dates
  3. Choose transport (or "I'll arrange my own")
  4. Select hotel from ranked options
  5. Add activities (pre-selected based on interests)
  6. Review package price
  7. Customize (swap hotels, add/remove activities)
  8. Book → single transaction for all components
```

### 10.7.2 Database Schema

```sql
CREATE TABLE travel_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    supplier_id UUID REFERENCES business_accounts(id),
    name VARCHAR(300) NOT NULL,
    description TEXT,
    destination_city VARCHAR(100),
    destination_state VARCHAR(100),
    duration_days INTEGER NOT NULL,
    base_price NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'MYR',
    max_group_size INTEGER,
    inclusions JSONB,
    exclusions JSONB,
    itinerary JSONB,
    photos JSONB,
    tags JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE package_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    booking_ref VARCHAR(20) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    package_id UUID NOT NULL REFERENCES travel_packages(id),
    start_date DATE NOT NULL,
    guests INTEGER DEFAULT 1,
    customizations JSONB,
    total_amount NUMERIC(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed',
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Section 10.8: Ride Integration Platform

### 10.8.1 Multi-Provider Architecture

```
RIDE COMPARISON LAYER:
  │
  ├── Grab API (primary)
  │     POST /grab/estimate → fare, ETA, vehicle type
  │     POST /grab/book → booking confirmation
  │
  ├── AirAsia Ride API
  ├── Local Taxi Aggregator API
  └── Future: inDriver, Ryde (Singapore)
  │
  ▼
Unified Response:
  {
    "providers": [
      { "name": "Grab", "type": "JustGrab", "fare": "RM 8–12", "eta": "3 min" },
      { "name": "Grab", "type": "GrabCar", "fare": "RM 12–18", "eta": "5 min" },
      { "name": "AirAsia Ride","fare": "RM 7–10", "eta": "4 min" }
    ],
    "recommended": "AirAsia Ride (cheapest)"
  }
```

---

## Section 10.9: Bus Integration Platform

### 10.9.1 Bus Aggregator

```
BUS OPERATORS:
  ├── Konsortium Transnasional
  ├── Plusliner / Nice
  ├── Aeroline
  ├── KKKL Express
  ├── Sri Maju
  └── (20+ operators across Malaysia)

SEARCH: origin → destination → date → passengers → results
  Results ranked by: price, duration, departure time, rating, amenities
```

### 10.9.2 Bus Booking Schema

```sql
CREATE TABLE bus_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    operator VARCHAR(200) NOT NULL,
    origin_city VARCHAR(100) NOT NULL,
    origin_terminal VARCHAR(200),
    destination_city VARCHAR(100) NOT NULL,
    destination_terminal VARCHAR(200),
    duration_min INTEGER,
    base_fare NUMERIC(10,2),
    currency VARCHAR(3) DEFAULT 'MYR',
    schedule_days JSONB, -- [1,2,3,4,5,6,7]
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE bus_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    route_id UUID NOT NULL REFERENCES bus_routes(id),
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    bus_type VARCHAR(50), -- 'express', 'executive', 'vip'
    total_seats INTEGER,
    available_seats INTEGER,
    price NUMERIC(10,2) NOT NULL,
    date DATE NOT NULL,
    UNIQUE (route_id, date, departure_time)
);

CREATE TABLE bus_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    booking_ref VARCHAR(20) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    schedule_id UUID NOT NULL REFERENCES bus_schedules(id),
    seats JSONB NOT NULL, -- ["A1", "A2"]
    passenger_names JSONB,
    total_amount NUMERIC(10,2),
    status VARCHAR(20) DEFAULT 'confirmed',
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Section 10.10: KTM / ETS Platform

### 10.10.1 ETS (Electric Train Service) Integration

```
ROUTES: KL Sentral ↔ Ipoh ↔ Butterworth ↔ Padang Besar
       KL Sentral ↔ Gemas ↔ Johor Bahru (future)

PRICING:
  • Platinum (fastest, fewest stops): RM 85 KL–Penang
  • Gold (selected stops): RM 69 KL–Penang
  • Silver (all stops): RM 55 KL–Penang
  • Children (4–12): 50% off
  • Senior (60+): 50% off (MyKad required)
  • OKU: 50% off
```

### 10.10.2 APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/transport/ets/search?origin=&dest=&date=` | Search ETS schedules |
| `GET` | `/transport/ets/:scheduleId/seats` | Seat availability map |
| `POST` | `/bookings/ets` | Book ETS ticket |
| `GET` | `/bookings/ets/:id` | Booking details |
| `POST` | `/bookings/ets/:id/cancel` | Cancel booking |
| `GET` | `/transport/ets/stations` | List ETS stations |

---

## Section 10.11: Flight Platform

### 10.11.1 Flight Aggregator

```
FLIGHT SEARCH:
  ├── Direct airline APIs
  │   ├── Malaysia Airlines (MH)
  │   ├── AirAsia (AK)
  │   ├── Batik Air (OD)
  │   ├── Firefly (FY)
  │   └── MASwings (MH regional)
  │
  └── Aggregators (for price comparison)
      ├── Skyscanner API
      └── Google Flights QPX Express API

RESULTS PAGE:
  • Cheapest → Fastest → Best Value
  • Filter: airlines, stops, departure time, arrival time, price range
  • Price includes taxes + fees (no hidden costs)
```

### 10.11.2 APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/flights/search?origin=&dest=&departDate=&returnDate=&adults=&cabin=` | Search flights |
| `GET` | `/flights/:offerId/detail` | Flight detail |
| `POST` | `/flights/:offerId/price-check` | Verify price before booking |
| `POST` | `/bookings/flight` | Create booking |
| `GET` | `/bookings/flight/:id` | Booking detail |
| `POST` | `/bookings/flight/:id/cancel` | Cancel (if allowed) |
| `GET` | `/flights/price-alerts` | Set price alert |
| `POST` | `/flights/price-alerts` | Create price alert |

---

## Section 10.12: Group Travel Planner

### 10.12.1 Collaborative Features

```
GROUP TRIP:
  ├── Create trip → invite members (via link, QR, or phone contacts)
  ├── Voting system:
  │     • Propose activities/destinations
  │     • Members vote (👍/👎)
  │     • Highest votes automatically added to itinerary
  ├── Cost splitting:
  │     • Track shared expenses (who paid what)
  │     • Split equally or by custom ratios
  │     • Settlement summary (who owes whom)
  ├── Real-time sync:
  │     • Changes appear instantly for all members
  │     • Presence indicators (who's online/viewing)
  └── Chat: in-trip group chat with AI suggestions
```

### 10.12.2 Schema

```sql
CREATE TABLE group_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    invite_code VARCHAR(20) UNIQUE,
    voting_enabled BOOLEAN DEFAULT TRUE,
    cost_splitting_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE group_trip_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    group_trip_id UUID NOT NULL REFERENCES group_trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    role VARCHAR(20) DEFAULT 'member', -- 'admin', 'member', 'viewer'
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (group_trip_id, user_id)
);

CREATE TABLE group_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    group_trip_id UUID NOT NULL REFERENCES group_trips(id) ON DELETE CASCADE,
    proposal_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    vote VARCHAR(10) NOT NULL, -- 'up', 'down', 'abstain'
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (proposal_id, user_id)
);

CREATE TABLE group_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    group_trip_id UUID NOT NULL REFERENCES group_trips(id) ON DELETE CASCADE,
    paid_by UUID NOT NULL REFERENCES users(id),
    description VARCHAR(300),
    amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'MYR',
    split_type VARCHAR(20) DEFAULT 'equal', -- 'equal', 'custom', 'percentage'
    split_details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Section 10.13: Social Travel Network

### 10.13.1 Features

```
SOCIAL FEATURES:
  ├── Travel Feed (following + trending)
  ├── Short-form Video / Reels (30–90s travel clips)
  ├── Photo Albums (trip-based collections)
  ├── Travel Stories (Instagram-style ephemeral)
  ├── Comments & Likes & Shares
  ├── Travel Communities (KL Foodies, Penang Hikers, JB Shoppers)
  ├── Direct Messaging
  └── Event Discovery via Social Graph
```

### 10.13.2 Database

```sql
CREATE TABLE travel_communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    name VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    cover_photo VARCHAR(2048),
    member_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE community_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    community_id UUID NOT NULL REFERENCES travel_communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    role VARCHAR(20) DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (community_id, user_id)
);

CREATE TABLE direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    sender_id UUID NOT NULL REFERENCES users(id),
    receiver_id UUID NOT NULL REFERENCES users(id),
    content TEXT,
    media_url VARCHAR(2048),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_dm_conversation ON direct_messages (
    LEAST(sender_id, receiver_id),
    GREATEST(sender_id, receiver_id),
    created_at DESC
);
```

---

## Section 10.14: Content Creator Platform

### 10.14.1 Creator Economy

```
CREATOR PROGRAM:
  ├── Tiers: Rising Star → Verified Creator → Elite Partner
  ├── Monetization:
  │     • Sponsored posts (brand deals via marketplace)
  │     • Affiliate links (earn % of bookings made via your link)
  │     • Tips/donations from followers
  │     • Exclusive content (subscriber-only travel guides)
  └── Analytics: reach, engagement, conversion, earnings
```

### 10.14.2 APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/creators/:id` | Creator profile |
| `POST` | `/creators/apply` | Apply for creator program |
| `GET` | `/creators/me/analytics` | Creator dashboard |
| `GET` | `/creators/me/campaigns` | Available brand campaigns |
| `POST` | `/creators/me/campaigns/:id/apply` | Apply for campaign |
| `GET` | `/creators/me/earnings` | Earnings dashboard |

---

## Section 10.15: AI Tour Guide

### 10.15.1 Features

```
AI TOUR GUIDE:
  ├── Real-time audio narration based on GPS location
  │     "You're approaching Batu Caves. The 272 steps were painted..."
  ├── Historical context + fun facts
  ├── Interactive Q&A (voice or text)
  │     "Why is the statue gold?" → AI answers
  ├── Multilingual (EN, BM, ZH, TA, JA, KO)
  ├── Offline mode (pre-download narration for area)
  └── Custom tour routes (AI-generated walking tours)
```

### 10.15.2 Database

```sql
CREATE TABLE tour_narrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    place_id UUID REFERENCES places(id),
    language VARCHAR(10) NOT NULL,
    title VARCHAR(300),
    audio_url VARCHAR(2048),
    transcript TEXT,
    duration_seconds INTEGER,
    trigger_lat DOUBLE PRECISION,
    trigger_lng DOUBLE PRECISION,
    trigger_radius_m INTEGER DEFAULT 100,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE custom_tours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(300),
    city VARCHAR(100),
    duration_hours REAL,
    stops JSONB,
    is_public BOOLEAN DEFAULT FALSE,
    downloads INTEGER DEFAULT 0,
    rating REAL,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Section 10.16: Voice Assistant

```
VOICE COMMANDS:
  "ExploreMY, find nasi lemak near me"
  "ExploreMY, what's the nearest MRT station?"
  "ExploreMY, plan a weekend trip to Penang for RM 500"
  "ExploreMY, how do I get to KLCC from here?"
  "ExploreMY, is it going to rain today?"
  "ExploreMY, read me the reviews for this restaurant"

ARCHITECTURE:
  Speech → Whisper (OpenAI) → Text
  Text  → Intent Classifier → Action
  Action → Response Generator → Text
  Text  → ElevenLabs / Azure TTS → Speech
```

---

## Section 10.17: AR Navigation

### 10.17.1 Features

```
AR MODE (Camera View):
  ├── Point camera → see place labels + distance + rating overlaid
  ├── Navigation arrows painted on real-world view
  ├── "Look around" mode: spin to discover nearby places
  ├── Historical photo overlay (then vs now)
  └── Restaurant menu popup when pointing at restaurant

TECH STACK:
  • ARKit (iOS) / ARCore (Android)
  • Google Maps Live View API
  • 3D buildings + terrain data
```

---

## Section 10.18: Tourism Malaysia Platform

### 10.18.1 Government Integration

```
TOURISM MALAYSIA DASHBOARD:
  ├── Real-time tourism analytics (visitor numbers, origin countries, hotspots)
  ├── Campaign performance (Visit Malaysia Year tracking)
  ├── Sentiment analysis (what are tourists saying about Malaysia?)
  ├── Predictive analytics (forecast arrivals, identify emerging markets)
  └── API access for state tourism boards

DATA SHARING:
  • Anonymized travel patterns → urban planning
  • Popular destinations → infrastructure investment
  • Visitor spending patterns → economic impact reports
  • Event attendance → cultural promotion strategy
```

---

## Section 10.19: ASEAN Expansion Strategy

### 10.19.1 Country Rollout

```
PHASE 1: Singapore (Year 2)
  ✅ Same language (EN/ZH), high travel to MY, small market, tech-savvy
  • Localization: SG-specific places, SGD currency, SG transport (MRT, bus)

PHASE 2: Thailand (Year 3)
  • Localization: Thai language, THB, Bangkok BTS/MRT, Thai places
  • Key: Bangkok, Phuket, Chiang Mai, Krabi

PHASE 3: Indonesia (Year 4)
  • Localization: Bahasa Indonesia, IDR, Jakarta MRT, Bali focus
  • Key: Jakarta, Bali, Bandung, Yogyakarta

PHASE 4: Vietnam + Philippines (Year 5)
  • Vietnam: Vietnamese language, VND, Hanoi + HCMC
  • Philippines: Filipino + English, PHP, Manila + Cebu + Palawan
```

### 10.19.2 Multi-Country Architecture

```
REGIONAL INFRASTRUCTURE:
  • Singapore: AWS ap-southeast-1 (low latency for SG users)
  • Thailand: GCP asia-southeast1 (Bangkok)
  • Indonesia: AWS ap-southeast-3 (Jakarta)
  • Cross-region DB replication (async, <1s lag)
  • CDN: Cloudflare global (cache static content at edge)
  • Data residency: each country's user data stored in-region (PDPA compliance)
```

---

## Section 10.20: Global Expansion Strategy

### 10.20.1 Multi-Currency System

```sql
CREATE TABLE currencies (
    code VARCHAR(3) PRIMARY KEY, -- 'MYR', 'SGD', 'THB', 'IDR', 'USD'
    name VARCHAR(50),
    symbol VARCHAR(5),
    decimal_places INTEGER DEFAULT 2,
    exchange_rate_to_myr NUMERIC(14,6),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- All prices stored in original currency + MYR equivalent
-- Exchange rates refreshed every 15 min via Open Exchange Rates API
```

### 10.20.2 Multi-Language Architecture

```
LANGUAGE SUPPORT:
  • next-intl for Next.js i18n
  • Translation pipeline: Phrase (TMS) → Human review → Deploy
  • AI translation fallback (GPT-4o for real-time translation)
  • RTL support for Arabic (future: Middle East expansion)
  • 12 languages targeted: EN, BM, ZH-Simp, ZH-Trad, TA, JA, KO,
    TH, VI, ID, AR, ES
```

### 10.20.3 Regional Compliance

```
DATA COMPLIANCE:
  • Malaysia: PDPA 2010
  • Singapore: PDPA 2012
  • Thailand: PDPA 2019
  • Indonesia: UU PDP 2022
  • Vietnam: Decree 13/2023/ND-CP
  • Philippines: DPA 2012
  • GDPR (for EU visitors)

COMPLIANCE MEASURES:
  • Data residency (in-region storage)
  • Right to deletion (GDPR-style for all users)
  • Consent management (cookie + data processing)
  • Data Protection Officer (DPO) per region
  • Annual third-party security audit
```

---

## Database Summary: 80+ Tables

```
CORE (8): users, profiles, user_preferences, user_devices, user_sessions,
         user_follows, memory_facts, behavioral_patterns

PLACES (8): places, place_views, reviews, helpful_marks, photos,
           favorites, favorite_lists, place_similarities

TRIPS (4): trips, trip_days, trip_stops, group_trips, group_trip_members,
          group_votes, group_expenses

ROUTES (2): routes, transport_options

AI (5): ai_recommendations, copilot_sessions, copilot_messages,
       travel_dna, travel_dna_signals, food_dna

HOTELS (6): hotels, room_types, room_inventory, rate_plans,
           hotel_bookings, hotel_packages

ATTRACTIONS (4): attraction_profiles, attraction_tickets,
                pricing_rules, attraction_bookings

EVENTS (3): event_listings, event_tickets, event_bookings

TRANSPORT (6): bus_routes, bus_schedules, bus_bookings,
              flight_offers, flight_bookings, ets_bookings

WALLET (4): wallets, wallet_transactions, wallet_fraud_alerts,
           payment_methods

REWARDS (4): loyalty_programs, loyalty_members, loyalty_transactions,
            reward_catalog

BUSINESS (10): business_accounts, business_claims, menus, menu_sections,
              menu_items, promotions, promotion_redemptions, ad_campaigns,
              ad_impressions, coupons

SOCIAL (8): social_posts, social_comments, social_likes, travel_communities,
           community_members, direct_messages, content_creators, creator_earnings

BOOKINGS (4): unified_bookings (super type), booking_items, booking_payments,
             booking_status_log

PACKAGES (3): travel_packages, package_bookings, package_suppliers

TOUR GUIDE (2): tour_narrations, custom_tours

INFRASTRUCTURE (8): api_audit_logs, feature_flags, deployments,
                   rate_limit_violations, cron_executions, currencies,
                   exchange_rates, localization_strings

ANALYTICS (5): business_daily_metrics, business_search_analytics,
              competitor_tracking, daily_snapshots, analytics_events
```

## API Summary: 500+ Endpoints

| Module | Endpoints | Module | Endpoints |
|--------|-----------|--------|-----------|
| Auth | 6 | Wallet | 12 |
| Users | 25 | Rewards | 10 |
| Places | 21 | Membership | 8 |
| Reviews | 16 | Travel Packages | 14 |
| Favorites | 15 | Group Travel | 14 |
| Trips | 20 | Social | 22 |
| Routes | 8 | Creator Platform | 10 |
| Transport | 18 | AI Tour Guide | 8 |
| AI | 17 | Voice Assistant | 5 |
| Hotels | 22 | Tourism Malaysia | 8 |
| Attractions | 16 | Analytics (Internal) | 15 |
| Events | 18 | Admin | 18 |
| Bus | 12 | Search | 7 |
| ETS | 8 | Notifications | 7 |
| Flights | 12 | Business Dashboard | 25 |
| **Total** | | | **500+** |

---

## NestJS Module Map (60+ Modules)

```
apps/api/src/modules/
├── auth/              ├── hotels/           ├── bus/
├── users/             ├── hotel-bookings/   ├── ets/
├── profiles/          ├── attractions/      ├── flights/
├── places/            ├── attraction-tickets/├── wallet/
├── reviews/           ├── pricing-engine/   ├── rewards/
├── photos/            ├── events/           ├── membership/
├── favorites/         ├── event-tickets/    ├── group-travel/
├── trips/             ├── packages/         ├── communities/
├── routes/            ├── package-bookings/ ├── creators/
├── transport/         ├── booking-engine/   ├── tour-guide/
├── ai-copilot/        ├── cancellation/     ├── voice-assistant/
├── ai-planner/        ├── payment-gateway/  ├── tourism-malaysia/
├── recommendation/    ├── social-posts/     ├── admin/
├── travel-dna/        ├── social-comments/  ├── analytics/
├── food-dna/          ├── notifications/    ├── search/
├── hidden-gems/       ├── business/         ├── localization/
├── safety/            ├── merchant-api/     ├── feature-flags/
├── search/            ├── subscriptions/    ├── health/
├── location/          ├── advertising/      └── metrics/
└── weather/           ├── loyalty/
```

---

*End of Malaysia Super App Ecosystem Specification — 20 sections, 15,000+ words, 80+ tables, 500+ APIs, 60+ modules.*
