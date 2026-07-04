// ============================================================================
//  ♟ ჭადრაკის ბოტი — მარტივი negamax + alpha-beta ძებნა მასალა+პოზიციის
//  შეფასებით. სუსტი, სწრაფი, "ცოცხალი" საშინაო ოპონენტისთვის — არა Stockfish.
// ============================================================================

import { allLegalMoves, makeMove } from "./chess";

const VALUE = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 0 };

const PAWN_PST = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5, 5, 10, 25, 25, 10, 5, 5],
  [0, 0, 0, 20, 20, 0, 0, 0],
  [5, -5, -10, 0, 0, -10, -5, 5],
  [5, 10, 10, -20, -20, 10, 10, 5],
  [0, 0, 0, 0, 0, 0, 0, 0],
];
const KNIGHT_PST = [
  [-50, -40, -30, -30, -30, -30, -40, -50],
  [-40, -20, 0, 0, 0, 0, -20, -40],
  [-30, 0, 10, 15, 15, 10, 0, -30],
  [-30, 5, 15, 20, 20, 15, 5, -30],
  [-30, 0, 15, 20, 20, 15, 0, -30],
  [-30, 5, 10, 15, 15, 10, 5, -30],
  [-40, -20, 0, 5, 5, 0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50],
];
const PST = { P: PAWN_PST, N: KNIGHT_PST };

function pstValue(piece, r, c) {
  const table = PST[piece[1]];
  if (!table) return 0;
  const rr = piece[0] === "w" ? r : 7 - r;
  return table[rr][c];
}

export function evaluate(state) {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = state.board[r][c];
      if (!p) continue;
      const val = VALUE[p[1]] + pstValue(p, r, c);
      score += p[0] === "w" ? val : -val;
    }
  }
  return score; // + = good for white
}

function orderedMoves(state, side) {
  const moves = allLegalMoves(state, side);
  moves.sort((a, b) => (b.capture ? 1 : 0) - (a.capture ? 1 : 0));
  return moves;
}

const enemy = (s) => (s === "w" ? "b" : "w");

function negamax(state, depth, alpha, beta, side) {
  if (state.status === "checkmate") return -100000 - depth;
  if (state.status === "stalemate") return 0;
  if (depth === 0) return (side === "w" ? 1 : -1) * evaluate(state);

  const moves = orderedMoves(state, side);
  if (!moves.length) return 0;
  let best = -Infinity;
  for (const m of moves) {
    const ns = makeMove(state, m.from, m.to, m.promotion ? "Q" : undefined);
    const score = -negamax(ns, depth - 1, -beta, -alpha, enemy(side));
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

// bot accepts a draw offer only when it's clearly losing (down a piece or more).
export function botAcceptsDraw(state, side) {
  const score = (side === "w" ? 1 : -1) * evaluate(state);
  return score < -280;
}

const DEPTH = { easy: 1, normal: 2, hard: 3 };

// picks a move for `side` to play in `state`. difficulty: "easy" | "normal" | "hard".
export function botMove(state, side, difficulty = "normal") {
  const moves = orderedMoves(state, side);
  if (!moves.length) return null;
  if (difficulty === "easy" && Math.random() < 0.45) return moves[Math.floor(Math.random() * moves.length)];

  const depth = DEPTH[difficulty] || 2;
  let bestMove = moves[0], bestScore = -Infinity, alpha = -Infinity;
  const beta = Infinity;
  for (const m of moves) {
    const ns = makeMove(state, m.from, m.to, m.promotion ? "Q" : undefined);
    const score = -negamax(ns, depth - 1, -beta, -alpha, enemy(side));
    if (score > bestScore) { bestScore = score; bestMove = m; }
    if (bestScore > alpha) alpha = bestScore;
  }
  return bestMove;
}
