import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"
import { Card, useThemeMode } from "flowbite-react"
import Color from "color"
import { useMemo } from "react"
import { Doughnut } from "react-chartjs-2"
import { getBrightColors } from "../utils"
import { useData } from "../Hooks/useData"
import { useUser } from "../Hooks/useUser"
import { useGetUserByIdSummaryTotals } from "../API/queries"
ChartJS.register(ArcElement, Tooltip, Legend)

export default function CategoryPie() {
  const { computedMode } = useThemeMode()
  const isDark = computedMode === "dark"
  const { userId } = useUser()
  const { categorySummaries, categoryColorMap: colorMap, dataPeriod } = useData()
  const { data: totals } = useGetUserByIdSummaryTotals({
    path: { id: userId },
    query: { period: dataPeriod },
  })

  const { borders: pieBorders, fills: pieFills } = useMemo(
    () => getBrightColors(categorySummaries?.filter((cat) => cat.total < 0).length || 0),
    [categorySummaries]
  )

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
                {(totals?.income ?? 0).toLocaleString("en-GB", {
                  style: "currency",
                  currency: "GBP",
                })}
              </span>
            </div>

            <div className="flex flex-col items-center xl:items-start p-4 bg-gray-50 dark:bg-gray-800 rounded-lg min-w-[140px] flex-1 xl:flex-none">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                Outgoings
              </span>
              <span className="text-xl font-bold text-red-600 xl:text-2xl dark:text-red-400">
                {(totals?.outgoing ?? 0).toLocaleString("en-GB", {
                  style: "currency",
                  currency: "GBP",
                })}
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
                {(totals?.net ?? 0).toLocaleString("en-GB", {
                  style: "currency",
                  currency: "GBP",
                })}
              </span>
            </div>
          </div>

          <div className="w-full xl:w-96 h-96 xl:order-2">
            <Doughnut
              data={{
                labels:
                  categorySummaries
                    ?.filter((cat) => cat.total < 0)
                    .map((cat) => cat.category?.name || "Uncategorised") || [],
                datasets: [
                  {
                    label: "Total",
                    data:
                      categorySummaries?.filter((cat) => cat.total < 0).map((cat) => -cat.total) ||
                      [],
                    backgroundColor: colorMap
                      ? categorySummaries
                          ?.filter((cat) => cat.total < 0)
                          .map((cat) => {
                            const fill = colorMap[cat.category?.id || "uncategorised"]?.fill
                            const c = Color(fill)
                            return isDark ? c.alpha(0.25).string() : c.string()
                          })
                      : pieFills,
                    borderColor: colorMap
                      ? categorySummaries
                          ?.filter((cat) => cat.total < 0)
                          .map((cat) => colorMap[cat.category?.id || "uncategorised"]?.border)
                      : pieBorders,
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
