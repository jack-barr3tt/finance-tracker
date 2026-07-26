import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "flowbite-react"

type ConfirmDeleteModalProps = {
  show: boolean
  title?: string
  message?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDeleteModal(props: ConfirmDeleteModalProps) {
  const {
    show,
    title = "Delete transaction?",
    message = "This cannot be undone.",
    onConfirm,
    onCancel,
  } = props

  return (
    <Modal show={show} onClose={onCancel} size="md">
      <ModalHeader>{title}</ModalHeader>
      <ModalBody>
        <p className="text-gray-500 dark:text-gray-400">{message}</p>
      </ModalBody>
      <ModalFooter>
        <Button color="red" onClick={onConfirm}>
          Delete
        </Button>
        <Button color="light" onClick={onCancel}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  )
}
