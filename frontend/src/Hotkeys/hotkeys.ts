import type { Hotkey } from "@tanstack/react-hotkeys"

export type HotkeyScope = "global" | "transactions"

export type AppHotkey = {
  id: "openTransactionRow" | "submitTransactionRow" | "openShortcutsModal" | "focusTransactionSearch"
  combo: Hotkey
  description: string
  scope: HotkeyScope
}

export const HOTKEYS: AppHotkey[] = [
  {
    id: "openTransactionRow",
    combo: "N",
    description: "Open new transaction row",
    scope: "transactions",
  },
  {
    id: "focusTransactionSearch",
    combo: "/",
    description: "Focus transaction search",
    scope: "transactions",
  },
  {
    id: "submitTransactionRow",
    combo: "Mod+Enter",
    description: "Submit transaction row",
    scope: "transactions",
  },
  {
    id: "openShortcutsModal",
    combo: "Mod+/",
    description: "Open keyboard shortcuts",
    scope: "global",
  },
]

export const HOTKEYS_BY_ID: Record<AppHotkey["id"], AppHotkey> = {
  openTransactionRow: HOTKEYS[0],
  focusTransactionSearch: HOTKEYS[1],
  submitTransactionRow: HOTKEYS[2],
  openShortcutsModal: HOTKEYS[3],
}
