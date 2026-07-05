import { useState, useRef, useEffect } from "react";
import { chatApi, mapDbMsg, toDbMsg, mergeProfile, hasSupabase, USERS, ME, pushNotif, REPLIES, t } from "../ui/core";

const lsGet = (k, def) => { try { const v = typeof localStorage !== "undefined" && localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } };
const lsSet = (k, v) => { try { if (typeof localStorage !== "undefined") localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

export function useChat({ live, session, flash, dbErr, setDbError, setTab, onIncoming }) {
  const [convos, setConvos] = useState([]);
  const [openConvoId, setOpenConvoId] = useState(null);
  const [peerReadAt, setPeerReadAt] = useState(null);
  const [chatReactions, setChatReactions] = useState({});
  const [mutedConvoIds, setMutedConvoIds] = useState(() => lsGet("mz_muted_convos", []));
  const openRef = useRef(openConvoId);
  const mutedRef = useRef(mutedConvoIds); mutedRef.current = mutedConvoIds;
  const chanRef = useRef([]);
  const callRef = useRef(null);
  const onIncomingRef = useRef(onIncoming); onIncomingRef.current = onIncoming;
  const toggleMuteConvo = (cid) => setMutedConvoIds(ids => { const next = ids.includes(cid) ? ids.filter(x => x !== cid) : [...ids, cid]; lsSet("mz_muted_convos", next); return next; });

  const startCall = (uid, video) => { if (callRef.current) callRef.current.startCall({ id: uid, name: (USERS[uid] && USERS[uid].name) || "" }, video); };

  const loadConvos = async () => {
    try {
      const rows = await chatApi.conversations();
      const mapped = rows.map(r => {
        const profs = (r.members || []).map(mm => mm.profiles).filter(Boolean);
        profs.forEach(mergeProfile);
        const memberIds = profs.map(p => p.id).filter(id => id !== ME);
        const msgs = (r.messages || []).slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map(mapDbMsg);
        return { id: r.id, members: memberIds, isGroup: r.is_group, name: r.name, unread: 0, messages: msgs, pinnedMessageId: r.pinned_message_id || null };
      });
      mapped.sort((a, b) => { const la = a.messages[a.messages.length - 1], lb = b.messages[b.messages.length - 1]; return new Date(lb?._ts || 0) - new Date(la?._ts || 0); });
      setConvos(mapped);
    } catch (e) { console.error("convos:", e); setDbError("convos: " + (e.message || JSON.stringify(e)) + (e.hint ? " · hint: " + e.hint : "") + (e.code ? " · code: " + e.code : "")); }
  };

  useEffect(() => { openRef.current = openConvoId; }, [openConvoId]);
  useEffect(() => { if (openConvoId) setConvos(cs => cs.map(c => c.id === openConvoId ? { ...c, unread: 0 } : c)); }, [openConvoId]);
  useEffect(() => {
    if (!openConvoId || !hasSupabase) { setPeerReadAt(null); setChatReactions({}); return; }
    let cancelled = false;
    chatApi.peerRead(openConvoId).then(ts => { if (!cancelled) setPeerReadAt(ts); }).catch(() => {});
    const conv = convos.find(c => c.id === openConvoId);
    const ids = conv ? conv.messages.map(m => m.id).filter(Boolean) : [];
    if (ids.length) chatApi.reactionsFor(ids).then(rows => { if (cancelled) return; const map = {}; rows.forEach(r => { (map[r.message_id] = map[r.message_id] || {})[r.user_id] = r.emoji; }); setChatReactions(map); }).catch(() => {});
    else setChatReactions({});
    return () => { cancelled = true; };
  }, [openConvoId]);
  const onMarkRead = (cid) => { if (hasSupabase) chatApi.markRead(cid).catch(() => {}); };
  const onReactMsg = (messageId, emoji) => { if (hasSupabase) chatApi.react(messageId, emoji).catch(dbErr("რეაქცია")); };

  const convIdsKey = convos.map(c => c.id).join(",");
  useEffect(() => {
    chanRef.current.forEach(ch => { try { ch.unsubscribe(); } catch (e) {} });
    chanRef.current = convos.map(c => chatApi.subscribe(c.id, (evt, row, oldRow) => {
      if (evt === "INSERT") {
        const m = mapDbMsg(row);
        if (!m.fromMe && openRef.current !== c.id && !mutedRef.current.includes(c.id)) {
          const other = USERS[m.from];
          const name = (other && other.name) ? other.name : t("chat.newMessage");
          const preview = m.type === "text" ? m.text : m.type === "image" ? t("msg.photo") : m.type === "voice" ? t("msg.voice") : m.type === "doc" ? (t("msg.file") + t("msg.fileFallback")) : m.type === "location" ? t("msg.location") : t("chat.newMessage");
          pushNotif(name, preview);
          if (onIncomingRef.current) onIncomingRef.current(`${name}: ${preview}`);
        }
        setConvos(cs => cs.map(x => {
          if (x.id !== c.id) return x;
          if (x.messages.some(z => z.id === m.id)) return x;
          const isOpen = openRef.current === c.id;
          return { ...x, messages: [...x.messages, m], unread: (isOpen || m.fromMe) ? x.unread : x.unread + 1 };
        }));
      } else if (evt === "UPDATE") {
        const m = mapDbMsg(row);
        setConvos(cs => cs.map(x => x.id !== c.id ? x : { ...x, messages: x.messages.map(z => z.id === m.id ? { ...z, ...m } : z) }));
      } else if (evt === "DELETE") {
        const did = oldRow && oldRow.id;
        if (did) setConvos(cs => cs.map(x => x.id !== c.id ? x : { ...x, messages: x.messages.filter(z => z.id !== did) }));
      } else if (evt === "CONV_UPDATE") {
        setConvos(cs => cs.map(x => x.id !== c.id ? x : { ...x, pinnedMessageId: row.pinned_message_id || null }));
      }
    }));
    return () => { chanRef.current.forEach(ch => { try { ch.unsubscribe(); } catch (e) {} }); chanRef.current = []; };
  }, [live, convIdsKey]);

  const onSendMsg = (cid, partial) => { chatApi.send(cid, toDbMsg(partial)).catch((e) => { console.error("შეტყობინება", e); flash(t("toast.messageSendFailed")); }); };
  const onEditMsg = (cid, mid, text) => { setConvos(cs => cs.map(c => c.id === cid ? { ...c, messages: c.messages.map(m => m.id === mid ? { ...m, text, edited: true } : m) } : c)); chatApi.editMessage(mid, text).catch(dbErr("რედაქტირება")); };
  const onDeleteMsg = (cid, mid) => { setConvos(cs => cs.map(c => c.id === cid ? { ...c, messages: c.messages.filter(m => m.id !== mid) } : c)); chatApi.deleteMessage(mid).catch(dbErr("წაშლა")); };
  const onDeleteConvo = (cid) => { setOpenConvoId(null); setConvos(cs => cs.filter(c => c.id !== cid)); chatApi.deleteConversation(cid).then(() => flash(t("toast.convoDeleted"))).catch(dbErr("მიმოწერის წაშლა")); };
  const onPinMessage = (cid, mid) => { setConvos(cs => cs.map(c => c.id === cid ? { ...c, pinnedMessageId: mid } : c)); chatApi.pinMessage(cid, mid).catch(dbErr("დაპინვა")); };
  const onUnpinMessage = (cid) => { setConvos(cs => cs.map(c => c.id === cid ? { ...c, pinnedMessageId: null } : c)); chatApi.unpinMessage(cid).catch(dbErr("დაპინვა")); };
  const onReply = (cid) => setConvos(cs => cs.map(c => { if (c.id !== cid) return c; const mem = c.members || (c.withId ? [c.withId] : []); const from = mem.length > 1 ? mem[Math.floor(Math.random() * mem.length)] : mem[0]; return { ...c, messages: [...c.messages, { id: "m" + Date.now() + Math.round(Math.random() * 777), fromMe: false, from, type: "text", text: REPLIES[Math.floor(Math.random() * REPLIES.length)], time: t("time.now") }] }; }));
  const onCreateConvo = (memberIds) => { const members = [...new Set(memberIds)].filter(x => x !== ME); const name = members.length > 1 ? members.map(m => (USERS[m]?.name || "").split(" ")[0]).join(", ") : null; chatApi.createConversation(members, name).then(async (conv) => { await loadConvos(); setOpenConvoId(conv.id); }).catch(dbErr("საუბარი")); return null; };
  const onMessageUser = (uid) => { setTab("messages"); const ex = convos.find(c => { const m = c.members || (c.withId ? [c.withId] : []); return m.length === 1 && m[0] === uid; }); setOpenConvoId(ex ? ex.id : onCreateConvo([uid])); };

  const unreadMsgs = convos.reduce((a, c) => a + c.unread, 0);

  return {
    convos, setConvos, openConvoId, setOpenConvoId, peerReadAt, chatReactions,
    callRef, startCall, loadConvos, onMarkRead, onReactMsg,
    onSendMsg, onEditMsg, onDeleteMsg, onDeleteConvo, onReply, onCreateConvo, onMessageUser,
    onPinMessage, onUnpinMessage,
    unreadMsgs, mutedConvoIds, toggleMuteConvo,
  };
}
