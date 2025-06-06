import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import Dashboard from "./Pages/Dashboard"
import SignUp from "./Pages/SignUp"
import Login from "./Pages/Login"
import NavBar from "./Components/NavBar"
import RouteProtector from "./Components/RouteProtector"
import Settings from "./Pages/Settings"

export default function Router() {
  return (
    <div className="flex flex-col h-full">
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<Navigate to="login" />} />
          <Route path="/dashboard/*" element={<RouteProtector />}>
            <Route index element={<Dashboard />} />
          </Route>
          <Route path="/settings/*" element={<RouteProtector />}>
            <Route path="*" element={<Settings />} />
          </Route>
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}
