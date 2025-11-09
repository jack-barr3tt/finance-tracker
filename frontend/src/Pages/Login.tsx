import { FormEvent, useCallback, useState } from "react"
import { useUser } from "../Hooks/useUser"
import { Link, useNavigate } from "react-router-dom"
import { Button, TextInput } from "flowbite-react"
import { FiArrowRight } from "react-icons/fi"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const { login } = useUser()
  const navigate = useNavigate()

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      if (await login(email, password)) {
        navigate("/transactions")
      } else {
        alert("Login failed")
      }
    },
    [login, email, password, navigate]
  )

  return (
    <div className="flex items-center justify-center pt-32">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center gap-4 p-8 border border-gray-200 shadow-sm dark:border-gray-700 dark:bg-neutral-800 rounded-xl"
      >
        <h1 className="w-full text-2xl font-medium text-center">Login</h1>
        <TextInput
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-64"
        />
        <TextInput
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-64"
        />
        <Button className="w-full gap-1" type="submit">
          Submit <FiArrowRight />
        </Button>
        <p className="text-sm">
          Need an account? <Link className="text-blue-400"  to="/signup">Sign Up</Link>
        </p>
      </form>
    </div>
  )
}
