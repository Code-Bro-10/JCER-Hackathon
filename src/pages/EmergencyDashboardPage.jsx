import React from 'react'
import { Siren, Shield, Zap, Clock, AlertTriangle, Radio, CheckCircle, Flame } from 'lucide-react'
import { useTraffic } from '../context/TrafficContext'
import GreenWaveController from '../components/emergency/GreenWaveController'
import ActiveDispatchesList from '../components/emergency/ActiveDispatchesList'
import EmergencyMapView from '../components/emergency/EmergencyMapView'
import SignalPreemptLog from '../components/emergency/SignalPreemptLog'
import StatCard from '../components/common/StatCard'
import Button from '../components/common/Button'

export default function EmergencyDashboardPage() {
  const { emergencyDispatches, cancelGreenWave, refreshData } = useTraffic()

  const activeCount = emergencyDispatches.length
  const codeRedCount = emergencyDispatches.filter((d) => d.priorityLevel === 'CODE RED').length

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            Emergency Priority Response & Green Wave Command
            {codeRedCount > 0 ? (
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-rose-500 text-black font-extrabold animate-pulse">
                CODE RED ACTIVE
              </span>
            ) : (
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                STANDBY READY
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Priority signal preemption corridor locking for ambulances, fire engines, and rapid response units.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {codeRedCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                emergencyDispatches.forEach((d) => cancelGreenWave(d.id))
              }}
              className="border-rose-500/50 text-rose-300 hover:bg-rose-500/10"
            >
              Stand Down All Corridors
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={refreshData}
          >
            Sync Telemetry
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Emergency Units"
          value={activeCount}
          unit="dispatched"
          change={codeRedCount}
          trend={codeRedCount > 0 ? 'down' : 'up'}
          color="rose"
          icon={Siren}
          changeLabel="priority vehicles"
        />

        <StatCard
          title="Signals Preempted"
          value="11 Nodes"
          change={100}
          trend="up"
          color="emerald"
          icon={Zap}
          changeLabel="100% downstream green"
        />

        <StatCard
          title="Avg. Emergency Speed"
          value="76.2"
          unit="km/h"
          change={34.5}
          trend="up"
          color="cyan"
          icon={Clock}
          changeLabel="faster response transit"
        />

        <StatCard
          title="Critical Minutes Saved"
          value="8.4"
          unit="mins/run"
          change={21}
          trend="up"
          color="emerald"
          icon={Shield}
          changeLabel="life-saving transit time"
        />
      </div>

      {/* Top Grid: Controller & Visual Corridor Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <GreenWaveController />
        </div>

        <div className="lg:col-span-7">
          <EmergencyMapView />
        </div>
      </div>

      {/* Lower Grid: Active Dispatches & Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <ActiveDispatchesList />
        </div>

        <div className="lg:col-span-6">
          <SignalPreemptLog />
        </div>
      </div>
    </div>
  )
}

