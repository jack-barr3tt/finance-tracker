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
  useGetUserByIdCategoriesByCategoryId,
  UseGetUserByIdCategoriesByCategoryIdKeyFn,
  UseGetUserByIdCategoriesKeyFn,
  usePatchUserByIdCategoriesByCategoryId,
} from "../../API/queries"
import { useUser } from "../../Hooks/useUser"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { FiEdit, FiPlus } from "react-icons/fi"
import TableBodyWithButton from "../../Components/TableBodyWithButton"
import EditCategoryRuleRow from "./EditCategoryRuleRow"

export default function EditCategories() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { userId } = useUser()
  const categoryId = useMemo(
    () => /category\/(.+)\/edit/.exec(location.pathname)?.[1] ?? "",
    [location.pathname]
  )
  const { data: category } = useGetUserByIdCategoriesByCategoryId(
    {
      path: { id: userId, category_id: categoryId },
    },
    undefined,
    { enabled: !!categoryId }
  )
  const { mutateAsync: editCategory } = usePatchUserByIdCategoriesByCategoryId()

  const [categoryName, setCategoryName] = useState<string>("")
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    if (category) {
      setCategoryName(category.name)
    }
  }, [category])

  const handleSubmit = useCallback(async () => {
    if (categoryName.trim() != category?.name) {
      await editCategory({
        path: { id: userId, category_id: categoryId },
        body: { name: categoryName },
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
  }, [categoryName, category, navigate, editCategory, userId, categoryId, queryClient])

  return (
    <Modal show={/settings\/category\/(.+)\/edit/.test(location.pathname)}>
      <ModalHeader>Edit Category</ModalHeader>

      <ModalBody className="overflow-visible">
        <form className="flex flex-col gap-4">
          <TextInput
            id="category-name"
            value={categoryName}
            placeholder="Category Name"
            onChange={(e) => setCategoryName(e.target.value)}
          />

          <Table
            theme={{
              head: { cell: { base: "bg-gray-200 dark:bg-gray-800" } },
              body: { cell: { base: "bg-gray-100 dark:bg-gray-900" } },
            }}
          >
            <TableHead>
              <TableHeadCell>Account</TableHeadCell>
              <TableHeadCell>Rule</TableHeadCell>
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
                  <TableCell colSpan={3} className="text-center">
                    No auto-categorisation rules
                  </TableCell>
                </TableRow>
              ) : (
                category?.rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>{rule.account.name}</TableCell>
                    <TableCell>{rule.rule}</TableCell>
                    <TableCell className="text-right">
                      <Button color="light" className="w-10 p-0">
                        <FiEdit />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {showAdd && (
                <EditCategoryRuleRow
                  categoryId={categoryId}
                  cancelCallback={() => setShowAdd(false)}
                />
              )}
            </TableBodyWithButton>
          </Table>
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
