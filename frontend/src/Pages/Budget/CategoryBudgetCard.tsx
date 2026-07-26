import { CategoryBudget } from "../../API"
import { formatSegmentDateRange } from "../../budget/plannedAmount"
import { formatCurrencyGBP, formatRepeat } from "../../utils"
import ColoredBadge from "../../Components/ColoredBadge"
import DataCard from "../../Components/DataCard"

type ColorPair = { fill?: string; text?: string }

type CategoryBudgetCardProps = {
  categoryBudget: CategoryBudget
  categoryColorMap: Record<string, ColorPair>
  onEdit: (id: string) => void
}

export default function CategoryBudgetCard({
  categoryBudget,
  categoryColorMap,
  onEdit,
}: CategoryBudgetCardProps) {
  return (
    <DataCard onClick={() => onEdit(categoryBudget.id)}>
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <ColoredBadge
            label={categoryBudget.category.name}
            colorMap={categoryColorMap}
            colorKey={categoryBudget.category.id}
          />
          <span className="shrink-0 font-medium text-gray-900 dark:text-white">
            {formatCurrencyGBP(categoryBudget.amount)}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
          <span>
            {formatRepeat(
              categoryBudget.repeat_every,
              categoryBudget.repeat_until,
            )}
          </span>
          <span>
            {formatSegmentDateRange(
              categoryBudget.starts_on,
              categoryBudget.ends_on,
            )}
          </span>
        </div>
      </div>
    </DataCard>
  )
}
