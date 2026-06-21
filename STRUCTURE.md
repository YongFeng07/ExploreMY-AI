# ExploreMY AI — Enterprise Monorepo Architecture

> **Author:** Chief Software Architect  
> **Date:** 2026-06-13  
> **Monorepo Tool:** Turborepo + pnpm Workspaces  
> **Package Manager:** pnpm 9.x  
> **Node:** >= 20.0.0

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Root Structure](#2-root-structure)
3. [Frontend — `apps/web/`](#3-frontend)
4. [Backend — `apps/api/`](#4-backend)
5. [Shared Packages — `packages/`](#5-shared-packages)
6. [Tooling — `tooling/`](#6-tooling)
7. [Infrastructure — `infrastructure/`](#7-infrastructure)
8. [Docker — `docker/`](#8-docker)
9. [CI/CD — `.github/`](#9-cicd)
10. [Scripts & Config — `scripts/`, `config/`](#10-scripts--config)
11. [Environment Strategy](#11-environment-strategy)
12. [Dependency Graph](#12-dependency-graph)

---

## 1. Design Philosophy

### Architectural Principles

| Principle | Implementation |
|-----------|---------------|
| **Separation of Concerns** | `apps/` for deployables, `packages/` for shared libraries, `tooling/` for dev config |
| **Colocation by Feature** | Backend modules own their controller, service, DTOs, and tests |
| **Barrel Exports** | Every folder has an `index.ts` exporting its public API |
| **Dependency Rule** | `apps` → `packages` → `tooling` (never reverse) |
| **12-Factor App** | Config via environment, stateless processes, explicit dependencies |
| **Convention over Configuration** | Shared tsconfig, eslint, prettier inherited by all workspaces |

### Workspace Topology

```
                    ┌──────────────┐
                    │   tooling/   │  (dev-only configs)
                    └──────┬───────┘
                           │ extends
              ┌────────────┼────────────┐
              ▼            ▼            ▼
       ┌──────────┐ ┌──────────┐ ┌──────────┐
       │ packages/│ │ packages/│ │ packages/│
       │  config  │ │  shared  │ │    ui    │
       └────┬─────┘ └────┬─────┘ └────┬─────┘
            │            │            │
            └────────────┼────────────┘
                         │ imports
              ┌──────────┼──────────┐
              ▼                     ▼
        ┌──────────┐         ┌──────────┐
        │ apps/web │         │ apps/api │
        │ (Next.js)│         │ (NestJS) │
        └──────────┘         └──────────┘
              │                     │
              └──────────┬──────────┘
                         │ reads/writes
                         ▼
                 ┌──────────────┐
                 │   packages/  │
                 │   database   │
                 │   (Prisma)   │
                 └──────────────┘
```

---

## 2. Root Structure

```
ExploreMY-AI/
│
├── apps/                              # Deployable applications
├── packages/                          # Shared libraries (not deployed independently)
├── tooling/                           # Development-only configuration (never deployed)
├── infrastructure/                    # Infrastructure as Code (Terraform, Kubernetes)
├── docker/                            # Container definitions
├── .github/                           # CI/CD workflows + GitHub bot configs
├── scripts/                           # Automation scripts
├── config/                            # Shared runtime configuration files
├── docs/                              # Architecture, API, and process documentation
│
├── package.json                       # Root workspace definition
│   → Defines all workspace packages via pnpm workspaces
│   → Root-level scripts (dev, build, lint, test) delegate to Turborepo
│   → devDependencies shared across all workspaces (prettier, husky, turbo)
│
├── pnpm-workspace.yaml                # pnpm workspace catalog
│   → Declares packages in apps/*, packages/*, tooling/*
│   → Enables cross-workspace `workspace:*` protocol for internal deps
│
├── turbo.json                         # Turborepo pipeline definition
│   → Declares task dependencies (build needs ^build, ^db:generate)
│   → Defines caching strategy per task
│   → Global environment variable allowlist
│
├── tsconfig.json                      # Root TypeScript baseline
│   → target: ES2022, strict: true, module: ESNext
│   → Every workspace extends this via tooling/typescript
│
├── .prettierrc                        # Code formatting
│   → singleQuote, trailingComma all, 100 char width
│   → Tailwind class sorting plugin
│
├── .editorconfig                      # IDE-agnostic editor settings
├── .gitignore                         # Global ignore rules
├── .npmrc                             # pnpm configuration
│
├── .env.example                       # Production environment template (50+ vars)
│   → Committed to repo, values documented
│   → Covers: DB, Redis, Clerk, Google Maps, OpenAI, Gemini,
│     Supabase, Algolia, Stripe, PostHog, Sentry, Email
│
├── .env.local.example                 # Local development template
│   → Docker-friendly defaults (localhost:5432, localhost:6379)
│   → Dev API keys (test mode)
│
├── README.md                          # Project overview + quick start
└── STRUCTURE.md                       # This file — complete architecture reference
```

---

## 3. Frontend — `apps/web/`

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Shadcn UI  
**Deployment:** Vercel (Edge + Serverless)  
**Package:** `@exploremy/web`

### 3.1 App Router (`src/app/`)

Next.js 15 file-system router with React Server Components by default. Route groups `(auth)`, `(main)`, `(marketing)` colocate pages without affecting URL structure.

```
src/app/
├── layout.tsx                          # Root layout (fonts, metadata, providers)
│   → Applies to every page in the application
│   → Wraps children in <RootProvider> (auth, query, map, theme, toast, analytics)
│   → Sets viewport, SEO metadata, Open Graph, Twitter cards
│   → Loads Inter + JetBrains Mono fonts with CSS variables
│
├── (marketing)/                        # Route group: public, unauthenticated
│   └── page.tsx                        # Landing page (/)
│       → Hero, features grid, CTA funnel, social proof
│       → SEO-optimized static content
│       → Redirects authenticated users to /explore
│
├── (auth)/                             # Route group: authentication pages
│   ├── sign-in/                        # /sign-in
│   │   └── page.tsx                    # Clerk-hosted or custom sign-in
│   ├── sign-up/                        # /sign-up
│   │   └── page.tsx                    # Clerk-hosted or custom sign-up
│   └── onboarding/                     # /onboarding
│       └── page.tsx                    # 3-step wizard: travel style → budget → location
│           → Gated by middleware — redirects here if !onboardingComplete
│           → On completion: set publicMetadata.onboardingComplete = true
│
├── (main)/                             # Route group: authenticated core app
│   ├── layout.tsx                      # Shared layout for all main pages
│   │   → Wraps in <MainLayout> with bottom navigation bar
│   │   → Protected by Clerk middleware
│   │
│   ├── explore/                        # /explore — PRIMARY SCREEN
│   │   └── page.tsx                    # Full-screen map + draggable bottom sheet
│   │       → MapContainer (Google Maps via @vis.gl/react-google-maps)
│   │       → CategoryPills (18 categories, horizontal scroll)
│   │       → PlaceCard list (horizontal variant, infinite scroll via TanStack Query)
│   │       → AI Plan FAB ("AI Plan My Day")
│   │       → Zustand map-store: center, zoom, userLocation, selectedPlaceId
│   │
│   ├── search/                         # /search — GLOBAL SEARCH
│   │   └── page.tsx                    # Category grid + recent/trending + Algolia results
│   │       → Command-palette style with keyboard nav
│   │       → Geo-search with facet filters (category, price, rating, distance)
│   │       → Search history persisted to backend
│   │
│   ├── ai-planner/                     # /ai-planner — AI TRAVEL ASSISTANT
│   │   └── page.tsx                    # Chat UI with streaming (SSE)
│   │       → Quick prompt chips for common requests
│   │       → Message bubbles with itinerary card rendering
│   │       → Loading indicator (three-dot bounce)
│   │       → Persists chat history per user
│   │
│   ├── trips/                          # /trips — TRIP MANAGEMENT
│   │   ├── page.tsx                    # Trip list with status filters
│   │   │   → Cards: destination, dates, budget, AI badge, public/private
│   │   │   → Filter: All / Planned / Active / Completed
│   │   │   → Empty state: "Plan your first trip"
│   │   └── [id]/                       # /trips/:id — SINGLE TRIP VIEW
│   │       └── page.tsx                # Day-by-day timeline, map overview, budget
│   │           → Drag-to-reorder stops
│   │           → Collaborator avatars
│   │           → Export (PDF, GPX) + Share
│   │
│   ├── profile/                        # /profile — USER PROFILE
│   │   ├── page.tsx                    # My profile: avatar, stats, menu sections
│   │   │   → Stats: trips, reviews, photos, followers
│   │   │   → Menu: Favorites, Reviews, Photos, Places, Achievements
│   │   │   → Settings, Notifications, Privacy, Subscription, Help
│   │   ├── [id]/                       # /profile/:id — OTHER USER'S PUBLIC PROFILE
│   │   │   └── page.tsx                # Public stats, recent activity, follow button
│   │   ├── edit/                       # /profile/edit
│   │   │   └── page.tsx                # Edit name, bio, avatar, home city, travel style
│   │   ├── favorites/                  # /profile/favorites
│   │   │   └── page.tsx                # Saved places with list organization
│   │   ├── reviews/                    # /profile/reviews
│   │   │   └── page.tsx                # All reviews by current user
│   │   ├── photos/                     # /profile/photos
│   │   │   └── page.tsx                # Photo gallery (grid layout)
│   │   ├── places/                     # /profile/places
│   │   │   └── page.tsx                # Places visited (from location history)
│   │   └── achievements/               # /profile/achievements
│   │       └── page.tsx                # Achievement grid with progress bars
│   │
│   ├── settings/                       # /settings — APP SETTINGS
│   │   ├── page.tsx                    # General: theme, language, units
│   │   ├── privacy/                    # /settings/privacy
│   │   │   └── page.tsx                # Location sharing, profile visibility, data export
│   │   ├── subscription/               # /settings/subscription
│   │   │   └── page.tsx                # Plan management (Free/Pro/Enterprise), billing
│   │   └── notifications/             # /settings/notifications
│   │       └── page.tsx                # Notification type toggles, quiet hours
│   │
│   └── notifications/                  # /notifications — INBOX
│       └── page.tsx                    # Notification feed (grouped by date)
│           → Types: review requests, achievements, follows, trip reminders
│           → Swipe-to-dismiss, mark-all-read
│
├── places/                             # PUBLIC PLACE PAGES
│   └── [id]/                           # /places/:id (SSR + ISR)
│       ├── page.tsx                    # Place detail with tabbed content
│       │   → Hero image carousel with gradient overlay
│       │   → Quick actions: Directions, Save, Share
│       │   → Info tab: description, hours, amenities, transport options
│       │   → Reviews tab: AI-summarized reviews, rating distribution
│       │   → Photos tab: masonry grid from users + Google
│       │   → "You Might Also Like" carousel
│       ├── reviews/                    # /places/:id/reviews
│       │   └── page.tsx                # Full review list with sort/filter
│       └── photos/                     # /places/:id/photos
│           └── page.tsx                # Full photo gallery
│
├── business/                           # BUSINESS PORTAL
│   ├── dashboard/                      # /business/dashboard
│   │   └── page.tsx                    # Overview: views, clicks, direction requests
│   ├── analytics/                      # /business/analytics
│   │   └── page.tsx                    # Detailed charts: traffic, demographics, peak hours
│   └── promotions/                     # /business/promotions
│       └── page.tsx                    # Create/manage promotions + ad campaigns
│
├── admin/                              # ADMIN PANEL (admin+ only)
│   ├── users/                          # /admin/users
│   │   └── page.tsx                    # User management: search, suspend, role change
│   ├── places/                         # /admin/places
│   │   └── page.tsx                    # Place management: feature, hide, merge
│   ├── analytics/                      # /admin/analytics
│   │   └── page.tsx                    # Platform-wide analytics dashboard
│   └── moderation/                     # /admin/moderation
│       └── page.tsx                    # Review/photo/post moderation queue
│
└── api/                                # BFF API ROUTES (Next.js Route Handlers)
    ├── webhooks/clerk/                 # POST /api/webhooks/clerk
    │   → Receives user.created, user.updated, user.deleted from Clerk
    │   → Syncs clerkId → internal User table in PostgreSQL
    ├── webhooks/stripe/                # POST /api/webhooks/stripe
    │   → Handles subscription lifecycle events
    ├── trpc/[trpc]/                    # tRPC endpoint (type-safe BFF → client)
    ├── places/nearby/                  # GET /api/places/nearby?lat=&lng=&radius=
    │   → BFF proxy to NestJS /api/v1/places/nearby
    │   → Adds edge caching headers (stale-while-revalidate)
    └── ai/stream/                      # POST /api/ai/stream
        → SSE streaming proxy for AI chat responses
        → Handles connection lifecycle (abort, timeout)
```

### 3.2 Components (`src/components/`)

Organized by domain, not by type. Each component file is self-contained with its types, styles, and logic.

```
src/components/
├── ui/                                 # PRIMITIVES — Shadcn UI design system
│   │   → button.tsx                    # 7 variants, 6 sizes, loading state, asChild
│   │   → card.tsx                      # Card, CardHeader, CardTitle, CardDescription,
│   │   → sheet.tsx                     #   CardContent, CardFooter
│   │   → badge.tsx                     # 6 variants: default, secondary, destructive,
│   │   → skeleton.tsx                  #   outline, success, warning
│   │   → avatar.tsx                    # Shimmer animation + 3 layout presets
│   │   → input.tsx                     # Avatar, AvatarImage, AvatarFallback
│   │   → dialog.tsx                    # Modal dialog with overlay
│   │   → dropdown-menu.tsx             # Dropdown with submenus
│   │   → command.tsx                   # ⌘K command palette primitive
│   │   → tabs.tsx                      # Tabbed content panels
│   │   → toast.tsx                     # Sonner-based toast notifications
│   │   → select.tsx                    # Dropdown select
│   │   → slider.tsx                    # Range slider (for filters)
│   │   → switch.tsx                    # Toggle switch
│   │   → tooltip.tsx                   # Hover tooltip
│   │   → separator.tsx                 # Horizontal/vertical divider
│   │   → label.tsx                     # Form label
│   │   → accordion.tsx                 # Expandable sections
│   │   → scroll-area.tsx              # Custom scroll container
│   │   → carousel.tsx                  # Embla-based carousel
│   │   └── index.ts                    # Barrel export of all primitives
│
├── layout/                             # APP SHELL
│   ├── main-layout.tsx                 # Authenticated page wrapper
│   ├── bottom-nav.tsx                  # 5-tab navigation (Explore, Search, AI, Trips, Profile)
│   ├── top-bar.tsx                     # Header with back, title, search, notifications
│   ├── sidebar.tsx                     # Desktop sidebar (future: tablet+ only)
│   └── shell.tsx                       # Composes top-bar + main area + bottom-nav
│
├── map/                                # GOOGLE MAPS INTEGRATION
│   ├── map-container.tsx               # Map wrapper: geolocation watch, camera state, styling
│   ├── map-controls.tsx                # Locate-me, zoom ±, map/satellite toggle
│   ├── map-marker.tsx                  # Custom marker (category icon + rating badge)
│   ├── place-card-marker.tsx           # Marker that expands to mini place card on click
│   ├── search-box.tsx                  # Google Places Autocomplete overlay
│   ├── cluster-marker.tsx              # Marker clustering for dense areas
│   ├── user-location-marker.tsx        # Pulsing blue dot for user position
│   └── route-polyline.tsx              # Route line rendering with color coding
│
├── places/                             # PLACE DISCOVERY
│   ├── place-card.tsx                  # 3 variants: horizontal, vertical, compact
│   ├── category-pills.tsx              # 18-category horizontal scroll bar
│   ├── nearby-list.tsx                 # Infinite-scroll nearby place list
│   ├── opening-hours.tsx               # Structured hours display with "Open Now"
│   ├── price-indicator.tsx             # $–$$$$ visual indicator
│   ├── ai-review-summary.tsx           # AI-generated review summary card
│   ├── transport-options-list.tsx      # Side-by-side transport comparison
│   ├── trending-badge.tsx              # 🔥 Trending animated badge
│   ├── hidden-gem-badge.tsx           # 💎 Hidden Gem animated badge
│   └── details/                        # Place detail sub-components
│       ├── place-hero.tsx              # Hero image carousel with gradient
│       ├── place-info.tsx              # About, hours, amenities
│       ├── place-actions.tsx           # Directions, Save, Share bar
│       └── place-reviews-tab.tsx       # Review list with sort + AI summary
│
├── search/                             # SEARCH UI
│   ├── global-search-dialog.tsx        # ⌘K-style overlay search
│   ├── search-results.tsx              # Unified results (places, users, trips)
│   ├── search-filters.tsx              # Facet filter bar (category, price, rating)
│   ├── recent-searches.tsx             # Recent + trending suggestions
│   └── search-hit.tsx                  # Single Algolia search result with highlighting
│
├── trips/                              # TRIP PLANNING UI
│   ├── trip-card.tsx                   # Trip list card
│   ├── trip-timeline.tsx               # Vertical timeline: day → stops
│   ├── trip-day-card.tsx               # Day container with stops
│   ├── trip-stop.tsx                   # Individual stop with time, place, transport
│   ├── trip-map-overview.tsx           # Full trip on map with numbered markers
│   ├── trip-budget-bar.tsx             # Budget progress bar
│   └── trip-share-dialog.tsx           # Share modal with collaborator invites
│
├── ai/                                 # AI FEATURES
│   ├── ai-chat.tsx                     # Full chat interface
│   ├── ai-message.tsx                  # Message bubble (user/AI variants)
│   ├── ai-itinerary-card.tsx           # Rendered itinerary from AI response
│   ├── ai-recommendation-card.tsx      # Place recommendation from AI
│   ├── ai-typing-indicator.tsx         # Animated dots during generation
│   └── ai-quick-prompts.tsx            # Suggested prompt chips
│
├── social/                             # SOCIAL FEATURES
│   ├── feed-card.tsx                   # Post in social feed
│   ├── review-card.tsx                 # Review display with photo grid
│   ├── review-form.tsx                 # Star rating + photo upload + tags
│   ├── user-badge.tsx                  # Level/achievement icon
│   ├── follow-button.tsx              # Follow/unfollow with optimistic UI
│   └── achievement-toast.tsx           # Custom toast for achievement unlock
│
├── business/                           # BUSINESS DASHBOARD
│   ├── analytics-chart.tsx             # Chart.js/Recharts wrapper
│   ├── promotion-form.tsx              # Create/edit promotion form
│   ├── claim-flow.tsx                  # Multi-step business claim wizard
│   └── review-reply-form.tsx           # Business reply to reviews
│
├── onboarding/                         # ONBOARDING WIZARD
│   ├── interest-selector.tsx           # Multi-select travel interests
│   ├── budget-selector.tsx             # Budget level cards
│   ├── location-permission.tsx         # Geolocation permission screen
│   └── progress-bar.tsx                # Step indicator
│
└── shared/                             # CROSS-CUTTING COMPONENTS
    ├── empty-state.tsx                  # Illustrated "Nothing here yet" with CTA
    ├── error-state.tsx                  # Error with retry button
    ├── loading-skeleton.tsx             # Content-aware skeleton loader
    ├── infinite-scroll.tsx              # Intersection Observer wrapper
    ├── image-carousel.tsx              # Swipeable image gallery
    ├── rating-stars.tsx                # 1-5 star display + input
    ├── confirm-dialog.tsx              # Destructive action confirmation
    ├── offline-banner.tsx              # "You're offline" top banner
    ├── share-sheet.tsx                 # Native share or fallback
    └── error-boundary/                 # React error boundary
        └── error-boundary.tsx          # Catches render errors, logs to Sentry
```

### 3.3 Hooks (`src/hooks/`)

Custom React hooks encapsulating reusable logic with proper cleanup and SSR safety.

```
src/hooks/
├── use-current-location.ts             # Geolocation with permission handling
├── use-nearby-places.ts                # TanStack Query wrapper for nearby discovery
├── use-place-detail.ts                 # Single place fetch with ISR revalidation
├── use-search.ts                       # Debounced search with Algolia
├── use-favorites.ts                    # Optimistic add/remove favorites
├── use-reviews.ts                      # Review CRUD with optimistic updates
├── use-trip-planner.ts                 # Trip state machine (draft → planned → active)
├── use-ai-chat.ts                      # SSE streaming chat hook
├── use-transport.ts                    # Route comparison data fetching
├── use-media-query.ts                  # Responsive breakpoint detection
├── use-debounce.ts                     # Generic value debouncing
├── use-intersection-observer.ts        # Element visibility detection
├── use-geolocation-watch.ts            # Background location tracking
├── use-network-status.ts              # Online/offline detection
└── use-keyboard-shortcut.ts           # Keyboard shortcut registration
```

### 3.4 Stores (`src/stores/`)

Zustand stores for client-side state. Lightweight, no providers needed.

```
src/stores/
├── map-store.ts                        # Map viewport, user location, selected place
│   → State: center, zoom, userLocation, selectedPlaceId,
│            activeCategory, bottomSheetOpen, bottomSheetSnap
│   → Actions: setCenter, setZoom, setUserLocation, setSelectedPlaceId
│
├── user-store.ts                       # User preferences (persisted to localStorage)
│   → State: isOnboardingComplete, preferences, recentPlaces[]
│   → Persisted via zustand/middleware persist
│
├── search-store.ts                     # Search query, filters, results
│   → State: query, filters, results, isSearching, recentSearches[]
│
├── trip-store.ts                       # Current trip being planned/edited
│   → State: trip data, days, stops, unsaved changes flag
│
├── ui-store.ts                         # Global UI state
│   → State: activeSheet, activeModal, sidebarOpen, toasts[]
│
├── ai-store.ts                         # AI chat messages and streaming state
│   → State: messages[], isStreaming, currentResponse, error
│
├── notification-store.ts              # Client notification queue
│   → State: unreadCount, notifications[], pushPermission
│
└── index.ts                            # Barrel export
```

### 3.5 Services (`src/services/`)

Typed API client functions. Each service corresponds to a backend module.

```
src/services/
├── places.service.ts                   # nearby(), search(), getById(), trending(),
│                                       #   hiddenGems(), similar(), mapBounds(), autocomplete()
├── search.service.ts                   # globalSearch(), suggestions(), indexSync()
├── ai.service.ts                       # recommendFood(), planTrip(), chat(), feedback()
├── trips.service.ts                    # CRUD, addStop(), reorder(), optimize(), export()
├── social.service.ts                   # feed(), createPost(), like(), follow(), activity()
├── reviews.service.ts                  # CRUD, helpful(), uploadPhoto(), report()
├── favorites.service.ts               # add(), remove(), lists(), addToList()
├── business.service.ts                 # claim(), analytics(), promotions(), ads()
├── users.service.ts                    # getProfile(), updateProfile(), follow(), search()
├── notifications.service.ts           # list(), markRead(), markAllRead(), settings()
├── transport.service.ts               # compare(), fareEstimate(), schedules(), carbon()
├── upload.service.ts                   # Supabase upload with progress tracking
└── subscription.service.ts            # plans(), checkout(), cancel(), resume()
```

### 3.6 Other Frontend Directories

```
src/
├── lib/                                # Pure utility functions (no React)
│   ├── utils.ts                        # cn(), formatCurrency, formatDistance, formatDuration
│   ├── api.ts                          # Fetch wrapper with error handling + auth
│   ├── constants.ts                    # App constants (categories, transport, Malaysian data)
│   ├── maps.ts                         # Google Maps style configs, marker factories
│   ├── geolocation.ts                  # Geolocation API wrappers
│   ├── formatters.ts                   # Date, currency, number formatters
│   ├── validators.ts                   # Zod schemas for client-side validation
│   └── analytics.ts                    # PostHog event tracking helpers
│
├── providers/                          # React context providers
│   ├── root-provider.tsx               # Composes all providers in correct order
│   ├── auth-provider.tsx               # ClerkProvider with appearance theming
│   ├── query-provider.tsx              # TanStack QueryClientProvider
│   ├── map-provider.tsx                # Google Maps APIProvider
│   ├── theme-provider.tsx              # next-themes ThemeProvider
│   ├── toast-provider.tsx              # Sonner Toaster
│   └── posthog-provider.tsx            # PostHog analytics
│
├── styles/                             # Global styles
│   ├── globals.css                     # Tailwind v4 + CSS variables (OKLCH) + glassmorphism
│   └── fonts.ts                        # Font configuration
│
├── types/                              # Frontend-specific types
│   ├── place.ts                        # PlaceResult, PlaceDetail, PlaceCategory
│   ├── user.ts                         # UserProfile, UserPreferences
│   ├── trip.ts                         # Trip, TripDay, TripStop, TransportMode
│   ├── ai.ts                           # ChatMessage, Itinerary, Recommendation
│   ├── api.ts                          # ApiResponse<T>, PaginatedResponse<T>, ApiError
│   └── index.ts                        # Barrel export
│
└── config/                             # Frontend runtime configuration
    ├── site.ts                         # Site metadata, default SEO
    ├── maps.ts                         # Map defaults (KL center, zoom, radius)
    └── navigation.ts                   # Nav item definitions, route map
```

---

## 4. Backend — `apps/api/`

**Stack:** NestJS 11 · TypeScript · Prisma · PostgreSQL · Redis  
**Deployment:** Railway  
**Package:** `@exploremy/api`

### 4.1 Module Architecture

Each module follows NestJS conventions: `*.module.ts` (DI registration), `*.controller.ts` (route handlers), `*.service.ts` (business logic), `dto/` (request/response validation).

```
src/modules/
├── auth/                               # AUTHENTICATION & AUTHORIZATION
│   ├── auth.module.ts                  # DI: AuthService, ClerkStrategy, RolesGuard
│   ├── auth.controller.ts              # POST /auth/webhooks/clerk, POST /auth/refresh
│   ├── auth.service.ts                 # Clerk webhook handling, JWT validation, session mgmt
│   └── dto/                            # OnboardingDto, RefreshTokenDto
│
├── users/                              # USER MANAGEMENT
│   ├── users.module.ts                 # DI: UsersService, PrismaService
│   ├── users.controller.ts             # GET/PATCH /users/me, GET /users/:id,
│   │                                   #   POST/DELETE /users/:id/follow
│   ├── users.service.ts                # Profile CRUD, follow/unfollow, search
│   └── dto/                            # UpdateUserDto, UserQueryDto
│
├── places/                             # PLACE DISCOVERY ENGINE
│   ├── places.module.ts                # DI: PlacesService, PlacesSyncService,
│   │                                   #   GooglePlacesClient, AlgoliaService
│   ├── places.controller.ts            # GET /places/nearby, /places/search, /places/:id,
│   │                                   #   /places/trending, /places/hidden-gems
│   ├── places.service.ts               # Place CRUD, scoring algorithms,
│   │                                   #   hidden gem detection, trending calculation
│   ├── places-sync.service.ts          # Google Places → internal DB sync pipeline
│   │                                   #   Scheduled via @nestjs/schedule (cron)
│   └── dto/                            # NearbyQueryDto, SearchQueryDto, CreatePlaceDto
│
├── reviews/                            # REVIEW SYSTEM
│   ├── reviews.module.ts               # DI: ReviewsService, ModerationService
│   ├── reviews.controller.ts           # CRUD /places/:placeId/reviews,
│   │                                   #   POST /reviews/:id/helpful, /reviews/:id/report
│   ├── reviews.service.ts              # Review CRUD, helpful voting, AI summary trigger
│   └── dto/                            # CreateReviewDto, UpdateReviewDto
│
├── photos/                             # PHOTO MANAGEMENT
│   ├── photos.module.ts                # DI: PhotosService, SupabaseStorageService
│   ├── photos.controller.ts            # POST /photos/upload, DELETE /photos/:id
│   ├── photos.service.ts               # Upload to Supabase, AI tagging (OpenAI Vision),
│   │                                   #   thumbnail generation, EXIF extraction
│   └── dto/                            # UploadPhotoDto, UpdatePhotoDto
│
├── favorites/                          # FAVORITES & COLLECTIONS
│   ├── favorites.module.ts
│   ├── favorites.controller.ts         # CRUD /users/me/favorites,
│   │                                   #   CRUD /users/me/favorites/lists
│   ├── favorites.service.ts            # Add/remove favorites, list management, reorder
│   └── dto/                            # CreateFavoriteListDto, ReorderListDto
│
├── trips/                              # TRIP PLANNING
│   ├── trips.module.ts                 # DI: TripsService, RouteOptimizerService
│   ├── trips.controller.ts             # CRUD /trips, /trips/:id/days, /trips/:id/stops
│   ├── trips.service.ts                # Trip CRUD, day/stop management,
│   │                                   #   budget calculation, collaborator mgmt
│   └── dto/                            # CreateTripDto, AddStopDto, ReorderStopsDto
│
├── routes/                             # ROUTE PLANNING ENGINE
│   ├── routes.module.ts                # DI: RoutesService, RouteOptimizerService,
│   │                                   #   GoogleDirectionsClient
│   ├── routes.controller.ts            # POST /routes/plan, /routes/compare,
│   │                                   #   POST /routes/optimize, POST /routes/waypoints
│   ├── routes.service.ts               # Route calculation, caching (Redis TTL),
│   │                                   #   polyline encoding/decoding
│   ├── route-optimizer.service.ts      # Custom A* with multi-weight scoring
│   │                                   #   Route types: FASTEST, CHEAPEST, SCENIC,
│   │                                   #   TOURIST, FOOD — each with unique weight profile
│   └── dto/                            # PlanRouteDto, OptimizeRouteDto
│
├── transport/                          # MULTI-TRANSPORT COMPARISON
│   ├── transport.module.ts             # DI: TransportService, TransportCostService
│   ├── transport.controller.ts         # GET /transport/fare-estimate,
│   │                                   #   GET /transport/schedules, GET /transport/carbon
│   ├── transport.service.ts            # Multi-mode comparison (12 modes),
│   │                                   #   GTFS schedule parsing (MRT/LRT/KTM/ETS)
│   ├── transport-cost.service.ts       # Fare estimation: tolls, fuel, Grab API, public transit
│   └── dto/                            # FareEstimateDto, ScheduleQueryDto
│
├── ai/                                 # AI ORCHESTRATOR
│   ├── ai.module.ts                    # DI: AIService, AIOrchestratorService,
│   │                                   #   OpenAIClient, GeminiClient
│   ├── ai.controller.ts                # POST /ai/recommend/*, /ai/plan/*,
│   │                                   #   POST /ai/chat, POST /ai/chat/stream
│   ├── ai.service.ts                   # Request routing, response parsing, caching,
│   │                                   #   feedback collection
│   ├── ai-orchestrator.service.ts      # Dual-model strategy:
│   │                                   #   GPT-4o for complex planning,
│   │                                   #   Gemini 2.5 Flash for simple recommendations
│   │                                   #   Automatic fallback on timeout/error
│   ├── prompts/                        # PROMPT ENGINEERING
│   │   ├── food.prompt.ts              # Malaysian food context + structured output schema
│   │   ├── attraction.prompt.ts        # Attraction recommendation with distance scoring
│   │   ├── itinerary.prompt.ts         # Multi-day itinerary with route optimization
│   │   ├── weekend.prompt.ts           # Weekend plan within budget + travel time
│   │   └── system.prompt.ts            # Base system prompt: Malaysian travel expert persona
│   └── dto/                            # RecommendDto, PlanTripDto, ChatDto
│
├── social/                             # SOCIAL PLATFORM
│   ├── social.module.ts
│   ├── social.controller.ts            # CRUD /social/posts, /social/posts/:id/comments,
│   │                                   #   POST|DELETE /social/posts/:id/like
│   ├── social.service.ts               # Feed aggregation (following + trending),
│   │                                   #   post/comment CRUD, like toggle
│   └── dto/                            # CreatePostDto, CreateCommentDto
│
├── business/                           # BUSINESS DASHBOARD
│   ├── business.module.ts              # DI: BusinessService, StripeService
│   ├── business.controller.ts          # POST /business/claim, GET /business/dashboard,
│   │                                   #   CRUD /business/dashboard/promotions
│   ├── business.service.ts             # Claim verification, analytics aggregation,
│   │                                   #   promotion management, ad campaign delivery
│   └── dto/                            # ClaimBusinessDto, CreatePromotionDto
│
├── search/                             # SEARCH (ALGOLIA PROXY)
│   ├── search.module.ts                # DI: SearchService, AlgoliaService
│   ├── search.controller.ts            # GET /search, GET /search/suggestions
│   ├── search.service.ts               # Algolia index management, search with geo-ranking,
│   │                                   #   index sync from Prisma → Algolia (queue job)
│   └── dto/                            # SearchQueryDto
│
├── notifications/                      # PUSH + IN-APP NOTIFICATIONS
│   ├── notifications.module.ts         # DI: NotificationsService, PushService
│   ├── notifications.controller.ts     # GET /notifications,
│   │                                   #   PATCH /notifications/:id/read
│   ├── notifications.service.ts        # Create/deliver notifications,
│   │                                   #   push via Expo Push (mobile) or Web Push
│   └── dto/                            # NotificationQueryDto
│
├── events/                             # LOCAL EVENTS
│   ├── events.module.ts
│   ├── events.controller.ts            # GET /events, GET /events/:id,
│   │                                   #   GET /events/this-weekend
│   ├── events.service.ts               # Event aggregation (external APIs + user submitted),
│   │                                   #   verification, geocoding
│   └── dto/                            # EventQueryDto, CreateEventDto
│
├── achievements/                       # GAMIFICATION
│   ├── achievements.module.ts
│   ├── achievements.controller.ts      # GET /achievements, GET /users/me/achievements,
│   │                                   #   GET /achievements/leaderboard
│   ├── achievements.service.ts         # Achievement evaluation (event-driven),
│   │                                   #   XP calculation, level progression, leaderboard
│   └── dto/                            # AchievementQueryDto
│
├── subscriptions/                      # MONETIZATION
│   ├── subscriptions.module.ts         # DI: SubscriptionsService, StripeService
│   ├── subscriptions.controller.ts     # GET /subscriptions/plans,
│   │                                   #   POST /subscriptions/checkout
│   ├── subscriptions.service.ts        # Plan management, Stripe checkout sessions,
│   │                                   #   webhook handling, upgrade/downgrade
│   └── dto/                            # CheckoutDto
│
└── location/                           # LOCATION HISTORY
    ├── location.module.ts
    ├── location.controller.ts          # POST /location/report, GET /location/history
    ├── location.service.ts             # Batch location ingestion,
    │                                   #   reverse geocoding, activity detection
    └── dto/                            # LocationReportDto, LocationHistoryQueryDto
```

### 4.2 Shared Kernel (`src/common/`)

Cross-cutting infrastructure used by all modules. No business logic here.

```
src/common/
├── decorators/                         # CUSTOM DECORATORS
│   ├── current-user.decorator.ts       # @CurrentUser() → extracts user from JWT
│   ├── roles.decorator.ts              # @Roles(UserRole.ADMIN) → RBAC metadata
│   ├── public.decorator.ts             # @Public() → bypasses auth guard
│   ├── api-paginated.decorator.ts      # @ApiPaginated() → Swagger pagination docs
│   └── cache.decorator.ts              # @Cache(ttl) → method-level Redis caching
│
├── guards/                             # AUTH & ACCESS GUARDS
│   ├── clerk-auth.guard.ts             # Validates Clerk JWT, attaches user to request
│   ├── roles.guard.ts                  # Reads @Roles() metadata, checks user role
│   ├── business-owner.guard.ts         # Verifies user owns the target business
│   └── throttle.guard.ts              # Rate limiting per user/IP using Redis
│
├── interceptors/                       # RESPONSE TRANSFORMATION
│   ├── transform.interceptor.ts        # Wraps all responses in { data, meta, requestId }
│   ├── cache.interceptor.ts            # Automatic GET caching via Redis (Cache-Control)
│   ├── logging.interceptor.ts          # Request/response logging with duration
│   └── metrics.interceptor.ts          # Prometheus metrics emission
│
├── pipes/                              # INPUT VALIDATION
│   ├── validation.pipe.ts              # Global Zod/class-validator pipe
│   └── parse-uuid.pipe.ts             # Validates UUID route parameters
│
├── filters/                            # EXCEPTION HANDLING
│   ├── http-exception.filter.ts        # Standardized error response format
│   ├── prisma-exception.filter.ts      # Prisma error code → HTTP status mapping
│   └── all-exceptions.filter.ts        # Catch-all for unhandled exceptions → Sentry
│
├── middleware/                          # EXPRESS MIDDLEWARE
│   ├── request-id.middleware.ts         # UUID per request, passed via x-request-id
│   ├── cors.middleware.ts               # CORS configuration per environment
│   └── audit-log.middleware.ts          # Writes mutation events to api_audit_logs table
│
├── interfaces/                         # SHARED INTERFACES
│   ├── pagination.interface.ts         # PaginatedResponse<T>, PaginationMeta
│   ├── api-response.interface.ts       # ApiResponse<T>, ApiError
│   ├── jwt-payload.interface.ts        # Clerk JWT claims shape
│   └── geo-location.interface.ts       # LatLng, GeoBounds
│
├── dto/                                # SHARED DTOS
│   ├── pagination.dto.ts               # PaginationQueryDto (page, limit, sortBy, sortOrder)
│   ├── geo-location.dto.ts             # GeoLocationDto, GeoBoundsDto
│   └── date-range.dto.ts               # DateRangeDto (startDate, endDate)
│
├── constants/                          # SHARED CONSTANTS
│   ├── roles.constant.ts               # UserRole enum + role hierarchy
│   ├── categories.constant.ts          # PlaceCategory enum + metadata
│   └── error-codes.constant.ts         # Internal error code catalog
│
├── utils/                              # PURE UTILITY FUNCTIONS
│   ├── geo.util.ts                     # Haversine distance, bounding box, midpoint
│   ├── haversine.util.ts               # Precision distance calculation
│   ├── slug.util.ts                    # URL-safe slug generation
│   └── crypto.util.ts                 # Hashing, token generation
│
└── testing/                            # TEST UTILITIES (not compiled in prod)
    ├── test-setup.ts                    # Jest global setup
    ├── prisma-mock.ts                   # Prisma client mock factory
    ├── create-mock-user.ts             # Test user fixture
    └── api-client.ts                   # Supertest wrapper with auth
```

### 4.3 Infrastructure Directories

```
src/
├── config/                             # CONFIGURATION MODULE
│   ├── app.config.ts                   # App-level config (port, cors, env)
│   ├── database.config.ts              # Prisma connection config
│   ├── redis.config.ts                 # Redis/Upstash connection config
│   ├── google-maps.config.ts           # Google Maps API key + region
│   ├── openai.config.ts                # OpenAI API key + default model
│   ├── gemini.config.ts                # Gemini API key + default model
│   ├── algolia.config.ts               # Algolia app ID + indices
│   ├── supabase.config.ts              # Supabase URL + keys
│   ├── stripe.config.ts                # Stripe keys + webhook secret
│   └── clerk.config.ts                 # Clerk secret + webhook verification
│
├── database/                           # DATABASE MODULE
│   ├── database.module.ts              # Global PrismaModule (exports PrismaService)
│   └── prisma.service.ts               # PrismaClient singleton with soft-delete middleware
│       → Extends PrismaClient with $on, $connect, $disconnect lifecycle
│       → Applies soft-delete filter middleware for User model
│       → Logs slow queries (>500ms) via Pino
│
├── queue/                              # BACKGROUND JOB QUEUE (BullMQ + Redis)
│   ├── queue.module.ts                 # BullModule registration
│   ├── queue.service.ts               # Job enqueuing with retry/backoff config
│   └── processors/                     # JOB PROCESSORS
│       ├── ai-recommendation.processor.ts  # Async AI recommendation generation
│       ├── place-sync.processor.ts         # Google Places → DB sync jobs
│       ├── search-index.processor.ts       # Prisma → Algolia index sync
│       ├── notification.processor.ts       # Batch push notification dispatch
│       └── photo-processing.processor.ts   # Image resize, optimization, AI tagging
│
├── health/                             # HEALTH CHECKS
│   ├── health.module.ts                # Terminus health module
│   └── health.controller.ts            # GET /health (DB, Redis, external API checks)
│       → Returns JSON: { status, details: { database, redis, googleMaps, openai } }
│
└── main.ts                             # APPLICATION ENTRY POINT
    → Creates NestJS app with Express platform
    → Registers global pipes, filters, interceptors
    → Configures Swagger documentation
    → Starts HTTP server on PORT (default 3001)
    → Graceful shutdown handling (SIGTERM, SIGINT)
```

### 4.4 Test Structure

```
test/
├── unit/                               # Unit tests (per module, co-located or here)
│   → Test individual services with mocked dependencies
│   → Fast, no database/network
│
├── integration/                        # Integration tests
│   → Test controller + service + real database (test container)
│   → Reset DB between test suites
│
└── e2e/                                # End-to-end tests
    → Full HTTP request/response cycle
    → Supertest against running app instance
    → Seed test data before suite
```

---

## 5. Shared Packages — `packages/`

Internal libraries consumed by `apps/web` and `apps/api`. Each package has its own `package.json`, `tsconfig.json`, and barrel exports.

### 5.1 `packages/shared/` — `@exploremy/shared`

**Purpose:** Types, enums, constants, validation schemas, and utilities shared between frontend and backend. Zero runtime dependencies except `zod`.

```
packages/shared/src/
├── types/                              # SHARED TYPE DEFINITIONS
│   ├── user.types.ts                   # User, Profile, UserPreferences
│   ├── place.types.ts                  # Place, PlaceCategory, PlaceFilter
│   ├── review.types.ts                 # Review, ReviewStats, ReviewFilter
│   ├── trip.types.ts                   # Trip, TripDay, TripStop
│   ├── route.types.ts                  # Route, Waypoint, RouteType
│   ├── transport.types.ts              # TransportMode, TransportOption, FareEstimate
│   ├── ai.types.ts                     # AIRecommendation, ChatMessage, Itinerary
│   ├── api.types.ts                    # ApiResponse<T>, PaginatedResponse<T>
│   └── index.ts                        # Barrel: re-exports all types
│
├── enums/                              # SHARED ENUMERATIONS
│   ├── place-category.enum.ts          # PlaceCategory (25 values)
│   ├── transport-mode.enum.ts          # TransportMode (12 values)
│   ├── trip-status.enum.ts             # TripStatus (DRAFT→CANCELLED)
│   ├── notification-type.enum.ts       # NotificationType (14 values)
│   ├── achievement-code.enum.ts        # AchievementCode (20+ codes)
│   ├── subscription-plan.enum.ts       # SubscriptionPlan (FREE/PRO/ENTERPRISE)
│   ├── user-role.enum.ts               # UserRole (7 levels)
│   └── index.ts                        # Barrel: re-exports all enums
│
├── constants/                          # SHARED CONSTANTS
│   ├── malaysia-states.ts              # 16 states with codes
│   ├── malaysia-cities.ts              # 50+ cities with lat/lng
│   ├── categories.ts                   # Category metadata (icon, color, label)
│   ├── limits.ts                       # Pagination, radius, rate limits
│   └── index.ts                        # Barrel
│
├── utils/                              # SHARED PURE FUNCTIONS
│   ├── geo.ts                          # Haversine, bounding box, distance
│   ├── formatters.ts                   # Currency (MYR), distance, duration
│   ├── validators.ts                   # Email, phone (MY format), URL
│   └── index.ts                        # Barrel
│
├── validation/                         # ZOD SCHEMAS (shared validation)
│   ├── place.schema.ts                 # CreatePlaceSchema, NearbyQuerySchema
│   ├── review.schema.ts                # CreateReviewSchema (rating 1-5)
│   ├── trip.schema.ts                  # CreateTripSchema, AddStopSchema
│   ├── user.schema.ts                  # UpdateProfileSchema, PreferencesSchema
│   └── index.ts                        # Barrel
│
├── package.json
├── tsconfig.json
└── index.ts                            # Public API barrel export
```

### 5.2 `packages/database/` — `@exploremy/database`

**Purpose:** Prisma ORM schema, generated client, migration history, and seed data. The single source of truth for database structure.

```
packages/database/
├── prisma/
│   ├── schema.prisma                   # 32 models, 16 enums, PostGIS + pgvector
│   ├── migrations/                     # Prisma migration history (auto-generated)
│   │   └── 20260613000000_initial/     # Initial migration
│   └── seeds/                          # SEED DATA SCRIPTS
│       ├── index.ts                    # Orchestrator: runs all seed files in order
│       ├── users.seed.ts               # Demo users (traveler, foodie, business owner)
│       ├── places-kuala-lumpur.seed.ts # 500+ KL places (restaurants, attractions, etc.)
│       ├── places-penang.seed.ts       # 300+ Penang places
│       ├── places-johor.seed.ts        # 200+ Johor Bahru places
│       ├── achievements.seed.ts        # 20+ achievement definitions
│       └── categories.seed.ts          # Category metadata
│
├── src/
│   ├── index.ts                        # Public API: exports prisma, types
│   ├── client.ts                       # PrismaClient singleton with production config
│   │   → Connection pooling (pgbouncer)
│   │   → Query logging in development
│   │   → Soft-delete middleware for User
│   └── types.ts                        # Re-exports generated Prisma types
│
├── package.json                        # Scripts: db:generate, db:migrate, db:seed, db:studio
└── tsconfig.json
```

### 5.3 `packages/config/` — `@exploremy/config`

**Purpose:** Environment variable validation and typed configuration shared across apps.

```
packages/config/src/
├── index.ts                            # Public API
├── env.ts                              # Zod-validated environment variables
│   → Parses process.env at startup
│   → Throws on missing required vars with clear error messages
│   → Exports typed config object: config.database.url, config.redis.url, etc.
└── constants.ts                        # Derived constants from env
│
├── package.json
└── tsconfig.json
```

### 5.4 `packages/ui/` — `@exploremy/ui`

**Purpose:** Shared UI components and design tokens consumed by `apps/web` and future `apps/mobile`.

```
packages/ui/src/
├── index.ts                            # Public API
├── design-tokens.ts                    # Colors, spacing, typography, shadows
├── icon-library.ts                     # Curated icon set (Lucide mappings)
└── (shared UI primitives that both web and mobile consume)
│
├── package.json
└── tsconfig.json
```

---

## 6. Tooling — `tooling/`

Development-only configuration. Never imported by application code. Never deployed.

### 6.1 `tooling/eslint/` — `@exploremy/eslint-config`

```
tooling/eslint/
├── base.js                             # Base rules: TypeScript strict, import ordering, unicorn
│   → @typescript-eslint with type-checking
│   → import/order with groups
│   → no-console (warn), eqeqeq (error)
│   → Unicorn best practices
│
├── next.js                             # Next.js-specific: extends base + next/core-web-vitals
│   → react/jsx-no-leaked-render
│   → react-hooks/rules-of-hooks
│   → @next/next/no-img-element
│
├── nest.js                             # NestJS-specific: extends base, loosens class rules
│   → Allows non-extraneous classes (DTOs)
│   → Allows console (NestJS logger)
│
└── package.json
```

### 6.2 `tooling/typescript/` — `@exploremy/tsconfig`

```
tooling/typescript/
├── base.json                           # Strict mode, ES2022, bundler resolution
├── next.json                           # Adds DOM libs, JSX preserve, Next.js paths
├── nest.json                           # CommonJS module, decorators, emit
└── package.json
```

---

## 7. Infrastructure — `infrastructure/`

Infrastructure as Code. Defines all cloud resources declaratively.

### 7.1 Terraform (`infrastructure/terraform/`)

```
infrastructure/terraform/
├── environments/
│   ├── production/                     # Production environment
│   │   ├── main.tf                     # Provider + backend config
│   │   ├── variables.tf                # Environment-specific variables
│   │   ├── terraform.tfvars            # Secret values (gitignored)
│   │   └── outputs.tf                  # Output values (DB URL, API URL)
│   │
│   └── staging/                        # Staging environment (mirrors production)
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
│
└── modules/                            # REUSABLE MODULES
    ├── database/                       # PostgreSQL on Railway
    │   ├── main.tf                     # Railway PostgreSQL resource
    │   ├── variables.tf                # DB size, region, version
    │   └── outputs.tf                  # DATABASE_URL
    │
    ├── redis/                          # Redis on Upstash
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    │
    └── compute/                        # Compute (Railway service)
        ├── main.tf                     # Railway service definition
        ├── variables.tf                # CPU, memory, scaling
        └── outputs.tf                  # Service URL
```

### 7.2 Kubernetes (`infrastructure/kubernetes/`)

For future multi-region or advanced scaling needs.

```
infrastructure/kubernetes/
├── base/                               # BASE CONFIGURATION (all environments)
│   ├── kustomization.yaml
│   ├── deployment.yaml                 # Base deployment spec
│   ├── service.yaml                    # ClusterIP service
│   ├── ingress.yaml                    # Ingress rules
│   └── configmap.yaml                  # Non-secret config
│
└── overlays/
    ├── production/                     # Production overrides
    │   ├── kustomization.yaml          # Patches: replicas=3, resources=high
    │   └── deployment-patch.yaml
    │
    └── staging/                        # Staging overrides
        ├── kustomization.yaml          # Patches: replicas=1, resources=low
        └── deployment-patch.yaml
```

---

## 8. Docker — `docker/`

Container definitions for local development and CI testing.

```
docker/
├── docker-compose.dev.yml              # LOCAL DEVELOPMENT ENVIRONMENT
│   → postgres: PostGIS 16 on :5432
│   → redis: Redis 7 on :6379
│   → redisinsight: Redis GUI on :5540 (optional)
│   → Volumes: pgdata, redisdata (persisted between restarts)
│   → Healthchecks: pg_isready, redis-cli ping
│
├── docker-compose.test.yml             # CI TESTING ENVIRONMENT
│   → postgres: ephemeral (no volume)
│   → redis: ephemeral
│   → Runs on random ports to avoid conflicts
│
├── Dockerfile.web                      # NEXT.JS PRODUCTION IMAGE
│   → Stage 1 (deps): Install workspace dependencies
│   → Stage 2 (builder): Build with Turborepo
│   → Stage 3 (runner): node:20-alpine, standalone output
│   → User: nextjs (non-root, uid 1001)
│   → Exposes :3000
│
├── Dockerfile.api                      # NESTJS PRODUCTION IMAGE
│   → Stage 1 (deps): Install + prune prod deps
│   → Stage 2 (builder): Build NestJS
│   → Stage 3 (runner): node:20-alpine, dist + prisma
│   → User: nestjs (non-root, uid 1001)
│   → Exposes :3001
│
└── nginx/                              # (Optional) Reverse proxy config
    └── nginx.conf
```

---

## 9. CI/CD — `.github/`

GitHub Actions workflows for continuous integration and deployment.

### 9.1 `.github/workflows/`

```
.github/workflows/
├── ci.yml                              # CONTINUOUS INTEGRATION
│   → Triggers: push to main/develop, PRs
│   → Jobs:
│       • lint (ESLint + Prettier — 10 min timeout)
│       • type-check (tsc —noEmit — all workspaces)
│       • test (Jest + Supertest — Postgres + Redis service containers)
│       • build (production build with Turborepo cache)
│       • security (npm audit + Snyk scan)
│       • bundle-analysis (Next.js bundle analyzer on PRs)
│   → Concurrency: cancel-in-progress on PRs
│
├── deploy-preview.yml                  # PREVIEW DEPLOYMENTS
│   → Triggers: PR opened/synced
│   → Deploys to Vercel preview URL
│   → Comments preview URL on PR
│   → Cleans up on PR close
│
├── deploy-production.yml               # PRODUCTION DEPLOYMENT
│   → Triggers: push to main, manual workflow_dispatch
│   → Jobs:
│       • deploy-web (Vercel production)
│       • deploy-api (Railway production)
│       • migrate-db (Prisma migrate deploy)
│       • health-check (curl web + api /health)
│       • notify (Slack success/failure)
│   → Environment: production (with protection rules)
│
├── deploy-staging.yml                  # STAGING DEPLOYMENT
│   → Triggers: push to develop
│   → Same structure as production but to staging environment
│
└── code-quality.yml                    # SCHEDULED CODE QUALITY
    → Triggers: cron (weekly, Sunday 3am)
    → Jobs: dependency audit, unused export detection,
            dead code analysis, bundle size trend
```

### 9.2 Other GitHub Config

```
.github/
├── dependabot.yml                      # Automated dependency updates
│   → Weekly schedule
│   → Grouped PRs for minor/patch
│   → Labels: dependencies
│
├── CODEOWNERS                          # PR review assignment
│   → apps/web/ @frontend-team
│   → apps/api/ @backend-team
│   → packages/database/ @backend-team
│   → infrastructure/ @devops-team
│
└── PULL_REQUEST_TEMPLATE.md            # Standard PR checklist
    → What changed, why, testing done, screenshots
```

---

## 10. Scripts & Config

### 10.1 `scripts/`

Automation scripts for development and operations workflows.

```
scripts/
├── db/
│   ├── seed-local.sh                   # Seeds local DB with Malaysian place data
│   └── reset-local.sh                  # Drops + recreates + seeds local DB
│
├── deploy/
│   ├── vercel.sh                       # Vercel deploy with env validation
│   └── railway.sh                      # Railway deploy with health check wait
│
├── ci/
│   ├── check-prerequisites.sh          # Validates Node, pnpm, Docker versions
│   └── run-e2e.sh                      # Starts services, runs E2E, tears down
│
├── setup.sh                            # First-time setup: install deps, init DB, seed
└── generate-api-types.sh               # Pulls OpenAPI spec → generates TS types
```

### 10.2 `config/`

Runtime configuration files that don't belong in environment variables.

```
config/
├── nginx.conf                          # Reverse proxy rules (if self-hosted)
├── logrotate.conf                      # Log rotation config (production)
└── prometheus-rules.yml               # Alert rules for production monitoring
```

---

## 11. Environment Strategy

### Variable Scoping

| File | Scope | Committed | Purpose |
|------|-------|-----------|---------|
| `.env.example` | All environments | ✅ Yes | Template with documentation |
| `.env.local.example` | Local dev | ✅ Yes | Docker-friendly dev defaults |
| `.env.local` | Local dev | ❌ No | Developer's personal keys |
| `.env.production` | Production | ❌ No | Injected by Vercel/Railway at deploy |
| `.env.staging` | Staging | ❌ No | Injected by deployment platform |
| `.env.test` | CI/CD | ❌ No | Set in GitHub Actions secrets |

### Variable Categories

| Category | Prefix | Examples |
|----------|--------|---------|
| **Public** (exposed to browser) | `NEXT_PUBLIC_*` | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` |
| **Private** (server only) | no prefix | `DATABASE_URL`, `OPENAI_API_KEY`, `STRIPE_SECRET_KEY` |
| **Build-time** | `*` | All `NEXT_PUBLIC_*` + framework vars |
| **Runtime** | `*` | Database, Redis, API keys — can change without rebuild |

---

## 12. Dependency Graph

### Internal Package Dependencies

```
@exploremy/web
  ├── @exploremy/shared         (types, enums, validation)
  ├── @exploremy/database       (Prisma client, types)
  ├── @exploremy/ui             (shared components)
  └── @exploremy/config         (env validation)

@exploremy/api
  ├── @exploremy/shared         (types, enums, validation)
  ├── @exploremy/database       (Prisma client)
  └── @exploremy/config         (env validation)

@exploremy/database
  └── @exploremy/config         (env for DATABASE_URL)

@exploremy/shared
  └── (zero internal deps — foundation layer)

@exploremy/config
  └── (zero internal deps — foundation layer)

@exploremy/ui
  └── @exploremy/shared         (types only)
```

### External Service Dependencies

```
apps/web ──────────────────► Clerk (auth)
apps/web ──────────────────► Google Maps (maps)
apps/web ──────────────────► PostHog (analytics)
apps/web ──────────────────► Algolia (search)

apps/api ──────────────────► PostgreSQL (primary DB)
apps/api ──────────────────► Redis (cache, queue, rate limit)
apps/api ──────────────────► Supabase (file storage)
apps/api ──────────────────► OpenAI (AI — complex tasks)
apps/api ──────────────────► Gemini (AI — simple tasks)
apps/api ──────────────────► Google Maps APIs (places, directions, distance matrix)
apps/api ──────────────────► Algolia (search indexing)
apps/api ──────────────────► Stripe (payments)
apps/api ──────────────────► Clerk (webhooks, JWT verification)
apps/api ──────────────────► Sentry (error tracking)
```

---

## Directory Count Summary

| Section | Folders | Purpose |
|---------|---------|---------|
| `apps/web/` | 87 | Next.js frontend |
| `apps/api/` | 52 | NestJS backend |
| `packages/` | 16 | Shared libraries |
| `tooling/` | 2 | Dev config |
| `infrastructure/` | 12 | IaC |
| `docker/` | 1 (+ nginx) | Containers |
| `.github/` | 1 (+ workflows) | CI/CD |
| `scripts/` | 3 | Automation |
| `config/` | 1 | Runtime config |
| `docs/` | 1 | Documentation |
| **Total** | **~176** | |

---

*This document serves as the definitive reference for the ExploreMY AI monorepo architecture. Every folder has a clear, documented purpose. New team members should read this before writing any code.*
