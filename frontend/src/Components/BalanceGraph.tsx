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
import Color from "color"
import { Card } from "flowbite-react"
import { useMemo } from "react"
import { Line } from "react-chartjs-2"
import { useGetUserByIdSummaryBalance } from "../API/queries"
import { useUser } from "../Hooks/useUser"
import { getBrightColors } from "../utils"
import { decryptAccount } from "../Security/data"
import { useAsyncMemo } from "../Hooks/useAsyncMemo"
import { useDashboard } from "../Hooks/useDashboard"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export default function BalanceGraph() {
  const { userId, decrypt } = useUser()
  const { dataPeriod, dataGroupBy, accountColorMap: colorMap } = useDashboard()
  const { data: encBalanceSummary } = useGetUserByIdSummaryBalance({
    path: { id: userId },
    query: { group_by: dataGroupBy, period: dataPeriod },
  })

  const balanceSummary = useAsyncMemo(async () => {
    if (!encBalanceSummary) return null
    return {
      ...encBalanceSummary,
      accounts: await Promise.all(
        encBalanceSummary.accounts.map(async (account) => ({
          ...account,
          account: await decryptAccount(account.account, decrypt),
        }))
      ),
    }
  }, [encBalanceSummary, decrypt])

  const { borders: lineBorders, fills: lineFills } = useMemo(
    () => getBrightColors((balanceSummary?.accounts.length || 0) + 1),
    [balanceSummary?.accounts.length]
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
                  borderColor: colorMap ? colorMap["total"]?.border : lineBorders[0],
                  backgroundColor: colorMap
                    ? Color(colorMap["total"]?.fill).alpha(0.25).string()
                    : lineFills[0],
                },
                ...(balanceSummary?.accounts.map((account, i) => ({
                  label: account.account.name,
                  data: account.balance.map((item) => item.balance),
                  borderColor: colorMap ? colorMap[account.account.id].border : lineBorders[i + 1],
                  backgroundColor: colorMap
                    ? Color(colorMap[account.account.id].fill).alpha(0.25).string()
                    : lineFills[i + 1],
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
