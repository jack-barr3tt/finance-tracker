import { Card } from "flowbite-react"
import { forwardRef, KeyboardEvent, ReactNode } from "react"

type DataCardProps = {
  onClick: () => void
  children: ReactNode
  className?: string
  "data-index"?: number
}

export default forwardRef<HTMLDivElement, DataCardProps>(function DataCard(
  { onClick, children, className, ...rest },
  ref,
) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onClick()
    }
  }

  return (
    <Card
      ref={ref}
      role="button"
      tabIndex={0}
      theme={{ root: { children: "p-4" } }}
      className={`cursor-pointer bg-white transition-colors hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700/50 ${className ?? ""}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      {children}
    </Card>
  )
})
