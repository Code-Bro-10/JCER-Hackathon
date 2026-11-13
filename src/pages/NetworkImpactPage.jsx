import React, { useState, useMemo } from 'react'
import {
  AlertTriangle,
  Flame,
  RotateCcw,
  Sliders,
  CheckCircle,
  TrendingUp,
  Activity,
  Layers,
  ShieldAlert,
  Clock,
  ArrowRight,
  Zap,
} from 'lucide-react'
import {
  ALL_EDGES,
  ALL_NODES,
  BELAGAVI_EDGES,
  BENGALURU_EDGES,
  DEFAULT_MAP_CENTER,
  getNodeLatLng,
  getEdgeLatLngs,
  simulateRoadImpact,
} from '../services/roadNetworkData'
import {
  TrafficMapContainer,
  RoadNetworkDigitalTwinLayer,
  TrafficCongestionLayer,
} from '../components/map'
import { Polyline, CircleMarker, Popup, Tooltip } from 'react-leaflet'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'
import StatCard from '../components/common/StatCard'
import { useTraffic } from '../context/TrafficContext'

export default function NetworkImpactPage() {
  const { addToast } = useTraffic()

  // Selectable edges - prioritizing major Belagavi corridors
  const selectableEdges = useMemo(() => {
    return BELAGAVI_EDGES.length > 0 ? BELAGAVI_EDGES : (BENGALURU_EDGES.length > 0 ? BENGALURU_EDGES : ALL_EDGES)
  }, [])

  const [selectedEdgeId, setSelectedEdgeId] = useState(selectableEdges[0]?.id || 'BGM-E104-105')
  const [blockageType, setBlockageType] = useState('full_closure') // 'full_closure' | '1_lane' | '2_lanes' | 'accident' | 'construction'
  const [durationMinutes, setDurationMinutes] = useState(45)

  const selectedEdge = useMemo(() => {
    return ALL_EDGES.find((e) => e.id === selectedEdgeId) || selectableEdges[0]
  }, [selectedEdgeId, selectableEdges])

  // Run graph-based impact analysis
  const impactReport = useMemo(() => {
    const isClosed = blockageType === 'full_closure' || blockageType === 'accident'
    const totalLanes = selectedEdge?.lanes || 3
    let lanesBlocked = 1

    if (blockageType === 'full_closure' || blockageType === 'accident') {
      lanesBlocked = totalLanes
    } else if (blockageType === '2_lanes') {
      lanesBlocked = Math.min(totalLanes, 2)
    } else if (blockageType === 'construction') {
      lanesBlocked = Math.min(totalLanes, 1)
    }

    return simulateRoadImpact({
      edgeId: selectedEdgeId,
      lanesBlocked,
      isClosed,
      durationMinutes,
    })
  }, [selectedEdgeId, blockageType, durationMinutes, selectedEdge])

  const shockwaveNodeIds = useMemo(() => {
    return (impactReport?.spillbackPropagation?.upstreamRisks || []).map((r) => r.nodeId)
  }, [impactReport])

  const diversionPathNodes = useMemo(() => {
    return impactReport?.diversionAnalysis?.recommendedBypassPath || []
  }, [impactReport])

  // Coordinates of diversion path
  const diversionLatLngs = useMemo(() => {
    return diversionPathNodes.map(getNodeLatLng).filter(Boolean)
  }, [diversionPathNodes])

  // Coordinates of affected edge
  const affectedEdgeLatLngs = useMemo(() => {
    if (!selectedEdge) return []
    return getEdgeLatLngs(selectedEdge) || []
  }, [selectedEdge])

  const handleRestoreRoad = () => {
    setBlockageType('1_lane')
    addToast({
      type: 'success',
      title: 'Roadway Restored',
      message: `${selectedEdge?.name || selectedEdgeId} restored to full baseline capacity.`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            Graph-Based Road Network Impact Analysis
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
              LWR KINEMATICS
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Evaluate cascading upstream queue spillback, bottleneck shockwaves, and compute alternative diversion corridors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={RotateCcw}
            onClick={handleRestoreRoad}
          >
            Restore Road to Baseline
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Capacity Reduction"
          value={impactReport?.capacityAnalysis?.remainingCapacityPct !== undefined
            ? `${100 - impactReport.capacityAnalysis.remainingCapacityPct}%`
            : '100%'}
          unit="throughput lost"
          change={-Math.round(100 - (impactReport?.capacityAnalysis?.remainingCapacityPct || 0))}
          trend="down"
          color="rose"
          icon={AlertTriangle}
          changeLabel="flow constraint"
        />

        <StatCard
          title="Shockwave Velocity"
          value={impactReport?.shockwaveKinematics?.shockwaveSpeedKmh || '14.2'}
          unit="km/h"
          change={12.5}
          trend="down"
          color="amber"
          icon={TrendingUp}
          changeLabel="upstream propagation"
        />

        <StatCard
          title="Max Queue Spillback"
          value={impactReport?.shockwaveKinematics?.maxQueueLengthMeters || '850'}
          unit="meters"
          change={18}
          trend="down"
          color="cyan"
          icon={Activity}
          changeLabel="accumulated jam length"
        />

        <StatCard
          title="System Delay Surge"
          value={impactReport?.delaySurge?.estimatedVhdSurge || '320'}
          unit="veh-hours"
          change={28.4}
          trend="down"
          color="purple"
          icon={Clock}
          changeLabel="total community delay"
        />
      </div>

      {/* Controls & Interactive Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Simulation Parameters & Controls */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Blockage Parameters
                </h3>
              </div>
              <Badge variant="rose" size="sm">ACTIVE TEST</Badge>
            </div>

            {/* Target Road Segment Selector */}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 block">
                Target Road Segment
              </label>
              <select
                value={selectedEdgeId}
                onChange={(e) => setSelectedEdgeId(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                {selectableEdges.map((edge) => (
                  <option key={edge.id} value={edge.id}>
                    {edge.name} ({edge.from} ➔ {edge.to})
                  </option>
                ))}
              </select>
            </div>

            {/* Blockage Mode */}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 block">
                Incident / Blockage Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'full_closure', label: 'Full Road Closure' },
                  { id: 'accident', label: 'Multi-Lane Accident' },
                  { id: '2_lanes', label: '2 Lanes Blocked' },
                  { id: '1_lane', label: '1 Lane Blocked' },
                  { id: 'construction', label: 'Road Construction' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setBlockageType(mode.id)}
                    className={`px-3 py-2 rounded-xl border text-left font-medium transition-all cursor-pointer ${
                      blockageType === mode.id
                        ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Incident Duration Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-mono text-slate-400">Estimated Duration:</span>
                <span className="font-mono text-rose-400 font-bold">{durationMinutes} minutes</span>
              </div>
              <input
                type="range"
                min="15"
                max="120"
                step="5"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full accent-rose-500 bg-slate-950"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>15 mins (Minor)</span>
                <span>60 mins</span>
                <span>120 mins (Major Incident)</span>
              </div>
            </div>
          </div>

          {/* Upstream Spillback Intersections */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Upstream Shockwave Propagation</span>
              <span className="text-[10px] font-mono text-amber-400">
                {shockwaveNodeIds.length} Nodes at Risk
              </span>
            </h4>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(impactReport?.spillbackPropagation?.upstreamRisks || []).map((risk, idx) => (
                <div
                  key={risk.nodeId}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-white">{risk.nodeId}</span>
                    <span className="text-[11px] text-slate-400 block">
                      Hop {risk.hop} • {risk.cumulativeDistanceKm} km upstream
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    risk.riskLevel === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}>
                    {risk.riskLevel} RISK
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Diversion Route */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              Calculated Alternate Diversion
            </h4>
            <div className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono space-y-1">
              <div>
                <span className="text-slate-500">Origin Node:</span> {impactReport?.diversionAnalysis?.fromNode || selectedEdge?.from}
              </div>
              <div>
                <span className="text-slate-500">Target Node:</span> {impactReport?.diversionAnalysis?.toNode || selectedEdge?.to}
              </div>
              <div>
                <span className="text-slate-500">Bypass Path:</span>{' '}
                <span className="text-emerald-400 font-bold">
                  {diversionPathNodes.length > 0 ? diversionPathNodes.join(' ➔ ') : 'Direct Parallel Corridor'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Delay Addition:</span> ~{impactReport?.diversionAnalysis?.estimatedAddedMinutes || 4} mins
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Full Interactive Map Showing Shockwave & Diversion (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <TrafficMapContainer
            center={DEFAULT_MAP_CENTER}
            zoom={13}
            title="Roadway Incident & Network Impact Canvas"
            subtitle={`Impacted: ${selectedEdge?.name || selectedEdgeId} | Kinematic Analysis`}
            showLayerControls={false}
            height="580px"
          >
            {/* Background Network Layer */}
            <RoadNetworkDigitalTwinLayer
              closedEdgeIds={[selectedEdgeId]}
              conflictingNodeIds={shockwaveNodeIds}
              preemptedNodeIds={diversionPathNodes}
              showSignals={true}
              showEdges={true}
            />

            {/* Blocked Road Segment Highlight (Flashing Rose/Red) */}
            {affectedEdgeLatLngs.length === 2 && (
              <Polyline
                positions={affectedEdgeLatLngs}
                pathOptions={{
                  color: '#dc2626',
                  weight: 8,
                  opacity: 0.9,
                  dashArray: '8, 8',
                }}
              >
                <Tooltip permanent direction="center">
                  <div className="bg-rose-950 border border-rose-500 text-rose-200 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                    BLOCKED: {selectedEdge?.name}
                  </div>
                </Tooltip>
              </Polyline>
            )}

            {/* Recommended Diversion Path Highlight (Glowing Emerald) */}
            {diversionLatLngs.length >= 2 && (
              <Polyline
                positions={diversionLatLngs}
                pathOptions={{
                  color: '#16a34a',
                  weight: 6,
                  opacity: 0.95,
                }}
              >
                <Tooltip direction="top">
                  <div className="bg-emerald-950 border border-emerald-500 text-emerald-200 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                    RECOMMENDED DIVERSION BYPASS
                  </div>
                </Tooltip>
              </Polyline>
            )}
          </TrafficMapContainer>

          {/* Explanation Banner */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-white">LWR Kinematics Model:</strong> When throughput drops below arrival rate on{' '}
              <span className="text-white font-mono">{selectedEdge?.name}</span>, a backward-forming shockwave travels upstream at{' '}
              <span className="text-amber-400 font-mono font-bold">{impactReport?.shockwaveKinematics?.shockwaveSpeedKmh || 14.2} km/h</span>.
              Signals at connected intersections ({shockwaveNodeIds.join(', ')}) are alerted to shed excess inbound volume.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

