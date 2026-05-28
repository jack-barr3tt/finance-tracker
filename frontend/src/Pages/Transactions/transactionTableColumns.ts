import { format, parseISO } from "date-fns"
import { RefObject, useLayoutEffect, useMemo, useState } from "react"
import { measureNaturalWidth, prepareWithSegments } from "@chenglou/pretext"
import { layoutNextRichInlineLineRange, prepareRichInline } from "@chenglou/pretext/rich-inline"
import { Account, Category, Transaction } from "../../API/requests"

export const TRANSACTION_TABLE_COLUMN_COUNT = 6

export const transactionTableCellClass = {
  date: "whitespace-nowrap",
  account: "max-sm:p-0 whitespace-nowrap",
  category: "max-sm:p-0 whitespace-nowrap",
  description: "max-w-0 truncate",
  amount: "whitespace-nowrap",
  actions: "p-0 px-[18px] py-[10px]",
} as const

const MD_MEDIA_QUERY = "(min-width: 768px)"

const layout = {
  actions: 84,
  badgeExtra: 20,
  filter: 28,
  compactBadge: 48,
  cellPadding: 24,
} as const

const fallbackWidths: (number | undefined)[] = [
  116,
  layout.compactBadge,
  layout.compactBadge,
  undefined,
  108,
  layout.actions,
]

type TableFonts = { body: string; header: string; badge: string }

type ColumnWidthInput = {
  fonts: TableFonts
  accounts: Account[] | null
  categories: Category[] | null
  transactions: Transaction[]
  compactBadges: boolean
}

function textWidth(text: string, font: string): number {
  if (!text) return 0
  return measureNaturalWidth(prepareWithSegments(text, font))
}

function badgeWidth(text: string, font: string): number {
  if (!text) return 0
  const prepared = prepareRichInline([
    { text, font, break: "never", extraWidth: layout.badgeExtra },
  ])
  return layoutNextRichInlineLineRange(prepared, Number.MAX_SAFE_INTEGER)?.width ?? 0
}

function paddedWidth(contentWidth: number): number {
  return Math.ceil(contentWidth + layout.cellPadding)
}

function headerWithFilter(label: string, font: string): number {
  return textWidth(label.toUpperCase(), font) + layout.filter
}

function badgeColumnWidth(
  header: string,
  labels: string[],
  fonts: TableFonts,
  compactBadges: boolean,
): number {
  if (compactBadges) return layout.compactBadge
  return paddedWidth(
    Math.max(headerWithFilter(header, fonts.header), ...labels.map((label) => badgeWidth(label, fonts.badge))),
  )
}

function formatAmount(amount: number): string {
  return amount.toLocaleString("en-GB", { style: "currency", currency: "GBP" })
}

function readTableFonts(table: HTMLTableElement): TableFonts {
  const headerCell = table.querySelector("thead th")
  const bodyCell = table.querySelector("tbody td")
  const badgeLabel = table.querySelector("tbody span.hidden.md\\:block")
  const body = bodyCell ? getComputedStyle(bodyCell).font : getComputedStyle(table).font

  return {
    header: headerCell ? getComputedStyle(headerCell).font : body,
    body,
    badge: badgeLabel ? getComputedStyle(badgeLabel).font : body,
  }
}

export function computeTransactionTableColumnWidths(input: ColumnWidthInput): (number | undefined)[] {
  const { fonts, accounts, categories, transactions, compactBadges } = input

  const dateWidth = Math.max(
    textWidth("Date", fonts.header),
    ...transactions.map((transaction) =>
      textWidth(format(parseISO(transaction.date), "dd MMM yyyy"), fonts.body),
    ),
  )
  const amountWidth = Math.max(
    textWidth("Amount", fonts.header),
    ...transactions.map((transaction) => textWidth(formatAmount(transaction.amount), fonts.body)),
  )

  return [
    paddedWidth(dateWidth),
    badgeColumnWidth("Account", accounts?.map((account) => account.name) ?? [], fonts, compactBadges),
    badgeColumnWidth(
      "Category",
      ["Uncategorised", ...(categories?.map((category) => category.name) ?? [])],
      fonts,
      compactBadges,
    ),
    undefined,
    paddedWidth(amountWidth),
    layout.actions,
  ]
}

type UseTransactionTableColumnWidthsInput = {
  tableRef: RefObject<HTMLTableElement | null>
  accounts: Account[] | null
  categories: Category[] | null
  transactions: Transaction[]
}

export function useTransactionTableColumnWidths(input: UseTransactionTableColumnWidthsInput) {
  const { tableRef, accounts, categories, transactions } = input
  const [measurement, setMeasurement] = useState<{
    fonts: TableFonts
    compactBadges: boolean
  } | null>(null)

  useLayoutEffect(() => {
    const table = tableRef.current
    if (!table) return

    const mediaQuery = window.matchMedia(MD_MEDIA_QUERY)
    const update = () =>
      setMeasurement({
        fonts: readTableFonts(table),
        compactBadges: !mediaQuery.matches,
      })

    update()
    mediaQuery.addEventListener("change", update)
    const observer = new ResizeObserver(update)
    observer.observe(table)

    return () => {
      mediaQuery.removeEventListener("change", update)
      observer.disconnect()
    }
  }, [tableRef, transactions.length])

  return useMemo(() => {
    const widths = measurement
      ? computeTransactionTableColumnWidths({ ...measurement, accounts, categories, transactions })
      : fallbackWidths

    return { columnWidths: widths.slice(0, TRANSACTION_TABLE_COLUMN_COUNT) }
  }, [measurement, accounts, categories, transactions])
}
