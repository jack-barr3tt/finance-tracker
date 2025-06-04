import { useQueryClient } from "@tanstack/react-query"
import { Card, Button } from "flowbite-react"
import { useCallback } from "react"
import { FiTrash, FiPlus } from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import {
  useGetUserByIdAccounts,
  useDeleteUserByIdAccountsByAccountId,
  UseGetUserByIdAccountsKeyFn,
} from "../../API/queries"
import { useUser } from "../../Hooks/useUser"

export default function ViewAccounts() {
  const { userId } = useUser()
  const queryClient = useQueryClient()
  const { data: accounts } = useGetUserByIdAccounts({ path: { id: userId } }, undefined, {
    enabled: !!userId,
  })
  const { mutateAsync: deleteAccount } = useDeleteUserByIdAccountsByAccountId()

  const navigate = useNavigate()

  const handleDeleteAccount = useCallback(
    async (accountId: string) => {
      await deleteAccount({ path: { id: userId, account_id: accountId } })
      queryClient.invalidateQueries({
        queryKey: UseGetUserByIdAccountsKeyFn({ path: { id: userId } }),
      })
    },
    [deleteAccount, queryClient, userId]
  )

  return (
    <div className="grid grid-cols-3 gap-4">
      {accounts?.map((account) => (
        <Card key={account.id}>
          <div className="flex flex-row">
            <div className="flex flex-col flex-1 gap-4">
              <h3 className="font-medium">{account.name}</h3>
              <p className="text-sm">{account.bank.name}</p>
            </div>
            <div className="flex flex-col">
              <Button
                className="p-0 size-8"
                color="light"
                onClick={() => handleDeleteAccount(account.id)}
              >
                <FiTrash />
              </Button>
            </div>
          </div>
        </Card>
      ))}
      <Button
        color="light"
        className="flex items-center justify-center h-full text-2xl min-h-20"
        onClick={() => navigate("new-account")}
      >
        <FiPlus />
      </Button>
    </div>
  )
}
