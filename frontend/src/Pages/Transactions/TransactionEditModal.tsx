import {
  Button,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
} from "flowbite-react"
import { MouseEvent } from "react"
import { FiSave, FiTrash, FiX } from "react-icons/fi"
import SearchSelect from "../../Components/SearchSelect"
import CalendarDatePicker from "../../Components/CalendarDatePicker"
import { useTransactionEditor } from "./useTransactionEditor"

type TransactionEditModalProps = {
  show: boolean
  transactionId?: string
  defaultAccountId?: string
  defaultCategoryId?: string
  onClose: () => void
  onDelete?: (event: MouseEvent<HTMLButtonElement>) => void
}

export default function TransactionEditModal(props: TransactionEditModalProps) {
  const {
    show,
    transactionId,
    defaultAccountId,
    defaultCategoryId,
    onClose,
    onDelete,
  } = props

  const editor = useTransactionEditor({
    transactionId,
    defaultAccountId,
    defaultCategoryId,
    onClose,
    enableHotkeys: show,
  })

  return (
    <Modal show={show} onClose={onClose}>
      <ModalHeader>
        {editor.isEditMode ? "Edit transaction" : "Add transaction"}
      </ModalHeader>

      <ModalBody theme={{ base: "overflow-visible" }}>
        {!editor.isReady ? (
          <p className="text-gray-500 dark:text-gray-400">Loading…</p>
        ) : (
          <form className="flex flex-col gap-4">
            <div>
              <Label className="mb-1 block text-sm font-medium">Date</Label>
              <CalendarDatePicker
                value={editor.date}
                onChange={editor.setDate}
              />
            </div>

            <div>
              <Label className="mb-1 block text-sm font-medium">Account</Label>
              <SearchSelect
                value={editor.selectedAccount}
                options={editor.accountOptions}
                placeholder="Select account"
                onSearchChange={editor.setAccountSearch}
                onValueChange={editor.setSelectedAccount}
              />
            </div>

            <div>
              <Label className="mb-1 block text-sm font-medium">Category</Label>
              <SearchSelect
                value={editor.selectedCategory}
                options={editor.categoryOptions}
                placeholder="Select category"
                onSearchChange={editor.setCategorySearch}
                onValueChange={editor.setSelectedCategory}
              />
            </div>

            <div>
              <Label className="mb-1 block text-sm font-medium">
                Description
              </Label>
              <TextInput
                placeholder="Description"
                value={editor.description}
                onChange={(e) => editor.setDescription(e.target.value)}
              />
            </div>

            <div>
              <Label className="mb-1 block text-sm font-medium">Amount</Label>
              <TextInput
                placeholder="Amount"
                value={editor.amount}
                onChange={(e) => editor.setAmount(e.target.value)}
              />
            </div>
          </form>
        )}
      </ModalBody>

      <ModalFooter className="flex flex-wrap justify-end gap-2">
        <Button onClick={editor.handleSave} disabled={!editor.isReady}>
          <FiSave className="mr-2" />
          Save
        </Button>
        <Button color="light" onClick={onClose}>
          <FiX className="mr-2" />
          Cancel
        </Button>
        {editor.isEditMode && onDelete && (
          <Button color="red" onClick={onDelete} disabled={!editor.isReady}>
            <FiTrash className="mr-2" />
            Delete
          </Button>
        )}
      </ModalFooter>
    </Modal>
  )
}
