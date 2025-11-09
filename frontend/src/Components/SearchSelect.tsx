import { Radio, TextInput } from "flowbite-react"
import { Dispatch, SetStateAction, useMemo, useState, ReactNode } from "react"
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  FloatingFocusManager,
} from "@floating-ui/react"

type SearchSelectProps = {
  id?: string
  value: string | undefined
  placeholder?: string
  onValueChange: Dispatch<SetStateAction<string | undefined>>
  onSearchChange: Dispatch<SetStateAction<string | undefined>>
  getValueText?: (value: string | undefined) => string
  options: { label: string; value: string }[]
  customTrigger?: ReactNode
  showSearch?: boolean
  allowDeselect?: boolean
}

export default function SearchSelect(props: SearchSelectProps) {
  const {
    id,
    value: selected,
    placeholder,
    onValueChange,
    onSearchChange,
    getValueText,
    options,
    customTrigger,
    showSearch = true,
    allowDeselect = false,
  } = props

  const [search, setSearch] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset(4), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
    placement: "bottom-start",
  })

  const click = useClick(context)
  const dismiss = useDismiss(context)
  const role = useRole(context)

  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role])

  const chosenOption = useMemo(() => options.find((o) => o.value === selected), [options, selected])

  return (
    <>
      <div ref={refs.setReference} {...getReferenceProps()}>
        {customTrigger || (
          <TextInput
            readOnly
            value={
              (selected && getValueText ? getValueText(selected) : undefined) ||
              chosenOption?.label ||
              placeholder ||
              "Select"
            }
          />
        )}
      </div>
      {isOpen && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              className="bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 max-h-64 overflow-y-auto z-[9999]"
            >
              {showSearch && (
                <div className="p-2">
                  <TextInput
                    id={id}
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      onSearchChange(e.target.value)
                    }}
                    placeholder="Search..."
                  />
                </div>
              )}
              <div className="py-1">
                {options.map(({ value, label }) => (
                  <div
                    key={value}
                    onClick={() => {
                      // Toggle behavior: if clicking the selected value and allowDeselect is true, clear it
                      if (allowDeselect && selected === value) {
                        onValueChange(undefined)
                      } else {
                        onValueChange(value)
                      }
                      setIsOpen(false)
                    }}
                    className="flex flex-row items-center gap-2 px-4 py-2 text-gray-900 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-white"
                  >
                    <Radio readOnly checked={selected === value} />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  )
}
