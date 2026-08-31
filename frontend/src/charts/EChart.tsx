import type { ECharts, EChartsOption } from "echarts"
import ReactECharts from "echarts-for-react"
import { useCallback, useEffect, useRef, useState } from "react"
import echarts from "./echartsCore"
import { bindLegendIsolate } from "./legendIsolate"
import { applyLegendLayout, getLegendLayoutKey } from "./legendLayout"

const CHART_STYLE = { height: "100%", width: "100%" } as const

type Size = { width: number; height: number }

type EChartProps = {
  option: EChartsOption
  className?: string
}

function getSize(el: HTMLElement): Size | null {
  const width = Math.round(el.clientWidth)
  const height = Math.round(el.clientHeight)
  if (width === 0 || height === 0) return null
  return { width, height }
}

export default function EChart({ option, className }: EChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ECharts | null>(null)
  const lastSizeRef = useRef<Size | null>(null)
  const layoutKeyRef = useRef("")
  const readyRef = useRef(false)
  const cleanupRef = useRef<(() => void) | null>(null)

  const [size, setSize] = useState<Size | null>(null)
  const [ready, setReady] = useState(false)

  function markReady() {
    if (readyRef.current) return
    readyRef.current = true
    setReady(true)
  }

  const syncLegend = useCallback((chart: ECharts) => {
    const key = getLegendLayoutKey(chart)
    if (layoutKeyRef.current === key) {
      markReady()
      return
    }

    if (applyLegendLayout(chart)) {
      layoutKeyRef.current = getLegendLayoutKey(chart)
      markReady()
      return
    }

    requestAnimationFrame(() => {
      applyLegendLayout(chart)
      layoutKeyRef.current = getLegendLayoutKey(chart)
      markReady()
    })
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => {
      const next = getSize(container)
      if (!next) return

      setSize((current) => current ?? next)

      const chart = chartRef.current
      const prev = lastSizeRef.current
      if (!chart) return
      if (prev && prev.width === next.width && prev.height === next.height) {
        return
      }

      lastSizeRef.current = next
      chart.resize(next)
      layoutKeyRef.current = ""
      syncLegend(chart)
    })

    observer.observe(container)
    return () => {
      observer.disconnect()
      cleanupRef.current?.()
    }
  }, [syncLegend])

  useEffect(() => {
    layoutKeyRef.current = ""
    if (chartRef.current) syncLegend(chartRef.current)
  }, [option, syncLegend])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ opacity: ready ? 1 : 0 }}
    >
      {size && (
        <ReactECharts
          className={className}
          echarts={echarts}
          option={option}
          notMerge
          autoResize={false}
          opts={size}
          style={CHART_STYLE}
          onChartReady={(chart) => {
            chartRef.current = chart
            lastSizeRef.current = size

            const unbindLegend = bindLegendIsolate(chart)
            const onFinished = () => {
              if (!readyRef.current) syncLegend(chart)
            }
            chart.on("finished", onFinished)

            cleanupRef.current?.()
            cleanupRef.current = () => {
              chart.off("finished", onFinished)
              unbindLegend()
            }

            syncLegend(chart)
          }}
        />
      )}
    </div>
  )
}
