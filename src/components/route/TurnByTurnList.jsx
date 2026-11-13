import React from 'react'
import { Navigation, Clock, ShieldCheck, AlertTriangle } from 'lucide-react'
import Badge from '../common/Badge'

export default function TurnByTurnList({ steps = [] }) {
  if (!steps || steps.length === 0) return null

  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-cyan-400" />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
            Turn-by-Turn Navigation & Dynamic Sign Directives
          </h4>
        </div>
        <span className="text-xs font-mono text-slate-400">{steps.length} Steps</span>
      </div>

      <div className="space-y-3">
        {steps.map((step, idx) => {
          const isSevere = step.traffic === 'severe'
          const isHeavy = step.traffic === 'heavy'
          const isModerate = step.traffic === 'moderate'

          return (
            <div
              key={idx}
              className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                isSevere
                  ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-cyan-400 flex-shrink-0 mt-0.5">
                {idx + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white leading-snug">
                  {step.instruction}
                </div>
                <div className="mt-1 flex items-center gap-3 text-[11px] font-mono text-slate-400">
                  <span>{step.distance}</span>
                  <span>•</span>
                  <span>{step.duration}</span>
                  <span>•</span>
                  <span
                    className={`font-semibold capitalize ${
                      isSevere
                        ? 'text-rose-400'
                        : isHeavy
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    Traffic: {step.traffic}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

