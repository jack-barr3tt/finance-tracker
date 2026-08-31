import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

const KEY = "privacy-revealed-until"
const TTL_MS = 15 * 60 * 1000

type PrivacyContextValue = {
  shaded: boolean
  hide: () => void
  reveal: () => void
}

export const PrivacyContext = createContext<PrivacyContextValue | null>(null)

function readUntil() {
  try {
    return Number(localStorage.getItem(KEY) || 0)
  } catch {
    return 0
  }
}

function writeUntil(value: number | null) {
  try {
    if (value == null) localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, String(value))
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [shaded, setShaded] = useState(() => readUntil() <= Date.now())

  const hide = useCallback(() => {
    writeUntil(null)
    setShaded(true)
  }, [])

  const reveal = useCallback(() => {
    writeUntil(Date.now() + TTL_MS)
    setShaded(false)
  }, [])

  useEffect(() => {
    if (shaded) return

    let timer = 0
    const leave = () => {
      writeUntil(Date.now() + TTL_MS)
      window.clearTimeout(timer)
      timer = window.setTimeout(hide, TTL_MS)
    }
    const resume = () => {
      window.clearTimeout(timer)
      if (readUntil() <= Date.now()) hide()
      else writeUntil(Date.now() + TTL_MS)
    }
    const onVisibility = () => (document.hidden ? leave() : resume())

    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("pagehide", leave)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("pagehide", leave)
    }
  }, [shaded, hide])

  const value = useMemo(
    () => ({ shaded, hide, reveal }),
    [shaded, hide, reveal],
  )

  return <PrivacyContext value={value}>{children}</PrivacyContext>
}

export function usePrivacy() {
  const context = useContext(PrivacyContext)
  if (!context) {
    throw new Error("usePrivacy must be used within PrivacyProvider")
  }
  return context
}
