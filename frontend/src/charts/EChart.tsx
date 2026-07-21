import type { EChartsOption } from "echarts"
import type { ECharts } from "echarts"
import ReactECharts from "echarts-for-react"
import { useCallback, useEffect, useMemo, useRef } from "react"
import echarts from "./echartsCore"
import { bindLegendIsolate } from "./legendIsolate"
import { applyLegendLayout, getLegendLayoutKey } from "./legendLayout"

const AUTO_SIZE = { width: "auto", height: "auto" } as const

type EChartProps = {
  option: EChartsOption
  className?: string
}

export default function EChart({ option, className }: EChartProps) {
  const chartRef = useRef<ECharts | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
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

  // echarts-for-react bakes fixed pixel width/height on init and skips the first
  // size-sensor callback, so container changes (sidebar, grid, etc.) often leave
  // the canvas stale until a hover forces a redraw. Keep sizing auto and resize
  // from our own observer on a wrapper that ECharts does not pin to pixels.
  useEffect(() => {
    const container = containerRef.current
    if (!container || typeof ResizeObserver === "undefined") return

    let frame = 0
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const chart = chartRef.current
        if (!chart) return
        chart.resize()
        layoutKeyRef.current = ""
        scheduleLegendLayout(chart)
      })
    })

    observer.observe(container)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [scheduleLegendLayout])

  const onEvents = useMemo(
    () => ({
      finished: () => {
        if (chartRef.current) scheduleLegendLayout(chartRef.current)
      },
    }),
    [scheduleLegendLayout],
  )

  return (
    <div ref={containerRef} className="h-full w-full">
      <ReactECharts
        className={className}
        echarts={echarts}
        option={option}
        notMerge={true}
        lazyUpdate={true}
        opts={AUTO_SIZE}
        onChartReady={onChartReady}
        onEvents={onEvents}
        style={{ height: "100%", width: "100%" }}
      />
    </div>
  )
}
