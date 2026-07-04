import { useState } from "react";
import { forumApi, mapDbThread, hasSupabase, ME, t } from "../ui/core";

export function useForum({ session, flash, dbErr, setDbError }) {
  const [threads, setThreads] = useState([]);
  const [pendingThread, setPendingThread] = useState(null);
  const [pendingThreadReplyId, setPendingThreadReplyId] = useState(null);

  const loadThreads = async () => { if (!hasSupabase || !session) return; try { const rows = await forumApi.list(); setThreads(rows.map(r => mapDbThread(r, session.user.id))); } catch (e) { console.error("forum:", e); setDbError("forum: " + (e.message || JSON.stringify(e)) + (e.hint ? " · hint: " + e.hint : "") + (e.code ? " · code: " + e.code : "")); } };
  const onThreadReply = (tId, text) => { setThreads(ts => ts.map(th => th.id === tId ? { ...th, replies: [...th.replies, { id: "tr" + Date.now(), authorId: ME, text, time: t("time.now"), likes: 0 }] } : th)); forumApi.reply(tId, text).catch(dbErr("პასუხი")); };
  const onThreadVote = (tId) => { setThreads(ts => ts.map(th => th.id === tId ? { ...th, likedByMe: !th.likedByMe, votes: th.votes + (th.likedByMe ? -1 : 1) } : th)); forumApi.toggleVote(tId).catch(dbErr("ხმა")); };
  const onNewThread = (d) => { flash(t("toast.threadPublished")); forumApi.create({ title: d.title, body: d.body, category: d.cat }).then(loadThreads).catch(dbErr("თემა")); };
  const onEditThread = (id, patch) => { setThreads(ts => ts.map(th => th.id === id ? { ...th, ...(patch.title != null ? { title: patch.title } : {}), ...(patch.body != null ? { body: patch.body } : {}), ...(patch.category != null ? { cat: patch.category } : {}) } : th)); forumApi.update(id, patch).then(loadThreads).then(() => flash(t("toast.threadUpdated"))).catch(dbErr("რედაქტირება")); };
  const onDeleteThread = (id) => { setThreads(ts => ts.filter(th => th.id !== id)); forumApi.remove(id).then(loadThreads).then(() => flash(t("toast.threadDeleted"))).catch(dbErr("წაშლა")); };

  return { threads, loadThreads, onThreadReply, onThreadVote, onNewThread, onEditThread, onDeleteThread, pendingThread, setPendingThread, pendingThreadReplyId, setPendingThreadReplyId };
}
