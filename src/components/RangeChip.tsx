import { useEffect, useState } from 'react'
import type { OpeningHoursRange } from './openingHoursTypes'
import { CHIP_HEIGHT } from './editorLayout'
import { IconClockPlus } from './icons/IconClockPlus'
import { IconClockX } from './icons/IconClockX'

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

  const style: React.CSSProperties = {
    opacity: isVisible ? 1 : 0,
    maxHeight: isVisible ? CHIP_HEIGHT : 0,
    paddingTop: isVisible ? '6px' : '0',
    paddingBottom: isVisible ? '6px' : '0',
  }

  return (
    <div
      className={`range-chip ${isChanged ? 'changed' : 'normal'}`}
      style={style}
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
        inputMode="numeric"
        placeholder={hourCycle === '24h' ? '09:00' : '09:00 AM'}
      />
      <span className="separator">to</span>
      <input
        type="text"
        value={range.end}
        onChange={(e) => onChangeEnd(e.target.value)}
        inputMode="numeric"
        placeholder={hourCycle === '24h' ? '21:00' : '09:00 PM'}
      />
      {endSuffix && <span className="suffix">{endSuffix}</span>}
      <div className="buttons">
        <button
          type="button"
          onClick={onSetExiting}
          className="remove-button"
          aria-label="Remove range"
        >
          <IconClockX size={16} />
        </button>
        <button
          type="button"
          onClick={onAddBelow}
          className="add-button"
          aria-label="Add range below"
        >
          <IconClockPlus size={16} />
        </button>
      </div>
    </div>
  )
}
