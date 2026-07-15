import type { EChartsOption } from "echarts"
import type { ECharts } from "echarts"
import ReactECharts from "echarts-for-react"
import { useCallback, useEffect, useMemo, useRef } from "react"
import echarts from "./echartsCore"
import { bindLegendIsolate } from "./legendIsolate"
import { applyLegendLayout, getLegendLayoutKey } from "./legendLayout"

type EChartProps = {
  option: EChartsOption
  className?: string
}

export default function EChart({ option, className }: EChartProps) {
  const chartRef = useRef<ECharts | null>(null)
  const layoutKeyRef = useRef("")
  const unbindLegendRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    layoutKeyRef.current = ""
  }, [option])

  useEffect(() => {
    return () => {
      unbindLegendRef.current?.()
    }
  }, [])

  const scheduleLegendLayout = useCallback((chart: ECharts) => {
    const layoutKey = getLegendLayoutKey(chart)
    if (layoutKeyRef.current === layoutKey) return

    if (applyLegendLayout(chart)) {
      layoutKeyRef.current = layoutKey
    }
  }, [])

  const onChartReady = useCallback(
    (chart: ECharts) => {
      chartRef.current = chart
      unbindLegendRef.current?.()
      unbindLegendRef.current = bindLegendIsolate(chart)
      scheduleLegendLayout(chart)
    },
    [scheduleLegendLayout],
  )

  const onEvents = useMemo(
    () => ({
      finished: () => {
        if (chartRef.current) scheduleLegendLayout(chartRef.current)
      },
    }),
    [scheduleLegendLayout],
  )

  return (
    <ReactECharts
      className={className}
      echarts={echarts}
      option={option}
      notMerge={true}
      lazyUpdate={true}
      onChartReady={onChartReady}
      onEvents={onEvents}
      style={{ height: "100%", width: "100%" }}
    />
  )
}
