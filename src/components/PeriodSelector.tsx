import type { Period } from '../types'
import { PERIOD_LABELS } from '../types'

const PERIODS: Period[] = ['weekly', 'monthly', 'yearly']

interface Props {
  period: Period
  onPeriodChange: (p: Period) => void
  rangeLabel: string
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  isCurrent: boolean
}

export function PeriodSelector({
  period,
  onPeriodChange,
  rangeLabel,
  onPrev,
  onNext,
  onToday,
  isCurrent,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex rounded-xl bg-surface p-1">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => onPeriodChange(p)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              p === period ? 'bg-emerald-500 text-white' : 'text-ink-soft hover:text-ink'
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={onPrev}
          aria-label="Previous period"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-ink-soft hover:bg-surface-hover"
        >
          ‹
        </button>
        <button
          onClick={onToday}
          disabled={isCurrent}
          className="text-sm font-medium text-ink disabled:text-ink-faint"
        >
          {rangeLabel}
        </button>
        <button
          onClick={onNext}
          aria-label="Next period"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-ink-soft hover:bg-surface-hover"
        >
          ›
        </button>
      </div>
    </div>
  )
}
