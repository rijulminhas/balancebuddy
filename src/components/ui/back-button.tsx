"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  href?: string;
  label?: string;
}

export function BackButton({ href, label }: BackButtonProps) {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
      onClick={() => (href ? router.push(href) : router.back())}
    >
      <ArrowLeft className="h-4 w-4" />
      {label && <span>{label}</span>}
    </Button>
  );
}
