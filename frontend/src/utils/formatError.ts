import { ApiError } from "../API/requests/core/ApiError"

export function formatError(
  error: unknown,
  fallback = "Something went wrong.",
): string {
  if (error instanceof ApiError) {
    const body = error.body as { message?: string } | undefined
    if (body?.message) return body.message
    return error.message
  }

  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return fallback
}
