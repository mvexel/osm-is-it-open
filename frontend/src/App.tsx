import { useEffect, useState } from 'react'
import Map from './components/Map'
import { POI } from './types/poi'
import { OpeningHoursBadge, OpeningHoursSchedule, formatOpeningHours } from '../packages/hours/src'
import { useOsmAuth } from './hooks/useOsmAuth'
import { reverseGeocodeCountry } from './utils/nominatim'
import { DEFAULT_VIEW, MIN_ZOOM } from './config/map'

const MAP_HASH_PREFIX = '#map='
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
const DEFAULT_COUNTRY = (import.meta.env.VITE_OSM_DEFAULT_COUNTRY || '').toLowerCase() || undefined

function App() {
  const [pois, setPois] = useState<POI[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null)
  const [hourCycle, setHourCycle] = useState<'12h' | '24h'>('24h')
  const [initialViewState, setInitialViewState] = useState(DEFAULT_VIEW)
  const [viewCountryCode, setViewCountryCode] = useState<string | undefined>(DEFAULT_COUNTRY)
  const { user: osmUser, login: loginOsm, logout: logoutOsm, authEnabled, loading: authLoading, error: authError } =
    useOsmAuth()

  const fetchPOIs = async (
    bbox: [number, number, number, number],
    zoom: number,
  ) => {
    if (zoom < MIN_ZOOM) {
      setPois([])
      setError(null)
      setLoading(false)
      setSelectedPoi(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/pois?bbox=${bbox.join(',')}&zoom=${zoom}`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch POIs')
      }
      const data = await response.json()
      setPois(data.pois)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleViewChange = (view: { latitude: number; longitude: number; zoom: number }) => {
    const lat = view.latitude.toFixed(5)
    const lon = view.longitude.toFixed(5)
    const zoom = view.zoom.toFixed(2)
    const hash = `${MAP_HASH_PREFIX}${zoom}/${lat}/${lon}`
    const url = new URL(window.location.href)
    url.hash = hash
    window.history.replaceState(null, '', url.toString())

    reverseGeocodeCountry(view.latitude, view.longitude).then((code) => {
      if (code && code !== viewCountryCode) {
        setViewCountryCode(code)
      }
    })
  }

  const loadElement = async (type: 'n' | 'w' | 'r', id: number) => {
    try {
      setLoading(true)
      setError(null)
      const query = `[out:json][timeout:20]; ${type}(${id}); out body;`
      const res = await fetch(OVERPASS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ data: query }).toString(),
      })
      if (!res.ok) throw new Error(`Overpass error (${res.status})`)
      const data = await res.json()
      const element = data?.elements?.[0]
      if (!element) throw new Error('Element not found')

      const tags = element.tags || {}
      const openingHours =
        tags.opening_hours ||
        tags['opening_hours:covid19'] ||
        tags['opening_hours:conditional'] ||
        ''
      const coords: [number, number] = [element.lat, element.lon]
      const countryCode = countryCodeFromTags(tags, viewCountryCode)
      const status = formatOpeningHours(openingHours, { coords, countryCode }).status
      const poi: POI = {
        id: `${type === 'n' ? 'node' : type === 'w' ? 'way' : 'relation'}/${id}`,
        lat: element.lat,
        lon: element.lon,
        name: tags.name,
        amenity: tags.amenity,
        shop: tags.shop,
        tags,
        openingHours,
        openStatus: status,
      }
      setSelectedPoi(poi)
      setPois((prev) => {
        const filtered = prev.filter((p) => p.id !== poi.id)
        return [poi, ...filtered]
      })
      const zoom = Math.max(MIN_ZOOM, 18)
      const view = { latitude: poi.lat, longitude: poi.lon, zoom }
      setInitialViewState(view)
      handleViewChange(view)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load element')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const hashView = parseMapHash(window.location.hash)
    if (hashView) {
      setInitialViewState(hashView)
    }

    const elementMatch = window.location.pathname.match(/^\/([nwr])\/(\d+)/i)
    if (elementMatch) {
      const [, typeChar, idStr] = elementMatch
      const type = typeChar.toLowerCase()
      const id = Number(idStr)
      if (!Number.isNaN(id)) {
        loadElement(type as 'n' | 'w' | 'r', id)
      }
    }

    // Prime country code from initial view
    reverseGeocodeCountry(initialViewState.latitude, initialViewState.longitude).then((code) => {
      if (code) setViewCountryCode(code)
    })
  }, [])

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-4 left-4 z-30 flex flex-col gap-2">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur border border-gray-200 rounded-full px-3 py-1 shadow">
          <span className="text-sm text-gray-700">Clock</span>
          {(['24h', '12h'] as const).map((cycle) => (
            <button
              key={cycle}
              type="button"
              onClick={() => setHourCycle(cycle)}
              className={`text-sm px-3 py-1 rounded-full border ${hourCycle === cycle ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300'}`}
            >
              {cycle}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur border border-gray-200 rounded-full px-3 py-1 shadow">
          <span className="text-sm text-gray-700">OSM</span>
          {authEnabled ? (
            osmUser ? (
              <>
                <span className="text-sm text-gray-900 font-medium">{osmUser.displayName || 'Signed in'}</span>
                <button
                  type="button"
                  onClick={logoutOsm}
                  className="text-sm px-3 py-1 rounded-full border bg-white text-gray-700 border-gray-300"
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={loginOsm}
                disabled={authLoading}
                className="text-sm px-3 py-1 rounded-full border bg-gray-900 text-white border-gray-900 disabled:opacity-60"
              >
                {authLoading ? 'Signing in…' : 'Sign in'}
              </button>
            )
          ) : (
            <span className="text-xs text-gray-500">OSM auth not configured</span>
          )}
        </div>
        {authError && <div className="text-xs text-red-600 bg-white/90 border border-red-200 rounded px-3 py-1">{authError}</div>}
      </div>
      <Map
        pois={pois}
        onBoundsChange={fetchPOIs}
        onSelectPoi={setSelectedPoi}
        onViewChange={handleViewChange}
        initialViewState={initialViewState}
        currentZoom={initialViewState.zoom}
      />
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-10">
          {error}
        </div>
      )}
      {loading && (
        <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded shadow-lg z-10">
          Loading POIs...
        </div>
      )}
      {selectedPoi && (
        <div className="absolute bottom-4 left-4 max-w-md w-[90%] sm:w-96 bg-white/95 backdrop-blur border border-gray-200 rounded-xl shadow-lg p-4 z-20">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold text-lg text-gray-900">{selectedPoi.name || 'Unnamed POI'}</div>
              <a
                className="text-xs text-blue-600 break-words hover:underline"
                href={`https://www.openstreetmap.org/${selectedPoi.id}`}
                target="_blank"
                rel="noreferrer"
              >
                {selectedPoi.id}
              </a>
            </div>
            <OpeningHoursBadge
              openingHours={selectedPoi.openingHours}
              coords={[selectedPoi.lat, selectedPoi.lon]}
              countryCode={countryCodeFromTags(selectedPoi.tags, viewCountryCode)}
              hourCycle={hourCycle}
            />
          </div>
          <div className="mt-3">
            <OpeningHoursSchedule
              openingHours={selectedPoi.openingHours}
              coords={[selectedPoi.lat, selectedPoi.lon]}
              countryCode={countryCodeFromTags(selectedPoi.tags, viewCountryCode)}
              hourCycle={hourCycle}
              className="bg-white"
            />
          </div>
          {!selectedPoi.openingHours && (
            <div className="mt-2 text-sm text-gray-500">
              Hours unavailable for this POI.
            </div>
          )}
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => setSelectedPoi(null)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App

function parseMapHash(hash: string): { latitude: number; longitude: number; zoom: number } | null {
  if (!hash.startsWith(MAP_HASH_PREFIX)) return null
  const [, payload] = hash.split(MAP_HASH_PREFIX)
  const parts = payload.split('/')
  if (parts.length < 3) return null
  const [zoomStr, latStr, lonStr] = parts
  const zoom = Number(zoomStr)
  const latitude = Number(latStr)
  const longitude = Number(lonStr)
  if ([zoom, latitude, longitude].some((v) => Number.isNaN(v))) return null
  return { latitude, longitude, zoom }
}

function countryCodeFromTags(tags: Record<string, string> | undefined, fallback?: string): string | undefined {
  const code =
    tags?.['addr:country'] ||
    tags?.['is_in:country_code'] ||
    tags?.['country'] ||
    tags?.['country_code'] ||
    fallback ||
    DEFAULT_COUNTRY
  return code ? code.toLowerCase() : undefined
}
