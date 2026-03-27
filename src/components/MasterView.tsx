import { useMemo } from 'react'
import { useStore } from '../store/useStore'
import { parseISO, isToday, isTomorrow, differenceInMinutes, isPast, format } from 'date-fns'
import { ArrowRight, AlertCircle, CheckSquare, Briefcase, Calendar, Clock, Star } from './icons'
import type { AnyItem, Project, SectionType } from '../types'

/* ── helpers ───────────────────────────────────────────────── */

function isCriticalTodo(item: AnyItem, pid: string) {
  if (item.type !== 'todo') return false
  if (!item.projectIds.includes(pid)) return false
  if (item.completed) return false
  if (!item.dueDate) return item.priority === 'urgent' || item.priority === 'high'
  const due = parseISO(item.dueDate)
  return isPast(due) || isToday(due) || item.priority === 'urgent' || item.priority === 'high'
}

function isCriticalTask(item: AnyItem, pid: string) {
  if (item.type !== 'task') return false
  if (!item.projectIds.includes(pid)) return false
  if (item.status === 'done') return false
  if (item.status === 'blocked') return true
  if (item.priority === 'urgent' || item.priority === 'high') return true
  if (item.dueDate) {
    const due = parseISO(item.dueDate)
    return isPast(due) || isToday(due) || isTomorrow(due)
  }
  return false
}

function isUpcomingMeeting(item: AnyItem, pid: string) {
  if (item.type !== 'meeting') return false
  if (!item.projectIds.includes(pid)) return false
  if (item.status !== 'upcoming') return false
  if (!item.startTime) return false
  const mins = differenceInMinutes(parseISO(item.startTime), new Date())
  return mins >= -30 && mins <= 3 * 24 * 60
}

function todoLabel(item: AnyItem) {
  return (item as { text?: string; title?: string }).text || (item as { title?: string }).title || 'Untitled'
}

function urgencyColor(item: AnyItem): string {
  const i = item as { priority?: string; status?: string; dueDate?: string }
  if (i.status === 'blocked') return 'text-red-400'
  if (i.priority === 'urgent') return 'text-red-400'
  if (i.priority === 'high') return 'text-orange-400'
  if (i.dueDate && isPast(parseISO(i.dueDate))) return 'text-red-400'
  return 'text-gray-400'
}

function MeetingTime({ startTime }: { startTime: string }) {
  const start = parseISO(startTime)
  const mins = differenceInMinutes(start, new Date())
  if (mins >= 0 && mins <= 60) return <span className="text-amber-400 text-[10px] font-semibold">In {mins}m</span>
  if (isToday(start)) return <span className="text-blue-400 text-[10px]">Today {format(start, 'h:mm a')}</span>
  if (isTomorrow(start)) return <span className="text-purple-400 text-[10px]">Tomorrow {format(start, 'h:mm a')}</span>
  return <span className="text-gray-500 text-[10px]">{format(start, 'EEE, MMM d · h:mm a')}</span>
}

/* ── Project Card ───────────────────────────────────────────── */

function ProjectCard({ project, items, onNavigate }: {
  project: Project
  items: AnyItem[]
  onNavigate: (pid: string, section?: SectionType) => void
}) {
  const todos   = items.filter(i => isCriticalTodo(i, project.id)).slice(0, 4)
  const tasks   = items.filter(i => isCriticalTask(i, project.id)).slice(0, 4)
  const meetings = items.filter(i => isUpcomingMeeting(i, project.id))
    .sort((a, b) => {
      const am = a as { startTime: string }
      const bm = b as { startTime: string }
      return differenceInMinutes(parseISO(am.startTime), parseISO(bm.startTime))
    }).slice(0, 3)

  const totalItems = items.filter(i => i.projectIds.includes(project.id)).length
  const starred = items.filter(i => i.projectIds.includes(project.id) && i.isStarred).length
  const hasAnything = todos.length + tasks.length + meetings.length > 0

  return (
    <div
      className="bg-gray-900/70 border border-white/8 rounded-2xl overflow-hidden flex flex-col hover:border-white/15 transition-all group hover:shadow-xl hover:shadow-black/20"
      style={{ borderTopColor: project.color, borderTopWidth: 3 }}
    >
      {/* Card header */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="text-xl flex-shrink-0">{project.icon}</span>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white truncate">{project.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-gray-500">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
              {starred > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
                  <Star size={9} fill="currentColor" />{starred}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => onNavigate(project.id)}
          className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
        >
          Open <ArrowRight size={10} />
        </button>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/5 mx-4" />

      {/* Content */}
      <div className="flex-1 px-4 py-3 space-y-3">

        {/* To-Dos */}
        {todos.length > 0 && (
          <div>
            <button
              onClick={() => onNavigate(project.id, 'todos')}
              className="flex items-center gap-1.5 mb-1.5 hover:opacity-80 transition-opacity"
            >
              <CheckSquare size={11} className="text-violet-400" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Critical To-Dos</span>
            </button>
            <div className="space-y-1">
              {todos.map(item => (
                <div key={item.id} className="flex items-start gap-1.5">
                  <span className={`w-1 h-1 rounded-full mt-1.5 flex-shrink-0 ${urgencyColor(item).replace('text-', 'bg-')}`} />
                  <span className={`text-xs leading-snug line-clamp-1 ${urgencyColor(item)}`}>{todoLabel(item)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tasks */}
        {tasks.length > 0 && (
          <div>
            <button
              onClick={() => onNavigate(project.id, 'tasks')}
              className="flex items-center gap-1.5 mb-1.5 hover:opacity-80 transition-opacity"
            >
              <Briefcase size={11} className="text-blue-400" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Key Tasks</span>
            </button>
            <div className="space-y-1">
              {tasks.map(item => {
                const t = item as { title: string; status: string; priority: string }
                return (
                  <div key={item.id} className="flex items-center gap-1.5">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                      t.status === 'blocked'
                        ? 'bg-red-500/15 text-red-400'
                        : t.priority === 'urgent'
                        ? 'bg-red-500/10 text-red-400'
                        : t.priority === 'high'
                        ? 'bg-orange-500/10 text-orange-400'
                        : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {t.status === 'blocked' ? 'BLOCKED' : t.priority.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-300 line-clamp-1">{t.title}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Meetings */}
        {meetings.length > 0 && (
          <div>
            <button
              onClick={() => onNavigate(project.id, 'meetings')}
              className="flex items-center gap-1.5 mb-1.5 hover:opacity-80 transition-opacity"
            >
              <Calendar size={11} className="text-cyan-400" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Upcoming Meetings</span>
            </button>
            <div className="space-y-1.5">
              {meetings.map(item => {
                const m = item as { title: string; startTime: string; attendees?: string[] }
                return (
                  <div key={item.id} className="flex items-start gap-1.5">
                    <Clock size={10} className="text-gray-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-200 line-clamp-1">{m.title}</p>
                      <MeetingTime startTime={m.startTime} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!hasAnything && (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: project.color + '22' }}>
              <span className="text-base">{project.icon}</span>
            </div>
            <p className="text-xs text-gray-600">All clear — no critical items</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 pt-1">
        <button
          onClick={() => onNavigate(project.id)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-90"
          style={{ backgroundColor: project.color + '18', color: project.color, border: `1px solid ${project.color}30` }}
        >
          Open {project.name}
          <ArrowRight size={11} />
        </button>
      </div>
    </div>
  )
}

/* ── Master View ────────────────────────────────────────────── */

export default function MasterView() {
  const { projects, items, setActiveProject, setActiveSection, setMasterView } = useStore()

  const activeProjects = useMemo(
    () => [...projects].filter(p => !p.isArchived).sort((a, b) => a.order - b.order),
    [projects]
  )

  // Aggregate stats across all projects
  const criticalCount = useMemo(() => {
    let count = 0
    for (const p of activeProjects) {
      count += items.filter(i => isCriticalTodo(i, p.id) || isCriticalTask(i, p.id)).length
    }
    return count
  }, [activeProjects, items])

  const meetingsToday = useMemo(() => {
    return items.filter(i => {
      if (i.type !== 'meeting' || i.status !== 'upcoming') return false
      const m = i as { startTime: string }
      if (!m.startTime) return false
      return isToday(parseISO(m.startTime))
    }).length
  }, [items])

  const handleNavigate = (pid: string, section?: SectionType) => {
    setActiveProject(pid)
    if (section) setActiveSection(section)
    setMasterView(false)
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-950">
      {/* Top banner */}
      <div className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur border-b border-white/8 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-white font-bold text-base">Master Overview</h2>
            <p className="text-xs text-gray-500">{activeProjects.length} projects · {format(new Date(), 'EEEE, MMMM d')}</p>
          </div>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full">
                <AlertCircle size={11} className="text-rose-400" />
                <span className="text-xs font-semibold text-rose-400">{criticalCount} critical item{criticalCount !== 1 ? 's' : ''}</span>
              </div>
            )}
            {meetingsToday > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                <Calendar size={11} className="text-blue-400" />
                <span className="text-xs font-semibold text-blue-400">{meetingsToday} meeting{meetingsToday !== 1 ? 's' : ''} today</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cards grid */}
      <div className="p-6">
        {activeProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">🏢</div>
            <p className="text-gray-400 font-semibold text-lg">No projects yet</p>
            <p className="text-gray-600 text-sm mt-1">Create a project from the tab bar above to get started</p>
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {activeProjects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                items={items}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
