import React from 'react'
import {
  LayoutDashboard,
  Globe,
  Route,
  BrainCircuit,
  AlertTriangle,
  TrendingUp,
  Zap,
  Siren,
  Layers,
  BarChart3,
  Shield,
  Camera,
} from 'lucide-react'
import { useTraffic } from '../../context/TrafficContext'

export default function MobileNav() {
  const { currentPage, setCurrentPage, incidents, emergencyDispatches } = useTraffic()

  const activeIncidents = incidents.filter((i) => i.status !== 'Resolved').length
  const activeEmergencies = emergencyDispatches.filter((d) => d.priorityLevel === 'CODE RED').length

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'live-map', label: 'Map', icon: Globe },
    { id: 'route', label: 'Route', icon: Route },
    { id: 'prediction', label: 'Predict', icon: BrainCircuit },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle, badge: activeIncidents },
    { id: 'network-impact', label: 'Impact', icon: TrendingUp },
    { id: 'signal-optimization', label: 'Signals', icon: Zap },
    { id: 'emergency', label: 'Siren', icon: Siren, alert: activeEmergencies > 0 },
    { id: 'digital-twin', label: 'Twin', icon: Layers },
    { id: 'camera-intelligence', label: 'Vision', icon: Camera },
    { id: 'admin', label: 'Admin', icon: Shield },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden border-t border-slate-800 bg-[#111827] px-1 py-1 flex items-center justify-around shadow-2xl overflow-x-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = currentPage === tab.id

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setCurrentPage(tab.id)}
            className={`relative flex flex-col items-center justify-center py-1 px-1.5 rounded-lg text-[9px] font-medium transition-all cursor-pointer flex-shrink-0 ${
              isActive ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
              {tab.badge > 0 && (
                <span className="absolute -top-1 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white">
                  {tab.badge}
                </span>
              )}
              {tab.alert && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                </span>
              )}
            </div>
            <span className="mt-0.5 whitespace-nowrap">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
