import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import Transactions from "./Pages/Transactions"
import SignUp from "./Pages/SignUp"
import Login from "./Pages/Login"
import NavBar from "./Components/NavBar"
import RouteProtector from "./Components/RouteProtector"
import Settings from "./Pages/Settings"

export default function Router() {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<Navigate to="login" />} />
          <Route path="/transactions/*" element={<RouteProtector />}>
            <Route index element={<Transactions />} />
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
