import { useState } from "react";

// Central toast + DB-error banner. flash() shows a brief bottom toast;
// dbErr(label) returns a .catch() handler that either flashes a quick
// "slow down" message for rate limits or surfaces the full error banner.
export function useToast() {
  const [toast, setToast] = useState(null);
  const [dbError, setDbError] = useState(null);

  const flash = (t) => { setToast(t); setTimeout(() => setToast(null), 1800); };
  const dbErr = (label) => (e) => {
    console.error(label, e);
    if (e && (e.message || "").includes("rate_limit")) { flash("ნელა 🐢 ცოტა ხანში სცადე"); return; }
    setDbError(label + ": " + (e && (e.message || JSON.stringify(e))) + (e && e.hint ? " · hint: " + e.hint : "") + (e && e.code ? " · code: " + e.code : ""));
  };

  return { toast, flash, dbError, setDbError, dbErr };
}
