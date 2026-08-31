import { useActionState } from "react"
import { useUser } from "../Hooks/useUser"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { usePostSignup } from "../API"
import { Button, TextInput } from "flowbite-react"
import { FiArrowRight } from "react-icons/fi"
import { generateKeySalt } from "../Security/keys"

const signupEnabled = import.meta.env.VITE_ENABLE_SIGNUP === "true"

export default function SignUp() {
  const { mutateAsync: signUp } = usePostSignup()
  const { login } = useUser()
  const navigate = useNavigate()

  const [error, submit, isPending] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      const email = String(formData.get("email") ?? "")
      const password = String(formData.get("password") ?? "")
      const passwordConfirmation = String(
        formData.get("passwordConfirmation") ?? "",
      )

      if (password !== passwordConfirmation) {
        return "Passwords do not match"
      }

      const { salt, master_key } = await generateKeySalt(password)

      try {
        await signUp({
          data: {
            email,
            password,
            salt,
            master_key,
          },
        })

        await login(email, password)
        navigate("/transactions")
        return null
      } catch {
        return "Sign up failed"
      }
    },
    null,
  )

  if (!signupEnabled) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex items-center justify-center pt-32">
      <form
        action={submit}
        className="flex flex-col items-center gap-4 p-8 border border-gray-200 shadow-sm dark:border-gray-700 dark:bg-neutral-800 rounded-xl"
      >
        <h1 className="w-full text-2xl font-medium text-center">Sign Up</h1>
        <TextInput
          type="email"
          name="email"
          placeholder="Email"
          className="w-64"
          autoFocus
          autoComplete="email"
          required
        />
        <TextInput
          type="password"
          name="password"
          placeholder="Password"
          className="w-64"
          required
        />
        <TextInput
          type="password"
          name="passwordConfirmation"
          placeholder="Confirm password"
          className="w-64"
          required
        />
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-64 gap-1" disabled={isPending}>
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
