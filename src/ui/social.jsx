import {
  useState, useEffect, useRef, Home, Search, Compass, PlusSquare, Send, Bell, User, Shield, Heart, MessageCircle, MessageSquare, Bookmark, MoreHorizontal, X, ArrowLeft, Hash, TrendingUp, Check, Trash2, Flag, Camera, Settings, AlertTriangle, ImageIcon, MapPin, Map, Link2, ShieldCheck, Plus, Minus, Menu, LogOut, HelpCircle, ChevronRight, Zap, Sun, Moon, ShoppingBag, Tag, Star, Eye, Navigation, Users, Film, Mic, Play, Pause, Smile, FileText, Download, UserPlus, Trophy, Upload, Volume2, VolumeX, Pencil, CornerUpLeft, Copy, Reply, Clapperboard, Music, Gift, Calendar, authApi, profilesApi, postsApi, reactionsApi, commentsApi, followsApi, chatApi, notifsApi, storageApi, storiesApi, reelsApi, marketApi, groupsApi, eventsApi, forumApi, highlightsApi, presenceApi, locationsApi, pollsApi, questsApi, xpApi, adminApi, pushApi, hasSupabase, PAL, DARK, C, GBRAND, SH, card, DISPLAY, BODY, MONO, Mono, GRADS, hashIdx, img, catColor, FALLBACK_USER, _users, USERS, ME, fmtN, computeTrends, REPLIES, MARKET_CATS, FORUM_CATS, Pic, Avatar, Tilt, Dot, Name, Handle, IconBtn, Pill, Wordmark, Title, Chips, renderText, Empty, ThemeToggle, REACTIONS, StoryRow, MiniPost, NewThread, Stars, Checkout, NewListing, GroupAvatar, waveOf, dl, VoiceMsg, DocMsg, EMOJIS, EmojiPanel, PeoplePicker, convMembers, convIsGroup, msgPreview, FollowBtn, FollowList, timeAgo, mergeProfile, mapDbPost, msgClock, mapDbMsg, toDbMsg, mapDbNotif, resolveImg, hydrateAuthors, mapDbStories, mapDbReel, mapDbThread, mapDbListing, mapDbReview, mapDbGroup, mapDbEvent, ConfigError, LoadingScreen, AuthScreen, HighlightCreate, HighlightView, ReelComments, pushNotif, ensureNotifPerm, levelInfo, kfmt, ReelCard, ReelCreate, GroupPost, MiniMap, Switch, SettingsSection, SettingsRow, STORY_STICKERS, setTheme, setME, t, LANGS, Languages, UploadRing,
} from "./core";
import { PostCard, Lightbox } from "./feed";

/* ─────────────────────────  DRAWER  ───────────────────────── */

export function Drawer({ open, onClose, nav, onNav, onCreate, flash, tab, mode, setMode, xp, followers, following, onSettings, onSignOut }) {
  const me = USERS[ME]; const { lvl, into } = levelInfo(xp);
  const extras = [{ label: t("drawer.saved"), icon: Bookmark, act: () => onNav("profile") }, { label: t("drawer.settings"), icon: Settings, act: () => onSettings() }, { label: t("drawer.help"), icon: HelpCircle, act: () => flash(t("drawer.helpSoon")) }, { label: t("drawer.signout"), icon: LogOut, act: () => onSignOut(), danger: true }];
  return (
    <div className="fixed inset-0 z-[55] md:hidden" style={{ pointerEvents: open ? "auto" : "none" }}>
      <div onClick={onClose} className="absolute inset-0" style={{ background: "rgba(6,7,12,.5)", opacity: open ? 1 : 0, transition: "opacity .3s ease" }} />
      <aside className="absolute top-0 left-0 h-full flex flex-col" style={{ width: "84%", maxWidth: 320, background: C.surface, boxShadow: SH.pop, transform: open ? "translateX(0)" : "translateX(-104%)", transition: "transform .32s cubic-bezier(.4,0,.2,1)" }}>
        <div className="p-5 pb-4" style={{ backgroundImage: GBRAND, color: "#fff" }}>
          <div className="flex items-center justify-between mb-4"><span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 22, letterSpacing: "-0.04em" }}>mzera.</span><button onClick={onClose} className="active:scale-90 rounded-full p-1" style={{ background: "rgba(255,255,255,.2)" }}><X size={18} /></button></div>
          <button onClick={() => onNav("profile")} className="flex items-center gap-3 w-full text-left"><div className="rounded-full p-[2px]" style={{ background: "rgba(255,255,255,.45)" }}><Avatar id={ME} size={50} /></div><div className="min-w-0"><div className="flex items-center gap-1 font-bold text-[16px]">{me.name}<ShieldCheck size={14} /></div><Mono style={{ fontSize: 12, opacity: 0.85 }}>@{me.handle}</Mono></div></button>
          <div className="flex gap-5 mt-3.5 text-[13px]"><span><Mono className="font-bold">{fmtN(following)}</Mono> <span style={{ opacity: 0.8 }}>მიჰყვება</span></span><span><Mono className="font-bold">{fmtN(followers)}</Mono> <span style={{ opacity: 0.8 }}>მიმდევარი</span></span></div>
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

// same items as Drawer (profile + nav + extras), always visible as a
// horizontally scrolling tile strip at the top of the feed — tapping a tile
// switches straight to it, no popup/drag gesture involved.
const NAVSTRIP_HUES = [265, 205, 172, 28, 330, 150, 10, 235, 45, 190];

export function NavStrip({ nav, onNav, onCreate, flash, tab, xp, onSettings, onSignOut }) {
  const { lvl } = levelInfo(xp);
  const extras = [{ label: t("drawer.saved"), icon: Bookmark, act: () => onNav("profile") }, { label: t("drawer.settings"), icon: Settings, act: () => onSettings() }, { label: t("drawer.help"), icon: HelpCircle, act: () => flash(t("drawer.helpSoon")) }, { label: t("drawer.signout"), icon: LogOut, act: () => onSignOut(), danger: true }];
  const tiles = [
    { key: "__profile", isProfile: true, label: t("nav.you") + " · Lv" + lvl, act: () => onNav("profile") },
    ...nav.map(n => ({ key: n.key, label: n.label, icon: n.icon, badge: n.badge, act: () => n.key === "create" ? onCreate() : onNav(n.key) })),
    ...extras.map(e => ({ key: e.label, label: e.label, icon: e.icon, danger: e.danger, act: e.act })),
  ];
  // fades the tile row into the card's own background at both edges, instead
  // of a hard cut, so the strip visibly hints that there's more to scroll to.
  const edgeFade = { WebkitMaskImage: "linear-gradient(90deg, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%)", maskImage: "linear-gradient(90deg, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%)" };

  // coverflow: each tile's rotateY/scale/depth is derived from how far its
  // center sits from the track's center, recomputed off the actual DOM rects
  // on every scroll frame (rAF-throttled) — no fixed-width math to keep in
  // sync, and it stays correct regardless of viewport width.
  const trackRef = useRef(null);
  const tileRefs = useRef([]);
  const rafRef = useRef(null);
  const [, bump] = useState(0);
  const requestRecompute = () => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => { rafRef.current = null; bump(x => x + 1); });
  };
  useEffect(() => { requestRecompute(); return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }; }, []);
  const tiltStyle = (i) => {
    const el = tileRefs.current[i]; const track = trackRef.current;
    if (!el || !track) return {};
    const tr = track.getBoundingClientRect(); const er = el.getBoundingClientRect();
    const delta = (er.left + er.width / 2) - (tr.left + tr.width / 2);
    const norm = Math.max(-1, Math.min(1, delta / (tr.width / 2)));
    const rotateY = norm * -38;
    const scale = 1 - Math.min(1, Math.abs(norm)) * 0.32;
    const translateZ = -Math.min(1, Math.abs(norm)) * 46;
    const opacity = 1 - Math.min(1, Math.abs(norm)) * 0.55;
    return { transform: `perspective(600px) rotateY(${rotateY}deg) translateZ(${translateZ}px) scale(${scale})`, opacity };
  };

  return (
    <div className="mx-3 mt-2 overflow-hidden" style={{ ...card(), borderRadius: 22 }}>
      <div
        ref={trackRef}
        onScroll={requestRecompute}
        className="flex overflow-x-auto no-scrollbar gap-3 py-3"
        style={{ scrollSnapType: "x mandatory", paddingLeft: "calc(50% - 28px)", paddingRight: "calc(50% - 28px)", ...edgeFade }}
      >
        {tiles.map((tl, i) => {
          const hue = NAVSTRIP_HUES[i % NAVSTRIP_HUES.length];
          const isTab = tab === tl.key;
          return (
            <button
              key={tl.key}
              ref={el => { tileRefs.current[i] = el; }}
              onClick={tl.act}
              className="relative flex flex-col items-center gap-1 shrink-0 active:scale-95"
              style={{ width: 56, scrollSnapAlign: "center", transition: "transform .15s ease, opacity .15s ease", ...tiltStyle(i) }}
            >
              {tl.isProfile ? (
                <div className="rounded-full p-[2px]" style={{ width: 44, height: 44, backgroundImage: GBRAND }}>
                  <div className="rounded-full" style={{ width: "100%", height: "100%", padding: 2, background: C.surface }}><Avatar id={ME} size={36} /></div>
                </div>
              ) : (
                <div className="relative rounded-2xl flex items-center justify-center" style={{ width: 44, height: 44, background: tl.danger ? C.like + "1f" : `hsla(${hue},75%,55%,${isTab ? 0.24 : 0.13})`, boxShadow: isTab ? `0 0 0 2px hsla(${hue},75%,55%,.55)` : "none" }}>
                  <tl.icon size={19} style={{ color: tl.danger ? C.like : `hsl(${hue},70%,42%)` }} />
                  {tl.badge > 0 && <span className="absolute -top-1 -right-1 rounded-full text-white flex items-center justify-center" style={{ minWidth: 15, height: 15, padding: "0 3px", background: C.like, fontFamily: MONO, fontSize: 9, fontWeight: 700 }}>{tl.badge}</span>}
                </div>
              )}
              <span className="text-[10.5px] leading-tight text-center font-bold whitespace-nowrap" style={{ color: tl.danger ? C.like : (tl.isProfile ? tab === "profile" : isTab) ? C.accent : C.ink2 }}>{tl.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
