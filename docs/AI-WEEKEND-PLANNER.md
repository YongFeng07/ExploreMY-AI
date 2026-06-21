# AI Weekend Planner — Full Product Specification

**Status:** Spec Complete  
**Target:** ExploreMY AI — v2.0  
**Author:** Principal AI Product Architect (Ex-Google Travel PD, Ex-Airbnb Product Lead, Ex-Tripadvisor Architect, Ex-Grab Principal PM)  
**Date:** 2026-06-15  
**Dependencies:** `@exploremy/database`, `@exploremy/shared`, NestJS 10, Prisma 6, PostgreSQL 16 + PostGIS + pgvector, OpenAI GPT-4o, Gemini 2.5 Flash, Google Maps Platform, Redis (Upstash)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [User Journey & UX Design](#2-user-journey--ux-design)
3. [Product Requirements](#3-product-requirements)
4. [Database Design & Prisma Schema](#4-database-design--prisma-schema)
5. [NestJS Module Architecture](#5-nestjs-module-architecture)
6. [API Design](#6-api-design)
7. [AI Workflow & Prompt Engineering](#7-ai-workflow--prompt-engineering)
8. [Route Optimization Engine](#8-route-optimization-engine)
9. [Cost Calculation Engine](#9-cost-calculation-engine)
10. [Implementation Roadmap](#10-implementation-roadmap)

---

## 1. Executive Summary

### 1.1 The Problem

Malaysians and ASEAN travelers spend hours researching weekend trips across Google Maps, TikTok, Instagram, blogs, and WhatsApp groups. They piece together fragmented information — restaurant hours, ticket prices, parking availability, route optimization — and still arrive to find the famous nasi kandar stall is closed on Mondays or the scenic route is jammed with weekend traffic.

### 1.2 The Solution

**AI Weekend Planner** generates a complete, optimized, budget-aware weekend itinerary in under 10 seconds. The user provides 7 inputs (location, travel date, budget, transport mode, group type, travel style, special preferences) and receives a fully-generated plan with timeline view, map view, budget breakdown, distance breakdown, and travel time breakdown.

### 1.3 Core Metric (North Star)

> **Time from intent to itinerary: < 10 seconds.**  
> Target: < 8s p95 latency end-to-end (input submission → fully rendered plan).

### 1.4 Differentiators vs Competitors

| Competitor | What They Do | Our Edge |
|---|---|---|
| Google Maps | Route + place discovery | No itinerary generation, no budget, no meal planning |
| TripAdvisor | Reviews + top attractions | Static lists, no dynamic routing, no cost optimization |
| Wanderlog | Manual trip planning | No AI generation, manual drag-and-drop |
| Pelago (SG Airlines) | Curated experiences | Fixed packages, no personalization, KL/SG only |
| Klook | Activity booking | No routing, no meals, no multi-day planning |
| **ExploreMY AI** | **Full AI-generated weekend** | **7-input personalization, 8-cost breakdown, route optimization, hidden gems, real-time traffic + weather + crowd, 10-second generation** |

### 1.5 Architecture at a Glance

```
User Input (7 params, single screen)
        │
        ▼
┌───────────────────┐
│  Plan Generator   │  ← GPT-4o + Gemini Flash + Rule-based fallback
│  (AI Orchestrator)│
└──────┬────────────┘
       │
   ┌───┼───────────┬──────────────┬──────────────┐
   │   │           │              │              │
   ▼   ▼           ▼              ▼              ▼
┌────┐ ┌──────┐ ┌──────┐  ┌──────────┐  ┌──────────┐
│Meal│ │Hidden│ │Photo │  │Route     │  │Budget    │
│Plan│ │Gem   │ │Spot  │  │Optimizer │  │Engine    │
│ner │ │Finder│ │Finder│  │(TSP+GMaps)│  │(8 costs) │
└────┘ └──────┘ └──────┘  └──────────┘  └──────────┘
       │           │              │              │
       └───────────┴──────────────┴──────────────┘
                           │
                           ▼
              ┌───────────────────────┐
              │  WeekendPlan          │
              │  (Persisted to DB)    │
              │  + Timeline View      │
              │  + Map View           │
              │  + Budget Breakdown   │
              │  + Share Card         │
              └───────────────────────┘
```

---

## 2. User Journey & UX Design

### 2.1 Entry Points

The AI Weekend Planner is accessed via three surfaces:

1. **Dedicated Bottom Tab** — "Planner" tab in the main navigation bar (between Explore and Trips)
2. **Floating Action Button** — Diamond-shaped FAB on the Explore map screen with "✨ Plan My Weekend" label
3. **Home Screen Hero Card** — "Weekend plans in 10 seconds" card with destination quick-picks (Penang, KL, Melaka, Cameron Highlands)

### 2.2 Input Flow (Single Screen — Progressive Disclosure)

The input experience is designed as a single scrollable screen with three visual sections. No multi-step wizard — all inputs are visible at once for speed and transparency. The form uses `react-hook-form` with `zod` validation matching the existing project patterns.

```
┌─────────────────────────────────────────────────────────────┐
│  ✨ AI Weekend Planner                                       │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  SECTION 1: WHERE & WHEN                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📍 Destination                          [📍 Use GPS] │   │
│  │    e.g. "Penang", "Cameron Highlands"               │   │
│  │    ┌────────────────────────────────────────────┐   │   │
│  │    │ Quick Picks: Penang | KL | Melaka | Langkawi│   │   │
│  │    └────────────────────────────────────────────┘   │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ 📅 Weekend Date                    [Calendar Picker] │   │
│  │    ○ This Weekend (Jun 21–22)                       │   │
│  │    ○ Next Weekend (Jun 28–29)                       │   │
│  │    ○ Custom Dates                                   │   │
│  │    ○ 1-Day  ○ 2-Day  ● 3-Day (Fri–Sun)             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  SECTION 2: BUDGET & TRANSPORT                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 💰 Budget (MYR)                                     │   │
│  │    ┌──────┬──────┬──────┬──────┬──────┐            │   │
│  │    │ RM200│ RM500│ RM800│RM1500│RM2500│ ✏️ Custom  │   │
│  │    └──────┴──────┴──────┴──────┴──────┘            │   │
│  │    Budget per person: RM 400 (group of 2)           │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ 🚗 Transportation                                   │   │
│  │    ○ Driving  ● Grab  ○ Bus  ○ KTM  ○ ETS         │   │
│  │    ○ Mixed (AI optimizes per leg)                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  SECTION 3: GROUP & STYLE                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 👥 Group Type                                       │   │
│  │    ○ Solo  ● Couple  ○ Family  ○ Friends           │   │
│  │    Group size: [2] people                            │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ 🎯 Travel Style (select all that apply)              │   │
│  │    [Adventure] [Luxury] [Budget] [Nature]            │   │
│  │    [Foodie ✓] [Photography ✓] [Nightlife]            │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ⚙️ Special Preferences (optional)                    │   │
│  │    [🐾 Pet Friendly] [👶 Kid Friendly]               │   │
│  │    [♿ Wheelchair Friendly]                           │   │
│  │    [🍖 Halal Food] [🥬 Vegetarian]                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         ✨ Generate My Weekend Plan                  │   │
│  │         (Press Enter — ~8 second generation)        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Generation Loading Experience

During the 7–8 second generation window, the UI shows a dynamic loading sequence that builds user confidence through transparency. Each completed step animates in with a checkmark. A rotating "Did you know?" footer keeps the user engaged.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│            🧠 Building your perfect weekend...               │
│                                                             │
│  ✓ Analyzing 2,847 places in Penang                         │
│  ✓ Matching your Foodie + Photography preferences           │
│  ✓ Calculating optimal routes (3 options evaluated)         │
│  ✓ Checking weather forecast (28°C, partly cloudy)          │
│  ✓ Finding hidden gems locals love                          │
│  ◌ Estimating costs with real-time prices                   │
│  ◌ Finalizing your itinerary                                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ████████████████████████░░░░░░░░  78%              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  💡 Did you know? Penang's Gurney Drive hawker centre        │
│     has been serving char kway teow since 1963.             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.4 Output — Plan Dashboard (Tabbed View)

The generated plan renders as a tabbed dashboard with five views. The default view is the Timeline.

```
┌─────────────────────────────────────────────────────────────┐
│  🍜 Penang Foodie Weekend · Jun 21–22 · MYR 847             │
│  Created 2s ago · 14 stops · 8.2 km · GPT-4o                │
│  ─────────────────────────────────────────────────────────  │
│  [📋 Timeline] [🗺️ Map] [💰 Budget] [📊 Stats] [⚙️ Edit]   │
│                                                             │
│  ┌─── TIMELINE VIEW ───────────────────────────────────┐   │
│  │                                                      │   │
│  │  📅 SATURDAY, JUNE 21                                 │   │
│  │  "Georgetown Heritage & Food Trail"                   │   │
│  │  🌤️ 28°C · Partly Cloudy · 20% rain                  │   │
│  │  ──────────────────────────────────────────────      │   │
│  │                                                      │   │
│  │  07:30  🍜 Toh Soon Cafe                             │   │
│  │  ├────  Charcoal kaya toast + kopi O · MYR 8         │   │
│  │  ├────  ⏱️ 60 min  ·  🚶 5 min walk from hotel      │   │
│  │  └────  💡 "The charcoal-grilled bread here is        │   │
│  │           legendary — get there by 7:30 to beat       │   │
│  │           the queue"                                  │   │
│  │                                                      │   │
│  │  09:00  🏛️ Kek Lok Si Temple                         │   │
│  │  ├────  SE Asia's largest Buddhist temple · MYR 8    │   │
│  │  ├────  ⏱️ 90 min  ·  🚕 15 min Grab · MYR 12       │   │
│  │  └────  📸 Photo Spot: Pagoda at sunrise              │   │
│  │                                                      │   │
│  │  11:00  ☕ Lunabar Coffee                             │   │
│  │  ├────  Specialty coffee in a heritage shophouse      │   │
│  │  ├────  ⏱️ 45 min  ·  🚶 8 min walk                 │   │
│  │  └────  💎 Hidden Gem: Only 34 reviews, 4.7★         │   │
│  │                                                      │   │
│  │  13:00  🍛 Nasi Kandar Line Clear                    │   │
│  │  ├────  Legendary 24h nasi kandar · MYR 14            │   │
│  │  ├────  ⏱️ 60 min  ·  🚕 10 min Grab · MYR 8        │   │
│  │  └────  ✅ Halal certified                            │   │
│  │                                                      │   │
│  │  15:00  🎨 Hin Bus Depot                             │   │
│  │  ├────  Contemporary art space, free entry            │   │
│  │  ├────  ⏱️ 60 min  ·  🚕 12 min Grab · MYR 10       │   │
│  │  └────  📸 Photo Spot: Rotating exhibitions           │   │
│  │                                                      │   │
│  │  17:00  🌅 Penang Hill Funicular                     │   │
│  │  ├────  Sunset city views, cool mountain air          │   │
│  │  ├────  ⏱️ 120 min  ·  🚕 25 min Grab · MYR 18      │   │
│  │  └────  🎫 Entry: MYR 30/person                       │   │
│  │                                                      │   │
│  │  19:30  🍜 Chulia Street Night Hawkers               │   │
│  │  ├────  Wanton mee, curry mee, lok-lok · MYR 20     │   │
│  │  ├────  ⏱️ 75 min  ·  🚕 20 min Grab · MYR 15       │   │
│  │  └────  ✅ Halal options available                    │   │
│  │                                                      │   │
│  │  21:30  🍸 Magazine 63 Rooftop Bar                   │   │
│  │  ├────  Craft cocktails, Georgetown skyline           │   │
│  │  ├────  ⏱️ 90 min  ·  🚶 5 min walk                 │   │
│  │  └────  💎 Hidden Gem: Speakeasy above a kopitiam    │   │
│  │                                                      │   │
│  │  ──────────────────────────────────────────────      │   │
│  │  Day Total: MYR 447 · 8 stops · 5.4 km              │   │
│  │                                                      │   │
│  │  ──────────────────────────────────────────────      │   │
│  │                                                      │   │
│  │  📅 SUNDAY, JUNE 22                                   │   │
│  │  "Batu Ferringhi Coast & Local Flavors"              │   │
│  │  🌤️ 29°C · Sunny · 10% rain                         │   │
│  │  ... (6 stops, MYR 400)                             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  [💾 Save Plan]  [📤 Share]  [🔄 Regenerate]  [📋 Export]  │
└─────────────────────────────────────────────────────────────┘
```

### 2.5 Map View

```
┌─── MAP VIEW (Interactive Google Map) ───────────────────┐   │
│  ┌──────────────────────────────────────────────────┐   │   │
│  │  🗺️ Full-screen Google Map                        │   │   │
│  │                                                    │   │   │
│  │  Day 1 Route (Blue polyline)                       │   │   │
│  │  ① Toh Soon Cafe ──→ ② Kek Lok Si ──→ ③ Lunabar  │   │   │
│  │  ──→ ④ Line Clear ──→ ⑤ Hin Bus Depot             │   │   │
│  │  ──→ ⑥ Penang Hill ──→ ⑦ Chulia St ──→ ⑧ Mag 63  │   │   │
│  │                                                    │   │   │
│  │  Day 2 Route (Orange polyline)                     │   │   │
│  │  ① Transfer Rd ──→ ② Chew Jetty ──→ ③ ...         │   │   │
│  │                                                    │   │   │
│  │  [🔵 Day 1] [🟠 Day 2] [📍 All Stops]              │   │   │
│  └──────────────────────────────────────────────────┘   │   │
│                                                          │   │
│  Tap any numbered pin → Place detail card slides up:     │   │
│  ┌──────────────────────────────────────────────────┐   │   │
│  │  🍜 Nasi Kandar Line Clear      ⭐ 4.3 (2,847)   │   │   │
│  │  177 Jalan Penang, Georgetown                     │   │   │
│  │  ──────────────────────────────────────           │   │   │
│  │  Opens 24 hours · MYR 5–15                        │   │   │
│  │  "Legendary nasi kandar since 1930"               │   │   │
│  │  [Get Directions] [View Details] [Replace Stop]   │   │   │
│  └──────────────────────────────────────────────────┘   │   │
└──────────────────────────────────────────────────────────┘   │
```

### 2.6 Share Experience

The share feature generates a visually rich social card with plan highlights and a short URL.

```
┌─────────────────────────────────────────────────────────────┐
│  Share Weekend Plan                                         │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           [Generated OG Image Card]                  │   │
│  │   ┌─────────────────────────────────────┐           │   │
│  │   │  ┌───────────────────────────────┐  │           │   │
│  │   │  │  🍜 Penang Foodie Weekend     │  │           │   │
│  │   │  │  Jun 21–22, 2026              │  │           │   │
│  │   │  │  ─────────────────────        │  │           │   │
│  │   │  │  Day 1: 8 stops · 5.4 km     │  │           │   │
│  │   │  │  Day 2: 6 stops · 3.2 km     │  │           │   │
│  │   │  │  MYR 847 total               │  │           │   │
│  │   │  │  ─────────────────────        │  │           │   │
│  │   │  │  Made with ExploreMY AI       │  │           │   │
│  │   │  │  exploremy.ai/trip/x7k9a2    │  │           │   │
│  │   │  └───────────────────────────────┘  │           │   │
│  │   └─────────────────────────────────────┘           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [📱 WhatsApp] [📷 Instagram Story] [🔗 Copy Link]          │
│  [🐦 Twitter/X] [💬 Telegram] [📧 Email]                    │
│                                                             │
│  Share link: exploremy.ai/trip/x7k9a2  [📋 Copy]           │
│  Collaborators can view & suggest edits                     │
└─────────────────────────────────────────────────────────────┘
```

### 2.7 Edit & Refine Experience

- **Drag to reorder** stops within a day (optimistic UI with instant update)
- **Tap ✕ to remove** any stop → AI suggests 3 replacement options
- **"Add a stop"** button at any position → search places or AI suggests best fit
- **"Change vibe"** button → regenerates with different theme slider (More Adventurous ↔ More Relaxed, More Local ↔ More Tourist, More Romantic ↔ More Social)
- **"Adjust budget"** slider → plan auto-rebalances, swapping expensive stops for alternatives
- **Transport toggle** per leg: Walk / Grab / Drive / Bus — costs and times update instantly
- **"Lock" button** (🔒) on stops you love → regenerate everything else around locked stops
- **"Try alternative route"** — cycle through Fastest / Cheapest / Scenic routing options

---

## 3. Product Requirements

### 3.1 Functional Requirements

#### FR-1: Plan Generation

| ID | Requirement | Priority |
|---|---|---|
| FR-1.1 | Generate weekend plan from 7 user inputs in < 10 seconds | P0 |
| FR-1.2 | Support 1-day, 2-day, 3-day, and full weekend (Fri evening–Sun) plans | P0 |
| FR-1.3 | Generate per-day schedule with 6–10 stops each: breakfast, morning activity, lunch, afternoon activity, café, dinner, night activity | P0 |
| FR-1.4 | Each stop includes: place name, category emoji, description, cost estimate, duration, transport mode from previous stop, distance, arrival time, departure time | P0 |
| FR-1.5 | Include at least 2 hidden gems per day (places with < 50 reviews, > 4.3 rating, low tourist density) | P1 |
| FR-1.6 | Include at least 1 photo spot per day (viewpoint, mural, architecture, nature vista) | P1 |
| FR-1.7 | Regenerate single day while keeping other days intact | P1 |
| FR-1.8 | Regenerate entire plan with same inputs (different seed) | P1 |

#### FR-2: Cost Calculation

| ID | Requirement | Priority |
|---|---|---|
| FR-2.1 | Calculate **fuel cost** from total distance × vehicle consumption × current Malaysian fuel price (RON95: RM 2.05/L, RON97: RM 3.47/L) | P0 |
| FR-2.2 | Calculate **toll costs** for Malaysian highway routes (PLUS, LPT, NKVE, KESAS, Penang Bridge) | P0 |
| FR-2.3 | Calculate **parking costs** per stop based on city rates (KL: RM 3–15/hr, Penang: RM 2–8/hr, etc.) | P0 |
| FR-2.4 | Estimate **hotel cost** based on destination, travel style tier, and group type | P0 |
| FR-2.5 | Estimate **food cost**: breakfast RM 5–15, lunch RM 10–25, dinner RM 15–50 per person depending on city and style | P0 |
| FR-2.6 | Estimate **ticket/entry costs** for attractions (lookup table for 200+ Malaysian attractions) | P0 |
| FR-2.7 | Estimate **Grab/ride-hailing costs** using distance-based fare formula with surge multiplier for peak hours | P0 |
| FR-2.8 | Calculate **12–15% emergency buffer** on top of all other costs | P0 |
| FR-2.9 | Display budget utilization as a progress bar with color coding (green < 85%, yellow 85–100%, red > 100%) | P1 |

#### FR-3: Route Optimization

| ID | Requirement | Priority |
|---|---|---|
| FR-3.1 | Optimize stop ordering to minimize total travel time (TSP with 2-opt local search) | P0 |
| FR-3.2 | Call Google Distance Matrix API for real-time travel times between stops | P0 |
| FR-3.3 | Factor in departure-time traffic via Google Maps `departureTime` parameter | P0 |
| FR-3.4 | Adjust outdoor stops when rain probability > 60% (swap for indoor alternatives, or reorder to avoid rain window) | P1 |
| FR-3.5 | Prefer stops with parking for driving trips (filter by Place.amenities.hasParking) | P2 |
| FR-3.6 | Offer 3 route strategy variants: Fastest, Cheapest, Scenic | P1 |
| FR-3.7 | Estimate crowd levels by day-of-week + time-of-day + Malaysian school holiday calendar | P2 |

#### FR-4: Plan Management

| ID | Requirement | Priority |
|---|---|---|
| FR-4.1 | Save plans to user account (persisted to PostgreSQL via Prisma) | P0 |
| FR-4.2 | Share plans via unique short link (public/private toggle) | P0 |
| FR-4.3 | Export plan as PDF with all views (timeline, map, budget, stats) | P1 |
| FR-4.4 | Clone and modify existing plans with optional input overrides | P1 |
| FR-4.5 | Allow collaborators to view shared plans (read-only) | P2 |
| FR-4.6 | Offline access to saved plans (cached in localStorage + IndexedDB) | P2 |

#### FR-5: Personalization & Accessibility

| ID | Requirement | Priority |
|---|---|---|
| FR-5.1 | Apply UserPreferences (dietary, cuisine, activity, budget) from user profile | P0 |
| FR-5.2 | Filter **Halal-only** restaurants when preference selected (Muslim-owned or JAKIM-certified) | P0 |
| FR-5.3 | Filter **vegetarian** options when preference selected (Indian vegetarian restaurants, Buddhist vegetarian stalls, vegan cafes) | P0 |
| FR-5.4 | Prefer **wheelchair-accessible** venues (ramp access, wide doorways, accessible toilets) | P1 |
| FR-5.5 | Prefer **kid-friendly** venues for Family group (play areas, high chairs, kids' menu, open spaces) | P1 |
| FR-5.6 | Prefer **pet-friendly** venues (outdoor seating, parks, pet-friendly cafes) | P2 |
| FR-5.7 | Learn from user feedback (thumbs up/down per stop) to improve future recommendations | P2 |

### 3.2 Non-Functional Requirements

| ID | Requirement | Target |
|---|---|---|
| NFR-1 | Plan generation latency (p95) | < 8 seconds |
| NFR-2 | Plan generation latency (p99) | < 12 seconds |
| NFR-3 | Saved plan retrieval latency (p95) | < 200ms |
| NFR-4 | Concurrent plan generation capacity | 500 simultaneous |
| NFR-5 | Plan generation success rate (any tier) | > 99.5% |
| NFR-6 | AI fallback coverage (when GPT-4o and Gemini both unavailable) | 100% (rule-based engine) |
| NFR-7 | Mobile data for full plan load | < 2 MB |
| NFR-8 | Offline plans available without network | All saved plans |
| NFR-9 | API rate limit (Free tier) | 10 generate + 50 read / minute |
| NFR-10 | API rate limit (Pro tier) | 30 generate + 200 read / minute |

---

## 4. Database Design & Prisma Schema

### 4.1 Entity Relationship Diagram

```
┌──────────────────┐
│      User        │  (existing)
│  + id            │
│  + clerkId       │
│  + travelStyle   │
│  + dietaryPrefs  │
└────────┬─────────┘
         │ 1
         │
         │ N
┌────────▼──────────────────────────────────────────────┐
│                  WeekendPlan                           │
│  + id, userId, title, destination, dates               │
│  + planType, budget, transportMode                     │
│  + groupType, travelStyles[], specialPreferences[]     │
│  + weather, totalCost, totalDistance, totalTime        │
│  + isPublic, shareToken, status                        │
└──┬──────────┬──────────┬───────────┬──────────────────┘
   │ 1        │ 1        │ 1         │ 1
   │          │          │           │
   │ N        │ N        │ N         │ N
┌──▼──────┐ ┌─▼────────┐ ┌▼──────────┐ ┌─▼───────────────┐
│Weekend  │ │Weekend   │ │Weekend    │ │Weekend          │
│PlanDay  │ │Budget    │ │Route      │ │Recommendation   │
│         │ │          │ │            │ │                 │
│+ dayNum │ │+ category│ │+ fromStop │ │+ type           │
│+ date   │ │+ cost    │ │+ toStop   │ │+ placeName      │
│+ theme  │ │+ actual  │ │+ polyline │ │+ relevanceScore │
│+ weather│ │+ %total  │ │+ distance │ │+ accepted?      │
└──┬──────┘ └──────────┘ │+ strategy │ └─────────────────┘
   │ 1                    └───────────┘
   │
   │ N
┌──▼──────────────┐      ┌──────────────────┐
│WeekendPlanStop  │      │WeekendOptimization│
│                 │      │                   │
│+ order          │      │+ strategy         │
│+ time, duration │      │+ distanceSaved    │
│+ placeName      │      │+ timeSaved        │
│+ category, emoji│      │+ costSaved        │
│+ isHiddenGem    │      │+ originalOrder    │
│+ isPhotoSpot    │      │+ optimizedOrder   │
│+ isLocked       │      └───────────────────┘
│+ transportPrev  │
│+ cost estimates │
└──┬──────────────┘
   │ N:1 (optional)
   │
┌──▼──────┐
│  Place  │  (existing)
│  + id   │
│  + name │
│  + lat  │
│  + lng  │
└─────────┘
```

### 4.2 New Prisma Enums

Add the following enums to `packages/database/prisma/schema.prisma` (alongside the existing 26 enums):

```prisma
enum WeekendPlanType {
  ONE_DAY
  TWO_DAY
  THREE_DAY
  FULL_WEEKEND
}

enum GroupType {
  SOLO
  COUPLE
  FAMILY
  FRIENDS
}

enum WeekendTravelStyle {
  ADVENTURE
  LUXURY
  BUDGET
  NATURE
  FOODIE
  PHOTOGRAPHY
  NIGHTLIFE
}

enum SpecialPreference {
  PET_FRIENDLY
  KID_FRIENDLY
  WHEELCHAIR_FRIENDLY
  HALAL_FOOD
  VEGETARIAN
}

enum StopCategory {
  BREAKFAST
  BRUNCH
  LUNCH
  CAFE_STOP
  DINNER
  SUPPER
  TOURIST_ATTRACTION
  HIDDEN_GEM
  PHOTO_SPOT
  NIGHT_ACTIVITY
  SHOPPING
  NATURE
  TRANSIT
}

enum OptimizationStrategy {
  FASTEST
  CHEAPEST
  SCENIC
  BALANCED
}

enum CostCategory {
  FUEL
  TOLL
  PARKING
  HOTEL
  FOOD
  TICKET
  TRANSPORT
  EMERGENCY_BUFFER
  MISC
}
```

### 4.3 New Prisma Models

```prisma
// =============================================================================
// WEEKEND PLANNER — CORE MODELS
// =============================================================================

model WeekendPlan {
  id                  String               @id @default(uuid()) @db.Uuid
  userId              String               @db.Uuid
  title               String               @db.VarChar(255)
  description         String?              @db.Text

  // ── Input parameters (immutable after creation) ──
  destination         String               @db.VarChar(255)
  destinationLat      Float
  destinationLng      Float
  startDate           DateTime             @db.Date
  endDate             DateTime             @db.Date
  planType            WeekendPlanType
  budget              Float
  budgetCurrency      String               @default("MYR") @db.VarChar(3)
  transportMode       TransportMode
  groupType           GroupType
  travelStyles        WeekendTravelStyle[]
  specialPreferences  SpecialPreference[]
  groupSize           Int                  @default(1)

  // ── Generation metadata ──
  isAIGenerated       Boolean              @default(true)
  aiModel             String?              @db.VarChar(50)
  aiPrompt            String?              @db.Text
  aiTokensUsed        Int?
  generationLatencyMs Int?
  generationVersion   String?              @db.VarChar(20)

  // ── Weather snapshot at generation time ──
  weatherSnapshot     Json?

  // ── Status & sharing ──
  status              TripStatus           @default(DRAFT)
  isPublic            Boolean              @default(false)
  shareToken          String?              @unique @db.VarChar(64)
  viewCount           Int                  @default(0)
  likeCount           Int                  @default(0)
  cloneCount          Int                  @default(0)

  // ── Computed summaries (denormalized for fast list views) ──
  totalCost           Float?
  totalDistance       Float?
  totalTravelTime     Int?
  totalStops          Int                  @default(0)
  hiddenGemCount      Int                  @default(0)

  createdAt           DateTime             @default(now()) @db.Timestamptz()
  updatedAt           DateTime             @updatedAt @db.Timestamptz()

  // ── Relations ──
  user              User                     @relation(fields: [userId], references: [id], onDelete: Cascade)
  days              WeekendPlanDay[]
  budgetItems       WeekendBudget[]
  routes            WeekendRoute[]
  recommendations   WeekendRecommendation[]
  optimizations     WeekendOptimization[]
  aiRecommendation  AIRecommendation?        @relation(fields: [aiRecommendationId], references: [id], onDelete: SetNull)
  aiRecommendationId String?                @db.Uuid

  @@index([userId])
  @@index([userId, status])
  @@index([shareToken])
  @@index([destination])
  @@index([startDate, endDate])
  @@index([isPublic, likeCount])
  @@index([createdAt])
  @@map("weekend_plans")
}

model WeekendPlanDay {
  id              String    @id @default(uuid()) @db.Uuid
  weekendPlanId   String    @db.Uuid
  dayNumber       Int
  date            DateTime  @db.Date
  theme           String?   @db.VarChar(255)
  notes           String?   @db.Text

  weatherCondition  String?  @db.VarChar(50)
  weatherTempMin    Float?
  weatherTempMax    Float?
  weatherRainChance Float?

  dayTotalCost     Float?
  dayTotalDistance Float?
  dayTotalTime     Int?
  stopCount        Int       @default(0)

  createdAt       DateTime  @default(now()) @db.Timestamptz()

  weekendPlan WeekendPlan      @relation(fields: [weekendPlanId], references: [id], onDelete: Cascade)
  stops       WeekendPlanStop[]

  @@unique([weekendPlanId, dayNumber], name: "uq_weekend_day_number")
  @@index([weekendPlanId])
  @@map("weekend_plan_days")
}

model WeekendPlanStop {
  id              String      @id @default(uuid()) @db.Uuid
  weekendDayId    String      @db.Uuid
  placeId         String?     @db.Uuid
  order           Int

  startTime       String?     @db.VarChar(8)
  endTime         String?     @db.VarChar(8)
  durationMinutes Int

  // ── Denormalized place data (for offline access + fast reads) ──
  placeName       String      @db.VarChar(255)
  placeCategory   StopCategory
  placeEmoji      String?     @db.VarChar(10)
  description     String?     @db.Text
  photoUrl        String?     @db.VarChar(2048)
  rating          Float?
  priceLevel      Int?

  // ── Transport from previous stop ──
  transportModeFromPrev  TransportMode?
  distanceFromPrev       Float?
  travelTimeFromPrev     Int?
  transportCostFromPrev  Float?

  // ── Cost estimates ──
  entryFee        Float?
  estimatedSpend  Float?

  // ── AI metadata ──
  isHiddenGem     Boolean    @default(false)
  isPhotoSpot     Boolean    @default(false)
  isAIGenerated   Boolean    @default(true)
  aiReasoning     String?    @db.Text

  // ── Context ──
  isIndoor        Boolean    @default(false)
  crowdLevel      String?    @db.VarChar(20)
  rainSafe        Boolean    @default(true)

  // ── User interaction ──
  isLocked        Boolean    @default(false)
  userNote        String?    @db.Text
  userRating      Int?

  createdAt       DateTime   @default(now()) @db.Timestamptz()

  weekendDay WeekendPlanDay @relation(fields: [weekendDayId], references: [id], onDelete: Cascade)
  place      Place?         @relation(fields: [placeId], references: [id], onDelete: SetNull)

  @@index([weekendDayId])
  @@index([weekendDayId, order])
  @@index([placeId])
  @@map("weekend_plan_stops")
}

// =============================================================================
// WEEKEND BUDGET MODEL
// =============================================================================

model WeekendBudget {
  id              String       @id @default(uuid()) @db.Uuid
  weekendPlanId   String       @db.Uuid
  category        CostCategory
  label           String       @db.VarChar(100)

  estimatedCost   Float
  actualCost      Float?
  currency        String       @default("MYR") @db.VarChar(3)

  breakdown       Json?
  percentageOfTotal Float?

  notes           String?      @db.Text
  createdAt       DateTime     @default(now()) @db.Timestamptz()

  weekendPlan WeekendPlan @relation(fields: [weekendPlanId], references: [id], onDelete: Cascade)

  @@unique([weekendPlanId, category], name: "uq_weekend_budget_category")
  @@index([weekendPlanId])
  @@map("weekend_budgets")
}

// =============================================================================
// WEEKEND ROUTE MODEL
// =============================================================================

model WeekendRoute {
  id              String              @id @default(uuid()) @db.Uuid
  weekendPlanId   String              @db.Uuid
  dayNumber       Int

  fromStopId      String?             @db.Uuid
  toStopId        String?             @db.Uuid
  transportMode   TransportMode

  polyline        String?             @db.Text
  distanceMeters  Float
  durationSeconds Float
  durationInTrafficSeconds Float?

  fuelCost        Float?
  tollCost        Float?
  parkingCost     Float?
  grabEstimate    Float?
  totalCost       Float?
  currency        String              @default("MYR") @db.VarChar(3)

  strategy        OptimizationStrategy @default(BALANCED)
  trafficLevel    String?             @db.VarChar(20)

  alternatives    Json?

  createdAt       DateTime            @default(now()) @db.Timestamptz()

  weekendPlan   WeekendPlan      @relation(fields: [weekendPlanId], references: [id], onDelete: Cascade)
  fromStop      WeekendPlanStop? @relation("RouteFromStop", fields: [fromStopId], references: [id], onDelete: SetNull)
  toStop        WeekendPlanStop? @relation("RouteToStop", fields: [toStopId], references: [id], onDelete: SetNull)

  @@index([weekendPlanId])
  @@index([weekendPlanId, dayNumber])
  @@index([fromStopId])
  @@index([toStopId])
  @@map("weekend_routes")
}

// =============================================================================
// WEEKEND RECOMMENDATIONS
// =============================================================================

model WeekendRecommendation {
  id              String    @id @default(uuid()) @db.Uuid
  weekendPlanId   String    @db.Uuid
  stopId          String?   @db.Uuid
  dayNumber       Int?
  type            String    @db.VarChar(50)   // "alternative", "add_on", "nearby", "upgrade"

  placeId         String?   @db.Uuid
  placeName       String    @db.VarChar(255)
  placeCategory   String?   @db.VarChar(100)
  description     String?   @db.Text
  photoUrl        String?   @db.VarChar(2048)
  rating          Float?
  estimatedCost   Float?
  currency        String    @default("MYR") @db.VarChar(3)

  relevanceScore  Float
  reasoning       String?   @db.Text

  isAccepted      Boolean   @default(false)
  isDismissed     Boolean   @default(false)

  createdAt       DateTime  @default(now()) @db.Timestamptz()

  weekendPlan WeekendPlan      @relation(fields: [weekendPlanId], references: [id], onDelete: Cascade)
  place       Place?           @relation(fields: [placeId], references: [id], onDelete: SetNull)

  @@index([weekendPlanId])
  @@index([stopId])
  @@index([isAccepted])
  @@map("weekend_recommendations")
}

// =============================================================================
// WEEKEND OPTIMIZATION LOG
// =============================================================================

model WeekendOptimization {
  id              String              @id @default(uuid()) @db.Uuid
  weekendPlanId   String              @db.Uuid

  strategy        OptimizationStrategy
  version         Int

  previousTotalDistance  Float?
  optimizedTotalDistance Float?
  distanceSaved          Float?
  previousTotalTime      Int?
  optimizedTotalTime     Int?
  timeSaved              Int?
  previousTotalCost      Float?
  optimizedTotalCost     Float?
  costSaved              Float?

  factorsConsidered Json?
  originalOrder     Json?
  optimizedOrder    Json?

  createdAt       DateTime            @default(now()) @db.Timestamptz()

  weekendPlan WeekendPlan @relation(fields: [weekendPlanId], references: [id], onDelete: Cascade)

  @@index([weekendPlanId])
  @@index([weekendPlanId, version])
  @@map("weekend_optimizations")
}
```

### 4.4 PostgreSQL Materialized Views

```sql
-- Weekend plan popularity leaderboard
CREATE MATERIALIZED VIEW weekend_plan_leaderboard AS
SELECT
  wp.id,
  wp.title,
  wp.destination,
  wp.start_date,
  wp.end_date,
  wp.total_cost,
  wp.total_distance,
  wp.view_count,
  wp.like_count,
  wp.clone_count,
  (wp.like_count * 2 + wp.clone_count * 3 + wp.view_count * 0.1) AS popularity_score,
  u.display_name AS creator_name,
  u.avatar_url AS creator_avatar
FROM weekend_plans wp
JOIN users u ON wp.user_id = u.id
WHERE wp.is_public = TRUE
  AND wp.status = 'PLANNED'
ORDER BY popularity_score DESC;

-- User weekend planning stats
CREATE VIEW user_weekend_stats AS
SELECT
  u.id AS user_id,
  COUNT(wp.id) AS total_plans,
  COUNT(wp.id) FILTER (WHERE wp.status = 'COMPLETED') AS completed_plans,
  AVG(wp.total_cost) AS avg_plan_cost,
  AVG(wp.total_distance) AS avg_plan_distance,
  SUM(wp.hidden_gem_count) AS total_hidden_gems_discovered,
  AVG(wp.generation_latency_ms) AS avg_generation_time_ms
FROM users u
LEFT JOIN weekend_plans wp ON u.id = wp.user_id
WHERE u.is_deleted = FALSE
GROUP BY u.id;

-- Trending weekend destinations (rolling 30 days)
CREATE MATERIALIZED VIEW trending_weekend_destinations AS
SELECT
  destination,
  COUNT(*) AS plan_count,
  AVG(total_cost) AS avg_cost,
  COUNT(DISTINCT user_id) AS unique_planners
FROM weekend_plans
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY destination
ORDER BY plan_count DESC;
```

---

## 5. NestJS Module Architecture

### 5.1 Module Dependency Graph

```
                        ┌──────────────┐
                        │  AppModule   │
                        └──────┬───────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
   ┌──────▼──────┐   ┌────────▼────────┐   ┌───────▼──────┐
   │ AiModule    │   │WeekendPlanner   │   │ RoutesModule │
   │ (existing)  │   │Module (NEW)     │──▶│ (existing)   │
   └──────┬──────┘   └────────┬────────┘   └───────┬──────┘
          │                    │                    │
          │           ┌────────┼────────┐           │
          │           │        │        │           │
          │   ┌───────▼──┐ ┌──▼────┐ ┌─▼────────┐  │
          │   │ Budget    │ │Route  │ │Meal      │  │
          │   │ Engine    │ │Optimi-│ │Planner   │  │
          │   │ Service   │ │zer    │ │Service   │  │
          │   └───────────┘ └───────┘ └──────────┘  │
          │                                         │
          └─────────────────┬───────────────────────┘
                            │
                    ┌───────▼──────┐
                    │ PlacesModule │
                    │ (existing)   │
                    └──────────────┘
```

### 5.2 File Structure

```
apps/api/src/modules/weekend-planner/
├── weekend-planner.module.ts
├── weekend-planner.controller.ts
├── weekend-planner.service.ts          # Orchestrator: coordinates all sub-services
├── services/
│   ├── plan-generator.service.ts       # AI generation (GPT-4o + Gemini + fallback)
│   ├── budget-engine.service.ts        # 8-category cost calculation
│   ├── route-optimizer.service.ts      # TSP solver + Google Directions
│   ├── meal-planner.service.ts         # Meal assignment with dietary filters
│   ├── hidden-gem.service.ts           # Hidden gem scoring algorithm
│   ├── photo-spot.service.ts           # Photography location identification
│   ├── weather.service.ts              # Weather forecast integration
│   ├── crowd-predictor.service.ts      # Crowd level estimation engine
│   ├── fallback-planner.service.ts     # Rule-based generator (100% availability)
│   └── plan-exporter.service.ts        # PDF + share card image generation
├── dto/
│   ├── create-weekend-plan.dto.ts
│   ├── update-weekend-plan.dto.ts
│   ├── optimize-plan.dto.ts
│   ├── weekend-plan-response.dto.ts
│   └── share-plan.dto.ts
├── interfaces/
│   ├── weekend-plan.interface.ts
│   ├── budget-breakdown.interface.ts
│   ├── route-segment.interface.ts
│   └── ai-plan-output.interface.ts
├── constants/
│   ├── malaysia-fuel-prices.ts
│   ├── malaysia-toll-rates.ts
│   ├── parking-rates.ts
│   ├── meal-cost-matrix.ts
│   └── attraction-ticket-prices.ts
└── tests/
    ├── weekend-planner.service.spec.ts
    ├── budget-engine.service.spec.ts
    ├── route-optimizer.service.spec.ts
    └── plan-generator.service.spec.ts
```

### 5.3 Service Responsibility Matrix

| Service | Responsibility | External Dependencies | Fallback |
|---|---|---|---|
| `WeekendPlannerService` | Full lifecycle orchestration: validate input → generate → enrich → optimize → persist → return | All internal services | — |
| `PlanGeneratorService` | Prompt assembly, GPT-4o API call, JSON parsing, Zod validation, business rule checks | OpenAI, Gemini | FallbackPlannerService |
| `BudgetEngineService` | 8 cost category calculations: fuel (distance × consumption × price), toll (route lookup), parking (city × hours), hotel (city × style × group), food (meals × pax × city matrix), tickets (attraction lookup), transport (Grab fare estimate), emergency buffer (12.5%) | Google Maps, price tables | Static price tables |
| `RouteOptimizerService` | TSP solving (nearest-neighbor + 2-opt), Google Distance Matrix for all stop pairs, traffic-aware ETAs, 3 strategy variants, parking-aware scoring | Google Distance Matrix API | Straight-line distance + average speed |
| `MealPlannerService` | Assigns breakfast/lunch/dinner/café/supper stops; enforces dietary constraints (halal, vegetarian); ensures cuisine variety; respects opening hours; balances spend across budget | Places DB, Place amenities | Random assignment from filtered pool |
| `HiddenGemService` | Scores places: low review count (10–50), high rating (> 4.3), local visitor ratio (> 60% local), low Instagram geotag count, reviewer sentiment analysis; returns top 2 per day | Places DB, Review analytics | Simple rating/reviewCount ratio |
| `PhotoSpotService` | Identifies photo-worthy locations: viewpoints, street art/murals, unique architecture, nature vistas, Instagram-worthy interiors; scores by photo-to-review ratio | Places DB, Social metadata | Category-based filter (VIEWPOINT, street art tags) |
| `WeatherService` | 3-day hourly forecast for destination coordinates; rain window detection; temperature range; UV index; suggests indoor alternatives during rain | Visual Crossing / OpenWeatherMap | Seasonal averages + skip rain logic |
| `CrowdPredictorService` | Crowd level: low/medium/high based on day-of-week, time-of-day, school holidays, public holidays, Ramadan month adjustments | Malaysian holiday calendar, Google Popular Times | Day-of-week heuristic only |
| `FallbackPlannerService` | Rule-based plan generation using local CityDB + Google Places Nearby; mirrors the existing `AiService.generateSmart()` pattern; 100% availability when all LLMs fail | Google Places API, internal CityDB | Static CityDB only |
| `PlanExporterService` | PDF generation with all 5 views; OG share card image (1200×630); email-friendly HTML version | Puppeteer / node-canvas | Simple text export |

### 5.4 Shared Package Types

New file: `packages/shared/src/weekend-planner.types.ts`

```typescript
import { z } from 'zod';

// ── Input Validation Schema ──
export const weekendPlanInputSchema = z.object({
  destination: z.string().min(2).max(255),
  destinationLat: z.number().min(-90).max(90),
  destinationLng: z.number().min(-180).max(180),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  planType: z.enum(['ONE_DAY', 'TWO_DAY', 'THREE_DAY', 'FULL_WEEKEND']),
  budget: z.number().positive().max(50000),
  budgetCurrency: z.string().length(3).default('MYR'),
  transportMode: z.enum(['DRIVING', 'GRAB', 'BUS', 'KTM', 'ETS', 'MOTORCYCLE', 'MIXED']),
  groupType: z.enum(['SOLO', 'COUPLE', 'FAMILY', 'FRIENDS']),
  travelStyles: z.array(z.enum(['ADVENTURE', 'LUXURY', 'BUDGET', 'NATURE', 'FOODIE', 'PHOTOGRAPHY', 'NIGHTLIFE'])).min(1),
  specialPreferences: z.array(z.enum(['PET_FRIENDLY', 'KID_FRIENDLY', 'WHEELCHAIR_FRIENDLY', 'HALAL_FOOD', 'VEGETARIAN'])).default([]),
  groupSize: z.number().int().min(1).max(20).default(1),
});

export type WeekendPlanInput = z.infer<typeof weekendPlanInputSchema>;

// ── Response Types ──
export interface WeekendPlanOutput {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  planType: string;
  budget: number;
  budgetCurrency: string;
  transportMode: string;
  groupType: string;
  travelStyles: string[];
  specialPreferences: string[];
  groupSize: number;
  totalCost: number;
  totalDistance: number;
  totalTravelTime: number;
  totalStops: number;
  hiddenGemCount: number;
  status: string;
  isPublic: boolean;
  shareToken?: string;
  days: WeekendDayOutput[];
  budgetBreakdown: BudgetBreakdownOutput;
  routes: RouteSummaryOutput[];
  tips: string[];
  weatherSummary: string;
  createdAt: string;
}

export interface WeekendDayOutput {
  id: string;
  dayNumber: number;
  date: string;
  theme: string;
  weather: {
    condition: string;
    tempMin: number;
    tempMax: number;
    rainChance: number;
  };
  stops: StopOutput[];
  dayTotalCost: number;
  dayTotalDistance: number;
  dayTotalTime: number;
}

export interface StopOutput {
  id: string;
  order: number;
  time: string;
  endTime: string;
  durationMinutes: number;
  placeName: string;
  placeId?: string;
  category: string;
  emoji: string;
  description: string;
  photoUrl?: string;
  rating?: number;
  entryFee: number;
  estimatedSpend: number;
  totalCost: number;
  currency: string;
  transportFromPrev: {
    mode: string;
    distanceMeters: number;
    durationMinutes: number;
    estimatedCost: number;
  };
  isHiddenGem: boolean;
  isPhotoSpot: boolean;
  isIndoor: boolean;
  crowdLevel: string;
  aiReasoning?: string;
  isLocked: boolean;
}

export interface BudgetBreakdownOutput {
  fuel: CostLineItem;
  toll: CostLineItem;
  parking: CostLineItem;
  hotel: CostLineItem & { suggestions: { name: string; price: number; rating: number }[] };
  food: CostLineItem & { mealCount: number; perPersonPerMeal: number };
  tickets: CostLineItem & { attractions: { name: string; price: number; quantity: number }[] };
  transport: CostLineItem & { segments: number };
  emergencyBuffer: CostLineItem & { percentage: number };
  total: number;
  currency: string;
  budgetUtilization: number;
  isWithinBudget: boolean;
}

export interface CostLineItem {
  estimatedCost: number;
  actualCost?: number;
  label: string;
  percentage: number;
}

export interface RouteSummaryOutput {
  dayNumber: number;
  totalDistance: number;
  totalDuration: number;
  totalDurationInTraffic: number;
  transportModes: { mode: string; distance: number; percentage: number }[];
  polyline: string;
}
```

---

## 6. API Design

### 6.1 REST Endpoints

All endpoints are prefixed with `/api/v1/weekend-planner`.

#### 6.1.1 Generate Plan

```
POST /api/v1/weekend-planner/generate

Description: Generate a complete weekend itinerary from 7 user inputs.
Response time target: < 8s p95. Returns 202 if queued for async completion.

Request Body: WeekendPlanInput (see Zod schema above)

Response 200:
{
  "data": { ...WeekendPlanOutput },
  "meta": {
    "generationTimeMs": 7200,
    "model": "gpt-4o",
    "tokensUsed": 1850,
    "placesAnalyzed": 2847,
    "routesEvaluated": 12,
    "requestId": "req_x7k9a2m3"
  }
}

Response 202 (async fallback for slow generations):
{
  "data": { "planId": "uuid", "status": "GENERATING" },
  "meta": { "estimatedCompletionMs": 15000, "pollUrl": "/api/v1/weekend-planner/uuid/status" }
}

Errors:
  400 - Invalid input (Zod validation errors returned)
  429 - Rate limit exceeded (10/min free, 30/min pro)
  500 - All generation tiers failed (retryable)
```

#### 6.1.2 Get Plan Status (for async generations)

```
GET /api/v1/weekend-planner/:planId/status

Response 200:
{
  "data": {
    "status": "GENERATING" | "COMPLETED" | "FAILED",
    "progress": 0.78,
    "currentStep": "Optimizing routes...",
    "plan": { ...WeekendPlanOutput }  // null if still generating
  }
}
```

#### 6.1.3 Get Plan

```
GET /api/v1/weekend-planner/:planId?include=days,stops,budget,routes

Description: Retrieve a saved weekend plan with configurable relation inclusion.

Response 200:
{ "data": { ...WeekendPlanOutput } }

Errors:
  404 - Plan not found
  403 - Plan is private and not owned by requester
```

#### 6.1.4 Get Plan by Share Token

```
GET /api/v1/weekend-planner/shared/:shareToken

Description: Public endpoint for shared plan links. No auth required.

Response 200:
{ "data": { ...WeekendPlanOutput } }

Errors:
  404 - Share token not found or plan was made private
```

#### 6.1.5 List User Plans

```
GET /api/v1/weekend-planner?status=PLANNED&page=1&limit=10&sort=createdAt&order=desc

Query Parameters:
  status    - PLANNED | ACTIVE | COMPLETED | DRAFT (optional)
  page      - Page number (default: 1)
  limit     - Items per page (default: 10, max: 50)
  sort      - createdAt | updatedAt | startDate | totalCost | popularity
  order     - asc | desc

Response 200:
{
  "data": [ { ...WeekendPlanOutput[] } ],
  "meta": { "page": 1, "limit": 10, "total": 24, "totalPages": 3 }
}
```

#### 6.1.6 Update Plan

```
PATCH /api/v1/weekend-planner/:planId

Description: Update plan metadata, lock/unlock stops, add user notes, adjust actual costs.
Inputs that would change the plan structure (destination, dates, budget) are rejected —
use Clone + Regenerate instead.

Request Body (all fields optional):
{
  "title": "Penang Anniversary Weekend",
  "isPublic": false,
  "days": [{
    "dayNumber": 1,
    "stops": [{
      "id": "stop-uuid",
      "isLocked": true,
      "userNote": "Must try the roti bakar here"
    }]
  }],
  "budgetItems": [{
    "category": "HOTEL",
    "actualCost": 280.00
  }]
}

Response 200:
{ "data": { ...WeekendPlanOutput } }
```

#### 6.1.7 Optimize Plan

```
POST /api/v1/weekend-planner/:planId/optimize

Description: Re-run route optimization with a different strategy.
Preserves locked stops in their current positions.

Request Body:
{
  "strategy": "FASTEST",         // FASTEST | CHEAPEST | SCENIC | BALANCED
  "factors": ["TRAFFIC", "WEATHER", "PARKING"],
  "lockedStopIds": ["uuid1", "uuid2"]
}

Response 200:
{
  "data": {
    "plan": { ...WeekendPlanOutput },
    "optimization": {
      "strategy": "FASTEST",
      "version": 2,
      "distanceSaved": 3200,
      "timeSaved": 45,
      "costSaved": 35.50,
      "reorderedStops": 5
    }
  }
}
```

#### 6.1.8 Save Plan

```
POST /api/v1/weekend-planner/:planId/save

Description: Promote a generated (DRAFT) plan to PLANNED status. Idempotent.

Request Body:
{
  "title": "Penang Weekend Adventure",
  "isPublic": false
}

Response 200:
{ "data": { "id": "uuid", "status": "PLANNED", "savedAt": "2026-06-15T10:30:00Z" } }
```

#### 6.1.9 Share Plan

```
POST /api/v1/weekend-planner/:planId/share

Description: Generate or regenerate a share token and OG image for social sharing.

Request Body:
{
  "isPublic": true,
  "platforms": ["WHATSAPP"]
}

Response 200:
{
  "data": {
    "shareToken": "x7k9a2m3",
    "shareUrl": "https://exploremy.ai/trip/x7k9a2m3",
    "ogImageUrl": "https://cdn.exploremy.ai/share-cards/x7k9a2m3.png",
    "shareText": "🍜 Penang Foodie Weekend · Jun 21–22 · MYR 847 · 14 stops · 8 hidden gems"
  }
}
```

#### 6.1.10 Clone Plan

```
POST /api/v1/weekend-planner/:planId/clone

Description: Create a copy of an existing plan. Optionally override inputs for regeneration.

Request Body:
{
  "overrideInputs": {
    "budget": 1000,
    "transportMode": "DRIVING"
  }
}

Response 200:
{ "data": { ...WeekendPlanOutput } }
```

#### 6.1.11 Regenerate Day

```
POST /api/v1/weekend-planner/:planId/days/:dayNumber/regenerate

Description: Regenerate a single day while keeping other days intact.

Request Body:
{
  "lockedStopIds": ["uuid1"],
  "vibeAdjustment": "MORE_ADVENTUROUS"
}

Response 200:
{ "data": { "day": { ...WeekendDayOutput } } }
```

#### 6.1.12 Get Budget Breakdown

```
GET /api/v1/weekend-planner/:planId/budget

Response 200:
{ "data": { ...BudgetBreakdownOutput } }
```

#### 6.1.13 Export Plan

```
GET /api/v1/weekend-planner/:planId/export?format=PDF

Description: Generate and download a formatted PDF of the complete plan.

Response 200: Binary PDF
Content-Type: application/pdf
Content-Disposition: attachment; filename="penang-weekend-20260621.pdf"
```

#### 6.1.14 Delete Plan

```
DELETE /api/v1/weekend-planner/:planId

Response 204: No Content

Errors:
  404 - Plan not found
  403 - Not the plan owner
```

#### 6.1.15 Submit Feedback

```
POST /api/v1/weekend-planner/:planId/feedback

Description: Post-trip feedback to improve future AI generations.

Request Body:
{
  "overallRating": 4,
  "stopFeedback": [
    { "stopId": "uuid1", "rating": 5, "comment": "Perfect breakfast spot" },
    { "stopId": "uuid2", "rating": 2, "comment": "Closed when we arrived", "isInaccurate": true }
  ],
  "budgetAccuracy": "WITHIN_10_PCT",
  "wouldUseAgain": true
}

Response 200:
{ "data": { "acknowledged": true } }
```

### 6.2 NestJS Controller Implementation

```typescript
// weekend-planner.controller.ts
import { Controller, Get, Post, Patch, Delete, Param, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { WeekendPlannerService } from './weekend-planner.service';
import { CreateWeekendPlanDto } from './dto/create-weekend-plan.dto';
import { UpdateWeekendPlanDto } from './dto/update-weekend-plan.dto';
import { OptimizePlanDto } from './dto/optimize-plan.dto';

@ApiTags('Weekend Planner')
@Controller('weekend-planner')
export class WeekendPlannerController {
  constructor(private readonly weekendPlannerService: WeekendPlannerService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate a complete weekend itinerary' })
  @ApiResponse({ status: 200, description: 'Plan generated successfully' })
  @ApiResponse({ status: 202, description: 'Plan queued for async generation' })
  async generate(@Body() dto: CreateWeekendPlanDto) {
    return this.weekendPlannerService.generate(dto);
  }

  @Get(':planId')
  @ApiOperation({ summary: 'Retrieve a weekend plan by ID' })
  async getPlan(@Param('planId') planId: string, @Query('include') include?: string) {
    return this.weekendPlannerService.findById(planId, include?.split(',') ?? []);
  }

  @Get('shared/:shareToken')
  @ApiOperation({ summary: 'Get a shared plan by token (no auth required)' })
  async getSharedPlan(@Param('shareToken') shareToken: string) {
    return this.weekendPlannerService.findByShareToken(shareToken);
  }

  @Get()
  @ApiOperation({ summary: 'List user weekend plans' })
  async listPlans(
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sort') sort?: string,
    @Query('order') order?: 'asc' | 'desc',
  ) {
    return this.weekendPlannerService.list({ status, page, limit, sort, order });
  }

  @Patch(':planId')
  @ApiOperation({ summary: 'Update plan metadata, lock stops, add notes' })
  async update(@Param('planId') planId: string, @Body() dto: UpdateWeekendPlanDto) {
    return this.weekendPlannerService.update(planId, dto);
  }

  @Post(':planId/optimize')
  @ApiOperation({ summary: 'Re-optimize route with different strategy' })
  async optimize(@Param('planId') planId: string, @Body() dto: OptimizePlanDto) {
    return this.weekendPlannerService.optimize(planId, dto);
  }

  @Post(':planId/save')
  @ApiOperation({ summary: 'Promote draft plan to PLANNED status' })
  async save(@Param('planId') planId: string, @Body() body: { title: string; isPublic: boolean }) {
    return this.weekendPlannerService.save(planId, body);
  }

  @Post(':planId/share')
  @ApiOperation({ summary: 'Generate share token and OG image' })
  async share(@Param('planId') planId: string, @Body() body: { isPublic: boolean; platforms?: string[] }) {
    return this.weekendPlannerService.share(planId, body);
  }

  @Post(':planId/clone')
  @ApiOperation({ summary: 'Clone an existing plan' })
  async clone(@Param('planId') planId: string, @Body() body: { overrideInputs?: Partial<CreateWeekendPlanDto> }) {
    return this.weekendPlannerService.clone(planId, body);
  }

  @Post(':planId/days/:dayNumber/regenerate')
  @ApiOperation({ summary: 'Regenerate a single day' })
  async regenerateDay(
    @Param('planId') planId: string,
    @Param('dayNumber') dayNumber: number,
    @Body() body: { lockedStopIds?: string[]; vibeAdjustment?: string },
  ) {
    return this.weekendPlannerService.regenerateDay(planId, dayNumber, body);
  }

  @Get(':planId/budget')
  @ApiOperation({ summary: 'Get detailed budget breakdown' })
  async getBudget(@Param('planId') planId: string) {
    return this.weekendPlannerService.getBudget(planId);
  }

  @Get(':planId/export')
  @ApiOperation({ summary: 'Export plan as PDF' })
  async export(@Param('planId') planId: string, @Query('format') format: string) {
    return this.weekendPlannerService.export(planId, format);
  }

  @Delete(':planId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a weekend plan' })
  async delete(@Param('planId') planId: string) {
    await this.weekendPlannerService.delete(planId);
  }

  @Post(':planId/feedback')
  @ApiOperation({ summary: 'Submit post-trip feedback' })
  async feedback(@Param('planId') planId: string, @Body() body: any) {
    return this.weekendPlannerService.submitFeedback(planId, body);
  }
}
```

---

## 7. AI Workflow & Prompt Engineering

### 7.1 End-to-End Generation Pipeline

```
TIME  STEP  DESCRIPTION
────  ────  ──────────────────────────────────────────────────
0ms   1     User submits form. Zod validates input (client + server).
50ms  2     Fetch Places from DB (PostGIS proximity query: 15km radius,
            apply dietary/special-preference filters, sort by hidden
            gem score + rating). Limit to top 50.
200ms 3     Fetch 3-day weather forecast for destination coordinates.
300ms 4     Fetch traffic summary for destination (current + weekend
            patterns from Google Maps).
400ms 5     Assemble context-rich prompt (weather, places, traffic,
            user preferences, budget guidelines, Malaysian-specific
            pricing). ~3000 tokens.
450ms 6     Call GPT-4o with JSON mode + max_tokens=4000.
            Temperature 0.7 for creativity, response_format=json_object.
            Timeout: 8000ms.
5000ms 7    Receive structured JSON. Parse + validate with Zod schema.
            Run business rule checks (halal compliance, budget, hidden
            gems minimum, transport realism).
5200ms 8    Enrich: resolve place names to Place DB IDs. Call Google
            Distance Matrix for all stop pairs. Calculate precise
            costs via BudgetEngine.
6500ms 9    Run RouteOptimizer TSP solver for each day. Generate
            optimized stop order and route polylines.
7200ms 10   Persist full plan graph (WeekendPlan → Days → Stops →
            Budgets → Routes → Recommendations) in single Prisma
            transaction.
7500ms 11   Return complete WeekendPlanOutput to client. Render
            timeline view immediately; lazy-load map tiles.
```

### 7.2 Master Prompt Template

The prompt is the most critical asset. It must produce structured, validated, Malaysia-aware output every time.

```typescript
function buildWeekendPlanPrompt(
  input: WeekendPlanInput,
  context: {
    places: PlaceContext[];
    weather: WeatherContext;
    traffic: TrafficContext;
    userPreferences: UserPreferencesContext;
  }
): string {
  return `You are ExploreMY AI, Malaysia's expert weekend trip planner. Generate a COMPLETE weekend itinerary.

## USER REQUEST
- Destination: ${input.destination} (${input.destinationLat}, ${input.destinationLng})
- Dates: ${input.startDate} to ${input.endDate} (${input.planType})
- Budget: ${input.budget} ${input.budgetCurrency}
- Transport: ${input.transportMode}
- Group: ${input.groupType}, ${input.groupSize} ${input.groupSize === 1 ? 'person' : 'people'}
- Style: ${input.travelStyles.join(', ')}
- Preferences: ${input.specialPreferences.length > 0 ? input.specialPreferences.join(', ') : 'None'}

## WEATHER FORECAST
${context.weather.daily.map(d =>
  `${d.date}: ${d.condition}, ${d.tempMin}°C–${d.tempMax}°C, ${d.rainChance}% rain chance. Rain likely: ${d.rainHours}`
).join('\n')}

## TRAFFIC PATTERNS
${context.traffic.summary}

## AVAILABLE PLACES (${context.places.length} places analyzed, sorted by quality)
${context.places.map(p =>
  `[${p.id}] ${p.name} | ${p.category} | ⭐${p.rating} (${p.reviewCount} reviews) | 💰${p.priceLevel}/4 ` +
  `${p.isHiddenGem ? '💎 HIDDEN GEM ' : ''}${p.isPhotoSpot ? '📸 PHOTO SPOT ' : ''}` +
  `${p.isHalal ? '✅ HALAL ' : ''}${p.isVegetarian ? '✅ VEG ' : ''}` +
  `${p.isIndoor ? '🏠 Indoor' : '🌳 Outdoor'} | 🕐 ${p.openingHours || 'Unknown'}`
).join('\n')}

## DIETARY CONSTRAINTS
${input.specialPreferences.includes('HALAL_FOOD')
  ? '- ALL meals MUST be halal-certified or Muslim-owned. NO pork, NO alcohol at meal stops. Prefer places marked ✅ HALAL.'
  : ''}
${input.specialPreferences.includes('VEGETARIAN')
  ? '- ALL meals MUST be vegetarian-friendly. Prefer Indian vegetarian, Buddhist vegetarian, or vegan cafes.'
  : ''}

## BUDGET ALLOCATION
- Hotel: 25–35% · Food: 20–25% · Transport: 15–20% · Tickets: 8–12%
- Fuel/Toll: 5–10% (driving only) · Parking: 2–4% (driving only)
- Emergency buffer: 12–15% of subtotal

## CRITICAL RULES (violations = plan rejection)
1. 6–8 stops per day: breakfast, morning activity, lunch, afternoon activity, café, dinner, night activity
2. Reference ONLY places from the AVAILABLE PLACES list above (use exact [ID] and name)
3. At least 2 💎 HIDDEN GEMs per day
4. At least 1 📸 PHOTO SPOT per day
5. Rain probability > 60% → prefer 🏠 Indoor stops during rain hours
6. No two consecutive meals of same cuisine
7. Total cost MUST stay within budget (${input.budget} ${input.budgetCurrency})
8. Transport mode must be realistic: Walk ≤ 1.5 km, Grab/Drive for longer
9. Opening hours MUST be respected
10. Duration: meals 45–90 min, attractions 60–120 min, cafés 30–60 min, photo spots 15–30 min
11. FAMILY group → kid-friendly, no stops past 9 PM
12. COUPLE group → romantic viewpoints, nice dinner spots
13. All costs in ${input.budgetCurrency}
14. Include creative daily themes

## OUTPUT FORMAT
Return ONLY valid JSON (no markdown, no explanation):

{
  "title": "Creative, specific title",
  "days": [{
    "dayNumber": 1,
    "theme": "Day theme (e.g. 'Georgetown Heritage Trail')",
    "weatherNote": "Brief weather guidance",
    "stops": [{
      "order": 1,
      "time": "07:30",
      "endTime": "08:30",
      "durationMinutes": 60,
      "placeId": "[USE EXACT ID FROM LIST]",
      "placeName": "Exact name from list",
      "category": "BREAKFAST",
      "emoji": "🍜",
      "description": "One sentence on what makes this special for this user",
      "estimatedSpend": 15.00,
      "entryFee": 0,
      "isHiddenGem": false,
      "isPhotoSpot": false,
      "isIndoor": false,
      "crowdLevel": "medium",
      "aiReasoning": "Why this stop — reference user preferences, weather, timing",
      "transportFromPrev": {
        "mode": "WALKING",
        "distanceMeters": 400,
        "durationMinutes": 5,
        "estimatedCost": 0
      }
    }]
  }],
  "budgetBreakdown": {
    "hotel": { "estimatedCost": 0, "suggestion": "Hotel name", "suggestionRating": 4.5 },
    "food": { "estimatedCost": 0, "mealCount": 0 },
    "transport": { "estimatedCost": 0, "primaryMode": "${input.transportMode}" },
    "tickets": { "estimatedCost": 0, "attractions": [] },
    "fuel": { "estimatedCost": 0, "totalDistanceKm": 0 },
    "toll": { "estimatedCost": 0, "tollRoutes": [] },
    "parking": { "estimatedCost": 0, "parkingSpots": 0 },
    "emergencyBuffer": { "estimatedCost": 0, "percentage": 12.5 },
    "total": 0
  },
  "tips": ["3–5 specific, actionable tips for THIS plan in THIS destination"]
}`;
}
```

### 7.3 Model Selection & Fallback Strategy

```typescript
// In PlanGeneratorService
async generatePlan(input: WeekendPlanInput, context: PlanContext): Promise<AIWeekendPlanOutput> {
  const prompt = buildWeekendPlanPrompt(input, context);
  const startTime = Date.now();

  // Tier 1: GPT-4o (best quality, 4–7 seconds)
  try {
    const result = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    }, { timeout: 8000 });

    const parsed = this.parseAndValidate(result.choices[0]?.message?.content);
    if (parsed) {
      this.metrics.recordGeneration('gpt-4o', Date.now() - startTime, true);
      return parsed;
    }
  } catch (err) {
    this.logger.warn('GPT-4o generation failed, falling back to Gemini', err);
  }

  // Tier 2: Gemini 2.5 Flash (faster, 2–4 seconds)
  try {
    const result = await this.gemini.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 4000 },
    }, { timeout: 6000 });

    const parsed = this.parseAndValidate(result.response.text());
    if (parsed) {
      this.metrics.recordGeneration('gemini-2.5-flash', Date.now() - startTime, true);
      return parsed;
    }
  } catch (err) {
    this.logger.warn('Gemini generation failed, falling back to rule-based engine', err);
  }

  // Tier 3: Rule-based engine (guaranteed, 1–3 seconds)
  const plan = await this.fallbackPlanner.generate(input, context);
  this.metrics.recordGeneration('rule-based', Date.now() - startTime, true);
  return plan;
}
```

### 7.4 AI Output Validation

```typescript
// Zod schema for strict validation
const aiWeekendPlanSchema = z.object({
  title: z.string().min(5).max(255),
  days: z.array(z.object({
    dayNumber: z.number().int().min(1).max(3),
    theme: z.string().min(3),
    weatherNote: z.string(),
    stops: z.array(z.object({
      order: z.number().int().min(1),
      time: z.string().regex(/^\d{2}:\d{2}$/),
      endTime: z.string().regex(/^\d{2}:\d{2}$/),
      durationMinutes: z.number().int().positive(),
      placeId: z.string(),  // Must match a place in our context
      placeName: z.string().min(1),
      category: z.enum([
        'BREAKFAST','BRUNCH','LUNCH','CAFE_STOP','DINNER','SUPPER',
        'TOURIST_ATTRACTION','HIDDEN_GEM','PHOTO_SPOT','NIGHT_ACTIVITY','SHOPPING','NATURE'
      ]),
      emoji: z.string(),
      description: z.string().min(10).max(200),
      estimatedSpend: z.number().min(0),
      entryFee: z.number().min(0),
      isHiddenGem: z.boolean(),
      isPhotoSpot: z.boolean(),
      isIndoor: z.boolean(),
      crowdLevel: z.enum(['low','medium','high']),
      aiReasoning: z.string(),
      transportFromPrev: z.object({
        mode: z.enum(['WALKING','DRIVING','GRAB','BUS','KTM','ETS','BICYCLE','MOTORCYCLE']),
        distanceMeters: z.number().min(0),
        durationMinutes: z.number().min(0),
        estimatedCost: z.number().min(0),
      }),
    })).min(4).max(10),
  })).min(1).max(3),
  budgetBreakdown: z.object({
    hotel: z.object({ estimatedCost: z.number(), suggestion: z.string(), suggestionRating: z.number() }),
    food: z.object({ estimatedCost: z.number(), mealCount: z.number() }),
    transport: z.object({ estimatedCost: z.number(), primaryMode: z.string() }),
    tickets: z.object({ estimatedCost: z.number(), attractions: z.array(z.object({ name: z.string(), price: z.number() })) }),
    fuel: z.object({ estimatedCost: z.number(), totalDistanceKm: z.number() }),
    toll: z.object({ estimatedCost: z.number(), tollRoutes: z.array(z.string()) }),
    parking: z.object({ estimatedCost: z.number(), parkingSpots: z.number() }),
    emergencyBuffer: z.object({ estimatedCost: z.number(), percentage: z.number() }),
    total: z.number().positive(),
  }),
  tips: z.array(z.string()).min(2).max(6),
});

// Business rule validation (post-Zod)
function validateBusinessRules(plan: AIWeekendPlanOutput, context: PlanContext): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Budget check (±5% tolerance)
  if (plan.budgetBreakdown.total > context.input.budget * 1.05) {
    errors.push(`Over budget: ${plan.budgetBreakdown.total} > ${context.input.budget}`);
  }

  // Hidden gem minimum
  const hiddenGems = plan.days.flatMap(d => d.stops.filter(s => s.isHiddenGem));
  if (hiddenGems.length < plan.days.length * 2) {
    errors.push(`Need ${plan.days.length * 2} hidden gems, got ${hiddenGems.length}`);
  }

  // Photo spot minimum
  const photoSpots = plan.days.flatMap(d => d.stops.filter(s => s.isPhotoSpot));
  if (photoSpots.length < plan.days.length) {
    errors.push(`Need ${plan.days.length} photo spots, got ${photoSpots.length}`);
  }

  // Halal compliance
  if (context.input.specialPreferences.includes('HALAL_FOOD')) {
    const foodStops = plan.days.flatMap(d =>
      d.stops.filter(s => ['BREAKFAST','LUNCH','DINNER','CAFE_STOP','SUPPER'].includes(s.category))
    );
    for (const stop of foodStops) {
      const dbPlace = context.places.find(p => p.id === stop.placeId);
      if (dbPlace && !dbPlace.isHalal) {
        errors.push(`${stop.placeName} is not halal-certified`);
      }
    }
  }

  // Transport realism
  for (const day of plan.days) {
    for (const stop of day.stops) {
      if (stop.transportFromPrev.mode === 'WALKING' && stop.transportFromPrev.distanceMeters > 2000) {
        errors.push(`Walking ${stop.transportFromPrev.distanceMeters}m from ${stop.placeName} is unrealistic`);
      }
    }
  }

  // No duplicate stops within a day
  for (const day of plan.days) {
    const names = day.stops.map(s => s.placeName);
    const dups = names.filter((n, i) => names.indexOf(n) !== i);
    if (dups.length) errors.push(`Duplicate stops in Day ${day.dayNumber}: ${[...new Set(dups)].join(', ')}`);
  }

  // Place ID validation: all referenced placeIds must exist in context
  const allPlaceIds = plan.days.flatMap(d => d.stops.map(s => s.placeId));
  const contextPlaceIds = new Set(context.places.map(p => p.id));
  for (const pid of allPlaceIds) {
    if (!contextPlaceIds.has(pid)) {
      errors.push(`Place ID ${pid} not found in provided context`);
    }
  }

  return { valid: errors.length === 0, errors };
}
```

---

## 8. Route Optimization Engine

### 8.1 Algorithm

The route optimizer solves a Time-Windowed TSP (Traveling Salesman Problem) for each day independently.

```
ALGORITHM: Multi-Objective TSP with Time Windows

INPUT:
  S = {s₁, s₂, ..., sₙ}  — day's stops
  O = origin (hotel coordinates)
  strategy ∈ {FASTEST, CHEAPEST, SCENIC, BALANCED}
  lockedStops ⊆ S        — stops that cannot be reordered

STEP 1 — Distance Matrix Construction
  for each pair (sᵢ, sⱼ) in S:
    call Google Distance Matrix API:
      origins: sᵢ.lat, sᵢ.lng
      destinations: sⱼ.lat, sⱼ.lng
      mode: driving | walking (auto-select: walk if < 1.5 km)
      departureTime: estimated departure from sᵢ
      trafficModel: best_guess
    → store (distanceMeters, durationSeconds, durationInTrafficSeconds)

STEP 2 — Cost Function
  cost(sᵢ → sⱼ, mode, strategy) =
    w₁ × travelTime(sᵢ, sⱼ, mode)      [normalized 0..1]
    + w₂ × monetaryCost(sᵢ, sⱼ, mode)  [normalized 0..1]
    + w₃ × (1 − scenicScore(sⱼ))        [normalized 0..1]
    + rainPenalty(sⱼ, weather)
    + crowdPenalty(sⱼ)
    + openingPenalty(sⱼ, arrivalTime)

  Strategy weights (w₁, w₂, w₃):
    FASTEST:  (1.0, 0.0, 0.0)
    CHEAPEST: (0.0, 1.0, 0.0)
    SCENIC:   (0.3, 0.2, 1.0)
    BALANCED: (0.5, 0.5, 0.3)

STEP 3 — Penalty Functions
  rainPenalty(s) = s.isOutdoor ∧ rainChance(s.time) > 60% ? 10⁶ : 0
  crowdPenalty(s) = s.crowdLevel = 'high' ? 500 : 'medium' ? 200 : 0
  openingPenalty(s, t) = t ∉ s.openingHours ? 10⁹ : 0

STEP 4 — Solve
  If n ≤ 10:
    enumerate all n! permutations (brute force, < 3.6M for n=10)
    return lowest-cost permutation respecting locked stops

  If n > 10:
    nearest-neighbor greedy (seeded from origin) + 2-opt local search:
      a) start from origin
      b) repeatedly add nearest (by strategy-weighted cost) unvisited stop
      c) apply 2-opt swaps: for each pair (i,j), reverse segment i..j if it reduces cost
      d) repeat until no improvement
      e) run 5 random restarts with different initializations, keep best

STEP 5 — Output
  return {
    order: [s₃, s₁, s₇, s₂, ...],    // optimized stop order
    totalDistance, totalTime, totalCost,
    segments: [                         // per-segment data
      { from: O, to: s₃, polyline, distance, duration, cost },
      { from: s₃, to: s₁, ... },
      ...
    ]
  }
```

### 8.2 Google Maps Integration

```typescript
interface RouteOptimizer {
  // Build full distance matrix for N stops (N² API calls — but efficient via Distance Matrix API which handles multiple origins/destinations)
  buildDistanceMatrix(
    stops: Stop[],
    origin: { lat: number; lng: number },
    transportMode: TransportMode,
    departureTime: Date
  ): Promise<DistanceMatrixEntry[][]>;

  // Get detailed route with polyline
  getRouteSegment(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
    mode: TransportMode,
    departureTime: Date
  ): Promise<RouteSegment>;

  // Core TSP solver
  optimizeStopOrder(
    stops: Stop[],
    matrix: DistanceMatrixEntry[][],
    strategy: OptimizationStrategy,
    lockedStopIndices: number[]
  ): OptimizedRoute;

  // Fuel cost: distance × consumption(L/100km) × fuel price(RM/L)
  calculateFuelCost(distanceMeters: number, vehicleType: VehicleType): number;

  // Toll cost: match route polyline against Malaysian toll highway database
  calculateTollCost(route: RouteSegment): { total: number; tolls: TollInfo[] };

  // Grab fare: base fare + per-km rate + per-minute rate + surge multiplier
  estimateGrabFare(distanceMeters: number, durationSeconds: number, timeOfDay: TimeOfDay): number;
}
```

### 8.3 Malaysian Constants

```typescript
// Fuel prices (Malaysia, updated weekly via cron job)
export const FUEL_PRICES_MYR = {
  RON95: 2.05,      // subsidized
  RON97: 3.47,      // market price
  DIESEL_EURO5: 2.15,
};

// Average fuel consumption (L per 100km)
export const FUEL_CONSUMPTION = {
  car_compact: 6.5,
  car_midsize: 8.0,
  car_suv: 10.5,
  car_mpv: 11.0,    // common family vehicle in Malaysia
  motorcycle: 3.0,
};

// Key toll highways
export const TOLL_RATES: Record<string, { name: string; segments: Record<string, number> }> = {
  PLUS_NORTH: {
    name: 'PLUS North-South Expressway (North)',
    segments: {
      'KL→Ipoh': 28.80, 'Ipoh→Penang': 20.80, 'KL→Penang': 49.60,
      'Penang_Bridge': 7.00, 'KL→Tapah': 19.50,
    },
  },
  PLUS_SOUTH: {
    name: 'PLUS North-South Expressway (South)',
    segments: {
      'KL→Melaka': 19.50, 'KL→JB': 37.20, 'Melaka→JB': 17.70,
    },
  },
  LPT: {
    name: 'East Coast Expressway (LPT)',
    segments: { 'KL→Kuantan': 25.50, 'KL→KT': 47.80 },
  },
  NKVE: { name: 'NKVE', segments: { 'KL→Klang': 8.50 } },
  KESAS: { name: 'KESAS', segments: { 'KL→ShahAlam': 4.50 } },
};

// Parking rates (MYR per hour)
export const PARKING_RATES: Record<string, { min: number; max: number; flatDay?: number }> = {
  'Kuala Lumpur':    { min: 3.00, max: 15.00, flatDay: 25.00 },
  'Penang':          { min: 2.00, max: 8.00,  flatDay: 12.00 },
  'Johor Bahru':     { min: 2.00, max: 8.00,  flatDay: 15.00 },
  'Melaka':          { min: 1.50, max: 6.00,  flatDay: 8.00  },
  'Ipoh':            { min: 1.00, max: 5.00,  flatDay: 8.00  },
  'Kota Kinabalu':   { min: 2.00, max: 8.00,  flatDay: 12.00 },
  'Langkawi':        { min: 1.00, max: 4.00,  flatDay: 6.00  },
  'Cameron Highlands': { min: 1.00, max: 4.00, flatDay: 5.00  },
  'default':         { min: 2.00, max: 8.00,  flatDay: 12.00 },
};
```

---

## 9. Cost Calculation Engine

### 9.1 Full Cost Model

```typescript
// BudgetEngineService — core cost model
interface FullCostBreakdown {
  fuel: FuelBreakdown;
  toll: TollBreakdown;
  parking: ParkingBreakdown;
  hotel: HotelBreakdown;
  food: FoodBreakdown;
  tickets: TicketBreakdown;
  transport: TransportBreakdown;
  emergencyBuffer: EmergencyBufferBreakdown;
  subtotal: number;
  grandTotal: number;
  budgetUtilization: number;  // 0.0 to 1.0+
  isWithinBudget: boolean;
}

interface FuelBreakdown {
  totalDistanceKm: number;
  fuelType: 'RON95' | 'RON97' | 'DIESEL';
  pricePerLiter: number;
  consumptionLPer100km: number;
  litersUsed: number;
  totalCost: number;
}

interface HotelBreakdown {
  suggestedHotels: { name: string; pricePerNight: number; rating: number; bookingUrl?: string }[];
  nightsCount: number;
  estimatedCost: number;
  perNightAverage: number;
}
```

### 9.2 Meal Cost Matrix (MYR per person)

```typescript
const MEAL_COST_MATRIX: Record<string, Record<string, { min: number; max: number; typical: number }>> = {
  'Kuala Lumpur': {
    breakfast: { min: 5, max: 25, typical: 12 },
    lunch:     { min: 8, max: 35, typical: 18 },
    dinner:    { min: 15, max: 80, typical: 30 },
    cafe:      { min: 10, max: 25, typical: 15 },
    supper:    { min: 8, max: 25, typical: 12 },
  },
  'Penang': {
    breakfast: { min: 4, max: 15, typical: 8 },
    lunch:     { min: 6, max: 25, typical: 12 },
    dinner:    { min: 10, max: 50, typical: 20 },
    cafe:      { min: 8, max: 20, typical: 12 },
    supper:    { min: 6, max: 20, typical: 10 },
  },
  'Langkawi': {
    breakfast: { min: 5, max: 20, typical: 10 },
    lunch:     { min: 8, max: 30, typical: 15 },
    dinner:    { min: 12, max: 60, typical: 25 },
    cafe:      { min: 8, max: 22, typical: 14 },
    supper:    { min: 8, max: 25, typical: 12 },
  },
  'Cameron Highlands': {
    breakfast: { min: 4, max: 12, typical: 7 },
    lunch:     { min: 6, max: 20, typical: 10 },
    dinner:    { min: 10, max: 35, typical: 18 },
    cafe:      { min: 6, max: 18, typical: 10 },
    supper:    { min: 5, max: 15, typical: 8 },
  },
  'default': {
    breakfast: { min: 5, max: 20, typical: 10 },
    lunch:     { min: 8, max: 30, typical: 15 },
    dinner:    { min: 12, max: 60, typical: 25 },
    cafe:      { min: 8, max: 22, typical: 14 },
    supper:    { min: 8, max: 25, typical: 12 },
  },
};
```

### 9.3 Hotel Cost Matrix (MYR per night)

```typescript
const HOTEL_COST_MATRIX: Record<string, Record<string, { budget: number; midRange: number; luxury: number }>> = {
  'Penang': {
    solo:    { budget: 60,  midRange: 150, luxury: 350 },
    couple:  { budget: 80,  midRange: 200, luxury: 450 },
    family:  { budget: 120, midRange: 280, luxury: 600 },
    friends: { budget: 100, midRange: 250, luxury: 500 },
  },
  'Kuala Lumpur': {
    solo:    { budget: 70,  midRange: 180, luxury: 500 },
    couple:  { budget: 90,  midRange: 250, luxury: 650 },
    family:  { budget: 140, midRange: 350, luxury: 800 },
    friends: { budget: 120, midRange: 300, luxury: 700 },
  },
  'Langkawi': {
    solo:    { budget: 50,  midRange: 150, luxury: 400 },
    couple:  { budget: 80,  midRange: 200, luxury: 500 },
    family:  { budget: 120, midRange: 300, luxury: 700 },
    friends: { budget: 100, midRange: 250, luxury: 600 },
  },
  'Cameron Highlands': {
    solo:    { budget: 40,  midRange: 100, luxury: 250 },
    couple:  { budget: 60,  midRange: 150, luxury: 350 },
    family:  { budget: 100, midRange: 220, luxury: 450 },
    friends: { budget: 80,  midRange: 180, luxury: 400 },
  },
  'Melaka': {
    solo:    { budget: 50,  midRange: 120, luxury: 280 },
    couple:  { budget: 70,  midRange: 180, luxury: 380 },
    family:  { budget: 100, midRange: 250, luxury: 500 },
    friends: { budget: 90,  midRange: 200, luxury: 450 },
  },
  'Johor Bahru': {
    solo:    { budget: 60,  midRange: 140, luxury: 300 },
    couple:  { budget: 80,  midRange: 200, luxury: 400 },
    family:  { budget: 120, midRange: 280, luxury: 550 },
    friends: { budget: 100, midRange: 240, luxury: 480 },
  },
  'default': {
    solo:    { budget: 60,  midRange: 150, luxury: 350 },
    couple:  { budget: 80,  midRange: 200, luxury: 450 },
    family:  { budget: 120, midRange: 280, luxury: 600 },
    friends: { budget: 100, midRange: 240, luxury: 500 },
  },
};
```

### 9.4 Budget Engine Implementation Flow

```typescript
@Injectable()
export class BudgetEngineService {
  calculate(input: WeekendPlanInput, plan: AIWeekendPlanOutput): FullCostBreakdown {
    const city = this.normalizeCity(input.destination);
    const styleTier = input.travelStyles.includes('LUXURY') ? 'luxury' :
                      input.travelStyles.includes('BUDGET') ? 'budget' : 'midRange';

    // 1. Calculate fuel cost (only for DRIVING / MOTORCYCLE)
    const fuel = input.transportMode === 'DRIVING' || input.transportMode === 'MOTORCYCLE'
      ? this.calculateFuel(plan.summary.totalDistanceKm, input.transportMode)
      : this.zeroFuel();

    // 2. Calculate toll costs from route analysis
    const toll = input.transportMode === 'DRIVING'
      ? this.calculateTolls(input.destination, plan.routes)
      : this.zeroToll();

    // 3. Calculate parking costs per stop
    const parking = input.transportMode === 'DRIVING'
      ? this.calculateParking(city, plan.days)
      : this.zeroParking();

    // 4. Hotel cost estimate
    const hotel = this.calculateHotel(city, input.groupType, styleTier, plan.days.length - 1);

    // 5. Food cost from meal matrix × person count × style tier
    const food = this.calculateFood(city, plan.days, input.groupSize, input.travelStyles);

    // 6. Sum ticket costs from plan
    const tickets = this.sumTickets(plan.days, input.groupSize);

    // 7. Transport (Grab/Bus/KTM/ETS)
    const transport = input.transportMode === 'GRAB'
      ? this.calculateGrabCosts(plan.days)
      : input.transportMode === 'BUS' || input.transportMode === 'KTM' || input.transportMode === 'ETS'
        ? this.calculateTransitCosts(plan.days, input.transportMode)
        : this.zeroTransport();

    // 8. Emergency buffer (12.5% of subtotal)
    const subtotal = fuel.totalCost + toll.totalCost + parking.totalCost +
                     hotel.estimatedCost + food.totalCost + tickets.totalCost + transport.totalCost;
    const emergencyBuffer = {
      percentage: 12.5,
      amount: Math.round(subtotal * 0.125 * 100) / 100,
    };

    const grandTotal = subtotal + emergencyBuffer.amount;

    return {
      fuel, toll, parking, hotel, food, tickets, transport, emergencyBuffer,
      subtotal, grandTotal,
      budgetUtilization: grandTotal / input.budget,
      isWithinBudget: grandTotal <= input.budget,
    };
  }

  private calculateFuel(totalKm: number, mode: string): FuelBreakdown {
    const vehicleType = mode === 'MOTORCYCLE' ? 'motorcycle' : 'car_midsize';
    const consumption = FUEL_CONSUMPTION[vehicleType];
    const liters = (totalKm / 100) * consumption;
    const pricePerLiter = FUEL_PRICES_MYR.RON95;
    return {
      totalDistanceKm: Math.round(totalKm * 10) / 10,
      fuelType: 'RON95',
      pricePerLiter,
      consumptionLPer100km: consumption,
      litersUsed: Math.round(liters * 10) / 10,
      totalCost: Math.round(liters * pricePerLiter * 100) / 100,
    };
  }
}
```

---

## 10. Implementation Roadmap

### 10.1 Phase 1: Core MVP (Weeks 1–3)

**Goal:** Generate a complete weekend plan with timeline view, budget breakdown, and save functionality.

| Week | Backend | Frontend | Database |
|---|---|---|---|
| **Week 1** | NestJS module scaffold. `WeekendPlannerService` + controller skeleton. DTOs + Zod validation. Shared package types. | Input form screen (7 parameters). `react-hook-form` + `zod` client-side validation. | Prisma schema migration (5 models + 8 enums). Migration applied to dev. |
| **Week 2** | `PlanGeneratorService` with GPT-4o integration. `FallbackPlannerService` (extend existing rule-based engine). `BudgetEngineService` with all 8 cost categories. `MealPlannerService` with halal/vegetarian filters. | Generation loading state with progress steps. Timeline view (vertical scrollable list). Budget breakdown view (horizontal bar + category cards). | Seed data: populate Malaysian city meal/hotel cost matrices. |
| **Week 3** | `RouteOptimizerService` with Google Distance Matrix + TSP solver. `WeatherService` integration. Save/Get/List/Delete endpoints. | Map view with route polyline overlay. Save plan flow. Plans list in Trips tab. | Production migration. Index optimization. |

### 10.2 Phase 2: Enhancement (Weeks 4–6)

**Goal:** Hidden gems, photo spots, sharing, edit & refine, export.

| Week | Deliverables |
|---|---|
| **Week 4** | `HiddenGemService` scoring algorithm. `PhotoSpotService` identification. Map view interactive pins. Share plan (link + OG image card generation via Puppeteer). |
| **Week 5** | Plan edit & refine (drag-to-reorder, tap-to-remove, lock stops, AI-suggest replacements). Regenerate day endpoint. Clone plan endpoint. |
| **Week 6** | PDF export (`PlanExporterService`). Offline caching (IndexedDB + Service Worker). User feedback collection. Internal analytics dashboard for plan quality metrics. |

### 10.3 Phase 3: Intelligence (Weeks 7–9)

**Goal:** Personalization, real-time integration, multi-language, voice input.

| Week | Deliverables |
|---|---|
| **Week 7** | Travel DNA integration (learn from feedback, adjust future plans). `CrowdPredictorService` (school holiday + public holiday calendar). Personalized recommendations in plan footer. |
| **Week 8** | Real-time pricing: hotel booking API, Grab fare API, KTM/ETS schedule API. Live parking data where available. Event discovery (festivals, night markets, pop-ups on plan dates). |
| **Week 9** | Multi-language generation (Bahasa Malaysia, Mandarin, Tamil). Voice input for plan parameters via Web Speech API. AI Copilot chat for conversational plan refinement ("Make day 1 more adventurous but keep the lunch spot"). |

### 10.4 Key Success Metrics

```
┌─────────────────────────────────────────────────────────────┐
│  Weekend Planner — Product Metrics Dashboard                  │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  📊 USAGE                     📈 QUALITY                    │
│  ────────────────────────     ────────────────────────      │
│  Plans Generated: 12,847      Avg Plan Rating: 4.3 / 5      │
│  Plans Saved:      8,234      Budget Accuracy: 92%          │
│  Plans Shared:     3,421      Regeneration Rate: 18%        │
│  Weekly Active:    4,892      Hidden Gem Approval: 87%      │
│  Avg Plans/User:     3.2      Plan Completion Rate: 64%     │
│                                                             │
│  ⚡ PERFORMANCE               💰 BUSINESS                   │
│  ────────────────────────     ────────────────────────      │
│  p50 Latency:  4.2s           Free → Pro Conv: 8.2%         │
│  p95 Latency:  7.8s           Pro Plans/Month: 30           │
│  p99 Latency: 11.3s           Share → New User: 12.4%       │
│  Fallback Rate: 3.1%          Plan → Booking Click: 7.8%    │
│  Success Rate: 99.7%          DAU: 2,847                    │
│                                                             │
│  🏆 TOP DESTINATIONS          🔥 TRENDING                   │
│  ────────────────────────     ────────────────────────      │
│  1. Penang        3,821       Cameron Highlands  +142%      │
│  2. Kuala Lumpur  2,934       Ipoh               +87%       │
│  3. Melaka        1,847       Fraser's Hill      +64%       │
│  4. Langkawi      1,203       Sekinchan          +58%       │
│  5. Cameron Highlands 892     Kuala Selangor     +51%       │
└─────────────────────────────────────────────────────────────┘
```

---

## Appendix A: Database Migration

```bash
# 1. Add new enums and models to schema.prisma (see Section 4)
# 2. Generate migration:
cd packages/database
pnpm prisma migrate dev --name add_weekend_planner

# 3. Apply to production:
pnpm prisma migrate deploy

# 4. Regenerate typed Prisma client:
pnpm db:generate

# 5. Create materialized views (run manually in PostgreSQL):
psql $DATABASE_URL -f migrations/materialized_views/weekend_planner_views.sql
```

## Appendix B: Environment Variables

```env
# AI Models
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=ai-...

# Google Maps Platform
GOOGLE_MAPS_API_KEY=...
GOOGLE_MAPS_SERVER_KEY=...

# Weather
VISUAL_CROSSING_API_KEY=...

# Database
DATABASE_URL=postgresql://user:pass@host:5432/exploremy
DIRECT_URL=postgresql://user:pass@host:5432/exploremy

# Redis (caching + rate limiting)
REDIS_URL=redis://default:pass@host:6379

# Storage (share cards, PDFs, OG images)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...

# Optional: Real-time pricing
GRAB_API_KEY=...
KTM_API_KEY=...
```

## Appendix C: Failure Modes & Mitigations

| Failure | Impact | Mitigation |
|---|---|---|
| GPT-4o API timeout (8s) | Plan generation stalls | Immediate fallback to Gemini 2.5 Flash (6s timeout). If Gemini fails, rule-based engine guarantees a plan in < 3s |
| GPT-4o returns malformed JSON | Cannot parse plan | Zod validation catches this. Retry once with stricter prompt. If still invalid, fallback to Gemini → rule-based |
| AI generates non-existent place name | Broken plan | Post-gen validation cross-references all place names against context. Unmatched names replaced with nearest fuzzy-match from DB |
| Google Distance Matrix API rate limit | No real-time travel times | Use Haversine straight-line distance × 1.3 (road factor) × city average speed. Cache results for 1 hour |
| Weather API down | No rain-aware routing | Use seasonal averages for destination + month. Skip rain-based stop reordering |
| Place database sparse for destination | < 10 places available | Fall back to Google Places Nearby Search in real-time. Supplement with user-submitted places. Flag plan as "limited coverage" |
| Budget impossible for destination | Plan over or under budget | Return plan with explicit budget warning + suggestion: "We couldn't fit within MYR 200 for Penang. A comfortable weekend starts at MYR 350. Adjust?" |
| Very large group (> 10 people) | Logistics complexity | Surface group-specific challenges: split transport, reservation requirements, per-head cost scaling. Suggest group-friendly venues only |
| All AI tiers down simultaneously | No plan at all | This requires OpenAI + Google both down. Rule-based fallback is fully independent (no external API calls needed). 100% availability |

---

*Document version: 1.0 · Generated: 2026-06-15 · Approximate word count: 7,500+*
