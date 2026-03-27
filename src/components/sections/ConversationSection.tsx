import { useState } from 'react'
import { useStore } from '../../store/useStore'
import type { ConversationItem } from '../../types'
import { Plus, Trash2, Move, Send, MessageSquare } from '../icons'
import { format, parseISO } from 'date-fns'

const STATUS_STYLES = {
  open: 'bg-blue-500/15 text-blue-400',
  resolved: 'bg-green-500/15 text-green-400',
  waiting: 'bg-amber-500/15 text-amber-400',
}

export default function ConversationSection() {
  const { items, activeProjectId, addItem, updateItem, deleteItem, setMoveModal } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [form, setForm] = useState({ title: '', participants: '', summary: '' })

  const conversations = items
    .filter(i => i.type === 'conversation' && activeProjectId && i.projectIds.includes(activeProjectId))
    .map(i => i as ConversationItem)
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())

  const handleAdd = () => {
    if (!form.title.trim() || !activeProjectId) return
    addItem({
      type: 'conversation',
      title: form.title.trim(),
      participants: form.participants.split(',').map(s => s.trim()).filter(Boolean),
      summary: form.summary,
      status: 'open',
      lastUpdated: new Date().toISOString(),
      messages: [],
      projectIds: [activeProjectId],
      tags: [],
      isStarred: false,
    })
    setForm({ title: '', participants: '', summary: '' })
    setShowForm(false)
  }

  const handleAddMessage = (conv: ConversationItem) => {
    if (!newMessage.trim()) return
    const updated: Partial<ConversationItem> = {
      messages: [...conv.messages, { author: 'You', text: newMessage.trim(), time: new Date().toISOString() }],
      lastUpdated: new Date().toISOString(),
    }
    updateItem(conv.id, updated as Partial<ConversationItem>)
    setNewMessage('')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Open Conversations</h2>
          <span className="text-xs text-blue-400">{conversations.filter(c => c.status === 'open').length} open</span>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
        >
          <Plus size={14} />
          New
        </button>
      </div>

      {showForm && (
        <div className="mx-4 mt-3 p-4 bg-white/5 rounded-xl border border-white/10 animate-slide-in space-y-2.5">
          <input
            autoFocus
            placeholder="Conversation topic..."
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full bg-transparent text-white placeholder-gray-500 text-sm font-medium focus:outline-none"
          />
          <input
            placeholder="Participants (comma separated)..."
            value={form.participants}
            onChange={e => setForm(f => ({ ...f, participants: e.target.value }))}
            className="w-full bg-white/5 text-gray-300 placeholder-gray-600 text-sm rounded-lg px-3 py-2 focus:outline-none border border-white/10"
          />
          <textarea
            placeholder="Summary / context..."
            value={form.summary}
            onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
            rows={2}
            className="w-full bg-white/5 text-gray-300 placeholder-gray-600 text-sm rounded-lg px-3 py-2 focus:outline-none resize-none border border-white/10"
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition-colors">Add</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-1.5 bg-white/10 text-gray-300 text-xs rounded-lg transition-colors">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-3">💬</div>
            <p className="text-gray-400 font-medium">No conversations yet</p>
            <p className="text-gray-600 text-sm mt-1">Track ongoing discussions and threads</p>
          </div>
        ) : conversations.map(conv => (
          <div key={conv.id} className="border border-white/10 rounded-xl bg-white/3 hover:bg-white/5 transition-all overflow-hidden group">
            <div
              className="flex items-start gap-3 p-4 cursor-pointer"
              onClick={() => setExpandedId(expandedId === conv.id ? null : conv.id)}
            >
              <MessageSquare size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-200">{conv.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[conv.status]}`}>
                    {conv.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{conv.participants.join(', ')}</p>
                {conv.summary && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{conv.summary}</p>}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-gray-600">{conv.messages.length} messages</span>
                  <span className="text-xs text-gray-600">·</span>
                  <span className="text-xs text-gray-600">{format(parseISO(conv.lastUpdated), 'MMM d, h:mm a')}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <select
                  value={conv.status}
                  onChange={e => updateItem(conv.id, { status: e.target.value } as Partial<ConversationItem>)}
                  className="bg-white/10 text-gray-300 text-xs rounded px-1.5 py-0.5 border border-white/10 focus:outline-none"
                  onClick={e => e.stopPropagation()}
                >
                  <option value="open">Open</option>
                  <option value="waiting">Waiting</option>
                  <option value="resolved">Resolved</option>
                </select>
                <button onClick={() => setMoveModal(true, conv.id)} className="p-1.5 rounded hover:bg-white/10 text-gray-600 hover:text-gray-300">
                  <Move size={13} />
                </button>
                <button onClick={() => deleteItem(conv.id)} className="p-1.5 rounded hover:bg-red-500/20 text-gray-600 hover:text-red-400">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {expandedId === conv.id && (
              <div className="border-t border-white/5 animate-slide-in">
                {conv.summary && (
                  <div className="px-4 py-2 bg-white/5">
                    <p className="text-xs text-gray-500 leading-relaxed">{conv.summary}</p>
                  </div>
                )}
                {/* Messages */}
                {conv.messages.length > 0 && (
                  <div className="px-4 py-3 space-y-2 max-h-48 overflow-y-auto">
                    {conv.messages.map((msg, i) => (
                      <div key={i} className={`flex gap-2 ${msg.author === 'You' ? 'flex-row-reverse' : ''}`}>
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300">
                          {msg.author[0]}
                        </div>
                        <div className={`max-w-xs ${msg.author === 'You' ? 'items-end' : ''}`}>
                          <div className={`px-3 py-1.5 rounded-xl text-xs ${
                            msg.author === 'You'
                              ? 'bg-indigo-600/30 text-indigo-100'
                              : 'bg-white/10 text-gray-300'
                          }`}>
                            {msg.text}
                          </div>
                          <p className="text-gray-600 text-xs mt-0.5 px-1">
                            {format(parseISO(msg.time), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Add message */}
                <div className="px-4 pb-3 flex gap-2">
                  <input
                    placeholder="Add a note or update..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddMessage(conv)}
                    className="flex-1 bg-white/5 text-gray-300 placeholder-gray-600 text-xs rounded-lg px-3 py-1.5 focus:outline-none border border-white/10"
                    onClick={e => e.stopPropagation()}
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAddMessage(conv) }}
                    className="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
                  >
                    <Send size={13} className="text-white" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
