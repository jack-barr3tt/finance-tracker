import { Tooltip } from "flowbite-react"

type TruncatedTextProps = {
  text: string
  maxLength?: number
  emptyLabel?: string
}

export default function TruncatedText({
  text,
  maxLength = 30,
  emptyLabel = "No description",
}: TruncatedTextProps) {
  if (!text) {
    return <span className="italic text-gray-400">{emptyLabel}</span>
  }

  if (text.length <= maxLength) return <span>{text}</span>

  return (
    <Tooltip content={text} placement="top">
      <span>{text.slice(0, maxLength)}...</span>
    </Tooltip>
  )
}
