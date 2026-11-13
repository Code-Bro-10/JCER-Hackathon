import React, { useState } from 'react'
import { Marker, Popup, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { Camera, Video, Shield, AlertTriangle, ArrowRight, Activity, Car, Sliders } from 'lucide-react'
import { CCTV_FEEDS } from '../../services/mockData'
import { useTraffic } from '../../context/TrafficContext'

/**
 * Creates custom DivIcon for surveillance camera markers
 */
function createCameraIcon(camera) {
  const isWebcam = camera.sourceType === 'webcam' || camera.isLocalWebcam
  const isDemo = camera.sourceType === 'demo_video'
  const isRTSP = camera.sourceType === 'rtsp'
  const isOnline = camera.status === 'ONLINE'

  let badgeColor = 'bg-blue-600 text-white'
  let borderColor = 'border-blue-400'
  let iconColor = 'text-blue-300'

  if (isWebcam) {
    badgeColor = 'bg-rose-600 text-white'
    borderColor = 'border-rose-400'
    iconColor = 'text-rose-300'
  } else if (isDemo) {
    badgeColor = 'bg-emerald-600 text-white'
    borderColor = 'border-emerald-400'
    iconColor = 'text-emerald-300'
  } else if (isRTSP) {
    badgeColor = 'bg-amber-600 text-white'
    borderColor = 'border-amber-400'
    iconColor = 'text-amber-300'
  }

  const html = `
    <div class="relative flex items-center justify-center cursor-pointer group">
      <div class="relative flex items-center justify-center w-8 h-8 rounded-xl border-2 bg-slate-950 ${borderColor} shadow-xl shadow-black/80 transition-transform duration-200 group-hover:scale-125">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="${iconColor}">
          <path d="d 14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
          <circle cx="12" cy="13" r="3"/>
        </svg>
        <span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-rose-500'} border border-slate-950"></span>
      </div>
      <div class="absolute -top-4 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded ${badgeColor} text-[8px] font-mono whitespace-nowrap shadow-md uppercase font-bold">
        ${isWebcam ? 'WEBCAM' : isDemo ? 'DEMO' : isRTSP ? 'RTSP' : 'CCTV'}
      </div>
    </div>
  `

  return L.divIcon({
    className: 'camera-marker-div',
    html,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  })
}

/**
 * Calculates straight-line distance in km between two lat/lng coordinates (Haversine formula)
 */
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export default function CameraLayer({
  cameras = CCTV_FEEDS,
  showCameras = true,
  onSelectCamera = null,
}) {
  const { incidents, setCurrentPage } = useTraffic()

  if (!showCameras || !cameras || cameras.length === 0) return null

  return (
    <>
      {cameras.map((cam) => {
        if (!cam.latitude || !cam.longitude) return null

        // Find nearby incidents within 2.5 km
        const nearbyIncidents = (incidents || []).filter((inc) => {
          if (!inc.latitude || !inc.longitude) return false
          const dist = getDistanceKm(cam.latitude, cam.longitude, inc.latitude, inc.longitude)
          return dist <= 2.5
        })

        return (
          <Marker
            key={cam.id}
            position={[cam.latitude, cam.longitude]}
            icon={createCameraIcon(cam)}
          >
            <Tooltip direction="top" offset={[0, -18]} opacity={0.95}>
              <div className="font-sans text-[11px] font-bold text-slate-100 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {cam.name.split(' - ')[0]}
              </div>
            </Tooltip>

            <Popup className="trafficai-custom-popup" maxWidth={320}>
              <div className="space-y-2.5 font-sans text-xs p-1">
                {/* Header */}
                <div className="border-b border-slate-700 pb-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white text-sm truncate">{cam.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold uppercase">
                      {cam.sourceType || 'CCTV'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <span>{cam.location || cam.sector}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold">{cam.status || 'ONLINE'}</span>
                  </div>
                </div>

                {/* Video / Snapshot Preview */}
                <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-slate-700 flex items-center justify-center">
                  {cam.snapshotUrl ? (
                    <img
                      src={cam.snapshotUrl}
                      alt={cam.name}
                      className="w-full h-full object-cover"
                    />
                  ) : cam.streamUrl && cam.streamUrl.endsWith('.mp4') ? (
                    <video
                      src={cam.streamUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <Camera className="w-4 h-4 text-cyan-400" />
                      Optical Sensor Stream
                    </div>
                  )}

                  {/* Top-left REC tag */}
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[8px] font-mono text-white flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                    <span>LIVE</span>
                  </div>
                </div>

                {/* AI Detected Objects breakdown */}
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 grid grid-cols-3 gap-1 text-center font-mono text-[10px]">
                  <div>
                    <span className="text-slate-500 block">Cars</span>
                    <span className="text-white font-bold text-xs">{cam.detectedObjects?.cars || 18}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Buses</span>
                    <span className="text-cyan-400 font-bold text-xs">{cam.detectedObjects?.buses || 2}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Queue</span>
                    <span className="text-amber-400 font-bold text-xs">{cam.queueLengthMeters || 20}m</span>
                  </div>
                </div>

                {/* Nearby Reported Incidents Section */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    Nearby Incidents ({nearbyIncidents.length})
                  </span>
                  {nearbyIncidents.length > 0 ? (
                    <div className="space-y-1 max-h-20 overflow-y-auto">
                      {nearbyIncidents.slice(0, 2).map((inc) => (
                        <div
                          key={inc.id}
                          className="p-1 rounded bg-slate-900/90 border border-slate-800 text-[10px] text-slate-300 flex items-center justify-between"
                        >
                          <span className="truncate">{inc.title || inc.type}</span>
                          <span className="text-rose-400 font-mono font-bold ml-1">{inc.severity}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-500 italic">No incidents within 2.5km</div>
                  )}
                </div>

                {/* Attribution & Inspect CTA */}
                <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[9px] text-slate-400 truncate max-w-[150px]">
                    {cam.attribution || 'Belagavi Mobility'}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectCamera) {
                        onSelectCamera(cam)
                      } else {
                        setCurrentPage('camera-intelligence')
                      }
                    }}
                    className="px-2 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Vision AI</span>
                    <ArrowRight className="w-2.5 h-2.5" />
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

