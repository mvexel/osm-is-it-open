export type OpeningHoursRange = { start: string; end: string; status?: 'entering' | 'exiting' }
export type OpeningHoursDay = { day: number; ranges: OpeningHoursRange[] }
export type OpeningHoursModel = {
  days: OpeningHoursDay[]
  modifiers: string[]
}
export type OpeningHoursBaseline = OpeningHoursModel
