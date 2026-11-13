import React from 'react'
import {
  LayoutDashboard,
  BrainCircuit,
  AlertTriangle,
  Route,
  Siren,
  BarChart3,
  Settings,
  Cpu,
  ChevronLeft,
  ChevronRight,
  Shield,
  Radio,
} from 'lucide-react'
import { useTraffic } from '../../context/TrafficContext'
import Badge from '../common/Badge'

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }) {
  const { currentPage, setCurrentPage, incidents, emergencyDispatches } = useTraffic()

  const activeIncidents = incidents.filter((i) => i.status !== 'Resolved').length
  const activeEmergencies = emergencyDispatches.filter((d) => d.priorityLevel === 'CODE RED').length

  const navItems = [
    {
      id: 'overview',
      label: 'Main Dashboard',
      shortLabel: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'prediction',
      label: 'Traffic Prediction',
      shortLabel: 'Prediction',
      icon: BrainCircuit,
      badge: 'AI ML',
      badgeVariant: 'purple',
    },
    {
      id: 'incidents',
      label: 'Incident Management',
      shortLabel: 'Incidents',
      icon: AlertTriangle,
      badge: activeIncidents > 0 ? activeIncidents : null,
      badgeVariant: 'rose',
    },
    {
      id: 'route',
      label: 'Route Planner',
      shortLabel: 'Route',
      icon: Route,
      badge: null,
    },
    {
      id: 'emergency',
      label: 'Emergency Response',
      shortLabel: 'Emergency',
      icon: Siren,
      badge: activeEmergencies > 0 ? 'ALERT' : null,
      badgeVariant: 'critical',
      pulseBadge: activeEmergencies > 0,
    },
    {
      id: 'analytics',
      label: 'Admin Analytics',
      shortLabel: 'Analytics',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'settings',
      label: 'System & API Config',
      shortLabel: 'Settings',
      icon: Settings,
      badge: null,
    },
  ]

  const handleNavClick = (id) => {
    setCurrentPage(id)
    if (onClose) onClose()
  }

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-800/90 bg-slate-950/95 backdrop-blur-2xl transition-all duration-300 ease-in-out lg:static ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-4">
          <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => handleNavClick('overview')}>
            <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-gray-950 font-black shadow-lg shadow-cyan-500/20">
              <Cpu className="w-6 h-6 text-black" />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400" />
              </span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-extrabold tracking-tight text-white">Traffic<span className="text-cyan-400">AI</span></span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">v2.4</span>
                </div>
                <span className="text-[10px] font-medium tracking-wider uppercase text-slate-400">Smart City Command</span>
              </div>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          {!isCollapsed && (
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Operations & Control
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-950/40'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-transparent'
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                </div>

                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <Badge
                        variant={item.badgeVariant || 'cyan'}
                        size="sm"
                        showDot={item.pulseBadge}
                        pulseDot={item.pulseBadge}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Operator status card */}
        {!isCollapsed && (
          <div className="p-3 border-t border-slate-800/80 bg-slate-900/40 m-2 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold text-xs">
                <Shield className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white truncate">Mansi S.</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <p className="text-[11px] text-slate-400 truncate">Chief Traffic Controller</p>
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-400" /> Node #04 Synced
              </span>
              <span className="font-mono text-cyan-400">LATENCY 14ms</span>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}

