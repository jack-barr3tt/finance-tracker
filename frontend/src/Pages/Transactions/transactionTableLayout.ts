export const TRANSACTION_TABLE_COLUMN_COUNT = 6

export const TRANSACTION_TABLE_COLUMN_WIDTHS = [
  "7.25rem",
  "8.5rem",
  "9rem",
  undefined,
  "6.75rem",
  "5.25rem",
] as const

export const transactionTableCellClass = {
  date: "whitespace-nowrap",
  account: "max-sm:p-0",
  category: "max-sm:p-0",
  description: "max-w-0 truncate",
  amount: "whitespace-nowrap",
  actions: "p-0 px-[18px] py-[10px]",
} as const
