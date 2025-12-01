import type { opening_hours as OpeningHoursLib } from 'opening_hours'

/**
 * Props for the OpeningHours display component
 */
export interface OpeningHoursProps {
  /** opening_hours instance to display */
  openingHours: OpeningHoursLib
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
  openingHours: OpeningHoursLib
  /** Callback when opening hours are modified */
  onChange?: (openingHours: OpeningHoursLib) => void
  /** Hour cycle for time input (default: '24h') */
  hourCycle?: '12h' | '24h'
  /** Additional CSS class name */
  className?: string
  /** Original opening_hours instance for comparison (for reset functionality) */
  originalOpeningHours?: OpeningHoursLib
}
