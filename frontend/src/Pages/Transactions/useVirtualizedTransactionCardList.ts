import { useVirtualizer } from "@tanstack/react-virtual"
import {
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"

const CARD_HEIGHT_PX = 108
const CARD_GAP_PX = 12

type UseVirtualizedTransactionCardListInput = {
  scrollContainerRef: RefObject<HTMLElement | null>
  rowCount: number
  enabled: boolean
  remeasureKey?: string
  layoutKey: unknown
}

function getOffsetTop(
  element: HTMLElement,
  scrollContainer: HTMLElement,
): number {
  let offsetTop = 0
  for (
    let node: HTMLElement | null = element;
    node && node !== scrollContainer;
    node = node.offsetParent as HTMLElement | null
  ) {
    offsetTop += node.offsetTop
  }
  return offsetTop
}

export function useVirtualizedTransactionCardList(
  input: UseVirtualizedTransactionCardListInput,
) {
  const { scrollContainerRef, rowCount, enabled, remeasureKey, layoutKey } =
    input
  const virtualListStartRef = useRef<HTMLDivElement>(null)
  const [scrollMargin, setScrollMargin] = useState(0)

  const virtualizer = useVirtualizer({
    count: enabled ? rowCount : 0,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => CARD_HEIGHT_PX,
    overscan: 5,
    scrollMargin,
    gap: CARD_GAP_PX,
  })

  const updateScrollMargin = useCallback(() => {
    const scrollEl = scrollContainerRef.current
    const listEl = virtualListStartRef.current
    if (!scrollEl || !listEl) return
    setScrollMargin(getOffsetTop(listEl, scrollEl))
  }, [scrollContainerRef])

  useLayoutEffect(() => {
    updateScrollMargin()
    const scrollEl = scrollContainerRef.current
    const listEl = virtualListStartRef.current
    if (!scrollEl || !listEl) return

    const observer = new ResizeObserver(updateScrollMargin)
    observer.observe(scrollEl)
    observer.observe(listEl)
    return () => observer.disconnect()
  }, [scrollContainerRef, updateScrollMargin, enabled, layoutKey])

  useEffect(() => {
    if (remeasureKey) virtualizer.measure()
  }, [remeasureKey, virtualizer])

  const virtualItems = virtualizer.getVirtualItems()
  const paddingTop =
    virtualItems.length > 0
      ? Math.max(0, virtualItems[0].start - scrollMargin)
      : 0
  const paddingBottom =
    virtualItems.length > 0
      ? Math.max(
          0,
          virtualizer.getTotalSize() -
            virtualItems[virtualItems.length - 1].end,
        )
      : 0

  return {
    virtualListStartRef,
    virtualizer,
    virtualItems,
    paddingTop,
    paddingBottom,
  }
}
