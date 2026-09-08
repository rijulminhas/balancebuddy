"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, ArrowLeftRight } from "lucide-react";
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
import { switchGroup } from "@/actions/groups";

const schema = z.object({
  inviteCode: z.string().min(1, "Invite code is required").max(20).toUpperCase(),
});

type FormValues = z.infer<typeof schema>;

export function SwitchGroupForm() {
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
      const result = await switchGroup(session.user.id, { inviteCode: values.inviteCode });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Switched group successfully!");
      router.push("/groups");
      router.refresh();
    } catch {
      toast.error("Failed to switch group. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ArrowLeftRight className="h-4 w-4" />
          Switch to another group
        </CardTitle>
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
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the invite code of the group you want to switch to. You will automatically leave your current group.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Switch group
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
