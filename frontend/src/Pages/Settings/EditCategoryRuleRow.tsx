import { TableRow, TableCell, TextInput, Button } from "flowbite-react"
import { FiSave, FiX } from "react-icons/fi"
import SearchSelect from "../../Components/SearchSelect"
import { useCallback, useEffect, useState } from "react"
import {
  useGetUserByIdAccounts,
  useGetUserByIdCategoriesByCategoryId,
  UseGetUserByIdCategoriesByCategoryIdKeyFn,
  UseGetUserByIdCategoriesKeyFn,
  usePatchUserByIdCategoriesByCategoryIdRulesByRuleId,
  usePostUserByIdCategoriesByCategoryIdRules,
} from "../../API/queries"
import { useUser } from "../../Hooks/useUser"
import { useQueryClient } from "@tanstack/react-query"

type EditCategoryRuleRowProps = {
  categoryId: string
  ruleId?: string
  cancelCallback?: () => void
}

export default function EditCategoryRuleRow(props: EditCategoryRuleRowProps) {
  const { categoryId, ruleId, cancelCallback } = props

  const { userId } = useUser()
  const queryClient = useQueryClient()
  const { data: accounts } = useGetUserByIdAccounts({ path: { id: userId } })
  const [accountSearch, setAccountSearch] = useState<string | undefined>(undefined)
  const [accountId, setAccountId] = useState<string | undefined>(undefined)
  const [rule, setRule] = useState<string>("")
  const [description, setDescription] = useState<string>("")

  const { data: category } = useGetUserByIdCategoriesByCategoryId(
    {
      path: { id: userId, category_id: categoryId },
    },
    undefined,
    { enabled: !!categoryId }
  )

  const { mutateAsync: createRule } = usePostUserByIdCategoriesByCategoryIdRules()
  const { mutateAsync: editRule } = usePatchUserByIdCategoriesByCategoryIdRulesByRuleId()

  useEffect(() => {
    if (category) {
      const rule = category.rules.find((r) => r.id === ruleId)
      if (rule) {
        setAccountId(rule.account.id)
        setRule(rule.rule)
      }
    }
  }, [category, ruleId])

  const handleCreate = useCallback(async () => {
    if (accountId && rule) {
      await createRule({
        path: { id: userId, category_id: categoryId },
        body: { account_id: accountId, rule, description },
      })
      queryClient.invalidateQueries({
        queryKey: UseGetUserByIdCategoriesKeyFn({ path: { id: userId } }),
      })
      queryClient.invalidateQueries({
        queryKey: UseGetUserByIdCategoriesByCategoryIdKeyFn({
          path: { id: userId, category_id: categoryId },
        }),
      })
      setAccountId(undefined)
      setRule("")
      setDescription("")
      cancelCallback?.()
    }
  }, [accountId, cancelCallback, categoryId, createRule, description, queryClient, rule, userId])

  const handleEdit = useCallback(async () => {
    if (ruleId && accountId && rule) {
      await editRule({
        path: { id: userId, category_id: categoryId, rule_id: ruleId },
        body: { account_id: accountId, rule, description },
      })
      queryClient.invalidateQueries({
        queryKey: UseGetUserByIdCategoriesKeyFn({ path: { id: userId } }),
      })
      queryClient.invalidateQueries({
        queryKey: UseGetUserByIdCategoriesByCategoryIdKeyFn({
          path: { id: userId, category_id: categoryId },
        }),
      })
      queryClient.invalidateQueries({
        queryKey: UseGetUserByIdCategoriesKeyFn({ path: { id: userId } }),
      })
      queryClient.invalidateQueries({
        queryKey: UseGetUserByIdCategoriesByCategoryIdKeyFn({
          path: { id: userId, category_id: categoryId },
        }),
      })
      setAccountId(undefined)
      setRule("")
      setDescription("")
      cancelCallback?.()
    }
  }, [
    accountId,
    cancelCallback,
    categoryId,
    description,
    editRule,
    queryClient,
    rule,
    ruleId,
    userId,
  ])

  return (
    <TableRow>
      <TableCell>
        <SearchSelect
          options={(accounts ?? [])
            .filter((account) =>
              account.name.toLowerCase().includes(accountSearch?.toLowerCase() ?? "")
            )
            .map((account) => ({
              value: account.id,
              label: account.name,
            }))}
          value={accountId}
          onSearchChange={setAccountSearch}
          onValueChange={setAccountId}
          placeholder="Select Account"
        />
      </TableCell>
      <TableCell>
        <TextInput
          id="rule"
          value={rule}
          placeholder="Rule"
          onChange={(e) => setRule(e.target.value)}
        />
      </TableCell>
      <TableCell>
        <TextInput
          id="description"
          value={description}
          placeholder="Description"
          onChange={(e) => setDescription(e.target.value)}
        />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex flex-row items-center justify-end">
          <Button
            color="green"
            className="p-0 size-8"
            onClick={() => (ruleId ? handleEdit() : handleCreate())}
          >
            <FiSave />
          </Button>
          <Button color="dark" className="p-0 ml-2 size-8" onClick={() => cancelCallback?.()}>
            <FiX />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
