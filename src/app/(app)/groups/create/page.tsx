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
import { Textarea } from "@/components/ui/textarea";
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
import { createGroup } from "@/actions/groups";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(255),
  description: z.string().max(500).optional(),
  address: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CreateGroupPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", address: "" },
  });

  async function onSubmit(values: FormValues) {
    if (!session?.user?.id) return;
    setIsLoading(true);
    try {
      const result = await createGroup(session.user.id, values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Group created!");
      router.push("/groups");
      router.refresh();
    } catch {
      toast.error("Failed to create group.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Create a group</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Group details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Green Valley Group" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="A short description of your group..."
                        className="resize-none"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123, MG Road, Bengaluru"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional — helps members find the place.
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
                  Create group
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
