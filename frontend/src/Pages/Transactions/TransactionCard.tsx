import { Badge, Card } from "flowbite-react"
import { format, parseISO } from "date-fns"
import { forwardRef, memo } from "react"
import { Transaction } from "../../API"
import { formatCurrencyGBP } from "../../utils"

type ColorPair = { fill?: string; text?: string }

type TransactionCardProps = {
  transaction: Transaction
  accountColorMap: Record<string, ColorPair>
  categoryColorMap: Record<string, ColorPair>
  onEdit: (transactionId: string) => void
  "data-index"?: number
}

const TransactionCard = memo(
  forwardRef<HTMLDivElement, TransactionCardProps>(function TransactionCard(
    { transaction, accountColorMap, categoryColorMap, onEdit, ...rest },
    ref,
  ) {
    return (
      <Card
        ref={ref}
        role="button"
        tabIndex={0}
        theme={{ root: { children: "p-4" } }}
        className="cursor-pointer bg-white transition-colors hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700/50"
        onClick={() => onEdit(transaction.id)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            onEdit(transaction.id)
          }
        }}
        {...rest}
      >
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
            <Badge
              style={{
                backgroundColor: accountColorMap[transaction.account.id]?.fill,
                color: accountColorMap[transaction.account.id]?.text,
              }}
            >
              {transaction.account.name}
            </Badge>
            <Badge
              style={{
                backgroundColor:
                  categoryColorMap[transaction.category?.id || "uncategorised"]
                    ?.fill,
                color:
                  categoryColorMap[transaction.category?.id || "uncategorised"]
                    ?.text,
              }}
            >
              {transaction.category?.name || "Uncategorised"}
            </Badge>
          </div>
        </div>
      </Card>
    )
  }),
)

export default TransactionCard
