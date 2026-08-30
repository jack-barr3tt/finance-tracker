import { parse, startOfDay } from "date-fns"
import { ImportSummary, parseCSV } from "./base"

type BarclaycardRow = {
  Date: string
  Description?: string
  Amount?: string
  Memo?: string
  In?: string
  Out?: string
}

const OLD_HEADER = "Date,Description,Type,Name,Category,In,Out"

function parseAmount(str: string | undefined): number {
  const match = str?.match(/-?[\d.,]+/)
  return match ? parseFloat(match[0].replace(/,/g, "")) : 0
}

function isNewFormat(headerLine: string): boolean {
  return headerLine.includes("Account/Card No")
}

export async function parseBarclaycard(
  file: File,
  userId: string,
  accountId: string,
  encrypt: (text: string) => Promise<string>,
  decrypt: (text: string) => Promise<string>,
  computeDedupeHash: (input: string) => Promise<string>,
): Promise<ImportSummary> {
  const text = await file.text()
  const firstLine = text.replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0] ?? ""
  const newFormat = isNewFormat(firstLine)
  const csvFile = new File(
    [newFormat ? text : `${OLD_HEADER}\n${text}`],
    file.name,
    { type: file.type },
  )

  return parseCSV<BarclaycardRow>(
    csvFile,
    userId,
    accountId,
    encrypt,
    decrypt,
    computeDedupeHash,
    (data) => {
      const date = parse(
        data.Date,
        newFormat ? "dd/MM/yyyy" : "dd MMM yy",
        startOfDay(new Date()),
      )
      if (Number.isNaN(date.getTime())) return []

      return {
        date,
        amount: newFormat
          ? -parseAmount(data.Amount)
          : -(parseAmount(data.In) + parseAmount(data.Out)),
        description: (newFormat ? data.Memo : data.Description)?.trim() ?? "",
      }
    },
    { header: true, skipEmptyLines: true },
  )
}
