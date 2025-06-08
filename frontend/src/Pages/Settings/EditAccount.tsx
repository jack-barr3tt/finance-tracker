import {
  Button,
  Datepicker,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
} from "flowbite-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { FiSave, FiX } from "react-icons/fi"
import { useLocation, useNavigate } from "react-router-dom"
import {
  useGetUserByIdAccountsByAccountId,
  UseGetUserByIdAccountsByAccountIdKeyFn,
  UseGetUserByIdAccountsKeyFn,
  usePatchUserByIdAccountsByAccountId,
} from "../../API/queries"
import { useUser } from "../../Hooks/useUser"
import { useQueryClient } from "@tanstack/react-query"
import { parseISO } from "date-fns"

export default function EditAccount() {
  const location = useLocation()
  const navigate = useNavigate()

  const accountId = useMemo(
    () => /account\/(.+)\/edit/.exec(location.pathname)?.[1] ?? "",
    [location.pathname]
  )
  const { userId } = useUser()
  const queryClient = useQueryClient()
  const { data: account } = useGetUserByIdAccountsByAccountId(
    {
      path: { account_id: accountId, id: userId },
    },
    undefined,
    {
      enabled: !!userId && !!accountId,
    }
  )
  const { mutateAsync: editAccount } = usePatchUserByIdAccountsByAccountId()

  const [accountName, setAccountName] = useState("")
  const [openedAt, setOpenedAt] = useState<Date | null>(new Date())
  const [closedAt, setClosedAt] = useState<Date | null>()

  useEffect(() => {
    if (account) {
      setAccountName(account.name)
      setOpenedAt(account.opened_at ? parseISO(account.opened_at) : new Date())
      setClosedAt(account.closed_at ? parseISO(account.closed_at) : null)
    }
  }, [account])

  const handleSave = useCallback(async () => {
    if (!account) return
    await editAccount({
      path: { account_id: accountId, id: userId },
      body: {
        name: accountName,
        opened_at: openedAt?.toISOString(),
        closed_at: closedAt?.toISOString(),
      },
    })
    queryClient.invalidateQueries({
      queryKey: UseGetUserByIdAccountsKeyFn({ path: { id: userId } }),
    })
    queryClient.invalidateQueries({
      queryKey: UseGetUserByIdAccountsByAccountIdKeyFn({
        path: { id: userId, account_id: accountId },
      }),
    })
    navigate("/settings")
  }, [
    account,
    editAccount,
    accountId,
    userId,
    accountName,
    openedAt,
    closedAt,
    queryClient,
    navigate,
  ])

  return (
    <Modal show={/settings\/account\/(.+)\/edit/.test(location.pathname)}>
      <ModalHeader>Edit Account</ModalHeader>
      <ModalBody theme={{ base: "overflow-visible" }}>
        <form className="flex flex-col gap-4">
          {!account?.bank?.fixed_products && (
            <>
              <Label htmlFor="account-name" className="text-sm font-medium">
                Account Name
              </Label>
              <TextInput
                id="account-name"
                value={accountName}
                placeholder="Account Name"
                onChange={(e) => setAccountName(e.target.value)}
              />
            </>
          )}

          <Label htmlFor="opened-at" className="text-sm font-medium">
            Opened At
          </Label>
          <Datepicker id="opened-at" value={openedAt} onChange={setOpenedAt} />

          <Label htmlFor="closed-at" className="text-sm font-medium">
            Closed At
          </Label>
          <Datepicker id="closed-at" value={closedAt} onChange={setClosedAt} />
        </form>
      </ModalBody>
      <ModalFooter>
        <Button onClick={handleSave} color="green">
          <FiSave className="mr-2" /> Save
        </Button>
        <Button color="light" onClick={() => navigate("/settings")}>
          <FiX className="mr-2" /> Cancel
        </Button>
      </ModalFooter>
    </Modal>
  )
}
