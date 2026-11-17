import { expect, test, type Page } from "@playwright/test"

/*
 * Bookings are created through the UI (not straight against the API), so
 * every write goes through the Server Actions and their cache invalidation,
 * exactly as a user's would. Dates are far in the future so they sort to the
 * top of the list and never collide with seeded data.
 */

type NewBooking = {
  name: string
  email?: string
  rego: string
  bay: string
  start: string
  end: string
  status?: "Pending" | "Confirmed"
}

async function fillBooking(page: Page, booking: NewBooking) {
  await page.getByLabel("Full name").fill(booking.name)
  await page.getByLabel("Email").fill(booking.email ?? "e2e@example.com")
  await page.getByLabel("Registration").fill(booking.rego)
  await page.getByLabel("Service bay").selectOption({ label: booking.bay })
  await page.getByLabel("Drop-off").fill(booking.start)
  await page.getByLabel("Ready for pick-up").fill(booking.end)
  if (booking.status) await page.getByRole("radio", { name: booking.status }).check({ force: true })
}

async function createBooking(page: Page, booking: NewBooking) {
  await page.goto("/bookings/new")
  await fillBooking(page, booking)
  await page.getByRole("button", { name: "Create booking" }).click()
  await expect(page.getByText("Booking created.")).toBeVisible()
}

/** Marks the current document; if a full reload happens, the mark is lost. */
async function markDocument(page: Page) {
  await page.evaluate(() => ((window as unknown as { __mark: boolean }).__mark = true))
}

async function expectNoFullReload(page: Page) {
  expect(await page.evaluate(() => (window as unknown as { __mark?: boolean }).__mark)).toBe(true)
}

test("creates a booking and shows it in the list without a full page reload", async ({ page }) => {
  await page.goto("/bookings/new")
  await markDocument(page)

  await fillBooking(page, {
    name: "Ada Lovelace",
    rego: "ada 101",
    bay: "Bay 1",
    start: "2031-03-10T09:00",
    end: "2031-03-10T11:30",
  })
  await page.getByRole("button", { name: "Create booking" }).click()

  await expect(page).toHaveURL(/\/bookings\/[0-9a-f-]{36}\?saved=created$/)
  await expect(page.getByText("Booking created.")).toBeVisible()
  await expect(page.getByRole("heading", { name: "Ada Lovelace" })).toBeVisible()
  await expect(page.getByText("ADA101")).toBeVisible()
  // Entered as Melbourne time, shown back as Melbourne time.
  await expect(page.getByText("Monday 10 March 2031")).toBeVisible()
  await expect(page.getByLabel("Booking summary").getByText("9:00am")).toBeVisible()

  await page.getByRole("link", { name: "Back to bookings" }).click()
  await expect(page).toHaveURL(/\/bookings$/)
  await expect(page.getByRole("listitem").first()).toContainText("Ada Lovelace")
  await expectNoFullReload(page)
})

test("shows Laravel's validation errors next to the right fields and keeps what was typed", async ({ page }) => {
  await page.goto("/bookings/new")
  await page.getByLabel("Full name").fill("Kept Value")
  await page.getByLabel("Registration").fill("!")
  await page.getByRole("button", { name: "Create booking" }).click()

  await expect(page.locator("#form-summary")).toContainText("Some details need fixing")
  await expect(page.locator("#field-customer_email-error")).toHaveText("The email field is required.")
  await expect(page.locator("#field-rego-error")).toHaveText("Enter a registration of 2–9 letters or numbers.")
  await expect(page.locator("#field-service_bay-error")).toHaveText("The service bay field is required.")
  await expect(page.locator("#field-starts_at-error")).toHaveText("The start time field is required.")
  await expect(page.locator("#field-customer_name-error")).toHaveCount(0)

  await expect(page.getByLabel("Full name")).toHaveValue("Kept Value")
  await expect(page.getByLabel("Email")).toHaveAttribute("aria-invalid", "true")
  await expect(page.getByLabel("Email")).toBeFocused()
})

test("rejects an end time before the start time", async ({ page }) => {
  await page.goto("/bookings/new")
  await fillBooking(page, {
    name: "Backwards",
    rego: "BCK1",
    bay: "Bay 2",
    start: "2031-04-01T12:00",
    end: "2031-04-01T10:00",
  })
  await page.getByRole("button", { name: "Create booking" }).click()

  await expect(page.locator("#field-ends_at-error")).toHaveText("The end time must be after the start time.")
})

test("shows the overlap rule on the service bay field", async ({ page }) => {
  await createBooking(page, {
    name: "First In",
    rego: "FIRST1",
    bay: "Bay 3 (chassis & axles)",
    start: "2031-05-06T09:00",
    end: "2031-05-06T11:00",
  })

  await page.goto("/bookings/new")
  await fillBooking(page, {
    name: "Second Try",
    rego: "SECOND2",
    bay: "Bay 3 (chassis & axles)",
    start: "2031-05-06T10:00",
    end: "2031-05-06T12:00",
  })
  await page.getByRole("button", { name: "Create booking" }).click()

  await expect(page.locator("#field-service_bay-error")).toHaveText(
    "Bay 3 (chassis & axles) is already booked 9:00am – 11:00am on Tue 6 May. Choose another bay or time.",
  )
  await expect(page.getByLabel("Service bay")).toBeFocused()

  // Moving to a free bay fixes it.
  await page.getByLabel("Service bay").selectOption({ label: "Bay 4 (gas & electrical)" })
  await page.getByRole("button", { name: "Create booking" }).click()
  await expect(page.getByText("Booking created.")).toBeVisible()
})

test("drives the status filter and pagination from the URL", async ({ page }) => {
  await page.goto("/bookings?status=confirmed&page=2")

  await expect(page.getByRole("heading", { name: "Confirmed bookings" })).toBeVisible()
  const filter = page.getByRole("navigation", { name: "Filter by status" })
  await expect(filter.getByRole("link", { name: /Confirmed$/ })).toHaveAttribute("aria-current", "page")
  await expect(page.getByLabel("Pagination")).toContainText(/Page 2 of \d+, showing 11–20/)
  const rows = page.getByRole("list").last().getByRole("listitem")
  await expect(rows.first()).toBeVisible()
  for (const row of await rows.all()) {
    await expect(row).toContainText("Confirmed")
  }

  await markDocument(page)
  await filter.getByRole("link", { name: /Pending$/ }).click()
  await expect(page).toHaveURL(/\/bookings\?status=pending$/)
  await expect(page.getByRole("heading", { name: "Pending bookings" })).toBeVisible()
  await expectNoFullReload(page)
})

test("an unknown status in the URL falls back to all bookings", async ({ page }) => {
  await page.goto("/bookings?status=nonsense&page=-4")
  await expect(page.getByRole("heading", { name: "Workshop bookings" })).toBeVisible()
  await expect(
    page.getByRole("navigation", { name: "Filter by status" }).getByRole("link", { name: /All bookings$/ }),
  ).toHaveAttribute("aria-current", "page")
})

test("confirming from the list updates it in place", async ({ page }) => {
  await createBooking(page, {
    name: "Quick Confirm",
    rego: "QUICK1",
    bay: "Bay 2",
    start: "2032-01-20T08:00",
    end: "2032-01-20T09:00",
  })

  await page.goto("/bookings?status=pending")
  await markDocument(page)
  const pendingCount = page
    .getByRole("navigation", { name: "Filter by status" })
    .getByRole("link", { name: /Pending$/ })
  const before = Number((await pendingCount.textContent())?.match(/\d+/)?.[0])

  await page.getByRole("button", { name: "Confirm booking for Quick Confirm" }).click()

  await expect(page.getByText("Quick Confirm")).toHaveCount(0)
  await expect(pendingCount).toContainText(String(before - 1))
  await expectNoFullReload(page)
})

test("edits a booking with its times pre-filled in workshop time", async ({ page }) => {
  await createBooking(page, {
    name: "Edit Me",
    rego: "EDIT1",
    bay: "Bay 1",
    start: "2031-07-01T09:00",
    end: "2031-07-01T10:00",
  })

  await page.getByRole("link", { name: "Edit booking" }).click()
  await expect(page.getByLabel("Drop-off")).toHaveValue("2031-07-01T09:00")
  await expect(page.getByLabel("Ready for pick-up")).toHaveValue("2031-07-01T10:00")

  await page.getByLabel("Ready for pick-up").fill("2031-07-01T13:15")
  await page.getByRole("radio", { name: "Confirmed" }).check({ force: true })
  await page.getByRole("button", { name: "Save changes" }).click()

  await expect(page.getByText("Changes saved.")).toBeVisible()
  await expect(page.getByText("1:15pm")).toBeVisible()
  await expect(page.getByLabel("Booking summary")).toBeVisible()
  await expect(page.getByRole("definition").filter({ hasText: "Confirmed" })).toBeVisible()
})

test("shows a not-found page for a booking that doesn't exist", async ({ page }) => {
  await page.goto("/bookings/0194f3a2-7c1e-7b2a-9c4d-1a2b3c4d5e6f")
  await expect(page.getByRole("heading", { name: "Booking not found" })).toBeVisible()
  await expect(page.locator('head meta[name="robots"]')).toHaveAttribute("content", /noindex/)

  await page.goto("/bookings/not-a-uuid")
  await expect(page.getByRole("heading", { name: "Booking not found" })).toBeVisible()

  // Old integer-style URLs are not valid ids any more.
  await page.goto("/bookings/1")
  await expect(page.getByRole("heading", { name: "Booking not found" })).toBeVisible()
})
