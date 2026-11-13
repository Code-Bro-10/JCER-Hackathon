import React from 'react'
import { ShieldCheck, Clock, Zap } from 'lucide-react'

export default function SignalPreemptLog() {
  const auditLogs = [
    { id: 'LOG-881', controller: 'INT-101 (Grand Central & 5th)', action: 'Green Wave Hold Engaged', duration: '90s', unit: 'MED-12', timestamp: '5m ago', status: 'Preempted' },
    { id: 'LOG-882', controller: 'INT-103 (Financial Way & Metro)', action: 'Pedestrian Scramble Suspended', duration: '60s', unit: 'MED-12', timestamp: '4m ago', status: 'Preempted' },
    { id: 'LOG-883', controller: 'INT-102 (Port Blvd & Marina Bridge)', action: 'Phase Extended +35s', duration: '35s', unit: 'TOW-88', timestamp: '18m ago', status: 'Completed' },
    { id: 'LOG-884', controller: 'INT-104 (Tech Parkway & Loop)', action: 'Coordinated Green Pulse', duration: '45s', unit: 'DRONE-ALPHA', timestamp: '42m ago', status: 'Completed' },
  ]

  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white tracking-tight">
            Signal Preemption Audit Log
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-400">Hardware Controller Commands</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
              <th className="pb-3 pr-4">Log ID</th>
              <th className="pb-3 px-3">Intersection Node</th>
              <th className="pb-3 px-3">Preemption Command</th>
              <th className="pb-3 px-3">Duration</th>
              <th className="pb-3 px-3">Assigned Unit</th>
              <th className="pb-3 px-3">Time</th>
              <th className="pb-3 pl-3">Hardware State</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {auditLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3 pr-4 font-bold text-cyan-400">{log.id}</td>
                <td className="py-3 px-3 text-white font-sans font-medium">{log.controller}</td>
                <td className="py-3 px-3 text-slate-300 font-sans">{log.action}</td>
                <td className="py-3 px-3 text-slate-400">{log.duration}</td>
                <td className="py-3 px-3 text-rose-300 font-bold">{log.unit}</td>
                <td className="py-3 px-3 text-slate-500">{log.timestamp}</td>
                <td className="py-3 pl-3">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      log.status === 'Preempted'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

