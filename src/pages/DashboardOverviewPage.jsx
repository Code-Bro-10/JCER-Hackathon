import React from 'react'
import {
  Gauge,
  Activity,
  Car,
  AlertTriangle,
  Zap,
  Leaf,
  Camera,
  RefreshCw,
  Compass,
  ArrowUpRight,
  Radio,
} from 'lucide-react'
import { useTraffic } from '../context/TrafficContext'
import StatCard from '../components/common/StatCard'
import InteractiveCityMap from '../components/dashboard/InteractiveCityMap'
import AdaptiveSignalControl from '../components/dashboard/AdaptiveSignalControl'
import RecentIncidentsWidget from '../components/dashboard/RecentIncidentsWidget'
import SectorCongestionChart from '../components/dashboard/SectorCongestionChart'
import MLIntelligenceWidget from '../components/dashboard/MLIntelligenceWidget'
import QuickRouteBanner from '../components/dashboard/QuickRouteBanner'
import Button from '../components/common/Button'
import { CCTV_FEEDS } from '../services/mockData'

export default function DashboardOverviewPage() {
  const { kpis, refreshData, setActiveCameraModal, setCurrentPage } = useTraffic()

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Metropolis Traffic Command Center
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              STABLE
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time urban mobility telemetry, predictive AI routing, and adaptive signal coordination.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={refreshData}
          >
            Sync Telemetry
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCurrentPage('emergency')}
          >
            Emergency Green Wave
          </Button>
        </div>
      </div>

      {/* Primary KPI Statistics Cards (Requirement 3: Traffic statistics cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Average Speed"
          value={kpis?.averageSpeed || 43.6}
          unit="km/h"
          change={kpis?.averageSpeedChange || 5.2}
          trend="up"
          color="cyan"
          icon={Gauge}
          changeLabel="vs last hour"
        />

        <StatCard
          title="Congestion Index"
          value={`${kpis?.congestionIndex || 34}%`}
          change={kpis?.congestionChange || -3.8}
          trend="up" // Congestion decrease is good
          color="emerald"
          icon={Activity}
          changeLabel="-3.8% improved"
        />

        <StatCard
          title="Active Vehicles"
          value={(kpis?.activeVehicles || 148920).toLocaleString()}
          change={kpis?.activeVehiclesChange || 1240}
          trend="neutral"
          color="blue"
          icon={Car}
          changeLabel="flow tracking"
        />

        <StatCard
          title="Incidents Resolved"
          value={`${kpis?.resolvedIncidents || 24}/${kpis?.totalIncidents || 27}`}
          change={88.9}
          trend="up"
          color="amber"
          icon={AlertTriangle}
          changeLabel="resolution rate"
          onClick={() => setCurrentPage('incidents')}
        />

        <StatCard
          title="Signal Optimization"
          value="+22.4%"
          change={4.1}
          trend="up"
          color="cyan"
          icon={Zap}
          changeLabel="throughput gain"
          onClick={() => setCurrentPage('prediction')}
        />

        <StatCard
          title="CO₂ Avoided"
          value={kpis?.co2ReductionTons || 18.6}
          unit="tons"
          change={kpis?.co2ReductionChange || 2.3}
          trend="up"
          color="emerald"
          icon={Leaf}
          changeLabel="carbon offset"
          onClick={() => setCurrentPage('analytics')}
        />
      </div>

      {/* Machine Learning Telemetry & Inference Widget */}
      <MLIntelligenceWidget />

      {/* Quick Source & Destination Route Finder with School Rush AI */}
      <QuickRouteBanner />

      {/* Main Interactive Digital Twin Map (Full Width) */}
      <InteractiveCityMap />

      {/* CCTV Camera Quick Feeds preview bar */}
      <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Live Edge Vision Nodes (Click to Inspect)
            </span>
          </div>
          <span className="text-xs text-slate-500 font-mono">6 of 428 cameras streaming</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CCTV_FEEDS.slice(0, 6).map((feed) => (
            <button
              key={feed.id}
              type="button"
              onClick={() => setActiveCameraModal(feed.id)}
              className="group relative rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 p-2 text-left transition-all hover:scale-[1.02] cursor-pointer"
            >
              <div className="aspect-video w-full rounded-lg bg-slate-900 overflow-hidden relative flex items-center justify-center">
                {feed.isLocalWebcam ? (
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-950/50 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-2 text-center">
                    <Radio className="w-5 h-5 text-rose-400 animate-pulse" />
                    <span className="text-[9px] font-mono font-bold text-rose-300 mt-1">DEVICE WEBCAM</span>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-slate-950 flex flex-col justify-around py-1 overflow-hidden">
                    {/* Animated road lanes with moving traffic streaks */}
                    <div className="w-full h-[1px] bg-yellow-500/30" />
                    <div className="w-full h-[1px] bg-slate-700/40 border-b border-dashed border-slate-600/50" />
                    <div className="w-full h-[1px] bg-yellow-500/30" />
                    {/* Dynamic vehicle streaks */}
                    <div
                      className="absolute top-[24%] w-5 h-2 bg-cyan-400 rounded-sm shadow-sm shadow-cyan-400 animate-pulse"
                      style={{ left: `${(feed.id.charCodeAt(feed.id.length - 1) * 13) % 60 + 15}%` }}
                    />
                    <div
                      className="absolute top-[58%] w-6 h-2 bg-emerald-400 rounded-sm shadow-sm shadow-emerald-400"
                      style={{ left: `${(feed.id.charCodeAt(feed.id.length - 2 || 0) * 19) % 55 + 20}%` }}
                    />
                    <div
                      className="absolute top-[40%] w-4 h-1.5 bg-amber-400 rounded-sm"
                      style={{ left: `${(feed.id.charCodeAt(0) * 9) % 50 + 25}%` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40" />
                  </div>
                )}

                {/* HUD overlays */}
                <span className="absolute top-1 left-1 flex items-center gap-1 text-[8px] font-mono font-bold text-rose-400 bg-black/80 px-1.5 py-0.5 rounded border border-rose-900/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  LIVE
                </span>
                <span className="absolute bottom-1 right-1 text-[8px] font-mono text-cyan-300 bg-black/80 px-1 py-0.5 rounded border border-cyan-900/50">
                  {feed.fps || 30} FPS
                </span>
              </div>
              <div className="mt-2 min-w-0">
                <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-cyan-300">
                  {feed.name.split(' - ')[0]}
                </div>
                <div className="text-[10px] text-slate-500 truncate">{feed.sector}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lower Dashboard Grid: Sector Chart, Adaptive Signals & Recent Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1">
          <SectorCongestionChart />
        </div>

        <div className="xl:col-span-1">
          <AdaptiveSignalControl />
        </div>

        <div className="xl:col-span-1">
          <RecentIncidentsWidget />
        </div>
      </div>
    </div>
  )
}

