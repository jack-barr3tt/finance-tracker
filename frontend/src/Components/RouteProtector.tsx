import { Navigate, Outlet } from "react-router-dom"
import { Spinner } from "flowbite-react"
import { useUser } from "../Hooks/useUser"

export default function RouteProtector() {
  const { userId, isSessionReady } = useUser()

  if (!isSessionReady)
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size="xl" />
      </div>
    )

  if (!userId) return <Navigate to="/login" replace />

  return <Outlet />
}
