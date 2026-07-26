import { TextInput } from "flowbite-react"
import { PeriodUnit } from "../API"
import SearchSelect from "./SearchSelect"

type BudgetRepeatFieldsProps = {
  repeatEvery: string
  repeatUntil: PeriodUnit
  onRepeatEveryChange: (value: string) => void
  onRepeatUntilChange: (value: PeriodUnit) => void
  onEnter?: () => void
  layout?: "row" | "stacked"
}

export default function BudgetRepeatFields({
  repeatEvery,
  repeatUntil,
  onRepeatEveryChange,
  onRepeatUntilChange,
  onEnter,
  layout = "row",
}: BudgetRepeatFieldsProps) {
  const containerClass =
    layout === "row" ? "flex flex-row gap-1" : "flex flex-col gap-2"

  return (
    <div className={containerClass}>
      <TextInput
        placeholder="Every"
        value={repeatEvery}
        onChange={(e) => onRepeatEveryChange(e.target.value)}
        onKeyUp={(e) => e.key === "Enter" && onEnter?.()}
        className={layout === "row" ? "flex-1" : undefined}
      />
      <SearchSelect
        value={repeatUntil}
        options={[
          { label: "Day(s)", value: "day" },
          { label: "Week(s)", value: "week" },
          { label: "Month(s)", value: "month" },
          { label: "Year(s)", value: "year" },
        ]}
        onValueChange={(value) => onRepeatUntilChange(value as PeriodUnit)}
        onSearchChange={() => {}}
        showSearch={false}
      />
    </div>
  )
}
