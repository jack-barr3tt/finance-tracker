import { Button, FileInput, Modal, ModalBody, ModalFooter, ModalHeader } from "flowbite-react"
import { FiCheck, FiX } from "react-icons/fi"
import { useUser } from "../Hooks/useUser"
import {
  UseGetUserByIdSummaryAccountsKeyFn,
  UseGetUserByIdSummaryBalanceKeyFn,
  UseGetUserByIdSummaryCategoriesKeyFn,
  UseGetUserByIdTransactionsKeyFn,
} from "../API/queries"
import SearchSelect from "./SearchSelect"
import { useCallback, useState } from "react"
import { parseNationwide } from "../CSV/nationwide"
import { useQueryClient } from "@tanstack/react-query"
import { parseTrading212 } from "../CSV/trading212"
import { parseBarclaycard } from "../CSV/barclaycard"
import { useData } from "../Hooks/useData"

type UploadModalProps = {
  show: boolean
  onClose: () => void
}

export default function UploadModal(props: UploadModalProps) {
  const { show, onClose } = props

  const { userId, decrypt, encrypt } = useUser()
  const queryClient = useQueryClient()

  const { accounts } = useData()

  const [accountId, setAccountId] = useState<string | undefined>(undefined)
  const [accountSearch, setAccountSearch] = useState<string | undefined>(undefined)
  const [file, setFile] = useState<File | null>(null)

  const handleSubmit = useCallback(async () => {
    if (!file || !accountId) return

    const account = accounts?.find((account) => account.id === accountId)

    switch (account?.bank.short_name) {
      case "nationwide":
        await parseNationwide(file, userId, accountId, encrypt, decrypt)
        break
      case "t212": {
        const t212Accounts = accounts?.filter((account) => account.bank.short_name == "t212")
        const portfolioAccountId = t212Accounts?.find((a) => a.name === "Portfolio")?.id
        const uninvestedAccountId = t212Accounts?.find((a) => a.name === "Uninvested Cash")?.id
        if (!portfolioAccountId || !uninvestedAccountId) return
        await parseTrading212(
          file,
          userId,
          portfolioAccountId,
          uninvestedAccountId,
          encrypt,
          decrypt
        )
        break
      }
      case "barclaycard": {
        await parseBarclaycard(file, userId, accountId, encrypt, decrypt)
        break
      }
      default:
        break
    }

    queryClient.invalidateQueries({
      queryKey: UseGetUserByIdTransactionsKeyFn({ path: { id: userId } }),
    })
    queryClient.invalidateQueries({
      queryKey: UseGetUserByIdSummaryAccountsKeyFn({ path: { id: userId } }),
    })
    queryClient.invalidateQueries({
      queryKey: UseGetUserByIdSummaryCategoriesKeyFn({ path: { id: userId } }),
    })
    queryClient.invalidateQueries({
      queryKey: UseGetUserByIdSummaryBalanceKeyFn({ path: { id: userId } }),
    })
    onClose()
  }, [accountId, accounts, decrypt, encrypt, file, onClose, queryClient, userId])

  return (
    <Modal show={show} onClose={onClose}>
      <ModalHeader>Upload Transactions</ModalHeader>
      <ModalBody>
        <form className="flex flex-col gap-4">
          <SearchSelect
            options={
              accounts
                ?.filter((account) =>
                  account.name.toLowerCase().includes(accountSearch?.toLowerCase() || "")
                )
                .map((account) => ({
                  value: account.id,
                  label: account.name,
                })) || []
            }
            value={accountId}
            onValueChange={setAccountId}
            onSearchChange={setAccountSearch}
            placeholder="Select an account"
          />

          <FileInput onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
        </form>
      </ModalBody>
      <ModalFooter>
        <Button color="green" onClick={handleSubmit} disabled={!file || !accountId}>
          <FiCheck className="mr-2" /> Confirm
        </Button>
        <Button color="light" onClick={onClose}>
          <FiX className="mr-2" /> Cancel
        </Button>
      </ModalFooter>
    </Modal>
  )
}
