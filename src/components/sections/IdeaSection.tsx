import { useState } from 'react'
import { useStore } from '../../store/useStore'
import type { IdeaItem } from '../../types'
import { Plus, Trash2, Move, Lightbulb, Star } from '../icons'

const STATUS_STYLES: Record<IdeaItem['status'], string> = {
  raw: 'bg-gray-500/15 text-gray-400',
  exploring: 'bg-blue-500/15 text-blue-400',
  planned: 'bg-purple-500/15 text-purple-400',
  shelved: 'bg-gray-500/10 text-gray-600',
}

const IMPACT_COLORS: Record<IdeaItem['impact'], string> = {
  low: 'text-gray-500',
  medium: 'text-amber-400',
  high: 'text-green-400',
}

const IMPACT_DOTS: Record<IdeaItem['impact'], string> = {
  low: 'bg-gray-500',
  medium: 'bg-amber-400',
  high: 'bg-green-400',
}

export default function IdeaSection() {
  const { items, activeProjectId, addItem, updateItem, deleteItem, setMoveModal } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', description: '', category: '', impact: 'medium' as IdeaItem['impact'], status: 'raw' as IdeaItem['status'] })

  const ideas = items
    .filter(i => i.type === 'idea' && activeProjectId && i.projectIds.includes(activeProjectId))
    .map(i => i as IdeaItem)
    .sort((a, b) => {
      const impactOrder = { high: 0, medium: 1, low: 2 }
      return impactOrder[a.impact] - impactOrder[b.impact]
    })

  const handleAdd = () => {
    if (!form.title.trim() || !activeProjectId) return
    addItem({
      type: 'idea',
      title: form.title.trim(),
      description: form.description,
      category: form.category || 'General',
      impact: form.impact,
      status: form.status,
      projectIds: [activeProjectId],
      tags: [],
      isStarred: false,
    })
    setForm({ title: '', description: '', category: '', impact: 'medium', status: 'raw' })
    setShowForm(false)
  }

  const categories = [...new Set(ideas.map(i => i.category))].filter(Boolean)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Ideas & Plans</h2>
          <div className="flex gap-2 text-xs">
            <span className="text-green-400">{ideas.filter(i => i.impact === 'high').length} high impact</span>
            <span className="text-gray-500">{ideas.length} total</span>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
        >
          <Plus size={14} />
          Capture
        </button>
      </div>

      {showForm && (
        <div className="mx-4 mt-3 p-4 bg-white/5 rounded-xl border border-white/10 animate-slide-in space-y-2.5">
          <input
            autoFocus
            placeholder="Idea title..."
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full bg-transparent text-white placeholder-gray-500 text-sm font-medium focus:outline-none"
          />
          <textarea
            placeholder="Describe the idea..."
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={3}
            className="w-full bg-white/5 text-gray-300 placeholder-gray-600 text-sm rounded-lg px-3 py-2 focus:outline-none resize-none border border-white/10"
          />
          <div className="flex gap-2 flex-wrap">
            <input
              placeholder="Category..."
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="bg-white/10 text-gray-300 placeholder-gray-600 text-xs rounded-lg px-2 py-1.5 focus:outline-none border border-white/10 w-28"
              list="categories"
            />
            <datalist id="categories">{categories.map(c => <option key={c} value={c} />)}</datalist>
            <select
              value={form.impact}
              onChange={e => setForm(f => ({ ...f, impact: e.target.value as IdeaItem['impact'] }))}
              className="bg-white/10 text-gray-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none border border-white/10"
            >
              <option value="low">Low Impact</option>
              <option value="medium">Medium Impact</option>
              <option value="high">High Impact</option>
            </select>
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value as IdeaItem['status'] }))}
              className="bg-white/10 text-gray-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none border border-white/10"
            >
              <option value="raw">Raw Idea</option>
              <option value="exploring">Exploring</option>
              <option value="planned">Planned</option>
              <option value="shelved">Shelved</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition-colors">Capture</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-1.5 bg-white/10 text-gray-300 text-xs rounded-lg transition-colors">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {ideas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-3">💡</div>
            <p className="text-gray-400 font-medium">No ideas yet</p>
            <p className="text-gray-600 text-sm mt-1">Capture your ideas and plans here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {ideas.map(idea => (
              <div
                key={idea.id}
                className="group border border-white/10 rounded-xl bg-white/3 hover:bg-white/5 transition-all overflow-hidden cursor-pointer"
                onClick={() => setExpandedId(expandedId === idea.id ? null : idea.id)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Lightbulb size={14} className={IMPACT_COLORS[idea.impact]} />
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[idea.status]}`}>
                          {idea.status}
                        </span>
                        {idea.category && (
                          <span className="text-xs text-gray-600">#{idea.category}</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-200">{idea.title}</p>
                      {!expandedId && idea.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{idea.description}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => updateItem(idea.id, { isStarred: !idea.isStarred } as Partial<IdeaItem>)}
                          className={`p-1 rounded hover:bg-white/10 ${idea.isStarred ? 'text-amber-400' : 'text-gray-600'}`}
                        >
                          <Star size={12} fill={idea.isStarred ? 'currentColor' : 'none'} />
                        </button>
                        <button onClick={() => setMoveModal(true, idea.id)} className="p-1 rounded hover:bg-white/10 text-gray-600 hover:text-gray-300">
                          <Move size={12} />
                        </button>
                        <button onClick={() => deleteItem(idea.id)} className="p-1 rounded hover:bg-red-500/20 text-gray-600 hover:text-red-400">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${IMPACT_DOTS[idea.impact]}`} />
                      <span className={`text-xs font-medium ${IMPACT_COLORS[idea.impact]}`}>{idea.impact} impact</span>
                    </div>
                  </div>
                </div>

                {expandedId === idea.id && (
                  <div className="px-4 pb-4 border-t border-white/5 pt-3 animate-slide-in" onClick={e => e.stopPropagation()}>
                    {idea.description && (
                      <p className="text-sm text-gray-400 leading-relaxed mb-3">{idea.description}</p>
                    )}
                    <div className="flex gap-1.5 flex-wrap">
                      {(['raw', 'exploring', 'planned', 'shelved'] as IdeaItem['status'][]).map(s => (
                        <button
                          key={s}
                          onClick={() => updateItem(idea.id, { status: s } as Partial<IdeaItem>)}
                          className={`text-xs px-2.5 py-1 rounded-lg transition-all ${
                            idea.status === s ? STATUS_STYLES[s] : 'text-gray-600 hover:text-gray-400 bg-white/5'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
