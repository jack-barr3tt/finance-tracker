import { formatError } from "../utils/formatError"

export function getImportFailureMessage(
  results: PromiseSettledResult<unknown>[],
  fallback = "Failed to import transactions.",
): string {
  for (const result of results) {
    if (result.status === "rejected") {
      return formatError(result.reason, fallback)
    }
  }

  return fallback
}
