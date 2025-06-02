import { useEffect } from "react"
import { Outlet, useNavigate } from "react-router-dom"
import { useUser } from "../Hooks/useUser"

export default function RouteProtector() {
  const { userId } = useUser()
  const navigate = useNavigate()

  useEffect(() => {
    if (userId === null) {
      navigate("/login")
    }
  }, [userId, navigate])

  return <Outlet />
}
