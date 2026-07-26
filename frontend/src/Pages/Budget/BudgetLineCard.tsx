import { Button } from "flowbite-react"
import { format, parseISO } from "date-fns"
import { type MouseEvent as ReactMouseEvent } from "react"
import { FiChevronDown, FiChevronRight } from "react-icons/fi"
import { Category, Transaction } from "../../API"
import { formatCurrencyGBP } from "../../utils"
import ColoredBadge from "../../Components/ColoredBadge"
import DataCard from "../../Components/DataCard"
import TruncatedText from "../../Components/TruncatedText"
import { VarianceCell } from "./ActualDisplay"

type ColorPair = { fill?: string; text?: string }

type BudgetLineCardProps = {
  description: string
  category?: Category
  categoryColorMap: Record<string, ColorPair>
  planned: number
  actual: number
  transactions: Transaction[]
  expanded: boolean
  onToggle: () => void
}

export default function BudgetLineCard({
  description,
  category,
  categoryColorMap,
  planned,
  actual,
  transactions,
  expanded,
  onToggle,
}: BudgetLineCardProps) {
  const hasTransactions = transactions.length > 0

  return (
    <DataCard onClick={hasTransactions ? onToggle : () => {}}>
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900 dark:text-white">
              <TruncatedText text={description} maxLength={60} />
            </p>
            <div className="mt-2">
              <ColoredBadge
                label={category?.name ?? "Uncategorised"}
                colorMap={categoryColorMap}
                colorKey={category?.id ?? "uncategorised"}
              />
            </div>
          </div>
          {hasTransactions ? (
            <Button
              className="size-8 shrink-0 p-0"
              color="light"
              aria-expanded={expanded}
              aria-label={expanded ? "Hide transactions" : "Show transactions"}
              onClick={(e: ReactMouseEvent<HTMLButtonElement>) => {
                e.stopPropagation()
                onToggle()
              }}
            >
              {expanded ? <FiChevronDown /> : <FiChevronRight />}
            </Button>
          ) : null}
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Planned</p>
            <p className="font-medium">{formatCurrencyGBP(planned)}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Actual</p>
            <p className="font-medium">{formatCurrencyGBP(actual)}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Variance</p>
            <p className="font-medium">
              <VarianceCell planned={planned} actual={actual} />
            </p>
          </div>
        </div>

        {expanded && hasTransactions && (
          <ul className="flex flex-col gap-2 border-t border-gray-200 pt-3 dark:border-gray-700">
            {transactions.map((transaction) => (
              <li
                key={transaction.id}
                className="flex items-start justify-between gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <span>
                  <span className="text-gray-400">
                    {format(parseISO(transaction.date), "d MMM")} —{" "}
                  </span>
                  <TruncatedText text={transaction.description} />
                </span>
                <span className="shrink-0">
                  {formatCurrencyGBP(Math.abs(transaction.amount))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DataCard>
  )
}
