import { useState, useEffect, useRef } from "react";
import { notifsApi, mapDbNotif, pushNotif, ensureNotifPerm, notifVerb, USERS, t } from "../ui/core";

// which Settings > Notifications toggle gates a push for each type; types
// missing here (post_tag/group_post/group_join_request/event_rsvp/birthday/
// level_up/market_review/announcement/public_approved/public_rejected)
// always push — there's no dedicated toggle for them yet.
const PUSH_GATE = {
  like: "nLikes", reel_like: "nLikes", story_like: "nLikes", comment_like: "nLikes",
  comment: "nComments", reply: "nComments", thread_reply: "nComments", thread_activity: "nComments", reel_comment: "nComments", story_comment: "nComments",
  follow: "nFollows",
  mention: "nMentions",
  profile_view: "nProfileViews",
};

export function useNotifications({ session, live, settings }) {
  const [notifs, setNotifs] = useState([]);
  const settingsRef = useRef(settings); settingsRef.current = settings;

  const loadNotifs = async () => { try { const rows = await notifsApi.list(); setNotifs(rows.map(mapDbNotif)); } catch (e) {} };

  useEffect(() => {
    if (!session) return;
    ensureNotifPerm();
    const ch = notifsApi.subscribe(session.user.id, (row) => {
      loadNotifs();
      const gate = PUSH_GATE[row.type];
      if (gate && settingsRef.current && settingsRef.current[gate] === false) return;
      const who = USERS[row.from_id];
      pushNotif((who && who.name) ? who.name : "mzera 🔔", notifVerb(row.type) || t("notif.fallback"));
    });
    return () => { try { ch.unsubscribe(); } catch (e) {} };
  }, [live, session]);

  const unreadNotifs = notifs.filter(n => !n.read).length;

  return { notifs, setNotifs, loadNotifs, unreadNotifs };
}
