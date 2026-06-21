# ExploreMY AI — Product Requirements Document (PRD)

> **Classification:** Internal — Product Organization  
> **Version:** 2.0  
> **Authors:** CPO · Principal PM · Principal UX Architect  
> **Target Release:** Phase 1 MVP (Q3 2026)  
> **Document Type:** Engineering Specification

---

## Section 1: Product Overview

### 1.1 Product Goals

| ID | Goal | Success Metric | Timeframe |
|----|------|---------------|-----------|
| G1 | Become the default discovery tool for Malaysia | 50K MAU | Year 1 |
| G2 | Reduce trip planning time by 80% | Avg. trip plan created in <3 min | Year 1 |
| G3 | Surface 1,000+ hidden gems invisible to Google Maps | Hidden gem index growth | Year 1 |
| G4 | Achieve product-market fit with local explorers | D30 retention >40% | Year 1 |
| G5 | Generate first revenue through business subscriptions | 500 claimed businesses | Year 1 |

### 1.2 Product Scope

**In Scope (Phase 1 MVP):**
- GPS location detection with real-time tracking
- Interactive Google Maps with custom markers
- Nearby place discovery across 18 categories
- Place detail pages with photos, reviews, hours, transport options
- Global search with geo-ranking
- AI trip planner (destination, budget, duration, interests)
- Multi-transport route comparison (Driving, Walking)
- User authentication via Clerk
- Favorites with save/unsave
- Review writing with star ratings
- User profiles with stats

**Out of Scope (Phase 1):**
- Hotel/attraction/event booking
- Social feed and community features
- Business dashboard and advertising
- Wallet, rewards, and membership
- Offline maps
- Voice assistant and AR navigation
- ASEAN expansion

### 1.3 Product Principles

1. **Mobile-First, Map-Native** — The map is the primary interface. Every feature starts from the map.
2. **AI as Copilot, Not Autopilot** — AI suggests and assists. Users make final decisions.
3. **Malaysia-First Design** — Every feature considers Malaysian context: halal dining, multi-language, multi-transport, local culture.
4. **Performance Obsession** — Every interaction must feel instant. Target: <2s page load, <200ms API response.
5. **Privacy by Default** — Location data is opt-in. Users control what they share.
6. **Progressive Disclosure** — Simple by default, powerful on demand. New users see essential features; power users discover advanced capabilities.

### 1.4 Product Constraints

| Constraint | Impact |
|-----------|--------|
| Google Maps API dependency | Base map, places data, directions all depend on Google. Must abstract provider layer. |
| Clerk auth dependency | User identity tied to Clerk. Must handle Clerk downtime gracefully. |
| OpenAI/Gemini API costs | AI features incur per-request costs. Must implement caching, model routing, and rate limiting. |
| Mobile browser limitations | PWA, not native app. No push notifications on iOS. Limited background location. |
| Team size (5-8 engineers) | Must prioritize ruthlessly. Build what matters, defer the rest. |

---

## Section 2: User Roles

### 2.1 Role Hierarchy

```
SUPER_ADMIN (Level 6)
  └── ADMIN (Level 5)
        ├── MODERATOR (Level 4)
        │     └── (can moderate any content)
        ├── PREMIUM_USER (Level 2)
        │     └── (paying subscriber, enhanced features)
        ├── VERIFIED_USER (Level 1)
        │     └── (identity verified, trusted reviewer)
        ├── BUSINESS_OWNER (Level 3)
        │     ├── HOTEL_PARTNER
        │     └── ATTRACTION_PARTNER
        └── USER (Level 0)
              └── GUEST (unauthenticated)
```

### 2.2 Permissions Matrix

| Capability | Guest | User | Verified | Premium | Biz Owner | Mod | Admin |
|-----------|-------|------|----------|---------|-----------|-----|-------|
| View places | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Search | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Save favorites | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Write reviews | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Upload photos | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create trips | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| AI Trip Planner | ❌ | 3/mo | 10/mo | Unlimited | 10/mo | Unlimited | Unlimited |
| Offline maps | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| Claim business | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| View business analytics | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Create promotions | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Moderate content | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| System config | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Section 3: Authentication Module

### 3.1 User Stories

| ID | Story | Priority |
|----|-------|----------|
| AUTH-01 | As a new user, I want to sign up with Google so I can start using the app in 5 seconds | P0 |
| AUTH-02 | As a new user, I want to sign up with Apple so I can use my preferred account | P1 |
| AUTH-03 | As a new user, I want to sign up with email so I have an alternative to social login | P1 |
| AUTH-04 | As a returning user, I want to sign in with my existing account so I can access my data | P0 |
| AUTH-05 | As a user, I want to reset my password if I forget it | P1 |
| AUTH-06 | As a user, I want to enable MFA for added security | P3 |
| AUTH-07 | As a guest, I want to browse places without signing up so I can evaluate the product | P0 |

### 3.2 Acceptance Criteria

**AUTH-01: Google Sign-Up**
- [ ] User taps "Continue with Google"
- [ ] Google account picker appears
- [ ] After selection, user is redirected to onboarding
- [ ] User record created in database with clerkId, email, displayName
- [ ] Profile and UserPreferences records auto-created
- [ ] If email already exists (previously signed up with Apple), accounts are linked via Clerk

**AUTH-03: Email Sign-Up**
- [ ] User enters email + password (min 8 chars, 1 number, 1 special char)
- [ ] Email verification code sent
- [ ] User enters 6-digit code
- [ ] Account activated → redirected to onboarding
- [ ] Invalid code: error message with retry (max 3 attempts, then resend)

**AUTH-07: Guest Browsing**
- [ ] Guest can view landing page, place detail pages, public trips
- [ ] Guest cannot save favorites, write reviews, or use AI planner
- [ ] "Save" button prompts sign-up modal
- [ ] Guest state persisted across page navigation

### 3.3 Error States

| Error | Message | Recovery |
|-------|---------|----------|
| Invalid email | "Please enter a valid email address" | Highlight field |
| Weak password | "Password must be at least 8 characters with 1 number and 1 special character" | Show requirements |
| Email already registered | "An account with this email already exists. Sign in?" | Link to sign-in |
| Google auth cancelled | Silent — user returns to sign-up page | — |
| Network error | "Connection failed. Check your internet and try again." | Retry button |
| Session expired | "Your session has expired. Please sign in again." | Redirect to sign-in |
| Clerk service down | "Authentication is temporarily unavailable. Please try again later." | Retry button with countdown |

### 3.4 Business Rules

- BR-AUTH-01: One email = one account. No duplicate emails.
- BR-AUTH-02: Passwords hashed with bcrypt (12 rounds). Never stored in plaintext.
- BR-AUTH-03: Session tokens expire after 24 hours of inactivity.
- BR-AUTH-04: Failed login attempts: 5 in 15 minutes → temporary lockout (30 min).
- BR-AUTH-05: Onboarding must be completed before accessing main app features.
- BR-AUTH-06: Deleted accounts are soft-deleted (30-day recovery window), then hard-deleted.

---

## Section 4: User Profile Module

### 4.1 User Stories

| ID | Story | Priority |
|----|-------|----------|
| PROF-01 | As a user, I want to view my profile with stats so I can track my exploration | P0 |
| PROF-02 | As a user, I want to edit my display name, bio, and avatar so I can personalize my presence | P1 |
| PROF-03 | As a user, I want to set my travel preferences so recommendations are personalized | P0 |
| PROF-04 | As a user, I want to set my food preferences (cuisine, dietary, halal) so I get relevant food recommendations | P0 |
| PROF-05 | As a user, I want to see my Travel DNA so I understand my travel personality | P2 |
| PROF-06 | As a user, I want to see my visited places history | P1 |

### 4.2 Acceptance Criteria

**PROF-03: Travel Preferences**
- [ ] Settings page shows: budget level (1-4), travel style (multi-select from 8 options), preferred transport (multi-select)
- [ ] Changes save immediately (optimistic update with rollback on failure)
- [ ] Preferences are used by AI Trip Planner and Recommendation Engine
- [ ] Preferences can be changed anytime — no limits

**PROF-05: Travel DNA**
- [ ] Displays 8-dimension radar chart (adventure, luxury, foodie, culture, nature, social, spontaneity, local immersion)
- [ ] Shows confidence score: "Based on 24 signals"
- [ ] Shows primary and secondary travel style labels
- [ ] "How is this calculated?" expandable section with simple explanation
- [ ] DNA updates after every 5 new behavioral signals

### 4.3 Edge Cases

- EC-PROF-01: User with zero activity → Travel DNA shows "Not enough data — explore more to see your DNA!"
- EC-PROF-02: User changes preferences mid-trip → AI should use latest preferences for next recommendation
- EC-PROF-03: User clears all preferences → Reset to neutral defaults, not empty
- EC-PROF-04: Display name contains emoji or special characters → Allow, but sanitize for search indexing

---

## Section 5: Location Module

### 5.1 User Stories

| ID | Story | Priority |
|----|-------|----------|
| LOC-01 | As a user, I want the app to detect my current location automatically so I can discover nearby places | P0 |
| LOC-02 | As a user, I want to see my location updating in real-time on the map | P0 |
| LOC-03 | As a user, I want to control when my location is shared | P0 |
| LOC-04 | As a user, I want to see my coordinates and accuracy | P2 |

### 5.2 Acceptance Criteria

**LOC-01: Auto-Detect Location**
- [ ] On first load, browser permission prompt appears
- [ ] If user grants: map centers on user location, blue pulsing dot appears
- [ ] If user denies: map defaults to KL city center, permission prompt card appears explaining benefits
- [ ] If user previously denied: show instructions for enabling in browser settings (Chrome, Safari, Firefox)
- [ ] Location accuracy displayed: ±Xm with color coding (green <15m, amber <50m, red >50m)

**LOC-02: Real-Time Tracking**
- [ ] Location updates every 5 seconds while app is open
- [ ] User marker moves smoothly (animated transition between position updates)
- [ ] Accuracy indicator updates with each position
- [ ] Tracking stops when user navigates away from map page

### 5.3 Business Rules

- BR-LOC-01: Location data never leaves the device except for API queries (nearby search, directions).
- BR-LOC-02: Location history stored only if user opts in (privacy setting).
- BR-LOC-03: Background location tracking is not enabled (browser limitation for PWA).
- BR-LOC-04: If GPS is unavailable (>30s timeout), fall back to IP-based coarse location with accuracy warning.

### 5.4 Edge Cases

- EC-LOC-01: User is indoors → GPS accuracy degrades. Show "Low accuracy — move outdoors for better results."
- EC-LOC-02: User is traveling at high speed (on highway) → Suppress nearby place refresh (places would be stale by the time they load).
- EC-LOC-03: User is in a country other than Malaysia → Show "ExploreMY is optimized for Malaysia. Some features may be limited."
- EC-LOC-04: Device GPS is disabled at OS level → "GPS is disabled. Enable it in your device settings."

---

## Section 6: Maps Module

### 6.1 User Stories

| ID | Story | Priority |
|----|-------|----------|
| MAP-01 | As a user, I want to see an interactive map as the main interface | P0 |
| MAP-02 | As a user, I want to see place markers color-coded by category | P0 |
| MAP-03 | As a user, I want to tap a marker to see a place preview card | P0 |
| MAP-04 | As a user, I want to zoom, pan, and rotate the map with gestures | P0 |
| MAP-05 | As a user, I want to see my current location on the map with a pulsing blue dot | P0 |
| MAP-06 | As a user, I want one-tap "My Location" to re-center the map | P0 |
| MAP-07 | As a user, I want to toggle between map and satellite view | P2 |
| MAP-08 | As a user, I want to see traffic conditions on the map | P2 |

### 6.2 Acceptance Criteria

**MAP-01: Interactive Map**
- [ ] Map loads within 2 seconds on 4G connection
- [ ] Map defaults to KL city center (3.139, 101.6869) at zoom level 14 if no location permission
- [ ] Map is restricted to Malaysia bounds (cannot scroll to other countries)
- [ ] Pinch-to-zoom, double-tap-zoom, two-finger rotate all work
- [ ] Map renders in dark mode when system dark mode is active
- [ ] POI labels are hidden (our markers replace them)

**MAP-03: Marker Tap**
- [ ] Tapping a marker: marker scales up, changes to primary color, map pans to center on it
- [ ] Preview card appears at bottom of screen showing: name, rating, distance, price level, open status
- [ ] Tapping preview card → navigates to place detail page
- [ ] Tapping elsewhere on map → deselects marker, hides preview card

### 6.3 Marker Design Specification

```
FOOD:        🍜 orange-red background
CAFE:        ☕ brown background
ATTRACTION:  🏛️ blue background
HOTEL:       🏨 cyan background
PARK:        🌳 green background
BEACH:       🏖️ sky-blue background
TEMPLE:      🛕 amber background
MOSQUE:      🕌 teal background
HOSPITAL:    🏥 red background
DEFAULT:     📍 gray background
```

Each marker shows: category icon + ⭐ rating. Selected markers expand to show place name.

### 6.4 Business Rules

- BR-MAP-01: Map tiles are loaded from Google Maps. No offline tile caching in Phase 1.
- BR-MAP-02: Maximum 200 markers rendered simultaneously. Beyond that, use clustering.
- BR-MAP-03: Markers update when map bounds change (debounced: 500ms after pan/zoom stops).
- BR-MAP-04: Map API key is restricted to Malaysia domain via Google Cloud Console.

---

## Section 7: Discovery Module

### 7.1 User Stories

| ID | Story | Priority |
|----|-------|----------|
| DISC-01 | As a user, I want to see nearby places ranked by relevance on the map and in a list | P0 |
| DISC-02 | As a user, I want to filter by category (Food, Cafe, Attraction, Park, etc.) | P0 |
| DISC-03 | As a user, I want to see "Open Now" status for every place | P1 |
| DISC-04 | As a user, I want to discover hidden gems that tourists miss | P1 |
| DISC-05 | As a user, I want to see trending places that are popular right now | P2 |
| DISC-06 | As a user, I want to filter by price level ($ to $$$$) | P2 |

### 7.2 Ranking Algorithm

```
Nearby Score = 
    0.30 × distanceScore +
    0.25 × ratingScore +
    0.15 × relevanceScore +
    0.10 × trendingBoost +
    0.10 × hiddenGemBoost +
    0.05 × personalizationBoost +
    0.05 × freshnessBonus

distanceScore = 1 / (1 + distance / 1000)²  -- decays quadratically
ratingScore = (rating / 5) × log(reviewCount + 1) / log(100)  -- Bayesian average
relevanceScore = 1.0 if category matches filter, 0.5 if subcategory overlaps
trendingBoost = min(1.0, trendingScore / 100)  -- capped at 1.0
hiddenGemBoost = min(0.5, hiddenGemScore / 100)  -- capped at 0.5
personalizationBoost = cosineSimilarity(place.embedding, user.travelDNA) × 0.05
freshnessBonus = 1.0 if place updated in last 7 days, 0 otherwise
```

### 7.3 Business Rules

- BR-DISC-01: Default search radius is 5km. User can expand to 10km manually.
- BR-DISC-02: Maximum 20 places returned per query (paginated).
- BR-DISC-03: "Open Now" status based on current day + time vs. stored opening hours. If hours unknown, show "Hours not available" instead of guessing.
- BR-DISC-04: Hidden gem threshold: hiddenGemScore ≥ 0.65. This is recalculated hourly.
- BR-DISC-05: Trending threshold: trendingScore ≥ 50 (velocity-based, recalculated hourly).
- BR-DISC-06: Places with isPermanentlyClosed = true are never returned in discovery results.

### 7.4 Edge Cases

- EC-DISC-01: No places within 5km → "No places found nearby. Try expanding your search area."
- EC-DISC-02: All places in category are closed → Still show them, but sort closed to bottom, show "Opens at X:XX AM tomorrow"
- EC-DISC-03: User is in a rural area with very few places → Expand radius to 20km automatically with message
- EC-DISC-04: Two places have identical scores → Sort by distance (closer first)

---

## Section 8: Search Platform

### 8.1 User Stories

| ID | Story | Priority |
|----|-------|----------|
| SRCH-01 | As a user, I want to search for places by name, cuisine, or keyword | P0 |
| SRCH-02 | As a user, I want to see search suggestions as I type | P1 |
| SRCH-03 | As a user, I want to see recent searches for quick access | P1 |
| SRCH-04 | As a user, I want to see trending searches in my area | P2 |
| SRCH-05 | As a user, I want to filter search results by category, price, rating, and distance | P1 |

### 8.2 Acceptance Criteria

**SRCH-01: Place Search**
- [ ] Search bar at top of search page with auto-focus
- [ ] Results appear as user types (debounced: 300ms, minimum 2 characters)
- [ ] Each result shows: name, category icon, rating stars, distance, open/closed status
- [ ] Tapping result → place detail page
- [ ] Empty query → show recent searches + trending searches
- [ ] No results → "No places found for '[query]'. Try a different search term."

### 8.3 Search Ranking

```
Search Score =
    0.35 × textRelevance +      -- name/description match
    0.25 × ratingScore +        -- quality signal
    0.20 × distanceScore +      -- proximity
    0.10 × popularityScore +    -- review count + view count
    0.10 × personalizationScore -- matches user preferences

textRelevance = TF-IDF or Algolia relevance score
```

---

## Section 9: AI Travel Copilot

### 9.1 User Stories

| ID | Story | Priority |
|----|-------|----------|
| AI-01 | As a user, I want to plan a trip by telling the AI my destination, budget, and duration | P0 |
| AI-02 | As a user, I want the AI to generate a day-by-day itinerary with specific places, times, and costs | P0 |
| AI-03 | As a user, I want to modify the AI's plan by providing feedback ("add more food stops") | P1 |
| AI-04 | As a user, I want the AI to remember my preferences from previous conversations | P2 |
| AI-05 | As a user, I want to save the AI-generated trip to My Trips | P0 |

### 9.2 Acceptance Criteria

**AI-01: Trip Planning**
- [ ] User fills form: Destination (text), Budget (RM, number), Duration (days, 1-14), Interests (multi-select)
- [ ] On submit: loading animation with progress messages ("Researching Penang food spots...", "Finding best routes...", "Calculating costs...")
- [ ] AI returns structured itinerary: title, destination, days[], totalCost, tips[]
- [ ] Each day: theme, stops (time, placeName, description, cost, duration)
- [ ] Budget overage warning if totalCost > budget with specific saving suggestions
- [ ] "Save Trip" button → saves to database, navigates to My Trips
- [ ] "Modify" button → returns to input form with previous values pre-filled

**AI-03: Modify Plan**
- [ ] User types natural language feedback: "Replace the museum with something outdoors"
- [ ] AI regenerates affected days only (not the entire trip)
- [ ] Changes are highlighted with "Updated" badge
- [ ] User can accept or reject each change individually

### 9.3 AI Behavior Rules

- BR-AI-01: AI must only recommend places that exist in our database (no hallucinated places).
- BR-AI-02: AI must respect dietary restrictions (halal, vegetarian) when recommending food.
- BR-AI-03: AI must include transport estimates between stops.
- BR-AI-04: AI must warn about practical constraints (distance too far, place closed on planned day).
- BR-AI-05: AI responses must be in the user's preferred language.
- BR-AI-06: Free users: 3 AI trip plans per month. Premium: unlimited.

### 9.4 Edge Cases

- EC-AI-01: User asks for impossible plan (10 destinations in 2 days) → AI responds: "That's a lot for 2 days! I'd recommend focusing on 2-3 areas. Want me to suggest the best ones?"
- EC-AI-02: User's budget is unrealistically low (RM 50 for 3-day trip) → AI: "RM 50 is very tight for 3 days. Here's what's possible with RM 150 — still very budget-friendly."
- EC-AI-03: AI times out (>8 seconds) → "I'm taking longer than expected. Here's a partial plan — I'm still working on Day 3."
- EC-AI-04: AI returns place not in database → Post-processing validation removes it, replaces with nearest match.

---

## Section 10: Recommendation Engine

### 10.1 Recommendation Types

| Type | Trigger | Example |
|------|---------|---------|
| **Nearby Now** | User opens app, location detected | "3 hawker stalls within 500m" |
| **Time-Based** | Time of day: lunch (11AM-2PM), dinner (6-9PM) | "Lunch spots near your office" |
| **Weather-Based** | Rain detected → indoor activities | "3 museums to escape the rain" |
| **Preference-Based** | Based on Travel DNA + Food DNA | "Because you love Malaysian food" |
| **Contextual** | Weekend approaching, no plans | "Weekend getaway ideas" |
| **Social** | Friends visited/favorited | "Sarah saved this cafe" |

### 10.2 Personalization Rules

- BR-REC-01: New users (no behavioral data) get popularity-based recommendations until they have 5+ signals.
- BR-REC-02: Recommendations must not repeat places the user visited in the last 7 days.
- BR-REC-03: Maximum 2 recommendations from the same category in a single feed.
- BR-REC-04: Sponsored/promoted places: max 1 per 5 organic recommendations, clearly labeled "Ad".
- BR-REC-05: Users can dismiss recommendations ("Not interested") — this signal is used to improve future recommendations.

---

## Section 11: Route Planning

### 11.1 User Stories

| ID | Story | Priority |
|----|-------|----------|
| ROUTE-01 | As a user, I want to get directions from my location to any place | P0 |
| ROUTE-02 | As a user, I want to compare driving vs walking options | P0 |
| ROUTE-03 | As a user, I want to see distance, duration, and estimated cost for each mode | P0 |
| ROUTE-04 | As a user, I want turn-by-turn instructions | P1 |
| ROUTE-05 | As a user, I want to see traffic-adjusted ETA for driving | P2 |

### 11.2 Acceptance Criteria

**ROUTE-02: Mode Comparison**
- [ ] Route panel shows two tabs: 🚗 Drive | 🚶 Walk
- [ ] Each tab shows: distance, duration, estimated cost, carbon footprint
- [ ] Driving: includes toll costs and traffic adjustment
- [ ] Walking: shows calorie estimate ("~120 calories burned")
- [ ] Switching tabs recalculates route immediately
- [ ] Polyline on map updates to show new route

### 11.3 Fallback Rules

- BR-ROUTE-01: If Google Directions API fails → show straight-line distance with disclaimer "Approximate — road route may vary."
- BR-ROUTE-02: If destination >50km away and walking is selected → "Walking is not practical for this distance. Try driving."
- BR-ROUTE-03: If origin and destination are the same → "You're already here!"

---

## Section 12: Place Detail Page

### 12.1 Content Hierarchy

```
1. HERO PHOTO (full-width, 250px height)
   ├── Back button (top left)
   ├── Save button (top right, heart icon)
   ├── Share button (top right)
   ├── Photo count badge (bottom right)
   └── Place name + rating + price level overlay (bottom)

2. QUICK ACTION BAR (sticky, below hero)
   ├── Directions (primary CTA, full-width)
   ├── Call (if phone available)
   ├── Save (toggle)
   └── Share

3. QUICK INFO CHIPS (horizontal scroll)
   ├── Open/Closed (green/red)
   ├── City/Distance
   ├── Call (tel: link)
   └── Website (external link)

4. TAB BAR
   ├── Info (default)
   ├── Reviews (count)
   └── Photos (count)

5. TAB CONTENT
   ├── Info: Description, Opening Hours, Amenities, Transport Options, Address
   ├── Reviews: Rating Summary + Distribution + AI Summary + Review Cards
   └── Photos: 2-column grid, tap to lightbox
```

### 12.2 Business Rules

- BR-PDP-01: Place detail page is publicly accessible (no auth required) for SEO.
- BR-PDP-02: ISR revalidation every 5 minutes for frequently viewed places, 1 hour for others.
- BR-PDP-03: Photos load lazily (below the fold). Hero photo is eager-loaded.
- BR-PDP-04: "You Might Also Like" section shows 4-6 similar places (same category, nearby).

---

## Section 13: Reviews

### 13.1 User Stories

| ID | Story | Priority |
|----|-------|----------|
| REV-01 | As a user, I want to write a review with a star rating | P0 |
| REV-02 | As a user, I want to add photos to my review | P1 |
| REV-03 | As a user, I want to see an AI-generated summary of all reviews for a place | P1 |
| REV-04 | As a user, I want to mark reviews as helpful | P2 |
| REV-05 | As a user, I want to report inappropriate reviews | P2 |

### 13.2 Acceptance Criteria

**REV-01: Write Review**
- [ ] Star rating selector: 1-5 stars, tap to select, animated fill
- [ ] Title field (optional, max 100 chars)
- [ ] Content field (required, min 10 chars, max 2000 chars)
- [ ] Tags: pre-defined + custom (halal, cheap, romantic, spicy, family-friendly)
- [ ] Visit date picker (optional)
- [ ] Spend per person (optional, RM)
- [ ] Submit button → optimistic UI update → confirmation toast
- [ ] One review per user per place (duplicate check)

### 13.3 Review Moderation

| Rule | Action |
|------|--------|
| Profanity detected | Flag for manual review, show to author only |
| Review with 1★ and no text | Allow (quantitative signal is valuable) |
| Same user, same place, multiple reviews | Reject with message "You've already reviewed this place. You can edit your existing review." |
| Review from user created <24h ago with <3 app interactions | Flag as potential spam |
| Review with URL/link in text | Flag for manual review |
| Review reported by 3+ users | Auto-hide, queue for moderator review |

---

## Section 14: Favorites

### 14.1 User Stories

| ID | Story | Priority |
|----|-------|----------|
| FAV-01 | As a user, I want to save a place to my favorites with one tap | P0 |
| FAV-02 | As a user, I want to organize favorites into lists ("KL Food Bucket List") | P1 |
| FAV-03 | As a user, I want to see all my favorites on a map | P1 |
| FAV-04 | As a user, I want to share a favorites list with friends | P2 |

### 14.2 Acceptance Criteria

**FAV-01: Save Place**
- [ ] Heart icon on every place card and place detail page
- [ ] Tap heart → fills red, toast: "Saved to favorites"
- [ ] Tap again → unfills, toast: "Removed from favorites"
- [ ] Optimistic update: icon changes immediately, API call in background
- [ ] API failure: revert icon, toast: "Failed to save. Try again."
- [ ] Heart state persists across sessions

**FAV-02: Favorites Lists**
- [ ] User can create named lists: "KL Food Spots", "Penang Trip", "Date Night Ideas"
- [ ] When saving a place, user can optionally select a list (default: "All Favorites")
- [ ] Lists can be public (shareable) or private
- [ ] Lists show place count and cover photo

---

## Section 15: Community

### 15.1 Phase 1 Scope

Community features are **Phase 4** (Year 2). Phase 1 MVP includes only:
- User profiles with review/photo counts
- Public "favorites lists" (view-only for other users)
- Review feed on place detail pages

**Out of scope for Phase 1:**
- Social feed with posts
- Following/followers
- Comments and likes
- Direct messaging
- Travel communities

---

## Section 16: Merchant Platform

### 16.1 Phase 1 Scope

Merchant features are **Phase 2** (Q1 2027). Phase 1 MVP includes only:
- Business claiming with phone verification
- Basic dashboard: view count, direction requests, review count

**Out of scope for Phase 1:**
- Advanced analytics
- Promotion creation
- Advertising platform
- Menu management
- Hotel/attraction management

---

## Section 17: Booking Platform

### 17.1 Phase 1 Scope

Booking is **Phase 3** (Q3 2027). Phase 1 MVP includes only:
- "View on Google Maps" external link
- "Call" button (tel: link)
- "Visit Website" external link

No in-app booking or transactions in Phase 1.

---

## Section 18: Wallet & Rewards

### 18.1 Phase 1 Scope

Wallet and rewards are **Phase 5** (2028). Phase 1 MVP includes only:
- User XP and level display (gamification)
- Achievement badges (unlocked through app usage)

No stored value, cashback, or membership tiers in Phase 1.

---

## Section 19: Notification System

### 19.1 Notification Matrix

| Trigger | Channel | Timing | Priority |
|---------|---------|--------|----------|
| Achievement unlocked | In-app toast | Immediate | Low |
| Favorite place has new promotion | Push (if enabled) | Daily digest | Medium |
| Saved trip starts tomorrow | Push | 8 PM day before | High |
| Someone liked your review | In-app | Immediate | Low |
| New hidden gem near you | Push (if enabled) | Weekly | Low |
| Review request after visit | Push | 2 hours after visit detected | Medium |

### 19.2 Business Rules

- BR-NOT-01: Users can opt out of each notification type individually.
- BR-NOT-02: Maximum 3 push notifications per user per day (to prevent spam).
- BR-NOT-03: Review request is only sent if user spent >15 minutes at the location (based on GPS dwell time).
- BR-NOT-04: Quiet hours: no push notifications between 10 PM and 8 AM local time.

---

## Section 20: Analytics

### 20.1 Phase 1 Analytics

Phase 1 tracks these events (PostHog):

| Event | Properties |
|-------|-----------|
| `page_viewed` | page, referrer, session_id |
| `place_viewed` | place_id, category, source (search/map/nearby) |
| `search_performed` | query, results_count, category_filter |
| `direction_requested` | origin, destination, mode |
| `favorite_added` | place_id, category |
| `favorite_removed` | place_id |
| `review_created` | place_id, rating |
| `ai_plan_generated` | destination, duration, budget, model |
| `onboarding_completed` | travel_styles, budget_level |
| `location_permission` | status (granted/denied) |

### 20.2 Business Analytics (Phase 2+)

- Daily active users (DAU), weekly (WAU), monthly (MAU)
- Retention cohorts (D1, D7, D30)
- Conversion funnel: visitor → signup → onboarding → first search → first favorite → first review
- Feature adoption: % of users using AI planner, % using favorites, % writing reviews
- Geographic distribution: users by city/state

---

## Section 21: Non-Functional Requirements

### 21.1 Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint | <1.5s | Lighthouse |
| Largest Contentful Paint | <2.5s | Lighthouse |
| Time to Interactive | <3s | Lighthouse |
| API Response (p95) | <200ms | Prometheus |
| Map Tile Load | <500ms | Custom timing |
| AI Response (p95) | <5s | Custom timing |

### 21.2 Security

- All API traffic over HTTPS (TLS 1.3)
- JWT tokens with 24h expiry
- Rate limiting: 100 req/min (user), 30 req/min (guest)
- Input sanitization (XSS prevention)
- CSRF tokens on mutation endpoints
- SQL injection prevention via Prisma parameterized queries
- Security headers: CSP, X-Frame-Options, X-Content-Type-Options

### 21.3 Availability

- Target: 99.5% uptime (Phase 1)
- Target: 99.95% uptime (Phase 3+)
- Graceful degradation: if backend is down, frontend shows cached data
- Health check endpoint: `/api/health`

### 21.4 Accessibility

- WCAG 2.1 AA compliant
- Semantic HTML throughout
- All images have alt text
- Color contrast ratios ≥ 4.5:1
- Keyboard navigation for all interactive elements
- Screen reader support for map interactions (future: Phase 3)

### 21.5 Scalability

- Phase 1: 50K MAU, <1K concurrent
- Architecture supports 10x growth without re-architecture
- Stateless application servers (horizontal scaling)
- Database read replicas for read-heavy queries
- Redis caching for hot data (places, routes)
- CDN for static assets and images

---

## Section 22: Success Metrics

### 22.1 North Star Metric

**"Weekly Active Explorers"** — users who discovered at least 3 new places in the past 7 days.

### 22.2 KPIs

| KPI | Target | Measurement |
|-----|--------|-------------|
| MAU | 50K (Year 1) | PostHog |
| DAU/MAU | >20% | PostHog |
| D30 Retention | >40% | PostHog cohorts |
| Avg. Session Duration | >5 min | PostHog |
| Places Viewed/Session | >4 | PostHog |
| Search-to-Detail Rate | >60% | PostHog |
| Favorite Conversion | >15% of place views | PostHog |
| Review Conversion | >5% of place views | PostHog |
| AI Plans Generated/Month | >5K | Backend |
| NPS | >45 | Survey |
| App Store Rating | >4.5 | App Store (future) |

---

## Section 23: Edge Cases — Master List

### Authentication
1. User signs up with Google, then tries to sign up with same email → link accounts
2. User's Clerk session expires mid-session → prompt re-auth, preserve unsaved state
3. User deletes account → 30-day soft delete, data anonymized, recovery possible
4. User changes email → verification required on new email before change takes effect

### Location
5. User denies location, then enables it mid-session → immediately recenter map
6. User's GPS shows them in Singapore (border zone) → show "ExploreMY is optimized for Malaysia"
7. User on airplane mode → show last known location with "Offline" banner, cached place data
8. GPS jumps erratically (urban canyon) → smooth with Kalman filter, suppress jumps >500m

### Maps
9. Google Maps API quota exceeded → show "Map temporarily unavailable. Basic navigation still works."
10. Map fails to load (network error) → show retry button + list view of nearby places as fallback
11. User zooms out to see entire country → switch to city-level aggregation ("230 places in KL, 180 in Penang...")

### Discovery
12. All nearby places are closed (3 AM search) → show "It's late! Here's what's open now" filter + "Opens at 7 AM" for others
13. User is in a mall → category automatically biases toward SHOPPING and FOOD
14. Rain detected → boost indoor categories, show "☔ Rainy day? Try these indoor spots"

### Search
15. User searches in Chinese ("肉骨茶") → match both Chinese name and English translation (Bak Kut Teh)
16. Zero results for valid query → "We couldn't find '[query]'. Try a broader search or different spelling."
17. User searches while map is panned to a different city → search in visible map area, show "Searching near George Town"

### AI Planner
18. AI recommends a place that closed down → post-processing check: isPermanentlyClosed filter
19. User requests a plan for a future date when a key attraction is closed (Batu Caves on Monday) → AI warns: "Batu Caves is closed on Mondays. I've suggested alternative: Thean Hou Temple."
20. AI plan exceeds budget → show breakdown: "This plan costs RM 580. To fit RM 500: replace Hotel A with Guesthouse B (save RM 80)."

### Reviews
21. User submits empty review (only stars) → accept: quantitative signal is valuable even without text
22. User tries to review a place they've never visited → allow but mark as "unverified visit"
23. Place rating drops below 3.0 → trigger notification to business owner: "Your rating has changed"

### Favorites
24. User has 500+ favorites → implement lazy loading + search within favorites
25. User tries to save a place that's already in 3 of their lists → allow, show which lists it's already in
26. User creates a list with the same name as an existing list → append "(2)" instead of rejecting

### Performance
27. User on 2G connection → serve minimal version: no photos, text-first, progressive enhancement
28. User on a low-end device (<=2GB RAM) → reduce map marker count, disable animations
29. API response time exceeds 3s → show skeleton loader, then partial results, then complete results

---

*End of Product Requirements Document — 23 sections complete.*
