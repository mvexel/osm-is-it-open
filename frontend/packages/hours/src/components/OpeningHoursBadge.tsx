import { formatOpeningHours, type FormatOptions } from '../index'

type BadgeProps = {
  openingHours?: string | null
  coords?: [number, number]
  className?: string
} & Pick<
  FormatOptions,
  'locale' | 'timeZone' | 'twelveHourClock' | 'now' | 'lookaheadDays' | 'startOfWeek'
>

const statusStyles: Record<string, { bg: string; text: string }> = {
  open: { bg: '#dcfce7', text: '#166534' },
  closed: { bg: '#fee2e2', text: '#991b1b' },
  unknown: { bg: '#e5e7eb', text: '#374151' },
}

export function OpeningHoursBadge({
  openingHours,
  coords,
  className = '',
  ...opts
}: BadgeProps) {
  const info = formatOpeningHours(openingHours, { coords, ...opts })
  const styles = statusStyles[info.status]

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${className}`}
      style={{ backgroundColor: styles.bg, color: styles.text }}
    >
      <span
        aria-hidden
        style={{
          display: 'inline-block',
          width: '10px',
          height: '10px',
          borderRadius: '9999px',
          backgroundColor: styles.text,
        }}
      />
      <span>{info.label}</span>
    </span>
  )
}
