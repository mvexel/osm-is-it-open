import { IconCircleCheck, IconClockPlus, IconClockX } from '@tabler/icons-react'
import type { OpeningHoursRange } from './openingHoursTypes'
import { CHIP_HEIGHT, CHIP_MIN_WIDTH } from './editorLayout'

type RangeChipProps = {
  range: OpeningHoursRange
  isEditing?: boolean
  isChanged?: boolean
  onChangeStart: (value: string) => void
  onChangeEnd: (value: string) => void
  onRemove: () => void
  onDone: () => void
  onAddBelow?: () => void
}

export function RangeChip({
  range,
  isEditing = true,
  isChanged = false,
  onChangeStart,
  onChangeEnd,
  onRemove,
  onDone,
  onAddBelow,
}: RangeChipProps) {
  const baseStyle: React.CSSProperties = {
    border: `1px solid ${isChanged ? '#fbbf24' : '#e2e8f0'}`,
    borderRadius: 10,
    height: CHIP_HEIGHT,
    minWidth: CHIP_MIN_WIDTH,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 8px',
    background: isChanged ? '#fffbeb' : '#f8fafc',
  }

  return (
    <div style={{ ...baseStyle, background: '#f8fafc' }}>
      <input
        type="time"
        value={range.start}
        onChange={(e) => onChangeStart(e.target.value)}
        style={{
          border: '1px solid #cbd5e1',
          borderRadius: 8,
          padding: '4px 6px',
          fontSize: 12,
          height: 24,
        }}
      />
      <span style={{ color: '#94a3b8', fontSize: 12 }}>to</span>
      <input
        type="time"
        value={range.end}
        onChange={(e) => onChangeEnd(e.target.value)}
        style={{
          border: '1px solid #cbd5e1',
          borderRadius: 8,
          padding: '4px 6px',
          fontSize: 12,
          height: 24,
        }}
      />
      <div style={{ display: 'flex', marginLeft: 'auto', gap: 6 }}>
        <button
          type="button"
          onClick={onRemove}
          style={{
            padding: '4px 6px',
            borderRadius: 6,
            border: 'none',
            background: 'transparent',
            color: '#be123c',
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label="Remove range"
        >
          <IconClockX size={16} />
        </button>
        <button
          type="button"
          onClick={onAddBelow}
          style={{
            padding: '4px 6px',
            borderRadius: 6,
            border: 'none',
            background: 'transparent',
            color: '#0f172a',
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label="Add range below"
        >
          <IconClockPlus size={16} />
        </button>
      </div>
    </div>
  )
}
