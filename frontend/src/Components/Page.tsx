import { Button, HR } from "flowbite-react"
import type { ReactNode } from "react"
import { FiChevronRight, FiMenu } from "react-icons/fi"
import { useSidebar } from "../Hooks/useSidebar"
import PrivacyToggleButton from "./PrivacyToggleButton"

type PageProps = {
  title?: string
  headerActions?: ReactNode
  children: ReactNode
}

export default function Page({ title, headerActions, children }: PageProps) {
  const {
    showDesktopSidebar,
    showMobileSidebar,
    openDesktopSidebar,
    openMobileSidebar,
  } = useSidebar()

  const showDesktopToggle = !showDesktopSidebar
  const showMobileToggle = !showMobileSidebar
  const showTitleRow = showDesktopToggle || showMobileToggle || title

  return (
    <div className="flex flex-col gap-2 px-4 pt-4 pb-8 md:gap-4 md:pb-16 md:px-16 md:pt-8">
      {showTitleRow && (
        <div className="flex items-center gap-2">
          {showDesktopToggle && (
            <Button
              color="light"
              className="hidden p-0 size-10 shrink-0 md:flex"
              title="Show sidebar"
              aria-label="Show sidebar"
              onClick={openDesktopSidebar}
            >
              <FiChevronRight />
            </Button>
          )}
          {showMobileToggle && (
            <Button
              color="light"
              className="p-0 size-10 shrink-0 md:hidden"
              title="Open navigation menu"
              aria-label="Open navigation menu"
              onClick={openMobileSidebar}
            >
              <FiMenu />
            </Button>
          )}
          {title && (
            <div className="flex-1 min-w-0">
              {headerActions ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <h1 className="text-3xl font-semibold">{title}</h1>
                  <div className="hidden sm:block">{headerActions}</div>
                </div>
              ) : (
                <h1 className="text-3xl font-semibold">{title}</h1>
              )}
            </div>
          )}
          <PrivacyToggleButton />
        </div>
      )}
      {headerActions && (
        <div className="flex justify-end sm:hidden">{headerActions}</div>
      )}
      {(title || headerActions) && <HR />}
      {children}
    </div>
  )
}
