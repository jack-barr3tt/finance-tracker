import { Button } from "flowbite-react"
import { useCallback, useState } from "react"
import { startOfYear, subDays, subMonths, subYears } from "date-fns"
import { TimePeriod } from "../API/requests"
import { SummaryRange, useData } from "../Hooks/useData"
import CustomSummaryRangeDropdown from "../Pages/Transactions/CustomSummaryRangeDropdown"

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

function getDefaultCustomRange(): SummaryRange {
  const today = new Date()

  return {
    startDate: subMonths(today, 1),
    endDate: today,
    interval: "day",
  }
}

export default function SummaryRangeFilter() {
  const { summaryRange, setSummaryRange } = useData()
  const [summaryRangeSelection, setSummaryRangeSelection] =
    useState<SummaryRangeSelection>("year")

  const activateCustomRange = useCallback(() => {
    setSummaryRangeSelection("custom")
    setSummaryRange(summaryRangeSelection === "custom" ? summaryRange : getDefaultCustomRange())
  }, [setSummaryRange, summaryRange, summaryRangeSelection])

  return (
    <div className="relative flex items-center gap-1">
      {SUMMARY_PRESETS.map((preset) => (
        <Button
          key={preset.value}
          color={summaryRangeSelection === preset.value ? "blue" : "light"}
          onClick={() => {
            setSummaryRangeSelection(preset.value)
            setSummaryRange(preset.getRange(new Date()))
          }}
        >
          {preset.title}
        </Button>
      ))}
      <CustomSummaryRangeDropdown
        active={summaryRangeSelection === "custom"}
        value={summaryRange}
        onActivate={activateCustomRange}
        onChange={setSummaryRange}
      />
    </div>
  )
}
