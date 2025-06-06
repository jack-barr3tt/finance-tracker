export function getBrightColors(
  count: number,
  transparency = 0.25
): { fills: string[]; borders: string[] } {
  const fills: string[] = []
  const borders: string[] = []
  for (let i = 0; i < count; i++) {
    const hue = (360 / count) * i
    fills.push(`hsla(${hue}, 100%, 65%, ${transparency})`)
    borders.push(`hsla(${hue}, 100%, 65%, 1)`)
  }
  return { fills, borders }
}
