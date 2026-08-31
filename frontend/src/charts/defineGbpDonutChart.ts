import { defineChart } from "@tanstack/charts"
import { focusGroupAngle, pie, polar, radialArc } from "@tanstack/charts/polar"
import { tooltip } from "@tanstack/charts/tooltip"
import { formatCurrencyGBP } from "../utils"

export type GbpDonutSlice = {
  name: string
  value: number
  fill: string
  border: string
  exploded?: boolean
}

export function defineGbpDonutChart(
  slices: GbpDonutSlice[],
  visible: ReadonlySet<string>,
) {
  const visibleSlices = slices.filter((slice) => visible.has(slice.name))
  const arcs = pie(visibleSlices, { value: "value" })
  const exploded = arcs.filter((slice) => slice.exploded)
  const arcOptions = {
    innerRadius: ({ radius }: { radius: number }) => radius * 0.54,
    color: "name" as const,
    key: "name" as const,
    fill: (row: GbpDonutSlice) => row.fill,
    stroke: (row: GbpDonutSlice) => row.border,
    strokeWidth: 2,
  }

  return defineChart(
    {
      marks: [
        polar({
          inset: 8,
          radiusRatio: 0.78,
          scales: {
            angle: null,
            radius: null,
          },
          marks: [
            radialArc(arcs, arcOptions),
            ...(exploded.length > 0
              ? [
                  radialArc(exploded, {
                    ...arcOptions,
                    outerRadius: ({ radius }) => radius + 12,
                  }),
                ]
              : []),
          ],
        }),
      ],
      scales: {
        x: null,
        y: null,
      },
      color: {
        domain: slices.map((slice) => slice.name),
        range: slices.map((slice) => slice.fill),
      },
    },
    {
      svgAnimation: false,
      focus: focusGroupAngle,
      tooltip: {
        use: tooltip,
        format(point) {
          const value =
            typeof point.datum.value === "number"
              ? formatCurrencyGBP(point.datum.value)
              : "-"
          return `${point.datum.name}: ${value}`
        },
      },
    },
  )
}
