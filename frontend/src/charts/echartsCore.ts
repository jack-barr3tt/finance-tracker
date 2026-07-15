import { LineChart, PieChart } from "echarts/charts"
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from "echarts/components"
import * as echarts from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"

echarts.use([
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
])

export default echarts
