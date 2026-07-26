import { VirtualItem, Virtualizer } from "@tanstack/react-virtual"
import { RefObject } from "react"
import { Transaction } from "../../API"
import TransactionCard from "./TransactionCard"

type ColorPair = { fill?: string; text?: string }

export type TransactionCardVirtualizer = Virtualizer<HTMLElement, Element>

type VirtualizedTransactionCardsProps = {
  virtualListStartRef: RefObject<HTMLDivElement>
  paddingTop: number
  paddingBottom: number
  virtualItems: VirtualItem[]
  transactions: Transaction[]
  virtualizer: TransactionCardVirtualizer
  accountColorMap: Record<string, ColorPair>
  categoryColorMap: Record<string, ColorPair>
  onEdit: (transactionId: string) => void
}

function Spacer({ height }: { height: number }) {
  if (height <= 0) return null
  return <div aria-hidden="true" style={{ height }} />
}

export default function VirtualizedTransactionCards(
  props: VirtualizedTransactionCardsProps,
) {
  const {
    virtualListStartRef,
    paddingTop,
    paddingBottom,
    virtualItems,
    transactions,
    virtualizer,
    accountColorMap,
    categoryColorMap,
    onEdit,
  } = props

  return (
    <div className="flex flex-col gap-3">
      <div ref={virtualListStartRef} aria-hidden="true" className="h-0" />
      <Spacer height={paddingTop} />
      {virtualItems.map((virtualRow) => {
        const transaction = transactions[virtualRow.index]

        return (
          <TransactionCard
            key={transaction.id}
            ref={virtualizer.measureElement}
            data-index={virtualRow.index}
            transaction={transaction}
            accountColorMap={accountColorMap}
            categoryColorMap={categoryColorMap}
            onEdit={onEdit}
          />
        )
      })}
      <Spacer height={paddingBottom} />
    </div>
  )
}
