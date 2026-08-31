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
import { useHotkey } from "@tanstack/react-hotkeys"
import { HOTKEYS_BY_ID } from "./Hotkeys/hotkeys"
import { useMemo, useRef, useState } from "react"
import { ScrollContainerContext } from "./Hooks/useScrollContainer"
import { SidebarProvider } from "./Hooks/useSidebar"
import { useUser } from "./Hooks/useUser"

function AppRoutes() {
  const { userId } = useUser()
  const location = useLocation()
  const [showShortcuts, setShowShortcuts] = useState(false)
  const scrollContainerRef = useRef<HTMLElement>(null)

  const hasPrivateNav = useMemo(
    () =>
      Boolean(userId) &&
      !location.pathname.includes("login") &&
      !location.pathname.includes("signup"),
    [location.pathname, userId],
  )

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
        <SidebarProvider>
          <div className="flex min-h-0 flex-1 flex-col md:flex-row">
            <NavBar onOpenShortcuts={() => setShowShortcuts(true)} />
            <ScrollContainerContext value={scrollContainerRef}>
              <main
                ref={scrollContainerRef}
                className="relative min-h-0 flex-1 overflow-y-auto"
              >
                {routes}
              </main>
            </ScrollContainerContext>
          </div>
        </SidebarProvider>
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
