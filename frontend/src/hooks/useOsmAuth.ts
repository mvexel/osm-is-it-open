import { useEffect, useRef, useState } from 'react'
import * as OsmAuth from 'osm-auth'

type OsmUser = { displayName: string | null; id: string | null }
type OsmAuthInstance = {
  authenticate: (cb: (err?: unknown) => void) => void
  logout: () => void
  fetch: (path: string, opts: { method: 'GET' | 'POST' | 'PUT' | 'DELETE'; headers?: Record<string, string> }) => Promise<Response>
  authenticated: () => boolean
  bootstrapToken: (code: string, cb: (err?: unknown) => void) => void
}

export function useOsmAuth() {
  const [user, setUser] = useState<OsmUser | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clientId = import.meta.env.VITE_OSM_CLIENT_ID
  const redirectUri = import.meta.env.VITE_OSM_REDIRECT_URI || window.location.origin
  const scope = import.meta.env.VITE_OSM_SCOPE || 'read_prefs'
  const authEnabled = Boolean(clientId && redirectUri)

  const authRef = useRef<OsmAuthInstance | null>(null)

  useEffect(() => {
    if (!authEnabled) return

    authRef.current = createAuthInstance({
      url: 'https://www.openstreetmap.org',
      apiUrl: 'https://api.openstreetmap.org',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      singlepage: true,
    })

    // Complete PKCE flow if redirected back with a code
    const params = new URLSearchParams(window.location.search)
    const authCode = params.get('code')
    if (authCode) {
      authRef.current.bootstrapToken(authCode, (err?: unknown) => {
        if (!err) {
          stripAuthParamsFromUrl()
          fetchUser()
        }
      })
      return
    }

    // Check existing session silently
    if (authRef.current.authenticated()) {
      fetchUser()
    }
  }, [authEnabled, clientId, redirectUri, scope])

  const fetchUser = () => {
    if (!authRef.current) return
    authRef.current
      .fetch('https://api.openstreetmap.org/api/0.6/user/details', {
        method: 'GET',
        headers: { Accept: 'application/xml' },
      })
      .then(async (res) => {
        if (!res.ok) throw new Error('user fetch failed')
        const text = await res.text()
        const parser = new DOMParser()
        const doc = parser.parseFromString(text, 'application/xml')
        const parsed = parseUser(doc)
        setUser(parsed)
      })
      .catch(() => setUser(null))
  }

  const login = () => {
    if (!authRef.current) return
    setLoading(true)
    setError(null)
    authRef.current.authenticate((err: unknown) => {
      if (err) {
        setError('OSM login failed')
        setLoading(false)
        return
      }
      fetchUser()
      setLoading(false)
    })
  }

  const logout = () => {
    authRef.current?.logout()
    setUser(null)
  }

  return {
    user,
    login,
    logout,
    loading,
    error,
    authEnabled,
  }
}

function parseUser(details: Document): OsmUser {
  try {
    const userEl = details.getElementsByTagName('user')?.[0]
    const displayName = userEl?.getAttribute('display_name') ?? null
    const id = userEl?.getAttribute('id') ?? null
    return { displayName, id }
  } catch {
    return { displayName: null, id: null }
  }
}

function createAuthInstance(opts: unknown): OsmAuthInstance {
  const ctor = (OsmAuth as unknown as { osmAuth: new (o: unknown) => OsmAuthInstance }).osmAuth
  return new ctor(opts as never)
}

function stripAuthParamsFromUrl() {
  const url = new URL(window.location.href)
  url.searchParams.delete('code')
  url.searchParams.delete('state')
  window.history.replaceState({}, document.title, url.toString())
}
