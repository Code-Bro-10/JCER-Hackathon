import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts'
import { BarChart3, Activity } from 'lucide-react'
import { useTraffic } from '../../context/TrafficContext'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-xl backdrop-blur-md text-xs font-mono">
        <div className="font-bold text-white text-sm mb-1">{data.name}</div>
        <div className="text-rose-400">Congestion Index: {data.congestion}%</div>
        <div className="text-cyan-400">Average Speed: {data.speed} km/h</div>
        <div className="text-slate-400">Active Vehicles: {data.vehicles.toLocaleString()}</div>
        <div className="text-emerald-400">Flow Rate: {data.flowRate} veh/hr</div>
      </div>
    )
  }
  return null
}

export default function SectorCongestionChart() {
  const { sectors, setActiveSector } = useTraffic()

  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 flex flex-col">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Sector Congestion Index</h3>
            <p className="text-xs text-slate-400">Real-time density breakdown by urban district</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded bg-rose-500" /> &gt;60% Critical
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded bg-amber-500" /> 35-60% Moderate
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> &lt;35% Optimal
          </span>
        </div>
      </div>

      <div className="mt-4 w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sectors}
            margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
            onClick={(state) => {
              if (state && state.activePayload && state.activePayload[0]) {
                setActiveSector(state.activePayload[0].payload.name)
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              interval={0}
              angle={-15}
              textAnchor="end"
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              unit="%"
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="congestion" radius={[6, 6, 0, 0]}>
              {sectors.map((entry, index) => {
                const color =
                  entry.congestion > 60
                    ? '#f43f5e'
                    : entry.congestion > 35
                    ? '#f59e0b'
                    : '#10b981'
                return <Cell key={`cell-${index}`} fill={color} cursor="pointer" />
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

