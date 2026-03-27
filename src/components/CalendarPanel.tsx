import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { X, Calendar, Clock, ExternalLink, RefreshCw, Globe, Plus, Sparkles } from './icons'
import { getMockCalendarEvents, fetchCalendarEvents } from '../utils/calendar'
import { detectProjectFromText } from '../utils/ai'
import { format, parseISO } from 'date-fns'
import type { CalendarEvent } from '../types'

export default function CalendarPanel() {
  const { isCalendarOpen, setCalendarOpen, calendarEvents, setCalendarEvents, projects, items, addItem, activeProjectId, settings } = useStore()
  const [isLoading, setIsLoading] = useState(false)
  const [detectedProjects, setDetectedProjects] = useState<Record<string, string | null>>({})
  const [isDetecting, setIsDetecting] = useState(false)
  const [autoAddedCount, setAutoAddedCount] = useState(0)
  const [addedCalendarIds, setAddedCalendarIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (isCalendarOpen && calendarEvents.length === 0) {
      loadEvents()
    }
  }, [isCalendarOpen])

  if (!isCalendarOpen) return null

  const loadEvents = async () => {
    setIsLoading(true)
    if (settings.googleCalendarConnected && settings.googleAccessToken) {
      const events = await fetchCalendarEvents(settings.googleAccessToken)
      setCalendarEvents(events)
    } else {
      // Demo mode
      setCalendarEvents(getMockCalendarEvents())
    }
    setIsLoading(false)
  }

  const handleAIDetect = async () => {
    if (!settings.anthropicApiKey) return
    setIsDetecting(true)
    setAutoAddedCount(0)

    // Build a set of calendarIds already imported into workspace meetings
    const existingCalendarIds = new Set(
      items
        .filter(i => i.type === 'meeting')
        .map(i => (i as { calendarId?: string }).calendarId)
        .filter(Boolean) as string[]
    )

    const detected: Record<string, string | null> = {}
    let added = 0
    const newlyAdded = new Set<string>()

    for (const event of calendarEvents) {
      const result = await detectProjectFromText(
        `${event.title} ${event.description}`,
        projects
      )
      detected[event.id] = result.projectId

      // Auto-add to meetings if project detected AND not already imported
      if (result.projectId && !existingCalendarIds.has(event.id) && !addedCalendarIds.has(event.id)) {
        addItem({
          type: 'meeting',
          title: event.title,
          description: event.description,
          startTime: event.start,
          endTime: event.end,
          attendees: event.attendees,
          location: event.location,
          meetingUrl: event.meetingUrl,
          status: 'upcoming',
          notes: '',
          actionItems: [],
          calendarId: event.id,
          projectIds: [result.projectId],
          tags: ['calendar', 'ai-detected'],
          isStarred: false,
        })
        newlyAdded.add(event.id)
        added++
      }
    }

    setDetectedProjects(detected)
    setAddedCalendarIds(prev => new Set([...prev, ...newlyAdded]))
    setAutoAddedCount(added)
    setIsDetecting(false)
  }

  const handleAddToProject = (event: CalendarEvent, projectId?: string) => {
    const pid = projectId || detectedProjects[event.id] || activeProjectId
    if (!pid) return

    addItem({
      type: 'meeting',
      title: event.title,
      description: event.description,
      startTime: event.start,
      endTime: event.end,
      attendees: event.attendees,
      location: event.location,
      meetingUrl: event.meetingUrl,
      status: 'upcoming',
      notes: '',
      actionItems: [],
      calendarId: event.id,
      projectIds: [pid],
      tags: ['calendar'],
      isStarred: false,
    })
  }

  const getProjectColor = (eventId: string) => {
    const pid = detectedProjects[eventId]
    if (!pid) return null
    return projects.find(p => p.id === pid)?.color
  }

  const grouped = calendarEvents.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
    const date = format(parseISO(event.start), 'EEEE, MMM d')
    if (!acc[date]) acc[date] = []
    acc[date].push(event)
    return acc
  }, {})

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-end z-50 animate-fade-in">
      <div className="bg-gray-900 border-l border-white/15 h-full w-full max-w-sm shadow-2xl animate-slide-in flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-blue-400" />
            <div>
              <h3 className="text-white font-semibold text-sm">Upcoming Meetings</h3>
              <p className="text-xs text-gray-500">Next 7 days</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={loadEvents}
              className="p-1.5 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-white/10"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={() => setCalendarOpen(false)}
              className="p-1.5 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* AI Detect */}
        {settings.anthropicApiKey && calendarEvents.length > 0 && (
          <div className="px-4 py-3 border-b border-white/10 space-y-2">
            <button
              onClick={handleAIDetect}
              disabled={isDetecting}
              className="w-full flex items-center justify-center gap-2 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs rounded-xl transition-colors disabled:opacity-60"
            >
              {isDetecting ? (
                <><RefreshCw size={12} className="animate-spin" /> Detecting &amp; adding to projects...</>
              ) : (
                <><Sparkles size={12} /> AI: Detect &amp; Auto-Add to Projects</>
              )}
            </button>
            {autoAddedCount > 0 && (
              <p className="text-[11px] text-emerald-400 text-center animate-slide-in">
                ✓ {autoAddedCount} meeting{autoAddedCount !== 1 ? 's' : ''} auto-added to detected projects
              </p>
            )}
            {autoAddedCount === 0 && Object.keys(detectedProjects).length > 0 && !isDetecting && (
              <p className="text-[11px] text-gray-500 text-center">
                All detected events already imported
              </p>
            )}
          </div>
        )}

        {/* Events */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw size={20} className="text-gray-500 animate-spin" />
            </div>
          ) : calendarEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <Globe size={32} className="text-gray-600 mb-3" />
              <p className="text-gray-400 font-medium text-sm">No events found</p>
              <p className="text-gray-600 text-xs mt-1">Connect Google Calendar in Settings</p>
            </div>
          ) : (
            Object.entries(grouped).map(([date, events]) => (
              <div key={date}>
                <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm px-4 py-2 border-b border-white/5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{date}</p>
                </div>
                {events.map(event => {
                  const detected = detectedProjects[event.id]
                  const detectedProject = detected ? projects.find(p => p.id === detected) : null
                  const isAutoAdded = addedCalendarIds.has(event.id)
                  const alreadyInWorkspace = items.some(
                    i => i.type === 'meeting' && (i as { calendarId?: string }).calendarId === event.id
                  )
                  const isImported = isAutoAdded || alreadyInWorkspace
                  return (
                    <div key={event.id} className={`px-4 py-3 border-b border-white/5 hover:bg-white/3 group ${isImported ? 'opacity-75' : ''}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-gray-200 truncate">{event.title}</p>
                            {isImported && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded font-medium flex-shrink-0">
                                ✓ Added
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock size={10} />
                              {format(parseISO(event.start), 'h:mm a')}
                            </span>
                            {event.attendees.length > 0 && (
                              <span className="text-xs text-gray-600 truncate">
                                {event.attendees.slice(0, 2).join(', ')}
                                {event.attendees.length > 2 && ` +${event.attendees.length - 2}`}
                              </span>
                            )}
                          </div>
                          {detectedProject && (
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: detectedProject.color }} />
                              <span className="text-xs text-gray-500">{detectedProject.icon} {detectedProject.name}</span>
                            </div>
                          )}
                          {event.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{event.description}</p>
                          )}
                        </div>
                        {!isImported && (
                          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {event.meetingUrl && (
                              <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer"
                                className="p-1.5 rounded hover:bg-white/10 text-gray-600 hover:text-blue-400">
                                <ExternalLink size={12} />
                              </a>
                            )}
                            <button
                              onClick={() => handleAddToProject(event, detected || undefined)}
                              className="p-1.5 rounded hover:bg-indigo-500/20 text-gray-600 hover:text-indigo-400"
                              title="Add to project"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                      {!detected && !isImported && projects.length > 0 && (
                        <select
                          onChange={e => { if (e.target.value) handleAddToProject(event, e.target.value) }}
                          className="mt-2 w-full bg-white/5 text-gray-500 text-xs rounded-lg px-2 py-1 focus:outline-none border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <option value="">Add to project...</option>
                          {projects.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
                        </select>
                      )}
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Connect button */}
        {!settings.googleCalendarConnected && (
          <div className="p-4 border-t border-white/10">
            <div className="text-xs text-gray-500 text-center mb-2">
              Currently showing demo events
            </div>
            <button
              onClick={loadEvents}
              className="w-full py-2 bg-white/10 hover:bg-white/15 text-gray-300 text-xs rounded-xl transition-colors"
            >
              Refresh Demo Events
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
