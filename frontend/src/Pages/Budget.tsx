import { HR } from "flowbite-react"
import { useUser } from "../Hooks/useUser"
import {
  useDeleteUserByIdBudgetTransactionsByBudgetTransactionId,
  UseGetUserByIdBudgetTransactionsKeyFn,
  UseGetUserByIdBudgetTransactionsByBudgetTransactionIdKeyFn,
} from "../API/queries"
import { useCallback, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useData } from "../Hooks/useData"
import BudgetTable from "../Components/BudgetTable"
import BudgetPie from "../Components/BudgetPie"

export default function Budget() {
  const { userId } = useUser()
  const { budgetTransactions, categoryColorMap } = useData()
  const queryClient = useQueryClient()

  const { mutateAsync: deleteBudgetTransaction } =
    useDeleteUserByIdBudgetTransactionsByBudgetTransactionId()

  const [showAddIncome, setShowAddIncome] = useState(false)
  const [showAddOutgoings, setShowAddOutgoings] = useState(false)
  const [editingBudgetTransactionId, setEditingBudgetTransactionId] = useState<string | undefined>(
    undefined
  )

  const { income, outgoings } = useMemo(() => {
    if (!budgetTransactions) return { income: [], outgoings: [] }
    const incomeTransactions = budgetTransactions.filter((bt) => bt.amount > 0)
    const outgoingTransactions = budgetTransactions.filter((bt) => bt.amount < 0)
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
        queryKey: UseGetUserByIdBudgetTransactionsKeyFn({ path: { id: userId } }),
      })
      queryClient.invalidateQueries({
        queryKey: UseGetUserByIdBudgetTransactionsByBudgetTransactionIdKeyFn({
          path: { id: userId, budget_transaction_id: budgetTransactionId },
        }),
      })
    },
    [deleteBudgetTransaction, userId, editingBudgetTransactionId, queryClient]
  )

  return (
    <div className="flex flex-col gap-2 px-8 pb-8 md:gap-4 md:pb-16 md:px-16">
      <h1 className="text-3xl font-bold">Budget</h1>

      <HR />

      <BudgetPie
        budgetTransactions={budgetTransactions || []}
        categoryColorMap={categoryColorMap}
      />

      <div className="flex flex-col gap-8">
        <div>
          <div className="flex flex-row items-center justify-between mb-2 md:mb-4">
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
          <div className="flex flex-row items-center justify-between mb-2 md:mb-4">
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
          />
        </div>
      </div>
    </div>
  )
}
