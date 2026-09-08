"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Loader2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateProfile } from "@/actions/settings";
import { useState, useRef } from "react";

interface ProfileFormProps {
  defaultValues: {
    name: string;
    email: string;
    image: string;
  };
  userId: string;
}

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(255),
  image: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function ProfileForm({ defaultValues, userId }: ProfileFormProps) {
  const { update } = useSession();
  const [savedImage, setSavedImage] = useState(defaultValues.image);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues.name,
      image: defaultValues.image,
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be smaller than 2 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setValue("image", base64, { shouldDirty: true });
    };
    reader.readAsDataURL(file);
    // reset so the same file can be re-selected if needed
    e.target.value = "";
  }

  const watchedImage = watch("image");
  const watchedName = watch("name");

  async function onSubmit(data: FormData) {
    const result = await updateProfile({
      name: data.name,
      image: data.image || undefined,
    });

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    // Never put base64 in the session update — it bloats the JWT cookie past
    // HTTP header limits (431). Route uploaded images through the proxy URL instead.
    let sessionImage: string | null = null;
    if (data.image) {
      sessionImage = data.image.startsWith("data:")
        ? `/api/users/${userId}/avatar?t=${Date.now()}`
        : data.image;
    }

    await update({ name: data.name, image: sessionImage });
    setSavedImage(data.image ?? "");
    reset(data);
    toast.success("Profile updated successfully");
  }

  const avatarSrc = watchedImage || savedImage || undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Profile Information</CardTitle>
        <CardDescription>
          Update your display name and profile picture.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar + image upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="flex items-baseline gap-5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative shrink-0 group rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Upload profile picture"
            >
              <Avatar className="h-16 w-16 ring-2 ring-border">
                <AvatarImage src={avatarSrc} alt={watchedName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                  {getInitials(watchedName)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-muted border border-border pointer-events-none">
                <Camera className="h-3 w-3 text-muted-foreground" />
              </div>
            </button>
            <div className="">
              {/* <Label htmlFor="image" className="text-sm font-medium">
                Or paste an image URL
              </Label>
              <Input
                id="image"
                {...register("image")}
                placeholder="https://example.com/your-photo.jpg"
                className="rounded-xl"
              /> */}
              <p className="text-xs text-muted-foreground">
                Click the avatar to upload a JPG, PNG, or WebP (max 2 MB). Leave blank to use initials.
              </p>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-medium">
              Display Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Your full name"
              className="rounded-xl"
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Email (readonly) */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Email Address</Label>
            <Input
              value={defaultValues.email}
              readOnly
              className="rounded-xl bg-muted text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              Email address cannot be changed.
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              className="rounded-xl"
              disabled={isSubmitting || !isDirty}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
