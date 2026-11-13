# TrafficAI - Smart City Traffic Management Command Center

TrafficAI is a next-generation intelligent urban mobility and adaptive traffic management dashboard built with **React**, **Vite**, **Tailwind CSS**, **Recharts**, and **Lucide Icons**. It models a real-time digital twin of a smart city transit grid with predictive AI forecasting, incident dispatch, multi-modal route planning, and emergency priority green-wave preemption.

---

## 🌟 Core Features & Architecture

### 1. Main Command Dashboard
- **Real-Time Key Performance Indicators (KPIs)**:
  - Average Traffic Speed with hourly velocity sparklines.
  - Urban Congestion Index with positive/negative trend indicators.
  - Active Vehicles Tracked through city corridors.
  - Incident Resolution Rate & active incident counter.
  - Adaptive Signal Optimization gain (+22.4% throughput improvement).
  - Net CO₂ emissions avoided via reduced idling.
- **Autonomous Grid Digital Twin (Interactive Map)**:
  - SVG/Canvas road grid with animated moving vehicle platoons.
  - Clickable smart intersection nodes with live countdown timers and phase states.
  - Direct CCTV optical node inspect markers.
  - Active incident collision hotspots with pulsating radar beacons.
  - Layer filters: Toggle signals, incidents, CCTV cameras, and zoom level.
- **Adaptive Signal Control Widget**:
  - Live intersection cycle timers ticking down in real time.
  - Queue lengths across North, South, East, and West approaches.
  - One-click `+35s Green Phase Extension` override.
- **Sector Congestion Breakdown**:
  - Recharts bar chart displaying congestion index and average speed across 6 city sectors.
- **Edge CCTV Surveillance Stream**:
  - Simulated 4K UltraHD live feeds with AI object detection overlays (cars, transit buses, pedestrians, cyclists), FPS counters, and bitrate stats.

### 2. Traffic Prediction & "What-If" Simulator
- **24-Hour Predictive Flow Curves (Recharts)**:
  - Compares Actual Recorded Flow vs. AI Predicted Baseline vs. AI Optimized Dynamic Routing.
  - Displays grid capacity thresholds and severe gridlock warnings.
- **Interactive "What-If" Scenario Simulator**:
  - Simulates weather shocks (Clear Sky, Monsoon Heavy Rain, Severe Thunderstorms).
  - Simulates mass public events (Normal Day, Arena Concert +35k, Stadium Derby +50k).
  - Simulates emergency lane closures on major flyovers.
  - AI Autonomous Mitigation Engine toggle.
  - Outputs real-time surge metrics, city delay increases, and automated AI mitigation directives.
- **Bottleneck Risk Matrix**:
  - Ranked matrix of critical urban choke points by Volume-to-Capacity (V/C) ratio, peak expected windows, and mitigation strategies.

### 3. Incident Management & Rapid Dispatch
- **Filter Toolbar**:
  - Full-text search by title, location, cross-street, or incident ID.
  - Sector filter dropdown.
  - Severity filters: `ALL`, `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`.
  - Status filters: `ALL`, `Reported`, `Dispatched`, `Resolving`, `Resolved`.
- **Report Incident Modal**:
  - Operator intake with classification, severity, urban sector, exact cross-street, and blocked lanes.
  - Authorize immediate emergency units: Police (`MP-204`), ALS Ambulance (`MED-12`), Heavy Rescue (`RESCUE-05`), Tow (`TOW-88`), or Drone Patrol (`DRONE-ALPHA`).
  - Form validation with reactive updates and persistent local storage.
- **Incident Detail Dossier Modal**:
  - Detailed telemetry and field notes.
  - Chronological time-stamped response audit trail.
  - Variable Message Sign (VMS) dynamic warning broadcast.
  - Status transitions (`Reported` &rarr; `Dispatched` &rarr; `Resolving` &rarr; `Resolved`).

### 4. Dynamic Multi-Modal Route Planner
- **Route Optimization Engine**:
  - Select origin and destination points from city landmarks.
  - Vehicle profiles: Standard Passenger Car, Electric Vehicle (EV), Heavy Logistics Truck, and Emergency First Responder.
- **Multi-Modal Route Alternatives Comparison**:
  1. **AI Smart Dynamic Route** (Fastest, avoids collision bottlenecks, 94% green wave progression).
  2. **Shortest Distance Route** (Higher delay, passing through downtown collision).
  3. **Eco-Green Corridor** (Lowest emissions, smooth momentum routing).
- **Corridor Vector Visualization & Turn-by-Turn Guidance**:
  - Visual graphic path representation of the calculated route.
  - Turn-by-turn guidance with step-by-step traffic density indicators.

### 5. Emergency Response & Green Wave Command
- **Priority Signal Preemption (Code Red)**:
  - Authorize emergency medical, fire, or police priority corridors.
  - Locks downstream signals to 100% GREEN, halts opposing cross traffic with RED clearance phases.
  - Web Audio API synthesized alert sirens.
  - Global top alert broadcast banner with quick command access.
- **Active Preemption Corridors**:
  - Live speed, distance remaining, signals preempted, and life-saving minutes saved.
- **Hardware Preemption Audit Log**:
  - Chronological record of signal controller overrides.

### 6. Admin Analytics & Sensor Telemetry
- **Corridor Throughput Chart**:
  - Composed Area and Line chart tracking vehicle volumes and average speeds.
  - Range toggles: `24h`, `7d`, `30d`.
  - One-click CSV export of historical telemetry.
- **Environmental & Carbon Offset Metrics**:
  - CO₂ reduction, fuel wastage avoided, EV fleet adoption share, and Clean Air Index.
- **Sector Peak-Hour Demand Profiles**:
  - Morning vs. Evening vs. Midday commute volumes.
- **IoT Sensor Network Diagnostics**:
  - 428 Optical CCTV nodes (99.1% online).
  - 112 Smart Light Controllers (100% online).
  - 34 Variable Message Signs (94.4% online).
  - 880 Induction Loop Sensors (98.3% online).
  - 164 Microwave Radar Detectors (99.4% online).
  - 58 5G Urban Mesh Gateways (100% online).

### 7. System Settings & API Service Layer
- **Unified REST API Service Layer (`src/services/api.js`)**:
  - Fully decoupled service layer supporting production backend REST endpoints.
  - Resilient mock mode with local storage synchronization so all created incidents, status changes, and green wave activations persist across sessions.
- **Configurable Settings**:
  - API base URL configuration and ping probe.
  - AI autonomous dispatch confidence threshold slider.
  - Auditory alert sound toggles.
  - Local database cache reset.

---

## 💻 Tech Stack

- **Framework**: React 19 (Functional Components, Hooks, Context API, Code Splitting with `React.lazy` & `Suspense`)
- **Build Tool**: Vite 8 with `@tailwindcss/vite`
- **Styling**: Tailwind CSS v4 with custom cyber/glassmorphism dark theme
- **Icons**: Lucide React
- **Data Visualization**: Recharts (AreaChart, BarChart, ComposedChart, LineChart, ResponsiveContainer)
- **Audio Synthesizer**: Web Audio API (zero external asset dependencies)

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- npm >= 9

### Installation & Run
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be accessible at `http://localhost:5173/`.

### Production Build
```bash
npm run build
```
The optimized client bundle will be built in the `dist/` directory.

### Code Linting
```bash
npm run lint
```
