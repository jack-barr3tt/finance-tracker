import type { ReactNode } from "react"
import { usePrivacy } from "../Hooks/usePrivacy"

type PrivacyCoverProps = {
  children: ReactNode
  className?: string
}

export default function PrivacyCover({
  children,
  className,
}: PrivacyCoverProps) {
  const { shaded } = usePrivacy()

  return (
    <span className={`relative inline-block ${className ?? ""}`}>
      <span className={shaded ? "invisible" : undefined}>{children}</span>
      {shaded && (
        <span
          aria-hidden
          className="absolute inset-0 rounded bg-gray-200 dark:bg-gray-700"
        />
      )}
    </span>
  )
}
