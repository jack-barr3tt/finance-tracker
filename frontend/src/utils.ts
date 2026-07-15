import Color from "color"

export function getBrightColors(count: number): {
  fills: string[]
  borders: string[]
  text: string[]
} {
  const fills: string[] = []
  const borders: string[] = []
  const text: string[] = []
  for (let i = 0; i < count; i++) {
    const hue = (360 / count) * i

    const baseColor = Color.hsl(hue, 100, 65)
    fills.push(baseColor.darken(0.35).string())
    borders.push(baseColor.darken(0.35).string())
    text.push(baseColor.lighten(0.92).string())
  }
  return { fills, borders, text }
}

export function getChartColors(
  ids: string[],
): Record<string, { border: string; fill: string; text: string }> {
  const colors = getBrightColors(ids.length)
  const map: Record<string, { border: string; fill: string; text: string }> = {}
  ids.forEach((id, index) => {
    map[id] = {
      border: colors.borders[index],
      fill: colors.fills[index],
      text: colors.text[index],
    }
  })
  return map
}

export function formatCurrencyGBP(value: number): string {
  return value.toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
  })
}

export function prependToFile(file: File, line: string): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const newContent = line + "\n" + reader.result
      const newFile = new File([newContent], file.name, { type: file.type })
      resolve(newFile)
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}

export function toMonthlyAmount(amount: number, repeatEvery: number, repeatUntil: string): number {
  const absAmount = Math.abs(amount)

  switch (repeatUntil) {
    case "day":
      return (absAmount / repeatEvery) * (365.25 / 12)
    case "week":
      return (absAmount / repeatEvery) * (52 / 12)
    case "month":
      return absAmount / repeatEvery
    case "year":
      return absAmount / repeatEvery / 12
    default:
      return absAmount
  }
}

export function formatRepeat(repeatEvery: number, repeatUntil: string): string {
  if (repeatEvery === 1) return `Every ${repeatUntil}`
  return `Every ${repeatEvery} ${repeatUntil}s`
}
