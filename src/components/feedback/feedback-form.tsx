"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Star, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitFeedback } from "@/actions/feedback";
import { cn } from "@/lib/utils";

const FEEDBACK_TYPES = [
  "feedback",
  "feature_request",
  "bug_report",
  "general_suggestion",
] as const;

const schema = z.object({
  type: z.enum(FEEDBACK_TYPES, { error: "Please select any type" }),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(255, "Title must be under 255 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be under 5000 characters"),
});

type FormValues = z.infer<typeof schema>;

const feedbackTypes = [
  { value: "feedback", label: "Feedback" },
  { value: "feature_request", label: "Feature Request" },
  { value: "bug_report", label: "Bug Report" },
  { value: "general_suggestion", label: "General Suggestion" },
] as const;

export function FeedbackForm() {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: "" as any,
      rating: null,
      title: "",
      description: "",
    },
  });

  const selectedRating = form.watch("rating");
  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: FormValues) {
    const result = await submitFeedback(values);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Thank you! Your feedback has been submitted.");
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Type */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type <span className="text-destructive">*</span></FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select feedback type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {feedbackTypes.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Rating */}
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rating <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
              <FormControl>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const filled = (hoveredStar ?? selectedRating ?? 0) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(null)}
                        onClick={() => field.onChange(selectedRating === star ? null : star)}
                        className="p-0.5 transition-transform hover:scale-110 focus:outline-none"
                        aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
                      >
                        <Star
                          className={cn(
                            "h-7 w-7 transition-colors",
                            filled
                              ? "fill-amber-400 text-amber-400"
                              : "fill-transparent text-muted-foreground/40"
                          )}
                        />
                      </button>
                    );
                  })}
                  {selectedRating && (
                    <span className="ml-2 text-sm text-muted-foreground">{selectedRating} / 5</span>
                  )}
                </div>
              </FormControl>
              <FormDescription>Click a star to rate. Click again to deselect.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Input placeholder="Short summary of your feedback" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your feedback in detail..."
                  rows={5}
                  {...field}
                />
              </FormControl>
              <FormDescription>{field.value.length} / 5000 characters</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Submit Feedback
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
