/* eslint-disable react-refresh/only-export-components */
import { createContext, ReactNode, useContext, useEffect, useState } from "react"
import Cookies from "js-cookie"
import { useGetUserById, usePostLogin } from "../API/queries"

interface UserValue {
  userId: string
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const UserContext = createContext<UserValue | undefined>(undefined)

export function useUser() {
  const context = useContext(UserContext)
  if (!context) throw new Error("No user context")
  return context
}

export function UserProvider(props: { children: ReactNode }) {
  const [userId, setUserId] = useState<string>("")

  const { mutateAsync: loginReq } = usePostLogin()
  const { isError } = useGetUserById({ path: { id: userId } }, undefined, {
    enabled: !!userId,
  })

  const login = async (email: string, password: string) => {
    try {
      const response = await loginReq({
        body: {
          email,
          password,
        },
      })

      setUserId(response.data?.id || "")

      Cookies.set("access_token", response.data?.token || "", {})
      Cookies.set("user_id", String(response.data?.id || ""), {})

      return true
    } catch {
      return false
    }
  }

  useEffect(() => {
    if (isError) {
      setUserId("")
      Cookies.remove("access_token")
      Cookies.remove("user_id")
    }
  }, [isError])

  useEffect(() => {
    const storedUserId = Cookies.get("user_id")
    const storedAccessToken = Cookies.get("access_token")
    if (storedUserId && storedAccessToken) {
      setUserId(storedUserId)
    }
  }, [])

  const logout = () => {
    setUserId("")
    Cookies.remove("access_token")
    Cookies.remove("user_id")
  }

  const value: UserValue = {
    userId,
    login,
    logout,
  }

  return <UserContext.Provider value={value}>{props.children}</UserContext.Provider>
}
