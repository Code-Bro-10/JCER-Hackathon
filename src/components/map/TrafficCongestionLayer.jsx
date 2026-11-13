import React from 'react'
import { Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { DEMO_EDGES, getEdgeLatLngs, getEdgeCongestionState } from '../../services/roadNetworkData'

/**
 * Creates custom congestion badge DivIcon for bottleneck corridors
 */
function createCongestionBadgeIcon(edge, state) {
  const isSevere = state.level === 'severe'
  const isHeavy = state.level === 'heavy'
  const badgeColor = isSevere ? 'bg-rose-500 text-black' : isHeavy ? 'bg-orange-500 text-black' : 'bg-amber-500 text-black'

  const html = `
    <div class="relative flex items-center justify-center cursor-pointer">
      <div class="px-2 py-0.5 rounded-full ${badgeColor} font-mono font-extrabold text-[9px] shadow-lg flex items-center gap-1">
        <span>V/C ${state.vcRatio}</span>
      </div>
    </div>
  `

  return L.divIcon({
    className: 'congestion-badge-div',
    html,
    iconSize: [60, 20],
    iconAnchor: [30, 10],
  })
}

/**
 * Traffic Congestion Telemetry Layer
 * Visualizes bottleneck clusters and V/C ratios on congested corridors.
 */
export default function TrafficCongestionLayer({ showCongestion = true }) {
  if (!showCongestion) return null

  // Find congested road corridors (V/C >= 0.75 or speed < 30 km/h)
  const congestedCorridors = DEMO_EDGES.map((edge) => {
    const state = getEdgeCongestionState(edge)
    if (state.level === 'optimal') return null

    const latLngs = getEdgeLatLngs(edge)
    if (!latLngs) return null

    // Midpoint of the corridor for badge placement
    const [[lat1, lon1], [lat2, lon2]] = latLngs
    const midLat = (lat1 + lat2) / 2
    const midLon = (lon1 + lon2) / 2

    return {
      edge,
      state,
      lat: midLat,
      lon: midLon,
    }
  }).filter(Boolean)

  return (
    <>
      {congestedCorridors.map(({ edge, state, lat, lon }) => {
        const icon = createCongestionBadgeIcon(edge, state)

        return (
          <Marker key={`cong-${edge.id}`} position={[lat, lon]} icon={icon}>
            <Tooltip sticky>
              <div className="text-[10px] font-mono">
                <span className="font-bold text-rose-400">{edge.name}</span>
                <span className="text-slate-300 block">
                  Speed: {edge.currentSpeedKmh} km/h (Limit {edge.freeFlowSpeedKmh})
                </span>
                <span className="text-amber-300 block">
                  Capacity: {edge.currentVolumeVph} / {edge.capacityVph} vph (V/C {state.vcRatio})
                </span>
              </div>
            </Tooltip>
          </Marker>
        )
      })}
    </>
  )
}
