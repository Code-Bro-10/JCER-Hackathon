import React, { useState, useEffect } from 'react'
import {
  AlertTriangle,
  Plus,
  Shield,
  Check,
  MapPin,
  Truck,
  LocateFixed,
  Camera,
  Upload,
  X,
  AlertOctagon,
  Info,
} from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { SECTORS, EMERGENCY_UNITS } from '../../utils/constants'
import { useTraffic } from '../../context/TrafficContext'
import { TrafficService } from '../../services/api'
import { detectDuplicateIncident } from '../../../algorithms/incidents/duplicateDetector.js'

export const INCIDENT_CATEGORIES = [
  { id: 'accident', label: 'Multi-Vehicle Accident / Collision' },
  { id: 'roadblock', label: 'Roadblock / Police Barricade' },
  { id: 'congestion', label: 'Traffic Congestion / Gridlock' },
  { id: 'construction', label: 'Road Construction / Repair' },
  { id: 'lane_blockage', label: 'Lane Blockage / Stalled Vehicle' },
]

export default function ReportIncidentModal({ isOpen, onClose, onCreated }) {
  const { incidents, addToast } = useTraffic()

  const [title, setTitle] = useState('')
  const [type, setType] = useState('accident')
  const [severity, setSeverity] = useState('HIGH')
  const [sector, setSector] = useState('Central Belagavi Grid')
  const [location, setLocation] = useState('')
  const [latitude, setLatitude] = useState('15.8497')
  const [longitude, setLongitude] = useState('74.4977')
  const [lanesBlocked, setLanesBlocked] = useState(1)
  const [totalLanes, setTotalLanes] = useState(3)
  const [description, setDescription] = useState('')
  const [assignedUnits, setAssignedUnits] = useState(['MP-204'])
  const [photoPreview, setPhotoPreview] = useState(null)
  const [isLocating, setIsLocating] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [mlAssessment, setMlAssessment] = useState(null)

  // Dynamically query ML Random Forest Severity Classifier
  useEffect(() => {
    if (!isOpen) return
    TrafficService.classifySeverity({
      type,
      roadType: 'arterial',
      totalLanes: Number(totalLanes) || 3,
      lanesBlocked: Number(lanesBlocked) || 1,
      injuriesReported: 0,
      isPeakHour: true,
      weather: 'clear',
    })
      .then((res) => {
        if (res?.data) {
          setMlAssessment(res.data)
        }
      })
      .catch(() => {})
  }, [isOpen, type, lanesBlocked, totalLanes])

  // Auto-detect current GPS location on modal mount if available
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude.toFixed(4))
          setLongitude(pos.coords.longitude.toFixed(4))
        },
        () => {
          // Keep Belagavi default
        },
        { timeout: 5000, maximumAge: 60000, enableHighAccuracy: true }
      )
    }
  }, [isOpen])

  // Geolocation trigger
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false)
        const lat = pos.coords.latitude.toFixed(4)
        const lon = pos.coords.longitude.toFixed(4)
        setLatitude(lat)
        setLongitude(lon)
        if (!location) setLocation(`GPS (${lat}, ${lon})`)
        addToast({ type: 'success', title: 'GPS Acquired', message: `Coordinates: ${lat}, ${lon}` })
      },
      (err) => {
        setIsLocating(false)
        addToast({ type: 'warning', title: 'GPS Unavailable', message: err.message })
      },
      { timeout: 7000 }
    )
  }

  // Handle photo upload preview
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const toggleUnit = (code) => {
    setAssignedUnits((prev) =>
      prev.includes(code) ? prev.filter((u) => u !== code) : [...prev, code]
    )
  }

  const handleSubmit = async (e, forceSubmit = false) => {
    if (e && e.preventDefault) e.preventDefault()

    if (!title.trim() || !location.trim()) {
      addToast({
        type: 'warning',
        title: 'Missing Required Fields',
        message: 'Please provide incident title and location description.',
      })
      return
    }

    // Evidence Rule: Do not classify slow traffic as an accident without collision details
    if (type === 'accident' && description.toLowerCase().includes('slow traffic') && !description.toLowerCase().includes('crash') && !description.toLowerCase().includes('collision')) {
      addToast({
        type: 'warning',
        title: 'Classification Advisory',
        message: 'Reports of slow vehicle movement should be categorized as "Traffic Congestion", not "Accident", unless physical collision damage occurred.',
      })
      setType('congestion')
      return
    }

    const candidatePayload = {
      title,
      type,
      location,
      coordinates: {
        lat: parseFloat(latitude) || 15.8497,
        lon: parseFloat(longitude) || 74.4977,
      },
      reportedAt: Date.now(),
    }

    // Run Duplicate Incident Detection Engine
    if (!forceSubmit && !duplicateWarning) {
      const duplicateCheck = detectDuplicateIncident(candidatePayload, incidents, {
        duplicateThreshold: 0.75,
        potentialThreshold: 0.55,
      })

      if (duplicateCheck.isDuplicate || duplicateCheck.decision === 'POTENTIAL_DUPLICATE') {
        setDuplicateWarning(duplicateCheck)
        addToast({
          type: 'warning',
          title: 'Potential Duplicate Report Detected',
          message: `Similar incident reported nearby (${duplicateCheck.matchedIncident?.title || 'Existing Incident'}). Review confirmation option below.`,
        })
        return
      }
    }

    try {
      setSubmitting(true)
      const selectedTypeObj = INCIDENT_CATEGORIES.find((t) => t.id === type)
      const uniqueId = `INC-2026-${String(incidents.length + 101).padStart(3, '0')}`

      const payload = {
        id: uniqueId,
        title,
        type,
        typeName: selectedTypeObj?.label || 'Traffic Incident',
        severity,
        sector,
        location,
        coordinates: {
          lat: parseFloat(latitude) || 15.8497,
          lon: parseFloat(longitude) || 74.4977,
        },
        lanesBlocked: Number(lanesBlocked),
        totalLanes: Number(totalLanes),
        assignedUnits,
        description,
        photoUrl: photoPreview,
        confirmations: 1,
        status: assignedUnits.length > 0 ? 'Dispatched' : 'Reported',
        estimatedDelay: severity === 'CRITICAL' ? '25 mins' : severity === 'HIGH' ? '15 mins' : '8 mins',
        impactRadius: severity === 'CRITICAL' ? '2.5 km' : '1.2 km',
      }

      const res = await TrafficService.createIncident(payload)
      if (res.success) {
        addToast({
          type: severity === 'CRITICAL' ? 'critical' : 'success',
          title: `Incident ${res.data.id} Registered`,
          message: `${res.data.title} reported in ${sector}. Unique ID assigned.`,
        })
        if (onCreated) onCreated(res.data)
        onClose()
        // Reset form
        setTitle('')
        setLocation('')
        setDescription('')
        setPhotoPreview(null)
        setDuplicateWarning(null)
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
      title="Report & Verify New Traffic Incident"
      subtitle="Manual intake with duplicate detection, GPS location permission & photo attachment"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
        {/* Duplicate Warning Banner */}
        {duplicateWarning && (
          <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Duplicate Incident Detection Advisory</span>
            </div>
            <p className="leading-relaxed">
              Our spatial-temporal detection engine matched this with an existing active incident:{' '}
              <strong className="text-white">"{duplicateWarning.matchedIncident?.title}"</strong> reported{' '}
              <span className="font-mono text-white">{duplicateWarning.similarityBreakdown?.location?.distanceMeters || '90'}m</span> away.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  addToast({ type: 'success', title: 'Occurrence Confirmed', message: 'Existing incident upvoted.' })
                  onClose()
                }}
              >
                Confirm Existing Incident Instead
              </Button>
              <Button
                variant="warning"
                size="sm"
                onClick={() => handleSubmit(null, true)}
              >
                Submit As Distinct Incident
              </Button>
            </div>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 block">
            Incident Headline / Summary
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Broken Down Freight Truck on Flyover Exit"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Severity & Incident Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Severity Level
              </label>
              {mlAssessment && (
                <button
                  type="button"
                  onClick={() => setSeverity(mlAssessment.predicted_severity)}
                  className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                  title="Click to apply ML severity assessment"
                >
                  <Shield className="w-3 h-3 text-cyan-400" />
                  <span>ML Suggests: {mlAssessment.predicted_severity}</span>
                </button>
              )}
            </div>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs font-medium text-slate-100 focus:border-blue-500 focus:outline-none"
            >
              <option value="CRITICAL">CRITICAL (Major Multi-Lane Hazard)</option>
              <option value="HIGH">HIGH (Corridor Delay)</option>
              <option value="MEDIUM">MEDIUM (Moderate Congestion)</option>
              <option value="LOW">LOW (Advisory / Shoulder Obstruction)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 block">
              Incident Category
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs font-medium text-slate-100 focus:border-blue-500 focus:outline-none"
            >
              {INCIDENT_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Location & GPS Permission Picker */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Location Description & Coordinates
            </label>
            <button
              type="button"
              onClick={handleDetectGPS}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono cursor-pointer"
            >
              <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>Use Current GPS Location</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2">
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Cross-street / landmark (e.g. Silk Board Junction, Hosur Road)"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-1.5 font-mono">
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="Lat"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-xs text-slate-200 focus:outline-none text-center"
              />
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="Lon"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-xs text-slate-200 focus:outline-none text-center"
              />
            </div>
          </div>
        </div>

        {/* Sector & Lanes Impact */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 block">
              Urban Sector
            </label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs font-medium text-slate-100 focus:border-blue-500 focus:outline-none"
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
              Blocked Lanes
            </label>
            <input
              type="number"
              min="0"
              max="8"
              value={lanesBlocked}
              onChange={(e) => setLanesBlocked(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 focus:border-blue-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 block">
              Total Road Lanes
            </label>
            <input
              type="number"
              min="1"
              max="8"
              value={totalLanes}
              onChange={(e) => setTotalLanes(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 focus:border-blue-500 focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* Field Notes & Photo Upload */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 block">
            Incident Field Description
          </label>
          <textarea
            rows="2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Visual conditions, vehicle details, lane obstructions..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Photo Upload Attachment */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 block flex items-center justify-between">
            <span>Optional Photo / Dashcam Evidence</span>
            {photoPreview && (
              <button
                type="button"
                onClick={() => setPhotoPreview(null)}
                className="text-[11px] text-rose-400 hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Remove Photo
              </button>
            )}
          </label>

          {photoPreview ? (
            <div className="relative w-full h-28 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
              <img src={photoPreview} alt="Incident Upload Preview" className="w-full h-full object-cover" />
            </div>
          ) : (
            <label className="border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/50 rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer transition-colors text-xs text-slate-400">
              <Camera className="w-4 h-4 text-blue-400" />
              <span>Attach Scene Photo (PNG, JPG)</span>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          )}
        </div>

        {/* Immediate Units Dispatch Picker */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 block">
            Dispatch Rapid Response Units
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
                      ? 'bg-blue-600/15 border-blue-500/50 text-blue-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded border flex items-center justify-center font-bold text-xs">
                      {isChecked && <Check className="w-3 h-3 text-blue-400" />}
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

        {/* Action Buttons */}
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
            Submit Incident Report
          </Button>
        </div>
      </form>
    </Modal>
  )
}
