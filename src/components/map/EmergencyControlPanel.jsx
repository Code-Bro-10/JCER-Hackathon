import React from 'react'
import { Siren, Zap } from 'lucide-react'
import { DEMO_NODES } from '../../services/roadNetworkData'

/**
 * Emergency Routing & Signal Preemption Control Panel with Normal vs Emergency ETA
 *
 * @param {object} props
 * @param {string} props.vehicleType - 'ambulance' | 'fire_engine' | 'police'
 * @param {function} props.onVehicleTypeChange - Callback
 * @param {string} props.originNodeId - Origin station node ID
 * @param {function} props.onOriginNodeChange - Callback
 * @param {string} props.destinationNodeId - Destination incident scene node ID
 * @param {function} props.onDestinationNodeChange - Callback
 * @param {boolean} props.isPreemptionActive - Signal preemption toggle
 * @param {function} props.onTogglePreemption - Callback
 * @param {object} props.corridorData - Calculated corridor report
 * @param {string} [props.className='']
 */
export default function EmergencyControlPanel({
  vehicleType = 'ambulance',
  onVehicleTypeChange = () => {},
  originNodeId = 'INT-105',
  onOriginNodeChange = () => {},
  destinationNodeId = 'INT-104',
  onDestinationNodeChange = () => {},
  isPreemptionActive = true,
  onTogglePreemption = () => {},
  corridorData = null,
  className = '',
}) {
  return (
    <div className={`rounded-2xl bg-slate-900/95 border border-slate-800 p-4 shadow-2xl backdrop-blur-md space-y-4 ${className}`}>
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400">
            <Siren className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Emergency Green Wave & Priority Response
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono">
                {corridorData?.unit?.priorityLevel || 'CODE RED'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Corridor locking for rapid medical and fire response transit.
            </p>
          </div>
        </div>

        {/* Preemption Toggle Button */}
        <button
          type="button"
          onClick={onTogglePreemption}
          className={`px-3.5 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            isPreemptionActive
              ? 'bg-emerald-500 text-black border-emerald-400 shadow-lg shadow-emerald-500/30'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Zap className={`w-3.5 h-3.5 ${isPreemptionActive ? 'text-black' : 'text-slate-500'}`} />
          <span>{isPreemptionActive ? 'GREEN WAVE ACTIVE' : 'PREEMPTION OFF'}</span>
        </button>
      </div>

      {/* Selectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {/* 1. Vehicle Selector */}
        <div>
          <label className="block font-mono text-slate-300 mb-1.5 font-semibold">
            Emergency Service Unit:
          </label>
          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => onVehicleTypeChange('ambulance')}
              className={`py-1.5 rounded-lg font-mono text-[11px] transition-all cursor-pointer ${
                vehicleType === 'ambulance'
                  ? 'bg-rose-500/20 border border-rose-500/50 text-rose-300 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ambulance
            </button>
            <button
              type="button"
              onClick={() => onVehicleTypeChange('fire_engine')}
              className={`py-1.5 rounded-lg font-mono text-[11px] transition-all cursor-pointer ${
                vehicleType === 'fire_engine'
                  ? 'bg-orange-500/20 border border-orange-500/50 text-orange-300 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Fire Engine
            </button>
            <button
              type="button"
              onClick={() => onVehicleTypeChange('police')}
              className={`py-1.5 rounded-lg font-mono text-[11px] transition-all cursor-pointer ${
                vehicleType === 'police'
                  ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Police
            </button>
          </div>
        </div>

        {/* 2. Dispatch Origin Station */}
        <div>
          <label className="block font-mono text-slate-300 mb-1.5 font-semibold">
            Dispatch Origin Station:
          </label>
          <select
            value={originNodeId}
            onChange={(e) => onOriginNodeChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-rose-500 text-xs"
          >
            {DEMO_NODES.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name} ({n.id})
              </option>
            ))}
          </select>
        </div>

        {/* 3. Emergency Scene Destination */}
        <div>
          <label className="block font-mono text-slate-300 mb-1.5 font-semibold">
            Emergency Scene Destination:
          </label>
          <select
            value={destinationNodeId}
            onChange={(e) => onDestinationNodeChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-rose-500 text-xs"
          >
            {DEMO_NODES.filter((n) => n.id !== originNodeId).map((n) => (
              <option key={n.id} value={n.id}>
                {n.name} ({n.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Requirement 12: Compare Normal and Emergency ETA */}
      {corridorData && corridorData.success && (
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200 uppercase tracking-wider">
            <span>Telemetry: Real-Time ETA Differential</span>
            <span className="text-emerald-400 font-mono text-[11px]">
              {corridorData.signalsPreemptedCount} Signals Locked Green
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Normal Civilian ETA */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">
                Normal Civilian ETA
              </span>
              <div className="text-2xl font-extrabold text-slate-300 font-mono">
                {corridorData.normalEtaMinutes} <span className="text-xs text-slate-500">mins</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Congestion speed ~38 km/h + red signal wait cycles
              </div>
            </div>

            {/* Emergency Priority ETA */}
            <div className="bg-slate-950 p-3 rounded-xl border border-emerald-500/40 space-y-1 relative overflow-hidden">
              <div className="absolute top-1 right-2 text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                CORRIDOR CLEAR
              </div>
              <span className="text-[10px] font-mono text-emerald-400 block uppercase font-bold">
                Preempted Emergency ETA
              </span>
              <div className="text-2xl font-extrabold text-emerald-400 font-mono">
                {corridorData.emergencyEtaMinutes} <span className="text-xs text-emerald-500">mins</span>
              </div>
              <div className="text-[10px] text-emerald-400/80 font-mono">
                Continuous green clearance + siren priority (~68 km/h)
              </div>
            </div>

            {/* Critical Time Delta Saved */}
            <div className="bg-slate-950 p-3 rounded-xl border border-cyan-500/40 space-y-1">
              <span className="text-[10px] font-mono text-cyan-400 block uppercase font-bold">
                Critical Response Gain
              </span>
              <div className="text-2xl font-extrabold text-cyan-300 font-mono flex items-center gap-1.5">
                <span>-{corridorData.timeSavedMinutes}m</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {corridorData.pctSaved}% FASTER
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Golden hour survivability index: <span className="text-emerald-400 font-bold">OPTIMAL</span>
              </div>
            </div>
          </div>

          {/* Preemption Status Broadcast Banner */}
          <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-emerald-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span>
                PREEMPTION PATH: {corridorData.pathNodes.join(' ➔ ')}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              {corridorData.distanceKm} km total corridor length
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
