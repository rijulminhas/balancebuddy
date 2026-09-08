import { Skeleton } from "@/components/ui/skeleton";

function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-border/40">
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-5 w-20 rounded-full" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-7 w-16 rounded-lg" />
    </div>
  );
}

export default function ExpensesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-8 w-28 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-48 rounded-xl" />
      <div className="rounded-xl border border-border/60 p-4 space-y-2">
        <Skeleton className="h-5 w-32 mb-4" />
        {Array.from({ length: 8 }).map((_, i) => (
          <TableRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
