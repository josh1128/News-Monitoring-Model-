/** Shared article shape returned by every provider. */
export type Provider = "guardian" | "nyt";

export type Article = {
  id: string;
  entity: string;          // bank or country
  region: string;
  headline: string;
  summary: string;
  date: string;            // ISO
  source: string;
  url: string;             // both providers give a real clickable link
  provider: Provider;
};

/** Article after theme classification + scoring. */
export type EnrichedArticle = Article & {
  themes: string[];
  matched: string[];
  relevance: number;
  band: "High" | "Medium" | "Low";
};
