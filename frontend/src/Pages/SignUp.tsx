import { FormEvent, useCallback, useState } from "react"
import { SignupRequest } from "../api/apiSchemas"
import { useUser } from "../Hooks/useUser"
import { useNavigate } from "react-router-dom"

export default function SignUp() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")

  const { login } = useUser()
  const navigate = useNavigate()

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      if (password !== passwordConfirmation) {
        alert("Passwords do not match")
        return
      }

      const request: SignupRequest = {
        email,
        password,
      }

      const response = await fetch(import.meta.env.VITE_API_URL + "/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      })

      if (response.ok && (await login(email, password))) {
        navigate("/dashboard")
      } else {
        alert("Sign up failed")
      }
    },
    [email, login, navigate, password, passwordConfirmation]
  )

  return (
    <div>
      <h1>Sign Up</h1>
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
        <input
          type="password"
          placeholder="Confirm password"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
        />
        <button type="submit">Submit</button>
      </form>
    </div>
  )
}
