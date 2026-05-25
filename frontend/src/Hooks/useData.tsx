/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, ReactNode, useState, useMemo } from "react"
import {
  Account,
  AllAccountSummary,
  BalanceSummary,
  BudgetTransaction,
  Category,
  CategorySummary,
  SummaryInterval,
} from "../API/requests"
import { format, subYears } from "date-fns"
import {
  useGetUserByIdAccounts,
  useGetUserByIdBudgetTransactions,
  useGetUserByIdCategories,
  useGetUserByIdSummaryAccounts,
  useGetUserByIdSummaryBalance,
  useGetUserByIdSummaryCategories,
} from "../API/queries"
import { decryptAccount, decryptBudgetTransaction, decryptCategory } from "../Security/data"
import { useAsyncMemo } from "./useAsyncMemo"
import { useUser } from "./useUser"
import { getChartColors } from "../utils"

type ColorMap = Record<
  string,
  {
    border: string
    fill: string
    text: string
  }
>

export type SummaryRange = {
  startDate: Date | null
  endDate: Date | null
  interval: SummaryInterval
}

type SummaryDateQuery = {
  start_date?: string
  end_date?: string
}

type SummaryBalanceQuery = SummaryDateQuery & {
  interval: SummaryInterval
}

type DataValue = {
  summaryRange: SummaryRange
  summaryDateQuery: SummaryDateQuery
  summaryBalanceQuery: SummaryBalanceQuery
  setSummaryRange: (range: SummaryRange) => void
  categories: Category[] | null
  accounts: Account[] | null
  budgetTransactions: BudgetTransaction[] | null
  accountSummary: AllAccountSummary | null
  balanceSummary: BalanceSummary | null
  categorySummaries: CategorySummary[] | null
  categoryColorMap: ColorMap
  accountColorMap: ColorMap
}

const DataContext = createContext<DataValue | undefined>(undefined)

export const useData = () => {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}

function formatSummaryDate(date: Date | null) {
  if (!date) return undefined

  return format(date, "yyyy-MM-dd")
}

function getInitialSummaryRange(): SummaryRange {
  const today = new Date()

  return {
    startDate: subYears(today, 1),
    endDate: today,
    interval: "month",
  }
}

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { userId, decrypt } = useUser()

  const [summaryRange, setSummaryRange] = useState<SummaryRange>(() => getInitialSummaryRange())

  const summaryDateQuery = useMemo(
    () => ({
      start_date: formatSummaryDate(summaryRange.startDate),
      end_date: formatSummaryDate(summaryRange.endDate),
    }),
    [summaryRange.endDate, summaryRange.startDate],
  )

  const summaryBalanceQuery = useMemo(
    () => ({
      ...summaryDateQuery,
      interval: summaryRange.interval,
    }),
    [summaryRange.interval, summaryDateQuery],
  )

  const { data: encAccounts } = useGetUserByIdAccounts({ path: { id: userId } }, undefined, {
    enabled: !!userId,
  })
  const accounts = useAsyncMemo(
    async () =>
      (await Promise.all(encAccounts?.map((acc) => decryptAccount(acc, decrypt)) ?? [])).sort(
        (a, b) => a.name.localeCompare(b.name),
      ),
    [encAccounts, decrypt],
  )

  const { data: encCategories } = useGetUserByIdCategories({ path: { id: userId } }, undefined, {
    enabled: !!userId,
  })
  const categories = useAsyncMemo(
    async () =>
      (await Promise.all(encCategories?.map((cat) => decryptCategory(cat, decrypt)) ?? [])).sort(
        (a, b) => a.name.localeCompare(b.name),
      ),
    [encCategories, decrypt],
  )

  const { data: encBudgetTransactions } = useGetUserByIdBudgetTransactions(
    { path: { id: userId } },
    undefined,
    {
      enabled: !!userId,
    },
  )
  const budgetTransactions = useAsyncMemo(
    async () =>
      (
        await Promise.all(
          encBudgetTransactions?.map((bt) => decryptBudgetTransaction(bt, decrypt)) ?? [],
        )
      ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [encBudgetTransactions, decrypt],
  )

  const { data: encAccountSummaries } = useGetUserByIdSummaryAccounts(
    {
      path: { id: userId },
    },
    undefined,
    {
      enabled: !!userId,
    },
  )
  const accountSummary = useAsyncMemo(
    async () =>
      encAccountSummaries
        ? {
            ...encAccountSummaries,
            accounts: await Promise.all(
              encAccountSummaries.accounts.map(async (acc) => ({
                ...acc,
                account: {
                  ...acc.account,
                  name: await decrypt(acc.account.name),
                },
              })),
            ),
          }
        : null,
    [encAccountSummaries, decrypt],
  )

  const { data: encBalanceSummary } = useGetUserByIdSummaryBalance(
    {
      path: { id: userId },
      query: summaryBalanceQuery,
    },
    undefined,
    {
      enabled: !!userId,
    },
  )
  const balanceSummary = useAsyncMemo(async () => {
    if (!encBalanceSummary) return null
    return {
      ...encBalanceSummary,
      accounts: await Promise.all(
        encBalanceSummary.accounts.map(async (account) => ({
          ...account,
          account: await decryptAccount(account.account, decrypt),
        })),
      ),
    }
  }, [encBalanceSummary, decrypt])

  const { data: encCategorySummaries } = useGetUserByIdSummaryCategories(
    { path: { id: userId }, query: summaryDateQuery },
    undefined,
    {
      enabled: !!userId,
    },
  )
  const categorySummaries = useAsyncMemo(
    async (): Promise<CategorySummary[] | null> =>
      encCategorySummaries
        ? (
            await Promise.all(
              encCategorySummaries?.map(async (cat) => ({
                ...cat,
                category: cat.category
                  ? {
                      ...cat.category,
                      name: await decrypt(cat.category.name),
                    }
                  : undefined,
              })),
            )
          ).sort((a, b) =>
            (a.category?.name || "Uncategorised").localeCompare(
              b.category?.name || "Uncategorised",
            ),
          )
        : null,
    [encCategorySummaries, decrypt],
  )

  const accountColorMap = useMemo(
    () => getChartColors(accounts ? [...accounts.map((acc) => acc.id), "total"] : []),
    [accounts],
  )
  const categoryColorMap = useMemo(
    () => getChartColors(categories ? [...categories.map((cat) => cat.id), "uncategorised"] : []),
    [categories],
  )

  const value = useMemo(
    () => ({
      summaryRange,
      summaryDateQuery,
      summaryBalanceQuery,
      setSummaryRange,
      categories,
      accounts,
      budgetTransactions,
      accountSummary,
      balanceSummary,
      categorySummaries,
      categoryColorMap,
      accountColorMap,
    }),
    [
      accountColorMap,
      accountSummary,
      accounts,
      balanceSummary,
      budgetTransactions,
      categories,
      categoryColorMap,
      categorySummaries,
      summaryBalanceQuery,
      summaryDateQuery,
      summaryRange,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
