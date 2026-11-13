import React, { useState } from 'react'
import {
  MapPin,
  Truck,
  Camera,
  Radio,
  Plus,
} from 'lucide-react'
import Modal from '../common/Modal'
import Badge from '../common/Badge'
import Button from '../common/Button'
import { formatTimeAgo } from '../../utils/formatters'
import { EMERGENCY_UNITS } from '../../utils/constants'
import { useTraffic } from '../../context/TrafficContext'

export default function IncidentDetailModal({
  incident,
  isOpen,
  onClose,
  onStatusChange,
  onAddUnit,
}) {
  const { setActiveCameraModal, addToast } = useTraffic()
  const [selectedUnitToAdd, setSelectedUnitToAdd] = useState('')
  const [vmsBroadcastActive, setVmsBroadcastActive] = useState(false)

  if (!incident) return null

  const isResolved = incident.status === 'Resolved'

  const handleBroadcastVMS = () => {
    setVmsBroadcastActive(true)
    addToast({
      type: 'success',
      title: 'Variable Message Signs Broadcast',
      message: `Dynamic signs around ${incident.sector} updated: "CAUTION: INCIDENT AHEAD - USE ALTERNATE ROUTE"`,
    })
  }

  const handleUnitAdd = () => {
    if (!selectedUnitToAdd) return
    onAddUnit(incident.id, selectedUnitToAdd)
    setSelectedUnitToAdd('')
    addToast({
      type: 'info',
      title: 'Unit Dispatched',
      message: `${selectedUnitToAdd} dispatched to ${incident.id}`,
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Incident Dossier: ${incident.id}`}
      subtitle={`${incident.typeName} • ${incident.sector}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5">
        {/* Top Status & Title Header */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant={incident.severity} size="md" showDot>
                {incident.severity} PRIORITY
              </Badge>
              <span className="font-mono text-xs text-slate-400">
                Reported {formatTimeAgo(incident.reportedAt)}
              </span>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded-lg font-mono font-bold ${
                isResolved
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              CURRENT STATUS: {incident.status.toUpperCase()}
            </span>
          </div>

          <h3 className="text-lg font-bold text-white">{incident.title}</h3>
          <p className="text-xs text-slate-300 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>{incident.location}</span>
          </p>
        </div>

        {/* Telemetry Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center font-mono">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] text-slate-500">LANES BLOCKED</div>
            <div className="text-sm font-bold text-rose-400 mt-0.5">
              {incident.lanesBlocked} of {incident.totalLanes}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] text-slate-500">TRAFFIC DELAY</div>
            <div className="text-sm font-bold text-amber-400 mt-0.5">+{incident.estimatedDelay}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] text-slate-500">IMPACT RADIUS</div>
            <div className="text-sm font-bold text-slate-300 mt-0.5">{incident.impactRadius}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] text-slate-500">CAMERA NODE</div>
            <button
              type="button"
              onClick={() => {
                onClose()
                setActiveCameraModal(incident.cameraFeedId || 'CAM-DOWNTOWN-01')
              }}
              className="text-xs font-bold text-cyan-400 hover:underline mt-1 cursor-pointer flex items-center justify-center gap-1"
            >
              <Camera className="w-3 h-3" />
              <span>{incident.cameraFeedId || 'CAM-01'}</span>
            </button>
          </div>
        </div>

        {/* Action Directives / Field notes */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Field Notes & Observations
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{incident.description}</p>
          {incident.actionRequired && (
            <div className="mt-2 pt-2 border-t border-slate-800 text-xs text-cyan-300">
              <span className="font-bold text-cyan-400">Required Directive:</span>{' '}
              {incident.actionRequired}
            </div>
          )}
        </div>

        {/* Assigned Response Units & Dispatch Tool */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Assigned Emergency Responders
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {incident.assignedUnits?.length || 0} Units On Scene / En Route
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {incident.assignedUnits && incident.assignedUnits.length > 0 ? (
              incident.assignedUnits.map((code) => {
                const uObj = EMERGENCY_UNITS.find((u) => u.code === code)
                return (
                  <div
                    key={code}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs font-mono"
                  >
                    <Truck className="w-3.5 h-3.5 text-cyan-400" />
                    <div>
                      <span className="font-bold text-white">{code}</span>
                      <span className="text-slate-400 text-[10px] ml-1">({uObj?.name || 'Unit'})</span>
                    </div>
                  </div>
                )
              })
            ) : (
              <span className="text-xs text-slate-500 italic">No units assigned yet.</span>
            )}
          </div>

          {!isResolved && (
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
              <select
                value={selectedUnitToAdd}
                onChange={(e) => setSelectedUnitToAdd(e.target.value)}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
              >
                <option value="">Select additional unit to dispatch...</option>
                {EMERGENCY_UNITS.map((u) => (
                  <option key={u.code} value={u.code}>
                    {u.code} - {u.name} (ETA: {u.eta}m)
                  </option>
                ))}
              </select>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={handleUnitAdd}
                disabled={!selectedUnitToAdd}
                className="text-xs"
              >
                Dispatch Unit
              </Button>
            </div>
          )}
        </div>

        {/* Chronological Incident History Timeline */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Event Log & Response Audit Trail
          </span>
          <div className="space-y-2 border-l border-slate-800 pl-3 ml-1.5">
            {incident.history && incident.history.length > 0 ? (
              incident.history.map((h, i) => (
                <div key={i} className="text-xs relative">
                  <span className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-cyan-400" />
                  <div className="font-mono text-[10px] text-cyan-400">{h.time}</div>
                  <div className="text-slate-300 mt-0.5">{h.event}</div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500">No events logged yet.</div>
            )}
          </div>
        </div>

        {/* Status Transition Action Buttons */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={Radio}
            onClick={handleBroadcastVMS}
            className="text-xs text-amber-400 hover:text-amber-300"
          >
            {vmsBroadcastActive ? 'VMS Signage Updated' : 'Broadcast to Variable Signs (VMS)'}
          </Button>

          <div className="flex items-center gap-2">
            {!isResolved ? (
              <>
                {incident.status === 'Reported' && (
                  <Button
                    variant="warning"
                    size="sm"
                    onClick={() => onStatusChange(incident.id, 'Dispatched')}
                  >
                    Mark Dispatched
                  </Button>
                )}
                {incident.status === 'Dispatched' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onStatusChange(incident.id, 'Resolving')}
                  >
                    Mark Resolving
                  </Button>
                )}
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => onStatusChange(incident.id, 'Resolved')}
                >
                  Mark Resolved & Clear Road
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(incident.id, 'Dispatched')}
              >
                Re-Open Incident
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

