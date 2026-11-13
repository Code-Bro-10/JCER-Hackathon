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
} from 'lucide-react'
import { useTraffic } from '../../context/TrafficContext'
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
  } = useTraffic()

  const [timeString, setTimeString] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSectorDropdown, setShowSectorDropdown] = useState(false)
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
    // navigate to incident or route depending on query
    setCurrentPage('incidents')
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

      {/* Center section: Search bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search intersections, incidents, corridors..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-10 pr-4 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all font-sans"
          />
        </form>
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
      </div>
    </header>
  )
}

