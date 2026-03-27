import { useStore } from '../../store/useStore'
import { SectionIcon } from '../icons'
import { CheckCircle2, Clock, AlertCircle, Circle } from '../icons'
import { SECTION_LABELS } from '../../types'
import type { SectionType, AnyItem } from '../../types'
import { isPast, isToday, parseISO, format } from 'date-fns'

const SECTIONS: SectionType[] = ['todos', 'tasks', 'followups', 'conversations', 'ideas', 'management', 'meetings', 'notes']

const SECTION_COLORS: Record<SectionType, string> = {
  todos: '#6366f1',
  tasks: '#8b5cf6',
  followups: '#f97316',
  conversations: '#06b6d4',
  ideas: '#22c55e',
  management: '#ec4899',
  meetings: '#3b82f6',
  notes: '#eab308',
}

function getItemLabel(item: AnyItem): string {
  if ('text' in item) return item.text
  if ('title' in item) return item.title
  return ''
}

function getItemMeta(item: AnyItem): { label: string; urgent: boolean } {
  if (item.type === 'todo') {
    const overdue = item.dueDate && isPast(parseISO(item.dueDate)) && !item.completed
    return { label: item.priority, urgent: item.priority === 'urgent' || !!overdue }
  }
  if (item.type === 'task') {
    return { label: item.status.replace('_', ' '), urgent: item.status === 'blocked' }
  }
  if (item.type === 'followup') {
    const overdue = item.dueDate && isPast(parseISO(item.dueDate)) && item.status !== 'done'
    return { label: item.channel, urgent: !!overdue }
  }
  if (item.type === 'conversation') {
    return { label: item.status, urgent: item.status === 'open' }
  }
  if (item.type === 'idea') {
    return { label: item.impact + ' impact', urgent: false }
  }
  if (item.type === 'management') {
    return { label: item.status, urgent: item.priority === 'urgent' }
  }
  if (item.type === 'meeting') {
    const isNow = item.startTime && isToday(parseISO(item.startTime))
    return { label: isNow ? 'today' : item.status, urgent: !!isNow && item.status === 'upcoming' }
  }
  if (item.type === 'note') {
    return { label: 'note', urgent: false }
  }
  return { label: '', urgent: false }
}

function getSectionStats(section: SectionType, items: AnyItem[]): { done: number; total: number } {
  if (section === 'todos') {
    const todos = items.filter(i => i.type === 'todo') as Extract<AnyItem, { type: 'todo' }>[]
    return { done: todos.filter(t => t.completed).length, total: todos.length }
  }
  if (section === 'tasks') {
    const tasks = items.filter(i => i.type === 'task') as Extract<AnyItem, { type: 'task' }>[]
    return { done: tasks.filter(t => t.status === 'done').length, total: tasks.length }
  }
  if (section === 'followups') {
    const fups = items.filter(i => i.type === 'followup') as Extract<AnyItem, { type: 'followup' }>[]
    return { done: fups.filter(f => f.status === 'done').length, total: fups.length }
  }
  if (section === 'management') {
    const mgmt = items.filter(i => i.type === 'management') as Extract<AnyItem, { type: 'management' }>[]
    return { done: mgmt.filter(m => m.status === 'actioned' || m.status === 'discussed').length, total: mgmt.length }
  }
  if (section === 'meetings') {
    const mtgs = items.filter(i => i.type === 'meeting') as Extract<AnyItem, { type: 'meeting' }>[]
    return { done: mtgs.filter(m => m.status === 'completed').length, total: mtgs.length }
  }
  return { done: 0, total: items.filter(i => i.type === section.replace(/s$/, '') || matchType(i.type, section)).length }
}

function matchType(type: string, section: SectionType): boolean {
  const map: Record<SectionType, string> = {
    todos: 'todo', tasks: 'task', followups: 'followup',
    conversations: 'conversation', ideas: 'idea', management: 'management',
    meetings: 'meeting', notes: 'note'
  }
  return type === map[section]
}

export default function OverviewSection() {
  const { activeProjectId, items, setActiveSection } = useStore()

  if (!activeProjectId) return null

  const projectItems = items.filter(i => i.projectIds.includes(activeProjectId))

  const urgentItems = projectItems.filter(item => {
    if (item.type === 'todo') {
      const t = item as Extract<AnyItem, { type: 'todo' }>
      return !t.completed && (t.priority === 'urgent' || (t.dueDate && isPast(parseISO(t.dueDate))))
    }
    if (item.type === 'task') return (item as Extract<AnyItem, { type: 'task' }>).status === 'blocked'
    if (item.type === 'followup') {
      const f = item as Extract<AnyItem, { type: 'followup' }>
      return f.status !== 'done' && f.dueDate && isPast(parseISO(f.dueDate))
    }
    if (item.type === 'meeting') {
      const m = item as Extract<AnyItem, { type: 'meeting' }>
      return m.status === 'upcoming' && isToday(parseISO(m.startTime))
    }
    return false
  })

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Urgent / Today banner */}
      {urgentItems.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={15} className="text-rose-400" />
            <p className="text-sm font-semibold text-rose-300">Needs Attention ({urgentItems.length})</p>
          </div>
          <div className="flex flex-col gap-2">
            {urgentItems.slice(0, 4).map(item => (
              <div
                key={item.id}
                onClick={() => {
                const typeToSection: Record<string, SectionType> = {
                  todo: 'todos', task: 'tasks', followup: 'followups',
                  conversation: 'conversations', idea: 'ideas', management: 'management',
                  meeting: 'meetings', note: 'notes'
                }
                setActiveSection(typeToSection[item.type])
              }}
                className="flex items-center gap-2 text-xs text-rose-200 cursor-pointer hover:text-white transition-colors"
              >
                <Circle size={5} className="fill-rose-400 text-rose-400 flex-shrink-0" />
                <span className="truncate">{getItemLabel(item)}</span>
              </div>
            ))}
            {urgentItems.length > 4 && (
              <p className="text-xs text-rose-400/60">+{urgentItems.length - 4} more</p>
            )}
          </div>
        </div>
      )}

      {/* Section grid */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {SECTIONS.map(section => {
          const sectionItems = projectItems.filter(i => matchType(i.type, section))
          const stats = getSectionStats(section, sectionItems)
          const color = SECTION_COLORS[section]
          const preview = sectionItems.slice(0, 3)
          const hasProgress = ['todos', 'tasks', 'followups', 'management', 'meetings'].includes(section)
          const progressPct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

          return (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className="text-left p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all group"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: color + '22', border: `1px solid ${color}44` }}
                  >
                    <SectionIcon section={section} size={14} style={{ color }} />
                  </div>
                  <span className="text-sm font-semibold text-white">{SECTION_LABELS[section]}</span>
                </div>
                <span className="text-xs text-gray-500 font-medium">{sectionItems.length}</span>
              </div>

              {/* Progress bar */}
              {hasProgress && stats.total > 0 && (
                <div className="mb-3">
                  <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${progressPct}%`, backgroundColor: color }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{stats.done}/{stats.total} done</p>
                </div>
              )}

              {/* Preview items */}
              {sectionItems.length === 0 ? (
                <p className="text-xs text-gray-600 italic">Nothing here yet</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {preview.map(item => {
                    const meta = getItemMeta(item)
                    return (
                      <div key={item.id} className="flex items-start gap-1.5">
                        <div
                          className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0"
                          style={{ backgroundColor: meta.urgent ? '#f43f5e' : color + '99' }}
                        />
                        <span className="text-xs text-gray-400 truncate leading-relaxed group-hover:text-gray-300 transition-colors">
                          {getItemLabel(item)}
                        </span>
                      </div>
                    )
                  })}
                  {sectionItems.length > 3 && (
                    <p className="text-xs text-gray-600 pl-2.5">+{sectionItems.length - 3} more →</p>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
