import { parse, startOfDay } from "date-fns"
import { parseCSV } from "./base"

type NationwideRow = {
  Date: string
  "Paid in": string
  "Paid out": string
  Description: string
}

export async function parseNationwide(
  file: File,
  userId: string,
  accountId: string,
  encrypt: (text: string) => Promise<string>
): Promise<boolean> {
  const getAmount = (str: string): number => {
    const match = str.match(/[\d.,]+/)
    return match ? parseFloat(match[0].replace(/,/g, "")) : 0
  }

  return parseCSV<NationwideRow>(
    file,
    userId,
    accountId,
    encrypt,
    (data) => ({
      date: parse(data.Date, "dd MMM yyyy", startOfDay(new Date())),
      amount: getAmount(data["Paid in"]) - getAmount(data["Paid out"]),
      description: data.Description,
    }),
    { header: true, skipEmptyLines: true, skipFirstNLines: 3 }
  )
}
