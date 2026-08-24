# Bank & Sovereign News Monitor — Sovereign-Focused

A Vercel-ready Next.js project based on the existing `bank-news-next` design.

## Main change

No AI is included.

Sovereign news is narrowed to four CRAO factors:

- **Economic:** GDP/growth, inflation, unemployment, housing, trade shocks
- **Fiscal:** deficits, debt-to-GDP, financing plans, fiscal reform
- **Monetary:** central-bank decisions, FX reserves, currency pressure, policy changes
- **Political:** elections, government changes, geopolitics, sanctions, trade disputes

A sovereign article must match at least one factor before it is returned by `/api/news`.

## Important files

- `lib/sovereignThemes.ts` — sovereign topic keywords and relevance scoring
- `lib/banks.ts` — bank and sovereign universe + aliases
- `app/api/news/route.ts` — server-side retrieval/filtering
- `app/page.tsx` — UI filters
- `components/ArticleCard.tsx` — article display

## Setup

```bash
npm install
```

Copy `.env.example` to `.env.local` and add:

```env
GUARDIAN_API_KEY=...
NYT_API_KEY=...
```

Then run:

```bash
npm run dev
```

## Vercel

1. Push this folder to GitHub.
2. Import the repo into Vercel.
3. Add `GUARDIAN_API_KEY` and `NYT_API_KEY` as Vercel environment variables.
4. Deploy.

## Sovereign relevance scoring

- 15 points per matching factor
- +10 for 2+ factors
- +30 for high-signal events
- up to +20 for keyword density
- obvious non-credit noise is forced to score 3

The UI defaults to a 14-day sovereign view and allows filtering by the four factors.
