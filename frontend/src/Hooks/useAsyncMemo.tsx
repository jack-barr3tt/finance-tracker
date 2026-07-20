import { useState, useEffect, type DependencyList } from "react"

export function useAsyncMemo<T>(
  factory: () => Promise<T>,
  deps: DependencyList,
): T | null {
  const [value, setValue] = useState<T | null>(null)

  useEffect(() => {
    let cancelled = false
    factory().then((val) => {
      if (!cancelled) setValue(val)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps])

  return value
}
