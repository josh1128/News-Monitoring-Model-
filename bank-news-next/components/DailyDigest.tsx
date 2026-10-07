"use client";

import { useMemo } from "react";
import type { EnrichedArticle } from "@/lib/types";

function ageInDays(date: string) {
  const published = new Date(date).getTime();
  if (!Number.isFinite(published)) return 7;
  return Math.max(0, (Date.now() - published) / 86_400_000);
}

function priorityScore(article: EnrichedArticle) {
  const age = ageInDays(article.date);
  const recencyBonus = age <= 1 ? 15 : age <= 3 ? 10 : age <= 5 ? 5 : 0;
  return article.relevance + recencyBonus;
}

function pickDigest(articles: EnrichedArticle[], maxItems = 8) {
  const lastWeek = articles
    .filter((a) => ageInDays(a.date) <= 7.5)
    .filter((a) => a.relevance >= 30)
    .sort(
      (a, b) =>
        priorityScore(b) - priorityScore(a) ||
        +new Date(b.date) - +new Date(a.date)
    );

  const pool = lastWeek.length ? lastWeek : articles
    .filter((a) => ageInDays(a.date) <= 7.5)
    .sort(
      (a, b) =>
        priorityScore(b) - priorityScore(a) ||
        +new Date(b.date) - +new Date(a.date)
    );

  const selected: EnrichedArticle[] = [];
  const entityCounts = new Map<string, number>();

  for (const article of pool) {
    if ((entityCounts.get(article.entity) ?? 0) >= 2) continue;
    selected.push(article);
    entityCounts.set(article.entity, (entityCounts.get(article.entity) ?? 0) + 1);
    if (selected.length >= maxItems) break;
  }

  return selected;
}

function conciseSummary(article: EnrichedArticle) {
  const raw = article.summary?.trim();
  if (!raw) {
    return article.themes.length
      ? `Relevant to ${article.themes.slice(0, 2).join(" and ")}.`
      : "Flagged as relevant to the monitored institution or sovereign.";
  }

  const firstSentence = raw.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() ?? raw;
  return firstSentence.length > 220 ? `${firstSentence.slice(0, 217)}…` : firstSentence;
}

export default function DailyDigest({ articles }: { articles: EnrichedArticle[] }) {
  const digest = useMemo(() => pickDigest(articles), [articles]);

  const signals = useMemo(() => {
    const themeCounts = new Map<string, number>();
    const entities = new Set<string>();
    let highPriority = 0;

    digest.forEach((article) => {
      entities.add(article.entity);
      if (article.band === "High") highPriority += 1;
      article.themes.forEach((theme) =>
        themeCounts.set(theme, (themeCounts.get(theme) ?? 0) + 1)
      );
    });

    const topThemes = Array.from(themeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([theme]) => theme);

    return { highPriority, entities: entities.size, topThemes };
  }, [digest]);

  if (!digest.length) return null;

  const generated = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <section className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
      <div className="border-b bg-slate-900 px-5 py-4 text-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
              Executive Brief
            </p>
            <h2 className="mt-1 text-xl font-semibold">Daily Digest · Last 7 Days</h2>
            <p className="mt-1 text-sm text-slate-300">
              Highest-priority developments, weighted by relevance and recency.
            </p>
          </div>
          <div className="text-right text-xs text-slate-300">
            Updated {generated}
          </div>
        </div>
      </div>

      <div className="grid gap-px border-b bg-slate-200 sm:grid-cols-3">
        <div className="bg-slate-50 px-5 py-3">
          <div className="text-xs uppercase tracking-wide text-slate-500">High priority</div>
          <div className="mt-1 text-xl font-semibold text-slate-900">{signals.highPriority}</div>
        </div>
        <div className="bg-slate-50 px-5 py-3">
          <div className="text-xs uppercase tracking-wide text-slate-500">Entities covered</div>
          <div className="mt-1 text-xl font-semibold text-slate-900">{signals.entities}</div>
        </div>
        <div className="bg-slate-50 px-5 py-3">
          <div className="text-xs uppercase tracking-wide text-slate-500">Key themes</div>
          <div className="mt-1 truncate text-sm font-semibold text-slate-900">
            {signals.topThemes.join(" · ") || "—"}
          </div>
        </div>
      </div>

      <div className="divide-y">
        {digest.map((article, index) => (
          <article key={article.id} className="px-5 py-4">
            <div className="flex gap-4">
              <div className="pt-0.5 text-sm font-semibold tabular-nums text-slate-400">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span
                    className={
                      article.band === "High"
                        ? "rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800"
                        : "rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800"
                    }
                  >
                    {article.band} · {article.relevance}
                  </span>
                  <span className="font-medium text-slate-700">{article.entity}</span>
                  <span>·</span>
                  <span>{new Date(article.date).toLocaleDateString()}</span>
                  <span>·</span>
                  <span>{article.provider === "nyt" ? "NYT" : "Guardian"}</span>
                </div>

                <h3 className="font-semibold leading-snug text-slate-900">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {article.headline}
                  </a>
                </h3>

                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  {conciseSummary(article)}
                </p>

                {article.themes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {article.themes.slice(0, 3).map((theme) => (
                      <span
                        key={theme}
                        className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="bg-slate-50 px-5 py-3 text-xs text-slate-500">
        Digest selection is automated: relevance score + recency bonus, with a maximum of two stories per entity to improve coverage diversity.
      </div>
    </section>
  );
}
