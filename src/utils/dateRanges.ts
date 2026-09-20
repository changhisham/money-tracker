import {
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subMonths,
  subWeeks,
  subYears,
} from 'date-fns'
import type { Period } from '../types'

export interface DateRange {
  start: Date
  end: Date
  label: string
}

export function getRange(period: Period, anchor: Date): DateRange {
  switch (period) {
    case 'weekly': {
      const start = startOfWeek(anchor, { weekStartsOn: 1 })
      const end = endOfWeek(anchor, { weekStartsOn: 1 })
      return { start, end, label: `${format(start, 'd MMM')} – ${format(end, 'd MMM yyyy')}` }
    }
    case 'monthly': {
      const start = startOfMonth(anchor)
      const end = endOfMonth(anchor)
      return { start, end, label: format(anchor, 'MMMM yyyy') }
    }
    case 'yearly': {
      const start = startOfYear(anchor)
      const end = endOfYear(anchor)
      return { start, end, label: format(anchor, 'yyyy') }
    }
  }
}

export function shiftAnchor(period: Period, anchor: Date, direction: 1 | -1): Date {
  switch (period) {
    case 'weekly':
      return direction === 1 ? addWeeks(anchor, 1) : subWeeks(anchor, 1)
    case 'monthly':
      return direction === 1 ? addMonths(anchor, 1) : subMonths(anchor, 1)
    case 'yearly':
      return direction === 1 ? addYears(anchor, 1) : subYears(anchor, 1)
  }
}

export function isDateInRange(dateStr: string, range: DateRange): boolean {
  const date = new Date(`${dateStr}T00:00:00`)
  return isWithinInterval(date, { start: range.start, end: range.end })
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

export function todayIso(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function relativeDayLabel(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`)
  const days = differenceInCalendarDays(new Date(), date)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days > 1 && days < 7) return format(date, 'EEEE')
  return format(date, 'd MMM yyyy')
}

export interface PeriodPoint {
  anchor: Date
  range: DateRange
}

export function recentPeriods(period: Period, anchor: Date, count: number): PeriodPoint[] {
  const points: PeriodPoint[] = []
  let cursor = anchor
  for (let i = 0; i < count; i++) {
    points.unshift({ anchor: cursor, range: getRange(period, cursor) })
    cursor = shiftAnchor(period, cursor, -1)
  }
  return points
}
