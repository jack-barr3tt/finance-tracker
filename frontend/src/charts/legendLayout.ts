import type { ECharts } from "echarts"

const LEGEND_GAP = 12

type LegendView = {
  group?: {
    getBoundingRect: () => { height: number }
  }
}

type LayoutChart = {
  getModel: () => {
    getComponent: (
      mainType: string,
      idx: number,
    ) => { get: (key: string) => unknown } | undefined
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

  const bottomPadding = legendHeight + LEGEND_GAP
  const option = chart.getOption()
  const series = option.series as Array<{ type?: string }> | undefined
  const firstSeries = series?.[0]

  if (firstSeries?.type === "pie") return false

  const grid = option.grid as
    | { bottom?: number | string }
    | Array<{ bottom?: number | string }>
    | undefined
  const currentBottom = Array.isArray(grid) ? grid[0]?.bottom : grid?.bottom

  if (
    typeof currentBottom === "number" &&
    Math.abs(currentBottom - bottomPadding) < 1
  ) {
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
