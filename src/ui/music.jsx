import { useState, useEffect, useRef } from "react";
import {
  X, Plus, Pencil, Trash2, Play, Pause, Upload, Music,
  C, SH, card, DISPLAY, GBRAND, Mono, GRADS, hashIdx, Pic, Title, Chips, Empty, MUSIC_GENRES, ME, t, UploadProgress,
} from "./core";

function ConfirmDialog({ title, msg, confirmText = t("action.delete"), onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6" style={{ background: "rgba(6,7,12,.6)", backdropFilter: "blur(4px)" }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[360px] rounded-3xl p-6 text-center" style={{ background: C.surface, boxShadow: SH.pop }}>
        <div className="rounded-full flex items-center justify-center mx-auto mb-3.5" style={{ width: 60, height: 60, background: C.like + "1f" }}><Trash2 size={28} style={{ color: C.like }} /></div>
        <div className="text-[18px] font-bold" style={{ color: C.ink, fontFamily: DISPLAY }}>{title}</div>
        <div className="text-[14px] mt-1.5" style={{ color: C.muted, lineHeight: 1.5 }}>{msg}</div>
        <div className="flex gap-2.5 mt-5">
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl font-bold text-[14px] active:scale-[.98]" style={{ background: C.surfaceMuted, color: C.ink2 }}>{t("action.cancel")}</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl font-bold text-[14px] text-white active:scale-[.98]" style={{ background: C.like }}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

function NewSong({ onClose, onCreate, onUpload, onUploadAudio, initial }) {
  const [title, setTitle] = useState(initial ? initial.title : "");
  const [artist, setArtist] = useState(initial ? initial.artist : "");
  const [genre, setGenre] = useState(initial ? initial.genre : "პოპ");
  const [cover, setCover] = useState(initial && initial.cover ? initial.cover : "");
  const [audio, setAudio] = useState(initial && initial.audio ? initial.audio : "");
  const coverRef = useRef(null);
  const audioRef = useRef(null);
  const [coverProgress, setCoverProgress] = useState(null);
  const [audioProgress, setAudioProgress] = useState(null);
  const uploadingCover = coverProgress != null; const uploadingAudio = audioProgress != null;
  const [uploadErr, setUploadErr] = useState("");
  const [vph, setVph] = useState(null);
  useEffect(() => { const vv = window.visualViewport; if (!vv) return; const onR = () => setVph(vv.height); onR(); vv.addEventListener("resize", onR); vv.addEventListener("scroll", onR); return () => { vv.removeEventListener("resize", onR); vv.removeEventListener("scroll", onR); }; }, []);
  const pickCover = async (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    setCoverProgress(0); setUploadErr("");
    try { setCover(await onUpload(f, setCoverProgress)); } catch (err) { setUploadErr(t("song.coverUploadFailedPre") + (err && err.message ? err.message : t("error.unknown"))); }
    setCoverProgress(null); e.target.value = "";
  };
  const pickAudio = async (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    setAudioProgress(0); setUploadErr("");
    try { setAudio(await onUploadAudio(f, setAudioProgress)); } catch (err) { setUploadErr(t("song.audioUploadFailedPre") + (err && err.message ? err.message : t("error.unknown"))); }
    setAudioProgress(null); e.target.value = "";
  };
  const ok = title.trim().length > 0 && !!audio;
  return (
    <div className="fixed inset-0 z-[60] flex sm:items-center justify-center items-end" style={{ background: "rgba(6,7,12,.55)", backdropFilter: "blur(4px)", height: vph ? vph + "px" : "100dvh" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-[520px] sm:rounded-3xl rounded-t-3xl overflow-y-auto" style={{ background: C.surface, boxShadow: SH.pop, maxHeight: vph ? vph + "px" : "88vh" }}>
        <div className="flex items-center justify-between px-4 py-3.5 sticky top-0" style={{ background: C.surface, borderBottom: `1px solid ${C.lineSoft}` }}>
          <button onClick={onClose} style={{ color: C.muted }}><X size={22} /></button>
          <span className="font-bold" style={{ color: C.ink, fontFamily: DISPLAY }}>{initial ? t("song.editTitle") : t("song.addTitle")}</span>
          <button disabled={!ok} onClick={() => onCreate({ title: title.trim(), artist: artist.trim(), genre, cover, audio })} className="px-4 py-1.5 rounded-full text-sm font-bold" style={{ backgroundImage: GBRAND, color: "#fff", opacity: ok ? 1 : 0.4 }}>{initial ? t("action.save") : t("action.add")}</button>
        </div>
        <div className="p-4 space-y-3.5" style={{ paddingBottom: "calc(var(--mz-nav, 64px) + 1.25rem)" }}>
          {uploadErr && <div className="px-3 py-2 rounded-xl text-[12.5px] font-semibold" style={{ background: C.like + "1a", color: C.like }}>{uploadErr}</div>}
          <div className="flex gap-2 items-center flex-wrap">
            <input ref={coverRef} type="file" accept="image/*" hidden onChange={pickCover} />
            <button onClick={() => coverRef.current && coverRef.current.click()} disabled={uploadingCover} className="rounded-xl flex flex-col items-center justify-center shrink-0 active:scale-95" style={{ width: 72, height: 72, background: C.accentSoft, color: C.accentText }}>{uploadingCover ? <span className="text-[11px] font-bold">{coverProgress}%</span> : <><Upload size={20} /><span className="text-[10px] font-bold mt-0.5 text-center">{t("song.coverWord")}</span></>}</button>
            {cover && <div className="rounded-xl overflow-hidden shrink-0 relative" style={{ width: 72, height: 72, outline: `2.5px solid ${C.accent}`, outlineOffset: 2 }}><Pic src={cover} className="w-full h-full" /><button onClick={() => setCover("")} className="absolute -top-1 -right-1 rounded-full flex items-center justify-center" style={{ width: 18, height: 18, background: C.ink, color: "#fff" }}><X size={11} /></button></div>}
            {!cover && !uploadingCover && <span className="text-[12px]" style={{ color: C.faint }}>{t("song.addCoverHint")}</span>}
          </div>
          {uploadingCover && <UploadProgress pct={coverProgress} label={t("song.coverWord")} />}
          <div className="flex gap-2 items-center flex-wrap">
            <input ref={audioRef} type="file" accept="audio/*" hidden onChange={pickAudio} />
            <button onClick={() => audioRef.current && audioRef.current.click()} disabled={uploadingAudio} className="rounded-xl flex flex-col items-center justify-center shrink-0 active:scale-95" style={{ width: 72, height: 72, background: C.accentSoft, color: C.accentText }}>{uploadingAudio ? <span className="text-[11px] font-bold">{audioProgress}%</span> : <><Upload size={20} /><span className="text-[10px] font-bold mt-0.5 text-center">{t("song.audioWord")}</span></>}</button>
            {audio && <div className="rounded-xl overflow-hidden shrink-0 relative flex items-center justify-center" style={{ width: 72, height: 72, background: "#000", outline: `2.5px solid ${C.accent}`, outlineOffset: 2 }}><Play size={22} color="#fff" fill="#fff" /><button onClick={() => setAudio("")} className="absolute -top-1 -right-1 rounded-full flex items-center justify-center" style={{ width: 18, height: 18, background: C.ink, color: "#fff" }}><X size={11} /></button></div>}
            {!audio && !uploadingAudio && <span className="text-[12px]" style={{ color: C.faint }}>{t("song.uploadAudioHint")}</span>}
          </div>
          {uploadingAudio && <UploadProgress pct={audioProgress} label={t("song.audioWord")} />}
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("song.namePh")} className="w-full px-3.5 py-3 rounded-xl outline-none text-[15px]" style={{ background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` }} />
          <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder={t("song.artistPh")} className="w-full px-3.5 py-3 rounded-xl outline-none text-[15px]" style={{ background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` }} />
          <div className="flex gap-1.5 flex-wrap">{MUSIC_GENRES.slice(1).map((g) => <button key={g} onClick={() => setGenre(g)} className="px-3 py-1.5 rounded-full text-sm font-semibold transition" style={genre === g ? { background: C.accentSoft, color: C.accentText } : { background: C.surfaceMuted, color: C.muted }}>{g}</button>)}</div>
        </div>
      </div>
    </div>
  );
}

function getSongSorts() { return [["new", t("sort.newShort")], ["popular", t("sort.popularShort")]]; }

export function MusicPage({ songs, nowPlaying, isPlaying, onPlay, onNew, onEdit, onDelete, onUpload, onUploadAudio }) {
  const [genre, setGenre] = useState("ყველა");
  const [artistQ, setArtistQ] = useState("");
  const [sort, setSort] = useState("new");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const list = songs
    .filter((s) => genre === "ყველა" || s.genre === genre)
    .filter((s) => !artistQ.trim() || s.title.toLowerCase().includes(artistQ.trim().toLowerCase()) || (s.artist || "").toLowerCase().includes(artistQ.trim().toLowerCase()))
    .slice()
    .sort((a, b) => (sort === "popular" ? b.plays - a.plays : new Date(b.createdAt) - new Date(a.createdAt)));

  return (
    <div className="pb-28 md:pb-10">
      <div className="flex items-center justify-between px-4 pt-5 pb-3"><Title>{t("nav.music")}</Title>
        <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-bold text-white active:scale-95" style={{ backgroundImage: GBRAND, boxShadow: SH.glow }}><Plus size={16} /> {t("word.song")}</button>
      </div>
      <div className="px-4 pb-3"><input value={artistQ} onChange={(e) => setArtistQ(e.target.value)} placeholder={t("songs.searchPh")} className="w-full px-4 py-2.5 rounded-full text-[14px] outline-none" style={{ background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` }} /></div>
      <div className="flex gap-1 px-4 pb-3">{getSongSorts().map(([k, l]) => <button key={k} onClick={() => setSort(k)} className="flex-1 py-2 rounded-xl text-[13px] font-bold transition" style={sort === k ? { background: C.accentSoft, color: C.accentText } : { background: C.surfaceMuted, color: C.muted }}>{l}</button>)}</div>
      <Chips items={MUSIC_GENRES} value={genre} onChange={setGenre} />
      {list.length ? (
        <div className="space-y-2 px-3">
          {list.map((s) => {
            const playingThis = nowPlaying && nowPlaying.id === s.id && isPlaying;
            const own = s.authorId === ME;
            return (
              <div key={s.id} className="flex items-center gap-3 p-2.5" style={card()}>
                <div className="relative shrink-0 rounded-xl overflow-hidden" style={{ width: 52, height: 52 }}>
                  <Pic src={s.cover} grad={GRADS[hashIdx(s.id, GRADS.length)]} className="w-full h-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold truncate" style={{ color: C.ink }}>{s.title}</div>
                  <div className="text-[12.5px] truncate" style={{ color: C.muted }}>{s.artist || t("song.unknownArtist")}</div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[11px]" style={{ color: C.faint }}><span className="rounded px-1.5 py-0.5" style={{ background: C.accentSoft, color: C.accentText, fontSize: 10, fontWeight: 700 }}>{s.genre}</span><Mono>{s.plays} {t("song.playsSuffix")}</Mono></div>
                </div>
                {own && <button onClick={() => setEditing(s)} className="shrink-0 active:scale-90" style={{ color: C.ink2 }}><Pencil size={17} /></button>}
                {own && <button onClick={() => setConfirmDel(s)} className="shrink-0 active:scale-90" style={{ color: C.like }}><Trash2 size={17} /></button>}
                <button onClick={() => onPlay(s)} className="shrink-0 rounded-full flex items-center justify-center active:scale-90" style={{ width: 40, height: 40, backgroundImage: GBRAND, color: "#fff", boxShadow: SH.glow }}>{playingThis ? <Pause size={18} fill="#fff" /> : <Play size={18} fill="#fff" style={{ marginLeft: 1 }} />}</button>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty icon={Music} t={t("songs.notFound")} s={t("songs.addFirstOrFilter")} />
      )}
      {creating && <NewSong onClose={() => setCreating(false)} onUpload={onUpload} onUploadAudio={onUploadAudio} onCreate={(d) => { onNew(d); setCreating(false); }} />}
      {editing && <NewSong initial={editing} onClose={() => setEditing(null)} onUpload={onUpload} onUploadAudio={onUploadAudio} onCreate={(d) => { onEdit(editing.id, { title: d.title, artist: d.artist, genre: d.genre, cover_url: d.cover || null, audio_url: d.audio }); setEditing(null); }} />}
      {confirmDel && <ConfirmDialog title={t("song.deleteTitle")} msg={t("song.deleteMsg")} onCancel={() => setConfirmDel(null)} onConfirm={() => { onDelete(confirmDel.id); setConfirmDel(null); }} />}
    </div>
  );
}
