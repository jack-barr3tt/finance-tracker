import {
  getGetUserIdBudgetTransactionsBudgetTransactionIdQueryKey,
  getGetUserIdBudgetTransactionsQueryKey,
  getGetUserIdCategoryBudgetsCategoryBudgetIdQueryKey,
  getGetUserIdCategoryBudgetsQueryKey,
  useDeleteUserIdBudgetTransactionsBudgetTransactionId,
  useDeleteUserIdCategoryBudgetsCategoryBudgetId,
} from "../../API"
import { useCallback, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useData } from "../../Hooks/useData"
import { useUser } from "../../Hooks/useUser"
import BudgetTable from "../../Components/BudgetTable"
import CategoryBudgetTable from "../../Components/CategoryBudgetTable"
import BudgetPie from "../../Components/BudgetPie"
import Page from "../../Components/Page"

export default function BudgetPlanning() {
  const { userId } = useUser()
  const { budgetTransactions, categoryBudgets, categoryColorMap } = useData()
  const queryClient = useQueryClient()

  const { mutateAsync: deleteBudgetTransaction } =
    useDeleteUserIdBudgetTransactionsBudgetTransactionId()
  const { mutateAsync: deleteCategoryBudget } =
    useDeleteUserIdCategoryBudgetsCategoryBudgetId()

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
      await deleteBudgetTransaction({ id: userId, budgetTransactionId })
      if (editingBudgetTransactionId === budgetTransactionId)
        setEditingBudgetTransactionId(undefined)
      queryClient.invalidateQueries({
        queryKey: getGetUserIdBudgetTransactionsQueryKey(userId),
      })
      queryClient.invalidateQueries({
        queryKey: getGetUserIdBudgetTransactionsBudgetTransactionIdQueryKey(
          userId,
          budgetTransactionId,
        ),
      })
    },
    [deleteBudgetTransaction, userId, editingBudgetTransactionId, queryClient],
  )

  const handleDeleteCategoryBudget = useCallback(
    async (categoryBudgetId: string) => {
      await deleteCategoryBudget({ id: userId, categoryBudgetId })
      if (editingCategoryBudgetId === categoryBudgetId)
        setEditingCategoryBudgetId(undefined)
      queryClient.invalidateQueries({
        queryKey: getGetUserIdCategoryBudgetsQueryKey(userId),
      })
      queryClient.invalidateQueries({
        queryKey: getGetUserIdCategoryBudgetsCategoryBudgetIdQueryKey(
          userId,
          categoryBudgetId,
        ),
      })
    },
    [deleteCategoryBudget, userId, editingCategoryBudgetId, queryClient],
  )

  return (
    <Page title="Budget planning">
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
    </Page>
  )
}
