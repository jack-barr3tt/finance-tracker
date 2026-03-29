import {
  Modal,
  ModalHeader,
  ModalBody,
  TextInput,
  ModalFooter,
  Button,
  Table,
  TableHead,
  TableHeadCell,
  TableCell,
  TableRow,
} from "flowbite-react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  useDeleteUserByIdCategoriesByCategoryIdRulesByRuleId,
  useGetUserByIdCategoriesByCategoryId,
  UseGetUserByIdCategoriesByCategoryIdKeyFn,
  UseGetUserByIdCategoriesKeyFn,
  usePatchUserByIdCategoriesByCategoryId,
} from "../../API/queries"
import { useUser } from "../../Hooks/useUser"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { FiEdit, FiPlus, FiTrash } from "react-icons/fi"
import TableBodyWithButton from "../../Components/TableBodyWithButton"
import EditCategoryRuleRow from "./EditCategoryRuleRow"
import { useAsyncMemo } from "../../Hooks/useAsyncMemo"
import { decryptCategory } from "../../Security/data"

export default function EditCategories() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { userId, decrypt, encrypt } = useUser()
  const categoryId = useMemo(
    () => /category\/(.+)\/edit/.exec(location.pathname)?.[1] ?? "",
    [location.pathname]
  )
  const { data: encCategory } = useGetUserByIdCategoriesByCategoryId(
    {
      path: { id: userId, category_id: categoryId },
    },
    undefined,
    { enabled: !!categoryId }
  )
  const { mutateAsync: editCategory } = usePatchUserByIdCategoriesByCategoryId()
  const { mutateAsync: deleteRule } = useDeleteUserByIdCategoriesByCategoryIdRulesByRuleId()

  const category = useAsyncMemo(
    async () => decryptCategory(encCategory, decrypt),
    [decrypt, encCategory]
  )

  const [categoryName, setCategoryName] = useState<string>("")
  const [showAdd, setShowAdd] = useState(false)
  const [editingRuleId, setEditingRuleId] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (category) {
      setCategoryName(category.name)
    }
  }, [category])

  const handleSubmit = useCallback(async () => {
    if (categoryName.trim() != category?.name) {
      await editCategory({
        path: { id: userId, category_id: categoryId },
        body: { name: await encrypt(categoryName) },
      })
      queryClient.invalidateQueries({
        queryKey: UseGetUserByIdCategoriesByCategoryIdKeyFn({
          path: { id: userId, category_id: categoryId },
        }),
      })
      queryClient.invalidateQueries({
        queryKey: UseGetUserByIdCategoriesKeyFn({ path: { id: userId } }),
      })
    }

    navigate("/settings")
  }, [
    categoryName,
    category?.name,
    navigate,
    editCategory,
    userId,
    categoryId,
    encrypt,
    queryClient,
  ])

  const handleDelete = useCallback(
    async (ruleId: string) => {
      await deleteRule({
        path: { id: userId, category_id: categoryId, rule_id: ruleId },
      })
      queryClient.invalidateQueries({
        queryKey: UseGetUserByIdCategoriesKeyFn({ path: { id: userId } }),
      })
      queryClient.invalidateQueries({
        queryKey: UseGetUserByIdCategoriesByCategoryIdKeyFn({
          path: { id: userId, category_id: categoryId },
        }),
      })
    },
    [categoryId, deleteRule, queryClient, userId]
  )

  return (
    <Modal show={/settings\/category\/(.+)\/edit/.test(location.pathname)} onClose={() => navigate("/settings")}>
      <ModalHeader>Edit Category</ModalHeader>

      <ModalBody>
        <form className="flex flex-col gap-4">
          <TextInput
            id="category-name"
            value={categoryName}
            placeholder="Category Name"
            onChange={(e) => setCategoryName(e.target.value)}
          />

          <div className="relative max-h-[min(60vh,28rem)] overflow-y-auto rounded-md custom-scrollbar">
            <Table
              theme={{
                root: { wrapper: "overflow-x-auto rounded-md" },
                head: {
                  cell: {
                    base: "border-b border-gray-300 bg-gray-200 dark:border-gray-600 dark:bg-gray-800 sticky top-0 z-10",
                  },
                },
                body: { cell: { base: "bg-gray-100 dark:bg-gray-900" } },
              }}
            >
              <TableHead>
                <TableHeadCell>Account</TableHeadCell>
                <TableHeadCell>Rule</TableHeadCell>
                <TableHeadCell>New Description</TableHeadCell>
                <TableHeadCell>
                  <span className="sr-only">Edit</span>
                </TableHeadCell>
              </TableHead>
              <TableBodyWithButton
                button={
                  !showAdd ? (
                    <Button
                      className="p-0 shadow-md size-8"
                      color="light"
                      onClick={() => setShowAdd(true)}
                    >
                      <FiPlus />
                    </Button>
                  ) : null
                }
              >
                {category?.rules.length === 0 && !showAdd ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No auto-categorisation rules
                    </TableCell>
                  </TableRow>
                ) : (
                  category?.rules.map((rule) =>
                    editingRuleId == rule.id ? (
                      <EditCategoryRuleRow
                        categoryId={categoryId}
                        cancelCallback={() => setEditingRuleId(undefined)}
                        ruleId={rule.id}
                      />
                    ) : (
                      <TableRow key={rule.id}>
                        <TableCell>{rule.account.name}</TableCell>
                        <TableCell>{rule.rule}</TableCell>
                        <TableCell>{rule.description}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-row items-center justify-end">
                            <Button
                              color="light"
                              className="p-0 size-8"
                              onClick={() => setEditingRuleId(rule.id)}
                            >
                              <FiEdit />
                            </Button>
                            <Button
                              color="light"
                              className="p-0 ml-2 size-8"
                              onClick={() => handleDelete(rule.id)}
                            >
                              <FiTrash />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  )
                )}
                {showAdd && (
                  <EditCategoryRuleRow
                    categoryId={categoryId}
                    cancelCallback={() => setShowAdd(false)}
                  />
                )}
              </TableBodyWithButton>
            </Table>
          </div>
        </form>
      </ModalBody>

      <ModalFooter>
        <Button onClick={() => handleSubmit()} color="green">
          Save
        </Button>
        <Button color="light" onClick={() => navigate("/settings")}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  )
}
