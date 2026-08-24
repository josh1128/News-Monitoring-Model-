import type { NewsArticle } from "@/lib/types";

function themeClass(theme: string) {
  const map: Record<string, string> = {
    Economic: "bg-blue-100 text-blue-800",
    Fiscal: "bg-amber-100 text-amber-800",
    Monetary: "bg-emerald-100 text-emerald-800",
    Political: "bg-rose-100 text-rose-800",
  };
  return map[theme] ?? "bg-slate-100 text-slate-700";
}

export default function ArticleCard({ article }: { article: NewsArticle }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="font-semibold text-slate-700">{article.entity}</span>
        <span>•</span>
        <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
        <span>•</span>
        <span>{article.source}</span>
        <span className={`ml-auto rounded-full px-2 py-1 font-semibold ${
          article.relevanceBand === "High"
            ? "bg-red-100 text-red-700"
            : article.relevanceBand === "Medium"
            ? "bg-yellow-100 text-yellow-700"
            : "bg-slate-100 text-slate-700"
        }`}>
          {article.relevanceBand} {article.relevanceScore}
        </span>
      </div>

      <h2 className="text-lg font-semibold leading-snug text-slate-900">
        {article.title}
      </h2>

      {article.description && (
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {article.description.replace(/<[^>]*>/g, "")}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {article.themes.map((theme) => (
          <span key={theme} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${themeClass(theme)}`}>
            {theme}
          </span>
        ))}
      </div>

      <a
        href={article.url}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-block text-sm font-semibold text-blue-700 hover:underline"
      >
        Read original article →
      </a>
    </article>
  );
}
