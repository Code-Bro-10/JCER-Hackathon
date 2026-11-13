import React from 'react'
import { Siren, ArrowRight, X } from 'lucide-react'
import { useTraffic } from '../../context/TrafficContext'

export default function EmergencyBroadcastBanner() {
  const { emergencyDispatches, setCurrentPage } = useTraffic()

  const activePriority = emergencyDispatches.find((d) => d.priorityLevel === 'CODE RED')

  if (!activePriority) return null

  return (
    <div className="relative bg-gradient-to-r from-rose-950/90 via-red-900/90 to-rose-950/90 border-b border-rose-500/60 px-4 py-2.5 text-white shadow-lg shadow-rose-950/50 z-30">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center p-1.5 rounded-lg bg-rose-500/20 border border-rose-400/40 text-rose-300">
            <span className="absolute animate-ping inline-flex h-full w-full rounded-lg bg-rose-400 opacity-30" />
            <Siren className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-rose-500 text-black">
                {activePriority.priorityLevel}
              </span>
              <span className="text-sm font-bold tracking-tight">
                Green Corridor Priority Active: {activePriority.unitCode} ({activePriority.unitType})
              </span>
            </div>
            <p className="text-xs text-rose-200 mt-0.5 hidden sm:block">
              Route: {activePriority.origin} &rarr; {activePriority.destination} | {activePriority.signalsPreempted}/{activePriority.signalsTotal} Signals Preempted GREEN | ETA: {activePriority.etaMinutes}m
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage('emergency')}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-black text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            Open Command Deck
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

