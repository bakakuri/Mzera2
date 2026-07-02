import React, { useState, useEffect, useRef } from "react";
import { C, GRADS, DISPLAY, MONO, GBRAND, Avatar, USERS, ME, Tilt } from "./core";
import { ArrowLeft } from "./core";
import { newGame, throwCards, cover, take, botMove, canThrow, isValidCover, cardId, cardPts, handPts, SUIT_SYM, SUIT_RED } from "../lib/bura";

const DIFFS = [{ k: "easy", t: "მარტივი" }, { k: "normal", t: "საშუალო" }, { k: "hard", t: "რთული" }];

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
  const [sel, setSel] = useState([]);       // selected card ids (human)
  const [thinking, setThinking] = useState(false);
  const [starter, setStarter] = useState(0);

  const start = () => { setG(newGame({ starter })); setSel([]); setScreen("play"); };
  const again = () => { const ns = 1 - starter; setStarter(ns); setG(newGame({ starter: ns })); setSel([]); };

  // bot auto-plays whenever it is its turn
  useEffect(() => {
    if (!g || g.phase === "over" || g.turn !== 1) { setThinking(false); return; }
    setThinking(true);
    const t = setTimeout(() => {
      setG(cur => {
        if (!cur || cur.phase === "over" || cur.turn !== 1) return cur;
        const mv = botMove(cur, 1, diff);
        if (!mv) return cur;
        if (mv.kind === "throw") return throwCards(cur, mv.cards);
        if (mv.kind === "cover") return cover(cur, mv.cards);
        if (mv.kind === "take") return take(cur);
        return cur;
      });
      setThinking(false);
    }, 850);
    return () => clearTimeout(t);
  }, [g, diff]);

  if (screen === "menu") {
    return (
      <div className="fixed inset-0 z-[95] flex flex-col" style={{ background: C.paper }}>
        <div className="flex items-center gap-3 px-4 py-3"><button onClick={onExit} className="active:scale-90"><ArrowLeft size={22} style={{ color: C.ink }} /></button><span className="font-bold text-[17px]" style={{ color: C.ink, fontFamily: DISPLAY }}>ბურა</span></div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 -mt-10">
          <div style={{ fontSize: 64 }}>🃏</div>
          <h1 className="text-[30px] font-bold mt-2" style={{ color: C.ink, fontFamily: DISPLAY }}>ბურა</h1>
          <p className="text-[14px] mt-1 mb-8 text-center" style={{ color: C.muted }}>36 კარტი · 61 ქულამდე</p>
          <div className="w-full max-w-[320px]">
            <div className="text-[12.5px] font-semibold mb-2" style={{ color: C.ink2 }}>სირთულე</div>
            <div className="flex gap-2 mb-6">{DIFFS.map(d => <button key={d.k} onClick={() => setDiff(d.k)} className="flex-1 py-2.5 rounded-xl text-[13.5px] font-bold transition active:scale-95" style={diff === d.k ? { backgroundImage: GBRAND, color: "#fff" } : { background: C.surfaceMuted, color: C.ink2 }}>{d.t}</button>)}</div>
            <button onClick={start} className="w-full py-3.5 rounded-2xl text-[16px] font-bold text-white active:scale-[.98]" style={{ backgroundImage: GBRAND, boxShadow: "0 2px 0 rgba(64,44,150,.32), 0 10px 24px -6px rgba(103,80,242,.55)" }}>თამაში ბოტთან</button>
            <button disabled className="w-full py-3 rounded-2xl text-[14px] font-semibold mt-2" style={{ background: C.surfaceMuted, color: C.faint }}>ონლაინ ხალხთან · მალე</button>
          </div>
        </div>
      </div>
    );
  }

  if (!g) return null;
  const trump = g.trumpSuit;
  const myHand = g.hands[0];
  const oppCount = g.hands[1].length;
  const iLead = g.phase === "lead" && g.turn === 0;
  const iDefend = g.phase === "defend" && g.turn === 0;
  const selCards = myHand.filter(c => sel.includes(cardId(c)));
  const canPlay = iLead ? canThrow(myHand, selCards) : false;
  const canClose = iDefend && sel.length === g.attackCards.length && isValidCover(g.attackCards, selCards, trump);
  const toggle = (c) => { const id = cardId(c); setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]); };

  const statusText = g.phase === "over" ? "" : iLead ? "შენი სვლა — ჩააგდე კარტ(ებ)ი" : iDefend ? "დაიცავი — დახურე ან აიღე" : thinking ? "ბოტი ფიქრობს…" : "ბოტის სვლა…";

  return (
    <div className="fixed inset-0 z-[95] flex flex-col" style={{ background: "radial-gradient(circle at 50% 30%, #14351f, #0c1f13 70%)" }}>
      {/* top bar */}
      <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "rgba(0,0,0,.25)" }}>
        <button onClick={onExit} className="active:scale-90"><ArrowLeft size={22} color="#fff" /></button>
        <span className="text-[13px] font-bold" style={{ color: "rgba(255,255,255,.7)", fontFamily: MONO }}>ბურა · {g.captured[0]}–{g.captured[1]} · 61</span>
        <button onClick={again} className="active:scale-90" style={{ color: "#fff", fontSize: 20, lineHeight: 1 }}>↻</button>
      </div>

      {/* opponent */}
      <div className="flex items-center gap-2.5 px-4 py-2">
        <Avatar id={ME} size={34} />
        <div className="flex-1"><div className="text-[13.5px] font-bold" style={{ color: "#fff" }}>ბოტი</div><div className="text-[11px]" style={{ color: "rgba(255,255,255,.55)", fontFamily: MONO }}>ქულა: {g.captured[1]}</div></div>
        <div className="flex" style={{ gap: -14 }}>{g.hands[1].map((c, i) => <div key={i} style={{ marginLeft: i ? -14 : 0 }}><CardFace down size="sm" /></div>)}</div>
      </div>

      {/* table */}
      <div className="flex-1 flex flex-col items-center justify-center relative px-4">
        {/* trump + talon */}
        <div className="absolute left-4 top-2 flex flex-col items-center">
          <div style={{ position: "relative" }}>
            {g.trumpCard && <div style={{ transform: "rotate(90deg)", transformOrigin: "center" }}><CardFace card={g.trumpCard} size="sm" /></div>}
            <div style={{ position: "absolute", left: -6, top: -4 }}><CardFace down size="sm" /></div>
          </div>
          <span className="text-[10.5px] mt-3" style={{ color: "rgba(255,255,255,.6)", fontFamily: MONO }}>დასტა: {g.talon.length}</span>
          <span className="text-[15px] mt-0.5" style={{ color: SUIT_RED[trump] ? "#ff6b6f" : "#fff" }}>კოზირი {SUIT_SYM[trump]}</span>
        </div>

        {/* played cards */}
        <div className="flex flex-col items-center gap-2">
          {g.attackCards.length > 0 ? (
            <>
              <div className="flex" style={{ gap: 6 }}>{g.attackCards.map((c, i) => <CardFace key={i} card={c} size="md" />)}</div>
              <span className="text-[11px]" style={{ color: "rgba(255,255,255,.5)", fontFamily: MONO }}>{g.turn === 0 ? "ბოტმა ჩააგდო" : "შენ ჩააგდე"}</span>
            </>
          ) : (
            <div style={{ color: "rgba(255,255,255,.35)", fontSize: 13 }}>{statusText}</div>
          )}
        </div>
        {g.attackCards.length > 0 && <div className="mt-2 text-[12.5px] font-semibold" style={{ color: "rgba(255,255,255,.8)" }}>{statusText}</div>}
      </div>

      {/* my captured */}
      <div className="px-4 pb-1 text-center"><span className="text-[11.5px]" style={{ color: "rgba(255,255,255,.55)", fontFamily: MONO }}>შენი ქულა: {g.captured[0]}</span></div>

      {/* my hand */}
      <div className="px-3 pt-1 flex items-end justify-center flex-wrap gap-1.5" style={{ minHeight: 96 }}>
        {myHand.map((c) => { const id = cardId(c); const lifted = sel.includes(id); const selectable = (iLead || iDefend); return <div key={id} style={{ marginTop: 6 }}><CardFace card={c} size="md" lifted={lifted} onClick={selectable ? () => toggle(c) : undefined} /></div>; })}
        {myHand.length === 0 && <span style={{ color: "rgba(255,255,255,.4)", fontSize: 13 }}>ხელი ცარიელია</span>}
      </div>

      {/* actions */}
      <div className="px-4 pt-2" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        {iLead && <button onClick={() => { const ng = throwCards(g, selCards); setG(ng); setSel([]); }} disabled={!canPlay} className="w-full py-3.5 rounded-2xl text-[16px] font-bold text-white active:scale-[.98]" style={{ backgroundImage: GBRAND, opacity: canPlay ? 1 : 0.4 }}>ჩააგდე{selCards.length ? ` (${selCards.length})` : ""}</button>}
        {iDefend && <div className="flex gap-2">
          <button onClick={() => { const ng = take(g); setG(ng); setSel([]); }} className="flex-1 py-3.5 rounded-2xl text-[15px] font-bold active:scale-[.98]" style={{ background: C.surfaceMuted, color: C.ink }}>ავიღე</button>
          <button onClick={() => { const ng = cover(g, selCards); setG(ng); setSel([]); }} disabled={!canClose} className="flex-1 py-3.5 rounded-2xl text-[15px] font-bold text-white active:scale-[.98]" style={{ backgroundImage: GBRAND, opacity: canClose ? 1 : 0.4 }}>დახურე</button>
        </div>}
        {!iLead && !iDefend && g.phase !== "over" && <div className="text-center py-3.5 text-[14px] font-semibold" style={{ color: "rgba(255,255,255,.55)" }}>{statusText}</div>}
      </div>

      {/* game over */}
      {g.phase === "over" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center" style={{ background: "rgba(0,0,0,.72)", backdropFilter: "blur(3px)" }}>
          <div style={{ fontSize: 60 }}>{g.winner === 0 ? "🏆" : g.winner === "draw" ? "🤝" : "😔"}</div>
          <h2 className="text-[26px] font-bold mt-1" style={{ color: "#fff", fontFamily: DISPLAY }}>{g.winner === 0 ? "მოიგე!" : g.winner === "draw" ? "ფრე" : "წააგე"}</h2>
          <p className="text-[14px] mt-1 mb-7" style={{ color: "rgba(255,255,255,.7)", fontFamily: MONO }}>{g.captured[0]} – {g.captured[1]}</p>
          <button onClick={again} className="px-8 py-3 rounded-2xl text-[15px] font-bold text-white active:scale-95" style={{ backgroundImage: GBRAND }}>თავიდან</button>
          <button onClick={onExit} className="px-8 py-2.5 mt-2 text-[14px] font-semibold" style={{ color: "rgba(255,255,255,.6)" }}>გასვლა</button>
        </div>
      )}
    </div>
  );
}
