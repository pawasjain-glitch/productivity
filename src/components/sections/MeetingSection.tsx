import { useState } from 'react'
import { useStore } from '../../store/useStore'
import type { MeetingItem } from '../../types'
import { Plus, Trash2, Move, Calendar, Clock, ExternalLink, Check } from '../icons'
import { format, parseISO, isAfter, isBefore, addHours } from 'date-fns'

const STATUS_STYLES: Record<MeetingItem['status'], string> = {
  upcoming: 'bg-blue-500/15 text-blue-400',
  completed: 'bg-green-500/15 text-green-400',
  cancelled: 'bg-gray-500/10 text-gray-500',
}

export default function MeetingSection() {
  const { items, activeProjectId, addItem, updateItem, deleteItem, setMoveModal, calendarEvents } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [newAction, setNewAction] = useState('')
  const [form, setForm] = useState({
    title: '', description: '', startTime: '', endTime: '',
    attendees: '', location: '', meetingUrl: ''
  })

  const meetings = items
    .filter(i => i.type === 'meeting' && activeProjectId && i.projectIds.includes(activeProjectId))
    .map(i => i as MeetingItem)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

  const handleAdd = () => {
    if (!form.title.trim() || !form.startTime || !activeProjectId) return
    addItem({
      type: 'meeting',
      title: form.title.trim(),
      description: form.description,
      startTime: new Date(form.startTime).toISOString(),
      endTime: form.endTime ? new Date(form.endTime).toISOString() : undefined,
      attendees: form.attendees.split(',').map(s => s.trim()).filter(Boolean),
      location: form.location || undefined,
      meetingUrl: form.meetingUrl || undefined,
      status: 'upcoming',
      notes: '',
      actionItems: [],
      projectIds: [activeProjectId],
      tags: [],
      isStarred: false,
    })
    setForm({ title: '', description: '', startTime: '', endTime: '', attendees: '', location: '', meetingUrl: '' })
    setShowForm(false)
  }

  const isHappeningNow = (m: MeetingItem) => {
    const now = new Date()
    const start = parseISO(m.startTime)
    const end = m.endTime ? parseISO(m.endTime) : addHours(start, 1)
    return isAfter(now, start) && isBefore(now, end)
  }

  const handleAddAction = (meeting: MeetingItem) => {
    if (!newAction.trim()) return
    updateItem(meeting.id, {
      actionItems: [...meeting.actionItems, newAction.trim()]
    } as Partial<MeetingItem>)
    setNewAction('')
  }

  const upcoming = meetings.filter(m => m.status === 'upcoming')
  const completed = meetings.filter(m => m.status === 'completed')

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Meetings</h2>
          <span className="text-xs text-blue-400">{upcoming.length} upcoming</span>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
        >
          <Plus size={14} />
          Add Meeting
        </button>
      </div>

      {showForm && (
        <div className="mx-4 mt-3 p-4 bg-white/5 rounded-xl border border-white/10 animate-slide-in space-y-2.5">
          <input
            autoFocus
            placeholder="Meeting title..."
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full bg-transparent text-white placeholder-gray-500 text-sm font-medium focus:outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Start time</label>
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                className="w-full bg-white/10 text-gray-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none border border-white/10"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">End time</label>
              <input
                type="datetime-local"
                value={form.endTime}
                onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                className="w-full bg-white/10 text-gray-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none border border-white/10"
              />
            </div>
          </div>
          <input
            placeholder="Attendees (comma separated)..."
            value={form.attendees}
            onChange={e => setForm(f => ({ ...f, attendees: e.target.value }))}
            className="w-full bg-white/5 text-gray-300 placeholder-gray-600 text-xs rounded-lg px-3 py-2 focus:outline-none border border-white/10"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Location..."
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              className="bg-white/5 text-gray-300 placeholder-gray-600 text-xs rounded-lg px-3 py-2 focus:outline-none border border-white/10"
            />
            <input
              placeholder="Meeting URL..."
              value={form.meetingUrl}
              onChange={e => setForm(f => ({ ...f, meetingUrl: e.target.value }))}
              className="bg-white/5 text-gray-300 placeholder-gray-600 text-xs rounded-lg px-3 py-2 focus:outline-none border border-white/10"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition-colors">Add</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-1.5 bg-white/10 text-gray-300 text-xs rounded-lg transition-colors">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {meetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-3">📅</div>
            <p className="text-gray-400 font-medium">No meetings scheduled</p>
            <p className="text-gray-600 text-sm mt-1">Add meetings or connect Google Calendar</p>
          </div>
        ) : meetings.map(meeting => (
          <div
            key={meeting.id}
            className={`group border rounded-xl transition-all overflow-hidden ${
              isHappeningNow(meeting)
                ? 'border-green-500/30 bg-green-500/5'
                : meeting.status === 'cancelled'
                  ? 'border-white/5 opacity-50'
                  : 'border-white/10 bg-white/3 hover:bg-white/5'
            }`}
          >
            <div
              className="flex items-start gap-3 p-4 cursor-pointer"
              onClick={() => setExpandedId(expandedId === meeting.id ? null : meeting.id)}
            >
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex flex-col items-center justify-center">
                  <span className="text-xs font-bold text-gray-300">
                    {format(parseISO(meeting.startTime), 'd')}
                  </span>
                  <span className="text-xs text-gray-500">
                    {format(parseISO(meeting.startTime), 'MMM')}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-200">{meeting.title}</p>
                  {isHappeningNow(meeting) && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full animate-pulse">
                      Live now
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[meeting.status]}`}>
                    {meeting.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock size={10} />
                    {format(parseISO(meeting.startTime), 'h:mm a')}
                    {meeting.endTime && ` – ${format(parseISO(meeting.endTime), 'h:mm a')}`}
                  </span>
                  {meeting.attendees.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {meeting.attendees.slice(0, 2).join(', ')}
                      {meeting.attendees.length > 2 && ` +${meeting.attendees.length - 2}`}
                    </span>
                  )}
                  {meeting.location && <span className="text-xs text-gray-500">📍 {meeting.location}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={e => e.stopPropagation()}>
                {meeting.meetingUrl && (
                  <a href={meeting.meetingUrl} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 rounded hover:bg-white/10 text-gray-600 hover:text-blue-400 transition-colors">
                    <ExternalLink size={13} />
                  </a>
                )}
                {meeting.status === 'upcoming' && (
                  <button
                    onClick={() => updateItem(meeting.id, { status: 'completed' } as Partial<MeetingItem>)}
                    className="p-1.5 rounded hover:bg-green-500/20 text-gray-600 hover:text-green-400"
                    title="Mark completed"
                  >
                    <Check size={13} />
                  </button>
                )}
                <button onClick={() => setMoveModal(true, meeting.id)} className="p-1.5 rounded hover:bg-white/10 text-gray-600 hover:text-gray-300">
                  <Move size={13} />
                </button>
                <button onClick={() => deleteItem(meeting.id)} className="p-1.5 rounded hover:bg-red-500/20 text-gray-600 hover:text-red-400">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {expandedId === meeting.id && (
              <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3 animate-slide-in">
                {meeting.description && (
                  <p className="text-sm text-gray-400">{meeting.description}</p>
                )}

                {/* Notes */}
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block font-medium">Meeting Notes</label>
                  <textarea
                    placeholder="Capture notes, decisions, key points..."
                    value={meeting.notes}
                    onChange={e => updateItem(meeting.id, { notes: e.target.value } as Partial<MeetingItem>)}
                    rows={3}
                    className="w-full bg-white/5 text-gray-300 placeholder-gray-600 text-sm rounded-lg px-3 py-2 focus:outline-none resize-none border border-white/10"
                    onClick={e => e.stopPropagation()}
                  />
                </div>

                {/* Action items */}
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block font-medium">Action Items</label>
                  {meeting.actionItems.map((action, i) => (
                    <div key={i} className="flex items-center gap-2 py-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                      <span className="text-xs text-gray-300">{action}</span>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-1">
                    <input
                      placeholder="Add action item..."
                      value={newAction}
                      onChange={e => setNewAction(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddAction(meeting)}
                      className="flex-1 bg-white/5 text-gray-300 placeholder-gray-600 text-xs rounded-lg px-3 py-1.5 focus:outline-none border border-white/10"
                      onClick={e => e.stopPropagation()}
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAddAction(meeting) }}
                      className="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-xs transition-colors"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
