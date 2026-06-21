# AI Roadtrip Generator — Product Specification

> **Product Team:** Ex-Google Maps PD · Ex-Waze PD · Ex-Roadtrippers Architect

---

## Executive Summary

Transform the generic "Stats" tab into an AI-powered Roadtrip Dashboard. Instead of flat numbers, users see an interactive route visualization with fuel stops, rest areas, and smart route optimization.

### Core Metric
> Roadtrip Confidence Score: 0-100 indicating how optimized the route is.

---

## Route Optimization Algorithm

### Multi-Objective Scoring
```
RouteScore = w1 × TimeEfficiency + w2 × CostEfficiency + w3 × ScenicValue + w4 × SafetyScore

Weights by mode:
FASTEST:   w1=1.0, w2=0.0, w3=0.0, w4=0.3
CHEAPEST:  w1=0.0, w2=1.0, w3=0.2, w4=0.3
SCENIC:    w1=0.3, w2=0.2, w3=1.0, w4=0.3
FOODIE:    w1=0.4, w2=0.3, w3=0.5, w4=0.3
FAMILY:    w1=0.3, w2=0.4, w3=0.3, w4=1.0
COUPLE:    w1=0.3, w2=0.3, w3=0.8, w4=0.5
```

### Fuel Stop Optimization
```
fuelStops = totalDistance / vehicleRange
optimalStopDistance = totalDistance / (fuelStops + 1)
For each stop:
  find petrol stations within 5km of optimal distance point
  rank by: price × (1 - distanceFromOptimal / 10)
```

### Rest Stop Recommendation
```
restInterval = driver prefers break every 2 hours
For each rest interval:
  find R&R, rest areas, or cafes near the highway
  score by: facilities + cleanliness + distance from highway
```

---

## Mobile UI Components

### Roadtrip Dashboard Tab
```
┌──────────────────────────────────────────┐
│ 🚗 AI Roadtrip Generator                 │
│                                          │
│ 📍 KL → Penang                          │
│ 📏 354 km · 4h 15m · 3 fuel stops       │
│                                          │
│ 🛣️ Route Optimization                   │
│ ○ Fastest  ● Cheapest  ○ Scenic          │
│ ○ Food Route  ○ Family                   │
│                                          │
│ ⛽ Fuel Stops                            │
│ Stop 1: Petronas Tapah (127km)          │
│ Stop 2: Shell Ipoh (215km)              │
│ Stop 3: Petron Nibong Tebal (310km)     │
│                                          │
│ ☕ Rest Stops                            │
│ R&R Tapah · R&R Sg Perak                │
│                                          │
│ 💰 Roadtrip Budget                       │
│ ⛽ Fuel:   RM 85                         │
│ 🛣️ Toll:   RM 49.60                     │
│ ☕ Food:   RM 40                         │
│ 🏨 Hotel:  RM 200                        │
│ ─────────────────────                    │
│ 💰 Total:  RM 374.60                     │
│                                          │
│ 🚦 Live Conditions                      │
│ 🟢 Light traffic · ⛅ Clear · 32°C      │
│                                          │
│ [🔄 Regenerate Route] [📤 Share]        │
└──────────────────────────────────────────┘
```

---

## Database Schema

```prisma
model Roadtrip {
  id            String    @id @default(uuid())
  planId        String    @unique
  origin        String
  originLat     Float
  originLng     Float
  destination   String
  destLat       Float
  destLng       Float
  totalDistanceKm Float
  totalDurationMin Int
  vehicleType   VehicleType
  routeStrategy RouteStrategy
  
  fuelStops     Int
  restStops     Int
  tollCount     Int
  
  roadtripDNA   Json?    // adventure/nature/luxury/foodie scores
  
  fuelCost      Float
  tollCost      Float
  foodCost      Float
  hotelCost     Float
  totalCost     Float
  
  trafficLevel  String?
  weatherCondition String?
  
  routePolyline String?  @db.Text
  
  plan Plan @relation(fields: [planId], references: [id])
  stops RoadtripStop[]
  createdAt DateTime @default(now())
}

model RoadtripStop {
  id          String    @id @default(uuid())
  roadtripId  String
  order       Int
  type        StopType  // FUEL | REST | FOOD | ATTRACTION | HOTEL
  name        String
  lat         Float
  lng         Float
  distanceFromStart Float
  estimatedCost Float?
  
  roadtrip Roadtrip @relation(fields: [roadtripId], references: [id])
}

enum VehicleType { CAR_COMPACT CAR_MIDSIZE CAR_SUV CAR_MPV MOTORCYCLE }
enum RouteStrategy { FASTEST CHEAPEST SCENIC FOODIE FAMILY COUPLE }
enum StopType { FUEL REST FOOD CAFE ATTRACTION PHOTO HOTEL EMERGENCY }
```
