import { useState } from 'react'
import { useStore } from '../../store/useStore'
import type { ManagementItem, Priority } from '../../types'
import { Plus, Trash2, Move, Users, Flag, Clock, Check } from '../icons'
import { format, parseISO } from 'date-fns'

const STATUS_STYLES: Record<ManagementItem['status'], string> = {
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  discussed: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  actioned: 'bg-green-500/15 text-green-400 border-green-500/30',
  dropped: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
}

const PRIORITY_BG: Record<Priority, string> = {
  low: 'bg-gray-500/10 text-gray-400',
  medium: 'bg-blue-500/10 text-blue-400',
  high: 'bg-amber-500/10 text-amber-400',
  urgent: 'bg-red-500/10 text-red-400',
}

export default function ManagementSection() {
  const { items, activeProjectId, addItem, updateItem, deleteItem, setMoveModal } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [outcomeText, setOutcomeText] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium' as Priority, targetDate: ''
  })

  const mgmtItems = items
    .filter(i => i.type === 'management' && activeProjectId && i.projectIds.includes(activeProjectId))
    .map(i => i as ManagementItem)
    .sort((a, b) => {
      const order = { pending: 0, discussed: 1, actioned: 2, dropped: 3 }
      const pOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
      if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status]
      return pOrder[a.priority] - pOrder[b.priority]
    })

  const handleAdd = () => {
    if (!form.title.trim() || !activeProjectId) return
    addItem({
      type: 'management',
      title: form.title.trim(),
      description: form.description,
      priority: form.priority,
      status: 'pending',
      targetDate: form.targetDate || undefined,
      projectIds: [activeProjectId],
      tags: [],
      isStarred: false,
    })
    setForm({ title: '', description: '', priority: 'medium', targetDate: '' })
    setShowForm(false)
  }

  const pending = mgmtItems.filter(i => i.status === 'pending').length

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">TBD with Management</h2>
          {pending > 0 && (
            <span className="text-xs bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full font-medium">
              {pending} pending
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
        >
          <Plus size={14} />
          Add Item
        </button>
      </div>

      {showForm && (
        <div className="mx-4 mt-3 p-4 bg-white/5 rounded-xl border border-white/10 animate-slide-in space-y-2.5">
          <input
            autoFocus
            placeholder="What to discuss with management..."
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full bg-transparent text-white placeholder-gray-500 text-sm font-medium focus:outline-none"
          />
          <textarea
            placeholder="Context and background..."
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={3}
            className="w-full bg-white/5 text-gray-300 placeholder-gray-600 text-sm rounded-lg px-3 py-2 focus:outline-none resize-none border border-white/10"
          />
          <div className="flex gap-2">
            <select
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}
              className="bg-white/10 text-gray-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none border border-white/10"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <input
              type="date"
              value={form.targetDate}
              onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))}
              placeholder="Target meeting date"
              className="bg-white/10 text-gray-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none border border-white/10"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition-colors">Add</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-1.5 bg-white/10 text-gray-300 text-xs rounded-lg transition-colors">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {mgmtItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-3">👥</div>
            <p className="text-gray-400 font-medium">Nothing to discuss yet</p>
            <p className="text-gray-600 text-sm mt-1">Track items you need to raise with management</p>
          </div>
        ) : mgmtItems.map(item => (
          <div
            key={item.id}
            className={`group border rounded-xl transition-all overflow-hidden ${
              item.status === 'dropped' ? 'opacity-50 border-white/5' : 'border-white/10 bg-white/3 hover:bg-white/5'
            }`}
          >
            <div
              className="flex items-start gap-3 p-4 cursor-pointer"
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
            >
              <Flag size={14} className={`mt-0.5 flex-shrink-0 ${PRIORITY_BG[item.priority].split(' ')[1]}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="text-sm font-medium text-gray-200">{item.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[item.status]}`}>
                    {item.status}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${PRIORITY_BG[item.priority]}`}>
                    {item.priority}
                  </span>
                </div>
                {item.description && !expandedId && (
                  <p className="text-xs text-gray-500 truncate">{item.description}</p>
                )}
                {item.targetDate && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <Clock size={10} />
                    Target: {format(parseISO(item.targetDate), 'MMM d, yyyy')}
                  </div>
                )}
                {item.outcome && (
                  <p className="text-xs text-green-400 mt-1 bg-green-500/10 rounded px-2 py-0.5">
                    ✓ {item.outcome}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <button onClick={() => setMoveModal(true, item.id)} className="p-1.5 rounded hover:bg-white/10 text-gray-600 hover:text-gray-300">
                  <Move size={13} />
                </button>
                <button onClick={() => deleteItem(item.id)} className="p-1.5 rounded hover:bg-red-500/20 text-gray-600 hover:text-red-400">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {expandedId === item.id && (
              <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3 animate-slide-in">
                {item.description && (
                  <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
                )}

                {/* Status change */}
                <div className="flex gap-1.5 flex-wrap">
                  {(['pending', 'discussed', 'actioned', 'dropped'] as ManagementItem['status'][]).map(s => (
                    <button
                      key={s}
                      onClick={() => updateItem(item.id, { status: s } as Partial<ManagementItem>)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                        item.status === s ? STATUS_STYLES[s] : 'border-white/10 text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Outcome */}
                {item.status === 'discussed' || item.status === 'actioned' ? (
                  <div className="flex gap-2">
                    <input
                      placeholder="Record the outcome..."
                      value={outcomeText[item.id] ?? (item.outcome || '')}
                      onChange={e => setOutcomeText(t => ({ ...t, [item.id]: e.target.value }))}
                      className="flex-1 bg-white/5 text-gray-300 placeholder-gray-600 text-xs rounded-lg px-3 py-1.5 focus:outline-none border border-white/10"
                    />
                    <button
                      onClick={() => {
                        updateItem(item.id, { outcome: outcomeText[item.id] } as Partial<ManagementItem>)
                      }}
                      className="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
                    >
                      <Check size={13} className="text-white" />
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
