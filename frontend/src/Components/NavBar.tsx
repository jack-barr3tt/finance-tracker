import {
  Button,
  Drawer,
  Sidebar,
  SidebarItem,
  SidebarItemGroup,
  SidebarItems,
  useThemeMode,
} from "flowbite-react"
import { useUser } from "../Hooks/useUser"
import { useLocation, useNavigate } from "react-router-dom"
import {
  FiChevronLeft,
  FiCommand,
  FiCreditCard,
  FiDollarSign,
  FiMoon,
  FiSettings,
  FiSun,
} from "react-icons/fi"

type NavBarProps = {
  isDesktopOpen: boolean
  isMobileOpen: boolean
  onCloseDesktop: () => void
  onCloseMobile: () => void
  onOpenShortcuts: () => void
}

export default function NavBar(props: NavBarProps) {
  const { isDesktopOpen, isMobileOpen, onCloseDesktop, onCloseMobile, onOpenShortcuts } = props
  const { userId } = useUser()
  const location = useLocation()
  const navigate = useNavigate()
  const { computedMode, toggleMode } = useThemeMode()

  if (!userId) return null
  if (location.pathname.includes("login") || location.pathname.includes("signup")) return null

  const isBudgetPlanning =
    location.pathname === "/budget/planning" || location.pathname === "/budget"
  const isBudgetActual = location.pathname.startsWith("/budget/actual")

  const handleNavigate = (path: string) => {
    navigate(path)
    onCloseMobile()
  }

  const renderSidebar = (onClose: () => void) => (
    <Sidebar aria-label="Main navigation" className="h-full w-full md:w-64">
      <div className="flex h-full flex-col justify-between">
        <SidebarItems>
          <SidebarItemGroup>
            <SidebarItem
              href="/transactions"
              icon={FiCreditCard}
              active={location.pathname.startsWith("/transactions")}
              onClick={(event) => {
                event.preventDefault()
                handleNavigate("/transactions")
              }}
            >
              Transactions
            </SidebarItem>
            <SidebarItem
              href="/budget/planning"
              icon={FiDollarSign}
              active={false}
              onClick={(event) => {
                event.preventDefault()
                handleNavigate("/budget/planning")
              }}
            >
              Budget
            </SidebarItem>
            <SidebarItem
              href="/budget/planning"
              className="pl-10"
              active={isBudgetPlanning}
              onClick={(event) => {
                event.preventDefault()
                handleNavigate("/budget/planning")
              }}
            >
              Planning
            </SidebarItem>
            <SidebarItem
              href="/budget/actual"
              className="pl-10"
              active={isBudgetActual}
              onClick={(event) => {
                event.preventDefault()
                handleNavigate("/budget/actual")
              }}
            >
              Actual
            </SidebarItem>
            <SidebarItem
              href="/settings"
              icon={FiSettings}
              active={location.pathname.startsWith("/settings")}
              onClick={(event) => {
                event.preventDefault()
                handleNavigate("/settings")
              }}
            >
              Settings
            </SidebarItem>
          </SidebarItemGroup>
        </SidebarItems>
        <div className="flex items-center gap-2 px-2 py-4">
          <Button
            color="light"
            className="size-10 p-0"
            title="Open keyboard shortcuts"
            aria-label="Open keyboard shortcuts"
            onClick={onOpenShortcuts}
          >
            <FiCommand />
          </Button>
          <Button
            color="light"
            className="size-10 p-0"
            title="Toggle dark mode"
            aria-label="Toggle dark mode"
            onClick={toggleMode}
          >
            {computedMode === "dark" ? <FiSun /> : <FiMoon />}
          </Button>
          <Button
            color="light"
            className="size-10 p-0"
            title="Hide sidebar"
            aria-label="Hide sidebar"
            onClick={onClose}
          >
            <FiChevronLeft />
          </Button>
        </div>
      </div>
    </Sidebar>
  )

  return (
    <>
      {isDesktopOpen && (
        <div className="hidden h-full w-64 shrink-0 md:block">{renderSidebar(onCloseDesktop)}</div>
      )}
      <Drawer
        open={isMobileOpen}
        onClose={onCloseMobile}
        position="left"
        className="p-0 md:hidden"
      >
        {renderSidebar(onCloseMobile)}
      </Drawer>
    </>
  )
}
