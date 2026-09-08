import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MailCheck } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="h-6 w-6" />
        </div>
        <CardTitle className="text-xl">Verify your email</CardTitle>
        <CardDescription>
          We sent a verification link to your email. Click it to activate your
          account.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <p className="text-xs text-muted-foreground text-center">
          Didn&apos;t receive it? Check your spam folder or request a new link.
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/login">Go to sign in</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
