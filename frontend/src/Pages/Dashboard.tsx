import {
  Badge,
  Button,
  Card,
  HR,
  Table,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Tooltip,
} from "flowbite-react"
import { useUser } from "../Hooks/useUser"
import {
  useDeleteUserByIdTransactionsByTransactionId,
  useGetUserByIdAccounts,
  useGetUserByIdCategories,
  useGetUserByIdSummaryAccounts,
  UseGetUserByIdSummaryAccountsKeyFn,
  UseGetUserByIdSummaryBalanceKeyFn,
  UseGetUserByIdSummaryCategoriesKeyFn,
  UseGetUserByIdTransactionsByTransactionIdKeyFn,
  UseGetUserByIdTransactionsKeyFn,
} from "../API/queries"
import { FiEdit, FiPlus, FiTrash, FiUpload } from "react-icons/fi"
import EditTransactionRow from "./Dashboard/EditTransactionRow"
import TableBodyWithButton from "../Components/TableBodyWithButton"
import { useCallback, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

import BalanceGraph from "../Components/BalanceGraph"
import CategoryPie from "../Components/CategoryPie"
import UploadModal from "../Components/UploadModal"
import { useGetUserByIdTransactionsInfinite } from "../API/queries/infiniteQueries"
import { InView } from "react-intersection-observer"
import { format, parseISO } from "date-fns"
import FilterButton from "../Components/FilterButton"
import { getChartColors } from "../utils"
import { useAsyncMemo } from "../Hooks/useAsyncMemo"
import { decryptAccount, decryptCategory, decryptTransaction } from "../Security/data"

export default function Dashboard() {
  const { userId, decrypt } = useUser()
  const queryClient = useQueryClient()
  const { data: encAccountSummaries } = useGetUserByIdSummaryAccounts({
    path: { id: userId },
  })
  const accountSummaries = useAsyncMemo(
    async () =>
      encAccountSummaries
        ? Promise.all(
            encAccountSummaries.accounts.map(async (acc) => ({
              ...acc,
              account: {
                ...acc.account,
                name: await decrypt(acc.account.name),
              },
            }))
          )
        : null,
    [encAccountSummaries, decrypt]
  )

  const { data: encAccounts } = useGetUserByIdAccounts({ path: { id: userId } })
  const accounts = useAsyncMemo(
    async () => Promise.all(encAccounts?.map((acc) => decryptAccount(acc, decrypt)) ?? []),
    [encAccounts, decrypt]
  )

  const { data: encCategories } = useGetUserByIdCategories({ path: { id: userId } })
  const { mutateAsync: deleteTransaction } = useDeleteUserByIdTransactionsByTransactionId()

  const categories = useAsyncMemo(
    async () =>
      (await Promise.all(encCategories?.map((cat) => decryptCategory(cat, decrypt)) ?? [])).sort(
        (a, b) => a.name.localeCompare(b.name)
      ),
    [encCategories, decrypt]
  )

  const [accountFilterId, setAccountFilterId] = useState<string | undefined>(undefined)
  const [categoryFilterId, setCategoryFilterId] = useState<string | undefined>(undefined)

  const accountColorMap = useMemo(
    () => getChartColors(accounts ? ["total", ...accounts.map((acc) => acc.id)] : []),
    [accounts]
  )
  const categoryColorMap = useMemo(
    () => getChartColors(categories ? ["uncategorised", ...categories.map((cat) => cat.id)] : []),
    [categories]
  )

  const {
    data: encTransactions,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useGetUserByIdTransactionsInfinite({
    path: { id: userId },
    query: { limit: 50, account_id: accountFilterId, category_id: categoryFilterId },
  })

  const transactions = useAsyncMemo(
    async () => ({
      pages: await Promise.all(
        encTransactions?.pages.map(async (page) => ({
          ...page,
          transactions: await Promise.all(
            page?.transactions.map((t) => decryptTransaction(t, decrypt)) ?? []
          ),
        })) ?? []
      ),
    }),
    [encTransactions, decrypt]
  )

  const [showAdd, setShowAdd] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [editingTransactionId, setEditingTransactionId] = useState<string | undefined>(undefined)

  const handleDelete = useCallback(
    async (transactionId: string) => {
      await deleteTransaction({
        path: { id: userId, transaction_id: transactionId },
      })
      if (editingTransactionId === transactionId) setEditingTransactionId(undefined)
      queryClient.invalidateQueries({
        queryKey: UseGetUserByIdTransactionsKeyFn({ path: { id: userId } }),
      })
      queryClient.invalidateQueries({
        queryKey: UseGetUserByIdTransactionsByTransactionIdKeyFn({
          path: { id: userId, transaction_id: transactionId },
        }),
      })
      queryClient.invalidateQueries({
        queryKey: UseGetUserByIdSummaryAccountsKeyFn({ path: { id: userId } }),
      })
      queryClient.invalidateQueries({
        queryKey: UseGetUserByIdSummaryCategoriesKeyFn({ path: { id: userId } }),
      })
      queryClient.invalidateQueries({
        queryKey: UseGetUserByIdSummaryBalanceKeyFn({ path: { id: userId } }),
      })
    },
    [deleteTransaction, userId, editingTransactionId, queryClient]
  )

  return (
    <div className="flex flex-col gap-2 px-8 pb-8 md:gap-4 md:pb-16 md:px-16">
      <UploadModal show={showUpload} onClose={() => setShowUpload(false)} />

      <h2 className="text-2xl font-medium">Accounts</h2>
      {accountSummaries?.length === 0 ? (
        <p className="text-gray-500">No accounts found</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:flex 2xl:flex-wrap">
            {accountSummaries?.map((account) => (
              <Card>
                <div className="grid grid-cols-2 gap-2 -m-2 auto-cols-auto md:m-0">
                  <h1 className="order-3 font-medium md:order-1">{account.account.name}</h1>
                  <h2 className="font-light">{account.account.bank.name}</h2>
                  <p className="order-first col-span-1 row-span-2 text-3xl md:text-4xl md:order-3 md:col-span-2 md:row-span-1">
                    {account.balance.toLocaleString("en-GB", {
                      style: "currency",
                      currency: "GBP",
                    })}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <div className="flex flex-row items-center justify-start">
        <Card>
          <div className="flex flex-row items-center gap-4 text-2xl md:text-3xl">
            <h1 className="font-medium">Total:</h1>
            <p>
              {encAccountSummaries?.total.toLocaleString("en-GB", {
                style: "currency",
                currency: "GBP",
              })}
            </p>
          </div>
        </Card>
      </div>

      <HR />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 *:w-full md:gap-4">
        <CategoryPie colorMap={categoryColorMap} />
        <BalanceGraph colorMap={accountColorMap} />
      </div>

      <HR />

      <div className="flex flex-row items-center justify-between mb-2 md:mb-0">
        <h2 className="text-2xl font-medium">Transactions</h2>
        <Button onClick={() => setShowUpload(true)}>
          <FiUpload className="mr-2" />
          Import
        </Button>
      </div>

      <Table striped theme={{ root: { wrapper: "overflow-x-auto rounded-md custom-scrollbar" } }}>
        <TableHead>
          <TableRow>
            <TableHeadCell>Date</TableHeadCell>
            <TableHeadCell>
              <div className="flex items-center">
                Account
                <FilterButton
                  options={
                    accounts?.map((account) => ({
                      label: account.name,
                      value: account.id,
                    })) || []
                  }
                  value={accountFilterId}
                  onChange={(value) => setAccountFilterId(value)}
                />
              </div>
            </TableHeadCell>
            <TableHeadCell>
              <div className="flex items-center">
                Category
                <FilterButton
                  options={
                    categories
                      ? [
                          ...categories.map((category) => ({
                            label: category.name,
                            value: category.id,
                          })),
                          {
                            label: "Uncategorised",
                            value: "uncategorised",
                          },
                        ]
                      : []
                  }
                  value={categoryFilterId}
                  onChange={(value) => setCategoryFilterId(value)}
                />
              </div>
            </TableHeadCell>
            <TableHeadCell>Description</TableHeadCell>
            <TableHeadCell>Amount</TableHeadCell>
            <TableHeadCell>
              <span className="sr-only">Edit</span>
            </TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBodyWithButton
          button={
            !showAdd ? (
              <Button
                className="p-0 shadow-md size-8"
                color="light"
                onClick={() => setShowAdd(true)}
              >
                <FiPlus />
              </Button>
            ) : null
          }
        >
          {showAdd && <EditTransactionRow cancelCallback={() => setShowAdd(false)} />}
          {transactions?.pages.reduce((acc, page) => acc + (page?.transactions.length || 0), 0) ===
            0 && !showAdd ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                No transactions found
              </TableCell>
            </TableRow>
          ) : (
            transactions?.pages.map((page) =>
              page?.transactions.map((transaction) =>
                editingTransactionId == transaction.id ? (
                  <EditTransactionRow
                    transactionId={transaction.id}
                    cancelCallback={() => setEditingTransactionId(undefined)}
                  />
                ) : (
                  <TableRow key={transaction.id} className="group/trnscrow">
                    <TableCell>{format(parseISO(transaction.date), "dd MMM yyyy")}</TableCell>
                    <TableCell>
                      <Badge
                        style={{
                          backgroundColor: accountColorMap[transaction.account.id]?.fill,
                          color: accountColorMap[transaction.account.id]?.text,
                        }}
                        className="-mx-2 w-fit"
                      >
                        {transaction.account.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        style={{
                          backgroundColor:
                            categoryColorMap[transaction.category?.id || "uncategorised"]?.fill,
                          color:
                            categoryColorMap[transaction.category?.id || "uncategorised"]?.text,
                        }}
                        className="-mx-2 w-fit"
                      >
                        {transaction.category?.name || "Uncategorised"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="hidden xl:block">{transaction.description}</span>
                      <span className="xl:hidden">
                        {transaction.description.length > 30 ? (
                          <Tooltip content={transaction.description} placement="top">
                            {transaction.description.slice(0, 30)}...
                          </Tooltip>
                        ) : (
                          transaction.description
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      {transaction.amount.toLocaleString("en-GB", {
                        style: "currency",
                        currency: "GBP",
                      })}
                    </TableCell>
                    <TableCell className="p-0 px-[18px] py-[10px]">
                      <div className="flex flex-row items-center justify-end invisible gap-2 group-hover/trnscrow:visible">
                        <Button
                          className="p-0 size-8"
                          color="light"
                          onClick={() => setEditingTransactionId(transaction.id)}
                        >
                          <FiEdit />
                        </Button>
                        <Button
                          className="p-0 size-8"
                          color="light"
                          onClick={() => handleDelete(transaction.id)}
                        >
                          <FiTrash />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              )
            )
          )}
          {isLoading ||
            (isFetchingNextPage &&
              Array(10)
                .fill(0)
                .map((_, index) => (
                  <TableRow key={index} className="animate-pulse">
                    {Array(5)
                      .fill(0)
                      .map(() => (
                        <TableCell>
                          <div className="h-8 bg-gray-200 rounded-md dark:bg-gray-600"></div>
                        </TableCell>
                      ))}
                    <TableCell />
                  </TableRow>
                )))}
        </TableBodyWithButton>
      </Table>
      <InView
        onChange={(inView) => {
          if (!isLoading && !isFetchingNextPage && inView && hasNextPage) fetchNextPage()
        }}
      />
    </div>
  )
}
