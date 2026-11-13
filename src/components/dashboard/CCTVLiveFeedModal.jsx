import React, { useState, useEffect } from 'react'
import { Video, Shield, Maximize2, RefreshCw, Eye, Camera, Check } from 'lucide-react'
import Modal from '../common/Modal'
import { CCTV_FEEDS } from '../../services/mockData'
import Badge from '../common/Badge'
import Button from '../common/Button'
import { useTraffic } from '../../context/TrafficContext'

export default function CCTVLiveFeedModal() {
  const { activeCameraModal, setActiveCameraModal } = useTraffic()
  const [selectedCamId, setSelectedCamId] = useState('CAM-DOWNTOWN-01')
  const [fpsCounter, setFpsCounter] = useState(30)
  const [activeTab, setActiveTab] = useState('ai_overlay') // 'ai_overlay' | 'raw' | 'telemetry'

  useEffect(() => {
    if (activeCameraModal && typeof activeCameraModal === 'string') {
      setSelectedCamId(activeCameraModal)
    }
  }, [activeCameraModal])

  // Random FPS jitter for live camera realism
  useEffect(() => {
    const interval = setInterval(() => {
      setFpsCounter(Math.floor(29 + Math.random() * 3))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  if (!activeCameraModal) return null

  const cam = CCTV_FEEDS.find((c) => c.id === selectedCamId) || CCTV_FEEDS[0]

  return (
    <Modal
      isOpen={Boolean(activeCameraModal)}
      onClose={() => setActiveCameraModal(null)}
      title={`Live CCTV Surveillance Feed: ${cam.name}`}
      subtitle={`${cam.sector} | Optical Sensor Node ID: ${cam.id}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Camera Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CCTV_FEEDS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCamId(c.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedCamId === c.id
                  ? 'bg-cyan-500 text-gray-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{c.name.split('-')[0]}</span>
            </button>
          ))}
        </div>

        {/* Video Canvas / Screen Simulation */}
        <div className="relative aspect-video w-full rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner flex flex-col justify-between p-4">
          {/* Subtle grid background simulating camera optics */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(to right, #06b6d4 1px, transparent 1px), linear-gradient(to bottom, #06b6d4 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Scanline effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-20 animate-scanline pointer-events-none" />

          {/* Top Camera HUD Overlay */}
          <div className="relative z-10 flex items-center justify-between bg-slate-950/70 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800/80">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                REC LIVE
              </span>
              <span className="text-xs font-mono text-slate-300">{cam.id}</span>
              <Badge variant="cyan" size="sm">{cam.resolution}</Badge>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
              <span>{fpsCounter} FPS</span>
              <span>{cam.bitrate}</span>
              <span className="text-emerald-400">STABLE</span>
            </div>
          </div>

          {/* AI Bounding Boxes Simulation (Only if activeTab is ai_overlay) */}
          {activeTab === 'ai_overlay' && (
            <div className="relative flex-1 w-full my-2 pointer-events-none">
              {/* Simulated Detected Vehicle 1 */}
              <div className="absolute top-[28%] left-[24%] w-[22%] h-[32%] border-2 border-emerald-400 bg-emerald-500/10 rounded">
                <div className="absolute -top-5 left-0 bg-emerald-500 text-gray-950 px-1 py-0.2 text-[10px] font-mono font-bold">
                  PASSENGER_CAR [98%]
                </div>
                <div className="absolute -bottom-4 left-0 text-[9px] font-mono text-emerald-300">
                  SPEED: 44 km/h
                </div>
              </div>

              {/* Simulated Detected Bus 2 */}
              <div className="absolute top-[18%] left-[54%] w-[32%] h-[48%] border-2 border-cyan-400 bg-cyan-500/10 rounded">
                <div className="absolute -top-5 left-0 bg-cyan-500 text-gray-950 px-1 py-0.2 text-[10px] font-mono font-bold">
                  TRANSIT_BUS [99%]
                </div>
                <div className="absolute -bottom-4 left-0 text-[9px] font-mono text-cyan-300">
                  SPEED: 32 km/h - ROUTE #4
                </div>
              </div>

              {/* Simulated Detected Pedestrian 3 */}
              <div className="absolute top-[52%] left-[10%] w-[8%] h-[28%] border-2 border-yellow-400 bg-yellow-500/10 rounded">
                <div className="absolute -top-5 left-0 bg-yellow-400 text-gray-950 px-1 py-0.2 text-[10px] font-mono font-bold">
                  PEDESTRIAN [94%]
                </div>
              </div>
            </div>
          )}

          {activeTab === 'raw' && (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm font-mono">
              [RAW OPTICAL SENSOR STREAM - AI INFERENCE LAYER OFF]
            </div>
          )}

          {/* Bottom Feed HUD Overlay */}
          <div className="relative z-10 flex items-center justify-between bg-slate-950/70 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800/80">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-slate-300 font-mono">
                {cam.aiAlert || 'Autonomous Monitoring Normal'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <span>DENSITY:</span>
              <span className={cam.trafficDensity === 'Heavy' ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                {cam.trafficDensity.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* View Mode controls & Object Counting breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Overlay Mode</span>
            <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('ai_overlay')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                  activeTab === 'ai_overlay' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400'
                }`}
              >
                AI YOLOv9 Overlay
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('raw')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                  activeTab === 'raw' ? 'bg-slate-700 text-white' : 'text-slate-400'
                }`}
              >
                Clean Stream
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-around text-center">
            <div>
              <div className="text-sm font-bold text-white font-mono">{cam.detectedObjects.cars || 24}</div>
              <div className="text-[10px] text-slate-400">Cars</div>
            </div>
            <div className="w-[1px] h-6 bg-slate-800" />
            <div>
              <div className="text-sm font-bold text-cyan-400 font-mono">{cam.detectedObjects.buses || 4}</div>
              <div className="text-[10px] text-slate-400">Transit Buses</div>
            </div>
            <div className="w-[1px] h-6 bg-slate-800" />
            <div>
              <div className="text-sm font-bold text-yellow-400 font-mono">{cam.detectedObjects.pedestrians || 18}</div>
              <div className="text-[10px] text-slate-400">Pedestrians</div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

