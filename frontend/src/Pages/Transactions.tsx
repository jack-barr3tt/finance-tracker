import {
  Button,
  HR,
  Table,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  TextInput,
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
import { FiPlus, FiSearch, FiUpload } from "react-icons/fi"
import EditTransactionRow from "./Transactions/EditTransactionRow"
import TransactionRow from "./Transactions/TransactionRow"
import TableBodyWithButton from "../Components/TableBodyWithButton"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useVirtualizer } from "@tanstack/react-virtual"

import BalanceGraph from "../Components/BalanceGraph"
import CategoryPie from "../Components/CategoryPie"
import UploadModal from "../Components/UploadModal"
import { useGetUserByIdTransactionsInfinite } from "../API/queries/infiniteQueries"
import { InView } from "react-intersection-observer"
import FilterButton from "../Components/FilterButton"
import { useAsyncMemo } from "../Hooks/useAsyncMemo"
import { decryptTransaction } from "../Security/data"
import AccountSummaries from "../Components/AccountSummaries"
import { useData } from "../Hooks/useData"
import { useHotkey } from "@tanstack/react-hotkeys"
import { HOTKEYS_BY_ID } from "../Hotkeys/hotkeys"
import { transactionMatchesSearch } from "../utils/transactionSearch"
import { useScrollContainer } from "../Hooks/useScrollContainer"
import {
  TRANSACTION_TABLE_COLUMN_COUNT,
  TRANSACTION_TABLE_COLUMN_WIDTHS,
} from "./Transactions/transactionTableLayout"

const TRANSACTION_ROW_ESTIMATE_HEIGHT = 52

export default function Transactions() {
  const { userId, decrypt } = useUser()
  const {
    summaryDateQuery,
    accounts,
    categories,
    accountColorMap,
    categoryColorMap,
  } = useData()
  const queryClient = useQueryClient()
  const scrollContainerRef = useScrollContainer()

  const { mutateAsync: deleteTransaction } = useDeleteUserByIdTransactionsByTransactionId()

  const [accountFilterId, setAccountFilterId] = useState<string | undefined>(undefined)
  const [categoryFilterId, setCategoryFilterId] = useState<string | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState("")

  const transactionListOptions = useMemo(
    () => ({
      path: { id: userId },
      query: {
        limit: 50,
        account_id: accountFilterId,
        category_id: categoryFilterId,
        ...summaryDateQuery,
      },
    }),
    [userId, accountFilterId, categoryFilterId, summaryDateQuery],
  )

  const {
    data: encTransactions,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useGetUserByIdTransactionsInfinite(transactionListOptions)

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

  const allTransactions = useMemo(
    () => transactions?.pages.flatMap((page) => page?.transactions ?? []) ?? [],
    [transactions],
  )

  const isSearchActive = searchQuery.trim().length > 0

  const visibleTransactions = useMemo(
    () =>
      isSearchActive
        ? allTransactions.filter((t) => transactionMatchesSearch(t, searchQuery))
        : allTransactions,
    [allTransactions, isSearchActive, searchQuery],
  )

  useEffect(() => {
    if (!isSearchActive || isLoading || isFetchingNextPage || !hasNextPage) return
    fetchNextPage()
  }, [
    isSearchActive,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    encTransactions?.pages.length,
  ])

  const isSearchingOlder =
    isSearchActive &&
    visibleTransactions.length === 0 &&
    (isLoading || isFetchingNextPage || hasNextPage)

  const showVirtualizedRows =
    visibleTransactions.length > 0 && !isSearchingOlder

  const [showAdd, setShowAdd] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [editingTransactionId, setEditingTransactionId] = useState<string | undefined>(undefined)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const virtualListStartRef = useRef<HTMLTableRowElement>(null)
  const [scrollMargin, setScrollMargin] = useState(0)

  const virtualizer = useVirtualizer({
    count: showVirtualizedRows ? visibleTransactions.length : 0,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => TRANSACTION_ROW_ESTIMATE_HEIGHT,
    overscan: 10,
    scrollMargin,
  })

  const updateScrollMargin = useCallback(() => {
    const scrollEl = scrollContainerRef.current
    const listEl = virtualListStartRef.current
    if (!scrollEl || !listEl) return

    let offsetTop = 0
    let el: HTMLElement | null = listEl
    while (el && el !== scrollEl) {
      offsetTop += el.offsetTop
      el = el.offsetParent as HTMLElement | null
    }
    setScrollMargin(offsetTop)
  }, [scrollContainerRef])

  useLayoutEffect(() => {
    updateScrollMargin()

    const scrollEl = scrollContainerRef.current
    const listEl = virtualListStartRef.current
    if (!scrollEl || !listEl) return

    const observer = new ResizeObserver(updateScrollMargin)
    observer.observe(scrollEl)
    observer.observe(listEl)

    return () => {
      observer.disconnect()
    }
  }, [scrollContainerRef, updateScrollMargin, showAdd, showVirtualizedRows])

  useEffect(() => {
    if (editingTransactionId) {
      virtualizer.measure()
    }
  }, [editingTransactionId, virtualizer])

  useHotkey(HOTKEYS_BY_ID.openTransactionRow.combo, () => {
    if (!showAdd) setShowAdd(true)
  })

  useHotkey(
    HOTKEYS_BY_ID.focusTransactionSearch.combo,
    () => searchInputRef.current?.focus(),
    { preventDefault: true },
  )

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

  const handleEdit = useCallback((transactionId: string) => {
    setEditingTransactionId(transactionId)
  }, [])

  const virtualItems = virtualizer.getVirtualItems()
  const paddingTop =
    virtualItems.length > 0
      ? Math.max(0, virtualItems[0].start - scrollMargin)
      : 0
  const paddingBottom =
    virtualItems.length > 0
      ? Math.max(0, virtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end)
      : 0

  return (
    <div className="flex flex-col gap-2 px-8 pb-8 md:gap-4 md:pb-16 md:px-16">
      <UploadModal show={showUpload} onClose={() => setShowUpload(false)} />

      <AccountSummaries />

      <HR />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 *:w-full md:gap-4">
        <CategoryPie />
        <BalanceGraph />
      </div>

      <HR />

      <div className="flex flex-row items-center justify-between mb-2 md:mb-0">
        <h2 className="text-2xl font-medium">Transactions</h2>
        <div className="flex items-center gap-2">
          <TextInput
            ref={searchInputRef}
            className="w-44 sm:w-52"
            icon={FiSearch}
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button onClick={() => setShowUpload(true)}>
            <FiUpload className="mr-2" />
            Import
          </Button>
        </div>
      </div>

      <div className="-mx-8 md:mx-0">
        <Table
          striped
          theme={{
            root: {
              base: "w-full table-fixed text-left text-sm text-gray-500 dark:text-gray-400",
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
          <colgroup>
            {TRANSACTION_TABLE_COLUMN_WIDTHS.map((width, index) => (
              <col key={index} style={width ? { width } : undefined} />
            ))}
          </colgroup>
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
            {showAdd && (
              <EditTransactionRow
                cancelCallback={() => setShowAdd(false)}
                defaultAccountId={accountFilterId}
                defaultCategoryId={
                  categoryFilterId === "uncategorised" ? undefined : categoryFilterId
                }
              />
            )}
            {allTransactions.length === 0 && !showAdd && !isLoading ? (
              <TableRow>
                <TableCell colSpan={TRANSACTION_TABLE_COLUMN_COUNT} className="text-center">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : isSearchActive && visibleTransactions.length === 0 && !isSearchingOlder ? (
              <TableRow>
                <TableCell colSpan={TRANSACTION_TABLE_COLUMN_COUNT} className="text-center">
                  No transactions match your search
                </TableCell>
              </TableRow>
            ) : isSearchingOlder ? (
              <TableRow>
                <TableCell
                  colSpan={TRANSACTION_TABLE_COLUMN_COUNT}
                  className="text-center text-gray-500 dark:text-gray-400"
                >
                  Searching older transactions…
                </TableCell>
              </TableRow>
            ) : (
              <>
                <tr ref={virtualListStartRef} aria-hidden="true" className="h-0 border-0">
                  <td colSpan={TRANSACTION_TABLE_COLUMN_COUNT} className="h-0 border-0 p-0" />
                </tr>
                {paddingTop > 0 && (
                  <TableRow aria-hidden="true">
                    <TableCell
                      colSpan={TRANSACTION_TABLE_COLUMN_COUNT}
                      className="border-0 p-0"
                      style={{ height: paddingTop }}
                    />
                  </TableRow>
                )}
                {virtualItems.map((virtualRow) => {
                  const transaction = visibleTransactions[virtualRow.index]
                  if (editingTransactionId === transaction.id) {
                    return (
                      <EditTransactionRow
                        key={transaction.id}
                        transactionId={transaction.id}
                        cancelCallback={() => setEditingTransactionId(undefined)}
                        rowRef={virtualizer.measureElement}
                        data-index={virtualRow.index}
                      />
                    )
                  }

                  return (
                    <TransactionRow
                      key={transaction.id}
                      ref={virtualizer.measureElement}
                      data-index={virtualRow.index}
                      transaction={transaction}
                      accountColorMap={accountColorMap}
                      categoryColorMap={categoryColorMap}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  )
                })}
                {paddingBottom > 0 && (
                  <TableRow aria-hidden="true">
                    <TableCell
                      colSpan={TRANSACTION_TABLE_COLUMN_COUNT}
                      className="border-0 p-0"
                      style={{ height: paddingBottom }}
                    />
                  </TableRow>
                )}
              </>
            )}
            {(isLoading || isFetchingNextPage) &&
              Array(10)
                .fill(0)
                .map((_, index) => (
                  <TableRow key={index} className="animate-pulse">
                    {Array(5)
                      .fill(0)
                      .map((_, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <div className="h-8 bg-gray-200 rounded-md dark:bg-gray-600"></div>
                        </TableCell>
                      ))}
                    <TableCell />
                  </TableRow>
                ))}
          </TableBodyWithButton>
        </Table>
      </div>

      {!isSearchActive && (
        <InView
          onChange={(inView) => {
            if (!isLoading && !isFetchingNextPage && inView && hasNextPage) fetchNextPage()
          }}
        />
      )}
    </div>
  )
}
