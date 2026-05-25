import { Modal, ModalBody, ModalHeader } from "flowbite-react"
import { formatForDisplay } from "@tanstack/react-hotkeys"
import { HOTKEYS } from "../Hotkeys/hotkeys"

type KeyboardShortcutsModalProps = {
  show: boolean
  onClose: () => void
}

export default function KeyboardShortcutsModal(props: KeyboardShortcutsModalProps) {
  const { show, onClose } = props

  return (
    <Modal show={show} onClose={onClose}>
      <ModalHeader className="text-gray-900 dark:text-white">Keyboard Shortcuts</ModalHeader>
      <ModalBody className="text-gray-900 dark:text-white">
        <div className="flex flex-col gap-2">
          {HOTKEYS.map((shortcut) => (
            <div
              key={shortcut.id}
              className="flex items-center justify-between gap-4 px-1 py-2 border-b border-gray-200 last:border-0 dark:border-gray-700"
            >
              <span>{shortcut.description}</span>
              <kbd className="px-2 py-1 text-sm font-medium border rounded-md bg-gray-50 border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100">
                {formatForDisplay(shortcut.combo)}
              </kbd>
            </div>
          ))}
        </div>
      </ModalBody>
    </Modal>
  )
}
