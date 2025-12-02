import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { OpeningHoursEditor, OpeningHoursSchedule, opening_hours, HourCycle } from '../src'
import './main.css'

const DEFAULT_HOURS = 'Mo-Fr 09:00-17:00; Sa 10:00-14:00'

function Demo() {
  const [locale, setLocale] = useState('en')
  const [localeInput, setLocaleInput] = useState('en')
  const [hourCycle, setHourCycle] = useState<HourCycle>(HourCycle.Auto)
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
    <div className='demo-container'>
      <header className='demo-header'>
        <div>
          <h1>OSM opening_hours React components</h1>
          <p>
            A set of locale-aware, self-contained React components for parsing, formatting and editing OSM opening_hours values.
          </p>
          <p>Both components use the <a href="https://github.com/opening-hours/opening_hours.js"><strong>opening_hours</strong></a> library for parsing the OSM opening_hours values.</p>
        </div>

        <div className='controls'>
          <div className='panel settings-card'>
            <strong className="panel-title">Component settings</strong>
            <div className='settings-fields'>
              <label className='field'>
                <span>Locale</span>
                <input
                  value={localeInput}
                  onChange={(e) => setLocaleInput(e.target.value)}
                  onBlur={(e) => setLocale(e.target.value || 'en')}
                />
              </label>

              <label className='field'>
                <span>Hour cycle</span>
                <select value={hourCycle} onChange={(e) => setHourCycle(e.target.value as HourCycle)}>
                  <option value={HourCycle.Auto}>Auto (from locale)</option>
                  <option value={HourCycle.TwentyFourHour}>24h</option>
                  <option value={HourCycle.TwelveHour}>12h</option>
                </select>
              </label>

              <label className='field'>
                <span>Day label style</span>
                <select value={dayLabelStyle} onChange={(e) => setDayLabelStyle(e.target.value as 'short' | 'long')}>
                  <option value="short">Short</option>
                  <option value="long">Long</option>
                </select>
              </label>
            </div>
          </div>

          <label className='panel value-card'>
            <strong className="panel-title">OSM opening_hours value</strong>
            <div className='value-row'>
              <code className='oh-code'>
                {formatted || '—'}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!formatted}
                className={`copy-btn ${copied ? 'is-copied' : ''}`}
                aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </label>
        </div>
      </header>

      <section className='demo-section'>
        <div className='cards-grid'>
          <div style={{ minWidth: 0 }}>
            <h2 className='mono'>OpeningHoursSchedule</h2>
            <div className='card'>
              <OpeningHoursSchedule
                openingHours={value}
                locale={locale}
                hourCycle={hourCycle === HourCycle.Auto ? undefined : hourCycle}
                dayLabelStyle={dayLabelStyle}
              />
            </div>
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 className='mono'>OpeningHoursEditor</h2>
            <div className='card'>
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
