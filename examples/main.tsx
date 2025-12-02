import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { OpeningHoursEditor, OpeningHoursSchedule, opening_hours } from '../src'
import '../src/styles.css'

const DEFAULT_HOURS = 'Mo-Fr 09:00-17:00; Sa 10:00-14:00'

function Demo() {
  const [locale, setLocale] = useState('en')
  const [localeInput, setLocaleInput] = useState('en')
  const [hourCycle, setHourCycle] = useState<'auto' | '12h' | '24h'>('auto')
  const [dayLabelStyle, setDayLabelStyle] = useState<'short' | 'long'>('short')
  const [value, setValue] = useState(() => new opening_hours(DEFAULT_HOURS))
  const [formatted, setFormatted] = useState(() => {
    try {
      return value.prettifyValue()
    } catch {
      return DEFAULT_HOURS
    }
  })
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatted || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: 16, display: 'grid', gap: 16 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div>
          <h1>OSM opening_hours React components</h1>
          <p>
            A set of locale-aware, self-contained React components for parsing, formatting and editing OSM opening_hours values.
          </p>

          <p>

            You can use the <strong>OpeningHoursSchedule</strong> component to display business hours in a nice, compact view.
            The <strong>OpeningHoursEditor</strong> component can be used to edit opening hours in a reasonably user-friendly way.
          </p>
          <p>Both components use the <a href="https://github.com/opening-hours/opening_hours.js"><strong>opening_hours</strong></a> library for parsing the OSM opening_hours values.</p>
        </div>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div
            style={{
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: 16,
              flex: '1 1 360px',
              minWidth: 320,
            }}
          >
            <strong style={{ width: '100%', fontSize: 14, textTransform: 'uppercase', color: '#475569' }}>Component settings</strong>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span>Locale</span>
              <input
                value={localeInput}
                onChange={(e) => setLocaleInput(e.target.value)}
                onBlur={(e) => setLocale(e.target.value || 'en')}
                style={{ padding: 6 }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span>Hour cycle</span>
              <select value={hourCycle} onChange={(e) => setHourCycle(e.target.value as 'auto' | '12h' | '24h')} style={{ padding: 6 }}>
                <option value="auto">Auto (from locale)</option>
                <option value="24h">24h</option>
                <option value="12h">12h</option>
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span>Day label style</span>
              <select value={dayLabelStyle} onChange={(e) => setDayLabelStyle(e.target.value as 'short' | 'long')} style={{ padding: 6 }}>
                <option value="short">Short</option>
                <option value="long">Long</option>
              </select>
            </label>
          </div>

          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: 16,
              flex: '1 1 320px',
              minWidth: 280,
            }}
          >
            <strong style={{ fontSize: 14, textTransform: 'uppercase', color: '#475569' }}>OSM opening_hours value</strong>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <code style={{ display: 'inline-block', padding: '6px 10px', borderRadius: 8, background: '#f1f5f9', fontSize: 13 }}>
                {formatted || '—'}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!formatted}
                style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  border: '1px solid #cbd5e1',
                  background: copied ? '#0f172a' : '#fff',
                  color: copied ? '#fff' : '#0f172a',
                  fontSize: 12,
                  cursor: formatted ? 'pointer' : 'not-allowed',
                }}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </label>
        </div>
      </header>

      <section
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          alignItems: 'start',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h2 style={{ marginBottom: 8, fontFamily: 'Monospace' }}>OpeningHoursSchedule</h2>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, maxWidth: 420, backgroundColor: '#f1f5f9' }}>
            <OpeningHoursSchedule
              openingHours={value}
              locale={locale}
              hourCycle={hourCycle === 'auto' ? undefined : hourCycle}
              dayLabelStyle={dayLabelStyle}
            />
          </div>
        </div>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ marginBottom: 8, fontFamily: 'Monospace' }}>OpeningHoursEditor</h2>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, maxWidth: 420, backgroundColor: '#f1f5f9' }}>
            <OpeningHoursEditor
              openingHours={value}
              onChange={(next) => {
                setValue(next)
                try {
                  setFormatted(next.prettifyValue())
                } catch {
                  // bye
                }
              }}
              locale={locale}
              dayLabelStyle={dayLabelStyle}
            />
          </div>
        </div>
      </section>

    </div>
  )
}

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(
    <React.StrictMode>
      <Demo />
    </React.StrictMode>,
  )
}
