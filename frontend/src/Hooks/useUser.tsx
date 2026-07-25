/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import Cookies from "js-cookie"
import { Spinner } from "flowbite-react"
import { useGetUserId, usePostLogin } from "../API"
import {
  decryptMasterKey,
  exportMasterKey,
  importMasterKey,
} from "../Security/keys"

export type DecryptFunction = <T extends string | null | undefined>(
  data: T,
) => Promise<T>

const MASTER_KEY_JWK = "master_key_jwk"

const autoLoginEmail = import.meta.env.VITE_AUTO_LOGIN_EMAIL
const autoLoginPassword = import.meta.env.VITE_AUTO_LOGIN_PASSWORD
const autoLoginEnabled =
  import.meta.env.DEV && Boolean(autoLoginEmail && autoLoginPassword)

function getInitialUserId(): string {
  const id = Cookies.get("user_id")
  const token = Cookies.get("access_token")
  return id && token ? id : ""
}

interface UserValue {
  userId: string
  isSessionReady: boolean
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
  const [userId, setUserId] = useState(getInitialUserId)
  const [key, setKey] = useState<CryptoKey | null>(null)
  const [isSessionReady, setIsSessionReady] = useState(false)

  const { mutateAsync: loginReq } = usePostLogin()
  const { isError } = useGetUserId(userId, {
    query: { enabled: !!userId && isSessionReady },
  })

  const logout = useCallback(() => {
    setUserId("")
    setKey(null)
    Cookies.remove("access_token")
    Cookies.remove("user_id")
    sessionStorage.removeItem(MASTER_KEY_JWK)
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const data = await loginReq({
          data: {
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

        const masterKey = await decryptMasterKey(
          data.salt,
          data.master_key,
          password,
        )
        sessionStorage.setItem(MASTER_KEY_JWK, await exportMasterKey(masterKey))
        setKey(masterKey)

        return true
      } catch (error) {
        console.error(error)
        return false
      }
    },
    [loginReq],
  )

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
    [key],
  )

  const encrypt = useCallback(
    async (data: string) => {
      if (!key) throw new Error("No key available for encryption")
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const encodedData = new TextEncoder().encode(data)

      const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encodedData,
      )

      const combined = new Uint8Array(iv.length + ciphertext.byteLength)
      combined.set(iv, 0)
      combined.set(new Uint8Array(ciphertext), iv.length)

      return btoa(String.fromCharCode(...combined))
    },
    [key],
  )

  useEffect(() => {
    if (isSessionReady && isError) {
      logout()
    }
  }, [isError, isSessionReady, logout])

  useEffect(() => {
    async function restoreSession() {
      if (autoLoginEnabled) {
        const success = await login(autoLoginEmail, autoLoginPassword)
        if (!success) {
          logout()
          console.warn("Auto login failed")
        }
        setIsSessionReady(true)
        return
      }

      const storedUserId = Cookies.get("user_id")
      const storedAccessToken = Cookies.get("access_token")

      if (storedUserId && storedAccessToken) {
        const jwkJson = sessionStorage.getItem(MASTER_KEY_JWK)
        if (!jwkJson) {
          logout()
        } else {
          try {
            setKey(await importMasterKey(jwkJson))
          } catch {
            logout()
          }
        }
      }

      setIsSessionReady(true)
    }

    void restoreSession()
  }, [login, logout])

  if (!isSessionReady) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="xl" />
      </div>
    )
  }

  const value: UserValue = {
    userId,
    isSessionReady,
    login,
    logout,
    decrypt,
    encrypt,
  }

  return (
    <UserContext.Provider value={value}>{props.children}</UserContext.Provider>
  )
}
