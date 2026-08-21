# Data seeds

Each file here is one dashboard area (see `lib/areas.ts`), shape:

```json
{
  "items": [
    { "label": "Assicurazione casa - Generali", "amount": 340, "frequency": "annual", "date": "2026-03-01", "notes": "scade marzo" }
  ]
}
```

`frequency` is one of `"monthly" | "quarterly" | "annual" | "one-time"`.
`date` and `notes` are optional. Add as many `items` as apply — one entry
per bill/policy/pension line, not one file-wide total.

All 10 files start empty (`"items": []`). Fill them in with real numbers
before deploying — the dashboard renders whatever's here, including zero
totals if left empty.

## contratti.json — different shape

This one isn't a cost/income area — it's a registry of contract terms
(permanencia, cancellation notice, auto-renewal), shape:

```json
{
  "contracts": [
    {
      "id": "assicurazione-casa",
      "name": "Assicurazione casa",
      "type": "assicurazione",
      "provider": "Generali",
      "start_date": "2024-03-01",
      "permanencia_end": "2027-03-01",
      "auto_renew": true,
      "notice_period_days": 60,
      "status": "attivo",
      "key_terms": "Copertura incendio, furto, responsabilità civile. Rinnovo automatico annuale se non disdetto 60gg prima.",
      "drive_link": null
    }
  ]
}
```

`permanencia_end: null` means free to cancel any time. This feeds both the
Contratti page and the Assistente Contratti chat — the more detail in
`key_terms`, `notice_period_days`, and `auto_renew`, the better the
assistant's answers.
