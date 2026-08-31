import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"

type PrivacyContextValue = {
  shaded: boolean
  hide: () => void
  reveal: () => void
}

export const PrivacyContext = createContext<PrivacyContextValue | null>(null)

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [shaded, setShaded] = useState(true)

  const hide = useCallback(() => setShaded(true), [])
  const reveal = useCallback(() => setShaded(false), [])

  const value = useMemo(
    () => ({
      shaded,
      hide,
      reveal,
    }),
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
