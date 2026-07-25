"use client";

/**
 * app/page.tsx — DASHBOARD LAYOUT
 * Filters (sidebar) + summary cards + charts + article cards.
 */

import { useEffect, useMemo, useState } from "react";
import { BANKS_BY_REGION, ALL_REGIONS, SOVEREIGNS } from "@/lib/banks";
import { ALL_THEMES } from "@/lib/themes";
import type { EnrichedArticle } from "@/lib/types";
import Charts from "@/components/Charts";
import ArticleCard from "@/components/ArticleCard";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export default function Page() {
  const [provider, setProvider] = useState<"guardian" | "nyt" | "both">("guardian");
  const [mode, setMode] = useState<"banks" | "sovereigns">("banks");
  const [from, setFrom] = useState(daysAgo(7));
  const [to, setTo] = useState(daysAgo(0));
  const [regions, setRegions] = useState<string[]>(ALL_REGIONS);
  const [selected, setSelected] = useState<string[]>([]);
  const [themeFilter, setThemeFilter] = useState<string[]>([]);
  const [minRel, setMinRel] = useState(0);

  const [data, setData] = useState<EnrichedArticle[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entityOptions = useMemo(
    () =>
      mode === "sovereigns"
        ? Object.keys(SOVEREIGNS)
        : regions.flatMap((r) => (BANKS_BY_REGION[r] ?? []).map((b) => b.name)),
    [mode, regions]
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const p = new URLSearchParams({
        provider, mode, from, to,
        regions: regions.join(","),
        banks: selected.join(","),
        limit: "25",
      });
      const res = await fetch(`/api/news?${p}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
      setData(json.articles ?? []);
      setWarnings(json.warnings ?? []);
    } catch (e: any) {
      setError(String(e?.message ?? e));
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const filtered = useMemo(
    () =>
      data
        .filter((a) => a.relevance >= minRel)
        .filter((a) => themeFilter.length === 0 || a.themes.some((t) => themeFilter.includes(t))),
    [data, minRel, themeFilter]
  );

  // Summary stats
  const stats = useMemo(() => {
    const themeCount: Record<string, number> = {};
    filtered.forEach((a) => a.themes.forEach((t) => (themeCount[t] = (themeCount[t] ?? 0) + 1)));
    const regionCount: Record<string, number> = {};
    filtered.forEach((a) => (regionCount[a.region] = (regionCount[a.region] ?? 0) + 1));
    const top = (o: Record<string, number>) =>
      Object.entries(o).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    return {
      total: filtered.length,
      entities: new Set(filtered.map((a) => a.entity)).size,
      topTheme: top(themeCount),
      topRegion: top(regionCount),
    };
  }, [filtered]);

  const toggle = (arr: string[], v: string, set: (x: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Bank &amp; Sovereign News Monitor</h1>
              <p className="text-sm text-slate-500">
                Credit-themed news monitoring across global banks and sovereigns.
              </p>
            </div>
            <div className="flex gap-2">
              <a href="/api/digest?format=html" target="_blank" rel="noopener noreferrer"
                className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
                📄 Today&apos;s digest
              </a>
              <a href="/api/digest?format=text" target="_blank" rel="noopener noreferrer"
                className="rounded-md border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Copy-ready text
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl gap-6 px-6 py-6 lg:flex">
        {/* ---------------- Sidebar filters ---------------- */}
        <aside className="mb-6 w-full shrink-0 lg:mb-0 lg:w-72">
          <div className="space-y-5 rounded-xl border bg-white p-5 shadow-sm">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Source</label>
              <select value={provider} onChange={(e) => setProvider(e.target.value as any)}
                className="w-full rounded-md border px-2 py-1.5 text-sm">
                <option value="guardian">The Guardian</option>
                <option value="nyt">The New York Times</option>
                <option value="both">Both sources</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">View</label>
              <select value={mode} onChange={(e) => { setMode(e.target.value as any); setSelected([]); }}
                className="w-full rounded-md border px-2 py-1.5 text-sm">
                <option value="banks">Banks</option>
                <option value="sovereigns">Sovereigns</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">From</label>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                  className="w-full rounded-md border px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">To</label>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                  className="w-full rounded-md border px-2 py-1.5 text-sm" />
              </div>
            </div>

            {mode === "banks" && (
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Region</label>
                <div className="space-y-1">
                  {ALL_REGIONS.map((r) => (
                    <label key={r} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={regions.includes(r)}
                        onChange={() => toggle(regions, r, setRegions)} />
                      {r}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                {mode === "banks" ? "Bank" : "Country"}{" "}
                <span className="font-normal normal-case text-slate-400">(none = all)</span>
              </label>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded border p-2">
                {entityOptions.map((b) => (
                  <label key={b} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={selected.includes(b)}
                      onChange={() => toggle(selected, b, setSelected)} />
                    {b}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                Theme <span className="font-normal normal-case text-slate-400">(none = all)</span>
              </label>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded border p-2">
                {ALL_THEMES.map((t) => (
                  <label key={t} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={themeFilter.includes(t)}
                      onChange={() => toggle(themeFilter, t, setThemeFilter)} />
                    {t}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                Min relevance: {minRel}
              </label>
              <input type="range" min={0} max={100} step={5} value={minRel}
                onChange={(e) => setMinRel(Number(e.target.value))} className="w-full" />
            </div>

            <button onClick={load} disabled={loading}
              className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">
              {loading ? "Loading…" : "Refresh news"}
            </button>
          </div>
        </aside>

        {/* ---------------- Main ---------------- */}
        <main className="min-w-0 flex-1 space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}
          {warnings.length > 0 && (
            <details className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <summary className="cursor-pointer font-medium">
                {warnings.length} source warning(s)
              </summary>
              <ul className="mt-2 list-disc pl-5">
                {warnings.slice(0, 8).map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </details>
          )}

          {/* Summary cards */}
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              ["Total articles", stats.total],
              [mode === "banks" ? "Banks with news" : "Countries with news", stats.entities],
              ["Most common theme", stats.topTheme],
              ["Top region", stats.topRegion],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
                <div className="mt-1 truncate text-xl font-semibold">{value}</div>
              </div>
            ))}
          </section>

          {loading && (
            <div className="rounded-xl border bg-white p-10 text-center text-slate-500 shadow-sm">
              Fetching and classifying news…
            </div>
          )}

          {!loading && filtered.length === 0 && !error && (
            <div className="rounded-xl border bg-white p-10 text-center text-slate-500 shadow-sm">
              No articles match the current filters. Widen the date range, lower the minimum
              relevance, or clear the theme filter.
            </div>
          )}

          {filtered.length > 0 && (
            <>
              <Charts articles={filtered} />

              <section className="rounded-xl border bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-lg font-semibold">Top relevant headlines</h2>
                <div className="space-y-3">
                  {filtered.slice(0, 30).map((a) => <ArticleCard key={a.id} a={a} />)}
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      <footer className="border-t bg-white py-6 text-center text-xs text-slate-400">
        Data provided by The Guardian and The New York Times. Themes are
        keyword-derived and relevance is heuristic — review before use.
      </footer>
    </div>
  );
}
