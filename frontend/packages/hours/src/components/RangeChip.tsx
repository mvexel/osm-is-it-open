import { IconClockPlus, IconClockX } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import type { OpeningHoursRange } from './openingHoursTypes'
import { CHIP_HEIGHT, CHIP_MIN_WIDTH } from './editorLayout'

type RangeChipProps = {
  range: OpeningHoursRange
  isEditing?: boolean
  isChanged?: boolean
  hourCycle?: '12h' | '24h'
  endSuffix?: string
  onChangeStart: (value: string) => void
  onChangeEnd: (value: string) => void
  onSetExiting: () => void
  onExited: () => void
  onDone: () => void
  onAddBelow?: () => void
}

export function RangeChip({
  range,
  isEditing = true,
  isChanged = false,
  hourCycle = '24h',
  endSuffix,
  onChangeStart,
  onChangeEnd,
  onSetExiting,
  onExited,
  onDone,
  onAddBelow,
}: RangeChipProps) {
  const [isVisible, setIsVisible] = useState(range.status !== 'entering')

  useEffect(() => {
    if (range.status === 'entering') {
      requestAnimationFrame(() => {
        setIsVisible(true)
      })
    } else if (range.status === 'exiting') {
      setIsVisible(false)
    }
  }, [range.status])

  const baseStyle: React.CSSProperties = {
    border: `1px solid ${isChanged ? '#fbbf24' : '#e2e8f0'}`,
    borderRadius: 10,
    minWidth: CHIP_MIN_WIDTH,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 8px',
    background: isChanged ? '#fffbeb' : '#f8fafc',
    transition: 'opacity 300ms ease-in-out, max-height 300ms ease-in-out, padding 300ms ease-in-out, border 300ms ease-in-out',
    opacity: isVisible ? 1 : 0,
    maxHeight: isVisible ? CHIP_HEIGHT : 0,
    paddingTop: isVisible ? '6px' : '0',
    paddingBottom: isVisible ? '6px' : '0',
    overflow: 'hidden',
  }

  return (
    <div 
      style={baseStyle}
      onTransitionEnd={() => {
        if (!isVisible) {
          onExited()
        }
      }}
    >
      <input
        type="text"
        value={range.start}
        onChange={(e) => onChangeStart(e.target.value)}
        style={{
          border: '1px solid #cbd5e1',
          borderRadius: 8,
          padding: '4px 6px',
          fontSize: 12,
          height: 24,
          width: 70,
        }}
        inputMode="numeric"
        placeholder={hourCycle === '24h' ? '09:00' : '09:00 AM'}
      />
      <span style={{ color: '#94a3b8', fontSize: 12 }}>to</span>
      <input
        type="text"
        value={range.end}
        onChange={(e) => onChangeEnd(e.target.value)}
        style={{
          border: '1px solid #cbd5e1',
          borderRadius: 8,
          padding: '4px 6px',
          fontSize: 12,
          height: 24,
          width: 70,
        }}
        inputMode="numeric"
        placeholder={hourCycle === '24h' ? '21:00' : '09:00 PM'}
      />
      {endSuffix && <span style={{ fontSize: 11, color: '#334155' }}>{endSuffix}</span>}
      <div style={{ display: 'flex', marginLeft: 'auto', gap: 6 }}>
        <button
          type="button"
          onClick={onSetExiting}
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
