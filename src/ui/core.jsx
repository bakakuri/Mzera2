import { useState, useEffect, useRef } from "react";
import {
  Home, Search, Compass, PlusSquare, Send, Bell, User, Shield, Heart, MessageCircle, MessageSquare, Bookmark, MoreHorizontal, X, ArrowLeft, Hash, TrendingUp, Check, Trash2, Flag, Camera, Settings, AlertTriangle, Image as ImageIcon, MapPin, Map, Link2, ShieldCheck, Plus, Minus, Menu, LogOut, HelpCircle, ChevronRight, Zap, Sun, Moon, ShoppingBag, Tag, Star, Eye, Navigation, Users, Film, Mic, Play, Pause, Smile, FileText, Download, UserPlus, Trophy, Upload, Volume2, VolumeX, Pencil, CornerUpLeft, Copy, Reply, Phone, Video, PhoneOff, VideoOff, MicOff,
} from "lucide-react";
import { auth as authApi, profiles as profilesApi, posts as postsApi, reactions as reactionsApi, comments as commentsApi, follows as followsApi, chat as chatApi, notifications as notifsApi, storage as storageApi, stories as storiesApi, reels as reelsApi, market as marketApi, groups as groupsApi, events as eventsApi, forum as forumApi, highlights as highlightsApi, presence as presenceApi, locations as locationsApi, polls as pollsApi, quests as questsApi, xp as xpApi, admin as adminApi, push as pushApi } from "../lib/api";
import { hasSupabase } from "../lib/supabase";

export const PAL = {
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

export let DARK = false;

export let C = PAL.light;

export const GBRAND = "linear-gradient(125deg, #6750F2 0%, #6E63FF 46%, #00B4FF 100%)";

export const SH = {
  get card() { return DARK ? "0 2px 6px rgba(0,0,0,.5), 0 20px 44px -28px rgba(0,0,0,.85)" : "0 1px 2px rgba(17,19,26,.04), 0 14px 30px -22px rgba(17,19,26,.20)"; },
  get pop() { return DARK ? "0 20px 56px -14px rgba(0,0,0,.9)" : "0 12px 38px -10px rgba(17,19,26,.26)"; },
  glow: "0 8px 22px -6px rgba(103,80,242,.55)",
};

export const card = () => ({ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SH.card, borderRadius: 18 });

export const DISPLAY = "'Space Grotesk', 'Noto Sans Georgian', system-ui, sans-serif";

export const BODY = "'Noto Sans Georgian', 'Space Grotesk', system-ui, -apple-system, sans-serif";

export const MONO = "'JetBrains Mono', ui-monospace, 'SF Mono', monospace";

export const Mono = ({ children, style, className = "" }) => <span className={className} style={{ fontFamily: MONO, ...style }}>{children}</span>;


export const GRADS = [
  ["#6750F2", "#00B4FF"], ["#F2456A", "#FF8A5B"], ["#0EA5E9", "#22D3EE"],
  ["#10B981", "#34D399"], ["#F59E0B", "#FBBF24"], ["#8B5CF6", "#EC4899"],
  ["#6366F1", "#06B6D4"], ["#3B82F6", "#6366F1"], ["#14B8A6", "#06B6D4"],
];

export const hashIdx = (s, n) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973; return h % n; };

export const img = (seed, w = 640, h = 640) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
export async function compressImage(file, maxDim = 1280, quality = 0.72) {
  try {
    if (!file || !file.type || !file.type.startsWith("image/") || file.type === "image/gif") return file;
    const dataUrl = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
    const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = dataUrl; });
    const W = im.naturalWidth || im.width, H = im.naturalHeight || im.height;
    if (!W || !H) return file;
    if (W <= maxDim && H <= maxDim && file.size < 350 * 1024) return file;
    const scale = Math.min(1, maxDim / Math.max(W, H));
    const w = Math.round(W * scale), h = Math.round(H * scale);
    const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
    canvas.getContext("2d").drawImage(im, 0, 0, w, h);
    const blob = await new Promise(res => canvas.toBlob(res, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], (file.name || "image").replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch (e) { return file; }
}

export const catColor = (cat) => ({ "ტექ": C.accent, "დიზაინი": C.cyan, "კითხვა": C.star, "ბაზარი": C.online, "ცხოვრება": C.like }[cat] || C.accent);

/* ─────────────────────────  SEED DATA  ───────────────────────── */

export const FALLBACK_USER = { id: "", name: "მომხმარებელი", handle: "user", bio: "", followers: 0, following: 0, online: false, verified: false, admin: false, avatar: null, cover: null };

export const _users = {};

export const USERS = new Proxy(_users, { get: (t, k) => (typeof k !== "string" ? t[k] : (k in t ? t[k] : { ...FALLBACK_USER, id: k })) });

export let ME = "";










export const fmtN = (n) => (n || 0) >= 1000 ? ((n || 0) / 1000).toFixed(1).replace(/\.0$/, "") + "ათ" : "" + (n || 0);

export function computeTrends(posts, limit = 6) {
  const counts = {};
  (posts || []).forEach(p => { const m = (p.text || "").match(/#[\p{L}\p{N}_]+/gu); if (m) m.forEach(tag => { const t = tag.slice(1).toLowerCase(); if (t) counts[t] = (counts[t] || 0) + 1; }); });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([tag, n]) => ({ tag, posts: n }));
}

export const REPLIES = ["👍", "ჰო, ნახე 👀", "კარგი!", "მაგარია 🔥", "აა გასაგებია", "სუპერ 🙌", "😂😂", "ნახე და გეტყვი", "ok, მერე", "ზუსტად ✅"];



export const MARKET_CATS = ["ყველა", "ელექტრონიკა", "ავეჯი", "ტანსაცმელი", "ტრანსპორტი", "სახლი", "სხვა"];

export const FORUM_CATS = ["ყველა", "ტექ", "დიზაინი", "კითხვა", "ბაზარი", "ცხოვრება"];


/* ─────────────────────────  PRIMITIVES  ───────────────────────── */

export function Pic({ src, grad, style, className = "", round = 0 }) {
  const [on, setOn] = useState(false); const [err, setErr] = useState(false);
  return (
    <div className={"overflow-hidden " + className} style={{ borderRadius: round, background: grad ? `linear-gradient(135deg, ${grad[0]}, ${grad[1]})` : C.surfaceMuted, ...style }}>
      <img src={src} alt="" onLoad={() => setOn(true)} onError={() => setErr(true)} className="w-full h-full object-cover" style={{ opacity: err ? 0 : on ? 1 : 0, transition: "opacity .55s ease" }} />
    </div>
  );
}

export function Avatar({ id, size = 40, ring = false, story = false, seen = false, closeFriends = false }) {
  const u = USERS[id]; const [a, b] = GRADS[hashIdx(id, GRADS.length)];
  const inner = u.avatar
    ? <img src={u.avatar} alt="" style={{ width: size, height: size, objectFit: "cover" }} className="rounded-full select-none shrink-0" draggable={false} />
    : <div style={{ width: size, height: size, background: `linear-gradient(140deg, ${a}, ${b})`, color: "#fff", fontWeight: 700, fontSize: size * 0.4, fontFamily: DISPLAY }} className="rounded-full flex items-center justify-center select-none shrink-0">{(u.name || "?").trim()[0] || "?"}</div>;
  if (!ring) return inner;
  return <div className="rounded-full p-[2.5px] shrink-0" style={{ background: story ? (seen ? C.line : (closeFriends ? "linear-gradient(135deg,#1f8f4e,#3ddc7f)" : "conic-gradient(from 210deg, #6750F2, #00B4FF, #E85FB0, #6750F2)")) : "transparent" }}><div className="rounded-full p-[2px]" style={{ background: C.surface }}>{inner}</div></div>;
}

export const Dot = ({ size = 11 }) => <span className="rounded-full" style={{ width: size, height: size, background: C.online, boxShadow: `0 0 0 2px ${C.surface}, 0 0 8px ${C.online}` }} />;

export const Name = ({ id, className = "" }) => { const u = USERS[id]; return <span className={"inline-flex items-center gap-1 " + className}><span style={{ color: C.ink }} className="font-bold truncate">{u.name}</span>{u.verified && <ShieldCheck size={14} style={{ color: C.accent }} className="shrink-0" />}</span>; };

export const Handle = ({ h, t, className = "" }) => <Mono className={className} style={{ color: C.faint, fontSize: "0.82em", letterSpacing: "-0.02em" }}>@{h}{t ? " · " + t : ""}</Mono>;

export function IconBtn({ children, onClick, active, badge }) {
  return <button onClick={onClick} className="relative rounded-full transition active:scale-90 hover:opacity-60" style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: active ? C.accent : C.ink2 }}>{children}{badge > 0 && <span className="absolute top-0 right-0 rounded-full flex items-center justify-center" style={{ minWidth: 17, height: 17, padding: "0 4px", background: C.like, color: "#fff", border: `2px solid ${C.surface}`, fontFamily: MONO, fontSize: 10, fontWeight: 700 }}>{badge > 9 ? "9+" : badge}</span>}</button>;
}

export const Pill = ({ children, onClick, tone = "soft" }) => <button onClick={onClick} className="px-4 py-1.5 rounded-full text-sm font-bold transition active:scale-95 hover:opacity-90" style={tone === "solid" ? { backgroundImage: GBRAND, color: "#fff", boxShadow: SH.glow } : { background: C.accentSoft, color: C.accentText }}>{children}</button>;

export const Wordmark = ({ size = 22 }) => <span style={{ fontFamily: DISPLAY, fontSize: size, fontWeight: 700, letterSpacing: "-0.04em", backgroundImage: GBRAND, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent" }}>mzera.</span>;

export const Title = ({ children }) => <h1 className="text-[26px]" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "-0.025em" }}>{children}</h1>;

export const Chips = ({ items, value, onChange }) => (
  <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-3">
    {items.map(c => <button key={c} onClick={() => onChange(c)} className="px-3.5 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition active:scale-95" style={value === c ? { backgroundImage: GBRAND, color: "#fff" } : { background: C.surface, color: C.muted, border: `1px solid ${C.line}` }}>{c}</button>)}
  </div>
);

export function renderText(text, onTag, onMention) {
  return text.split("\n").map((line, li) => <span key={li}>{line.split(/(#[^\s#@]+|@[A-Za-z0-9_]+)/g).map((part, i) => {
    if (part.startsWith("#")) return <span key={i} onClick={(e) => { e.stopPropagation(); onTag && onTag(part.slice(1)); }} className="cursor-pointer font-semibold" style={{ color: C.accent }}>{part}</span>;
    if (part.startsWith("@") && part.length > 1) return <span key={i} onClick={(e) => { e.stopPropagation(); onMention && onMention(part.slice(1)); }} className={onMention ? "cursor-pointer font-semibold" : "font-semibold"} style={{ color: C.accent }}>{part}</span>;
    return <span key={i}>{part}</span>;
  })}{li < text.split("\n").length - 1 && <br />}</span>);
}

export const Empty = ({ icon: I, t, s }) => <div className="flex flex-col items-center justify-center text-center py-16 px-6"><div className="rounded-2xl flex items-center justify-center mb-3.5" style={{ width: 62, height: 62, background: C.accentSoft }}><I size={26} style={{ color: C.accent }} /></div><div className="text-[16px]" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700 }}>{t}</div>{s && <div className="text-[14px] mt-1 max-w-[240px]" style={{ color: C.muted }}>{s}</div>}</div>;

export const ThemeToggle = ({ mode, setMode, full }) => full ? (
  <div className="flex gap-1 p-1 rounded-2xl" style={{ background: C.surfaceMuted }}>
    {[["light", "ღია", Sun], ["dark", "მუქი", Moon]].map(([m, l, Ic]) => <button key={m} onClick={() => setMode(m)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold transition" style={mode === m ? { background: C.surface, color: C.accent, boxShadow: SH.card } : { color: C.muted }}><Ic size={16} />{l}</button>)}
  </div>
) : <button onClick={() => setMode(mode === "dark" ? "light" : "dark")} className="rounded-full active:scale-90 flex items-center justify-center transition" style={{ width: 40, height: 40, color: C.ink2 }}>{mode === "dark" ? <Sun size={22} /> : <Moon size={22} />}</button>;

/* ─────────────────────────  POST CARD  ───────────────────────── */

export const REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "😡"];

export function StoryRow({ stories, onOpen, onAdd }) {
  return (
    <div className="flex gap-4 overflow-x-auto px-4 py-4 no-scrollbar">
      <button onClick={onAdd} className="flex flex-col items-center gap-1.5 shrink-0"><div className="relative"><Avatar id={ME} size={62} /><span className="absolute -bottom-0.5 -right-0.5 rounded-full flex items-center justify-center" style={{ width: 22, height: 22, backgroundImage: GBRAND, border: `2.5px solid ${C.surface}` }}><Plus size={13} color="#fff" /></span></div><span className="text-[12px]" style={{ color: C.muted }}>შენი story</span></button>
      {stories.map(s => <button key={s.id} onClick={() => onOpen(s.id)} className="flex flex-col items-center gap-1.5 shrink-0"><Avatar id={s.authorId} size={62} ring story seen={s.seen} closeFriends={s.closeFriends} /><span className="text-[12px] max-w-[68px] truncate" style={{ color: s.seen ? C.faint : C.ink2 }}>{USERS[s.authorId].name.split(" ")[0]}</span></button>)}
    </div>
  );
}

export const MiniPost = ({ post, onOpenProfile }) => <div className="p-3.5 flex gap-3" style={card()}><button onClick={() => onOpenProfile(post.authorId)}><Avatar id={post.authorId} size={38} /></button><div className="min-w-0 flex-1"><Name id={post.authorId} className="text-sm" /><div className="text-[14px] mt-0.5 line-clamp-2" style={{ color: C.ink2 }}>{post.text}</div><div className="mt-1.5 flex gap-3"><Mono style={{ color: C.faint, fontSize: 12 }}>♥ {post.likes}</Mono><Mono style={{ color: C.faint, fontSize: 12 }}>{post.comments.length} 💬</Mono></div></div>{post.image && <Pic src={post.image} round={12} className="w-14 h-14 shrink-0" />}</div>;

/* ─────────────────────────  FORUM  ───────────────────────── */

export function NewThread({ onClose, onCreate, initial }) {
  const [title, setTitle] = useState(initial ? initial.title : ""); const [body, setBody] = useState(initial ? initial.body : ""); const [cat, setCat] = useState(initial ? initial.cat : "ტექ");
  return (
    <div className="fixed inset-0 z-[60] flex sm:items-center justify-center items-end" style={{ background: "rgba(6,7,12,.55)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full sm:max-w-[520px] sm:rounded-3xl rounded-t-3xl" style={{ background: C.surface, boxShadow: SH.pop }}>
        <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: `1px solid ${C.lineSoft}` }}><button onClick={onClose} style={{ color: C.muted }}><X size={22} /></button><span className="font-bold" style={{ color: C.ink, fontFamily: DISPLAY }}>{initial ? "თემის რედაქტირება" : "ახალი თემა"}</span><button disabled={!title.trim()} onClick={() => onCreate({ title: title.trim(), body: body.trim(), cat })} className="px-4 py-1.5 rounded-full text-sm font-bold" style={{ backgroundImage: GBRAND, color: "#fff", opacity: title.trim() ? 1 : 0.4 }}>{initial ? "შენახვა" : "გამოქვეყნება"}</button></div>
        <div className="p-4 space-y-3" style={{ paddingBottom: "calc(var(--mz-nav, 64px) + 1.25rem)" }}>
          <div className="flex gap-1.5 flex-wrap">{FORUM_CATS.slice(1).map(c => <button key={c} onClick={() => setCat(c)} className="px-3 py-1.5 rounded-full text-sm font-semibold transition" style={cat === c ? { background: catColor(c) + "1f", color: catColor(c) } : { background: C.surfaceMuted, color: C.muted }}>{c}</button>)}</div>
          <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="სათაური…" className="w-full bg-transparent outline-none text-[18px] font-bold" style={{ color: C.ink, fontFamily: DISPLAY }} />
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={4} placeholder="დაწერე დეტალურად…" className="w-full resize-none bg-transparent outline-none text-[15px]" style={{ color: C.ink2, lineHeight: 1.55 }} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────  MARKETPLACE  ───────────────────────── */

export const Stars = ({ n, size = 14 }) => <div className="flex items-center gap-0.5">{[1, 2, 3, 4, 5].map(i => <Star key={i} size={size} style={{ color: C.star }} fill={i <= n ? C.star : "none"} />)}</div>;


export function Checkout({ item, onClose, onDone, onPlace }) {
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


export function NewListing({ onClose, onCreate, live, onUpload, initial }) {
  const [title, setTitle] = useState(initial ? initial.title : ""); const [price, setPrice] = useState(initial ? String(initial.price) : ""); const [desc, setDesc] = useState(initial ? (initial.desc || "") : ""); const [cat, setCat] = useState(initial ? initial.cat : "ელექტრონიკა");
  const [picked, setPicked] = useState(initial && initial.image ? initial.image : ""); const [pickedVideo, setPickedVideo] = useState(initial && initial.video ? initial.video : null);
  const fileRef = useRef(null); const [uploading, setUploading] = useState(false);
  const [vph, setVph] = useState(null);
  useEffect(() => { const vv = window.visualViewport; if (!vv) return; const onR = () => setVph(vv.height); onR(); vv.addEventListener("resize", onR); vv.addEventListener("scroll", onR); return () => { vv.removeEventListener("resize", onR); vv.removeEventListener("scroll", onR); }; }, []);
  const pickFile = async (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; const isVid = f.type.startsWith("video"); setUploading(true); try { const url = await onUpload(f); if (isVid) setPickedVideo(url); else setPicked(url); } catch (err) {} setUploading(false); e.target.value = ""; };
  const ok = title.trim() && price;
  return (
    <div className="fixed inset-0 z-[60] flex sm:items-center justify-center items-end" style={{ background: "rgba(6,7,12,.55)", backdropFilter: "blur(4px)", height: vph ? vph + "px" : "100dvh" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full sm:max-w-[520px] sm:rounded-3xl rounded-t-3xl overflow-y-auto" style={{ background: C.surface, boxShadow: SH.pop, maxHeight: vph ? vph + "px" : "88vh" }}>
        <div className="flex items-center justify-between px-4 py-3.5 sticky top-0" style={{ background: C.surface, borderBottom: `1px solid ${C.lineSoft}` }}><button onClick={onClose} style={{ color: C.muted }}><X size={22} /></button><span className="font-bold" style={{ color: C.ink, fontFamily: DISPLAY }}>{initial ? "ნივთის რედაქტირება" : "გაყიდე ნივთი"}</span><button disabled={!ok} onClick={() => onCreate({ title: title.trim(), price: Number(price), desc: desc.trim(), cat, image: picked && picked.startsWith("http") ? picked : "", video: pickedVideo })} className="px-4 py-1.5 rounded-full text-sm font-bold" style={{ backgroundImage: GBRAND, color: "#fff", opacity: ok ? 1 : 0.4 }}>{initial ? "შენახვა" : "გამოქვეყნება"}</button></div>
        <div className="p-4 space-y-3.5" style={{ paddingBottom: "calc(var(--mz-nav, 64px) + 1.25rem)" }}>
          <div className="flex gap-2 items-center flex-wrap">
            <input ref={fileRef} type="file" accept="image/*,video/*" hidden onChange={pickFile} />
            <button onClick={() => fileRef.current && fileRef.current.click()} disabled={uploading} className="rounded-xl flex flex-col items-center justify-center shrink-0 active:scale-95" style={{ width: 72, height: 72, background: C.accentSoft, color: C.accentText }}>{uploading ? <span className="text-[10px] font-bold">…</span> : <><Upload size={20} /><span className="text-[10px] font-bold mt-0.5">ფოტო/ვიდეო</span></>}</button>
            {picked && picked.startsWith("http") && <div className="rounded-xl overflow-hidden shrink-0 relative" style={{ width: 72, height: 72, outline: `2.5px solid ${C.accent}`, outlineOffset: 2 }}><Pic src={picked} className="w-full h-full" /><button onClick={() => setPicked("")} className="absolute -top-1 -right-1 rounded-full flex items-center justify-center" style={{ width: 18, height: 18, background: C.ink, color: "#fff" }}><X size={11} /></button></div>}
            {pickedVideo && <div className="rounded-xl overflow-hidden shrink-0 relative" style={{ width: 72, height: 72, outline: `2.5px solid ${C.accent}`, outlineOffset: 2 }}><video src={pickedVideo} muted playsInline className="w-full h-full" style={{ objectFit: "cover" }} /><div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,.25)" }}><Play size={18} color="#fff" fill="#fff" /></div><button onClick={() => setPickedVideo(null)} className="absolute -top-1 -right-1 rounded-full flex items-center justify-center" style={{ width: 18, height: 18, background: C.ink, color: "#fff" }}><X size={11} /></button></div>}
            {!picked && !pickedVideo && <span className="text-[12px]" style={{ color: C.faint }}>დაამატე ფოტო ან ვიდეო 📷</span>}
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

export function GroupAvatar({ ids, size = 52 }) {
  const s = Math.round(size * 0.64);
  return <div className="relative shrink-0" style={{ width: size, height: size }}><div className="absolute top-0 left-0"><Avatar id={ids[0]} size={s} /></div><div className="absolute bottom-0 right-0 rounded-full p-[2px]" style={{ background: C.surface }}><Avatar id={ids[1] || ids[0]} size={s} /></div></div>;
}

export function waveOf(id) {
  const s = String(id || "x"); let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const out = [];
  for (let i = 0; i < 24; i++) { h = (h * 1103515245 + 12345) >>> 0; out.push(5 + (h % 21)); }
  return out;
}

export function dl(name, text) {
  try {
    const blob = new Blob([text || ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = name || "file.txt"; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  } catch (e) {}
}

export function VoiceMsg({ id, dur, mine, url }) {
  const [playing, setPlaying] = useState(false); const [prog, setProg] = useState(0); const wave = waveOf(id);
  const audioRef = useRef(null);
  useEffect(() => { if (url || !playing) return; const step = 100 / (dur * 10); const t = setInterval(() => setProg(p => { if (p >= 100) { clearInterval(t); setPlaying(false); return 0; } return p + step; }), 100); return () => clearInterval(t); }, [playing, url]);
  const toggle = () => { if (url) { const a = audioRef.current; if (!a) return; if (a.paused) a.play().catch(() => {}); else a.pause(); } else { setPlaying(p => !p); } };
  const col = mine ? "#fff" : C.accent; const sub = mine ? "rgba(255,255,255,.45)" : C.line;
  return (
    <div className="flex items-center gap-2.5" style={{ minWidth: 168 }}>
      {url && <audio ref={audioRef} src={url} preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); setProg(0); }} onTimeUpdate={(e) => { const a = e.target; if (a.duration && isFinite(a.duration)) setProg((a.currentTime / a.duration) * 100); }} />}
      <button onClick={toggle} className="rounded-full flex items-center justify-center shrink-0 active:scale-90" style={{ width: 34, height: 34, background: mine ? "rgba(255,255,255,.22)" : C.accentSoft, color: mine ? "#fff" : C.accent }}>{playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}</button>
      <div className="flex items-center gap-[2px] flex-1" style={{ height: 26 }}>{wave.map((h, i) => <div key={i} className="rounded-full" style={{ width: 3, height: h, background: (i / wave.length) * 100 <= prog ? col : sub }} />)}</div>
      <Mono style={{ fontSize: 11, color: mine ? "rgba(255,255,255,.8)" : C.faint }}>{Math.floor(dur / 60)}:{String(dur % 60).padStart(2, "0")}</Mono>
    </div>
  );
}

export function DocMsg({ doc, mine }) {
  const colors = { pdf: "#F2456A", xls: "#16C784", doc: "#3B82F6" }; const cc = colors[doc.kind] || C.accent;
  return (
    <button onClick={() => doc.url ? window.open(doc.url, "_blank") : dl(doc.name, "mzera document — " + doc.name)} className="flex items-center gap-3 active:scale-[.98]" style={{ minWidth: 210 }}>
      <div className="rounded-xl flex items-center justify-center shrink-0" style={{ width: 40, height: 40, background: mine ? "rgba(255,255,255,.2)" : cc + "22" }}><FileText size={20} color={mine ? "#fff" : cc} /></div>
      <div className="flex-1 min-w-0 text-left"><div className="text-[13px] font-bold truncate" style={{ color: mine ? "#fff" : C.ink }}>{doc.name}</div><div className="text-[11px]" style={{ color: mine ? "rgba(255,255,255,.7)" : C.faint }}>{doc.size}</div></div>
      <Download size={18} style={{ color: mine ? "#fff" : C.accent }} />
    </button>
  );
}

export const EMOJIS = ["😀","😁","😂","🤣","😊","😍","😘","😎","🤔","😐","😴","😭","😡","👍","👎","👏","🙏","💪","🔥","❤️","🧡","💛","💚","💙","💜","🖤","💯","✨","🎉","🎊","😱","😅","😉","😋","😜","🤩","🥳","😇","🤗","🤫","😬","🙄","😏","😒","😔","🥺","😤","💀","👀","👋","🤝","✌️","🤞","👌","🙌","🤷","💃","🕺","🌹","⭐","🌟","💫","☀️","🌈","⚡","💥","🎵","🎶","☕","🍕","🍔","🎂","🍻","🚗","✈️","⚽","🏀","🎮","📱","💻","💰","🎁","🐶","🐱"];

export function EmojiPanel({ onPick }) {
  return <div className="grid grid-cols-8 gap-0.5 p-2 overflow-y-auto no-scrollbar" style={{ maxHeight: 190, background: C.surfaceMuted, borderTop: `1px solid ${C.line}` }}>{EMOJIS.map((e, i) => <button key={i} onClick={() => onPick(e)} className="rounded-lg active:scale-90 transition" style={{ fontSize: 23, padding: 3 }}>{e}</button>)}</div>;
}

export function PeoplePicker({ title, cta, exclude = [], onClose, onConfirm, live }) {
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
    <div className="fixed inset-0 z-[60] flex sm:items-center justify-center items-end" style={{ background: "rgba(6,7,12,.55)", backdropFilter: "blur(4px)", paddingBottom: "var(--mz-nav, 64px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full sm:max-w-[480px] sm:rounded-3xl rounded-t-3xl flex flex-col" style={{ background: C.surface, boxShadow: SH.pop, maxHeight: "calc(100dvh - var(--mz-nav, 64px) - 14px)" }}>
        <div className="flex items-center justify-between px-4 py-3.5 shrink-0" style={{ borderBottom: `1px solid ${C.lineSoft}` }}><button onClick={onClose} style={{ color: C.muted }}><X size={22} /></button><span className="font-bold" style={{ color: C.ink, fontFamily: DISPLAY }}>{title}</span><button disabled={!sel.length} onClick={() => onConfirm(sel)} className="px-4 py-1.5 rounded-full text-sm font-bold" style={{ backgroundImage: GBRAND, color: "#fff", opacity: sel.length ? 1 : 0.4 }}>{cta}{sel.length ? ` (${sel.length})` : ""}</button></div>
        <div className="px-3 py-2.5 shrink-0" style={{ borderBottom: `1px solid ${C.lineSoft}` }}><div className="flex items-center gap-2 px-3 py-2 rounded-full" style={{ background: C.surfaceMuted }}><Search size={16} style={{ color: C.faint }} /><input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="მოძებნე ხალხი…" className="flex-1 bg-transparent text-[14px] outline-none" style={{ color: C.ink }} />{searching && <Mono style={{ fontSize: 11, color: C.faint }}>…</Mono>}</div></div>
        {sel.length > 0 && <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-3 shrink-0" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>{sel.map(id => <div key={id} className="flex flex-col items-center gap-1 shrink-0"><div className="relative"><Avatar id={id} size={44} /><button onClick={() => toggle(id)} className="absolute -top-1 -right-1 rounded-full flex items-center justify-center" style={{ width: 18, height: 18, background: C.ink, color: "#fff" }}><X size={11} /></button></div><span className="text-[11px]" style={{ color: C.muted }}>{USERS[id].name.split(" ")[0]}</span></div>)}</div>}
        <div className="overflow-y-auto p-2 flex-1" style={{ minHeight: 0 }}>{avail.map(u => { const on = sel.includes(u.id); return (
          <button key={u.id} onClick={() => toggle(u.id)} className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl transition" style={{ background: on ? C.accentSoft : "transparent" }}>
            <div className="relative"><Avatar id={u.id} size={44} />{u.online && <span className="absolute bottom-0 right-0"><Dot size={11} /></span>}</div>
            <div className="flex-1 text-left min-w-0"><Name id={u.id} className="text-[15px]" /><Mono className="block truncate" style={{ fontSize: 12, color: C.faint }}>@{u.handle}</Mono></div>
            <div className="rounded-full flex items-center justify-center shrink-0" style={{ width: 24, height: 24, border: on ? "none" : `2px solid ${C.line}`, backgroundImage: on ? GBRAND : "none" }}>{on && <Check size={15} color="#fff" />}</div>
          </button>
        ); })}{avail.length === 0 && <div className="text-center py-10 text-[13px]" style={{ color: C.faint }}>{q.trim() ? "ვერ მოიძებნა" : "—"}</div>}</div>
        {sel.length > 0 && <div className="p-3 shrink-0" style={{ borderTop: `1px solid ${C.lineSoft}`, paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}><button onClick={() => onConfirm(sel)} className="w-full py-3.5 rounded-2xl font-bold text-[15px] active:scale-95 flex items-center justify-center gap-2" style={{ backgroundImage: GBRAND, color: "#fff", boxShadow: SH.glow }}><Send size={18} /> {cta}{sel.length > 1 ? ` (${sel.length})` : ""}</button></div>}
      </div>
    </div>
  );
}


export function convMembers(cv) { return (cv && Array.isArray(cv.members)) ? cv.members : []; }

export function convIsGroup(cv) { return !!(cv && (cv.isGroup || (Array.isArray(cv.members) && cv.members.length > 1))); }

export function msgPreview(m) {
  if (!m) return "—";
  if (m.type === "image") return "📷 ფოტო";
  if (m.type === "voice") return "🎤 ხმოვანი";
  if (m.type === "doc") return "📄 " + ((m.doc && m.doc.name) ? m.doc.name : "ფაილი");
  if (m.type === "location") return "📍 ლოკაცია";
  return m.text || "—";
}

export function FollowBtn({ id, isFollowing, onToggle }) {
  const on = isFollowing(id);
  return <button onClick={(e) => { e.stopPropagation(); onToggle(id); }} className="px-4 py-1.5 rounded-full text-sm font-bold transition active:scale-95 shrink-0" style={on ? { background: C.surfaceMuted, color: C.ink2, border: `1px solid ${C.line}` } : { backgroundImage: GBRAND, color: "#fff", boxShadow: SH.glow }}>{on ? "მიჰყვები" : "მიყევი"}</button>;
}


export function FollowList({ view, following, onToggleFollow, onOpenProfile, onClose }) {
  const [type, setType] = useState(view.type);
  const [ids, setIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const u = USERS[view.userId];
  useEffect(() => {
    let cancel = false; setLoading(true);
    (async () => {
      try {
        const rows = type === "following" ? await followsApi.following(view.userId) : await followsApi.followers(view.userId);
        rows.forEach(mergeProfile);
        if (!cancel) setIds(rows.map(r => r.id));
      } catch (e) { if (!cancel) setIds([]); }
      if (!cancel) setLoading(false);
    })();
    return () => { cancel = true; };
  }, [type, view.userId]);
  return (
    <div className="fixed inset-0 z-[58] flex justify-center" style={{ background: C.paper }}>
      <div className="w-full max-w-[600px] flex flex-col" style={{ height: "100dvh", borderLeft: `1px solid ${C.line}`, borderRight: `1px solid ${C.line}` }}>
        <div className="flex items-center gap-3 px-3 py-3 shrink-0" style={{ background: C.surface, borderBottom: `1px solid ${C.line}` }}>
          <button onClick={onClose} className="active:scale-90" style={{ color: C.ink2 }}><ArrowLeft size={22} /></button>
          <Mono className="font-bold text-[15px]" style={{ color: C.ink }}>@{u.handle}</Mono>
        </div>
        <div className="flex shrink-0" style={{ background: C.surface, borderBottom: `1px solid ${C.line}` }}>{[["followers", "მიმდევრები"], ["following", "მიჰყვება"]].map(([k, l]) => <button key={k} onClick={() => setType(k)} className="flex-1 py-3 text-sm font-bold transition" style={{ color: type === k ? C.accent : C.faint, borderBottom: type === k ? `2px solid ${C.accent}` : "2px solid transparent" }}>{l}</button>)}</div>
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? <div className="flex justify-center py-16"><div className="rounded-full" style={{ width: 30, height: 30, border: `3px solid ${C.accentSoft}`, borderTopColor: C.accent, animation: "spin 0.8s linear infinite" }} /></div> : ids.length === 0 ? <Empty icon={Users} t="ცარიელია" s="ჯერ არავინ." /> : ids.map(id => (
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

export function timeAgo(ts) {
  const d = (Date.now() - new Date(ts).getTime()) / 1000;
  if (d < 60) return "ახლა";
  if (d < 3600) return Math.floor(d / 60) + "წთ";
  if (d < 86400) return Math.floor(d / 3600) + "სთ";
  return Math.floor(d / 86400) + "დღ";
}

export function mergeProfile(p) {
  if (!p || !p.id) return;
  const prev = (USERS[p.id] && USERS[p.id].id === p.id) ? USERS[p.id] : null;
  USERS[p.id] = {
    id: p.id,
    name: p.name || p.username || (prev && prev.name) || "user",
    handle: p.username || (prev && prev.handle) || "user",
    bio: p.bio != null ? p.bio : (prev ? prev.bio : ""),
    followers: p.follower_count ?? p.followers ?? (prev ? prev.followers : 0),
    following: p.following_count ?? p.following ?? (prev ? prev.following : 0),
    xp: p.xp ?? (prev ? prev.xp : 0),
    location: p.location != null ? p.location : (prev ? prev.location : ""),
    website: p.website != null ? p.website : (prev ? prev.website : ""),
    online: true,
    verified: p.verified != null ? !!p.verified : (prev ? prev.verified : false),
    admin: p.is_admin != null ? !!p.is_admin : (prev ? prev.admin : false),
    avatar: p.avatar_url !== undefined ? (p.avatar_url || null) : (prev ? prev.avatar : null),
    cover: p.cover_url !== undefined ? (p.cover_url || null) : (prev ? prev.cover : null),
    birthday: p.birthday !== undefined ? (p.birthday || null) : (prev ? prev.birthday : null),
  };
}

export function mapDbPost(row) {
  if (row.author) mergeProfile(row.author);
  if (row.shared && row.shared.author) mergeProfile(row.shared.author);
  const likes = Array.isArray(row.reactions) ? (row.reactions[0]?.count ?? 0) : 0;
  let poll = null;
  if (row.has_poll && Array.isArray(row.poll_options) && row.poll_options.length) {
    const votes = Array.isArray(row.poll_votes) ? row.poll_votes : [];
    const options = row.poll_options.slice().sort((a, b) => a.idx - b.idx).map(o => ({ text: o.text, votes: votes.filter(v => v.option_idx === o.idx).length }));
    const mine = votes.find(v => v.user_id === ME);
    poll = { options, voted: mine ? mine.option_idx : null };
  }
  return {
    id: row.id, authorId: row.author_id, time: timeAgo(row.created_at), createdAt: row.created_at,
    text: row.text || "", image: row.image_url || (Array.isArray(row.images) && row.images[0]) || null, images: (Array.isArray(row.images) && row.images.length) ? row.images : (row.image_url ? [row.image_url] : []), likes,
    comments: [], shares: 0, likedByMe: false, savedByMe: false, reaction: null, poll, hidden: !!row.hidden, publicStatus: row.public_status || "none", edited: !!row.edited, bg: row.bg || null, feeling: row.feeling || null, location: row.location || null, tagged: Array.isArray(row.tagged) ? row.tagged : [], video: row.video_url || null,
    shared: row.shared ? { id: row.shared.id, authorId: row.shared.author_id, text: row.shared.text || "", image: row.shared.image_url || (Array.isArray(row.shared.images) && row.shared.images[0]) || null, images: (Array.isArray(row.shared.images) && row.shared.images.length) ? row.shared.images : (row.shared.image_url ? [row.shared.image_url] : []), time: timeAgo(row.shared.created_at) } : null,
  };
}

export function msgClock(ts) { try { return new Date(ts).toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } }

export function mapDbMsg(row) {
  const mine = row.sender_id === ME;
  const m = { id: row.id, fromMe: mine, time: msgClock(row.created_at), type: row.type, _ts: row.created_at, replyTo: row.reply_to || null, edited: !!row.edited };
  if (!mine) m.from = row.sender_id;
  if (row.type === "image") m.image = row.media_url;
  else if (row.type === "voice") { m.dur = row.voice_dur; m.audioUrl = row.media_url || null; }
  else if (row.type === "doc") m.doc = { name: row.doc_name, size: row.doc_size, url: row.media_url || null };
  else if (row.type === "location") { m.place = row.place; m.mapUrl = row.media_url || null; }
  else m.text = row.text;
  return m;
}

export function toDbMsg(p) {
  const o = { type: p.type };
  if (p.type === "image") o.media_url = p.image;
  else if (p.type === "voice") { o.voice_dur = p.dur; if (p.audioUrl) o.media_url = p.audioUrl; }
  else if (p.type === "doc") { o.doc_name = p.doc.name; o.doc_size = p.doc.size; if (p.doc.url) o.media_url = p.doc.url; }
  else if (p.type === "location") { o.place = p.place; if (p.mapUrl) o.media_url = p.mapUrl; }
  else o.text = p.text;
  if (p.reply_to) o.reply_to = p.reply_to;
  return o;
}

export function mapDbNotif(row) {
  if (row.from) mergeProfile(row.from);
  return { id: row.id, type: row.type, fromId: row.from_id, text: row.text || undefined, time: timeAgo(row.created_at), read: !!row.read, postId: row.post_id || undefined, postImage: (row.post && row.post.image_url) ? row.post.image_url : undefined, postText: (row.post && row.post.text) ? row.post.text : undefined };
}

export const resolveImg = (x) => !x ? null : (typeof x === "string" && x.startsWith("http") ? x : img(x));

export async function hydrateAuthors(rows, idField, attachField) {
  const ids = [...new Set(rows.map(r => r[idField]).filter(Boolean))];
  if (ids.length) { try { const profs = await profilesApi.byIds(ids); const pm = {}; profs.forEach(p => { pm[p.id] = p; }); rows.forEach(r => { r[attachField] = pm[r[idField]]; }); } catch (e) {} }
  return rows;
}

export function mapDbStories(rows) {  const by = {};
  rows.forEach(r => { if (r.author) mergeProfile(r.author); (by[r.author_id] = by[r.author_id] || []).push({ id: r.id, image: r.image_url, filter: r.filter || "none", text: r.text || "", stickers: r.stickers || [], closeFriends: !!r.close_friends }); });
  return Object.entries(by).map(([aid, items]) => ({ id: "s" + aid, authorId: aid, seen: false, items, closeFriends: items.some(it => it.closeFriends) }));
}

export function mapDbReel(row, likedSet, savedSet) {
  if (row.author) mergeProfile(row.author);
  const likes = Array.isArray(row.reel_likes) ? (row.reel_likes[0]?.count ?? 0) : 0;
  const comments = Array.isArray(row.reel_comments) ? (row.reel_comments[0]?.count ?? 0) : 0;
  return { id: row.id, authorId: row.author_id, image: row.thumb_url || row.video_url || img("reel" + row.id, 480, 854), video: row.video_url || null, caption: row.caption || "", audio: row.audio || "original audio", likes, comments, shares: 0, views: row.views || 0, likedByMe: likedSet ? likedSet.has(row.id) : false, savedByMe: savedSet ? savedSet.has(row.id) : false, createdAt: row.created_at };
}

export function mapDbThread(row, uid) {
  if (row.author) mergeProfile(row.author);
  const votes = (row.thread_votes || []);
  const replies = (row.thread_replies || []).slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map(r => { if (r.author) mergeProfile(r.author); return { id: r.id, authorId: r.author_id, text: r.text, time: timeAgo(r.created_at), likes: 0 }; });
  return { id: row.id, authorId: row.author_id, cat: row.category || "სხვა", title: row.title, body: row.body || "", votes: votes.length, views: "0", time: timeAgo(row.created_at), likedByMe: votes.some(v => v.user_id === uid), replies };
}

export const KA_MONS = ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"];

export function mapDbListing(row) {
  if (row.seller) mergeProfile(row.seller);
  return { id: row.id, sellerId: row.seller_id, cat: row.category || "სხვა", title: row.title, price: Number(row.price), desc: row.description || "", image: row.image_url || img("sell" + row.id), video: row.video_url || null, location: row.location || "თბილისი", time: timeAgo(row.created_at), createdAt: row.created_at, savedByMe: false };
}

export function mapDbReview(r) { if (r.author) mergeProfile(r.author); return { id: r.id, authorId: r.author_id, rating: r.rating, text: r.text || "", time: timeAgo(r.created_at) }; }

export function mapDbGroup(row, uid) {
  const mem = row.group_members || [];
  const posts = (row.group_posts || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(p => { if (p.author) mergeProfile(p.author); return { id: p.id, authorId: p.author_id, time: timeAgo(p.created_at), text: p.text || "", image: p.image_url || undefined, likes: 0, cc: 0 }; });
  return { id: row.id, name: row.name, cover: row.cover_url || img("grp" + row.id, 600, 300), cat: row.category || "", members: mem.length, joined: mem.some(m => m.user_id === uid), about: row.about || "", posts, createdBy: row.created_by };
}

export function mapDbEvent(row, uid) {
  if (row.host) mergeProfile(row.host);
  const rs = row.event_rsvps || [];
  const mine = rs.find(r => r.user_id === uid);
  const d = row.starts_at ? new Date(row.starts_at) : null;
  return { id: row.id, title: row.title, cover: row.cover_url || img("ev" + row.id, 600, 300), day: d ? String(d.getDate()).padStart(2, "0") : "—", mon: d ? KA_MONS[d.getMonth()] : "", time: d ? d.toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit" }) : "", location: row.location || "", going: rs.filter(r => r.status === "going").length, rsvp: mine ? mine.status : null, hostId: row.host_id, about: row.about || "" };
}


export function ConfigError() {
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

export const LoadingScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: C.paper, fontFamily: BODY }}>
    <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    <Wordmark size={34} />
    <div style={{ width: 34, height: 34, borderRadius: "50%", border: `3px solid ${C.line}`, borderTopColor: C.accent, animation: "spin .8s linear infinite" }} />
  </div>
);


export function AuthScreen() {
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

export function HighlightCreate({ onClose, onCreated, flash }) {
  const [title, setTitle] = useState(""); const [cover, setCover] = useState(null); const [coverUrl, setCoverUrl] = useState(null); const [busy, setBusy] = useState(false);
  const [vph, setVph] = useState(null);
  useEffect(() => { const vv = window.visualViewport; if (!vv) return; const onR = () => setVph(vv.height); onR(); vv.addEventListener("resize", onR); vv.addEventListener("scroll", onR); return () => { vv.removeEventListener("resize", onR); vv.removeEventListener("scroll", onR); }; }, []);
  const pick = async (file) => { if (!file) return; setCover(URL.createObjectURL(file)); setBusy(true); try { const url = await storageApi.upload(file, "highlights"); setCoverUrl(url); } catch (e) { flash && flash("ფოტო ვერ აიტვირთა"); } setBusy(false); };
  const save = async () => { if (!title.trim() || busy) return; setBusy(true); try { await highlightsApi.create({ title: title.trim(), cover_url: coverUrl }); onCreated(); onClose(); } catch (e) { flash && flash("ვერ შეიქმნა: " + (e.message || "")); setBusy(false); } };
  return (
    <div className="fixed inset-0 z-[210] flex items-end justify-center" onClick={onClose} style={{ background: "rgba(0,0,0,.55)", height: vph ? vph + "px" : "100dvh" }}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-[440px] rounded-t-3xl flex flex-col" style={{ background: C.paper, maxHeight: vph ? vph + "px" : "90vh" }}>
        <div className="flex justify-center pt-3 pb-2 shrink-0"><div style={{ width: 38, height: 4, borderRadius: 2, background: C.line }} /></div>
        <div className="px-5 overflow-y-auto" style={{ flex: "1 1 auto", minHeight: 0 }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 17, color: C.ink, marginBottom: 14 }}>ახალი Highlight</div>
          <div className="flex items-center gap-3 mb-2">
            <label style={{ cursor: "pointer", flexShrink: 0 }}>
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files && e.target.files[0]; if (f) pick(f); e.target.value = ""; }} />
              <div className="rounded-full flex items-center justify-center overflow-hidden" style={{ width: 68, height: 68, border: `2px dashed ${C.line}`, color: C.muted, background: C.surfaceMuted }}>{cover ? <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Camera size={24} />}</div>
            </label>
            <div className="flex-1">
              <div className="text-[12px] mb-1" style={{ color: C.faint }}>სათაური</div>
              <input value={title} onChange={e => setTitle(e.target.value)} maxLength={20} placeholder="მაგ. მოგზაურობა" className="w-full rounded-xl px-3 py-2.5 text-[15px] outline-none" style={{ background: C.surfaceMuted, color: C.ink }} />
            </div>
          </div>
        </div>
        <div className="px-5 shrink-0" style={{ paddingTop: 10, paddingBottom: "max(26px, env(safe-area-inset-bottom))" }}>
          <button onClick={save} disabled={!title.trim() || busy} className="w-full py-3.5 rounded-xl font-bold text-[15px] active:scale-95" style={{ backgroundImage: GBRAND, color: "#fff", opacity: (!title.trim() || busy) ? 0.5 : 1 }}>{busy ? "..." : "შექმნა"}</button>
        </div>
      </div>
    </div>
  );
}


export function HighlightView({ hl, isMe, onClose, onDelete }) {
  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.92)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="relative w-full" style={{ maxWidth: 440, aspectRatio: "9/16", maxHeight: "86vh" }}>
        {hl.cover_url ? <img src={hl.cover_url} alt="" className="w-full h-full" style={{ objectFit: "cover", borderRadius: 18 }} /> : <div className="w-full h-full flex items-center justify-center" style={{ borderRadius: 18, backgroundImage: GBRAND }}><span style={{ color: "#fff", fontFamily: DISPLAY, fontSize: 30, fontWeight: 800 }}>{hl.title}</span></div>}
        <div className="absolute inset-x-0 top-0 p-4 flex items-start justify-between" style={{ background: "linear-gradient(180deg, rgba(0,0,0,.5), transparent)", borderRadius: "18px 18px 0 0" }}>
          <span className="text-white font-bold text-[16px]" style={{ fontFamily: DISPLAY, textShadow: "0 1px 4px rgba(0,0,0,.6)" }}>{hl.title}</span>
          <div className="flex gap-2">{isMe && <button onClick={() => onDelete(hl)} className="rounded-full flex items-center justify-center" style={{ width: 34, height: 34, background: "rgba(0,0,0,.5)", color: "#fff" }}><Trash2 size={17} /></button>}<button onClick={onClose} className="rounded-full flex items-center justify-center" style={{ width: 34, height: 34, background: "rgba(0,0,0,.5)", color: "#fff" }}><X size={18} /></button></div>
        </div>
      </div>
    </div>
  );
}


export function ReelComments({ data, onClose, onAdd }) {
  const [text, setText] = useState("");
  const list = data.list;
  const send = () => { const t = text.trim(); if (!t) return; onAdd(t); setText(""); };
  return (
    <div className="fixed inset-0 z-[200] flex flex-col justify-end" onClick={onClose} style={{ background: "rgba(0,0,0,.5)" }}>
      <div onClick={e => e.stopPropagation()} className="rounded-t-3xl flex flex-col" style={{ background: C.paper, maxHeight: "72vh", minHeight: "46vh" }}>
        <div className="flex justify-center pt-2.5 pb-1"><div style={{ width: 38, height: 4, borderRadius: 2, background: C.line }} /></div>
        <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
          <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 15, color: C.ink }}>კომენტარები{list ? ` · ${list.length}` : ""}</span>
          <button onClick={onClose} style={{ color: C.muted }}><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3" style={{ minHeight: 120 }}>
          {list === null ? <div className="text-center py-8" style={{ color: C.faint }}><Mono style={{ fontSize: 12 }}>იტვირთება…</Mono></div>
            : list.length === 0 ? <div className="text-center py-10" style={{ color: C.faint, fontSize: 13 }}>კომენტარები ჯერ არ არის. იყავი პირველი 💬</div>
            : list.map(c => { const a = USERS[c.author_id]; return (
              <div key={c.id} className="flex gap-2.5 mb-3.5">
                <Avatar id={c.author_id} size={34} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5"><span className="font-semibold text-[13px]" style={{ color: C.ink }}>{a.name}</span><span style={{ color: C.faint, fontSize: 11 }}>{timeAgo(c.created_at)}</span></div>
                  <div className="text-[14px]" style={{ color: C.ink, lineHeight: 1.4, wordBreak: "break-word" }}>{c.text}</div>
                </div>
              </div>
            ); })}
        </div>
        <div className="px-3 py-2.5 flex items-center gap-2" style={{ borderTop: `1px solid ${C.lineSoft}`, paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}>
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="დაამატე კომენტარი…" className="flex-1 rounded-full px-4 py-2.5 text-[14px] outline-none" style={{ background: C.surfaceMuted, color: C.ink }} />
          <button onClick={send} disabled={!text.trim()} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 40, height: 40, backgroundImage: GBRAND, color: "#fff", opacity: text.trim() ? 1 : 0.5 }}><Send size={18} /></button>
        </div>
      </div>
    </div>
  );
}


export function pushNotif(title, body) {
  try {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const n = new Notification(title, { body: body || "", icon: "/icon-192.png", tag: "mzera" });
    setTimeout(() => { try { n.close(); } catch (e) {} }, 6000);
  } catch (e) {}
}

export function ensureNotifPerm() {
  try { if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission().catch(() => {}); } catch (e) {}
}

export const NOTIF_VERB = { like: "მოიწონა შენი პოსტი ❤️", comment: "დააკომენტარა შენი პოსტი 💬", follow: "გამოგყვა 👤", mention: "მოგიხსენია პოსტში", announcement: "📢 განცხადება" };


export const levelInfo = (xp) => { const lvl = Math.floor(xp / 100) + 1; const into = xp % 100; return { lvl, into, pct: into }; };

export const kfmt = (n) => n > 999 ? (n / 1000).toFixed(1) + "k" : "" + n;








export const RSVP_OPTS = [["going", "მივდივარ"], ["maybe", "ფიქრობ"], ["no", "ვერ"]];

/* ─────────────────────────  REELS  ───────────────────────── */

export const POST_BGS = { sunset: ["#FF6B6B", "#FF8E53"], ocean: ["#4E65FF", "#92EFFD"], grape: ["#7B4DFF", "#E156FF"], forest: ["#11998E", "#38EF7D"], night: ["#232526", "#5b5f7a"], gold: ["#F7971E", "#FFD200"], rose: ["#EC008C", "#FC6767"], sky: ["#2193B0", "#6DD5ED"] };
export const FEELINGS = [["😊", "ბედნიერი"], ["😍", "შეყვარებული"], ["😎", "მაგარი"], ["😢", "მოწყენილი"], ["😡", "გაბრაზებული"], ["🥳", "ზეიმობს"], ["😴", "დაღლილი"], ["🤔", "ფიქრობს"], ["😋", "მშიერი"], ["🙏", "მადლიერი"], ["💪", "მოტივირებული"], ["🥰", "კმაყოფილი"]];

export const SOUNDS = ["ორიგინალი ხმა", "Trending Beat 🔥", "Lo-Fi Chill 🎧", "Epic Cinematic 🎬", "Funny Moment 😂", "Sad Violin 🎻", "Hype Trap 🎵", "Acoustic Guitar 🎸", "Party Vibes 🎉", "ქართული ჰიტი 🇬🇪", "Dramatic 🎭", "Slow Motion 🌙"];

export function ReelCard({ r, onLike, onSave, onOpenProfile, flash, onComments, muted, onToggleMute, onView, onSound, priority = true }) {
  const u = USERS[r.authorId]; const [pop, setPop] = useState(false); const lastTap = useRef(0);
  const videoRef = useRef(null); const tapTimer = useRef(null);
  const rootRef = useRef(null); const viewed = useRef(false); const viewTimer = useRef(null);
  const [progress, setProgress] = useState(0); const [buffering, setBuffering] = useState(false); const [paused, setPaused] = useState(false);
  useEffect(() => {
    const el = rootRef.current; if (!el || !onView) return;
    const io = new IntersectionObserver((es) => es.forEach(e => {
      if (e.isIntersecting && !viewed.current) { clearTimeout(viewTimer.current); viewTimer.current = setTimeout(() => { if (!viewed.current) { viewed.current = true; onView(r.id); } }, 1200); }
      else if (!e.isIntersecting) clearTimeout(viewTimer.current);
    }), { threshold: 0.6 });
    io.observe(el);
    return () => { io.disconnect(); clearTimeout(viewTimer.current); };
  }, [r.id, onView]);
  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    v.play().catch(() => {});
    const el = v.parentElement;
    const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }), { threshold: 0.6 });
    if (el) io.observe(el);
    return () => io.disconnect();
  }, [r.video]);
  useEffect(() => { if (videoRef.current) videoRef.current.muted = muted; }, [muted]);
  const like = () => { if (!r.likedByMe) { setPop(true); setTimeout(() => setPop(false), 420); } onLike(r.id); };
  const onMedia = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) { clearTimeout(tapTimer.current); if (!r.likedByMe) like(); }
    else { tapTimer.current = setTimeout(() => { const v = videoRef.current; if (v) { if (v.paused) v.play().catch(() => {}); else v.pause(); } }, 280); }
    lastTap.current = now;
  };
  return (
    <div ref={rootRef} className="relative w-full" style={{ height: "100dvh", scrollSnapAlign: "start" }}>
      {r.video ? <video ref={videoRef} src={priority ? r.video : undefined} data-src={r.video} className="absolute inset-0 w-full h-full" style={{ objectFit: "cover" }} loop muted={muted} playsInline autoPlay preload={priority ? "auto" : "none"} onTimeUpdate={(e) => { const v = e.currentTarget; if (v.duration) setProgress(v.currentTime / v.duration); }} onWaiting={() => setBuffering(true)} onPlaying={() => { setBuffering(false); setPaused(false); }} onPause={() => setPaused(true)} onPlay={() => setPaused(false)} onCanPlay={() => setBuffering(false)} /> : <Pic src={r.image} grad={GRADS[hashIdx(r.id, GRADS.length)]} className="absolute inset-0 w-full h-full" />}
      <button className="absolute inset-0" onClick={onMedia} />
      {r.video && buffering && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div style={{ width: 40, height: 40, border: "3px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /></div>}
      {r.video && paused && !buffering && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="rounded-full flex items-center justify-center" style={{ width: 64, height: 64, background: "rgba(0,0,0,.4)", backdropFilter: "blur(4px)" }}><Play size={30} fill="#fff" color="#fff" /></div></div>}
      {r.video && <button onClick={(e) => { e.stopPropagation(); onToggleMute && onToggleMute(); }} className="absolute z-10 rounded-full flex items-center justify-center active:scale-90" style={{ top: 72, right: 12, width: 40, height: 40, background: "rgba(0,0,0,.45)", color: "#fff", backdropFilter: "blur(4px)" }}>{muted ? <VolumeX size={20} /> : <Volume2 size={20} />}</button>}
      <div className="absolute inset-x-0 top-0 h-28 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(0,0,0,.5), transparent)" }} />
      <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ height: "45%", background: "linear-gradient(0deg, rgba(0,0,0,.75), transparent)" }} />
      <div className="absolute right-3 flex flex-col items-center gap-5" style={{ bottom: 110 }}>
        <button onClick={() => onOpenProfile(u.id)} className="mb-1"><div className="rounded-full p-[2px]" style={{ backgroundImage: GBRAND }}><div className="rounded-full p-[2px]" style={{ background: "#000" }}><Avatar id={u.id} size={42} /></div></div></button>
        <button onClick={like} className="flex flex-col items-center gap-1 active:scale-90" style={{ color: "#fff" }}><Heart size={34} fill={r.likedByMe ? C.like : "none"} color={r.likedByMe ? C.like : "#fff"} style={{ transform: pop ? "scale(1.3)" : "scale(1)", transition: "transform .3s cubic-bezier(.34,1.56,.64,1)", filter: "drop-shadow(0 2px 6px rgba(0,0,0,.4))" }} /><Mono className="text-xs font-bold" style={{ textShadow: "0 1px 3px rgba(0,0,0,.6)" }}>{kfmt(r.likes + (r.likedByMe ? 1 : 0))}</Mono></button>
        <button onClick={() => onComments && onComments(r)} className="flex flex-col items-center gap-1 active:scale-90" style={{ color: "#fff" }}><MessageCircle size={32} style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,.4))" }} /><Mono className="text-xs font-bold" style={{ textShadow: "0 1px 3px rgba(0,0,0,.6)" }}>{r.comments}</Mono></button>
        <button onClick={() => onSave(r.id)} className="flex flex-col items-center gap-1 active:scale-90" style={{ color: r.savedByMe ? C.star : "#fff" }}><Bookmark size={31} fill={r.savedByMe ? C.star : "none"} style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,.4))" }} /></button>
        <button onClick={() => { const url = typeof location !== "undefined" ? location.origin : "https://mzera2.vercel.app"; if (navigator.share) { navigator.share({ title: "mzera", text: r.caption || "ნახე ეს reel mzera-ზე", url }).catch(() => {}); } else if (navigator.clipboard) { navigator.clipboard.writeText(url).then(() => flash && flash("ლინკი დაკოპირდა 🔗")).catch(() => flash && flash("ლინკი: " + url)); } else { flash && flash("ლინკი: " + url); } }} className="flex flex-col items-center gap-1 active:scale-90" style={{ color: "#fff" }}><Send size={31} style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,.4))" }} /><Mono className="text-xs font-bold" style={{ textShadow: "0 1px 3px rgba(0,0,0,.6)" }}>{r.shares}</Mono></button>
      </div>
      <div className="absolute left-3 right-16 text-white" style={{ bottom: 100 }}>
        <button onClick={() => onOpenProfile(u.id)} className="flex items-center gap-1.5 mb-2"><span className="font-bold text-[15px]" style={{ fontFamily: DISPLAY }}>@{u.handle}</span>{u.verified && <ShieldCheck size={14} />}</button>
        <div className="text-[14px] mb-2" style={{ lineHeight: 1.4, textShadow: "0 1px 4px rgba(0,0,0,.5)" }}>{r.caption}</div>
        <div className="flex items-center gap-3 text-[12px]" style={{ opacity: 0.92 }}>
          <button onClick={() => onSound && onSound(r.audio || "original audio")} className="flex items-center gap-1.5 active:opacity-70" style={{ maxWidth: 190 }}><span style={{ fontSize: 13, animation: "spin 4s linear infinite" }}>♪</span><span className="truncate" style={{ maxWidth: 150 }}>{r.audio}</span></button>
          <span className="flex items-center gap-1 shrink-0"><Play size={11} fill="#fff" color="#fff" /><Mono className="font-bold">{kfmt(r.views || 0)}</Mono></span>
        </div>
      </div>
      {r.video && <div className="absolute bottom-0 inset-x-0" style={{ height: 3, background: "rgba(255,255,255,.22)" }}><div style={{ height: "100%", width: `${Math.round(progress * 100)}%`, background: "#fff", transition: "width .12s linear" }} /></div>}
    </div>
  );
}

export function ReelCreate({ onClose, onPublish, onUpload, onUploadThumb, flash }) {
  const [vid, setVid] = useState(null); const [thumb, setThumb] = useState(null); const [dur, setDur] = useState(null); const [sound, setSound] = useState(SOUNDS[0]);
  const [caption, setCaption] = useState(""); const [up, setUp] = useState(false); const [upSize, setUpSize] = useState(""); const fileRef = useRef(null);
  const probe = (file) => new Promise((resolve) => { const v = document.createElement("video"); v.preload = "metadata"; v.muted = true; v.playsInline = true; v.onloadedmetadata = () => resolve({ v, duration: v.duration || 0 }); v.onerror = () => resolve({ v: null, duration: 0 }); v.src = URL.createObjectURL(file); });
  const grabThumb = (v) => new Promise((resolve) => { const done = () => { try { const scale = Math.min(1, 720 / Math.max(v.videoWidth || 720, v.videoHeight || 1280)); const c = document.createElement("canvas"); c.width = Math.round((v.videoWidth || 720) * scale); c.height = Math.round((v.videoHeight || 1280) * scale); c.getContext("2d").drawImage(v, 0, 0, c.width, c.height); c.toBlob(b => resolve(b ? new File([b], "thumb-" + Date.now() + ".jpg", { type: "image/jpeg" }) : null), "image/jpeg", 0.72); } catch (e) { resolve(null); } }; v.onseeked = done; try { v.currentTime = Math.min(1, (v.duration || 2) / 2); } catch (e) { done(); } });
  const pick = async (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) { return; }
    const mb = f.size / (1024 * 1024);
    setUp(true); setUpSize(mb < 1 ? Math.round(f.size / 1024) + "KB" : mb.toFixed(1) + "MB");
    try {
      const { v, duration } = await probe(f);
      if (duration && duration > 180) { flash && flash("ვიდეო გრძელია — მაქს. 3 წუთი (შენი: " + Math.round(duration) + "წმ)"); setUp(false); e.target.value = ""; return; }
      setDur(duration ? Math.round(duration) : null);
      let thumbFile = null; if (v) { try { thumbFile = await grabThumb(v); } catch (er) {} }
      const url = await onUpload(f);
      let turl = null; if (thumbFile && onUploadThumb) { try { turl = await onUploadThumb(thumbFile); } catch (er) {} }
      setVid(url); setThumb(turl);
    } catch (err) { flash && flash("ატვირთვა ვერ მოხერხდა: " + (err && err.message ? err.message : "სცადე თავიდან")); }
    setUp(false); e.target.value = "";
  };
  return (
    <div className="fixed inset-0 z-[60] flex sm:items-center justify-center items-end" style={{ background: "rgba(6,7,12,.6)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full sm:max-w-[460px] sm:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-y-auto" style={{ background: C.surface, boxShadow: SH.pop }}>
        <div className="flex items-center justify-between px-4 py-3.5 sticky top-0 z-10" style={{ background: C.surface, borderBottom: `1px solid ${C.lineSoft}` }}><button onClick={onClose} style={{ color: C.muted }}><X size={22} /></button><span className="font-bold" style={{ color: C.ink, fontFamily: DISPLAY }}>ახალი Reel</span><button disabled={!vid} onClick={() => onPublish({ video: vid, thumb, caption: caption.trim(), audio: sound })} className="px-4 py-1.5 rounded-full text-sm font-bold" style={{ backgroundImage: GBRAND, color: "#fff", opacity: vid ? 1 : 0.4 }}>გამოქვეყნება</button></div>
        <div className="p-4 space-y-3.5">
          <input ref={fileRef} type="file" accept="video/*" hidden onChange={pick} />
          {vid ? (
            <div className="relative rounded-2xl overflow-hidden mx-auto" style={{ background: "#000", aspectRatio: "9/16", maxHeight: 340 }}><video src={vid} poster={thumb || undefined} className="w-full h-full" style={{ objectFit: "contain" }} autoPlay loop muted playsInline /><button onClick={() => { setVid(null); setThumb(null); setDur(null); }} className="absolute top-2 right-2 rounded-full p-1.5" style={{ background: "rgba(0,0,0,.55)", color: "#fff" }}><X size={16} /></button>{dur != null && <span className="absolute bottom-2 left-2 rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ background: "rgba(0,0,0,.6)", color: "#fff" }}>{dur}წმ{thumb ? " · thumbnail ✓" : ""}</span>}</div>
          ) : (
            <button onClick={() => fileRef.current && fileRef.current.click()} disabled={up} className="w-full flex flex-col items-center justify-center gap-2 rounded-2xl mx-auto" style={{ aspectRatio: "9/16", maxHeight: 300, background: C.surfaceMuted, border: `2px dashed ${C.line}`, color: C.muted }}>{up ? <div className="flex flex-col items-center gap-2 px-4 text-center"><div className="rounded-full" style={{ width: 30, height: 30, border: `3px solid ${C.accentSoft}`, borderTopColor: C.accent, animation: "spin 0.8s linear infinite" }} /><span className="text-sm font-bold" style={{ color: C.ink2 }}>იტვირთება… {upSize}</span><span className="text-[11px]" style={{ color: C.faint }}>thumbnail მზადდება, დაელოდე</span></div> : <><div className="rounded-full flex items-center justify-center" style={{ width: 56, height: 56, background: C.accentSoft }}><Film size={26} style={{ color: C.accent }} /></div><span className="text-sm font-bold" style={{ color: C.ink2 }}>აირჩიე ვიდეო</span><span className="text-[12px]">MP4 / MOV · მაქს. 3 წუთი</span></>}</button>
          )}
          <div>
            <div className="flex items-center gap-1.5 text-[13px] font-bold mb-2" style={{ color: C.muted }}><span style={{ fontSize: 14 }}>🎵</span> ხმა</div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {SOUNDS.map(s => <button key={s} onClick={() => setSound(s)} className="px-3 py-1.5 rounded-full text-[13px] font-bold shrink-0 active:scale-95" style={sound === s ? { backgroundImage: GBRAND, color: "#fff" } : { background: C.surfaceMuted, color: C.muted }}>{s}</button>)}
            </div>
          </div>
          <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="დაწერე აღწერა… (#ჰეშთეგი)" className="w-full px-3.5 py-3 rounded-xl outline-none text-[15px]" style={{ background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` }} />
        </div>
      </div>
    </div>
  );
}

export function GroupPost({ p, onOpenProfile, onEdit, onDelete }) {
  const [liked, setLiked] = useState(false); const u = USERS[p.authorId];
  const [editing, setEditing] = useState(false); const [txt, setTxt] = useState(p.text || ""); const [menu, setMenu] = useState(false);
  const mine = p.authorId === ME;
  return (
    <div className="p-3.5" style={card()}>
      <div className="flex items-center gap-2.5 mb-2"><button onClick={() => onOpenProfile(u.id)}><Avatar id={u.id} size={36} /></button><div className="leading-tight flex-1 min-w-0"><Name id={u.id} className="text-[14px]" /><div><Handle h={u.handle} t={p.time} /></div></div>{mine && (onEdit || onDelete) && <div className="relative"><button onClick={() => setMenu(m => !m)} className="active:scale-90 p-1" style={{ color: C.faint }}><MoreHorizontal size={20} /></button>{menu && <><div className="fixed inset-0" style={{ zIndex: 30 }} onClick={() => setMenu(false)} /><div className="absolute right-0 z-40 rounded-xl overflow-hidden" style={{ top: "100%", background: C.surface, border: `1px solid ${C.line}`, boxShadow: SH.pop, minWidth: 150 }}>{onEdit && <button onClick={() => { setMenu(false); setEditing(true); setTxt(p.text || ""); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[14px] font-medium active:opacity-70" style={{ color: C.ink }}><Pencil size={16} /> რედაქტირება</button>}{onDelete && <button onClick={() => { setMenu(false); onDelete(p.id); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[14px] font-medium active:opacity-70" style={{ color: C.like, borderTop: `1px solid ${C.lineSoft}` }}><Trash2 size={16} /> წაშლა</button>}</div></>}</div>}</div>
      {editing ? <div className="mb-2"><textarea value={txt} onChange={e => setTxt(e.target.value)} rows={2} className="w-full resize-none px-3 py-2 rounded-xl outline-none text-[14px]" style={{ background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` }} autoFocus /><div className="flex gap-2 mt-1.5 justify-end"><button onClick={() => { setEditing(false); setTxt(p.text || ""); }} className="px-3 py-1.5 rounded-lg text-[13px] font-bold" style={{ background: C.surfaceMuted, color: C.muted }}>გაუქმება</button><button onClick={() => { if (txt.trim()) { onEdit(p.id, txt.trim()); setEditing(false); } }} className="px-3 py-1.5 rounded-lg text-[13px] font-bold text-white" style={{ backgroundImage: GBRAND }}>შენახვა</button></div></div> : (p.text && <div className="text-[14px] mb-2" style={{ color: C.ink2, lineHeight: 1.5 }}>{p.text}</div>)}
      {p.image && <Pic src={p.image} grad={GRADS[hashIdx(p.id, GRADS.length)]} round={12} style={{ aspectRatio: "16/10" }} className="mb-2" />}
      <div className="flex items-center gap-4 text-[13px]" style={{ color: C.faint }}>
        <button onClick={() => setLiked(l => !l)} className="flex items-center gap-1.5 active:scale-90" style={{ color: liked ? C.like : C.faint }}><Heart size={17} fill={liked ? C.like : "none"} /><Mono>{p.likes + (liked ? 1 : 0)}</Mono></button>
        <span className="flex items-center gap-1.5"><MessageCircle size={17} /><Mono>{p.cc}</Mono></span>
      </div>
    </div>
  );
}

export function MiniMap({ h = 120 }) {
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

export function Switch({ on, onClick }) {
  return <button onClick={onClick} className="rounded-full transition shrink-0" style={{ width: 46, height: 27, padding: 3, background: on ? undefined : C.line, backgroundImage: on ? GBRAND : "none" }}><span className="block rounded-full transition" style={{ width: 21, height: 21, background: "#fff", transform: on ? "translateX(19px)" : "translateX(0)", boxShadow: "0 1px 3px rgba(0,0,0,.3)" }} /></button>;
}

export const SettingsSection = ({ title, children }) => <div className="mt-5"><div className="px-4 pb-1.5 text-[12px] font-bold uppercase" style={{ color: C.faint, fontFamily: MONO, letterSpacing: "0.04em" }}>{title}</div><div style={{ background: C.surface, borderTop: `1px solid ${C.lineSoft}`, borderBottom: `1px solid ${C.lineSoft}` }}>{children}</div></div>;

export const SettingsRow = ({ label, sub, on, onToggle, first }) => <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: first ? "none" : `1px solid ${C.lineSoft}` }}><div className="pr-3"><div className="text-[15px]" style={{ color: C.ink }}>{label}</div>{sub && <div className="text-[12px] mt-0.5" style={{ color: C.faint }}>{sub}</div>}</div><Switch on={on} onClick={onToggle} /></div>;

export const FILTERS = [["ნორმ", "none"], ["მონო", "grayscale(1)"], ["თბილი", "sepia(.4) saturate(1.5) hue-rotate(-10deg)"], ["ცივი", "saturate(1.2) hue-rotate(18deg) brightness(1.05)"], ["ვივიდი", "saturate(1.8) contrast(1.1)"], ["ფეიდი", "contrast(.85) brightness(1.12) saturate(.85)"]];

export const STORY_STICKERS = ["❤️", "🔥", "😎", "✨", "🎉", "📍", "☕", "🌅", "💯", "👀", "🥳", "🙌"];

export { useState, useEffect, useRef };
export { Home, Search, Compass, PlusSquare, Send, Bell, User, Shield, Heart, MessageCircle, MessageSquare, Bookmark, MoreHorizontal, X, ArrowLeft, Hash, TrendingUp, Check, Trash2, Flag, Camera, Settings, AlertTriangle, ImageIcon, MapPin, Map, Link2, ShieldCheck, Plus, Minus, Menu, LogOut, HelpCircle, ChevronRight, Zap, Sun, Moon, ShoppingBag, Tag, Star, Eye, Navigation, Users, Film, Mic, Play, Pause, Smile, FileText, Download, UserPlus, Trophy, Upload, Volume2, VolumeX, Pencil, CornerUpLeft, Copy, Reply, Phone, Video, PhoneOff, VideoOff, MicOff };
export { authApi, profilesApi, postsApi, reactionsApi, commentsApi, followsApi, chatApi, notifsApi, storageApi, storiesApi, reelsApi, marketApi, groupsApi, eventsApi, forumApi, highlightsApi, presenceApi, locationsApi, pollsApi, questsApi, xpApi, adminApi, pushApi };
export { hasSupabase };
export function setTheme(d) { C = d ? PAL.dark : PAL.light; DARK = d; }
export function setME(v) { ME = v; }
