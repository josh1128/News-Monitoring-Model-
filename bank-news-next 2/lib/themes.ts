/**
 * lib/themes.ts — THEME KEYWORDS + CLASSIFICATION + RELEVANCE SCORING
 * -------------------------------------------------------------------
 * Edit THEME_KEYWORDS to change how articles are tagged.
 * Edit HIGH_SIGNAL to change which themes count as "key" (score higher).
 * Edit NOISE_PATTERNS to suppress junk (research notes, price ticks).
 */

export const THEME_KEYWORDS: Record<string, string[]> = {
  Earnings: ["earnings", "net income", "revenue", "profit", "quarterly results", "eps", "guidance"],
  "Credit Ratings": ["rating", "downgrade", "upgrade", "outlook", "moody", "s&p",
    "standard & poor", "fitch", "dbrs"],
  "Capital & Liquidity": ["cet1", "capital ratio", "liquidity", "leverage ratio", "buffer",
    "tier 1", "lcr", "nsfr"],
  "Provision for Credit Losses": ["provision", "loan loss", "credit losses", "impairment", "pcl"],
  "Commercial Real Estate": ["commercial real estate", "office loan", "real estate exposure",
    "property loan", "office property"],
  "Housing Market": ["mortgage", "housing", "home price", "residential real estate", "heloc"],
  "Interest Rates": ["interest rate", "rate cut", "rate hike", "federal reserve", "ecb",
    "bank of canada", "yield curve", "monetary policy", "net interest margin"],
  "Regulation / OSFI": ["regulator", "osfi", "compliance", "anti-money", "money laundering",
    "capital rules", "fine", "penalty", "consent order"],
  "M&A Activity": ["merger", "acquisition", "acquire", "takeover", "divestiture", "deal"],
  "Funding & Deposits": ["deposit", "funding", "wholesale funding", "deposit outflow",
    "covered bond", "senior notes"],
  "Macroeconomic Conditions": ["gdp", "inflation", "unemployment", "recession", "economic outlook",
    "slowdown"],
  "Trade & Tariffs": ["tariff", "tariffs", "trade war", "trade deal", "import duty",
    "countervailing", "anti-dumping", "section 232", "section 301", "protectionism",
    "trade dispute", "usmca", "cusma", "wto"],
  "Geopolitical Risk": ["war", "sanctions", "iran", "russia", "china", "conflict", "geopolitic"],
};

/** Themes that make an article high-relevance on their own. */
export const HIGH_SIGNAL = new Set([
  "Credit Ratings",
  "Capital & Liquidity",
  "Provision for Credit Losses",
  "Earnings",
  "Regulation / OSFI",
  "Trade & Tariffs",
]);

/** Junk patterns → forced to a near-zero score so the slider hides them. */
export const NOISE_PATTERNS = [
  "price target", "equal-weight", "overweight", "underweight", "outperform", "underperform",
  "initiates coverage", "reiterates", "buy rating", "sell rating", "(nyse:", "(nasdaq:",
  "form 8.3", "form 8.5", "52-week high", "consecutive rise", "top gainers",
];

export const ALL_THEMES = Object.keys(THEME_KEYWORDS);

export type Classified = { themes: string[]; matched: string[] };

/** THEME CLASSIFICATION FUNCTION */
export function classify(text: string): Classified {
  const t = (text || "").toLowerCase();
  const themes: string[] = [];
  const matched: string[] = [];
  for (const [theme, kws] of Object.entries(THEME_KEYWORDS)) {
    const hits = kws.filter((k) => t.includes(k));
    if (hits.length) {
      themes.push(theme);
      matched.push(...hits);
    }
  }
  return { themes, matched: Array.from(new Set(matched)) };
}

/** RELEVANCE SCORING FUNCTION → 0-100 */
export function scoreRelevance(text: string, themes: string[], matched: string[]): number {
  const t = (text || "").toLowerCase();
  if (NOISE_PATTERNS.some((p) => t.includes(p))) return 3;
  let score = 0;
  for (const th of themes) score += HIGH_SIGNAL.has(th) ? 25 : 15;
  score += Math.min(matched.length * 4, 20);
  return Math.max(0, Math.min(score, 100));
}

export function band(score: number): "High" | "Medium" | "Low" {
  return score >= 60 ? "High" : score >= 30 ? "Medium" : "Low";
}
