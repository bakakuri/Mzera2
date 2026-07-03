import { useState, useRef, useEffect } from "react";
import { musicApi, mapDbSong, img, hasSupabase } from "../ui/core";

// Songs list + the *global* player state (lives here, at the App root via
// this hook being called once in App.jsx — not inside the music tab — so
// playback survives switching tabs; only stops when the user hits ✕).
export function useMusic({ flash, dbErr }) {
  const [songs, setSongs] = useState([]);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioElRef = useRef(null);

  // songs table is new, same as films — fail silently until migrated
  const loadMusic = async () => { if (!hasSupabase) return; try { const rows = await musicApi.page(null, "new", 60); setSongs(rows.map(mapDbSong)); } catch (e) { console.error("music:", e); } };
  const onNewSong = (d) => { musicApi.create({ title: d.title, artist: d.artist, genre: d.genre, cover_url: d.cover || null, audio_url: d.audio }).then(loadMusic).then(() => flash("სიმღერა დაემატა 🎵")).catch(dbErr("სიმღერა")); };
  const onEditSong = (id, patch) => { setSongs(ss => ss.map(s => s.id === id ? { ...s, ...(patch.title != null ? { title: patch.title } : {}), ...(patch.artist != null ? { artist: patch.artist } : {}), ...(patch.genre != null ? { genre: patch.genre } : {}), ...(patch.cover_url !== undefined ? { cover: patch.cover_url || img("song" + id, 480, 480) } : {}), ...(patch.audio_url != null ? { audio: patch.audio_url } : {}) } : s)); musicApi.update(id, patch).then(loadMusic).then(() => flash("სიმღერა განახლდა ✏️")).catch(dbErr("რედაქტირება")); };
  const onDeleteSong = (id) => { if (nowPlaying && nowPlaying.id === id) { setIsPlaying(false); setNowPlaying(null); } setSongs(ss => ss.filter(s => s.id !== id)); musicApi.remove(id).then(loadMusic).then(() => flash("სიმღერა წაიშალა")).catch(dbErr("წაშლა")); };

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

  return { songs, loadMusic, onNewSong, onEditSong, onDeleteSong, nowPlaying, isPlaying, setIsPlaying, playSong, stopPlaying, audioElRef };
}
