import { useState, useEffect } from "react";
import { profilesApi, postsApi, adminApi, mapDbPost, mergeProfile, hasSupabase, ME, USERS } from "../ui/core";

// Moderation queue (reports) + admin-only user/content management.
export function useAdmin({ tab, session, flash, dbErr, setXp, setPosts }) {
  const [allUsers, setAllUsers] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [pendingPublic, setPendingPublic] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [postCount, setPostCount] = useState(0);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    if (tab === "admin" && USERS[ME] && USERS[ME].admin && hasSupabase) {
      adminApi.stats().then(setAdminStats).catch(() => {});
      adminApi.pendingPublic().then(rows => { rows.forEach(r => { if (r.author) mergeProfile(r.author); }); setPendingPublic(rows.map(mapDbPost)); }).catch(() => {});
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

  const onReport = (id) => { setReports(r => [{ id: "r" + Date.now(), type: "post", targetId: id, reason: "მომხმარებლის რეპორტი", reporterId: ME, time: "ახლა", status: "open" }, ...r]); flash("გაგზავნილია მოდერაციაში ✓"); };
  const onResolve = (id) => setReports(r => r.map(x => x.id === id ? { ...x, status: "resolved" } : x));
  const onSetVerified = (id, v) => { setAllUsers(us => us.map(u => u.id === id ? { ...u, verified: v } : u)); if (USERS[id].id === id) USERS[id] = { ...USERS[id], verified: v }; profilesApi.update(id, { verified: v }).then(() => flash(v ? "ვერიფიცირებულია ✓" : "ვერიფიკაცია მოიხსნა")).catch(dbErr("ვერიფიკაცია")); };
  const onSetAdmin = (id, v) => { setAllUsers(us => us.map(u => u.id === id ? { ...u, is_admin: v } : u)); if (USERS[id].id === id) USERS[id] = { ...USERS[id], admin: v }; profilesApi.update(id, { is_admin: v }).then(() => flash(v ? "ადმინი დაინიშნა 🛡" : "ადმინი მოიხსნა")).catch(dbErr("admin")); };
  const onBanUser = (id, v) => { setAllUsers(us => us.map(u => u.id === id ? { ...u, banned: v } : u)); adminApi.setBanned(id, v).then(() => flash(v ? "მომხმარებელი დაიბლოკა 🚫" : "ბლოკი მოიხსნა ✓")).catch(dbErr("ბლოკი")); };
  const onGrantXp = (id, amount) => { setAllUsers(us => us.map(u => u.id === id ? { ...u, xp: (u.xp || 0) + amount } : u)); if (id === ME) setXp(x => x + amount); adminApi.grantXp(id, amount).then(() => flash(`+${amount} XP გადაეცა 🎁`)).catch(dbErr("XP")); };
  const onSetXp = (id, amount) => { const v = Math.max(0, amount | 0); setAllUsers(us => us.map(u => u.id === id ? { ...u, xp: v } : u)); if (id === ME) setXp(v); adminApi.setXp(id, v).then(() => flash("XP დაყენდა: " + v)).catch(dbErr("XP")); };
  const onDeleteUser = (id) => { setAllUsers(us => us.filter(u => u.id !== id)); adminApi.deleteUser(id).then(() => flash("მომხმარებელი სამუდამოდ წაიშალა 🗑")).catch(dbErr("მომხმარებლის წაშლა")); };
  const onBroadcast = (msg) => { if (!msg || !msg.trim()) return; adminApi.broadcast(msg.trim()).then(n => flash("📢 გაიგზავნა " + (n || 0) + " მომხმარებელთან")).catch(dbErr("broadcast")); };
  const onReviewPublic = (id, approve) => { setPendingPublic(pp => pp.filter(p => p.id !== id)); if (approve) setPosts(ps => ps.map(p => p.id === id ? { ...p, publicStatus: "approved" } : p)); adminApi.reviewPublic(id, approve).then(() => flash(approve ? "დამტკიცდა — საჯაროა ✅" : "უარყოფილია")).catch(dbErr("მოდერაცია")); };

  return {
    allUsers, adminStats, pendingPublic, userCount, postCount, reports,
    onReport, onResolve, onSetVerified, onSetAdmin, onBanUser, onGrantXp,
    onSetXp, onDeleteUser, onBroadcast, onReviewPublic,
  };
}
