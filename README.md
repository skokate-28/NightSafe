# NightSafe — Crowdsourced Urban Safety Navigator

NightSafe is a full-stack web platform where users report unsafe locations in real time. The app computes the **safest walking route** between two points using a custom **Temporal-Decay Crowd-Weighted Bidirectional A\*** algorithm — not just the shortest path. Safety intelligence comes entirely from crowd-sourced incident reports, weighted by recency, time-of-day, community votes, and spatial clustering.

![Add screenshots here](./docs/screenshots-placeholder.png)

---

## How the Algorithm Works

NightSafe's routing engine is the core of the project. It runs in four stages before every route computation.

### 1. Temporal-Decay Report Weighting

Every incident report gets a dynamic **weight** that answers: *"How dangerous is this report right now?"*

```
BASE_WEIGHT = severity × (1 + net_score × 0.1)
```

Severity (1–5) is boosted by community votes (`net_score = upvotes − downvotes`).

Reports **fade over time** via exponential decay (half-life ≈ 87 hours):

```
DECAY_FACTOR = e^(−0.008 × hours_since_report)
```

A report from last night matters more than one from three weeks ago.

**Time-of-day matching** uses a Gaussian centered on the hour the incident occurred:

```
TIME_MULTIPLIER = 1 + 1.5 × e^(−(hour_delta² / 18))
```

Danger reported at 2 AM weighs more when you're walking at 2 AM than at 2 PM. `hour_delta` uses circular distance (handles midnight wraparound).

```
FINAL_WEIGHT = BASE_WEIGHT × DECAY_FACTOR × TIME_MULTIPLIER
```

### 2. Spatial Clustering with Cluster Gravity

Active reports are clustered using **PostGIS DBSCAN** (ε = 100 m, min 2 points). Each cluster gets a **gravity score**:

```
CLUSTER_GRAVITY = Σ(FINAL_WEIGHT of reports in cluster) × log(1 + report_count)
```

The logarithmic factor means 20 reports in one alley is *disproportionately* worse than 20 isolated reports — density matters.

Clusters are cached in Redis (`clusters:all`, 30 min TTL) and refreshed every 30 minutes via cron.

### 3. Edge Safety Penalty

The walkable graph is a **50 m grid** with 8-directional connectivity. Each edge's cost combines distance and safety:

```
EDGE_COST = DISTANCE + 3.5 × EDGE_PENALTY
```

For each danger cluster within 75 m of an edge midpoint:

```
PROXIMITY_FACTOR = 1 / (1 + (distance / 25)²)   // inverse-square falloff
EDGE_PENALTY += cluster.gravity × PROXIMITY_FACTOR
```

### 4. Bidirectional A*

Standard A* expanded from both origin and destination simultaneously:

- **Forward** search: origin → destination
- **Backward** search: destination → origin
- Alternating expansion, one node per side
- **Heuristic**: `haversine(n, target) × (1 + 0.2 × localDangerDensity)` — danger-aware, admissible-ish guiding
- **Termination**: when a node appears in both closed sets; pick the meeting point with minimum `g_forward + g_backward`
- A pure **Dijkstra** (distance-only) run on the same graph produces a "fastest route" for side-by-side comparison

**Safety score** (0–100): `100 − min(100, totalSafetyCost / normalizedMax × 100)` — higher is safer.

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, Vite, React Router v6, Tailwind CSS, Zustand, Leaflet + react-leaflet, Socket.io-client, Axios, React Hot Toast, date-fns, lucide-react |
| **Backend** | Node.js, Express, PostgreSQL + PostGIS, Redis (ioredis), Socket.io, JWT, bcryptjs, Cloudinary, Multer, node-cron |
| **Algorithm** | Custom binary min-heap, grid graph, bidirectional A*, PostGIS DBSCAN clustering |

---

## Project Structure

```
nightsafe/
├── client/          # React + Vite frontend
├── server/          # Express API + algorithm + socket + cron jobs
├── database/        # init.sql (PostgreSQL + PostGIS schema)
└── README.md
```

---

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ with **PostGIS** extension
- Redis
- Cloudinary account (optional, for photo uploads)

### 1. Clone & Install

```bash
git clone <repo-url>
cd nightsafe
npm run install:all
```

### 2. Database

```bash
createdb nightsafe
psql -d nightsafe -f database/init.sql
```

### 3. Environment Variables

**server/.env** (copy from `server/.env.example`):

```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/nightsafe
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**client/.env** (copy from `client/.env.example`):

```env
VITE_SERVER_URL=http://localhost:5000
```

### 4. Run

```bash
# From project root — starts both server and client
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:5000

---

## API Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register |
| POST | `/api/auth/login` | — | Login |
| POST | `/api/auth/refresh` | Cookie | Refresh access token |
| POST | `/api/auth/logout` | — | Logout |
| GET | `/api/auth/me` | Bearer | Current user |
| GET | `/api/reports` | — | Nearby reports (lat, lng, radius) |
| POST | `/api/reports` | Bearer | Create report |
| POST | `/api/reports/:id/vote` | Bearer | Upvote/downvote |
| POST | `/api/route/compute` | Bearer | Compute safe + fast routes |
| GET | `/api/route/history` | Bearer | Last 10 routes |
| GET | `/api/clusters` | — | Active danger clusters |
| GET | `/api/users/me/stats` | Bearer | User stats |

**Dev-only** (NODE_ENV !== production):

- `GET /api/dev/trigger-cluster` — manual cluster refresh
- `GET /api/dev/trigger-expire` — manual report expiration

---

## Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `map:subscribe` | Client → Server | Join bbox room for live updates |
| `map:unsubscribe` | Client → Server | Leave bbox room |
| `report:new` | Server → Client | New report in area |
| `report:updated` | Server → Client | Vote count changed |
| `cluster:updated` | Server → Client | Clusters recomputed |
| `heatmap:refresh` | Server → Client | Re-fetch heatmap data |

---

## Built By

NightSafe — a portfolio project demonstrating full-stack architecture, real-time systems, geospatial algorithms, and community-driven safety tooling.
