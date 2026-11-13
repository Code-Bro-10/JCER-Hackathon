import React, { useState, useRef } from 'react'
import {
  Navigation,
  MapPin,
  Car,
  Zap,
  Truck,
  Siren,
  ArrowUpDown,
  LocateFixed,
  Search,
  X,
  CheckCircle,
} from 'lucide-react'
import { BELAGAVI_LANDMARKS, BENGALURU_LANDMARKS } from '../../services/roadNetworkData'
import { searchNominatimLocations } from '../../services/osmRoutingService'
import Button from '../common/Button'

export default function RouteSearchBox({
  origin,
  setOrigin,
  destination,
  setDestination,
  vehicleType,
  setVehicleType,
  onCalculate,
  isCalculating,
  onSelectOriginCoord = () => {},
  onSelectDestCoord = () => {},
}) {
  const [originSearch, setOriginSearch] = useState(origin || 'Rani Chennamma Circle, Belagavi')
  const [destSearch, setDestSearch] = useState(destination || 'Jain College of Engineering (JCER), Belagavi')

  const [originResults, setOriginResults] = useState([])
  const [destResults, setDestResults] = useState([])
  const [showOriginDropdown, setShowOriginDropdown] = useState(false)
  const [showDestDropdown, setShowDestDropdown] = useState(false)
  const [isLocating, setIsLocating] = useState(false)

  const originTimer = useRef(null)
  const destTimer = useRef(null)

  const handleSwap = () => {
    const temp = originSearch
    setOriginSearch(destSearch)
    setDestSearch(temp)
    setOrigin(destination)
    setDestination(origin)
  }

  // Geolocation for Origin
  const handleDetectOrigin = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false)
        const name = `My Current Location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`
        setOriginSearch(name)
        setOrigin(name)
        onSelectOriginCoord([pos.coords.latitude, pos.coords.longitude])
      },
      (err) => {
        setIsLocating(false)
        console.warn('Geolocation failed:', err.message)
      },
      { timeout: 7000 }
    )
  }

  const handleOriginChange = (val) => {
    setOriginSearch(val)
    setOrigin(val)

    if (originTimer.current) clearTimeout(originTimer.current)
    if (val.trim().length >= 2) {
      originTimer.current = setTimeout(async () => {
        const res = await searchNominatimLocations(val)
        setOriginResults(res)
        setShowOriginDropdown(true)
      }, 400)
    } else {
      setShowOriginDropdown(false)
    }
  }

  const handleDestChange = (val) => {
    setDestSearch(val)
    setDestination(val)

    if (destTimer.current) clearTimeout(destTimer.current)
    if (val.trim().length >= 2) {
      destTimer.current = setTimeout(async () => {
        const res = await searchNominatimLocations(val)
        setDestResults(res)
        setShowDestDropdown(true)
      }, 400)
    } else {
      setShowDestDropdown(false)
    }
  }

  const vehicleOptions = [
    { id: 'passenger', label: 'Passenger Car', icon: Car },
    { id: 'ev', label: 'Electric EV', icon: Zap },
    { id: 'truck', label: 'Logistics / Truck', icon: Truck },
    { id: 'emergency', label: 'First Responder', icon: Siren },
  ]

  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
        <div className="p-2 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-400">
          <Navigation className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">AI Multi-Modal Route Optimizer</h3>
          <p className="text-xs text-slate-400">OSRM Live Road Geometry with Dijkstra/A* Local Fallback</p>
        </div>
      </div>

      {/* Origin & Destination inputs with live autocomplete */}
      <div className="space-y-3 relative">
        {/* Origin Input */}
        <div className="relative">
          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" /> Origin Departure Point
            </span>
            <button
              type="button"
              onClick={handleDetectOrigin}
              className="text-blue-400 hover:text-blue-300 font-mono text-[10px] flex items-center gap-1 cursor-pointer"
              title="Use GPS Coordinates"
            >
              <LocateFixed className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
              <span>Use Current GPS</span>
            </button>
          </label>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={originSearch}
              onChange={(e) => handleOriginChange(e.target.value)}
              placeholder="Type origin or landmark (e.g. Majestic, MG Road)..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-8 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
            {originSearch && (
              <button
                type="button"
                onClick={() => {
                  setOriginSearch('')
                  setShowOriginDropdown(false)
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showOriginDropdown && originResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-50 max-h-48 overflow-y-auto">
              {originResults.map((loc, idx) => (
                <button
                  key={`orig-opt-${idx}`}
                  type="button"
                  onClick={() => {
                    const shortName = loc.name.split(',')[0]
                    setOriginSearch(shortName)
                    setOrigin(shortName)
                    onSelectOriginCoord([loc.lat, loc.lon])
                    setShowOriginDropdown(false)
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-xs text-slate-200 flex items-start gap-2"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-semibold text-white truncate">{loc.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{loc.lat.toFixed(4)}, {loc.lon.toFixed(4)}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Swap button */}
        <div className="flex justify-end pr-2 -my-1">
          <button
            type="button"
            onClick={handleSwap}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            title="Swap Origin & Destination"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Destination Input */}
        <div className="relative">
          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400" /> Target Destination
          </label>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={destSearch}
              onChange={(e) => handleDestChange(e.target.value)}
              placeholder="Type destination or landmark (e.g. Silk Board, Whitefield)..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-8 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
            {destSearch && (
              <button
                type="button"
                onClick={() => {
                  setDestSearch('')
                  setShowDestDropdown(false)
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showDestDropdown && destResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-50 max-h-48 overflow-y-auto">
              {destResults.map((loc, idx) => (
                <button
                  key={`dest-opt-${idx}`}
                  type="button"
                  onClick={() => {
                    const shortName = loc.name.split(',')[0]
                    setDestSearch(shortName)
                    setDestination(shortName)
                    onSelectDestCoord([loc.lat, loc.lon])
                    setShowDestDropdown(false)
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-xs text-slate-200 flex items-start gap-2"
                >
                  <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-semibold text-white truncate">{loc.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{loc.lat.toFixed(4)}, {loc.lon.toFixed(4)}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Landmark Chips */}
      <div>
        <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1.5">
          Quick Belagavi / Local Landmarks:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {BELAGAVI_LANDMARKS.slice(0, 6).map((lm) => (
            <button
              key={lm.id}
              type="button"
              onClick={() => {
                setDestSearch(lm.name)
                setDestination(lm.name)
              }}
              className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-300 hover:border-slate-700 hover:text-white"
            >
              {lm.name.split(' (')[0].split(',')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Vehicle Type Selector */}
      <div>
        <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2 block">
          Vehicle Profile & Routing Constraints
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {vehicleOptions.map((opt) => {
            const Icon = opt.icon
            const isSelected = vehicleType === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setVehicleType(opt.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500 text-blue-200 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                <span className="text-[10px] font-semibold">{opt.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Submit Action */}
      <Button
        variant="primary"
        loading={isCalculating}
        onClick={onCalculate}
        className="w-full py-2.5 font-bold"
      >
        Calculate Optimal Routes (OSRM + A*)
      </Button>
    </div>
  )
}
