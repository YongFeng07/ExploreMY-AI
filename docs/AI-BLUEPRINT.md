# ExploreMY AI — AI Intelligence Ecosystem Blueprint

> **Classification:** Internal — AI Engineering  
> **Version:** 5.0  
> **Authors:** Chief AI Officer · Principal AI Architect · Principal ML Architect  
> **Target Scale:** 10M users · 1B recommendations · 100M AI conversations  
> **Models:** GPT-4o · Gemini 2.5 Flash · text-embedding-3-small · Custom classifiers

---

## Section 1: AI Strategy

### 1.1 AI Vision

ExploreMY's AI is not a feature bolted onto a travel app. It is the operating system itself — an intelligent layer that understands Malaysia deeply, learns each user's unique travel personality, and proactively orchestrates every aspect of discovery, planning, navigation, and decision-making.

We compete not by having AI, but by having AI that understands Malaysian context better than any global platform ever will.

### 1.2 AI Mission

1. **Understand** — Build the richest user profile in travel through Travel DNA, Food DNA, and behavioral memory
2. **Predict** — Anticipate what users want before they search
3. **Generate** — Create complete, actionable travel plans in seconds
4. **Optimize** — Find the best routes, budgets, and experiences given real-world constraints
5. **Discover** — Surface hidden gems that algorithms biased toward popularity would never find

### 1.3 AI Principles

| Principle | Rule |
|-----------|------|
| **Context Over Content** | Every AI response is grounded in: user location, time, weather, preferences, history, and budget |
| **Malaysia First** | Training data, prompts, and knowledge base prioritize Malaysian context — halal dining, local transport, cultural nuances |
| **Transparent Recommendations** | Every recommendation includes a "Why this?" explanation |
| **Human in the Loop** | AI suggests. Users decide. Feedback improves the system. |
| **Cost-Conscious Routing** | GPT-4o for complex reasoning. Gemini Flash for fast inference. Custom models for ranking. |
| **Privacy-Preserving** | Personalization runs on-device where possible. Cloud AI uses anonymized embeddings. |

### 1.4 Competitive Advantage

| Competitor | Their AI | Our AI |
|-----------|----------|--------|
| Google Maps | Popularity-based ranking | Quality × personalization × hidden gem scoring |
| TripAdvisor | Review volume ranking | AI summary + verified local reviews + sentiment analysis |
| ChatGPT | Generic travel advice | Malaysia-specific knowledge + real-time data + booking integration |
| Grab | Transport only | Multi-modal + food discovery + trip planning in one |

### 1.5 AI Roadmap

```
Q3 2026: AI Trip Planner v1 (rule-based + GPT-4o fallback)
Q4 2026: Recommendation Engine v1 (content-based + collaborative filtering)
Q1 2027: Travel DNA + Food DNA (behavioral learning)
Q2 2027: AI Copilot (multi-turn conversational planning)
Q3 2027: Hidden Gems Engine (ML-based scoring)
Q4 2027: Memory Engine (cross-session context)
2028: RAG Pipeline (grounded Malaysian knowledge)
2029: Voice + AR AI Assistant
```

---

## Section 2: AI System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                      AI INTELLIGENCE PLATFORM                          │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                     USER-FACING AI LAYER                          │ │
│  │                                                                    │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │ │
│  │  │AI Copilot│ │AI Trip   │ │Food      │ │Route & Budget    │   │ │
│  │  │(Chat)    │ │Planner   │ │Discovery │ │Optimizer         │   │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                    │                                   │
│  ┌─────────────────────────────────▼────────────────────────────────┐ │
│  │                     INTELLIGENCE ENGINES                           │ │
│  │                                                                    │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │ │
│  │  │Travel DNA│ │Food DNA  │ │Recommend │ │Hidden Gems       │   │ │
│  │  │Engine    │ │Engine    │ │Engine    │ │Engine            │   │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │ │
│  │  │Memory    │ │Event     │ │Safety    │ │Forecasting       │   │ │
│  │  │Engine    │ │Discovery │ │Engine    │ │Engine            │   │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                    │                                   │
│  ┌─────────────────────────────────▼────────────────────────────────┐ │
│  │                     MODEL LAYER                                    │ │
│  │                                                                    │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │ │
│  │  │GPT-4o    │ │Gemini    │ │Embedding │ │Custom ML         │   │ │
│  │  │(Complex) │ │Flash     │ │Model     │ │(Ranking/Classif) │   │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                    │                                   │
│  ┌─────────────────────────────────▼────────────────────────────────┐ │
│  │                     DATA & MEMORY LAYER                            │ │
│  │                                                                    │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │ │
│  │  │Feature   │ │Vector DB │ │Knowledge │ │Behavioral        │   │ │
│  │  │Store     │ │(pgvector)│ │Base (RAG)│ │Memory            │   │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Section 3: AI Travel Copilot

### 3.1 Conversation Architecture

The Copilot is a multi-turn conversational agent with persistent memory. It maintains context across sessions and learns from every interaction.

```
TURN 1: User — "I have RM 200 and one day in Melaka"
  ├── Intent: PLAN_TRIP
  ├── Extracted: destination=Melaka, budget=200, duration=1
  ├── Missing: interests, dates, transport
  └── Response: "One day in Melaka — great choice! What kind of experiences do you enjoy? History, food, or both?"

TURN 2: User — "Food! I want to try the best local stuff"
  ├── Intent: CLARIFY (fills PLAN_TRIP slots)
  ├── Extracted: interests=[food]
  ├── Context: user location=KL, typical transport=car
  └── Response: Generates full 1-day Melaka food itinerary with 5 stops

TURN 3: User — "Can you add a historical spot between lunch and dinner?"
  ├── Intent: MODIFY_TRIP
  ├── References: trip_id from Turn 2 response
  ├── Action: Insert historical attraction between stops 3 and 4
  └── Response: Updated itinerary with "A Famosa" inserted, adjusted times

TURN 4: User — "Save this for next Saturday"
  ├── Intent: SAVE_TRIP + schedule
  └── Response: "Saved! I'll remind you Friday evening."
```

### 3.2 Intent Classification

```typescript
enum CopilotIntent {
  // Planning
  PLAN_TRIP = 'plan_trip',
  PLAN_WEEKEND = 'plan_weekend',
  PLAN_DAY = 'plan_day',
  MODIFY_TRIP = 'modify_trip',

  // Discovery
  FIND_FOOD = 'find_food',
  FIND_ATTRACTION = 'find_attraction',
  FIND_HIDDEN_GEM = 'find_hidden_gem',
  FIND_EVENT = 'find_event',
  FIND_TRANSPORT = 'find_transport',

  // Optimization
  OPTIMIZE_ROUTE = 'optimize_route',
  OPTIMIZE_BUDGET = 'optimize_budget',
  COMPARE_OPTIONS = 'compare_options',

  // Action
  SAVE = 'save',
  BOOK = 'book',
  SHARE = 'share',

  // Meta
  GREETING = 'greeting',
  CLARIFY = 'clarify',
  FEEDBACK = 'feedback',
  HELP = 'help',
}
```

### 3.3 Context Builder

Before every LLM call, the Context Builder assembles:

```typescript
interface CopilotContext {
  user: {
    id: string; name: string; homeCity: string;
    travelDNA: TravelDNAVector;     // 8 dimensions
    foodDNA: FoodDNAVector;         // 14 dimensions
    preferences: UserPreferences;
    dietaryRestrictions: string[];
    budgetLevel: number;
  };
  session: {
    turn: number;
    activeTripId: string | null;
    conversationSummary: string;    // Rolling summary of previous turns
  };
  environment: {
    currentLocation: LatLng;
    city: string;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    weather: { condition: string; temp: number; rainChance: number };
    traffic: { level: string };
    season: string;
    isWeekend: boolean;
    isHoliday: boolean;
  };
  memory: {
    recentPlaces: string[];         // Last 10 viewed place IDs
    recentSearches: string[];       // Last 5 search queries
    unvisitedFavorites: string[];   // Saved but not visited
    keyFacts: MemoryFact[];         // Top 5 relevant long-term facts
  };
  constraints: {
    budget: number;
    maxDistance: number;
    timeAvailable: number;          // minutes
  };
}
```

---

## Section 4: Travel DNA Engine

### 4.1 8-Dimension Personality Vector

```
Travel DNA = [adventure, luxury, foodie, culture, nature, social, spontaneity, localImmersion]

Each dimension: 0.0 (low affinity) to 1.0 (high affinity)
Initial: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5] (neutral)
```

### 4.2 Signal Sources & Weights

| Signal | Weight | Example |
|--------|--------|---------|
| Onboarding quiz | 0.25 | User selects "Foodie" + "Adventure" |
| Explicit preferences | 0.30 | User sets budget level 2 |
| Place visits (category) | 0.20 | Visited 5 hiking trails → nature +0.15 |
| Reviews (sentiment) | 0.10 | 5★ review on temple → culture +0.05 |
| Favorites (category) | 0.05 | Saved 10 cafes |
| Trip plans created | 0.05 | Planned food tour → foodie +0.03 |
| Search queries | 0.03 | Searched "best beaches" |
| View time | 0.02 | Spent 2 min viewing attraction detail |

### 4.3 Scoring Algorithm

```
TravelDNA[dimension] = Σ(signal_value × weight × recency_decay) / Σ(weight × recency_decay)

recency_decay = e^(-λ × days_since_signal)
where λ = 0.01 (half-life = 69 days)

Confidence = min(1.0, data_points / 50)
→ Full confidence after 50 meaningful behavioral signals
```

### 4.4 User Segmentation

| Segment | Travel DNA Profile | What They See |
|---------|-------------------|---------------|
| **Adventure Seeker** | adventure >0.7, nature >0.6 | Hiking trails, water sports, outdoor activities |
| **Luxury Traveler** | luxury >0.7, foodie >0.5 | Fine dining, 5-star hotels, private tours |
| **Budget Explorer** | luxury <0.3, spontaneity >0.6 | Street food, hostels, free attractions |
| **Family Planner** | social >0.6, adventure <0.4 | Kid-friendly places, parks, family restaurants |
| **Food Hunter** | foodie >0.8 | Hawker stalls, hidden restaurants, food trails |
| **Culture Seeker** | culture >0.7, localImmersion >0.6 | Museums, temples, heritage sites, local workshops |

---

## Section 5: Food DNA Engine

### 5.1 Cuisine Dimensions (14 total)

```
CUISINE TYPES: malay, chinese, indian, japanese, korean, western, thai, middleEastern, fusion
DINING STYLES: streetFood, cafe, fineDining, hawker, buffet
PREFERENCES: spiceTolerance (0=mild→1=very spicy), pricePreference (0=cheap→1=premium)
```

### 5.2 Scoring Formula

```
FoodDNA[cuisine] = Σ(visit_score × rating_normalized × recency_decay) / Σ(visit_score)

visit_score mapping:
  review_written:  1.0   (strongest signal — user cared enough to write)
  favorited:       0.7   (explicit save)
  visited:         0.5   (GPS detected visit)
  viewed_detail:   0.2   (browsed)
  searched:        0.15  (query match)

rating_normalized = user_rating / 5.0  (if reviewed)
                  = 0.8                (if visited but didn't review — assume liked)
```

### 5.3 Food Discovery Logic

```
For a food recommendation query at location (lat, lng):
  1. Query nearby places WHERE category IN (RESTAURANT, CAFE, STREET_FOOD, FOOD_COURT)
  2. Score each place:
     foodScore = 0.30 × cuisineMatch(place, user.foodDNA) +
                 0.25 × ratingScore +
                 0.20 × distanceScore +
                 0.10 × budgetMatch(place.priceLevel, user.preferences.budgetLevel) +
                 0.10 × dietaryMatch(place, user.preferences.dietaryRestrictions) +
                 0.05 × openNowBonus
  3. Sort by foodScore DESC
  4. Return top 10 with AI-generated recommendation reasons
```

---

## Section 6: AI Memory Engine

### 6.1 Four Memory Types

```
┌─────────────────────────────────────────────────────────────┐
│                    MEMORY ARCHITECTURE                        │
│                                                               │
│  SHORT-TERM (Session-scoped, volatile)                        │
│  • Current conversation turns (max 10)                       │
│  • Active trip being planned                                 │
│  • Temporary user inputs                                     │
│  • TTL: Session duration                                     │
│                                                               │
│  LONG-TERM (Cross-session, persistent)                        │
│  • Explicit facts: "prefers window seats", "allergic to nuts"│
│  • Inferred facts: "avoids crowded places on weekends"       │
│  • Confidence decays if not reinforced                       │
│  • TTL: Permanent (with confidence decay)                    │
│                                                               │
│  SEMANTIC (Knowledge-based)                                   │
│  • Place embeddings (pgvector)                               │
│  • Cuisine relationship graph                                │
│  • Malaysian cultural knowledge base                         │
│  • TTL: Permanent (updated on data refresh)                  │
│                                                               │
│  BEHAVIORAL (Pattern-based)                                   │
│  • Visit patterns: "often visits cafes on Sunday afternoons" │
│  • Budget patterns: "avg meal spend RM 25"                   │
│  • Time patterns: "prefers morning activities"               │
│  • TTL: Rolling 90-day window                                │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Memory Retrieval

```
On each AI request:
  1. SHORT-TERM: Load conversation window (last 5 turns) → always included
  2. LONG-TERM: Query memory_facts WHERE user_id + category matches intent → top 5 by relevance
  3. SEMANTIC: Vector search places WHERE embedding <-> query_embedding < 0.3 → top 10
  4. BEHAVIORAL: Query patterns matching current context (time, location, weather) → top 3
  5. Rank combined memories → fit into 2K token context window
  6. Inject into system prompt as structured context
```

### 6.3 Memory Ranking Formula

```
memoryRelevance = w1 × recencyScore + w2 × frequencyScore + w3 × confidenceScore + w4 × intentMatchScore

recencyScore = e^(-0.01 × hours_since_last_access)
frequencyScore = min(1.0, log(access_count + 1) / log(50))
confidenceScore = fact.confidence
intentMatchScore = 1.0 if fact.category matches current intent, 0.3 otherwise
```

---

## Section 7: Recommendation Engine

### 7.1 Hybrid Architecture

```
┌──────────────────────────────────────────────────────────────┐
│              RECOMMENDATION ENGINE                             │
│                                                                │
│  ┌──────────────────┐   ┌──────────────────┐                  │
│  │ COLLABORATIVE     │   │ CONTENT-BASED     │                 │
│  │ FILTERING         │   │ FILTERING         │                 │
│  │                    │   │                   │                 │
│  │ • User-User CF    │   │ • Category match  │                 │
│  │   Find 50 similar │   │ • Cuisine match   │                 │
│  │   users by Travel │   │ • Price match     │                 │
│  │   DNA cosine sim  │   │ • Distance match  │                 │
│  │                    │   │ • Amenity match   │                 │
│  │ • Item-Item CF    │   │ • Dietary match   │                 │
│  │   "Users who liked│   │                   │                 │
│  │    X also liked Y"│   │                   │                 │
│  └────────┬─────────┘   └────────┬─────────┘                 │
│           │                      │                             │
│           └──────────┬───────────┘                             │
│                      ▼                                         │
│  ┌──────────────────────────────────────┐                     │
│  │        HYBRID SCORE FUSION            │                     │
│  │                                       │                     │
│  │  finalScore =                         │                     │
│  │    α×cfScore + β×cbScore +           │                     │
│  │    γ×popularityScore +                │                     │
│  │    δ×personalizationScore +           │                     │
│  │    ε×contextScore +                   │                     │
│  │    ζ×diversityBonus                   │                     │
│  │                                       │                     │
│  │  α=0.25 β=0.25 γ=0.10                │                     │
│  │  δ=0.20 ε=0.15 ζ=0.05               │                     │
│  └──────────────────┬───────────────────┘                     │
│                     ▼                                         │
│  ┌──────────────────────────────────────┐                     │
│  │        RANKING & DIVERSIFICATION      │                     │
│  │                                       │                     │
│  │  • MMR (Maximal Marginal Relevance)  │                     │
│  │    Reward dissimilar results         │                     │
│  │  • Category diversification          │                     │
│  │    Max 2 per category in top 10      │                     │
│  │  • Price level diversification       │                     │
│  │    Mix of price levels               │                     │
│  └──────────────────┬───────────────────┘                     │
│                     ▼                                         │
│              Ranked Results (top 10) + Reasons                │
└──────────────────────────────────────────────────────────────┘
```

### 7.2 Recommendation Types

| Type | Trigger | Example Output |
|------|---------|---------------|
| `nearby_now` | App opened, location acquired | "3 hawker stalls within 500m" |
| `time_based` | 12:00 PM (lunch) | "Best lunch spots near you" |
| `weather_based` | Rain detected | "3 museums to escape the rain" |
| `preference_based` | Travel DNA match | "Because you love Malaysian food" |
| `weekend_plan` | Friday 5 PM | "Weekend getaway: Sekinchan + FRIM" |
| `saved_reminder` | Near saved place | "You're 200m from Nasi Lemak Tanglin!" |
| `social_proof` | Friend activity | "Sarah saved this cafe yesterday" |
| `trending` | Velocity spike | "This hawker stall is blowing up" |
| `hidden_gem` | High quality, low exposure | "A local secret most tourists miss" |

---

## Section 8: Hidden Gems Engine

### 8.1 Definition & Formula

A **Hidden Gem** has high quality but low digital exposure.

```
HiddenGemScore = 0.35×qualityScore + 0.30×exposureInverse + 0.20×localRatio + 0.10×growthVelocity + 0.05×uniquenessScore

qualityScore = (rating/5.0) × min(1.0, log(reviewCount + 1) / log(100))
  → 4.8★ with 500 reviews = 0.96 × 0.90 = 0.86

exposureInverse = 1.0 - min(1.0, (reviewCount/500) × (totalViews/50000))
  → 50 reviews, 2000 views = 1.0 - min(1.0, 0.1 × 0.04) = 0.996

localRatio = localReviewers / max(totalReviewers, 1)
  → 45 local reviews / 50 total = 0.90

growthVelocity = min(1.0, (reviewsLast30Days / max(totalReviews, 1)) × 10)
  → Growing but still small

uniquenessScore = 1.0 - max(categorySimilarity with nearest 5 places in 2km)
  → Unique in its area

Threshold: score ≥ 0.65 → isHiddenGem = true
```

### 8.2 Discovery Pipeline

```
Hourly Cron:
  1. SELECT places WHERE rating ≥ 4.0 AND reviewCount < 500 AND NOT isPermanentlyClosed
  2. For each candidate: calculate HiddenGemScore
  3. UPDATE places SET hiddenGemScore = X, isHiddenGem = (X >= 0.65)
  4. Invalidate Redis cache for area queries
  5. If new hidden gem discovered: create notification for local users
```

---

## Section 9: Budget Optimizer

### 9.1 Cost Model

```typescript
interface TripCost {
  transport: {
    fuel: number;          // distance × consumption_rate × fuel_price
    tolls: number;         // Σ toll_rates along route
    grab: number;          // base + per_km × distance × surge
    publicTransit: number; // per_ride costs
  };
  accommodation: number;  // nightly_rate × nights × budget_level_multiplier
  food: {
    breakfast: number;     // 5-25 depending on style
    lunch: number;         // 8-30
    dinner: number;        // 10-60
    snacks: number;        // 5-15
  };
  activities: number;     // Σ entrance_fees + tour_costs
  contingency: number;    // 15% buffer
}

budget_multipliers = {
  1: { hotel: 50, breakfast: 5,  lunch: 8,  dinner: 10 },    // Budget
  2: { hotel: 150, breakfast: 10, lunch: 15, dinner: 25 },    // Mid-range
  3: { hotel: 350, breakfast: 20, lunch: 30, dinner: 60 },    // Premium
  4: { hotel: 800, breakfast: 40, lunch: 60, dinner: 120 },   // Luxury
};
```

### 9.2 Budget Optimization Algorithm

```
If estimatedCost > budget:
  1. Sort cost items by cost_desc
  2. For each item, find cheaper alternatives:
     - Hotel: downgrade star rating or switch to guesthouse
     - Transport: replace Grab → MRT for urban legs
     - Food: replace fine dining → hawker stalls
     - Activities: remove lowest-priority activities
  3. Present optimized plan with savings breakdown
  4. User accepts/rejects each change
```

---

## Section 10: Route Optimizer

### 10.1 Route Type Weight Vectors

```
EdgeWeight = w1×distance + w2×time + w3×cost + w4×(1-scenic) + w5×(1-foodDensity) + w6×traffic + w7×safetyRisk

Route Types → Weight Vectors [w1..w7]:
  FASTEST:   [0.0, 1.0, 0.0, 0.0, 0.0, 0.3, 0.0]
  CHEAPEST:  [0.2, 0.3, 1.0, 0.0, 0.0, 0.1, 0.0]
  SCENIC:    [0.1, 0.2, 0.1, 0.5, 0.0, 0.0, 0.0]
  FAMILY:    [0.1, 0.2, 0.2, 0.1, 0.0, 0.2, 0.3]
  FOOD:      [0.1, 0.2, 0.1, 0.0, 0.5, 0.1, 0.0]
```

### 10.2 Multi-Stop Optimization (TSP)

```python
def optimize_multi_stop(stops, start, end, route_type):
    # 1. Nearest neighbor to build initial solution
    ordered = nearest_neighbor([start] + stops + [end])
    # 2. 2-opt local search to improve
    improved = True
    while improved:
        improved = False
        for i in range(1, len(ordered) - 2):
            for j in range(i + 1, len(ordered) - 1):
                if two_opt_gain(i, j) > 0:
                    reverse_segment(ordered, i, j)
                    improved = True
    return ordered
```

---

## Sections 11-13: Events, Forecasting, Safety

### Event Discovery Ranking

```
eventScore = 0.25×interestMatch + 0.20×pastAttendance + 0.15×socialProof + 0.15×locationConvenience + 0.10×budgetMatch + 0.10×timingMatch + 0.05×trendingBoost
```

### Safety Risk Assessment

```
aggregateRiskScore = max(weatherRisk, trafficRisk, safetyRisk, healthRisk)

weatherRisk:  OpenWeatherMap API → rain/flood probability
trafficRisk:  Google Maps traffic layer → congestion level
safetyRisk:   Crime statistics by district + time-of-day adjustment
healthRisk:   AQI (DOE Malaysia) + heat index + UV index

if riskScore > 0.7 → ALERT (push notification)
if riskScore > 0.4 → WARNING (in-app banner)
```

---

## Section 14: RAG Architecture

```
INGESTION PIPELINE:
  Sources: Tourism Malaysia data, user reviews, place descriptions,
           business listings, event data, cultural knowledge base
  → Chunk (512 tokens with 64-token overlap)
  → Embed (text-embedding-3-small, 1536 dimensions)
  → Store in pgvector (knowledge_chunks table)
  → Index: IVFFlat (vector_cosine_ops, lists=200)

RETRIEVAL:
  User query → Embed → Vector search (top_k=20)
  → Re-rank with cross-encoder (Cohere or local)
  → Top 5 chunks → Inject into LLM context window
  → LLM generates grounded response with citations

REFRESH:
  • Reviews: real-time (on review creation)
  • Tourism Malaysia: weekly batch
  • Place data: on place update
  • Full re-index: monthly
```

---

## Sections 15-16: Prompts & Model Orchestration

### Model Routing Strategy

```typescript
function selectModel(task: AITask): ModelConfig {
  switch (task.complexity) {
    case 'high':   // Trip planning, multi-turn reasoning, budget optimization
      return { model: 'gpt-4o', maxTokens: 4096, temperature: 0.7, timeout: 15000 };
    case 'medium': // Recommendations, place descriptions, review summaries
      return { model: 'gemini-2.5-flash', maxTokens: 1024, temperature: 0.5, timeout: 5000 };
    case 'low':    // Embeddings, classification, intent detection
      return { model: 'text-embedding-3-small', dimensions: 1536, timeout: 3000 };
    default:       // Default to fast/cheap, fallback to powerful
      return { model: 'gemini-2.5-flash', fallback: 'gpt-4o-mini', timeout: 5000 };
  }
}
```

### Fallback Chain

```
Primary: GPT-4o (8s timeout)
  ↓ failure/timeout
Secondary: Gemini 2.5 Flash (4s timeout)
  ↓ failure/timeout
Tertiary: Rule-based generator (always available)
```

---

## Sections 17-23: Data Platform, Analytics, DB, APIs, Scaling

### AI Database Tables (Recap from Database Blueprint)

`ai_conversations`, `ai_messages`, `ai_recommendations`, `memory_facts`, `knowledge_chunks`, `user_similarities`, `personalized_recommendations`, `travel_dna`, `food_dna`, `ai_forecasts`, `safety_alerts`

### Key AI APIs (50+ Endpoints)

| Category | Endpoints |
|----------|-----------|
| Copilot | `POST /ai/copilot/chat`, `/chat/stream`, `/sessions`, `/context` |
| Trip Planner | `POST /ai/plan/trip`, `/weekend`, `/day`, `/modify` |
| Recommendations | `GET /ai/recommend/nearby`, `/food`, `/attractions`, `/personalized` |
| Travel DNA | `GET /ai/travel-dna`, `/history`, `POST /recalculate` |
| Food DNA | `GET /ai/food-dna`, `/recommendations` |
| Memory | `GET /ai/memory/facts`, `POST /ai/memory/extract` |
| Hidden Gems | `GET /ai/hidden-gems/nearby`, `/discover` |
| Budget | `POST /ai/budget/estimate`, `/optimize` |
| Events | `GET /ai/events/personalized`, `/trending` |
| RAG | `POST /ai/rag/search`, `/answer` |
| Safety | `GET /ai/safety/status`, `/alerts` |
| Forecasting | `GET /ai/forecasts/next-trip`, `/interests` |

### AI Scalability (1B Recommendations)

| Layer | Strategy |
|-------|----------|
| **Pre-computation** | Top 100 recs per active user computed hourly (batch job) |
| **Real-time re-rank** | On request: re-rank top 20 with context (weather, time, location) |
| **Embedding cache** | Common query embeddings cached in Redis (24h TTL) |
| **Model routing** | 80% of requests → Gemini Flash (<2s, $0.003). 20% → GPT-4o (<8s, $0.02) |
| **Response cache** | Identical AI requests within TTL served from Redis |
| **Cost control** | Per-user daily AI budget. Free: 3 plans. Premium: unlimited. |

---

*End of AI Intelligence Ecosystem Blueprint — 23 sections complete.*
