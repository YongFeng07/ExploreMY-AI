# Place Details — Transport Section Redesign

> **Review Board:** Ex-Google Maps PD · Ex-Airbnb UX Director · Ex-Tripadvisor Product Lead · Ex-Klook Product Architect

---

## 1. Analysis: The Transport Options Problem

### Current State
The Transport Options section lists 7 modes (Walking, Grab, Drive, LRT, KTM, Flight, Ferry) with duration and cost. This is a **utility feature masquerading as an experience**.

### Critical Failures

| # | Issue | Severity |
|---|---|---|
| 1 | Zero personalization — every user sees the same generic transport list | Critical |
| 2 | No AI context — doesn't explain WHY the place was recommended | Critical |
| 3 | Low visual engagement — flat text rows, no imagery, no emotion | High |
| 4 | Cognitive overload — 7 options when user only needs 1-2 | High |
| 5 | No social proof — no reviews, no popularity signals | High |
| 6 | Zero retention value — nothing to make users return | Critical |

### User Psychology
When a user opens a place detail, they're asking: **"Why should I go here?"** — not "How many minutes by KTM?" Transport is the LAST question, not the first. The first questions are: Is it good? Is it worth my time? Do people like me enjoy it?

Transport should be **collapsed by default**, revealed only when the user taps "Get Directions."

---

## 2. The 5 Replacement Sections

### Section 1: AI Why Recommended
*Replaces transport as the primary section below the hero.*

**Purpose:** Personal AI explanation of why this specific place was chosen.

**Layout:**
```
┌──────────────────────────────────────────┐
│ 🤖 Why We Picked This For You            │
│                                          │
│ "You loved the street food at Jalan      │
│  Alor and prefer hidden local spots      │
│  over tourist traps. This cafe has       │
│  the same authentic vibe — 94% of        │
│  reviewers are locals."                  │
│                                          │
│ Based on: 🍜 Foodie DNA · 📍 Your past  │
│ trips · ⭐ 4.7 from 1,247 reviews        │
└──────────────────────────────────────────┘
```

### Section 2: Hidden Gem Score
*Shows WHY this place is special, algorithmically.*

**Components:**
- Gem Score ring (0-100)
- Quality: Rating + review sentiment
- Exposure: Inverse review count
- Local Ratio: % Malaysian reviewers
- Uniqueness: Category rarity in area
- Growth: Review velocity

### Section 3: Smart Travel Insights
*AI-powered visit intelligence.*

**Components:**
- Best time to visit (hourly chart)
- Crowd forecast (Live / Busy / Packed)
- Weather impact (rain-safe? indoor?)
- Parking availability
- Photo quality score
- Average spend per person

### Section 4: Travel DNA Match
*Personalization visualization.*

**Components:**
- 8-dimension radar/spider chart matching user profile
- Match percentage (e.g., "92% Match for You")
- Top 3 matching dimensions highlighted
- "People with your DNA also visited..."

### Section 5: Nearby Next Stop
*AI suggests the next logical stop after this one.*

**Components:**
- 3 nearby suggestions with scores
- Walk/Grab time from current place
- "Continue your journey" narrative
- One-tap "Add to Plan"

---

## 3. Implementation Priority

**MVP (today):** Section 1 (AI Why Recommended) + Section 5 (Nearby Next Stop)
**V2:** Section 4 (Travel DNA Match) + Section 2 (Hidden Gem Score)  
**V3:** Section 3 (Smart Travel Insights)

Transport is kept as a **collapsed section** — tap "🚀 Get Directions" to expand 3 best options only.
