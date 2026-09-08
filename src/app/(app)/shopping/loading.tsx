import { Skeleton } from "@/components/ui/skeleton";

export default function ShoppingLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-72 rounded-xl" />
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
      <Skeleton className="h-14 w-full rounded-xl" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border/60 p-4 space-y-3">
            <Skeleton className="h-4 w-24" />
            {[1, 2, 3].map((j) => (
              <Skeleton key={j} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
