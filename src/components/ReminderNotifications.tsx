import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import { X, Bell, Calendar, Briefcase, CheckSquare, Clock, AlertCircle } from './icons'
import { parseISO, differenceInMinutes, isToday } from 'date-fns'
import type { AnyItem, SectionType } from '../types'

interface Reminder {
  id: string        // unique per trigger: itemId + bucket
  itemId: string
  title: string
  subtitle: string
  section: SectionType
  projectName: string
  urgency: 'meeting' | 'deadline' | 'followup' | 'task'
  minutesLeft: number
}

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

function typeToSection(type: string): SectionType {
  const map: Record<string, SectionType> = {
    todo: 'todos', task: 'tasks', followup: 'followups',
    conversation: 'conversations', idea: 'ideas', management: 'management',
    meeting: 'meetings', note: 'notes',
  }
  return map[type] || 'todos'
}

function checkItems(items: AnyItem[], projects: { id: string; name: string }[], shown: Set<string>): Reminder[] {
  const now = new Date()
  const results: Reminder[] = []

  for (const item of items) {
    const project = projects.find(p => item.projectIds.includes(p.id))
    if (!project) continue

    // --- Meetings: 15 min before startTime ---
    if (item.type === 'meeting' && item.status === 'upcoming' && item.startTime) {
      const start = parseISO(item.startTime)
      const mins = differenceInMinutes(start, now)
      if (mins >= 0 && mins <= 15) {
        const key = `${item.id}_meeting_15`
        if (!shown.has(key)) {
          results.push({
            id: key, itemId: item.id, section: 'meetings',
            projectName: project.name, urgency: 'meeting',
            title: item.title,
            subtitle: mins === 0 ? 'Starting now' : `Starts in ${mins} min`,
            minutesLeft: mins,
          })
        }
      }
    }

    // --- Tasks: blocked or due today and not done ---
    if (item.type === 'task') {
      if (item.status === 'blocked') {
        const key = `${item.id}_blocked`
        if (!shown.has(key)) {
          results.push({
            id: key, itemId: item.id, section: 'tasks',
            projectName: project.name, urgency: 'task',
            title: item.title,
            subtitle: 'Task is blocked',
            minutesLeft: 0,
          })
        }
      } else if (item.dueDate && item.status !== 'done') {
        const due = parseISO(item.dueDate)
        const mins = differenceInMinutes(due, now)
        if (mins >= 0 && mins <= 15) {
          const key = `${item.id}_task_due`
          if (!shown.has(key)) {
            results.push({
              id: key, itemId: item.id, section: 'tasks',
              projectName: project.name, urgency: 'deadline',
              title: item.title,
              subtitle: mins === 0 ? 'Due now' : `Due in ${mins} min`,
              minutesLeft: mins,
            })
          }
        } else if (isToday(due) && (item.status === 'todo' || item.status === 'in_progress')) {
          const key = `${item.id}_task_today`
          if (!shown.has(key)) {
            results.push({
              id: key, itemId: item.id, section: 'tasks',
              projectName: project.name, urgency: 'deadline',
              title: item.title,
              subtitle: 'Due today',
              minutesLeft: mins,
            })
          }
        }
      }
    }

    // --- To-Dos: due today and not completed ---
    if (item.type === 'todo' && !item.completed && item.dueDate) {
      const due = parseISO(item.dueDate)
      if (isToday(due)) {
        const mins = differenceInMinutes(due, now)
        const key = `${item.id}_todo_today`
        if (!shown.has(key)) {
          results.push({
            id: key, itemId: item.id, section: 'todos',
            projectName: project.name, urgency: 'deadline',
            title: item.text,
            subtitle: mins <= 15 && mins >= 0 ? `Due in ${mins} min` : 'Due today',
            minutesLeft: mins,
          })
        }
      }
    }

    // --- Follow-ups: due today and pending ---
    if (item.type === 'followup' && item.status === 'pending' && item.dueDate) {
      const due = parseISO(item.dueDate)
      if (isToday(due)) {
        const mins = differenceInMinutes(due, now)
        const key = `${item.id}_followup_today`
        if (!shown.has(key)) {
          results.push({
            id: key, itemId: item.id, section: 'followups',
            projectName: project.name, urgency: 'followup',
            title: item.title,
            subtitle: `Follow up with ${item.contact} · due today`,
            minutesLeft: mins,
          })
        }
      }
    }
  }

  // Sort: meetings first, then soonest
  return results.sort((a, b) => {
    if (a.urgency === 'meeting' && b.urgency !== 'meeting') return -1
    if (b.urgency === 'meeting' && a.urgency !== 'meeting') return 1
    return a.minutesLeft - b.minutesLeft
  })
}

const URGENCY_STYLES = {
  meeting:  { bg: 'bg-blue-500/15 border-blue-500/25',  icon: Calendar,      iconColor: 'text-blue-400',   bar: 'bg-blue-500' },
  deadline: { bg: 'bg-rose-500/15 border-rose-500/25',  icon: AlertCircle,   iconColor: 'text-rose-400',   bar: 'bg-rose-500' },
  followup: { bg: 'bg-orange-500/15 border-orange-500/25', icon: Bell,       iconColor: 'text-orange-400', bar: 'bg-orange-500' },
  task:     { bg: 'bg-purple-500/15 border-purple-500/25', icon: Briefcase,  iconColor: 'text-purple-400', bar: 'bg-purple-500' },
}

export default function ReminderNotifications() {
  const { items, projects, setActiveProject, setActiveSection } = useStore()
  const [queue, setQueue] = useState<Reminder[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const shownRef = useRef<Set<string>>(loadShown())

  useEffect(() => {
    function tick() {
      const newReminders = checkItems(items, projects, shownRef.current)
      if (newReminders.length > 0) {
        setQueue(prev => {
          const existingIds = new Set(prev.map(r => r.id))
          const fresh = newReminders.filter(r => !existingIds.has(r.id))
          return [...prev, ...fresh].slice(-5) // max 5 in queue
        })
      }
    }

    tick() // check immediately
    const interval = setInterval(tick, 60_000) // then every minute
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

  const navigate = (reminder: Reminder) => {
    const project = projects.find(p =>
      items.find(i => i.id === reminder.itemId)?.projectIds.includes(p.id)
    )
    if (project) {
      setActiveProject(project.id)
      setActiveSection(reminder.section)
    }
    dismiss(reminder.id)
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
            {/* Colored top bar */}
            <div className={`h-0.5 w-full ${style.bar} opacity-60`} />

            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${style.bg} border ${style.bg.replace('bg-', 'border-')}`}>
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
