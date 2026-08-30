import { parse, startOfDay } from "date-fns"
import { ImportSummary, parseCSV } from "./base"

type TescoBankRow = {
  "Transaction Date": string
  "Billing Amount": string
  Merchant: string
  "Reference Number": string
  "Debit/Credit Flag": string
}

function parseAmount(str: string | undefined): number {
  const match = str?.match(/-?[\d.,]+/)
  return match ? parseFloat(match[0].replace(/,/g, "")) : 0
}

export async function parseTescoBank(
  file: File,
  userId: string,
  accountId: string,
  encrypt: (text: string) => Promise<string>,
  decrypt: (text: string) => Promise<string>,
  computeDedupeHash: (input: string) => Promise<string>,
): Promise<ImportSummary> {
  return parseCSV<TescoBankRow>(
    file,
    userId,
    accountId,
    encrypt,
    decrypt,
    computeDedupeHash,
    (data) => {
      const date = parse(
        data["Transaction Date"],
        "dd/MM/yyyy",
        startOfDay(new Date()),
      )
      if (Number.isNaN(date.getTime())) return []

      const magnitude = Math.abs(parseAmount(data["Billing Amount"]))
      if (magnitude === 0) return []

      const isCredit =
        data["Debit/Credit Flag"]?.trim().toLowerCase() === "credit"

      return {
        date,
        amount: isCredit ? magnitude : -magnitude,
        description: data.Merchant?.trim() ?? "",
        externalId: data["Reference Number"]?.trim() || undefined,
      }
    },
    { header: true, skipEmptyLines: true },
  )
}
