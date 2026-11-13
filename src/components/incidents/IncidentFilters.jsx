import React from 'react'
import { Search, Plus, Filter, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { SECTORS, SEVERITIES } from '../../utils/constants'
import Button from '../common/Button'
import Badge from '../common/Badge'

export default function IncidentFilters({
  search,
  setSearch,
  sector,
  setSector,
  severity,
  setSeverity,
  status,
  setStatus,
  onOpenReportModal,
  totalCount,
}) {
  const severityOptions = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
  const statusOptions = ['ALL', 'Reported', 'Dispatched', 'Resolving', 'Resolved']

  return (
    <div className="space-y-3 rounded-2xl bg-slate-900/70 border border-slate-800 p-4">
      {/* Search & Actions Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search incident ID, title, avenue, road name..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Sector select */}
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs font-medium text-slate-200 focus:border-cyan-500 focus:outline-none cursor-pointer"
          >
            {SECTORS.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>

          {/* Report New Incident Button */}
          <Button
            variant="danger"
            size="sm"
            icon={Plus}
            onClick={onOpenReportModal}
            className="whitespace-nowrap"
          >
            Report Incident
          </Button>
        </div>
      </div>

      {/* Filter Chips: Severity & Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
        {/* Severity Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-slate-500 mr-1 text-[11px] font-mono">SEVERITY:</span>
          {severityOptions.map((sev) => {
            const isSelected = severity === sev
            return (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverity(sev)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  isSelected
                    ? sev === 'CRITICAL'
                      ? 'bg-rose-500 text-black font-bold'
                      : sev === 'HIGH'
                      ? 'bg-amber-500 text-black font-bold'
                      : 'bg-cyan-500 text-black font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {sev}
              </button>
            )
          })}
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-slate-500 mr-1 text-[11px] font-mono">STATUS:</span>
          {statusOptions.map((st) => {
            const isSelected = status === st
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatus(st)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-200 text-black font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {st}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

