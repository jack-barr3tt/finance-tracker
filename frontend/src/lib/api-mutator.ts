import Cookies from "js-cookie"

export type ErrorType<Error> = Error

export type BodyType<BodyData> = BodyData

type CustomFetchConfig = {
  url: string
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  params?: Record<string, unknown>
  data?: BodyType<unknown>
  headers?: HeadersInit
  signal?: AbortSignal
}

const getBody = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get("content-type")
  if (contentType?.includes("application/json")) {
    return response.json() as Promise<T>
  }
  return response.text() as Promise<T>
}

const buildUrl = (url: string, params?: Record<string, unknown>) => {
  const baseUrl = import.meta.env.VITE_BACKEND_URL
  const requestUrl = new URL(url, baseUrl)

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        requestUrl.searchParams.set(key, String(value))
      }
    }
  }

  return requestUrl.toString()
}

export const customFetch = async <T>(
  { url, method, params, data, headers, signal }: CustomFetchConfig,
  // Orval passes request overrides; we don't use them yet.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options?: RequestInit,
): Promise<T> => {
  const requestHeaders = new Headers(headers)
  const accessToken = Cookies.get("access_token")
  if (accessToken && !requestHeaders.has("Authorization")) {
    requestHeaders.set("Authorization", `Bearer ${accessToken}`)
  }

  if (data !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json")
  }

  const response = await fetch(buildUrl(url, params), {
    method,
    headers: requestHeaders,
    body: data !== undefined ? JSON.stringify(data) : undefined,
    signal,
  })

  if (!response.ok) {
    let message = response.statusText
    try {
      const errorBody = await getBody<{
        message?: string
        error?: string
        detail?: string
      }>(response)
      message =
        errorBody.message ?? errorBody.error ?? errorBody.detail ?? message
    } catch {
      // use statusText
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return getBody<T>(response)
}

export default customFetch
