import { expect, test } from "./support/test"

/*
 * Loading and error states, for every page and every mutation.
 *
 * The Laravel API is reached through a fault-injection proxy, so each test
 * makes specific calls slow or broken. The workshop's bays are cached by
 * Next for hours, so the bays-failing test only works while that cache is
 * cold — which is why this file runs before the flows suite.
 */

const SLOW = 1_500
const LIST = "^/api/bookings\\?"
const WORKSHOP = "^/api/workshop"
const booking = (id: string) => `^/api/bookings/${id}$`

test.describe("new booking page", () => {
  test("shows an error with a working retry when the bays can't be loaded", async ({ page, faults }) => {
    await faults.inject({ path: WORKSHOP, status: 500 })
    await page.goto("/bookings/new")

    await expect(page.getByRole("heading", { name: "Something went wrong loading this page" })).toBeVisible()

    // Retry while the API is slow: the form's skeleton shows, then the form.
    await faults.inject({ path: WORKSHOP, delayMs: SLOW })
    await page.getByRole("button", { name: "Try again" }).click()
    await expect(page.getByRole("status", { name: "Loading form" })).toBeVisible()
    await expect(page.getByLabel("Service bay")).toBeVisible({ timeout: 10_000 })
  })
})

test.describe("bookings list", () => {
  test("streams a skeleton while bookings load, with the page shell already visible", async ({ page, faults }) => {
    await faults.inject({ path: LIST, delayMs: SLOW })
    // "commit": don't wait for the streamed response to finish, or the
    // skeleton has already been replaced.
    await page.goto("/bookings?page=3", { waitUntil: "commit" })

    await expect(page.getByRole("heading", { name: "Every bay, on schedule" })).toBeVisible()
    await expect(page.getByRole("status", { name: "Loading bookings" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Workshop bookings" })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole("status", { name: "Loading bookings" })).toBeHidden()
  })

  test("shows loading feedback when changing the filter", async ({ page, faults }) => {
    await page.goto("/bookings?page=2")
    await expect(page.getByRole("heading", { name: "Workshop bookings" })).toBeVisible()

    await faults.inject({ path: LIST, delayMs: SLOW })
    await page
      .getByRole("navigation", { name: "Filter by status" })
      .getByRole("link", { name: /Cancelled$/ })
      .click()

    await expect(page.getByRole("status", { name: "Loading bookings" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Cancelled bookings" })).toBeVisible({ timeout: 10_000 })
  })

  test("shows loading feedback when changing page", async ({ page, faults }) => {
    await page.goto("/bookings?status=confirmed")
    await expect(page.getByRole("heading", { name: "Confirmed bookings" })).toBeVisible()

    await faults.inject({ path: LIST, delayMs: SLOW })
    await page.getByRole("link", { name: "Next page" }).click()

    await expect(page.getByRole("status", { name: "Loading bookings" })).toBeVisible()
    await expect(page).toHaveURL(/status=confirmed&page=2/, { timeout: 10_000 })
  })

  test("shows an error with a working retry when the API fails", async ({ page, faults }) => {
    await faults.inject({ path: LIST, status: 500 })
    await page.goto("/bookings?page=4")

    await expect(page.getByRole("heading", { name: "Something went wrong loading this page" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Back to bookings" })).toBeVisible()

    await faults.clear()
    await page.getByRole("button", { name: "Try again" }).click()
    await expect(page.getByRole("heading", { name: "Workshop bookings" })).toBeVisible()
  })

  test("shows an error when the API is unreachable", async ({ page, faults }) => {
    await faults.inject({ path: LIST, status: 0 })
    await page.goto("/bookings?page=5")

    await expect(page.getByRole("heading", { name: "Something went wrong loading this page" })).toBeVisible()
  })
})

test.describe("booking detail and edit pages", () => {
  test("detail: skeleton while loading, then the booking", async ({ page, faults, api }) => {
    const [id] = await api.firstBookingIds(1)
    await faults.inject({ path: booking(id), delayMs: SLOW })
    await page.goto(`/bookings/${id}`, { waitUntil: "commit" })

    await expect(page.getByRole("link", { name: "Back to bookings" })).toBeVisible()
    await expect(page.getByRole("status", { name: "Loading booking" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Edit booking" })).toBeVisible({ timeout: 10_000 })
  })

  test("detail: error with retry when the API fails", async ({ page, faults, api }) => {
    const [, id] = await api.firstBookingIds(2)
    await faults.inject({ path: booking(id), status: 500 })
    await page.goto(`/bookings/${id}`)

    await expect(page.getByRole("heading", { name: "Something went wrong loading this page" })).toBeVisible()

    await faults.clear()
    await page.getByRole("button", { name: "Try again" }).click()
    await expect(page.getByRole("link", { name: "Edit booking" })).toBeVisible()
  })

  test("edit: skeleton while loading, then the form", async ({ page, faults, api }) => {
    const [, , id] = await api.firstBookingIds(3)
    await faults.inject({ path: booking(id), delayMs: SLOW })
    await page.goto(`/bookings/${id}/edit`, { waitUntil: "commit" })

    await expect(page.getByRole("status", { name: "Loading form" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Save changes" })).toBeVisible({ timeout: 10_000 })
  })

  test("edit: error when the API fails", async ({ page, faults, api }) => {
    const [, , , id] = await api.firstBookingIds(4)
    await faults.inject({ path: booking(id), status: 503 })
    await page.goto(`/bookings/${id}/edit`)

    await expect(page.getByRole("heading", { name: "Something went wrong loading this page" })).toBeVisible()
  })
})

test.describe("saving a booking", () => {
  async function fillValidBooking(page: import("@playwright/test").Page, day: string) {
    await page.getByLabel("Full name").fill("State Tester")
    await page.getByLabel("Email").fill("state@example.com")
    await page.getByLabel("Registration").fill("STATE1")
    await page.getByLabel("Service bay").selectOption({ label: "Bay 2" })
    await page.getByLabel("Drop-off").fill(`${day}T09:00`)
    await page.getByLabel("Ready for pick-up").fill(`${day}T10:00`)
  }

  test("shows a saving state while the booking is created", async ({ page, faults }) => {
    await page.goto("/bookings/new")
    await fillValidBooking(page, "2027-02-01")
    await faults.inject({ method: "POST", path: "^/api/bookings$", delayMs: SLOW })

    await page.getByRole("button", { name: "Create booking" }).click()

    const saving = page.getByRole("button", { name: "Saving…" })
    await expect(saving).toBeVisible()
    await expect(saving).toBeDisabled()
    await expect(page.getByText("Booking created.")).toBeVisible({ timeout: 10_000 })
  })

  for (const [label, status] of [
    ["fails", 500],
    ["is unreachable", 0],
  ] as const) {
    test(`explains the problem and keeps the input when the API ${label}`, async ({ page, faults }) => {
      await page.goto("/bookings/new")
      await fillValidBooking(page, "2027-02-02")
      await faults.inject({ method: "POST", path: "^/api/bookings$", status })

      await page.getByRole("button", { name: "Create booking" }).click()

      await expect(page.locator("#form-summary")).toHaveText(
        "Something went wrong talking to the bookings service. Please try again.",
      )
      await expect(page.locator("#form-summary")).toBeFocused()
      await expect(page.getByLabel("Full name")).toHaveValue("State Tester")
      await expect(page.getByLabel("Drop-off")).toHaveValue("2027-02-02T09:00")
    })
  }

  test("explains the problem when saving an edit fails", async ({ page, faults, api }) => {
    const [, , , , id] = await api.firstBookingIds(5)
    await page.goto(`/bookings/${id}/edit`)
    await page.getByLabel("Full name").fill("Edited Name")
    await faults.inject({ method: "PUT", path: booking(id), status: 500 })

    await page.getByRole("button", { name: "Save changes" }).click()

    await expect(page.locator("#form-summary")).toContainText("Something went wrong")
    await expect(page.getByLabel("Full name")).toHaveValue("Edited Name")
  })
})

test.describe("quick actions", () => {
  test("status change: shows saving, then an error if it fails", async ({ page, faults, api }) => {
    const [, , , , , id] = await api.firstBookingIds(6)
    await page.goto(`/bookings/${id}`)
    const summary = page.getByLabel("Booking summary")
    await faults.inject({ method: "PATCH", path: booking(id), delayMs: SLOW, status: 500 })

    await summary.getByRole("button", { name: /^Cancel booking/ }).click()

    await expect(summary.getByRole("button", { name: "Saving…" })).toBeDisabled()
    await expect(summary.getByRole("alert")).toHaveText(
      "Something went wrong talking to the bookings service. Please try again.",
      { timeout: 10_000 },
    )
    // Nothing changed, and the buttons are usable again.
    await expect(summary.getByRole("button", { name: /^Cancel booking/ })).toBeEnabled()
  })

  test("delete: shows deleting, then an error if it fails", async ({ page, faults, api }) => {
    const [, , , , , , id] = await api.firstBookingIds(7)
    await page.goto(`/bookings/${id}`)
    await faults.inject({ method: "DELETE", path: booking(id), delayMs: SLOW, status: 500 })

    await page.getByRole("button", { name: "Delete booking" }).click()
    await page.getByRole("group", { name: "Confirm delete" }).getByRole("button", { name: "Delete booking" }).click()

    await expect(page.getByRole("button", { name: "Deleting…" })).toBeDisabled()
    await expect(page.getByRole("group", { name: "Confirm delete" }).getByRole("alert")).toHaveText(
      "Something went wrong talking to the bookings service. Please try again.",
      { timeout: 10_000 },
    )
  })
})
