"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { joinFlat } from "@/actions/flats";

const schema = z.object({
  inviteCode: z
    .string()
    .min(1, "Invite code is required")
    .max(20)
    .toUpperCase(),
});

type FormValues = z.infer<typeof schema>;

export default function JoinFlatPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { inviteCode: "" },
  });

  async function onSubmit(values: FormValues) {
    if (!session?.user?.id) return;
    setIsLoading(true);
    try {
      const result = await joinFlat(session.user.id, {
        inviteCode: values.inviteCode,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Joined flat successfully!");
      router.push("/flats");
      router.refresh();
    } catch {
      toast.error("Failed to join flat.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Join a flat</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Enter invite code</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="inviteCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invite code *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. A1B2C3D4"
                        className="font-mono uppercase"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value.toUpperCase())
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Ask your flatmate for the invite code from their flat
                      settings.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Join flat
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
