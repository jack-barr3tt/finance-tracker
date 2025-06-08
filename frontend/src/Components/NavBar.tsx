import { Button, DarkThemeToggle } from "flowbite-react"
import { useUser } from "../Hooks/useUser"
import { useNavigate } from "react-router-dom"
import { FiHome } from "react-icons/fi"

export default function NavBar() {
  const { userId } = useUser()
  const navigate = useNavigate()

  return (
    <div className="flex items-center w-full gap-8 px-8 py-4 md:px-16">
      <Button
        onClick={() => (userId ? navigate("/dashboard") : null)}
        className="w-10 p-0 mr-auto"
        color="light"
      >
        <FiHome />
      </Button>
      {userId ? (
        <>
          <Button onClick={() => navigate("/settings")}>Settings</Button>
        </>
      ) : null}
      <DarkThemeToggle />
    </div>
  )
}
