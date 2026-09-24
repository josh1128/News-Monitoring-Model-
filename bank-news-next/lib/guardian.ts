/**
 * lib/guardian.ts — GUARDIAN API CLIENT (server-side only)
 * --------------------------------------------------------
 * Set GUARDIAN_API_KEY in Vercel Environment Variables (and .env.local
 * for local development). Never commit the literal API key to the repo.
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

function getGuardianApiKey(): string {
  const key = process.env.GUARDIAN_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "GUARDIAN_API_KEY is not configured. Add it in Vercel → Project Settings → Environment Variables, then redeploy."
    );
  }
  return key;
}

async function guardianRequest(url: string): Promise<Response> {
  // Do not cache authenticated API failures. This also ensures a newly updated
  // Vercel environment variable is used immediately after a redeploy.
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        "Guardian API authentication failed. Check GUARDIAN_API_KEY in Vercel and redeploy the Production deployment."
      );
    }
    throw new Error(`Guardian API ${res.status}${body ? `: ${body}` : ""}`);
  }

  return res;
}

/**
 * Lightweight auth check used before fan-out requests. This prevents one bad
 * key from producing the same warning once for every bank.
 */
export async function verifyGuardianConnection(): Promise<void> {
  const key = getGuardianApiKey();
  const params = new URLSearchParams({
    q: "bank",
    "page-size": "1",
    "api-key": key,
  });

  await guardianRequest(`${BASE}?${params.toString()}`);
}

export async function fetchGuardian(opts: {
  entity: string;
  region: string;
  terms: string[];
  from: string;
  to: string;
  pageSize?: number;
}): Promise<Article[]> {
  const key = getGuardianApiKey();
  const q = opts.terms.map((t) => `"${t}"`).join(" OR ");

  const params = new URLSearchParams({
    q,
    "from-date": opts.from,
    "to-date": opts.to,
    "page-size": String(opts.pageSize ?? 25),
    "order-by": "newest",
    "show-fields": "trailText,byline",
    "api-key": key,
  });

  const res = await guardianRequest(`${BASE}?${params.toString()}`);
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
