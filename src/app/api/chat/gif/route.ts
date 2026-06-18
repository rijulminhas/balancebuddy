import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const GIPHY_BASE = "https://api.giphy.com/v1/gifs";

interface GiphyImage {
  url: string;
}

interface GiphyItem {
  id: string;
  title: string;
  images: {
    original: GiphyImage;
    fixed_height_small: GiphyImage;
  };
}

interface GiphyResponse {
  data: GiphyItem[];
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GIPHY_API_KEY;
  if (!apiKey) return NextResponse.json({ gifs: [] });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const endpoint = q
    ? `${GIPHY_BASE}/search?api_key=${apiKey}&q=${encodeURIComponent(q)}&limit=20&rating=g`
    : `${GIPHY_BASE}/trending?api_key=${apiKey}&limit=20&rating=g`;

  const res = await fetch(endpoint, { next: { revalidate: 60 } });
  if (!res.ok) return NextResponse.json({ gifs: [] });

  const data = (await res.json()) as GiphyResponse;
  const gifs = data.data.map((item) => ({
    id: item.id,
    url: item.images.original.url,
    previewUrl: item.images.fixed_height_small.url,
    title: item.title ?? "",
  }));

  return NextResponse.json({ gifs });
}
