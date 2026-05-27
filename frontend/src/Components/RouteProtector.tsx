import { Navigate, Outlet } from "react-router-dom"
import { useUser } from "../Hooks/useUser"

export default function RouteProtector() {
  const { userId } = useUser()

  if (!userId) return <Navigate to="/login" replace />

  return <Outlet />
}
