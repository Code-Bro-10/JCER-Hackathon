import React from 'react'
import { Siren, Shield, Zap, AlertTriangle, Radio } from 'lucide-react'
import { useTraffic } from '../../context/TrafficContext'

export default function EmergencyMapView() {
  const { emergencyDispatches, liveSimulationTick } = useTraffic()

  const activeDispatch = emergencyDispatches[0] || null

  return (
    <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-5 overflow-hidden shadow-2xl flex flex-col justify-between h-[360px] sm:h-[400px]">
      {/* Background Matrix Grid */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #f43f5e 1px, transparent 1px), linear-gradient(to bottom, #f43f5e 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Top Overlay */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Emergency Corridor Preemption Visualizer
            </h4>
            <p className="text-[10px] text-slate-400">
              Active Target: <span className="text-rose-400 font-mono font-bold">{activeDispatch?.unitCode || 'STANDBY'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            DOWNSTREAM SIGNALS LOCKED: GREEN
          </span>
        </div>
      </div>

      {/* Visual Corridor Vector */}
      <div className="relative z-10 my-auto w-full h-44">
        <svg className="w-full h-full" viewBox="0 0 640 180" preserveAspectRatio="none">
          <defs>
            <linearGradient id="corridorGreenWave" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
            <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Cross streets (Blocked by RED) */}
          <line x1="160" y1="20" x2="160" y2="160" stroke="#7f1d1d" strokeWidth="10" strokeDasharray="4 4" />
          <line x1="320" y1="20" x2="320" y2="160" stroke="#7f1d1d" strokeWidth="10" strokeDasharray="4 4" />
          <line x1="480" y1="20" x2="480" y2="160" stroke="#7f1d1d" strokeWidth="10" strokeDasharray="4 4" />

          {/* Main Emergency Corridor (100% Green Priority) */}
          <line x1="40" y1="90" x2="600" y2="90" stroke="#1e293b" strokeWidth="24" strokeLinecap="round" />
          <line
            x1="40"
            y1="90"
            x2="600"
            y2="90"
            stroke="url(#corridorGreenWave)"
            strokeWidth="8"
            strokeLinecap="round"
            filter="url(#glowGreen)"
          />

          {/* Intersections Signal Lights */}
          {[160, 320, 480].map((x, i) => (
            <g key={i}>
              {/* Green for main road */}
              <circle cx={x} cy="90" r="10" fill="#10b981" filter="url(#glowGreen)" />
              <circle cx={x} cy="90" r="5" fill="#ffffff" />
              {/* Red for cross streets */}
              <circle cx={x} cy="50" r="5" fill="#ef4444" />
              <circle cx={x} cy="130" r="5" fill="#ef4444" />
            </g>
          ))}

          {/* Moving Ambulance with Flashing Siren */}
          <g transform={`translate(${80 + ((liveSimulationTick * 32) % 480)}, 90)`}>
            <circle cx="0" cy="0" r="16" fill="#f43f5e" opacity="0.4" className="animate-ping" />
            <rect x="-18" y="-10" width="36" height="20" rx="4" fill="#ffffff" stroke="#ef4444" strokeWidth="2" />
            <circle cx="0" cy="-6" r="4" fill="#ef4444" className="animate-pulse" />
          </g>
        </svg>

        {/* Labels over the corridor */}
        <div className="absolute top-2 left-6 text-[10px] font-mono text-cyan-400 bg-slate-900/90 px-2 py-0.5 rounded border border-cyan-500/30">
          DISPATCH ORIGIN (STATION #4)
        </div>
        <div className="absolute top-2 right-6 text-[10px] font-mono text-emerald-400 bg-slate-900/90 px-2 py-0.5 rounded border border-emerald-500/30">
          TRAUMA CENTER BAY
        </div>
      </div>

      {/* Bottom Status strip */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80 text-xs">
        <div className="flex items-center gap-2 text-rose-300 font-mono">
          <Siren className="w-4 h-4 text-rose-400" />
          <span>AUDIO & VISUAL SIREN BEACON BROADCASTING</span>
        </div>
        <span className="font-mono text-emerald-400 font-bold">
          ESTIMATED TIME SAVED: ~7.5 CRITICAL MINUTES
        </span>
      </div>
    </div>
  )
}

