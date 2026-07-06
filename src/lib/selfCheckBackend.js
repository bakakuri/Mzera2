// Read-only backend checks for the admin panel's system-check page — these
// hit the live Supabase project with the same anon/authenticated client the
// app already uses, so they respect RLS exactly like real traffic. Every
// check is a plain SELECT (head:true where possible, no rows fetched); none
// insert/update/delete anything, so they're safe to run against production.
//
// The main thing this catches that selfCheck.js (pure-logic checks) can't:
// migrations that were delivered as a .sql file but never actually run
// against the live project — a recurring failure mode for this app, since
// schema changes ship as standalone files the admin has to apply by hand.
import { supabase, hasSupabase } from "./supabase";

const TABLES = [
  "profiles", "posts", "messages", "conversations", "follows", "notifications",
  "reports", "user_locations", "lang_word_progress", "app_settings", "profile_views",
  "film_reviews", "film_watch",
];

async function pingTable(table) {
  const { error } = await supabase.from(table).select("*", { count: "exact", head: true });
  return { name: `ცხრილი "${table}" არსებობს და readable-ია`, pass: !error, error: error ? error.message : undefined };
}

async function pingColumn(table, column, label) {
  const { error } = await supabase.from(table).select(column).limit(1);
  return { name: label, pass: !error, error: error ? error.message : undefined };
}

export async function runBackendChecks() {
  if (!hasSupabase) {
    return [{ name: "Supabase კონფიგურირებულია (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)", pass: false, error: "გარემოს ცვლადები არ არის დაყენებული — აპი demo რეჟიმშია" }];
  }

  const results = [{ name: "Supabase კონფიგურირებულია", pass: true }];

  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
  results.push({ name: "ავტორიზაციის სესია აქტიურია", pass: !sessionErr && !!sessionData.session, error: sessionErr ? sessionErr.message : undefined });

  const tableResults = await Promise.all(TABLES.map(pingTable));
  results.push(...tableResults);

  results.push(await pingColumn("conversations", "pinned_message_id", 'სვეტი "conversations.pinned_message_id" არსებობს (pin-ის მიგრაცია)'));

  return results;
}
