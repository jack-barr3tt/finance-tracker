import { parse, startOfDay } from "date-fns"
import { ImportSummary, parseCSV } from "./base"
import { prependToFile } from "../utils"

type BarclaycardRow = {
  Date: string
  Description: string
  Type: string
  Name: string
  Category: string
  In: string
  Out: string
}

export async function parseBarclaycard(
  file: File,
  userId: string,
  accountId: string,
  encrypt: (text: string) => Promise<string>,
  decrypt: (text: string) => Promise<string>,
  computeDedupeHash: (input: string) => Promise<string>,
): Promise<ImportSummary> {
  const getAmount = (str: string): number => {
    const match = str.match(/-?[\d.,]+/)
    return match ? parseFloat(match[0].replace(/,/g, "")) : 0
  }

  const newFile = await prependToFile(
    file,
    "Date,Description,Type,Name,Category,In,Out",
  )

  return parseCSV<BarclaycardRow>(
    newFile,
    userId,
    accountId,
    encrypt,
    decrypt,
    computeDedupeHash,
    (data) => ({
      date: parse(data.Date, "dd MMM yy", startOfDay(new Date())),
      amount: -(getAmount(data.In) + getAmount(data.Out)),
      description: data.Description,
    }),
    { header: true, skipEmptyLines: true },
  )
}
