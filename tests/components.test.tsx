import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { OpeningHours, OpeningHoursSchedule, opening_hours } from '../src'

describe('OpeningHours', () => {
  it('renders open status for a 24/7 schedule', () => {
    const oh = new opening_hours('24/7')
    render(<OpeningHours openingHours={oh} now={new Date('2024-01-01T12:00:00Z')} />)
    expect(screen.getByText(/^Open$/i)).toBeTruthy()
  })

  it('renders the editor when editable', () => {
    const oh = new opening_hours('Mo-Fr 09:00-17:00')
    render(<OpeningHours openingHours={oh} editable now={new Date('2024-01-01T12:00:00Z')} />)
    expect(screen.getByText(/Opening Hours/i)).toBeTruthy()
  })
})

describe('OpeningHoursSchedule', () => {
  it('renders seven days', () => {
    const oh = new opening_hours('Mo-Fr 09:00-17:00')
    render(<OpeningHoursSchedule openingHours={oh} />)
    const rows = screen.getAllByText(/Mon|Tue|Wed|Thu|Fri|Sat|Sun/i)
    expect(rows.length).toBeGreaterThanOrEqual(7)
  })
})
