import React, { useState, useEffect, useCallback } from 'react'
import { ShieldCheck, Clock, Zap, Leaf, RotateCw } from 'lucide-react'
import { TrafficService } from '../services/api'
import RouteSearchBox from '../components/route/RouteSearchBox'
import RouteComparisonCard from '../components/route/RouteComparisonCard'
import TurnByTurnList from '../components/route/TurnByTurnList'
import RouteMapPreview from '../components/route/RouteMapPreview'
import StatCard from '../components/common/StatCard'
import Button from '../components/common/Button'
import { useTraffic } from '../context/TrafficContext'

export default function RoutePlannerPage() {
  const { addToast } = useTraffic()

  const [origin, setOrigin] = useState('Metropolis Central Square')
  const [destination, setDestination] = useState('Silicon Bay Tech Park')
  const [vehicleType, setVehicleType] = useState('passenger')
  const [isCalculating, setIsCalculating] = useState(false)
  const [routePlan, setRoutePlan] = useState(null)
  const [selectedRouteId, setSelectedRouteId] = useState('route-ai-smart')

  const handleCalculateRoutes = useCallback(async () => {
    try {
      setIsCalculating(true)
      const res = await TrafficService.planRoute({
        origin,
        destination,
        vehicleType,
      })
      if (res.success) {
        setRoutePlan(res)
        setSelectedRouteId('route-ai-smart')
        addToast({
          type: 'success',
          title: '3 Dynamic Routes Calculated',
          message: 'Optimal route avoids downtown collision; ETA: 22 minutes.',
        })
      }
    } catch (err) {
      addToast({ type: 'danger', title: 'Routing Error', message: err.message })
    } finally {
      setIsCalculating(false)
    }
  }, [origin, destination, vehicleType, addToast])

  useEffect(() => {
    handleCalculateRoutes()
  }, [handleCalculateRoutes])

  const selectedRoute =
    routePlan?.options?.find((r) => r.id === selectedRouteId) || routePlan?.options?.[0]

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            Dynamic Route Optimization Engine
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              VMS SYNCED
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time congestion bypass, green wave progression matching, and carbon-minimized paths.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={RotateCw}
          onClick={handleCalculateRoutes}
          loading={isCalculating}
        >
          Recalculate Telemetry
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Fastest Path ETA"
          value={selectedRoute ? `${selectedRoute.durationMin}m` : '22m'}
          change={-19}
          trend="up"
          color="cyan"
          icon={Clock}
          changeLabel="19m faster than shortest"
        />

        <StatCard
          title="Green Wave Corridor Sync"
          value="94%"
          change={12.4}
          trend="up"
          color="emerald"
          icon={ShieldCheck}
          changeLabel="signals green on arrival"
        />

        <StatCard
          title="Avoided Idle Delay"
          value="18.5"
          unit="mins"
          change={24}
          trend="up"
          color="amber"
          icon={Zap}
          changeLabel="bypassing Market St jam"
        />

        <StatCard
          title="Carbon Saved"
          value="2.7"
          unit="kg CO₂"
          change={38}
          trend="up"
          color="emerald"
          icon={Leaf}
          changeLabel="smooth momentum route"
        />
      </div>

      {/* Top Grid: Route Search & Map Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <RouteSearchBox
            origin={origin}
            setOrigin={setOrigin}
            destination={destination}
            setDestination={setDestination}
            vehicleType={vehicleType}
            setVehicleType={setVehicleType}
            onCalculate={handleCalculateRoutes}
            isCalculating={isCalculating}
          />
        </div>

        <div className="lg:col-span-7">
          <RouteMapPreview
            route={selectedRoute}
            origin={origin}
            destination={destination}
          />
        </div>
      </div>

      {/* Route Options Comparison (Requirement: Route planner interface) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            Multi-Modal Route Alternatives
            <span className="text-xs text-slate-400 font-normal">
              (Select an option to preview turn-by-turn guidance)
            </span>
          </h3>
          <span className="text-xs font-mono text-cyan-400">3 Calculated</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {routePlan?.options?.map((opt) => (
            <RouteComparisonCard
              key={opt.id}
              route={opt}
              isSelected={selectedRouteId === opt.id}
              onSelect={() => setSelectedRouteId(opt.id)}
            />
          ))}
        </div>
      </div>

      {/* Turn-by-Turn Guidance for Selected Route */}
      <TurnByTurnList steps={selectedRoute?.steps || []} />
    </div>
  )
}
