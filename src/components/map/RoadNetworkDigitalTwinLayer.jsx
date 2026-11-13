import React, { useMemo } from 'react'
import { Marker, Popup, Polyline, Tooltip, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import { Zap, AlertTriangle } from 'lucide-react'
import {
  DEMO_NODES,
  DEMO_EDGES,
  getEdgeLatLngs,
  getEdgeCongestionState,
} from '../../services/roadNetworkData'

/**
 * Creates custom Leaflet HTML DivIcon for Smart Intersections
 */
function createIntersectionIcon(node, isGreen, isSelected, isPreempted, isConflicting) {
  let ringColor = isGreen ? 'bg-emerald-500' : 'bg-amber-500'
  let borderColor = isGreen ? 'border-emerald-400 text-emerald-300' : 'border-amber-400 text-amber-300'
  let glowColor = isGreen ? 'shadow-emerald-500/40' : 'shadow-amber-500/40'

  if (isPreempted) {
    ringColor = 'bg-emerald-400 animate-ping'
    borderColor = 'border-emerald-300 text-white bg-emerald-600 ring-4 ring-emerald-400'
    glowColor = 'shadow-emerald-400/80'
  } else if (isConflicting) {
    ringColor = 'bg-rose-500'
    borderColor = 'border-rose-400 text-rose-300 bg-rose-950/90'
    glowColor = 'shadow-rose-500/50'
  }

  const html = `
    <div class="relative flex items-center justify-center cursor-pointer group">
      <span class="absolute inline-flex h-8 w-8 rounded-full opacity-60 ${ringColor}"></span>
      <div class="relative flex items-center justify-center w-7 h-7 rounded-full border-2 bg-slate-900 ${borderColor} shadow-lg ${glowColor} transition-transform duration-200 group-hover:scale-125 ${
    isSelected ? 'ring-4 ring-cyan-400 scale-125' : ''
  }">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
      </div>
      <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-700/80 text-[9px] font-mono font-bold text-slate-300 whitespace-nowrap pointer-events-none shadow-md">
        ${node.id}
      </div>
    </div>
  `

  return L.divIcon({
    className: 'intersection-marker-div',
    html,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  })
}

/**
 * Reusable Digital Twin Road Network Layer for TrafficAI
 *
 * @param {object} props
 * @param {Array} [props.intersections] - Live intersection data from TrafficContext
 * @param {string} [props.selectedNodeId] - Currently highlighted node
 * @param {function} [props.onSelectNode] - Callback when node is clicked
 * @param {function} [props.onSelectOrigin] - Callback to set origin
 * @param {function} [props.onSelectDestination] - Callback to set destination
 * @param {function} [props.onSimulateClosure] - Callback to trigger road closure simulator
 * @param {Array<string>} [props.closedEdgeIds=[]] - List of currently closed/blocked edge IDs
 * @param {Array<string>} [props.preemptedNodeIds=[]] - List of downstream emergency nodes locked to green
 * @param {Array<string>} [props.conflictingNodeIds=[]] - List of conflicting cross-street nodes locked to red
 * @param {number} [props.liveTick=0] - Ticking counter for moving vehicle platoons
 * @param {boolean} [props.showSignals=true] - Toggle intersection nodes
 * @param {boolean} [props.showEdges=true] - Toggle road segments
 */
export default function RoadNetworkDigitalTwinLayer({
  intersections = [],
  selectedNodeId = null,
  onSelectNode = () => {},
  onSelectOrigin = () => {},
  onSelectDestination = () => {},
  onSimulateClosure = () => {},
  closedEdgeIds = [],
  preemptedNodeIds = [],
  conflictingNodeIds = [],
  liveTick = 0,
  showSignals = true,
  showEdges = true,
}) {
  // Edge polylines with computed congestion and coordinates
  const renderedEdges = useMemo(() => {
    return DEMO_EDGES.map((edge) => {
      const latLngs = getEdgeLatLngs(edge)
      if (!latLngs) return null

      const isClosed = closedEdgeIds.includes(edge.id) || edge.isClosed
      const congestion = getEdgeCongestionState({ ...edge, isClosed })
      const strokeWidth = Math.max(4, (edge.lanes || 3) * 1.8)

      return {
        ...edge,
        latLngs,
        isClosed,
        congestion,
        strokeWidth,
      }
    }).filter(Boolean)
  }, [closedEdgeIds])

  // Calculate simulated vehicle platoon positions along key corridors
  const simulatedVehicles = useMemo(() => {
    const keyCorridors = [
      { edgeId: 'EDGE-101-106', color: '#34d399', speed: 0.15 },
      { edgeId: 'EDGE-106-103', color: '#f87171', speed: 0.08 },
      { edgeId: 'EDGE-103-102', color: '#38bdf8', speed: 0.18 },
      { edgeId: 'EDGE-102-104', color: '#34d399', speed: 0.2 },
      { edgeId: 'EDGE-105-101', color: '#38bdf8', speed: 0.14 },
      { edgeId: 'EDGE-101-109', color: '#818cf8', speed: 0.22 },
    ]

    return keyCorridors.map((c) => {
      const edge = DEMO_EDGES.find((e) => e.id === c.edgeId)
      if (!edge) return null
      const latLngs = getEdgeLatLngs(edge)
      if (!latLngs) return null

      const [[lat1, lon1], [lat2, lon2]] = latLngs
      const progress = ((liveTick * c.speed) % 1)
      const currentLat = lat1 + (lat2 - lat1) * progress
      const currentLon = lon1 + (lon2 - lon1) * progress

      return {
        id: `platoon-${c.edgeId}`,
        lat: currentLat,
        lon: currentLon,
        color: c.color,
        name: edge.name,
      }
    }).filter(Boolean)
  }, [liveTick])

  return (
    <>
      {/* 1. Road Edges (Polylines) */}
      {showEdges &&
        renderedEdges.map((edge) => {
          return (
            <React.Fragment key={edge.id}>
              {/* Outer Glow / Base Line */}
              <Polyline
                positions={edge.latLngs}
                pathOptions={{
                  color: edge.isClosed ? '#f43f5e' : edge.congestion.color,
                  weight: edge.strokeWidth + 3,
                  opacity: edge.isClosed ? 0.9 : 0.35,
                  dashArray: edge.isClosed ? '6, 6' : undefined,
                  className: edge.isClosed ? 'road-hazard-stripes' : undefined,
                }}
              />

              {/* Core Active Center Line */}
              <Polyline
                positions={edge.latLngs}
                pathOptions={{
                  color: edge.isClosed ? '#ffffff' : edge.congestion.color,
                  weight: Math.max(2, edge.strokeWidth - 1),
                  opacity: 0.95,
                  dashArray: edge.isClosed ? '4, 4' : undefined,
                }}
              >
                <Popup className="traffic-map-popup">
                  <div className="p-3.5 space-y-2.5 min-w-[240px]">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div>
                        <div className="text-[10px] font-mono text-cyan-400 font-bold">{edge.id}</div>
                        <h4 className="text-xs font-bold text-white leading-tight">{edge.name}</h4>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                          edge.isClosed
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : edge.congestion.level === 'optimal'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : edge.congestion.level === 'moderate'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {edge.congestion.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Current Speed</span>
                        <span className="text-cyan-300 font-bold">
                          {edge.isClosed ? '0 km/h' : `${edge.currentSpeedKmh || 40} km/h`}
                        </span>
                        <span className="text-[9px] text-slate-500 block">
                          Limit: {edge.freeFlowSpeedKmh} km/h
                        </span>
                      </div>

                      <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Flow / Capacity</span>
                        <span className="text-white font-bold">
                          {edge.currentVolumeVph || 1500}{' '}
                          <span className="text-slate-500 text-[9px]">/ {edge.capacityVph || 2500} vph</span>
                        </span>
                        <span className="text-[9px] text-amber-400 block">
                          V/C: {edge.congestion.vcRatio}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Lanes: {edge.lanes} lanes</span>
                      <span className="capitalize">{edge.roadClass}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSimulateClosure(edge.id)}
                      className="w-full mt-2 py-1.5 px-3 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 hover:bg-rose-500 hover:text-black font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{edge.isClosed ? 'Configure Closure / Impact' : 'Simulate Accident / Closure'}</span>
                    </button>
                  </div>
                </Popup>

                <Tooltip sticky>
                  <div className="text-[10px] font-mono">
                    <span className="font-bold text-cyan-300">{edge.name}</span>
                    <span className="text-slate-400 block">
                      {edge.isClosed
                        ? 'ROADWAY BLOCKED'
                        : `${edge.currentSpeedKmh || 40} km/h • V/C ${edge.congestion.vcRatio}`}
                    </span>
                  </div>
                </Tooltip>
              </Polyline>
            </React.Fragment>
          )
        })}

      {/* 2. Simulated Moving Traffic Platoons */}
      {showEdges &&
        simulatedVehicles.map((veh) => (
          <CircleMarker
            key={veh.id}
            center={[veh.lat, veh.lon]}
            radius={4}
            pathOptions={{
              color: veh.color,
              fillColor: '#ffffff',
              fillOpacity: 0.9,
              weight: 2,
            }}
          />
        ))}

      {/* 3. Smart Intersection Nodes */}
      {showSignals &&
        DEMO_NODES.map((node) => {
          const liveData = intersections.find((i) => i.id === node.id)
          const isGreen = liveData ? liveData.currentPhase.includes('Green') : true
          const isSelected = selectedNodeId === node.id
          const isPreempted = preemptedNodeIds.includes(node.id)
          const isConflicting = conflictingNodeIds.includes(node.id)

          const icon = createIntersectionIcon(node, isGreen, isSelected, isPreempted, isConflicting)

          return (
            <Marker
              key={node.id}
              position={[node.coordinates.lat, node.coordinates.lon]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectNode(node.id),
              }}
            >
              <Popup className="traffic-map-popup">
                <div className="p-3.5 space-y-2.5 min-w-[260px]">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div>
                      <div className="text-[10px] font-mono text-cyan-400 font-bold">{node.id}</div>
                      <h4 className="text-xs font-bold text-white">{node.name}</h4>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {node.sector}
                    </span>
                  </div>

                  {/* Signal State */}
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-cyan-400" />
                        Signal Phase:
                      </span>
                      <span
                        className={`font-bold ${
                          isPreempted
                            ? 'text-emerald-400 animate-pulse'
                            : isConflicting
                            ? 'text-rose-400'
                            : isGreen
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {isPreempted
                          ? 'EMERGENCY PREEMPT GREEN'
                          : isConflicting
                          ? 'CROSS TRAFFIC LOCKED RED'
                          : liveData?.currentPhase || 'North-South Green'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-1">
                      <span>Seconds Remaining:</span>
                      <span className="text-white font-bold">
                        {isPreempted ? 'LOCK (90s)' : `${liveData?.secondsRemaining || 24}s`}
                      </span>
                    </div>
                  </div>

                  {/* Queue Counts N/S/E/W */}
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block mb-1">
                      Approach Queues (Vehicles)
                    </span>
                    <div className="grid grid-cols-4 gap-1 text-center font-mono text-xs">
                      <div className="bg-slate-900 p-1 rounded border border-slate-800">
                        <span className="text-[9px] text-slate-500 block">N</span>
                        <span className="font-bold text-white">{node.queues?.north || 12}</span>
                      </div>
                      <div className="bg-slate-900 p-1 rounded border border-slate-800">
                        <span className="text-[9px] text-slate-500 block">S</span>
                        <span className="font-bold text-white">{node.queues?.south || 9}</span>
                      </div>
                      <div className="bg-slate-900 p-1 rounded border border-slate-800">
                        <span className="text-[9px] text-slate-500 block">E</span>
                        <span className="font-bold text-white">{node.queues?.east || 18}</span>
                      </div>
                      <div className="bg-slate-900 p-1 rounded border border-slate-800">
                        <span className="text-[9px] text-slate-500 block">W</span>
                        <span className="font-bold text-white">{node.queues?.west || 15}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Route Origin / Destination Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => onSelectOrigin(node.id)}
                      className="py-1 px-2 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500 hover:text-black font-semibold text-[11px] transition-all cursor-pointer text-center"
                    >
                      Set as Source
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectDestination(node.id)}
                      className="py-1 px-2 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500 hover:text-black font-semibold text-[11px] transition-all cursor-pointer text-center"
                    >
                      Set as Destination
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
    </>
  )
}
