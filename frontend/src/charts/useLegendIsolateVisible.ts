import { useCallback, useMemo, useRef, useState } from "react"

export function useLegendIsolateVisible(seriesNames: readonly string[]) {
  const seriesKey = seriesNames.join("\0")
  const seriesNamesRef = useRef(seriesNames)
  seriesNamesRef.current = seriesNames

  const [state, setState] = useState({
    key: seriesKey,
    visible: seriesNames,
  })
  const visible = state.key === seriesKey ? state.visible : seriesNames

  const onItemClick = useCallback(
    (name: string, event: { metaKey: boolean; ctrlKey: boolean }) => {
      const names = seriesNamesRef.current
      const key = names.join("\0")
      const isolate = event.metaKey || event.ctrlKey

      setState((current) => {
        const currentVisible = current.key === key ? current.visible : names

        if (isolate) {
          const wasOnlyClickedVisible =
            currentVisible.length === 1 && currentVisible[0] === name
          return {
            key,
            visible: wasOnlyClickedVisible ? names : [name],
          }
        }

        const nextVisible = currentVisible.includes(name)
          ? currentVisible.filter((item) => item !== name)
          : names.filter(
              (item) => item === name || currentVisible.includes(item),
            )

        return { key, visible: nextVisible }
      })
    },
    [],
  )

  const visibleSet = useMemo(() => new Set(visible), [visible])

  return { visible, visibleSet, onItemClick }
}
