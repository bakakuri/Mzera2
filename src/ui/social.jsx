import {
  useState, useEffect, useRef, Home, Search, Compass, PlusSquare, Send, Bell, User, Shield, Heart, MessageCircle, MessageSquare, Bookmark, MoreHorizontal, X, ArrowLeft, Hash, TrendingUp, Check, Trash2, Flag, Camera, Settings, AlertTriangle, ImageIcon, MapPin, Map, Link2, ShieldCheck, Plus, Minus, Menu, LogOut, HelpCircle, ChevronRight, ChevronDown, Zap, Sun, Moon, ShoppingBag, Tag, Star, Eye, Navigation, Users, Film, Mic, Play, Pause, Smile, FileText, Download, UserPlus, Trophy, Upload, Volume2, VolumeX, Pencil, CornerUpLeft, Copy, Reply, Clapperboard, Music, Gift, Calendar, authApi, profilesApi, postsApi, reactionsApi, commentsApi, followsApi, chatApi, notifsApi, storageApi, storiesApi, reelsApi, marketApi, groupsApi, eventsApi, forumApi, highlightsApi, presenceApi, locationsApi, pollsApi, questsApi, xpApi, adminApi, pushApi, hasSupabase, PAL, DARK, C, GBRAND, SH, card, DISPLAY, BODY, MONO, Mono, GRADS, hashIdx, img, catColor, FALLBACK_USER, _users, USERS, ME, fmtN, computeTrends, REPLIES, MARKET_CATS, FORUM_CATS, Pic, Avatar, Tilt, Dot, Name, Handle, IconBtn, Pill, Wordmark, Title, Chips, renderText, Empty, ThemeToggle, REACTIONS, StoryRow, MiniPost, NewThread, Stars, Checkout, NewListing, GroupAvatar, waveOf, dl, VoiceMsg, DocMsg, EMOJIS, EmojiPanel, PeoplePicker, convMembers, convIsGroup, msgPreview, FollowBtn, FollowList, timeAgo, mergeProfile, mapDbPost, msgClock, mapDbMsg, toDbMsg, mapDbNotif, resolveImg, hydrateAuthors, mapDbStories, mapDbReel, mapDbThread, mapDbListing, mapDbReview, mapDbGroup, mapDbEvent, ConfigError, LoadingScreen, AuthScreen, HighlightCreate, HighlightView, ReelComments, pushNotif, ensureNotifPerm, levelInfo, kfmt, ReelCard, ReelCreate, GroupPost, MiniMap, Switch, SettingsSection, SettingsRow, STORY_STICKERS, setTheme, setME, t, LANGS, Languages, UploadRing,
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

// same menu as Drawer, but opened from a miniature tap button in the feed
// (previously a drag-down "pull tab" — replaced with a plain tap trigger).
const PULLMENU_HUES = [265, 205, 172, 28, 330, 150, 10, 235, 45, 190];

export function PullMenu({ open, setOpen, nav, onNav, onCreate, flash, tab, mode, setMode, xp, followers, following, onSettings, onSignOut }) {
  const me = USERS[ME]; const { lvl, into } = levelInfo(xp);
  const extras = [{ label: t("drawer.saved"), icon: Bookmark, act: () => onNav("profile") }, { label: t("drawer.settings"), icon: Settings, act: () => onSettings() }, { label: t("drawer.help"), icon: HelpCircle, act: () => flash(t("drawer.helpSoon")) }, { label: t("drawer.signout"), icon: LogOut, act: () => onSignOut(), danger: true }];
  const tiles = [...nav.map(n => ({ key: n.key, label: n.label, icon: n.icon, badge: n.badge, act: () => n.key === "create" ? onCreate() : go(n.key) })), ...extras.map(e => ({ key: e.label, label: e.label, icon: e.icon, danger: e.danger, act: e.act }))];

  function go(key) { onNav(key); setOpen(false); }

  const shownProgress = open ? 1 : 0;

  const trackRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const SLIDE_W = 100;
  const onTrackScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    setActiveIdx(Math.max(0, Math.min(tiles.length - 1, Math.round(el.scrollLeft / SLIDE_W))));
  };
  const scrollToIdx = (i, smooth = true) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * SLIDE_W, behavior: smooth ? "smooth" : "auto" });
  };
  useEffect(() => {
    if (!open) return;
    const idx = Math.max(0, tiles.findIndex(tl => tl.key === tab));
    setActiveIdx(idx);
    requestAnimationFrame(() => scrollToIdx(idx, false));
  }, [open]);

  return (
    <>
      <div className="w-full flex justify-center py-1.5">
        <button
          onClick={() => setOpen(o => !o)}
          className="rounded-full flex items-center justify-center active:scale-90"
          style={{
            width: 30, height: 30,
            backgroundImage: `linear-gradient(135deg, hsl(${PULLMENU_HUES[0]},75%,58%), hsl(${PULLMENU_HUES[2]},70%,50%))`,
            boxShadow: `0 2px 10px -2px hsla(${PULLMENU_HUES[0]},75%,50%,.65)`,
          }}
          aria-label={t("drawer.pullHint")}
        >
          <ChevronDown size={15} color="#fff" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .3s ease" }} />
        </button>
      </div>

      <div className="fixed inset-0 z-[54] md:hidden" style={{ pointerEvents: open ? "auto" : "none" }}>
        <div onClick={() => setOpen(false)} className="absolute inset-0" style={{ background: "rgba(6,7,12,.5)", backdropFilter: "blur(2px)", opacity: shownProgress, transition: "opacity .35s ease" }} />
        <div
          className="absolute left-1/2 w-full max-w-[420px] rounded-b-[32px] overflow-hidden"
          style={{
            top: "var(--mz-hdr, 56px)",
            transform: `translateX(-50%) perspective(1300px) rotateX(${(1 - shownProgress) * -85}deg) translateY(${(1 - shownProgress) * -18}px) scale(${0.92 + shownProgress * 0.08})`,
            transformOrigin: "top center",
            opacity: shownProgress,
            transition: "transform .55s cubic-bezier(.34,1.56,.64,1), opacity .3s ease",
            background: C.surface + "F0",
            backdropFilter: "blur(18px) saturate(1.4)",
            border: `1px solid ${C.lineSoft}`,
            borderTop: "none",
            boxShadow: open ? `0 30px 70px -20px ${C.accent}4a, 0 10px 30px -10px rgba(0,0,0,.35)` : "none",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <button onClick={() => go("profile")} className="flex items-center gap-2.5 text-left min-w-0">
              <div className="relative shrink-0" style={{ width: 46, height: 46 }}>
                <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${C.accent} ${into}%, ${C.surfaceMuted} 0)`, padding: 2 }} />
                <div className="absolute" style={{ inset: 2.5 }}><Avatar id={ME} size={41} /></div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1 font-bold text-[14.5px]" style={{ color: C.ink }}>{me.name}<ShieldCheck size={12} style={{ color: C.accent }} /></div>
                <div className="flex items-center gap-2 text-[11.5px]" style={{ color: C.muted }}>
                  <span className="flex items-center gap-0.5" style={{ color: C.accent, fontWeight: 700 }}><Zap size={11} fill={C.accent} />{lvl}</span>
                  <Mono>{fmtN(followers)} · {fmtN(following)}</Mono>
                </div>
              </div>
            </button>
            <div className="flex items-center gap-1 shrink-0">
              <ThemeToggle mode={mode} setMode={setMode} />
              <button onClick={() => setOpen(false)} className="active:scale-90 rounded-full flex items-center justify-center" style={{ width: 32, height: 32, background: C.surfaceMuted, color: C.ink2 }}><X size={16} /></button>
            </div>
          </div>

          <div
            ref={trackRef}
            onScroll={onTrackScroll}
            className="flex overflow-x-auto no-scrollbar pt-1 pb-4"
            style={{ scrollSnapType: "x mandatory", touchAction: "pan-x", paddingLeft: "calc(50% - 50px)", paddingRight: "calc(50% - 50px)" }}
          >
            {tiles.map((tl, i) => {
              const hue = PULLMENU_HUES[i % PULLMENU_HUES.length];
              const isTab = tab === tl.key;
              const near = Math.abs(i - activeIdx) <= 1;
              const p = shownProgress;
              return (
                <button
                  key={tl.key}
                  onClick={() => { if (i === activeIdx) { tl.act(); setOpen(false); } else scrollToIdx(i); }}
                  className="relative flex flex-col items-center gap-2 shrink-0 active:scale-95"
                  style={{
                    width: 100,
                    scrollSnapAlign: "center",
                    opacity: p * (i === activeIdx ? 1 : near ? 0.65 : 0.35),
                    transform: `scale(${(i === activeIdx ? 1 : 0.82) * (0.7 + p * 0.3)}) translateY(${(1 - p) * 16}px)`,
                    transition: `opacity .35s cubic-bezier(.34,1.56,.64,1) ${i * 12}ms, transform .35s cubic-bezier(.34,1.56,.64,1) ${i * 12}ms`,
                  }}
                >
                  <div className="relative rounded-[26px] flex items-center justify-center" style={{ width: 76, height: 76, background: tl.danger ? C.like + "1f" : `hsla(${hue},75%,55%,.16)`, boxShadow: i === activeIdx ? `0 12px 26px -12px hsla(${hue},75%,50%,.6), 0 0 0 2px hsla(${hue},75%,55%,.55)` : "none" }}>
                    <tl.icon size={28} style={{ color: tl.danger ? C.like : `hsl(${hue},70%,42%)` }} />
                    {tl.badge > 0 && <span className="absolute -top-1 -right-1 rounded-full text-white flex items-center justify-center" style={{ minWidth: 16, height: 16, padding: "0 3px", background: C.like, fontFamily: MONO, fontSize: 10, fontWeight: 700 }}>{tl.badge}</span>}
                    {isTab && <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full" style={{ width: 5, height: 5, background: `hsl(${hue},70%,42%)` }} />}
                  </div>
                  <span className="text-[12px] leading-tight text-center font-bold whitespace-nowrap" style={{ color: tl.danger ? C.like : C.ink }}>{tl.label}</span>
                </button>
              );
            })}
          </div>
          <div className="flex justify-center flex-wrap gap-1.5 px-6 pb-4">
            {tiles.map((tl, i) => (
              <button key={tl.key} onClick={() => scrollToIdx(i)} aria-label={tl.label} className="rounded-full transition-all" style={{ width: i === activeIdx ? 14 : 5, height: 5, background: i === activeIdx ? C.accent : C.line }} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
