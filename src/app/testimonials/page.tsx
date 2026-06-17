import { db } from "@/db";
import { feedback } from "@/db/schema";
import { and, eq, desc, count } from "drizzle-orm";
import { Star, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PaginationBar } from "@/components/ui/pagination-bar";

const PAGE_SIZE = 12;

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

async function getTestimonials(page: number) {
  const offset = (page - 1) * PAGE_SIZE;

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: feedback.id,
        userName: feedback.userName,
        rating: feedback.rating,
        title: feedback.title,
        description: feedback.description,
        type: feedback.type,
      })
      .from(feedback)
      .where(and(eq(feedback.isPublished, true), eq(feedback.allowPublicDisplay, true)))
      .orderBy(desc(feedback.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db
      .select({ total: count() })
      .from(feedback)
      .where(and(eq(feedback.isPublished, true), eq(feedback.allowPublicDisplay, true))),
  ]);

  return { items, total: countResult[0]?.total ?? 0 };
}

function StarRow({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-0.5 mb-2">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={
            s <= rating
              ? "h-3.5 w-3.5 fill-amber-400 text-amber-400"
              : "h-3.5 w-3.5 fill-transparent text-muted-foreground/25"
          }
        />
      ))}
    </div>
  );
}

export default async function TestimonialsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const { items, total } = await getTestimonials(page);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <span className="text-sm font-semibold text-foreground">BalanceBuddy</span>
          <span className="ml-auto text-xs text-muted-foreground">{total} testimonials</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12">
        {/* Page title */}
        <div className="mb-10 text-center">
          <div className="mb-2 text-xs font-medium uppercase tracking-widest text-primary">
            Community Feedback
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            What users are saying
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Genuine feedback from people who use BalanceBuddy every day.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-muted/30 py-20 text-center">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="h-6 w-6 fill-amber-400/30 text-amber-400/30" />
              ))}
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              No published testimonials yet.
            </p>
            <Link
              href="/feedback"
              className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
            >
              Be the first to share your experience
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-col rounded-2xl border bg-card p-5 shadow-xs"
                >
                  <StarRow rating={t.rating} />
                  <p className="flex-1 text-sm leading-relaxed text-foreground mb-4">
                    &ldquo;{t.description}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 pt-3 border-t border-border/50">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {t.userName[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{t.userName}</p>
                      <p className="text-[10px] capitalize text-muted-foreground">
                        {t.type.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <PaginationBar page={page} totalPages={totalPages} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
