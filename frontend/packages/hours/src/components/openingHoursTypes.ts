export type OpeningHoursRange = { start: string; end: string }
export type OpeningHoursDay = { day: number; ranges: OpeningHoursRange[] }
export type OpeningHoursModel = OpeningHoursDay[]
export type OpeningHoursBaseline = OpeningHoursModel
