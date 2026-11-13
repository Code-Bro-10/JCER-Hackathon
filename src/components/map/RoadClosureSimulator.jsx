import React, { useState } from 'react'
import {
  AlertTriangle,
  Flame,
} from 'lucide-react'
import { DEMO_EDGES, simulateRoadImpact } from '../../services/roadNetworkData'

/**
 * Interactive Accident & Road Closure Simulator & Impact Analyzer
 *
 * @param {object} props
 * @param {string} [props.initialEdgeId='EDGE-106-103']
 * @param {function} props.onApplySimulation - Callback with simulation results { closedEdgeIds, shockwaveNodes, diversionPath }
 * @param {function} props.onClearSimulation - Callback to reset closures
 * @param {boolean} [props.isOpen=true]
 * @param {function} [props.onClose]
 */
export default function RoadClosureSimulator({
  initialEdgeId = 'EDGE-106-103',
  onApplySimulation = () => {},
  onClearSimulation = () => {},
  isOpen = true,
  onClose = null,
}) {
  const [selectedEdgeId, setSelectedEdgeId] = useState(initialEdgeId)
  const [blockageMode, setBlockageMode] = useState('full_closure') // '1_lane' | '2_lanes' | 'full_closure'
  const [durationMinutes, setDurationMinutes] = useState(45)
  const [impactReport, setImpactReport] = useState(() =>
    simulateRoadImpact({
      edgeId: initialEdgeId,
      lanesBlocked: 4,
      isClosed: true,
      durationMinutes: 45,
    })
  )

  const selectedEdge = DEMO_EDGES.find((e) => e.id === selectedEdgeId) || DEMO_EDGES[0]

  const handleRunSimulation = () => {
    const isClosed = blockageMode === 'full_closure'
    const lanesBlocked = blockageMode === '1_lane' ? 1 : blockageMode === '2_lanes' ? 2 : selectedEdge.lanes

    const report = simulateRoadImpact({
      edgeId: selectedEdgeId,
      lanesBlocked,
      isClosed,
      durationMinutes,
    })

    setImpactReport(report)

    if (report && report.success) {
      const shockwaveNodeIds = (report.spillbackPropagation?.upstreamRisks || []).map((r) => r.nodeId)
      const diversionPath = report.diversionAnalysis?.recommendedBypassPath || []

      onApplySimulation({
        edgeId: selectedEdgeId,
        isClosed,
        lanesBlocked,
        shockwaveNodeIds,
        diversionPath,
        report,
      })
    }
  }

  const handleReset = () => {
    setBlockageMode('1_lane')
    setImpactReport(null)
    onClearSimulation()
  }

  if (!isOpen) return null

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4.5 shadow-2xl backdrop-blur-md space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400">
            <AlertTriangle className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Road Closure & Connected Impact Simulator
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono">
                LWR SHOCKWAVE MODEL
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Simulate lane blockages or closures and evaluate topological cascade delays.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            ✕
          </button>
        )}
      </div>

      {/* Simulator Control Sliders and Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 1. Road Segment Selection */}
        <div>
          <label className="block text-xs font-mono text-slate-300 mb-1.5 font-semibold">
            Target Road Segment:
          </label>
          <select
            value={selectedEdgeId}
            onChange={(e) => setSelectedEdgeId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
          >
            {DEMO_EDGES.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.id}) - {e.lanes} lanes
              </option>
            ))}
          </select>
        </div>

        {/* 2. Blockage Severity Mode */}
        <div>
          <label className="block text-xs font-mono text-slate-300 mb-1.5 font-semibold">
            Blockage Scenario:
          </label>
          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setBlockageMode('1_lane')}
              className={`py-1.5 rounded-lg font-mono transition-all cursor-pointer ${
                blockageMode === '1_lane'
                  ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              1 Lane
            </button>
            <button
              type="button"
              onClick={() => setBlockageMode('2_lanes')}
              className={`py-1.5 rounded-lg font-mono transition-all cursor-pointer ${
                blockageMode === '2_lanes'
                  ? 'bg-orange-500/20 border border-orange-500/50 text-orange-300 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              2 Lanes
            </button>
            <button
              type="button"
              onClick={() => setBlockageMode('full_closure')}
              className={`py-1.5 rounded-lg font-mono transition-all cursor-pointer ${
                blockageMode === 'full_closure'
                  ? 'bg-rose-500/20 border border-rose-500/50 text-rose-300 font-bold animate-pulse'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Full Closure
            </button>
          </div>
        </div>

        {/* 3. Duration Selector */}
        <div>
          <label className="block text-xs font-mono text-slate-300 mb-1.5 font-semibold">
            Incident Duration:
          </label>
          <div className="flex items-center gap-2">
            {[15, 30, 45, 60].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setDurationMinutes(mins)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-mono border transition-all cursor-pointer ${
                  durationMinutes === mins
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={handleReset}
          className="px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
        >
          Reset Simulation
        </button>

        <button
          type="button"
          onClick={handleRunSimulation}
          className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-black font-extrabold text-xs transition-all shadow-lg shadow-rose-950/80 cursor-pointer flex items-center gap-1.5"
        >
          <Flame className="w-4 h-4" />
          <span>Execute Graph Impact Analysis</span>
        </button>
      </div>

      {/* Impact Results Report */}
      {impactReport && impactReport.success && (
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
            <span>Simulation Telemetry: {impactReport.corridorName}</span>
            <span className="text-[10px] text-rose-400 font-mono">
              Status: {impactReport.directImpact?.flowRegime}
            </span>
          </div>

          {/* KPI Matrix Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 block">Shockwave Speed</span>
              <div className="text-base font-extrabold text-rose-400 font-mono">
                {impactReport.shockwaveKinematics?.shockwaveSpeedKmh} km/h
              </div>
              <span className="text-[9px] text-slate-500 block">backward queue velocity</span>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 block">Max Queue Length</span>
              <div className="text-base font-extrabold text-amber-400 font-mono">
                {impactReport.shockwaveKinematics?.maxQueueLengthMeters} m
              </div>
              <span className="text-[9px] text-slate-500 block">
                growth: {impactReport.shockwaveKinematics?.queueGrowthRateMetersPerMin} m/min
              </span>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 block">System Delay Surge</span>
              <div className="text-base font-extrabold text-cyan-400 font-mono">
                +{impactReport.systemDelayImpact?.networkDelayIncreaseVhd} VHD
              </div>
              <span className="text-[9px] text-slate-500 block">
                {impactReport.systemDelayImpact?.totalAffectedVehicles} queued vehicles
              </span>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 block">Spillback Spill Risk</span>
              <div className="text-base font-extrabold text-emerald-400 font-mono">
                {impactReport.spillbackPropagation?.affectedIntersectionsCount} Nodes
              </div>
              <span className="text-[9px] text-slate-500 block">upstream intersections</span>
            </div>
          </div>

          {/* Diversion Corridor & Mitigations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Recommended Diversion Corridor */}
            <div className="bg-slate-950 p-3 rounded-xl border border-emerald-500/30">
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider block mb-1">
                Automated Bypass Diversion Corridor:
              </span>
              <div className="text-white font-semibold flex items-center gap-1.5 font-mono text-xs">
                <span>{impactReport.diversionAnalysis?.recommendedBypassPath?.join(' ➔ ') || 'N/A'}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Detour Distance: <span className="text-white font-bold">{impactReport.diversionAnalysis?.bypassDistanceKm} km</span> •
                Added Detour Delay: <span className="text-amber-300 font-bold">+{impactReport.diversionAnalysis?.detourDelayMinutes} min</span>
              </div>
            </div>

            {/* Tactical Mitigation Guidance */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider block mb-1">
                Algorithmic Mitigation Directives:
              </span>
              <ul className="space-y-1 text-[11px] text-slate-300">
                {(impactReport.mitigationRecommendations || []).slice(0, 2).map((rec, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
