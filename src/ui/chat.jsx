import { createPortal } from "react-dom";
import {
  useState, useEffect, useRef, Home, Search, Compass, PlusSquare, Send, Bell, User, Shield, Heart, MessageCircle, MessageSquare, Bookmark, MoreHorizontal, X, ArrowLeft, Hash, TrendingUp, Check, Trash2, Flag, Camera, Settings, AlertTriangle, ImageIcon, MapPin, Map, Link2, ShieldCheck, Plus, Minus, Menu, LogOut, HelpCircle, ChevronRight, ChevronDown, Zap, Sun, Moon, ShoppingBag, Tag, Star, Eye, Navigation, Users, Film, Mic, Play, Pause, Smile, FileText, Download, UserPlus, Trophy, Upload, Volume2, VolumeX, Pencil, CornerUpLeft, Copy, Reply, Pin, Forward, ChevronUp, authApi, profilesApi, postsApi, reactionsApi, commentsApi, followsApi, chatApi, notifsApi, storageApi, storiesApi, reelsApi, marketApi, groupsApi, eventsApi, forumApi, highlightsApi, presenceApi, locationsApi, pollsApi, hasSupabase, PAL, DARK, C, GBRAND, SH, card, DISPLAY, BODY, MONO, Mono, GRADS, hashIdx, img, catColor, FALLBACK_USER, _users, USERS, ME, fmtN, computeTrends, REPLIES, MARKET_CATS, FORUM_CATS, Pic, Avatar, Dot, Name, Handle, IconBtn, Pill, Wordmark, Title, Chips, renderText, Empty, ThemeToggle, REACTIONS, StoryRow, MiniPost, NewThread, Stars, Checkout, NewListing, GroupAvatar, waveOf, dl, VoiceMsg, DocMsg, EMOJIS, EmojiPanel, PeoplePicker, convMembers, convIsGroup, msgPreview, FollowBtn, FollowList, timeAgo, mergeProfile, mapDbPost, msgClock, mapDbMsg, toDbMsg, mapDbNotif, resolveImg, hydrateAuthors, mapDbStories, mapDbReel, mapDbThread, mapDbListing, mapDbReview, mapDbGroup, mapDbEvent, ConfigError, LoadingScreen, AuthScreen, HighlightCreate, HighlightView, ReelComments, pushNotif, ensureNotifPerm, levelInfo, kfmt, ReelCard, ReelCreate, GroupPost, MiniMap, Switch, SettingsSection, SettingsRow, STORY_STICKERS, setTheme, setME, compressImage, Phone, Video, t, UploadProgress,
} from "./core";
import { LinkPreview } from "./feed";

function applyReact(map, msgId, userId, emoji, removed) {
  const next = { ...map };
  const cur = { ...(next[msgId] || {}) };
  if (removed) delete cur[userId]; else cur[userId] = emoji;
  if (Object.keys(cur).length) next[msgId] = cur; else delete next[msgId];
  return next;
}

const lsGet = (k, def) => { try { const v = typeof localStorage !== "undefined" && localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } };
const lsSet = (k, v) => { try { if (typeof localStorage !== "undefined") localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

export function Messages({ convos, openId, setOpenId, onSend, onReply, onEditMsg, onDeleteMsg, onDeleteConvo, onCreateConvo, onOpenProfile, live, onMenu, groups, onOpenGroup, onlineIds, onMessageUser, onStartCall, peerReadAt, initialReactions, onMarkRead, onReactMsg, mutedConvoIds, onToggleMuteConvo, onPinMessage, onUnpinMessage }) {
  const [draft, setDraft] = useState(""); const [typing, setTyping] = useState(false);
  const [peerSeenTs, setPeerSeenTs] = useState(null);
  const [reactions, setReactions] = useState({});
  const [replyTo, setReplyTo] = useState(null); const [editing, setEditing] = useState(null); const [msgMenu, setMsgMenu] = useState(null); const [convMenu, setConvMenu] = useState(false); const [confirmDel, setConfirmDel] = useState(false);
  const lpRef = useRef(null); const inputRef = useRef(null); const lpFiredRef = useRef(false);
  const [recording, setRecording] = useState(false); const [recSecs, setRecSecs] = useState(0);
  const [attach, setAttach] = useState(null); const [emoji, setEmoji] = useState(false); const [picker, setPicker] = useState(null);
  const [listQ, setListQ] = useState("");
  const [atBottom, setAtBottom] = useState(true);
  const [chatSearchOpen, setChatSearchOpen] = useState(false); const [searchQ, setSearchQ] = useState(""); const [searchIdx, setSearchIdx] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [forwardMsg, setForwardMsg] = useState(null); const [forwardSel, setForwardSel] = useState([]);
  const scrollRef = useRef(null);
  const prevLenRef = useRef(0); const prevOpenIdRef = useRef(null);
  const typingChanRef = useRef(null); const typingTORef = useRef(null); const lastTypeRef = useRef(0);
  useEffect(() => { setDraft(openId ? lsGet(`mz_draft_${openId}`, "") : ""); }, [openId]);
  useEffect(() => {
    if (!openId) return;
    if (draft) lsSet(`mz_draft_${openId}`, draft);
    else try { localStorage.removeItem(`mz_draft_${openId}`); } catch (e) {}
  }, [draft]);
  useEffect(() => {
    setTyping(false);
    if (!openId || !live) return;
    const ch = chatApi.typingChannel(openId);
    ch.on("broadcast", { event: "typing" }, ({ payload }) => {
      if (!payload || payload.userId === ME) return;
      if (payload.typing) { setTyping(true); clearTimeout(typingTORef.current); typingTORef.current = setTimeout(() => setTyping(false), 3500); }
      else { setTyping(false); clearTimeout(typingTORef.current); }
    });
    ch.on("broadcast", { event: "seen" }, ({ payload }) => {
      if (!payload || payload.userId === ME || !payload.ts) return;
      setPeerSeenTs(prev => (!prev || payload.ts > prev) ? payload.ts : prev);
    });
    ch.on("broadcast", { event: "react" }, ({ payload }) => {
      if (!payload || payload.userId === ME || !payload.messageId) return;
      setReactions(prev => applyReact(prev, payload.messageId, payload.userId, payload.emoji, payload.removed));
    });
    ch.subscribe();
    typingChanRef.current = ch;
    return () => { try { ch.unsubscribe(); } catch (e) {} typingChanRef.current = null; clearTimeout(typingTORef.current); };
  }, [openId, live]);
  useEffect(() => { setPeerSeenTs(peerReadAt || null); }, [peerReadAt, openId]);
  useEffect(() => { setReactions(initialReactions || {}); }, [initialReactions, openId]);
  const toggleReact = (m, emoji) => {
    setMsgMenu(null);
    setReactions(prev => { const mine = prev[m.id] && prev[m.id][ME]; return applyReact(prev, m.id, ME, emoji, mine === emoji); });
    const wasMine = reactions[m.id] && reactions[m.id][ME] === emoji;
    onReactMsg && onReactMsg(m.id, emoji);
    const ch = typingChanRef.current;
    if (ch) { try { ch.send({ type: "broadcast", event: "react", payload: { userId: ME, messageId: m.id, emoji, removed: wasMine } }); } catch (e) {} }
  };
  const sendTyping = () => { const ch = typingChanRef.current; if (!ch) return; const now = Date.now(); if (now - lastTypeRef.current < 1500) return; lastTypeRef.current = now; try { ch.send({ type: "broadcast", event: "typing", payload: { userId: ME, typing: true } }); } catch (e) {} };
  const stopTyping = () => { const ch = typingChanRef.current; lastTypeRef.current = 0; if (ch) { try { ch.send({ type: "broadcast", event: "typing", payload: { userId: ME, typing: false } }); } catch (e) {} } };
  const photoInputRef = useRef(null); const docInputRef = useRef(null);
  const mediaRec = useRef(null); const chunks = useRef([]); const recStart = useRef(0);
  const [progress, setProgress] = useState(null);
  const [locBusy, setLocBusy] = useState(false);
  const uploading = progress != null || locBusy;
  const cv = convos.find(c => c.id === openId);
  const bottom = () => requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; });
  const scrollToMsg = (mid) => { const el = document.getElementById("msg-" + mid); if (el && el.scrollIntoView) el.scrollIntoView({ block: "center", behavior: "smooth" }); };
  const [vph, setVph] = useState(null);
  useEffect(() => {
    const vv = window.visualViewport; if (!vv) return;
    const onR = () => { setVph(vv.height); requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }); };
    onR(); vv.addEventListener("resize", onR); vv.addEventListener("scroll", onR);
    return () => { vv.removeEventListener("resize", onR); vv.removeEventListener("scroll", onR); };
  }, []);
  const onListScroll = () => {
    const el = scrollRef.current; if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  };
  useEffect(() => {
    if (openId !== prevOpenIdRef.current) {
      prevOpenIdRef.current = openId;
      prevLenRef.current = cv ? cv.messages.length : 0;
      setAtBottom(true);
      bottom();
      return;
    }
    const len = cv ? cv.messages.length : 0;
    const grew = len > prevLenRef.current;
    const lastMine = grew && cv.messages[len - 1].fromMe;
    prevLenRef.current = len;
    if (atBottom || lastMine) bottom();
  }, [cv?.messages.length, typing, openId, attach, emoji, vph]);
  useEffect(() => {
    if (!openId || !live || !cv || !cv.messages || !cv.messages.length) return;
    onMarkRead && onMarkRead(openId);
    const t = setTimeout(() => {
      const ch = typingChanRef.current;
      if (ch) { try { ch.send({ type: "broadcast", event: "seen", payload: { userId: ME, ts: new Date().toISOString() } }); } catch (e) {} }
    }, 280);
    return () => clearTimeout(t);
  }, [openId, live, cv?.messages.length]);
  useEffect(() => { if (!recording) return; const t = setInterval(() => setRecSecs(s => s + 1), 1000); return () => clearInterval(t); }, [recording]);
  useEffect(() => { setReplyTo(null); setEditing(null); setMsgMenu(null); setConvMenu(false); setConfirmDel(false); setChatSearchOpen(false); setSearchQ(""); setSearchIdx(0); setGalleryOpen(false); setForwardMsg(null); setForwardSel([]); }, [openId]);

  const afterSend = (id) => {};
  const sendText = () => { const t = draft.trim(); if (!t) return; stopTyping(); if (editing) { onEditMsg(cv.id, editing.id, t); setEditing(null); setDraft(""); setEmoji(false); return; } onSend(cv.id, { type: "text", text: t, reply_to: replyTo ? replyTo.id : undefined }); setDraft(""); setReplyTo(null); setEmoji(false); afterSend(cv.id); };
  const startEdit = (m) => { setMsgMenu(null); setEditing(m); setReplyTo(null); setDraft(m.text || ""); setEmoji(false); setAttach(null); setTimeout(() => inputRef.current && inputRef.current.focus(), 50); };
  const startReply = (m) => { setMsgMenu(null); setEditing(null); setReplyTo(m); setTimeout(() => inputRef.current && inputRef.current.focus(), 50); };
  const doDeleteMsg = (m) => { setMsgMenu(null); onDeleteMsg(cv.id, m.id); };
  const lpStart = (m) => { lpFiredRef.current = false; lpRef.current = setTimeout(() => { lpFiredRef.current = true; setMsgMenu(m); }, 420); };
  const lpEnd = () => { if (lpRef.current) { clearTimeout(lpRef.current); lpRef.current = null; } };
  const openImg = (url) => { if (lpFiredRef.current) { lpFiredRef.current = false; return; } window.open(url, "_blank"); };
  const sendMedia = (p) => { onSend(cv.id, p); setAttach(null); afterSend(cv.id); };
  const sendPhoto = async (file) => { if (!file) return; setAttach(null); setProgress(0); try { const url = await storageApi.upload(await compressImage(file), "chat", setProgress); onSend(cv.id, { type: "image", image: url }); } catch (e) {} setProgress(null); };
  const sendDoc = async (file) => { if (!file) return; setAttach(null); setProgress(0); try { const url = await storageApi.upload(file, "chat", setProgress); const kb = Math.round(file.size / 1024); const size = kb > 1024 ? (kb / 1024).toFixed(1) + " MB" : kb + " KB"; onSend(cv.id, { type: "doc", doc: { name: file.name, size, url } }); } catch (e) {} setProgress(null); };
  const sendLoc = () => { setAttach(null); if (!navigator.geolocation) { onSend(cv.id, { type: "location", place: t("chat.locationUnavailable") }); return; } setLocBusy(true); navigator.geolocation.getCurrentPosition((pos) => { const { latitude, longitude } = pos.coords; onSend(cv.id, { type: "location", place: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, mapUrl: `https://maps.google.com/?q=${latitude},${longitude}` }); setLocBusy(false); }, () => { setLocBusy(false); onSend(cv.id, { type: "location", place: t("chat.locationUnavailable") }); }, { enableHighAccuracy: true, timeout: 8000 }); };
  const startRec = async () => {
    setEmoji(false); setAttach(null); setRecSecs(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const cand = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
      const mime = cand.find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || "";
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunks.current = []; recStart.current = Date.now();
      mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if (mr._cancelled) { chunks.current = []; return; }
        const bt = mr.mimeType || mime || "audio/webm";
        const blob = new Blob(chunks.current, { type: bt });
        const dur = Math.max(1, Math.round((Date.now() - recStart.current) / 1000));
        setProgress(0);
        try { const ext = bt.includes("mp4") ? "mp4" : bt.includes("ogg") ? "ogg" : "webm"; const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: bt }); const url = await storageApi.upload(file, "chat", setProgress); onSend(cv.id, { type: "voice", dur, audioUrl: url }); } catch (e) {}
        setProgress(null);
      };
      mediaRec.current = mr; mr.start(250); setRecording(true);
    } catch (e) { setRecording(false); }
  };
  const sendVoice = () => { const mr = mediaRec.current; if (mr && mr.state !== "inactive") mr.stop(); setRecording(false); };
  const cancelRec = () => { const mr = mediaRec.current; if (mr && mr.state !== "inactive") { mr._cancelled = true; mr.stop(); } setRecording(false); };

  if (cv) {
    const members = convMembers(cv); const group = convIsGroup(cv); const other = USERS[members[0]];
    const startAdd = (sel) => { const id = onCreateConvo([...members, ...sel]); setPicker(null); setOpenId(id); };
    const isMuted = !!(mutedConvoIds && mutedConvoIds.includes(cv.id));
    const searchMatches = searchQ.trim() ? cv.messages.filter(m => m.type === "text" && m.text && m.text.toLowerCase().includes(searchQ.trim().toLowerCase())) : [];
    const currentMatchId = searchMatches[searchIdx] ? searchMatches[searchIdx].id : null;
    const goMatch = (delta) => {
      if (!searchMatches.length) return;
      const next = (searchIdx + delta + searchMatches.length) % searchMatches.length;
      setSearchIdx(next);
      scrollToMsg(searchMatches[next].id);
    };
    const pinnedMsg = cv.pinnedMessageId ? cv.messages.find(m => m.id === cv.pinnedMessageId) : null;
    const galleryImages = cv.messages.filter(m => m.type === "image");
    const doForwardSend = () => {
      const payload = { type: forwardMsg.type, text: forwardMsg.text, image: forwardMsg.image, audioUrl: forwardMsg.audioUrl, dur: forwardMsg.dur, doc: forwardMsg.doc, place: forwardMsg.place, mapUrl: forwardMsg.mapUrl };
      forwardSel.forEach(cid2 => onSend(cid2, payload));
      setForwardMsg(null); setForwardSel([]);
    };
    // top+bottom (no explicit height) lets the browser's native fixed-positioning stretch
    // this panel to fill exactly that gap on its own, tracking address-bar show/hide
    // correctly without any JS measurement or dvh (which — combined with an outer
    // ancestor that can end up creating a containing block, e.g. mid tab-transition —
    // was making the panel's computed height run long, pushing the input off past the
    // bottom of what's visible). Portalled straight to <body> so nothing above it in the
    // tree (transforms, filters, animations) can ever turn its "fixed" into something
    // sized relative to a smaller ancestor instead of the real viewport.
    return createPortal((
      <div className="fixed left-0 right-0 z-40 flex flex-col" style={{ background: C.paper, top: "var(--mz-hdr, 56px)", bottom: "var(--mz-nav, 60px)" }}>
        <div className="flex-1 min-h-0 flex flex-col w-full" style={{ maxWidth: 600, margin: "0 auto", background: C.paper, borderLeft: `1px solid ${C.line}`, borderRight: `1px solid ${C.line}` }}>
          <div className="flex items-center gap-3 px-3 py-2.5 shrink-0" style={{ background: C.surface + "f2", backdropFilter: "blur(14px)", borderBottom: `1px solid ${C.line}` }}>
            <button onClick={() => setOpenId(null)} className="active:scale-90" style={{ color: C.ink2 }}><ArrowLeft size={22} /></button>
            {group ? <GroupAvatar ids={members} size={40} /> : <button onClick={() => onOpenProfile(other.id)} className="relative active:scale-90"><Avatar id={other.id} size={38} />{other.online && <span className="absolute bottom-0 right-0"><Dot size={11} /></span>}</button>}
            <div className="leading-tight min-w-0 flex-1 overflow-hidden"><div className="flex items-center gap-1.5">{group ? <div className="font-bold truncate" style={{ color: C.ink }}>{cv.name}</div> : <div className="min-w-0"><Name id={other.id} className="text-[15px] max-w-full" /></div>}{isMuted && <VolumeX size={13} style={{ color: C.faint }} className="shrink-0" />}</div><div className="text-[12px] truncate" style={{ color: typing ? C.accent : group ? C.muted : (other.online ? C.online : C.faint) }}>{typing ? t("chat.typing") : group ? `${members.length + 1} ${t("chat.participants")}` : (other.online ? t("chat.online") : t("chat.lastSeenPre") + "2" + t("time.hour") + t("chat.hoursAgoSuffix"))}</div></div>
            <div className="flex items-center gap-0.5 shrink-0">
              {!group && onStartCall && other && (<><button onClick={() => onStartCall(other.id, false)} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 36, height: 36, color: C.ink2 }}><Phone size={19} /></button><button onClick={() => onStartCall(other.id, true)} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 36, height: 36, color: C.ink2 }}><Video size={20} /></button></>)}
              <button onClick={() => setChatSearchOpen(v => !v)} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 36, height: 36, color: chatSearchOpen ? C.accent : C.ink2 }} aria-label={t("chat.searchInChat")}><Search size={19} /></button>
              <div className="relative">
                <button onClick={() => setConvMenu(v => !v)} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 36, height: 36, color: C.ink2 }}><MoreHorizontal size={22} /></button>
                {convMenu && <><div className="fixed inset-0" style={{ zIndex: 10 }} onClick={() => setConvMenu(false)} /><div className="absolute right-0 z-20 rounded-xl overflow-hidden" style={{ top: "100%", marginTop: 4, background: C.surface, border: `1px solid ${C.line}`, boxShadow: "0 8px 24px rgba(0,0,0,.16)", minWidth: 200 }}><button onClick={() => { setConvMenu(false); setPicker("add"); }} className="w-full flex items-center gap-2.5 px-4 py-3 text-[14px] font-medium active:opacity-70" style={{ color: C.ink }}><UserPlus size={17} /> {t("chat.addPeople")}</button><button onClick={() => { setConvMenu(false); setGalleryOpen(true); }} className="w-full flex items-center gap-2.5 px-4 py-3 text-[14px] font-medium active:opacity-70" style={{ color: C.ink, borderTop: `1px solid ${C.line}` }}><ImageIcon size={17} /> {t("chat.viewMedia")}</button><button onClick={() => { setConvMenu(false); onToggleMuteConvo && onToggleMuteConvo(cv.id); }} className="w-full flex items-center gap-2.5 px-4 py-3 text-[14px] font-medium active:opacity-70" style={{ color: C.ink, borderTop: `1px solid ${C.line}` }}>{isMuted ? <Volume2 size={17} /> : <VolumeX size={17} />} {isMuted ? t("chat.unmute") : t("chat.mute")}</button><button onClick={() => { setConvMenu(false); setConfirmDel(true); }} className="w-full flex items-center gap-2.5 px-4 py-3 text-[14px] font-medium active:opacity-70" style={{ color: C.like, borderTop: `1px solid ${C.line}` }}><Trash2 size={17} /> {t("chat.deleteConvo")}</button></div></>}
              </div>
            </div>
          </div>

          {chatSearchOpen && (
            <div className="flex items-center gap-2 px-3 py-2 shrink-0" style={{ background: C.surface, borderBottom: `1px solid ${C.line}` }}>
              <Search size={16} style={{ color: C.faint }} />
              <input autoFocus value={searchQ} onChange={e => {
                const val = e.target.value; setSearchQ(val); setSearchIdx(0);
                const vq = val.trim().toLowerCase();
                const matches = vq ? cv.messages.filter(mm => mm.type === "text" && mm.text && mm.text.toLowerCase().includes(vq)) : [];
                if (matches.length) requestAnimationFrame(() => scrollToMsg(matches[0].id));
              }} placeholder={t("chat.searchInChat")} className="flex-1 bg-transparent outline-none text-[14px]" style={{ color: C.ink }} />
              {searchQ.trim() && <Mono style={{ fontSize: 12, color: C.faint }}>{searchMatches.length ? (searchIdx + 1) + "/" + searchMatches.length : "0"}</Mono>}
              <button onClick={() => goMatch(-1)} disabled={!searchMatches.length} className="active:scale-90" style={{ color: searchMatches.length ? C.ink2 : C.faint }}><ChevronUp size={18} /></button>
              <button onClick={() => goMatch(1)} disabled={!searchMatches.length} className="active:scale-90" style={{ color: searchMatches.length ? C.ink2 : C.faint }}><ChevronDown size={18} /></button>
              <button onClick={() => { setChatSearchOpen(false); setSearchQ(""); }} className="active:scale-90" style={{ color: C.faint }}><X size={18} /></button>
            </div>
          )}
          {pinnedMsg && (
            <button onClick={() => scrollToMsg(pinnedMsg.id)} className="flex items-center gap-2.5 px-3.5 py-2 w-full text-left shrink-0 active:opacity-80" style={{ background: C.accentSoft, borderBottom: `1px solid ${C.line}` }}>
              <Pin size={15} style={{ color: C.accent }} className="shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold" style={{ color: C.accent }}>{t("chat.pinnedMessage")}</div>
                <div className="text-[13px] truncate" style={{ color: C.ink2 }}>{pinnedMsg.type === "text" ? pinnedMsg.text : pinnedMsg.type === "image" ? t("msg.photo") : pinnedMsg.type === "voice" ? t("msg.voice") : pinnedMsg.type === "doc" ? t("chat.docWord") : t("msg.location")}</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onUnpinMessage && onUnpinMessage(cv.id); }} className="shrink-0 active:scale-90" style={{ color: C.faint }}><X size={16} /></button>
            </button>
          )}

          <div className="relative flex-1 min-h-0">
          <div ref={scrollRef} onScroll={onListScroll} className="h-full overflow-y-auto px-3 py-4 space-y-1.5">
            {cv.messages.length === 0 && <div className="flex flex-col items-center justify-center text-center py-12" style={{ color: C.faint }}><div className="rounded-2xl flex items-center justify-center mb-3" style={{ width: 56, height: 56, background: C.accentSoft }}><Send size={24} style={{ color: C.accent }} /></div><div className="text-[14px]">{t("chat.startConvo")}</div></div>}
            {cv.messages.map((m, i) => {
              const mine = m.fromMe; const prev = cv.messages[i - 1];
              const read = mine && peerSeenTs && m._ts && new Date(m._ts) <= new Date(peerSeenTs);
              const rx = reactions[m.id];
              const rxList = rx ? Object.entries(Object.values(rx).reduce((a, e) => { a[e] = (a[e] || 0) + 1; return a; }, {})) : [];
              const showSender = group && !mine && m.from && (!prev || prev.from !== m.from || prev.fromMe);
              const bubbleStyle = mine ? { backgroundImage: GBRAND, color: "#fff", borderRadius: "18px 18px 5px 18px" } : { background: C.surface, color: C.ink, border: `1px solid ${C.line}`, borderRadius: "18px 18px 18px 5px" };
              const tcol = mine ? "rgba(255,255,255,.72)" : C.faint;
              const isCurrentMatch = m.id === currentMatchId;
              const isPinned = m.id === cv.pinnedMessageId;
              return (
                <div key={m.id} id={"msg-" + m.id} className={"flex gap-2 " + (mine ? "justify-end" : "justify-start")}>
                  {group && !mine && <div className="shrink-0 self-end" style={{ width: 28 }}>{showSender && <button onClick={() => onOpenProfile(m.from)} className="active:scale-90"><Avatar id={m.from} size={28} /></button>}</div>}
                  <div className="max-w-[80%] flex flex-col rounded-2xl transition" style={{ alignItems: mine ? "flex-end" : "flex-start", WebkitUserSelect: "none", userSelect: "none", boxShadow: isCurrentMatch ? `0 0 0 2px ${C.accent}` : "none", padding: isCurrentMatch ? 2 : 0 }} onTouchStart={() => lpStart(m)} onTouchEnd={lpEnd} onTouchMove={lpEnd} onContextMenu={(e) => { e.preventDefault(); setMsgMenu(m); }}>
                    {isPinned && <div className="flex items-center gap-1 mb-0.5 px-1" style={{ color: C.accent }}><Pin size={11} /><span className="text-[10.5px] font-bold">{t("chat.pinnedMessage")}</span></div>}
                    {showSender && <span className="text-[11px] font-bold mb-0.5 px-1" style={{ color: GRADS[hashIdx(m.from, GRADS.length)][0] }}>{USERS[m.from].name.split(" ")[0]}</span>}
                    {m.replyTo && (() => { const tgt = cv.messages.find(x => x.id === m.replyTo); if (!tgt) return null; const who = tgt.fromMe ? t("chat.you") : (USERS[tgt.from] ? USERS[tgt.from].name.split(" ")[0] : t("word.user")); const prev = tgt.type === "text" ? (tgt.text || "") : tgt.type === "image" ? t("msg.photo") : tgt.type === "voice" ? t("msg.voice") : tgt.type === "doc" ? t("chat.docWord") : tgt.type === "location" ? t("msg.location") : t("word.message"); return <div className="px-2.5 py-1 mb-1 rounded-lg" style={{ background: mine ? "rgba(255,255,255,.16)" : C.surfaceMuted, borderLeft: `3px solid ${mine ? "rgba(255,255,255,.65)" : C.accent}`, maxWidth: 230 }}><div className="text-[11px] font-bold truncate" style={{ color: mine ? "rgba(255,255,255,.92)" : C.accent }}>{who}</div><div className="text-[12px] truncate" style={{ color: mine ? "rgba(255,255,255,.8)" : C.muted }}>{prev}</div></div>; })()}
                    {m.type === "image" ? (
                      <div className="relative" onClick={() => openImg(m.image)} style={{ cursor: "pointer" }}><Pic src={m.image} grad={GRADS[hashIdx(m.id, GRADS.length)]} round={16} style={{ width: 210, aspectRatio: "1" }} /><Mono className="block text-right mt-0.5" style={{ fontSize: 10, color: C.faint }}>{m.time}</Mono></div>
                    ) : m.type === "location" ? (
                      <button onClick={() => m.mapUrl && window.open(m.mapUrl, "_blank")} className="p-2 active:scale-[.98] text-left" style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, width: 224 }}><MiniMap h={110} /><div className="flex items-center justify-between mt-1.5"><div className="flex items-center gap-1.5 text-[13px]" style={{ color: C.ink2 }}><MapPin size={14} style={{ color: C.accent }} /> {m.place}</div><Mono style={{ fontSize: 10, color: C.faint }}>{m.time}</Mono></div></button>
                    ) : (
                      <>
                        <div className="px-3.5 py-2 text-[15px]" style={{ ...bubbleStyle, lineHeight: 1.4 }}>
                          {m.type === "voice" ? <VoiceMsg id={m.id} dur={m.dur} mine={mine} url={m.audioUrl} /> : m.type === "doc" ? <DocMsg doc={m.doc} mine={mine} /> : m.text}
                          <div className="text-right" style={{ marginTop: 2 }}><Mono style={{ fontSize: 10, color: tcol }}>{m.edited ? t("chat.editedPre") : ""}{m.time}{mine ? (read ? " ✓✓" : " ✓") : ""}</Mono></div>
                        </div>
                        {m.type === "text" && <LinkPreview text={m.text} compact />}
                      </>
                    )}
                    {rxList.length > 0 && <div className="flex gap-1 mt-1 flex-wrap" style={{ justifyContent: mine ? "flex-end" : "flex-start" }}>{rxList.map(([em, n]) => <span key={em} className="rounded-full px-1.5 py-0.5 text-[12px] flex items-center gap-0.5" style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SH.card }}>{em}{n > 1 && <span style={{ fontSize: 10, color: C.faint, fontFamily: MONO }}>{n}</span>}</span>)}</div>}
                  </div>
                </div>
              );
            })}
            {typing && <div className="flex justify-start"><div className="px-4 py-3 flex items-center gap-1.5" style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: "18px 18px 18px 5px" }}>{[0, 1, 2].map(i => <span key={i} className="rounded-full" style={{ width: 7, height: 7, background: C.faint, animation: "tdot 1.2s infinite", animationDelay: i * 0.18 + "s" }} />)}</div></div>}
            <div className="h-1" />
          </div>
          {!atBottom && <button onClick={() => { bottom(); setAtBottom(true); }} className="absolute right-4 z-10 rounded-full flex items-center justify-center active:scale-90" style={{ bottom: 16, width: 40, height: 40, background: C.surface, boxShadow: SH.card, color: C.accent, border: `1px solid ${C.line}` }} aria-label={t("chat.scrollToBottom")}><ChevronDown size={20} /></button>}
          </div>

          <input ref={photoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files && e.target.files[0]; if (f) sendPhoto(f); e.target.value = ""; }} />
          <input ref={docInputRef} type="file" style={{ display: "none" }} onChange={e => { const f = e.target.files && e.target.files[0]; if (f) sendDoc(f); e.target.value = ""; }} />
          {attach === "menu" && !recording && (
            <div style={{ background: C.surface, borderTop: `1px solid ${C.line}` }}>
              <div className="flex gap-3 p-4">
                {[["photo", ImageIcon, t("word.photo"), C.accent, () => photoInputRef.current && photoInputRef.current.click()], ["doc", FileText, t("word.document"), C.cyan, () => docInputRef.current && docInputRef.current.click()], ["loc", MapPin, t("word.location"), C.like, sendLoc]].map(([k, I, l, col, act]) => <button key={k} onClick={act} className="flex-1 flex flex-col items-center gap-2 py-3 rounded-2xl active:scale-95" style={{ background: C.surfaceMuted }}><div className="rounded-2xl flex items-center justify-center" style={{ width: 46, height: 46, background: col + "22" }}><I size={22} color={col} /></div><span className="text-[13px] font-semibold" style={{ color: C.ink2 }}>{l}</span></button>)}
              </div>
            </div>
          )}
          {progress != null ? <div className="px-4 py-2 shrink-0" style={{ background: C.surface, borderTop: `1px solid ${C.line}` }}><UploadProgress pct={progress} label={t("word.loading")} /></div> : locBusy && <div className="px-4 py-2 flex items-center gap-2 shrink-0" style={{ background: C.surface, borderTop: `1px solid ${C.line}` }}><span className="rounded-full" style={{ width: 8, height: 8, background: C.accent, animation: "tdot 1.2s infinite" }} /><Mono style={{ fontSize: 12, color: C.muted }}>{t("word.loading")}</Mono></div>}
          {emoji && !recording && <EmojiPanel onPick={(e) => setDraft(d => d + e)} />}
          {(replyTo || editing) && !recording && (() => { const m = editing || replyTo; const pv = m.type === "text" ? (m.text || "") : m.type === "image" ? t("msg.photo") : m.type === "voice" ? t("msg.voice") : m.type === "doc" ? t("chat.docWord") : t("msg.location"); return (
            <div className="flex items-center gap-2.5 px-3 py-2 shrink-0" style={{ background: C.surface, borderTop: `1px solid ${C.line}` }}>
              <div className="self-stretch rounded-full" style={{ width: 3, minHeight: 30, background: C.accent }} />
              {editing ? <Pencil size={16} style={{ color: C.accent }} /> : <CornerUpLeft size={16} style={{ color: C.accent }} />}
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-bold" style={{ color: C.accent }}>{editing ? t("chat.editing") : `${t("chat.replyAction")}${replyTo.fromMe ? " — " + t("chat.you") : (USERS[replyTo.from] ? " — " + USERS[replyTo.from].name.split(" ")[0] : "")}`}</div>
                <div className="text-[13px] truncate" style={{ color: C.muted }}>{pv}</div>
              </div>
              <button onClick={() => { setReplyTo(null); setEditing(null); setDraft(""); }} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 30, height: 30, color: C.ink2, background: C.surfaceMuted }}><X size={16} /></button>
            </div>
          ); })()}

          <div className="flex items-center gap-2 px-2.5 py-2.5 shrink-0" style={{ background: C.surface, borderTop: `1px solid ${C.line}`, paddingBottom: "0.625rem" }}>
            {recording ? (
              <>
                <button onClick={cancelRec} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 40, height: 40, color: C.like }}><Trash2 size={20} /></button>
                <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-full" style={{ background: C.likeSoft }}><span className="rounded-full" style={{ width: 10, height: 10, background: C.like, animation: "tdot 1.2s infinite" }} /><Mono className="font-bold" style={{ color: C.like }}>{Math.floor(recSecs / 60)}:{String(recSecs % 60).padStart(2, "0")}</Mono><span className="text-[13px]" style={{ color: C.like }}>{t("chat.recordingPh")}</span></div>
                <button onClick={sendVoice} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 42, height: 42, backgroundImage: GBRAND, color: "#fff", boxShadow: SH.glow }}><Send size={19} /></button>
              </>
            ) : (
              <>
                <button onClick={() => { setAttach(a => a ? null : "menu"); setEmoji(false); }} className="rounded-full flex items-center justify-center active:scale-90 transition" style={{ width: 40, height: 40, color: attach ? C.accent : C.ink2, transform: attach ? "rotate(45deg)" : "none" }}><Plus size={24} /></button>
                <button onClick={() => { setEmoji(e => !e); setAttach(null); }} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 38, height: 38, color: emoji ? C.accent : C.ink2 }}><Smile size={23} /></button>
                <input ref={inputRef} value={draft} onChange={e => { setDraft(e.target.value); sendTyping(); }} onKeyDown={e => { if (e.key === "Enter") sendText(); }} onFocus={() => { setEmoji(false); setAttach(null); }} placeholder={editing ? t("chat.editMsgPh") : t("chat.msgPh")} className="flex-1 px-4 py-2.5 rounded-full text-[15px] outline-none" style={{ background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` }} />
                {draft.trim() ? <button onClick={sendText} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 42, height: 42, backgroundImage: GBRAND, color: "#fff", boxShadow: SH.glow }}><Send size={19} /></button> : <button onClick={startRec} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 42, height: 42, background: C.surfaceMuted, color: C.accent }}><Mic size={20} /></button>}
              </>
            )}
          </div>
        </div>
        {picker === "add" && <PeoplePicker title={t("chat.addToChat")} cta={t("action.addShort")} exclude={members} onClose={() => setPicker(null)} onConfirm={startAdd} live={live} />}
        {msgMenu && (
          <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,.45)", paddingBottom: "var(--mz-nav, 64px)" }} onClick={() => setMsgMenu(null)}>
            <div className="w-full rounded-t-3xl pb-6 pt-2" style={{ background: C.paper, maxWidth: 600, margin: "0 auto", animation: "up .25s ease both" }} onClick={e => e.stopPropagation()}>
              <div className="mx-auto rounded-full mb-2" style={{ width: 38, height: 4, background: C.line }} />
              <div className="flex items-center justify-around px-3 pb-1">{["❤️", "😂", "👍", "🔥", "😮", "🙏"].map(em => { const active = reactions[msgMenu.id] && reactions[msgMenu.id][ME] === em; return <button key={em} onClick={() => toggleReact(msgMenu, em)} className="rounded-full flex items-center justify-center active:scale-90 transition" style={{ width: 44, height: 44, fontSize: 24, background: active ? C.accentSoft : "transparent" }}>{em}</button>; })}</div>
              <div style={{ height: 1, background: C.line, margin: "4px 0" }} />
              <button onClick={() => startReply(msgMenu)} className="w-full flex items-center gap-3 px-5 py-3.5 active:opacity-60" style={{ color: C.ink }}><CornerUpLeft size={20} style={{ color: C.accent }} /><span className="text-[15px] font-medium">{t("chat.replyAction")}</span></button>
              <button onClick={() => { setForwardMsg(msgMenu); setMsgMenu(null); }} className="w-full flex items-center gap-3 px-5 py-3.5 active:opacity-60" style={{ color: C.ink }}><Forward size={20} style={{ color: C.ink2 }} /><span className="text-[15px] font-medium">{t("chat.forward")}</span></button>
              <button onClick={() => { const already = cv.pinnedMessageId === msgMenu.id; const mid = msgMenu.id; setMsgMenu(null); if (already) onUnpinMessage && onUnpinMessage(cv.id); else onPinMessage && onPinMessage(cv.id, mid); }} className="w-full flex items-center gap-3 px-5 py-3.5 active:opacity-60" style={{ color: C.ink }}><Pin size={20} style={{ color: C.ink2 }} /><span className="text-[15px] font-medium">{cv.pinnedMessageId === msgMenu.id ? t("chat.unpin") : t("chat.pin")}</span></button>
              {msgMenu.type === "image" && <button onClick={() => { const u = msgMenu.image; setMsgMenu(null); window.open(u, "_blank"); }} className="w-full flex items-center gap-3 px-5 py-3.5 active:opacity-60" style={{ color: C.ink }}><Download size={20} style={{ color: C.ink2 }} /><span className="text-[15px] font-medium">{t("chat.openDownload")}</span></button>}
              {msgMenu.type === "text" && <button onClick={() => { try { navigator.clipboard && navigator.clipboard.writeText(msgMenu.text || ""); } catch (e) {} setMsgMenu(null); }} className="w-full flex items-center gap-3 px-5 py-3.5 active:opacity-60" style={{ color: C.ink }}><Copy size={20} style={{ color: C.ink2 }} /><span className="text-[15px] font-medium">{t("action.copy")}</span></button>}
              {msgMenu.fromMe && msgMenu.type === "text" && <button onClick={() => startEdit(msgMenu)} className="w-full flex items-center gap-3 px-5 py-3.5 active:opacity-60" style={{ color: C.ink }}><Pencil size={20} style={{ color: C.ink2 }} /><span className="text-[15px] font-medium">{t("post.edit")}</span></button>}
              {msgMenu.fromMe && <button onClick={() => doDeleteMsg(msgMenu)} className="w-full flex items-center gap-3 px-5 py-3.5 active:opacity-60" style={{ color: C.like }}><Trash2 size={20} /><span className="text-[15px] font-medium">{t("action.delete")}</span></button>}
              <button onClick={() => setMsgMenu(null)} className="w-full flex items-center justify-center px-5 py-3 mt-1 active:opacity-60" style={{ color: C.muted }}><span className="text-[15px] font-medium">{t("action.cancel")}</span></button>
            </div>
          </div>
        )}
        {confirmDel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,.5)" }} onClick={() => setConfirmDel(false)}>
            <div className="w-full rounded-3xl p-6" style={{ background: C.paper, maxWidth: 360, animation: "up .2s ease both" }} onClick={e => e.stopPropagation()}>
              <div className="rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, background: C.likeSoft }}><Trash2 size={26} style={{ color: C.like }} /></div>
              <div className="text-center text-[17px] font-bold mb-1" style={{ color: C.ink, fontFamily: DISPLAY }}>{t("chat.deleteConvoTitle")}</div>
              <div className="text-center text-[14px] mb-5" style={{ color: C.muted }}>{t("chat.deleteConvoMsg")}</div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDel(false)} className="flex-1 py-3 rounded-2xl font-semibold active:scale-95" style={{ background: C.surfaceMuted, color: C.ink2 }}>{t("action.cancel")}</button>
                <button onClick={() => { setConfirmDel(false); onDeleteConvo(cv.id); }} className="flex-1 py-3 rounded-2xl font-semibold text-white active:scale-95" style={{ background: C.like }}>{t("action.delete")}</button>
              </div>
            </div>
          </div>
        )}
        {galleryOpen && (
          <div className="fixed inset-0 z-50 flex flex-col" style={{ background: C.paper }}>
            <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ background: C.surface, borderBottom: `1px solid ${C.line}`, paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
              <button onClick={() => setGalleryOpen(false)} className="active:scale-90" style={{ color: C.ink2 }}><ArrowLeft size={22} /></button>
              <span className="font-bold text-[16px]" style={{ color: C.ink, fontFamily: DISPLAY }}>{t("chat.viewMedia")}</span>
            </div>
            {galleryImages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-[14px]" style={{ color: C.faint }}>{t("chat.noMediaYet")}</div>
            ) : (
              <div className="flex-1 overflow-y-auto p-1 grid grid-cols-3 gap-1 content-start">
                {galleryImages.map(gm => (
                  <button key={gm.id} onClick={() => window.open(gm.image, "_blank")} className="relative overflow-hidden active:opacity-80" style={{ aspectRatio: "1" }}>
                    <Pic src={gm.image} grad={GRADS[hashIdx(gm.id, GRADS.length)]} style={{ aspectRatio: "1" }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {forwardMsg && (
          <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,.45)" }} onClick={() => { setForwardMsg(null); setForwardSel([]); }}>
            <div className="w-full rounded-t-3xl pb-6 pt-2 flex flex-col" style={{ background: C.paper, maxWidth: 600, margin: "0 auto", maxHeight: "78vh", animation: "up .25s ease both" }} onClick={e => e.stopPropagation()}>
              <div className="mx-auto rounded-full mb-2 shrink-0" style={{ width: 38, height: 4, background: C.line }} />
              <div className="px-5 pb-3 font-bold text-[16px] shrink-0" style={{ color: C.ink, fontFamily: DISPLAY }}>{t("chat.forwardTo")}</div>
              <div className="flex-1 overflow-y-auto px-3">
                {convos.map(c2 => {
                  const mem2 = convMembers(c2); const grp2 = convIsGroup(c2); const o2 = USERS[mem2[0]];
                  const checked = forwardSel.includes(c2.id);
                  return (
                    <button key={c2.id} onClick={() => setForwardSel(s => checked ? s.filter(x => x !== c2.id) : [...s, c2.id])} className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl active:opacity-70">
                      {grp2 ? <GroupAvatar ids={mem2} size={42} /> : <Avatar id={o2.id} size={42} />}
                      <span className="flex-1 text-left text-[14px] font-semibold truncate" style={{ color: C.ink }}>{grp2 ? c2.name : o2.name}</span>
                      <div className="rounded-full flex items-center justify-center shrink-0" style={{ width: 22, height: 22, border: `2px solid ${checked ? C.accent : C.line}`, background: checked ? C.accent : "transparent" }}>{checked && <Check size={14} color="#fff" />}</div>
                    </button>
                  );
                })}
              </div>
              <div className="px-4 pt-3 shrink-0">
                <button onClick={doForwardSend} disabled={!forwardSel.length} className="w-full py-3 rounded-2xl font-bold text-white active:scale-[.98]" style={{ backgroundImage: GBRAND, opacity: forwardSel.length ? 1 : 0.4 }}>{t("chat.sendForward")}{forwardSel.length ? ` (${forwardSel.length})` : ""}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    ), document.body);
  }

  const startNew = (sel) => {
    setPicker(null);
    if (sel.length === 1) { const ex = convos.find(c => !convIsGroup(c) && convMembers(c)[0] === sel[0]); if (ex) { setOpenId(ex.id); return; } }
    setOpenId(onCreateConvo(sel));
  };
  return (
    <div className="pb-28 md:pb-8">
      <div className="shrink-0 py-3" style={{ background: C.surface, borderBottom: `1px solid ${C.lineSoft}` }}>
        <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar px-3">
          <button onClick={() => setPicker("new")} className="shrink-0 flex flex-col items-center gap-1.5" style={{ position: "sticky", left: 0, zIndex: 3, background: C.surface, paddingRight: 6 }}>
            <div className="rounded-full flex items-center justify-center" style={{ width: 62, height: 62, backgroundImage: GBRAND, color: "#fff", boxShadow: SH.glow }}><Plus size={28} /></div>
            <span className="text-[11px] font-semibold" style={{ color: C.accent }}>{t("word.new")}</span>
          </button>
          {(() => {
            const onlineUsers = (onlineIds || []).filter(id => id !== ME && USERS[id] && USERS[id].id === id);
            if (onlineUsers.length === 0) return <div className="flex items-center text-[12px]" style={{ color: C.faint }}>{t("chat.noOneOnlineNow")}</div>;
            return onlineUsers.map(id => (
              <button key={id} onClick={() => onMessageUser && onMessageUser(id)} className="shrink-0 flex flex-col items-center gap-1.5 active:scale-95" style={{ width: 66 }}>
                <div className="relative rounded-full" style={{ width: 62, height: 62, padding: 2.5, background: `linear-gradient(140deg, ${C.online}, ${C.cyan})` }}>
                  <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center" style={{ border: `2px solid ${C.surface}`, background: C.surface }}><Avatar id={id} size={52} /></div>
                  <span className="absolute bottom-0.5 right-0.5 rounded-full" style={{ width: 14, height: 14, background: C.online, border: `2.5px solid ${C.surface}` }} />
                </div>
                <span className="text-[11px] font-medium truncate w-full text-center" style={{ color: C.ink2 }}>{USERS[id].name.split(" ")[0]}</span>
              </button>
            ));
          })()}
        </div>
        <div className="px-4 pt-3">
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-full" style={{ background: C.surfaceMuted, border: `1px solid ${C.line}` }}>
            <Search size={16} style={{ color: C.faint }} />
            <input value={listQ} onChange={e => setListQ(e.target.value)} placeholder={t("chat.searchConvos")} className="flex-1 bg-transparent outline-none text-[14px]" style={{ color: C.ink }} />
            {listQ && <button onClick={() => setListQ("")} style={{ color: C.faint }}><X size={16} /></button>}
          </div>
        </div>
      </div>
      {convos.filter(c => {
        if (!listQ.trim()) return true;
        const q = listQ.trim().toLowerCase();
        if (convIsGroup(c)) return (c.name || "").toLowerCase().includes(q);
        const o = USERS[convMembers(c)[0]];
        return !!o && ((o.name || "").toLowerCase().includes(q) || (o.handle || "").toLowerCase().includes(q));
      }).map(c => { const members = convMembers(c); const group = convIsGroup(c); const other = USERS[members[0]]; const last = c.messages[c.messages.length - 1]; const muted = !!(mutedConvoIds && mutedConvoIds.includes(c.id)); return (
        <button key={c.id} onClick={() => setOpenId(c.id)} className="w-full flex items-center gap-3 px-4 py-3 transition hover:opacity-80" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
          {group ? <GroupAvatar ids={members} size={52} /> : <div className="relative"><Avatar id={other.id} size={52} />{other.online && <span className="absolute bottom-0.5 right-0.5"><Dot size={13} /></span>}</div>}
          <div className="min-w-0 flex-1 text-left">
            <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-1.5 min-w-0">{group ? <span className="font-bold truncate" style={{ color: C.ink }}>{c.name}</span> : <Name id={other.id} className="text-[15px]" />}{muted && <VolumeX size={12} style={{ color: C.faint }} className="shrink-0" />}</div><div className="flex items-center gap-1.5 shrink-0"><Mono style={{ color: C.faint, fontSize: 12 }}>{last ? last.time : ""}</Mono></div></div>
            <div className="flex items-center gap-2"><span className="text-[14px] truncate flex-1" style={{ color: c.unread ? C.ink : C.muted, fontWeight: c.unread ? 600 : 400 }}>{group && last && last.from ? USERS[last.from].name.split(" ")[0] + ": " : ""}{msgPreview(last)}</span>{c.unread > 0 && <span className="rounded-full flex items-center justify-center shrink-0 text-white" style={{ minWidth: 19, height: 19, padding: "0 5px", backgroundImage: GBRAND, fontFamily: MONO, fontSize: 11, fontWeight: 700 }}>{c.unread}</span>}</div>
          </div>
        </button>
      ); })}
      {picker === "new" && <PeoplePicker title={t("chat.newChat")} cta={t("action.create")} onClose={() => setPicker(null)} onConfirm={startNew} live={live} />}
    </div>
  );
}

/* ─────────────────────────  PROFILE  ───────────────────────── */
