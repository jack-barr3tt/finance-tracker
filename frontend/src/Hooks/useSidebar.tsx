import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"

type SidebarContextValue = {
  showDesktopSidebar: boolean
  showMobileSidebar: boolean
  openDesktopSidebar: () => void
  openMobileSidebar: () => void
  closeDesktopSidebar: () => void
  closeMobileSidebar: () => void
}

export const SidebarContext = createContext<SidebarContextValue | null>(null)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [showDesktopSidebar, setShowDesktopSidebar] = useState(true)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  const openDesktopSidebar = useCallback(() => setShowDesktopSidebar(true), [])
  const openMobileSidebar = useCallback(() => setShowMobileSidebar(true), [])
  const closeDesktopSidebar = useCallback(
    () => setShowDesktopSidebar(false),
    [],
  )
  const closeMobileSidebar = useCallback(() => setShowMobileSidebar(false), [])

  const value = useMemo(
    () => ({
      showDesktopSidebar,
      showMobileSidebar,
      openDesktopSidebar,
      openMobileSidebar,
      closeDesktopSidebar,
      closeMobileSidebar,
    }),
    [
      showDesktopSidebar,
      showMobileSidebar,
      openDesktopSidebar,
      openMobileSidebar,
      closeDesktopSidebar,
      closeMobileSidebar,
    ],
  )

  return <SidebarContext value={value}>{children}</SidebarContext>
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider")
  }
  return context
}
