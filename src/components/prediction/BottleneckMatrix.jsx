import React from 'react'
import { AlertOctagon, Clock } from 'lucide-react'

export default function BottleneckMatrix({ bottlenecks = [] }) {
  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 flex flex-col">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Predicted Bottleneck Risk Matrix
            </h3>
            <p className="text-xs text-slate-400">Ranked by volume-to-capacity ratio and spillback danger</p>
          </div>
        </div>
        <span className="text-xs font-mono text-slate-400">Top Critical Choke Points</span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
              <th className="pb-3 pr-4">Intersection / Corridor</th>
              <th className="pb-3 px-3">Sector</th>
              <th className="pb-3 px-3">Peak Window</th>
              <th className="pb-3 px-3">V/C Ratio</th>
              <th className="pb-3 px-3">Est. Queue</th>
              <th className="pb-3 pl-3">AI Mitigation Strategy</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {bottlenecks.map((item) => {
              const isSevere = item.riskScore > 80
              const isModerate = item.riskScore > 65

              return (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 pr-4">
                    <div className="font-bold text-white text-sm">{item.intersection}</div>
                    <div className="text-[10px] font-mono text-cyan-400">{item.id}</div>
                  </td>
                  <td className="py-3.5 px-3 text-slate-300 whitespace-nowrap">{item.sector}</td>
                  <td className="py-3.5 px-3 whitespace-nowrap font-mono text-amber-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.peakHour}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap font-mono">
                    <span
                      className={`font-bold ${
                        isSevere ? 'text-rose-400' : isModerate ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {item.currentVCRatio}
                    </span>
                    <span className="text-slate-500 text-[10px] ml-1">({item.riskScore}% risk)</span>
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap font-mono text-slate-300">
                    {item.predictedQueueMeters}m
                  </td>
                  <td className="py-3.5 pl-3">
                    <div className="text-slate-300 text-xs font-medium">{item.mitigationStrategy}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{item.impact}</div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
