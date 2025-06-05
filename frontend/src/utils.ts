export function getBrightColors(
  count: number,
  transparency = 0.25
): { fills: string[]; borders: string[] } {
  const fills: string[] = []
  const borders: string[] = []
  const offset = Math.floor(Math.random() * 360)
  for (let i = 0; i < count; i++) {
    const hue = (360 / count) * i + offset
    fills.push(`hsla(${hue}, 100%, 50%, ${transparency})`)
    borders.push(`hsla(${hue}, 100%, 50%, 1)`)
  }
  return { fills, borders }
}
