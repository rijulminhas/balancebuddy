"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface GifItem {
  id: string;
  url: string;
  previewUrl: string;
  title: string;
}

interface GifPickerButtonProps {
  onGifSelect: (url: string) => void;
  disabled?: boolean;
}

export function GifPickerButton({ onGifSelect, disabled }: GifPickerButtonProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<GifItem[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchGifs = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/gif?q=${encodeURIComponent(q)}`);
      if (!res.ok) return;
      const data = (await res.json()) as { gifs: GifItem[] };
      setGifs(data.gifs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchGifs("");
  }, [open, fetchGifs]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (open) fetchGifs(query);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query, open, fetchGifs]);

  function handleSelect(url: string) {
    onGifSelect(url);
    setOpen(false);
    setQuery("");
    setGifs([]);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 shrink-0 text-[11px] font-bold tracking-wide"
          disabled={disabled}
          type="button"
        >
          GIF
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-2"
        align="start"
        side="top"
        sideOffset={8}
      >
        <Input
          placeholder="Search GIFs…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mb-2 h-8 text-sm"
          autoFocus
        />
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : gifs.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            {query ? "No GIFs found" : "Enter a keyword to search"}
          </p>
        ) : (
          <div className="grid max-h-60 grid-cols-2 gap-1 overflow-y-auto">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                type="button"
                onClick={() => handleSelect(gif.url)}
                className="overflow-hidden rounded transition-opacity hover:opacity-75"
              >
                <img
                  src={gif.previewUrl}
                  alt={gif.title}
                  className="h-20 w-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          Powered by GIPHY
        </p>
      </PopoverContent>
    </Popover>
  );
}
