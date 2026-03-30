import { useState, useRef } from 'react'
import { useStore } from '../store/useStore'
import { X, Settings, Eye, EyeOff, Globe, Sparkles, Check } from './icons'
import { initAI } from '../utils/ai'
import { initGoogleAuth } from '../utils/calendar'
import { pushCloud } from './CloudSync'

interface SettingsPanelProps {
  onClose: () => void
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { settings, updateSettings, projects, cloudSyncStatus, lastCloudSync } = useStore()
  const [showKey, setShowKey] = useState(false)
  const [apiKey, setApiKey] = useState(settings.anthropicApiKey)
  const [saved, setSaved] = useState(false)
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [calendarError, setCalendarError] = useState('')
  const [importError, setImportError] = useState('')
  const [importSuccess, setImportSuccess] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const state = useStore.getState()
    const data = {
      projects: state.projects,
      items: state.items,
      pipeline: state.pipeline,
      briefings: state.briefings,
      activeProjectId: state.activeProjectId,
      activeSection: state.activeSection,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workspace-data-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError('')
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        useStore.setState({
          projects: data.projects ?? [],
          items: data.items ?? [],
          pipeline: data.pipeline ?? [],
          briefings: data.briefings ?? [],
          activeProjectId: data.activeProjectId ?? null,
          activeSection: data.activeSection ?? 'todos',
        })
        setImportSuccess(true)
        setTimeout(() => setImportSuccess(false), 3000)
      } catch {
        setImportError('Invalid file — could not parse JSON.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const syncStatusColor = {
    idle: 'bg-gray-500',
    syncing: 'bg-yellow-400 animate-pulse',
    synced: 'bg-green-400',
    error: 'bg-red-400',
    unavailable: 'bg-gray-600',
  }[cloudSyncStatus]

  const syncStatusLabel = {
    idle: 'Idle',
    syncing: 'Syncing…',
    synced: lastCloudSync ? `Synced ${new Date(lastCloudSync).toLocaleTimeString()}` : 'Synced',
    error: 'Sync error',
    unavailable: 'Not configured',
  }[cloudSyncStatus]

  const handleSaveKey = () => {
    updateSettings({ anthropicApiKey: apiKey })
    initAI(apiKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-gray-900 border border-white/15 rounded-2xl w-full max-w-lg shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-gray-400" />
            <h3 className="text-white font-semibold">Settings</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 p-1.5 rounded-xl hover:bg-white/10">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* AI Settings */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-purple-400" />
              <h4 className="text-sm font-semibold text-gray-200">AI Features (Claude)</h4>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Anthropic API Key</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      placeholder="sk-ant-..."
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      className="w-full bg-white/5 text-gray-300 placeholder-gray-600 text-sm rounded-xl px-3 py-2 focus:outline-none border border-white/10 focus:border-indigo-500/50 pr-10"
                    />
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <button
                    onClick={handleSaveKey}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                      saved
                        ? 'bg-green-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {saved ? <Check size={14} /> : 'Save'}
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1.5">
                  Used for AI briefing parsing, project detection, and smart suggestions.
                  Your key is stored locally only.
                </p>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                <div>
                  <p className="text-xs font-medium text-gray-300">AI Status</p>
                  <p className="text-xs text-gray-500">
                    {settings.anthropicApiKey ? 'Connected to Claude' : 'Not configured'}
                  </p>
                </div>
                <div className={`w-2 h-2 rounded-full ${settings.anthropicApiKey ? 'bg-green-400' : 'bg-gray-600'}`} />
              </div>
            </div>
          </div>

          {/* Google Calendar */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Globe size={14} className="text-blue-400" />
              <h4 className="text-sm font-semibold text-gray-200">Google Calendar</h4>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-300">Calendar Integration</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {settings.googleCalendarConnected ? 'Connected ✓' : 'Demo mode (showing sample events)'}
                  </p>
                  {calendarError && <p className="text-xs text-rose-400 mt-1">{calendarError}</p>}
                </div>
                <button
                  onClick={async () => {
                    if (settings.googleCalendarConnected) {
                      updateSettings({ googleCalendarConnected: false, googleAccessToken: '' })
                      return
                    }
                    setCalendarError('')
                    setCalendarLoading(true)
                    try {
                      const { token, expiresAt } = await initGoogleAuth()
                      updateSettings({ googleCalendarConnected: true, googleAccessToken: token, googleTokenExpiry: expiresAt })
                    } catch (e) {
                      setCalendarError((e as Error).message || 'Connection failed')
                    }
                    setCalendarLoading(false)
                  }}
                  disabled={calendarLoading}
                  className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 text-xs rounded-lg transition-colors disabled:opacity-50"
                >
                  {calendarLoading ? 'Connecting…' : settings.googleCalendarConnected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div>
            <h4 className="text-sm font-semibold text-gray-200 mb-3">Appearance</h4>
            <div className="flex gap-2">
              {(['light', 'dark', 'system'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => updateSettings({ theme: t })}
                  className={`flex-1 py-2 text-xs font-medium rounded-xl border transition-all capitalize ${
                    settings.theme === t
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Data Sync */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-green-400 text-sm">☁</span>
              <h4 className="text-sm font-semibold text-gray-200">Data Sync</h4>
            </div>
            <div className="space-y-3">
              {/* Status */}
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                <div>
                  <p className="text-xs font-medium text-gray-300">Cloud Sync Status</p>
                  <p className="text-xs text-gray-500 mt-0.5">{syncStatusLabel}</p>
                </div>
                <div className={`w-2 h-2 rounded-full ${syncStatusColor}`} />
              </div>
              {cloudSyncStatus === 'unavailable' && (
                <p className="text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 leading-relaxed">
                  Cloud sync requires Upstash Redis. In Vercel → your project → Storage → Connect Database → Upstash KV, then redeploy.
                </p>
              )}
              {/* Sync Now button */}
              {cloudSyncStatus !== 'unavailable' && (
                <button
                  onClick={async () => {
                    setSyncing(true)
                    const s = useStore.getState()
                    const ok = await pushCloud({
                      projects: s.projects, items: s.items, pipeline: s.pipeline,
                      briefings: s.briefings, activeProjectId: s.activeProjectId,
                      activeSection: s.activeSection, syncedAt: new Date().toISOString(),
                    }).catch(() => false)
                    s.setCloudSyncStatus(ok ? 'synced' : 'error', ok ? new Date().toISOString() : undefined)
                    setSyncing(false)
                  }}
                  disabled={syncing}
                  className="w-full py-2 text-xs font-medium rounded-xl border border-indigo-500/30 bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20 transition-colors disabled:opacity-50"
                >
                  {syncing ? 'Syncing…' : '↑ Push My Data to Cloud'}
                </button>
              )}
              {/* Export / Import */}
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className="flex-1 py-2 text-xs font-medium rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
                >
                  ↓ Export Data
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex-1 py-2 text-xs font-medium rounded-xl border transition-colors ${
                    importSuccess
                      ? 'border-green-500/40 bg-green-500/10 text-green-400'
                      : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {importSuccess ? '✓ Imported!' : '↑ Import Data'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImport}
                />
              </div>
              {importError && (
                <p className="text-xs text-red-400">{importError}</p>
              )}
              <p className="text-xs text-gray-600">
                Use "Push My Data to Cloud" to sync to other devices. Export saves a local backup.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="p-3 bg-white/3 rounded-xl border border-white/5">
            <p className="text-xs font-medium text-gray-400 mb-2">Your Workspace</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-lg font-bold text-white">{projects.length}</p>
                <p className="text-xs text-gray-600">Projects</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-white">
                  {useStore.getState().items.length}
                </p>
                <p className="text-xs text-gray-600">Items</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-white">
                  {useStore.getState().items.filter(i => i.isStarred).length}
                </p>
                <p className="text-xs text-gray-600">Starred</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
