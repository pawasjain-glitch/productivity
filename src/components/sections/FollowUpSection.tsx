import { useState } from 'react'
import { useStore } from '../../store/useStore'
import type { FollowUpItem } from '../../types'
import { Plus, Trash2, Move, Clock, Check } from '../icons'
import { format, parseISO, isAfter, isPast } from 'date-fns'

const CHANNEL_ICONS: Record<string, string> = {
  email: '✉️', call: '📞', meeting: '🤝', message: '💬', other: '📌'
}

const STATUS_STYLES = {
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  done: 'bg-green-500/15 text-green-400 border-green-500/30',
  overdue: 'bg-red-500/15 text-red-400 border-red-500/30',
}

export default function FollowUpSection() {
  const { items, activeProjectId, addItem, updateItem, deleteItem, setMoveModal } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '', contact: '', description: '', dueDate: '',
    channel: 'email' as FollowUpItem['channel']
  })

  const followups = items
    .filter(i => i.type === 'followup' && activeProjectId && i.projectIds.includes(activeProjectId))
    .map(i => {
      const f = i as FollowUpItem
      if (f.status === 'pending' && f.dueDate && isPast(parseISO(f.dueDate))) {
        return { ...f, status: 'overdue' as const }
      }
      return f
    })
    .sort((a, b) => {
      const order = { overdue: 0, pending: 1, done: 2 }
      return order[a.status] - order[b.status]
    })

  const handleAdd = () => {
    if (!form.title.trim() || !form.contact.trim() || !activeProjectId) return
    addItem({
      type: 'followup',
      title: form.title.trim(),
      contact: form.contact.trim(),
      description: form.description,
      dueDate: form.dueDate || undefined,
      status: 'pending',
      channel: form.channel,
      projectIds: [activeProjectId],
      tags: [],
      isStarred: false,
    })
    setForm({ title: '', contact: '', description: '', dueDate: '', channel: 'email' })
    setShowForm(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Follow-ups</h2>
          <div className="flex gap-2 text-xs">
            <span className="text-red-400">{followups.filter(f => f.status === 'overdue').length} overdue</span>
            <span className="text-amber-400">{followups.filter(f => f.status === 'pending').length} pending</span>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      {showForm && (
        <div className="mx-4 mt-3 p-4 bg-white/5 rounded-xl border border-white/10 animate-slide-in space-y-2.5">
          <input
            autoFocus
            placeholder="What to follow up on..."
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full bg-transparent text-white placeholder-gray-500 text-sm font-medium focus:outline-none"
          />
          <input
            placeholder="Contact (name, company)..."
            value={form.contact}
            onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
            className="w-full bg-white/5 text-gray-300 placeholder-gray-600 text-sm rounded-lg px-3 py-2 focus:outline-none border border-white/10"
          />
          <textarea
            placeholder="Notes..."
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={2}
            className="w-full bg-white/5 text-gray-300 placeholder-gray-600 text-sm rounded-lg px-3 py-2 focus:outline-none resize-none border border-white/10"
          />
          <div className="flex gap-2">
            <select
              value={form.channel}
              onChange={e => setForm(f => ({ ...f, channel: e.target.value as FollowUpItem['channel'] }))}
              className="bg-white/10 text-gray-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none border border-white/10"
            >
              <option value="email">✉️ Email</option>
              <option value="call">📞 Call</option>
              <option value="meeting">🤝 Meeting</option>
              <option value="message">💬 Message</option>
              <option value="other">📌 Other</option>
            </select>
            <input
              type="date"
              value={form.dueDate}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              className="bg-white/10 text-gray-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none border border-white/10"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleAdd} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition-colors">Add</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-1.5 bg-white/10 text-gray-300 text-xs rounded-lg transition-colors">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {followups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-3">🔔</div>
            <p className="text-gray-400 font-medium">No follow-ups</p>
            <p className="text-gray-600 text-sm mt-1">Track who you need to follow up with</p>
          </div>
        ) : followups.map(item => (
          <div
            key={item.id}
            className={`group flex items-start gap-3 p-4 rounded-xl border transition-all hover:bg-white/5 ${
              item.status === 'overdue'
                ? 'border-red-500/20 bg-red-500/5'
                : item.status === 'done'
                  ? 'border-white/5 opacity-60'
                  : 'border-white/10'
            }`}
          >
            <div className="flex-shrink-0 text-xl">{CHANNEL_ICONS[item.channel]}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={`text-sm font-medium ${item.status === 'done' ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.contact}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${STATUS_STYLES[item.status]}`}>
                  {item.status}
                </span>
              </div>
              {item.description && (
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{item.description}</p>
              )}
              {item.dueDate && (
                <div className={`flex items-center gap-1 text-xs mt-1.5 ${
                  item.status === 'overdue' ? 'text-red-400' : 'text-gray-500'
                }`}>
                  <Clock size={10} />
                  {format(parseISO(item.dueDate), 'MMM d, yyyy')}
                </div>
              )}
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {item.status !== 'done' && (
                <button
                  onClick={() => updateItem(item.id, { status: 'done' } as Partial<FollowUpItem>)}
                  className="p-1.5 rounded-lg hover:bg-green-500/20 text-gray-600 hover:text-green-400 transition-colors"
                  title="Mark done"
                >
                  <Check size={13} />
                </button>
              )}
              <button
                onClick={() => setMoveModal(true, item.id)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-600 hover:text-gray-300 transition-colors"
              >
                <Move size={13} />
              </button>
              <button
                onClick={() => deleteItem(item.id)}
                className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-600 hover:text-red-400 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
