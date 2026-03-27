import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { X, Plus, Trash2, Search, TrendingUp, Bell, CheckCircle2 } from './icons'
import type { PipelineDeal, PipelineStatus } from '../types'
import { PIPELINE_STATUSES } from '../types'
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns'

const STATUS_MAP = Object.fromEntries(PIPELINE_STATUSES.map(s => [s.value, s]))

/* ─── Status Badge ───────────────────────────────────────────── */

function StatusBadge({ status, onChange }: { status: PipelineStatus; onChange: (s: PipelineStatus) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const s = STATUS_MAP[status]

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all hover:opacity-80"
        style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.color}33` }}
      >
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
        {s.label}
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-gray-900 border border-white/15 rounded-xl shadow-2xl py-1 min-w-[140px]">
          {PIPELINE_STATUSES.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 transition-colors ${status === opt.value ? 'opacity-100' : 'opacity-70'}`}
              style={{ color: opt.color }}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }} />
              {opt.label}
              {status === opt.value && <span className="ml-auto text-[10px] opacity-60">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Editable Cell ──────────────────────────────────────────── */

function EditableCell({
  value, placeholder, onChange, multiline = false, className = ''
}: {
  value: string; placeholder: string; onChange: (v: string) => void; multiline?: boolean; className?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  useEffect(() => { if (editing) ref.current?.focus() }, [editing])
  useEffect(() => { setDraft(value) }, [value])

  const commit = () => {
    setEditing(false)
    if (draft !== value) onChange(draft)
  }

  if (editing) {
    const props = {
      ref,
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !multiline) commit()
        if (e.key === 'Escape') { setDraft(value); setEditing(false) }
      },
      className: `w-full bg-indigo-500/10 border border-indigo-500/40 rounded-lg px-2 py-1 text-sm text-white outline-none resize-none ${className}`,
      placeholder,
    }
    return multiline
      ? <textarea {...props} rows={2} />
      : <input {...props} />
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className={`cursor-text px-2 py-1 rounded-lg hover:bg-white/5 text-sm min-h-[28px] transition-colors ${value ? 'text-gray-200' : 'text-gray-600'} ${className}`}
    >
      {value || <span className="italic text-gray-600">{placeholder}</span>}
    </div>
  )
}

/* ─── Follow-up Date Cell ────────────────────────────────────── */

function FollowUpCell({ deal, onDateChange }: {
  deal: PipelineDeal
  onDateChange: (date: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const date = deal.nextFollowUpDate ? parseISO(deal.nextFollowUpDate) : null

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Label & colour based on urgency
  let label = ''
  let labelClass = 'text-gray-500'
  let dotClass = ''

  if (date) {
    if (isPast(date) && !isToday(date)) {
      label = `Overdue · ${format(date, 'MMM d')}`
      labelClass = 'text-red-400'
      dotClass = 'bg-red-400'
    } else if (isToday(date)) {
      label = 'Today'
      labelClass = 'text-amber-400'
      dotClass = 'bg-amber-400'
    } else if (isTomorrow(date)) {
      label = 'Tomorrow'
      labelClass = 'text-blue-400'
      dotClass = 'bg-blue-400'
    } else {
      label = format(date, 'MMM d, yyyy')
      labelClass = 'text-emerald-400'
      dotClass = 'bg-emerald-400'
    }
  }

  return (
    <div ref={ref} className="relative px-2 py-1">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 text-xs hover:opacity-80 transition-opacity ${date ? labelClass : 'text-gray-600 hover:text-gray-400'}`}
      >
        {date ? (
          <>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotClass}`} />
            <Bell size={11} className="flex-shrink-0" />
            <span className="font-medium">{label}</span>
          </>
        ) : (
          <>
            <Bell size={11} />
            <span className="italic">Set follow-up...</span>
          </>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-gray-900 border border-white/15 rounded-xl shadow-2xl p-3 min-w-[220px]">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-semibold">Next Follow-up Date</p>
          <input
            type="date"
            defaultValue={deal.nextFollowUpDate?.slice(0, 10) || ''}
            min={new Date().toISOString().slice(0, 10)}
            className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 mb-3"
            onChange={e => {
              if (e.target.value) {
                onDateChange(e.target.value)
                setOpen(false)
              }
            }}
          />
          {date && (
            <button
              onClick={() => { onDateChange(null); setOpen(false) }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <X size={11} />
              Remove follow-up
            </button>
          )}
          {date && deal.followUpItemId && (
            <p className="text-[10px] text-gray-600 text-center mt-2 flex items-center justify-center gap-1">
              <CheckCircle2 size={10} className="text-emerald-500" />
              Synced to WLDD Core follow-ups
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────────── */

export default function SalesPipeline() {
  const { isPipelineOpen, setPipelineOpen, pipeline, addDeal, updateDeal, deleteDeal, projects, addItem, updateItem, deleteItem } = useStore()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<PipelineStatus | 'all'>('all')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  if (!isPipelineOpen) return null

  // Find "WLDD Core" project, fall back to first project
  const targetProject = projects.find(p => p.name.toLowerCase().includes('wldd') && p.name.toLowerCase().includes('core'))
    || projects.find(p => !p.isArchived)

  const handleFollowUpDate = (deal: PipelineDeal, date: string | null) => {
    if (!date) {
      // Remove: delete linked followup item and clear from deal
      if (deal.followUpItemId) {
        deleteItem(deal.followUpItemId)
      }
      updateDeal(deal.id, { nextFollowUpDate: undefined, followUpItemId: undefined })
      return
    }

    const isoDate = `${date}T09:00:00.000Z` // 9am on that date

    if (deal.followUpItemId) {
      // Update existing followup item's dueDate
      updateItem(deal.followUpItemId, { dueDate: date } as Parameters<typeof updateItem>[1])
      updateDeal(deal.id, { nextFollowUpDate: date })
    } else {
      // Create new FollowUpItem in WLDD Core (or first project)
      if (!targetProject) return
      const newItem = addItem({
        type: 'followup',
        title: `Follow up with ${deal.clientName || 'client'} (Pipeline)`,
        contact: deal.clientPOC || deal.clientName || 'Client',
        description: `Pipeline follow-up · ${deal.internalPOC ? `Internal: ${deal.internalPOC} · ` : ''}Status: ${STATUS_MAP[deal.status]?.label}${deal.notes ? ` · Notes: ${deal.notes}` : ''}`,
        dueDate: date,
        status: 'pending',
        channel: 'other',
        projectIds: [targetProject.id],
        tags: ['pipeline', 'sales'],
        isStarred: false,
      })
      updateDeal(deal.id, { nextFollowUpDate: date, followUpItemId: newItem.id })
    }
  }

  const handleDeleteDeal = (deal: PipelineDeal) => {
    // Also remove the linked followup item if it exists
    if (deal.followUpItemId) {
      deleteItem(deal.followUpItemId)
    }
    deleteDeal(deal.id)
    setConfirmDelete(null)
  }

  const filtered = pipeline.filter(d => {
    const q = search.toLowerCase()
    const matchesSearch = !q || [d.clientName, d.internalPOC, d.clientPOC, d.notes].some(f => f.toLowerCase().includes(q))
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const counts = PIPELINE_STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s.value] = pipeline.filter(d => d.status === s.value).length
    return acc
  }, {})

  const handleAdd = () => addDeal({ status: 'cold' })

  const col = 'px-3 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider'

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col animate-fade-in">
      <div className="flex-1 flex flex-col bg-gray-950 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gray-900/80 backdrop-blur flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <TrendingUp size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">Sales Pipeline</h2>
              <p className="text-xs text-gray-500">
                {pipeline.length} client{pipeline.length !== 1 ? 's' : ''}
                {targetProject && <span className="ml-2 text-emerald-600">· Follow-ups sync to {targetProject.name}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search clients..."
                className="bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 w-48"
              />
            </div>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as PipelineStatus | 'all')}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-gray-400 focus:outline-none focus:border-indigo-500/50"
            >
              <option value="all">All Statuses</option>
              {PIPELINE_STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label} ({counts[s.value] || 0})</option>
              ))}
            </select>

            <button
              onClick={handleAdd}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-emerald-900/30"
            >
              <Plus size={14} />
              Add Client
            </button>

            <button
              onClick={() => setPipelineOpen(false)}
              className="p-2 text-gray-500 hover:text-gray-300 hover:bg-white/10 rounded-xl transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Status summary pills */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-white/5 overflow-x-auto scrollbar-hide flex-shrink-0">
          <button
            onClick={() => setFilterStatus('all')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${filterStatus === 'all' ? 'bg-white/15 text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            All <span className="bg-white/10 px-1.5 py-0.5 rounded-full">{pipeline.length}</span>
          </button>
          {PIPELINE_STATUSES.filter(s => (counts[s.value] || 0) > 0).map(s => (
            <button
              key={s.value}
              onClick={() => setFilterStatus(filterStatus === s.value ? 'all' : s.value)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${filterStatus === s.value ? 'ring-1' : 'opacity-70 hover:opacity-100'}`}
              style={{
                backgroundColor: s.bg,
                color: s.color,
                outline: filterStatus === s.value ? `1px solid ${s.color}` : undefined,
              }}
            >
              {s.label}
              <span className="font-bold">{counts[s.value]}</span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {pipeline.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center pb-24">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 flex items-center justify-center mb-4">
                <TrendingUp size={28} className="text-emerald-400" />
              </div>
              <p className="text-gray-300 font-semibold text-lg mb-1">No clients yet</p>
              <p className="text-gray-600 text-sm mb-5">Start tracking your sales pipeline by adding your first client</p>
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors"
              >
                <Plus size={15} />
                Add First Client
              </button>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur">
                <tr className="border-b border-white/10">
                  <th className={`${col} w-10`}>#</th>
                  <th className={`${col} min-w-[180px]`}>Client Name</th>
                  <th className={`${col} min-w-[140px]`}>Internal POC</th>
                  <th className={`${col} min-w-[140px]`}>Client POC</th>
                  <th className={`${col} min-w-[140px]`}>Status</th>
                  <th className={`${col} min-w-[120px]`}>Deal Value</th>
                  <th className={`${col} min-w-[160px]`}>
                    <div className="flex items-center gap-1.5">
                      <Bell size={11} />
                      Next Follow-up
                    </div>
                  </th>
                  <th className={`${col} flex-1`}>Notes</th>
                  <th className={`${col} w-12`}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((deal: PipelineDeal, idx: number) => (
                  <tr
                    key={deal.id}
                    className="border-b border-white/5 hover:bg-white/[0.02] group transition-colors"
                  >
                    <td className="px-3 py-2 text-xs text-gray-600 text-center">{idx + 1}</td>

                    <td className="px-1 py-1">
                      <EditableCell
                        value={deal.clientName}
                        placeholder="Client name"
                        onChange={v => updateDeal(deal.id, { clientName: v })}
                        className="font-medium"
                      />
                    </td>

                    <td className="px-1 py-1">
                      <EditableCell
                        value={deal.internalPOC}
                        placeholder="Your team member"
                        onChange={v => updateDeal(deal.id, { internalPOC: v })}
                      />
                    </td>

                    <td className="px-1 py-1">
                      <EditableCell
                        value={deal.clientPOC}
                        placeholder="Their contact"
                        onChange={v => updateDeal(deal.id, { clientPOC: v })}
                      />
                    </td>

                    <td className="px-3 py-2">
                      <StatusBadge
                        status={deal.status}
                        onChange={s => updateDeal(deal.id, { status: s })}
                      />
                    </td>

                    <td className="px-1 py-1">
                      <EditableCell
                        value={deal.value || ''}
                        placeholder="e.g. $50k"
                        onChange={v => updateDeal(deal.id, { value: v })}
                      />
                    </td>

                    {/* Follow-up Date */}
                    <td className="py-1">
                      <FollowUpCell
                        deal={deal}
                        onDateChange={date => handleFollowUpDate(deal, date)}
                      />
                    </td>

                    <td className="px-1 py-1 max-w-[280px]">
                      <EditableCell
                        value={deal.notes}
                        placeholder="Add notes..."
                        onChange={v => updateDeal(deal.id, { notes: v })}
                        multiline
                      />
                    </td>

                    <td className="px-3 py-2">
                      {confirmDelete === deal.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteDeal(deal)}
                            className="text-[10px] text-rose-400 hover:text-rose-300 px-1.5 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-[10px] text-gray-500 hover:text-gray-300"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(deal.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {pipeline.length > 0 && (
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 w-full px-4 py-3 text-gray-600 hover:text-gray-400 hover:bg-white/3 transition-colors text-sm border-b border-white/5"
            >
              <Plus size={13} />
              Add another client
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
