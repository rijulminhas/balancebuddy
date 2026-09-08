"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { resetPasswordWithOtp } from "@/actions/auth";

const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const otpSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type EmailValues = z.infer<typeof emailSchema>;
type OtpValues = z.infer<typeof otpSchema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const otpForm = useForm<OtpValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onEmailSubmit(values: EmailValues) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Failed to send OTP");
        return;
      }
      setEmail(values.email);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function onOtpSubmit(values: OtpValues) {
    if (otp.length !== 6) { setOtpError("OTP must be 6 digits"); return; }
    setOtpError("");
    setLoading(true);
    try {
      const result = await resetPasswordWithOtp(email, otp, values.password);
      if (!result.success) { toast.error(result.error ?? "Invalid or expired OTP"); return; }
      setDone(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Step 3 — Done
  if (done) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/10">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tight">Password updated!</h2>
          <p className="mt-2 text-sm text-muted-foreground">You can now sign in with your new password.</p>
        </div>
        <Button asChild className="w-full h-11 rounded-xl font-bold text-base">
          <Link href="/login">Back to Sign In</Link>
        </Button>
      </div>
    );
  }

  // Step 2 — Enter OTP + new password
  if (email) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Enter OTP</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We sent a 6-digit code to <span className="font-semibold text-foreground">{email}</span>. It expires in 10 minutes.
          </p>
        </div>

        <Form {...otpForm}>
          <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">OTP Code</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="123456"
                maxLength={6}
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setOtpError(""); }}
                className="flex h-11 w-full rounded-xl border border-input bg-transparent px-4 text-2xl font-black tracking-[0.5em] text-center shadow-sm transition-colors placeholder:text-muted-foreground placeholder:tracking-normal placeholder:text-base placeholder:font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {otpError && <p className="text-xs font-semibold text-destructive">{otpError}</p>}
            </div>

            <FormField
              control={otpForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">New Password</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder="Min. 8 characters" className="h-11 rounded-xl" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={otpForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Confirm Password</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder="Repeat password" className="h-11 rounded-xl" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full h-11 rounded-xl font-bold text-base" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset Password
            </Button>
          </form>
        </Form>

        <p className="text-center text-sm text-muted-foreground">
          <button type="button" className="font-bold text-primary hover:underline" onClick={() => setEmail("")}>
            Use a different email
          </button>
        </p>
      </div>
    );
  }

  // Step 1 — Enter email
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black tracking-tight">Forgot password?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a 6-digit OTP.
        </p>
      </div>

      <Form {...emailForm}>
        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
          <FormField
            control={emailForm.control}
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
          <Button type="submit" className="w-full h-11 rounded-xl font-bold text-base" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send OTP
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="inline-flex items-center gap-1 font-bold text-primary hover:underline">
          <ArrowLeft className="h-3 w-3" />
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
