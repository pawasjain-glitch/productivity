import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import { X, Bell, Calendar, Briefcase, AlertCircle } from './icons'
import { scanAllNotifications } from '../utils/notificationScanner'
import type { NotificationItem } from '../utils/notificationScanner'

const SHOWN_KEY = 'workspace_shown_reminders'

function loadShown(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SHOWN_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch { return new Set() }
}
function saveShown(set: Set<string>) {
  try { sessionStorage.setItem(SHOWN_KEY, JSON.stringify([...set])) } catch {}
}

const URGENCY_STYLES = {
  meeting:  { bg: 'bg-blue-500/15 border-blue-500/25',      icon: Calendar,     iconColor: 'text-blue-400',   bar: 'bg-blue-500' },
  deadline: { bg: 'bg-rose-500/15 border-rose-500/25',      icon: AlertCircle,  iconColor: 'text-rose-400',   bar: 'bg-rose-500' },
  followup: { bg: 'bg-orange-500/15 border-orange-500/25',  icon: Bell,         iconColor: 'text-orange-400', bar: 'bg-orange-500' },
  task:     { bg: 'bg-purple-500/15 border-purple-500/25',  icon: Briefcase,    iconColor: 'text-purple-400', bar: 'bg-purple-500' },
  overdue:  { bg: 'bg-red-500/15 border-red-500/25',        icon: AlertCircle,  iconColor: 'text-red-400',    bar: 'bg-red-500' },
}

export default function ReminderNotifications() {
  const { items, projects, setActiveProject, setActiveSection } = useStore()
  const [queue, setQueue] = useState<NotificationItem[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const shownRef = useRef<Set<string>>(loadShown())

  useEffect(() => {
    function tick() {
      // Only surface items in the "now" bucket (≤15 min) as toast popups
      const all = scanAllNotifications(items, projects, 1)
      const toShow = all.filter(n => n.bucket === 'now' && !shownRef.current.has(n.id))
      if (toShow.length > 0) {
        setQueue(prev => {
          const existingIds = new Set(prev.map(r => r.id))
          const fresh = toShow.filter(r => !existingIds.has(r.id))
          return [...prev, ...fresh].slice(-5)
        })
      }
    }
    tick()
    const interval = setInterval(tick, 60_000)
    return () => clearInterval(interval)
  }, [items, projects])

  const dismiss = (id: string) => {
    shownRef.current.add(id)
    saveShown(shownRef.current)
    setDismissed(prev => new Set([...prev, id]))
    setTimeout(() => {
      setQueue(prev => prev.filter(r => r.id !== id))
    }, 300)
  }

  const navigate = (n: NotificationItem) => {
    const project = projects.find(p => p.id === n.projectId)
    if (project) {
      setActiveProject(project.id)
      setActiveSection(n.section)
    }
    dismiss(n.id)
  }

  const visible = queue.filter(r => !dismissed.has(r.id))
  if (visible.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {visible.map((reminder) => {
        const style = URGENCY_STYLES[reminder.urgency]
        const Icon = style.icon
        return (
          <div
            key={reminder.id}
            className={`pointer-events-auto rounded-2xl border ${style.bg} backdrop-blur-md shadow-2xl overflow-hidden animate-slide-in`}
          >
            <div className={`h-0.5 w-full ${style.bar} opacity-60`} />
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${style.bg}`}>
                  <Icon size={15} className={style.iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-0.5">{reminder.projectName}</p>
                      <p className="text-sm font-semibold text-white leading-snug truncate">{reminder.title}</p>
                      <p className={`text-xs mt-0.5 font-medium ${style.iconColor}`}>{reminder.subtitle}</p>
                    </div>
                    <button
                      onClick={() => dismiss(reminder.id)}
                      className="text-gray-600 hover:text-gray-300 transition-colors flex-shrink-0 mt-0.5"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => navigate(reminder)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${style.iconColor} bg-white/5 hover:bg-white/10`}
                    >
                      View →
                    </button>
                    <button
                      onClick={() => dismiss(reminder.id)}
                      className="flex-1 py-1.5 text-xs font-medium rounded-lg text-gray-500 bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
