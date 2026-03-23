import type { Hotkey } from "@tanstack/react-hotkeys"

export type HotkeyScope = "global" | "transactions"

export type AppHotkey = {
  id: "openTransactionRow" | "submitTransactionRow" | "openShortcutsModal"
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
  submitTransactionRow: HOTKEYS[1],
  openShortcutsModal: HOTKEYS[2],
}
