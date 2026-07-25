# Bank & Sovereign News Monitor

A Next.js dashboard that pulls news for global banks and sovereigns from **The
Guardian** and **The New York Times**, classifies each article into credit
themes, scores relevance, and filters out noise. Deployable to Vercel.

Both sources return **real clickable article links**, and both free tiers permit
production use.

## Quick start

```bash
npm install
# .env.local already contains your keys (it is gitignored)
npm run dev          # http://localhost:3000
```

If you need to recreate the env file:

```bash
cp .env.example .env.local   # then paste your keys
```

- Guardian key: <https://open-platform.theguardian.com/access/>
- NYT key: <https://developer.nytimes.com/get-started>

## Deploy to Vercel

1. Push this folder to a GitHub repo (`.env.local` is gitignored — keys won't be committed).
2. Vercel → **New Project → Import** the repo (auto-detects Next.js).
3. **Settings → Environment Variables**, add:
   - `GUARDIAN_API_KEY`
   - `NYT_API_KEY`
4. Deploy.

Keys are only ever read server-side in the API route, so they never reach the browser.

## Rate limits (important)

| Source | Limits | How the app handles it |
|---|---|---|
| **Guardian** | ~12 calls/sec, 5,000/day | One request per bank, run in parallel |
| **NYT** | **5 requests/min, 500/day** | Banks are **batched** into grouped OR queries (8 per request) and throttled, so 31 banks ≈ 4 requests instead of 31 |

NYT articles are attributed back to the right bank by matching the bank's name
in the headline/abstract. If you select many names and see rate-limit warnings,
narrow the selection or wait a minute.

## Project structure

```
app/
  page.tsx              Dashboard UI (filters, cards, charts, article list)
  layout.tsx            Root layout
  api/news/route.ts     NEWS SEARCH — fetch, dedupe, classify, score (server-side)
lib/
  banks.ts              BANK LIST BY REGION + sovereigns
  themes.ts             THEME KEYWORDS, classification, relevance scoring, noise
  guardian.ts           Guardian API client
  nyt.ts                NYT Article Search client (batching + throttling)
  types.ts              Shared article types
components/
  ArticleCard.tsx       Article card with source badge and link
  Charts.tsx            Region / theme / bank / daily-trend charts
```

## Where to edit

- **Bank list** → `lib/banks.ts` (`BANKS_BY_REGION`). Add `{ name, ric, terms }`.
  `terms` are the search aliases — the more accurate these are, the better both
  the search results and the NYT attribution.
- **Sovereign list** → `lib/banks.ts` (`SOVEREIGNS`).
- **Themes / keywords** → `lib/themes.ts` (`THEME_KEYWORDS`).
- **Which themes count as "key"** → `lib/themes.ts` (`HIGH_SIGNAL`).
- **Noise suppression** → `lib/themes.ts` (`NOISE_PATTERNS`) — matching articles
  score 3, so the minimum-relevance slider hides them.
- **NYT batch size** → `lib/nyt.ts` (`NYT_BATCH_SIZE`, default 8).
- **Default date range** → `app/page.tsx`: `useState(daysAgo(7))` / `useState(daysAgo(0))`.

## Relevance scoring

25 points per high-signal theme, 15 per other theme, up to 20 for keyword count.
Noise patterns force a score of 3. Bands: High ≥ 60, Medium ≥ 30, Low < 30.

## Attribution

The New York Times requires attribution for API use. The footer credits both
sources — keep it.

## Caveats

- Themes are keyword-derived and relevance is heuristic — a triage aid, not a
  credit view. Review before using anywhere that matters.
- Guardian and NYT are general press: credit-specific coverage is thinner than a
  financial wire, so expect fewer hits on niche banks than on the large ones.
- NYT free-tier article data is metadata (headline, abstract, URL) — full text
  lives behind the NYT paywall via the link.

## Daily digest (output, no email)

Produces the day's **important** news across banks *and* sovereigns as
ready-to-read text — it does **not** send email. You open a URL (or click the
header button), read it, and copy it wherever you want. No Resend, no recipient
list, no stored data, no consent/CASL concerns.

### How to use
- In the dashboard header: **📄 Today's digest** (rendered) or **Copy-ready text**.
- Or hit the endpoint directly:
  - `/api/digest` — JSON (subject, text, html, items)
  - `/api/digest?format=text` — plain text, ideal for copy-paste into an email/Slack
  - `/api/digest?format=html` — a formatted page

### "Only the important ones"
The digest keeps items at or above a relevance threshold (default **45**, i.e.
solidly Medium-and-up) across banks and sovereigns, sorted by relevance. Tune it
per request or via env:
- `?min=60` — only the strongest items (or set `DIGEST_MIN_RELEVANCE`)
- `?band=high` — High-relevance items only
- `?days=2` — widen the lookback window
- `DIGEST_PROVIDER` — `guardian` (default), `nyt`, or `both`

If you later want it emailed on a schedule, that's an add-on (a Vercel Cron plus
an email provider) — but it reintroduces recipient handling and the compliance
considerations that this output-only version avoids.
