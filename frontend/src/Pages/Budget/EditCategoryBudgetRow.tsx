import { TableRow, TableCell, TextInput, Button, ThemeProvider, createTheme } from "flowbite-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { FiSave, FiX } from "react-icons/fi"
import {
  useGetUserByIdCategories,
  useGetUserByIdCategoryBudgetsByCategoryBudgetId,
  UseGetUserByIdCategoryBudgetsKeyFn,
  UseGetUserByIdCategoryBudgetsByCategoryBudgetIdKeyFn,
  usePatchUserByIdCategoryBudgetsByCategoryBudgetId,
  usePostUserByIdCategoryBudgets,
} from "../../API/queries"
import { useUser } from "../../Hooks/useUser"
import SearchSelect from "../../Components/SearchSelect"
import { useQueryClient } from "@tanstack/react-query"
import { useAsyncMemo } from "../../Hooks/useAsyncMemo"
import { decryptCategory, decryptCategoryBudget } from "../../Security/data"
import { CategoryBudget, PeriodUnit } from "../../API/requests"

type EditCategoryBudgetRowProps = {
  categoryBudgetId?: string
  cancelCallback?: () => void
  existingCategoryBudgets: CategoryBudget[]
}

export default function EditCategoryBudgetRow(props: EditCategoryBudgetRowProps) {
  const { categoryBudgetId, cancelCallback, existingCategoryBudgets } = props

  const { userId, decrypt } = useUser()
  const queryClient = useQueryClient()
  const { data: encCategories } = useGetUserByIdCategories({ path: { id: userId } })
  const categories = useAsyncMemo(
    async () =>
      (await Promise.all(encCategories?.map((cat) => decryptCategory(cat, decrypt)) ?? [])).sort(
        (a, b) => a.name.localeCompare(b.name)
      ),
    [decrypt, encCategories]
  )

  const { mutateAsync: addCategoryBudget } = usePostUserByIdCategoryBudgets()
  const { mutateAsync: editCategoryBudget } =
    usePatchUserByIdCategoryBudgetsByCategoryBudgetId()
  const { data: categoryBudget } = useGetUserByIdCategoryBudgetsByCategoryBudgetId(
    {
      path: { id: userId, category_budget_id: categoryBudgetId || "" },
    },
    undefined,
    {
      enabled: !!categoryBudgetId,
    }
  )

  const [categorySearch, setCategorySearch] = useState<string | undefined>(undefined)
  const [amount, setAmount] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined)
  const [repeatUntil, setRepeatUntil] = useState<PeriodUnit>("month")
  const [repeatEvery, setRepeatEvery] = useState("")

  useEffect(() => {
    ;(async () => {
      if (categoryBudget) {
        const decrypted = await decryptCategoryBudget(categoryBudget, decrypt)
        setAmount(decrypted.amount.toString())
        setSelectedCategory(decrypted.category.id)
        setRepeatUntil(decrypted.repeat_until)
        setRepeatEvery(decrypted.repeat_every.toString())
      }
    })()
  }, [decrypt, categoryBudget])

  const takenCategoryIds = useMemo(() => {
    const ids = new Set(
      existingCategoryBudgets
        .filter((cb) => !cb.deleted_at && cb.id !== categoryBudgetId)
        .map((cb) => cb.category.id)
    )
    return ids
  }, [categoryBudgetId, existingCategoryBudgets])

  const handleAdd = useCallback(async () => {
    if (!selectedCategory || !amount || !repeatEvery) return

    await addCategoryBudget({
      body: {
        category_id: selectedCategory,
        amount: parseFloat(amount),
        repeat_until: repeatUntil,
        repeat_every: parseFloat(repeatEvery),
      },
      path: { id: userId },
    })
    queryClient.invalidateQueries({
      queryKey: UseGetUserByIdCategoryBudgetsKeyFn({ path: { id: userId } }),
    })
    setAmount("")
    setSelectedCategory(undefined)
    setRepeatUntil("month")
    setRepeatEvery("")
    setCategorySearch("")

    cancelCallback?.()
  }, [
    addCategoryBudget,
    amount,
    cancelCallback,
    queryClient,
    repeatEvery,
    repeatUntil,
    selectedCategory,
    userId,
  ])

  const handleEdit = useCallback(async () => {
    if (!categoryBudgetId || !amount || !repeatEvery) return

    await editCategoryBudget({
      body: {
        category_id: selectedCategory,
        amount: parseFloat(amount),
        repeat_until: repeatUntil,
        repeat_every: parseFloat(repeatEvery),
      },
      path: { id: userId, category_budget_id: categoryBudgetId },
    })
    queryClient.invalidateQueries({
      queryKey: UseGetUserByIdCategoryBudgetsKeyFn({ path: { id: userId } }),
    })
    queryClient.invalidateQueries({
      queryKey: UseGetUserByIdCategoryBudgetsByCategoryBudgetIdKeyFn({
        path: { id: userId, category_budget_id: categoryBudgetId },
      }),
    })
    setAmount("")
    setSelectedCategory(undefined)
    setRepeatUntil("month")
    setRepeatEvery("")
    setCategorySearch("")

    cancelCallback?.()
  }, [
    amount,
    cancelCallback,
    categoryBudgetId,
    editCategoryBudget,
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
    () => (categoryBudgetId ? handleEdit : handleAdd),
    [handleAdd, handleEdit, categoryBudgetId]
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
                    category.name.toLowerCase().includes(categorySearch.toLowerCase())) &&
                  !takenCategoryIds.has(category.id)
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
