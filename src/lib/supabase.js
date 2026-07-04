import { createClient } from "@supabase/supabase-js";

// .env-დან იკითხება (იხ. .env.example)
const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const url = typeof rawUrl === "string" ? rawUrl.trim() : "";
const anonKey = typeof rawKey === "string" ? rawKey.trim() : "";

// URL უნდა იწყებოდეს http(s)-ით და key საკმარისად გრძელი იყოს
const looksValid = /^https?:\/\//.test(url) && anonKey.length > 20;

let client = null;
if (looksValid) {
  try {
    client = createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
      realtime: { params: { eventsPerSecond: 10 } },
    });
  } catch (e) {
    // არასწორი მნიშვნელობების შემთხვევაში აპი არ ჩავარდეს — demo რეჟიმი
    console.error("[mzera] Supabase init ვერ მოხერხდა, demo რეჟიმი:", e);
    client = null;
  }
} else if (url || anonKey) {
  console.warn("[mzera] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY არასწორია — demo რეჟიმი.");
}

// თუ env არ არის/არასწორია, აპი მუშაობს demo რეჟიმში (in-memory).
export const hasSupabase = !!client;
export const supabase = client;
// exposed so storageApi.upload() can hit the Storage REST endpoint directly
// via XHR (for real upload-progress events — supabase-js's own
// storage.upload() uses fetch under the hood, which has no progress API).
export const supabaseUrl = url;
export const supabaseAnonKey = anonKey;
