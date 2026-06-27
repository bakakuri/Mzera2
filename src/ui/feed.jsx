import {
  useState, useEffect, useRef, Home, Search, Compass, PlusSquare, Send, Bell, User, Shield, Heart, MessageCircle, MessageSquare, Bookmark, MoreHorizontal, X, ArrowLeft, Hash, TrendingUp, Check, Trash2, Flag, Camera, Settings, AlertTriangle, ImageIcon, MapPin, Map, Link2, ShieldCheck, Plus, Minus, Menu, LogOut, HelpCircle, ChevronRight, Zap, Sun, Moon, ShoppingBag, Tag, Star, Eye, Navigation, Users, Film, Mic, Play, Pause, Smile, FileText, Download, UserPlus, Trophy, Upload, Volume2, VolumeX, Pencil, CornerUpLeft, Copy, Reply, authApi, profilesApi, postsApi, reactionsApi, commentsApi, followsApi, chatApi, notifsApi, storageApi, storiesApi, reelsApi, marketApi, groupsApi, eventsApi, forumApi, highlightsApi, presenceApi, locationsApi, pollsApi, hasSupabase, PAL, DARK, C, GBRAND, SH, card, DISPLAY, BODY, MONO, Mono, GRADS, hashIdx, img, catColor, FALLBACK_USER, _users, USERS, ME, fmtN, computeTrends, REPLIES, MARKET_CATS, FORUM_CATS, Pic, Avatar, Dot, Name, Handle, IconBtn, Pill, Wordmark, Title, Chips, renderText, Empty, ThemeToggle, REACTIONS, StoryRow, MiniPost, NewThread, Stars, Checkout, NewListing, GroupAvatar, waveOf, dl, VoiceMsg, DocMsg, EMOJIS, EmojiPanel, PeoplePicker, convMembers, convIsGroup, msgPreview, FollowBtn, FollowList, timeAgo, mergeProfile, mapDbPost, msgClock, mapDbMsg, toDbMsg, mapDbNotif, resolveImg, hydrateAuthors, mapDbStories, mapDbReel, mapDbThread, KA_MONS, mapDbListing, mapDbReview, mapDbGroup, mapDbEvent, ConfigError, LoadingScreen, AuthScreen, HighlightCreate, HighlightView, ReelComments, pushNotif, ensureNotifPerm, NOTIF_VERB, levelInfo, kfmt, RSVP_OPTS, ReelCard, ReelCreate, GroupPost, MiniMap, Switch, SettingsSection, SettingsRow, FILTERS, STORY_STICKERS, setTheme, setME,
} from "./core";

function PostImages({ images, pid }) {
  const [idx, setIdx] = useState(0);
  if (!images || !images.length) return null;
  if (images.length === 1) return <Pic src={images[0]} grad={GRADS[hashIdx(pid, GRADS.length)]} style={{ aspectRatio: "1 / 1" }} className="w-full" />;
  const onScroll = (e) => { const el = e.currentTarget; const i = Math.round(el.scrollLeft / el.clientWidth); if (i !== idx) setIdx(i); };
  return (
    <div className="relative">
      <div onScroll={onScroll} className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar">
        {images.map((u, i) => <div key={i} className="shrink-0 w-full snap-center" style={{ aspectRatio: "1 / 1" }}><Pic src={u} grad={GRADS[hashIdx(pid + i, GRADS.length)]} style={{ aspectRatio: "1 / 1" }} className="w-full h-full" /></div>)}
      </div>
      <div className="absolute top-2.5 right-2.5 rounded-full px-2 py-0.5 text-[11px] font-bold pointer-events-none" style={{ background: "rgba(0,0,0,.55)", color: "#fff", fontFamily: MONO }}>{idx + 1}/{images.length}</div>
      <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">{images.map((_, i) => <span key={i} className="rounded-full transition-all" style={{ width: i === idx ? 7 : 5, height: i === idx ? 7 : 5, background: i === idx ? "#fff" : "rgba(255,255,255,.5)" }} />)}</div>
    </div>
  );
}

export function PostCard({ post, onLike, onReact, onSave, onComment, onPollVote, onTag, onReport, onRemove, onOpenProfile, isAdmin, onEdit, onDelete, onEditComment, onDeleteComment }) {
  const [open, setOpen] = useState(false); const [menu, setMenu] = useState(false); const [draft, setDraft] = useState(""); const [pop, setPop] = useState(false);
  const [reactOpen, setReactOpen] = useState(false); const [shared, setShared] = useState(false);
  const [editing, setEditing] = useState(false); const [editText, setEditText] = useState(post.text || "");
  const [editC, setEditC] = useState(null); const [editCText, setEditCText] = useState("");
  const lpRef = useRef(null); const u = USERS[post.authorId]; const isMine = post.authorId === ME;
  const total = post.poll ? post.poll.options.reduce((a, o) => a + o.votes, 0) : 0;
  const doReact = (emoji) => { if (!post.likedByMe) { setPop(true); setTimeout(() => setPop(false), 420); } onReact(post.id, emoji); setReactOpen(false); };
  const pressStart = () => { lpRef.current = setTimeout(() => { setReactOpen(true); lpRef.current = null; }, 380); };
  const pressEnd = () => { if (lpRef.current) { clearTimeout(lpRef.current); lpRef.current = null; if (reactOpen) setReactOpen(false); else doReact("❤️"); } };
  const pressCancel = () => { if (lpRef.current) { clearTimeout(lpRef.current); lpRef.current = null; } };
  const send = () => { if (!draft.trim()) return; onComment(post.id, draft.trim()); setDraft(""); setOpen(true); };
  const share = async () => {
    const url = (typeof window !== "undefined" && window.location) ? window.location.origin : "https://mzera2.vercel.app";
    const txt = post.text || "mzera პოსტი";
    try {
      if (typeof navigator !== "undefined" && navigator.share) { await navigator.share({ title: "mzera", text: txt, url }); setShared(true); setTimeout(() => setShared(false), 2000); }
      else if (typeof navigator !== "undefined" && navigator.clipboard) { await navigator.clipboard.writeText(txt + "\n" + url); setShared(true); setTimeout(() => setShared(false), 2000); }
    } catch (e) { /* cancelled */ }
  };
  return (
    <article className="overflow-hidden" style={card()}>
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button onClick={() => onOpenProfile(u.id)}><Avatar id={u.id} size={44} /></button>
        <div className="min-w-0 flex-1 leading-tight">
          <button onClick={() => onOpenProfile(u.id)} className="block max-w-full"><Name id={u.id} className="text-[15px]" /></button>
          <div className="truncate mt-0.5"><Handle h={u.handle} t={post.time} /></div>
        </div>
        <div className="relative">
          <button onClick={() => setMenu(m => !m)} className="rounded-full p-1.5 hover:opacity-60" style={{ color: C.faint }}><MoreHorizontal size={20} /></button>
          {menu && (<><div className="fixed inset-0 z-20" onClick={() => setMenu(false)} /><div className="absolute right-0 top-9 z-30 rounded-2xl py-1.5 w-44" style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SH.pop }}>{isMine ? <><button onClick={() => { setEditing(true); setEditText(post.text || ""); setMenu(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:opacity-70" style={{ color: C.ink2 }}><Settings size={16} /> რედაქტირება</button><button onClick={() => { setMenu(false); if (window.confirm("წავშალო ეს პოსტი?")) onDelete && onDelete(post.id); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:opacity-70" style={{ color: C.like }}><Trash2 size={16} /> წაშლა</button></> : <><button onClick={() => { onReport(post.id); setMenu(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:opacity-70" style={{ color: C.ink2 }}><Flag size={16} /> დაარეპორტე</button>{isAdmin && <button onClick={() => { onRemove(post.id); setMenu(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:opacity-70" style={{ color: C.like }}><Trash2 size={16} /> წაშლა (admin)</button>}</>}</div></>)}
        </div>
      </div>
      {editing ? <div className="px-4 pb-3"><textarea value={editText} onChange={e => setEditText(e.target.value)} rows={3} className="w-full px-3 py-2.5 rounded-xl text-[15px] outline-none resize-none" style={{ background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` }} autoFocus /><div className="flex gap-2 mt-2"><button onClick={() => { onEdit && onEdit(post.id, editText.trim()); setEditing(false); }} className="px-4 py-2 rounded-lg text-sm font-bold text-white active:scale-95" style={{ backgroundImage: GBRAND }}>შენახვა</button><button onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg text-sm font-bold" style={{ background: C.surfaceMuted, color: C.muted }}>გაუქმება</button></div></div>
       : post.text && <div className="px-4 pb-3 text-[15px] whitespace-pre-wrap" style={{ color: C.ink2, lineHeight: 1.55 }}>{renderText(post.text, onTag, (uname) => { const u = Object.values(USERS).find(x => x.handle && x.handle.toLowerCase() === uname.toLowerCase()); if (u) onOpenProfile(u.id); })}</div>}
      {post.poll && <div className="px-4 pb-3 space-y-2">
        {post.poll.options.map((o, i) => { const pct = total ? Math.round(o.votes / total * 100) : 0; const voted = post.poll.voted != null; const mine = post.poll.voted === i; return (
          <button key={i} disabled={voted} onClick={() => onPollVote(post.id, i)} className="w-full relative overflow-hidden rounded-xl text-left transition active:scale-[.99]" style={{ border: `1.5px solid ${mine ? C.accent : C.line}`, background: C.surface }}>
            <div className="absolute inset-y-0 left-0" style={{ width: voted ? pct + "%" : "0%", background: mine ? C.accentSoft : C.surfaceMuted, transition: "width .55s cubic-bezier(.22,.61,.36,1)" }} />
            <div className="relative flex items-center justify-between px-3.5 py-2.5"><span className="text-[14px] font-semibold flex items-center gap-1.5" style={{ color: C.ink }}>{mine && <Check size={15} style={{ color: C.accent }} />}{o.text}</span>{voted && <Mono className="text-[13px] font-bold" style={{ color: mine ? C.accent : C.muted }}>{pct}%</Mono>}</div>
          </button>
        ); })}
        <Mono className="text-[12px]" style={{ color: C.faint }}>{total} ხმა{post.poll.voted != null ? " · შენ მისცი ხმა ✓" : ""}</Mono>
      </div>}
      {post.images && post.images.length > 0 && <PostImages images={post.images} pid={post.id} />}
      <div className="flex items-center gap-1 px-3 pt-2.5 pb-1.5">
        <div className="relative">
          {reactOpen && (<><div className="fixed inset-0 z-10" onClick={() => setReactOpen(false)} /><div className="absolute bottom-11 left-0 z-20 flex gap-0.5 px-2 py-1.5 rounded-full" style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SH.pop }}>{REACTIONS.map(e => <button key={e} onClick={() => doReact(e)} className="active:scale-125 transition" style={{ fontSize: 26, padding: 2 }}>{e}</button>)}</div></>)}
          <button onPointerDown={pressStart} onPointerUp={pressEnd} onPointerLeave={pressCancel} onContextMenu={(e) => e.preventDefault()} className="flex items-center gap-1.5 px-2 py-1.5 rounded-full transition active:scale-90" style={{ color: post.likedByMe ? (post.reaction ? C.ink : C.like) : C.ink2, userSelect: "none", touchAction: "manipulation" }}>
            {post.reaction ? <span style={{ fontSize: 20, lineHeight: 1, transform: pop ? "scale(1.3)" : "scale(1)", transition: "transform .3s cubic-bezier(.34,1.56,.64,1)" }}>{post.reaction}</span> : <Heart size={22} fill={post.likedByMe ? C.like : "none"} style={{ transform: pop ? "scale(1.35)" : "scale(1)", transition: "transform .3s cubic-bezier(.34,1.56,.64,1)" }} />}
            <Mono className="text-sm font-semibold">{post.likes}</Mono>
          </button>
        </div>
        <button onClick={() => setOpen(o => !o)} className="flex items-center gap-1.5 px-2 py-1.5 rounded-full active:scale-90" style={{ color: open ? C.accent : C.ink2 }}><MessageCircle size={21} /><Mono className="text-sm font-semibold">{post.comments.length}</Mono></button>
        <button onClick={share} className="flex items-center gap-1.5 px-2 py-1.5 rounded-full active:scale-90 transition" style={{ color: shared ? C.online : C.ink2 }}>{shared ? <Check size={20} /> : <Send size={20} />}<Mono className="text-sm font-semibold">{shared ? "გაზიარდა" : post.shares}</Mono></button>
        <div className="flex-1" />
        <button onClick={() => onSave(post.id)} className="px-2 py-1.5 rounded-full active:scale-90" style={{ color: post.savedByMe ? C.accent : C.ink2 }}><Bookmark size={21} fill={post.savedByMe ? C.accent : "none"} /></button>
      </div>
      {!open && post.comments.length > 0 && <button onClick={() => setOpen(true)} className="text-[13px] px-4 pb-3 -mt-0.5" style={{ color: C.faint }}>ნახე ყველა {post.comments.length} კომენტარი</button>}
      {open && (
        <div className="px-4 pb-1" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
          <div className="pt-2.5">{post.comments.map(c => { const cMine = c.authorId === ME; return (<div key={c.id} className="flex gap-2.5 py-1.5"><button onClick={() => onOpenProfile(c.authorId)} className="shrink-0 self-start"><Avatar id={c.authorId} size={30} /></button><div className="min-w-0 flex-1 text-[14px]" style={{ color: C.ink2 }}>{editC === c.id ? <div className="flex items-center gap-1.5"><input value={editCText} onChange={e => setEditCText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { onEditComment && onEditComment(post.id, c.id, editCText.trim()); setEditC(null); } }} className="flex-1 px-2.5 py-1.5 rounded-lg text-[13px] outline-none" style={{ background: C.surfaceMuted, color: C.ink }} autoFocus /><button onClick={() => { onEditComment && onEditComment(post.id, c.id, editCText.trim()); setEditC(null); }} className="text-xs font-bold" style={{ color: C.accent }}>ok</button><button onClick={() => setEditC(null)} className="text-xs" style={{ color: C.faint }}>✕</button></div> : <><span><button onClick={() => onOpenProfile(c.authorId)} style={{ color: C.ink }} className="font-bold">{USERS[c.authorId].name.split(" ")[0]}</button> {c.text}</span><div className="mt-0.5 flex items-center gap-2.5"><Mono style={{ color: C.faint, fontSize: 12 }}>{c.time}</Mono>{cMine && <><button onClick={() => { setEditC(c.id); setEditCText(c.text); }} style={{ color: C.faint, fontSize: 12, fontWeight: 600 }}>რედაქტ.</button><button onClick={() => onDeleteComment && onDeleteComment(post.id, c.id)} style={{ color: C.like, fontSize: 12, fontWeight: 600 }}>წაშლა</button></>}</div></>}</div></div>); })}</div>
          <div className="flex items-center gap-2 py-2.5"><Avatar id={ME} size={30} /><input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="დაამატე კომენტარი…" className="flex-1 bg-transparent text-[14px] outline-none" style={{ color: C.ink }} />{draft.trim() && <button onClick={send} className="text-sm font-bold" style={{ color: C.accent }}>გამოქვეყნება</button>}</div>
        </div>
      )}
    </article>
  );
}

/* ─────────────────────────  STORIES  ───────────────────────── */

export function StoryViewer({ story, onClose, onDone, flash }) {
  const [idx, setIdx] = useState(0); const [prog, setProg] = useState(0); const items = story.items;
  const cur = items[idx]; const sid = cur && cur.id;
  const [paused, setPaused] = useState(false); const pausedRef = useRef(false); useEffect(() => { pausedRef.current = paused; }, [paused]);
  const [reply, setReply] = useState(""); const [likeSet, setLikeSet] = useState(() => new Set()); const [commentsByStory, setCommentsByStory] = useState({});
  const liked = sid ? likeSet.has(sid) : false; const comments = (sid && commentsByStory[sid]) || [];
  useEffect(() => { storiesApi.myLikes().then(setLikeSet).catch(() => {}); }, []);
  useEffect(() => { if (sid) storiesApi.comments(sid).then(cs => { cs.forEach(c => c.author && mergeProfile(c.author)); setCommentsByStory(m => ({ ...m, [sid]: cs })); }).catch(() => {}); }, [sid]);
  useEffect(() => { setProg(0); const t = setInterval(() => { if (pausedRef.current) return; setProg(p => { if (p >= 100) { if (idx < items.length - 1) { setIdx(i => i + 1); return 0; } clearInterval(t); onDone(story.id); onClose(); return 100; } return p + 2; }); }, 60); return () => clearInterval(t); }, [idx]);
  const toggleLike = () => { if (!sid) return; const on = !liked; setLikeSet(s => { const n = new Set(s); on ? n.add(sid) : n.delete(sid); return n; }); storiesApi.toggleLike(sid, on).catch(() => {}); };
  const send = () => { const t = reply.trim(); if (!t || !sid) return; setReply(""); setPaused(false); const tmp = { id: "tmp" + Date.now(), text: t, author: { id: ME, name: (USERS[ME] && USERS[ME].name) || "", username: (USERS[ME] && USERS[ME].handle) || "", avatar_url: (USERS[ME] && USERS[ME].avatar) || null } }; setCommentsByStory(m => ({ ...m, [sid]: [...(m[sid] || []), tmp] })); storiesApi.addComment(sid, t).catch(() => {}); };
  const u = USERS[story.authorId];
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center" style={{ background: "rgba(6,7,12,.96)" }}>
      <div className="relative w-full max-w-[440px] h-full sm:h-[92vh] sm:rounded-3xl overflow-hidden">
        <div className="absolute inset-0" style={{ filter: items[idx].filter || "none" }}><Pic src={items[idx].image} grad={GRADS[hashIdx(story.id, GRADS.length)]} className="w-full h-full" /></div>
        {items[idx].stickers && items[idx].stickers.map((s, i) => <span key={i} style={{ position: "absolute", left: s.x + "%", top: s.y + "%", fontSize: 46, transform: "translate(-50%,-50%)", filter: "drop-shadow(0 2px 6px rgba(0,0,0,.45))" }}>{s.e}</span>)}
        {items[idx].text && <div className="absolute inset-x-5" style={{ top: "42%" }}><div className="text-center text-white font-bold" style={{ fontSize: 27, fontFamily: DISPLAY, textShadow: "0 2px 10px rgba(0,0,0,.7)", lineHeight: 1.2 }}>{items[idx].text}</div></div>}
        <div className="absolute top-0 inset-x-0 p-3" style={{ background: "linear-gradient(180deg, rgba(0,0,0,.45), transparent)" }}>
          <div className="flex gap-1 mb-3">{items.map((_, i) => <div key={i} className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.35)" }}><div className="h-full rounded-full" style={{ background: "#fff", width: i < idx ? "100%" : i === idx ? prog + "%" : "0%" }} /></div>)}</div>
          <div className="flex items-center gap-2.5"><Avatar id={u.id} size={34} /><span className="text-white font-bold text-sm flex-1">{u.name.split(" ")[0]} <Mono className="opacity-70 font-normal">· 2სთ</Mono></span>{cur && cur.closeFriends && <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold shrink-0" style={{ background: "#1f8f4e", color: "#fff" }}><Star size={11} /> ახლო</span>}<button onClick={onClose} className="text-white active:scale-90"><X size={26} /></button></div>
        </div>
        <button className="absolute left-0 top-0 w-1/3 h-full" onClick={() => setIdx(i => Math.max(0, i - 1))} />
        <button className="absolute right-0 top-0 w-1/3 h-full" onClick={() => idx < items.length - 1 ? setIdx(i => i + 1) : (onDone(story.id), onClose())} />
        {comments.length > 0 && <div className="absolute inset-x-0 px-3 pointer-events-none" style={{ top: 66, maxHeight: "42%", overflow: "hidden" }}>
          <div className="flex flex-col gap-1.5">
            {comments.slice(-7).map(c => <div key={c.id} className="flex items-center gap-1.5" style={{ opacity: 0.6 }}><Avatar id={(c.author && c.author.id) || ME} size={18} /><span className="text-white text-[12.5px]" style={{ textShadow: "0 1px 3px rgba(0,0,0,.65)" }}><b style={{ opacity: 0.85 }}>{(((c.author && (c.author.name || c.author.username)) || "").split(" ")[0])}</b> {c.text}</span></div>)}
          </div>
        </div>}
        <div className="absolute bottom-0 inset-x-0 p-3 flex items-center gap-2">
          <input value={reply} onChange={e => setReply(e.target.value)} onFocus={() => setPaused(true)} onBlur={() => { if (!reply.trim()) setPaused(false); }} onKeyDown={e => { if (e.key === "Enter") send(); }} placeholder="უპასუხე…" className="flex-1 px-4 py-2.5 rounded-full text-sm text-white bg-transparent outline-none" style={{ border: "1px solid rgba(255,255,255,.5)" }} />
          {reply.trim() ? <button onClick={send} className="rounded-full flex items-center justify-center active:scale-90 shrink-0" style={{ width: 42, height: 42, backgroundImage: GBRAND, color: "#fff", boxShadow: SH.glow }}><Send size={18} /></button> : <button onClick={toggleLike} className="active:scale-90 shrink-0" style={{ color: liked ? "#ff3b5c" : "#fff" }}><Heart size={28} fill={liked ? "#ff3b5c" : "none"} /></button>}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────  CREATE POST  ───────────────────────── */

export function CreateSheet({ onClose, onPost, live, onUpload }) {
  const [text, setText] = useState(""); const [pics, setPics] = useState([]); const [poll, setPoll] = useState(null);
  const fileRef = useRef(null); const [uploading, setUploading] = useState(false);
  const pickFile = async (e) => {
    const files = Array.from(e.target.files || []); if (!files.length) return;
    setUploading(true);
    const room = Math.max(0, 6 - pics.length);
    const urls = [];
    for (const f of files.slice(0, room)) { try { const url = await onUpload(f); if (url) urls.push(url); } catch (err) {} }
    if (urls.length) setPics(p => [...p, ...urls].slice(0, 6));
    setUploading(false); e.target.value = "";
  };
  const validPoll = poll && poll.filter(o => o.trim()).length >= 2;
  const can = text.trim() || pics.length || validPoll;
  const submit = () => onPost(text.trim(), poll ? [] : pics, validPoll ? { options: poll.filter(o => o.trim()).map(t => ({ text: t.trim(), votes: 0 })), voted: null } : null);
  const setOpt = (i, v) => setPoll(p => p.map((o, j) => j === i ? v : o));
  return (
    <div className="fixed inset-0 z-[60] flex sm:items-center justify-center items-end" style={{ background: "rgba(6,7,12,.55)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full sm:max-w-[520px] sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto" style={{ background: C.surface, boxShadow: SH.pop }}>
        <div className="flex items-center justify-between px-4 py-3.5 sticky top-0 z-10" style={{ background: C.surface, borderBottom: `1px solid ${C.lineSoft}` }}><button onClick={onClose} style={{ color: C.muted }}><X size={22} /></button><span className="font-bold" style={{ color: C.ink, fontFamily: DISPLAY }}>ახალი პოსტი</span><button disabled={!can} onClick={submit} className="px-4 py-1.5 rounded-full text-sm font-bold transition active:scale-95" style={{ backgroundImage: GBRAND, color: "#fff", opacity: can ? 1 : 0.4, boxShadow: can ? SH.glow : "none" }}>გაზიარება</button></div>
        <div className="p-4"><div className="flex gap-3"><Avatar id={ME} size={42} /><textarea autoFocus value={text} onChange={e => setText(e.target.value)} rows={poll ? 2 : 4} placeholder="რას ფიქრობ, გიორგი?  (#ჰეშთეგი)" className="flex-1 resize-none bg-transparent outline-none text-[16px]" style={{ color: C.ink, lineHeight: 1.55 }} /></div>{pics.length > 0 && !poll && <div className="mt-3 grid grid-cols-3 gap-2">{pics.map((u, i) => <div key={i} className="relative" style={{ aspectRatio: "1 / 1" }}><Pic src={resolveImg(u)} round={12} style={{ aspectRatio: "1 / 1" }} className="w-full h-full" /><button onClick={() => setPics(p => p.filter((_, j) => j !== i))} className="absolute top-1 right-1 rounded-full p-1" style={{ background: "rgba(0,0,0,.55)", color: "#fff" }}><X size={13} /></button>{i === 0 && pics.length > 1 && <span className="absolute bottom-1 left-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold" style={{ background: "rgba(0,0,0,.6)", color: "#fff" }}>ყდა</span>}</div>)}</div>}</div>
        {poll && <div className="px-4 pb-2 space-y-2">
          {poll.map((o, i) => <div key={i} className="flex items-center gap-2"><input value={o} onChange={e => setOpt(i, e.target.value)} placeholder={`ვარიანტი ${i + 1}`} className="flex-1 px-3.5 py-2.5 rounded-xl outline-none text-[14px]" style={{ background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` }} />{poll.length > 2 && <button onClick={() => setPoll(p => p.filter((_, j) => j !== i))} style={{ color: C.faint }}><X size={18} /></button>}</div>)}
          {poll.length < 4 && <button onClick={() => setPoll(p => [...p, ""])} className="flex items-center gap-1.5 text-sm font-semibold px-1 py-1" style={{ color: C.accent }}><Plus size={16} /> ვარიანტის დამატება</button>}
        </div>}
        <div className="px-4 pb-5 pt-1">
          <div className="flex gap-2 mb-3">
            <button onClick={() => { setPoll(null); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition" style={!poll ? { background: C.accentSoft, color: C.accentText } : { background: C.surfaceMuted, color: C.muted }}><ImageIcon size={17} /> ფოტო</button>
            <button onClick={() => { setPoll(poll ? null : ["", ""]); setPics([]); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition" style={poll ? { background: C.accentSoft, color: C.accentText } : { background: C.surfaceMuted, color: C.muted }}><TrendingUp size={17} /> გამოკითხვა</button>
          </div>
          {!poll && <div className="space-y-2.5">
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={pickFile} />
            <button onClick={() => fileRef.current && fileRef.current.click()} disabled={uploading || pics.length >= 6} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition active:scale-[.98]" style={{ background: C.accentSoft, color: C.accentText, opacity: pics.length >= 6 ? 0.5 : 1 }}>{uploading ? "იტვირთება…" : pics.length >= 6 ? "მაქს. 6 ფოტო" : <><Upload size={16} /> {pics.length ? `კიდევ ფოტო (${pics.length}/6)` : "ფოტოების ატვირთვა"}</>}</button>
          </div>}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────  EXPLORE  ───────────────────────── */

export function Explore({ posts, onTag, activeTag, clearTag, onOpenProfile, onSearch, tagPosts, tagLoading }) {
  const photos = posts.filter(p => p.image && !p.hidden);
  const list = activeTag ? (tagPosts || []).filter(p => !p.hidden) : null;
  return (
    <div className="pb-28 md:pb-10">
      <div className="px-4 pt-4 pb-3"><button onClick={onSearch} className="w-full flex items-center gap-2.5 px-4 py-3 rounded-full text-left active:scale-[.99] transition" style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SH.card }}><Search size={18} style={{ color: C.faint }} /><span className="flex-1 text-[15px]" style={{ color: C.faint }}>ძებნა — ხალხი, ჰეშთეგი, პოსტი</span></button></div>
      {activeTag ? (
        <div className="px-4"><div className="flex items-center gap-2 py-3"><button onClick={clearTag} style={{ color: C.muted }}><ArrowLeft size={20} /></button><Hash size={20} style={{ color: C.accent }} /><span className="text-xl" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "-0.02em" }}>{activeTag}</span></div><div className="space-y-3">{tagLoading ? <div className="flex justify-center py-10"><div style={{ width: 28, height: 28, border: `3px solid ${C.lineSoft}`, borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /></div> : list.length ? list.map(p => <MiniPost key={p.id} post={p} onOpenProfile={onOpenProfile} />) : <Empty icon={Hash} t="ჯერ არაფერია" s="ამ ჰეშთეგით პოსტი ვერ მოიძებნა." />}</div></div>
      ) : (
        <>
          {(() => { const tr = computeTrends(posts); return tr.length > 0 ? (<div className="px-4 pb-4"><div className="text-[13px] font-bold mb-2.5 flex items-center gap-1.5" style={{ color: C.muted }}><TrendingUp size={15} /> პოპულარული</div><div className="flex flex-wrap gap-2">{tr.map(t => <button key={t.tag} onClick={() => onTag(t.tag)} className="px-3.5 py-2 rounded-full text-sm font-semibold transition active:scale-95" style={{ background: C.accentSoft, color: C.accentText }}>#{t.tag} <Mono style={{ color: C.faint, fontWeight: 400 }}>· {t.posts}</Mono></button>)}</div></div>) : null; })()}
          <div className="grid grid-cols-3 gap-1 px-1">{photos.concat(photos).map((p, i) => <button key={i} onClick={() => onOpenProfile(p.authorId)} className="relative active:scale-95 transition"><Pic src={p.image} grad={GRADS[hashIdx(p.id + i, GRADS.length)]} round={10} style={{ aspectRatio: "1" }} /><span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 text-white" style={{ textShadow: "0 1px 4px rgba(0,0,0,.6)" }}><Heart size={13} fill="#fff" /> <Mono className="text-xs font-bold">{p.likes}</Mono></span></button>)}</div>
        </>
      )}
    </div>
  );
}

export function StoryEditor({ onClose, onShare, live, onUpload }) {
  const [pic, setPic] = useState(null); const [filter, setFilter] = useState("none"); const [text, setText] = useState(""); const [stickers, setStickers] = useState([]); const [mode, setMode] = useState("text"); const [cf, setCf] = useState(false);
  const [g] = useState(() => GRADS[Math.floor(Math.random() * GRADS.length)]);
  const fileRef = useRef(null); const [uploading, setUploading] = useState(false);
  const srcAt = (w, h) => (pic && pic.startsWith("http")) ? pic : null;
  const pickFile = async (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; setUploading(true); try { const url = await onUpload(f); setPic(url); } catch (err) {} setUploading(false); e.target.value = ""; };
  const addSticker = (e) => setStickers(s => [...s, { e, x: 25 + Math.random() * 50, y: 28 + Math.random() * 40 }]);
  return (
    <div className="fixed inset-0 z-[62] flex items-center justify-center" style={{ background: "rgba(0,0,0,.96)" }}>
      <div className="relative w-full max-w-[440px] h-full sm:h-[92vh] sm:rounded-3xl overflow-hidden" style={{ background: "#000" }}>
        <div className="absolute inset-0" style={{ filter }}><Pic src={srcAt(480, 854)} grad={g} className="w-full h-full" /></div>
        {stickers.map((s, i) => <span key={i} style={{ position: "absolute", left: s.x + "%", top: s.y + "%", fontSize: 46, transform: "translate(-50%,-50%)", filter: "drop-shadow(0 2px 6px rgba(0,0,0,.45))" }}>{s.e}</span>)}
        {text && <div className="absolute inset-x-5" style={{ top: "42%" }}><div className="text-center text-white font-bold" style={{ fontSize: 27, fontFamily: DISPLAY, textShadow: "0 2px 10px rgba(0,0,0,.7)", lineHeight: 1.2 }}>{text}</div></div>}
        <div className="absolute top-0 inset-x-0 p-3 flex items-center justify-between" style={{ background: "linear-gradient(180deg, rgba(0,0,0,.4), transparent)" }}>
          <button onClick={onClose} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 40, height: 40, background: "rgba(0,0,0,.4)", color: "#fff", backdropFilter: "blur(6px)" }}><X size={22} /></button>
          <div className="flex gap-1.5">{[["filter", "ფილტრი"], ["text", "ტექსტი"], ["sticker", "სტიკერი"]].map(([k, l]) => <button key={k} onClick={() => setMode(k)} className="px-3 py-1.5 rounded-full text-xs font-bold transition" style={mode === k ? { background: "#fff", color: "#000" } : { background: "rgba(255,255,255,.2)", color: "#fff", backdropFilter: "blur(6px)" }}>{l}</button>)}</div>
        </div>
        <div className="absolute bottom-0 inset-x-0 p-3" style={{ background: "linear-gradient(0deg, rgba(0,0,0,.65), transparent)" }}>
          {mode === "filter" && <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3">{FILTERS.map(([l, f]) => <button key={l} onClick={() => setFilter(f)} className="shrink-0 flex flex-col items-center gap-1"><div className="rounded-xl overflow-hidden" style={{ width: 54, height: 54, outline: filter === f ? "2.5px solid #fff" : "none", outlineOffset: 2 }}><div style={{ filter: f, width: "100%", height: "100%" }}><Pic src={srcAt(96, 96)} grad={g} className="w-full h-full" /></div></div><span className="text-[10px] text-white">{l}</span></button>)}</div>}
          {mode === "text" && <input autoFocus value={text} onChange={e => setText(e.target.value)} placeholder="დაწერე რამე…" className="w-full mb-3 px-4 py-3 rounded-2xl text-white text-[15px] outline-none" style={{ background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.3)", backdropFilter: "blur(8px)" }} />}
          {mode === "sticker" && <div className="grid grid-cols-6 gap-1 mb-3 p-2 rounded-2xl" style={{ background: "rgba(255,255,255,.12)", backdropFilter: "blur(8px)" }}>{STORY_STICKERS.map(e => <button key={e} onClick={() => addSticker(e)} className="active:scale-90 transition" style={{ fontSize: 28, padding: 4 }}>{e}</button>)}</div>}
          <button onClick={() => setCf(v => !v)} className="w-full mb-2 rounded-xl flex items-center justify-center gap-2 py-2.5 font-bold text-[13px] active:scale-95 transition" style={cf ? { background: "#1f8f4e", color: "#fff" } : { background: "rgba(255,255,255,.18)", color: "#fff", backdropFilter: "blur(6px)" }}>{cf ? <><Star size={15} /> ახლო მეგობრები</> : <><Users size={15} /> ყველა — შეეხე ახლო მეგობრებისთვის</>}</button>
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickFile} />
            <button onClick={() => fileRef.current && fileRef.current.click()} disabled={uploading} className="flex-1 rounded-xl flex items-center justify-center gap-2 py-3 active:scale-95 font-bold text-white text-[14px]" style={{ background: "rgba(255,255,255,.18)", backdropFilter: "blur(6px)" }}>{uploading ? <span className="text-[12px] font-bold">იტვირთება…</span> : <><Upload size={17} /> ფოტო</>}</button>
            <button onClick={() => onShare({ image: srcAt(480, 854), filter, text: text.trim(), stickers, close_friends: cf })} className="rounded-full px-5 py-3 font-bold text-white flex items-center gap-2 shrink-0 active:scale-95" style={{ backgroundImage: cf ? "linear-gradient(135deg,#1f8f4e,#26b061)" : GBRAND, boxShadow: SH.glow }}>გაზიარება <Send size={17} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────  LEADERBOARD + ANALYTICS  ───────────────────────── */
