# Maintaining this dashboard

This repo is a clean, history-free copy of the dashboard pattern from
`nlombardi-ops/Personal_brand` (`/dashboard`), rebuilt for a different
person's own data. It's a **separate codebase now, not a fork that stays in
sync automatically** — if a bug fix or improvement lands in the source
project's dashboard and it applies here too, it has to be ported over
manually. Nothing shares code between the two repos.

## Current state

- 10 areas, two groups: **ENTRATE** (Pensioni, Entrate economiche) and
  **COSTI** (the other 8) — see `lib/areas.ts`.
- One generic `app/dashboard/[area]/page.tsx` renders every area (totals +
  table). Give an area its own `app/dashboard/{id}/page.tsx` if it later
  needs a different visualization — Next.js resolves the static route first.
- Data source: static `data/*.json` files, committed to git, read at request
  time. All 10 area files start empty (`"items": []`) — fill in real numbers
  before this is useful to anyone. `data/contratti.json` is separate — see
  below.
- **Contratti** (`app/dashboard/contratti/page.tsx`) — an 11th, standalone
  nav entry, not part of the ENTRATE/COSTI totals system: a registry of
  contract terms (permanencia, disdetta, rinnovo automatico), type
  `Contract` in `lib/types.ts`, seed `data/contratti.json`. Starts empty.
- Storage: `lib/store.ts`'s `createJsonStore` supports an optional Vercel
  Blob-backed persistence layer (falls back to the local file if
  `BLOB_READ_WRITE_TOKEN` isn't set). Currently only used by the sync route
  below — every area page itself still reads the static JSON directly.
  Switch an area to `createJsonStore` + an API route if you want it editable
  from a form instead of by hand-editing the file.

## Optional features included

- **Assistente Finanze chat** (`app/api/dashboard/chat/route.ts` +
  `FinanceChat.tsx`, on the Overview page) — works as soon as
  `ANTHROPIC_API_KEY` is set. Builds its context by reading all 10 area JSON
  files live, so it's always current with whatever's in `data/`.
- **Assistente Contratti chat** (`app/api/dashboard/contracts-chat/route.ts`
  + `ContractsChat.tsx`, on the Contratti page) — separate from the Finanze
  chat, scoped only to `data/contratti.json`. The system prompt is written
  to be proactive, not just reactive: it's told to always compute
  days-remaining against today's date, flag auto-renewal and closing
  cancellation windows unprompted, and cite which contract an answer came
  from. It defaults to Spanish sample questions because the real contract
  text (`key_terms`) will be transcribed from Spanish-language documents —
  the model still answers in whatever language the question is asked in
  (Italian, Spanish, or English), and is told to keep the original Spanish
  legal term in parentheses when translating one (e.g. "permanencia") so
  nothing gets lost in translation.
- **Google Drive auto-sync** (`app/api/dashboard/sync/route.ts` +
  `lib/drive/client.ts`) — **plumbing only, not working yet.** The OAuth
  client and cron wiring are real; `parseBollettaPdf()` is a stub that
  always returns `null`. Writing a real parser needs an actual sample bill
  to inspect first — don't guess the regex. Expect one parser per
  provider/template, and expect templates to change over time and quietly
  break existing regexes.

## Env vars

| Var | Required for |
|---|---|
| `DASHBOARD_PASSWORD` / `DASHBOARD_TOKEN` | Login (always) |
| `BLOB_READ_WRITE_TOKEN` | Persisted writes (sync route only, currently) |
| `ANTHROPIC_API_KEY` | Assistente Finanze chat |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REFRESH_TOKEN` / `CRON_SECRET` | Drive sync — skip until the parser is real |

## Deploy checklist

1. New Vercel project pointing at this repo.
2. Set whichever env vars above apply, in Production.
3. Attach a Vercel Blob store only if using the sync feature.
4. Log in with the real password, confirm every area's numbers match the
   actual documents before handing over the URL.
