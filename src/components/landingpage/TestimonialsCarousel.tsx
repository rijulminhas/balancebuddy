"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Testimonial {
  id: string;
  userName: string;
  rating: number | null;
  title: string;
  description: string;
  type: string;
}

const AVATAR_COLORS = [
  "bg-violet-500/15 text-violet-600",
  "bg-blue-500/15 text-blue-600",
  "bg-emerald-500/15 text-emerald-600",
  "bg-rose-500/15 text-rose-600",
  "bg-amber-500/15 text-amber-600",
];

function StarRow({ rating }: { rating: number | null }) {
  return (
    <div className="flex items-center gap-0.5 mb-3">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            "h-3.5 w-3.5",
            rating && s <= rating ? "fill-amber-400 text-amber-400" : "fill-transparent text-muted-foreground/20"
          )}
        />
      ))}
    </div>
  );
}

function TestimonialCard({ item }: { item: Testimonial }) {
  const color = AVATAR_COLORS[item.userName.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div className="flex flex-col h-full rounded-xl border bg-card p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20">
      <StarRow rating={item.rating} />
      <p className="flex-1 text-sm leading-relaxed text-foreground/80 mb-4">
        &ldquo;{item.description}&rdquo;
      </p>
      <div className="flex items-center gap-2.5 pt-2 border-t border-border/50">
        <div className={cn("shrink-0 flex items-center justify-center rounded-full h-8 w-8 text-xs font-bold", color)}>
          {item.userName[0]?.toUpperCase() ?? "?"}
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground">{item.userName}</p>
          <p className="text-[10px] capitalize text-muted-foreground">{item.type.replace(/_/g, " ")}</p>
        </div>
      </div>
    </div>
  );
}

export function TestimonialsCarousel({ items }: { items: Testimonial[] }) {
  const [page, setPage] = useState(0);
  const [fading, setFading] = useState(false);

  const totalPages = Math.ceil(items.length / 3);
  const current = items.slice(page * 3, page * 3 + 3);

  function go(target: number) {
    if (fading) return;
    setFading(true);
    setTimeout(() => { setPage(target); setFading(false); }, 180);
  }

  return (
    <div className="space-y-6">
      {/* 3-column grid, centered */}
      <div
        className={cn(
          "flex flex-wrap justify-center items-stretch gap-4 transition-opacity duration-200",
          fading ? "opacity-0" : "opacity-100"
        )}
      >
        {current.map((item) => (
          <div key={item.id} className="w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]">
            <TestimonialCard item={item} />
          </div>
        ))}
      </div>

      {/* Navigation */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => go(page - 1)}
            disabled={page === 0 || fading}
            aria-label="Previous"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full border bg-background shadow-xs transition-all",
              page === 0 ? "cursor-not-allowed opacity-25" : "hover:bg-accent hover:border-primary/30"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                aria-label={`Page ${i + 1}`}
                className={cn(
                  "rounded-full transition-all duration-200",
                  i === page
                    ? "h-2 w-6 bg-primary"
                    : "h-2 w-2 bg-muted-foreground/25 hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>

          <button
            onClick={() => go(page + 1)}
            disabled={page === totalPages - 1 || fading}
            aria-label="Next"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full border bg-background shadow-xs transition-all",
              page === totalPages - 1 ? "cursor-not-allowed opacity-25" : "hover:bg-accent hover:border-primary/30"
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
