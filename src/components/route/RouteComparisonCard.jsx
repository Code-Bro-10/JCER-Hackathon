import React from 'react'
import { Check, Sparkles, AlertTriangle, ArrowRight, ShieldCheck, School } from 'lucide-react'
import Badge from '../common/Badge'

export default function RouteComparisonCard({
  route,
  isSelected,
  onSelect,
}) {
  const isShortest = route.id === 'route-shortest'
  const isAiSmart = route.id === 'route-ai-smart'
  const isEco = route.id === 'route-eco'

  const criteria = route.criteria || {
    traffic: { label: route.congestionLevel || 'Optimal', emoji: '🚦' },
    distance: { label: `${route.distanceKm} km`, emoji: '📏' },
    time: { label: `${route.durationMin} mins`, emoji: '⏱️' },
    fuel: { label: `${route.fuelLitres} L (${route.fuelCost})`, emoji: '⛽' },
    roadCondition: { label: 'Standard Urban Pavement', emoji: '🛣️' },
    schoolsColleges: { summary: 'Standard Corridor', emoji: '🏫', hasInstitutions: false },
    ecoCarbon: { label: `${route.co2Kg} kg CO₂`, emoji: '🍃' },
  }

  return (
    <div
      onClick={onSelect}
      className={`rounded-2xl border p-4 sm:p-5 transition-all duration-200 cursor-pointer relative overflow-hidden group ${
        isSelected
          ? 'bg-slate-900 border-cyan-400 shadow-xl shadow-cyan-950/40 ring-2 ring-cyan-400/80'
          : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
      }`}
    >
      {/* Top Header: Badge, Title, and Big Duration */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant={route.badgeColor || 'cyan'} size="sm">
              {route.badge}
            </Badge>
            {isAiSmart && (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>AI CHOICE</span>
              </span>
            )}
          </div>
          <h4 className="text-base font-bold text-white mt-1.5 flex items-center gap-2">
            <span>{route.title}</span>
          </h4>
        </div>

        {/* Big ETA */}
        <div className="text-right">
          <div className="text-2xl font-extrabold text-white font-mono flex items-baseline justify-end gap-1">
            <span>{route.durationMin}</span>
            <span className="text-xs text-slate-400 font-sans">mins</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            {route.delayMin > 0 ? (
              <span className={route.delayMin > 8 ? 'text-rose-400 font-bold' : 'text-amber-400 font-semibold'}>
                +{route.delayMin}m delay
              </span>
            ) : (
              <span className="text-emerald-400 font-semibold">⚡ Fastest corridor</span>
            )}
          </div>
        </div>
      </div>

      {/* 6 Key Attractive Emoji Criteria Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3.5 text-xs">
        {/* 1. Traffic Level */}
        <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
            <span>{criteria.traffic?.emoji || '🚦'}</span>
            <span>TRAFFIC FLOW</span>
          </span>
          <span className="font-bold text-slate-100 text-[11px] mt-1 truncate">
            {criteria.traffic?.label}
          </span>
        </div>

        {/* 2. Distance */}
        <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
            <span>{criteria.distance?.emoji || '📏'}</span>
            <span>DISTANCE</span>
          </span>
          <span className="font-bold text-slate-100 text-[11px] mt-1">
            {criteria.distance?.label}
          </span>
        </div>

        {/* 3. Fuel & Energy */}
        <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
            <span>{criteria.fuel?.emoji || '⛽'}</span>
            <span>FUEL BURN</span>
          </span>
          <span className="font-bold text-amber-300 text-[11px] mt-1 truncate">
            {criteria.fuel?.label}
          </span>
        </div>

        {/* 4. Road Condition / Pavements */}
        <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 col-span-2 sm:col-span-1 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
            <span>{criteria.roadCondition?.emoji || '🛣️'}</span>
            <span>ROAD QUALITY</span>
          </span>
          <span className="font-bold text-slate-100 text-[11px] mt-1 truncate" title={criteria.roadCondition?.label}>
            {criteria.roadCondition?.label}
          </span>
        </div>

        {/* 5. School & College Zones (Crucial Requirement) */}
        <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 col-span-2 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
            <span>{criteria.schoolsColleges?.emoji || '🏫'}</span>
            <span>SCHOOL & COLLEGE ZONES</span>
          </span>
          <div className="mt-1">
            <span
              className={`text-[11px] font-semibold leading-tight block ${
                criteria.schoolsColleges?.hasInstitutions
                  ? criteria.schoolsColleges?.rushHourRisk?.includes('Critical')
                    ? 'text-rose-400'
                    : 'text-amber-300'
                  : 'text-emerald-400'
              }`}
            >
              {criteria.schoolsColleges?.summary}
            </span>
            {criteria.schoolsColleges?.institutions?.length > 0 && (
              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                Campuses: {criteria.schoolsColleges.institutions.join(' • ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Highlights & AI Rationale */}
      <div className="mt-3 space-y-1 pt-2 border-t border-slate-800/60">
        {(route.highlights || []).slice(0, 3).map((hl, i) => (
          <div key={i} className="text-xs text-slate-300 flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <span>{hl}</span>
          </div>
        ))}
      </div>

      {/* Action / Select Bar */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-800 flex items-center justify-between">
        <span className="text-[10px] font-mono text-slate-400">
          Reliability: <strong className="text-white">{route.reliabilityScore}%</strong>
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            isSelected
              ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/25'
              : 'bg-slate-800 hover:bg-slate-700 text-white'
          }`}
        >
          {isSelected ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Route Selected</span>
            </>
          ) : (
            <>
              <span>Choose This Path</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
