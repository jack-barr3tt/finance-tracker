import {
  Badge,
  Button,
  HR,
  TabItem,
  Table,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Tabs,
  Tooltip,
} from "flowbite-react"
import { useUser } from "../Hooks/useUser"
import {
  useDeleteUserByIdTransactionsByTransactionId,
  UseGetUserByIdSummaryAccountsKeyFn,
  UseGetUserByIdSummaryBalanceKeyFn,
  UseGetUserByIdSummaryCategoriesKeyFn,
  UseGetUserByIdTransactionsByTransactionIdKeyFn,
  UseGetUserByIdTransactionsKeyFn,
} from "../API/queries"
import { FiEdit, FiPlus, FiTrash, FiUpload } from "react-icons/fi"
import EditTransactionRow from "./Transactions/EditTransactionRow"
import TableBodyWithButton from "../Components/TableBodyWithButton"
import { useCallback, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

import BalanceGraph from "../Components/BalanceGraph"
import CategoryPie from "../Components/CategoryPie"
import UploadModal from "../Components/UploadModal"
import { useGetUserByIdTransactionsInfinite } from "../API/queries/infiniteQueries"
import { InView } from "react-intersection-observer"
import { format, parseISO } from "date-fns"
import FilterButton from "../Components/FilterButton"
import { useAsyncMemo } from "../Hooks/useAsyncMemo"
import { decryptTransaction } from "../Security/data"
import AccountSummaries from "../Components/AccountSummaries"
import { TimePeriodSchema } from "../API/requests"
import { useData } from "../Hooks/useData"

export default function Transactions() {
  const { userId, decrypt } = useUser()
  const { setDataPeriod, accounts, categories, accountColorMap, categoryColorMap } = useData()
  const queryClient = useQueryClient()

  const { mutateAsync: deleteTransaction } = useDeleteUserByIdTransactionsByTransactionId()

  const [accountFilterId, setAccountFilterId] = useState<string | undefined>(undefined)
  const [categoryFilterId, setCategoryFilterId] = useState<string | undefined>(undefined)

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
            page?.transactions.map((t) => decryptTransaction(t, decrypt)) ?? [],
          ),
        })) ?? [],
      ),
    }),
    [encTransactions, decrypt],
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
    [deleteTransaction, userId, editingTransactionId, queryClient],
  )

  return (
    <div className="flex flex-col gap-2 px-8 pb-8 md:gap-4 md:pb-16 md:px-16">
      <UploadModal show={showUpload} onClose={() => setShowUpload(false)} />

      <AccountSummaries />

      <HR />

      <Tabs
        variant="pills"
        onActiveTabChange={(tab) => setDataPeriod(TimePeriodSchema.enum[tab])}
        className="-my-4"
      >
        <TabItem title="Week" />
        <TabItem title="Month" />
        <TabItem title="Year" active />
        <TabItem title="YTD" />
        <TabItem title="All" />
      </Tabs>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 *:w-full md:gap-4">
        <CategoryPie />
        <BalanceGraph />
      </div>

      <HR />

      <div className="flex flex-row items-center justify-between mb-2 md:mb-0">
        <h2 className="text-2xl font-medium">Transactions</h2>
        <Button onClick={() => setShowUpload(true)}>
          <FiUpload className="mr-2" />
          Import
        </Button>
      </div>

      <div className="-mx-8 md:mx-0">
        <Table
          striped
          theme={{
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
          }}
        >
          <TableHead>
            <TableRow>
              <TableHeadCell>Date</TableHeadCell>
              <TableHeadCell>
                <div className="flex items-center">
                  <p className="after:content-['Acc'] after:md:content-['Account']" />
                  <FilterButton
                    options={
                      accounts?.map((account) => ({
                        label: account.name,
                        value: account.id,
                      })) || []
                    }
                    selected={accountFilterId}
                    onValueChange={(value) => setAccountFilterId(value)}
                  />
                </div>
              </TableHeadCell>
              <TableHeadCell>
                <div className="flex items-center">
                  <p className="after:content-['Cat'] after:md:content-['Category']" />
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
                    selected={categoryFilterId}
                    onValueChange={(value) => setCategoryFilterId(value)}
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
            {transactions?.pages.reduce(
              (acc, page) => acc + (page?.transactions.length || 0),
              0,
            ) === 0 && !showAdd ? (
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
                      <TableCell theme={{ base: "max-sm:p-0" }}>
                        <div className="flex items-center">
                          <Badge
                            style={{
                              backgroundColor: accountColorMap[transaction.account.id]?.fill,
                              color: accountColorMap[transaction.account.id]?.text,
                            }}
                            className="w-8 h-8 -mx-2 md:h-5 md:w-fit"
                          >
                            <span className="hidden md:block">{transaction.account.name}</span>
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell theme={{ base: "max-sm:p-0" }}>
                        <div className="flex items-center">
                          <Badge
                            style={{
                              backgroundColor:
                                categoryColorMap[transaction.category?.id || "uncategorised"]?.fill,
                              color:
                                categoryColorMap[transaction.category?.id || "uncategorised"]?.text,
                            }}
                            className="w-8 h-8 -mx-2 md:h-5 md:w-fit"
                          >
                            <span className="hidden md:block">
                              {transaction.category?.name || "Uncategorised"}
                            </span>
                          </Badge>
                        </div>
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
                  ),
                ),
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
      </div>

      <InView
        onChange={(inView) => {
          if (!isLoading && !isFetchingNextPage && inView && hasNextPage) fetchNextPage()
        }}
      />
    </div>
  )
}
