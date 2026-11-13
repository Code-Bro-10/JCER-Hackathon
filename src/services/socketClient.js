import { io } from 'socket.io-client'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

let socket = null

/**
 * Get or create the active Socket.IO connection
 * Each browser tab/window gets a unique socket connection ID for simultaneous multi-user usage.
 */
export function getSocket(token = null) {
  if (!socket) {
    const storedToken = token || localStorage.getItem('trafficai_jwt_token')
    
    socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      auth: storedToken ? { token: storedToken } : undefined,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    })

    socket.on('connect', () => {
      console.log(`[Socket.IO] Connected to smart city bus: ${socket.id}`)
      // Join standard traffic channels
      socket.emit('join:room', 'incidents')
      socket.emit('join:room', 'signals')
      socket.emit('join:room', 'emergency')
      socket.emit('join:room', 'cameras')
    })

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Disconnected: ${reason}`)
    })

    socket.on('connect_error', (err) => {
      // Soft fail in mock/development mode
      console.warn(`[Socket.IO] Connection warning (running fallback telemetry):`, err.message)
    })
  }

  return socket
}

export function updateSocketAuth(token) {
  if (socket) {
    socket.auth = token ? { token } : undefined
    if (socket.connected) {
      socket.disconnect().connect()
    }
  }
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

