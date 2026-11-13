import React, { useMemo } from 'react'
import { TrafficMapContainer, RoutePolylinesLayer, RoadNetworkDigitalTwinLayer } from '../map'
import {
  calculateMultiModalRoutes,
  DEFAULT_MAP_CENTER,
  BELAGAVI_NODES,
  BENGALURU_NODES,
  ALL_NODES,
  getNodeLatLng,
} from '../../services/roadNetworkData'

/**
 * Interactive Route Map Preview for Route Planner Page
 *
 * Powered by React, Leaflet, React-Leaflet, and OpenStreetMap.
 * Renders multi-modal route polylines:
 * - AI Smart Dynamic Route (#06b6d4 / #2563eb)
 * - Shortest Route (#f43f5e)
 * - Eco-Green Corridor (#10b981)
 */
export default function RouteMapPreview({
  route = null,
  routes = [],
  origin = '',
  destination = '',
  originCoord = null,
  destCoord = null,
  selectedRouteId = 'route-ai-smart',
  onSelectRoute = () => {},
  onMapClick = null,
}) {
  // If routes are passed from parent (e.g. OSRM results), format them for RoutePolylinesLayer
  const formattedRoutes = useMemo(() => {
    if (routes && routes.length > 0) {
      return routes.map((r) => ({
        ...r,
        latLngs: r.coordinates || r.latLngs || [],
        polyColor:
          r.id === 'route-ai-smart'
            ? '#06b6d4'
            : r.id === 'route-shortest'
            ? '#f43f5e'
            : '#10b981',
      }))
    }

    // Local fallback calculation based on Belagavi nodes (Chennamma Circle to JCER Campus)
    const startNode = BELAGAVI_NODES[0] || BENGALURU_NODES[0]
    const endNode = BELAGAVI_NODES[5] || BENGALURU_NODES[4]
    const plan = calculateMultiModalRoutes(startNode.id, endNode.id)
    return plan.routes || []
  }, [routes])

  const originLatLng = useMemo(() => {
    if (originCoord && originCoord.length === 2) return originCoord
    if (formattedRoutes[0]?.latLngs?.[0]) return formattedRoutes[0].latLngs[0]
    return [15.8596, 74.5098]
  }, [originCoord, formattedRoutes])

  const destinationLatLng = useMemo(() => {
    if (destCoord && destCoord.length === 2) return destCoord
    const active = formattedRoutes.find((r) => r.id === selectedRouteId) || formattedRoutes[0]
    if (active?.latLngs && active.latLngs.length > 0) {
      return active.latLngs[active.latLngs.length - 1]
    }
    return [15.8340, 74.5360]
  }, [destCoord, formattedRoutes, selectedRouteId])

  // Center between origin and destination
  const mapCenter = useMemo(() => {
    if (originLatLng && destinationLatLng) {
      return [
        (originLatLng[0] + destinationLatLng[0]) / 2,
        (originLatLng[1] + destinationLatLng[1]) / 2,
      ]
    }
    return DEFAULT_MAP_CENTER
  }, [originLatLng, destinationLatLng])

  return (
    <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl flex flex-col">
      <TrafficMapContainer
        center={mapCenter}
        zoom={13}
        title="Dynamic Route Navigation Canvas"
        subtitle={`From: ${origin || 'Origin'} ➔ To: ${destination || 'Destination'}`}
        showLayerControls={false}
        onMapClick={onMapClick}
        height="480px"
        headerActions={
          <div className="flex items-center gap-1.5 flex-wrap">
            {formattedRoutes.map((r) => {
              const isSelected = r.id === selectedRouteId
              const color =
                r.id === 'route-ai-smart'
                  ? 'border-cyan-500 text-cyan-300'
                  : r.id === 'route-shortest'
                  ? 'border-rose-500 text-rose-300'
                  : 'border-emerald-500 text-emerald-300'
              const activeBg =
                r.id === 'route-ai-smart'
                  ? 'bg-cyan-500/20 shadow-cyan-500/20'
                  : r.id === 'route-shortest'
                  ? 'bg-rose-500/20 shadow-rose-500/20'
                  : 'bg-emerald-500/20 shadow-emerald-500/20'
              const dotColor =
                r.id === 'route-ai-smart'
                  ? 'bg-cyan-400'
                  : r.id === 'route-shortest'
                  ? 'bg-rose-400'
                  : 'bg-emerald-400'

              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onSelectRoute(r.id)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? `${activeBg} ${color} shadow-md`
                      : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title={`Select ${r.title || r.name}`}
                >
                  <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                  <span>{r.badge || r.title?.split(' ')[0] || 'Path'}</span>
                  <span className="opacity-75">({r.durationMin}m)</span>
                </button>
              )
            })}
          </div>
        }
      >
        {/* Subtle background road network grid */}
        <RoadNetworkDigitalTwinLayer
          showSignals={true}
          showEdges={true}
        />

        {/* Multi-modal Route Polylines Layer */}
        <RoutePolylinesLayer
          routes={formattedRoutes}
          selectedRouteId={selectedRouteId}
          onSelectRoute={onSelectRoute}
          originLatLng={originLatLng}
          destinationLatLng={destinationLatLng}
          originName={origin || 'Origin'}
          destinationName={destination || 'Destination'}
        />
      </TrafficMapContainer>
    </div>
  )
}
