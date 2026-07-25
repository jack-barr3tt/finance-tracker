import { useUser } from "../../Hooks/useUser"
import {
  getGetUserIdCategoriesQueryKey,
  useDeleteUserIdCategoriesCategoryId,
  useGetUserIdCategories,
} from "../../API"
import { Card, Button } from "flowbite-react"
import { FiTrash, FiPlus, FiEdit } from "react-icons/fi"
import { useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { useAsyncMemo } from "../../Hooks/useAsyncMemo"
import { decryptCategory } from "../../Security/data"

export default function ViewCategories() {
  const { userId, decrypt } = useUser()
  const queryClient = useQueryClient()
  const { data: encryptedCategories } = useGetUserIdCategories(userId, {
    query: { enabled: !!userId },
  })

  const categories = useAsyncMemo(
    async () =>
      (
        await Promise.all(
          encryptedCategories?.map((cat) => decryptCategory(cat, decrypt)) ??
            [],
        )
      ).sort((a, b) => a.name.localeCompare(b.name)),
    [decrypt, encryptedCategories],
  )

  const { mutateAsync: deleteCategory } = useDeleteUserIdCategoriesCategoryId()
  const navigate = useNavigate()

  const handleDeleteCategory = useCallback(
    async (categoryId: string) => {
      await deleteCategory({ id: userId, categoryId })
      queryClient.invalidateQueries({
        queryKey: getGetUserIdCategoriesQueryKey(userId),
      })
    },
    [deleteCategory, queryClient, userId],
  )

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4">
      {categories?.map((category) => (
        <Card key={category.id} theme={{ root: { children: "p-2! md:p-6!" } }}>
          <div className="grid items-center grid-cols-3 md:grid-cols-2">
            <h3 className="font-medium">{category.name}</h3>
            <p className="text-sm md:order-last">
              {category.rules.length} rule
              {category.rules.length !== 1 ? "s" : ""}
            </p>

            <div className="flex flex-row items-center justify-end gap-2 md:row-span-2 md:items-end md:flex-col">
              <Button
                className="p-0 md:mb-2 size-8"
                color="light"
                onClick={() => navigate(`category/${category.id}/edit`)}
              >
                <FiEdit />
              </Button>
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
