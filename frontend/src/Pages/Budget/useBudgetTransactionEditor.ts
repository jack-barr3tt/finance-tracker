import { useCallback, useEffect, useMemo, useState } from "react"
import {
  PeriodUnit,
  getGetUserIdBudgetTransactionsQueryKey,
  useGetUserIdBudgetTransactionsBudgetTransactionId,
  useGetUserIdCategories,
  usePatchUserIdBudgetTransactionsBudgetTransactionId,
  usePostUserIdBudgetTransactions,
} from "../../API"
import { useUser } from "../../Hooks/useUser"
import { useQueryClient } from "@tanstack/react-query"
import { useAsyncMemo } from "../../Hooks/useAsyncMemo"
import { decryptCategory } from "../../Security/data"
import { todayDateInputValue } from "../../budget/plannedAmount"

type UseBudgetTransactionEditorInput = {
  budgetTransactionId?: string
  isOutgoings?: boolean
  onClose?: () => void
}

export function useBudgetTransactionEditor(
  input: UseBudgetTransactionEditorInput,
) {
  const { budgetTransactionId, isOutgoings = false, onClose } = input

  const { userId, decrypt, encrypt } = useUser()
  const queryClient = useQueryClient()
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

  const { mutateAsync: addBudgetTransaction } =
    usePostUserIdBudgetTransactions()
  const { mutateAsync: editBudgetTransaction } =
    usePatchUserIdBudgetTransactionsBudgetTransactionId()
  const { data: budgetTransaction } =
    useGetUserIdBudgetTransactionsBudgetTransactionId(
      userId,
      budgetTransactionId || "",
      {
        query: { enabled: !!budgetTransactionId },
      },
    )

  const [categorySearch, setCategorySearch] = useState<string | undefined>(
    undefined,
  )
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    undefined,
  )
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
        setEffectiveFrom(budgetTransaction.starts_on)
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
      id: userId,
      data: {
        category_id: selectedCategory,
        description: await encrypt(description),
        amount: finalAmount,
        repeat_until: repeatUntil,
        repeat_every: parseFloat(repeatEvery),
        starts_on: startsOn,
        ends_on: endsOn || undefined,
      },
    })
    queryClient.invalidateQueries({
      queryKey: getGetUserIdBudgetTransactionsQueryKey(userId),
    })
    resetForm()
    onClose?.()
  }, [
    addBudgetTransaction,
    amount,
    description,
    encrypt,
    endsOn,
    isOutgoings,
    onClose,
    queryClient,
    repeatEvery,
    repeatUntil,
    resetForm,
    selectedCategory,
    startsOn,
    userId,
  ])

  const handleEdit = useCallback(async () => {
    if (!budgetTransactionId || !amount || !repeatEvery || !effectiveFrom)
      return

    const amountValue = parseFloat(amount)
    const finalAmount = isOutgoings ? -Math.abs(amountValue) : amountValue

    await editBudgetTransaction({
      id: userId,
      budgetTransactionId,
      data: {
        category_id: selectedCategory,
        description: await encrypt(description),
        amount: finalAmount,
        repeat_until: repeatUntil,
        repeat_every: parseFloat(repeatEvery),
        effective_from: effectiveFrom,
        ends_on: endsOn || undefined,
      },
    })
    queryClient.invalidateQueries({
      queryKey: getGetUserIdBudgetTransactionsQueryKey(userId),
    })
    resetForm()
    onClose?.()
  }, [
    amount,
    budgetTransactionId,
    description,
    editBudgetTransaction,
    effectiveFrom,
    encrypt,
    endsOn,
    isOutgoings,
    onClose,
    queryClient,
    repeatEvery,
    repeatUntil,
    resetForm,
    selectedCategory,
    userId,
  ])

  const handleSave = useMemo(
    () => (budgetTransactionId ? handleEdit : handleAdd),
    [handleAdd, handleEdit, budgetTransactionId],
  )

  const categoryOptions = useMemo(
    () =>
      categories
        ?.filter(
          (category) =>
            !categorySearch ||
            category.name.toLowerCase().includes(categorySearch.toLowerCase()),
        )
        .map((category) => ({
          label: category.name,
          value: category.id,
        })) ?? [],
    [categories, categorySearch],
  )

  const isReady = !!categories && (!budgetTransactionId || !!budgetTransaction)

  return {
    isReady,
    isEditMode: !!budgetTransactionId,
    categories,
    description,
    setDescription,
    amount,
    setAmount,
    selectedCategory,
    setSelectedCategory,
    categorySearch,
    setCategorySearch,
    categoryOptions,
    repeatUntil,
    setRepeatUntil,
    repeatEvery,
    setRepeatEvery,
    startsOn,
    setStartsOn,
    endsOn,
    setEndsOn,
    effectiveFrom,
    setEffectiveFrom,
    handleSave,
  }
}
