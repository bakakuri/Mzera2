import { useState, useEffect, useRef } from "react";
import {
  Home, Search, Compass, PlusSquare, Send, Bell, User, Shield, Heart, MessageCircle,
  MessageSquare, Bookmark, MoreHorizontal, X, ArrowLeft, Hash, TrendingUp, Check,
  Trash2, Flag, Camera, Settings, AlertTriangle, Image as ImageIcon, MapPin, Map,
  Link2, ShieldCheck, Plus, Minus, Menu, LogOut, HelpCircle, ChevronRight, Zap,
  Sun, Moon, ShoppingBag, Tag, Star, Eye, Navigation, Users, Film, Mic, Play, Pause, Smile, FileText, Download, UserPlus, Trophy, Upload
} from "lucide-react";
import { hasSupabase } from "./lib/supabase";
import { auth as authApi, profiles as profilesApi, posts as postsApi, reactions as reactionsApi, comments as commentsApi, follows as followsApi, chat as chatApi, notifications as notifsApi, storage as storageApi, stories as storiesApi, reels as reelsApi, market as marketApi, groups as groupsApi, events as eventsApi, forum as forumApi } from "./lib/api";

/* ─────────────────────────  THEME  ───────────────────────── */
const PAL = {
  light: {
    paper: "#F3F5F9", surface: "#FFFFFF", surfaceMuted: "#F4F6FA", elev: "#FFFFFF",
    ink: "#11131A", ink2: "#363A45", muted: "#697080", faint: "#98A0B0",
    line: "#E6E9F0", lineSoft: "#EFF1F6",
    accent: "#6750F2", accentSoft: "#ECEAFE", accentText: "#4F39E0",
    cyan: "#00A6F0", like: "#F2456A", likeSoft: "#FFE8ED", online: "#16C784", star: "#F5A623",
    grid: "rgba(103,80,242,.06)",
    mapBase: "#E9EDE8", mapBlock: "#DCE2DB", mapRoad: "#FFFFFF", mapRiver: "#BFE3F5", mapPark: "#D2E7CE",
  },
  dark: {
    paper: "#0A0C13", surface: "#13161F", surfaceMuted: "#1A1E29", elev: "#181C26",
    ink: "#F1F4F9", ink2: "#C5CAD6", muted: "#878D9C", faint: "#565D6E",
    line: "#242A39", lineSoft: "#1B202D",
    accent: "#8B7CFF", accentSoft: "#241F45", accentText: "#A99CFF",
    cyan: "#35C5FF", like: "#FF5C7C", likeSoft: "#3A1722", online: "#22E08F", star: "#FBBF24",
    grid: "rgba(139,124,255,.08)",
    mapBase: "#0E121C", mapBlock: "#141A27", mapRoad: "#232B3C", mapRiver: "#163A4E", mapPark: "#14271D",
  },
};
let DARK = false;
let C = PAL.light;
const GBRAND = "linear-gradient(125deg, #6750F2 0%, #6E63FF 46%, #00B4FF 100%)";
const SH = {
  get card() { return DARK ? "0 2px 6px rgba(0,0,0,.5), 0 20px 44px -28px rgba(0,0,0,.85)" : "0 1px 2px rgba(17,19,26,.04), 0 14px 30px -22px rgba(17,19,26,.20)"; },
  get pop() { return DARK ? "0 20px 56px -14px rgba(0,0,0,.9)" : "0 12px 38px -10px rgba(17,19,26,.26)"; },
  glow: "0 8px 22px -6px rgba(103,80,242,.55)",
};
const card = () => ({ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SH.card, borderRadius: 18 });
const DISPLAY = "'Space Grotesk', 'Noto Sans Georgian', system-ui, sans-serif";
const BODY = "'Noto Sans Georgian', 'Space Grotesk', system-ui, -apple-system, sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, 'SF Mono', monospace";
const Mono = ({ children, style, className = "" }) => <span className={className} style={{ fontFamily: MONO, ...style }}>{children}</span>;

const GRADS = [
  ["#6750F2", "#00B4FF"], ["#F2456A", "#FF8A5B"], ["#0EA5E9", "#22D3EE"],
  ["#10B981", "#34D399"], ["#F59E0B", "#FBBF24"], ["#8B5CF6", "#EC4899"],
  ["#6366F1", "#06B6D4"], ["#3B82F6", "#6366F1"], ["#14B8A6", "#06B6D4"],
];
const hashIdx = (s, n) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973; return h % n; };
const img = (seed, w = 640, h = 640) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
const catColor = (cat) => ({ "ტექ": C.accent, "დიზაინი": C.cyan, "კითხვა": C.star, "ბაზარი": C.online, "ცხოვრება": C.like }[cat] || C.accent);

/* ─────────────────────────  SEED DATA  ───────────────────────── */
const FALLBACK_USER = { id: "", name: "მომხმარებელი", handle: "user", bio: "", followers: 0, following: 0, online: false, verified: false, admin: false };
const _users = {};
const USERS = new Proxy(_users, { get: (t, k) => (typeof k !== "string" ? t[k] : (k in t ? t[k] : { ...FALLBACK_USER, id: k })) });
let ME = "";

let pid = 100;
const np = (o) => ({ id: "p" + pid++, likedByMe: false, savedByMe: false, shares: Math.floor(Math.random() * 40), reported: false, hidden: false, comments: [], ...o });




let rid = 10;

const TRENDING = [{ tag: "buildinpublic", posts: "12.4ათ" }, { tag: "დიზაინი", posts: "8.1ათ" }, { tag: "თბილისი", posts: "44.2ათ" }, { tag: "termux", posts: "2.3ათ" }, { tag: "minimal", posts: "19.7ათ" }];
const REPLIES = ["👍", "ჰო, ნახე 👀", "კარგი!", "მაგარია 🔥", "აა გასაგებია", "სუპერ 🙌", "😂😂", "ნახე და გეტყვი", "ok, მერე", "ზუსტად ✅"];


const MARKET_CATS = ["ყველა", "ელექტრონიკა", "ავეჯი", "ტანსაცმელი", "ტრანსპორტი", "სახლი", "სხვა"];
const FORUM_CATS = ["ყველა", "ტექ", "დიზაინი", "კითხვა", "ბაზარი", "ცხოვრება"];

const MAP_FRIENDS = [
  { id: "u2", x: 33, y: 38, area: "ვაკე", last: "ახლა" },
  { id: "u4", x: 60, y: 28, area: "საბურთალო", last: "5წთ" },
  { id: "u7", x: 44, y: 60, area: "ვერა", last: "12წთ" },
  { id: "u3", x: 71, y: 56, area: "ძველი თბილისი", last: "1სთ" },
  { id: "u8", x: 25, y: 67, area: "სანდანი", last: "2სთ" },
];

/* ─────────────────────────  PRIMITIVES  ───────────────────────── */
function Pic({ src, grad, style, className = "", round = 0 }) {
  const [on, setOn] = useState(false); const [err, setErr] = useState(false);
  return (
    <div className={"overflow-hidden " + className} style={{ borderRadius: round, background: grad ? `linear-gradient(135deg, ${grad[0]}, ${grad[1]})` : C.surfaceMuted, ...style }}>
      <img src={src} alt="" onLoad={() => setOn(true)} onError={() => setErr(true)} className="w-full h-full object-cover" style={{ opacity: err ? 0 : on ? 1 : 0, transition: "opacity .55s ease" }} />
    </div>
  );
}
function Avatar({ id, size = 40, ring = false, story = false, seen = false }) {
  const u = USERS[id]; const [a, b] = GRADS[hashIdx(id, GRADS.length)];
  const inner = <div style={{ width: size, height: size, background: `linear-gradient(140deg, ${a}, ${b})`, color: "#fff", fontWeight: 700, fontSize: size * 0.4, fontFamily: DISPLAY }} className="rounded-full flex items-center justify-center select-none shrink-0">{u.name.trim()[0]}</div>;
  if (!ring) return inner;
  return <div className="rounded-full p-[2.5px] shrink-0" style={{ background: story ? (seen ? C.line : "conic-gradient(from 210deg, #6750F2, #00B4FF, #E85FB0, #6750F2)") : "transparent" }}><div className="rounded-full p-[2px]" style={{ background: C.surface }}>{inner}</div></div>;
}
const Dot = ({ size = 11 }) => <span className="rounded-full" style={{ width: size, height: size, background: C.online, boxShadow: `0 0 0 2px ${C.surface}, 0 0 8px ${C.online}` }} />;
const Name = ({ id, className = "" }) => { const u = USERS[id]; return <span className={"inline-flex items-center gap-1 " + className}><span style={{ color: C.ink }} className="font-bold truncate">{u.name}</span>{u.verified && <ShieldCheck size={14} style={{ color: C.accent }} className="shrink-0" />}</span>; };
const Handle = ({ h, t, className = "" }) => <Mono className={className} style={{ color: C.faint, fontSize: "0.82em", letterSpacing: "-0.02em" }}>@{h}{t ? " · " + t : ""}</Mono>;
function IconBtn({ children, onClick, active, badge }) {
  return <button onClick={onClick} className="relative rounded-full transition active:scale-90 hover:opacity-60" style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: active ? C.accent : C.ink2 }}>{children}{badge > 0 && <span className="absolute top-0 right-0 rounded-full flex items-center justify-center" style={{ minWidth: 17, height: 17, padding: "0 4px", background: C.like, color: "#fff", border: `2px solid ${C.surface}`, fontFamily: MONO, fontSize: 10, fontWeight: 700 }}>{badge > 9 ? "9+" : badge}</span>}</button>;
}
const Pill = ({ children, onClick, tone = "soft" }) => <button onClick={onClick} className="px-4 py-1.5 rounded-full text-sm font-bold transition active:scale-95 hover:opacity-90" style={tone === "solid" ? { backgroundImage: GBRAND, color: "#fff", boxShadow: SH.glow } : { background: C.accentSoft, color: C.accentText }}>{children}</button>;
const Wordmark = ({ size = 22 }) => <span style={{ fontFamily: DISPLAY, fontSize: size, fontWeight: 700, letterSpacing: "-0.04em", backgroundImage: GBRAND, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent" }}>mzera.</span>;
const Title = ({ children }) => <h1 className="text-[26px]" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "-0.025em" }}>{children}</h1>;
const Chips = ({ items, value, onChange }) => (
  <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-3">
    {items.map(c => <button key={c} onClick={() => onChange(c)} className="px-3.5 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition active:scale-95" style={value === c ? { backgroundImage: GBRAND, color: "#fff" } : { background: C.surface, color: C.muted, border: `1px solid ${C.line}` }}>{c}</button>)}
  </div>
);
function renderText(text, onTag) {
  return text.split("\n").map((line, li) => <span key={li}>{line.split(/(#[^\s#]+)/g).map((part, i) => part.startsWith("#") ? <span key={i} onClick={(e) => { e.stopPropagation(); onTag(part.slice(1)); }} className="cursor-pointer font-semibold" style={{ color: C.accent }}>{part}</span> : <span key={i}>{part}</span>)}{li < text.split("\n").length - 1 && <br />}</span>);
}
const Empty = ({ icon: I, t, s }) => <div className="flex flex-col items-center justify-center text-center py-16 px-6"><div className="rounded-2xl flex items-center justify-center mb-3.5" style={{ width: 62, height: 62, background: C.accentSoft }}><I size={26} style={{ color: C.accent }} /></div><div className="text-[16px]" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700 }}>{t}</div>{s && <div className="text-[14px] mt-1 max-w-[240px]" style={{ color: C.muted }}>{s}</div>}</div>;
const ThemeToggle = ({ mode, setMode, full }) => full ? (
  <div className="flex gap-1 p-1 rounded-2xl" style={{ background: C.surfaceMuted }}>
    {[["light", "ღია", Sun], ["dark", "მუქი", Moon]].map(([m, l, Ic]) => <button key={m} onClick={() => setMode(m)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold transition" style={mode === m ? { background: C.surface, color: C.accent, boxShadow: SH.card } : { color: C.muted }}><Ic size={16} />{l}</button>)}
  </div>
) : <button onClick={() => setMode(mode === "dark" ? "light" : "dark")} className="rounded-full active:scale-90 flex items-center justify-center transition" style={{ width: 40, height: 40, color: C.ink2 }}>{mode === "dark" ? <Sun size={22} /> : <Moon size={22} />}</button>;

/* ─────────────────────────  POST CARD  ───────────────────────── */
const REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "😡"];
function PostCard({ post, onLike, onReact, onSave, onComment, onPollVote, onTag, onReport, onRemove, onOpenProfile, isAdmin }) {
  const [open, setOpen] = useState(false); const [menu, setMenu] = useState(false); const [draft, setDraft] = useState(""); const [pop, setPop] = useState(false);
  const [reactOpen, setReactOpen] = useState(false); const [shared, setShared] = useState(false);
  const lpRef = useRef(null); const u = USERS[post.authorId];
  const total = post.poll ? post.poll.options.reduce((a, o) => a + o.votes, 0) : 0;
  const doReact = (emoji) => { if (!post.likedByMe) { setPop(true); setTimeout(() => setPop(false), 420); } onReact(post.id, emoji); setReactOpen(false); };
  const pressStart = () => { lpRef.current = setTimeout(() => { setReactOpen(true); lpRef.current = null; }, 380); };
  const pressEnd = () => { if (lpRef.current) { clearTimeout(lpRef.current); lpRef.current = null; if (reactOpen) setReactOpen(false); else doReact("❤️"); } };
  const pressCancel = () => { if (lpRef.current) { clearTimeout(lpRef.current); lpRef.current = null; } };
  const send = () => { if (!draft.trim()) return; onComment(post.id, draft.trim()); setDraft(""); setOpen(true); };
  const share = () => { setShared(true); setTimeout(() => setShared(false), 1500); };
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
          {menu && (<><div className="fixed inset-0 z-20" onClick={() => setMenu(false)} /><div className="absolute right-0 top-9 z-30 rounded-2xl py-1.5 w-44" style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SH.pop }}><button onClick={() => { onReport(post.id); setMenu(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:opacity-70" style={{ color: C.ink2 }}><Flag size={16} /> დაარეპორტე</button>{isAdmin && <button onClick={() => { onRemove(post.id); setMenu(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:opacity-70" style={{ color: C.like }}><Trash2 size={16} /> წაშლა (admin)</button>}</div></>)}
        </div>
      </div>
      {post.text && <div className="px-4 pb-3 text-[15px] whitespace-pre-wrap" style={{ color: C.ink2, lineHeight: 1.55 }}>{renderText(post.text, onTag)}</div>}
      {post.poll && <div className="px-4 pb-3 space-y-2">
        {post.poll.options.map((o, i) => { const pct = total ? Math.round(o.votes / total * 100) : 0; const voted = post.poll.voted != null; const mine = post.poll.voted === i; return (
          <button key={i} disabled={voted} onClick={() => onPollVote(post.id, i)} className="w-full relative overflow-hidden rounded-xl text-left transition active:scale-[.99]" style={{ border: `1.5px solid ${mine ? C.accent : C.line}`, background: C.surface }}>
            <div className="absolute inset-y-0 left-0" style={{ width: voted ? pct + "%" : "0%", background: mine ? C.accentSoft : C.surfaceMuted, transition: "width .55s cubic-bezier(.22,.61,.36,1)" }} />
            <div className="relative flex items-center justify-between px-3.5 py-2.5"><span className="text-[14px] font-semibold flex items-center gap-1.5" style={{ color: C.ink }}>{mine && <Check size={15} style={{ color: C.accent }} />}{o.text}</span>{voted && <Mono className="text-[13px] font-bold" style={{ color: mine ? C.accent : C.muted }}>{pct}%</Mono>}</div>
          </button>
        ); })}
        <Mono className="text-[12px]" style={{ color: C.faint }}>{total} ხმა{post.poll.voted != null ? " · შენ მისცი ხმა ✓" : ""}</Mono>
      </div>}
      {post.image && <Pic src={post.image} grad={GRADS[hashIdx(post.id, GRADS.length)]} style={{ aspectRatio: "1 / 1" }} className="w-full" />}
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
          <div className="pt-2.5">{post.comments.map(c => <div key={c.id} className="flex gap-2.5 py-1.5"><button onClick={() => onOpenProfile(c.authorId)} className="shrink-0 self-start"><Avatar id={c.authorId} size={30} /></button><div className="min-w-0 text-[14px]" style={{ color: C.ink2 }}><button onClick={() => onOpenProfile(c.authorId)} style={{ color: C.ink }} className="font-bold">{USERS[c.authorId].name.split(" ")[0]}</button> {c.text}<div className="mt-0.5"><Mono style={{ color: C.faint, fontSize: 12 }}>{c.time}</Mono></div></div></div>)}</div>
          <div className="flex items-center gap-2 py-2.5"><Avatar id={ME} size={30} /><input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="დაამატე კომენტარი…" className="flex-1 bg-transparent text-[14px] outline-none" style={{ color: C.ink }} />{draft.trim() && <button onClick={send} className="text-sm font-bold" style={{ color: C.accent }}>გამოქვეყნება</button>}</div>
        </div>
      )}
    </article>
  );
}

/* ─────────────────────────  STORIES  ───────────────────────── */
function StoryRow({ stories, onOpen, onAdd }) {
  return (
    <div className="flex gap-4 overflow-x-auto px-4 py-4 no-scrollbar">
      <button onClick={onAdd} className="flex flex-col items-center gap-1.5 shrink-0"><div className="relative"><Avatar id={ME} size={62} /><span className="absolute -bottom-0.5 -right-0.5 rounded-full flex items-center justify-center" style={{ width: 22, height: 22, backgroundImage: GBRAND, border: `2.5px solid ${C.surface}` }}><Plus size={13} color="#fff" /></span></div><span className="text-[12px]" style={{ color: C.muted }}>შენი story</span></button>
      {stories.map(s => <button key={s.id} onClick={() => onOpen(s.id)} className="flex flex-col items-center gap-1.5 shrink-0"><Avatar id={s.authorId} size={62} ring story seen={s.seen} /><span className="text-[12px] max-w-[68px] truncate" style={{ color: s.seen ? C.faint : C.ink2 }}>{USERS[s.authorId].name.split(" ")[0]}</span></button>)}
    </div>
  );
}
function StoryViewer({ story, onClose, onDone, flash }) {
  const [idx, setIdx] = useState(0); const [prog, setProg] = useState(0); const items = story.items;
  useEffect(() => { setProg(0); const t = setInterval(() => setProg(p => { if (p >= 100) { if (idx < items.length - 1) { setIdx(i => i + 1); return 0; } clearInterval(t); onDone(story.id); onClose(); return 100; } return p + 2; }), 60); return () => clearInterval(t); }, [idx]);
  const u = USERS[story.authorId];
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center" style={{ background: "rgba(6,7,12,.96)" }}>
      <div className="relative w-full max-w-[440px] h-full sm:h-[92vh] sm:rounded-3xl overflow-hidden">
        <div className="absolute inset-0" style={{ filter: items[idx].filter || "none" }}><Pic src={items[idx].image} grad={GRADS[hashIdx(story.id, GRADS.length)]} className="w-full h-full" /></div>
        {items[idx].stickers && items[idx].stickers.map((s, i) => <span key={i} style={{ position: "absolute", left: s.x + "%", top: s.y + "%", fontSize: 46, transform: "translate(-50%,-50%)", filter: "drop-shadow(0 2px 6px rgba(0,0,0,.45))" }}>{s.e}</span>)}
        {items[idx].text && <div className="absolute inset-x-5" style={{ top: "42%" }}><div className="text-center text-white font-bold" style={{ fontSize: 27, fontFamily: DISPLAY, textShadow: "0 2px 10px rgba(0,0,0,.7)", lineHeight: 1.2 }}>{items[idx].text}</div></div>}
        <div className="absolute top-0 inset-x-0 p-3" style={{ background: "linear-gradient(180deg, rgba(0,0,0,.45), transparent)" }}>
          <div className="flex gap-1 mb-3">{items.map((_, i) => <div key={i} className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.35)" }}><div className="h-full rounded-full" style={{ background: "#fff", width: i < idx ? "100%" : i === idx ? prog + "%" : "0%" }} /></div>)}</div>
          <div className="flex items-center gap-2.5"><Avatar id={u.id} size={34} /><span className="text-white font-bold text-sm flex-1">{u.name.split(" ")[0]} <Mono className="opacity-70 font-normal">· 2სთ</Mono></span><button onClick={onClose} className="text-white active:scale-90"><X size={26} /></button></div>
        </div>
        <button className="absolute left-0 top-0 w-1/3 h-full" onClick={() => setIdx(i => Math.max(0, i - 1))} />
        <button className="absolute right-0 top-0 w-1/3 h-full" onClick={() => idx < items.length - 1 ? setIdx(i => i + 1) : (onDone(story.id), onClose())} />
        <div className="absolute bottom-0 inset-x-0 p-3 flex items-center gap-2"><input placeholder="უპასუხე…" className="flex-1 px-4 py-2.5 rounded-full text-sm text-white bg-transparent outline-none" style={{ border: "1px solid rgba(255,255,255,.5)" }} /><button onClick={() => flash && flash("მოწონებულია ❤️")} className="text-white active:scale-90"><Heart size={26} /></button></div>
      </div>
    </div>
  );
}

/* ─────────────────────────  CREATE POST  ───────────────────────── */
const STOCK = ["new1", "new2", "new3", "new4"];
function CreateSheet({ onClose, onPost, live, onUpload }) {
  const [text, setText] = useState(""); const [picked, setPicked] = useState(null); const [poll, setPoll] = useState(null);
  const fileRef = useRef(null); const [uploading, setUploading] = useState(false);
  const pickFile = async (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; setUploading(true); try { const url = await onUpload(f); setPicked(url); } catch (err) {} setUploading(false); e.target.value = ""; };
  const validPoll = poll && poll.filter(o => o.trim()).length >= 2;
  const can = text.trim() || picked || validPoll;
  const submit = () => onPost(text.trim(), poll ? null : picked, validPoll ? { options: poll.filter(o => o.trim()).map(t => ({ text: t.trim(), votes: 0 })), voted: null } : null);
  const setOpt = (i, v) => setPoll(p => p.map((o, j) => j === i ? v : o));
  return (
    <div className="fixed inset-0 z-[60] flex sm:items-center justify-center items-end" style={{ background: "rgba(6,7,12,.55)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full sm:max-w-[520px] sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto" style={{ background: C.surface, boxShadow: SH.pop }}>
        <div className="flex items-center justify-between px-4 py-3.5 sticky top-0 z-10" style={{ background: C.surface, borderBottom: `1px solid ${C.lineSoft}` }}><button onClick={onClose} style={{ color: C.muted }}><X size={22} /></button><span className="font-bold" style={{ color: C.ink, fontFamily: DISPLAY }}>ახალი პოსტი</span><button disabled={!can} onClick={submit} className="px-4 py-1.5 rounded-full text-sm font-bold transition active:scale-95" style={{ backgroundImage: can ? GBRAND : "none", background: can ? undefined : C.line, color: can ? "#fff" : C.faint, boxShadow: can ? SH.glow : "none" }}>გაზიარება</button></div>
        <div className="p-4"><div className="flex gap-3"><Avatar id={ME} size={42} /><textarea autoFocus value={text} onChange={e => setText(e.target.value)} rows={poll ? 2 : 4} placeholder="რას ფიქრობ, გიორგი?  (#ჰეშთეგი)" className="flex-1 resize-none bg-transparent outline-none text-[16px]" style={{ color: C.ink, lineHeight: 1.55 }} /></div>{picked && !poll && <div className="relative mt-3"><Pic src={resolveImg(picked)} round={16} style={{ aspectRatio: "16/10" }} /><button onClick={() => setPicked(null)} className="absolute top-2 right-2 rounded-full p-1.5" style={{ background: "rgba(0,0,0,.5)", color: "#fff" }}><X size={16} /></button></div>}</div>
        {poll && <div className="px-4 pb-2 space-y-2">
          {poll.map((o, i) => <div key={i} className="flex items-center gap-2"><input value={o} onChange={e => setOpt(i, e.target.value)} placeholder={`ვარიანტი ${i + 1}`} className="flex-1 px-3.5 py-2.5 rounded-xl outline-none text-[14px]" style={{ background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` }} />{poll.length > 2 && <button onClick={() => setPoll(p => p.filter((_, j) => j !== i))} style={{ color: C.faint }}><X size={18} /></button>}</div>)}
          {poll.length < 4 && <button onClick={() => setPoll(p => [...p, ""])} className="flex items-center gap-1.5 text-sm font-semibold px-1 py-1" style={{ color: C.accent }}><Plus size={16} /> ვარიანტის დამატება</button>}
        </div>}
        <div className="px-4 pb-5 pt-1">
          <div className="flex gap-2 mb-3">
            <button onClick={() => { setPoll(null); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition" style={!poll ? { background: C.accentSoft, color: C.accentText } : { background: C.surfaceMuted, color: C.muted }}><ImageIcon size={17} /> ფოტო</button>
            <button onClick={() => { setPoll(poll ? null : ["", ""]); setPicked(null); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition" style={poll ? { background: C.accentSoft, color: C.accentText } : { background: C.surfaceMuted, color: C.muted }}><TrendingUp size={17} /> გამოკითხვა</button>
          </div>
          {!poll && <div className="space-y-2.5">
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickFile} />
            <button onClick={() => fileRef.current && fileRef.current.click()} disabled={uploading} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition active:scale-[.98]" style={{ background: C.accentSoft, color: C.accentText }}>{uploading ? "იტვირთება…" : <><Upload size={16} /> ფოტოს ატვირთვა</>}</button>
            <div className="flex gap-2">{STOCK.map(s => <button key={s} onClick={() => setPicked(s)} className="rounded-xl overflow-hidden shrink-0 transition" style={{ width: 64, height: 64, outline: picked === s ? `2.5px solid ${C.accent}` : "none", outlineOffset: 2 }}><Pic src={img(s, 128, 128)} className="w-full h-full" /></button>)}</div>
          </div>}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────  EXPLORE  ───────────────────────── */
function Explore({ posts, onTag, activeTag, clearTag, onOpenProfile, onSearch }) {
  const photos = posts.filter(p => p.image && !p.hidden);
  const list = activeTag ? posts.filter(p => p.text?.toLowerCase().includes("#" + activeTag.toLowerCase()) && !p.hidden) : null;
  return (
    <div className="pb-28 md:pb-10">
      <div className="px-4 pt-4 pb-3"><button onClick={onSearch} className="w-full flex items-center gap-2.5 px-4 py-3 rounded-full text-left active:scale-[.99] transition" style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SH.card }}><Search size={18} style={{ color: C.faint }} /><span className="flex-1 text-[15px]" style={{ color: C.faint }}>ძებნა — ხალხი, ჰეშთეგი, პოსტი</span></button></div>
      {activeTag ? (
        <div className="px-4"><div className="flex items-center gap-2 py-3"><button onClick={clearTag} style={{ color: C.muted }}><ArrowLeft size={20} /></button><Hash size={20} style={{ color: C.accent }} /><span className="text-xl" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "-0.02em" }}>{activeTag}</span></div><div className="space-y-3">{list.length ? list.map(p => <MiniPost key={p.id} post={p} onOpenProfile={onOpenProfile} />) : <Empty icon={Hash} t="ჯერ არაფერია" s="ამ ჰეშთეგით პოსტი ვერ მოიძებნა." />}</div></div>
      ) : (
        <>
          <div className="px-4 pb-4"><div className="text-[13px] font-bold mb-2.5 flex items-center gap-1.5" style={{ color: C.muted }}><TrendingUp size={15} /> პოპულარული</div><div className="flex flex-wrap gap-2">{TRENDING.map(t => <button key={t.tag} onClick={() => onTag(t.tag)} className="px-3.5 py-2 rounded-full text-sm font-semibold transition active:scale-95" style={{ background: C.accentSoft, color: C.accentText }}>#{t.tag} <Mono style={{ color: C.faint, fontWeight: 400 }}>· {t.posts}</Mono></button>)}</div></div>
          <div className="grid grid-cols-3 gap-1 px-1">{photos.concat(photos).map((p, i) => <button key={i} onClick={() => onOpenProfile(p.authorId)} className="relative active:scale-95 transition"><Pic src={p.image} grad={GRADS[hashIdx(p.id + i, GRADS.length)]} round={10} style={{ aspectRatio: "1" }} /><span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 text-white" style={{ textShadow: "0 1px 4px rgba(0,0,0,.6)" }}><Heart size={13} fill="#fff" /> <Mono className="text-xs font-bold">{p.likes}</Mono></span></button>)}</div>
        </>
      )}
    </div>
  );
}
const MiniPost = ({ post, onOpenProfile }) => <div className="p-3.5 flex gap-3" style={card()}><button onClick={() => onOpenProfile(post.authorId)}><Avatar id={post.authorId} size={38} /></button><div className="min-w-0 flex-1"><Name id={post.authorId} className="text-sm" /><div className="text-[14px] mt-0.5 line-clamp-2" style={{ color: C.ink2 }}>{post.text}</div><div className="mt-1.5 flex gap-3"><Mono style={{ color: C.faint, fontSize: 12 }}>♥ {post.likes}</Mono><Mono style={{ color: C.faint, fontSize: 12 }}>{post.comments.length} 💬</Mono></div></div>{post.image && <Pic src={post.image} round={12} className="w-14 h-14 shrink-0" />}</div>;

/* ─────────────────────────  FORUM  ───────────────────────── */
function Forum({ threads, onReply, onVote, onNew, onOpenProfile }) {
  const [cat, setCat] = useState("ყველა"); const [openId, setOpenId] = useState(null); const [creating, setCreating] = useState(false); const [draft, setDraft] = useState("");
  const th = threads.find(t => t.id === openId);
  if (th) {
    const u = USERS[th.authorId];
    const send = () => { if (!draft.trim()) return; onReply(th.id, draft.trim()); setDraft(""); };
    return (
      <div className="pb-28 md:pb-10">
        <div className="flex items-center gap-3 px-4 py-3 sticky top-0 z-10" style={{ background: C.paper + "e6", backdropFilter: "blur(12px)" }}><button onClick={() => setOpenId(null)} style={{ color: C.ink2 }}><ArrowLeft size={22} /></button><span className="font-bold" style={{ color: C.ink, fontFamily: DISPLAY }}>თემა</span></div>
        <div className="px-3">
          <div className="p-4" style={card()}>
            <span className="rounded-lg px-2 py-1 text-[11px] font-bold uppercase" style={{ background: catColor(th.cat) + "1f", color: catColor(th.cat), fontFamily: MONO }}>{th.cat}</span>
            <h2 className="text-[19px] mt-2.5 mb-2" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700, lineHeight: 1.3 }}>{th.title}</h2>
            <div className="text-[15px]" style={{ color: C.ink2, lineHeight: 1.55 }}>{th.body}</div>
            <div className="flex items-center gap-2.5 mt-3.5 pt-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
              <button onClick={() => onOpenProfile(u.id)}><Avatar id={u.id} size={34} /></button>
              <div className="flex-1 min-w-0 leading-tight"><Name id={u.id} className="text-[14px]" /><div><Handle h={u.handle} t={th.time} /></div></div>
              <button onClick={() => onVote(th.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-full active:scale-95 transition" style={th.likedByMe ? { backgroundImage: GBRAND, color: "#fff" } : { background: C.surfaceMuted, color: C.ink2 }}><TrendingUp size={17} /><Mono className="text-sm font-bold">{th.votes}</Mono></button>
            </div>
          </div>
          <div className="flex items-center gap-2 px-1 mt-5 mb-2"><MessageSquare size={16} style={{ color: C.muted }} /><span className="text-sm font-bold" style={{ color: C.ink }}>{th.replies.length} პასუხი</span></div>
          <div className="space-y-2.5">
            {th.replies.length ? th.replies.map(r => (
              <div key={r.id} className="p-3.5 flex gap-3" style={card()}>
                <button onClick={() => onOpenProfile(r.authorId)}><Avatar id={r.authorId} size={36} /></button>
                <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><Name id={r.authorId} className="text-[14px]" /><Mono style={{ color: C.faint, fontSize: 12 }}>{r.time}</Mono></div><div className="text-[14px] mt-1" style={{ color: C.ink2, lineHeight: 1.5 }}>{r.text}</div><div className="flex items-center gap-1.5 mt-2 text-[13px]" style={{ color: C.faint }}><Heart size={14} /> <Mono>{r.likes}</Mono></div></div>
              </div>
            )) : <Empty icon={MessageSquare} t="ჯერ პასუხი არ არის" s="დაწერე პირველი პასუხი ქვემოთ." />}
          </div>
        </div>
        <div className="fixed bottom-0 inset-x-0 z-30 md:static" style={{ background: C.surface, borderTop: `1px solid ${C.line}`, paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}>
          <div className="flex items-center gap-2 px-3 py-2.5 max-w-[600px] mx-auto"><Avatar id={ME} size={32} /><input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="დაწერე პასუხი…" className="flex-1 px-4 py-2.5 rounded-full text-[15px] outline-none" style={{ background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` }} /><button onClick={send} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 42, height: 42, backgroundImage: GBRAND, color: "#fff", boxShadow: SH.glow, opacity: draft.trim() ? 1 : 0.5 }}><Send size={19} /></button></div>
        </div>
      </div>
    );
  }
  const list = cat === "ყველა" ? threads : threads.filter(t => t.cat === cat);
  return (
    <div className="pb-28 md:pb-10">
      <div className="flex items-center justify-between px-4 pt-5 pb-3"><Title>ფორუმი</Title><Pill tone="solid" onClick={() => setCreating(true)}>+ თემა</Pill></div>
      <Chips items={FORUM_CATS} value={cat} onChange={setCat} />
      <div className="space-y-2.5 px-3">
        {list.map(t => { const u = USERS[t.authorId]; return (
          <button key={t.id} onClick={() => setOpenId(t.id)} className="w-full text-left p-4 transition active:scale-[.99]" style={card()}>
            <div className="flex items-center gap-2 mb-2"><span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase" style={{ background: catColor(t.cat) + "1f", color: catColor(t.cat), fontFamily: MONO }}>{t.cat}</span><Mono style={{ color: C.faint, fontSize: 11 }}>· {t.time}</Mono></div>
            <div className="text-[16px] mb-1" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700, lineHeight: 1.3 }}>{t.title}</div>
            <div className="text-[14px] line-clamp-2 mb-3" style={{ color: C.muted, lineHeight: 1.5 }}>{t.body}</div>
            <div className="flex items-center gap-3"><Avatar id={u.id} size={26} /><span className="text-[13px] font-semibold" style={{ color: C.ink2 }}>{u.name.split(" ")[0]}</span><div className="flex-1" /><span className="flex items-center gap-1" style={{ color: C.faint }}><TrendingUp size={14} /><Mono className="text-[13px]">{t.votes}</Mono></span><span className="flex items-center gap-1" style={{ color: C.faint }}><MessageSquare size={14} /><Mono className="text-[13px]">{t.replies.length}</Mono></span><span className="flex items-center gap-1" style={{ color: C.faint }}><Eye size={14} /><Mono className="text-[13px]">{t.views}</Mono></span></div>
          </button>
        ); })}
      </div>
      {creating && <NewThread onClose={() => setCreating(false)} onCreate={(d) => { onNew(d); setCreating(false); }} />}
    </div>
  );
}
function NewThread({ onClose, onCreate }) {
  const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [cat, setCat] = useState("ტექ");
  return (
    <div className="fixed inset-0 z-[60] flex sm:items-center justify-center items-end" style={{ background: "rgba(6,7,12,.55)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full sm:max-w-[520px] sm:rounded-3xl rounded-t-3xl" style={{ background: C.surface, boxShadow: SH.pop }}>
        <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: `1px solid ${C.lineSoft}` }}><button onClick={onClose} style={{ color: C.muted }}><X size={22} /></button><span className="font-bold" style={{ color: C.ink, fontFamily: DISPLAY }}>ახალი თემა</span><button disabled={!title.trim()} onClick={() => onCreate({ title: title.trim(), body: body.trim(), cat })} className="px-4 py-1.5 rounded-full text-sm font-bold" style={{ backgroundImage: title.trim() ? GBRAND : "none", background: title.trim() ? undefined : C.line, color: title.trim() ? "#fff" : C.faint }}>გამოქვეყნება</button></div>
        <div className="p-4 space-y-3">
          <div className="flex gap-1.5 flex-wrap">{FORUM_CATS.slice(1).map(c => <button key={c} onClick={() => setCat(c)} className="px-3 py-1.5 rounded-full text-sm font-semibold transition" style={cat === c ? { background: catColor(c) + "1f", color: catColor(c) } : { background: C.surfaceMuted, color: C.muted }}>{c}</button>)}</div>
          <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="სათაური…" className="w-full bg-transparent outline-none text-[18px] font-bold" style={{ color: C.ink, fontFamily: DISPLAY }} />
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={4} placeholder="დაწერე დეტალურად…" className="w-full resize-none bg-transparent outline-none text-[15px]" style={{ color: C.ink2, lineHeight: 1.55 }} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────  MARKETPLACE  ───────────────────────── */
const Stars = ({ n, size = 14 }) => <div className="flex items-center gap-0.5">{[1, 2, 3, 4, 5].map(i => <Star key={i} size={size} style={{ color: C.star }} fill={i <= n ? C.star : "none"} />)}</div>;

function Checkout({ item, onClose, onDone, onPlace }) {
  const [delivery, setDelivery] = useState("ship"); const [pay, setPay] = useState("card"); const [addr, setAddr] = useState(""); const [placed, setPlaced] = useState(false);
  const fee = delivery === "ship" ? 5 : 0; const total = item.price + fee;
  if (placed) return (
    <div className="fixed inset-0 z-[61] flex items-center justify-center p-6" style={{ background: "rgba(6,7,12,.6)", backdropFilter: "blur(4px)" }} onClick={onDone}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-[400px] rounded-3xl p-7 text-center" style={{ background: C.surface, boxShadow: SH.pop }}>
        <div className="rounded-full flex items-center justify-center mx-auto mb-4" style={{ width: 72, height: 72, background: C.online + "22" }}><Check size={38} style={{ color: C.online }} /></div>
        <div className="text-[20px] font-bold" style={{ color: C.ink, fontFamily: DISPLAY }}>შეკვეთა მიღებულია! 🎉</div>
        <div className="text-[14px] mt-1.5" style={{ color: C.muted }}>შეკვეთა <Mono className="font-bold" style={{ color: C.ink }}>#{Math.floor(Math.random() * 9000 + 1000)}</Mono> გაფორმდა. გამყიდველი მალე დაგიკავშირდება.</div>
        <div className="rounded-2xl p-3 mt-4 flex items-center gap-3" style={{ background: C.surfaceMuted }}><Pic src={item.image} round={10} style={{ width: 48, height: 48 }} /><div className="flex-1 text-left min-w-0"><div className="text-[13px] font-bold truncate" style={{ color: C.ink }}>{item.title}</div><div className="text-[12px]" style={{ color: C.faint }}>{delivery === "ship" ? "მიწოდება" : "თვითგატანა"} · {pay === "card" ? "ბარათი" : "ნაღდი"}</div></div><Mono className="font-bold" style={{ color: C.accent }}>{total}₾</Mono></div>
        <button onClick={onDone} className="w-full mt-5 py-3 rounded-2xl font-bold text-white active:scale-[.98]" style={{ backgroundImage: GBRAND, boxShadow: SH.glow }}>მზადაა</button>
      </div>
    </div>
  );
  return (
    <div className="fixed inset-0 z-[61] flex sm:items-center justify-center items-end" style={{ background: "rgba(6,7,12,.55)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full sm:max-w-[460px] sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto" style={{ background: C.surface, boxShadow: SH.pop }}>
        <div className="flex items-center justify-between px-4 py-3.5 sticky top-0" style={{ background: C.surface, borderBottom: `1px solid ${C.lineSoft}` }}><button onClick={onClose} style={{ color: C.muted }}><X size={22} /></button><span className="font-bold" style={{ color: C.ink, fontFamily: DISPLAY }}>გადახდა</span><div style={{ width: 22 }} /></div>
        <div className="p-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.lineSoft}` }}><Pic src={item.image} round={12} style={{ width: 60, height: 60 }} /><div className="flex-1 min-w-0"><div className="text-[15px] font-bold truncate" style={{ color: C.ink }}>{item.title}</div><div className="text-[13px]" style={{ color: C.muted }}>{item.location}</div></div><div className="font-bold" style={{ color: C.ink, fontFamily: DISPLAY, fontSize: 18 }}>{item.price}₾</div></div>
        <div className="p-4">
          <div className="text-[13px] font-bold mb-2" style={{ color: C.muted }}>მიწოდება</div>
          <div className="flex gap-2 mb-4">{[["ship", "მიწოდება", "+5₾"], ["pickup", "თვითგატანა", "უფასო"]].map(([k, l, p]) => <button key={k} onClick={() => setDelivery(k)} className="flex-1 py-3 rounded-2xl text-sm font-bold transition" style={delivery === k ? { background: C.accentSoft, color: C.accentText, border: `1.5px solid ${C.accent}` } : { background: C.surfaceMuted, color: C.muted, border: `1.5px solid transparent` }}>{l}<div className="text-[11px] font-normal mt-0.5">{p}</div></button>)}</div>
          {delivery === "ship" && <input value={addr} onChange={e => setAddr(e.target.value)} placeholder="მისამართი (ქუჩა, ნომერი)" className="w-full px-3.5 py-3 rounded-xl outline-none text-[15px] mb-4" style={{ background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` }} />}
          <div className="text-[13px] font-bold mb-2" style={{ color: C.muted }}>გადახდის მეთოდი</div>
          <div className="space-y-2 mb-4">{[["card", "ბარათი •••• 4242", true], ["cash", "ნაღდი მიწოდებისას", false]].map(([k, l]) => <button key={k} onClick={() => setPay(k)} className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition" style={{ background: pay === k ? C.accentSoft : C.surfaceMuted, border: pay === k ? `1.5px solid ${C.accent}` : `1.5px solid transparent` }}><span style={{ color: pay === k ? C.accent : C.muted }}>{k === "card" ? <Tag size={18} /> : <ShoppingBag size={18} />}</span><span className="flex-1 text-left text-[14px] font-semibold" style={{ color: C.ink }}>{l}</span><span className="rounded-full flex items-center justify-center" style={{ width: 20, height: 20, border: pay === k ? "none" : `2px solid ${C.line}`, backgroundImage: pay === k ? GBRAND : "none" }}>{pay === k && <Check size={13} color="#fff" />}</span></button>)}</div>
          <div className="rounded-2xl p-3.5 space-y-1.5" style={{ background: C.surfaceMuted }}>
            <div className="flex justify-between text-[14px]" style={{ color: C.muted }}><span>ნივთი</span><Mono>{item.price}₾</Mono></div>
            <div className="flex justify-between text-[14px]" style={{ color: C.muted }}><span>მიწოდება</span><Mono>{fee}₾</Mono></div>
            <div className="flex justify-between text-[16px] font-bold pt-1.5" style={{ color: C.ink, borderTop: `1px solid ${C.line}` }}><span>ჯამი</span><Mono style={{ color: C.accent }}>{total}₾</Mono></div>
          </div>
        </div>
        <div className="px-4 pb-5"><button onClick={() => { if (onPlace) onPlace({ delivery, payment: pay, address: addr, total }); setPlaced(true); }} className="w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2 active:scale-[.98]" style={{ backgroundImage: GBRAND, boxShadow: SH.glow, fontFamily: DISPLAY }}>შეკვეთის დადასტურება · {total}₾</button></div>
      </div>
    </div>
  );
}

function Market({ listings, onSave, onNew, onMessage, onOpenProfile, flash, live, onOrder, getReviews, onAddReview, onUpload }) {
  const [cat, setCat] = useState("ყველა"); const [openId, setOpenId] = useState(null); const [creating, setCreating] = useState(false); const [checkout, setCheckout] = useState(null);
  const [reviews, setReviews] = useState({}); const [writing, setWriting] = useState(false); const [rStars, setRStars] = useState(5); const [rText, setRText] = useState("");
  useEffect(() => { if (!openId) return; const it2 = listings.find(l => l.id === openId); if (!it2 || !getReviews) return; const sid = it2.sellerId; getReviews(sid).then(list => setReviews(rv => ({ ...rv, [sid]: list }))).catch(() => {}); }, [openId]);
  const it = listings.find(l => l.id === openId);
  const addReview = (sellerId) => { if (!rText.trim()) return; const txt = rText.trim(); setReviews(rv => ({ ...rv, [sellerId]: [{ id: "rv" + Date.now(), authorId: ME, rating: rStars, text: txt, time: "ახლა" }, ...(rv[sellerId] || [])] })); if (onAddReview) onAddReview(sellerId, rStars, txt).catch(() => {}); setRText(""); setRStars(5); setWriting(false); flash && flash("შეფასება დაემატა ⭐"); };
  if (it) {
    const u = USERS[it.sellerId]; const revs = reviews[it.sellerId] || []; const avg = revs.length ? (revs.reduce((a, r) => a + r.rating, 0) / revs.length) : 0;
    return (
      <div className="pb-28 md:pb-10">
        <div className="flex items-center gap-3 px-4 py-3 sticky top-0 z-10" style={{ background: C.paper + "e6", backdropFilter: "blur(12px)" }}><button onClick={() => setOpenId(null)} style={{ color: C.ink2 }}><ArrowLeft size={22} /></button><span className="font-bold truncate" style={{ color: C.ink, fontFamily: DISPLAY }}>{it.title}</span><div className="flex-1" /><button onClick={() => onSave(it.id)} style={{ color: it.savedByMe ? C.accent : C.ink2 }}><Bookmark size={22} fill={it.savedByMe ? C.accent : "none"} /></button></div>
        <Pic src={it.image} grad={GRADS[hashIdx(it.id, GRADS.length)]} className="w-full" style={{ aspectRatio: "4/3" }} />
        <div className="px-4 pt-4">
          <div className="flex items-baseline gap-2"><span style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700, fontSize: 30 }}>{it.price.toLocaleString()}</span><span style={{ color: C.accent, fontSize: 22, fontWeight: 700 }}>₾</span></div>
          <h2 className="text-[18px] mt-1" style={{ color: C.ink, fontWeight: 700 }}>{it.title}</h2>
          <div className="flex items-center gap-3 mt-2 text-[13px]" style={{ color: C.faint }}><span className="flex items-center gap-1"><MapPin size={14} /> {it.location}</span><Mono>· {it.time}</Mono></div>
          <div className="text-[15px] mt-4" style={{ color: C.ink2, lineHeight: 1.6 }}>{it.desc}</div>
          <button onClick={() => onOpenProfile(u.id)} className="w-full flex items-center gap-3 mt-4 p-3.5" style={card()}><Avatar id={u.id} size={44} /><div className="flex-1 text-left"><Name id={u.id} className="text-[15px]" /><div className="flex items-center gap-1.5 mt-0.5"><Stars n={Math.round(avg)} size={12} /><Mono style={{ fontSize: 12, color: C.muted }}>{avg ? avg.toFixed(1) : "—"} · {revs.length} შეფასება</Mono></div></div><ChevronRight size={20} style={{ color: C.faint }} /></button>

          <div className="flex items-center justify-between mt-6 mb-3"><h3 className="text-[16px]" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700 }}>შეფასებები</h3><button onClick={() => setWriting(w => !w)} className="text-sm font-bold flex items-center gap-1" style={{ color: C.accent }}><Plus size={16} /> დაწერე</button></div>
          {writing && <div className="p-3.5 mb-3" style={card()}><div className="flex items-center gap-2 mb-2"><span className="text-[13px]" style={{ color: C.muted }}>შენი შეფასება:</span><div className="flex gap-0.5">{[1, 2, 3, 4, 5].map(i => <button key={i} onClick={() => setRStars(i)} className="active:scale-110"><Star size={22} style={{ color: C.star }} fill={i <= rStars ? C.star : "none"} /></button>)}</div></div><textarea value={rText} onChange={e => setRText(e.target.value)} rows={2} placeholder="დაწერე შენი გამოცდილება…" className="w-full resize-none px-3 py-2.5 rounded-xl outline-none text-[14px]" style={{ background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` }} /><button onClick={() => addReview(it.sellerId)} disabled={!rText.trim()} className="mt-2 w-full py-2.5 rounded-xl text-sm font-bold" style={{ backgroundImage: rText.trim() ? GBRAND : "none", background: rText.trim() ? undefined : C.line, color: rText.trim() ? "#fff" : C.faint }}>გამოქვეყნება</button></div>}
          <div className="space-y-2.5">{revs.length ? revs.map(r => <div key={r.id} className="p-3.5" style={card()}><div className="flex items-center gap-2.5"><button onClick={() => onOpenProfile(r.authorId)}><Avatar id={r.authorId} size={34} /></button><div className="flex-1 min-w-0"><Name id={r.authorId} className="text-[14px]" /><div className="flex items-center gap-2"><Stars n={r.rating} size={11} /><Mono style={{ fontSize: 11, color: C.faint }}>{r.time}</Mono></div></div></div><div className="text-[14px] mt-2" style={{ color: C.ink2, lineHeight: 1.5 }}>{r.text}</div></div>) : <Empty icon={Star} t="ჯერ შეფასება არ არის" s="იყავი პირველი." />}</div>
        </div>
        <div className="fixed bottom-0 inset-x-0 z-30 md:static flex gap-2 px-4 py-3 max-w-[600px] mx-auto" style={{ background: C.surface, borderTop: `1px solid ${C.line}`, paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
          <button onClick={() => onMessage(u.id)} className="px-4 py-3 rounded-2xl font-bold flex items-center gap-2" style={{ background: C.surfaceMuted, color: C.ink2 }}><Send size={19} /></button>
          <button onClick={() => setCheckout(it)} className="flex-1 py-3 rounded-2xl font-bold text-white flex items-center justify-center gap-2 active:scale-[.98]" style={{ backgroundImage: GBRAND, boxShadow: SH.glow, fontFamily: DISPLAY }}><ShoppingBag size={18} /> ყიდვა · {it.price.toLocaleString()}₾</button>
        </div>
        {checkout && <Checkout item={checkout} onClose={() => setCheckout(null)} onDone={() => { setCheckout(null); flash && flash("მადლობა შენაძენისთვის! 🛍️"); }} onPlace={onOrder ? (d) => onOrder(checkout, d) : undefined} />}
      </div>
    );
  }
  const list = cat === "ყველა" ? listings : listings.filter(l => l.cat === cat);
  return (
    <div className="pb-28 md:pb-10">
      <div className="flex items-center justify-between px-4 pt-5 pb-3"><Title>მარკეტი</Title><Pill tone="solid" onClick={() => setCreating(true)}>+ გაყიდე</Pill></div>
      <Chips items={MARKET_CATS} value={cat} onChange={setCat} />
      <div className="grid grid-cols-2 gap-2.5 px-3">
        {list.map(l => { const revs = reviews[l.sellerId] || []; const avg = revs.length ? (revs.reduce((a, r) => a + r.rating, 0) / revs.length) : 0; return (
          <button key={l.id} onClick={() => setOpenId(l.id)} className="text-left overflow-hidden transition active:scale-[.98]" style={card()}>
            <Pic src={l.image} grad={GRADS[hashIdx(l.id, GRADS.length)]} style={{ aspectRatio: "1" }} className="w-full" />
            <div className="p-3"><div className="flex items-baseline gap-0.5"><span style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700, fontSize: 18 }}>{l.price.toLocaleString()}</span><span style={{ color: C.accent, fontWeight: 700, fontSize: 14 }}>₾</span></div><div className="text-[13px] mt-0.5 line-clamp-1" style={{ color: C.ink2 }}>{l.title}</div><div className="flex items-center gap-1 mt-1.5 text-[11px]" style={{ color: C.faint }}><MapPin size={11} /><span className="truncate flex-1">{l.location}</span>{avg > 0 && <span className="flex items-center gap-0.5" style={{ color: C.star }}><Star size={11} fill={C.star} /><Mono>{avg.toFixed(1)}</Mono></span>}</div></div>
          </button>
        ); })}
      </div>
      {creating && <NewListing onClose={() => setCreating(false)} onCreate={(d) => { onNew(d); setCreating(false); }} live={live} onUpload={onUpload} />}
    </div>
  );
}
function NewListing({ onClose, onCreate, live, onUpload }) {
  const [title, setTitle] = useState(""); const [price, setPrice] = useState(""); const [desc, setDesc] = useState(""); const [cat, setCat] = useState("ელექტრონიკა"); const [picked, setPicked] = useState("sell1");
  const fileRef = useRef(null); const [uploading, setUploading] = useState(false);
  const pickFile = async (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; setUploading(true); try { const url = await onUpload(f); setPicked(url); } catch (err) {} setUploading(false); e.target.value = ""; };
  const ok = title.trim() && price;
  return (
    <div className="fixed inset-0 z-[60] flex sm:items-center justify-center items-end" style={{ background: "rgba(6,7,12,.55)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full sm:max-w-[520px] sm:rounded-3xl rounded-t-3xl max-h-[88vh] overflow-y-auto" style={{ background: C.surface, boxShadow: SH.pop }}>
        <div className="flex items-center justify-between px-4 py-3.5 sticky top-0" style={{ background: C.surface, borderBottom: `1px solid ${C.lineSoft}` }}><button onClick={onClose} style={{ color: C.muted }}><X size={22} /></button><span className="font-bold" style={{ color: C.ink, fontFamily: DISPLAY }}>გაყიდე ნივთი</span><button disabled={!ok} onClick={() => onCreate({ title: title.trim(), price: Number(price), desc: desc.trim(), cat, image: resolveImg(picked) })} className="px-4 py-1.5 rounded-full text-sm font-bold" style={{ backgroundImage: ok ? GBRAND : "none", background: ok ? undefined : C.line, color: ok ? "#fff" : C.faint }}>გამოქვეყნება</button></div>
        <div className="p-4 space-y-3.5">
          <div className="flex gap-2 items-center">
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickFile} />
            <button onClick={() => fileRef.current && fileRef.current.click()} disabled={uploading} className="rounded-xl flex flex-col items-center justify-center shrink-0 active:scale-95" style={{ width: 72, height: 72, background: C.accentSoft, color: C.accentText }}>{uploading ? <span className="text-[10px] font-bold">…</span> : <><Upload size={20} /><span className="text-[10px] font-bold mt-0.5">ატვირთვა</span></>}</button>
            {picked && picked.startsWith("http") && <div className="rounded-xl overflow-hidden shrink-0" style={{ width: 72, height: 72, outline: `2.5px solid ${C.accent}`, outlineOffset: 2 }}><Pic src={picked} className="w-full h-full" /></div>}
            {["sell1", "sell2", "sell3"].map(s => <button key={s} onClick={() => setPicked(s)} className="rounded-xl overflow-hidden shrink-0" style={{ width: 72, height: 72, outline: picked === s ? `2.5px solid ${C.accent}` : "none", outlineOffset: 2 }}><Pic src={img(s, 144, 144)} className="w-full h-full" /></button>)}
          </div>
          <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="რას ყიდი?" className="w-full px-3.5 py-3 rounded-xl outline-none text-[15px]" style={{ background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` }} />
          <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl" style={{ background: C.surfaceMuted, border: `1px solid ${C.line}` }}><input value={price} onChange={e => setPrice(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="ფასი" className="flex-1 bg-transparent outline-none text-[15px]" style={{ color: C.ink, fontFamily: MONO }} /><span style={{ color: C.accent, fontWeight: 700 }}>₾</span></div>
          <div className="flex gap-1.5 flex-wrap">{MARKET_CATS.slice(1).map(c => <button key={c} onClick={() => setCat(c)} className="px-3 py-1.5 rounded-full text-sm font-semibold transition" style={cat === c ? { background: C.accentSoft, color: C.accentText } : { background: C.surfaceMuted, color: C.muted }}>{c}</button>)}</div>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="აღწერა (მდგომარეობა, დეტალები…)" className="w-full resize-none px-3.5 py-3 rounded-xl outline-none text-[15px]" style={{ background: C.surfaceMuted, color: C.ink2, border: `1px solid ${C.line}`, lineHeight: 1.5 }} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────  MAP (Snap-style)  ───────────────────────── */
function MapView({ onMessage, onMenu, onOpenProfile }) {
  const [sel, setSel] = useState(null); const [zoom, setZoom] = useState(1);
  const sf = sel ? MAP_FRIENDS.find(f => f.id === sel) : null;
  const me = { x: 48, y: 47 };
  return (
    <div className="relative overflow-hidden" style={{ height: "100dvh", background: C.mapBase }}>
      <div className="absolute inset-0" style={{ transform: `scale(${zoom})`, transformOrigin: "center", transition: "transform .35s cubic-bezier(.4,0,.2,1)" }}>
        <svg viewBox="0 0 400 700" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
          <rect width="400" height="700" fill={C.mapBase} />
          <ellipse cx="80" cy="150" rx="78" ry="58" fill={C.mapPark} />
          <rect x="248" y="430" width="130" height="110" rx="22" fill={C.mapPark} />
          <ellipse cx="330" cy="120" rx="55" ry="40" fill={C.mapPark} />
          <path d="M -20 200 C 110 270, 150 410, 310 470 C 400 500, 430 580, 445 730" fill="none" stroke={C.mapRiver} strokeWidth="32" strokeLinecap="round" />
          <g stroke={C.mapRoad} strokeWidth="11" strokeLinecap="round" opacity={DARK ? 0.85 : 1}>
            <path d="M0 120 H400" /><path d="M0 330 H400" /><path d="M0 540 H400" /><path d="M85 0 V700" /><path d="M225 0 V700" /><path d="M345 0 V700" /><path d="M-10 50 L410 360" />
          </g>
          <g stroke={C.mapRoad} strokeWidth="5" opacity={DARK ? 0.55 : 0.7}>
            <path d="M0 225 H400" /><path d="M0 435 H400" /><path d="M155 0 V700" /><path d="M290 0 V700" />
          </g>
        </svg>
        {MAP_FRIENDS.map(f => { const [a, b] = GRADS[hashIdx(f.id, GRADS.length)]; return (
          <button key={f.id} onClick={() => setSel(f.id)} className="absolute active:scale-95 transition" style={{ left: `${f.x}%`, top: `${f.y}%`, transform: "translate(-50%,-100%)" }}>
            <div className="relative" style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,.35))" }}>
              <div className="rounded-full p-[3px]" style={{ background: sel === f.id ? GBRAND : `linear-gradient(140deg,${a},${b})` }}><div className="rounded-full p-[2px]" style={{ background: C.surface }}><Avatar id={f.id} size={sel === f.id ? 48 : 40} /></div></div>
              <div className="absolute left-1/2 -bottom-1.5 w-3 h-3" style={{ background: C.surface, transform: "translateX(-50%) rotate(45deg)" }} />
              {USERS[f.id].online && <span className="absolute -top-0.5 -right-0.5 rounded-full" style={{ width: 13, height: 13, background: C.online, border: `2.5px solid ${C.surface}`, boxShadow: `0 0 8px ${C.online}` }} />}
            </div>
          </button>
        ); })}
        <div className="absolute" style={{ left: `${me.x}%`, top: `${me.y}%`, transform: "translate(-50%,-50%)" }}>
          <span className="absolute left-1/2 top-1/2 rounded-full" style={{ width: 56, height: 56, background: C.accent + "33", animation: "pulse 2.2s ease-out infinite" }} />
          <div className="relative rounded-full p-[3px]" style={{ backgroundImage: GBRAND, boxShadow: SH.glow }}><div className="rounded-full p-[2px]" style={{ background: C.surface }}><Avatar id={ME} size={40} /></div></div>
        </div>
      </div>

      <div className="absolute top-0 inset-x-0 p-3 flex items-center gap-2" style={{ background: `linear-gradient(180deg, ${C.paper}cc, transparent)` }}>
        <button onClick={onMenu} className="md:hidden rounded-full flex items-center justify-center active:scale-90" style={{ width: 42, height: 42, background: C.surface, boxShadow: SH.card, color: C.ink2 }}><Menu size={22} /></button>
        <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-full" style={{ background: C.surface, boxShadow: SH.card }}>
          <Map size={18} style={{ color: C.accent }} /><span className="font-bold text-[15px]" style={{ color: C.ink }}>რუკა</span>
          <div className="flex-1" /><span className="flex items-center gap-1" style={{ color: C.online }}><Users size={14} /><Mono className="text-[13px] font-bold">{MAP_FRIENDS.length} ახლვე</Mono></span>
        </div>
      </div>

      <div className="absolute right-3 flex flex-col gap-2" style={{ bottom: sf ? 200 : 96 }}>
        <div className="rounded-2xl overflow-hidden" style={{ background: C.surface, boxShadow: SH.card }}>
          <button onClick={() => setZoom(z => Math.min(2.2, +(z + 0.3).toFixed(2)))} className="flex items-center justify-center active:scale-90" style={{ width: 44, height: 44, color: C.ink2, borderBottom: `1px solid ${C.lineSoft}` }}><Plus size={20} /></button>
          <button onClick={() => setZoom(z => Math.max(1, +(z - 0.3).toFixed(2)))} className="flex items-center justify-center active:scale-90" style={{ width: 44, height: 44, color: C.ink2 }}><Minus size={20} /></button>
        </div>
        <button onClick={() => { setZoom(1); setSel(null); }} className="rounded-2xl flex items-center justify-center active:scale-90" style={{ width: 44, height: 44, background: C.surface, boxShadow: SH.card, color: C.accent }}><Navigation size={19} /></button>
      </div>

      {sf && (
        <div className="absolute left-3 right-3 p-3.5 flex items-center gap-3" style={{ bottom: 90, ...card() }}>
          <button onClick={() => onOpenProfile(sf.id)}><Avatar id={sf.id} size={50} /></button>
          <div className="flex-1 min-w-0"><Name id={sf.id} className="text-[15px]" /><div className="flex items-center gap-1.5 text-[13px] mt-0.5" style={{ color: C.muted }}><MapPin size={13} style={{ color: C.accent }} /> {sf.area} · <Mono style={{ color: USERS[sf.id].online ? C.online : C.faint }}>{sf.last === "ახლა" ? "ახლა აქ" : sf.last + " წინ"}</Mono></div></div>
          <button onClick={() => onMessage(sf.id)} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 44, height: 44, backgroundImage: GBRAND, color: "#fff", boxShadow: SH.glow }}><Send size={18} /></button>
          <button onClick={() => setSel(null)} className="rounded-full flex items-center justify-center" style={{ width: 32, height: 32, color: C.faint }}><X size={18} /></button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────  MESSAGES  ───────────────────────── */
const EMOJIS = ["😀","😂","🥹","😍","😎","🤩","😭","🥲","😅","😊","🙃","😉","😘","🤗","🤔","🫡","🙄","😴","🤤","😋","🤪","😇","🥳","🤯","😳","🥺","😤","😡","👍","👎","👏","🙏","💪","🔥","✨","💯","🎉","❤️","🧡","💜","💙","💚","🖤","💔","☕","🍕","⚽","🎧","📱","💻","🚀","🌚","🏔️","🌅","👀","✅","❌","💀"];
const DOCS = [{ name: "პრეზენტაცია_2026.pdf", size: "2.4 MB", kind: "pdf" }, { name: "ბიუჯეტი.xlsx", size: "184 KB", kind: "xls" }, { name: "ხელშეკრულება.docx", size: "98 KB", kind: "doc" }];
const PHOTOS = ["chat1", "chat2", "chat3", "chat4"];
const waveOf = (id) => { const a = []; for (let i = 0; i < 24; i++) a.push(5 + hashIdx(id + i, 18)); return a; };
const dl = (name, content) => { try { const b = new Blob([content || ("mzera file: " + name)], { type: "text/plain" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(u), 1000); } catch (e) {} };
const convMembers = (cv) => cv.members || (cv.withId ? [cv.withId] : []);
const convIsGroup = (cv) => convMembers(cv).length > 1;
const msgPreview = (m) => !m ? "ახალი ჩატი" : m.type === "image" ? "📷 ფოტო" : m.type === "voice" ? "🎤 ხმოვანი" : m.type === "doc" ? ("📄 " + m.doc.name) : m.type === "location" ? "📍 ლოკაცია" : ((m.fromMe ? "შენ: " : "") + m.text);

function GroupAvatar({ ids, size = 52 }) {
  const s = Math.round(size * 0.64);
  return <div className="relative shrink-0" style={{ width: size, height: size }}><div className="absolute top-0 left-0"><Avatar id={ids[0]} size={s} /></div><div className="absolute bottom-0 right-0 rounded-full p-[2px]" style={{ background: C.surface }}><Avatar id={ids[1] || ids[0]} size={s} /></div></div>;
}
function VoiceMsg({ id, dur, mine }) {
  const [playing, setPlaying] = useState(false); const [prog, setProg] = useState(0); const wave = waveOf(id);
  useEffect(() => { if (!playing) return; const step = 100 / (dur * 10); const t = setInterval(() => setProg(p => { if (p >= 100) { clearInterval(t); setPlaying(false); return 0; } return p + step; }), 100); return () => clearInterval(t); }, [playing]);
  const col = mine ? "#fff" : C.accent; const sub = mine ? "rgba(255,255,255,.45)" : C.line;
  return (
    <div className="flex items-center gap-2.5" style={{ minWidth: 168 }}>
      <button onClick={() => setPlaying(p => !p)} className="rounded-full flex items-center justify-center shrink-0 active:scale-90" style={{ width: 34, height: 34, background: mine ? "rgba(255,255,255,.22)" : C.accentSoft, color: mine ? "#fff" : C.accent }}>{playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}</button>
      <div className="flex items-center gap-[2px] flex-1" style={{ height: 26 }}>{wave.map((h, i) => <div key={i} className="rounded-full" style={{ width: 3, height: h, background: (i / wave.length) * 100 <= prog ? col : sub }} />)}</div>
      <Mono style={{ fontSize: 11, color: mine ? "rgba(255,255,255,.8)" : C.faint }}>{Math.floor(dur / 60)}:{String(dur % 60).padStart(2, "0")}</Mono>
    </div>
  );
}
function DocMsg({ doc, mine }) {
  const colors = { pdf: "#F2456A", xls: "#16C784", doc: "#3B82F6" }; const cc = colors[doc.kind] || C.accent;
  return (
    <button onClick={() => dl(doc.name, "mzera document — " + doc.name)} className="flex items-center gap-3 active:scale-[.98]" style={{ minWidth: 210 }}>
      <div className="rounded-xl flex items-center justify-center shrink-0" style={{ width: 40, height: 40, background: mine ? "rgba(255,255,255,.2)" : cc + "22" }}><FileText size={20} color={mine ? "#fff" : cc} /></div>
      <div className="flex-1 min-w-0 text-left"><div className="text-[13px] font-bold truncate" style={{ color: mine ? "#fff" : C.ink }}>{doc.name}</div><div className="text-[11px]" style={{ color: mine ? "rgba(255,255,255,.7)" : C.faint }}>{doc.size}</div></div>
      <Download size={18} style={{ color: mine ? "#fff" : C.accent }} />
    </button>
  );
}
function EmojiPanel({ onPick }) {
  return <div className="grid grid-cols-8 gap-0.5 p-2 overflow-y-auto no-scrollbar" style={{ maxHeight: 190, background: C.surfaceMuted, borderTop: `1px solid ${C.line}` }}>{EMOJIS.map((e, i) => <button key={i} onClick={() => onPick(e)} className="rounded-lg active:scale-90 transition" style={{ fontSize: 23, padding: 3 }}>{e}</button>)}</div>;
}
function PeoplePicker({ title, cta, exclude = [], onClose, onConfirm, live }) {
  const [sel, setSel] = useState([]);
  const [q, setQ] = useState(""); const [results, setResults] = useState(null); const [searching, setSearching] = useState(false);
  useEffect(() => {
    const t = q.trim(); if (!t) { setResults(null); return; }
    setSearching(true);
    const h = setTimeout(async () => { try { const r = await profilesApi.search(t); r.forEach(mergeProfile); setResults(r.map(p => p.id).filter(id => id !== ME && !exclude.includes(id))); } catch (e) { setResults([]); } setSearching(false); }, 300);
    return () => clearTimeout(h);
  }, [q, live]);
  const ql = q.trim().toLowerCase();
  const localAvail = Object.values(USERS).filter(u => u.id !== ME && !exclude.includes(u.id) && (!ql || u.name.toLowerCase().includes(ql) || u.handle.toLowerCase().includes(ql)));
  const avail = results ? [...new Set([...results, ...localAvail.map(u => u.id)])].map(id => USERS[id]).filter(Boolean) : localAvail;
  const toggle = (id) => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  return (
    <div className="fixed inset-0 z-[60] flex sm:items-center justify-center items-end" style={{ background: "rgba(6,7,12,.55)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full sm:max-w-[480px] sm:rounded-3xl rounded-t-3xl max-h-[82vh] flex flex-col" style={{ background: C.surface, boxShadow: SH.pop }}>
        <div className="flex items-center justify-between px-4 py-3.5 shrink-0" style={{ borderBottom: `1px solid ${C.lineSoft}` }}><button onClick={onClose} style={{ color: C.muted }}><X size={22} /></button><span className="font-bold" style={{ color: C.ink, fontFamily: DISPLAY }}>{title}</span><button disabled={!sel.length} onClick={() => onConfirm(sel)} className="px-4 py-1.5 rounded-full text-sm font-bold" style={{ backgroundImage: sel.length ? GBRAND : "none", background: sel.length ? undefined : C.line, color: sel.length ? "#fff" : C.faint }}>{cta}{sel.length ? ` (${sel.length})` : ""}</button></div>
        <div className="px-3 py-2.5 shrink-0" style={{ borderBottom: `1px solid ${C.lineSoft}` }}><div className="flex items-center gap-2 px-3 py-2 rounded-full" style={{ background: C.surfaceMuted }}><Search size={16} style={{ color: C.faint }} /><input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="მოძებნე ხალხი…" className="flex-1 bg-transparent text-[14px] outline-none" style={{ color: C.ink }} />{searching && <Mono style={{ fontSize: 11, color: C.faint }}>…</Mono>}</div></div>
        {sel.length > 0 && <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-3 shrink-0" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>{sel.map(id => <div key={id} className="flex flex-col items-center gap-1 shrink-0"><div className="relative"><Avatar id={id} size={44} /><button onClick={() => toggle(id)} className="absolute -top-1 -right-1 rounded-full flex items-center justify-center" style={{ width: 18, height: 18, background: C.ink, color: "#fff" }}><X size={11} /></button></div><span className="text-[11px]" style={{ color: C.muted }}>{USERS[id].name.split(" ")[0]}</span></div>)}</div>}
        <div className="overflow-y-auto p-2">{avail.map(u => { const on = sel.includes(u.id); return (
          <button key={u.id} onClick={() => toggle(u.id)} className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl transition" style={{ background: on ? C.accentSoft : "transparent" }}>
            <div className="relative"><Avatar id={u.id} size={44} />{u.online && <span className="absolute bottom-0 right-0"><Dot size={11} /></span>}</div>
            <div className="flex-1 text-left min-w-0"><Name id={u.id} className="text-[15px]" /><Mono className="block truncate" style={{ fontSize: 12, color: C.faint }}>@{u.handle}</Mono></div>
            <div className="rounded-full flex items-center justify-center shrink-0" style={{ width: 24, height: 24, border: on ? "none" : `2px solid ${C.line}`, backgroundImage: on ? GBRAND : "none" }}>{on && <Check size={15} color="#fff" />}</div>
          </button>
        ); })}{avail.length === 0 && <div className="text-center py-10 text-[13px]" style={{ color: C.faint }}>{q.trim() ? "ვერ მოიძებნა" : "—"}</div>}</div>
      </div>
    </div>
  );
}

function Messages({ convos, openId, setOpenId, onSend, onReply, onCreateConvo, onOpenProfile, live }) {
  const [draft, setDraft] = useState(""); const [typing, setTyping] = useState(false);
  const [recording, setRecording] = useState(false); const [recSecs, setRecSecs] = useState(0);
  const [attach, setAttach] = useState(null); const [emoji, setEmoji] = useState(false); const [picker, setPicker] = useState(null);
  const scrollRef = useRef(null);
  const cv = convos.find(c => c.id === openId);
  const bottom = () => requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; });
  useEffect(() => { bottom(); }, [cv?.messages.length, typing, openId, attach, emoji]);
  useEffect(() => { if (!recording) return; const t = setInterval(() => setRecSecs(s => s + 1), 1000); return () => clearInterval(t); }, [recording]);

  const afterSend = (id) => {};
  const sendText = () => { if (!draft.trim()) return; onSend(cv.id, { type: "text", text: draft.trim() }); setDraft(""); setEmoji(false); afterSend(cv.id); };
  const sendMedia = (p) => { onSend(cv.id, p); setAttach(null); afterSend(cv.id); };
  const startRec = () => { setEmoji(false); setAttach(null); setRecSecs(0); setRecording(true); };
  const sendVoice = () => { const d = Math.max(1, recSecs); setRecording(false); onSend(cv.id, { type: "voice", dur: d }); afterSend(cv.id); };

  if (cv) {
    const members = convMembers(cv); const group = convIsGroup(cv); const other = USERS[members[0]];
    const startAdd = (sel) => { const id = onCreateConvo([...members, ...sel]); setPicker(null); setOpenId(id); };
    return (
      <div className="fixed inset-0 z-40 flex justify-center" style={{ background: C.paper }}>
        <div className="flex flex-col w-full max-w-[600px]" style={{ height: "100dvh", background: C.paper, borderLeft: `1px solid ${C.line}`, borderRight: `1px solid ${C.line}` }}>
          <div className="flex items-center gap-3 px-3 py-2.5 shrink-0" style={{ background: C.surface + "f2", backdropFilter: "blur(14px)", borderBottom: `1px solid ${C.line}` }}>
            <button onClick={() => setOpenId(null)} className="active:scale-90" style={{ color: C.ink2 }}><ArrowLeft size={22} /></button>
            {group ? <GroupAvatar ids={members} size={40} /> : <button onClick={() => onOpenProfile(other.id)} className="relative active:scale-90"><Avatar id={other.id} size={38} />{other.online && <span className="absolute bottom-0 right-0"><Dot size={11} /></span>}</button>}
            <div className="leading-tight min-w-0 flex-1">{group ? <div className="font-bold truncate" style={{ color: C.ink }}>{cv.name}</div> : <Name id={other.id} className="text-[15px]" />}<div className="text-[12px] truncate" style={{ color: typing ? C.accent : group ? C.muted : (other.online ? C.online : C.faint) }}>{typing ? "წერს…" : group ? `${members.length + 1} მონაწილე` : (other.online ? "ონლაინ" : "ბოლოს 2სთ წინ")}</div></div>
            <button onClick={() => setPicker("add")} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 40, height: 40, color: C.accent }}><UserPlus size={21} /></button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
            {cv.messages.length === 0 && <div className="flex flex-col items-center justify-center text-center py-12" style={{ color: C.faint }}><div className="rounded-2xl flex items-center justify-center mb-3" style={{ width: 56, height: 56, background: C.accentSoft }}><Send size={24} style={{ color: C.accent }} /></div><div className="text-[14px]">დაიწყე საუბარი 👋</div></div>}
            {cv.messages.map((m, i) => {
              const mine = m.fromMe; const prev = cv.messages[i - 1];
              const showSender = group && !mine && m.from && (!prev || prev.from !== m.from || prev.fromMe);
              const bubbleStyle = mine ? { backgroundImage: GBRAND, color: "#fff", borderRadius: "18px 18px 5px 18px" } : { background: C.surface, color: C.ink, border: `1px solid ${C.line}`, borderRadius: "18px 18px 18px 5px" };
              const tcol = mine ? "rgba(255,255,255,.72)" : C.faint;
              return (
                <div key={m.id} className={"flex gap-2 " + (mine ? "justify-end" : "justify-start")}>
                  {group && !mine && <div className="shrink-0 self-end" style={{ width: 28 }}>{showSender && <button onClick={() => onOpenProfile(m.from)} className="active:scale-90"><Avatar id={m.from} size={28} /></button>}</div>}
                  <div className="max-w-[80%] flex flex-col" style={{ alignItems: mine ? "flex-end" : "flex-start" }}>
                    {showSender && <span className="text-[11px] font-bold mb-0.5 px-1" style={{ color: GRADS[hashIdx(m.from, GRADS.length)][0] }}>{USERS[m.from].name.split(" ")[0]}</span>}
                    {m.type === "image" ? (
                      <div className="relative"><Pic src={m.image} grad={GRADS[hashIdx(m.id, GRADS.length)]} round={16} style={{ width: 210, aspectRatio: "1" }} /><button onClick={() => window.open(m.image, "_blank")} className="absolute top-2 right-2 rounded-full flex items-center justify-center active:scale-90" style={{ width: 30, height: 30, background: "rgba(0,0,0,.5)", color: "#fff" }}><Download size={16} /></button><Mono className="block text-right mt-0.5" style={{ fontSize: 10, color: C.faint }}>{m.time}</Mono></div>
                    ) : m.type === "location" ? (
                      <div className="p-2" style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, width: 224 }}><MiniMap h={110} /><div className="flex items-center justify-between mt-1.5"><div className="flex items-center gap-1.5 text-[13px]" style={{ color: C.ink2 }}><MapPin size={14} style={{ color: C.accent }} /> {m.place}</div><Mono style={{ fontSize: 10, color: C.faint }}>{m.time}</Mono></div></div>
                    ) : (
                      <div className="px-3.5 py-2 text-[15px]" style={{ ...bubbleStyle, lineHeight: 1.4 }}>
                        {m.type === "voice" ? <VoiceMsg id={m.id} dur={m.dur} mine={mine} /> : m.type === "doc" ? <DocMsg doc={m.doc} mine={mine} /> : m.text}
                        <div className="text-right" style={{ marginTop: 2 }}><Mono style={{ fontSize: 10, color: tcol }}>{m.time}{mine ? " ✓✓" : ""}</Mono></div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {typing && <div className="flex justify-start"><div className="px-4 py-3 flex items-center gap-1.5" style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: "18px 18px 18px 5px" }}>{[0, 1, 2].map(i => <span key={i} className="rounded-full" style={{ width: 7, height: 7, background: C.faint, animation: "tdot 1.2s infinite", animationDelay: i * 0.18 + "s" }} />)}</div></div>}
            <div className="h-1" />
          </div>

          {attach && !recording && (
            <div style={{ background: C.surface, borderTop: `1px solid ${C.line}` }}>
              {attach === "menu" && <div className="flex gap-3 p-4">{[["photo", ImageIcon, "ფოტო", C.accent], ["doc", FileText, "დოკუმენტი", C.cyan], ["loc", MapPin, "ლოკაცია", C.like]].map(([k, I, l, col]) => <button key={k} onClick={() => k === "loc" ? sendMedia({ type: "location", place: "ვაკე, თბილისი" }) : setAttach(k)} className="flex-1 flex flex-col items-center gap-2 py-3 rounded-2xl active:scale-95" style={{ background: C.surfaceMuted }}><div className="rounded-2xl flex items-center justify-center" style={{ width: 46, height: 46, background: col + "22" }}><I size={22} color={col} /></div><span className="text-[13px] font-semibold" style={{ color: C.ink2 }}>{l}</span></button>)}</div>}
              {attach === "photo" && <div className="flex gap-2 p-3 overflow-x-auto no-scrollbar"><button onClick={() => setAttach("menu")} className="shrink-0 rounded-xl flex items-center justify-center" style={{ width: 72, height: 72, background: C.surfaceMuted, color: C.muted }}><ArrowLeft size={20} /></button>{PHOTOS.map(s => <button key={s} onClick={() => sendMedia({ type: "image", image: img(s) })} className="shrink-0 rounded-xl overflow-hidden active:scale-95"><Pic src={img(s, 144, 144)} className="w-[72px] h-[72px]" /></button>)}</div>}
              {attach === "doc" && <div className="p-2"><button onClick={() => setAttach("menu")} className="flex items-center gap-2 px-2 py-1.5 text-sm" style={{ color: C.muted }}><ArrowLeft size={16} /> უკან</button>{DOCS.map(d => <button key={d.name} onClick={() => sendMedia({ type: "doc", doc: d })} className="w-full flex items-center gap-3 p-2.5 rounded-xl active:scale-[.98]"><div className="rounded-xl flex items-center justify-center shrink-0" style={{ width: 40, height: 40, background: C.accentSoft }}><FileText size={20} style={{ color: C.accent }} /></div><div className="flex-1 text-left min-w-0"><div className="text-[14px] font-bold truncate" style={{ color: C.ink }}>{d.name}</div><div className="text-[12px]" style={{ color: C.faint }}>{d.size}</div></div></button>)}</div>}
            </div>
          )}
          {emoji && !recording && <EmojiPanel onPick={(e) => setDraft(d => d + e)} />}

          <div className="flex items-center gap-2 px-2.5 py-2.5 shrink-0" style={{ background: C.surface, borderTop: `1px solid ${C.line}`, paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}>
            {recording ? (
              <>
                <button onClick={() => setRecording(false)} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 40, height: 40, color: C.like }}><Trash2 size={20} /></button>
                <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-full" style={{ background: C.likeSoft }}><span className="rounded-full" style={{ width: 10, height: 10, background: C.like, animation: "tdot 1.2s infinite" }} /><Mono className="font-bold" style={{ color: C.like }}>{Math.floor(recSecs / 60)}:{String(recSecs % 60).padStart(2, "0")}</Mono><span className="text-[13px]" style={{ color: C.like }}>ჩაწერა…</span></div>
                <button onClick={sendVoice} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 42, height: 42, backgroundImage: GBRAND, color: "#fff", boxShadow: SH.glow }}><Send size={19} /></button>
              </>
            ) : (
              <>
                <button onClick={() => { setAttach(a => a ? null : "menu"); setEmoji(false); }} className="rounded-full flex items-center justify-center active:scale-90 transition" style={{ width: 40, height: 40, color: attach ? C.accent : C.ink2, transform: attach ? "rotate(45deg)" : "none" }}><Plus size={24} /></button>
                <button onClick={() => { setEmoji(e => !e); setAttach(null); }} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 38, height: 38, color: emoji ? C.accent : C.ink2 }}><Smile size={23} /></button>
                <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter") sendText(); }} onFocus={() => { setEmoji(false); setAttach(null); }} placeholder="შეტყობინება…" className="flex-1 px-4 py-2.5 rounded-full text-[15px] outline-none" style={{ background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` }} />
                {draft.trim() ? <button onClick={sendText} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 42, height: 42, backgroundImage: GBRAND, color: "#fff", boxShadow: SH.glow }}><Send size={19} /></button> : <button onClick={startRec} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 42, height: 42, background: C.surfaceMuted, color: C.accent }}><Mic size={20} /></button>}
              </>
            )}
          </div>
        </div>
        {picker === "add" && <PeoplePicker title="ჩატში დამატება" cta="დაამატე" exclude={members} onClose={() => setPicker(null)} onConfirm={startAdd} live={live} />}
      </div>
    );
  }

  const startNew = (sel) => {
    setPicker(null);
    if (sel.length === 1) { const ex = convos.find(c => !convIsGroup(c) && convMembers(c)[0] === sel[0]); if (ex) { setOpenId(ex.id); return; } }
    setOpenId(onCreateConvo(sel));
  };
  return (
    <div className="pb-28 md:pb-8">
      <div className="flex items-center justify-between px-4 pt-5 pb-3"><Title>შეტყობინებები</Title><button onClick={() => setPicker("new")} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 42, height: 42, backgroundImage: GBRAND, color: "#fff", boxShadow: SH.glow }}><Plus size={22} /></button></div>
      {convos.map(c => { const members = convMembers(c); const group = convIsGroup(c); const other = USERS[members[0]]; const last = c.messages[c.messages.length - 1]; return (
        <button key={c.id} onClick={() => setOpenId(c.id)} className="w-full flex items-center gap-3 px-4 py-3 transition hover:opacity-80" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
          {group ? <GroupAvatar ids={members} size={52} /> : <div className="relative"><Avatar id={other.id} size={52} />{other.online && <span className="absolute bottom-0.5 right-0.5"><Dot size={13} /></span>}</div>}
          <div className="min-w-0 flex-1 text-left">
            <div className="flex items-center justify-between gap-2">{group ? <span className="font-bold truncate" style={{ color: C.ink }}>{c.name}</span> : <Name id={other.id} className="text-[15px]" />}<div className="flex items-center gap-1.5 shrink-0">{!group && STREAKS[other.id] > 0 && <span className="flex items-center gap-0.5"><span style={{ fontSize: 12 }}>🔥</span><Mono style={{ color: C.star, fontSize: 11, fontWeight: 700 }}>{STREAKS[other.id]}</Mono></span>}<Mono style={{ color: C.faint, fontSize: 12 }}>{last ? last.time : ""}</Mono></div></div>
            <div className="flex items-center gap-2"><span className="text-[14px] truncate flex-1" style={{ color: c.unread ? C.ink : C.muted, fontWeight: c.unread ? 600 : 400 }}>{group && last && last.from ? USERS[last.from].name.split(" ")[0] + ": " : ""}{msgPreview(last)}</span>{c.unread > 0 && <span className="rounded-full flex items-center justify-center shrink-0 text-white" style={{ minWidth: 19, height: 19, padding: "0 5px", backgroundImage: GBRAND, fontFamily: MONO, fontSize: 11, fontWeight: 700 }}>{c.unread}</span>}</div>
          </div>
        </button>
      ); })}
      {picker === "new" && <PeoplePicker title="ახალი ჩატი" cta="შექმნა" onClose={() => setPicker(null)} onConfirm={startNew} live={live} />}
    </div>
  );
}

/* ─────────────────────────  PROFILE  ───────────────────────── */
function FollowBtn({ id, isFollowing, onToggle }) {
  const on = isFollowing(id);
  return <button onClick={(e) => { e.stopPropagation(); onToggle(id); }} className="px-4 py-1.5 rounded-full text-sm font-bold transition active:scale-95 shrink-0" style={on ? { background: C.surfaceMuted, color: C.ink2, border: `1px solid ${C.line}` } : { backgroundImage: GBRAND, color: "#fff", boxShadow: SH.glow }}>{on ? "მიჰყვები" : "მიყევი"}</button>;
}

function Profile({ userId, posts, xp, meProfile, following, followerCounts, onToggleFollow, onMessage, onOpenList, onSettings, flash, onBack, onTag, onLike, onReact, onSave, onComment, onPollVote, onReport, onRemove, onOpenProfile, isAdmin }) {
  const u = USERS[userId]; const isMe = userId === ME; const [tab, setTab] = useState("grid");
  const dispName = isMe && meProfile ? meProfile.name : u.name; const dispBio = isMe && meProfile ? meProfile.bio : u.bio;
  const mine = posts.filter(p => p.authorId === userId && !p.hidden); const photos = mine.filter(p => p.image); const saved = posts.filter(p => p.savedByMe && !p.hidden);
  const { lvl } = levelInfo(xp || 0);
  const followers = (followerCounts && followerCounts[userId] != null) ? followerCounts[userId] : u.followers;
  const followingCount = isMe ? following.length : u.following;
  const amFollowing = following.includes(userId);
  const fmt = (n) => n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "ათ" : "" + n;
  const HL = [["თბილისი", "hl1"], ["კოდი", "hl2"], ["მთები", "hl3"], ["ყავა", "hl4"], ["დიზაინი", "hl5"]];
  return (
    <div className="pb-28 md:pb-10">
      <div className="relative">
        <Pic src={img("cover" + userId, 800, 320)} grad={GRADS[hashIdx(userId, GRADS.length)]} className="w-full" style={{ height: 168 }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(0,0,0,.28), rgba(0,0,0,.04))" }} />
        <div className="absolute top-0 inset-x-0 flex items-center gap-3 px-4 py-3">
          {!isMe && <button onClick={onBack} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 38, height: 38, background: "rgba(0,0,0,.4)", color: "#fff", backdropFilter: "blur(6px)" }}><ArrowLeft size={20} /></button>}
          <div className="flex-1" />
          <button onClick={() => isMe ? onSettings() : flash("პროფილის ლინკი დაკოპირდა")} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 38, height: 38, background: "rgba(0,0,0,.4)", color: "#fff", backdropFilter: "blur(6px)" }}>{isMe ? <Settings size={19} /> : <MoreHorizontal size={20} />}</button>
        </div>
      </div>
      <div className="px-4">
        <div className="flex items-end justify-between" style={{ marginTop: 8 }}>
          <div className="rounded-full" style={{ padding: 6, background: C.paper, boxShadow: "0 8px 20px -6px rgba(0,0,0,.32)" }}><Avatar id={u.id} size={84} /></div>
          {isMe
            ? <div className="mb-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundImage: GBRAND, color: "#fff", boxShadow: SH.glow }}><Zap size={14} fill="#fff" /><span className="text-[13px] font-bold" style={{ fontFamily: DISPLAY }}>LVL {lvl}</span></div>
            : <div className="mb-2 flex gap-2"><button onClick={() => onToggleFollow(userId)} className="px-5 py-2 rounded-xl text-sm font-bold transition active:scale-95" style={amFollowing ? { background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` } : { backgroundImage: GBRAND, color: "#fff", boxShadow: SH.glow }}>{amFollowing ? "მიჰყვები ✓" : "მიყევი"}</button></div>}
        </div>
        <div className="mt-2.5 flex items-center gap-1.5"><span style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700, fontSize: 20 }}>{dispName}</span>{u.verified && <ShieldCheck size={17} style={{ color: C.accent }} />}</div>
        <Mono style={{ fontSize: 13, color: C.faint }}>@{u.handle}</Mono>
        <div className="text-[14px] mt-2" style={{ color: C.ink2, lineHeight: 1.5 }}>{dispBio}</div>
        <div className="flex items-center gap-3 mt-2 text-[13px]" style={{ color: C.faint }}><span className="flex items-center gap-1"><MapPin size={13} /> თბილისი</span><span className="flex items-center gap-1" style={{ color: C.accent }}><Link2 size={13} /> <Mono style={{ fontSize: 12 }}>4-6-tau.vercel.app</Mono></span></div>
        <div className="grid grid-cols-3 mt-4 py-3.5" style={card()}>
          <div className="text-center"><Mono className="text-lg font-bold block" style={{ color: C.ink }}>{mine.length}</Mono><div className="text-[12px]" style={{ color: C.muted }}>პოსტი</div></div>
          <button onClick={() => onOpenList("followers", userId)} className="text-center active:opacity-60" style={{ borderLeft: `1px solid ${C.lineSoft}` }}><Mono className="text-lg font-bold block" style={{ color: C.ink }}>{fmt(followers)}</Mono><div className="text-[12px]" style={{ color: C.muted }}>მიმდევარი</div></button>
          <button onClick={() => onOpenList("following", userId)} className="text-center active:opacity-60" style={{ borderLeft: `1px solid ${C.lineSoft}` }}><Mono className="text-lg font-bold block" style={{ color: C.ink }}>{fmt(followingCount)}</Mono><div className="text-[12px]" style={{ color: C.muted }}>მიჰყვება</div></button>
        </div>
        <div className="flex gap-2 mt-3">{isMe
          ? <button onClick={onSettings} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: C.surface, color: C.ink, border: `1px solid ${C.line}`, boxShadow: SH.card }}>პროფილის რედაქტირება</button>
          : <><button onClick={() => onToggleFollow(userId)} className="flex-1 py-2.5 rounded-xl text-sm font-bold transition active:scale-95" style={amFollowing ? { background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` } : { backgroundImage: GBRAND, color: "#fff", boxShadow: SH.glow }}>{amFollowing ? "მიჰყვები ✓" : "მიყევი"}</button><button onClick={() => onMessage(userId)} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: C.surface, color: C.ink, border: `1px solid ${C.line}` }}>შეტყობინება</button></>}</div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar mt-4 pb-1">
          {isMe && <button onClick={() => flash("Highlight — მალე ✨")} className="flex flex-col items-center gap-1.5 shrink-0"><div className="rounded-full flex items-center justify-center" style={{ width: 60, height: 60, border: `2px dashed ${C.line}`, color: C.muted }}><Plus size={22} /></div><span className="text-[11px]" style={{ color: C.muted }}>ახალი</span></button>}
          {HL.map(([label, seed]) => <button key={seed} onClick={() => flash(label + " · highlight")} className="flex flex-col items-center gap-1.5 shrink-0"><div className="rounded-full p-[2px]" style={{ backgroundImage: GBRAND }}><div className="rounded-full p-[2px]" style={{ background: C.paper }}><Pic src={img(seed, 120, 120)} round={999} style={{ width: 54, height: 54 }} /></div></div><span className="text-[11px]" style={{ color: C.ink2 }}>{label}</span></button>)}
        </div>
      </div>
      <div className="flex mt-5" style={{ borderBottom: `1px solid ${C.line}` }}>{[["grid", "ფოტოები"], ["posts", "პოსტები"], ...(isMe ? [["saved", "შენახული"]] : [])].map(([k, l]) => <button key={k} onClick={() => setTab(k)} className="flex-1 py-3 text-sm font-bold transition" style={{ color: tab === k ? C.accent : C.faint, borderBottom: tab === k ? `2px solid ${C.accent}` : "2px solid transparent" }}>{l}</button>)}</div>
      {tab === "grid" && (photos.length ? <div className="grid grid-cols-3 gap-1 px-1 pt-1">{photos.map(p => <Pic key={p.id} src={p.image} grad={GRADS[hashIdx(p.id, GRADS.length)]} round={10} style={{ aspectRatio: "1" }} />)}</div> : <Empty icon={Camera} t="ჯერ ფოტო არ არის" s="გაზიარებული ფოტოები აქ გამოჩნდება." />)}
      {tab === "posts" && <div className="space-y-4 px-3 pt-4">{mine.length ? mine.map(p => <PostCard key={p.id} post={p} onLike={onLike} onReact={onReact} onSave={onSave} onComment={onComment} onPollVote={onPollVote} onTag={onTag} onReport={onReport} onRemove={onRemove} onOpenProfile={onOpenProfile} isAdmin={isAdmin} />) : <Empty icon={ImageIcon} t="პოსტი არ არის" s="" />}</div>}
      {tab === "saved" && <div className="space-y-4 px-3 pt-4">{saved.length ? saved.map(p => <PostCard key={p.id} post={p} onLike={onLike} onReact={onReact} onSave={onSave} onComment={onComment} onPollVote={onPollVote} onTag={onTag} onReport={onReport} onRemove={onRemove} onOpenProfile={onOpenProfile} isAdmin={isAdmin} />) : <Empty icon={Bookmark} t="ჯერ არაფერი შეგინახავს" s="დააჭირე bookmark-ს." />}</div>}
    </div>
  );
}

function FollowList({ view, following, onToggleFollow, onOpenProfile, onClose }) {
  const [type, setType] = useState(view.type);
  const u = USERS[view.userId];
  const ids = type === "following"
    ? (view.userId === ME ? following : ["u1", "u2", "u4", "u7", "u6"].filter(x => x !== view.userId))
    : Object.values(USERS).map(x => x.id).filter(x => x !== view.userId);
  return (
    <div className="fixed inset-0 z-[58] flex justify-center" style={{ background: C.paper }}>
      <div className="w-full max-w-[600px] flex flex-col" style={{ height: "100dvh", borderLeft: `1px solid ${C.line}`, borderRight: `1px solid ${C.line}` }}>
        <div className="flex items-center gap-3 px-3 py-3 shrink-0" style={{ background: C.surface, borderBottom: `1px solid ${C.line}` }}>
          <button onClick={onClose} className="active:scale-90" style={{ color: C.ink2 }}><ArrowLeft size={22} /></button>
          <Mono className="font-bold text-[15px]" style={{ color: C.ink }}>@{u.handle}</Mono>
        </div>
        <div className="flex shrink-0" style={{ background: C.surface, borderBottom: `1px solid ${C.line}` }}>{[["followers", "მიმდევრები"], ["following", "მიჰყვება"]].map(([k, l]) => <button key={k} onClick={() => setType(k)} className="flex-1 py-3 text-sm font-bold transition" style={{ color: type === k ? C.accent : C.faint, borderBottom: type === k ? `2px solid ${C.accent}` : "2px solid transparent" }}>{l}</button>)}</div>
        <div className="flex-1 overflow-y-auto p-2">
          {ids.length === 0 ? <Empty icon={Users} t="ცარიელია" s="ჯერ არავინ." /> : ids.map(id => (
            <button key={id} onClick={() => { onOpenProfile(id); onClose(); }} className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl transition hover:opacity-80">
              <div className="relative"><Avatar id={id} size={46} />{USERS[id].online && <span className="absolute bottom-0 right-0"><Dot size={11} /></span>}</div>
              <div className="flex-1 text-left min-w-0"><Name id={id} className="text-[15px]" /><Mono className="block truncate" style={{ fontSize: 12, color: C.faint }}>@{USERS[id].handle}</Mono></div>
              {id !== ME && <FollowBtn id={id} isFollowing={(x) => following.includes(x)} onToggle={onToggleFollow} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────  NOTIFICATIONS  ───────────────────────── */
function Notifications({ notifs, onOpenProfile, isFollowing, onToggleFollow }) {
  const verb = { like: "მოიწონა შენი პოსტი", comment: "დააკომენტარა", follow: "გამოგყვა", mention: "მოგიხსენია პოსტში" };
  const Icon = { like: Heart, comment: MessageCircle, follow: User, mention: Hash }; const col = { like: C.like, comment: C.accent, follow: C.online, mention: C.star };
  return (
    <div className="pb-28 md:pb-8"><div className="px-4 pt-5 pb-3"><Title>აქტივობა</Title></div>
      {notifs.map(n => { const I = Icon[n.type]; return (
        <button key={n.id} onClick={() => onOpenProfile(n.fromId)} className="w-full flex items-center gap-3 px-4 py-3 text-left transition hover:opacity-90" style={{ background: n.read ? "transparent" : C.accentSoft + "66", borderBottom: `1px solid ${C.lineSoft}` }}><div className="relative"><Avatar id={n.fromId} size={46} /><span className="absolute -bottom-1 -right-1 rounded-full flex items-center justify-center" style={{ width: 22, height: 22, background: col[n.type], border: `2px solid ${C.paper}` }}><I size={12} color="#fff" fill="#fff" /></span></div><div className="flex-1 text-[14px]" style={{ color: C.ink2, lineHeight: 1.4 }}><span className="font-bold" style={{ color: C.ink }}>{USERS[n.fromId].name.split(" ")[0]} </span>{verb[n.type]}{n.text && <span style={{ color: C.muted }}>: „{n.text}"</span>}<Mono className="ml-1" style={{ color: C.faint, fontSize: 12 }}>· {n.time}</Mono></div>{n.type === "follow" ? <FollowBtn id={n.fromId} isFollowing={isFollowing} onToggle={onToggleFollow} /> : <div className="w-12 h-12 rounded-xl shrink-0" style={{ background: `linear-gradient(135deg, ${GRADS[hashIdx(n.id, GRADS.length)][0]}, ${GRADS[hashIdx(n.id, GRADS.length)][1]})` }} />}</button>
      ); })}
    </div>
  );
}

/* ─────────────────────────  ADMIN  ───────────────────────── */
function Admin({ reports, posts, onResolve, onRemovePost }) {
  const open = reports.filter(r => r.status === "open");
  const stats = [{ l: "მომხმარებელი", v: "8,420", i: User, c: C.accent }, { l: "პოსტი დღეს", v: "312", i: ImageIcon, c: C.online }, { l: "ღია რეპორტი", v: open.length, i: Flag, c: C.like }, { l: "ონლაინ ახლა", v: "1,204", i: Zap, c: C.cyan }];
  return (
    <div className="pb-28 md:pb-10">
      <div className="flex items-center gap-2 px-4 pt-5 pb-4"><Shield size={24} style={{ color: C.accent }} /><Title>მოდერაცია</Title></div>
      <div className="grid grid-cols-2 gap-2.5 px-4 mb-6">{stats.map(s => <div key={s.l} className="p-4" style={card()}><div className="rounded-xl flex items-center justify-center mb-2.5" style={{ width: 36, height: 36, background: s.c + "22" }}><s.i size={18} color={s.c} /></div><Mono className="text-2xl font-bold" style={{ color: C.ink }}>{s.v}</Mono><div className="text-[12px]" style={{ color: C.muted }}>{s.l}</div></div>)}</div>
      <div className="px-4">
        <div className="flex items-center gap-2 mb-3"><AlertTriangle size={18} style={{ color: C.like }} /><h2 className="text-[17px]" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700 }}>რეპორტების რიგი</h2><span className="rounded-full text-white px-2 py-0.5" style={{ background: C.like, fontFamily: MONO, fontSize: 12, fontWeight: 700 }}>{open.length}</span></div>
        {open.length === 0 ? <Empty icon={Check} t="სუფთაა ✨" s="ღია რეპორტი არ არის." /> : (
          <div className="space-y-3">{open.map(r => { const target = r.type === "post" ? posts.find(p => p.id === r.targetId) : USERS[r.targetId]; return (
            <div key={r.id} className="p-4" style={card()}>
              <div className="flex items-start gap-3"><span className="rounded-lg px-2 py-1 text-[11px] font-bold uppercase shrink-0" style={{ background: r.type === "post" ? C.accentSoft : C.likeSoft, color: r.type === "post" ? C.accentText : C.like, fontFamily: MONO }}>{r.type === "post" ? "POST" : "USER"}</span><div className="flex-1 min-w-0"><div className="text-[14px] font-bold" style={{ color: C.ink }}>{r.reason}</div><div className="text-[12px] mt-0.5" style={{ color: C.faint }}>დაარეპორტა {USERS[r.reporterId].name.split(" ")[0]} · <Mono>{r.time}</Mono></div></div></div>
              <div className="rounded-xl p-3 mt-3 text-[13px]" style={{ background: C.surfaceMuted }}>{r.type === "post" && target ? <div className="flex gap-2"><Avatar id={target.authorId} size={28} /><div className="min-w-0"><div className="font-bold text-[13px]" style={{ color: C.ink }}>{USERS[target.authorId].name.split(" ")[0]}</div><div className="line-clamp-2" style={{ color: C.muted }}>{target.text || "(ფოტო პოსტი)"}</div></div></div> : <div className="flex gap-2 items-center"><Avatar id={r.targetId} size={28} /><div><div className="font-bold text-[13px]" style={{ color: C.ink }}>{USERS[r.targetId]?.name}</div><Mono style={{ color: C.muted, fontSize: 12 }}>@{USERS[r.targetId]?.handle}</Mono></div></div>}</div>
              <div className="flex gap-2 mt-3"><button onClick={() => onResolve(r.id)} className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5" style={{ background: C.surface, color: C.ink2, border: `1px solid ${C.line}` }}><Check size={15} /> დახურვა</button>{r.type === "post" ? <button onClick={() => { onRemovePost(r.targetId); onResolve(r.id); }} className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5" style={{ background: C.likeSoft, color: C.like }}><Trash2 size={15} /> პოსტის წაშლა</button> : <button onClick={() => onResolve(r.id)} className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5" style={{ background: C.likeSoft, color: C.like }}><Shield size={15} /> დაბლოკვა</button>}</div>
            </div>
          ); })}</div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────  DRAWER  ───────────────────────── */
function Drawer({ open, onClose, nav, onNav, onCreate, flash, tab, mode, setMode, xp, onSettings, onSignOut }) {
  const me = USERS[ME]; const { lvl, into } = levelInfo(xp);
  const extras = [{ label: "შენახული", icon: Bookmark, act: () => onNav("profile") }, { label: "პარამეტრები", icon: Settings, act: () => onSettings() }, { label: "დახმარება", icon: HelpCircle, act: () => flash("დახმარება — მალე ✨") }, { label: "გასვლა", icon: LogOut, act: () => onSignOut(), danger: true }];
  return (
    <div className="fixed inset-0 z-[55] md:hidden" style={{ pointerEvents: open ? "auto" : "none" }}>
      <div onClick={onClose} className="absolute inset-0" style={{ background: "rgba(6,7,12,.5)", opacity: open ? 1 : 0, transition: "opacity .3s ease" }} />
      <aside className="absolute top-0 left-0 h-full flex flex-col" style={{ width: "84%", maxWidth: 320, background: C.surface, boxShadow: SH.pop, transform: open ? "translateX(0)" : "translateX(-104%)", transition: "transform .32s cubic-bezier(.4,0,.2,1)" }}>
        <div className="p-5 pb-4" style={{ backgroundImage: GBRAND, color: "#fff" }}>
          <div className="flex items-center justify-between mb-4"><span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 22, letterSpacing: "-0.04em" }}>mzera.</span><button onClick={onClose} className="active:scale-90 rounded-full p-1" style={{ background: "rgba(255,255,255,.2)" }}><X size={18} /></button></div>
          <button onClick={() => onNav("profile")} className="flex items-center gap-3 w-full text-left"><div className="rounded-full p-[2px]" style={{ background: "rgba(255,255,255,.45)" }}><Avatar id={ME} size={50} /></div><div className="min-w-0"><div className="flex items-center gap-1 font-bold text-[16px]">{me.name}<ShieldCheck size={14} /></div><Mono style={{ fontSize: 12, opacity: 0.85 }}>@{me.handle}</Mono></div></button>
          <div className="flex gap-5 mt-3.5 text-[13px]"><span><Mono className="font-bold">{me.following}</Mono> <span style={{ opacity: 0.8 }}>მიჰყვება</span></span><span><Mono className="font-bold">1.3ათ</Mono> <span style={{ opacity: 0.8 }}>მიმდევარი</span></span></div>
          <div className="mt-3.5 rounded-2xl p-3" style={{ background: "rgba(255,255,255,.18)" }}>
            <div className="flex items-center justify-between text-[12px] mb-1.5"><span className="flex items-center gap-1 font-bold"><Zap size={13} fill="#fff" /> Level {lvl}</span><Mono style={{ opacity: 0.85 }}>{into}/100 XP</Mono></div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.3)" }}><div className="h-full rounded-full" style={{ width: into + "%", background: "#fff" }} /></div>
          </div>
        </div>
        <div className="px-3 pt-3"><ThemeToggle mode={mode} setMode={setMode} full /></div>
        <div className="flex-1 overflow-y-auto py-3 px-3">
          {nav.map(n => <button key={n.key} onClick={() => n.key === "create" ? onCreate() : onNav(n.key)} className="relative w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl transition active:scale-[.98]" style={{ background: tab === n.key ? C.accentSoft : "transparent", color: tab === n.key ? C.accentText : C.ink2, fontWeight: tab === n.key ? 700 : 500 }}>{tab === n.key && <span className="absolute left-0 rounded-full" style={{ width: 4, height: 22, backgroundImage: GBRAND }} />}<n.icon size={22} /><span className="text-[15px]">{n.label}</span>{n.badge > 0 && <span className="ml-auto rounded-full text-white px-1.5 py-0.5" style={{ background: C.like, fontFamily: MONO, fontSize: 11, fontWeight: 700 }}>{n.badge}</span>}</button>)}
          <div className="my-3 mx-3.5" style={{ borderTop: `1px solid ${C.lineSoft}` }} />
          {extras.map(e => <button key={e.label} onClick={e.act} className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl transition active:scale-[.98] hover:opacity-80" style={{ color: e.danger ? C.like : C.ink2 }}><e.icon size={21} /><span className="text-[15px] font-medium">{e.label}</span><ChevronRight size={17} className="ml-auto" style={{ color: C.faint }} /></button>)}
        </div>
        <div className="px-5 py-4" style={{ borderTop: `1px solid ${C.lineSoft}` }}><Mono style={{ fontSize: 11, color: C.faint }}>mzera v0.4 · build c4d1 · React + Vite</Mono></div>
      </aside>
    </div>
  );
}

/* ─────────────────────────  LIVE DATA HELPERS  ───────────────────────── */
function timeAgo(ts) {
  const d = (Date.now() - new Date(ts).getTime()) / 1000;
  if (d < 60) return "ახლა";
  if (d < 3600) return Math.floor(d / 60) + "წთ";
  if (d < 86400) return Math.floor(d / 3600) + "სთ";
  return Math.floor(d / 86400) + "დღ";
}
function mergeProfile(p) {
  if (!p || !p.id) return;
  USERS[p.id] = {
    id: p.id, name: p.name || p.username || "user", handle: p.username || "user",
    bio: p.bio || "", followers: p.follower_count ?? p.followers ?? 0, following: p.following_count ?? p.following ?? 0,
    online: true, verified: !!p.verified, admin: !!p.is_admin,
  };
}
function mapDbPost(row) {
  if (row.author) mergeProfile(row.author);
  const likes = Array.isArray(row.reactions) ? (row.reactions[0]?.count ?? 0) : 0;
  return {
    id: row.id, authorId: row.author_id, time: timeAgo(row.created_at),
    text: row.text || "", image: row.image_url || null, likes,
    comments: [], shares: 0, likedByMe: false, savedByMe: false, reaction: null, poll: null, hidden: !!row.hidden,
  };
}
function msgClock(ts) { try { return new Date(ts).toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } }
function mapDbMsg(row) {
  const mine = row.sender_id === ME;
  const m = { id: row.id, fromMe: mine, time: msgClock(row.created_at), type: row.type, _ts: row.created_at };
  if (!mine) m.from = row.sender_id;
  if (row.type === "image") m.image = row.media_url;
  else if (row.type === "voice") m.dur = row.voice_dur;
  else if (row.type === "doc") m.doc = { name: row.doc_name, size: row.doc_size };
  else if (row.type === "location") m.place = row.place;
  else m.text = row.text;
  return m;
}
function toDbMsg(p) {
  const o = { type: p.type };
  if (p.type === "image") o.media_url = p.image;
  else if (p.type === "voice") o.voice_dur = p.dur;
  else if (p.type === "doc") { o.doc_name = p.doc.name; o.doc_size = p.doc.size; }
  else if (p.type === "location") o.place = p.place;
  else o.text = p.text;
  return o;
}
function mapDbNotif(row) {
  if (row.from) mergeProfile(row.from);
  return { id: row.id, type: row.type, fromId: row.from_id, text: row.text || undefined, time: timeAgo(row.created_at), read: !!row.read };
}
const resolveImg = (x) => !x ? null : (typeof x === "string" && x.startsWith("http") ? x : img(x));
async function hydrateAuthors(rows, idField, attachField) {
  const ids = [...new Set(rows.map(r => r[idField]).filter(Boolean))];
  if (ids.length) { try { const profs = await profilesApi.byIds(ids); const pm = {}; profs.forEach(p => { pm[p.id] = p; }); rows.forEach(r => { r[attachField] = pm[r[idField]]; }); } catch (e) {} }
  return rows;
}
function mapDbStories(rows) {  const by = {};
  rows.forEach(r => { if (r.author) mergeProfile(r.author); (by[r.author_id] = by[r.author_id] || []).push({ image: r.image_url, filter: r.filter || "none", text: r.text || "", stickers: r.stickers || [] }); });
  return Object.entries(by).map(([aid, items]) => ({ id: "s" + aid, authorId: aid, seen: false, items }));
}
function mapDbReel(row, likedSet) {
  if (row.author) mergeProfile(row.author);
  const likes = Array.isArray(row.reel_likes) ? (row.reel_likes[0]?.count ?? 0) : 0;
  return { id: row.id, authorId: row.author_id, image: row.thumb_url || row.video_url || img("reel" + row.id, 480, 854), video: row.video_url || null, caption: row.caption || "", audio: row.audio || "original audio", likes, comments: 0, shares: 0, likedByMe: likedSet ? likedSet.has(row.id) : false, savedByMe: false };
}
function mapDbThread(row, uid) {
  if (row.author) mergeProfile(row.author);
  const votes = (row.thread_votes || []);
  const replies = (row.thread_replies || []).slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map(r => { if (r.author) mergeProfile(r.author); return { id: r.id, authorId: r.author_id, text: r.text, time: timeAgo(r.created_at), likes: 0 }; });
  return { id: row.id, authorId: row.author_id, cat: row.category || "სხვა", title: row.title, body: row.body || "", votes: votes.length, views: "0", time: timeAgo(row.created_at), likedByMe: votes.some(v => v.user_id === uid), replies };
}
const KA_MONS = ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"];
function mapDbListing(row) {
  if (row.seller) mergeProfile(row.seller);
  return { id: row.id, sellerId: row.seller_id, cat: row.category || "სხვა", title: row.title, price: Number(row.price), desc: row.description || "", image: row.image_url || img("sell" + row.id), location: row.location || "თბილისი", time: timeAgo(row.created_at), savedByMe: false };
}
function mapDbReview(r) { if (r.author) mergeProfile(r.author); return { id: r.id, authorId: r.author_id, rating: r.rating, text: r.text || "", time: timeAgo(r.created_at) }; }
function mapDbGroup(row, uid) {
  const mem = row.group_members || [];
  const posts = (row.group_posts || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(p => { if (p.author) mergeProfile(p.author); return { id: p.id, authorId: p.author_id, time: timeAgo(p.created_at), text: p.text || "", image: p.image_url || undefined, likes: 0, cc: 0 }; });
  return { id: row.id, name: row.name, cover: row.cover_url || img("grp" + row.id, 600, 300), cat: row.category || "", members: mem.length, joined: mem.some(m => m.user_id === uid), about: row.about || "", posts };
}
function mapDbEvent(row, uid) {
  if (row.host) mergeProfile(row.host);
  const rs = row.event_rsvps || [];
  const mine = rs.find(r => r.user_id === uid);
  const d = row.starts_at ? new Date(row.starts_at) : null;
  return { id: row.id, title: row.title, cover: row.cover_url || img("ev" + row.id, 600, 300), day: d ? String(d.getDate()).padStart(2, "0") : "—", mon: d ? KA_MONS[d.getMonth()] : "", time: d ? d.toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit" }) : "", location: row.location || "", going: rs.filter(r => r.status === "going").length, rsvp: mine ? mine.status : null, hostId: row.host_id, about: row.about || "" };
}

function ConfigError() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: C.paper, color: C.ink, fontFamily: BODY }}>
      <div className="max-w-[420px] w-full p-6 rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SH.card }}>
        <div className="text-center mb-3"><Wordmark size={34} /></div>
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 18, marginBottom: 8 }}>კონფიგურაცია საჭიროა</div>
        <p style={{ fontSize: 13.5, lineHeight: 1.6, color: C.muted, marginBottom: 14 }}>აპი მუშაობს მხოლოდ Supabase-თან. დაამატე ეს ორი ცვლადი Vercel-ში (Settings → Environment Variables) და გააკეთე Redeploy:</p>
        <div style={{ fontFamily: MONO, fontSize: 12, background: C.surfaceMuted, borderRadius: 12, padding: 12, color: C.ink, lineHeight: 1.9 }}>VITE_SUPABASE_URL<br/>VITE_SUPABASE_ANON_KEY</div>
        <p style={{ fontSize: 12, color: C.faint, marginTop: 12 }}>მნიშვნელობები: Supabase → Project Settings → API.</p>
      </div>
    </div>
  );
}
const LoadingScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: C.paper, fontFamily: BODY }}>
    <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    <Wordmark size={34} />
    <div style={{ width: 34, height: 34, borderRadius: "50%", border: `3px solid ${C.line}`, borderTopColor: C.accent, animation: "spin .8s linear infinite" }} />
  </div>
);

function AuthScreen() {
  const [mode, setMode] = useState("in"); const [email, setEmail] = useState(""); const [pass, setPass] = useState("");
  const [username, setUsername] = useState(""); const [name, setName] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async () => {
    setErr(""); setBusy(true);
    try {
      if (mode === "up") await authApi.signUp(email.trim(), pass, username.trim() || email.split("@")[0], name.trim());
      else await authApi.signIn(email.trim(), pass);
    } catch (e) { setErr(e.message || "შეცდომა"); setBusy(false); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: C.paper, fontFamily: BODY, backgroundImage: `radial-gradient(${C.grid} 1px, transparent 1px)`, backgroundSize: "22px 22px" }}>
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-7"><Wordmark size={42} /><div className="text-[14px] mt-2" style={{ color: C.muted }}>ქართული სოციალური ქსელი</div></div>
        <div className="p-5" style={card()}>
          <div className="flex gap-1 p-1 rounded-2xl mb-4" style={{ background: C.surfaceMuted }}>{[["in", "შესვლა"], ["up", "რეგისტრაცია"]].map(([k, l]) => <button key={k} onClick={() => { setMode(k); setErr(""); }} className="flex-1 py-2 rounded-xl text-sm font-bold transition" style={mode === k ? { background: C.surface, color: C.accent, boxShadow: SH.card } : { color: C.muted }}>{l}</button>)}</div>
          {mode === "up" && <>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="სახელი და გვარი" className="w-full mb-2.5 px-3.5 py-3 rounded-xl outline-none text-[15px]" style={{ background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` }} />
            <input value={username} onChange={e => setUsername(e.target.value.replace(/\s/g, "").toLowerCase())} placeholder="username" className="w-full mb-2.5 px-3.5 py-3 rounded-xl outline-none text-[15px]" style={{ background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}`, fontFamily: MONO }} />
          </>}
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="ელ-ფოსტა" className="w-full mb-2.5 px-3.5 py-3 rounded-xl outline-none text-[15px]" style={{ background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` }} />
          <input value={pass} onChange={e => setPass(e.target.value)} type="password" placeholder="პაროლი" onKeyDown={e => e.key === "Enter" && submit()} className="w-full mb-3 px-3.5 py-3 rounded-xl outline-none text-[15px]" style={{ background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` }} />
          {err && <div className="text-[13px] mb-3 px-1" style={{ color: C.like }}>{err}</div>}
          <button onClick={submit} disabled={busy || !email || !pass} className="w-full py-3 rounded-2xl font-bold text-white transition active:scale-[.98]" style={{ backgroundImage: GBRAND, boxShadow: SH.glow, opacity: busy || !email || !pass ? 0.55 : 1, fontFamily: DISPLAY }}>{busy ? "..." : mode === "up" ? "ანგარიშის შექმნა" : "შესვლა"}</button>
        </div>
        <div className="text-center mt-4 text-[12px]" style={{ color: C.faint }}>Supabase-ით დაცული · შენი მონაცემები შენია</div>
      </div>
    </div>
  );
}

/* ─────────────────────────  APP  ───────────────────────── */
export default function App() {
  const [mode, setMode] = useState("light");
  C = mode === "dark" ? PAL.dark : PAL.light; DARK = mode === "dark";

  const [tab, setTab] = useState("home");
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [convos, setConvos] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [reports, setReports] = useState([]);
  const [threads, setThreads] = useState([]);
  const [listings, setListings] = useState([]);
  const [groups, setGroups] = useState([]);
  const [events, setEvents] = useState([]);
  const [reels, setReels] = useState([]);
  const [xp, setXp] = useState(120);
  const [openConvoId, setOpenConvoId] = useState(null);
  const [following, setFollowing] = useState([]);
  const [followerCounts, setFollowerCounts] = useState({});
  const [listView, setListView] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({ private: false, activity: true, showLocation: true, nLikes: true, nComments: true, nFollows: true, nMessages: true, lang: "ka" });
  const [meProfile, setMeProfile] = useState({ name: "", bio: "" });
  const [createOpen, setCreateOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [storyId, setStoryId] = useState(null);
  const [storyEditorOpen, setStoryEditorOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [session, setSession] = useState(undefined);
  const [ready, setReady] = useState(false);
  const [reelCreateOpen, setReelCreateOpen] = useState(false);
  const [profileId, setProfileId] = useState(null);
  const [activeTag, setActiveTag] = useState(null);
  const [toast, setToast] = useState(null);
  const [dbError, setDbError] = useState(null);
  const dbErr = (label) => (e) => { console.error(label, e); setDbError(label + ": " + (e && (e.message || JSON.stringify(e))) + (e && e.hint ? " · hint: " + e.hint : "") + (e && e.code ? " · code: " + e.code : "")); };
  const live = hasSupabase && !!session;
  const me = USERS[ME];

  useEffect(() => {
    const l = document.createElement("link"); l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Noto+Sans+Georgian:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap";
    document.head.appendChild(l); return () => { try { document.head.removeChild(l); } catch (e) {} };
  }, []);

  // Supabase auth session
  useEffect(() => {
    if (!hasSupabase) return;
    authApi.getSession().then((s) => setSession(s || null)).catch(() => setSession(null));
    const sub = authApi.onChange((s) => setSession(s || null));
    return () => { try { sub.data.subscription.unsubscribe(); } catch (e) {} };
  }, []);

  // load my profile + feed once logged in
  useEffect(() => {
    if (!hasSupabase || !session) return;
    let cancelled = false;
    (async () => {
      try {
        const uid = session.user.id;
        let prof;
        try { prof = await profilesApi.stats(uid); } catch (e) { prof = await profilesApi.get(uid); }
        if (cancelled) return;
        mergeProfile(prof); ME = uid;
        setMeProfile({ name: USERS[ME].name, bio: USERS[ME].bio });
        await loadFeed();
        try { const fl = await followsApi.following(uid); fl.forEach(mergeProfile); if (!cancelled) setFollowing(fl.map(p => p.id)); } catch (e) {}
        await loadNotifs();
        await loadConvos();
        await loadStories();
        await loadReels();
        await loadListings();
        await loadGroups();
        await loadEvents();
        await loadThreads();
      } catch (e) { console.error("mzera load:", e); setDbError("mzera load: " + (e.message || JSON.stringify(e)) + (e.hint ? " · hint: " + e.hint : "") + (e.code ? " · code: " + e.code : "")); }
      if (!cancelled) setReady(true);
    })();
    return () => { cancelled = true; };
  }, [session]);

  const loadFeed = async () => {
    if (!hasSupabase) return;
    try {
      let feed;
      try {
        feed = await postsApi.feed();
      } catch (embErr) {
        feed = await postsApi.feedPlain();
        const aids = [...new Set(feed.map(p => p.author_id).filter(Boolean))];
        if (aids.length) { try { const profs = await profilesApi.byIds(aids); const pm = {}; profs.forEach(pr => { pm[pr.id] = pr; }); feed.forEach(p => { p.author = pm[p.author_id]; }); } catch (e) {} }
      }
      const mapped = feed.map(mapDbPost);
      const ids = mapped.map(p => p.id);
      if (ids.length) {
        try { const rx = await reactionsApi.forPosts(ids); const cnt = {}, mineM = {}; rx.forEach(r => { cnt[r.post_id] = (cnt[r.post_id] || 0) + 1; if (r.user_id === ME) mineM[r.post_id] = r.emoji; }); mapped.forEach(p => { p.likes = cnt[p.id] || 0; if (mineM[p.id]) { p.likedByMe = true; p.reaction = mineM[p.id]; } }); } catch (e) {}
        try { const cms = await commentsApi.forPosts(ids); const by = {}; cms.forEach(c => { if (c.author) mergeProfile(c.author); (by[c.post_id] = by[c.post_id] || []).push({ id: c.id, authorId: c.author_id, text: c.text, time: timeAgo(c.created_at) }); }); mapped.forEach(p => { if (by[p.id]) p.comments = by[p.id]; }); } catch (e) {}
      }
      setPosts(mapped);
    } catch (e) { console.error("feed:", e); setDbError("Feed: " + (e.message || JSON.stringify(e)) + (e.hint ? " · hint: " + e.hint : "") + (e.code ? " · code: " + e.code : "")); }
  };
  const reloadFeed = () => loadFeed();
  const loadStories = async () => { if (!hasSupabase) return; try { let rows; try { rows = await storiesApi.list(); } catch (em) { rows = await hydrateAuthors(await storiesApi.listPlain(), "author_id", "author"); } setStories(mapDbStories(rows)); } catch (e) { console.error("stories:", e); setDbError("stories: " + (e.message || JSON.stringify(e)) + (e.hint ? " · hint: " + e.hint : "") + (e.code ? " · code: " + e.code : "")); } };
  const loadReels = async () => { if (!hasSupabase) return; try { let rows; try { rows = await reelsApi.list(); } catch (em) { rows = await hydrateAuthors(await reelsApi.listPlain(), "author_id", "author"); } let liked = new Set(); try { liked = new Set((await reelsApi.mine()).map(x => x.reel_id)); } catch (e) {} setReels(rows.map(r => mapDbReel(r, liked))); } catch (e) { console.error("reels:", e); setDbError("reels: " + (e.message || JSON.stringify(e)) + (e.hint ? " · hint: " + e.hint : "") + (e.code ? " · code: " + e.code : "")); } };
  const loadListings = async () => { if (!hasSupabase) return; try { let rows; try { rows = await marketApi.listings(); } catch (em) { rows = await hydrateAuthors(await marketApi.listingsPlain(), "seller_id", "seller"); } setListings(rows.map(mapDbListing)); } catch (e) { console.error("listings:", e); setDbError("listings: " + (e.message || JSON.stringify(e)) + (e.hint ? " · hint: " + e.hint : "") + (e.code ? " · code: " + e.code : "")); } };
  const loadGroups = async () => { if (!hasSupabase || !session) return; try { const rows = await groupsApi.list(); setGroups(rows.map(r => mapDbGroup(r, session.user.id))); } catch (e) { console.error("groups:", e); setDbError("groups: " + (e.message || JSON.stringify(e)) + (e.hint ? " · hint: " + e.hint : "") + (e.code ? " · code: " + e.code : "")); } };
  const loadEvents = async () => { if (!hasSupabase || !session) return; try { const rows = await eventsApi.list(); setEvents(rows.map(r => mapDbEvent(r, session.user.id))); } catch (e) { console.error("events:", e); setDbError("events: " + (e.message || JSON.stringify(e)) + (e.hint ? " · hint: " + e.hint : "") + (e.code ? " · code: " + e.code : "")); } };
  const loadThreads = async () => { if (!hasSupabase || !session) return; try { const rows = await forumApi.list(); setThreads(rows.map(r => mapDbThread(r, session.user.id))); } catch (e) { console.error("forum:", e); setDbError("forum: " + (e.message || JSON.stringify(e)) + (e.hint ? " · hint: " + e.hint : "") + (e.code ? " · code: " + e.code : "")); } };
  const uploadImage = async (file, folder = "posts") => await storageApi.upload(file, folder);

  const openRef = useRef(openConvoId);
  const chanRef = useRef([]);
  const loadNotifs = async () => { try { const rows = await notifsApi.list(); setNotifs(rows.map(mapDbNotif)); } catch (e) {} };
  const loadConvos = async () => {
    try {
      const rows = await chatApi.conversations();
      const mapped = rows.map(r => {
        const profs = (r.members || []).map(mm => mm.profiles).filter(Boolean);
        profs.forEach(mergeProfile);
        const memberIds = profs.map(p => p.id).filter(id => id !== ME);
        const msgs = (r.messages || []).slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map(mapDbMsg);
        return { id: r.id, members: memberIds, isGroup: r.is_group, name: r.name, unread: 0, messages: msgs };
      });
      mapped.sort((a, b) => { const la = a.messages[a.messages.length - 1], lb = b.messages[b.messages.length - 1]; return new Date(lb?._ts || 0) - new Date(la?._ts || 0); });
      setConvos(mapped);
    } catch (e) { console.error("convos:", e); setDbError("convos: " + (e.message || JSON.stringify(e)) + (e.hint ? " · hint: " + e.hint : "") + (e.code ? " · code: " + e.code : "")); }
  };

  useEffect(() => { openRef.current = openConvoId; }, [openConvoId]);
  useEffect(() => { if (openConvoId) setConvos(cs => cs.map(c => c.id === openConvoId ? { ...c, unread: 0 } : c)); }, [openConvoId]);

  const convIdsKey = convos.map(c => c.id).join(",");
  useEffect(() => {
    chanRef.current.forEach(ch => { try { ch.unsubscribe(); } catch (e) {} });
    chanRef.current = convos.map(c => chatApi.subscribe(c.id, (row) => {
      const m = mapDbMsg(row);
      setConvos(cs => cs.map(x => {
        if (x.id !== c.id) return x;
        if (x.messages.some(z => z.id === m.id)) return x;
        const isOpen = openRef.current === c.id;
        return { ...x, messages: [...x.messages, m], unread: (isOpen || m.fromMe) ? x.unread : x.unread + 1 };
      }));
    }));
    return () => { chanRef.current.forEach(ch => { try { ch.unsubscribe(); } catch (e) {} }); chanRef.current = []; };
  }, [live, convIdsKey]);

  useEffect(() => {
    if (!session) return;
    const ch = notifsApi.subscribe(session.user.id, () => loadNotifs());
    return () => { try { ch.unsubscribe(); } catch (e) {} };
  }, [live, session]);

  const unreadMsgs = convos.reduce((a, c) => a + c.unread, 0);
  const unreadNotifs = notifs.filter(n => !n.read).length;
  const openReports = reports.filter(r => r.status === "open").length;
  const flash = (t) => { setToast(t); setTimeout(() => setToast(null), 1800); };
  const gainXp = (n) => setXp(x => x + n);
  const isFollowing = (id) => following.includes(id);
  const toggleFollow = (id) => { const now = following.includes(id); setFollowing(f => now ? f.filter(x => x !== id) : [...f, id]); setFollowerCounts(fc => ({ ...fc, [id]: (fc[id] != null ? fc[id] : USERS[id].followers) + (now ? -1 : 1) })); if (!now) gainXp(2); followsApi.toggle(id).catch(dbErr("გამოწერა")); };

  const onLike = (id) => setPosts(ps => ps.map(p => p.id === id ? { ...p, likedByMe: !p.likedByMe, likes: p.likes + (p.likedByMe ? -1 : 1) } : p));
  const onReact = (id, emoji) => { setPosts(ps => ps.map(p => { if (p.id !== id) return p; if (p.reaction === emoji) return { ...p, reaction: null, likedByMe: false, likes: p.likes - 1 }; return { ...p, reaction: emoji, likedByMe: true, likes: p.likedByMe ? p.likes : p.likes + 1 }; })); reactionsApi.toggle(id, emoji).catch(dbErr("რეაქცია")); };
  const onPollVote = (id, idx) => setPosts(ps => ps.map(p => { if (p.id !== id || !p.poll || p.poll.voted != null) return p; const options = p.poll.options.map((o, i) => i === idx ? { ...o, votes: o.votes + 1 } : o); return { ...p, poll: { ...p.poll, options, voted: idx } }; }));
  const onSave = (id) => setPosts(ps => ps.map(p => p.id === id ? { ...p, savedByMe: !p.savedByMe } : p));
  const onComment = (id, text) => { setPosts(ps => ps.map(p => p.id === id ? { ...p, comments: [...p.comments, { id: "c" + Date.now(), authorId: ME, text, time: "ახლა" }] } : p)); gainXp(5); commentsApi.add(id, text).catch(dbErr("კომენტარი")); };
  const onReport = (id) => { setReports(r => [{ id: "r" + rid++, type: "post", targetId: id, reason: "მომხმარებლის რეპორტი", reporterId: ME, time: "ახლა", status: "open" }, ...r]); flash("გაგზავნილია მოდერაციაში ✓"); };
  const onRemovePost = (id) => { setPosts(ps => ps.map(p => p.id === id ? { ...p, hidden: true } : p)); flash("პოსტი წაიშალა"); };
  const onResolve = (id) => setReports(r => r.map(x => x.id === id ? { ...x, status: "resolved" } : x));
  const onTag = (t) => { setActiveTag(t); setProfileId(null); setTab("explore"); };
  const openProfile = (id) => { setDrawerOpen(false); setProfileId(id); setTab("profile"); };
  const onPost = (text, picked, poll) => { setCreateOpen(false); gainXp(15); flash("გამოქვეყნდა 🎉"); postsApi.create({ text, imageUrl: resolveImg(picked), poll }).then(reloadFeed).catch(dbErr("პოსტი")); };
  const onSendMsg = (cid, partial) => { chatApi.send(cid, toDbMsg(partial)).catch(dbErr("შეტყობინება")); };
  const onReply = (cid) => setConvos(cs => cs.map(c => { if (c.id !== cid) return c; const mem = c.members || (c.withId ? [c.withId] : []); const from = mem.length > 1 ? mem[Math.floor(Math.random() * mem.length)] : mem[0]; return { ...c, messages: [...c.messages, { id: "m" + Date.now() + Math.round(Math.random() * 777), fromMe: false, from, type: "text", text: REPLIES[Math.floor(Math.random() * REPLIES.length)], time: "ახლა" }] }; }));
  const onCreateConvo = (memberIds) => { const members = [...new Set(memberIds)].filter(x => x !== ME); const name = members.length > 1 ? members.map(m => (USERS[m]?.name || "").split(" ")[0]).join(", ") : null; chatApi.createConversation(members, name).then(async (conv) => { await loadConvos(); setOpenConvoId(conv.id); }).catch(dbErr("საუბარი")); return null; };
  const openStory = (id) => setStoryId(id);
  const markSeen = (id) => setStories(s => s.map(x => x.id === id ? { ...x, seen: true } : x));
  const onAddStory = (item) => { setStoryEditorOpen(false); gainXp(8); flash("Story დაემატა ✨"); storiesApi.create({ image_url: item.image, filter: item.filter, text: item.text, stickers: item.stickers }).then(loadStories).catch(dbErr("story")); };
  const onThreadReply = (tId, text) => { setThreads(ts => ts.map(t => t.id === tId ? { ...t, replies: [...t.replies, { id: "tr" + Date.now(), authorId: ME, text, time: "ახლა", likes: 0 }] } : t)); forumApi.reply(tId, text).catch(dbErr("პასუხი")); };
  const onThreadVote = (tId) => { setThreads(ts => ts.map(t => t.id === tId ? { ...t, likedByMe: !t.likedByMe, votes: t.votes + (t.likedByMe ? -1 : 1) } : t)); forumApi.toggleVote(tId).catch(dbErr("ხმა")); };
  const onNewThread = (d) => { flash("თემა გამოქვეყნდა 🎉"); forumApi.create({ title: d.title, body: d.body, category: d.cat }).then(loadThreads).catch(dbErr("თემა")); };
  const onListingSave = (id) => setListings(ls => ls.map(l => l.id === id ? { ...l, savedByMe: !l.savedByMe } : l));
  const onNewListing = (d) => { flash("განცხადება დაიდო 🛍️"); marketApi.create({ title: d.title, price: d.price, description: d.desc, category: d.cat, image_url: d.image, location: "თბილისი" }).then(loadListings).catch(dbErr("განცხადება")); };
  const onMessageUser = (uid) => { setTab("messages"); const ex = convos.find(c => { const m = c.members || (c.withId ? [c.withId] : []); return m.length === 1 && m[0] === uid; }); setOpenConvoId(ex ? ex.id : onCreateConvo([uid])); };
  const onReelLike = (id) => { setReels(rs => rs.map(r => r.id === id ? { ...r, likedByMe: !r.likedByMe } : r)); reelsApi.toggleLike(id).catch(dbErr("reel მოწონება")); };
  const onReelSave = (id) => setReels(rs => rs.map(r => r.id === id ? { ...r, savedByMe: !r.savedByMe } : r));
  const onPublishReel = ({ video, caption }) => { setReelCreateOpen(false); gainXp(12); flash("Reel გამოქვეყნდა 🎬"); reelsApi.create({ video_url: video, caption, audio: "original audio" }).then(loadReels).catch(dbErr("reel")); };
  const onJoinGroup = (id) => { setGroups(gs => gs.map(g => g.id === id ? { ...g, joined: !g.joined, members: g.members + (g.joined ? -1 : 1) } : g)); const wasJoined = groups.find(g => g.id === id)?.joined; if (!wasJoined) { gainXp(20); flash("ჯგუფს შეუერთდი 🎉 +20 XP"); } groupsApi.toggleJoin(id).catch(dbErr("შეერთება")); };
  const onRsvp = (id, v) => { setEvents(es => es.map(e => e.id === id ? { ...e, going: e.going + ((e.rsvp === "going" ? -1 : 0) + (v === "going" ? 1 : 0)), rsvp: v } : e)); eventsApi.rsvp(id, v).catch(dbErr("rsvp")); };
  const onGroupPost = (gid, payload) => { gainXp(5); groupsApi.post(gid, payload).then(loadGroups).catch(dbErr("ჯგუფის პოსტი")); };
  const onOrder = (item, d) => { marketApi.order(item.id, { delivery: d.delivery, payment: d.payment, address: d.address, total: d.total }).catch(dbErr("შეკვეთა")); };
  const getReviews = (sellerId) => marketApi.reviews(sellerId).then(rows => rows.map(mapDbReview));
  const addReviewApi = (sellerId, rating, text) => marketApi.addReview(sellerId, rating, text);

  const goTab = (k) => { setDrawerOpen(false); if (k === "create") { setCreateOpen(true); return; } if (k === "notifications") setNotifs(n => n.map(x => ({ ...x, read: true }))); if (k === "profile") setProfileId(ME); if (k === "explore") setActiveTag(null); if (k === "messages") setOpenConvoId(null); setTab(k); };

  const visible = posts.filter(p => !p.hidden);
  const story = stories.find(s => s.id === storyId);

  const NAV = [
    { key: "home", label: "მთავარი", icon: Home }, { key: "explore", label: "აღმოჩენა", icon: Compass },
    { key: "reels", label: "Reels", icon: Film }, { key: "forum", label: "ფორუმი", icon: MessageSquare },
    { key: "market", label: "მარკეტი", icon: ShoppingBag }, { key: "groups", label: "ჯგუფები", icon: Users },
    { key: "map", label: "რუკა", icon: Map }, { key: "create", label: "შექმნა", icon: PlusSquare },
    { key: "messages", label: "შეტყობინებები", icon: Send, badge: unreadMsgs }, { key: "notifications", label: "აქტივობა", icon: Bell, badge: unreadNotifs },
    { key: "progress", label: "პროგრესი", icon: Zap }, { key: "leaderboard", label: "რეიტინგი", icon: Trophy }, { key: "profile", label: "პროფილი", icon: User },
    ...(me.admin ? [{ key: "admin", label: "მოდერაცია", icon: Shield, badge: openReports }] : []),
  ];
  const BOTTOM = ["home", "reels", "create", "messages", "profile"];
  const fullBleed = tab === "messages" || tab === "map" || tab === "reels";

  if (!hasSupabase) return <ConfigError />;
  if (session === undefined) return <LoadingScreen />;
  if (session === null) return <AuthScreen />;
  if (!ready) return <LoadingScreen />;

  return (
    <div className="min-h-screen w-full" style={{ color: C.ink, fontFamily: BODY, backgroundColor: C.paper, backgroundImage: `radial-gradient(${C.grid} 1px, transparent 1px)`, backgroundSize: "22px 22px" }}>
      {dbError && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999, background: "#c01818", color: "#fff", padding: "10px 14px", fontSize: 12, lineHeight: 1.5, fontFamily: MONO, display: "flex", gap: 8, alignItems: "flex-start" }}>
          <span style={{ wordBreak: "break-word", flex: 1 }}>⚠ DB: {dbError}</span>
          <button onClick={() => setDbError(null)} style={{ color: "#fff", fontWeight: 700, flexShrink: 0, background: "none", border: "none", fontSize: 16, cursor: "pointer" }}>✕</button>
        </div>
      )}
      <style>{`
        *{box-sizing:border-box}
        html,body{margin:0;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
        .no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
        @keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pin{0%{opacity:0;transform:translate(-50%,8px) scale(.96)}100%{opacity:1;transform:translate(-50%,0) scale(1)}}
        @keyframes tdot{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}
        @keyframes pulse{0%{transform:translate(-50%,-50%) scale(.6);opacity:.7}100%{transform:translate(-50%,-50%) scale(1.6);opacity:0}}
        .fadein{animation:up .4s cubic-bezier(.22,.61,.36,1) both}
        .stagger>*{animation:up .5s cubic-bezier(.22,.61,.36,1) both}
        .stagger>*:nth-child(1){animation-delay:.03s}.stagger>*:nth-child(2){animation-delay:.07s}.stagger>*:nth-child(3){animation-delay:.11s}.stagger>*:nth-child(4){animation-delay:.15s}.stagger>*:nth-child(5){animation-delay:.19s}.stagger>*:nth-child(6){animation-delay:.23s}.stagger>*:nth-child(n+7){animation-delay:.27s}
        @media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}
      `}</style>

      <div className="mx-auto flex w-full max-w-[1100px]">
        <aside className="hidden md:flex flex-col w-[235px] shrink-0 px-3 py-6 sticky top-0 h-screen" style={{ borderRight: `1px solid ${C.line}`, background: C.surface }}>
          <div className="px-3 mb-6"><Wordmark size={25} /></div>
          <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-1">
            {NAV.map(n => <button key={n.key} onClick={() => goTab(n.key)} className="relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl transition active:scale-[.98] shrink-0" style={{ background: tab === n.key ? C.accentSoft : "transparent", color: tab === n.key ? C.accentText : C.ink2, fontWeight: tab === n.key ? 700 : 500 }}>{tab === n.key && <span className="absolute left-0 rounded-full" style={{ width: 4, height: 20, backgroundImage: GBRAND }} />}<n.icon size={23} />{n.label}{n.badge > 0 && <span className="ml-auto rounded-full text-white px-1.5 py-0.5" style={{ background: C.like, fontFamily: MONO, fontSize: 11, fontWeight: 700 }}>{n.badge}</span>}</button>)}
            <button onClick={() => setCreateOpen(true)} className="mt-2 py-3 rounded-2xl font-bold text-white transition active:scale-[.98] shrink-0" style={{ backgroundImage: GBRAND, boxShadow: SH.glow, fontFamily: DISPLAY }}>ახალი პოსტი</button>
          </div>
          <div className="pt-3 mt-2" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <div className="mb-2"><ThemeToggle mode={mode} setMode={setMode} full /></div>
            <button onClick={() => openProfile(ME)} className="flex items-center gap-2.5 px-2 py-2 rounded-2xl w-full hover:opacity-80"><Avatar id={ME} size={36} /><div className="text-left leading-tight min-w-0"><div className="text-sm font-bold truncate" style={{ color: C.ink }}>{me.name.split(" ")[0]}</div><Mono style={{ fontSize: 12, color: C.faint }}>@{me.handle}</Mono></div></button>
          </div>
        </aside>

        <main className="flex-1 min-w-0 max-w-[600px] mx-auto" style={{ borderRight: `1px solid ${C.line}` }}>
          {!fullBleed && (
            <header className="md:hidden flex items-center justify-between px-3 h-14 sticky top-0 z-20" style={{ background: C.surface + "e6", backdropFilter: "blur(14px)", borderBottom: `1px solid ${C.line}` }}>
              <button onClick={() => setDrawerOpen(true)} className="rounded-full active:scale-90 flex items-center justify-center" style={{ width: 40, height: 40, color: C.ink2 }}><Menu size={24} /></button>
              <Wordmark size={21} />
              <div className="flex items-center"><IconBtn onClick={() => setSearchOpen(true)}><Search size={23} /></IconBtn><ThemeToggle mode={mode} setMode={setMode} /><IconBtn onClick={() => goTab("notifications")} badge={unreadNotifs}><Bell size={23} /></IconBtn></div>
            </header>
          )}

          <div className={fullBleed ? "" : "fadein"} key={tab + (profileId || "") + (activeTag || "")}>
            {tab === "home" && (
              <>
                <div style={{ borderBottom: `1px solid ${C.lineSoft}`, background: C.surface }}><StoryRow stories={stories} onOpen={openStory} onAdd={() => setStoryEditorOpen(true)} /></div>
                <div className="stagger space-y-4 p-4 pb-28 md:pb-10">{visible.map(p => <PostCard key={p.id} post={p} onLike={onLike} onReact={onReact} onSave={onSave} onComment={onComment} onPollVote={onPollVote} onTag={onTag} onReport={onReport} onRemove={onRemovePost} onOpenProfile={openProfile} isAdmin={me.admin} />)}</div>
              </>
            )}
            {tab === "explore" && <Explore posts={visible} onTag={onTag} activeTag={activeTag} clearTag={() => setActiveTag(null)} onOpenProfile={openProfile} onSearch={() => setSearchOpen(true)} />}
            {tab === "forum" && <Forum threads={threads} onReply={onThreadReply} onVote={onThreadVote} onNew={onNewThread} onOpenProfile={openProfile} />}
            {tab === "market" && <Market listings={listings} onSave={onListingSave} onNew={onNewListing} onMessage={onMessageUser} onOpenProfile={openProfile} flash={flash} live={live} onOrder={onOrder} getReviews={getReviews} onAddReview={addReviewApi} onUpload={(f) => uploadImage(f, "market")} />}
            {tab === "map" && <MapView onMessage={onMessageUser} onMenu={() => setDrawerOpen(true)} onOpenProfile={openProfile} />}
            {tab === "reels" && <Reels reels={reels} onLike={onReelLike} onSave={onReelSave} onOpenProfile={openProfile} onMenu={() => setDrawerOpen(true)} flash={flash} onCreate={() => setReelCreateOpen(true)} />}
            {tab === "groups" && <Groups groups={groups} events={events} onJoin={onJoinGroup} onRsvp={onRsvp} onOpenProfile={openProfile} onMessage={onMessageUser} live={live} onGroupPost={onGroupPost} onUpload={(f) => uploadImage(f, "groups")} />}
            {tab === "messages" && <Messages convos={convos} openId={openConvoId} setOpenId={setOpenConvoId} onSend={onSendMsg} onReply={onReply} onCreateConvo={onCreateConvo} onOpenProfile={openProfile} live={live} />}
            {tab === "notifications" && <Notifications notifs={notifs} onOpenProfile={openProfile} isFollowing={isFollowing} onToggleFollow={toggleFollow} />}
            {tab === "profile" && <Profile userId={profileId || ME} posts={posts} xp={xp} meProfile={meProfile} following={following} followerCounts={followerCounts} onToggleFollow={toggleFollow} onMessage={onMessageUser} onOpenList={(type, uid) => setListView({ type, userId: uid })} onSettings={() => setSettingsOpen(true)} flash={flash} onBack={() => goTab("home")} onTag={onTag} onLike={onLike} onReact={onReact} onSave={onSave} onComment={onComment} onPollVote={onPollVote} onReport={onReport} onRemove={onRemovePost} onOpenProfile={openProfile} isAdmin={me.admin} />}
            {tab === "progress" && <Progress xp={xp} gainXp={gainXp} onMessage={onMessageUser} onOpenProfile={openProfile} />}
            {tab === "leaderboard" && <Leaderboard xp={xp} posts={posts} onOpenProfile={openProfile} />}
            {tab === "admin" && <Admin reports={reports} posts={posts} onResolve={onResolve} onRemovePost={onRemovePost} />}
          </div>
        </main>

        <aside className="hidden lg:block w-[290px] shrink-0 px-5 py-6">
          <button onClick={() => setSearchOpen(true)} className="w-full flex items-center gap-2.5 px-4 py-3 rounded-full mb-5 text-left active:scale-[.99] transition" style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SH.card }}><Search size={18} style={{ color: C.faint }} /><span className="flex-1 text-sm" style={{ color: C.faint }}>ძებნა</span></button>
          <div className="p-4 mb-4" style={card()}><div className="flex items-center gap-1.5 text-[15px] mb-3.5" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700 }}><TrendingUp size={17} style={{ color: C.accent }} /> ტრენდები</div><div className="space-y-3">{TRENDING.slice(0, 5).map(t => <button key={t.tag} onClick={() => onTag(t.tag)} className="block text-left w-full hover:opacity-70"><div className="font-bold text-[14px]" style={{ color: C.ink }}>#{t.tag}</div><Mono style={{ fontSize: 12, color: C.faint }}>{t.posts} პოსტი</Mono></button>)}</div></div>
          <div className="p-4" style={card()}><div className="text-[15px] mb-3.5" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700 }}>გაიცანი</div><div className="space-y-3.5">{["u3", "u7", "u5"].map(id => <div key={id} className="flex items-center gap-2.5"><button onClick={() => openProfile(id)}><Avatar id={id} size={40} /></button><div className="min-w-0 flex-1"><Name id={id} className="text-[13px]" /><Mono style={{ fontSize: 12, color: C.faint }} className="block truncate">@{USERS[id].handle}</Mono></div><FollowBtn id={id} isFollowing={isFollowing} onToggle={toggleFollow} /></div>)}</div></div>
        </aside>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 flex items-center justify-around px-2 pt-1.5" style={{ background: C.surface + "f0", backdropFilter: "blur(16px)", borderTop: `1px solid ${C.line}`, paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
        {BOTTOM.map(k => {
          const n = NAV.find(x => x.key === k);
          if (k === "create") return <button key={k} onClick={() => setCreateOpen(true)} className="rounded-2xl flex items-center justify-center -mt-1 active:scale-90 transition" style={{ width: 46, height: 46, backgroundImage: GBRAND, boxShadow: SH.glow }}><Plus size={26} color="#fff" /></button>;
          const active = tab === k;
          return <button key={k} onClick={() => goTab(k)} className="relative flex flex-col items-center gap-1 px-3 py-1 active:scale-90" style={{ color: active ? C.accent : C.faint }}>{k === "profile" ? <Avatar id={ME} size={26} /> : <n.icon size={25} fill={active && k === "home" ? C.accent : "none"} />}{active && k !== "profile" && <span className="absolute -bottom-0.5 rounded-full" style={{ width: 4, height: 4, backgroundImage: GBRAND }} />}{n.badge > 0 && <span className="absolute top-0 right-1.5 rounded-full text-white flex items-center justify-center" style={{ minWidth: 16, height: 16, padding: "0 4px", background: C.like, fontFamily: MONO, fontSize: 10, fontWeight: 700 }}>{n.badge > 9 ? "9+" : n.badge}</span>}</button>;
        })}
      </nav>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} nav={NAV} onNav={goTab} onCreate={() => { setDrawerOpen(false); setCreateOpen(true); }} flash={(t) => { setDrawerOpen(false); flash(t); }} tab={tab} mode={mode} setMode={setMode} xp={xp} onSettings={() => { setDrawerOpen(false); setSettingsOpen(true); }} onSignOut={() => { setDrawerOpen(false); authApi.signOut().catch(dbErr("გასვლა")); }} />
      {createOpen && <CreateSheet onClose={() => setCreateOpen(false)} onPost={onPost} live={live} onUpload={(f) => uploadImage(f, "posts")} />}
      {story && <StoryViewer story={story} onClose={() => setStoryId(null)} onDone={markSeen} flash={flash} />}
      {listView && <FollowList view={listView} following={following} onToggleFollow={toggleFollow} onOpenProfile={openProfile} onClose={() => setListView(null)} />}
      {settingsOpen && <SettingsView settings={settings} setSettings={setSettings} meProfile={meProfile} setMeProfile={setMeProfile} mode={mode} setMode={setMode} onClose={() => setSettingsOpen(false)} flash={flash} onSignOut={() => { setSettingsOpen(false); authApi.signOut().catch(dbErr("გასვლა")); }} />}
      {storyEditorOpen && <StoryEditor onClose={() => setStoryEditorOpen(false)} onShare={onAddStory} live={live} onUpload={(f) => uploadImage(f, "stories")} />}
      {reelCreateOpen && <ReelCreate onClose={() => setReelCreateOpen(false)} onPublish={onPublishReel} onUpload={(f) => uploadImage(f, "reels")} />}
      {searchOpen && <SearchView posts={posts} onOpenProfile={openProfile} onTag={onTag} onClose={() => setSearchOpen(false)} />}
      {toast && <div className="fixed left-1/2 z-[80] px-4 py-2.5 rounded-full text-sm font-bold text-white" style={{ bottom: 92, background: DARK ? C.surfaceMuted : C.ink, border: DARK ? `1px solid ${C.line}` : "none", boxShadow: SH.pop, animation: "pin .3s cubic-bezier(.22,.61,.36,1) both" }}>{toast}</div>}
    </div>
  );
}

/* ─────────────────────────  REELS / GROUPS / EVENTS / PROGRESS DATA  ───────────────────────── */
const levelInfo = (xp) => { const lvl = Math.floor(xp / 100) + 1; const into = xp % 100; return { lvl, into, pct: into }; };
const kfmt = (n) => n > 999 ? (n / 1000).toFixed(1) + "k" : "" + n;

let reid = 1;

let gid = 1;

let evid = 1;

const STREAKS = { u4: 47, u3: 21, u2: 12, u8: 5, u6: 3 };
const RSVP_OPTS = [["going", "მივდივარ"], ["maybe", "ფიქრობ"], ["no", "ვერ"]];

/* ─────────────────────────  REELS  ───────────────────────── */
function ReelCard({ r, onLike, onSave, onOpenProfile, flash }) {
  const u = USERS[r.authorId]; const [pop, setPop] = useState(false); const lastTap = useRef(0);
  const like = () => { if (!r.likedByMe) { setPop(true); setTimeout(() => setPop(false), 420); } onLike(r.id); };
  const onMedia = () => { const now = Date.now(); if (now - lastTap.current < 300 && !r.likedByMe) like(); lastTap.current = now; };
  return (
    <div className="relative w-full" style={{ height: "100dvh", scrollSnapAlign: "start" }}>
      {r.video ? <video src={r.video} className="absolute inset-0 w-full h-full" style={{ objectFit: "cover" }} autoPlay loop muted playsInline /> : <Pic src={r.image} grad={GRADS[hashIdx(r.id, GRADS.length)]} className="absolute inset-0 w-full h-full" />}
      <button className="absolute inset-0" onClick={onMedia} />
      <div className="absolute inset-x-0 top-0 h-28 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(0,0,0,.5), transparent)" }} />
      <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ height: "45%", background: "linear-gradient(0deg, rgba(0,0,0,.75), transparent)" }} />
      <div className="absolute right-3 flex flex-col items-center gap-5" style={{ bottom: 110 }}>
        <button onClick={() => onOpenProfile(u.id)} className="mb-1"><div className="rounded-full p-[2px]" style={{ backgroundImage: GBRAND }}><div className="rounded-full p-[2px]" style={{ background: "#000" }}><Avatar id={u.id} size={42} /></div></div></button>
        <button onClick={like} className="flex flex-col items-center gap-1 active:scale-90" style={{ color: "#fff" }}><Heart size={34} fill={r.likedByMe ? C.like : "none"} color={r.likedByMe ? C.like : "#fff"} style={{ transform: pop ? "scale(1.3)" : "scale(1)", transition: "transform .3s cubic-bezier(.34,1.56,.64,1)", filter: "drop-shadow(0 2px 6px rgba(0,0,0,.4))" }} /><Mono className="text-xs font-bold" style={{ textShadow: "0 1px 3px rgba(0,0,0,.6)" }}>{kfmt(r.likes + (r.likedByMe ? 1 : 0))}</Mono></button>
        <button onClick={() => flash && flash("კომენტარები — მალე ✨")} className="flex flex-col items-center gap-1 active:scale-90" style={{ color: "#fff" }}><MessageCircle size={32} style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,.4))" }} /><Mono className="text-xs font-bold" style={{ textShadow: "0 1px 3px rgba(0,0,0,.6)" }}>{r.comments}</Mono></button>
        <button onClick={() => onSave(r.id)} className="flex flex-col items-center gap-1 active:scale-90" style={{ color: r.savedByMe ? C.star : "#fff" }}><Bookmark size={31} fill={r.savedByMe ? C.star : "none"} style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,.4))" }} /></button>
        <button onClick={() => flash && flash("გაზიარდა 🔗")} className="flex flex-col items-center gap-1 active:scale-90" style={{ color: "#fff" }}><Send size={31} style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,.4))" }} /><Mono className="text-xs font-bold" style={{ textShadow: "0 1px 3px rgba(0,0,0,.6)" }}>{r.shares}</Mono></button>
      </div>
      <div className="absolute left-3 right-16 text-white" style={{ bottom: 100 }}>
        <button onClick={() => onOpenProfile(u.id)} className="flex items-center gap-1.5 mb-2"><span className="font-bold text-[15px]" style={{ fontFamily: DISPLAY }}>@{u.handle}</span>{u.verified && <ShieldCheck size={14} />}</button>
        <div className="text-[14px] mb-2" style={{ lineHeight: 1.4, textShadow: "0 1px 4px rgba(0,0,0,.5)" }}>{r.caption}</div>
        <div className="flex items-center gap-1.5 text-[12px]" style={{ opacity: 0.92 }}><span style={{ fontSize: 13 }}>♪</span><span className="truncate">{r.audio}</span></div>
      </div>
    </div>
  );
}
function ReelCreate({ onClose, onPublish, onUpload }) {
  const [vid, setVid] = useState(null); const [caption, setCaption] = useState(""); const [up, setUp] = useState(false); const fileRef = useRef(null);
  const pick = async (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; setUp(true); try { setVid(await onUpload(f)); } catch (err) {} setUp(false); e.target.value = ""; };
  return (
    <div className="fixed inset-0 z-[60] flex sm:items-center justify-center items-end" style={{ background: "rgba(6,7,12,.6)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full sm:max-w-[460px] sm:rounded-3xl rounded-t-3xl" style={{ background: C.surface, boxShadow: SH.pop }}>
        <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: `1px solid ${C.lineSoft}` }}><button onClick={onClose} style={{ color: C.muted }}><X size={22} /></button><span className="font-bold" style={{ color: C.ink, fontFamily: DISPLAY }}>ახალი Reel</span><button disabled={!vid} onClick={() => onPublish({ video: vid, caption: caption.trim() })} className="px-4 py-1.5 rounded-full text-sm font-bold" style={{ backgroundImage: vid ? GBRAND : "none", background: vid ? undefined : C.line, color: vid ? "#fff" : C.faint }}>გამოქვეყნება</button></div>
        <div className="p-4 space-y-3.5">
          <input ref={fileRef} type="file" accept="video/*" hidden onChange={pick} />
          {vid ? (
            <div className="relative rounded-2xl overflow-hidden mx-auto" style={{ background: "#000", aspectRatio: "9/16", maxHeight: 360 }}><video src={vid} className="w-full h-full" style={{ objectFit: "contain" }} autoPlay loop muted playsInline /><button onClick={() => setVid(null)} className="absolute top-2 right-2 rounded-full p-1.5" style={{ background: "rgba(0,0,0,.55)", color: "#fff" }}><X size={16} /></button></div>
          ) : (
            <button onClick={() => fileRef.current && fileRef.current.click()} disabled={up} className="w-full flex flex-col items-center justify-center gap-2 rounded-2xl mx-auto" style={{ aspectRatio: "9/16", maxHeight: 320, background: C.surfaceMuted, border: `2px dashed ${C.line}`, color: C.muted }}>{up ? <span className="text-sm font-bold">იტვირთება…</span> : <><div className="rounded-full flex items-center justify-center" style={{ width: 56, height: 56, background: C.accentSoft }}><Film size={26} style={{ color: C.accent }} /></div><span className="text-sm font-bold" style={{ color: C.ink2 }}>აირჩიე ვიდეო</span><span className="text-[12px]">MP4 / MOV</span></>}</button>
          )}
          <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="დაწერე აღწერა…" className="w-full px-3.5 py-3 rounded-xl outline-none text-[15px]" style={{ background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` }} />
        </div>
      </div>
    </div>
  );
}
function Reels({ reels, onLike, onSave, onOpenProfile, onMenu, flash, onCreate }) {
  return (
    <div className="relative" style={{ height: "100dvh", background: "#000" }}>
      <div className="no-scrollbar overflow-y-scroll h-full" style={{ scrollSnapType: "y mandatory" }}>
        {reels.map(r => <ReelCard key={r.id} r={r} onLike={onLike} onSave={onSave} onOpenProfile={onOpenProfile} flash={flash} />)}
      </div>
      <div className="absolute top-0 inset-x-0 p-3 flex items-center justify-between pointer-events-none">
        <button onClick={onMenu} className="md:hidden rounded-full flex items-center justify-center active:scale-90 pointer-events-auto" style={{ width: 42, height: 42, background: "rgba(255,255,255,.15)", backdropFilter: "blur(8px)", color: "#fff" }}><Menu size={22} /></button>
        <span className="font-bold text-white text-[19px]" style={{ fontFamily: DISPLAY, textShadow: "0 1px 6px rgba(0,0,0,.5)" }}>Reels</span>
        <button onClick={onCreate} className="rounded-full flex items-center justify-center active:scale-90 pointer-events-auto" style={{ width: 42, height: 42, background: "rgba(255,255,255,.15)", backdropFilter: "blur(8px)", color: "#fff" }}><Plus size={24} /></button>
      </div>
    </div>
  );
}

/* ─────────────────────────  GROUPS + EVENTS  ───────────────────────── */
function GroupPost({ p, onOpenProfile }) {
  const [liked, setLiked] = useState(false); const u = USERS[p.authorId];
  return (
    <div className="p-3.5" style={card()}>
      <div className="flex items-center gap-2.5 mb-2"><button onClick={() => onOpenProfile(u.id)}><Avatar id={u.id} size={36} /></button><div className="leading-tight"><Name id={u.id} className="text-[14px]" /><div><Handle h={u.handle} t={p.time} /></div></div></div>
      {p.text && <div className="text-[14px] mb-2" style={{ color: C.ink2, lineHeight: 1.5 }}>{p.text}</div>}
      {p.image && <Pic src={p.image} grad={GRADS[hashIdx(p.id, GRADS.length)]} round={12} style={{ aspectRatio: "16/10" }} className="mb-2" />}
      <div className="flex items-center gap-4 text-[13px]" style={{ color: C.faint }}>
        <button onClick={() => setLiked(l => !l)} className="flex items-center gap-1.5 active:scale-90" style={{ color: liked ? C.like : C.faint }}><Heart size={17} fill={liked ? C.like : "none"} /><Mono>{p.likes + (liked ? 1 : 0)}</Mono></button>
        <span className="flex items-center gap-1.5"><MessageCircle size={17} /><Mono>{p.cc}</Mono></span>
      </div>
    </div>
  );
}
function MiniMap({ h = 120 }) {
  return (
    <div className="relative w-full overflow-hidden" style={{ height: h, borderRadius: 14, background: C.mapBase }}>
      <svg viewBox="0 0 300 140" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
        <rect width="300" height="140" fill={C.mapBase} />
        <ellipse cx="60" cy="40" rx="50" ry="30" fill={C.mapPark} />
        <path d="M-10 30 C 80 50, 120 110, 310 120" fill="none" stroke={C.mapRiver} strokeWidth="20" />
        <g stroke={C.mapRoad} strokeWidth="7" opacity={DARK ? 0.7 : 1}><path d="M0 70 H300" /><path d="M150 0 V140" /><path d="M70 0 V140" /><path d="M230 0 V140" /></g>
      </svg>
      <div className="absolute" style={{ left: "52%", top: "48%", transform: "translate(-50%,-100%)" }}>
        <div className="rounded-full p-[2px]" style={{ backgroundImage: GBRAND }}><div className="rounded-full flex items-center justify-center" style={{ width: 26, height: 26, background: C.surface }}><MapPin size={15} style={{ color: C.accent }} /></div></div>
      </div>
    </div>
  );
}
function Groups({ groups, events, onJoin, onRsvp, onOpenProfile, onMessage, live, onGroupPost, onUpload }) {
  const [seg, setSeg] = useState("groups"); const [gOpen, setGOpen] = useState(null); const [eOpen, setEOpen] = useState(null);
  const [gp, setGp] = useState(""); const [gpImg, setGpImg] = useState(null); const [gpUp, setGpUp] = useState(false); const gpFileRef = useRef(null);
  const gpPick = async (e) => { const f = e.target.files && e.target.files[0]; if (!f || !onUpload) return; setGpUp(true); try { setGpImg(await onUpload(f)); } catch (err) {} setGpUp(false); e.target.value = ""; };
  const sendGp = (gid) => { if (!gp.trim() && !gpImg) return; onGroupPost(gid, { text: gp.trim(), imageUrl: gpImg }); setGp(""); setGpImg(null); };
  const g = groups.find(x => x.id === gOpen); const e = events.find(x => x.id === eOpen);

  if (g) {
    return (
      <div className="pb-28 md:pb-10">
        <div className="flex items-center gap-3 px-4 py-3 sticky top-0 z-10" style={{ background: C.paper + "e6", backdropFilter: "blur(12px)" }}><button onClick={() => setGOpen(null)} style={{ color: C.ink2 }}><ArrowLeft size={22} /></button><span className="font-bold truncate" style={{ color: C.ink, fontFamily: DISPLAY }}>{g.name}</span></div>
        <Pic src={g.cover} grad={GRADS[hashIdx(g.id, GRADS.length)]} className="w-full" style={{ aspectRatio: "2/1" }} />
        <div className="px-4 pt-4">
          <h2 className="text-[20px]" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700 }}>{g.name}</h2>
          <div className="flex items-center gap-2 mt-1 text-[13px]" style={{ color: C.muted }}><Users size={14} /><Mono className="font-bold">{g.members.toLocaleString()}</Mono> წევრი · <span style={{ color: C.accent }}>{g.cat}</span></div>
          <div className="text-[14px] mt-2.5" style={{ color: C.ink2, lineHeight: 1.55 }}>{g.about}</div>
          <button onClick={() => onJoin(g.id)} className="w-full mt-3.5 py-2.5 rounded-xl text-sm font-bold transition active:scale-[.98]" style={g.joined ? { background: C.surface, color: C.ink, border: `1px solid ${C.line}` } : { backgroundImage: GBRAND, color: "#fff", boxShadow: SH.glow }}>{g.joined ? "✓ წევრი ხარ" : "შეუერთდი ჯგუფს"}</button>
        </div>
        <div className="flex items-center gap-2 px-3 mt-5 mb-2" style={{ color: C.muted }}><MessageSquare size={16} /><span className="text-sm font-bold">პოსტები</span></div>
        {g.joined && <div className="px-3 mb-3"><div className="p-3" style={card()}><div className="flex gap-2.5"><Avatar id={ME} size={34} /><textarea value={gp} onChange={e => setGp(e.target.value)} rows={2} placeholder="დაწერე ჯგუფში…" className="flex-1 resize-none bg-transparent outline-none text-[14px]" style={{ color: C.ink }} /></div>{gpImg && <div className="relative mt-2 ml-11 inline-block"><Pic src={gpImg} round={12} style={{ maxHeight: 140, maxWidth: 220 }} /><button onClick={() => setGpImg(null)} className="absolute top-1.5 right-1.5 rounded-full p-1" style={{ background: "rgba(0,0,0,.5)", color: "#fff" }}><X size={14} /></button></div>}<div className="flex items-center justify-between mt-2 ml-11"><input ref={gpFileRef} type="file" accept="image/*" hidden onChange={gpPick} /><button onClick={() => gpFileRef.current && gpFileRef.current.click()} disabled={gpUp} className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: C.accent }}>{gpUp ? "…" : <><ImageIcon size={17} /> ფოტო</>}</button><button onClick={() => sendGp(g.id)} disabled={!gp.trim() && !gpImg} className="px-4 py-1.5 rounded-full text-sm font-bold" style={{ backgroundImage: (gp.trim() || gpImg) ? GBRAND : "none", background: (gp.trim() || gpImg) ? undefined : C.line, color: (gp.trim() || gpImg) ? "#fff" : C.faint }}>გამოქვეყნება</button></div></div></div>}
        <div className="space-y-3 px-3">{g.posts.map(p => <GroupPost key={p.id} p={p} onOpenProfile={onOpenProfile} />)}</div>
      </div>
    );
  }
  if (e) {
    const host = USERS[e.hostId];
    return (
      <div className="pb-28 md:pb-10">
        <div className="flex items-center gap-3 px-4 py-3 sticky top-0 z-10" style={{ background: C.paper + "e6", backdropFilter: "blur(12px)" }}><button onClick={() => setEOpen(null)} style={{ color: C.ink2 }}><ArrowLeft size={22} /></button><span className="font-bold truncate" style={{ color: C.ink, fontFamily: DISPLAY }}>ივენთი</span></div>
        <Pic src={e.cover} grad={GRADS[hashIdx(e.id, GRADS.length)]} className="w-full" style={{ aspectRatio: "2/1" }} />
        <div className="px-4 pt-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl flex flex-col items-center justify-center shrink-0" style={{ width: 56, height: 56, background: C.accentSoft }}><Mono className="text-[10px] font-bold uppercase" style={{ color: C.accentText }}>{e.mon}</Mono><Mono className="text-xl font-bold" style={{ color: C.accent, lineHeight: 1 }}>{e.day}</Mono></div>
            <div className="min-w-0"><h2 className="text-[19px]" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700, lineHeight: 1.25 }}>{e.title}</h2><div className="flex items-center gap-1 text-[13px] mt-1" style={{ color: C.muted }}><Mono>{e.time}</Mono> · <MapPin size={13} style={{ color: C.accent }} /> {e.location}</div></div>
          </div>
          <div className="text-[14px] mt-3.5" style={{ color: C.ink2, lineHeight: 1.55 }}>{e.about}</div>
          <div className="mt-3.5"><MiniMap /></div>
          <div className="flex items-center gap-2 mt-3.5 text-[13px]" style={{ color: C.muted }}><div className="flex -space-x-2">{["u2", "u4", "u7", "u3"].map(id => <button key={id} onClick={() => onOpenProfile(id)} className="rounded-full active:scale-95" style={{ border: `2px solid ${C.paper}` }}><Avatar id={id} size={26} /></button>)}</div><Mono className="font-bold" style={{ color: C.ink }}>{e.going}</Mono> მიდის</div>
          <div className="flex gap-2 mt-3.5">{RSVP_OPTS.map(([v, l]) => <button key={v} onClick={() => onRsvp(e.id, v)} className="flex-1 py-2.5 rounded-xl text-sm font-bold transition active:scale-95" style={e.rsvp === v ? { backgroundImage: GBRAND, color: "#fff", boxShadow: SH.glow } : { background: C.surfaceMuted, color: C.ink2 }}>{l}</button>)}</div>
          <button onClick={() => onMessage(host.id)} className="w-full flex items-center gap-3 mt-3 p-3.5" style={card()}><Avatar id={host.id} size={40} /><div className="flex-1 text-left"><div className="text-[12px]" style={{ color: C.faint }}>ორგანიზატორი</div><Name id={host.id} className="text-[14px]" /></div><Send size={18} style={{ color: C.accent }} /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28 md:pb-10">
      <div className="px-4 pt-5 pb-3"><Title>{seg === "groups" ? "ჯგუფები" : "ივენთები"}</Title></div>
      <div className="px-4 pb-4"><div className="flex gap-1 p-1 rounded-2xl" style={{ background: C.surfaceMuted }}>{[["groups", "ჯგუფები"], ["events", "ივენთები"]].map(([k, l]) => <button key={k} onClick={() => setSeg(k)} className="flex-1 py-2 rounded-xl text-sm font-bold transition" style={seg === k ? { background: C.surface, color: C.accent, boxShadow: SH.card } : { color: C.muted }}>{l}</button>)}</div></div>
      {seg === "groups" ? (
        <div className="space-y-3 px-3">{groups.map(gr => (
          <button key={gr.id} onClick={() => setGOpen(gr.id)} className="w-full text-left overflow-hidden transition active:scale-[.99]" style={card()}>
            <Pic src={gr.cover} grad={GRADS[hashIdx(gr.id, GRADS.length)]} className="w-full" style={{ aspectRatio: "3/1" }} />
            <div className="p-3.5"><div className="flex items-center justify-between gap-2"><div className="min-w-0"><div className="text-[16px]" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700 }}>{gr.name}</div><div className="flex items-center gap-1.5 text-[12px] mt-0.5" style={{ color: C.muted }}><Users size={13} /><Mono>{gr.members.toLocaleString()}</Mono> წევრი · {gr.cat}</div></div>{gr.joined ? <span className="text-[12px] font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: C.accentSoft, color: C.accentText }}>✓ წევრი</span> : <span className="text-[12px] font-bold px-2.5 py-1 rounded-full shrink-0 text-white" style={{ backgroundImage: GBRAND }}>+ შესვლა</span>}</div></div>
          </button>
        ))}</div>
      ) : (
        <div className="space-y-3 px-3">{events.map(ev => (
          <button key={ev.id} onClick={() => setEOpen(ev.id)} className="w-full text-left flex gap-3 p-3" style={card()}>
            <div className="rounded-2xl flex flex-col items-center justify-center shrink-0" style={{ width: 56, height: 56, background: C.accentSoft }}><Mono className="text-[10px] font-bold uppercase" style={{ color: C.accentText }}>{ev.mon}</Mono><Mono className="text-xl font-bold" style={{ color: C.accent, lineHeight: 1 }}>{ev.day}</Mono></div>
            <div className="min-w-0 flex-1"><div className="text-[15px]" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700, lineHeight: 1.25 }}>{ev.title}</div><div className="flex items-center gap-1 text-[12px] mt-1" style={{ color: C.muted }}><Mono>{ev.time}</Mono> · <MapPin size={12} /> <span className="truncate">{ev.location}</span></div><div className="flex items-center gap-1 text-[12px] mt-1.5" style={{ color: ev.rsvp === "going" ? C.online : C.faint }}><Users size={12} /><Mono className="font-bold">{ev.going}</Mono> მიდის{ev.rsvp === "going" && " · შენც ✓"}</div></div>
          </button>
        ))}</div>
      )}
    </div>
  );
}

/* ─────────────────────────  PROGRESS (Streaks + XP)  ───────────────────────── */
function Progress({ xp, gainXp, onMessage, onOpenProfile }) {
  const { lvl, into } = levelInfo(xp);
  const [claimed, setClaimed] = useState([]);
  const daily = [
    { id: "d1", label: "დაამატე 1 პოსტი", done: 1, total: 1, xp: 20, icon: ImageIcon },
    { id: "d2", label: "დააკომენტარე 3-ჯერ", done: 1, total: 3, xp: 15, icon: MessageCircle },
    { id: "d3", label: "7 დღე ზედიზედ შემოსვლა", done: 7, total: 7, xp: 50, icon: Zap },
  ];
  const streakList = Object.entries(STREAKS).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  return (
    <div className="pb-28 md:pb-10">
      <div className="px-4 pt-5 pb-3"><Title>პროგრესი</Title></div>
      <div className="px-4">
        <div className="rounded-2xl p-5 text-white relative overflow-hidden" style={{ backgroundImage: GBRAND, boxShadow: SH.glow }}>
          <div className="flex items-center justify-between">
            <div><div className="text-[13px] font-semibold" style={{ opacity: 0.85 }}>შენი დონე</div><div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 40, lineHeight: 1 }}>LVL {lvl}</div></div>
            <div className="rounded-2xl flex items-center justify-center" style={{ width: 60, height: 60, background: "rgba(255,255,255,.2)" }}><Zap size={30} fill="#fff" /></div>
          </div>
          <div className="mt-4"><div className="flex justify-between text-[12px] mb-1.5" style={{ opacity: 0.9 }}><Mono>{into} / 100 XP</Mono><Mono>{100 - into} შემდეგ დონემდე</Mono></div><div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.25)" }}><div className="h-full rounded-full" style={{ width: into + "%", background: "#fff" }} /></div></div>
          <div className="mt-3 text-[13px]" style={{ opacity: 0.9 }}>სულ <Mono className="font-bold">{xp}</Mono> XP დაგროვილი</div>
        </div>

        <div className="flex items-center gap-2 mt-6 mb-3"><Check size={18} style={{ color: C.accent }} /><h2 className="text-[17px]" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700 }}>დღის გამოწვევები</h2></div>
        <div className="space-y-2.5">{daily.map(d => { const isDone = d.done >= d.total; const got = claimed.includes(d.id); return (
          <div key={d.id} className="p-3.5 flex items-center gap-3" style={card()}>
            <div className="rounded-xl flex items-center justify-center shrink-0" style={{ width: 40, height: 40, background: C.accentSoft }}><d.icon size={19} style={{ color: C.accent }} /></div>
            <div className="flex-1 min-w-0"><div className="text-[14px] font-bold" style={{ color: C.ink }}>{d.label}</div><div className="flex items-center gap-2 mt-1.5"><div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: C.surfaceMuted }}><div className="h-full rounded-full" style={{ width: Math.min(100, d.done / d.total * 100) + "%", backgroundImage: GBRAND }} /></div><Mono style={{ fontSize: 11, color: C.faint }}>{d.done}/{d.total}</Mono></div></div>
            {isDone && (got ? <Check size={20} style={{ color: C.online }} /> : <button onClick={() => { setClaimed(c => [...c, d.id]); gainXp(d.xp); }} className="px-3 py-1.5 rounded-full text-xs font-bold text-white shrink-0 active:scale-95" style={{ backgroundImage: GBRAND }}>+{d.xp} XP</button>)}
          </div>
        ); })}</div>

        <div className="flex items-center gap-2 mt-6 mb-3"><span style={{ fontSize: 18 }}>🔥</span><h2 className="text-[17px]" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700 }}>Streak-ები</h2></div>
        <div className="space-y-2.5">{streakList.map(([id, n]) => (
          <div key={id} className="p-3 flex items-center gap-3" style={card()}>
            <button onClick={() => onOpenProfile(id)} className="active:scale-95"><Avatar id={id} size={44} /></button>
            <div className="flex-1 min-w-0"><Name id={id} className="text-[14px]" /><div className="text-[12px] mt-0.5" style={{ color: C.muted }}>{n >= 30 ? "ცეცხლი! ნუ გაწყვეტ 🔥" : "გააგრძელე streak"}</div></div>
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full" style={{ background: C.star + "1f" }}><span style={{ fontSize: 15 }}>🔥</span><Mono className="font-bold" style={{ color: C.star }}>{n}</Mono></div>
            <button onClick={() => onMessage(id)} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 38, height: 38, background: C.surfaceMuted, color: C.accent }}><Send size={16} /></button>
          </div>
        ))}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────  SETTINGS  ───────────────────────── */
function Switch({ on, onClick }) {
  return <button onClick={onClick} className="rounded-full transition shrink-0" style={{ width: 46, height: 27, padding: 3, background: on ? undefined : C.line, backgroundImage: on ? GBRAND : "none" }}><span className="block rounded-full transition" style={{ width: 21, height: 21, background: "#fff", transform: on ? "translateX(19px)" : "translateX(0)", boxShadow: "0 1px 3px rgba(0,0,0,.3)" }} /></button>;
}
const SettingsSection = ({ title, children }) => <div className="mt-5"><div className="px-4 pb-1.5 text-[12px] font-bold uppercase" style={{ color: C.faint, fontFamily: MONO, letterSpacing: "0.04em" }}>{title}</div><div style={{ background: C.surface, borderTop: `1px solid ${C.lineSoft}`, borderBottom: `1px solid ${C.lineSoft}` }}>{children}</div></div>;
const SettingsRow = ({ label, sub, on, onToggle, first }) => <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: first ? "none" : `1px solid ${C.lineSoft}` }}><div className="pr-3"><div className="text-[15px]" style={{ color: C.ink }}>{label}</div>{sub && <div className="text-[12px] mt-0.5" style={{ color: C.faint }}>{sub}</div>}</div><Switch on={on} onClick={onToggle} /></div>;
function SettingsView({ settings, setSettings, meProfile, setMeProfile, mode, setMode, onClose, flash, onSignOut }) {
  const set = (k, v) => setSettings(s => ({ ...s, [k]: v }));
  const tog = (k) => setSettings(s => ({ ...s, [k]: !s[k] }));
  return (
    <div className="fixed inset-0 z-[59] flex justify-center" style={{ background: C.paper }}>
      <div className="w-full max-w-[600px] flex flex-col" style={{ height: "100dvh", borderLeft: `1px solid ${C.line}`, borderRight: `1px solid ${C.line}` }}>
        <div className="flex items-center gap-3 px-3 py-3 shrink-0" style={{ background: C.surface, borderBottom: `1px solid ${C.line}` }}><button onClick={onClose} className="active:scale-90" style={{ color: C.ink2 }}><ArrowLeft size={22} /></button><span className="font-bold text-[16px]" style={{ color: C.ink, fontFamily: DISPLAY }}>პარამეტრები</span></div>
        <div className="flex-1 overflow-y-auto pb-10">
          <div className="flex items-center gap-3 px-4 pt-5"><Avatar id={ME} size={60} /><div><div className="font-bold text-[16px]" style={{ color: C.ink, fontFamily: DISPLAY }}>{meProfile.name}</div><Mono style={{ fontSize: 12, color: C.faint }}>@{USERS[ME].handle}</Mono></div></div>
          <SettingsSection title="პროფილის რედაქტირება">
            <div className="px-4 py-3"><div className="text-[12px] mb-1" style={{ color: C.faint }}>სახელი</div><input value={meProfile.name} onChange={e => setMeProfile(p => ({ ...p, name: e.target.value }))} className="w-full bg-transparent outline-none text-[15px]" style={{ color: C.ink }} /></div>
            <div className="px-4 py-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}><div className="text-[12px] mb-1" style={{ color: C.faint }}>ბიო</div><textarea value={meProfile.bio} onChange={e => setMeProfile(p => ({ ...p, bio: e.target.value }))} rows={2} className="w-full bg-transparent outline-none text-[15px] resize-none" style={{ color: C.ink, lineHeight: 1.5 }} /></div>
          </SettingsSection>
          <SettingsSection title="ვიზუალი">
            <div className="px-4 py-3"><ThemeToggle mode={mode} setMode={setMode} full /></div>
            <div className="px-4 py-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}><div className="text-[13px] mb-2" style={{ color: C.muted }}>ენა</div><div className="flex gap-1 p-1 rounded-2xl" style={{ background: C.surfaceMuted }}>{[["ka", "ქართული"], ["en", "English"]].map(([k, l]) => <button key={k} onClick={() => set("lang", k)} className="flex-1 py-2 rounded-xl text-sm font-bold transition" style={settings.lang === k ? { background: C.surface, color: C.accent, boxShadow: SH.card } : { color: C.muted }}>{l}</button>)}</div></div>
          </SettingsSection>
          <SettingsSection title="კონფიდენციალურობა">
            <SettingsRow first label="დახურული ანგარიში" sub="მხოლოდ მიმდევრები ხედავენ შენს პოსტებს" on={settings.private} onToggle={() => tog("private")} />
            <SettingsRow label="აქტივობის სტატუსი" sub="აჩვენე როდის ხარ ონლაინ" on={settings.activity} onToggle={() => tog("activity")} />
            <SettingsRow label="ლოკაციის გაზიარება" sub="რუკაზე მეგობრებისთვის ჩვენება" on={settings.showLocation} onToggle={() => tog("showLocation")} />
          </SettingsSection>
          <SettingsSection title="შეტყობინებები">
            <SettingsRow first label="მოწონებები" on={settings.nLikes} onToggle={() => tog("nLikes")} />
            <SettingsRow label="კომენტარები" on={settings.nComments} onToggle={() => tog("nComments")} />
            <SettingsRow label="ახალი მიმდევრები" on={settings.nFollows} onToggle={() => tog("nFollows")} />
            <SettingsRow label="პირადი შეტყობინებები" on={settings.nMessages} onToggle={() => tog("nMessages")} />
          </SettingsSection>
          <div className="px-4 mt-6"><button onClick={onSignOut} className="w-full py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 active:scale-[.98]" style={{ background: C.likeSoft, color: C.like }}><LogOut size={18} /> გასვლა</button></div>
          <div className="px-4 mt-4 text-center"><Mono style={{ fontSize: 11, color: C.faint }}>mzera v0.7 · build 7a2c · React + Vite</Mono></div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────  STORY EDITOR  ───────────────────────── */
const FILTERS = [["ნორმ", "none"], ["მონო", "grayscale(1)"], ["თბილი", "sepia(.4) saturate(1.5) hue-rotate(-10deg)"], ["ცივი", "saturate(1.2) hue-rotate(18deg) brightness(1.05)"], ["ვივიდი", "saturate(1.8) contrast(1.1)"], ["ფეიდი", "contrast(.85) brightness(1.12) saturate(.85)"]];
const STORY_PICS = ["sp1", "sp2", "sp3", "sp4", "sp5", "sp6"];
const STORY_STICKERS = ["❤️", "🔥", "😎", "✨", "🎉", "📍", "☕", "🌅", "💯", "👀", "🥳", "🙌"];
function StoryEditor({ onClose, onShare, live, onUpload }) {
  const [pic, setPic] = useState("sp1"); const [filter, setFilter] = useState("none"); const [text, setText] = useState(""); const [stickers, setStickers] = useState([]); const [mode, setMode] = useState("filter");
  const fileRef = useRef(null); const [uploading, setUploading] = useState(false);
  const srcAt = (w, h) => pic.startsWith("http") ? pic : img(pic, w, h);
  const pickFile = async (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; setUploading(true); try { const url = await onUpload(f); setPic(url); } catch (err) {} setUploading(false); e.target.value = ""; };
  const addSticker = (e) => setStickers(s => [...s, { e, x: 25 + Math.random() * 50, y: 28 + Math.random() * 40 }]);
  return (
    <div className="fixed inset-0 z-[62] flex items-center justify-center" style={{ background: "rgba(0,0,0,.96)" }}>
      <div className="relative w-full max-w-[440px] h-full sm:h-[92vh] sm:rounded-3xl overflow-hidden" style={{ background: "#000" }}>
        <div className="absolute inset-0" style={{ filter }}><Pic src={srcAt(480, 854)} grad={GRADS[hashIdx(pic, GRADS.length)]} className="w-full h-full" /></div>
        {stickers.map((s, i) => <span key={i} style={{ position: "absolute", left: s.x + "%", top: s.y + "%", fontSize: 46, transform: "translate(-50%,-50%)", filter: "drop-shadow(0 2px 6px rgba(0,0,0,.45))" }}>{s.e}</span>)}
        {text && <div className="absolute inset-x-5" style={{ top: "42%" }}><div className="text-center text-white font-bold" style={{ fontSize: 27, fontFamily: DISPLAY, textShadow: "0 2px 10px rgba(0,0,0,.7)", lineHeight: 1.2 }}>{text}</div></div>}
        <div className="absolute top-0 inset-x-0 p-3 flex items-center justify-between" style={{ background: "linear-gradient(180deg, rgba(0,0,0,.4), transparent)" }}>
          <button onClick={onClose} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 40, height: 40, background: "rgba(0,0,0,.4)", color: "#fff", backdropFilter: "blur(6px)" }}><X size={22} /></button>
          <div className="flex gap-1.5">{[["filter", "ფილტრი"], ["text", "ტექსტი"], ["sticker", "სტიკერი"]].map(([k, l]) => <button key={k} onClick={() => setMode(k)} className="px-3 py-1.5 rounded-full text-xs font-bold transition" style={mode === k ? { background: "#fff", color: "#000" } : { background: "rgba(255,255,255,.2)", color: "#fff", backdropFilter: "blur(6px)" }}>{l}</button>)}</div>
        </div>
        <div className="absolute bottom-0 inset-x-0 p-3" style={{ background: "linear-gradient(0deg, rgba(0,0,0,.65), transparent)" }}>
          {mode === "filter" && <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3">{FILTERS.map(([l, f]) => <button key={l} onClick={() => setFilter(f)} className="shrink-0 flex flex-col items-center gap-1"><div className="rounded-xl overflow-hidden" style={{ width: 54, height: 54, outline: filter === f ? "2.5px solid #fff" : "none", outlineOffset: 2 }}><div style={{ filter: f, width: "100%", height: "100%" }}><Pic src={srcAt(96, 96)} className="w-full h-full" /></div></div><span className="text-[10px] text-white">{l}</span></button>)}</div>}
          {mode === "text" && <input autoFocus value={text} onChange={e => setText(e.target.value)} placeholder="დაწერე რამე…" className="w-full mb-3 px-4 py-3 rounded-2xl text-white text-[15px] outline-none" style={{ background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.3)", backdropFilter: "blur(8px)" }} />}
          {mode === "sticker" && <div className="grid grid-cols-6 gap-1 mb-3 p-2 rounded-2xl" style={{ background: "rgba(255,255,255,.12)", backdropFilter: "blur(8px)" }}>{STORY_STICKERS.map(e => <button key={e} onClick={() => addSticker(e)} className="active:scale-90 transition" style={{ fontSize: 28, padding: 4 }}>{e}</button>)}</div>}
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickFile} />
            <button onClick={() => fileRef.current && fileRef.current.click()} disabled={uploading} className="shrink-0 rounded-xl flex items-center justify-center active:scale-90" style={{ width: 40, height: 40, background: "rgba(255,255,255,.18)", color: "#fff", backdropFilter: "blur(6px)" }}>{uploading ? <span className="text-[10px] font-bold">…</span> : <Upload size={18} />}</button>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar flex-1">{STORY_PICS.map(s => <button key={s} onClick={() => setPic(s)} className="shrink-0 rounded-lg overflow-hidden" style={{ width: 40, height: 40, outline: pic === s ? "2px solid #fff" : "none" }}><Pic src={img(s, 80, 80)} className="w-full h-full" /></button>)}</div>
            <button onClick={() => onShare({ image: srcAt(480, 854), filter, text: text.trim(), stickers })} className="rounded-full px-5 py-3 font-bold text-white flex items-center gap-2 shrink-0 active:scale-95" style={{ backgroundImage: GBRAND, boxShadow: SH.glow }}>გაზიარება <Send size={17} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────  LEADERBOARD + ANALYTICS  ───────────────────────── */
function Leaderboard({ xp, posts, onOpenProfile }) {
  const others = Object.values(USERS).filter(u => u.id !== ME).map(u => ({ id: u.id, xp: 280 + (u.followers % 3800) + hashIdx(u.id, 700) }));
  const all = [...others, { id: ME, xp }].sort((a, b) => b.xp - a.xp);
  const myRank = all.findIndex(x => x.id === ME) + 1;
  const top3 = all.slice(0, 3); const rest = all.slice(3);
  const mine = posts.filter(p => p.authorId === ME && !p.hidden);
  const totalLikes = mine.reduce((a, p) => a + p.likes, 0);
  const totalComments = mine.reduce((a, p) => a + p.comments.length, 0);
  const maxLikes = Math.max(1, ...mine.map(p => p.likes));
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const podiumH = { 0: 64, 1: 86, 2: 50 };
  const medal = ["🥇", "🥈", "🥉"];
  return (
    <div className="pb-28 md:pb-10">
      <div className="flex items-center gap-2 px-4 pt-5 pb-3"><Trophy size={24} style={{ color: C.star }} /><Title>რეიტინგი</Title></div>
      <div className="px-4">
        <div className="flex items-end justify-center gap-3 mb-5 pt-4">
          {podiumOrder.map((p) => { const rank = top3.findIndex(t => t.id === p.id); return (
            <button key={p.id} onClick={() => onOpenProfile(p.id)} className="flex flex-col items-center" style={{ width: 92 }}>
              <span style={{ fontSize: 22 }}>{medal[rank]}</span>
              <div className="rounded-full p-[2.5px] my-1.5" style={{ backgroundImage: rank === 0 ? "linear-gradient(135deg,#FFD75E,#F5A623)" : GBRAND }}><div className="rounded-full p-[2px]" style={{ background: C.surface }}><Avatar id={p.id} size={rank === 0 ? 56 : 46} /></div></div>
              <div className="text-[12px] font-bold truncate w-full text-center" style={{ color: C.ink }}>{USERS[p.id].name.split(" ")[0]}</div>
              <Mono className="text-[12px] font-bold" style={{ color: C.accent }}>{p.xp}</Mono>
              <div className="w-full rounded-t-xl mt-1.5 flex items-start justify-center pt-1.5" style={{ height: podiumH[rank], backgroundImage: rank === 0 ? "linear-gradient(180deg,#FFD75E,#F5A623)" : "linear-gradient(180deg," + C.accent + "," + C.cyan + ")" }}><Mono className="text-white font-bold text-sm">#{rank + 1}</Mono></div>
            </button>
          ); })}
        </div>
        <div className="space-y-2">{rest.map((p, i) => { const isMe = p.id === ME; return (
          <button key={p.id} onClick={() => onOpenProfile(p.id)} className="w-full flex items-center gap-3 p-3 transition active:scale-[.99]" style={isMe ? { ...card(), border: `1.5px solid ${C.accent}` } : card()}>
            <Mono className="font-bold w-7 text-center shrink-0" style={{ color: C.faint }}>{i + 4}</Mono>
            <Avatar id={p.id} size={40} />
            <div className="flex-1 text-left min-w-0"><Name id={p.id} className="text-[14px]" />{isMe && <span className="text-[11px] ml-1" style={{ color: C.accent }}>(შენ)</span>}<Mono className="block" style={{ fontSize: 12, color: C.faint }}>@{USERS[p.id].handle}</Mono></div>
            <div className="flex items-center gap-1 shrink-0"><Zap size={14} style={{ color: C.accent }} fill={C.accent} /><Mono className="font-bold" style={{ color: C.ink }}>{p.xp}</Mono></div>
          </button>
        ); })}</div>

        <div className="flex items-center gap-2 mt-7 mb-3"><TrendingUp size={18} style={{ color: C.accent }} /><h2 className="text-[17px]" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700 }}>შენი სტატისტიკა</h2></div>
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          {[["შენი ადგილი", "#" + myRank, Trophy, C.star], ["პოსტი", mine.length, ImageIcon, C.accent], ["მოწონება", totalLikes, Heart, C.like], ["კომენტარი", totalComments, MessageCircle, C.cyan]].map(([l, v, I, col]) => <div key={l} className="p-4" style={card()}><div className="rounded-xl flex items-center justify-center mb-2.5" style={{ width: 36, height: 36, background: col + "22" }}><I size={18} color={col} /></div><Mono className="text-2xl font-bold" style={{ color: C.ink }}>{v}</Mono><div className="text-[12px]" style={{ color: C.muted }}>{l}</div></div>)}
        </div>
        {mine.length > 0 ? (
          <div className="p-4" style={card()}>
            <div className="text-[14px] font-bold mb-3" style={{ color: C.ink }}>მოწონებები პოსტებზე</div>
            <div className="flex items-end gap-2" style={{ height: 110 }}>{mine.slice(0, 8).map(p => <div key={p.id} className="flex-1 flex flex-col items-center justify-end gap-1.5"><Mono style={{ fontSize: 10, color: C.faint }}>{p.likes}</Mono><div className="w-full rounded-t-md" style={{ height: Math.max(4, p.likes / maxLikes * 86), backgroundImage: GBRAND }} /></div>)}</div>
          </div>
        ) : <div className="p-5 text-center" style={card()}><div className="text-[14px]" style={{ color: C.muted }}>გამოაქვეყნე პოსტი, რომ აქ ნახო შენი სტატისტიკა 📊</div></div>}
      </div>
    </div>
  );
}

/* ─────────────────────────  SEARCH  ───────────────────────── */
function SearchView({ posts, onOpenProfile, onTag, onClose }) {
  const [q, setQ] = useState(""); const ql = q.trim().toLowerCase();
  const people = ql ? Object.values(USERS).filter(u => u.name.toLowerCase().includes(ql) || u.handle.toLowerCase().includes(ql)) : [];
  const tags = ql ? TRENDING.filter(t => t.tag.toLowerCase().includes(ql)) : TRENDING;
  const foundPosts = ql ? posts.filter(p => !p.hidden && p.text && p.text.toLowerCase().includes(ql)) : [];
  const suggested = Object.values(USERS).filter(u => u.id !== ME).slice(0, 4);
  const goTag = (t) => { onTag(t); onClose(); };
  const goUser = (id) => { onOpenProfile(id); onClose(); };
  return (
    <div className="fixed inset-0 z-[59] flex justify-center" style={{ background: C.paper }}>
      <div className="w-full max-w-[600px] flex flex-col" style={{ height: "100dvh", borderLeft: `1px solid ${C.line}`, borderRight: `1px solid ${C.line}` }}>
        <div className="flex items-center gap-2 px-3 py-2.5 shrink-0" style={{ background: C.surface, borderBottom: `1px solid ${C.line}` }}>
          <button onClick={onClose} className="active:scale-90" style={{ color: C.ink2 }}><ArrowLeft size={22} /></button>
          <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-full" style={{ background: C.surfaceMuted, border: `1px solid ${C.line}` }}><Search size={18} style={{ color: C.faint }} /><input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="ძებნა — ხალხი, ჰეშთეგი, პოსტი" className="flex-1 bg-transparent text-[15px] outline-none" style={{ color: C.ink }} />{q && <button onClick={() => setQ("")} style={{ color: C.faint }}><X size={18} /></button>}</div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {!ql && <div className="p-4"><div className="flex items-center gap-2 mb-3"><Star size={16} style={{ color: C.accent }} /><span className="text-[14px] font-bold" style={{ color: C.ink }}>შემოთავაზებული</span></div><div className="space-y-1">{suggested.map(u => <button key={u.id} onClick={() => goUser(u.id)} className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:opacity-80"><Avatar id={u.id} size={44} /><div className="flex-1 text-left min-w-0"><Name id={u.id} className="text-[15px]" /><Mono className="block truncate" style={{ fontSize: 12, color: C.faint }}>@{u.handle}</Mono></div></button>)}</div></div>}
          {ql && people.length > 0 && <div className="pt-2"><div className="px-4 py-1.5 text-[12px] font-bold uppercase" style={{ color: C.faint, fontFamily: MONO }}>ხალხი</div>{people.map(u => <button key={u.id} onClick={() => goUser(u.id)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:opacity-80"><div className="relative"><Avatar id={u.id} size={44} />{u.online && <span className="absolute bottom-0 right-0"><Dot size={11} /></span>}</div><div className="flex-1 text-left min-w-0"><Name id={u.id} className="text-[15px]" /><Mono className="block truncate" style={{ fontSize: 12, color: C.faint }}>@{u.handle}</Mono></div></button>)}</div>}
          {tags.length > 0 && <div className="pt-2"><div className="px-4 py-1.5 text-[12px] font-bold uppercase" style={{ color: C.faint, fontFamily: MONO }}>ჰეშთეგები</div>{tags.map(t => <button key={t.tag} onClick={() => goTag(t.tag)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:opacity-80"><div className="rounded-xl flex items-center justify-center" style={{ width: 44, height: 44, background: C.accentSoft }}><Hash size={20} style={{ color: C.accent }} /></div><div className="flex-1 text-left"><div className="font-bold text-[15px]" style={{ color: C.ink }}>#{t.tag}</div><Mono style={{ fontSize: 12, color: C.faint }}>{t.posts} პოსტი</Mono></div></button>)}</div>}
          {ql && foundPosts.length > 0 && <div className="pt-2 pb-6"><div className="px-4 py-1.5 text-[12px] font-bold uppercase" style={{ color: C.faint, fontFamily: MONO }}>პოსტები</div><div className="px-3 space-y-2">{foundPosts.map(p => <button key={p.id} onClick={() => goUser(p.authorId)} className="w-full p-3 flex gap-3 text-left" style={card()}><Avatar id={p.authorId} size={36} /><div className="min-w-0 flex-1"><Name id={p.authorId} className="text-[13px]" /><div className="text-[13px] line-clamp-2" style={{ color: C.ink2 }}>{p.text}</div></div>{p.image && <Pic src={p.image} round={10} style={{ width: 48, height: 48 }} className="shrink-0" />}</button>)}</div></div>}
          {ql && people.length === 0 && foundPosts.length === 0 && tags.length === 0 && <Empty icon={Search} t="ვერაფერი მოიძებნა" s={`„${q}"-ზე შედეგი არ არის.`} />}
        </div>
      </div>
    </div>
  );
}
