import type { ECharts } from "echarts"

const LEGEND_GAP = 12

type LegendView = {
  group?: {
    getBoundingRect: () => { height: number }
  }
}

type LayoutChart = {
  getModel: () => {
    getComponent: (mainType: string, idx: number) => { get: (key: string) => unknown } | undefined
  }
  getViewOfComponentModel: (componentModel: unknown) => LegendView | undefined
}

function getLayoutInternals(chart: ECharts): LayoutChart {
  return chart as unknown as LayoutChart
}

export function measureLegendHeight(chart: ECharts): number {
  const layoutChart = getLayoutInternals(chart)
  const legendModel = layoutChart.getModel().getComponent("legend", 0)
  if (!legendModel || legendModel.get("show") === false) return 0

  const view = layoutChart.getViewOfComponentModel(legendModel)
  if (!view?.group) return 0

  return view.group.getBoundingRect().height
}

export function applyLegendLayout(chart: ECharts): boolean {
  const legendHeight = measureLegendHeight(chart)
  if (legendHeight <= 0) return false

  const chartHeight = chart.getHeight()
  const bottomPadding = legendHeight + LEGEND_GAP
  const option = chart.getOption()
  const series = option.series as Array<{ type?: string; center?: [unknown, unknown] }> | undefined
  const firstSeries = series?.[0]

  if (firstSeries?.type === "pie") {
    const centerY = (chartHeight - bottomPadding) / 2
    const currentY = firstSeries.center?.[1]

    if (typeof currentY === "number" && Math.abs(currentY - centerY) < 1) return false

    chart.setOption({
      series: [{ center: ["50%", centerY] }],
    })
    return true
  }

  const grid = option.grid as { bottom?: number | string } | Array<{ bottom?: number | string }> | undefined
  const currentBottom = Array.isArray(grid) ? grid[0]?.bottom : grid?.bottom

  if (typeof currentBottom === "number" && Math.abs(currentBottom - bottomPadding) < 1) {
    return false
  }

  chart.setOption({
    grid: { bottom: bottomPadding },
  })
  return true
}

export function getLegendLayoutKey(chart: ECharts): string {
  return `${chart.getWidth()}x${chart.getHeight()}:${measureLegendHeight(chart)}`
}
