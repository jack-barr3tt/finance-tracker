import { Button, Table, TableCell, TableHead, TableHeadCell, TableRow } from "flowbite-react"
import { useUser } from "../Hooks/useUser"
import {
  useDeleteUserByIdTransactionsByTransactionId,
  useGetUserByIdTransactions,
  UseGetUserByIdTransactionsByTransactionIdKeyFn,
  UseGetUserByIdTransactionsKeyFn,
} from "../API/queries"
import { FiEdit, FiPlus, FiTrash } from "react-icons/fi"
import EditTransactionRow from "./Dashboard/EditTransactionRow"
import TableBodyWithButton from "../Components/TableBodyWithButton"
import { useCallback, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

export default function Dashboard() {
  const { userId } = useUser()
  const queryClient = useQueryClient()
  const { data: transactions, isLoading } = useGetUserByIdTransactions({ path: { id: userId } })
  const { mutateAsync: deleteTransaction } = useDeleteUserByIdTransactionsByTransactionId()

  const [showAdd, setShowAdd] = useState(false)
  const [editingTransactionId, setEditingTransactionId] = useState<string | undefined>(undefined)

  const handleDelete = useCallback(
    async (transactionId: string) => {
      await deleteTransaction({
        path: { id: userId, transaction_id: transactionId },
      })
      if (editingTransactionId === transactionId) setEditingTransactionId(undefined)
      queryClient.invalidateQueries({
        queryKey: UseGetUserByIdTransactionsKeyFn({ path: { id: userId } }),
      })
      queryClient.invalidateQueries({
        queryKey: UseGetUserByIdTransactionsByTransactionIdKeyFn({
          path: { id: userId, transaction_id: transactionId },
        }),
      })
    },
    [deleteTransaction, userId, editingTransactionId, queryClient]
  )

  return (
    <div className="flex flex-col gap-8 px-16">
      <h2 className="text-2xl font-medium">Dashboard</h2>

      <Table striped>
        <TableHead>
          <TableRow>
            <TableHeadCell>Date</TableHeadCell>
            <TableHeadCell>Account</TableHeadCell>
            <TableHeadCell>Category</TableHeadCell>
            <TableHeadCell>Description</TableHeadCell>
            <TableHeadCell>Amount</TableHeadCell>
            <TableHeadCell>
              <span className="sr-only">Edit</span>
            </TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBodyWithButton
          button={
            !showAdd ? (
              <Button
                className="p-0 shadow-md size-8"
                color="light"
                onClick={() => setShowAdd(true)}
              >
                <FiPlus />
              </Button>
            ) : null
          }
        >
          {isLoading ? (
            Array(10)
              .fill(0)
              .map((_, index) => (
                <TableRow key={index} className="animate-pulse">
                  <TableCell className="h-8 bg-gray-200 dark:bg-gray-700"></TableCell>
                  <TableCell className="h-8 bg-gray-200 dark:bg-gray-700"></TableCell>
                  <TableCell className="h-8 bg-gray-200 dark:bg-gray-700"></TableCell>
                  <TableCell className="h-8 bg-gray-200 dark:bg-gray-700"></TableCell>
                  <TableCell className="h-8 bg-gray-200 dark:bg-gray-700"></TableCell>
                  <TableCell className="h-8 bg-gray-200 dark:bg-gray-700"></TableCell>
                </TableRow>
              ))
          ) : (
            <>
              {transactions?.length === 0 && !showAdd ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                transactions?.map((transaction) =>
                  editingTransactionId ? (
                    <EditTransactionRow
                      transactionId={transaction.id}
                      cancelCallback={() => setEditingTransactionId(undefined)}
                    />
                  ) : (
                    <TableRow key={transaction.id} className="group/trnscrow">
                      <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                      <TableCell>{transaction.account.name}</TableCell>
                      <TableCell>{transaction.category?.name}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        {transaction.amount.toLocaleString("en-GB", {
                          style: "currency",
                          currency: "GBP",
                        })}
                      </TableCell>
                      <TableCell className="p-0">
                        <div className="flex flex-row items-center invisible gap-2 group-hover/trnscrow:visible">
                          <Button
                            className="p-0 size-8"
                            color="light"
                            onClick={() => setEditingTransactionId(transaction.id)}
                          >
                            <FiEdit />
                          </Button>
                          <Button
                            className="p-0 size-8"
                            color="light"
                            onClick={() => handleDelete(transaction.id)}
                          >
                            <FiTrash />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                )
              )}
              <EditTransactionRow show={showAdd} cancelCallback={() => setShowAdd(false)} />
            </>
          )}
        </TableBodyWithButton>
      </Table>
    </div>
  )
}
