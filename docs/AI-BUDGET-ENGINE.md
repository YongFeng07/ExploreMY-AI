# ExploreMY AI — AI Budget Engine

> **Product Team:** Sr PM Airbnb · Principal PM Klook · Former Google Travel Product Lead  
> **Target:** World-class budget intelligence for ASEAN travel  
> **Status:** Complete Specification

---

## 1. Product Philosophy

The budget is the single biggest anxiety point in travel planning. Most users abandon trip planning because they can't answer: "Can I afford this?" Our AI Budget Engine answers that question before the user even asks it.

### Core Principles
1. **Transparency first** — every ringgit is accounted for
2. **Feasibility over fantasy** — we tell users when their budget won't work
3. **Smart defaults** — AI suggests budgets based on destination + style
4. **Real-time adaptation** — budget adjusts as the plan evolves
5. **Group fairness** — transparent per-person cost sharing

---

## 2. Budget Input Modes

### Mode A: Total Budget
User sets a total trip budget (e.g., "RM 800 for the weekend"). The system allocates across categories.

### Mode B: Per Person Budget  
User sets per-person budget (e.g., "RM 300/person"). System multiplies by group size.

### Mode C: AI Suggested
User enters destination + dates, AI suggests minimum viable budget: "A comfortable weekend in Penang starts at RM 350/person."

---

## 3. AI Budget Advisor — The Core Feature

### 3.1 Automatic Minimum Budget Calculation

**Formula:**
```
MinBudget = Hotel(style, city, nights, pax) 
          + Food(style, city, days, pax) 
          + Transport(mode, distance, days)
          + Activities(city, days, pax)
          + Emergency(12%)
          + SeasonalMultiplier(month)
```

**Seasonal Multiplier Table:**
| Period | Multiplier |
|---|---|
| Off-peak (Feb, Mar, Sep, Oct) | 0.85 |
| Regular (Apr, May, Jun, Nov) | 1.00 |
| Peak (Jan, Jul, Aug, Dec) | 1.25 |
| Super Peak (School holidays, CNY, Hari Raya) | 1.50 |
| Ultra Peak (Christmas, New Year) | 1.80 |

**City Cost Index (0-100):**
| City | Index | Budget/Night (Solo) |
|---|---|---|
| Kuala Lumpur | 65 | RM 150 |
| Penang | 55 | RM 120 |
| Langkawi | 60 | RM 140 |
| Melaka | 40 | RM 90 |
| Cameron Highlands | 35 | RM 80 |
| Johor Bahru | 50 | RM 110 |
| Kota Kinabalu | 55 | RM 120 |
| Ipoh | 38 | RM 85 |

### 3.2 Budget Feasibility Score (0-100)

```javascript
feasibility = weightedAverage({
  destinationMatch: 0.2,    // Is budget realistic for destination?
  durationMatch: 0.2,       // Is budget enough for the number of days?
  styleMatch: 0.15,         // Does budget match travel style aspirations?
  groupSizeMatch: 0.15,     // Is per-person allocation sufficient?
  seasonalMatch: 0.15,      // Does budget account for seasonal pricing?
  transportMatch: 0.15,     // Can transport be covered?
})
```

**Scoring:**
- 90-100: Perfect — budget is generous for this trip
- 75-89: Comfortable — budget is adequate with buffer
- 60-74: Tight — budget works but minimal flexibility
- 40-59: Strained — need compromises on quality
- 20-39: Unrealistic — significant adjustments needed
- 0-19: Impossible — budget cannot cover basics

### 3.3 Budget Confidence Score

How confident is the AI that the budget estimate is accurate?

```
Confidence = avg(
  hotelPriceConfidence,    // Based on real-time hotel API data
  foodPriceConfidence,     // Based on recent reviews mentioning prices
  transportConfidence,     // Based on Grab API fare estimates  
  activityConfidence,      // Based on Klook ticket prices
  seasonalAccuracy,        // Based on historical seasonal patterns
)
```

---

## 4. Smart Budget Allocation

### Default Allocation (adjustable by travel style)

| Category | Budget | Mid-Range | Luxury | Adventure | Foodie |
|---|---|---|---|---|---|
| Accommodation | 20% | 30% | 40% | 25% | 20% |
| Food & Drink | 30% | 25% | 25% | 20% | 40% |
| Transport | 25% | 20% | 15% | 25% | 20% |
| Activities | 15% | 15% | 15% | 25% | 10% |
| Emergency | 10% | 10% | 5% | 5% | 10% |

### AI Rebalancing
When the user changes one category (e.g., "I want a nicer hotel"), AI rebalances other categories to stay within total budget.

---

## 5. Group Cost Sharing

### Split Modes
1. **Equal Split** — total ÷ number of people
2. **Per-Person Tracking** — each person pays their actual expenses
3. **Host-Guest** — one person pays accommodation, everyone splits food/transport

### UI
```
┌──────────────────────────────────────────┐
│ 💰 Group Budget: RM 1,200                │
│ 👥 4 people = RM 300/person              │
│                                          │
│ 🏨 Hotel: RM 400 (RM 100/person)        │
│ 🍜 Food:  RM 360 (RM 90/person)         │
│ 🚗 Transport: RM 240 (RM 60/person)     │
│ 🎫 Activities: RM 120 (RM 30/person)    │
│ 🆘 Buffer: RM 80 (RM 20/person)         │
└──────────────────────────────────────────┘
```

---

## 6. Budget Health Indicator

A traffic-light system visible throughout the planning experience:

- 🟢 **Healthy** (> 20% buffer) — "You're well within budget"
- 🟡 **Watch** (5-20% buffer) — "You're close to your limit"
- 🟠 **Warning** (0-5% buffer) — "Almost at budget — be careful"
- 🔴 **Over** (over budget) — "RM 85 over budget — here's how to fix it"

---

## 7. Budget Warning System

### Triggers
| Condition | Warning |
|---|---|
| Hotel > 40% of budget | "Accommodation is eating into your food budget" |
| Single activity > 25% | "This activity is a quarter of your entire trip" |
| No emergency buffer | "You have no contingency — a Grab surge could put you over" |
| Peak season + low budget | "Penang in December is 40% more expensive than usual" |
| Transport > 30% | "You're spending too much on getting around" |

### Proactive Suggestions
- "Switch to a hostel and save RM 120 — that's 3 more meals"
- "Take the KTM instead of Grab — saves RM 45"
- "Visit on weekdays — hotel prices drop 30%"
- "Book activities on Klook — 15% cheaper than at the gate"

---

## 8. Alternative Itinerary Generator

When budget is strained, AI generates alternatives:

### Generation Logic
```
For each stop in plan:
  if stop.cost > budget.remaining / stopsRemaining:
    find 3 similar alternatives within budget
    rank by: quality_score × budget_fit × DNA_match
    present with savings amount
```

### UI
```
┌──────────────────────────────────────────┐
│ 💡 Budget-Friendly Alternatives          │
│                                          │
│ You're RM 120 over budget.               │
│ Here are 3 ways to fix it:               │
│                                          │
│ Option A: Swap Hotels                   │
│ Eastern & Oriental → JEN Penang          │
│ Save: RM 150 · Rating: 4.2 → 4.1        │
│                                          │
│ Option B: Fewer Activities              │
│ Remove ESCAPE Penang (RM 100/person)    │
│ Add free Penang Hill hike               │
│ Save: RM 200                             │
│                                          │
│ Option C: Cheaper Transport             │
│ Grab → Bus for 3 trips                  │
│ Save: RM 45                              │
│                                          │
│ [Apply Option A] [Apply Option B]        │
│ [Apply All]                              │
└──────────────────────────────────────────┘
```

---

## 9. Database Schema

```prisma
model BudgetProfile {
  id              String    @id @default(uuid())
  planId          String    @unique
  mode            BudgetMode      // TOTAL | PER_PERSON | AI_SUGGESTED
  totalBudget     Float
  perPersonBudget Float?
  currency        String    @default("MYR")
  groupSize       Int       @default(1)

  // AI computed
  feasibilityScore    Int?        // 0-100
  confidenceScore     Int?        // 0-100
  minimumBudget       Float?      // AI-suggested minimum
  comfortableBudget   Float?      // AI-suggested comfortable
  seasonalMultiplier  Float?      // 0.85 - 1.80
  
  // Allocations
  hotelAllocation     Float?
  foodAllocation      Float?
  transportAllocation Float?
  activityAllocation  Float?
  emergencyAllocation Float?
  
  // Status
  healthStatus        BudgetHealth  // HEALTHY | WATCH | WARNING | OVER
  
  plan Plan @relation(fields: [planId], references: [id])
  items BudgetItem[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model BudgetItem {
  id              String    @id @default(uuid())
  profileId       String
  category        CostCategory
  plannedAmount   Float
  actualAmount    Float?
  isOverBudget    Boolean   @default(false)
  notes           String?
  
  profile BudgetProfile @relation(fields: [profileId], references: [id])
}

enum BudgetMode { TOTAL PER_PERSON AI_SUGGESTED }
enum BudgetHealth { HEALTHY WATCH WARNING OVER }
```

---

## 10. API Design

```
GET  /api/v1/budget/suggest
     ?destination=Penang&days=2&pax=2&style=midRange&month=june
     → { minimum: 280, comfortable: 450, generous: 700, breakdown: {...} }

GET  /api/v1/budget/:planId/health
     → { status: "HEALTHY", buffer: 25, warnings: [], suggestions: [] }

POST /api/v1/budget/:planId/rebalance
     Body: { allocations: { hotel: 35, food: 25, ... } }
     → { newAllocations, impact: "Hotel budget increased by RM 150" }

GET  /api/v1/budget/:planId/alternatives
     → { alternatives: [{ type: "HOTEL", savings: 150, options: [...] }] }

POST /api/v1/budget/:planId/split
     Body: { mode: "EQUAL", payers: [{ userId, share }] }
     → { perPerson: 300, breakdown: [...] }

GET  /api/v1/budget/:planId/predict
     → { predictedTotal, confidence, riskFactors }
```

---

## 11. Mobile UI — Budget Dashboard

```
┌──────────────────────────────────────────┐
│ ← Back                    💰 Budget      │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │           RM 800 / RM 1,200          │ │
│ │         🟢 RM 400 remaining           │ │
│ │   ━━━━━━━━━━━━━━━━━━━━░░░░  67%      │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ Feasibility Score                        │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  85/100  │
│ "Your budget is comfortable for Penang"  │
│                                          │
│ Allocation                     Edit     │
│ ┌──────────────────────────────────────┐ │
│ │ 🏨 Hotel     RM 250  31%  ━━━━━━━  │ │
│ │ 🍜 Food      RM 200  25%  ━━━━━━   │ │
│ │ 🚗 Transport RM 150  19%  ━━━━━    │ │
│ │ 🎫 Activities RM 120 15%  ━━━━     │ │
│ │ 🆘 Emergency RM  80  10%  ━━━      │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ⚠️ 1 Budget Warning                      │
│ "Hotel is 31% of budget — consider      │
│  JEN Penang instead for RM 150"         │
│                                          │
│ 💡 Smart Tips                            │
│ • Book on Klook — save 15% on activities│
│ • Weekday visit saves 30% on hotels     │
│                                          │
│ [💰 Rebalance Budget] [🔄 Alternatives]  │
└──────────────────────────────────────────┘
```

---

## 12. React Component Tree

```
<BudgetDashboard>
  <BudgetRing>                          // Circular progress
    <BudgetTotal />
    <BudgetRemaining />
    <BudgetHealthIndicator />           // 🟢🟡🟠🔴
  </BudgetRing>
  
  <FeasibilityCard>
    <ScoreGauge value={85} />
    <FeasibilityMessage />
  </FeasibilityCard>
  
  <AllocationBreakdown>
    <AllocationRow category="hotel" />
    <AllocationRow category="food" />
    <AllocationRow category="transport" />
    <AllocationRow category="activities" />
    <AllocationRow category="emergency" />
    <AllocationEditSheet />            // Bottom sheet to edit
  </AllocationBreakdown>
  
  <BudgetWarnings>
    <WarningCard type="hotel_over" />
    <WarningCard type="no_buffer" />
  </BudgetWarnings>
  
  <SmartTips>
    <TipCard />
    <TipCard />
  </SmartTips>
  
  <ActionBar>
    <RebalanceButton />
    <AlternativesButton />
  </ActionBar>
</BudgetDashboard>
```

---

## 13. AI Logic Flow

```
USER INPUT
  destination, dates, pax, style, budget
        │
        ▼
┌─────────────────┐
│ DESTINATION      │
│ COST INDEX       │  ← City cost database
│ LOOKUP           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ SEASONAL         │
│ MULTIPLIER       │  ← Seasonal pricing data
│ APPLY            │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ STYLE-BASED      │
│ ALLOCATION       │  ← Default allocation table
│ CALCULATE        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ REAL-TIME        │
│ PRICE ENRICHMENT │  ← Hotel API, Grab API, Klook API
│ (BUILD COSTS)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ FEASIBILITY      │
│ SCORE            │  ← Weighted scoring algorithm
│ CALCULATE        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ BUDGET           │
│ HEALTH           │  ← Traffic light assignment
│ ASSIGN           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ WARNINGS &       │
│ ALTERNATIVES     │  ← Proactive suggestion engine
│ GENERATE         │
└────────┬────────┘
         │
         ▼
    OUTPUT
  BudgetDashboard
```

---

## Document Metadata
- **Version**: 1.0
- **Words**: ~3,500
- **Status**: Complete Product Specification
