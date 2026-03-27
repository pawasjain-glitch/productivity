import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import { Search, X } from './icons'
import { SectionIcon } from './icons'
import type { AnyItem, SectionType } from '../types'
import { SECTION_LABELS } from '../types'

function getItemTitle(item: AnyItem): string {
  const i = item as unknown as Record<string, unknown>
  return (i.text || i.title || '') as string
}

function getItemPreview(item: AnyItem): string {
  const i = item as unknown as Record<string, unknown>
  return (i.description || i.summary || i.content || '') as string
}

export default function GlobalSearch() {
  const { isSearchOpen, setSearchOpen, searchQuery, setSearchQuery, items, projects, setActiveProject, setActiveSection } = useStore()
  const [localQuery, setLocalQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setLocalQuery('')
    }
  }, [isSearchOpen])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(!isSearchOpen)
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setSearchOpen(false)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isSearchOpen, setSearchOpen])

  if (!isSearchOpen) return null

  const query = localQuery.toLowerCase().trim()

  const results = query.length < 2 ? [] : items.filter(item => {
    const title = getItemTitle(item).toLowerCase()
    const preview = getItemPreview(item).toLowerCase()
    return title.includes(query) || preview.includes(query)
  }).slice(0, 10)

  const handleSelect = (item: AnyItem) => {
    const projectId = item.projectIds[0]
    if (projectId) {
      setActiveProject(projectId)
      setActiveSection(item.type as SectionType)
    }
    setSearchOpen(false)
    setLocalQuery('')
  }

  const getProjectName = (ids: string[]) => {
    return ids.map(id => projects.find(p => p.id === id)?.name).filter(Boolean).join(', ')
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 z-50 animate-fade-in"
      onClick={() => setSearchOpen(false)}
    >
      <div
        className="bg-gray-900 border border-white/15 rounded-2xl w-full max-w-xl shadow-2xl animate-scale-in overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <Search size={18} className="text-gray-500 flex-shrink-0" />
          <input
            ref={inputRef}
            placeholder="Search across all projects..."
            value={localQuery}
            onChange={e => setLocalQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <kbd className="text-xs text-gray-600 bg-white/5 px-1.5 py-0.5 rounded">ESC</kbd>
            <button onClick={() => setSearchOpen(false)} className="text-gray-600 hover:text-gray-300 p-1">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Results */}
        {localQuery.length >= 2 && (
          <div className="max-h-80 overflow-y-auto">
            {results.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-sm">
                No results for "{localQuery}"
              </div>
            ) : results.map(item => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-b-0"
              >
                <SectionIcon section={item.type as SectionType} size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 truncate">{getItemTitle(item)}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">{SECTION_LABELS[item.type as SectionType]}</span>
                    {item.projectIds.length > 0 && (
                      <>
                        <span className="text-gray-700">·</span>
                        <span className="text-xs text-gray-600 truncate">{getProjectName(item.projectIds)}</span>
                      </>
                    )}
                  </div>
                  {getItemPreview(item) && (
                    <p className="text-xs text-gray-600 truncate mt-0.5">{getItemPreview(item)}</p>
                  )}
                </div>
                {item.isStarred && <span className="text-amber-400 text-xs flex-shrink-0">★</span>}
              </button>
            ))}
          </div>
        )}

        {localQuery.length < 2 && (
          <div className="py-6 text-center text-gray-600 text-xs">
            Type at least 2 characters to search
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-white/5 bg-white/3">
          <span className="text-xs text-gray-600">↵ to open</span>
          <span className="text-xs text-gray-600">⌘K to toggle</span>
        </div>
      </div>
    </div>
  )
}
