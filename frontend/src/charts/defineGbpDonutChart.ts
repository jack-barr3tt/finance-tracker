import { defineChart } from "@tanstack/charts"
import { pie, polar, radialArc } from "@tanstack/charts/polar"
import type { PieDatum, PolarLayoutContext } from "@tanstack/charts/polar"
import { tooltip } from "@tanstack/charts/tooltip"
import type { Arc } from "d3-shape"
import { formatCurrencyGBP } from "../utils"

export type GbpDonutSlice = {
  name: string
  value: number
  fill: string
  border: string
  exploded?: boolean
}

const innerRadiusRatio = 0.54
const explodeOffset = 12

type ArcAngles = {
  startAngle: number
  endAngle: number
}

type ArcPathContext = {
  moveTo: (x: number, y: number) => void
  lineTo: (x: number, y: number) => void
  arc: (
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    counterclockwise?: boolean,
  ) => void
  closePath: () => void
}

function explodeDelta(startAngle: number, endAngle: number, offset: number) {
  const mid = (startAngle + endAngle) / 2
  return [Math.sin(mid) * offset, -Math.cos(mid) * offset] as const
}

function donutSlicePath(
  startAngle: number,
  endAngle: number,
  innerRadius: number,
  outerRadius: number,
  dx: number,
  dy: number,
) {
  const start = startAngle - Math.PI / 2
  const end = endAngle - Math.PI / 2
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0
  const ox0 = dx + outerRadius * Math.cos(start)
  const oy0 = dy + outerRadius * Math.sin(start)
  const ox1 = dx + outerRadius * Math.cos(end)
  const oy1 = dy + outerRadius * Math.sin(end)
  const ix1 = dx + innerRadius * Math.cos(end)
  const iy1 = dy + innerRadius * Math.sin(end)
  const ix0 = dx + innerRadius * Math.cos(start)
  const iy0 = dy + innerRadius * Math.sin(start)

  return `M${ox0},${oy0}A${outerRadius},${outerRadius} 0 ${largeArc},1 ${ox1},${oy1}L${ix1},${iy1}A${innerRadius},${innerRadius} 0 ${largeArc},0 ${ix0},${iy0}Z`
}

function explodedArcGenerator(
  layout: PolarLayoutContext,
): Arc<unknown, PieDatum<GbpDonutSlice>> {
  const innerRadius = layout.radius * innerRadiusRatio
  const outerRadius = layout.radius
  let context: ArcPathContext | null = null

  function generator(datum: ArcAngles) {
    const [dx, dy] = explodeDelta(
      datum.startAngle,
      datum.endAngle,
      explodeOffset,
    )
    if (context) {
      const start = datum.startAngle - Math.PI / 2
      const end = datum.endAngle - Math.PI / 2
      context.moveTo(
        dx + outerRadius * Math.cos(start),
        dy + outerRadius * Math.sin(start),
      )
      context.arc(dx, dy, outerRadius, start, end, false)
      context.arc(dx, dy, innerRadius, end, start, true)
      context.closePath()
      return null
    }

    return donutSlicePath(
      datum.startAngle,
      datum.endAngle,
      innerRadius,
      outerRadius,
      dx,
      dy,
    )
  }

  generator.startAngle = () => (datum: ArcAngles) => datum.startAngle
  generator.endAngle = () => (datum: ArcAngles) => datum.endAngle
  generator.innerRadius = () => () => innerRadius
  generator.outerRadius = () => () => outerRadius
  generator.centroid = (datum: ArcAngles) => {
    const [dx, dy] = explodeDelta(
      datum.startAngle,
      datum.endAngle,
      explodeOffset,
    )
    const mid = (datum.startAngle + datum.endAngle) / 2
    const radius = (innerRadius + outerRadius) / 2
    return [Math.sin(mid) * radius + dx, -Math.cos(mid) * radius + dy]
  }
  generator.context = (value?: ArcPathContext | null) => {
    if (value === undefined) return context
    context = value
    return generator
  }

  return generator as unknown as Arc<unknown, PieDatum<GbpDonutSlice>>
}

export function defineGbpDonutChart(
  slices: GbpDonutSlice[],
  visible: ReadonlySet<string>,
) {
  const visibleSlices = slices.filter((slice) => visible.has(slice.name))
  const arcs = pie(visibleSlices, { value: "value" })
  const seated = arcs.filter((slice) => !slice.exploded)
  const exploded = arcs.filter((slice) => slice.exploded)
  const arcOptions = {
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
            ...(seated.length > 0
              ? [
                  radialArc(seated, {
                    ...arcOptions,
                    innerRadius: ({ radius }) => radius * innerRadiusRatio,
                  }),
                ]
              : []),
            ...(exploded.length > 0
              ? [
                  radialArc(exploded, {
                    ...arcOptions,
                    generator: explodedArcGenerator,
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
      focusRing: false,
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
