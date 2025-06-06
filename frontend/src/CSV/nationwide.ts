import { parse, startOfDay } from "date-fns"
import { parseCSV } from "./base"
import { getUserByIdCategories } from "../API/requests"

type NationwideRow = {
  Date: string
  "Paid in": string
  "Paid out": string
  Description: string
}

export async function parseNationwide(
  file: File,
  userId: string,
  accountId: string
): Promise<string> {
  const { data: categories } = await getUserByIdCategories({ path: { id: userId } })

  const getCategoryId = (description: string): string | undefined => {
    for (const category of categories || []) {
      for (const rule of category.rules) {
        if (rule.account.id != accountId) continue

        const regex = new RegExp(rule.rule, "g")

        if (regex.test(description)) {
          return category.id
        }
      }
    }

    return undefined
  }

  const getAmount = (str: string): number => {
    const match = str.match(/[\d.,]+/)
    return match ? parseFloat(match[0].replace(/,/g, "")) : 0
  }

  return parseCSV<NationwideRow>(
    file,
    userId,
    (data) => ({
      date: parse(data.Date, "dd MMM yyyy", startOfDay(new Date())).toISOString(),
      amount: getAmount(data["Paid in"]) - getAmount(data["Paid out"]),
      description: data.Description,
      account_id: accountId,
      category_id: getCategoryId(data.Description),
    }),
    { header: true, skipEmptyLines: true, skipFirstNLines: 3 }
  )
}
