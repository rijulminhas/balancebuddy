import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { MessageSquarePlus } from "lucide-react";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "What Should We Improve? — BalanceBuddy" };

export default async function FeedbackPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <MessageSquarePlus className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">What Should We Improve?</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Share your thoughts, report bugs, or request features. We read every submission.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Submit Feedback</CardTitle>
          <CardDescription>
            Submitting as{" "}
            <span className="font-medium text-foreground">{session.user.name}</span>{" "}
            &middot;{" "}
            <span className="text-muted-foreground">{session.user.email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FeedbackForm />
        </CardContent>
      </Card>
    </div>
  );
}
