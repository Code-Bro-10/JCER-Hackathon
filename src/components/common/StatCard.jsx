import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'

export default function StatCard({
  title,
  value,
  unit = '',
  change,
  changeLabel = 'vs last hour',
  icon: Icon,
  trend = 'up', // 'up' | 'down' | 'neutral'
  color = 'cyan', // 'cyan' | 'rose' | 'amber' | 'emerald' | 'blue'
  sparklineData = null,
  description = null,
  badge = null,
  onClick,
}) {
  const colorSchemes = {
    cyan: {
      accent: 'border-cyan-500/40 text-cyan-400',
      glow: 'shadow-cyan-500/10',
      iconBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
      chartFill: '#06b6d4',
      badgeBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
    },
    rose: {
      accent: 'border-rose-500/40 text-rose-400',
      glow: 'shadow-rose-500/10',
      iconBg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
      chartFill: '#f43f5e',
      badgeBg: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    },
    amber: {
      accent: 'border-amber-500/40 text-amber-400',
      glow: 'shadow-amber-500/10',
      iconBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      chartFill: '#f59e0b',
      badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    },
    emerald: {
      accent: 'border-emerald-500/40 text-emerald-400',
      glow: 'shadow-emerald-500/10',
      iconBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      chartFill: '#10b981',
      badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    },
    blue: {
      accent: 'border-blue-500/40 text-blue-400',
      glow: 'shadow-blue-500/10',
      iconBg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
      chartFill: '#3b82f6',
      badgeBg: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    },
  }

  const theme = colorSchemes[color] || colorSchemes.cyan

  // In traffic, speed going UP is good (green), but congestion going UP is bad (red)
  const isPositiveTrend = trend === 'up'
  const isNegativeTrend = trend === 'down'

  // Default dummy sparkline if not provided
  const chartData = sparklineData || [
    { v: 30 }, { v: 42 }, { v: 38 }, { v: 55 }, { v: 48 }, { v: 62 }, { v: 58 }, { v: 65 }
  ]

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl bg-slate-900/70 border border-slate-800/80 p-4 transition-all duration-300 hover:border-slate-700 hover:shadow-lg ${theme.glow} ${
        onClick ? 'cursor-pointer hover:scale-[1.01]' : ''
      }`}
    >
      {/* Top accent glow line */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-current to-transparent opacity-40 ${theme.accent}`} />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</span>
            {badge && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${theme.badgeBg}`}>
                {badge}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">{value}</span>
            {unit && <span className="text-xs font-semibold text-slate-400">{unit}</span>}
          </div>
        </div>

        {Icon && (
          <div className={`p-2.5 rounded-lg border ${theme.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Sparkline & Trend footer */}
      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/60">
        {change !== undefined && change !== null ? (
          <div className="flex items-center gap-1.5 text-xs">
            {isPositiveTrend ? (
              <span className="inline-flex items-center text-emerald-400 font-medium">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                {change > 0 ? `+${change}%` : `${change}%`}
              </span>
            ) : isNegativeTrend ? (
              <span className="inline-flex items-center text-rose-400 font-medium">
                <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                {change}%
              </span>
            ) : (
              <span className="inline-flex items-center text-slate-400 font-medium">
                <Minus className="w-3.5 h-3.5 mr-0.5" />
                {change}%
              </span>
            )}
            <span className="text-[11px] text-slate-500">{changeLabel}</span>
          </div>
        ) : description ? (
          <span className="text-[11px] text-slate-400">{description}</span>
        ) : (
          <div />
        )}

        {/* Mini sparkline */}
        <div className="w-16 h-7">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`grad-${color}-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.chartFill} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={theme.chartFill} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={theme.chartFill}
                strokeWidth={1.5}
                fill={`url(#grad-${color}-${title})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

