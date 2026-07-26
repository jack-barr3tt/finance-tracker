import {
  TableRow,
  TableCell,
  TextInput,
  Button,
  ThemeProvider,
  createTheme,
} from "flowbite-react"
import { format, parseISO } from "date-fns"
import { Ref, useCallback, useEffect, useMemo, useState } from "react"
import { FiSave, FiX } from "react-icons/fi"
import {
  getGetUserIdSummaryAccountsQueryKey,
  getGetUserIdSummaryBalanceQueryKey,
  getGetUserIdSummaryCategoriesQueryKey,
  getGetUserIdTransactionsInfiniteQueryKey,
  getGetUserIdTransactionsTransactionIdQueryKey,
  useGetUserIdAccounts,
  useGetUserIdCategories,
  useGetUserIdTransactionsTransactionId,
  usePatchUserIdTransactionsTransactionId,
  usePostUserIdTransactions,
} from "../../API"
import { useUser } from "../../Hooks/useUser"
import SearchSelect from "../../Components/SearchSelect"
import CalendarDatePicker from "../../Components/CalendarDatePicker"
import { useQueryClient } from "@tanstack/react-query"
import { useAsyncMemo } from "../../Hooks/useAsyncMemo"
import { decryptAccount, decryptCategory } from "../../Security/data"
import { useHotkey } from "@tanstack/react-hotkeys"
import { HOTKEYS_BY_ID } from "../../Hotkeys/hotkeys"
import { transactionTableCellClass } from "./transactionTableColumns"

type EditTransactionRowProps = {
  transactionId?: string
  cancelCallback?: () => void
  defaultAccountId?: string
  defaultCategoryId?: string
  rowRef?: Ref<HTMLTableRowElement>
  "data-index"?: number
}

export default function EditTransactionRow(props: EditTransactionRowProps) {
  const {
    transactionId,
    cancelCallback,
    defaultAccountId,
    defaultCategoryId,
    rowRef,
    ...rowProps
  } = props

  const { userId, decrypt, encrypt } = useUser()
  const queryClient = useQueryClient()
  const { data: encAccounts } = useGetUserIdAccounts(userId)
  const accounts = useAsyncMemo(
    async () =>
      (
        await Promise.all(
          encAccounts?.map((acc) => decryptAccount(acc, decrypt)) ?? [],
        )
      ).sort((a, b) => a.name.localeCompare(b.name)),
    [decrypt, encAccounts],
  )
  const { data: encCategories } = useGetUserIdCategories(userId)
  const categories = useAsyncMemo(
    async () =>
      (
        await Promise.all(
          encCategories?.map((cat) => decryptCategory(cat, decrypt)) ?? [],
        )
      ).sort((a, b) => a.name.localeCompare(b.name)),
    [decrypt, encCategories],
  )

  const { mutateAsync: addTransaction } = usePostUserIdTransactions()
  const { mutateAsync: editTransaction } =
    usePatchUserIdTransactionsTransactionId()
  const { data: transaction } = useGetUserIdTransactionsTransactionId(
    userId,
    transactionId || "",
    {
      query: { enabled: !!transactionId },
    },
  )

  const [accountSearch, setAccountSearch] = useState<string | undefined>(
    undefined,
  )
  const [categorySearch, setCategorySearch] = useState<string | undefined>(
    undefined,
  )

  const [date, setDate] = useState<Date | null>(null)
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [selectedAccount, setSelectedAccount] = useState<string | undefined>(
    transactionId ? undefined : defaultAccountId,
  )
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    transactionId ? undefined : defaultCategoryId,
  )

  useEffect(() => {
    ;(async () => {
      if (transaction) {
        setDate(parseISO(transaction.date))
        setDescription(await decrypt(transaction.description || ""))
        setAmount(transaction.amount.toString())
        setSelectedAccount(transaction.account.id)
        setSelectedCategory(transaction.category?.id)
      }
    })()
  }, [decrypt, transaction])

  useEffect(() => {
    if (!cancelCallback) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      e.preventDefault()
      cancelCallback()
    }

    document.addEventListener("keydown", onKeyDown, true)
    return () => document.removeEventListener("keydown", onKeyDown, true)
  }, [cancelCallback])

  const handleAdd = useCallback(async () => {
    if (!date || !selectedAccount || !selectedCategory || !amount) return

    await addTransaction({
      id: userId,
      data: {
        account_id: selectedAccount,
        category_id: selectedCategory,
        description: await encrypt(description),
        amount: parseFloat(amount),
        date: format(date, "yyyy-MM-dd"),
      },
    })
    queryClient.invalidateQueries({
      queryKey: getGetUserIdTransactionsInfiniteQueryKey(userId),
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
    // Reset the form fields
    setDate(null)
    setDescription("")
    setAmount("")
    setSelectedAccount(undefined)
    setSelectedCategory(undefined)
    // Reset the search inputs
    setAccountSearch("")
    setCategorySearch("")

    cancelCallback?.()
  }, [
    addTransaction,
    amount,
    cancelCallback,
    date,
    description,
    encrypt,
    queryClient,
    selectedAccount,
    selectedCategory,
    userId,
  ])

  const handleEdit = useCallback(async () => {
    if (!transactionId || !date || !selectedAccount || !amount) return
    await editTransaction({
      id: userId,
      transactionId,
      data: {
        account_id: selectedAccount,
        category_id: selectedCategory,
        description: await encrypt(description),
        amount: parseFloat(amount),
        date: format(date, "yyyy-MM-dd"),
      },
    })
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
    // Reset the form fields
    setDate(null)
    setDescription("")
    setAmount("")
    setSelectedAccount(undefined)
    setSelectedCategory(undefined)
    // Reset the search inputs
    setAccountSearch("")
    setCategorySearch("")

    cancelCallback?.()
  }, [
    amount,
    cancelCallback,
    date,
    description,
    editTransaction,
    encrypt,
    queryClient,
    selectedAccount,
    selectedCategory,
    transactionId,
    userId,
  ])

  const tableTheme = useMemo(
    () =>
      createTheme({
        table: {
          body: {
            cell: {
              base: "px-[18px] py-[10px]",
            },
          },
        },
        textInput: {
          field: {
            input: { sizes: { md: "p-[5px]" } },
          },
        },
      }),
    [],
  )

  const doneFn = useMemo(
    () => (transactionId ? handleEdit : handleAdd),
    [handleAdd, handleEdit, transactionId],
  )

  useHotkey(HOTKEYS_BY_ID.submitTransactionRow.combo, doneFn)

  if (!accounts || !categories) return null
  if (transactionId && !date) return null

  return (
    <ThemeProvider theme={tableTheme}>
      <TableRow ref={rowRef} {...rowProps}>
        <TableCell className={transactionTableCellClass.date}>
          <CalendarDatePicker value={date} onChange={setDate} autoFocus />
        </TableCell>
        <TableCell className={transactionTableCellClass.account}>
          <SearchSelect
            value={selectedAccount}
            options={accounts
              .filter(
                (account) =>
                  !accountSearch ||
                  account.name
                    .toLowerCase()
                    .includes(accountSearch.toLowerCase()),
              )
              .map((account) => ({
                label: account.name,
                value: account.id,
              }))}
            placeholder="Select account"
            onSearchChange={setAccountSearch}
            onValueChange={setSelectedAccount}
          />
        </TableCell>
        <TableCell className={transactionTableCellClass.category}>
          <SearchSelect
            value={selectedCategory}
            options={categories
              .filter(
                (category) =>
                  !categorySearch ||
                  category.name
                    .toLowerCase()
                    .includes(categorySearch.toLowerCase()),
              )
              .map((category) => ({
                label: category.name,
                value: category.id,
              }))}
            placeholder="Select category"
            onSearchChange={setCategorySearch}
            onValueChange={setSelectedCategory}
          />
        </TableCell>
        <TableCell className={transactionTableCellClass.description}>
          <TextInput
            className="min-w-0"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </TableCell>
        <TableCell className={transactionTableCellClass.amount}>
          <TextInput
            className="min-w-0"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </TableCell>
        <TableCell className={transactionTableCellClass.actions}>
          <div className="flex flex-row items-center justify-end gap-2">
            <Button
              className="p-0 shrink-0 size-8"
              color="light"
              onClick={doneFn}
            >
              <FiSave />
            </Button>
            <Button
              className="p-0 shrink-0 size-8"
              color="light"
              onClick={cancelCallback}
            >
              <FiX />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    </ThemeProvider>
  )
}
