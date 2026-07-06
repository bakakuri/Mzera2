import { useState, useRef, useEffect } from "react";
import { musicApi, mapDbSong, img, hasSupabase, t } from "../ui/core";

// Songs list + the *global* player state (lives here, at the App root via
// this hook being called once in App.jsx — not inside the music tab — so
// playback survives switching tabs; only stops when the user hits ✕).
export function useMusic({ tab, flash, dbErr }) {
  const [songs, setSongs] = useState([]);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioElRef = useRef(null);
  const [songCursor, setSongCursor] = useState(null);
  const [songMore, setSongMore] = useState(true);
  const [songLoadingMore, setSongLoadingMore] = useState(false);
  const songSentinelRef = useRef(null);
  const PAGE = 30;

  // songs table is new, same as films — fail silently until migrated
  const loadMusic = async () => {
    if (!hasSupabase) return;
    try {
      const rows = await musicApi.page(null, "new", PAGE);
      const mapped = rows.map(mapDbSong);
      setSongs(mapped);
      setSongCursor(mapped.length ? mapped[mapped.length - 1].createdAt : null);
      setSongMore(mapped.length >= PAGE);
    } catch (e) { console.error("music:", e); }
  };
  const loadMoreSongs = async () => {
    if (songLoadingMore || !songMore || !songCursor || !hasSupabase) return;
    setSongLoadingMore(true);
    try {
      const rows = await musicApi.page(songCursor, "new", PAGE);
      if (!rows.length) { setSongMore(false); return; }
      const mapped = rows.map(mapDbSong);
      setSongs(prev => { const seen = new Set(prev.map(s => s.id)); return [...prev, ...mapped.filter(s => !seen.has(s.id))]; });
      setSongCursor(mapped[mapped.length - 1].createdAt);
      setSongMore(rows.length >= PAGE);
    } catch (e) { flash && flash(t("toast.songsLoadMoreFailed")); } finally { setSongLoadingMore(false); }
  };
  useEffect(() => {
    const el = songSentinelRef.current;
    if (!el || tab !== "music" || !songMore) return;
    const obs = new IntersectionObserver((e) => { if (e[0] && e[0].isIntersecting) loadMoreSongs(); }, { rootMargin: "700px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [tab, songMore, songCursor, songLoadingMore]);
  const onNewSong = (d) => { musicApi.create({ title: d.title, artist: d.artist, genre: d.genre, cover_url: d.cover || null, audio_url: d.audio }).then(loadMusic).then(() => flash(t("toast.songAdded"))).catch(dbErr("სიმღერა")); };
  const onEditSong = (id, patch) => { setSongs(ss => ss.map(s => s.id === id ? { ...s, ...(patch.title != null ? { title: patch.title } : {}), ...(patch.artist != null ? { artist: patch.artist } : {}), ...(patch.genre != null ? { genre: patch.genre } : {}), ...(patch.cover_url !== undefined ? { cover: patch.cover_url || img("song" + id, 480, 480) } : {}), ...(patch.audio_url != null ? { audio: patch.audio_url } : {}) } : s)); musicApi.update(id, patch).then(loadMusic).then(() => flash(t("toast.songUpdated"))).catch(dbErr("რედაქტირება")); };
  const onDeleteSong = (id) => { if (nowPlaying && nowPlaying.id === id) { setIsPlaying(false); setNowPlaying(null); } setSongs(ss => ss.filter(s => s.id !== id)); musicApi.remove(id).then(loadMusic).then(() => flash(t("toast.songDeleted"))).catch(dbErr("წაშლა")); };

  // global player: survives tab switches since this state/audio element lives in App, not the music tab
  const playSong = (song) => {
    if (nowPlaying && nowPlaying.id === song.id) { setIsPlaying(p => !p); return; }
    setNowPlaying(song); setIsPlaying(true);
    musicApi.incrementPlays(song.id).catch(() => {});
  };
  const stopPlaying = () => { setIsPlaying(false); setNowPlaying(null); };
  useEffect(() => {
    const el = audioElRef.current;
    if (!el || !nowPlaying) return;
    el.src = nowPlaying.audio;
    el.play().catch(() => {});
  }, [nowPlaying?.id]);
  useEffect(() => {
    const el = audioElRef.current;
    if (!el || !nowPlaying) return;
    if (isPlaying) el.play().catch(() => {}); else el.pause();
  }, [isPlaying]);

  return { songs, loadMusic, loadMoreSongs, songMore, songLoadingMore, songSentinelRef, onNewSong, onEditSong, onDeleteSong, nowPlaying, isPlaying, setIsPlaying, playSong, stopPlaying, audioElRef };
}
