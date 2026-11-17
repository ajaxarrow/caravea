import { test as base, expect, type APIRequestContext } from "@playwright/test"

import { API_URL, FAULT_PROXY_URL } from "./env"

export type Fault = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  /** Regex matched against the API path, e.g. "^/api/bookings\\?" */
  path: string
  delayMs?: number
  /** HTTP status to return instead of forwarding; 0 drops the connection. */
  status?: number
}

type Fixtures = {
  /** Make the Laravel API (as seen by the Next server) slow or broken. */
  faults: {
    inject: (...faults: Fault[]) => Promise<void>
    clear: () => Promise<void>
    /** Whether this test has injected any server-side failure. */
    readonly injectedFailure: boolean
  }
  /** Reads straight from Laravel, bypassing Next and its cache. */
  api: { firstBookingIds: (count: number) => Promise<string[]> }
}

export const test = base.extend<Fixtures & { failOnPageErrors: void }>({
  faults: async ({ request }, use) => {
    const send = (faults: Fault[]) => request.put(`${FAULT_PROXY_URL}/__faults`, { data: faults })
    let injectedFailure = false
    await send([])
    await use({
      inject: async (...faults) => {
        injectedFailure ||= faults.some((fault) => fault.status !== undefined)
        await send(faults)
      },
      clear: async () => void (await send([])),
      get injectedFailure() {
        return injectedFailure
      },
    })
    await send([])
  },

  api: async ({ request }, use) => {
    await use({ firstBookingIds: (count) => bookingIds(request, count) })
  },

  // Any uncaught error in the browser fails the test, even if the page
  // looks right. One exception: when a test deliberately breaks the API
  // during a streamed render, React reports #419 ("the server could not
  // finish this Suspense boundary") before showing the error boundary.
  // That's the expected path there; anywhere else it means a real crash.
  failOnPageErrors: [
    async ({ page, faults }, use) => {
      const errors: string[] = []
      page.on("pageerror", (error) => errors.push(error.message))
      await use()
      const unexpected = errors.filter((message) => !(faults.injectedFailure && message.includes("React error #419")))
      expect(unexpected, "uncaught errors in the browser").toEqual([])
    },
    { auto: true },
  ],
})

async function bookingIds(request: APIRequestContext, count: number): Promise<string[]> {
  const response = await request.get(`${API_URL}/bookings?status=confirmed&per_page=${count}`)
  const body = (await response.json()) as { data: { id: string }[] }
  return body.data.map((booking) => booking.id)
}

export { expect }
