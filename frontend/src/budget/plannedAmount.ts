import { PeriodUnit } from "../API/requests"
import { toMonthlyAmount } from "../utils"
import {
  differenceInCalendarMonths,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  parseISO,
  startOfMonth,
} from "date-fns"

export type BudgetSegment = {
  starts_on: string
  ends_on?: string
  amount: number
  repeat_every: number
  repeat_until: PeriodUnit
}

function parseSegmentDate(date: string): Date {
  return startOfMonth(parseISO(date))
}

export function isSegmentActiveInMonth(segment: Pick<BudgetSegment, "starts_on" | "ends_on">, month: Date): boolean {
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const segmentStart = parseSegmentDate(segment.starts_on)

  if (isBefore(monthEnd, segmentStart)) {
    return false
  }

  if (segment.ends_on) {
    const segmentEnd = parseSegmentDate(segment.ends_on)
    if (isAfter(monthStart, segmentEnd)) {
      return false
    }
  }

  return true
}

function intervalMonths(repeatEvery: number, repeatUntil: PeriodUnit): number | null {
  switch (repeatUntil) {
    case "month":
      return repeatEvery
    case "year":
      return repeatEvery * 12
    default:
      return null
  }
}

export function plannedForMonth(
  amount: number,
  repeatEvery: number,
  repeatUntil: PeriodUnit,
  startsOn: string,
  month: Date,
  endsOn?: string,
): number {
  if (!isSegmentActiveInMonth({ starts_on: startsOn, ends_on: endsOn }, month)) {
    return 0
  }

  const interval = intervalMonths(repeatEvery, repeatUntil)
  if (interval === null) {
    return toMonthlyAmount(amount, repeatEvery, repeatUntil)
  }

  const monthsSinceStart = differenceInCalendarMonths(startOfMonth(month), parseSegmentDate(startsOn))
  if (monthsSinceStart < 0 || monthsSinceStart % interval !== 0) {
    return 0
  }

  return Math.abs(amount)
}

export function isSegmentActiveToday(segment: Pick<BudgetSegment, "starts_on" | "ends_on">): boolean {
  return isSegmentActiveInMonth(segment, new Date())
}

export function formatSegmentDateRange(startsOn: string, endsOn?: string): string {
  const startLabel = format(parseSegmentDate(startsOn), "MMM yyyy")

  if (!endsOn) {
    return `${startLabel} – ongoing`
  }

  const endLabel = format(parseSegmentDate(endsOn), "MMM yyyy")

  return `${startLabel} – ${endLabel}`
}

export function todayDateInputValue(): string {
  return format(new Date(), "yyyy-MM-dd")
}
