export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type Status = 'todo' | 'in_progress' | 'done' | 'blocked'
export type SectionType = 'todos' | 'tasks' | 'followups' | 'conversations' | 'ideas' | 'management' | 'meetings' | 'notes'

export interface BaseItem {
  id: string
  createdAt: string
  updatedAt: string
  projectIds: string[] // can belong to multiple projects
  tags: string[]
  isStarred: boolean
}

export interface TodoItem extends BaseItem {
  type: 'todo'
  text: string
  completed: boolean
  dueDate?: string
  priority: Priority
}

export interface TaskItem extends BaseItem {
  type: 'task'
  title: string
  description: string
  status: Status
  priority: Priority
  dueDate?: string
  assignee?: string
  progress: number // 0-100
}

export interface FollowUpItem extends BaseItem {
  type: 'followup'
  title: string
  contact: string
  description: string
  dueDate?: string
  status: 'pending' | 'done' | 'overdue'
  channel: 'email' | 'call' | 'meeting' | 'message' | 'other'
}

export interface ConversationItem extends BaseItem {
  type: 'conversation'
  title: string
  participants: string[]
  summary: string
  status: 'open' | 'resolved' | 'waiting'
  lastUpdated: string
  messages: { author: string; text: string; time: string }[]
}

export interface IdeaItem extends BaseItem {
  type: 'idea'
  title: string
  description: string
  category: string
  status: 'raw' | 'exploring' | 'planned' | 'shelved'
  impact: 'low' | 'medium' | 'high'
}

export interface ManagementItem extends BaseItem {
  type: 'management'
  title: string
  description: string
  priority: Priority
  status: 'pending' | 'discussed' | 'actioned' | 'dropped'
  targetDate?: string
  outcome?: string
}

export interface MeetingItem extends BaseItem {
  type: 'meeting'
  title: string
  description: string
  startTime: string
  endTime?: string
  attendees: string[]
  location?: string
  meetingUrl?: string
  calendarId?: string
  notes: string
  actionItems: string[]
  status: 'upcoming' | 'completed' | 'cancelled'
}

export interface NoteItem extends BaseItem {
  type: 'note'
  title: string
  content: string
  color: string
}

export type AnyItem = TodoItem | TaskItem | FollowUpItem | ConversationItem | IdeaItem | ManagementItem | MeetingItem | NoteItem

export interface Project {
  id: string
  name: string
  color: string
  icon: string
  description: string
  createdAt: string
  isArchived: boolean
  order: number
}

export interface DailyBriefing {
  id: string
  date: string
  rawText: string
  parsedItems: {
    projectId: string | null
    text: string
    type: SectionType
  }[]
  isProcessed: boolean
}

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  attendees: string[]
  description: string
  location?: string
  meetingUrl?: string
  detectedProjectId?: string
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  anthropicApiKey: string
  googleCalendarConnected: boolean
  googleAccessToken: string
  defaultView: SectionType
  sidebarCollapsed: boolean
}

export type PipelineStatus = 'cold' | 'pitched' | 'deck_shared' | 'pricing' | 'negotiating' | 'approved' | 'declined' | 'on_hold'

export interface PipelineDeal {
  id: string
  clientName: string
  internalPOC: string
  clientPOC: string
  status: PipelineStatus
  notes: string
  value?: string
  createdAt: string
  updatedAt: string
}

export const PIPELINE_STATUSES: { value: PipelineStatus; label: string; color: string; bg: string }[] = [
  { value: 'cold',       label: 'Cold',        color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' },
  { value: 'pitched',    label: 'Pitched',      color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
  { value: 'deck_shared',label: 'Deck Shared',  color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
  { value: 'pricing',    label: 'Pricing',      color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
  { value: 'negotiating',label: 'Negotiating',  color: '#fb923c', bg: 'rgba(251,146,60,0.15)' },
  { value: 'approved',   label: 'Approved',     color: '#4ade80', bg: 'rgba(74,222,128,0.15)' },
  { value: 'declined',   label: 'Declined',     color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
  { value: 'on_hold',    label: 'On Hold',      color: '#e2e8f0', bg: 'rgba(226,232,240,0.10)' },
]

export const PROJECT_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f43f5e', // rose
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#a855f7', // purple
  '#ef4444', // red
]

export const SECTION_LABELS: Record<SectionType, string> = {
  todos: 'To-Dos',
  tasks: 'Tasks',
  followups: 'Follow-ups',
  conversations: 'Conversations',
  ideas: 'Ideas & Plans',
  management: 'TBD with Management',
  meetings: 'Meetings',
  notes: 'Notes',
}

export const SECTION_ICONS: Record<SectionType, string> = {
  todos: 'CheckSquare',
  tasks: 'Briefcase',
  followups: 'Bell',
  conversations: 'MessageSquare',
  ideas: 'Lightbulb',
  management: 'Users',
  meetings: 'Calendar',
  notes: 'FileText',
}
