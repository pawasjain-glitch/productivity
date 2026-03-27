import { useStore } from './store/useStore'
import Header from './components/Header'
import ProjectTabs from './components/ProjectTabs'
import SectionNav from './components/SectionNav'
import GlobalSearch from './components/GlobalSearch'
import DailyBriefing from './components/DailyBriefing'
import CalendarPanel from './components/CalendarPanel'
import MoveItemModal from './components/modals/MoveItemModal'
import ReminderNotifications from './components/ReminderNotifications'
import SalesPipeline from './components/SalesPipeline'
import TodoSection from './components/sections/TodoSection'
import TaskSection from './components/sections/TaskSection'
import FollowUpSection from './components/sections/FollowUpSection'
import ConversationSection from './components/sections/ConversationSection'
import IdeaSection from './components/sections/IdeaSection'
import ManagementSection from './components/sections/ManagementSection'
import MeetingSection from './components/sections/MeetingSection'
import NoteSection from './components/sections/NoteSection'
import OverviewSection from './components/sections/OverviewSection'

function SectionContent() {
  const { activeSection, activeProjectId } = useStore()

  if (!activeProjectId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏢</div>
          <p className="text-gray-400 font-medium">No project selected</p>
          <p className="text-gray-600 text-sm mt-1">Create or select a project to get started</p>
        </div>
      </div>
    )
  }

  switch (activeSection) {
    case 'overview': return <OverviewSection />
    case 'todos': return <TodoSection />
    case 'tasks': return <TaskSection />
    case 'followups': return <FollowUpSection />
    case 'conversations': return <ConversationSection />
    case 'ideas': return <IdeaSection />
    case 'management': return <ManagementSection />
    case 'meetings': return <MeetingSection />
    case 'notes': return <NoteSection />
    default: return <OverviewSection />
  }
}

export default function App() {
  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      <Header />
      <ProjectTabs />
      <div className="flex flex-1 overflow-hidden">
        <SectionNav />
        <main className="flex-1 overflow-hidden flex flex-col">
          <SectionContent />
        </main>
      </div>

      {/* Overlays */}
      <GlobalSearch />
      <DailyBriefing />
      <CalendarPanel />
      <MoveItemModal />
      <ReminderNotifications />
      <SalesPipeline />
    </div>
  )
}
