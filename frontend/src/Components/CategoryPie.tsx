import type { EChartsOption } from "echarts"
import Color from "color"
import { format, parseISO } from "date-fns"
import { Button, ButtonGroup, Card, useThemeMode } from "flowbite-react"
import { useMemo, useState } from "react"
import { LuChartLine, LuChartPie } from "react-icons/lu"
import EChart from "../charts/EChart"
import {
  getChartBaseOption,
  getDoughnutLegendOption,
  getDoughnutSeriesOption,
  getLineChartAxesOption,
  getLineChartGridOption,
  getLineChartLegendOption,
} from "../charts/theme"
import { formatCurrencyGBP, getBrightColors } from "../utils"
import { useData } from "../Hooks/useData"
import { useUser } from "../Hooks/useUser"
import { useGetUserIdSummaryTotals } from "../API"

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

  const pieOption = useMemo<EChartsOption>(() => {
    const spendingCategories =
      categorySummaries?.filter((cat) => cat.total < 0) || []
    const baseOption = getChartBaseOption(isDark)

    const data = spendingCategories.map((cat, index) => {
      const categoryId = cat.category?.id || "uncategorised"
      const fill = colorMap ? colorMap[categoryId]?.fill : pieFills[index]
      const border = colorMap ? colorMap[categoryId]?.border : pieBorders[index]
      const c = Color(fill)

      return {
        name: cat.category?.name || "Uncategorised",
        value: -cat.total,
        itemStyle: {
          color: isDark ? c.alpha(0.25).string() : c.string(),
          borderColor: border,
          borderWidth: 2,
        },
      }
    })

    return {
      ...baseOption,
      tooltip: {
        ...baseOption.tooltip,
        trigger: "item",
        valueFormatter: (value) => formatCurrencyGBP(value as number),
      },
      legend: {
        ...getDoughnutLegendOption(isDark),
        data: data.map((item) => item.name),
      },
      series: [
        {
          ...getDoughnutSeriesOption(),
          data,
        },
      ],
    }
  }, [categorySummaries, colorMap, isDark, pieBorders, pieFills])

  const lineOption = useMemo<EChartsOption>(() => {
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

    const baseOption = getChartBaseOption(isDark)
    const axesOption = getLineChartAxesOption(isDark)

    return {
      ...baseOption,
      tooltip: {
        ...baseOption.tooltip,
        trigger: "axis",
        axisPointer: {
          type: "cross",
        },
        valueFormatter: (value) => formatCurrencyGBP(value as number),
      },
      legend: {
        ...getLineChartLegendOption(isDark),
        data: datasets.map((dataset) => dataset.label),
        selectedMode: true,
      },
      grid: getLineChartGridOption(),
      xAxis: {
        ...axesOption.xAxis,
        type: "category",
        boundaryGap: false,
        data: dates,
      },
      yAxis: {
        ...axesOption.yAxis,
        type: "value",
        min: 0,
        axisLabel: {
          ...(typeof axesOption.yAxis === "object" &&
          !Array.isArray(axesOption.yAxis)
            ? axesOption.yAxis.axisLabel
            : {}),
          formatter: (value: number) => formatCurrencyGBP(value),
        },
      },
      series: datasets.map((dataset) => ({
        name: dataset.label,
        type: "line",
        showSymbol: false,
        data: dataset.data,
        lineStyle: {
          color: dataset.borderColor,
        },
        itemStyle: {
          color: dataset.borderColor,
        },
      })),
    }
  }, [
    categorySpendingSummary,
    colorMap,
    isDark,
    pieBorders,
    spendingCategoryIds,
  ])

  const option = view === "pie" ? pieOption : lineOption

  return (
    <Card className="w-1/2">
      <div className="flex flex-col items-center gap-4">
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

        <div className="flex flex-col items-center justify-center w-full gap-8 xl:flex-row">
          <div className="flex flex-col w-full gap-1 xl:gap-4 xl:order-1 xl:w-auto">
            <div className="flex flex-row items-center justify-between gap-2 px-3 py-2 xl:flex-col xl:items-start xl:justify-start xl:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg xl:min-w-[140px]">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Income
              </span>
              <span className="text-lg font-bold text-green-600 xl:text-2xl dark:text-green-400">
                {formatCurrencyGBP(totals?.income ?? 0)}
              </span>
            </div>

            <div className="flex flex-row items-center justify-between gap-2 px-3 py-2 xl:flex-col xl:items-start xl:justify-start xl:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg xl:min-w-[140px]">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Outgoings
              </span>
              <span className="text-lg font-bold text-red-600 xl:text-2xl dark:text-red-400">
                {formatCurrencyGBP(totals?.outgoing ?? 0)}
              </span>
            </div>

            <div className="flex flex-row items-center justify-between gap-2 px-3 py-2 xl:flex-col xl:items-start xl:justify-start xl:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg xl:min-w-[140px]">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Net
              </span>
              <span
                className={`text-lg xl:text-2xl font-bold ${
                  (totals?.net ?? 0) >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {formatCurrencyGBP(totals?.net ?? 0)}
              </span>
            </div>
          </div>

          <div className="w-full xl:w-96 h-96 xl:order-2">
            <EChart option={option} />
          </div>
        </div>
      </div>
    </Card>
  )
}
