"use client"

import { ArrowRightIcon, WarningCircleIcon } from "@phosphor-icons/react"
import { cn } from "cn"
import Link from "next/link"
import { cloneElement, useActionState, useEffect, useRef } from "react"

import { Button, ButtonIcon, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { type BookingFormState, IDLE } from "@/lib/bookings/form"
import {
  BOOKING_FIELDS,
  type BookingField,
  type BookingFormValues,
  type BookingStatus,
  type ServiceBay,
} from "@/lib/bookings/types"

import { STATUS_LABELS, StatusDot } from "./status-badge"

type Props = {
  mode: "create" | "edit"
  action: (state: BookingFormState, formData: FormData) => Promise<BookingFormState>
  initialValues: BookingFormValues
  bays: ServiceBay[]
  timeZoneCity: string
  cancelHref: string
}

/**
 * One form for create and edit. Laravel owns validation: the form has
 * `noValidate`, the Server Action forwards Laravel's 422 errors, and each
 * message is rendered under the field it belongs to — including the
 * overlap rule, which lands on the service bay.
 */
export function BookingForm({ mode, action, initialValues, bays, timeZoneCity, cancelHref }: Props) {
  const [state, formAction, pending] = useActionState(action, IDLE)
  const formRef = useRef<HTMLFormElement>(null)
  const summaryRef = useRef<HTMLDivElement>(null)

  const failed = state.status === "error"
  const values = failed ? state.values : initialValues
  const errors = failed ? state.fieldErrors : {}

  // After a failed submit, move focus to the first field that needs fixing
  // (or to the summary if the problem isn't tied to a field).
  useEffect(() => {
    if (state.status !== "error") return
    const firstInvalid = BOOKING_FIELDS.find((field) => state.fieldErrors[field])
    const target = firstInvalid
      ? formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)
      : summaryRef.current
    target?.focus()
  }, [state])

  const statuses: BookingStatus[] = mode === "create" ? ["pending", "confirmed"] : ["pending", "confirmed", "cancelled"]

  return (
    // React resets uncontrolled forms after an action. Remounting on each
    // failed attempt re-applies the submitted values as defaults, so nothing
    // the user typed is lost.
    <form
      key={failed ? state.attempt : "initial"}
      ref={formRef}
      action={formAction}
      noValidate
      aria-describedby={failed ? "form-summary" : undefined}
      className="border-line bg-surface rounded-3xl border p-5 sm:p-8"
    >
      {failed && (
        <div
          ref={summaryRef}
          id="form-summary"
          role="alert"
          tabIndex={-1}
          className="border-danger/25 bg-danger/5 text-ink mb-8 flex gap-3 rounded-2xl border p-4 text-[14px] outline-none"
        >
          <WarningCircleIcon className="text-danger mt-0.5 size-5 shrink-0" aria-hidden />
          <p>{state.message}</p>
        </div>
      )}

      <Section title="Customer">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="customer_name" label="Full name" error={errors.customer_name}>
            <Input autoComplete="name" defaultValue={values.customer_name} />
          </Field>
          <Field name="customer_email" label="Email" error={errors.customer_email}>
            <Input type="email" autoComplete="email" inputMode="email" defaultValue={values.customer_email} />
          </Field>
        </div>
      </Section>

      <Section title="Caravan">
        <Field
          name="rego"
          label="Registration"
          hint="Letters and numbers, as on the plate."
          error={errors.rego}
          className="sm:max-w-[16rem]"
        >
          <Input
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            defaultValue={values.rego}
            className="tracking-wide uppercase"
          />
        </Field>
      </Section>

      <Section
        title="Bay and time"
        description={`Times are ${timeZoneCity} time. A bay can only hold one caravan at a time.`}
      >
        <Field name="service_bay" label="Service bay" error={errors.service_bay}>
          <NativeSelect defaultValue={values.service_bay}>
            <NativeSelectOption value="" disabled>
              Choose a bay
            </NativeSelectOption>
            {bays.map((bay) => (
              <NativeSelectOption key={bay.id} value={String(bay.id)}>
                {bay.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>

        {/* Drop-off ●──● pick-up, echoing the journey line elsewhere. */}
        <div className="mt-5 grid gap-5 pl-7">
          <Field
            name="starts_at"
            label="Drop-off"
            error={errors.starts_at}
            marker={
              <>
                {/* Connector runs from this dot to the next field's dot, whatever this field's height. */}
                <span className="bg-ink absolute top-[49px] -left-[23.5px] h-[calc(100%+20px)] w-px" />
                <span className="bg-ink absolute top-[44px] -left-7 size-2.5 rounded-full" />
              </>
            }
          >
            <Input type="datetime-local" step={900} defaultValue={values.starts_at} />
          </Field>
          <Field
            name="ends_at"
            label="Ready for pick-up"
            error={errors.ends_at}
            marker={
              <span className="border-ink bg-surface absolute top-[44px] -left-7 size-2.5 rounded-full border-[1.5px]" />
            }
          >
            <Input type="datetime-local" step={900} defaultValue={values.ends_at} />
          </Field>
        </div>
      </Section>

      <Section title="Status">
        <fieldset aria-describedby={errors.status ? "status-error" : undefined}>
          <legend className="sr-only">Booking status</legend>
          <div className="flex flex-wrap gap-2">
            {statuses.map((status) => (
              <label
                key={status}
                className="border-line-strong bg-surface text-ink hover:border-ink has-checked:border-ink has-checked:bg-ink has-focus-visible:ring-ink relative flex h-10 cursor-pointer items-center gap-2 rounded-full border px-4 text-[14px] transition-colors has-checked:text-white has-focus-visible:ring-2 has-focus-visible:ring-offset-2"
              >
                <input
                  type="radio"
                  name="status"
                  value={status}
                  defaultChecked={(values.status || "pending") === status}
                  className="sr-only"
                />
                <StatusDot status={status} />
                {STATUS_LABELS[status]}
              </label>
            ))}
          </div>
          {errors.status && <FieldError id="status-error">{errors.status}</FieldError>}
        </fieldset>
      </Section>

      <Section title="Notes" description="Optional. What the workshop should know before the caravan arrives.">
        <Field name="notes" label="Notes for the workshop" error={errors.notes} labelHidden>
          <Textarea rows={4} maxLength={2000} defaultValue={values.notes} />
        </Field>
      </Section>

      <div className="border-line mt-10 flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-end">
        <Link href={cancelHref} className={buttonVariants({ variant: "ghost", size: "lg" })}>
          Discard
        </Link>
        <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
          {pending ? "Saving…" : mode === "create" ? "Create booking" : "Save changes"}
          <ButtonIcon>
            <ArrowRightIcon weight="bold" aria-hidden />
          </ButtonIcon>
        </Button>
      </div>
    </form>
  )
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="border-line grid gap-4 border-t py-7 first-of-type:border-t-0 first-of-type:pt-0 md:grid-cols-[12rem_1fr] md:gap-8">
      <div>
        <h2 className="text-ink text-[16px]">{title}</h2>
        {description && <p className="text-muted-ink mt-1 text-[13px] leading-relaxed">{description}</p>}
      </div>
      <div>{children}</div>
    </section>
  )
}

/**
 * Wires a single control to its label, hint and error: sets name, id,
 * aria-invalid and aria-describedby on the child so they can't drift apart.
 */
function Field({
  name,
  label,
  hint,
  error,
  labelHidden = false,
  marker,
  className,
  children,
}: {
  name: BookingField
  label: string
  hint?: string
  error?: string
  labelHidden?: boolean
  marker?: React.ReactNode
  className?: string
  children: React.ReactElement<Record<string, unknown>>
}) {
  const id = `field-${name}`
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined
  const control = cloneElement(children, {
    id,
    name,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
  })

  return (
    <div className={cn("relative flex flex-col gap-2", className)}>
      {marker && <span aria-hidden>{marker}</span>}
      <Label htmlFor={id} className={cn(labelHidden && "sr-only")}>
        {label}
      </Label>
      {control}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-muted-ink text-[12px]">
          {hint}
        </p>
      )}
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </div>
  )
}

function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="text-danger flex items-start gap-1.5 text-[13px] leading-snug">
      <WarningCircleIcon className="mt-px size-4 shrink-0" aria-hidden />
      {children}
    </p>
  )
}
