import { Dropdown, DropdownHeader, DropdownItem, Radio, TextInput } from "flowbite-react"
import { Dispatch, SetStateAction, useMemo, useState } from "react"

type SearchSelectProps = {
  id?: string
  value: string | undefined
  placeholder?: string
  onValueChange: Dispatch<SetStateAction<string | undefined>>
  onSearchChange: Dispatch<SetStateAction<string | undefined>>
  getValueText?: (value: string | undefined) => string
  options: { label: string; value: string }[]
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
  } = props

  const [search, setSearch] = useState("")

  const chosenOption = useMemo(() => options.find((o) => o.value === selected), [options, selected])

  return (
    <Dropdown
      enableTypeAhead={false}
      dismissOnClick={false}
      renderTrigger={() => (
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
    >
      <DropdownHeader className="flex flex-row items-center w-full gap-2">
        <TextInput
          className="flex-1"
          id={id}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            onSearchChange(e.target.value)
          }}
        />
      </DropdownHeader>
      {options.map(({ value, label }) => (
        <DropdownItem
          key={value}
          onClick={() => onValueChange(value)}
          className="flex flex-row items-center gap-2"
        >
          <Radio readOnly checked={selected === value} />
          {label}
        </DropdownItem>
      ))}
    </Dropdown>
  )
}
