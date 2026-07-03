import { useState, useEffect } from "react";
import { notifsApi, mapDbNotif, pushNotif, ensureNotifPerm, NOTIF_VERB, USERS } from "../ui/core";

export function useNotifications({ session, live }) {
  const [notifs, setNotifs] = useState([]);

  const loadNotifs = async () => { try { const rows = await notifsApi.list(); setNotifs(rows.map(mapDbNotif)); } catch (e) {} };

  useEffect(() => {
    if (!session) return;
    ensureNotifPerm();
    const ch = notifsApi.subscribe(session.user.id, (row) => { loadNotifs(); const who = USERS[row.from_id]; pushNotif((who && who.name) ? who.name : "mzera 🔔", NOTIF_VERB[row.type] || "ახალი აქტივობა"); });
    return () => { try { ch.unsubscribe(); } catch (e) {} };
  }, [live, session]);

  const unreadNotifs = notifs.filter(n => !n.read).length;

  return { notifs, setNotifs, loadNotifs, unreadNotifs };
}
