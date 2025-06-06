import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"
import { Card, useThemeMode } from "flowbite-react"
import { useMemo } from "react"
import { Doughnut } from "react-chartjs-2"
import { useGetUserByIdSummaryCategories } from "../API/queries"
import { getBrightColors } from "../utils"
import { useUser } from "../Hooks/useUser"
ChartJS.register(ArcElement, Tooltip, Legend)

export default function CategoryPie() {
  const { userId } = useUser()
  const { mode } = useThemeMode()
  const { data: categorySummaries } = useGetUserByIdSummaryCategories({ path: { id: userId } })

  const { borders: pieBorders, fills: pieFills } = useMemo(
    () => getBrightColors(categorySummaries?.length || 0, mode === "dark" ? 0.25 : 0.5),
    [categorySummaries?.length, mode]
  )

  return (
    <Card className="w-1/2">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-xl font-medium">Spending by Category</h1>
        <div className="w-full h-64">
          <Doughnut
            data={{
              labels:
                categorySummaries?.filter((cat) => cat.total < 0).map((cat) => cat.category.name) ||
                [],
              datasets: [
                {
                  label: "Total",
                  data:
                    categorySummaries?.filter((cat) => cat.total < 0).map((cat) => -cat.total) ||
                    [],
                  backgroundColor: pieFills,
                  borderColor: pieBorders,
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
    </Card>
  )
}
