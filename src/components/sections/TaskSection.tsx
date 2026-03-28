import { useState } from 'react'
import { useStore } from '../../store/useStore'
import type { TaskItem, Priority, Status } from '../../types'
import { Plus, Star, Trash2, Edit3, Move, BarChart2, Clock, Check, X } from '../icons'
import { format, parseISO } from 'date-fns'

const STATUS_STYLES: Record<Status, string> = {
  todo: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  in_progress: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  done: 'bg-green-500/15 text-green-400 border-green-500/30',
  blocked: 'bg-red-500/15 text-red-400 border-red-500/30',
}

const STATUS_LABELS: Record<Status, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
  blocked: 'Blocked',
}

const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'text-gray-400',
  medium: 'text-blue-400',
  high: 'text-amber-400',
  urgent: 'text-red-400',
}

export default function TaskSection() {
  const { items, activeProjectId, addItem, updateItem, deleteItem, setMoveModal } = useStore()
  const [showAddForm, setShowAddForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium' as Priority,
    status: 'todo' as Status, dueDate: '', progress: 0
  })

  const tasks = items
    .filter(i => i.type === 'task' && activeProjectId && i.projectIds.includes(activeProjectId))
    .map(i => i as TaskItem)
    .sort((a, b) => {
      const sOrder = { blocked: 0, in_progress: 1, todo: 2, done: 3 }
      return sOrder[a.status] - sOrder[b.status]
    })

  const handleAdd = () => {
    if (!form.title.trim() || !activeProjectId) return
    addItem({
      type: 'task',
      title: form.title.trim(),
      description: form.description,
      priority: form.priority,
      status: form.status,
      dueDate: form.dueDate || undefined,
      progress: form.progress,
      projectIds: [activeProjectId],
      tags: [],
      isStarred: false,
    })
    setForm({ title: '', description: '', priority: 'medium', status: 'todo', dueDate: '', progress: 0 })
    setShowAddForm(false)
  }

  const stats = {
    total: tasks.length,
    done: tasks.filter(t => t.status === 'done').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Tasks</h2>
          <div className="flex gap-2 text-xs">
            <span className="text-blue-400">{stats.inProgress} active</span>
            {stats.blocked > 0 && <span className="text-red-400">{stats.blocked} blocked</span>}
            <span className="text-gray-500">{stats.done}/{stats.total} done</span>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
        >
          <Plus size={14} />
          Add Task
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="mx-4 mt-3 p-4 bg-white/5 rounded-xl border border-white/10 animate-slide-in space-y-3">
          <input
            autoFocus
            placeholder="Task title..."
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            onKeyDown={e => e.key === 'Escape' && setShowAddForm(false)}
            className="w-full bg-transparent text-white placeholder-gray-500 text-sm font-medium focus:outline-none"
          />
          <textarea
            placeholder="Description (optional)..."
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={2}
            className="w-full bg-white/5 text-gray-300 placeholder-gray-600 text-sm rounded-lg px-3 py-2 focus:outline-none resize-none border border-white/10"
          />
          <div className="flex flex-wrap gap-2">
            <select
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}
              className="bg-white/10 text-gray-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none border border-white/10"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value as Status }))}
              className="bg-white/10 text-gray-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none border border-white/10"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
              <option value="blocked">Blocked</option>
            </select>
            <input
              type="date"
              value={form.dueDate}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              className="bg-white/10 text-gray-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none border border-white/10"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleAdd} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition-colors">
              Add Task
            </button>
            <button onClick={() => setShowAddForm(false)} className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-gray-300 text-xs rounded-lg transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-3">📋</div>
            <p className="text-gray-400 font-medium">No tasks yet</p>
            <p className="text-gray-600 text-sm mt-1">Add your first task to get started</p>
          </div>
        ) : tasks.map(task => (
          <div
            key={task.id}
            className="group border border-white/10 rounded-xl bg-white/3 hover:bg-white/5 transition-all overflow-hidden"
          >
            <div
              className="flex items-start gap-3 p-3.5 cursor-pointer"
              onClick={() => setExpandedId(expandedId === task.id ? null : task.id)}
            >
              {/* Status badge */}
              <div className="flex-shrink-0 mt-0.5">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[task.status]}`}>
                  {STATUS_LABELS[task.status]}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                    {task.title}
                  </p>
                  <span className={`text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
                    {task.priority}
                  </span>
                </div>
                {task.description && !expandedId && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{task.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5">
                  {task.dueDate && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={10} />
                      {format(parseISO(task.dueDate), 'MMM d')}
                    </span>
                  )}
                  {task.progress > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{task.progress}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => updateItem(task.id, { isStarred: !task.isStarred } as Partial<TaskItem>)}
                  className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${task.isStarred ? 'text-amber-400' : 'text-gray-600'}`}
                >
                  <Star size={13} fill={task.isStarred ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={() => setMoveModal(true, task.id)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-600 hover:text-gray-300 transition-colors"
                >
                  <Move size={13} />
                </button>
                <button
                  onClick={() => deleteItem(task.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Expanded */}
            {expandedId === task.id && (
              <div className="px-4 pb-4 pt-0 border-t border-white/5 space-y-3 animate-slide-in">
                {task.description && (
                  <p className="text-sm text-gray-400 leading-relaxed">{task.description}</p>
                )}
                {/* Progress slider */}
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{task.progress}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={task.progress}
                    onChange={e => updateItem(task.id, { progress: Number(e.target.value) } as Partial<TaskItem>)}
                    className="w-full accent-indigo-500"
                  />
                </div>
                {/* Quick status change */}
                <div className="flex gap-1.5 flex-wrap">
                  {(['todo', 'in_progress', 'done', 'blocked'] as Status[]).map(s => (
                    <button
                      key={s}
                      onClick={() => updateItem(task.id, { status: s } as Partial<TaskItem>)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                        task.status === s
                          ? STATUS_STYLES[s]
                          : 'border-white/10 text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
