import { TableRow, TableCell, TextInput, Button, ThemeProvider, createTheme } from "flowbite-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { FiSave, FiX } from "react-icons/fi"
import {
  useGetUserByIdCategories,
  useGetUserByIdBudgetTransactionsByBudgetTransactionId,
  UseGetUserByIdBudgetTransactionsKeyFn,
  UseGetUserByIdBudgetTransactionsByBudgetTransactionIdKeyFn,
  usePatchUserByIdBudgetTransactionsByBudgetTransactionId,
  usePostUserByIdBudgetTransactions,
} from "../../API/queries"
import { useUser } from "../../Hooks/useUser"
import SearchSelect from "../../Components/SearchSelect"
import { useQueryClient } from "@tanstack/react-query"
import { useAsyncMemo } from "../../Hooks/useAsyncMemo"
import { decryptCategory } from "../../Security/data"
import { PeriodUnit } from "../../API/requests"

type EditBudgetTransactionRowProps = {
  budgetTransactionId?: string
  cancelCallback?: () => void
  isOutgoings?: boolean
}

export default function EditBudgetTransactionRow(props: EditBudgetTransactionRowProps) {
  const { budgetTransactionId, cancelCallback, isOutgoings = false } = props

  const { userId, decrypt, encrypt } = useUser()
  const queryClient = useQueryClient()
  const { data: encCategories } = useGetUserByIdCategories({ path: { id: userId } })
  const categories = useAsyncMemo(
    async () =>
      (await Promise.all(encCategories?.map((cat) => decryptCategory(cat, decrypt)) ?? [])).sort(
        (a, b) => a.name.localeCompare(b.name)
      ),
    [decrypt, encCategories]
  )

  const { mutateAsync: addBudgetTransaction } = usePostUserByIdBudgetTransactions()
  const { mutateAsync: editBudgetTransaction } =
    usePatchUserByIdBudgetTransactionsByBudgetTransactionId()
  const { data: budgetTransaction } = useGetUserByIdBudgetTransactionsByBudgetTransactionId(
    {
      path: { id: userId, budget_transaction_id: budgetTransactionId || "" },
    },
    undefined,
    {
      enabled: !!budgetTransactionId,
    }
  )

  const [categorySearch, setCategorySearch] = useState<string | undefined>(undefined)

  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined)
  const [repeatUntil, setRepeatUntil] = useState<PeriodUnit>("month")
  const [repeatEvery, setRepeatEvery] = useState("")

  useEffect(() => {
    ;(async () => {
      if (budgetTransaction) {
        setDescription(await decrypt(budgetTransaction.description || ""))
        setAmount(Math.abs(budgetTransaction.amount).toString())
        setSelectedCategory(budgetTransaction.category?.id)
        setRepeatUntil(budgetTransaction.repeat_until)
        setRepeatEvery(budgetTransaction.repeat_every.toString())
      }
    })()
  }, [decrypt, budgetTransaction])

  const handleAdd = useCallback(async () => {
    if (!selectedCategory || !amount || !repeatEvery) return

    const amountValue = parseFloat(amount)
    const finalAmount = isOutgoings ? -Math.abs(amountValue) : amountValue

    await addBudgetTransaction({
      body: {
        category_id: selectedCategory,
        description: await encrypt(description),
        amount: finalAmount,
        repeat_until: repeatUntil,
        repeat_every: parseFloat(repeatEvery),
      },
      path: { id: userId },
    })
    queryClient.invalidateQueries({
      queryKey: UseGetUserByIdBudgetTransactionsKeyFn({ path: { id: userId } }),
    })
    setDescription("")
    setAmount("")
    setSelectedCategory(undefined)
    setRepeatUntil("month")
    setRepeatEvery("")
    setCategorySearch("")

    cancelCallback?.()
  }, [
    addBudgetTransaction,
    amount,
    cancelCallback,
    description,
    encrypt,
    isOutgoings,
    queryClient,
    repeatEvery,
    repeatUntil,
    selectedCategory,
    userId,
  ])

  const handleEdit = useCallback(async () => {
    if (!budgetTransactionId || !amount || !repeatEvery) return

    const amountValue = parseFloat(amount)
    const finalAmount = isOutgoings ? -Math.abs(amountValue) : amountValue

    await editBudgetTransaction({
      body: {
        category_id: selectedCategory,
        description: await encrypt(description),
        amount: finalAmount,
        repeat_until: repeatUntil,
        repeat_every: parseFloat(repeatEvery),
      },
      path: { id: userId, budget_transaction_id: budgetTransactionId },
    })
    queryClient.invalidateQueries({
      queryKey: UseGetUserByIdBudgetTransactionsKeyFn({ path: { id: userId } }),
    })
    queryClient.invalidateQueries({
      queryKey: UseGetUserByIdBudgetTransactionsByBudgetTransactionIdKeyFn({
        path: { id: userId, budget_transaction_id: budgetTransactionId },
      }),
    })
    setDescription("")
    setAmount("")
    setSelectedCategory(undefined)
    setRepeatUntil("month")
    setRepeatEvery("")
    setCategorySearch("")

    cancelCallback?.()
  }, [
    amount,
    budgetTransactionId,
    cancelCallback,
    description,
    editBudgetTransaction,
    encrypt,
    isOutgoings,
    queryClient,
    repeatEvery,
    repeatUntil,
    selectedCategory,
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
        select: {
          field: {
            select: { sizes: { md: "p-[5px]" } },
          },
        },
      }),
    []
  )

  const doneFn = useMemo(
    () => (budgetTransactionId ? handleEdit : handleAdd),
    [handleAdd, handleEdit, budgetTransactionId]
  )

  if (!categories) return null

  return (
    <ThemeProvider theme={tableTheme}>
      <TableRow>
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
            onKeyUp={(e) => e.key === "Enter" && doneFn()}
          />
        </TableCell>
        <TableCell>
          <TextInput
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyUp={(e) => e.key === "Enter" && doneFn()}
          />
        </TableCell>
        <TableCell>
          <div className="flex flex-row gap-1">
            <TextInput
              placeholder="Every"
              value={repeatEvery}
              onChange={(e) => setRepeatEvery(e.target.value)}
              onKeyUp={(e) => e.key === "Enter" && doneFn()}
              className="flex-1"
            />
            <SearchSelect
              value={repeatUntil}
              options={[
                { label: "Day(s)", value: "day" },
                { label: "Week(s)", value: "week" },
                { label: "Month(s)", value: "month" },
                { label: "Year(s)", value: "year" },
              ]}
              onValueChange={(value) => setRepeatUntil(value as PeriodUnit)}
              onSearchChange={() => {}}
              showSearch={false}
            />
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-row items-center justify-end gap-2">
            <Button className="p-0 size-8" color="light" onClick={doneFn}>
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
