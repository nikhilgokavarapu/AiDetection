# Deepfake Defense

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from Supabase Project Settings > API. The legacy `VITE_SUPABASE_ANON_KEY` is also accepted.
3. Run `supabase/schema.sql` in the Supabase SQL Editor. It creates the reports table and row-level security policies.
4. Optional real-model backend: deploy `supabase/functions/analyze/index.ts`, set its `MODEL_API_URL` secret, and set `VITE_USE_ANALYSIS_BACKEND=true`. The model endpoint must accept multipart fields `file`, `text`, and `modality`, and return JSON with `score`, `title`, `description`, and `highlights`.
5. Install dependencies and start the app:

```sh
npm install
npm run dev
```

Email confirmation can be enabled or disabled in Supabase Authentication settings. The app restores the active session on reload, supports sign-up and password login, and only displays or inserts reports for the authenticated user.



