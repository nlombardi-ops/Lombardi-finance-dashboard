# Finance Dashboard

Password-gated personal finance dashboard. Areas:

**ENTRATE** — Pensioni, Entrate economiche
**COSTI** — Assicurazioni, Bollette, Spese condominio, Pulizie e Commercialista,
Telefoni e Internet, Banche, Tasse immobiliari, Lifestyle costs

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in at least:
   - `DASHBOARD_PASSWORD` — the login password
   - `DASHBOARD_TOKEN` — `openssl rand -hex 32`
3. Fill in real numbers in `data/*.json` (see `data/README.md` for the shape —
   they all start empty).
4. `npm run dev`, log in, check every area's numbers.

Optional (skip if not needed):
- **Assistente Finanze chat** — set `ANTHROPIC_API_KEY`. Answers questions
  using whatever is in `data/*.json`; no extra setup beyond the key.
- **Google Drive auto-sync** (`bollette` only, stub) — see the comments in
  `app/api/dashboard/sync/route.ts` and `lib/drive/client.ts`. This needs a
  real sample bill to write a working parser against; it currently just
  downloads files and skips them until you adapt `parseBollettaPdf`.

## Deploy

New Vercel project pointing at this repo, set the env vars above in
Production, attach a Vercel Blob store only if you want writes (e.g. the
sync feature) to persist without a redeploy. Otherwise editing `data/*.json`
and redeploying is the simplest path for manual updates.

## Adapting further

- Areas live in `lib/areas.ts` — add/remove/reorder freely, each just needs a
  matching `data/{id}.json`.
- One shared `[area]/page.tsx` renders every area generically (totals +
  table). If one area later needs a different visualization (a chart,
  amortization schedule, etc.), give it its own `app/dashboard/{id}/page.tsx`
  — Next.js resolves the static route before the dynamic `[area]` one.
