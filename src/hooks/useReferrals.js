import { useState, useEffect } from "react";
import { profilesApi, mergeProfile, hasSupabase, t } from "../ui/core";

// invite/referral system: your own stable referral_code (assigned server-side
// at signup) + who you've brought in so far. Attribution + the XP bonus for
// both sides happen entirely in the handle_new_user() trigger at signup time
// (see supabase/schema.sql) — this hook only reads the result for the UI.
export function useReferrals({ session, flash }) {
  const [referralCode, setReferralCode] = useState(null);
  const [invitedCount, setInvitedCount] = useState(0);
  const [invitedUsers, setInvitedUsers] = useState([]);

  const loadReferrals = async () => {
    if (!hasSupabase || !session) return;
    try {
      const s = await profilesApi.myReferralStats();
      setReferralCode(s ? s.referral_code : null);
      setInvitedCount(s ? Number(s.invited_count) || 0 : 0);
    } catch (e) {}
    try {
      const rows = await profilesApi.myReferredUsers();
      rows.forEach(mergeProfile);
      setInvitedUsers(rows.map(r => r.id));
    } catch (e) {}
  };

  useEffect(() => { loadReferrals(); }, [session]);

  const inviteLink = referralCode ? `${typeof window !== "undefined" ? window.location.origin : ""}/?ref=${referralCode}` : "";

  const copyInviteLink = () => {
    if (!inviteLink) return;
    try { navigator.clipboard.writeText(inviteLink); flash && flash(t("toast.linkCopied")); }
    catch (e) { flash && flash(t("toast.linkCopyFailed")); }
  };

  return { referralCode, invitedCount, invitedUsers, inviteLink, loadReferrals, copyInviteLink };
}
