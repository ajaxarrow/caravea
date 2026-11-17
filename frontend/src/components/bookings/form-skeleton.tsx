import { Skeleton } from "@/components/ui/skeleton"

export function BookingFormSkeleton() {
  return (
    <div
      aria-busy
      aria-label="Loading form"
      role="status"
      className="border-line bg-surface space-y-8 rounded-3xl border p-5 sm:p-8"
    >
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="grid gap-4 md:grid-cols-[12rem_1fr] md:gap-8">
          <Skeleton className="h-4 w-24" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-11 rounded-xl" />
            <Skeleton className="h-11 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}
