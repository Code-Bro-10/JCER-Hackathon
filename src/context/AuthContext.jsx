import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { TrafficService } from '../services/api'
import { updateSocketAuth, getSocket } from '../services/socketClient'

const AuthContext = createContext(null)

const STORAGE_TOKEN_KEY = 'trafficai_jwt_token'
const STORAGE_USER_KEY = 'trafficai_user_profile'
const BROADCAST_CHANNEL_NAME = 'trafficai_multiuser_mesh'

// Preset demo personas
export const DEMO_PERSONAS = {
  admin: {
    key: 'admin',
    name: 'Chief Traffic Commander',
    email: 'admin@trafficai.gov',
    password: 'AdminPassword123!',
    role: 'admin',
    department: 'Smart Mobility Command Center',
    badgeNumber: 'CMD-001',
    roleLabel: 'System Administrator',
    badgeColor: 'rose',
    description: 'Full infrastructure control, emergency override, signal timing calibration & audit logs.',
  },
  operator: {
    key: 'operator',
    name: 'Sector Dispatch Operator',
    email: 'operator@trafficai.gov',
    password: 'OperatorPassword123!',
    role: 'operator',
    department: 'Urban Grid Operations',
    badgeNumber: 'OP-404',
    roleLabel: 'Traffic Operations Officer',
    badgeColor: 'amber',
    description: 'Real-time incident response, patrol unit dispatch, roadblock verification & camera monitoring.',
  },
  user: {
    key: 'user',
    name: 'Civilian Transit User',
    email: 'user@trafficai.gov',
    password: 'UserPassword123!',
    role: 'user',
    department: 'Public Mobility Commuter',
    badgeNumber: 'PUB-101',
    roleLabel: 'Civilian Commuter',
    badgeColor: 'cyan',
    description: 'Real-time congestion map, multi-modal routing, citizen hazard reporting & community verification.',
  },
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_USER_KEY)
      if (stored) return JSON.parse(stored)
    } catch {}
    // Default to admin for immediate evaluation ready state
    return DEMO_PERSONAS.admin
  })

  const [token, setToken] = useState(() => {
    return localStorage.getItem(STORAGE_TOKEN_KEY) || 'trafficai_dev_seed_token_2026'
  })

  const [activeSessionId] = useState(() => {
    return 'sess_' + Math.random().toString(36).substring(2, 9)
  })

  const [activePeers, setActivePeers] = useState([])
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState(null)

  // Multi-user tab / session peer mesh discovery
  useEffect(() => {
    if (typeof window === 'undefined' || !window.BroadcastChannel) return

    const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME)

    // Announce self presence
    const announcePresence = () => {
      if (user) {
        channel.postMessage({
          type: 'PEER_ANNOUNCE',
          sessionId: activeSessionId,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            badgeNumber: user.badgeNumber,
          },
          timestamp: Date.now(),
        })
      }
    }

    channel.onmessage = (event) => {
      const data = event.data
      if (!data) return

      if (data.type === 'PEER_ANNOUNCE' && data.sessionId !== activeSessionId) {
        setActivePeers((prev) => {
          const filtered = prev.filter((p) => p.sessionId !== data.sessionId)
          return [...filtered, { sessionId: data.sessionId, user: data.user, lastSeen: data.timestamp }]
        })
        // Reply with our own announcement so the newcomer knows about us
        announcePresence()
      } else if (data.type === 'PEER_BYE') {
        setActivePeers((prev) => prev.filter((p) => p.sessionId !== data.sessionId))
      }
    }

    announcePresence()
    const interval = setInterval(announcePresence, 6000)

    const handleBeforeUnload = () => {
      channel.postMessage({ type: 'PEER_BYE', sessionId: activeSessionId })
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      clearInterval(interval)
      channel.postMessage({ type: 'PEER_BYE', sessionId: activeSessionId })
      channel.close()
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [user, activeSessionId])

  // Login handler
  const login = useCallback(async (email, password) => {
    setLoading(true)
    setAuthError(null)
    try {
      const res = await TrafficService.login(email, password)
      if (res.success && res.user) {
        setUser(res.user)
        setToken(res.token)
        updateSocketAuth(res.token)
        setLoading(false)
        return { success: true, user: res.user }
      } else {
        setAuthError(res.error || 'Invalid credentials')
        setLoading(false)
        return { success: false, error: res.error }
      }
    } catch (err) {
      setAuthError(err.message || 'Login failed')
      setLoading(false)
      return { success: false, error: err.message }
    }
  }, [])

  // Register handler
  const register = useCallback(async (userData) => {
    setLoading(true)
    setAuthError(null)
    try {
      const res = await TrafficService.register(userData)
      if (res.success && res.user) {
        setUser(res.user)
        setToken(res.token)
        updateSocketAuth(res.token)
        setLoading(false)
        return { success: true, user: res.user }
      } else {
        setAuthError(res.error || 'Registration failed')
        setLoading(false)
        return { success: false, error: res.error }
      }
    } catch (err) {
      setAuthError(err.message || 'Registration failed')
      setLoading(false)
      return { success: false, error: err.message }
    }
  }, [])

  // Quick switch demo persona (admin, operator, user)
  const quickLogin = useCallback(
    async (roleKey) => {
      const persona = DEMO_PERSONAS[roleKey]
      if (!persona) return
      return await login(persona.email, persona.password)
    },
    [login]
  )

  // Logout handler
  const logout = useCallback(async () => {
    setLoading(true)
    await TrafficService.logout()
    setUser(null)
    setToken(null)
    updateSocketAuth(null)
    setLoading(false)
  }, [])

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    isOperator: user?.role === 'operator' || user?.role === 'admin',
    isCivilian: user?.role === 'user',
    loading,
    authError,
    activeSessionId,
    activePeers,
    login,
    register,
    quickLogin,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

