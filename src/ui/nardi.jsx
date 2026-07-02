import React, { useState, useEffect, useRef } from "react";
import { C, DISPLAY, MONO, GBRAND, Avatar, USERS, ME } from "./core";
import { ArrowLeft, MessageCircle, Send, X } from "./core";
import { calls as callsApi } from "../lib/api";
import { newGame, openingRoll, rollDice, move, botChooseMove, legalFirstMoves, pipCount } from "../lib/nardi";

const DIFFS = [{ k: "easy", t: "მარტივი" }, { k: "normal", t: "საშუალო" }, { k: "hard", t: "რთული" }];
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const genCode = () => Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
const CHECKER_BG = {
  0: "radial-gradient(circle at 35% 28%, #ffffff, #e4e7ef 55%, #b7bccb 100%)",
  1: "radial-gradient(circle at 35% 28%, #565c6b, #23262f 55%, #050608 100%)",
};
const CHECKER_RING = { 0: "#aeb3c2", 1: "#000" };
const PT_TINT = ["#c98a4b", "#5a3a24"]; // alternating triangle tones (wood look)

function Checker({ player, size = 22, pop }) {
  return <div className={pop ? "nardi-checker-in" : ""} style={{ width: size, height: size, borderRadius: "50%", background: CHECKER_BG[player], border: `1.5px solid ${CHECKER_RING[player]}`, boxShadow: "0 2px 4px rgba(0,0,0,.45), inset 0 1px 1px rgba(255,255,255,.5)", flex: "0 0 auto" }} />;
}

function Point({ idx, count, top, selectable, onClick, tint, setRef, hitFlash }) {
  const player = count > 0 ? 0 : count < 0 ? 1 : null;
  const n = Math.abs(count);
  const shown = Math.min(n, 5);
  const checkers = Array.from({ length: shown }, (_, i) => <Checker key={i} player={player} size={19} pop={hitFlash && i === shown - 1} />);
  const clip = top ? "polygon(0 0, 100% 0, 50% 100%)" : "polygon(50% 0, 100% 100%, 0 100%)";
  return (
    <div ref={setRef} className={"relative flex-1 " + (hitFlash ? "nardi-hit" : "")} style={{ minWidth: 0, height: 116 }}>
      <div className="absolute inset-0" style={{ clipPath: clip, background: tint, opacity: 0.92 }} />
      <button
        onClick={onClick}
        disabled={!selectable}
        className={"relative w-full h-full flex flex-col items-center active:opacity-80 " + (selectable ? "nardi-selectable" : "")}
        style={{ borderRadius: 4, justifyContent: top ? "flex-start" : "flex-end", padding: "4px 1px", gap: 2, background: "transparent" }}
      >
        <div style={{ display: "flex", flexDirection: top ? "column" : "column-reverse", gap: 2, alignItems: "center" }}>{checkers}</div>
        {n > 5 && <span style={{ fontSize: 10, fontFamily: MONO, color: "#fff", fontWeight: 700, textShadow: "0 1px 2px rgba(0,0,0,.8)" }}>+{n - 5}</span>}
        <span style={{ position: "absolute", [top ? "bottom" : "top"]: 3, fontSize: 8.5, color: "rgba(255,255,255,.55)", fontFamily: MONO }}>{idx + 1}</span>
      </button>
    </div>
  );
}

const PIP_LAYOUT = {
  1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
};
function Die({ value, dim, rolling }) {
  const pips = PIP_LAYOUT[value] || [];
  return (
    <div className={rolling ? "nardi-dice-roll" : ""} style={{ width: 26, height: 26, borderRadius: 6, background: dim ? "rgba(255,255,255,.25)" : "linear-gradient(160deg,#fff,#e7e9ef)", boxShadow: dim ? "none" : "0 2px 4px rgba(0,0,0,.4)", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gridTemplateRows: "repeat(3,1fr)", padding: 3.5, gap: 1 }}>
      {Array.from({ length: 9 }, (_, i) => <div key={i} style={{ borderRadius: "50%", background: pips.includes(i) ? (dim ? "rgba(255,255,255,.6)" : "#23262f") : "transparent" }} />)}
    </div>
  );
}

export function NardiGame({ onExit }) {
  const [screen, setScreen] = useState("menu");
  const [diff, setDiff] = useState("normal");
  const [g, setG] = useState(null);
  const [pendingFrom, setPendingFrom] = useState(null); // point with >1 legal die, awaiting die pick
  const [thinking, setThinking] = useState(false);
  // online
  const [role, setRole] = useState(null);
  const [code, setCode] = useState("");
  const [players, setPlayers] = useState(null);
  const [joinCode, setJoinCode] = useState("");
  const [joinErr, setJoinErr] = useState("");
  const [oppLeft, setOppLeft] = useState(false);
  const [chatMsgs, setChatMsgs] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const [chatInput, setChatInput] = useState("");

  const online = role !== null;
  const chRef = useRef(null), readyRef = useRef(false), queueRef = useRef([]);
  const gRef = useRef(null), playersRef = useRef(null), roleRef = useRef(null), onMsgRef = useRef(null), chatOpenRef = useRef(false);
  const chatListRef = useRef(null);
  gRef.current = g; playersRef.current = players; roleRef.current = role; chatOpenRef.current = chatOpen;

  // ── animation: sliding "flying" checker between points (FLIP technique) ──
  const boardRef = useRef(null);
  const pointRefs = useRef({});
  const barRefs = useRef({});
  const offRefs = useRef({});
  const lastAnimatedRef = useRef(null);
  const [flying, setFlying] = useState(null);
  const [hitIdx, setHitIdx] = useState(null);
  useEffect(() => {
    if (!g || !g.last || g.last.type) return; // roll/opening/no-moves aren't checker moves
    if (lastAnimatedRef.current === g.last) return;
    lastAnimatedRef.current = g.last;
    const { from, to, by, hit } = g.last;
    const originEl = from === "bar" ? barRefs.current[by] : pointRefs.current[from];
    const destEl = to === "off" ? offRefs.current[by] : pointRefs.current[to];
    const boardEl = boardRef.current;
    if (!originEl || !destEl || !boardEl) return;
    const bR = boardEl.getBoundingClientRect(), oR = originEl.getBoundingClientRect(), dR = destEl.getBoundingClientRect();
    const sx = oR.left + oR.width / 2 - bR.left, sy = oR.top + oR.height / 2 - bR.top;
    const ex = dR.left + dR.width / 2 - bR.left, ey = dR.top + dR.height / 2 - bR.top;
    setFlying({ player: by, x: sx, y: sy, moving: false });
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => setFlying({ player: by, x: ex, y: ey, moving: true }));
      lastAnimatedRef.current.__raf2 = raf2;
    });
    const t1 = setTimeout(() => setFlying(null), 340);
    const t2 = hit ? setTimeout(() => { setHitIdx(to); setTimeout(() => setHitIdx(null), 360); }, 300) : null;
    return () => { cancelAnimationFrame(raf1); clearTimeout(t1); if (t2) clearTimeout(t2); };
  }, [g]);

  // ── animation: dice tumble/flicker on a fresh roll ──
  const [displayDice, setDisplayDice] = useState([]);
  const [diceRolling, setDiceRolling] = useState(false);
  const lastRolledRef = useRef(null);
  useEffect(() => {
    if (!g) return;
    const isFreshRoll = g.last && (g.last.type === "roll" || g.last.type === "opening") && g.last !== lastRolledRef.current;
    if (isFreshRoll) {
      lastRolledRef.current = g.last;
      setDiceRolling(true);
      let n = 0;
      const iv = setInterval(() => {
        setDisplayDice([1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]);
        n++;
        if (n >= 5) { clearInterval(iv); setDisplayDice(g.dice); setDiceRolling(false); }
      }, 65);
      return () => clearInterval(iv);
    }
    setDisplayDice(g.dice);
  }, [g]);

  const sendRaw = (ch, payload) => { try { ch.send({ type: "broadcast", event: "b", payload }); } catch (e) {} };
  const send = (payload) => {
    if (chRef.current && readyRef.current) sendRaw(chRef.current, payload);
    else queueRef.current.push(payload);
  };

  const onMsg = (m) => {
    if (m.t === "chat") {
      setChatMsgs(list => [...list, m]);
      if (!chatOpenRef.current) setChatUnread(u => u + 1);
      return;
    }
    const r = roleRef.current;
    if (r === "host") {
      if (m.t === "hello") {
        if (!gRef.current) {
          const pl = [ME, m.from]; setPlayers(pl);
          const ns = newGame(); setG(ns); setOppLeft(false); setScreen("online");
          send({ t: "state", state: ns, players: pl });
        } else send({ t: "state", state: gRef.current, players: playersRef.current });
      } else if (m.t === "move") {
        const cur = gRef.current; if (!cur) return;
        let ns = cur;
        if (cur.turn === 1) {
          if (m.kind === "roll") ns = rollDice(cur, Math.random);
          else if (m.kind === "move") ns = move(cur, m.from, m.die);
        }
        if (ns !== cur) { setG(ns); send({ t: "state", state: ns, players: playersRef.current }); }
      } else if (m.t === "bye") setOppLeft(true);
    } else if (r === "guest") {
      if (m.t === "state") { setG(m.state); setPlayers(m.players); setOppLeft(false); setJoinErr(""); setScreen("online"); }
      else if (m.t === "bye") setOppLeft(true);
    }
  };
  onMsgRef.current = onMsg;

  useEffect(() => {
    if (!code || !role) return;
    const ch = callsApi.channel("nardi-" + code);
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

  // bot plays on its turn (offline only) — one single move per tick, so each
  // checker the bot moves gets its own slide animation, re-triggering this
  // effect via the `g` dependency until the bot's turn naturally ends
  useEffect(() => {
    if (online || !g || g.turn !== 1 || g.phase === "over") { setThinking(false); return; }
    setThinking(true);
    const t = setTimeout(() => {
      setG(cur => {
        if (!cur || cur.turn !== 1 || cur.phase === "over") return cur;
        if (cur.phase === "opening") return openingRoll(cur);
        if (cur.phase === "roll") return rollDice(cur);
        if (cur.phase === "move") { const mv = botChooseMove(cur, diff); return mv ? move(cur, mv.from, mv.die) : cur; }
        return cur;
      });
      setThinking(false);
    }, g.phase === "move" ? 550 : 750);
    return () => clearTimeout(t);
  }, [g, diff, online]);

  const startBot = () => { setRole(null); setPlayers(null); setG(newGame()); setPendingFrom(null); setScreen("play"); };
  const resetChat = () => { setChatMsgs([]); setChatOpen(false); setChatUnread(0); setChatInput(""); };
  const createRoom = () => { setJoinErr(""); setPlayers(null); setG(null); setCode(genCode()); setRole("host"); resetChat(); setScreen("online-wait"); };
  const joinRoom = () => { const c = joinCode.trim().toUpperCase(); if (c.length < 3) { setJoinErr("შეიყვანე კოდი"); return; } setJoinErr(""); setPlayers(null); setG(null); setCode(c); setRole("guest"); resetChat(); setScreen("online-wait"); };
  const rematch = () => { const ns = newGame(); setPendingFrom(null); setG(ns); setOppLeft(false); if (online && role === "host") send({ t: "state", state: ns, players }); };
  const leave = () => { if (online) send({ t: "bye", from: ME }); onExit(); };
  const backToMenu = () => { if (online) send({ t: "bye", from: ME }); setRole(null); setCode(""); setPlayers(null); setG(null); setPendingFrom(null); setJoinErr(""); setOppLeft(false); resetChat(); setScreen("menu"); };

  const meIdx = role === "guest" ? 1 : 0;
  const oppIdx = 1 - meIdx;
  const iAmTurn = g && g.turn === meIdx;

  // host is authoritative and always initiates the opening roll (turn is
  // unassigned until it resolves, so there's no "whose turn" to gate a
  // guest-triggered version on — avoids a double-roll race either way)
  const doOpening = () => {
    setPendingFrom(null);
    const ns = openingRoll(g);
    setG(ns);
    if (online) send({ t: "state", state: ns, players });
  };
  const doRoll = () => {
    setPendingFrom(null);
    if (!online) { setG(rollDice(g)); return; }
    if (role === "host") { const ns = rollDice(g); setG(ns); send({ t: "state", state: ns, players }); }
    else send({ t: "move", kind: "roll" });
  };
  const doMove = (from, die) => {
    setPendingFrom(null);
    if (!online) { setG(move(g, from, die)); return; }
    if (role === "host") { const ns = move(g, from, die); if (ns !== g) { setG(ns); send({ t: "state", state: ns, players }); } }
    else send({ t: "move", kind: "move", from, die });
  };

  const sendChat = () => {
    const text = chatInput.trim().slice(0, 300);
    if (!text) return;
    const msg = { t: "chat", from: ME, text, ts: Date.now() };
    setChatMsgs(list => [...list, msg]);
    send(msg);
    setChatInput("");
  };
  useEffect(() => { if (chatOpen && chatListRef.current) chatListRef.current.scrollTop = chatListRef.current.scrollHeight; }, [chatMsgs, chatOpen]);

  // ══════════════ MENU ══════════════
  if (screen === "menu") {
    return (
      <div className="fixed inset-0 z-[95] flex flex-col" style={{ background: C.paper }}>
        <div className="flex items-center gap-3 px-4 py-3"><button onClick={onExit} className="active:scale-90"><ArrowLeft size={22} style={{ color: C.ink }} /></button><span className="font-bold text-[17px]" style={{ color: C.ink, fontFamily: DISPLAY }}>ნარდი</span></div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 -mt-8">
          <div style={{ fontSize: 64 }}>🎲</div>
          <h1 className="text-[30px] font-bold mt-2" style={{ color: C.ink, fontFamily: DISPLAY }}>ნარდი</h1>
          <p className="text-[14px] mt-1 mb-8 text-center" style={{ color: C.muted }}>ბექგამონის სტანდარტული წესები</p>
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
        <div className="flex items-center gap-3 px-4 py-3"><button onClick={() => setScreen("menu")} className="active:scale-90"><ArrowLeft size={22} style={{ color: C.ink }} /></button><span className="font-bold text-[17px]" style={{ color: C.ink, fontFamily: DISPLAY }}>ონლაინ ნარდი</span></div>
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
        <div className="flex items-center gap-3 px-4 py-3"><button onClick={backToMenu} className="active:scale-90"><ArrowLeft size={22} style={{ color: C.ink }} /></button><span className="font-bold text-[17px]" style={{ color: C.ink, fontFamily: DISPLAY }}>ონლაინ ნარდი</span></div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 -mt-8 text-center">
          {role === "host" ? (
            <>
              <div style={{ fontSize: 48 }}>🎲</div>
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
  const oppId = online && players ? players[oppIdx] : null;
  const oppName = online ? (oppId && USERS[oppId] ? USERS[oppId].name : "მოწინააღმდეგე") : "ბოტი";
  const firsts = iAmTurn && g.phase === "move" ? legalFirstMoves(g) : [];
  const fromsSet = new Set(firsts.map(f => f.from));
  const diceForFrom = pendingFrom != null ? [...new Set(firsts.filter(f => f.from === pendingFrom).map(f => f.die))] : [];

  const onPointClick = (idx) => {
    if (!iAmTurn || g.phase !== "move" || !fromsSet.has(idx)) return;
    const dice = [...new Set(firsts.filter(f => f.from === idx).map(f => f.die))];
    if (dice.length === 1) doMove(idx, dice[0]);
    else setPendingFrom(idx);
  };
  const onBarClick = () => {
    if (!iAmTurn || g.phase !== "move" || !fromsSet.has("bar")) return;
    const dice = [...new Set(firsts.filter(f => f.from === "bar").map(f => f.die))];
    if (dice.length === 1) doMove("bar", dice[0]);
    else setPendingFrom("bar");
  };

  const oppWord = online ? oppName : "ბოტმა";
  const waitWord = online ? `${oppName} ფიქრობს…` : (thinking ? "ბოტი ფიქრობს…" : "ბოტის სვლა…");
  const iCanStart = !online || role === "host";
  const statusText = g.phase === "over" ? "" : g.phase === "opening" ? (iCanStart ? "დააჭირე — ვინ დაიწყებს" : waitWord)
    : g.phase === "roll" ? (iAmTurn ? "დააგდე კამათელი" : waitWord)
    : g.phase === "move" ? (iAmTurn ? "აირჩიე ქვა — გადაინაცვლებს ხელმისაწვდომი კამათლით" : waitWord) : "";

  const topIdx = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
  const bottomIdx = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
  const renderRow = (idxs, top) => (
    <div className="flex" style={{ gap: 2 }}>
      {idxs.map((idx, i) => (
        <React.Fragment key={idx}>
          {i === 6 && <div style={{ width: 16 }} />}
          <Point idx={idx} count={g.points[idx]} top={top} selectable={fromsSet.has(idx)} onClick={() => onPointClick(idx)} tint={PT_TINT[idx % 2]} setRef={(el) => { pointRefs.current[idx] = el; }} hitFlash={hitIdx === idx} />
        </React.Fragment>
      ))}
    </div>
  );
  const OffTray = ({ player }) => (
    <div ref={(el) => { offRefs.current[player] = el; }} className="flex items-center justify-center rounded-lg" style={{ width: 26, height: 26, background: "rgba(255,255,255,.08)", border: "1px dashed rgba(255,255,255,.25)" }}>
      <span className="text-[11px] font-bold" style={{ color: "#fff", fontFamily: MONO }}>{g.off[player]}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[95] flex flex-col" style={{ background: "radial-gradient(circle at 50% 15%, #26170d, #0c0705 80%)" }}>
      <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "rgba(0,0,0,.25)" }}>
        <button onClick={leave} className="active:scale-90"><ArrowLeft size={22} color="#fff" /></button>
        <span className="text-[13px] font-bold" style={{ color: "rgba(255,255,255,.7)", fontFamily: MONO }}>{online ? "ონლაინ" : "ნარდი"} · აღებული {g.off[meIdx]}–{g.off[oppIdx]}</span>
        {online ? (
          <button onClick={() => { setChatOpen(true); setChatUnread(0); }} className="relative active:scale-90" style={{ color: "#fff" }}>
            <MessageCircle size={21} />
            {chatUnread > 0 && <span className="absolute flex items-center justify-center rounded-full font-bold" style={{ top: -6, right: -8, minWidth: 16, height: 16, padding: "0 3px", backgroundImage: GBRAND, color: "#fff", fontSize: 10, fontFamily: MONO }}>{chatUnread > 9 ? "9+" : chatUnread}</span>}
          </button>
        ) : <button onClick={rematch} className="active:scale-90" style={{ color: "#fff", fontSize: 20, lineHeight: 1 }}>↻</button>}
      </div>

      <div className="flex items-center gap-2.5 px-4 py-1.5">
        {online && oppId ? <Avatar id={oppId} size={30} /> : <div style={{ width: 30, height: 30, borderRadius: "50%", backgroundImage: GBRAND, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, border: "2px solid rgba(255,255,255,.2)" }}>🤖</div>}
        <div className="flex-1"><div className="text-[13px] font-bold" style={{ color: "#fff" }}>{oppName}</div><div className="text-[10.5px]" style={{ color: "rgba(255,255,255,.55)", fontFamily: MONO }}>pip: {pipCount(g, oppIdx)}</div></div>
        <div ref={(el) => { barRefs.current[oppIdx] = el; }} className="flex items-center gap-1"><Checker player={oppIdx} size={16} /><span className="text-[12px] font-bold" style={{ color: "#fff", fontFamily: MONO }}>{g.bar[oppIdx]}</span></div>
        <span className="text-[11px]" style={{ color: "rgba(255,255,255,.5)" }}>ბარზე</span>
        <OffTray player={oppIdx} />
      </div>

      <div ref={boardRef} className="relative mx-3 px-2.5 py-2.5" style={{ background: "linear-gradient(160deg,#3a2313,#1e1109)", borderRadius: 12, border: "6px solid #241407", boxShadow: "0 10px 26px -6px rgba(0,0,0,.6), inset 0 0 0 1px rgba(0,0,0,.4)" }}>
        {renderRow(topIdx, true)}
        <button onClick={onBarClick} className="w-full flex items-center justify-center active:opacity-80" style={{ height: 38, background: fromsSet.has("bar") ? "rgba(255,196,92,.22)" : "rgba(0,0,0,.35)", border: fromsSet.has("bar") ? "2px solid #ffc45c" : "2px solid rgba(255,255,255,.06)", borderRadius: 6, margin: "4px 0", gap: 10 }} disabled={!fromsSet.has("bar")}>
          {g.dice.length > 0 && (
            <div className="flex gap-2">
              {diceRolling
                ? displayDice.map((d, i) => <Die key={"r" + i} value={d} rolling />)
                : g.diceLeft.length > 0
                  ? g.diceLeft.map((d, i) => <Die key={"l" + i} value={d} />)
                  : g.dice.map((d, i) => <Die key={"d" + i} value={d} dim />)}
            </div>
          )}
          {g.bar[0] > 0 && <span className="text-[11px] font-bold" style={{ color: "#fff", fontFamily: MONO }}>⚪{g.bar[0]}</span>}
          {g.bar[1] > 0 && <span className="text-[11px] font-bold" style={{ color: "#fff", fontFamily: MONO }}>⚫{g.bar[1]}</span>}
        </button>
        {renderRow(bottomIdx, false)}

        {flying && (
          <div style={{ position: "absolute", left: 0, top: 0, width: 19, height: 19, marginLeft: -9.5, marginTop: -9.5, borderRadius: "50%", background: CHECKER_BG[flying.player], border: `1.5px solid ${CHECKER_RING[flying.player]}`, boxShadow: "0 5px 10px rgba(0,0,0,.55)", transform: `translate(${flying.x}px, ${flying.y}px) scale(${flying.moving ? 1.25 : 1})`, transition: flying.moving ? "transform 300ms cubic-bezier(.25,.7,.3,1)" : "none", zIndex: 30, pointerEvents: "none" }} />
        )}
      </div>

      {pendingFrom != null && (
        <div className="flex items-center justify-center gap-2 px-4 pt-2">
          <span className="text-[12.5px]" style={{ color: "rgba(255,255,255,.7)" }}>რომელი კამათლით?</span>
          {diceForFrom.map(d => <button key={d} onClick={() => doMove(pendingFrom, d)} className="rounded-lg font-bold active:scale-90" style={{ width: 32, height: 32, backgroundImage: GBRAND, color: "#fff", fontFamily: MONO }}>{d}</button>)}
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-1">
        <span className="text-[13px] font-semibold text-center" style={{ color: "rgba(255,255,255,.85)" }}>{statusText}</span>
        {g.phase === "opening" && iCanStart && <button onClick={doOpening} className="mt-2 px-8 py-3 rounded-2xl text-[15px] font-bold text-white active:scale-95" style={{ backgroundImage: GBRAND }}>დაიწყე 🎲</button>}
        {g.phase === "roll" && iAmTurn && <button onClick={doRoll} className="mt-2 px-8 py-3 rounded-2xl text-[15px] font-bold text-white active:scale-95" style={{ backgroundImage: GBRAND }}>ააგდე კამათელი 🎲</button>}
      </div>

      <div className="px-4 pb-1 flex items-center gap-2.5">
        <Avatar id={ME} size={30} />
        <div className="flex-1"><div className="text-[13px] font-bold" style={{ color: "#fff" }}>შენ</div><div className="text-[10.5px]" style={{ color: "rgba(255,255,255,.55)", fontFamily: MONO }}>pip: {pipCount(g, meIdx)}</div></div>
        <div ref={(el) => { barRefs.current[meIdx] = el; }} className="flex items-center gap-1"><Checker player={meIdx} size={16} /><span className="text-[12px] font-bold" style={{ color: "#fff", fontFamily: MONO }}>{g.bar[meIdx]}</span></div>
        <span className="text-[11px]" style={{ color: "rgba(255,255,255,.5)" }}>ბარზე</span>
        <OffTray player={meIdx} />
      </div>

      {/* chat */}
      {online && chatOpen && (
        <div className="absolute inset-0 z-40 flex items-end" style={{ background: "rgba(0,0,0,.45)" }} onClick={() => setChatOpen(false)}>
          <div className="w-full flex flex-col rounded-t-3xl" style={{ background: C.paper, maxHeight: "72%", animation: "up .25s ease both" }} onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto rounded-full mt-2 mb-1" style={{ width: 38, height: 4, background: C.line }} />
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-2">
                {online && oppId ? <Avatar id={oppId} size={26} /> : <div style={{ width: 26, height: 26, borderRadius: "50%", backgroundImage: GBRAND, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>🤖</div>}
                <span className="text-[14.5px] font-bold" style={{ color: C.ink, fontFamily: DISPLAY }}>{oppName}</span>
              </div>
              <button onClick={() => setChatOpen(false)} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 30, height: 30, color: C.ink2, background: C.surfaceMuted }}><X size={16} /></button>
            </div>
            <div ref={chatListRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-1.5" style={{ minHeight: 120 }}>
              {chatMsgs.length === 0 && <div className="text-center py-8 text-[13.5px]" style={{ color: C.faint }}>დაიწყე საუბარი 👋</div>}
              {chatMsgs.map((m, i) => {
                const mine = m.from === ME;
                const bubbleStyle = mine ? { backgroundImage: GBRAND, color: "#fff", borderRadius: "18px 18px 5px 18px" } : { background: C.surfaceMuted, color: C.ink, borderRadius: "18px 18px 18px 5px" };
                return (
                  <div key={i} className={"flex " + (mine ? "justify-end" : "justify-start")}>
                    <div className="max-w-[78%] px-3.5 py-2 text-[14.5px]" style={{ ...bubbleStyle, lineHeight: 1.35, wordBreak: "break-word" }}>{m.text}</div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderTop: `1px solid ${C.line}`, paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}>
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") sendChat(); }} placeholder="შეტყობინება…" maxLength={300} className="flex-1 px-4 py-2.5 rounded-full text-[14.5px] outline-none" style={{ background: C.surfaceMuted, color: C.ink, border: `1px solid ${C.line}` }} />
              <button onClick={sendChat} disabled={!chatInput.trim()} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 40, height: 40, backgroundImage: GBRAND, color: "#fff", opacity: chatInput.trim() ? 1 : 0.4 }}><Send size={18} /></button>
            </div>
          </div>
        </div>
      )}

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
          <div style={{ fontSize: 60 }}>{g.winner === meIdx ? "🏆" : "😔"}</div>
          <h2 className="text-[26px] font-bold mt-1" style={{ color: "#fff", fontFamily: DISPLAY }}>{g.winner === meIdx ? "მოიგე!" : "წააგე"}</h2>
          <p className="text-[14px] mt-1 mb-7" style={{ color: "rgba(255,255,255,.7)", fontFamily: MONO }}>ყველა ქვა აყვანილია</p>
          {(!online || role === "host") && <button onClick={rematch} className="px-8 py-3 rounded-2xl text-[15px] font-bold text-white active:scale-95" style={{ backgroundImage: GBRAND }}>თავიდან</button>}
          {online && role === "guest" && <div className="text-[13px]" style={{ color: "rgba(255,255,255,.6)" }}>ახალი თამაშისთვის ჰოსტი აჭერს „თავიდან"</div>}
          <button onClick={leave} className="px-8 py-2.5 mt-2 text-[14px] font-semibold" style={{ color: "rgba(255,255,255,.6)" }}>გასვლა</button>
        </div>
      )}
    </div>
  );
}
