"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Theme, type EmojiClickData } from "emoji-picker-react";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

interface EmojiPickerButtonProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
}

export function EmojiPickerButton({
  onEmojiSelect,
  disabled,
}: EmojiPickerButtonProps) {
  const [open, setOpen] = useState(false);

  function handleClick(data: EmojiClickData) {
    onEmojiSelect(data.emoji);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          disabled={disabled}
          type="button"
        >
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-auto border-0 shadow-xl"
        align="start"
        side="top"
        sideOffset={8}
      >
        <EmojiPicker
          onEmojiClick={handleClick}
          theme={Theme.AUTO}
          width={320}
          height={400}
          searchPlaceholder="Search emoji…"
          lazyLoadEmojis
        />
      </PopoverContent>
    </Popover>
  );
}
