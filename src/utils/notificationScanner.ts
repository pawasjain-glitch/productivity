import { parseISO, differenceInMinutes, isToday, isTomorrow, isThisWeek, isPast } from 'date-fns'
import type { AnyItem, SectionType } from '../types'

export type UrgencyType = 'meeting' | 'deadline' | 'followup' | 'task' | 'overdue'

export type TimeBucket = 'now' | 'today' | 'tomorrow' | 'week' | 'overdue'

export interface NotificationItem {
  id: string          // unique: itemId + trigger key
  itemId: string
  title: string
  subtitle: string
  section: SectionType
  projectId: string
  projectName: string
  urgency: UrgencyType
  minutesLeft: number  // negative = overdue
  bucket: TimeBucket
  date?: string        // ISO date for display
}

export function typeToSection(type: string): SectionType {
  const map: Record<string, SectionType> = {
    todo: 'todos', task: 'tasks', followup: 'followups',
    conversation: 'conversations', idea: 'ideas', management: 'management',
    meeting: 'meetings', note: 'notes',
  }
  return map[type] || 'todos'
}

function bucket(mins: number, isOverdue: boolean): TimeBucket {
  if (isOverdue) return 'overdue'
  if (mins >= 0 && mins <= 15) return 'now'
  if (mins <= 24 * 60) return 'today'
  if (mins <= 48 * 60) return 'tomorrow'
  return 'week'
}

export function scanAllNotifications(
  items: AnyItem[],
  projects: { id: string; name: string }[],
  windowDays = 7
): NotificationItem[] {
  const now = new Date()
  const maxMins = windowDays * 24 * 60
  const results: NotificationItem[] = []

  for (const item of items) {
    const project = projects.find(p => item.projectIds.includes(p.id))
    if (!project) continue

    // ── Meetings ──────────────────────────────────────────────────
    if (item.type === 'meeting' && item.status === 'upcoming' && item.startTime) {
      const start = parseISO(item.startTime)
      const mins = differenceInMinutes(start, now)
      if (mins >= -60 && mins <= maxMins) {
        const overdue = mins < 0
        results.push({
          id: `${item.id}_meeting`,
          itemId: item.id,
          section: 'meetings',
          projectId: project.id,
          projectName: project.name,
          urgency: 'meeting',
          title: item.title,
          subtitle: overdue
            ? `Started ${Math.abs(mins)} min ago`
            : mins === 0 ? 'Starting now'
            : mins <= 15 ? `Starts in ${mins} min`
            : isToday(start) ? `Today · ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : isTomorrow(start) ? `Tomorrow · ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : start.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) + ' · ' + start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          minutesLeft: mins,
          bucket: bucket(mins, overdue),
          date: item.startTime,
        })
      }
    }

    // ── Tasks ──────────────────────────────────────────────────────
    if (item.type === 'task' && item.status !== 'done') {
      if (item.status === 'blocked') {
        results.push({
          id: `${item.id}_blocked`,
          itemId: item.id,
          section: 'tasks',
          projectId: project.id,
          projectName: project.name,
          urgency: 'task',
          title: item.title,
          subtitle: 'Task is blocked — needs attention',
          minutesLeft: 0,
          bucket: 'today',
        })
      } else if (item.dueDate) {
        const due = parseISO(item.dueDate)
        const mins = differenceInMinutes(due, now)
        const overdue = isPast(due)
        if (mins <= maxMins) {
          results.push({
            id: `${item.id}_task`,
            itemId: item.id,
            section: 'tasks',
            projectId: project.id,
            projectName: project.name,
            urgency: overdue ? 'overdue' : 'deadline',
            title: item.title,
            subtitle: overdue
              ? `Overdue by ${Math.abs(Math.ceil(mins / 60 / 24))} day${Math.abs(Math.ceil(mins / 60 / 24)) !== 1 ? 's' : ''}`
              : isToday(due) ? 'Due today'
              : isTomorrow(due) ? 'Due tomorrow'
              : `Due ${due.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}`,
            minutesLeft: mins,
            bucket: bucket(mins, overdue),
            date: item.dueDate,
          })
        }
      }
    }

    // ── To-Dos ────────────────────────────────────────────────────
    if (item.type === 'todo' && !item.completed && item.dueDate) {
      const due = parseISO(item.dueDate)
      const mins = differenceInMinutes(due, now)
      const overdue = isPast(due)
      if (mins <= maxMins || overdue) {
        results.push({
          id: `${item.id}_todo`,
          itemId: item.id,
          section: 'todos',
          projectId: project.id,
          projectName: project.name,
          urgency: overdue ? 'overdue' : 'deadline',
          title: item.text,
          subtitle: overdue
            ? `Overdue by ${Math.abs(Math.ceil(mins / 60 / 24))} day${Math.abs(Math.ceil(mins / 60 / 24)) !== 1 ? 's' : ''}`
            : isToday(due) ? 'Due today'
            : isTomorrow(due) ? 'Due tomorrow'
            : `Due ${due.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}`,
          minutesLeft: mins,
          bucket: bucket(mins, overdue),
          date: item.dueDate,
        })
      }
    }

    // ── Follow-ups ────────────────────────────────────────────────
    if (item.type === 'followup' && item.status === 'pending' && item.dueDate) {
      const due = parseISO(item.dueDate)
      const mins = differenceInMinutes(due, now)
      const overdue = isPast(due)
      if (mins <= maxMins || overdue) {
        results.push({
          id: `${item.id}_followup`,
          itemId: item.id,
          section: 'followups',
          projectId: project.id,
          projectName: project.name,
          urgency: overdue ? 'overdue' : 'followup',
          title: item.title,
          subtitle: overdue
            ? `Overdue — follow up with ${item.contact}`
            : `Follow up with ${item.contact} · ${isToday(due) ? 'today' : isTomorrow(due) ? 'tomorrow' : due.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}`,
          minutesLeft: mins,
          bucket: bucket(mins, overdue),
          date: item.dueDate,
        })
      }
    }
  }

  // Sort: overdue → now → today → tomorrow → week; within group by time
  const bucketOrder: Record<TimeBucket, number> = { overdue: 0, now: 1, today: 2, tomorrow: 3, week: 4 }
  return results.sort((a, b) => {
    const bo = bucketOrder[a.bucket] - bucketOrder[b.bucket]
    if (bo !== 0) return bo
    return a.minutesLeft - b.minutesLeft
  })
}
