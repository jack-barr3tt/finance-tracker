import { PeriodUnit } from "../API"
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
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

function addRecurrence(
  date: Date,
  repeatEvery: number,
  repeatUntil: PeriodUnit,
): Date {
  switch (repeatUntil) {
    case "day":
      return addDays(date, repeatEvery)
    case "week":
      return addWeeks(date, repeatEvery)
    case "month":
      return addMonths(date, repeatEvery)
    case "year":
      return addYears(date, repeatEvery)
  }
}

function occurrenceCountInMonth(
  repeatEvery: number,
  repeatUntil: PeriodUnit,
  startsOn: string,
  month: Date,
  endsOn?: string,
): number {
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const anchor = parseISO(startsOn)
  const segmentEnd = endsOn ? parseISO(endsOn) : null

  if (isAfter(anchor, monthEnd)) {
    return 0
  }

  if (segmentEnd && isBefore(segmentEnd, monthStart)) {
    return 0
  }

  let current = anchor
  while (isBefore(current, monthStart)) {
    current = addRecurrence(current, repeatEvery, repeatUntil)
  }

  let count = 0
  while (!isAfter(current, monthEnd)) {
    if (segmentEnd && isAfter(current, segmentEnd)) {
      break
    }
    count++
    current = addRecurrence(current, repeatEvery, repeatUntil)
  }

  return count
}

export function isSegmentActiveInMonth(
  segment: Pick<BudgetSegment, "starts_on" | "ends_on">,
  month: Date,
): boolean {
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

export function plannedForMonth(
  amount: number,
  repeatEvery: number,
  repeatUntil: PeriodUnit,
  startsOn: string,
  month: Date,
  endsOn?: string,
): number {
  if (
    !isSegmentActiveInMonth({ starts_on: startsOn, ends_on: endsOn }, month)
  ) {
    return 0
  }

  const count = occurrenceCountInMonth(
    repeatEvery,
    repeatUntil,
    startsOn,
    month,
    endsOn,
  )
  return count * Math.abs(amount)
}

export function isSegmentActiveToday(
  segment: Pick<BudgetSegment, "starts_on" | "ends_on">,
): boolean {
  return isSegmentActiveInMonth(segment, new Date())
}

export function formatSegmentDateRange(
  startsOn: string,
  endsOn?: string,
): string {
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
