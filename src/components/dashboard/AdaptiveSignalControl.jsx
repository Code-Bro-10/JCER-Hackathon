import React, { useState } from 'react'
import { Zap, Clock, ShieldCheck, ArrowRight, Check, AlertCircle } from 'lucide-react'
import { useTraffic } from '../../context/TrafficContext'
import { TrafficService } from '../../services/api'
import Badge from '../common/Badge'
import Button from '../common/Button'

export default function AdaptiveSignalControl() {
  const { intersections, setIntersections, addToast } = useTraffic()
  const [extendingId, setExtendingId] = useState(null)

  const handleExtendGreen = async (intersectionId) => {
    try {
      setExtendingId(intersectionId)
      const res = await TrafficService.overrideSignal(intersectionId, 'Extended Green Phase', 35)
      if (res.success) {
        setIntersections((prev) =>
          prev.map((item) => (item.id === intersectionId ? res.data : item))
        )
        addToast({
          type: 'success',
          title: 'Signal Extended',
          message: `Extended green wave phase by +35s for ${intersectionId}`,
        })
      }
    } catch (err) {
      addToast({ type: 'danger', title: 'Override Failed', message: err.message })
    } finally {
      setExtendingId(null)
    }
  }

  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 flex flex-col h-full">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Adaptive Signal Optimization</h3>
            <p className="text-xs text-slate-400">Deep reinforcement learning signal coordination</p>
          </div>
        </div>
        <Badge variant="cyan" size="sm" showDot pulseDot>
          100% ONLINE
        </Badge>
      </div>

      <div className="mt-4 space-y-3 flex-1 overflow-y-auto max-h-[460px] pr-1">
        {intersections.map((intNode) => {
          const isGreen = intNode.currentPhase.toLowerCase().includes('green')
          const isEmergency = intNode.mode?.toLowerCase().includes('emergency')

          return (
            <div
              key={intNode.id}
              className={`p-3.5 rounded-xl border transition-all ${
                isEmergency
                  ? 'border-rose-500/60 bg-rose-950/20 shadow-md shadow-rose-950/30'
                  : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-400">{intNode.id}</span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-400 font-medium">{intNode.sector}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mt-0.5">{intNode.name}</h4>
                </div>

                {/* Countdown Timer Badge */}
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isGreen ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'
                      }`}
                    />
                    <span className="font-bold text-white">{intNode.secondsRemaining}s</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5">CYCLE 60s</span>
                </div>
              </div>

              {/* Status details & Queue */}
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800/80">
                  <div className="text-[10px] text-slate-500">NORTH QUEUE</div>
                  <div className="font-bold text-slate-200">{intNode.queueNorth} veh</div>
                </div>
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800/80">
                  <div className="text-[10px] text-slate-500">SOUTH QUEUE</div>
                  <div className="font-bold text-slate-200">{intNode.queueSouth} veh</div>
                </div>
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800/80">
                  <div className="text-[10px] text-slate-500">EAST QUEUE</div>
                  <div className="font-bold text-slate-200">{intNode.queueEast} veh</div>
                </div>
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800/80">
                  <div className="text-[10px] text-slate-500">EFFICIENCY</div>
                  <div className="font-bold text-emerald-400">{intNode.efficiencyScore}%</div>
                </div>
              </div>

              {/* AI Strategy recommendation note */}
              <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-slate-900 text-xs">
                <p className="text-[11px] text-slate-400 truncate flex-1">
                  <span className="text-cyan-400 font-medium">Strategy:</span> {intNode.recommendation}
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  loading={extendingId === intNode.id}
                  onClick={() => handleExtendGreen(intNode.id)}
                  className="text-[11px] py-1 px-2.5 whitespace-nowrap"
                >
                  +35s Green
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

