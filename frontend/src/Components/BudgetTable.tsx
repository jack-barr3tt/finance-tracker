import {
  Badge,
  Button,
  Table,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Tooltip,
} from "flowbite-react"
import { FiEdit, FiPlus, FiTrash } from "react-icons/fi"
import EditBudgetTransactionRow from "../Pages/Budget/EditBudgetTransactionRow"
import TableBodyWithButton from "./TableBodyWithButton"
import { BudgetTransaction } from "../API/requests"
import {
  formatSegmentDateRange,
  isSegmentActiveToday,
} from "../budget/plannedAmount"
import { formatRepeat, toMonthlyAmount, formatCurrencyGBP } from "../utils"

type BudgetTableProps = {
  budgetTransactions: BudgetTransaction[]
  categoryColorMap: Record<string, { fill: string; text: string }>
  showAdd: boolean
  editingBudgetTransactionId: string | undefined
  onShowAddChange: (show: boolean) => void
  onEditChange: (id: string | undefined) => void
  onDelete: (id: string) => void
  isOutgoings?: boolean
}

export default function BudgetTable(props: BudgetTableProps) {
  const {
    budgetTransactions,
    categoryColorMap,
    showAdd,
    editingBudgetTransactionId,
    onShowAddChange,
    onEditChange,
    onDelete,
    isOutgoings = false,
  } = props

  const activeBudgetTransactions = budgetTransactions
    .filter((bt) => !bt.deleted_at && isSegmentActiveToday(bt))
    .sort((a, b) => {
      const categoryA = a.category?.name || "Uncategorised"
      const categoryB = b.category?.name || "Uncategorised"
      const categoryComparison = categoryA.localeCompare(categoryB)

      if (categoryComparison !== 0) {
        return categoryComparison
      }

      const monthlyA = toMonthlyAmount(a.amount, a.repeat_every, a.repeat_until)
      const monthlyB = toMonthlyAmount(b.amount, b.repeat_every, b.repeat_until)
      return monthlyB - monthlyA
    })

  return (
    <div className="-mx-8 md:mx-0">
      <Table
        striped
        theme={{
          root: {
            wrapper: "overflow-x-auto md:rounded-md custom-scrollbar",
          },
          body: {
            cell: {
              base: "px-3 py-2 md:px-6 md:py-4",
            },
          },
          head: {
            cell: { base: "px-3 py-2 md:px-6 md:py-4" },
          },
        }}
      >
        <TableHead>
          <TableRow>
            <TableHeadCell>Category</TableHeadCell>
            <TableHeadCell>Description</TableHeadCell>
            <TableHeadCell>Amount</TableHeadCell>
            <TableHeadCell>Frequency</TableHeadCell>
            <TableHeadCell>Period</TableHeadCell>
            <TableHeadCell>
              <span className="sr-only">Edit</span>
            </TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBodyWithButton
          button={
            !showAdd ? (
              <Button
                className="p-0 shadow-md size-8"
                color="light"
                onClick={() => onShowAddChange(true)}
              >
                <FiPlus />
              </Button>
            ) : null
          }
        >
          {showAdd && (
            <EditBudgetTransactionRow
              cancelCallback={() => onShowAddChange(false)}
              isOutgoings={isOutgoings}
            />
          )}
          {!activeBudgetTransactions || activeBudgetTransactions.length === 0
            ? !showAdd && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No budget transactions found
                  </TableCell>
                </TableRow>
              )
            : activeBudgetTransactions?.map((budgetTransaction) =>
                editingBudgetTransactionId == budgetTransaction.id ? (
                  <EditBudgetTransactionRow
                    key={budgetTransaction.id}
                    budgetTransactionId={budgetTransaction.id}
                    cancelCallback={() => onEditChange(undefined)}
                    isOutgoings={isOutgoings}
                  />
                ) : (
                  <TableRow
                    key={budgetTransaction.id}
                    className="group/budgetrow"
                  >
                    <TableCell theme={{ base: "max-sm:p-0" }}>
                      <div className="flex items-center">
                        <Badge
                          style={{
                            backgroundColor:
                              categoryColorMap[
                                budgetTransaction.category?.id ||
                                  "uncategorised"
                              ]?.fill,
                            color:
                              categoryColorMap[
                                budgetTransaction.category?.id ||
                                  "uncategorised"
                              ]?.text,
                          }}
                          className="w-8 h-8 -mx-2 md:h-5 md:w-fit"
                        >
                          <span className="hidden md:block">
                            {budgetTransaction.category?.name ||
                              "Uncategorised"}
                          </span>
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {budgetTransaction.description ? (
                        <>
                          <span className="hidden xl:block">
                            {budgetTransaction.description}
                          </span>
                          <span className="xl:hidden">
                            {budgetTransaction.description.length > 30 ? (
                              <Tooltip
                                content={budgetTransaction.description}
                                placement="top"
                              >
                                {budgetTransaction.description.slice(0, 30)}...
                              </Tooltip>
                            ) : (
                              budgetTransaction.description
                            )}
                          </span>
                        </>
                      ) : (
                        <span className="italic text-gray-400">
                          No description
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatCurrencyGBP(
                        isOutgoings
                          ? Math.abs(budgetTransaction.amount)
                          : budgetTransaction.amount,
                      )}
                    </TableCell>
                    <TableCell>
                      {formatRepeat(
                        budgetTransaction.repeat_every,
                        budgetTransaction.repeat_until,
                      )}
                    </TableCell>
                    <TableCell>
                      {formatSegmentDateRange(
                        budgetTransaction.starts_on,
                        budgetTransaction.ends_on,
                      )}
                    </TableCell>
                    <TableCell className="p-0 px-[18px] py-[10px]">
                      <div className="flex flex-row items-center justify-end invisible gap-2 group-hover/budgetrow:visible">
                        <Button
                          className="p-0 size-8"
                          color="light"
                          onClick={() => onEditChange(budgetTransaction.id)}
                        >
                          <FiEdit />
                        </Button>
                        <Button
                          className="p-0 size-8"
                          color="light"
                          onClick={() => onDelete(budgetTransaction.id)}
                        >
                          <FiTrash />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ),
              )}
        </TableBodyWithButton>
      </Table>
    </div>
  )
}
