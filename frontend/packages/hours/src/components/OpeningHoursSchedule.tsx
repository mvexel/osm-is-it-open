import { formatOpeningHours, type FormatOptions } from '../index'

type ScheduleProps = {
  openingHours?: string | null
  coords?: [number, number]
  className?: string
  startOfWeek?: number
} & Pick<FormatOptions, 'locale' | 'timeZone' | 'twelveHourClock' | 'now' | 'lookaheadDays'>

export function OpeningHoursSchedule({
  openingHours,
  coords,
  className = '',
  startOfWeek,
  ...opts
}: ScheduleProps) {
  const info = formatOpeningHours(openingHours, { coords, startOfWeek, ...opts })
  const today = (opts.now ?? new Date()).getDay()

  return (
    <div className={`rounded-lg border border-gray-200 bg-white text-sm ${className}`}>
      <div className="divide-y divide-gray-200">
        {info.intervals.map((day) => {
          const isToday = day.day === today
          const ranges =
            day.ranges.length > 0
              ? day.ranges.map((r) => `${r.start}–${r.end}`).join(', ')
              : 'Closed'

          return (
            <div
              key={day.day}
              className="flex items-center justify-between px-3 py-2"
              style={{
                backgroundColor: isToday ? '#f1f5f9' : 'transparent',
                fontWeight: isToday ? 600 : 400,
              }}
            >
              <span>{day.label}</span>
              <span>{ranges}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
