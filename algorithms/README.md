# TrafficAI Algorithms Suite

Independent, production-ready, testable JavaScript (ES Modules) algorithms suite powering the **TrafficAI Smart City Mobility Platform**.

---

## Table of Contents
1. [Architectural Overview & Directory Structure](#1-architectural-overview--directory-structure)
2. [Deterministic Demo Dataset (MetroGrid Alpha)](#2-deterministic-demo-dataset-metrogrid-alpha)
3. [Scientific Transparency & Ethical AI Disclaimer](#3-scientific-transparency--ethical-ai-disclaimer)
4. [Algorithmic Modules, Formulas & Assumptions](#4-algorithmic-modules-formulas--assumptions)
   - [4.1 Dijkstra Shortest-Path Algorithm](#41-dijkstra-shortest-path-algorithm)
   - [4.2 A* Pathfinding Algorithm with Admissible Heuristics](#42-a-pathfinding-algorithm-with-admissible-heuristics)
   - [4.3 Multi-Factor Route Scoring Engine](#43-multi-factor-route-scoring-engine)
   - [4.4 Traffic Congestion Prediction (15–30 Min Horizon)](#44-traffic-congestion-prediction-1530-min-horizon)
   - [4.5 Duplicate Incident Detection Engine](#45-duplicate-incident-detection-engine)
   - [4.6 Incident Severity Estimation Engine](#46-incident-severity-estimation-engine)
   - [4.7 Graph-Based Road Network Impact Analysis](#47-graph-based-road-network-impact-analysis)
   - [4.8 Adaptive Traffic Signal Timing Optimization](#48-adaptive-traffic-signal-timing-optimization)
   - [4.9 Before-and-After Waiting Time & LOS Comparator](#49-before-and-after-waiting-time--los-comparator)
5. [Backend Developer Integration Guide](#5-backend-developer-integration-guide)
6. [Testing & Benchmark Verification](#6-testing--benchmark-verification)

---

## 1. Architectural Overview & Directory Structure

All modules are written in native modern JavaScript (ES Modules, Node >= 18) with **zero external runtime dependencies**. They can be imported and executed anywhere—in Node.js backends, workers, or client-side frontends.

```
algorithms/
├── index.js                      # Central public entrypoint exporting all modules
├── README.md                     # Comprehensive documentation, formulas & schemas
├── data/
│   └── demoNetwork.js            # Documented, deterministic "MetroGrid Alpha" dataset
├── utils/
│   ├── priorityQueue.js          # Binary Min-Heap priority queue (O(log N))
│   └── geoUtils.js               # Haversine, Euclidean, Manhattan distance formulas
├── routing/
│   ├── dijkstra.js               # Dijkstra shortest-path algorithm
│   ├── aStar.js                  # A* pathfinding with Haversine/Euclidean/Manhattan
│   └── routeScorer.js            # Multi-factor route scoring & ranking engine
├── prediction/
│   └── congestionPredictor.js    # 15–30 min congestion prediction using historical time-series
├── incidents/
│   ├── duplicateDetector.js      # Multi-criteria duplicate incident detection
│   └── severityEstimator.js      # Multi-factor incident severity estimation (0-100)
├── network/
│   └── impactAnalyzer.js         # Graph impact, LWR shockwaves & spillback propagation
├── signals/
│   ├── signalOptimizer.js        # Webster's minimum delay adaptive signal timing
│   └── waitingTimeComparator.js  # HCM delay model, LOS grades & CO2/fuel savings
└── tests/
    ├── runAll.js                 # Complete benchmark runner and summary reporter
    ├── priorityQueue.test.js
    ├── dijkstra.test.js
    ├── aStar.test.js
    ├── routeScorer.test.js
    ├── congestionPredictor.test.js
    ├── duplicateDetector.test.js
    ├── severityEstimator.test.js
    ├── impactAnalyzer.test.js
    ├── signalOptimizer.test.js
    └── waitingTimeComparator.test.js
```

---

## 2. Deterministic Demo Dataset (MetroGrid Alpha)

The suite is calibrated against **MetroGrid Alpha**, a documented, high-fidelity urban road network in `algorithms/data/demoNetwork.js`:
- **10 Smart Intersections (Nodes)**:
  - `INT-101`: Grand Central Ave & 5th St (Downtown Grid, Signalized, High queue)
  - `INT-102`: Port Blvd & Marina Bridge (East Port Expressway, Signalized)
  - `INT-103`: Financial Way & Metro Square (Metropolis Central, Signalized)
  - `INT-104`: Tech Parkway & Innovation Blvd (North Tech Corridor, Highway Node)
  - `INT-105`: Riverside Dr & 12th Ave (West Riverside, Collector Node)
  - `INT-106`: Civic Center & Market St (Downtown Arterial, Incident Epicenter)
  - `INT-107`: South Industrial Park & Cargo Way (South Ring Road, Freight Node)
  - `INT-108`: University Heights & 9th Ave (West Riverside, Elevated Node)
  - `INT-109`: East Beltway Interchange (East Port Expressway, Ring Road Bypass)
  - `INT-110`: North Ring Connector (North Tech Corridor, Arterial Link)
- **26 Directed Road Corridors (Edges)**:
  - Each corridor contains precise physical attributes: `distanceKm`, `freeFlowSpeedKmh`, `currentSpeedKmh`, `lanes`, `capacityVph`, `currentVolumeVph`, `roadClass`, `isClosed`, and `reliabilityScore`.
- **24-Hour Diurnal Historical Baselines**:
  - Hourly means ($\mu$), standard deviations ($\sigma$), and traffic volumes ($v$) reflecting commute waves (morning rush 07:00-09:00, evening rush 16:30-19:00).
- **Active Operational Incidents**:
  - Sample multi-vehicle collisions, commercial truck breakdowns, and road closures with exact geospatial coordinates and timestamps.

---

## 3. Scientific Transparency & Ethical AI Disclaimer

> [!IMPORTANT]
> **No Fake AI Claims**: This engine does not claim to execute black-box artificial intelligence or pretend that simulated data originates from real-world road sensors. 
> - Congestion predictions are generated using an **Autoregressive Historical Reversion (AR-HR)** time-series model calibrated against validated diurnal traffic profiles.
> - Signal optimization is grounded in **Webster's Minimum Delay Formula** and the **Highway Capacity Manual (HCM 6th Edition)**.
> - Shockwave velocity follows the **Lighthill-Whitham-Richards (LWR)** kinematic traffic flow theory.
> - Geospatial calculations use exact spherical **Haversine geodesy**.

All prediction payloads explicitly return metadata flags:
```json
{
  "isSimulated": true,
  "modelType": "Autoregressive Historical Reversion (AR-HR)",
  "disclaimer": "Predictions are simulated mathematical projections derived from calibrated historical diurnal patterns and autoregressive inertia damping. Not live physical sensor telemetry."
}
```

---

## 4. Algorithmic Modules, Formulas & Assumptions

### 4.1 Dijkstra Shortest-Path Algorithm
**File**: `algorithms/routing/dijkstra.js`

#### Purpose
Computes the exact lowest-cost path between intersections on a directed weighted road network graph.

#### Algorithmic Principle & Complexity
- Utilizes a custom **Binary Min-Heap Priority Queue** (`algorithms/utils/priorityQueue.js`).
- Time Complexity: $O((|V| + |E|) \cdot \log |V|)$
- Space Complexity: $O(|V| + |E|)$

#### Cost Metrics Supported
- `currentTravelTime`: $w(e) = \frac{d_e}{v_{\text{current}, e}} \times 60$ minutes
- `distanceKm`: $w(e) = d_e$ kilometers
- `freeFlowMinutes`: $w(e) = \frac{d_e}{v_{\text{free}}, e} \times 60$ minutes

#### Assumptions & Constraints
- Edge weights must be strictly non-negative ($w(e) \ge 0$).
- When `avoidClosedRoads: true`, edges with `isClosed: true` are pruned from exploration.
- Supports intersection turn penalties (`turnPenaltySeconds`).

#### Sample Input / Output
```javascript
import { dijkstra } from './algorithms/index.js';

const result = dijkstra({
  startNodeId: 'INT-101',
  endNodeId: 'INT-104',
  options: { weightProperty: 'currentTravelTime', avoidClosedRoads: true }
});
```

```json
{
  "success": true,
  "algorithm": "Dijkstra",
  "startNode": "INT-101",
  "endNode": "INT-104",
  "found": true,
  "totalCost": 4.43,
  "costUnit": "minutes",
  "totalDistanceKm": 5.07,
  "estimatedDurationMinutes": 4.43,
  "path": ["INT-101", "INT-109", "INT-102", "INT-104"],
  "edgeCount": 3,
  "visitedNodesCount": 7,
  "directions": [
    { "step": 1, "fromNode": "INT-101", "toNode": "INT-109", "roadName": "Metro Ring Bypass South", "distanceKm": 2.18, "durationMinutes": 1.84 },
    { "step": 2, "fromNode": "INT-109", "toNode": "INT-102", "roadName": "East Beltway Inbound", "distanceKm": 1.84, "durationMinutes": 1.53 },
    { "step": 3, "fromNode": "INT-102", "toNode": "INT-104", "roadName": "Silicon Parkway", "distanceKm": 1.05, "durationMinutes": 1.05 }
  ],
  "summary": "Optimal path traverses 3 road segments across 5.07 km in ~4.43 mins."
}
```

---

### 4.2 A* Pathfinding Algorithm with Admissible Heuristics
**File**: `algorithms/routing/aStar.js`

#### Purpose
Heuristic-guided best-first search algorithm optimizing exploration towards the destination node.

#### Mathematical Formulation
$$f(n) = g(n) + h(n)$$
where:
- $g(n)$ is the exact cost from origin to node $n$.
- $h(n)$ is the heuristic estimate of cost from $n$ to the goal.

#### Admissibility Proof
For travel time optimization:
$$h(n) = \frac{d_{\text{great-circle}}(n, \text{goal})}{v_{\text{max-network}}} \times 60$$
Because straight-line distance is always $\le$ actual road network distance ($d_{\text{straight}} \le d_{\text{road}}$), and network velocity cannot exceed $v_{\text{max-network}}$:
$$h(n) \le h^*(n)$$
Therefore, $h(n)$ is strictly **admissible** and **consistent** (monotonic), guaranteeing the optimal shortest path while expanding significantly fewer nodes than Dijkstra.

#### Heuristics Implemented
1. **Haversine**: Great-circle distance using earth radius $R = 6371.0\text{ km}$:
   $$a = \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right), \quad d = 2 R \cdot \arctan2(\sqrt{a}, \sqrt{1-a})$$
2. **Euclidean**: Planar $L_2$ norm: $\sqrt{\Delta x^2 + \Delta y^2}$
3. **Manhattan**: Grid $L_1$ norm: $|\Delta x| + |\Delta y|$

---

### 4.3 Multi-Factor Route Scoring Engine
**File**: `algorithms/routing/routeScorer.js`

#### Purpose
Scores and ranks alternative routes across 5 competing trade-offs: Distance, ETA, Congestion, Closures, and Reliability.

#### Mathematical Scoring Model
Each dimension is normalized against reference benchmarks ($d_{\text{ref}}, t_{\text{ref}}$):
- Normalized Distance: $\bar{d} = \frac{D}{d_{\text{ref}}}$
- Normalized Duration: $\bar{t} = \frac{T}{t_{\text{ref}}}$
- Normalized Congestion: $\bar{c} = \frac{C}{100}$
- Normalized Unreliability: $\bar{u} = 1 - \rho \quad (\rho \in [0, 1])$
- Closure Penalty: $P_{\text{closure}} = 10,000 \text{ if } \exists e \in R \text{ s.t. } e.\text{isClosed} \text{ else } 0$

$$\text{CompositeCost} = w_t \bar{t} + w_d \bar{d} + w_c \bar{c} + w_r \bar{u} + P_{\text{closure}}$$

#### Calibrated Quality Score ($0 - 100$)
$$\text{Score} = \max\left(0, \min\left(99, 100 - (2 w_t T + 2.5 w_d D + 0.5 w_c C + 50 w_r \bar{u}) - P_{\text{closure}}\right)\right)$$

#### Pre-Configured Optimization Profiles
| Profile | $w_{\text{eta}}$ | $w_{\text{dist}}$ | $w_{\text{cong}}$ | $w_{\text{rel}}$ | Description |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `balanced` | 0.35 | 0.20 | 0.25 | 0.20 | Equalized trade-off between time, distance, and comfort |
| `fastest` | 0.60 | 0.10 | 0.20 | 0.10 | Aggressively minimizes travel time |
| `shortest` | 0.15 | 0.65 | 0.10 | 0.10 | Minimizes total kilometers |
| `reliable` | 0.20 | 0.10 | 0.20 | 0.50 | Favors corridors with predictable, low-variance travel times |
| `eco` | 0.20 | 0.25 | 0.40 | 0.15 | Minimizes stop-and-go idling and CO2 emissions |

---

### 4.4 Traffic Congestion Prediction (15–30 Min Horizon)
**File**: `algorithms/prediction/congestionPredictor.js`

#### Purpose
Projects traffic congestion index ($0 - 100$) and expected speed 15 and 30 minutes into the future.

#### Autoregressive Historical Reversion (AR-HR) Formula
For prediction horizon $h \in \{15, 30\}$ minutes:
1. **Short-Term Trend Velocity**:
   $$v_{\text{momentum}} = \frac{C_0 - C_{-30}}{\Delta t} \quad (\% \text{ per minute})$$
2. **Damped Momentum Extrapolation**:
   $$C_{\text{momentum}}(h) = C_0 + v_{\text{momentum}} \cdot h \cdot (\gamma)^{h/15} \quad (\gamma = 0.92)$$
3. **Historical Reversion Weight**:
   $$\alpha(h) = 1 - e^{-h / \tau} \quad (\tau = 25\text{ mins})$$
   - $\alpha(15) \approx 0.45$ (45% historical weight, 55% real-time momentum)
   - $\alpha(30) \approx 0.70$ (70% historical weight, 30% real-time momentum)
4. **Exogenous Adjustments**:
   $$\hat{C}_{t+h} = \left[(1 - \alpha(h)) \cdot C_{\text{momentum}}(h) + \alpha(h) \cdot \mu_{\text{hist}}(t+h)\right] \times M_{\text{weather}} + M_{\text{event}}$$
   - Clear weather: $M_{\text{weather}} = 1.0$
   - Rain: $M_{\text{weather}} = 1.12$
   - Heavy Rain: $M_{\text{weather}} = 1.25$
   - Storm: $M_{\text{weather}} = 1.38$
5. **Greenshields Traffic Stream Speed Estimation**:
   $$v_{\text{pred}} = v_{\text{free}} \cdot \left(1 - \frac{\hat{C}_{t+h}}{100}\right)^{1.2}$$
6. **95% Confidence Interval**:
   $$\text{Margin of Error} = 1.96 \cdot \sigma_{\text{hist}}(t+h) \cdot \sqrt{1 + \frac{h}{30}}$$

---

### 4.5 Duplicate Incident Detection Engine
**File**: `algorithms/incidents/duplicateDetector.js`

#### Purpose
Detects whether an incoming citizen or sensor incident report is a duplicate of an existing active incident.

#### Multi-Criteria Formulation
$$\text{Score} = w_{\text{loc}} S_{\text{loc}} + w_{\text{type}} S_{\text{type}} + w_{\text{time}} S_{\text{time}}$$
- **Location Similarity ($S_{\text{loc}}$)**:
  Gaussian spatial decay with $\sigma = 350\text{ meters}$:
  $$S_{\text{geo}}(d) = e^{-\frac{d^2}{2 \sigma^2}} \quad (d \le 50\text{m} \implies 1.0, \quad d > 1500\text{m} \implies 0.0)$$
- **Incident Type Similarity ($S_{\text{type}}$)**:
  Evaluated through semantic equivalence clusters:
  - Exact match or same group (`collision` $\leftrightarrow$ `accident`): $0.95 - 1.00$
  - Correlated report confusion (`breakdown` $\leftrightarrow$ `accident`): $0.45$
  - Unrelated (`roadwork` $\leftrightarrow$ `breakdown`): $0.10$
- **Time Similarity ($S_{\text{time}}$)**:
  Exponential decay with $\tau = 30\text{ minutes}$:
  $$S_{\text{time}}(\Delta t) = e^{-\frac{\Delta t}{30}} \quad (\Delta t > 90\text{m} \implies 0.0)$$

#### Decision Thresholds
- $\text{Score} \ge 0.80$: `CONFIRMED_DUPLICATE` $\rightarrow$ Recommended action: `MERGE_REPORTS`
- $0.60 \le \text{Score} < 0.80$: `POTENTIAL_DUPLICATE` $\rightarrow$ Recommended action: `FLAG_FOR_OPERATOR_REVIEW`
- $\text{Score} < 0.60$: `UNIQUE` $\rightarrow$ Recommended action: `CREATE_NEW`

---

### 4.6 Incident Severity Estimation Engine
**File**: `algorithms/incidents/severityEstimator.js`

#### Purpose
Computes deterministic multi-factor severity scores ($0 - 100$), operational response tiers, and clearance time estimates.

#### Multi-Factor Point Model
$$S = \min(100, B_{\text{type}} + P_{\text{blockage}} + P_{\text{road}} + P_{\text{injuries}} + P_{\text{hazmat}} + P_{\text{operational}})$$
- **Type Base ($B_{\text{type}}$)**: Multi-vehicle/Rollover (30), Accident (22), Flooding (20), Breakdown (12), Debris (10).
- **Lane Blockage ($P_{\text{blockage}}$)**: $\frac{L_{\text{blocked}}}{L_{\text{total}}} \times 30$ (+10 bonus if 100% blocked).
- **Road Class ($P_{\text{road}}$)**: Highway (15), Arterial (10), Collector (5), Local (0).
- **Casualties ($P_{\text{injuries}}$)**: $+12$ points per injury (max 24).
- **Hazardous Materials ($P_{\text{hazmat}}$)**: $+25$ points if toxic/flammable materials present.
- **Operational Multipliers ($P_{\text{operational}}$)**: Peak hour (+8), intersection blocked (+7), storm (+6).

#### Classification Tiers
- **CRITICAL** (Score $\ge 75$, Tier 1): Advanced Life Support (ALS) Ambulance, Police escort, dynamic VMS diversion.
- **HIGH** (Score $50 - 74$, Tier 2): Highway safety patrol, heavy wreckers, upstream ramp metering.
- **MEDIUM** (Score $25 - 49$, Tier 3): Traffic incident response vehicle, digital transit traveler advisory.
- **LOW** (Score $< 25$, Tier 4): Routine shoulder clearance monitoring.

---

### 4.7 Graph-Based Road Network Impact Analysis
**File**: `algorithms/network/impactAnalyzer.js`

#### Purpose
Quantifies the topological ripple effects of lane closures, shockwaves, and congestion spillback across upstream intersections.

#### Traffic Flow & Kinematics
1. **Bottleneck Capacity & V/C Ratio**:
   $$C_{\text{reduced}} = (\text{lanes} - \text{lanesBlocked}) \times 1650 \text{ vph}$$
   $$\text{V/C}_{\text{post}} = \frac{\text{CurrentVolume}}{C_{\text{reduced}}}$$
2. **Lighthill-Whitham-Richards (LWR) Shockwave Speed**:
   $$w = \frac{q_{\text{bottleneck}} - q_{\text{approach}}}{k_{\text{queue}} - k_{\text{approach}}} \quad (\text{km/h})$$
   Negative velocity indicates a backwards-forming shockwave propagating upstream against traffic flow.
3. **Queue Growth Rate**:
   $$\text{Rate} = \frac{|w| \times 1000}{60} \quad (\text{meters per minute})$$
4. **Upstream Spillback Risk (Breadth-First Search)**:
   Traverses incoming edges backwards up to $k$ hops. Calculates time until queue reaches each upstream intersection:
   $$t_{\text{spillback}} = \frac{\text{Distance upstream (m)}}{\text{Queue growth rate (m/min)}}$$
   - $t < 10\text{ min} \implies \text{IMMINENT}$
   - $10 \le t < 25\text{ min} \implies \text{HIGH}$
   - $25 \le t < 45\text{ min} \implies \text{MODERATE}$
5. **System-Wide Vehicle-Hours of Delay (VHD)**:
   $$\Delta \text{VHD} = \frac{\text{VehiclesAffected} \times \Delta t_{\text{delay}}}{60}$$

---

### 4.8 Adaptive Traffic Signal Timing Optimization
**File**: `algorithms/signals/signalOptimizer.js`

#### Purpose
Dynamically optimizes intersection cycle lengths and phase green splits using Webster's Minimum Delay Formula and Critical Lane Volume (CLV).

#### Webster's Minimum Delay Formula
$$C_{\text{opt}} = \frac{1.5 L + 5}{1 - Y}$$
where:
- $L = \sum_{i=1}^n l_i$ is the total lost time across all phases (default 4s per phase: 3s yellow + 1s all-red).
- $Y = \sum_{i=1}^n y_i$ is the sum of critical flow ratios:
  $$y_i = \frac{q_i}{s_i}$$
  with $s_i = \text{lanes} \times 1800\text{ vphg}$ (saturation flow rate).

#### Green Allocation & Safety Bounds
$$\text{Effective Green: } G_{\text{eff}} = C_{\text{opt}} - L$$
$$g_i = \max\left(g_{\text{ped-min}}, \text{round}\left(G_{\text{eff}} \times \frac{y_i}{Y}\right)\right)$$
- $C_{\text{min}} = 45\text{s}$, $C_{\text{max}} = 140\text{s}$
- Minimum pedestrian walk clearance $g_{\text{ped-min}} \ge 10\text{s}$
- If $Y \ge 0.90$, intersection is clamped to $C_{\text{max}}$ (oversaturated state).
- Emergency vehicle preemption immediate override supported.

---

### 4.9 Before-and-After Waiting Time & LOS Comparator
**File**: `algorithms/signals/waitingTimeComparator.js`

#### Purpose
Quantifies the exact operational and environmental benefits of adaptive signal control or traffic incident mitigations.

#### Highway Capacity Manual (HCM) / Webster Delay Model
$$d = d_1 + d_2$$
- **Uniform Delay ($d_1$)**:
  $$d_1 = \frac{C \left(1 - \frac{g}{C}\right)^2}{2 \left(1 - \frac{g}{C} X\right)}$$
- **Incremental Random Overflow Delay ($d_2$)**:
  $$d_2 = \frac{X^2}{2 q (1 - X)} \quad (X = v / c \text{ degree of saturation})$$

#### Level of Service (LOS) Grades (HCM 6th Edition)
| Average Delay ($d$) | Level of Service | Traffic Flow Characteristic |
| :---: | :---: | :--- |
| $\le 10.0\text{ s}$ | **LOS A** | Free-flow, negligible cycle delay |
| $10.1 - 20.0\text{ s}$ | **LOS B** | Good progression, short queues |
| $20.1 - 35.0\text{ s}$ | **LOS C** | Stable flow, acceptable urban delay |
| $35.1 - 55.0\text{ s}$ | **LOS D** | Approaching capacity, notable queues |
| $55.1 - 80.0\text{ s}$ | **LOS E** | At capacity, severe stop-and-go delays |
| $> 80.0\text{ s}$ | **LOS F** | Oversaturated breakdown, intersection gridlock |

#### Carbon & Fuel Reduction Equations
- Vehicle Idling Fuel Consumption: $2.27\text{ liters/hour}$ ($0.60\text{ gal/hr}$).
- Carbon Dioxide Emission Factor: $2.31\text{ kg CO}_2\text{ per liter}$ of gasoline.
$$\text{Daily Fuel Saved (L)} = \text{Daily Delay Hours Saved} \times 2.27$$
$$\text{Daily CO}_2\text{ Reduction (kg)} = \text{Daily Fuel Saved} \times 2.31$$

---

## 5. Backend Developer Integration Guide

### 5.1 Importing Modules
The backend can import modules directly through the root package or via the backend bridge:

```javascript
// Option A: From root index
import {
  dijkstra,
  aStar,
  scoreRoute,
  rankRoutes,
  predictCongestion,
  detectDuplicateIncident,
  estimateIncidentSeverity,
  analyzeNetworkImpact,
  optimizeSignalTiming,
  compareSignalPerformance,
  DEMO_NETWORK,
} from './algorithms/index.js';

// Option B: From inside backend controllers
import {
  dijkstra,
  aStar,
  scoreRoute,
  optimizeSignalTiming,
} from '../algorithms/index.js';
```

### 5.2 Real-World Controller Examples

#### Example 1: Route Optimization Controller
```javascript
import { aStar, dijkstra, rankRoutes, buildGraph } from '../algorithms/index.js';

export async function calculateRoute(req, res) {
  const { originId, destinationId, preference = 'balanced' } = req.body;
  
  // 1. Compute fastest route using A* with Haversine heuristic
  const fastestRoute = aStar({
    startNodeId: originId,
    endNodeId: destinationId,
    options: { weightProperty: 'currentTravelTime' },
  });

  // 2. Compute shortest physical distance route using Dijkstra
  const shortestRoute = dijkstra({
    startNodeId: originId,
    endNodeId: destinationId,
    options: { weightProperty: 'distanceKm' },
  });

  // 3. Multi-factor score and rank candidate routes
  const ranking = rankRoutes([
    { ...fastestRoute, title: 'AI Smart Adaptive Bypass' },
    { ...shortestRoute, title: 'Direct Arterial Route' },
  ], { profile: preference });

  res.json({ success: true, data: ranking });
}
```

#### Example 2: Duplicate Incident Filter
```javascript
import { detectDuplicateIncident } from '../algorithms/index.js';
import { Incident } from '../models/Incident.js';

export async function submitIncident(req, res) {
  const newReport = req.body;
  const activeIncidents = await Incident.find({ status: { $ne: 'Resolved' } });

  const dupCheck = detectDuplicateIncident(newReport, activeIncidents);

  if (dupCheck.isDuplicate) {
    return res.status(200).json({
      status: 'DUPLICATE_MERGED',
      message: `Merged with active incident ${dupCheck.matchedIncident.id}`,
      matchDetails: dupCheck.similarityBreakdown,
    });
  }

  // Create new incident in database...
}
```

---

## 6. Testing & Benchmark Verification

### Running Automated Unit Tests
The suite uses Node.js native test runner (`node:test` and `node:assert/strict`):

```bash
# Run all unit tests
npm test

# Or run tests specifically for algorithms
npm run test:algorithms
```

### Running the Live Benchmark Reporter
```bash
# Run end-to-end sanity check and benchmark table
npm run benchmark:algorithms
```

#### Benchmark Execution Results
```
======================================================================
 TrafficAI Core Algorithms Suite - Automated Verification & Benchmark
======================================================================

┌─────────┬─────────────────────────────────────┬────────┬───────────┬─────────────────────────────────────────────────────────────────────────────┐
│ (index) │ module                              │ status │ latencyMs │ summary                                                                     │
├─────────┼─────────────────────────────────────┼────────┼───────────┼─────────────────────────────────────────────────────────────────────────────┤
│ 0       │ '1. Dijkstra Shortest-Path'         │ 'PASS' │ 1.42      │ 'Path found: INT-101 -> INT-109 -> INT-102 -> INT-104 (5.07 km, ~4.43m)'    │
│ 1       │ '2. A* Pathfinding'                 │ 'PASS' │ 3.491     │ 'Path found: INT-101 -> INT-109 -> INT-102 -> INT-104 (Visited 6 nodes)'    │
│ 2       │ '3. Multi-Factor Route Scoring'     │ 'PASS' │ 1.157     │ 'Best route: r1 (Score: 83/100)'                                            │
│ 3       │ '4. Congestion Prediction (15-30m)' │ 'PASS' │ 2.52      │ '+15m: 68.7% | +30m: 68.8%'                                                 │
│ 4       │ '5. Duplicate Incident Detection'   │ 'PASS' │ 0.688     │ 'Decision: CONFIRMED_DUPLICATE (Match score: 0.9938, Target: INC-2026-081)' │
│ 5       │ '6. Severity Estimation'            │ 'PASS' │ 0.26      │ 'Severity: CRITICAL (75/100, Tier: 1, Clear: ~61m)'                         │
│ 6       │ '7. Network Impact Analysis'        │ 'PASS' │ 0.651     │ 'Shockwave: 0 km/h | Queue: 75m | Delay surge: +360 VHD'                    │
│ 7       │ '8. Signal Timing Optimization'     │ 'PASS' │ 0.342     │ 'Optimal cycle: 45s (NS Green: 26s, EW Green: 11s)'                         │
│ 8       │ '9. Waiting Time & LOS Comparison'  │ 'PASS' │ 0.38      │ 'LOS C -> LOS B | Delay saved: -33.4% | Daily CO2: -322.5 kg'               │
└─────────┴─────────────────────────────────────┴────────┴───────────┴─────────────────────────────────────────────────────────────────────────────┘

 SUCCESS: All 9 TrafficAI algorithm modules executed with 100% verification!
```

