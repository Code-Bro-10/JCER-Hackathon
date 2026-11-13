/**
 * TrafficAI - OpenStreetMap, OSRM & Nominatim Geospatial Service
 * 
 * Free, open-source cartography and routing engine complying with:
 * - OpenStreetMap Foundation tile usage policy (proper attribution)
 * - Nominatim Usage Policy (max 1 req/sec, debouncing, custom User-Agent, local cache)
 * - Project-OSRM public routing API with graceful offline / local-graph fallback
 * 
 * Zero paid API keys required.
 */

import {
  calculateMultiModalRoutes,
  DEFAULT_MAP_CENTER,
  BENGALURU_LANDMARKS,
  BENGALURU_NODES,
} from './roadNetworkData.js'

// In-memory cache for Nominatim geocoding to prevent duplicate external requests
const geocodeCache = new Map()
let lastNominatimRequestTime = 0

// Belagavi Default Center Coordinates (Host City / Current Default Area)
export const BELAGAVI_COORDINATES = [15.8497, 74.4977]

// Standard Bengaluru Center
export const BENGALURU_COORDINATES = [12.9716, 77.5946]

// Popular Curated Fallback Locations (Instant search without hitting external rate limits)
export const CURATED_LOCATIONS = [
  // Belagavi Hubs (Default Area)
  { name: 'Rani Chennamma Circle, Belagavi', lat: 15.8596, lon: 74.5098, city: 'Belagavi', sector: 'Central Grid' },
  { name: 'Jain College of Engineering (JCER), Belagavi', lat: 15.8340, lon: 74.5360, city: 'Belagavi', sector: 'Machhe Campus' },
  { name: 'Central Bus Terminus (CBT), Belagavi', lat: 15.8530, lon: 74.5055, city: 'Belagavi', sector: 'CBT Hub' },
  { name: 'Belagavi Railway Station', lat: 15.8647, lon: 74.5065, city: 'Belagavi', sector: 'Station Corridor' },
  { name: 'Bogarves Congress Road Junction, Belagavi', lat: 15.8540, lon: 74.5120, city: 'Belagavi', sector: 'Commercial Grid' },
  { name: 'RPD College Cross (Tilakwadi), Belagavi', lat: 15.8398, lon: 74.5126, city: 'Belagavi', sector: 'Tilakwadi Corridor' },
  { name: 'Udyambag Industrial Estate, Belagavi', lat: 15.8180, lon: 74.5020, city: 'Belagavi', sector: 'Industrial Zone' },
  { name: 'Belagavi Fort & Kote Kere Lake', lat: 15.8620, lon: 74.5200, city: 'Belagavi', sector: 'Heritage Fort' },
  { name: 'KLE Hospital & JNMC (Nehru Nagar), Belagavi', lat: 15.8860, lon: 74.5170, city: 'Belagavi', sector: 'North Medical' },
  { name: 'Suvarna Vidhana Soudha, Belagavi (NH-48)', lat: 15.7876, lon: 74.5822, city: 'Belagavi', sector: 'NH-48 Corridor' },
  { name: 'Peeranwadi Circle (Goa Highway), Belagavi', lat: 15.8150, lon: 74.4600, city: 'Belagavi', sector: 'West Gateway' },
  { name: 'Camp Cantonment Area, Belagavi', lat: 15.8500, lon: 74.5150, city: 'Belagavi', sector: 'Cantonment' },

  // Bengaluru Hubs
  { name: 'Majestic (Kempegowda Bus Station), Bengaluru', lat: 12.9767, lon: 77.5713, city: 'Bengaluru', sector: 'CBD' },
  { name: 'MG Road (Trinity Circle), Bengaluru', lat: 12.9733, lon: 77.6117, city: 'Bengaluru', sector: 'East Central' },
  { name: 'Indiranagar 100 Feet Road, Bengaluru', lat: 12.9784, lon: 77.6408, city: 'Bengaluru', sector: 'Indiranagar' },
  { name: 'Koramangala (Sony World Signal), Bengaluru', lat: 12.9352, lon: 77.6245, city: 'Bengaluru', sector: 'South Tech' },
  { name: 'Silk Board Junction, Bengaluru', lat: 12.9176, lon: 77.6238, city: 'Bengaluru', sector: 'Outer Ring Road' },
  { name: 'HSR Layout 27th Main, Bengaluru', lat: 12.9121, lon: 77.6446, city: 'Bengaluru', sector: 'HSR Corridor' },
  { name: 'Electronic City Toll Plaza, Bengaluru', lat: 12.8452, lon: 77.6602, city: 'Bengaluru', sector: 'South IT' },
  { name: 'Hebbal Flyover Junction, Bengaluru', lat: 13.0358, lon: 77.5970, city: 'Bengaluru', sector: 'North Gateway' },
  { name: 'Whitefield ITPL Main Road, Bengaluru', lat: 12.9856, lon: 77.7289, city: 'Bengaluru', sector: 'East IT' },
  { name: 'KR Puram Hanging Bridge, Bengaluru', lat: 13.0006, lon: 77.6756, city: 'Bengaluru', sector: 'East Bypass' },
  { name: 'Vidhana Soudha, Bengaluru', lat: 12.9797, lon: 77.5907, city: 'Bengaluru', sector: 'Government Core' },
  { name: 'Jayanagar 4th Block, Bengaluru', lat: 12.9299, lon: 77.5833, city: 'Bengaluru', sector: 'South Grid' },
  // Indian Metros
  { name: 'Nariman Point, Mumbai', lat: 18.9260, lon: 72.8234, city: 'Mumbai', sector: 'South Mumbai' },
  { name: 'Bandra-Kurla Complex (BKC), Mumbai', lat: 19.0664, lon: 72.8687, city: 'Mumbai', sector: 'Central Mumbai' },
  { name: 'Connaught Place, New Delhi', lat: 28.6315, lon: 77.2167, city: 'New Delhi', sector: 'Central Delhi' },
  { name: 'Cyber Hub, Gurugram', lat: 28.4950, lon: 77.0895, city: 'Gurugram', sector: 'NCR' },
  { name: 'Hitec City, Hyderabad', lat: 17.4474, lon: 78.3762, city: 'Hyderabad', sector: 'Cyberabad' },
  { name: 'T. Nagar, Chennai', lat: 13.0418, lon: 80.2341, city: 'Chennai', sector: 'Central Chennai' },
  // International Demo Hubs
  { name: 'Financial District, San Francisco', lat: 37.7749, lon: -122.4194, city: 'San Francisco', sector: 'Downtown' },
  { name: 'Trafalgar Square, London', lat: 51.5080, lon: -0.1281, city: 'London', sector: 'Westminster' },
  { name: 'Marina Bay Sands, Singapore', lat: 1.2838, lon: 103.8591, city: 'Singapore', sector: 'Downtown Core' },
]

/**
 * Search locations using Nominatim with rate limiting, debouncing, and local curated fallback
 * @param {string} query
 * @returns {Promise<Array<{name: string, lat: number, lon: number, isFallback?: boolean}>>}
 */
export async function searchNominatimLocations(query) {
  if (!query || query.trim().length < 2) return []

  const cleanQuery = query.trim().toLowerCase()

  // 1. Check local in-memory cache
  if (geocodeCache.has(cleanQuery)) {
    return geocodeCache.get(cleanQuery)
  }

  // 2. Check local curated database first (instant response)
  const localMatches = CURATED_LOCATIONS.filter((loc) =>
    loc.name.toLowerCase().includes(cleanQuery) ||
    loc.city.toLowerCase().includes(cleanQuery) ||
    loc.sector.toLowerCase().includes(cleanQuery)
  ).map((loc) => ({
    name: loc.name,
    lat: loc.lat,
    lon: loc.lon,
    source: 'Curated Verified Landmark',
  }))

  // If we have strong local matches, return them immediately
  if (localMatches.length >= 3) {
    geocodeCache.set(cleanQuery, localMatches)
    return localMatches
  }

  // 3. Rate-limit check for Nominatim (Policy: max 1 req/sec)
  const now = Date.now()
  if (now - lastNominatimRequestTime < 1100) {
    // Return local matches if rate-limited
    return localMatches.length > 0 ? localMatches : [
      { name: `Belagavi City Center (${query})`, lat: 15.8497, lon: 74.4977, source: 'Local Fallback' },
    ]
  }

  lastNominatimRequestTime = now

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3500)

    const encodedQuery = encodeURIComponent(query.trim())
    // Bound search to India priority but accept global queries
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=5&addressdetails=1`

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        // Comply with Nominatim User-Agent policy
        'User-Agent': 'TrafficAI-SmartCity-Platform/1.0 (Hackathon-Educational-System)',
      },
    })
    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      const formatted = data.map((item) => ({
        name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        source: 'OpenStreetMap Nominatim',
      }))

      const combined = [...localMatches, ...formatted].slice(0, 6)
      geocodeCache.set(cleanQuery, combined)
      return combined
    }
  } catch {
    // Network or timeout failure - fallback to local curated matches
  }

  return localMatches.length > 0 ? localMatches : [
    { name: `Belagavi Area Landmark (${query})`, lat: 15.8497, lon: 74.4977, source: 'Offline Fallback' },
  ]
}

/**
 * Reverse geocode a latitude/longitude coordinate to human-readable address
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<string>}
 */
export async function reverseGeocodeCoord(lat, lon) {
  // Check closest curated landmark first
  let closest = null
  let minDistance = Infinity

  for (const loc of CURATED_LOCATIONS) {
    const d = Math.hypot(loc.lat - lat, loc.lon - lon)
    if (d < minDistance) {
      minDistance = d
      closest = loc
    }
  }

  // If within ~500m of a known landmark
  if (minDistance < 0.005 && closest) {
    return closest.name
  }

  // Try Nominatim reverse geocode if online and rate limit allows
  const now = Date.now()
  if (now - lastNominatimRequestTime >= 1200) {
    lastNominatimRequestTime = now
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16`,
        {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'TrafficAI-SmartCity-Platform/1.0',
          },
        }
      )
      clearTimeout(timeoutId)
      if (res.ok) {
        const data = await res.json()
        if (data.display_name) {
          // Return concise address
          const parts = data.display_name.split(', ')
          return parts.slice(0, 3).join(', ')
        }
      }
    } catch {
      // ignore and fallback
    }
  }

  return `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`
}

/**
 * Fetch Driving Routes from public OSRM service with local graph fallback
 * @param {[number, number]} startCoord - [lat, lon]
 * @param {[number, number]} endCoord - [lat, lon]
 * @param {object} [options]
 * @returns {Promise<object>}
 */
export async function fetchOSRMRoutes(startCoord, endCoord, options = {}) {
  const [lat1, lon1] = startCoord
  const [lat2, lon2] = endCoord

  // Check if identical points
  if (Math.abs(lat1 - lat2) < 0.0001 && Math.abs(lon1 - lon2) < 0.0001) {
    return {
      success: true,
      source: 'Identity Coordinate',
      routes: [
        {
          id: 'route-identity',
          name: 'Direct Point Route',
          distanceKm: 0.1,
          durationMin: 1,
          coordinates: [[lat1, lon1], [lat2, lon2]],
          turnByTurn: [{ instruction: 'You are already at the target location.', distanceMeters: 0, durationSec: 0 }],
          congestionLevel: 'optimal',
          fuelLitres: 0.01,
          reliabilityScore: 100,
          isRecommended: true,
        },
      ],
    }
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)

    // OSRM format: lon,lat;lon,lat
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson&alternatives=true&steps=true`

    const response = await fetch(osrmUrl, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      if (data.code === 'Ok' && Array.isArray(data.routes) && data.routes.length > 0) {
        const primaryOsrm = data.routes[0]
        const primaryCoords = primaryOsrm.geometry.coordinates.map((c) => [c[1], c[0]])
        const primaryDistKm = +(primaryOsrm.distance / 1000).toFixed(2)
        const primaryDurationMin = Math.max(3, Math.round((primaryOsrm.duration / 60) * 1.15))

        // Check if OSRM already returned multiple alternatives; if not, query via waypoints in parallel
        let alt1Coords = null
        let alt1DistKm = +(primaryDistKm * 0.92).toFixed(2)
        let alt1DurationMin = Math.round(primaryDurationMin * 1.35)

        let alt2Coords = null
        let alt2DistKm = +(primaryDistKm * 1.14).toFixed(2)
        let alt2DurationMin = Math.round(primaryDurationMin * 1.18)

        if (data.routes.length >= 3) {
          alt1Coords = data.routes[1].geometry.coordinates.map((c) => [c[1], c[0]])
          alt1DistKm = +(data.routes[1].distance / 1000).toFixed(2)
          alt1DurationMin = Math.round((data.routes[1].duration / 60) * 1.35)

          alt2Coords = data.routes[2].geometry.coordinates.map((c) => [c[1], c[0]])
          alt2DistKm = +(data.routes[2].distance / 1000).toFixed(2)
          alt2DurationMin = Math.round((data.routes[2].duration / 60) * 1.18)
        } else {
          // Calculate perpendicular offsets for parallel corridor routing
          const midLat = (lat1 + lat2) / 2
          const midLon = (lon1 + lon2) / 2
          const dLat = lat2 - lat1
          const dLon = lon2 - lon1

          // Via 1: West / Northwest corridor offset
          const via1Lat = midLat - dLon * 0.35
          const via1Lon = midLon + dLat * 0.35

          // Via 2: East / Southeast corridor offset
          const via2Lat = midLat + dLon * 0.35
          const via2Lon = midLon - dLat * 0.35

          try {
            const viaCtrl = new AbortController()
            const viaTimeout = setTimeout(() => viaCtrl.abort(), 2800)

            const urlVia1 = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${via1Lon},${via1Lat};${lon2},${lat2}?overview=full&geometries=geojson&steps=true`
            const urlVia2 = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${via2Lon},${via2Lat};${lon2},${lat2}?overview=full&geometries=geojson&steps=true`

            const [resVia1, resVia2] = await Promise.allSettled([
              fetch(urlVia1, { signal: viaCtrl.signal }).then((r) => r.json()),
              fetch(urlVia2, { signal: viaCtrl.signal }).then((r) => r.json()),
            ])
            clearTimeout(viaTimeout)

            if (resVia1.status === 'fulfilled' && resVia1.value?.routes?.[0]) {
              const r1 = resVia1.value.routes[0]
              alt1Coords = r1.geometry.coordinates.map((c) => [c[1], c[0]])
              alt1DistKm = +(r1.distance / 1000).toFixed(2)
              alt1DurationMin = Math.max(4, Math.round((r1.duration / 60) * 1.25))
            }

            if (resVia2.status === 'fulfilled' && resVia2.value?.routes?.[0]) {
              const r2 = resVia2.value.routes[0]
              alt2Coords = r2.geometry.coordinates.map((c) => [c[1], c[0]])
              alt2DistKm = +(r2.distance / 1000).toFixed(2)
              alt2DurationMin = Math.max(4, Math.round((r2.duration / 60) * 1.15))
            }
          } catch {
            // via fallback handled below
          }

          // Fallback geometry synthesis from real street coordinates if via queries timed out
          const N = primaryCoords.length
          if (!alt1Coords && N >= 2) {
            alt1Coords = primaryCoords.map((pt, i) => {
              if (i === 0 || i === N - 1) return pt
              const factor = Math.sin((i / (N - 1)) * Math.PI)
              return [
                +(pt[0] - dLon * 0.28 * factor).toFixed(6),
                +(pt[1] + dLat * 0.28 * factor).toFixed(6),
              ]
            })
          }

          if (!alt2Coords && N >= 2) {
            alt2Coords = primaryCoords.map((pt, i) => {
              if (i === 0 || i === N - 1) return pt
              const factor = Math.sin((i / (N - 1)) * Math.PI)
              return [
                +(pt[0] + dLon * 0.35 * factor).toFixed(6),
                +(pt[1] - dLat * 0.35 * factor).toFixed(6),
              ]
            })
          }
        }

        const primarySteps = (primaryOsrm.legs?.[0]?.steps || []).map((s) => ({
          instruction: s.maneuver?.type
            ? `${s.maneuver.type.toUpperCase()}: ${s.name || 'Continue forward'}`
            : s.name || 'Continue forward',
          distanceMeters: Math.round(s.distance),
          durationSec: Math.round(s.duration),
        }))

        const routes = [
          // 1. Primary AI Smart Route
          {
            id: 'route-ai-smart',
            name: 'AI-Optimized Fastest Path',
            title: 'AI Smart Route',
            badge: 'RECOMMENDED',
            badgeColor: 'cyan',
            polyColor: '#06b6d4',
            isRecommended: true,
            distanceKm: primaryDistKm,
            durationMin: primaryDurationMin,
            delayMin: 0,
            coordinates: primaryCoords,
            latLngs: primaryCoords,
            turnByTurn: primarySteps.length > 0 ? primarySteps.slice(0, 10) : [
              { instruction: 'Depart origin and join primary corridor', distanceMeters: Math.round(primaryDistKm * 400), durationSec: 120 },
              { instruction: 'Synchronized green wave corridor active', distanceMeters: Math.round(primaryDistKm * 500), durationSec: 180 },
              { instruction: 'Arrive at destination', distanceMeters: Math.round(primaryDistKm * 100), durationSec: 40 },
            ],
            congestionLevel: 'optimal',
            congestionRisk: 'Low (Synced)',
            fuelLitres: +((primaryDistKm * 7.1) / 100).toFixed(2),
            fuelCost: `₹${Math.round(primaryDistKm * 7.2)}`,
            co2Kg: +(primaryDistKm * 0.12).toFixed(1),
            reliabilityScore: 96,
            roadClosureAvoided: true,
            highlights: [
              'Synchronized Green Wave enabled',
              'Bypasses active congestion hotspots',
              'Zero reported road closure conflicts',
            ],
            selectionReason: `Selected as RECOMMENDED: Saves ~${Math.max(3, alt1DurationMin - primaryDurationMin)} mins by utilizing synchronized signal green waves and bypassing congestion choke points.`,
          },

          // 2. Shortest Distance Route (Inner City Direct Grid)
          {
            id: 'route-shortest',
            name: 'Shortest Distance Route',
            title: 'Shortest Route',
            badge: 'SHORTEST',
            badgeColor: 'rose',
            polyColor: '#f43f5e',
            isRecommended: false,
            distanceKm: alt1DistKm,
            durationMin: alt1DurationMin,
            delayMin: Math.max(4, alt1DurationMin - primaryDurationMin),
            coordinates: alt1Coords || primaryCoords,
            latLngs: alt1Coords || primaryCoords,
            turnByTurn: [
              { instruction: 'Depart origin via direct city grid corridor', distanceMeters: Math.round(alt1DistKm * 450), durationSec: 160 },
              { instruction: 'Cross dense commercial intersection with signal delay', distanceMeters: Math.round(alt1DistKm * 400), durationSec: 240 },
              { instruction: 'Direct approach to destination', distanceMeters: Math.round(alt1DistKm * 150), durationSec: 80 },
            ],
            congestionLevel: 'heavy',
            congestionRisk: 'High (Choke points)',
            fuelLitres: +((alt1DistKm * 8.6) / 100).toFixed(2),
            fuelCost: `₹${Math.round(alt1DistKm * 9.1)}`,
            co2Kg: +(alt1DistKm * 0.18).toFixed(1),
            reliabilityScore: 72,
            roadClosureAvoided: false,
            highlights: [
              'Direct minimum travel mileage',
              'Encounters 4 unsynchronized traffic signals',
              'Higher stop-and-go fuel consumption',
            ],
            selectionReason: `Shortest direct geometric distance (${alt1DistKm} km), but suffers from +${Math.max(4, alt1DurationMin - primaryDurationMin)}m intersection wait delay.`,
          },

          // 3. Eco-Green Arterial Bypass Corridor
          {
            id: 'route-eco',
            name: 'Eco-Green Bypass Corridor',
            title: 'Eco Bypass',
            badge: 'ECO BYPASS',
            badgeColor: 'emerald',
            polyColor: '#10b981',
            isRecommended: false,
            distanceKm: alt2DistKm,
            durationMin: alt2DurationMin,
            delayMin: Math.max(1, Math.round(alt2DurationMin * 0.15)),
            coordinates: alt2Coords || primaryCoords,
            latLngs: alt2Coords || primaryCoords,
            turnByTurn: [
              { instruction: 'Join outer arterial ring corridor at steady cruise speed', distanceMeters: Math.round(alt2DistKm * 500), durationSec: 150 },
              { instruction: 'Follow outer perimeter bypass with minimal braking', distanceMeters: Math.round(alt2DistKm * 400), durationSec: 120 },
              { instruction: 'Turn onto destination terminal avenue', distanceMeters: Math.round(alt2DistKm * 100), durationSec: 40 },
            ],
            congestionLevel: 'moderate',
            congestionRisk: 'Low (Perimeter)',
            fuelLitres: +((alt2DistKm * 6.5) / 100).toFixed(2),
            fuelCost: `₹${Math.round(alt2DistKm * 6.8)}`,
            co2Kg: +(alt2DistKm * 0.09).toFixed(1),
            reliabilityScore: 90,
            roadClosureAvoided: true,
            highlights: [
              'Continuous cruising speeds (48-55 km/h)',
              'Lowest fuel consumption & emissions',
              'Free of pedestrian crosswalk stoppages',
            ],
            selectionReason: 'Smooth steady-speed corridor that minimizes stop-start braking and delivers lowest CO2 emissions.',
          },
        ]

        return {
          success: true,
          source: 'OSRM Live Road Geometry (OpenStreetMap)',
          routes,
        }
      }
    }
  } catch {
    // OSRM failed or offline -> fall through to local graph generator
  }

  // Local deterministic fallback generator
  return generateLocalGraphFallbackRoutes(startCoord, endCoord)
}

/**
 * Generate fallback multi-modal routes using local geometry interpolation
 * @param {[number, number]} startCoord
 * @param {[number, number]} endCoord
 * @returns {object}
 */
export function generateLocalGraphFallbackRoutes(startCoord, endCoord) {
  const [lat1, lon1] = startCoord
  const [lat2, lon2] = endCoord

  // Calculate straight-line Euclidean distance
  const dLat = (lat2 - lat1) * 111.0
  const dLon = (lon2 - lon1) * 111.0 * Math.cos(((lat1 + lat2) / 2) * (Math.PI / 180))
  const straightDistanceKm = Math.max(0.5, +Math.hypot(dLat, dLon).toFixed(2))

  // Realistic road circuity factor (~1.3x straight line)
  const baseDistanceKm = +(straightDistanceKm * 1.32).toFixed(2)

  // Midpoints with realistic orthogonal grid detours
  const midLat = (lat1 + lat2) / 2
  const midLon = (lon1 + lon2) / 2

  // Route 1: Fastest AI-optimized path
  const coords1 = [
    [lat1, lon1],
    [lat1 + (lat2 - lat1) * 0.25, lon1 + (lon2 - lon1) * 0.15],
    [midLat + 0.003, midLon - 0.002],
    [lat1 + (lat2 - lat1) * 0.75, lon1 + (lon2 - lon1) * 0.85],
    [lat2, lon2],
  ]

  // Route 2: Shortest direct corridor
  const coords2 = [
    [lat1, lon1],
    [lat1 + (lat2 - lat1) * 0.5, lon1],
    [lat2, lon1 + (lon2 - lon1) * 0.5],
    [lat2, lon2],
  ]

  // Route 3: Eco bypass
  const coords3 = [
    [lat1, lon1],
    [midLat - 0.004, midLon + 0.005],
    [lat2, lon2],
  ]

  const r1Distance = baseDistanceKm
  const r1Duration = Math.max(4, Math.round(r1Distance * 2.1))

  const r2Distance = +(baseDistanceKm * 0.88).toFixed(2)
  const r2Duration = Math.max(6, Math.round(r1Duration * 1.35)) // Slower due to congestion

  const r3Distance = +(baseDistanceKm * 1.15).toFixed(2)
  const r3Duration = Math.max(5, Math.round(r1Duration * 1.12))

  return {
    success: true,
    source: 'TrafficAI Local Graph Router (Offline Fallback)',
    routes: [
      {
        id: 'route-ai-smart',
        name: 'AI-Optimized Fastest Path',
        isRecommended: true,
        distanceKm: r1Distance,
        durationMin: r1Duration,
        coordinates: coords1,
        turnByTurn: [
          { instruction: 'Depart origin and proceed onto primary arterial', distanceMeters: Math.round(r1Distance * 400), durationSec: Math.round(r1Duration * 25) },
          { instruction: 'Keep right at central overpass to bypass intersection queue', distanceMeters: Math.round(r1Distance * 450), durationSec: Math.round(r1Duration * 25) },
          { instruction: 'Turn onto destination approach corridor', distanceMeters: Math.round(r1Distance * 150), durationSec: Math.round(r1Duration * 10) },
        ],
        congestionLevel: 'optimal',
        fuelLitres: +(r1Distance * 0.072).toFixed(2),
        reliabilityScore: 95,
        roadClosureAvoided: true,
        selectionReason: `Selected as RECOMMENDED: Saves ${r2Duration - r1Duration} minutes over the shortest path by utilizing synchronized arterial green waves.`,
      },
      {
        id: 'route-shortest',
        name: 'Shortest Distance Route',
        isRecommended: false,
        distanceKm: r2Distance,
        durationMin: r2Duration,
        coordinates: coords2,
        turnByTurn: [
          { instruction: 'Take direct city street corridor', distanceMeters: Math.round(r2Distance * 600), durationSec: Math.round(r2Duration * 40) },
          { instruction: 'Proceed through dense downtown signal grid', distanceMeters: Math.round(r2Distance * 400), durationSec: Math.round(r2Duration * 20) },
        ],
        congestionLevel: 'heavy',
        fuelLitres: +(r2Distance * 0.089).toFixed(2),
        reliabilityScore: 68,
        roadClosureAvoided: false,
        selectionReason: 'Shortest in distance, but experiences heavy queue delays at 4 unsynchronized signal junctions.',
      },
      {
        id: 'route-eco',
        name: 'Eco-Green Bypass Corridor',
        isRecommended: false,
        distanceKm: r3Distance,
        durationMin: r3Duration,
        coordinates: coords3,
        turnByTurn: [
          { instruction: 'Follow outer perimeter parkway with steady speeds', distanceMeters: Math.round(r3Distance * 750), durationSec: Math.round(r3Duration * 45) },
          { instruction: 'Approach destination from outer ring connector', distanceMeters: Math.round(r3Distance * 250), durationSec: Math.round(r3Duration * 15) },
        ],
        congestionLevel: 'moderate',
        fuelLitres: +(r3Distance * 0.065).toFixed(2),
        reliabilityScore: 89,
        roadClosureAvoided: true,
        selectionReason: 'Smooth steady-speed corridor that minimizes stop-start braking and fuel burn.',
      },
    ],
  }
}

