import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { OpeningHoursEditor, OpeningHoursSchedule, opening_hours } from '../src'
import '../src/styles.css'

type ElementType = 'node' | 'way' | 'relation'
const LOCALE_OPTIONS = [
  'en', 'en-US', 'en-GB', 'en-CA',
  'fr', 'fr-CA', 'de', 'es', 'it',
  'nl', 'pt', 'sv', 'da', 'fi',
  'no', 'pl', 'cs', 'sk', 'sl',
  'hu', 'ro', 'bg', 'el', 'ru',
  'ja', 'ko', 'zh-CN', 'zh-TW', 'ar',
]

const DEFAULT_ELEMENT = 'node/4311815199'
const DEFAULT_HOURS = 'Mo-Fr 09:00-17:00'

function parseElementId(input: string): { type: ElementType; id: number } {
  const trimmed = input.trim()
  const match = trimmed.match(/^(node|way|relation)\/(\d+)$/i)
  if (match) {
    return { type: match[1].toLowerCase() as ElementType, id: Number(match[2]) }
  }
  const fallbackId = Number(trimmed)
  if (!Number.isNaN(fallbackId)) {
    return { type: 'node', id: fallbackId }
  }
  throw new Error('Use format: node/123, way/456, or relation/789')
}

async function fetchOpeningHours(element: string) {
  const { type, id } = parseElementId(element)
  const query = `[out:json][timeout:20]; ${type}(${id}); out body;`
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ data: query }).toString(),
  })
  if (!res.ok) {
    throw new Error(`Overpass error (${res.status})`)
  }
  const data = await res.json()
  const el = data?.elements?.[0]
  if (!el) {
    throw new Error('Element not found')
  }
  const tags = el.tags || {}
  const oh =
    tags.opening_hours ||
    tags['opening_hours:covid19'] ||
    tags['opening_hours:conditional'] ||
    ''
  const coords =
    typeof el.lat === 'number' && typeof el.lon === 'number'
      ? ([el.lat, el.lon] as [number, number])
      : undefined
  return {
    openingHours: oh as string,
    name: tags.name as string | undefined,
    coords,
    rawTags: tags as Record<string, string>,
    id: `${type}/${id}`,
  }
}

function Demo() {
  const [element, setElement] = useState<string>(DEFAULT_ELEMENT)
  const [openingHours, setOpeningHours] = useState<opening_hours>(() => new opening_hours(DEFAULT_HOURS))
  const [rawValue, setRawValue] = useState<string>(() => openingHours.prettifyValue())
  const [coords, setCoords] = useState<[number, number] | undefined>()
  const [name, setName] = useState<string | undefined>()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [hourCycle, setHourCycle] = useState<'12h' | '24h' | 'auto'>('auto')
  const [locale, setLocale] = useState<string>('en')
  const [dayLabelStyle, setDayLabelStyle] = useState<'short' | 'long'>('short')
  const [scheduleTitle, setScheduleTitle] = useState<string>('Display only')
  const [showAdditionalRules, setShowAdditionalRules] = useState(false)
  const [rawOsm, setRawOsm] = useState(false)
  const [osmReadWrite, setOsmReadWrite] = useState(false)

  const handleFetch = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchOpeningHours(element)
      const location = result.coords ? { lat: result.coords[0], lon: result.coords[1] } : undefined
      const next = new opening_hours(result.openingHours || DEFAULT_HOURS, location)
      setOpeningHours(next)
      setRawValue(next.prettifyValue())
      setCoords(result.coords)
      setName(result.name ?? result.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load element')
    } finally {
      setLoading(false)
    }
  }

  const handleRawChange = (value: string) => {
    setRawValue(value)
    try {
      const next = new opening_hours(value || DEFAULT_HOURS, coords ? { lat: coords[0], lon: coords[1] } : undefined)
      setOpeningHours(next)
      setError(null)
    } catch {
      setError('Invalid opening_hours string')
    }
  }

  const prettified = useMemo(() => {
    try {
      return openingHours.prettifyValue()
    } catch {
      return rawValue
    }
  }, [openingHours, rawValue])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Top Navigation with Global Settings */}
      <header
        style={{
          background: '#fff',
          borderBottom: '2px solid #e2e8f0',
          padding: '16px 24px',
        }}
      >
        <h1 style={{ margin: '0 0 16px', fontSize: 20 }}>Opening Hours Component Showcase</h1>

        {/* Global Settings */}
        <div
          style={{
            display: 'flex',
            gap: 24,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Locale:</span>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value || 'en')}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                fontSize: 14,
                background: '#fff',
              }}
            >
              {LOCALE_OPTIONS.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Hour Cycle:</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['auto', '24h', '12h'] as const).map((cycle) => (
                <button
                  key={cycle}
                  onClick={() => setHourCycle(cycle)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    background: hourCycle === cycle ? '#0f172a' : '#fff',
                    color: hourCycle === cycle ? '#fff' : '#0f172a',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: 14,
                  }}
                  type="button"
                >
                  {cycle === 'auto' ? 'Auto' : cycle}
                </button>
              ))}
            </div>
          </div>

          {/* Data Source */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 300 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Load OSM:</span>
            <input
              value={element}
              onChange={(e) => setElement(e.target.value)}
              placeholder="node/4311815199"
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                fontSize: 14,
              }}
            />
            <button
              onClick={handleFetch}
              disabled={loading}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                border: 'none',
                background: '#0f172a',
                color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: 14,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Loading…' : 'Fetch'}
            </button>
          </div>
        </div>

        {name && (
          <div style={{ fontSize: 13, color: '#475569', marginTop: 12 }}>
            📍 <strong>{name}</strong>
            {coords && ` • ${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`}
          </div>
        )}
        {error && (
          <div style={{ color: '#b91c1c', fontSize: 13, marginTop: 12, background: '#fef2f2', padding: 8, borderRadius: 6 }}>
            ⚠️ {error}
          </div>
        )}
      </header>

      {/* Main Content - Side by Side Components */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
          gap: 24,
          padding: 24,
          overflow: 'auto',
          flex: 1,
          maxWidth: 1400,
          margin: '0 auto',
          width: '100%',
        }}
      >

        {/* OpeningHoursSchedule Component */}
        <div
          style={{
            background: '#f8fafc',
            borderRadius: 12,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            maxHeight: 'calc(100vh - 180px)',
            overflow: 'auto',
          }}
        >
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: 16, color: '#475569', fontWeight: 600 }}>
              <code style={{ background: '#e2e8f0', padding: '4px 8px', borderRadius: 6, fontWeight: 600, fontSize: 14 }}>OpeningHoursSchedule</code>
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
              Component settings and demo
            </p>
          </div>
          <div
            style={{
              display: 'grid',
              gap: 12,
              gridTemplateColumns: '1fr 1fr',
              padding: 12,
              background: '#fff',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
            }}
          >
            <label style={{ display: 'grid', gap: 6, gridColumn: '1 / span 2' }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Component Setting: Title</span>
              <input
                value={scheduleTitle}
                onChange={(e) => setScheduleTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 14,
                }}
              />
            </label>
            <div style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Component Setting: Day Labels</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['short', 'long'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => setDayLabelStyle(style)}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      background: dayLabelStyle === style ? '#3b82f6' : '#fff',
                      color: dayLabelStyle === style ? '#fff' : '#0f172a',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                    type="button"
                  >
                    {style === 'short' ? 'Short' : 'Long'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Component Output</div>
            <div
              style={{
                padding: 20,
                background: '#fff',
                borderRadius: 8,
                border: '3px solid #3b82f6',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>{scheduleTitle}</div>
              <OpeningHoursSchedule
                openingHours={openingHours}
                hourCycle={hourCycle === 'auto' ? undefined : hourCycle}
                locale={locale}
                dayLabelStyle={dayLabelStyle}
              />
            </div>
          </div>
        </div>

        {/* OpeningHours Component */}
        <div
          style={{
            background: '#f8fafc',
            borderRadius: 12,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            maxHeight: 'calc(100vh - 180px)',
            overflow: 'auto',
          }}
        >
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: 16, color: '#475569', fontWeight: 600 }}>
              <code style={{ background: '#e2e8f0', padding: '4px 8px', borderRadius: 6, fontWeight: 600, fontSize: 14 }}>OpeningHoursEditor</code>
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
              Component settings and demo
            </p>
          </div>
          <div
            style={{
              display: 'grid',
              gap: 12,
              padding: 12,
              background: '#fff',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
            }}
          >
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Component Settings</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showAdditionalRules}
                  onChange={(e) => setShowAdditionalRules(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <span style={{ fontSize: 14 }}>Show additional rules input</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rawOsm}
                  onChange={(e) => setRawOsm(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <span style={{ fontSize: 14 }}>Show raw OSM hours</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginLeft: 24 }}>
                <input
                  type="checkbox"
                  checked={osmReadWrite}
                  onChange={(e) => setOsmReadWrite(e.target.checked)}
                  disabled={!rawOsm}
                  style={{ width: 16, height: 16, cursor: rawOsm ? 'pointer' : 'not-allowed', opacity: rawOsm ? 1 : 0.5 }}
                />
                <span style={{ fontSize: 14, opacity: rawOsm ? 1 : 0.5 }}>Make OSM hours editable (requires raw OSM)</span>
              </label>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Component Output</div>
            <div
              style={{
                padding: 20,
                background: '#fff',
                borderRadius: 8,
                border: '3px solid #f59e0b',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                minHeight: 100,
              }}
            >
              <OpeningHoursEditor
                openingHours={openingHours}
                hourCycle={hourCycle === 'auto' ? undefined : hourCycle}
                locale={locale}
                editable
                onChange={(updated) => {
                  setOpeningHours(updated)
                  setRawValue(updated.prettifyValue())
                  setError(null)
                }}
                showAdditionalRules={showAdditionalRules}
                rawOsm={rawOsm}
                osmReadWrite={osmReadWrite}
                osmId={name}
              />
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#64748b', padding: '8px 12px', background: '#fff', borderRadius: 6, border: '1px solid #e2e8f0' }}>
            💡 Click the badge to toggle inline editing mode. Use the checkboxes above to show/hide additional features.
          </div>
        </div>
      </div>
    </div>
  )
}

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(<Demo />)
}
