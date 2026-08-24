import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const base = new URL(request.url);
  const mode = base.searchParams.get("mode") ?? "sovereigns";
  const days = Number(base.searchParams.get("days") ?? 1);
  const min = base.searchParams.get("min") ?? "45";

  const to = new Date();
  const from = new Date(Date.now() - days * 86400000);

  const url = new URL("/api/news", base.origin);
  url.searchParams.set("mode", mode);
  url.searchParams.set("from", from.toISOString().slice(0, 10));
  url.searchParams.set("to", to.toISOString().slice(0, 10));
  url.searchParams.set("min", min);

  const response = await fetch(url, { cache: "no-store" });
  const payload = await response.json();

  const text = (payload.items ?? []).map((item: any) =>
    [
      `${item.entity} — ${item.title}`,
      `Themes: ${item.themes.join(", ")}`,
      `Relevance: ${item.relevanceBand} (${item.relevanceScore})`,
      `${item.source} | ${new Date(item.publishedAt).toLocaleDateString("en-CA")}`,
      item.url
    ].join("\n")
  ).join("\n\n") || "No articles met the selected relevance threshold.";

  return NextResponse.json({
    subject: `${mode === "sovereigns" ? "Sovereign" : "Bank"} News Digest`,
    text,
    items: payload.items ?? [],
    warnings: payload.warnings ?? []
  });
}
