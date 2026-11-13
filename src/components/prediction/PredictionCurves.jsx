import React, { useState } from 'react'
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts'
import { BrainCircuit, Clock, Zap, TrendingUp, Sparkles } from 'lucide-react'
import Badge from '../common/Badge'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md text-xs font-mono space-y-1">
        <div className="font-bold text-white text-sm pb-1 border-b border-slate-800 flex items-center justify-between">
          <span>Time: {label}</span>
          <span className="text-[10px] text-cyan-400 font-sans">ML Horizon</span>
        </div>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4">
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="font-bold text-white">
              {entry.value !== null ? `${entry.value.toLocaleString()} veh/hr` : 'Inference pending'}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function PredictionCurves({ data, modelInfo }) {
  const [viewMetric, setViewMetric] = useState('volume') // 'volume' | 'congestion'
  const [showCapacityLine, setShowCapacityLine] = useState(true)

  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 flex flex-col">
      {/* Header with Model Confidence */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                24-Hour Predictive Flow Forecasting
              </h3>
              <Badge variant="purple" size="sm">
                LSTM + Graph NN
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Model: <span className="text-purple-300 font-mono">{modelInfo?.name || 'UrbanSpatialGraph-v4'}</span> |
              Confidence: <span className="text-emerald-400 font-bold font-mono">{modelInfo?.confidence || 96.4}%</span>
            </p>
          </div>
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMetric('volume')}
              className={`px-3 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                viewMetric === 'volume' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Vehicle Flow
            </button>
            <button
              type="button"
              onClick={() => setViewMetric('congestion')}
              className={`px-3 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                viewMetric === 'congestion' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Congestion Index
            </button>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="mt-6 w-full h-80 sm:h-96">
        <ResponsiveContainer width="100%" height="100%">
          {viewMetric === 'volume' ? (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c084fc" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#c084fc" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                domain={[0, 65000]}
                tickFormatter={(v) => `${v / 1000}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(val) => <span className="text-xs text-slate-300 mr-4">{val}</span>}
              />
              {showCapacityLine && (
                <ReferenceLine
                  y={55000}
                  label={{ value: 'Grid Capacity Threshold (55k)', fill: '#f43f5e', fontSize: 11, position: 'top' }}
                  stroke="#f43f5e"
                  strokeDasharray="4 4"
                />
              )}
              <Area
                type="monotone"
                dataKey="actual"
                name="Actual Recorded Flow"
                stroke="#06b6d4"
                strokeWidth={2}
                fill="url(#actualGrad)"
              />
              <Area
                type="monotone"
                dataKey="predicted"
                name="AI Predicted Baseline"
                stroke="#c084fc"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#predGrad)"
              />
              <Area
                type="monotone"
                dataKey="aiOptimized"
                name="AI Optimized Dynamic Routing"
                stroke="#34d399"
                strokeWidth={2}
                fill="url(#aiGrad)"
              />
            </AreaChart>
          ) : (
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" domain={[0, 100]} />
              <Tooltip />
              <Legend verticalAlign="top" height={36} />
              <ReferenceLine y={80} stroke="#f43f5e" strokeDasharray="3 3" label="Severe Gridlock (80%)" />
              <Line
                type="monotone"
                dataKey="congestion"
                name="Congestion Index %"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ fill: '#f59e0b', r: 3 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Model Insight footer */}
      <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>
            AI Dynamic Routing avoids peak saturation between <strong>16:00 - 18:30</strong> by dispersing 18% of traffic onto arterial bypasses.
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
          <span>Trained on 48.2M sensor hours</span>
          <span>•</span>
          <span>Inference: 14ms</span>
        </div>
      </div>
    </div>
  )
}

