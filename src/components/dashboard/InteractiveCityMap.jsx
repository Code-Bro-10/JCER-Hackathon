import React, { useState } from 'react'
import {
  Layers,
  Camera,
  AlertTriangle,
  Radio,
  Zap,
  Info,
  Maximize2,
  Minimize2,
  Navigation,
  Compass,
} from 'lucide-react'
import { useTraffic } from '../../context/TrafficContext'
import Badge from '../common/Badge'
import Button from '../common/Button'

export default function InteractiveCityMap() {
  const {
    intersections,
    incidents,
    setActiveCameraModal,
    activeSector,
    setCurrentPage,
    liveSimulationTick,
  } = useTraffic()

  const [selectedNode, setSelectedNode] = useState(null)
  const [showCameras, setShowCameras] = useState(true)
  const [showIncidents, setShowIncidents] = useState(true)
  const [showSignals, setShowSignals] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(1)

  // Map coordinates of intersections
  const nodeCoordinates = [
    { id: 'INT-101', name: 'Grand Central Ave & 5th St', x: 45, y: 35, sector: 'Downtown Grid', camId: 'CAM-DOWNTOWN-01' },
    { id: 'INT-102', name: 'Port Blvd & Marina Bridge', x: 75, y: 48, sector: 'East Port Expressway', camId: 'CAM-PORT-03' },
    { id: 'INT-103', name: 'Financial Way & Metro Square', x: 50, y: 50, sector: 'Metropolis Central', camId: 'CAM-CENTRAL-02' },
    { id: 'INT-104', name: 'Tech Parkway & Innovation Blvd', x: 25, y: 20, sector: 'North Tech Corridor', camId: 'CAM-TECH-01' },
    { id: 'INT-105', name: 'Riverside Dr & 12th Avenue', x: 22, y: 65, sector: 'West Riverside', camId: 'CAM-RIVERSIDE-01' },
  ]

  const filteredIncidents = incidents.filter(
    (inc) => inc.status !== 'Resolved' && (activeSector === 'All Sectors' || inc.sector === activeSector)
  )

  return (
    <div className="relative w-full rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl flex flex-col">
      {/* Top Map Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Autonomous Grid Digital Twin
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                LIVE TELEMETRY
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Sector: <span className="text-cyan-400 font-semibold">{activeSector}</span> | Active nodes: 112
            </p>
          </div>
        </div>

        {/* Layer Filters */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setShowSignals(!showSignals)}
            className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
              showSignals
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Signals</span>
          </button>

          <button
            type="button"
            onClick={() => setShowIncidents(!showIncidents)}
            className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
              showIncidents
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Incidents ({filteredIncidents.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCameras(!showCameras)}
            className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
              showCameras
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>CCTV (6)</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 ml-2 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.2))}
              className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              title="Zoom out"
            >
              -
            </button>
            <span className="text-[10px] font-mono px-1 text-slate-300">{Math.round(zoomLevel * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.2))}
              className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              title="Zoom in"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Map Visual Area */}
      <div className="relative w-full h-[460px] sm:h-[520px] bg-slate-950 overflow-hidden cursor-crosshair select-none">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(#06b6d4 0.75px, transparent 0.75px), radial-gradient(#1e293b 0.75px, #030712 0.75px)',
            backgroundSize: '24px 24px',
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'center center',
          }}
        />

        {/* SVG Road network */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1000 600"
          preserveAspectRatio="none"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center', transition: 'transform 0.2s' }}
        >
          <defs>
            <linearGradient id="roadGradCyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0891b2" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="roadGradRed" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e11d48" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#fb7185" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="roadGradYellow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.8" />
            </linearGradient>
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer City Ring Road Highway */}
          <rect
            x="80"
            y="60"
            width="840"
            height="480"
            rx="40"
            fill="none"
            stroke="#1e293b"
            strokeWidth="14"
          />
          <rect
            x="80"
            y="60"
            width="840"
            height="480"
            rx="40"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="3"
            strokeDasharray="12 8"
            className="opacity-70"
          />

          {/* East-West Arterial 1 (North Highway) */}
          <line x1="80" y1="180" x2="920" y2="180" stroke="#1e293b" strokeWidth="12" />
          <line x1="80" y1="180" x2="920" y2="180" stroke="#10b981" strokeWidth="2" strokeDasharray="8 6" />

          {/* East-West Arterial 2 (Central Market St - Congested Area) */}
          <line x1="80" y1="300" x2="920" y2="300" stroke="#1e293b" strokeWidth="16" />
          <line
            x1="320"
            y1="300"
            x2="580"
            y2="300"
            stroke="url(#roadGradRed)"
            strokeWidth="8"
            filter="url(#neonGlow)"
          />
          <line x1="80" y1="300" x2="320" y2="300" stroke="#06b6d4" strokeWidth="2" strokeDasharray="8 6" />
          <line x1="580" y1="300" x2="920" y2="300" stroke="#06b6d4" strokeWidth="2" strokeDasharray="8 6" />

          {/* East-West Arterial 3 (South Ring Connector) */}
          <line x1="80" y1="420" x2="920" y2="420" stroke="#1e293b" strokeWidth="12" />
          <line x1="80" y1="420" x2="920" y2="420" stroke="#0ea5e9" strokeWidth="2" strokeDasharray="8 6" />

          {/* North-South Avenue 1 (West River Dr) */}
          <line x1="220" y1="60" x2="220" y2="540" stroke="#1e293b" strokeWidth="12" />
          <line x1="220" y1="60" x2="220" y2="540" stroke="#10b981" strokeWidth="2" strokeDasharray="8 6" />

          {/* North-South Avenue 2 (Grand Central Ave) */}
          <line x1="450" y1="60" x2="450" y2="540" stroke="#1e293b" strokeWidth="16" />
          <line
            x1="450"
            y1="220"
            x2="450"
            y2="380"
            stroke="url(#roadGradYellow)"
            strokeWidth="7"
            filter="url(#neonGlow)"
          />
          <line x1="450" y1="60" x2="450" y2="220" stroke="#06b6d4" strokeWidth="2" strokeDasharray="8 6" />
          <line x1="450" y1="380" x2="450" y2="540" stroke="#06b6d4" strokeWidth="2" strokeDasharray="8 6" />

          {/* North-South Avenue 3 (East Port Expressway) */}
          <line x1="720" y1="60" x2="720" y2="540" stroke="#1e293b" strokeWidth="14" />
          <line x1="720" y1="60" x2="720" y2="540" stroke="#06b6d4" strokeWidth="2" strokeDasharray="8 6" />

          {/* Diagonal Port Flyover */}
          <path
            d="M 450,300 Q 600,380 720,420"
            fill="none"
            stroke="#0284c7"
            strokeWidth="6"
            strokeDasharray="6 4"
            className="opacity-80"
          />

          {/* Simulated Moving Traffic Platoons (Circles moving with simulation tick) */}
          <circle
            cx={80 + ((liveSimulationTick * 25) % 840)}
            cy="180"
            r="4"
            fill="#34d399"
            filter="url(#neonGlow)"
          />
          <circle
            cx={920 - ((liveSimulationTick * 18) % 840)}
            cy="420"
            r="4"
            fill="#38bdf8"
            filter="url(#neonGlow)"
          />
          <circle
            cx="450"
            cy={60 + ((liveSimulationTick * 14) % 480)}
            r="4.5"
            fill="#fbbf24"
            filter="url(#neonGlow)"
          />
          <circle
            cx="220"
            cy={540 - ((liveSimulationTick * 22) % 480)}
            r="4"
            fill="#34d399"
            filter="url(#neonGlow)"
          />
          <circle
            cx="720"
            cy={60 + ((liveSimulationTick * 20) % 480)}
            r="4"
            fill="#38bdf8"
            filter="url(#neonGlow)"
          />
        </svg>

        {/* DOM Overlays for Nodes, Intersections, CCTV, Incidents */}
        <div
          className="absolute inset-0"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center', transition: 'transform 0.2s' }}
        >
          {/* Intersection Nodes */}
          {showSignals &&
            nodeCoordinates.map((node) => {
              const liveData = intersections.find((i) => i.id === node.id)
              const isGreen = liveData ? liveData.currentPhase.includes('Green') : true
              const isSelected = selectedNode?.id === node.id

              return (
                <div
                  key={node.id}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  onClick={() => setSelectedNode({ ...node, ...liveData })}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                >
                  <div className="relative flex items-center justify-center">
                    {/* Pulsing beacon */}
                    <span
                      className={`animate-ping absolute inline-flex h-8 w-8 rounded-full opacity-60 ${
                        isGreen ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    <div
                      className={`relative flex items-center justify-center w-7 h-7 rounded-full border-2 transition-transform duration-200 group-hover:scale-125 shadow-lg ${
                        isGreen
                          ? 'bg-slate-900 border-emerald-400 text-emerald-400 shadow-emerald-500/40'
                          : 'bg-slate-900 border-amber-400 text-amber-400 shadow-amber-500/40'
                      } ${isSelected ? 'ring-4 ring-cyan-400 scale-125' : ''}`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Node Tooltip Label */}
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center pointer-events-none whitespace-nowrap z-30">
                    <div className="px-2 py-1 rounded bg-slate-900/95 border border-slate-700 text-[10px] text-white font-mono shadow-xl">
                      <div className="font-bold text-cyan-300">{node.id}</div>
                      <div>{node.name}</div>
                      <div className={isGreen ? 'text-emerald-400' : 'text-amber-400'}>
                        {liveData?.currentPhase || 'Cycle Active'} ({liveData?.secondsRemaining || 24}s)
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

          {/* Camera Markers */}
          {showCameras &&
            nodeCoordinates.map((node) => (
              <button
                key={`cam-${node.id}`}
                type="button"
                style={{ left: `${node.x + 3}%`, top: `${node.y - 4}%` }}
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveCameraModal(node.camId)
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-slate-900/90 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500 hover:text-black hover:scale-110 shadow-lg shadow-cyan-950/80 transition-all cursor-pointer z-20"
                title={`Open CCTV Stream: ${node.camId}`}
              >
                <Camera className="w-3 h-3" />
              </button>
            ))}

          {/* Incident Hotspots */}
          {showIncidents &&
            filteredIncidents.map((inc) => (
              <div
                key={inc.id}
                style={{ left: `${inc.coordinates.x}%`, top: `${inc.coordinates.y}%` }}
                onClick={() => setCurrentPage('incidents')}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
              >
                <div className="relative flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-9 w-9 rounded-full bg-rose-500 opacity-75" />
                  <div className="relative p-2 rounded-xl bg-rose-950/90 border-2 border-rose-500 text-rose-400 shadow-xl shadow-rose-950/80 group-hover:scale-125 transition-transform">
                    <AlertTriangle className="w-4 h-4 animate-bounce" />
                  </div>
                </div>

                <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center pointer-events-none whitespace-nowrap z-30">
                  <div className="px-2 py-1 rounded bg-rose-950/95 border border-rose-500 text-[10px] text-rose-200 font-semibold shadow-xl">
                    {inc.typeName}: {inc.location}
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Selected Intersection Info Card (Overlay in Bottom Left) */}
        {selectedNode && (
          <div className="absolute bottom-4 left-4 z-30 max-w-sm w-full p-4 rounded-xl bg-slate-900/95 border border-cyan-500/40 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">{selectedNode.id}</span>
                <h4 className="text-sm font-bold text-white leading-tight">{selectedNode.name}</h4>
                <p className="text-xs text-slate-400">{selectedNode.sector}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500">CURRENT PHASE</div>
                <div className="font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {selectedNode.currentPhase || 'Green Phase'}
                </div>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500">CYCLE REMAINING</div>
                <div className="font-bold text-white text-base mt-0.5">
                  {selectedNode.secondsRemaining || 24}s
                </div>
              </div>
            </div>

            {selectedNode.recommendation && (
              <div className="mt-2.5 p-2 rounded bg-cyan-950/40 border border-cyan-500/20 text-[11px] text-cyan-200">
                <span className="font-bold text-cyan-300">AI Recommendation:</span> {selectedNode.recommendation}
              </div>
            )}

            <div className="mt-3 flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveCameraModal(selectedNode.camId || 'CAM-DOWNTOWN-01')}
                className="flex-1 text-xs"
              >
                Open Camera Feed
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage('emergency')}
                className="text-xs"
              >
                Preempt Signal
              </Button>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute top-4 right-4 z-20 hidden md:flex flex-col gap-1.5 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-md text-[11px] text-slate-300 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 bg-emerald-400 rounded" /> Free Flow (&gt;50 km/h)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 bg-yellow-400 rounded" /> Moderate Delay (30-50 km/h)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 bg-rose-500 rounded" /> Severe Congestion (&lt;30 km/h)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full border border-emerald-400 bg-emerald-500/20" /> Smart Intersection
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded bg-rose-500" /> Active Incident Hotspot
          </div>
        </div>
      </div>
    </div>
  )
}

