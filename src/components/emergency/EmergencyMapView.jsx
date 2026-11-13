import React, { useState, useMemo } from 'react'
import { Zap } from 'lucide-react'
import { useTraffic } from '../../context/TrafficContext'
import {
  TrafficMapContainer,
  EmergencyCorridorLayer,
  RoadNetworkDigitalTwinLayer,
  IncidentLayer,
} from '../map'
import {
  calculateEmergencyCorridor,
  DEFAULT_MAP_CENTER,
  BELAGAVI_NODES,
  BENGALURU_NODES,
} from '../../services/roadNetworkData'

/**
 * Interactive Emergency Map View for Emergency Dashboard
 *
 * Powered by React, Leaflet, React-Leaflet, and OpenStreetMap.
 * Features:
 * - Real geographic green wave corridor visualization
 * - Downstream signal preemption (all corridor signals locked GREEN)
 * - Conflicting cross-street signals locked RED
 * - Real-time animated strobe siren emergency vehicle
 * - Vehicle switcher (Ambulance, Fire Engine, Rapid Rescue)
 * - Live telemetry and ETA comparison
 */
export default function EmergencyMapView() {
  const { emergencyDispatches, liveSimulationTick, intersections, incidents } = useTraffic()

  const [vehicleType, setVehicleType] = useState('ambulance')
  const [originNodeId, setOriginNodeId] = useState('BGM-101') // Rani Chennamma Circle
  const [destinationNodeId, setDestinationNodeId] = useState('BGM-106') // JCER Campus Corridor
  const [isPreemptionActive, setIsPreemptionActive] = useState(true)

  // Compute emergency corridor
  const corridorData = useMemo(() => {
    return calculateEmergencyCorridor({
      vehicleType,
      originNodeId,
      destinationNodeId,
    })
  }, [vehicleType, originNodeId, destinationNodeId])

  const preemptedNodeIds = isPreemptionActive && corridorData ? corridorData.preemptedNodeIds : []
  const conflictingNodeIds = isPreemptionActive && corridorData ? corridorData.conflictingNodeIds : []

  // Center on corridor
  const mapCenter = useMemo(() => {
    if (corridorData?.latLngs && corridorData.latLngs.length > 0) {
      const midIdx = Math.floor(corridorData.latLngs.length / 2)
      return corridorData.latLngs[midIdx]
    }
    return DEFAULT_MAP_CENTER
  }, [corridorData])

  return (
    <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl flex flex-col">
      <TrafficMapContainer
        center={mapCenter}
        zoom={14}
        title="Emergency Corridor Preemption Visualizer"
        subtitle={`Target Unit: ${corridorData?.unit?.code || 'MED-12'} | Downstream: 100% Green Priority`}
        showLayerControls={false}
        height="440px"
        headerActions={
          <div className="flex items-center gap-2">
            {/* Vehicle Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setVehicleType('ambulance')}
                className={`px-2.5 py-1 rounded-lg font-mono transition-all cursor-pointer ${
                  vehicleType === 'ambulance'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Ambulance
              </button>
              <button
                type="button"
                onClick={() => setVehicleType('fire_engine')}
                className={`px-2.5 py-1 rounded-lg font-mono transition-all cursor-pointer ${
                  vehicleType === 'fire_engine'
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Fire Engine
              </button>
            </div>

            {/* Preemption Toggle */}
            <button
              type="button"
              onClick={() => setIsPreemptionActive(!isPreemptionActive)}
              className={`px-3 py-1 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isPreemptionActive
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isPreemptionActive ? 'SIGNALS LOCKED' : 'STANDBY'}</span>
            </button>
          </div>
        }
      >
        {/* Road Network Digital Twin with locked green and conflicting red signals */}
        <RoadNetworkDigitalTwinLayer
          intersections={intersections}
          preemptedNodeIds={preemptedNodeIds}
          conflictingNodeIds={conflictingNodeIds}
          liveTick={liveSimulationTick}
          showSignals={true}
          showEdges={true}
        />

        {/* Incident Layer */}
        <IncidentLayer incidents={incidents} />

        {/* Emergency Green Wave Corridor with Moving Strobe Siren Vehicle */}
        <EmergencyCorridorLayer
          corridorData={corridorData}
          isPreemptionActive={isPreemptionActive}
          liveTick={liveSimulationTick}
        />
      </TrafficMapContainer>

      {/* Real-Time Normal vs Emergency ETA Comparison Footer Banner */}
      {corridorData && corridorData.success && (
        <div className="p-3.5 bg-slate-900/95 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="flex items-center justify-between sm:justify-start gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px]">Normal Civilian ETA:</span>
            <span className="text-sm font-bold text-slate-300 font-mono">
              {corridorData.normalEtaMinutes} min
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-3 bg-slate-950 p-2.5 rounded-xl border border-emerald-500/30">
            <span className="text-emerald-400 text-[10px] font-bold">Emergency Preempted ETA:</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">
              {corridorData.emergencyEtaMinutes} min
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-3 bg-slate-950 p-2.5 rounded-xl border border-cyan-500/30">
            <span className="text-cyan-400 text-[10px] font-bold">Critical Time Gain:</span>
            <span className="text-sm font-bold text-cyan-300 font-mono">
              -{corridorData.timeSavedMinutes}m ({corridorData.pctSaved}% faster)
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
