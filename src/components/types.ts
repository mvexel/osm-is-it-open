import type { opening_hours as OpeningHoursLib } from 'opening_hours'

/**
 * Props for the OpeningHoursEditor component
 */
export interface OpeningHoursEditorProps {
  /** opening_hours instance to edit */
  openingHours: OpeningHoursLib | null
  /** Callback when edits produce a valid opening_hours instance */
  onChange?: (openingHours: OpeningHoursLib) => void
  /** Locale for day labels (default: 'en') */
  locale?: string
  /** Day label style (default: 'short') */
  dayLabelStyle?: 'short' | 'long'
  /** Additional CSS class name */
  className?: string
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
