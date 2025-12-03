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
  hourCycle?: Exclude<HourCycle, HourCycle.Auto>
  now?: Date
  firstDayOfWeek?: number
  className?: string
}

export interface OpeningHoursEditorProps extends BaseOpeningHoursProps {
  openingHours: OpeningHoursLib | null
  onChange?: (openingHours: OpeningHoursLib) => void
  className?: string
}

export type OpeningHoursRange = { start: string; end: string; status?: 'entering' | 'exiting' }
export type OpeningHoursDay = { day: number; ranges: OpeningHoursRange[] }
export type OpeningHoursModel = {
  days: OpeningHoursDay[]
  modifiers: string[]
}
export type OpeningHoursBaseline = OpeningHoursModel
