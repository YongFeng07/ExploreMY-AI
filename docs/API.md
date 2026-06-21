# ExploreMY AI — REST API Reference v1.0

**Base URL:** `https://api.exploremy.ai/api/v1`
**Auth:** `Authorization: Bearer <clerk_jwt>`
**Content-Type:** `application/json`
**Date Format:** ISO 8601 (`2026-06-13T14:30:00+08:00`)

---

## Role Hierarchy

| Role | Level | Scope |
|------|-------|-------|
| `user` | 0 | Default authenticated |
| `verified_user` | 1 | Identity verified |
| `premium_user` | 2 | Paying subscriber |
| `business_owner` | 3 | Manages claimed places |
| `moderator` | 4 | Content moderation |
| `admin` | 5 | Platform management |
| `super_admin` | 6 | Full system access |

`🔓` = Public (no auth) · `user` = authenticated · `biz` = business_owner+ · `mod` = moderator+ · `admin` = admin+

---

## Envelope

### Success

```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 243,
    "totalPages": 13
  },
  "requestId": "req_cj2x8f00000001"
}
```

### Error

```json
{
  "statusCode": 422,
  "error": "Unprocessable Entity",
  "message": "Validation failed",
  "errors": [
    { "field": "rating", "message": "Rating must be between 1 and 5" }
  ],
  "requestId": "req_cj2x8f00000002",
  "timestamp": "2026-06-13T14:30:00+08:00"
}
```

---

## 1. Auth APIs

### 1.1 Clerk Webhook

```
POST /auth/webhooks/clerk  🔓
```

Receives user lifecycle events from Clerk.

**Headers:** `svix-id`, `svix-timestamp`, `svix-signature`

**Request:**
```json
{
  "type": "user.created",
  "data": {
    "id": "user_2abc123",
    "email_addresses": [{ "email_address": "ali@example.com" }],
    "first_name": "Ali",
    "last_name": "Mohammad",
    "image_url": "https://img.clerk.com/avatar.jpg"
  }
}
```

**Response:** `204 No Content`

**Events handled:** `user.created` → insert User + Profile + Preferences; `user.updated` → sync displayName/avatar; `user.deleted` → soft-delete

---

### 1.2 Onboarding

```
POST /auth/onboarding  user
```

Complete the 3-step onboarding wizard.

**Request:**
```json
{
  "travelStyles": ["FOODIE", "ADVENTURE"],
  "budgetLevel": 2,
  "locationConsent": true
}
```

**Response:** `200`
```json
{
  "data": {
    "onboardingComplete": true,
    "preferences": {
      "travelStyle": "FOODIE",
      "budgetLevel": 2
    }
  }
}
```

```
GET /auth/onboarding/status  user
```

**Response:** `200`
```json
{
  "data": {
    "onboardingComplete": true,
    "completedSteps": ["style", "budget", "location"]
  }
}
```

---

### 1.3 Session

```
GET    /auth/session     user    → Get current session
DELETE /auth/session     user    → Revoke session (logout)
```

**Response (GET):**
```json
{
  "data": {
    "userId": "uuid",
    "clerkId": "user_2abc123",
    "email": "ali@example.com",
    "role": "user",
    "onboardingComplete": true,
    "expiresAt": "2026-06-14T14:30:00+08:00"
  }
}
```

---

## 2. User APIs

### 2.1 Profile

```
GET    /users/me                user    → Current user profile
PATCH  /users/me                user    → Update profile
DELETE /users/me                user    → Soft-delete account (GDPR)
GET    /users/me/profile        user    → Full profile with stats
GET    /users/:id               user    → Public user profile
```

**Response (GET /users/me):**
```json
{
  "data": {
    "id": "uuid",
    "clerkId": "user_2abc123",
    "email": "ali@example.com",
    "displayName": "Ali Mohammad",
    "avatarUrl": "https://img.clerk.com/avatar.jpg",
    "bio": "Food explorer based in KL",
    "homeCity": "Kuala Lumpur",
    "homeState": "Kuala Lumpur",
    "preferredLanguage": "en",
    "travelStyle": "FOODIE",
    "role": "verified_user",
    "lastLoginAt": "2026-06-13T10:00:00+08:00",
    "createdAt": "2026-01-15T08:30:00+08:00",
    "profile": {
      "followersCount": 128,
      "followingCount": 64,
      "reviewsCount": 42,
      "photosCount": 156,
      "tripsCount": 8,
      "level": 5,
      "xp": 850,
      "isVerified": true
    }
  }
}
```

**Request (PATCH /users/me):**
```json
{
  "displayName": "Ali M.",
  "bio": "Updated bio",
  "homeCity": "George Town",
  "homeState": "Penang",
  "travelStyle": "CULTURAL",
  "preferredLanguage": "en"
}
```

---

### 2.2 Preferences

```
GET /users/me/preferences        user    → Get preferences
PUT /users/me/preferences        user    → Update preferences
```

**Request (PUT):**
```json
{
  "dietaryRestrictions": ["halal", "no-pork"],
  "cuisinePreferences": { "malay": 0.9, "chinese": 0.7, "indian": 0.5 },
  "activityPreferences": ["hiking", "shopping"],
  "budgetLevel": 2,
  "preferredTransport": ["mrt", "grab"],
  "accessibility": { "wheelchairAccessible": false },
  "notificationSettings": { "push": true, "email": false, "marketing": false },
  "privacySettings": { "shareLocation": true, "shareProfile": true }
}
```

---

### 2.3 Follow System

```
GET    /users/:id/followers      user    → List followers (paginated)
GET    /users/:id/following      user    → List following (paginated)
POST   /users/:id/follow         user    → Follow user
DELETE /users/:id/follow         user    → Unfollow user
```

**Response (POST):**
```json
{
  "data": {
    "following": true,
    "followersCount": 129
  }
}
```

---

### 2.4 Home Feed

```
GET /users/me/feed  user
```

Personalized home feed combining AI recommendations + social activity.

**Query:** `?section=nearby,trending,social,ai&lat=3.139&lng=101.6869`

**Response:**
```json
{
  "data": {
    "greeting": "Good morning, Ali! ☀️",
    "sections": [
      {
        "type": "nearby_hidden_gems",
        "title": "Nearby Hidden Gems",
        "places": [ ... ]
      },
      {
        "type": "trending",
        "title": "Trending Now 🔥",
        "places": [ ... ]
      },
      {
        "type": "ai_personalized",
        "title": "Because you like Malaysian food",
        "places": [ ... ]
      },
      {
        "type": "social",
        "title": "From your network",
        "posts": [ ... ]
      }
    ]
  }
}
```

---

### 2.5 Devices

```
GET    /users/me/devices         user    → Registered devices
POST   /users/me/devices         user    → Register device for push
DELETE /users/me/devices/:id     user    → Unregister device
```

**Request (POST):**
```json
{
  "deviceToken": "fcm_token_abc123",
  "platform": "android"
}
```

---

### 2.6 Admin User Management

```
GET    /admin/users                       admin   → Search/list users
PATCH  /admin/users/:id/role              admin   → Change role
PATCH  /admin/users/:id/suspend           admin   → Suspend user
PATCH  /admin/users/:id/restore           admin   → Restore user
```

**Query (GET):** `?q=ali&role=user&status=active&page=1&limit=20`

**Request (PATCH role):**
```json
{
  "role": "moderator"
}
```

---

## 3. Place APIs

### 3.1 Discovery

```
GET /places/nearby      user    → Nearby discovery
GET /places/trending    user    → Trending places
GET /places/hidden-gems user    → Hidden gem discovery
```

**Query (nearby):** `?lat=3.139&lng=101.6869&radius=5000&category=RESTAURANT&priceLevel=2&openNow=true&sortBy=distance&page=1&limit=20`

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "slug": "nasi-lemak-tanglin",
      "name": "Nasi Lemak Tanglin",
      "category": "STREET_FOOD",
      "subcategory": "Malay",
      "lat": 3.145,
      "lng": 101.690,
      "distance": 320,
      "rating": 4.5,
      "reviewCount": 238,
      "priceLevel": 1,
      "photos": ["https://supabase.co/bucket/photo1.jpg"],
      "address": "Jalan Tanglin, Kuala Lumpur",
      "city": "Kuala Lumpur",
      "state": "Kuala Lumpur",
      "isOpen": true,
      "isHiddenGem": false,
      "isTrending": true
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 87, "totalPages": 5 }
}
```

### 3.2 Search

```
GET /places/search              🔓     → Search places (Algolia)
GET /places/autocomplete        user   → Google Places autocomplete
GET /places/map-bounds          user   → Places within viewport
```

**Query (search):** `?q=nasi+lemak&lat=3.139&lng=101.6869&category=RESTAURANT&priceLevel=1,2&rating=4&openNow=true&page=1&limit=20`

**Query (map-bounds):** `?swLat=3.12&swLng=101.65&neLat=3.16&neLng=101.72&category=CAFE`

### 3.3 Detail

```
GET /places/:slug       🔓     → Get by slug (public, ISR cached)
GET /places/:id         🔓     → Get by ID
GET /places/:id/details user   → Enriched detail (Google + internal)
```

**Response (GET /places/:id/details):**
```json
{
  "data": {
    "id": "uuid",
    "slug": "nasi-lemak-tanglin",
    "googlePlaceId": "ChIJxxx",
    "name": "Nasi Lemak Tanglin",
    "description": "Legendary nasi lemak stall operating since 1948...",
    "category": "STREET_FOOD",
    "subcategory": "Malay",
    "address": "Jalan Tanglin, Kuala Lumpur",
    "city": "Kuala Lumpur",
    "state": "Kuala Lumpur",
    "postcode": "50480",
    "lat": 3.145,
    "lng": 101.690,
    "phone": "+60312345678",
    "website": null,
    "priceLevel": 1,
    "rating": 4.5,
    "reviewCount": 238,
    "photos": ["url1", "url2", "url3"],
    "openingHours": {
      "monday": "07:00-15:00",
      "tuesday": "07:00-15:00",
      "wednesday": "07:00-15:00",
      "thursday": "07:00-15:00",
      "friday": "07:00-12:00,14:30-15:00",
      "saturday": "07:00-15:00",
      "sunday": "Closed"
    },
    "amenities": ["halal", "outdoor-seating", "cash-only"],
    "isHiddenGem": false,
    "isTrending": true,
    "isClaimed": false,
    "isOpen": true,
    "isPermanentlyClosed": false,
    "reviewSummary": "Locals rave about the sambal and rendang. Most reviewers recommend arriving before 10am.",
    "similarPlaces": [ ... ],
    "transportOptions": [
      { "mode": "DRIVING", "duration": 5, "distance": 1200, "cost": 0 },
      { "mode": "GRAB", "duration": 8, "distance": 1200, "cost": 7.50 },
      { "mode": "WALKING", "duration": 18, "distance": 1100, "cost": 0 }
    ]
  }
}
```

### 3.4 Categories

```
GET /places/categories                       🔓  → All categories with metadata
GET /places/categories/:category             user → Browse by category
```

**Response (GET /places/categories):**
```json
{
  "data": [
    { "value": "RESTAURANT", "label": "Restaurant", "icon": "🍽️", "color": "#EF4444" },
    { "value": "CAFE", "label": "Cafe", "icon": "☕", "color": "#8B4513" }
  ]
}
```

### 3.5 Admin Place Management

```
POST   /places                    mod     → Create manual place
PATCH  /places/:id                mod     → Update place
PATCH  /places/:id/feature        admin   → Feature/unfeature
PATCH  /places/:id/merge          admin   → Merge duplicate places
```

---

## 4. Review APIs

### 4.1 CRUD

```
GET    /places/:placeId/reviews         🔓   → List reviews (paginated)
POST   /places/:placeId/reviews         user → Create review
PATCH  /reviews/:id                     user → Update own review
DELETE /reviews/:id                     user → Delete own review
```

**Request (POST):**
```json
{
  "rating": 5,
  "title": "Best nasi lemak in KL!",
  "content": "The sambal is perfectly spicy and the rice is fragrant with coconut milk...",
  "photos": ["https://supabase.co/bucket/review1.jpg"],
  "visitDate": "2026-06-12",
  "spendPerPerson": 8.50,
  "tags": ["halal", "cheap", "authentic", "must-try"]
}
```

**Response:** `201`
```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "userName": "Ali Mohammad",
    "userAvatar": "https://img.clerk.com/avatar.jpg",
    "rating": 5,
    "title": "Best nasi lemak in KL!",
    "content": "The sambal is perfectly spicy...",
    "photos": ["https://supabase.co/bucket/review1.jpg"],
    "visitDate": "2026-06-12",
    "spendPerPerson": 8.50,
    "tags": ["halal", "cheap", "authentic", "must-try"],
    "isVerifiedVisit": false,
    "helpfulCount": 0,
    "createdAt": "2026-06-13T14:30:00+08:00"
  }
}
```

**Error:** `409 Conflict` — `{ "message": "You have already reviewed this place" }`

### 4.2 Review Actions

```
POST   /reviews/:id/helpful      user → Mark helpful (toggle)
DELETE /reviews/:id/helpful      user → Remove helpful mark
POST   /reviews/:id/report       user → Report review
```

**Request (POST /report):**
```json
{
  "reason": "FAKE",
  "description": "This review appears to be from a fake account"
}
```

### 4.3 Review Stats & Summary

```
GET /places/:placeId/reviews/summary    🔓  → AI summary
GET /places/:placeId/reviews/stats      🔓  → Rating distribution
GET /users/me/reviews                   user → My reviews
GET /users/:id/reviews                  user → User's public reviews
```

**Response (GET stats):**
```json
{
  "data": {
    "average": 4.5,
    "total": 238,
    "distribution": { "1": 3, "2": 5, "3": 18, "4": 72, "5": 140 },
    "topTags": ["halal", "cheap", "authentic", "spicy"]
  }
}
```

### 4.4 Moderation

```
GET    /reviews/pending                 mod → Pending moderation queue
PATCH  /reviews/:id/moderate            mod → Approve/reject/flag
```

**Request (PATCH /moderate):**
```json
{
  "status": "APPROVED"
}
```

---

## 5. Favorite APIs

### 5.1 Favorites

```
GET    /users/me/favorites                  user → My favorites (paginated)
GET    /users/me/favorites/check            user → Check if favorited
POST   /users/me/favorites                  user → Add to favorites
DELETE /users/me/favorites/:placeId         user → Remove from favorites
```

**Query (GET):** `?page=1&limit=20&sortBy=createdAt`

**Query (check):** `?placeId=uuid`

**Request (POST):**
```json
{
  "placeId": "uuid",
  "listId": "uuid (optional)",
  "notes": "Must try the sambal!"
}
```

**Response (POST):**
```json
{
  "data": {
    "id": "uuid",
    "placeId": "uuid",
    "placeName": "Nasi Lemak Tanglin",
    "saved": true
  }
}
```

### 5.2 Favorite Lists

```
GET    /users/me/favorites/lists                   user → My lists
POST   /users/me/favorites/lists                   user → Create list
PATCH  /users/me/favorites/lists/:id               user → Update list
DELETE /users/me/favorites/lists/:id               user → Delete list
GET    /users/me/favorites/lists/:id               user → Places in list
POST   /users/me/favorites/lists/:id/places        user → Batch add
DELETE /users/me/favorites/lists/:id/places/:placeId user → Remove from list
PATCH  /users/me/favorites/lists/:id/reorder       user → Reorder
GET    /users/:id/favorites/lists                  user → Public lists
```

**Request (POST create list):**
```json
{
  "name": "KL Food Bucket List",
  "description": "Must-try food spots in KL",
  "isPublic": true,
  "coverPhoto": "https://supabase.co/bucket/cover.jpg"
}
```

**Request (PATCH reorder):**
```json
{
  "placeIds": ["uuid3", "uuid1", "uuid2"]
}
```

---

## 6. Trip APIs

### 6.1 CRUD

```
GET    /users/me/trips          user → My trips
POST   /trips                   user → Create trip
GET    /trips/:id               user → Trip detail
PATCH  /trips/:id               user → Update trip
DELETE /trips/:id               user → Delete trip
```

**Query (GET):** `?status=PLANNED&page=1&limit=20`

**Request (POST):**
```json
{
  "title": "Penang Food Adventure",
  "description": "3-day food tour in George Town",
  "destinationCity": "George Town",
  "destinationState": "Penang",
  "startDate": "2026-07-15",
  "endDate": "2026-07-17",
  "budget": 500.00,
  "budgetCurrency": "MYR",
  "travelStyle": "FOODIE",
  "isPublic": true,
  "days": [
    {
      "dayNumber": 1,
      "date": "2026-07-15",
      "stops": [
        {
          "placeId": "uuid-rotikanai",
          "order": 1,
          "startTime": "08:00",
          "endTime": "09:00",
          "notes": "Breakfast",
          "transportFromPrevious": null
        },
        {
          "placeId": "uuid-cendol",
          "order": 2,
          "startTime": "12:30",
          "endTime": "13:30",
          "notes": "Lunch dessert",
          "transportFromPrevious": "GRAB",
          "costEstimate": 8.00
        }
      ]
    }
  ]
}
```

**Response:** `201`
```json
{
  "data": {
    "id": "uuid",
    "title": "Penang Food Adventure",
    "status": "PLANNED",
    "dayCount": 3,
    "totalCost": 156.80,
    "totalDistance": 12400,
    "shareToken": "abc123xyz",
    "createdAt": "2026-06-13T14:30:00+08:00"
  }
}
```

### 6.2 Days & Stops

```
POST   /trips/:id/days                        user → Add day
PATCH  /trips/:id/days/:dayId                 user → Update day
DELETE /trips/:id/days/:dayId                 user → Remove day
POST   /trips/:id/days/:dayId/stops           user → Add stop
PATCH  /trips/:id/stops/:stopId               user → Update stop
DELETE /trips/:id/stops/:stopId               user → Remove stop
PATCH  /trips/:id/days/:dayId/reorder         user → Reorder stops
```

**Request (POST add stop):**
```json
{
  "placeId": "uuid",
  "order": 3,
  "startTime": "14:00",
  "endTime": "15:30",
  "notes": "Afternoon coffee",
  "transportFromPrevious": "WALKING",
  "costEstimate": 15.00
}
```

### 6.3 Actions

```
POST   /trips/:id/optimize              user → AI route optimization
GET    /trips/:id/export                 user → Export trip (pdf/json/gpx)
POST   /trips/:id/share                  user → Generate share token
POST   /trips/:id/collaborators          user → Add collaborator
DELETE /trips/:id/collaborators/:userId  user → Remove collaborator
GET    /trips/:id/budget                 user → Budget breakdown
```

**Query (export):** `?format=pdf`

**Request (POST /share):**
```json
{
  "isPublic": true
}
```

**Response:**
```json
{
  "data": {
    "shareToken": "abc123xyz",
    "shareUrl": "https://exploremy.ai/trips/shared/abc123xyz"
  }
}
```

**Request (POST /collaborators):**
```json
{
  "userId": "uuid-friend",
  "role": "editor"
}
```

### 6.4 Public

```
GET /trips/public                     🔓  → Browse public trips
GET /trips/shared/:shareToken         🔓  → View shared trip
```

---

## 7. Route APIs

### 7.1 Planning

```
POST /routes/plan       user → Plan route between two points
POST /routes/compare    user → Compare all transport modes
POST /routes/optimize   user → AI route optimization
POST /routes/waypoints  user → Multi-stop optimized route
```

**Request (POST /routes/plan):**
```json
{
  "origin": { "lat": 3.139, "lng": 101.6869 },
  "destination": { "lat": 3.145, "lng": 101.690 },
  "transportMode": "DRIVING",
  "departureTime": "2026-06-13T14:30:00+08:00",
  "routeType": "FASTEST",
  "avoid": ["tolls", "highways"],
  "waypoints": [
    { "lat": 3.141, "lng": 101.688 }
  ]
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "origin": { "lat": 3.139, "lng": 101.6869, "name": "KLCC" },
    "destination": { "lat": 3.145, "lng": 101.690, "name": "Nasi Lemak Tanglin" },
    "transportMode": "DRIVING",
    "routeType": "FASTEST",
    "distanceMeters": 3200,
    "durationSeconds": 540,
    "durationInTrafficSeconds": 720,
    "costEstimate": 3.50,
    "currency": "MYR",
    "carbonFootprintGrams": 544,
    "polyline": "yq~_Fng~uVwJt@...",
    "steps": [
      { "instruction": "Head southeast on Jalan Ampang", "distance": 450, "duration": 60 },
      { "instruction": "Turn right onto Jalan Tun Razak", "distance": 1200, "duration": 180 },
      { "instruction": "Turn left onto Jalan Tanglin", "distance": 800, "duration": 120 }
    ],
    "expiresAt": "2026-06-13T15:30:00+08:00"
  }
}
```

**Request (POST /routes/compare):**
```json
{
  "origin": { "lat": 3.139, "lng": 101.6869 },
  "destination": { "lat": 3.145, "lng": 101.690 }
}
```

**Response:**
```json
{
  "data": {
    "modes": [
      { "mode": "WALKING", "duration": 1200, "distance": 1100, "cost": 0, "carbon": 0 },
      { "mode": "DRIVING", "duration": 540, "distance": 3200, "cost": 3.50, "carbon": 544 },
      { "mode": "MOTORCYCLE", "duration": 480, "distance": 3000, "cost": 1.20, "carbon": 309 },
      { "mode": "GRAB", "duration": 660, "distance": 3200, "cost": 8.50, "carbon": 480 },
      { "mode": "MRT", "duration": 900, "distance": 3500, "cost": 2.40, "carbon": 46 }
    ],
    "recommended": "MOTORCYCLE",
    "reason": "Best balance of time and cost"
  }
}
```

**Request (POST /routes/optimize):**
```json
{
  "origin": { "lat": 3.139, "lng": 101.6869 },
  "destination": { "lat": 3.160, "lng": 101.720 },
  "routeType": "FOOD",
  "maxWaypoints": 3,
  "budget": 50.00
}
```

### 7.2 Saved Routes

```
GET /routes/:id                          user → Route detail
GET /routes/:id/transport-options        user → Transport options
GET /routes/recent                       user → Recent routes
```

---

## 8. Transport APIs

```
GET /transport/fare-estimate      user → Fare estimate
GET /transport/schedules          user → Public transit schedules
GET /transport/stations/nearby    user → Nearby stations
GET /transport/carbon             user → Carbon footprint
GET /transport/traffic            user → Real-time traffic
```

**Query (fare-estimate):** `?originLat=3.139&originLng=101.6869&destLat=3.145&destLng=101.690&mode=GRAB`

**Response:**
```json
{
  "data": {
    "mode": "GRAB",
    "provider": "Grab",
    "estimate": { "min": 7.00, "max": 10.00 },
    "currency": "MYR",
    "surgeMultiplier": 1.2,
    "waitMinutes": 3
  }
}
```

**Query (schedules):** `?stationId=klcc&type=MRT&date=2026-06-13&time=14:30`

**Query (stations/nearby):** `?lat=3.139&lng=101.6869&type=MRT,LRT&radius=1000`

**Query (carbon):** `?originLat=3.139&originLng=101.6869&destLat=3.145&destLng=101.690&mode=DRIVING`

**Response (carbon):**
```json
{
  "data": {
    "mode": "DRIVING",
    "distanceMeters": 3200,
    "carbonGrams": 544,
    "equivalent": "0.54 kg CO₂ — equivalent to charging 66 smartphones"
  }
}
```

---

## 9. AI Recommendation APIs

### 9.1 Recommendations

```
POST /ai/recommend/food             user → Food recommendations
POST /ai/recommend/attractions      user → Attraction recommendations
POST /ai/recommend/hidden-gems      user → Hidden gem discovery
POST /ai/recommend/personalized     user → All-category personalized
```

**Request (POST /ai/recommend/food):**
```json
{
  "lat": 3.139,
  "lng": 101.6869,
  "radius": 5000,
  "budget": 30,
  "cuisinePreferences": ["malay", "chinese"],
  "dietaryRestrictions": ["halal"],
  "mealTime": "lunch",
  "excludeVisited": true,
  "limit": 10
}
```

**Response:**
```json
{
  "data": {
    "recommendations": [
      {
        "place": { "id": "uuid", "slug": "nasi-lemak-tanglin", "name": "Nasi Lemak Tanglin", "rating": 4.5 },
        "reason": "Matches your love for Malay cuisine. Highly rated by locals. Within your budget (avg RM 8-12).",
        "matchScore": 0.94,
        "highlights": ["Best sambal in KL", "Since 1948", "Halal certified"]
      }
    ],
    "model": "gpt-4o",
    "generatedAt": "2026-06-13T14:30:00+08:00"
  }
}
```

### 9.2 Feedback

```
POST /ai/feedback/:recommendationId    user → Submit feedback
```

**Request:**
```json
{
  "feedback": "positive",
  "note": "Great recommendation, exactly what I wanted"
}
```

### 9.3 History

```
GET /ai/history    user → AI recommendation history
```

**Query:** `?type=FOOD&page=1&limit=20`

---

## 10. AI Planner APIs

### 10.1 Planning

```
POST /ai/plan/weekend     user → Weekend plan
POST /ai/plan/trip        user → Full trip itinerary
POST /ai/plan/day         user → Single day plan
```

**Request (POST /ai/plan/trip):**
```json
{
  "destination": "Penang",
  "duration": 3,
  "budget": 500,
  "interests": ["food", "heritage", "street-art"],
  "travelStyle": "FOODIE",
  "startDate": "2026-07-15",
  "includeTransport": true,
  "dietaryRestrictions": ["halal"],
  "pace": "relaxed"
}
```

**Response:**
```json
{
  "data": {
    "itinerary": {
      "title": "Penang Food & Heritage Adventure",
      "destination": "George Town, Penang",
      "duration": 3,
      "totalBudget": "RM 487.50",
      "days": [
        {
          "day": 1,
          "date": "2026-07-15",
          "theme": "George Town Street Food Trail",
          "weather": { "condition": "Sunny", "temp": 32, "icon": "sunny" },
          "stops": [
            {
              "time": "08:00",
              "placeName": "Transfer Road Roti Canai",
              "description": "Start your day with flaky roti canai and dhal. A George Town institution since the 1950s.",
              "cost": "RM 5.00",
              "duration": "45 min",
              "transportFromPrevious": null
            },
            {
              "time": "10:00",
              "placeName": "Chew Jetty",
              "description": "Walk off breakfast exploring the historic clan jetties and street art.",
              "cost": "Free",
              "duration": "1.5 hours",
              "transportFromPrevious": "WALKING (8 min)"
            }
          ],
          "dayTotal": "RM 85.30",
          "transportTotal": "RM 15.00"
        }
      ],
      "tips": [
        "Bring an umbrella — Penang afternoons can have sudden showers",
        "Most hawker stalls are cash-only, carry small bills",
        "Parking in George Town is limited — Grab is recommended"
      ]
    },
    "model": "gpt-4o",
    "tripCreated": true,
    "tripId": "uuid-new-trip"
  }
}
```

### 10.2 Chat

```
POST /ai/chat                  user → AI chat
POST /ai/chat/stream           user → AI chat (SSE stream)
GET  /ai/chat/history          user → Chat history
DELETE /ai/chat/history        user → Clear history
```

**Request (POST /ai/chat):**
```json
{
  "messages": [
    { "role": "user", "content": "What are the best night markets in KL?" }
  ],
  "context": {
    "lat": 3.139,
    "lng": 101.6869,
    "preferences": { "budgetLevel": 2 }
  }
}
```

**Streaming (SSE):**
```
event: message
data: {"delta": "Here"}

event: message
data: {"delta": " are"}

event: message
data: {"delta": " the"}

event: done
data: {"tokensUsed": 156, "costIncurred": 0.0012}
```

### 10.3 Utility

```
GET  /ai/context     user → Current AI context (location, weather, preferences)
POST /ai/translate   user → Translate text
POST /ai/summarize   user → Summarize place reviews
```

**Request (POST /ai/summarize):**
```json
{
  "placeId": "uuid",
  "maxLength": 150
}
```

---

## 11. Social APIs

### 11.1 Posts

```
GET    /social/feed                    user → Social feed
POST   /social/posts                   user → Create post
GET    /social/posts/:id               user → Post detail
PATCH  /social/posts/:id               user → Update post
DELETE /social/posts/:id               user → Delete post
GET    /users/:id/posts                user → User's posts
```

**Query (feed):** `?type=following&page=1&limit=20`

**Request (POST):**
```json
{
  "content": "Found the best nasi lemak in KL! 🍛",
  "photos": [{ "url": "https://supabase.co/bucket/post1.jpg" }],
  "placeId": "uuid",
  "tripId": "uuid (optional)",
  "locationLat": 3.145,
  "locationLng": 101.690,
  "locationName": "Nasi Lemak Tanglin",
  "isPublic": true
}
```

### 11.2 Comments

```
GET    /social/posts/:id/comments                  user → Comments
POST   /social/posts/:id/comments                  user → Add comment
POST   /social/posts/:id/comments/:commentId/reply user → Reply
DELETE /social/comments/:id                        user → Delete comment
```

**Request (POST):**
```json
{
  "content": "I need to try this! How spicy is the sambal?"
}
```

### 11.3 Likes & Shares

```
POST   /social/posts/:id/like     user → Like (toggle)
DELETE /social/posts/:id/like     user → Unlike
GET    /social/posts/:id/likers   user → Who liked
POST   /social/posts/:id/share    user → Share
```

### 11.4 Activity

```
GET /social/activity    user → Personal activity feed
```

**Response:**
```json
{
  "data": [
    {
      "type": "SOCIAL_LIKE",
      "actor": { "id": "uuid", "displayName": "Sarah", "avatarUrl": "..." },
      "target": { "type": "post", "id": "uuid", "preview": "Found the best nasi lemak..." },
      "createdAt": "2026-06-13T12:00:00+08:00"
    }
  ]
}
```

---

## 12. Business Dashboard APIs

### 12.1 Claim

```
POST /business/claim                  user → Claim a business
GET  /business/claim/status/:placeId  user → Check claim status
```

**Request (POST):**
```json
{
  "placeId": "uuid",
  "businessName": "Nasi Lemak Tanglin Sdn Bhd",
  "businessType": "RESTAURANT",
  "registrationNumber": "202401012345",
  "phone": "+60312345678",
  "email": "owner@nasilemaktanglin.com",
  "website": "https://nasilemaktanglin.com",
  "verificationDocuments": ["https://supabase.co/bucket/doc1.pdf"]
}
```

### 12.2 Dashboard

```
GET /business/dashboard                 biz → Overview
GET /business/dashboard/analytics       biz → Detailed analytics
GET /business/dashboard/insights        biz → AI-generated insights
GET /business/dashboard/competitors     biz → Competitor analysis
```

**Query (analytics):** `?period=30d&metric=views,clicks,directions,reviews`

**Response (GET /dashboard):**
```json
{
  "data": {
    "period": "30d",
    "overview": {
      "totalViews": 12450,
      "totalDirectionRequests": 3420,
      "totalClicks": 2890,
      "totalReviews": 45,
      "averageRating": 4.5,
      "responseRate": 0.92
    },
    "trends": {
      "viewsChange": 12.5,
      "reviewsChange": 8.3,
      "directionRequestsChange": -3.2
    },
    "peakHours": [
      { "day": "Saturday", "hours": "10:00-14:00" },
      { "day": "Sunday", "hours": "10:00-14:00" }
    ],
    "topSearchTerms": ["nasi lemak", "halal breakfast", "malay food kl"],
    "demographics": {
      "localVsTourist": { "local": 68, "tourist": 32 },
      "topOrigins": ["Kuala Lumpur", "Selangor", "Singapore"]
    }
  }
}
```

### 12.3 Review Management

```
GET    /business/dashboard/reviews                biz → Manage reviews
POST   /business/dashboard/reviews/:id/reply      biz → Reply to review
PATCH  /business/dashboard/reviews/:id/reply/:rid  biz → Edit reply
DELETE /business/dashboard/reviews/:id/reply/:rid  biz → Delete reply
POST   /business/dashboard/reviews/:id/report      biz → Report fake review
```

**Query (GET):** `?status=pending_reply&rating=1,2&page=1&limit=20`

**Request (POST reply):**
```json
{
  "content": "Thank you for your review! We're glad you enjoyed our sambal. Hope to see you again soon!"
}
```

### 12.4 Places (Claimed)

```
GET   /business/dashboard/places            biz → List claimed places
PATCH /business/dashboard/places/:id        biz → Update place details
```

**Request (PATCH):**
```json
{
  "phone": "+60387654321",
  "openingHours": {
    "monday": "07:00-16:00",
    "tuesday": "07:00-16:00"
  },
  "amenities": ["halal", "outdoor-seating", "wifi", "card-payment"]
}
```

### 12.5 Promotions

```
GET    /business/dashboard/promotions          biz → List promotions
POST   /business/dashboard/promotions          biz → Create promotion
PATCH  /business/dashboard/promotions/:id      biz → Update promotion
DELETE /business/dashboard/promotions/:id      biz → Deactivate promotion
GET    /business/dashboard/promotions/:id/stats biz → Promotion performance
```

**Request (POST):**
```json
{
  "title": "Ramadan Special — 20% Off",
  "description": "Enjoy 20% off all menu items during Ramadan",
  "discountType": "percentage",
  "discountValue": 20,
  "startDate": "2026-03-01T00:00:00+08:00",
  "endDate": "2026-03-31T23:59:59+08:00",
  "terms": "Valid for dine-in only. Not valid with other promotions."
}
```

### 12.6 Coupons

```
GET    /business/dashboard/coupons            biz → List coupons
POST   /business/dashboard/coupons            biz → Create coupon
PATCH  /business/dashboard/coupons/:id        biz → Update coupon
DELETE /business/dashboard/coupons/:id        biz → Deactivate coupon
GET    /business/dashboard/coupons/:id/stats  biz → Coupon redemption stats
```

**Request (POST):**
```json
{
  "code": "NASILEMAK20",
  "discountType": "percentage",
  "discountValue": 20,
  "minSpend": 20.00,
  "maxDiscount": 10.00,
  "usageLimit": 500,
  "userLimit": 1,
  "startDate": "2026-06-01T00:00:00+08:00",
  "endDate": "2026-07-01T23:59:59+08:00",
  "terms": "One redemption per customer. Valid for dine-in only."
}
```

### 12.7 Advertising

```
GET    /business/dashboard/ads              biz → List ad campaigns
POST   /business/dashboard/ads              biz → Create ad campaign
PATCH  /business/dashboard/ads/:id          biz → Update campaign
GET    /business/dashboard/ads/:id/stats    biz → Ad performance
```

**Request (POST):**
```json
{
  "name": "KL Foodie Promo",
  "slotType": "search_promoted",
  "placeId": "uuid",
  "imageUrl": "https://supabase.co/bucket/ad-banner.jpg",
  "targetUrl": "https://nasilemaktanglin.com",
  "budget": 500.00,
  "startDate": "2026-06-15T00:00:00+08:00",
  "endDate": "2026-07-15T23:59:59+08:00"
}
```

### 12.8 Export

```
GET /business/dashboard/export    biz → Export analytics report
```

**Query:** `?format=csv&dateRange=30d`

---

## 13. Analytics APIs

### 13.1 Platform Analytics

```
GET /admin/analytics/overview      admin → Platform overview
GET /admin/analytics/users         admin → User growth
GET /admin/analytics/places        admin → Place engagement
GET /admin/analytics/revenue       admin → Revenue
```

**Response (GET /admin/analytics/overview):**
```json
{
  "data": {
    "period": "30d",
    "users": {
      "total": 128000,
      "newThisPeriod": 4500,
      "growthRate": 3.6,
      "dau": 12000,
      "wau": 45000,
      "mau": 128000
    },
    "places": {
      "total": 45000,
      "claimed": 3200,
      "claimRate": 7.1,
      "averageRating": 4.1
    },
    "engagement": {
      "totalReviews": 89000,
      "totalFavorites": 450000,
      "totalTrips": 34000,
      "aiItinerariesGenerated": 12000,
      "averageSessionDuration": 520
    },
    "revenue": {
      "mrr": 24500.00,
      "subscriptions": { "pro": 180, "enterprise": 35 },
      "advertising": 8900.00
    }
  }
}
```

### 13.2 Audit Logs

```
GET /admin/audit-logs    admin → View audit logs
```

**Query:** `?userId=uuid&action=DELETE&startDate=2026-06-01&endDate=2026-06-30&page=1&limit=50`

### 13.3 Moderation Queue

```
GET /admin/moderation/queue    mod → Moderation queue
```

**Query:** `?type=reviews,photos&status=pending&page=1&limit=20`

---

## 14. Notification APIs

```
GET    /notifications                user → List notifications
GET    /notifications/unread-count   user → Unread count
PATCH  /notifications/:id/read       user → Mark read
PATCH  /notifications/read-all       user → Mark all read
PATCH  /notifications/:id/action     user → Mark actioned
DELETE /notifications/:id            user → Delete
```

**Response (GET):**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "ACHIEVEMENT_UNLOCKED",
      "title": "Achievement Unlocked! 🎉",
      "body": "You earned 'Food Hunter' — reviewed 5 restaurants!",
      "data": { "achievementCode": "FOOD_HUNTER_5", "xpReward": 100 },
      "imageUrl": "https://supabase.co/bucket/achievement-food-hunter.png",
      "isRead": false,
      "createdAt": "2026-06-13T12:00:00+08:00"
    }
  ],
  "meta": { "unreadCount": 3 }
}
```

---

## 15. Event APIs

```
GET    /events                       🔓     → Browse events
GET    /events/:id                   🔓     → Event detail
GET    /events/trending              🔓     → Trending events
GET    /events/this-weekend          🔓     → This weekend
GET    /places/:placeId/events       🔓     → Events at place
POST   /events                       user   → Submit event
PATCH  /events/:id                   mod    → Verify/update
POST   /events/:id/attend            user   → Mark interested
DELETE /events/:id/attend            user   → Remove interest
```

**Query (GET):** `?city=Kuala+Lumpur&type=festival,food_fair&startDate=2026-06-13&endDate=2026-07-13&lat=3.139&lng=101.6869&radius=10000&page=1&limit=20`

---

## 16. Achievement APIs

```
GET /achievements                          user → All achievements (with progress)
GET /achievements/:code                    user → Achievement detail
GET /users/me/achievements                 user → My achievements
GET /users/:id/achievements                user → User's public achievements
GET /achievements/leaderboard              user → Leaderboard
POST /admin/achievements                   admin → Create achievement
PATCH /admin/achievements/:id              admin → Update
```

**Query (leaderboard):** `?type=xp&period=all_time&limit=50`

**Response (GET /achievements):**
```json
{
  "data": [
    {
      "code": "FOOD_HUNTER_5",
      "name": "Food Hunter",
      "description": "Review 5 restaurants",
      "icon": "🍜",
      "category": "food",
      "tier": 1,
      "xpReward": 100,
      "isHidden": false,
      "progress": { "current": 5, "target": 5, "percentage": 100 },
      "isCompleted": true,
      "completedAt": "2026-06-10T15:30:00+08:00"
    },
    {
      "code": "FOOD_HUNTER_25",
      "name": "Food Master",
      "description": "Review 25 restaurants",
      "icon": "👨‍🍳",
      "category": "food",
      "tier": 2,
      "xpReward": 250,
      "isHidden": false,
      "progress": { "current": 5, "target": 25, "percentage": 20 },
      "isCompleted": false,
      "completedAt": null
    }
  ]
}
```

---

## 17. Subscription APIs

```
GET    /subscriptions/plans                🔓     → Available plans
GET    /subscriptions/me                   user   → My subscription
POST   /subscriptions/checkout             user   → Stripe checkout
POST   /subscriptions/portal               user   → Customer portal
POST   /subscriptions/cancel               user   → Cancel
POST   /subscriptions/resume               user   → Resume
PATCH  /subscriptions/change-plan          user   → Upgrade/downgrade
POST   /subscriptions/webhooks/stripe      🔓     → Stripe webhook
```

**Request (POST /checkout):**
```json
{
  "plan": "PRO",
  "billingCycle": "monthly",
  "successUrl": "https://exploremy.ai/settings/subscription?success=true",
  "cancelUrl": "https://exploremy.ai/settings/subscription?canceled=true"
}
```

**Response:**
```json
{
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_abc123"
  }
}
```

---

## 18. Location APIs

```
POST   /location/report            user → Report current location
POST   /location/batch             user → Batch report
GET    /location/history           user → Location history
DELETE /location/history           user → Clear history
GET    /location/current-city      user → Reverse geocode
GET    /location/weather           user → Current weather
```

**Request (POST /location/report):**
```json
{
  "lat": 3.139,
  "lng": 101.6869,
  "accuracy": 15.5,
  "speed": 1.2,
  "heading": 45.0,
  "altitude": 52.0,
  "activity": "walking"
}
```

**Request (POST /location/batch):**
```json
{
  "points": [
    { "lat": 3.139, "lng": 101.6869, "accuracy": 15.5, "recordedAt": "2026-06-13T14:29:00+08:00" },
    { "lat": 3.140, "lng": 101.6875, "accuracy": 12.0, "recordedAt": "2026-06-13T14:29:30+08:00" }
  ]
}
```

---

## 19. Search APIs (Global)

```
GET /search                  user → Global search
GET /search/suggestions      user → Autocomplete
GET /search/trending         🔓   → Trending searches
GET /search/history          user → Recent searches
DELETE /search/history       user → Clear history
DELETE /search/history/:id   user → Delete entry
```

**Query (GET):** `?q=nasi+lemak&type=places,users,trips,events&lat=3.139&lng=101.6869&page=1&limit=20`

---

## 20. Health & Meta

```
GET /health          🔓   → Service health
GET /health/ready    🔓   → Readiness probe (DB + Redis + external APIs)
GET /version         🔓   → API version info
```

**Response (GET /health/ready):**
```json
{
  "status": "ok",
  "details": {
    "database": { "status": "ok", "latencyMs": 2 },
    "redis": { "status": "ok", "latencyMs": 1 },
    "googleMaps": { "status": "ok", "latencyMs": 120 },
    "openai": { "status": "ok", "latencyMs": 0 },
    "algolia": { "status": "ok", "latencyMs": 45 },
    "supabase": { "status": "ok", "latencyMs": 80 }
  }
}
```

---

## Summary

| Module | Endpoints | Public | Authenticated | Role-Gated |
|--------|-----------|--------|---------------|------------|
| Auth | 6 | 1 | 5 | 0 |
| Users | 25 | 0 | 25 | 6 (admin) |
| Places | 21 | 4 | 17 | 5 (mod/admin) |
| Reviews | 16 | 3 | 13 | 2 (mod) |
| Favorites | 15 | 0 | 15 | 0 |
| Trips | 20 | 2 | 18 | 0 |
| Routes | 8 | 0 | 8 | 0 |
| Transport | 5 | 0 | 5 | 0 |
| AI Recommend | 7 | 0 | 7 | 0 |
| AI Planner | 9 | 0 | 9 | 0 |
| Social | 17 | 0 | 17 | 0 |
| Business | 26 | 0 | 26 | 26 (biz+) |
| Analytics | 7 | 0 | 7 | 7 (admin) |
| Notifications | 7 | 0 | 7 | 0 |
| Events | 9 | 4 | 5 | 1 (mod) |
| Achievements | 8 | 0 | 8 | 2 (admin) |
| Subscriptions | 8 | 2 | 6 | 0 |
| Location | 6 | 0 | 6 | 0 |
| Search | 6 | 1 | 5 | 0 |
| Health | 3 | 3 | 0 | 0 |
| **Total** | **229** | **20** | **209** | **49** |

---

**Rate Limits:** `user`: 100/min · `verified`: 200/min · `premium`: 500/min · `biz`: 300/min · `admin`: 1000/min

**Headers:** `X-RateLimit-Limit` · `X-RateLimit-Remaining` · `X-RateLimit-Reset` · `X-Request-Id`
