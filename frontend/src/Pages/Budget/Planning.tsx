import { HR } from "flowbite-react"
import { useUser } from "../../Hooks/useUser"
import {
  useDeleteUserByIdBudgetTransactionsByBudgetTransactionId,
  useDeleteUserByIdCategoryBudgetsByCategoryBudgetId,
  UseGetUserByIdBudgetTransactionsKeyFn,
  UseGetUserByIdBudgetTransactionsByBudgetTransactionIdKeyFn,
  UseGetUserByIdCategoryBudgetsKeyFn,
  UseGetUserByIdCategoryBudgetsByCategoryBudgetIdKeyFn,
} from "../../API/queries"
import { useCallback, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useData } from "../../Hooks/useData"
import BudgetTable from "../../Components/BudgetTable"
import CategoryBudgetTable from "../../Components/CategoryBudgetTable"
import BudgetPie from "../../Components/BudgetPie"

export default function BudgetPlanning() {
  const { userId } = useUser()
  const { budgetTransactions, categoryBudgets, categoryColorMap } = useData()
  const queryClient = useQueryClient()

  const { mutateAsync: deleteBudgetTransaction } =
    useDeleteUserByIdBudgetTransactionsByBudgetTransactionId()
  const { mutateAsync: deleteCategoryBudget } =
    useDeleteUserByIdCategoryBudgetsByCategoryBudgetId()

  const [showAddIncome, setShowAddIncome] = useState(false)
  const [showAddOutgoings, setShowAddOutgoings] = useState(false)
  const [showAddCategoryBudget, setShowAddCategoryBudget] = useState(false)
  const [editingBudgetTransactionId, setEditingBudgetTransactionId] = useState<
    string | undefined
  >(undefined)
  const [editingCategoryBudgetId, setEditingCategoryBudgetId] = useState<
    string | undefined
  >(undefined)

  const { income, outgoings } = useMemo(() => {
    if (!budgetTransactions) return { income: [], outgoings: [] }
    const incomeTransactions = budgetTransactions.filter((bt) => bt.amount > 0)
    const outgoingTransactions = budgetTransactions.filter(
      (bt) => bt.amount < 0,
    )
    return {
      income: incomeTransactions,
      outgoings: outgoingTransactions,
    }
  }, [budgetTransactions])

  const handleDelete = useCallback(
    async (budgetTransactionId: string) => {
      await deleteBudgetTransaction({
        path: { id: userId, budget_transaction_id: budgetTransactionId },
      })
      if (editingBudgetTransactionId === budgetTransactionId)
        setEditingBudgetTransactionId(undefined)
      queryClient.invalidateQueries({
        queryKey: UseGetUserByIdBudgetTransactionsKeyFn({
          path: { id: userId },
        }),
      })
      queryClient.invalidateQueries({
        queryKey: UseGetUserByIdBudgetTransactionsByBudgetTransactionIdKeyFn({
          path: { id: userId, budget_transaction_id: budgetTransactionId },
        }),
      })
    },
    [deleteBudgetTransaction, userId, editingBudgetTransactionId, queryClient],
  )

  const handleDeleteCategoryBudget = useCallback(
    async (categoryBudgetId: string) => {
      await deleteCategoryBudget({
        path: { id: userId, category_budget_id: categoryBudgetId },
      })
      if (editingCategoryBudgetId === categoryBudgetId)
        setEditingCategoryBudgetId(undefined)
      queryClient.invalidateQueries({
        queryKey: UseGetUserByIdCategoryBudgetsKeyFn({ path: { id: userId } }),
      })
      queryClient.invalidateQueries({
        queryKey: UseGetUserByIdCategoryBudgetsByCategoryBudgetIdKeyFn({
          path: { id: userId, category_budget_id: categoryBudgetId },
        }),
      })
    },
    [deleteCategoryBudget, userId, editingCategoryBudgetId, queryClient],
  )

  return (
    <div className="flex flex-col gap-2 px-8 pb-8 md:gap-4 md:px-16 md:pb-16">
      <h1 className="text-3xl font-bold">Budget planning</h1>

      <HR />

      <div className="flex flex-col gap-8 2xl:flex-row">
        <div className="2xl:w-1/2">
          <BudgetPie
            budgetTransactions={budgetTransactions || []}
            categoryBudgets={categoryBudgets || []}
            categoryColorMap={categoryColorMap}
          />
        </div>

        <div className="flex flex-col gap-8 2xl:w-1/2">
          <div>
            <div className="mb-2 flex flex-row items-center justify-between md:mb-4">
              <h2 className="text-2xl font-medium">Income</h2>
            </div>
            <BudgetTable
              budgetTransactions={income}
              categoryColorMap={categoryColorMap}
              showAdd={showAddIncome}
              editingBudgetTransactionId={editingBudgetTransactionId}
              onShowAddChange={setShowAddIncome}
              onEditChange={setEditingBudgetTransactionId}
              onDelete={handleDelete}
            />
          </div>

          <div>
            <div className="mb-2 flex flex-row items-center justify-between md:mb-4">
              <h2 className="text-2xl font-medium">Outgoings</h2>
            </div>
            <BudgetTable
              budgetTransactions={outgoings}
              categoryColorMap={categoryColorMap}
              showAdd={showAddOutgoings}
              editingBudgetTransactionId={editingBudgetTransactionId}
              onShowAddChange={setShowAddOutgoings}
              onEditChange={setEditingBudgetTransactionId}
              onDelete={handleDelete}
              isOutgoings={true}
            />
          </div>

          <div>
            <div className="mb-2 flex flex-row items-center justify-between md:mb-4">
              <h2 className="text-2xl font-medium">Category budgets</h2>
            </div>
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400 md:mb-4">
              Set spending limits for variable costs in a category. These are
              shown in addition to specific budget lines above.
            </p>
            <CategoryBudgetTable
              categoryBudgets={categoryBudgets || []}
              categoryColorMap={categoryColorMap}
              showAdd={showAddCategoryBudget}
              editingCategoryBudgetId={editingCategoryBudgetId}
              onShowAddChange={setShowAddCategoryBudget}
              onEditChange={setEditingCategoryBudgetId}
              onDelete={handleDeleteCategoryBudget}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
