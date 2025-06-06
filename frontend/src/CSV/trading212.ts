import { parse, startOfDay } from "date-fns"
import { parseCSV } from "./base"

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
  Total: string
  "Withholding tax": string
}

export async function parseTrading212(
  file: File,
  userId: string,
  portfolioAccountId: string,
  uninvestedAccountId: string
): Promise<boolean> {
  return parseCSV<Trading212Row>(
    file,
    userId,
    "do-not-use",
    (data) => {
      const parseDate = (dateString: string) =>
        parse(
          dateString,
          data.Time.includes(".") ? "yyyy-MM-dd HH:mm:ss.SSS" : "yyyy-MM-dd HH:mm:ss",
          startOfDay(new Date())
        )

      switch (data.Action) {
        case "Deposit":
          return {
            date: parseDate(data.Time),
            amount: parseFloat(data.Total),
            description: "Deposit",
            account_id: uninvestedAccountId,
          }
        case "Withdrawal":
          return {
            date: parseDate(data.Time),
            amount: parseFloat(data.Total),
            description: "Withdrawal",
            account_id: uninvestedAccountId,
          }
        case "Card debit":
          return {
            date: parseDate(data.Time),
            amount: parseFloat(data.Total),
            description: data["Merchant name"] || "Card debit",
            account_id: uninvestedAccountId,
          }
        case "Card credit":
          return {
            date: parseDate(data.Time),
            amount: parseFloat(data.Total),
            description: data["Merchant name"] || "Card credit",
            account_id: uninvestedAccountId,
          }
        case "Interest on cash":
          if (data["Currency (Total)"] !== "GBP") return []
          return {
            date: parseDate(data.Time),
            amount: parseFloat(data.Total),
            description: `Interest on cash`,
            account_id: uninvestedAccountId,
          }
        case "Spending cashback":
          return {
            date: parseDate(data.Time),
            amount: parseFloat(data.Total),
            description: "Spending cashback",
            account_id: uninvestedAccountId,
          }
        case "Currency conversion":
          return {
            date: parseDate(data.Time),
            amount: parseFloat(data.Total),
            description: `Currency conversion ${data.Notes}`,
            account_id: uninvestedAccountId,
          }
        case "Dividend (Dividend)":
        case "Dividend (Property income distribution)":
        case "Dividend (Interest)":
        case "Dividend (Tax exempted)":
          return {
            date: parseDate(data.Time),
            amount: parseFloat(data.Total),
            description: `Dividend ${data.Name}`,
            account_id: uninvestedAccountId,
          }
        case "Dividend adjustment":
          return {
            date: parseDate(data.Time),
            amount: parseFloat(data.Total),
            description: data.Notes,
            account_id: uninvestedAccountId,
          }
        case "Result adjustment":
          return {
            date: parseDate(data.Time),
            amount: parseFloat(data.Total),
            description: data.Notes || "Result adjustment",
            account_id: uninvestedAccountId,
          }
        case "Stock distribution":
          return parseFloat(data.Total) > 0
            ? {
                date: parseDate(data.Time),
                amount: parseFloat(data.Total),
                description: `Stock distribution ${data.Name}`,
                account_id: uninvestedAccountId,
              }
            : []
        case "Stock split open":
          return {
            date: parseDate(data.Time),
            amount: -parseFloat(data.Total),
            description: `Stock split open ${data.Name}`,
            account_id: uninvestedAccountId,
          }
        case "Stock split close":
          return {
            date: parseDate(data.Time),
            amount: parseFloat(data.Total),
            description: `Stock split close ${data.Name}`,
            account_id: uninvestedAccountId,
          }
        case "Market buy":
        case "Limit buy":
          return [
            {
              date: parseDate(data.Time),
              amount: parseFloat(data.Total),
              description: `Market buy ${data.Name}`,
              account_id: portfolioAccountId,
            },
            {
              date: parseDate(data.Time),
              amount: -parseFloat(data.Total),
              description: `Market buy ${data.Name}`,
              account_id: uninvestedAccountId,
            },
          ]
        case "Market sell":
        case "Limit sell":
          return [
            {
              date: parseDate(data.Time),
              amount: -parseFloat(data.Total),
              description: `Market sell ${data.Name}`,
              account_id: portfolioAccountId,
            },
            {
              date: parseDate(data.Time),
              amount: parseFloat(data.Total),
              description: `Market sell ${data.Name}`,
              account_id: uninvestedAccountId,
            },
          ]
        case "New card cost":
          return {
            date: parseDate(data.Time),
            amount: parseFloat(data.Total),
            description: "New card cost",
            account_id: uninvestedAccountId,
          }
        default:
          throw new Error(`Unsupported action: ${data.Action}`)
      }
    },
    { header: true, skipEmptyLines: true }
  )
}
