import type { opening_hours as OpeningHoursLib } from 'opening_hours'

/**
 * Props for the OpeningHoursEditor component
 */
export interface OpeningHoursEditorProps {
  /** opening_hours instance to display */
  openingHours: OpeningHoursLib | null
  /** Locale for formatting (default: 'en') */
  locale?: string
  /** Timezone for display (default: user's local timezone) */
  timeZone?: string
  /** Hour cycle for time display (default: auto-detect from locale) */
  hourCycle?: '12h' | '24h'
  /** Reference time for status calculation (default: now) */
  now?: Date
  /** Additional CSS class name */
  className?: string
  /** Enable editing mode (default: false) */
  editable?: boolean
  /** Callback when opening hours are modified (only used when editable=true) */
  onChange?: (openingHours: OpeningHoursLib) => void
  /** Original opening_hours instance for comparison (for reset functionality) */
  originalOpeningHours?: OpeningHoursLib
  /** OSM element ID in format 'node/123' or 'way/456' for linking to osm.org */
  osmId?: string
  /** Show additional rules input field (default: false) */
  showAdditionalRules?: boolean
  /** Show raw OSM opening_hours value (default: false) */
  rawOsm?: boolean
  /** Allow editing raw OSM string (default: false, only applies when rawOsm=true) */
  osmReadWrite?: boolean
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
  /** Hour cycle for time display (default: auto-detect from locale) */
  hourCycle?: '12h' | '24h'
  /** Reference time (default: current time) */
  now?: Date
  /** Start of week (0=Sunday, 1=Monday, default: 1) */
  startOfWeek?: number
  /** Additional CSS class name */
  className?: string
}
