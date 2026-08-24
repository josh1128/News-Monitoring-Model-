import type { BankTheme } from "./types";

export const THEME_KEYWORDS: Record<BankTheme, string[]> = {
  Capital: ["capital ratio", "cet1", "common equity tier 1", "tier 1 capital", "capital raise", "capital buffer", "stress test"],
  Liquidity: ["liquidity", "liquidity coverage ratio", "lcr", "liquidity buffer", "deposit outflow", "cash position"],
  "Asset Quality": ["non-performing loan", "nonperforming loan", "npl", "problem loans", "loan losses", "credit losses", "provisions", "delinquency", "defaults"],
  Profitability: ["earnings", "profit", "net income", "revenue", "net interest income", "net interest margin", "return on equity", "roe", "cost income"],
  Funding: ["funding", "deposits", "bond issuance", "wholesale funding", "deposit costs", "refinancing"],
  Ratings: ["credit rating", "ratings", "upgrade", "downgrade", "outlook revised", "rating agency", "moody's", "s&p", "fitch", "dbrs"],
  "Legal / Regulatory": ["regulator", "regulatory", "fine", "penalty", "lawsuit", "settlement", "investigation", "compliance", "capital requirement"],
  "Strategy / M&A": ["acquisition", "merger", "takeover", "divestiture", "sale of business", "strategic review", "restructuring"],
  "Macro / Markets": ["interest rates", "yield curve", "market volatility", "recession", "credit spreads", "economic slowdown", "currency", "sovereign"]
};

export const HIGH_SIGNAL: BankTheme[] = ["Capital", "Liquidity", "Asset Quality", "Ratings", "Legal / Regulatory"];
export const NOISE_PATTERNS = ["sponsored", "opinion", "travel", "restaurant", "sports", "celebrity", "music", "film", "fashion"];

export function classifyBankThemes(text: string): BankTheme[] {
  const lower = text.toLowerCase();
  return (Object.keys(THEME_KEYWORDS) as BankTheme[]).filter(
    (theme) => THEME_KEYWORDS[theme].some((k) => lower.includes(k.toLowerCase()))
  );
}

export function calculateBankRelevance(text: string, themes: BankTheme[]): number {
  const lower = text.toLowerCase();
  if (NOISE_PATTERNS.some((p) => lower.includes(p))) return 3;

  let score = themes.reduce(
    (sum, theme) => sum + (HIGH_SIGNAL.includes(theme) ? 25 : 15),
    0
  );

  const keywordCount = Object.values(THEME_KEYWORDS)
    .flat()
    .filter((k) => lower.includes(k.toLowerCase())).length;

  score += Math.min(keywordCount * 2, 20);
  return Math.min(score, 100);
}

export function relevanceBand(score: number): "High" | "Medium" | "Low" {
  return score >= 60 ? "High" : score >= 30 ? "Medium" : "Low";
}
