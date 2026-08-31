import { Card } from "flowbite-react"
import { format, isBefore, parseISO, startOfDay } from "date-fns"
import { useMemo } from "react"
import FinanceChart from "../charts/FinanceChart"
import { defineGbpLineChart } from "../charts/defineGbpLineChart"
import type { GbpLineRow } from "../charts/defineGbpLineChart"
import { useLegendIsolateVisible } from "../charts/useLegendIsolateVisible"
import { useData } from "../Hooks/useData"
import { getBrightColors } from "../utils"

export default function BalanceGraph() {
  const { balanceSummary, accountColorMap: colorMap } = useData()

  const { borders: lineBorders } = useMemo(
    () => getBrightColors((balanceSummary?.accounts.length || 0) + 1),
    [balanceSummary?.accounts.length],
  )

  const { rows, dates, seriesNames, seriesColors, yDomain } = useMemo(() => {
    const nextDates =
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

    const nextRows: GbpLineRow[] = datasets.flatMap((dataset) =>
      nextDates.map((date, index) => ({
        date,
        series: dataset.label,
        value: dataset.data[index] ?? null,
      })),
    )

    const values = nextRows
      .map((row) => row.value)
      .filter((value): value is number => value != null)

    return {
      rows: nextRows,
      dates: nextDates,
      seriesNames: datasets.map((dataset) => dataset.label),
      seriesColors: datasets.map((dataset) => dataset.borderColor),
      yDomain: [
        values.length > 0 ? Math.min(...values) : 0,
        values.length > 0 ? Math.max(...values) : 1,
      ] as const,
    }
  }, [balanceSummary, colorMap, lineBorders])

  const { visible, visibleSet, onItemClick } =
    useLegendIsolateVisible(seriesNames)

  const definition = useMemo(
    () =>
      defineGbpLineChart({
        rows,
        dates,
        yDomain,
        seriesNames,
        seriesColors,
        visible: visibleSet,
      }),
    [dates, rows, seriesColors, seriesNames, visibleSet, yDomain],
  )

  return (
    <Card className="flex min-h-full w-full flex-col">
      <div className="flex flex-col justify-between flex-1 gap-4">
        <h1 className="w-full text-xl font-medium text-center">
          Balance over Time
        </h1>
        <div className="flex h-96 w-full flex-col gap-2">
          <FinanceChart
            definition={definition}
            visible={visible}
            legendItems={seriesNames.map((name, index) => ({
              name,
              color: seriesColors[index],
            }))}
            ariaLabel="Balance over time"
            legendAriaLabel="Account visibility"
            onItemClick={onItemClick}
          />
        </div>
      </div>
    </Card>
  )
}
