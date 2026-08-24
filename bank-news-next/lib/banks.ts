/**
 * lib/banks.ts — BANK LIST BY REGION
 * ----------------------------------
 * `ric` is used to build the LSEG query (R:RIC). Guardian searches by name.
 * Add / remove banks here; everything else picks the change up automatically.
 */

export type Bank = {
  name: string;
  ric: string | null;   // null = no live RIC (query by name only)
  terms?: string[];      // extra search terms
};

export const BANKS_BY_REGION: Record<string, Bank[]> = {
  America: [
    { name: "Citigroup", ric: "C.N", terms: ["Citigroup", "Citibank"] },
    { name: "Bank of America", ric: "BAC.N" },
    { name: "JPMorgan Chase", ric: "JPM.N", terms: ["JPMorgan"] },
    { name: "Goldman Sachs", ric: "GS.N" },
    { name: "Morgan Stanley", ric: "MS.N" },
    { name: "Wells Fargo", ric: "WFC.N" },
    { name: "State Street Bank", ric: "STT.N", terms: ["State Street"] },
  ],
  Europe: [
    { name: "BNP Paribas", ric: "BNPP.PA" },
    { name: "Crédit Agricole", ric: "CAGR.PA", terms: ["Credit Agricole"] },
    { name: "Société Générale", ric: "SOGN.PA", terms: ["Societe Generale", "SocGen"] },
    { name: "UBS Group", ric: "UBSG.S", terms: ["UBS"] },
    { name: "Credit Suisse", ric: null },
    { name: "Barclays", ric: "BARC.L" },
    { name: "HSBC", ric: "HSBA.L" },
    { name: "NatWest / RBS", ric: "NWG.L", terms: ["NatWest", "RBS"] },
    { name: "Standard Chartered", ric: "STAN.L" },
    { name: "Deutsche Bank", ric: "DBKGn.DE" },
    { name: "Commerzbank", ric: "CBKG.DE" },
    { name: "Danske Bank", ric: "DANSKE.CO" },
  ],
  Japan: [
    { name: "Mitsubishi UFJ", ric: "8306.T", terms: ["MUFG"] },
    { name: "Sumitomo Mitsui", ric: "8316.T", terms: ["SMFG"] },
    { name: "Mizuho", ric: "8411.T" },
    { name: "Daiwa", ric: "8601.T", terms: ["Daiwa Securities"] },
    { name: "Nomura", ric: "8604.T" },
  ],
  Canada: [
    { name: "Bank of Nova Scotia", ric: "BNS.TO", terms: ["Scotiabank"] },
    { name: "BMO", ric: "BMO.TO", terms: ["Bank of Montreal"] },
    { name: "CIBC", ric: "CM.TO", terms: ["Canadian Imperial Bank"] },
    { name: "TD Bank", ric: "TD.TO", terms: ["Toronto-Dominion"] },
    { name: "RBC", ric: "RY.TO", terms: ["Royal Bank of Canada"] },
    { name: "National Bank", ric: "NA.TO", terms: ["National Bank of Canada"] },
    { name: "Laurentian Bank", ric: "LB.TO" },
  ],
};

/** Sovereigns (optional view) — searched by name + institution terms. */
export const SOVEREIGNS: Record<string, string[]> = {
  Canada: ["Canada", "Bank of Canada"],
  "United States": ["United States", "Federal Reserve"],
  "United Kingdom": ["United Kingdom", "Bank of England"],
  France: ["France"],
  Germany: ["Germany"],
  Japan: ["Japan", "Bank of Japan"],
  China: ["China"],
};

export const ALL_REGIONS = Object.keys(BANKS_BY_REGION);

export function banksForRegions(regions: string[]): { region: string; bank: Bank }[] {
  return regions.flatMap((r) => (BANKS_BY_REGION[r] ?? []).map((bank) => ({ region: r, bank })));
}

export function findBank(name: string): { region: string; bank: Bank } | undefined {
  for (const [region, list] of Object.entries(BANKS_BY_REGION)) {
    const bank = list.find((b) => b.name === name);
    if (bank) return { region, bank };
  }
  return undefined;
}
