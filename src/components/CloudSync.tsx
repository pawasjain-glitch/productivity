import { useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store/useStore'

// ── API helpers ─────────────────────────────────────────────────────────────

export async function pullCloud(): Promise<Record<string, unknown> | null | undefined> {
  const res = await fetch('/api/sync', { cache: 'no-store' })
  const json = await res.json() as { ok: boolean; data?: Record<string, unknown>; error?: string }
  if (!json.ok) {
    if (json.error === 'not_configured') return undefined  // signal: not set up
    return null
  }
  return json.data ?? null
}

export async function pushCloud(data: Record<string, unknown>): Promise<boolean> {
  const res = await fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.ok
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getPayload() {
  const s = useStore.getState()
  return {
    projects:        s.projects,
    items:           s.items,
    pipeline:        s.pipeline,
    briefings:       s.briefings,
    activeProjectId: s.activeProjectId,
    activeSection:   s.activeSection,
    syncedAt:        new Date().toISOString(),
  }
}

function isRealData(payload: ReturnType<typeof getPayload>): boolean {
  // Reject if every item has the demo timestamp (2020-01-01)
  const DEMO_TS = new Date('2020-01-01T00:00:00.000Z').getTime()
  if (payload.items.length === 0) return false
  const allDemo = payload.items.every(
    (i: { updatedAt: string }) => new Date(i.updatedAt).getTime() <= DEMO_TS
  )
  return !allDemo
}

// ── Merge logic ──────────────────────────────────────────────────────────────
// Only applies cloud data if it is strictly newer AND has more/equal items than local.
// This prevents demo data or stale snapshots from ever overwriting real data.

export function applyCloudIfNewer(cloudData: Record<string, unknown>): boolean {
  const cloudItems = cloudData.items as Array<{ updatedAt: string }> | undefined

  // Never apply empty cloud data
  if (!cloudItems || cloudItems.length === 0) return false

  const localState = useStore.getState()
  const localItems = localState.items

  const localTs = localItems.reduce(
    (max, i) => Math.max(max, new Date(i.updatedAt).getTime()), 0
  )
  const cloudTs = cloudItems.reduce(
    (max, i) => Math.max(max, new Date(i.updatedAt).getTime()), 0
  )

  // Cloud must be strictly newer AND have at least as many items
  if (cloudTs <= localTs) return false
  if (cloudItems.length < localItems.length) return false

  useStore.setState({
    projects:        (cloudData.projects as never)       ?? [],
    items:           (cloudData.items as never)          ?? [],
    pipeline:        (cloudData.pipeline as never)       ?? [],
    briefings:       (cloudData.briefings as never)      ?? [],
    activeProjectId: (cloudData.activeProjectId as string | null) ?? null,
    activeSection:   (cloudData.activeSection as never)  ?? 'todos',
  })
  return true
}

// ── Component ────────────────────────────────────────────────────────────────
// • Pulls from cloud on mount and whenever the tab regains focus
// • Auto-pushes real data to cloud 3 s after any change (debounced)
// • Also pushes immediately on tab blur / page unload so nothing is ever lost
// • Demo data (timestamp 2020-01-01) is NEVER pushed to cloud

export default function CloudSync() {
  const { setCloudSyncStatus } = useStore()
  const configuredRef  = useRef<boolean | null>(null)   // null=unknown, true/false=known
  const pendingPushRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialized    = useRef(false)

  // ── Pull ──────────────────────────────────────────────────────────────────
  const doPull = useCallback(async () => {
    setCloudSyncStatus('syncing')
    try {
      const cloudData = await pullCloud()
      if (cloudData === undefined) {
        configuredRef.current = false
        setCloudSyncStatus('unavailable')
        return
      }
      configuredRef.current = true
      if (cloudData) applyCloudIfNewer(cloudData)
      setCloudSyncStatus('synced', new Date().toISOString())
    } catch {
      setCloudSyncStatus('error')
    }
  }, [setCloudSyncStatus])

  // ── Push (immediate) ──────────────────────────────────────────────────────
  const doPushNow = useCallback(async () => {
    if (configuredRef.current === false) return   // don't push if not configured
    const payload = getPayload()
    if (!isRealData(payload)) return              // never push demo data
    try {
      const ok = await pushCloud(payload)
      if (ok) {
        setCloudSyncStatus('synced', new Date().toISOString())
      } else {
        setCloudSyncStatus('error')
      }
    } catch {
      setCloudSyncStatus('error')
    }
  }, [setCloudSyncStatus])

  // ── Push (debounced, called after every store change) ────────────────────
  const schedulePush = useCallback(() => {
    if (configuredRef.current === false) return
    if (pendingPushRef.current) clearTimeout(pendingPushRef.current)
    setCloudSyncStatus('syncing')
    pendingPushRef.current = setTimeout(() => {
      pendingPushRef.current = null
      doPushNow()
    }, 3000)   // 3-second debounce — pushes 3 s after last change
  }, [doPushNow, setCloudSyncStatus])

  // ── Mount: pull first, then subscribe to store changes ───────────────────
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // Pull on mount to hydrate from cloud
    doPull().then(() => {
      // Only start watching for changes AFTER the initial pull
      // so we don't push the freshly-pulled cloud data right back
      const unsub = useStore.subscribe((state, prevState) => {
        // Only trigger push if data-bearing fields actually changed
        if (
          state.items     !== prevState.items     ||
          state.projects  !== prevState.projects  ||
          state.pipeline  !== prevState.pipeline  ||
          state.briefings !== prevState.briefings
        ) {
          schedulePush()
        }
      })
      return unsub
    })
  }, [doPull, schedulePush])

  // ── Re-pull when tab regains focus (picks up changes from other devices) ──
  useEffect(() => {
    const onFocus = () => doPull()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [doPull])

  // ── Push immediately when tab loses focus or page is about to close ───────
  useEffect(() => {
    const flush = () => {
      if (pendingPushRef.current) {
        clearTimeout(pendingPushRef.current)
        pendingPushRef.current = null
      }
      doPushNow()
    }
    const onBeforeUnload = () => {
      // Synchronous keepalive push as last resort
      const payload = getPayload()
      if (!isRealData(payload)) return
      if (configuredRef.current === false) return
      navigator.sendBeacon?.('/api/sync', JSON.stringify(payload))
    }
    window.addEventListener('blur', flush)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      window.removeEventListener('blur', flush)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [doPushNow])

  return null
}
