import { Button } from "flowbite-react"
import { Dispatch, SetStateAction } from "react"
import SearchSelect from "./SearchSelect"
import { FaFilter } from "react-icons/fa"

type FilterButtonProps<T extends string> = {
  selected: T | undefined
  options: { value: T; label: string }[]
  onValueChange: Dispatch<SetStateAction<T | undefined>>
}

export default function FilterButton<T extends string>(props: FilterButtonProps<T>) {
  const { selected, options, onValueChange } = props

  return (
    <SearchSelect
      value={selected}
      options={options}
      onValueChange={(value) => {
        onValueChange(value as T | undefined)
      }}
      onSearchChange={() => {}}
      showSearch={false}
      allowDeselect={true}
      customTrigger={
        <Button
          className="flex items-center justify-center p-1 ml-2 rounded-sm"
          color={selected === undefined ? "dark" : undefined}
          theme={{
            color: { dark: "dark:hover:bg-gray-600 dark:bg-gray-700" },
            size: { md: "size-5" },
          }}
        >
          <FaFilter />
        </Button>
      }
    />
  )
}
