import {
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Legend,
  Tooltip,
  Chart as ChartJS,
} from "chart.js"
import { Card, useThemeMode } from "flowbite-react"
import { useMemo } from "react"
import { Line } from "react-chartjs-2"
import { useGetUserByIdSummaryBalance } from "../API/queries"
import { useUser } from "../Hooks/useUser"
import { getBrightColors } from "../utils"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export default function BalanceGraph() {
  const { userId } = useUser()
  const { computedMode: mode } = useThemeMode()
  const { data: balanceSummary } = useGetUserByIdSummaryBalance({
    path: { id: userId },
    query: { group_by: "month" },
  })

  const { borders: lineBorders, fills: lineFills } = useMemo(
    () => getBrightColors((balanceSummary?.accounts.length || 0) + 1, mode === "dark" ? 0.25 : 0.5),
    [balanceSummary?.accounts.length, mode]
  )

  return (
    <Card className="w-1/2">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-xl font-medium">Balance over Time</h1>
        <div className="w-full h-64">
          <Line
            data={{
              labels:
                balanceSummary?.total.map((item) => new Date(item.date).toLocaleDateString()) || [],
              datasets: [
                {
                  label: "Total",
                  data: balanceSummary?.total.map((item) => item.balance) || [],
                  borderColor: lineBorders[0],
                  backgroundColor: lineFills[0],
                },
                ...(balanceSummary?.accounts.map((account, i) => ({
                  label: account.account.name,
                  data: account.balance.map((item) => item.balance),
                  borderColor: lineBorders[i + 1],
                  backgroundColor: lineFills[i + 1],
                })) || []),
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
          />
        </div>
      </div>
    </Card>
  )
}
