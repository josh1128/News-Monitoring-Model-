"use client";

import { useMemo, useState } from "react";
import ArticleCard from "@/components/ArticleCard";
import { ALL_BANKS, SOVEREIGNS } from "@/lib/banks";
import type { MonitoringMode, NewsArticle, SovereignTheme } from "@/lib/types";

function dateOffset(days: number) {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}

const sovereignThemes: SovereignTheme[] = ["Economic", "Fiscal", "Monetary", "Political"];

export default function Home() {
  const [mode, setMode] = useState<MonitoringMode>("sovereigns");
  const [from, setFrom] = useState(dateOffset(14));
  const [to, setTo] = useState(dateOffset(0));
  const [provider, setProvider] = useState("both");
  const [minRelevance, setMinRelevance] = useState(30);
  const [selectedEntities, setSelectedEntities] = useState<string[]>([
    "Canada", "United States", "Japan", "United Kingdom"
  ]);
  const [activeThemes, setActiveThemes] = useState<string[]>([...sovereignThemes]);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const universe = mode === "banks" ? ALL_BANKS : SOVEREIGNS;

  const filteredArticles = useMemo(() => {
    if (mode !== "sovereigns") return articles;
    return articles.filter((a) => a.themes.some((t) => activeThemes.includes(t)));
  }, [articles, activeThemes, mode]);

  function switchMode(next: MonitoringMode) {
    setMode(next);
    setArticles([]);
    setWarnings([]);
    if (next === "sovereigns") {
      setSelectedEntities(["Canada", "United States", "Japan", "United Kingdom"]);
      setActiveThemes([...sovereignThemes]);
    } else {
      setSelectedEntities(["RBC", "TD", "BMO", "JPMorgan"]);
      setActiveThemes([]);
    }
  }

  function toggleEntity(name: string) {
    setSelectedEntities((current) =>
      current.includes(name) ? current.filter((x) => x !== name) : [...current, name]
    );
  }

  function toggleTheme(theme: string) {
    setActiveThemes((current) =>
      current.includes(theme) ? current.filter((x) => x !== theme) : [...current, theme]
    );
  }

  async function runSearch() {
    if (!selectedEntities.length) return;
    setLoading(true);
    setWarnings([]);

    const params = new URLSearchParams({
      mode,
      entities: selectedEntities.join(","),
      from,
      to,
      provider,
      min: String(minRelevance),
    });

    try {
      const response = await fetch(`/api/news?${params.toString()}`);
      const payload = await response.json();
      setArticles(payload.items ?? []);
      setWarnings(payload.warnings ?? []);
    } catch (error) {
      setWarnings([error instanceof Error ? error.message : "Unable to load news."]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl p-6 md:p-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          CRAO News Monitoring
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          Bank & Sovereign News Monitor
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Sovereign mode only returns news tied to Economic, Fiscal,
          Monetary or Political factors. No AI is used.
        </p>
      </div>

      <section className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Monitor</label>
          <select value={mode} onChange={(e) => switchMode(e.target.value as MonitoringMode)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2">
            <option value="sovereigns">Sovereigns</option>
            <option value="banks">Financial Institutions</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Source</label>
          <select value={provider} onChange={(e) => setProvider(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2">
            <option value="both">Guardian + NYT</option>
            <option value="guardian">Guardian</option>
            <option value="nyt">New York Times</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
            Minimum relevance: {minRelevance}
          </label>
          <input type="range" min="0" max="100" step="5" value={minRelevance}
            onChange={(e) => setMinRelevance(Number(e.target.value))} className="w-full" />
        </div>

        <div className="flex items-end md:col-span-2">
          <button onClick={runSearch} disabled={loading || !selectedEntities.length}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 font-semibold text-white disabled:opacity-50">
            {loading ? "Searching…" : "Search relevant news"}
          </button>
        </div>
      </section>

      {mode === "sovereigns" && (
        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">CRAO Sovereign Factors</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {sovereignThemes.map((theme) => {
              const selected = activeThemes.includes(theme);
              return (
                <button key={theme} onClick={() => toggleTheme(theme)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
                    selected ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-700"
                  }`}>
                  {theme}
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              {mode === "sovereigns" ? "Countries" : "Financial Institutions"}
            </h2>
            <p className="text-sm text-slate-500">{selectedEntities.length} selected</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setSelectedEntities(universe.map((x) => x.name))}
              className="text-sm font-semibold text-blue-700">Select all</button>
            <button onClick={() => setSelectedEntities([])}
              className="text-sm font-semibold text-slate-500">Clear</button>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {universe.map((entity) => (
            <label key={entity.name}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-2.5 text-sm">
              <input type="checkbox" checked={selectedEntities.includes(entity.name)}
                onChange={() => toggleEntity(entity.name)} />
              <span>{entity.name}</span>
            </label>
          ))}
        </div>
      </section>

      {warnings.length > 0 && (
        <section className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="font-semibold text-amber-900">Source warnings</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-amber-800">
            {warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        </section>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Results</h2>
        <span className="text-sm text-slate-500">{filteredArticles.length} articles</span>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        {filteredArticles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </section>

      {!loading && filteredArticles.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No results yet. Select institutions/countries and run a search.
        </div>
      )}

      <footer className="mt-10 border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500">
        Theme classification and relevance scoring are heuristic triage tools.
        Review articles before using them in a credit assessment.
      </footer>
    </main>
  );
}
