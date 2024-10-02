import { FormEvent, useCallback, useState } from "react"
import { useUser } from "../Hooks/useUser"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const { userId, login } = useUser()

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      const result = await login(email, password)

      console.log(result)
    },
    [email, password, login]
  )

  return (
    <div className="flex flex-col gap-2">
      <div>Current user ID is: {userId}</div>
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
