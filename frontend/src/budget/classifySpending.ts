import { BudgetTransaction, Category, CategoryBudget, Transaction } from "../API/requests"
import { toMonthlyAmount } from "../utils"
import { addDays, format, parseISO } from "date-fns"

function normalizeDescription(description: string | undefined): string {
  return (description ?? "").trim()
}

type TransferTransaction = {
  id: string
  amount: number
  date: string
  accountId: string
}

export function excludeInterAccountTransfers(transactions: Transaction[]): Transaction[] {
  const transferIds = new Set<string>()
  const dateAmountMap = new Map<string, Map<number, TransferTransaction[]>>()

  for (const transaction of transactions) {
    const dateKey = format(parseISO(transaction.date), "yyyy-MM-dd")
    let amountMap = dateAmountMap.get(dateKey)
    if (!amountMap) {
      amountMap = new Map()
      dateAmountMap.set(dateKey, amountMap)
    }
    const bucket = amountMap.get(transaction.amount) ?? []
    bucket.push({
      id: transaction.id,
      amount: transaction.amount,
      date: transaction.date,
      accountId: transaction.account.id,
    })
    amountMap.set(transaction.amount, bucket)
  }

  for (const [dateKey, amountMap] of dateAmountMap) {
    const date = parseISO(dateKey)
    const checkDateKeys = [dateKey, format(addDays(date, 1), "yyyy-MM-dd")]

    for (const [amount, txns] of amountMap) {
      const transferAmount = -amount
      for (const checkDateKey of checkDateKeys) {
        const checkDayMap = dateAmountMap.get(checkDateKey)
        if (!checkDayMap) continue
        const transferTxns = checkDayMap.get(transferAmount)
        if (!transferTxns) continue

        for (const t1 of txns) {
          for (const t2 of transferTxns) {
            if (t1.accountId !== t2.accountId) {
              transferIds.add(t1.id)
              transferIds.add(t2.id)
            }
          }
        }
      }
    }
  }

  return transactions.filter((transaction) => !transferIds.has(transaction.id))
}

export type BudgetLineGroup = {
  budgetTransactionIds: string[]
  description: string
  category?: Category
  planned: number
  actual: number
  transactions: Transaction[]
}

export type CategoryBudgetGroup = {
  categoryBudget: CategoryBudget
  planned: number
  actual: number
  transactions: Transaction[]
}

export type UnplannedGroup = {
  transactions: Transaction[]
}

export type ClassifiedSpending = {
  budgetLines: BudgetLineGroup[]
  categories: CategoryBudgetGroup[]
  unplanned: UnplannedGroup
}

export function classifyBudgetSpending(
  transactions: Transaction[],
  budgetTransactions: BudgetTransaction[],
  categoryBudgets: CategoryBudget[],
): ClassifiedSpending {
  const spending = excludeInterAccountTransfers(transactions).filter((t) => t.amount < 0)

  const activeOutgoingBudgetLines = budgetTransactions.filter(
    (bt) => bt.amount < 0 && !bt.deleted_at,
  )
  const activeCategoryBudgets = categoryBudgets.filter((cb) => !cb.deleted_at)

  const budgetLineByDescription = new Map<string, BudgetTransaction[]>()
  for (const line of activeOutgoingBudgetLines) {
    const key = normalizeDescription(line.description)
    if (!key) continue
    const existing = budgetLineByDescription.get(key) ?? []
    existing.push(line)
    budgetLineByDescription.set(key, existing)
  }

  const budgetLineDescriptionKeys = new Set(budgetLineByDescription.keys())

  const categoryBudgetByCategoryId = new Map(
    activeCategoryBudgets.map((cb) => [cb.category.id, cb]),
  )

  const budgetLineTransactions = new Map<string, Transaction[]>()
  const categoryTransactions = new Map<string, Transaction[]>()
  const unplannedTransactions: Transaction[] = []

  for (const transaction of spending) {
    const descriptionKey = normalizeDescription(transaction.description)
    if (descriptionKey && budgetLineDescriptionKeys.has(descriptionKey)) {
      const bucket = budgetLineTransactions.get(descriptionKey) ?? []
      bucket.push(transaction)
      budgetLineTransactions.set(descriptionKey, bucket)
      continue
    }

    const categoryId = transaction.category?.id
    if (categoryId && categoryBudgetByCategoryId.has(categoryId)) {
      const bucket = categoryTransactions.get(categoryId) ?? []
      bucket.push(transaction)
      categoryTransactions.set(categoryId, bucket)
      continue
    }

    unplannedTransactions.push(transaction)
  }

  const budgetLines: BudgetLineGroup[] = [...budgetLineByDescription.entries()]
    .map(([description, lines]) => {
      const planned = lines.reduce(
        (sum, line) =>
          sum + toMonthlyAmount(line.amount, line.repeat_every, line.repeat_until),
        0,
      )
      const matchedTransactions = budgetLineTransactions.get(description) ?? []
      const actual = matchedTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)

      return {
        budgetTransactionIds: lines.map((line) => line.id),
        description,
        category: lines.find((line) => line.category)?.category,
        planned,
        actual,
        transactions: matchedTransactions,
      }
    })
    .sort((a, b) => b.actual - a.actual)

  const categories: CategoryBudgetGroup[] = activeCategoryBudgets
    .map((categoryBudget) => {
      const planned = toMonthlyAmount(
        categoryBudget.amount,
        categoryBudget.repeat_every,
        categoryBudget.repeat_until,
      )
      const matchedTransactions = categoryTransactions.get(categoryBudget.category.id) ?? []
      const actual = matchedTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)

      return {
        categoryBudget,
        planned,
        actual,
        transactions: matchedTransactions,
      }
    })
    .filter((group) => group.planned > 0 || group.actual > 0)
    .sort((a, b) => b.actual - a.actual)

  return {
    budgetLines,
    categories,
    unplanned: { transactions: unplannedTransactions },
  }
}
