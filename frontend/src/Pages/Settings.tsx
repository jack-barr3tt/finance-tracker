import { Button, Card, HR } from "flowbite-react"
import {
  useDeleteUserByIdAccountsByAccountId,
  useGetUserByIdAccounts,
  UseGetUserByIdAccountsKeyFn,
} from "../API/queries"
import { useUser } from "../Hooks/useUser"
import { FiPlus, FiTrash } from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import NewAccount from "./Settings/NewAccount"
import { useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"

export default function Settings() {
  const { userId } = useUser()
  const queryClient = useQueryClient()
  const { data: accounts } = useGetUserByIdAccounts({ path: { id: userId } })
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
    <div className="flex flex-col gap-4 px-16">
      <NewAccount />

      <h2 className="text-2xl font-medium">Settings</h2>

      <HR className="my-4" />

      <h3 className="text-xl font-medium">Accounts</h3>
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
    </div>
  )
}
