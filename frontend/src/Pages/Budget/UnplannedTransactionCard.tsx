import { Card } from "flowbite-react"
import { format, parseISO } from "date-fns"
import { Transaction } from "../../API"
import { formatCurrencyGBP } from "../../utils"
import ColoredBadge from "../../Components/ColoredBadge"
import TruncatedText from "../../Components/TruncatedText"

type ColorPair = { fill?: string; text?: string }

type UnplannedTransactionCardProps = {
  transaction: Transaction
  categoryColorMap: Record<string, ColorPair>
}

export default function UnplannedTransactionCard({
  transaction,
  categoryColorMap,
}: UnplannedTransactionCardProps) {
  return (
    <Card theme={{ root: { children: "p-4" } }}>
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {format(parseISO(transaction.date), "d MMM yyyy")}
          </span>
          <span className="shrink-0 font-medium text-gray-900 dark:text-white">
            {formatCurrencyGBP(Math.abs(transaction.amount))}
          </span>
        </div>

        <p className="font-medium text-gray-900 dark:text-white">
          <TruncatedText text={transaction.description} maxLength={60} />
        </p>

        <ColoredBadge
          label={transaction.category?.name ?? "Uncategorised"}
          colorMap={categoryColorMap}
          colorKey={transaction.category?.id ?? "uncategorised"}
        />
      </div>
    </Card>
  )
}
