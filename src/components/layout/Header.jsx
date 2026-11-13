import React, { useState, useEffect } from 'react'
import {
  Bell,
  Search,
  Volume2,
  VolumeX,
  Menu,
  ChevronDown,
  Activity,
  Radio,
  CheckCircle,
  X,
  Sparkles,
  ShieldAlert,
  Users,
  Shield,
  User,
  LogOut,
  KeyRound,
  Route,
} from 'lucide-react'
import { useTraffic } from '../../context/TrafficContext'
import { useAuth, DEMO_PERSONAS } from '../../context/AuthContext'
import { SECTORS } from '../../utils/constants'
import Badge from '../common/Badge'

export default function Header({ onMobileMenuToggle }) {
  const {
    activeSector,
    setActiveSector,
    isAudioMuted,
    toggleMute,
    notifications,
    setNotifications,
    incidents,
    setCurrentPage,
    setRouteSearchParams,
  } = useTraffic()

  const { user, isAuthenticated, logout, quickLogin, activePeers } = useAuth()

  const [timeString, setTimeString] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSectorDropdown, setShowSectorDropdown] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Unread notifications
  const unreadCount = notifications.filter((n) => !n.read).length
  const criticalCount = incidents.filter((i) => i.severity === 'CRITICAL' && i.status !== 'Resolved').length

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTimeString(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      )
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    // Route search or incident search
    setRouteSearchParams((prev) => ({
      ...prev,
      destination: searchQuery.trim(),
      destCoord: null, // trigger fresh geocode
      autoCalculate: true,
    }))
    setCurrentPage('route')
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 backdrop-blur-xl sm:px-6">
      {/* Left section: Mobile menu toggle + System status */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden cursor-pointer"
          aria-label="Toggle mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* System Pulse badge */}
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-mono">AI ENGINE ACTIVE</span>
          <span className="text-emerald-500/40">|</span>
          <span className="text-slate-400">428 Cameras Live</span>
        </div>

        {/* Critical alert flag if any */}
        {criticalCount > 0 && (
          <button
            type="button"
            onClick={() => setCurrentPage('incidents')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-rose-500/40 bg-rose-500/20 text-rose-300 text-xs font-bold animate-pulse cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>{criticalCount} Critical</span>
          </button>
        )}
      </div>

      {/* Center section: Search bar & Quick Route Planner Button */}
      <div className="hidden md:flex flex-1 max-w-lg mx-4 items-center gap-2">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search destination, college, or area (e.g. JCER College)..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-10 pr-4 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all font-sans"
          />
        </form>

        <button
          type="button"
          onClick={() => setCurrentPage('route')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-bold transition-all cursor-pointer shadow-sm flex-shrink-0"
          title="Open Route Planner with Source & Destination"
        >
          <Route className="w-3.5 h-3.5 text-cyan-400" />
          <span>Plan Route</span>
        </button>
      </div>

      {/* Right section: Sector Picker, Live Clock, Mute, Notifications */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Sector Picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSectorDropdown(!showSectorDropdown)}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-700 hover:text-white cursor-pointer transition-all"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span className="max-w-[110px] sm:max-w-none truncate">{activeSector}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showSectorDropdown && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Filter By City Sector
              </div>
              {SECTORS.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => {
                    setActiveSector(sec)
                    setShowSectorDropdown(false)
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left cursor-pointer transition-colors ${
                    activeSector === sec
                      ? 'bg-cyan-500/20 text-cyan-300 font-medium'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span>{sec}</span>
                  {activeSector === sec && <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Live Multi-User Concurrency Badge */}
        <div
          onClick={() => setCurrentPage('login')}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-300 hover:border-slate-700 cursor-pointer transition-all"
          title="Simultaneous Multi-User Mesh (Click to view session auth)"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Users className="w-3.5 h-3.5 text-emerald-400" />
          <span>{activePeers.length + 1} User{activePeers.length + 1 > 1 ? 's' : ''} Online</span>
        </div>

        {/* Live Clock */}
        <div className="hidden xl:flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-mono text-cyan-400">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>{timeString} UTC</span>
        </div>

        {/* Audio Mute Button */}
        <button
          type="button"
          onClick={toggleMute}
          className="p-2 rounded-xl border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
          title={isAudioMuted ? 'Unmute Audio Alerts' : 'Mute Audio Alerts'}
        >
          {isAudioMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
        </button>

        {/* Notification Bell with Badge & Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-md shadow-rose-500/50">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-800 bg-slate-900/95 backdrop-blur-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-white">Live System Feeds</span>
                  <Badge variant="cyan" size="sm">{notifications.length}</Badge>
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="mt-2 space-y-2 max-h-72 overflow-y-auto">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-xl border transition-all ${
                      item.read
                        ? 'border-slate-800/60 bg-slate-950/40 opacity-75'
                        : 'border-slate-700 bg-slate-800/50 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            item.type === 'critical'
                              ? 'bg-rose-500'
                              : item.type === 'warning'
                              ? 'bg-amber-500'
                              : 'bg-cyan-500'
                          }`}
                        />
                        <span className="text-xs font-semibold text-slate-100">{item.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{item.time}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 pl-4">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Account / Admin Login Status Dropdown */}
        <div className="relative">
          {user ? (
            <div>
              <button
                type="button"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800/90 text-left transition-all cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-xs flex-shrink-0">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:block leading-tight">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="truncate max-w-[110px]">{user.name.split(' ')[0]}</span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                        user.role === 'admin'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : user.role === 'operator'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                    {user.badgeNumber || user.department || 'Active'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* User Account Dropdown Menu */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-800 bg-slate-900/95 backdrop-blur-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
                  <div className="pb-2.5 border-b border-slate-800">
                    <div className="text-xs font-bold text-white">{user.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold uppercase">
                        {user.role.toUpperCase()}
                      </span>
                      <span className="text-slate-400">{user.department}</span>
                    </div>
                  </div>

                  {/* Switch Persona Options for Quick Testing */}
                  <div className="py-2.5 border-b border-slate-800 space-y-1">
                    <div className="text-[10px] uppercase font-mono font-bold text-slate-400 px-1 pb-1">
                      Quick Role Switch (Multi-User)
                    </div>
                    {Object.values(DEMO_PERSONAS).map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => {
                          quickLogin(p.key)
                          setShowUserDropdown(false)
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          user.email === p.email
                            ? 'bg-blue-600/20 text-blue-300 font-bold'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <span>{p.name.split(' ')[0]} ({p.role.toUpperCase()})</span>
                        {user.email === p.email && <CheckCircle className="w-3.5 h-3.5 text-blue-400" />}
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 flex flex-col gap-1 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserDropdown(false)
                        setCurrentPage('login')
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 flex items-center gap-2 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Switch / Register New Account</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowUserDropdown(false)
                        logout()
                        setCurrentPage('login')
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-400" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentPage('login')}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

