import {
  TableRow,
  TableCell,
  TextInput,
  Button,
  ThemeProvider,
  createTheme,
} from "flowbite-react"
import { Ref, useMemo } from "react"
import { FiSave, FiX } from "react-icons/fi"
import SearchSelect from "../../Components/SearchSelect"
import CalendarDatePicker from "../../Components/CalendarDatePicker"
import { transactionTableCellClass } from "./transactionTableColumns"
import { useTransactionEditor } from "./useTransactionEditor"

type EditTransactionRowProps = {
  transactionId?: string
  cancelCallback?: () => void
  defaultAccountId?: string
  defaultCategoryId?: string
  rowRef?: Ref<HTMLTableRowElement>
  "data-index"?: number
}

export default function EditTransactionRow(props: EditTransactionRowProps) {
  const {
    transactionId,
    cancelCallback,
    defaultAccountId,
    defaultCategoryId,
    rowRef,
    ...rowProps
  } = props

  const editor = useTransactionEditor({
    transactionId,
    defaultAccountId,
    defaultCategoryId,
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
      }),
    [],
  )

  if (!editor.isReady) return null

  return (
    <ThemeProvider theme={tableTheme}>
      <TableRow ref={rowRef} {...rowProps}>
        <TableCell className={transactionTableCellClass.date}>
          <CalendarDatePicker
            value={editor.date}
            onChange={editor.setDate}
            autoFocus
          />
        </TableCell>
        <TableCell className={transactionTableCellClass.account}>
          <SearchSelect
            value={editor.selectedAccount}
            options={editor.accountOptions}
            placeholder="Select account"
            onSearchChange={editor.setAccountSearch}
            onValueChange={editor.setSelectedAccount}
          />
        </TableCell>
        <TableCell className={transactionTableCellClass.category}>
          <SearchSelect
            value={editor.selectedCategory}
            options={editor.categoryOptions}
            placeholder="Select category"
            onSearchChange={editor.setCategorySearch}
            onValueChange={editor.setSelectedCategory}
          />
        </TableCell>
        <TableCell className={transactionTableCellClass.description}>
          <TextInput
            className="min-w-0"
            placeholder="Description"
            value={editor.description}
            onChange={(e) => editor.setDescription(e.target.value)}
          />
        </TableCell>
        <TableCell className={transactionTableCellClass.amount}>
          <TextInput
            className="min-w-0"
            placeholder="Amount"
            value={editor.amount}
            onChange={(e) => editor.setAmount(e.target.value)}
          />
        </TableCell>
        <TableCell className={transactionTableCellClass.actions}>
          <div className="flex flex-row items-center justify-end gap-2">
            <Button
              className="p-0 shrink-0 size-8"
              color="light"
              onClick={editor.handleSave}
            >
              <FiSave />
            </Button>
            <Button
              className="p-0 shrink-0 size-8"
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
