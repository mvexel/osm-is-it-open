import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  OpeningHoursBadge,
  OpeningHoursSchedule,
  formatOpeningHours,
} from '../src'
import type { FormatOptions } from '../src'

type ElementType = 'node' | 'way' | 'relation'

const DEFAULT_ELEMENT = 'node/4311815199' // Example restaurant

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
  const [openingHours, setOpeningHours] = useState<string>('Mo-Fr 09:00-17:00')
  const [coords, setCoords] = useState<[number, number] | undefined>()
  const [name, setName] = useState<string | undefined>()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [hourCycle, setHourCycle] = useState<FormatOptions['hourCycle']>('24h')

  const formatted = useMemo(
    () => formatOpeningHours(openingHours, { coords, hourCycle }),
    [openingHours, coords, hourCycle],
  )

  const handleFetch = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchOpeningHours(element)
      setOpeningHours(result.openingHours)
      setCoords(result.coords)
      setName(result.name ?? result.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load element')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '24px',
        display: 'flex',
        gap: '20px',
        flexDirection: 'column',
      }}
    >
      <header>
        <h1 style={{ margin: '0 0 8px' }}>Opening Hours Demo</h1>
        <p style={{ margin: 0, color: '#475569' }}>
          Enter an OSM element ID (node/way/relation) to load its opening_hours
          via Overpass and preview the badge + schedule components. You can also
          edit the hours string below.
        </p>
      </header>

      <div
        style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: 16,
          display: 'grid',
          gap: 12,
        }}
      >
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>OSM element</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={element}
              onChange={(e) => setElement(e.target.value)}
              placeholder="node/123"
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 14,
              }}
            />
            <button
              onClick={handleFetch}
              disabled={loading}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: 'none',
                background: '#0f172a',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              {loading ? 'Loading…' : 'Fetch'}
            </button>
          </div>
          <span style={{ color: '#64748b', fontSize: 13 }}>
            Format: node/123, way/456, or relation/789. Uses Overpass
            (open CORS). Falls back to manual hours if no tag is present.
          </span>
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>
            opening_hours value {name ? `(from ${name})` : ''}
          </span>
          <textarea
            value={openingHours}
            onChange={(e) => setOpeningHours(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 14,
              fontFamily: 'monospace',
            }}
            placeholder="Mo-Fr 09:00-17:00; Sa 10:00-14:00"
          />
        </label>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontWeight: 600 }}>Clock:</span>
          {(['24h', '12h'] as const).map((cycle) => (
            <button
              key={cycle}
              onClick={() => setHourCycle(cycle)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                background: hourCycle === cycle ? '#0f172a' : '#e2e8f0',
                color: hourCycle === cycle ? '#fff' : '#0f172a',
                cursor: 'pointer',
              }}
            >
              {cycle === '24h' ? '24-hour' : '12-hour'}
            </button>
          ))}
        </div>

        {error && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecdd3',
            }}
          >
            {error}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <OpeningHoursBadge openingHours={openingHours} coords={coords} hourCycle={hourCycle} />
        <span style={{ color: '#475569' }}>
          Normalized: {formatted.normalized ?? '—'}
        </span>
      </div>

      <OpeningHoursSchedule
        openingHours={openingHours}
        coords={coords}
        hourCycle={hourCycle}
        className="oh-schedule"
      />
    </div>
  )
}

const root = createRoot(document.getElementById('root')!)
root.render(<Demo />)
