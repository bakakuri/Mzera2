import {
  useState, useEffect, useRef, Home, Search, Compass, PlusSquare, Send, Bell, User, Shield, Heart, MessageCircle, MessageSquare, Bookmark, MoreHorizontal, X, ArrowLeft, Hash, TrendingUp, Check, Trash2, Flag, Camera, Settings, AlertTriangle, ImageIcon, MapPin, Map, Link2, ShieldCheck, Plus, Minus, Menu, LogOut, HelpCircle, ChevronRight, Zap, Sun, Moon, ShoppingBag, Tag, Star, Eye, Navigation, Users, Film, Mic, Play, Pause, Smile, FileText, Download, UserPlus, Trophy, Upload, Volume2, VolumeX, Pencil, CornerUpLeft, Copy, Reply, Gamepad2, Clapperboard, Music, authApi, profilesApi, postsApi, reactionsApi, commentsApi, followsApi, chatApi, notifsApi, storageApi, storiesApi, reelsApi, marketApi, groupsApi, eventsApi, forumApi, highlightsApi, presenceApi, locationsApi, pollsApi, hasSupabase, PAL, DARK, C, GBRAND, SH, card, DISPLAY, BODY, MONO, Mono, GRADS, hashIdx, img, catColor, FALLBACK_USER, _users, USERS, ME, fmtN, computeTrends, REPLIES, MARKET_CATS, FORUM_CATS, Pic, Avatar, Dot, Name, Handle, IconBtn, Pill, Wordmark, Title, Chips, renderText, Empty, ThemeToggle, REACTIONS, StoryRow, MiniPost, NewThread, Stars, Checkout, NewListing, GroupAvatar, waveOf, dl, VoiceMsg, DocMsg, EMOJIS, EmojiPanel, PeoplePicker, convMembers, convIsGroup, msgPreview, FollowBtn, FollowList, timeAgo, mergeProfile, mapDbPost, msgClock, mapDbMsg, toDbMsg, mapDbNotif, resolveImg, hydrateAuthors, mapDbStories, mapDbReel, mapDbThread, KA_MONS, mapDbListing, mapDbReview, mapDbGroup, mapDbEvent, ConfigError, LoadingScreen, AuthScreen, HighlightCreate, HighlightView, ReelComments, pushNotif, ensureNotifPerm, NOTIF_VERB, levelInfo, kfmt, RSVP_OPTS, ReelCard, ReelCreate, GroupPost, MiniMap, Switch, SettingsSection, SettingsRow, FILTERS, STORY_STICKERS, setTheme, setME, POST_BGS, FEELINGS } from "./core";

export function Lightbox({ images, start, onClose }) {
  const [idx, setIdx] = useState(start || 0);
  const [scale, setScale] = useState(1); const [tx, setTx] = useState(0); const [ty, setTy] = useState(0);
  const t = useRef({}); const lastTap = useRef(0);
  const reset = () => { setScale(1); setTx(0); setTy(0); };
  const go = (d) => { const n = Math.max(0, Math.min(images.length - 1, idx + d)); if (n !== idx) { setIdx(n); reset(); } };
  const onStart = (e) => {
    if (e.touches.length === 2) { const dx = e.touches[0].clientX - e.touches[1].clientX, dy = e.touches[0].clientY - e.touches[1].clientY; t.current.pinchDist = Math.hypot(dx, dy); t.current.baseScale = scale; }
    else if (e.touches.length === 1) { t.current.x0 = e.touches[0].clientX; t.current.y0 = e.touches[0].clientY; t.current.tx0 = tx; t.current.ty0 = ty; t.current.moved = 0; t.current.swipeDx = null; }
  };
  const onMove = (e) => {
    if (e.touches.length === 2 && t.current.pinchDist) { const dx = e.touches[0].clientX - e.touches[1].clientX, dy = e.touches[0].clientY - e.touches[1].clientY; setScale(Math.max(1, Math.min(4, t.current.baseScale * (Math.hypot(dx, dy) / t.current.pinchDist)))); }
    else if (e.touches.length === 1) { const dx = e.touches[0].clientX - t.current.x0, dy = e.touches[0].clientY - t.current.y0; t.current.moved = Math.abs(dx) + Math.abs(dy); if (scale > 1) { setTx(t.current.tx0 + dx); setTy(t.current.ty0 + dy); } else { t.current.swipeDx = dx; } }
  };
  const onEnd = () => {
    if (scale <= 1 && t.current.swipeDx != null && Math.abs(t.current.swipeDx) > 60) go(t.current.swipeDx < 0 ? 1 : -1);
    if (t.current.moved < 8) { const now = Date.now(); if (now - lastTap.current < 300) { if (scale > 1) reset(); else setScale(2.5); } lastTap.current = now; }
    if (scale <= 1) { setTx(0); setTy(0); }
    t.current.pinchDist = 0; t.current.swipeDx = null;
  };
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden" style={{ background: "rgba(0,0,0,.97)" }} onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd} onClick={(e) => { if (e.target === e.currentTarget && scale <= 1) onClose(); }}>
      <button onClick={onClose} className="absolute top-4 right-4 z-10 rounded-full flex items-center justify-center active:scale-90" style={{ width: 40, height: 40, background: "rgba(255,255,255,.15)", color: "#fff" }}><X size={22} /></button>
      {images.length > 1 && <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 text-white text-[13px] font-bold" style={{ fontFamily: MONO }}>{idx + 1} / {images.length}</div>}
      <img src={resolveImg(images[idx])} alt="" draggable={false} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", transform: `translate(${tx}px, ${ty}px) scale(${scale})`, transition: t.current.pinchDist ? "none" : "transform .15s ease", touchAction: "none", userSelect: "none" }} />
      {images.length > 1 && scale <= 1 && <>
        <button onClick={() => go(-1)} disabled={idx === 0} className="hidden sm:flex absolute left-3 top-1/2 rounded-full items-center justify-center" style={{ width: 42, height: 42, background: "rgba(255,255,255,.15)", color: "#fff", opacity: idx === 0 ? 0.3 : 1, transform: "translateY(-50%)" }}><ArrowLeft size={22} /></button>
        <button onClick={() => go(1)} disabled={idx === images.length - 1} className="hidden sm:flex absolute right-3 top-1/2 rounded-full items-center justify-center" style={{ width: 42, height: 42, background: "rgba(255,255,255,.15)", color: "#fff", opacity: idx === images.length - 1 ? 0.3 : 1, transform: "translateY(-50%) rotate(180deg)" }}><ArrowLeft size={22} /></button>
      </>}
    </div>
  );
}

function PostImages({ images, pid }) {
  const [idx, setIdx] = useState(0); const [lb, setLb] = useState(-1);
  if (!images || !images.length) return null;
  const onScroll = (e) => { const el = e.currentTarget; const i = Math.round(el.scrollLeft / el.clientWidth); if (i !== idx) setIdx(i); };
  return (
    <>
      {images.length === 1
        ? <button onClick={() => setLb(0)} className="block w-full active:opacity-95"><Pic src={images[0]} grad={GRADS[hashIdx(pid, GRADS.length)]} w={800} style={{ aspectRatio: "1 / 1" }} className="w-full" /></button>
        : <div className="relative">
            <div onScroll={onScroll} className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar">{images.map((u, i) => <button key={i} onClick={() => setLb(i)} className="shrink-0 w-full snap-center active:opacity-95" style={{ aspectRatio: "1 / 1" }}><Pic src={u} grad={GRADS[hashIdx(pid + i, GRADS.length)]} w={800} style={{ aspectRatio: "1 / 1" }} className="w-full h-full" /></button>)}</div>
            <div className="absolute top-2.5 right-2.5 rounded-full px-2 py-0.5 text-[11px] font-bold pointer-events-none" style={{ background: "rgba(0,0,0,.55)", color: "#fff", fontFamily: MONO }}>{idx + 1}/{images.length}</div>
            <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">{images.map((_, i) => <span key={i} className="rounded-full transition-all" style={{ width: i === idx ? 7 : 5, height: i === idx ? 7 : 5, background: i === idx ? "#fff" : "rgba(255,255,255,.5)" }} />)}</div>
          </div>}
      {lb >= 0 && <Lightbox images={images} start={lb} onClose={() => setLb(-1)} />}
    </>
  );
}

const _ogCache = {};
const URL_RE = /(https?:\/\/[^\s]+)/i;
function LinkPreview({ text }) {
  const m = text && text.match(URL_RE);
  const url = m ? m[0].replace(/[.,!?]+$/, "") : null;
  const [data, setData] = useState(url && _ogCache[url] ? _ogCache[url] : null);
  useEffect(() => {
    if (!url || _ogCache[url]) return;
    let cancel = false;
    fetch("https://api.microlink.io/?url=" + encodeURIComponent(url)).then(r => r.json()).then(j => { const d = (j && j.status === "success" && j.data) ? { title: j.data.title, desc: j.data.description, img: j.data.image && j.data.image.url, pub: j.data.publisher } : {}; _ogCache[url] = d; if (!cancel) setData(d); }).catch(() => { _ogCache[url] = {}; if (!cancel) setData({}); });
    return () => { cancel = true; };
  }, [url]);
  if (!url) return null;
  let domain = ""; const dm = url.match(/^https?:\/\/([^\/?#]+)/i); if (dm) domain = dm[1].replace(/^www\./, "");
  const open = () => { try { window.open(url, "_blank", "noopener"); } catch (e) {} };
  if (data && (data.title || data.img)) return (
    <button onClick={open} className="mx-4 mb-3 block w-full text-left rounded-2xl overflow-hidden active:opacity-90" style={{ border: `1px solid ${C.line}`, background: C.surfaceMuted }}>
      {data.img && <div style={{ aspectRatio: "1.91/1" }}><img src={data.img} alt="" className="w-full h-full object-cover" /></div>}
      <div className="px-3 py-2.5"><div className="text-[10.5px] uppercase tracking-wide" style={{ color: C.faint, fontFamily: MONO }}>{domain}</div><div className="text-[14px] font-bold mt-0.5 line-clamp-2" style={{ color: C.ink }}>{data.title || url}</div>{data.desc && <div className="text-[12.5px] mt-0.5 line-clamp-2" style={{ color: C.muted }}>{data.desc}</div>}</div>
    </button>
  );
  return (
    <button onClick={open} className="mx-4 mb-3 flex items-center gap-2.5 w-full text-left rounded-xl px-3 py-2.5 active:opacity-80" style={{ border: `1px solid ${C.line}`, background: C.surfaceMuted }}>
      <img src={"https://www.google.com/s2/favicons?domain=" + domain + "&sz=64"} alt="" style={{ width: 22, height: 22 }} className="rounded shrink-0" />
      <div className="min-w-0 flex-1"><div className="text-[13.5px] font-bold truncate" style={{ color: C.accent }}>{domain || "ბმული"}</div><div className="text-[11.5px] truncate" style={{ color: C.faint }}>{url}</div></div>
      <Link2 size={16} style={{ color: C.faint }} />
    </button>
  );
}

/* ─────────────────────────  FEED DISCOVERY (promo cards + reels row)  ───────────────────────── */

const PROMO_META = {
  group: { icon: Users, label: "ჯგუფი" },
  film: { icon: Clapperboard, label: "ფილმი" },
  song: { icon: Music, label: "მუსიკა" },
  game: { icon: Gamepad2, label: "თამაში" },
  market: { icon: ShoppingBag, label: "მარკეტი" },
  forum: { icon: MessageSquare, label: "ფორუმი" },
};

// Injected discovery card shown between feed posts — pulls people toward Groups/Films/
// Music/Games/Market/Forum without those sections needing their own feed of "posts".
export function FeedPromoCard({ kind, data, onOpen }) {
  const meta = PROMO_META[kind];
  if (!meta || !data) return null;
  return (
    <article className="overflow-hidden" style={card()}>
      <div className="flex items-center gap-1.5 px-4 pt-3.5 pb-2 text-[12px] font-bold uppercase tracking-wide" style={{ color: C.accent, fontFamily: MONO }}><meta.icon size={14} /> {meta.label}</div>
      <button onClick={onOpen} className="block w-full text-left active:opacity-90">
        {data.image !== null && <div className="relative w-full" style={{ aspectRatio: kind === "film" ? "2/1" : "2.2/1" }}><Pic src={data.image} grad={GRADS[hashIdx(String(data.id), GRADS.length)]} className="w-full h-full" /></div>}
        <div className="px-4 pt-3"><div className="text-[16px] font-bold truncate" style={{ color: C.ink, fontFamily: DISPLAY }}>{data.title}</div>{data.subtitle && <div className="text-[13px] mt-0.5 truncate" style={{ color: C.muted }}>{data.subtitle}</div>}</div>
      </button>
      <div className="px-4 pb-4 pt-2.5"><button onClick={onOpen} className="w-full py-2.5 rounded-xl text-[14px] font-bold text-white active:scale-[.98]" style={{ backgroundImage: GBRAND }}>{data.cta}</button></div>
    </article>
  );
}

// Facebook-style horizontal reels strip embedded in the main feed (below stories, above posts).
export function FeedReelsRow({ reels, onOpen }) {
  if (!reels || !reels.length) return null;
  return (
    <div className="overflow-hidden pt-3 pb-1" style={card()}>
      <div className="flex items-center justify-between px-4 pb-2">
        <span className="text-[15px] font-bold flex items-center gap-1.5" style={{ color: C.ink, fontFamily: DISPLAY }}><Film size={17} /> Reels</span>
        <button onClick={onOpen} className="flex items-center gap-0.5 text-[12.5px] font-bold active:opacity-70" style={{ color: C.accent }}>ყველა <ChevronRight size={14} /></button>
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-2.5">
        {reels.slice(0, 12).map(r => (
          <button key={r.id} onClick={onOpen} className="relative shrink-0 rounded-2xl overflow-hidden active:scale-[.97] transition" style={{ width: 108, height: 180 }}>
            {r.image ? <Pic src={r.image} grad={GRADS[hashIdx(r.id, GRADS.length)]} className="w-full h-full" /> : r.video ? <video src={r.video + "#t=0.1"} preload="metadata" muted playsInline className="w-full h-full" style={{ objectFit: "cover", background: "#000" }} /> : <Pic src={null} grad={GRADS[hashIdx(r.id, GRADS.length)]} className="w-full h-full" />}
            <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,.65), transparent 45%)" }} />
            <Play size={20} fill="#fff" className="absolute top-2 left-2" style={{ color: "#fff", filter: "drop-shadow(0 1px 3px rgba(0,0,0,.5))" }} />
            <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1 text-white text-[11px] font-bold truncate" style={{ textShadow: "0 1px 2px rgba(0,0,0,.5)" }}><Avatar id={r.authorId} size={18} />{USERS[r.authorId] ? USERS[r.authorId].name.split(" ")[0] : ""}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function PostCard({ post, onLike, onReact, onSave, onComment, onPollVote, onTag, onReport, onRemove, onOpenProfile, isAdmin, onEdit, onDelete, onEditComment, onDeleteComment, onLikeComment, onRepost, onReactors, onHide, onSeeLess, onFavorite, isFavorite }) {
  const [open, setOpen] = useState(false); const [menu, setMenu] = useState(false); const [draft, setDraft] = useState(""); const [pop, setPop] = useState(false);
  const [csort, setCsort] = useState("top"); const [replyTo, setReplyTo] = useState(null); const [replyName, setReplyName] = useState(""); const cInRef = useRef(null);
  const [reactOpen, setReactOpen] = useState(false); const [shared, setShared] = useState(false);
  const [shareMenu, setShareMenu] = useState(false); const [repostOpen, setRepostOpen] = useState(false); const [repostText, setRepostText] = useState("");
  const [reactorsOpen, setReactorsOpen] = useState(false); const [reactors, setReactors] = useState(null);
  const openReactors = async () => { setReactorsOpen(true); setReactors(null); if (onReactors) { try { setReactors(await onReactors(post.id)); } catch (e) { setReactors([]); } } };
  const [editing, setEditing] = useState(false); const [editText, setEditText] = useState(post.text || "");
  const [editC, setEditC] = useState(null); const [editCText, setEditCText] = useState("");
  const lpRef = useRef(null); const u = USERS[post.authorId]; const isMine = post.authorId === ME;
  const total = post.poll ? post.poll.options.reduce((a, o) => a + o.votes, 0) : 0;
  const bgPost = post.bg && POST_BGS[post.bg] && post.text && !post.image && !(post.images && post.images.length) && !post.video && !post.poll && !post.shared;
  const doReact = (emoji) => { if (!post.likedByMe) { setPop(true); setTimeout(() => setPop(false), 420); } onReact(post.id, emoji); setReactOpen(false); };
  const pressStart = () => { lpRef.current = setTimeout(() => { setReactOpen(true); lpRef.current = null; }, 380); };
  const pressEnd = () => { if (lpRef.current) { clearTimeout(lpRef.current); lpRef.current = null; if (reactOpen) setReactOpen(false); else doReact("❤️"); } };
  const pressCancel = () => { if (lpRef.current) { clearTimeout(lpRef.current); lpRef.current = null; } };
  const send = () => { if (!draft.trim()) return; onComment(post.id, draft.trim(), replyTo || null); setDraft(""); setReplyTo(null); setReplyName(""); setOpen(true); };
  const startReply = (c) => { setReplyTo(c.parentId || c.id); setReplyName(USERS[c.authorId] ? USERS[c.authorId].name.split(" ")[0] : ""); setOpen(true); if (cInRef.current) cInRef.current.focus(); };
  const share = async () => {
    const url = (typeof window !== "undefined" && window.location) ? window.location.origin : "https://mzera2.vercel.app";
    const txt = post.text || "mzera პოსტი";
    try {
      if (typeof navigator !== "undefined" && navigator.share) { await navigator.share({ title: "mzera", text: txt, url }); setShared(true); setTimeout(() => setShared(false), 2000); }
      else if (typeof navigator !== "undefined" && navigator.clipboard) { await navigator.clipboard.writeText(txt + "\n" + url); setShared(true); setTimeout(() => setShared(false), 2000); }
    } catch (e) { /* cancelled */ }
  };
  return (
    // overflow stays hidden by default (clips the edge-to-edge image/video to the card's
    // rounded corners) but flips to visible while a popover is open, since those are
    // absolutely-positioned inside this card and short cards (e.g. text-only reposts)
    // were clipping "დაარეპორტე"/"წაშლა (admin)" off the bottom of the "..." menu
    <article className="overflow-hidden" style={{ ...card(), overflow: (menu || shareMenu || reactOpen) ? "visible" : "hidden" }}>
      {(post.shared || post.sharedId) && <div className="flex items-center gap-1.5 px-4 pt-2.5 -mb-1 text-[12px] font-semibold" style={{ color: C.faint }}><span style={{ fontSize: 12 }}>🔁</span> {isMine ? "შენ გააზიარე" : ((USERS[post.authorId] ? USERS[post.authorId].name.split(" ")[0] : "") + "-მ გააზიარა")}</div>}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button onClick={() => onOpenProfile(u.id)}><Avatar id={u.id} size={44} /></button>
        <div className="min-w-0 flex-1 leading-tight">
          <button onClick={() => onOpenProfile(u.id)} className="block max-w-full"><Name id={u.id} className="text-[15px]" /></button>
          {(post.feeling || (post.tagged && post.tagged.length) || post.location) && <div className="text-[12.5px] mt-0.5 truncate" style={{ color: C.muted }}>{post.feeling && <span>გრძნობს {post.feeling}</span>}{post.tagged && post.tagged.length > 0 && <span>{post.feeling ? " · " : ""}{(USERS[post.tagged[0]] ? USERS[post.tagged[0]].name.split(" ")[0] : "ვიღაც")}{post.tagged.length > 1 ? ` და კიდევ ${post.tagged.length - 1}` : ""}-თან</span>}{post.location && <span>{(post.feeling || (post.tagged && post.tagged.length)) ? " · " : ""}📍 {post.location}</span>}</div>}
          <div className="truncate mt-0.5 flex items-center gap-1"><Handle h={u.handle} t={post.time} />{post.edited && <span style={{ color: C.faint, fontSize: 11 }}>· რედაქტირებულია</span>}</div>
        </div>
        <div className="relative">
          <button onClick={() => setMenu(m => !m)} className="rounded-full p-1.5 hover:opacity-60" style={{ color: C.faint }}><MoreHorizontal size={20} /></button>
          {menu && (<><div className="fixed inset-0 z-20" onClick={() => setMenu(false)} /><div className="absolute right-0 top-9 z-30 rounded-2xl py-1.5 w-52" style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SH.pop }}>{isMine ? <><button onClick={() => { setEditing(true); setEditText(post.text || ""); setMenu(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:opacity-70" style={{ color: C.ink2 }}><Settings size={16} /> რედაქტირება</button><button onClick={() => { setMenu(false); if (window.confirm("წავშალო ეს პოსტი?")) onDelete && onDelete(post.id); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:opacity-70" style={{ color: C.like }}><Trash2 size={16} /> წაშლა</button></> : <>{onFavorite && <button onClick={() => { onFavorite(post.authorId); setMenu(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:opacity-70" style={{ color: isFavorite ? C.accent : C.ink2 }}><Star size={16} fill={isFavorite ? C.accent : "none"} /> {isFavorite ? "„ჯერ ეს“ მოხსნა" : "ჯერ ეს მაჩვენე"}</button>}{onHide && <button onClick={() => { onHide(post.id); setMenu(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:opacity-70" style={{ color: C.ink2 }}><Eye size={16} /> დამალვა</button>}{onSeeLess && <button onClick={() => { onSeeLess(post.authorId); setMenu(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:opacity-70" style={{ color: C.ink2 }}><Minus size={16} /> ნაკლები ვაჩვენე</button>}<button onClick={() => { onReport(post.id); setMenu(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:opacity-70" style={{ color: C.ink2 }}><Flag size={16} /> დაარეპორტე</button>{isAdmin && <button onClick={() => { onRemove(post.id); setMenu(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:opacity-70" style={{ color: C.like }}><Trash2 size={16} /> წაშლა (admin)</button>}</>}</div></>)}
        </div>
      </div>
      {editing ? <div className="px-4 pb-3"><textarea value={editText} onChange={e => setEditText(e.target.value)} rows={3} className="w-full px-3 py-2.5 rounded-xl text-[15px] outline-none resize-none" style={{ background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` }} autoFocus /><div className="flex gap-2 mt-2"><button onClick={() => { onEdit && onEdit(post.id, editText.trim()); setEditing(false); }} className="px-4 py-2 rounded-lg text-sm font-bold text-white active:scale-95" style={{ backgroundImage: GBRAND }}>შენახვა</button><button onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg text-sm font-bold" style={{ background: C.surfaceMuted, color: C.muted }}>გაუქმება</button></div></div>
       : bgPost ? <div className="mx-4 mb-3 rounded-2xl flex items-center justify-center px-5 py-12" style={{ minHeight: 220, backgroundImage: `linear-gradient(140deg, ${POST_BGS[post.bg][0]}, ${POST_BGS[post.bg][1]})` }}><div className="text-center font-bold whitespace-pre-wrap break-words" style={{ color: "#fff", fontSize: (post.text.length > 60 ? 20 : 26), fontFamily: DISPLAY, lineHeight: 1.3 }}>{post.text}</div></div>
       : post.text && <div className="px-4 pb-3 text-[15px] whitespace-pre-wrap" style={{ color: C.ink2, lineHeight: 1.55 }}>{renderText(post.text, onTag, (uname) => { const u = Object.values(USERS).find(x => x.handle && x.handle.toLowerCase() === uname.toLowerCase()); if (u) onOpenProfile(u.id); })}</div>}
      {post.shared ? (() => { const su = USERS[post.shared.authorId]; const simgs = (post.shared.images && post.shared.images.length) ? post.shared.images : (post.shared.image ? [post.shared.image] : []); const sBg = post.shared.bg && POST_BGS[post.shared.bg] && post.shared.text && !simgs.length && !post.shared.video; return (
        <div className="mx-4 mb-3 rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}`, background: C.surfaceMuted }}>
          <button onClick={() => su && onOpenProfile(su.id)} className="flex items-center gap-2 px-3 pt-2.5 pb-2 w-full active:opacity-70"><Avatar id={post.shared.authorId} size={26} /><div className="text-left min-w-0"><div className="font-bold text-[13px] truncate" style={{ color: C.ink }}>{su ? su.name : "—"}</div><Mono style={{ fontSize: 10.5, color: C.faint }}>@{su ? su.handle : ""} · {post.shared.time}</Mono></div></button>
          {sBg
            ? <div className="m-3 rounded-xl flex items-center justify-center px-4 py-8" style={{ minHeight: 130, backgroundImage: `linear-gradient(140deg, ${POST_BGS[post.shared.bg][0]}, ${POST_BGS[post.shared.bg][1]})` }}><div className="text-center font-bold break-words" style={{ color: "#fff", fontSize: 18, fontFamily: DISPLAY }}>{post.shared.text}</div></div>
            : <>{post.shared.text && <div className="px-3 pb-2.5 text-[13.5px] whitespace-pre-wrap break-words" style={{ color: C.ink2, lineHeight: 1.5 }}>{post.shared.text}</div>}{post.shared.video ? <video src={post.shared.video} controls playsInline preload="metadata" className="w-full" style={{ maxHeight: 360, background: "#000" }} /> : simgs.length > 0 && <div className="relative"><Pic src={simgs[0]} grad={GRADS[hashIdx(post.shared.id, GRADS.length)]} className="w-full" style={{ maxHeight: 360, objectFit: "cover" }} />{simgs.length > 1 && <span className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: "rgba(0,0,0,.6)", color: "#fff", fontFamily: MONO }}>1/{simgs.length}</span>}</div>}</>}
        </div>
      ); })() : post.sharedId ? <div className="mx-4 mb-3 rounded-2xl px-4 py-5 text-center text-[13px]" style={{ border: `1px solid ${C.line}`, background: C.surfaceMuted, color: C.faint }}>🚫 ეს პოსტი წაშლილია</div> : null}
      {post.poll && <div className="px-4 pb-3 space-y-2">
        {post.poll.options.map((o, i) => { const pct = total ? Math.round(o.votes / total * 100) : 0; const voted = post.poll.voted != null; const mine = post.poll.voted === i; return (
          <button key={i} disabled={voted} onClick={() => onPollVote(post.id, i)} className="w-full relative overflow-hidden rounded-xl text-left transition active:scale-[.99]" style={{ border: `1.5px solid ${mine ? C.accent : C.line}`, background: C.surface }}>
            <div className="absolute inset-y-0 left-0" style={{ width: voted ? pct + "%" : "0%", background: mine ? C.accentSoft : C.surfaceMuted, transition: "width .55s cubic-bezier(.22,.61,.36,1)" }} />
            <div className="relative flex items-center justify-between px-3.5 py-2.5"><span className="text-[14px] font-semibold flex items-center gap-1.5" style={{ color: C.ink }}>{mine && <Check size={15} style={{ color: C.accent }} />}{o.text}</span>{voted && <Mono className="text-[13px] font-bold" style={{ color: mine ? C.accent : C.muted }}>{pct}%</Mono>}</div>
          </button>
        ); })}
        <Mono className="text-[12px]" style={{ color: C.faint }}>{total} ხმა{post.poll.voted != null ? " · შენ მისცი ხმა ✓" : ""}</Mono>
      </div>}
      {post.text && !bgPost && !post.image && !(post.images && post.images.length) && !post.video && !post.poll && !post.shared && <LinkPreview text={post.text} />}
      {post.video ? <video src={post.video} controls playsInline preload="metadata" className="w-full" style={{ maxHeight: 540, background: "#000" }} /> : (post.images && post.images.length > 0 && <PostImages images={post.images} pid={post.id} />)}
      <div className="flex items-center gap-1 px-3 pt-2.5 pb-1.5">
        <div className="relative">
          {reactOpen && (<><div className="fixed inset-0 z-10" onClick={() => setReactOpen(false)} /><div className="absolute bottom-11 left-0 z-20 flex gap-0.5 px-2 py-1.5 rounded-full" style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SH.pop }}>{REACTIONS.map(e => <button key={e} onClick={() => doReact(e)} className="active:scale-125 transition" style={{ fontSize: 26, padding: 2 }}>{e}</button>)}</div></>)}
          <button onPointerDown={pressStart} onPointerUp={pressEnd} onPointerLeave={pressCancel} onContextMenu={(e) => e.preventDefault()} className="flex items-center gap-1.5 px-2 py-1.5 rounded-full transition active:scale-90" style={{ color: post.likedByMe ? (post.reaction ? C.ink : C.like) : C.ink2, userSelect: "none", touchAction: "manipulation" }}>
            {post.reaction ? <span style={{ fontSize: 20, lineHeight: 1, transform: pop ? "scale(1.3)" : "scale(1)", transition: "transform .3s cubic-bezier(.34,1.56,.64,1)" }}>{post.reaction}</span> : <Heart size={22} fill={post.likedByMe ? C.like : "none"} style={{ transform: pop ? "scale(1.35)" : "scale(1)", transition: "transform .3s cubic-bezier(.34,1.56,.64,1)" }} />}
            <Mono className="text-sm font-semibold">{post.likes}</Mono>
          </button>
        </div>
        <button onClick={() => setOpen(o => !o)} className="flex items-center gap-1.5 px-2 py-1.5 rounded-full active:scale-90" style={{ color: open ? C.accent : C.ink2 }}><MessageCircle size={21} /><Mono className="text-sm font-semibold">{post.comments.length}</Mono></button>
        <div className="relative">
          {shareMenu && (<><div className="fixed inset-0 z-10" onClick={() => setShareMenu(false)} /><div className="absolute bottom-11 left-0 z-20 rounded-2xl py-1.5 w-56" style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SH.pop }}><button onClick={() => { setShareMenu(false); setRepostText(""); setRepostOpen(true); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold hover:opacity-70" style={{ color: C.ink2 }}><span style={{ fontSize: 16 }}>🔁</span> რეპოსტი კედელზე</button><button onClick={() => { setShareMenu(false); share(); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold hover:opacity-70" style={{ color: C.ink2 }}><Send size={16} /> ლინკის გაზიარება</button></div></>)}
          <button onClick={() => setShareMenu(m => !m)} className="flex items-center gap-1.5 px-2 py-1.5 rounded-full active:scale-90 transition" style={{ color: shared ? C.online : C.ink2 }}>{shared ? <Check size={20} /> : <Send size={20} />}<Mono className="text-sm font-semibold">{shared ? "გაზიარდა" : post.shares}</Mono></button>
        </div>
        <div className="flex-1" />
        <button onClick={() => onSave(post.id)} className="px-2 py-1.5 rounded-full active:scale-90" style={{ color: post.savedByMe ? C.accent : C.ink2 }}><Bookmark size={21} fill={post.savedByMe ? C.accent : "none"} /></button>
      </div>
      {post.likes > 0 && <button onClick={openReactors} className="px-4 pb-2 -mt-0.5 text-[12.5px] flex items-center gap-1 active:opacity-60" style={{ color: C.faint }}><span style={{ fontSize: 13 }}>{post.reaction || "❤️"}</span> {post.likes}-მა მოიწონა</button>}
      {!open && post.comments.length > 0 && <button onClick={() => setOpen(true)} className="text-[13px] px-4 pb-3 -mt-0.5" style={{ color: C.faint }}>ნახე ყველა {post.comments.length} კომენტარი</button>}
      {open && (
        <div className="px-4 pb-1" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
          {(() => {
            const cmts = post.comments || [];
            const sortFn = (a, b) => csort === "top" ? ((b.likes || 0) - (a.likes || 0)) || (new Date(a.createdAt || 0) - new Date(b.createdAt || 0)) : csort === "old" ? (new Date(a.createdAt || 0) - new Date(b.createdAt || 0)) : (new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            const tops = cmts.filter(c => !c.parentId).sort(sortFn);
            const repliesOf = (id) => cmts.filter(c => c.parentId === id).sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
            const row = (c, reply) => { const cMine = c.authorId === ME; const cu = USERS[c.authorId]; return (
              <div key={c.id} className="flex gap-2.5 py-1.5" style={reply ? { marginLeft: 36 } : undefined}>
                <button onClick={() => onOpenProfile(c.authorId)} className="shrink-0 self-start"><Avatar id={c.authorId} size={reply ? 26 : 30} /></button>
                <div className="min-w-0 flex-1">
                  {editC === c.id ? <div className="flex items-center gap-1.5"><input value={editCText} onChange={e => setEditCText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { onEditComment && onEditComment(post.id, c.id, editCText.trim()); setEditC(null); } }} className="flex-1 px-2.5 py-1.5 rounded-lg text-[13px] outline-none" style={{ background: C.surfaceMuted, color: C.ink }} autoFocus /><button onClick={() => { onEditComment && onEditComment(post.id, c.id, editCText.trim()); setEditC(null); }} className="text-xs font-bold" style={{ color: C.accent }}>ok</button><button onClick={() => setEditC(null)} className="text-xs" style={{ color: C.faint }}>✕</button></div> : <>
                    <div className="inline-block rounded-2xl px-3 py-2 max-w-full" style={{ background: C.surfaceMuted }}><button onClick={() => onOpenProfile(c.authorId)} style={{ color: C.ink }} className="font-bold text-[13px]">{cu ? cu.name.split(" ")[0] : "—"}</button><div className="text-[14px] whitespace-pre-wrap break-words" style={{ color: C.ink2 }}>{c.text}</div></div>
                    <div className="mt-1 flex items-center gap-3.5 pl-1.5">
                      <Mono style={{ color: C.faint, fontSize: 11.5 }}>{c.time}</Mono>
                      <button onClick={() => onLikeComment && onLikeComment(post.id, c.id)} className="flex items-center gap-1 text-[11.5px] font-bold active:scale-90" style={{ color: c.likedByMe ? C.like : C.faint }}><Heart size={12} fill={c.likedByMe ? C.like : "none"} />{(c.likes || 0) > 0 ? c.likes : ""}</button>
                      <button onClick={() => startReply(c)} className="text-[11.5px] font-bold" style={{ color: C.faint }}>პასუხი</button>
                      {cMine && <><button onClick={() => { setEditC(c.id); setEditCText(c.text); }} style={{ color: C.faint, fontSize: 11.5, fontWeight: 700 }}>რედაქტ.</button><button onClick={() => onDeleteComment && onDeleteComment(post.id, c.id)} style={{ color: C.like, fontSize: 11.5, fontWeight: 700 }}>წაშლა</button></>}
                      {!cMine && isAdmin && <button onClick={() => { if (window.confirm("წავშალო ეს კომენტარი? (admin)")) onDeleteComment && onDeleteComment(post.id, c.id); }} style={{ color: C.like, fontSize: 11.5, fontWeight: 700 }}>წაშლა (admin)</button>}
                    </div>
                  </>}
                </div>
              </div>
            ); };
            return <>
              {cmts.length > 1 && <div className="flex gap-1.5 pt-2.5">{[["top", "პოპულარული"], ["new", "ახალი"], ["old", "ძველი"]].map(([k, l]) => <button key={k} onClick={() => setCsort(k)} className="px-2.5 py-1 rounded-full text-[12px] font-bold" style={csort === k ? { background: C.accentSoft, color: C.accentText } : { color: C.faint }}>{l}</button>)}</div>}
              <div className="pt-1.5">{tops.map(c => <div key={c.id}>{row(c, false)}{repliesOf(c.id).map(r => row(r, true))}</div>)}</div>
            </>;
          })()}
          <div className="py-2">
            {replyTo && <div className="flex items-center gap-1.5 mb-1.5 pl-1"><span className="text-[12px]" style={{ color: C.accent }}>პასუხი {replyName}-ს</span><button onClick={() => { setReplyTo(null); setReplyName(""); }} style={{ color: C.faint, fontSize: 13 }}>✕</button></div>}
            <div className="flex items-center gap-2"><Avatar id={ME} size={30} /><input ref={cInRef} value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder={replyTo ? "დაწერე პასუხი…" : "დაამატე კომენტარი…"} className="flex-1 bg-transparent text-[14px] outline-none" style={{ color: C.ink }} />{draft.trim() && <button onClick={send} className="text-sm font-bold" style={{ color: C.accent }}>გამოქვეყნება</button>}</div>
          </div>
        </div>
      )}
      {reactorsOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,.5)" }} onClick={() => setReactorsOpen(false)}>
          <div className="w-full sm:max-w-sm sm:rounded-3xl rounded-t-3xl max-h-[70vh] overflow-y-auto pb-4" style={{ background: C.surface }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 sticky top-0 z-10" style={{ background: C.surface, borderBottom: `1px solid ${C.lineSoft}` }}><span className="font-bold text-[15px]" style={{ color: C.ink }}>რეაქციები</span><button onClick={() => setReactorsOpen(false)} style={{ color: C.muted }}><X size={20} /></button></div>
            {reactors == null ? <div className="flex justify-center py-10"><div style={{ width: 24, height: 24, border: `3px solid ${C.lineSoft}`, borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /></div> : reactors.length === 0 ? <Empty icon={Heart} t="ჯერ არავინ" s="" /> : <div className="px-2 py-1">{reactors.map(r => { if (r.user) mergeProfile(r.user); const id = r.user_id; return (<button key={id} onClick={() => { setReactorsOpen(false); onOpenProfile(id); }} className="w-full flex items-center gap-3 px-3 py-2.5 active:opacity-60"><Avatar id={id} size={38} /><div className="flex-1 text-left min-w-0"><div className="font-bold text-[14px] truncate" style={{ color: C.ink }}>{USERS[id] ? USERS[id].name : "—"}</div><Mono style={{ fontSize: 11.5, color: C.faint }}>@{USERS[id] ? USERS[id].handle : ""}</Mono></div><span style={{ fontSize: 22 }}>{r.emoji || "❤️"}</span></button>); })}</div>}
          </div>
        </div>
      )}
      {repostOpen && (() => {
        // when reposting something that's already a repost, preview the *original* content
        // being shared (not this wrapper post, which usually has no text/image of its own)
        const target = post.shared || post;
        const su = USERS[target.authorId];
        return (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,.55)" }} onClick={() => setRepostOpen(false)}>
          <div className="w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[85vh] overflow-y-auto" style={{ background: C.surface }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3.5 sticky top-0 z-10" style={{ background: C.surface, borderBottom: `1px solid ${C.lineSoft}` }}><button onClick={() => setRepostOpen(false)} style={{ color: C.muted }}><X size={22} /></button><span className="font-bold" style={{ color: C.ink, fontFamily: DISPLAY }}>გაზიარება</span><button onClick={() => { if (onRepost) onRepost(target.id, repostText.trim()); setRepostOpen(false); }} className="px-4 py-1.5 rounded-full text-sm font-bold text-white active:scale-95" style={{ backgroundImage: GBRAND }}>გააზიარე</button></div>
            <div className="p-4">
              <textarea value={repostText} onChange={e => setRepostText(e.target.value)} rows={2} placeholder="დაამატე კომენტარი… (სურვილისამებრ)" className="w-full resize-none px-3.5 py-3 rounded-xl outline-none text-[15px] mb-3" style={{ background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` }} autoFocus />
              <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
                <div className="flex items-center gap-2 px-3 pt-3 pb-2"><Avatar id={target.authorId} size={26} /><div className="min-w-0"><div className="font-bold text-[13px] truncate" style={{ color: C.ink }}>{su ? su.name : "—"}</div><Mono style={{ fontSize: 10.5, color: C.faint }}>@{su ? su.handle : ""}</Mono></div></div>
                {target.text && <div className="px-3 pb-2 text-[13.5px] line-clamp-3 break-words" style={{ color: C.ink2 }}>{target.text}</div>}
                {target.video ? <video src={target.video} muted playsInline preload="metadata" className="w-full block" style={{ maxHeight: 200, background: "#000" }} /> : target.image && <Pic src={target.image} grad={GRADS[hashIdx(target.id, GRADS.length)]} className="w-full" style={{ maxHeight: 200, objectFit: "cover" }} />}
              </div>
            </div>
          </div>
        </div>
      ); })()}
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

export function CreateSheet({ onClose, onPost, live, taggable, myGroups, onGroupPost, onUpload, onUploadVideo }) {
  const [text, setText] = useState(""); const [pics, setPics] = useState([]); const [poll, setPoll] = useState(null); const [schedAt, setSchedAt] = useState(""); const [wantPublic, setWantPublic] = useState(false);
  const [bg, setBg] = useState(null); const [feeling, setFeeling] = useState(null); const [loc, setLoc] = useState(""); const [tagged, setTagged] = useState([]); const [panel, setPanel] = useState(null);
  const [vid, setVid] = useState(null); const [vidUp, setVidUp] = useState(false); const vidRef = useRef(null); const [targetGroup, setTargetGroup] = useState(null);
  const fileRef = useRef(null); const [uploading, setUploading] = useState(false);
  const pickVideo = async (e) => { const f = e.target.files && e.target.files[0]; if (!f) { return; } setVidUp(true); try { const url = await onUploadVideo(f); if (url) { setVid(url); setPics([]); setPoll(null); setBg(null); } } catch (er) {} setVidUp(false); e.target.value = ""; };
  const pickFile = async (e) => {
    const files = Array.from(e.target.files || []); if (!files.length) return;
    setUploading(true);
    const room = Math.max(0, 6 - pics.length);
    const urls = [];
    for (const f of files.slice(0, room)) { try { const url = await onUpload(f); if (url) urls.push(url); } catch (err) {} }
    if (urls.length) { setPics(p => [...p, ...urls].slice(0, 6)); setBg(null); setVid(null); }
    setUploading(false); e.target.value = "";
  };
  const validPoll = poll && poll.filter(o => o.trim()).length >= 2;
  const useBg = bg && !pics.length && !poll && !vid;
  const can = text.trim() || pics.length || validPoll || vid;
  const submit = () => { if (targetGroup && onGroupPost) { onGroupPost(targetGroup, { text: text.trim(), images: (pics && pics.length) ? pics.map(resolveImg) : null, poll: validPoll ? { options: poll.filter(o => o.trim()).map(t => ({ text: t.trim(), votes: 0 })), voted: null } : null, video: vid, bg: useBg ? bg : null, feeling, location: loc.trim() || null, tagged }); onClose(); return; } onPost(text.trim(), poll ? [] : pics, validPoll ? { options: poll.filter(o => o.trim()).map(t => ({ text: t.trim(), votes: 0 })), voted: null } : null, schedAt ? new Date(schedAt).toISOString() : null, wantPublic, { bg: useBg ? bg : null, feeling, location: loc.trim() || null, tagged, video: vid }); };
  const setOpt = (i, v) => setPoll(p => p.map((o, j) => j === i ? v : o));
  return (
    <div className="fixed inset-0 z-[60] flex sm:items-center justify-center items-end" style={{ background: "rgba(6,7,12,.55)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full sm:max-w-[520px] sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto" style={{ background: C.surface, boxShadow: SH.pop }}>
        <div className="flex items-center justify-between px-4 py-3.5 sticky top-0 z-10" style={{ background: C.surface, borderBottom: `1px solid ${C.lineSoft}` }}><button onClick={onClose} style={{ color: C.muted }}><X size={22} /></button><span className="font-bold" style={{ color: C.ink, fontFamily: DISPLAY }}>ახალი პოსტი</span><button disabled={!can} onClick={submit} className="px-4 py-1.5 rounded-full text-sm font-bold transition active:scale-95" style={{ backgroundImage: GBRAND, color: "#fff", opacity: can ? 1 : 0.4, boxShadow: can ? SH.glow : "none" }}>გაზიარება</button></div>
        {myGroups && myGroups.length > 0 && <div className="flex gap-1.5 px-4 pt-3 overflow-x-auto no-scrollbar"><button onClick={() => setTargetGroup(null)} className="shrink-0 px-3 py-1.5 rounded-full text-[12.5px] font-bold" style={!targetGroup ? { background: C.accentSoft, color: C.accentText } : { background: C.surfaceMuted, color: C.muted }}>📝 ჩემი კედელი</button>{myGroups.map(g => <button key={g.id} onClick={() => setTargetGroup(g.id)} className="shrink-0 px-3 py-1.5 rounded-full text-[12.5px] font-bold" style={targetGroup === g.id ? { background: C.accentSoft, color: C.accentText } : { background: C.surfaceMuted, color: C.muted }}>👥 {g.name}</button>)}</div>}
        {targetGroup && <div className="px-4 pt-2 text-[12px]" style={{ color: C.faint }}>პოსტი გამოქვეყნდება ჯგუფში — სრული ფუნქციონალით</div>}
        <div className="p-4">{useBg ? <div className="rounded-2xl flex items-center justify-center px-5 py-10" style={{ minHeight: 200, backgroundImage: `linear-gradient(140deg, ${POST_BGS[bg][0]}, ${POST_BGS[bg][1]})` }}><textarea autoFocus value={text} onChange={e => setText(e.target.value)} rows={3} placeholder="რას ფიქრობ?" className="w-full bg-transparent outline-none text-center font-bold resize-none" style={{ color: "#fff", fontSize: text.length > 60 ? 20 : 26, fontFamily: DISPLAY, lineHeight: 1.3 }} /></div> : <div className="flex gap-3"><Avatar id={ME} size={42} /><textarea autoFocus value={text} onChange={e => setText(e.target.value)} rows={poll ? 2 : 4} placeholder="რას ფიქრობ, გიორგი?  (#ჰეშთეგი)" className="flex-1 resize-none bg-transparent outline-none text-[16px]" style={{ color: C.ink, lineHeight: 1.55 }} /></div>}{pics.length > 0 && !poll && <div className="mt-3 grid grid-cols-3 gap-2">{pics.map((u, i) => <div key={i} className="relative" style={{ aspectRatio: "1 / 1" }}><Pic src={resolveImg(u)} round={12} style={{ aspectRatio: "1 / 1" }} className="w-full h-full" /><button onClick={() => setPics(p => p.filter((_, j) => j !== i))} className="absolute top-1 right-1 rounded-full p-1" style={{ background: "rgba(0,0,0,.55)", color: "#fff" }}><X size={13} /></button>{i === 0 && pics.length > 1 && <span className="absolute bottom-1 left-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold" style={{ background: "rgba(0,0,0,.6)", color: "#fff" }}>ყდა</span>}</div>)}</div>}</div>
        {poll && <div className="px-4 pb-2 space-y-2">
          {poll.map((o, i) => <div key={i} className="flex items-center gap-2"><input value={o} onChange={e => setOpt(i, e.target.value)} placeholder={`ვარიანტი ${i + 1}`} className="flex-1 px-3.5 py-2.5 rounded-xl outline-none text-[14px]" style={{ background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` }} />{poll.length > 2 && <button onClick={() => setPoll(p => p.filter((_, j) => j !== i))} style={{ color: C.faint }}><X size={18} /></button>}</div>)}
          {poll.length < 4 && <button onClick={() => setPoll(p => [...p, ""])} className="flex items-center gap-1.5 text-sm font-semibold px-1 py-1" style={{ color: C.accent }}><Plus size={16} /> ვარიანტის დამატება</button>}
        </div>}
        <div className="px-4 pb-5 pt-1">
          <div className="flex gap-2 mb-3">
            <button onClick={() => { setPoll(null); setVid(null); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition" style={(!poll && !vid) ? { background: C.accentSoft, color: C.accentText } : { background: C.surfaceMuted, color: C.muted }}><ImageIcon size={17} /> ფოტო</button>
            <button onClick={() => vidRef.current && vidRef.current.click()} disabled={vidUp} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition" style={vid ? { background: C.accentSoft, color: C.accentText } : { background: C.surfaceMuted, color: C.muted }}><Film size={17} /> {vidUp ? "…" : "ვიდეო"}</button>
            <button onClick={() => { setPoll(poll ? null : ["", ""]); setPics([]); setVid(null); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition" style={poll ? { background: C.accentSoft, color: C.accentText } : { background: C.surfaceMuted, color: C.muted }}><TrendingUp size={17} /> გამოკითხვა</button>
          </div>
          <input ref={vidRef} type="file" accept="video/*" hidden onChange={pickVideo} />
          {vid && <div className="relative rounded-2xl overflow-hidden mb-1" style={{ background: "#000" }}><video src={vid} controls playsInline className="w-full" style={{ maxHeight: 300 }} /><button onClick={() => setVid(null)} className="absolute top-2 right-2 rounded-full p-1.5" style={{ background: "rgba(0,0,0,.6)", color: "#fff" }}><X size={15} /></button></div>}
          {!poll && !vid && <div className="space-y-2.5">
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={pickFile} />
            <button onClick={() => fileRef.current && fileRef.current.click()} disabled={uploading || pics.length >= 6} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition active:scale-[.98]" style={{ background: C.accentSoft, color: C.accentText, opacity: pics.length >= 6 ? 0.5 : 1 }}>{uploading ? "იტვირთება…" : pics.length >= 6 ? "მაქს. 6 ფოტო" : <><Upload size={16} /> {pics.length ? `კიდევ ფოტო (${pics.length}/6)` : "ფოტოების ატვირთვა"}</>}</button>
          </div>}
          {(feeling || loc.trim() || tagged.length > 0) && <div className="flex flex-wrap gap-1.5 mt-2.5">{feeling && <span className="px-2.5 py-1 rounded-full text-[12px] font-semibold flex items-center gap-1" style={{ background: C.surfaceMuted, color: C.ink2 }}>{feeling}<button onClick={() => setFeeling(null)}><X size={11} /></button></span>}{tagged.length > 0 && <span className="px-2.5 py-1 rounded-full text-[12px] font-semibold flex items-center gap-1" style={{ background: C.surfaceMuted, color: C.ink2 }}>👥 {tagged.length} მონიშნული<button onClick={() => setTagged([])}><X size={11} /></button></span>}{loc.trim() && <span className="px-2.5 py-1 rounded-full text-[12px] font-semibold flex items-center gap-1" style={{ background: C.surfaceMuted, color: C.ink2 }}>📍 {loc}<button onClick={() => setLoc("")}><X size={11} /></button></span>}</div>}
          <div className="grid grid-cols-4 gap-1.5 mt-2.5">
            <button onClick={() => setPanel(panel === "bg" ? null : "bg")} disabled={!!pics.length || !!poll} className="flex flex-col items-center gap-1 py-2 rounded-xl text-[11px] font-bold transition" style={{ background: (bg || panel === "bg") ? C.accentSoft : C.surfaceMuted, color: (bg || panel === "bg") ? C.accentText : C.muted, opacity: (pics.length || poll) ? 0.4 : 1 }}><span style={{ fontSize: 16 }}>🎨</span> ფონი</button>
            <button onClick={() => setPanel(panel === "feel" ? null : "feel")} className="flex flex-col items-center gap-1 py-2 rounded-xl text-[11px] font-bold transition" style={{ background: (feeling || panel === "feel") ? C.accentSoft : C.surfaceMuted, color: (feeling || panel === "feel") ? C.accentText : C.muted }}><span style={{ fontSize: 16 }}>😊</span> გრძნობა</button>
            <button onClick={() => setPanel(panel === "tag" ? null : "tag")} className="flex flex-col items-center gap-1 py-2 rounded-xl text-[11px] font-bold transition" style={{ background: (tagged.length || panel === "tag") ? C.accentSoft : C.surfaceMuted, color: (tagged.length || panel === "tag") ? C.accentText : C.muted }}><span style={{ fontSize: 16 }}>👥</span> მონიშვნა</button>
            <button onClick={() => setPanel(panel === "loc" ? null : "loc")} className="flex flex-col items-center gap-1 py-2 rounded-xl text-[11px] font-bold transition" style={{ background: (loc.trim() || panel === "loc") ? C.accentSoft : C.surfaceMuted, color: (loc.trim() || panel === "loc") ? C.accentText : C.muted }}><span style={{ fontSize: 16 }}>📍</span> ლოკაცია</button>
          </div>
          {panel === "bg" && <div className="flex gap-2 mt-2.5 overflow-x-auto no-scrollbar pb-1"><button onClick={() => setBg(null)} className="shrink-0 rounded-xl flex items-center justify-center" style={{ width: 38, height: 38, border: `2px solid ${C.line}`, color: C.faint }}><X size={16} /></button>{Object.entries(POST_BGS).map(([k, g]) => <button key={k} onClick={() => setBg(k)} className="shrink-0 rounded-xl active:scale-90" style={{ width: 38, height: 38, backgroundImage: `linear-gradient(140deg, ${g[0]}, ${g[1]})`, border: bg === k ? `3px solid ${C.ink}` : `1px solid ${C.line}` }} />)}</div>}
          {panel === "feel" && <div className="flex gap-2 mt-2.5 overflow-x-auto no-scrollbar pb-1">{FEELINGS.map(([e, l]) => { const v = e + " " + l; return <button key={l} onClick={() => setFeeling(feeling === v ? null : v)} className="shrink-0 px-3 py-1.5 rounded-full text-[13px] font-bold active:scale-95" style={feeling === v ? { background: C.accentSoft, color: C.accentText } : { background: C.surfaceMuted, color: C.muted }}>{e} {l}</button>; })}</div>}
          {panel === "tag" && <div className="mt-2.5 max-h-44 overflow-y-auto rounded-xl" style={{ background: C.surfaceMuted }}>{(taggable || []).length === 0 ? <div className="text-[13px] text-center py-4" style={{ color: C.faint }}>ჯერ არავის მიჰყვები — დააფოლოვე ხალხი</div> : (taggable || []).map(id => { const tu = USERS[id]; if (!tu) return null; const on = tagged.includes(id); return <button key={id} onClick={() => setTagged(t => on ? t.filter(x => x !== id) : [...t, id])} className="w-full flex items-center gap-2.5 px-3 py-2 active:opacity-70"><Avatar id={id} size={32} /><span className="flex-1 text-left text-[14px] font-semibold truncate" style={{ color: C.ink }}>{tu.name}</span>{on && <Check size={18} style={{ color: C.accent }} />}</button>; })}</div>}
          {panel === "loc" && <input value={loc} onChange={e => setLoc(e.target.value)} placeholder="სად ხარ? (მაგ: თბილისი, კაფე…)" className="w-full mt-2.5 px-3.5 py-2.5 rounded-xl outline-none text-[14px]" style={{ background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` }} />}
          <button onClick={() => setWantPublic(v => !v)} className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl mt-2.5 active:scale-[.99]" style={{ background: wantPublic ? C.accentSoft : C.surfaceMuted, border: `1px solid ${wantPublic ? C.accent : C.line}` }}>
            <div className="text-left"><div className="text-[14px] font-bold flex items-center gap-1.5" style={{ color: wantPublic ? C.accentText : C.ink2 }}>🌍 საჯარო ყველასთვის</div><div className="text-[11.5px] mt-0.5" style={{ color: C.faint }}>(საჭიროა მოდერაციის დასტური)</div></div>
            <div className="rounded-full shrink-0" style={{ width: 44, height: 26, background: wantPublic ? C.accent : C.line, position: "relative" }}><div className="rounded-full" style={{ width: 20, height: 20, background: "#fff", position: "absolute", top: 3, left: wantPublic ? 21 : 3, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.25)" }} /></div>
          </button>
          <div className="mt-2.5">
            <div className="flex items-center gap-2 text-[13px] font-semibold mb-1.5" style={{ color: C.muted }}><span style={{ fontSize: 15 }}>📅</span> დაგეგმვა <span className="font-normal" style={{ color: C.faint }}>(არასავალდებულო)</span></div>
            <input type="datetime-local" value={schedAt} onChange={e => setSchedAt(e.target.value)} className="w-full px-3 py-2.5 rounded-xl outline-none text-[14px]" style={{ background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` }} />
            {schedAt && <div className="flex items-center justify-between mt-1.5"><span className="text-[12px]" style={{ color: C.accent }}>გამოქვეყნდება მოგვიანებით ⏱</span><button onClick={() => setSchedAt("")} className="text-[12px] font-bold" style={{ color: C.faint }}>გასუფთავება</button></div>}
          </div>
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
