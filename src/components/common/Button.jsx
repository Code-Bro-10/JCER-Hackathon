import React from 'react'
import { Loader2 } from 'lucide-react'
import { sounds } from '../../services/soundEffects'

export default function Button({
  children,
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  onClick,
  className = '',
  type = 'button',
  ...props
}) {
  const handleClick = (e) => {
    if (disabled || loading) return
    sounds.playClick()
    if (onClick) onClick(e)
  }

  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 select-none rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
    icon: 'p-2 rounded-lg',
  }

  const variantStyles = {
    primary:
      'bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold shadow-lg shadow-cyan-500/25 border border-cyan-400/40 hover:shadow-cyan-500/40 focus:ring-cyan-400 active:scale-[0.98]',
    secondary:
      'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 hover:border-slate-600 focus:ring-slate-500 backdrop-blur active:scale-[0.98]',
    danger:
      'bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-lg shadow-rose-600/30 border border-rose-500/50 hover:shadow-rose-600/50 focus:ring-rose-500 active:scale-[0.98]',
    warning:
      'bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-lg shadow-amber-600/30 border border-amber-500/50 focus:ring-amber-500 active:scale-[0.98]',
    success:
      'bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/30 border border-emerald-500/50 focus:ring-emerald-500 active:scale-[0.98]',
    outline:
      'border border-slate-700 hover:border-cyan-500/60 text-slate-300 hover:text-cyan-400 bg-transparent hover:bg-cyan-500/5 active:scale-[0.98]',
    ghost:
      'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 bg-transparent active:scale-[0.98]',
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={handleClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {size !== 'icon' && <span>Processing...</span>}
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 flex-shrink-0" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 flex-shrink-0" />}
        </>
      )}
    </button>
  )
}

