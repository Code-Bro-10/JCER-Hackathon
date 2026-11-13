import React from 'react'
import {
  Camera,
  Radio,
  Cpu,
  Zap,
  Activity,
  CheckCircle2,
  AlertCircle,
  Wifi,
} from 'lucide-react'
import Badge from '../common/Badge'

export default function SensorHealthGrid({ healthData }) {
  const devices = [
    {
      id: 'cameras',
      title: 'Optical CCTV Nodes',
      online: healthData?.cameras?.online || 428,
      total: healthData?.cameras?.total || 432,
      percentage: healthData?.cameras?.percentage || 99.1,
      icon: Camera,
      color: 'cyan',
    },
    {
      id: 'signals',
      title: 'Smart Signal Controllers',
      online: healthData?.smartSignals?.online || 112,
      total: healthData?.smartSignals?.total || 112,
      percentage: healthData?.smartSignals?.percentage || 100.0,
      icon: Zap,
      color: 'emerald',
    },
    {
      id: 'vms',
      title: 'Variable Message Signs',
      online: healthData?.vmsSigns?.online || 34,
      total: healthData?.vmsSigns?.total || 36,
      percentage: healthData?.vmsSigns?.percentage || 94.4,
      icon: Radio,
      color: 'amber',
    },
    {
      id: 'loops',
      title: 'Induction Loop Sensors',
      online: healthData?.inductionLoops?.online || 880,
      total: healthData?.inductionLoops?.total || 895,
      percentage: healthData?.inductionLoops?.percentage || 98.3,
      icon: Activity,
      color: 'blue',
    },
    {
      id: 'radar',
      title: 'Microwave Radar Detectors',
      online: healthData?.radarSensors?.online || 164,
      total: healthData?.radarSensors?.total || 165,
      percentage: healthData?.radarSensors?.percentage || 99.4,
      icon: Cpu,
      color: 'purple',
    },
    {
      id: 'mesh',
      title: '5G Urban Mesh Gateways',
      online: healthData?.meshNodes?.online || 58,
      total: healthData?.meshNodes?.total || 58,
      percentage: healthData?.meshNodes?.percentage || 100.0,
      icon: Wifi,
      color: 'emerald',
    },
  ]

  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              IoT Hardware & Sensor Network Diagnostics
            </h3>
            <p className="text-xs text-slate-400">Telemetry polling every 1000ms across urban infrastructure</p>
          </div>
        </div>

        <Badge variant="emerald" size="sm" showDot>
          99.4% HEALTHY
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {devices.map((dev) => {
          const Icon = dev.icon
          const isFull = dev.online === dev.total

          return (
            <div
              key={dev.id}
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">{dev.title}</div>
                  <div className="text-[11px] font-mono text-slate-400">
                    {dev.online} / {dev.total} Online
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div
                  className={`text-sm font-bold font-mono ${
                    dev.percentage > 98 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {dev.percentage}%
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {isFull ? 'NOMINAL' : `${dev.total - dev.online} offline`}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

