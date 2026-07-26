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
  getGetUserIdSummaryAccountsQueryKey,
  getGetUserIdSummaryBalanceQueryKey,
  getGetUserIdSummaryCategoriesQueryKey,
  getGetUserIdTransactionsInfiniteQueryKey,
  getGetUserIdTransactionsTransactionIdQueryKey,
  useDeleteUserIdTransactionsTransactionId,
  useGetUserIdTransactionsInfinite,
} from "../API"
import { FiPlus, FiSearch, FiUpload } from "react-icons/fi"
import EditTransactionRow from "./Transactions/EditTransactionRow"
import TableBodyWithButton from "../Components/TableBodyWithButton"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  MouseEvent,
} from "react"
import { useQueryClient } from "@tanstack/react-query"

import BalanceGraph from "../Components/BalanceGraph"
import CategoryPie from "../Components/CategoryPie"
import UploadModal from "../Components/UploadModal"
import ConfirmDeleteModal from "../Components/ConfirmDeleteModal"
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
import { useMediaQuery } from "../Hooks/useMediaQuery"
import {
  TRANSACTION_TABLE_COLUMN_COUNT,
  useTransactionTableColumnWidths,
} from "./Transactions/transactionTableColumns"
import { useVirtualizedTransactionList } from "./Transactions/useVirtualizedTransactionList"
import { useVirtualizedTransactionCardList } from "./Transactions/useVirtualizedTransactionCardList"
import VirtualizedTransactionRows from "./Transactions/VirtualizedTransactionRows"
import VirtualizedTransactionCards from "./Transactions/VirtualizedTransactionCards"
import TransactionEditModal from "./Transactions/TransactionEditModal"
import TransactionSearchOverlay from "./Transactions/TransactionSearchOverlay"

export default function Transactions() {
  const isDesktop = useMediaQuery("(min-width: 768px)")
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

  const { mutateAsync: deleteTransaction } =
    useDeleteUserIdTransactionsTransactionId()

  const [accountFilterId, setAccountFilterId] = useState<string | undefined>(
    undefined,
  )
  const [categoryFilterId, setCategoryFilterId] = useState<string | undefined>(
    undefined,
  )
  const [searchQuery, setSearchQuery] = useState("")
  const isSearchActive = searchQuery.trim().length > 0

  const accountFilterOptions = useMemo(
    () =>
      accounts?.map((account) => ({
        label: account.name,
        value: account.id,
      })) || [],
    [accounts],
  )

  const categoryFilterOptions = useMemo(
    () =>
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
        : [],
    [categories],
  )

  const transactionListParams = useMemo(
    () => ({
      limit: 50,
      account_id: accountFilterId,
      category_id: categoryFilterId,
      ...(isSearchActive ? {} : summaryDateQuery),
    }),
    [accountFilterId, categoryFilterId, summaryDateQuery, isSearchActive],
  )

  const {
    data: encTransactions,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useGetUserIdTransactionsInfinite(userId, transactionListParams, {
    query: {
      enabled: !!userId,
      initialPageParam: "0",
      getNextPageParam: (lastPage) => lastPage.cursor ?? undefined,
    },
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

  const allTransactions = useMemo(
    () => transactions?.pages.flatMap((page) => page?.transactions ?? []) ?? [],
    [transactions],
  )

  const visibleTransactions = useMemo(
    () =>
      isSearchActive
        ? allTransactions.filter((t) =>
            transactionMatchesSearch(t, searchQuery),
          )
        : allTransactions,
    [allTransactions, isSearchActive, searchQuery],
  )

  useEffect(() => {
    if (!isSearchActive || isLoading || isFetchingNextPage || !hasNextPage)
      return
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
  const [showSearchOverlay, setShowSearchOverlay] = useState(false)
  const [editingTransactionId, setEditingTransactionId] = useState<
    string | undefined
  >(undefined)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | undefined>(
    undefined,
  )
  const searchInputRef = useRef<HTMLInputElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)

  const { columnWidths } = useTransactionTableColumnWidths({
    tableRef,
    accounts,
    categories,
    transactions: allTransactions,
    enabled: isDesktop,
  })

  const {
    virtualListStartRef,
    virtualizer,
    virtualItems,
    paddingTop,
    paddingBottom,
  } = useVirtualizedTransactionList({
    scrollContainerRef,
    rowCount: visibleTransactions.length,
    enabled: isDesktop && showVirtualizedRows,
    remeasureKey: editingTransactionId,
    layoutKey: showAdd,
  })

  const {
    virtualListStartRef: cardListStartRef,
    virtualizer: cardVirtualizer,
    virtualItems: cardVirtualItems,
    paddingTop: cardPaddingTop,
    paddingBottom: cardPaddingBottom,
  } = useVirtualizedTransactionCardList({
    scrollContainerRef,
    rowCount: visibleTransactions.length,
    enabled: !isDesktop && showVirtualizedRows,
    layoutKey: showAdd,
  })

  const closeTransactionModal = useCallback(() => {
    setShowAdd(false)
    setEditingTransactionId(undefined)
  }, [])

  const performDelete = useCallback(
    async (transactionId: string) => {
      await deleteTransaction({
        id: userId,
        transactionId,
      })
      if (editingTransactionId === transactionId) closeTransactionModal()
      setDeleteConfirmId(undefined)
      queryClient.invalidateQueries({
        queryKey: getGetUserIdTransactionsInfiniteQueryKey(userId),
      })
      queryClient.invalidateQueries({
        queryKey: getGetUserIdTransactionsTransactionIdQueryKey(
          userId,
          transactionId,
        ),
      })
      queryClient.invalidateQueries({
        queryKey: getGetUserIdSummaryAccountsQueryKey(userId),
      })
      queryClient.invalidateQueries({
        queryKey: getGetUserIdSummaryCategoriesQueryKey(userId),
      })
      queryClient.invalidateQueries({
        queryKey: getGetUserIdSummaryBalanceQueryKey(userId),
      })
    },
    [
      closeTransactionModal,
      deleteTransaction,
      editingTransactionId,
      queryClient,
      userId,
    ],
  )

  const requestDelete = useCallback(
    (transactionId: string, event?: MouseEvent<HTMLButtonElement>) => {
      if (event?.metaKey || event?.ctrlKey) {
        void performDelete(transactionId)
        return
      }
      setDeleteConfirmId(transactionId)
    },
    [performDelete],
  )

  useHotkey(HOTKEYS_BY_ID.openTransactionRow.combo, () => {
    if (!showAdd) setShowAdd(true)
  })

  useHotkey(
    HOTKEYS_BY_ID.focusTransactionSearch.combo,
    () => {
      if (isDesktop) searchInputRef.current?.focus()
      else setShowSearchOverlay(true)
    },
    { preventDefault: true },
  )

  const handleDelete = useCallback(
    (transactionId: string, event: MouseEvent<HTMLButtonElement>) => {
      requestDelete(transactionId, event)
    },
    [requestDelete],
  )

  const handleModalDelete = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (!editingTransactionId) return
      requestDelete(editingTransactionId, event)
    },
    [editingTransactionId, requestDelete],
  )

  const handleEdit = useCallback((transactionId: string) => {
    setEditingTransactionId(transactionId)
  }, [])

  const defaultCategoryId =
    categoryFilterId === "uncategorised" ? undefined : categoryFilterId

  const emptyStateMessage = useMemo(() => {
    if (allTransactions.length === 0 && !showAdd && !isLoading) {
      return "No transactions found"
    }
    if (
      isSearchActive &&
      visibleTransactions.length === 0 &&
      !isSearchingOlder
    ) {
      return "No transactions match your search"
    }
    if (isSearchingOlder) {
      return "Searching older transactions…"
    }
    return null
  }, [
    allTransactions.length,
    isLoading,
    isSearchActive,
    isSearchingOlder,
    showAdd,
    visibleTransactions.length,
  ])

  return (
    <div className="flex flex-col gap-2 px-4 pb-8 md:gap-4 md:pb-16 md:px-16">
      <UploadModal show={showUpload} onClose={() => setShowUpload(false)} />
      <ConfirmDeleteModal
        show={!!deleteConfirmId}
        onConfirm={() => {
          if (deleteConfirmId) void performDelete(deleteConfirmId)
        }}
        onCancel={() => setDeleteConfirmId(undefined)}
      />

      {!isDesktop && (
        <TransactionSearchOverlay
          show={showSearchOverlay}
          onClose={() => setShowSearchOverlay(false)}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />
      )}

      {!isDesktop && (showAdd || editingTransactionId) && (
        <TransactionEditModal
          show
          transactionId={editingTransactionId}
          defaultAccountId={accountFilterId}
          defaultCategoryId={defaultCategoryId}
          onClose={closeTransactionModal}
          onDelete={handleModalDelete}
        />
      )}

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
            className="hidden w-44 sm:w-52 md:block"
            icon={FiSearch}
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex items-center gap-2 md:hidden">
            <Button
              className="size-8 p-0"
              color={isSearchActive ? "blue" : "light"}
              aria-label="Search transactions"
              onClick={() => setShowSearchOverlay(true)}
            >
              <FiSearch />
            </Button>
            <Button
              className="size-8 p-0"
              color="light"
              aria-label="Add transaction"
              onClick={() => setShowAdd(true)}
            >
              <FiPlus />
            </Button>
            <Button
              className="size-8 p-0"
              aria-label="Import transactions"
              onClick={() => setShowUpload(true)}
            >
              <FiUpload />
            </Button>
          </div>
          <Button
            className="hidden md:inline-flex"
            onClick={() => setShowUpload(true)}
          >
            <FiUpload className="mr-2" />
            Import
          </Button>
        </div>
      </div>

      {!isDesktop && (
        <div className="flex flex-wrap items-center gap-3 md:hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Account
            </span>
            <FilterButton
              options={accountFilterOptions}
              selected={accountFilterId}
              onValueChange={(value) => setAccountFilterId(value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Category
            </span>
            <FilterButton
              options={categoryFilterOptions}
              selected={categoryFilterId}
              onValueChange={(value) => setCategoryFilterId(value)}
            />
          </div>
        </div>
      )}

      {isDesktop ? (
        <div className="-mx-4 md:mx-0">
          <Table
            ref={tableRef}
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
              {columnWidths.map((width, index) => (
                <col
                  key={index}
                  style={width ? { width: `${width}px` } : undefined}
                />
              ))}
            </colgroup>
            <TableHead>
              <TableRow>
                <TableHeadCell>Date</TableHeadCell>
                <TableHeadCell>
                  <div className="flex items-center">
                    <p className="after:content-['Acc'] after:md:content-['Account']" />
                    <FilterButton
                      options={accountFilterOptions}
                      selected={accountFilterId}
                      onValueChange={(value) => setAccountFilterId(value)}
                    />
                  </div>
                </TableHeadCell>
                <TableHeadCell>
                  <div className="flex items-center">
                    <p className="after:content-['Cat'] after:md:content-['Category']" />
                    <FilterButton
                      options={categoryFilterOptions}
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
                  defaultCategoryId={defaultCategoryId}
                />
              )}
              {emptyStateMessage ? (
                <TableRow>
                  <TableCell
                    colSpan={TRANSACTION_TABLE_COLUMN_COUNT}
                    className={`text-center ${
                      isSearchingOlder ? "text-gray-500 dark:text-gray-400" : ""
                    }`}
                  >
                    {emptyStateMessage}
                  </TableCell>
                </TableRow>
              ) : (
                <VirtualizedTransactionRows
                  virtualListStartRef={virtualListStartRef}
                  showAdd={showAdd}
                  paddingTop={paddingTop}
                  paddingBottom={paddingBottom}
                  virtualItems={virtualItems}
                  transactions={visibleTransactions}
                  editingTransactionId={editingTransactionId}
                  virtualizer={virtualizer}
                  accountColorMap={accountColorMap}
                  categoryColorMap={categoryColorMap}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onCancelEdit={() => setEditingTransactionId(undefined)}
                />
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
      ) : (
        <div className="flex flex-col gap-2">
          {emptyStateMessage && (
            <p
              className={`text-center ${
                isSearchingOlder
                  ? "text-gray-500 dark:text-gray-400"
                  : "text-gray-900 dark:text-white"
              }`}
            >
              {emptyStateMessage}
            </p>
          )}
          {showVirtualizedRows && (
            <VirtualizedTransactionCards
              virtualListStartRef={cardListStartRef}
              paddingTop={cardPaddingTop}
              paddingBottom={cardPaddingBottom}
              virtualItems={cardVirtualItems}
              transactions={visibleTransactions}
              virtualizer={cardVirtualizer}
              accountColorMap={accountColorMap}
              categoryColorMap={categoryColorMap}
              onEdit={handleEdit}
            />
          )}
          {(isLoading || isFetchingNextPage) &&
            Array(5)
              .fill(0)
              .map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                >
                  <div className="flex justify-between gap-3">
                    <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-600" />
                    <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-600" />
                  </div>
                  <div className="mt-2 h-5 w-full rounded bg-gray-200 dark:bg-gray-600" />
                  <div className="mt-2 h-5 w-32 rounded bg-gray-200 dark:bg-gray-600" />
                </div>
              ))}
        </div>
      )}

      {!isSearchActive && (
        <InView
          onChange={(inView) => {
            if (!isLoading && !isFetchingNextPage && inView && hasNextPage)
              fetchNextPage()
          }}
        />
      )}
    </div>
  )
}
