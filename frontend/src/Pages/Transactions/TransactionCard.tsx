import { format, parseISO } from "date-fns"
import { Ref } from "react"
import { Transaction } from "../../API"
import { formatCurrencyGBP } from "../../utils"
import ColoredBadge from "../../Components/ColoredBadge"
import DataCard from "../../Components/DataCard"

type ColorPair = { fill?: string; text?: string }

type TransactionCardProps = {
  ref?: Ref<HTMLDivElement>
  transaction: Transaction
  accountColorMap: Record<string, ColorPair>
  categoryColorMap: Record<string, ColorPair>
  onEdit: (transactionId: string) => void
  "data-index"?: number
}

export default function TransactionCard({
  ref,
  transaction,
  accountColorMap,
  categoryColorMap,
  onEdit,
  ...rest
}: TransactionCardProps) {
  return (
    <DataCard ref={ref} onClick={() => onEdit(transaction.id)} {...rest}>
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {format(parseISO(transaction.date), "dd MMM yyyy")}
          </span>
          <span className="shrink-0 font-medium text-gray-900 dark:text-white">
            {formatCurrencyGBP(transaction.amount)}
          </span>
        </div>

        <p className="font-medium text-gray-900 dark:text-white">
          {transaction.description}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <ColoredBadge
            label={transaction.account.name}
            colorMap={accountColorMap}
            colorKey={transaction.account.id}
          />
          <ColoredBadge
            label={transaction.category?.name || "Uncategorised"}
            colorMap={categoryColorMap}
            colorKey={transaction.category?.id || "uncategorised"}
          />
        </div>
      </div>
    </DataCard>
  )
}
