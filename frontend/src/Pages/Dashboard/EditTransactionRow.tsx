import {
  TableRow,
  TableCell,
  Datepicker,
  TextInput,
  Button,
  ThemeProvider,
  createTheme,
} from "flowbite-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { FiSave, FiX } from "react-icons/fi"
import {
  useGetUserByIdAccounts,
  useGetUserByIdCategories,
  UseGetUserByIdSummaryAccountsKeyFn,
  UseGetUserByIdSummaryBalanceKeyFn,
  UseGetUserByIdSummaryCategoriesKeyFn,
  useGetUserByIdTransactionsByTransactionId,
  UseGetUserByIdTransactionsByTransactionIdKeyFn,
  UseGetUserByIdTransactionsKeyFn,
  usePatchUserByIdTransactionsByTransactionId,
  usePostUserByIdTransactions,
} from "../../API/queries"
import { useUser } from "../../Hooks/useUser"
import SearchSelect from "../../Components/SearchSelect"
import { useQueryClient } from "@tanstack/react-query"
import { useAsyncMemo } from "../../Hooks/useAsyncMemo"
import { decryptAccount, decryptCategory } from "../../Security/data"

type EditTransactionRowProps = {
  transactionId?: string
  cancelCallback?: () => void
}

export default function EditTransactionRow(props: EditTransactionRowProps) {
  const { transactionId, cancelCallback } = props

  const { userId, decrypt, encrypt } = useUser()
  const queryClient = useQueryClient()
  const { data: encAccounts } = useGetUserByIdAccounts({ path: { id: userId } })
  const accounts = useAsyncMemo(
    async () => Promise.all(encAccounts?.map((acc) => decryptAccount(acc, decrypt)) ?? []),
    [decrypt, encAccounts]
  )
  const { data: encCategories } = useGetUserByIdCategories({ path: { id: userId } })
  const categories = useAsyncMemo(
    async () => Promise.all(encCategories?.map((cat) => decryptCategory(cat, decrypt)) ?? []),
    [decrypt, encCategories]
  )

  const { mutateAsync: addTransaction } = usePostUserByIdTransactions()
  const { mutateAsync: editTransaction } = usePatchUserByIdTransactionsByTransactionId()
  const { data: transaction } = useGetUserByIdTransactionsByTransactionId(
    {
      path: { id: userId, transaction_id: transactionId || "" },
    },
    undefined,
    {
      enabled: !!transactionId,
    }
  )

  const [accountSearch, setAccountSearch] = useState<string | undefined>(undefined)
  const [categorySearch, setCategorySearch] = useState<string | undefined>(undefined)

  const [date, setDate] = useState<Date | null>(null)
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [selectedAccount, setSelectedAccount] = useState<string | undefined>(undefined)
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined)

  useEffect(() => {
    ;(async () => {
      if (transaction) {
        setDate(new Date(transaction.date))
        setDescription(await decrypt(transaction.description || ""))
        setAmount(transaction.amount.toString())
        setSelectedAccount(transaction.account.id)
        setSelectedCategory(transaction.category?.id)
      }
    })()
  }, [decrypt, transaction])

  const handleAdd = useCallback(async () => {
    if (!date || !selectedAccount || !selectedCategory || !amount) return

    await addTransaction({
      body: {
        account_id: selectedAccount,
        category_id: selectedCategory,
        description: await encrypt(description),
        amount: parseFloat(amount),
        date: date.toISOString(),
      },
      path: { id: userId },
    })
    queryClient.invalidateQueries({
      queryKey: UseGetUserByIdTransactionsKeyFn({ path: { id: userId } }),
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
    if (!transactionId || !date || !selectedAccount || !selectedCategory || !amount) return
    await editTransaction({
      body: {
        account_id: selectedAccount,
        category_id: selectedCategory,
        description: await encrypt(description),
        amount: parseFloat(amount),
        date: date.toISOString(),
      },
      path: { id: userId, transaction_id: transactionId },
    })
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
    []
  )

  if (!accounts || !categories) return null

  return (
    <ThemeProvider theme={tableTheme}>
      <TableRow>
        <TableCell>
          <Datepicker value={date} onChange={setDate} />
        </TableCell>
        <TableCell>
          <SearchSelect
            value={selectedAccount}
            options={accounts
              .filter(
                (account) =>
                  !accountSearch || account.name.toLowerCase().includes(accountSearch.toLowerCase())
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
        <TableCell>
          <SearchSelect
            value={selectedCategory}
            options={categories
              .filter(
                (category) =>
                  !categorySearch ||
                  category.name.toLowerCase().includes(categorySearch.toLowerCase())
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
        <TableCell>
          <TextInput
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </TableCell>
        <TableCell>
          <TextInput
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </TableCell>
        <TableCell>
          <div className="flex flex-row items-center justify-end gap-2">
            <Button
              className="p-0 size-8"
              color="light"
              onClick={transactionId ? handleEdit : handleAdd}
            >
              <FiSave />
            </Button>
            <Button className="p-0 size-8" color="light" onClick={cancelCallback}>
              <FiX />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    </ThemeProvider>
  )
}
