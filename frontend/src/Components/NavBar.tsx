import { Button, DarkThemeToggle } from "flowbite-react"
import { useUser } from "../Hooks/useUser"
import { Link, useLocation, useNavigate } from "react-router-dom"

export default function NavBar() {
  const { userId } = useUser()
  const navigate = useNavigate()
  const location = useLocation()

  if (!userId) return null
  if (location.pathname.includes("login") || location.pathname.includes("signup")) return null

  return (
    <div className="flex items-center w-full gap-4 px-8 py-4 md:px-16">
      <Link to="/transactions">
        <Button color="light">Transactions</Button>
      </Link>
      <Link to="/budget">
        <Button color="light">Budget</Button>
      </Link>

      <div className="mr-auto" />

      <Button onClick={() => navigate("/settings")}>Settings</Button>
      <DarkThemeToggle />
    </div>
  )
}
