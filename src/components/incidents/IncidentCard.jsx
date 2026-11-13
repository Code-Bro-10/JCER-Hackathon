import React from 'react'
import {
  AlertTriangle,
  MapPin,
  Clock,
  Shield,
  Camera,
  ArrowRight,
  CheckCircle2,
  AlertOctagon,
  Truck,
  Users,
} from 'lucide-react'
import Badge from '../common/Badge'
import Button from '../common/Button'
import { formatTimeAgo } from '../../utils/formatters'
import { useTraffic } from '../../context/TrafficContext'

export default function IncidentCard({
  incident,
  onSelect,
  onQuickResolve,
  onQuickDispatch,
}) {
  const { setActiveCameraModal } = useTraffic()

  const isResolved = incident.status === 'Resolved'

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 transition-all duration-200 flex flex-col justify-between ${
        isResolved
          ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
          : incident.severity === 'CRITICAL'
          ? 'bg-gradient-to-br from-rose-950/20 via-slate-900/90 to-slate-950 border-rose-500/40 shadow-lg shadow-rose-950/20'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div>
        {/* Top Header: Severity, ID, Time */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Badge variant={incident.severity} size="sm" showDot pulseDot={incident.severity === 'CRITICAL'}>
              {incident.severity}
            </Badge>
            <span className="font-mono text-xs font-bold text-slate-400">{incident.id}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(incident.reportedAt)}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${
                isResolved
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : incident.status === 'Dispatched'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              {incident.status}
            </span>
          </div>
        </div>

        {/* Title & Classification */}
        <div className="mt-3">
          <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
            {incident.typeName}
          </div>
          <h3 className="text-base font-bold text-white mt-0.5 leading-snug">
            {incident.title}
          </h3>
        </div>

        {/* Location & Sector */}
        <div className="mt-2.5 flex items-start gap-2 text-xs text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
          <span>{incident.location}</span>
        </div>

        {/* Description snippet */}
        <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {incident.description}
        </p>

        {/* Telemetry Metrics */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-mono">
          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
            <div className="text-[10px] text-slate-500">BLOCKED</div>
            <div className="font-bold text-rose-400 mt-0.5">
              {incident.lanesBlocked}/{incident.totalLanes} lanes
            </div>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
            <div className="text-[10px] text-slate-500">EST. DELAY</div>
            <div className="font-bold text-amber-400 mt-0.5">+{incident.estimatedDelay}</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
            <div className="text-[10px] text-slate-500">ZONE RADIUS</div>
            <div className="font-bold text-slate-300 mt-0.5">{incident.impactRadius}</div>
          </div>
        </div>

        {/* Assigned Units List */}
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-500 font-mono">UNITS:</span>
          {incident.assignedUnits && incident.assignedUnits.length > 0 ? (
            incident.assignedUnits.map((u) => (
              <span
                key={u}
                className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-500/30"
              >
                {u}
              </span>
            ))
          ) : (
            <span className="text-[11px] text-slate-500 italic">No units assigned yet</span>
          )}
        </div>
      </div>

      {/* Card Action Buttons */}
      <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          icon={Camera}
          onClick={() => setActiveCameraModal(incident.cameraFeedId || 'CAM-DOWNTOWN-01')}
          className="text-xs text-slate-400 hover:text-white"
        >
          CCTV
        </Button>

        <div className="flex items-center gap-2">
          {!isResolved && (
            <>
              {incident.status === 'Reported' && (
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => onQuickDispatch(incident.id)}
                  className="text-xs"
                >
                  Dispatch
                </Button>
              )}
              <Button
                variant="success"
                size="sm"
                onClick={() => onQuickResolve(incident.id)}
                className="text-xs"
              >
                Resolve
              </Button>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelect(incident)}
            className="text-xs"
          >
            Details
          </Button>
        </div>
      </div>
    </div>
  )
}

