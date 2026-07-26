import {
  TableRow,
  TableCell,
  TextInput,
  Button,
  ThemeProvider,
  createTheme,
} from "flowbite-react"
import { useMemo } from "react"
import { FiSave, FiX } from "react-icons/fi"
import SearchSelect from "../../Components/SearchSelect"
import BudgetRepeatFields from "../../Components/BudgetRepeatFields"
import BudgetPeriodFields from "../../Components/BudgetPeriodFields"
import { useBudgetTransactionEditor } from "./useBudgetTransactionEditor"

type EditBudgetTransactionRowProps = {
  budgetTransactionId?: string
  cancelCallback?: () => void
  isOutgoings?: boolean
}

export default function EditBudgetTransactionRow(
  props: EditBudgetTransactionRowProps,
) {
  const { budgetTransactionId, cancelCallback, isOutgoings = false } = props

  const editor = useBudgetTransactionEditor({
    budgetTransactionId,
    isOutgoings,
    onClose: cancelCallback,
  })

  const tableTheme = useMemo(
    () =>
      createTheme({
        table: {
          body: {
            cell: {
              base: "px-[18px] py-[10px]",
            },
          },
        },
        textInput: {
          field: {
            input: { sizes: { md: "p-[5px]" } },
          },
        },
        select: {
          field: {
            select: { sizes: { md: "p-[5px]" } },
          },
        },
      }),
    [],
  )

  if (!editor.isReady) return null

  return (
    <ThemeProvider theme={tableTheme}>
      <TableRow>
        <TableCell>
          <SearchSelect
            value={editor.selectedCategory}
            options={editor.categoryOptions}
            placeholder="Select category"
            onSearchChange={editor.setCategorySearch}
            onValueChange={editor.setSelectedCategory}
          />
        </TableCell>
        <TableCell>
          <TextInput
            placeholder="Description"
            value={editor.description}
            onChange={(e) => editor.setDescription(e.target.value)}
            onKeyUp={(e) => e.key === "Enter" && editor.handleSave()}
          />
        </TableCell>
        <TableCell>
          <TextInput
            placeholder="Amount"
            value={editor.amount}
            onChange={(e) => editor.setAmount(e.target.value)}
            onKeyUp={(e) => e.key === "Enter" && editor.handleSave()}
          />
        </TableCell>
        <TableCell>
          <BudgetRepeatFields
            repeatEvery={editor.repeatEvery}
            repeatUntil={editor.repeatUntil}
            onRepeatEveryChange={editor.setRepeatEvery}
            onRepeatUntilChange={editor.setRepeatUntil}
            onEnter={editor.handleSave}
          />
        </TableCell>
        <TableCell>
          <BudgetPeriodFields
            isEditMode={editor.isEditMode}
            startsOn={editor.startsOn}
            endsOn={editor.endsOn}
            effectiveFrom={editor.effectiveFrom}
            onStartsOnChange={editor.setStartsOn}
            onEndsOnChange={editor.setEndsOn}
            onEffectiveFromChange={editor.setEffectiveFrom}
          />
        </TableCell>
        <TableCell>
          <div className="flex flex-row items-center justify-end gap-2">
            <Button
              className="p-0 size-8"
              color="light"
              onClick={editor.handleSave}
            >
              <FiSave />
            </Button>
            <Button
              className="p-0 size-8"
              color="light"
              onClick={cancelCallback}
            >
              <FiX />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    </ThemeProvider>
  )
}
