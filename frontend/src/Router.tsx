import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import Dashboard from "./Pages/Dashboard"
import SignUp from "./Pages/SignUp"
import Login from "./Pages/Login"
import { DarkThemeToggle } from "flowbite-react"

export default function Router() {
  return (
    <BrowserRouter>
      <div className="flex items-center justify-end w-full p-2">
        <DarkThemeToggle />
      </div>
      <Routes>
        <Route path="/" element={<Navigate to="login" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}
