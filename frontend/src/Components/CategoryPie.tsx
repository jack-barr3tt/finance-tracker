import type { EChartsOption } from "echarts"
import Color from "color"
import { Card, useThemeMode } from "flowbite-react"
import { useMemo } from "react"
import EChart from "../charts/EChart"
import { getChartBaseOption, getDoughnutSeriesOption } from "../charts/theme"
import { formatCurrencyGBP, getBrightColors } from "../utils"
import { useData } from "../Hooks/useData"
import { useUser } from "../Hooks/useUser"
import { useGetUserByIdSummaryTotals } from "../API/queries"

export default function CategoryPie() {
  const { computedMode } = useThemeMode()
  const isDark = computedMode === "dark"
  const { userId } = useUser()
  const { categorySummaries, categoryColorMap: colorMap, summaryDateQuery } = useData()
  const { data: totals } = useGetUserByIdSummaryTotals(
    {
      path: { id: userId },
      query: summaryDateQuery,
    },
    undefined,
    {
      enabled: !!userId,
    },
  )

  const { borders: pieBorders, fills: pieFills } = useMemo(
    () => getBrightColors(categorySummaries?.filter((cat) => cat.total < 0).length || 0),
    [categorySummaries],
  )

  const option = useMemo<EChartsOption>(() => {
    const spendingCategories = categorySummaries?.filter((cat) => cat.total < 0) || []
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
        ...baseOption.legend,
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

  return (
    <Card className="w-1/2">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-xl font-medium">Spending by Category</h1>

        <div className="flex flex-col items-center justify-center w-full gap-8 xl:flex-row">
          <div className="flex flex-row w-full gap-4 overflow-x-auto xl:flex-col xl:order-1 xl:w-auto">
            <div className="flex flex-col items-center xl:items-start p-4 bg-gray-50 dark:bg-gray-800 rounded-lg min-w-[140px] flex-1 xl:flex-none">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                Income
              </span>
              <span className="text-xl font-bold text-green-600 xl:text-2xl dark:text-green-400">
                {formatCurrencyGBP(totals?.income ?? 0)}
              </span>
            </div>

            <div className="flex flex-col items-center xl:items-start p-4 bg-gray-50 dark:bg-gray-800 rounded-lg min-w-[140px] flex-1 xl:flex-none">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                Outgoings
              </span>
              <span className="text-xl font-bold text-red-600 xl:text-2xl dark:text-red-400">
                {formatCurrencyGBP(totals?.outgoing ?? 0)}
              </span>
            </div>

            <div className="flex flex-col items-center xl:items-start p-4 bg-gray-50 dark:bg-gray-800 rounded-lg min-w-[140px] flex-1 xl:flex-none">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                Net
              </span>
              <span
                className={`text-xl xl:text-2xl font-bold ${
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
