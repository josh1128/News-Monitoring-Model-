import type { SovereignTheme } from "./types";

export const SOVEREIGN_THEME_KEYWORDS: Record<SovereignTheme, string[]> = {
  Economic: [
    "gdp", "gross domestic product", "economic growth", "growth forecast",
    "growth outlook", "recession", "contraction", "expansion", "economic slowdown",
    "economic activity", "inflation", "consumer prices", "cpi", "core inflation",
    "deflation", "unemployment", "employment", "jobs report", "labour market",
    "labor market", "wage growth", "housing market", "house prices", "home prices",
    "mortgage market", "exports", "imports", "trade deficit", "trade surplus",
    "current account", "trade shock", "tariff", "tariffs"
  ],
  Fiscal: [
    "budget", "budget deficit", "fiscal deficit", "fiscal surplus",
    "government deficit", "government debt", "public debt", "debt-to-gdp",
    "debt to gdp", "debt burden", "government borrowing", "sovereign borrowing",
    "bond issuance", "government bonds", "financing plan", "funding plan",
    "debt issuance", "refinancing", "fiscal policy", "fiscal reform",
    "fiscal consolidation", "austerity", "government spending", "spending package",
    "stimulus package", "tax reform", "tax increase", "tax cut", "tax cuts",
    "imf program", "imf programme", "debt restructuring", "sovereign default"
  ],
  Monetary: [
    "central bank", "interest rate", "policy rate", "rate hike", "rate cut",
    "monetary policy", "inflation expectations", "currency", "exchange rate",
    "currency depreciation", "currency appreciation", "currency pressure",
    "foreign exchange intervention", "fx intervention", "foreign exchange reserves",
    "fx reserves", "international reserves", "quantitative easing",
    "quantitative tightening", "bond purchases", "liquidity injection",
    "liquidity operation"
  ],
  Political: [
    "election", "elections", "government change", "government reshuffle",
    "prime minister", "president", "coalition", "parliament", "government collapse",
    "resignation", "political crisis", "political instability", "protest", "protests",
    "civil unrest", "war", "conflict", "military", "invasion", "geopolitical",
    "geopolitical tensions", "sanction", "sanctions", "economic sanctions",
    "trade dispute", "trade war", "tariffs"
  ]
};

export const SOVEREIGN_HIGH_SIGNAL = [
  "recession", "gdp contraction", "inflation surge", "inflation shock",
  "unemployment surge", "housing crash", "debt downgrade", "fiscal crisis",
  "debt crisis", "debt restructuring", "sovereign default", "default",
  "budget crisis", "emergency budget", "fiscal consolidation", "imf bailout",
  "imf program", "rate hike", "rate cut", "emergency rate", "currency intervention",
  "currency crisis", "currency collapse", "reserve depletion", "government collapse",
  "election", "coup", "war", "invasion", "sanctions", "state of emergency",
  "trade war"
];

export const SOVEREIGN_NOISE_PATTERNS = [
  "sports", "football", "soccer", "basketball", "tennis", "celebrity",
  "film festival", "music festival", "fashion", "recipe", "restaurant",
  "travel guide", "tourism attraction", "weather forecast", "lottery",
  "wedding", "concert"
];

export function classifySovereignThemes(text: string): SovereignTheme[] {
  const lower = text.toLowerCase();
  return (Object.keys(SOVEREIGN_THEME_KEYWORDS) as SovereignTheme[]).filter(
    (theme) => SOVEREIGN_THEME_KEYWORDS[theme].some(
      (keyword) => lower.includes(keyword.toLowerCase())
    )
  );
}

export function calculateSovereignRelevance(
  text: string,
  themes: SovereignTheme[]
): number {
  const lower = text.toLowerCase();

  if (SOVEREIGN_NOISE_PATTERNS.some((p) => lower.includes(p))) return 3;

  const keywordCount = Object.values(SOVEREIGN_THEME_KEYWORDS)
    .flat()
    .filter((keyword) => lower.includes(keyword.toLowerCase()))
    .length;

  let score = themes.length * 15;
  if (themes.length >= 2) score += 10;
  if (SOVEREIGN_HIGH_SIGNAL.some((x) => lower.includes(x))) score += 30;
  score += Math.min(20, keywordCount * 2);

  return Math.min(100, score);
}
