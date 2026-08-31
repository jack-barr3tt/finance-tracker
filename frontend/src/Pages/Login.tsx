import { useActionState } from "react"
import { useUser } from "../Hooks/useUser"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { Button, TextInput } from "flowbite-react"
import { FiArrowRight } from "react-icons/fi"

const signupEnabled = import.meta.env.VITE_ENABLE_SIGNUP === "true"

export default function Login() {
  const { login, userId, isSessionReady } = useUser()
  const navigate = useNavigate()

  const [error, submit, isPending] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      const email = String(formData.get("email") ?? "")
      const password = String(formData.get("password") ?? "")

      if (await login(email, password)) {
        navigate("/transactions")
        return null
      }

      return "Login failed"
    },
    null,
  )

  if (isSessionReady && userId) {
    return <Navigate to="/transactions" replace />
  }

  return (
    <div className="flex items-center justify-center pt-32">
      <form
        action={submit}
        className="flex flex-col items-center gap-4 p-8 border border-gray-200 shadow-sm dark:border-gray-700 dark:bg-neutral-800 rounded-xl"
      >
        <h1 className="w-full text-2xl font-medium text-center">Login</h1>
        <TextInput
          autoFocus
          name="email"
          type="email"
          placeholder="Email"
          className="w-64"
          required
        />
        <TextInput
          name="password"
          type="password"
          placeholder="Password"
          className="w-64"
          required
        />
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
        <Button className="w-full gap-1" type="submit" disabled={isPending}>
          Submit <FiArrowRight />
        </Button>
        {signupEnabled && (
          <p className="text-sm">
            Need an account?{" "}
            <Link className="text-blue-400" to="/signup">
              Sign Up
            </Link>
          </p>
        )}
      </form>
    </div>
  )
}
