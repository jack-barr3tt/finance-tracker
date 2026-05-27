import { Button } from "flowbite-react"
import { addMonths, format, startOfMonth, subMonths } from "date-fns"
import { FiChevronLeft, FiChevronRight } from "react-icons/fi"

type BudgetMonthPickerProps = {
  month: Date
  onMonthChange: (month: Date) => void
}

export default function BudgetMonthPicker(props: BudgetMonthPickerProps) {
  const { month, onMonthChange } = props

  return (
    <div className="flex items-center gap-2">
      <Button
        color="light"
        className="size-10 p-0"
        title="Previous month"
        aria-label="Previous month"
        onClick={() => onMonthChange(startOfMonth(subMonths(month, 1)))}
      >
        <FiChevronLeft />
      </Button>
      <span className="min-w-36 text-center text-lg font-medium">
        {format(month, "MMMM yyyy")}
      </span>
      <Button
        color="light"
        className="size-10 p-0"
        title="Next month"
        aria-label="Next month"
        onClick={() => onMonthChange(startOfMonth(addMonths(month, 1)))}
      >
        <FiChevronRight />
      </Button>
    </div>
  )
}
