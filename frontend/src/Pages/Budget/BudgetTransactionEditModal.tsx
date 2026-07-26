import { Label, TextInput } from "flowbite-react"
import { MouseEvent } from "react"
import SearchSelect from "../../Components/SearchSelect"
import FormEditModal from "../../Components/FormEditModal"
import BudgetRepeatFields from "../../Components/BudgetRepeatFields"
import BudgetPeriodFields from "../../Components/BudgetPeriodFields"
import { useBudgetTransactionEditor } from "./useBudgetTransactionEditor"

type BudgetTransactionEditModalProps = {
  show: boolean
  budgetTransactionId?: string
  isOutgoings?: boolean
  onClose: () => void
  onDelete?: (event: MouseEvent<HTMLButtonElement>) => void
}

export default function BudgetTransactionEditModal(
  props: BudgetTransactionEditModalProps,
) {
  const {
    show,
    budgetTransactionId,
    isOutgoings = false,
    onClose,
    onDelete,
  } = props

  const editor = useBudgetTransactionEditor({
    budgetTransactionId,
    isOutgoings,
    onClose,
  })

  return (
    <FormEditModal
      show={show}
      title={editor.isEditMode ? "Edit budget line" : "Add budget line"}
      isLoading={!editor.isReady}
      isEditMode={editor.isEditMode}
      onClose={onClose}
      onSave={editor.handleSave}
      onDelete={onDelete}
      saveDisabled={!editor.isReady}
    >
      <form className="flex flex-col gap-4">
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

        <div>
          <Label className="mb-1 block text-sm font-medium">Frequency</Label>
          <BudgetRepeatFields
            layout="stacked"
            repeatEvery={editor.repeatEvery}
            repeatUntil={editor.repeatUntil}
            onRepeatEveryChange={editor.setRepeatEvery}
            onRepeatUntilChange={editor.setRepeatUntil}
            onEnter={editor.handleSave}
          />
        </div>

        <div>
          <Label className="mb-1 block text-sm font-medium">Period</Label>
          <BudgetPeriodFields
            layout="stacked"
            isEditMode={editor.isEditMode}
            startsOn={editor.startsOn}
            endsOn={editor.endsOn}
            effectiveFrom={editor.effectiveFrom}
            onStartsOnChange={editor.setStartsOn}
            onEndsOnChange={editor.setEndsOn}
            onEffectiveFromChange={editor.setEffectiveFrom}
          />
        </div>
      </form>
    </FormEditModal>
  )
}
