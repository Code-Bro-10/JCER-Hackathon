import React from 'react'

const VARIANT_MAP = {
  critical: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  rose: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  high: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  yellow: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  low: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  slate: 'bg-slate-800 text-slate-300 border-slate-700',
}

const DOT_MAP = {
  critical: 'bg-rose-500',
  rose: 'bg-rose-500',
  high: 'bg-amber-500',
  amber: 'bg-amber-500',
  medium: 'bg-yellow-500',
  yellow: 'bg-yellow-500',
  low: 'bg-cyan-500',
  cyan: 'bg-cyan-500',
  emerald: 'bg-emerald-500',
  success: 'bg-emerald-500',
  purple: 'bg-purple-500',
  blue: 'bg-blue-500',
  slate: 'bg-slate-400',
}

export default function Badge({
  children,
  variant = 'slate',
  showDot = false,
  pulseDot = false,
  className = '',
  size = 'md',
}) {
  const v = variant.toLowerCase()
  const colorClass = VARIANT_MAP[v] || VARIANT_MAP.slate
  const dotColor = DOT_MAP[v] || DOT_MAP.slate

  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1 font-medium'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${colorClass} ${sizeClass} tracking-wide transition-all ${className}`}
    >
      {showDot && (
        <span className="relative flex h-2 w-2">
          {pulseDot && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
        </span>
      )}
      {children}
    </span>
  )
}

