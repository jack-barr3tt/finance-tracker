import { useQuery } from "@tanstack/react-query"
import { endOfMonth, format, startOfMonth } from "date-fns"
import {
  getUserByIdTransactions,
  Transaction,
  TransactionsResponse,
} from "../API/requests"
import { decryptTransaction } from "../Security/data"
import { useUser } from "./useUser"

const BUDGET_MONTH_TRANSACTIONS_KEY = "BudgetMonthTransactions"

async function fetchTransactionPage(
  userId: string,
  startDate: string,
  endDate: string,
  cursor: string,
): Promise<TransactionsResponse> {
  const response = await getUserByIdTransactions({
    path: { id: userId },
    query: {
      start_date: startDate,
      end_date: endDate,
      cursor,
      limit: 100,
    },
  })
  return response.data ?? { transactions: [] }
}

async function fetchAllMonthTransactions(
  userId: string,
  month: Date,
): Promise<Transaction[]> {
  const startDate = format(startOfMonth(month), "yyyy-MM-dd")
  const endDate = format(endOfMonth(month), "yyyy-MM-dd")

  const allTransactions: Transaction[] = []
  let cursor: string | undefined = "0"

  while (cursor) {
    const data = await fetchTransactionPage(userId, startDate, endDate, cursor)

    if (!data.transactions.length) break

    allTransactions.push(...data.transactions)
    cursor = data.cursor
  }

  return allTransactions
}

export function useBudgetMonthTransactions(month: Date) {
  const { userId, decrypt } = useUser()
  const monthKey = format(startOfMonth(month), "yyyy-MM")

  const query = useQuery({
    queryKey: [BUDGET_MONTH_TRANSACTIONS_KEY, userId, monthKey],
    queryFn: async () => {
      const encTransactions = await fetchAllMonthTransactions(userId, month)
      return Promise.all(
        encTransactions.map((t) => decryptTransaction(t, decrypt)),
      )
    },
    enabled: !!userId,
  })

  return {
    transactions: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
