import React from 'react'
import { Leaf, DollarSign, Wind, BatteryCharging, TrendingUp } from 'lucide-react'
import Badge from '../common/Badge'

export default function EnvironmentalImpactWidget() {
  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Sustainability & Carbon Offset Metrics
            </h3>
            <p className="text-xs text-slate-400">Emissions avoided through reduced traffic idling</p>
          </div>
        </div>
        <Badge variant="emerald" size="sm">
          ECO CERTIFIED
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
          <div className="text-[11px] font-mono text-slate-500 uppercase flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5 text-emerald-400" /> CO₂ REDUCTION
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">18.6 <span className="text-xs text-slate-400">tons</span></div>
          <div className="text-[10px] text-emerald-400 font-mono">+2.3 tons vs baseline</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
          <div className="text-[11px] font-mono text-slate-500 uppercase flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-amber-400" /> FUEL SAVINGS
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">$42,850</div>
          <div className="text-[10px] text-amber-400 font-mono">14,200 liters saved</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
          <div className="text-[11px] font-mono text-slate-500 uppercase flex items-center gap-1.5">
            <BatteryCharging className="w-3.5 h-3.5 text-cyan-400" /> EV FLEET SHARE
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">28.4%</div>
          <div className="text-[10px] text-cyan-400 font-mono">+6.2% YoY growth</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
          <div className="text-[11px] font-mono text-slate-500 uppercase flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-teal-400" /> CLEAN AIR INDEX
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">88 / 100</div>
          <div className="text-[10px] text-teal-400 font-mono">Grade A: Healthy</div>
        </div>
      </div>
    </div>
  )
}

