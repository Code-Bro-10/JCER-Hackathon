import React, { useState } from 'react'
import {
  Shield,
  Lock,
  Mail,
  User,
  Key,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Users,
  Radio,
  Sparkles,
  AlertCircle,
  Building,
  BadgeAlert,
  Zap,
  Globe,
} from 'lucide-react'
import { useAuth, DEMO_PERSONAS } from '../context/AuthContext'
import { useTraffic } from '../context/TrafficContext'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'

export default function LoginPage() {
  const { user, isAuthenticated, login, register, quickLogin, logout, loading, authError, activePeers, activeSessionId } = useAuth()
  const { setCurrentPage, addToast } = useTraffic()

  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false)

  // Login form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Register form state
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regRole, setRegRole] = useState('user')
  const [regDept, setRegDept] = useState('Civilian Commuter')
  const [regBadge, setRegBadge] = useState('')

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      addToast({ type: 'warning', title: 'Input Required', message: 'Please provide both email and password.' })
      return
    }

    const res = await login(email, password)
    if (res.success) {
      addToast({
        type: 'success',
        title: 'Authentication Successful',
        message: `Welcome back, ${res.user.name} (${res.user.role.toUpperCase()})`,
      })
      setCurrentPage('overview')
    } else {
      addToast({ type: 'danger', title: 'Authentication Failed', message: res.error || 'Invalid credentials' })
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    if (!regName || !regEmail || !regPassword) {
      addToast({ type: 'warning', title: 'Input Required', message: 'Name, email, and password are required.' })
      return
    }

    const res = await register({
      name: regName,
      email: regEmail,
      password: regPassword,
      role: regRole,
      department: regDept,
      badgeNumber: regBadge || undefined,
    })

    if (res.success) {
      addToast({
        type: 'success',
        title: 'Account Created',
        message: `Registered as ${res.user.name} with ${res.user.role.toUpperCase()} permissions!`,
      })
      setCurrentPage('overview')
    } else {
      addToast({ type: 'danger', title: 'Registration Failed', message: res.error || 'Failed to register' })
    }
  }

  const handleQuickPersona = async (personaKey) => {
    const res = await quickLogin(personaKey)
    if (res?.success) {
      addToast({
        type: 'success',
        title: 'Persona Activated',
        message: `Logged in as ${DEMO_PERSONAS[personaKey].name} (${DEMO_PERSONAS[personaKey].roleLabel})`,
      })
      setCurrentPage('overview')
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2 animate-in fade-in duration-200">
      {/* Top Banner: Multi-User Concurrency & Real-Time Sync Indicator */}
      <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-slate-900/90 to-cyan-950/30 p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 flex-shrink-0">
            <Radio className="w-5 h-5 animate-pulse text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Simultaneous Multi-Tenancy & Live Collaboration Engine
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Multiple users (Admins, Operators, and Civilians) can access and interact with this webservice concurrently from different tabs or devices with instant Socket.IO state synchronization.
            </p>
          </div>
        </div>

        {/* Live Active Peers Counter */}
        <div className="flex items-center gap-2 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 font-mono text-xs text-slate-300">
          <Users className="w-4 h-4 text-emerald-400" />
          <span>Active Mesh Nodes:</span>
          <span className="font-bold text-emerald-400">{activePeers.length + 1} Connected</span>
        </div>
      </div>

      {/* Main Grid: Form (Left) & One-Click Persona Switcher (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Login / Register Form (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Active User Quick Status if already logged in */}
          {isAuthenticated && (
            <div className="mb-6 p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <div className="text-xs">
                  <span className="text-slate-400">Currently Authenticated: </span>
                  <span className="text-white font-bold">{user.name}</span>
                  <span className="text-blue-400 font-mono ml-1.5 uppercase font-semibold">[{user.role}]</span>
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="text-xs font-mono text-rose-400 hover:text-rose-300 underline cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          )}

          {/* Form Header Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                {mode === 'login' ? 'TrafficAI Security Gate' : 'New Operational Account'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {mode === 'login'
                  ? 'Sign in to access real-time dispatch, routing, and city ITS controls.'
                  : 'Register a new administrator, field operator, or civilian commuter profile.'}
              </p>
            </div>

            {/* Mode Toggle Pills */}
            <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  mode === 'login' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  mode === 'register' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Register
              </button>
            </div>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Mode 1: Sign In Form */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Official Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. admin@trafficai.gov or user@trafficai.gov"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Secure Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
                  />
                  <span>Persist session token on this terminal</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleQuickPersona('admin')}
                  className="text-blue-400 hover:underline"
                >
                  Need credentials? Click Quick Persona
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full justify-center mt-2"
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Sign In to Operations Console'}
              </Button>
            </form>
          ) : (
            /* Mode 2: Register New Account Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. John Doe"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. j.doe@trafficai.gov"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      minLength={6}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Account Role
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => {
                      setRegRole(e.target.value)
                      if (e.target.value === 'admin') setRegDept('Command & Control')
                      else if (e.target.value === 'operator') setRegDept('Grid Field Dispatch')
                      else setRegDept('Civilian Transit User')
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="user">Civilian Transit User (Public Commuter)</option>
                    <option value="operator">Traffic Operator (Field Dispatch)</option>
                    <option value="admin">Chief Administrator (Full Authority)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Department / Agency
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={regDept}
                      onChange={(e) => setRegDept(e.target.value)}
                      placeholder="e.g. Belagavi Municipal Transit"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Badge / Officer ID
                  </label>
                  <div className="relative">
                    <BadgeAlert className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={regBadge}
                      onChange={(e) => setRegBadge(e.target.value)}
                      placeholder="e.g. BGM-882"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full justify-center mt-2"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Register & Log In'}
              </Button>
            </form>
          )}

          {/* Security & Stateless Compliance Note */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Stateless JWT HS256 Token Auth
            </span>
            <span>Session ID: {activeSessionId}</span>
          </div>
        </div>

        {/* Right Column: Pre-Configured Demo Personas (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                Quick-Access Evaluator Personas
              </h4>
              <Badge variant="amber" size="sm">1-Click Launch</Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Select any persona below to instantaneously test different roles, permissions, and simultaneous cross-client synchronization:
            </p>

            <div className="space-y-3 mt-3">
              {Object.values(DEMO_PERSONAS).map((p) => {
                const isActive = user?.email === p.email

                return (
                  <div
                    key={p.key}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-blue-600/15 border-blue-500/50 ring-1 ring-blue-500/50'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{p.name}</span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                              p.role === 'admin'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : p.role === 'operator'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            }`}
                          >
                            {p.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{p.email}</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleQuickPersona(p.key)}
                        disabled={loading}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          isActive
                            ? 'bg-emerald-500 text-black'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                        }`}
                      >
                        {isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <span>Login</span>
                            <ArrowRight className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                      {p.description}
                    </p>

                    <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>Badge: {p.badgeNumber}</span>
                      <span>Pass: {p.password}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Real-time Multi-User Demonstration Guide */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs space-y-2">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-cyan-400" />
              How to Test Simultaneous Multi-User Sessions
            </div>
            <ol className="list-decimal pl-4 space-y-1 text-slate-400 text-[11px] leading-relaxed">
              <li>
                Open this application in <strong className="text-white">Tab 1</strong> (or Google Chrome) and log in as <span className="text-rose-400 font-semibold">Chief Administrator</span>.
              </li>
              <li>
                Open an <strong className="text-white">Incognito window or Tab 2</strong> (e.g. Edge or Firefox) and log in as <span className="text-cyan-400 font-semibold">Civilian Commuter</span>.
              </li>
              <li>
                In Tab 2, submit a new accident report on the map.
              </li>
              <li>
                Instantly watch Tab 1 receive the real-time Socket.IO incident alert without refreshing!
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

