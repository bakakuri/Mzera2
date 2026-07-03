#!/usr/bin/env node
// Static RLS audit: cross-references every .from("table").{select,insert,update,upsert,delete}(
// call in src/lib/api.js against the RLS policies actually defined in supabase/schema.sql.
//
// This exists because of a recurring class of bug found by hand this session: a table with
// no update/delete policy at all makes the corresponding app feature (edit a group, delete a
// reel, mark a conversation read, ...) silently do nothing — no error, just no effect. Re-run
// this after touching src/lib/api.js or supabase/schema.sql to catch that class of drift before
// it ships.
//
// This is a static, offline check against the files in this repo — it has no database
// credentials and cannot see the *live* Supabase project, so it can't catch a policy that
// was hand-edited in the dashboard and never brought back into schema.sql (ask separately
// whether schema.sql and the live project still agree).
//
// Usage: node scripts/check-rls.mjs   (exit code 1 if any gaps found)

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const apiPath = join(root, "src/lib/api.js");
const schemaPath = join(root, "supabase/schema.sql");

const apiSrc = readFileSync(apiPath, "utf8");
const schemaSrc = readFileSync(schemaPath, "utf8");

// ── 1) which operations does the app actually perform on each table? ──
const OPS = ["select", "insert", "update", "delete"];
const usage = new Map(); // table -> Set(ops) -> { op: [line, ...] }

const fromRe = /\.from\(["'](\w+)["']\)/g;
let m;
const fromHits = [];
while ((m = fromRe.exec(apiSrc))) fromHits.push({ table: m[1], index: m.index, end: m.index + m[0].length });

const opRe = /\.(select|insert|update|upsert|delete)\(/g;

for (let i = 0; i < fromHits.length; i++) {
  const { table, end } = fromHits[i];
  const windowEnd = i + 1 < fromHits.length ? fromHits[i + 1].index : Math.min(apiSrc.length, end + 800);
  const slice = apiSrc.slice(end, windowEnd);
  opRe.lastIndex = 0;
  let om;
  const opsHere = new Set();
  while ((om = opRe.exec(slice))) {
    const op = om[1];
    if (op === "upsert") { opsHere.add("insert"); opsHere.add("update"); }
    else opsHere.add(op);
  }
  if (!opsHere.size) continue;
  if (!usage.has(table)) usage.set(table, new Set());
  opsHere.forEach(o => usage.get(table).add(o));
}

// ── 2) which policies + RLS-enabled flags actually exist in schema.sql? ──
const policyRe = /create policy\s+\S+\s+on\s+public\.(\w+)\s+for\s+(select|insert|update|delete)/gi;
const policies = new Map(); // table -> Set(ops)
let pm;
while ((pm = policyRe.exec(schemaSrc))) {
  const [, table, op] = pm;
  if (!policies.has(table)) policies.set(table, new Set());
  policies.get(table).add(op.toLowerCase());
}

const rlsEnabledRe = /alter table\s+public\.(\w+)\s+enable row level security/gi;
const rlsEnabled = new Set();
let rm;
while ((rm = rlsEnabledRe.exec(schemaSrc))) rlsEnabled.add(rm[1]);

// plain SQL views inherit access control from their underlying base tables
// (no RLS/policy of their own to define), so they're not a real gap
const viewRe = /create\s+(?:or replace\s+)?view\s+public\.(\w+)/gi;
const views = new Set();
let vm;
while ((vm = viewRe.exec(schemaSrc))) views.add(vm[1]);

// ── 3) report ──
const tables = [...usage.keys()].sort();
let gaps = 0;
console.log(`Checked ${tables.length} tables referenced in src/lib/api.js against supabase/schema.sql\n`);

for (const table of tables) {
  if (views.has(table)) { console.log(`  ✅ ${table} (view)`); continue; }
  const used = usage.get(table);
  const have = policies.get(table) || new Set();
  const missing = [...used].filter(op => !have.has(op));
  const noRls = !rlsEnabled.has(table);
  if (!missing.length && !noRls) { console.log(`  ✅ ${table}`); continue; }
  gaps++;
  console.log(`  ❌ ${table}`);
  if (noRls) console.log(`       - no "alter table public.${table} enable row level security" found`);
  for (const op of missing) console.log(`       - used with .${op}(...) in api.js but no matching "for ${op}" policy exists`);
}

console.log();
if (gaps) {
  console.log(`${gaps} table(s) with a gap. If a mutation above is genuinely unused/dead code, ignore it — otherwise add the missing policy in supabase/schema.sql (and a migration file for the live project).`);
  process.exit(1);
} else {
  console.log("No gaps found — every operation used in api.js has a matching schema.sql policy.");
}
