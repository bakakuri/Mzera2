import { useState } from "react";
import { forumApi, mapDbThread, hasSupabase, ME } from "../ui/core";

export function useForum({ session, flash, dbErr, setDbError }) {
  const [threads, setThreads] = useState([]);

  const loadThreads = async () => { if (!hasSupabase || !session) return; try { const rows = await forumApi.list(); setThreads(rows.map(r => mapDbThread(r, session.user.id))); } catch (e) { console.error("forum:", e); setDbError("forum: " + (e.message || JSON.stringify(e)) + (e.hint ? " · hint: " + e.hint : "") + (e.code ? " · code: " + e.code : "")); } };
  const onThreadReply = (tId, text) => { setThreads(ts => ts.map(t => t.id === tId ? { ...t, replies: [...t.replies, { id: "tr" + Date.now(), authorId: ME, text, time: "ახლა", likes: 0 }] } : t)); forumApi.reply(tId, text).catch(dbErr("პასუხი")); };
  const onThreadVote = (tId) => { setThreads(ts => ts.map(t => t.id === tId ? { ...t, likedByMe: !t.likedByMe, votes: t.votes + (t.likedByMe ? -1 : 1) } : t)); forumApi.toggleVote(tId).catch(dbErr("ხმა")); };
  const onNewThread = (d) => { flash("თემა გამოქვეყნდა 🎉"); forumApi.create({ title: d.title, body: d.body, category: d.cat }).then(loadThreads).catch(dbErr("თემა")); };
  const onEditThread = (id, patch) => { setThreads(ts => ts.map(t => t.id === id ? { ...t, ...(patch.title != null ? { title: patch.title } : {}), ...(patch.body != null ? { body: patch.body } : {}), ...(patch.category != null ? { cat: patch.category } : {}) } : t)); forumApi.update(id, patch).then(loadThreads).then(() => flash("თემა განახლდა ✏️")).catch(dbErr("რედაქტირება")); };
  const onDeleteThread = (id) => { setThreads(ts => ts.filter(t => t.id !== id)); forumApi.remove(id).then(loadThreads).then(() => flash("თემა წაიშალა")).catch(dbErr("წაშლა")); };

  return { threads, loadThreads, onThreadReply, onThreadVote, onNewThread, onEditThread, onDeleteThread };
}
