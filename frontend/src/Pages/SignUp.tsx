import { FormEvent, useCallback, useState } from "react"
import { useUser } from "../Hooks/useUser"
import { Link, useNavigate } from "react-router-dom"
import { usePostSignup } from "../API/queries"
import { Button, TextInput } from "flowbite-react"
import { FiArrowRight } from "react-icons/fi"
import { generateKeySalt } from "../Security/keys"

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

      const { salt, master_key } = await generateKeySalt(password)

      try {
        await signUp({
          body: {
            email,
            password: password,
            salt,
            master_key,
          },
        })

        await login(email, password)

        navigate("/transactions")
      } catch {
        alert("Sign up failed")
      }
    },
    [email, login, navigate, password, passwordConfirmation, signUp]
  )

  return (
    <div className="flex items-center justify-center pt-32">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center gap-4 p-8 border border-gray-200 shadow-sm dark:border-gray-700 dark:bg-neutral-800 rounded-xl"
      >
        <h1 className="w-full text-2xl font-medium text-center">Sign Up</h1>
        <TextInput
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-64"
          autoFocus
          autoComplete="email"
        />
        <TextInput
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-64"
        />
        <TextInput
          type="password"
          placeholder="Confirm password"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          className="w-64"
        />
        <Button type="submit" className="w-64 gap-1">
          Submit <FiArrowRight />
        </Button>
        <p className="text-sm">
          Already have an account?{" "}
          <Link className="text-blue-400" to="/login">
            Login
          </Link>
        </p>
      </form>
    </div>
  )
}
