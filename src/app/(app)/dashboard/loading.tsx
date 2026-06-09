import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl hidden sm:block" />
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-border/60">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between mb-3">
                <Skeleton className="h-10 w-10 rounded-2xl" />
                <Skeleton className="h-4 w-4 mt-1" />
              </div>
              <Skeleton className="h-9 w-12 mb-1.5" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Balance strip */}
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-between py-5 px-5">
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-9 w-32" />
              </div>
              <Skeleton className="h-12 w-12 rounded-2xl" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="border-border/60">
            <CardContent className="pt-5 pb-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-7 w-20 rounded-xl" />
              </div>
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-10 w-full rounded-xl" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
