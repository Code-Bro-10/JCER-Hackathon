import React, { useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Bar,
  ComposedChart,
  Line,
} from 'recharts'
import { BarChart3, TrendingUp, Calendar, Download } from 'lucide-react'
import Badge from '../common/Badge'
import Button from '../common/Button'

export default function CorridorThroughputChart({ dailyData = [] }) {
  const [activeRange, setActiveRange] = useState('7d') // '24h' | '7d' | '30d'

  const handleExportData = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Day,Volume,CO2_Avoided_Tons,Avg_Speed_Kmh,Incidents']
        .concat(
          dailyData.map((d) => `${d.day},${d.volume},${d.co2Avoided},${d.avgSpeed},${d.incidentCount}`)
        )
        .join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `traffic_throughput_${activeRange}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Metropolitan Corridor Vehicle Volume & Speed
              </h3>
              <Badge variant="cyan" size="sm">
                AUDITED
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Aggregated throughput from 428 computer vision nodes & induction loop detectors
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range picker */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            {['24h', '7d', '30d'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setActiveRange(r)}
                className={`px-2.5 py-1 rounded-lg uppercase cursor-pointer transition-colors ${
                  activeRange === r ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={handleExportData}
            className="text-xs"
          >
            Export CSV
          </Button>
        </div>
      </div>

      <div className="mt-6 w-full h-80 sm:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="day" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis
              yAxisId="left"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickFormatter={(v) => `${v / 1000}k`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              unit=" km/h"
              domain={[30, 70]}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md text-xs font-mono space-y-1">
                      <div className="font-bold text-white text-sm pb-1 border-b border-slate-800">
                        {label} Telemetry
                      </div>
                      <div className="text-cyan-400">
                        Daily Flow: {payload[0]?.value?.toLocaleString()} vehicles
                      </div>
                      <div className="text-emerald-400">
                        Average Speed: {payload[1]?.value} km/h
                      </div>
                      <div className="text-amber-400">
                        Reported Incidents: {payload[0]?.payload?.incidentCount}
                      </div>
                      <div className="text-teal-300">
                        CO₂ Avoided: {payload[0]?.payload?.co2Avoided} tons
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend verticalAlign="top" height={36} />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="volume"
              name="Vehicle Count"
              stroke="#06b6d4"
              strokeWidth={2}
              fill="url(#volumeGrad)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avgSpeed"
              name="Average Speed (km/h)"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ fill: '#10b981', r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 font-mono">
        <span>WEEKLY AGGREGATE: 4,450,000 VEHICLES</span>
        <span>PEAK FLOW DAY: FRIDAY (760,000 VEHICLES)</span>
        <span className="text-emerald-400">NET EFFICIENCY: +14.2%</span>
      </div>
    </div>
  )
}

