import { TableCell, TableRow } from "flowbite-react"
import { VirtualItem } from "@tanstack/react-virtual"
import { RefObject } from "react"
import { Transaction } from "../../API/requests"
import EditTransactionRow from "./EditTransactionRow"
import TransactionRow from "./TransactionRow"
import { TRANSACTION_TABLE_COLUMN_COUNT } from "./transactionTableColumns"
import { TransactionVirtualizer } from "./useVirtualizedTransactionList"

type ColorPair = { fill?: string; text?: string }

type VirtualizedTransactionRowsProps = {
  virtualListStartRef: RefObject<HTMLTableRowElement>
  paddingTop: number
  paddingBottom: number
  virtualItems: VirtualItem[]
  transactions: Transaction[]
  editingTransactionId?: string
  virtualizer: TransactionVirtualizer
  accountColorMap: Record<string, ColorPair>
  categoryColorMap: Record<string, ColorPair>
  onEdit: (transactionId: string) => void
  onDelete: (transactionId: string) => void
  onCancelEdit: () => void
}

function SpacerRow({ height }: { height: number }) {
  if (height <= 0) return null

  return (
    <TableRow aria-hidden="true">
      <TableCell
        colSpan={TRANSACTION_TABLE_COLUMN_COUNT}
        className="border-0 p-0"
        style={{ height }}
      />
    </TableRow>
  )
}

export default function VirtualizedTransactionRows(props: VirtualizedTransactionRowsProps) {
  const {
    virtualListStartRef,
    paddingTop,
    paddingBottom,
    virtualItems,
    transactions,
    editingTransactionId,
    virtualizer,
    accountColorMap,
    categoryColorMap,
    onEdit,
    onDelete,
    onCancelEdit,
  } = props

  return (
    <>
      <tr ref={virtualListStartRef} aria-hidden="true" className="h-0 border-0">
        <td colSpan={TRANSACTION_TABLE_COLUMN_COUNT} className="h-0 border-0 p-0" />
      </tr>
      <SpacerRow height={paddingTop} />
      {virtualItems.map((virtualRow) => {
        const transaction = transactions[virtualRow.index]
        const measureProps = {
          rowRef: virtualizer.measureElement,
          "data-index": virtualRow.index,
        }

        if (editingTransactionId === transaction.id) {
          return (
            <EditTransactionRow
              key={transaction.id}
              transactionId={transaction.id}
              cancelCallback={onCancelEdit}
              {...measureProps}
            />
          )
        }

        return (
          <TransactionRow
            key={transaction.id}
            ref={virtualizer.measureElement}
            data-index={virtualRow.index}
            transaction={transaction}
            accountColorMap={accountColorMap}
            categoryColorMap={categoryColorMap}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )
      })}
      <SpacerRow height={paddingBottom} />
    </>
  )
}
