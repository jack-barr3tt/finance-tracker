import { TableRow, TableCell, Datepicker, TextInput, Button } from "flowbite-react"
import { useCallback, useState } from "react"
import { FiCheck, FiPlus, FiX } from "react-icons/fi"
import {
  useGetUserByIdAccounts,
  useGetUserByIdCategories,
  UseGetUserByIdTransactionsKeyFn,
  usePostUserByIdTransactions,
} from "../API/queries"
import { useUser } from "../Hooks/useUser"
import SearchSelect from "./SearchSelect"
import { useQueryClient } from "@tanstack/react-query"

export default function TableAddRow() {
  const [showAdd, setShowAdd] = useState(false)

  const { userId } = useUser()
  const queryClient = useQueryClient()
  const { data: accounts } = useGetUserByIdAccounts({ path: { id: userId } })
  const { data: categories } = useGetUserByIdCategories({ path: { id: userId } })
  const { mutateAsync: addTransaction } = usePostUserByIdTransactions()

  const [accountSearch, setAccountSearch] = useState<string | undefined>(undefined)
  const [categorySearch, setCategorySearch] = useState<string | undefined>(undefined)

  const [date, setDate] = useState<Date | null>(null)
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [selectedAccount, setSelectedAccount] = useState<string | undefined>(undefined)
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined)

  const handleAdd = useCallback(async () => {
    if (!date || !selectedAccount || !selectedCategory || !amount) return

    await addTransaction({
      body: {
        account_id: selectedAccount,
        category_id: selectedCategory,
        description,
        amount: parseFloat(amount),
      },
      path: { id: userId },
    })
    await queryClient.invalidateQueries({
      queryKey: UseGetUserByIdTransactionsKeyFn({ path: { id: userId } }),
    })
    // Reset the form fields
    setDate(null)
    setDescription("")
    setAmount("")
    setSelectedAccount(undefined)
    setSelectedCategory(undefined)
    setAccountSearch(undefined)
    setCategorySearch(undefined)
    // Reset the search inputs
    setAccountSearch("")
    setCategorySearch("")
    // Hide the add row
    setShowAdd(false)
  }, [
    addTransaction,
    amount,
    date,
    description,
    queryClient,
    selectedAccount,
    selectedCategory,
    userId,
  ])

  if (!showAdd || !accounts || !categories)
    return (
      <TableRow className="h-0">
        <TableCell colSpan={6} className="relative h-0 text-center">
          <div className="relative top-0 flex items-center flew-row">
            <Button onClick={() => setShowAdd(true)} className="w-10 p-0">
              <FiPlus />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    )

  return (
    <TableRow>
      <TableCell>
        <Datepicker value={date} onChange={setDate} />
      </TableCell>
      <TableCell>
        <SearchSelect
          value={selectedAccount}
          options={accounts
            .filter(
              (account) =>
                !accountSearch || account.name.toLowerCase().includes(accountSearch.toLowerCase())
            )
            .map((account) => ({
              label: account.name,
              value: account.id,
            }))}
          placeholder="Select account"
          onSearchChange={setAccountSearch}
          onValueChange={setSelectedAccount}
        />
      </TableCell>
      <TableCell>
        <SearchSelect
          value={selectedCategory}
          options={categories
            .filter(
              (category) =>
                !categorySearch ||
                category.name.toLowerCase().includes(categorySearch.toLowerCase())
            )
            .map((category) => ({
              label: category.name,
              value: category.id,
            }))}
          placeholder="Select category"
          onSearchChange={setCategorySearch}
          onValueChange={setSelectedCategory}
        />
      </TableCell>
      <TableCell>
        <TextInput
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </TableCell>
      <TableCell>
        <TextInput
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </TableCell>
      <TableCell>
        <div className="flex flex-row items-center gap-4">
          <Button className="w-10 p-0" color="green" onClick={handleAdd}>
            <FiCheck />
          </Button>
          <Button className="w-10 p-0" color="red" onClick={() => setShowAdd(false)}>
            <FiX />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
