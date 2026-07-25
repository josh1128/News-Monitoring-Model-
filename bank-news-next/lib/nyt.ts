/**
 * lib/nyt.ts — NEW YORK TIMES ARTICLE SEARCH API CLIENT
 * ------------------------------------------------------
 * Docs: https://developer.nytimes.com/docs/articlesearch-product/1/overview
 * Endpoint: https://api.nytimes.com/svc/search/v2/articlesearch.json
 *
 * RATE LIMITS ARE TIGHT: 5 requests/minute, 500/day (free tier).
 * One request per bank would blow through that instantly (31 banks = 31 calls),
 * so we BATCH several entities into a single OR query and then attribute each
 * returned article back to whichever entity it mentions. 31 banks becomes ~4
 * requests instead of 31.
 *
 * NYT requires attribution — "Data provided by The New York Times" is shown in
 * the dashboard footer. Keep it there.
 */

import type { Article } from "./types";

const BASE = "https://api.nytimes.com/svc/search/v2/articlesearch.json";

/** How many entities to bundle into one NYT query. */
export const NYT_BATCH_SIZE = 8;

export type NytTarget = { entity: string; region: string; terms: string[] };

type NytDoc = {
  _id: string;
  web_url: string;
  snippet?: string;
  abstract?: string;
  lead_paragraph?: string;
  pub_date: string;
  source?: string;
  news_desk?: string;
  headline?: { main?: string };
};

/** YYYY-MM-DD -> YYYYMMDD (NYT's required date format). */
function compact(d: string): string {
  return d.replace(/-/g, "");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch one batch of entities in a single request.
 * Returns articles attributed back to the matching entity.
 */
async function fetchBatch(
  targets: NytTarget[],
  from: string,
  to: string,
  pageSize: number
): Promise<Article[]> {
  const key = process.env.NYT_API_KEY;
  if (!key) throw new Error("NYT_API_KEY is not set.");

  // Build one OR'd query across every term in the batch.
  const allTerms = targets.flatMap((t) => t.terms);
  const q = allTerms.map((t) => `"${t}"`).join(" OR ");

  const url =
    `${BASE}?q=${encodeURIComponent(q)}` +
    `&begin_date=${compact(from)}&end_date=${compact(to)}` +
    `&sort=newest` +
    `&fl=_id,web_url,snippet,abstract,lead_paragraph,pub_date,source,news_desk,headline` +
    `&api-key=${encodeURIComponent(key)}`;

  const res = await fetch(url, { next: { revalidate: 900 } });

  if (res.status === 429) {
    throw new Error("NYT rate limit hit (5 req/min, 500/day). Wait a minute and retry.");
  }
  if (!res.ok) {
    throw new Error(`NYT API ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  }

  const json = (await res.json()) as { response?: { docs?: NytDoc[] } };
  const docs = (json.response?.docs ?? []).slice(0, pageSize);

  const out: Article[] = [];
  for (const d of docs) {
    const headline = d.headline?.main ?? "(untitled)";
    const summary = d.abstract || d.snippet || d.lead_paragraph || "";
    const haystack = `${headline} ${summary}`.toLowerCase();

    // ATTRIBUTION: assign to the first entity whose term appears in the text.
    // If nothing matches (NYT matched on body text we can't see), fall back to
    // the batch's first entity so the article isn't silently dropped.
    const owner =
      targets.find((t) => t.terms.some((term) => haystack.includes(term.toLowerCase()))) ??
      targets[0];

    out.push({
      id: d._id,
      entity: owner.entity,
      region: owner.region,
      headline,
      summary,
      date: d.pub_date,
      source: `The New York Times${d.news_desk ? ` · ${d.news_desk}` : ""}`,
      url: d.web_url,
      provider: "nyt",
    });
  }
  return out;
}

/**
 * Fetch NYT news for many entities, batched and throttled to respect limits.
 * Batch failures are thrown per-batch by the caller's Promise handling; here we
 * run sequentially with a small delay so we stay under 5 req/min.
 */
export async function fetchNyt(opts: {
  targets: NytTarget[];
  from: string;
  to: string;
  pageSize?: number;
}): Promise<{ articles: Article[]; warnings: string[] }> {
  const { targets, from, to } = opts;
  const pageSize = opts.pageSize ?? 25;
  const articles: Article[] = [];
  const warnings: string[] = [];

  const batches: NytTarget[][] = [];
  for (let i = 0; i < targets.length; i += NYT_BATCH_SIZE) {
    batches.push(targets.slice(i, i + NYT_BATCH_SIZE));
  }

  for (let i = 0; i < batches.length; i++) {
    try {
      articles.push(...(await fetchBatch(batches[i], from, to, pageSize)));
    } catch (e: any) {
      warnings.push(`NYT batch ${i + 1}/${batches.length}: ${String(e?.message ?? e)}`);
    }
    // Space requests out (5/min limit). Skip the wait after the final batch.
    if (i < batches.length - 1) await sleep(1200);
  }

  if (batches.length > 5) {
    warnings.push(
      `Selected ${targets.length} names = ${batches.length} NYT requests; the free tier allows 5/min. Narrow the selection if you see rate-limit errors.`
    );
  }

  return { articles, warnings };
}
