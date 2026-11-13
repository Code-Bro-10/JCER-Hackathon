import React, { useState } from 'react'
import { Siren, Shield, Zap, AlertTriangle, ArrowRight, Play, Check } from 'lucide-react'
import { HOSPITALS, EMERGENCY_UNITS } from '../../utils/constants'
import { useTraffic } from '../../context/TrafficContext'
import Button from '../common/Button'
import Badge from '../common/Badge'

export default function GreenWaveController() {
  const { triggerGreenWave, emergencyDispatches } = useTraffic()

  const [selectedUnit, setSelectedUnit] = useState('MED-09')
  const [selectedHospital, setSelectedHospital] = useState('City Central Trauma Center')
  const [origin, setOrigin] = useState('West Sector Firehouse #4')
  const [corridorName, setCorridorName] = useState('Green Corridor Alpha (West-Central)')
  const [isActivating, setIsActivating] = useState(false)

  const handleActivate = async () => {
    try {
      setIsActivating(true)
      const unitObj = EMERGENCY_UNITS.find((u) => u.code === selectedUnit) || {
        name: 'ALS Trauma Ambulance',
      }
      await triggerGreenWave({
        unitCode: selectedUnit,
        unitType: unitObj.name,
        origin,
        destination: selectedHospital,
        corridorName,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setIsActivating(false)
    }
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-rose-950/30 via-slate-900/90 to-slate-950 border border-rose-500/40 p-5 space-y-4 shadow-xl shadow-rose-950/20">
      <div className="flex items-center justify-between pb-3 border-b border-rose-500/30">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400">
            <Siren className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Green Wave Signal Preemption
              </h3>
              <Badge variant="rose" size="sm" showDot pulseDot>
                CODE RED PRIORITY
              </Badge>
            </div>
            <p className="text-xs text-rose-200/80">
              Locks all downstream signals to green for emergency medical & rescue units
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* Responder Unit Picker */}
        <div>
          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1.5 block">
            Emergency Response Unit
          </label>
          <div className="grid grid-cols-2 gap-2">
            {EMERGENCY_UNITS.slice(0, 4).map((unit) => {
              const isSelected = selectedUnit === unit.code
              return (
                <button
                  key={unit.code}
                  type="button"
                  onClick={() => setSelectedUnit(unit.code)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rose-600/25 border-rose-500 text-rose-200 font-bold shadow-md shadow-rose-950/50'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs">{unit.code}</span>
                    <span className="text-[10px] text-slate-400">ETA {unit.eta}m</span>
                  </div>
                  <div className="text-xs text-white truncate mt-0.5">{unit.name}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Origin & Destination Hospital */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1 block">
              Origin Station
            </label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1 block">
              Destination Hospital
            </label>
            <select
              value={selectedHospital}
              onChange={(e) => setSelectedHospital(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-rose-500 focus:outline-none cursor-pointer"
            >
              {HOSPITALS.map((hosp) => (
                <option key={hosp.id} value={hosp.name}>
                  {hosp.name} ({hosp.capacity})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Priority Corridor */}
        <div>
          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1 block">
            Corridor Preemption Path
          </label>
          <select
            value={corridorName}
            onChange={(e) => setCorridorName(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-rose-500 focus:outline-none cursor-pointer"
          >
            <option value="Green Corridor Alpha (West-Central)">
              Green Corridor Alpha (West River &rarr; Central Trauma Center) - 6 Intersections
            </option>
            <option value="Expressway Medical Flyover">
              Expressway Medical Flyover (East Port &rarr; Apex General) - 5 Intersections
            </option>
            <option value="Downtown Arterial Priority Lane">
              Downtown Arterial Priority Lane (Market St &rarr; City Hospital) - 7 Intersections
            </option>
          </select>
        </div>

        {/* Safety Warning */}
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-200">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <span>
            Activating green wave overrides automated cycle timings and halts opposing cross-street traffic with red clearance phases.
          </span>
        </div>

        {/* Trigger Button */}
        <Button
          variant="danger"
          size="lg"
          icon={Siren}
          loading={isActivating}
          onClick={handleActivate}
          className="w-full py-3 text-sm font-bold tracking-wider uppercase bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-600/40 border border-rose-400/50 cursor-pointer"
        >
          Authorize Priority Green Wave Corridor
        </Button>
      </div>
    </div>
  )
}

