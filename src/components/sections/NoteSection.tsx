import { useState } from 'react'
import { useStore } from '../../store/useStore'
import type { NoteItem } from '../../types'
import { Plus, Trash2, Move, Edit3, Check, X, Star } from '../icons'

const NOTE_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#3b82f6'
]

export default function NoteSection() {
  const { items, activeProjectId, addItem, updateItem, deleteItem, setMoveModal } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', content: '', color: '#6366f1' })
  const [editForm, setEditForm] = useState({ title: '', content: '', color: '' })

  const notes = items
    .filter(i => i.type === 'note' && activeProjectId && i.projectIds.includes(activeProjectId))
    .map(i => i as NoteItem)

  const handleAdd = () => {
    if (!form.title.trim() || !activeProjectId) return
    addItem({
      type: 'note',
      title: form.title.trim(),
      content: form.content,
      color: form.color,
      projectIds: [activeProjectId],
      tags: [],
      isStarred: false,
    })
    setForm({ title: '', content: '', color: '#6366f1' })
    setShowForm(false)
  }

  const startEdit = (note: NoteItem) => {
    setEditingId(note.id)
    setEditForm({ title: note.title, content: note.content, color: note.color })
  }

  const saveEdit = (note: NoteItem) => {
    updateItem(note.id, editForm as Partial<NoteItem>)
    setEditingId(null)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white">Notes</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
        >
          <Plus size={14} />
          New Note
        </button>
      </div>

      {showForm && (
        <div className="mx-4 mt-3 p-4 bg-white/5 rounded-xl border border-white/10 animate-slide-in space-y-2.5">
          <input
            autoFocus
            placeholder="Note title..."
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full bg-transparent text-white placeholder-gray-500 text-sm font-medium focus:outline-none"
          />
          <textarea
            placeholder="Write your note... (supports markdown)"
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            rows={6}
            className="w-full bg-white/5 text-gray-300 placeholder-gray-600 text-sm rounded-lg px-3 py-2 focus:outline-none resize-none border border-white/10 font-mono"
          />
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">Color:</span>
            <div className="flex gap-1.5">
              {NOTE_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`w-5 h-5 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-1 ring-white/50' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition-colors">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-1.5 bg-white/10 text-gray-300 text-xs rounded-lg transition-colors">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-3">📝</div>
            <p className="text-gray-400 font-medium">No notes yet</p>
            <p className="text-gray-600 text-sm mt-1">Capture references, guidelines, and context</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {notes.map(note => (
              <div
                key={note.id}
                className="group relative border border-white/10 rounded-xl bg-white/3 hover:bg-white/5 transition-all overflow-hidden"
                style={{ borderLeftColor: note.color, borderLeftWidth: 3 }}
              >
                {editingId === note.id ? (
                  <div className="p-4 space-y-2">
                    <input
                      autoFocus
                      value={editForm.title}
                      onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                      className="w-full bg-transparent text-white text-sm font-semibold focus:outline-none"
                    />
                    <textarea
                      value={editForm.content}
                      onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))}
                      rows={6}
                      className="w-full bg-white/5 text-gray-300 text-xs rounded-lg px-2 py-2 focus:outline-none resize-none border border-white/10 font-mono"
                    />
                    <div className="flex gap-1.5">
                      {NOTE_COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => setEditForm(f => ({ ...f, color: c }))}
                          className={`w-4 h-4 rounded-full transition-transform ${editForm.color === c ? 'scale-125 ring-1 ring-white/50' : ''}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(note)} className="p-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white">
                        <Check size={12} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 rounded bg-white/10 text-gray-300">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-semibold text-gray-200">{note.title}</p>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={() => updateItem(note.id, { isStarred: !note.isStarred } as Partial<NoteItem>)}
                          className={`p-1.5 rounded hover:bg-white/10 ${note.isStarred ? 'text-amber-400' : 'text-gray-600'}`}
                        >
                          <Star size={12} fill={note.isStarred ? 'currentColor' : 'none'} />
                        </button>
                        <button onClick={() => startEdit(note)} className="p-1.5 rounded hover:bg-white/10 text-gray-600 hover:text-gray-300">
                          <Edit3 size={12} />
                        </button>
                        <button onClick={() => setMoveModal(true, note.id)} className="p-1.5 rounded hover:bg-white/10 text-gray-600 hover:text-gray-300">
                          <Move size={12} />
                        </button>
                        <button onClick={() => deleteItem(note.id)} className="p-1.5 rounded hover:bg-red-500/20 text-gray-600 hover:text-red-400">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap font-mono max-h-32 overflow-hidden">
                      {note.content}
                    </div>
                    {note.content.split('\n').length > 6 && (
                      <p className="text-xs text-gray-600 mt-1">... more</p>
                    )}
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
