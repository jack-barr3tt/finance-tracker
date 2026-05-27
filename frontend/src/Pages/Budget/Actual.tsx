import {
  Badge,
  HR,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Tooltip,
} from "flowbite-react"
import { format, parseISO, startOfMonth } from "date-fns"
import { useMemo, useState } from "react"
import BudgetMonthPicker from "../../Components/BudgetMonthPicker"
import { useData } from "../../Hooks/useData"
import { useBudgetMonthTransactions } from "../../Hooks/useBudgetMonthTransactions"
import { classifyBudgetSpending } from "../../budget/classifySpending"
import { Category } from "../../API/requests"

function formatGbp(amount: number) {
  return amount.toLocaleString("en-GB", { style: "currency", currency: "GBP" })
}

function VarianceCell({ planned, actual }: { planned: number; actual: number }) {
  const delta = actual - planned
  if (planned === 0 && actual === 0) {
    return <span className="text-gray-400">—</span>
  }

  const isOver = delta > 0
  const colorClass = isOver
    ? "text-red-600 dark:text-red-400"
    : delta < 0
      ? "text-green-600 dark:text-green-400"
      : "text-gray-500 dark:text-gray-400"

  return (
    <span className={colorClass}>
      {delta > 0 ? "+" : ""}
      {formatGbp(delta)}
      {planned > 0 && (
        <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
          ({isOver ? "over" : delta < 0 ? "under" : "on track"})
        </span>
      )}
    </span>
  )
}

function CategoryBadge({
  category,
  categoryColorMap,
}: {
  category?: Category
  categoryColorMap: Record<string, { fill: string; text: string }>
}) {
  const categoryId = category?.id ?? "uncategorised"
  const colors = categoryColorMap[categoryId]

  return (
    <Badge
      style={{
        backgroundColor: colors?.fill,
        color: colors?.text,
      }}
      className="h-5 w-fit"
    >
      {category?.name ?? "Uncategorised"}
    </Badge>
  )
}

function DescriptionCell({ description }: { description: string }) {
  if (!description) {
    return <span className="italic text-gray-400">No description</span>
  }

  if (description.length <= 30) return <span>{description}</span>

  return (
    <Tooltip content={description} placement="top">
      <span>{description.slice(0, 30)}...</span>
    </Tooltip>
  )
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

export default function BudgetActual() {
  const { budgetTransactions, categoryBudgets, categoryColorMap } = useData()
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const { transactions, isLoading } = useBudgetMonthTransactions(month)

  const classified = useMemo(() => {
    if (!transactions || !budgetTransactions || !categoryBudgets) return null
    return classifyBudgetSpending(transactions, budgetTransactions, categoryBudgets, month)
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

    return { planned, actual, unplanned }
  }, [classified])

  return (
    <div className="flex flex-col gap-2 px-8 pb-8 md:gap-4 md:px-16 md:pb-16">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">Planned (matched)</p>
              <p className="text-2xl font-semibold">{formatGbp(summary.planned)}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">Actual (matched)</p>
              <p className="text-2xl font-semibold">{formatGbp(summary.actual)}</p>
              <VarianceCell planned={summary.planned} actual={summary.actual} />
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">Unplanned spending</p>
              <p className="text-2xl font-semibold">{formatGbp(summary.unplanned)}</p>
            </div>
          </div>

          <section>
            <h2 className="mb-2 text-2xl font-medium md:mb-4">Budget lines</h2>
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400 md:mb-4">
              Spending matched to outgoing budget lines by description.
            </p>
            <div className="-mx-8 md:mx-0">
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
                        No spending matched to budget lines this month
                      </TableCell>
                    </TableRow>
                  ) : (
                    classified.budgetLines.flatMap((group) => [
                      <TableRow key={group.description} className="bg-gray-50 dark:bg-gray-700">
                        <TableCell>
                          <DescriptionCell description={group.description} />
                        </TableCell>
                        <TableCell>
                          <CategoryBadge
                            category={group.category}
                            categoryColorMap={categoryColorMap}
                          />
                        </TableCell>
                        <TableCell>{formatGbp(group.planned)}</TableCell>
                        <TableCell>{formatGbp(group.actual)}</TableCell>
                        <TableCell>
                          <VarianceCell planned={group.planned} actual={group.actual} />
                        </TableCell>
                      </TableRow>,
                      ...group.transactions.map((transaction) => (
                        <TableRow
                          key={transaction.id}
                          className="text-sm text-gray-600 dark:text-gray-400"
                        >
                          <TableCell className="pl-8">
                            <span className="text-gray-400">
                              {format(parseISO(transaction.date), "d MMM")} —{" "}
                            </span>
                            <DescriptionCell description={transaction.description} />
                          </TableCell>
                          <TableCell />
                          <TableCell />
                          <TableCell>{formatGbp(Math.abs(transaction.amount))}</TableCell>
                          <TableCell />
                        </TableRow>
                      )),
                    ])
                  )}
                </TableBody>
              </Table>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-2xl font-medium md:mb-4">Category budgets</h2>
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400 md:mb-4">
              Category spending not matched to a specific budget line description.
            </p>
            <div className="-mx-8 md:mx-0">
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
                    classified.categories.flatMap((group) => [
                      <TableRow
                        key={group.categoryBudget.id}
                        className="bg-gray-50 dark:bg-gray-700"
                      >
                        <TableCell>
                          <CategoryBadge
                            category={group.categoryBudget.category}
                            categoryColorMap={categoryColorMap}
                          />
                        </TableCell>
                        <TableCell>{formatGbp(group.planned)}</TableCell>
                        <TableCell>{formatGbp(group.actual)}</TableCell>
                        <TableCell>
                          <VarianceCell planned={group.planned} actual={group.actual} />
                        </TableCell>
                      </TableRow>,
                      ...group.transactions.map((transaction) => (
                        <TableRow
                          key={transaction.id}
                          className="text-sm text-gray-600 dark:text-gray-400"
                        >
                          <TableCell className="pl-8">
                            <span className="text-gray-400">
                              {format(parseISO(transaction.date), "d MMM")} —{" "}
                            </span>
                            <DescriptionCell description={transaction.description} />
                          </TableCell>
                          <TableCell />
                          <TableCell>{formatGbp(Math.abs(transaction.amount))}</TableCell>
                          <TableCell />
                        </TableRow>
                      )),
                    ])
                  )}
                </TableBody>
              </Table>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-2xl font-medium md:mb-4">Unplanned spending</h2>
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400 md:mb-4">
              Transactions with no matching budget line or category budget.
            </p>
            <div className="-mx-8 md:mx-0">
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
                  {classified.unplanned.transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        No unplanned spending this month
                      </TableCell>
                    </TableRow>
                  ) : (
                    classified.unplanned.transactions
                      .sort(
                        (a, b) =>
                          parseISO(b.date).getTime() - parseISO(a.date).getTime(),
                      )
                      .map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <DescriptionCell description={transaction.description} />
                          </TableCell>
                          <TableCell>
                            <CategoryBadge
                              category={transaction.category}
                              categoryColorMap={categoryColorMap}
                            />
                          </TableCell>
                          <TableCell>
                            {format(parseISO(transaction.date), "d MMM yyyy")}
                          </TableCell>
                          <TableCell>{formatGbp(Math.abs(transaction.amount))}</TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
