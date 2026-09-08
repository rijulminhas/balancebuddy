import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationBarProps {
  page: number;
  totalPages: number;
  extraParams?: Record<string, string>;
}

const base =
  "inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium shadow-sm transition-colors";

function buildHref(targetPage: number, extraParams?: Record<string, string>): string {
  const params = new URLSearchParams(extraParams ?? {});
  params.set("page", String(targetPage));
  return `?${params.toString()}`;
}

export function PaginationBar({ page, totalPages, extraParams }: PaginationBarProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-xs text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            href={buildHref(page - 1, extraParams)}
            className={`${base} hover:bg-accent hover:text-accent-foreground`}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </Link>
        ) : (
          <span className={`${base} opacity-40 cursor-not-allowed pointer-events-none`}>
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </span>
        )}
        {page < totalPages ? (
          <Link
            href={buildHref(page + 1, extraParams)}
            className={`${base} hover:bg-accent hover:text-accent-foreground`}
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <span className={`${base} opacity-40 cursor-not-allowed pointer-events-none`}>
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </div>
  );
}
