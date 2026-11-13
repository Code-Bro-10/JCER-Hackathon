import React, { useState, useMemo } from 'react'
import {
  Camera,
  Sliders,
} from 'lucide-react'
import { Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { useTraffic } from '../../context/TrafficContext'
import {
  TrafficMapContainer,
  RoadNetworkDigitalTwinLayer,
  TrafficCongestionLayer,
  IncidentLayer,
  RoadClosureSimulator,
} from '../map'
import { DEFAULT_MAP_CENTER, getNodeLatLng } from '../../services/roadNetworkData'

/**
 * Creates custom camera DivIcon for Leaflet
 */
function createCameraIcon(camId) {
  const html = `
    <div class="relative flex items-center justify-center p-1.5 rounded-lg bg-slate-900/95 border border-cyan-500/60 text-cyan-300 hover:bg-cyan-500 hover:text-black hover:scale-125 shadow-lg shadow-cyan-950 transition-all cursor-pointer">
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
        <circle cx="12" cy="13" r="3"></circle>
      </svg>
      <span class="absolute -top-1 -right-1 flex h-2 w-2">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
      </span>
    </div>
  `

  return L.divIcon({
    className: 'cctv-marker-div',
    html,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  })
}

/**
 * Interactive City Map for TrafficAI Dashboard Overview
 *
 * Full interactive city map powered by Leaflet, React-Leaflet, and OpenStreetMap.
 * Features:
 * - Real-time Digital Twin road network graph (intersections & directed segments)
 * - Congestion markers & V/C bottleneck indicators
 * - Incident markers with severity radar pulses and popup details
 * - Moving simulated traffic platoons
 * - CCTV edge camera nodes
 * - Interactive Accident & Road Closure Simulator with LWR shockwave analysis
 * - Seamless toggle between Leaflet Geographic Engine and Schematic Vector view
 */
export default function InteractiveCityMap() {
  const {
    intersections,
    incidents,
    setActiveCameraModal,
    activeSector,
    setCurrentPage,
    liveSimulationTick,
    addToast,
  } = useTraffic()

  // Layer filter states
  const [showSignals, setShowSignals] = useState(true)
  const [showCongestion, setShowCongestion] = useState(true)
  const [showIncidents, setShowIncidents] = useState(true)
  const [showCameras, setShowCameras] = useState(true)

  // Engine view mode: 'leaflet' (default OSM) | 'schematic' (legacy vector grid)
  const [engineMode, setEngineMode] = useState('leaflet')

  // Simulation controls state
  const [simulatorOpen, setSimulatorOpen] = useState(false)
  const [activeSimulation, setActiveSimulation] = useState({
    closedEdgeIds: [],
    shockwaveNodeIds: [],
    diversionPath: [],
  })

  // Selected node inspection
  const [selectedNodeId, setSelectedNodeId] = useState(null)

  // Camera node mappings on real coordinates
  const cameraNodes = useMemo(() => [
    { camId: 'CAM-DOWNTOWN-01', nodeId: 'INT-101', name: 'Grand Central & 5th St' },
    { camId: 'CAM-PORT-03', nodeId: 'INT-102', name: 'Port Blvd & Marina Bridge' },
    { camId: 'CAM-CENTRAL-02', nodeId: 'INT-103', name: 'Financial Way & Metro Square' },
    { camId: 'CAM-TECH-01', nodeId: 'INT-104', name: 'Tech Parkway & Innovation Blvd' },
    { camId: 'CAM-RIVERSIDE-01', nodeId: 'INT-105', name: 'Riverside Dr & 12th Avenue' },
  ], [])

  const handleToggleLayer = (layerKey) => {
    if (layerKey === 'showSignals') setShowSignals(!showSignals)
    if (layerKey === 'showCongestion') setShowCongestion(!showCongestion)
    if (layerKey === 'showIncidents') setShowIncidents(!showIncidents)
  }

  const handleApplyClosureSimulation = ({ edgeId, isClosed, lanesBlocked, shockwaveNodeIds, diversionPath, report }) => {
    setActiveSimulation({
      closedEdgeIds: isClosed ? [edgeId] : [],
      shockwaveNodeIds,
      diversionPath,
    })
    addToast({
      type: 'critical',
      title: 'Road Blockage Simulation Engaged',
      message: `${edgeId} closure active. Upstream spillback risk calculated across ${shockwaveNodeIds.length} intersections.`,
    })
  }

  const handleClearSimulation = () => {
    setActiveSimulation({
      closedEdgeIds: [],
      shockwaveNodeIds: [],
      diversionPath: [],
    })
    addToast({
      type: 'info',
      title: 'Simulation Cleared',
      message: 'Network restored to live operational baseline.',
    })
  }

  const handleSelectOrigin = (nodeId) => {
    addToast({
      type: 'success',
      title: 'Origin Point Set',
      message: `Node ${nodeId} selected. Routing engine ready.`,
    })
    setCurrentPage('route')
  }

  const handleSelectDestination = (nodeId) => {
    addToast({
      type: 'success',
      title: 'Destination Point Set',
      message: `Node ${nodeId} selected. Routing engine ready.`,
    })
    setCurrentPage('route')
  }

  return (
    <div className="space-y-4">
      {/* Interactive Leaflet City Map */}
      <TrafficMapContainer
        center={DEFAULT_MAP_CENTER}
        zoom={14}
        title="Autonomous Grid Digital Twin"
        subtitle={`Sector: ${activeSector} | Active Nodes: 10 | Live Telemetry: OSM`}
        showLayerControls={true}
        layerStates={{
          showSignals,
          showCongestion,
          showIncidents,
        }}
        onToggleLayer={handleToggleLayer}
        height="540px"
        headerActions={
          <div className="flex items-center gap-1.5">
            {/* CCTV Toggle */}
            <button
              type="button"
              onClick={() => setShowCameras(!showCameras)}
              className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                showCameras
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
              title="Toggle CCTV Vision Feeds"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>CCTV (5)</span>
            </button>

            {/* Accident / Closure Simulator Drawer Toggle */}
            <button
              type="button"
              onClick={() => setSimulatorOpen(!simulatorOpen)}
              className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                simulatorOpen || activeSimulation.closedEdgeIds.length > 0
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Open Accident & Road Closure Simulator"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Simulation Controls</span>
              {activeSimulation.closedEdgeIds.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>
          </div>
        }
      >
        {/* 1. Road Network Digital Twin (Nodes, Edges, Live Platoons) */}
        <RoadNetworkDigitalTwinLayer
          intersections={intersections}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
          onSelectOrigin={handleSelectOrigin}
          onSelectDestination={handleSelectDestination}
          onSimulateClosure={(edgeId) => setSimulatorOpen(true)}
          closedEdgeIds={activeSimulation.closedEdgeIds}
          preemptedNodeIds={activeSimulation.diversionPath}
          conflictingNodeIds={activeSimulation.shockwaveNodeIds}
          liveTick={liveSimulationTick}
          showSignals={showSignals}
          showEdges={true}
        />

        {/* 2. Congestion Layer (V/C Ratios and Corridor Badges) */}
        <TrafficCongestionLayer showCongestion={showCongestion} />

        {/* 3. Incident Layer (Accidents, Hazards, Roadwork with Radar Pulses) */}
        {showIncidents && (
          <IncidentLayer
            incidents={incidents}
            activeSector={activeSector}
            onSimulateImpact={(inc) => setSimulatorOpen(true)}
          />
        )}

        {/* 4. CCTV Camera Markers on the Map */}
        {showCameras &&
          cameraNodes.map((cam) => {
            const pos = getNodeLatLng(cam.nodeId)
            if (!pos) return null

            // Offset camera slightly from node center so both are easily clickable
            const camPos = [pos[0] + 0.0012, pos[1] + 0.0016]
            const icon = createCameraIcon(cam.camId)

            return (
              <Marker
                key={cam.camId}
                position={camPos}
                icon={icon}
                eventHandlers={{
                  click: () => setActiveCameraModal(cam.camId),
                }}
              >
                <Tooltip direction="top" offset={[0, -12]}>
                  <div className="text-[10px] font-mono">
                    <span className="font-bold text-cyan-300">{cam.camId}</span>
                    <span className="text-slate-400 block">{cam.name} (Click to stream)</span>
                  </div>
                </Tooltip>
              </Marker>
            )
          })}
      </TrafficMapContainer>

      {/* Accident and Road Closure Control Panel */}
      {simulatorOpen && (
        <RoadClosureSimulator
          isOpen={simulatorOpen}
          onClose={() => setSimulatorOpen(false)}
          onApplySimulation={handleApplyClosureSimulation}
          onClearSimulation={handleClearSimulation}
        />
      )}
    </div>
  )
}
