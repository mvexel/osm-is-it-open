import type { opening_hours as OpeningHoursLib } from 'opening_hours'

export enum HourCycle {
  Auto = 'auto',
  TwelveHour = '12h',
  TwentyFourHour = '24h',
}

interface BaseOpeningHoursProps {
  locale?: string
  dayLabelStyle?: 'short' | 'long'
}

export interface OpeningHoursScheduleProps extends BaseOpeningHoursProps {
  openingHours: OpeningHoursLib | null
  timeZone?: string
  hourCycle?: Exclude<HourCycle, HourCycle.Auto> | '12h' | '24h'
  now?: Date
  startOfWeek?: number
  className?: string
}

export interface OpeningHoursEditorProps extends BaseOpeningHoursProps {
  openingHours: OpeningHoursLib | null
  onChange?: (openingHours: OpeningHoursLib) => void
  className?: string
}
