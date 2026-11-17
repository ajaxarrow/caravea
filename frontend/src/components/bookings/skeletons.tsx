import { Skeleton } from "@/components/ui/skeleton"

export function BookingListSkeleton() {
  return (
    <div aria-busy aria-label="Loading bookings" role="status">
      <div className="border-line grid grid-cols-2 border-y sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-col gap-3 px-5 py-6 sm:py-8">
            <Skeleton className="h-12 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      <ul className="mt-8 flex flex-col gap-3">
        {Array.from({ length: 5 }, (_, i) => (
          <li key={i} className="border-line bg-surface flex items-center gap-6 rounded-3xl border p-5">
            <Skeleton className="size-12 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="hidden h-4 flex-1 md:block" />
            <Skeleton className="h-7 w-24 rounded-full" />
          </li>
        ))}
      </ul>
    </div>
  )
}

export function BookingDetailSkeleton() {
  return (
    <div aria-busy aria-label="Loading booking" role="status" className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <div className="border-line bg-surface space-y-6 rounded-3xl border p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-14 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <Skeleton className="h-28 w-full" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
      <Skeleton className="h-80 rounded-3xl" />
    </div>
  )
}
