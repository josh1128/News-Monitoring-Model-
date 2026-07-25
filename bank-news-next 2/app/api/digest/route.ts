/**
 * app/api/digest/route.ts — DAILY DIGEST OUTPUT (no email)
 * --------------------------------------------------------
 * Produces the day's IMPORTANT news across banks + sovereigns as ready-to-read
 * text (plain + HTML). It does NOT send anything — you open the page, read it,
 * and copy it wherever you like. No Resend, no recipient list, no stored data.
 *
 * Endpoints:
 *   /api/digest              -> JSON { subject, text, html, items }
 *   /api/digest?format=text  -> plain text (nice for copy-paste)
 *   /api/digest?format=html  -> rendered HTML page
 *
 * Tunable via query params (or env defaults):
 *   min   = minimum relevance to include (default DIGEST_MIN_RELEVANCE or 45)
 *   days  = lookback window in days (default 1)
 *   band  = "high" to include ONLY High-relevance items
 */

import { NextResponse } from "next/server";
import { ALL_REGIONS } from "@/lib/banks";
import { collectNews } from "@/lib/collect";
import { buildDigestHtml } from "@/lib/digest-html";
import type { EnrichedArticle } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const format = sp.get("format") ?? "json";
  const provider = (process.env.DIGEST_PROVIDER as "guardian" | "nyt" | "both") || "guardian";
  // Default threshold raised to 45 so ONLY the important items show.
  const minRel = Number(sp.get("min") ?? process.env.DIGEST_MIN_RELEVANCE ?? 45);
  const highOnly = sp.get("band") === "high";
  const lookback = Number(sp.get("days") ?? process.env.DIGEST_LOOKBACK_DAYS ?? 1);

  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - lookback);
  const fromISO = from.toISOString().slice(0, 10);
  const toISO = today.toISOString().slice(0, 10);
  const dateLabel = today.toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });

  // Pull BOTH banks and sovereigns.
  const [banks, sovereigns] = await Promise.all([
    collectNews({ provider, mode: "banks", regions: ALL_REGIONS, entityFilter: [], from: fromISO, to: toISO, limit: 25 }),
    collectNews({ provider, mode: "sovereigns", regions: [], entityFilter: [], from: fromISO, to: toISO, limit: 25 }),
  ]);

  const all: EnrichedArticle[] = [...banks.articles, ...sovereigns.articles];

  // Keep only the IMPORTANT ones.
  let important = all.filter((a) => a.relevance >= minRel);
  if (highOnly) important = important.filter((a) => a.band === "High");
  important.sort((a, b) => b.relevance - a.relevance || +new Date(b.date) - +new Date(a.date));

  const { subject, html, text } = buildDigestHtml(important, { dateLabel, minRelevance: minRel });
  const warnings = [...banks.warnings, ...sovereigns.warnings];

  if (format === "text") {
    return new NextResponse(`${subject}\n\n${text}\n`, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  if (format === "html") {
    return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
  return NextResponse.json({
    subject,
    generatedAt: new Date().toISOString(),
    count: important.length,
    minRelevance: minRel,
    text,
    html,
    items: important.map((a) => ({
      entity: a.entity, region: a.region, band: a.band, relevance: a.relevance,
      headline: a.headline, date: a.date, source: a.source, url: a.url, themes: a.themes,
    })),
    warnings,
  });
}
