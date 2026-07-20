import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react"
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"
import { Button, Card, TextInput } from "flowbite-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { FiChevronLeft, FiChevronRight } from "react-icons/fi"

type CalendarDatePickerProps = {
  value: Date | null
  onChange: (value: Date | null) => void
  autoFocus?: boolean
  placeholder?: string
}

const WEEK_STARTS_ON = 1
const INPUT_FORMAT = "dd/MM/yyyy"

type ParsedInputResult =
  { kind: "empty" } | { kind: "valid"; value: Date } | { kind: "invalid" }

function formatInputValue(value: Date | null) {
  return value ? format(value, INPUT_FORMAT) : ""
}

function buildDate(day: number, month: number, year: number) {
  const candidate = new Date(year, month - 1, day)

  if (
    Number.isNaN(candidate.getTime()) ||
    candidate.getDate() !== day ||
    candidate.getMonth() !== month - 1 ||
    candidate.getFullYear() !== year
  ) {
    return null
  }

  return candidate
}

function parseDateInput(text: string): ParsedInputResult {
  const trimmed = text.trim()
  if (!trimmed) return { kind: "empty" }

  const normalizedText = trimmed.replace(/\/+$/, "")
  const parts = normalizedText.split("/").map((part) => part.trim())
  if (parts.length > 3 || parts.some((part) => !part || !/^\d+$/.test(part))) {
    return { kind: "invalid" }
  }

  const today = new Date()
  const day = Number(parts[0])
  const month = Number(parts[1] ?? today.getMonth() + 1)
  const year = Number(parts[2] ?? today.getFullYear())

  const parsedDate = buildDate(day, month, year)
  return parsedDate ? { kind: "valid", value: parsedDate } : { kind: "invalid" }
}

export default function CalendarDatePicker(props: CalendarDatePickerProps) {
  const {
    value,
    onChange,
    autoFocus = false,
    placeholder = "DD/MM/YYYY",
  } = props

  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(value ?? new Date()),
  )
  const [inputValue, setInputValue] = useState(() => formatInputValue(value))

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: "bottom-start",
    middleware: [offset(4), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  })

  const dismiss = useDismiss(context, { outsidePress: false })
  const role = useRole(context)
  const { getReferenceProps, getFloatingProps } = useInteractions([
    dismiss,
    role,
  ])

  useEffect(() => {
    if (isOpen) setVisibleMonth(startOfMonth(value ?? new Date()))
  }, [isOpen, value])

  useEffect(() => {
    if (!isEditing) setInputValue(formatInputValue(value))
  }, [isEditing, value])

  const weekdayLabels = useMemo(() => {
    const firstWeekday = startOfWeek(new Date(), {
      weekStartsOn: WEEK_STARTS_ON,
    })
    return Array.from({ length: 7 }, (_, index) =>
      format(addDays(firstWeekday, index), "EEE"),
    )
  }, [])

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(visibleMonth)
    const monthEnd = endOfMonth(visibleMonth)
    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: WEEK_STARTS_ON }),
      end: endOfWeek(monthEnd, { weekStartsOn: WEEK_STARTS_ON }),
    })
  }, [visibleMonth])

  const commitInputValue = (shouldClose = false) => {
    const parsedInput = parseDateInput(inputValue)

    if (parsedInput.kind === "empty") {
      onChange(null)
      setInputValue("")
      if (shouldClose) setIsOpen(false)
      return
    }

    if (parsedInput.kind === "invalid") {
      setInputValue(formatInputValue(value))
      return
    }

    onChange(parsedInput.value)
    setInputValue(formatInputValue(parsedInput.value))
    setVisibleMonth(startOfMonth(parsedInput.value))
    if (shouldClose) setIsOpen(false)
  }

  const updateSelectionFromInput = (nextInputValue: string) => {
    const parsedInput = parseDateInput(nextInputValue)

    if (parsedInput.kind === "valid") {
      onChange(parsedInput.value)
      setVisibleMonth(startOfMonth(parsedInput.value))
      return
    }

    if (parsedInput.kind === "empty") {
      onChange(null)
    }
  }

  const selectDate = (selectedDate: Date | null) => {
    setIsEditing(false)
    onChange(selectedDate)
    setInputValue(formatInputValue(selectedDate))
    if (selectedDate) setVisibleMonth(startOfMonth(selectedDate))
    inputRef.current?.blur()
    setIsOpen(false)
  }

  return (
    <>
      <div ref={refs.setReference}>
        <TextInput
          ref={inputRef}
          autoFocus={autoFocus}
          value={inputValue}
          placeholder={placeholder}
          {...getReferenceProps({
            "aria-label": value
              ? `Selected date ${formatInputValue(value)}`
              : "Select date",
            onFocus: () => {
              setIsEditing(true)
              setIsOpen(true)
            },
            onClick: () => setIsOpen(true),
            onChange: (event) => {
              const nextInputValue = (event.target as HTMLInputElement).value
              setInputValue(nextInputValue)
              updateSelectionFromInput(nextInputValue)
            },
            onBlur: (event) => {
              setIsEditing(false)
              commitInputValue()
              const nextFocus = event.relatedTarget as Node | null
              if (nextFocus === inputRef.current) return
              const floatingEl = refs.floating.current
              if (floatingEl && nextFocus && floatingEl.contains(nextFocus))
                return
              setIsOpen(false)
            },
            onKeyDown: (event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                setIsEditing(false)
                commitInputValue()
              }

              if (event.key === "Escape") {
                setIsEditing(false)
                setInputValue(formatInputValue(value))
                inputRef.current?.blur()
                setIsOpen(false)
              }
            },
          })}
        />
      </div>

      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className="z-[9999] w-[18rem]"
            {...getFloatingProps()}
          >
            <Card
              theme={{ root: { children: "p-3!" } }}
              className="border border-gray-200 shadow-lg dark:border-gray-700"
            >
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  tabIndex={-1}
                  className="flex items-center justify-center text-gray-900 transition-colors rounded-lg size-8 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                  onClick={() =>
                    setVisibleMonth((currentMonth) =>
                      subMonths(currentMonth, 1),
                    )
                  }
                  aria-label="Previous month"
                >
                  <FiChevronLeft />
                </button>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {format(visibleMonth, "MMMM yyyy")}
                </p>
                <button
                  type="button"
                  tabIndex={-1}
                  className="flex items-center justify-center text-gray-900 transition-colors rounded-lg size-8 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                  onClick={() =>
                    setVisibleMonth((currentMonth) =>
                      addMonths(currentMonth, 1),
                    )
                  }
                  aria-label="Next month"
                >
                  <FiChevronRight />
                </button>
              </div>

              <div className="grid grid-cols-7 mt-3 mb-1">
                {weekdayLabels.map((label) => (
                  <span
                    key={label}
                    className="text-sm font-semibold text-center text-gray-500 dark:text-gray-400"
                  >
                    {label}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-y-0.5">
                {calendarDays.map((day) => {
                  const isSelected = value ? isSameDay(day, value) : false
                  const isInVisibleMonth = isSameMonth(day, visibleMonth)
                  const isCurrentDay = isToday(day)

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      tabIndex={-1}
                      className={[
                        "flex items-center justify-center w-full h-9 text-base font-semibold rounded-lg transition-colors",
                        isSelected &&
                          "bg-cyan-700 text-white hover:bg-cyan-800 dark:bg-cyan-600 dark:hover:bg-cyan-500",
                        !isSelected &&
                          isCurrentDay &&
                          "bg-cyan-50 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-900/20 dark:text-cyan-300 dark:hover:bg-cyan-900/40",
                        !isSelected &&
                          !isCurrentDay &&
                          isInVisibleMonth &&
                          "text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700",
                        !isSelected &&
                          !isCurrentDay &&
                          !isInVisibleMonth &&
                          "text-gray-400 hover:bg-gray-100 dark:text-gray-500 dark:hover:bg-gray-700",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => selectDate(day)}
                      aria-label={format(day, "dd MMMM yyyy")}
                    >
                      {format(day, "d")}
                    </button>
                  )
                })}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <Button
                  type="button"
                  tabIndex={-1}
                  onClick={() => selectDate(new Date())}
                >
                  Today
                </Button>
                <Button
                  color="light"
                  type="button"
                  tabIndex={-1}
                  onClick={() => selectDate(null)}
                >
                  Clear
                </Button>
              </div>
            </Card>
          </div>
        </FloatingPortal>
      )}
    </>
  )
}
