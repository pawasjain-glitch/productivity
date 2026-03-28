import type { CalendarEvent } from '../types'

const GOOGLE_CLIENT_ID = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_GOOGLE_CLIENT_ID || ''
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly'
const REDIRECT_URI = window.location.origin + '/oauth-callback.html'

function buildAuthUrl(): string {
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
  authUrl.searchParams.set('response_type', 'token')
  authUrl.searchParams.set('scope', SCOPES)
  authUrl.searchParams.set('include_granted_scopes', 'true')
  return authUrl.toString()
}

function parseTokenFromUrl(url: string): { token: string; expiresAt: number } | null {
  try {
    const hash = url.includes('#') ? url.split('#')[1] : ''
    const params = new URLSearchParams(hash)
    const token = params.get('access_token')
    if (!token) return null
    const expiresIn = parseInt(params.get('expires_in') || '3600', 10)
    const expiresAt = Date.now() + (expiresIn - 60) * 1000 // 1-min buffer
    return { token, expiresAt }
  } catch {
    return null
  }
}

function openAuthPopup(url: string): Promise<{ token: string; expiresAt: number }> {
  return new Promise((resolve, reject) => {
    const popup = window.open(url, 'google-auth', 'width=500,height=600,left=200,top=100')
    if (!popup) { reject(new Error('Popup blocked')); return }

    let settled = false

    // Listen for postMessage from oauth-callback.html
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (!event.data || event.data.type !== 'oauth-callback') return

      cleanup()
      const callbackUrl: string = event.data.url

      if (callbackUrl.includes('error=')) {
        reject(new Error('oauth-error:' + callbackUrl))
        return
      }

      const result = parseTokenFromUrl(callbackUrl)
      if (result) resolve(result)
      else reject(new Error('No token in callback URL'))
    }

    window.addEventListener('message', onMessage)

    // Fallback: poll for popup closure (user closed without completing)
    const pollClosed = setInterval(() => {
      if (popup.closed) {
        cleanup()
        if (!settled) reject(new Error('Popup closed by user'))
      }
    }, 500)

    function cleanup() {
      settled = true
      window.removeEventListener('message', onMessage)
      clearInterval(pollClosed)
      try { if (popup && !popup.closed) popup.close() } catch {}
    }
  })
}

export async function initGoogleAuth(): Promise<{ token: string; expiresAt: number }> {
  // Open a single popup with the full consent screen — no silent re-auth
  // (silent re-auth with prompt:none opens a second popup which browsers block)
  return openAuthPopup(buildAuthUrl())
}

export async function fetchCalendarEvents(accessToken: string): Promise<CalendarEvent[]> {
  const now = new Date()
  const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${now.toISOString()}&timeMax=${weekLater.toISOString()}&singleEvents=true&orderBy=startTime`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!response.ok) throw new Error('Calendar fetch failed')
    const data = await response.json()

    return (data.items || []).map((event: {
      id: string;
      summary?: string;
      start: { dateTime?: string; date?: string };
      end: { dateTime?: string; date?: string };
      attendees?: { email: string; displayName?: string }[];
      description?: string;
      location?: string;
      hangoutLink?: string;
    }) => ({
      id: event.id,
      title: event.summary || 'Untitled Event',
      start: event.start.dateTime || event.start.date || '',
      end: event.end.dateTime || event.end.date || '',
      attendees: (event.attendees || []).map((a: { email: string; displayName?: string }) => a.displayName || a.email),
      description: event.description || '',
      location: event.location,
      meetingUrl: event.hangoutLink,
    })) as CalendarEvent[]
  } catch {
    return []
  }
}

export function getMockCalendarEvents(): CalendarEvent[] {
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000
  const hour = 60 * 60 * 1000

  return [
    {
      id: 'cal-1',
      title: 'Product Launch Planning Meeting',
      start: new Date(now + day + 9 * hour).toISOString(),
      end: new Date(now + day + 10 * hour).toISOString(),
      attendees: ['Sarah Chen', 'Alex Kumar', 'Marketing Team'],
      description: 'Review Q1 launch timeline and assign tasks',
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
    },
    {
      id: 'cal-2',
      title: 'Engineering Standup',
      start: new Date(now + day + 10 * hour).toISOString(),
      end: new Date(now + day + 10.5 * hour).toISOString(),
      attendees: ['Dev Team'],
      description: 'Daily standup',
    },
    {
      id: 'cal-3',
      title: 'Marketing Strategy Review',
      start: new Date(now + 2 * day + 14 * hour).toISOString(),
      end: new Date(now + 2 * day + 15 * hour).toISOString(),
      attendees: ['Marketing Team', 'Design Team'],
      description: 'Review Q1 marketing strategy and campaign performance',
    },
    {
      id: 'cal-4',
      title: '1:1 with CEO',
      start: new Date(now + 3 * day + 11 * hour).toISOString(),
      end: new Date(now + 3 * day + 12 * hour).toISOString(),
      attendees: ['CEO'],
      description: 'Quarterly check-in: roadmap, headcount, priorities',
    },
    {
      id: 'cal-5',
      title: 'API Design Review',
      start: new Date(now + 4 * day + 15 * hour).toISOString(),
      end: new Date(now + 4 * day + 16 * hour).toISOString(),
      attendees: ['Engineering Team'],
      description: 'Review new API endpoints and rate limiting design',
    },
  ]
}
