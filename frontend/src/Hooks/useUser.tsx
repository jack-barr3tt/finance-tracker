/* eslint-disable react-refresh/only-export-components */
import { createContext, ReactNode, useContext, useState } from "react"
import Cookies from "js-cookie"
import { usePostLogin } from "../API/queries"

interface UserValue {
  userId: number | null
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
  const [userId, setUserId] = useState<number | null>(null)

  const { mutateAsync: loginReq } = usePostLogin()

  const login = async (email: string, password: string) => {
    try {
      const response = await loginReq({
        body: {
          email,
          password,
        },
      })

      setUserId(response.data?.id || null)

      Cookies.set("access_token", response.data?.token || "", {})

      return true
    } catch {
      return false
    }
  }

  const logout = () => {
    setUserId(null)
    Cookies.remove("access_token")
  }

  const value: UserValue = {
    userId,
    login,
    logout,
  }

  return <UserContext.Provider value={value}>{props.children}</UserContext.Provider>
}
