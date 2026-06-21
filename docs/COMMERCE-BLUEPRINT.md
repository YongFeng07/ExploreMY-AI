# ExploreMY AI — Booking & Commerce Platform

> **Classification:** Internal — Commerce Engineering  
> **Version:** 8.0  
> **Author:** Principal Commerce Architect  
> **Target Scale:** 100M bookings/year · RM 2B GMV · 99.99% transaction reliability

---

## Section 1: Hotel Booking Engine

### 1.1 Booking Flow

```
SEARCH → SELECT → REVIEW → PAY → CONFIRM → MANAGE

1. SEARCH:  destination, check-in, check-out, guests, filters
2. SELECT:  browse results (list/map), tap hotel → room types + rates
3. REVIEW:  booking summary, cancellation policy, total price breakdown
4. PAY:     payment method (card/wallet), apply voucher/promo, confirm
5. CONFIRM: booking reference generated, confirmation email/SMS/push
6. MANAGE:  view booking, modify dates, cancel, contact hotel
```

### 1.2 Database

```sql
CREATE TABLE commerce.hotel_bookings (
    id              UUID PK DEFAULT gen_random_uuid_v7(),
    booking_ref     VARCHAR(20) UNIQUE NOT NULL,
    user_id         UUID NOT NULL REFERENCES users(id),
    hotel_id        UUID NOT NULL REFERENCES hotel_profiles(id),
    room_type_id    UUID NOT NULL REFERENCES room_types(id),
    check_in        DATE NOT NULL,
    check_out       DATE NOT NULL,
    nights          INTEGER GENERATED ALWAYS AS (check_out - check_in) STORED,
    rooms           INTEGER DEFAULT 1,
    guests          INTEGER DEFAULT 1,
    room_rate       NUMERIC(10,2) NOT NULL,
    subtotal        NUMERIC(10,2) NOT NULL,
    tax_amount      NUMERIC(10,2) DEFAULT 0,
    service_fee     NUMERIC(10,2) DEFAULT 0,
    discount_amount NUMERIC(10,2) DEFAULT 0,
    total_amount    NUMERIC(10,2) NOT NULL,
    currency        VARCHAR(3) DEFAULT 'MYR',
    status          VARCHAR(20) DEFAULT 'pending',
    -- pending → confirmed → checked_in → completed | cancelled | no_show
    payment_status  VARCHAR(20) DEFAULT 'unpaid',
    payment_method  VARCHAR(50),
    guest_name      VARCHAR(200) NOT NULL,
    guest_email     VARCHAR(320),
    guest_phone     VARCHAR(30),
    special_requests TEXT,
    cancellation_policy JSONB,
    cancelled_at    TIMESTAMPTZ,
    cancellation_reason VARCHAR(500),
    refund_amount   NUMERIC(10,2),
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_hotel_bookings_user ON commerce.hotel_bookings(user_id, created_at DESC);
CREATE INDEX idx_hotel_bookings_hotel ON commerce.hotel_bookings(hotel_id, check_in);
CREATE INDEX idx_hotel_bookings_ref ON commerce.hotel_bookings(booking_ref);
```

---

## Section 2: Attraction Booking Engine

### 2.1 Features

- Ticket selection (adult/child/senior/foreigner/MyKad tiers)
- Time slot booking (for capacity-managed attractions)
- Group booking discounts
- Combo tickets (attraction + transport)
- QR code ticket delivery
- Skip-the-line / fast pass options

### 2.2 Database

```sql
CREATE TABLE commerce.attraction_bookings (
    id              UUID PK DEFAULT gen_random_uuid_v7(),
    booking_ref     VARCHAR(20) UNIQUE NOT NULL,
    user_id         UUID NOT NULL REFERENCES users(id),
    attraction_id   UUID NOT NULL REFERENCES attraction_profiles(id),
    ticket_tier_id  UUID NOT NULL REFERENCES ticket_tiers(id),
    visit_date      DATE NOT NULL,
    time_slot       TIME,
    quantity        INTEGER DEFAULT 1,
    unit_price      NUMERIC(10,2) NOT NULL,
    total_amount    NUMERIC(10,2) NOT NULL,
    currency        VARCHAR(3) DEFAULT 'MYR',
    status          VARCHAR(20) DEFAULT 'confirmed',
    payment_status  VARCHAR(20) DEFAULT 'paid',
    qr_code         VARCHAR(500),
    ticket_number   VARCHAR(100) UNIQUE,
    is_scanned      BOOLEAN DEFAULT FALSE,
    scanned_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);
```

---

## Section 3: Event Booking Engine

### 3.1 Seat Selection Architecture

```
EVENT TICKETING:
  ├── General Admission (no seat assignment)
  ├── Reserved Seating (seat map selection)
  └── Tiered (VIP/Gold/Silver/Bronze sections)

SEAT MAP: Interactive SVG canvas
  • Color-coded by tier
  • Available/Reserved/Sold states
  • Handicap-accessible seats marked
  • Real-time lock (5 min hold during checkout)
```

### 3.2 Database

```sql
CREATE TABLE commerce.event_bookings (
    id              UUID PK DEFAULT gen_random_uuid_v7(),
    booking_ref     VARCHAR(20) UNIQUE NOT NULL,
    event_id        UUID NOT NULL REFERENCES event_listings(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    ticket_tier_id  UUID NOT NULL REFERENCES event_tickets(id),
    quantity        INTEGER DEFAULT 1,
    seats           JSONB,    -- ["A12","A13","A14"] for reserved seating
    unit_price      NUMERIC(10,2) NOT NULL,
    total_amount    NUMERIC(10,2) NOT NULL,
    status          VARCHAR(20) DEFAULT 'confirmed',
    qr_code         VARCHAR(500),
    checked_in      BOOLEAN DEFAULT FALSE,
    checked_in_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);
```

---

## Section 4-5: Ticket Management & Dynamic Pricing

### 4.1 Ticket Lifecycle

```
CREATED → ON_SALE → SOLD → SCANNED → COMPLETED
                ↓         ↓
            CANCELLED  REFUNDED
```

### 4.2 Dynamic Pricing Formula

```typescript
function calculatePrice(ticket: TicketTier, context: PricingContext): number {
  const basePrice = ticket.base_price;
  const seasonalMultiplier = getSeasonalMultiplier(context.date);
  const demandMultiplier = getDemandMultiplier(ticket);
  const advanceMultiplier = getAdvanceMultiplier(context.daysUntilEvent);
  const timeSlotMultiplier = context.timeSlot ? getTimeSlotMultiplier(context.timeSlot) : 1.0;

  return basePrice * seasonalMultiplier * demandMultiplier * advanceMultiplier * timeSlotMultiplier;
}

// Multipliers
const SEASONAL = { peak: 1.3, shoulder: 1.0, low: 0.8 };
const DEMAND = {
  availability_above_70: 0.9,
  availability_40_to_70: 1.0,
  availability_20_to_40: 1.15,
  availability_below_20: 1.35,
};
const ADVANCE = { more_than_30_days: 0.85, 7_to_30: 1.0, 1_to_7: 1.1, less_than_24h: 1.25 };
```

---

## Section 6-7: Booking Calendar & Availability

### 6.1 Availability Engine

```sql
-- Core availability query
SELECT rt.id, rt.name, rt.base_price,
       ri.date, ri.total_rooms - ri.booked_rooms AS available
FROM room_types rt
JOIN room_inventory ri ON ri.room_type_id = rt.id
WHERE rt.hotel_id = :hotel_id
  AND ri.date BETWEEN :check_in AND :check_out - 1
  AND ri.total_rooms - ri.booked_rooms >= :rooms_needed
  AND NOT ri.is_unavailable;

-- Atomic booking (prevents double-booking)
UPDATE room_inventory
SET booked_rooms = booked_rooms + :rooms
WHERE room_type_id = :room_type_id
  AND date BETWEEN :check_in AND :check_out - 1
  AND total_rooms - booked_rooms >= :rooms;
-- If rows_affected != nights → booking failed (not enough availability)
```

### 6.2 Booking Calendar Component

```
┌──────────────────────────────────────────────┐
│         June 2026                            │
│  Mon  Tue  Wed  Thu  Fri  Sat  Sun          │
│   1    2    3    4    5    6    7            │
│  RM150 RM150 RM180 RM180 RM220 RM250 RM250   │
│  🟢    🟢    🟡    🟡    🟠    🔴    🔴     │
│                                              │
│  🟢 Available  🟡 Few left  🟠 Last rooms   │
│  🔴 Sold out                                 │
│                                              │
│  Selected: Jun 14-16 (2 nights)             │
│  Total: RM 440                               │
└──────────────────────────────────────────────┘
```

---

## Section 8-9: Refund & Cancellation Engine

### 8.1 Cancellation Policies

```typescript
const CANCELLATION_POLICIES = {
  FULLY_FLEXIBLE: {
    name: 'Free Cancellation',
    refund_window_hours: 24,      // Cancel up to 24h before
    refund_percent: 100,
    description: 'Full refund if cancelled 24 hours before check-in',
  },
  PARTIALLY_FLEXIBLE: {
    name: 'Partial Refund',
    refund_window_hours: 48,
    refund_percent: 50,
    description: '50% refund if cancelled 48 hours before. No refund after.',
  },
  NON_REFUNDABLE: {
    name: 'Non-Refundable',
    refund_window_hours: 0,
    refund_percent: 0,
    description: 'No refund. Best rate guaranteed.',
  },
};
```

### 8.2 Refund Calculation

```typescript
function calculateRefund(booking: Booking, cancelTime: Date): RefundResult {
  const hoursBeforeCheckin = (booking.checkIn.getTime() - cancelTime.getTime()) / 3600000;
  const policy = booking.cancellationPolicy;

  if (hoursBeforeCheckin >= policy.refundWindowHours) {
    return {
      refundAmount: booking.totalAmount * (policy.refundPercent / 100),
      serviceFeeRetained: booking.serviceFee,
      reason: `Cancelled ${Math.round(hoursBeforeCheckin)}h before. ${policy.refundPercent}% refund per policy.`,
    };
  }

  return {
    refundAmount: 0,
    serviceFeeRetained: booking.serviceFee,
    reason: 'Cancellation window has passed. No refund per policy.',
  };
}
```

### 8.3 Refund State Machine

```
CANCELLATION_REQUESTED
  │
  ├──→ REFUND_APPROVED (automatic if within policy window)
  │     ├──→ REFUND_PROCESSING (sent to payment gateway)
  │     │     ├──→ REFUNDED ✅
  │     │     └──→ REFUND_FAILED ⚠️ (manual review)
  │     └──→ REFUND_COMPLETED
  │
  └──→ REFUND_DENIED (outside policy window, user can appeal)
```

---

## Section 10: Payment Gateway

### 10.1 Stripe Integration

```typescript
// Payment Methods Supported:
// • Credit/Debit Card (Visa, Mastercard)
// • FPX (Malaysian online banking)
// • GrabPay
// • Touch 'n Go eWallet
// • ExploreMY Wallet (stored value)

interface PaymentIntent {
  amount: number;             // in cents (smallest currency unit)
  currency: string;           // 'myr'
  paymentMethod: string;      // 'card' | 'fpx' | 'grabpay' | 'tng' | 'wallet'
  bookingType: string;        // 'hotel' | 'attraction' | 'event'
  bookingId: string;
  userId: string;
  metadata: Record<string, string>;
}

// Flow:
// 1. Create PaymentIntent on Stripe (server-side)
// 2. Return client_secret to frontend
// 3. Frontend confirms payment via Stripe Elements
// 4. Stripe webhook: payment_intent.succeeded → update booking status
// 5. Send confirmation email + push notification
```

### 10.2 Idempotency

```typescript
// All payment requests include idempotency key (booking_ref)
// Prevents double-charge if network retry occurs
const paymentIntent = await stripe.paymentIntents.create({
  amount: booking.totalAmount * 100, // RM → cents
  currency: 'myr',
  metadata: { booking_ref: booking.bookingRef },
}, {
  idempotencyKey: `payment_${booking.bookingRef}`,
});
```

---

## Section 11-13: Wallet, Rewards & Voucher Integration

### 11.1 Payment Priority

```
Checkout flow:
  1. Apply voucher/promo code → recalculate subtotal
  2. Apply reward points (if user opts in) → reduce amount
  3. Remaining balance → payment method
     a. ExploreMY Wallet (if sufficient balance)
     b. Stripe (card/FPX/GrabPay)
  4. Post-payment: award cashback + loyalty points
```

### 11.2 Voucher Validation

```typescript
function validateVoucher(code: string, booking: Booking): ValidationResult {
  const voucher = await findVoucher(code);
  if (!voucher || !voucher.isActive) return { valid: false, reason: 'Invalid code' };
  if (new Date() < voucher.startDate) return { valid: false, reason: 'Not yet active' };
  if (new Date() > voucher.endDate) return { valid: false, reason: 'Expired' };
  if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
    return { valid: false, reason: 'Fully redeemed' };
  }
  if (voucher.minSpend && booking.subtotal < voucher.minSpend) {
    return { valid: false, reason: `Minimum spend RM ${voucher.minSpend} required` };
  }
  const userRedemptions = await countUserRedemptions(voucher.id, booking.userId);
  if (userRedemptions >= voucher.userLimit) {
    return { valid: false, reason: 'You have already used this voucher' };
  }
  return {
    valid: true,
    discountAmount: calculateDiscount(voucher, booking.subtotal),
    voucher,
  };
}
```

---

## Section 14-15: Merchant Settlement & Commission Engine

### 14.1 Commission Structure

| Booking Type | Base Commission | Notes |
|-------------|----------------|-------|
| Hotel | 15% | 12% for Enterprise partners |
| Attraction | 10% | 8% for volume >1000/mo |
| Event | 8% | 5% for community events |
| Transport (future) | 5% | Bus/ETS/Flights |

### 14.2 Settlement Calculation

```typescript
interface Settlement {
  bookingRef: string;
  grossAmount: number;           // What customer paid
  commission: number;            // ExploreMY fee
  paymentProcessingFee: number;  // Stripe fee (~2.9% + RM 1)
  gstSST: number;                // 6% SST on commission
  netAmount: number;             // What merchant receives
  // netAmount = grossAmount - commission - paymentProcessingFee - gstSST
}

// Example: RM 200 hotel booking
// grossAmount:  RM 200.00
// commission:   RM  30.00 (15%)
// stripeFee:    RM   6.80 (2.9% + RM 1)
// sst:          RM   1.80 (6% × RM 30)
// netAmount:    RM 161.40 → paid to merchant
```

### 14.3 Settlement Database

```sql
CREATE TABLE commerce.settlements (
    id                  UUID PK DEFAULT gen_random_uuid_v7(),
    booking_ref         VARCHAR(20) NOT NULL,
    booking_type        VARCHAR(20) NOT NULL,
    merchant_id         UUID NOT NULL REFERENCES business_accounts(id),
    gross_amount        NUMERIC(12,2) NOT NULL,
    commission_amount   NUMERIC(12,2) NOT NULL,
    commission_rate     NUMERIC(5,2) NOT NULL,
    processing_fee      NUMERIC(12,2) DEFAULT 0,
    tax_amount          NUMERIC(12,2) DEFAULT 0,
    net_amount          NUMERIC(12,2) NOT NULL,
    currency            VARCHAR(3) DEFAULT 'MYR',
    settlement_status   VARCHAR(20) DEFAULT 'pending',
    -- pending → processing → settled | disputed
    settlement_date     DATE,
    payout_reference    VARCHAR(200),
    created_at          TIMESTAMPTZ DEFAULT now()
);
```

---

## Section 16: Revenue Engine

### 16.1 Revenue Calculation

```sql
-- Daily revenue summary (materialized view)
CREATE MATERIALIZED VIEW commerce.daily_revenue AS
SELECT
    date_trunc('day', created_at) AS day,
    booking_type,
    COUNT(*) AS booking_count,
    SUM(gross_amount) AS gross_revenue,
    SUM(commission_amount) AS commission_revenue,
    SUM(processing_fee) AS processing_fees,
    SUM(net_amount) AS merchant_payouts,
    COUNT(DISTINCT user_id) AS unique_customers
FROM commerce.settlements
WHERE settlement_status = 'settled'
GROUP BY day, booking_type
ORDER BY day DESC;
```

---

## Section 17: Fraud Detection

### 17.1 Fraud Rules Engine

```typescript
const FRAUD_RULES = [
  {
    name: 'velocity_check',
    check: (booking) => countRecentBookings(booking.userId, '1h') > 5,
    action: 'FLAG',
    severity: 'MEDIUM',
  },
  {
    name: 'amount_anomaly',
    check: (booking) => booking.totalAmount > avgUserSpend(booking.userId) * 5,
    action: 'REQUIRE_3DS',
    severity: 'LOW',
  },
  {
    name: 'location_mismatch',
    check: (booking) => distance(booking.ipLocation, booking.userHomeCity) > 500,
    action: 'FLAG',
    severity: 'LOW',
  },
  {
    name: 'multiple_cards',
    check: (booking) => uniqueCardsUsed(booking.userId, '24h') > 3,
    action: 'BLOCK',
    severity: 'HIGH',
  },
  {
    name: 'rapid_cancellation',
    check: (booking) => cancelledBookingsRatio(booking.userId, '30d') > 0.5,
    action: 'REQUIRE_PREPAY',
    severity: 'MEDIUM',
  },
];
```

---

## Section 18: Booking Analytics

```sql
-- Key metrics
CREATE VIEW commerce.booking_analytics AS
SELECT
    date_trunc('month', created_at) AS month,
    booking_type,
    COUNT(*) AS total_bookings,
    SUM(CASE WHEN status = 'confirmed' OR status = 'completed' THEN 1 ELSE 0 END) AS successful_bookings,
    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancellations,
    ROUND(100.0 * SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) / COUNT(*), 1) AS cancellation_rate,
    ROUND(AVG(total_amount), 2) AS avg_booking_value,
    SUM(total_amount) AS total_gmv,
    COUNT(DISTINCT user_id) AS unique_bookers
FROM commerce.unified_bookings
GROUP BY month, booking_type;
```

---

## Section 19: Customer Support

### 19.1 Booking Support Tools

```
ADMIN BOOKING DASHBOARD:
  ├── Search by booking_ref, email, phone, name
  ├── View full booking details + status history
  ├── Actions: cancel, refund, modify dates, resend confirmation
  ├── Audit log: all changes with timestamp + operator
  └── Customer communication: email templates for common scenarios

AUTOMATED SUPPORT:
  ├── "Where is my booking?" → self-service lookup by email
  ├── "I need to cancel" → automated cancellation if within policy
  ├── "I want to change dates" → modify flow with availability check
  └── "I have a complaint" → create support ticket, assign to team
```

---

## Section 20: Commerce APIs

### 20.1 API Summary (78 Endpoints)

| Module | Endpoints | Key APIs |
|--------|-----------|----------|
| Hotels | 10 | `GET /hotels/search`, `/availability`, `POST /bookings/hotel`, `/cancel` |
| Attractions | 8 | `GET /attractions/search`, `/tickets`, `POST /bookings/attraction` |
| Events | 9 | `GET /events/search`, `/seats`, `POST /bookings/event`, `/checkin` |
| Payments | 8 | `POST /payments/create-intent`, `/confirm`, `/refund`, `/webhooks/stripe` |
| Wallet | 6 | `GET /wallet`, `POST /wallet/topup`, `/pay`, `/redeem-points` |
| Vouchers | 5 | `POST /vouchers/validate`, `/apply` |
| Refunds | 6 | `POST /refunds/request`, `GET /refunds/:id/status` |
| Settlements | 5 | `GET /merchant/settlements`, `/export` |
| Analytics | 12 | `GET /admin/revenue`, `/bookings`, `/conversion` |
| Support | 9 | `GET /bookings/lookup`, `POST /support/tickets` |
| **Total** | **78** | |

### 20.2 Commerce NestJS Modules

```
src/modules/commerce/
├── booking-engine/         # Unified booking orchestration
├── hotel-bookings/         # Hotel-specific booking logic
├── attraction-bookings/    # Attraction ticket booking
├── event-bookings/         # Event ticket booking
├── payment-gateway/        # Stripe integration
├── wallet/                 # ExploreMY Wallet
├── vouchers/               # Promo code + voucher validation
├── refunds/                # Refund processing
├── settlements/            # Merchant payout calculation
├── commissions/            # Fee calculation engine
├── pricing-engine/         # Dynamic pricing
├── availability/           # Real-time inventory
├── fraud-detection/        # Fraud rules engine
├── booking-analytics/      # Commerce metrics
└── support/                # Customer support tools
```

### 20.3 Database Tables (Commerce Schema)

```
commerce.hotel_bookings
commerce.attraction_bookings
commerce.event_bookings
commerce.unified_bookings        -- Super-type for all bookings
commerce.booking_status_log      -- Audit trail
commerce.payment_intents         -- Stripe payment tracking
commerce.refunds                 -- Refund records
commerce.settlements             -- Merchant payouts
commerce.voucher_redemptions     -- Voucher usage
commerce.commission_rules        -- Configurable fee rules
commerce.fraud_logs              -- Fraud detection events
commerce.daily_revenue           -- Materialized view
commerce.booking_analytics       -- View
```

---

*End of Booking & Commerce Platform Blueprint — 20 sections complete.*
