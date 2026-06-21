import { createClient } from "@supabase/supabase-js";

// .env-დან იკითხება (იხ. .env.example)
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// თუ env არ არის გაწერილი, აპი მუშაობს demo რეჟიმში (in-memory data).
export const hasSupabase = Boolean(url && anonKey);

export const supabase = hasSupabase
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
      realtime: { params: { eventsPerSecond: 10 } },
    })
  : null;
