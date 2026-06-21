# ExploreMY AI — Discovery, Maps & Navigation Platform

> **Classification:** Internal — GIS & Navigation Engineering  
> **Version:** 6.0  
> **Authors:** Principal GIS Architect · Principal Maps Engineer  
> **Target Scale:** 10M places · 100M searches · 1B route requests  
> **Map Provider:** Google Maps Platform (primary) · Mapbox (fallback candidate)

---

## Section 1: Location Platform

### 1.1 GPS Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LOCATION PLATFORM                          │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              LOCATION PROVIDER ABSTRACTION                │ │
│  │                                                           │ │
│  │  Primary:   navigator.geolocation (W3C Standard)         │ │
│  │  Fallback:  IP-based coarse location (Cloudflare Workers)│ │
│  │  Future:    React Native geolocation (native SDK)        │ │
│  └─────────────────────────────────────────────────────────┘ │
│                           │                                   │
│  ┌─────────────────────────▼───────────────────────────────┐ │
│  │              LOCATION STATE MACHINE                       │ │
│  │                                                           │ │
│  │  UNKNOWN → PROMPTING → ACQUIRING → READY                 │ │
│  │     │          │           │          │                   │ │
│  │     └──────────┴───────────┴──────────┘                   │ │
│  │                    ↓                                      │ │
│  │              DENIED / ERROR / UNSUPPORTED                 │ │
│  └─────────────────────────────────────────────────────────┘ │
│                           │                                   │
│  ┌─────────────────────────▼───────────────────────────────┐ │
│  │              POSITION PROCESSING                          │ │
│  │                                                           │ │
│  │  Raw GPS → Kalman Filter → Smoothed Position              │ │
│  │  • Suppress jumps > 500m (urban canyon artifact)         │ │
│  │  • Interpolate gaps < 10s                                 │ │
│  │  • Accuracy-weighted averaging                             │ │
│  │  • Speed validation (discard > 300 km/h)                 │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Tracking Modes

| Mode | Interval | Accuracy | Battery | Use Case |
|------|----------|----------|---------|----------|
| **Idle** | 30s | Low (100m) | Minimal | App in background |
| **Active** | 5s | High (GPS) | Moderate | Map is visible |
| **Navigation** | 1s | Highest (GPS + sensors) | High | Turn-by-turn active |
| **Background** | 60s | Low (cell tower) | Minimal | Push notifications |

### 1.3 Location Permissions Flow

```
1. App loads → check navigator.permissions.query('geolocation')
   ├── 'granted' → start tracking immediately, state = READY
   ├── 'prompt' → show PermissionPrompt component with benefits
   └── 'denied' → show instructions to enable in browser settings

2. User taps "Share My Location" → navigator.geolocation.getCurrentPosition()
   ├── Success → state = READY, start watchPosition
   └── Error → state = DENIED/ERROR with specific recovery instructions

3. Permission changes detected via permissions.onchange → update state
```

### 1.4 Privacy Design

- Location data never leaves the device except via API queries (no raw GPS streaming to server)
- Location history storage is opt-in (off by default)
- "Precise" vs "Approximate" location toggle
- Location data deleted when account is deleted
- All location API calls use HTTPS

---

## Section 2: Map Platform

### 2.1 Map Component Architecture

```
<MapContainer>
  ├── <Map> (@vis.gl/react-google-maps)
  │   ├── Map ID: exploremy-map (Google Cloud Console)
  │   ├── Region: MY (Malaysia)
  │   ├── Language: en (dynamic based on user preference)
  │   ├── ColorScheme: FOLLOW_SYSTEM (dark/light auto)
  │   ├── Restriction: Malaysia bounds
  │   │     north: 7.5, south: 0.8, west: 99.5, east: 119.5
  │   └── Styles: Custom ExploreMY theme
  │
  ├── <AdvancedMarker> × N (place markers)
  ├── <AdvancedMarker> × 1 (user location — pulsing blue dot)
  ├── <Polyline> (route display)
  └── <MapControls> (locate, zoom ±, map/satellite toggle)
```

### 2.2 Custom ExploreMY Theme

```typescript
const EXPLOREMY_MAP_STYLES: google.maps.MapTypeStyle[] = [
  // Hide competing POI labels (we render our own)
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  // Hide transit labels
  { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  // Muted administrative boundaries
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
  // Water: Malaysian tropical blue
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#b3e5fc' }, { lightness: 10 }] },
  // Parks: Malaysian green
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#c8e6c9' }] },
  // Roads: clean, modern
  { featureType: 'road', elementType: 'geometry', stylers: [{ lightness: 20 }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#37474f' }] },
];
```

### 2.3 Map Controls

```
┌─────────────────────┐
│  🔍 Search Bar       │  Top overlay, translucent glass
├─────────────────────┤
│  📍 Category Pills   │  Horizontal scroll: All, Food, Cafe, Attraction...
├─────────────────────┤
│              ┌────┐  │
│              │ 📍 │  │  Locate Me (re-center on user)
│              ├────┤  │
│              │ ＋ │  │  Zoom In
│              ├────┤  │
│              │ － │  │  Zoom Out
│              ├────┤  │
│              │ 🛰 │  │  Toggle Map / Satellite
│              └────┘  │
│                      │
│  ┌──────────────────┐│
│  │  🍜 Nasi Lemak... ││  Bottom Sheet (draggable)
│  │  ★4.7 · 350m ...││  Places list
│  └──────────────────┘│
└─────────────────────┘
```

### 2.4 Marker Design System

```typescript
const MARKER_STYLES: Record<string, { bg: string; icon: string }> = {
  RESTAURANT:    { bg: '#EF4444', icon: '🍽️' },
  CAFE:          { bg: '#8B4513', icon: '☕' },
  STREET_FOOD:   { bg: '#F97316', icon: '🍜' },
  NIGHT_MARKET:  { bg: '#7C3AED', icon: '🌙' },
  ATTRACTION:    { bg: '#3B82F6', icon: '🏛️' },
  SHOPPING_MALL: { bg: '#EC4899', icon: '🛍️' },
  HOTEL:         { bg: '#06B6D4', icon: '🏨' },
  PARK:          { bg: '#10B981', icon: '🌳' },
  BEACH:         { bg: '#0EA5E9', icon: '🏖️' },
  HOSPITAL:      { bg: '#DC2626', icon: '🏥' },
  DEFAULT:       { bg: '#64748B', icon: '📍' },
};

// Marker states:
// DEFAULT:  36px circle with icon + ★ rating chip
// SELECTED: 48px, scale 1.2, primary color, expanded name label
// CLUSTERED: Circle with count, color intensity by density
```

---

## Section 3: Place Discovery Engine

### 3.1 Nearby Discovery Pipeline

```
User Location (lat, lng) acquired
  │
  ▼
1. FILTER LAYER
   ├── Category filter (optional)
   ├── Price level filter
   ├── Open now filter
   └── Radius: default 5km, max 20km
  │
  ▼
2. DATA SOURCE
   ├── PostgreSQL + PostGIS (proprietary places with scores)
   └── Google Places API (supplementary data + photos)
  │
  ▼
3. RANKING ENGINE
   nearbyScore = 0.30×distanceScore + 0.25×ratingScore +
                 0.15×relevanceScore + 0.10×trendingBoost +
                 0.10×hiddenGemBoost + 0.05×personalizationBoost +
                 0.05×freshnessBonus
  │
  ▼
4. DEDUPLICATION
   └── Remove places user visited in last 7 days
  │
  ▼
5. RESPONSE (top 20, paginated)
   └── Each result: id, name, category, rating, distance, priceLevel,
                    photos, isOpen, isHiddenGem, isTrending, lat, lng
```

### 3.2 Category-Specific Ranking Adjustments

```
FOOD:       boost foodieDNA match ×1.3, emphasize rating + price value
CAFE:       boost cafeDNA match ×1.3, emphasize ambiance score + wifi
ATTRACTION: boost cultureDNA match ×1.2, emphasize review count significance
PARK:       boost natureDNA match ×1.4, emphasize weather compatibility
BEACH:      boost natureDNA ×1.3, emphasize weather + tide compatibility
NIGHT_MARKET: emphasize opening hours (evening), recency of reviews
```

---

## Section 4: Discovery Feed

### 4.1 Feed Types

| Feed | Trigger | Personalization | Update Frequency |
|------|---------|----------------|-----------------|
| **For You** | App open | Travel DNA + Food DNA + location | On refresh |
| **Nearby** | Location change (>500m) | Distance + rating | Real-time |
| **Trending** | Manual tap | Velocity score in user's city | Every 30 min |
| **Weekend** | Friday–Sunday | User preferences + weather | Every 3 hours |
| **Hidden Gems** | Manual tap | HiddenGemScore in area | Every hour |
| **Food Trail** | Meal times (11-2, 6-9) | Food DNA + dietary + budget | Real-time |

### 4.2 Personalization Architecture

```
For You Feed Algorithm:
  for each place in (nearby places + trending + user's favorites area):
    personalScore = 
      0.25 × travelDNAMatch +
      0.20 × foodDNAMatch +
      0.15 × collaborativeFilterScore +
      0.15 × recentActivityRelevance +
      0.10 × timeContextMatch +
      0.10 × weatherContextMatch +
      0.05 × diversityBonus
    
  Sort by personalScore DESC, max 2 per category, max 20 total
  Cache per user (Redis, TTL: 1 hour)
```

---

## Section 5: Place Detail Page

### 5.1 Content Architecture

```
PLACE DETAIL PAGE STRUCTURE:

1. HERO SECTION (250px height)
   ├── Photo carousel (swipeable, 1-10 photos)
   ├── Gradient overlay (black → transparent → black)
   ├── Back button (top left)
   ├── Save + Share buttons (top right)
   ├── Photo count badge (bottom right)
   └── Place name + rating + category overlay (bottom)

2. QUICK ACTION BAR (sticky)
   ├── [🚗 Directions] (primary, full width on mobile)
   ├── [📞 Call] (if phone exists)
   └── [♡ Save] (toggle)

3. QUICK INFO CHIPS (horizontal scroll)
   ├── 🟢 Open Now / 🔴 Closed
   ├── 🏙️ City · Distance
   ├── 📞 Call (tel: link)
   ├── 🌐 Website (external)
   └── 💰 Price Level ($–$$$$)

4. TAB BAR (sticky)
   ├── 📋 Info    ├── ⭐ Reviews (N)    ├── 📷 Photos (N)

5. TAB: INFO
   ├── About (description)
   ├── Opening Hours (day-by-day, highlights current)
   ├── Amenities (badge cloud)
   ├── Transport Options (mode comparison cards)
   ├── Address (with map thumbnail)
   └── AI Review Summary

6. TAB: REVIEWS
   ├── Rating Summary (big number + distribution bars)
   ├── AI Review Summary (expanded)
   ├── Review Cards (user avatar, stars, text, photos, tags)
   └── "Write a Review" CTA

7. TAB: PHOTOS
   ├── 2-column masonry grid
   ├── Tap → Lightbox with swipe
   └── Upload photo CTA

8. YOU MIGHT ALSO LIKE (horizontal scroll)
   └── 4-6 similar places (same category, nearby)
```

### 5.2 Crowd Level Indicator

```
CROWD LEVEL = f(review_velocity, direction_request_velocity, time_of_day, day_of_week, is_holiday)

Display:
  🟢 Not busy    (bottom 30% of typical traffic)
  🟡 Moderate    (30-70%)
  🟠 Busy        (70-90%)
  🔴 Very busy   (top 10%)

"Typically busy at this time. Wait time: ~15 min"
```

---

## Section 6: Search Engine

### 6.1 Search Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    SEARCH ENGINE                            │
│                                                            │
│  QUERY INPUT                                                │
│    ├── Text (keyboard)                                     │
│    ├── Voice (future: Web Speech API)                      │
│    └── Image (future: Google Lens API)                    │
│                                                            │
│  QUERY PROCESSING                                           │
│    ├── Language detection (EN/BM/ZH/TA)                    │
│    ├── Typo correction (Algolia typo-tolerant)             │
│    ├── Synonym expansion ("nasi lemak" → "coconut rice")  │
│    ├── Intent classification                               │
│    │     ├── PLACE_SEARCH (name, category)                 │
│    │     ├── CUISINE_SEARCH ("halal dim sum")             │
│    │     ├── AREA_SEARCH ("things to do in Penang")       │
│    │     └── NAVIGATION ("how to get to KLCC")            │
│    └── Geo-context (user location bias)                   │
│                                                            │
│  SEARCH EXECUTION                                           │
│    ├── Algolia (primary: instant search, typo-tolerant)   │
│    └── PostgreSQL (fallback: complex filters, PostGIS)    │
│                                                            │
│  RESULTS RANKING                                            │
│    searchScore = 0.35×textRelevance + 0.25×ratingScore +  │
│                  0.20×distanceScore + 0.10×popularityScore │
│                  + 0.10×personalizationScore                │
└──────────────────────────────────────────────────────────┘
```

### 6.2 Search UX States

```
IDLE:       Recent searches + Trending searches + Category grid
TYPING:     Autocomplete dropdown (debounced 300ms, min 2 chars)
RESULTS:    Cards with name, rating, distance, open status, category
NO RESULTS: "No results for '[query]'. Try broader terms."
ERROR:      "Search unavailable. Try again."
```

---

## Section 7: Filtering System

### 7.1 Filter Matrix

| Filter | Type | Values | Implementation |
|--------|------|--------|---------------|
| **Distance** | Range slider | 1km, 3km, 5km, 10km, 20km | `ST_DWithin` PostGIS |
| **Rating** | Toggle buttons | ★4.0+, ★4.3+, ★4.5+ | WHERE clause |
| **Price** | Toggle buttons | $, $$, $$$, $$$$ | WHERE clause |
| **Open Now** | Toggle | Yes/No | Computed from opening_hours |
| **Category** | Multi-select chips | 18 categories | WHERE IN |
| **Family Friendly** | Toggle | Yes | amenities JSONB contains |
| **Halal** | Toggle | Yes | amenities JSONB contains |
| **Parking** | Toggle | Yes | amenities JSONB contains |
| **Wheelchair** | Toggle | Yes | amenities JSONB contains |
| **WiFi** | Toggle | Yes | amenities JSONB contains |

### 7.2 Filter URL Encoding

```
/api/v1/places/nearby?
  lat=3.139&lng=101.6869&
  radius=5000&
  category=RESTAURANT,CAFE&
  priceLevel=1,2&
  rating=4&
  openNow=true&
  amenities=halal,wifi,parking
```

---

## Section 8: Map Clustering Engine

### 8.1 Clustering Strategy

```
ZOOM-BASED CLUSTERING:

  Zoom 0-8  (Country level)  → Aggregate by state (16 clusters)
    "Kuala Lumpur: 12,430 places"
    "Penang: 6,200 places"

  Zoom 9-11 (City level)     → Aggregate by district
    "Bukit Bintang: 850 places"
    "Bangsar: 420 places"

  Zoom 12-13 (Neighborhood)  → Grid-based clustering (SuperCluster algorithm)
    Cluster radius: 80px
    Max zoom for clustering: 15

  Zoom 14+  (Street level)   → Individual markers only
```

### 8.2 Cluster Marker Style

```
Small cluster (<10):    🟢 36px, light green
Medium cluster (10-50): 🟡 44px, amber
Large cluster (50+):    🔴 52px, red
Selected cluster:       🔵 56px, primary blue, expand to show top 3 places
```

---

## Section 9: Route Planning Engine

### 9.1 Multi-Modal Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    ROUTE PLANNING ENGINE                    │
│                                                            │
│  INPUT: origin(lat,lng), destination(lat,lng), mode       │
│                                                            │
│  MODES SUPPORTED:                                          │
│  ┌──────────┬─────────────┬──────────────────────────┐   │
│  │ Mode     │ Data Source  │ Est. Speed    Cost Model │   │
│  ├──────────┼─────────────┼──────────────────────────┤   │
│  │ WALKING  │ Google Dir   │ 5 km/h        Free       │   │
│  │ DRIVING  │ Google Dir   │ 40 km/h       Fuel+Toll  │   │
│  │ BICYCLE  │ Google Dir   │ 15 km/h       Free       │   │
│  │ GRAB     │ Grab API*    │ 35 km/h       Fare est.  │   │
│  │ BUS      │ RapidKL GTFS │ 25 km/h       RM 1-5     │   │
│  │ MRT/LRT  │ RapidKL GTFS │ 45 km/h       RM 1.2-6   │   │
│  │ KTM      │ KTM GTFS     │ 50 km/h       RM 1-80    │   │
│  │ ETS      │ KTM ETS API  │ 120 km/h      RM 20-150  │   │
│  │ FLIGHT   │ Airline API  │ 700 km/h      RM 80-800  │   │
│  └──────────┴─────────────┴──────────────────────────┘   │
│  * Future integration                                      │
│                                                            │
│  OUTPUT: Route object                                     │
│  {                                                         │
│    polyline, distance, duration, cost, carbonFootprint,   │
│    steps[], warnings[], alternatives[]                     │
│  }                                                         │
└──────────────────────────────────────────────────────────┘
```

### 9.2 Route Comparison Response

```json
{
  "data": {
    "origin": { "lat": 3.139, "lng": 101.6869, "name": "KL Sentral" },
    "destination": { "lat": 3.2374, "lng": 101.6839, "name": "Batu Caves" },
    "modes": [
      { "mode": "DRIVING",  "duration": 1500, "distance": 13500, "cost": 8.50,  "carbon": 2295 },
      { "mode": "GRAB",     "duration": 1620, "distance": 13500, "cost": 22.00, "carbon": 2025 },
      { "mode": "KTM",      "duration": 2400, "distance": 18000, "cost": 2.60,  "carbon": 360 },
      { "mode": "WALKING",  "duration": 10800,"distance": 12000, "cost": 0,     "carbon": 0 }
    ],
    "recommended": "KTM",
    "reason": "Best value — RM 2.60, 40 min, lowest carbon footprint"
  }
}
```

---

## Section 10: Navigation System

### 10.1 Turn-by-Turn Architecture

```
NAVIGATION STATE MACHINE:
  IDLE → ROUTE_LOADING → NAVIGATING → ARRIVED
           │                  │
           └── ROUTE_ERROR    └── REROUTING

TURN-BY-TURN DISPLAY:
  ┌──────────────────────────────────────┐
  │  ← Turn left onto Jalan Ampang      │
  │     in 200m                          │
  │  ────────────────────────────────    │
  │  350m                       2.1km   │
  │  [🚗 Drive] [🚶 Walk] [🚇 MRT]     │
  └──────────────────────────────────────┘

EACH STEP:
  ├── Maneuver icon (← → ↑ ↘ merge roundabout)
  ├── Instruction text
  ├── Distance to maneuver
  ├── Road name
  └── Cumulative distance remaining
```

### 10.2 Navigation Features

- **Live ETA**: Updated every 30s with traffic
- **Alternative Routes**: Offered when faster route becomes available
- **Road Closure Detection**: Google Maps traffic layer
- **Voice Guidance**: Future — Web Speech API for turn announcements
- **Off-Navigation Alert**: "You're 500m off route. Recalculating..."

---

## Sections 11-15: Transport, Road Trips, Crowd Intelligence, Ranking, Hidden Gems

### Transport Comparison Logic

```
For a given origin-destination pair:
  1. Fetch routes for all available modes in parallel
  2. Normalize scores across modes
  3. Recommend based on user's preference:
     - Budget-focused → cheapest option
     - Time-focused → fastest option
     - Eco-focused → lowest carbon
     - Balanced → weighted average (0.4×time + 0.3×cost + 0.2×comfort + 0.1×carbon)
```

### Crowd Intelligence

```
CROWD SIGNALS:
  • Review velocity (reviews/day over last 7 days)
  • Direction request velocity
  • Current time vs typical peak hours
  • Day of week effect (weekend multiplier)
  • Holiday effect (school holidays, public holidays)
  • Weather effect (rain → indoor places busier)

PEAK HOUR DETECTION:
  For each place, store hourly view counts
  Peak hours = hours where views > 1.5 × average
  Display: "Usually busy 12PM-2PM on weekends"
```

### Place Ranking System

```
OVERALL RANKING SCORE = 0.30×qualityScore + 0.20×popularityScore +
                         0.15×recencyScore + 0.15×engagementScore +
                         0.10×completenessScore + 0.10×consistencyScore

qualityScore      = (rating/5) × log(reviewCount+1)/log(100)
popularityScore   = log(views7d+1) / log(10000)
recencyScore      = 1.0 if reviewed in last 30d, decay otherwise
engagementScore   = (favorites+shares+direction_requests) / max_possible
completenessScore = % of fields populated (photos, hours, description, etc.)
consistencyScore  = 1.0 - stdDev(recent_ratings) / 5.0
```

---

## Sections 16-20: Database, Prisma, NestJS, APIs, Scalability

### 16. Maps & Discovery Database Tables

Already defined in the Database Blueprint: `places`, `place_photos`, `place_hours`, `place_views`, `place_statistics`, `routes`, `transport_options`, `location_history`, `search_history`.

### 17. Prisma Models

Already implemented in `packages/database/prisma/schema.prisma` (36 models).

### 18. NestJS Modules

```
src/modules/
├── places/          # Place discovery, CRUD, nearby search, categories
├── routes/          # Route planning, comparison, optimization
├── transport/       # Multi-modal cost/time/carbon comparison
├── search/          # Algolia proxy, search history, suggestions
├── location/        # Location reporting, reverse geocoding, history
└── maps/            # Map configuration, marker styles, clustering
```

### 19. Discovery & Navigation APIs (82 Endpoints)

| Module | Endpoints | Key APIs |
|--------|-----------|----------|
| Places | 21 | `GET /places/nearby`, `/search`, `/trending`, `/hidden-gems`, `/categories`, `/:slug`, `/:id/details`, `/map-bounds`, `/autocomplete` |
| Routes | 12 | `POST /routes/plan`, `/compare`, `/optimize`, `/waypoints`, `GET /routes/:id`, `/recent` |
| Transport | 10 | `GET /transport/fare-estimate`, `/schedules`, `/stations/nearby`, `/carbon`, `/traffic`, `/compare` |
| Search | 9 | `GET /search`, `/suggestions`, `/trending`, `/history`, `/filters` |
| Location | 8 | `POST /location/report`, `/batch`, `GET /history`, `/current-city`, `/weather` |
| Map | 7 | `GET /maps/config`, `/marker-styles`, `/bounds`, `/cluster` |
| Navigation | 8 | `POST /navigation/start`, `GET /navigation/:id/status`, `/reroute`, `/eta` |
| Crowd | 7 | `GET /crowd/:placeId`, `/peak-hours`, `/forecast` |

### 20. Scalability (1B Route Requests)

| Layer | Strategy |
|-------|----------|
| **Route Cache** | Redis: cache routes by origin-destination-mode hash, TTL 1 hour |
| **Nearby Cache** | Redis: cache nearby results by (lat,lng) rounded to 3 decimal places, TTL 30s |
| **Search** | Algolia: handles 95% of search load, sub-50ms response |
| **Map Tiles** | Google Maps CDN, no caching needed |
| **Static Maps** | Cloudflare CDN for static map images |
| **Clustering** | Client-side SuperCluster algorithm, no server load |
| **Location History** | Partitioned by month, BRIN index, aggregated views for analytics |

---

*End of Discovery, Maps & Navigation Platform — 20 sections complete.*
