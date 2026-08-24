type NYTDoc = {
  _id: string;
  web_url: string;
  pub_date: string;
  abstract?: string;
  lead_paragraph?: string;
  headline?: { main?: string };
  source?: string;
};

export async function searchNYT(
  terms: string[],
  fromDate: string,
  toDate: string
): Promise<NYTDoc[]> {
  const apiKey = process.env.NYT_API_KEY;
  if (!apiKey || terms.length === 0) return [];

  const q = terms.map((term) => `"${term.replace(/"/g, "")}"`).join(" OR ");

  const params = new URLSearchParams({
    q,
    begin_date: fromDate.replaceAll("-", ""),
    end_date: toDate.replaceAll("-", ""),
    sort: "newest",
    "api-key": apiKey,
  });

  const response = await fetch(
    `https://api.nytimes.com/svc/search/v2/articlesearch.json?${params.toString()}`,
    { cache: "no-store" }
  );

  if (!response.ok) throw new Error(`NYT request failed: ${response.status}`);
  const json = await response.json();
  return json?.response?.docs ?? [];
}
