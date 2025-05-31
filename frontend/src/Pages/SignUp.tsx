import { FormEvent, useCallback, useState } from "react"
import { useUser } from "../Hooks/useUser"
import { useNavigate } from "react-router-dom"
import { usePostSignup } from "../API/queries"

export default function SignUp() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")

  const { mutateAsync: signUp } = usePostSignup()

  const { login } = useUser()
  const navigate = useNavigate()

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      if (password !== passwordConfirmation) {
        alert("Passwords do not match")
        return
      }

      try {
        await signUp({
          body: {
            email,
            password,
          },
        })

        await login(email, password)

        navigate("/dashboard")
      } catch {
        alert("Sign up failed")
      }
    },
    [email, login, navigate, password, passwordConfirmation, signUp]
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
