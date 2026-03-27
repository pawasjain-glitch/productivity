import { useState } from 'react'
import { useStore } from '../store/useStore'
import { Plus, X, Check, FolderPlus, LayoutDashboard } from './icons'
import { PROJECT_COLORS } from '../types'

export default function ProjectTabs() {
  const { projects, activeProjectId, setActiveProject, addProject, updateProject, deleteProject, isMasterView, setMasterView } = useStore()
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PROJECT_COLORS[0])
  const [newIcon, setNewIcon] = useState('📁')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const sortedProjects = [...projects].filter(p => !p.isArchived).sort((a, b) => a.order - b.order)

  const handleAdd = () => {
    if (!newName.trim()) return
    const p = addProject(newName.trim(), newColor, newIcon)
    setActiveProject(p.id)
    setIsAdding(false)
    setNewName('')
    setNewIcon('📁')
  }

  const handleEditStart = (id: string, name: string) => {
    setEditingId(id)
    setEditName(name)
  }

  const handleEditSave = () => {
    if (editingId && editName.trim()) {
      updateProject(editingId, { name: editName.trim() })
    }
    setEditingId(null)
  }

  const ICONS = ['📁', '🚀', '⚙️', '📊', '💡', '🔧', '🎯', '📱', '🌍', '💼', '🏗️', '🎨', '📈', '🔬', '⚡']

  return (
    <div className="border-b border-white/10 bg-gray-900/60 backdrop-blur-sm">
      <div className="flex items-center gap-1 px-4 overflow-x-auto scrollbar-hide">
        {/* Master tab — always pinned first */}
        <button
          onClick={() => { setMasterView(true); setActiveProject(null) }}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition-all relative whitespace-nowrap flex-shrink-0 ${
            isMasterView
              ? 'text-white'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <LayoutDashboard size={13} />
          <span>Master</span>
          {isMasterView && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-indigo-400" />
          )}
        </button>
        <div className="w-px h-5 bg-white/10 flex-shrink-0 mx-1" />

        {sortedProjects.map(project => (
          <div key={project.id} className="flex-shrink-0 group relative">
            {editingId === project.id ? (
              <div className="flex items-center gap-1 px-3 py-2">
                <input
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleEditSave(); if (e.key === 'Escape') setEditingId(null) }}
                  className="bg-white/10 text-white text-sm px-2 py-0.5 rounded w-32 focus:outline-none focus:ring-1 focus:ring-white/30"
                />
                <button onClick={handleEditSave} className="text-green-400 hover:text-green-300">
                  <Check size={12} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setActiveProject(project.id); setMasterView(false) }}
                onDoubleClick={() => handleEditStart(project.id, project.name)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative whitespace-nowrap ${
                  activeProjectId === project.id
                    ? 'text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <span className="text-base">{project.icon}</span>
                <span>{project.name}</span>
                {activeProjectId === project.id && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                    style={{ backgroundColor: project.color }}
                  />
                )}
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full opacity-0 group-hover:opacity-30 transition-opacity"
                  style={{ backgroundColor: project.color }}
                />
              </button>
            )}
            {activeProjectId === project.id && projects.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${project.name}"?`)) deleteProject(project.id) }}
                className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-400 p-0.5 rounded"
              >
                <X size={10} />
              </button>
            )}
          </div>
        ))}

        {isAdding ? (
          <div className="flex items-center gap-2 px-3 py-2 border border-white/20 rounded-lg m-1 bg-gray-800/80">
            <div className="flex gap-1 mb-0 flex-wrap max-w-xs">
              <select
                value={newIcon}
                onChange={e => setNewIcon(e.target.value)}
                className="bg-transparent text-lg border-none focus:outline-none cursor-pointer"
              >
                {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
              <input
                autoFocus
                placeholder="Project name..."
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setIsAdding(false) }}
                className="bg-transparent text-white text-sm placeholder-gray-500 focus:outline-none w-32"
              />
            </div>
            <div className="flex gap-1">
              {PROJECT_COLORS.slice(0, 8).map(c => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={`w-4 h-4 rounded-full transition-transform ${newColor === c ? 'scale-125 ring-1 ring-white/50' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex gap-1 ml-1">
              <button onClick={handleAdd} className="text-green-400 hover:text-green-300 p-1">
                <Check size={14} />
              </button>
              <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-gray-300 p-1">
                <X size={14} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3 py-3 text-sm text-gray-500 hover:text-gray-300 transition-colors whitespace-nowrap flex-shrink-0"
          >
            <FolderPlus size={14} />
            <span>New Project</span>
          </button>
        )}
      </div>
    </div>
  )
}
