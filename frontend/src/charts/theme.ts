import type { EChartsOption, LegendComponentOption, PieSeriesOption } from "echarts"

const LIGHT_TEXT = "#6B7280"
const DARK_TEXT = "#9CA3AF"
const LIGHT_AXIS = "#E5E7EB"
const DARK_AXIS = "#374151"
const LIGHT_TOOLTIP_BG = "#FFFFFF"
const DARK_TOOLTIP_BG = "#1F2937"
const LIGHT_TOOLTIP_BORDER = "#E5E7EB"
const DARK_TOOLTIP_BORDER = "#374151"

export function getChartBaseOption(isDark: boolean): EChartsOption {
  const textColor = isDark ? DARK_TEXT : LIGHT_TEXT

  return {
    animation: false,
    textStyle: {
      color: textColor,
    },
    legend: {
      bottom: 0,
      textStyle: {
        color: textColor,
      },
    },
    tooltip: {
      backgroundColor: isDark ? DARK_TOOLTIP_BG : LIGHT_TOOLTIP_BG,
      borderColor: isDark ? DARK_TOOLTIP_BORDER : LIGHT_TOOLTIP_BORDER,
      textStyle: {
        color: isDark ? "#F9FAFB" : "#111827",
      },
    },
  }
}

export function getLineChartAxesOption(isDark: boolean): Pick<EChartsOption, "xAxis" | "yAxis"> {
  const textColor = isDark ? DARK_TEXT : LIGHT_TEXT
  const axisColor = isDark ? DARK_AXIS : LIGHT_AXIS

  return {
    xAxis: {
      axisLine: {
        lineStyle: { color: axisColor },
      },
      axisLabel: {
        color: textColor,
      },
      splitLine: {
        lineStyle: { color: axisColor },
      },
    },
    yAxis: {
      axisLine: {
        lineStyle: { color: axisColor },
      },
      axisLabel: {
        color: textColor,
      },
      splitLine: {
        lineStyle: { color: axisColor },
      },
    },
  }
}

export function getWrappedLegendOption(isDark: boolean): LegendComponentOption {
  const textColor = isDark ? DARK_TEXT : LIGHT_TEXT

  return {
    bottom: 0,
    left: "center",
    width: "95%",
    orient: "horizontal",
    itemGap: 10,
    textStyle: {
      color: textColor,
    },
  }
}

export function getDoughnutLegendOption(isDark: boolean): LegendComponentOption {
  return getWrappedLegendOption(isDark)
}

export function getLineChartLegendOption(isDark: boolean): LegendComponentOption {
  return getWrappedLegendOption(isDark)
}

export function getLineChartGridOption(): EChartsOption["grid"] {
  return {
    left: "3%",
    right: "4%",
    bottom: 48,
    containLabel: true,
  }
}

export function getDoughnutSeriesOption(): PieSeriesOption {
  return {
    type: "pie",
    radius: ["38%", "70%"],
    itemStyle: {
      borderWidth: 2,
    },
    label: {
      show: false,
    },
    emphasis: {
      label: {
        show: false,
      },
    },
  }
}
