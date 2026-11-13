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
const STORAGE_KEY_CAMERAS = 'trafficai_cameras_v1'

// Helper to simulate network latency in mock mode
const simulateDelay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms))

// Local storage state helpers
function getStoredCameras() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CAMERAS)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback
  }
  return CCTV_FEEDS
}

function saveStoredCameras(cameras) {
  try {
    localStorage.setItem(STORAGE_KEY_CAMERAS, JSON.stringify(cameras))
  } catch {
    // fallback
  }
}

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
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/traffic/cameras`)
        if (res.ok) return await res.json()
      } catch {
        // fallback
      }
    }
    await simulateDelay(50)
    return {
      success: true,
      data: getStoredCameras(),
    }
  },

  /**
   * Fetch Single Camera Details
   * GET /api/v1/traffic/cameras/:id
   */
  async getCameraById(id) {
    if (!this.isMockMode) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/traffic/cameras/${id}`)
        if (res.ok) return await res.json()
      } catch {
        // fallback
      }
    }
    await simulateDelay(40)
    const cameras = getStoredCameras()
    const camera = cameras.find((c) => c.id === id)
    if (!camera) return { success: false, error: 'Camera not found' }
    return { success: true, data: camera }
  },

  /**
   * Register a New Authorized Camera Node
   * POST /api/v1/traffic/cameras
   */
  async createCamera(cameraData) {
    if (!this.isMockMode) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/traffic/cameras`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cameraData),
        })
        if (res.ok) return await res.json()
      } catch {
        // fallback
      }
    }
    await simulateDelay(80)
    const cameras = getStoredCameras()
    const newCamera = {
      id: cameraData.id || `CAM-${Date.now().toString().slice(-4)}`,
      name: cameraData.name,
      location: cameraData.location || 'Belagavi Smart Grid',
      latitude: Number(cameraData.latitude) || 15.8497,
      longitude: Number(cameraData.longitude) || 74.4977,
      sector: cameraData.sector || 'Central Belagavi Grid',
      sourceType: cameraData.sourceType || 'public_hls',
      streamUrl: cameraData.streamUrl || '',
      snapshotUrl: cameraData.snapshotUrl || '',
      attribution: cameraData.attribution || 'Authorized Public Telemetry',
      usagePermissions: cameraData.usagePermissions || 'Authorized Feed',
      status: 'ONLINE',
      isEnabled: true,
      fps: cameraData.fps || 30,
      bitrate: '4.0 Mbps',
      resolution: cameraData.resolution || '1080p 60fps',
      detectedObjects: { cars: 12, trucks: 2, buses: 1, motorcycles: 8 },
      trafficDensity: 'Optimal',
      queueLengthMeters: 20,
      stationaryVehiclesCount: 0,
      aiAlert: 'Live camera stream initialized • Neural detection ready',
    }
    const updated = [newCamera, ...cameras]
    saveStoredCameras(updated)
    return { success: true, data: newCamera }
  },

  /**
   * Update Camera Node Properties
   * PATCH /api/v1/traffic/cameras/:id
   */
  async updateCamera(id, updateData) {
    if (!this.isMockMode) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/traffic/cameras/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        })
        if (res.ok) return await res.json()
      } catch {
        // fallback
      }
    }
    await simulateDelay(60)
    const cameras = getStoredCameras()
    const idx = cameras.findIndex((c) => c.id === id)
    if (idx !== -1) {
      cameras[idx] = { ...cameras[idx], ...updateData }
      saveStoredCameras(cameras)
      return { success: true, data: cameras[idx] }
    }
    return { success: false, error: 'Camera not found' }
  },

  /**
   * Delete / Decommission a Camera Node
   * DELETE /api/v1/traffic/cameras/:id
   */
  async deleteCamera(id) {
    if (!this.isMockMode) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/traffic/cameras/${id}`, {
          method: 'DELETE',
        })
        if (res.ok) return await res.json()
      } catch {
        // fallback
      }
    }
    await simulateDelay(60)
    const cameras = getStoredCameras().filter((c) => c.id !== id)
    saveStoredCameras(cameras)
    return { success: true, message: `Camera ${id} deleted` }
  },

  /**
   * Perform Live Computer Vision & Roadblock Analysis
   * POST /api/v1/traffic/cameras/:id/analyze
   */
  async analyzeCamera(id, { frameBase64, simulateRoadblock = false, numVehicles = 6 } = {}) {
    if (!this.isMockMode) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/traffic/cameras/${id}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            frameBase64,
            simulateRoadblock,
            numVehicles,
          }),
        })
        if (res.ok) return await res.json()
      } catch {
        // fallback
      }
    }
    await simulateDelay(150)
    const vehicleCount = simulateRoadblock ? 14 : 7
    return {
      success: true,
      camera_id: id,
      timestamp: new Date().toISOString(),
      detection_counts: {
        total_vehicles: vehicleCount,
        cars: Math.max(1, Math.floor(vehicleCount * 0.6)),
        buses: 2,
        trucks: 1,
        motorcycles: Math.max(1, vehicleCount - Math.floor(vehicleCount * 0.6) - 3),
      },
      traffic_metrics: {
        average_speed_kmh: simulateRoadblock ? 5.2 : 42.1,
        queue_length_meters: simulateRoadblock ? 120 : 18,
        stationary_vehicles_count: simulateRoadblock ? 3 : 0,
        density_level: simulateRoadblock ? 'HEAVY' : 'NORMAL',
      },
      incident_classification: {
        detected: Boolean(simulateRoadblock),
        category: simulateRoadblock ? 'PERSISTENT_TRAFFIC_QUEUE' : 'NORMAL_FLOW',
        confidence: simulateRoadblock ? 0.91 : 0.96,
        description: simulateRoadblock
          ? 'Persistent vehicle queue accumulation (>100m) with stationary obstacles in travel lane'
          : 'Normal vehicle progression within standard parameters',
      },
      evidence_frame: null,
      fallback_mode: true,
    }
  },

  /**
   * Fetch Computer Vision Engine Status
   * GET /api/v1/traffic/vision/status
   */
  async getVisionStatus() {
    if (!this.isMockMode) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/traffic/vision/status`)
        if (res.ok) return await res.json()
      } catch {
        // fallback
      }
    }
    return {
      success: true,
      data: {
        status: 'ready',
        service: 'TrafficAI Computer Vision Engine',
        onnx_model_loaded: true,
        model_file: 'tinyyolov2-8.onnx',
        supported_classes: ['car', 'bus', 'truck', 'motorcycle', 'pedestrian', 'bicycle'],
        capabilities: [
          'Real-time vehicle detection (COCO/VOC)',
          'Multi-object centroid tracking (MOT)',
          'Velocity estimation (km/h)',
          'Queue length estimation (meters)',
          'Stationary vehicle temporal hazard tracking',
          'Roadblock & incident classification',
          'Annotated HUD evidence frame export',
        ],
      },
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

  /**
   * Fetch ML Service Status & Loaded Models
   * GET /api/v1/traffic/ml/status
   */
  async getMLStatus() {
    if (!this.isMockMode) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/traffic/ml/status`)
        if (res.ok) return await res.json()
      } catch {
        // fallback
      }
    }
    return {
      success: true,
      service: 'TrafficAI Machine Learning Integration',
      online: true,
      health: { status: 'healthy', models_ready: 4, total_models: 4 },
      modelInfo: {
        models_loaded: {
          speed_15min_xgb: true,
          speed_30min_xgb: true,
          anomaly_detector: true,
          severity_classifier: true,
        },
      },
    }
  },

  /**
   * Fetch ML Model Training & Test Evaluation Metrics
   * GET /api/v1/traffic/ml/metrics
   */
  async getMLMetrics() {
    if (!this.isMockMode) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/traffic/ml/metrics`)
        if (res.ok) return await res.json()
      } catch {
        // fallback
      }
    }
    return {
      success: true,
      data: {
        dataset_metadata: {
          name: 'METR-LA Highway Traffic Speed Benchmark (Los Angeles County)',
          total_sensors: 207,
          timesteps: 2016,
          total_speed_observations: 417312,
        },
        models: {
          speed_forecaster_15m: {
            model_type: 'XGBoost Regressor (n_est=150, max_depth=6)',
            test_mae_kmh: 5.18,
            test_rmse_kmh: 8.95,
            test_r2: 0.8241,
            test_mape_pct: 8.15,
          },
          speed_forecaster_30m: {
            model_type: 'XGBoost Regressor (n_est=150, max_depth=6)',
            test_mae_kmh: 6.24,
            test_rmse_kmh: 10.72,
            test_r2: 0.7473,
            test_mape_pct: 10.55,
          },
          anomaly_detector: {
            model_type: 'Isolation Forest (contamination=0.045)',
            training_samples: 138276,
            anomalies_detected: 6223,
            anomaly_rate_pct: 4.5,
          },
          incident_severity_classifier: {
            model_type: 'Random Forest Classifier (n_est=100, max_depth=10)',
            provenance: '[SYNTHETIC-PROTOTYPE-DATASET-V1] (FHWA TIM Calibrated)',
            test_accuracy_pct: 86.72,
            test_macro_f1: 0.871,
          },
        },
      },
    }
  },

  /**
   * Forecast Speed with XGBoost (15m & 30m)
   * POST /api/v1/traffic/ml/predict-speed
   */
  async predictSpeed(params) {
    if (!this.isMockMode) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/traffic/ml/predict-speed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        })
        if (res.ok) return await res.json()
      } catch {
        // fallback
      }
    }
    const curr = params.currentSpeedKmh || 45.0
    return {
      success: true,
      data: {
        forecast_15m: {
          predicted_speed_kmh: Math.round(curr * 0.94),
          speed_change_kmh: -Math.round(curr * 0.06),
          congestion_level: curr < 30 ? 'HEAVY' : 'MODERATE',
          horizon_minutes: 15,
          model: 'XGBoost Regressor (METR-LA)',
        },
        forecast_30m: {
          predicted_speed_kmh: Math.round(curr * 0.91),
          speed_change_kmh: -Math.round(curr * 0.09),
          congestion_level: curr < 30 ? 'SEVERE' : 'MODERATE',
          horizon_minutes: 30,
          model: 'XGBoost Regressor (METR-LA)',
        },
      },
    }
  },

  /**
   * Detect Anomalies with Isolation Forest
   * POST /api/v1/traffic/ml/detect-anomalies
   */
  async detectAnomalies(corridors) {
    if (!this.isMockMode) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/traffic/ml/detect-anomalies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ corridors }),
        })
        if (res.ok) return await res.json()
      } catch {
        // fallback
      }
    }
    return {
      success: true,
      data: {
        total_evaluated: corridors.length,
        anomalies_detected: corridors.filter(c => c.current_speed_kmh < 20).length,
        results: corridors.map(c => ({
          id: c.id,
          current_speed_kmh: c.current_speed_kmh,
          is_anomaly: c.current_speed_kmh < 20,
          anomaly_score: c.current_speed_kmh < 20 ? 0.78 : 0.12,
          diagnosis: c.current_speed_kmh < 20 ? 'Sudden deceleration collapse' : 'Normal flow',
        })),
      },
    }
  },

  /**
   * Classify Incident Severity with Random Forest
   * POST /api/v1/traffic/ml/classify-severity
   */
  async classifySeverity(incidentData) {
    if (!this.isMockMode) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/traffic/ml/classify-severity`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(incidentData),
        })
        if (res.ok) return await res.json()
      } catch {
        // fallback
      }
    }
    return {
      success: true,
      data: {
        predicted_severity: incidentData.lanesBlocked >= 2 ? 'CRITICAL' : 'HIGH',
        confidence: 0.88,
        contributing_factors: [`Lane blockage (${incidentData.lanesBlocked || 1} lanes blocked)`],
      },
    }
  },

  /**
   * User & Admin Authentication Services
   */
  async login(email, password) {
    const cleanEmail = email.trim().toLowerCase()

    if (!this.isMockMode) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password }),
        })
        const data = await res.json()
        if (res.ok && data.success) {
          if (data.token) localStorage.setItem('trafficai_jwt_token', data.token)
          if (data.user) localStorage.setItem('trafficai_user_profile', JSON.stringify(data.user))
          return data
        } else {
          return { success: false, error: data.error || 'Authentication failed' }
        }
      } catch (err) {
        console.warn('Backend login unavailable, evaluating via local credentials:', err.message)
      }
    }

    // Local Mock / Offline Authentication Fallback
    await simulateDelay(150)
    const seeded = [
      {
        id: 'usr-admin-01',
        name: 'Chief Traffic Commander',
        email: 'admin@trafficai.gov',
        password: 'AdminPassword123!',
        role: 'admin',
        department: 'Smart Mobility Command Center',
        badgeNumber: 'CMD-001',
      },
      {
        id: 'usr-op-02',
        name: 'Sector Dispatch Operator',
        email: 'operator@trafficai.gov',
        password: 'OperatorPassword123!',
        role: 'operator',
        department: 'Urban Grid Operations',
        badgeNumber: 'OP-404',
      },
      {
        id: 'usr-commuter-03',
        name: 'Civilian Transit User',
        email: 'user@trafficai.gov',
        password: 'UserPassword123!',
        role: 'user',
        department: 'Public Mobility Commuter',
        badgeNumber: 'PUB-101',
      },
    ]

    // Also check any locally registered users
    let localUsers = []
    try {
      const stored = localStorage.getItem('trafficai_registered_users')
      if (stored) localUsers = JSON.parse(stored)
    } catch {}

    const allUsers = [...seeded, ...localUsers]
    const match = allUsers.find((u) => u.email.toLowerCase() === cleanEmail)

    if (!match) {
      return { success: false, error: 'Invalid credentials: user not found.' }
    }

    if (match.password !== password) {
      return { success: false, error: 'Invalid credentials: password incorrect.' }
    }

    const mockToken = `mock_jwt_token_${match.role}_${Date.now()}`
    const userProfile = {
      id: match.id || `usr-${Date.now()}`,
      name: match.name,
      email: match.email,
      role: match.role,
      department: match.department || 'Traffic Operations',
      badgeNumber: match.badgeNumber || 'TFC-100',
    }

    localStorage.setItem('trafficai_jwt_token', mockToken)
    localStorage.setItem('trafficai_user_profile', JSON.stringify(userProfile))

    return {
      success: true,
      message: 'Logged in successfully.',
      token: mockToken,
      user: userProfile,
    }
  },

  async register(userData) {
    const { name, email, password, role, department, badgeNumber } = userData
    const cleanEmail = email.trim().toLowerCase()

    if (!this.isMockMode) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email: cleanEmail,
            password,
            role: role || 'user',
            department: department || 'Urban Transit',
            badgeNumber: badgeNumber || null,
          }),
        })
        const data = await res.json()
        if (res.ok && data.success) {
          if (data.token) localStorage.setItem('trafficai_jwt_token', data.token)
          if (data.user) localStorage.setItem('trafficai_user_profile', JSON.stringify(data.user))
          return data
        } else {
          return { success: false, error: data.error || 'Registration failed' }
        }
      } catch (err) {
        console.warn('Backend register unavailable, fallback to local storage:', err.message)
      }
    }

    // Local Mock / Offline Registration Fallback
    await simulateDelay(150)
    let localUsers = []
    try {
      const stored = localStorage.getItem('trafficai_registered_users')
      if (stored) localUsers = JSON.parse(stored)
    } catch {}

    if (localUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'An account with this email address already exists.' }
    }

    const newUser = {
      id: `usr-${Date.now()}`,
      name,
      email: cleanEmail,
      password,
      role: role || 'user',
      department: department || 'Urban Transit',
      badgeNumber: badgeNumber || 'REG-' + Math.floor(100 + Math.random() * 900),
    }

    localUsers.push(newUser)
    localStorage.setItem('trafficai_registered_users', JSON.stringify(localUsers))

    const mockToken = `mock_jwt_token_${newUser.role}_${Date.now()}`
    const userProfile = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department,
      badgeNumber: newUser.badgeNumber,
    }

    localStorage.setItem('trafficai_jwt_token', mockToken)
    localStorage.setItem('trafficai_user_profile', JSON.stringify(userProfile))

    return {
      success: true,
      message: 'Account registered successfully.',
      token: mockToken,
      user: userProfile,
    }
  },

  async getMe() {
    const token = localStorage.getItem('trafficai_jwt_token')
    if (!token) return { success: false, user: null }

    if (!this.isMockMode && !token.startsWith('mock_')) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) return await res.json()
      } catch {
        // fallback
      }
    }

    try {
      const stored = localStorage.getItem('trafficai_user_profile')
      if (stored) return { success: true, user: JSON.parse(stored) }
    } catch {}

    return { success: false, user: null }
  },

  async logout() {
    const token = localStorage.getItem('trafficai_jwt_token')
    if (token && !this.isMockMode && !token.startsWith('mock_')) {
      try {
        await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch {}
    }
    localStorage.removeItem('trafficai_jwt_token')
    localStorage.removeItem('trafficai_user_profile')
    return { success: true }
  },
}

export const trafficService = TrafficService
export default TrafficService

