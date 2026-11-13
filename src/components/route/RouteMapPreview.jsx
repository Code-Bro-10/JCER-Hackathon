import React, { useMemo } from 'react'
import { TrafficMapContainer, RoutePolylinesLayer, RoadNetworkDigitalTwinLayer } from '../map'
import {
  calculateMultiModalRoutes,
  DEFAULT_MAP_CENTER,
  DEMO_NODES,
  getNodeLatLng,
} from '../../services/roadNetworkData'

/**
 * Interactive Route Map Preview for Route Planner Page
 *
 * Powered by React, Leaflet, React-Leaflet, and OpenStreetMap.
 * Renders multi-modal route polylines with distinct color themes:
 * - AI Smart Dynamic Route: Glowing Cyan (#06b6d4)
 * - Shortest Route: Red/Rose (#f43f5e)
 * - Eco-Green Corridor: Emerald (#10b981)
 *
 * @param {object} props
 * @param {object} props.route - Currently selected route
 * @param {string} props.origin - Origin location string
 * @param {string} props.destination - Destination location string
 * @param {function} [props.onSelectRoute] - Callback when an alternative route is clicked on the map
 */
export default function RouteMapPreview({
  route,
  origin,
  destination,
  onSelectRoute = () => {},
}) {
  // Resolve origin and destination nodes based on string names or fallback to INT-101 and INT-104
  const startNodeId = useMemo(() => {
    if (!origin) return 'INT-101'
    const q = origin.toLowerCase()
    const match = DEMO_NODES.find((n) => n.name.toLowerCase().includes(q) || n.sector.toLowerCase().includes(q))
    return match ? match.id : 'INT-101'
  }, [origin])

  const endNodeId = useMemo(() => {
    if (!destination) return 'INT-104'
    const q = destination.toLowerCase()
    const match = DEMO_NODES.find((n) => n.name.toLowerCase().includes(q) || n.sector.toLowerCase().includes(q))
    return match ? match.id : 'INT-104'
  }, [destination])

  // Calculate high-fidelity multi-modal routes on local graph
  const routePlan = useMemo(() => {
    return calculateMultiModalRoutes(startNodeId, endNodeId)
  }, [startNodeId, endNodeId])

  const originLatLng = getNodeLatLng(startNodeId)
  const destinationLatLng = getNodeLatLng(endNodeId)

  // Map center between origin and destination
  const mapCenter = useMemo(() => {
    if (originLatLng && destinationLatLng) {
      return [
        (originLatLng[0] + destinationLatLng[0]) / 2,
        (originLatLng[1] + destinationLatLng[1]) / 2,
      ]
    }
    return DEFAULT_MAP_CENTER
  }, [originLatLng, destinationLatLng])

  const selectedRouteId = route?.id || 'route-ai-smart'

  return (
    <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl flex flex-col">
      <TrafficMapContainer
        center={mapCenter}
        zoom={14}
        title="Dynamic Route Navigation Canvas"
        subtitle={`From: ${origin || 'Origin'} ➔ To: ${destination || 'Destination'}`}
        showLayerControls={false}
        height="440px"
        headerActions={
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-400">
              {route?.distanceKm || '15.6'} km • {route?.durationMin || '22'}m
            </span>
          </div>
        }
      >
        {/* Subtle background road network grid */}
        <RoadNetworkDigitalTwinLayer
          showSignals={false}
          showEdges={true}
        />

        {/* Multi-modal Route Polylines Layer */}
        <RoutePolylinesLayer
          routes={routePlan.routes}
          selectedRouteId={selectedRouteId}
          onSelectRoute={onSelectRoute}
          originLatLng={originLatLng}
          destinationLatLng={destinationLatLng}
          originName={origin || 'Origin Point'}
          destinationName={destination || 'Destination Point'}
        />
      </TrafficMapContainer>

      {/* Route Legend Bar */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 rounded-full bg-cyan-400" />
            <span className="text-slate-300">AI Smart (Cyan)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 rounded-full bg-rose-400" />
            <span className="text-slate-300">Shortest (Rose)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 rounded-full bg-emerald-400" />
            <span className="text-slate-300">Eco-Green (Emerald)</span>
          </div>
        </div>

        <span className="text-[11px] text-slate-400">
          Click any polyline on the map to switch alternative route
        </span>
      </div>
    </div>
  )
}
