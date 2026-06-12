import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  ArrowRight,
  Receipt,
  CheckSquare,
  Bell,
  ArrowLeftRight,
  LayoutDashboard,
  Users,
  History,
  CalendarClock,
  ShoppingCart,
  UserCircle,
  Activity,
  LogOut,
  Crown,
  Smartphone,
  Monitor,
  Download,
  Wifi,
  Share2,
  PlusCircle,
  SplitSquareHorizontal,
  ClipboardList,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Shield,
  Star,
  ChevronRight,
  Home,
  MoreHorizontal,
  Mail,
  Hash,
  Copy,
} from "lucide-react";

const modules = [
  { icon: LayoutDashboard, title: "Dashboard", color: "text-violet-500", bg: "bg-violet-500/10" },
  { icon: Users, title: "My Group", color: "text-blue-500", bg: "bg-blue-500/10" },
  { icon: Receipt, title: "Expenses", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { icon: History, title: "Room History", color: "text-amber-500", bg: "bg-amber-500/10" },
  { icon: ArrowLeftRight, title: "Settlements", color: "text-indigo-500", bg: "bg-indigo-500/10" },
  { icon: CheckSquare, title: "Chores", color: "text-rose-500", bg: "bg-rose-500/10" },
  { icon: Activity, title: "Activity Log", color: "text-cyan-500", bg: "bg-cyan-500/10" },
  { icon: CalendarClock, title: "Reminders", color: "text-orange-500", bg: "bg-orange-500/10" },
  { icon: ShoppingCart, title: "Shopping", color: "text-lime-500", bg: "bg-lime-500/10" },
  { icon: Bell, title: "Notifications", color: "text-pink-500", bg: "bg-pink-500/10" },
  { icon: UserCircle, title: "Profile & Settings", color: "text-teal-500", bg: "bg-teal-500/10" },
];

const expenseSteps = [
  { step: "1", title: "Title & Amount", desc: "Enter the expense name and total amount spent." },
  { step: "2", title: "Category", desc: "Choose from Groceries, Rent, Utilities, Repairs, and more." },
  { step: "3", title: "Split Method", desc: "Split equally, by percentage, or enter custom amounts per member." },
  { step: "4", title: "Participants", desc: "Select which group members are included in this expense." },
  { step: "5", title: "Receipt Upload", desc: "Optionally attach a photo of the receipt for transparency." },
];

const choreSteps = [
  { step: "1", title: "Chore Name", desc: "Give the chore a clear name like 'Clean Kitchen' or 'Take Out Trash'." },
  { step: "2", title: "Assign Member", desc: "Pick one or more group members to be responsible." },
  { step: "3", title: "Due Date", desc: "Set a one-time or recurring due date (daily, weekly, monthly)." },
  { step: "4", title: "Priority", desc: "Mark as low, medium, or high priority." },
  { step: "5", title: "Notify", desc: "Members get a push notification when a chore is assigned to them." },
];

const leaveGroupRules = [
  {
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    title: "One Group at a Time",
    desc: "You must leave your current group before joining or creating a new one. BalanceBuddy ensures clean group transitions.",
  },
  {
    icon: Crown,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    title: "Admin Must Transfer Ownership",
    desc: "Group admins cannot leave without first transferring ownership to another member. This keeps the group running without disruption.",
  },
  {
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    title: "Settle Before Leaving",
    desc: "Outstanding balances are visible before you leave. We recommend settling up so no debts are left behind.",
  },
];

const pwaStepsAndroid = [
  { icon: "1", text: "Open BalanceBuddy in Chrome on your Android phone." },
  { icon: "2", text: 'Tap the three-dot menu (⋮) in the top-right corner.' },
  { icon: "3", text: 'Tap "Add to Home Screen" or "Install App".' },
  { icon: "4", text: 'Tap "Install" in the confirmation dialog.' },
];

const pwaStepsIOS = [
  { icon: "1", text: "Open BalanceBuddy in Safari on your iPhone or iPad." },
  { icon: "2", text: "Tap the Share button (box with arrow) at the bottom." },
  { icon: "3", text: 'Scroll down and tap "Add to Home Screen".' },
  { icon: "4", text: 'Tap "Add" in the top-right to confirm.' },
];

const pwaStepsDesktop = [
  { icon: "1", text: "Open BalanceBuddy in Chrome or Edge on your desktop." },
  { icon: "2", text: "Look for the install icon (⊕) in the address bar on the right." },
  { icon: "3", text: 'Click it and select "Install BalanceBuddy".' },
  { icon: "4", text: "The app opens as a standalone window — just like a native app." },
];

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold">
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-xl bg-primary">
              <Image
                src="/images/balance.jpg"
                alt="BalanceBuddy Logo"
                fill
                sizes="32px"
                className="object-contain"
                priority
              />
            </div>
            <span className="text-sm font-semibold">BalanceBuddy</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
            <a href="#modules" className="hover:text-foreground transition-colors">Modules</a>
            <a href="#invite" className="hover:text-foreground transition-colors">Invite</a>
            <a href="#expenses" className="hover:text-foreground transition-colors">Expenses</a>
            <a href="#chores" className="hover:text-foreground transition-colors">Chores</a>
            <a href="#pwa" className="hover:text-foreground transition-colors">Install App</a>
          </nav>
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

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pb-20 pt-20 text-center">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />
        </div>
        <div className="mx-auto max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            <Zap className="h-3 w-3 text-primary" />
            The Expense Management Platform
          </div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            Everything your group needs,{" "}
            <span className="text-primary">in one place.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            BalanceBuddy is a complete shared-living OS — manage expenses, chores, settlements, reminders, and shopping for flatmates, travel groups, PGs, and co-living spaces.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/register">
                Create your group free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Free to use</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> No credit card</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> PWA installable</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Works offline</span>
          </div>
        </div>
      </section>

      {/* ── All Modules Overview ────────────────────────────────────────── */}
      <section id="modules" className="border-t bg-muted/30 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-3 text-center text-xs font-medium uppercase tracking-widest text-primary">Complete Feature Suite</div>
          <h2 className="mb-3 text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            11 powerful modules, one app
          </h2>
          <p className="mx-auto mb-12 max-w-lg text-center text-sm text-muted-foreground">
            From splitting groceries to tracking chores — every shared-living workflow is covered.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {modules.map(({ icon: Icon, title, color, bg }) => (
              <div key={title} className="flex items-center gap-3 rounded-xl border bg-background p-4 shadow-xs">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${bg}`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <span className="text-sm font-medium leading-tight">{title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dashboard ──────────────────────────────────────────────────── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-600">
                <LayoutDashboard className="h-3 w-3" /> Dashboard
              </div>
              <h2 className="mb-4 text-2xl font-semibold tracking-tight sm:text-3xl">Your group at a glance</h2>
              <p className="mb-6 text-sm text-muted-foreground leading-relaxed">
                The dashboard is your command center. The moment you log in, you see a live snapshot of everything happening in your group — no digging required.
              </p>
              <ul className="space-y-3 text-sm">
                {[
                  "Total group balance and who owes what",
                  "Recent expenses with amounts and who paid",
                  "Pending chores and their deadlines",
                  "Upcoming reminders and due bills",
                  "Unsettled debts with quick-settle action",
                  "Group member list with their balances",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold">Group Overview</span>
                <span className="text-xs text-muted-foreground">Flat 4B</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: "Total Spent", value: "₹14,200", color: "text-foreground" },
                  { label: "Your Balance", value: "-₹2,400", color: "text-rose-500" },
                  { label: "Pending Chores", value: "3", color: "text-amber-500" },
                  { label: "Reminders", value: "2 due", color: "text-violet-500" },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg bg-muted/50 p-3">
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                    <div className={`mt-1 text-lg font-semibold ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {["Rahul owes you ₹800", "You owe Priya ₹3,200", "Amit settled ₹1,000"].map((t, i) => (
                  <div key={t} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className={`h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-emerald-400" : i === 1 ? "bg-rose-400" : "bg-muted-foreground/40"}`} />
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── My Group ───────────────────────────────────────────────────── */}
      <section className="border-t bg-muted/30 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="order-2 md:order-1 rounded-2xl border bg-card p-6 shadow-sm">
              <div className="mb-4 text-sm font-semibold">Group Members</div>
              <div className="space-y-3">
                {[
                  { name: "Rahul Sharma", role: "Admin", balance: "+₹800" },
                  { name: "Priya Patel", role: "Member", balance: "-₹1,200" },
                  { name: "Amit Kumar", role: "Member", balance: "₹0" },
                  { name: "Sara Singh", role: "Member", balance: "+₹400" },
                ].map((m) => (
                  <div key={m.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {m.name[0]}
                      </div>
                      <div>
                        <div className="text-xs font-medium">{m.name}</div>
                        <div className="text-xs text-muted-foreground">{m.role}</div>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold ${m.balance.startsWith("+") ? "text-emerald-500" : m.balance === "₹0" ? "text-muted-foreground" : "text-rose-500"}`}>
                      {m.balance}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <div className="flex-1 rounded-lg bg-primary/10 px-3 py-2 text-center text-xs font-medium text-primary cursor-pointer">Invite Member</div>
                <div className="flex-1 rounded-lg bg-muted px-3 py-2 text-center text-xs font-medium text-muted-foreground cursor-pointer">Share Link</div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-600">
                <Users className="h-3 w-3" /> My Group
              </div>
              <h2 className="mb-4 text-2xl font-semibold tracking-tight sm:text-3xl">Manage your group easily</h2>
              <p className="mb-6 text-sm text-muted-foreground leading-relaxed">
                Create a group for your flat, PG, hostel, trip, or any shared space. Invite members via link or email and manage roles.
              </p>
              <ul className="space-y-3 text-sm">
                {[
                  "Create or join a group with a shareable invite link",
                  "View all members, their roles, and current balances",
                  "Admin can promote members or remove inactive ones",
                  "Group name, description, and avatar customization",
                  "Member count, total spend, and group stats",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Invite Members Flow ─────────────────────────────────────────── */}
      <section id="invite" className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-3 text-center text-xs font-medium uppercase tracking-widest text-primary">Invite Flow</div>
          <h2 className="mb-3 text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            3 ways to invite members
          </h2>
          <p className="mx-auto mb-12 max-w-lg text-center text-sm text-muted-foreground">
            Get your flatmates, travel companions, or group members onboard in seconds — by email, invite link, or a shareable code.
          </p>
          <div className="grid gap-8 md:grid-cols-2">

            {/* Left: 3 method cards */}
            <div className="space-y-4">
              <div className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10">
                    <Mail className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Invite by Email</div>
                    <div className="text-xs text-muted-foreground">Send a direct invite link to their inbox</div>
                  </div>
                </div>
                <div className="mb-3 flex gap-2">
                  <div className="flex-1 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">someone@email.com</div>
                  <div className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-medium text-white">Send Invite</div>
                </div>
                <p className="text-xs text-muted-foreground">They receive an email with a one-click join link. No code to share, no hassle.</p>
              </div>

              <div className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10">
                    <Share2 className="h-4 w-4 text-violet-500" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Copy Invite Link</div>
                    <div className="text-xs text-muted-foreground">Share a direct URL anywhere</div>
                  </div>
                </div>
                <div className="mb-3 flex gap-2">
                  <div className="flex-1 truncate rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">balancebuddy.app/invite/A1B2C3D4</div>
                  <div className="rounded-lg bg-violet-500 px-3 py-2 text-xs font-medium text-white whitespace-nowrap">Copy Link</div>
                </div>
                <p className="text-xs text-muted-foreground">Paste in WhatsApp, Telegram, or any chat. Anyone with the link joins in one tap.</p>
              </div>

              <div className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                    <Hash className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Share Invite Code</div>
                    <div className="text-xs text-muted-foreground">A short code for manual entry</div>
                  </div>
                </div>
                <div className="mb-3 flex gap-2">
                  <div className="flex-1 rounded-lg bg-muted/60 px-3 py-2 text-center font-mono text-xs font-bold tracking-[0.25em] text-foreground">A1B2C3D4</div>
                  <div className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-medium text-white whitespace-nowrap">Copy Code</div>
                </div>
                <p className="text-xs text-muted-foreground">Member enters this code at <span className="font-medium text-foreground">My Group → Join Group</span>. Great when you&apos;re in the same room.</p>
              </div>
            </div>

            {/* Right: mock invite panel + join steps */}
            <div className="space-y-5">
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
                  <UserPlus className="h-4 w-4 text-primary" /> Invite Panel — My Group
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="mb-1 text-xs font-medium text-muted-foreground">Invite by email</div>
                    <div className="flex gap-2">
                      <div className="flex-1 rounded-lg border bg-background px-3 py-2 text-xs text-muted-foreground">priya@example.com</div>
                      <div className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">Send</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="h-px flex-1 bg-border" />
                    <span>or share directly</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-medium text-muted-foreground">Invite link</div>
                    <div className="flex gap-2">
                      <div className="flex-1 truncate rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">balancebuddy.app/invite/A1B2C3D4</div>
                      <div className="flex cursor-pointer items-center gap-1 rounded-lg bg-muted px-3 py-2 text-xs font-medium text-foreground">
                        <Copy className="h-3 w-3" /> Copy
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-medium text-muted-foreground">Invite code</div>
                    <div className="flex gap-2">
                      <div className="flex-1 rounded-lg border bg-muted/40 px-3 py-2 text-center font-mono text-xs font-bold tracking-[0.25em] text-foreground">A1B2C3D4</div>
                      <div className="flex cursor-pointer items-center gap-1 rounded-lg bg-muted px-3 py-2 text-xs font-medium text-foreground">
                        <Copy className="h-3 w-3" /> Copy
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-muted/40 p-5">
                <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">When a member joins via link</div>
                <div className="space-y-3">
                  {[
                    { n: "1", t: "Click the invite link", d: "Opens BalanceBuddy in the browser." },
                    { n: "2", t: "Sign in or register", d: "Takes 30 seconds — no credit card required." },
                    { n: "3", t: "Automatically joins", d: "Added to the group the moment they log in." },
                    { n: "4", t: "Start collaborating", d: "Sees expenses, chores, and balances instantly." },
                  ].map(({ n, t, d }) => (
                    <div key={n} className="flex gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{n}</div>
                      <div>
                        <div className="text-xs font-semibold">{t}</div>
                        <div className="text-xs text-muted-foreground">{d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border bg-primary/5 px-5 py-4">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">One group at a time: </span>
                Each user can only belong to one active group. If someone is already in a group, they&apos;ll need to leave it before joining yours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Expenses ───────────────────────────────────────────────────── */}
      <section id="expenses" className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-3 text-center text-xs font-medium uppercase tracking-widest text-primary">Expense Module</div>
          <h2 className="mb-3 text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            Split expenses any way you like
          </h2>
          <p className="mx-auto mb-12 max-w-lg text-center text-sm text-muted-foreground">
            Add an expense in seconds. Choose how to split it — equally, by custom amount, or by percentage. Every member sees exactly what they owe.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">How to create an expense</div>
              {expenseSteps.map((s) => (
                <div key={s.step} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {s.step}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{s.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <PlusCircle className="h-4 w-4 text-primary" /> New Expense
              </div>
              <div className="space-y-3">
                <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                  <div className="text-xs text-muted-foreground">Title</div>
                  <div className="text-sm font-medium">Monthly Electricity Bill</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                    <div className="text-xs text-muted-foreground">Amount</div>
                    <div className="text-sm font-medium">₹2,400</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                    <div className="text-xs text-muted-foreground">Category</div>
                    <div className="text-sm font-medium">Utilities</div>
                  </div>
                </div>
                <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                  <div className="text-xs text-muted-foreground mb-1">Split method</div>
                  <div className="flex gap-2">
                    {["Equal", "% Share", "Custom"].map((m, i) => (
                      <span key={m} className={`rounded-md px-2 py-0.5 text-xs font-medium ${i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{m}</span>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                  <div className="text-xs text-muted-foreground mb-1.5">Participants (4 members — ₹600 each)</div>
                  <div className="flex gap-1.5">
                    {["R", "P", "A", "S"].map((l) => (
                      <div key={l} className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">{l}</div>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg bg-primary px-3 py-2 text-center text-xs font-semibold text-primary-foreground cursor-pointer">
                  Add Expense
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { icon: SplitSquareHorizontal, title: "Equal Split", desc: "Divide the total evenly among all participants." },
              { icon: Receipt, title: "Custom Amounts", desc: "Enter exactly how much each person should pay." },
              { icon: ClipboardList, title: "Percentage Split", desc: "Assign % shares — great for unequal incomes." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border bg-background p-4 shadow-xs">
                <Icon className="mb-2 h-5 w-5 text-primary" />
                <div className="text-sm font-semibold">{title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Settlements + Room History ──────────────────────────────────── */}
      <section className="border-t bg-muted/30 px-4 py-20">
        <div className="mx-auto max-w-5xl grid gap-12 md:grid-cols-2">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-600">
              <ArrowLeftRight className="h-3 w-3" /> Settlements
            </div>
            <h2 className="mb-4 text-xl font-semibold tracking-tight">Smart debt minimization</h2>
            <p className="mb-6 text-sm text-muted-foreground leading-relaxed">
              BalanceBuddy runs an optimization algorithm to reduce the number of transactions needed to settle all debts. Instead of everyone paying everyone, you get the fewest possible payments.
            </p>
            <ul className="space-y-2 text-sm">
              {[
                "Calculates the net balance of every member",
                "Generates the minimum number of payments",
                "One-tap mark-as-settled for each payment",
                "Full settlement history with timestamps",
                "Supports partial payments and tracking",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600">
              <History className="h-3 w-3" /> Room History
            </div>
            <h2 className="mb-4 text-xl font-semibold tracking-tight">Complete audit trail</h2>
            <p className="mb-6 text-sm text-muted-foreground leading-relaxed">
              Room History gives you a chronological view of everything that ever happened in your group — every expense added, edited, deleted, every chore completed, and every settlement made.
            </p>
            <ul className="space-y-2 text-sm">
              {[
                "Filter history by member, type, or date range",
                "See who added, edited, or deleted each entry",
                "Expense receipts viewable from history",
                "Chore completion logs with timestamps",
                "Exportable as a CSV for records",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Chores ─────────────────────────────────────────────────────── */}
      <section id="chores" className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-3 text-center text-xs font-medium uppercase tracking-widest text-primary">Chore Management</div>
          <h2 className="mb-3 text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            Assign chores, track completion
          </h2>
          <p className="mx-auto mb-12 max-w-lg text-center text-sm text-muted-foreground">
            Stop the &quot;whose turn is it?&quot; arguments. Create recurring chores, assign them to members, and get notified when they&apos;re done.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <CheckSquare className="h-4 w-4 text-rose-500" /> Assign Chore
              </div>
              <div className="space-y-3">
                <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                  <div className="text-xs text-muted-foreground">Chore name</div>
                  <div className="text-sm font-medium">Clean Common Area</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                    <div className="text-xs text-muted-foreground">Assigned to</div>
                    <div className="text-sm font-medium">Rahul S.</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                    <div className="text-xs text-muted-foreground">Due date</div>
                    <div className="text-sm font-medium">Every Sunday</div>
                  </div>
                </div>
                <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                  <div className="text-xs text-muted-foreground mb-1">Priority</div>
                  <div className="flex gap-2">
                    {["Low", "Medium", "High"].map((p, i) => (
                      <span key={p} className={`rounded-md px-2 py-0.5 text-xs font-medium ${i === 1 ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"}`}>{p}</span>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                  <div className="text-xs text-muted-foreground mb-1">Recurrence</div>
                  <div className="flex gap-2">
                    {["Once", "Weekly", "Monthly"].map((r, i) => (
                      <span key={r} className={`rounded-md px-2 py-0.5 text-xs font-medium ${i === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{r}</span>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg bg-rose-500 px-3 py-2 text-center text-xs font-semibold text-white cursor-pointer">
                  Assign Chore & Notify
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">How to create & assign a chore</div>
              {choreSteps.map((s) => (
                <div key={s.step} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
                    {s.step}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{s.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Activity + Reminders + Shopping ────────────────────────────── */}
      <section className="border-t bg-muted/30 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-3 text-center text-xs font-medium uppercase tracking-widest text-primary">More Modules</div>
          <h2 className="mb-12 text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            Stay on top of everything
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {/* Activity */}
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
                <Activity className="h-5 w-5 text-cyan-500" />
              </div>
              <h3 className="mb-2 text-sm font-semibold">Activity Log</h3>
              <p className="mb-4 text-xs text-muted-foreground leading-relaxed">
                A real-time feed of everything happening in your group — new expenses, chore updates, settlements, and member changes — all in one scrollable timeline.
              </p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {["Rahul added ₹1,200 for groceries", "Priya completed Kitchen chore", "Settlement of ₹3,400 recorded"].map((e) => (
                  <li key={e} className="flex items-start gap-1.5">
                    <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cyan-400" />
                    {e}
                  </li>
                ))}
              </ul>
            </div>
            {/* Reminders */}
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
                <CalendarClock className="h-5 w-5 text-orange-500" />
              </div>
              <h3 className="mb-2 text-sm font-semibold">Reminders</h3>
              <p className="mb-4 text-xs text-muted-foreground leading-relaxed">
                Set reminders for rent due dates, recurring utility bills, or any important group event. Get push notifications before the due date so nothing is missed.
              </p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {["Rent due on 1st of every month", "Electricity bill — due in 3 days", "Internet renewal next Friday"].map((e) => (
                  <li key={e} className="flex items-start gap-1.5">
                    <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-orange-400" />
                    {e}
                  </li>
                ))}
              </ul>
            </div>
            {/* Shopping */}
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-lime-500/10">
                <ShoppingCart className="h-5 w-5 text-lime-500" />
              </div>
              <h3 className="mb-2 text-sm font-semibold">Shopping List</h3>
              <p className="mb-4 text-xs text-muted-foreground leading-relaxed">
                Maintain a shared shopping list for your group. Add items, assign who&apos;ll buy them, mark them as purchased, and track monthly household essentials automatically.
              </p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {["Milk × 2 (Assigned: Priya)", "Dish soap (Pending)", "Rice 5kg — Monthly essential"].map((e) => (
                  <li key={e} className="flex items-start gap-1.5">
                    <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-lime-400" />
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Notifications + Profile */}
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/10">
                <Bell className="h-5 w-5 text-pink-500" />
              </div>
              <h3 className="mb-2 text-sm font-semibold">Notifications</h3>
              <p className="mb-4 text-xs text-muted-foreground leading-relaxed">
                Never miss a thing. BalanceBuddy sends real-time in-app and push notifications for new expenses, assigned chores, settlement requests, reminder due dates, and group invitations.
              </p>
              <div className="space-y-2">
                {[
                  { label: "New expense added", dot: "bg-pink-400" },
                  { label: "Chore assigned to you", dot: "bg-pink-400" },
                  { label: "Settlement request received", dot: "bg-pink-400" },
                  { label: "Reminder: Rent due tomorrow", dot: "bg-pink-400" },
                ].map((n) => (
                  <div key={n.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className={`h-1.5 w-1.5 rounded-full ${n.dot}`} />
                    {n.label}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10">
                <UserCircle className="h-5 w-5 text-teal-500" />
              </div>
              <h3 className="mb-2 text-sm font-semibold">Profile & Settings</h3>
              <p className="mb-4 text-xs text-muted-foreground leading-relaxed">
                Personalize your BalanceBuddy experience. Update your display name, avatar, email, and password. Manage notification preferences, connected devices, and privacy settings.
              </p>
              <div className="space-y-2">
                {[
                  "Update name, avatar and email",
                  "Change password securely",
                  "Manage notification preferences",
                  "Manage push notification devices",
                  "Light / Dark theme toggle",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ChevronRight className="h-3 w-3 shrink-0 text-teal-500" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Leave Group Flow ────────────────────────────────────────────── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-3 text-center text-xs font-medium uppercase tracking-widest text-primary">Group Rules</div>
          <h2 className="mb-3 text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            How leaving a group works
          </h2>
          <p className="mx-auto mb-12 max-w-lg text-center text-sm text-muted-foreground">
            BalanceBuddy has clear, fair rules to keep groups healthy and accounts clean when members transition.
          </p>
          <div className="grid gap-4 sm:grid-cols-3 mb-10">
            {leaveGroupRules.map(({ icon: Icon, color, bg, title, desc }) => (
              <div key={title} className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <h3 className="mb-2 text-sm font-semibold">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          {/* Step-by-step flow */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="mb-5 text-sm font-semibold">Step-by-step: How to leave a group</div>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              {[
                { step: "1", icon: ArrowLeftRight, title: "Settle all debts", desc: "Ensure your balance is ₹0 or settle pending amounts." },
                { step: "2", icon: Crown, title: "Transfer ownership", desc: "If you're admin, assign a new admin before leaving." },
                { step: "3", icon: LogOut, title: "Leave the group", desc: "Go to My Group → Three Dots at Top-Right Side → Leave Group and confirm.(Transfer ownership if you are Owner or Admin)" },
                { step: "4", icon: UserPlus, title: "Join a new group", desc: "Now you're free to create or join another group." },
              ].map(({ step, icon: Icon, title, desc }) => (
                <div key={step} className="relative flex flex-col items-center text-center p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground mb-3">
                    {step}
                  </div>
                  <Icon className="mb-2 h-4 w-4 text-muted-foreground" />
                  <div className="text-xs font-semibold mb-1">{title}</div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-900/40 dark:bg-amber-950/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div className="text-xs text-amber-800 dark:text-amber-300">
                <span className="font-semibold">Important: </span>
                You cannot join or create a new group while you are still an active member of an existing group. You must leave your current group first. This prevents split expenses from getting confused across multiple groups.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PWA Section ────────────────────────────────────────────────── */}
      <section id="pwa" className="border-t bg-muted/30 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-3 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
              <Wifi className="h-3.5 w-3.5" />
              Progressive Web App — Install like a native app
            </div>
          </div>
          <h2 className="mb-3 text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            Take BalanceBuddy everywhere
          </h2>
          <p className="mx-auto mb-4 max-w-xl text-center text-sm text-muted-foreground">
            BalanceBuddy is a fully installable PWA. Add it to your home screen or desktop and it works just like a native app — even offline.
          </p>
          <div className="mx-auto mb-12 flex flex-wrap justify-center gap-3">
            {[
              { icon: Wifi, text: "Works offline" },
              { icon: Bell, text: "Push notifications" },
              { icon: Download, text: "Installable" },
              { icon: Zap, text: "Fast & responsive" },
              { icon: Shield, text: "Secure HTTPS" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-xs">
                <Icon className="h-3.5 w-3.5 text-primary" /> {text}
              </div>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Android */}
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Smartphone className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Android</div>
                  <div className="text-xs text-muted-foreground">Chrome browser</div>
                </div>
              </div>
              <div className="space-y-3">
                {pwaStepsAndroid.map((s) => (
                  <div key={s.icon} className="flex items-start gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-600">{s.icon}</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* iOS */}
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                  <Smartphone className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-sm font-semibold">iPhone / iPad</div>
                  <div className="text-xs text-muted-foreground">Safari browser</div>
                </div>
              </div>
              <div className="space-y-3">
                {pwaStepsIOS.map((s) => (
                  <div key={s.icon} className="flex items-start gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-600">{s.icon}</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop */}
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                  <Monitor className="h-5 w-5 text-violet-500" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Desktop</div>
                  <div className="text-xs text-muted-foreground">Chrome or Edge</div>
                </div>
              </div>
              <div className="space-y-3">
                {pwaStepsDesktop.map((s) => (
                  <div key={s.icon} className="flex items-start gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-600">{s.icon}</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border bg-primary/5 px-6 py-5 text-center">
            <div className="mb-1 text-sm font-semibold">Already installed? You&apos;re set.</div>
            <p className="text-xs text-muted-foreground">
              Once installed, BalanceBuddy syncs in the background, delivers push notifications, and works even when your internet drops — just like a real app, no app store needed.
            </p>
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────── */}
      <section className="px-4 py-24 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 text-amber-400" /> Built for real shared living
          </div>
          <h2 className="mb-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready to stop stressing about shared expenses?
          </h2>
          <p className="mb-8 text-sm text-muted-foreground sm:text-base">
            Free to use. Create a group in under a minute, invite your flatmates, and let BalanceBuddy handle the rest.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
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

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t py-8 px-4">
        <div className="mx-auto max-w-5xl flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg bg-primary">
              <Image src="/images/balance.jpg" alt="BalanceBuddy" fill sizes="28px" className="object-contain" />
            </div>
            <span className="text-sm font-semibold">BalanceBuddy</span>
            <span className="text-xs text-muted-foreground ml-1">— Expense Management OS</span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
            <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-foreground transition-colors">Get Started</Link>
            <a href="#modules" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pwa" className="hover:text-foreground transition-colors">Install App</a>
          </div>
          <div className="text-xs text-muted-foreground">&copy; 2026 BalanceBuddy. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
