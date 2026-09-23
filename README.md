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
storage, the admin portal, and the email notification that tells the team an
enquiry arrived — is Next.js App Router code running on the server.

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
| `/admin/settings`     | Per-page switches (open/closed), notification status and a test email, storage information |
| `/admin/export`       | CSV / JSON download of the enquiry log (also per page and status) |

Each landing page gets its own section, matching how the pages are built:
its own counters, its own inbox, its own export, and a switch to pause its form.

Enquiries move through `new → in progress → resolved`, carry a customer-facing
reference (`TF-482913`), and keep every answer — including fields with no column
of their own, which are stored in `details` rather than discarded.

---

## Notifications

Every accepted enquiry is emailed to the admin team within moments of being
stored, through [Resend](https://resend.com). A newsletter signup is emailed too.
The point is that nobody has to watch `/admin` to find out a customer wrote in.

Set three variables in `.env.local` (see [`.env.example`](.env.example) for the
annotated list) and it is live:

```bash
RESEND_API_KEY=re_...                                 # Resend → API Keys
LEAD_NOTIFICATION_TO=ops@globalsuntech.com,sales@...  # who gets told
LEAD_NOTIFICATION_FROM=Global Suntech <notifications@globalsuntech.com>
```

| Variable                     | Default                     | What it does                                                      |
| ---------------------------- | --------------------------- | ----------------------------------------------------------------- |
| `RESEND_API_KEY`             | —                           | Unset means no email is sent at all.                              |
| `LEAD_NOTIFICATION_TO`       | falls back to `ADMIN_EMAIL` | Comma-separated. Everyone gets the same message, so any of them can pick it up. |
| `LEAD_NOTIFICATION_FROM`     | Resend's sandbox sender     | `Name <address@verified-domain>`. The sandbox sender only reaches the Resend account's own address. |
| `LEAD_NOTIFICATION_REPLY_TO` | the customer                | Set it to force every reply into one internal mailbox.            |
| `EMAIL_NOTIFICATIONS`        | on                          | `off` silences everything without removing the credentials.       |
| `SUBSCRIBER_NOTIFICATIONS`   | on                          | `off` drops the (much noisier) newsletter notifications.          |

`ADMIN_EMAIL` is only ever a *fallback* for `LEAD_NOTIFICATION_TO`, never an
addition — nobody gets a copy they did not ask for. With none of this set,
enquiries are still stored and still appear in the portal; they just arrive
quietly.

### What the operator sees

An enquiry notification is built to be actionable without opening the portal:

- the subject carries the reference, the customer's name and the page —
  `New enquiry · SL-482913 · Nadia Fourie (SOLARIS Energy)`;
- **Reply-To is set to the customer**, so hitting Reply starts the answer rather
  than a reply to the automation;
- contact details come first, the message is quoted in full, and extra answers the
  form collected are kept rather than dropped;
- `Open in admin` deep-links straight to that page's inbox.

The accent colour and brand come from the site registry, so a TRAFLOW enquiry and
a LUMENAX enquiry are distinguishable at a glance in a list.

### Notifications never affect a submission

The send is scheduled with `after()` from `next/server`, so it runs once the
customer's response has been flushed. The enquiry is stored and the reference
number returned first; a Resend outage, a revoked key or a malformed address
degrades to a log line and nothing else. Each notification is keyed on the row it
describes, so a retried callback cannot mail you twice about one enquiry.

### Looking at the emails

Styling an email you cannot see is guesswork, so in development there is a
preview endpoint with fixed sample data:

| URL                                              | Shows                                    |
| ------------------------------------------------ | ---------------------------------------- |
| `/api/dev/email-preview`                         | Index of the messages                    |
| `/api/dev/email-preview?template=lead`           | A full enquiry — every field filled      |
| `/api/dev/email-preview?template=lead-sparse`    | An enquiry with only the required fields |
| `/api/dev/email-preview?template=subscriber`     | A newsletter signup                      |
| `/api/dev/email-preview?template=test`           | The notification test                    |
| `/api/dev/email-preview?template=test-sandbox`   | The same test while the sender is still Resend's sandbox |
| `…&text=1`                                       | The plain-text part instead of the HTML  |

It returns 404 outside development, like `/api/dev-reload`. To confirm real
delivery, use **Send a test email** in `/admin/settings` — that one goes through
Resend for real and reports what happened.

Templates live in `src/lib/email/templates/`. The shared shell and the email-safe
building blocks (tables, inline longhand styles, no flexbox) are in
`src/lib/email/layout.ts` and `src/lib/email/render.ts`; every message ships a
plain-text part as well as HTML.

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

A stored enquiry is also emailed to the notification list (see
[Notifications](#notifications)), scheduled after the response — so the visitor's
reference number never waits on Resend.

Also accepts `application/x-www-form-urlencoded` and `multipart/form-data` using
the same canonical field names, so it is testable with `curl`.

### `POST /api/subscribe`

`{ site, email }` — newsletter signups. A repeat signup returns success with
`created: false` rather than an error, and only a new address is notified about.

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
        │                                            │
        │                                            ▼  after() — off the
        │                                     src/lib/email/   response path
        │                                     Resend → the admin list
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
  It drives the API contract, the portal's per-page sections *and* the accent on
  that page's notification emails, so adding a page is one entry here plus a
  `fetch` call on the page.
- **`src/lib/leads/`** — the only code that touches the database. Everything else
  works with `Lead` objects and never sees a raw row.

`src/lib/email/` is deliberately independent of both: a template is a pure
function from a `Lead` (or a `Subscriber`) to `{ subject, html, text, … }`, with no
network call and no environment reads. Sending happens in one place
(`src/lib/email/index.ts`), which is why the write path can treat a notification
as fire-and-forget.

### Adding a landing page

1. Add an entry to `SITES` in `src/lib/sites.ts`.
2. Add the file to `pages` in `next.config.ts` so it gets a clean URL.
3. Add `<script src="/gs-leads.js"></script>` and have the form call
   `GSLeads.submit({ site: "<slug>", formId: "<id>", fields: { … } })`.
4. If you are using Supabase, extend the `leads_site_known` CHECK constraint in
   `supabase/schema.sql`.

The admin portal picks up the new section automatically, and notifications for
that page inherit its brand and accent colour with no further work.

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

In development, `/api/dev/email-preview` renders the notification emails with
sample data so they can be looked at without sending anything.

---

## Deploying

Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` and
`NEXT_PUBLIC_SITE_URL` in your host's environment.

The local file fallback is refused in production unless you set
`ALLOW_LOCAL_STORE=1`, because a container filesystem is not durable storage —
so a production deploy with no Supabase credentials returns `503` from
`/api/leads` and tells visitors to email instead.

For notifications, also set `RESEND_API_KEY`, `LEAD_NOTIFICATION_TO` and a
`LEAD_NOTIFICATION_FROM` on a **domain verified in Resend**. Before that last
step, everything is delivered by Resend's sandbox sender, which only reaches the
address that owns the Resend account — so a production deploy that skips it will
notify nobody. `/admin/settings` says so out loud when it is still in use, and its
**Send a test email** button is the quickest way to confirm delivery from the
deployed environment.
