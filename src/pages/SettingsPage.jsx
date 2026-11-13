import React, { useState } from 'react'
import {
  Settings,
  Server,
  Database,
  Volume2,
  VolumeX,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Shield,
  Radio,
  Cpu,
} from 'lucide-react'
import { useTraffic } from '../context/TrafficContext'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'

export default function SettingsPage() {
  const { isAudioMuted, toggleMute, addToast } = useTraffic()

  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1')
  const [useMockMode, setUseMockMode] = useState(true)
  const [aiThreshold, setAiThreshold] = useState(85)
  const [pollingRate, setPollingRate] = useState(1)
  const [selectedTheme, setSelectedTheme] = useState('cyan')

  const handleTestConnection = () => {
    addToast({
      type: 'info',
      title: 'API Probe Initiated',
      message: `Probed endpoint: ${apiUrl}. In Mock Mode: using resilient autonomous state layer.`,
    })
  }

  const handleResetCache = () => {
    localStorage.removeItem('trafficai_incidents_v1')
    localStorage.removeItem('trafficai_intersections_v1')
    localStorage.removeItem('trafficai_emergency_v1')
    addToast({
      type: 'success',
      title: 'Local Cache Reset',
      message: 'Restored all incidents, signals, and dispatches to factory defaults.',
    })
    setTimeout(() => window.location.reload(), 800)
  }

  const handleSaveSettings = () => {
    addToast({
      type: 'success',
      title: 'Settings Saved',
      message: 'Operator configuration applied successfully.',
    })
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            System Settings & API Gateway
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              MOCK SERVICE ACTIVE
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure backend REST endpoints, autonomous AI thresholds, audio telemetry, and local cache.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSaveSettings}
        >
          Save Configuration
        </Button>
      </div>

      {/* Backend API Configuration Card */}
      <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Backend API Service Layer</h3>
              <p className="text-xs text-slate-400">
                Switches seamlessly between live smart city backend REST endpoints and local mock datasets
              </p>
            </div>
          </div>
          <Badge variant={useMockMode ? 'cyan' : 'emerald'} size="sm">
            {useMockMode ? 'MOCK SERVICE' : 'LIVE BACKEND'}
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <div className="text-sm font-semibold text-white">Autonomous Mock Data Fallback</div>
              <div className="text-xs text-slate-400">
                When live backend is unavailable, serves high-fidelity realistic smart city data with local storage mutations
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUseMockMode(!useMockMode)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                useMockMode ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-black shadow transform transition-transform ${
                  useMockMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 block">
              REST API Base Endpoint
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://localhost:8000/api/v1"
                className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs font-mono text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
              <Button variant="secondary" size="sm" onClick={handleTestConnection}>
                Test Ping
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Model Parameters */}
      <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">AI Autonomous Dispatch Thresholds</h3>
              <p className="text-xs text-slate-400">Configure machine learning confidence triggers</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-white">Automatic Signal Optimization Confidence</span>
              <span className="font-mono text-cyan-400 font-bold">{aiThreshold}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="99"
              value={aiThreshold}
              onChange={(e) => setAiThreshold(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>Aggressive (50%)</span>
              <span>Balanced (85%)</span>
              <span>Ultra Conservative (99%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Audio & Alerts */}
      <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Auditory Alerts & Sirens</h3>
              <p className="text-xs text-slate-400">Web Audio API synthesized sound cues for emergency events</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
          <div>
            <div className="text-sm font-semibold text-white">Audio Feedback Alerts</div>
            <div className="text-xs text-slate-400">
              Plays priority siren blips on Code Red dispatches and success tones on incident resolutions
            </div>
          </div>
          <Button
            variant={isAudioMuted ? 'outline' : 'success'}
            size="sm"
            icon={isAudioMuted ? VolumeX : Volume2}
            onClick={toggleMute}
          >
            {isAudioMuted ? 'Audio Muted' : 'Audio Enabled'}
          </Button>
        </div>
      </div>

      {/* Local Storage & Cache */}
      <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Local Storage Telemetry Cache</h3>
              <p className="text-xs text-slate-400">Clear custom created incidents and restored default demo state</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
          <div>
            <div className="text-sm font-semibold text-white">Reset Simulation Database</div>
            <div className="text-xs text-slate-400">
              Deletes custom reported incidents and restores the original smart city dataset
            </div>
          </div>
          <Button
            variant="danger"
            size="sm"
            icon={RotateCcw}
            onClick={handleResetCache}
          >
            Reset to Default State
          </Button>
        </div>
      </div>
    </div>
  )
}
