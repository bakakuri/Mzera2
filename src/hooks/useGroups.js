import { useState } from "react";
import { groupsApi, eventsApi, postsApi, mapDbGroup, mapDbEvent, mapDbPost, hasSupabase, t } from "../ui/core";

// hydrateMerge is owned by useFeed (it patches reactions/comments/saves/shared
// preview onto raw post rows and merges them into the shared `posts` array) —
// group posts reuse it so a freshly-created group post shows up fully hydrated.
export function useGroups({ session, flash, dbErr, setDbError, gainXp, hydrateMerge }) {
  const [groups, setGroups] = useState([]);
  const [events, setEvents] = useState([]);
  const [pendingGroup, setPendingGroup] = useState(null);

  const loadGroups = async () => { if (!hasSupabase || !session) return; try { const rows = await groupsApi.list(); setGroups(rows.map(r => mapDbGroup(r, session.user.id))); } catch (e) { console.error("groups:", e); setDbError("groups: " + (e.message || JSON.stringify(e)) + (e.hint ? " · hint: " + e.hint : "") + (e.code ? " · code: " + e.code : "")); } };
  const loadEvents = async () => { if (!hasSupabase || !session) return; try { const rows = await eventsApi.list(); setEvents(rows.map(r => mapDbEvent(r, session.user.id))); } catch (e) { console.error("events:", e); setDbError("events: " + (e.message || JSON.stringify(e)) + (e.hint ? " · hint: " + e.hint : "") + (e.code ? " · code: " + e.code : "")); } };

  const onJoinGroup = (id) => {
    const g = groups.find(x => x.id === id); if (!g) return;
    if (g.joined || g.pending) { setGroups(gs => gs.map(x => x.id === id ? { ...x, joined: false, pending: false, members: x.members - (x.joined ? 1 : 0) } : x)); groupsApi.leave(id).catch(dbErr("ჯგუფი")); return; }
    if (g.isPrivate) { setGroups(gs => gs.map(x => x.id === id ? { ...x, pending: true } : x)); flash(t("toast.requestSent")); groupsApi.requestJoin(id, true).catch(dbErr("მოთხოვნა")); }
    else { setGroups(gs => gs.map(x => x.id === id ? { ...x, joined: true, members: x.members + 1 } : x)); gainXp(20); flash(t("toast.joinedGroup")); groupsApi.requestJoin(id, false).catch(dbErr("შეერთება")); }
  };
  const onRsvp = (id, v) => { setEvents(es => es.map(e => e.id === id ? { ...e, going: e.going + ((e.rsvp === "going" ? -1 : 0) + (v === "going" ? 1 : 0)), rsvp: v } : e)); eventsApi.rsvp(id, v).catch(dbErr("rsvp")); };
  const onCreateGroup = (d) => { gainXp(10); groupsApi.create(d).then(loadGroups).then(() => flash(t("toast.groupCreated"))).catch(dbErr("ჯგუფის შექმნა")); };
  const onCreateEvent = (d) => { gainXp(10); eventsApi.create(d).then(loadEvents).then(() => flash(t("toast.eventCreated"))).catch(dbErr("ივენთის შექმნა")); };

  const mergeGroupPosts = async (gid) => { try { const rows = await postsApi.forGroup(gid); await hydrateMerge(rows.map(mapDbPost)); } catch (e) { flash && flash(t("toast.groupPostsLoadFailed")); } };
  const onGroupPost = (gid, payload) => { gainXp(8); flash(t("toast.publishedInGroup")); postsApi.create({ text: payload.text, images: payload.images || (payload.imageUrl ? [payload.imageUrl] : null), poll: payload.poll, group_id: gid, video_url: payload.video || null, bg: payload.bg || null, feeling: payload.feeling || null, location: payload.location || null, tagged: payload.tagged || null }).then(() => mergeGroupPosts(gid)).catch(dbErr("ჯგუფის პოსტი")); };
  const onApproveMember = (gid, uid2) => { groupsApi.approve(gid, uid2).then(() => { flash(t("toast.memberAdded")); loadGroups(); }).catch(dbErr("დადასტურება")); };
  const onKickMember = (gid, uid2) => { groupsApi.kick(gid, uid2).then(() => { flash(t("toast.memberRemoved")); loadGroups(); }).catch(dbErr("ამოშლა")); };
  const onSetGroupPrivate = (gid, val) => { setGroups(gs => gs.map(g => g.id === gid ? { ...g, isPrivate: val } : g)); groupsApi.setPrivate(gid, val).then(() => flash(val ? t("toast.groupNowPrivate") : t("toast.groupNowPublic"))).catch(dbErr("პარამეტრი")); };
  const onEditGroupPost = (id, text) => { setGroups(gs => gs.map(g => ({ ...g, posts: g.posts.map(p => p.id === id ? { ...p, text } : p) }))); groupsApi.updatePost(id, { text }).then(loadGroups).catch(dbErr("რედაქტირება")); };
  const onDeleteGroupPost = (id) => { setGroups(gs => gs.map(g => ({ ...g, posts: g.posts.filter(p => p.id !== id) }))); groupsApi.removePost(id).then(loadGroups).catch(dbErr("წაშლა")); };
  const onEditGroup = (id, patch) => { groupsApi.update(id, patch).then(loadGroups).then(() => flash(t("toast.groupUpdated"))).catch(dbErr("რედაქტირება")); };
  const onDeleteGroup = (id) => { setGroups(gs => gs.filter(g => g.id !== id)); groupsApi.remove(id).then(loadGroups).then(() => flash(t("toast.groupDeleted"))).catch(dbErr("წაშლა")); };
  const onEditEvent = (id, patch) => { eventsApi.update(id, patch).then(loadEvents).then(() => flash(t("toast.eventUpdated"))).catch(dbErr("რედაქტირება")); };
  const onDeleteEvent = (id) => { setEvents(es => es.filter(e => e.id !== id)); eventsApi.remove(id).then(loadEvents).then(() => flash(t("toast.eventDeleted"))).catch(dbErr("წაშლა")); };

  return {
    groups, events, pendingGroup, setPendingGroup,
    loadGroups, loadEvents, onJoinGroup, onRsvp, onCreateGroup, onCreateEvent,
    mergeGroupPosts, onGroupPost, onApproveMember, onKickMember, onSetGroupPrivate,
    onEditGroupPost, onDeleteGroupPost, onEditGroup, onDeleteGroup, onEditEvent, onDeleteEvent,
  };
}
