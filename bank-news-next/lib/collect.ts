/**
 * lib/collect.ts — shared news collection (used by /api/news AND the digest)
 * -------------------------------------------------------------------------
 * Builds the target list, fetches from the chosen provider(s), dedupes,
 * classifies, and scores. Kept in one place so the dashboard and the scheduled
 * digest always behave identically.
 */

import { BANKS_BY_REGION, SOVEREIGNS, ALL_REGIONS } from "./banks";
import { classify, scoreRelevance, band } from "./themes";
import { fetchGuardian } from "./guardian";
import { fetchNyt, type NytTarget } from "./nyt";
import type { Article, EnrichedArticle } from "./types";

export type CollectParams = {
  provider: "guardian" | "nyt" | "both";
  mode: "banks" | "sovereigns";
  regions: string[];
  entityFilter: string[];   // empty = all
  from: string;             // YYYY-MM-DD
  to: string;               // YYYY-MM-DD
  limit: number;
};

export type CollectResult = {
  articles: EnrichedArticle[];
  warnings: string[];
};

export async function collectNews(p: CollectParams): Promise<CollectResult> {
  type Target = { entity: string; region: string; terms: string[] };
  let targets: Target[] = [];

  if (p.mode === "sovereigns") {
    targets = Object.entries(SOVEREIGNS)
      .filter(([c]) => p.entityFilter.length === 0 || p.entityFilter.includes(c))
      .map(([country, terms]) => ({ entity: country, region: "Sovereign", terms }));
  } else {
    const regions = p.regions.length ? p.regions : ALL_REGIONS;
    for (const region of regions) {
      for (const b of BANKS_BY_REGION[region] ?? []) {
        if (p.entityFilter.length && !p.entityFilter.includes(b.name)) continue;
        targets.push({ entity: b.name, region, terms: [b.name, ...(b.terms ?? [])] });
      }
    }
  }

  if (!targets.length) return { articles: [], warnings: ["Nothing selected."] };

  const warnings: string[] = [];
  const raw: Article[] = [];

  if (p.provider === "guardian" || p.provider === "both") {
    const settled = await Promise.allSettled(
      targets.map((t) =>
        fetchGuardian({ entity: t.entity, region: t.region, terms: t.terms, from: p.from, to: p.to, pageSize: p.limit })
      )
    );
    settled.forEach((r, i) => {
      if (r.status === "fulfilled") raw.push(...r.value);
      else warnings.push(`Guardian · ${targets[i].entity}: ${String((r as PromiseRejectedResult).reason?.message ?? "")}`);
    });
  }

  if (p.provider === "nyt" || p.provider === "both") {
    try {
      const nytTargets: NytTarget[] = targets.map((t) => ({ entity: t.entity, region: t.region, terms: t.terms }));
      const { articles, warnings: w } = await fetchNyt({ targets: nytTargets, from: p.from, to: p.to, pageSize: p.limit });
      raw.push(...articles);
      warnings.push(...w);
    } catch (e: any) {
      warnings.push(`NYT: ${String(e?.message ?? e)}`);
    }
  }

  // Dedupe by provider:id, then entity+headline
  const seen = new Set<string>();
  const deduped = raw.filter((a) => {
    const k1 = `${a.provider}:${a.id}`;
    const k2 = `${a.entity}|${a.headline}`.toLowerCase();
    if (seen.has(k1) || seen.has(k2)) return false;
    seen.add(k1);
    seen.add(k2);
    return true;
  });

  const articles: EnrichedArticle[] = deduped
    .map((a) => {
      const text = `${a.headline} ${a.summary}`;
      const { themes, matched } = classify(text);
      const relevance = scoreRelevance(text, themes, matched);
      return { ...a, themes, matched, relevance, band: band(relevance) };
    })
    .sort((a, b) => b.relevance - a.relevance || +new Date(b.date) - +new Date(a.date));

  return { articles, warnings };
}
