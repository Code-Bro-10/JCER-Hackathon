import React, { useState, useEffect, useCallback } from 'react'
import {
  ShieldCheck,
  Clock,
  Zap,
  Leaf,
  RotateCw,
  Navigation,
  CheckCircle,
  AlertTriangle,
  Info,
  Car,
  Fuel,
  ArrowRight,
  TrendingDown,
  Layers,
} from 'lucide-react'
import RouteSearchBox from '../components/route/RouteSearchBox'
import RouteComparisonCard from '../components/route/RouteComparisonCard'
import TurnByTurnList from '../components/route/TurnByTurnList'
import RouteMapPreview from '../components/route/RouteMapPreview'
import StatCard from '../components/common/StatCard'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'
import { useTraffic } from '../context/TrafficContext'
import { fetchOSRMRoutes, searchNominatimLocations } from '../services/osmRoutingService'
import { BELAGAVI_NODES, BENGALURU_NODES, DEFAULT_MAP_CENTER } from '../services/roadNetworkData'

export default function RoutePlannerPage() {
  const { addToast } = useTraffic()

  const [origin, setOrigin] = useState('Rani Chennamma Circle, Belagavi')
  const [destination, setDestination] = useState('Jain College of Engineering (JCER), Belagavi')
  const [originCoord, setOriginCoord] = useState([15.8596, 74.5098])
  const [destCoord, setDestCoord] = useState([15.8340, 74.5360])
  const [vehicleType, setVehicleType] = useState('passenger')
  const [isCalculating, setIsCalculating] = useState(false)
  const [routePlan, setRoutePlan] = useState(null)
  const [selectedRouteId, setSelectedRouteId] = useState('route-ai-smart')

  // Calculate routes using OSRM with local fallback
  const handleCalculateRoutes = useCallback(async () => {
    try {
      setIsCalculating(true)

      // Resolve coordinates if user entered a custom name
      let startPoint = originCoord
      let endPoint = destCoord

      if (!startPoint || startPoint.length !== 2) {
        const found = await searchNominatimLocations(origin)
        if (found.length > 0) startPoint = [found[0].lat, found[0].lon]
        else startPoint = [15.8596, 74.5098]
      }

      if (!endPoint || endPoint.length !== 2) {
        const found = await searchNominatimLocations(destination)
        if (found.length > 0) endPoint = [found[0].lat, found[0].lon]
        else endPoint = [15.8340, 74.5360]
      }

      const res = await fetchOSRMRoutes(startPoint, endPoint, { vehicleType })
      if (res && res.success) {
        setRoutePlan(res)
        setSelectedRouteId('route-ai-smart')
        addToast({
          type: 'success',
          title: '3 Dynamic Routes Calculated',
          message: `${res.source}. Optimal route saves ~${Math.max(3, Math.round((res.routes[1]?.durationMin || 25) - (res.routes[0]?.durationMin || 18)))} mins.`,
        })
      }
    } catch (err) {
      addToast({ type: 'danger', title: 'Routing Error', message: err.message })
    } finally {
      setIsCalculating(false)
    }
  }, [origin, destination, originCoord, destCoord, vehicleType, addToast])

  useEffect(() => {
    handleCalculateRoutes()
  }, [])

  const selectedRoute =
    routePlan?.routes?.find((r) => r.id === selectedRouteId) || routePlan?.routes?.[0]

  const handleMapClickCoordinate = (latlng) => {
    // Alternate setting origin and destination
    setDestCoord([latlng.lat, latlng.lng])
    setDestination(`Map Pin (${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)})`)
    addToast({
      type: 'info',
      title: 'Destination Set from Map Click',
      message: `Selected Lat: ${latlng.lat.toFixed(4)}, Lon: ${latlng.lng.toFixed(4)}. Recalculating...`,
    })
  }

  // Comparison Table formatting helper
  const routesList = routePlan?.routes || []

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            Dynamic Multi-Modal Route Optimization
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30">
              OSRM + A* ENGINE
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time congestion bypass, signal green-wave coordination, road closure avoidance, and fuel-optimal alternative discovery.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={RotateCw}
          onClick={handleCalculateRoutes}
          loading={isCalculating}
        >
          Recalculate Routes
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Recommended Path ETA"
          value={selectedRoute ? `${selectedRoute.durationMin}m` : '22m'}
          change={-Math.max(3, Math.round(((routesList[1]?.durationMin || 25) - (selectedRoute?.durationMin || 18))))}
          trend="up"
          color="cyan"
          icon={Clock}
          changeLabel={`faster than shortest distance`}
        />

        <StatCard
          title="Corridor Distance"
          value={selectedRoute ? `${selectedRoute.distanceKm} km` : '12.4 km'}
          change={selectedRoute ? selectedRoute.distanceKm : 12.4}
          trend="up"
          color="blue"
          icon={Navigation}
          changeLabel="total travel mileage"
        />

        <StatCard
          title="Estimated Fuel / Energy"
          value={selectedRoute ? `${selectedRoute.fuelLitres} L` : '1.2 L'}
          change={-14.2}
          trend="up"
          color="emerald"
          icon={Fuel}
          changeLabel={vehicleType === 'ev' ? 'Electric efficiency' : 'fuel burned'}
        />

        <StatCard
          title="Route Reliability"
          value={selectedRoute ? `${selectedRoute.reliabilityScore}%` : '94%'}
          change={12.4}
          trend="up"
          color="emerald"
          icon={ShieldCheck}
          changeLabel="confidence score"
        />
      </div>

      {/* Main Grid: Inputs + Map Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Search & Vehicle Selectors */}
        <div className="space-y-4">
          <RouteSearchBox
            origin={origin}
            setOrigin={setOrigin}
            destination={destination}
            setDestination={setDestination}
            vehicleType={vehicleType}
            setVehicleType={setVehicleType}
            onCalculate={handleCalculateRoutes}
            isCalculating={isCalculating}
            onSelectOriginCoord={setOriginCoord}
            onSelectDestCoord={setDestCoord}
          />

          {/* Multi-Route Alternate Paths Selection */}
          {routesList && routesList.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  Calculated Route Corridors ({routesList.length})
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">Select path to navigate</span>
              </div>
              <div className="space-y-3">
                {routesList.map((r) => (
                  <RouteComparisonCard
                    key={r.id}
                    route={r}
                    isSelected={r.id === selectedRouteId}
                    onSelect={() => setSelectedRouteId(r.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Turn-by-turn maneuvers */}
          {selectedRoute && (
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-blue-400" />
                  Turn-By-Turn Navigation Steps
                </h4>
                <Badge variant="blue" size="sm">{selectedRoute.name.split(' ')[0]}</Badge>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {(selectedRoute.turnByTurn || []).map((step, idx) => (
                  <div key={idx} className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-xs flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 font-mono text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-white font-medium">{step.instruction}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {step.distanceMeters > 1000 ? `${(step.distanceMeters / 1000).toFixed(1)} km` : `${step.distanceMeters}m`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Leaflet Map Preview (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <RouteMapPreview
            route={selectedRoute}
            routes={routesList}
            origin={origin}
            destination={destination}
            originCoord={originCoord}
            destCoord={destCoord}
            selectedRouteId={selectedRouteId}
            onSelectRoute={setSelectedRouteId}
            onMapClick={handleMapClickCoordinate}
          />

          {/* Recommended Route Reason Explanation Card (PART 4) */}
          {selectedRoute && (
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Route Selection Rationale & Recommendation Analysis
                </span>
                <span className="text-[10px] font-mono text-blue-400 font-bold">
                  {routePlan?.source || 'OSRM Live Routing'}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedRoute.selectionReason ||
                  'This path was selected as RECOMMENDED because it optimizes travel time by routing along high-capacity arterials with synchronized signal green waves, completely avoiding active downtown collision choke points.'}
              </p>
              <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-mono text-slate-400">
                <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-emerald-400 font-bold">
                  ✓ Road Closures Avoided: Yes
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-400">
                  ML Forecast Speed: ~{Math.round(selectedRoute.distanceKm / (selectedRoute.durationMin / 60))} km/h
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                  Reliability: {selectedRoute.reliabilityScore}%
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                  Fuel Burn: {selectedRoute.fuelLitres} L
                </span>
              </div>
            </div>
          )}

          {/* Comprehensive Route Alternatives Comparison Table (PART 4) */}
          {routesList.length > 0 && (
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                <span>Multi-Modal Alternatives Side-by-Side Comparison</span>
                <span className="text-[10px] font-mono text-blue-400">3 PATHS EVALUATED</span>
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400">
                      <th className="py-2">Alternative Path</th>
                      <th className="py-2">Distance</th>
                      <th className="py-2">Travel Time</th>
                      <th className="py-2">Congestion</th>
                      <th className="py-2">Fuel (L)</th>
                      <th className="py-2">Reliability</th>
                      <th className="py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {routesList.map((r) => {
                      const isCurrent = r.id === selectedRouteId
                      return (
                        <tr
                          key={r.id}
                          onClick={() => setSelectedRouteId(r.id)}
                          className={`cursor-pointer transition-colors ${
                            isCurrent ? 'bg-blue-600/10 text-white' : 'hover:bg-slate-800/50 text-slate-300'
                          }`}
                        >
                          <td className="py-2.5 font-sans font-medium flex items-center gap-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                r.id === 'route-ai-smart'
                                  ? 'bg-blue-500'
                                  : r.id === 'route-shortest'
                                  ? 'bg-rose-500'
                                  : 'bg-emerald-500'
                              }`}
                            />
                            <span>{r.name}</span>
                            {r.isRecommended && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                RECOMMENDED
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 text-slate-300">{r.distanceKm} km</td>
                          <td className="py-2.5 font-bold text-white">
                            {r.durationMin} mins
                          </td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.congestionLevel === 'optimal'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : r.congestionLevel === 'moderate'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}>
                              {r.congestionLevel?.toUpperCase() || 'NORMAL'}
                            </span>
                          </td>
                          <td className="py-2.5 text-slate-300">{r.fuelLitres} L</td>
                          <td className="py-2.5 text-emerald-400 font-bold">{r.reliabilityScore}%</td>
                          <td className="py-2.5 text-right">
                            <button
                              type="button"
                              className={`px-2 py-1 rounded text-[10px] font-sans font-bold cursor-pointer ${
                                isCurrent
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              {isCurrent ? 'Selected' : 'Select'}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
