import type { EChartsOption } from "echarts"
import Color from "color"
import { Card, useThemeMode } from "flowbite-react"
import { useMemo } from "react"
import { BudgetTransaction, CategoryBudget } from "../API"
import EChart from "../charts/EChart"
import {
  getChartBaseOption,
  getDoughnutLegendOption,
  getDoughnutSeriesOption,
  formatChartCurrency,
} from "../charts/theme"
import { isSegmentActiveToday } from "../budget/plannedAmount"
import { formatCurrencyGBP, toMonthlyAmount } from "../utils"
import { usePrivacy } from "../Hooks/usePrivacy"
import PrivacyCover from "./PrivacyCover"

type BudgetPieProps = {
  budgetTransactions: BudgetTransaction[]
  categoryBudgets: CategoryBudget[]
  categoryColorMap: Record<
    string,
    { fill: string; text: string; border: string }
  >
}

export default function BudgetPie(props: BudgetPieProps) {
  const { budgetTransactions, categoryBudgets, categoryColorMap } = props
  const { computedMode } = useThemeMode()
  const isDark = computedMode === "dark"
  const { shaded } = usePrivacy()

  const chartData = useMemo(() => {
    const activeBudgetTransactions = budgetTransactions.filter(
      (bt) => !bt.deleted_at && isSegmentActiveToday(bt),
    )
    const activeCategoryBudgets = categoryBudgets.filter(
      (cb) => !cb.deleted_at && isSegmentActiveToday(cb),
    )

    const monthlyIncome = activeBudgetTransactions
      .filter((bt) => bt.amount > 0)
      .reduce(
        (sum, bt) =>
          sum + toMonthlyAmount(bt.amount, bt.repeat_every, bt.repeat_until),
        0,
      )

    const categoryTotals: Record<
      string,
      { name: string; value: number; fill: string; border: string }
    > = {}

    const addToCategoryTotal = (
      categoryId: string,
      categoryName: string,
      monthlyAmount: number,
    ) => {
      if (!categoryTotals[categoryId]) {
        categoryTotals[categoryId] = {
          name: categoryName,
          value: 0,
          fill: categoryColorMap[categoryId]?.fill || "#6B7280",
          border: categoryColorMap[categoryId]?.border || "#4B5563",
        }
      }
      categoryTotals[categoryId].value += monthlyAmount
    }

    activeBudgetTransactions
      .filter((bt) => bt.amount < 0)
      .forEach((bt) => {
        const categoryId = bt.category?.id || "uncategorised"
        const categoryName = bt.category?.name || "Uncategorised"
        const monthlyAmount = Math.abs(
          toMonthlyAmount(bt.amount, bt.repeat_every, bt.repeat_until),
        )
        addToCategoryTotal(categoryId, categoryName, monthlyAmount)
      })

    activeCategoryBudgets.forEach((cb) => {
      const monthlyAmount = toMonthlyAmount(
        cb.amount,
        cb.repeat_every,
        cb.repeat_until,
      )
      addToCategoryTotal(cb.category.id, cb.category.name, monthlyAmount)
    })

    const categories = Object.values(categoryTotals)
    const totalOutgoings = categories.reduce((sum, item) => sum + item.value, 0)
    const remaining = monthlyIncome - totalOutgoings

    const labels = categories.map((cat) => cat.name)
    const data = categories.map((cat) => cat.value)
    const backgroundColors = categories.map((cat) =>
      Color(cat.fill).alpha(0.25).string(),
    )
    const borderColors = categories.map((cat) => cat.border)

    if (remaining > 0) {
      labels.push("Remaining")
      data.push(remaining)
      backgroundColors.push(Color("#10B981").alpha(0.25).string())
      borderColors.push("#059669")
    }

    return {
      labels,
      data,
      backgroundColors,
      borderColors,
      monthlyIncome,
      totalOutgoings,
      remaining,
    }
  }, [budgetTransactions, categoryBudgets, categoryColorMap])

  const option = useMemo<EChartsOption>(() => {
    const baseOption = getChartBaseOption(isDark)

    const data = chartData.labels.map((label, index) => {
      const isRemaining = label === "Remaining"
      const fill = chartData.backgroundColors[index]
      const border = chartData.borderColors[index]

      return {
        name: label,
        value: chartData.data[index],
        selected: isRemaining,
        select: {
          disabled: !isRemaining,
        },
        itemStyle: {
          color: fill,
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
        valueFormatter: (value) => formatChartCurrency(value, shaded),
        ...(shaded
          ? {
              formatter: (params: { name: string }) => params.name,
            }
          : {}),
      },
      legend: {
        ...getDoughnutLegendOption(isDark),
        data: chartData.labels,
      },
      series: [
        {
          ...getDoughnutSeriesOption(),
          selectedMode: "single",
          selectedOffset: 20,
          data,
        },
      ],
    }
  }, [chartData, isDark, shaded])

  return (
    <Card className="w-full">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-xl font-medium">Monthly Budget Overview</h1>

        <div className="flex flex-col items-center justify-center w-full gap-8 lg:flex-row">
          <div className="flex flex-col w-full gap-1 lg:gap-4 lg:order-1 lg:w-auto">
            <div className="flex flex-row items-center justify-between gap-2 px-3 py-2 lg:flex-col lg:items-start lg:justify-start lg:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg lg:min-w-[140px]">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Monthly Income
              </span>
              <span className="text-lg font-bold text-green-600 lg:text-2xl dark:text-green-400">
                <PrivacyCover>
                  {formatCurrencyGBP(chartData.monthlyIncome)}
                </PrivacyCover>
              </span>
            </div>

            <div className="flex flex-row items-center justify-between gap-2 px-3 py-2 lg:flex-col lg:items-start lg:justify-start lg:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg lg:min-w-[140px]">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Monthly Outgoings
              </span>
              <span className="text-lg font-bold text-red-600 lg:text-2xl dark:text-red-400">
                <PrivacyCover>
                  {formatCurrencyGBP(chartData.totalOutgoings)}
                </PrivacyCover>
              </span>
            </div>

            <div className="flex flex-row items-center justify-between gap-2 px-3 py-2 lg:flex-col lg:items-start lg:justify-start lg:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg lg:min-w-[140px]">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Monthly Remaining
              </span>
              <span
                className={`text-lg lg:text-2xl font-bold ${
                  chartData.remaining >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                <PrivacyCover>
                  {formatCurrencyGBP(chartData.remaining)}
                </PrivacyCover>
              </span>
            </div>
          </div>

          <div className="w-full lg:w-96 h-96 lg:order-2">
            <EChart option={option} />
          </div>
        </div>
      </div>
    </Card>
  )
}
