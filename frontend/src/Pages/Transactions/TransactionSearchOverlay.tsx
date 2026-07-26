import { Button, TextInput } from "flowbite-react"
import { useEffect, useRef } from "react"
import { FiSearch, FiX } from "react-icons/fi"
import { useHotkey } from "@tanstack/react-hotkeys"

type TransactionSearchOverlayProps = {
  show: boolean
  onClose: () => void
  searchQuery: string
  onSearchQueryChange: (value: string) => void
}

export default function TransactionSearchOverlay(
  props: TransactionSearchOverlayProps,
) {
  const { show, onClose, searchQuery, onSearchQueryChange } = props
  const searchInputRef = useRef<HTMLInputElement>(null)
  const hasSearchQuery = searchQuery.trim().length > 0

  useEffect(() => {
    if (!show) return
    searchInputRef.current?.focus()
  }, [show])

  useHotkey("Escape", onClose, { enabled: show })

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        aria-label="Close search"
        onClick={onClose}
      />
      <div className="relative z-10 p-4">
        <div className="relative">
          <TextInput
            ref={searchInputRef}
            className="w-full [&_input]:pr-9"
            icon={FiSearch}
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
          />
          {hasSearchQuery && (
            <Button
              className="absolute right-2 top-1/2 size-8 -translate-y-1/2 p-0"
              color="light"
              aria-label="Clear search"
              onClick={() => onSearchQueryChange("")}
            >
              <FiX />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
