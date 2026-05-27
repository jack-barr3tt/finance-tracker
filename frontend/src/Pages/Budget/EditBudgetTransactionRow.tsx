import { TableRow, TableCell, TextInput, Button, ThemeProvider, createTheme } from "flowbite-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { FiSave, FiX } from "react-icons/fi"
import {
  useGetUserByIdCategories,
  useGetUserByIdBudgetTransactionsByBudgetTransactionId,
  UseGetUserByIdBudgetTransactionsKeyFn,
  usePatchUserByIdBudgetTransactionsByBudgetTransactionId,
  usePostUserByIdBudgetTransactions,
} from "../../API/queries"
import { useUser } from "../../Hooks/useUser"
import SearchSelect from "../../Components/SearchSelect"
import { useQueryClient } from "@tanstack/react-query"
import { useAsyncMemo } from "../../Hooks/useAsyncMemo"
import { decryptCategory } from "../../Security/data"
import { PeriodUnit } from "../../API/requests"
import { todayDateInputValue } from "../../budget/plannedAmount"

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
  const [startsOn, setStartsOn] = useState(todayDateInputValue())
  const [endsOn, setEndsOn] = useState("")
  const [effectiveFrom, setEffectiveFrom] = useState(todayDateInputValue())

  useEffect(() => {
    ;(async () => {
      if (budgetTransaction) {
        setDescription(await decrypt(budgetTransaction.description || ""))
        setAmount(Math.abs(budgetTransaction.amount).toString())
        setSelectedCategory(budgetTransaction.category?.id)
        setRepeatUntil(budgetTransaction.repeat_until)
        setRepeatEvery(budgetTransaction.repeat_every.toString())
        setStartsOn(budgetTransaction.starts_on)
        setEndsOn(budgetTransaction.ends_on ?? "")
        setEffectiveFrom(todayDateInputValue())
      }
    })()
  }, [decrypt, budgetTransaction])

  const resetForm = useCallback(() => {
    setDescription("")
    setAmount("")
    setSelectedCategory(undefined)
    setRepeatUntil("month")
    setRepeatEvery("")
    setStartsOn(todayDateInputValue())
    setEndsOn("")
    setEffectiveFrom(todayDateInputValue())
    setCategorySearch("")
  }, [])

  const handleAdd = useCallback(async () => {
    if (!selectedCategory || !amount || !repeatEvery || !startsOn) return

    const amountValue = parseFloat(amount)
    const finalAmount = isOutgoings ? -Math.abs(amountValue) : amountValue

    await addBudgetTransaction({
      body: {
        category_id: selectedCategory,
        description: await encrypt(description),
        amount: finalAmount,
        repeat_until: repeatUntil,
        repeat_every: parseFloat(repeatEvery),
        starts_on: startsOn,
        ends_on: endsOn || undefined,
      },
      path: { id: userId },
    })
    queryClient.invalidateQueries({
      queryKey: UseGetUserByIdBudgetTransactionsKeyFn({ path: { id: userId } }),
    })
    resetForm()
    cancelCallback?.()
  }, [
    addBudgetTransaction,
    amount,
    cancelCallback,
    description,
    encrypt,
    endsOn,
    isOutgoings,
    queryClient,
    repeatEvery,
    repeatUntil,
    resetForm,
    selectedCategory,
    startsOn,
    userId,
  ])

  const handleEdit = useCallback(async () => {
    if (!budgetTransactionId || !amount || !repeatEvery || !effectiveFrom) return

    const amountValue = parseFloat(amount)
    const finalAmount = isOutgoings ? -Math.abs(amountValue) : amountValue

    await editBudgetTransaction({
      body: {
        category_id: selectedCategory,
        description: await encrypt(description),
        amount: finalAmount,
        repeat_until: repeatUntil,
        repeat_every: parseFloat(repeatEvery),
        effective_from: effectiveFrom,
        ends_on: endsOn || undefined,
      },
      path: { id: userId, budget_transaction_id: budgetTransactionId },
    })
    queryClient.invalidateQueries({
      queryKey: UseGetUserByIdBudgetTransactionsKeyFn({ path: { id: userId } }),
    })
    resetForm()
    cancelCallback?.()
  }, [
    amount,
    budgetTransactionId,
    cancelCallback,
    description,
    editBudgetTransaction,
    effectiveFrom,
    encrypt,
    endsOn,
    isOutgoings,
    queryClient,
    repeatEvery,
    repeatUntil,
    resetForm,
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
          <div className="flex flex-col gap-1">
            {budgetTransactionId ? (
              <>
                <TextInput
                  type="date"
                  title="Effective from"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                />
                <TextInput
                  type="date"
                  title="Ends on (optional)"
                  value={endsOn}
                  onChange={(e) => setEndsOn(e.target.value)}
                />
              </>
            ) : (
              <>
                <TextInput
                  type="date"
                  title="Starts on"
                  value={startsOn}
                  onChange={(e) => setStartsOn(e.target.value)}
                />
                <TextInput
                  type="date"
                  title="Ends on (optional)"
                  value={endsOn}
                  onChange={(e) => setEndsOn(e.target.value)}
                />
              </>
            )}
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
