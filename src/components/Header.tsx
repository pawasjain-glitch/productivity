import { useStore } from '../store/useStore'
import { Search, Zap, Calendar, Settings, Moon, Sun, Sparkles, Star } from './icons'
import { useEffect, useState } from 'react'
import SettingsPanel from './SettingsPanel'
import { initAI } from '../utils/ai'
import { format } from 'date-fns'

export default function Header() {
  const { setSearchOpen, setBriefingOpen, setCalendarOpen, settings, updateSettings, items } = useStore()
  const [showSettings, setShowSettings] = useState(false)

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
            <h1 className="text-sm font-bold text-white tracking-tight">WorkSpace</h1>
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
          {starred > 0 && (
            <button className="flex items-center gap-1 px-2 py-1.5 text-amber-400/80 hover:text-amber-400 text-xs rounded-lg hover:bg-amber-500/10 transition-colors">
              <Star size={13} fill="currentColor" />
              <span>{starred}</span>
            </button>
          )}

          <button
            onClick={() => setBriefingOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-xs rounded-xl transition-colors"
          >
            <Zap size={13} />
            <span>Daily Briefing</span>
          </button>

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
    </>
  )
}
