import Color from "color"
import { Button, ButtonGroup, Card, useThemeMode } from "flowbite-react"
import { format, parseISO } from "date-fns"
import { useMemo, useState } from "react"
import { LuChartLine, LuChartPie } from "react-icons/lu"
import { useGetUserIdSummaryTotals } from "../API"
import { defineGbpDonutChart } from "../charts/defineGbpDonutChart"
import type { GbpDonutSlice } from "../charts/defineGbpDonutChart"
import { defineGbpLineChart } from "../charts/defineGbpLineChart"
import type { GbpLineRow } from "../charts/defineGbpLineChart"
import FinanceChart from "../charts/FinanceChart"
import { useLegendIsolateVisible } from "../charts/useLegendIsolateVisible"
import { useData } from "../Hooks/useData"
import { useUser } from "../Hooks/useUser"
import { formatCurrencyGBP, getBrightColors } from "../utils"

type ChartView = "pie" | "line"

export default function CategoryPie() {
  const { computedMode } = useThemeMode()
  const isDark = computedMode === "dark"
  const { userId } = useUser()
  const [view, setView] = useState<ChartView>("pie")
  const {
    categorySummaries,
    categorySpendingSummary,
    categoryColorMap: colorMap,
    summaryDateQuery,
  } = useData()
  const { data: totals } = useGetUserIdSummaryTotals(userId, summaryDateQuery, {
    query: { enabled: !!userId },
  })

  const spendingCategoryIds = useMemo(
    () =>
      new Set(
        (categorySummaries?.filter((cat) => cat.total < 0) || []).map(
          (cat) => cat.category?.id || "uncategorised",
        ),
      ),
    [categorySummaries],
  )

  const { borders: pieBorders, fills: pieFills } = useMemo(
    () => getBrightColors(spendingCategoryIds.size),
    [spendingCategoryIds.size],
  )

  const pieSlices = useMemo<GbpDonutSlice[]>(() => {
    const spendingCategories =
      categorySummaries?.filter((cat) => cat.total < 0) || []

    return spendingCategories.map((cat, index) => {
      const categoryId = cat.category?.id || "uncategorised"
      const fill = colorMap ? colorMap[categoryId]?.fill : pieFills[index]
      const border = colorMap ? colorMap[categoryId]?.border : pieBorders[index]
      const c = Color(fill)

      return {
        name: cat.category?.name || "Uncategorised",
        value: -cat.total,
        fill: isDark ? c.alpha(0.25).string() : c.string(),
        border,
      }
    })
  }, [categorySummaries, colorMap, isDark, pieBorders, pieFills])

  const lineChart = useMemo(() => {
    const spendingSeries =
      categorySpendingSummary?.categories.filter((series) => {
        const categoryId = series.category?.id || "uncategorised"
        return spendingCategoryIds.has(categoryId)
      }) || []

    const dates =
      spendingSeries[0]?.amounts.map((item) =>
        format(parseISO(item.date), "dd MMM yyyy"),
      ) || []

    const datasets = spendingSeries
      .map((series, index) => {
        const categoryId = series.category?.id || "uncategorised"
        const borderColor = colorMap
          ? colorMap[categoryId]?.border
          : pieBorders[index]

        return {
          label: series.category?.name || "Uncategorised",
          data: series.amounts.map((item) => Math.abs(item.amount)),
          borderColor,
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label))

    const rows: GbpLineRow[] = datasets.flatMap((dataset) =>
      dates.map((date, index) => ({
        date,
        series: dataset.label,
        value: dataset.data[index] ?? 0,
      })),
    )

    return {
      rows,
      dates,
      seriesNames: datasets.map((dataset) => dataset.label),
      seriesColors: datasets.map((dataset) => dataset.borderColor),
      yMax: Math.max(1, ...rows.map((row) => row.value ?? 0)),
    }
  }, [categorySpendingSummary, colorMap, pieBorders, spendingCategoryIds])

  const pieSeriesNames = useMemo(
    () => pieSlices.map((slice) => slice.name),
    [pieSlices],
  )
  const pieLegend = useLegendIsolateVisible(pieSeriesNames)
  const lineLegend = useLegendIsolateVisible(lineChart.seriesNames)

  const pieDefinition = useMemo(
    () => defineGbpDonutChart(pieSlices, pieLegend.visibleSet),
    [pieLegend.visibleSet, pieSlices],
  )
  const lineDefinition = useMemo(
    () =>
      defineGbpLineChart({
        rows: lineChart.rows,
        dates: lineChart.dates,
        yDomain: [0, lineChart.yMax],
        seriesNames: lineChart.seriesNames,
        seriesColors: lineChart.seriesColors,
        visible: lineLegend.visibleSet,
      }),
    [lineChart, lineLegend.visibleSet],
  )

  return (
    <Card className="@container w-full">
      <div className="flex flex-col w-full gap-4">
        <div className="flex items-center justify-between w-full gap-4">
          <h1 className="text-xl font-medium">Spending by Category</h1>
          <ButtonGroup>
            <Button
              color={view === "pie" ? "blue" : "light"}
              title="Pie chart"
              aria-label="Pie chart"
              aria-pressed={view === "pie"}
              onClick={() => setView("pie")}
            >
              <LuChartPie />
            </Button>
            <Button
              color={view === "line" ? "blue" : "light"}
              title="Line chart"
              aria-label="Line chart"
              aria-pressed={view === "line"}
              onClick={() => setView("line")}
            >
              <LuChartLine />
            </Button>
          </ButtonGroup>
        </div>

        <div className="flex flex-col w-full gap-8 @xl:flex-row @xl:items-start">
          <div className="flex flex-col w-full shrink-0 gap-1 @xl:order-1 @xl:w-auto @xl:gap-4">
            <div className="flex flex-row items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 @xl:flex-col @xl:items-start @xl:justify-start @xl:min-w-[140px] @xl:p-4 dark:bg-gray-800">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Income
              </span>
              <span className="text-lg font-bold text-green-600 @xl:text-2xl dark:text-green-400">
                {formatCurrencyGBP(totals?.income ?? 0)}
              </span>
            </div>

            <div className="flex flex-row items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 @xl:flex-col @xl:items-start @xl:justify-start @xl:min-w-[140px] @xl:p-4 dark:bg-gray-800">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Outgoings
              </span>
              <span className="text-lg font-bold text-red-600 @xl:text-2xl dark:text-red-400">
                {formatCurrencyGBP(totals?.outgoing ?? 0)}
              </span>
            </div>

            <div className="flex flex-row items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 @xl:flex-col @xl:items-start @xl:justify-start @xl:min-w-[140px] @xl:p-4 dark:bg-gray-800">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Net
              </span>
              <span
                className={`text-lg font-bold @xl:text-2xl ${
                  (totals?.net ?? 0) >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {formatCurrencyGBP(totals?.net ?? 0)}
              </span>
            </div>
          </div>

          <div className="flex h-96 w-full min-w-0 flex-col gap-2 @xl:order-2 @xl:flex-1">
            {view === "pie" ? (
              <FinanceChart
                definition={pieDefinition}
                visible={pieLegend.visible}
                legendItems={pieSlices.map((slice) => ({
                  name: slice.name,
                  color: slice.border,
                }))}
                ariaLabel="Spending by category"
                legendAriaLabel="Category visibility"
                onItemClick={pieLegend.onItemClick}
              />
            ) : (
              <FinanceChart
                definition={lineDefinition}
                visible={lineLegend.visible}
                legendItems={lineChart.seriesNames.map((name, index) => ({
                  name,
                  color: lineChart.seriesColors[index],
                }))}
                ariaLabel="Spending by category over time"
                legendAriaLabel="Category visibility"
                onItemClick={lineLegend.onItemClick}
              />
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
