/** Shared article shape returned by every provider. */
export type Provider = "guardian" | "nyt" | "lseg";

export type Article = {
  id: string;
  entity: string;          // bank or country
  region: string;
  headline: string;
  summary: string;
  date: string;            // ISO
  source: string;
  url: string;             // Guardian/NYT: clickable link. LSEG: "" (licensed).
  storyId?: string;        // LSEG only — for fetching full text
  provider: Provider;
};

/** Article after theme classification + scoring. */
export type EnrichedArticle = Article & {
  themes: string[];
  matched: string[];
  relevance: number;
  band: "High" | "Medium" | "Low";
};
