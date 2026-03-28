import { useStore } from '../store/useStore'
import { Search, Zap, Calendar, Settings, Moon, Sun, Star, TrendingUp, Bell } from './icons'
import { useEffect, useRef, useState } from 'react'
import SettingsPanel from './SettingsPanel'
import StarredItemsPanel from './StarredItemsPanel'
import NotificationCentre, { useNotificationCount } from './NotificationCentre'
import { initAI } from '../utils/ai'
import { format } from 'date-fns'

export default function Header() {
  const { setSearchOpen, setBriefingOpen, setCalendarOpen, setPipelineOpen, settings, updateSettings, items, pipeline } = useStore()
  const [showSettings, setShowSettings] = useState(false)
  const [showStarred, setShowStarred] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const notifCount = useNotificationCount()
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (settings.anthropicApiKey) initAI(settings.anthropicApiKey)
  }, [settings.anthropicApiKey])

  useEffect(() => {
    const theme = settings.theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : settings.theme
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [settings.theme])

  const starred = items.filter(i => i.isStarred).length
  const today = format(new Date(), 'EEEE, MMMM d')

  return (
    <>
      <header className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-gray-950/80 backdrop-blur-md z-10 flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <span className="text-white text-xs font-bold">W</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">Pawas' Workspace</h1>
            <p className="text-xs text-gray-600">{today}</p>
          </div>
        </div>

        {/* Center actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 text-sm transition-colors group"
          >
            <Search size={14} />
            <span className="text-xs">Search...</span>
            <kbd className="text-xs text-gray-600 bg-white/5 px-1.5 py-0.5 rounded ml-2">⌘K</kbd>
          </button>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowStarred(v => !v)}
            className={`flex items-center gap-1 px-2 py-1.5 text-xs rounded-lg transition-colors ${
              showStarred
                ? 'text-amber-400 bg-amber-500/15'
                : 'text-amber-400/80 hover:text-amber-400 hover:bg-amber-500/10'
            }`}
            title="Starred items"
          >
            <Star size={13} fill="currentColor" />
            {starred > 0 && <span>{starred}</span>}
          </button>

          <button
            onClick={() => setPipelineOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl transition-colors"
          >
            <TrendingUp size={13} />
            <span>Pipeline</span>
            {pipeline.length > 0 && (
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded-full font-medium">{pipeline.length}</span>
            )}
          </button>

          <button
            onClick={() => setBriefingOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-xs rounded-xl transition-colors"
          >
            <Zap size={13} />
            <span>Daily Briefing</span>
          </button>

          {/* Notification Centre bell */}
          <div ref={notifRef}>
            <button
              onClick={() => setShowNotifications(v => !v)}
              className={`relative p-2 rounded-xl transition-colors ${
                showNotifications
                  ? 'text-indigo-400 bg-indigo-500/15'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/10'
              }`}
              title="Notification Centre"
            >
              <Bell size={16} />
              {notifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-indigo-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 shadow-lg shadow-indigo-500/40">
                  {notifCount > 99 ? '99+' : notifCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <NotificationCentre onClose={() => setShowNotifications(false)} />
            )}
          </div>

          <button
            onClick={() => setCalendarOpen(true)}
            className="p-2 text-gray-500 hover:text-gray-300 rounded-xl hover:bg-white/10 transition-colors"
            title="Calendar"
          >
            <Calendar size={16} />
          </button>

          <button
            onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
            className="p-2 text-gray-500 hover:text-gray-300 rounded-xl hover:bg-white/10 transition-colors"
            title="Toggle theme"
          >
            {settings.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-500 hover:text-gray-300 rounded-xl hover:bg-white/10 transition-colors"
            title="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      {showStarred && <StarredItemsPanel onClose={() => setShowStarred(false)} />}
    </>
  )
}
