import {
  TableRow,
  TableCell,
  TextInput,
  Button,
  ThemeProvider,
  createTheme,
} from "flowbite-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { FiSave, FiX } from "react-icons/fi"
import {
  useGetUserByIdCategories,
  useGetUserByIdCategoryBudgetsByCategoryBudgetId,
  UseGetUserByIdCategoryBudgetsKeyFn,
  usePatchUserByIdCategoryBudgetsByCategoryBudgetId,
  usePostUserByIdCategoryBudgets,
} from "../../API/queries"
import { useUser } from "../../Hooks/useUser"
import SearchSelect from "../../Components/SearchSelect"
import { useQueryClient } from "@tanstack/react-query"
import { useAsyncMemo } from "../../Hooks/useAsyncMemo"
import { decryptCategory, decryptCategoryBudget } from "../../Security/data"
import { CategoryBudget, PeriodUnit } from "../../API/requests"
import {
  isSegmentActiveToday,
  todayDateInputValue,
} from "../../budget/plannedAmount"

type EditCategoryBudgetRowProps = {
  categoryBudgetId?: string
  cancelCallback?: () => void
  existingCategoryBudgets: CategoryBudget[]
}

export default function EditCategoryBudgetRow(
  props: EditCategoryBudgetRowProps,
) {
  const { categoryBudgetId, cancelCallback, existingCategoryBudgets } = props

  const { userId, decrypt } = useUser()
  const queryClient = useQueryClient()
  const { data: encCategories } = useGetUserByIdCategories({
    path: { id: userId },
  })
  const categories = useAsyncMemo(
    async () =>
      (
        await Promise.all(
          encCategories?.map((cat) => decryptCategory(cat, decrypt)) ?? [],
        )
      ).sort((a, b) => a.name.localeCompare(b.name)),
    [decrypt, encCategories],
  )

  const { mutateAsync: addCategoryBudget } = usePostUserByIdCategoryBudgets()
  const { mutateAsync: editCategoryBudget } =
    usePatchUserByIdCategoryBudgetsByCategoryBudgetId()
  const { data: categoryBudget } =
    useGetUserByIdCategoryBudgetsByCategoryBudgetId(
      {
        path: { id: userId, category_budget_id: categoryBudgetId || "" },
      },
      undefined,
      {
        enabled: !!categoryBudgetId,
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
    const ids = new Set(
      existingCategoryBudgets
        .filter(
          (cb) =>
            !cb.deleted_at &&
            cb.id !== categoryBudgetId &&
            isSegmentActiveToday(cb),
        )
        .map((cb) => cb.category.id),
    )
    return ids
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
      body: {
        category_id: selectedCategory,
        amount: parseFloat(amount),
        repeat_until: repeatUntil,
        repeat_every: parseFloat(repeatEvery),
        starts_on: startsOn,
        ends_on: endsOn || undefined,
      },
      path: { id: userId },
    })
    queryClient.invalidateQueries({
      queryKey: UseGetUserByIdCategoryBudgetsKeyFn({ path: { id: userId } }),
    })
    resetForm()
    cancelCallback?.()
  }, [
    addCategoryBudget,
    amount,
    cancelCallback,
    endsOn,
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
      body: {
        category_id: selectedCategory,
        amount: parseFloat(amount),
        repeat_until: repeatUntil,
        repeat_every: parseFloat(repeatEvery),
        effective_from: effectiveFrom,
        ends_on: endsOn || undefined,
      },
      path: { id: userId, category_budget_id: categoryBudgetId },
    })
    queryClient.invalidateQueries({
      queryKey: UseGetUserByIdCategoryBudgetsKeyFn({ path: { id: userId } }),
    })
    resetForm()
    cancelCallback?.()
  }, [
    amount,
    cancelCallback,
    categoryBudgetId,
    editCategoryBudget,
    effectiveFrom,
    endsOn,
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
    [],
  )

  const doneFn = useMemo(
    () => (categoryBudgetId ? handleEdit : handleAdd),
    [handleAdd, handleEdit, categoryBudgetId],
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
                  (!categorySearch ||
                    category.name
                      .toLowerCase()
                      .includes(categorySearch.toLowerCase())) &&
                  !takenCategoryIds.has(category.id),
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
            placeholder="Limit"
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
            {categoryBudgetId ? (
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
            <Button
              className="p-0 size-8"
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
