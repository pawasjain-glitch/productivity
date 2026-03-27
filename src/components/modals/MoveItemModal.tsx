import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { X, Check, Move } from '../icons'

export default function MoveItemModal() {
  const { isMoveModalOpen, moveItemId, items, projects, moveItemToProject, setMoveModal } = useStore()
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  if (!isMoveModalOpen || !moveItemId) return null

  const item = items.find(i => i.id === moveItemId)
  if (!item) return null

  const initSelectedIds = item.projectIds

  const toggle = (pid: string) => {
    setSelectedIds(prev => {
      if (prev.length === 0) {
        // Initialize from item's current projects
        const current = initSelectedIds.includes(pid)
          ? initSelectedIds.filter(id => id !== pid)
          : [...initSelectedIds, pid]
        return current
      }
      return prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid]
    })
  }

  const effectiveSelected = selectedIds.length === 0 ? initSelectedIds : selectedIds

  const handleSave = () => {
    if (effectiveSelected.length === 0) return
    moveItemToProject(moveItemId, effectiveSelected)
    setMoveModal(false, null)
    setSelectedIds([])
  }

  const handleClose = () => {
    setMoveModal(false, null)
    setSelectedIds([])
  }

  const getItemTitle = () => {
    const i = item as unknown as Record<string, unknown>
    return (i.text || i.title || 'Item') as string
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-gray-900 border border-white/15 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Move size={18} className="text-indigo-400" />
            <h3 className="text-white font-semibold">Move / Copy to Projects</h3>
          </div>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-300 p-1 rounded-lg hover:bg-white/10">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-4 bg-white/5 rounded-lg px-3 py-2 truncate">
          "{getItemTitle()}"
        </p>

        <p className="text-xs text-gray-500 mb-3">Select one or more projects:</p>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {projects.filter(p => !p.isArchived).map(project => {
            const isSelected = effectiveSelected.includes(project.id)
            return (
              <button
                key={project.id}
                onClick={() => toggle(project.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-indigo-500/50 bg-indigo-500/10'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <span className="text-lg">{project.icon}</span>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-200">{project.name}</p>
                  {project.description && (
                    <p className="text-xs text-gray-500 truncate">{project.description}</p>
                  )}
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-600'
                }`}>
                  {isSelected && <Check size={10} className="text-white" />}
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
          <button
            onClick={handleSave}
            disabled={effectiveSelected.length === 0}
            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
          >
            Save ({effectiveSelected.length} project{effectiveSelected.length !== 1 ? 's' : ''})
          </button>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 text-sm rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
