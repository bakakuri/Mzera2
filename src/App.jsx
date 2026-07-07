import {
  useState, useEffect, useRef, Home, Search, Compass, PlusSquare, Send, Bell, User, Shield, Heart, MessageCircle, MessageSquare, Bookmark, MoreHorizontal, X, ArrowLeft, Hash, TrendingUp, Check, Trash2, Flag, Camera, Settings, AlertTriangle, ImageIcon, MapPin, Map, Link2, ShieldCheck, Plus, Minus, Menu, LogOut, HelpCircle, ChevronRight, Zap, Sun, Moon, ShoppingBag, Tag, Star, Eye, Navigation, Users, Film, Mic, Play, Pause, Smile, FileText, Download, UserPlus, Trophy, Upload, Volume2, VolumeX, Pencil, CornerUpLeft, Copy, Reply, Gamepad2, Clapperboard, Music, Languages, MiniPlayer, HeaderTicker, authApi, profilesApi, postsApi, reactionsApi, commentsApi, followsApi, chatApi, notifsApi, storageApi, storiesApi, reelsApi, marketApi, filmsApi, musicApi, groupsApi, eventsApi, forumApi, highlightsApi, presenceApi, locationsApi, pollsApi, questsApi, xpApi, adminApi, pushApi, hasSupabase, PAL, DARK, C, GBRAND, SH, card, DISPLAY, BODY, MONO, Mono, GRADS, hashIdx, img, catColor, FALLBACK_USER, _users, USERS, ME, fmtN, computeTrends, REPLIES, MARKET_CATS, FORUM_CATS, Pic, Avatar, Dot, Name, Handle, IconBtn, Pill, Wordmark, Title, Chips, renderText, Empty, ThemeToggle, REACTIONS, StoryRow, MiniPost, NewThread, Stars, Checkout, NewListing, GroupAvatar, waveOf, dl, VoiceMsg, DocMsg, EMOJIS, EmojiPanel, PeoplePicker, convMembers, convIsGroup, msgPreview, FollowBtn, FollowList, ProfileViewers, timeAgo, mergeProfile, mapDbPost, msgClock, mapDbMsg, toDbMsg, mapDbNotif, resolveImg, hydrateAuthors, mapDbStories, mapDbReel, mapDbThread, mapDbListing, mapDbReview, mapDbFilm, mapDbSong, mapDbGroup, mapDbEvent, ConfigError, LoadingScreen, AuthScreen, HighlightCreate, HighlightView, ReelComments, pushNotif, ensureNotifPerm, levelInfo, kfmt, ReelCard, ReelCreate, GroupPost, MiniMap, Switch, SettingsSection, SettingsRow, STORY_STICKERS, setTheme, setME, compressImage, POST_BGS, t, setLang} from "./ui/core";
import { PostCard, StoryViewer, CreateSheet, Explore, StoryEditor, FeedPromoCard, FeedReelsRow } from "./ui/feed";
import { Drawer, PullMenu } from "./ui/social";
import { lazy, Suspense } from "react";

import { useToast } from "./hooks/useToast";
import { usePwaInstall } from "./hooks/usePwaInstall";
import { useLayoutFit } from "./hooks/useLayoutFit";
import { useXp } from "./hooks/useXp";
import { useFeed } from "./hooks/useFeed";
import { useAuthSession } from "./hooks/useAuthSession";
import { useSocialGraph } from "./hooks/useSocialGraph";
import { useStories } from "./hooks/useStories";
import { useReels } from "./hooks/useReels";
import { useChat } from "./hooks/useChat";
import { useMarket } from "./hooks/useMarket";
import { useMovies } from "./hooks/useMovies";
import { useMusic } from "./hooks/useMusic";
import { useGroups } from "./hooks/useGroups";
import { useForum } from "./hooks/useForum";
import { useAdmin } from "./hooks/useAdmin";
import { useNotifications } from "./hooks/useNotifications";
import { usePresence } from "./hooks/usePresence";
import { useGames } from "./hooks/useGames";
import { useReferrals } from "./hooks/useReferrals";
import { useLanguages } from "./hooks/useLanguages";
import { useLocationSharing } from "./hooks/useLocationSharing";
import { useAlbums } from "./hooks/useAlbums";

// Lazy-loaded tabs → split into separate chunks for a smaller/faster first load
const Messages = lazy(() => import("./ui/chat").then(m => ({ default: m.Messages })));
const Forum = lazy(() => import("./ui/discover").then(m => ({ default: m.Forum })));
const Market = lazy(() => import("./ui/discover").then(m => ({ default: m.Market })));
const MapView = lazy(() => import("./ui/discover").then(m => ({ default: m.MapView })));
const Reels = lazy(() => import("./ui/discover").then(m => ({ default: m.Reels })));
const Groups = lazy(() => import("./ui/discover").then(m => ({ default: m.Groups })));
const CallLayer = lazy(() => import("./ui/call").then(m => ({ default: m.CallLayer })));
const BuraGame = lazy(() => import("./ui/bura").then(m => ({ default: m.BuraGame })));
const GamesList = lazy(() => import("./ui/bura").then(m => ({ default: m.GamesList })));
const NardiGame = lazy(() => import("./ui/nardi").then(m => ({ default: m.NardiGame })));
const ChessGame = lazy(() => import("./ui/chess").then(m => ({ default: m.ChessGame })));
const Movies = lazy(() => import("./ui/movies").then(m => ({ default: m.Movies })));
const MusicPage = lazy(() => import("./ui/music").then(m => ({ default: m.MusicPage })));
const LanguagesPage = lazy(() => import("./ui/languages").then(m => ({ default: m.LanguagesPage })));
const Profile = lazy(() => import("./ui/socialViews").then(m => ({ default: m.Profile })));
const Notifications = lazy(() => import("./ui/socialViews").then(m => ({ default: m.Notifications })));
const Admin = lazy(() => import("./ui/socialViews").then(m => ({ default: m.Admin })));
const OnlinePage = lazy(() => import("./ui/socialViews").then(m => ({ default: m.OnlinePage })));
const Progress = lazy(() => import("./ui/socialViews").then(m => ({ default: m.Progress })));
const SettingsView = lazy(() => import("./ui/socialViews").then(m => ({ default: m.SettingsView })));
const Leaderboard = lazy(() => import("./ui/socialViews").then(m => ({ default: m.Leaderboard })));
const SearchView = lazy(() => import("./ui/socialViews").then(m => ({ default: m.SearchView })));
const SuggestedPeople = lazy(() => import("./ui/socialViews").then(m => ({ default: m.SuggestedPeople })));
const Onboarding = lazy(() => import("./ui/socialViews").then(m => ({ default: m.Onboarding })));

const Sk = ({ w, h, r = 8, mb = 0 }) => <div style={{ width: w, height: h, borderRadius: r, background: C.surfaceMuted, marginBottom: mb, animation: "pulse 1.4s ease-in-out infinite" }} />;
function PageSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {[0, 1, 2].map(i => (
        <div key={i} className="rounded-2xl p-4" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
          <div className="flex items-center gap-3 mb-3"><Sk w={42} h={42} r={999} /><div className="flex-1"><Sk w="42%" h={12} mb={7} /><Sk w="26%" h={10} /></div></div>
          <Sk w="92%" h={12} mb={7} /><Sk w="68%" h={12} mb={12} /><Sk w="100%" h={190} r={14} />
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState("light");
  setTheme(mode === "dark");

  const [tab, setTab] = useState("home");
  const { toast, flash, dbError, setDbError, dbErr } = useToast();
  const { installEvt, setInstallEvt, doInstall } = usePwaInstall();
  useLayoutFit(tab);

  // header ticker — shows incoming notifications/messages in the header's
  // MiniPlayer slot (yielding music aside for a few seconds), scrolling as a
  // marquee if the text is too long to fit.
  const [ticker, setTicker] = useState(null);
  const tickerTimeoutRef = useRef(null);
  const showTicker = (msg) => {
    if (!msg) return;
    setTicker(msg);
    clearTimeout(tickerTimeoutRef.current);
    tickerTimeoutRef.current = setTimeout(() => setTicker(null), 5000);
  };

  const xpHook = useXp({ tab, flash, dbErr });
  const { xp, gainXp, questData, onClaimQuest, setXp } = xpHook;

  const feed = useFeed({ tab, flash, dbErr, setDbError, gainXp });
  const auth = useAuthSession({ flash, reloadFeed: feed.reloadFeed });
  const { session, ready, setReady, recoveryMode, onResetPassword, onUpdatePassword, showOnboarding, setShowOnboarding, settings, setSettings, meProfile, setMeProfile, pushState, onTogglePush, onSaveOnboardProfile, onFinishOnboarding } = auth;
  setLang(settings.lang || "ka");
  const live = hasSupabase && !!session;

  const social = useSocialGraph({ flash, dbErr, gainXp, reloadFeed: feed.reloadFeed, setMeProfile, setSavedPosts: feed.setSavedPosts });
  const { following, followingRef, blockedIds, mutedIds, closeFriends, collections, followerCounts, isFollowing, toggleFollow, onBlock, onUnblock, onMute, onUnmute, onToggleCloseFriend, onExportData, onSetBirthday, onToggleShowProfileVisits, onDeleteAccount, onCreateCollection, onAssignCollection } = social;

  const stories = useStories({ flash, dbErr, setDbError, gainXp });
  const reelsHook = useReels({ tab, flash, dbErr, setDbError, gainXp });
  const chat = useChat({ live, session, flash, dbErr, setDbError, setTab, onIncoming: showTicker });
  const market = useMarket({ tab, flash, dbErr, setDbError });
  const movies = useMovies({ tab, session, flash, dbErr });
  const music = useMusic({ tab, flash, dbErr });
  const groups = useGroups({ session, flash, dbErr, setDbError, gainXp, hydrateMerge: feed.hydrateMerge });
  const forum = useForum({ session, flash, dbErr, setDbError });
  const admin = useAdmin({ tab, session, flash, dbErr, setXp, setPosts: feed.setPosts });
  const referrals = useReferrals({ session, flash });
  const languages = useLanguages({ session, gainXp });
  const notifications = useNotifications({ session, live, settings, onIncoming: showTicker });
  const locationSharing = useLocationSharing({ live, onNearby: showTicker });
  const presence = usePresence({ session });
  const games = useGames();
  const albums = useAlbums({ flash, dbErr });

  const [suggested, setSuggested] = useState([]);
  const [dismissedSug, setDismissedSug] = useState([]);
  const [listView, setListView] = useState(null);
  const [pendingReelId, setPendingReelId] = useState(null);
  const [pendingEventId, setPendingEventId] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pullMenuOpen, setPullMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileId, setProfileId] = useState(null);
  const backRef = useRef(() => false);
  const exitArmedRef = useRef(false);
  const promoSeedRef = useRef(Math.random());
  const me = USERS[ME];

  // load my profile + feed once logged in
  useEffect(() => {
    if (!hasSupabase || !session) return;
    let cancelled = false;
    (async () => {
      const uid = session.user.id;
      try {
        let prof;
        try { prof = await profilesApi.stats(uid); } catch (e) { prof = await profilesApi.get(uid); }
        if (cancelled) return;
        mergeProfile(prof); setME(uid);
        if (prof && prof.onboarded === false && !cancelled) setShowOnboarding(true);
        if (prof && typeof prof.xp === "number") setXp(prof.xp);
        setMeProfile({ name: USERS[ME].name, bio: USERS[ME].bio, avatar: USERS[ME].avatar, cover: USERS[ME].cover });
        await feed.loadFeed();
        if (!cancelled) setReady(true);
      } catch (e) {
        console.error("mzera load:", e); setDbError("mzera load: " + (e.message || JSON.stringify(e)) + (e.hint ? " · hint: " + e.hint : "") + (e.code ? " · code: " + e.code : ""));
        if (!cancelled) setReady(true); return;
      }
      // secondary data loads in the background — the app is already interactive
      if (cancelled) return;
      followsApi.following(uid).then(fl => { fl.forEach(mergeProfile); if (!cancelled) social.setFollowing(fl.map(p => p.id)); }).catch(() => {});
      Promise.all([profilesApi.blockedList(), profilesApi.mutedList()]).then(([bl, mu]) => { if (!cancelled) { social.setBlockedIds(bl); social.setMutedIds(mu); } }).catch(() => {});
      profilesApi.closeFriendsList().then(cf => { if (!cancelled) social.setCloseFriends(cf); }).catch(() => {});
      profilesApi.listCollections().then(cols => { if (!cancelled) social.setCollections(cols); }).catch(() => {});
      postsApi.memories().then(mem => { if (!cancelled && mem.length) feed.setMemories(mem.map(mapDbPost)); }).catch(() => {});
      profilesApi.suggested(40).then(sug => { sug.forEach(mergeProfile); if (!cancelled) setSuggested(sug); }).catch(() => {});
      notifications.loadNotifs().catch(() => {}); chat.loadConvos().catch(() => {}); stories.loadStories().catch(() => {}); reelsHook.loadReels().catch(() => {}); market.loadListings().catch(() => {}); movies.loadFilms().catch(() => {}); movies.loadFilmWatch().catch(() => {}); music.loadMusic().catch(() => {}); groups.loadGroups().catch(() => {}); groups.loadEvents().catch(() => {}); forum.loadThreads().catch(() => {}); feed.loadShareCounts().catch(() => {});
      try {
        const today = new Date().toISOString().slice(0, 10);
        if (typeof localStorage !== "undefined" && localStorage.getItem("mz_bday_check") !== today) {
          localStorage.setItem("mz_bday_check", today);
          profilesApi.notifyBirthdayFollowers().catch(() => {});
        }
      } catch (e) {}
    })();
    return () => { cancelled = true; };
  }, [session]);

  useEffect(() => {
    if (!session || !hasSupabase) return;
    const ch = postsApi.feedSubscribe((row) => {
      if (!row || row.author_id === ME || row.group_id || row.shared_post_id) return;
      if (row.scheduled_for && new Date(row.scheduled_for) > new Date()) return;
      if (followingRef.current.includes(row.author_id) || row.public_status === "approved") feed.setNewPosts(n => n + 1);
    });
    return () => { try { ch.unsubscribe(); } catch (e) {} };
  }, [session]);

  useEffect(() => {
    const pid = profileId || ME;
    if (!pid || !hasSupabase || (tab !== "profile" && !profileId)) return;
    profilesApi.stats(pid).then(s => { mergeProfile(s); social.setFollowerCounts(fc => ({ ...fc, [pid]: s.follower_count ?? 0 })); }).catch(() => {});
    if (pid !== ME && me.showProfileVisits !== false) profilesApi.recordView(pid).catch(() => {});
    albums.loadAll(pid);
  }, [profileId, tab]);

  const unreadMsgs = chat.unreadMsgs;
  const unreadNotifs = notifications.unreadNotifs;
  const onlineCount = presence.onlineCount;
  const openReports = admin.reports.filter(r => r.status === "open").length;

  const uploadImage = async (file, folder = "posts", onProgress) => await storageApi.upload(await compressImage(file), folder, onProgress);
  // a photo added to an album (or to the default unsorted bucket) is also a
  // wall post with just an image — mirrors how Facebook/Instagram surface
  // "added a new photo" on the feed instead of only filing it silently away.
  const onUploadAlbumPhoto = async (file, albumId, onProgress) => {
    const url = await uploadImage(file, "albums", onProgress);
    await albums.onUploadPhoto(url, albumId);
    gainXp(5);
    postsApi.create({ images: [url] }).then(feed.reloadFeed).catch(dbErr("პოსტი"));
  };
  const onChangeCover = async (file, onProgress) => { if (!file) return; const url = await storageApi.upload(await compressImage(file, 1600, 0.78), "covers", onProgress); await profilesApi.update(ME, { cover_url: url }); USERS[ME] = { ...USERS[ME], cover: url }; setMeProfile(p => ({ ...p, cover: url })); flash("ქოვერი განახლდა ✅"); };
  const onChangeAvatar = async (file, onProgress) => { if (!file) return; const url = await storageApi.upload(await compressImage(file, 640, 0.8), "avatars", onProgress); await profilesApi.update(ME, { avatar_url: url }); USERS[ME] = { ...USERS[ME], avatar: url }; setMeProfile(p => ({ ...p, avatar: url })); flash("პროფილის ფოტო განახლდა ✅"); };

  const onTag = (t) => feed.openTag(t, setProfileId);
  const openProfile = (id) => { setDrawerOpen(false); setProfileId(id); setTab("profile"); feed.loadUserPosts(id); };
  const onPost = (text, pics, poll, scheduledFor, wantPublic, extras) => { setCreateOpen(false); feed.onPost(text, pics, poll, scheduledFor, wantPublic, extras); };

  const goTab = (k) => { setDrawerOpen(false); if (k === "notifications" || k === "messages") ensureNotifPerm(); if (k === "create") { setCreateOpen(true); return; } if (k === "notifications") { notifications.setNotifs(n => n.map(x => ({ ...x, read: true }))); notifsApi.markAllRead().catch(() => {}); } if (k === "profile") setProfileId(ME); if (k === "explore") feed.setActiveTag(null); if (k === "messages") chat.setOpenConvoId(null); setTab(k); };

  const visible = feed.posts.filter(p => !p.hidden && !p.groupId && !mutedIds.includes(p.userId) && !blockedIds.includes(p.userId));
  const homeVisible = (() => {
    const base = visible.filter(p => (p.authorId === ME || following.includes(p.authorId) || p.publicStatus === "approved") && !feed.hiddenPosts.includes(p.id));
    // a just-published post has zero likes/comments, so under "top" sort
    // score() ranks it below almost anything else until it earns engagement —
    // effectively invisible right after posting. Floating your own post to
    // the very top for its first few minutes (regardless of sort mode)
    // matches how every mainstream feed surfaces "you just posted this".
    const tier = (p) => (p.authorId === ME && (Date.now() - new Date(p.createdAt || 0).getTime()) < 10 * 60 * 1000) ? -1
      : feed.favorites.includes(p.authorId) ? 0 : feed.seeLess.includes(p.authorId) ? 2 : 1;
    const score = (p) => { const ageH = (Date.now() - new Date(p.createdAt || Date.now()).getTime()) / 3.6e6; return ((p.likes || 0) * 3 + ((p.comments && p.comments.length) || 0) * 4 + 1) / Math.pow(ageH + 2, 1.2); };
    return base.slice().sort((a, b) => tier(a) - tier(b) || (feed.feedSort === "top" ? score(b) - score(a) : new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
  })();
  // up to 20 suggested people, picked once per session (stable while scrolling,
  // reshuffled on the next reload) rather than always the same first N
  const suggestedShown = (() => {
    const pool = suggested.filter(u => !dismissedSug.includes(u.id) && u.id !== ME);
    if (pool.length <= 20) return pool;
    let seed = promoSeedRef.current * 31337;
    const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    return pool.map(u => [rand(), u]).sort((a, b) => a[0] - b[0]).map(([, u]) => u).slice(0, 20);
  })();
  const todayBdays = (() => { const now = new Date(); const mm = now.getMonth() + 1, dd = now.getDate(); const ids = Array.from(new Set([ME, ...following])); return ids.filter(id => { const b = USERS[id] && USERS[id].birthday; if (!b || typeof b !== "string") return false; const parts = b.split("-"); return Number(parts[1]) === mm && Number(parts[2]) === dd; }); })();

  // ── Feed discovery cards: pull people toward Groups/Films/Music/Games/Market/Forum/
  // Reels/Map/Languages by dropping one popular-item promo card every few posts.
  // Picks are reshuffled once a day (via seedDay) so they don't jump around on
  // every re-render/interaction.
  const openPromo = (promo) => {
    if (promo.kind === "group") { groups.setPendingGroup(promo.id); setTab("groups"); }
    else if (promo.kind === "film") setTab("movies");
    else if (promo.kind === "song") setTab("music");
    else if (promo.kind === "market") setTab("market");
    else if (promo.kind === "forum") setTab("forum");
    else if (promo.kind === "game") { if (promo.id === "bura") games.setBuraOpen(true); else games.setNardiOpen(true); }
    else if (promo.kind === "reel") setTab("reels");
    else if (promo.kind === "map") setTab("map");
    else if (promo.kind === "languages") setTab("languages");
  };

  // used by SearchView so a film/song/listing result opens straight to that
  // item's detail view (same "pendingOpen" pattern as group promo cards above)
  const onOpenSearchFilm = (film) => { movies.ensureFilmLoaded(film); movies.setPendingFilm(film.id); setTab("movies"); };
  const onOpenSearchSong = (song) => { music.playSong(song); setTab("music"); };
  const onOpenSearchListing = (listing) => { market.ensureListingLoaded(listing); market.setPendingListing(listing.id); setTab("market"); };
  const onOpenSearchGroup = (group) => { groups.ensureGroupLoaded(group); groups.setPendingGroup(group.id); setTab("groups"); };
  const onOpenSearchThread = (thread) => { forum.ensureThreadLoaded(thread); forum.setPendingThread(thread.id); setTab("forum"); };
  const feedItems = (() => {
    if (!homeVisible.length) return homeVisible.map(p => ({ type: "post", post: p }));
    // promoSeedRef is picked once per app load (not per day), so which item wins
    // each category and how the promo cards are ordered/spaced actually changes
    // between visits instead of staying frozen all day — makes the feed feel alive.
    const promoSeed = "s" + promoSeedRef.current;
    const pickTop = (arr, scoreFn, topN = 5) => { if (!arr || !arr.length) return null; const pool = arr.slice().sort((a, b) => scoreFn(b) - scoreFn(a)).slice(0, Math.min(topN, arr.length)); return pool[hashIdx(promoSeed + pool.length, pool.length)]; };
    const GAME_PROMOS = [
      { kind: "game", id: "bura", image: null, title: "ბურა", subtitle: "ქართული კარტის თამაში — ბოტთან ან ონლაინ მეგობრებთან", cta: "თამაშის დაწყება" },
      { kind: "game", id: "nardi", image: null, title: "ნარდი", subtitle: "კლასიკური ნარდი — ბოტთან ან ონლაინ მეგობრებთან", cta: "თამაშის დაწყება" },
    ];
    const promos = [
      (() => { const p = pickTop(groups.groups.filter(g => !g.joined), g => g.members); return p && { kind: "group", id: p.id, image: p.cover, title: p.name, subtitle: `${p.members} წევრი · გაწევრიანდი`, cta: "გაწევრიანება" }; })(),
      (() => { const p = pickTop(movies.films, f => new Date(f.createdAt || 0).getTime()); return p && { kind: "film", id: p.id, image: p.poster, title: p.title, subtitle: [p.year, p.genre].filter(Boolean).join(" · "), cta: "ნახვა" }; })(),
      (() => { const p = pickTop(music.songs, s => s.plays); return p && { kind: "song", id: p.id, image: p.cover, title: p.title, subtitle: `${p.artist || "უცნობი შემსრულებელი"} · ${p.plays} მოსმენა`, cta: "მოსმენა" }; })(),
      GAME_PROMOS[hashIdx(promoSeed + "g", GAME_PROMOS.length)],
      (() => { if (!market.listings.length) return null; const p = market.listings[hashIdx(promoSeed + "m", market.listings.length)]; return { kind: "market", id: p.id, image: p.image, title: p.title, subtitle: `${p.price} ₾ · ${p.location}`, cta: "ნახვა მარკეტში" }; })(),
      (() => { const p = pickTop(forum.threads, x => (x.votes || 0) + (x.replies ? x.replies.length : 0) * 2); return p && { kind: "forum", id: p.id, image: null, title: p.title, subtitle: `${p.votes} ხმა · ${p.cat}`, cta: "ნახვა ფორუმში" }; })(),
      (() => { const p = pickTop(reelsHook.reels, r => (r.views || 0) + (r.likes || 0) * 3 + (r.comments || 0) * 4); return p && { kind: "reel", id: p.id, image: p.image, video: p.video, title: p.caption || "Reel", subtitle: `${p.views || 0} ნახვა`, cta: "ნახვა" }; })(),
      (() => { const pool = visible.filter(x => (x.likes || 0) + (x.comments ? x.comments.length : 0) > 0); const p = pickTop(pool, x => (x.likes || 0) + (x.comments ? x.comments.length : 0) * 2, 8); return p && { kind: "post", id: p.id, post: p }; })(),
      { kind: "map", id: "map", image: null, title: "რუკა", subtitle: "ნახე ვინ არის ახლოს და გაუზიარე შენი ლოკაცია", cta: "რუკის გახსნა" },
      { kind: "languages", id: "languages", image: null, title: "ენების სწავლა", subtitle: "ისწავლე ინგლისური, გერმანული, ესპანური ან ფრანგული", cta: "სწავლის დაწყება" },
    ].filter(Boolean);
    // shuffle the promo order itself (same seed → stable during one visit,
    // different on the next reload) so it's not always group→film→song→…
    let shuffleSeed = promoSeedRef.current * 97711;
    const shuffleRand = () => { shuffleSeed = (shuffleSeed * 9301 + 49297) % 233280; return shuffleSeed / 233280; };
    const shuffledPromos = promos.map(p => [shuffleRand(), p]).sort((a, b) => a[0] - b[0]).map(([, p]) => p);
    // Reels row: first appearance randomly 1-3 posts down, then again every
    // randomized 20-25 posts — seeded once per session so it's stable while
    // scrolling but lands somewhere different on the next visit/reload
    const reelPositions = new Set();
    if (reelsHook.reels.length) {
      let seed = reelsHook.reelsSeedRef.current;
      const rand = (min, max) => { seed = (seed * 9301 + 49297) % 233280; return Math.floor(min + (seed / 233280) * (max - min + 1)); };
      let pos = rand(1, 3);
      while (pos <= homeVisible.length + 25) { reelPositions.add(pos); pos += rand(20, 25); }
    }
    // Promo cards: randomized spacing (not a rigid "every 4th post") so they land
    // somewhere different each scroll-through instead of at the same mechanical beat
    const promoPositions = new Set();
    if (shuffledPromos.length) {
      let seed = promoSeedRef.current * 51331;
      const rand = (min, max) => { seed = (seed * 9301 + 49297) % 233280; return Math.floor(min + (seed / 233280) * (max - min + 1)); };
      let pos = rand(2, 4);
      while (pos <= homeVisible.length + 8) { promoPositions.add(pos); pos += rand(5, 8); }
    }
    // Suggested-people row: same as the reels row, but resurfaced further down
    // among posts too (not just once at the very top) — first appears randomly
    // 2-4 posts down, then repeats every 20 posts after that
    const suggestedPositions = new Set();
    if (suggestedShown.length) {
      let seed = promoSeedRef.current * 68111;
      const rand = (min, max) => { seed = (seed * 9301 + 49297) % 233280; return Math.floor(min + (seed / 233280) * (max - min + 1)); };
      let pos = rand(2, 4);
      while (pos <= homeVisible.length + 20) { suggestedPositions.add(pos); pos += 20; }
    }
    const out = []; let pi = 0;
    homeVisible.forEach((p, i) => {
      out.push({ type: "post", post: p });
      if (promoPositions.has(i + 1) && shuffledPromos.length) { out.push({ type: "promo", promo: shuffledPromos[pi % shuffledPromos.length] }); pi++; }
      if (reelPositions.has(i + 1)) out.push({ type: "reels" });
      if (suggestedPositions.has(i + 1)) out.push({ type: "suggested" });
    });
    return out;
  })();
  const feedProps = { onLike: feed.onLike, onReact: feed.onReact, onSave: feed.onSave, onComment: feed.onComment, onPollVote: feed.onPollVote, onTag, onReport: admin.onReport, onRemove: feed.onRemovePost, onOpenProfile: openProfile, isAdmin: me.admin, onEdit: feed.onEditPost, onDelete: feed.onDeletePost, onEditComment: feed.onEditComment, onDeleteComment: feed.onDeleteComment, onLikeComment: feed.onLikeComment, onRepost: feed.onRepost, onReactors: (pid) => reactionsApi.listForPost(pid) };

  // ── Hardware / gesture "back" → step one level back inside the app (не exit) ──
  const goBackOneLevel = () => {
    if (games.buraOpen) { games.setBuraOpen(false); return true; }
    if (games.nardiOpen) { games.setNardiOpen(false); return true; }
    if (games.chessOpen) { games.setChessOpen(false); return true; }
    if (stories.storyId) { stories.setStoryId(null); return true; }
    if (reelsHook.reelComments) { reelsHook.setReelComments(null); return true; }
    if (reelsHook.reelCreateOpen) { reelsHook.setReelCreateOpen(false); return true; }
    if (stories.storyEditorOpen) { stories.setStoryEditorOpen(false); return true; }
    if (createOpen) { setCreateOpen(false); return true; }
    if (searchOpen) { setSearchOpen(false); return true; }
    if (settingsOpen) { setSettingsOpen(false); return true; }
    if (drawerOpen) { setDrawerOpen(false); return true; }
    if (listView) { setListView(null); return true; }
    if (feed.postView) { feed.setPostView(null); feed.setPostViewCommentId(null); return true; }
    if (feed.tagView) { feed.setTagView(null); return true; }
    if (showOnboarding) { onFinishOnboarding(); return true; }
    if (tab === "messages" && chat.openConvoId) { chat.setOpenConvoId(null); return true; }
    if (tab === "profile" && profileId) { setProfileId(null); setTab("home"); return true; }
    if (tab !== "home") { setTab("home"); return true; }
    return false;
  };
  backRef.current = goBackOneLevel;
  useEffect(() => {
    try { window.history.pushState({ mz: 1 }, ""); } catch (e) {}
    const onPop = () => {
      let handled = false;
      try { handled = backRef.current(); } catch (e) {}
      if (handled) { exitArmedRef.current = false; try { window.history.pushState({ mz: 1 }, ""); } catch (e) {} }
      else if (exitArmedRef.current) { window.removeEventListener("popstate", onPop); try { window.history.back(); } catch (e) {} }
      else { exitArmedRef.current = true; flash("დააჭირე უკან ისევ გასასვლელად"); setTimeout(() => { exitArmedRef.current = false; }, 2000); try { window.history.pushState({ mz: 1 }, ""); } catch (e) {} }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const NAV = [
    { key: "home", label: t("nav.home"), icon: Home }, { key: "explore", label: t("nav.explore"), icon: Compass },
    { key: "reels", label: t("nav.reels"), icon: Film }, { key: "forum", label: t("nav.forum"), icon: MessageSquare },
    { key: "market", label: t("nav.market"), icon: ShoppingBag }, { key: "games", label: t("nav.games"), icon: Gamepad2 }, { key: "movies", label: t("nav.movies"), icon: Clapperboard }, { key: "music", label: t("nav.music"), icon: Music }, { key: "groups", label: t("nav.groups"), icon: Users },
    { key: "map", label: t("nav.map"), icon: Map }, { key: "create", label: t("nav.create"), icon: PlusSquare },
    { key: "messages", label: t("nav.messages"), icon: Send, badge: unreadMsgs }, { key: "notifications", label: t("nav.notifications"), icon: Bell, badge: unreadNotifs },
    { key: "progress", label: t("nav.progress"), icon: Zap }, { key: "leaderboard", label: t("nav.leaderboard"), icon: Trophy }, { key: "profile", label: t("nav.profile"), icon: User },
    { key: "languages", label: t("nav.languages"), icon: Languages },
    ...(me.admin ? [{ key: "admin", label: t("nav.admin"), icon: Shield, badge: openReports }] : []),
  ];
  const BOTTOM = ["home", "reels", "create", "messages", "profile"];
  const fullBleed = tab === "map" || tab === "reels";

  if (!hasSupabase) return <ConfigError />;
  if (recoveryMode) return <AuthScreen recoveryMode onUpdatePassword={onUpdatePassword} />;
  if (session === undefined) return <LoadingScreen />;
  if (session === null) return <AuthScreen onResetPassword={onResetPassword} />;
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
        /* these end on transform:none (not translateY(0)/translateX(0)) because animation-fill-mode:both
           keeps that end value applied forever, and any non-"none" transform — even the identity one —
           creates a new containing block for fixed-position descendants. Every full-screen "fixed inset-0"
           modal rendered inside an animated post card or tab (repost sheet, lightbox, reactors list, ...)
           was getting sized to that small card instead of the viewport. */
        @keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes pin{0%{opacity:0;transform:translate(-50%,8px) scale(.96)}100%{opacity:1;transform:translate(-50%,0) scale(1)}}
        @keyframes tdot{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}
        @keyframes floatUp{0%{opacity:0;transform:translateY(20px) scale(.9)}12%{opacity:1;transform:translateY(0) scale(1)}75%{opacity:1;transform:translateY(-90px)}100%{opacity:0;transform:translateY(-140px) scale(.95)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%{transform:translate(-50%,-50%) scale(.6);opacity:.7}100%{transform:translate(-50%,-50%) scale(1.6);opacity:0}}
        @keyframes fadeOnly{from{opacity:0}to{opacity:1}}
        @keyframes slideIn{from{opacity:0;transform:translateX(22px)}to{opacity:1;transform:none}}
        @keyframes mzTicker{from{transform:translateX(100%)}to{transform:translateX(-100%)}}
        @keyframes mzPullHint{0%,100%{transform:translateY(0)}50%{transform:translateY(4px)}}
        @keyframes mzLiveDot{0%{transform:scale(1);opacity:.7}70%{transform:scale(2.4);opacity:0}100%{opacity:0}}
        .fadein{animation:fadeOnly .35s ease both}
        .slidein{animation:slideIn .28s cubic-bezier(.2,.8,.2,1) both}
        .stagger>*{animation:up .5s cubic-bezier(.22,.61,.36,1) both}
        .stagger>*:nth-child(1){animation-delay:.03s}.stagger>*:nth-child(2){animation-delay:.07s}.stagger>*:nth-child(3){animation-delay:.11s}.stagger>*:nth-child(4){animation-delay:.15s}.stagger>*:nth-child(5){animation-delay:.19s}.stagger>*:nth-child(6){animation-delay:.23s}.stagger>*:nth-child(n+7){animation-delay:.27s}
        @media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}
      `}</style>

      <div className="mx-auto flex w-full max-w-[1100px]">
        <aside className="hidden md:flex flex-col w-[235px] shrink-0 px-3 py-6 sticky top-0 h-screen" style={{ borderRight: `1px solid ${C.line}`, background: C.surface }}>
          <div className="px-3 mb-6">
            <Wordmark size={25} />
            {ticker ? <div className="mt-2.5"><HeaderTicker text={ticker} /></div> : music.nowPlaying && <div className="mt-2.5"><MiniPlayer song={music.nowPlaying} playing={music.isPlaying} onToggle={() => music.setIsPlaying(p => !p)} onStop={music.stopPlaying} /></div>}
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-1">
            {NAV.map(n => <button key={n.key} onClick={() => goTab(n.key)} className="relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl transition active:scale-[.98] shrink-0" style={{ background: tab === n.key ? C.accentSoft : "transparent", color: tab === n.key ? C.accentText : C.ink2, fontWeight: tab === n.key ? 700 : 500 }}>{tab === n.key && <span className="absolute left-0 rounded-full" style={{ width: 4, height: 20, backgroundImage: GBRAND }} />}<n.icon size={23} />{n.label}{n.badge > 0 && <span className="ml-auto rounded-full text-white px-1.5 py-0.5" style={{ background: C.like, fontFamily: MONO, fontSize: 11, fontWeight: 700 }}>{n.badge}</span>}</button>)}
            <button onClick={() => setCreateOpen(true)} className="mt-2 py-3 rounded-2xl font-bold text-white transition active:scale-[.98] shrink-0" style={{ backgroundImage: GBRAND, boxShadow: SH.glow, fontFamily: DISPLAY }}>{t("nav.newPost")}</button>
          </div>
          <div className="pt-3 mt-2" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <div className="mb-2"><ThemeToggle mode={mode} setMode={setMode} full /></div>
            <button onClick={() => openProfile(ME)} className="flex items-center gap-2.5 px-2 py-2 rounded-2xl w-full hover:opacity-80"><Avatar id={ME} size={36} /><div className="text-left leading-tight min-w-0"><div className="text-sm font-bold truncate" style={{ color: C.ink }}>{me.name.split(" ")[0]}</div><Mono style={{ fontSize: 12, color: C.faint }}>@{me.handle}</Mono></div></button>
          </div>
        </aside>

        <main className="flex-1 min-w-0 max-w-[600px] mx-auto" style={{ borderRight: `1px solid ${C.line}` }}>
          {!fullBleed && (
            <header className="mz-hdr md:hidden flex items-center px-3 h-14 sticky top-0 z-20" style={{ background: C.surface + "e6", backdropFilter: "blur(14px)", borderBottom: `1px solid ${C.line}` }}>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setDrawerOpen(true)} aria-label={t("a11y.menu")} className="rounded-full active:scale-90 flex items-center justify-center" style={{ width: 40, height: 40, color: C.ink2 }}><Menu size={24} /></button>
                <button onClick={() => goTab("home")} className="active:scale-95 flex items-center pr-2" aria-label="მთავარი"><Wordmark size={21} /></button>
              </div>
              <div className="flex-1 min-w-0 flex justify-center px-1">{ticker ? <HeaderTicker text={ticker} /> : music.nowPlaying && <MiniPlayer song={music.nowPlaying} playing={music.isPlaying} onToggle={() => music.setIsPlaying(p => !p)} onStop={music.stopPlaying} />}</div>
              <div className="flex items-center shrink-0"><IconBtn onClick={() => setSearchOpen(true)}><Search size={23} /></IconBtn><ThemeToggle mode={mode} setMode={setMode} /><IconBtn onClick={() => goTab("online")} badge={onlineCount}><Users size={23} /></IconBtn><IconBtn onClick={() => goTab("notifications")} badge={unreadNotifs}><Bell size={23} /></IconBtn></div>
            </header>
          )}

          <Suspense fallback={<PageSkeleton />}>
          <div className={fullBleed ? "" : "slidein"} key={tab + (profileId || "") + (feed.activeTag || "")}>
            {tab === "home" && (
              <>
                {feed.newPosts > 0 && <button onClick={() => { feed.setNewPosts(0); feed.reloadFeed(); if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" }); }} className="fixed left-1/2 z-40 px-4 py-2 rounded-full text-[13px] font-bold text-white active:scale-95 flex items-center gap-1.5" style={{ top: 70, transform: "translateX(-50%)", backgroundImage: GBRAND, boxShadow: SH.glow }}>↑ {feed.newPosts} ახალი პოსტი</button>}
                <div style={{ borderBottom: `1px solid ${C.lineSoft}`, background: C.surface }}><StoryRow stories={stories.stories} onOpen={stories.openStory} onAdd={() => stories.setStoryEditorOpen(true)} /></div>
                <PullMenu open={pullMenuOpen} setOpen={setPullMenuOpen} nav={NAV} onNav={goTab} onCreate={() => setCreateOpen(true)} flash={flash} tab={tab} mode={mode} setMode={setMode} xp={xp} followers={followerCounts[ME] != null ? followerCounts[ME] : (USERS[ME] ? USERS[ME].followers : 0)} following={following.length} onSettings={() => setSettingsOpen(true)} onSignOut={() => authApi.signOut().catch(dbErr("გასვლა"))} />
                {todayBdays.length > 0 && <div className="mx-4 mt-3 rounded-2xl p-3.5 flex items-center gap-3" style={{ background: C.accentSoft }}><span style={{ fontSize: 26 }}>🎂</span><div className="min-w-0 flex-1"><div className="text-[14px] font-bold" style={{ color: C.accentText }}>დღეს დაბადების დღეა!</div><div className="text-[13px] truncate" style={{ color: C.ink2 }}>{todayBdays.map(id => id === ME ? "შენ 🎉" : (USERS[id] ? USERS[id].name : "")).filter(Boolean).join(", ")}</div></div>{todayBdays.filter(id => id !== ME).length > 0 && <button onClick={() => openProfile(todayBdays.find(id => id !== ME))} className="shrink-0 px-3 py-1.5 rounded-full text-[12.5px] font-bold text-white active:scale-95" style={{ backgroundImage: GBRAND }}>მიულოცე</button>}</div>}
                {feed.memories.length > 0 && <div className="mx-4 mt-3 rounded-2xl p-3" style={{ background: C.surface, border: `1px solid ${C.line}` }}><div className="flex items-center gap-2 mb-2"><span style={{ fontSize: 18 }}>🗓</span><span className="text-[14px] font-bold" style={{ color: C.ink }}>ამ დღეს</span></div><div className="flex gap-2 overflow-x-auto no-scrollbar">{feed.memories.map(m => <div key={m.id} className="shrink-0 rounded-xl overflow-hidden" style={{ width: 130 }}>{m.image ? <Pic src={m.image} grad={GRADS[hashIdx(m.id, GRADS.length)]} style={{ width: 130, height: 130 }} /> : <div className="flex items-center justify-center p-2.5 text-center" style={{ width: 130, height: 130, background: (m.bg && POST_BGS[m.bg]) ? undefined : C.surfaceMuted, backgroundImage: (m.bg && POST_BGS[m.bg]) ? `linear-gradient(140deg, ${POST_BGS[m.bg][0]}, ${POST_BGS[m.bg][1]})` : undefined }}><span className="text-[12px] font-semibold line-clamp-4" style={{ color: m.bg ? "#fff" : C.ink2 }}>{(m.text || "პოსტი").slice(0, 90)}</span></div>}<div className="text-[11px] px-1 pt-1" style={{ color: C.faint }}>{m.time}</div></div>)}</div></div>}
                {homeVisible.length > 0 && <div className="flex items-center px-4 pt-3"><div className="flex gap-1 p-0.5 rounded-full" style={{ background: C.surfaceMuted }}>{[["top", "ტოპ"], ["recent", "ბოლო"]].map(([k, l]) => <button key={k} onClick={() => feed.setFeedSort(k)} className="px-4 py-1.5 rounded-full text-[12.5px] font-bold transition" style={feed.feedSort === k ? { background: C.surface, color: C.accent, boxShadow: SH.card } : { color: C.muted }}>{l}</button>)}</div></div>}
                {homeVisible.length ? <div className="stagger space-y-4 p-4">{feedItems.map((it, i) => it.type === "post"
                  ? <PostCard key={it.post.id} post={it.post} onLike={feed.onLike} onReact={feed.onReact} onSave={feed.onSave} onComment={feed.onComment} onPollVote={feed.onPollVote} onTag={onTag} onReport={admin.onReport} onRemove={feed.onRemovePost} onOpenProfile={openProfile} isAdmin={me.admin} onEdit={feed.onEditPost} onDelete={feed.onDeletePost} onEditComment={feed.onEditComment} onDeleteComment={feed.onDeleteComment} onLikeComment={feed.onLikeComment} onRepost={feed.onRepost} onReactors={(pid) => reactionsApi.listForPost(pid)} onHide={feed.onHidePost} onSeeLess={feed.onSeeLess} onFavorite={feed.onToggleFavorite} isFavorite={feed.favorites.includes(it.post.authorId)} />
                  : it.type === "promo" && it.promo.kind === "post"
                  ? <div key={"promo" + i}><div className="flex items-center gap-1.5 px-1 pb-2 text-[12px] font-bold uppercase tracking-wide" style={{ color: C.accent, fontFamily: MONO }}><TrendingUp size={14} /> {t("promo.trendingPost")}</div><PostCard post={it.promo.post} {...feedProps} isFavorite={feed.favorites.includes(it.promo.post.authorId)} /></div>
                  : it.type === "promo" ? <FeedPromoCard key={"promo" + i} kind={it.promo.kind} data={it.promo} onOpen={() => openPromo(it.promo)} />
                  : it.type === "suggested"
                  ? <SuggestedPeople key={"sug" + i} people={suggestedShown} isFollowing={(id) => following.includes(id)} onToggle={toggleFollow} onDismiss={(id) => setDismissedSug(d => [...d, id])} onOpenProfile={openProfile} />
                  : <FeedReelsRow key={"reels" + i} reels={reelsHook.reels} onOpen={() => goTab("reels")} />
                )}</div> : <div className="px-6 py-16 text-center"><div className="text-[16px] font-bold" style={{ color: C.ink2 }}>ფიდი ცარიელია 🌱</div><div className="text-[13.5px] mt-1.5" style={{ color: C.muted, lineHeight: 1.6 }}>აქ მხოლოდ შენი და დაფოლოვებულების პოსტები ჩანს. აღმოაჩინე ხალხი და დააფოლოვე.</div><button onClick={() => setTab("explore")} className="mt-4 px-5 py-2.5 rounded-full text-[14px] font-bold text-white active:scale-95" style={{ backgroundImage: GBRAND }}>აღმოჩენა</button></div>}
                {feed.feedMore ? (
                  <div ref={feed.feedSentinelRef} className="flex justify-center items-center pt-1 pb-28 md:pb-10" style={{ minHeight: 60 }}>
                    <div style={{ width: 26, height: 26, border: `3px solid ${C.lineSoft}`, borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  </div>
                ) : <div className="pb-28 md:pb-10" />}
              </>
            )}
            {tab === "explore" && <Explore posts={visible} onTag={onTag} activeTag={feed.activeTag} clearTag={() => feed.setActiveTag(null)} onOpenProfile={openProfile} onSearch={() => setSearchOpen(true)} tagPosts={feed.tagPosts} tagLoading={feed.tagLoading} />}
            {tab === "forum" && <Forum threads={forum.threads} onReply={forum.onThreadReply} onVote={forum.onThreadVote} onReplyVote={forum.onReplyVote} onSetThreadPinned={forum.onSetThreadPinned} onSetThreadLocked={forum.onSetThreadLocked} isAdmin={me.admin} onNew={forum.onNewThread} onOpenProfile={openProfile} onEdit={forum.onEditThread} onDelete={forum.onDeleteThread} pendingOpen={forum.pendingThread} pendingReplyId={forum.pendingThreadReplyId} clearPending={() => { forum.setPendingThread(null); forum.setPendingThreadReplyId(null); }} />}
            {tab === "market" && <Market listings={market.listings} onSave={market.onListingSave} onNew={market.onNewListing} onMessage={chat.onMessageUser} onOpenProfile={openProfile} flash={flash} live={live} onOrder={market.onOrder} getReviews={market.getReviews} onAddReview={market.addReviewApi} onUpload={(f, onProgress) => uploadImage(f, "market", onProgress)} onEdit={market.onEditListing} onDelete={market.onDeleteListing} sentinelRef={market.listSentinelRef} hasMore={market.listMore} loadingMore={market.listLoadingMore} pendingOpen={market.pendingListing} clearPending={() => market.setPendingListing(null)} />}
            {tab === "games" && <GamesList onOpenBura={() => games.setBuraOpen(true)} onOpenNardi={() => games.setNardiOpen(true)} onOpenChess={() => games.setChessOpen(true)} />}
            {tab === "movies" && <Movies films={movies.films} watch={movies.filmWatch} onNew={movies.onNewFilm} onEdit={movies.onEditFilm} onDelete={movies.onDeleteFilm} onOpenProfile={openProfile} flash={flash} onUpload={(f, onProgress) => uploadImage(f, "films", onProgress)} onUploadVideo={(f, onProgress) => storageApi.upload(f, "films", onProgress)} getReviews={movies.getFilmReviews} onAddReview={movies.addFilmReviewApi} onSetWatch={movies.onSetFilmWatch} onClearWatch={movies.onClearFilmWatch} sentinelRef={movies.filmSentinelRef} hasMore={movies.filmMore} loadingMore={movies.filmLoadingMore} pendingOpen={movies.pendingFilm} clearPending={() => movies.setPendingFilm(null)} />}
            {tab === "music" && <MusicPage songs={music.songs} nowPlaying={music.nowPlaying} isPlaying={music.isPlaying} onPlay={music.playSong} onNew={music.onNewSong} onEdit={music.onEditSong} onDelete={music.onDeleteSong} onUpload={(f, onProgress) => uploadImage(f, "music", onProgress)} onUploadAudio={(f, onProgress) => storageApi.upload(f, "music", onProgress)} sentinelRef={music.songSentinelRef} hasMore={music.songMore} loadingMore={music.songLoadingMore} />}
            {tab === "map" && <MapView onMessage={chat.onMessageUser} onMenu={() => setDrawerOpen(true)} onOpenProfile={openProfile} sharing={locationSharing.sharing} myPos={locationSharing.myPos} myAccuracy={locationSharing.myAccuracy} lastSharedAt={locationSharing.lastSharedAt} geoErr={locationSharing.geoErr} setGeoErr={locationSharing.setGeoErr} busy={locationSharing.busy} onStartShare={locationSharing.start} onStopShare={locationSharing.stop} onRefreshShare={locationSharing.refreshNow} />}
            {tab === "reels" && <Reels reels={reelsHook.reels} onLike={reelsHook.onReelLike} onSave={reelsHook.onReelSave} onView={reelsHook.onReelView} onOpenProfile={openProfile} onMenu={() => setDrawerOpen(true)} flash={flash} onCreate={() => reelsHook.setReelCreateOpen(true)} onComments={reelsHook.openReelComments} sentinelRef={reelsHook.reelsSentinelRef} hasMore={reelsHook.reelsMore} loadingMore={reelsHook.reelsLoadingMore} pendingOpen={pendingReelId} clearPending={() => setPendingReelId(null)} />}
            {tab === "groups" && <Groups groups={groups.groups} events={groups.events} onJoin={groups.onJoinGroup} onRsvp={groups.onRsvp} onOpenProfile={openProfile} onMessage={chat.onMessageUser} live={live} onGroupPost={groups.onGroupPost} onUpload={(f, onProgress) => uploadImage(f, "groups", onProgress)} onUploadVideo={(f, onProgress) => storageApi.upload(f, "groups", onProgress)} onCreateGroup={groups.onCreateGroup} onCreateEvent={groups.onCreateEvent} pendingOpen={groups.pendingGroup} clearPending={() => groups.setPendingGroup(null)} pendingEvent={pendingEventId} clearPendingEvent={() => setPendingEventId(null)} onEditPost={groups.onEditGroupPost} onDeletePost={groups.onDeleteGroupPost} onEditGroup={groups.onEditGroup} onDeleteGroup={groups.onDeleteGroup} onEditEvent={groups.onEditEvent} onDeleteEvent={groups.onDeleteEvent} allPosts={feed.posts} loadGroupPosts={groups.mergeGroupPosts} loadMembers={(gid) => groupsApi.members(gid).then(rows => { rows.forEach(r => { if (r.profile) mergeProfile(r.profile); }); return rows; })} onApproveMember={groups.onApproveMember} onKickMember={groups.onKickMember} onBanMember={groups.onBanMember} onUnbanMember={groups.onUnbanMember} onTransferOwnership={groups.onTransferOwnership} onSetGroupPrivate={groups.onSetGroupPrivate} taggable={following} postProps={{ onLike: feed.onLike, onReact: feed.onReact, onSave: feed.onSave, onComment: feed.onComment, onPollVote: feed.onPollVote, onTag, onReport: admin.onReport, onRemove: feed.onRemovePost, onOpenProfile: openProfile, isAdmin: me.admin, onEdit: feed.onEditPost, onDelete: feed.onDeletePost, onEditComment: feed.onEditComment, onDeleteComment: feed.onDeleteComment, onLikeComment: feed.onLikeComment, onRepost: feed.onRepost, onReactors: (pid) => reactionsApi.listForPost(pid) }} />}
            {tab === "messages" && <Messages convos={chat.convos} openId={chat.openConvoId} setOpenId={chat.setOpenConvoId} onSend={chat.onSendMsg} onReply={chat.onReply} onEditMsg={chat.onEditMsg} onDeleteMsg={chat.onDeleteMsg} onDeleteConvo={chat.onDeleteConvo} onCreateConvo={chat.onCreateConvo} onOpenProfile={openProfile} live={live} onMenu={() => setDrawerOpen(true)} groups={groups.groups} onOpenGroup={(id) => { groups.setPendingGroup(id); setTab("groups"); }} onlineIds={presence.onlineIds} onMessageUser={chat.onMessageUser} onStartCall={chat.startCall} peerReads={chat.peerReads} initialReactions={chat.chatReactions} onMarkRead={chat.onMarkRead} onReactMsg={chat.onReactMsg} mutedConvoIds={chat.mutedConvoIds} onToggleMuteConvo={chat.toggleMuteConvo} onPinMessage={chat.onPinMessage} onUnpinMessage={chat.onUnpinMessage} />}
            {tab === "notifications" && <Notifications notifs={notifications.notifs} onOpenProfile={openProfile} onOpenPost={feed.openPost} onOpenForum={(threadId, replyId) => { forum.setPendingThread(threadId || null); forum.setPendingThreadReplyId(replyId || null); goTab("forum"); }} onOpenReels={(reelId) => { setPendingReelId(reelId || null); goTab("reels"); }} onOpenOwnStory={() => stories.openStory("s" + ME)} onOpenGroup={(groupId) => { groups.setPendingGroup(groupId || null); goTab("groups"); }} onOpenEvent={(eventId) => { setPendingEventId(eventId || null); goTab("groups"); }} isFollowing={isFollowing} onToggleFollow={toggleFollow} />}
            {tab === "online" && <OnlinePage onlineIds={presence.onlineIds} onOpenProfile={openProfile} onMessage={chat.onMessageUser} following={following} />}
            {tab === "profile" && <Profile userId={profileId || ME} posts={feed.posts} savedPosts={feed.savedPosts} reels={reelsHook.reels} xp={xp} meProfile={meProfile} following={following} followerCounts={followerCounts} onToggleFollow={toggleFollow} onMessage={chat.onMessageUser} onOpenList={(type, uid) => setListView({ type, userId: uid })} onSettings={() => setSettingsOpen(true)} flash={flash} onBack={() => goTab("home")} onTag={onTag} onLike={feed.onLike} onReact={feed.onReact} onSave={feed.onSave} onComment={feed.onComment} onPollVote={feed.onPollVote} onReport={admin.onReport} onRemove={feed.onRemovePost} onOpenProfile={openProfile} isAdmin={me.admin} onUploadAvatar={onChangeAvatar} onUploadCover={onChangeCover} onOpenReels={() => goTab("reels")} onAddReel={() => reelsHook.setReelCreateOpen(true)} onReelDelete={reelsHook.onReelDelete} onReelEdit={reelsHook.onReelEdit} onEditPost={feed.onEditPost} onDeletePost={feed.onDeletePost} onEditComment={feed.onEditComment} onDeleteComment={feed.onDeleteComment} blocked={blockedIds.includes(profileId || ME)} muted={mutedIds.includes(profileId || ME)} onBlock={onBlock} onUnblock={onUnblock} onMute={onMute} onUnmute={onUnmute} closeFriend={closeFriends.includes(profileId || ME)} onToggleCloseFriend={onToggleCloseFriend} collections={collections} onCreateCollection={onCreateCollection} onAssignCollection={onAssignCollection} albums={albums.albums} albumPhotos={albums.photos} onCreateAlbum={albums.onCreateAlbum} onRenameAlbum={albums.onRenameAlbum} onDeleteAlbum={albums.onDeleteAlbum} onUploadAlbumPhoto={onUploadAlbumPhoto} onMoveAlbumPhoto={albums.onMovePhoto} onReorderAlbumPhotos={albums.onReorderPhotos} onDeleteAlbumPhoto={albums.onDeletePhoto} />}
            {tab === "progress" && <Progress xp={xp} posts={feed.posts} myFollowers={followerCounts[ME] != null ? followerCounts[ME] : (USERS[ME] ? USERS[ME].followers : 0)} questData={questData} onClaim={onClaimQuest} />}
            {tab === "leaderboard" && <Leaderboard xp={xp} allUsers={admin.allUsers} posts={feed.posts} onOpenProfile={openProfile} />}
            {tab === "languages" && <LanguagesPage learnLang={languages.learnLang} setLearnLang={languages.setLearnLang} level={languages.level} setLevel={languages.setLevel} enabled={languages.enabled} wordsReady={languages.wordsReady} wordsForLevel={languages.wordsForLevel} availableLevels={languages.availableLevels} masteredCount={languages.masteredCount} totalCount={languages.totalCount} nextFlashcard={languages.nextFlashcard} onFlashcardKnow={languages.onFlashcardKnow} onFlashcardDontKnow={languages.onFlashcardDontKnow} genExercise={languages.genExercise} onExerciseAnswer={languages.onExerciseAnswer} board={languages.board} boardLoading={languages.boardLoading} loadBoard={languages.loadBoard} onOpenProfile={openProfile} />}
            {tab === "admin" && <Admin reports={admin.reports} posts={feed.posts} allUsers={admin.allUsers} userCount={admin.userCount} postCount={admin.postCount} online={onlineCount} stats={admin.adminStats} dailyTrends={admin.dailyTrends} onResolve={admin.onResolve} onRemovePost={feed.onRemovePost} onSetVerified={admin.onSetVerified} onSetAdmin={admin.onSetAdmin} onOpenProfile={openProfile} onBanUser={admin.onBanUser} onGrantXp={admin.onGrantXp} onSetXp={admin.onSetXp} onDeleteUser={admin.onDeleteUser} onBroadcast={admin.onBroadcast} pendingPublic={admin.pendingPublic} onReviewPublic={admin.onReviewPublic} listings={market.listings} threads={forum.threads} reels={reelsHook.reels} onDeleteListing={market.onDeleteListing} onDeleteThread={forum.onDeleteThread} onDeleteReel={reelsHook.onReelDelete} onEditListing={market.onEditListing} onEditThread={forum.onEditThread} onSetThreadPinned={forum.onSetThreadPinned} onSetThreadLocked={forum.onSetThreadLocked} groups={groups.groups} events={groups.events} films={movies.films} songs={music.songs} onEditGroup={groups.onEditGroup} onDeleteGroup={groups.onDeleteGroup} onEditEvent={groups.onEditEvent} onDeleteEvent={groups.onDeleteEvent} onEditFilm={movies.onEditFilm} onDeleteFilm={movies.onDeleteFilm} onEditSong={music.onEditSong} onDeleteSong={music.onDeleteSong} langEnabled={admin.langEnabled} langProgress={admin.langProgress} onToggleLanguages={admin.onToggleLanguages} stories={admin.adminStories} onDeleteStory={admin.onDeleteStory} />}
          </div>
          </Suspense>
        </main>

        <aside className="hidden lg:block w-[290px] shrink-0 px-5 py-6">
          <button onClick={() => setSearchOpen(true)} className="w-full flex items-center gap-2.5 px-4 py-3 rounded-full mb-5 text-left active:scale-[.99] transition" style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SH.card }}><Search size={18} style={{ color: C.faint }} /><span className="flex-1 text-sm" style={{ color: C.faint }}>ძებნა</span></button>
          {(() => { const tr = computeTrends(feed.posts, 5); return tr.length > 0 ? (
          <div className="p-4 mb-4" style={card()}><div className="flex items-center gap-1.5 text-[15px] mb-3.5" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700 }}><TrendingUp size={17} style={{ color: C.accent }} /> ტრენდები</div><div className="space-y-3">{tr.map(t => <button key={t.tag} onClick={() => onTag(t.tag)} className="block text-left w-full hover:opacity-70"><div className="font-bold text-[14px]" style={{ color: C.ink }}>#{t.tag}</div><Mono style={{ fontSize: 12, color: C.faint }}>{t.posts} პოსტი</Mono></button>)}</div></div>
          ) : null; })()}
          {(() => { const sug = (admin.allUsers || []).filter(u => u.id !== ME && !following.includes(u.id)).slice(0, 3); return sug.length > 0 ? (
          <div className="p-4" style={card()}><div className="text-[15px] mb-3.5" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700 }}>გაიცანი</div><div className="space-y-3.5">{sug.map(u => <div key={u.id} className="flex items-center gap-2.5"><button onClick={() => openProfile(u.id)}><Avatar id={u.id} size={40} /></button><div className="min-w-0 flex-1"><Name id={u.id} className="text-[13px]" /><Mono style={{ fontSize: 12, color: C.faint }} className="block truncate">@{USERS[u.id].handle}</Mono></div><FollowBtn id={u.id} isFollowing={isFollowing} onToggle={toggleFollow} /></div>)}</div></div>
          ) : null; })()}
        </aside>
      </div>

      {installEvt && (
        <div className="md:hidden fixed inset-x-0 z-30 px-3" style={{ bottom: "calc(var(--mz-nav, 60px) + 8px)" }}>
          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: "0 8px 28px rgba(0,0,0,.18)", maxWidth: 520, margin: "0 auto" }}>
            <div className="rounded-xl flex items-center justify-center shrink-0" style={{ width: 40, height: 40, backgroundImage: GBRAND }}><Download size={20} color="#fff" /></div>
            <div className="flex-1 min-w-0"><div className="text-[14px] font-bold" style={{ color: C.ink }}>დააინსტალირე mzera</div><div className="text-[12px]" style={{ color: C.muted }}>მთავარ ეკრანზე, აპლიკაციასავით</div></div>
            <button onClick={doInstall} className="px-3.5 py-2 rounded-xl text-[13px] font-bold text-white shrink-0 active:scale-95" style={{ backgroundImage: GBRAND }}>დაამატე</button>
            <button onClick={() => setInstallEvt(null)} aria-label={t("a11y.close")} className="shrink-0 active:scale-90" style={{ color: C.faint }}><X size={18} /></button>
          </div>
        </div>
      )}
      <nav className="mz-nav md:hidden fixed bottom-0 inset-x-0 z-30 flex items-center justify-around px-2 pt-1.5" style={{ background: C.surface + "f0", backdropFilter: "blur(16px)", borderTop: `1px solid ${C.line}`, paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
        {BOTTOM.map(k => {
          const n = NAV.find(x => x.key === k);
          if (k === "create") return <button key={k} onClick={() => setCreateOpen(true)} className="rounded-2xl flex items-center justify-center -mt-1 active:scale-90 transition" style={{ width: 46, height: 46, backgroundImage: GBRAND, boxShadow: SH.glow }}><Plus size={26} color="#fff" /></button>;
          const active = tab === k;
          return <button key={k} onClick={() => goTab(k)} className="relative flex flex-col items-center gap-1 px-3 py-1 active:scale-90" style={{ color: active ? C.accent : C.faint }}>{k === "profile" ? <Avatar id={ME} size={26} /> : <n.icon size={25} fill={active && k === "home" ? C.accent : "none"} />}{active && k !== "profile" && <span className="absolute -bottom-0.5 rounded-full" style={{ width: 4, height: 4, backgroundImage: GBRAND }} />}{n.badge > 0 && <span className="absolute top-0 right-1.5 rounded-full text-white flex items-center justify-center" style={{ minWidth: 16, height: 16, padding: "0 4px", background: C.like, fontFamily: MONO, fontSize: 10, fontWeight: 700 }}>{n.badge > 9 ? "9+" : n.badge}</span>}</button>;
        })}
      </nav>

      <audio ref={music.audioElRef} onEnded={() => music.setIsPlaying(false)} style={{ display: "none" }} />
      {session && hasSupabase && <Suspense fallback={null}><CallLayer ref={chat.callRef} me={ME} enabled={true} /></Suspense>}
      {showOnboarding && <Suspense fallback={null}><Onboarding suggested={suggested} following={following} onToggleFollow={toggleFollow} onUploadAvatar={onChangeAvatar} onSaveProfile={onSaveOnboardProfile} onFinish={onFinishOnboarding} /></Suspense>}
      {games.buraOpen && <Suspense fallback={null}><BuraGame onExit={() => games.setBuraOpen(false)} /></Suspense>}
      {games.nardiOpen && <Suspense fallback={null}><NardiGame onExit={() => games.setNardiOpen(false)} /></Suspense>}
      {games.chessOpen && <Suspense fallback={null}><ChessGame onExit={() => games.setChessOpen(false)} /></Suspense>}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} nav={NAV} onNav={goTab} onCreate={() => { setDrawerOpen(false); setCreateOpen(true); }} flash={(t) => { setDrawerOpen(false); flash(t); }} tab={tab} mode={mode} setMode={setMode} xp={xp} followers={followerCounts[ME] != null ? followerCounts[ME] : (USERS[ME] ? USERS[ME].followers : 0)} following={following.length} onSettings={() => { setDrawerOpen(false); setSettingsOpen(true); }} onSignOut={() => { setDrawerOpen(false); authApi.signOut().catch(dbErr("გასვლა")); }} />
      {createOpen && <CreateSheet onClose={() => setCreateOpen(false)} onPost={onPost} live={live} taggable={following} myGroups={groups.groups.filter(g => g.joined)} onGroupPost={groups.onGroupPost} onUpload={(f, onProgress) => uploadImage(f, "posts", onProgress)} onUploadVideo={(f, onProgress) => storageApi.upload(f, "posts", onProgress)} />}
      {stories.story && <StoryViewer story={stories.story} onClose={() => stories.setStoryId(null)} onDone={stories.markSeen} flash={flash} onReport={admin.onReport} />}
      {listView && (listView.type === "viewers"
        ? <ProfileViewers onOpenProfile={openProfile} onClose={() => setListView(null)} />
        : <FollowList view={listView} following={following} onToggleFollow={toggleFollow} onOpenProfile={openProfile} onClose={() => setListView(null)} />)}
      {feed.tagView && <div className="slidein fixed inset-0 z-50 overflow-y-auto" style={{ background: C.paper }}>
        <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3" style={{ background: C.paper, borderBottom: `1px solid ${C.line}` }}><button onClick={() => feed.setTagView(null)} aria-label={t("a11y.back")} className="active:scale-90"><ArrowLeft size={22} style={{ color: C.ink }} /></button><div className="font-bold text-[17px]" style={{ color: C.ink, fontFamily: DISPLAY }}>#{feed.tagView}</div></div>
        {(() => { const tp = feed.posts.filter(p => !p.groupId && p.text && p.text.toLowerCase().includes("#" + feed.tagView.toLowerCase())).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)); return tp.length ? <div className="stagger space-y-4 p-4">{tp.map(p => <PostCard key={p.id} post={p} {...feedProps} />)}</div> : <Empty icon={Hash} t="ამ ჰეშთეგით პოსტი ვერ მოიძებნა" s={"#" + feed.tagView} />; })()}
      </div>}
      {feed.postView && (() => { const p = feed.posts.find(x => x.id === feed.postView); return <div className="slidein fixed inset-0 z-50 overflow-y-auto" style={{ background: C.paper }}>
        <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3" style={{ background: C.paper, borderBottom: `1px solid ${C.line}` }}><button onClick={() => { feed.setPostView(null); feed.setPostViewCommentId(null); }} aria-label={t("a11y.back")} className="active:scale-90"><ArrowLeft size={22} style={{ color: C.ink }} /></button><div className="font-bold text-[17px]" style={{ color: C.ink, fontFamily: DISPLAY }}>პოსტი</div></div>
        {p ? <div className="p-4"><PostCard post={p} {...feedProps} highlightCommentId={feed.postViewCommentId} /></div> : <Empty icon={MessageCircle} t="პოსტი მიუწვდომელია" s="შესაძლოა წაიშალა" />}
      </div>; })()}
      {settingsOpen && <Suspense fallback={null}><SettingsView settings={settings} setSettings={setSettings} meProfile={meProfile} setMeProfile={setMeProfile} mode={mode} setMode={setMode} onClose={() => setSettingsOpen(false)} flash={flash} onUploadAvatar={onChangeAvatar} pushState={pushState} onTogglePush={onTogglePush} blockedIds={blockedIds} mutedIds={mutedIds} onUnblock={onUnblock} onUnmute={onUnmute} onOpenProfile={openProfile} following={following} closeFriends={closeFriends} onToggleCloseFriend={onToggleCloseFriend} onExportData={onExportData} onDeleteAccount={onDeleteAccount} birthday={USERS[ME] ? USERS[ME].birthday : null} onSetBirthday={onSetBirthday} showProfileVisits={me.showProfileVisits !== false} onToggleShowProfileVisits={onToggleShowProfileVisits} onSignOut={() => { setSettingsOpen(false); authApi.signOut().catch(dbErr("გასვლა")); }} referralCode={referrals.referralCode} invitedCount={referrals.invitedCount} invitedUsers={referrals.invitedUsers} inviteLink={referrals.inviteLink} onCopyInviteLink={referrals.copyInviteLink} locSharing={locationSharing.sharing} locBusy={locationSharing.busy} locLastSharedAt={locationSharing.lastSharedAt} onStartLocationShare={locationSharing.start} onStopLocationShare={locationSharing.stop} /></Suspense>}
      {stories.storyEditorOpen && <StoryEditor onClose={() => stories.setStoryEditorOpen(false)} onShare={stories.onAddStory} live={live} onUpload={(f, onProgress) => uploadImage(f, "stories", onProgress)} isAdmin={me.admin} />}
      {reelsHook.reelCreateOpen && <ReelCreate onClose={() => reelsHook.setReelCreateOpen(false)} onPublish={reelsHook.onPublishReel} onUpload={(f, onProgress) => storageApi.upload(f, "reels", onProgress)} onUploadThumb={(f) => uploadImage(f, "reels")} flash={flash} />}
      {reelsHook.reelComments && <ReelComments data={reelsHook.reelComments} onClose={() => reelsHook.setReelComments(null)} onAdd={reelsHook.addReelComment} />}
      {searchOpen && <Suspense fallback={null}><SearchView posts={feed.posts} onOpenProfile={openProfile} onTag={onTag} onClose={() => setSearchOpen(false)} runSearch={feed.runSearch} onOpenFilm={(f) => { onOpenSearchFilm(f); setSearchOpen(false); }} onOpenSong={(s) => { onOpenSearchSong(s); setSearchOpen(false); }} onOpenListing={(l) => { onOpenSearchListing(l); setSearchOpen(false); }} onOpenGroup={(g) => { onOpenSearchGroup(g); setSearchOpen(false); }} onOpenThread={(th) => { onOpenSearchThread(th); setSearchOpen(false); }} /></Suspense>}
      {toast && <div role="status" aria-live="polite" className="fixed left-1/2 z-[80] px-4 py-2.5 rounded-full text-sm font-bold text-white" style={{ bottom: 92, background: DARK ? C.surfaceMuted : C.ink, border: DARK ? `1px solid ${C.line}` : "none", boxShadow: SH.pop, animation: "pin .3s cubic-bezier(.22,.61,.36,1) both" }}>{toast}</div>}
    </div>
  );
}
