import { useState, useRef, useEffect } from "react";
import { reelsApi, mapDbReel, hydrateAuthors, hasSupabase, mergeProfile, t } from "../ui/core";

export function useReels({ tab, flash, dbErr, setDbError, gainXp }) {
  const [reels, setReels] = useState([]);
  const [reelsCursor, setReelsCursor] = useState(null);
  const [reelsMore, setReelsMore] = useState(true);
  const [reelsLoadingMore, setReelsLoadingMore] = useState(false);
  const reelsSentinelRef = useRef(null);
  const reelViewedRef = useRef(new Set());
  // fixed once per session so the Reels row's position in the main feed doesn't
  // jump around on every re-render, but still lands somewhere different each visit
  const reelsSeedRef = useRef(Math.random());
  const [reelCreateOpen, setReelCreateOpen] = useState(false);
  const [reelComments, setReelComments] = useState(null);

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
  useEffect(() => {
    const el = reelsSentinelRef.current;
    if (!el || tab !== "reels" || !reelsMore) return;
    const obs = new IntersectionObserver((e) => { if (e[0] && e[0].isIntersecting) loadMoreReels(); }, { rootMargin: "1000px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [tab, reelsMore, reelsCursor, reelsLoadingMore]);

  const onReelLike = (id) => { setReels(rs => rs.map(r => r.id === id ? { ...r, likedByMe: !r.likedByMe } : r)); reelsApi.toggleLike(id).catch(dbErr("reel მოწონება")); };
  const onReelSave = (id) => { setReels(rs => rs.map(r => r.id === id ? { ...r, savedByMe: !r.savedByMe } : r)); reelsApi.toggleSave(id).catch(dbErr("reel შენახვა")); };
  const onReelView = (id) => { if (reelViewedRef.current.has(id)) return; reelViewedRef.current.add(id); setReels(rs => rs.map(r => r.id === id ? { ...r, views: (r.views || 0) + 1 } : r)); if (hasSupabase) reelsApi.addView(id).catch(() => {}); };
  const onReelDelete = (id) => { setReels(rs => rs.filter(r => r.id !== id)); reelsApi.remove(id).then(loadReels).catch(dbErr("reel წაშლა")); };
  const onReelEdit = (id, caption) => { setReels(rs => rs.map(r => r.id === id ? { ...r, caption } : r)); reelsApi.update(id, { caption }).catch(dbErr("reel რედაქტირება")); };
  const openReelComments = async (r) => { setReelComments({ reel: r, list: null }); try { const list = await reelsApi.comments(r.id); list.forEach(c => c.author && mergeProfile(c.author)); setReelComments({ reel: r, list }); } catch (e) { setReelComments(null); setDbError("reel comments: " + (e.message || JSON.stringify(e)) + (e.code ? " · code: " + e.code : "")); } };
  const addReelComment = async (text) => { const rc = reelComments; if (!rc) return; try { const c = await reelsApi.addComment(rc.reel.id, text); if (c.author) mergeProfile(c.author); setReelComments(p => p && p.reel.id === rc.reel.id ? { ...p, list: [...(p.list || []), c] } : p); setReels(rs => rs.map(x => x.id === rc.reel.id ? { ...x, comments: (x.comments || 0) + 1 } : x)); gainXp(3); } catch (e) { setDbError("reel comment: " + (e.message || JSON.stringify(e)) + (e.code ? " · code: " + e.code : "")); } };
  const onPublishReel = ({ video, thumb, caption, audio }) => { setReelCreateOpen(false); gainXp(12); flash(t("toast.reelPublished")); reelsApi.create({ video_url: video, thumb_url: thumb || null, caption, audio: audio || "ორიგინალი ხმა" }).then(loadReels).catch(dbErr("reel")); };

  return {
    reels, reelsCursor, reelsMore, reelsLoadingMore, reelsSentinelRef, reelsSeedRef,
    reelCreateOpen, setReelCreateOpen, reelComments, setReelComments,
    loadReels, loadMoreReels, onReelLike, onReelSave, onReelView, onReelDelete,
    onReelEdit, openReelComments, addReelComment, onPublishReel,
  };
}
