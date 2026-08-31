import type { ChartValue } from "@tanstack/charts"
import { Chart } from "@tanstack/charts/react"
import type { ChartProps } from "@tanstack/charts/react"
import ChartLegend from "./ChartLegend"

type FinanceChartProps<
  TDatum,
  TXValue extends ChartValue,
  TYValue extends ChartValue,
> = {
  definition: ChartProps<TDatum, TXValue, TYValue>["definition"]
  visible: readonly string[]
  legendItems: { name: string; color: string }[]
  ariaLabel: string
  legendAriaLabel: string
  onItemClick: (
    name: string,
    event: { metaKey: boolean; ctrlKey: boolean },
  ) => void
}

export default function FinanceChart<
  TDatum,
  TXValue extends ChartValue = ChartValue,
  TYValue extends ChartValue = ChartValue,
>({
  definition,
  visible,
  legendItems,
  ariaLabel,
  legendAriaLabel,
  onItemClick,
}: FinanceChartProps<TDatum, TXValue, TYValue>) {
  return (
    <>
      <Chart
        key={visible.join("\0")}
        className="finance-chart min-h-0 w-full flex-1 text-gray-500 dark:text-gray-400"
        definition={definition}
        height={340}
        ariaLabel={ariaLabel}
      />
      <ChartLegend
        items={legendItems}
        visible={visible}
        ariaLabel={legendAriaLabel}
        onItemClick={onItemClick}
      />
    </>
  )
}
