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
    fills.push(`hsl(${hue}, 100%, 65%)`)
    borders.push(`hsl(${hue}, 100%, 65%)`)
    text.push(`hsl(${hue}, 100%, 15%)`)
  }
  return { fills, borders, text }
}

export function getChartColors(
  ids: string[]
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
