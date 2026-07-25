/**
 * lib/digest-html.ts — build the daily digest email (HTML + plain text)
 * ---------------------------------------------------------------------
 * Groups articles by region, most relevant first. Inline styles only
 * (email clients don't support <style> reliably).
 */

import type { EnrichedArticle } from "./types";

const bandColor: Record<string, string> = {
  High: "#137333",
  Medium: "#b06000",
  Low: "#5f6368",
};

export function buildDigestHtml(
  articles: EnrichedArticle[],
  opts: { dateLabel: string; minRelevance: number }
): { subject: string; html: string; text: string } {
  const subject = `Credit News Digest — ${opts.dateLabel} (${articles.length} item${articles.length === 1 ? "" : "s"})`;

  // Group by region, preserve relevance sort within each group.
  const byRegion = new Map<string, EnrichedArticle[]>();
  for (const a of articles) {
    if (!byRegion.has(a.region)) byRegion.set(a.region, []);
    byRegion.get(a.region)!.push(a);
  }

  const sections = Array.from(byRegion.entries())
    .map(([region, items]) => {
      const rows = items
        .map((a) => {
          const date = new Date(a.date).toLocaleDateString("en-CA");
          const themes = a.themes.length ? a.themes.join(", ") : "Uncategorized";
          return `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #eee;">
              <div style="font-size:11px;color:${bandColor[a.band]};font-weight:600;">
                ${a.band} · ${a.relevance} &nbsp;·&nbsp; ${a.entity} &nbsp;·&nbsp; ${date} &nbsp;·&nbsp; ${a.source}
              </div>
              <a href="${a.url}" style="font-size:15px;color:#1a1a1a;text-decoration:none;font-weight:500;">
                ${escapeHtml(a.headline)}
              </a>
              ${a.summary ? `<div style="font-size:13px;color:#555;margin-top:2px;">${escapeHtml(a.summary)}</div>` : ""}
              <div style="font-size:11px;color:#888;margin-top:2px;">${themes}</div>
            </td>
          </tr>`;
        })
        .join("");
      return `
      <h2 style="font-size:16px;margin:24px 0 4px;border-bottom:2px solid #1a1a1a;padding-bottom:4px;">
        ${region} <span style="color:#888;font-weight:400;">(${items.length})</span>
      </h2>
      <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>`;
    })
    .join("");

  const body = articles.length
    ? sections
    : `<p style="color:#666;">No material developments met the relevance threshold today.</p>`;

  const html = `
  <div style="max-width:680px;margin:0 auto;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;">
    <h1 style="font-size:20px;margin:0 0 2px;">Credit News Digest</h1>
    <div style="font-size:13px;color:#888;margin-bottom:8px;">
      ${opts.dateLabel} · relevance ≥ ${opts.minRelevance} · grouped by region
    </div>
    ${body}
    <p style="font-size:11px;color:#aaa;margin-top:28px;border-top:1px solid #eee;padding-top:10px;">
      Data provided by The Guardian and The New York Times. Themes are keyword-derived and
      relevance is heuristic — a triage aid, not a credit assessment. Review before use.
    </p>
  </div>`;

  const text = articles.length
    ? Array.from(byRegion.entries())
        .map(([region, items]) =>
          `${region.toUpperCase()}\n` +
          items.map((a) => `- [${a.band} ${a.relevance}] ${a.entity} — ${a.headline} (${a.source})\n  ${a.url}`).join("\n")
        )
        .join("\n\n")
    : "No material developments met the relevance threshold today.";

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}
