import React from 'react'
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react'
import { useTraffic } from '../../context/TrafficContext'

export default function NotificationToast() {
  const { toasts, removeToast } = useTraffic()

  if (!toasts || toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const isDanger = toast.type === 'danger' || toast.type === 'critical'
        const isSuccess = toast.type === 'success'
        const isWarning = toast.type === 'warning'

        const bgClass = isDanger
          ? 'bg-rose-950/90 border-rose-500/60 text-rose-200'
          : isSuccess
          ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-200'
          : isWarning
          ? 'bg-amber-950/90 border-amber-500/60 text-amber-200'
          : 'bg-slate-900/90 border-cyan-500/60 text-slate-200'

        const Icon = isDanger
          ? AlertCircle
          : isSuccess
          ? CheckCircle2
          : isWarning
          ? AlertTriangle
          : Info

        const iconColor = isDanger
          ? 'text-rose-400'
          : isSuccess
          ? 'text-emerald-400'
          : isWarning
          ? 'text-amber-400'
          : 'text-cyan-400'

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl shadow-black/60 transition-all duration-300 animate-in slide-in-from-bottom-3 ${bgClass}`}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-white tracking-tight">{toast.title}</h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

