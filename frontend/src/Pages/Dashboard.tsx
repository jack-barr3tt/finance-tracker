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

export default function Dashboard() {
  const { userId } = useUser()
  const queryClient = useQueryClient()
  const { data: accountSummaries } = useGetUserByIdSummaryAccounts({
    path: { id: userId },
  })
  const { data: accounts } = useGetUserByIdAccounts({ path: { id: userId } })
  const { data: categories } = useGetUserByIdCategories({ path: { id: userId } })
  const { mutateAsync: deleteTransaction } = useDeleteUserByIdTransactionsByTransactionId()

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
    data: transactions,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useGetUserByIdTransactionsInfinite({
    path: { id: userId },
    query: { limit: 50, account_id: accountFilterId, category_id: categoryFilterId },
  })

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
    <div className="flex flex-col gap-4 px-16 pb-16 overflow-y-auto">
      <UploadModal show={showUpload} onClose={() => setShowUpload(false)} />

      <h2 className="text-2xl font-medium">Accounts</h2>
      {accountSummaries?.length === 0 ? (
        <p className="text-gray-500">No accounts found</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            {accountSummaries?.map((account) => (
              <Card>
                <div className="grid grid-cols-2 gap-2">
                  <h1 className="font-medium">{account.account.name}</h1>
                  <h2 className="font-light">{account.account.bank.name}</h2>
                  <p className="col-span-2 text-4xl">
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

      <HR />

      <div className="flex flex-row items-center gap-4">
        <CategoryPie colorMap={categoryColorMap} />
        <BalanceGraph colorMap={accountColorMap} />
      </div>

      <HR />

      <div className="flex flex-row items-center justify-between">
        <h2 className="text-2xl font-medium">Transactions</h2>
        <Button onClick={() => setShowUpload(true)}>
          <FiUpload className="mr-2" />
          Import
        </Button>
      </div>

      <Table striped>
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
                          backgroundColor: accountColorMap[transaction.account.id].fill,
                          color: accountColorMap[transaction.account.id].text,
                        }}
                        className="w-fit"
                      >
                        {transaction.account.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        style={{
                          backgroundColor:
                            categoryColorMap[transaction.category?.id || "uncategorised"].fill,
                          color: categoryColorMap[transaction.category?.id || "uncategorised"].text,
                        }}
                        className="w-fit"
                      >
                        {transaction.category?.name || "Uncategorised"}
                      </Badge>
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
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
