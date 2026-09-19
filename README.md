# Global Suntech — landing pages and enquiry backend

Five marketing landing pages for the Global Suntech divisions, plus a
server-rendered admin portal that every one of those pages feeds.

| Landing page            | URL                       | Brand          |
| ----------------------- | ------------------------- | -------------- |
| Group homepage          | `/`                       | GLOBALZW-iTECH |
| Traffic Solutions       | `/traffic-solutions`      | TRAFLOW        |
| Solar Solutions         | `/solar-solutions`        | SOLARIS Energy |
| LED Lighting            | `/led-lighting`           | LUMENAX        |
| Engineering Consulting  | `/engineering-consulting` | LUXGRID        |

The pages themselves are standalone HTML documents in `public/`, served at clean
URLs by the rewrites in `next.config.ts`. Everything behind them — validation,
storage, the admin portal — is Next.js App Router code running on the server.

---

## Quick start

```bash
npm install
cp .env.example .env.local     # then fill in the values (see below)
npm run dev
```

Open <http://localhost:3000> for the site and <http://localhost:3000/admin> for
the portal.

**You can run this before you have Supabase credentials.** With none set, the
app falls back to a local JSON file at `.data/store.json` (development only) and
the admin portal shows a banner saying so. Every feature works — submit a form,
watch it appear in `/admin` — and nothing needs changing when you switch over.

---

## Supabase setup

### 1. Environment variables

Put these in `.env.local` (copy `.env.example` for the documented template):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...        # Project Settings → API Keys → anon
SUPABASE_SERVICE_ROLE_KEY=...            # Project Settings → API Keys → service_role
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be renamed with a
`NEXT_PUBLIC_` prefix. It bypasses Row Level Security, which is what lets the
server write enquiries and read them in the portal.

### 2. Apply the schema

Supabase Dashboard → **SQL Editor** → paste [`supabase/schema.sql`](supabase/schema.sql)
→ **Run**. It is idempotent, so re-running is safe.

It creates `leads`, `newsletter_subscribers` and `site_settings`, plus a
`lead_stats` function the dashboard uses for its counters. All three tables have
Row Level Security **enabled with no policies**, so the anon key in a visitor's
browser can neither read nor write them.

### 3. Verify

```bash
npm run db:check
```

Reports whether the project is reachable, whether the schema is applied, and
whether the key is accepted — without starting the app.

---

## The admin portal

`/admin` is protected by a password from `ADMIN_PASSWORD`. Sessions are carried
in an HMAC-signed, HTTP-only cookie (`ADMIN_SESSION_SECRET`, `ADMIN_SESSION_HOURS`).

> **Development default:** if `ADMIN_PASSWORD` is unset outside production, the
> portal falls back to `solar123` and says so on the sign-in screen. Set it
> before deploying — the app refuses to serve the portal in production without it.

| Route                 | What it does                                                     |
| --------------------- | ---------------------------------------------------------------- |
| `/admin`              | Totals across all five pages, per-page cards, latest enquiries    |
| `/admin/sites/<slug>` | **One section per landing page** — filter, search, work, export   |
| `/admin/subscribers`  | Newsletter signups                                               |
| `/admin/settings`     | Per-page switches (open/closed) and storage information           |
| `/admin/export`       | CSV / JSON download of the enquiry log (also per page and status) |

Each landing page gets its own section, matching how the pages are built:
its own counters, its own inbox, its own export, and a switch to pause its form.

Enquiries move through `new → in progress → resolved`, carry a customer-facing
reference (`TF-482913`), and keep every answer — including fields with no column
of their own, which are stored in `details` rather than discarded.

---

## API

The landing pages are static documents, so they post to Route Handlers rather
than Server Actions.

### `POST /api/leads`

```jsonc
{
  "site": "traffic-solutions",       // required, must be a known slug
  "formId": "queryForm",             // optional, recorded for traceability
  "path": "/traffic-solutions",      // optional, where it was submitted from
  "fields": {                        // canonical keys; anything else is kept in `details`
    "name": "…", "email": "…", "phone": "…", "company": "…",
    "country": "…", "city": "…", "location": "…",
    "enquiryType": "…", "systemType": "…", "quantity": "…", "message": "…"
  },
  "details": { "budget": "R500k" }   // optional extras
}
```

Returns `{ ok: true, ref, id }`. Validation, rate limiting (8 per address per
10 minutes), a honeypot, and the per-page open/closed switch all apply server
side — the pages' own checks are only for immediate feedback.

Also accepts `application/x-www-form-urlencoded` and `multipart/form-data` using
the same canonical field names, so it is testable with `curl`.

### `POST /api/subscribe`

`{ site, email }` — newsletter signups. A repeat signup returns success with
`created: false` rather than an error.

### `GET /api/health`

Reports store kind, Supabase reachability, and whether the schema is applied.
No customer data, safe to leave public.

---

## How the pieces fit

```
public/*.html               the five pages; each calls GSLeads.submit(...)
public/gs-leads.js          shared client: one request shape, one set of errors
        │
        ▼  POST /api/leads
src/app/api/leads/route.ts  rate limit → honeypot → validate → store
        │
        ▼
src/lib/leads/              Data Access Layer: Supabase backend, local fallback
        │
        ▼
src/app/admin/              server-rendered portal (Server Components +
                            Server Actions for every mutation)
```

Two files carry most of the design:

- **`src/lib/sites.ts`** — the registry of the five pages: slug, brand, live URL,
  form id, reference prefix, accent colour, and which fields each form must send.
  It drives the API contract *and* the portal's per-page sections, so adding a
  page is one entry here plus a `fetch` call on the page.
- **`src/lib/leads/`** — the only code that touches the database. Everything else
  works with `Lead` objects and never sees a raw row.

### Adding a landing page

1. Add an entry to `SITES` in `src/lib/sites.ts`.
2. Add the file to `pages` in `next.config.ts` so it gets a clean URL.
3. Add `<script src="/gs-leads.js"></script>` and have the form call
   `GSLeads.submit({ site: "<slug>", formId: "<id>", fields: { … } })`.
4. If you are using Supabase, extend the `leads_site_known` CHECK constraint in
   `supabase/schema.sql`.

The admin portal picks up the new section automatically.

---

## Scripts

| Script              | Purpose                                   |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Development server                        |
| `npm run build`     | Production build                          |
| `npm start`         | Serve the production build                |
| `npm run lint`      | ESLint                                    |
| `npm run typecheck` | `tsc --noEmit`                            |
| `npm run db:check`  | Verify the Supabase connection and schema |

---

## Deploying

Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` and
`NEXT_PUBLIC_SITE_URL` in your host's environment.

The local file fallback is refused in production unless you set
`ALLOW_LOCAL_STORE=1`, because a container filesystem is not durable storage —
so a production deploy with no Supabase credentials returns `503` from
`/api/leads` and tells visitors to email instead.
