import { useEffect, useRef, useState, useCallback } from 'react'
import { useStore } from '../store/useStore'
import { Bell, X, Calendar, Briefcase, CheckSquare, AlertCircle, Clock, ChevronRight } from './icons'
import { scanAllNotifications } from '../utils/notificationScanner'
import type { NotificationItem, TimeBucket } from '../utils/notificationScanner'

const DISMISSED_KEY = 'workspace_nc_dismissed'

function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch { return new Set() }
}
function saveDismissed(s: Set<string>) {
  try { localStorage.setItem(DISMISSED_KEY, JSON.stringify([...s])) } catch {}
}

const URGENCY = {
  meeting:  { iconComp: Calendar,      color: 'text-blue-400',   dot: 'bg-blue-400',   badge: 'bg-blue-500/15 border-blue-500/25',   label: 'Meeting' },
  deadline: { iconComp: AlertCircle,   color: 'text-rose-400',   dot: 'bg-rose-400',   badge: 'bg-rose-500/15 border-rose-500/25',   label: 'Deadline' },
  followup: { iconComp: Bell,          color: 'text-orange-400', dot: 'bg-orange-400', badge: 'bg-orange-500/15 border-orange-500/25', label: 'Follow-up' },
  task:     { iconComp: Briefcase,     color: 'text-purple-400', dot: 'bg-purple-400', badge: 'bg-purple-500/15 border-purple-500/25', label: 'Task' },
  overdue:  { iconComp: AlertCircle,   color: 'text-red-400',    dot: 'bg-red-400',    badge: 'bg-red-500/15 border-red-500/25',      label: 'Overdue' },
}

const BUCKET_LABELS: Record<TimeBucket, { label: string; color: string }> = {
  overdue:  { label: 'Overdue',        color: 'text-red-400' },
  now:      { label: '⚡ Right Now',   color: 'text-amber-400' },
  today:    { label: 'Today',          color: 'text-blue-400' },
  tomorrow: { label: 'Tomorrow',       color: 'text-purple-400' },
  week:     { label: 'This Week',      color: 'text-gray-400' },
}

interface Props {
  onClose: () => void
}

export default function NotificationCentre({ onClose }: Props) {
  const { items, projects, setActiveProject, setActiveSection } = useStore()
  const [dismissed, setDismissed] = useState<Set<string>>(loadDismissed)
  const [all, setAll] = useState<NotificationItem[]>([])
  const panelRef = useRef<HTMLDivElement>(null)

  // Rescan every 60s
  const rescan = useCallback(() => {
    setAll(scanAllNotifications(items, projects, 7))
  }, [items, projects])

  useEffect(() => {
    rescan()
    const t = setInterval(rescan, 60_000)
    return () => clearInterval(t)
  }, [rescan])

  // Click outside to close
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const dismiss = (id: string) => {
    const next = new Set([...dismissed, id])
    setDismissed(next)
    saveDismissed(next)
  }

  const dismissAll = () => {
    const next = new Set([...dismissed, ...all.map(n => n.id)])
    setDismissed(next)
    saveDismissed(next)
  }

  const navigate = (n: NotificationItem) => {
    setActiveProject(n.projectId)
    setActiveSection(n.section)
    onClose()
  }

  const visible = all.filter(n => !dismissed.has(n.id))

  // Group by bucket
  const groups = (['overdue', 'now', 'today', 'tomorrow', 'week'] as TimeBucket[]).reduce<
    Record<TimeBucket, NotificationItem[]>
  >((acc, b) => {
    acc[b] = visible.filter(n => n.bucket === b)
    return acc
  }, { overdue: [], now: [], today: [], tomorrow: [], week: [] })

  return (
    <div
      ref={panelRef}
      className="fixed right-4 w-[380px] bg-gray-900 border border-white/15 rounded-2xl shadow-2xl shadow-black/50 z-[200] overflow-hidden flex flex-col animate-slide-in"
      style={{ top: '56px', maxHeight: 'calc(100vh - 68px)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-indigo-400" />
          <span className="text-sm font-semibold text-white">Notification Centre</span>
          {visible.length > 0 && (
            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {visible.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {visible.length > 0 && (
            <button
              onClick={dismissAll}
              className="text-[11px] text-gray-500 hover:text-gray-300 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              Clear all
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-gray-600 hover:text-gray-300 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="overflow-y-auto flex-1 py-1">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
              <CheckSquare size={22} className="text-gray-600" />
            </div>
            <p className="text-gray-400 font-medium text-sm">All clear!</p>
            <p className="text-gray-600 text-xs mt-1">No upcoming deadlines or meetings in the next 7 days.</p>
          </div>
        ) : (
          (['overdue', 'now', 'today', 'tomorrow', 'week'] as TimeBucket[]).map(b => {
            const group = groups[b]
            if (group.length === 0) return null
            const { label, color } = BUCKET_LABELS[b]
            return (
              <div key={b}>
                {/* Bucket label */}
                <div className={`flex items-center gap-2 px-4 pt-3 pb-1`}>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${color}`}>{label}</span>
                  <span className={`text-[10px] font-semibold opacity-50 ${color}`}>{group.length}</span>
                  <div className="flex-1 h-px bg-white/5 ml-1" />
                </div>

                {/* Items */}
                {group.map(n => {
                  const u = URGENCY[n.urgency]
                  const Icon = u.iconComp
                  return (
                    <div
                      key={n.id}
                      className="mx-2 mb-1 rounded-xl border border-white/5 hover:border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all group"
                    >
                      <div className="flex items-start gap-3 p-3">
                        {/* Icon */}
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${u.badge} border`}>
                          <Icon size={13} className={u.color} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <div className="min-w-0">
                              <p className="text-xs text-gray-500 mb-0.5 truncate">{n.projectName}</p>
                              <p className="text-sm font-medium text-gray-200 leading-snug line-clamp-2">{n.title}</p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${u.dot}`} />
                                <p className={`text-xs font-medium ${u.color}`}>{n.subtitle}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => dismiss(n.id)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-600 hover:text-gray-400 transition-all flex-shrink-0 mt-0.5"
                            >
                              <X size={12} />
                            </button>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1.5 mt-2.5">
                            <button
                              onClick={() => navigate(n)}
                              className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg ${u.badge} border ${u.color} hover:opacity-90 transition-opacity`}
                            >
                              View
                              <ChevronRight size={10} />
                            </button>
                            <button
                              onClick={() => dismiss(n.id)}
                              className="text-[11px] font-medium px-2.5 py-1 rounded-lg text-gray-600 hover:text-gray-400 hover:bg-white/5 transition-colors"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      {all.length > 0 && dismissed.size > 0 && (
        <div className="border-t border-white/5 px-4 py-2 flex-shrink-0">
          <button
            onClick={() => {
              const next = new Set<string>()
              setDismissed(next)
              saveDismissed(next)
            }}
            className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors"
          >
            Restore {dismissed.size} dismissed notification{dismissed.size !== 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  )
}

// Hook to get unread count for the badge
export function useNotificationCount(): number {
  const { items, projects } = useStore()
  const [count, setCount] = useState(0)

  useEffect(() => {
    const dismissed = loadDismissed()
    const all = scanAllNotifications(items, projects, 7)
    setCount(all.filter(n => !dismissed.has(n.id)).length)

    const t = setInterval(() => {
      const d = loadDismissed()
      const a = scanAllNotifications(items, projects, 7)
      setCount(a.filter(n => !d.has(n.id)).length)
    }, 60_000)
    return () => clearInterval(t)
  }, [items, projects])

  return count
}
