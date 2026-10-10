# QuickPoll 🗳️

Live polls in 10 seconds. Ask anything, share the link, watch votes roll in live.

## How it works

- **Frontend** (`app/page.tsx`, `app/p/[id]/page.tsx`): React pages. The create form and the voting page.
- **Backend** (`app/api/polls/...`): Next.js API routes. The browser never talks to the database directly — it calls these routes, and *they* talk to Supabase.
- **Database** (`supabase/schema.sql`): two tables — `polls` and `options`. Run the SQL once in Supabase's SQL editor.

## Setup (one time)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase dashboard: **SQL Editor → New query** → paste `supabase/schema.sql` → Run.
3. **Project Settings → API**: copy the project URL and the `anon` key.
4. Copy `.env.example` to `.env.local` and fill in the two values.
5. `npm install` then `npm run dev` → open http://localhost:3000.

## Deploy

Push to GitHub, import the repo in [vercel.com](https://vercel.com), and add the same two
environment variables in Vercel's project settings. Every push to `main` redeploys automatically.

## What you'll learn from this codebase

- `app/api/*` — what a backend API route looks like
- `lib/supabase.ts` — how server code connects to a database
- `app/p/[id]/page.tsx` — dynamic routes, polling for live data, share links
- `supabase/schema.sql` — the simplest real database schema: two tables, one foreign key
