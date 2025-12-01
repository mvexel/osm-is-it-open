import { formatOpeningHours, type FormatOptions } from '../index'

type BadgeProps = {
  openingHours?: string | null
  coords?: [number, number]
  className?: string
} & Pick<
  FormatOptions,
  'locale' | 'timeZone' | 'twelveHourClock' | 'hourCycle' | 'now' | 'lookaheadDays' | 'startOfWeek' | 'countryCode'
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
  const labelParts = info.label.match(/^(Open until|Closed • opens)\s*(.*)$/i)
  const primary = info.status === 'open' ? 'Open' : info.status === 'closed' ? 'Closed' : 'Unknown'
  const secondary = labelParts ? `${labelParts[1]} ${labelParts[2]}` : info.label

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2px',
        padding: '8px 12px',
        borderRadius: '6px',
        background: styles.bg,
        color: styles.text,
        minWidth: '140px',
        textAlign: 'center',
      }}
    >
      <span style={{ fontSize: '14px', fontWeight: 600 }}>{primary}</span>
      <span style={{ fontSize: '12px', fontWeight: 400, opacity: 0.8, lineHeight: 1.2 }}>
        {secondary}
      </span>
    </span>
  )
}
