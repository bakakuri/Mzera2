import React, { useState, useEffect, useRef } from "react";
import { C, GRADS, DISPLAY, MONO, GBRAND, Avatar, USERS, ME, Tilt } from "./core";
import { ArrowLeft } from "./core";
import { calls as callsApi } from "../lib/api";
import { newGame, throwCards, cover, take, resolve, botMove, canThrow, isValidCover, cardId, cardPts, handPts, SUIT_SYM, SUIT_RED } from "../lib/bura";

const DIFFS = [{ k: "easy", t: "მარტივი" }, { k: "normal", t: "საშუალო" }, { k: "hard", t: "რთული" }];
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const genCode = () => Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");

function CardFace({ card, size = "md", down = false, dim = false, lifted = false, onClick, disabled }) {
  const dims = size === "sm" ? { w: 34, h: 48, f: 15, sym: 13 } : size === "xs" ? { w: 24, h: 34, f: 11, sym: 10 } : { w: 52, h: 74, f: 22, sym: 20 };
  if (down) return <div style={{ width: dims.w, height: dims.h, borderRadius: 9, backgroundImage: GBRAND, border: "2px solid rgba(255,255,255,.25)", boxShadow: "0 2px 6px rgba(0,0,0,.3)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "rgba(255,255,255,.55)", fontFamily: DISPLAY, fontWeight: 800, fontSize: dims.f }}>მ</span></div>;
  const red = SUIT_RED[card.s];
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: dims.w, height: dims.h, borderRadius: 9, background: "linear-gradient(180deg,#fff,#f1f3f8)", border: `2px solid ${lifted ? C.accent : "rgba(0,0,0,.12)"}`, boxShadow: lifted ? "0 10px 18px -6px rgba(103,80,242,.5)" : "0 2px 5px rgba(0,0,0,.22)", transform: lifted ? "translateY(-12px)" : "none", transition: "transform .14s, box-shadow .14s, border-color .14s", opacity: dim ? 0.4 : 1, position: "relative", flex: "0 0 auto", cursor: onClick && !disabled ? "pointer" : "default" }}>
      <span style={{ position: "absolute", top: 3, left: 5, color: red ? "#e5484d" : "#1a1d26", fontWeight: 800, fontSize: dims.f, lineHeight: 1, fontFamily: DISPLAY }}>{card.r}</span>
      <span style={{ position: "absolute", bottom: 3, right: 5, color: red ? "#e5484d" : "#1a1d26", fontSize: dims.sym, lineHeight: 1 }}>{SUIT_SYM[card.s]}</span>
      <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: red ? "#e5484d" : "#1a1d26", fontSize: dims.sym + 6, opacity: .9 }}>{SUIT_SYM[card.s]}</span>
    </button>
  );
}

export function BuraGame({ onExit }) {
  const [screen, setScreen] = useState("menu");
  const [diff, setDiff] = useState("normal");
  const [g, setG] = useState(null);
  const [sel, setSel] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [starter, setStarter] = useState(0);
  // online
  const [role, setRole] = useState(null);   // null | "host" | "guest"
  const [code, setCode] = useState("");
  const [players, setPlayers] = useState(null); // [hostId, guestId]
  const [joinCode, setJoinCode] = useState("");
  const [joinErr, setJoinErr] = useState("");
  const [oppLeft, setOppLeft] = useState(false);

  const online = role !== null;
  const chRef = useRef(null), readyRef = useRef(false), queueRef = useRef([]);
  const gRef = useRef(null), playersRef = useRef(null), roleRef = useRef(null), onMsgRef = useRef(null);
  gRef.current = g; playersRef.current = players; roleRef.current = role;

  const sendRaw = (ch, payload) => { try { ch.send({ type: "broadcast", event: "b", payload }); } catch (e) {} };
  const send = (payload) => {
    if (chRef.current && readyRef.current) sendRaw(chRef.current, payload);
    else queueRef.current.push(payload);
  };

  // ── incoming realtime messages ──
  const onMsg = (m) => {
    const r = roleRef.current;
    if (r === "host") {
      if (m.t === "hello") {
        if (!gRef.current) {
          const pl = [ME, m.from]; setPlayers(pl);
          const ns = newGame({ starter: 0 }); setG(ns); setOppLeft(false); setScreen("online");
          send({ t: "state", state: ns, players: pl });
        } else send({ t: "state", state: gRef.current, players: playersRef.current });
      } else if (m.t === "move") {
        const cur = gRef.current; if (!cur) return;
        let ns = cur;
        if (m.kind === "skip") { if (cur.phase === "reveal") ns = resolve(cur); }
        else if (cur.turn === 1) {
          if (m.kind === "throw") ns = throwCards(cur, m.cards);
          else if (m.kind === "cover") ns = cover(cur, m.cards);
          else if (m.kind === "take") ns = take(cur);
        }
        if (ns !== cur) { setG(ns); send({ t: "state", state: ns, players: playersRef.current }); }
      } else if (m.t === "bye") setOppLeft(true);
    } else if (r === "guest") {
      if (m.t === "state") { setG(m.state); setPlayers(m.players); setOppLeft(false); setJoinErr(""); setScreen("online"); }
      else if (m.t === "bye") setOppLeft(true);
    }
  };
  onMsgRef.current = onMsg;

  // ── channel lifecycle ──
  useEffect(() => {
    if (!code || !role) return;
    const ch = callsApi.channel("bura-" + code);
    chRef.current = ch; readyRef.current = false;
    ch.on("broadcast", { event: "b" }, ({ payload }) => { if (onMsgRef.current) onMsgRef.current(payload); });
    ch.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        readyRef.current = true;
        queueRef.current.forEach(p => sendRaw(ch, p)); queueRef.current = [];
        if (roleRef.current === "guest") sendRaw(ch, { t: "hello", from: ME });
      }
    });
    return () => { try { ch.unsubscribe(); } catch (e) {} chRef.current = null; readyRef.current = false; };
  }, [code, role]);

  // guest: retry hello until state arrives (handles host-not-ready / bad code)
  useEffect(() => {
    if (screen !== "online-wait" || role !== "guest") return;
    let tries = 0;
    const iv = setInterval(() => {
      if (gRef.current) { clearInterval(iv); return; }
      tries++;
      if (tries > 6) { clearInterval(iv); setJoinErr("ოთახი ვერ მოიძებნა — შეამოწმე კოდი"); return; }
      send({ t: "hello", from: ME });
    }, 1200);
    return () => clearInterval(iv);
  }, [screen, role]);

  // bot plays on its turn (offline only)
  useEffect(() => {
    if (online || !g || g.turn !== 1 || (g.phase !== "lead" && g.phase !== "defend")) { setThinking(false); return; }
    setThinking(true);
    const t = setTimeout(() => {
      setG(cur => {
        if (!cur || cur.turn !== 1 || (cur.phase !== "lead" && cur.phase !== "defend")) return cur;
        const mv = botMove(cur, 1, diff);
        let next = cur;
        if (mv) {
          if (mv.kind === "throw") next = throwCards(cur, mv.cards);
          else if (mv.kind === "cover") next = cover(cur, mv.cards);
          else if (mv.kind === "take") next = take(cur);
        }
        if (next === cur) {
          if (cur.phase === "lead" && cur.hands[1].length) next = throwCards(cur, [cur.hands[1][0]]);
          else if (cur.phase === "defend") next = take(cur);
        }
        return next;
      });
      setThinking(false);
    }, 800);
    return () => clearTimeout(t);
  }, [g, diff, online]);

  // reveal → commit after a beat (offline: local · online: host drives + broadcasts)
  useEffect(() => {
    if (!g || g.phase !== "reveal") return;
    if (online && role === "guest") return;
    const t = setTimeout(() => {
      const cur = gRef.current;
      if (cur && cur.phase === "reveal") { const ns = resolve(cur); setG(ns); if (online && roleRef.current === "host") send({ t: "state", state: ns, players: playersRef.current }); }
    }, 3500);
    return () => clearTimeout(t);
  }, [g, online, role]);

  const startBot = () => { setRole(null); setPlayers(null); setG(newGame({ starter })); setSel([]); setScreen("play"); };
  const createRoom = () => { setJoinErr(""); setPlayers(null); setG(null); setCode(genCode()); setRole("host"); setScreen("online-wait"); };
  const joinRoom = () => { const c = joinCode.trim().toUpperCase(); if (c.length < 3) { setJoinErr("შეიყვანე კოდი"); return; } setJoinErr(""); setPlayers(null); setG(null); setCode(c); setRole("guest"); setScreen("online-wait"); };
  const rematch = () => { const ns2 = 1 - starter; setStarter(ns2); const ns = newGame({ starter: ns2 }); setSel([]); setG(ns); setOppLeft(false); if (online && role === "host") send({ t: "state", state: ns, players }); };
  const leave = () => { if (online) send({ t: "bye", from: ME }); onExit(); };
  const backToMenu = () => { if (online) send({ t: "bye", from: ME }); setRole(null); setCode(""); setPlayers(null); setG(null); setSel([]); setJoinErr(""); setOppLeft(false); setScreen("menu"); };

  // apply a local action (offline / online-host) or send it (online-guest)
  const act = (kind, cards) => {
    setSel([]);
    const apply = (st) => { if (kind === "throw") return throwCards(st, cards); if (kind === "cover") return cover(st, cards); if (kind === "take") return take(st); if (kind === "skip") return resolve(st); return st; };
    if (!online) { setG(apply(g)); return; }
    if (role === "host") { const ns = apply(g); if (ns !== g) { setG(ns); send({ t: "state", state: ns, players }); } }
    else send({ t: "move", kind, cards: cards || [] });
  };

  // ══════════════ MENU ══════════════
  if (screen === "menu") {
    return (
      <div className="fixed inset-0 z-[95] flex flex-col" style={{ background: C.paper }}>
        <div className="flex items-center gap-3 px-4 py-3"><button onClick={onExit} className="active:scale-90"><ArrowLeft size={22} style={{ color: C.ink }} /></button><span className="font-bold text-[17px]" style={{ color: C.ink, fontFamily: DISPLAY }}>ბურა</span></div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 -mt-8">
          <div style={{ fontSize: 64 }}>🃏</div>
          <h1 className="text-[30px] font-bold mt-2" style={{ color: C.ink, fontFamily: DISPLAY }}>ბურა</h1>
          <p className="text-[14px] mt-1 mb-8 text-center" style={{ color: C.muted }}>36 კარტი · 61 ქულამდე</p>
          <div className="w-full max-w-[320px]">
            <div className="text-[12.5px] font-semibold mb-2" style={{ color: C.ink2 }}>სირთულე (ბოტთან)</div>
            <div className="flex gap-2 mb-5">{DIFFS.map(d => <button key={d.k} onClick={() => setDiff(d.k)} className="flex-1 py-2.5 rounded-xl text-[13.5px] font-bold transition active:scale-95" style={diff === d.k ? { backgroundImage: GBRAND, color: "#fff" } : { background: C.surfaceMuted, color: C.ink2 }}>{d.t}</button>)}</div>
            <button onClick={startBot} className="w-full py-3.5 rounded-2xl text-[16px] font-bold text-white active:scale-[.98]" style={{ backgroundImage: GBRAND, boxShadow: "0 2px 0 rgba(64,44,150,.32), 0 10px 24px -6px rgba(103,80,242,.55)" }}>თამაში ბოტთან</button>
            <button onClick={() => { setJoinErr(""); setScreen("online-menu"); }} className="w-full py-3.5 rounded-2xl text-[16px] font-bold mt-2.5 active:scale-[.98]" style={{ background: C.surface, color: C.ink, border: `1.5px solid ${C.line}` }}>ონლაინ ხალხთან 🌐</button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════ ONLINE MENU ══════════════
  if (screen === "online-menu") {
    return (
      <div className="fixed inset-0 z-[95] flex flex-col" style={{ background: C.paper }}>
        <div className="flex items-center gap-3 px-4 py-3"><button onClick={() => setScreen("menu")} className="active:scale-90"><ArrowLeft size={22} style={{ color: C.ink }} /></button><span className="font-bold text-[17px]" style={{ color: C.ink, fontFamily: DISPLAY }}>ონლაინ ბურა</span></div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 -mt-8">
          <div style={{ fontSize: 54 }}>🌐</div>
          <p className="text-[14px] mt-2 mb-7 text-center" style={{ color: C.muted }}>შექმენი ოთახი და კოდი გაუზიარე მეგობარს,<br />ან შეიყვანე მისი კოდი</p>
          <div className="w-full max-w-[320px]">
            <button onClick={createRoom} className="w-full py-3.5 rounded-2xl text-[16px] font-bold text-white active:scale-[.98]" style={{ backgroundImage: GBRAND }}>შექმენი ოთახი</button>
            <div className="flex items-center gap-3 my-4"><div style={{ flex: 1, height: 1, background: C.line }} /><span className="text-[12px]" style={{ color: C.faint }}>ან</span><div style={{ flex: 1, height: 1, background: C.line }} /></div>
            <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 4))} placeholder="კოდი (მაგ. K7QP)" maxLength={4} className="w-full px-4 py-3 rounded-xl text-[18px] font-bold text-center outline-none tracking-[0.3em]" style={{ background: C.surfaceMuted, color: C.ink, fontFamily: MONO }} />
            {joinErr && <div className="text-[12.5px] mt-2 text-center" style={{ color: "#e5484d" }}>{joinErr}</div>}
            <button onClick={joinRoom} className="w-full py-3.5 rounded-2xl text-[15px] font-bold mt-3 active:scale-[.98]" style={{ background: C.surface, color: C.ink, border: `1.5px solid ${C.line}` }}>შესვლა კოდით</button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════ WAITING ROOM ══════════════
  if (screen === "online-wait") {
    return (
      <div className="fixed inset-0 z-[95] flex flex-col" style={{ background: C.paper }}>
        <div className="flex items-center gap-3 px-4 py-3"><button onClick={backToMenu} className="active:scale-90"><ArrowLeft size={22} style={{ color: C.ink }} /></button><span className="font-bold text-[17px]" style={{ color: C.ink, fontFamily: DISPLAY }}>ონლაინ ბურა</span></div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 -mt-8 text-center">
          {role === "host" ? (
            <>
              <div style={{ fontSize: 48 }}>🃏</div>
              <div className="text-[13px] mt-3 mb-1" style={{ color: C.muted }}>ოთახის კოდი</div>
              <div className="text-[46px] font-bold tracking-[0.15em]" style={{ color: C.accent, fontFamily: MONO }}>{code}</div>
              <p className="text-[13.5px] mt-3 mb-6" style={{ color: C.muted, maxWidth: 280 }}>გაუზიარე ეს კოდი მეგობარს — ის შეიყვანს და თამაში ავტომატურად დაიწყება</p>
              <div className="flex items-center gap-2" style={{ color: C.faint }}><div style={{ width: 16, height: 16, border: `2px solid ${C.line}`, borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /><span className="text-[13.5px]">ელოდები მოწინააღმდეგეს…</span></div>
            </>
          ) : (
            <>
              <div style={{ width: 22, height: 22, border: `3px solid ${C.line}`, borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <p className="text-[15px] mt-4" style={{ color: C.ink }}>ვუკავშირდები ოთახს <b style={{ color: C.accent, fontFamily: MONO }}>{code}</b>…</p>
              {joinErr && <div className="text-[13px] mt-3" style={{ color: "#e5484d" }}>{joinErr}</div>}
            </>
          )}
          <button onClick={backToMenu} className="mt-8 px-6 py-2.5 text-[14px] font-semibold" style={{ color: C.faint }}>გაუქმება</button>
        </div>
      </div>
    );
  }

  if (!g) return null;

  // ══════════════ PLAY ══════════════
  const meIdx = role === "guest" ? 1 : 0;
  const oppIdx = 1 - meIdx;
  const oppId = online && players ? players[oppIdx] : null;
  const oppName = online ? (oppId && USERS[oppId] ? USERS[oppId].name : "მოწინააღმდეგე") : "ბოტი";
  const trump = g.trumpSuit;
  const myHand = g.hands[meIdx];
  const oppHand = g.hands[oppIdx];
  const iLead = g.phase === "lead" && g.turn === meIdx;
  const iDefend = g.phase === "defend" && g.turn === meIdx;
  const selCards = myHand.filter(c => sel.includes(cardId(c)));
  const canPlay = iLead ? canThrow(myHand, selCards) : false;
  const canClose = iDefend && sel.length === g.attackCards.length && isValidCover(g.attackCards, selCards, trump);
  const leadSuit = iLead && sel.length ? myHand.find(h => cardId(h) === sel[0])?.s : null;
  const toggle = (c) => {
    const id = cardId(c);
    setSel(s => {
      if (s.includes(id)) return s.filter(x => x !== id);
      if (iDefend) {
        const cap = g.attackCards.length;
        if (s.length >= cap) return s;
        return [...s, id];
      }
      if (s.length >= 5) return s;
      if (leadSuit && c.s !== leadSuit) return s; // multi-card lead must share one suit
      return [...s, id];
    });
  };

  const oppWord = online ? oppName : "ბოტმა";
  const revealLabel = g.phase === "reveal"
    ? (g.last && g.last.type === "cover"
      ? (g.pileWinner === meIdx ? "შენ დახურე ✓" : `${oppWord} დახურა`)
      : (g.pileWinner === meIdx ? "შენ წაიღე ⬇" : `${oppWord} წაიღო ⬇`))
    : "";
  const waitWord = online ? `${oppName} ფიქრობს…` : (thinking ? "ბოტი ფიქრობს…" : "ბოტის სვლა…");
  const statusText = g.phase === "over" ? "" : g.phase === "reveal" ? revealLabel : iLead ? "შენი სვლა — ჩააგდე 1–5 კარტი (ერთი მასტის)" : iDefend ? "დაიცავი: აირჩიე კარტ(ებ)ი → „სვლა“, ან „გატანება“" : waitWord;
  const showSkip = g.phase === "reveal";

  return (
    <div className="fixed inset-0 z-[95] flex flex-col" style={{ background: "radial-gradient(circle at 50% 30%, #14351f, #0c1f13 70%)" }}>
      <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "rgba(0,0,0,.25)" }}>
        <button onClick={leave} className="active:scale-90"><ArrowLeft size={22} color="#fff" /></button>
        <span className="text-[13px] font-bold" style={{ color: "rgba(255,255,255,.7)", fontFamily: MONO }}>{online ? "ონლაინ" : "ბურა"} · {g.captured[meIdx]}–{g.captured[oppIdx]} · 61</span>
        {!online ? <button onClick={rematch} className="active:scale-90" style={{ color: "#fff", fontSize: 20, lineHeight: 1 }}>↻</button> : <span style={{ width: 20 }} />}
      </div>

      {/* opponent */}
      <div className="flex items-center gap-2.5 px-4 py-2">
        {online && oppId ? <Avatar id={oppId} size={36} /> : <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundImage: GBRAND, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, border: "2px solid rgba(255,255,255,.2)" }}>🤖</div>}
        <div className="flex-1"><div className="text-[13.5px] font-bold" style={{ color: "#fff" }}>{oppName}</div><div className="text-[11px]" style={{ color: "rgba(255,255,255,.55)", fontFamily: MONO }}>ქულა: {g.captured[oppIdx]}</div></div>
        <div className="flex">{oppHand.map((c, i) => <div key={i} style={{ marginLeft: i ? -14 : 0 }}><CardFace down size="sm" /></div>)}</div>
      </div>

      {/* table */}
      <div className="flex-1 flex flex-col items-center justify-center relative px-4">
        <div className="absolute left-4 top-2 flex flex-col items-center">
          <div style={{ position: "relative" }}>
            {g.trumpCard && <div style={{ transform: "rotate(90deg)", transformOrigin: "center" }}><CardFace card={g.trumpCard} size="sm" /></div>}
            <div style={{ position: "absolute", left: -6, top: -4 }}><CardFace down size="sm" /></div>
          </div>
          <span className="text-[10.5px] mt-3" style={{ color: "rgba(255,255,255,.6)", fontFamily: MONO }}>დასტა: {g.talon.length}</span>
          <span className="text-[15px] mt-0.5" style={{ color: SUIT_RED[trump] ? "#ff6b6f" : "#fff" }}>კოზირი {SUIT_SYM[trump]}</span>
        </div>

        {(g.attackCards.length || (g.coverCards && g.coverCards.length)) ? (
          <div className="flex flex-col items-center gap-1.5">
            {g.attackCards.length > 0 && <div className="flex" style={{ gap: 6 }}>{g.attackCards.map((c, i) => <CardFace key={"a" + i} card={c} size="md" />)}</div>}
            {g.coverCards && g.coverCards.length > 0 && <div className="flex" style={{ gap: 6 }}>{g.coverCards.map((c, i) => <CardFace key={"c" + i} card={c} size="md" />)}</div>}
            <span className="mt-1 text-[13px] font-semibold" style={{ color: "rgba(255,255,255,.85)" }}>{statusText}</span>
          </div>
        ) : (
          <div style={{ color: "rgba(255,255,255,.4)", fontSize: 13 }}>{statusText}</div>
        )}
      </div>

      <div className="px-4 pb-1 text-center"><span className="text-[11.5px]" style={{ color: "rgba(255,255,255,.55)", fontFamily: MONO }}>შენი ქულა: {g.captured[meIdx]}</span></div>

      <div className="px-3 pt-1 flex items-end justify-center flex-wrap gap-1.5" style={{ minHeight: 96 }}>
        {myHand.map((c) => { const id = cardId(c); const lifted = sel.includes(id); const selectable = (iLead || iDefend); const blocked = iLead && !lifted && leadSuit && c.s !== leadSuit; return <div key={id} style={{ marginTop: 6 }}><CardFace card={c} size="md" lifted={lifted} dim={blocked} onClick={selectable ? () => toggle(c) : undefined} /></div>; })}
        {myHand.length === 0 && <span style={{ color: "rgba(255,255,255,.4)", fontSize: 13 }}>ხელი ცარიელია</span>}
      </div>

      <div className="px-4 pt-2" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        {iLead && <button onClick={() => act("throw", selCards)} disabled={!canPlay} className="w-full py-3.5 rounded-2xl text-[16px] font-bold text-white active:scale-[.98]" style={{ backgroundImage: GBRAND, opacity: canPlay ? 1 : 0.4 }}>ჩააგდე{selCards.length ? ` (${selCards.length})` : ""}</button>}
        {iDefend && <div className="flex gap-2">
          <button onClick={() => act("take")} className="flex-1 py-3.5 rounded-2xl text-[15px] font-bold active:scale-[.98]" style={{ background: C.surfaceMuted, color: C.ink }}>გატანება</button>
          <button onClick={() => act("cover", selCards)} disabled={!canClose} className="flex-1 py-3.5 rounded-2xl text-[15px] font-bold text-white active:scale-[.98]" style={{ backgroundImage: GBRAND, opacity: canClose ? 1 : 0.4 }}>სვლა</button>
        </div>}
        {showSkip && <button onClick={() => act("skip")} className="w-full py-3.5 rounded-2xl text-[15px] font-bold text-white active:scale-[.98]" style={{ backgroundImage: GBRAND }}>გაგრძელება →</button>}
        {!iLead && !iDefend && g.phase !== "over" && !showSkip && <div className="text-center py-3.5 text-[14px] font-semibold" style={{ color: "rgba(255,255,255,.55)" }}>{statusText}</div>}
      </div>

      {/* opponent left */}
      {oppLeft && g.phase !== "over" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center" style={{ background: "rgba(0,0,0,.8)", backdropFilter: "blur(3px)" }}>
          <div style={{ fontSize: 48 }}>👋</div>
          <h2 className="text-[20px] font-bold mt-2" style={{ color: "#fff", fontFamily: DISPLAY }}>მოწინააღმდეგემ დატოვა</h2>
          <button onClick={backToMenu} className="px-8 py-3 mt-5 rounded-2xl text-[15px] font-bold text-white active:scale-95" style={{ backgroundImage: GBRAND }}>მენიუ</button>
        </div>
      )}

      {/* game over */}
      {g.phase === "over" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center" style={{ background: "rgba(0,0,0,.72)", backdropFilter: "blur(3px)" }}>
          <div style={{ fontSize: 60 }}>{g.winner === meIdx ? "🏆" : g.winner === "draw" ? "🤝" : "😔"}</div>
          <h2 className="text-[26px] font-bold mt-1" style={{ color: "#fff", fontFamily: DISPLAY }}>{g.winner === meIdx ? "მოიგე!" : g.winner === "draw" ? "ფრე" : "წააგე"}</h2>
          {g.combo && <p className="text-[15px] font-bold mt-1" style={{ color: "#ffd166" }}>{g.combo} 🃏 — {g.winner === "draw" ? "ორივეს ერთდროულად!" : "მყისიერი გამარჯვება!"}</p>}
          <p className="text-[14px] mt-1 mb-7" style={{ color: "rgba(255,255,255,.7)", fontFamily: MONO }}>{g.captured[meIdx]} – {g.captured[oppIdx]}</p>
          {(!online || role === "host") && <button onClick={rematch} className="px-8 py-3 rounded-2xl text-[15px] font-bold text-white active:scale-95" style={{ backgroundImage: GBRAND }}>თავიდან</button>}
          {online && role === "guest" && <div className="text-[13px]" style={{ color: "rgba(255,255,255,.6)" }}>ახალი თამაშისთვის ჰოსტი აჭერს „თავიდან"</div>}
          <button onClick={leave} className="px-8 py-2.5 mt-2 text-[14px] font-semibold" style={{ color: "rgba(255,255,255,.6)" }}>გასვლა</button>
        </div>
      )}
    </div>
  );
}
