import type { OpeningHoursRange } from './openingHoursTypes'
import { CHIP_HEIGHT } from './editorLayout'
import { RangeChip } from './RangeChip'

type DayRowProps = {
  dayLabel: string
  ranges: OpeningHoursRange[]
  isEditingRange: (idx: number) => boolean
  onStartEdit: (idx: number) => void
  onChangeStart: (idx: number, value: string) => void
  onChangeEnd: (idx: number, value: string) => void
  onSetExiting: (idx: number) => void
  onExited: (idx: number) => void
  onDone: () => void
  onAddRange: (insertAfter: number) => void
  baselineRanges: OpeningHoursRange[]
  hourCycle?: '12h' | '24h'
}

export function DayRow({
  dayLabel,
  ranges,
  isEditingRange,
  onChangeStart,
  onChangeEnd,
  onSetExiting,
  onExited,
  onDone,
  onAddRange,
  baselineRanges,
  hourCycle,
}: DayRowProps) {
  const toMinutes = (value: string): number | null => {
    const [h, m] = value.split(':').map((n) => Number(n))
    if (Number.isNaN(h) || Number.isNaN(m)) return null
    return h * 60 + m
  }

  return (
    <div
      className="day-row"
    >
      <span className="day-row-label">{dayLabel}</span>

      <div
        className="day-row-ranges"
        style={{ minHeight: CHIP_HEIGHT }}
      >
        {ranges.map((range, idx) => {
          const startMinutes = toMinutes(range.start)
          const endMinutes = toMinutes(range.end)
          const isNextDay =
            startMinutes !== null && endMinutes !== null && endMinutes < startMinutes && range.end !== '24:00'
          return (
            <RangeChip
              key={`${dayLabel}-${idx}`}
              range={range}
              isEditing={isEditingRange(idx)}
              isChanged={
                !baselineRanges[idx] ||
                baselineRanges[idx].start !== range.start ||
                baselineRanges[idx].end !== range.end
              }
              hourCycle={hourCycle}
              endSuffix={isNextDay ? '+1' : undefined}
              onChangeStart={(value) => onChangeStart(idx, value)}
              onChangeEnd={(value) => onChangeEnd(idx, value)}
              onSetExiting={() => onSetExiting(idx)}
              onExited={() => onExited(idx)}
              onDone={onDone}
              onAddBelow={() => onAddRange(idx)}
            />
          )
        })}

        {ranges.length === 0 && (
          <button
            type="button"
            onClick={() => onAddRange(-1)}
            className="add-range-button"
            style={{ height: CHIP_HEIGHT }}
          >
            Add range
          </button>
        )}
      </div>
    </div>
  )
}
