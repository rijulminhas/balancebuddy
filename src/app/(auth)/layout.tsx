import Image from "next/image";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Link from "next/link";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session) redirect("/dashboard");
  return (
    <div className="min-h-screen flex">
      {/* Left branding panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] flex-col justify-between bg-sidebar p-12 relative overflow-hidden shrink-0">
        {/* Decorative blobs */}
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-20 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

        {/* Logo */}
        <Link href="/" className="relative flex items-center gap-3 z-10">
          {/* <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-base font-black shadow-lg shadow-primary/40">
            BB
          </div> */}
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl">
            <Image
               src="/images/balance.jpg"
              alt="BalanceBuddy Logo"
              fill
              sizes="40px"
              className="object-contain"
              priority
            />
          </div>
          <span className="text-xl font-black tracking-tight text-sidebar-foreground">
            BalanceBuddy
          </span>
        </Link>

        {/* Hero text */}
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl xl:text-5xl font-black leading-tight tracking-tight text-sidebar-foreground">
            Manage your Group Expense,{" "}
            <span className="text-primary">effortlessly.</span>
          </h1>
          <p className="text-base text-sidebar-foreground/60 leading-relaxed max-w-sm">
            Split expenses, track chores, manage inventory — everything your
            group needs in one place.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            {["Expense Splitting", "Chore Tracking", "Settlements", "Flat Chat"].map((f) => (
              <span
                key={f}
                className="rounded-full border border-sidebar-border bg-sidebar-accent px-3 py-1 text-xs font-semibold text-sidebar-accent-foreground"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Footer quote */}
        <p className="relative z-10 text-xs text-sidebar-foreground/30 font-medium">
          Built for Mates who actually want to stay friends.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile logo */}
          <div className="flex lg:hidden justify-center mb-2">
            <div className="flex items-center gap-3">
              {/* <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-sm font-black shadow-lg shadow-primary/30">
                BB
              </div> */}
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl">
                <Image
                   src="/images/balance.jpg"
                  alt="BalanceBuddy Logo"
                  fill
                  sizes="36px"
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-lg font-black tracking-tight">BalanceBuddy</span>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
