"use client";
import { useState } from "react";
import type { EnrichedArticle } from "@/lib/types";

const bandColor: Record<string, string> = {
  High: "bg-emerald-100 text-emerald-800",
  Medium: "bg-amber-100 text-amber-800",
  Low: "bg-slate-100 text-slate-600",
};
const providerTag: Record<string, string> = {
  guardian: "bg-blue-50 text-blue-700",
  nyt: "bg-neutral-900 text-white",
  lseg: "bg-orange-100 text-orange-800",
};
const providerLabel: Record<string, string> = { guardian: "Guardian", nyt: "NYT", lseg: "Reuters/LSEG" };

export default function ArticleCard({ a }: { a: EnrichedArticle }) {
  const [story, setStory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadStory() {
    setLoading(true);
    try {
      const r = await fetch(`/api/story?storyId=${encodeURIComponent(a.storyId ?? "")}`);
      const j = await r.json();
      setStory(j.text || j.error || "No text available.");
    } catch (e: any) {
      setStory(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="rounded-lg border p-4 transition hover:shadow-sm">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${bandColor[a.band]}`}>
          {a.band} · {a.relevance}
        </span>
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${providerTag[a.provider]}`}>
          {providerLabel[a.provider]}
        </span>
        <span className="text-xs text-slate-500">
          {a.region} · <span className="font-medium text-slate-700">{a.entity}</span> ·{" "}
          {new Date(a.date).toLocaleDateString()} · {a.source}
        </span>
      </div>

      <h3 className="text-base font-medium leading-snug">
        {a.url ? (
          <a href={a.url} target="_blank" rel="noopener noreferrer"
             className="text-slate-900 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-900">
            {a.headline}
          </a>
        ) : a.headline}
      </h3>

      {a.summary && <p className="mt-1 text-sm text-slate-600">{a.summary}</p>}

      <div className="mt-2 flex flex-wrap gap-1">
        {a.themes.length ? a.themes.map((t) => (
          <span key={t} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{t}</span>
        )) : <span className="text-xs text-slate-400">Uncategorized</span>}
      </div>

      {a.matched.length > 0 && <p className="mt-1 text-xs text-slate-400">Matched: {a.matched.join(", ")}</p>}

      {/* LSEG has no public URL — read licensed text in-app */}
      {!a.url && a.storyId && (
        <div className="mt-2">
          <button onClick={loadStory} disabled={loading}
            className="rounded border px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-50">
            {loading ? "Loading…" : story ? "Reload article" : "Read full article"}
          </button>
          {story && (
            <p className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap rounded bg-slate-50 p-3 text-sm text-slate-700">
              {story}
            </p>
          )}
        </div>
      )}
    </article>
  );
}
