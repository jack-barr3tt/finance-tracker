import type { EChartsOption } from "echarts"
import { format, isBefore, parseISO, startOfDay } from "date-fns"
import { Card, useThemeMode } from "flowbite-react"
import { useMemo } from "react"
import EChart from "../charts/EChart"
import {
  getChartBaseOption,
  getLineChartAxesOption,
  getLineChartGridOption,
  getLineChartLegendOption,
  formatChartCurrency,
} from "../charts/theme"
import { getBrightColors } from "../utils"
import { useData } from "../Hooks/useData"
import { usePrivacy } from "../Hooks/usePrivacy"

export default function BalanceGraph() {
  const { computedMode } = useThemeMode()
  const isDark = computedMode === "dark"
  const { shaded } = usePrivacy()
  const { balanceSummary, accountColorMap: colorMap } = useData()

  const { borders: lineBorders } = useMemo(
    () => getBrightColors((balanceSummary?.accounts.length || 0) + 1),
    [balanceSummary?.accounts.length],
  )

  const option = useMemo<EChartsOption>(() => {
    const dates =
      balanceSummary?.total.map((item) =>
        format(parseISO(item.date), "dd MMM yyyy"),
      ) || []

    const datasets = [
      {
        label: "Total",
        data: balanceSummary?.total.map((item) => item.balance) || [],
        borderColor: colorMap ? colorMap["total"]?.border : lineBorders[0],
      },
      ...(balanceSummary?.accounts.map((account, i) => {
        const openedAt = startOfDay(parseISO(account.account.opened_at))
        return {
          label: account.account.name,
          data: account.balance.map((item) =>
            isBefore(startOfDay(parseISO(item.date)), openedAt)
              ? null
              : item.balance,
          ),
          borderColor: colorMap
            ? colorMap[account.account.id].border
            : lineBorders[i + 1],
        }
      }) || []),
    ].sort((a, b) => a.label.localeCompare(b.label))

    const baseOption = getChartBaseOption(isDark)
    const axesOption = getLineChartAxesOption(isDark)

    return {
      ...baseOption,
      tooltip: {
        ...baseOption.tooltip,
        trigger: "axis",
        axisPointer: {
          type: "cross",
          label: {
            formatter: (params) =>
              params.axisDimension === "y"
                ? formatChartCurrency(params.value, shaded)
                : String(params.value),
          },
        },
        valueFormatter: (value) => formatChartCurrency(value, shaded),
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
        axisLabel: {
          ...(typeof axesOption.yAxis === "object" &&
          !Array.isArray(axesOption.yAxis)
            ? axesOption.yAxis.axisLabel
            : {}),
          formatter: (value: number) => formatChartCurrency(value, shaded),
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
  }, [balanceSummary, colorMap, isDark, lineBorders, shaded])

  return (
    <Card className="flex min-h-full w-full flex-col">
      <div className="flex flex-col justify-between flex-1 gap-4">
        <h1 className="w-full text-xl font-medium text-center">
          Balance over Time
        </h1>
        <div className="w-full h-96">
          <EChart option={option} />
        </div>
      </div>
    </Card>
  )
}
