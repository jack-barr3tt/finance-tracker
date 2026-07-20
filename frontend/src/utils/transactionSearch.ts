import { Transaction } from "../API/requests"
import { formatCurrencyGBP } from "../utils"

export function transactionMatchesSearch(
  transaction: Transaction,
  query: string,
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  if (transaction.description.toLowerCase().includes(q)) return true

  const amountStr = transaction.amount.toString()
  const absAmountStr = Math.abs(transaction.amount).toFixed(2)
  const formattedAmount = formatCurrencyGBP(transaction.amount)
    .replace(/[£,\s]/g, "")
    .toLowerCase()

  const normalizedQuery = q.replace(/[£,\s]/g, "")

  return (
    amountStr.includes(normalizedQuery) ||
    absAmountStr.includes(normalizedQuery) ||
    formattedAmount.includes(normalizedQuery)
  )
}
