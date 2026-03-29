import type { VercelRequest, VercelResponse } from '@vercel/node'

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
const KEY = 'workspace-v1'

async function redisGet(key: string): Promise<unknown> {
  if (!REDIS_URL || !REDIS_TOKEN) throw new Error('NOT_CONFIGURED')
  const res = await fetch(`${REDIS_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  })
  if (!res.ok) throw new Error(`Redis GET failed: ${res.status}`)
  const { result } = await res.json() as { result: string | null }
  return result ? JSON.parse(result) : null
}

async function redisSet(key: string, value: unknown): Promise<void> {
  if (!REDIS_URL || !REDIS_TOKEN) throw new Error('NOT_CONFIGURED')
  // Use pipeline POST to avoid URL-length limits on large payloads
  const res = await fetch(`${REDIS_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([['SET', key, JSON.stringify(value)]]),
  })
  if (!res.ok) throw new Error(`Redis SET failed: ${res.status}`)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')

  try {
    if (req.method === 'GET') {
      const data = await redisGet(KEY)
      return res.json({ ok: true, data })
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      await redisSet(KEY, body)
      return res.json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg === 'NOT_CONFIGURED') {
      return res.status(503).json({ ok: false, error: 'not_configured' })
    }
    console.error('[sync]', msg)
    return res.status(500).json({ ok: false, error: msg })
  }
}
