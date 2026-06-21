# ExploreMY AI — Social & Community Platform

> **Classification:** Internal — Social Platform Engineering  
> **Version:** 9.0  
> **Author:** Principal Social Platform Architect  
> **Target:** 5M MAU · 50M posts · 200M interactions · Phase 4 (Year 2)

---

## Section 1: User Profiles

### 1.1 Public Profile

```
┌──────────────────────────────────────────────┐
│  [Avatar]  Sarah Chen                        │
│            @sarahchen · Level 5 Explorer     │
│            🇲🇾 Kuala Lumpur                   │
│                                              │
│  📊  12 Trips   24 Reviews   48 Photos       │
│  🏆  Food Hunter · Hidden Gem Master         │
│                                              │
│  Travel DNA: 🍜 Foodie · 🏛️ Culture Seeker  │
│  Member since: January 2026                  │
│                                              │
│  [Follow] [Message]                          │
│                                              │
│  ── Recent Activity ──                       │
│  📍 Saved Nasi Lemak Tanglin · 2h ago       │
│  ⭐ Reviewed Batu Caves · 1d ago            │
│  📷 Added 3 photos to Penang trip           │
│                                              │
│  ── Photo Grid ──                            │
│  [📷] [📷] [📷]                               │
│  [📷] [📷] [📷]                               │
└──────────────────────────────────────────────┘
```

### 1.2 Profile Database

```sql
CREATE TABLE social.user_profiles (
    id              UUID PK DEFAULT gen_random_uuid_v7(),
    user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    username        VARCHAR(50) UNIQUE,
    cover_photo     VARCHAR(2048),
    website         VARCHAR(2048),
    travel_style    travel_style,
    is_public       BOOLEAN DEFAULT TRUE,
    show_activity   BOOLEAN DEFAULT TRUE,
    show_collections BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);
```

---

## Section 2-5: Travel Posts, Stories, Videos, Comments, Likes, Follows

### 2.1 Post Types

| Type | Description | Max Length | Media |
|------|-------------|-----------|-------|
| **Photo Post** | Travel photo + caption | 500 chars | 1-10 photos |
| **Review Post** | Auto-generated from review | — | Review photos |
| **Trip Post** | Auto-generated when trip completed | — | Trip cover |
| **Video Post** | Short travel video | 200 chars | 15-90s video |
| **Story** | Ephemeral, 24h | — | Photo or video |
| **Check-in** | "I'm at [Place]" | 100 chars | Optional photo |

### 2.2 Social Database

```sql
CREATE TABLE social.posts (
    id              UUID PK DEFAULT gen_random_uuid_v7(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content         TEXT,
    post_type       VARCHAR(20) DEFAULT 'photo',
    photos          JSONB,
    video_url       VARCHAR(2048),
    place_id        UUID REFERENCES places(id) ON DELETE SET NULL,
    trip_id         UUID REFERENCES trips(id) ON DELETE SET NULL,
    location_lat    DOUBLE PRECISION,
    location_lng    DOUBLE PRECISION,
    location_name   VARCHAR(255),
    like_count      INTEGER DEFAULT 0,
    comment_count   INTEGER DEFAULT 0,
    share_count     INTEGER DEFAULT 0,
    view_count      INTEGER DEFAULT 0,
    is_public       BOOLEAN DEFAULT TRUE,
    is_pinned       BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_posts_user ON social.posts(user_id, created_at DESC);
CREATE INDEX idx_posts_created ON social.posts(created_at DESC) WHERE is_public;
CREATE INDEX idx_posts_place ON social.posts(place_id);

CREATE TABLE social.stories (
    id              UUID PK DEFAULT gen_random_uuid_v7(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_url       VARCHAR(2048) NOT NULL,
    media_type      VARCHAR(10) DEFAULT 'photo',
    place_id        UUID REFERENCES places(id),
    expires_at      TIMESTAMPTZ NOT NULL,  -- created_at + 24h
    view_count      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_stories_active ON social.stories(user_id, expires_at) WHERE expires_at > now();

CREATE TABLE social.comments (
    id          UUID PK DEFAULT gen_random_uuid_v7(),
    post_id     UUID NOT NULL REFERENCES social.posts(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id   UUID REFERENCES social.comments(id) ON DELETE SET NULL,
    content     TEXT NOT NULL,
    like_count  INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_comments_post ON social.comments(post_id, created_at);
CREATE INDEX idx_comments_parent ON social.comments(parent_id);

CREATE TABLE social.likes (
    id          UUID PK DEFAULT gen_random_uuid_v7(),
    post_id     UUID NOT NULL REFERENCES social.posts(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE (post_id, user_id)
);

CREATE TABLE social.follows (
    id            UUID PK DEFAULT gen_random_uuid_v7(),
    follower_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at    TIMESTAMPTZ DEFAULT now(),
    UNIQUE (follower_id, following_id),
    CHECK (follower_id <> following_id)
);
CREATE INDEX idx_follows_follower ON social.follows(follower_id);
CREATE INDEX idx_follows_following ON social.follows(following_id);
```

---

## Section 8-9: Communities & Travel Groups

### 8.1 Community Types

| Type | Example | Join | Visibility |
|------|---------|------|-----------|
| **Public** | "KL Foodies" | Anyone | Public posts |
| **Private** | "Penang Hikers" | Request to join | Members only |
| **Location** | "Bukit Bintang Explorers" | Auto-join by location | Public |

### 8.2 Community Database

```sql
CREATE TABLE social.communities (
    id              UUID PK DEFAULT gen_random_uuid_v7(),
    name            VARCHAR(200) NOT NULL UNIQUE,
    description     TEXT,
    cover_photo     VARCHAR(2048),
    community_type  VARCHAR(20) DEFAULT 'public',
    category        VARCHAR(50),    -- food, hiking, photography, family, solo, digital_nomad
    city            VARCHAR(100),
    member_count    INTEGER DEFAULT 0,
    post_count      INTEGER DEFAULT 0,
    is_verified     BOOLEAN DEFAULT FALSE,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE social.community_members (
    id              UUID PK DEFAULT gen_random_uuid_v7(),
    community_id    UUID NOT NULL REFERENCES social.communities(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            VARCHAR(20) DEFAULT 'member',  -- admin, moderator, member
    joined_at       TIMESTAMPTZ DEFAULT now(),
    UNIQUE (community_id, user_id)
);

CREATE TABLE social.community_posts (
    id              UUID PK DEFAULT gen_random_uuid_v7(),
    community_id    UUID NOT NULL REFERENCES social.communities(id) ON DELETE CASCADE,
    post_id         UUID NOT NULL REFERENCES social.posts(id) ON DELETE CASCADE,
    is_pinned       BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (community_id, post_id)
);
```

---

## Section 10-11: Creator & Influencer Platform

### 10.1 Creator Tiers

| Tier | Requirements | Benefits |
|------|-------------|----------|
| **Rising Star** | 100+ followers, 10+ posts | Creator badge, analytics access |
| **Verified Creator** | 1K+ followers, 50+ posts, application | Verified badge, campaign access, affiliate links |
| **Elite Partner** | 10K+ followers, 100+ posts, invite-only | Revenue share 80/20, priority support, custom campaigns |

### 10.2 Creator Database

```sql
CREATE TABLE social.creators (
    id              UUID PK DEFAULT gen_random_uuid_v7(),
    user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    tier            VARCHAR(20) DEFAULT 'rising_star',
    niche           JSONB,       -- ["food","photography"]
    followers_count INTEGER DEFAULT 0,
    total_likes     INTEGER DEFAULT 0,
    total_views     INTEGER DEFAULT 0,
    avg_engagement  REAL DEFAULT 0,
    affiliate_code  VARCHAR(20) UNIQUE,
    earnings_total  NUMERIC(12,2) DEFAULT 0,
    joined_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE social.creator_campaigns (
    id              UUID PK DEFAULT gen_random_uuid_v7(),
    business_id     UUID NOT NULL REFERENCES business_accounts(id),
    title           VARCHAR(300) NOT NULL,
    description     TEXT,
    budget          NUMERIC(12,2),
    requirements   JSONB,
    creator_count   INTEGER DEFAULT 0,
    total_reach     INTEGER DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'active',
    start_date      TIMESTAMPTZ,
    end_date        TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE social.creator_earnings (
    id              UUID PK DEFAULT gen_random_uuid_v7(),
    creator_id      UUID NOT NULL REFERENCES social.creators(id),
    source          VARCHAR(50) NOT NULL,  -- campaign, affiliate, tips
    amount          NUMERIC(12,2) NOT NULL,
    platform_fee    NUMERIC(12,2) DEFAULT 0,
    reference_type  VARCHAR(50),
    reference_id    UUID,
    status          VARCHAR(20) DEFAULT 'pending',
    paid_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);
```

---

## Section 12-14: Feed Architecture

### 12.1 Feed Types & Ranking

```typescript
// Feed Personalization Algorithm
function rankFeedPost(post: Post, user: User, context: FeedContext): number {
  return (
    0.25 * affinityScore(user, post.author) +       // Follow/friend relationship
    0.20 * contentRelevance(post, user.interests) +  // Category + location match
    0.15 * engagementVelocity(post) +                // Likes/comments per hour
    0.15 * recencyScore(post) +                      // e^(-0.05 × hours_ago)
    0.10 * qualityScore(post) +                      // Photo quality + text length
    0.10 * locationRelevance(post, context.location) + // Nearby content
    0.05 * diversityBonus(post, context.recentPosts)  // Don't show same user twice
  );
}

const FEEDS = {
  FOLLOWING:  'Posts from followed users, sorted by recency × engagement',
  FOR_YOU:    'Algorithmic feed based on Travel DNA + location + trending',
  TRENDING:   'Posts with highest velocity in last 24h in user\'s city',
  NEARBY:     'Posts geo-tagged within 5km of user',
  COMMUNITY:  'Posts from joined communities, sorted by recency',
};
```

---

## Section 15-16: Moderation & Reporting

### 15.1 Automated Moderation

```typescript
const AUTO_MODERATION_RULES = [
  {
    name: 'profanity_filter',
    action: (text) => profanityScore(text) > 0.7 ? 'FLAG' : 'PASS',
  },
  {
    name: 'spam_detection',
    action: (post) => post.user.createdAt > Date.now() - 86400000 && post.user.postCount < 3
      ? 'FLAG' : 'PASS',
  },
  {
    name: 'image_safety',
    action: (photos) => checkImageSafety(photos), // NSFW detection via AI
  },
  {
    name: 'repost_detection',
    action: (post) => isDuplicate(post) ? 'BLOCK' : 'PASS',
  },
  {
    name: 'harassment_filter',
    action: (comment) => containsHarassment(comment) ? 'FLAG' : 'PASS',
  },
];
```

### 15.2 Moderation Queue

```sql
CREATE TABLE social.moderation_queue (
    id              UUID PK DEFAULT gen_random_uuid_v7(),
    content_type    VARCHAR(20) NOT NULL, -- post, comment, photo, story
    content_id      UUID NOT NULL,
    reporter_id     UUID REFERENCES users(id),
    reason          content_report_reason,
    description     TEXT,
    auto_flagged    BOOLEAN DEFAULT FALSE,
    risk_score      REAL DEFAULT 0,
    status          content_report_status DEFAULT 'pending',
    reviewed_by     UUID,
    reviewed_at     TIMESTAMPTZ,
    action_taken    VARCHAR(50),    -- approved, removed, warned, banned
    resolution      TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_mod_queue_status ON social.moderation_queue(status, created_at);
```

---

## Section 17: Reputation System

### 17.1 User Reputation Score

```typescript
function calculateReputation(user: User): Reputation {
  const signals = {
    reviewQuality:    avgReviewHelpfulness(user) * 0.25,
    contentQuality:   avgPostEngagement(user) * 0.20,
    consistency:      activeStreakMonths(user) / 12 * 0.15,
    communityContrib: communityPostsCount(user) / 100 * 0.15,
    verificationLevel: (user.isVerified ? 1 : 0) * 0.10,
    followerTrust:    followerToFollowingRatio(user) * 0.10,
    reportRecord:     (1 - reportsUpheldRatio(user)) * 0.05,
  };

  const score = Object.values(signals).reduce((s, v) => s + v, 0);

  return {
    score: Math.min(100, Math.round(score * 100)),
    tier: score > 80 ? 'Trusted' : score > 50 ? 'Established' : score > 20 ? 'Newcomer' : 'Beginner',
    badges: computeBadges(user),
  };
}
```

---

## Section 18-20: Analytics, Revenue, APIs

### 18.1 Community Analytics

```sql
CREATE VIEW social.community_analytics AS
SELECT
    c.id, c.name,
    c.member_count,
    COUNT(DISTINCT cp.post_id) AS posts_30d,
    COUNT(DISTINCT l.user_id) AS engagers_30d,
    ROUND(AVG(p.like_count + p.comment_count), 1) AS avg_engagement
FROM social.communities c
LEFT JOIN social.community_posts cp ON cp.community_id = c.id
LEFT JOIN social.posts p ON p.id = cp.post_id AND p.created_at > now() - interval '30 days'
LEFT JOIN social.likes l ON l.post_id = p.id
GROUP BY c.id;
```

### 18.2 Creator Revenue Model

```
Revenue Sources for Creators:
  ├── Brand Campaigns (70% to creator, 30% platform)
  ├── Affiliate Bookings (5% commission per booking via affiliate link)
  ├── Tips from Followers (90% to creator, 10% platform fee)
  └── Exclusive Content (subscription, 80% to creator)

Year 5 Creator Economy Target:
  • 5,000 active creators
  • RM 10M annual creator revenue
  • RM 2M platform revenue
```

### 18.3 Social APIs (64 Endpoints)

| Module | Count | Key Endpoints |
|--------|-------|---------------|
| Posts | 8 | `GET/POST /social/posts`, `GET /social/posts/:id`, `DELETE` |
| Stories | 5 | `GET/POST /social/stories`, `GET /stories/active` |
| Comments | 6 | `GET/POST /social/posts/:id/comments`, `DELETE` |
| Likes | 4 | `POST/DELETE /social/posts/:id/like`, `GET /likers` |
| Follows | 4 | `POST/DELETE /social/users/:id/follow`, `GET /followers`, `/following` |
| Communities | 10 | `GET/POST /social/communities`, `/join`, `/leave`, `/members` |
| Creators | 8 | `GET /creators/:id`, `/apply`, `/campaigns`, `/earnings` |
| Feed | 5 | `GET /social/feed/following`, `/for_you`, `/trending`, `/nearby` |
| Moderation | 7 | `GET /moderation/queue`, `PATCH /moderation/:id/review` |
| Analytics | 7 | `GET /social/analytics/user`, `/community`, `/creator` |
| **Total** | **64** | |

### 18.4 NestJS Social Modules

```
src/modules/social/
├── posts/           # Post CRUD, feed generation
├── stories/         # Ephemeral content
├── comments/        # Nested comment threads
├── likes/           # Like/unlike with optimistic UI
├── follows/         # Social graph management
├── communities/     # Community CRUD + membership
├── creators/        # Creator program management
├── feeds/           # Feed ranking + personalization
├── moderation/      # Auto-moderation + review queue
├── reputation/      # Reputation scoring
└── social-analytics/ # Engagement metrics
```

### 18.5 Social Database Tables: 15

```
social.user_profiles · social.posts · social.stories · social.comments
social.likes · social.follows · social.communities · social.community_members
social.community_posts · social.creators · social.creator_campaigns
social.creator_earnings · social.moderation_queue · social.reputation_scores
social.shares
```

---

*End of Social & Community Platform Blueprint — 20 sections complete.*
