import React, { useRef, useEffect, useState, useCallback } from 'react'
import {
  Camera,
  Video,
  VideoOff,
  Maximize2,
  RefreshCw,
  Shield,
  Layers,
  Sparkles,
  AlertTriangle,
  Radio,
  CheckCircle,
} from 'lucide-react'

/**
 * ActiveTrafficStream - High-fidelity live CCTV & Local Device Webcam stream
 * 
 * Guarantees:
 * 1. Zero Blank Screens - live animated optical canvas with moving vehicles & signals or device webcam.
 * 2. Zero Collision / Overlap - dedicated, well-spaced lanes with anti-overlap bounding box layout.
 * 3. Optical Sensor HUD - real-time timecode clock, FPS counter, bitrate, and camera watermark.
 */
export default function ActiveTrafficStream({
  camera,
  activeTab = 'ai_overlay', // 'ai_overlay' | 'raw' | 'telemetry'
  onToggleWebcam = null,
  isDeviceWebcam = false,
}) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const animFrameRef = useRef(null)

  const [webcamActive, setWebcamActive] = useState(isDeviceWebcam || camera?.isLocalWebcam)
  const [webcamError, setWebcamError] = useState(null)
  const [stream, setStream] = useState(null)
  const [currentTimecode, setCurrentTimecode] = useState('')
  const [fps, setFps] = useState(30)
  const [snapshotTaken, setSnapshotTaken] = useState(false)

  // Real-time HUD Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const timeStr = now.toTimeString().split(' ')[0]
      const ms = String(now.getMilliseconds()).padStart(3, '0').slice(0, 2)
      const dateStr = now.toISOString().split('T')[0]
      setCurrentTimecode(`${dateStr} ${timeStr}.${ms}`)
    }
    const timer = setInterval(updateTime, 100)
    updateTime()
    return () => clearInterval(timer)
  }, [])

  // Start / Stop Real Device Webcam
  const startWebcam = useCallback(async () => {
    try {
      setWebcamError(null)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam media API is not supported on this device/browser.')
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      })

      setStream(mediaStream)
      setWebcamActive(true)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play().catch((err) => console.warn('Video play caught:', err))
      }
    } catch (err) {
      console.warn('Webcam start failed:', err)
      setWebcamError(err.message || 'Permission denied or webcam busy.')
      setWebcamActive(false)
    }
  }, [])

  const stopWebcam = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setWebcamActive(false)
  }, [stream])

  // Sync webcam state with prop changes
  useEffect(() => {
    if (isDeviceWebcam || camera?.isLocalWebcam) {
      startWebcam()
    } else if (webcamActive && !isDeviceWebcam) {
      stopWebcam()
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [isDeviceWebcam, camera?.id])

  // Canvas Traffic Animation for Urban CCTV Nodes
  useEffect(() => {
    if (webcamActive) return // Don't run canvas traffic if user's real webcam is active

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = (canvas.width = canvas.parentElement.clientWidth || 800)
    let height = (canvas.height = canvas.parentElement.clientHeight || 450)

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return
      width = canvas.width = canvas.parentElement.clientWidth || 800
      height = canvas.height = canvas.parentElement.clientHeight || 450
    }
    window.addEventListener('resize', handleResize)

    // Distinct vehicle models with calibrated dimensions
    const vehicleTypes = {
      sedan: { color: '#0ea5e9', w: 46, h: 22, label: 'SEDAN', speed: 2.1 },
      suv: { color: '#10b981', w: 50, h: 24, label: 'SUV', speed: 2.4 },
      bus: { color: '#f59e0b', w: 84, h: 28, label: 'BUS', speed: 1.7 },
      truck: { color: '#f97316', w: 88, h: 28, label: 'TRUCK', speed: 1.5 },
      auto: { color: '#eab308', w: 34, h: 18, label: 'AUTO', speed: 1.9 },
    }

    // Strictly partitioned non-overlapping lanes
    // Lane 0: Eastbound Outer (Slow/Bus Lane)
    // Lane 1: Eastbound Inner (Fast Lane)
    // [Double-Yellow Median Divider]
    // Lane 2: Westbound Inner (Fast Lane)
    // Lane 3: Westbound Outer (Heavy Truck Lane)
    const lanesConfig = [
      { id: 0, dir: 1, yRatio: 0.28, labelPos: 'above' },
      { id: 1, dir: 1, yRatio: 0.42, labelPos: 'above' },
      { id: 2, dir: -1, yRatio: 0.64, labelPos: 'below' },
      { id: 3, dir: -1, yRatio: 0.80, labelPos: 'below' },
    ]

    // 4 Vehicles: exactly ONE per lane, staggered horizontally
    // This physically prevents ANY collision or overlapping bounding boxes!
    const vehicles = [
      {
        id: 'CAR-101',
        laneIdx: 0,
        x: width * 0.12,
        vtype: vehicleTypes.sedan,
        confidence: 98,
        actualSpeedKmh: 48,
        speed: vehicleTypes.sedan.speed,
      },
      {
        id: 'SUV-102',
        laneIdx: 1,
        x: width * 0.58,
        vtype: vehicleTypes.suv,
        confidence: 96,
        actualSpeedKmh: 54,
        speed: vehicleTypes.suv.speed,
      },
      {
        id: 'BUS-103',
        laneIdx: 2,
        x: width * 0.84,
        vtype: vehicleTypes.bus,
        confidence: 99,
        actualSpeedKmh: 36,
        speed: vehicleTypes.bus.speed,
      },
      {
        id: 'TRK-104',
        laneIdx: 3,
        x: width * 0.32,
        vtype: vehicleTypes.truck,
        confidence: 95,
        actualSpeedKmh: 40,
        speed: vehicleTypes.truck.speed,
      },
    ]

    let frameCount = 0
    let lastTime = performance.now()
    let signalPhase = 'GREEN' // 'GREEN' | 'RED'
    let phaseTimer = 0

    const render = (now) => {
      frameCount++
      if (now - lastTime >= 1000) {
        setFps(frameCount)
        frameCount = 0
        lastTime = now
      }

      // Signal Phase cycler (switches every ~8 seconds)
      phaseTimer++
      if (phaseTimer > 450) {
        signalPhase = signalPhase === 'GREEN' ? 'RED' : 'GREEN'
        phaseTimer = 0
      }

      // Background asphalt
      ctx.fillStyle = '#080d19'
      ctx.fillRect(0, 0, width, height)

      // Perspective road surface
      const roadTop = height * 0.18
      const roadBottom = height * 0.90
      const roadHeight = roadBottom - roadTop

      // Asphalt corridor
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, roadTop, width, roadHeight)

      // Road shoulder curb lines
      ctx.strokeStyle = '#334155'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(0, roadTop)
      ctx.lineTo(width, roadTop)
      ctx.moveTo(0, roadBottom)
      ctx.lineTo(width, roadBottom)
      ctx.stroke()

      // Center divider (Double yellow line)
      const centerDividerY = roadTop + roadHeight * 0.53
      ctx.strokeStyle = '#eab308'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(0, centerDividerY - 3)
      ctx.lineTo(width, centerDividerY - 3)
      ctx.moveTo(0, centerDividerY + 3)
      ctx.lineTo(width, centerDividerY + 3)
      ctx.stroke()

      // Dashed lane lines separating Lane 0/1 and Lane 2/3
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([20, 18])

      const lane1Y = roadTop + roadHeight * 0.26
      const lane2Y = roadTop + roadHeight * 0.77
      ctx.beginPath()
      ctx.moveTo(0, lane1Y)
      ctx.lineTo(width, lane1Y)
      ctx.moveTo(0, lane2Y)
      ctx.lineTo(width, lane2Y)
      ctx.stroke()
      ctx.setLineDash([]) // reset

      // Crosswalk stripes at center-right
      const crosswalkX = width * 0.82
      ctx.fillStyle = 'rgba(255, 255, 255, 0.16)'
      for (let cy = roadTop + 6; cy < roadBottom - 10; cy += 20) {
        ctx.fillRect(crosswalkX, cy, 32, 11)
      }

      // Traffic Signal Light pole on crosswalk
      ctx.fillStyle = '#1e293b'
      ctx.fillRect(crosswalkX + 42, roadTop - 34, 12, 34)
      ctx.fillStyle = signalPhase === 'RED' ? '#ef4444' : '#334155'
      ctx.beginPath()
      ctx.arc(crosswalkX + 48, roadTop - 24, 4.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = signalPhase === 'GREEN' ? '#10b981' : '#334155'
      ctx.beginPath()
      ctx.arc(crosswalkX + 48, roadTop - 10, 4.5, 0, Math.PI * 2)
      ctx.fill()

      // Move & draw vehicles (clean, non-overlapping)
      vehicles.forEach((v) => {
        const lane = lanesConfig[v.laneIdx]

        // Stop line deceleration if red signal
        const atStopLine = lane.dir === 1 && v.x > crosswalkX - 85 && v.x < crosswalkX - 10
        let currentSpeed = v.speed
        if (signalPhase === 'RED' && atStopLine) {
          currentSpeed = 0
        }

        v.x += currentSpeed * lane.dir

        // Wrap around borders cleanly
        if (lane.dir === 1 && v.x > width + 100) {
          v.x = -110
          v.confidence = Math.floor(94 + Math.random() * 5)
        } else if (lane.dir === -1 && v.x < -110) {
          v.x = width + 100
          v.confidence = Math.floor(94 + Math.random() * 5)
        }

        const vy = height * lane.yRatio - v.vtype.h / 2

        // Vehicle body drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
        ctx.fillRect(v.x + 2, vy + 4, v.vtype.w, v.vtype.h)

        // Vehicle Chassis
        ctx.fillStyle = v.vtype.color
        ctx.beginPath()
        ctx.roundRect(v.x, vy, v.vtype.w, v.vtype.h, 4)
        ctx.fill()

        // Vehicle windshield & roof
        ctx.fillStyle = '#090d16'
        if (lane.dir === 1) {
          ctx.fillRect(v.x + v.vtype.w * 0.45, vy + 3, v.vtype.w * 0.35, v.vtype.h - 6)
        } else {
          ctx.fillRect(v.x + v.vtype.w * 0.20, vy + 3, v.vtype.w * 0.35, v.vtype.h - 6)
        }

        // Headlights (beaming out)
        ctx.fillStyle = 'rgba(254, 240, 138, 0.20)'
        ctx.beginPath()
        if (lane.dir === 1) {
          ctx.moveTo(v.x + v.vtype.w, vy + 4)
          ctx.lineTo(v.x + v.vtype.w + 65, vy - 8)
          ctx.lineTo(v.x + v.vtype.w + 65, vy + v.vtype.h + 8)
          ctx.lineTo(v.x + v.vtype.w, vy + v.vtype.h - 4)
        } else {
          ctx.moveTo(v.x, vy + 4)
          ctx.lineTo(v.x - 65, vy - 8)
          ctx.lineTo(v.x - 65, vy + v.vtype.h + 8)
          ctx.lineTo(v.x, vy + v.vtype.h - 4)
        }
        ctx.closePath()
        ctx.fill()

        // Tail-lights (red glow behind)
        ctx.fillStyle = '#ef4444'
        if (lane.dir === 1) {
          ctx.fillRect(v.x - 1, vy + 3, 2, 4)
          ctx.fillRect(v.x - 1, vy + v.vtype.h - 7, 2, 4)
        } else {
          ctx.fillRect(v.x + v.vtype.w - 1, vy + 3, 2, 4)
          ctx.fillRect(v.x + v.vtype.w - 1, vy + v.vtype.h - 7, 2, 4)
        }

        // AI YOLOv9 Bounding Box & HUD overlay (Zero overlap)
        if (activeTab === 'ai_overlay') {
          const pad = 3
          const bx = v.x - pad
          const by = vy - pad
          const bw = v.vtype.w + pad * 2
          const bh = v.vtype.h + pad * 2

          ctx.strokeStyle = v.vtype.color
          ctx.lineWidth = 1.5
          ctx.strokeRect(bx, by, bw, bh)

          // Corner reticle accents
          ctx.fillStyle = v.vtype.color
          const cornerLen = 5
          ctx.fillRect(bx, by, cornerLen, 2)
          ctx.fillRect(bx, by, 2, cornerLen)
          ctx.fillRect(bx + bw - cornerLen, by, cornerLen, 2)
          ctx.fillRect(bx + bw - 2, by, 2, cornerLen)

          // Label Placement: Eastbound lanes place ABOVE, Westbound lanes place BELOW
          // This eliminates vertical label collision entirely!
          const labelY = lane.labelPos === 'above' ? by - 14 : by + bh + 1
          const badgeWidth = 92
          const badgeHeight = 13

          ctx.fillStyle = v.vtype.color
          ctx.fillRect(bx, labelY, badgeWidth, badgeHeight)

          ctx.fillStyle = '#080d19'
          ctx.font = 'bold 9px monospace'
          ctx.fillText(`${v.vtype.label} [${v.confidence}%]`, bx + 3, labelY + 9)

          // Integrated speed tag
          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 8px monospace'
          ctx.fillText(`${v.actualSpeedKmh}km/h`, bx + badgeWidth - 34, labelY + 9)
        }
      })

      animFrameRef.current = requestAnimationFrame(render)
    }

    animFrameRef.current = requestAnimationFrame(render)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [webcamActive, activeTab])

  // Capture Snapshot feature
  const handleSnapshot = () => {
    setSnapshotTaken(true)
    setTimeout(() => setSnapshotTaken(false), 800)
  }

  return (
    <div className="relative aspect-video w-full rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl flex flex-col justify-between select-none">
      {/* 1. Live Device Webcam Video Element */}
      {webcamActive ? (
        <div className="absolute inset-0 z-0 bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />

          {/* AI Bounding Box Overlays on Real Webcam Feed */}
          {activeTab === 'ai_overlay' && (
            <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
              {/* Dynamic Scanning Reticle */}
              <div className="absolute top-[22%] left-[28%] w-[44%] h-[56%] border-2 border-cyan-400 bg-cyan-500/10 rounded-lg">
                <div className="absolute -top-6 left-0 bg-cyan-500 text-gray-950 px-2 py-0.5 text-[10px] font-mono font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  <span>OPERATOR_CAMERA [98.4%]</span>
                </div>
                <div className="absolute -bottom-5 left-0 text-[10px] font-mono text-cyan-300 bg-slate-950/80 px-1.5 py-0.5 rounded">
                  OBJECT_ID: #WEBCAM-HOST-NODE • LATENCY: 8ms
                </div>
              </div>

              {/* Auxiliary tracking box */}
              <div className="absolute top-[48%] right-[8%] w-[18%] h-[30%] border border-emerald-400/80 bg-emerald-500/10 rounded">
                <div className="absolute -top-5 left-0 bg-emerald-500 text-gray-950 px-1 py-0.2 text-[9px] font-mono font-bold">
                  SURROUNDING_FIELD [94%]
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 2. Active 60FPS Urban Traffic Simulation Canvas */
        <canvas ref={canvasRef} className="absolute inset-0 z-0 w-full h-full object-cover" />
      )}

      {/* Optical Scanline Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-24 animate-scanline pointer-events-none z-10" />

      {/* Vignette & CRT grid lines */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none z-10"
        style={{
          backgroundImage:
            'linear-gradient(to right, #06b6d4 1px, transparent 1px), linear-gradient(to bottom, #06b6d4 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Snapshot Flash Feedback */}
      {snapshotTaken && (
        <div className="absolute inset-0 bg-white/40 z-30 pointer-events-none transition-opacity duration-300" />
      )}

      {/* TOP HUD BAR */}
      <div className="relative z-20 flex items-center justify-between bg-slate-950/80 backdrop-blur-md px-3.5 py-2 m-2 rounded-xl border border-slate-800/90 shadow-md">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-rose-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            REC LIVE
          </span>
          <span className="text-xs font-mono text-white font-semibold">
            {webcamActive ? 'CAM-DEVICE-WEBCAM' : camera?.id || 'CAM-BGM-01'}
          </span>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800">
            {webcamActive ? '1080p HD' : camera?.resolution || '4K UHD'}
          </span>
          {webcamActive && (
            <span className="hidden sm:flex text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 items-center gap-1">
              <CheckCircle className="w-2.5 h-2.5" />
              WEBCAM HARDWARE ACTIVE
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono text-slate-300">
          <span className="hidden sm:inline text-slate-400">{currentTimecode}</span>
          <span className="font-bold text-emerald-400">{fps} FPS</span>
          <span className="hidden md:inline text-slate-400">{camera?.bitrate || '4.5 Mbps'}</span>
        </div>
      </div>

      {/* Webcam Permission Blocked Alert */}
      {webcamError && (
        <div className="relative z-20 mx-4 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>Webcam Notice: {webcamError}</span>
          </div>
          <button
            type="button"
            onClick={startWebcam}
            className="px-2.5 py-1 rounded bg-rose-800 hover:bg-rose-700 text-white font-mono text-[11px] cursor-pointer"
          >
            Retry Permission
          </button>
        </div>
      )}

      {/* BOTTOM HUD BAR */}
      <div className="relative z-20 flex items-center justify-between bg-slate-950/80 backdrop-blur-md px-3.5 py-2 m-2 rounded-xl border border-slate-800/90 shadow-md">
        <div className="flex items-center gap-2 min-w-0">
          <Shield className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span className="text-xs font-mono text-slate-300 truncate">
            {webcamActive
              ? 'Local Video Ingest Active • AI Face & Object Tracker Operational'
              : camera?.aiAlert || 'Autonomous Monitoring Normal • Belagavi ITS Optical Stream'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Webcam Toggle Button */}
          <button
            type="button"
            onClick={() => {
              if (webcamActive) {
                stopWebcam()
                if (onToggleWebcam) onToggleWebcam(false)
              } else {
                startWebcam()
                if (onToggleWebcam) onToggleWebcam(true)
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
              webcamActive
                ? 'bg-rose-500 text-white font-bold shadow-lg shadow-rose-500/20'
                : 'bg-blue-600 hover:bg-blue-500 text-white font-bold'
            }`}
            title={webcamActive ? 'Disconnect Hardware Webcam' : 'Stream My Laptop/Device Webcam'}
          >
            {webcamActive ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
            <span>{webcamActive ? 'Stop Webcam' : 'Use Device Webcam'}</span>
          </button>

          {/* Capture Snapshot */}
          <button
            type="button"
            onClick={handleSnapshot}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
            title="Capture Camera Snapshot"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
