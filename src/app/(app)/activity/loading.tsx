import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function ActivityLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-28 mt-2" />
          <Skeleton className="h-10 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-24 rounded-2xl hidden sm:block" />
      </div>

      {/* Activity groups */}
      {Array.from({ length: 3 }).map((_, g) => (
        <div key={g} className="space-y-1">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="h-3 w-16" />
            <div className="flex-1 h-px bg-border/50" />
            <Skeleton className="h-3 w-4" />
          </div>
          <Card className="border-border/60 overflow-hidden">
            <CardContent className="p-0">
              {Array.from({ length: g === 0 ? 5 : 3 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-4 px-5 py-4 ${i < (g === 0 ? 4 : 2) ? "border-b border-border/40" : ""}`}
                >
                  <Skeleton className="mt-2 h-2 w-2 rounded-full shrink-0" />
                  <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3 w-3.5" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full hidden sm:block shrink-0" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
