import {
  useState, useEffect, useRef, Home, Search, Compass, PlusSquare, Send, Bell, User, Shield, Heart, MessageCircle, MessageSquare, Bookmark, MoreHorizontal, X, ArrowLeft, Hash, TrendingUp, Check, Trash2, Flag, Camera, Settings, AlertTriangle, ImageIcon, MapPin, Map, Link2, ShieldCheck, Plus, Minus, Menu, LogOut, HelpCircle, ChevronRight, Zap, Sun, Moon, ShoppingBag, Tag, Star, Eye, Navigation, Users, Film, Mic, Play, Pause, Smile, FileText, Download, UserPlus, Trophy, Upload, Volume2, VolumeX, Pencil, CornerUpLeft, Copy, Reply, authApi, profilesApi, postsApi, reactionsApi, commentsApi, followsApi, chatApi, notifsApi, storageApi, storiesApi, reelsApi, marketApi, groupsApi, eventsApi, forumApi, highlightsApi, presenceApi, locationsApi, pollsApi, hasSupabase, PAL, DARK, C, GBRAND, SH, card, DISPLAY, BODY, MONO, Mono, GRADS, hashIdx, img, catColor, FALLBACK_USER, _users, USERS, ME, fmtN, computeTrends, REPLIES, MARKET_CATS, FORUM_CATS, Pic, Avatar, Dot, Name, Handle, IconBtn, Pill, Wordmark, Title, Chips, renderText, Empty, ThemeToggle, REACTIONS, StoryRow, MiniPost, NewThread, Stars, Checkout, NewListing, GroupAvatar, waveOf, dl, VoiceMsg, DocMsg, EMOJIS, EmojiPanel, PeoplePicker, convMembers, convIsGroup, msgPreview, FollowBtn, FollowList, timeAgo, mergeProfile, mapDbPost, msgClock, mapDbMsg, toDbMsg, mapDbNotif, resolveImg, hydrateAuthors, mapDbStories, mapDbReel, mapDbThread, KA_MONS, mapDbListing, mapDbReview, mapDbGroup, mapDbEvent, ConfigError, LoadingScreen, AuthScreen, HighlightCreate, HighlightView, ReelComments, pushNotif, ensureNotifPerm, NOTIF_VERB, levelInfo, kfmt, RSVP_OPTS, ReelCard, ReelCreate, GroupPost, MiniMap, Switch, SettingsSection, SettingsRow, FILTERS, STORY_STICKERS, setTheme, setME,
} from "./core";

function ConfirmDialog({ title, msg, confirmText = "წაშლა", onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6" style={{ background: "rgba(6,7,12,.6)", backdropFilter: "blur(4px)" }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-[360px] rounded-3xl p-6 text-center" style={{ background: C.surface, boxShadow: SH.pop }}>
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

export function Forum({ threads, onReply, onVote, onNew, onOpenProfile, onEdit, onDelete }) {
  const [cat, setCat] = useState("ყველა"); const [openId, setOpenId] = useState(null); const [creating, setCreating] = useState(false); const [draft, setDraft] = useState(""); const [editing, setEditing] = useState(null); const [confirmDel, setConfirmDel] = useState(false);
  const th = threads.find(t => t.id === openId);
  if (th) {
    const u = USERS[th.authorId];
    const send = () => { if (!draft.trim()) return; onReply(th.id, draft.trim()); setDraft(""); };
    return (
      <div className="pb-36 md:pb-10">
        <div className="flex items-center gap-3 px-4 py-3 sticky top-0 z-10" style={{ background: C.paper + "e6", backdropFilter: "blur(12px)" }}><button onClick={() => setOpenId(null)} style={{ color: C.ink2 }}><ArrowLeft size={22} /></button><span className="font-bold flex-1" style={{ color: C.ink, fontFamily: DISPLAY }}>თემა</span>{th.authorId === ME && <><button onClick={() => setEditing(th)} className="active:scale-90" style={{ color: C.ink2 }}><Pencil size={19} /></button><button onClick={() => setConfirmDel(true)} className="active:scale-90" style={{ color: C.like }}><Trash2 size={19} /></button></>}</div>
        <div className="px-3">
          <div className="p-4" style={card()}>
            <span className="rounded-lg px-2 py-1 text-[11px] font-bold uppercase" style={{ background: catColor(th.cat) + "1f", color: catColor(th.cat), fontFamily: MONO }}>{th.cat}</span>
            <h2 className="text-[19px] mt-2.5 mb-2" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700, lineHeight: 1.3 }}>{th.title}</h2>
            <div className="text-[15px]" style={{ color: C.ink2, lineHeight: 1.55 }}>{th.body}</div>
            <div className="flex items-center gap-2.5 mt-3.5 pt-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
              <button onClick={() => onOpenProfile(u.id)}><Avatar id={u.id} size={34} /></button>
              <div className="flex-1 min-w-0 leading-tight"><Name id={u.id} className="text-[14px]" /><div><Handle h={u.handle} t={th.time} /></div></div>
              <button onClick={() => onVote(th.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-full active:scale-95 transition" style={th.likedByMe ? { backgroundImage: GBRAND, color: "#fff" } : { background: C.surfaceMuted, color: C.ink2 }}><TrendingUp size={17} /><Mono className="text-sm font-bold">{th.votes}</Mono></button>
            </div>
          </div>
          <div className="flex items-center gap-2 px-1 mt-5 mb-2"><MessageSquare size={16} style={{ color: C.muted }} /><span className="text-sm font-bold" style={{ color: C.ink }}>{th.replies.length} პასუხი</span></div>
          <div className="space-y-2.5">
            {th.replies.length ? th.replies.map(r => (
              <div key={r.id} className="p-3.5 flex gap-3" style={card()}>
                <button onClick={() => onOpenProfile(r.authorId)}><Avatar id={r.authorId} size={36} /></button>
                <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><Name id={r.authorId} className="text-[14px]" /><Mono style={{ color: C.faint, fontSize: 12 }}>{r.time}</Mono></div><div className="text-[14px] mt-1" style={{ color: C.ink2, lineHeight: 1.5 }}>{r.text}</div><div className="flex items-center gap-1.5 mt-2 text-[13px]" style={{ color: C.faint }}><Heart size={14} /> <Mono>{r.likes}</Mono></div></div>
              </div>
            )) : <Empty icon={MessageSquare} t="ჯერ პასუხი არ არის" s="დაწერე პირველი პასუხი ქვემოთ." />}
          </div>
        </div>
        <div className="fixed bottom-0 inset-x-0 z-30 md:static" style={{ background: C.surface, borderTop: `1px solid ${C.line}`, paddingBottom: "calc(var(--mz-nav, 64px) + 0.6rem)" }}>
          <div className="flex items-center gap-2 px-3 py-2.5 max-w-[600px] mx-auto"><Avatar id={ME} size={32} /><input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="დაწერე პასუხი…" className="flex-1 px-4 py-2.5 rounded-full text-[15px] outline-none" style={{ background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` }} /><button onClick={send} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 42, height: 42, backgroundImage: GBRAND, color: "#fff", boxShadow: SH.glow, opacity: draft.trim() ? 1 : 0.5 }}><Send size={19} /></button></div>
        </div>
        {editing && <NewThread initial={{ title: editing.title, body: editing.body, cat: editing.cat }} onClose={() => setEditing(null)} onCreate={(d) => { onEdit && onEdit(editing.id, { title: d.title, body: d.body, category: d.cat }); setEditing(null); }} />}
        {confirmDel && <ConfirmDialog title="თემის წაშლა" msg="ნამდვილად წაშლი ამ თემას?" onCancel={() => setConfirmDel(false)} onConfirm={() => { onDelete && onDelete(th.id); setConfirmDel(false); setOpenId(null); }} />}
      </div>
    );
  }
  const list = cat === "ყველა" ? threads : threads.filter(t => t.cat === cat);
  return (
    <div className="pb-28 md:pb-10">
      <div className="flex items-center justify-between px-4 pt-5 pb-3"><Title>ფორუმი</Title><Pill tone="solid" onClick={() => setCreating(true)}>+ თემა</Pill></div>
      <Chips items={FORUM_CATS} value={cat} onChange={setCat} />
      <div className="space-y-2.5 px-3">
        {list.map(t => { const u = USERS[t.authorId]; return (
          <button key={t.id} onClick={() => setOpenId(t.id)} className="w-full text-left p-4 transition active:scale-[.99]" style={card()}>
            <div className="flex items-center gap-2 mb-2"><span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase" style={{ background: catColor(t.cat) + "1f", color: catColor(t.cat), fontFamily: MONO }}>{t.cat}</span><Mono style={{ color: C.faint, fontSize: 11 }}>· {t.time}</Mono></div>
            <div className="text-[16px] mb-1" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700, lineHeight: 1.3 }}>{t.title}</div>
            <div className="text-[14px] line-clamp-2 mb-3" style={{ color: C.muted, lineHeight: 1.5 }}>{t.body}</div>
            <div className="flex items-center gap-3"><Avatar id={u.id} size={26} /><span className="text-[13px] font-semibold" style={{ color: C.ink2 }}>{u.name.split(" ")[0]}</span><div className="flex-1" /><span className="flex items-center gap-1" style={{ color: C.faint }}><TrendingUp size={14} /><Mono className="text-[13px]">{t.votes}</Mono></span><span className="flex items-center gap-1" style={{ color: C.faint }}><MessageSquare size={14} /><Mono className="text-[13px]">{t.replies.length}</Mono></span><span className="flex items-center gap-1" style={{ color: C.faint }}><Eye size={14} /><Mono className="text-[13px]">{t.views}</Mono></span></div>
          </button>
        ); })}
      </div>
      {creating && <NewThread onClose={() => setCreating(false)} onCreate={(d) => { onNew(d); setCreating(false); }} />}
    </div>
  );
}

export function Market({ listings, onSave, onNew, onMessage, onOpenProfile, flash, live, onOrder, getReviews, onAddReview, onUpload, onEdit, onDelete }) {
  const [cat, setCat] = useState("ყველა"); const [openId, setOpenId] = useState(null); const [creating, setCreating] = useState(false); const [checkout, setCheckout] = useState(null); const [editing, setEditing] = useState(null); const [confirmDel, setConfirmDel] = useState(false);
  const [reviews, setReviews] = useState({}); const [writing, setWriting] = useState(false); const [rStars, setRStars] = useState(5); const [rText, setRText] = useState("");
  useEffect(() => { if (!openId) return; const it2 = listings.find(l => l.id === openId); if (!it2 || !getReviews) return; const sid = it2.sellerId; getReviews(sid).then(list => setReviews(rv => ({ ...rv, [sid]: list }))).catch(() => {}); }, [openId]);
  const it = listings.find(l => l.id === openId);
  const addReview = (sellerId) => { if (!rText.trim()) return; const txt = rText.trim(); setReviews(rv => ({ ...rv, [sellerId]: [{ id: "rv" + Date.now(), authorId: ME, rating: rStars, text: txt, time: "ახლა" }, ...(rv[sellerId] || [])] })); if (onAddReview) onAddReview(sellerId, rStars, txt).catch(() => {}); setRText(""); setRStars(5); setWriting(false); flash && flash("შეფასება დაემატა ⭐"); };
  if (it) {
    const u = USERS[it.sellerId]; const revs = reviews[it.sellerId] || []; const avg = revs.length ? (revs.reduce((a, r) => a + r.rating, 0) / revs.length) : 0;
    return (
      <div className="pb-36 md:pb-10">
        <div className="flex items-center gap-3 px-4 py-3 sticky top-0 z-10" style={{ background: C.paper + "e6", backdropFilter: "blur(12px)" }}><button onClick={() => setOpenId(null)} style={{ color: C.ink2 }}><ArrowLeft size={22} /></button><span className="font-bold truncate" style={{ color: C.ink, fontFamily: DISPLAY }}>{it.title}</span><div className="flex-1" />{it.sellerId === ME && <><button onClick={() => setEditing(it)} className="active:scale-90" style={{ color: C.ink2 }}><Pencil size={20} /></button><button onClick={() => setConfirmDel(true)} className="active:scale-90" style={{ color: C.like }}><Trash2 size={20} /></button></>}<button onClick={() => onSave(it.id)} style={{ color: it.savedByMe ? C.accent : C.ink2 }}><Bookmark size={22} fill={it.savedByMe ? C.accent : "none"} /></button></div>
        {it.video ? <video src={it.video} controls playsInline className="w-full" style={{ aspectRatio: "4/3", objectFit: "cover", background: "#000" }} /> : <Pic src={it.image} grad={GRADS[hashIdx(it.id, GRADS.length)]} className="w-full" style={{ aspectRatio: "4/3" }} />}
        <div className="px-4 pt-4">
          <div className="flex items-baseline gap-2"><span style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700, fontSize: 30 }}>{it.price.toLocaleString()}</span><span style={{ color: C.accent, fontSize: 22, fontWeight: 700 }}>₾</span></div>
          <h2 className="text-[18px] mt-1" style={{ color: C.ink, fontWeight: 700 }}>{it.title}</h2>
          <div className="flex items-center gap-3 mt-2 text-[13px]" style={{ color: C.faint }}><span className="flex items-center gap-1"><MapPin size={14} /> {it.location}</span><Mono>· {it.time}</Mono></div>
          <div className="text-[15px] mt-4" style={{ color: C.ink2, lineHeight: 1.6 }}>{it.desc}</div>
          <button onClick={() => onOpenProfile(u.id)} className="w-full flex items-center gap-3 mt-4 p-3.5" style={card()}><Avatar id={u.id} size={44} /><div className="flex-1 text-left"><Name id={u.id} className="text-[15px]" /><div className="flex items-center gap-1.5 mt-0.5"><Stars n={Math.round(avg)} size={12} /><Mono style={{ fontSize: 12, color: C.muted }}>{avg ? avg.toFixed(1) : "—"} · {revs.length} შეფასება</Mono></div></div><ChevronRight size={20} style={{ color: C.faint }} /></button>

          <div className="flex items-center justify-between mt-6 mb-3"><h3 className="text-[16px]" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700 }}>შეფასებები</h3><button onClick={() => setWriting(w => !w)} className="text-sm font-bold flex items-center gap-1" style={{ color: C.accent }}><Plus size={16} /> დაწერე</button></div>
          {writing && <div className="p-3.5 mb-3" style={card()}><div className="flex items-center gap-2 mb-2"><span className="text-[13px]" style={{ color: C.muted }}>შენი შეფასება:</span><div className="flex gap-0.5">{[1, 2, 3, 4, 5].map(i => <button key={i} onClick={() => setRStars(i)} className="active:scale-110"><Star size={22} style={{ color: C.star }} fill={i <= rStars ? C.star : "none"} /></button>)}</div></div><textarea value={rText} onChange={e => setRText(e.target.value)} rows={2} placeholder="დაწერე შენი გამოცდილება…" className="w-full resize-none px-3 py-2.5 rounded-xl outline-none text-[14px]" style={{ background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` }} /><button onClick={() => addReview(it.sellerId)} disabled={!rText.trim()} className="mt-2 w-full py-2.5 rounded-xl text-sm font-bold" style={{ backgroundImage: GBRAND, color: "#fff", opacity: rText.trim() ? 1 : 0.4 }}>გამოქვეყნება</button></div>}
          <div className="space-y-2.5">{revs.length ? revs.map(r => <div key={r.id} className="p-3.5" style={card()}><div className="flex items-center gap-2.5"><button onClick={() => onOpenProfile(r.authorId)}><Avatar id={r.authorId} size={34} /></button><div className="flex-1 min-w-0"><Name id={r.authorId} className="text-[14px]" /><div className="flex items-center gap-2"><Stars n={r.rating} size={11} /><Mono style={{ fontSize: 11, color: C.faint }}>{r.time}</Mono></div></div></div><div className="text-[14px] mt-2" style={{ color: C.ink2, lineHeight: 1.5 }}>{r.text}</div></div>) : <Empty icon={Star} t="ჯერ შეფასება არ არის" s="იყავი პირველი." />}</div>
        </div>
        <div className="fixed bottom-0 inset-x-0 z-30 md:static flex gap-2 px-4 py-3 max-w-[600px] mx-auto" style={{ background: C.surface, borderTop: `1px solid ${C.line}`, paddingBottom: "calc(var(--mz-nav, 64px) + 0.6rem)" }}>
          <button onClick={() => onMessage(u.id)} className="px-4 py-3 rounded-2xl font-bold flex items-center gap-2" style={{ background: C.surfaceMuted, color: C.ink2 }}><Send size={19} /></button>
          <button onClick={() => setCheckout(it)} className="flex-1 py-3 rounded-2xl font-bold text-white flex items-center justify-center gap-2 active:scale-[.98]" style={{ backgroundImage: GBRAND, boxShadow: SH.glow, fontFamily: DISPLAY }}><ShoppingBag size={18} /> ყიდვა · {it.price.toLocaleString()}₾</button>
        </div>
        {checkout && <Checkout item={checkout} onClose={() => setCheckout(null)} onDone={() => { setCheckout(null); flash && flash("მადლობა შენაძენისთვის! 🛍️"); }} onPlace={onOrder ? (d) => onOrder(checkout, d) : undefined} />}
        {editing && <NewListing initial={{ title: editing.title, price: editing.price, desc: editing.desc, cat: editing.cat, image: editing.image, video: editing.video }} onClose={() => setEditing(null)} live={live} onUpload={onUpload} onCreate={(d) => { onEdit && onEdit(editing.id, { title: d.title, price: d.price, description: d.desc, category: d.cat, image_url: d.image, video_url: d.video || null }); setEditing(null); }} />}
        {confirmDel && <ConfirmDialog title="განცხადების წაშლა" msg="ნამდვილად წაშლი ამ განცხადებას?" onCancel={() => setConfirmDel(false)} onConfirm={() => { onDelete && onDelete(it.id); setConfirmDel(false); setOpenId(null); }} />}
      </div>
    );
  }
  const list = cat === "ყველა" ? listings : listings.filter(l => l.cat === cat);
  return (
    <div className="pb-28 md:pb-10">
      <div className="flex items-center justify-between px-4 pt-5 pb-3"><Title>მარკეტი</Title><Pill tone="solid" onClick={() => setCreating(true)}>+ გაყიდე</Pill></div>
      <Chips items={MARKET_CATS} value={cat} onChange={setCat} />
      <div className="grid grid-cols-2 gap-2.5 px-3">
        {list.map(l => { const revs = reviews[l.sellerId] || []; const avg = revs.length ? (revs.reduce((a, r) => a + r.rating, 0) / revs.length) : 0; return (
          <button key={l.id} onClick={() => setOpenId(l.id)} className="text-left overflow-hidden transition active:scale-[.98]" style={card()}>
            <div className="relative w-full">{l.video ? <><video src={l.video} muted playsInline preload="metadata" style={{ aspectRatio: "1", objectFit: "cover" }} className="w-full" /><div className="absolute top-2 right-2 rounded-full flex items-center justify-center" style={{ width: 26, height: 26, background: "rgba(0,0,0,.55)" }}><Play size={13} color="#fff" fill="#fff" /></div></> : <Pic src={l.image} grad={GRADS[hashIdx(l.id, GRADS.length)]} style={{ aspectRatio: "1" }} className="w-full" />}</div>
            <div className="p-3"><div className="flex items-baseline gap-0.5"><span style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700, fontSize: 18 }}>{l.price.toLocaleString()}</span><span style={{ color: C.accent, fontWeight: 700, fontSize: 14 }}>₾</span></div><div className="text-[13px] mt-0.5 line-clamp-1" style={{ color: C.ink2 }}>{l.title}</div><div className="flex items-center gap-1 mt-1.5 text-[11px]" style={{ color: C.faint }}><MapPin size={11} /><span className="truncate flex-1">{l.location}</span>{avg > 0 && <span className="flex items-center gap-0.5" style={{ color: C.star }}><Star size={11} fill={C.star} /><Mono>{avg.toFixed(1)}</Mono></span>}</div></div>
          </button>
        ); })}
      </div>
      {creating && <NewListing onClose={() => setCreating(false)} onCreate={(d) => { onNew(d); setCreating(false); }} live={live} onUpload={onUpload} />}
    </div>
  );
}

export function MapView({ onMessage, onMenu, onOpenProfile }) {
  const mapRef = useRef(null); const mapObj = useRef(null); const markersRef = useRef([]);
  const [sel, setSel] = useState(null);
  const [pins, setPins] = useState([]); const [sharing, setSharing] = useState(false); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [geoErr, setGeoErr] = useState(""); const [myPos, setMyPos] = useState(null);
  const load = async () => {
    try { const rows = await locationsApi.shared(); rows.forEach(r => { if (r.profile) mergeProfile(r.profile); }); setPins(rows.filter(r => r.lat != null && r.lng != null)); } catch (e) { setPins([]); }
    try { const m = await locationsApi.mine(); setSharing(!!(m && m.shared)); if (m && m.lat != null) setMyPos([m.lat, m.lng]); } catch (e) {}
  };
  useEffect(() => { let c = false; (async () => { await load(); if (!c) setLoading(false); })(); return () => { c = true; }; }, []);
  useEffect(() => {
    const L = window.L; if (!L || !mapRef.current || mapObj.current) return;
    const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView([41.7151, 44.8271], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
    mapObj.current = map;
    setTimeout(() => { try { map.invalidateSize(); } catch (e) {} }, 250);
    return () => { try { map.remove(); } catch (e) {} mapObj.current = null; };
  }, []);
  useEffect(() => {
    const L = window.L; const map = mapObj.current; if (!L || !map) return;
    markersRef.current.forEach(m => { try { map.removeLayer(m); } catch (e) {} }); markersRef.current = [];
    pins.forEach(p => {
      const u = USERS[p.user_id]; const isMe = p.user_id === ME; const g = GRADS[hashIdx(p.user_id, GRADS.length)];
      const inner = (u && u.avatar) ? `<img src="${u.avatar}" style="width:42px;height:42px;border-radius:50%;object-fit:cover;display:block"/>` : `<div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(140deg,${g[0]},${g[1]});color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:17px;font-family:sans-serif">${(((u && u.name) || "?").trim()[0]) || "?"}</div>`;
      const ring = isMe ? "linear-gradient(140deg,#6d5efc,#8b5cf6)" : "#ffffff";
      const tag = isMe ? `<div style="position:absolute;top:-9px;left:50%;transform:translateX(-50%);background:#6d5efc;color:#fff;font-size:9px;font-weight:700;padding:1px 6px;border-radius:8px;white-space:nowrap;font-family:sans-serif">შენ</div>` : "";
      const html = `<div style="position:relative"><div style="padding:3px;border-radius:50%;background:${ring};box-shadow:0 3px 8px rgba(0,0,0,.35)">${inner}</div>${tag}</div>`;
      const icon = L.divIcon({ html, className: "mz-pin", iconSize: [50, 50], iconAnchor: [25, 50] });
      const marker = L.marker([p.lat, p.lng], { icon }).addTo(map);
      marker.on("click", () => setSel(p.user_id));
      markersRef.current.push(marker);
    });
    if (pins.length === 1) { try { map.setView([pins[0].lat, pins[0].lng], 14); } catch (e) {} }
    else if (pins.length > 1) { try { map.fitBounds(pins.map(p => [p.lat, p.lng]), { padding: [70, 70], maxZoom: 15 }); } catch (e) {} }
  }, [pins]);
  const toggleShare = () => {
    setGeoErr("");
    if (sharing) { setBusy(true); locationsApi.stop().then(() => setSharing(false)).then(load).catch(() => {}).finally(() => setBusy(false)); return; }
    if (!navigator.geolocation) { setGeoErr("ბრაუზერი ლოკაციას არ უჭერს მხარს"); return; }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { const lat = pos.coords.latitude, lng = pos.coords.longitude; setMyPos([lat, lng]); if (mapObj.current) { try { mapObj.current.setView([lat, lng], 15); } catch (e) {} } locationsApi.share(lat, lng).then(() => setSharing(true)).then(load).catch(() => setGeoErr("შენახვა ვერ მოხერხდა")).finally(() => setBusy(false)); },
      () => { setBusy(false); setGeoErr("ლოკაციაზე წვდომა უარყოფილია"); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };
  const recenter = () => { const map = mapObj.current; if (!map) return; if (myPos) map.setView(myPos, 15); else if (pins.length) { try { map.fitBounds(pins.map(p => [p.lat, p.lng]), { padding: [70, 70], maxZoom: 15 }); } catch (e) {} } };
  const sf = sel ? pins.find(p => p.user_id === sel) : null;
  return (
    <div className="relative" style={{ height: "100dvh", background: C.mapBase }}>
      <div ref={mapRef} className="absolute inset-0" style={{ zIndex: 0, background: C.mapBase }} />
      <div className="absolute top-0 inset-x-0 p-3 flex items-center gap-2" style={{ zIndex: 1000, background: `linear-gradient(180deg, ${C.paper}cc, transparent)` }}>
        <button onClick={onMenu} className="md:hidden rounded-full flex items-center justify-center active:scale-90" style={{ width: 42, height: 42, background: C.surface, boxShadow: SH.card, color: C.ink2 }}><Menu size={22} /></button>
        <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-full" style={{ background: C.surface, boxShadow: SH.card }}>
          <Map size={18} style={{ color: C.accent }} /><span className="font-bold text-[15px]" style={{ color: C.ink }}>რუკა</span>
          <div className="flex-1" /><span className="flex items-center gap-1" style={{ color: C.online }}><Users size={14} /><Mono className="text-[13px] font-bold">{pins.length} გააზიარა</Mono></span>
        </div>
      </div>
      <div className="absolute right-3 flex flex-col gap-2" style={{ zIndex: 1000, bottom: sf ? 270 : 160 }}>
        <div className="rounded-2xl overflow-hidden" style={{ background: C.surface, boxShadow: SH.card }}>
          <button onClick={() => mapObj.current && mapObj.current.zoomIn()} className="flex items-center justify-center active:scale-90" style={{ width: 44, height: 44, color: C.ink2, borderBottom: `1px solid ${C.lineSoft}` }}><Plus size={20} /></button>
          <button onClick={() => mapObj.current && mapObj.current.zoomOut()} className="flex items-center justify-center active:scale-90" style={{ width: 44, height: 44, color: C.ink2 }}><Minus size={20} /></button>
        </div>
        <button onClick={recenter} className="rounded-2xl flex items-center justify-center active:scale-90" style={{ width: 44, height: 44, background: C.surface, boxShadow: SH.card, color: C.accent }}><Navigation size={19} /></button>
      </div>
      <div className="absolute left-3 right-3 flex flex-col items-center" style={{ zIndex: 1000, bottom: sf ? 200 : 96 }}>
        {geoErr && <div className="mb-2 px-3 py-2 rounded-xl text-[12px] font-semibold" style={{ background: C.likeSoft, color: C.like }}>{geoErr}</div>}
        <button onClick={toggleShare} disabled={busy} className="flex items-center gap-2 px-5 py-3 rounded-full text-[14px] font-bold active:scale-95" style={sharing ? { background: C.surface, color: C.online, boxShadow: SH.card } : { backgroundImage: GBRAND, color: "#fff", boxShadow: SH.glow }}>
          {busy ? <div className="rounded-full" style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.5)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite" }} /> : <Navigation size={16} />}
          {sharing ? "ლოკაცია გააზიარებულია ✓ — შეწყვიტე" : "გააზიარე ჩემი ლოკაცია"}
        </button>
      </div>
      {!loading && pins.length === 0 && (
        <div className="absolute left-4 right-4 flex flex-col items-center text-center px-6 py-4 rounded-2xl" style={{ zIndex: 999, top: 78, background: C.surface + "f2", boxShadow: SH.card, pointerEvents: "none" }}>
          <div className="text-[14px] font-bold" style={{ color: C.ink }}>რუკაზე ჯერ ხალხი არ არის</div>
          <div className="text-[12px] mt-1" style={{ color: C.muted }}>გააზიარე ლოკაცია — აქ ჩანან ისინი ვისაც მიჰყვები და ვინც გააზიარა.</div>
        </div>
      )}
      {sf && (
        <div className="absolute left-3 right-3 p-3.5 flex items-center gap-3" style={{ zIndex: 1000, bottom: 90, ...card() }}>
          <button onClick={() => onOpenProfile(sf.user_id)}><Avatar id={sf.user_id} size={50} /></button>
          <div className="flex-1 min-w-0"><Name id={sf.user_id} className="text-[15px]" /><div className="flex items-center gap-1.5 text-[13px] mt-0.5" style={{ color: C.muted }}><MapPin size={13} style={{ color: C.accent }} /> <Mono style={{ color: C.online }}>{sf.user_id === ME ? "შენ აქ ხარ" : "გააზიარა " + timeAgo(sf.updated_at)}</Mono></div></div>
          {sf.user_id !== ME && <button onClick={() => onMessage(sf.user_id)} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 44, height: 44, backgroundImage: GBRAND, color: "#fff", boxShadow: SH.glow }}><Send size={18} /></button>}
          <button onClick={() => setSel(null)} className="rounded-full flex items-center justify-center" style={{ width: 32, height: 32, color: C.faint }}><X size={18} /></button>
        </div>
      )}
    </div>
  );
}

export function Reels({ reels, onLike, onSave, onOpenProfile, onMenu, flash, onCreate, onComments }) {
  const [muted, setMuted] = useState(true);
  return (
    <div className="relative" style={{ height: "100dvh", background: "#000" }}>
      <div className="no-scrollbar overflow-y-scroll h-full" style={{ scrollSnapType: "y mandatory" }}>
        {reels.map(r => <ReelCard key={r.id} r={r} onLike={onLike} onSave={onSave} onOpenProfile={onOpenProfile} flash={flash} onComments={onComments} muted={muted} onToggleMute={() => setMuted(m => !m)} />)}
      </div>
      <div className="absolute top-0 inset-x-0 p-3 flex items-center justify-between pointer-events-none">
        <button onClick={onMenu} className="md:hidden rounded-full flex items-center justify-center active:scale-90 pointer-events-auto" style={{ width: 42, height: 42, background: "rgba(255,255,255,.15)", backdropFilter: "blur(8px)", color: "#fff" }}><Menu size={22} /></button>
        <span className="font-bold text-white text-[19px]" style={{ fontFamily: DISPLAY, textShadow: "0 1px 6px rgba(0,0,0,.5)" }}>Reels</span>
        <button onClick={onCreate} className="rounded-full flex items-center justify-center active:scale-90 pointer-events-auto" style={{ width: 42, height: 42, background: "rgba(255,255,255,.15)", backdropFilter: "blur(8px)", color: "#fff" }}><Plus size={24} /></button>
      </div>
    </div>
  );
}

/* ─────────────────────────  GROUPS + EVENTS  ───────────────────────── */

export function Groups({ groups, events, onJoin, onRsvp, onOpenProfile, onMessage, live, onGroupPost, onUpload, onCreateGroup, onCreateEvent, pendingOpen, clearPending, onEditPost, onDeletePost, onEditGroup, onDeleteGroup, onEditEvent, onDeleteEvent }) {
  const [seg, setSeg] = useState("groups"); const [gOpen, setGOpen] = useState(null); const [eOpen, setEOpen] = useState(null);
  useEffect(() => { if (pendingOpen) { setSeg("groups"); setGOpen(pendingOpen); clearPending && clearPending(); } }, [pendingOpen]);
  const [creating, setCreating] = useState(false); const [editId, setEditId] = useState(null); const [delTarget, setDelTarget] = useState(null);
  const [cName, setCName] = useState(""); const [cAbout, setCAbout] = useState(""); const [cLoc, setCLoc] = useState(""); const [cDate, setCDate] = useState(""); const [cCover, setCCover] = useState(null); const [cUp, setCUp] = useState(false); const cFileRef = useRef(null);
  const cPick = async (e) => { const f = e.target.files && e.target.files[0]; if (!f || !onUpload) return; setCUp(true); try { setCCover(await onUpload(f)); } catch (err) {} setCUp(false); e.target.value = ""; };
  const resetCreate = () => { setCreating(false); setEditId(null); setCName(""); setCAbout(""); setCLoc(""); setCDate(""); setCCover(null); };
  const openEdit = (type, obj) => { setSeg(type === "group" ? "groups" : "events"); setEditId(obj.id); setCName(type === "group" ? obj.name : obj.title); setCAbout(obj.about || ""); setCLoc(obj.location || ""); setCDate(""); setCCover(obj.cover || null); setCreating(true); };
  const submitCreate = () => {
    if (!cName.trim()) return;
    if (editId) {
      if (seg === "groups") onEditGroup && onEditGroup(editId, { name: cName.trim(), about: cAbout.trim(), cover_url: cCover });
      else onEditEvent && onEditEvent(editId, { title: cName.trim(), about: cAbout.trim(), location: cLoc.trim(), cover_url: cCover, ...(cDate ? { starts_at: new Date(cDate).toISOString() } : {}) });
    } else if (seg === "groups") onCreateGroup({ name: cName.trim(), about: cAbout.trim(), category: "სხვა", coverUrl: cCover });
    else onCreateEvent({ title: cName.trim(), about: cAbout.trim(), location: cLoc.trim(), startsAt: cDate ? new Date(cDate).toISOString() : null, coverUrl: cCover });
    resetCreate();
  };
  const [gp, setGp] = useState(""); const [gpImg, setGpImg] = useState(null); const [gpUp, setGpUp] = useState(false); const gpFileRef = useRef(null);
  const gpPick = async (e) => { const f = e.target.files && e.target.files[0]; if (!f || !onUpload) return; setGpUp(true); try { setGpImg(await onUpload(f)); } catch (err) {} setGpUp(false); e.target.value = ""; };
  const sendGp = (gid) => { if (!gp.trim() && !gpImg) return; onGroupPost(gid, { text: gp.trim(), imageUrl: gpImg }); setGp(""); setGpImg(null); };
  const g = groups.find(x => x.id === gOpen); const e = events.find(x => x.id === eOpen);

  if (g) {
    return (
      <div className="pb-28 md:pb-10">
        <div className="flex items-center gap-3 px-4 py-3 sticky top-0 z-10" style={{ background: C.paper + "e6", backdropFilter: "blur(12px)" }}><button onClick={() => setGOpen(null)} style={{ color: C.ink2 }}><ArrowLeft size={22} /></button><span className="font-bold truncate flex-1" style={{ color: C.ink, fontFamily: DISPLAY }}>{g.name}</span>{g.createdBy === ME && <><button onClick={() => openEdit("group", g)} className="active:scale-90" style={{ color: C.ink2 }}><Pencil size={19} /></button><button onClick={() => setDelTarget({ type: "group", id: g.id })} className="active:scale-90" style={{ color: C.like }}><Trash2 size={19} /></button></>}</div>
        <Pic src={g.cover} grad={GRADS[hashIdx(g.id, GRADS.length)]} className="w-full" style={{ aspectRatio: "2/1" }} />
        <div className="px-4 pt-4">
          <h2 className="text-[20px]" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700 }}>{g.name}</h2>
          <div className="flex items-center gap-2 mt-1 text-[13px]" style={{ color: C.muted }}><Users size={14} /><Mono className="font-bold">{g.members.toLocaleString()}</Mono> წევრი · <span style={{ color: C.accent }}>{g.cat}</span></div>
          <div className="text-[14px] mt-2.5" style={{ color: C.ink2, lineHeight: 1.55 }}>{g.about}</div>
          <button onClick={() => onJoin(g.id)} className="w-full mt-3.5 py-2.5 rounded-xl text-sm font-bold transition active:scale-[.98]" style={g.joined ? { background: C.surface, color: C.ink, border: `1px solid ${C.line}` } : { backgroundImage: GBRAND, color: "#fff", boxShadow: SH.glow }}>{g.joined ? "✓ წევრი ხარ" : "შეუერთდი ჯგუფს"}</button>
        </div>
        <div className="flex items-center gap-2 px-3 mt-5 mb-2" style={{ color: C.muted }}><MessageSquare size={16} /><span className="text-sm font-bold">პოსტები</span></div>
        {g.joined && <div className="px-3 mb-3"><div className="p-3" style={card()}><div className="flex gap-2.5"><Avatar id={ME} size={34} /><textarea value={gp} onChange={e => setGp(e.target.value)} rows={2} placeholder="დაწერე ჯგუფში…" className="flex-1 resize-none bg-transparent outline-none text-[14px]" style={{ color: C.ink }} /></div>{gpImg && <div className="relative mt-2 ml-11 inline-block"><Pic src={gpImg} round={12} style={{ maxHeight: 140, maxWidth: 220 }} /><button onClick={() => setGpImg(null)} className="absolute top-1.5 right-1.5 rounded-full p-1" style={{ background: "rgba(0,0,0,.5)", color: "#fff" }}><X size={14} /></button></div>}<div className="flex items-center justify-between mt-2 ml-11"><input ref={gpFileRef} type="file" accept="image/*" hidden onChange={gpPick} /><button onClick={() => gpFileRef.current && gpFileRef.current.click()} disabled={gpUp} className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: C.accent }}>{gpUp ? "…" : <><ImageIcon size={17} /> ფოტო</>}</button><button onClick={() => sendGp(g.id)} disabled={!gp.trim() && !gpImg} className="px-4 py-1.5 rounded-full text-sm font-bold" style={{ backgroundImage: GBRAND, color: "#fff", opacity: (gp.trim() || gpImg) ? 1 : 0.4 }}>გამოქვეყნება</button></div></div></div>}
        <div className="space-y-3 px-3">{g.posts.map(p => <GroupPost key={p.id} p={p} onOpenProfile={onOpenProfile} onEdit={onEditPost} onDelete={onDeletePost} />)}</div>
      </div>
    );
  }
  if (e) {
    const host = USERS[e.hostId];
    return (
      <div className="pb-28 md:pb-10">
        <div className="flex items-center gap-3 px-4 py-3 sticky top-0 z-10" style={{ background: C.paper + "e6", backdropFilter: "blur(12px)" }}><button onClick={() => setEOpen(null)} style={{ color: C.ink2 }}><ArrowLeft size={22} /></button><span className="font-bold truncate flex-1" style={{ color: C.ink, fontFamily: DISPLAY }}>ივენთი</span>{e.hostId === ME && <><button onClick={() => openEdit("event", e)} className="active:scale-90" style={{ color: C.ink2 }}><Pencil size={19} /></button><button onClick={() => setDelTarget({ type: "event", id: e.id })} className="active:scale-90" style={{ color: C.like }}><Trash2 size={19} /></button></>}</div>
        <Pic src={e.cover} grad={GRADS[hashIdx(e.id, GRADS.length)]} className="w-full" style={{ aspectRatio: "2/1" }} />
        <div className="px-4 pt-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl flex flex-col items-center justify-center shrink-0" style={{ width: 56, height: 56, background: C.accentSoft }}><Mono className="text-[10px] font-bold uppercase" style={{ color: C.accentText }}>{e.mon}</Mono><Mono className="text-xl font-bold" style={{ color: C.accent, lineHeight: 1 }}>{e.day}</Mono></div>
            <div className="min-w-0"><h2 className="text-[19px]" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700, lineHeight: 1.25 }}>{e.title}</h2><div className="flex items-center gap-1 text-[13px] mt-1" style={{ color: C.muted }}><Mono>{e.time}</Mono> · <MapPin size={13} style={{ color: C.accent }} /> {e.location}</div></div>
          </div>
          <div className="text-[14px] mt-3.5" style={{ color: C.ink2, lineHeight: 1.55 }}>{e.about}</div>
          <div className="mt-3.5"><MiniMap /></div>
          <div className="flex items-center gap-2 mt-3.5 text-[13px]" style={{ color: C.muted }}><Users size={15} style={{ color: C.accent }} /><Mono className="font-bold" style={{ color: C.ink }}>{e.going}</Mono> მიდის</div>
          <div className="flex gap-2 mt-3.5">{RSVP_OPTS.map(([v, l]) => <button key={v} onClick={() => onRsvp(e.id, v)} className="flex-1 py-2.5 rounded-xl text-sm font-bold transition active:scale-95" style={e.rsvp === v ? { backgroundImage: GBRAND, color: "#fff", boxShadow: SH.glow } : { background: C.surfaceMuted, color: C.ink2 }}>{l}</button>)}</div>
          <button onClick={() => onMessage(host.id)} className="w-full flex items-center gap-3 mt-3 p-3.5" style={card()}><Avatar id={host.id} size={40} /><div className="flex-1 text-left"><div className="text-[12px]" style={{ color: C.faint }}>ორგანიზატორი</div><Name id={host.id} className="text-[14px]" /></div><Send size={18} style={{ color: C.accent }} /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28 md:pb-10">
      <div className="px-4 pt-5 pb-3 flex items-center justify-between"><Title>{seg === "groups" ? "ჯგუფები" : "ივენთები"}</Title><button onClick={() => setCreating(true)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-bold text-white active:scale-95" style={{ backgroundImage: GBRAND, boxShadow: SH.glow }}><Plus size={16} /> შექმნა</button></div>
      <div className="px-4 pb-4"><div className="flex gap-1 p-1 rounded-2xl" style={{ background: C.surfaceMuted }}>{[["groups", "ჯგუფები"], ["events", "ივენთები"]].map(([k, l]) => <button key={k} onClick={() => setSeg(k)} className="flex-1 py-2 rounded-xl text-sm font-bold transition" style={seg === k ? { background: C.surface, color: C.accent, boxShadow: SH.card } : { color: C.muted }}>{l}</button>)}</div></div>
      {seg === "groups" ? (
        groups.length === 0 ? <Empty icon={Users} t="ჯერ ჯგუფი არ არის" s="შექმენი პირველი ჯგუფი ზემოთ ღილაკით." /> :
        <div className="space-y-3 px-3">{groups.map(gr => (
          <button key={gr.id} onClick={() => setGOpen(gr.id)} className="w-full text-left overflow-hidden transition active:scale-[.99]" style={card()}>
            <Pic src={gr.cover} grad={GRADS[hashIdx(gr.id, GRADS.length)]} className="w-full" style={{ aspectRatio: "3/1" }} />
            <div className="p-3.5"><div className="flex items-center justify-between gap-2"><div className="min-w-0"><div className="text-[16px]" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700 }}>{gr.name}</div><div className="flex items-center gap-1.5 text-[12px] mt-0.5" style={{ color: C.muted }}><Users size={13} /><Mono>{gr.members.toLocaleString()}</Mono> წევრი · {gr.cat}</div></div>{gr.joined ? <span className="text-[12px] font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: C.accentSoft, color: C.accentText }}>✓ წევრი</span> : <span className="text-[12px] font-bold px-2.5 py-1 rounded-full shrink-0 text-white" style={{ backgroundImage: GBRAND }}>+ შესვლა</span>}</div></div>
          </button>
        ))}</div>
      ) : (
        events.length === 0 ? <Empty icon={MapPin} t="ჯერ ივენთი არ არის" s="შექმენი პირველი ივენთი ზემოთ ღილაკით." /> :
        <div className="space-y-3 px-3">{events.map(ev => (
          <button key={ev.id} onClick={() => setEOpen(ev.id)} className="w-full text-left flex gap-3 p-3" style={card()}>
            <div className="rounded-2xl flex flex-col items-center justify-center shrink-0" style={{ width: 56, height: 56, background: C.accentSoft }}><Mono className="text-[10px] font-bold uppercase" style={{ color: C.accentText }}>{ev.mon}</Mono><Mono className="text-xl font-bold" style={{ color: C.accent, lineHeight: 1 }}>{ev.day}</Mono></div>
            <div className="min-w-0 flex-1"><div className="text-[15px]" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700, lineHeight: 1.25 }}>{ev.title}</div><div className="flex items-center gap-1 text-[12px] mt-1" style={{ color: C.muted }}><Mono>{ev.time}</Mono> · <MapPin size={12} /> <span className="truncate">{ev.location}</span></div><div className="flex items-center gap-1 text-[12px] mt-1.5" style={{ color: ev.rsvp === "going" ? C.online : C.faint }}><Users size={12} /><Mono className="font-bold">{ev.going}</Mono> მიდის{ev.rsvp === "going" && " · შენც ✓"}</div></div>
          </button>
        ))}</div>
      )}
      {creating && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center" style={{ background: "rgba(0,0,0,.45)" }} onClick={resetCreate}>
          <div className="w-full max-w-[480px] rounded-t-3xl md:rounded-3xl p-5" style={{ background: C.surface, maxHeight: "88vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="text-[18px]" style={{ color: C.ink, fontFamily: DISPLAY, fontWeight: 700 }}>{editId ? (seg === "groups" ? "ჯგუფის რედაქტირება" : "ივენთის რედაქტირება") : (seg === "groups" ? "ახალი ჯგუფი" : "ახალი ივენთი")}</h2><button onClick={resetCreate} style={{ color: C.faint }}><X size={22} /></button></div>
            <button onClick={() => cFileRef.current && cFileRef.current.click()} className="w-full rounded-2xl flex flex-col items-center justify-center mb-3 overflow-hidden" style={{ aspectRatio: "3/1", background: C.surfaceMuted, border: `2px dashed ${C.line}`, color: C.muted }}>{cCover ? <img src={cCover} alt="" className="w-full h-full object-cover" /> : cUp ? <Mono className="text-sm">იტვირთება…</Mono> : <><Upload size={22} /><span className="text-[12px] mt-1">ქავერ ფოტო</span></>}</button>
            <input ref={cFileRef} type="file" accept="image/*" hidden onChange={cPick} />
            <input value={cName} onChange={e => setCName(e.target.value)} placeholder={seg === "groups" ? "ჯგუფის სახელი" : "ივენთის სახელი"} className="w-full px-4 py-3 rounded-xl mb-2.5 text-[15px] outline-none" style={{ background: C.surfaceMuted, color: C.ink }} />
            {seg === "events" && <input value={cLoc} onChange={e => setCLoc(e.target.value)} placeholder="ლოკაცია" className="w-full px-4 py-3 rounded-xl mb-2.5 text-[15px] outline-none" style={{ background: C.surfaceMuted, color: C.ink }} />}
            {seg === "events" && <input value={cDate} onChange={e => setCDate(e.target.value)} type="datetime-local" className="w-full px-4 py-3 rounded-xl mb-2.5 text-[15px] outline-none" style={{ background: C.surfaceMuted, color: C.ink }} />}
            <textarea value={cAbout} onChange={e => setCAbout(e.target.value)} rows={3} placeholder="აღწერა…" className="w-full px-4 py-3 rounded-xl mb-3 text-[15px] outline-none resize-none" style={{ background: C.surfaceMuted, color: C.ink }} />
            <button onClick={submitCreate} disabled={!cName.trim()} className="w-full py-3.5 rounded-xl text-[15px] font-bold text-white active:scale-[.98]" style={{ backgroundImage: GBRAND, opacity: cName.trim() ? 1 : 0.4 }}>{editId ? "შენახვა" : (seg === "groups" ? "ჯგუფის შექმნა" : "ივენთის შექმნა")}</button>
          </div>
        </div>
      )}
      {delTarget && <ConfirmDialog title={delTarget.type === "group" ? "ჯგუფის წაშლა" : "ივენთის წაშლა"} msg={delTarget.type === "group" ? "ჯგუფი და ყველა პოსტი წაიშლება. დარწმუნებული ხარ?" : "ივენთი წაიშლება. დარწმუნებული ხარ?"} onCancel={() => setDelTarget(null)} onConfirm={() => { if (delTarget.type === "group") { onDeleteGroup && onDeleteGroup(delTarget.id); setGOpen(null); } else { onDeleteEvent && onDeleteEvent(delTarget.id); setEOpen(null); } setDelTarget(null); }} />}
    </div>
  );
}

/* ─────────────────────────  PROGRESS (Streaks + XP)  ───────────────────────── */
