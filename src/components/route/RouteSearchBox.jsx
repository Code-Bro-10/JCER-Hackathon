import React from 'react'
import { Navigation, MapPin, Car, Zap, Truck, Siren, ArrowUpDown } from 'lucide-react'
import { LANDMARKS } from '../../utils/constants'
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
}) {
  const handleSwap = () => {
    const temp = origin
    setOrigin(destination)
    setDestination(temp)
  }

  const vehicleOptions = [
    { id: 'passenger', label: 'Passenger Car', icon: Car },
    { id: 'ev', label: 'Electric EV', icon: Zap },
    { id: 'truck', label: 'Heavy Logistics', icon: Truck },
    { id: 'emergency', label: 'Emergency First Responder', icon: Siren },
  ]

  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
        <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
          <Navigation className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">AI Multi-Modal Route Optimizer</h3>
          <p className="text-xs text-slate-400">Dynamic congestion avoidance with green wave synchronization</p>
        </div>
      </div>

      {/* Origin & Destination inputs */}
      <div className="space-y-3 relative">
        {/* Origin */}
        <div>
          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" /> Origin Departure Point
          </label>
          <select
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none cursor-pointer"
          >
            {LANDMARKS.map((lm) => (
              <option key={`orig-${lm.id}`} value={lm.name}>
                {lm.name} ({lm.sector})
              </option>
            ))}
          </select>
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

        {/* Destination */}
        <div>
          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400" /> Target Destination
          </label>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none cursor-pointer"
          >
            {LANDMARKS.map((lm) => (
              <option key={`dest-${lm.id}`} value={lm.name}>
                {lm.name} ({lm.sector})
              </option>
            ))}
          </select>
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
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-950/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span className="text-[11px] font-semibold text-white">{opt.label}</span>
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
        className="w-full py-2.5"
      >
        Calculate Dynamic Routes
      </Button>
    </div>
  )
}

