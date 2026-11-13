import React, { useState } from 'react'
import { AlertTriangle, Plus, Shield, Check, MapPin, Truck } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { SECTORS, INCIDENT_TYPES, EMERGENCY_UNITS } from '../../utils/constants'
import { useTraffic } from '../../context/TrafficContext'
import { TrafficService } from '../../services/api'

export default function ReportIncidentModal({ isOpen, onClose, onCreated }) {
  const { addToast } = useTraffic()

  const [title, setTitle] = useState('')
  const [type, setType] = useState('accident')
  const [severity, setSeverity] = useState('HIGH')
  const [sector, setSector] = useState('Downtown Grid')
  const [location, setLocation] = useState('')
  const [lanesBlocked, setLanesBlocked] = useState(1)
  const [totalLanes, setTotalLanes] = useState(3)
  const [description, setDescription] = useState('')
  const [assignedUnits, setAssignedUnits] = useState(['MP-204'])
  const [submitting, setSubmitting] = useState(false)

  const toggleUnit = (code) => {
    setAssignedUnits((prev) =>
      prev.includes(code) ? prev.filter((u) => u !== code) : [...prev, code]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !location.trim()) {
      addToast({ type: 'warning', title: 'Missing Information', message: 'Please provide both incident title and location.' })
      return
    }

    try {
      setSubmitting(true)
      const selectedTypeObj = INCIDENT_TYPES.find((t) => t.id === type)
      const payload = {
        title,
        type,
        typeName: selectedTypeObj?.label || 'Incident',
        severity,
        sector,
        location,
        lanesBlocked: Number(lanesBlocked),
        totalLanes: Number(totalLanes),
        assignedUnits,
        description,
        estimatedDelay: severity === 'CRITICAL' ? 25 : severity === 'HIGH' ? 15 : 8,
        impactRadius: severity === 'CRITICAL' ? 2.5 : 1.2,
      }

      const res = await TrafficService.createIncident(payload)
      if (res.success) {
        addToast({
          type: severity === 'CRITICAL' ? 'critical' : 'success',
          title: `Incident ${res.data.id} Registered`,
          message: `${res.data.title} reported in ${sector}. Emergency dispatch queued.`,
        })
        if (onCreated) onCreated(res.data)
        onClose()
        // reset form
        setTitle('')
        setLocation('')
        setDescription('')
      }
    } catch (err) {
      addToast({ type: 'danger', title: 'Creation Failed', message: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report & Dispatch New Traffic Incident"
      subtitle="Manual operator intake with automatic emergency response routing"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 block">
            Incident Headline / Description
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Overturned Tanker on Flyover Merge"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        {/* Severity & Incident Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 block">
              Severity Level
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs font-medium text-slate-100 focus:border-cyan-500 focus:outline-none"
            >
              <option value="CRITICAL">CRITICAL (Immediate Multi-Agency Dispatch)</option>
              <option value="HIGH">HIGH (Major Corridor Delay)</option>
              <option value="MEDIUM">MEDIUM (Moderate Congestion Spillover)</option>
              <option value="LOW">LOW (Advisory / Shoulder Obstruction)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 block">
              Classification
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs font-medium text-slate-100 focus:border-cyan-500 focus:outline-none"
            >
              {INCIDENT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sector & Location description */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 block">
              Urban Sector
            </label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs font-medium text-slate-100 focus:border-cyan-500 focus:outline-none"
            >
              {SECTORS.filter((s) => s !== 'All Sectors').map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 block">
              Exact Cross-Street / Mile Marker
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. 5th Ave & Market St (Northbound)"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Lanes impact */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 block">
              Blocked Lanes
            </label>
            <input
              type="number"
              min="0"
              max="8"
              value={lanesBlocked}
              onChange={(e) => setLanesBlocked(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 block">
              Total Roadway Lanes
            </label>
            <input
              type="number"
              min="1"
              max="8"
              value={totalLanes}
              onChange={(e) => setTotalLanes(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* Immediate Units Dispatch Picker */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 block">
            Authorize Immediate Unit Dispatch
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {EMERGENCY_UNITS.map((unit) => {
              const isChecked = assignedUnits.includes(unit.code)
              return (
                <div
                  key={unit.code}
                  onClick={() => toggleUnit(unit.code)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded border flex items-center justify-center font-bold text-xs">
                      {isChecked && <Check className="w-3 h-3 text-cyan-400" />}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">{unit.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {unit.code} • ETA: {unit.eta}m
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Detailed Notes */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 block">
            Incident Field Notes & Observations
          </label>
          <textarea
            rows="2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Visual conditions, vehicle details, passenger status..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Modal Buttons */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            size="md"
            loading={submitting}
            icon={Plus}
          >
            Dispatch & Create Incident
          </Button>
        </div>
      </form>
    </Modal>
  )
}

