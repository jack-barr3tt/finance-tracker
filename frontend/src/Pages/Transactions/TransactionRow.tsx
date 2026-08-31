import { Badge, Button, TableCell, TableRow, Tooltip } from "flowbite-react"
import { format, parseISO } from "date-fns"
import { memo, MouseEvent, Ref } from "react"
import { FiEdit, FiTrash } from "react-icons/fi"
import { Transaction } from "../../API"
import { formatCurrencyGBP } from "../../utils"
import { transactionTableCellClass } from "./transactionTableColumns"

type ColorPair = { fill?: string; text?: string }

type TransactionRowProps = {
  ref?: Ref<HTMLTableRowElement>
  transaction: Transaction
  accountColorMap: Record<string, ColorPair>
  categoryColorMap: Record<string, ColorPair>
  onEdit: (transactionId: string) => void
  onDelete: (
    transactionId: string,
    event: MouseEvent<HTMLButtonElement>,
  ) => void
  "data-index"?: number
}

function TransactionRow({
  ref,
  transaction,
  accountColorMap,
  categoryColorMap,
  onEdit,
  onDelete,
  ...rest
}: TransactionRowProps) {
  return (
    <TableRow ref={ref} className="group/trnscrow" {...rest}>
      <TableCell className={transactionTableCellClass.date}>
        {format(parseISO(transaction.date), "dd MMM yyyy")}
      </TableCell>
      <TableCell
        theme={{ base: "max-sm:p-0" }}
        className={transactionTableCellClass.account}
      >
        <div className="flex items-center">
          <Badge
            style={{
              backgroundColor: accountColorMap[transaction.account.id]?.fill,
              color: accountColorMap[transaction.account.id]?.text,
            }}
            className="w-8 h-8 -mx-2 md:h-5 md:w-fit"
          >
            <span className="hidden md:block">{transaction.account.name}</span>
          </Badge>
        </div>
      </TableCell>
      <TableCell
        theme={{ base: "max-sm:p-0" }}
        className={transactionTableCellClass.category}
      >
        <div className="flex items-center">
          <Badge
            style={{
              backgroundColor:
                categoryColorMap[transaction.category?.id || "uncategorised"]
                  ?.fill,
              color:
                categoryColorMap[transaction.category?.id || "uncategorised"]
                  ?.text,
            }}
            className="w-8 h-8 -mx-2 md:h-5 md:w-fit"
          >
            <span className="hidden md:block">
              {transaction.category?.name || "Uncategorised"}
            </span>
          </Badge>
        </div>
      </TableCell>
      <TableCell className={transactionTableCellClass.description}>
        <span className="hidden xl:block truncate">
          {transaction.description}
        </span>
        <span className="xl:hidden truncate">
          {transaction.description.length > 30 ? (
            <Tooltip content={transaction.description} placement="top">
              {transaction.description.slice(0, 30)}...
            </Tooltip>
          ) : (
            transaction.description
          )}
        </span>
      </TableCell>
      <TableCell className={transactionTableCellClass.amount}>
        {formatCurrencyGBP(transaction.amount)}
      </TableCell>
      <TableCell className={transactionTableCellClass.actions}>
        <div className="flex flex-row items-center justify-end invisible gap-2 group-hover/trnscrow:visible">
          <Button
            className="p-0 shrink-0 size-8"
            color="light"
            onClick={() => onEdit(transaction.id)}
          >
            <FiEdit />
          </Button>
          <Button
            className="p-0 shrink-0 size-8"
            color="light"
            onClick={(event: MouseEvent<HTMLButtonElement>) =>
              onDelete(transaction.id, event)
            }
          >
            <FiTrash />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export default memo(TransactionRow)
