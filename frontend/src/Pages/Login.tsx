import { FormEvent, useCallback, useState } from "react"
import { useUser } from "../Hooks/useUser"
import { useNavigate } from "react-router-dom"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const { login } = useUser()
  const navigate = useNavigate()

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      if (await login(email, password)) {
        navigate("/dashboard")
      } else {
        alert("Login failed")
      }
    },
    [login, email, password, navigate]
  )

  return (
    <div className="flex flex-col gap-2">
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
    </div>
  )
}
