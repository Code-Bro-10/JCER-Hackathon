import React from 'react'
import { AlertTriangle, Clock, ArrowRight, ShieldAlert, CheckCircle2, Siren } from 'lucide-react'
import { useTraffic } from '../../context/TrafficContext'
import { formatTimeAgo } from '../../utils/formatters'
import Badge from '../common/Badge'
import Button from '../common/Button'

export default function RecentIncidentsWidget() {
  const { incidents, setCurrentPage } = useTraffic()

  // Display top 4 active incidents
  const activeList = incidents
    .filter((i) => i.status !== 'Resolved')
    .slice(0, 4)

  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 flex flex-col h-full">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Active Incident Stream</h3>
            <p className="text-xs text-slate-400">Computer vision and telemetry detected alerts</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentPage('incidents')}
          className="text-xs text-cyan-400 hover:text-cyan-300 gap-1"
        >
          <span>All Incidents</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="mt-4 space-y-3 flex-1 overflow-y-auto max-h-[460px] pr-1">
        {activeList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2 opacity-80" />
            <p className="text-sm font-semibold text-slate-300">City Corridors Clear</p>
            <p className="text-xs text-slate-500">Zero active critical bottlenecks recorded.</p>
          </div>
        ) : (
          activeList.map((inc) => (
            <div
              key={inc.id}
              onClick={() => setCurrentPage('incidents')}
              className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={inc.severity} size="sm">
                      {inc.severity}
                    </Badge>
                    <span className="font-mono text-xs text-slate-400">{inc.id}</span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-400">{formatTimeAgo(inc.reportedAt)}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                    {inc.title}
                  </h4>
                </div>

                <span className="text-xs px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap">
                  {inc.status}
                </span>
              </div>

              <p className="text-xs text-slate-400 mt-2 line-clamp-1">{inc.location}</p>

              <div className="mt-2.5 pt-2 border-t border-slate-900/80 flex items-center justify-between text-xs text-slate-500">
                <span>{inc.lanesBlocked} of {inc.totalLanes} lanes obstructed</span>
                <span className="font-mono text-rose-400 font-semibold">+{inc.estimatedDelay} delay</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

