import React from 'react'
import { Leaf, DollarSign, Check } from 'lucide-react'
import Badge from '../common/Badge'

export default function RouteComparisonCard({
  route,
  isSelected,
  onSelect,
}) {
  const isShortest = route.id === 'route-shortest'

  return (
    <div
      onClick={onSelect}
      className={`rounded-2xl border p-4 sm:p-5 transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'bg-slate-900 border-cyan-400 shadow-xl shadow-cyan-950/40 ring-1 ring-cyan-400'
          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant={route.badgeColor || 'cyan'} size="sm">
              {route.badge}
            </Badge>
            <span className="font-mono text-xs text-slate-400">{route.distanceKm} km</span>
          </div>
          <h4 className="text-base font-bold text-white mt-1">{route.title}</h4>
        </div>

        {/* Big ETA */}
        <div className="text-right">
          <div className="text-2xl font-extrabold text-white font-mono flex items-baseline justify-end gap-1">
            <span>{route.durationMin}</span>
            <span className="text-xs text-slate-400 font-sans">mins</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            {route.delayMin > 0 ? (
              <span className={route.delayMin > 10 ? 'text-rose-400' : 'text-amber-400'}>
                +{route.delayMin}m delay
              </span>
            ) : (
              <span className="text-emerald-400">Zero delay</span>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row: CO2, Fuel, Congestion Risk */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-mono">
        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
            <Leaf className="w-3 h-3 text-emerald-400" /> CO₂ EMITTED
          </div>
          <div className="font-bold text-slate-200 mt-0.5">{route.co2Kg} kg</div>
        </div>

        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
            <DollarSign className="w-3 h-3 text-amber-400" /> EST. FUEL
          </div>
          <div className="font-bold text-slate-200 mt-0.5">{route.fuelCost}</div>
        </div>

        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-[10px] text-slate-500">RISK INDEX</div>
          <div
            className={`font-bold mt-0.5 ${
              isShortest ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {route.congestionRisk}
          </div>
        </div>
      </div>

      {/* Highlights List */}
      <div className="mt-3.5 space-y-1">
        {route.highlights.map((hl, i) => (
          <div key={i} className="text-xs text-slate-300 flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <span>{hl}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
