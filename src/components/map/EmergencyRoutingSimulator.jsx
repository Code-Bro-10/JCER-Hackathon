import React, { useState, useMemo } from 'react'
import TrafficMapContainer from './TrafficMapContainer'
import EmergencyCorridorLayer from './EmergencyCorridorLayer'
import EmergencyControlPanel from './EmergencyControlPanel'
import RoadNetworkDigitalTwinLayer from './RoadNetworkDigitalTwinLayer'
import IncidentLayer from './IncidentLayer'
import {
  calculateEmergencyCorridor,
  DEFAULT_MAP_CENTER,
} from '../../services/roadNetworkData'
import { useTraffic } from '../../context/TrafficContext'

/**
 * All-In-One Emergency Routing & Green Wave Preemption Simulator
 *
 * Integrates Leaflet cartography, live corridor locking, downstream green signals,
 * moving strobe ambulance/fire engine, and real-time Normal vs Emergency ETA comparison.
 */
export default function EmergencyRoutingSimulator({
  closedEdgeIds = [],
  className = '',
}) {
  const { intersections, incidents, liveSimulationTick } = useTraffic()

  const [vehicleType, setVehicleType] = useState('ambulance')
  const [originNodeId, setOriginNodeId] = useState('INT-105') // Riverside Dr Substation
  const [destinationNodeId, setDestinationNodeId] = useState('INT-104') // Tech Parkway Incident
  const [isPreemptionActive, setIsPreemptionActive] = useState(true)

  // Compute emergency corridor
  const corridorData = useMemo(() => {
    return calculateEmergencyCorridor({
      vehicleType,
      originNodeId,
      destinationNodeId,
      closedEdgeIds,
    })
  }, [vehicleType, originNodeId, destinationNodeId, closedEdgeIds])

  const preemptedNodeIds = isPreemptionActive && corridorData ? corridorData.preemptedNodeIds : []
  const conflictingNodeIds = isPreemptionActive && corridorData ? corridorData.conflictingNodeIds : []

  // Center on corridor midpoint or default
  const mapCenter = useMemo(() => {
    if (corridorData?.latLngs && corridorData.latLngs.length > 0) {
      const midIdx = Math.floor(corridorData.latLngs.length / 2)
      return corridorData.latLngs[midIdx]
    }
    return DEFAULT_MAP_CENTER
  }, [corridorData])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 1. Interactive Control Panel with Vehicle Selector & Normal vs Emergency ETA */}
      <EmergencyControlPanel
        vehicleType={vehicleType}
        onVehicleTypeChange={setVehicleType}
        originNodeId={originNodeId}
        onOriginNodeChange={setOriginNodeId}
        destinationNodeId={destinationNodeId}
        onDestinationNodeChange={setDestinationNodeId}
        isPreemptionActive={isPreemptionActive}
        onTogglePreemption={() => setIsPreemptionActive(!isPreemptionActive)}
        corridorData={corridorData}
      />

      {/* 2. Interactive Leaflet Emergency Map */}
      <TrafficMapContainer
        center={mapCenter}
        zoom={14}
        title="Emergency Rapid Response Grid"
        subtitle={`Preemption: ${isPreemptionActive ? 'LOCKED GREEN WAVE' : 'STANDBY'} | Target: ${corridorData?.unit?.code || 'UNIT'}`}
        height="480px"
        showLayerControls={false}
      >
        {/* Road Network Digital Twin (Nodes & Edges with Emergency Preempted Signal highlights) */}
        <RoadNetworkDigitalTwinLayer
          intersections={intersections}
          preemptedNodeIds={preemptedNodeIds}
          conflictingNodeIds={conflictingNodeIds}
          closedEdgeIds={closedEdgeIds}
          liveTick={liveSimulationTick}
          showSignals={true}
          showEdges={true}
        />

        {/* Active Incidents */}
        <IncidentLayer incidents={incidents} />

        {/* High-Priority Emergency Corridor with Moving Strobe Siren Vehicle */}
        <EmergencyCorridorLayer
          corridorData={corridorData}
          isPreemptionActive={isPreemptionActive}
          liveTick={liveSimulationTick}
        />
      </TrafficMapContainer>
    </div>
  )
}
