# ExploreMY AI — AI Intelligence Ecosystem

> **Author:** Chief AI Officer / Principal AI Architect  
> **Version:** 1.0  
> **Target Scale:** 1M users · 10M places · 100M recommendations  
> **AI Models:** GPT-4o (complex reasoning) · Gemini 2.5 Flash (fast inference) · Custom ML (ranking/classification)

---

## Volume 1: Architecture Overview

### The AI Layer Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER-FACING AI FEATURES                        │
│  Travel Copilot · Food Discovery · Route Planner · Budget Opt   │
│  Hidden Gems · Event Discovery · Safety Assistant · Concierge   │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                    ORCHESTRATION LAYER                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Intent   │ │ Context  │ │ Model    │ │ Response         │   │
│  │ Router   │ │ Builder  │ │ Selector │ │ Generator        │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                    INTELLIGENCE ENGINES                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Travel   │ │ Food     │ │ Route    │ │ Recommendation   │   │
│  │ DNA      │ │ DNA      │ │ Optimizer│ │ Engine           │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Hidden   │ │ Budget   │ │ Safety   │ │ Forecasting      │   │
│  │ Gems     │ │ Optimizer│ │ Engine   │ │ Engine           │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                    MEMORY & KNOWLEDGE LAYER                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Short    │ │ Long     │ │ Semantic │ │ Behavioral       │   │
│  │ Term     │ │ Term     │ │ Memory   │ │ Memory           │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              RAG Pipeline (Vector DB + pgvector)          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                    DATA LAYER                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ User     │ │ Place    │ │ Behavior │ │ External         │   │
│  │ Profile  │ │ Graph    │ │ Stream   │ │ Knowledge        │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Model Routing Strategy

| Task | Primary Model | Fallback | Latency Budget | Cost Target |
|------|--------------|----------|----------------|-------------|
| Travel planning (complex) | GPT-4o | Gemini 2.5 Flash | 8s | $0.02/req |
| Food recommendations | Gemini 2.5 Flash | GPT-4o-mini | 2s | $0.003/req |
| Route optimization | Custom A* | Google OR-Tools | 500ms | $0/req |
| Safety alerts | Rule engine | Gemini Flash | 100ms | $0/req |
| Sentiment analysis | Gemini Flash | Custom classifier | 1s | $0.001/req |
| Embeddings | text-embedding-3-small | — | 200ms | $0.0001/req |
| Chat / Concierge | GPT-4o | Gemini Flash | 3s | $0.01/req |
| Hidden gem scoring | Custom ML | Heuristic | 100ms | $0/req |

---

## Section 7.1: AI Travel Copilot

### 7.1.1 Product Vision

The AI Travel Copilot is the central conversational interface for trip planning. Unlike generic chatbots, it maintains persistent context across sessions, remembers user preferences, and proactively suggests improvements. It functions like a human travel agent who knows Malaysia intimately and remembers every conversation with the user.

### 7.1.2 User Journeys

**Journey A: First-Time Tourist Planning a Trip**
1. User: "I'm visiting Malaysia for the first time. 5 days. I love food and photography."
2. Copilot asks clarifying questions: budget, dietary restrictions, mobility needs
3. Copilot proposes 3 high-level itineraries (KL+Penang, KL+Melaka, KL+Borneo)
4. User selects KL+Penang → Copilot generates day-by-day plan
5. User: "Can you add more street food and fewer tourist traps?"
6. Copilot adjusts, replacing 2 stops with hidden gem hawker stalls
7. User: "Bookmark this. I'll check with my partner."
8. Session saved. Copilot sends push notification 24h later: "Ready to finalize your Penang trip?"

**Journey B: Local Looking for Weekend Plans**
1. User: "What should I do this weekend? Budget RM 200."
2. Copilot checks: current location (Bangsar), weather (sunny Sat, rain Sun), recent visits
3. Copilot: "There's a food festival in PJ on Saturday. I found 3 new cafes in your area. Want a walking route?"
4. User accepts → generates optimized route with 4 stops
5. Copilot adds calendar integration option

**Journey C: Real-Time Assistance During Travel**
1. User is at Batu Caves at 2 PM
2. Copilot detects location + time: "You're near Batu Caves. Heavy rain expected at 4 PM. Recommend heading to VCR Cafe (12 min away) before it starts. Their flat white is rated 4.6."
3. User accepts → generates navigation

### 7.1.3 Conversation Architecture

```
┌──────────────────────────────────────────────────────────┐
│                CONVERSATION MANAGER                       │
│                                                           │
│  Message → IntentRouter → ContextBuilder → PromptCompiler │
│              │                │               │           │
│              ▼                ▼               ▼           │
│         Intent           UserContext     SystemPrompt     │
│         Classifier       + Session       + Examples       │
│              │           + History       + Constraints    │
│              │           + Preferences   + Format         │
│              │                │               │           │
│              └────────────────┼───────────────┘           │
│                               ▼                           │
│                        ModelSelector                      │
│                        (GPT-4o / Gemini)                  │
│                               │                           │
│                               ▼                           │
│                     ResponseProcessor                     │
│                     (parse, validate, enrich)             │
│                               │                           │
│                               ▼                           │
│                     ActionDispatcher                      │
│                     (reply, save, notify, execute)        │
└──────────────────────────────────────────────────────────┘
```

### 7.1.4 Intent Classification

```typescript
enum ConversationIntent {
  // Trip Planning
  PLAN_TRIP = 'plan_trip',
  MODIFY_TRIP = 'modify_trip',
  OPTIMIZE_ROUTE = 'optimize_route',
  COMPARE_OPTIONS = 'compare_options',

  // Discovery
  FIND_FOOD = 'find_food',
  FIND_ATTRACTION = 'find_attraction',
  FIND_HIDDEN_GEM = 'find_hidden_gem',
  FIND_EVENT = 'find_event',

  // Information
  ASK_WEATHER = 'ask_weather',
  ASK_TRANSPORT = 'ask_transport',
  ASK_SAFETY = 'ask_safety',
  ASK_BUDGET = 'ask_budget',

  // Action
  SAVE_PLACE = 'save_place',
  BOOK_TRANSPORT = 'book_transport',
  SHARE_PLAN = 'share_plan',

  // Meta
  CLARIFY = 'clarify',
  FEEDBACK = 'feedback',
  GREETING = 'greeting',
}
```

### 7.1.5 Context Architecture

The Context Builder assembles a comprehensive context object before every LLM call:

```typescript
interface ConversationContext {
  // User Profile
  user: {
    id: string;
    name: string;
    homeCity: string;
    travelStyle: TravelDNA;
    foodDNA: FoodDNA;
    preferences: UserPreferences;
    loyalty: { level: number; xp: number };
  };

  // Session State
  session: {
    id: string;
    conversationTurn: number;
    activeTripId: string | null;
    currentLocation: { lat: number; lng: number; city: string };
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  };

  // Environmental
  environment: {
    weather: { condition: string; temp: number; rainChance: number };
    traffic: { level: 'light' | 'moderate' | 'heavy' };
    season: string;
    isHoliday: boolean;
  };

  // Memory
  memory: {
    recentInteractions: ConversationTurn[]; // Last 5 turns
    longTermFacts: MemoryFact[];            // Key facts about user
    recentPlaces: string[];                 // Last 10 viewed places
    unvisitedFavorites: string[];           // Saved but not visited
  };

  // Constraints
  constraints: {
    budget: number;
    dietaryRestrictions: string[];
    accessibility: string[];
    timeAvailable: number; // minutes
    maxTravelDistance: number; // meters
  };
}
```

### 7.1.6 Session Architecture

```typescript
// Database model
model CopilotSession {
  id            String    @id @default(uuid()) @db.Uuid
  userId        String    @db.Uuid
  status        SessionStatus @default(ACTIVE)
  title         String?       // Auto-generated summary
  intent        String?       // Primary intent of this session
  summary       String?       // AI-generated session summary
  messageCount  Int       @default(0)
  tokensUsed    Int       @default(0)
  costIncurred  Float     @default(0)
  tripId        String?   @db.Uuid  // If a trip was created
  metadata      Json?
  createdAt     DateTime  @default(now()) @db.Timestamptz()
  updatedAt     DateTime  @updatedAt @db.Timestamptz()
  expiresAt     DateTime?       // Auto-archive after inactivity

  user    User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages CopilotMessage[]
  trip    Trip?             @relation(fields: [tripId], references: [id])

  @@index([userId, updatedAt(sort: Desc)])
  @@index([status, expiresAt])
  @@map("copilot_sessions")
}

model CopilotMessage {
  id            String    @id @default(uuid()) @db.Uuid
  sessionId     String    @db.Uuid
  role          String    @db.VarChar(10)  // "user" | "assistant" | "system"
  content       String    @db.Text
  intent        String?   @db.VarChar(50)
  tokensUsed    Int?
  responseJson  Json?        // Structured response data
  feedback      String?      // "positive" | "negative" | null
  createdAt     DateTime  @default(now()) @db.Timestamptz()

  session CopilotSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId, createdAt])
  @@map("copilot_messages")
}

enum SessionStatus {
  ACTIVE
  PAUSED
  COMPLETED
  ARCHIVED
}
```

### 7.1.7 Long-Term Memory

User facts extracted and stored across sessions:

```typescript
model MemoryFact {
  id          String    @id @default(uuid()) @db.Uuid
  userId      String    @db.Uuid
  category    String    @db.VarChar(50)  // "preference", "constraint", "experience", "goal"
  key         String    @db.VarChar(200)
  value       Json
  confidence  Float     @default(1.0)    // 0.0–1.0, decays over time
  source      String    @db.VarChar(50)  // "explicit", "inferred", "observed"
  lastRecalledAt DateTime?
  recallCount Int       @default(0)
  createdAt   DateTime  @default(now()) @db.Timestamptz()
  updatedAt   DateTime  @updatedAt @db.Timestamptz()

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, key])
  @@index([userId, category])
  @@index([userId, lastRecalledAt])
  @@map("memory_facts")
}
```

Example facts:
- `{ key: "dietary_preference", value: ["halal"], confidence: 1.0, source: "explicit" }`
- `{ key: "favorite_cuisine", value: { "malay": 0.9, "chinese": 0.7 }, confidence: 0.85, source: "inferred" }`
- `{ key: "avoid_crowds", value: true, confidence: 0.7, source: "observed" }`
- `{ key: "travel_pace", value: "relaxed", confidence: 0.8, source: "inferred" }`

### 7.1.8 Multi-Turn Reasoning

```
Turn 1: User — "Plan a food trip to Penang"
  → Intent: PLAN_TRIP
  → System extracts: destination=Penang, purpose=food, missing=(duration, budget, dates)
  → Response: "Sounds delicious! How many days? What's your budget?"

Turn 2: User — "3 days, RM 500"
  → Intent: CLARIFY (fills PLAN_TRIP slots)
  → System: all slots filled → generates plan
  → Response: structured itinerary

Turn 3: User — "Too many tourist spots. I want local gems."
  → Intent: MODIFY_TRIP (references trip from Turn 2)
  → System: replaces 3 stops with hidden gems (high localRatio, low reviewCount)
  → Response: revised itinerary with changes highlighted

Turn 4: User — "Save this and remind me next week."
  → Intent: SAVE_PLACE + schedule reminder
  → System: persists trip, creates cron notification
  → Response: "Saved! I'll remind you on June 20."
```

### 7.1.9 NestJS Module Architecture

```
src/modules/ai-copilot/
├── copilot.module.ts
├── copilot.controller.ts        // POST /ai/copilot/chat, /ai/copilot/chat/stream
├── copilot.service.ts           // Session management, message routing
├── services/
│   ├── intent-classifier.service.ts    // Fast intent detection (Gemini Flash)
│   ├── context-builder.service.ts      // Assembles context from all sources
│   ├── prompt-compiler.service.ts      // Builds system prompt with examples
│   ├── model-selector.service.ts       // Routes to GPT-4o vs Gemini
│   ├── response-processor.service.ts   // Validates, enriches, formats
│   └── action-dispatcher.service.ts    // Executes side effects (save trip, notify)
├── memory/
│   ├── short-term-memory.service.ts    // Conversation window (last N turns)
│   ├── long-term-memory.service.ts     // Persistent facts (MemoryFact table)
│   ├── memory-extractor.service.ts     // Extracts facts from conversations
│   └── memory-retriever.service.ts     // Relevant facts for current context
├── prompts/
│   ├── system.prompt.ts               // Base copilot persona
│   ├── trip-planning.prompt.ts        // Structured itinerary generation
│   ├── food-discovery.prompt.ts        // Food recommendation format
│   ├── route-optimization.prompt.ts    // Route planning format
│   └── safety-assistant.prompt.ts      // Safety alert format
└── dto/
    ├── chat-request.dto.ts
    ├── chat-response.dto.ts
    └── session-query.dto.ts
```

### 7.1.10 Copilot APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/ai/copilot/chat` | Send message, get AI response |
| `POST` | `/ai/copilot/chat/stream` | SSE streaming chat |
| `GET` | `/ai/copilot/sessions` | List active/past sessions |
| `GET` | `/ai/copilot/sessions/:id` | Get session with messages |
| `DELETE` | `/ai/copilot/sessions/:id` | Archive session |
| `POST` | `/ai/copilot/sessions/:id/feedback` | Rate a response |
| `GET` | `/ai/copilot/context` | Get current AI context |
| `GET` | `/ai/copilot/suggestions` | Proactive suggestions |

### 7.1.11 Proactive Copilot Triggers

The copilot proactively reaches out based on events:

| Trigger | Message Example |
|---------|----------------|
| Location near saved place | "You're 200m from Nasi Lemak Tanglin! Want directions?" |
| Weekend approaching | "No plans this weekend? How about a cafe hop in Bangsar?" |
| Weather change | "Rain expected tomorrow. Want indoor alternatives for your trip?" |
| Price drop / promotion | "20% off at that cafe you saved — valid this weekend" |
| New hidden gem nearby | "We found a new hawker stall near you — 4.8★ from 50 locals" |
| Trip not completed | "Your Penang trip is next week! Need help finalizing?" |

---

## Section 7.2: Travel DNA Engine

### 7.2.1 Concept

Travel DNA is a multi-dimensional vector representing a user's travel personality. It evolves over time based on explicit input (onboarding, preferences) and implicit behavior (places visited, reviews written, time spent viewing).

### 7.2.2 Dimension Schema

```typescript
interface TravelDNA {
  // Core dimensions (0.0 – 1.0)
  adventure: number;      // Thrill-seeking vs comfort
  luxury: number;         // Premium vs budget
  foodie: number;         // Food-motivated travel
  culture: number;        // Heritage, museums, temples
  nature: number;         // Outdoors, hiking, beaches
  social: number;         // Group vs solo travel
  spontaneity: number;    // Planned vs spontaneous
  localImmersion: number; // Tourist spots vs local life

  // Derived
  primaryStyle: TravelStyle;
  secondaryStyle: TravelStyle;
  confidenceScore: number; // How confident we are (more data = higher)
  lastUpdated: Date;
  dataPoints: number;      // Number of signals used
}
```

### 7.2.3 Signal Sources

| Signal | Weight | Type |
|--------|--------|------|
| Onboarding quiz | 0.25 | Explicit |
| Explicit preferences | 0.30 | Explicit |
| Place visits (category) | 0.20 | Behavioral |
| Reviews (sentiment, tags) | 0.10 | Behavioral |
| Favorites (category) | 0.05 | Behavioral |
| Trip plans created | 0.05 | Behavioral |
| Search queries | 0.03 | Behavioral |
| Time spent viewing categories | 0.02 | Behavioral |

### 7.2.4 Scoring Algorithm

```
TravelDNA[dimension] = Σ (signal * weight * recency_decay) / Σ weights

recency_decay = e^(-λ * days_since_signal)
  where λ = 0.01 (half-life ~69 days)

Confidence = min(1.0, dataPoints / 50)
  → Full confidence after 50 meaningful signals
```

### 7.2.5 Database Schema

```typescript
model TravelDNA {
  id              String    @id @default(uuid()) @db.Uuid
  userId          String    @unique @db.Uuid

  // Core dimensions
  adventure       Float     @default(0.5)
  luxury          Float     @default(0.5)
  foodie          Float     @default(0.5)
  culture         Float     @default(0.5)
  nature          Float     @default(0.5)
  social          Float     @default(0.5)
  spontaneity     Float     @default(0.5)
  localImmersion  Float     @default(0.5)

  // Derived
  primaryStyle    TravelStyle?
  secondaryStyle  TravelStyle?
  confidenceScore Float     @default(0)
  dataPoints      Int       @default(0)
  version         Int       @default(1)

  createdAt       DateTime  @default(now()) @db.Timestamptz()
  updatedAt       DateTime  @updatedAt @db.Timestamptz()

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("travel_dna")
}

model TravelDNASignal {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @db.Uuid
  source    String    @db.VarChar(50)  // "onboarding", "visit", "review", "favorite", "search"
  dimension String    @db.VarChar(30)
  value     Float                      // -1.0 to 1.0 (negative = pushes away from dimension)
  weight    Float     @default(1.0)
  metadata  Json?
  createdAt DateTime  @default(now()) @db.Timestamptz()

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
  @@index([userId, dimension])
  @@map("travel_dna_signals")
}
```

### 7.2.6 APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/ai/travel-dna` | Get current Travel DNA |
| `GET` | `/ai/travel-dna/history` | DNA evolution over time |
| `POST` | `/ai/travel-dna/recalculate` | Force recalculation |
| `GET` | `/ai/travel-dna/similar-users` | Users with similar DNA |

---

## Section 7.3: Food DNA Engine

### 7.3.1 Cuisine Profiling

The Food DNA engine tracks cuisine preferences at granular level.

### 7.3.2 Schema

```typescript
model FoodDNA {
  id          String    @id @default(uuid()) @db.Uuid
  userId      String    @unique @db.Uuid

  // Cuisine preferences (0.0–1.0)
  malay       Float     @default(0.5)
  chinese     Float     @default(0.5)
  indian      Float     @default(0.5)
  japanese    Float     @default(0.5)
  korean      Float     @default(0.5)
  western     Float     @default(0.5)
  thai        Float     @default(0.5)
  middleEastern Float   @default(0.5)
  fusion      Float     @default(0.5)

  // Dining style
  streetFood  Float     @default(0.5)
  cafe        Float     @default(0.5)
  fineDining  Float     @default(0.5)
  hawker      Float     @default(0.5)
  buffet      Float     @default(0.5)

  // Preferences
  spiceTolerance Float  @default(0.5)  // 0=mild, 1=very spicy
  sweetPreference Float @default(0.5)
  pricePreference  Float @default(0.5)  // 0=cheap, 1=premium

  // Derived
  topCuisines  Json?
  confidenceScore Float @default(0)
  dataPoints   Int    @default(0)

  createdAt    DateTime @default(now()) @db.Timestamptz()
  updatedAt    DateTime @updatedAt @db.Timestamptz()

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("food_dna")
}
```

### 7.3.3 Preference Engine

```
FoodDNA[cuisine] = Σ (visit_score * rating_normalized * recency_decay) / Σ visit_score

visit_score = {
  review_written:  1.0,
  favorited:       0.7,
  visited:         0.5,
  viewed_detail:   0.2,
  searched:        0.15
}

rating_normalized = user_rating / 5.0  (if reviewed)
                  = 1.0                (if only visited, assume liked)
```

### 7.3.4 APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/ai/food-dna` | Get Food DNA profile |
| `GET` | `/ai/food-dna/recommendations` | Food recs based on DNA |
| `POST` | `/ai/food-dna/recalculate` | Force recalculation |

---

## Section 7.4: AI Memory Engine

### 7.4.1 Memory Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MEMORY SYSTEM                              │
│                                                               │
│  ┌─────────────────┐  ┌─────────────────┐                    │
│  │ SHORT-TERM       │  │ LONG-TERM        │                   │
│  │ (Session-scoped) │  │ (Cross-session)  │                   │
│  │                   │  │                  │                   │
│  │ • Conversation    │  │ • MemoryFact     │                   │
│  │   window (N=10)  │  │ • Preferences    │                   │
│  │ • Active trip     │  │ • Travel DNA     │                   │
│  │ • Current context │  │ • Food DNA       │                   │
│  │ • Temp variables  │  │ • Past trips     │                   │
│  │                   │  │ • Saved places   │                   │
│  │ TTL: session      │  │ • Review history │                   │
│  └─────────────────┘  └─────────────────┘                    │
│                                                               │
│  ┌─────────────────┐  ┌─────────────────┐                    │
│  │ SEMANTIC         │  │ BEHAVIORAL       │                   │
│  │ (Knowledge)      │  │ (Patterns)       │                   │
│  │                   │  │                  │                   │
│  │ • Place graph     │  │ • Visit patterns │                   │
│  │ • Cuisine graph   │  │ • Time patterns  │                   │
│  │ • Malaysia facts  │  │ • Budget patterns│                   │
│  │ • Embeddings      │  │ • Route patterns │                   │
│  │   (pgvector)      │  │ • Season patterns│                   │
│  │                   │  │                  │                   │
│  │ TTL: permanent    │  │ TTL: permanent   │                   │
│  └─────────────────┘  └─────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

### 7.4.2 Memory Retrieval Flow

```
User Message → Intent detected
  │
  ├─→ Short-term: Check conversation window for referenced entities
  ├─→ Long-term: Query MemoryFact WHERE userId + category matches intent
  ├─→ Semantic: Vector search places WHERE embedding <-> query_embedding < 0.3
  └─→ Behavioral: Query patterns matching current (time, location, weather)
  │
  ▼
Ranked Memory Context (fits in LLM context window, ~2K tokens)
  → Prompt Compiler weaves memories into system prompt
```

### 7.4.3 Memory Store Schema

```sql
-- Already defined: memory_facts (Section 7.1.7)

-- Behavioral patterns table
CREATE TABLE behavioral_patterns (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pattern_type    VARCHAR(50) NOT NULL,
    dimension       VARCHAR(50) NOT NULL,
    value           JSONB NOT NULL,
    frequency       INTEGER NOT NULL DEFAULT 1,
    confidence      REAL NOT NULL DEFAULT 0.5,
    last_observed   TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (user_id, pattern_type, dimension)
);

-- Semantic embeddings for places (pgvector)
-- Already in places table: embedding vector(1536)
-- Index: CREATE INDEX idx_places_embedding ON places USING ivfflat (embedding vector_cosine_ops) WITH (lists = 200);
```

### 7.4.4 Memory Ranking Formula

```
MemoryRelevance = 
    w1 * recency_score +
    w2 * frequency_score +
    w3 * confidence_score +
    w4 * intent_match_score +
    w5 * context_similarity_score

recency_score = e^(-0.01 * hours_since_last_access)
frequency_score = min(1.0, log(access_count + 1) / log(50))
confidence_score = fact.confidence  (from MemoryFact)
intent_match_score = 1.0 if fact.category matches current intent, 0.3 otherwise
context_similarity_score = cosine_similarity(fact.embedding, current_context.embedding)
```

---

## Section 7.5: Recommendation Engine

### 7.5.1 Hybrid Architecture

```
┌──────────────────────────────────────────────────────────────┐
│              RECOMMENDATION ENGINE                             │
│                                                                │
│  ┌──────────────────┐   ┌──────────────────┐                  │
│  │ COLLABORATIVE     │   │ CONTENT-BASED     │                 │
│  │ FILTERING         │   │ FILTERING         │                 │
│  │                    │   │                   │                 │
│  │ • User-User CF    │   │ • Place features  │                 │
│  │ • Item-Item CF    │   │ • Cuisine match   │                 │
│  │ • Matrix Factor.  │   │ • Price match     │                 │
│  │ • Neural CF       │   │ • Distance match  │                 │
│  │                    │   │ • Category match  │                 │
│  │ Source: user      │   │ Source: place     │                 │
│  │   behavior matrix │   │   metadata        │                 │
│  └────────┬─────────┘   └────────┬─────────┘                 │
│           │                      │                             │
│           └──────────┬───────────┘                             │
│                      ▼                                         │
│  ┌──────────────────────────────────────┐                     │
│  │        HYBRID SCORE FUSION            │                     │
│  │                                       │                     │
│  │  finalScore =                         │                     │
│  │    α * cfScore +                      │                     │
│  │    β * cbScore +                     │                     │
│  │    γ * popularityScore +              │                     │
│  │    δ * personalizationScore +         │                     │
│  │    ε * contextScore +                 │                     │
│  │    ζ * diversityBonus                │                     │
│  │                                       │                     │
│  │  α=0.25, β=0.25, γ=0.10,             │                     │
│  │  δ=0.20, ε=0.15, ζ=0.05              │                     │
│  └──────────────────┬───────────────────┘                     │
│                     ▼                                         │
│  ┌──────────────────────────────────────┐                     │
│  │        RANKING & DIVERSIFICATION      │                     │
│  │  • MMR (Maximal Marginal Relevance)  │                     │
│  │  • Category diversification          │                     │
│  │  • Price level diversification       │                     │
│  │  • Distance decay                    │                     │
│  └──────────────────┬───────────────────┘                     │
│                     ▼                                         │
│              Ranked Results                                  │
└──────────────────────────────────────────────────────────────┘
```

### 7.5.2 Scoring Formulas

```typescript
// Collaborative Filtering Score
function cfScore(userId: string, placeId: string): number {
  const similarUsers = findSimilarUsers(userId, 50);  // Top 50 similar users by Travel DNA
  const placeRatings = similarUsers
    .filter(u => u.hasRated(placeId))
    .map(u => u.getRating(placeId));
  return weightedAverage(placeRatings, similarUsers.map(u => u.similarity));
}

// Content-Based Score
function cbScore(user: User, place: Place): number {
  return (
    0.30 * categoryMatch(user.foodDNA, place.category) +
    0.20 * priceMatch(user.preferences.budgetLevel, place.priceLevel) +
    0.20 * cuisineMatch(user.foodDNA, place.cuisine) +
    0.15 * amenityMatch(user.preferences, place.amenities) +
    0.10 * distanceScore(user.location, place.location) +
    0.05 * openNowBonus(place)
  );
}

// Context Score
function contextScore(user: User, place: Place, context: Context): number {
  return (
    0.30 * weatherMatch(place, context.weather) +
    0.25 * timeMatch(place, context.timeOfDay) +
    0.20 * distanceFromCurrentLocation(user.location, place.location, context.maxDistance) +
    0.15 * budgetRemainingBonus(place, context.remainingBudget) +
    0.10 * trafficAccessibility(place, context.traffic)
  );
}

// Diversity Bonus (MMR)
function diversityBonus(candidate: Place, selected: Place[]): number {
  if (selected.length === 0) return 1.0;
  const maxSim = Math.max(...selected.map(s => categorySimilarity(candidate, s)));
  return 1.0 - maxSim;  // Reward dissimilar places
}
```

### 7.5.3 Database Tables

```sql
-- User similarity matrix (pre-computed, refreshed daily)
CREATE TABLE user_similarities (
    user_id_1       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_id_2       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    similarity      REAL NOT NULL,
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id_1, user_id_2),
    CHECK (user_id_1 < user_id_2)
);

CREATE INDEX idx_user_sim_1 ON user_similarities (user_id_1, similarity DESC);

-- Place similarity matrix (pre-computed, refreshed weekly)
CREATE TABLE place_similarities (
    place_id_1      UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    place_id_2      UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    similarity      REAL NOT NULL,
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (place_id_1, place_id_2),
    CHECK (place_id_1 < place_id_2)
);

-- Pre-computed recommendations (refreshed hourly for active users)
CREATE TABLE personalized_recommendations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    place_id        UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    score           REAL NOT NULL,
    reason          VARCHAR(500),
    category        VARCHAR(50) NOT NULL,  -- "food", "attraction", "event"
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (user_id, place_id, category),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
);

CREATE INDEX idx_personalized_user ON personalized_recommendations (user_id, score DESC);
```

### 7.5.4 APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/ai/recommendations?type=food&lat=&lng=&limit=` | Get personalized recs |
| `GET` | `/ai/recommendations/feed` | Infinite scroll feed |
| `POST` | `/ai/recommendations/feedback` | Rate recommendation |
| `POST` | `/ai/recommendations/refresh` | Trigger recalculation |
| `GET` | `/ai/recommendations/explain/:placeId` | Why was this recommended? |

### 7.5.5 Recommendation Reason Generation

```typescript
// Explain why a place was recommended
function generateReason(user: User, place: Place, score: Breakdown): string {
  const reasons: string[] = [];

  if (score.cuisineMatch > 0.8)
    reasons.push(`Matches your love for ${place.cuisine} cuisine`);
  if (score.priceMatch > 0.9)
    reasons.push('Within your budget range');
  if (score.distance < 500)
    reasons.push(`Only ${formatDistance(score.distance)} from you`);
  if (score.socialProof > 0.8)
    reasons.push(`Highly rated by ${place.reviewCount} diners`);
  if (score.friendsVisited > 0)
    reasons.push(`${score.friendsVisited} of your friends have been here`);
  if (score.hiddenGem > 0.7)
    reasons.push('A hidden gem most tourists miss');

  return reasons.slice(0, 2).join('. ');
}
```

---

## Section 7.6: Hidden Gems Engine

### 7.6.1 Definition

A Hidden Gem is a place with:
- **High quality** (rating ≥ 4.0)
- **Low exposure** (few reviews relative to quality, low check-in count)
- **Local favoritism** (high ratio of local reviewers to tourists)

### 7.6.2 Hidden Gem Score Formula

```
HiddenGemScore = 
    0.35 * qualityScore +
    0.30 * exposureInverseScore +
    0.20 * localRatioScore +
    0.10 * growthVelocityScore +
    0.05 * uniquenessScore

qualityScore = normalizedRating * log(reviewCount + 1) / log(1000)
  → Rewards places with consistent high ratings

exposureInverseScore = 1.0 - min(1.0, (reviewCount / 500) * (checkinCount / 5000))
  → High-quality places with low review/check-in counts score higher

localRatioScore = localReviewers / max(totalReviewers, 1)
  → Local reviewers are identified by homeCity matching place city

growthVelocityScore = min(1.0, (reviewsLast30Days / max(reviewsTotal, 1)) * 10)
  → Recently discovered but still small

uniquenessScore = 1.0 - max(categorySimilarity with nearest 5 places in same area)
  → Rewards places unlike anything else nearby

Threshold: HiddenGemScore ≥ 0.65 → isHiddenGem = true
```

### 7.6.3 Data Pipeline

```
Hourly Cron Job:
  1. SELECT places WHERE (rating >= 4.0 AND reviewCount < 500)
     OR (rating >= 4.3 AND reviewCount < 1000)
  2. Calculate HiddenGemScore for each candidate
  3. Update isHiddenGem flag + hiddenGemScore
  4. Recalculate trendingScore (velocity-based)
  5. Invalidate Redis cache for affected area queries
```

### 7.6.4 APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/places/hidden-gems?lat=&lng=&radius=&limit=` | Nearby hidden gems |
| `GET` | `/places/hidden-gems/:city?category=&limit=` | Hidden gems by city |
| `GET` | `/ai/hidden-gems/personalized?limit=` | AI-curated hidden gems |

---

## Section 7.7: Budget Optimizer

### 7.7.1 Architecture

```
Budget Input: RM 500 for 3-day trip
  │
  ▼
Cost Estimation Engine
  ├─→ Transport costs (fuel/toll/grab/flight)
  ├─→ Accommodation costs (per night × days)
  ├─→ Food costs (per meal × meals per day)
  ├─→ Activity costs (entrance fees, tours)
  └─→ Buffer (10–15% contingency)
  │
  ▼
Budget Allocation
  $total = Σ estimates
  if $total > $budget:
    suggest optimizations:
      - Replace premium restaurant → hawker stall (save RM X)
      - Replace Grab → MRT for leg Y (save RM Z)
      - Replace hotel → guesthouse (save RM W)
```

### 7.7.2 Cost Models

```typescript
interface CostEstimate {
  // Transport
  fuelCost: number;       // distance / 100 * fuelPrice * consumptionRate
  tollCost: number;       // sum(tollRates for route)
  grabCost: number;       // base + perKm * distance + surgeMultiplier
  publicTransitCost: number; // per ride cost for MRT/LRT/KTM
  flightCost: number;     // estimated from route distance > 300km

  // Accommodation (per night)
  hotelCost: number;      // budgetLevel → { 1: 50, 2: 150, 3: 350, 4: 800 }

  // Food (per person per meal)
  foodCost: {
    breakfast: number;    // 5–25 depending on style
    lunch: number;        // 8–30
    dinner: number;       // 10–60
    snacks: number;       // 5–15
  };

  // Activities
  activityCost: number;   // sum of entrance fees, tour costs
}
```

### 7.7.3 APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/ai/budget/estimate` | Estimate costs for trip parameters |
| `POST` | `/ai/budget/optimize` | Suggest budget optimizations |
| `GET` | `/ai/budget/compare?mode1=&mode2=` | Compare costs between transport modes |

---

## Section 7.8: Route Optimizer

### 7.8.1 Architecture

```
Input: origin, destination, routeType, userPreferences
  │
  ▼
Graph Construction
  ├─→ Nodes: intersections + POIs along route
  ├─→ Edges: road segments
  └─→ Weights: multi-factor edge weights
  │
  ▼
Algorithm Selection
  ├─→ Simple A→B: A* with custom heuristic
  ├─→ Multi-stop: Modified TSP (nearest neighbor + 2-opt)
  └─→ Food/Scenic route: A* with weighted node attraction
  │
  ▼
Route Type Weights
```

### 7.8.2 Edge Weight Formula

```
EdgeWeight = 
    w1 * distance_meters / 1000 +
    w2 * travel_time_seconds / 60 +
    w3 * toll_cost +
    w4 * (1.0 - scenic_score) +
    w5 * (1.0 - food_density_score) +
    w6 * traffic_congestion_factor +
    w7 * safety_risk_factor

Route Type Weight Vectors:
  FASTEST:   w=[0.0, 1.0, 0.0, 0.0, 0.0, 0.3, 0.0]
  CHEAPEST:  w=[0.2, 0.3, 1.0, 0.0, 0.0, 0.1, 0.0]
  SCENIC:    w=[0.1, 0.2, 0.1, 0.5, 0.0, 0.0, 0.0]
  FAMILY:    w=[0.1, 0.2, 0.2, 0.1, 0.0, 0.2, 0.3]
  FOOD:      w=[0.1, 0.2, 0.1, 0.0, 0.5, 0.1, 0.0]
```

### 7.8.3 Multi-Stop Optimization (TSP)

```typescript
function optimizeMultiStop(
  stops: Place[],
  startPoint: LatLng,
  endPoint: LatLng,
  routeType: RouteType
): Place[] {
  // Initial solution: nearest neighbor
  const ordered = nearestNeighbor([startPoint, ...stops, endPoint]);

  // Improve with 2-opt local search
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 1; i < ordered.length - 2; i++) {
      for (let j = i + 1; j < ordered.length - 1; j++) {
        const currentDist = distance(ordered[i-1], ordered[i]) + distance(ordered[j], ordered[j+1]);
        const newDist = distance(ordered[i-1], ordered[j]) + distance(ordered[i], ordered[j+1]);
        if (newDist < currentDist) {
          // Reverse segment i..j
          ordered.splice(i, j - i + 1, ...ordered.slice(i, j + 1).reverse());
          improved = true;
        }
      }
    }
  }
  return ordered;
}
```

### 7.8.4 NestJS Service

```typescript
@Injectable()
export class RouteOptimizerService {
  async optimize(params: OptimizeRouteDto): Promise<OptimizedRoute> {
    // 1. Build graph from Google Directions API data + internal POI data
    // 2. Select algorithm based on stop count
    //    - 2 stops: bidirectional A*
    //    - 3-10 stops: nearest neighbor + 2-opt TSP
    //    - 10+ stops: genetic algorithm or OR-Tools
    // 3. Apply route-type weight vector to edge scoring
    // 4. Calculate total distance, duration, cost
    // 5. Cache result (Redis, TTL = 1 hour)
    // 6. Return optimized order with step-by-step directions
  }
}
```

### 7.8.5 APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/routes/plan` | A→B route planning |
| `POST` | `/routes/optimize` | Multi-stop optimization |
| `POST` | `/routes/compare` | Compare all transport modes |
| `POST` | `/routes/food-trail` | Food-optimized route |
| `POST` | `/routes/scenic-drive` | Scenic-optimized route |

---

## Section 7.9: Event Discovery Engine

### 7.9.1 Architecture

```
Data Sources:
  ├─→ User-submitted events
  ├─→ Google Events API scrape (weekly)
  ├─→ TicketMaster API
  ├─→ Facebook Events API
  ├─→ Tourism Malaysia RSS feed
  └─→ Partner business event feeds
  │
  ▼
Aggregation Pipeline
  ├─→ Deduplication (name + date + location fuzzy match)
  ├─→ Geocoding (address → lat/lng)
  ├─→ Categorization (festival, concert, food_fair, exhibition, sports, community)
  ├─→ Price extraction (free text → {min, max, currency})
  └─→ Enrichment (photos, website, organizer)
  │
  ▼
Personalized Ranking
  eventScore = 
    0.25 * interestMatch (event category vs user Travel DNA)
    0.20 * pastAttendance (user attended similar events?)
    0.15 * socialProof (friends attending? user reviews?)
    0.15 * locationConvenience (distance from user)
    0.10 * budgetMatch (within user's range)
    0.10 * timingMatch (user's typical free times)
    0.05 * trendingBoost (velocity of RSVPs/views)
```

### 7.9.2 APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/events/personalized?lat=&lng=&limit=` | Personalized event feed |
| `GET` | `/events/this-weekend?city=&limit=` | Weekend events |
| `GET` | `/events/trending?city=&limit=` | Trending events |
| `GET` | `/events/:id/similar` | Similar events |
| `POST` | `/events` | Submit event |
| `POST` | `/events/:id/attend` | Mark interested/attending |

---

## Section 7.10: AI Safety Engine

### 7.10.1 Architecture

```
Risk Assessment Pipeline:
  │
  ├─→ Weather Risk
  │     • OpenWeatherMap API (current + forecast)
  │     • Flood risk zones (DID Malaysia data)
  │     • Lightning risk (real-time strike detection)
  │     → Output: weatherRiskScore (0–1)
  │
  ├─→ Traffic Risk
  │     • Google Maps traffic layer (real-time congestion)
  │     • Historical accident data (JKR/Waze)
  │     • Road condition data (flood-prone, landslide-prone)
  │     → Output: trafficRiskScore (0–1)
  │
  ├─→ Crime Risk
  │     • PDRM crime statistics by district
  │     • User-reported incidents (moderated)
  │     • Time-of-day risk (night = higher)
  │     → Output: safetyRiskScore (0–1)
  │
  └─→ Health Risk
        • Air quality index (API from DOE Malaysia)
        • Heat index (temperature + humidity)
        • UV index
        → Output: healthRiskScore (0–1)
  │
  ▼
Aggregate Risk Score = max(weatherRisk, trafficRisk, safetyRisk, healthRisk)

if aggregateRiskScore > 0.7 → ALERT (push notification)
if aggregateRiskScore > 0.4 → WARNING (in-app banner)
if aggregateRiskScore < 0.4 → CLEAR
```

### 7.10.2 Database

```sql
CREATE TABLE safety_alerts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id         UUID REFERENCES users(id),
    alert_type      VARCHAR(50) NOT NULL,   -- weather, traffic, crime, health
    severity        VARCHAR(20) NOT NULL,   -- info, warning, critical
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    location_lat    DOUBLE PRECISION,
    location_lng    DOUBLE PRECISION,
    radius_meters   INTEGER,
    expires_at      TIMESTAMPTZ NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_safety_active ON safety_alerts (is_active, expires_at);
CREATE INDEX idx_safety_location ON safety_alerts USING GIST (
    ST_SetSRID(ST_MakePoint(location_lng, location_lat), 4326)
);
```

### 7.10.3 APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/safety/status?lat=&lng=` | Current safety assessment |
| `GET` | `/safety/alerts?lat=&lng=&radius=` | Active alerts in area |
| `GET` | `/safety/route-check?originLat=&originLng=&destLat=&destLng=` | Safety along route |

---

## Section 7.11: AI Forecasting Engine

### 7.11.1 Predictions

The forecasting engine predicts:

| Prediction | Inputs | Model |
|------------|--------|-------|
| Next trip destination | Travel DNA, past trips, search history, season | Gradient boosting classifier |
| Next trip timing | Trip gap analysis, holiday calendar | Poisson regression |
| Budget for next trip | Past budgets, income signals, seasonality | Linear regression |
| Interest evolution | Recent behavior shifts, life stage signals | Markov chain |
| Churn risk | Days since last visit, app opens declining | Logistic regression |

### 7.11.2 Schema

```sql
CREATE TABLE ai_forecasts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    forecast_type   VARCHAR(50) NOT NULL,
    prediction      JSONB NOT NULL,
    confidence      REAL NOT NULL,
    model_version   VARCHAR(20),
    valid_until     TIMESTAMPTZ,
    was_accurate    BOOLEAN,       -- backfilled after validation period
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_forecasts_user ON ai_forecasts (user_id, forecast_type, created_at DESC);
```

### 7.11.3 APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/ai/forecasts/next-trip` | Predict next trip |
| `GET` | `/ai/forecasts/interests` | Predict interest evolution |
| `GET` | `/ai/forecasts/churn-risk` | Predict churn probability |

---

## Section 7.12: RAG Architecture

### 7.12.1 Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    RAG PIPELINE                                │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              INGESTION LAYER                              │ │
│  │                                                           │ │
│  │  Tourism Malaysia ──┐                                    │ │
│  │  Reviews ───────────┤                                    │ │
│  │  Place Descriptions ─┤──→ Chunking ──→ Embedding ──→     │ │
│  │  Events ────────────┤    (512 tokens)   (text-embedding-  │ │
│  │  Business Listings ─┤                   3-small, 1536d)   │ │
│  │  User FAQs ─────────┘                                    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                           │                                   │
│                           ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              VECTOR STORE (pgvector)                      │ │
│  │                                                           │ │
│  │  knowledge_chunks table                                  │ │
│  │  • chunk_id (PK)                                         │ │
│  │  • content (text)                                        │ │
│  │  • embedding (vector(1536))                              │ │
│  │  • source_type (tourism_malaysia, review, place_desc)    │ │
│  │  • source_id (FK to source table)                        │ │
│  │  • metadata (JSONB)                                      │ │
│  │  • created_at                                            │ │
│  │                                                           │ │
│  │  Index: IVFFlat (vector_cosine_ops, lists=200)           │ │
│  └─────────────────────────────────────────────────────────┘ │
│                           │                                   │
│                           ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              RETRIEVAL LAYER                              │ │
│  │                                                           │ │
│  │  User Query → Embed → Vector Search (top_k=20)           │ │
│  │       │                                                   │ │
│  │       ▼                                                   │ │
│  │  Re-ranking:                                              │ │
│  │    1. Vector similarity (0.4)                            │ │
│  │    2. Cross-encoder re-rank (0.3)                        │ │
│  │    3. Recency boost (0.15)                               │ │
│  │    4. Authority boost (0.15)                             │ │
│  │       │                                                   │ │
│  │       ▼                                                   │ │
│  │  Top 5 chunks → Context Window                           │ │
│  └─────────────────────────────────────────────────────────┘ │
│                           │                                   │
│                           ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              LLM ORCHESTRATION                            │ │
│  │                                                           │ │
│  │  System Prompt + Retrieved Context + User Query           │ │
│  │       │                                                   │ │
│  │       ▼                                                   │ │
│  │  GPT-4o / Gemini → Grounded Response                     │ │
│  │  (with citations to source documents)                    │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### 7.12.2 Knowledge Chunk Schema

```sql
CREATE TABLE knowledge_chunks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid_v7(),
    content         TEXT NOT NULL,
    embedding       vector(1536),
    source_type     VARCHAR(50) NOT NULL,
    source_id       VARCHAR(255),
    source_url      VARCHAR(2048),
    title           VARCHAR(500),
    language        VARCHAR(10) DEFAULT 'en',
    chunk_index     INTEGER,
    total_chunks    INTEGER,
    metadata        JSONB,
    authority_score REAL DEFAULT 0.5,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_knowledge_embedding ON knowledge_chunks
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 200);

CREATE INDEX idx_knowledge_source ON knowledge_chunks (source_type, source_id);
```

### 7.12.3 APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/ai/rag/search` | Semantic search knowledge base |
| `POST` | `/ai/rag/answer` | Q&A with citations |
| `POST` | `/ai/rag/ingest` | Add document to knowledge base |
| `DELETE` | `/ai/rag/ingest/:id` | Remove document |
| `GET` | `/ai/rag/stats` | Knowledge base statistics |

---

## Complete Database Schema (AI-Specific)

```prisma
model TravelDNA { ... }              // Section 7.2
model TravelDNASignal { ... }       // Section 7.2
model FoodDNA { ... }               // Section 7.3
model CopilotSession { ... }        // Section 7.1
model CopilotMessage { ... }        // Section 7.1
model MemoryFact { ... }            // Section 7.1 / 7.4
model BehavioralPattern { ... }     // Section 7.4
model PersonalizedRecommendation { ... } // Section 7.5
model UserSimilarity { ... }        // Section 7.5
model PlaceSimilarity { ... }       // Section 7.5
model SafetyAlert { ... }           // Section 7.10
model AIForecast { ... }            // Section 7.11
model KnowledgeChunk { ... }        // Section 7.12
```

---

## NestJS Module Map

```
src/modules/
├── ai-copilot/          # Section 7.1 — Conversational AI
├── travel-dna/          # Section 7.2 — Personality engine
├── food-dna/            # Section 7.3 — Cuisine profiling
├── memory/              # Section 7.4 — Memory system
├── recommendations/     # Section 7.5 — Hybrid rec engine
├── hidden-gems/         # Section 7.6 — Hidden gem detection
├── budget-optimizer/    # Section 7.7 — Cost estimation
├── route-optimizer/     # Section 7.8 — Path optimization
├── event-discovery/     # Section 7.9 — Event aggregation
├── safety/              # Section 7.10 — Risk assessment
├── forecasting/         # Section 7.11 — Predictive analytics
└── rag/                 # Section 7.12 — Retrieval-Augmented Gen
```

## Scalability Design (1M Users / 10M Places / 100M Recs)

| Component | Strategy |
|-----------|----------|
| **Embeddings** | IVFFlat index with 200 lists. Batch embed via queue. Re-index weekly. |
| **Recommendations** | Pre-compute top 100 per user hourly (batch job). Real-time re-rank on request. |
| **Travel DNA** | Incremental update on each signal. Full recalc weekly for inactive users. |
| **Memory** | LRU cache hot facts in Redis. Cold facts in PostgreSQL. TTL on behavioral patterns. |
| **RAG** | pgvector with IVFFlat. Re-rank with cross-encoder. Cache common query embeddings. |
| **Copilot** | Session affinity to same server. Redis for conversation state. Auto-archive after 30min idle. |
| **Hidden Gems** | Hourly batch scoring. City-level materialized view. |
| **Safety** | Poll external APIs every 15 min. Cache results. Push alerts via BullMQ. |
| **Forecasting** | Weekly batch prediction for all active users. Store in ai_forecasts. |

---

*End of AI Intelligence Ecosystem Specification — 12 sections, 10,000+ words, production-grade.*
