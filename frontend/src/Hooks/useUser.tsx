/* eslint-disable react-refresh/only-export-components */
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react"
import Cookies from "js-cookie"
import { useGetUserById, usePostLogin } from "../API/queries"
import { decryptMasterKey } from "../Security/keys"

export type DecryptFunction = <T extends string | null | undefined>(data: T) => Promise<T>

interface UserValue {
  userId: string
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  decrypt: DecryptFunction
  encrypt: (data: string) => Promise<string>
}

const UserContext = createContext<UserValue | undefined>(undefined)

export function useUser() {
  const context = useContext(UserContext)
  if (!context) throw new Error("No user context")
  return context
}

export function UserProvider(props: { children: ReactNode }) {
  const [userId, setUserId] = useState<string>("")
  const [key, setKey] = useState<CryptoKey | null>(null)

  const { mutateAsync: loginReq } = usePostLogin()
  const { isError } = useGetUserById({ path: { id: userId } }, undefined, {
    enabled: !!userId,
  })

  const login = async (email: string, password: string) => {
    try {
      const { data } = await loginReq({
        body: {
          email,
          password,
        },
      })

      if (!data) {
        return false
      }

      setUserId(data.id || "")

      Cookies.set("access_token", data.token || "", {})
      Cookies.set("user_id", String(data.id || ""), {})

      setKey(await decryptMasterKey(data.salt, data.master_key, password))

      return true
    } catch (error) {
      console.error(error)
      return false
    }
  }

  const decrypt = useCallback(
    <T extends string | undefined | null>(data: T): Promise<T> => {
      if (!data) return Promise.resolve(data)
      if (!key) throw new Error("No key available for decryption")
      const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0))
      const iv = bytes.slice(0, 12)

      return crypto.subtle
        .decrypt({ name: "AES-GCM", iv }, key, bytes.slice(12))
        .then((buf) => new TextDecoder().decode(buf) as T)
    },
    [key]
  )

  const encrypt = useCallback(
    async (data: string) => {
      if (!key) throw new Error("No key available for encryption")
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const encodedData = new TextEncoder().encode(data)

      const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encodedData)

      const combined = new Uint8Array(iv.length + ciphertext.byteLength)
      combined.set(iv, 0)
      combined.set(new Uint8Array(ciphertext), iv.length)

      return btoa(String.fromCharCode(...combined))
    },
    [key]
  )

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
    decrypt,
    encrypt,
  }

  return <UserContext.Provider value={value}>{props.children}</UserContext.Provider>
}
