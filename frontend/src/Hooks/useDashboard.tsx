/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, ReactNode, useState, useMemo } from "react"
import { Account, Category, TimePeriod } from "../API/requests"
import { useGetUserByIdAccounts, useGetUserByIdCategories } from "../API/queries"
import { decryptAccount, decryptCategory } from "../Security/data"
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

type DashboardValue = {
  dataPeriod: TimePeriod
  dataGroupBy: TimePeriod
  setDataPeriod: (period: TimePeriod) => void
  categories: Category[] | null
  accounts: Account[] | null
  categoryColorMap: ColorMap
  accountColorMap: ColorMap
}

const DashboardContext = createContext<DashboardValue | undefined>(undefined)

export const useDashboard = () => {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider")
  }
  return context
}

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const { userId, decrypt } = useUser()

  const [dataPeriod, setDataPeriod] = useState<TimePeriod>("ytd")
  const dataGroupBy = useMemo(
    () =>
      (dataPeriod == "all" || dataPeriod === "ytd" || dataPeriod === "year"
        ? "month"
        : "day") as TimePeriod,
    [dataPeriod]
  )

  const { data: encAccounts } = useGetUserByIdAccounts({ path: { id: userId } })
  const accounts = useAsyncMemo(
    async () =>
      (await Promise.all(encAccounts?.map((acc) => decryptAccount(acc, decrypt)) ?? [])).sort(
        (a, b) => a.name.localeCompare(b.name)
      ),
    [encAccounts, decrypt]
  )

  const { data: encCategories } = useGetUserByIdCategories({ path: { id: userId } })
  const categories = useAsyncMemo(
    async () =>
      (await Promise.all(encCategories?.map((cat) => decryptCategory(cat, decrypt)) ?? [])).sort(
        (a, b) => a.name.localeCompare(b.name)
      ),
    [encCategories, decrypt]
  )

  const accountColorMap = useMemo(
    () => getChartColors(accounts ? [...accounts.map((acc) => acc.id), "total"] : []),
    [accounts]
  )
  const categoryColorMap = useMemo(
    () => getChartColors(categories ? [...categories.map((cat) => cat.id), "uncategorised"] : []),
    [categories]
  )

  const value = useMemo(
    () => ({
      dataPeriod,
      dataGroupBy,
      setDataPeriod,
      categories,
      accounts,
      categoryColorMap,
      accountColorMap,
    }),
    [accountColorMap, accounts, categories, categoryColorMap, dataGroupBy, dataPeriod]
  )

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}
