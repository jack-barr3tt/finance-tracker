import { crosshair, defineChart, lineY } from "@tanstack/charts"
import { focusGroupX } from "@tanstack/charts/focus"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { scalePoint } from "@tanstack/charts/scales/point"
import { tooltip } from "@tanstack/charts/tooltip"
import { formatCurrencyGBP } from "../utils"

export type GbpLineRow = {
  date: string
  series: string
  value: number | null
}

export function defineGbpLineChart(options: {
  rows: GbpLineRow[]
  dates: string[]
  yDomain: readonly [number, number]
  seriesNames: string[]
  seriesColors: string[]
  visible: ReadonlySet<string>
}) {
  return defineChart(
    {
      marks: [
        lineY(
          options.rows.filter((row) => options.visible.has(row.series)),
          {
            x: "date",
            y: "value",
            z: "series",
            color: "series",
            strokeWidth: 2,
          },
        ),
        crosshair({
          y: {
            label: {
              format: (value) => formatCurrencyGBP(Number(value)),
            },
          },
        }),
      ],
      scales: {
        x: {
          scale: () => scalePoint<string>().domain(options.dates).padding(0),
        },
        y: {
          scale: () => scaleLinear().domain([...options.yDomain]),
          nice: true,
          grid: true,
          axis: {
            ticks: {
              format: (value) => formatCurrencyGBP(Number(value)),
            },
          },
        },
      },
      color: {
        domain: options.seriesNames,
        range: options.seriesColors,
      },
    },
    {
      svgAnimation: false,
      focus: focusGroupX,
      tooltip: {
        use: tooltip,
        formatGroup(points) {
          const heading = String(points[0]?.xValue ?? "")
          return [
            heading,
            ...points.map((point) => {
              const amount =
                typeof point.yValue === "number"
                  ? formatCurrencyGBP(point.yValue)
                  : "-"
              return `${point.groupLabel}: ${amount}`
            }),
          ].join("\n")
        },
      },
    },
  )
}
