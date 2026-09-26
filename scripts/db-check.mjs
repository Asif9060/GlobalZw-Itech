#!/usr/bin/env node
/**
 * Checks that the Supabase backend is reachable and that `supabase/schema.sql`
 * has been applied.
 *
 *   npm run db:check
 *
 * Run this the moment you paste credentials into `.env.local` — it answers
 * "did I get the keys right?" and "did I remember to run the SQL?" without
 * starting the app or opening the admin portal.
 *
 * It talks to the PostgREST API directly with the service-role key, exactly as
 * the server does, so a pass here means the app will connect too.
 */

// `@next/env` is CommonJS, so it has no named exports to import directly. This
// is the same loader `next dev` uses, which means `.env.local` is read exactly
// as the app reads it.
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

const RESET = "\u001b[0m";
const RED = "\u001b[31m";
const GREEN = "\u001b[32m";
const YELLOW = "\u001b[33m";
const DIM = "\u001b[2m";
const BOLD = "\u001b[1m";

const ok = (text) => `${GREEN}✓${RESET} ${text}`;
const bad = (text) => `${RED}✗${RESET} ${text}`;
const warn = (text) => `${YELLOW}!${RESET} ${text}`;

function env(name, fallback = "") {
  return (process.env[name] ?? fallback).trim();
}

const url = env("NEXT_PUBLIC_SUPABASE_URL").replace(/\/+$/, "");
const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
const anonKey = env("NEXT_PUBLIC_SUPABASE_ANON_KEY");

const tables = {
  leads: env("SUPABASE_LEADS_TABLE", "leads") || "leads",
  subscribers: env("SUPABASE_SUBSCRIBERS_TABLE", "newsletter_subscribers") || "newsletter_subscribers",
  settings: env("SUPABASE_SETTINGS_TABLE", "site_settings") || "site_settings",
};

console.log(`\n${BOLD}GlobalZwItech — Supabase check${RESET}\n`);

/* ── configuration ──────────────────────────────────────────────────────── */

const problems = [];

if (!url) problems.push("NEXT_PUBLIC_SUPABASE_URL is empty");
if (!serviceKey) problems.push("SUPABASE_SERVICE_ROLE_KEY is empty");
if (!anonKey) {
  console.log(warn("NEXT_PUBLIC_SUPABASE_ANON_KEY is empty — not used by the server, but set it for completeness."));
}

if (problems.length > 0) {
  console.log(bad("Supabase is not configured."));
  for (const problem of problems) console.log(`    ${DIM}${problem}${RESET}`);
  console.log(
    `\n  Add them to ${BOLD}.env.local${RESET} (see .env.example), then apply the schema:\n` +
      `  Supabase Dashboard → SQL Editor → paste the contents of ${BOLD}supabase/schema.sql${RESET} → Run.\n`,
  );
  console.log(`${DIM}Until then the app falls back to .data/store.json in development.${RESET}\n`);
  process.exit(1);
}

if (!/^https:\/\/.+\.supabase\.(co|in)$/.test(url)) {
  console.log(warn(`That URL looks unusual: ${url}`));
  console.log(`    ${DIM}It should look like https://abcdefgh.supabase.co${RESET}`);
}

console.log(ok(`Project URL: ${url}`));
console.log(`${DIM}  Service-role key: ${serviceKey.slice(0, 6)}…${serviceKey.slice(-4)} (${serviceKey.length} chars)${RESET}\n`);

/* ── connectivity + schema ──────────────────────────────────────────────── */

async function probeTable(table) {
  let response;
  try {
    response = await fetch(`${url}/rest/v1/${table}?select=id&limit=1`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Accept: "application/json",
      },
    });
  } catch (error) {
    return { state: "unreachable", detail: error.message };
  }

  if (response.ok) return { state: "ready" };

  const body = await response.text().catch(() => "");
  let parsed = {};
  try {
    parsed = JSON.parse(body);
  } catch {
    /* non-JSON error body */
  }

  if (response.status === 404 || parsed.code === "42P01") {
    return { state: "missing", detail: `${parsed.code ?? response.status} ${parsed.message ?? ""}`.trim() };
  }

  if (response.status === 401 || response.status === 403) {
    return { state: "denied", detail: `${response.status} — check the service-role key` };
  }

  return { state: "error", detail: `${response.status} ${parsed.message ?? body.slice(0, 120)}`.trim() };
}

let schemaReady = true;

for (const [label, table] of Object.entries(tables)) {
  const result = await probeTable(table);

  if (result.state === "ready") {
    console.log(ok(`Table ${BOLD}${table}${RESET}${RESET} (${label}) is readable.`));
    continue;
  }

  schemaReady = false;

  if (result.state === "missing") {
    console.log(bad(`Table ${BOLD}${table}${RESET} does not exist (${label}).`));
  } else if (result.state === "denied") {
    console.log(bad(`Table ${BOLD}${table}${RESET} refused the service-role key (${label}).`));
    console.log(`    ${DIM}${result.detail}${RESET}`);
  } else {
    console.log(bad(`Could not read ${BOLD}${table}${RESET} (${label}): ${result.state}`));
    if (result.detail) console.log(`    ${DIM}${result.detail}${RESET}`);
  }
}

/* ── the stats RPC the dashboard calls ──────────────────────────────────── */

if (schemaReady) {
  try {
    const response = await fetch(`${url}/rest/v1/rpc/lead_stats`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_site: null }),
    });

    if (response.ok) {
      const [row] = await response.json();
      console.log(ok(`Function ${BOLD}lead_stats${RESET} works — ${row?.total ?? 0} enquiries stored.`));
    } else {
      console.log(bad(`Function ${BOLD}lead_stats${RESET} failed (${response.status}).`));
      schemaReady = false;
    }
  } catch (error) {
    console.log(bad(`Function ${BOLD}lead_stats${RESET} is unreachable: ${error.message}`));
    schemaReady = false;
  }
}

/* ── verdict ────────────────────────────────────────────────────────────── */

console.log("");

if (schemaReady) {
  console.log(ok(`${BOLD}Backend is ready.${RESET} The app will use Supabase instead of the local file store.`));
  console.log(`${DIM}  Public forms post to /api/leads; the portal lives at /admin.${RESET}\n`);
  process.exit(0);
}

console.log(bad(`${BOLD}The schema is not ready.${RESET}`));
console.log(
  `  Open your Supabase project → SQL Editor → paste ${BOLD}supabase/schema.sql${RESET} → Run,\n` +
    `  then re-run ${BOLD}npm run db:check${RESET}.\n`,
);
process.exit(1);
