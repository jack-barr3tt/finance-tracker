import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom"
import Transactions from "./Pages/Transactions"
import SignUp from "./Pages/SignUp"
import Login from "./Pages/Login"
import NavBar from "./Components/NavBar"
import RouteProtector from "./Components/RouteProtector"
import Settings from "./Pages/Settings"
import BudgetPlanning from "./Pages/Budget/Planning"
import BudgetActual from "./Pages/Budget/Actual"
import KeyboardShortcutsModal from "./Components/KeyboardShortcutsModal"
import SummaryRangeFilter from "./Components/SummaryRangeFilter"
import { useHotkey } from "@tanstack/react-hotkeys"
import { HOTKEYS_BY_ID } from "./Hotkeys/hotkeys"
import { useMemo, useRef, useState } from "react"
import { ScrollContainerContext } from "./Hooks/useScrollContainer"
import { useUser } from "./Hooks/useUser"
import { Button } from "flowbite-react"
import { FiChevronRight, FiMenu } from "react-icons/fi"

function AppRoutes() {
  const { userId } = useUser()
  const location = useLocation()
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showDesktopSidebar, setShowDesktopSidebar] = useState(true)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const scrollContainerRef = useRef<HTMLElement>(null)

  const hasPrivateNav = useMemo(
    () =>
      Boolean(userId) &&
      !location.pathname.includes("login") &&
      !location.pathname.includes("signup"),
    [location.pathname, userId],
  )
  const showSummaryRangeFilter =
    hasPrivateNav && location.pathname.startsWith("/transactions")

  const routes = (
    <Routes>
      <Route path="/" element={<Navigate to="/transactions" replace />} />
      <Route path="/transactions/*" element={<RouteProtector />}>
        <Route index element={<Transactions />} />
      </Route>
      <Route path="/budget" element={<RouteProtector />}>
        <Route index element={<Navigate to="planning" replace />} />
        <Route path="planning" element={<BudgetPlanning />} />
        <Route path="actual" element={<BudgetActual />} />
      </Route>
      <Route path="/settings/*" element={<RouteProtector />}>
        <Route path="*" element={<Settings />} />
      </Route>
      <Route path="/signup" element={<SignUp />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  )

  useHotkey(
    HOTKEYS_BY_ID.openShortcutsModal.combo,
    () => setShowShortcuts((previous) => !previous),
    { enabled: hasPrivateNav },
  )

  return (
    <>
      <KeyboardShortcutsModal
        show={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
      {hasPrivateNav ? (
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <NavBar
            isDesktopOpen={showDesktopSidebar}
            isMobileOpen={showMobileSidebar}
            onCloseDesktop={() => setShowDesktopSidebar(false)}
            onCloseMobile={() => setShowMobileSidebar(false)}
            onOpenShortcuts={() => setShowShortcuts(true)}
          />
          <ScrollContainerContext.Provider value={scrollContainerRef}>
            <main
              ref={scrollContainerRef}
              className="relative min-h-0 flex-1 overflow-y-auto pt-4 md:pt-8"
            >
              {!showDesktopSidebar && (
                <Button
                  color="light"
                  className="absolute left-2 top-4 z-10 hidden size-10 p-0 md:top-8 md:flex"
                  title="Show sidebar"
                  aria-label="Show sidebar"
                  onClick={() => setShowDesktopSidebar(true)}
                >
                  <FiChevronRight />
                </Button>
              )}
              {!showMobileSidebar && (
                <Button
                  color="light"
                  className="absolute left-2 top-4 z-10 size-10 p-0 md:hidden"
                  title="Open navigation menu"
                  aria-label="Open navigation menu"
                  onClick={() => setShowMobileSidebar(true)}
                >
                  <FiMenu />
                </Button>
              )}
              {showSummaryRangeFilter && (
                <div className="flex justify-end px-8 pb-4 md:px-16">
                  <SummaryRangeFilter />
                </div>
              )}
              {routes}
            </main>
          </ScrollContainerContext.Provider>
        </div>
      ) : (
        routes
      )}
    </>
  )
}

export default function Router() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </div>
  )
}
