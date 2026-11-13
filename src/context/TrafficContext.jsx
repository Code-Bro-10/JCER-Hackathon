import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { TrafficService } from '../services/api'
import { sounds } from '../services/soundEffects'
import { getSocket } from '../services/socketClient'

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

  // Global Route Search Parameters across Dashboard & Route Planner
  const [routeSearchParams, setRouteSearchParams] = useState({
    origin: 'Rani Chennamma Circle, Belagavi',
    destination: 'Jain College of Engineering (JCER), Belagavi',
    originCoord: [15.8596, 74.5098],
    destCoord: [15.8340, 74.5360],
    autoCalculate: false,
    autoAskAI: false,
  })

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

  // Real-time Multi-User Socket.IO Synchronization Bus
  useEffect(() => {
    const socket = getSocket()

    const onIncidentCreated = (newIncident) => {
      setIncidents((prev) => {
        if (prev.some((i) => i.id === newIncident.id)) return prev
        return [newIncident, ...prev]
      })
      addToast({
        type: 'warning',
        title: '📡 Simultaneous Network Broadcast',
        message: `New incident reported: ${newIncident.title} (${newIncident.id})`,
      })
    }

    const onIncidentUpdated = (updatedIncident) => {
      setIncidents((prev) =>
        prev.map((i) => (i.id === updatedIncident.id ? updatedIncident : i))
      )
      addToast({
        type: 'info',
        title: '📡 Remote Operator Update',
        message: `${updatedIncident.id} status changed to ${updatedIncident.status}`,
      })
    }

    const onIncidentDeleted = ({ id }) => {
      setIncidents((prev) => prev.filter((i) => i.id !== id))
    }

    const onGreenWaveActivated = (dispatch) => {
      setEmergencyDispatches((prev) => {
        if (prev.some((d) => d.id === dispatch.id)) return prev
        return [dispatch, ...prev]
      })
      sounds.playEmergencySiren()
      addToast({
        type: 'critical',
        title: '🚨 EMERGENCY GREEN WAVE SYNCHRONIZED',
        message: `Corridor preempted by dispatch commander for Unit: ${dispatch.unitCode}`,
      })
    }

    const onGreenWaveCancelled = ({ dispatchId }) => {
      setEmergencyDispatches((prev) => prev.filter((d) => d.id !== dispatchId))
    }

    const onSignalUpdated = (updatedNode) => {
      setIntersections((prev) =>
        prev.map((node) => (node.id === updatedNode.id ? updatedNode : node))
      )
    }

    const onCameraAlert = (alertData) => {
      addToast({
        type: 'critical',
        title: '📸 AI Computer Vision Detection',
        message: `${alertData.category || 'Road Obstruction'} detected at ${alertData.cameraName || 'CCTV Node'}`,
      })
    }

    socket.on('incident:created', onIncidentCreated)
    socket.on('incident:updated', onIncidentUpdated)
    socket.on('incident:deleted', onIncidentDeleted)
    socket.on('emergency:greenwave_activated', onGreenWaveActivated)
    socket.on('emergency:greenwave_cancelled', onGreenWaveCancelled)
    socket.on('signal:updated', onSignalUpdated)
    socket.on('camera:alert', onCameraAlert)

    return () => {
      socket.off('incident:created', onIncidentCreated)
      socket.off('incident:updated', onIncidentUpdated)
      socket.off('incident:deleted', onIncidentDeleted)
      socket.off('emergency:greenwave_activated', onGreenWaveActivated)
      socket.off('emergency:greenwave_cancelled', onGreenWaveCancelled)
      socket.off('signal:updated', onSignalUpdated)
      socket.off('camera:alert', onCameraAlert)
    }
  }, [addToast])

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
        routeSearchParams,
        setRouteSearchParams,
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

