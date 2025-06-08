import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"
import { Card } from "flowbite-react"
import Color from "color"
import { useMemo } from "react"
import { Doughnut } from "react-chartjs-2"
import { useGetUserByIdSummaryCategories } from "../API/queries"
import { getBrightColors } from "../utils"
import { useUser } from "../Hooks/useUser"
ChartJS.register(ArcElement, Tooltip, Legend)

type CategoryPieProps = {
  colorMap?: Record<string, { border: string; fill: string }>
}

export default function CategoryPie({ colorMap }: CategoryPieProps) {
  const { userId } = useUser()
  const { data: categorySummaries } = useGetUserByIdSummaryCategories({ path: { id: userId } })

  const { borders: pieBorders, fills: pieFills } = useMemo(
    () => getBrightColors(categorySummaries?.filter((cat) => cat.total < 0).length || 0),
    [categorySummaries]
  )

  return (
    <Card className="w-1/2">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-xl font-medium">Spending by Category</h1>
        <div className="w-full h-64">
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
                        .map((cat) =>
                          Color(colorMap[cat.category?.id || "uncategorised"]?.fill)
                            .alpha(0.25)
                            .string()
                        )
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
    </Card>
  )
}
