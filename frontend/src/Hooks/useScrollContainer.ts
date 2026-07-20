import { createContext, RefObject, useContext } from "react"

export const ScrollContainerContext =
  createContext<RefObject<HTMLElement | null> | null>(null)

export function useScrollContainer() {
  const context = useContext(ScrollContainerContext)
  if (!context) {
    throw new Error(
      "useScrollContainer must be used within ScrollContainerContext",
    )
  }
  return context
}
