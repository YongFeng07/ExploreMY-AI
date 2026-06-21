# ExploreMY AI — Design System 2030

> **Design Leads:** Ex-Apple HID · Ex-Airbnb · Ex-Google Maps · Ex-Arc Browser · Ex-Tesla UI

---

## 1. Design Philosophy

**Map is the canvas. AI is the guide. Content floats on glass.**

Every screen obeys three rules:
1. The map is always visible (60-80% of viewport)
2. AI is always one tap away (floating copilot button)
3. Content is layered (glass cards over map)

---

## 2. Color System

```
BASE
Deep Midnight    #070B14  → Page background, depth base
Dark Navy        #0F1221  → Card backgrounds
Steel Gray       #1A1D2E  → Borders, dividers

ACCENT
Electric Cyan    #00E5FF  → Primary CTA, active states, AI pulse
Aurora Purple    #7C3AED  → Hidden gems, AI insights, magic moments
Travel Gold      #F59E0B  → Ratings, highlights, premium badges
Rose             #F43F5E  → Errors, urgency, limited-time

NEUTRAL
Starlight        #F8FAFC  → Primary text
Moon            #94A3B8  → Secondary text
Nebula          #475569  → Muted text, captions

GLASS
Glass BG         rgba(15,18,33,0.85)
Glass Border     rgba(255,255,255,0.08)
Glass Blur       24px
```

---

## 3. Typography

```
Font: Inter (UI) + SF Pro Display (headlines)

Scale:
Display  56px / 1.0 / -0.04em  → Hero titles
H1       40px / 1.1 / -0.03em  → Page titles
H2       28px / 1.2 / -0.02em  → Section headers
H3       20px / 1.3 / -0.01em  → Card titles
Body     16px / 1.5 / 0        → Descriptions
Caption  13px / 1.4 / 0.02em   → Labels
Micro    11px / 1.3 / 0.04em   → Badges, overlines
```

---

## 4. Depth System

```
Layer 0: Map canvas (z-0)
Layer 1: Floating elements — AI button, map controls (z-20)
Layer 2: Cards — place cards, stop cards (z-30)
Layer 3: Panels — AI copilot, search results (z-40)
Layer 4: Navigation — top bar, bottom nav (z-50)
Layer 5: Overlays — modals, sheets, dialogs (z-60)
Layer 6: System — toasts, tooltips (z-70)
```

---

## 5. Component Architecture

### Glass Card
```css
.glass-card {
  background: rgba(15, 18, 33, 0.85);
  backdrop-filter: blur(24px) saturate(1.8);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
}
```

### AI Copilot Button
```
Position: fixed, bottom center, above nav
Size: 64x64px
Shape: Circle
Background: Glass + Electric Cyan glow
Animation: Breathing pulse (3s infinite)
Icon: Sparkles
```

### Place Card (Immersive)
```
Layout: Full-width horizontal card
Photo: 120x120px, rounded-xl
Content: Name, rating, distance, match score, AI reason
Background: Glass
Hover: Scale 1.02 + shadow increase
```

### AI Copilot Panel
```
Position: Bottom sheet, expandable
Height: 60% → 90% viewport
Header: "AI Travel Copilot" + minimize button
Body: Chat messages (user + AI)
Footer: Input bar + voice button
Background: Deep glass
```

---

## 6. Bottom Navigation

```
5 items, floating glass bar
Icons: Discover (compass) | Map (pin) | [AI Button] | Trips (suitcase) | Profile (person)
Active: Electric Cyan glow
Inactive: Moon gray
Center AI button: Enlarged, glowing, breathing
```

---

## 7. Micro Interactions

- **Map pins**: Bounce on appear, pulse on hover
- **AI button**: Breathing glow (3s), ripple on tap
- **Cards**: Spring animation on expand (Framer Motion spring)
- **Page transitions**: Shared element transitions
- **Pull to refresh**: Aurora Purple shimmer
- **Loading**: Electric Cyan skeleton with wave
```

---

## 8. Implementation Checklist

- [ ] Deep Midnight color system in globals.css
- [ ] Glass card component system
- [ ] Map-first layout shell (map always visible)
- [ ] Floating AI Copilot button (animated, breathing)
- [ ] AI Copilot panel (chat interface)
- [ ] Immersive Place Cards (photo + scores)
- [ ] New bottom navigation (floating glass bar)
- [ ] Weekend Planner redesign (map-first timeline)
- [ ] Place detail page (cinematic, parallax hero)
- [ ] Micro animations (Framer Motion springs)
