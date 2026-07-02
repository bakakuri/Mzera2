import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft, X, Star, Plus, Pencil, Trash2, Bookmark, Check, Upload, ChevronRight, Clapperboard,
  C, SH, card, Tilt, DISPLAY, MONO, GBRAND, Mono, GRADS, hashIdx, Pic, Avatar, Name, Title, Chips, Empty, Stars, FILM_GENRES, USERS, ME,
} from "./core";

function ConfirmDialog({ title, msg, confirmText = "წაშლა", onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6" style={{ background: "rgba(6,7,12,.6)", backdropFilter: "blur(4px)" }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[360px] rounded-3xl p-6 text-center" style={{ background: C.surface, boxShadow: SH.pop }}>
        <div className="rounded-full flex items-center justify-center mx-auto mb-3.5" style={{ width: 60, height: 60, background: C.like + "1f" }}><Trash2 size={28} style={{ color: C.like }} /></div>
        <div className="text-[18px] font-bold" style={{ color: C.ink, fontFamily: DISPLAY }}>{title}</div>
        <div className="text-[14px] mt-1.5" style={{ color: C.muted, lineHeight: 1.5 }}>{msg}</div>
        <div className="flex gap-2.5 mt-5">
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl font-bold text-[14px] active:scale-[.98]" style={{ background: C.surfaceMuted, color: C.ink2 }}>გაუქმება</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl font-bold text-[14px] text-white active:scale-[.98]" style={{ background: C.like }}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

function NewFilm({ onClose, onCreate, onUpload, initial }) {
  const [title, setTitle] = useState(initial ? initial.title : "");
  const [year, setYear] = useState(initial ? String(initial.year || "") : "");
  const [genre, setGenre] = useState(initial ? initial.genre : "დრამა");
  const [desc, setDesc] = useState(initial ? initial.desc : "");
  const [picked, setPicked] = useState(initial && initial.poster ? initial.poster : "");
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [vph, setVph] = useState(null);
  useEffect(() => { const vv = window.visualViewport; if (!vv) return; const onR = () => setVph(vv.height); onR(); vv.addEventListener("resize", onR); vv.addEventListener("scroll", onR); return () => { vv.removeEventListener("resize", onR); vv.removeEventListener("scroll", onR); }; }, []);
  const pickFile = async (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    setUploading(true);
    try { setPicked(await onUpload(f)); } catch (err) {}
    setUploading(false); e.target.value = "";
  };
  const ok = title.trim().length > 0;
  return (
    <div className="fixed inset-0 z-[60] flex sm:items-center justify-center items-end" style={{ background: "rgba(6,7,12,.55)", backdropFilter: "blur(4px)", height: vph ? vph + "px" : "100dvh" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-[520px] sm:rounded-3xl rounded-t-3xl overflow-y-auto" style={{ background: C.surface, boxShadow: SH.pop, maxHeight: vph ? vph + "px" : "88vh" }}>
        <div className="flex items-center justify-between px-4 py-3.5 sticky top-0" style={{ background: C.surface, borderBottom: `1px solid ${C.lineSoft}` }}>
          <button onClick={onClose} style={{ color: C.muted }}><X size={22} /></button>
          <span className="font-bold" style={{ color: C.ink, fontFamily: DISPLAY }}>{initial ? "ფილმის რედაქტირება" : "ფილმის დამატება"}</span>
          <button disabled={!ok} onClick={() => onCreate({ title: title.trim(), year: year ? Number(year) : null, genre, desc: desc.trim(), poster: picked })} className="px-4 py-1.5 rounded-full text-sm font-bold" style={{ backgroundImage: GBRAND, color: "#fff", opacity: ok ? 1 : 0.4 }}>{initial ? "შენახვა" : "დამატება"}</button>
        </div>
        <div className="p-4 space-y-3.5" style={{ paddingBottom: "calc(var(--mz-nav, 64px) + 1.25rem)" }}>
          <div className="flex gap-2 items-center flex-wrap">
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickFile} />
            <button onClick={() => fileRef.current && fileRef.current.click()} disabled={uploading} className="rounded-xl flex flex-col items-center justify-center shrink-0 active:scale-95" style={{ width: 72, height: 96, background: C.accentSoft, color: C.accentText }}>{uploading ? <span className="text-[10px] font-bold">…</span> : <><Upload size={20} /><span className="text-[10px] font-bold mt-0.5 text-center">პოსტერი</span></>}</button>
            {picked && <div className="rounded-xl overflow-hidden shrink-0 relative" style={{ width: 72, height: 96, outline: `2.5px solid ${C.accent}`, outlineOffset: 2 }}><Pic src={picked} className="w-full h-full" /><button onClick={() => setPicked("")} className="absolute -top-1 -right-1 rounded-full flex items-center justify-center" style={{ width: 18, height: 18, background: C.ink, color: "#fff" }}><X size={11} /></button></div>}
            {!picked && <span className="text-[12px]" style={{ color: C.faint }}>დაამატე პოსტერი (არასავალდებულო) 🎬</span>}
          </div>
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ფილმის სახელი" className="w-full px-3.5 py-3 rounded-xl outline-none text-[15px]" style={{ background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` }} />
          <input value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" placeholder="გამოშვების წელი" className="w-full px-3.5 py-3 rounded-xl outline-none text-[15px]" style={{ background: C.surfaceMuted, color: C.ink, fontFamily: MONO, border: `1px solid ${C.line}` }} />
          <div className="flex gap-1.5 flex-wrap">{FILM_GENRES.slice(1).map((g) => <button key={g} onClick={() => setGenre(g)} className="px-3 py-1.5 rounded-full text-sm font-semibold transition" style={genre === g ? { background: C.accentSoft, color: C.accentText } : { background: C.surfaceMuted, color: C.muted }}>{g}</button>)}</div>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="მოკლე აღწერა/სიუჟეტი…" className="w-full resize-none px-3.5 py-3 rounded-xl outline-none text-[15px]" style={{ background: C.surfaceMuted, color: C.ink2, border: `1px solid ${C.line}`, lineHeight: 1.5 }} />
        </div>
      </div>
    </div>
  );
}

export function Movies({ films, watch, onNew, onEdit, onDelete, onOpenProfile, flash, onUpload, getReviews, onAddReview, onSetWatch, onClearWatch, sentinelRef, hasMore, loadingMore }) {
  const [genre, setGenre] = useState("ყველა");
  const [year, setYear] = useState("");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [reviews, setReviews] = useState({});
  const [writing, setWriting] = useState(false);
  const [rStars, setRStars] = useState(5);
  const [rText, setRText] = useState("");

  useEffect(() => {
    if (!openId || !getReviews) return;
    getReviews(openId).then((list) => setReviews((rv) => ({ ...rv, [openId]: list }))).catch(() => {});
  }, [openId]);

  const it = films.find((f) => f.id === openId);

  const addReview = (filmId) => {
    if (!rText.trim()) return;
    const txt = rText.trim();
    setReviews((rv) => ({ ...rv, [filmId]: [{ id: "rv" + Date.now(), authorId: ME, rating: rStars, text: txt, time: "ახლა" }, ...(rv[filmId] || [])] }));
    if (onAddReview) onAddReview(filmId, rStars, txt).catch(() => {});
    setRText(""); setRStars(5); setWriting(false);
    flash && flash("შეფასება დაემატა ⭐");
  };

  if (it) {
    const u = USERS[it.authorId];
    const revs = reviews[it.id] || [];
    const avg = revs.length ? revs.reduce((a, r) => a + r.rating, 0) / revs.length : 0;
    const myStatus = watch[it.id];
    return (
      <div className="pb-36 md:pb-10">
        <div className="flex items-center gap-3 px-4 py-3 sticky top-0 z-10" style={{ background: C.paper + "e6", backdropFilter: "blur(12px)" }}>
          <button onClick={() => setOpenId(null)} style={{ color: C.ink2 }}><ArrowLeft size={22} /></button>
          <span className="font-bold truncate flex-1" style={{ color: C.ink, fontFamily: DISPLAY }}>{it.title}</span>
          {it.authorId === ME && <><button onClick={() => setEditing(it)} className="active:scale-90" style={{ color: C.ink2 }}><Pencil size={20} /></button><button onClick={() => setConfirmDel(true)} className="active:scale-90" style={{ color: C.like }}><Trash2 size={20} /></button></>}
        </div>
        <div className="flex gap-4 px-4 pt-1">
          <Pic src={it.poster} grad={GRADS[hashIdx(it.id, GRADS.length)]} className="rounded-2xl shrink-0" style={{ width: 128, aspectRatio: "2/3" }} />
          <div className="min-w-0 flex-1 pt-1">
            <h2 className="text-[19px]" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700, lineHeight: 1.25 }}>{it.title}</h2>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {it.year && <Mono style={{ fontSize: 13, color: C.faint }}>{it.year}</Mono>}
              <span className="rounded-md px-1.5 py-0.5 text-[11px] font-bold" style={{ background: C.accentSoft, color: C.accentText }}>{it.genre}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2.5"><Stars n={Math.round(avg)} size={14} /><Mono style={{ fontSize: 12.5, color: C.muted }}>{avg ? avg.toFixed(1) : "—"} · {revs.length} შეფასება</Mono></div>
            <div className="flex gap-1.5 mt-3">
              <button onClick={() => onSetWatch(it.id, "watchlist")} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12.5px] font-bold active:scale-95 transition" style={myStatus === "watchlist" ? { backgroundImage: GBRAND, color: "#fff" } : { background: C.surfaceMuted, color: C.ink2 }}><Bookmark size={14} fill={myStatus === "watchlist" ? "#fff" : "none"} /> სანახავი</button>
              <button onClick={() => onSetWatch(it.id, "watched")} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12.5px] font-bold active:scale-95 transition" style={myStatus === "watched" ? { backgroundImage: GBRAND, color: "#fff" } : { background: C.surfaceMuted, color: C.ink2 }}><Check size={14} /> ნანახი</button>
            </div>
            {myStatus && <button onClick={() => onClearWatch(it.id)} className="text-[11.5px] mt-1.5" style={{ color: C.faint }}>მონიშვნის მოხსნა</button>}
          </div>
        </div>
        <div className="px-4 mt-4">
          {it.desc && <div className="text-[14.5px]" style={{ color: C.ink2, lineHeight: 1.6 }}>{it.desc}</div>}
          <button onClick={() => onOpenProfile(u.id)} className="w-full flex items-center gap-3 mt-4 p-3.5" style={card()}><Avatar id={u.id} size={40} /><div className="flex-1 text-left"><Name id={u.id} className="text-[14px]" /><div className="text-[12px]" style={{ color: C.faint }}>დაამატა {it.time}</div></div><ChevronRight size={20} style={{ color: C.faint }} /></button>

          <div className="flex items-center justify-between mt-6 mb-3"><h3 className="text-[16px]" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700 }}>შეფასებები</h3><button onClick={() => setWriting((w) => !w)} className="text-sm font-bold flex items-center gap-1" style={{ color: C.accent }}><Plus size={16} /> დაწერე</button></div>
          {writing && (
            <div className="p-3.5 mb-3" style={card()}>
              <div className="flex items-center gap-2 mb-2"><span className="text-[13px]" style={{ color: C.muted }}>შენი შეფასება:</span><div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((i) => <button key={i} onClick={() => setRStars(i)} className="active:scale-110"><Star size={22} style={{ color: C.star }} fill={i <= rStars ? C.star : "none"} /></button>)}</div></div>
              <textarea value={rText} onChange={(e) => setRText(e.target.value)} rows={2} placeholder="დაწერე შენი შთაბეჭდილება…" className="w-full resize-none px-3 py-2.5 rounded-xl outline-none text-[14px]" style={{ background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` }} />
              <button onClick={() => addReview(it.id)} disabled={!rText.trim()} className="mt-2 w-full py-2.5 rounded-xl text-sm font-bold" style={{ backgroundImage: GBRAND, color: "#fff", opacity: rText.trim() ? 1 : 0.4 }}>გამოქვეყნება</button>
            </div>
          )}
          <div className="space-y-2.5">
            {revs.length ? revs.map((r) => (
              <div key={r.id} className="p-3.5" style={card()}>
                <div className="flex items-center gap-2.5"><button onClick={() => onOpenProfile(r.authorId)}><Avatar id={r.authorId} size={34} /></button><div className="flex-1 min-w-0"><Name id={r.authorId} className="text-[14px]" /><div className="flex items-center gap-2"><Stars n={r.rating} size={11} /><Mono style={{ fontSize: 11, color: C.faint }}>{r.time}</Mono></div></div></div>
                {r.text && <div className="text-[14px] mt-2" style={{ color: C.ink2, lineHeight: 1.5 }}>{r.text}</div>}
              </div>
            )) : <Empty icon={Star} t="ჯერ შეფასება არ არის" s="იყავი პირველი." />}
          </div>
        </div>
        {editing && <NewFilm initial={editing} onClose={() => setEditing(null)} onUpload={onUpload} onCreate={(d) => { onEdit && onEdit(editing.id, { title: d.title, year: d.year, genre: d.genre, description: d.desc, poster_url: d.poster || null }); setEditing(null); }} />}
        {confirmDel && <ConfirmDialog title="ფილმის წაშლა" msg="ნამდვილად წაშლი ამ ფილმს? შეფასებებიც წაიშლება." onCancel={() => setConfirmDel(false)} onConfirm={() => { onDelete && onDelete(it.id); setConfirmDel(false); setOpenId(null); }} />}
      </div>
    );
  }

  const list = films
    .filter((f) => genre === "ყველა" || f.genre === genre)
    .filter((f) => !year || String(f.year) === year)
    .filter((f) => !q.trim() || f.title.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="pb-28 md:pb-10">
      <div className="flex items-center justify-between px-4 pt-5 pb-3"><Title>ფილმები</Title><button onClick={() => setCreating(true)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-bold text-white active:scale-95" style={{ backgroundImage: GBRAND, boxShadow: SH.glow }}><Plus size={16} /> ფილმი</button></div>
      <div className="flex gap-2 px-4 pb-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ძებნა სახელით…" className="flex-1 px-4 py-2.5 rounded-full text-[14px] outline-none" style={{ background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` }} />
        <input value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" placeholder="წელი" className="w-[84px] px-3 py-2.5 rounded-full text-[14px] outline-none text-center" style={{ background: C.surfaceMuted, color: C.ink, fontFamily: MONO, border: `1px solid ${C.line}` }} />
      </div>
      <Chips items={FILM_GENRES} value={genre} onChange={setGenre} />
      {list.length ? (
        <div className="grid grid-cols-2 gap-2.5 px-3">
          {list.map((f) => {
            const revs = reviews[f.id] || [];
            const avg = revs.length ? revs.reduce((a, r) => a + r.rating, 0) / revs.length : 0;
            const status = watch[f.id];
            return (
              <Tilt key={f.id} max={8} radius={18} style={card()}>
                <button onClick={() => setOpenId(f.id)} className="block w-full text-left overflow-hidden rounded-[18px] active:scale-[.98] transition">
                  <div className="relative w-full">
                    <Pic src={f.poster} grad={GRADS[hashIdx(f.id, GRADS.length)]} style={{ aspectRatio: "2/3" }} className="w-full" />
                    {status === "watched" && <div className="absolute top-2 right-2 rounded-full flex items-center justify-center" style={{ width: 24, height: 24, background: "rgba(0,0,0,.6)" }}><Check size={13} color="#fff" /></div>}
                    {status === "watchlist" && <div className="absolute top-2 right-2 rounded-full flex items-center justify-center" style={{ width: 24, height: 24, background: "rgba(0,0,0,.6)" }}><Bookmark size={12} color="#fff" fill="#fff" /></div>}
                  </div>
                  <div className="p-2.5">
                    <div className="text-[13px] line-clamp-1 font-semibold" style={{ color: C.ink }}>{f.title}</div>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px]" style={{ color: C.faint }}>
                      {f.year && <Mono>{f.year}</Mono>}
                      <span className="truncate">· {f.genre}</span>
                    </div>
                  </div>
                </button>
              </Tilt>
            );
          })}
        </div>
      ) : (
        <Empty icon={Clapperboard} t="ფილმი ვერ მოიძებნა" s="დაამატე პირველი ფილმი ან შეცვალე ფილტრი." />
      )}
      {hasMore && <div ref={sentinelRef} className="flex justify-center items-center" style={{ minHeight: 60, paddingTop: 8 }}><div style={{ width: 24, height: 24, border: `3px solid ${C.lineSoft}`, borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /></div>}
      {creating && <NewFilm onClose={() => setCreating(false)} onUpload={onUpload} onCreate={(d) => { onNew(d); setCreating(false); }} />}
    </div>
  );
}
