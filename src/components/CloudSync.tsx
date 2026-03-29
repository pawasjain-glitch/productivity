import { useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'

const PUSH_DEBOUNCE_MS = 3000   // wait 3s after last change before pushing
const PULL_ON_FOCUS = true      // re-pull from cloud when tab regains focus

// ── API helpers ─────────────────────────────────────────────────────────────

async function pullCloud(): Promise<Record<string, unknown> | null> {
  const res = await fetch('/api/sync', { cache: 'no-store' })
  const json = await res.json() as { ok: boolean; data?: Record<string, unknown>; error?: string }
  if (!json.ok) {
    if (json.error === 'not_configured') return undefined as unknown as null  // signal: not set up
    return null
  }
  return json.data ?? null
}

async function pushCloud(data: Record<string, unknown>): Promise<boolean> {
  const res = await fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.ok
}

// ── Component ────────────────────────────────────────────────────────────────

export default function CloudSync() {
  const { projects, items, pipeline, briefings, activeProjectId, activeSection,
    setCloudSyncStatus } = useStore()

  const initialized = useRef(false)
  const skipNextPush = useRef(false)   // prevents push-right-after-pull loop
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Pull from cloud ─────────────────────────────────────────────────────

  const applyCloudData = (cloudData: Record<string, unknown>) => {
    // Pick the most recently touched items to decide which version wins
    const localTs = useStore.getState().items.reduce(
      (max, i) => Math.max(max, new Date(i.updatedAt).getTime()), 0
    )
    const cloudItems = cloudData.items as Array<{ updatedAt: string }> | undefined
    const cloudTs = cloudItems?.reduce(
      (max, i) => Math.max(max, new Date(i.updatedAt).getTime()), 0
    ) ?? 0

    if (cloudTs <= localTs) {
      setCloudSyncStatus('synced', new Date().toISOString())
      return   // local is up-to-date or newer — don't overwrite
    }

    // Cloud is newer: apply it
    skipNextPush.current = true
    useStore.setState({
      projects:        (cloudData.projects as never)       ?? [],
      items:           (cloudData.items as never)          ?? [],
      pipeline:        (cloudData.pipeline as never)       ?? [],
      briefings:       (cloudData.briefings as never)      ?? [],
      activeProjectId: (cloudData.activeProjectId as string | null) ?? null,
      activeSection:   (cloudData.activeSection as never)  ?? 'todos',
    })
    setCloudSyncStatus('synced', new Date().toISOString())
  }

  const doPull = async () => {
    try {
      const cloudData = await pullCloud()
      if (cloudData === (undefined as unknown as null)) {
        // API returned not_configured — KV not set up yet
        setCloudSyncStatus('unavailable')
        return
      }
      if (cloudData) applyCloudData(cloudData)
      else setCloudSyncStatus('synced', new Date().toISOString())  // cloud is empty (fresh)
    } catch {
      setCloudSyncStatus('error')
    }
  }

  // On mount: pull
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    setCloudSyncStatus('syncing')
    doPull()
  }, [])

  // On window focus: re-pull (catches changes made on another device)
  useEffect(() => {
    if (!PULL_ON_FOCUS) return
    const onFocus = () => { setCloudSyncStatus('syncing'); doPull() }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  // ── Push to cloud ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!initialized.current) return

    // Skip this push if we just applied cloud data
    if (skipNextPush.current) {
      skipNextPush.current = false
      return
    }

    if (pushTimer.current) clearTimeout(pushTimer.current)

    pushTimer.current = setTimeout(async () => {
      setCloudSyncStatus('syncing')
      const s = useStore.getState()
      const ok = await pushCloud({
        projects:        s.projects,
        items:           s.items,
        pipeline:        s.pipeline,
        briefings:       s.briefings,
        activeProjectId: s.activeProjectId,
        activeSection:   s.activeSection,
        syncedAt:        new Date().toISOString(),
      }).catch(() => false)
      setCloudSyncStatus(ok ? 'synced' : 'error', ok ? new Date().toISOString() : undefined)
    }, PUSH_DEBOUNCE_MS)

    return () => { if (pushTimer.current) clearTimeout(pushTimer.current) }
  }, [projects, items, pipeline, briefings, activeProjectId, activeSection])

  return null
}
