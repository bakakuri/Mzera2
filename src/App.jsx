import {
  useState, useEffect, useRef, Home, Search, Compass, PlusSquare, Send, Bell, User, Shield, Heart, MessageCircle, MessageSquare, Bookmark, MoreHorizontal, X, ArrowLeft, Hash, TrendingUp, Check, Trash2, Flag, Camera, Settings, AlertTriangle, ImageIcon, MapPin, Map, Link2, ShieldCheck, Plus, Minus, Menu, LogOut, HelpCircle, ChevronRight, Zap, Sun, Moon, ShoppingBag, Tag, Star, Eye, Navigation, Users, Film, Mic, Play, Pause, Smile, FileText, Download, UserPlus, Trophy, Upload, Volume2, VolumeX, Pencil, CornerUpLeft, Copy, Reply, authApi, profilesApi, postsApi, reactionsApi, commentsApi, followsApi, chatApi, notifsApi, storageApi, storiesApi, reelsApi, marketApi, groupsApi, eventsApi, forumApi, highlightsApi, presenceApi, locationsApi, pollsApi, questsApi, xpApi, adminApi, pushApi, hasSupabase, PAL, DARK, C, GBRAND, SH, card, DISPLAY, BODY, MONO, Mono, GRADS, hashIdx, img, catColor, FALLBACK_USER, _users, USERS, ME, fmtN, computeTrends, REPLIES, MARKET_CATS, FORUM_CATS, Pic, Avatar, Dot, Name, Handle, IconBtn, Pill, Wordmark, Title, Chips, renderText, Empty, ThemeToggle, REACTIONS, StoryRow, MiniPost, NewThread, Stars, Checkout, NewListing, GroupAvatar, waveOf, dl, VoiceMsg, DocMsg, EMOJIS, EmojiPanel, PeoplePicker, convMembers, convIsGroup, msgPreview, FollowBtn, FollowList, timeAgo, mergeProfile, mapDbPost, msgClock, mapDbMsg, toDbMsg, mapDbNotif, resolveImg, hydrateAuthors, mapDbStories, mapDbReel, mapDbThread, KA_MONS, mapDbListing, mapDbReview, mapDbGroup, mapDbEvent, ConfigError, LoadingScreen, AuthScreen, HighlightCreate, HighlightView, ReelComments, pushNotif, ensureNotifPerm, NOTIF_VERB, levelInfo, kfmt, RSVP_OPTS, ReelCard, ReelCreate, GroupPost, MiniMap, Switch, SettingsSection, SettingsRow, FILTERS, STORY_STICKERS, setTheme, setME, compressImage,
} from "./ui/core";
import { PostCard, StoryViewer, CreateSheet, Explore, StoryEditor } from "./ui/feed";
import { Messages } from "./ui/chat";
import { Forum, Market, MapView, Reels, Groups } from "./ui/discover";
import { Profile, Notifications, Admin, Drawer, OnlinePage, Progress, SettingsView, Leaderboard, SearchView } from "./ui/social";
import { CallLayer } from "./ui/call";
import { registerPush, unregisterPush, currentPushState, pushSupported } from "./lib/push";

export default function App() {
  const [mode, setMode] = useState("light");
  setTheme(mode === "dark");

  const [tab, setTab] = useState("home");
  const [posts, setPosts] = useState([]);
  const [feedCursor, setFeedCursor] = useState(null);
  const [feedMore, setFeedMore] = useState(true);
  const [feedLoadingMore, setFeedLoadingMore] = useState(false);
  const feedSentinelRef = useRef(null);
  const [reelsCursor, setReelsCursor] = useState(null);
  const [reelsMore, setReelsMore] = useState(true);
  const [reelsLoadingMore, setReelsLoadingMore] = useState(false);
  const reelsSentinelRef = useRef(null);
  const [listCursor, setListCursor] = useState(null);
  const [listMore, setListMore] = useState(true);
  const [listLoadingMore, setListLoadingMore] = useState(false);
  const listSentinelRef = useRef(null);
  const [stories, setStories] = useState([]);
  const [convos, setConvos] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [onlineIds, setOnlineIds] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [postCount, setPostCount] = useState(0);
  const [reports, setReports] = useState([]);
  const [threads, setThreads] = useState([]);
  const [listings, setListings] = useState([]);
  const [groups, setGroups] = useState([]);
  const [pendingGroup, setPendingGroup] = useState(null);
  const [installEvt, setInstallEvt] = useState(null);
  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); if (!window.matchMedia("(display-mode: standalone)").matches) setInstallEvt(e); };
    const onInstalled = () => setInstallEvt(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);
  const doInstall = async () => { if (!installEvt) return; const e = installEvt; setInstallEvt(null); try { e.prompt(); await e.userChoice; } catch (err) {} };
  useEffect(() => {
    const measure = () => {
      const h = document.querySelector("header.mz-hdr"); const n = document.querySelector("nav.mz-nav");
      const root = document.documentElement;
      if (h) root.style.setProperty("--mz-hdr", h.offsetHeight + "px");
      if (n) root.style.setProperty("--mz-nav", n.offsetHeight + "px");
    };
    measure(); const t1 = setTimeout(measure, 200); const t2 = setTimeout(measure, 800);
    window.addEventListener("resize", measure);
    return () => { window.removeEventListener("resize", measure); clearTimeout(t1); clearTimeout(t2); };
  }, []);
  const [events, setEvents] = useState([]);
  const [reels, setReels] = useState([]);
  const [xp, setXp] = useState(120);
  const [openConvoId, setOpenConvoId] = useState(null);
  const [peerReadAt, setPeerReadAt] = useState(null);
  const [chatReactions, setChatReactions] = useState({});
  const [following, setFollowing] = useState([]);
  const [followerCounts, setFollowerCounts] = useState({});
  const [listView, setListView] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({ private: false, activity: true, showLocation: true, nLikes: true, nComments: true, nFollows: true, nMessages: true, lang: "ka" });
  const [meProfile, setMeProfile] = useState({ name: "", bio: "", avatar: null, cover: null });
  const [createOpen, setCreateOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [storyId, setStoryId] = useState(null);
  const [storyEditorOpen, setStoryEditorOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [session, setSession] = useState(undefined);
  const [pushState, setPushState] = useState("off");
  useEffect(() => {
    if (!session || !hasSupabase) return;
    let cancelled = false;
    currentPushState().then(st => {
      if (cancelled) return;
      setPushState(st);
      if (st === "on" && typeof Notification !== "undefined" && Notification.permission === "granted") registerPush(pushApi).catch(() => {});
    });
    return () => { cancelled = true; };
  }, [session]);
  const onTogglePush = async () => {
    if (pushState === "on") { await unregisterPush(pushApi); setPushState("off"); flash("Push გამოირთო"); return; }
    const res = await registerPush(pushApi);
    if (res.ok) { setPushState("on"); flash("Push შეტყობინებები ჩაირთო 🔔"); }
    else if (res.reason === "denied") { setPushState("denied"); flash("ბრაუზერმა დაბლოკა — ჩართე პარამეტრებიდან"); }
    else if (res.reason === "unsupported") { setPushState("unsupported"); flash("ამ ბრაუზერს არ აქვს მხარდაჭერა"); }
    else flash("ვერ ჩაირთო, სცადე თავიდან");
  };
  const [ready, setReady] = useState(false);
  const [reelCreateOpen, setReelCreateOpen] = useState(false);
  const [reelComments, setReelComments] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const [activeTag, setActiveTag] = useState(null);
  const [tagPosts, setTagPosts] = useState([]);
  const [tagLoading, setTagLoading] = useState(false);
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
        mergeProfile(prof); setME(uid);
        if (prof && typeof prof.xp === "number") setXp(prof.xp);
        setMeProfile({ name: USERS[ME].name, bio: USERS[ME].bio, avatar: USERS[ME].avatar, cover: USERS[ME].cover });
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
      let paged = true;
      try {
        feed = await postsApi.feedPage(null, 12);
      } catch (embErr) {
        paged = false;
        feed = await postsApi.feedPlain();
        const aids = [...new Set(feed.map(p => p.author_id).filter(Boolean))];
        if (aids.length) { try { const profs = await profilesApi.byIds(aids); const pm = {}; profs.forEach(pr => { pm[pr.id] = pr; }); feed.forEach(p => { p.author = pm[p.author_id]; }); } catch (e) {} }
      }
      const mapped = feed.map(mapDbPost);
      const ids = mapped.map(p => p.id);
      let savedIds = new Set();
      try { savedIds = new Set(await postsApi.mySaveIds()); } catch (e) {}
      mapped.forEach(p => { if (savedIds.has(p.id)) p.savedByMe = true; });
      if (ids.length) {
        try { const rx = await reactionsApi.forPosts(ids); const cnt = {}, mineM = {}; rx.forEach(r => { cnt[r.post_id] = (cnt[r.post_id] || 0) + 1; if (r.user_id === ME) mineM[r.post_id] = r.emoji; }); mapped.forEach(p => { p.likes = cnt[p.id] || 0; if (mineM[p.id]) { p.likedByMe = true; p.reaction = mineM[p.id]; } }); } catch (e) {}
        try { const cms = await commentsApi.forPosts(ids); const by = {}; cms.forEach(c => { if (c.author) mergeProfile(c.author); (by[c.post_id] = by[c.post_id] || []).push({ id: c.id, authorId: c.author_id, text: c.text, time: timeAgo(c.created_at) }); }); mapped.forEach(p => { if (by[p.id]) p.comments = by[p.id]; }); } catch (e) {}
      }
      setPosts(mapped);
      setFeedCursor(mapped.length ? mapped[mapped.length - 1].createdAt : null);
      setFeedMore(paged && mapped.length >= 12);
      try { const sv = await postsApi.mySaves(); sv.forEach(r => { if (r.author) mergeProfile(r.author); }); setSavedPosts(sv.map(r => ({ ...mapDbPost(r), savedByMe: true }))); } catch (e) {}
    } catch (e) { console.error("feed:", e); setDbError("Feed: " + (e.message || JSON.stringify(e)) + (e.hint ? " · hint: " + e.hint : "") + (e.code ? " · code: " + e.code : "")); }
  };
  const loadMorePosts = async () => {
    if (feedLoadingMore || !feedMore || !feedCursor || !hasSupabase) return;
    setFeedLoadingMore(true);
    try {
      const feed = await postsApi.feedPage(feedCursor, 12);
      if (!feed.length) { setFeedMore(false); return; }
      const mapped = feed.map(mapDbPost);
      const ids = mapped.map(p => p.id);
      try { const rx = await reactionsApi.forPosts(ids); const cnt = {}, mineM = {}; rx.forEach(r => { cnt[r.post_id] = (cnt[r.post_id] || 0) + 1; if (r.user_id === ME) mineM[r.post_id] = r.emoji; }); mapped.forEach(p => { p.likes = cnt[p.id] || 0; if (mineM[p.id]) { p.likedByMe = true; p.reaction = mineM[p.id]; } }); } catch (e) {}
      try { const cms = await commentsApi.forPosts(ids); const by = {}; cms.forEach(c => { if (c.author) mergeProfile(c.author); (by[c.post_id] = by[c.post_id] || []).push({ id: c.id, authorId: c.author_id, text: c.text, time: timeAgo(c.created_at) }); }); mapped.forEach(p => { if (by[p.id]) p.comments = by[p.id]; }); } catch (e) {}
      try { const savedIds = new Set(await postsApi.mySaveIds()); mapped.forEach(p => { if (savedIds.has(p.id)) p.savedByMe = true; }); } catch (e) {}
      setPosts(prev => { const seen = new Set(prev.map(p => p.id)); return [...prev, ...mapped.filter(p => !seen.has(p.id))]; });
      setFeedCursor(mapped[mapped.length - 1].createdAt);
      setFeedMore(feed.length >= 12);
    } catch (e) { /* keep silent, sentinel will retry on next intersect */ }
    finally { setFeedLoadingMore(false); }
  };
  useEffect(() => {
    const el = feedSentinelRef.current;
    if (!el || tab !== "home" || !feedMore) return;
    const obs = new IntersectionObserver((entries) => { if (entries[0] && entries[0].isIntersecting) loadMorePosts(); }, { rootMargin: "700px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [tab, feedMore, feedCursor, feedLoadingMore]);
  useEffect(() => {
    const el = reelsSentinelRef.current;
    if (!el || tab !== "reels" || !reelsMore) return;
    const obs = new IntersectionObserver((e) => { if (e[0] && e[0].isIntersecting) loadMoreReels(); }, { rootMargin: "1000px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [tab, reelsMore, reelsCursor, reelsLoadingMore]);
  useEffect(() => {
    const el = listSentinelRef.current;
    if (!el || tab !== "market" || !listMore) return;
    const obs = new IntersectionObserver((e) => { if (e[0] && e[0].isIntersecting) loadMoreListings(); }, { rootMargin: "700px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [tab, listMore, listCursor, listLoadingMore]);
  useEffect(() => {
    if (!activeTag || !hasSupabase) { setTagPosts([]); return; }
    let cancelled = false;
    setTagLoading(true);
    postsApi.byHashtag(activeTag, 40)
      .then(rows => { if (!cancelled) setTagPosts(rows.map(mapDbPost)); })
      .catch(() => { if (!cancelled) setTagPosts([]); })
      .finally(() => { if (!cancelled) setTagLoading(false); });
    return () => { cancelled = true; };
  }, [activeTag]);
  const runSearch = async (term) => {
    const q = (term || "").trim();
    if (!q || !hasSupabase) return { people: [], posts: [] };
    let people = [], foundPosts = [];
    try { const profs = await profilesApi.search(q, 20); profs.forEach(p => mergeProfile(p)); people = profs.filter(p => p.id !== ME).map(p => USERS[p.id]).filter(Boolean); } catch (e) {}
    try { const rows = await postsApi.search(q, 20); foundPosts = rows.map(mapDbPost); } catch (e) {}
    return { people, posts: foundPosts };
  };
  const reloadFeed = () => loadFeed();
  const loadStories = async () => { if (!hasSupabase) return; try { let rows; try { rows = await storiesApi.list(); } catch (em) { rows = await hydrateAuthors(await storiesApi.listPlain(), "author_id", "author"); } setStories(mapDbStories(rows)); } catch (e) { console.error("stories:", e); setDbError("stories: " + (e.message || JSON.stringify(e)) + (e.hint ? " · hint: " + e.hint : "") + (e.code ? " · code: " + e.code : "")); } };
  const loadReels = async () => { if (!hasSupabase) return; try { let rows; let paged = true; try { rows = await reelsApi.listPage(null, 6); } catch (em) { paged = false; rows = await hydrateAuthors(await reelsApi.listPlain(), "author_id", "author"); } let liked = new Set(); try { liked = new Set((await reelsApi.mine()).map(x => x.reel_id)); } catch (e) {} let saved = new Set(); try { saved = new Set((await reelsApi.mySaves()).map(x => x.reel_id)); } catch (e) {} const mapped = rows.map(r => mapDbReel(r, liked, saved)); setReels(mapped); setReelsCursor(mapped.length ? mapped[mapped.length - 1].createdAt : null); setReelsMore(paged && mapped.length >= 6); } catch (e) { console.error("reels:", e); setDbError("reels: " + (e.message || JSON.stringify(e)) + (e.hint ? " · hint: " + e.hint : "") + (e.code ? " · code: " + e.code : "")); } };
  const loadMoreReels = async () => {
    if (reelsLoadingMore || !reelsMore || !reelsCursor || !hasSupabase) return;
    setReelsLoadingMore(true);
    try {
      const rows = await reelsApi.listPage(reelsCursor, 6);
      if (!rows.length) { setReelsMore(false); return; }
      let liked = new Set(); try { liked = new Set((await reelsApi.mine()).map(x => x.reel_id)); } catch (e) {}
      let saved = new Set(); try { saved = new Set((await reelsApi.mySaves()).map(x => x.reel_id)); } catch (e) {}
      const mapped = rows.map(r => mapDbReel(r, liked, saved));
      setReels(prev => { const seen = new Set(prev.map(r => r.id)); return [...prev, ...mapped.filter(r => !seen.has(r.id))]; });
      setReelsCursor(mapped[mapped.length - 1].createdAt);
      setReelsMore(rows.length >= 6);
    } catch (e) {} finally { setReelsLoadingMore(false); }
  };
  const loadListings = async () => { if (!hasSupabase) return; try { let rows; let paged = true; try { rows = await marketApi.listingsPage(null, 10); } catch (em) { paged = false; rows = await hydrateAuthors(await marketApi.listingsPlain(), "seller_id", "seller"); } const mapped = rows.map(mapDbListing); setListings(mapped); setListCursor(mapped.length ? mapped[mapped.length - 1].createdAt : null); setListMore(paged && mapped.length >= 10); } catch (e) { console.error("listings:", e); setDbError("listings: " + (e.message || JSON.stringify(e)) + (e.hint ? " · hint: " + e.hint : "") + (e.code ? " · code: " + e.code : "")); } };
  const loadMoreListings = async () => {
    if (listLoadingMore || !listMore || !listCursor || !hasSupabase) return;
    setListLoadingMore(true);
    try {
      const rows = await marketApi.listingsPage(listCursor, 10);
      if (!rows.length) { setListMore(false); return; }
      const mapped = rows.map(mapDbListing);
      setListings(prev => { const seen = new Set(prev.map(l => l.id)); return [...prev, ...mapped.filter(l => !seen.has(l.id))]; });
      setListCursor(mapped[mapped.length - 1].createdAt);
      setListMore(rows.length >= 10);
    } catch (e) {} finally { setListLoadingMore(false); }
  };
  const loadGroups = async () => { if (!hasSupabase || !session) return; try { const rows = await groupsApi.list(); setGroups(rows.map(r => mapDbGroup(r, session.user.id))); } catch (e) { console.error("groups:", e); setDbError("groups: " + (e.message || JSON.stringify(e)) + (e.hint ? " · hint: " + e.hint : "") + (e.code ? " · code: " + e.code : "")); } };
  const loadEvents = async () => { if (!hasSupabase || !session) return; try { const rows = await eventsApi.list(); setEvents(rows.map(r => mapDbEvent(r, session.user.id))); } catch (e) { console.error("events:", e); setDbError("events: " + (e.message || JSON.stringify(e)) + (e.hint ? " · hint: " + e.hint : "") + (e.code ? " · code: " + e.code : "")); } };
  const loadThreads = async () => { if (!hasSupabase || !session) return; try { const rows = await forumApi.list(); setThreads(rows.map(r => mapDbThread(r, session.user.id))); } catch (e) { console.error("forum:", e); setDbError("forum: " + (e.message || JSON.stringify(e)) + (e.hint ? " · hint: " + e.hint : "") + (e.code ? " · code: " + e.code : "")); } };
  const uploadImage = async (file, folder = "posts") => await storageApi.upload(await compressImage(file), folder);

  const openRef = useRef(openConvoId);
  const chanRef = useRef([]);
  const callRef = useRef(null);
  const startCall = (uid, video) => { if (callRef.current) callRef.current.startCall({ id: uid, name: (USERS[uid] && USERS[uid].name) || "" }, video); };
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
  useEffect(() => {
    if (!openConvoId || !hasSupabase) { setPeerReadAt(null); setChatReactions({}); return; }
    let cancelled = false;
    chatApi.peerRead(openConvoId).then(ts => { if (!cancelled) setPeerReadAt(ts); }).catch(() => {});
    const conv = convos.find(c => c.id === openConvoId);
    const ids = conv ? conv.messages.map(m => m.id).filter(Boolean) : [];
    if (ids.length) chatApi.reactionsFor(ids).then(rows => { if (cancelled) return; const map = {}; rows.forEach(r => { (map[r.message_id] = map[r.message_id] || {})[r.user_id] = r.emoji; }); setChatReactions(map); }).catch(() => {});
    else setChatReactions({});
    return () => { cancelled = true; };
  }, [openConvoId]);
  const onMarkRead = (cid) => { if (hasSupabase) chatApi.markRead(cid).catch(() => {}); };
  const onReactMsg = (messageId, emoji) => { if (hasSupabase) chatApi.react(messageId, emoji).catch(dbErr("რეაქცია")); };

  const convIdsKey = convos.map(c => c.id).join(",");
  useEffect(() => {
    chanRef.current.forEach(ch => { try { ch.unsubscribe(); } catch (e) {} });
    chanRef.current = convos.map(c => chatApi.subscribe(c.id, (evt, row, oldRow) => {
      if (evt === "INSERT") {
        const m = mapDbMsg(row);
        if (!m.fromMe && openRef.current !== c.id) { const other = USERS[m.from]; pushNotif((other && other.name) ? other.name : "ახალი შეტყობინება", m.type === "text" ? m.text : m.type === "image" ? "📷 ფოტო" : m.type === "voice" ? "🎤 ხმოვანი" : m.type === "doc" ? "📄 ფაილი" : m.type === "location" ? "📍 ლოკაცია" : "ახალი შეტყობინება"); }
        setConvos(cs => cs.map(x => {
          if (x.id !== c.id) return x;
          if (x.messages.some(z => z.id === m.id)) return x;
          const isOpen = openRef.current === c.id;
          return { ...x, messages: [...x.messages, m], unread: (isOpen || m.fromMe) ? x.unread : x.unread + 1 };
        }));
      } else if (evt === "UPDATE") {
        const m = mapDbMsg(row);
        setConvos(cs => cs.map(x => x.id !== c.id ? x : { ...x, messages: x.messages.map(z => z.id === m.id ? { ...z, ...m } : z) }));
      } else if (evt === "DELETE") {
        const did = oldRow && oldRow.id;
        if (did) setConvos(cs => cs.map(x => x.id !== c.id ? x : { ...x, messages: x.messages.filter(z => z.id !== did) }));
      }
    }));
    return () => { chanRef.current.forEach(ch => { try { ch.unsubscribe(); } catch (e) {} }); chanRef.current = []; };
  }, [live, convIdsKey]);

  useEffect(() => {
    if (!session) return;
    ensureNotifPerm();
    const ch = notifsApi.subscribe(session.user.id, (row) => { loadNotifs(); const who = USERS[row.from_id]; pushNotif((who && who.name) ? who.name : "mzera 🔔", NOTIF_VERB[row.type] || "ახალი აქტივობა"); });
    return () => { try { ch.unsubscribe(); } catch (e) {} };
  }, [live, session]);

  useEffect(() => {
    if (!session) return;
    const ch = presenceApi.join(session.user.id, async (ids) => {
      setOnlineIds(ids);
      const missing = ids.filter(id => USERS[id].id !== id);
      if (missing.length) { try { (await profilesApi.byIds(missing)).forEach(mergeProfile); setOnlineIds([...ids]); } catch (e) {} }
    });
    return () => { try { ch.unsubscribe(); } catch (e) {} };
  }, [session]);

  useEffect(() => {
    if (!session) return;
    (async () => {
      try { const us = await profilesApi.all(50); us.forEach(mergeProfile); setAllUsers(us); } catch (e) {}
      try { setUserCount(await profilesApi.count()); } catch (e) {}
      try { setPostCount(await postsApi.count()); } catch (e) {}
    })();
  }, [session]);

  useEffect(() => {
    const pid = profileId || ME;
    if (!pid || !hasSupabase || (tab !== "profile" && !profileId)) return;
    profilesApi.stats(pid).then(s => { mergeProfile(s); setFollowerCounts(fc => ({ ...fc, [pid]: s.follower_count ?? 0 })); }).catch(() => {});
  }, [profileId, tab]);

  const unreadMsgs = convos.reduce((a, c) => a + c.unread, 0);
  const unreadNotifs = notifs.filter(n => !n.read).length;
  const onlineCount = onlineIds.filter(id => id !== ME && USERS[id].id === id).length;
  const openReports = reports.filter(r => r.status === "open").length;
  const flash = (t) => { setToast(t); setTimeout(() => setToast(null), 1800); };
  const gainXp = (n) => { setXp(x => x + n); if (hasSupabase) xpApi.add(n).catch(() => {}); };
  const [questData, setQuestData] = useState(null);
  const loadQuests = () => { if (!hasSupabase) return; questsApi.today().then(setQuestData).catch(() => {}); };
  useEffect(() => { if (tab === "progress") loadQuests(); }, [tab]);
  const onClaimQuest = (quest, amount) => {
    questsApi.claim(quest, amount).then(ok => {
      if (ok) { setXp(x => x + amount); setQuestData(q => q ? { ...q, claimed: [...q.claimed, quest] } : q); flash(`+${amount} XP 🎉`); }
      else setQuestData(q => q ? { ...q, claimed: q.claimed.includes(quest) ? q.claimed : [...q.claimed, quest] } : q);
    }).catch(dbErr("ჯილდო"));
  };
  const isFollowing = (id) => following.includes(id);
  const toggleFollow = (id) => { const now = following.includes(id); setFollowing(f => now ? f.filter(x => x !== id) : [...f, id]); setFollowerCounts(fc => ({ ...fc, [id]: (fc[id] != null ? fc[id] : USERS[id].followers) + (now ? -1 : 1) })); if (!now) gainXp(2); followsApi.toggle(id).catch(dbErr("გამოწერა")); };

  const onLike = (id) => setPosts(ps => ps.map(p => p.id === id ? { ...p, likedByMe: !p.likedByMe, likes: p.likes + (p.likedByMe ? -1 : 1) } : p));
  const onReact = (id, emoji) => { setPosts(ps => ps.map(p => { if (p.id !== id) return p; if (p.reaction === emoji) return { ...p, reaction: null, likedByMe: false, likes: p.likes - 1 }; return { ...p, reaction: emoji, likedByMe: true, likes: p.likedByMe ? p.likes : p.likes + 1 }; })); reactionsApi.toggle(id, emoji).catch(dbErr("რეაქცია")); };
  const onPollVote = (id, idx) => { setPosts(ps => ps.map(p => { if (p.id !== id || !p.poll || p.poll.voted != null) return p; const options = p.poll.options.map((o, i) => i === idx ? { ...o, votes: o.votes + 1 } : o); return { ...p, poll: { ...p.poll, options, voted: idx } }; })); pollsApi.vote(id, idx).catch(dbErr("ხმის მიცემა")); };
  const onSave = (id) => {
    const wasSaved = ((posts.find(p => p.id === id) || savedPosts.find(p => p.id === id) || {}).savedByMe) || false;
    const nowSaved = !wasSaved;
    setPosts(ps => ps.map(p => p.id === id ? { ...p, savedByMe: nowSaved } : p));
    setSavedPosts(sp => { if (!nowSaved) return sp.filter(p => p.id !== id); if (sp.find(p => p.id === id)) return sp; const src = posts.find(p => p.id === id); return src ? [{ ...src, savedByMe: true }, ...sp] : sp; });
    postsApi.toggleSave(id).catch(dbErr("შენახვა"));
  };
  const onComment = (id, text) => { const tempId = "c" + Date.now(); setPosts(ps => ps.map(p => p.id === id ? { ...p, comments: [...p.comments, { id: tempId, authorId: ME, text, time: "ახლა" }] } : p)); gainXp(5); commentsApi.add(id, text).then(c => { if (c && c.id) setPosts(ps => ps.map(p => p.id === id ? { ...p, comments: p.comments.map(cm => cm.id === tempId ? { ...cm, id: c.id } : cm) } : p)); }).catch(dbErr("კომენტარი")); };
  const onEditPost = (id, text) => { setPosts(ps => ps.map(p => p.id === id ? { ...p, text } : p)); setSavedPosts(sp => sp.map(p => p.id === id ? { ...p, text } : p)); postsApi.update(id, { text }).catch(dbErr("პოსტის რედაქტირება")); flash("პოსტი განახლდა ✓"); };
  const onDeletePost = (id) => { setPosts(ps => ps.filter(p => p.id !== id)); setSavedPosts(sp => sp.filter(p => p.id !== id)); postsApi.remove(id).catch(dbErr("პოსტის წაშლა")); flash("პოსტი წაიშალა"); };
  const onEditComment = (postId, commentId, text) => { setPosts(ps => ps.map(p => p.id === postId ? { ...p, comments: p.comments.map(c => c.id === commentId ? { ...c, text } : c) } : p)); commentsApi.update(commentId, text).catch(dbErr("კომენტარის რედაქტირება")); };
  const onDeleteComment = (postId, commentId) => { setPosts(ps => ps.map(p => p.id === postId ? { ...p, comments: p.comments.filter(c => c.id !== commentId) } : p)); commentsApi.remove(commentId).catch(dbErr("კომენტარის წაშლა")); };
  const onReport = (id) => { setReports(r => [{ id: "r" + Date.now(), type: "post", targetId: id, reason: "მომხმარებლის რეპორტი", reporterId: ME, time: "ახლა", status: "open" }, ...r]); flash("გაგზავნილია მოდერაციაში ✓"); };
  const onRemovePost = (id) => { setPosts(ps => ps.filter(p => p.id !== id)); setSavedPosts(sp => sp.filter(p => p.id !== id)); postsApi.remove(id).catch(dbErr("პოსტის წაშლა")); flash("პოსტი წაიშალა"); };
  const onSetVerified = (id, v) => { setAllUsers(us => us.map(u => u.id === id ? { ...u, verified: v } : u)); if (USERS[id].id === id) USERS[id] = { ...USERS[id], verified: v }; profilesApi.update(id, { verified: v }).then(() => flash(v ? "ვერიფიცირებულია ✓" : "ვერიფიკაცია მოიხსნა")).catch(dbErr("ვერიფიკაცია")); };
  const onSetAdmin = (id, v) => { setAllUsers(us => us.map(u => u.id === id ? { ...u, is_admin: v } : u)); if (USERS[id].id === id) USERS[id] = { ...USERS[id], admin: v }; profilesApi.update(id, { is_admin: v }).then(() => flash(v ? "ადმინი დაინიშნა 🛡" : "ადმინი მოიხსნა")).catch(dbErr("admin")); };
  const onBanUser = (id, v) => { setAllUsers(us => us.map(u => u.id === id ? { ...u, banned: v } : u)); adminApi.setBanned(id, v).then(() => flash(v ? "მომხმარებელი დაიბლოკა 🚫" : "ბლოკი მოიხსნა ✓")).catch(dbErr("ბლოკი")); };
  const onGrantXp = (id, amount) => { setAllUsers(us => us.map(u => u.id === id ? { ...u, xp: (u.xp || 0) + amount } : u)); if (id === ME) setXp(x => x + amount); adminApi.grantXp(id, amount).then(() => flash(`+${amount} XP გადაეცა 🎁`)).catch(dbErr("XP")); };
  const onResolve = (id) => setReports(r => r.map(x => x.id === id ? { ...x, status: "resolved" } : x));
  const onTag = (t) => { setActiveTag(t); setProfileId(null); setTab("explore"); };
  const openProfile = (id) => {
    setDrawerOpen(false); setProfileId(id); setTab("profile");
    if (!hasSupabase || !id) return;
    postsApi.byUser(id).then(async rows => {
      const mapped = rows.map(mapDbPost);
      const newIds = mapped.map(p => p.id);
      try { const rx = await reactionsApi.forPosts(newIds); const cnt = {}, mineM = {}; rx.forEach(r => { cnt[r.post_id] = (cnt[r.post_id] || 0) + 1; if (r.user_id === ME) mineM[r.post_id] = r.emoji; }); mapped.forEach(p => { p.likes = cnt[p.id] || 0; if (mineM[p.id]) { p.likedByMe = true; p.reaction = mineM[p.id]; } }); } catch (e) {}
      setPosts(ps => { const have = new Set(ps.map(p => p.id)); const add = mapped.filter(p => !have.has(p.id)); return add.length ? [...ps, ...add] : ps; });
    }).catch(() => {});
  };
  const onPost = (text, pics, poll) => { setCreateOpen(false); gainXp(15); flash("გამოქვეყნდა 🎉"); postsApi.create({ text, images: (pics && pics.length) ? pics.map(resolveImg) : null, poll }).then(reloadFeed).catch(dbErr("პოსტი")); };
  const onSendMsg = (cid, partial) => { chatApi.send(cid, toDbMsg(partial)).catch(dbErr("შეტყობინება")); };
  const onEditMsg = (cid, mid, text) => { setConvos(cs => cs.map(c => c.id === cid ? { ...c, messages: c.messages.map(m => m.id === mid ? { ...m, text, edited: true } : m) } : c)); chatApi.editMessage(mid, text).catch(dbErr("რედაქტირება")); };
  const onDeleteMsg = (cid, mid) => { setConvos(cs => cs.map(c => c.id === cid ? { ...c, messages: c.messages.filter(m => m.id !== mid) } : c)); chatApi.deleteMessage(mid).catch(dbErr("წაშლა")); };
  const onDeleteConvo = (cid) => { setOpenConvoId(null); setConvos(cs => cs.filter(c => c.id !== cid)); chatApi.deleteConversation(cid).then(() => flash("მიმოწერა წაიშალა 🗑️")).catch(dbErr("მიმოწერის წაშლა")); };
  const onReply = (cid) => setConvos(cs => cs.map(c => { if (c.id !== cid) return c; const mem = c.members || (c.withId ? [c.withId] : []); const from = mem.length > 1 ? mem[Math.floor(Math.random() * mem.length)] : mem[0]; return { ...c, messages: [...c.messages, { id: "m" + Date.now() + Math.round(Math.random() * 777), fromMe: false, from, type: "text", text: REPLIES[Math.floor(Math.random() * REPLIES.length)], time: "ახლა" }] }; }));
  const onCreateConvo = (memberIds) => { const members = [...new Set(memberIds)].filter(x => x !== ME); const name = members.length > 1 ? members.map(m => (USERS[m]?.name || "").split(" ")[0]).join(", ") : null; chatApi.createConversation(members, name).then(async (conv) => { await loadConvos(); setOpenConvoId(conv.id); }).catch(dbErr("საუბარი")); return null; };
  const openStory = (id) => setStoryId(id);
  const markSeen = (id) => setStories(s => s.map(x => x.id === id ? { ...x, seen: true } : x));
  const onAddStory = (item) => { if (!item.image && !(item.text && item.text.trim()) && !(item.stickers && item.stickers.length)) { flash("დაამატე ფოტო ან ტექსტი"); return; } setStoryEditorOpen(false); gainXp(8); flash("Story დაემატა ✨"); storiesApi.create({ image_url: item.image || null, filter: item.filter, text: item.text, stickers: item.stickers }).then(loadStories).catch(dbErr("story")); };
  const onThreadReply = (tId, text) => { setThreads(ts => ts.map(t => t.id === tId ? { ...t, replies: [...t.replies, { id: "tr" + Date.now(), authorId: ME, text, time: "ახლა", likes: 0 }] } : t)); forumApi.reply(tId, text).catch(dbErr("პასუხი")); };
  const onThreadVote = (tId) => { setThreads(ts => ts.map(t => t.id === tId ? { ...t, likedByMe: !t.likedByMe, votes: t.votes + (t.likedByMe ? -1 : 1) } : t)); forumApi.toggleVote(tId).catch(dbErr("ხმა")); };
  const onNewThread = (d) => { flash("თემა გამოქვეყნდა 🎉"); forumApi.create({ title: d.title, body: d.body, category: d.cat }).then(loadThreads).catch(dbErr("თემა")); };
  const onListingSave = (id) => setListings(ls => ls.map(l => l.id === id ? { ...l, savedByMe: !l.savedByMe } : l));
  const onNewListing = (d) => { flash("განცხადება დაიდო 🛍️"); marketApi.create({ title: d.title, price: d.price, description: d.desc, category: d.cat, image_url: d.image, video_url: d.video || null, location: "თბილისი" }).then(loadListings).catch(dbErr("განცხადება")); };
  const onMessageUser = (uid) => { setTab("messages"); const ex = convos.find(c => { const m = c.members || (c.withId ? [c.withId] : []); return m.length === 1 && m[0] === uid; }); setOpenConvoId(ex ? ex.id : onCreateConvo([uid])); };
  const onReelLike = (id) => { setReels(rs => rs.map(r => r.id === id ? { ...r, likedByMe: !r.likedByMe } : r)); reelsApi.toggleLike(id).catch(dbErr("reel მოწონება")); };
  const onReelSave = (id) => { setReels(rs => rs.map(r => r.id === id ? { ...r, savedByMe: !r.savedByMe } : r)); reelsApi.toggleSave(id).catch(dbErr("reel შენახვა")); };
  const onReelDelete = (id) => { setReels(rs => rs.filter(r => r.id !== id)); reelsApi.remove(id).then(loadReels).catch(dbErr("reel წაშლა")); };
  const onReelEdit = (id, caption) => { setReels(rs => rs.map(r => r.id === id ? { ...r, caption } : r)); reelsApi.update(id, { caption }).catch(dbErr("reel რედაქტირება")); };
  const onChangeCover = async (file) => { if (!file) return; flash("ქოვერი იტვირთება…"); try { const url = await storageApi.upload(await compressImage(file, 1600, 0.78), "covers"); await profilesApi.update(ME, { cover_url: url }); USERS[ME] = { ...USERS[ME], cover: url }; setMeProfile(p => ({ ...p, cover: url })); flash("ქოვერი განახლდა ✅"); } catch (e) { setDbError("cover: " + (e.message || JSON.stringify(e)) + (e.hint ? " · hint: " + e.hint : "") + (e.code ? " · code: " + e.code : "")); } };
  const onChangeAvatar = async (file) => { if (!file) return; flash("ფოტო იტვირთება…"); try { const url = await storageApi.upload(await compressImage(file, 640, 0.8), "avatars"); await profilesApi.update(ME, { avatar_url: url }); USERS[ME] = { ...USERS[ME], avatar: url }; setMeProfile(p => ({ ...p, avatar: url })); flash("პროფილის ფოტო განახლდა ✅"); } catch (e) { setDbError("avatar: " + (e.message || JSON.stringify(e)) + (e.hint ? " · hint: " + e.hint : "") + (e.code ? " · code: " + e.code : "")); } };
  const openReelComments = async (r) => { setReelComments({ reel: r, list: null }); try { const list = await reelsApi.comments(r.id); list.forEach(c => c.author && mergeProfile(c.author)); setReelComments({ reel: r, list }); } catch (e) { setReelComments(null); setDbError("reel comments: " + (e.message || JSON.stringify(e)) + (e.code ? " · code: " + e.code : "")); } };
  const addReelComment = async (text) => { const rc = reelComments; if (!rc) return; try { const c = await reelsApi.addComment(rc.reel.id, text); if (c.author) mergeProfile(c.author); setReelComments(p => p && p.reel.id === rc.reel.id ? { ...p, list: [...(p.list || []), c] } : p); setReels(rs => rs.map(x => x.id === rc.reel.id ? { ...x, comments: (x.comments || 0) + 1 } : x)); gainXp(3); } catch (e) { setDbError("reel comment: " + (e.message || JSON.stringify(e)) + (e.code ? " · code: " + e.code : "")); } };
  const onPublishReel = ({ video, caption }) => { setReelCreateOpen(false); gainXp(12); flash("Reel გამოქვეყნდა 🎬"); reelsApi.create({ video_url: video, caption, audio: "original audio" }).then(loadReels).catch(dbErr("reel")); };
  const onJoinGroup = (id) => { setGroups(gs => gs.map(g => g.id === id ? { ...g, joined: !g.joined, members: g.members + (g.joined ? -1 : 1) } : g)); const wasJoined = groups.find(g => g.id === id)?.joined; if (!wasJoined) { gainXp(20); flash("ჯგუფს შეუერთდი 🎉 +20 XP"); } groupsApi.toggleJoin(id).catch(dbErr("შეერთება")); };
  const onRsvp = (id, v) => { setEvents(es => es.map(e => e.id === id ? { ...e, going: e.going + ((e.rsvp === "going" ? -1 : 0) + (v === "going" ? 1 : 0)), rsvp: v } : e)); eventsApi.rsvp(id, v).catch(dbErr("rsvp")); };
  const onCreateGroup = (d) => { gainXp(10); groupsApi.create(d).then(loadGroups).then(() => flash("ჯგუფი შეიქმნა 🎉 +10 XP")).catch(dbErr("ჯგუფის შექმნა")); };
  const onCreateEvent = (d) => { gainXp(10); eventsApi.create(d).then(loadEvents).then(() => flash("ივენთი შეიქმნა 🎉 +10 XP")).catch(dbErr("ივენთის შექმნა")); };
  const onGroupPost = (gid, payload) => { gainXp(5); groupsApi.post(gid, payload).then(loadGroups).catch(dbErr("ჯგუფის პოსტი")); };
  const onEditListing = (id, patch) => { setListings(ls => ls.map(l => l.id === id ? { ...l, ...(patch.title != null ? { title: patch.title } : {}), ...(patch.price != null ? { price: patch.price } : {}), ...(patch.description != null ? { desc: patch.description } : {}) } : l)); marketApi.update(id, patch).then(loadListings).then(() => flash("განცხადება განახლდა ✏️")).catch(dbErr("რედაქტირება")); };
  const onDeleteListing = (id) => { setListings(ls => ls.filter(l => l.id !== id)); marketApi.remove(id).then(loadListings).then(() => flash("განცხადება წაიშალა")).catch(dbErr("წაშლა")); };
  const onEditThread = (id, patch) => { setThreads(ts => ts.map(t => t.id === id ? { ...t, ...(patch.title != null ? { title: patch.title } : {}), ...(patch.body != null ? { body: patch.body } : {}), ...(patch.category != null ? { cat: patch.category } : {}) } : t)); forumApi.update(id, patch).then(loadThreads).then(() => flash("თემა განახლდა ✏️")).catch(dbErr("რედაქტირება")); };
  const onDeleteThread = (id) => { setThreads(ts => ts.filter(t => t.id !== id)); forumApi.remove(id).then(loadThreads).then(() => flash("თემა წაიშალა")).catch(dbErr("წაშლა")); };
  const onEditGroupPost = (id, text) => { setGroups(gs => gs.map(g => ({ ...g, posts: g.posts.map(p => p.id === id ? { ...p, text } : p) }))); groupsApi.updatePost(id, { text }).then(loadGroups).catch(dbErr("რედაქტირება")); };
  const onDeleteGroupPost = (id) => { setGroups(gs => gs.map(g => ({ ...g, posts: g.posts.filter(p => p.id !== id) }))); groupsApi.removePost(id).then(loadGroups).catch(dbErr("წაშლა")); };
  const onEditGroup = (id, patch) => { groupsApi.update(id, patch).then(loadGroups).then(() => flash("ჯგუფი განახლდა ✏️")).catch(dbErr("რედაქტირება")); };
  const onDeleteGroup = (id) => { setGroups(gs => gs.filter(g => g.id !== id)); groupsApi.remove(id).then(loadGroups).then(() => flash("ჯგუფი წაიშალა")).catch(dbErr("წაშლა")); };
  const onEditEvent = (id, patch) => { eventsApi.update(id, patch).then(loadEvents).then(() => flash("ივენთი განახლდა ✏️")).catch(dbErr("რედაქტირება")); };
  const onDeleteEvent = (id) => { setEvents(es => es.filter(e => e.id !== id)); eventsApi.remove(id).then(loadEvents).then(() => flash("ივენთი წაიშალა")).catch(dbErr("წაშლა")); };
  const onOrder = (item, d) => { marketApi.order(item.id, { delivery: d.delivery, payment: d.payment, address: d.address, total: d.total }).catch(dbErr("შეკვეთა")); };
  const getReviews = (sellerId) => marketApi.reviews(sellerId).then(rows => rows.map(mapDbReview));
  const addReviewApi = (sellerId, rating, text) => marketApi.addReview(sellerId, rating, text);

  const goTab = (k) => { setDrawerOpen(false); if (k === "notifications" || k === "messages") ensureNotifPerm(); if (k === "create") { setCreateOpen(true); return; } if (k === "notifications") { setNotifs(n => n.map(x => ({ ...x, read: true }))); notifsApi.markAllRead().catch(() => {}); } if (k === "profile") setProfileId(ME); if (k === "explore") setActiveTag(null); if (k === "messages") setOpenConvoId(null); setTab(k); };

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
  const fullBleed = tab === "map" || tab === "reels";

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
        @keyframes floatUp{0%{opacity:0;transform:translateY(20px) scale(.9)}12%{opacity:1;transform:translateY(0) scale(1)}75%{opacity:1;transform:translateY(-90px)}100%{opacity:0;transform:translateY(-140px) scale(.95)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%{transform:translate(-50%,-50%) scale(.6);opacity:.7}100%{transform:translate(-50%,-50%) scale(1.6);opacity:0}}
        @keyframes fadeOnly{from{opacity:0}to{opacity:1}}
        .fadein{animation:fadeOnly .35s ease both}
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
            <header className="mz-hdr md:hidden flex items-center justify-between px-3 h-14 sticky top-0 z-20" style={{ background: C.surface + "e6", backdropFilter: "blur(14px)", borderBottom: `1px solid ${C.line}` }}>
              <div className="flex items-center gap-1">
                <button onClick={() => setDrawerOpen(true)} className="rounded-full active:scale-90 flex items-center justify-center" style={{ width: 40, height: 40, color: C.ink2 }}><Menu size={24} /></button>
                <button onClick={() => goTab("home")} className="active:scale-95 flex items-center pr-2" aria-label="მთავარი"><Wordmark size={21} /></button>
              </div>
              <div className="flex items-center"><IconBtn onClick={() => setSearchOpen(true)}><Search size={23} /></IconBtn><ThemeToggle mode={mode} setMode={setMode} /><IconBtn onClick={() => goTab("online")} badge={onlineCount}><Users size={23} /></IconBtn><IconBtn onClick={() => goTab("notifications")} badge={unreadNotifs}><Bell size={23} /></IconBtn></div>
            </header>
          )}

          <div className={fullBleed ? "" : "fadein"} key={tab + (profileId || "") + (activeTag || "")}>
            {tab === "home" && (
              <>
                <div style={{ borderBottom: `1px solid ${C.lineSoft}`, background: C.surface }}><StoryRow stories={stories} onOpen={openStory} onAdd={() => setStoryEditorOpen(true)} /></div>
                <div className="stagger space-y-4 p-4">{visible.map(p => <PostCard key={p.id} post={p} onLike={onLike} onReact={onReact} onSave={onSave} onComment={onComment} onPollVote={onPollVote} onTag={onTag} onReport={onReport} onRemove={onRemovePost} onOpenProfile={openProfile} isAdmin={me.admin} onEdit={onEditPost} onDelete={onDeletePost} onEditComment={onEditComment} onDeleteComment={onDeleteComment} />)}</div>
                {feedMore ? (
                  <div ref={feedSentinelRef} className="flex justify-center items-center pt-1 pb-28 md:pb-10" style={{ minHeight: 60 }}>
                    <div style={{ width: 26, height: 26, border: `3px solid ${C.lineSoft}`, borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  </div>
                ) : <div className="pb-28 md:pb-10" />}
              </>
            )}
            {tab === "explore" && <Explore posts={visible} onTag={onTag} activeTag={activeTag} clearTag={() => setActiveTag(null)} onOpenProfile={openProfile} onSearch={() => setSearchOpen(true)} tagPosts={tagPosts} tagLoading={tagLoading} />}
            {tab === "forum" && <Forum threads={threads} onReply={onThreadReply} onVote={onThreadVote} onNew={onNewThread} onOpenProfile={openProfile} onEdit={onEditThread} onDelete={onDeleteThread} />}
            {tab === "market" && <Market listings={listings} onSave={onListingSave} onNew={onNewListing} onMessage={onMessageUser} onOpenProfile={openProfile} flash={flash} live={live} onOrder={onOrder} getReviews={getReviews} onAddReview={addReviewApi} onUpload={(f) => uploadImage(f, "market")} onEdit={onEditListing} onDelete={onDeleteListing} sentinelRef={listSentinelRef} hasMore={listMore} loadingMore={listLoadingMore} />}
            {tab === "map" && <MapView onMessage={onMessageUser} onMenu={() => setDrawerOpen(true)} onOpenProfile={openProfile} />}
            {tab === "reels" && <Reels reels={reels} onLike={onReelLike} onSave={onReelSave} onOpenProfile={openProfile} onMenu={() => setDrawerOpen(true)} flash={flash} onCreate={() => setReelCreateOpen(true)} onComments={openReelComments} sentinelRef={reelsSentinelRef} hasMore={reelsMore} loadingMore={reelsLoadingMore} />}
            {tab === "groups" && <Groups groups={groups} events={events} onJoin={onJoinGroup} onRsvp={onRsvp} onOpenProfile={openProfile} onMessage={onMessageUser} live={live} onGroupPost={onGroupPost} onUpload={(f) => uploadImage(f, "groups")} onCreateGroup={onCreateGroup} onCreateEvent={onCreateEvent} pendingOpen={pendingGroup} clearPending={() => setPendingGroup(null)} onEditPost={onEditGroupPost} onDeletePost={onDeleteGroupPost} onEditGroup={onEditGroup} onDeleteGroup={onDeleteGroup} onEditEvent={onEditEvent} onDeleteEvent={onDeleteEvent} />}
            {tab === "messages" && <Messages convos={convos} openId={openConvoId} setOpenId={setOpenConvoId} onSend={onSendMsg} onReply={onReply} onEditMsg={onEditMsg} onDeleteMsg={onDeleteMsg} onDeleteConvo={onDeleteConvo} onCreateConvo={onCreateConvo} onOpenProfile={openProfile} live={live} onMenu={() => setDrawerOpen(true)} groups={groups} onOpenGroup={(id) => { setPendingGroup(id); setTab("groups"); }} onlineIds={onlineIds} onMessageUser={onMessageUser} onStartCall={startCall} peerReadAt={peerReadAt} initialReactions={chatReactions} onMarkRead={onMarkRead} onReactMsg={onReactMsg} />}
            {tab === "notifications" && <Notifications notifs={notifs} onOpenProfile={openProfile} isFollowing={isFollowing} onToggleFollow={toggleFollow} />}
            {tab === "online" && <OnlinePage onlineIds={onlineIds} onOpenProfile={openProfile} onMessage={onMessageUser} following={following} />}
            {tab === "profile" && <Profile userId={profileId || ME} posts={posts} savedPosts={savedPosts} reels={reels} xp={xp} meProfile={meProfile} following={following} followerCounts={followerCounts} onToggleFollow={toggleFollow} onMessage={onMessageUser} onOpenList={(type, uid) => setListView({ type, userId: uid })} onSettings={() => setSettingsOpen(true)} flash={flash} onBack={() => goTab("home")} onTag={onTag} onLike={onLike} onReact={onReact} onSave={onSave} onComment={onComment} onPollVote={onPollVote} onReport={onReport} onRemove={onRemovePost} onOpenProfile={openProfile} isAdmin={me.admin} onUploadAvatar={onChangeAvatar} onUploadCover={onChangeCover} onOpenReels={() => goTab("reels")} onAddReel={() => setReelCreateOpen(true)} onReelDelete={onReelDelete} onReelEdit={onReelEdit} onEditPost={onEditPost} onDeletePost={onDeletePost} onEditComment={onEditComment} onDeleteComment={onDeleteComment} />}
            {tab === "progress" && <Progress xp={xp} posts={posts} myFollowers={followerCounts[ME] != null ? followerCounts[ME] : (USERS[ME] ? USERS[ME].followers : 0)} questData={questData} onClaim={onClaimQuest} />}
            {tab === "leaderboard" && <Leaderboard xp={xp} allUsers={allUsers} posts={posts} onOpenProfile={openProfile} />}
            {tab === "admin" && <Admin reports={reports} posts={posts} allUsers={allUsers} userCount={userCount} postCount={postCount} online={onlineCount} onResolve={onResolve} onRemovePost={onRemovePost} onSetVerified={onSetVerified} onSetAdmin={onSetAdmin} onOpenProfile={openProfile} onBanUser={onBanUser} onGrantXp={onGrantXp} listings={listings} threads={threads} reels={reels} onDeleteListing={onDeleteListing} onDeleteThread={onDeleteThread} onDeleteReel={onReelDelete} />}
          </div>
        </main>

        <aside className="hidden lg:block w-[290px] shrink-0 px-5 py-6">
          <button onClick={() => setSearchOpen(true)} className="w-full flex items-center gap-2.5 px-4 py-3 rounded-full mb-5 text-left active:scale-[.99] transition" style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SH.card }}><Search size={18} style={{ color: C.faint }} /><span className="flex-1 text-sm" style={{ color: C.faint }}>ძებნა</span></button>
          {(() => { const tr = computeTrends(posts, 5); return tr.length > 0 ? (
          <div className="p-4 mb-4" style={card()}><div className="flex items-center gap-1.5 text-[15px] mb-3.5" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700 }}><TrendingUp size={17} style={{ color: C.accent }} /> ტრენდები</div><div className="space-y-3">{tr.map(t => <button key={t.tag} onClick={() => onTag(t.tag)} className="block text-left w-full hover:opacity-70"><div className="font-bold text-[14px]" style={{ color: C.ink }}>#{t.tag}</div><Mono style={{ fontSize: 12, color: C.faint }}>{t.posts} პოსტი</Mono></button>)}</div></div>
          ) : null; })()}
          {(() => { const sug = (allUsers || []).filter(u => u.id !== ME && !following.includes(u.id)).slice(0, 3); return sug.length > 0 ? (
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
            <button onClick={() => setInstallEvt(null)} className="shrink-0 active:scale-90" style={{ color: C.faint }}><X size={18} /></button>
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

      {session && hasSupabase && <CallLayer ref={callRef} me={ME} enabled={true} />}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} nav={NAV} onNav={goTab} onCreate={() => { setDrawerOpen(false); setCreateOpen(true); }} flash={(t) => { setDrawerOpen(false); flash(t); }} tab={tab} mode={mode} setMode={setMode} xp={xp} followers={followerCounts[ME] != null ? followerCounts[ME] : (USERS[ME] ? USERS[ME].followers : 0)} following={following.length} onSettings={() => { setDrawerOpen(false); setSettingsOpen(true); }} onSignOut={() => { setDrawerOpen(false); authApi.signOut().catch(dbErr("გასვლა")); }} />
      {createOpen && <CreateSheet onClose={() => setCreateOpen(false)} onPost={onPost} live={live} onUpload={(f) => uploadImage(f, "posts")} />}
      {story && <StoryViewer story={story} onClose={() => setStoryId(null)} onDone={markSeen} flash={flash} />}
      {listView && <FollowList view={listView} following={following} onToggleFollow={toggleFollow} onOpenProfile={openProfile} onClose={() => setListView(null)} />}
      {settingsOpen && <SettingsView settings={settings} setSettings={setSettings} meProfile={meProfile} setMeProfile={setMeProfile} mode={mode} setMode={setMode} onClose={() => setSettingsOpen(false)} flash={flash} onUploadAvatar={onChangeAvatar} pushState={pushState} onTogglePush={onTogglePush} onSignOut={() => { setSettingsOpen(false); authApi.signOut().catch(dbErr("გასვლა")); }} />}
      {storyEditorOpen && <StoryEditor onClose={() => setStoryEditorOpen(false)} onShare={onAddStory} live={live} onUpload={(f) => uploadImage(f, "stories")} />}
      {reelCreateOpen && <ReelCreate onClose={() => setReelCreateOpen(false)} onPublish={onPublishReel} onUpload={(f) => uploadImage(f, "reels")} flash={flash} />}
      {reelComments && <ReelComments data={reelComments} onClose={() => setReelComments(null)} onAdd={addReelComment} />}
      {searchOpen && <SearchView posts={posts} onOpenProfile={openProfile} onTag={onTag} onClose={() => setSearchOpen(false)} runSearch={runSearch} />}
      {toast && <div className="fixed left-1/2 z-[80] px-4 py-2.5 rounded-full text-sm font-bold text-white" style={{ bottom: 92, background: DARK ? C.surfaceMuted : C.ink, border: DARK ? `1px solid ${C.line}` : "none", boxShadow: SH.pop, animation: "pin .3s cubic-bezier(.22,.61,.36,1) both" }}>{toast}</div>}
    </div>
  );
}

/* ─────────────────────────  REELS / GROUPS / EVENTS / PROGRESS DATA  ───────────────────────── */
