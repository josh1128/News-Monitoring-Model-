type GuardianResult = {
  id: string;
  webTitle: string;
  webUrl: string;
  webPublicationDate: string;
  fields?: { trailText?: string; bodyText?: string };
};

export async function searchGuardian(
  query: string,
  fromDate: string,
  toDate: string,
  pageSize = 50
): Promise<GuardianResult[]> {
  const apiKey = process.env.GUARDIAN_API_KEY;
  if (!apiKey) return [];

  const params = new URLSearchParams({
    q: query,
    "from-date": fromDate,
    "to-date": toDate,
    "page-size": String(pageSize),
    "order-by": "newest",
    "show-fields": "trailText,bodyText",
    "api-key": apiKey,
  });

  const response = await fetch(
    `https://content.guardianapis.com/search?${params.toString()}`,
    { cache: "no-store" }
  );

  if (!response.ok) throw new Error(`Guardian request failed: ${response.status}`);
  const json = await response.json();
  return json?.response?.results ?? [];
}
