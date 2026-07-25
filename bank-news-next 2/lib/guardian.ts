/**
 * lib/guardian.ts — GUARDIAN API CLIENT (public-safe source)
 * ----------------------------------------------------------
 * The Guardian's Open Platform API is free and permits production use.
 * Get a key at https://open-platform.theguardian.com/access/
 * Set GUARDIAN_API_KEY in .env.local (the literal key "test" also works for
 * light development use).
 *
 * Docs: https://open-platform.theguardian.com/documentation/
 */

import type { Article } from "./types";

const BASE = "https://content.guardianapis.com/search";

type GuardianResult = {
  id: string;
  webTitle: string;
  webUrl: string;
  webPublicationDate: string;
  sectionName?: string;
  fields?: { trailText?: string; byline?: string };
};

export async function fetchGuardian(opts: {
  entity: string;          // display label (bank / country)
  region: string;
  terms: string[];         // search terms, OR'd
  from: string;            // YYYY-MM-DD
  to: string;              // YYYY-MM-DD
  pageSize?: number;
}): Promise<Article[]> {
  const key = process.env.GUARDIAN_API_KEY || "test";
  // Guardian query syntax: quoted phrases OR'd together.
  const q = opts.terms.map((t) => `"${t}"`).join(" OR ");

  const url =
    `${BASE}?q=${encodeURIComponent(q)}` +
    `&from-date=${opts.from}&to-date=${opts.to}` +
    `&page-size=${opts.pageSize ?? 25}` +
    `&order-by=newest&show-fields=trailText,byline` +
    `&api-key=${encodeURIComponent(key)}`;

  const res = await fetch(url, { next: { revalidate: 900 } });
  if (!res.ok) {
    throw new Error(`Guardian API ${res.status}: ${await res.text().catch(() => "")}`);
  }
  const json = (await res.json()) as { response?: { results?: GuardianResult[] } };
  const results = json.response?.results ?? [];

  return results.map((r) => ({
    id: r.id,
    entity: opts.entity,
    region: opts.region,
    headline: r.webTitle,
    summary: r.fields?.trailText?.replace(/<[^>]*>/g, "") ?? "",
    date: r.webPublicationDate,
    source: `The Guardian${r.sectionName ? ` · ${r.sectionName}` : ""}`,
    url: r.webUrl,
    provider: "guardian" as const,
  }));
}
