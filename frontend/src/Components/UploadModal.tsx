import {
  Button,
  FileInput,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
} from "flowbite-react"
import { FiCheck, FiX } from "react-icons/fi"
import { useUser } from "../Hooks/useUser"
import { toast } from "sonner"
import {
  getGetUserIdSummaryAccountsQueryKey,
  getGetUserIdSummaryBalanceQueryKey,
  getGetUserIdSummaryCategoriesQueryKey,
  getGetUserIdTransactionsInfiniteQueryKey,
} from "../API"
import SearchSelect from "./SearchSelect"
import { useCallback, useState } from "react"
import { parseNationwide } from "../CSV/nationwide"
import { useQueryClient } from "@tanstack/react-query"
import { parseTrading212 } from "../CSV/trading212"
import { parseBarclaycard } from "../CSV/barclaycard"
import { parseMonzo } from "../CSV/monzo"
import { parseTescoBank } from "../CSV/tescobank"
import { useData } from "../Hooks/useData"
import { formatError } from "../utils/formatError"

type UploadModalProps = {
  show: boolean
  onClose: () => void
}

export default function UploadModal(props: UploadModalProps) {
  const { show, onClose } = props

  const { userId, decrypt, encrypt, computeDedupeHash } = useUser()
  const queryClient = useQueryClient()

  const { accounts } = useData()

  const [accountId, setAccountId] = useState<string | undefined>(undefined)
  const [accountSearch, setAccountSearch] = useState<string | undefined>(
    undefined,
  )
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleSubmit = useCallback(async () => {
    if (!file || !accountId || isUploading) return

    const account = accounts?.find((account) => account.id === accountId)
    if (!account) {
      toast.error("Selected account could not be found.")
      return
    }

    setIsUploading(true)

    try {
      let summary
      switch (account.bank.short_name) {
        case "nationwide":
          summary = await parseNationwide(
            file,
            userId,
            accountId,
            encrypt,
            decrypt,
            computeDedupeHash,
          )
          break
        case "t212": {
          const t212Accounts = accounts?.filter(
            (account) => account.bank.short_name == "t212",
          )
          const portfolioAccountId = t212Accounts?.find(
            (a) => a.name === "Portfolio",
          )?.id
          const uninvestedAccountId = t212Accounts?.find(
            (a) => a.name === "Uninvested Cash",
          )?.id
          if (!portfolioAccountId || !uninvestedAccountId) {
            throw new Error(
              "Trading 212 Portfolio and Uninvested Cash accounts are required.",
            )
          }
          summary = await parseTrading212(
            file,
            userId,
            portfolioAccountId,
            uninvestedAccountId,
            encrypt,
            decrypt,
            computeDedupeHash,
          )
          break
        }
        case "barclaycard": {
          summary = await parseBarclaycard(
            file,
            userId,
            accountId,
            encrypt,
            decrypt,
            computeDedupeHash,
          )
          break
        }
        case "monzo": {
          summary = await parseMonzo(
            file,
            userId,
            accountId,
            encrypt,
            decrypt,
            computeDedupeHash,
          )
          break
        }
        case "tescobank": {
          summary = await parseTescoBank(
            file,
            userId,
            accountId,
            encrypt,
            decrypt,
            computeDedupeHash,
          )
          break
        }
        default:
          throw new Error(
            `CSV import is not supported for ${account.bank.name}.`,
          )
      }

      if (summary.skippedDuplicates > 0) {
        toast.success(
          `Imported ${summary.imported} transaction${summary.imported === 1 ? "" : "s"}, skipped ${summary.skippedDuplicates} duplicate${summary.skippedDuplicates === 1 ? "" : "s"}.`,
        )
      } else {
        toast.success(
          `Imported ${summary.imported} transaction${summary.imported === 1 ? "" : "s"}.`,
        )
      }

      queryClient.invalidateQueries({
        queryKey: getGetUserIdTransactionsInfiniteQueryKey(userId),
      })
      queryClient.invalidateQueries({
        queryKey: getGetUserIdSummaryAccountsQueryKey(userId),
      })
      queryClient.invalidateQueries({
        queryKey: getGetUserIdSummaryCategoriesQueryKey(userId),
      })
      queryClient.invalidateQueries({
        queryKey: getGetUserIdSummaryBalanceQueryKey(userId),
      })
      onClose()
    } catch (error) {
      toast.error(formatError(error, "Failed to import transactions."))
    } finally {
      setIsUploading(false)
    }
  }, [
    accountId,
    accounts,
    computeDedupeHash,
    decrypt,
    encrypt,
    file,
    isUploading,
    onClose,
    queryClient,
    userId,
  ])

  return (
    <Modal show={show} onClose={onClose}>
      <ModalHeader>Upload Transactions</ModalHeader>
      <ModalBody>
        <form className="flex flex-col gap-4">
          <SearchSelect
            options={
              accounts
                ?.filter((account) =>
                  account.name
                    .toLowerCase()
                    .includes(accountSearch?.toLowerCase() || ""),
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

          <FileInput
            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
          />
        </form>
      </ModalBody>
      <ModalFooter>
        <Button
          color="green"
          onClick={handleSubmit}
          disabled={!file || !accountId || isUploading}
        >
          {isUploading ? (
            <>
              <Spinner size="sm" className="mr-2" /> Uploading
            </>
          ) : (
            <>
              <FiCheck className="mr-2" /> Confirm
            </>
          )}
        </Button>
        <Button color="light" onClick={onClose} disabled={isUploading}>
          <FiX className="mr-2" /> Cancel
        </Button>
      </ModalFooter>
    </Modal>
  )
}
