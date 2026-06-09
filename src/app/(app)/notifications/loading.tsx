import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function NotificationsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      {/* Notification items */}
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="border-border/60">
            <CardContent className="flex items-start gap-4 py-4 px-5">
              <Skeleton className="h-9 w-9 rounded-full shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-3 w-16 shrink-0 mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
