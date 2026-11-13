import React, { useMemo, useEffect, useState } from 'react'
import { Marker, Polyline, Tooltip, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import { Siren } from 'lucide-react'

/**
 * Custom DivIcon for the moving Emergency Response Vehicle with strobe siren
 */
function createEmergencyVehicleIcon(unit) {
  const isFire = unit?.icon === 'flame'
  const isPolice = unit?.icon === 'shield'
  const strobeBorder = isFire ? 'border-amber-400' : isPolice ? 'border-blue-400' : 'border-rose-400'

  const html = `
    <div class="relative flex items-center justify-center cursor-pointer group">
      <div class="absolute inline-flex h-12 w-12 rounded-full animate-siren-strobe opacity-75"></div>
      <div class="relative flex items-center justify-center w-9 h-9 rounded-xl border-2 ${strobeBorder} bg-slate-950 shadow-2xl shadow-rose-950 text-white font-extrabold">
        ${
          isFire
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>`
            : isPolice
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>`
        }
      </div>
      <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-rose-950 border border-rose-500/80 text-[9px] font-mono font-extrabold text-rose-200 whitespace-nowrap shadow-xl">
        ${unit?.callsign || 'PRIORITY'}
      </div>
    </div>
  `

  return L.divIcon({
    className: 'emergency-vehicle-div',
    html,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  })
}

/**
 * Emergency Corridor Leaflet Layer
 * Renders the glowing green corridor, locked signal nodes, and animated strobe emergency vehicle.
 */
export default function EmergencyCorridorLayer({
  corridorData = null,
  isPreemptionActive = true,
  liveTick = 0,
}) {
  const [progressStep, setProgressStep] = useState(0)

  useEffect(() => {
    if (!corridorData || !corridorData.latLngs || corridorData.latLngs.length < 2) return

    const interval = setInterval(() => {
      setProgressStep((prev) => (prev + 0.04) % 1)
    }, 120)

    return () => clearInterval(interval)
  }, [corridorData])

  // Interpolated position of the vehicle
  const currentVehiclePosition = useMemo(() => {
    if (!corridorData || !corridorData.latLngs || corridorData.latLngs.length < 2) return null
    const pts = corridorData.latLngs
    const totalSegments = pts.length - 1
    const scaled = progressStep * totalSegments
    const segIndex = Math.min(Math.floor(scaled), totalSegments - 1)
    const segProgress = scaled - segIndex

    const [lat1, lon1] = pts[segIndex]
    const [lat2, lon2] = pts[segIndex + 1]

    return [lat1 + (lat2 - lat1) * segProgress, lon1 + (lon2 - lon1) * segProgress]
  }, [corridorData, progressStep])

  const vehicleIcon = useMemo(() => {
    return corridorData?.unit ? createEmergencyVehicleIcon(corridorData.unit) : null
  }, [corridorData?.unit])

  if (!corridorData || !corridorData.success || !corridorData.latLngs) return null

  return (
    <>
      {/* Outer Glowing Green Wave Line */}
      <Polyline
        positions={corridorData.latLngs}
        pathOptions={{
          color: isPreemptionActive ? '#10b981' : '#f43f5e',
          weight: 14,
          opacity: 0.4,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />

      {/* Core Active Corridor Line */}
      <Polyline
        positions={corridorData.latLngs}
        pathOptions={{
          color: isPreemptionActive ? '#34d399' : '#f43f5e',
          weight: 6,
          opacity: 1.0,
          dashArray: isPreemptionActive ? '8, 4' : undefined,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      >
        <Tooltip sticky>
          <div className="text-xs font-mono p-1">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <Siren className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>EMERGENCY GREEN CORRIDOR</span>
            </div>
            <div className="text-slate-300 text-[11px] mt-0.5">
              {corridorData.distanceKm} km • Preempted ETA: {corridorData.emergencyEtaMinutes} min
            </div>
            <div className="text-emerald-300 text-[10px] mt-0.5">
              Downstream Signals: 100% Locked Green ({corridorData.signalsPreemptedCount} Nodes)
            </div>
          </div>
        </Tooltip>
      </Polyline>

      {/* Waypoint Signal Circles along the path */}
      {corridorData.latLngs.map((pt, idx) => (
        <CircleMarker
          key={`corridor-pt-${idx}`}
          center={pt}
          radius={isPreemptionActive ? 6 : 4}
          pathOptions={{
            color: isPreemptionActive ? '#34d399' : '#f43f5e',
            fillColor: isPreemptionActive ? '#10b981' : '#f43f5e',
            fillOpacity: 0.9,
            weight: 2,
          }}
        />
      ))}

      {/* Moving Emergency Vehicle with Strobe Siren */}
      {currentVehiclePosition && vehicleIcon && (
        <Marker position={currentVehiclePosition} icon={vehicleIcon}>
          <Tooltip permanent direction="top" offset={[0, -22]}>
            <div className="text-[10px] font-mono font-bold text-rose-300">
              {corridorData.unit?.code || 'PRIORITY'} • Active
            </div>
          </Tooltip>
        </Marker>
      )}
    </>
  )
}

