import { NextRequest, NextResponse } from "next/server";
import { ALL_BANKS, SOVEREIGNS } from "@/lib/banks";
import { searchGuardian } from "@/lib/guardian";
import { searchNYT } from "@/lib/nyt";
import { calculateBankRelevance, classifyBankThemes, relevanceBand } from "@/lib/themes";
import { calculateSovereignRelevance, classifySovereignThemes } from "@/lib/sovereignThemes";
import type { MonitoringMode, NewsArticle } from "@/lib/types";

function articleText(title: string, description: string) {
  return `${title} ${description}`.trim();
}

function matchesEntity(text: string, terms: string[]): boolean {
  const lower = text.toLowerCase();
  return terms.some((term) => lower.includes(term.toLowerCase()));
}

function sovereignTerms(name: string) {
  const s = SOVEREIGNS.find((x) => x.name === name);
  return s
    ? [...s.terms, ...(s.institutions ?? []), ...(s.currencyTerms ?? []), ...(s.debtTerms ?? [])]
    : [];
}

function guardianSovereignQuery(entityTerms: string[]) {
  const entities = entityTerms.slice(0, 8).map((x) => `"${x}"`).join(" OR ");
  const topics = [
    "GDP", "inflation", "unemployment", "housing", "trade", "tariff",
    "budget", "deficit", "debt", "borrowing", "central bank",
    "interest rates", "currency", "FX reserves", "election",
    "government", "sanctions", "geopolitical"
  ].map((x) => `"${x}"`).join(" OR ");
  return `(${entities}) AND (${topics})`;
}

function dedupe(items: NewsArticle[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.url || item.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const mode = (p.get("mode") ?? "sovereigns") as MonitoringMode;
  const entities = (p.get("entities") ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  const from = p.get("from") ?? new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
  const to = p.get("to") ?? new Date().toISOString().slice(0, 10);
  const provider = p.get("provider") ?? "both";
  const minRelevance = Number(p.get("min") ?? 30);

  const universe = mode === "banks" ? ALL_BANKS : SOVEREIGNS;
  const selected = entities.length
    ? universe.filter((e) => entities.includes(e.name))
    : universe.slice(0, mode === "banks" ? 10 : 8);

  const articles: NewsArticle[] = [];
  const warnings: string[] = [];

  for (const entity of selected) {
    const entityTerms = mode === "sovereigns" ? sovereignTerms(entity.name) : entity.terms;

    if (provider === "guardian" || provider === "both") {
      try {
        const q = mode === "sovereigns"
          ? guardianSovereignQuery(entityTerms)
          : entity.terms.map((t) => `"${t}"`).join(" OR ");

        const results = await searchGuardian(q, from, to, 40);

        for (const item of results) {
          const title = item.webTitle ?? "";
          const description = item.fields?.trailText ?? "";
          const text = articleText(title, description);

          if (!matchesEntity(text, entity.terms)) continue;

          if (mode === "sovereigns") {
            const themes = classifySovereignThemes(text);

            // Main change: a sovereign article must match at least one
            // CRAO factor or it is discarded server-side.
            if (themes.length === 0) continue;

            const score = calculateSovereignRelevance(text, themes);
            if (score < minRelevance) continue;

            articles.push({
              id: `guardian-${item.id}`,
              mode,
              entity: entity.name,
              title,
              description,
              url: item.webUrl,
              source: "The Guardian",
              provider: "guardian",
              publishedAt: item.webPublicationDate,
              themes,
              relevanceScore: score,
              relevanceBand: relevanceBand(score),
            });
          } else {
            const themes = classifyBankThemes(text);
            if (themes.length === 0) continue;
            const score = calculateBankRelevance(text, themes);
            if (score < minRelevance) continue;

            articles.push({
              id: `guardian-${item.id}`,
              mode,
              entity: entity.name,
              title,
              description,
              url: item.webUrl,
              source: "The Guardian",
              provider: "guardian",
              publishedAt: item.webPublicationDate,
              themes,
              relevanceScore: score,
              relevanceBand: relevanceBand(score),
            });
          }
        }
      } catch (error) {
        warnings.push(`Guardian failed for ${entity.name}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    if (provider === "nyt" || provider === "both") {
      try {
        const results = await searchNYT(
          mode === "sovereigns" ? entityTerms.slice(0, 5) : entity.terms.slice(0, 4),
          from,
          to
        );

        for (const item of results) {
          const title = item.headline?.main ?? "";
          const description = item.abstract ?? item.lead_paragraph ?? "";
          const text = articleText(title, description);

          if (!matchesEntity(text, entity.terms)) continue;

          if (mode === "sovereigns") {
            const themes = classifySovereignThemes(text);
            if (themes.length === 0) continue;
            const score = calculateSovereignRelevance(text, themes);
            if (score < minRelevance) continue;

            articles.push({
              id: `nyt-${item._id}`,
              mode,
              entity: entity.name,
              title,
              description,
              url: item.web_url,
              source: item.source ?? "The New York Times",
              provider: "nyt",
              publishedAt: item.pub_date,
              themes,
              relevanceScore: score,
              relevanceBand: relevanceBand(score),
            });
          } else {
            const themes = classifyBankThemes(text);
            if (themes.length === 0) continue;
            const score = calculateBankRelevance(text, themes);
            if (score < minRelevance) continue;

            articles.push({
              id: `nyt-${item._id}`,
              mode,
              entity: entity.name,
              title,
              description,
              url: item.web_url,
              source: item.source ?? "The New York Times",
              provider: "nyt",
              publishedAt: item.pub_date,
              themes,
              relevanceScore: score,
              relevanceBand: relevanceBand(score),
            });
          }
        }
      } catch (error) {
        warnings.push(`NYT failed for ${entity.name}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
  }

  const items = dedupe(articles).sort((a, b) =>
    b.relevanceScore - a.relevanceScore ||
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return NextResponse.json({ mode, from, to, count: items.length, items, warnings });
}
