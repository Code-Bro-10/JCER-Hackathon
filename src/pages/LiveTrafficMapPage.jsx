import React, { useState, useMemo, useEffect } from 'react'
import {
  MapPin,
  AlertTriangle,
  Camera,
  Layers,
  Radio,
  Sliders,
  RotateCcw,
  Navigation,
  Info,
  ShieldAlert,
  Flame,
  CheckCircle,
  ExternalLink,
  Video,
} from 'lucide-react'
import { Marker, Tooltip, Popup } from 'react-leaflet'
import L from 'leaflet'
import { useTraffic } from '../context/TrafficContext'
import {
  TrafficMapContainer,
  RoadNetworkDigitalTwinLayer,
  TrafficCongestionLayer,
  IncidentLayer,
  RoadClosureSimulator,
  CameraLayer,
} from '../components/map'
import { trafficService } from '../services/api'
import {
  DEFAULT_MAP_CENTER,
  getNodeLatLng,
  BENGALURU_NODES,
  BENGALURU_EDGES,
  ALL_NODES,
} from '../services/roadNetworkData'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'

/**
 * Custom Camera Icon for Leaflet
 */
function createCameraIcon() {
  return L.divIcon({
    className: 'cctv-marker-div',
    html: `
      <div class="p-1 rounded bg-slate-900 border border-blue-400 text-blue-300 shadow hover:scale-110 cursor-pointer flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}

export default function LiveTrafficMapPage() {
  const {
    intersections,
    incidents,
    setActiveCameraModal,
    activeSector,
    setCurrentPage,
    liveSimulationTick,
    addToast,
  } = useTraffic()

  // Layer filter toggles
  const [showSignals, setShowSignals] = useState(true)
  const [showCongestion, setShowCongestion] = useState(true)
  const [showIncidents, setShowIncidents] = useState(true)
  const [showCameras, setShowCameras] = useState(true)
  const [camerasList, setCamerasList] = useState([])

  useEffect(() => {
    trafficService.getCameras().then((res) => {
      if (res.success && res.data) setCamerasList(res.data)
    })
  }, [])

  // Simulation controls state
  const [simulatorOpen, setSimulatorOpen] = useState(false)
  const [activeSimulation, setActiveSimulation] = useState({
    closedEdgeIds: [],
    shockwaveNodeIds: [],
    diversionPath: [],
  })

  // Selected node inspection
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [selectedMapPoint, setSelectedMapPoint] = useState(null)

  // Camera nodes positioned on Belagavi and regional coordinates
  const cameraNodes = useMemo(() => [
    { camId: 'CAM-BGM-01', nodeId: 'BGM-101', name: 'Rani Chennamma Circle Pan-Tilt CCTV' },
    { camId: 'CAM-BGM-02', nodeId: 'BGM-106', name: 'JCER Campus Gate / Machhe CCTV' },
    { camId: 'CAM-BGM-03', nodeId: 'BGM-104', name: 'Bogarves Junction Traffic Cam' },
    { camId: 'CAM-BGM-04', nodeId: 'BGM-105', name: 'RPD College Cross Tilakwadi Cam' },
    { camId: 'CAM-BGM-05', nodeId: 'BGM-107', name: 'Udyambag Industrial Corridor Cam' },
    { camId: 'CAM-BGM-06', nodeId: 'BGM-109', name: 'KLE Hospital Nehru Nagar Cam' },
    { camId: 'CAM-BLR-01', nodeId: 'BLR-101', name: 'Majestic Central Bus Terminal' },
    { camId: 'CAM-BLR-05', nodeId: 'BLR-105', name: 'Silk Board Junction Flyover' },
  ], [])

  const handleToggleLayer = (layerKey) => {
    if (layerKey === 'showSignals') setShowSignals(!showSignals)
    if (layerKey === 'showCongestion') setShowCongestion(!showCongestion)
    if (layerKey === 'showIncidents') setShowIncidents(!showIncidents)
    if (layerKey === 'showCameras') setShowCameras(!showCameras)
  }

  const handleMapClick = (latlng) => {
    setSelectedMapPoint(latlng)
    addToast({
      type: 'info',
      title: 'Geographic Location Selected',
      message: `Selected Lat: ${latlng.lat.toFixed(4)}, Lon: ${latlng.lng.toFixed(4)}. Ready for routing or reporting.`,
    })
  }

  const handleApplyClosureSimulation = ({ edgeId, isClosed, lanesBlocked, shockwaveNodeIds, diversionPath, report }) => {
    setActiveSimulation({
      closedEdgeIds: isClosed ? [edgeId] : [],
      shockwaveNodeIds,
      diversionPath,
    })
    addToast({
      type: 'critical',
      title: 'Road Blockage Simulation Active',
      message: `${edgeId} closure active. Upstream spillback calculated across ${shockwaveNodeIds.length} intersections.`,
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

  const selectedNode = selectedNodeId ? ALL_NODES.find((n) => n.id === selectedNodeId) : null

  return (
    <div className="space-y-4">
      {/* Top Header & ITS Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Live Geographic Traffic Map
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30">
                BELAGAVI ITS
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time OpenStreetMap cartography, active incident overlays, signal states, and congestion telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={Video}
            onClick={() => setActiveCameraModal('CAM-LOCAL-WEBCAM')}
          >
            Live Webcam
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={Sliders}
            onClick={() => setSimulatorOpen(!simulatorOpen)}
          >
            {simulatorOpen ? 'Hide Impact Simulator' : 'Simulate Road Blockage'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Navigation}
            onClick={() => setCurrentPage('route')}
          >
            Plan Optimized Route
          </Button>
        </div>
      </div>

      {/* Main Interactive Map View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map Canvas (3 cols) */}
        <div className="lg:col-span-3">
          <TrafficMapContainer
            center={DEFAULT_MAP_CENTER}
            zoom={13}
            title="Autonomous Traffic Grid Digital Twin"
            subtitle={`Active Sector: ${activeSector} | Belagavi / Local GPS Grid | OpenStreetMap Live`}
            showLayerControls={true}
            layerStates={{
              showSignals,
              showCongestion,
              showIncidents,
            }}
            onToggleLayer={handleToggleLayer}
            onMapClick={handleMapClick}
            height="620px"
            headerActions={
              <button
                type="button"
                onClick={() => setShowCameras(!showCameras)}
                className={`px-2 py-1 rounded-lg border font-medium flex items-center gap-1 cursor-pointer transition-all ${
                  showCameras
                    ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
                title="Toggle CCTV Vision Feeds"
              >
                <Camera className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">CCTV ({cameraNodes.length})</span>
              </button>
            }
          >
            {/* 1. Road Network Digital Twin (Nodes & Directed Segments) */}
            <RoadNetworkDigitalTwinLayer
              intersections={intersections}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              onSelectOrigin={() => setCurrentPage('route')}
              onSelectDestination={() => setCurrentPage('route')}
              onSimulateClosure={() => setSimulatorOpen(true)}
              closedEdgeIds={activeSimulation.closedEdgeIds}
              preemptedNodeIds={activeSimulation.diversionPath}
              conflictingNodeIds={activeSimulation.shockwaveNodeIds}
              liveTick={liveSimulationTick}
              showSignals={showSignals}
              showEdges={true}
            />

            {/* 2. Congestion Layer (V/C Ratios and Corridor Overlays) */}
            <TrafficCongestionLayer showCongestion={showCongestion} />

            {/* 3. Incident Layer (Accidents, Hazards, Roadwork with Markers) */}
            {showIncidents && (
              <IncidentLayer
                incidents={incidents}
                activeSector={activeSector}
                onSimulateImpact={() => setSimulatorOpen(true)}
              />
            )}

            {/* 4. Live Camera Intelligence & CCTV Markers on OpenStreetMap */}
            <CameraLayer
              cameras={camerasList.length > 0 ? camerasList : undefined}
              showCameras={showCameras}
              onSelectCamera={(cam) => {
                setCurrentPage('camera-intelligence')
              }}
            />
          </TrafficMapContainer>
        </div>

        {/* Side Panel: Selected Node / Point Inspector & Quick Actions (1 col) */}
        <div className="space-y-4">
          {/* Node Inspector Card */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                Intersection Inspector
              </span>
              {selectedNode && <Badge variant="blue" size="sm">{selectedNode.id}</Badge>}
            </div>

            {selectedNode ? (
              <div className="space-y-2.5 text-xs">
                <div>
                  <h4 className="font-semibold text-white text-sm">{selectedNode.name}</h4>
                  <p className="text-slate-400 text-[11px]">{selectedNode.sector} • {selectedNode.city || 'Belagavi'}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Queue N/S:</span>
                    <span className="text-emerald-400 font-bold">
                      {selectedNode.queues?.north || 18} / {selectedNode.queues?.south || 15} veh
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Queue E/W:</span>
                    <span className="text-amber-400 font-bold">
                      {selectedNode.queues?.east || 24} / {selectedNode.queues?.west || 21} veh
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Elevation:</span>
                    <span className="text-slate-300">{selectedNode.elevationMeters || 910}m ASL</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Signal Mode:</span>
                    <span className="text-blue-400">Adaptive (Webster)</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      addToast({ type: 'success', title: 'Route Departure Set', message: `Origin: ${selectedNode.name}` })
                      setCurrentPage('route')
                    }}
                  >
                    Set as Route Origin
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      addToast({ type: 'success', title: 'Route Destination Set', message: `Destination: ${selectedNode.name}` })
                      setCurrentPage('route')
                    }}
                  >
                    Set as Route Target
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-500 space-y-1.5">
                <Info className="w-6 h-6 mx-auto text-slate-600" />
                <p className="text-xs">Click any intersection marker or road on the map to inspect live queue depths and geometry.</p>
              </div>
            )}
          </div>

          {/* Active Incidents Summary Box */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                Active Map Incidents
              </span>
              <Badge variant="rose" size="sm">{incidents.length}</Badge>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {incidents.slice(0, 4).map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => setCurrentPage('incidents')}
                  className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs truncate max-w-[150px]">{inc.title}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                      inc.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {inc.severity}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 truncate">{inc.location}</div>
                  <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                    <span>Delay: ~{inc.estimatedDelay || '15 mins'}</span>
                    <span>Status: {inc.status}</span>
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="secondary"
              size="sm"
              className="w-full text-xs"
              onClick={() => setCurrentPage('incidents')}
            >
              Report / Manage Incidents
            </Button>
          </div>

          {/* Data Transparency Disclosure Card */}
          <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-3 text-[11px] space-y-1 text-slate-400">
            <div className="font-semibold text-slate-300 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              Data Source Transparency
            </div>
            <p className="text-[10px] leading-relaxed">
              • Real map geometry: OpenStreetMap contributors<br />
              • Real routing: Project-OSRM public service<br />
              • Real geocoding: Nominatim OSM service<br />
              • Road queue metrics: Calibrated ITS demo baseline
            </p>
          </div>
        </div>
      </div>

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

