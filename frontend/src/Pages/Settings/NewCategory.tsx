import { Modal, ModalHeader, ModalBody, TextInput, ModalFooter, Button } from "flowbite-react"
import { useCallback, useState } from "react"
import { UseGetUserByIdCategoriesKeyFn, usePostUserByIdCategories } from "../../API/queries"
import { useUser } from "../../Hooks/useUser"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"

export default function NewCategory() {
  const { userId, encrypt } = useUser()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { mutateAsync: createCategory } = usePostUserByIdCategories()
  const [categoryName, setCategoryName] = useState<string>("")

  const handleSubmit = useCallback(async () => {
    if (!categoryName) return
    await createCategory({ path: { id: userId }, body: { name: await encrypt(categoryName) } })
    queryClient.invalidateQueries({
      queryKey: UseGetUserByIdCategoriesKeyFn({ path: { id: userId } }),
    })
    setCategoryName("")
    navigate("/settings")
  }, [categoryName, createCategory, navigate, queryClient, userId, encrypt])

  return (
    <Modal show={location.pathname.includes("settings/new-category")} onClose={() => navigate("/settings")}>
      <ModalHeader>New Category</ModalHeader>

      <ModalBody>
        <form className="flex flex-col gap-4">
          <TextInput
            id="category-name"
            value={categoryName}
            placeholder="Category Name"
            onChange={(e) => setCategoryName(e.target.value)}
          />
        </form>
      </ModalBody>

      <ModalFooter>
        <Button onClick={() => handleSubmit()} color="green">
          Create
        </Button>
        <Button color="light" onClick={() => navigate("/settings")}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  )
}
