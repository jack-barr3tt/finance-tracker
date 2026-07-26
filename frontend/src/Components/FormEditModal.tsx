import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "flowbite-react"
import { MouseEvent, ReactNode } from "react"
import { FiSave, FiTrash, FiX } from "react-icons/fi"

type FormEditModalProps = {
  show: boolean
  title: string
  isLoading?: boolean
  isEditMode?: boolean
  onClose: () => void
  onSave: () => void
  onDelete?: (event: MouseEvent<HTMLButtonElement>) => void
  saveDisabled?: boolean
  children: ReactNode
}

export default function FormEditModal(props: FormEditModalProps) {
  const {
    show,
    title,
    isLoading = false,
    isEditMode = false,
    onClose,
    onSave,
    onDelete,
    saveDisabled = false,
    children,
  } = props

  return (
    <Modal show={show} onClose={onClose}>
      <ModalHeader>{title}</ModalHeader>

      <ModalBody theme={{ base: "overflow-visible" }}>
        {isLoading ? (
          <p className="text-gray-500 dark:text-gray-400">Loading…</p>
        ) : (
          children
        )}
      </ModalBody>

      <ModalFooter className="flex flex-wrap justify-end gap-2">
        <Button onClick={onSave} disabled={isLoading || saveDisabled}>
          <FiSave className="mr-2" />
          Save
        </Button>
        <Button color="light" onClick={onClose}>
          <FiX className="mr-2" />
          Cancel
        </Button>
        {isEditMode && onDelete && (
          <Button color="red" onClick={onDelete} disabled={isLoading}>
            <FiTrash className="mr-2" />
            Delete
          </Button>
        )}
      </ModalFooter>
    </Modal>
  )
}
