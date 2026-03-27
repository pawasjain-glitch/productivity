import { useStore } from '../store/useStore'
import { SectionIcon, LayoutDashboard } from './icons'
import { SECTION_LABELS } from '../types'
import type { SectionType } from '../types'
import { useCallback } from 'react'

const SECTIONS: SectionType[] = ['todos', 'tasks', 'followups', 'conversations', 'ideas', 'management', 'meetings', 'notes']

export default function SectionNav() {
  const { activeSection, setActiveSection, activeProjectId, items, projects } = useStore()

  const getCount = useCallback((section: SectionType) => {
    if (!activeProjectId) return 0
    return items.filter(i => i.type === section && i.projectIds.includes(activeProjectId)).length
  }, [items, activeProjectId])

  const activeProject = projects.find(p => p.id === activeProjectId)

  return (
    <div className="w-52 flex-shrink-0 border-r border-white/10 bg-gray-900/40 flex flex-col">
      {activeProject && (
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{activeProject.icon}</span>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Active Project</p>
              <p className="text-sm font-semibold text-white truncate max-w-[120px]">{activeProject.name}</p>
            </div>
          </div>
          {activeProject.description && (
            <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-2">{activeProject.description}</p>
          )}
          <div className="mt-2 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeProject.color }} />
            <span className="text-xs text-gray-500">{items.filter(i => i.projectIds.includes(activeProject.id)).length} items</span>
          </div>
        </div>
      )}

      <nav className="flex-1 py-2 overflow-y-auto">
        {/* Overview */}
        <button
          onClick={() => setActiveSection('overview')}
          className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-all group mb-1 ${
            activeSection === 'overview'
              ? 'text-white bg-indigo-500/20 border-r-2 border-indigo-400'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          <LayoutDashboard
            size={15}
            className={activeSection === 'overview' ? 'text-indigo-400' : 'text-gray-500 group-hover:text-gray-400'}
          />
          <span className="font-medium">Overview</span>
        </button>

        {/* Divider */}
        <div className="mx-4 my-1 border-t border-white/10" />

        {SECTIONS.map(section => {
          const count = getCount(section)
          const isActive = activeSection === section
          return (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-all group ${
                isActive
                  ? 'text-white bg-white/10'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <SectionIcon
                  section={section}
                  size={15}
                  className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-400'}
                />
                <span className="font-medium">{SECTION_LABELS[section]}</span>
              </div>
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-500'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
