import type { opening_hours as OpeningHoursLib } from 'opening_hours'

/**
 * Props for the OpeningHours display component
 */
export interface OpeningHoursProps {
  /** opening_hours instance to display */
  openingHours: OpeningHoursLib | null
  /** Locale for formatting (default: 'en') */
  locale?: string
  /** Timezone for display (default: user's local timezone) */
  timeZone?: string
  /** Hour cycle for time display (default: '24h') */
  hourCycle?: '12h' | '24h'
  /** Reference time for status calculation (default: now) */
  now?: Date
  /** Additional CSS class name */
  className?: string
  /** Enable editing mode (default: false) */
  editable?: boolean
  /** Callback when opening hours are modified (only used when editable=true) */
  onChange?: (openingHours: OpeningHoursLib) => void
}

/**
 * Props for the OpeningHoursEditor component
 */
export interface OpeningHoursEditorProps {
  /** opening_hours instance to edit */
  openingHours: OpeningHoursLib | null
  /** Callback when opening hours are modified */
  onChange?: (openingHours: OpeningHoursLib) => void
  /** Hour cycle for time input (default: '24h') */
  hourCycle?: '12h' | '24h'
  /** Additional CSS class name */
  className?: string
  /** Original opening_hours instance for comparison (for reset functionality) */
  originalOpeningHours?: OpeningHoursLib
  /** OSM element ID in format 'node/123' or 'way/456' for linking to osm.org */
  osmId?: string
}

/**
 * Props for the OpeningHoursSchedule component
 */
export interface OpeningHoursScheduleProps {
  /** opening_hours instance to display */
  openingHours: OpeningHoursLib | null
  /** Locale for formatting (default: 'en') */
  locale?: string
  /** Day label style (default: 'short') */
  dayLabelStyle?: 'short' | 'long'
  /** Timezone for display (default: user's local timezone) */
  timeZone?: string
  /** Hour cycle for time display (default: '24h') */
  hourCycle?: '12h' | '24h'
  /** Reference time (default: current time) */
  now?: Date
  /** Start of week (0=Sunday, 1=Monday, default: 1) */
  startOfWeek?: number
  /** Additional CSS class name */
  className?: string
}
