type ChartLegendItem = {
  name: string
  color: string
}

type ChartLegendProps = {
  items: ChartLegendItem[]
  visible: readonly string[]
  ariaLabel: string
  onItemClick: (
    name: string,
    event: { metaKey: boolean; ctrlKey: boolean },
  ) => void
}

export default function ChartLegend({
  items,
  visible,
  ariaLabel,
  onItemClick,
}: ChartLegendProps) {
  const visibleSet = new Set(visible)

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex flex-wrap justify-center gap-x-3 gap-y-1"
    >
      {items.map((item) => {
        const isVisible = visibleSet.has(item.name)

        return (
          <button
            key={item.name}
            type="button"
            aria-pressed={isVisible}
            aria-label={`Toggle ${item.name} series`}
            className={`inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 ${
              isVisible ? "" : "line-through opacity-50"
            }`}
            onPointerDown={(event) => {
              if (event.button !== 0) return
              if (!event.metaKey && !event.ctrlKey) return
              event.preventDefault()
              onItemClick(item.name, event)
            }}
            onClick={(event) => {
              if (event.metaKey || event.ctrlKey) return
              onItemClick(item.name, event)
            }}
          >
            <span
              className="size-2.5 shrink-0 rounded-sm"
              style={{
                backgroundColor: isVisible ? item.color : "transparent",
                boxShadow: `inset 0 0 0 1.5px ${item.color}`,
              }}
            />
            {item.name}
          </button>
        )
      })}
    </div>
  )
}
