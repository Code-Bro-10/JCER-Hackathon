import React, { useState, useEffect } from 'react'
import { Video, Shield, Maximize2, RefreshCw, Eye, Camera, Check, Radio } from 'lucide-react'
import Modal from '../common/Modal'
import { CCTV_FEEDS } from '../../services/mockData'
import Badge from '../common/Badge'
import Button from '../common/Button'
import { useTraffic } from '../../context/TrafficContext'
import ActiveTrafficStream from './ActiveTrafficStream'

export default function CCTVLiveFeedModal() {
  const { activeCameraModal, setActiveCameraModal } = useTraffic()
  const [selectedCamId, setSelectedCamId] = useState('CAM-BGM-01')
  const [activeTab, setActiveTab] = useState('ai_overlay') // 'ai_overlay' | 'raw' | 'telemetry'

  useEffect(() => {
    if (activeCameraModal && typeof activeCameraModal === 'string') {
      setSelectedCamId(activeCameraModal)
    }
  }, [activeCameraModal])

  if (!activeCameraModal) return null

  const cam = CCTV_FEEDS.find((c) => c.id === selectedCamId) || CCTV_FEEDS[0]
  const isDeviceWebcam = selectedCamId === 'CAM-LOCAL-WEBCAM' || cam?.isLocalWebcam

  return (
    <Modal
      isOpen={Boolean(activeCameraModal)}
      onClose={() => setActiveCameraModal(null)}
      title={`Live Surveillance Vision Feed: ${cam.name}`}
      subtitle={`${cam.sector} | Optical Sensor Node: ${cam.id}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Camera Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CCTV_FEEDS.map((c) => {
            const isLocal = c.id === 'CAM-LOCAL-WEBCAM'
            const isSelected = selectedCamId === c.id

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCamId(c.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? isLocal
                      ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/25'
                      : 'bg-cyan-500 text-gray-950 font-bold shadow-md shadow-cyan-500/20'
                    : isLocal
                    ? 'bg-rose-950/40 text-rose-300 border border-rose-800/60 hover:bg-rose-900/40'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isLocal ? <Radio className="w-3.5 h-3.5 animate-pulse text-rose-400" /> : <Camera className="w-3.5 h-3.5" />}
                <span>{c.name.split(' - ')[0]}</span>
              </button>
            )
          })}
        </div>

        {/* Active Real-Time Video / Canvas Stream (Zero Blank Screens) */}
        <ActiveTrafficStream
          camera={cam}
          activeTab={activeTab}
          isDeviceWebcam={isDeviceWebcam}
          onToggleWebcam={(active) => {
            if (active) setSelectedCamId('CAM-LOCAL-WEBCAM')
            else setSelectedCamId('CAM-BGM-01')
          }}
        />

        {/* View Mode controls & Object Counting breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Inference Overlay Mode</span>
            <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('ai_overlay')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                  activeTab === 'ai_overlay' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                AI YOLOv9 Overlay
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('raw')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                  activeTab === 'raw' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Raw Camera Feed
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-around text-center">
            <div>
              <div className="text-sm font-bold text-white font-mono">
                {cam.detectedObjects.cars || (isDeviceWebcam ? 1 : 24)}
              </div>
              <div className="text-[10px] text-slate-400">
                {isDeviceWebcam ? 'Operator' : 'Vehicles'}
              </div>
            </div>
            <div className="w-[1px] h-6 bg-slate-800" />
            <div>
              <div className="text-sm font-bold text-cyan-400 font-mono">
                {cam.detectedObjects.buses || cam.detectedObjects.twoWheelers || (isDeviceWebcam ? 1 : 6)}
              </div>
              <div className="text-[10px] text-slate-400">
                {isDeviceWebcam ? 'Face Track' : 'Transit'}
              </div>
            </div>
            <div className="w-[1px] h-6 bg-slate-800" />
            <div>
              <div className="text-sm font-bold text-yellow-400 font-mono">
                {cam.detectedObjects.pedestrians || (isDeviceWebcam ? 2 : 18)}
              </div>
              <div className="text-[10px] text-slate-400">
                {isDeviceWebcam ? 'Screens/Dev' : 'Pedestrians'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}


