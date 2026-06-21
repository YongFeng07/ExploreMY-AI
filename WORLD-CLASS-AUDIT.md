# ExploreMY AI — World-Class Product Audit

**Audited by:** Staff SWE, Principal Architect, Product Manager, Senior UI/UX Designer, AI Engineer, GIS Engineer, DevOps, DB Architect, Security Engineer

**Benchmarked against:** Instagram · Polarsteps · Airbnb · Google Maps

**Date:** 2026-06-19

---

## EXECUTIVE SUMMARY

ExploreMY AI has a solid foundation with working AI planners, Google Maps integration, and a decent auth system. However, it lacks the polish, depth, and production-grade infrastructure of world-class products. This audit identifies **47 critical gaps** across 8 dimensions.

**Overall Score: 42/100** (functional prototype, not production-ready)

---

## 1. PRODUCT EXPERIENCE (vs Instagram)

### 1.1 Content Discovery & Feed
| Gap | Severity | What Instagram Has |
|-----|----------|-------------------|
| No social feed | **CRITICAL** | Algorithmic feed of friends' trips, photos, reviews |
| No explore/discover algorithm | **CRITICAL** | AI-curated content based on interests |
| No save collections | HIGH | Save posts into named collections |
| No share to feed | HIGH | Share trips/photos to a public feed |
| No like/comment on user content | HIGH | Social engagement on trips and photos |

### 1.2 Visual Storytelling
| Gap | Severity | What Instagram Has |
|-----|----------|-------------------|
| No photo filters or editing | MEDIUM | Built-in photo editor with filters |
| No stories/reels | MEDIUM | 24h ephemeral content |
| No photo tagging | MEDIUM | Tag people and places in photos |
| Photo grid is basic | MEDIUM | Instagram's 3-column grid with preview on tap |

### 1.3 Social Features
| Gap | Severity | What Instagram Has |
|-----|----------|-------------------|
| Follow system exists but no discovery | HIGH | "Who to follow" suggestions |
| No activity feed | HIGH | "X liked your photo, Y followed you" |
| No direct messaging | LOW | DM for trip coordination |
| No notifications for likes/comments | HIGH | Real-time push notifications |

---

## 2. TRAVEL TRACKING (vs Polarsteps)

### 2.1 Automatic Travel Recording
| Gap | Severity | What Polarsteps Has |
|-----|----------|---------------------|
| **No GPS auto-tracking** | **CRITICAL** | Automatically records your route as you travel |
| **No travel map animation** | **CRITICAL** | Animated line drawing your journey on a map |
| No country/region detection | HIGH | Auto-detects which country/region you're in |
| No daily recap | HIGH | "Today you walked 12km, visited 3 places" |

### 2.2 Travel Statistics
| Gap | Severity | What Polarsteps Has |
|-----|----------|---------------------|
| No distance traveled | HIGH | Total km traveled across all trips |
| No countries percentage | MEDIUM | "% of world explored" stat |
| No travel streaks | MEDIUM | Consecutive days of travel |
| No yearly recap | MEDIUM | "Your 2025 in Travel" annual summary |

### 2.3 Travel Documentation
| Gap | Severity | What Polarsteps Has |
|-----|----------|---------------------|
| No travel book export | MEDIUM | Export trip as PDF/printed book |
| No auto photo grouping | HIGH | Photos auto-grouped by date and location |
| No offline mode | **CRITICAL** | Full app functionality without internet |

---

## 3. BOOKING & TRUST (vs Airbnb)

### 3.1 Place Discovery
| Gap | Severity | What Airbnb Has |
|-----|----------|-----------------|
| No wishlist collections | HIGH | Organize saved places into themed lists |
| No "I'm flexible" search | MEDIUM | Flexible date/region search |
| No price range filter | HIGH | Filter places by budget |
| No amenity filters | HIGH | Filter by WiFi, pool, parking, halal, etc. |
| No neighborhood info | MEDIUM | Local tips, safety, transit info per area |

### 3.2 Trust & Safety
| Gap | Severity | What Airbnb Has |
|-----|----------|-----------------|
| No verified reviews | HIGH | Reviews only from people who actually visited |
| No review categories | HIGH | Sub-scores: food quality, service, value, atmosphere |
| No host/business profiles | MEDIUM | Verified business accounts |
| No identity verification | HIGH | Verified ID badge on profiles |
| No report content feature | MEDIUM | Report inappropriate reviews or photos |

### 3.3 Booking Integration
| Gap | Severity | What Airbnb Has |
|-----|----------|-----------------|
| **No booking/payment system** | **CRITICAL** | Integrated booking with payment processing |
| No availability calendar | HIGH | Real-time availability for hotels/activities |
| No price breakdown | MEDIUM | Base price + taxes + fees |
| No cancellation policy | LOW | Free cancellation options |

---

## 4. MAPS & NAVIGATION (vs Google Maps)

### 4.1 Map Experience
| Gap | Severity | What Google Maps Has |
|-----|----------|----------------------|
| **No real-time GPS tracking** | **CRITICAL** | Blue dot follows your movement |
| **No turn-by-turn navigation** | **CRITICAL** | Voice-guided directions |
| No map customization | MEDIUM | Dark mode map, terrain, satellite |
| No Street View | HIGH | 360° street-level imagery |
| No indoor maps | LOW | Mall/airport indoor navigation |

### 4.2 Location Intelligence
| Gap | Severity | What Google Maps Has |
|-----|----------|----------------------|
| No live traffic | HIGH | Real-time traffic conditions |
| No transit directions | HIGH | Bus, MRT, LRT, KTM schedules |
| No area busyness | MEDIUM | Popular times for restaurants/attractions |
| No "Nearby" with live data | HIGH | Real-time open/closed, wait times |
| No offline maps | **CRITICAL** | Download areas for offline use |

### 4.3 Place Data
| Gap | Severity | What Google Maps Has |
|-----|----------|----------------------|
| No user-contributed photos | HIGH | Community-uploaded place photos |
| No Q&A section | MEDIUM | "Is this place halal?" community Q&A |
| No menu/price lists | MEDIUM | User-uploaded menus and price photos |
| No wait time estimates | MEDIUM | Average wait time at restaurants |

---

## 5. INFRASTRUCTURE & RELIABILITY

### 5.1 Database & Storage
| Gap | Severity | Status |
|-----|----------|--------|
| **No real database** | **CRITICAL** | Auth uses JSON file. No PostgreSQL despite schema. |
| No database migrations | CRITICAL | Prisma schema exists but never migrated |
| No backup strategy | CRITICAL | Data stored in one JSON file, no automated backups |
| No image CDN | HIGH | Uploads served from app server, no CDN/optimization |
| No Redis caching | HIGH | Redis installed but never used in application code |

### 5.2 Performance & Scale
| Gap | Severity | Status |
|-----|----------|--------|
| No caching layer | CRITICAL | Every Google API call is uncached |
| No rate limiting (most endpoints) | HIGH | Only login/register have rate limits |
| No pagination | HIGH | Some endpoints return all data without limits |
| No request compression | MEDIUM | Compression middleware installed but unconfigured |
| No CDN for static assets | MEDIUM | All assets served from single origin |

### 5.3 Security
| Gap | Severity | Status |
|-----|----------|--------|
| TLS bypass enabled | CRITICAL | `NODE_TLS_REJECT_UNAUTHORIZED=0` in production code |
| API keys exposed in source | CRITICAL | Google Maps keys committed to repository |
| JWT secret hardcoded | HIGH | Fallback secret in source code |
| No CSRF protection | HIGH | No CSRF tokens on forms |
| No Content Security Policy (API) | MEDIUM | CSP only on frontend |
| No input sanitization | MEDIUM | User content accepted without XSS filtering |

### 5.4 DevOps
| Gap | Severity | Status |
|-----|----------|--------|
| No CI/CD pipeline | HIGH | No automated build, test, deploy |
| No automated tests | CRITICAL | Zero tests (unit, integration, e2e) |
| No error monitoring | HIGH | Sentry installed but not configured |
| No performance monitoring | HIGH | No APM, no RUM |
| No logging infrastructure | MEDIUM | Console.log only, no structured logging |
| No health check dashboard | MEDIUM | Only basic /health endpoint |

---

## 6. USER EXPERIENCE

### 6.1 Onboarding
| Gap | Severity | Status |
|-----|----------|--------|
| **No onboarding flow** | **CRITICAL** | Users land on empty profile with no guidance |
| No tutorial/walkthrough | HIGH | No explanation of features on first use |
| No contextual tooltips | MEDIUM | No help icons explaining features |
| No sample data for new users | HIGH | Empty states everywhere for new users |

### 6.2 Accessibility
| Gap | Severity | Status |
|-----|----------|--------|
| No WCAG compliance | HIGH | No alt text consistency, no ARIA labels |
| No keyboard navigation | MEDIUM | Desktop users can't navigate without mouse |
| No screen reader support | HIGH | No semantic HTML structure |
| No font size controls | LOW | No text size adjustment |

### 6.3 Multi-Language
| Gap | Severity | Status |
|-----|----------|--------|
| **No multi-language support** | **CRITICAL** | Malaysia is trilingual (EN, MS, ZH). App is EN only. |
| No RTL support | LOW | Needed for Arabic/Malay Jawi |

### 6.4 Design Consistency
| Gap | Severity | Status |
|-----|----------|--------|
| Inconsistent design systems | HIGH | 3+ design systems mixed together in CSS |
| No dark mode | HIGH | Dark mode variables exist but not toggleable |
| No responsive design beyond mobile | MEDIUM | Tablet/desktop layouts not optimized |
| Inconsistent spacing | MEDIUM | Different pages use different spacing scales |
| Inconsistent border radius | LOW | Some 12px, some 16px, some 32px |

---

## 7. FEATURE COMPLETENESS

### 7.1 Missing World-Class Features

| Feature | Reference | Priority |
|---------|-----------|----------|
| Real-time GPS breadcrumb tracking | Polarsteps | P0 |
| Offline maps & caching | Google Maps | P0 |
| Push notifications (FCM/APNs) | Instagram | P0 |
| Multi-language (EN/MS/ZH) | Airbnb | P0 |
| User onboarding flow | All | P0 |
| Social activity feed | Instagram | P1 |
| Photo filters & editing | Instagram | P1 |
| Wishlist collections | Airbnb | P1 |
| Review categories & verified reviews | Airbnb | P1 |
| Travel statistics dashboard | Polarsteps | P1 |
| Neighborhood/local guides | Airbnb | P1 |
| Transit directions | Google Maps | P1 |
| Dark mode | All | P1 |
| Accessibility (WCAG AA) | All | P1 |
| Street View integration | Google Maps | P2 |
| Travel book export | Polarsteps | P2 |
| AI travel assistant chatbot | N/A | P2 |
| Group trip planning | N/A | P2 |
| Price alerts | Booking.com | P2 |
| Expense splitting | Splitwise | P2 |

### 7.2 Incomplete Existing Features

| Feature | Missing |
|---------|---------|
| Search | User search exists but no follow suggestions |
| Favorites | No collections/organization |
| Reviews | No photo upload, no sub-categories |
| Profile | No share profile, no QR code |
| Couple Space | No shared photo upload, no countdown widget |
| Wallet | No goal sharing, no recurring contributions |
| Admin | No analytics dashboard, no user growth charts |
| Notifications | No real push, no email notifications |

---

## 8. TECHNICAL DEBT

| Item | Impact |
|------|--------|
| 3 conflicting CSS design systems in globals.css | All pages render inconsistently |
| 20+ pages use raw `fetch()` instead of centralized API client | No error handling, no retry, no auth refresh |
| API keys in source code | Security vulnerability |
| TLS disabled globally | Security vulnerability |
| No TypeScript strict mode | Type safety gaps |
| No ESLint strict config | Code quality issues |
| JSON file as database | Data loss risk, no concurrency, no scaling |
| Mixed Tailwind v3/v4 configs | Build issues, CSS inconsistencies |

---

## PRIORITY ROADMAP

### THIS WEEK (P0 - Critical)
1. ✅ Fix all broken API calls (auth tokens, CORS)
2. ✅ Add proper loading/empty/error states to all pages
3. 🔴 Connect PostgreSQL database, run migrations
4. 🔴 Remove TLS bypass, rotate exposed API keys
5. 🔴 Add GPS auto-tracking breadcrumbs
6. 🔴 Build user onboarding flow (3-step wizard)

### NEXT 2 WEEKS (P1 - High)
1. Multi-language support (EN, MS, ZH)
2. Offline maps with Service Worker
3. Push notifications (FCM)
4. Social activity feed
5. Dark mode toggle
6. Photo filters/editing
7. Review categories
8. Wishlist collections

### NEXT MONTH (P2 - Medium)
1. Street View integration
2. Transit directions
3. Travel book export
4. Group trip planning
5. AI travel assistant
6. Expense splitting
7. Accessibility audit (WCAG AA)

---

## VERDICT

**ExploreMY AI is a functional prototype with genuine AI capabilities (DeepSeek planner, Google Maps integration).** It successfully demonstrates the core value proposition of AI-powered Malaysia travel planning.

However, it is **not ready for public launch**. The gaps vs world-class products are substantial:

- **Instagram**: Missing social feed, stories, photo editing, discovery algorithm
- **Polarsteps**: Missing GPS tracking, travel map animation, offline mode
- **Airbnb**: Missing booking, verified reviews, wishlist collections
- **Google Maps**: Missing navigation, transit, offline maps, Street View

**Immediate focus:** Database, onboarding, GPS tracking, push notifications.
**Then:** Multi-language, offline mode, social features.

The foundations are good. The execution needs another 3-6 months of focused development.
