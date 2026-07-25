"use client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from "recharts";
import type { EnrichedArticle } from "@/lib/types";

function tally(items: string[]) {
  const m: Record<string, number> = {};
  items.forEach((i) => (m[i] = (m[i] ?? 0) + 1));
  return Object.entries(m)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold text-slate-700">{title}</h3>
      <div style={{ width: "100%", height: 240 }}>{children}</div>
    </div>
  );
}

export default function Charts({ articles }: { articles: EnrichedArticle[] }) {
  const byRegion = tally(articles.map((a) => a.region));
  const byTheme = tally(articles.flatMap((a) => a.themes)).slice(0, 8);
  const byEntity = tally(articles.map((a) => a.entity)).slice(0, 10);
  const byDay = tally(articles.map((a) => new Date(a.date).toISOString().slice(0, 10)))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <section className="grid gap-4 md:grid-cols-2">
      <Panel title="Articles by region">
        <ResponsiveContainer>
          <BarChart data={byRegion}>
            <XAxis dataKey="name" fontSize={11} />
            <YAxis fontSize={11} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#334155" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Articles by theme">
        <ResponsiveContainer>
          <BarChart data={byTheme} layout="vertical" margin={{ left: 40 }}>
            <XAxis type="number" fontSize={11} allowDecimals={false} />
            <YAxis type="category" dataKey="name" fontSize={10} width={130} />
            <Tooltip />
            <Bar dataKey="value" fill="#0f766e" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Articles by name">
        <ResponsiveContainer>
          <BarChart data={byEntity} layout="vertical" margin={{ left: 40 }}>
            <XAxis type="number" fontSize={11} allowDecimals={false} />
            <YAxis type="category" dataKey="name" fontSize={10} width={130} />
            <Tooltip />
            <Bar dataKey="value" fill="#7c3aed" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Daily article trend">
        <ResponsiveContainer>
          <LineChart data={byDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="name" fontSize={10} />
            <YAxis fontSize={11} allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#0369a1" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Panel>
    </section>
  );
}
