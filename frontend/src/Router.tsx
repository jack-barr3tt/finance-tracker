import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom"
import Transactions from "./Pages/Transactions"
import SignUp from "./Pages/SignUp"
import Login from "./Pages/Login"
import NavBar from "./Components/NavBar"
import RouteProtector from "./Components/RouteProtector"
import Settings from "./Pages/Settings"
import Budget from "./Pages/Budget"
import KeyboardShortcutsModal from "./Components/KeyboardShortcutsModal"
import { useHotkey } from "@tanstack/react-hotkeys"
import { HOTKEYS_BY_ID } from "./Hotkeys/hotkeys"
import { useMemo, useState } from "react"
import { useUser } from "./Hooks/useUser"

function AppRoutes() {
  const { userId } = useUser()
  const location = useLocation()
  const [showShortcuts, setShowShortcuts] = useState(false)

  const hasPrivateNav = useMemo(
    () =>
      Boolean(userId) &&
      !location.pathname.includes("login") &&
      !location.pathname.includes("signup"),
    [location.pathname, userId],
  )

  useHotkey(
    HOTKEYS_BY_ID.openShortcutsModal.combo,
    () => setShowShortcuts((previous) => !previous),
    { enabled: hasPrivateNav },
  )

  return (
    <>
      <NavBar onOpenShortcuts={() => setShowShortcuts(true)} />
      <KeyboardShortcutsModal show={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <Routes>
        <Route path="/" element={<Navigate to="login" />} />
        <Route path="/transactions/*" element={<RouteProtector />}>
          <Route index element={<Transactions />} />
        </Route>
        <Route path="/budget/*" element={<RouteProtector />}>
          <Route path="*" element={<Budget />} />
        </Route>
        <Route path="/settings/*" element={<RouteProtector />}>
          <Route path="*" element={<Settings />} />
        </Route>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </>
  )
}

export default function Router() {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </div>
  )
}
