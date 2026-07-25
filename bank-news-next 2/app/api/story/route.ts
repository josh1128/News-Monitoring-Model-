/**
 * app/api/story/route.ts — full LSEG story text (licensed; in-app display only).
 * Guardian/NYT articles have real URLs and don't use this.
 */
import { NextResponse } from "next/server";
import { fetchLsegStory, lsegEnabled } from "@/lib/lseg";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const storyId = new URL(req.url).searchParams.get("storyId");
  if (!storyId) return NextResponse.json({ error: "storyId required" }, { status: 400 });
  if (!lsegEnabled()) return NextResponse.json({ error: "LSEG not enabled" }, { status: 400 });
  try {
    return NextResponse.json({ text: await fetchLsegStory(storyId) });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
