import { useState } from 'react'
import { useStore } from '../store/useStore'
import { X, Zap, Sparkles, Check, Plus, RefreshCw } from './icons'
import { parseBriefing } from '../utils/ai'
import type { SectionType } from '../types'
import { SECTION_LABELS } from '../types'

const SECTION_COLORS: Record<SectionType, string> = {
  todos: 'bg-indigo-500/15 text-indigo-400',
  tasks: 'bg-blue-500/15 text-blue-400',
  followups: 'bg-amber-500/15 text-amber-400',
  conversations: 'bg-purple-500/15 text-purple-400',
  ideas: 'bg-yellow-500/15 text-yellow-400',
  management: 'bg-red-500/15 text-red-400',
  meetings: 'bg-teal-500/15 text-teal-400',
  notes: 'bg-gray-500/15 text-gray-400',
}

export default function DailyBriefing() {
  const { isBriefingOpen, setBriefingOpen, settings, addBriefing, updateBriefing, briefings, projects, addItem } = useStore()
  const [text, setText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedItems, setProcessedItems] = useState<{ projectId: string | null; text: string; type: SectionType }[]>([])
  const [accepted, setAccepted] = useState<Set<number>>(new Set())
  const [step, setStep] = useState<'input' | 'review'>('input')

  if (!isBriefingOpen) return null

  const handleProcess = async () => {
    if (!text.trim()) return
    setIsProcessing(true)

    const briefing = addBriefing(text.trim())

    if (settings.anthropicApiKey) {
      const parsed = await parseBriefing(text.trim(), projects)
      setProcessedItems(parsed)
      updateBriefing(briefing.id, { parsedItems: parsed, isProcessed: true })
    } else {
      // Manual mode: split by newlines
      const lines = text.trim().split('\n').filter(Boolean)
      const parsed = lines.map(line => ({
        projectId: null as string | null,
        text: line.replace(/^[-•*]\s*/, ''),
        type: 'todos' as SectionType,
      }))
      setProcessedItems(parsed)
    }

    setIsProcessing(false)
    setStep('review')
    setAccepted(new Set(Array.from({ length: processedItems.length }, (_, i) => i)))
  }

  const handleAcceptAll = () => {
    processedItems.forEach((item, i) => {
      if (!item.projectId) return
      addItem({
        type: item.type as 'todos' | 'tasks' | 'followups' | 'conversations' | 'ideas' | 'management' | 'meetings' | 'notes',
        ...(item.type === 'todos'
          ? { text: item.text, completed: false, priority: 'medium' as const }
          : { title: item.text, description: '' }),
        projectIds: [item.projectId],
        tags: ['briefing'],
        isStarred: false,
        progress: 0,
        status: 'todo',
      } as Parameters<typeof addItem>[0])
    })
    handleClose()
  }

  const handleAddItem = (item: typeof processedItems[0]) => {
    if (!item.projectId) return
    const type = item.type
    addItem({
      type: type === 'todos' ? 'todo' : type as 'todo',
      ...(type === 'todos'
        ? { text: item.text, completed: false, priority: 'medium' as const }
        : { title: item.text, description: '' }),
      projectIds: [item.projectId],
      tags: ['briefing'],
      isStarred: false,
    } as Parameters<typeof addItem>[0])
  }

  const handleClose = () => {
    setBriefingOpen(false)
    setText('')
    setProcessedItems([])
    setAccepted(new Set())
    setStep('input')
  }

  const getProjectName = (id: string | null) => {
    if (!id) return 'Unassigned'
    return projects.find(p => p.id === id)?.name || 'Unknown'
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-gray-900 border border-white/15 rounded-2xl w-full max-w-2xl shadow-2xl animate-scale-in flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center">
              <Zap size={16} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Daily Briefing</h3>
              <p className="text-xs text-gray-500">AI-powered task distribution across projects</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-300 p-1.5 rounded-xl hover:bg-white/10">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === 'input' ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 font-medium mb-2 block">
                  Paste your daily briefing or to-do list
                </label>
                <textarea
                  autoFocus
                  placeholder={`Paste your daily tasks here... For example:
• Review product launch timeline with Sarah
• Follow up with Mike at Acme Corp about the proposal
• Fix the API rate limiting bug
• Prepare Q2 headcount proposal for management
• Meeting with investors at 3pm
• Brainstorm viral referral campaign ideas`}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  rows={10}
                  className="w-full bg-white/5 text-gray-200 placeholder-gray-600 text-sm rounded-xl px-4 py-3 focus:outline-none resize-none border border-white/10 focus:border-indigo-500/50 leading-relaxed font-mono"
                />
              </div>

              {!settings.anthropicApiKey && (
                <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400">
                  <Sparkles size={14} />
                  <span>Add your Anthropic API key in Settings for AI-powered auto-categorization</span>
                </div>
              )}

              {/* Previous briefings */}
              {briefings.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Recent briefings:</p>
                  <div className="space-y-1">
                    {briefings.slice(0, 3).map(b => (
                      <button
                        key={b.id}
                        onClick={() => setText(b.rawText)}
                        className="w-full text-left p-2 bg-white/5 rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:bg-white/10 transition-colors truncate"
                      >
                        {b.date}: {b.rawText.slice(0, 80)}...
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-300">
                  Found <span className="text-white font-semibold">{processedItems.length}</span> items
                </p>
                <button
                  onClick={() => setStep('input')}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <RefreshCw size={12} />
                  Edit input
                </button>
              </div>

              {processedItems.map((item, i) => {
                const project = projects.find(p => p.id === item.projectId)
                return (
                  <div key={i} className="flex items-start gap-3 p-3 border border-white/10 rounded-xl bg-white/3 hover:bg-white/5 transition-all">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 mb-1.5">{item.text}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SECTION_COLORS[item.type]}`}>
                          {SECTION_LABELS[item.type]}
                        </span>
                        {item.projectId ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project?.color }} />
                            <span className="text-xs text-gray-500">{project?.icon} {getProjectName(item.projectId)}</span>
                          </div>
                        ) : (
                          <select
                            onChange={e => {
                              const updated = [...processedItems]
                              updated[i] = { ...updated[i], projectId: e.target.value || null }
                              setProcessedItems(updated)
                            }}
                            className="bg-white/10 text-gray-400 text-xs rounded px-2 py-0.5 focus:outline-none border border-white/10"
                          >
                            <option value="">Assign project...</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
                          </select>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddItem(item)}
                      disabled={!item.projectId}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 disabled:opacity-30 disabled:cursor-not-allowed text-indigo-400 text-xs rounded-lg transition-colors flex-shrink-0"
                    >
                      <Plus size={12} />
                      Add
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-5 border-t border-white/10">
          {step === 'input' ? (
            <>
              <button
                onClick={handleProcess}
                disabled={!text.trim() || isProcessing}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    Processing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    {settings.anthropicApiKey ? 'Process with AI' : 'Parse Briefing'}
                  </>
                )}
              </button>
              <button onClick={handleClose} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-gray-300 text-sm rounded-xl transition-colors">
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleAcceptAll}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors"
              >
                <Check size={15} />
                Add All to Projects
              </button>
              <button onClick={handleClose} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-gray-300 text-sm rounded-xl transition-colors">
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
