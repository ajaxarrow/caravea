import "server-only"

/**
 * Thin server-side client for the Laravel API. Only ever runs on the
 * Next.js server: the browser never talks to Laravel directly, so there is
 * no CORS surface and the API URL stays private.
 */

const API_URL = (process.env.API_URL ?? "http://127.0.0.1:8000/api").replace(/\/$/, "")

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export class NotFoundError extends ApiError {
  constructor() {
    super("Not found", 404)
    this.name = "NotFoundError"
  }
}

export class ValidationError extends ApiError {
  constructor(
    message: string,
    readonly errors: Record<string, string[]>,
  ) {
    super(message, 422)
    this.name = "ValidationError"
  }
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export async function api<T>(path: string, options: { method?: Method; body?: unknown } = {}): Promise<T> {
  const { method = "GET", body } = options

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined && { "Content-Type": "application/json" }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      // Caching is decided by the `use cache` functions that call this,
      // not by fetch, so mutations and reads are never accidentally cached.
      cache: "no-store",
    })
  } catch (cause) {
    throw new ApiError(`Could not reach the bookings service (${(cause as Error).message})`, 503)
  }

  if (response.status === 204) return undefined as T

  const json = await response.json().catch(() => null)

  if (response.status === 404) throw new NotFoundError()

  if (response.status === 422) {
    throw new ValidationError(json?.message ?? "The given data was invalid.", json?.errors ?? {})
  }

  if (!response.ok) {
    throw new ApiError(json?.message ?? `Bookings service responded with ${response.status}`, response.status)
  }

  return json as T
}
