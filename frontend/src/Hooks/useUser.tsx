/* eslint-disable react-refresh/only-export-components */
import { createContext, ReactNode, useContext, useState } from "react"
import { LoginRequest, LoginResponse } from "../api/apiSchemas"
import Cookies from "js-cookie"

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

  const login = async (email: string, password: string) => {
    const request: LoginRequest = {
      email,
      password,
    }

    const response = await fetch(import.meta.env.VITE_API_URL + "/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })

    if (response.ok) {
      const data = (await response.json()) as LoginResponse
      setUserId(data.id)

      Cookies.set("access_token", data.token, {})

      return true
    }

    return false
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
