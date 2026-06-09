import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  ArrowRight,
  Receipt,
  CheckSquare,
  Package,
  MessageSquare,
  ArrowLeftRight,
  Bell,
} from "lucide-react";

const features = [
  {
    icon: Receipt,
    title: "Expense Management",
    desc: "Split bills equally, by percentage, or custom amounts. Track every rupee.",
  },
  {
    icon: ArrowLeftRight,
    title: "Smart Settlements",
    desc: "Minimize transactions. One optimized settlement graph for your whole flat.",
  },
  {
    icon: CheckSquare,
    title: "Chore Tracking",
    desc: "Assign recurring chores, track completion, and keep everyone accountable.",
  },
  // {
  //   icon: Package,
  //   title: "Inventory & Assets",
  //   desc: "Know what's running low and who owns what in your shared home.",
  // },
  // {
  //   icon: MessageSquare,
  //   title: "Real-time Chat",
  //   desc: "Group chat with automatic updates when expenses or chores change.",
  // },
  {
    icon: Bell,
    title: "Push Notifications",
    desc: "Never miss a due bill, chore reminder, or settlement request.",
  },
];

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Nav */}
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold">
            {/* <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
              BB
            </div> */}
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-primary">
              <Image
                 src="/images/balance.jpg"
                alt="BalanceBuddy Logo"
                fill
                sizes="36px"
                className="object-contain"
                priority
              />
            </div>
            <span className="text-sm">BalanceBuddy</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 inline-flex items-center rounded-full border px-3 py-1 text-xs text-muted-foreground">
            The Expense Management Operating System
          </div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Manage shared expenses,{" "}
            <span className="text-muted-foreground">together.</span>
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            BalanceBuddy helps friends, roommates, travel groups, and
            communities manage shared expenses, tasks, settlements, and everyday
            coordination in one place.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/register">
                Get started free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 py-20 px-4">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-2xl font-semibold tracking-tight">
            Everything your group needs, in one place
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-lg border bg-background p-5 shadow-xs"
              >
                <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="mb-1 text-sm font-semibold">{title}</h3>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="mb-3 text-2xl font-semibold tracking-tight">
          Ready to simplify shared expenses?
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Free to use. No credit card required.
          </p>
          <Button size="lg" asChild>
            <Link href="/register">
             Create your group
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        &copy; 2026 BalanceBuddy. All rights reserved.
      </footer>
    </div>
  );
}
