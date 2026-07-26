import {
  Button,
  HR,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "flowbite-react"
import { format, parseISO, startOfMonth } from "date-fns"
import { useCallback, useMemo, useState } from "react"
import { FiChevronDown, FiChevronRight } from "react-icons/fi"
import BudgetMonthPicker from "../../Components/BudgetMonthPicker"
import ColoredBadge from "../../Components/ColoredBadge"
import TruncatedText from "../../Components/TruncatedText"
import { useData } from "../../Hooks/useData"
import { useBudgetMonthTransactions } from "../../Hooks/useBudgetMonthTransactions"
import { useMediaQuery } from "../../Hooks/useMediaQuery"
import { classifyBudgetSpending } from "../../budget/classifySpending"
import { Transaction } from "../../API"
import { formatCurrencyGBP } from "../../utils"
import BudgetLineCard from "./BudgetLineCard"
import CategoryBudgetActualCard from "./CategoryBudgetActualCard"
import UnplannedTransactionCard from "./UnplannedTransactionCard"
import { VarianceCell } from "./ActualDisplay"

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

function ExpandChevron({
  expanded,
  onToggle,
  transactionCount,
}: {
  expanded: boolean
  onToggle: () => void
  transactionCount: number
}) {
  if (transactionCount === 0) {
    return <span className="inline-block w-8 shrink-0" />
  }

  return (
    <Button
      className="size-8 shrink-0 p-0"
      color="light"
      aria-expanded={expanded}
      aria-label={expanded ? "Hide transactions" : "Show transactions"}
      onClick={onToggle}
    >
      {expanded ? <FiChevronDown /> : <FiChevronRight />}
    </Button>
  )
}

function budgetLineTransactionRows(transactions: Transaction[]) {
  return transactions.map((transaction) => (
    <TableRow
      key={transaction.id}
      className="text-sm text-gray-600 dark:text-gray-400"
    >
      <TableCell className="pl-8">
        <span className="text-gray-400">
          {format(parseISO(transaction.date), "d MMM")} —{" "}
        </span>
        <TruncatedText text={transaction.description} />
      </TableCell>
      <TableCell />
      <TableCell />
      <TableCell>{formatCurrencyGBP(Math.abs(transaction.amount))}</TableCell>
      <TableCell />
    </TableRow>
  ))
}

function categoryTransactionRows(transactions: Transaction[]) {
  return transactions.map((transaction) => (
    <TableRow
      key={transaction.id}
      className="text-sm text-gray-600 dark:text-gray-400"
    >
      <TableCell className="pl-8">
        <span className="text-gray-400">
          {format(parseISO(transaction.date), "d MMM")} —{" "}
        </span>
        <TruncatedText text={transaction.description} />
      </TableCell>
      <TableCell />
      <TableCell>{formatCurrencyGBP(Math.abs(transaction.amount))}</TableCell>
      <TableCell />
    </TableRow>
  ))
}

export default function BudgetActual() {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const { budgetTransactions, categoryBudgets, categoryColorMap } = useData()
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(),
  )
  const { transactions, isLoading } = useBudgetMonthTransactions(month)

  const toggleExpanded = useCallback((key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }, [])

  const classified = useMemo(() => {
    if (!transactions || !budgetTransactions || !categoryBudgets) return null
    return classifyBudgetSpending(
      transactions,
      budgetTransactions,
      categoryBudgets,
      month,
    )
  }, [transactions, budgetTransactions, categoryBudgets, month])

  const summary = useMemo(() => {
    if (!classified) return null

    const planned =
      classified.budgetLines.reduce((sum, g) => sum + g.planned, 0) +
      classified.categories.reduce((sum, g) => sum + g.planned, 0)
    const actual =
      classified.budgetLines.reduce((sum, g) => sum + g.actual, 0) +
      classified.categories.reduce((sum, g) => sum + g.actual, 0)
    const unplanned = classified.unplanned.transactions.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0,
    )

    const totalActual = actual + unplanned

    return { planned, actual, unplanned, totalActual }
  }, [classified])

  const sortedUnplanned = useMemo(
    () =>
      classified?.unplanned.transactions
        .slice()
        .sort(
          (a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime(),
        ) ?? [],
    [classified],
  )

  return (
    <div className="flex flex-col gap-2 px-4 pb-8 md:gap-4 md:px-16 md:pb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Budget actual</h1>
        <BudgetMonthPicker month={month} onMonthChange={setMonth} />
      </div>

      <HR />

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size="xl" />
        </div>
      )}

      {!isLoading && classified && summary && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Planned (matched to budget lines & categories)
              </p>
              <p className="text-2xl font-semibold">
                {formatCurrencyGBP(summary.planned)}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Actual (matched)
              </p>
              <p className="text-2xl font-semibold">
                {formatCurrencyGBP(summary.actual)}
              </p>
              <VarianceCell planned={summary.planned} actual={summary.actual} />
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Unplanned spending
              </p>
              <p className="text-2xl font-semibold">
                {formatCurrencyGBP(summary.unplanned)}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total actual (all spending)
              </p>
              <p className="text-2xl font-semibold">
                {formatCurrencyGBP(summary.totalActual)}
              </p>
              <VarianceCell
                planned={summary.planned}
                actual={summary.totalActual}
              />
            </div>
          </div>

          <section>
            <h2 className="mb-2 text-2xl font-medium md:mb-4">Budget lines</h2>
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400 md:mb-4">
              Spending matched to outgoing budget lines by description.
            </p>
            {isDesktop ? (
              <div className="-mx-4 md:mx-0">
                <Table striped theme={tableTheme}>
                  <TableHead>
                    <TableRow>
                      <TableHeadCell>Description</TableHeadCell>
                      <TableHeadCell>Category</TableHeadCell>
                      <TableHeadCell>Planned</TableHeadCell>
                      <TableHeadCell>Actual</TableHeadCell>
                      <TableHeadCell>Variance</TableHeadCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {classified.budgetLines.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          No budget lines due or matched this month
                        </TableCell>
                      </TableRow>
                    ) : (
                      classified.budgetLines.flatMap((group) => {
                        const expandKey = `line:${group.description}`
                        const expanded = expandedGroups.has(expandKey)

                        return [
                          <TableRow
                            key={group.description}
                            className="bg-gray-50 dark:bg-gray-700"
                          >
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <ExpandChevron
                                  expanded={expanded}
                                  transactionCount={group.transactions.length}
                                  onToggle={() => toggleExpanded(expandKey)}
                                />
                                <TruncatedText text={group.description} />
                              </div>
                            </TableCell>
                            <TableCell>
                              <ColoredBadge
                                label={group.category?.name ?? "Uncategorised"}
                                colorMap={categoryColorMap}
                                colorKey={group.category?.id ?? "uncategorised"}
                              />
                            </TableCell>
                            <TableCell>
                              {formatCurrencyGBP(group.planned)}
                            </TableCell>
                            <TableCell>
                              {formatCurrencyGBP(group.actual)}
                            </TableCell>
                            <TableCell>
                              <VarianceCell
                                planned={group.planned}
                                actual={group.actual}
                              />
                            </TableCell>
                          </TableRow>,
                          ...(expanded
                            ? budgetLineTransactionRows(group.transactions)
                            : []),
                        ]
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {classified.budgetLines.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400">
                    No budget lines due or matched this month
                  </p>
                ) : (
                  classified.budgetLines.map((group) => {
                    const expandKey = `line:${group.description}`
                    return (
                      <BudgetLineCard
                        key={group.description}
                        description={group.description}
                        category={group.category}
                        categoryColorMap={categoryColorMap}
                        planned={group.planned}
                        actual={group.actual}
                        transactions={group.transactions}
                        expanded={expandedGroups.has(expandKey)}
                        onToggle={() => toggleExpanded(expandKey)}
                      />
                    )
                  })
                )}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-2xl font-medium md:mb-4">
              Category budgets
            </h2>
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400 md:mb-4">
              Category spending not matched to a specific budget line
              description.
            </p>
            {isDesktop ? (
              <div className="-mx-4 md:mx-0">
                <Table striped theme={tableTheme}>
                  <TableHead>
                    <TableRow>
                      <TableHeadCell>Category</TableHeadCell>
                      <TableHeadCell>Planned</TableHeadCell>
                      <TableHeadCell>Actual</TableHeadCell>
                      <TableHeadCell>Variance</TableHeadCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {classified.categories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          No category budget spending this month
                        </TableCell>
                      </TableRow>
                    ) : (
                      classified.categories.flatMap((group) => {
                        const expandKey = `category:${group.categoryBudget.id}`
                        const expanded = expandedGroups.has(expandKey)

                        return [
                          <TableRow
                            key={group.categoryBudget.id}
                            className="bg-gray-50 dark:bg-gray-700"
                          >
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <ExpandChevron
                                  expanded={expanded}
                                  transactionCount={group.transactions.length}
                                  onToggle={() => toggleExpanded(expandKey)}
                                />
                                <ColoredBadge
                                  label={group.categoryBudget.category.name}
                                  colorMap={categoryColorMap}
                                  colorKey={group.categoryBudget.category.id}
                                />
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatCurrencyGBP(group.planned)}
                            </TableCell>
                            <TableCell>
                              {formatCurrencyGBP(group.actual)}
                            </TableCell>
                            <TableCell>
                              <VarianceCell
                                planned={group.planned}
                                actual={group.actual}
                              />
                            </TableCell>
                          </TableRow>,
                          ...(expanded
                            ? categoryTransactionRows(group.transactions)
                            : []),
                        ]
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {classified.categories.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400">
                    No category budget spending this month
                  </p>
                ) : (
                  classified.categories.map((group) => {
                    const expandKey = `category:${group.categoryBudget.id}`
                    return (
                      <CategoryBudgetActualCard
                        key={group.categoryBudget.id}
                        categoryBudget={group.categoryBudget}
                        categoryColorMap={categoryColorMap}
                        planned={group.planned}
                        actual={group.actual}
                        transactions={group.transactions}
                        expanded={expandedGroups.has(expandKey)}
                        onToggle={() => toggleExpanded(expandKey)}
                      />
                    )
                  })
                )}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-2xl font-medium md:mb-4">
              Unplanned spending
            </h2>
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400 md:mb-4">
              Transactions with no matching budget line or category budget.
            </p>
            {isDesktop ? (
              <div className="-mx-4 md:mx-0">
                <Table striped theme={tableTheme}>
                  <TableHead>
                    <TableRow>
                      <TableHeadCell>Description</TableHeadCell>
                      <TableHeadCell>Category</TableHeadCell>
                      <TableHeadCell>Date</TableHeadCell>
                      <TableHeadCell>Amount</TableHeadCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedUnplanned.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          No unplanned spending this month
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedUnplanned.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <TruncatedText text={transaction.description} />
                          </TableCell>
                          <TableCell>
                            <ColoredBadge
                              label={
                                transaction.category?.name ?? "Uncategorised"
                              }
                              colorMap={categoryColorMap}
                              colorKey={
                                transaction.category?.id ?? "uncategorised"
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {format(parseISO(transaction.date), "d MMM yyyy")}
                          </TableCell>
                          <TableCell>
                            {formatCurrencyGBP(Math.abs(transaction.amount))}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {sortedUnplanned.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400">
                    No unplanned spending this month
                  </p>
                ) : (
                  sortedUnplanned.map((transaction) => (
                    <UnplannedTransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      categoryColorMap={categoryColorMap}
                    />
                  ))
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
