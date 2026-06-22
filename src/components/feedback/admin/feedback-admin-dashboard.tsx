"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Star,
  Search,
  Trash2,
  CheckCircle2,
  Globe,
  GlobeLock,
  Archive,
  Filter,
  Loader2,
  MessageSquare,
  Lightbulb,
  Bug,
  Megaphone,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateFeedbackStatus, deleteFeedback } from "@/actions/feedback";
import { cn } from "@/lib/utils";
import type { Feedback } from "@/db/schema/feedback";

interface SerializedFeedback extends Omit<Feedback, "createdAt" | "updatedAt"> {
  createdAt: string;
  updatedAt: string;
}

interface Analytics {
  total: number;
  featureRequests: number;
  bugReports: number;
  avgRating: number;
  published: number;
  pending: number;
}

interface Props {
  items: SerializedFeedback[];
  analytics: Analytics;
}

const TYPE_LABELS: Record<string, string> = {
  feedback: "Feedback",
  feature_request: "Feature Request",
  bug_report: "Bug Report",
  general_suggestion: "General Suggestion",
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  feedback: MessageSquare,
  feature_request: Lightbulb,
  bug_report: Bug,
  general_suggestion: Megaphone,
};

const TYPE_COLORS: Record<string, string> = {
  feedback: "bg-violet-500/10 text-violet-600 border-violet-200",
  feature_request: "bg-blue-500/10 text-blue-600 border-blue-200",
  bug_report: "bg-red-500/10 text-red-600 border-red-200",
  general_suggestion: "bg-teal-500/10 text-teal-600 border-teal-200",
};

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-sky-500/10 text-sky-600 border-sky-200",
  REVIEWED: "bg-amber-500/10 text-amber-600 border-amber-200",
  PUBLISHED: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  ARCHIVED: "bg-muted text-muted-foreground border-border",
};

function StarDisplay({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            "h-3.5 w-3.5",
            s <= rating ? "fill-amber-400 text-amber-400" : "fill-transparent text-muted-foreground/30"
          )}
        />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{rating}/5</span>
    </div>
  );
}

function AnalyticsCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="text-2xl font-bold">{value}</div>
        <div className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</div>
        {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}

export function FeedbackAdminDashboard({ items, analytics }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return items.filter((f) => {
      if (filterType !== "all" && f.type !== filterType) return false;
      if (filterStatus !== "all" && f.status !== filterStatus) return false;
      if (filterRating !== "all") {
        if (!f.rating || f.rating !== parseInt(filterRating)) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return (
          f.title.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.userName.toLowerCase().includes(q) ||
          f.userEmail.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, filterType, filterStatus, filterRating, search]);

  async function handleAction(id: string, action: "review" | "publish" | "unpublish" | "archive") {
    setActionLoading(id + action);
    const result = await updateFeedbackStatus(id, action);
    setActionLoading(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    const labels = { review: "Marked as Reviewed", publish: "Published", unpublish: "Unpublished", archive: "Archived" };
    toast.success(labels[action]);
    startTransition(() => router.refresh());
  }

  async function handleDelete(id: string) {
    setActionLoading(id + "delete");
    const result = await deleteFeedback(id);
    setActionLoading(null);
    setDeleteTarget(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Feedback deleted");
    startTransition(() => router.refresh());
  }

  const isLoading = (id: string, action: string) => actionLoading === id + action;

  return (
    <div className="space-y-6">
      {/* Analytics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <AnalyticsCard label="Total Submissions" value={analytics.total} />
        <AnalyticsCard label="Feature Requests" value={analytics.featureRequests} />
        <AnalyticsCard label="Bug Reports" value={analytics.bugReports} />
        <AnalyticsCard
          label="Average Rating"
          value={analytics.avgRating > 0 ? `${analytics.avgRating.toFixed(1)} ★` : "—"}
        />
        <AnalyticsCard label="Published" value={analytics.published} sub="on testimonials" />
        <AnalyticsCard label="Pending Review" value={analytics.pending} sub="status: NEW" />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Filter className="h-4 w-4" /> Filters &amp; Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title, description, or user…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="feedback">Feedback</SelectItem>
                <SelectItem value="feature_request">Feature Request</SelectItem>
                <SelectItem value="bug_report">Bug Report</SelectItem>
                <SelectItem value="general_suggestion">General Suggestion</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="REVIEWED">Reviewed</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterRating} onValueChange={setFilterRating}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="All ratings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {filtered.length !== items.length && (
            <p className="mt-2 text-xs text-muted-foreground">
              Showing {filtered.length} of {items.length} submissions
            </p>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border bg-muted/20 text-center">
          <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No feedback found</p>
          <p className="mt-1 text-xs text-muted-foreground">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const TypeIcon = TYPE_ICONS[item.type] ?? MessageSquare;
            return (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-start gap-4 p-4">
                    {/* Type icon */}
                    <div className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border", TYPE_COLORS[item.type])}>
                      <TypeIcon className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm">{item.title}</span>
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", TYPE_COLORS[item.type])}>
                          {TYPE_LABELS[item.type]}
                        </Badge>
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", STATUS_COLORS[item.status])}>
                          {item.status}
                        </Badge>
                        {item.isPublished && item.status !== "PUBLISHED" && (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-[10px] px-1.5 py-0">
                            Published
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <span className="text-xs text-muted-foreground">
                          {item.userName} · {item.userEmail}
                        </span>
                        <StarDisplay rating={item.rating} />
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        {item.allowPublicDisplay && (
                          <span className="text-xs text-emerald-600">✓ Public display allowed</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          {(isPending && actionLoading?.startsWith(item.id)) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {item.status !== "REVIEWED" && item.status !== "PUBLISHED" && (
                          <DropdownMenuItem
                            onClick={() => handleAction(item.id, "review")}
                            disabled={!!actionLoading}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4 text-amber-500" />
                            Mark as Reviewed
                          </DropdownMenuItem>
                        )}
                        {!item.isPublished && item.allowPublicDisplay && (
                          <DropdownMenuItem
                            onClick={() => handleAction(item.id, "publish")}
                            disabled={!!actionLoading}
                          >
                            <Globe className="mr-2 h-4 w-4 text-emerald-500" />
                            Publish
                          </DropdownMenuItem>
                        )}
                        {item.isPublished && (
                          <DropdownMenuItem
                            onClick={() => handleAction(item.id, "unpublish")}
                            disabled={!!actionLoading}
                          >
                            <GlobeLock className="mr-2 h-4 w-4 text-muted-foreground" />
                            Unpublish
                          </DropdownMenuItem>
                        )}
                        {item.status !== "ARCHIVED" && (
                          <DropdownMenuItem
                            onClick={() => handleAction(item.id, "archive")}
                            disabled={!!actionLoading}
                          >
                            <Archive className="mr-2 h-4 w-4 text-muted-foreground" />
                            Archive
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteTarget(item.id)}
                          disabled={!!actionLoading}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Feedback</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this feedback entry. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading(deleteTarget ?? "", "delete") ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
