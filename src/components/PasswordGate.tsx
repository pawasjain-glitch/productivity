import { useState, useEffect, useCallback, useRef } from 'react'

// Module-level flag — resets to false on every page load/refresh
let _authenticated = false

const PASSWORD = '240909'
const TIMEOUT_MS = 30 * 60 * 1000   // 30 minutes
const ACTIVITY_KEY = 'ws_last_activity'

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState(!_authenticated)
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Track user activity to reset timeout
  const updateActivity = useCallback(() => {
    sessionStorage.setItem(ACTIVITY_KEY, Date.now().toString())
  }, [])

  const lock = useCallback(() => {
    _authenticated = false
    setLocked(true)
    setInput('')
    setError(false)
  }, [])

  // Check for inactivity timeout every minute
  useEffect(() => {
    if (locked) return
    updateActivity()

    const events = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart']
    events.forEach(e => window.addEventListener(e, updateActivity, { passive: true }))

    const timer = setInterval(() => {
      const last = parseInt(sessionStorage.getItem(ACTIVITY_KEY) || '0', 10)
      if (last && Date.now() - last > TIMEOUT_MS) lock()
    }, 60_000)

    return () => {
      events.forEach(e => window.removeEventListener(e, updateActivity))
      clearInterval(timer)
    }
  }, [locked, updateActivity, lock])

  // Focus input when locked
  useEffect(() => {
    if (locked) setTimeout(() => inputRef.current?.focus(), 100)
  }, [locked])

  const submit = () => {
    if (input === PASSWORD) {
      _authenticated = true
      updateActivity()
      setLocked(false)
      setInput('')
      setError(false)
    } else {
      setError(true)
      setShake(true)
      setInput('')
      setTimeout(() => setShake(false), 600)
      setTimeout(() => setError(false), 2000)
    }
  }

  if (!locked) return <>{children}</>

  return (
    <div className="fixed inset-0 bg-gray-950 flex items-center justify-center z-[999]">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className={`relative w-full max-w-sm mx-4 ${shake ? 'animate-shake' : ''}`}>
        {/* Card */}
        <div className="bg-gray-900 border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/60">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/30 mb-4">
              <span className="text-white text-xl font-bold">P</span>
            </div>
            <h1 className="text-white font-bold text-xl tracking-tight">Pawas' Workspace</h1>
            <p className="text-gray-500 text-sm mt-1">Enter password to continue</p>
          </div>

          {/* Input */}
          <div className="space-y-4">
            <div className="relative">
              <input
                ref={inputRef}
                type="password"
                value={input}
                onChange={e => { setInput(e.target.value); setError(false) }}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder="••••••"
                className={`w-full bg-white/5 border rounded-2xl px-4 py-3.5 text-white text-center text-xl tracking-[0.5em] placeholder-gray-700 focus:outline-none transition-colors ${
                  error
                    ? 'border-rose-500/60 bg-rose-500/5'
                    : 'border-white/10 focus:border-indigo-500/50'
                }`}
                maxLength={10}
                autoComplete="off"
              />
            </div>

            {error && (
              <p className="text-rose-400 text-sm text-center animate-slide-in">
                Incorrect password
              </p>
            )}

            <button
              onClick={submit}
              disabled={input.length === 0}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/30"
            >
              Unlock
            </button>
          </div>

          <p className="text-gray-700 text-xs text-center mt-6">
            Session locks after 30 minutes of inactivity
          </p>
        </div>
      </div>
    </div>
  )
}
