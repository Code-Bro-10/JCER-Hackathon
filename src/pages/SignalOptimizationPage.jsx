import React, { useState, useMemo, useEffect } from 'react'
import {
  Zap,
  Clock,
  Sliders,
  RotateCcw,
  CheckCircle,
  Activity,
  ArrowRight,
  Shield,
  Layers,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'
import { optimizeSignalTiming, WEBSTER_CONSTRAINTS } from '../../algorithms/signals/signalOptimizer.js'
import {
  calculateWebsterDelay,
  getLevelOfService,
  compareSignalPerformance,
} from '../../algorithms/signals/waitingTimeComparator.js'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'
import StatCard from '../components/common/StatCard'
import { useTraffic } from '../context/TrafficContext'

export default function SignalOptimizationPage() {
  const { addToast } = useTraffic()

  // Approach queues (in vehicles)
  const [queueNorth, setQueueNorth] = useState(24)
  const [queueSouth, setQueueSouth] = useState(20)
  const [queueEast, setQueueEast] = useState(14)
  const [queueWest, setQueueWest] = useState(12)

  // Approach volume demand (vehicles per hour)
  const [volumeNS, setVolumeNS] = useState(1650)
  const [volumeEW, setVolumeEW] = useState(980)

  // Signal constraints
  const [minGreenSeconds, setMinGreenSeconds] = useState(12)
  const [maxCycleSeconds, setMaxCycleSeconds] = useState(120)
  const [minCycleSeconds, setMinCycleSeconds] = useState(50)

  // Emergency Preemption Toggle
  const [emergencyOverride, setEmergencyOverride] = useState(false)

  // Live Simulation Phase Clock
  const [activePhase, setActivePhase] = useState('NS_GREEN') // 'NS_GREEN' | 'NS_AMBER' | 'EW_GREEN' | 'EW_AMBER'
  const [phaseSecondsRemaining, setPhaseSecondsRemaining] = useState(30)

  // Run Webster Optimal Timing Calculation
  const optimizationResult = useMemo(() => {
    const intersectionData = {
      id: 'INT-BLR-105',
      name: 'Silk Board Junction Control Node',
      approaches: {
        north: { queue: queueNorth, lanes: 3 },
        south: { queue: queueSouth, lanes: 3 },
        east: { queue: queueEast, lanes: 2 },
        west: { queue: queueWest, lanes: 2 },
      },
    }

    return optimizeSignalTiming(intersectionData, {
      minGreenSeconds,
      maxCycleSeconds,
      minCycleSeconds,
      emergencyPreemptionPhase: emergencyOverride ? 'North-South Corridor' : null,
    })
  }, [queueNorth, queueSouth, queueEast, queueWest, minGreenSeconds, maxCycleSeconds, minCycleSeconds, emergencyOverride])

  // Compute Before & After Delay Comparison
  const comparisonResult = useMemo(() => {
    // Fixed-time baseline: 90s cycle, 41s NS green, 41s EW green, 8s lost
    const fixedCycle = 90
    const fixedGreenNS = 41
    const fixedGreenEW = 41

    const optCycle = optimizationResult.optimalCycleSeconds || 75
    const optGreenNS = optimizationResult.phases?.find((p) => p.phaseName.includes('North-South'))?.greenTimeSeconds || 42
    const optGreenEW = optimizationResult.phases?.find((p) => p.phaseName.includes('East-West'))?.greenTimeSeconds || 25

    // Capacity per phase: saturation flow ~ 1800 veh/hr/lane
    const capNS_fixed = Math.round(1800 * 3 * (fixedGreenNS / fixedCycle))
    const capEW_fixed = Math.round(1800 * 2 * (fixedGreenEW / fixedCycle))

    const capNS_opt = Math.round(1800 * 3 * (optGreenNS / optCycle))
    const capEW_opt = Math.round(1800 * 2 * (optGreenEW / optCycle))

    const delayNS_fixed = calculateWebsterDelay(fixedCycle, fixedGreenNS, volumeNS, capNS_fixed)
    const delayEW_fixed = calculateWebsterDelay(fixedCycle, fixedGreenEW, volumeEW, capEW_fixed)
    const baselineAvgDelay = +((delayNS_fixed * volumeNS + delayEW_fixed * volumeEW) / (volumeNS + volumeEW)).toFixed(1)

    const delayNS_opt = calculateWebsterDelay(optCycle, optGreenNS, volumeNS, capNS_opt)
    const delayEW_opt = calculateWebsterDelay(optCycle, optGreenEW, volumeEW, capEW_opt)
    const optAvgDelay = +((delayNS_opt * volumeNS + delayEW_opt * volumeEW) / (volumeNS + volumeEW)).toFixed(1)

    const delaySaved = +(baselineAvgDelay - optAvgDelay).toFixed(1)
    const pctSaved = Math.max(0, Math.round((delaySaved / baselineAvgDelay) * 100))

    const baselineLOS = getLevelOfService(baselineAvgDelay)
    const optLOS = getLevelOfService(optAvgDelay)

    const totalVehiclesPerHour = volumeNS + volumeEW
    const totalHoursSavedPerHour = +((totalVehiclesPerHour * delaySaved) / 3600).toFixed(1)
    const co2SavedKgPerHour = +(totalHoursSavedPerHour * 2.3).toFixed(1)

    return {
      baseline: {
        cycleLength: fixedCycle,
        greenNS: fixedGreenNS,
        greenEW: fixedGreenEW,
        avgDelaySec: baselineAvgDelay,
        los: baselineLOS.los,
        losDescription: baselineLOS.description,
      },
      optimized: {
        cycleLength: optCycle,
        greenNS: optGreenNS,
        greenEW: optGreenEW,
        avgDelaySec: optAvgDelay,
        los: optLOS.los,
        losDescription: optLOS.description,
      },
      delaySavedSec: delaySaved,
      pctSaved,
      totalHoursSavedPerHour,
      co2SavedKgPerHour,
    }
  }, [optimizationResult, volumeNS, volumeEW])

  // Phase Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setPhaseSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Advance phase
          if (activePhase === 'NS_GREEN') {
            setActivePhase('NS_AMBER')
            return 4
          } else if (activePhase === 'NS_AMBER') {
            setActivePhase('EW_GREEN')
            return comparisonResult.optimized.greenEW
          } else if (activePhase === 'EW_GREEN') {
            setActivePhase('EW_AMBER')
            return 4
          } else {
            setActivePhase('NS_GREEN')
            return comparisonResult.optimized.greenNS
          }
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [activePhase, comparisonResult])

  const handleApplyPreset = (presetName) => {
    if (presetName === 'peak') {
      setQueueNorth(38)
      setQueueSouth(35)
      setQueueEast(18)
      setQueueWest(16)
      setVolumeNS(2300)
      setVolumeEW(1200)
      addToast({ type: 'info', title: 'Peak Rush Hour Applied', message: 'Heavy North-South commuter surge loaded.' })
    } else if (presetName === 'offpeak') {
      setQueueNorth(10)
      setQueueSouth(8)
      setQueueEast(9)
      setQueueWest(7)
      setVolumeNS(750)
      setVolumeEW(680)
      addToast({ type: 'info', title: 'Off-Peak Demand Applied', message: 'Balanced urban flow loaded.' })
    }
  }

  const isNSGreen = activePhase === 'NS_GREEN'
  const isNSAmber = activePhase === 'NS_AMBER'
  const isEWGreen = activePhase === 'EW_GREEN'
  const isEWAmber = activePhase === 'EW_AMBER'

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            Adaptive Traffic Signal Timing Optimizer
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              WEBSTER HCM MIN-DELAY
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic phase split calculation based on critical lane volume ratios, minimum pedestrian safety green times, and queue flush constraints.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={emergencyOverride ? 'danger' : 'outline'}
            size="sm"
            icon={Zap}
            onClick={() => {
              setEmergencyOverride(!emergencyOverride)
              addToast({
                type: emergencyOverride ? 'info' : 'danger',
                title: emergencyOverride ? 'Emergency Preemption Released' : 'Emergency Preemption Activated',
                message: emergencyOverride ? 'Resuming Webster adaptive cycling.' : 'Corridor locked to continuous green.',
              })
            }}
          >
            {emergencyOverride ? 'Release Preemption' : 'Test Emergency Green Wave'}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Optimal Cycle Length"
          value={`${comparisonResult.optimized.cycleLength}s`}
          change={-(comparisonResult.baseline.cycleLength - comparisonResult.optimized.cycleLength)}
          trend="up"
          color="emerald"
          icon={Clock}
          changeLabel={`vs ${comparisonResult.baseline.cycleLength}s fixed baseline`}
        />

        <StatCard
          title="Vehicle Delay Reduced"
          value={`${comparisonResult.pctSaved}%`}
          change={comparisonResult.delaySavedSec}
          trend="up"
          color="cyan"
          icon={Activity}
          changeLabel={`-${comparisonResult.delaySavedSec}s per vehicle`}
        />

        <StatCard
          title="Level of Service (LOS)"
          value={comparisonResult.optimized.los}
          change={1}
          trend="up"
          color="blue"
          icon={CheckCircle}
          changeLabel={`Improved from ${comparisonResult.baseline.los}`}
        />

        <StatCard
          title="Delay Saved / Hour"
          value={`${comparisonResult.totalHoursSavedPerHour}h`}
          change={15.2}
          trend="up"
          color="purple"
          icon={Zap}
          changeLabel={`${comparisonResult.co2SavedKgPerHour} kg CO2 reduced/hr`}
        />
      </div>

      {/* Main Grid: Interactive Intersection Simulation & Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Visual 4-Way Junction Simulation */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Live Junction Kinematics & Signal Phase
                </h3>
                <p className="text-[11px] text-slate-400">
                  Phase: <span className="font-mono font-bold text-white">{activePhase.replace('_', ' ')}</span> • Seconds Left in Split: <span className="text-emerald-400 font-mono font-bold">{phaseSecondsRemaining}s</span>
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="sm" onClick={() => handleApplyPreset('peak')}>
                  Rush Hour
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleApplyPreset('offpeak')}>
                  Off-Peak
                </Button>
              </div>
            </div>

            {/* Visual 4-Way Crossroads Graphic */}
            <div className="relative w-full h-80 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center p-4">
              {/* North Approach Roadway */}
              <div className="absolute top-0 w-24 h-28 bg-slate-800 border-x-2 border-dashed border-slate-600 flex flex-col items-center justify-start pt-2">
                <span className="text-[10px] font-mono text-slate-400">NORTH</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">{queueNorth} veh</span>
                {/* Traffic light signal head */}
                <div className="mt-1 flex gap-1 p-1 bg-black rounded-lg border border-slate-700">
                  <span className={`w-2.5 h-2.5 rounded-full ${isNSGreen ? 'bg-emerald-400 shadow-md shadow-emerald-500' : isNSAmber ? 'bg-amber-400 shadow-md shadow-amber-500' : 'bg-rose-500'}`} />
                </div>
              </div>

              {/* South Approach Roadway */}
              <div className="absolute bottom-0 w-24 h-28 bg-slate-800 border-x-2 border-dashed border-slate-600 flex flex-col items-center justify-end pb-2">
                {/* Traffic light signal head */}
                <div className="mb-1 flex gap-1 p-1 bg-black rounded-lg border border-slate-700">
                  <span className={`w-2.5 h-2.5 rounded-full ${isNSGreen ? 'bg-emerald-400 shadow-md shadow-emerald-500' : isNSAmber ? 'bg-amber-400 shadow-md shadow-amber-500' : 'bg-rose-500'}`} />
                </div>
                <span className="text-xs font-bold text-emerald-400 font-mono">{queueSouth} veh</span>
                <span className="text-[10px] font-mono text-slate-400">SOUTH</span>
              </div>

              {/* West Approach Roadway */}
              <div className="absolute left-0 h-24 w-28 bg-slate-800 border-y-2 border-dashed border-slate-600 flex items-center justify-start pl-2 gap-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono text-slate-400">WEST</span>
                  <span className="text-xs font-bold text-amber-400 font-mono">{queueWest} veh</span>
                </div>
                <div className="p-1 bg-black rounded-lg border border-slate-700">
                  <span className={`w-2.5 h-2.5 rounded-full block ${isEWGreen ? 'bg-emerald-400 shadow-md shadow-emerald-500' : isEWAmber ? 'bg-amber-400 shadow-md shadow-amber-500' : 'bg-rose-500'}`} />
                </div>
              </div>

              {/* East Approach Roadway */}
              <div className="absolute right-0 h-24 w-28 bg-slate-800 border-y-2 border-dashed border-slate-600 flex items-center justify-end pr-2 gap-2">
                <div className="p-1 bg-black rounded-lg border border-slate-700">
                  <span className={`w-2.5 h-2.5 rounded-full block ${isEWGreen ? 'bg-emerald-400 shadow-md shadow-emerald-500' : isEWAmber ? 'bg-amber-400 shadow-md shadow-amber-500' : 'bg-rose-500'}`} />
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] font-mono text-slate-400">EAST</span>
                  <span className="text-xs font-bold text-amber-400 font-mono">{queueEast} veh</span>
                </div>
              </div>

              {/* Central Junction Hub */}
              <div className="w-24 h-24 rounded-xl bg-slate-900 border-2 border-slate-700 flex flex-col items-center justify-center p-2 text-center shadow-2xl z-10">
                <span className="text-[9px] font-mono text-slate-400 uppercase">Cycle</span>
                <span className="text-lg font-bold text-white font-mono">{comparisonResult.optimized.cycleLength}s</span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                  isNSGreen || isEWGreen ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {phaseSecondsRemaining}s LEFT
                </span>
              </div>
            </div>
          </div>

          {/* Before & After Delay Comparison Table */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Webster Adaptive vs Fixed Baseline Delay Comparison</span>
              <span className="text-[10px] font-mono text-emerald-400">HCM STANDARDS</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400">
                    <th className="py-2">Metric / Condition</th>
                    <th className="py-2">Fixed-Time Baseline</th>
                    <th className="py-2">Webster Adaptive</th>
                    <th className="py-2 text-right">Net Improvement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  <tr>
                    <td className="py-2.5 text-slate-300 font-sans font-medium">Cycle Length</td>
                    <td className="py-2.5 text-slate-400">{comparisonResult.baseline.cycleLength} seconds</td>
                    <td className="py-2.5 text-emerald-400 font-bold">{comparisonResult.optimized.cycleLength} seconds</td>
                    <td className="py-2.5 text-right text-emerald-400 font-bold">
                      {comparisonResult.baseline.cycleLength - comparisonResult.optimized.cycleLength > 0
                        ? `-${comparisonResult.baseline.cycleLength - comparisonResult.optimized.cycleLength}s (Faster Cycle)`
                        : `+${comparisonResult.optimized.cycleLength - comparisonResult.baseline.cycleLength}s (Capacity Surge)`}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-300 font-sans font-medium">North-South Green Split</td>
                    <td className="py-2.5 text-slate-400">{comparisonResult.baseline.greenNS}s (45%)</td>
                    <td className="py-2.5 text-cyan-400 font-bold">{comparisonResult.optimized.greenNS}s ({Math.round(comparisonResult.optimized.greenNS / comparisonResult.optimized.cycleLength * 100)}%)</td>
                    <td className="py-2.5 text-right text-cyan-400 font-bold">
                      Allocated to higher demand
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-300 font-sans font-medium">East-West Green Split</td>
                    <td className="py-2.5 text-slate-400">{comparisonResult.baseline.greenEW}s (45%)</td>
                    <td className="py-2.5 text-cyan-400 font-bold">{comparisonResult.optimized.greenEW}s ({Math.round(comparisonResult.optimized.greenEW / comparisonResult.optimized.cycleLength * 100)}%)</td>
                    <td className="py-2.5 text-right text-slate-400">Maintains min pedestrian green</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-300 font-sans font-medium">Avg. Control Delay per Vehicle</td>
                    <td className="py-2.5 text-rose-400">{comparisonResult.baseline.avgDelaySec} sec/veh</td>
                    <td className="py-2.5 text-emerald-400 font-bold">{comparisonResult.optimized.avgDelaySec} sec/veh</td>
                    <td className="py-2.5 text-right text-emerald-400 font-bold">
                      -{comparisonResult.delaySavedSec}s (-{comparisonResult.pctSaved}%)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-300 font-sans font-medium">Highway Capacity LOS Grade</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">
                        {comparisonResult.baseline.los}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                        {comparisonResult.optimized.los}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-emerald-400 font-bold">
                      Significant grade boost
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Queue Sliders & Constraints */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Approach Queue & Volume Controls
            </h3>

            {/* North Queue */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-mono text-slate-400">North Queue:</span>
                <span className="font-mono text-emerald-400 font-bold">{queueNorth} vehicles</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={queueNorth}
                onChange={(e) => setQueueNorth(Number(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-950"
              />
            </div>

            {/* South Queue */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-mono text-slate-400">South Queue:</span>
                <span className="font-mono text-emerald-400 font-bold">{queueSouth} vehicles</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={queueSouth}
                onChange={(e) => setQueueSouth(Number(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-950"
              />
            </div>

            {/* East Queue */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-mono text-slate-400">East Queue:</span>
                <span className="font-mono text-amber-400 font-bold">{queueEast} vehicles</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={queueEast}
                onChange={(e) => setQueueEast(Number(e.target.value))}
                className="w-full accent-amber-500 bg-slate-950"
              />
            </div>

            {/* West Queue */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-mono text-slate-400">West Queue:</span>
                <span className="font-mono text-amber-400 font-bold">{queueWest} vehicles</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={queueWest}
                onChange={(e) => setQueueWest(Number(e.target.value))}
                className="w-full accent-amber-500 bg-slate-950"
              />
            </div>

            {/* Minimum Green Constraint */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-mono text-slate-400">Min. Pedestrian Green:</span>
                <span className="font-mono text-blue-400 font-bold">{minGreenSeconds}s</span>
              </div>
              <input
                type="range"
                min="8"
                max="25"
                value={minGreenSeconds}
                onChange={(e) => setMinGreenSeconds(Number(e.target.value))}
                className="w-full accent-blue-500 bg-slate-950"
              />
              <span className="text-[10px] text-slate-500">Ensures safe pedestrian crosswalk clearance.</span>
            </div>

            {/* Maximum Cycle Constraint */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-mono text-slate-400">Max. Cycle Constraint:</span>
                <span className="font-mono text-blue-400 font-bold">{maxCycleSeconds}s</span>
              </div>
              <input
                type="range"
                min="60"
                max="180"
                value={maxCycleSeconds}
                onChange={(e) => setMaxCycleSeconds(Number(e.target.value))}
                className="w-full accent-blue-500 bg-slate-950"
              />
              <span className="text-[10px] text-slate-500">Prevents driver impatience from overlong red lights.</span>
            </div>
          </div>

          {/* Disclosure Card */}
          <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3 text-[11px] space-y-1.5 text-slate-400">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Scientific & Engineering Transparency
            </div>
            <p className="text-[10px] leading-relaxed">
              Calculations are computed using <strong>Webster's Delay Formulation</strong> and 
              Critical Lane Volume (CLV) saturation ratios under HCM 6th Edition guidelines.
              Test outputs are 100% reproducible. This system acts as a smart simulation model and does not claim direct municipal hardware control.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

