import { useEffect, useRef } from 'react'
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
// Pull-only on mount and focus. Push is MANUAL via SettingsPanel "Sync Now" button.
// This prevents any accidental overwrite of real data by stale snapshots.

export default function CloudSync() {
  const { setCloudSyncStatus } = useStore()
  const initialized = useRef(false)

  const doPull = async () => {
    setCloudSyncStatus('syncing')
    try {
      const cloudData = await pullCloud()
      if (cloudData === undefined) {
        setCloudSyncStatus('unavailable')
        return
      }
      if (cloudData) {
        applyCloudIfNewer(cloudData)
      }
      setCloudSyncStatus('synced', new Date().toISOString())
    } catch {
      setCloudSyncStatus('error')
    }
  }

  // Pull on mount
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    doPull()
  }, [])

  // Re-pull when tab regains focus (catches changes from another device)
  useEffect(() => {
    const onFocus = () => doPull()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  return null
}
