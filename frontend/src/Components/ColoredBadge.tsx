import { Badge } from "flowbite-react"

type ColorPair = { fill?: string; text?: string }

type ColoredBadgeProps = {
  label: string
  colorMap: Record<string, ColorPair>
  colorKey?: string
  className?: string
}

export default function ColoredBadge({
  label,
  colorMap,
  colorKey = "uncategorised",
  className,
}: ColoredBadgeProps) {
  const colors = colorMap[colorKey]

  return (
    <Badge
      style={{
        backgroundColor: colors?.fill,
        color: colors?.text,
      }}
      className={className ?? "h-5 w-fit"}
    >
      {label}
    </Badge>
  )
}
