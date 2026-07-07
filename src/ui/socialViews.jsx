import {
  useState, useEffect, useRef, Home, Search, Compass, PlusSquare, Send, Bell, User, Shield, Heart, MessageCircle, MessageSquare, Bookmark, MoreHorizontal, X, ArrowLeft, Hash, TrendingUp, Check, Trash2, Flag, Camera, Settings, AlertTriangle, ImageIcon, MapPin, Map, Link2, ShieldCheck, Plus, Minus, Menu, LogOut, HelpCircle, ChevronRight, ChevronDown, Zap, Sun, Moon, ShoppingBag, Tag, Star, Eye, Navigation, Users, Film, Mic, Play, Pause, Smile, FileText, Download, UserPlus, Trophy, Upload, Volume2, VolumeX, Pencil, CornerUpLeft, Copy, Reply, Clapperboard, Music, Gift, Calendar, Pin, Lock, authApi, profilesApi, postsApi, reactionsApi, commentsApi, followsApi, chatApi, notifsApi, storageApi, storiesApi, reelsApi, marketApi, groupsApi, eventsApi, forumApi, highlightsApi, presenceApi, locationsApi, pollsApi, questsApi, xpApi, adminApi, pushApi, hasSupabase, PAL, DARK, C, GBRAND, SH, card, DISPLAY, BODY, MONO, Mono, GRADS, hashIdx, img, catColor, FALLBACK_USER, _users, USERS, ME, fmtN, computeTrends, REPLIES, MARKET_CATS, FORUM_CATS, Pic, Avatar, Tilt, Dot, Name, Handle, IconBtn, Pill, Wordmark, Title, Chips, renderText, Empty, ThemeToggle, REACTIONS, StoryRow, MiniPost, NewThread, Stars, Checkout, NewListing, GroupAvatar, waveOf, dl, VoiceMsg, DocMsg, EMOJIS, EmojiPanel, PeoplePicker, convMembers, convIsGroup, msgPreview, FollowBtn, FollowList, timeAgo, mergeProfile, mapDbPost, msgClock, mapDbMsg, toDbMsg, mapDbNotif, resolveImg, hydrateAuthors, mapDbStories, mapDbReel, mapDbThread, mapDbListing, mapDbReview, mapDbGroup, mapDbEvent, ConfigError, LoadingScreen, AuthScreen, HighlightCreate, HighlightView, ReelComments, pushNotif, ensureNotifPerm, levelInfo, kfmt, ReelCard, ReelCreate, GroupPost, MiniMap, Switch, SettingsSection, SettingsRow, STORY_STICKERS, setTheme, setME, t, LANGS, Languages, UploadRing, useModalA11y,
} from "./core";
import { PostCard, Lightbox } from "./feed";
import { runSelfChecks } from "../lib/selfCheck";
import { runBackendChecks } from "../lib/selfCheckBackend";

export function Onboarding({ suggested, following, onToggleFollow, onUploadAvatar, onSaveProfile, onFinish }) {
  const me = USERS[ME] || {};
  const [step, setStep] = useState(0);
  const [name, setName] = useState(me.name || "");
  const [bio, setBio] = useState(me.bio || "");
  const fileRef = useRef(null);
  const [avatarProgress, setAvatarProgress] = useState(null);
  const [avatarErr, setAvatarErr] = useState("");
  const pickAvatar = async (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; setAvatarProgress(0); setAvatarErr(""); try { await onUploadAvatar(f, setAvatarProgress); } catch (err) { setAvatarErr(t("onb.avatarUploadFailedPre") + (err && err.message ? err.message : t("error.unknown"))); } setAvatarProgress(null); e.target.value = ""; };
  const followedCount = suggested.filter(u => following.includes(u.id)).length;
  const nameEmpty = step === 0 && !name.trim();
  const next = () => { if (step === 0) { if (!name.trim()) return; onSaveProfile(name.trim(), bio.trim()); setStep(1); } else onFinish(); };
  return (
    <div className="fixed inset-0 z-[90] flex flex-col" style={{ background: C.paper }}>
      <div className="flex items-center justify-center gap-2 pt-6 pb-2">{[0, 1].map(i => <span key={i} className="rounded-full transition-all" style={{ width: step === i ? 26 : 8, height: 8, background: step >= i ? C.accent : C.line }} />)}</div>
      <div className="flex-1 overflow-y-auto px-6">
        {step === 0 ? (
          <div className="max-w-[440px] mx-auto pt-5 pb-4">
            <h1 className="text-[26px] font-bold text-center" style={{ color: C.ink, fontFamily: DISPLAY }}>{t("onb.welcome")}</h1>
            <p className="text-center text-[14px] mt-2 mb-7" style={{ color: C.muted }}>{t("onb.setupProfile")}</p>
            <div className="flex flex-col items-center">
              <button onClick={() => fileRef.current && fileRef.current.click()} className="relative active:scale-95"><Avatar id={ME} size={104} /><UploadRing pct={avatarProgress} size={104} strokeWidth={3} /><div style={{ position: "absolute", right: 2, bottom: 2, width: 34, height: 34, borderRadius: "50%", backgroundImage: GBRAND, display: "flex", alignItems: "center", justifyContent: "center", border: `3px solid ${C.paper}` }}>{avatarProgress != null ? <Mono style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>{avatarProgress}%</Mono> : <Camera size={17} color="#fff" />}</div></button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickAvatar} />
              {avatarErr ? <span className="text-[12.5px] mt-2 text-center" style={{ color: C.like }}>{avatarErr}</span> : <span className="text-[12.5px] mt-2" style={{ color: C.faint }}>{t("onb.addPhoto")}</span>}
            </div>
            <div className="mt-6 space-y-3.5">
              <div><label className="text-[12.5px] font-semibold" style={{ color: C.ink2 }}>{t("field.name")}</label><input value={name} onChange={e => setName(e.target.value)} placeholder={t("onb.namePh")} className="w-full mt-1.5 px-4 py-3 rounded-xl text-[15px] outline-none" style={{ background: C.surfaceMuted, color: C.ink }} /></div>
              <div><label className="text-[12.5px] font-semibold" style={{ color: C.ink2 }}>{t("field.bio")}</label><textarea value={bio} onChange={e => setBio(e.target.value)} rows={2} placeholder={t("onb.bioPh")} className="w-full mt-1.5 px-4 py-3 rounded-xl text-[15px] outline-none resize-none" style={{ background: C.surfaceMuted, color: C.ink }} /></div>
            </div>
          </div>
        ) : (
          <div className="max-w-[440px] mx-auto pt-5 pb-4">
            <h1 className="text-[24px] font-bold text-center" style={{ color: C.ink, fontFamily: DISPLAY }}>{t("onb.followPeople")}</h1>
            <p className="text-center text-[14px] mt-2 mb-5" style={{ color: C.muted }}>{t("onb.feedComesAlive")}</p>
            {suggested.length ? <div className="space-y-2.5">{suggested.slice(0, 12).map(u => <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.line}` }}><Avatar id={u.id} size={46} /><div className="min-w-0 flex-1"><div className="text-[14.5px] font-bold truncate" style={{ color: C.ink }}>{USERS[u.id] ? USERS[u.id].name : ""}</div><Mono className="text-[11.5px] truncate block" style={{ color: C.faint }}>@{USERS[u.id] ? USERS[u.id].handle : ""}</Mono></div><button onClick={() => onToggleFollow(u.id)} className="px-4 py-1.5 rounded-lg text-[12.5px] font-bold active:scale-95" style={following.includes(u.id) ? { background: C.surfaceMuted, color: C.ink } : { backgroundImage: GBRAND, color: "#fff" }}>{following.includes(u.id) ? t("follow.followedCheck") : t("follow.followShort")}</button></div>)}</div> : <div className="text-center py-10 text-[14px]" style={{ color: C.faint }}>{t("onb.noOthersYet")}</div>}
          </div>
        )}
      </div>
      <div className="px-6 pt-3" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
        <button onClick={next} disabled={nameEmpty} className="w-full py-3.5 rounded-2xl text-[16px] font-bold text-white active:scale-[.98]" style={{ backgroundImage: GBRAND, opacity: nameEmpty ? 0.5 : 1 }}>{step === 0 ? t("onb.continue") : (followedCount > 0 ? t("onb.finish") : t("onb.skip"))}</button>
        {step === 1 && <button onClick={onFinish} className="w-full py-2.5 mt-1 text-[13.5px] font-semibold" style={{ color: C.faint }}>{t("onb.later")}</button>}
      </div>
    </div>
  );
}

export function SuggestedPeople({ people, isFollowing, onToggle, onDismiss, onOpenProfile }) {
  if (!people || !people.length) return null;
  return (
    <div style={{ borderBottom: `1px solid ${C.lineSoft}`, background: C.paper }}>
      <div className="flex items-center justify-between px-4 pt-3 pb-1.5"><span className="text-[14px] font-bold" style={{ color: C.ink }}>{t("suggested.mayKnow")}</span></div>
      <div className="flex gap-2.5 px-4 overflow-x-auto no-scrollbar pb-3">
        {people.map(u => <Tilt key={u.id} max={9} radius={18} touchAction="pan-x" className="shrink-0 p-3 flex flex-col items-center" style={{ width: 144, ...card() }}>
          <button onClick={() => onDismiss(u.id)} className="self-end -mt-1 -mr-1 rounded-full p-0.5 active:scale-90" style={{ color: C.faint }}><X size={15} /></button>
          <button onClick={() => onOpenProfile(u.id)} className="flex flex-col items-center w-full"><Avatar id={u.id} size={72} /><div className="text-[13px] font-bold mt-2 text-center truncate w-full" style={{ color: C.ink }}>{USERS[u.id] ? USERS[u.id].name : "—"}</div><Mono className="text-[11px] truncate w-full text-center" style={{ color: C.faint }}>@{USERS[u.id] ? USERS[u.id].handle : ""}</Mono></button>
          <button onClick={() => onToggle(u.id)} className="w-full mt-2.5 py-1.5 rounded-lg text-[12.5px] font-bold transition active:scale-95" style={isFollowing(u.id) ? { background: C.surfaceMuted, color: C.ink } : { backgroundImage: GBRAND, color: "#fff" }}>{isFollowing(u.id) ? t("follow.followedCheck") : t("follow.followShort")}</button>
        </Tilt>)}
      </div>
    </div>
  );
}

// Standalone uploaded photos + folders — separate from post images (those
// live under the "Posts" tab). Drag a photo tile onto a folder to file it
// (Pointer Events, so the same code path handles mouse and touch); a plain
// tap without movement opens the fullscreen viewer instead of starting a drag.
function AlbumsGrid({ isMe, albums, photos, onCreateAlbum, onRenameAlbum, onDeleteAlbum, onUploadPhoto, onMovePhoto, onReorderPhotos, onDeletePhoto, flash }) {
  const [openAlbum, setOpenAlbum] = useState(null);
  const [viewer, setViewer] = useState(null);
  const [movePicker, setMovePicker] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [dragState, setDragState] = useState(null);
  const [overId, setOverId] = useState(null);
  const drag = useRef({ id: null, active: false, startX: 0, startY: 0 });

  const shownPhotos = openAlbum ? photos.filter(p => p.album_id === openAlbum.id) : photos.filter(p => !p.album_id);

  const onPointerDownTile = (e, photo) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { id: photo.id, active: false, startX: e.clientX, startY: e.clientY };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
  };
  const onPointerMoveTile = (e) => {
    const d = drag.current; if (!d.id) return;
    const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
    if (!d.active && Math.hypot(dx, dy) > 10) d.active = true;
    if (!d.active) return;
    setDragState({ id: d.id, x: e.clientX, y: e.clientY });
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const folderEl = el && el.closest && el.closest("[data-album-drop]");
    const tileEl = el && el.closest && el.closest("[data-photo-tile]");
    if (folderEl) setOverId("album:" + folderEl.getAttribute("data-album-drop"));
    else if (tileEl && tileEl.getAttribute("data-photo-tile") !== String(d.id)) setOverId("photo:" + tileEl.getAttribute("data-photo-tile"));
    else setOverId(null);
  };
  const onPointerUpTile = (e, photo) => {
    const d = drag.current;
    if (d.active && overId) {
      if (overId.startsWith("album:")) onMovePhoto(photo.id, overId.slice(6));
      else {
        const otherId = overId.slice(6);
        const other = shownPhotos.find(p => String(p.id) === otherId);
        if (other) onReorderPhotos([{ id: photo.id, position: other.position || 0 }, { id: other.id, position: photo.position || 0 }]);
      }
    } else if (!d.active) setViewer(photo);
    drag.current = { id: null, active: false, startX: 0, startY: 0 };
    setDragState(null); setOverId(null);
  };

  const doUpload = async (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    setUploadBusy(true);
    try { await onUploadPhoto(f, openAlbum ? openAlbum.id : null); } catch (err) { flash && flash(t("toast.uploadFailed")); }
    setUploadBusy(false); e.target.value = "";
  };
  const createAlbum = () => { const name = window.prompt(t("album.namePrompt")); if (name && name.trim()) onCreateAlbum(name.trim()); };
  const renameAlbum = (a) => { const name = window.prompt(t("album.namePrompt"), a.name); if (name && name.trim() && name.trim() !== a.name) onRenameAlbum(a.id, name.trim()); };
  const deleteAlbum = (a) => { if (window.confirm(t("album.deleteConfirm"))) onDeleteAlbum(a.id); };
  const closeViewer = () => { setViewer(null); setMovePicker(false); };
  const deletePhoto = (p) => { if (window.confirm(t("album.deletePhotoConfirm"))) { onDeletePhoto(p.id); closeViewer(); } };
  const movePhotoTo = (albumId) => { if (viewer) onMovePhoto(viewer.id, albumId); closeViewer(); };

  return (
    <div className="pt-1">
      {!openAlbum && (albums.length > 0 || isMe) && (
        <div className="flex gap-3 overflow-x-auto no-scrollbar px-3 pb-3">
          {isMe && <button onClick={createAlbum} className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95"><div className="rounded-2xl flex items-center justify-center" style={{ width: 62, height: 62, border: `2px dashed ${C.line}`, color: C.muted }}><Plus size={22} /></div><span className="text-[11px]" style={{ color: C.muted }}>{t("album.new")}</span></button>}
          {albums.map(a => {
            const albumPhotos = photos.filter(p => p.album_id === a.id);
            // no explicit "set as cover" action exists yet, so fall back to
            // the album's own most recent photo — an empty folder icon for
            // an album that already has photos in it looks like a bug.
            const cover = a.cover || (albumPhotos[0] && albumPhotos[0].image);
            return (
              <div key={a.id} className="flex flex-col items-center gap-1 shrink-0" style={{ width: 62 }}>
                <button data-album-drop={a.id} onClick={() => setOpenAlbum(a)} className="rounded-2xl overflow-hidden relative active:scale-95 transition" style={{ width: 62, height: 62, background: C.surfaceMuted, boxShadow: overId === "album:" + a.id ? `0 0 0 2.5px ${C.accent}` : "none" }}>
                  {cover ? <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={20} style={{ color: C.faint }} /></div>}
                </button>
                <span className="text-[11px] truncate w-full text-center" style={{ color: C.ink2 }}>{a.name}</span>
                <span className="text-[10px]" style={{ color: C.faint }}>{albumPhotos.length}</span>
              </div>
            );
          })}
        </div>
      )}
      {openAlbum && (
        <div className="flex items-center gap-2.5 px-3 pb-3">
          <button onClick={() => setOpenAlbum(null)} className="active:scale-90"><ArrowLeft size={20} style={{ color: C.ink }} /></button>
          <span className="font-bold text-[14.5px] flex-1 truncate" style={{ color: C.ink }}>{openAlbum.name}</span>
          {isMe && <button onClick={() => renameAlbum(openAlbum)} className="active:scale-90" style={{ color: C.faint }}><Pencil size={16} /></button>}
          {isMe && <button onClick={() => { deleteAlbum(openAlbum); setOpenAlbum(null); }} className="active:scale-90" style={{ color: C.faint }}><Trash2 size={16} /></button>}
        </div>
      )}
      {isMe && (
        <div className="px-3 pb-3">
          <label className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer active:scale-[.98]" style={{ background: C.surfaceMuted, color: C.ink2 }}>
            <input type="file" accept="image/*" hidden disabled={uploadBusy} onChange={doUpload} />
            <Upload size={15} /> {uploadBusy ? t("word.loading") : t("album.uploadPhoto")}
          </label>
        </div>
      )}
      {shownPhotos.length ? (
        <div className="grid grid-cols-3 gap-1 px-1">
          {shownPhotos.map(p => (
            <div key={p.id} data-photo-tile={p.id}
              onPointerDown={e => onPointerDownTile(e, p)} onPointerMove={onPointerMoveTile} onPointerUp={e => onPointerUpTile(e, p)} onPointerCancel={() => { drag.current = { id: null, active: false, startX: 0, startY: 0 }; setDragState(null); setOverId(null); }}
              className="relative overflow-hidden" style={{ aspectRatio: "1", borderRadius: 10, touchAction: "none", opacity: dragState && dragState.id === p.id ? 0.3 : 1, boxShadow: overId === "photo:" + p.id ? `0 0 0 2.5px ${C.accent}` : "none" }}>
              <Pic src={p.image} grad={GRADS[hashIdx(p.id, GRADS.length)]} w={400} round={10} style={{ aspectRatio: "1" }} />
            </div>
          ))}
        </div>
      ) : <Empty icon={Camera} t={t("album.emptyTitle")} s={openAlbum ? t("album.emptyAlbumSub") : t("album.emptyUnsortedSub")} />}
      {dragState && (() => { const p = photos.find(ph => ph.id === dragState.id); return p ? (
        <div className="fixed pointer-events-none z-[90]" style={{ left: dragState.x - 36, top: dragState.y - 36, width: 72, height: 72, borderRadius: 12, overflow: "hidden", boxShadow: "0 10px 26px -6px rgba(0,0,0,.5)", transform: "scale(1.08)" }}>
          <Pic src={p.image} grad={GRADS[hashIdx(p.id, GRADS.length)]} w={200} round={12} style={{ width: "100%", height: "100%" }} />
        </div>
      ) : null; })()}
      {viewer && (
        <div className="fixed inset-0 z-[85] flex flex-col" style={{ background: "rgba(6,7,12,.94)" }} onClick={closeViewer}>
          <div className="flex items-center justify-end gap-4 px-4 py-3" onClick={e => e.stopPropagation()}>
            {isMe && <button onClick={() => setMovePicker(true)} className="active:scale-90" style={{ color: "#fff" }}><CornerUpLeft size={20} /></button>}
            {isMe && <button onClick={() => deletePhoto(viewer)} className="active:scale-90" style={{ color: "#fff" }}><Trash2 size={20} /></button>}
            <button onClick={closeViewer} className="active:scale-90" style={{ color: "#fff" }}><X size={22} /></button>
          </div>
          <div className="flex-1 flex items-center justify-center px-4" onClick={e => e.stopPropagation()}>
            <img src={viewer.image} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8 }} />
          </div>
          {movePicker && (
            <div className="fixed inset-0 z-[95] flex items-end" style={{ background: "rgba(0,0,0,.5)" }} onClick={() => setMovePicker(false)}>
              <div className="w-full rounded-t-3xl pb-6 pt-2" style={{ background: C.paper, maxWidth: 600, margin: "0 auto" }} onClick={e => e.stopPropagation()}>
                <div className="mx-auto rounded-full mb-2" style={{ width: 38, height: 4, background: C.line }} />
                <div className="px-5 pb-2 pt-1 text-[13px] font-bold" style={{ color: C.ink }}>{t("album.moveTo")}</div>
                <button onClick={() => movePhotoTo(null)} className="w-full text-left px-5 py-3 text-[15px]" style={{ color: C.ink }}>{t("album.unsorted")}</button>
                {albums.filter(a => !openAlbum || a.id !== openAlbum.id).map(a => <button key={a.id} onClick={() => movePhotoTo(a.id)} className="w-full text-left px-5 py-3 text-[15px]" style={{ color: C.ink }}>{a.name}</button>)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Profile({ userId, posts, savedPosts, reels, xp, meProfile, following, followerCounts, followsMe, onToggleFollow, onMessage, onOpenList, onSettings, flash, onBack, onTag, onLike, onReact, onSave, onComment, onPollVote, onReport, onRemove, onOpenProfile, isAdmin, onUploadAvatar, onUploadCover, onOpenReels, onAddReel, onReelDelete, onReelEdit, onEditPost, onDeletePost, onEditComment, onDeleteComment, blocked, muted, onBlock, onUnblock, onMute, onUnmute, closeFriend, onToggleCloseFriend, collections, onCreateCollection, onAssignCollection, albums, albumPhotos, onCreateAlbum, onRenameAlbum, onDeleteAlbum, onUploadAlbumPhoto, onMoveAlbumPhoto, onReorderAlbumPhotos, onDeleteAlbumPhoto }) {
  const u = USERS[userId]; const isMe = userId === ME; const [tab, setTab] = useState("grid"); const [sel, setSel] = useState(null); const [editReel, setEditReel] = useState(null); const [editCap, setEditCap] = useState("");
  const [menuOpen, setMenuOpen] = useState(false); const [qrOpen, setQrOpen] = useState(false); const [selCol, setSelCol] = useState(null); const [assignFor, setAssignFor] = useState(null); const [avatarView, setAvatarView] = useState(false);
  const [avatarProgress, setAvatarProgress] = useState(null); const [coverProgress, setCoverProgress] = useState(null);
  const pickAvatar = async (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; setAvatarProgress(0); try { await onUploadAvatar(f, setAvatarProgress); } catch (err) { flash && flash(t("onb.avatarUploadFailedPre") + (err && err.message ? err.message : t("error.unknown"))); } setAvatarProgress(null); e.target.value = ""; };
  const pickCover = async (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; setCoverProgress(0); try { await onUploadCover(f, setCoverProgress); } catch (err) { flash && flash(t("profile.coverUploadFailedPre") + (err && err.message ? err.message : t("error.unknown"))); } setCoverProgress(null); e.target.value = ""; };
  const [hls, setHls] = useState([]); const [creatingHl, setCreatingHl] = useState(false); const [viewHl, setViewHl] = useState(null);
  useEffect(() => { let on = true; highlightsApi.forUser(userId).then(d => { if (on) setHls(d); }).catch(() => {}); return () => { on = false; }; }, [userId]);
  const reloadHls = () => highlightsApi.forUser(userId).then(setHls).catch(() => {});
  const [viewerCount, setViewerCount] = useState(0);
  useEffect(() => { if (userId !== ME) return; let on = true; profilesApi.viewersCount().then(c => { if (on) setViewerCount(c); }).catch(() => {}); return () => { on = false; }; }, [userId]);
  const dispName = isMe && meProfile ? meProfile.name : u.name; const dispBio = isMe && meProfile ? meProfile.bio : u.bio;
  const mine = posts.filter(p => p.authorId === userId && !p.hidden && !p.groupId);
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
  // private accounts here require a MUTUAL follow (both directions), not
  // just a one-way approved-follower relationship — matches the account's
  // own is_private RLS gate (public.can_view_private_content in schema.sql).
  const gated = !isMe && !isAdmin && u.isPrivate && !(amFollowing && followsMe);
  const fmt = (n) => n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "ათ" : "" + n;
  return (
    <div className="pb-28 md:pb-10">
      <div className="relative">
        {u.cover ? <img src={u.cover} alt="" className="w-full" style={{ height: 168, objectFit: "cover" }} draggable={false} /> : <Pic src={img("cover" + userId, 800, 320)} grad={GRADS[hashIdx(userId, GRADS.length)]} className="w-full" style={{ height: 168 }} />}
        {isMe && onUploadCover && <label style={{ position: "absolute", right: 12, bottom: 12, cursor: "pointer", zIndex: 2 }}><input type="file" accept="image/*" style={{ display: "none" }} disabled={coverProgress != null} onChange={pickCover} /><div className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 36, height: 36, background: "rgba(0,0,0,.5)", color: "#fff", backdropFilter: "blur(6px)" }}>{coverProgress != null ? <Mono style={{ fontSize: 10, fontWeight: 700 }}>{coverProgress}%</Mono> : <Camera size={17} />}</div></label>}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(0,0,0,.28), rgba(0,0,0,.04))" }} />
        <div className="absolute top-0 inset-x-0 flex items-center gap-3 px-4 py-3">
          {!isMe && <button onClick={onBack} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 38, height: 38, background: "rgba(0,0,0,.4)", color: "#fff", backdropFilter: "blur(6px)" }}><ArrowLeft size={20} /></button>}
          <div className="flex-1" />
          <button onClick={() => isMe ? onSettings() : setMenuOpen(true)} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 38, height: 38, background: "rgba(0,0,0,.4)", color: "#fff", backdropFilter: "blur(6px)" }}>{isMe ? <Settings size={19} /> : <MoreHorizontal size={20} />}</button>
        </div>
      </div>
      <div className="px-4">
        <div className="flex items-end justify-between" style={{ marginTop: 8 }}>
          <Tilt max={16} radius={999} style={{ padding: 6, background: C.paper, boxShadow: "0 12px 26px -6px rgba(0,0,0,.42)" }}>{isMe && onUploadAvatar ? <label style={{ position: "relative", cursor: "pointer", display: "block" }}><input type="file" accept="image/*" style={{ display: "none" }} disabled={avatarProgress != null} onChange={pickAvatar} /><div style={{ position: "relative", width: 84, height: 84 }}><Avatar id={u.id} size={84} /><UploadRing pct={avatarProgress} size={84} strokeWidth={3} /></div><div style={{ position: "absolute", right: 0, bottom: 0, width: 28, height: 28, borderRadius: "50%", backgroundImage: GBRAND, display: "flex", alignItems: "center", justifyContent: "center", border: `3px solid ${C.paper}` }}>{avatarProgress != null ? <Mono style={{ fontSize: 9, color: "#fff", fontWeight: 700 }}>{avatarProgress}%</Mono> : <Camera size={14} color="#fff" />}</div></label> : <button onClick={() => u.avatar && setAvatarView(true)} className="block active:scale-95" style={{ borderRadius: "50%" }}><Avatar id={u.id} size={84} /></button>}</Tilt>
          {isMe
            ? <div className="mb-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundImage: GBRAND, color: "#fff", boxShadow: SH.glow }}><Zap size={14} fill="#fff" /><span className="text-[13px] font-bold" style={{ fontFamily: DISPLAY }}>LVL {lvl}</span></div>
            : blocked ? null : <div className="mb-2 flex gap-2"><button onClick={() => onToggleFollow(userId)} className="px-5 py-2 rounded-xl text-sm font-bold transition active:scale-95" style={amFollowing ? { background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` } : { backgroundImage: GBRAND, color: "#fff", boxShadow: SH.glow }}>{amFollowing ? "მიჰყვები ✓" : "მიყევი"}</button></div>}
        </div>
        <div className="mt-2.5 flex items-center gap-1.5"><span style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700, fontSize: 20 }}>{dispName}</span>{u.verified && <ShieldCheck size={17} style={{ color: C.accent }} />}</div>
        <Mono style={{ fontSize: 13, color: C.faint }}>@{u.handle}</Mono>
        <div className="text-[14px] mt-2" style={{ color: C.ink2, lineHeight: 1.5 }}>{dispBio}</div>
        {(u.location || u.website) && <div className="flex items-center gap-3 mt-2 text-[13px]" style={{ color: C.faint }}>{u.location && <span className="flex items-center gap-1"><MapPin size={13} /> {u.location}</span>}{u.website && <a href={u.website.startsWith("http") ? u.website : "https://" + u.website} target="_blank" rel="noreferrer" className="flex items-center gap-1" style={{ color: C.accent }}><Link2 size={13} /> <Mono style={{ fontSize: 12 }}>{u.website.replace(/^https?:\/\//, "")}</Mono></a>}</div>}
        <div className={"grid mt-4 py-3.5 " + (isMe ? "grid-cols-4" : "grid-cols-3")} style={card()}>
          <div className="text-center"><Mono className="text-lg font-bold block" style={{ color: C.ink }}>{mine.length}</Mono><div className="text-[12px]" style={{ color: C.muted }}>პოსტი</div></div>
          <button onClick={() => onOpenList("followers", userId)} className="text-center active:opacity-60" style={{ borderLeft: `1px solid ${C.lineSoft}` }}><Mono className="text-lg font-bold block" style={{ color: C.ink }}>{fmt(followers)}</Mono><div className="text-[12px]" style={{ color: C.muted }}>მოგყვება</div></button>
          <button onClick={() => onOpenList("following", userId)} className="text-center active:opacity-60" style={{ borderLeft: `1px solid ${C.lineSoft}` }}><Mono className="text-lg font-bold block" style={{ color: C.ink }}>{fmt(followingCount)}</Mono><div className="text-[12px]" style={{ color: C.muted }}>მიყვები</div></button>
          {isMe && <button onClick={() => onOpenList("viewers", userId)} className="text-center active:opacity-60" style={{ borderLeft: `1px solid ${C.lineSoft}` }}><Mono className="text-lg font-bold block" style={{ color: C.ink }}>{fmt(viewerCount)}</Mono><div className="text-[12px]" style={{ color: C.muted }}>{t("profile.viewers")}</div></button>}
        </div>
        <div className="flex gap-2 mt-3">{isMe
          ? <button onClick={onSettings} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: C.surface, color: C.ink, border: `1px solid ${C.line}`, boxShadow: SH.card }}>პროფილის რედაქტირება</button>
          : blocked ? <button onClick={() => onUnblock(userId)} className="flex-1 py-2.5 rounded-xl text-sm font-bold transition active:scale-95" style={{ background: C.surfaceMuted, color: "#e05656", border: `1px solid ${C.line}` }}>🚫 განბლოკვა</button>
          : <><button onClick={() => onToggleFollow(userId)} className="flex-1 py-2.5 rounded-xl text-sm font-bold transition active:scale-95" style={amFollowing ? { background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` } : { backgroundImage: GBRAND, color: "#fff", boxShadow: SH.glow }}>{amFollowing ? "მიჰყვები ✓" : "მიყევი"}</button><button onClick={() => onMessage(userId)} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: C.surface, color: C.ink, border: `1px solid ${C.line}` }}>შეტყობინება</button></>}</div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar mt-4 pb-1">
          {isMe && <button onClick={() => setCreatingHl(true)} className="flex flex-col items-center gap-1.5 shrink-0"><div className="rounded-full flex items-center justify-center" style={{ width: 60, height: 60, border: `2px dashed ${C.line}`, color: C.muted }}><Plus size={22} /></div><span className="text-[11px]" style={{ color: C.muted }}>ახალი</span></button>}
          {hls.map(h => { const [ga, gb] = GRADS[hashIdx(h.id, GRADS.length)]; return <button key={h.id} onClick={() => setViewHl(h)} className="flex flex-col items-center gap-1.5 shrink-0"><div className="rounded-full p-[2px]" style={{ backgroundImage: GBRAND }}><div className="rounded-full p-[2px]" style={{ background: C.paper }}>{h.cover_url ? <img src={h.cover_url} alt="" loading="lazy" style={{ width: 54, height: 54, objectFit: "cover", borderRadius: 999 }} /> : <div style={{ width: 54, height: 54, borderRadius: 999, background: `linear-gradient(140deg, ${ga}, ${gb})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontFamily: DISPLAY }}>{(h.title || "?").trim()[0]}</div>}</div></div><span className="text-[11px] truncate" style={{ color: C.ink2, maxWidth: 64 }}>{h.title}</span></button>; })}
        </div>
        {creatingHl && <HighlightCreate onClose={() => setCreatingHl(false)} onCreated={reloadHls} flash={flash} />}
        {avatarView && u.avatar && <Lightbox images={[u.avatar]} start={0} onClose={() => setAvatarView(false)} />}
        {viewHl && <HighlightView hl={viewHl} isMe={isMe} onClose={() => setViewHl(null)} onDelete={(h) => { highlightsApi.remove(h.id).then(() => { setViewHl(null); reloadHls(); flash("highlight წაიშალა"); }).catch(() => {}); }} />}
        {menuOpen && !isMe && (
          <div className="fixed inset-0 z-[70] flex items-end" style={{ background: "rgba(0,0,0,.45)", paddingBottom: "var(--mz-nav, 64px)" }} onClick={() => setMenuOpen(false)}>
            <div className="w-full rounded-t-3xl pb-6 pt-2" style={{ background: C.paper, maxWidth: 600, margin: "0 auto", animation: "up .25s ease both" }} onClick={e => e.stopPropagation()}>
              <div className="mx-auto rounded-full mb-2" style={{ width: 38, height: 4, background: C.line }} />
              <div className="px-5 pb-2 pt-1 text-[13px]" style={{ color: C.faint }}>@{u.handle}</div>
              <button onClick={() => { setMenuOpen(false); flash(t("profile.linkCopied")); }} className="w-full flex items-center gap-3 px-5 py-3.5 active:opacity-60" style={{ color: C.ink }}><Link2 size={20} style={{ color: C.muted }} /><span className="text-[15px] font-medium">{t("profile.copyLink")}</span></button>
              <button onClick={() => { setMenuOpen(false); setQrOpen(true); }} className="w-full flex items-center gap-3 px-5 py-3.5 active:opacity-60" style={{ color: C.ink }}><Send size={20} style={{ color: C.muted }} /><span className="text-[15px] font-medium">{t("profile.qrCode")}</span></button>
              {!blocked && <button onClick={() => { setMenuOpen(false); (muted ? onUnmute : onMute)(userId); }} className="w-full flex items-center gap-3 px-5 py-3.5 active:opacity-60" style={{ color: C.ink }}>{muted ? <Volume2 size={20} style={{ color: C.muted }} /> : <VolumeX size={20} style={{ color: C.muted }} />}<span className="text-[15px] font-medium">{muted ? t("profile.unmute") : t("profile.mute")}</span></button>}
              {!blocked && <button onClick={() => { setMenuOpen(false); onToggleCloseFriend(userId); }} className="w-full flex items-center gap-3 px-5 py-3.5 active:opacity-60" style={{ color: C.ink }}><Star size={20} style={{ color: closeFriend ? "#1f8f4e" : C.muted }} fill={closeFriend ? "#1f8f4e" : "none"} /><span className="text-[15px] font-medium">{closeFriend ? t("profile.removeCloseFriend") : t("profile.addCloseFriend")}</span></button>}
              <button onClick={() => { setMenuOpen(false); onReport && onReport("user", userId); }} className="w-full flex items-center gap-3 px-5 py-3.5 active:opacity-60" style={{ color: C.ink }}><Flag size={20} style={{ color: C.muted }} /><span className="text-[15px] font-medium">{t("profile.report")}</span></button>
              <button onClick={() => { setMenuOpen(false); (blocked ? onUnblock : onBlock)(userId); }} className="w-full flex items-center gap-3 px-5 py-3.5 active:opacity-60" style={{ color: "#e05656" }}><Shield size={20} /><span className="text-[15px] font-semibold">{blocked ? t("profile.unblock") : t("profile.block")}</span></button>
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
                <button onClick={() => { if (navigator.clipboard) navigator.clipboard.writeText(link).then(() => flash(t("link.copied"))).catch(() => {}); else flash(t("link.prefix") + link); }} className="w-full mt-4 py-3 rounded-2xl text-[14px] font-bold text-white active:scale-[.98]" style={{ backgroundImage: GBRAND }}>{t("profile.copyLink")}</button>
                <button onClick={() => setQrOpen(false)} className="w-full mt-2 py-2.5 rounded-2xl text-[14px] font-bold" style={{ background: C.surfaceMuted, color: C.ink }}>დახურვა</button>
              </div>
            </div>
          );
        })()}
      </div>
      {gated ? (
        <div className="flex flex-col items-center text-center px-8 py-14">
          <div className="rounded-full flex items-center justify-center mb-3" style={{ width: 64, height: 64, background: C.surfaceMuted }}><Lock size={28} style={{ color: C.faint }} /></div>
          <div className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: DISPLAY }}>{t("profile.privateTitle")}</div>
          <div className="text-[13.5px] mt-1.5 max-w-[280px]" style={{ color: C.faint, lineHeight: 1.5 }}>{t("profile.privateBody")}</div>
        </div>
      ) : <>
      <div className="flex mt-5" style={{ borderBottom: `1px solid ${C.line}` }}>{[["grid", t("profile.tabPhotos")], ["reels", "Reels"], ["posts", t("profile.tabPosts")], ...(isMe ? [["saved", t("profile.tabSaved")]] : [])].map(([k, l]) => <button key={k} onClick={() => setTab(k)} className="flex-1 py-3 text-sm font-bold transition" style={{ color: tab === k ? C.accent : C.faint, borderBottom: tab === k ? `2px solid ${C.accent}` : "2px solid transparent" }}>{l}</button>)}</div>
      {tab === "grid" && <AlbumsGrid isMe={isMe} albums={albums || []} photos={albumPhotos || []} onCreateAlbum={onCreateAlbum} onRenameAlbum={onRenameAlbum} onDeleteAlbum={onDeleteAlbum} onUploadPhoto={onUploadAlbumPhoto} onMovePhoto={onMoveAlbumPhoto} onReorderPhotos={onReorderAlbumPhotos} onDeletePhoto={onDeleteAlbumPhoto} flash={flash} />}
      {tab === "posts" && <div className="space-y-4 px-3 pt-4">{mine.length ? mine.map(p => <PostCard key={p.id} post={p} onLike={onLike} onReact={onReact} onSave={onSave} onComment={onComment} onPollVote={onPollVote} onTag={onTag} onReport={onReport} onRemove={onRemove} onOpenProfile={onOpenProfile} isAdmin={isAdmin} onEdit={onEditPost} onDelete={onDeletePost} onEditComment={onEditComment} onDeleteComment={onDeleteComment} />) : <Empty icon={ImageIcon} t={t("profile.noPosts")} s="" />}</div>}
      {tab === "reels" && ((gridReels.length || isMe) ? <div className="pt-1">
        {isMe && gridReels.length > 0 && <div className="grid grid-cols-3 gap-2 px-3 pb-3">
          {[[t("reels.views"), reelViews, "#6750F2"], [t("reels.likes"), reelLikes, C.like], [t("reels.count"), gridReels.length, C.accent]].map(([lab, val, col]) => <div key={lab} className="rounded-2xl py-3 text-center" style={{ background: C.surface, border: `1px solid ${C.line}` }}><div className="text-[20px] font-bold" style={{ color: col, fontFamily: DISPLAY }}>{kfmt(val)}</div><div className="text-[11px] mt-0.5" style={{ color: C.muted }}>{lab}</div></div>)}
        </div>}
        <div className="grid grid-cols-3 gap-1 px-1">
        {isMe && <button onClick={onAddReel} className="flex flex-col items-center justify-center gap-1 active:scale-95" style={{ aspectRatio: "9/16", borderRadius: 10, background: C.accentSoft, color: C.accent, border: `2px dashed ${C.accent}66` }}><Plus size={26} /><span className="text-[11px] font-bold">{t("word.new")}</span></button>}
        {gridReels.map(r => (
          <div key={r.id} className="relative overflow-hidden" style={{ aspectRatio: "9/16", borderRadius: 10 }}>
            <button onClick={() => onOpenReels && onOpenReels()} className="block w-full h-full active:opacity-80">{r.image ? <Pic src={r.image} grad={GRADS[hashIdx(r.id, GRADS.length)]} w={400} round={10} style={{ aspectRatio: "9/16" }} /> : r.video ? <video src={r.video + "#t=0.1"} preload="metadata" muted playsInline className="w-full h-full" style={{ objectFit: "cover", borderRadius: 10, aspectRatio: "9/16", background: "#000" }} /> : <Pic src={null} grad={GRADS[hashIdx(r.id, GRADS.length)]} round={10} style={{ aspectRatio: "9/16" }} />}</button>
            <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1" style={{ color: "#fff", filter: "drop-shadow(0 1px 2px rgba(0,0,0,.7))" }}><Play size={12} fill="#fff" /><Mono style={{ fontSize: 11, fontWeight: 700 }}>{kfmt(r.views || 0)}</Mono></span>
            {isMe && <div className="absolute top-1 right-1 flex flex-col gap-1">
              <button onClick={() => { setEditReel(r.id); setEditCap(r.caption || ""); }} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 27, height: 27, background: "rgba(0,0,0,.6)", color: "#fff" }}><Settings size={13} /></button>
              <button onClick={() => { if (window.confirm(t("reels.deleteConfirm"))) onReelDelete(r.id); }} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 27, height: 27, background: "rgba(220,38,38,.85)", color: "#fff" }}><Trash2 size={13} /></button>
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
              <button onClick={() => setSelCol(null)} className="px-3.5 py-1.5 rounded-full text-[13px] font-bold shrink-0" style={selCol === null ? { backgroundImage: GBRAND, color: "#fff" } : { background: C.surfaceMuted, color: C.muted }}>{t("word.all")}</button>
              {cols.map(c => <button key={c.id} onClick={() => setSelCol(c.id)} className="px-3.5 py-1.5 rounded-full text-[13px] font-bold shrink-0" style={selCol === c.id ? { backgroundImage: GBRAND, color: "#fff" } : { background: C.surfaceMuted, color: C.muted }}>📁 {c.name}</button>)}
              <button onClick={async () => { const n = window.prompt(t("folder.namePrompt")); if (n) await onCreateCollection(n); }} className="px-3.5 py-1.5 rounded-full text-[13px] font-bold shrink-0 flex items-center gap-1" style={{ background: C.accentSoft, color: C.accentText }}><Plus size={14} /> {t("word.new")}</button>
            </div>}
            {savedItems.length ? <div className="grid grid-cols-3 gap-1 px-1">{savedItems.map(it => (
              <div key={it.type + it.id} className="relative overflow-hidden" style={{ aspectRatio: "1", borderRadius: 10 }}>
                <button onClick={() => it.type === "reel" ? (onOpenReels && onOpenReels()) : setSel(it.id)} className="block w-full h-full active:opacity-80">{it.image ? <Pic src={it.image} grad={GRADS[hashIdx(it.id, GRADS.length)]} w={400} round={10} style={{ aspectRatio: "1" }} /> : it.video ? <video src={it.video + "#t=0.1"} preload="metadata" muted playsInline className="w-full h-full" style={{ objectFit: "cover", borderRadius: 10, aspectRatio: "1", background: "#000" }} /> : <div className="w-full h-full flex items-center justify-center p-2" style={{ background: C.surfaceMuted }}><div className="text-[11px] text-center line-clamp-4" style={{ color: C.ink2 }}>{(it.text || t("word.post")).slice(0, 80)}</div></div>}</button>
                {it.type === "reel" && <span className="absolute top-1.5 right-1.5 pointer-events-none" style={{ color: "#fff", filter: "drop-shadow(0 1px 2px rgba(0,0,0,.6))" }}><Play size={15} fill="#fff" /></span>}
                {isMe && it.type === "post" && <button onClick={() => setAssignFor(it.id)} className="absolute bottom-1.5 right-1.5 rounded-full flex items-center justify-center active:scale-90" style={{ width: 26, height: 26, background: "rgba(0,0,0,.55)" }}><span style={{ fontSize: 13 }}>📁</span></button>}
              </div>
            ))}</div> : <Empty icon={Bookmark} t={selCol ? t("folder.empty") : t("saved.nothingYet")} s={selCol ? t("saved.dragHint") : t("saved.tapHint")} />}
          </div>
        );
      })()}
      </>}
      {assignFor && (
        <div className="fixed inset-0 z-[70] flex items-end" style={{ background: "rgba(0,0,0,.45)" }} onClick={() => setAssignFor(null)}>
          <div className="w-full rounded-t-3xl pb-6 pt-2" style={{ background: C.paper, maxWidth: 600, margin: "0 auto", animation: "up .25s ease both" }} onClick={e => e.stopPropagation()}>
            <div className="mx-auto rounded-full mb-2" style={{ width: 38, height: 4, background: C.line }} />
            <div className="px-5 py-2 text-[13px] font-bold" style={{ color: C.muted }}>{t("folder.moveTo")}</div>
            {(collections || []).map(c => <button key={c.id} onClick={() => { onAssignCollection(assignFor, c.id); setAssignFor(null); }} className="w-full flex items-center gap-3 px-5 py-3.5 active:opacity-60" style={{ color: C.ink }}><span style={{ fontSize: 18 }}>📁</span><span className="text-[15px] font-medium">{c.name}</span></button>)}
            <button onClick={async () => { const n = window.prompt(t("folder.namePrompt")); if (n) { const c = await onCreateCollection(n); if (c) { onAssignCollection(assignFor, c.id); setAssignFor(null); } } }} className="w-full flex items-center gap-3 px-5 py-3.5 active:opacity-60" style={{ color: C.accent }}><Plus size={20} /><span className="text-[15px] font-medium">{t("folder.new")}</span></button>
            <button onClick={() => { onAssignCollection(assignFor, null); setAssignFor(null); }} className="w-full flex items-center gap-3 px-5 py-3.5 active:opacity-60" style={{ color: "#e05656" }}><X size={20} /><span className="text-[15px] font-medium">{t("folder.remove")}</span></button>
          </div>
        </div>
      )}

      {selPost && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto" style={{ background: "rgba(0,0,0,.55)" }} onClick={() => setSel(null)}>
          <div className="w-full max-w-[540px] min-h-full md:min-h-0 md:my-6" style={{ background: C.paper }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3 sticky top-0 z-10" style={{ background: C.paper + "e6", backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.line}` }}><button onClick={() => setSel(null)} style={{ color: C.ink2 }}><ArrowLeft size={22} /></button><span className="font-bold" style={{ color: C.ink, fontFamily: DISPLAY }}>{t("word.post")}</span></div>
            <div className="p-3"><PostCard post={selPost} onLike={onLike} onReact={onReact} onSave={onSave} onComment={onComment} onPollVote={onPollVote} onTag={onTag} onReport={onReport} onRemove={onRemove} onOpenProfile={onOpenProfile} isAdmin={isAdmin} onEdit={onEditPost} onDelete={onDeletePost} onEditComment={onEditComment} onDeleteComment={onDeleteComment} /></div>
          </div>
        </div>
      )}
      {editReel && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-5" style={{ background: "rgba(0,0,0,.55)" }} onClick={() => setEditReel(null)}>
          <div className="w-full max-w-[440px] rounded-3xl p-5" style={{ background: C.surface, boxShadow: SH.pop }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="text-[17px]" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700 }}>{t("reel.editTitle")}</h2><button onClick={() => setEditReel(null)} style={{ color: C.faint }}><X size={22} /></button></div>
            <textarea value={editCap} onChange={e => setEditCap(e.target.value)} rows={3} placeholder={t("reel.captionPh")} className="w-full px-4 py-3 rounded-xl mb-3 text-[15px] outline-none resize-none" style={{ background: C.surfaceMuted, color: C.ink }} />
            <button onClick={() => { onReelEdit(editReel, editCap.trim()); setEditReel(null); flash && flash(t("reel.updated")); }} className="w-full py-3.5 rounded-xl text-[15px] font-bold text-white active:scale-[.98]" style={{ backgroundImage: GBRAND }}>{t("action.save")}</button>
          </div>
        </div>
      )}
    </div>
  );
}


// collapses consecutive/same-target like/reel_like/story_like/follow
// notifications into one row ("X and 3 others liked your post"), Facebook-
// style — comments/replies/mentions/etc. keep their own text and stay
// individual. Purely a display concern, no schema change.
function groupNotifs(list) {
  const groupable = new Set(["like", "reel_like", "story_like", "follow", "comment_like", "repost", "poll_vote"]);
  const targetKey = (n) => n.type === "follow" ? "follow" : `${n.type}:${n.commentId || n.postId || n.reelId || n.storyId || ""}`;
  const out = []; const byKey = {};
  list.forEach(n => {
    if (!groupable.has(n.type)) { out.push(n); return; }
    const key = targetKey(n);
    const existing = byKey[key];
    if (existing) { existing.group.push(n.fromId); existing.count++; if (!n.read) existing.read = false; return; }
    const g = { ...n, group: [n.fromId], count: 1 };
    byKey[key] = g;
    out.push(g);
  });
  return out;
}

export function Notifications({ notifs, onOpenProfile, onOpenPost, onOpenForum, onOpenReels, onOpenOwnStory, onOpenGroup, onOpenEvent, isFollowing, onToggleFollow }) {
  const [filter, setFilter] = useState("all");
  const verb = { like: t("notif.likedShort"), comment: t("notif.commentedShort"), reply: t("notif.repliedShort"), follow: t("notif.followedShort"), mention: t("notif.tagged"), thread_reply: t("notif.threadRepliedShort"), thread_activity: t("notif.threadActivityShort"), profile_view: t("notif.profileViewedShort"), reel_like: t("notif.reelLikedShort"), reel_comment: t("notif.reelCommentedShort"), story_like: t("notif.storyLikedShort"), story_comment: t("notif.storyCommentedShort"), post_tag: t("notif.postTaggedShort"), group_post: t("notif.groupPostShort"), group_approved: t("notif.groupApprovedShort"), event_rsvp: t("notif.eventRsvpShort"), birthday: t("notif.birthdayShort"), level_up: t("notif.levelUpShort"), group_join_request: t("notif.groupJoinRequestShort"), comment_like: t("notif.commentLikedShort"), market_review: t("notif.marketReviewShort"), repost: t("notif.repostShort"), poll_vote: t("notif.pollVoteShort"), announcement: t("notif.announcement"), public_approved: t("notif.publicApproved"), public_rejected: t("notif.publicRejected") };
  const Icon = { like: Heart, comment: MessageCircle, reply: Reply, follow: User, mention: Hash, thread_reply: MessageSquare, thread_activity: MessageSquare, profile_view: Eye, reel_like: Heart, reel_comment: MessageCircle, story_like: Heart, story_comment: MessageCircle, post_tag: Tag, group_post: Users, group_approved: Users, event_rsvp: Calendar, birthday: Gift, level_up: Trophy, group_join_request: Users, comment_like: Heart, market_review: ShoppingBag, repost: CornerUpLeft, poll_vote: Check, announcement: Bell, public_approved: Check, public_rejected: X };
  const col = { like: C.like, comment: C.accent, reply: C.accent, follow: C.online, mention: C.star, thread_reply: C.accent, thread_activity: C.online, profile_view: C.cyan, reel_like: C.like, reel_comment: C.accent, story_like: C.like, story_comment: C.accent, post_tag: C.star, group_post: C.accent, group_approved: C.online, event_rsvp: C.accent, birthday: C.star, level_up: C.star, group_join_request: C.accent, comment_like: C.like, market_review: C.accent, repost: C.accent, poll_vote: C.online, announcement: C.accent, public_approved: C.online, public_rejected: C.like };
  const postTypes = ["like", "comment", "reply", "thread_activity", "mention", "post_tag", "group_post", "comment_like", "repost", "poll_vote", "public_approved", "public_rejected"];
  const filtered = filter === "mentions" ? notifs.filter(n => n.type === "mention") : filter === "unread" ? notifs.filter(n => !n.read) : notifs;
  const grouped = groupNotifs(filtered);
  return (
    <div className="pb-28 md:pb-8">
      <div className="px-4 pt-5 pb-3"><Title>{t("notif.pageTitle")}</Title></div>
      <div className="flex gap-2 px-4 pb-3">{[["all", t("notif.filterAll")], ["mentions", t("notif.filterMentions")], ["unread", t("notif.filterUnread")]].map(([k, l]) => <button key={k} onClick={() => setFilter(k)} className="px-3.5 py-1.5 rounded-full text-[13px] font-bold transition" style={filter === k ? { background: C.accentSoft, color: C.accentText } : { background: C.surfaceMuted, color: C.muted }}>{l}</button>)}</div>
      {grouped.length === 0 && <div className="flex flex-col items-center justify-center text-center px-10" style={{ paddingTop: 90, color: C.faint }}><div className="rounded-3xl flex items-center justify-center mb-4" style={{ width: 76, height: 76, background: C.accentSoft }}><Bell size={34} style={{ color: C.accent }} /></div><div className="text-[15px] font-bold mb-1.5" style={{ color: C.ink2 }}>{t("notif.emptyTitle")}</div><div className="text-[13px]" style={{ lineHeight: 1.5 }}>{t("notif.emptyDesc")}</div></div>}
      {grouped.map(n => { const I = Icon[n.type] || Bell; return (
        <button key={n.id} onClick={() => {
          if (n.type === "reel_like" || n.type === "reel_comment") { onOpenReels && onOpenReels(n.reelId); return; }
          if (n.type === "story_like" || n.type === "story_comment") { onOpenOwnStory && onOpenOwnStory(); return; }
          if ((n.type === "group_post" || n.type === "group_approved" || n.type === "group_join_request") && n.groupId && onOpenGroup) { onOpenGroup(n.groupId); return; }
          if (n.type === "event_rsvp" && n.eventId && onOpenEvent) { onOpenEvent(n.eventId); return; }
          if (n.threadId && onOpenForum) { onOpenForum(n.threadId, n.replyId); return; }
          if (n.postId && onOpenPost && postTypes.includes(n.type)) { onOpenPost(n.postId, n.commentId); return; }
          onOpenProfile(n.fromId);
        }} className="w-full flex items-center gap-3 px-4 py-3 text-left transition hover:opacity-90" style={{ background: n.read ? "transparent" : C.accentSoft + "66", borderBottom: `1px solid ${C.lineSoft}` }}><div className="relative"><Avatar id={n.fromId} size={46} /><span className="absolute -bottom-1 -right-1 rounded-full flex items-center justify-center" style={{ width: 22, height: 22, background: col[n.type] || C.accent, border: `2px solid ${C.paper}` }}><I size={12} color="#fff" fill="#fff" /></span></div><div className="flex-1 text-[14px]" style={{ color: C.ink2, lineHeight: 1.4 }}><span className="font-bold" style={{ color: C.ink }}>{USERS[n.fromId] ? USERS[n.fromId].name.split(" ")[0] : "mzera"} </span>{n.count > 1 && <span>{t("post.andMore")} {n.count - 1} {t("post.more")} </span>}{verb[n.type] || ""}{(n.text || n.postText) && <span style={{ color: C.muted }}>: „{(() => { const s = n.text || n.postText; return s.length > 60 ? s.slice(0, 60) + "…" : s; })()}"</span>}<Mono className="ml-1" style={{ color: C.faint, fontSize: 12 }}>· {n.time}</Mono></div>{n.type === "follow" ? <FollowBtn id={n.fromId} isFollowing={isFollowing} onToggle={onToggleFollow} /> : n.postImage ? <Pic src={n.postImage} round={12} style={{ width: 48, height: 48 }} className="shrink-0" /> : null}</button>
      ); })}
    </div>
  );
}

function CheckList({ results }) {
  return (
    <div className="p-4" style={card()}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-[14px]" style={{ color: C.ink }}>შედეგი</span>
        <Mono className="font-bold" style={{ color: results.every(c => c.pass) ? C.online : C.like }}>{results.filter(c => c.pass).length}/{results.length}</Mono>
      </div>
      <div className="space-y-2.5">
        {results.map((c, i) => (
          <div key={i} className="flex items-start gap-2.5">
            {c.pass ? <Check size={16} style={{ color: C.online, marginTop: 2 }} className="shrink-0" /> : <X size={16} style={{ color: C.like, marginTop: 2 }} className="shrink-0" />}
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold" style={{ color: C.ink }}>{c.name}</div>
              {!c.pass && c.error && <div className="text-[11.5px] mt-0.5" style={{ color: C.like }}>{c.error}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────  ADMIN  ───────────────────────── */

export function Admin({ reports, posts, allUsers, userCount, postCount, online, stats, dailyTrends, onResolve, onRemovePost, onSetVerified, onSetAdmin, onOpenProfile, onBanUser, onGrantXp, onSetXp, onDeleteUser, onBroadcast, pendingPublic, onReviewPublic, listings, threads, reels, onDeleteListing, onDeleteThread, onDeleteReel, onEditListing, onEditThread, onSetThreadPinned, onSetThreadLocked, groups, events, films, songs, onEditGroup, onDeleteGroup, onEditEvent, onDeleteEvent, onEditFilm, onDeleteFilm, onEditSong, onDeleteSong, langEnabled, langProgress, onToggleLanguages, stories, onDeleteStory, onDeleteComment, adminActions }) {
  const [seg, setSeg] = useState("reports"); const [q, setQ] = useState(""); const [cseg, setCseg] = useState("listings"); const [confirm, setConfirm] = useState(null); const [bcast, setBcast] = useState(""); const [delUser, setDelUser] = useState(null);
  const [bulkMode, setBulkMode] = useState(false); const [selected, setSelected] = useState(() => new Set());
  const toggleCseg = (k) => { setCseg(k); setSelected(new Set()); };
  const toggleSelected = (id) => setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const bulkDeleteFns = { listings: onDeleteListing, threads: onDeleteThread, reels: onDeleteReel, groups: onDeleteGroup, events: onDeleteEvent, films: onDeleteFilm, songs: onDeleteSong, stories: onDeleteStory };
  const onBulkDelete = () => {
    if (selected.size === 0) return;
    if (!window.confirm(`წავშალო ${selected.size} ჩანაწერი?`)) return;
    const fn = bulkDeleteFns[cseg];
    selected.forEach(id => fn(id));
    setSelected(new Set());
  };
  const [checks, setChecks] = useState(null);
  const [bChecks, setBChecks] = useState(null);
  const [bChecking, setBChecking] = useState(false);
  const runBChecks = () => { setBChecking(true); runBackendChecks().then(setBChecks).finally(() => setBChecking(false)); };
  const open = reports.filter(r => r.status === "open");
  const S = stats || {};
  const statCards = stats ? [{ l: "მომხმარებელი", v: S.users, i: User, c: C.accent }, { l: "პოსტი", v: S.posts, i: ImageIcon, c: C.online }, { l: "Reels", v: S.reels, i: Film, c: C.cyan }, { l: "განცხადება", v: S.listings, i: ShoppingBag, c: C.accent }, { l: "კომენტარი", v: S.comments, i: MessageSquare, c: C.online }, { l: "მესიჯი", v: S.messages, i: Send, c: C.cyan }, { l: "ახალი დღეს", v: S.new_today, i: UserPlus, c: C.online }, { l: "ვერიფ.", v: S.verified, i: ShieldCheck, c: C.accent }, { l: "დაბანილი", v: S.banned, i: X, c: C.like }, { l: "ღია რეპორტი", v: S.open_reports, i: Flag, c: C.like }] : [{ l: "მომხმარებელი", v: userCount || 0, i: User, c: C.accent }, { l: "სულ პოსტი", v: postCount || 0, i: ImageIcon, c: C.online }, { l: "ღია რეპორტი", v: open.length, i: Flag, c: C.like }, { l: "ონლაინ ახლა", v: online || 0, i: Zap, c: C.cyan }];
  const ql = q.trim().toLowerCase();
  const users = (allUsers || []).filter(u => !ql || (u.name || "").toLowerCase().includes(ql) || (u.username || "").toLowerCase().includes(ql));
  const allPosts = (posts || []).filter(p => !p.hidden).filter(p => !ql || (p.text || "").toLowerCase().includes(ql) || (USERS[p.authorId] && USERS[p.authorId].name.toLowerCase().includes(ql)));
  const topGroups = (groups || []).slice().sort((a, b) => (b.members || 0) - (a.members || 0)).slice(0, 5);
  const topThreads = (threads || []).slice().sort((a, b) => ((b.votes || 0) + (b.replies ? b.replies.length : 0)) - ((a.votes || 0) + (a.replies ? a.replies.length : 0))).slice(0, 5);
  return (
    <div className="pb-28 md:pb-10">
      <div className="flex items-center gap-2 px-4 pt-5 pb-4"><Shield size={24} style={{ color: C.accent }} /><Title>მოდერაცია</Title></div>
      <div className="grid grid-cols-2 gap-2.5 px-4 mb-4">{statCards.map(s => <div key={s.l} className="p-4" style={card()}><div className="rounded-xl flex items-center justify-center mb-2.5" style={{ width: 36, height: 36, background: s.c + "22" }}><s.i size={18} color={s.c} /></div><Mono className="text-2xl font-bold" style={{ color: C.ink }}>{(s.v || 0).toLocaleString()}</Mono><div className="text-[12px]" style={{ color: C.muted }}>{s.l}</div></div>)}</div>

      {dailyTrends && dailyTrends.length > 0 && <div className="px-4 mb-4">
        <div className="p-4" style={card()}>
          <div className="flex items-center gap-2 mb-3"><TrendingUp size={16} style={{ color: C.accent }} /><span className="font-bold text-[14px]" style={{ color: C.ink }}>ტრენდები — ბოლო 14 დღე</span></div>
          <div className="space-y-3">
            {[["new_users", "ახალი მომხმარებელი", C.accent], ["new_posts", "პოსტი", C.online], ["new_comments", "კომენტარი", C.cyan]].map(([key, label, color]) => {
              const vals = dailyTrends.map(d => Number(d[key] || 0));
              const max = Math.max(1, ...vals);
              const total = vals.reduce((a, v) => a + v, 0);
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1"><span className="text-[12px]" style={{ color: C.muted }}>{label}</span><Mono style={{ fontSize: 12, color: C.ink, fontWeight: 700 }}>{total}</Mono></div>
                  <div className="flex items-end gap-[3px]" style={{ height: 36 }}>
                    {dailyTrends.map((d, i) => <div key={d.day} title={`${d.day}: ${vals[i]}`} className="flex-1 rounded-t" style={{ height: Math.max(3, Math.round((vals[i] / max) * 36)), background: color, opacity: 0.85, minWidth: 4 }} />)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2"><Mono style={{ fontSize: 10, color: C.faint }}>{dailyTrends[0] && dailyTrends[0].day}</Mono><Mono style={{ fontSize: 10, color: C.faint }}>{dailyTrends[dailyTrends.length - 1] && dailyTrends[dailyTrends.length - 1].day}</Mono></div>
        </div>
      </div>}

      {(topGroups.length > 0 || topThreads.length > 0) && <div className="grid grid-cols-1 gap-2.5 px-4 mb-4 md:grid-cols-2">
        {topGroups.length > 0 && <div className="p-4" style={card()}>
          <div className="flex items-center gap-2 mb-2.5"><Users size={16} style={{ color: C.accent }} /><span className="font-bold text-[14px]" style={{ color: C.ink }}>ყველაზე აქტიური ჯგუფები</span></div>
          <div className="space-y-2">{topGroups.map((g, i) => <div key={g.id} className="flex items-center gap-2.5"><Mono style={{ fontSize: 12, color: C.faint, width: 14 }}>{i + 1}</Mono><Pic src={g.cover} grad={GRADS[hashIdx(g.id, GRADS.length)]} round={8} style={{ width: 32, height: 32 }} className="shrink-0" /><span className="text-[13px] font-semibold truncate flex-1" style={{ color: C.ink }}>{g.name}</span><Mono style={{ fontSize: 11, color: C.muted }}>{g.members} წევრი</Mono></div>)}</div>
        </div>}
        {topThreads.length > 0 && <div className="p-4" style={card()}>
          <div className="flex items-center gap-2 mb-2.5"><MessageSquare size={16} style={{ color: C.accent }} /><span className="font-bold text-[14px]" style={{ color: C.ink }}>ყველაზე აქტიური თემები</span></div>
          <div className="space-y-2">{topThreads.map((t, i) => <div key={t.id} className="flex items-center gap-2.5"><Mono style={{ fontSize: 12, color: C.faint, width: 14 }}>{i + 1}</Mono><span className="text-[13px] font-semibold truncate flex-1" style={{ color: C.ink }}>{t.title}</span><Mono style={{ fontSize: 11, color: C.muted }}>{t.votes || 0} ხმა · {(t.replies ? t.replies.length : 0)} პასუხი</Mono></div>)}</div>
        </div>}
      </div>}

      <div className="px-4 mb-3"><div className="flex gap-1 p-1 rounded-2xl overflow-x-auto no-scrollbar" style={{ background: C.surfaceMuted }}>{[["reports", "რეპორტები"], ["pending", "🌍 საჯარო" + ((pendingPublic || []).length ? " (" + pendingPublic.length + ")" : "")], ["users", "მომხმარებლები"], ["posts", "პოსტები"], ["content", "კონტენტი"], ["languages", "🌐 ენები"], ["broadcast", "📢 გზავნილი"], ["audit", "📜 ისტორია"], ["system", "🩺 სისტემა"]].map(([k, l]) => <button key={k} onClick={() => setSeg(k)} className="flex-1 py-2 px-3 rounded-xl text-[13px] font-bold transition whitespace-nowrap" style={seg === k ? { background: C.surface, color: C.accent, boxShadow: SH.card } : { color: C.muted }}>{l}</button>)}</div></div>

      {seg === "languages" && <div className="px-4 space-y-3">
        <div className="p-4" style={card()}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Languages size={18} style={{ color: C.accent }} /><span className="font-bold text-[15px]" style={{ color: C.ink }}>{t("admin.langSectionTitle")}</span></div>
            <Switch on={langEnabled} onClick={() => onToggleLanguages(!langEnabled)} />
          </div>
          <div className="text-[12.5px] mt-1.5" style={{ color: C.faint }}>{t("admin.langToggleLabel")}</div>
        </div>
        <div className="p-4" style={card()}>
          <div className="font-bold text-[14px] mb-2.5" style={{ color: C.ink }}>{t("admin.langUserProgress")}</div>
          {(langProgress || []).length === 0 ? <Empty icon={Languages} t="—" s="" /> : (
            <div className="space-y-2.5">
              {langProgress.map((r) => (
                <div key={r.user_id + r.lang} className="flex items-center gap-2.5">
                  <Avatar id={r.user_id} size={30} />
                  <div className="flex-1 min-w-0"><span className="text-[13px] font-semibold truncate block" style={{ color: C.ink }}>{USERS[r.user_id] ? USERS[r.user_id].name : "—"}</span></div>
                  <Mono style={{ fontSize: 11, color: C.muted }}>{r.lang} · {r.mastered}/{Number(r.mastered) + Number(r.in_progress)}</Mono>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>}

      {seg === "system" && <div className="px-4 space-y-3">
        <div className="p-4" style={card()}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0"><Shield size={18} style={{ color: C.accent }} className="shrink-0" /><span className="font-bold text-[15px]" style={{ color: C.ink }}>ლოგიკის შემოწმება (frontend)</span></div>
            <button onClick={() => setChecks(runSelfChecks())} className="px-4 py-1.5 rounded-full text-sm font-bold text-white shrink-0 active:scale-95" style={{ backgroundImage: GBRAND }}>გაშვება</button>
          </div>
          <div className="text-[12.5px] mt-1.5" style={{ color: C.faint }}>ამოწმებს ჭადრაკის ძრავს, ბოტს, i18n ლექსიკონს და მონაცემთა mapper-ებს პირდაპირ ცოცხალ კოდზე — ბრაუზერში, სერვერზე მოთხოვნის გარეშე.</div>
        </div>
        {checks && <CheckList results={checks} />}

        <div className="p-4" style={card()}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0"><Shield size={18} style={{ color: C.accent }} className="shrink-0" /><span className="font-bold text-[15px]" style={{ color: C.ink }}>ბექენდის შემოწმება (Supabase)</span></div>
            <button onClick={runBChecks} disabled={bChecking} className="px-4 py-1.5 rounded-full text-sm font-bold text-white shrink-0 active:scale-95" style={{ backgroundImage: GBRAND, opacity: bChecking ? 0.5 : 1 }}>{bChecking ? "მოწმდება…" : "გაშვება"}</button>
          </div>
          <div className="text-[12.5px] mt-1.5" style={{ color: C.faint }}>ამოწმებს რეალურ Supabase-კავშირს, ავტორიზაციის სესიას და აპლიკაციისთვის საჭირო ცხრილების/სვეტების არსებობას — ამჩნევს, თუ მიგრაცია მიწოდებულია მაგრამ ჯერ არ გაშვებულა.</div>
        </div>
        {bChecks && <CheckList results={bChecks} />}
      </div>}

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

      {seg === "audit" && <div className="px-4">
        {(adminActions || []).length === 0 ? <Empty icon={Shield} t="ცარიელია" s="ადმინის მოქმედებების ისტორია აქ გამოჩნდება." /> : (
          <div className="space-y-2">{adminActions.map(a => {
            const labelMap = {
              resolve_report: "დახურა რეპორტი",
              set_verified: a.meta && a.meta.verified ? "მისცა ვერიფიკაცია" : "მოხსნა ვერიფიკაცია",
              set_admin: a.meta && a.meta.is_admin ? "მისცა admin უფლება" : "მოხსნა admin უფლება",
              set_banned: a.meta && a.meta.banned ? "დაბლოკა მომხმარებელი" : "მოხსნა ბლოკი",
              grant_xp: "დაამატა " + (a.meta ? a.meta.amount : "") + " XP",
              set_xp: "დააყენა XP: " + (a.meta ? a.meta.xp : ""),
              delete_user: "წაშალა მომხმარებელი (სამუდამოდ)",
              broadcast: "გაგზავნა გზავნილი ყველასთან",
              review_public: a.meta && a.meta.approved ? "დაამტკიცა საჯარო პოსტი" : "უარყო საჯარო პოსტი",
              delete_story: "წაშალა Story",
            };
            const targetUser = a.targetType === "user" ? USERS[a.targetId] : null;
            return (
              <div key={a.id} className="p-3 flex items-start gap-3" style={card()}>
                <div className="rounded-full flex items-center justify-center shrink-0" style={{ width: 34, height: 34, background: C.accentSoft, color: C.accentText }}><Shield size={16} /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold" style={{ color: C.ink }}>{a.adminName} · {labelMap[a.action] || a.action}</div>
                  {targetUser && <div className="text-[12.5px]" style={{ color: C.muted }}>{targetUser.name} (@{targetUser.handle})</div>}
                  {a.action === "broadcast" && a.meta && a.meta.message && <div className="text-[12.5px] line-clamp-2" style={{ color: C.muted }}>"{a.meta.message}"</div>}
                  <Mono style={{ fontSize: 11, color: C.faint }}>{a.time}</Mono>
                </div>
              </div>
            );
          })}</div>
        )}
      </div>}

      {(seg === "users" || seg === "posts" || seg === "content") && <div className="px-4 mb-3"><div className="flex items-center gap-2 px-3 py-2.5 rounded-full" style={{ background: C.surfaceMuted }}><Search size={16} style={{ color: C.faint }} /><input value={q} onChange={e => setQ(e.target.value)} placeholder={seg === "users" ? "მოძებნე მომხმარებელი…" : seg === "content" ? "მოძებნე კონტენტი…" : "მოძებნე პოსტი…"} className="flex-1 bg-transparent text-[14px] outline-none" style={{ color: C.ink }} /></div></div>}

      {seg === "reports" && <div className="px-4">
        {open.length === 0 ? <Empty icon={Check} t="სუფთაა ✨" s="ღია რეპორტი არ არის." /> : (
          <div className="space-y-3">{open.map(r => {
            const commentHost = r.type === "comment" ? posts.find(p => (p.comments || []).some(cm => cm.id === r.targetId)) : null;
            const target = r.type === "post" ? posts.find(p => p.id === r.targetId) : r.type === "story" ? (stories || []).find(s => s.id === r.targetId) : r.type === "reel" ? (reels || []).find(x => x.id === r.targetId) : r.type === "comment" ? (commentHost ? commentHost.comments.find(cm => cm.id === r.targetId) : null) : USERS[r.targetId];
            const badge = r.type === "post" ? { l: "POST", bg: C.accentSoft, c: C.accentText } : r.type === "story" ? { l: "STORY", bg: C.online + "22", c: C.online } : r.type === "reel" ? { l: "REEL", bg: C.star + "22", c: C.star } : r.type === "comment" ? { l: "COMMENT", bg: C.surfaceMuted, c: C.ink2 } : { l: "USER", bg: C.likeSoft, c: C.like };
            return (
            <div key={r.id} className="p-4" style={card()}>
              <div className="flex items-start gap-3"><span className="rounded-lg px-2 py-1 text-[11px] font-bold uppercase shrink-0" style={{ background: badge.bg, color: badge.c, fontFamily: MONO }}>{badge.l}</span><div className="flex-1 min-w-0"><div className="text-[14px] font-bold" style={{ color: C.ink }}>{r.reason}</div><div className="text-[12px] mt-0.5" style={{ color: C.faint }}>დაარეპორტა {USERS[r.reporterId].name.split(" ")[0]} · <Mono>{r.time}</Mono></div></div></div>
              <div className="rounded-xl p-3 mt-3 text-[13px]" style={{ background: C.surfaceMuted }}>
                {r.type === "post" && target ? <div className="flex gap-2"><Avatar id={target.authorId} size={28} /><div className="min-w-0"><div className="font-bold text-[13px]" style={{ color: C.ink }}>{USERS[target.authorId].name.split(" ")[0]}</div><div className="line-clamp-2" style={{ color: C.muted }}>{target.text || "(ფოტო პოსტი)"}</div></div></div>
                : r.type === "story" ? (target ? <div className="flex gap-2"><Avatar id={target.authorId} size={28} /><div className="min-w-0"><div className="font-bold text-[13px]" style={{ color: C.ink }}>{USERS[target.authorId] ? USERS[target.authorId].name.split(" ")[0] : "—"}</div><div className="line-clamp-2" style={{ color: C.muted }}>{target.text || "(ფოტო story)"}</div></div></div> : <div style={{ color: C.faint }}>ეს story აღარ არსებობს (ვადა გაუვიდა ან წაშლილია)</div>)
                : r.type === "reel" ? (target ? <div className="flex gap-2"><Avatar id={target.authorId} size={28} /><div className="min-w-0"><div className="font-bold text-[13px]" style={{ color: C.ink }}>{USERS[target.authorId] ? USERS[target.authorId].name.split(" ")[0] : "—"}</div><div className="line-clamp-2" style={{ color: C.muted }}>{target.caption || "(უსათაურო Reel)"}</div></div></div> : <div style={{ color: C.faint }}>ეს Reel აღარ არსებობს (წაშლილია)</div>)
                : r.type === "comment" ? (target ? <div className="flex gap-2"><Avatar id={target.authorId} size={28} /><div className="min-w-0"><div className="font-bold text-[13px]" style={{ color: C.ink }}>{USERS[target.authorId] ? USERS[target.authorId].name.split(" ")[0] : "—"}</div><div className="line-clamp-2" style={{ color: C.muted }}>{target.text}</div></div></div> : <div style={{ color: C.faint }}>ეს კომენტარი აღარ არსებობს (წაშლილია)</div>)
                : <div className="flex gap-2 items-center"><Avatar id={r.targetId} size={28} /><div><div className="font-bold text-[13px]" style={{ color: C.ink }}>{USERS[r.targetId]?.name}</div><Mono style={{ color: C.muted, fontSize: 12 }}>@{USERS[r.targetId]?.handle}</Mono></div></div>}
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => onResolve(r.id)} className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5" style={{ background: C.surface, color: C.ink2, border: `1px solid ${C.line}` }}><Check size={15} /> დახურვა</button>
                {r.type === "post" && target ? <button onClick={() => { onRemovePost(r.targetId); onResolve(r.id); }} className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5" style={{ background: C.likeSoft, color: C.like }}><Trash2 size={15} /> პოსტის წაშლა</button>
                : r.type === "story" && target ? <button onClick={() => { onDeleteStory(r.targetId); onResolve(r.id); }} className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5" style={{ background: C.likeSoft, color: C.like }}><Trash2 size={15} /> Story-ს წაშლა</button>
                : r.type === "reel" && target ? <button onClick={() => { onDeleteReel(r.targetId); onResolve(r.id); }} className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5" style={{ background: C.likeSoft, color: C.like }}><Trash2 size={15} /> Reel-ის წაშლა</button>
                : r.type === "comment" && target ? <button onClick={() => { onDeleteComment(commentHost.id, r.targetId); onResolve(r.id); }} className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5" style={{ background: C.likeSoft, color: C.like }}><Trash2 size={15} /> კომენტარის წაშლა</button>
                : <button onClick={() => onResolve(r.id)} className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5" style={{ background: C.likeSoft, color: C.like }}><Shield size={15} /> დახურვა</button>}
              </div>
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
            <button onClick={() => setDelUser(u)} aria-label={t("action.delete")} className="px-2.5 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1" style={{ background: C.like, color: "#fff" }}><Trash2 size={12} /> წაშლა</button>
          </div>
        </div>
      ))}</div>}

      {seg === "posts" && <div className="px-3 space-y-2">{allPosts.length === 0 ? <Empty icon={ImageIcon} t="არ მოიძებნა" s="" /> : allPosts.map(p => (
        <div key={p.id} className="p-3 flex items-center gap-3" style={card()}>
          {p.image ? <Pic src={p.image} grad={GRADS[hashIdx(p.id, GRADS.length)]} round={10} style={{ width: 46, height: 46 }} /> : <div className="rounded-xl flex items-center justify-center shrink-0" style={{ width: 46, height: 46, background: C.surfaceMuted }}><ImageIcon size={18} style={{ color: C.faint }} /></div>}
          <div className="flex-1 min-w-0"><button onClick={() => onOpenProfile(p.authorId)} className="font-bold text-[13px] block truncate text-left" style={{ color: C.ink }}>{USERS[p.authorId] ? USERS[p.authorId].name.split(" ")[0] : "—"}</button><div className="text-[13px] line-clamp-1" style={{ color: C.muted }}>{p.text || "(ფოტო პოსტი)"}</div><Mono style={{ fontSize: 11, color: C.faint }}>❤ {p.likes} · 💬 {p.comments.length}</Mono></div>
          <button onClick={() => { if (window.confirm("წავშალო ეს პოსტი?")) onRemovePost(p.id); }} aria-label={t("action.delete")} className="rounded-full flex items-center justify-center active:scale-90 shrink-0" style={{ width: 38, height: 38, background: C.likeSoft, color: C.like }}><Trash2 size={16} /></button>
        </div>
      ))}</div>}

      {seg === "content" && <div className="px-3 pb-16">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 flex gap-1 p-1 rounded-2xl overflow-x-auto no-scrollbar" style={{ background: C.surfaceMuted }}>{[["listings", "განცხადებები"], ["threads", "თემები"], ["reels", "Reels"], ["groups", "ჯგუფები"], ["events", "ივენთები"], ["films", "ფილმები"], ["songs", "მუსიკა"], ["stories", "Stories"]].map(([k, l]) => <button key={k} onClick={() => toggleCseg(k)} className="py-2 px-3 rounded-xl text-[12px] font-bold transition whitespace-nowrap" style={cseg === k ? { background: C.surface, color: C.accent, boxShadow: SH.card } : { color: C.muted }}>{l}</button>)}</div>
          <button onClick={() => { setBulkMode(v => !v); setSelected(new Set()); }} className="px-3 py-2 rounded-xl text-[12px] font-bold shrink-0" style={bulkMode ? { backgroundImage: GBRAND, color: "#fff" } : { background: C.surfaceMuted, color: C.muted }}>მონიშვნა</button>
        </div>
        {cseg === "listings" && <div className="space-y-2">{(() => { const items = (listings || []).filter(l => !ql || (l.title || "").toLowerCase().includes(ql)); return items.length === 0 ? <Empty icon={ShoppingBag} t="ცარიელია" s="" /> : items.map(l => (
          <div key={l.id} className="p-3 flex items-center gap-3" style={card()}>
            {bulkMode && <button onClick={() => toggleSelected(l.id)} className="rounded-full flex items-center justify-center shrink-0" style={{ width: 22, height: 22, border: `2px solid ${selected.has(l.id) ? C.accent : C.line}`, background: selected.has(l.id) ? C.accent : "transparent" }}>{selected.has(l.id) && <Check size={14} color="#fff" />}</button>}
            <Pic src={l.image} grad={GRADS[hashIdx(l.id, GRADS.length)]} round={10} style={{ width: 46, height: 46 }} />
            <div className="flex-1 min-w-0"><div className="font-bold text-[13px] truncate" style={{ color: C.ink }}>{l.title}</div><div className="text-[12px]" style={{ color: C.accent, fontWeight: 700 }}>{(l.price || 0).toLocaleString()}₾</div><Mono style={{ fontSize: 11, color: C.faint }} className="truncate block">{USERS[l.sellerId] ? USERS[l.sellerId].name.split(" ")[0] : "—"}</Mono></div>
            <button onClick={() => { const v = window.prompt("ახალი სახელი:", l.title); if (v && v.trim() && v.trim() !== l.title) onEditListing(l.id, { title: v.trim() }); }} className="rounded-full flex items-center justify-center active:scale-90 shrink-0" style={{ width: 38, height: 38, background: C.accentSoft, color: C.accentText }}><Pencil size={16} /></button>
            <button onClick={() => { if (window.confirm("წავშალო ეს განცხადება?")) onDeleteListing(l.id); }} aria-label={t("action.delete")} className="rounded-full flex items-center justify-center active:scale-90 shrink-0" style={{ width: 38, height: 38, background: C.likeSoft, color: C.like }}><Trash2 size={16} /></button>
          </div>
        )); })()}</div>}
        {cseg === "threads" && <div className="space-y-2">{(() => { const items = (threads || []).filter(t => !ql || (t.title || "").toLowerCase().includes(ql)); return items.length === 0 ? <Empty icon={MessageSquare} t="ცარიელია" s="" /> : items.map(t => (
          <div key={t.id} className="p-3 flex items-center gap-3" style={card()}>
            {bulkMode && <button onClick={() => toggleSelected(t.id)} className="rounded-full flex items-center justify-center shrink-0" style={{ width: 22, height: 22, border: `2px solid ${selected.has(t.id) ? C.accent : C.line}`, background: selected.has(t.id) ? C.accent : "transparent" }}>{selected.has(t.id) && <Check size={14} color="#fff" />}</button>}
            <div className="rounded-xl flex items-center justify-center shrink-0" style={{ width: 40, height: 40, background: catColor(t.cat) + "1f" }}><MessageSquare size={18} style={{ color: catColor(t.cat) }} /></div>
            <div className="flex-1 min-w-0"><div className="font-bold text-[13px] truncate" style={{ color: C.ink }}>{t.title}</div><div className="text-[12px] line-clamp-1" style={{ color: C.muted }}>{t.body}</div><Mono style={{ fontSize: 11, color: C.faint }} className="truncate block">{USERS[t.authorId] ? USERS[t.authorId].name.split(" ")[0] : "—"}</Mono></div>
            <button onClick={() => onSetThreadPinned(t.id, !t.pinned)} className="rounded-full flex items-center justify-center active:scale-90 shrink-0" style={t.pinned ? { width: 38, height: 38, backgroundImage: GBRAND, color: "#fff" } : { width: 38, height: 38, background: C.surfaceMuted, color: C.ink2 }}><Pin size={16} /></button>
            <button onClick={() => onSetThreadLocked(t.id, !t.locked)} className="rounded-full flex items-center justify-center active:scale-90 shrink-0" style={{ width: 38, height: 38, background: C.surfaceMuted, color: t.locked ? C.like : C.ink2 }}><Lock size={16} /></button>
            <button onClick={() => { const v = window.prompt("ახალი სათაური:", t.title); if (v && v.trim() && v.trim() !== t.title) onEditThread(t.id, { title: v.trim() }); }} className="rounded-full flex items-center justify-center active:scale-90 shrink-0" style={{ width: 38, height: 38, background: C.accentSoft, color: C.accentText }}><Pencil size={16} /></button>
            <button onClick={() => { if (window.confirm("წავშალო ეს თემა?")) onDeleteThread(t.id); }} aria-label="წაშლა" className="rounded-full flex items-center justify-center active:scale-90 shrink-0" style={{ width: 38, height: 38, background: C.likeSoft, color: C.like }}><Trash2 size={16} /></button>
          </div>
        )); })()}</div>}
        {cseg === "reels" && <div className="space-y-2">{(() => { const items = (reels || []).filter(r => !ql || (r.caption || "").toLowerCase().includes(ql)); return items.length === 0 ? <Empty icon={Film} t="ცარიელია" s="" /> : items.map(r => (
          <div key={r.id} className="p-3 flex items-center gap-3" style={card()}>
            {bulkMode && <button onClick={() => toggleSelected(r.id)} className="rounded-full flex items-center justify-center shrink-0" style={{ width: 22, height: 22, border: `2px solid ${selected.has(r.id) ? C.accent : C.line}`, background: selected.has(r.id) ? C.accent : "transparent" }}>{selected.has(r.id) && <Check size={14} color="#fff" />}</button>}
            <Pic src={r.image} grad={GRADS[hashIdx(r.id, GRADS.length)]} round={10} style={{ width: 46, height: 46 }} />
            <div className="flex-1 min-w-0"><div className="text-[13px] line-clamp-1" style={{ color: C.ink }}>{r.caption || "(უსათაურო)"}</div><Mono style={{ fontSize: 11, color: C.faint }} className="truncate block">{USERS[r.authorId] ? USERS[r.authorId].name.split(" ")[0] : "—"} · ❤ {r.likes || 0}</Mono></div>
            <button onClick={() => { if (window.confirm("წავშალო ეს Reel?")) onDeleteReel(r.id); }} aria-label={t("action.delete")} className="rounded-full flex items-center justify-center active:scale-90 shrink-0" style={{ width: 38, height: 38, background: C.likeSoft, color: C.like }}><Trash2 size={16} /></button>
          </div>
        )); })()}</div>}
        {cseg === "groups" && <div className="space-y-2">{(() => { const items = (groups || []).filter(g => !ql || (g.name || "").toLowerCase().includes(ql)); return items.length === 0 ? <Empty icon={Users} t="ცარიელია" s="" /> : items.map(g => (
          <div key={g.id} className="p-3 flex items-center gap-3" style={card()}>
            {bulkMode && <button onClick={() => toggleSelected(g.id)} className="rounded-full flex items-center justify-center shrink-0" style={{ width: 22, height: 22, border: `2px solid ${selected.has(g.id) ? C.accent : C.line}`, background: selected.has(g.id) ? C.accent : "transparent" }}>{selected.has(g.id) && <Check size={14} color="#fff" />}</button>}
            <Pic src={g.cover} grad={GRADS[hashIdx(g.id, GRADS.length)]} round={10} style={{ width: 46, height: 46 }} />
            <div className="flex-1 min-w-0"><div className="font-bold text-[13px] truncate" style={{ color: C.ink }}>{g.name}</div><Mono style={{ fontSize: 11, color: C.faint }} className="truncate block">{g.members} წევრი · {g.cat || "—"}</Mono></div>
            <button onClick={() => { const v = window.prompt("ახალი სახელი:", g.name); if (v && v.trim() && v.trim() !== g.name) onEditGroup(g.id, { name: v.trim() }); }} className="rounded-full flex items-center justify-center active:scale-90 shrink-0" style={{ width: 38, height: 38, background: C.accentSoft, color: C.accentText }}><Pencil size={16} /></button>
            <button onClick={() => { if (window.confirm("წავშალო ეს ჯგუფი?")) onDeleteGroup(g.id); }} aria-label={t("action.delete")} className="rounded-full flex items-center justify-center active:scale-90 shrink-0" style={{ width: 38, height: 38, background: C.likeSoft, color: C.like }}><Trash2 size={16} /></button>
          </div>
        )); })()}</div>}
        {cseg === "events" && <div className="space-y-2">{(() => { const items = (events || []).filter(e => !ql || (e.title || "").toLowerCase().includes(ql)); return items.length === 0 ? <Empty icon={MapPin} t="ცარიელია" s="" /> : items.map(e => (
          <div key={e.id} className="p-3 flex items-center gap-3" style={card()}>
            {bulkMode && <button onClick={() => toggleSelected(e.id)} className="rounded-full flex items-center justify-center shrink-0" style={{ width: 22, height: 22, border: `2px solid ${selected.has(e.id) ? C.accent : C.line}`, background: selected.has(e.id) ? C.accent : "transparent" }}>{selected.has(e.id) && <Check size={14} color="#fff" />}</button>}
            <Pic src={e.cover} grad={GRADS[hashIdx(e.id, GRADS.length)]} round={10} style={{ width: 46, height: 46 }} />
            <div className="flex-1 min-w-0"><div className="font-bold text-[13px] truncate" style={{ color: C.ink }}>{e.title}</div><Mono style={{ fontSize: 11, color: C.faint }} className="truncate block">{e.going} მონაწილე · {e.location || "—"}</Mono></div>
            <button onClick={() => { const v = window.prompt("ახალი სახელი:", e.title); if (v && v.trim() && v.trim() !== e.title) onEditEvent(e.id, { title: v.trim() }); }} className="rounded-full flex items-center justify-center active:scale-90 shrink-0" style={{ width: 38, height: 38, background: C.accentSoft, color: C.accentText }}><Pencil size={16} /></button>
            <button onClick={() => { if (window.confirm("წავშალო ეს ივენთი?")) onDeleteEvent(e.id); }} aria-label={t("action.delete")} className="rounded-full flex items-center justify-center active:scale-90 shrink-0" style={{ width: 38, height: 38, background: C.likeSoft, color: C.like }}><Trash2 size={16} /></button>
          </div>
        )); })()}</div>}
        {cseg === "films" && <div className="space-y-2">{(() => { const items = (films || []).filter(f => !ql || (f.title || "").toLowerCase().includes(ql)); return items.length === 0 ? <Empty icon={Clapperboard} t="ცარიელია" s="" /> : items.map(f => (
          <div key={f.id} className="p-3 flex items-center gap-3" style={card()}>
            {bulkMode && <button onClick={() => toggleSelected(f.id)} className="rounded-full flex items-center justify-center shrink-0" style={{ width: 22, height: 22, border: `2px solid ${selected.has(f.id) ? C.accent : C.line}`, background: selected.has(f.id) ? C.accent : "transparent" }}>{selected.has(f.id) && <Check size={14} color="#fff" />}</button>}
            <Pic src={f.poster} grad={GRADS[hashIdx(f.id, GRADS.length)]} round={10} style={{ width: 46, height: 46 }} />
            <div className="flex-1 min-w-0"><div className="font-bold text-[13px] truncate" style={{ color: C.ink }}>{f.title}</div><Mono style={{ fontSize: 11, color: C.faint }} className="truncate block">{[f.year, f.genre].filter(Boolean).join(" · ")}</Mono></div>
            <button onClick={() => { const v = window.prompt("ახალი სახელი:", f.title); if (v && v.trim() && v.trim() !== f.title) onEditFilm(f.id, { title: v.trim() }); }} className="rounded-full flex items-center justify-center active:scale-90 shrink-0" style={{ width: 38, height: 38, background: C.accentSoft, color: C.accentText }}><Pencil size={16} /></button>
            <button onClick={() => { if (window.confirm("წავშალო ეს ფილმი?")) onDeleteFilm(f.id); }} aria-label={t("action.delete")} className="rounded-full flex items-center justify-center active:scale-90 shrink-0" style={{ width: 38, height: 38, background: C.likeSoft, color: C.like }}><Trash2 size={16} /></button>
          </div>
        )); })()}</div>}
        {cseg === "songs" && <div className="space-y-2">{(() => { const items = (songs || []).filter(s => !ql || (s.title || "").toLowerCase().includes(ql)); return items.length === 0 ? <Empty icon={Music} t="ცარიელია" s="" /> : items.map(s => (
          <div key={s.id} className="p-3 flex items-center gap-3" style={card()}>
            {bulkMode && <button onClick={() => toggleSelected(s.id)} className="rounded-full flex items-center justify-center shrink-0" style={{ width: 22, height: 22, border: `2px solid ${selected.has(s.id) ? C.accent : C.line}`, background: selected.has(s.id) ? C.accent : "transparent" }}>{selected.has(s.id) && <Check size={14} color="#fff" />}</button>}
            <Pic src={s.cover} grad={GRADS[hashIdx(s.id, GRADS.length)]} round={10} style={{ width: 46, height: 46 }} />
            <div className="flex-1 min-w-0"><div className="font-bold text-[13px] truncate" style={{ color: C.ink }}>{s.title}</div><Mono style={{ fontSize: 11, color: C.faint }} className="truncate block">{s.artist || "უცნობი"} · {s.plays || 0} მოსმენა</Mono></div>
            <button onClick={() => { const v = window.prompt("ახალი სახელი:", s.title); if (v && v.trim() && v.trim() !== s.title) onEditSong(s.id, { title: v.trim() }); }} className="rounded-full flex items-center justify-center active:scale-90 shrink-0" style={{ width: 38, height: 38, background: C.accentSoft, color: C.accentText }}><Pencil size={16} /></button>
            <button onClick={() => { if (window.confirm("წავშალო ეს სიმღერა?")) onDeleteSong(s.id); }} aria-label={t("action.delete")} className="rounded-full flex items-center justify-center active:scale-90 shrink-0" style={{ width: 38, height: 38, background: C.likeSoft, color: C.like }}><Trash2 size={16} /></button>
          </div>
        )); })()}</div>}
        {cseg === "stories" && <div className="space-y-2">{(() => { const items = (stories || []).filter(s => !ql || (s.text || "").toLowerCase().includes(ql)); return items.length === 0 ? <Empty icon={Camera} t="ცარიელია" s="" /> : items.map(s => (
          <div key={s.id} className="p-3 flex items-center gap-3" style={card()}>
            {bulkMode && <button onClick={() => toggleSelected(s.id)} className="rounded-full flex items-center justify-center shrink-0" style={{ width: 22, height: 22, border: `2px solid ${selected.has(s.id) ? C.accent : C.line}`, background: selected.has(s.id) ? C.accent : "transparent" }}>{selected.has(s.id) && <Check size={14} color="#fff" />}</button>}
            {s.image ? <Pic src={s.image} grad={GRADS[hashIdx(s.id, GRADS.length)]} round={10} style={{ width: 46, height: 46 }} /> : <div className="rounded-xl flex items-center justify-center shrink-0" style={{ width: 46, height: 46, background: C.surfaceMuted }}><Camera size={18} style={{ color: C.faint }} /></div>}
            <div className="flex-1 min-w-0">
              <div className="text-[13px] line-clamp-1" style={{ color: C.ink }}>{s.text || "(ფოტო story)"}</div>
              <Mono style={{ fontSize: 11, color: C.faint }} className="truncate block">{USERS[s.authorId] ? USERS[s.authorId].name.split(" ")[0] : "—"}{s.isBroadcast ? " · 🌍 broadcast" : s.closeFriends ? " · ★ ახლო მეგობრები" : ""}</Mono>
            </div>
            <button onClick={() => { if (window.confirm("წავშალო ეს story?")) onDeleteStory(s.id); }} aria-label={t("action.delete")} className="rounded-full flex items-center justify-center active:scale-90 shrink-0" style={{ width: 38, height: 38, background: C.likeSoft, color: C.like }}><Trash2 size={16} /></button>
          </div>
        )); })()}</div>}
        {bulkMode && selected.size > 0 && <div className="fixed bottom-0 inset-x-0 z-30 md:static px-4 py-3 flex items-center gap-3" style={{ background: C.surface, borderTop: `1px solid ${C.line}`, paddingBottom: "calc(var(--mz-nav, 64px) + 0.6rem)" }}>
          <span className="text-[13px] font-bold flex-1" style={{ color: C.ink }}>მონიშნულია {selected.size}</span>
          <button onClick={() => setSelected(new Set())} className="px-3.5 py-2 rounded-xl text-[13px] font-bold" style={{ background: C.surfaceMuted, color: C.ink2 }}>გაუქმება</button>
          <button onClick={onBulkDelete} className="px-3.5 py-2 rounded-xl text-[13px] font-bold text-white flex items-center gap-1.5" style={{ background: C.like }}><Trash2 size={14} /> წაშლა</button>
        </div>}
      </div>}
      {delUser && <DeleteUserDialog user={delUser} onCancel={() => setDelUser(null)} onConfirm={() => { onDeleteUser(delUser.id); setDelUser(null); }} />}
    </div>
  );
}

function DeleteUserDialog({ user, onCancel, onConfirm }) {
  const ref = useModalA11y(onCancel);
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,.6)" }} onClick={onCancel}>
      <div ref={ref} tabIndex={-1} role="alertdialog" aria-modal="true" aria-label={`${user.name}-ის წაშლა?`} className="w-full max-w-xs rounded-3xl p-5 text-center" style={{ background: C.paper, animation: "pop .2s ease both", outline: "none" }} onClick={e => e.stopPropagation()}>
        <div className="rounded-full mx-auto flex items-center justify-center mb-3" style={{ width: 52, height: 52, background: C.likeSoft }}><Trash2 size={24} style={{ color: C.like }} /></div>
        <div className="font-bold text-[16px]" style={{ color: C.ink }}>{user.name}-ის წაშლა?</div>
        <div className="text-[13px] mt-1 mb-4" style={{ color: C.muted, lineHeight: 1.5 }}>სამუდამოა — ყველა პოსტი, reel, მესიჯი წაიშლება. @{user.username}</div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-[14px] font-bold" style={{ background: C.surfaceMuted, color: C.ink }}>გაუქმება</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl text-[14px] font-bold text-white" style={{ background: C.like }}>წაშლა</button>
        </div>
      </div>
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
      <div className="px-4 pt-5 pb-3 flex items-center gap-2"><Title>{t("online.title")}</Title><span className="rounded-full px-2 py-0.5 text-white" style={{ background: C.online, fontFamily: MONO, fontSize: 12, fontWeight: 700 }}>{base.length}</span></div>
      <div className="px-4 mb-3"><div className="flex items-center gap-2 px-3 py-2.5 rounded-full" style={{ background: C.surfaceMuted }}><Search size={16} style={{ color: C.faint }} /><input value={q} onChange={e => setQ(e.target.value)} placeholder={t("online.searchPh")} className="flex-1 bg-transparent text-[14px] outline-none" style={{ color: C.ink }} /></div></div>
      <div className="px-4 mb-2 flex gap-2">
        <button onClick={() => setOnlyF(false)} className="px-3.5 py-1.5 rounded-full text-sm font-semibold transition" style={!onlyF ? { background: C.accentSoft, color: C.accentText } : { background: C.surfaceMuted, color: C.muted }}>{t("word.all")}</button>
        <button onClick={() => setOnlyF(true)} className="px-3.5 py-1.5 rounded-full text-sm font-semibold transition" style={onlyF ? { background: C.accentSoft, color: C.accentText } : { background: C.surfaceMuted, color: C.muted }}>{t("follow.followers")}</button>
      </div>
      {ids.length === 0 ? <div className="text-center py-16 text-[14px] px-8" style={{ color: C.faint }}><div className="rounded-3xl flex items-center justify-center mb-4 mx-auto" style={{ width: 72, height: 72, background: C.accentSoft }}><Users size={32} style={{ color: C.accent }} /></div>{ql || onlyF ? t("online.notFound") : t("online.noOneElse")}</div>
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
    { id: "post", label: t("quest.publishPost"), done: Math.min(1, postsToday), total: 1, xp: 20, icon: ImageIcon },
    { id: "likes5", label: t("quest.get5Likes"), done: Math.min(5, likesToday), total: 5, xp: 30, icon: Heart },
    { id: "follower", label: t("quest.getFollower"), done: Math.min(1, followersToday), total: 1, xp: 25, icon: UserPlus },
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

export function SettingsView({ settings, setSettings, meProfile, setMeProfile, mode, setMode, onClose, flash, onSignOut, onUploadAvatar, pushState, onTogglePush, blockedIds, mutedIds, onUnblock, onUnmute, onOpenProfile, following, closeFriends, onToggleCloseFriend, onExportData, onDeleteAccount, birthday, onSetBirthday, showProfileVisits, onToggleShowProfileVisits, isPrivate, onToggleIsPrivate, referralCode, invitedCount, invitedUsers, inviteLink, onCopyInviteLink, locSharing, locBusy, locLastSharedAt, onStartLocationShare, onStopLocationShare }) {
  const set = (k, v) => setSettings(s => ({ ...s, [k]: v }));
  const [delMode, setDelMode] = useState(false); const [delTxt, setDelTxt] = useState("");
  const [avatarProgress, setAvatarProgress] = useState(null);
  const pickAvatar = async (e) => { const f = e.target.files && e.target.files[0]; if (!f || !onUploadAvatar) return; setAvatarProgress(0); try { await onUploadAvatar(f, setAvatarProgress); } catch (err) { flash && flash(t("onb.avatarUploadFailedPre") + (err && err.message ? err.message : t("error.unknown"))); } setAvatarProgress(null); e.target.value = ""; };
  const tog = (k) => setSettings(s => ({ ...s, [k]: !s[k] }));
  return (
    <div className="fixed inset-0 z-[59] flex justify-center" style={{ background: C.paper }}>
      <div className="w-full max-w-[600px] flex flex-col" style={{ height: "100dvh", borderLeft: `1px solid ${C.line}`, borderRight: `1px solid ${C.line}` }}>
        <div className="flex items-center gap-3 px-3 py-3 shrink-0" style={{ background: C.surface, borderBottom: `1px solid ${C.line}`, paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}><button onClick={onClose} className="active:scale-90" style={{ color: C.ink2 }}><ArrowLeft size={22} /></button><span className="font-bold text-[16px]" style={{ color: C.ink, fontFamily: DISPLAY }}>{t("settings.title")}</span></div>
        <div className="flex-1 overflow-y-auto pb-10">
          <div className="flex items-center gap-3 px-4 pt-5"><label style={{ position: "relative", cursor: "pointer", flexShrink: 0 }}><input type="file" accept="image/*" style={{ display: "none" }} disabled={avatarProgress != null} onChange={pickAvatar} /><div style={{ position: "relative", width: 60, height: 60 }}><Avatar id={ME} size={60} /><UploadRing pct={avatarProgress} size={60} strokeWidth={2.5} /></div><div style={{ position: "absolute", right: -2, bottom: -2, width: 23, height: 23, borderRadius: "50%", backgroundImage: GBRAND, display: "flex", alignItems: "center", justifyContent: "center", border: `2.5px solid ${C.surface}` }}>{avatarProgress != null ? <Mono style={{ fontSize: 8, color: "#fff", fontWeight: 700 }}>{avatarProgress}%</Mono> : <Camera size={12} color="#fff" />}</div></label><div><div className="font-bold text-[16px]" style={{ color: C.ink, fontFamily: DISPLAY }}>{meProfile.name}</div><Mono style={{ fontSize: 12, color: C.faint }}>@{USERS[ME].handle}</Mono><div className="text-[12px] mt-0.5" style={{ color: C.accent }}>ფოტოს შესაცვლელად დააჭირე</div></div></div>
          <SettingsSection title="პროფილის რედაქტირება">
            <div className="px-4 py-3"><div className="text-[12px] mb-1" style={{ color: C.faint }}>სახელი</div><input value={meProfile.name} onChange={e => setMeProfile(p => ({ ...p, name: e.target.value }))} className="w-full bg-transparent outline-none text-[15px]" style={{ color: C.ink }} /></div>
            <div className="px-4 py-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}><div className="text-[12px] mb-1" style={{ color: C.faint }}>ბიო</div><textarea value={meProfile.bio} onChange={e => setMeProfile(p => ({ ...p, bio: e.target.value }))} rows={2} className="w-full bg-transparent outline-none text-[15px] resize-none" style={{ color: C.ink, lineHeight: 1.5 }} /></div>
          </SettingsSection>
          {referralCode && <SettingsSection title="მოწვევა მეგობრების 🎁">
            <div className="px-4 py-3">
              <div className="text-[13px] mb-2.5" style={{ color: C.muted }}>მოიწვიე მეგობარი — შენც და ისიც XP-ს მიიღებთ ბონუსად</div>
              <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl" style={{ background: C.surfaceMuted, border: `1px solid ${C.line}` }}>
                <Mono className="flex-1 truncate text-[13px]" style={{ color: C.ink }}>{inviteLink}</Mono>
                <button onClick={onCopyInviteLink} className="px-3 py-1.5 rounded-lg text-[12px] font-bold shrink-0 active:scale-95" style={{ backgroundImage: GBRAND, color: "#fff" }}><Copy size={13} className="inline mr-1" />კოპირება</button>
              </div>
              <div className="flex items-center gap-1.5 mt-2.5"><UserPlus size={14} style={{ color: C.accent }} /><span className="text-[13px] font-bold" style={{ color: C.ink }}>{invitedCount || 0} მოწვეული მეგობარი</span></div>
              {invitedUsers && invitedUsers.length > 0 && <div className="flex -space-x-2 mt-2">{invitedUsers.slice(0, 8).map(id => <div key={id} style={{ border: `2px solid ${C.surface}`, borderRadius: "50%" }}><Avatar id={id} size={30} /></div>)}</div>}
            </div>
          </SettingsSection>}
          <SettingsSection title={t("settings.appearance")}>
            <div className="px-4 py-3"><ThemeToggle mode={mode} setMode={setMode} full /></div>
            <div className="px-4 py-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}><div className="text-[13px] mb-2" style={{ color: C.muted }}>{t("settings.language")}</div><div className="flex gap-1 p-1 rounded-2xl" style={{ background: C.surfaceMuted }}>{LANGS.map(([k, l]) => <button key={k} onClick={() => set("lang", k)} className="flex-1 py-2 rounded-xl text-sm font-bold transition" style={settings.lang === k ? { background: C.surface, color: C.accent, boxShadow: SH.card } : { color: C.muted }}>{l}</button>)}</div></div>
          </SettingsSection>
          <SettingsSection title="კონფიდენციალურობა">
            <SettingsRow first label="დახურული ანგარიში" sub="მხოლოდ ორმხრივი მიმდევრები ხედავენ შენს პოსტებს, Reels-სა და ფოტოებს" on={!!isPrivate} onToggle={() => onToggleIsPrivate && onToggleIsPrivate(!isPrivate)} />
            <SettingsRow label="აქტივობის სტატუსი" sub="აჩვენე როდის ხარ ონლაინ" on={settings.activity} onToggle={() => tog("activity")} />
            <SettingsRow label={t("settings.showProfileVisits")} sub={t("settings.showProfileVisitsSub")} on={showProfileVisits} onToggle={() => onToggleShowProfileVisits && onToggleShowProfileVisits(!showProfileVisits)} />
          </SettingsSection>
          <SettingsSection title={t("map.settingsTitle")}>
            <div className="px-4 py-3.5 flex items-center gap-3">
              <div className="rounded-xl flex items-center justify-center shrink-0" style={{ width: 38, height: 38, background: locSharing ? C.accentSoft : C.surfaceMuted }}><Navigation size={19} style={{ color: locSharing ? C.accent : C.muted }} /></div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-bold" style={{ color: C.ink }}>{locSharing ? t("map.settingsOn") : t("map.settingsOff")}</div>
                {locSharing && locLastSharedAt && <div className="text-[12px]" style={{ color: C.faint }}>{t("map.lastUpdatedPre")}{timeAgo(locLastSharedAt)}</div>}
              </div>
              <button onClick={() => (locSharing ? onStopLocationShare && onStopLocationShare() : onStartLocationShare && onStartLocationShare())} disabled={locBusy} className="px-3.5 py-2 rounded-xl text-[13px] font-bold shrink-0 active:scale-95" style={locSharing ? { background: C.surfaceMuted, color: C.ink2 } : { backgroundImage: GBRAND, color: "#fff" }}>{locSharing ? "გამორთვა" : "ჩართვა"}</button>
            </div>
          </SettingsSection>
          <SettingsSection title="შეტყობინებები">
            <div className="px-4 py-3.5 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
              <div className="rounded-xl flex items-center justify-center shrink-0" style={{ width: 38, height: 38, background: pushState === "on" ? C.accentSoft : C.surfaceMuted }}><Bell size={19} style={{ color: pushState === "on" ? C.accent : C.muted }} /></div>
              <div className="flex-1 min-w-0"><div className="text-[14px] font-bold" style={{ color: C.ink }}>Push შეტყობინებები</div><div className="text-[12px]" style={{ color: C.faint }}>{pushState === "on" ? "ჩართულია — დახურულ აპშიც მიიღებ" : pushState === "denied" ? "ბრაუზერმა დაბლოკა — ჩართე ბრაუზერის პარამეტრებში" : pushState === "unsupported" ? "ამ ბრაუზერს არ აქვს მხარდაჭერა" : "მიიღე შეტყობინება აპის დახურვის შემდეგაც"}</div></div>
              {pushState === "unsupported" || pushState === "denied" ? <span className="text-[11px] font-bold shrink-0" style={{ color: C.faint }}>—</span> : <button onClick={onTogglePush} className="px-3.5 py-2 rounded-xl text-[13px] font-bold shrink-0 active:scale-95" style={pushState === "on" ? { background: C.surfaceMuted, color: C.ink2 } : { backgroundImage: GBRAND, color: "#fff" }}>{pushState === "on" ? "გამორთვა" : "ჩართვა"}</button>}
            </div>
            <SettingsRow label="მოწონებები" on={settings.nLikes !== false} onToggle={() => tog("nLikes")} />
            <SettingsRow label="კომენტარები" on={settings.nComments !== false} onToggle={() => tog("nComments")} />
            <SettingsRow label="ახალი მიმდევრები" on={settings.nFollows !== false} onToggle={() => tog("nFollows")} />
            <SettingsRow label="მოხსენიებები" sub="როცა ვინმე @handle-ით მოგიხსენიებს" on={settings.nMentions !== false} onToggle={() => tog("nMentions")} />
            <SettingsRow label="პროფილის ვიზიტები" sub="ვინც პირველად ნახავს შენს პროფილს" on={settings.nProfileViews !== false} onToggle={() => tog("nProfileViews")} />
            <SettingsRow label="პირადი შეტყობინებები" on={settings.nMessages !== false} onToggle={() => tog("nMessages")} />
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
                  <button className="flex-1 min-w-0 text-left active:opacity-60" style={{ background: "none", border: "none", padding: 0, font: "inherit" }} onClick={() => { onClose(); onOpenProfile && onOpenProfile(id); }}><div className="text-[14px] font-bold truncate" style={{ color: C.ink }}>{cu.name}</div><div className="text-[12px]" style={{ color: C.faint }}>@{cu.handle}</div></button>
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
                    <button className="flex-1 min-w-0 text-left active:opacity-60" style={{ background: "none", border: "none", padding: 0, font: "inherit" }} onClick={() => { onClose(); onOpenProfile && onOpenProfile(id); }}><div className="text-[14px] font-bold truncate" style={{ color: C.ink }}>{bu.name}</div><div className="text-[12px]" style={{ color: "#e05656" }}>🚫 დაბლოკილი</div></button>
                    <button onClick={() => onUnblock(id)} className="px-3.5 py-2 rounded-xl text-[13px] font-bold shrink-0 active:scale-95" style={{ background: C.surfaceMuted, color: C.ink }}>განბლოკვა</button>
                  </div>); })}
                {(mutedIds || []).map(id => { const mt = USERS[id]; return (
                  <div key={"m" + id} className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                    <Avatar id={id} size={38} />
                    <button className="flex-1 min-w-0 text-left active:opacity-60" style={{ background: "none", border: "none", padding: 0, font: "inherit" }} onClick={() => { onClose(); onOpenProfile && onOpenProfile(id); }}><div className="text-[14px] font-bold truncate" style={{ color: C.ink }}>{mt.name}</div><div className="text-[12px]" style={{ color: C.muted }}>🔇 გაჩუმებული</div></button>
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

        <div className="flex items-center gap-2 mt-7 mb-3"><TrendingUp size={18} style={{ color: C.accent }} /><h2 className="text-[17px]" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700 }}>{t("leaderboard.yourStats")}</h2></div>
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          {[[t("leaderboard.yourRank"), "#" + myRank, Trophy, C.star], [t("word.post"), mine.length, ImageIcon, C.accent], [t("reels.likes"), totalLikes, Heart, C.like], [t("word.comment"), totalComments, MessageCircle, C.cyan]].map(([l, v, I, col]) => <div key={l} className="p-4" style={card()}><div className="rounded-xl flex items-center justify-center mb-2.5" style={{ width: 36, height: 36, background: col + "22" }}><I size={18} color={col} /></div><Mono className="text-2xl font-bold" style={{ color: C.ink }}>{v}</Mono><div className="text-[12px]" style={{ color: C.muted }}>{l}</div></div>)}
        </div>
        {mine.length > 0 ? (
          <div className="p-4" style={card()}>
            <div className="text-[14px] font-bold mb-3" style={{ color: C.ink }}>{t("leaderboard.likesOnPosts")}</div>
            <div className="flex items-end gap-2" style={{ height: 110 }}>{mine.slice(0, 8).map(p => <div key={p.id} className="flex-1 flex flex-col items-center justify-end gap-1.5"><Mono style={{ fontSize: 10, color: C.faint }}>{p.likes}</Mono><div className="w-full rounded-t-md" style={{ height: Math.max(4, p.likes / maxLikes * 86), backgroundImage: GBRAND }} /></div>)}</div>
          </div>
        ) : <div className="p-5 text-center" style={card()}><div className="text-[14px]" style={{ color: C.muted }}>გამოაქვეყნე პოსტი, რომ აქ ნახო შენი სტატისტიკა 📊</div></div>}
      </div>
    </div>
  );
}

/* ─────────────────────────  SEARCH  ───────────────────────── */

const EMPTY_SEARCH = { people: [], posts: [], films: [], songs: [], listings: [], groups: [], threads: [] };
export function SearchView({ posts, onOpenProfile, onTag, onClose, runSearch, onOpenFilm, onOpenSong, onOpenListing, onOpenGroup, onOpenThread }) {
  const [q, setQ] = useState(""); const ql = q.trim().toLowerCase();
  const [results, setResults] = useState(EMPTY_SEARCH);
  const [searching, setSearching] = useState(false);
  const doSearch = async (term, activeRef) => {
    try { const r = runSearch ? await runSearch(term) : EMPTY_SEARCH; if (!activeRef || activeRef.current) setResults(r || EMPTY_SEARCH); }
    catch (e) { if (!activeRef || activeRef.current) setResults({ ...EMPTY_SEARCH, failedCount: 1 }); }
    finally { if (!activeRef || activeRef.current) setSearching(false); }
  };
  useEffect(() => {
    const term = q.trim();
    if (!term) { setResults(EMPTY_SEARCH); setSearching(false); return; }
    setSearching(true);
    const activeRef = { current: true };
    const h = setTimeout(() => doSearch(term, activeRef), 320);
    return () => { activeRef.current = false; clearTimeout(h); };
  }, [q]);
  const retrySearch = () => { const term = q.trim(); if (!term) return; setSearching(true); doSearch(term); };
  const people = results.people || [];
  const foundPosts = results.posts || [];
  const foundFilms = results.films || [];
  const foundSongs = results.songs || [];
  const foundListings = results.listings || [];
  const foundGroups = results.groups || [];
  const foundThreads = results.threads || [];
  const anyResults = people.length || foundPosts.length || foundFilms.length || foundSongs.length || foundListings.length || foundGroups.length || foundThreads.length;
  const searchFailed = ql && !searching && !anyResults && (results.failedCount || 0) > 0;
  const noResults = ql && !searching && !anyResults && !searchFailed;
  const tags = ql ? computeTrends(posts).filter(t => t.tag.toLowerCase().includes(ql)) : computeTrends(posts);
  const suggested = Object.values(USERS).filter(u => u.id !== ME).slice(0, 4);
  const goTag = (t) => { onTag(t); onClose(); };
  const goUser = (id) => { onOpenProfile(id); onClose(); };
  return (
    <div className="fixed inset-0 z-[59] flex justify-center" style={{ background: C.paper }}>
      <div className="w-full max-w-[600px] flex flex-col" style={{ height: "100dvh", borderLeft: `1px solid ${C.line}`, borderRight: `1px solid ${C.line}` }}>
        <div className="flex items-center gap-2 px-3 py-2.5 shrink-0" style={{ background: C.surface, borderBottom: `1px solid ${C.line}` }}>
          <button onClick={onClose} className="active:scale-90" style={{ color: C.ink2 }}><ArrowLeft size={22} /></button>
          <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-full" style={{ background: C.surfaceMuted, border: `1px solid ${C.line}` }}><Search size={18} style={{ color: C.faint }} /><input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder={t("search.placeholder")} className="flex-1 bg-transparent text-[15px] outline-none" style={{ color: C.ink }} />{q && <button onClick={() => setQ("")} aria-label={t("a11y.close")} style={{ color: C.faint }}><X size={18} /></button>}</div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {searching && <div className="flex justify-center items-center py-8"><div style={{ width: 26, height: 26, border: `3px solid ${C.lineSoft}`, borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /></div>}
          {!ql && <div className="p-4"><div className="flex items-center gap-2 mb-3"><Star size={16} style={{ color: C.accent }} /><span className="text-[14px] font-bold" style={{ color: C.ink }}>{t("search.suggested")}</span></div><div className="space-y-1">{suggested.map(u => <button key={u.id} onClick={() => goUser(u.id)} className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:opacity-80"><Avatar id={u.id} size={44} /><div className="flex-1 text-left min-w-0"><Name id={u.id} className="text-[15px]" /><Mono className="block truncate" style={{ fontSize: 12, color: C.faint }}>@{u.handle}</Mono></div></button>)}</div></div>}
          {ql && people.length > 0 && <div className="pt-2"><div className="px-4 py-1.5 text-[12px] font-bold uppercase" style={{ color: C.faint, fontFamily: MONO }}>{t("search.peopleHeader")}</div>{people.map(u => <button key={u.id} onClick={() => goUser(u.id)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:opacity-80"><div className="relative"><Avatar id={u.id} size={44} />{u.online && <span className="absolute bottom-0 right-0"><Dot size={11} /></span>}</div><div className="flex-1 text-left min-w-0"><Name id={u.id} className="text-[15px]" /><Mono className="block truncate" style={{ fontSize: 12, color: C.faint }}>@{u.handle}</Mono></div></button>)}</div>}
          {(ql || tags.length > 0) && <div className="pt-2"><div className="px-4 py-1.5 text-[12px] font-bold uppercase" style={{ color: C.faint, fontFamily: MONO }}>{t("search.hashtagsHeader")}</div>{ql && <button onClick={() => goTag(ql)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:opacity-80"><div className="rounded-xl flex items-center justify-center" style={{ width: 44, height: 44, background: C.accentSoft }}><Hash size={20} style={{ color: C.accent }} /></div><div className="flex-1 text-left"><div className="font-bold text-[15px]" style={{ color: C.ink }}>#{ql}</div><Mono style={{ fontSize: 12, color: C.faint }}>{t("search.seeAllPosts")}</Mono></div></button>}{tags.filter(tg => tg.tag.toLowerCase() !== ql).map(tg => <button key={tg.tag} onClick={() => goTag(tg.tag)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:opacity-80"><div className="rounded-xl flex items-center justify-center" style={{ width: 44, height: 44, background: C.accentSoft }}><Hash size={20} style={{ color: C.accent }} /></div><div className="flex-1 text-left"><div className="font-bold text-[15px]" style={{ color: C.ink }}>#{tg.tag}</div><Mono style={{ fontSize: 12, color: C.faint }}>{tg.posts} {t("word.post")}</Mono></div></button>)}</div>}
          {ql && foundPosts.length > 0 && <div className="pt-2"><div className="px-4 py-1.5 text-[12px] font-bold uppercase" style={{ color: C.faint, fontFamily: MONO }}>{t("search.postsHeader")}</div><div className="px-3 space-y-2">{foundPosts.map(p => <button key={p.id} onClick={() => goUser(p.authorId)} className="w-full p-3 flex gap-3 text-left" style={card()}><Avatar id={p.authorId} size={36} /><div className="min-w-0 flex-1"><Name id={p.authorId} className="text-[13px]" /><div className="text-[13px] line-clamp-2" style={{ color: C.ink2 }}>{p.text}</div></div>{p.image && <Pic src={p.image} round={10} style={{ width: 48, height: 48 }} className="shrink-0" />}</button>)}</div></div>}
          {ql && foundFilms.length > 0 && <div className="pt-2"><div className="px-4 py-1.5 text-[12px] font-bold uppercase" style={{ color: C.faint, fontFamily: MONO }}>{t("nav.movies")}</div><div className="px-3 space-y-2">{foundFilms.map(f => <button key={f.id} onClick={() => { onOpenFilm && onOpenFilm(f); }} className="w-full p-3 flex items-center gap-3 text-left" style={card()}><Pic src={f.poster} grad={GRADS[hashIdx(f.id, GRADS.length)]} round={10} style={{ width: 46, height: 46 }} className="shrink-0" /><div className="min-w-0 flex-1"><div className="font-bold text-[14px] truncate" style={{ color: C.ink }}>{f.title}</div><Mono style={{ fontSize: 12, color: C.faint }}>{[f.year, f.genre].filter(Boolean).join(" · ")}</Mono></div><Clapperboard size={18} style={{ color: C.faint }} /></button>)}</div></div>}
          {ql && foundSongs.length > 0 && <div className="pt-2"><div className="px-4 py-1.5 text-[12px] font-bold uppercase" style={{ color: C.faint, fontFamily: MONO }}>{t("nav.music")}</div><div className="px-3 space-y-2">{foundSongs.map(s => <button key={s.id} onClick={() => { onOpenSong && onOpenSong(s); }} className="w-full p-3 flex items-center gap-3 text-left" style={card()}><Pic src={s.cover} grad={GRADS[hashIdx(s.id, GRADS.length)]} round={10} style={{ width: 46, height: 46 }} className="shrink-0" /><div className="min-w-0 flex-1"><div className="font-bold text-[14px] truncate" style={{ color: C.ink }}>{s.title}</div><Mono style={{ fontSize: 12, color: C.faint }} className="truncate block">{s.artist || t("music.unknownArtist")}</Mono></div><Play size={18} style={{ color: C.faint }} /></button>)}</div></div>}
          {ql && foundListings.length > 0 && <div className="pt-2"><div className="px-4 py-1.5 text-[12px] font-bold uppercase" style={{ color: C.faint, fontFamily: MONO }}>{t("search.listingsHeader")}</div><div className="px-3 space-y-2">{foundListings.map(l => <button key={l.id} onClick={() => { onOpenListing && onOpenListing(l); }} className="w-full p-3 flex items-center gap-3 text-left" style={card()}><Pic src={l.image} grad={GRADS[hashIdx(l.id, GRADS.length)]} round={10} style={{ width: 46, height: 46 }} className="shrink-0" /><div className="min-w-0 flex-1"><div className="font-bold text-[14px] truncate" style={{ color: C.ink }}>{l.title}</div><div className="text-[12px]" style={{ color: C.accent, fontWeight: 700 }}>{(l.price || 0).toLocaleString()}₾</div></div><ShoppingBag size={18} style={{ color: C.faint }} /></button>)}</div></div>}
          {ql && foundGroups.length > 0 && <div className="pt-2"><div className="px-4 py-1.5 text-[12px] font-bold uppercase" style={{ color: C.faint, fontFamily: MONO }}>{t("word.groups")}</div><div className="px-3 space-y-2">{foundGroups.map(g => <button key={g.id} onClick={() => { onOpenGroup && onOpenGroup(g); }} className="w-full p-3 flex items-center gap-3 text-left" style={card()}><Pic src={g.cover} grad={GRADS[hashIdx(g.id, GRADS.length)]} round={10} style={{ width: 46, height: 46 }} className="shrink-0" /><div className="min-w-0 flex-1"><div className="font-bold text-[14px] truncate" style={{ color: C.ink }}>{g.name}</div><Mono style={{ fontSize: 12, color: C.faint }}>{g.members} {t("word.member")}</Mono></div><Users size={18} style={{ color: C.faint }} /></button>)}</div></div>}
          {ql && foundThreads.length > 0 && <div className="pt-2 pb-6"><div className="px-4 py-1.5 text-[12px] font-bold uppercase" style={{ color: C.faint, fontFamily: MONO }}>{t("word.thread")}</div><div className="px-3 space-y-2">{foundThreads.map(th => <button key={th.id} onClick={() => { onOpenThread && onOpenThread(th); }} className="w-full p-3 flex items-center gap-3 text-left" style={card()}><div className="rounded-xl flex items-center justify-center shrink-0" style={{ width: 46, height: 46, background: C.accentSoft }}><MessageSquare size={20} style={{ color: C.accent }} /></div><div className="min-w-0 flex-1"><div className="font-bold text-[14px] truncate" style={{ color: C.ink }}>{th.title}</div><Mono style={{ fontSize: 12, color: C.faint }}>{th.votes} · {th.replies.length} {t("word.reply")}</Mono></div></button>)}</div></div>}
          {searchFailed && <div className="px-4 pt-6 pb-2 text-center"><Mono style={{ fontSize: 13, color: C.like }}>{t("search.failed")}</Mono><button onClick={retrySearch} className="mt-2 px-4 py-1.5 rounded-full text-[13px] font-bold" style={{ background: C.surfaceMuted, color: C.ink2 }}>{t("action.retry")}</button></div>}
          {noResults && <div className="px-4 pt-6 pb-2 text-center"><Mono style={{ fontSize: 13, color: C.faint }}>არაფერი მოიძებნა — სცადე ჰეშთეგი ზემოთ</Mono></div>}
          {ql && <div className="pb-6" />}
        </div>
      </div>
    </div>
  );
}

