/**
 * app/api/news/route.ts — NEWS SEARCH API ROUTE (server side)
 * ------------------------------------------------------------
 * Runs on the server so API keys never reach the browser.
 *
 * Query params:
 *   provider = guardian | nyt | both
 *   mode     = banks | sovereigns
 *   regions  = comma-separated region names
 *   banks    = comma-separated entity names (empty = all in selected regions)
 *   from,to  = YYYY-MM-DD
 *   limit    = max articles per request (default 25)
 */

import { NextResponse } from "next/server";
import { BANKS_BY_REGION, SOVEREIGNS, ALL_REGIONS } from "@/lib/banks";
import { classify, scoreRelevance, band } from "@/lib/themes";
import { fetchGuardian } from "@/lib/guardian";
import { fetchNyt, type NytTarget } from "@/lib/nyt";
import type { Article, EnrichedArticle } from "@/lib/types";

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
  const provider = ["guardian", "nyt", "both"].includes(providerParam)
    ? (providerParam as "guardian" | "nyt" | "both")
    : "guardian";
  const mode = sp.get("mode") === "sovereigns" ? "sovereigns" : "banks";
  const from = isoDate(sp.get("from"), 7);
  const to = isoDate(sp.get("to"), 0);
  const limit = Math.min(Number(sp.get("limit") ?? 25) || 25, 50);

  const regions = (sp.get("regions") || ALL_REGIONS.join(",")).split(",").filter(Boolean);
  const entityFilter = (sp.get("banks") || "").split(",").filter(Boolean);

  // ---- Build the target list -------------------------------------------
  type Target = { entity: string; region: string; terms: string[] };
  let targets: Target[] = [];

  if (mode === "sovereigns") {
    targets = Object.entries(SOVEREIGNS)
      .filter(([c]) => entityFilter.length === 0 || entityFilter.includes(c))
      .map(([country, terms]) => ({ entity: country, region: "Sovereign", terms }));
  } else {
    for (const region of regions) {
      for (const b of BANKS_BY_REGION[region] ?? []) {
        if (entityFilter.length && !entityFilter.includes(b.name)) continue;
        targets.push({ entity: b.name, region, terms: [b.name, ...(b.terms ?? [])] });
      }
    }
  }

  if (!targets.length) {
    return NextResponse.json({ articles: [], warnings: ["Nothing selected."] });
  }

  const warnings: string[] = [];
  const raw: Article[] = [];

  // ---- Guardian: one request per entity (generous limits) --------------
  if (provider === "guardian" || provider === "both") {
    const settled = await Promise.allSettled(
      targets.map((t) =>
        fetchGuardian({
          entity: t.entity,
          region: t.region,
          terms: t.terms,
          from,
          to,
          pageSize: limit,
        })
      )
    );
    settled.forEach((r, i) => {
      if (r.status === "fulfilled") raw.push(...r.value);
      else
        warnings.push(
          `Guardian · ${targets[i].entity}: ${String((r as PromiseRejectedResult).reason?.message ?? (r as PromiseRejectedResult).reason)}`
        );
    });
  }

  // ---- NYT: batched + throttled (5 req/min, 500/day) -------------------
  if (provider === "nyt" || provider === "both") {
    try {
      const nytTargets: NytTarget[] = targets.map((t) => ({
        entity: t.entity,
        region: t.region,
        terms: t.terms,
      }));
      const { articles, warnings: w } = await fetchNyt({
        targets: nytTargets,
        from,
        to,
        pageSize: limit,
      });
      raw.push(...articles);
      warnings.push(...w);
    } catch (e: any) {
      warnings.push(`NYT: ${String(e?.message ?? e)}`);
    }
  }

  // ---- DEDUPLICATE by id, then by (entity + headline) ------------------
  const seen = new Set<string>();
  const deduped = raw.filter((a) => {
    const k1 = `${a.provider}:${a.id}`;
    const k2 = `${a.entity}|${a.headline}`.toLowerCase();
    if (seen.has(k1) || seen.has(k2)) return false;
    seen.add(k1);
    seen.add(k2);
    return true;
  });

  // ---- CLASSIFY + SCORE -------------------------------------------------
  const enriched: EnrichedArticle[] = deduped
    .map((a) => {
      const text = `${a.headline} ${a.summary}`;
      const { themes, matched } = classify(text);
      const relevance = scoreRelevance(text, themes, matched);
      return { ...a, themes, matched, relevance, band: band(relevance) };
    })
    .sort((a, b) => b.relevance - a.relevance || +new Date(b.date) - +new Date(a.date));

  return NextResponse.json({
    articles: enriched,
    warnings,
    meta: { provider, mode, from, to, targets: targets.length, total: enriched.length },
  });
}
