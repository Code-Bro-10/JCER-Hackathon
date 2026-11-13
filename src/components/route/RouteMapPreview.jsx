import React from 'react'
import { MapPin, Navigation, Compass, AlertTriangle, ShieldCheck } from 'lucide-react'

export default function RouteMapPreview({ route, origin, destination }) {
  if (!route) return null

  const isAiSmart = route.id === 'route-ai-smart'
  const isShortest = route.id === 'route-shortest'

  return (
    <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-5 overflow-hidden shadow-2xl flex flex-col justify-between h-[360px] sm:h-[420px]">
      {/* Background Matrix Grid */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #06b6d4 1px, transparent 1px), linear-gradient(to bottom, #06b6d4 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      {/* Top Overlay Badge */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Corridor Vector Visualization
            </h4>
            <p className="text-[10px] text-slate-400">
              Active Path: <span className="text-cyan-300 font-semibold">{route.title}</span>
            </p>
          </div>
        </div>

        <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-400">
          {route.distanceKm} km • {route.durationMin}m
        </div>
      </div>

      {/* Graphic Route SVG Vector */}
      <div className="relative z-10 my-auto w-full h-44">
        <svg className="w-full h-full" viewBox="0 0 600 220" preserveAspectRatio="none">
          <defs>
            <linearGradient id="routeGradientSmart" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <linearGradient id="routeGradientShort" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="40%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
            <linearGradient id="routeGradientEco" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>

          {/* Background grid roads */}
          <path d="M 50,50 L 550,50" stroke="#1e293b" strokeWidth="4" />
          <path d="M 50,110 L 550,110" stroke="#1e293b" strokeWidth="8" />
          <path d="M 50,170 L 550,170" stroke="#1e293b" strokeWidth="4" />
          <path d="M 120,20 L 120,200" stroke="#1e293b" strokeWidth="6" />
          <path d="M 300,20 L 300,200" stroke="#1e293b" strokeWidth="8" />
          <path d="M 480,20 L 480,200" stroke="#1e293b" strokeWidth="6" />

          {/* Active Route Path according to chosen route */}
          {isAiSmart ? (
            /* AI Smart curves smoothly away from central jam (around y=50) */
            <path
              d="M 60,110 Q 180,40 300,50 T 540,110"
              fill="none"
              stroke="url(#routeGradientSmart)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="6 3"
              className="animate-pulse"
            />
          ) : isShortest ? (
            /* Shortest plunges directly through central Market St collision */
            <path
              d="M 60,110 L 540,110"
              fill="none"
              stroke="url(#routeGradientShort)"
              strokeWidth="6"
              strokeLinecap="round"
            />
          ) : (
            /* Eco takes perimeter highway */
            <path
              d="M 60,110 Q 180,180 300,170 T 540,110"
              fill="none"
              stroke="url(#routeGradientEco)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="8 4"
            />
          )}

          {/* Choke Point Marker at (300, 110) */}
          <circle cx="300" cy="110" r="14" fill="#f43f5e" opacity="0.3" className="animate-ping" />
          <circle cx="300" cy="110" r="8" fill="#f43f5e" />

          {/* Origin Pin at (60, 110) */}
          <circle cx="60" cy="110" r="10" fill="#06b6d4" opacity="0.3" className="animate-ping" />
          <circle cx="60" cy="110" r="6" fill="#06b6d4" />

          {/* Destination Pin at (540, 110) */}
          <circle cx="540" cy="110" r="10" fill="#10b981" opacity="0.3" className="animate-ping" />
          <circle cx="540" cy="110" r="6" fill="#10b981" />
        </svg>

        {/* Labels over the pins */}
        <div className="absolute top-[35%] left-2 transform -translate-y-full text-[11px] font-mono text-cyan-400 bg-slate-900/90 px-2 py-0.5 rounded border border-cyan-500/30">
          ORIGIN: {origin.split(' ')[0]}
        </div>

        <div className="absolute top-[35%] right-2 transform -translate-y-full text-[11px] font-mono text-emerald-400 bg-slate-900/90 px-2 py-0.5 rounded border border-emerald-500/30">
          DEST: {destination.split(' ')[0]}
        </div>

        <div className="absolute top-[48%] left-1/2 transform -translate-x-1/2 -translate-y-full text-[10px] font-mono text-rose-300 bg-rose-950/90 px-2 py-0.5 rounded border border-rose-500">
          COLLISION BOTTLENECK (Market St)
        </div>
      </div>

      {/* Bottom Summary Footer */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80 text-xs">
        <div className="flex items-center gap-2">
          {isAiSmart ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              Dynamic Signal Coordination Active: 94% Green progression along route
            </span>
          ) : isShortest ? (
            <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
              <AlertTriangle className="w-4 h-4" />
              Alert: Passes directly through 2-lane collision scene (+25 min delay)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              Smooth continuous speed profile with minimal stops
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

