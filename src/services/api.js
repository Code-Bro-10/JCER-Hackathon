/**
 * TrafficAI Service Layer
 * Interfaces with smart city backend REST endpoints or fallbacks to realistic mock data.
 * All mutations persist locally so interactive actions (dispatch, new reports, green wave) reflect across views.
 */

import {
  INITIAL_KPIS,
  SECTOR_STATISTICS,
  SMART_INTERSECTIONS,
  INITIAL_INCIDENTS,
  PREDICTION_HOURLY_DATA,
  BOTTLENECK_MATRIX,
  CCTV_FEEDS,
  ACTIVE_EMERGENCY_DISPATCHES,
  ANALYTICS_DATA,
} from './mockData'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const STORAGE_KEY_INCIDENTS = 'trafficai_incidents_v1'
const STORAGE_KEY_INTERSECTIONS = 'trafficai_intersections_v1'
const STORAGE_KEY_EMERGENCY = 'trafficai_emergency_v1'

// Helper to simulate network latency in mock mode
const simulateDelay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms))

// Local storage state helpers
function getStoredIncidents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INCIDENTS)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback
  }
  return INITIAL_INCIDENTS
}

function saveStoredIncidents(incidents) {
  try {
    localStorage.setItem(STORAGE_KEY_INCIDENTS, JSON.stringify(incidents))
  } catch {
    // fallback
  }
}

function getStoredIntersections() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INTERSECTIONS)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback
  }
  return SMART_INTERSECTIONS
}

function saveStoredIntersections(intersections) {
  try {
    localStorage.setItem(STORAGE_KEY_INTERSECTIONS, JSON.stringify(intersections))
  } catch {
    // fallback
  }
}

function getStoredEmergencyDispatches() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EMERGENCY)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback
  }
  return ACTIVE_EMERGENCY_DISPATCHES
}

function saveStoredEmergencyDispatches(dispatches) {
  try {
    localStorage.setItem(STORAGE_KEY_EMERGENCY, JSON.stringify(dispatches))
  } catch {
    // fallback
  }
}

export const TrafficService = {
  // Config & Status
  isMockMode: !API_BASE_URL,
  
  /**
   * Fetch Global Traffic KPIs
   * GET /api/v1/traffic/kpis
   */
  async getKPIs() {
    if (!this.isMockMode) {
      const res = await fetch(`${API_BASE_URL}/api/v1/traffic/kpis`)
      if (res.ok) return await res.json()
    }
    await simulateDelay(60)
    const incidents = getStoredIncidents()
    const resolvedCount = incidents.filter(i => i.status === 'Resolved').length

    return {
      success: true,
      data: {
        ...INITIAL_KPIS,
        resolvedIncidents: resolvedCount,
        totalIncidents: incidents.length,
      },
    }
  },

  /**
   * Fetch Sector Statistics
   * GET /api/v1/traffic/sectors
   */
  async getSectors() {
    if (!this.isMockMode) {
      const res = await fetch(`${API_BASE_URL}/api/v1/traffic/sectors`)
      if (res.ok) return await res.json()
    }
    await simulateDelay(80)
    return {
      success: true,
      data: SECTOR_STATISTICS,
    }
  },

  /**
   * Fetch Smart Intersections
   * GET /api/v1/traffic/intersections
   */
  async getIntersections() {
    if (!this.isMockMode) {
      const res = await fetch(`${API_BASE_URL}/api/v1/traffic/intersections`)
      if (res.ok) return await res.json()
    }
    await simulateDelay(60)
    return {
      success: true,
      data: getStoredIntersections(),
    }
  },

  /**
   * Override Signal Phase for an Intersection
   * POST /api/v1/traffic/intersections/:id/signal-override
   */
  async overrideSignal(intersectionId, phase, durationSeconds = 45) {
    if (!this.isMockMode) {
      const res = await fetch(`${API_BASE_URL}/api/v1/traffic/intersections/${intersectionId}/signal-override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase, durationSeconds }),
      })
      if (res.ok) return await res.json()
    }
    await simulateDelay(150)
    const list = getStoredIntersections()
    const updated = list.map(item => {
      if (item.id === intersectionId) {
        return {
          ...item,
          currentPhase: phase,
          phaseColor: phase.toLowerCase().includes('green') ? 'green' : 'amber',
          secondsRemaining: durationSeconds,
          mode: 'Manual Override',
          lastOptimized: 'Just now by Operator',
        }
      }
      return item
    })
    saveStoredIntersections(updated)
    return {
      success: true,
      message: `Intersection ${intersectionId} overridden to ${phase} for ${durationSeconds}s`,
      data: updated.find(i => i.id === intersectionId),
    }
  },

  /**
   * Fetch All Incidents
   * GET /api/v1/traffic/incidents
   */
  async getIncidents(filters = {}) {
    if (!this.isMockMode) {
      const query = new URLSearchParams(filters).toString()
      const res = await fetch(`${API_BASE_URL}/api/v1/traffic/incidents?${query}`)
      if (res.ok) return await res.json()
    }
    await simulateDelay(90)
    let list = getStoredIncidents()

    if (filters.sector && filters.sector !== 'All Sectors') {
      list = list.filter(i => i.sector === filters.sector)
    }
    if (filters.severity && filters.severity !== 'ALL') {
      list = list.filter(i => i.severity === filters.severity)
    }
    if (filters.status && filters.status !== 'ALL') {
      list = list.filter(i => i.status === filters.status)
    }
    if (filters.search) {
      const q = filters.search.toLowerCase()
      list = list.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q)
      )
    }

    return {
      success: true,
      total: list.length,
      data: list,
    }
  },

  /**
   * Report New Incident
   * POST /api/v1/traffic/incidents
   */
  async createIncident(incidentData) {
    if (!this.isMockMode) {
      const res = await fetch(`${API_BASE_URL}/api/v1/traffic/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incidentData),
      })
      if (res.ok) return await res.json()
    }
    await simulateDelay(150)
    const list = getStoredIncidents()
    const newId = `INC-2026-${String(list.length + 86).padStart(3, '0')}`
    const newIncident = {
      id: newId,
      title: incidentData.title || 'Traffic Incident Reported',
      type: incidentData.type || 'accident',
      typeName: incidentData.typeName || 'Incident',
      severity: incidentData.severity || 'HIGH',
      sector: incidentData.sector || 'Downtown Grid',
      location: incidentData.location || 'Metropolis Corridor',
      coordinates: incidentData.coordinates || { x: 50, y: 50 },
      reportedAt: Date.now(),
      status: incidentData.assignedUnits && incidentData.assignedUnits.length > 0 ? 'Dispatched' : 'Reported',
      lanesBlocked: Number(incidentData.lanesBlocked) || 1,
      totalLanes: Number(incidentData.totalLanes) || 3,
      estimatedDelay: `${incidentData.estimatedDelay || 15} mins`,
      impactRadius: `${incidentData.impactRadius || 1.5} km`,
      assignedUnits: incidentData.assignedUnits || [],
      description: incidentData.description || 'Incident logged by operator.',
      actionRequired: incidentData.actionRequired || 'Dispatch incident management and update signage.',
      cameraFeedId: 'CAM-DOWNTOWN-01',
      history: [
        { time: 'Just now', event: 'Incident registered in command system' },
        ...(incidentData.assignedUnits?.length ? [{ time: 'Just now', event: `Units dispatched: ${incidentData.assignedUnits.join(', ')}` }] : []),
      ],
    }

    const updated = [newIncident, ...list]
    saveStoredIncidents(updated)
    return {
      success: true,
      message: `Incident ${newId} created successfully`,
      data: newIncident,
    }
  },

  /**
   * Update Incident Status / Actions
   * PATCH /api/v1/traffic/incidents/:id/status
   */
  async updateIncidentStatus(incidentId, status, extraData = {}) {
    if (!this.isMockMode) {
      const res = await fetch(`${API_BASE_URL}/api/v1/traffic/incidents/${incidentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...extraData }),
      })
      if (res.ok) return await res.json()
    }
    await simulateDelay(100)
    const list = getStoredIncidents()
    const updated = list.map(item => {
      if (item.id === incidentId) {
        const history = [...(item.history || [])]
        history.unshift({
          time: 'Just now',
          event: extraData.note || `Status transitioned to ${status}`,
        })
        return {
          ...item,
          status,
          assignedUnits: extraData.assignedUnits || item.assignedUnits,
          history,
        }
      }
      return item
    })
    saveStoredIncidents(updated)
    return {
      success: true,
      data: updated.find(i => i.id === incidentId),
    }
  },

  /**
   * Get 24h Predictions & Scenarios
   * GET /api/v1/traffic/predictions
   */
  async getPredictions(horizon = '24h') {
    if (!this.isMockMode) {
      const res = await fetch(`${API_BASE_URL}/api/v1/traffic/predictions?horizon=${horizon}`)
      if (res.ok) return await res.json()
    }
    await simulateDelay(80)
    return {
      success: true,
      data: {
        hourlyCurves: PREDICTION_HOURLY_DATA,
        bottlenecks: BOTTLENECK_MATRIX,
        modelMetadata: {
          name: 'UrbanSpatialGraph-v4 (LSTM + GNN)',
          confidence: 96.4,
          dataPointsTrained: '48.2M sensor hours',
          latencyMs: 14,
          lastInferenceTime: new Date().toLocaleTimeString(),
        },
      },
    }
  },

  /**
   * Run What-If Prediction Simulation
   * POST /api/v1/traffic/predictions/simulate
   */
  async simulateScenario(scenario) {
    if (!this.isMockMode) {
      const res = await fetch(`${API_BASE_URL}/api/v1/traffic/predictions/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scenario),
      })
      if (res.ok) return await res.json()
    }
    await simulateDelay(200)

    // Calculate simulated multiplier based on chosen scenario factors
    let factor = 1.0
    if (scenario.weather === 'rain') factor += 0.22
    if (scenario.weather === 'storm') factor += 0.45
    if (scenario.event === 'concert') factor += 0.35
    if (scenario.event === 'sports') factor += 0.40
    if (scenario.roadClosure) factor += 0.28
    if (scenario.aiInterventionActive) factor -= 0.18 // AI helps offset delay!

    const simulatedCurves = PREDICTION_HOURLY_DATA.map(item => {
      const pFlow = Math.round(item.predicted * factor)
      const aiFlow = Math.round(item.aiOptimized * (factor * 0.85))
      const cong = Math.min(100, Math.round(item.congestion * factor))
      return {
        ...item,
        predicted: pFlow,
        aiOptimized: aiFlow,
        congestion: cong,
      }
    })

    return {
      success: true,
      data: {
        impactFactor: (factor - 1) * 100,
        estimatedCityDelayMin: Math.max(0, Math.round((factor - 1) * 45)),
        predictedCongestionPeak: Math.min(100, Math.round(86 * factor)),
        aiSavedMinutes: Math.round(18 * factor),
        recommendations: [
          'Pre-deploy tow units to highway merge choke points.',
          'Reroute commercial freight away from Sector 2.',
          'Engage +15s green wave priority along East-West arterial corridor.',
        ],
        simulatedCurves,
      },
    }
  },

  /**
   * Calculate Multi-Modal Routes
   * POST /api/v1/traffic/routes/plan
   */
  async planRoute(params) {
    if (!this.isMockMode) {
      const res = await fetch(`${API_BASE_URL}/api/v1/traffic/routes/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      if (res.ok) return await res.json()
    }
    await simulateDelay(180)

    const vehicleType = params.vehicleType || 'passenger'

    return {
      success: true,
      origin: params.origin,
      destination: params.destination,
      vehicleType,
      options: [
        {
          id: 'route-ai-smart',
          title: 'AI Smart Dynamic Route',
          badge: 'RECOMMENDED',
          badgeColor: 'cyan',
          distanceKm: 15.6,
          durationMin: 22,
          freeFlowMin: 18,
          delayMin: 4,
          co2Kg: 2.1,
          fuelCost: '$3.40',
          tollLanes: 1,
          congestionRisk: 'Low (18%)',
          highlights: ['Bypasses Downtown 7th Ave accident', '94% green wave progression', 'Real-time dynamic VMS coordinated'],
          steps: [
            { instruction: 'Start from origin heading North on Boulevard', distance: '1.2 km', duration: '2 min', traffic: 'clear' },
            { instruction: 'Merge onto East Port Expressway via Ramp 4B', distance: '6.4 km', duration: '8 min', traffic: 'optimal' },
            { instruction: 'Take Exit 12 toward Silicon Parkway (Green Wave sync)', distance: '4.8 km', duration: '6 min', traffic: 'clear' },
            { instruction: 'Turn right onto Central Ring Connector', distance: '2.4 km', duration: '4 min', traffic: 'light' },
            { instruction: 'Arrive safely at destination on right', distance: '0.8 km', duration: '2 min', traffic: 'clear' },
          ],
        },
        {
          id: 'route-shortest',
          title: 'Shortest Distance Route',
          badge: 'HEAVY DELAY',
          badgeColor: 'rose',
          distanceKm: 13.2,
          durationMin: 41,
          freeFlowMin: 16,
          delayMin: 25,
          co2Kg: 4.8,
          fuelCost: '$4.90',
          tollLanes: 0,
          congestionRisk: 'Critical (82%)',
          highlights: ['Passes through 7th Ave 2-lane closure', 'Average speed 18 km/h', 'Excess idle emissions'],
          steps: [
            { instruction: 'Head East directly into Downtown Grid', distance: '2.0 km', duration: '4 min', traffic: 'moderate' },
            { instruction: 'Continue on 7th Ave (Approaching collision scene)', distance: '3.5 km', duration: '24 min', traffic: 'severe' },
            { instruction: 'Creep through Market Street signal queue', distance: '2.8 km', duration: '8 min', traffic: 'heavy' },
            { instruction: 'Proceed through local avenues toward destination', distance: '4.9 km', duration: '5 min', traffic: 'moderate' },
          ],
        },
        {
          id: 'route-eco-green',
          title: 'Eco-Green Corridor',
          badge: 'MINIMUM EMISSIONS',
          badgeColor: 'emerald',
          distanceKm: 16.4,
          durationMin: 25,
          freeFlowMin: 21,
          delayMin: 4,
          co2Kg: 1.6,
          fuelCost: '$2.80',
          tollLanes: 0,
          congestionRisk: 'Low (14%)',
          highlights: ['Optimal regenerative braking profile', 'Smooth continuous cruising', 'Clean air zone compatible'],
          steps: [
            { instruction: 'Follow Riverside Boulevard scenic bypass', distance: '5.2 km', duration: '7 min', traffic: 'clear' },
            { instruction: 'Take South Ring arterial bypass', distance: '7.8 km', duration: '12 min', traffic: 'free' },
            { instruction: 'Approach destination via Tech Corridor south gate', distance: '3.4 km', duration: '6 min', traffic: 'clear' },
          ],
        },
      ],
    }
  },

  /**
   * Fetch Emergency Green Wave Dashboard Data
   * GET /api/v1/traffic/emergency
   */
  async getEmergencyData() {
    if (!this.isMockMode) {
      const res = await fetch(`${API_BASE_URL}/api/v1/traffic/emergency`)
      if (res.ok) return await res.json()
    }
    await simulateDelay(60)
    return {
      success: true,
      dispatches: getStoredEmergencyDispatches(),
      intersections: getStoredIntersections(),
    }
  },

  /**
   * Trigger Emergency Green Wave Corridor
   * POST /api/v1/traffic/emergency/trigger-greenwave
   */
  async triggerGreenWave(corridorData) {
    if (!this.isMockMode) {
      const res = await fetch(`${API_BASE_URL}/api/v1/traffic/emergency/trigger-greenwave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corridorData),
      })
      if (res.ok) return await res.json()
    }
    await simulateDelay(150)

    const dispatches = getStoredEmergencyDispatches()
    const newDispatch = {
      id: `EMERG-${Math.floor(100 + Math.random() * 899)}`,
      unitCode: corridorData.unitCode || 'MED-09',
      unitType: corridorData.unitType || 'ALS Trauma Ambulance',
      status: 'Active Priority En Route',
      origin: corridorData.origin || 'City North Substation',
      destination: corridorData.destination || 'City Central Trauma Center',
      corridorName: corridorData.corridorName || 'Priority Rapid Corridor',
      currentSpeed: 78,
      distanceRemainingKm: 4.5,
      etaMinutes: 3.8,
      signalsPreempted: 6,
      signalsTotal: 6,
      timeSavedMinutes: 8.2,
      priorityLevel: 'CODE RED',
      routeWaypoints: ['Boulevard 1', 'Arterial 4', 'Central Overpass', 'Emergency Bay'],
      activeSince: 'Just now',
    }

    const updated = [newDispatch, ...dispatches]
    saveStoredEmergencyDispatches(updated)

    // Preempt matching intersections to Green
    const intersections = getStoredIntersections()
    const preemptedIntersections = intersections.map(item => ({
      ...item,
      currentPhase: 'EMERGENCY PREEMPT GREEN',
      phaseColor: 'green',
      secondsRemaining: 90,
      mode: 'Emergency Priority Locked',
      lastOptimized: 'Preempted for ' + newDispatch.unitCode,
    }))
    saveStoredIntersections(preemptedIntersections)

    return {
      success: true,
      message: `Emergency Green Wave activated for unit ${newDispatch.unitCode}!`,
      data: newDispatch,
    }
  },

  /**
   * Deactivate Emergency Green Wave
   * POST /api/v1/traffic/emergency/cancel-greenwave
   */
  async cancelGreenWave(dispatchId) {
    if (!this.isMockMode) {
      const res = await fetch(`${API_BASE_URL}/api/v1/traffic/emergency/cancel-greenwave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dispatchId }),
      })
      if (res.ok) return await res.json()
    }
    await simulateDelay(100)
    const dispatches = getStoredEmergencyDispatches().filter(d => d.id !== dispatchId)
    saveStoredEmergencyDispatches(dispatches)

    // Restore intersections
    const intersections = getStoredIntersections().map(item => ({
      ...item,
      mode: 'AI Adaptive',
      currentPhase: 'North-South Green',
      phaseColor: 'green',
      secondsRemaining: 45,
      lastOptimized: 'Restored from Emergency Mode',
    }))
    saveStoredIntersections(intersections)

    return {
      success: true,
      message: 'Emergency corridor restored to standard adaptive operation.',
    }
  },

  /**
   * Fetch Camera Feeds
   * GET /api/v1/traffic/cameras
   */
  async getCameras() {
    if (!this.isMockMode) {
      const res = await fetch(`${API_BASE_URL}/api/v1/traffic/cameras`)
      if (res.ok) return await res.json()
    }
    await simulateDelay(50)
    return {
      success: true,
      data: CCTV_FEEDS,
    }
  },

  /**
   * Fetch Admin Analytics
   * GET /api/v1/traffic/analytics
   */
  async getAnalytics(timeRange = '7d') {
    if (!this.isMockMode) {
      const res = await fetch(`${API_BASE_URL}/api/v1/traffic/analytics?range=${timeRange}`)
      if (res.ok) return await res.json()
    }
    await simulateDelay(90)
    return {
      success: true,
      timeRange,
      data: ANALYTICS_DATA,
    }
  },
}

