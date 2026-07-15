import type { EChartsOption } from "echarts"
import ReactECharts from "echarts-for-react"
import echarts from "./echartsCore"

type EChartProps = {
  option: EChartsOption
  className?: string
}

export default function EChart({ option, className }: EChartProps) {
  return (
    <ReactECharts
      className={className}
      echarts={echarts}
      option={option}
      notMerge={true}
      lazyUpdate={true}
      style={{ height: "100%", width: "100%" }}
    />
  )
}
