import { useState } from 'react'
import { useStore } from '../../store/useStore'
import type { TodoItem, Priority } from '../../types'
import { Plus, Star, Trash2, Edit3, Check, X, Flag, Clock, Move, Copy } from '../icons'
import { format, isAfter, parseISO } from 'date-fns'

const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'text-gray-400',
  medium: 'text-blue-400',
  high: 'text-amber-400',
  urgent: 'text-red-400',
}

const PRIORITY_BG: Record<Priority, string> = {
  low: 'bg-gray-500/10 text-gray-400',
  medium: 'bg-blue-500/10 text-blue-400',
  high: 'bg-amber-500/10 text-amber-400',
  urgent: 'bg-red-500/10 text-red-400',
}

export default function TodoSection() {
  const { items, activeProjectId, addItem, updateItem, deleteItem, setMoveModal } = useStore()
  const [newText, setNewText] = useState('')
  const [newPriority, setNewPriority] = useState<Priority>('medium')
  const [newDueDate, setNewDueDate] = useState('')
  const [newAssignee, setNewAssignee] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all')
  const [showAddForm, setShowAddForm] = useState(false)

  const todos = items
    .filter(i => i.type === 'todo' && activeProjectId && i.projectIds.includes(activeProjectId))
    .map(i => i as TodoItem)
    .sort((a, b) => {
      const pOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
      if (pOrder[a.priority] !== pOrder[b.priority]) return pOrder[a.priority] - pOrder[b.priority]
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  const filtered = todos.filter(t =>
    filter === 'all' ? true : filter === 'active' ? !t.completed : t.completed
  )

  const done = todos.filter(t => t.completed).length

  const handleAdd = () => {
    if (!newText.trim() || !activeProjectId) return
    addItem({
      type: 'todo',
      text: newText.trim(),
      completed: false,
      priority: newPriority,
      dueDate: newDueDate || undefined,
      assignee: newAssignee.trim() || undefined,
      projectIds: [activeProjectId],
      tags: [],
      isStarred: false,
    })
    setNewText('')
    setNewDueDate('')
    setNewAssignee('')
    setShowAddForm(false)
  }

  const handleEditSave = (todo: TodoItem) => {
    if (editText.trim()) updateItem(todo.id, { text: editText.trim() } as Partial<TodoItem>)
    setEditingId(null)
  }

  const isOverdue = (todo: TodoItem) =>
    todo.dueDate && !todo.completed && isAfter(new Date(), parseISO(todo.dueDate))

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">To-Dos</h2>
          <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
            {done}/{todos.length} done
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter tabs */}
          <div className="flex bg-white/5 rounded-lg p-0.5 text-xs">
            {(['all', 'active', 'done'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md capitalize transition-all ${
                  filter === f ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {todos.length > 0 && (
        <div className="px-4 pt-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{Math.round((done / todos.length) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${(done / todos.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <div className="mx-4 mt-3 p-3 bg-white/5 rounded-xl border border-white/10 animate-slide-in">
          <input
            autoFocus
            placeholder="What needs to be done?"
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowAddForm(false) }}
            className="w-full bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none mb-2"
          />
          <div className="flex items-center gap-2">
            <select
              value={newPriority}
              onChange={e => setNewPriority(e.target.value as Priority)}
              className="bg-white/10 text-gray-300 text-xs rounded-lg px-2 py-1 focus:outline-none border border-white/10"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <input
              type="date"
              value={newDueDate}
              onChange={e => setNewDueDate(e.target.value)}
              className="bg-white/10 text-gray-300 text-xs rounded-lg px-2 py-1 focus:outline-none border border-white/10"
            />
            <input
              placeholder="Assign to..."
              value={newAssignee}
              onChange={e => setNewAssignee(e.target.value)}
              className="bg-white/10 text-gray-300 text-xs rounded-lg px-2 py-1 focus:outline-none border border-white/10 w-28"
            />
            <div className="ml-auto flex gap-1">
              <button onClick={handleAdd} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition-colors">
                Add
              </button>
              <button onClick={() => setShowAddForm(false)} className="px-3 py-1 bg-white/10 hover:bg-white/20 text-gray-300 text-xs rounded-lg transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Todo list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-gray-400 font-medium">
              {filter === 'done' ? 'No completed tasks yet' : 'All clear! No tasks here.'}
            </p>
            <p className="text-gray-600 text-sm mt-1">Click "Add" to create a new to-do</p>
          </div>
        ) : filtered.map(todo => (
          <div
            key={todo.id}
            className={`group flex items-start gap-3 p-3 rounded-xl border transition-all hover:bg-white/5 ${
              todo.completed
                ? 'border-white/5 opacity-60'
                : isOverdue(todo)
                  ? 'border-red-500/20 bg-red-500/5'
                  : 'border-white/10 bg-white/3'
            }`}
          >
            {/* Checkbox */}
            <button
              onClick={() => updateItem(todo.id, { completed: !todo.completed } as Partial<TodoItem>)}
              className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                todo.completed
                  ? 'bg-indigo-500 border-indigo-500'
                  : 'border-gray-600 hover:border-indigo-400'
              }`}
            >
              {todo.completed && <Check size={10} className="text-white" />}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {editingId === todo.id ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleEditSave(todo); if (e.key === 'Escape') setEditingId(null) }}
                    className="flex-1 bg-white/10 text-white text-sm px-2 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button onClick={() => handleEditSave(todo)} className="text-green-400 hover:text-green-300"><Check size={14} /></button>
                  <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-300"><X size={14} /></button>
                </div>
              ) : (
                <p className={`text-sm font-medium ${todo.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                  {todo.text}
                </p>
              )}

              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${PRIORITY_BG[todo.priority]}`}>
                  {todo.priority}
                </span>
                {todo.dueDate && (
                  <span className={`flex items-center gap-1 text-xs ${isOverdue(todo) ? 'text-red-400' : 'text-gray-500'}`}>
                    <Clock size={10} />
                    {format(parseISO(todo.dueDate), 'MMM d')}
                    {isOverdue(todo) && ' · Overdue'}
                  </span>
                )}
                {todo.tags.map(tag => (
                  <span key={tag} className="text-xs text-gray-600">#{tag}</span>
                ))}
                {todo.assignee && (
                  <span className="text-xs text-gray-500">👤 {todo.assignee}</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => updateItem(todo.id, { isStarred: !todo.isStarred } as Partial<TodoItem>)}
                className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${todo.isStarred ? 'text-amber-400' : 'text-gray-600'}`}
              >
                <Star size={13} fill={todo.isStarred ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={() => { setEditingId(todo.id); setEditText(todo.text) }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-600 hover:text-gray-300 transition-colors"
              >
                <Edit3 size={13} />
              </button>
              <button
                onClick={() => setMoveModal(true, todo.id)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-600 hover:text-gray-300 transition-colors"
              >
                <Move size={13} />
              </button>
              <button
                onClick={() => deleteItem(todo.id)}
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
