import { useState } from "react";
import { C, DISPLAY, MONO, GBRAND, ArrowLeft, X } from "./core";
import { newGame, legalMoves, makeMove, squareName, PIECE_GLYPH } from "../lib/chess";

const PROMO_PIECES = ["Q", "R", "B", "N"];
const PROMO_NAME = { Q: "ვეზირი", R: "ცული", B: "ფილი", N: "ცხენი" };

export function ChessGame({ onExit }) {
  const [g, setG] = useState(() => newGame());
  const [sel, setSel] = useState(null);        // { r, c } of selected piece
  const [legal, setLegal] = useState([]);       // legal moves for the selected piece
  const [flipped, setFlipped] = useState(false);
  const [promo, setPromo] = useState(null);     // { from, to } pending promotion choice

  const side = g.turn;
  const gameOver = g.status === "checkmate" || g.status === "stalemate";

  const select = (r, c) => {
    if (gameOver || promo) return;
    const p = g.board[r][c];
    if (sel && sel.r === r && sel.c === c) { setSel(null); setLegal([]); return; }
    if (p && p[0] === side) { setSel({ r, c }); setLegal(legalMoves(g, r, c)); return; }
    if (sel) {
      const mv = legal.find((m) => m.to.r === r && m.to.c === c);
      if (mv) {
        if (mv.promotion) { setPromo({ from: sel, to: { r, c } }); return; }
        setG(makeMove(g, sel, { r, c }));
        setSel(null); setLegal([]);
        return;
      }
    }
    setSel(null); setLegal([]);
  };

  const choosePromo = (piece) => {
    if (!promo) return;
    setG(makeMove(g, promo.from, promo.to, piece));
    setPromo(null); setSel(null); setLegal([]);
  };

  const resetGame = () => { setG(newGame()); setSel(null); setLegal([]); setPromo(null); };

  const rows = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const cols = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  const statusText = g.status === "checkmate"
    ? (side === "w" ? "მატი! შავი გაიმარჯვა 🏆" : "მატი! თეთრი გაიმარჯვა 🏆")
    : g.status === "stalemate" ? "პატი — ფრე 🤝"
    : g.status === "check" ? (side === "w" ? "თეთრს ეშმაკია — შემოწმებაშია!" : "შავს ეშმაკია — შემოწმებაშია!")
    : (side === "w" ? "თეთრის სვლაა" : "შავის სვლაა");

  return (
    <div className="fixed inset-0 z-[95] flex flex-col" style={{ background: C.paper }}>
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={onExit} className="active:scale-90"><ArrowLeft size={22} style={{ color: C.ink }} /></button>
        <span className="font-bold text-[17px] flex-1" style={{ color: C.ink, fontFamily: DISPLAY }}>ჭადრაკი</span>
        <button onClick={() => setFlipped((f) => !f)} className="px-3 py-1.5 rounded-full text-[12.5px] font-bold active:scale-95" style={{ background: C.surfaceMuted, color: C.ink2 }}>დაფის მოტრიალება</button>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col items-center px-4 pb-8">
        <div className="w-full max-w-[420px] flex items-center justify-between mt-1 mb-3">
          <div className="flex items-center gap-1 text-[18px]" style={{ minHeight: 24 }}>
            {g.captured.b.map((p, i) => <span key={i}>{PIECE_GLYPH[p]}</span>)}
          </div>
        </div>

        <div
          className="w-full max-w-[420px] grid rounded-2xl overflow-hidden"
          style={{ gridTemplateColumns: "repeat(8, 1fr)", aspectRatio: "1", boxShadow: "0 10px 30px -8px rgba(0,0,0,.35)", border: `3px solid ${C.ink}` }}
        >
          {rows.map((r) => cols.map((c) => {
            const dark = (r + c) % 2 === 1;
            const piece = g.board[r][c];
            const isSel = sel && sel.r === r && sel.c === c;
            const mv = legal.find((m) => m.to.r === r && m.to.c === c);
            return (
              <button
                key={r + "-" + c}
                onClick={() => select(r, c)}
                className="relative flex items-center justify-center"
                style={{ background: dark ? "#7a5c3e" : "#eddac3", cursor: "pointer" }}
              >
                {isSel && <div className="absolute inset-0" style={{ background: "rgba(103,80,242,.45)" }} />}
                {mv && <div className="absolute" style={mv.capture
                  ? { inset: 3, borderRadius: 9999, border: "3.5px solid rgba(229,72,77,.75)" }
                  : { width: "32%", height: "32%", borderRadius: 9999, background: "rgba(103,80,242,.55)" }} />}
                {piece && <span style={{ fontSize: "min(7.2vw, 30px)", lineHeight: 1, position: "relative", filter: piece[0] === "b" ? "drop-shadow(0 1px 1px rgba(255,255,255,.5))" : "drop-shadow(0 1px 1px rgba(0,0,0,.35))" }}>{PIECE_GLYPH[piece]}</span>}
              </button>
            );
          }))}
        </div>

        <div className="w-full max-w-[420px] flex items-center justify-between mt-3 mb-1">
          <div className="flex items-center gap-1 text-[18px]" style={{ minHeight: 24 }}>
            {g.captured.w.map((p, i) => <span key={i}>{PIECE_GLYPH[p]}</span>)}
          </div>
        </div>

        <div className="w-full max-w-[420px] mt-2 py-3 rounded-2xl text-center font-bold text-[15px]" style={{
          background: gameOver ? C.accentSoft : C.surface, color: gameOver ? C.accentText : C.ink, border: `1px solid ${C.line}`, fontFamily: DISPLAY,
        }}>
          {statusText}
        </div>

        {g.history.length > 0 && (
          <div className="w-full max-w-[420px] mt-3 flex gap-1.5 flex-wrap">
            {g.history.map((h, i) => (
              <span key={i} className="px-2 py-1 rounded-lg text-[12px] font-bold" style={{ background: C.surfaceMuted, color: C.ink2, fontFamily: MONO }}>
                {i % 2 === 0 ? Math.floor(i / 2) + 1 + "." : ""}{h.san}
              </span>
            ))}
          </div>
        )}

        <button onClick={resetGame} className="w-full max-w-[420px] py-3.5 rounded-2xl text-[15px] font-bold text-white active:scale-[.98] mt-5" style={{ backgroundImage: GBRAND }}>
          ახალი თამაში
        </button>
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
                  <span style={{ fontSize: 30 }}>{PIECE_GLYPH[side + pc]}</span>
                  <span className="text-[11px] font-semibold" style={{ color: C.muted }}>{PROMO_NAME[pc]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
