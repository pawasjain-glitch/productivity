import { useStore } from '../store/useStore'
import { X, Star, ArrowRight } from './icons'
import type { AnyItem, SectionType } from '../types'

interface StarredItemsPanelProps {
  onClose: () => void
}

function getItemLabel(item: AnyItem): string {
  const i = item as unknown as Record<string, unknown>
  return (i.title as string) || (i.text as string) || 'Untitled'
}

function getItemSection(item: AnyItem): SectionType {
  const map: Record<string, SectionType> = {
    todo: 'todos', todos: 'todos',
    task: 'tasks', tasks: 'tasks',
    followup: 'followups', followups: 'followups',
    conversation: 'conversations', conversations: 'conversations',
    idea: 'ideas', ideas: 'ideas',
    management: 'management',
    meeting: 'meetings', meetings: 'meetings',
    note: 'notes', notes: 'notes',
  }
  return map[item.type] || 'todos'
}

function getSectionLabel(section: SectionType): string {
  const labels: Record<SectionType, string> = {
    todos: 'To-Do', tasks: 'Task', followups: 'Follow-up',
    conversations: 'Conversation', ideas: 'Idea', management: 'Management',
    meetings: 'Meeting', notes: 'Note',
  }
  return labels[section] || section
}

const SECTION_COLORS: Record<SectionType, string> = {
  todos: 'bg-violet-500/15 text-violet-300 border-violet-500/20',
  tasks: 'bg-blue-500/15 text-blue-300 border-blue-500/20',
  followups: 'bg-orange-500/15 text-orange-300 border-orange-500/20',
  conversations: 'bg-green-500/15 text-green-300 border-green-500/20',
  ideas: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/20',
  management: 'bg-red-500/15 text-red-300 border-red-500/20',
  meetings: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/20',
  notes: 'bg-pink-500/15 text-pink-300 border-pink-500/20',
}

export default function StarredItemsPanel({ onClose }: StarredItemsPanelProps) {
  const { items, projects, setActiveProject, setActiveSection, updateItem } = useStore()
  const starred = items.filter(i => i.isStarred)

  const handleNavigate = (item: AnyItem) => {
    const projectId = item.projectIds[0]
    if (projectId) setActiveProject(projectId)
    setActiveSection(getItemSection(item))
    onClose()
  }

  const handleUnstar = (e: React.MouseEvent, item: AnyItem) => {
    e.stopPropagation()
    updateItem(item.id, { isStarred: false })
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-end z-50 pt-14 pr-4 animate-fade-in" onClick={onClose}>
      <div
        className="bg-gray-900 border border-white/15 rounded-2xl w-80 max-h-[70vh] shadow-2xl flex flex-col animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Star size={14} className="text-amber-400" fill="currentColor" />
            <span className="text-sm font-semibold text-white">Starred Items</span>
            <span className="text-xs text-gray-500 bg-white/10 px-1.5 py-0.5 rounded-full">{starred.length}</span>
          </div>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-white/10 transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Items */}
        <div className="overflow-y-auto flex-1">
          {starred.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Star size={28} className="text-gray-600 mb-3" />
              <p className="text-sm text-gray-400 font-medium">No starred items yet</p>
              <p className="text-xs text-gray-600 mt-1">Star any item to quickly find it here</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {starred.map(item => {
                const section = getItemSection(item)
                const project = projects.find(p => item.projectIds.includes(p.id))
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item)}
                    className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${SECTION_COLORS[section]}`}>
                          {getSectionLabel(section)}
                        </span>
                        {project && (
                          <span className="text-[10px] text-gray-500 truncate">{project.icon} {project.name}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-200 truncate">{getItemLabel(item)}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1">
                      <button
                        onClick={e => handleUnstar(e, item)}
                        className="p-1 rounded hover:bg-amber-500/20 text-amber-400/60 hover:text-amber-400 transition-colors"
                        title="Remove star"
                      >
                        <Star size={11} fill="currentColor" />
                      </button>
                      <ArrowRight size={12} className="text-gray-600" />
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
