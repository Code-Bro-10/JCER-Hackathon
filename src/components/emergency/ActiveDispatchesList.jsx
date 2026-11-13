import React from 'react'
import { Siren, Clock, Gauge, MapPin, Zap, CheckCircle, XCircle } from 'lucide-react'
import { useTraffic } from '../../context/TrafficContext'
import Badge from '../common/Badge'
import Button from '../common/Button'

export default function ActiveDispatchesList() {
  const { emergencyDispatches, cancelGreenWave } = useTraffic()

  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Siren className="w-5 h-5 text-rose-400" />
          <h3 className="text-base font-bold text-white tracking-tight">
            Active Priority Preemption Corridors
          </h3>
        </div>
        <Badge variant="rose" size="sm">
          {emergencyDispatches.length} Active
        </Badge>
      </div>

      <div className="space-y-3">
        {emergencyDispatches.length === 0 ? (
          <div className="p-8 text-center border border-slate-800 rounded-xl bg-slate-950/40 text-slate-500">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-semibold text-slate-300">All Corridors Clear</p>
            <p className="text-xs text-slate-500">No active emergency overrides currently engaged.</p>
          </div>
        ) : (
          emergencyDispatches.map((dispatch) => {
            const isCodeRed = dispatch.priorityLevel === 'CODE RED'

            return (
              <div
                key={dispatch.id}
                className={`p-4 rounded-xl border transition-all ${
                  isCodeRed
                    ? 'bg-rose-950/20 border-rose-500/50 shadow-md shadow-rose-950/30'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Badge variant={isCodeRed ? 'rose' : 'slate'} size="sm" showDot={isCodeRed} pulseDot={isCodeRed}>
                      {dispatch.priorityLevel}
                    </Badge>
                    <span className="font-mono text-sm font-bold text-white">{dispatch.unitCode}</span>
                    <span className="text-xs text-slate-400">({dispatch.unitType})</span>
                  </div>

                  <span className="text-xs font-mono text-cyan-400 font-semibold">
                    {dispatch.status}
                  </span>
                </div>

                <div className="mt-2.5 text-xs text-slate-300 space-y-1">
                  <div className="font-semibold text-white">{dispatch.corridorName}</div>
                  <div className="text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{dispatch.origin} &rarr; {dispatch.destination}</span>
                  </div>
                </div>

                {/* Telemetry Grid */}
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500">CURRENT SPEED</div>
                    <div className="font-bold text-emerald-400 mt-0.5">{dispatch.currentSpeed} km/h</div>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500">DISTANCE LEFT</div>
                    <div className="font-bold text-slate-200 mt-0.5">{dispatch.distanceRemainingKm} km</div>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500">SIGNALS PREEMPTED</div>
                    <div className="font-bold text-cyan-400 mt-0.5">
                      {dispatch.signalsPreempted}/{dispatch.signalsTotal} Locked
                    </div>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500">TIME SAVED</div>
                    <div className="font-bold text-rose-400 mt-0.5">+{dispatch.timeSavedMinutes} mins</div>
                  </div>
                </div>

                {/* Waypoints Strip */}
                <div className="mt-3 flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono text-slate-400 pb-1">
                  <span className="text-slate-500 font-bold">ROUTE:</span>
                  {dispatch.routeWaypoints.map((wp, i) => (
                    <span key={i} className="flex items-center gap-1 whitespace-nowrap">
                      <span className="text-cyan-400">{wp}</span>
                      {i < dispatch.routeWaypoints.length - 1 && <span className="text-slate-600">&rarr;</span>}
                    </span>
                  ))}
                </div>

                {/* Action button */}
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Active since: {dispatch.activeSince}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => cancelGreenWave(dispatch.id)}
                    className="text-xs text-rose-400 hover:text-rose-300 hover:border-rose-500"
                  >
                    Release & Stand Down
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

