import { useState } from "react";
import { forumApi, mapDbThread, hasSupabase, ME, t } from "../ui/core";

export function useForum({ session, flash, dbErr, setDbError }) {
  const [threads, setThreads] = useState([]);
  const [pendingThread, setPendingThread] = useState(null);
  const [pendingThreadReplyId, setPendingThreadReplyId] = useState(null);
  // opening a thread from search may reference one not yet in the loaded
  // list — splice it in so the detail view (matched by id) can find it
  const ensureThreadLoaded = (thread) => setThreads(ts => ts.some(th => th.id === thread.id) ? ts : [thread, ...ts]);

  const loadThreads = async () => { if (!hasSupabase || !session) return; try { const rows = await forumApi.list(); setThreads(rows.map(r => mapDbThread(r, session.user.id))); } catch (e) { console.error("forum:", e); setDbError("forum: " + (e.message || JSON.stringify(e)) + (e.hint ? " · hint: " + e.hint : "") + (e.code ? " · code: " + e.code : "")); } };
  const onThreadReply = (tId, text) => { setThreads(ts => ts.map(th => th.id === tId ? { ...th, replies: [...th.replies, { id: "tr" + Date.now(), authorId: ME, text, time: t("time.now"), likes: 0, likedByMe: false }] } : th)); forumApi.reply(tId, text).catch(dbErr("პასუხი")); };
  const onThreadVote = (tId, direction) => {
    setThreads(ts => ts.map(th => {
      if (th.id !== tId) return th;
      const newVote = th.myVote === direction ? 0 : direction;
      return { ...th, myVote: newVote, likedByMe: newVote > 0, votes: th.votes - th.myVote + newVote };
    }));
    forumApi.vote(tId, direction).catch(dbErr("ხმა"));
  };
  const onReplyVote = (tId, rId) => {
    setThreads(ts => ts.map(th => th.id !== tId ? th : { ...th, replies: th.replies.map(r => r.id === rId ? { ...r, likedByMe: !r.likedByMe, likes: r.likes + (r.likedByMe ? -1 : 1) } : r) }));
    forumApi.replyVote(rId).catch(dbErr("პასუხის ხმა"));
  };
  const onSetThreadPinned = (id, pinned) => { setThreads(ts => ts.map(th => th.id === id ? { ...th, pinned } : th)); forumApi.setPinned(id, pinned).catch(dbErr("დამაგრება")); };
  const onSetThreadLocked = (id, locked) => { setThreads(ts => ts.map(th => th.id === id ? { ...th, locked } : th)); forumApi.setLocked(id, locked).catch(dbErr("დაბლოკვა")); };
  const onNewThread = (d) => { flash(t("toast.threadPublished")); forumApi.create({ title: d.title, body: d.body, category: d.cat }).then(loadThreads).catch(dbErr("თემა")); };
  const onEditThread = (id, patch) => { setThreads(ts => ts.map(th => th.id === id ? { ...th, ...(patch.title != null ? { title: patch.title } : {}), ...(patch.body != null ? { body: patch.body } : {}), ...(patch.category != null ? { cat: patch.category } : {}) } : th)); forumApi.update(id, patch).then(loadThreads).then(() => flash(t("toast.threadUpdated"))).catch(dbErr("რედაქტირება")); };
  const onDeleteThread = (id) => { setThreads(ts => ts.filter(th => th.id !== id)); forumApi.remove(id).then(loadThreads).then(() => flash(t("toast.threadDeleted"))).catch(dbErr("წაშლა")); };

  return { threads, loadThreads, onThreadReply, onThreadVote, onReplyVote, onSetThreadPinned, onSetThreadLocked, onNewThread, onEditThread, onDeleteThread, pendingThread, setPendingThread, pendingThreadReplyId, setPendingThreadReplyId, ensureThreadLoaded };
}
