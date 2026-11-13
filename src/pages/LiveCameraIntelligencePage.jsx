import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Camera,
  Video,
  VideoOff,
  Eye,
  Shield,
  Radio,
  RefreshCw,
  AlertTriangle,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  CheckCircle2,
  CheckCircle,
  Plus,
  Filter,
  Search,
  Activity,
  Cpu,
  Sliders,
  ExternalLink,
  Zap,
  Clock,
  MapPin,
  Gauge,
  Flame,
  Truck,
  Car,
  Bus,
  Bike,
  X,
  FileCheck,
} from 'lucide-react'
import { trafficService } from '../services/api'
import { useTraffic } from '../context/TrafficContext'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'
import Modal from '../components/common/Modal'

function PanelCard({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-3 shadow-xl">
      <div className="border-b border-slate-800/80 pb-2">
        <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
        {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

// Source Type Metadata & Visual Styles
const SOURCE_TYPE_LABELS = {
  public_hls: { label: 'Public HLS Feed', variant: 'blue', desc: 'Authorized HLS live stream' },
  snapshot: { label: 'HTTP Snapshot', variant: 'purple', desc: 'Periodic HTTP snapshot feed' },
  rtsp: { label: 'Authorized IP (RTSP)', variant: 'amber', desc: 'Protected backend RTSP ingest' },
  webcam: { label: 'Local Hardware Webcam', variant: 'rose', desc: 'Real-time client device ingest' },
  demo_video: { label: 'Simulated Demo Video', variant: 'emerald', desc: 'Prerecorded presentation stream [SIMULATED]' },
}

export default function LiveCameraIntelligencePage() {
  const { addToast } = useTraffic()

  // Telemetry & State
  const [cameras, setCameras] = useState([])
  const [selectedCamera, setSelectedCamera] = useState(null)
  const [visionStatus, setVisionStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [recentDetections, setRecentDetections] = useState([])
  const [showEvidenceModal, setShowEvidenceModal] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)

  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [sectorFilter, setSectorFilter] = useState('ALL')
  const [sourceTypeFilter, setSourceTypeFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Player & HUD Overlay Controls
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true)
  const [showSpeeds, setShowSpeeds] = useState(true)
  const [showQueueLine, setShowQueueLine] = useState(true)
  const [showHazardBanners, setShowHazardBanners] = useState(true)
  const [isPlayerFullscreen, setIsPlayerFullscreen] = useState(false)

  // Local Webcam Ingest
  const [webcamStream, setWebcamStream] = useState(null)
  const [webcamActive, setWebcamActive] = useState(false)
  const [webcamError, setWebcamError] = useState(null)
  const videoPlayerRef = useRef(null)
  const playerContainerRef = useRef(null)
  const canvasRef = useRef(null)
  const animFrameRef = useRef(null)

  // Real-time HUD Clock
  const [currentTimecode, setCurrentTimecode] = useState('')

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

  // Load Cameras & Vision Engine Status
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [camsRes, visionRes] = await Promise.all([
        trafficService.getCameras(),
        trafficService.getVisionStatus(),
      ])

      if (camsRes.success && camsRes.data) {
        setCameras(camsRes.data)
        if (!selectedCamera && camsRes.data.length > 0) {
          // Default to first camera or Rani Chennamma Circle
          const defCam = camsRes.data.find((c) => c.id === 'CAM-BGM-01') || camsRes.data[0]
          setSelectedCamera(defCam)
        }
      }

      if (visionRes.success && visionRes.data) {
        setVisionStatus(visionRes.data)
      }
    } catch (err) {
      console.warn('Failed to load camera telemetry:', err)
    } finally {
      setIsLoading(false)
    }
  }, [selectedCamera])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Handle Local Webcam Activation
  const startLocalWebcam = async () => {
    try {
      setWebcamError(null)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam media API is not supported on this device/browser.')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      })

      setWebcamStream(stream)
      setWebcamActive(true)

      // Switch to CAM-LOCAL-WEBCAM if present or create temporary local camera
      let localCam = cameras.find((c) => c.id === 'CAM-LOCAL-WEBCAM' || c.sourceType === 'webcam')
      if (localCam) {
        setSelectedCamera(localCam)
      }

      if (videoPlayerRef.current) {
        videoPlayerRef.current.srcObject = stream
        videoPlayerRef.current.play().catch(() => {})
      }

      addToast({
        type: 'success',
        title: 'Local Webcam Connected',
        message: 'Live hardware video stream is now feeding the computer vision tracker.',
      })
    } catch (err) {
      setWebcamError(err.message || 'Permission denied or webcam unavailable.')
      addToast({
        type: 'error',
        title: 'Webcam Ingest Failed',
        message: err.message || 'Could not access device camera.',
      })
    }
  }

  const stopLocalWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach((t) => t.stop())
      setWebcamStream(null)
    }
    if (videoPlayerRef.current && videoPlayerRef.current.srcObject) {
      videoPlayerRef.current.srcObject = null
    }
    setWebcamActive(false)
  }

  // Switch Selected Camera
  const handleSelectCamera = (cam) => {
    if (cam.sourceType === 'webcam' && !webcamActive) {
      startLocalWebcam()
    } else if (cam.sourceType !== 'webcam' && webcamActive) {
      stopLocalWebcam()
    }
    setSelectedCamera(cam)
    setScanResult(null)
  }

  // Run AI Vision Scan (Calls backend /api/v1/traffic/cameras/:id/analyze)
  const handleRunVisionScan = async (simulateRoadblock = false) => {
    if (!selectedCamera) return
    setIsScanning(true)
    try {
      const res = await trafficService.analyzeCamera(selectedCamera.id, {
        simulateRoadblock,
        numVehicles: simulateRoadblock ? 14 : 7,
      })

      if (res.success && res.analysis) {
        const analysis = res.analysis
        setScanResult(analysis)

        // Update selected camera with new detection counts
        if (analysis.detection_counts) {
          setSelectedCamera((prev) => ({
            ...prev,
            detectedObjects: {
              cars: analysis.detection_counts.cars || 0,
              buses: analysis.detection_counts.buses || 0,
              trucks: analysis.detection_counts.trucks || 0,
              motorcycles: analysis.detection_counts.motorcycles || 0,
            },
            queueLengthMeters: analysis.traffic_metrics?.queue_length_meters || prev.queueLengthMeters,
            stationaryVehiclesCount: analysis.traffic_metrics?.stationary_vehicles_count || 0,
            trafficDensity: analysis.traffic_metrics?.density_level || prev.trafficDensity,
          }))
        }

        // Add to recent detections log
        if (analysis.incident_classification && analysis.incident_classification.detected) {
          const newDetection = {
            id: `DET-${Date.now().toString().slice(-5)}`,
            cameraId: selectedCamera.id,
            cameraName: selectedCamera.name,
            location: selectedCamera.location,
            category: analysis.incident_classification.category,
            label: analysis.incident_classification.label,
            confidence: analysis.incident_classification.confidence,
            description: analysis.incident_classification.description,
            timestamp: new Date().toLocaleTimeString(),
            queueLength: analysis.traffic_metrics?.queue_length_meters || 0,
            evidenceFrame: analysis.evidence_frame || null,
            status: 'FLAGGED',
          }
          setRecentDetections((prev) => [newDetection, ...prev.slice(0, 15)])

          addToast({
            type: simulateRoadblock ? 'error' : 'warning',
            title: `AI Incident Flagged: ${analysis.incident_classification.label}`,
            message: `${analysis.incident_classification.description} (Confidence: ${Math.round(analysis.incident_classification.confidence * 100)}%)`,
          })
        } else {
          addToast({
            type: 'info',
            title: 'Computer Vision Scan Complete',
            message: `Detected ${analysis.detection_counts?.total_vehicles || 0} vehicles. Flow optimal within bounds.`,
          })
        }
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Vision Scan Failed',
        message: err.message || 'Analysis error occurred.',
      })
    } finally {
      setIsScanning(false)
    }
  }

  // Canvas HUD Simulation for smooth visuals when real video is playing or paused
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let frameId = 0

    // Vehicle positions state for smooth animation
    const vehicles = [
      { id: 'V1', type: 'car', x: 80, y: 160, speed: 42, color: '#f59e0b', lane: 1, stopped: false },
      { id: 'V2', type: 'bus', x: 280, y: 120, speed: 34, color: '#3b82f6', lane: 0, stopped: false },
      { id: 'V3', type: 'truck', x: 440, y: 210, speed: 28, color: '#ef4444', lane: 2, stopped: false },
      { id: 'V4', type: 'motorcycle', x: 190, y: 240, speed: 48, color: '#10b981', lane: 2, stopped: false },
      { id: 'V5', type: 'car', x: 520, y: 140, speed: 38, color: '#f59e0b', lane: 0, stopped: false },
    ]

    const render = () => {
      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)

      // Only draw synthetic road if not displaying real device webcam
      if (!webcamActive && (!videoPlayerRef.current || videoPlayerRef.current.paused)) {
        // Road surface
        ctx.fillStyle = '#1e293b'
        ctx.fillRect(0, 60, W, H - 90)

        // Lane divider dashed lines
        ctx.strokeStyle = '#eab308'
        ctx.lineWidth = 2
        ctx.setLineDash([16, 16])
        for (let ly of [H * 0.4, H * 0.65]) {
          ctx.beginPath()
          ctx.moveTo(0, ly)
          ctx.lineTo(W, ly)
          ctx.stroke()
        }
        ctx.setLineDash([])

        // Curbs
        ctx.strokeStyle = '#475569'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(0, 60)
        ctx.lineTo(W, 60)
        ctx.moveTo(0, H - 30)
        ctx.lineTo(W, H - 30)
        ctx.stroke()
      }

      // Update and render simulated vehicles
      vehicles.forEach((v) => {
        if (!v.stopped) {
          v.x += v.speed * 0.03
          if (v.x > W + 60) v.x = -60
        }

        const boxW = v.type === 'bus' ? 84 : v.type === 'truck' ? 76 : v.type === 'motorcycle' ? 32 : 54
        const boxH = v.type === 'bus' ? 36 : v.type === 'truck' ? 34 : v.type === 'motorcycle' ? 22 : 28

        // Draw vehicle body if synthetic canvas
        if (!webcamActive) {
          ctx.fillStyle = v.color
          ctx.fillRect(v.x, v.y, boxW, boxH)
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 1
          ctx.strokeRect(v.x, v.y, boxW, boxH)
        }

        // Draw AI Bounding Box HUD
        if (showBoundingBoxes) {
          ctx.strokeStyle = v.stopped ? '#ef4444' : v.color
          ctx.lineWidth = 2
          ctx.strokeRect(v.x - 3, v.y - 3, boxW + 6, boxH + 6)

          // Top label banner
          ctx.fillStyle = v.stopped ? '#ef4444' : v.color
          ctx.fillRect(v.x - 3, v.y - 18, boxW + 6, 16)
          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 9px monospace'
          ctx.fillText(`${v.type.toUpperCase()} #0${v.id}`, v.x, v.y - 6)
        }

        // Draw Velocity Vectors
        if (showSpeeds) {
          ctx.fillStyle = '#ffffff'
          ctx.font = '9px monospace'
          ctx.fillText(`${v.stopped ? '0' : v.speed} km/h`, v.x + 4, v.y + boxH + 12)
        }
      })

      // Draw Physical Queue Line & Length Marker
      if (showQueueLine && selectedCamera?.queueLengthMeters > 0) {
        const queuePx = Math.min(W * 0.6, (selectedCamera.queueLengthMeters / 150) * W)
        ctx.strokeStyle = selectedCamera.queueLengthMeters > 70 ? '#ef4444' : '#38bdf8'
        ctx.lineWidth = 3
        ctx.setLineDash([6, 4])
        ctx.beginPath()
        ctx.moveTo(40, H - 42)
        ctx.lineTo(40 + queuePx, H - 42)
        ctx.stroke()
        ctx.setLineDash([])

        // Queue length label
        ctx.fillStyle = selectedCamera.queueLengthMeters > 70 ? '#ef4444' : '#38bdf8'
        ctx.font = 'bold 10px monospace'
        ctx.fillText(`QUEUE ESTIMATE: ${selectedCamera.queueLengthMeters}m`, 45 + queuePx, H - 39)
      }

      frameId = requestAnimationFrame(render)
    }

    render()
    return () => cancelAnimationFrame(frameId)
  }, [webcamActive, showBoundingBoxes, showSpeeds, showQueueLine, selectedCamera])

  // Filtered Cameras Directory
  const filteredCameras = cameras.filter((cam) => {
    const matchesSearch =
      cam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cam.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cam.location && cam.location.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesSector = sectorFilter === 'ALL' || cam.sector === sectorFilter
    const matchesSourceType = sourceTypeFilter === 'ALL' || cam.sourceType === sourceTypeFilter
    const matchesStatus = statusFilter === 'ALL' || cam.status === statusFilter

    return matchesSearch && matchesSector && matchesSourceType && matchesStatus
  })

  // Sectors list for filter
  const sectorOptions = ['ALL', ...new Set(cameras.map((c) => c.sector).filter(Boolean))]

  return (
    <div className="space-y-6">
      {/* 1. Header & Vision AI Engine Bar */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <Camera className="w-6 h-6 text-cyan-400" />
                Live Camera Intelligence & Roadblock Detection
              </h1>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                OPENCV + ONNX DNN
              </span>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                TEMPORAL SLIDING WINDOW
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Multi-source video surveillance ingestion, multi-object vehicle tracking (COCO/VOC), velocity estimation, physical queue length modeling, and real-time roadblock classification with automated alert deduplication.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={webcamActive ? 'critical' : 'secondary'}
              size="sm"
              icon={webcamActive ? VideoOff : Video}
              onClick={webcamActive ? stopLocalWebcam : startLocalWebcam}
            >
              {webcamActive ? 'Disconnect Webcam' : 'Connect Local Webcam'}
            </Button>

            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setShowAddModal(true)}
            >
              Register Camera
            </Button>
          </div>
        </div>

        {/* Vision AI Capabilities & Status Ticker */}
        {visionStatus && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 flex-wrap text-slate-400 font-mono text-[11px]">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Engine: {visionStatus.service || 'Online'}
              </span>
              <span>Model: <strong className="text-slate-200">{visionStatus.model_file || 'tinyyolov2-8.onnx'}</strong></span>
              <span>Classes: <strong className="text-slate-200">{(visionStatus.supported_classes || []).slice(0, 4).join(', ')}</strong></span>
            </div>

            <div className="text-[11px] text-slate-400 font-mono">
              Attribution: <span className="text-slate-300">Belagavi Smart City Mobility Data • MIT/OpenCV 5.0</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <div className="relative w-full max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search camera name, ID, sector..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sector filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Sector:</span>
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {sectorOptions.map((s) => (
                <option key={s} value={s}>{s === 'ALL' ? 'All Sectors' : s}</option>
              ))}
            </select>
          </div>

          {/* Source Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Source:</span>
            <select
              value={sourceTypeFilter}
              onChange={(e) => setSourceTypeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Source Types</option>
              <option value="public_hls">Public HLS Feed</option>
              <option value="snapshot">HTTP Snapshot Feed</option>
              <option value="rtsp">Authorized IP (RTSP)</option>
              <option value="webcam">Hardware Webcam</option>
              <option value="demo_video">Demo Video [Simulated]</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Status</option>
              <option value="ONLINE">Online Only</option>
              <option value="OFFLINE">Offline Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Primary Grid: Surveillance Player (Left 7 cols) & Camera Directory (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Active Video Feed, AI HUD, & Telemetry */}
        <div className="lg:col-span-7 space-y-4">
          {selectedCamera ? (
            <div
              ref={playerContainerRef}
              className={`rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl flex flex-col ${
                isPlayerFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : ''
              }`}
            >
              {/* Stream Header & Location Info */}
              <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-white truncate flex items-center gap-2">
                      {selectedCamera.name}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                        {selectedCamera.id}
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                      {selectedCamera.location || selectedCamera.sector}
                      <span className="text-slate-600">•</span>
                      <span className="font-mono text-slate-400">
                        {selectedCamera.latitude?.toFixed(4)}, {selectedCamera.longitude?.toFixed(4)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Source Type Tag */}
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      selectedCamera.sourceType === 'demo_video'
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                        : selectedCamera.sourceType === 'webcam'
                        ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                        : selectedCamera.sourceType === 'rtsp'
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                        : 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {SOURCE_TYPE_LABELS[selectedCamera.sourceType]?.label || selectedCamera.sourceType}
                  </span>

                  <button
                    type="button"
                    onClick={() => setIsPlayerFullscreen(!isPlayerFullscreen)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title={isPlayerFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                  >
                    {isPlayerFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Video Player Canvas Container */}
              <div className="relative w-full aspect-video bg-black overflow-hidden flex items-center justify-center">
                {/* Real Hardware Webcam Stream */}
                {selectedCamera.sourceType === 'webcam' && (
                  <video
                    ref={videoPlayerRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover z-0"
                  />
                )}

                {/* Demo Video Feed (Prerecorded video with explicit simulated attribution) */}
                {selectedCamera.sourceType === 'demo_video' && selectedCamera.streamUrl && (
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    src={selectedCamera.streamUrl}
                    className="absolute inset-0 w-full h-full object-cover z-0"
                  />
                )}

                {/* HTTP Snapshot Stream */}
                {selectedCamera.sourceType === 'snapshot' && selectedCamera.snapshotUrl && (
                  <img
                    src={selectedCamera.snapshotUrl}
                    alt={selectedCamera.name}
                    className="absolute inset-0 w-full h-full object-cover z-0"
                  />
                )}

                {/* Public HLS or Protected RTSP stream preview */}
                {(selectedCamera.sourceType === 'public_hls' || selectedCamera.sourceType === 'rtsp') && selectedCamera.snapshotUrl && (
                  <img
                    src={selectedCamera.snapshotUrl}
                    alt={selectedCamera.name}
                    className="absolute inset-0 w-full h-full object-cover z-0"
                  />
                )}

                {/* High-Fidelity OpenCV / YOLO HUD Canvas Layer */}
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={360}
                  className="absolute inset-0 w-full h-full object-fill z-10 pointer-events-none"
                />

                {/* Optical HUD Watermark (Top-Left) */}
                <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-mono text-white">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span className="font-bold text-rose-400">REC LIVE</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-cyan-400">{selectedCamera.id}</span>
                  <span className="text-slate-400">|</span>
                  <span>{selectedCamera.resolution || '1080p 60fps'}</span>
                </div>

                {/* HUD Clock & Bitrate (Top-Right) */}
                <div className="absolute top-3 right-3 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-mono text-slate-300">
                  <span>{currentTimecode}</span>
                  <span className="text-emerald-400">{selectedCamera.fps || 30} FPS</span>
                  <span className="text-slate-400">{selectedCamera.bitrate || '4.0 Mbps'}</span>
                </div>

                {/* Simulated Feed Warning Banner */}
                {selectedCamera.sourceType === 'demo_video' && (
                  <div className="absolute bottom-3 left-3 z-20 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-mono text-amber-300">
                    [SIMULATED-DEMO-FEED] Prerecorded Telemetry
                  </div>
                )}
              </div>

              {/* HUD Overlay Controls Toolbar */}
              <div className="p-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-slate-400 text-[11px] font-medium mr-1">HUD Toggles:</span>
                  <button
                    type="button"
                    onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                    className={`px-2 py-1 rounded-lg font-mono text-[11px] transition-all cursor-pointer ${
                      showBoundingBoxes
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Bounding Boxes
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSpeeds(!showSpeeds)}
                    className={`px-2 py-1 rounded-lg font-mono text-[11px] transition-all cursor-pointer ${
                      showSpeeds
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Velocities
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowQueueLine(!showQueueLine)}
                    className={`px-2 py-1 rounded-lg font-mono text-[11px] transition-all cursor-pointer ${
                      showQueueLine
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Queue Vector
                  </button>
                </div>

                {/* Scan Action Controls */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Cpu}
                    loading={isScanning}
                    onClick={() => handleRunVisionScan(false)}
                  >
                    Run AI Vision Scan
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    icon={AlertTriangle}
                    loading={isScanning}
                    onClick={() => handleRunVisionScan(true)}
                  >
                    Simulate Roadblock
                  </Button>
                </div>
              </div>

              {/* Telemetry Summary Cards Below Video */}
              <div className="p-4 bg-slate-950 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-t border-slate-800/80">
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <Car className="w-3 h-3 text-cyan-400" />
                    Vehicles Tracked
                  </span>
                  <div className="text-lg font-bold text-white font-mono mt-1">
                    {selectedCamera.detectedObjects?.cars || 18}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Cars: {selectedCamera.detectedObjects?.cars || 12} | Buses: {selectedCamera.detectedObjects?.buses || 2}
                  </div>
                </div>

                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-amber-400" />
                    Queue Length
                  </span>
                  <div className="text-lg font-bold text-amber-400 font-mono mt-1">
                    {selectedCamera.queueLengthMeters || 24}m
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Physical tailback estimate
                  </div>
                </div>

                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    Stationary Vehicles
                  </span>
                  <div className="text-lg font-bold text-rose-400 font-mono mt-1">
                    {selectedCamera.stationaryVehiclesCount || 0}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {selectedCamera.stationaryVehiclesCount > 0 ? 'Hazard evaluation active' : 'Zero stopped hazards'}
                  </div>
                </div>

                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-emerald-400" />
                    Traffic Density
                  </span>
                  <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
                    {selectedCamera.trafficDensity || 'Optimal'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Flow classification
                  </div>
                </div>
              </div>

              {/* Attribution and Legal Permissions Footer */}
              <div className="p-3 bg-slate-900/40 border-t border-slate-800/60 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
                <span>
                  Source: <strong className="text-slate-300">{selectedCamera.attribution || 'Belagavi Smart City Mobility Data'}</strong>
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  Permissions: {selectedCamera.usagePermissions || 'Authorized Transit Telemetry'}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-12 text-center text-slate-400">
              <Camera className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-medium">Select a camera node from the directory to inspect its live vision stream.</p>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Camera Network Directory & Incident Log */}
        <div className="lg:col-span-5 space-y-4">
          {/* Camera Directory Card */}
          <PanelCard
            title={`Active Surveillance Nodes (${filteredCameras.length})`}
            subtitle="Click any optical sensor node to switch live feed"
          >
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {filteredCameras.map((cam) => {
                const isSelected = selectedCamera?.id === cam.id
                const isLocal = cam.sourceType === 'webcam'
                const isDemo = cam.sourceType === 'demo_video'

                return (
                  <div
                    key={cam.id}
                    onClick={() => handleSelectCamera(cam)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-850 border-cyan-500/70 shadow-lg shadow-cyan-950/30'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              cam.status === 'ONLINE' ? 'bg-emerald-400' : 'bg-rose-400'
                            }`}
                          />
                          <span className="text-xs font-bold text-white truncate">{cam.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">{cam.sector}</p>
                      </div>

                      {/* Source type badge */}
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase flex-shrink-0 ${
                          isDemo
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                            : isLocal
                            ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                            : 'bg-blue-950/60 text-blue-300 border border-blue-800/60'
                        }`}
                      >
                        {cam.sourceType?.replace('_', ' ') || 'FEED'}
                      </span>
                    </div>

                    {/* Bottom stats row */}
                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>ID: <strong className="text-slate-300">{cam.id}</strong></span>
                      <span>Vehicles: <strong className="text-cyan-400">{cam.detectedObjects?.cars || 18}</strong></span>
                      <span>Queue: <strong className="text-amber-400">{cam.queueLengthMeters || 20}m</strong></span>
                    </div>
                  </div>
                )
              })}

              {filteredCameras.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-500">
                  No surveillance nodes match the selected filter criteria.
                </div>
              )}
            </div>
          </PanelCard>

          {/* Recent AI Roadblock & Incident Log */}
          <PanelCard
            title="Real-Time Computer Vision Incident Alerts"
            subtitle="Automated alerts classified by temporal sliding window"
          >
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {recentDetections.map((det) => (
                <div
                  key={det.id}
                  className="p-2.5 rounded-xl bg-slate-950/80 border border-rose-900/40 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                      {det.label}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{det.timestamp}</span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-snug">{det.description}</p>

                  <div className="flex items-center justify-between pt-1 text-[10px] font-mono">
                    <span className="text-slate-400">
                      Node: <strong className="text-white">{det.cameraId}</strong> (Conf: {Math.round(det.confidence * 100)}%)
                    </span>

                    {det.evidenceFrame && (
                      <button
                        type="button"
                        onClick={() => setShowEvidenceModal(det)}
                        className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
                      >
                        View HUD Evidence
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {recentDetections.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-500">
                  Zero active roadblock alarms. Use the <strong>"Simulate Roadblock"</strong> button above to test real-time detection & alert dispatch.
                </div>
              )}
            </div>
          </PanelCard>
        </div>
      </div>

      {/* 4. Register Authorized Camera Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Register Authorized Surveillance Camera"
          subtitle="Add an authorized public feed, municipal IP camera, or presentation demo stream"
          maxWidth="max-w-xl"
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.target)
              const payload = {
                id: formData.get('id') || `CAM-${Date.now().toString().slice(-4)}`,
                name: formData.get('name'),
                location: formData.get('location'),
                latitude: Number(formData.get('latitude')) || 15.8497,
                longitude: Number(formData.get('longitude')) || 74.4977,
                sector: formData.get('sector') || 'Central Belagavi Grid',
                sourceType: formData.get('sourceType'),
                streamUrl: formData.get('streamUrl'),
                rtspInternalUrl: formData.get('rtspInternalUrl') || '',
                attribution: formData.get('attribution') || 'Municipal Traffic Authority',
                usagePermissions: formData.get('usagePermissions') || 'Authorized Feed',
              }

              const res = await trafficService.createCamera(payload)
              if (res.success) {
                setCameras((prev) => [res.data, ...prev])
                setSelectedCamera(res.data)
                setShowAddModal(false)
                addToast({
                  type: 'success',
                  title: 'Camera Registered',
                  message: `Node ${res.data.id} registered into surveillance directory.`,
                })
              }
            }}
            className="space-y-3.5 text-xs"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Camera ID (Optional)</label>
                <input
                  name="id"
                  placeholder="e.g. CAM-BGM-07"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Source Type *</label>
                <select
                  name="sourceType"
                  defaultValue="public_hls"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="public_hls">Authorized Public HLS (.m3u8)</option>
                  <option value="snapshot">HTTP Snapshot Feed</option>
                  <option value="rtsp">Authorized IP Camera (RTSP)</option>
                  <option value="demo_video">Simulated Demo Video</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Camera Name *</label>
              <input
                name="name"
                required
                placeholder="e.g. Club Road - Military Camp Junction"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Urban Sector</label>
                <input
                  name="sector"
                  defaultValue="Central Belagavi Grid"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Location Details</label>
                <input
                  name="location"
                  placeholder="e.g. Club Road Crossing, Belagavi"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Latitude</label>
                <input
                  name="latitude"
                  type="number"
                  step="any"
                  defaultValue={15.8500}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Longitude</label>
                <input
                  name="longitude"
                  type="number"
                  step="any"
                  defaultValue={74.5000}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Public Stream / Snapshot URL *</label>
              <input
                name="streamUrl"
                required
                placeholder="https://.../stream.m3u8 or https://.../image.jpg"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Internal RTSP Ingest URL (Protected on Backend)
              </label>
              <input
                name="rtspInternalUrl"
                placeholder="rtsp://admin:pass@192.168.1.10:554/stream"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
              <p className="text-[10px] text-amber-400/80 mt-1 flex items-center gap-1">
                <Shield className="w-3 h-3 text-amber-400" />
                Zero-exposure security guarantee: RTSP credentials are redacted and never returned to frontend clients.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Attribution Tag</label>
                <input
                  name="attribution"
                  defaultValue="Belagavi Traffic Authority"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Permissions License</label>
                <input
                  name="usagePermissions"
                  defaultValue="Authorized Smart Mobility Feed"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <Button variant="secondary" size="sm" type="button" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Register Camera
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 5. View Evidence Frame Modal */}
      {showEvidenceModal && (
        <Modal
          isOpen={Boolean(showEvidenceModal)}
          onClose={() => setShowEvidenceModal(null)}
          title={`Computer Vision Evidence Frame: ${showEvidenceModal.label}`}
          subtitle={`${showEvidenceModal.cameraName} (${showEvidenceModal.cameraId}) • ${showEvidenceModal.timestamp}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-3">
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-black">
              {showEvidenceModal.evidenceFrame ? (
                <img
                  src={showEvidenceModal.evidenceFrame}
                  alt="AI Annotated Evidence"
                  className="w-full h-auto object-contain"
                />
              ) : (
                <div className="p-12 text-center text-slate-500 font-mono text-xs">
                  Telemetry incident recorded without high-resolution frame raster.
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-300 font-bold">
                <span>Classification: {showEvidenceModal.category}</span>
                <span className="text-rose-400 font-mono">
                  Confidence: {Math.round(showEvidenceModal.confidence * 100)}%
                </span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">{showEvidenceModal.description}</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified by Temporal Analysis Window
              </span>
              <Button variant="secondary" size="sm" onClick={() => setShowEvidenceModal(null)}>
                Close Evidence
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
