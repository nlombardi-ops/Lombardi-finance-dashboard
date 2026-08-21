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
