import { parse, startOfDay } from "date-fns"
import { ImportSummary, parseCSV } from "./base"

type Trading212Row = {
  Action: string
  "Currency (Currency conversion fee)": string
  "Currency (French transaction tax)": string
  "Currency (Price / share)": string
  "Currency (Result)": string
  "Currency (Stamp duty reserve tax)": string
  "Currency (Total)": string
  "Currency (Withholding tax)": string
  "Currency conversion fee": string
  "Exchange rate": string
  "French transaction tax": string
  ID: string
  ISIN: string
  "Merchant category": string
  "Merchant name": string
  Name: string
  "No. of shares": string
  Notes: string
  "Price / share": string
  Result: string
  "Stamp duty reserve tax": string
  Ticker: string
  Time: string
  "Time (UTC)": string
  Total: string
  "Withholding tax": string
}

type BaseRow = {
  date: Date
  amount: number
  description: string
  account_id: string
}

function timeFormat(time: string): string {
  const hasTimezone = /[+-]\d{2}:\d{2}$/.test(time)
  const hasMillis = time.includes(".")

  if (hasMillis && hasTimezone) return "yyyy-MM-dd HH:mm:ss.SSSXXX"
  if (hasMillis) return "yyyy-MM-dd HH:mm:ss.SSS"
  if (hasTimezone) return "yyyy-MM-dd HH:mm:ssXXX"
  return "yyyy-MM-dd HH:mm:ss"
}

const CURRENCY_CONVERSION_NOTES =
  /^([\d,]+\.?\d*)\s*([A-Z]{3})\s*->\s*([\d,]+\.?\d*)\s*([A-Z]{3})$/

function currencyConversionAmountGBP(data: Trading212Row): number {
  const fee = parseFloat(data.Total)
  const match = data.Notes.match(CURRENCY_CONVERSION_NOTES)

  if (!match) {
    console.warn(
      `Trading212 import: could not parse Currency conversion Notes "${data.Notes}", treating Total as GBP as a fallback`,
    )
    return fee
  }

  const [, fromAmountStr, fromCcy, toAmountStr, toCcy] = match
  const fromAmount = parseFloat(fromAmountStr.replace(/,/g, ""))
  const toAmount = parseFloat(toAmountStr.replace(/,/g, ""))

  let principal: number
  let impliedRate: number
  if (fromCcy === "GBP") {
    principal = -fromAmount
    impliedRate = toAmount / fromAmount
  } else if (toCcy === "GBP") {
    principal = toAmount
    impliedRate = fromAmount / toAmount
  } else {
    console.warn(
      `Trading212 import: Currency conversion row doesn't involve GBP ("${data.Notes}"), treating Total as GBP as a fallback`,
    )
    return fee
  }

  const feeCurrency = data["Currency (Total)"]
  const feeGBP = !feeCurrency || feeCurrency === "GBP" ? fee : fee / impliedRate

  return principal + feeGBP
}

export async function parseTrading212(
  file: File,
  userId: string,
  portfolioAccountId: string,
  uninvestedAccountId: string,
  encrypt: (text: string) => Promise<string>,
  decrypt: (text: string) => Promise<string>,
  computeDedupeHash: (input: string) => Promise<string>,
): Promise<ImportSummary> {
  return parseCSV<Trading212Row>(
    file,
    userId,
    "do-not-use",
    encrypt,
    decrypt,
    computeDedupeHash,
    (data) => {
      const time = data.Time || data["Time (UTC)"]
      const parseDate = (dateString: string) =>
        parse(dateString, timeFormat(dateString), startOfDay(new Date()))

      const totalCurrency = data["Currency (Total)"]
      if (
        totalCurrency &&
        totalCurrency !== "GBP" &&
        data.Action !== "Currency conversion"
      )
        return []

      const externalId = data.ID || undefined

      const result = ((): BaseRow | BaseRow[] => {
        switch (data.Action) {
          case "Deposit":
            return {
              date: parseDate(time),
              amount: parseFloat(data.Total),
              description: "Deposit",
              account_id: uninvestedAccountId,
            }
          case "Withdrawal":
            return {
              date: parseDate(time),
              amount: parseFloat(data.Total),
              description: "Withdrawal",
              account_id: uninvestedAccountId,
            }
          case "Card debit":
            return {
              date: parseDate(time),
              amount: parseFloat(data.Total),
              description: data["Merchant name"] || "Card debit",
              account_id: uninvestedAccountId,
            }
          case "Card credit":
            return {
              date: parseDate(time),
              amount: parseFloat(data.Total),
              description: data["Merchant name"] || "Card credit",
              account_id: uninvestedAccountId,
            }
          case "Interest on cash":
            return {
              date: parseDate(time),
              amount: parseFloat(data.Total),
              description: `Interest on cash`,
              account_id: uninvestedAccountId,
            }
          case "Spending cashback":
            return {
              date: parseDate(time),
              amount: parseFloat(data.Total),
              description: "Spending cashback",
              account_id: uninvestedAccountId,
            }
          case "Currency conversion":
            return {
              date: parseDate(time),
              amount: currencyConversionAmountGBP(data),
              description: `Currency conversion ${data.Notes}`,
              account_id: uninvestedAccountId,
            }
          case "Dividend (Dividend)":
          case "Dividend (Property income distribution)":
          case "Dividend (Interest)":
          case "Dividend (Tax exempted)":
            return {
              date: parseDate(time),
              amount: parseFloat(data.Total),
              description: `Dividend ${data.Name}`,
              account_id: uninvestedAccountId,
            }
          case "Dividend adjustment":
            return {
              date: parseDate(time),
              amount: parseFloat(data.Total),
              description: data.Notes,
              account_id: uninvestedAccountId,
            }
          case "Result adjustment":
            return {
              date: parseDate(time),
              amount: parseFloat(data.Total),
              description: data.Notes || "Result adjustment",
              account_id: uninvestedAccountId,
            }
          case "Stock distribution":
            return parseFloat(data.Total) > 0
              ? {
                  date: parseDate(time),
                  amount: parseFloat(data.Total),
                  description: `Stock distribution ${data.Name}`,
                  account_id: uninvestedAccountId,
                }
              : []
          case "Spin off":
            return parseFloat(data.Total) > 0
              ? {
                  date: parseDate(time),
                  amount: parseFloat(data.Total),
                  description: `Spin off ${data.Name}`,
                  account_id: uninvestedAccountId,
                }
              : []
          case "Stock split open":
            return {
              date: parseDate(time),
              amount: -parseFloat(data.Total),
              description: `Stock split open ${data.Name}`,
              account_id: uninvestedAccountId,
            }
          case "Stock split close":
            return {
              date: parseDate(time),
              amount: parseFloat(data.Total),
              description: `Stock split close ${data.Name}`,
              account_id: uninvestedAccountId,
            }
          case "Market buy":
          case "Limit buy":
            return [
              {
                date: parseDate(time),
                amount: parseFloat(data.Total),
                description: `Market buy ${data.Name}`,
                account_id: portfolioAccountId,
              },
              {
                date: parseDate(time),
                amount: -parseFloat(data.Total),
                description: `Market buy ${data.Name}`,
                account_id: uninvestedAccountId,
              },
            ]
          case "Market sell":
          case "Limit sell":
            return [
              {
                date: parseDate(time),
                amount: -parseFloat(data.Total),
                description: `Market sell ${data.Name}`,
                account_id: portfolioAccountId,
              },
              {
                date: parseDate(time),
                amount: parseFloat(data.Total),
                description: `Market sell ${data.Name}`,
                account_id: uninvestedAccountId,
              },
            ]
          case "New card cost":
            return {
              date: parseDate(time),
              amount: parseFloat(data.Total),
              description: "New card cost",
              account_id: uninvestedAccountId,
            }
          case "ADR Fee":
            return {
              date: parseDate(time),
              amount: parseFloat(data.Total),
              description: "ADR Fee",
              account_id: uninvestedAccountId,
            }
          default:
            throw new Error(`Unsupported action: ${data.Action}`)
        }
      })()

      return (Array.isArray(result) ? result : [result]).map((item) => ({
        ...item,
        externalId,
      }))
    },
    { header: true, skipEmptyLines: true },
  )
}
