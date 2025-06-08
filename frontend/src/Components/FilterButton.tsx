import { Button, Dropdown, DropdownItem, Radio } from "flowbite-react"
import { Dispatch, SetStateAction } from "react"
import { FaFilter } from "react-icons/fa6"

type FilterButtonProps<T> = {
  options: { label: string; value: T }[]
  value: T | undefined
  onChange: Dispatch<SetStateAction<T | undefined>>
}

export default function FilterButton<T>(props: FilterButtonProps<T>) {
  const { options, value, onChange } = props

  return (
    <Dropdown
      renderTrigger={() => (
        <Button
          className="flex items-center justify-center p-1 ml-2 rounded-sm"
          color={value === undefined ? "dark" : undefined}
          theme={{
            color: { dark: "dark:hover:bg-gray-600 dark:bg-gray-700" },
            size: { md: "size-5" },
          }}
        >
          <FaFilter />
        </Button>
      )}
      className="dark:bg-gray-600"
      dismissOnClick={false}
    >
      {options.map((option) => (
        <DropdownItem
          key={option.value as string}
          onClick={() => onChange(value === option.value ? undefined : option.value)}
          className="font-normal"
        >
          <Radio checked={value === option.value} className="mr-2" />
          {option.label}
        </DropdownItem>
      ))}
    </Dropdown>
  )
}
