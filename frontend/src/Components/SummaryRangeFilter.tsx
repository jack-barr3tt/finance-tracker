import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react"
import { Button, ButtonGroup } from "flowbite-react"
import { type SetStateAction, useCallback, useMemo, useState } from "react"
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInCalendarYears,
  format,
  isSameDay,
  isSameYear,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from "date-fns"
import { FiChevronLeft, FiChevronRight } from "react-icons/fi"
import { SummaryInterval, TimePeriod } from "../API/requests"
import { SummaryRange, useData } from "../Hooks/useData"
import CalendarDatePicker from "./CalendarDatePicker"
import SearchSelect from "./SearchSelect"

type SummaryRangeSelection = TimePeriod | "custom"

const SUMMARY_PRESETS: Array<{
  value: TimePeriod
  title: string
  getRange: (today: Date) => SummaryRange
}> = [
  {
    value: "week",
    title: "Week",
    getRange: (today) => ({
      startDate: subDays(today, 7),
      endDate: today,
      interval: "day",
    }),
  },
  {
    value: "month",
    title: "Month",
    getRange: (today) => ({
      startDate: subMonths(today, 1),
      endDate: today,
      interval: "day",
    }),
  },
  {
    value: "year",
    title: "Year",
    getRange: (today) => ({
      startDate: subYears(today, 1),
      endDate: today,
      interval: "month",
    }),
  },
  {
    value: "ytd",
    title: "YTD",
    getRange: (today) => ({
      startDate: startOfYear(today),
      endDate: today,
      interval: "month",
    }),
  },
  {
    value: "all",
    title: "All",
    getRange: () => ({
      startDate: null,
      endDate: null,
      interval: "month",
    }),
  },
]

const INTERVAL_OPTIONS: Array<{ value: SummaryInterval; label: string }> = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
]

function formatRangeLabel(range: SummaryRange) {
  const { startDate, endDate } = range
  if (!startDate && !endDate) return "All"
  if (!startDate) return `Until ${format(endDate!, "d MMM yyyy")}`
  if (!endDate) return `From ${format(startDate, "d MMM yyyy")}`
  if (isSameDay(startDate, endDate)) return format(startDate, "d MMM yyyy")

  const dateFormat = isSameYear(startDate, endDate) ? "d MMM" : "d MMM yyyy"
  return `${format(startDate, dateFormat)} - ${format(endDate, "d MMM yyyy")}`
}

function shiftDateRange(range: SummaryRange, direction: -1 | 1): SummaryRange {
  const { startDate, endDate } = range
  if (!startDate || !endDate) return range

  const years = differenceInCalendarYears(endDate, startDate)
  if (years > 0 && isSameDay(addYears(startDate, years), endDate)) {
    return {
      ...range,
      startDate: addYears(startDate, years * direction),
      endDate: addYears(endDate, years * direction),
    }
  }

  const months = differenceInCalendarMonths(endDate, startDate)
  if (months > 0 && isSameDay(addMonths(startDate, months), endDate)) {
    return {
      ...range,
      startDate: addMonths(startDate, months * direction),
      endDate: addMonths(endDate, months * direction),
    }
  }

  const days = differenceInCalendarDays(endDate, startDate)
  const weeks = days / 7
  if (Number.isInteger(weeks) && weeks > 0 && isSameDay(addWeeks(startDate, weeks), endDate)) {
    return {
      ...range,
      startDate: addWeeks(startDate, weeks * direction),
      endDate: addWeeks(endDate, weeks * direction),
    }
  }

  const fallbackDays = days === 0 ? 1 : days

  return {
    ...range,
    startDate: addDays(startDate, fallbackDays * direction),
    endDate: addDays(endDate, fallbackDays * direction),
  }
}

export default function SummaryRangeFilter() {
  const { summaryRange, setSummaryRange } = useData()
  const [summaryRangeSelection, setSummaryRangeSelection] =
    useState<SummaryRangeSelection>("year")
  const [isOpen, setIsOpen] = useState(false)

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: "bottom-end",
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  })
  const dismiss = useDismiss(context)
  const role = useRole(context)
  const { getReferenceProps, getFloatingProps } = useInteractions([dismiss, role])

  const setReference = useCallback(
    (node: HTMLButtonElement | null) => {
      refs.setReference(node)
    },
    [refs],
  )

  const rangeLabel = useMemo(() => formatRangeLabel(summaryRange), [summaryRange])
  const canShiftRange = Boolean(summaryRange.startDate && summaryRange.endDate)

  const updateCustomRange = useCallback(
    (updates: Partial<SummaryRange>) => {
      setSummaryRangeSelection("custom")
      setSummaryRange({
        ...summaryRange,
        ...updates,
      })
    },
    [setSummaryRange, summaryRange],
  )

  const updateInterval = useCallback(
    (nextInterval: SetStateAction<string | undefined>) => {
      const interval =
        typeof nextInterval === "function" ? nextInterval(summaryRange.interval) : nextInterval
      if (!interval) return

      updateCustomRange({ interval: interval as SummaryInterval })
    },
    [summaryRange.interval, updateCustomRange],
  )

  const selectPresetRange = useCallback(
    (preset: (typeof SUMMARY_PRESETS)[number]) => {
      setSummaryRangeSelection(preset.value)
      setSummaryRange(preset.getRange(new Date()))
      setIsOpen(false)
    },
    [setSummaryRange],
  )

  const shiftRange = useCallback(
    (direction: -1 | 1) => {
      if (!canShiftRange) return

      setSummaryRangeSelection("custom")
      setSummaryRange(shiftDateRange(summaryRange, direction))
    },
    [canShiftRange, setSummaryRange, summaryRange],
  )

  return (
    <>
      <ButtonGroup>
        <Button
          color="light"
          disabled={!canShiftRange}
          title="Previous range"
          aria-label="Previous range"
          onClick={() => shiftRange(-1)}
        >
          <FiChevronLeft />
        </Button>
        <Button
          color="light"
          ref={setReference}
          className="min-w-48"
          {...getReferenceProps({
            onClick: () => setIsOpen((current) => !current),
          })}
        >
          <span className="w-full text-center">{rangeLabel}</span>
        </Button>
        <Button
          color="light"
          disabled={!canShiftRange}
          title="Next range"
          aria-label="Next range"
          onClick={() => shiftRange(1)}
        >
          <FiChevronRight />
        </Button>
      </ButtonGroup>

      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className="z-50 w-[38rem] rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800"
            {...getFloatingProps()}
          >
            <div className="grid grid-cols-[1fr_auto] gap-4">
              <div className="flex min-w-72 flex-col gap-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Custom range
                </h3>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Start date
                  </span>
                  <CalendarDatePicker
                    value={summaryRange.startDate}
                    onChange={(startDate) => updateCustomRange({ startDate })}
                    placeholder="Start date"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    End date
                  </span>
                  <CalendarDatePicker
                    value={summaryRange.endDate}
                    onChange={(endDate) => updateCustomRange({ endDate })}
                    placeholder="End date"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Interval
                  </span>
                  <SearchSelect
                    value={summaryRange.interval}
                    options={INTERVAL_OPTIONS}
                    onValueChange={updateInterval}
                    onSearchChange={() => {}}
                    showSearch={false}
                  />
                </div>
              </div>

              <div className="flex w-32 flex-col gap-2 border-l border-gray-200 pl-4 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Presets</h3>
                {SUMMARY_PRESETS.map((preset) => (
                  <Button
                    key={preset.value}
                    color={summaryRangeSelection === preset.value ? "blue" : "light"}
                    onClick={() => selectPresetRange(preset)}
                  >
                    {preset.title}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  )
}
