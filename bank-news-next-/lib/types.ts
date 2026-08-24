export type MonitoringMode = "banks" | "sovereigns";
export type Provider = "guardian" | "nyt";

export type BankTheme =
  | "Capital" | "Liquidity" | "Asset Quality" | "Profitability"
  | "Funding" | "Ratings" | "Legal / Regulatory"
  | "Strategy / M&A" | "Macro / Markets";

export type SovereignTheme = "Economic" | "Fiscal" | "Monetary" | "Political";

export type NewsArticle = {
  id: string;
  mode: MonitoringMode;
  entity: string;
  title: string;
  description: string;
  url: string;
  source: string;
  provider: Provider;
  publishedAt: string;
  themes: string[];
  relevanceScore: number;
  relevanceBand: "High" | "Medium" | "Low";
};
