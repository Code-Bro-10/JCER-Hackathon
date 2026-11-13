/**
 * Formatting utility functions for TrafficAI
 */

export function formatNumber(num) {
  if (num === undefined || num === null) return '0'
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatCompactNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return String(num)
}

export function formatPercent(val, showSign = true) {
  const sign = showSign && val > 0 ? '+' : ''
  return `${sign}${val.toFixed(1)}%`
}

export function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Just now'
  const date = typeof timestamp === 'string' || typeof timestamp === 'number' ? new Date(timestamp) : timestamp
  const now = new Date()
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return `${Math.floor(diffHr / 24)}d ago`
}

export function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) return `${secs}s`
  return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`
}

export function getCongestionColor(level) {
  if (level > 75) return 'text-rose-400'
  if (level > 50) return 'text-amber-400'
  if (level > 25) return 'text-yellow-400'
  return 'text-emerald-400'
}

export function getCongestionBadgeClass(level) {
  if (level > 75) return 'bg-rose-500/20 text-rose-300 border-rose-500/40'
  if (level > 50) return 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  if (level > 25) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
  return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
}

