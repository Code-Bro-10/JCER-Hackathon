import React from 'react'
import { LayoutDashboard, BrainCircuit, AlertTriangle, Siren, Route, BarChart3 } from 'lucide-react'
import { useTraffic } from '../../context/TrafficContext'

export default function MobileNav() {
  const { currentPage, setCurrentPage, incidents, emergencyDispatches } = useTraffic()

  const activeIncidents = incidents.filter((i) => i.status !== 'Resolved').length
  const activeEmergencies = emergencyDispatches.filter((d) => d.priorityLevel === 'CODE RED').length

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'prediction', label: 'Predict', icon: BrainCircuit },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle, badge: activeIncidents },
    { id: 'route', label: 'Routes', icon: Route },
    { id: 'emergency', label: 'Emergency', icon: Siren, alert: activeEmergencies > 0 },
    { id: 'analytics', label: 'Stats', icon: BarChart3 },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl px-2 py-1.5 flex items-center justify-around shadow-2xl">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = currentPage === tab.id

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setCurrentPage(tab.id)}
            className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-all cursor-pointer ${
              isActive ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              {tab.badge > 0 && (
                <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
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
            <span className="mt-1">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

