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
import { Button } from "flowbite-react"
import { useCallback, useEffect, useState } from "react"
import { SummaryInterval } from "../../API/requests"
import CalendarDatePicker from "../../Components/CalendarDatePicker"
import { SummaryRange } from "../../Hooks/useData"

type CustomSummaryRangeDropdownProps = {
  active: boolean
  value: SummaryRange
  onActivate: () => void
  onChange: (value: SummaryRange) => void
}

export default function CustomSummaryRangeDropdown(props: CustomSummaryRangeDropdownProps) {
  const { active, value, onActivate, onChange } = props
  const [isOpen, setIsOpen] = useState(false)

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: "bottom-start",
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  })
  const dismiss = useDismiss(context)
  const role = useRole(context)
  const { getReferenceProps, getFloatingProps } = useInteractions([dismiss, role])

  const setReference = useCallback(
    (node: HTMLButtonElement | null) => {
      refs.setReference(node)
    },
    [refs],
  )

  useEffect(() => {
    if (!active) setIsOpen(false)
  }, [active])

  const updateRange = (updates: Partial<SummaryRange>) => {
    onChange({
      ...value,
      ...updates,
    })
  }

  return (
    <>
      <Button
        color={active ? "blue" : "light"}
        ref={setReference}
        {...getReferenceProps({
          onClick: () => {
            if (!active) {
              onActivate()
              setIsOpen(true)
              return
            }

            setIsOpen((current) => !current)
          },
        })}
      >
        Custom
      </Button>

      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className="z-50 w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800"
            {...getFloatingProps()}
          >
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Start date
                </span>
                <CalendarDatePicker
                  value={value.startDate}
                  onChange={(startDate) => updateRange({ startDate })}
                  placeholder="Start date"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  End date
                </span>
                <CalendarDatePicker
                  value={value.endDate}
                  onChange={(endDate) => updateRange({ endDate })}
                  placeholder="End date"
                />
              </div>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Interval
                </span>
                <select
                  value={value.interval}
                  onChange={(event) =>
                    updateRange({ interval: event.target.value as SummaryInterval })
                  }
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-cyan-500 focus:ring-cyan-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-500"
                >
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                </select>
              </label>
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  )
}
