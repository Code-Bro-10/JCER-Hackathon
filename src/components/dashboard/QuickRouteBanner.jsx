import React, { useState } from 'react'
import {
  Navigation,
  MapPin,
  LocateFixed,
  Search,
  Sparkles,
  ArrowRight,
  School,
  Clock,
  Car,
} from 'lucide-react'
import { useTraffic } from '../../context/TrafficContext'
import Button from '../common/Button'

export default function QuickRouteBanner() {
  const { setCurrentPage, setRouteSearchParams } = useTraffic()

  const [origin, setOrigin] = useState('Rani Chennamma Circle, Belagavi')
  const [destination, setDestination] = useState('Jain College of Engineering (JCER), Belagavi')
  const [isLocating, setIsLocating] = useState(false)

  // 1-Click Live GPS Geolocation
  const handleDetectGPS = () => {
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
        setOrigin(name)
        setRouteSearchParams((prev) => ({
          ...prev,
          origin: name,
          originCoord: [lat, lon],
        }))
      },
      (err) => {
        setIsLocating(false)
        console.warn('Geolocation failed:', err.message)
      },
      { timeout: 7000, enableHighAccuracy: true }
    )
  }

  const handleLaunchRoute = (isAskAI = false) => {
    setRouteSearchParams({
      origin,
      destination,
      originCoord: origin.startsWith('My Live GPS') ? undefined : null, // will re-geocode in RoutePlanner
      destCoord: null, // will re-geocode in RoutePlanner
      autoCalculate: !isAskAI,
      autoAskAI: isAskAI,
    })
    setCurrentPage('route')
  }

  const popularDestinations = [
    { name: 'Jain College of Engineering (JCER)', icon: '🎓' },
    { name: 'RPD College Cross, Tilakwadi', icon: '🏫' },
    { name: 'Belagavi Railway Station', icon: '🚆' },
    { name: 'KLE Medical Hospital', icon: '🏥' },
  ]

  return (
    <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/60 to-slate-900 border border-cyan-500/30 p-4 sm:p-5 shadow-xl space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-300">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              Plan Multi-Modal Route
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-mono">
                SOURCE & DESTINATION
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Enter your departure and arrival address to check traffic flow, road condition & school bell rush.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCurrentPage('route')}
          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold self-start sm:self-auto cursor-pointer"
        >
          <span>Open Full Route Planner</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Input Row: Source & Destination Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Source Departure Address */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono uppercase tracking-wider text-cyan-300 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Source Address (Departure)
            </label>
            <button
              type="button"
              onClick={handleDetectGPS}
              disabled={isLocating}
              className="text-[10px] font-bold text-cyan-400 hover:text-cyan-200 flex items-center gap-1 cursor-pointer"
            >
              <LocateFixed className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Locating...' : '📍 Use Live GPS'}</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Enter starting point (or click 'Use Live GPS')..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-medium"
            />
          </div>
        </div>

        {/* Destination Arrival Address */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase tracking-wider text-rose-300 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            Destination Address (Arrival)
          </label>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Enter destination, college, or hospital..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Quick Destination Chips & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono text-slate-400 mr-1">Quick Picks:</span>
          {popularDestinations.map((pd) => (
            <button
              key={pd.name}
              type="button"
              onClick={() => setDestination(pd.name)}
              className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-300 hover:border-slate-600 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>{pd.icon}</span>
              <span>{pd.name.split(' (')[0].split(',')[0]}</span>
            </button>
          ))}
        </div>

        {/* Two Options */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Option 1: Manual criteria selection */}
          <button
            type="button"
            onClick={() => handleLaunchRoute(false)}
            className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            🔍 Option 1: View Criteria
          </button>

          {/* Option 2: Ask AI */}
          <button
            type="button"
            onClick={() => handleLaunchRoute(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/25 transition-all flex items-center gap-1.5 cursor-pointer border border-cyan-400/30"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" />
            <span>Option 2: ✨ Ask AI</span>
          </button>
        </div>
      </div>
    </div>
  )
}
