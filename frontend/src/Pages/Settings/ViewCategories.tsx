import { useUser } from "../../Hooks/useUser"
import {
  useDeleteUserByIdCategoriesByCategoryId,
  useGetUserByIdCategories,
  UseGetUserByIdCategoriesKeyFn,
} from "../../API/queries"
import { Card, Button } from "flowbite-react"
import { FiTrash, FiPlus } from "react-icons/fi"
import { useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"

export default function ViewCategories() {
  const { userId } = useUser()
  const queryClient = useQueryClient()
  const { data: categories } = useGetUserByIdCategories({ path: { id: userId } })

  const { mutateAsync: deleteCategory } = useDeleteUserByIdCategoriesByCategoryId()
  const navigate = useNavigate()

  const handleDeleteCategory = useCallback(
    async (categoryId: string) => {
      await deleteCategory({ path: { id: userId, category_id: categoryId } })
      queryClient.invalidateQueries({
        queryKey: UseGetUserByIdCategoriesKeyFn({ path: { id: userId } }),
      })
    },
    [deleteCategory, queryClient, userId]
  )

  return (
    <div className="grid grid-cols-3 gap-4">
      {categories?.map((category) => (
        <Card key={category.id}>
          <div className="flex flex-row">
            <div className="flex flex-col flex-1 gap-4">
              <h3 className="font-medium">{category.name}</h3>
            </div>
            <div className="flex flex-col">
              <Button
                className="p-0 size-8"
                color="light"
                onClick={() => handleDeleteCategory(category.id)}
              >
                <FiTrash />
              </Button>
            </div>
          </div>
        </Card>
      ))}
      <Button
        color="light"
        className="flex items-center justify-center h-full text-2xl min-h-20"
        onClick={() => navigate("new-category")}
      >
        <FiPlus />
      </Button>
    </div>
  )
}
