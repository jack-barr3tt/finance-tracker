import { TextInput } from "flowbite-react"

type BudgetPeriodFieldsProps = {
  isEditMode: boolean
  startsOn: string
  endsOn: string
  effectiveFrom: string
  onStartsOnChange: (value: string) => void
  onEndsOnChange: (value: string) => void
  onEffectiveFromChange: (value: string) => void
  layout?: "row" | "stacked"
}

export default function BudgetPeriodFields({
  isEditMode,
  startsOn,
  endsOn,
  effectiveFrom,
  onStartsOnChange,
  onEndsOnChange,
  onEffectiveFromChange,
  layout = "row",
}: BudgetPeriodFieldsProps) {
  const containerClass =
    layout === "row" ? "flex flex-col gap-1" : "flex flex-col gap-2"

  return (
    <div className={containerClass}>
      {isEditMode ? (
        <>
          <TextInput
            type="date"
            title="Effective from"
            value={effectiveFrom}
            onChange={(e) => onEffectiveFromChange(e.target.value)}
          />
          <TextInput
            type="date"
            title="Ends on (optional)"
            value={endsOn}
            onChange={(e) => onEndsOnChange(e.target.value)}
          />
        </>
      ) : (
        <>
          <TextInput
            type="date"
            title="Starts on"
            value={startsOn}
            onChange={(e) => onStartsOnChange(e.target.value)}
          />
          <TextInput
            type="date"
            title="Ends on (optional)"
            value={endsOn}
            onChange={(e) => onEndsOnChange(e.target.value)}
          />
        </>
      )}
    </div>
  )
}
