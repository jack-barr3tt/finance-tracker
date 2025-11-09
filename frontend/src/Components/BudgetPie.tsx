import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"
import { Card } from "flowbite-react"
import Color from "color"
import { useMemo } from "react"
import { Doughnut } from "react-chartjs-2"
import { BudgetTransaction } from "../API/requests"
import { toMonthlyAmount } from "../utils"

ChartJS.register(ArcElement, Tooltip, Legend)

type BudgetPieProps = {
  budgetTransactions: BudgetTransaction[]
  categoryColorMap: Record<string, { fill: string; text: string; border: string }>
}

export default function BudgetPie(props: BudgetPieProps) {
  const { budgetTransactions, categoryColorMap } = props

  const chartData = useMemo(() => {
    const activeBudgetTransactions = budgetTransactions.filter((bt) => !bt.deleted_at)

    const monthlyIncome = activeBudgetTransactions
      .filter((bt) => bt.amount > 0)
      .reduce((sum, bt) => sum + toMonthlyAmount(bt.amount, bt.repeat_every, bt.repeat_until), 0)

    const categoryTotals: Record<
      string,
      { name: string; value: number; fill: string; border: string }
    > = {}

    activeBudgetTransactions
      .filter((bt) => bt.amount < 0)
      .forEach((bt) => {
        const categoryId = bt.category?.id || "uncategorised"
        const categoryName = bt.category?.name || "Uncategorised"
        const monthlyAmount = toMonthlyAmount(bt.amount, bt.repeat_every, bt.repeat_until)

        if (!categoryTotals[categoryId]) {
          categoryTotals[categoryId] = {
            name: categoryName,
            value: 0,
            fill: categoryColorMap[categoryId]?.fill || "#6B7280",
            border: categoryColorMap[categoryId]?.border || "#4B5563",
          }
        }
        categoryTotals[categoryId].value += monthlyAmount
      })

    const categories = Object.values(categoryTotals)
    const totalOutgoings = categories.reduce((sum, item) => sum + item.value, 0)
    const remaining = monthlyIncome - totalOutgoings

    const labels = categories.map((cat) => cat.name)
    const data = categories.map((cat) => cat.value)
    const backgroundColors = categories.map((cat) => Color(cat.fill).alpha(0.25).string())
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
  }, [budgetTransactions, categoryColorMap])

  return (
    <Card className="w-full">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-xl font-medium">Monthly Budget Overview</h1>

        <div className="flex flex-col items-center justify-center w-full gap-8 lg:flex-row">
          <div className="flex flex-row w-full gap-4 overflow-x-auto lg:flex-col lg:order-1 lg:w-auto">
            <div className="flex flex-col items-center lg:items-start p-4 bg-gray-50 dark:bg-gray-800 rounded-lg min-w-[140px] flex-1 lg:flex-none">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                Monthly Income
              </span>
              <span className="text-xl font-bold text-green-600 lg:text-2xl dark:text-green-400">
                {chartData.monthlyIncome.toLocaleString("en-GB", {
                  style: "currency",
                  currency: "GBP",
                })}
              </span>
            </div>

            <div className="flex flex-col items-center lg:items-start p-4 bg-gray-50 dark:bg-gray-800 rounded-lg min-w-[140px] flex-1 lg:flex-none">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                Monthly Outgoings
              </span>
              <span className="text-xl font-bold text-red-600 lg:text-2xl dark:text-red-400">
                {chartData.totalOutgoings.toLocaleString("en-GB", {
                  style: "currency",
                  currency: "GBP",
                })}
              </span>
            </div>

            <div className="flex flex-col items-center lg:items-start p-4 bg-gray-50 dark:bg-gray-800 rounded-lg min-w-[140px] flex-1 lg:flex-none">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                Monthly Remaining
              </span>
              <span
                className={`text-xl lg:text-2xl font-bold ${
                  chartData.remaining >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {chartData.remaining.toLocaleString("en-GB", {
                  style: "currency",
                  currency: "GBP",
                })}
              </span>
            </div>
          </div>

          <div className="w-full lg:w-96 h-96 lg:order-2">
            <Doughnut
              data={{
                labels: chartData.labels,
                datasets: [
                  {
                    label: "Amount",
                    data: chartData.data,
                    backgroundColor: chartData.backgroundColors,
                    borderColor: chartData.borderColors,
                    offset: chartData.labels.map((label) => (label === "Remaining" ? 50 : 0)),
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const label = context.label || ""
                        const value = context.parsed || 0
                        return `${label}: £${value.toFixed(2)}`
                      },
                    },
                  },
                },
                animation: false,
              }}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </Card>
  )
}
