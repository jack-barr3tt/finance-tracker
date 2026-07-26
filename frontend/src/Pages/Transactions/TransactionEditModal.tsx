import { Label, TextInput } from "flowbite-react"
import { MouseEvent } from "react"
import SearchSelect from "../../Components/SearchSelect"
import CalendarDatePicker from "../../Components/CalendarDatePicker"
import FormEditModal from "../../Components/FormEditModal"
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
    <FormEditModal
      show={show}
      title={editor.isEditMode ? "Edit transaction" : "Add transaction"}
      isLoading={!editor.isReady}
      isEditMode={editor.isEditMode}
      onClose={onClose}
      onSave={editor.handleSave}
      onDelete={onDelete}
      saveDisabled={!editor.isReady}
    >
      <form className="flex flex-col gap-4">
        <div>
          <Label className="mb-1 block text-sm font-medium">Date</Label>
          <CalendarDatePicker value={editor.date} onChange={editor.setDate} />
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
          <Label className="mb-1 block text-sm font-medium">Description</Label>
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
    </FormEditModal>
  )
}
