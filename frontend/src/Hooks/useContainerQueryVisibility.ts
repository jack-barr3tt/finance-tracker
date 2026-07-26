import { RefObject, useLayoutEffect, useState } from "react"

function isElementVisible(el: HTMLElement): boolean {
  const style = getComputedStyle(el)
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    el.offsetParent !== null
  )
}

export function useContainerQueryVisibility(
  ref: RefObject<HTMLElement | null>,
) {
  const [visible, setVisible] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const check = () => setVisible(isElementVisible(el))

    check()

    const observer = new ResizeObserver(check)
    observer.observe(el)
    const container = el.parentElement
    if (container) observer.observe(container)

    return () => observer.disconnect()
  }, [ref])

  return visible
}
