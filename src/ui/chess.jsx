import { useState, useEffect, useRef } from "react";
import { C, DISPLAY, MONO, GBRAND, ArrowLeft, X, USERS, ME } from "./core";
import { calls as callsApi } from "../lib/api";
import { newGame, legalMoves, makeMove, PIECE_GLYPH } from "../lib/chess";
import { botMove, botAcceptsDraw } from "../lib/chessBot";
import { Board3D } from "./chess3d";

const DIFFS = [{ k: "easy", t: "მარტივი" }, { k: "normal", t: "საშუალო" }, { k: "hard", t: "რთული" }];
const TIME_CONTROLS = [
  { k: "none", t: "დროის გარეშე", secs: null },
  { k: "b3", t: "3 წთ", secs: 180 },
  { k: "r5", t: "5 წთ", secs: 300 },
  { k: "r10", t: "10 წთ", secs: 600 },
];
const PROMO_PIECES = ["Q", "R", "B", "N"];
const PROMO_NAME = { Q: "ვეზირი", R: "ცული", B: "ფილი", N: "ცხენი" };
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const genCode = () => Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
const enemySide = (s) => (s === "w" ? "b" : "w");
const fmtClock = (secs) => { const s = Math.max(0, Math.round(secs)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };

export function ChessGame({ onExit }) {
  const [screen, setScreen] = useState("menu"); // menu | online-menu | online-wait | play
  const [mode, setMode] = useState("local");    // local | bot | online
  const [diff, setDiff] = useState("normal");
  const [tc, setTc] = useState(TIME_CONTROLS[0]);
  const [g, setG] = useState(null);
  const [sel, setSel] = useState(null);
  const [legal, setLegal] = useState([]);
  const [flipped, setFlipped] = useState(false);
  const [fullscreen, setFullscreen] = useState(true);
  const [promo, setPromo] = useState(null);

  const [clock, setClock] = useState(null); // { w, b } seconds, or null (no clock)
  const [outcome, setOutcome] = useState(null); // { type: "timeout"|"resign"|"draw", winner: "w"|"b"|null }
  const [resignAsk, setResignAsk] = useState(false);
  const [drawState, setDrawState] = useState(null); // null | "offered-by-me" | "offered-by-opp" | "declined"

  // online
  const [role, setRole] = useState(null); // null | "host" | "guest"
  const [code, setCode] = useState("");
  const [players, setPlayers] = useState(null);
  const [joinCode, setJoinCode] = useState("");
  const [joinErr, setJoinErr] = useState("");
  const [oppLeft, setOppLeft] = useState(false);

  const chRef = useRef(null), readyRef = useRef(false), queueRef = useRef([]);
  const gRef = useRef(null), playersRef = useRef(null), roleRef = useRef(null), onMsgRef = useRef(null), clockRef = useRef(null);
  gRef.current = g; playersRef.current = players; roleRef.current = role; clockRef.current = clock;

  const online = mode === "online";
  const meIdx = online ? (role === "guest" ? 1 : 0) : 0;
  const mySide = mode === "bot" ? "w" : online ? (meIdx === 0 ? "w" : "b") : null; // null = hot-seat, either side selectable
  const ended = !!g && (g.status === "checkmate" || g.status === "stalemate" || !!outcome);

  const sendRaw = (ch, payload) => { try { ch.send({ type: "broadcast", event: "c", payload }); } catch (e) {} };
  const send = (payload) => {
    if (chRef.current && readyRef.current) sendRaw(chRef.current, payload);
    else queueRef.current.push(payload);
  };

  const startClock = () => (tc.secs != null ? { w: tc.secs, b: tc.secs } : null);

  const onMsg = (m) => {
    const r = roleRef.current;
    if (r === "host") {
      if (m.t === "hello") {
        if (!gRef.current) {
          const pl = [ME, m.from]; setPlayers(pl);
          const ns = newGame(); const cl = startClock();
          setG(ns); setClock(cl); setOutcome(null); setDrawState(null); setOppLeft(false); setScreen("play");
          send({ t: "state", state: ns, players: pl, clock: cl });
        } else send({ t: "state", state: gRef.current, players: playersRef.current, clock: clockRef.current });
      } else if (m.t === "move") {
        const cur = gRef.current; if (!cur) return;
        const ns = makeMove(cur, m.from, m.to, m.promoteTo);
        if (ns !== cur) { setG(ns); send({ t: "state", state: ns, players: playersRef.current, clock: clockRef.current }); }
      } else if (m.t === "resign") {
        const out = { type: "resign", winner: "w" }; // only the guest (black) ever sends this to the host
        setOutcome(out); send({ t: "outcome", outcome: out });
      } else if (m.t === "drawOffer") setDrawState("offered-by-opp");
      else if (m.t === "drawResponse") {
        if (m.accept) { const out = { type: "draw", winner: null }; setOutcome(out); send({ t: "outcome", outcome: out }); }
        else setDrawState(null);
      } else if (m.t === "drawDeclined") setDrawState("declined");
      else if (m.t === "bye") setOppLeft(true);
    } else if (r === "guest") {
      if (m.t === "state") { setG(m.state); setPlayers(m.players); setClock(m.clock); setOutcome(null); setOppLeft(false); setJoinErr(""); setScreen("play"); }
      else if (m.t === "outcome") setOutcome(m.outcome);
      else if (m.t === "drawOffer") setDrawState("offered-by-opp");
      else if (m.t === "drawDeclined") setDrawState("declined");
      else if (m.t === "bye") setOppLeft(true);
    }
  };
  onMsgRef.current = onMsg;

  useEffect(() => {
    if (!code || !role) return;
    const ch = callsApi.channel("chess-" + code);
    chRef.current = ch; readyRef.current = false;
    ch.on("broadcast", { event: "c" }, ({ payload }) => { if (onMsgRef.current) onMsgRef.current(payload); });
    ch.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        readyRef.current = true;
        queueRef.current.forEach((p) => sendRaw(ch, p)); queueRef.current = [];
        if (roleRef.current === "guest") sendRaw(ch, { t: "hello", from: ME });
      }
    });
    return () => { try { ch.unsubscribe(); } catch (e) {} chRef.current = null; readyRef.current = false; };
  }, [code, role]);

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

  // bot plays black after a short "thinking" delay
  useEffect(() => {
    if (mode !== "bot" || !g || g.turn !== "b" || outcome || (g.status !== "playing" && g.status !== "check")) return;
    const t = setTimeout(() => {
      setG((cur) => {
        if (!cur || cur.turn !== "b") return cur;
        const mv = botMove(cur, "b", diff);
        if (!mv) return cur;
        return makeMove(cur, mv.from, mv.to, mv.promotion ? "Q" : undefined);
      });
    }, 550);
    return () => clearTimeout(t);
  }, [g, mode, diff, outcome]);

  // bot judges an incoming draw offer
  useEffect(() => {
    if (mode !== "bot" || drawState !== "offered-by-opp") return;
    const t = setTimeout(() => {
      if (g && botAcceptsDraw(g, "b")) setOutcome({ type: "draw", winner: null });
      else setDrawState("declined");
    }, 700);
    return () => clearTimeout(t);
  }, [mode, drawState, g]);

  // visual clock countdown (every client ticks its own displayed clock)
  useEffect(() => {
    if (!clock || ended || !g) return;
    const iv = setInterval(() => {
      setClock((c) => {
        if (!c) return c;
        const side = gRef.current.turn;
        return { ...c, [side]: Math.max(0, c[side] - 1) };
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [clock != null, ended, g && g.status]);

  // timeout detection (authoritative party only: local/bot always, online only the host)
  useEffect(() => {
    if (!clock || ended || !g) return;
    if (online && role !== "host") return;
    if (clock[g.turn] <= 0) {
      const out = { type: "timeout", winner: enemySide(g.turn) };
      setOutcome(out);
      if (online) send({ t: "outcome", outcome: out });
    }
  }, [clock, g && g.turn]);

  useEffect(() => {
    if (drawState !== "declined") return;
    const t = setTimeout(() => setDrawState(null), 3000);
    return () => clearTimeout(t);
  }, [drawState]);

  const startLocal = () => { setMode("local"); setRole(null); setPlayers(null); setG(newGame()); setClock(startClock()); setOutcome(null); setDrawState(null); setSel(null); setLegal([]); setFlipped(false); setScreen("play"); };
  const startBot = () => { setMode("bot"); setRole(null); setPlayers(null); setG(newGame()); setClock(startClock()); setOutcome(null); setDrawState(null); setSel(null); setLegal([]); setFlipped(false); setScreen("play"); };
  const createRoom = () => { setMode("online"); setJoinErr(""); setPlayers(null); setG(null); setClock(null); setOutcome(null); setDrawState(null); setCode(genCode()); setRole("host"); setFlipped(false); setScreen("online-wait"); };
  const joinRoom = () => {
    const c = joinCode.trim().toUpperCase();
    if (c.length < 3) { setJoinErr("შეიყვანე კოდი"); return; }
    setMode("online"); setJoinErr(""); setPlayers(null); setG(null); setClock(null); setOutcome(null); setDrawState(null); setCode(c); setRole("guest"); setFlipped(true); setScreen("online-wait");
  };
  const leave = () => { if (online) send({ t: "bye", from: ME }); onExit(); };
  const backToMenu = () => {
    if (online) send({ t: "bye", from: ME });
    setRole(null); setCode(""); setPlayers(null); setG(null); setClock(null); setOutcome(null); setDrawState(null); setSel(null); setLegal([]); setJoinErr(""); setOppLeft(false); setScreen("menu");
  };

  const select = (r, c) => {
    if (!g || promo || ended) return;
    if (mySide && g.turn !== mySide) return; // not your side to move
    const p = g.board[r][c];
    if (sel && sel.r === r && sel.c === c) { setSel(null); setLegal([]); return; }
    if (p && p[0] === g.turn) { setSel({ r, c }); setLegal(legalMoves(g, r, c)); return; }
    if (sel) {
      const mv = legal.find((m) => m.to.r === r && m.to.c === c);
      if (mv) {
        if (mv.promotion) { setPromo({ from: sel, to: { r, c } }); return; }
        applyMove(sel, { r, c }, undefined);
        return;
      }
    }
    setSel(null); setLegal([]);
  };

  const applyMove = (from, to, promoteTo) => {
    if (!online) { setG((cur) => makeMove(cur, from, to, promoteTo)); setSel(null); setLegal([]); return; }
    if (role === "host") {
      const ns = makeMove(g, from, to, promoteTo);
      if (ns !== g) { setG(ns); send({ t: "state", state: ns, players, clock }); }
    } else send({ t: "move", from, to, promoteTo });
    setSel(null); setLegal([]);
  };

  const choosePromo = (piece) => { if (!promo) return; applyMove(promo.from, promo.to, piece); setPromo(null); };
  const resetGame = () => {
    if (online && role !== "host") return;
    const ns = newGame(); const cl = startClock();
    setG(ns); setClock(cl); setOutcome(null); setDrawState(null); setSel(null); setLegal([]); setPromo(null);
    if (online) send({ t: "state", state: ns, players, clock: cl });
  };

  const confirmResign = (side) => {
    setResignAsk(false);
    if (!online) { setOutcome({ type: "resign", winner: enemySide(side) }); return; }
    if (role === "host") { const out = { type: "resign", winner: enemySide(side) }; setOutcome(out); send({ t: "outcome", outcome: out }); }
    else send({ t: "resign", from: ME });
  };

  const offerDraw = () => {
    if (!online) { setDrawState("offered-by-opp"); return; } // local/bot: resolved on this same device right away
    setDrawState("offered-by-me");
    send({ t: "drawOffer", from: ME });
  };
  const respondDraw = (accept) => {
    if (accept) {
      if (!online) { setOutcome({ type: "draw", winner: null }); setDrawState(null); return; }
      if (role === "host") { const out = { type: "draw", winner: null }; setOutcome(out); send({ t: "outcome", outcome: out }); }
      else send({ t: "drawResponse", accept: true });
    } else {
      setDrawState(null);
      if (online) send({ t: "drawDeclined" });
    }
  };

  // ══════════════ MENU ══════════════
  if (screen === "menu") {
    return (
      <div className="fixed inset-0 z-[95] flex flex-col" style={{ background: C.paper }}>
        <div className="flex items-center gap-3 px-4 py-3"><button onClick={onExit} className="active:scale-90"><ArrowLeft size={22} style={{ color: C.ink }} /></button><span className="font-bold text-[17px]" style={{ color: C.ink, fontFamily: DISPLAY }}>ჭადრაკი</span></div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 -mt-8 overflow-y-auto">
          <div style={{ fontSize: 64 }}>♟️</div>
          <h1 className="text-[28px] font-bold mt-2" style={{ color: C.ink, fontFamily: DISPLAY }}>ჭადრაკი</h1>
          <p className="text-[14px] mt-1 mb-7 text-center" style={{ color: C.muted }}>3D დაფა · სრული წესებით</p>
          <div className="w-full max-w-[320px]">
            <div className="text-[12.5px] font-semibold mb-2" style={{ color: C.ink2 }}>სირთულე (ბოტთან)</div>
            <div className="flex gap-2 mb-5">{DIFFS.map((d) => <button key={d.k} onClick={() => setDiff(d.k)} className="flex-1 py-2.5 rounded-xl text-[13.5px] font-bold transition active:scale-95" style={diff === d.k ? { backgroundImage: GBRAND, color: "#fff" } : { background: C.surfaceMuted, color: C.ink2 }}>{d.t}</button>)}</div>
            <div className="text-[12.5px] font-semibold mb-2" style={{ color: C.ink2 }}>დროის კონტროლი</div>
            <div className="flex gap-2 mb-5 flex-wrap">{TIME_CONTROLS.map((d) => <button key={d.k} onClick={() => setTc(d)} className="flex-1 py-2.5 rounded-xl text-[13px] font-bold transition active:scale-95" style={{ minWidth: 70, ...(tc.k === d.k ? { backgroundImage: GBRAND, color: "#fff" } : { background: C.surfaceMuted, color: C.ink2 }) }}>{d.t}</button>)}</div>
            <button onClick={startBot} className="w-full py-3.5 rounded-2xl text-[16px] font-bold text-white active:scale-[.98]" style={{ backgroundImage: GBRAND, boxShadow: "0 2px 0 rgba(64,44,150,.32), 0 10px 24px -6px rgba(103,80,242,.55)" }}>თამაში ბოტთან</button>
            <button onClick={() => { setJoinErr(""); setScreen("online-menu"); }} className="w-full py-3.5 rounded-2xl text-[16px] font-bold mt-2.5 active:scale-[.98]" style={{ background: C.surface, color: C.ink, border: `1.5px solid ${C.line}` }}>ონლაინ ხალხთან 🌐</button>
            <button onClick={startLocal} className="w-full py-3.5 rounded-2xl text-[16px] font-bold mt-2.5 active:scale-[.98]" style={{ background: C.surfaceMuted, color: C.ink2 }}>ორ მოთამაშე, ერთ ეკრანზე</button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════ ONLINE MENU ══════════════
  if (screen === "online-menu") {
    return (
      <div className="fixed inset-0 z-[95] flex flex-col" style={{ background: C.paper }}>
        <div className="flex items-center gap-3 px-4 py-3"><button onClick={() => setScreen("menu")} className="active:scale-90"><ArrowLeft size={22} style={{ color: C.ink }} /></button><span className="font-bold text-[17px]" style={{ color: C.ink, fontFamily: DISPLAY }}>ონლაინ ჭადრაკი</span></div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 -mt-8">
          <div style={{ fontSize: 54 }}>🌐</div>
          <p className="text-[14px] mt-2 mb-7 text-center" style={{ color: C.muted }}>შექმენი ოთახი და კოდი გაუზიარე მეგობარს,<br />ან შეიყვანე მისი კოდი</p>
          <div className="w-full max-w-[320px]">
            <button onClick={createRoom} className="w-full py-3.5 rounded-2xl text-[16px] font-bold text-white active:scale-[.98]" style={{ backgroundImage: GBRAND }}>შექმენი ოთახი (თეთრი)</button>
            <div className="flex items-center gap-3 my-4"><div style={{ flex: 1, height: 1, background: C.line }} /><span className="text-[12px]" style={{ color: C.faint }}>ან</span><div style={{ flex: 1, height: 1, background: C.line }} /></div>
            <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 4))} placeholder="კოდი (მაგ. K7QP)" maxLength={4} className="w-full px-4 py-3 rounded-xl text-[18px] font-bold text-center outline-none tracking-[0.3em]" style={{ background: C.surfaceMuted, color: C.ink, fontFamily: MONO }} />
            {joinErr && <div className="text-[12.5px] mt-2 text-center" style={{ color: "#e5484d" }}>{joinErr}</div>}
            <button onClick={joinRoom} className="w-full py-3.5 rounded-2xl text-[15px] font-bold mt-3 active:scale-[.98]" style={{ background: C.surface, color: C.ink, border: `1.5px solid ${C.line}` }}>შესვლა კოდით (შავი)</button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════ WAITING ROOM ══════════════
  if (screen === "online-wait") {
    return (
      <div className="fixed inset-0 z-[95] flex flex-col" style={{ background: C.paper }}>
        <div className="flex items-center gap-3 px-4 py-3"><button onClick={backToMenu} className="active:scale-90"><ArrowLeft size={22} style={{ color: C.ink }} /></button><span className="font-bold text-[17px]" style={{ color: C.ink, fontFamily: DISPLAY }}>ონლაინ ჭადრაკი</span></div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 -mt-8 text-center">
          {role === "host" ? (
            <>
              <div style={{ fontSize: 48 }}>♟️</div>
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
  const oppId = online && players ? players[1 - meIdx] : null;
  const oppName = online ? (oppId && USERS[oppId] ? USERS[oppId].name : "მოწინააღმდეგე") : mode === "bot" ? "ბოტი" : null;

  const statusText = outcome
    ? outcome.type === "timeout"
      ? (outcome.winner === "w" ? "შავს ამოეწურა დრო — თეთრი გაიმარჯვა 🏆" : "თეთრს ამოეწურა დრო — შავი გაიმარჯვა 🏆")
      : outcome.type === "resign"
      ? (outcome.winner === "w" ? "შავმა თქვა დანება — თეთრი გაიმარჯვა 🏆" : "თეთრმა თქვა დანება — შავი გაიმარჯვა 🏆")
      : "ფრედზე შეთანხმდნენ — ფრე 🤝"
    : g.status === "checkmate"
    ? (g.turn === "w" ? "მატი! შავი გაიმარჯვა 🏆" : "მატი! თეთრი გაიმარჯვა 🏆")
    : g.status === "stalemate" ? "პატი — ფრე 🤝"
    : g.status === "check" ? (g.turn === "w" ? "თეთრს ეშმაკია — შემოწმებაშია!" : "შავს ეშმაკია — შემოწმებაშია!")
    : online ? (g.turn === (meIdx === 0 ? "w" : "b") ? "შენი სვლაა" : `${oppName}-ის სვლაა`)
    : mode === "bot" ? (g.turn === "w" ? "შენი სვლაა" : "ბოტი ფიქრობს…")
    : (g.turn === "w" ? "თეთრის სვლაა" : "შავის სვლაა");

  const clockPill = (side) => clock && (
    <span className="px-2.5 py-1 rounded-lg text-[13px] font-bold" style={{ fontFamily: MONO, background: !ended && g.turn === side ? C.accentSoft : C.surfaceMuted, color: !ended && g.turn === side ? C.accentText : C.ink2 }}>{fmtClock(clock[side])}</span>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[95]" style={{ background: "#0b0b10" }}>
        <div className="absolute inset-0">
          <Board3D game={g} selected={sel} legalTargets={legal} onSquareTap={select} flipped={flipped} disabled={ended || !!promo || (mySide != null && g.turn !== mySide)} />
        </div>

        <div className="absolute top-0 inset-x-0 z-10 flex items-center gap-2.5 px-3" style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.65rem)", paddingBottom: "0.65rem", background: "linear-gradient(rgba(0,0,0,.65), rgba(0,0,0,0))" }}>
          <button onClick={online ? backToMenu : leave} className="active:scale-90"><ArrowLeft size={21} color="#fff" /></button>
          <span className="font-bold text-[14px] flex-1 truncate" style={{ color: "#fff", fontFamily: DISPLAY }}>{online ? `ონლაინ · ${oppName}` : "ჭადრაკი"}</span>
          <button onClick={() => setFlipped((f) => !f)} className="px-2.5 py-1.5 rounded-full text-[12px] font-bold active:scale-95" style={{ background: "rgba(255,255,255,.16)", color: "#fff" }}>მოტრიალება</button>
          <button onClick={() => setFullscreen((f) => !f)} className="px-2.5 py-1.5 rounded-full text-[12px] font-bold active:scale-95" style={{ background: "rgba(255,255,255,.16)", color: "#fff" }}>დაკეცვა</button>
        </div>

        <div className="absolute inset-x-0 z-10 px-4 flex flex-col items-center gap-2" style={{ top: "calc(env(safe-area-inset-top) + 3.4rem)" }}>
          <div className="px-4 py-1.5 rounded-full text-center font-bold text-[13px]" style={{ background: "rgba(18,18,24,.72)", backdropFilter: "blur(8px)", color: "#fff", fontFamily: DISPLAY }}>{statusText}</div>
          {!ended && (
            <div className="flex gap-2">
              <button onClick={() => setResignAsk(true)} className="px-3.5 py-1.5 rounded-full text-[12.5px] font-bold active:scale-95" style={{ background: "rgba(229,72,77,.85)", color: "#fff" }}>დანებება</button>
              <button onClick={offerDraw} disabled={drawState === "offered-by-me"} className="px-3.5 py-1.5 rounded-full text-[12.5px] font-bold active:scale-95" style={{ background: "rgba(255,255,255,.16)", color: "#fff", opacity: drawState === "offered-by-me" ? 0.5 : 1 }}>ფრედის შეთავაზება</button>
            </div>
          )}
          {ended && (!online || role === "host") && (
            <button onClick={resetGame} className="px-5 py-2 rounded-full text-[13px] font-bold text-white active:scale-95" style={{ backgroundImage: GBRAND }}>ახალი თამაში</button>
          )}
        </div>

        {promo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" style={{ background: "rgba(6,7,12,.6)", backdropFilter: "blur(4px)" }}>
            <div className="w-full max-w-[320px] rounded-3xl p-6 text-center" style={{ background: C.surface }}>
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-[16px]" style={{ color: C.ink, fontFamily: DISPLAY }}>აირჩიე ფიგურა</span>
                <button onClick={() => { setPromo(null); setSel(null); setLegal([]); }} style={{ color: C.faint }}><X size={20} /></button>
              </div>
              <div className="grid grid-cols-4 gap-2.5">
                {PROMO_PIECES.map((pc) => (
                  <button key={pc} onClick={() => choosePromo(pc)} className="flex flex-col items-center gap-1 py-3.5 rounded-2xl active:scale-95" style={{ background: C.surfaceMuted }}>
                    <span style={{ fontSize: 30 }}>{PIECE_GLYPH[g.turn + pc]}</span>
                    <span className="text-[11px] font-semibold" style={{ color: C.muted }}>{PROMO_NAME[pc]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {resignAsk && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" style={{ background: "rgba(6,7,12,.6)", backdropFilter: "blur(4px)" }} onClick={() => setResignAsk(false)}>
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[320px] rounded-3xl p-6 text-center" style={{ background: C.surface }}>
              <div className="font-bold text-[16px] mb-4" style={{ color: C.ink, fontFamily: DISPLAY }}>დანებება</div>
              {mode === "local" ? (
                <div className="flex flex-col gap-2.5">
                  <button onClick={() => confirmResign("w")} className="w-full py-3 rounded-2xl text-[14px] font-bold active:scale-[.98]" style={{ background: C.surfaceMuted, color: C.ink }}>თეთრი ნებდება</button>
                  <button onClick={() => confirmResign("b")} className="w-full py-3 rounded-2xl text-[14px] font-bold active:scale-[.98]" style={{ background: C.surfaceMuted, color: C.ink }}>შავი ნებდება</button>
                  <button onClick={() => setResignAsk(false)} className="w-full py-2.5 text-[13.5px] font-semibold" style={{ color: C.faint }}>გაუქმება</button>
                </div>
              ) : (
                <>
                  <p className="text-[14px] mb-4" style={{ color: C.muted }}>დარწმუნებული ხარ, რომ გინდა დანებება?</p>
                  <div className="flex gap-2.5">
                    <button onClick={() => setResignAsk(false)} className="flex-1 py-3 rounded-2xl text-[14px] font-bold active:scale-[.98]" style={{ background: C.surfaceMuted, color: C.ink2 }}>გაუქმება</button>
                    <button onClick={() => confirmResign(mySide)} className="flex-1 py-3 rounded-2xl text-[14px] font-bold text-white active:scale-[.98]" style={{ background: "#e5484d" }}>დანებება</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {drawState === "offered-by-opp" && mode === "local" && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" style={{ background: "rgba(6,7,12,.6)", backdropFilter: "blur(4px)" }}>
            <div className="w-full max-w-[320px] rounded-3xl p-6 text-center" style={{ background: C.surface }}>
              <div className="font-bold text-[16px] mb-4" style={{ color: C.ink, fontFamily: DISPLAY }}>ფრედის შეთავაზება</div>
              <p className="text-[14px] mb-4" style={{ color: C.muted }}>ეთანხმება მეორე მხარე ფრედს?</p>
              <div className="flex gap-2.5">
                <button onClick={() => respondDraw(false)} className="flex-1 py-3 rounded-2xl text-[14px] font-bold active:scale-[.98]" style={{ background: C.surfaceMuted, color: C.ink2 }}>უარი</button>
                <button onClick={() => respondDraw(true)} className="flex-1 py-3 rounded-2xl text-[14px] font-bold text-white active:scale-[.98]" style={{ backgroundImage: GBRAND }}>თანხმობა</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[95] flex flex-col" style={{ background: C.paper }}>
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={online ? backToMenu : leave} className="active:scale-90"><ArrowLeft size={22} style={{ color: C.ink }} /></button>
        <span className="font-bold text-[17px] flex-1 truncate" style={{ color: C.ink, fontFamily: DISPLAY }}>{online ? `ონლაინ · ${oppName}` : "ჭადრაკი"}</span>
        <button onClick={() => setFlipped((f) => !f)} className="px-3 py-1.5 rounded-full text-[12.5px] font-bold active:scale-95" style={{ background: C.surfaceMuted, color: C.ink2 }}>მოტრიალება</button>
        <button onClick={() => setFullscreen((f) => !f)} className="px-3 py-1.5 rounded-full text-[12.5px] font-bold active:scale-95" style={{ background: C.surfaceMuted, color: C.ink2 }}>გაშლა</button>
      </div>

      {oppLeft && <div className="mx-4 mb-1 px-3 py-2 rounded-xl text-[12.5px] font-semibold text-center" style={{ background: C.like + "1a", color: C.like }}>მოწინააღმდეგემ დატოვა თამაში</div>}
      {!ended && drawState === "declined" && <div className="mx-4 mb-1 px-3 py-2 rounded-xl text-[12.5px] font-semibold text-center" style={{ background: C.surfaceMuted, color: C.ink2 }}>ფრედს არ დათანხმდნენ</div>}
      {!ended && drawState === "offered-by-opp" && mode === "bot" && (
        <div className="mx-4 mb-1 px-3 py-2.5 rounded-xl text-center" style={{ background: C.accentSoft }}>
          <span className="text-[12.5px] font-bold" style={{ color: C.accentText }}>ბოტი ფიქრობს ფრედზე…</span>
        </div>
      )}
      {!ended && drawState === "offered-by-opp" && online && (
        <div className="mx-4 mb-1 px-3 py-2.5 rounded-xl flex items-center gap-2.5 justify-between" style={{ background: C.accentSoft }}>
          <span className="text-[12.5px] font-bold" style={{ color: C.accentText }}>შემოგთავაზეს ფრედი</span>
          <div className="flex gap-1.5 shrink-0"><button onClick={() => respondDraw(true)} className="px-3 py-1.5 rounded-full text-[12px] font-bold text-white" style={{ backgroundImage: GBRAND }}>თანხმობა</button><button onClick={() => respondDraw(false)} className="px-3 py-1.5 rounded-full text-[12px] font-bold" style={{ background: C.surface, color: C.ink2 }}>უარი</button></div>
        </div>
      )}
      {!ended && drawState === "offered-by-me" && <div className="mx-4 mb-1 px-3 py-2 rounded-xl text-[12.5px] font-semibold text-center" style={{ background: C.surfaceMuted, color: C.ink2 }}>ფრედის შეთავაზება გაიგზავნა…</div>}

      <div className="flex-1 min-h-0 flex flex-col items-center px-4 pb-6 overflow-y-auto">
        <div className="w-full flex items-center justify-between mt-1 mb-2" style={{ maxWidth: 480, minHeight: 26 }}>
          <div className="flex items-center gap-1 flex-wrap">{g.captured.b.map((p, i) => <span key={i} style={{ fontSize: 18 }}>{PIECE_GLYPH[p]}</span>)}</div>
          {clockPill("b")}
        </div>

        <div className="w-full rounded-3xl overflow-hidden shrink-0" style={{ maxWidth: 480, aspectRatio: "1", boxShadow: "0 14px 34px -10px rgba(0,0,0,.4)" }}>
          <Board3D game={g} selected={sel} legalTargets={legal} onSquareTap={select} flipped={flipped} disabled={ended || !!promo || (mySide != null && g.turn !== mySide)} />
        </div>

        <div className="w-full flex items-center justify-between mt-2 mb-1" style={{ maxWidth: 480, minHeight: 26 }}>
          <div className="flex items-center gap-1 flex-wrap">{g.captured.w.map((p, i) => <span key={i} style={{ fontSize: 18 }}>{PIECE_GLYPH[p]}</span>)}</div>
          {clockPill("w")}
        </div>

        <div className="w-full mt-2 py-3 rounded-2xl text-center font-bold text-[15px] shrink-0" style={{ maxWidth: 480, background: ended ? C.accentSoft : C.surface, color: ended ? C.accentText : C.ink, border: `1px solid ${C.line}`, fontFamily: DISPLAY }}>
          {statusText}
        </div>

        {g.history.length > 0 && (
          <div className="w-full mt-3 flex gap-1.5 flex-wrap" style={{ maxWidth: 480 }}>
            {g.history.map((h, i) => (
              <span key={i} className="px-2 py-1 rounded-lg text-[12px] font-bold" style={{ background: C.surfaceMuted, color: C.ink2, fontFamily: MONO }}>
                {i % 2 === 0 ? Math.floor(i / 2) + 1 + "." : ""}{h.san}
              </span>
            ))}
          </div>
        )}

        {!ended && (
          <div className="w-full flex gap-2.5 mt-4 shrink-0" style={{ maxWidth: 480 }}>
            <button onClick={() => setResignAsk(true)} className="flex-1 py-3 rounded-2xl text-[14px] font-bold active:scale-[.98]" style={{ background: C.surfaceMuted, color: "#e5484d" }}>დანებება</button>
            <button onClick={offerDraw} disabled={drawState === "offered-by-me"} className="flex-1 py-3 rounded-2xl text-[14px] font-bold active:scale-[.98]" style={{ background: C.surfaceMuted, color: C.ink2, opacity: drawState === "offered-by-me" ? 0.5 : 1 }}>ფრედის შეთავაზება</button>
          </div>
        )}

        {(ended && (!online || role === "host")) && (
          <button onClick={resetGame} className="w-full py-3.5 rounded-2xl text-[15px] font-bold text-white active:scale-[.98] mt-3 shrink-0" style={{ maxWidth: 480, backgroundImage: GBRAND }}>ახალი თამაში</button>
        )}
      </div>

      {promo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" style={{ background: "rgba(6,7,12,.6)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-[320px] rounded-3xl p-6 text-center" style={{ background: C.surface }}>
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-[16px]" style={{ color: C.ink, fontFamily: DISPLAY }}>აირჩიე ფიგურა</span>
              <button onClick={() => { setPromo(null); setSel(null); setLegal([]); }} style={{ color: C.faint }}><X size={20} /></button>
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              {PROMO_PIECES.map((pc) => (
                <button key={pc} onClick={() => choosePromo(pc)} className="flex flex-col items-center gap-1 py-3.5 rounded-2xl active:scale-95" style={{ background: C.surfaceMuted }}>
                  <span style={{ fontSize: 30 }}>{PIECE_GLYPH[g.turn + pc]}</span>
                  <span className="text-[11px] font-semibold" style={{ color: C.muted }}>{PROMO_NAME[pc]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {resignAsk && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" style={{ background: "rgba(6,7,12,.6)", backdropFilter: "blur(4px)" }} onClick={() => setResignAsk(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[320px] rounded-3xl p-6 text-center" style={{ background: C.surface }}>
            <div className="font-bold text-[16px] mb-4" style={{ color: C.ink, fontFamily: DISPLAY }}>დანებება</div>
            {mode === "local" ? (
              <div className="flex flex-col gap-2.5">
                <button onClick={() => confirmResign("w")} className="w-full py-3 rounded-2xl text-[14px] font-bold active:scale-[.98]" style={{ background: C.surfaceMuted, color: C.ink }}>თეთრი ნებდება</button>
                <button onClick={() => confirmResign("b")} className="w-full py-3 rounded-2xl text-[14px] font-bold active:scale-[.98]" style={{ background: C.surfaceMuted, color: C.ink }}>შავი ნებდება</button>
                <button onClick={() => setResignAsk(false)} className="w-full py-2.5 text-[13.5px] font-semibold" style={{ color: C.faint }}>გაუქმება</button>
              </div>
            ) : (
              <>
                <p className="text-[14px] mb-4" style={{ color: C.muted }}>დარწმუნებული ხარ, რომ გინდა დანებება?</p>
                <div className="flex gap-2.5">
                  <button onClick={() => setResignAsk(false)} className="flex-1 py-3 rounded-2xl text-[14px] font-bold active:scale-[.98]" style={{ background: C.surfaceMuted, color: C.ink2 }}>გაუქმება</button>
                  <button onClick={() => confirmResign(mySide)} className="flex-1 py-3 rounded-2xl text-[14px] font-bold text-white active:scale-[.98]" style={{ background: "#e5484d" }}>დანებება</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {drawState === "offered-by-opp" && mode === "local" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" style={{ background: "rgba(6,7,12,.6)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-[320px] rounded-3xl p-6 text-center" style={{ background: C.surface }}>
            <div className="font-bold text-[16px] mb-4" style={{ color: C.ink, fontFamily: DISPLAY }}>ფრედის შეთავაზება</div>
            <p className="text-[14px] mb-4" style={{ color: C.muted }}>ეთანხმება მეორე მხარე ფრედს?</p>
            <div className="flex gap-2.5">
              <button onClick={() => respondDraw(false)} className="flex-1 py-3 rounded-2xl text-[14px] font-bold active:scale-[.98]" style={{ background: C.surfaceMuted, color: C.ink2 }}>უარი</button>
              <button onClick={() => respondDraw(true)} className="flex-1 py-3 rounded-2xl text-[14px] font-bold text-white active:scale-[.98]" style={{ backgroundImage: GBRAND }}>თანხმობა</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
