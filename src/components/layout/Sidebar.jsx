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
  Settings,
  ChevronLeft,
  ChevronRight,
  Radio,
  Camera,
  KeyRound,
} from 'lucide-react'
import { useTraffic } from '../../context/TrafficContext'
import { useAuth } from '../../context/AuthContext'
import Badge from '../common/Badge'

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }) {
  const { currentPage, setCurrentPage, incidents, emergencyDispatches } = useTraffic()
  const { user } = useAuth()

  const activeIncidents = incidents.filter((i) => i.status !== 'Resolved').length
  const activeEmergencies = emergencyDispatches.filter((d) => d.priorityLevel === 'CODE RED').length

  // Exactly matching PS01 specifications from PART 2:
  // 1. Overview, 2. Live Traffic Map, 3. Route Planner, 4. Traffic Prediction,
  // 5. Incident Management, 6. Network Impact, 7. Signal Optimization,
  // 8. Emergency Routing, 9. Digital Twin, 10. Analytics, 11. Admin Dashboard
  const navItems = [
    {
      id: 'overview',
      label: '1. Overview',
      shortLabel: 'Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'live-map',
      label: '2. Live Traffic Map',
      shortLabel: 'Live Map',
      icon: Globe,
      badge: 'OSM',
      badgeVariant: 'blue',
    },
    {
      id: 'route',
      label: '3. Route Planner',
      shortLabel: 'Routes',
      icon: Route,
      badge: null,
    },
    {
      id: 'prediction',
      label: '4. Traffic Prediction',
      shortLabel: 'Prediction',
      icon: BrainCircuit,
      badge: '15-30m',
      badgeVariant: 'purple',
    },
    {
      id: 'incidents',
      label: '5. Incident Management',
      shortLabel: 'Incidents',
      icon: AlertTriangle,
      badge: activeIncidents > 0 ? activeIncidents : null,
      badgeVariant: 'rose',
    },
    {
      id: 'network-impact',
      label: '6. Network Impact',
      shortLabel: 'Impact',
      icon: TrendingUp,
      badge: 'LWR',
      badgeVariant: 'amber',
    },
    {
      id: 'signal-optimization',
      label: '7. Signal Optimization',
      shortLabel: 'Signals',
      icon: Zap,
      badge: 'Webster',
      badgeVariant: 'emerald',
    },
    {
      id: 'emergency',
      label: '8. Emergency Routing',
      shortLabel: 'Emergency',
      icon: Siren,
      badge: activeEmergencies > 0 ? 'ALERT' : null,
      badgeVariant: 'critical',
      pulseBadge: activeEmergencies > 0,
    },
    {
      id: 'digital-twin',
      label: '9. Digital Twin',
      shortLabel: 'Digital Twin',
      icon: Layers,
      badge: '8 Sims',
      badgeVariant: 'cyan',
    },
    {
      id: 'analytics',
      label: '10. Analytics',
      shortLabel: 'Analytics',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'admin',
      label: '11. Admin Dashboard',
      shortLabel: 'Admin',
      icon: Shield,
      badge: null,
    },
    {
      id: 'camera-intelligence',
      label: '12. Camera Intelligence',
      shortLabel: 'Vision AI',
      icon: Camera,
      badge: 'YOLO+CV',
      badgeVariant: 'cyan',
    },
    {
      id: 'login',
      label: '13. User & Admin Auth',
      shortLabel: 'Auth',
      icon: KeyRound,
      badge: user ? user.role.toUpperCase() : 'LOGIN',
      badgeVariant: user?.role === 'admin' ? 'rose' : user?.role === 'operator' ? 'amber' : 'cyan',
    },
    {
      id: 'settings',
      label: 'System & Config',
      shortLabel: 'Config',
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
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-800 bg-[#111827] transition-all duration-200 ease-in-out lg:static ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
          <div
            className="flex items-center gap-2.5 overflow-hidden cursor-pointer"
            onClick={() => handleNavClick('overview')}
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-black shadow-md">
              <Zap className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold tracking-tight text-white">
                    Traffic<span className="text-blue-500">AI</span>
                  </span>
                  <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.2 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    PS01
                  </span>
                </div>
                <span className="text-[10px] font-medium tracking-wider uppercase text-slate-400">
                  Belagavi & Metro ITS
                </span>
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

        {/* Navigation links list */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1">
          {!isCollapsed && (
            <div className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              ITS Operational Modules
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
                className={`w-full group flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />

                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <Badge
                        variant={item.badgeVariant || 'blue'}
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
          <div
            onClick={() => handleNavClick('login')}
            className="p-3 border-t border-slate-800 bg-slate-900/60 m-2 rounded-xl cursor-pointer hover:bg-slate-900/90 hover:border-slate-700 transition-all"
            title="Click to view security profile / switch user"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-xs">
                <Shield className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white truncate">
                    {user?.name || 'Authorized Operator'}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <p className="text-[10px] text-slate-400 truncate">
                  {user ? `${user.role.toUpperCase()} • ${user.badgeNumber || user.department}` : 'Session Not Authenticated'}
                </p>
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-400" /> Belagavi / GPS Online
              </span>
              <span className="font-mono text-blue-400">JWT ACTIVE</span>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
