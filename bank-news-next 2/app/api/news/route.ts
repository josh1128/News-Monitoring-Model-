/**
 * app/api/news/route.ts — dashboard news endpoint (thin wrapper over collectNews)
 */
import { NextResponse } from "next/server";
import { ALL_REGIONS } from "@/lib/banks";
import { collectNews } from "@/lib/collect";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isoDate(d: string | null, fallbackDays: number): string {
  if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const dt = new Date();
  dt.setDate(dt.getDate() - fallbackDays);
  return dt.toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const providerParam = sp.get("provider") ?? "guardian";
  const provider = (["guardian", "nyt", "both", "lseg"].includes(providerParam) ? providerParam : "guardian") as
    "guardian" | "nyt" | "both" | "lseg";
  const mode = sp.get("mode") === "sovereigns" ? "sovereigns" : "banks";
  const from = isoDate(sp.get("from"), 7);
  const to = isoDate(sp.get("to"), 0);
  const limit = Math.min(Number(sp.get("limit") ?? 25) || 25, 50);
  const regions = (sp.get("regions") || ALL_REGIONS.join(",")).split(",").filter(Boolean);
  const entityFilter = (sp.get("banks") || "").split(",").filter(Boolean);

  const { articles, warnings } = await collectNews({ provider, mode, regions, entityFilter, from, to, limit });

  return NextResponse.json({
    articles,
    warnings,
    meta: { provider, mode, from, to, total: articles.length },
  });
}
