import {
  Button,
  Table,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "flowbite-react"
import { FiEdit, FiPlus, FiTrash } from "react-icons/fi"
import EditBudgetTransactionRow from "../Pages/Budget/EditBudgetTransactionRow"
import BudgetTransactionCard from "../Pages/Budget/BudgetTransactionCard"
import BudgetTransactionEditModal from "../Pages/Budget/BudgetTransactionEditModal"
import TableBodyWithButton from "./TableBodyWithButton"
import ColoredBadge from "./ColoredBadge"
import TruncatedText from "./TruncatedText"
import { BudgetTransaction } from "../API"
import {
  formatSegmentDateRange,
  isSegmentActiveToday,
} from "../budget/plannedAmount"
import { formatRepeat, toMonthlyAmount, formatCurrencyGBP } from "../utils"
import { useMediaQuery } from "../Hooks/useMediaQuery"

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

const tableTheme = {
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

  const isDesktop = useMediaQuery("(min-width: 768px)")

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

  const closeModal = () => {
    onShowAddChange(false)
    onEditChange(undefined)
  }

  const isEditingInThisTable =
    !!editingBudgetTransactionId &&
    activeBudgetTransactions.some((bt) => bt.id === editingBudgetTransactionId)

  if (!isDesktop) {
    return (
      <>
        {(showAdd || isEditingInThisTable) && (
          <BudgetTransactionEditModal
            show
            budgetTransactionId={editingBudgetTransactionId}
            isOutgoings={isOutgoings}
            onClose={closeModal}
            onDelete={
              editingBudgetTransactionId
                ? () => onDelete(editingBudgetTransactionId)
                : undefined
            }
          />
        )}

        <div className="flex flex-col gap-3">
          {activeBudgetTransactions.length === 0 && !showAdd ? (
            <p className="text-center text-gray-500 dark:text-gray-400">
              No budget transactions found
            </p>
          ) : (
            activeBudgetTransactions.map((budgetTransaction) => (
              <BudgetTransactionCard
                key={budgetTransaction.id}
                budgetTransaction={budgetTransaction}
                categoryColorMap={categoryColorMap}
                isOutgoings={isOutgoings}
                onEdit={onEditChange}
              />
            ))
          )}
        </div>

        {!showAdd && (
          <div className="mt-3 flex justify-center">
            <Button
              className="size-8 p-0"
              color="light"
              aria-label="Add budget line"
              onClick={() => onShowAddChange(true)}
            >
              <FiPlus />
            </Button>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="-mx-4 md:mx-0">
      <Table striped theme={tableTheme}>
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
                        <ColoredBadge
                          label={
                            budgetTransaction.category?.name || "Uncategorised"
                          }
                          colorMap={categoryColorMap}
                          colorKey={
                            budgetTransaction.category?.id || "uncategorised"
                          }
                          className="w-8 h-8 -mx-2 md:h-5 md:w-fit"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <TruncatedText
                        text={budgetTransaction.description ?? ""}
                      />
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
