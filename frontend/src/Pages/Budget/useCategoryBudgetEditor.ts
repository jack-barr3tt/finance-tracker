import { useCallback, useEffect, useMemo, useState } from "react"
import {
  CategoryBudget,
  PeriodUnit,
  getGetUserIdCategoryBudgetsQueryKey,
  useGetUserIdCategories,
  useGetUserIdCategoryBudgetsCategoryBudgetId,
  usePatchUserIdCategoryBudgetsCategoryBudgetId,
  usePostUserIdCategoryBudgets,
} from "../../API"
import { useUser } from "../../Hooks/useUser"
import { useQueryClient } from "@tanstack/react-query"
import { useAsyncMemo } from "../../Hooks/useAsyncMemo"
import { decryptCategory, decryptCategoryBudget } from "../../Security/data"
import {
  isSegmentActiveToday,
  todayDateInputValue,
} from "../../budget/plannedAmount"

type UseCategoryBudgetEditorInput = {
  categoryBudgetId?: string
  existingCategoryBudgets: CategoryBudget[]
  onClose?: () => void
}

export function useCategoryBudgetEditor(input: UseCategoryBudgetEditorInput) {
  const { categoryBudgetId, existingCategoryBudgets, onClose } = input

  const { userId, decrypt } = useUser()
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

  const { mutateAsync: addCategoryBudget } = usePostUserIdCategoryBudgets()
  const { mutateAsync: editCategoryBudget } =
    usePatchUserIdCategoryBudgetsCategoryBudgetId()
  const { data: categoryBudget } = useGetUserIdCategoryBudgetsCategoryBudgetId(
    userId,
    categoryBudgetId || "",
    {
      query: { enabled: !!categoryBudgetId },
    },
  )

  const [categorySearch, setCategorySearch] = useState<string | undefined>(
    undefined,
  )
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
      if (categoryBudget) {
        const decrypted = await decryptCategoryBudget(categoryBudget, decrypt)
        setAmount(decrypted.amount.toString())
        setSelectedCategory(decrypted.category.id)
        setRepeatUntil(decrypted.repeat_until)
        setRepeatEvery(decrypted.repeat_every.toString())
        setStartsOn(decrypted.starts_on)
        setEndsOn(decrypted.ends_on ?? "")
        setEffectiveFrom(decrypted.starts_on)
      }
    })()
  }, [decrypt, categoryBudget])

  const takenCategoryIds = useMemo(() => {
    return new Set(
      existingCategoryBudgets
        .filter(
          (cb) =>
            !cb.deleted_at &&
            cb.id !== categoryBudgetId &&
            isSegmentActiveToday(cb),
        )
        .map((cb) => cb.category.id),
    )
  }, [categoryBudgetId, existingCategoryBudgets])

  const resetForm = useCallback(() => {
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

    await addCategoryBudget({
      id: userId,
      data: {
        category_id: selectedCategory,
        amount: parseFloat(amount),
        repeat_until: repeatUntil,
        repeat_every: parseFloat(repeatEvery),
        starts_on: startsOn,
        ends_on: endsOn || undefined,
      },
    })
    queryClient.invalidateQueries({
      queryKey: getGetUserIdCategoryBudgetsQueryKey(userId),
    })
    resetForm()
    onClose?.()
  }, [
    addCategoryBudget,
    amount,
    endsOn,
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
    if (!categoryBudgetId || !amount || !repeatEvery || !effectiveFrom) return

    await editCategoryBudget({
      id: userId,
      categoryBudgetId,
      data: {
        category_id: selectedCategory,
        amount: parseFloat(amount),
        repeat_until: repeatUntil,
        repeat_every: parseFloat(repeatEvery),
        effective_from: effectiveFrom,
        ends_on: endsOn || undefined,
      },
    })
    queryClient.invalidateQueries({
      queryKey: getGetUserIdCategoryBudgetsQueryKey(userId),
    })
    resetForm()
    onClose?.()
  }, [
    amount,
    categoryBudgetId,
    editCategoryBudget,
    effectiveFrom,
    endsOn,
    onClose,
    queryClient,
    repeatEvery,
    repeatUntil,
    resetForm,
    selectedCategory,
    userId,
  ])

  const handleSave = useMemo(
    () => (categoryBudgetId ? handleEdit : handleAdd),
    [handleAdd, handleEdit, categoryBudgetId],
  )

  const categoryOptions = useMemo(
    () =>
      categories
        ?.filter(
          (category) =>
            (!categorySearch ||
              category.name
                .toLowerCase()
                .includes(categorySearch.toLowerCase())) &&
            !takenCategoryIds.has(category.id),
        )
        .map((category) => ({
          label: category.name,
          value: category.id,
        })) ?? [],
    [categories, categorySearch, takenCategoryIds],
  )

  const isReady = !!categories && (!categoryBudgetId || !!categoryBudget)

  return {
    isReady,
    isEditMode: !!categoryBudgetId,
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
