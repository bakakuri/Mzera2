import {
  useState, useEffect, useRef, Home, Search, Compass, PlusSquare, Send, Bell, User, Shield, Heart, MessageCircle, MessageSquare, Bookmark, MoreHorizontal, X, ArrowLeft, Hash, TrendingUp, Check, Trash2, Flag, Camera, Settings, AlertTriangle, ImageIcon, MapPin, Map, Link2, ShieldCheck, Plus, Minus, Menu, LogOut, HelpCircle, ChevronRight, Zap, Sun, Moon, ShoppingBag, Tag, Star, Eye, Navigation, Users, Film, Mic, Play, Pause, Smile, FileText, Download, UserPlus, Trophy, Upload, Volume2, VolumeX, Pencil, CornerUpLeft, Copy, Reply, authApi, profilesApi, postsApi, reactionsApi, commentsApi, followsApi, chatApi, notifsApi, storageApi, storiesApi, reelsApi, marketApi, groupsApi, eventsApi, forumApi, highlightsApi, presenceApi, locationsApi, pollsApi, questsApi, xpApi, adminApi, pushApi, hasSupabase, PAL, DARK, C, GBRAND, SH, card, DISPLAY, BODY, MONO, Mono, GRADS, hashIdx, img, catColor, FALLBACK_USER, _users, USERS, ME, fmtN, computeTrends, REPLIES, MARKET_CATS, FORUM_CATS, Pic, Avatar, Dot, Name, Handle, IconBtn, Pill, Wordmark, Title, Chips, renderText, Empty, ThemeToggle, REACTIONS, StoryRow, MiniPost, NewThread, Stars, Checkout, NewListing, GroupAvatar, waveOf, dl, VoiceMsg, DocMsg, EMOJIS, EmojiPanel, PeoplePicker, convMembers, convIsGroup, msgPreview, FollowBtn, FollowList, timeAgo, mergeProfile, mapDbPost, msgClock, mapDbMsg, toDbMsg, mapDbNotif, resolveImg, hydrateAuthors, mapDbStories, mapDbReel, mapDbThread, KA_MONS, mapDbListing, mapDbReview, mapDbGroup, mapDbEvent, ConfigError, LoadingScreen, AuthScreen, HighlightCreate, HighlightView, ReelComments, pushNotif, ensureNotifPerm, NOTIF_VERB, levelInfo, kfmt, RSVP_OPTS, ReelCard, ReelCreate, GroupPost, MiniMap, Switch, SettingsSection, SettingsRow, FILTERS, STORY_STICKERS, setTheme, setME,
} from "./core";
import { PostCard } from "./feed";

export function Profile({ userId, posts, savedPosts, reels, xp, meProfile, following, followerCounts, onToggleFollow, onMessage, onOpenList, onSettings, flash, onBack, onTag, onLike, onReact, onSave, onComment, onPollVote, onReport, onRemove, onOpenProfile, isAdmin, onUploadAvatar, onUploadCover, onOpenReels, onAddReel, onReelDelete, onReelEdit, onEditPost, onDeletePost, onEditComment, onDeleteComment, blocked, muted, onBlock, onUnblock, onMute, onUnmute, closeFriend, onToggleCloseFriend, collections, onCreateCollection, onAssignCollection }) {
  const u = USERS[userId]; const isMe = userId === ME; const [tab, setTab] = useState("grid"); const [sel, setSel] = useState(null); const [editReel, setEditReel] = useState(null); const [editCap, setEditCap] = useState("");
  const [menuOpen, setMenuOpen] = useState(false); const [qrOpen, setQrOpen] = useState(false); const [selCol, setSelCol] = useState(null); const [assignFor, setAssignFor] = useState(null);
  const [hls, setHls] = useState([]); const [creatingHl, setCreatingHl] = useState(false); const [viewHl, setViewHl] = useState(null);
  useEffect(() => { let on = true; highlightsApi.forUser(userId).then(d => { if (on) setHls(d); }).catch(() => {}); return () => { on = false; }; }, [userId]);
  const reloadHls = () => highlightsApi.forUser(userId).then(setHls).catch(() => {});
  const dispName = isMe && meProfile ? meProfile.name : u.name; const dispBio = isMe && meProfile ? meProfile.bio : u.bio;
  const mine = posts.filter(p => p.authorId === userId && !p.hidden); const photos = mine.filter(p => p.image);
  const savedMap = {}; (savedPosts || []).concat(posts.filter(p => p.savedByMe)).forEach(p => { if (p.savedByMe && !p.hidden) savedMap[p.id] = p; }); const saved = Object.values(savedMap);
  const savedReels = (reels || []).filter(r => r.savedByMe);
  const myReels = (reels || []).filter(r => r.authorId === userId);
  const [profReels, setProfReels] = useState(null);
  useEffect(() => { let c = false; setProfReels(null); reelsApi.byAuthor(userId).then(rows => { if (!c) setProfReels(rows.map(rw => mapDbReel(rw, new Set(), new Set()))); }).catch(() => {}); return () => { c = true; }; }, [userId]);
  const gridReels = profReels || myReels;
  const reelViews = gridReels.reduce((s, r) => s + (r.views || 0), 0);
  const reelLikes = gridReels.reduce((s, r) => s + (r.likes || 0), 0);
  const selPost = sel ? (mine.find(p => p.id === sel) || saved.find(p => p.id === sel) || posts.find(p => p.id === sel)) : null;
  const { lvl } = levelInfo(xp || 0);
  const followers = (followerCounts && followerCounts[userId] != null) ? followerCounts[userId] : u.followers;
  const followingCount = isMe ? following.length : u.following;
  const amFollowing = following.includes(userId);
  const fmt = (n) => n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "ათ" : "" + n;
  return (
    <div className="pb-28 md:pb-10">
      <div className="relative">
        {u.cover ? <img src={u.cover} alt="" className="w-full" style={{ height: 168, objectFit: "cover" }} draggable={false} /> : <Pic src={img("cover" + userId, 800, 320)} grad={GRADS[hashIdx(userId, GRADS.length)]} className="w-full" style={{ height: 168 }} />}
        {isMe && onUploadCover && <label style={{ position: "absolute", right: 12, bottom: 12, cursor: "pointer", zIndex: 2 }}><input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files && e.target.files[0]; if (f) onUploadCover(f); e.target.value = ""; }} /><div className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 36, height: 36, background: "rgba(0,0,0,.5)", color: "#fff", backdropFilter: "blur(6px)" }}><Camera size={17} /></div></label>}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(0,0,0,.28), rgba(0,0,0,.04))" }} />
        <div className="absolute top-0 inset-x-0 flex items-center gap-3 px-4 py-3">
          {!isMe && <button onClick={onBack} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 38, height: 38, background: "rgba(0,0,0,.4)", color: "#fff", backdropFilter: "blur(6px)" }}><ArrowLeft size={20} /></button>}
          <div className="flex-1" />
          <button onClick={() => isMe ? onSettings() : setMenuOpen(true)} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 38, height: 38, background: "rgba(0,0,0,.4)", color: "#fff", backdropFilter: "blur(6px)" }}>{isMe ? <Settings size={19} /> : <MoreHorizontal size={20} />}</button>
        </div>
      </div>
      <div className="px-4">
        <div className="flex items-end justify-between" style={{ marginTop: 8 }}>
          <div className="rounded-full" style={{ padding: 6, background: C.paper, boxShadow: "0 8px 20px -6px rgba(0,0,0,.32)" }}>{isMe && onUploadAvatar ? <label style={{ position: "relative", cursor: "pointer", display: "block" }}><input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files && e.target.files[0]; if (f) onUploadAvatar(f); e.target.value = ""; }} /><Avatar id={u.id} size={84} /><div style={{ position: "absolute", right: 0, bottom: 0, width: 28, height: 28, borderRadius: "50%", backgroundImage: GBRAND, display: "flex", alignItems: "center", justifyContent: "center", border: `3px solid ${C.paper}` }}><Camera size={14} color="#fff" /></div></label> : <Avatar id={u.id} size={84} />}</div>
          {isMe
            ? <div className="mb-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundImage: GBRAND, color: "#fff", boxShadow: SH.glow }}><Zap size={14} fill="#fff" /><span className="text-[13px] font-bold" style={{ fontFamily: DISPLAY }}>LVL {lvl}</span></div>
            : blocked ? null : <div className="mb-2 flex gap-2"><button onClick={() => onToggleFollow(userId)} className="px-5 py-2 rounded-xl text-sm font-bold transition active:scale-95" style={amFollowing ? { background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` } : { backgroundImage: GBRAND, color: "#fff", boxShadow: SH.glow }}>{amFollowing ? "მიჰყვები ✓" : "მიყევი"}</button></div>}
        </div>
        <div className="mt-2.5 flex items-center gap-1.5"><span style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700, fontSize: 20 }}>{dispName}</span>{u.verified && <ShieldCheck size={17} style={{ color: C.accent }} />}</div>
        <Mono style={{ fontSize: 13, color: C.faint }}>@{u.handle}</Mono>
        <div className="text-[14px] mt-2" style={{ color: C.ink2, lineHeight: 1.5 }}>{dispBio}</div>
        {(u.location || u.website) && <div className="flex items-center gap-3 mt-2 text-[13px]" style={{ color: C.faint }}>{u.location && <span className="flex items-center gap-1"><MapPin size={13} /> {u.location}</span>}{u.website && <a href={u.website.startsWith("http") ? u.website : "https://" + u.website} target="_blank" rel="noreferrer" className="flex items-center gap-1" style={{ color: C.accent }}><Link2 size={13} /> <Mono style={{ fontSize: 12 }}>{u.website.replace(/^https?:\/\//, "")}</Mono></a>}</div>}
        <div className="grid grid-cols-3 mt-4 py-3.5" style={card()}>
          <div className="text-center"><Mono className="text-lg font-bold block" style={{ color: C.ink }}>{mine.length}</Mono><div className="text-[12px]" style={{ color: C.muted }}>პოსტი</div></div>
          <button onClick={() => onOpenList("followers", userId)} className="text-center active:opacity-60" style={{ borderLeft: `1px solid ${C.lineSoft}` }}><Mono className="text-lg font-bold block" style={{ color: C.ink }}>{fmt(followers)}</Mono><div className="text-[12px]" style={{ color: C.muted }}>მოგყვება</div></button>
          <button onClick={() => onOpenList("following", userId)} className="text-center active:opacity-60" style={{ borderLeft: `1px solid ${C.lineSoft}` }}><Mono className="text-lg font-bold block" style={{ color: C.ink }}>{fmt(followingCount)}</Mono><div className="text-[12px]" style={{ color: C.muted }}>მიყვები</div></button>
        </div>
        <div className="flex gap-2 mt-3">{isMe
          ? <button onClick={onSettings} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: C.surface, color: C.ink, border: `1px solid ${C.line}`, boxShadow: SH.card }}>პროფილის რედაქტირება</button>
          : blocked ? <button onClick={() => onUnblock(userId)} className="flex-1 py-2.5 rounded-xl text-sm font-bold transition active:scale-95" style={{ background: C.surfaceMuted, color: "#e05656", border: `1px solid ${C.line}` }}>🚫 განბლოკვა</button>
          : <><button onClick={() => onToggleFollow(userId)} className="flex-1 py-2.5 rounded-xl text-sm font-bold transition active:scale-95" style={amFollowing ? { background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` } : { backgroundImage: GBRAND, color: "#fff", boxShadow: SH.glow }}>{amFollowing ? "მიჰყვები ✓" : "მიყევი"}</button><button onClick={() => onMessage(userId)} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: C.surface, color: C.ink, border: `1px solid ${C.line}` }}>შეტყობინება</button></>}</div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar mt-4 pb-1">
          {isMe && <button onClick={() => setCreatingHl(true)} className="flex flex-col items-center gap-1.5 shrink-0"><div className="rounded-full flex items-center justify-center" style={{ width: 60, height: 60, border: `2px dashed ${C.line}`, color: C.muted }}><Plus size={22} /></div><span className="text-[11px]" style={{ color: C.muted }}>ახალი</span></button>}
          {hls.map(h => { const [ga, gb] = GRADS[hashIdx(h.id, GRADS.length)]; return <button key={h.id} onClick={() => setViewHl(h)} className="flex flex-col items-center gap-1.5 shrink-0"><div className="rounded-full p-[2px]" style={{ backgroundImage: GBRAND }}><div className="rounded-full p-[2px]" style={{ background: C.paper }}>{h.cover_url ? <img src={h.cover_url} alt="" style={{ width: 54, height: 54, objectFit: "cover", borderRadius: 999 }} /> : <div style={{ width: 54, height: 54, borderRadius: 999, background: `linear-gradient(140deg, ${ga}, ${gb})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontFamily: DISPLAY }}>{(h.title || "?").trim()[0]}</div>}</div></div><span className="text-[11px] truncate" style={{ color: C.ink2, maxWidth: 64 }}>{h.title}</span></button>; })}
        </div>
        {creatingHl && <HighlightCreate onClose={() => setCreatingHl(false)} onCreated={reloadHls} flash={flash} />}
        {viewHl && <HighlightView hl={viewHl} isMe={isMe} onClose={() => setViewHl(null)} onDelete={(h) => { highlightsApi.remove(h.id).then(() => { setViewHl(null); reloadHls(); flash("highlight წაიშალა"); }).catch(() => {}); }} />}
        {menuOpen && !isMe && (
          <div className="fixed inset-0 z-[70] flex items-end" style={{ background: "rgba(0,0,0,.45)", paddingBottom: "var(--mz-nav, 64px)" }} onClick={() => setMenuOpen(false)}>
            <div className="w-full rounded-t-3xl pb-6 pt-2" style={{ background: C.paper, maxWidth: 600, margin: "0 auto", animation: "up .25s ease both" }} onClick={e => e.stopPropagation()}>
              <div className="mx-auto rounded-full mb-2" style={{ width: 38, height: 4, background: C.line }} />
              <div className="px-5 pb-2 pt-1 text-[13px]" style={{ color: C.faint }}>@{u.handle}</div>
              <button onClick={() => { setMenuOpen(false); flash("პროფილის ლინკი დაკოპირდა"); }} className="w-full flex items-center gap-3 px-5 py-3.5 active:opacity-60" style={{ color: C.ink }}><Link2 size={20} style={{ color: C.muted }} /><span className="text-[15px] font-medium">ლინკის კოპირება</span></button>
              <button onClick={() => { setMenuOpen(false); setQrOpen(true); }} className="w-full flex items-center gap-3 px-5 py-3.5 active:opacity-60" style={{ color: C.ink }}><Send size={20} style={{ color: C.muted }} /><span className="text-[15px] font-medium">QR კოდი</span></button>
              {!blocked && <button onClick={() => { setMenuOpen(false); (muted ? onUnmute : onMute)(userId); }} className="w-full flex items-center gap-3 px-5 py-3.5 active:opacity-60" style={{ color: C.ink }}>{muted ? <Volume2 size={20} style={{ color: C.muted }} /> : <VolumeX size={20} style={{ color: C.muted }} />}<span className="text-[15px] font-medium">{muted ? "ხმის აღდგენა" : "გაჩუმება"}</span></button>}
              {!blocked && <button onClick={() => { setMenuOpen(false); onToggleCloseFriend(userId); }} className="w-full flex items-center gap-3 px-5 py-3.5 active:opacity-60" style={{ color: C.ink }}><Star size={20} style={{ color: closeFriend ? "#1f8f4e" : C.muted }} fill={closeFriend ? "#1f8f4e" : "none"} /><span className="text-[15px] font-medium">{closeFriend ? "ახლო მეგობრებიდან ამოშლა" : "ახლო მეგობრად დამატება"}</span></button>}
              <button onClick={() => { setMenuOpen(false); flash("რეპორტი გაიგზავნა 🚩"); }} className="w-full flex items-center gap-3 px-5 py-3.5 active:opacity-60" style={{ color: C.ink }}><Flag size={20} style={{ color: C.muted }} /><span className="text-[15px] font-medium">რეპორტი</span></button>
              <button onClick={() => { setMenuOpen(false); (blocked ? onUnblock : onBlock)(userId); }} className="w-full flex items-center gap-3 px-5 py-3.5 active:opacity-60" style={{ color: "#e05656" }}><Shield size={20} /><span className="text-[15px] font-semibold">{blocked ? "განბლოკვა" : "დაბლოკვა"}</span></button>
            </div>
          </div>
        )}
        {qrOpen && (() => {
          const link = (typeof location !== "undefined" ? location.origin : "https://mzera2.vercel.app") + "/?u=" + u.handle;
          const qr = "https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=12&data=" + encodeURIComponent(link);
          return (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,.65)" }} onClick={() => setQrOpen(false)}>
              <div className="w-full max-w-xs rounded-3xl p-6 text-center" style={{ background: C.paper, animation: "pop .25s ease both" }} onClick={e => e.stopPropagation()}>
                <div className="flex justify-center mb-2"><Avatar id={u.id} size={56} /></div>
                <div className="text-[17px] font-bold" style={{ color: C.ink, fontFamily: DISPLAY }}>{u.name}</div>
                <div className="text-[13px] mb-4" style={{ color: C.muted }}>@{u.handle}</div>
                <div className="rounded-2xl p-3 inline-block" style={{ background: "#fff", boxShadow: SH.card }}><img src={qr} alt="QR" width={220} height={220} style={{ display: "block", borderRadius: 8 }} /></div>
                <button onClick={() => { if (navigator.clipboard) navigator.clipboard.writeText(link).then(() => flash("ლინკი დაკოპირდა 🔗")).catch(() => {}); else flash("ლინკი: " + link); }} className="w-full mt-4 py-3 rounded-2xl text-[14px] font-bold text-white active:scale-[.98]" style={{ backgroundImage: GBRAND }}>ლინკის კოპირება</button>
                <button onClick={() => setQrOpen(false)} className="w-full mt-2 py-2.5 rounded-2xl text-[14px] font-bold" style={{ background: C.surfaceMuted, color: C.ink }}>დახურვა</button>
              </div>
            </div>
          );
        })()}
      </div>
      <div className="flex mt-5" style={{ borderBottom: `1px solid ${C.line}` }}>{[["grid", "ფოტოები"], ["reels", "Reels"], ["posts", "პოსტები"], ...(isMe ? [["saved", "შენახული"]] : [])].map(([k, l]) => <button key={k} onClick={() => setTab(k)} className="flex-1 py-3 text-sm font-bold transition" style={{ color: tab === k ? C.accent : C.faint, borderBottom: tab === k ? `2px solid ${C.accent}` : "2px solid transparent" }}>{l}</button>)}</div>
      {tab === "grid" && (mine.length ? <div className="grid grid-cols-3 gap-1 px-1 pt-1">{mine.map(p => <button key={p.id} onClick={() => setSel(p.id)} className="relative active:opacity-80 overflow-hidden" style={{ aspectRatio: "1", borderRadius: 10 }}>{p.image ? <Pic src={p.image} grad={GRADS[hashIdx(p.id, GRADS.length)]} round={10} style={{ aspectRatio: "1" }} /> : <div className="w-full h-full flex items-center justify-center p-2.5" style={{ background: C.surfaceMuted }}><div className="text-[12px] text-center line-clamp-5" style={{ color: C.ink2, lineHeight: 1.45 }}>{(p.text || "პოსტი").slice(0, 120)}</div></div>}{p.likes > 0 && <span className="absolute bottom-1 left-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full" style={{ background: "rgba(0,0,0,.55)", color: "#fff" }}><Heart size={10} fill="#fff" /><Mono style={{ fontSize: 10 }}>{p.likes}</Mono></span>}</button>)}</div> : <Empty icon={Camera} t="ჯერ პოსტი არ არის" s="გაზიარებული პოსტები აქ გამოჩნდება." />)}
      {tab === "posts" && <div className="space-y-4 px-3 pt-4">{mine.length ? mine.map(p => <PostCard key={p.id} post={p} onLike={onLike} onReact={onReact} onSave={onSave} onComment={onComment} onPollVote={onPollVote} onTag={onTag} onReport={onReport} onRemove={onRemove} onOpenProfile={onOpenProfile} isAdmin={isAdmin} onEdit={onEditPost} onDelete={onDeletePost} onEditComment={onEditComment} onDeleteComment={onDeleteComment} />) : <Empty icon={ImageIcon} t="პოსტი არ არის" s="" />}</div>}
      {tab === "reels" && ((gridReels.length || isMe) ? <div className="pt-1">
        {isMe && gridReels.length > 0 && <div className="grid grid-cols-3 gap-2 px-3 pb-3">
          {[["ნახვა", reelViews, "#6750F2"], ["მოწონება", reelLikes, C.like], ["რეელი", gridReels.length, C.accent]].map(([lab, val, col]) => <div key={lab} className="rounded-2xl py-3 text-center" style={{ background: C.surface, border: `1px solid ${C.line}` }}><div className="text-[20px] font-bold" style={{ color: col, fontFamily: DISPLAY }}>{kfmt(val)}</div><div className="text-[11px] mt-0.5" style={{ color: C.muted }}>{lab}</div></div>)}
        </div>}
        <div className="grid grid-cols-3 gap-1 px-1">
        {isMe && <button onClick={onAddReel} className="flex flex-col items-center justify-center gap-1 active:scale-95" style={{ aspectRatio: "9/16", borderRadius: 10, background: C.accentSoft, color: C.accent, border: `2px dashed ${C.accent}66` }}><Plus size={26} /><span className="text-[11px] font-bold">ახალი</span></button>}
        {gridReels.map(r => (
          <div key={r.id} className="relative overflow-hidden" style={{ aspectRatio: "9/16", borderRadius: 10 }}>
            <button onClick={() => onOpenReels && onOpenReels()} className="block w-full h-full active:opacity-80">{r.image ? <Pic src={r.image} grad={GRADS[hashIdx(r.id, GRADS.length)]} round={10} style={{ aspectRatio: "9/16" }} /> : r.video ? <video src={r.video + "#t=0.1"} preload="metadata" muted playsInline className="w-full h-full" style={{ objectFit: "cover", borderRadius: 10, aspectRatio: "9/16", background: "#000" }} /> : <Pic src={null} grad={GRADS[hashIdx(r.id, GRADS.length)]} round={10} style={{ aspectRatio: "9/16" }} />}</button>
            <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1" style={{ color: "#fff", filter: "drop-shadow(0 1px 2px rgba(0,0,0,.7))" }}><Play size={12} fill="#fff" /><Mono style={{ fontSize: 11, fontWeight: 700 }}>{kfmt(r.views || 0)}</Mono></span>
            {isMe && <div className="absolute top-1 right-1 flex flex-col gap-1">
              <button onClick={() => { setEditReel(r.id); setEditCap(r.caption || ""); }} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 27, height: 27, background: "rgba(0,0,0,.6)", color: "#fff" }}><Settings size={13} /></button>
              <button onClick={() => { if (window.confirm("წავშალო ეს reel? დაბრუნება ვერ მოხერხდება.")) onReelDelete(r.id); }} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 27, height: 27, background: "rgba(220,38,38,.85)", color: "#fff" }}><Trash2 size={13} /></button>
            </div>}
          </div>
        ))}
      </div></div> : <Empty icon={Film} t="reels არ არის" s="" />)}
      {tab === "saved" && (() => {
        const cols = collections || [];
        const colOf = {}; (savedPosts || []).forEach(p => { colOf[p.id] = p.collectionId || null; });
        const allSaved = [...savedReels.map(r => ({ type: "reel", id: r.id, image: r.image, video: r.video, collectionId: null })), ...saved.map(p => ({ type: "post", id: p.id, image: p.image, text: p.text, collectionId: colOf[p.id] || null }))];
        const savedItems = selCol === null ? allSaved : allSaved.filter(it => it.type === "post" && it.collectionId === selCol);
        return (
          <div className="pt-1">
            {isMe && (allSaved.length > 0 || cols.length > 0) && <div className="flex gap-2 overflow-x-auto no-scrollbar px-3 pb-2">
              <button onClick={() => setSelCol(null)} className="px-3.5 py-1.5 rounded-full text-[13px] font-bold shrink-0" style={selCol === null ? { backgroundImage: GBRAND, color: "#fff" } : { background: C.surfaceMuted, color: C.muted }}>ყველა</button>
              {cols.map(c => <button key={c.id} onClick={() => setSelCol(c.id)} className="px-3.5 py-1.5 rounded-full text-[13px] font-bold shrink-0" style={selCol === c.id ? { backgroundImage: GBRAND, color: "#fff" } : { background: C.surfaceMuted, color: C.muted }}>📁 {c.name}</button>)}
              <button onClick={async () => { const n = window.prompt("ფოლდერის სახელი:"); if (n) await onCreateCollection(n); }} className="px-3.5 py-1.5 rounded-full text-[13px] font-bold shrink-0 flex items-center gap-1" style={{ background: C.accentSoft, color: C.accentText }}><Plus size={14} /> ახალი</button>
            </div>}
            {savedItems.length ? <div className="grid grid-cols-3 gap-1 px-1">{savedItems.map(it => (
              <div key={it.type + it.id} className="relative overflow-hidden" style={{ aspectRatio: "1", borderRadius: 10 }}>
                <button onClick={() => it.type === "reel" ? (onOpenReels && onOpenReels()) : setSel(it.id)} className="block w-full h-full active:opacity-80">{it.image ? <Pic src={it.image} grad={GRADS[hashIdx(it.id, GRADS.length)]} round={10} style={{ aspectRatio: "1" }} /> : it.video ? <video src={it.video + "#t=0.1"} preload="metadata" muted playsInline className="w-full h-full" style={{ objectFit: "cover", borderRadius: 10, aspectRatio: "1", background: "#000" }} /> : <div className="w-full h-full flex items-center justify-center p-2" style={{ background: C.surfaceMuted }}><div className="text-[11px] text-center line-clamp-4" style={{ color: C.ink2 }}>{(it.text || "პოსტი").slice(0, 80)}</div></div>}</button>
                {it.type === "reel" && <span className="absolute top-1.5 right-1.5 pointer-events-none" style={{ color: "#fff", filter: "drop-shadow(0 1px 2px rgba(0,0,0,.6))" }}><Play size={15} fill="#fff" /></span>}
                {isMe && it.type === "post" && <button onClick={() => setAssignFor(it.id)} className="absolute bottom-1.5 right-1.5 rounded-full flex items-center justify-center active:scale-90" style={{ width: 26, height: 26, background: "rgba(0,0,0,.55)" }}><span style={{ fontSize: 13 }}>📁</span></button>}
              </div>
            ))}</div> : <Empty icon={Bookmark} t={selCol ? "ფოლდერი ცარიელია" : "ჯერ არაფერი შეგინახავს"} s={selCol ? "გადაიტანე პოსტები აქ 📁 ღილაკით" : "დააჭირე bookmark-ს ან reel-ის შენახვის ღილაკს."} />}
          </div>
        );
      })()}
      {assignFor && (
        <div className="fixed inset-0 z-[70] flex items-end" style={{ background: "rgba(0,0,0,.45)" }} onClick={() => setAssignFor(null)}>
          <div className="w-full rounded-t-3xl pb-6 pt-2" style={{ background: C.paper, maxWidth: 600, margin: "0 auto", animation: "up .25s ease both" }} onClick={e => e.stopPropagation()}>
            <div className="mx-auto rounded-full mb-2" style={{ width: 38, height: 4, background: C.line }} />
            <div className="px-5 py-2 text-[13px] font-bold" style={{ color: C.muted }}>ფოლდერში გადატანა</div>
            {(collections || []).map(c => <button key={c.id} onClick={() => { onAssignCollection(assignFor, c.id); setAssignFor(null); }} className="w-full flex items-center gap-3 px-5 py-3.5 active:opacity-60" style={{ color: C.ink }}><span style={{ fontSize: 18 }}>📁</span><span className="text-[15px] font-medium">{c.name}</span></button>)}
            <button onClick={async () => { const n = window.prompt("ფოლდერის სახელი:"); if (n) { const c = await onCreateCollection(n); if (c) { onAssignCollection(assignFor, c.id); setAssignFor(null); } } }} className="w-full flex items-center gap-3 px-5 py-3.5 active:opacity-60" style={{ color: C.accent }}><Plus size={20} /><span className="text-[15px] font-medium">ახალი ფოლდერი</span></button>
            <button onClick={() => { onAssignCollection(assignFor, null); setAssignFor(null); }} className="w-full flex items-center gap-3 px-5 py-3.5 active:opacity-60" style={{ color: "#e05656" }}><X size={20} /><span className="text-[15px] font-medium">ფოლდერიდან ამოღება</span></button>
          </div>
        </div>
      )}

      {selPost && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto" style={{ background: "rgba(0,0,0,.55)" }} onClick={() => setSel(null)}>
          <div className="w-full max-w-[540px] min-h-full md:min-h-0 md:my-6" style={{ background: C.paper }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3 sticky top-0 z-10" style={{ background: C.paper + "e6", backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.line}` }}><button onClick={() => setSel(null)} style={{ color: C.ink2 }}><ArrowLeft size={22} /></button><span className="font-bold" style={{ color: C.ink, fontFamily: DISPLAY }}>პოსტი</span></div>
            <div className="p-3"><PostCard post={selPost} onLike={onLike} onReact={onReact} onSave={onSave} onComment={onComment} onPollVote={onPollVote} onTag={onTag} onReport={onReport} onRemove={onRemove} onOpenProfile={onOpenProfile} isAdmin={isAdmin} onEdit={onEditPost} onDelete={onDeletePost} onEditComment={onEditComment} onDeleteComment={onDeleteComment} /></div>
          </div>
        </div>
      )}
      {editReel && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-5" style={{ background: "rgba(0,0,0,.55)" }} onClick={() => setEditReel(null)}>
          <div className="w-full max-w-[440px] rounded-3xl p-5" style={{ background: C.surface, boxShadow: SH.pop }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="text-[17px]" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700 }}>Reel-ის რედაქტირება</h2><button onClick={() => setEditReel(null)} style={{ color: C.faint }}><X size={22} /></button></div>
            <textarea value={editCap} onChange={e => setEditCap(e.target.value)} rows={3} placeholder="წარწერა…" className="w-full px-4 py-3 rounded-xl mb-3 text-[15px] outline-none resize-none" style={{ background: C.surfaceMuted, color: C.ink }} />
            <button onClick={() => { onReelEdit(editReel, editCap.trim()); setEditReel(null); flash && flash("Reel განახლდა ✓"); }} className="w-full py-3.5 rounded-xl text-[15px] font-bold text-white active:scale-[.98]" style={{ backgroundImage: GBRAND }}>შენახვა</button>
          </div>
        </div>
      )}
    </div>
  );
}


export function Notifications({ notifs, onOpenProfile, isFollowing, onToggleFollow }) {
  const verb = { ...NOTIF_VERB, like: "მოიწონა შენი პოსტი", comment: "დააკომენტარა", follow: "გამოგყვა", mention: "მოგიხსენია პოსტში" };
  const Icon = { like: Heart, comment: MessageCircle, follow: User, mention: Hash, announcement: Bell, public_approved: Check, public_rejected: X }; const col = { like: C.like, comment: C.accent, follow: C.online, mention: C.star, announcement: C.accent, public_approved: C.online, public_rejected: C.like };
  return (
    <div className="pb-28 md:pb-8"><div className="px-4 pt-5 pb-3"><Title>აქტივობა</Title></div>
      {notifs.length === 0 && <div className="flex flex-col items-center justify-center text-center px-10" style={{ paddingTop: 90, color: C.faint }}><div className="rounded-3xl flex items-center justify-center mb-4" style={{ width: 76, height: 76, background: C.accentSoft }}><Bell size={34} style={{ color: C.accent }} /></div><div className="text-[15px] font-bold mb-1.5" style={{ color: C.ink2 }}>აქტივობა ჯერ არ არის</div><div className="text-[13px]" style={{ lineHeight: 1.5 }}>როცა ვინმე მოგიწონებს პოსტს, დააკომენტარებს ან გამოგყვება — აქ გამოჩნდება 🔔</div></div>}
      {notifs.map(n => { const I = Icon[n.type] || Bell; return (
        <button key={n.id} onClick={() => onOpenProfile(n.fromId)} className="w-full flex items-center gap-3 px-4 py-3 text-left transition hover:opacity-90" style={{ background: n.read ? "transparent" : C.accentSoft + "66", borderBottom: `1px solid ${C.lineSoft}` }}><div className="relative"><Avatar id={n.fromId} size={46} /><span className="absolute -bottom-1 -right-1 rounded-full flex items-center justify-center" style={{ width: 22, height: 22, background: col[n.type] || C.accent, border: `2px solid ${C.paper}` }}><I size={12} color="#fff" fill="#fff" /></span></div><div className="flex-1 text-[14px]" style={{ color: C.ink2, lineHeight: 1.4 }}><span className="font-bold" style={{ color: C.ink }}>{USERS[n.fromId] ? USERS[n.fromId].name.split(" ")[0] : "mzera"} </span>{verb[n.type] || ""}{n.text && <span style={{ color: C.muted }}>: „{n.text}"</span>}<Mono className="ml-1" style={{ color: C.faint, fontSize: 12 }}>· {n.time}</Mono></div>{n.type === "follow" ? <FollowBtn id={n.fromId} isFollowing={isFollowing} onToggle={onToggleFollow} /> : (n.postImage || (n.type !== "announcement" && n.type !== "public_approved" && n.type !== "public_rejected")) ? <Pic src={n.postImage} grad={GRADS[hashIdx(n.id, GRADS.length)]} round={12} style={{ width: 48, height: 48 }} className="shrink-0" /> : null}</button>
      ); })}
    </div>
  );
}

/* ─────────────────────────  ADMIN  ───────────────────────── */

export function Admin({ reports, posts, allUsers, userCount, postCount, online, stats, onResolve, onRemovePost, onSetVerified, onSetAdmin, onOpenProfile, onBanUser, onGrantXp, onSetXp, onDeleteUser, onBroadcast, pendingPublic, onReviewPublic, listings, threads, reels, onDeleteListing, onDeleteThread, onDeleteReel }) {
  const [seg, setSeg] = useState("reports"); const [q, setQ] = useState(""); const [cseg, setCseg] = useState("listings"); const [confirm, setConfirm] = useState(null); const [bcast, setBcast] = useState(""); const [delUser, setDelUser] = useState(null);
  const open = reports.filter(r => r.status === "open");
  const S = stats || {};
  const statCards = stats ? [{ l: "მომხმარებელი", v: S.users, i: User, c: C.accent }, { l: "პოსტი", v: S.posts, i: ImageIcon, c: C.online }, { l: "Reels", v: S.reels, i: Film, c: C.cyan }, { l: "განცხადება", v: S.listings, i: ShoppingBag, c: C.accent }, { l: "კომენტარი", v: S.comments, i: MessageSquare, c: C.online }, { l: "მესიჯი", v: S.messages, i: Send, c: C.cyan }, { l: "ახალი დღეს", v: S.new_today, i: UserPlus, c: C.online }, { l: "ვერიფ.", v: S.verified, i: ShieldCheck, c: C.accent }, { l: "დაბანილი", v: S.banned, i: X, c: C.like }, { l: "ღია რეპორტი", v: S.open_reports, i: Flag, c: C.like }] : [{ l: "მომხმარებელი", v: userCount || 0, i: User, c: C.accent }, { l: "სულ პოსტი", v: postCount || 0, i: ImageIcon, c: C.online }, { l: "ღია რეპორტი", v: open.length, i: Flag, c: C.like }, { l: "ონლაინ ახლა", v: online || 0, i: Zap, c: C.cyan }];
  const ql = q.trim().toLowerCase();
  const users = (allUsers || []).filter(u => !ql || (u.name || "").toLowerCase().includes(ql) || (u.username || "").toLowerCase().includes(ql));
  const allPosts = (posts || []).filter(p => !p.hidden).filter(p => !ql || (p.text || "").toLowerCase().includes(ql) || (USERS[p.authorId] && USERS[p.authorId].name.toLowerCase().includes(ql)));
  return (
    <div className="pb-28 md:pb-10">
      <div className="flex items-center gap-2 px-4 pt-5 pb-4"><Shield size={24} style={{ color: C.accent }} /><Title>მოდერაცია</Title></div>
      <div className="grid grid-cols-2 gap-2.5 px-4 mb-4">{statCards.map(s => <div key={s.l} className="p-4" style={card()}><div className="rounded-xl flex items-center justify-center mb-2.5" style={{ width: 36, height: 36, background: s.c + "22" }}><s.i size={18} color={s.c} /></div><Mono className="text-2xl font-bold" style={{ color: C.ink }}>{(s.v || 0).toLocaleString()}</Mono><div className="text-[12px]" style={{ color: C.muted }}>{s.l}</div></div>)}</div>

      <div className="px-4 mb-3"><div className="flex gap-1 p-1 rounded-2xl overflow-x-auto no-scrollbar" style={{ background: C.surfaceMuted }}>{[["reports", "რეპორტები"], ["pending", "🌍 საჯარო" + ((pendingPublic || []).length ? " (" + pendingPublic.length + ")" : "")], ["users", "მომხმარებლები"], ["posts", "პოსტები"], ["content", "კონტენტი"], ["broadcast", "📢 გზავნილი"]].map(([k, l]) => <button key={k} onClick={() => setSeg(k)} className="flex-1 py-2 px-3 rounded-xl text-[13px] font-bold transition whitespace-nowrap" style={seg === k ? { background: C.surface, color: C.accent, boxShadow: SH.card } : { color: C.muted }}>{l}</button>)}</div></div>

      {seg === "pending" && <div className="px-4">
        {(pendingPublic || []).length === 0 ? <Empty icon={Check} t="სუფთაა ✨" s="მომლოდინე საჯარო განცხადება არ არის." /> : (
          <div className="space-y-3">{pendingPublic.map(p => (
            <div key={p.id} className="p-4" style={card()}>
              <div className="flex items-start gap-3">
                <button onClick={() => onOpenProfile(p.authorId)} className="shrink-0"><Avatar id={p.authorId} size={40} /></button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5"><span className="font-bold text-[14px]" style={{ color: C.ink }}>{USERS[p.authorId] ? USERS[p.authorId].name : "—"}</span><span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: C.accentSoft, color: C.accentText }}>🌍 საჯარო</span></div>
                  <Mono style={{ fontSize: 11, color: C.faint }}>@{USERS[p.authorId] ? USERS[p.authorId].handle : ""} · {p.time}</Mono>
                </div>
              </div>
              {p.text && <div className="text-[14px] mt-2.5" style={{ color: C.ink2, lineHeight: 1.5 }}>{p.text}</div>}
              {p.image && <Pic src={p.image} grad={GRADS[hashIdx(p.id, GRADS.length)]} round={14} className="mt-2.5 w-full" style={{ maxHeight: 260, objectFit: "cover" }} />}
              <div className="flex gap-2 mt-3">
                <button onClick={() => onReviewPublic(p.id, false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5" style={{ background: C.likeSoft, color: C.like }}><X size={15} /> უარყოფა</button>
                <button onClick={() => onReviewPublic(p.id, true)} className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 text-white" style={{ backgroundImage: GBRAND }}><Check size={15} /> დამტკიცება</button>
              </div>
            </div>
          ))}</div>
        )}
      </div>}

      {seg === "broadcast" && <div className="px-4">
        <div className="p-4" style={card()}>
          <div className="flex items-center gap-2 mb-1"><Send size={18} style={{ color: C.accent }} /><span className="font-bold text-[15px]" style={{ color: C.ink }}>გზავნილი ყველას</span></div>
          <div className="text-[12px] mb-3" style={{ color: C.faint }}>ყველა {(S.users || (allUsers || []).length).toLocaleString()} მომხმარებელი მიიღებს შეტყობინებას</div>
          <textarea value={bcast} onChange={e => setBcast(e.target.value)} rows={4} placeholder="დაწერე განცხადება… 📢" className="w-full resize-none px-3.5 py-3 rounded-xl outline-none text-[15px]" style={{ background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` }} />
          <button disabled={!bcast.trim()} onClick={() => { onBroadcast(bcast.trim()); setBcast(""); }} className="w-full mt-3 py-3 rounded-2xl text-[15px] font-bold text-white active:scale-[.98] flex items-center justify-center gap-2" style={{ backgroundImage: GBRAND, opacity: bcast.trim() ? 1 : 0.4 }}><Send size={17} /> გაგზავნა ყველასთან</button>
        </div>
      </div>}

      {(seg === "users" || seg === "posts" || seg === "content") && <div className="px-4 mb-3"><div className="flex items-center gap-2 px-3 py-2.5 rounded-full" style={{ background: C.surfaceMuted }}><Search size={16} style={{ color: C.faint }} /><input value={q} onChange={e => setQ(e.target.value)} placeholder={seg === "users" ? "მოძებნე მომხმარებელი…" : seg === "content" ? "მოძებნე კონტენტი…" : "მოძებნე პოსტი…"} className="flex-1 bg-transparent text-[14px] outline-none" style={{ color: C.ink }} /></div></div>}

      {seg === "reports" && <div className="px-4">
        {open.length === 0 ? <Empty icon={Check} t="სუფთაა ✨" s="ღია რეპორტი არ არის." /> : (
          <div className="space-y-3">{open.map(r => { const target = r.type === "post" ? posts.find(p => p.id === r.targetId) : USERS[r.targetId]; return (
            <div key={r.id} className="p-4" style={card()}>
              <div className="flex items-start gap-3"><span className="rounded-lg px-2 py-1 text-[11px] font-bold uppercase shrink-0" style={{ background: r.type === "post" ? C.accentSoft : C.likeSoft, color: r.type === "post" ? C.accentText : C.like, fontFamily: MONO }}>{r.type === "post" ? "POST" : "USER"}</span><div className="flex-1 min-w-0"><div className="text-[14px] font-bold" style={{ color: C.ink }}>{r.reason}</div><div className="text-[12px] mt-0.5" style={{ color: C.faint }}>დაარეპორტა {USERS[r.reporterId].name.split(" ")[0]} · <Mono>{r.time}</Mono></div></div></div>
              <div className="rounded-xl p-3 mt-3 text-[13px]" style={{ background: C.surfaceMuted }}>{r.type === "post" && target ? <div className="flex gap-2"><Avatar id={target.authorId} size={28} /><div className="min-w-0"><div className="font-bold text-[13px]" style={{ color: C.ink }}>{USERS[target.authorId].name.split(" ")[0]}</div><div className="line-clamp-2" style={{ color: C.muted }}>{target.text || "(ფოტო პოსტი)"}</div></div></div> : <div className="flex gap-2 items-center"><Avatar id={r.targetId} size={28} /><div><div className="font-bold text-[13px]" style={{ color: C.ink }}>{USERS[r.targetId]?.name}</div><Mono style={{ color: C.muted, fontSize: 12 }}>@{USERS[r.targetId]?.handle}</Mono></div></div>}</div>
              <div className="flex gap-2 mt-3"><button onClick={() => onResolve(r.id)} className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5" style={{ background: C.surface, color: C.ink2, border: `1px solid ${C.line}` }}><Check size={15} /> დახურვა</button>{r.type === "post" && target ? <button onClick={() => { onRemovePost(r.targetId); onResolve(r.id); }} className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5" style={{ background: C.likeSoft, color: C.like }}><Trash2 size={15} /> პოსტის წაშლა</button> : <button onClick={() => onResolve(r.id)} className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5" style={{ background: C.likeSoft, color: C.like }}><Shield size={15} /> დახურვა</button>}</div>
            </div>
          ); })}</div>
        )}
      </div>}

      {seg === "users" && <div className="px-3 space-y-2">{users.length === 0 ? <Empty icon={User} t="არ მოიძებნა" s="" /> : users.map(u => (
        <div key={u.id} className="p-3" style={card()}>
          <div className="flex items-center gap-3">
            <button onClick={() => onOpenProfile(u.id)} className="relative shrink-0"><Avatar id={u.id} size={42} />{u.banned && <span className="absolute -bottom-1 -right-1 rounded-full flex items-center justify-center" style={{ width: 18, height: 18, background: C.like, border: `2px solid ${C.surface}` }}><X size={11} color="#fff" /></span>}</button>
            <div className="flex-1 min-w-0"><div className="flex items-center gap-1 flex-wrap"><span className="font-bold text-[14px] truncate" style={{ color: C.ink }}>{u.name}</span>{u.verified && <ShieldCheck size={14} style={{ color: C.accent }} />}{u.is_admin && <span className="text-[9px] font-bold px-1 rounded" style={{ background: C.accentSoft, color: C.accentText }}>ADMIN</span>}{u.banned && <span className="text-[9px] font-bold px-1 rounded" style={{ background: C.likeSoft, color: C.like }}>ბანი</span>}</div><Mono style={{ fontSize: 12, color: C.faint }} className="block truncate">@{u.username} · {(u.xp || 0)} XP</Mono></div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            <button onClick={() => onSetVerified(u.id, !u.verified)} className="px-2.5 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1" style={u.verified ? { background: C.accentSoft, color: C.accentText } : { background: C.surfaceMuted, color: C.muted }}><ShieldCheck size={12} /> {u.verified ? "ვერიფ. ✓" : "ვერიფ."}</button>
            <button onClick={() => onSetAdmin(u.id, !u.is_admin)} className="px-2.5 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1" style={u.is_admin ? { background: C.accentSoft, color: C.accentText } : { background: C.surfaceMuted, color: C.muted }}><Shield size={12} /> {u.is_admin ? "admin ✓" : "admin"}</button>
            <button onClick={() => onGrantXp(u.id, 50)} className="px-2.5 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1" style={{ background: C.surfaceMuted, color: C.ink2 }}><Zap size={12} /> +50 XP</button>
            <button onClick={() => onBanUser(u.id, !u.banned)} className="px-2.5 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1" style={u.banned ? { background: C.online + "22", color: C.online } : { background: C.likeSoft, color: C.like }}>{u.banned ? <><Check size={12} /> ბლოკის მოხსნა</> : <><X size={12} /> ბლოკი</>}</button>
            <button onClick={() => { const v = window.prompt("ზუსტი XP:", u.xp || 0); if (v !== null && v.trim() !== "" && !isNaN(+v)) onSetXp(u.id, +v); }} className="px-2.5 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1" style={{ background: C.surfaceMuted, color: C.ink2 }}><Zap size={12} /> XP ⚙</button>
            <button onClick={() => setDelUser(u)} className="px-2.5 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1" style={{ background: C.like, color: "#fff" }}><Trash2 size={12} /> წაშლა</button>
          </div>
        </div>
      ))}</div>}

      {seg === "posts" && <div className="px-3 space-y-2">{allPosts.length === 0 ? <Empty icon={ImageIcon} t="არ მოიძებნა" s="" /> : allPosts.map(p => (
        <div key={p.id} className="p-3 flex items-center gap-3" style={card()}>
          {p.image ? <Pic src={p.image} grad={GRADS[hashIdx(p.id, GRADS.length)]} round={10} style={{ width: 46, height: 46 }} /> : <div className="rounded-xl flex items-center justify-center shrink-0" style={{ width: 46, height: 46, background: C.surfaceMuted }}><ImageIcon size={18} style={{ color: C.faint }} /></div>}
          <div className="flex-1 min-w-0"><button onClick={() => onOpenProfile(p.authorId)} className="font-bold text-[13px] block truncate text-left" style={{ color: C.ink }}>{USERS[p.authorId] ? USERS[p.authorId].name.split(" ")[0] : "—"}</button><div className="text-[13px] line-clamp-1" style={{ color: C.muted }}>{p.text || "(ფოტო პოსტი)"}</div><Mono style={{ fontSize: 11, color: C.faint }}>❤ {p.likes} · 💬 {p.comments.length}</Mono></div>
          <button onClick={() => { if (window.confirm("წავშალო ეს პოსტი?")) onRemovePost(p.id); }} className="rounded-full flex items-center justify-center active:scale-90 shrink-0" style={{ width: 38, height: 38, background: C.likeSoft, color: C.like }}><Trash2 size={16} /></button>
        </div>
      ))}</div>}

      {seg === "content" && <div className="px-3">
        <div className="flex gap-1 p-1 rounded-2xl mb-3" style={{ background: C.surfaceMuted }}>{[["listings", "განცხადებები"], ["threads", "თემები"], ["reels", "Reels"]].map(([k, l]) => <button key={k} onClick={() => setCseg(k)} className="flex-1 py-2 rounded-xl text-[12px] font-bold transition" style={cseg === k ? { background: C.surface, color: C.accent, boxShadow: SH.card } : { color: C.muted }}>{l}</button>)}</div>
        {cseg === "listings" && <div className="space-y-2">{(() => { const items = (listings || []).filter(l => !ql || (l.title || "").toLowerCase().includes(ql)); return items.length === 0 ? <Empty icon={ShoppingBag} t="ცარიელია" s="" /> : items.map(l => (
          <div key={l.id} className="p-3 flex items-center gap-3" style={card()}>
            <Pic src={l.image} grad={GRADS[hashIdx(l.id, GRADS.length)]} round={10} style={{ width: 46, height: 46 }} />
            <div className="flex-1 min-w-0"><div className="font-bold text-[13px] truncate" style={{ color: C.ink }}>{l.title}</div><div className="text-[12px]" style={{ color: C.accent, fontWeight: 700 }}>{(l.price || 0).toLocaleString()}₾</div><Mono style={{ fontSize: 11, color: C.faint }} className="truncate block">{USERS[l.sellerId] ? USERS[l.sellerId].name.split(" ")[0] : "—"}</Mono></div>
            <button onClick={() => { if (window.confirm("წავშალო ეს განცხადება?")) onDeleteListing(l.id); }} className="rounded-full flex items-center justify-center active:scale-90 shrink-0" style={{ width: 38, height: 38, background: C.likeSoft, color: C.like }}><Trash2 size={16} /></button>
          </div>
        )); })()}</div>}
        {cseg === "threads" && <div className="space-y-2">{(() => { const items = (threads || []).filter(t => !ql || (t.title || "").toLowerCase().includes(ql)); return items.length === 0 ? <Empty icon={MessageSquare} t="ცარიელია" s="" /> : items.map(t => (
          <div key={t.id} className="p-3 flex items-center gap-3" style={card()}>
            <div className="rounded-xl flex items-center justify-center shrink-0" style={{ width: 40, height: 40, background: catColor(t.cat) + "1f" }}><MessageSquare size={18} style={{ color: catColor(t.cat) }} /></div>
            <div className="flex-1 min-w-0"><div className="font-bold text-[13px] truncate" style={{ color: C.ink }}>{t.title}</div><div className="text-[12px] line-clamp-1" style={{ color: C.muted }}>{t.body}</div><Mono style={{ fontSize: 11, color: C.faint }} className="truncate block">{USERS[t.authorId] ? USERS[t.authorId].name.split(" ")[0] : "—"}</Mono></div>
            <button onClick={() => { if (window.confirm("წავშალო ეს თემა?")) onDeleteThread(t.id); }} className="rounded-full flex items-center justify-center active:scale-90 shrink-0" style={{ width: 38, height: 38, background: C.likeSoft, color: C.like }}><Trash2 size={16} /></button>
          </div>
        )); })()}</div>}
        {cseg === "reels" && <div className="space-y-2">{(() => { const items = (reels || []).filter(r => !ql || (r.caption || "").toLowerCase().includes(ql)); return items.length === 0 ? <Empty icon={Film} t="ცარიელია" s="" /> : items.map(r => (
          <div key={r.id} className="p-3 flex items-center gap-3" style={card()}>
            <Pic src={r.image} grad={GRADS[hashIdx(r.id, GRADS.length)]} round={10} style={{ width: 46, height: 46 }} />
            <div className="flex-1 min-w-0"><div className="text-[13px] line-clamp-1" style={{ color: C.ink }}>{r.caption || "(უსათაურო)"}</div><Mono style={{ fontSize: 11, color: C.faint }} className="truncate block">{USERS[r.authorId] ? USERS[r.authorId].name.split(" ")[0] : "—"} · ❤ {r.likes || 0}</Mono></div>
            <button onClick={() => { if (window.confirm("წავშალო ეს Reel?")) onDeleteReel(r.id); }} className="rounded-full flex items-center justify-center active:scale-90 shrink-0" style={{ width: 38, height: 38, background: C.likeSoft, color: C.like }}><Trash2 size={16} /></button>
          </div>
        )); })()}</div>}
      </div>}
      {delUser && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,.6)" }} onClick={() => setDelUser(null)}>
          <div className="w-full max-w-xs rounded-3xl p-5 text-center" style={{ background: C.paper, animation: "pop .2s ease both" }} onClick={e => e.stopPropagation()}>
            <div className="rounded-full mx-auto flex items-center justify-center mb-3" style={{ width: 52, height: 52, background: C.likeSoft }}><Trash2 size={24} style={{ color: C.like }} /></div>
            <div className="font-bold text-[16px]" style={{ color: C.ink }}>{delUser.name}-ის წაშლა?</div>
            <div className="text-[13px] mt-1 mb-4" style={{ color: C.muted, lineHeight: 1.5 }}>სამუდამოა — ყველა პოსტი, reel, მესიჯი წაიშლება. @{delUser.username}</div>
            <div className="flex gap-2">
              <button onClick={() => setDelUser(null)} className="flex-1 py-2.5 rounded-xl text-[14px] font-bold" style={{ background: C.surfaceMuted, color: C.ink }}>გაუქმება</button>
              <button onClick={() => { onDeleteUser(delUser.id); setDelUser(null); }} className="flex-1 py-2.5 rounded-xl text-[14px] font-bold text-white" style={{ background: C.like }}>წაშლა</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────  DRAWER  ───────────────────────── */

export function Drawer({ open, onClose, nav, onNav, onCreate, flash, tab, mode, setMode, xp, followers, following, onSettings, onSignOut }) {
  const me = USERS[ME]; const { lvl, into } = levelInfo(xp);
  const extras = [{ label: "შენახული", icon: Bookmark, act: () => onNav("profile") }, { label: "პარამეტრები", icon: Settings, act: () => onSettings() }, { label: "დახმარება", icon: HelpCircle, act: () => flash("დახმარება — მალე ✨") }, { label: "გასვლა", icon: LogOut, act: () => onSignOut(), danger: true }];
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

/* ─────────────────────────  LIVE DATA HELPERS  ───────────────────────── */

export function OnlinePage({ onlineIds, onOpenProfile, onMessage, following }) {
  const [q, setQ] = useState(""); const [onlyF, setOnlyF] = useState(false);
  const ql = q.trim().toLowerCase();
  const base = onlineIds.filter(id => id !== ME && USERS[id].id === id);
  let ids = base;
  if (onlyF) ids = ids.filter(id => following.includes(id));
  if (ql) ids = ids.filter(id => { const u = USERS[id]; return u.name.toLowerCase().includes(ql) || u.handle.toLowerCase().includes(ql); });
  return (
    <div className="pb-28 md:pb-8">
      <div className="px-4 pt-5 pb-3 flex items-center gap-2"><Title>ონლაინ</Title><span className="rounded-full px-2 py-0.5 text-white" style={{ background: C.online, fontFamily: MONO, fontSize: 12, fontWeight: 700 }}>{base.length}</span></div>
      <div className="px-4 mb-3"><div className="flex items-center gap-2 px-3 py-2.5 rounded-full" style={{ background: C.surfaceMuted }}><Search size={16} style={{ color: C.faint }} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="მოძებნე ონლაინ ხალხი…" className="flex-1 bg-transparent text-[14px] outline-none" style={{ color: C.ink }} /></div></div>
      <div className="px-4 mb-2 flex gap-2">
        <button onClick={() => setOnlyF(false)} className="px-3.5 py-1.5 rounded-full text-sm font-semibold transition" style={!onlyF ? { background: C.accentSoft, color: C.accentText } : { background: C.surfaceMuted, color: C.muted }}>ყველა</button>
        <button onClick={() => setOnlyF(true)} className="px-3.5 py-1.5 rounded-full text-sm font-semibold transition" style={onlyF ? { background: C.accentSoft, color: C.accentText } : { background: C.surfaceMuted, color: C.muted }}>მიმდევრები</button>
      </div>
      {ids.length === 0 ? <div className="text-center py-16 text-[14px] px-8" style={{ color: C.faint }}><div className="rounded-3xl flex items-center justify-center mb-4 mx-auto" style={{ width: 72, height: 72, background: C.accentSoft }}><Users size={32} style={{ color: C.accent }} /></div>{ql || onlyF ? "ვერ მოიძებნა" : "ამჟამად სხვა ვინმე ონლაინ არ არის 👋"}</div>
       : <div className="px-2">{ids.map(id => (
        <div key={id} className="flex items-center gap-3 px-2 py-2.5 rounded-xl">
          <button onClick={() => onOpenProfile(id)} className="relative active:scale-95"><Avatar id={id} size={48} /><span className="absolute bottom-0 right-0" style={{ width: 13, height: 13, borderRadius: "50%", background: C.online, border: `2.5px solid ${C.paper}` }} /></button>
          <button onClick={() => onOpenProfile(id)} className="flex-1 text-left min-w-0"><Name id={id} className="text-[15px]" /><Mono className="block truncate" style={{ fontSize: 12, color: C.online }}>● ონლაინ</Mono></button>
          <button onClick={() => onMessage(id)} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 38, height: 38, background: C.accentSoft, color: C.accent }}><Send size={17} /></button>
        </div>
      ))}</div>}
    </div>
  );
}


export function Progress({ xp, posts, myFollowers, questData, onClaim }) {
  const { lvl, into } = levelInfo(xp);
  const claimed = (questData && questData.claimed) || [];
  const postsToday = questData ? questData.postsToday : 0;
  const likesToday = questData ? questData.likesToday : 0;
  const followersToday = questData ? questData.followersToday : 0;
  const daily = [
    { id: "post", label: "გამოაქვეყნე პოსტი", done: Math.min(1, postsToday), total: 1, xp: 20, icon: ImageIcon },
    { id: "likes5", label: "მიიღე 5 მოწონება", done: Math.min(5, likesToday), total: 5, xp: 30, icon: Heart },
    { id: "follower", label: "გაიჩინე მიმდევარი", done: Math.min(1, followersToday), total: 1, xp: 25, icon: UserPlus },
  ];
  return (
    <div className="pb-28 md:pb-10">
      <div className="px-4 pt-5 pb-3"><Title>პროგრესი</Title></div>
      <div className="px-4">
        <div className="rounded-2xl p-5 text-white relative overflow-hidden" style={{ backgroundImage: GBRAND, boxShadow: SH.glow }}>
          <div className="flex items-center justify-between">
            <div><div className="text-[13px] font-semibold" style={{ opacity: 0.85 }}>შენი დონე</div><div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 40, lineHeight: 1 }}>LVL {lvl}</div></div>
            <div className="rounded-2xl flex items-center justify-center" style={{ width: 60, height: 60, background: "rgba(255,255,255,.2)" }}><Zap size={30} fill="#fff" /></div>
          </div>
          <div className="mt-4"><div className="flex justify-between text-[12px] mb-1.5" style={{ opacity: 0.9 }}><Mono>{into} / 100 XP</Mono><Mono>{100 - into} შემდეგ დონემდე</Mono></div><div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.25)" }}><div className="h-full rounded-full transition-all" style={{ width: into + "%", background: "#fff" }} /></div></div>
          <div className="mt-3 text-[13px]" style={{ opacity: 0.9 }}>სულ <Mono className="font-bold">{xp}</Mono> XP დაგროვილი</div>
        </div>

        <div className="flex items-center justify-between mt-6 mb-3"><div className="flex items-center gap-2"><Check size={18} style={{ color: C.accent }} /><h2 className="text-[17px]" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700 }}>დღის გამოწვევები</h2></div>{!questData && <Mono style={{ fontSize: 11, color: C.faint }}>იტვირთება…</Mono>}</div>
        <div className="space-y-2.5">{daily.map(d => { const isDone = d.done >= d.total; const got = claimed.includes(d.id); return (
          <div key={d.id} className="p-3.5 flex items-center gap-3" style={card()}>
            <div className="rounded-xl flex items-center justify-center shrink-0" style={{ width: 40, height: 40, background: got ? C.online + "22" : C.accentSoft }}><d.icon size={19} style={{ color: got ? C.online : C.accent }} /></div>
            <div className="flex-1 min-w-0"><div className="text-[14px] font-bold" style={{ color: C.ink }}>{d.label}</div><div className="flex items-center gap-2 mt-1.5"><div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: C.surfaceMuted }}><div className="h-full rounded-full transition-all" style={{ width: Math.min(100, d.done / d.total * 100) + "%", backgroundImage: GBRAND }} /></div><Mono style={{ fontSize: 11, color: C.faint }}>{d.done}/{d.total}</Mono></div></div>
            {isDone && (got ? <span className="flex items-center gap-1 text-[12px] font-bold shrink-0" style={{ color: C.online }}><Check size={16} /> აღებულია</span> : <button onClick={() => onClaim && onClaim(d.id, d.xp)} className="px-3 py-1.5 rounded-full text-xs font-bold text-white shrink-0 active:scale-95" style={{ backgroundImage: GBRAND }}>+{d.xp} XP</button>)}
          </div>
        ); })}</div>
        <div className="mt-4 text-center text-[12px]" style={{ color: C.faint }}>გამოწვევები ნულდება ყოველ დღე შუაღამეს 🌙</div>
      </div>
    </div>
  );
}

/* ─────────────────────────  SETTINGS  ───────────────────────── */

export function SettingsView({ settings, setSettings, meProfile, setMeProfile, mode, setMode, onClose, flash, onSignOut, onUploadAvatar, pushState, onTogglePush, blockedIds, mutedIds, onUnblock, onUnmute, onOpenProfile, following, closeFriends, onToggleCloseFriend, onExportData, onDeleteAccount, birthday, onSetBirthday }) {
  const set = (k, v) => setSettings(s => ({ ...s, [k]: v }));
  const [delMode, setDelMode] = useState(false); const [delTxt, setDelTxt] = useState("");
  const tog = (k) => setSettings(s => ({ ...s, [k]: !s[k] }));
  return (
    <div className="fixed inset-0 z-[59] flex justify-center" style={{ background: C.paper }}>
      <div className="w-full max-w-[600px] flex flex-col" style={{ height: "100dvh", borderLeft: `1px solid ${C.line}`, borderRight: `1px solid ${C.line}` }}>
        <div className="flex items-center gap-3 px-3 py-3 shrink-0" style={{ background: C.surface, borderBottom: `1px solid ${C.line}`, paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}><button onClick={onClose} className="active:scale-90" style={{ color: C.ink2 }}><ArrowLeft size={22} /></button><span className="font-bold text-[16px]" style={{ color: C.ink, fontFamily: DISPLAY }}>პარამეტრები</span></div>
        <div className="flex-1 overflow-y-auto pb-10">
          <div className="flex items-center gap-3 px-4 pt-5"><label style={{ position: "relative", cursor: "pointer", flexShrink: 0 }}><input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files && e.target.files[0]; if (f && onUploadAvatar) onUploadAvatar(f); e.target.value = ""; }} /><Avatar id={ME} size={60} /><div style={{ position: "absolute", right: -2, bottom: -2, width: 23, height: 23, borderRadius: "50%", backgroundImage: GBRAND, display: "flex", alignItems: "center", justifyContent: "center", border: `2.5px solid ${C.surface}` }}><Camera size={12} color="#fff" /></div></label><div><div className="font-bold text-[16px]" style={{ color: C.ink, fontFamily: DISPLAY }}>{meProfile.name}</div><Mono style={{ fontSize: 12, color: C.faint }}>@{USERS[ME].handle}</Mono><div className="text-[12px] mt-0.5" style={{ color: C.accent }}>ფოტოს შესაცვლელად დააჭირე</div></div></div>
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
            <div className="px-4 py-3.5 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
              <div className="rounded-xl flex items-center justify-center shrink-0" style={{ width: 38, height: 38, background: pushState === "on" ? C.accentSoft : C.surfaceMuted }}><Bell size={19} style={{ color: pushState === "on" ? C.accent : C.muted }} /></div>
              <div className="flex-1 min-w-0"><div className="text-[14px] font-bold" style={{ color: C.ink }}>Push შეტყობინებები</div><div className="text-[12px]" style={{ color: C.faint }}>{pushState === "on" ? "ჩართულია — დახურულ აპშიც მიიღებ" : pushState === "denied" ? "ბრაუზერმა დაბლოკა — ჩართე ბრაუზერის პარამეტრებში" : pushState === "unsupported" ? "ამ ბრაუზერს არ აქვს მხარდაჭერა" : "მიიღე შეტყობინება აპის დახურვის შემდეგაც"}</div></div>
              {pushState === "unsupported" || pushState === "denied" ? <span className="text-[11px] font-bold shrink-0" style={{ color: C.faint }}>—</span> : <button onClick={onTogglePush} className="px-3.5 py-2 rounded-xl text-[13px] font-bold shrink-0 active:scale-95" style={pushState === "on" ? { background: C.surfaceMuted, color: C.ink2 } : { backgroundImage: GBRAND, color: "#fff" }}>{pushState === "on" ? "გამორთვა" : "ჩართვა"}</button>}
            </div>
            <SettingsRow label="მოწონებები" on={settings.nLikes} onToggle={() => tog("nLikes")} />
            <SettingsRow label="კომენტარები" on={settings.nComments} onToggle={() => tog("nComments")} />
            <SettingsRow label="ახალი მიმდევრები" on={settings.nFollows} onToggle={() => tog("nFollows")} />
            <SettingsRow label="პირადი შეტყობინებები" on={settings.nMessages} onToggle={() => tog("nMessages")} />
          </SettingsSection>
          <SettingsSection title="ახლო მეგობრები 👥">
            <div className="px-4 py-2 text-[12px]" style={{ color: C.faint }}>მონიშნე ვინც ნახავს შენს „ახლო მეგობრების" story-ებს</div>
            {(() => {
              const ids = Array.from(new Set([...(closeFriends || []), ...(following || [])]));
              if (!ids.length) return <div className="px-4 py-3 text-[13px]" style={{ color: C.faint }}>ჯერ არავის მიჰყვები — დაამატე პროფილებიდან</div>;
              const sorted = ids.slice().sort((a, b) => ((closeFriends || []).includes(b) ? 1 : 0) - ((closeFriends || []).includes(a) ? 1 : 0));
              return sorted.map(id => { const cu = USERS[id]; const on = (closeFriends || []).includes(id); return (
                <div key={id} className="px-4 py-2.5 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                  <Avatar id={id} size={38} />
                  <div className="flex-1 min-w-0 active:opacity-60" onClick={() => { onClose(); onOpenProfile && onOpenProfile(id); }}><div className="text-[14px] font-bold truncate" style={{ color: C.ink }}>{cu.name}</div><div className="text-[12px]" style={{ color: C.faint }}>@{cu.handle}</div></div>
                  <button onClick={() => onToggleCloseFriend(id)} className="rounded-full flex items-center justify-center active:scale-90 shrink-0" style={{ width: 34, height: 34, background: on ? "#1f8f4e" : C.surfaceMuted, border: on ? "none" : `1px solid ${C.line}` }}><Star size={17} style={{ color: on ? "#fff" : C.faint }} fill={on ? "#fff" : "none"} /></button>
                </div>); });
            })()}
          </SettingsSection>
          <SettingsSection title="დაბლოკილები და გაჩუმებულები">
            {(!blockedIds || !blockedIds.length) && (!mutedIds || !mutedIds.length)
              ? <div className="px-4 py-4 text-[13px]" style={{ color: C.faint }}>ცარიელია — არავინ დაგიბლოკავს ან გაგიჩუმებია</div>
              : <>
                {(blockedIds || []).map(id => { const bu = USERS[id]; return (
                  <div key={"b" + id} className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                    <Avatar id={id} size={38} />
                    <div className="flex-1 min-w-0 active:opacity-60" onClick={() => { onClose(); onOpenProfile && onOpenProfile(id); }}><div className="text-[14px] font-bold truncate" style={{ color: C.ink }}>{bu.name}</div><div className="text-[12px]" style={{ color: "#e05656" }}>🚫 დაბლოკილი</div></div>
                    <button onClick={() => onUnblock(id)} className="px-3.5 py-2 rounded-xl text-[13px] font-bold shrink-0 active:scale-95" style={{ background: C.surfaceMuted, color: C.ink }}>განბლოკვა</button>
                  </div>); })}
                {(mutedIds || []).map(id => { const mt = USERS[id]; return (
                  <div key={"m" + id} className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                    <Avatar id={id} size={38} />
                    <div className="flex-1 min-w-0 active:opacity-60" onClick={() => { onClose(); onOpenProfile && onOpenProfile(id); }}><div className="text-[14px] font-bold truncate" style={{ color: C.ink }}>{mt.name}</div><div className="text-[12px]" style={{ color: C.muted }}>🔇 გაჩუმებული</div></div>
                    <button onClick={() => onUnmute(id)} className="px-3.5 py-2 rounded-xl text-[13px] font-bold shrink-0 active:scale-95" style={{ background: C.surfaceMuted, color: C.ink }}>აღდგენა</button>
                  </div>); })}
              </>}
          </SettingsSection>
          <SettingsSection title="დაბადების დღე 🎂">
            <div className="px-4 py-3">
              <input type="date" defaultValue={birthday || ""} onChange={e => onSetBirthday && onSetBirthday(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl outline-none text-[15px]" style={{ background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` }} />
              <div className="text-[12px] mt-1.5" style={{ color: C.faint }}>დაბადების დღეს მეგობრები შენს კედელზე მიულოცავენ</div>
            </div>
          </SettingsSection>
          <SettingsSection title="მონაცემები და ანგარიში">
            <button onClick={onExportData} className="w-full flex items-center gap-3 px-4 py-3.5 active:opacity-60" style={{ color: C.ink }}><Download size={20} style={{ color: C.muted }} /><div className="text-left"><div className="text-[15px] font-medium">მონაცემების ჩამოტვირთვა</div><div className="text-[12px]" style={{ color: C.faint }}>პოსტები, კომენტარები, რეელები (JSON)</div></div></button>
            {!delMode ? <button onClick={() => setDelMode(true)} className="w-full flex items-center gap-3 px-4 py-3.5 active:opacity-60" style={{ color: "#e05656" }}><Trash2 size={20} /><span className="text-[15px] font-semibold">ანგარიშის წაშლა</span></button>
              : <div className="px-4 py-3">
                  <div className="text-[13px] mb-2" style={{ color: "#e05656", lineHeight: 1.5 }}>⚠️ სამუდამოა — ყველა შენი პოსტი, რეელი, მესიჯი წაიშლება. დასადასტურებლად ჩაწერე <b>წავშალე</b>:</div>
                  <input value={delTxt} onChange={e => setDelTxt(e.target.value)} placeholder="წავშალე" className="w-full px-3 py-2.5 rounded-xl outline-none text-[14px] mb-2" style={{ background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` }} />
                  <div className="flex gap-2">
                    <button onClick={() => { setDelMode(false); setDelTxt(""); }} className="flex-1 py-2.5 rounded-xl text-[14px] font-bold" style={{ background: C.surfaceMuted, color: C.ink }}>გაუქმება</button>
                    <button onClick={() => { if (delTxt.trim() === "წავშალე") onDeleteAccount(); }} disabled={delTxt.trim() !== "წავშალე"} className="flex-1 py-2.5 rounded-xl text-[14px] font-bold text-white" style={{ background: "#e05656", opacity: delTxt.trim() === "წავშალე" ? 1 : 0.4 }}>სამუდამოდ წაშლა</button>
                  </div>
                </div>}
          </SettingsSection>
          <div className="px-4 mt-6"><button onClick={onSignOut} className="w-full py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 active:scale-[.98]" style={{ background: C.likeSoft, color: C.like }}><LogOut size={18} /> გასვლა</button></div>
          <div className="px-4 mt-4 text-center"><Mono style={{ fontSize: 11, color: C.faint }}>mzera v0.7 · build 7a2c · React + Vite</Mono></div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────  STORY EDITOR  ───────────────────────── */

export function Leaderboard({ xp, allUsers, posts, onOpenProfile }) {
  const others = (allUsers || []).filter(u => u.id !== ME).map(u => ({ id: u.id, xp: u.xp || 0 }));
  const all = [...others, { id: ME, xp }].sort((a, b) => b.xp - a.xp);
  const myRank = all.findIndex(x => x.id === ME) + 1;
  const top3 = all.slice(0, 3); const rest = all.slice(3);
  const mine = (posts || []).filter(p => p.authorId === ME && !p.hidden);
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

export function SearchView({ posts, onOpenProfile, onTag, onClose, runSearch }) {
  const [q, setQ] = useState(""); const ql = q.trim().toLowerCase();
  const [results, setResults] = useState({ people: [], posts: [] });
  const [searching, setSearching] = useState(false);
  useEffect(() => {
    const term = q.trim();
    if (!term) { setResults({ people: [], posts: [] }); setSearching(false); return; }
    setSearching(true);
    let active = true;
    const h = setTimeout(async () => {
      try { const r = runSearch ? await runSearch(term) : { people: [], posts: [] }; if (active) setResults(r || { people: [], posts: [] }); }
      catch (e) {} finally { if (active) setSearching(false); }
    }, 320);
    return () => { active = false; clearTimeout(h); };
  }, [q]);
  const people = results.people || [];
  const foundPosts = results.posts || [];
  const tags = ql ? computeTrends(posts).filter(t => t.tag.toLowerCase().includes(ql)) : computeTrends(posts);
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
          {searching && <div className="flex justify-center items-center py-8"><div style={{ width: 26, height: 26, border: `3px solid ${C.lineSoft}`, borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /></div>}
          {!ql && <div className="p-4"><div className="flex items-center gap-2 mb-3"><Star size={16} style={{ color: C.accent }} /><span className="text-[14px] font-bold" style={{ color: C.ink }}>შემოთავაზებული</span></div><div className="space-y-1">{suggested.map(u => <button key={u.id} onClick={() => goUser(u.id)} className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:opacity-80"><Avatar id={u.id} size={44} /><div className="flex-1 text-left min-w-0"><Name id={u.id} className="text-[15px]" /><Mono className="block truncate" style={{ fontSize: 12, color: C.faint }}>@{u.handle}</Mono></div></button>)}</div></div>}
          {ql && people.length > 0 && <div className="pt-2"><div className="px-4 py-1.5 text-[12px] font-bold uppercase" style={{ color: C.faint, fontFamily: MONO }}>ხალხი</div>{people.map(u => <button key={u.id} onClick={() => goUser(u.id)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:opacity-80"><div className="relative"><Avatar id={u.id} size={44} />{u.online && <span className="absolute bottom-0 right-0"><Dot size={11} /></span>}</div><div className="flex-1 text-left min-w-0"><Name id={u.id} className="text-[15px]" /><Mono className="block truncate" style={{ fontSize: 12, color: C.faint }}>@{u.handle}</Mono></div></button>)}</div>}
          {(ql || tags.length > 0) && <div className="pt-2"><div className="px-4 py-1.5 text-[12px] font-bold uppercase" style={{ color: C.faint, fontFamily: MONO }}>ჰეშთეგები</div>{ql && <button onClick={() => goTag(ql)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:opacity-80"><div className="rounded-xl flex items-center justify-center" style={{ width: 44, height: 44, background: C.accentSoft }}><Hash size={20} style={{ color: C.accent }} /></div><div className="flex-1 text-left"><div className="font-bold text-[15px]" style={{ color: C.ink }}>#{ql}</div><Mono style={{ fontSize: 12, color: C.faint }}>ნახე ყველა პოსტი →</Mono></div></button>}{tags.filter(t => t.tag.toLowerCase() !== ql).map(t => <button key={t.tag} onClick={() => goTag(t.tag)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:opacity-80"><div className="rounded-xl flex items-center justify-center" style={{ width: 44, height: 44, background: C.accentSoft }}><Hash size={20} style={{ color: C.accent }} /></div><div className="flex-1 text-left"><div className="font-bold text-[15px]" style={{ color: C.ink }}>#{t.tag}</div><Mono style={{ fontSize: 12, color: C.faint }}>{t.posts} პოსტი</Mono></div></button>)}</div>}
          {ql && foundPosts.length > 0 && <div className="pt-2 pb-6"><div className="px-4 py-1.5 text-[12px] font-bold uppercase" style={{ color: C.faint, fontFamily: MONO }}>პოსტები</div><div className="px-3 space-y-2">{foundPosts.map(p => <button key={p.id} onClick={() => goUser(p.authorId)} className="w-full p-3 flex gap-3 text-left" style={card()}><Avatar id={p.authorId} size={36} /><div className="min-w-0 flex-1"><Name id={p.authorId} className="text-[13px]" /><div className="text-[13px] line-clamp-2" style={{ color: C.ink2 }}>{p.text}</div></div>{p.image && <Pic src={p.image} round={10} style={{ width: 48, height: 48 }} className="shrink-0" />}</button>)}</div></div>}
          {ql && !searching && people.length === 0 && foundPosts.length === 0 && <div className="px-4 pt-6 pb-2 text-center"><Mono style={{ fontSize: 13, color: C.faint }}>ხალხი ან პოსტი ვერ მოიძებნა — სცადე ჰეშთეგი ზემოთ</Mono></div>}
        </div>
      </div>
    </div>
  );
}

