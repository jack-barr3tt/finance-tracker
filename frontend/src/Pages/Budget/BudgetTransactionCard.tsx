import { BudgetTransaction } from "../../API"
import { formatSegmentDateRange } from "../../budget/plannedAmount"
import { formatCurrencyGBP, formatRepeat } from "../../utils"
import ColoredBadge from "../../Components/ColoredBadge"
import DataCard from "../../Components/DataCard"
import TruncatedText from "../../Components/TruncatedText"

type ColorPair = { fill?: string; text?: string }

type BudgetTransactionCardProps = {
  budgetTransaction: BudgetTransaction
  categoryColorMap: Record<string, ColorPair>
  isOutgoings?: boolean
  onEdit: (id: string) => void
}

export default function BudgetTransactionCard({
  budgetTransaction,
  categoryColorMap,
  isOutgoings = false,
  onEdit,
}: BudgetTransactionCardProps) {
  const categoryId = budgetTransaction.category?.id || "uncategorised"
  const displayAmount = isOutgoings
    ? Math.abs(budgetTransaction.amount)
    : budgetTransaction.amount

  return (
    <DataCard onClick={() => onEdit(budgetTransaction.id)}>
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <ColoredBadge
            label={budgetTransaction.category?.name || "Uncategorised"}
            colorMap={categoryColorMap}
            colorKey={categoryId}
          />
          <span className="shrink-0 font-medium text-gray-900 dark:text-white">
            {formatCurrencyGBP(displayAmount)}
          </span>
        </div>

        <p className="font-medium text-gray-900 dark:text-white">
          <TruncatedText
            text={budgetTransaction.description ?? ""}
            maxLength={60}
          />
        </p>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
          <span>
            {formatRepeat(
              budgetTransaction.repeat_every,
              budgetTransaction.repeat_until,
            )}
          </span>
          <span>
            {formatSegmentDateRange(
              budgetTransaction.starts_on,
              budgetTransaction.ends_on,
            )}
          </span>
        </div>
      </div>
    </DataCard>
  )
}
