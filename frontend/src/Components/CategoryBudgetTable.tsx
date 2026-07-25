import {
  Badge,
  Button,
  Table,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "flowbite-react"
import { FiEdit, FiPlus, FiTrash } from "react-icons/fi"
import EditCategoryBudgetRow from "../Pages/Budget/EditCategoryBudgetRow"
import TableBodyWithButton from "./TableBodyWithButton"
import { CategoryBudget } from "../API"
import {
  formatSegmentDateRange,
  isSegmentActiveToday,
} from "../budget/plannedAmount"
import { formatCurrencyGBP, formatRepeat, toMonthlyAmount } from "../utils"

type CategoryBudgetTableProps = {
  categoryBudgets: CategoryBudget[]
  categoryColorMap: Record<string, { fill: string; text: string }>
  showAdd: boolean
  editingCategoryBudgetId: string | undefined
  onShowAddChange: (show: boolean) => void
  onEditChange: (id: string | undefined) => void
  onDelete: (id: string) => void
}

export default function CategoryBudgetTable(props: CategoryBudgetTableProps) {
  const {
    categoryBudgets,
    categoryColorMap,
    showAdd,
    editingCategoryBudgetId,
    onShowAddChange,
    onEditChange,
    onDelete,
  } = props

  const activeCategoryBudgets = categoryBudgets
    .filter((cb) => !cb.deleted_at && isSegmentActiveToday(cb))
    .sort((a, b) => {
      const categoryComparison = a.category.name.localeCompare(b.category.name)
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
            <TableHeadCell>Limit</TableHeadCell>
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
            <EditCategoryBudgetRow
              cancelCallback={() => onShowAddChange(false)}
              existingCategoryBudgets={categoryBudgets}
            />
          )}
          {!activeCategoryBudgets || activeCategoryBudgets.length === 0
            ? !showAdd && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No category budgets found
                  </TableCell>
                </TableRow>
              )
            : activeCategoryBudgets.map((categoryBudget) =>
                editingCategoryBudgetId === categoryBudget.id ? (
                  <EditCategoryBudgetRow
                    key={categoryBudget.id}
                    categoryBudgetId={categoryBudget.id}
                    cancelCallback={() => onEditChange(undefined)}
                    existingCategoryBudgets={categoryBudgets}
                  />
                ) : (
                  <TableRow key={categoryBudget.id} className="group/budgetrow">
                    <TableCell theme={{ base: "max-sm:p-0" }}>
                      <div className="flex items-center">
                        <Badge
                          style={{
                            backgroundColor:
                              categoryColorMap[categoryBudget.category.id]
                                ?.fill,
                            color:
                              categoryColorMap[categoryBudget.category.id]
                                ?.text,
                          }}
                          className="w-8 h-8 -mx-2 md:h-5 md:w-fit"
                        >
                          <span className="hidden md:block">
                            {categoryBudget.category.name}
                          </span>
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatCurrencyGBP(categoryBudget.amount)}
                    </TableCell>
                    <TableCell>
                      {formatRepeat(
                        categoryBudget.repeat_every,
                        categoryBudget.repeat_until,
                      )}
                    </TableCell>
                    <TableCell>
                      {formatSegmentDateRange(
                        categoryBudget.starts_on,
                        categoryBudget.ends_on,
                      )}
                    </TableCell>
                    <TableCell className="p-0 px-[18px] py-[10px]">
                      <div className="flex flex-row items-center justify-end invisible gap-2 group-hover/budgetrow:visible">
                        <Button
                          className="p-0 size-8"
                          color="light"
                          onClick={() => onEditChange(categoryBudget.id)}
                        >
                          <FiEdit />
                        </Button>
                        <Button
                          className="p-0 size-8"
                          color="light"
                          onClick={() => onDelete(categoryBudget.id)}
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
