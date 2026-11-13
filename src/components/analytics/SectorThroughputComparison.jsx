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
} from 'recharts'
import { Layers } from 'lucide-react'

export default function SectorThroughputComparison({ data = [] }) {
  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Sector Peak-Hour Demand Profiles
            </h3>
            <p className="text-xs text-slate-400">Morning (08:00) vs Evening (17:30) vs Off-Peak flow (veh/hr)</p>
          </div>
        </div>
      </div>

      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="sector" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                fontSize: '11px',
                color: '#fff',
              }}
            />
            <Legend verticalAlign="top" height={36} />
            <Bar dataKey="morning" name="Morning Commute (veh/h)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            <Bar dataKey="evening" name="Evening Commute (veh/h)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="offpeak" name="Midday Off-Peak (veh/h)" fill="#334155" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

