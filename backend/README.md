# TrafficAI Backend - Smart City Command Center REST & Socket.IO Engine

Production-grade, modular **Node.js**, **Express.js**, **MongoDB Atlas / Mongoose**, and **Socket.IO** backend for the TrafficAI Smart City Traffic Management Command Center.

---

## 🌟 Key Features & Architectural Responsibilities

1. **Modular Server Architecture (`src/app.js`, `src/server.js`)**:
   - Express 4 application with security headers (`helmet`), CORS configuration, Morgan request logging, and robust JSON body parsers.
   - Centralized API router under `/api/v1` with standardized 404 and global error handlers.
   - Graceful shutdown handling (`SIGINT`, `SIGTERM`).
   - Healthcheck probe endpoints: `GET /health` and `GET /api/v1/health`.

2. **MongoDB Atlas Connection with Mongoose (`src/config/db.js`)**:
   - Connects to MongoDB Atlas URI (`MONGODB_URI`) with connection pooling, automatic reconnection, and socket timeout controls.
   - Automatic in-memory database fallback (`mongodb-memory-server`) during local testing or development if local MongoDB is not running, ensuring immediate out-of-the-box execution.
   - Automatic seeding on first startup (`src/utils/seedDatabase.js`) ensuring initial smart city dataset (KPIs, sectors, smart signals, active incidents, CCTV streams, emergency dispatches, and predictive curves) is available immediately.

3. **Secure Authentication & RBAC (`src/models/User.js`, `src/controllers/authController.js`)**:
   - User registration and login with `bcryptjs` password hashing (salt rounds: 10) and JSON Web Tokens (`jsonwebtoken`).
   - Role-Based Access Control (RBAC): `user`, `operator`, `admin`.
   - Protected routes using `authenticate` middleware and `authorize('admin', 'operator')`.
   - Seeded default accounts:
     - **Admin**: `admin@trafficai.gov` / `AdminPassword123!`
     - **Operator**: `operator@trafficai.gov` / `OperatorPassword123!`
     - **Civilian**: `user@trafficai.gov` / `UserPassword123!`

4. **Incident Management CRUD & Broadcasting (`src/controllers/incidentController.js`)**:
   - `GET /api/v1/traffic/incidents`: Filter by `sector`, `severity`, `status`, and `search`.
   - `GET /api/v1/traffic/incidents/:id`: Fetch single incident by custom ID (`INC-2026-XXX`) or MongoDB ID.
   - `POST /api/v1/traffic/incidents`: Report new incident with automatic ID assignment, units, and audit trail.
   - `PATCH /api/v1/traffic/incidents/:id/status`: Transition status (`Reported` → `Dispatched` → `Resolving` → `Resolved`), record timestamped history.
   - `PUT /api/v1/traffic/incidents/:id`: Full update.
   - `DELETE /api/v1/traffic/incidents/:id`: Delete incident (Admin/Operator only).

5. **Traffic Prediction & "What-If" Simulation (`src/controllers/predictionController.js`)**:
   - `GET /api/v1/traffic/predictions?horizon=24h`: 24-hour predictive flow curves (Actual vs. Baseline vs. AI Optimized), capacity limits, congestion index, and model metadata (`LSTM + GNN`, 96.4% confidence).
   - `POST /api/v1/traffic/predictions/simulate`: Dynamic scenario shock simulator factoring weather (rain/storm), events (concert/sports), lane closures, and autonomous AI mitigation offsets.
   - `GET /api/v1/traffic/bottlenecks`: Critical urban choke points ranked by Volume-to-Capacity (V/C) ratio with mitigation strategies.

6. **Multi-Modal Route Optimization (`src/controllers/routeController.js`, `src/services/routingEngine.js`)**:
   - `POST /api/v1/traffic/routes/plan`: Calculates 3 distinct route options:
     1. **AI Smart Dynamic Route** (Fastest, dynamically avoids active collisions, 94% green wave progression).
     2. **Shortest Distance Route** (Direct path through urban grid, calculates collision delay penalties).
     3. **Eco-Green Corridor** (Lowest emissions, optimal regenerative braking for EVs).
   - Dynamically checks active database incidents and adjusts delay penalties.

7. **Accident Shockwave Simulation (`src/controllers/simulationController.js`, `src/services/simulationEngine.js`)**:
   - `POST /api/v1/traffic/simulate/accident`: Implements Lighthill-Whitham-Richards (LWR) kinematic wave theory to compute shockwave speed $w = \frac{q_2 - q_1}{k_2 - k_1}$, queue spillback meters, volume-to-capacity surge, and upstream metering directives.

8. **Adaptive Signal Optimization (`src/controllers/signalController.js`, `src/services/signalEngine.js`)**:
   - `GET /api/v1/traffic/intersections`: Real-time queue telemetry across North, South, East, and West approaches.
   - `POST /api/v1/traffic/intersections/:id/signal-override`: Manual operator phase override with custom duration.
   - `POST /api/v1/traffic/intersections/:id/optimize`: Calculates optimal cycle length using Webster's formula $C_{opt} = \frac{1.5L + 5}{1 - Y}$ and queue-proportional green splits.
   - `POST /api/v1/traffic/signals/optimize-corridor`: Synchronized green wave progression along urban arterial corridors.

9. **Emergency Priority Routing & Green Wave Preemption (`src/controllers/emergencyController.js`)**:
   - `GET /api/v1/traffic/emergency`: Active emergency vehicle dispatches and preempted intersections.
   - `POST /api/v1/traffic/emergency/trigger-greenwave`: Code Red priority signal preemption locking corridor signals to 100% GREEN and conflicting cross-streets to RED clearance.
   - `POST /api/v1/traffic/emergency/cancel-greenwave`: Deactivates preemption and gracefully restores signals to AI Adaptive operation.

10. **Admin Analytics & IoT Telemetry (`src/controllers/analyticsController.js`)**:
    - `GET /api/v1/traffic/kpis`: Real-time KPIs with live incident counts from MongoDB.
    - `GET /api/v1/traffic/sectors`: Speed, congestion, and flow rate across 6 urban sectors.
    - `GET /api/v1/traffic/cameras`: CCTV streams, optical FPS, bitrate, and neural object detection statistics.
    - `GET /api/v1/traffic/analytics?range=7d`: Historical daily vehicle volumes and sensor network health.
    - `GET /api/v1/admin/audit-logs`: Chronological audit trail of operator overrides, emergency activations, and incident mutations.
    - `GET /api/v1/admin/users`: User management for system administrators.

11. **Socket.IO Real-Time Broadcasting (`src/services/socketService.js`)**:
    - Real-time event broadcasting over WebSockets:
      - `incident:created`: Emitted when new incident is registered.
      - `incident:updated`: Emitted on status or unit updates.
      - `incident:deleted`: Emitted on incident removal.
      - `signal:updated`: Emitted on manual overrides or AI phase changes.
      - `emergency:greenwave_activated`: Emitted when emergency preemption starts.
      - `emergency:greenwave_cancelled`: Emitted when emergency preemption is restored.
      - `simulation:accident_occurred`: Emitted on shockwave simulation.

---

## 📂 Project Structure

```
backend/
├── .env.example                     # Environment variables template
├── .env                             # Local environment configuration
├── package.json                     # Backend dependencies & test scripts
├── README.md                        # Documentation
├── TrafficAI.postman_collection.json # Exported Postman collection for all endpoints
├── src/
│   ├── app.js                       # Express app configuration & middleware
│   ├── server.js                    # HTTP server, Socket.IO & DB bootstrapper
│   ├── config/
│   │   ├── env.js                   # Environment config loader
│   │   ├── db.js                    # Mongoose Atlas connection manager with memory fallback
│   │   └── seedData.js              # Shared smart city dataset matching frontend contract
│   ├── models/
│   │   ├── User.js                  # User model (bcrypt, roles)
│   │   ├── Incident.js              # Incident model (CRUD, history, units)
│   │   ├── Intersection.js          # Smart intersection node model
│   │   ├── EmergencyDispatch.js     # Priority preemption dispatch model
│   │   ├── Prediction.js            # 24h curves & bottlenecks model
│   │   ├── Sector.js                # City sector metrics model
│   │   ├── Camera.js                # CCTV feed model
│   │   └── AuditLog.js              # Administrative audit log model
│   ├── controllers/
│   │   ├── authController.js        # Auth actions (register, login, me, logout)
│   │   ├── incidentController.js    # Incident CRUD, filters, history
│   │   ├── predictionController.js  # 24h predictions & scenario simulations
│   │   ├── routeController.js       # Multi-modal routing engine
│   │   ├── simulationController.js  # Accident shockwave simulation
│   │   ├── signalController.js      # Intersection overrides & Webster's optimization
│   │   ├── emergencyController.js   # Green wave preemption trigger/cancel
│   │   └── analyticsController.js   # KPIs, sectors, cameras, 7d analytics, audit logs
│   ├── routes/
│   │   ├── index.js                 # API v1 root router
│   │   ├── authRoutes.js            # /api/v1/auth
│   │   ├── trafficRoutes.js         # /api/v1/traffic
│   │   └── adminRoutes.js           # /api/v1/admin
│   ├── middleware/
│   │   ├── auth.js                  # JWT verification & RBAC authorization
│   │   ├── validation.js            # Request body validators
│   │   └── errorHandler.js          # 404 & global error middleware
│   ├── services/
│   │   ├── socketService.js         # Socket.IO emitter & room manager
│   │   ├── routingEngine.js         # Algorithmic routing with active incident penalties
│   │   ├── signalEngine.js          # Webster's minimum delay split calculation
│   │   └── simulationEngine.js      # LWR shockwave kinetic wave simulation
│   └── utils/
│       ├── seedDatabase.js          # Seeding script
│       └── logger.js                # Structured timestamped logger
└── tests/
    ├── api.test.js                  # Comprehensive automated unit & integration test suite (35 tests)
    ├── curl_tester.js               # Live HTTP endpoint test suite (21 endpoints)
    ├── verify_endpoints.ps1         # PowerShell REST verification script
    └── verify_endpoints.sh          # Linux/macOS curl verification script
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **MongoDB Atlas** account (or local MongoDB). If neither is configured, the server automatically starts an in-memory MongoDB instance for local testing without crashing.

### 2. Installation
```bash
# From repository root
cd backend
npm install
```

### 3. Environment Setup
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```

Configure your environment variables:
```ini
PORT=8000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/trafficai?retryWrites=true&w=majority
JWT_SECRET=trafficai_super_secret_jwt_key_2026_change_in_production
JWT_EXPIRES_IN=7d
ENABLE_SEED_ON_STARTUP=true
```

### 4. Running the Server

#### Development Mode (with hot-reload):
```bash
npm run dev
```

#### Production Mode:
```bash
npm start
```

#### Manual Database Seeding:
```bash
npm run seed
```

---

## 🧪 Testing

### 1. Automated Test Suite (35 tests covering all endpoints & Socket.IO):
```bash
npm test
```
Sample test output:
```
✔ 1. Server & Health Probe (2 tests)
✔ 2. User & Admin Authentication (7 tests)
✔ 3. Incident CRUD APIs & Socket.IO Broadcasting (6 tests)
✔ 4. Traffic Prediction & Bottlenecks APIs (3 tests)
✔ 5. Route Optimization API (2 tests)
✔ 6. Accident Simulation API (1 test)
✔ 7. Signal Optimization API (4 tests)
✔ 8. Emergency Routing & Green Wave Preemption API (3 tests)
✔ 9. Admin Analytics, KPIs & CCTV APIs (7 tests)
ℹ tests 35
ℹ pass 35
ℹ fail 0
```

### 2. Live HTTP & Curl Verification (against running server):
```bash
# Node.js automated verification
node tests/curl_tester.js

# PowerShell verification (Windows)
powershell -ExecutionPolicy Bypass -File tests/verify_endpoints.ps1

# Bash curl verification (Linux/macOS)
bash tests/verify_endpoints.sh
```

### 3. Postman Collection
Import `TrafficAI.postman_collection.json` into Postman. It includes pre-configured environment variables and automatically extracts JWT tokens on login.

---

## 📡 API Contract Reference

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Register new user/operator | No |
| `POST` | `/api/v1/auth/login` | Authenticate and obtain JWT token | No |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile | Bearer Token |
| `POST` | `/api/v1/auth/logout` | Terminate session | Optional |

### Traffic KPIs & Sectors (`/api/v1/traffic`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/traffic/kpis` | Real-time smart city KPIs |
| `GET` | `/api/v1/traffic/sectors` | Sector speeds, volume, congestion |

### Incidents (`/api/v1/traffic/incidents`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/traffic/incidents` | List incidents with filters (`severity`, `sector`, `status`, `search`) | No |
| `GET` | `/api/v1/traffic/incidents/:id` | Fetch incident details by ID | No |
| `POST` | `/api/v1/traffic/incidents` | Create incident (broadcasts `incident:created`) | Optional |
| `PATCH` | `/api/v1/traffic/incidents/:id/status` | Update status (broadcasts `incident:updated`) | Optional |
| `PUT` | `/api/v1/traffic/incidents/:id` | Full update | Operator / Admin |
| `DELETE` | `/api/v1/traffic/incidents/:id` | Remove incident (broadcasts `incident:deleted`) | Operator / Admin |

### Traffic Predictions & Simulations
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/traffic/predictions?horizon=24h` | 24-hour predictive curves & bottlenecks |
| `POST` | `/api/v1/traffic/predictions/simulate` | "What-If" scenario simulation |
| `GET` | `/api/v1/traffic/bottlenecks` | Ranked urban bottleneck choke points |
| `POST` | `/api/v1/traffic/simulate/accident` | LWR shockwave & queue spillback simulation |

### Multi-Modal Route Optimization
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/traffic/routes/plan` | Calculate AI Smart, Shortest, and Eco-Green alternatives |

### Smart Signal Control
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/traffic/intersections` | Live queues and phase states |
| `POST` | `/api/v1/traffic/intersections/:id/signal-override` | Operator manual phase override |
| `POST` | `/api/v1/traffic/intersections/:id/optimize` | Webster's adaptive split optimization |
| `POST` | `/api/v1/traffic/signals/optimize-corridor` | Arterial green wave coordination |

### Emergency Priority Green Wave
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/traffic/emergency` | Active emergency corridors & preempted signals |
| `POST` | `/api/v1/traffic/emergency/trigger-greenwave` | Activate Code Red signal preemption |
| `POST` | `/api/v1/traffic/emergency/cancel-greenwave` | Restore adaptive signal operation |

### Admin Analytics & CCTV Feeds
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/traffic/cameras` | CCTV streams & object detection stats | No |
| `GET` | `/api/v1/traffic/analytics?range=7d` | Corridor throughput & sensor health | No |
| `GET` | `/api/v1/admin/audit-logs` | Administrative audit trail | Admin |
| `GET` | `/api/v1/admin/users` | List all registered users | Admin |

---

## ⚡ Socket.IO Real-Time Events
Connect via WebSocket to `ws://localhost:8000`:
- **Subscribe to rooms**: `join:room` (`'incidents'`, `'emergency'`, `'signals'`)
- **Listen for events**:
  - `incident:created`: `{ id, title, severity, sector, status, ... }`
  - `incident:updated`: `{ id, status, history, assignedUnits, ... }`
  - `incident:deleted`: `{ id }`
  - `signal:updated`: `{ id, currentPhase, phaseColor, mode, ... }`
  - `emergency:greenwave_activated`: `{ id, unitCode, corridorName, ... }`
  - `emergency:greenwave_cancelled`: `{ dispatchId }`
  - `simulation:accident_occurred`: `{ simulationId, results, ... }`

