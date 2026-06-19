import { db } from "@/db";
import { feedback, users } from "@/db/schema";
import { and, eq, desc, count } from "drizzle-orm";
import { Star } from "lucide-react";
import Link from "next/link";
import { TestimonialsCarousel } from "./TestimonialsCarousel";

const LANDING_LIMIT = 9;

async function getTestimonialsData() {
  const [items, countResult] = await Promise.all([
    db
      .select({
        id: feedback.id,
        userName: feedback.userName,
        rating: feedback.rating,
        title: feedback.title,
        description: feedback.description,
        type: feedback.type,
        userImage: users.image,
      })
      .from(feedback)
      .leftJoin(users, eq(feedback.userId, users.id))
      .where(and(eq(feedback.isPublished, true), eq(feedback.allowPublicDisplay, true)))
      .orderBy(desc(feedback.createdAt))
      .limit(LANDING_LIMIT),
    db
      .select({ total: count() })
      .from(feedback)
      .where(and(eq(feedback.isPublished, true), eq(feedback.allowPublicDisplay, true))),
  ]);

  return { items, total: countResult[0]?.total ?? 0 };
}

export async function TestimonialsSection() {
  const { items, total } = await getTestimonialsData();
  const showViewAll = total > LANDING_LIMIT;

  return (
    <section id="testimonials" className="border-t bg-muted/30 px-4 py-20">
      <div className="mx-auto max-w-6xl">
        {/* Header row */}
        <div className="mb-2 flex items-start justify-between">
          <div className="flex-1 text-center">
            <div className="mb-3 text-xs font-medium uppercase tracking-widest text-primary">
              What Users Say
            </div>
            <h2 className="mb-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Loved by real users
            </h2>
            <p className="mx-auto mb-0 max-w-lg text-sm text-muted-foreground">
              Genuine feedback from people who use BalanceBuddy every day.
            </p>
          </div>
          {showViewAll && (
            <Link
              href="/testimonials"
              className="ml-4 mt-1 shrink-0 rounded-full border bg-background px-4 py-1.5 text-xs font-semibold shadow-xs transition-colors hover:bg-accent"
            >
              View All Feedbacks
            </Link>
          )}
        </div>

        <div className="mt-10">
          {items.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-background py-16 text-center">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-6 w-6 fill-amber-400/30 text-amber-400/30" />
                ))}
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                No testimonials yet — be the first to share your experience!
              </p>
              <a
                href="/feedback"
                className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
              >
                Give Feedback
              </a>
            </div>
          ) : (
            <TestimonialsCarousel items={items} />
          )}
        </div>
      </div>
    </section>
  );
}
