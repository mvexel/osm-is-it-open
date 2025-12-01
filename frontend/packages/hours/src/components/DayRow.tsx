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
  onRemoveRange: (idx: number) => void
  onDone: () => void
  onAddRange: (insertAfter: number) => void
  baselineRanges: OpeningHoursRange[]
  hourCycle: '12h' | '24h'
}

export function DayRow({
  dayLabel,
  ranges,
  isEditingRange,
  onStartEdit,
  onChangeStart,
  onChangeEnd,
  onRemoveRange,
  onDone,
  onAddRange,
  baselineRanges,
  hourCycle,
}: DayRowProps) {
  return (
    <div
      style={{
        borderBottom: '1px solid #e2e8f0',
        padding: '4px 0',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        minHeight: 44,
      }}
    >
      <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', minWidth: 42 }}>{dayLabel}</span>

      <div
        style={{
          display: 'flex',
          gap: 6,
          alignItems: 'center',
          flexWrap: 'wrap',
          flex: 1,
          justifyContent: 'flex-start',
          minHeight: CHIP_HEIGHT,
        }}
      >
        {ranges.map((range, idx) => (
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
            onStartEdit={() => onStartEdit(idx)}
            onChangeStart={(value) => onChangeStart(idx, value)}
            onChangeEnd={(value) => onChangeEnd(idx, value)}
            onRemove={() => onRemoveRange(idx)}
            onDone={onDone}
            onAddBelow={() => onAddRange(idx)}
          />
        ))}

        {ranges.length === 0 && (
          <button
            type="button"
            onClick={() => onAddRange(-1)}
            style={{
              padding: '6px 10px',
              borderRadius: 10,
              border: '1px dashed #cbd5e1',
              background: '#f8fafc',
              color: '#0f172a',
              fontSize: 12,
              cursor: 'pointer',
              height: CHIP_HEIGHT,
            }}
          >
            Add range
          </button>
        )}
      </div>
    </div>
  )
}
