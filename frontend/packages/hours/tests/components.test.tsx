import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { OpeningHoursBadge, OpeningHoursSchedule } from '../src'

describe('OpeningHoursBadge', () => {
  it('renders open status', () => {
    render(<OpeningHoursBadge openingHours="24/7" />)
    expect(screen.getByText(/^Open$/i)).toBeTruthy()
  })
})

describe('OpeningHoursSchedule', () => {
  it('renders seven days', () => {
    render(<OpeningHoursSchedule openingHours="Mo-Fr 09:00-17:00" />)
    const rows = screen.getAllByText(/mon|tue|wed|thu|fri|sat|sun/i)
    expect(rows.length).toBeGreaterThanOrEqual(7)
  })
})
