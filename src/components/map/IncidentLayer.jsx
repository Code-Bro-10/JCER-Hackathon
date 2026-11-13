import React from 'react'
import { Marker, Popup, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { ShieldAlert, AlertTriangle } from 'lucide-react'
import { DEMO_INCIDENTS, DEMO_NODES } from '../../services/roadNetworkData'

/**
 * Creates custom DivIcon for incident markers
 */
function createIncidentIcon(incident) {
  const isCritical = incident.severity === 'CRITICAL'
  const isHigh = incident.severity === 'HIGH'

  let bgColor = 'bg-amber-500'
  let borderColor = 'border-amber-400 text-amber-300'
  let pingClass = ''

  if (isCritical) {
    bgColor = 'bg-rose-600'
    borderColor = 'border-rose-400 text-rose-200 ring-2 ring-rose-500'
    pingClass = 'animate-ping bg-rose-500'
  } else if (isHigh) {
    bgColor = 'bg-orange-500'
    borderColor = 'border-orange-400 text-orange-200'
    pingClass = 'animate-pulse bg-orange-400'
  }

  const html = `
    <div class="relative flex items-center justify-center cursor-pointer group">
      ${pingClass ? `<span class="absolute inline-flex h-9 w-9 rounded-full opacity-60 ${pingClass}"></span>` : ''}
      <div class="relative flex items-center justify-center w-8 h-8 rounded-xl border-2 bg-slate-900 ${borderColor} shadow-xl shadow-black/80 transition-transform duration-200 group-hover:scale-125">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      </div>
      <div class="absolute -top-4 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded ${
        isCritical ? 'bg-rose-500 text-black font-extrabold' : 'bg-slate-900/95 border border-slate-700 text-white'
      } text-[9px] font-mono whitespace-nowrap shadow-md">
        ${incident.severity}
      </div>
    </div>
  `

  return L.divIcon({
    className: 'incident-marker-div',
    html,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  })
}

/**
 * Incident Layer for Leaflet Map
 *
 * @param {object} props
 * @param {Array} [props.incidents] - Incidents from context or mockData
 * @param {string} [props.activeSector='All Sectors'] - Filter by sector
 * @param {function} [props.onSelectIncident] - Callback when incident is clicked
 * @param {function} [props.onSimulateImpact] - Callback to simulate connected road impact
 */
export default function IncidentLayer({
  incidents = [],
  activeSector = 'All Sectors',
  onSelectIncident = () => {},
  onSimulateImpact = () => {},
}) {
  // Merge DEMO_INCIDENTS with live incidents from context if available
  const allIncidents = React.useMemo(() => {
    const list = incidents && incidents.length > 0 ? incidents : DEMO_INCIDENTS

    // Ensure every incident has valid lat/lon coordinates
    return list.map((inc, idx) => {
      let lat = inc.coordinates?.lat
      let lon = inc.coordinates?.lon

      // Fallback mapping if coordinates are { x, y } percentages
      if (!lat || !lon) {
        // Map to corresponding node or spread across downtown grid
        const fallbackNodes = DEMO_NODES
        const assignedNode = fallbackNodes[idx % fallbackNodes.length]
        lat = assignedNode.coordinates.lat + (Math.sin(idx) * 0.003)
        lon = assignedNode.coordinates.lon + (Math.cos(idx) * 0.003)
      }

      return {
        ...inc,
        lat,
        lon,
      }
    }).filter((inc) => {
      if (inc.status === 'Resolved') return false
      if (activeSector !== 'All Sectors' && inc.sector !== activeSector) return false
      return true
    })
  }, [incidents, activeSector])

  return (
    <>
      {allIncidents.map((incident) => {
        const icon = createIncidentIcon(incident)

        return (
          <Marker
            key={incident.id}
            position={[incident.lat, incident.lon]}
            icon={icon}
            eventHandlers={{
              click: () => onSelectIncident(incident),
            }}
          >
            <Popup className="traffic-map-popup">
              <div className="p-4 space-y-3 min-w-[280px]">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-800 pb-2.5 gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400 font-bold">
                      <span>{incident.id}</span>
                      <span>•</span>
                      <span>{incident.sector}</span>
                    </div>
                    <h4 className="text-xs font-bold text-white leading-snug mt-0.5">
                      {incident.title}
                    </h4>
                  </div>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded font-mono font-extrabold uppercase shrink-0 ${
                      incident.severity === 'CRITICAL'
                        ? 'bg-rose-500 text-black animate-pulse'
                        : incident.severity === 'HIGH'
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {incident.severity}
                  </span>
                </div>

                {/* Telemetry Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Lanes Blocked</span>
                    <span className="text-rose-400 font-bold">
                      {incident.lanesBlocked || 1} of {incident.totalLanes || 3} Lanes
                    </span>
                  </div>

                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Estimated Delay</span>
                    <span className="text-amber-400 font-bold">
                      +{incident.estimatedDelay || '15 mins'}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-300 bg-slate-900/50 p-2 rounded border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block mb-0.5">Location:</span>
                  {incident.location}
                </div>

                {/* Assigned Units */}
                {incident.assignedUnits && incident.assignedUnits.length > 0 && (
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                    <ShieldAlert className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Units Assigned:</span>
                    <span className="text-cyan-300 font-bold">
                      {incident.assignedUnits.join(', ')}
                    </span>
                  </div>
                )}

                {/* Simulate Impact Button */}
                <button
                  type="button"
                  onClick={() => onSimulateImpact(incident)}
                  className="w-full py-1.5 px-3 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500 hover:text-black font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Simulate Connected Road Impact</span>
                </button>
              </div>
            </Popup>

            <Tooltip sticky>
              <div className="text-[10px] font-mono">
                <span className="font-bold text-rose-400">{incident.id}</span>: {incident.title}
                <span className="text-slate-400 block">{incident.location}</span>
              </div>
            </Tooltip>
          </Marker>
        )
      })}
    </>
  )
}
