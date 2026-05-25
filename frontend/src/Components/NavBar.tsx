import {
  Button,
  DarkThemeToggle,
  Drawer,
  Sidebar,
  SidebarItem,
  SidebarItemGroup,
  SidebarItems,
} from "flowbite-react"
import { useUser } from "../Hooks/useUser"
import { useLocation, useNavigate } from "react-router-dom"
import {
  FiChevronLeft,
  FiCommand,
  FiCreditCard,
  FiDollarSign,
  FiSettings,
} from "react-icons/fi"

type NavBarProps = {
  isOpen: boolean
  onClose: () => void
  onOpenShortcuts: () => void
}

export default function NavBar(props: NavBarProps) {
  const { isOpen, onClose, onOpenShortcuts } = props
  const { userId } = useUser()
  const location = useLocation()
  const navigate = useNavigate()

  if (!userId) return null
  if (location.pathname.includes("login") || location.pathname.includes("signup")) return null

  const sidebar = (
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
                navigate("/transactions")
              }}
            >
              Transactions
            </SidebarItem>
            <SidebarItem
              href="/budget"
              icon={FiDollarSign}
              active={location.pathname.startsWith("/budget")}
              onClick={(event) => {
                event.preventDefault()
                navigate("/budget")
              }}
            >
              Budget
            </SidebarItem>
            <SidebarItem
              href="/settings"
              icon={FiSettings}
              active={location.pathname.startsWith("/settings")}
              onClick={(event) => {
                event.preventDefault()
                navigate("/settings")
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
          <DarkThemeToggle />
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
      {isOpen && <div className="hidden h-full w-64 shrink-0 md:block">{sidebar}</div>}
      <Drawer
        open={isOpen}
        onClose={onClose}
        position="left"
        backdrop={false}
        className="p-0 md:hidden"
      >
        {sidebar}
      </Drawer>
    </>
  )
}
