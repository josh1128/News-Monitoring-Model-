export type EntityDefinition = {
  name: string;
  region: string;
  terms: string[];
};

export const BANKS_BY_REGION: Record<string, EntityDefinition[]> = {
  Canada: [
    { name: "ATB Financial", region: "Canada", terms: ["ATB Financial", "ATB"] },
    { name: "BMO", region: "Canada", terms: ["Bank of Montreal", "BMO"] },
    { name: "Scotiabank", region: "Canada", terms: ["Bank of Nova Scotia", "Scotiabank", "BNS"] },
    { name: "CIBC", region: "Canada", terms: ["Canadian Imperial Bank of Commerce", "CIBC"] },
    { name: "Central 1", region: "Canada", terms: ["Central 1 Credit Union", "Central 1"] },
    { name: "Desjardins", region: "Canada", terms: ["Desjardins Group", "Desjardins"] },
    { name: "Equitable Bank", region: "Canada", terms: ["Equitable Bank", "EQB"] },
    { name: "Laurentian Bank", region: "Canada", terms: ["Laurentian Bank", "LBC"] },
    { name: "National Bank of Canada", region: "Canada", terms: ["National Bank of Canada", "NBC"] },
    { name: "Peoples Trust", region: "Canada", terms: ["Peoples Trust", "Peoples Group"] },
    { name: "RBC", region: "Canada", terms: ["Royal Bank of Canada", "RBC"] },
    { name: "TD", region: "Canada", terms: ["Toronto-Dominion Bank", "TD Bank", "TD"] },
    { name: "Wealthsimple", region: "Canada", terms: ["Wealthsimple"] }
  ],
  "United States": [
    { name: "Bank of America", region: "United States", terms: ["Bank of America", "BofA"] },
    { name: "Citigroup", region: "United States", terms: ["Citigroup", "Citi"] },
    { name: "Goldman Sachs", region: "United States", terms: ["Goldman Sachs"] },
    { name: "JPMorgan", region: "United States", terms: ["JPMorgan Chase", "JPMorgan"] },
    { name: "Morgan Stanley", region: "United States", terms: ["Morgan Stanley"] },
    { name: "State Street", region: "United States", terms: ["State Street"] },
    { name: "Wells Fargo", region: "United States", terms: ["Wells Fargo"] }
  ],
  Europe: [
    { name: "Barclays", region: "Europe", terms: ["Barclays"] },
    { name: "BNP Paribas", region: "Europe", terms: ["BNP Paribas"] },
    { name: "Commerzbank", region: "Europe", terms: ["Commerzbank"] },
    { name: "Crédit Agricole", region: "Europe", terms: ["Credit Agricole", "Crédit Agricole"] },
    { name: "Danske Bank", region: "Europe", terms: ["Danske Bank"] },
    { name: "Deutsche Bank", region: "Europe", terms: ["Deutsche Bank"] },
    { name: "HSBC", region: "Europe", terms: ["HSBC"] },
    { name: "ING Group", region: "Europe", terms: ["ING Group", "ING"] },
    { name: "Lloyds Banking Group", region: "Europe", terms: ["Lloyds Banking Group", "Lloyds"] },
    { name: "NatWest Group", region: "Europe", terms: ["NatWest Group", "Royal Bank of Scotland"] },
    { name: "Nordea", region: "Europe", terms: ["Nordea Bank", "Nordea"] },
    { name: "Santander", region: "Europe", terms: ["Banco Santander", "Santander"] },
    { name: "Société Générale", region: "Europe", terms: ["Societe Generale", "Société Générale"] },
    { name: "UBS", region: "Europe", terms: ["UBS Group", "UBS"] },
    { name: "UniCredit", region: "Europe", terms: ["UniCredit"] }
  ],
  "Asia-Pacific": [
    { name: "Daiwa Securities Group", region: "Asia-Pacific", terms: ["Daiwa Securities", "Daiwa"] },
    { name: "ICICI Bank", region: "Asia-Pacific", terms: ["ICICI Bank"] },
    { name: "Mitsubishi UFJ Financial Group", region: "Asia-Pacific", terms: ["Mitsubishi UFJ", "MUFG"] },
    { name: "Mizuho Financial Group", region: "Asia-Pacific", terms: ["Mizuho Financial Group", "Mizuho"] },
    { name: "Nomura Holdings", region: "Asia-Pacific", terms: ["Nomura Holdings", "Nomura"] }
  ]
};

export const ALL_BANKS = Object.values(BANKS_BY_REGION).flat();

export type SovereignDefinition = EntityDefinition & {
  institutions?: string[];
  currencyTerms?: string[];
  debtTerms?: string[];
};

export const SOVEREIGNS: SovereignDefinition[] = [
  { name: "Australia", region: "APAC", terms: ["Australia", "Australian"], institutions: ["Reserve Bank of Australia", "RBA"], currencyTerms: ["Australian dollar", "AUD"] },
  { name: "Austria", region: "Euro Area", terms: ["Austria", "Austrian"] },
  { name: "Belgium", region: "Euro Area", terms: ["Belgium", "Belgian"] },
  { name: "Brazil", region: "Americas", terms: ["Brazil", "Brazilian"], institutions: ["Banco Central do Brasil"], currencyTerms: ["Brazilian real", "BRL"] },
  { name: "Canada", region: "Americas", terms: ["Canada", "Canadian"], institutions: ["Bank of Canada", "Department of Finance Canada", "Statistics Canada", "StatCan"], currencyTerms: ["Canadian dollar", "CAD"], debtTerms: ["Government of Canada bonds"] },
  { name: "China", region: "APAC", terms: ["China", "Chinese"], institutions: ["People's Bank of China", "PBOC"], currencyTerms: ["yuan", "renminbi", "CNY"] },
  { name: "Czech Republic", region: "Other Europe", terms: ["Czech Republic", "Czechia", "Czech"], institutions: ["Czech National Bank"] },
  { name: "Denmark", region: "Other Europe", terms: ["Denmark", "Danish"], institutions: ["Danmarks Nationalbank"] },
  { name: "Finland", region: "Euro Area", terms: ["Finland", "Finnish"] },
  { name: "France", region: "Euro Area", terms: ["France", "French"] },
  { name: "Germany", region: "Euro Area", terms: ["Germany", "German"] },
  { name: "Greece", region: "Euro Area", terms: ["Greece", "Greek"] },
  { name: "Hong Kong", region: "APAC", terms: ["Hong Kong"], institutions: ["Hong Kong Monetary Authority", "HKMA"], currencyTerms: ["Hong Kong dollar", "HKD"] },
  { name: "India", region: "APAC", terms: ["India", "Indian"], institutions: ["Reserve Bank of India", "RBI"], currencyTerms: ["Indian rupee", "INR"] },
  { name: "Ireland", region: "Euro Area", terms: ["Ireland", "Irish"] },
  { name: "Italy", region: "Euro Area", terms: ["Italy", "Italian"] },
  { name: "Japan", region: "APAC", terms: ["Japan", "Japanese"], institutions: ["Bank of Japan", "BOJ", "Ministry of Finance Japan"], currencyTerms: ["yen", "JPY"], debtTerms: ["JGB", "Japanese government bond"] },
  { name: "Luxembourg", region: "Euro Area", terms: ["Luxembourg"] },
  { name: "Malaysia", region: "APAC", terms: ["Malaysia", "Malaysian"], institutions: ["Bank Negara Malaysia"], currencyTerms: ["ringgit", "MYR"] },
  { name: "Mexico", region: "Americas", terms: ["Mexico", "Mexican"], institutions: ["Banco de Mexico", "Banxico"], currencyTerms: ["Mexican peso", "MXN"] },
  { name: "Netherlands", region: "Euro Area", terms: ["Netherlands", "Dutch"] },
  { name: "New Zealand", region: "APAC", terms: ["New Zealand"], institutions: ["Reserve Bank of New Zealand", "RBNZ"], currencyTerms: ["New Zealand dollar", "NZD"] },
  { name: "Norway", region: "Other Europe", terms: ["Norway", "Norwegian"], institutions: ["Norges Bank"], currencyTerms: ["Norwegian krone", "NOK"] },
  { name: "Poland", region: "Other Europe", terms: ["Poland", "Polish"], institutions: ["National Bank of Poland"], currencyTerms: ["zloty", "PLN"] },
  { name: "Portugal", region: "Euro Area", terms: ["Portugal", "Portuguese"] },
  { name: "Russia", region: "APAC", terms: ["Russia", "Russian"], institutions: ["Bank of Russia"], currencyTerms: ["ruble", "rouble", "RUB"] },
  { name: "Singapore", region: "APAC", terms: ["Singapore", "Singaporean"], institutions: ["Monetary Authority of Singapore", "MAS"], currencyTerms: ["Singapore dollar", "SGD"] },
  { name: "Slovenia", region: "Euro Area", terms: ["Slovenia", "Slovenian"] },
  { name: "South Africa", region: "Africa", terms: ["South Africa", "South African"], institutions: ["South African Reserve Bank", "SARB"], currencyTerms: ["rand", "ZAR"] },
  { name: "South Korea", region: "APAC", terms: ["South Korea", "Korea", "Korean"], institutions: ["Bank of Korea"], currencyTerms: ["won", "KRW"] },
  { name: "Spain", region: "Euro Area", terms: ["Spain", "Spanish"] },
  { name: "Sweden", region: "Other Europe", terms: ["Sweden", "Swedish"], institutions: ["Riksbank"], currencyTerms: ["Swedish krona", "SEK"] },
  { name: "Switzerland", region: "Other Europe", terms: ["Switzerland", "Swiss"], institutions: ["Swiss National Bank", "SNB"], currencyTerms: ["Swiss franc", "CHF"] },
  { name: "Taiwan", region: "APAC", terms: ["Taiwan", "Taiwanese"], currencyTerms: ["Taiwan dollar", "TWD"] },
  { name: "Thailand", region: "APAC", terms: ["Thailand", "Thai"], institutions: ["Bank of Thailand"], currencyTerms: ["baht", "THB"] },
  { name: "Ukraine", region: "Other Europe", terms: ["Ukraine", "Ukrainian"], institutions: ["National Bank of Ukraine"], currencyTerms: ["hryvnia", "UAH"] },
  { name: "United Kingdom", region: "Other Europe", terms: ["United Kingdom", "UK", "British"], institutions: ["Bank of England", "BoE", "HM Treasury"], currencyTerms: ["pound sterling", "sterling", "GBP"], debtTerms: ["gilts"] },
  { name: "United States", region: "Americas", terms: ["United States", "U.S.", "US", "American"], institutions: ["Federal Reserve", "Fed", "FOMC", "U.S. Treasury", "Treasury Department", "BLS", "BEA"], currencyTerms: ["U.S. dollar", "USD"], debtTerms: ["Treasury yields", "Treasuries", "debt ceiling"] }
];
