import { useState, useEffect } from "react";
import { profilesApi, postsApi, adminApi, reportsApi, languagesApi, storiesApi, mapDbPost, mapDbReport, mergeProfile, hasSupabase, ME, USERS, t } from "../ui/core";

// storiesApi.list()/listPlain() return raw (ungrouped) rows — exactly what
// moderation needs (one row per story to delete), unlike mapDbStories'
// grouped-by-author shape built for the story-ring UI.
const mapAdminStory = (r) => ({ id: r.id, authorId: r.author_id, image: r.image_url, text: r.text || "", closeFriends: !!r.close_friends, isBroadcast: !!r.is_broadcast, createdAt: r.created_at });

// Moderation queue (reports) + admin-only user/content management.
export function useAdmin({ tab, session, flash, dbErr, setXp, setPosts }) {
  const [allUsers, setAllUsers] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [dailyTrends, setDailyTrends] = useState([]);
  const [pendingPublic, setPendingPublic] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [postCount, setPostCount] = useState(0);
  const [reports, setReports] = useState([]);
  const [langEnabled, setLangEnabled] = useState(true);
  const [langProgress, setLangProgress] = useState([]);
  const [adminStories, setAdminStories] = useState([]);

  useEffect(() => {
    if (tab === "admin" && USERS[ME] && USERS[ME].admin && hasSupabase) {
      // each piece of the admin dashboard fails independently and reports
      // through dbErr (not just a generic toast) so a real failure shows the
      // actual message/hint/code in the ⚠ DB banner instead of a dead end
      adminApi.stats().then(setAdminStats).catch(dbErr ? dbErr("ადმინის სტატისტიკა") : () => flash && flash(t("toast.adminLoadFailed")));
      adminApi.dailyTrends().then(setDailyTrends).catch(dbErr ? dbErr("ადმინის ტრენდები") : () => flash && flash(t("toast.adminLoadFailed")));
      adminApi.pendingPublic().then(rows => { rows.forEach(r => { if (r.author) mergeProfile(r.author); }); setPendingPublic(rows.map(mapDbPost)); }).catch(dbErr ? dbErr("მოდერაციის რიგი") : () => flash && flash(t("toast.adminLoadFailed")));
      // benign: just leaves the languages toggle at its existing default, not worth alarming the admin over
      languagesApi.getSetting("languages_enabled").then(v => { if (v === false) setLangEnabled(false); }).catch(() => {});
      languagesApi.adminProgress().then(rows => { rows.forEach(r => { if (!USERS[r.user_id]) profilesApi.byIds([r.user_id]).then(ps => ps.forEach(mergeProfile)).catch(() => {}); }); setLangProgress(rows); }).catch(dbErr ? dbErr("ენების პროგრესი") : () => flash && flash(t("toast.adminLoadFailed")));
      reportsApi.list().then(rows => {
        const mapped = rows.map(mapDbReport);
        const missing = [...new Set(mapped.filter(r => r.type === "user" && (!USERS[r.targetId] || USERS[r.targetId].id !== r.targetId)).map(r => r.targetId))];
        const finish = () => setReports(mapped);
        if (missing.length) profilesApi.byIds(missing).then(ps => { ps.forEach(mergeProfile); finish(); }).catch(finish);
        else finish();
      }).catch(dbErr ? dbErr("რეპორტების სია") : () => flash && flash(t("toast.adminLoadFailed")));
      storiesApi.list().then(rows => { rows.forEach(r => { if (r.author) mergeProfile(r.author); }); setAdminStories(rows.map(mapAdminStory)); }).catch(dbErr ? dbErr("სთორების სია") : () => flash && flash(t("toast.adminLoadFailed")));
    }
  }, [tab]);

  useEffect(() => {
    if (!session) return;
    (async () => {
      try { const us = await profilesApi.all(50); us.forEach(mergeProfile); setAllUsers(us); } catch (e) {}
      try { setUserCount(await profilesApi.count()); } catch (e) {}
      try { setPostCount(await postsApi.count()); } catch (e) {}
    })();
  }, [session]);

  const onReport = (type, targetId, reason) => { reportsApi.create(type, targetId, reason || t("report.userReport")).then(() => flash(t("toast.sentToModerationQueue"))).catch(dbErr("რეპორტი")); };
  const onResolve = (id) => { setReports(r => r.map(x => x.id === id ? { ...x, status: "resolved" } : x)); reportsApi.resolve(id).catch(dbErr("რეპორტის დახურვა")); };
  const onSetVerified = (id, v) => { setAllUsers(us => us.map(u => u.id === id ? { ...u, verified: v } : u)); if (USERS[id].id === id) USERS[id] = { ...USERS[id], verified: v }; profilesApi.update(id, { verified: v }).then(() => flash(v ? t("toast.verified") : t("toast.unverified"))).catch(dbErr("ვერიფიკაცია")); };
  const onSetAdmin = (id, v) => { setAllUsers(us => us.map(u => u.id === id ? { ...u, is_admin: v } : u)); if (USERS[id].id === id) USERS[id] = { ...USERS[id], admin: v }; profilesApi.update(id, { is_admin: v }).then(() => flash(v ? t("toast.adminGranted") : t("toast.adminRevoked"))).catch(dbErr("admin")); };
  const onBanUser = (id, v) => { setAllUsers(us => us.map(u => u.id === id ? { ...u, banned: v } : u)); adminApi.setBanned(id, v).then(() => flash(v ? t("toast.userBanned") : t("toast.userUnbanned"))).catch(dbErr("ბლოკი")); };
  const onGrantXp = (id, amount) => { setAllUsers(us => us.map(u => u.id === id ? { ...u, xp: (u.xp || 0) + amount } : u)); if (id === ME) setXp(x => x + amount); adminApi.grantXp(id, amount).then(() => flash(`+${amount}` + t("toast.xpGrantedSuffix"))).catch(dbErr("XP")); };
  const onSetXp = (id, amount) => { const v = Math.max(0, amount | 0); setAllUsers(us => us.map(u => u.id === id ? { ...u, xp: v } : u)); if (id === ME) setXp(v); adminApi.setXp(id, v).then(() => flash(t("toast.xpSetPre") + v)).catch(dbErr("XP")); };
  const onDeleteUser = (id) => { setAllUsers(us => us.filter(u => u.id !== id)); adminApi.deleteUser(id).then(() => flash(t("toast.userDeletedForever"))).catch(dbErr("მომხმარებლის წაშლა")); };
  const onBroadcast = (msg) => { if (!msg || !msg.trim()) return; adminApi.broadcast(msg.trim()).then(n => flash(t("toast.broadcastSentPre") + (n || 0) + t("toast.broadcastSentPost"))).catch(dbErr("broadcast")); };
  const onReviewPublic = (id, approve) => { setPendingPublic(pp => pp.filter(p => p.id !== id)); if (approve) setPosts(ps => ps.map(p => p.id === id ? { ...p, publicStatus: "approved" } : p)); adminApi.reviewPublic(id, approve).then(() => flash(approve ? t("toast.publicApprovedNow") : t("toast.rejected"))).catch(dbErr("მოდერაცია")); };
  const onToggleLanguages = (v) => { setLangEnabled(v); languagesApi.setSetting("languages_enabled", v).catch(dbErr("ენების სწავლა")); };
  const onDeleteStory = (id) => { setAdminStories(ss => ss.filter(s => s.id !== id)); adminApi.deleteStory(id).then(() => flash(t("toast.storyDeletedAdmin"))).catch(dbErr("სთორის წაშლა")); };

  return {
    allUsers, adminStats, dailyTrends, pendingPublic, userCount, postCount, reports,
    langEnabled, langProgress, onToggleLanguages, adminStories, onDeleteStory,
    onReport, onResolve, onSetVerified, onSetAdmin, onBanUser, onGrantXp,
    onSetXp, onDeleteUser, onBroadcast, onReviewPublic,
  };
}
