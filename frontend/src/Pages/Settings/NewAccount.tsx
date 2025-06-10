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
import { useLocation, useNavigate } from "react-router-dom"
import {
  useGetBanks,
  UseGetUserByIdAccountsKeyFn,
  usePostUserByIdAccounts,
} from "../../API/queries"
import SearchSelect from "../../Components/SearchSelect"
import { useCallback, useState } from "react"
import { useUser } from "../../Hooks/useUser"
import { useQueryClient } from "@tanstack/react-query"
import { AccountCreateRequest } from "../../API/requests"

export default function NewAccount() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { userId, encrypt } = useUser()

  const { data: banks } = useGetBanks()
  const { mutateAsync: createAccount } = usePostUserByIdAccounts()

  const [bankSearch, setBankSearch] = useState<string | undefined>(undefined)
  const [bankId, setBankId] = useState<string | undefined>(undefined)
  const [accountName, setAccountName] = useState<string>("")
  const [openedAt, setOpenedAt] = useState<Date | null>(null)

  const handleSubmit = useCallback(async () => {
    if (!bankId) return

    const bank = banks?.find((b) => b.id.toString() === bankId)
    if (!bank) return

    const accountsToCreate: AccountCreateRequest[] = []

    if (bank.fixed_products) {
      switch (bank.short_name) {
        case "t212": {
          accountsToCreate.push(
            {
              bank_id: bankId,
              name: "Uninvested Cash",
              opened_at: (openedAt ?? new Date()).toISOString(),
            },
            {
              bank_id: bankId,
              name: "Portfolio",
              opened_at: (openedAt ?? new Date()).toISOString(),
            }
          )
          break
        }
      }
    } else {
      accountsToCreate.push({
        bank_id: bankId,
        name: accountName,
        opened_at: (openedAt ?? new Date()).toISOString(),
      })
    }

    await Promise.all(
      accountsToCreate.map(async (account) =>
        createAccount({
          path: { id: userId },
          body: { ...account, name: await encrypt(account.name) },
        })
      )
    )
    queryClient.invalidateQueries({
      queryKey: UseGetUserByIdAccountsKeyFn({ path: { id: userId } }),
    })
    setBankSearch(undefined)
    setBankId(undefined)
    setAccountName("")
    setOpenedAt(null)
    navigate("/settings")
  }, [bankId, banks, queryClient, userId, navigate, openedAt, accountName, createAccount, encrypt])

  return (
    <Modal show={location.pathname.includes("settings/new-account")}>
      <ModalHeader>New Account</ModalHeader>

      <ModalBody theme={{ base: "overflow-visible" }}>
        <form className="flex flex-col gap-2">
          <Label htmlFor="bank-select" className="text-sm font-medium">
            Bank
          </Label>
          <SearchSelect
            id="bank-select"
            value={bankId}
            placeholder="Select a bank"
            onValueChange={setBankId}
            onSearchChange={setBankSearch}
            options={
              banks
                ?.filter(
                  (bank) =>
                    !bankSearch || bank.name.toLowerCase().includes(bankSearch.toLowerCase())
                )
                .map((bank) => ({
                  label: bank.name,
                  value: bank.id.toString(),
                })) || []
            }
          />

          {(!bankId || !banks?.find((b) => b.id == bankId)?.fixed_products) && (
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
          <Datepicker value={openedAt} onChange={setOpenedAt} />
        </form>
      </ModalBody>

      <ModalFooter>
        <Button onClick={() => handleSubmit()} color="green">
          Create
        </Button>
        <Button color="light" onClick={() => navigate("/settings")}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  )
}
