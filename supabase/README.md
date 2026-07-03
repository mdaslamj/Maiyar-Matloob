# Supabase Migrations — Maiyar-e-Matloob

Apply in order via Supabase SQL Editor or CLI:

1. `001_canonical_schema.sql` — tables, indexes, foreign keys
2. `002_storage_phase_rls.sql` — permissive storage-phase policies (no auth yet)
3. `003_community_increment_rpcs.sql` — atomic community aggregate functions

## Enable in application

```javascript
// src/shared/feature-flags.js
USE_BACKEND_SYNC: true
BACKEND_PROVIDER: "supabase"
```

```javascript
// src/backend/config/backend-config.local.js
export const BACKEND_PROVIDER_CONFIG = {
  supabase: {
    url: "https://YOUR_PROJECT.supabase.co",
    anonKey: "YOUR_ANON_KEY"
  }
};
```

Legacy `src/firebase/firebase-config.local.js` with `SUPABASE_CONFIG` is also supported.
