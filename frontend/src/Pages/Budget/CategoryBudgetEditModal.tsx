import { Label, TextInput } from "flowbite-react"
import { MouseEvent } from "react"
import SearchSelect from "../../Components/SearchSelect"
import FormEditModal from "../../Components/FormEditModal"
import BudgetRepeatFields from "../../Components/BudgetRepeatFields"
import BudgetPeriodFields from "../../Components/BudgetPeriodFields"
import { CategoryBudget } from "../../API"
import { useCategoryBudgetEditor } from "./useCategoryBudgetEditor"

type CategoryBudgetEditModalProps = {
  show: boolean
  categoryBudgetId?: string
  existingCategoryBudgets: CategoryBudget[]
  onClose: () => void
  onDelete?: (event: MouseEvent<HTMLButtonElement>) => void
}

export default function CategoryBudgetEditModal(
  props: CategoryBudgetEditModalProps,
) {
  const { show, categoryBudgetId, existingCategoryBudgets, onClose, onDelete } =
    props

  const editor = useCategoryBudgetEditor({
    categoryBudgetId,
    existingCategoryBudgets,
    onClose,
  })

  return (
    <FormEditModal
      show={show}
      title={editor.isEditMode ? "Edit category budget" : "Add category budget"}
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
          <Label className="mb-1 block text-sm font-medium">Limit</Label>
          <TextInput
            placeholder="Limit"
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
