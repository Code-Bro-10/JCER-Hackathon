import React from 'react'
import { Marker, Polyline, Tooltip, CircleMarker } from 'react-leaflet'
import L from 'leaflet'

/**
 * Creates custom pin icon for Source and Destination
 */
function createEndpointIcon(type, title) {
  const isOrigin = type === 'origin'
  const colorBg = isOrigin ? 'bg-cyan-500' : 'bg-emerald-500'
  const textColor = isOrigin ? 'text-cyan-300' : 'text-emerald-300'
  const pingColor = isOrigin ? 'bg-cyan-400' : 'bg-emerald-400'

  const html = `
    <div class="relative flex items-center justify-center cursor-pointer group">
      <span class="animate-ping absolute inline-flex h-9 w-9 rounded-full opacity-60 ${pingColor}"></span>
      <div class="relative flex items-center justify-center w-8 h-8 rounded-full border-2 border-white bg-slate-900 shadow-xl ${
        isOrigin ? 'shadow-cyan-500/50 text-cyan-400' : 'shadow-emerald-500/50 text-emerald-400'
      }">
        ${
          isOrigin
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>`
        }
      </div>
      <div class="absolute -top-5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[9px] font-mono font-bold ${textColor} whitespace-nowrap shadow-lg">
        ${isOrigin ? 'SOURCE' : 'DESTINATION'}
      </div>
    </div>
  `

  return L.divIcon({
    className: 'endpoint-pin-div',
    html,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  })
}

/**
 * Reusable Route Polylines and Multi-Route Visualizer Layer
 *
 * @param {object} props
 * @param {Array} props.routes - List of computed route objects
 * @param {string} props.selectedRouteId - Currently active route ID
 * @param {function} props.onSelectRoute - Callback when a route line is clicked
 * @param {[number, number]} [props.originLatLng] - LatLng of origin
 * @param {[number, number]} [props.destinationLatLng] - LatLng of destination
 * @param {string} [props.originName] - Display name for origin
 * @param {string} [props.destinationName] - Display name for destination
 */
export default function RoutePolylinesLayer({
  routes = [],
  selectedRouteId = '',
  onSelectRoute = () => {},
  originLatLng = null,
  destinationLatLng = null,
  originName = 'Origin',
  destinationName = 'Destination',
}) {
  if (!routes || routes.length === 0) return null

  // Sort routes so the non-selected routes render first and the selected route renders on top
  const sortedRoutes = [...routes].sort((a, b) => {
    if (a.id === selectedRouteId) return 1
    if (b.id === selectedRouteId) return -1
    return 0
  })

  const originIcon = createEndpointIcon('origin', originName)
  const destinationIcon = createEndpointIcon('destination', destinationName)

  return (
    <>
      {/* 1. Multi-Route Polylines */}
      {sortedRoutes.map((route) => {
        const isSelected = route.id === selectedRouteId
        const polyColor = route.polyColor || '#06b6d4'
        const latLngs = route.latLngs || []

        if (latLngs.length < 2) return null

        return (
          <React.Fragment key={route.id}>
            {/* Outer Glow for Selected Route */}
            {isSelected && (
              <Polyline
                positions={latLngs}
                pathOptions={{
                  color: polyColor,
                  weight: 12,
                  opacity: 0.35,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            )}

            {/* Core Route Line */}
            <Polyline
              positions={latLngs}
              pathOptions={{
                color: polyColor,
                weight: isSelected ? 8 : 5.5,
                opacity: isSelected ? 1.0 : 0.85,
                lineCap: 'round',
                lineJoin: 'round',
              }}
              eventHandlers={{
                click: () => onSelectRoute(route.id),
              }}
            >
              <Tooltip sticky>
                <div className="text-xs font-mono p-1">
                  <div className="font-bold flex items-center gap-1.5" style={{ color: polyColor }}>
                    <span>{route.title}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-white border border-slate-700">
                      {route.badge}
                    </span>
                  </div>
                  <div className="text-slate-300 text-[11px] mt-0.5">
                    {route.distanceKm} km • ~{route.durationMin} mins
                    {route.delayMin > 0 && (
                      <span className="text-rose-400 font-bold ml-1">
                        (+{route.delayMin}m delay)
                      </span>
                    )}
                  </div>
                  {!isSelected && (
                    <div className="text-[10px] text-cyan-300 mt-1 underline">
                      Click to activate this alternative route
                    </div>
                  )}
                </div>
              </Tooltip>
            </Polyline>

            {/* Midpoint Interactive Duration Pill on the Map */}
            {latLngs.length > 2 && (
              <Marker
                position={latLngs[Math.floor(latLngs.length / 2)]}
                icon={L.divIcon({
                  className: 'route-duration-pill',
                  html: `
                    <div class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold text-white shadow-xl border border-white/60 cursor-pointer flex items-center gap-1 transition-transform hover:scale-110 ${
                      isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-950 scale-105' : 'opacity-90'
                    }" style="background-color: ${polyColor}; box-shadow: 0 4px 14px rgba(0,0,0,0.8);">
                      <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
                      <span>${route.durationMin}m</span>
                    </div>
                  `,
                  iconSize: [64, 24],
                  iconAnchor: [32, 12],
                })}
                eventHandlers={{
                  click: () => onSelectRoute(route.id),
                }}
              />
            )}

            {/* Turn Waypoint Dots for Selected Route */}
            {isSelected &&
              latLngs.slice(1, -1).map((pt, idx) => (
                <CircleMarker
                  key={`waypoint-${route.id}-${idx}`}
                  center={pt}
                  radius={4}
                  pathOptions={{
                    color: '#ffffff',
                    fillColor: polyColor,
                    fillOpacity: 1,
                    weight: 2,
                  }}
                >
                  <Tooltip>
                    <span className="text-[10px] font-mono">
                      Step {idx + 1}: Intermediary Node
                    </span>
                  </Tooltip>
                </CircleMarker>
              ))}
          </React.Fragment>
        )
      })}

      {/* 2. Source / Origin Pin */}
      {originLatLng && (
        <Marker position={originLatLng} icon={originIcon}>
          <Tooltip permanent direction="top" offset={[0, -20]}>
            <span className="text-[10px] font-mono font-bold text-cyan-300">
              ORIGIN: {originName}
            </span>
          </Tooltip>
        </Marker>
      )}

      {/* 3. Destination Pin */}
      {destinationLatLng && (
        <Marker position={destinationLatLng} icon={destinationIcon}>
          <Tooltip permanent direction="top" offset={[0, -20]}>
            <span className="text-[10px] font-mono font-bold text-emerald-300">
              DESTINATION: {destinationName}
            </span>
          </Tooltip>
        </Marker>
      )}
    </>
  )
}
