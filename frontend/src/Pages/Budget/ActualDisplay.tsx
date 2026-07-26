import { formatCurrencyGBP } from "../../utils"

export function VarianceCell({
  planned,
  actual,
}: {
  planned: number
  actual: number
}) {
  const delta = actual - planned
  if (planned === 0 && actual === 0) {
    return <span className="text-gray-400">—</span>
  }

  const colorClass =
    delta > 0
      ? "text-red-600 dark:text-red-400"
      : delta < 0
        ? "text-green-600 dark:text-green-400"
        : "text-gray-500 dark:text-gray-400"

  return (
    <span className={colorClass}>
      {delta > 0 ? "+" : ""}
      {formatCurrencyGBP(delta)}
    </span>
  )
}
