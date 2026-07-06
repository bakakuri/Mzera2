import { useState, useRef, useEffect } from "react";
import {
  postsApi, reactionsApi, commentsApi, profilesApi, pollsApi,
  filmsApi, musicApi, marketApi,
  mapDbPost, mapDbFilm, mapDbSong, mapDbListing, mergeProfile, timeAgo, ME, USERS, hasSupabase, resolveImg, t,
} from "../ui/core";

const lsGet = (k, def) => { try { const v = typeof localStorage !== "undefined" && localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } };
const lsSet = (k, v) => { try { if (typeof localStorage !== "undefined") localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

// The central feed hook: post list + pagination, all post-level interactions
// (like/react/save/comment/repost/edit/delete/hide/see-less/favorite), the
// home-feed ranking + the discovery-card interleaving (promo cards / Reels
// row placement), hashtag + single-post views, and search. This is the
// biggest hook because the main feed genuinely surfaces content owned by
// every other domain (groups/films/music/market/forum/reels/games) — those
// are only ever *read* here (for building promo cards), never mutated.
export function useFeed({ tab, session, flash, dbErr, setDbError, gainXp }) {
  const [feedSort, setFeedSort] = useState(() => lsGet("mz_feedsort", "top"));
  const [hiddenPosts, setHiddenPosts] = useState(() => lsGet("mz_hidden", []));
  const [favorites, setFavorites] = useState(() => lsGet("mz_favs", []));
  const [seeLess, setSeeLess] = useState(() => lsGet("mz_seeless", []));
  useEffect(() => { lsSet("mz_feedsort", feedSort); }, [feedSort]);
  useEffect(() => { lsSet("mz_hidden", hiddenPosts); }, [hiddenPosts]);
  useEffect(() => { lsSet("mz_favs", favorites); }, [favorites]);
  useEffect(() => { lsSet("mz_seeless", seeLess); }, [seeLess]);

  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [shareCounts, setShareCounts] = useState({});
  const [newPosts, setNewPosts] = useState(0);
  const [feedCursor, setFeedCursor] = useState(null);
  const [feedMore, setFeedMore] = useState(true);
  const [feedLoadingMore, setFeedLoadingMore] = useState(false);
  const feedSentinelRef = useRef(null);
  const [memories, setMemories] = useState([]);
  const [activeTag, setActiveTag] = useState(null);
  const [tagView, setTagView] = useState(null);
  const [postView, setPostView] = useState(null);
  const [postViewCommentId, setPostViewCommentId] = useState(null);
  const [tagPosts, setTagPosts] = useState([]);
  const [tagLoading, setTagLoading] = useState(false);

  // Fallback for reposts: the shared:posts!posts_shared_post_id_fkey(...) embed
  // occasionally comes back null even though the original post still exists (a
  // self-referencing-FK embed quirk), which rendered as "🚫 ეს პოსტი წაშლილია" for
  // a post that was never deleted. Batch-fetch anything the embed missed and patch it in.
  const hydrateShared = async (mapped) => {
    const ids = [...new Set(mapped.filter(p => p.sharedId && !p.shared).map(p => p.sharedId))];
    if (!ids.length) return mapped;
    try {
      const rows = await postsApi.byIds(ids);
      const byId = {};
      rows.forEach(r => { if (r.author) mergeProfile(r.author); byId[r.id] = r; });
      mapped.forEach(p => {
        if (p.sharedId && !p.shared && byId[p.sharedId]) {
          const r = byId[p.sharedId];
          p.shared = { id: r.id, authorId: r.author_id, text: r.text || "", image: r.image_url || (Array.isArray(r.images) && r.images[0]) || null, images: (Array.isArray(r.images) && r.images.length) ? r.images : (r.image_url ? [r.image_url] : []), video: r.video_url || null, bg: r.bg || null, time: timeAgo(r.created_at) };
        }
      });
    } catch (e) {}
    return mapped;
  };

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
        try { const cms = await commentsApi.forPosts(ids); const by = {}; cms.forEach(c => { if (c.author) mergeProfile(c.author); (by[c.post_id] = by[c.post_id] || []).push({ id: c.id, authorId: c.author_id, text: c.text, time: timeAgo(c.created_at), createdAt: c.created_at, parentId: c.parent_id || null, likes: (c.comment_likes || []).length, likedByMe: (c.comment_likes || []).some(l => l.user_id === ME) }); }); mapped.forEach(p => { if (by[p.id]) p.comments = by[p.id]; }); } catch (e) {}
      }
      await hydrateShared(mapped);
      setPosts(mapped);
      setNewPosts(0);
      setFeedCursor(mapped.length ? mapped[mapped.length - 1].createdAt : null);
      setFeedMore(paged && mapped.length >= 12);
      try { const sv = await postsApi.mySaves(); sv.forEach(r => { if (r.author) mergeProfile(r.author); }); setSavedPosts(sv.map(r => ({ ...mapDbPost(r), savedByMe: true, collectionId: r._collection_id || null }))); } catch (e) {}
    } catch (e) { console.error("feed:", e); setDbError("Feed: " + (e.message || JSON.stringify(e)) + (e.hint ? " · hint: " + e.hint : "") + (e.code ? " · code: " + e.code : "")); }
  };
  const reloadFeed = () => loadFeed();
  const loadShareCounts = async () => { if (!hasSupabase) return; const counts = await postsApi.shareCounts(); setShareCounts(counts); setPosts(ps => ps.map(p => ({ ...p, shares: counts[p.id] || 0 }))); };
  const loadMorePosts = async () => {
    if (feedLoadingMore || !feedMore || !feedCursor || !hasSupabase) return;
    setFeedLoadingMore(true);
    try {
      const feed = await postsApi.feedPage(feedCursor, 12);
      if (!feed.length) { setFeedMore(false); return; }
      const mapped = feed.map(mapDbPost);
      const ids = mapped.map(p => p.id);
      try { const rx = await reactionsApi.forPosts(ids); const cnt = {}, mineM = {}; rx.forEach(r => { cnt[r.post_id] = (cnt[r.post_id] || 0) + 1; if (r.user_id === ME) mineM[r.post_id] = r.emoji; }); mapped.forEach(p => { p.likes = cnt[p.id] || 0; if (mineM[p.id]) { p.likedByMe = true; p.reaction = mineM[p.id]; } }); } catch (e) {}
      try { const cms = await commentsApi.forPosts(ids); const by = {}; cms.forEach(c => { if (c.author) mergeProfile(c.author); (by[c.post_id] = by[c.post_id] || []).push({ id: c.id, authorId: c.author_id, text: c.text, time: timeAgo(c.created_at), createdAt: c.created_at, parentId: c.parent_id || null, likes: (c.comment_likes || []).length, likedByMe: (c.comment_likes || []).some(l => l.user_id === ME) }); }); mapped.forEach(p => { if (by[p.id]) p.comments = by[p.id]; }); } catch (e) {}
      try { const savedIds = new Set(await postsApi.mySaveIds()); mapped.forEach(p => { if (savedIds.has(p.id)) p.savedByMe = true; }); } catch (e) {}
      mapped.forEach(p => { p.shares = shareCounts[p.id] || 0; });
      await hydrateShared(mapped);
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
    const empty = { people: [], posts: [], films: [], songs: [], listings: [], failedCount: 0 };
    if (!q || !hasSupabase) return empty;
    // run all five searches concurrently instead of one-after-another, and
    // keep whichever succeed even if others fail — but track the failures so
    // the UI can tell "no results" apart from "the search itself broke"
    const [peopleR, postsR, filmsR, songsR, listingsR] = await Promise.allSettled([
      profilesApi.search(q, 20),
      postsApi.search(q, 20),
      filmsApi.page(null, { search: q }, 12),
      musicApi.search(q, 12),
      marketApi.search(q, 12),
    ]);
    let people = [];
    if (peopleR.status === "fulfilled") { peopleR.value.forEach(p => mergeProfile(p)); people = peopleR.value.filter(p => p.id !== ME).map(p => USERS[p.id]).filter(Boolean); }
    const foundPosts = postsR.status === "fulfilled" ? postsR.value.map(mapDbPost) : [];
    const foundFilms = filmsR.status === "fulfilled" ? filmsR.value.map(mapDbFilm) : [];
    const foundSongs = songsR.status === "fulfilled" ? songsR.value.map(mapDbSong) : [];
    const foundListings = listingsR.status === "fulfilled" ? listingsR.value.map(mapDbListing) : [];
    const failedCount = [peopleR, postsR, filmsR, songsR, listingsR].filter(r => r.status === "rejected").length;
    return { people, posts: foundPosts, films: foundFilms, songs: foundSongs, listings: foundListings, failedCount };
  };

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
  const onComment = (id, text, parentId) => { const tempId = "c" + Date.now(); const now = new Date().toISOString(); setPosts(ps => ps.map(p => p.id === id ? { ...p, comments: [...p.comments, { id: tempId, authorId: ME, text, time: "ახლა", createdAt: now, parentId: parentId || null, likes: 0, likedByMe: false }] } : p)); gainXp(5); commentsApi.add(id, text, parentId).then(c => { if (c && c.id) setPosts(ps => ps.map(p => p.id === id ? { ...p, comments: p.comments.map(cm => cm.id === tempId ? { ...cm, id: c.id } : cm) } : p)); }).catch(dbErr("კომენტარი")); };
  const onLikeComment = (postId, commentId) => { setPosts(ps => ps.map(p => p.id === postId ? { ...p, comments: p.comments.map(c => c.id === commentId ? { ...c, likedByMe: !c.likedByMe, likes: (c.likes || 0) + (c.likedByMe ? -1 : 1) } : c) } : p)); commentsApi.toggleLike(commentId).catch(dbErr("მოწონება")); };
  const onEditPost = (id, text) => { setPosts(ps => ps.map(p => p.id === id ? { ...p, text, edited: true } : p)); setSavedPosts(sp => sp.map(p => p.id === id ? { ...p, text, edited: true } : p)); postsApi.update(id, { text, edited: true }).catch(dbErr("პოსტის რედაქტირება")); flash(t("toast.postUpdated")); };
  const onRepost = (postId, quote) => { postsApi.create({ text: quote || "", shared_post_id: postId }).then(() => { gainXp(8); flash(t("toast.repostedToWall")); return Promise.resolve(reloadFeed()).then(() => loadShareCounts()); }).catch(dbErr("გაზიარება")); };
  const onHidePost = (id) => { setHiddenPosts(h => h.includes(id) ? h : [...h, id]); flash(t("toast.postHidden")); };
  const onSeeLess = (authorId) => { setSeeLess(s => s.includes(authorId) ? s : [...s, authorId]); setFavorites(f => f.filter(x => x !== authorId)); flash(t("toast.showLessAuthor")); };
  const onToggleFavorite = (authorId) => { const now = favorites.includes(authorId); setFavorites(f => now ? f.filter(x => x !== authorId) : [...f, authorId]); setSeeLess(s => s.filter(x => x !== authorId)); flash(now ? t("toast.favoriteRemoved") : t("toast.favoriteAdded")); };
  const onDeletePost = (id) => { setPosts(ps => ps.filter(p => p.id !== id)); setSavedPosts(sp => sp.filter(p => p.id !== id)); postsApi.remove(id).catch(dbErr("პოსტის წაშლა")); flash(t("toast.postDeleted")); };
  const onEditComment = (postId, commentId, text) => { setPosts(ps => ps.map(p => p.id === postId ? { ...p, comments: p.comments.map(c => c.id === commentId ? { ...c, text } : c) } : p)); commentsApi.update(commentId, text).catch(dbErr("კომენტარის რედაქტირება")); };
  const onDeleteComment = (postId, commentId) => { setPosts(ps => ps.map(p => p.id === postId ? { ...p, comments: p.comments.filter(c => c.id !== commentId) } : p)); commentsApi.remove(commentId).catch(dbErr("კომენტარის წაშლა")); };
  const onRemovePost = (id) => { setPosts(ps => ps.filter(p => p.id !== id)); setSavedPosts(sp => sp.filter(p => p.id !== id)); postsApi.remove(id).catch(dbErr("პოსტის წაშლა")); flash(t("toast.postDeleted")); };
  // note: closing the compose sheet (setCreateOpen(false)) is nav state owned
  // by App.jsx, wired in alongside this call rather than done here
  const onPost = (text, pics, poll, scheduledFor, wantPublic, extras) => { extras = extras || {}; gainXp(15); flash(wantPublic ? t("toast.sentToModeration") : scheduledFor ? t("toast.scheduled") : t("toast.published")); postsApi.create({ text, images: (pics && pics.length) ? pics.map(resolveImg) : null, poll, scheduled_for: scheduledFor || null, public_status: wantPublic ? "pending" : "none", bg: extras.bg || null, feeling: extras.feeling || null, location: extras.location || null, tagged: (extras.tagged && extras.tagged.length) ? extras.tagged : null, video_url: extras.video || null }).then(reloadFeed).catch(dbErr("პოსტი")); };

  const hydrateMerge = async (mapped) => {
    const ids = mapped.map(p => p.id);
    if (ids.length) {
      try { const rx = await reactionsApi.forPosts(ids); const cnt = {}, mineM = {}; rx.forEach(r => { cnt[r.post_id] = (cnt[r.post_id] || 0) + 1; if (r.user_id === ME) mineM[r.post_id] = r.emoji; }); mapped.forEach(p => { p.likes = cnt[p.id] || 0; if (mineM[p.id]) { p.likedByMe = true; p.reaction = mineM[p.id]; } }); } catch (e) {}
      try { const cms = await commentsApi.forPosts(ids); const by = {}; cms.forEach(c => { if (c.author) mergeProfile(c.author); (by[c.post_id] = by[c.post_id] || []).push({ id: c.id, authorId: c.author_id, text: c.text, time: timeAgo(c.created_at), createdAt: c.created_at, parentId: c.parent_id || null, likes: (c.comment_likes || []).length, likedByMe: (c.comment_likes || []).some(l => l.user_id === ME) }); }); mapped.forEach(p => { if (by[p.id]) p.comments = by[p.id]; }); } catch (e) {}
      try { const savedIds = new Set(await postsApi.mySaveIds()); mapped.forEach(p => { if (savedIds.has(p.id)) p.savedByMe = true; }); } catch (e) {}
    }
    await hydrateShared(mapped);
    setPosts(prev => { const m = new Map(prev.map(p => [p.id, p])); mapped.forEach(p => m.set(p.id, p)); return Array.from(m.values()); });
  };
  const openTag = (tag, setProfileId) => { setActiveTag(tag); setTagView(tag); setProfileId(null); if (hasSupabase) postsApi.byHashtag(tag).then(rows => { rows.forEach(r => { if (r.author) mergeProfile(r.author); }); return hydrateMerge(rows.map(mapDbPost)); }).catch(() => {}); };
  const openPost = (id, commentId) => { setPostViewCommentId(commentId || null); const ex = posts.find(p => p.id === id); if (ex) { setPostView(id); return; } if (!hasSupabase) return; postsApi.byId(id).then(row => { if (row) { if (row.author) mergeProfile(row.author); return hydrateMerge([mapDbPost(row)]).then(() => setPostView(id)); } }).catch(() => {}); };
  const loadUserPosts = (id) => {
    if (!hasSupabase || !id) return;
    postsApi.byUser(id).then(async rows => {
      const mapped = rows.map(mapDbPost);
      const newIds = mapped.map(p => p.id);
      try { const rx = await reactionsApi.forPosts(newIds); const cnt = {}, mineM = {}; rx.forEach(r => { cnt[r.post_id] = (cnt[r.post_id] || 0) + 1; if (r.user_id === ME) mineM[r.post_id] = r.emoji; }); mapped.forEach(p => { p.likes = cnt[p.id] || 0; if (mineM[p.id]) { p.likedByMe = true; p.reaction = mineM[p.id]; } }); } catch (e) {}
      setPosts(ps => { const have = new Set(ps.map(p => p.id)); const add = mapped.filter(p => !have.has(p.id)); return add.length ? [...ps, ...add] : ps; });
    }).catch(() => {});
  };

  return {
    feedSort, setFeedSort, hiddenPosts, setHiddenPosts, favorites, setFavorites, seeLess, setSeeLess,
    posts, setPosts, savedPosts, setSavedPosts, shareCounts, newPosts, setNewPosts,
    feedCursor, feedMore, feedLoadingMore, feedSentinelRef, memories, setMemories,
    activeTag, setActiveTag, tagView, setTagView, postView, setPostView, postViewCommentId, setPostViewCommentId, tagPosts, tagLoading,
    hydrateShared, hydrateMerge, loadFeed, reloadFeed, loadShareCounts, loadMorePosts, runSearch,
    onLike, onReact, onPollVote, onSave, onComment, onLikeComment, onEditPost, onRepost,
    onHidePost, onSeeLess, onToggleFavorite, onDeletePost, onEditComment, onDeleteComment,
    onRemovePost, onPost, openTag, openPost, loadUserPosts,
  };
}
