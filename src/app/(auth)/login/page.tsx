"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const searchParams = useSearchParams();

  // Strip absolute callbackUrls (e.g. http://localhost:3000/dashboard) that
  // arrive when NEXTAUTH_URL was previously a different host.
  const raw = searchParams.get("callbackUrl") ?? "/dashboard";
  const callbackUrl = raw.startsWith("/") ? raw : "/dashboard";

  const [isLoading, setIsLoading] = useState(false);

  // After successful sign-in, trigger a full hard navigation instead of
  // router.push() + router.refresh(). Those two together cause a race:
  //  1. router.refresh() refetches /login → (auth)/layout sees the new session
  //     → 307 to /dashboard
  //  2. router.push() fetches /dashboard using the stale RSC cache (pre-login)
  //     → (app)/layout sees null session → 307 back to /login
  //  → infinite 307 loop.
  // A hard navigation forces a fresh HTTP request with the new cookie, so both
  // layouts read the session correctly on the very first render.
  const [dest, setDest] = useState<string | null>(null);
  useEffect(() => {
    if (dest) window.location.href = dest;
  }, [dest]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
        callbackUrl,
      });

      if (!result) {
        toast.error("Something went wrong. Please try again.");
        return;
      }
      if (result.error) {
        toast.error("Invalid email or password");
        return;
      }

      setDest(callbackUrl);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black tracking-tight">Welcome back</h2>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to your BalanceBuddy account</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">Email</FormLabel>
                <FormControl>
                  <Input placeholder="you@example.com" type="email" autoComplete="email"
                    className="h-11 rounded-xl" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="font-semibold">Password</FormLabel>
                  <Link href="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <PasswordInput placeholder="••••••••" autoComplete="current-password"
                    className="h-11 rounded-xl" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading} className="w-full h-11 rounded-xl font-bold text-base">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-bold text-primary hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
