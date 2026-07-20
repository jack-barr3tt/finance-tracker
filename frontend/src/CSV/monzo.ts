import { parse, startOfDay } from "date-fns"
import { parseCSV } from "./base"

type MonzoRow = {
  Date: string
  Type: string
  Name: string
  Amount: string
  "Notes and #tags": string
  Description: string
}

export async function parseMonzo(
  file: File,
  userId: string,
  accountId: string,
  encrypt: (text: string) => Promise<string>,
  decrypt: (text: string) => Promise<string>,
): Promise<boolean> {
  const getAmount = (str: string): number => {
    const match = str.match(/-?[\d.,]+/)
    return match ? parseFloat(match[0].replace(/,/g, "")) : 0
  }

  const getDescription = (data: MonzoRow): string => {
    for (const value of [
      data.Name,
      data["Notes and #tags"],
      data.Description,
      data.Type,
    ]) {
      const trimmed = value?.trim()
      if (trimmed) return trimmed
    }
    return ""
  }

  return parseCSV<MonzoRow>(
    file,
    userId,
    accountId,
    encrypt,
    decrypt,
    (data) => {
      const amount = getAmount(data.Amount)
      if (amount === 0) return []

      return {
        date: parse(data.Date, "dd/MM/yyyy", startOfDay(new Date())),
        amount,
        description: getDescription(data),
      }
    },
    { header: true, skipEmptyLines: true },
  )
}
