import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { TrafficService } from '../services/api'
import { sounds } from '../services/soundEffects'

const TrafficContext = createContext(null)

export function TrafficProvider({ children }) {
  const [currentPage, setCurrentPage] = useState('overview') // 'overview' | 'prediction' | 'incidents' | 'route' | 'emergency' | 'analytics' | 'settings'
  const [activeSector, setActiveSector] = useState('All Sectors')
  const [kpis, setKpis] = useState(null)
  const [sectors, setSectors] = useState([])
  const [intersections, setIntersections] = useState([])
  const [incidents, setIncidents] = useState([])
  const [emergencyDispatches, setEmergencyDispatches] = useState([])
  const [activeCameraModal, setActiveCameraModal] = useState(null)
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [toasts, setToasts] = useState([])
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Collision on 7th Ave', desc: 'ALS unit MED-12 dispatched', time: '5m ago', read: false, type: 'critical' },
    { id: 2, title: 'Adaptive Phase Extended', desc: 'Grand Central Ave cycle +8s', time: '12m ago', read: false, type: 'info' },
    { id: 3, title: 'Stalled Freight Truck', desc: 'Heavy tow recovery in progress', time: '28m ago', read: true, type: 'warning' },
  ])
  const [isLoading, setIsLoading] = useState(true)
  const [liveSimulationTick, setLiveSimulationTick] = useState(0)

  // Toast notification manager
  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { ...toast, id }])
    if (toast.type === 'critical' || toast.type === 'danger') {
      sounds.playEmergencySiren()
    } else {
      sounds.playSuccess()
    }
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4500)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Initial load
  const loadGlobalData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [kpiRes, secRes, intRes, incRes, emergRes] = await Promise.all([
        TrafficService.getKPIs(),
        TrafficService.getSectors(),
        TrafficService.getIntersections(),
        TrafficService.getIncidents(),
        TrafficService.getEmergencyData(),
      ])

      if (kpiRes.success) setKpis(kpiRes.data)
      if (secRes.success) setSectors(secRes.data)
      if (intRes.success) setIntersections(intRes.data)
      if (incRes.success) setIncidents(incRes.data)
      if (emergRes.success) setEmergencyDispatches(emergRes.dispatches)
    } catch (err) {
      console.error('Failed to load traffic telemetry:', err)
      addToast({
        type: 'danger',
        title: 'Telemetry Warning',
        message: 'Could not connect to live sensors. Operating on autonomous cache.',
      })
    } finally {
      setIsLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    loadGlobalData()
  }, [loadGlobalData])

  // Live timer for intersection phase countdowns & vehicle movements
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveSimulationTick((tick) => tick + 1)
      setIntersections((prevList) =>
        prevList.map((item) => {
          let secs = item.secondsRemaining - 1
          if (secs <= 0) {
            // Cycle phase
            const nextPhase = item.currentPhase.includes('Green') ? 'Amber Clearance' : 'North-South Green'
            const nextColor = nextPhase.includes('Green') ? 'green' : 'amber'
            return {
              ...item,
              secondsRemaining: nextPhase.includes('Amber') ? 6 : 45,
              currentPhase: nextPhase,
              phaseColor: nextColor,
            }
          }
          return {
            ...item,
            secondsRemaining: secs,
          }
        })
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Emergency Green Wave trigger helper
  const triggerGreenWave = async (data) => {
    try {
      sounds.playEmergencySiren()
      const res = await TrafficService.triggerGreenWave(data)
      if (res.success) {
        setEmergencyDispatches((prev) => [res.data, ...prev])
        // refresh intersections
        const intRes = await TrafficService.getIntersections()
        if (intRes.success) setIntersections(intRes.data)
        addToast({
          type: 'danger',
          title: '🚨 EMERGENCY GREEN WAVE ACTIVATED',
          message: `Corridor cleared for ${res.data.unitCode}. Signals locked to GREEN.`,
        })
        return res.data
      }
    } catch (err) {
      addToast({ type: 'danger', title: 'Preemption Failed', message: err.message })
    }
  }

  const cancelGreenWave = async (dispatchId) => {
    try {
      sounds.playSuccess()
      await TrafficService.cancelGreenWave(dispatchId)
      setEmergencyDispatches((prev) => prev.filter((d) => d.id !== dispatchId))
      const intRes = await TrafficService.getIntersections()
      if (intRes.success) setIntersections(intRes.data)
      addToast({
        type: 'info',
        title: 'Corridor Stand-Down',
        message: 'Emergency priority released. Returning to AI adaptive signal cycling.',
      })
    } catch (err) {
      console.error(err)
    }
  }

  // Toggle audio
  const toggleMute = () => {
    const newState = sounds.toggleMute()
    setIsAudioMuted(newState)
  }

  return (
    <TrafficContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        activeSector,
        setActiveSector,
        kpis,
        sectors,
        intersections,
        setIntersections,
        incidents,
        setIncidents,
        emergencyDispatches,
        setEmergencyDispatches,
        triggerGreenWave,
        cancelGreenWave,
        activeCameraModal,
        setActiveCameraModal,
        isAudioMuted,
        toggleMute,
        toasts,
        addToast,
        removeToast,
        notifications,
        setNotifications,
        isLoading,
        refreshData: loadGlobalData,
        liveSimulationTick,
      }}
    >
      {children}
    </TrafficContext.Provider>
  )
}

export function useTraffic() {
  const ctx = useContext(TrafficContext)
  if (!ctx) {
    throw new Error('useTraffic must be used within a TrafficProvider')
  }
  return ctx
}

