/**
 * lib/lseg.ts — LSEG DATA PLATFORM (RDP) REST CLIENT  ⚠️ LICENSED CONTENT
 * ======================================================================
 * Reuters/LSEG news is LICENSED. Do NOT expose it on a public page — that is a
 * redistribution breach. This provider is therefore OFF by default: it only
 * activates when BOTH machine credentials AND `LSEG_ENABLED=true` are set, and
 * you should only enable it on a private/authenticated deployment.
 *
 * The Python `lseg.data` library can't run serverless, so we call RDP directly:
 *   Auth      POST https://api.refinitiv.com/auth/oauth2/v1/token   (scope trapi)
 *   Headlines GET  https://api.refinitiv.com/data/news/v1/headlines?query=...
 *   Story     GET  https://api.refinitiv.com/data/news/v1/stories/{storyId}
 *
 * Requires MACHINE credentials (App Key + Machine ID + password), not a desktop
 * Workspace login. Env:
 *   LSEG_ENABLED = "true"      (explicit opt-in; anything else disables it)
 *   LSEG_CLIENT_ID             (App Key)
 *   LSEG_USERNAME              (Machine ID)
 *   LSEG_PASSWORD
 *
 * Response shapes vary by entitlement — the parser is defensive; verify on the
 * first live run and adjust the field paths if headlines come back empty.
 */

import type { Article } from "./types";

const BASE = "https://api.refinitiv.com";
let cachedToken: { token: string; expires: number } | null = null;

export function lsegEnabled(): boolean {
  return (
    process.env.LSEG_ENABLED === "true" &&
    Boolean(process.env.LSEG_CLIENT_ID && process.env.LSEG_USERNAME && process.env.LSEG_PASSWORD)
  );
}

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expires) return cachedToken.token;
  const body = new URLSearchParams({
    grant_type: "password",
    username: process.env.LSEG_USERNAME!,
    password: process.env.LSEG_PASSWORD!,
    client_id: process.env.LSEG_CLIENT_ID!,
    scope: "trapi",
    takeExclusiveSignOnControl: "true",
  });
  const res = await fetch(`${BASE}/auth/oauth2/v1/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`LSEG auth failed (${res.status}). Check machine credentials.`);
  const json = (await res.json()) as { access_token: string; expires_in?: string | number };
  const ttl = Number(json.expires_in ?? 300);
  cachedToken = { token: json.access_token, expires: Date.now() + (ttl - 30) * 1000 };
  return cachedToken.token;
}

function pick(obj: any, paths: string[][]): string {
  for (const path of paths) {
    let cur = obj;
    for (const k of path) cur = cur?.[k];
    if (typeof cur === "string" && cur.trim()) return cur;
  }
  return "";
}

export async function fetchLseg(opts: {
  entity: string;
  region: string;
  ric: string | null;
  terms: string[];
  from: string;
  to: string;
  pageSize?: number;
}): Promise<Article[]> {
  const token = await getToken();
  const parts: string[] = [];
  if (opts.ric) parts.push(`R:${opts.ric}`);
  if (opts.terms.length) parts.push(opts.terms.map((t) => `"${t}"`).join(" OR "));
  const query = `(${parts.join(" OR ")}) AND Language:LEN`;

  const url =
    `${BASE}/data/news/v1/headlines?query=${encodeURIComponent(query)}` +
    `&limit=${opts.pageSize ?? 25}&dateFrom=${opts.from}&dateTo=${opts.to}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 900 },
  });
  if (!res.ok) throw new Error(`LSEG headlines ${res.status}: ${(await res.text().catch(() => "")).slice(0, 160)}`);

  const json: any = await res.json();
  const rows: any[] = json?.data ?? json?.headlines ?? json?.results ?? [];

  return rows.map((r, i) => {
    const headline =
      pick(r, [["newsItem", "itemMeta", "title", "0", "$"], ["headline"], ["title"], ["text"]]) || "(untitled)";
    const date =
      pick(r, [["newsItem", "itemMeta", "versionCreated", "$"], ["versionCreated"], ["firstCreated"]]) ||
      new Date().toISOString();
    const storyId = pick(r, [["storyId"], ["newsItem", "_guid"], ["id"]]) || `lseg-${i}`;
    const source = pick(r, [["sourceCode"], ["newsItem", "contentMeta", "infoSource", "0", "_qcode"]]) || "Reuters/LSEG";
    return {
      id: storyId,
      entity: opts.entity,
      region: opts.region,
      headline,
      summary: "",
      date,
      source,
      url: "",                 // licensed: no public URL (read text in-app)
      storyId,
      provider: "lseg" as const,
    };
  });
}

export async function fetchLsegStory(storyId: string): Promise<string> {
  const token = await getToken();
  const res = await fetch(`${BASE}/data/news/v1/stories/${encodeURIComponent(storyId)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`LSEG story ${res.status}`);
  const json: any = await res.json();
  const body =
    json?.newsItem?.contentSet?.inlineData?.[0]?.$ ?? json?.story?.body ?? json?.body ?? "";
  return String(body).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
