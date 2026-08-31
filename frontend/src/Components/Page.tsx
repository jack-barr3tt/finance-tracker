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
        <div className="flex flex-wrap items-center gap-x-2 gap-y-4">
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
            <h1 className="min-w-0 flex-1 text-3xl font-semibold">{title}</h1>
          )}
          {headerActions && (
            <div className="order-last flex w-full justify-end sm:order-none sm:w-auto">
              {headerActions}
            </div>
          )}
          <PrivacyToggleButton />
        </div>
      )}
      {headerActions && !showTitleRow && (
        <div className="flex justify-end">{headerActions}</div>
      )}
      {(title || headerActions) && <HR />}
      {children}
    </div>
  )
}
