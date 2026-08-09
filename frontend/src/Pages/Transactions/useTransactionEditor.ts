import { format, parseISO } from "date-fns"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
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
import { useQueryClient } from "@tanstack/react-query"
import { useAsyncMemo } from "../../Hooks/useAsyncMemo"
import { decryptAccount, decryptCategory } from "../../Security/data"
import { useHotkey } from "@tanstack/react-hotkeys"
import { HOTKEYS_BY_ID } from "../../Hotkeys/hotkeys"
import { formatError } from "../../utils/formatError"

type UseTransactionEditorInput = {
  transactionId?: string
  defaultAccountId?: string
  defaultCategoryId?: string
  onClose?: () => void
  enableHotkeys?: boolean
}

export function useTransactionEditor(input: UseTransactionEditorInput) {
  const {
    transactionId,
    defaultAccountId,
    defaultCategoryId,
    onClose,
    enableHotkeys = true,
  } = input

  const { userId, decrypt, encrypt, computeDedupeHash } = useUser()
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
    if (!onClose) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      e.preventDefault()
      onClose()
    }

    document.addEventListener("keydown", onKeyDown, true)
    return () => document.removeEventListener("keydown", onKeyDown, true)
  }, [onClose])

  const resetForm = useCallback(() => {
    setDate(null)
    setDescription("")
    setAmount("")
    setSelectedAccount(undefined)
    setSelectedCategory(undefined)
    setAccountSearch("")
    setCategorySearch("")
  }, [])

  const handleAdd = useCallback(async () => {
    if (!date || !selectedAccount || !selectedCategory || !amount) return

    try {
      const dateStr = format(date, "yyyy-MM-dd")
      const dedupeHash = await computeDedupeHash(
        `${parseFloat(amount).toFixed(2)}|${dateStr}|${description}`,
      )

      await addTransaction({
        id: userId,
        data: {
          account_id: selectedAccount,
          category_id: selectedCategory,
          description: await encrypt(description),
          amount: parseFloat(amount),
          date: dateStr,
          dedupe_hash: dedupeHash,
        },
      })
    } catch (error) {
      toast.error(formatError(error, "Failed to add transaction."))
      return
    }
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
    resetForm()
    onClose?.()
  }, [
    addTransaction,
    amount,
    computeDedupeHash,
    date,
    description,
    encrypt,
    onClose,
    queryClient,
    resetForm,
    selectedAccount,
    selectedCategory,
    userId,
  ])

  const handleEdit = useCallback(async () => {
    if (!transactionId || !date || !selectedAccount || !amount) return

    try {
      const dateStr = format(date, "yyyy-MM-dd")
      const dedupeHash = await computeDedupeHash(
        `${parseFloat(amount).toFixed(2)}|${dateStr}|${description}`,
      )

      await editTransaction({
        id: userId,
        transactionId,
        data: {
          account_id: selectedAccount,
          category_id: selectedCategory,
          description: await encrypt(description),
          amount: parseFloat(amount),
          date: dateStr,
          dedupe_hash: dedupeHash,
        },
      })
    } catch (error) {
      toast.error(formatError(error, "Failed to save transaction."))
      return
    }
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
    resetForm()
    onClose?.()
  }, [
    amount,
    computeDedupeHash,
    date,
    description,
    editTransaction,
    encrypt,
    onClose,
    queryClient,
    resetForm,
    selectedAccount,
    selectedCategory,
    transactionId,
    userId,
  ])

  const handleSave = useMemo(
    () => (transactionId ? handleEdit : handleAdd),
    [handleAdd, handleEdit, transactionId],
  )

  useHotkey(
    HOTKEYS_BY_ID.submitTransactionRow.combo,
    handleSave,
    enableHotkeys ? undefined : { enabled: false },
  )

  const accountOptions = useMemo(
    () =>
      accounts
        ?.filter(
          (account) =>
            !accountSearch ||
            account.name.toLowerCase().includes(accountSearch.toLowerCase()),
        )
        .map((account) => ({
          label: account.name,
          value: account.id,
        })) ?? [],
    [accountSearch, accounts],
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

  const isReady = !!accounts && !!categories && (!transactionId || !!date)

  return {
    accounts,
    categories,
    isReady,
    isEditMode: !!transactionId,
    date,
    setDate,
    description,
    setDescription,
    amount,
    setAmount,
    selectedAccount,
    setSelectedAccount,
    selectedCategory,
    setSelectedCategory,
    accountSearch,
    setAccountSearch,
    categorySearch,
    setCategorySearch,
    accountOptions,
    categoryOptions,
    handleSave,
  }
}
