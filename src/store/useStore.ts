import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Project, AnyItem, AppSettings, DailyBriefing, CalendarEvent,
  SectionType, TodoItem, TaskItem, FollowUpItem, ConversationItem,
  IdeaItem, ManagementItem, MeetingItem, NoteItem, PipelineDeal
} from '../types'
import { PROJECT_COLORS } from '../types'

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function now() {
  return new Date().toISOString()
}

interface StoreState {
  projects: Project[]
  items: AnyItem[]
  activeProjectId: string | null
  activeSection: SectionType | 'overview'
  settings: AppSettings
  briefings: DailyBriefing[]
  calendarEvents: CalendarEvent[]
  searchQuery: string
  isSearchOpen: boolean
  isBriefingOpen: boolean
  isCalendarOpen: boolean
  isMoveModalOpen: boolean
  moveItemId: string | null
  pipeline: PipelineDeal[]
  isPipelineOpen: boolean
  isMasterView: boolean
  cloudSyncStatus: 'idle' | 'syncing' | 'synced' | 'error' | 'unavailable'
  lastCloudSync: string | null

  // Project actions
  addProject: (name: string, color?: string, icon?: string, description?: string) => Project
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  setActiveProject: (id: string | null) => void
  reorderProjects: (ids: string[]) => void

  // Item actions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addItem: (item: any) => AnyItem
  updateItem: (id: string, updates: Partial<AnyItem>) => void
  deleteItem: (id: string) => void
  moveItemToProject: (itemId: string, newProjectIds: string[]) => void
  duplicateItem: (itemId: string) => void

  // Section
  setActiveSection: (section: SectionType | 'overview') => void

  // Settings
  updateSettings: (updates: Partial<AppSettings>) => void

  // Briefings
  addBriefing: (text: string) => DailyBriefing
  updateBriefing: (id: string, updates: Partial<DailyBriefing>) => void

  // Calendar
  setCalendarEvents: (events: CalendarEvent[]) => void

  // UI
  setSearchQuery: (q: string) => void
  setSearchOpen: (open: boolean) => void
  setBriefingOpen: (open: boolean) => void
  setCalendarOpen: (open: boolean) => void
  setMoveModal: (open: boolean, itemId?: string | null) => void

  // Pipeline
  addDeal: (deal: Partial<PipelineDeal>) => PipelineDeal
  updateDeal: (id: string, updates: Partial<PipelineDeal>) => void
  deleteDeal: (id: string) => void
  setPipelineOpen: (open: boolean) => void
  setMasterView: (v: boolean) => void
  setCloudSyncStatus: (status: StoreState['cloudSyncStatus'], lastSync?: string) => void
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  anthropicApiKey: '',
  googleCalendarConnected: false,
  googleAccessToken: '',
  googleTokenExpiry: 0,
  defaultView: 'todos',
  sidebarCollapsed: false,
}

const SAMPLE_PROJECTS: Project[] = [
  {
    id: 'project-1',
    name: 'Product Launch Q1',
    color: PROJECT_COLORS[0],
    icon: '🚀',
    description: 'Q1 product launch campaign and coordination',
    createdAt: now(),
    isArchived: false,
    order: 0,
  },
  {
    id: 'project-2',
    name: 'Engineering Roadmap',
    color: PROJECT_COLORS[2],
    icon: '⚙️',
    description: 'Technical roadmap and infrastructure improvements',
    createdAt: now(),
    isArchived: false,
    order: 1,
  },
  {
    id: 'project-3',
    name: 'Marketing Strategy',
    color: PROJECT_COLORS[4],
    icon: '📊',
    description: 'Marketing campaigns and brand strategy',
    createdAt: now(),
    isArchived: false,
    order: 2,
  },
]

const SAMPLE_ITEMS: AnyItem[] = [
  {
    id: 'todo-1', type: 'todo', text: 'Finalize launch announcement copy', completed: false,
    projectIds: ['project-1'], priority: 'high', tags: ['copy', 'launch'],
    isStarred: true, createdAt: now(), updatedAt: now(),
  } as TodoItem,
  {
    id: 'todo-2', type: 'todo', text: 'Review pricing strategy with team', completed: false,
    projectIds: ['project-1'], priority: 'urgent', tags: ['pricing'],
    isStarred: false, createdAt: now(), updatedAt: now(),
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  } as TodoItem,
  {
    id: 'todo-3', type: 'todo', text: 'Set up CI/CD pipeline for staging', completed: true,
    projectIds: ['project-2'], priority: 'medium', tags: ['devops'],
    isStarred: false, createdAt: now(), updatedAt: now(),
  } as TodoItem,
  {
    id: 'task-1', type: 'task', title: 'Build landing page', description: 'Design and implement the product launch landing page with animations and responsive layout.',
    status: 'in_progress', priority: 'high', progress: 65,
    projectIds: ['project-1'], tags: ['design', 'frontend'],
    isStarred: true, createdAt: now(), updatedAt: now(),
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    assignee: 'Sarah Chen',
  } as TaskItem,
  {
    id: 'task-2', type: 'task', title: 'API rate limiting implementation', description: 'Implement rate limiting middleware for all public API endpoints.',
    status: 'todo', priority: 'medium', progress: 0,
    projectIds: ['project-2'], tags: ['backend', 'security'],
    isStarred: false, createdAt: now(), updatedAt: now(),
    assignee: 'Alex Kumar',
  } as TaskItem,
  {
    id: 'followup-1', type: 'followup', title: 'Follow up on partnership proposal',
    contact: 'Mike Johnson (Acme Corp)', description: 'Awaiting feedback on the co-marketing proposal sent last week.',
    status: 'pending', channel: 'email',
    projectIds: ['project-3'], tags: ['partnership'],
    isStarred: true, createdAt: now(), updatedAt: now(),
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
  } as FollowUpItem,
  {
    id: 'conversation-1', type: 'conversation', title: 'Launch timeline discussion',
    participants: ['Sarah Chen', 'Alex Kumar', 'You'],
    summary: 'Ongoing discussion about final launch date and go-to-market strategy.',
    status: 'open', lastUpdated: now(),
    messages: [
      { author: 'Sarah Chen', text: 'Can we move the launch to March 15th?', time: new Date(Date.now() - 3600000).toISOString() },
      { author: 'You', text: 'Let me check with the engineering team first.', time: new Date(Date.now() - 1800000).toISOString() },
    ],
    projectIds: ['project-1'], tags: ['launch', 'timeline'],
    isStarred: false, createdAt: now(), updatedAt: now(),
  } as ConversationItem,
  {
    id: 'idea-1', type: 'idea', title: 'Viral referral program',
    description: 'Add a referral mechanism where users get 1 month free for each new user they bring in. Could be a significant growth driver.',
    category: 'Growth', status: 'exploring', impact: 'high',
    projectIds: ['project-1', 'project-3'], tags: ['growth', 'viral'],
    isStarred: true, createdAt: now(), updatedAt: now(),
  } as IdeaItem,
  {
    id: 'mgmt-1', type: 'management', title: 'Headcount request for Q2',
    description: 'Need to discuss hiring 2 senior engineers and 1 product designer for Q2 to support roadmap.',
    priority: 'high', status: 'pending',
    projectIds: ['project-2'], tags: ['hiring', 'headcount'],
    isStarred: false, createdAt: now(), updatedAt: now(),
    targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  } as ManagementItem,
  {
    id: 'meeting-1', type: 'meeting', title: 'Weekly Product Sync',
    description: 'Weekly sync with product and engineering teams',
    startTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 10 * 3600000).toISOString(),
    endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 11 * 3600000).toISOString(),
    attendees: ['Sarah Chen', 'Alex Kumar', 'Product Team'],
    status: 'upcoming', notes: '', actionItems: [],
    projectIds: ['project-1', 'project-2'], tags: ['recurring'],
    isStarred: false, createdAt: now(), updatedAt: now(),
  } as MeetingItem,
  {
    id: 'note-1', type: 'note', title: 'Brand Voice Guidelines',
    content: '# Brand Voice\n\n- **Tone**: Confident but approachable\n- **Style**: Clear, concise, no jargon\n- **Values**: Innovation, trust, simplicity\n\n## Key Messages\n1. We solve real problems\n2. Built for scale\n3. Customer-first always',
    color: '#6366f1',
    projectIds: ['project-3'], tags: ['brand', 'guidelines'],
    isStarred: true, createdAt: now(), updatedAt: now(),
  } as NoteItem,
]

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      projects: SAMPLE_PROJECTS,
      items: SAMPLE_ITEMS,
      activeProjectId: 'project-1',
      activeSection: 'todos',
      settings: DEFAULT_SETTINGS,
      briefings: [],
      calendarEvents: [],
      searchQuery: '',
      isSearchOpen: false,
      isBriefingOpen: false,
      isCalendarOpen: false,
      isMoveModalOpen: false,
      moveItemId: null,
      pipeline: [],
      isPipelineOpen: false,
      isMasterView: true,
      cloudSyncStatus: 'idle',
      lastCloudSync: null,

      addProject: (name, color, icon = '📁', description = '') => {
        const usedColors = get().projects.map(p => p.color)
        const availableColor = PROJECT_COLORS.find(c => !usedColors.includes(c)) || PROJECT_COLORS[0]
        const project: Project = {
          id: genId(),
          name,
          color: color || availableColor,
          icon,
          description,
          createdAt: now(),
          isArchived: false,
          order: get().projects.length,
        }
        set(s => ({ projects: [...s.projects, project] }))
        return project
      },

      updateProject: (id, updates) =>
        set(s => ({ projects: s.projects.map(p => p.id === id ? { ...p, ...updates } : p) })),

      deleteProject: (id) =>
        set(s => ({
          projects: s.projects.filter(p => p.id !== id),
          items: s.items.filter(i => !i.projectIds.includes(id) || i.projectIds.length > 1).map(i => ({
            ...i, projectIds: i.projectIds.filter(pid => pid !== id)
          })),
          activeProjectId: s.activeProjectId === id ? (s.projects.find(p => p.id !== id)?.id || null) : s.activeProjectId,
        })),

      setActiveProject: (id) => set({ activeProjectId: id }),

      reorderProjects: (ids) =>
        set(s => ({
          projects: ids.map((id, order) => {
            const p = s.projects.find(p => p.id === id)!
            return { ...p, order }
          })
        })),

      addItem: (item) => {
        const newItem = { ...item, id: genId(), createdAt: now(), updatedAt: now() } as AnyItem
        set(s => ({ items: [...s.items, newItem] }))
        return newItem
      },

      updateItem: (id, updates) =>
        set(s => ({
          items: s.items.map(i => i.id === id ? { ...i, ...updates, updatedAt: now() } as AnyItem : i)
        })),

      deleteItem: (id) =>
        set(s => ({ items: s.items.filter(i => i.id !== id) })),

      moveItemToProject: (itemId, newProjectIds) =>
        set(s => ({
          items: s.items.map(i => i.id === itemId ? { ...i, projectIds: newProjectIds, updatedAt: now() } as AnyItem : i)
        })),

      duplicateItem: (itemId) => {
        const item = get().items.find(i => i.id === itemId)
        if (!item) return
        const dup = { ...item, id: genId(), createdAt: now(), updatedAt: now(), isStarred: false } as AnyItem
        set(s => ({ items: [...s.items, dup] }))
      },

      setActiveSection: (section) => set({ activeSection: section }),

      updateSettings: (updates) =>
        set(s => ({ settings: { ...s.settings, ...updates } })),

      addBriefing: (text) => {
        const briefing: DailyBriefing = {
          id: genId(),
          date: new Date().toISOString().split('T')[0],
          rawText: text,
          parsedItems: [],
          isProcessed: false,
        }
        set(s => ({ briefings: [briefing, ...s.briefings] }))
        return briefing
      },

      updateBriefing: (id, updates) =>
        set(s => ({ briefings: s.briefings.map(b => b.id === id ? { ...b, ...updates } : b) })),

      setCalendarEvents: (events) => set({ calendarEvents: events }),

      setSearchQuery: (q) => set({ searchQuery: q }),
      setSearchOpen: (open) => set({ isSearchOpen: open }),
      setBriefingOpen: (open) => set({ isBriefingOpen: open }),
      setCalendarOpen: (open) => set({ isCalendarOpen: open }),
      setMoveModal: (open, itemId = null) => set({ isMoveModalOpen: open, moveItemId: itemId }),

      addDeal: (deal) => {
        const newDeal: PipelineDeal = {
          id: genId(),
          clientName: '',
          internalPOC: '',
          clientPOC: '',
          status: 'cold',
          notes: '',
          value: '',
          createdAt: now(),
          updatedAt: now(),
          ...deal,
        }
        set(s => ({ pipeline: [...s.pipeline, newDeal] }))
        return newDeal
      },

      updateDeal: (id, updates) =>
        set(s => ({
          pipeline: s.pipeline.map(d => d.id === id ? { ...d, ...updates, updatedAt: now() } : d)
        })),

      deleteDeal: (id) =>
        set(s => ({ pipeline: s.pipeline.filter(d => d.id !== id) })),

      setPipelineOpen: (open) => set({ isPipelineOpen: open }),
      setMasterView: (v) => set({ isMasterView: v }),
      setCloudSyncStatus: (status, lastSync) =>
        set({ cloudSyncStatus: status, ...(lastSync ? { lastCloudSync: lastSync } : {}) }),
    }),
    {
      name: 'workspace-storage',
      partialize: (state) => ({
        projects: state.projects,
        items: state.items,
        settings: state.settings,
        briefings: state.briefings,
        activeProjectId: state.activeProjectId,
        activeSection: state.activeSection,
        pipeline: state.pipeline,
      }),
    }
  )
)
