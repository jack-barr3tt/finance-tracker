import type { ECharts } from "echarts"

type LegendSelectChangedParams = {
  name: string
  selected: Record<string, boolean>
}

export function bindLegendIsolate(chart: ECharts): () => void {
  let isolateClick = false

  const zr = chart.getZr()
  const onMouseDown = (event: { event?: MouseEvent }) => {
    const mouseEvent = event.event
    isolateClick = Boolean(mouseEvent?.metaKey || mouseEvent?.ctrlKey)
  }

  const onLegendSelectChanged = (params: unknown) => {
    if (!isolateClick) return

    const { name: clickedName, selected: after } =
      params as LegendSelectChangedParams
    const before = { ...after, [clickedName]: !after[clickedName] }
    const visibleBefore = Object.values(before).filter(Boolean).length
    const wasOnlyClickedVisible = visibleBefore === 1 && before[clickedName]

    const selected = wasOnlyClickedVisible
      ? Object.fromEntries(Object.keys(after).map((name) => [name, true]))
      : Object.fromEntries(
          Object.keys(after).map((name) => [name, name === clickedName]),
        )

    chart.setOption({
      legend: { selected },
    })

    isolateClick = false
  }

  zr.on("mousedown", onMouseDown)
  chart.on("legendselectchanged", onLegendSelectChanged)

  return () => {
    zr.off("mousedown", onMouseDown)
    chart.off("legendselectchanged", onLegendSelectChanged)
  }
}
