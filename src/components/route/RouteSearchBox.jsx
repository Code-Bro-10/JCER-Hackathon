import React, { useState, useRef, useEffect } from 'react'
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
  Sparkles,
  School,
  Building,
  CheckCircle,
  Radio,
  Clock,
  Compass,
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
  onAskAI = null,
  isCalculating,
  onSelectOriginCoord = () => {},
  onSelectDestCoord = () => {},
}) {
  const [originSearch, setOriginSearch] = useState(origin || '')
  const [destSearch, setDestSearch] = useState(destination || '')

  const [originResults, setOriginResults] = useState([])
  const [destResults, setDestResults] = useState([])
  const [showOriginDropdown, setShowOriginDropdown] = useState(false)
  const [showDestDropdown, setShowDestDropdown] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [liveGpsInfo, setLiveGpsInfo] = useState(null)

  const originTimer = useRef(null)
  const destTimer = useRef(null)

  // Keep state in sync with parent props (e.g. from map clicks or preset jumps)
  useEffect(() => {
    if (origin !== undefined && origin !== originSearch) {
      setOriginSearch(origin)
    }
  }, [origin])

  useEffect(() => {
    if (destination !== undefined && destination !== destSearch) {
      setDestSearch(destination)
    }
  }, [destination])

  const handleSwap = () => {
    const tempSearch = originSearch
    setOriginSearch(destSearch)
    setDestSearch(tempSearch)

    const tempVal = origin
    setOrigin(destination)
    setDestination(tempVal)
    onSelectOriginCoord(null)
    onSelectDestCoord(null)
  }

  // 1-Click Live GPS Geolocation
  const handleDetectOrigin = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false)
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude
        const name = `My Live GPS Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`
        setOriginSearch(name)
        setOrigin(name)
        setLiveGpsInfo({ lat, lon, accuracy: Math.round(pos.coords.accuracy || 12) })
        onSelectOriginCoord([lat, lon])
      },
      (err) => {
        setIsLocating(false)
        console.warn('Geolocation failed:', err.message)
        // Fallback default
        const name = 'Rani Chennamma Circle (GPS Fallback)'
        setOriginSearch(name)
        setOrigin(name)
        onSelectOriginCoord([15.8596, 74.5098])
      },
      { timeout: 7000, enableHighAccuracy: true }
    )
  }

  const handleOriginChange = (val) => {
    setOriginSearch(val)
    setOrigin(val)
    onSelectOriginCoord(null) // Prompt geocoding for typed text

    if (originTimer.current) clearTimeout(originTimer.current)
    if (val.trim().length >= 2) {
      originTimer.current = setTimeout(async () => {
        const res = await searchNominatimLocations(val)
        setOriginResults(res)
        setShowOriginDropdown(true)
      }, 300)
    } else {
      setShowOriginDropdown(false)
    }
  }

  const handleDestChange = (val) => {
    setDestSearch(val)
    setDestination(val)
    onSelectDestCoord(null) // Prompt geocoding for typed text

    if (destTimer.current) clearTimeout(destTimer.current)
    if (val.trim().length >= 2) {
      destTimer.current = setTimeout(async () => {
        const res = await searchNominatimLocations(val)
        setDestResults(res)
        setShowDestDropdown(true)
      }, 300)
    } else {
      setShowDestDropdown(false)
    }
  }

  const vehicleOptions = [
    { id: 'passenger', label: 'Car / Cab', icon: Car },
    { id: 'ev', label: 'Electric EV', icon: Zap },
    { id: 'truck', label: 'Truck / Bus', icon: Truck },
    { id: 'emergency', label: 'Emergency', icon: Siren },
  ]

  // Curated Popular Starting Points in Belagavi
  const popularOrigins = [
    { name: 'Rani Chennamma Circle', lat: 15.8596, lon: 74.5098 },
    { name: 'Belagavi Central Station', lat: 15.8640, lon: 74.5080 },
    { name: 'Tilakwadi First Gate', lat: 15.8450, lon: 74.5020 },
    { name: 'CBT Bus Terminal', lat: 15.8530, lon: 74.5120 },
  ]

  // Curated Popular Destinations for 1-Click Fast Selection
  const popularDestinations = [
    { name: 'Jain College of Engineering (JCER)', lat: 15.8340, lon: 74.5360, type: 'College' },
    { name: 'RPD College Cross, Tilakwadi', lat: 15.8450, lon: 74.5020, type: 'School/College' },
    { name: 'KLE Medical Hospital', lat: 15.8890, lon: 74.5240, type: 'Hospital' },
    { name: 'Bogarves Junction', lat: 15.8550, lon: 74.5040, type: 'Junction' },
    { name: 'Suvarna Vidhana Soudha', lat: 15.8920, lon: 74.5680, type: 'Government' },
  ]

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-xl">
      {/* Box Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-600/15 border border-cyan-500/30 text-cyan-400">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Route Planner
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
                DUAL SOURCE MODES
              </span>
            </h3>
            <p className="text-xs text-slate-400">Live GPS, Manual Address & AI College Rush Intelligence</p>
          </div>
        </div>
      </div>

      {/* 1. SOURCE (DEPARTURE POINT) SELECTION */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-mono uppercase tracking-wider text-cyan-300 flex items-center gap-1.5 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
            1. Source (Departure Address)
          </label>

          {/* Quick 1-Click Live GPS Button */}
          <button
            type="button"
            onClick={handleDetectOrigin}
            disabled={isLocating}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25 transition-all cursor-pointer shadow-sm"
            title="Detect My Current Live GPS Location"
          >
            <LocateFixed className={`w-3 h-3 ${isLocating ? 'animate-spin text-cyan-200' : 'text-cyan-400'}`} />
            <span>{isLocating ? 'Locating...' : '📍 Use Live GPS'}</span>
          </button>
        </div>

        {/* Source Text Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={originSearch}
            onChange={(e) => handleOriginChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onCalculate()
            }}
            placeholder="Type starting address, landmark, college, or GPS..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-medium"
          />
          {originSearch && (
            <button
              type="button"
              onClick={() => {
                setOriginSearch('')
                setOrigin('')
                onSelectOriginCoord(null)
                setShowOriginDropdown(false)
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Source Autocomplete Dropdown */}
          {showOriginDropdown && originResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-750 rounded-xl shadow-2xl p-1 z-50 max-h-48 overflow-y-auto">
              <div className="px-2 py-1 text-[10px] font-mono text-cyan-400 border-b border-slate-800 flex justify-between">
                <span>SELECT STARTING ADDRESS</span>
                <span>{originResults.length} FOUND</span>
              </div>
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
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-xs text-slate-200 flex items-start gap-2 cursor-pointer transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-semibold text-white truncate">{loc.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {loc.lat.toFixed(4)}, {loc.lon.toFixed(4)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Source Preset Chips */}
        <div className="flex flex-wrap items-center gap-1 pt-0.5">
          <span className="text-[10px] font-mono text-slate-400 mr-1">Presets:</span>
          {popularOrigins.map((po) => (
            <button
              key={po.name}
              type="button"
              onClick={() => {
                setOriginSearch(po.name)
                setOrigin(po.name)
                onSelectOriginCoord([po.lat, po.lon])
              }}
              className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              {po.name.split(' (')[0].split(',')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Center Swap Button */}
      <div className="flex justify-center -my-1">
        <button
          type="button"
          onClick={handleSwap}
          className="p-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1 text-[10px] px-2 shadow-sm"
          title="Swap Source and Destination"
        >
          <ArrowUpDown className="w-3 h-3 text-cyan-400" />
          <span className="font-mono">Swap</span>
        </button>
      </div>

      {/* 2. TARGET DESTINATION SELECTION */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-mono uppercase tracking-wider text-rose-300 flex items-center gap-1.5 font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-sm shadow-rose-400/50" />
          2. Destination (Arrival Address)
        </label>

        {/* Destination Text Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={destSearch}
            onChange={(e) => handleDestChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onCalculate()
            }}
            placeholder="Type destination, college, hospital or office..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all font-medium"
          />
          {destSearch && (
            <button
              type="button"
              onClick={() => {
                setDestSearch('')
                setDestination('')
                onSelectDestCoord(null)
                setShowDestDropdown(false)
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Destination Autocomplete Dropdown */}
          {showDestDropdown && destResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-750 rounded-xl shadow-2xl p-1 z-50 max-h-48 overflow-y-auto">
              <div className="px-2 py-1 text-[10px] font-mono text-rose-400 border-b border-slate-800 flex justify-between">
                <span>SELECT DESTINATION ADDRESS</span>
                <span>{destResults.length} FOUND</span>
              </div>
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
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-xs text-slate-200 flex items-start gap-2 cursor-pointer transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-semibold text-white truncate">{loc.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {loc.lat.toFixed(4)}, {loc.lon.toFixed(4)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Destination Preset Chips */}
        <div className="flex flex-wrap items-center gap-1 pt-0.5">
          <span className="text-[10px] font-mono text-slate-400 mr-1">Landmarks:</span>
          {popularDestinations.map((pd) => (
            <button
              key={pd.name}
              type="button"
              onClick={() => {
                setDestSearch(pd.name)
                setDestination(pd.name)
                onSelectDestCoord([pd.lat, pd.lon])
              }}
              className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-300 hover:border-rose-500/50 hover:text-rose-300 transition-colors cursor-pointer flex items-center gap-1"
            >
              {pd.type.includes('College') ? '🎓' : pd.type.includes('Hospital') ? '🏥' : '📍'}
              <span>{pd.name.split(' (')[0].split(',')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Vehicle Profile Selector */}
      <div className="pt-1">
        <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 block">
          Vehicle Profile
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
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
                <Icon className={`w-3.5 h-3.5 mb-1 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                <span className="text-[10px] font-semibold">{opt.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 4. TWO ROUTE OPTION BUTTONS (As requested by User) */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        {/* OPTION 1: Find All Routes for Manual Inspection */}
        <Button
          type="button"
          variant="secondary"
          size="md"
          loading={isCalculating}
          onClick={onCalculate}
          className="w-full justify-center font-bold text-xs"
        >
          <span>🔍 Option 1: View Criteria & Choose Manually</span>
        </Button>

        {/* OPTION 2: Ask AI (Checks College/School Zones, Rush Hours, Road Condition & Recommends Best Path) */}
        <button
          type="button"
          disabled={isCalculating}
          onClick={onAskAI || onCalculate}
          className="w-full py-2.5 px-3 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 transition-all flex items-center justify-center gap-2 cursor-pointer border border-cyan-400/40 group"
        >
          <Sparkles className="w-4 h-4 text-yellow-300 animate-spin group-hover:scale-125 transition-transform" />
          <span>Option 2: ✨ Ask AI Smart Route Recommendation</span>
        </button>

        <p className="text-[10px] text-slate-500 text-center font-mono">
          AI checks active school/college bell rush, potholes & signal green waves.
        </p>
      </div>
    </div>
  )
}
