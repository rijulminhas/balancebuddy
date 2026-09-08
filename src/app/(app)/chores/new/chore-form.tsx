"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createChore } from "@/actions/chores";

interface Member {
  id: string;
  name: string;
}

interface ChoreFormProps {
  groupId: string;
  members: Member[];
}

const schema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(500).optional(),
  assignedToId: z.string().optional(),
  frequency: z.enum(["once", "daily", "weekly", "biweekly", "monthly"]),
  dueDate: z.string().optional(),
  points: z.number().int().min(0).max(100),
  isRecurring: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export function ChoreForm({ groupId, members }: ChoreFormProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      frequency: "once",
      points: 0,
      isRecurring: false,
    },
  });

  const selectedFrequency = watch("frequency");
  const selectedAssignee = watch("assignedToId");

  async function onSubmit(data: FormData) {
    if (!session?.user?.id) return;

    const result = await createChore(session.user.id, {
      groupId,
      ...data,
      assignedToId: data.assignedToId || undefined,
      dueDate: data.dueDate
        ? new Date(data.dueDate).toISOString()
        : undefined,
    });

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Chore created!");
    router.push("/chores");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title" className="text-sm font-medium">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          {...register("title")}
          placeholder="e.g. Clean the kitchen"
          className="rounded-xl"
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description" className="text-sm font-medium">
          Description
        </Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Add details about this chore…"
          className="rounded-xl resize-none"
          rows={3}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Assign to */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Assign to</Label>
          <Select
            value={selectedAssignee ?? "unassigned"}
            onValueChange={(v) =>
              setValue("assignedToId", v === "unassigned" ? undefined : v)
            }
          >
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Frequency */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Frequency</Label>
          <Select
            value={selectedFrequency}
            onValueChange={(v) =>
              setValue(
                "frequency",
                v as "once" | "daily" | "weekly" | "biweekly" | "monthly"
              )
            }
          >
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[
                { value: "once", label: "One-time" },
                { value: "daily", label: "Daily" },
                { value: "weekly", label: "Weekly" },
                { value: "biweekly", label: "Every 2 weeks" },
                { value: "monthly", label: "Monthly" },
              ].map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Due date */}
        <div className="space-y-1.5">
          <Label htmlFor="dueDate" className="text-sm font-medium">
            Due date (optional)
          </Label>
          <Input
            id="dueDate"
            type="datetime-local"
            {...register("dueDate")}
            className="rounded-xl"
          />
        </div>

        {/* Points */}
        <div className="space-y-1.5">
          <Label htmlFor="points" className="text-sm font-medium">
            Points (0–100)
          </Label>
          <Input
            id="points"
            type="number"
            min={0}
            max={100}
            {...register("points", { valueAsNumber: true })}
            placeholder="0"
            className="rounded-xl"
          />
        </div>
      </div>

      {/* Recurring toggle */}
      <div className="flex items-center gap-3">
        <input
          id="isRecurring"
          type="checkbox"
          {...register("isRecurring")}
          className="h-4 w-4 rounded accent-primary"
        />
        <Label htmlFor="isRecurring" className="text-sm font-medium cursor-pointer">
          Recurring chore
        </Label>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit" className="rounded-xl" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Chore
        </Button>
      </div>
    </form>
  );
}
