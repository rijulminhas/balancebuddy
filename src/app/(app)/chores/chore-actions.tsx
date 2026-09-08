"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, MoreHorizontal, Trash2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { updateChoreStatus, deleteChore } from "@/actions/chores";
import { useSession } from "next-auth/react";

interface ChoreActionsProps {
  choreId: string;
  status: string;
  createdById: string;
}

export function ChoreActions({ choreId, status, createdById }: ChoreActionsProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleStatus(newStatus: "in_progress" | "completed" | "pending") {
    if (!session?.user?.id) return;
    setLoading(newStatus);
    try {
      const result = await updateChoreStatus(session.user.id, choreId, newStatus);
      if (!result.success) toast.error(result.error);
      else
        toast.success(
          newStatus === "completed"
            ? "Chore marked as completed!"
            : newStatus === "in_progress"
            ? "Chore started!"
            : "Chore reset to pending."
        );
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete() {
    if (!session?.user?.id) return;
    setLoading("delete");
    try {
      const result = await deleteChore(session.user.id, choreId);
      if (!result.success) toast.error(result.error);
      else toast.success("Chore deleted.");
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(null);
    }
  }

  const isCreator = session?.user?.id === createdById;

  return (
    <div className="flex items-center gap-1.5">
      {status !== "completed" && status !== "skipped" && (
        <>
          {status === "pending" && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2.5 text-xs rounded-xl font-semibold"
              onClick={() => handleStatus("in_progress")}
              disabled={loading !== null}
            >
              {loading === "in_progress" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Play className="h-3 w-3 mr-1" />
              )}
              Start
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-xs rounded-xl font-semibold text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
            onClick={() => handleStatus("completed")}
            disabled={loading !== null}
          >
            {loading === "completed" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3 mr-1" />
            )}
            Complete
          </Button>
        </>
      )}

      {isCreator && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 rounded-xl"
              disabled={loading !== null}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl p-1">
            {status === "completed" && (
              <>
                <DropdownMenuItem
                  className="rounded-lg text-xs font-medium cursor-pointer"
                  onClick={() => handleStatus("pending")}
                >
                  Reset to pending
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  className="rounded-lg text-xs font-medium text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                  onSelect={(e) => e.preventDefault()}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Delete chore
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this chore?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleDelete}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
