// ============================================================================
//  ♟ ჭადრაკი — game engine (pure, serializable). No React, no network here.
//  სრული წესები: ყველა ფიგურის სვლა, როკირება, გზადავლით აღება (en passant),
//  ქვეითის დაწინაურება, შემოწმება/მატი/პატი-ს დადგენა.
// ============================================================================

export const FILES = "abcdefgh";

export const squareName = (r, c) => FILES[c] + (8 - r);

const B_DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const R_DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const Q_DIRS = [...B_DIRS, ...R_DIRS];
const KNIGHT_OFFS = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const KING_OFFS = Q_DIRS;

const inBounds = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
const cloneBoard = (b) => b.map((row) => row.slice());
const pieceColor = (p) => (p ? p[0] : null);
const pieceType = (p) => (p ? p[1] : null);
const enemy = (side) => (side === "w" ? "b" : "w");

export function newGame() {
  const back = ["R", "N", "B", "Q", "K", "B", "N", "R"];
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let c = 0; c < 8; c++) {
    board[0][c] = "b" + back[c];
    board[1][c] = "bP";
    board[6][c] = "wP";
    board[7][c] = "w" + back[c];
  }
  return {
    board,
    turn: "w",
    castle: { wK: true, wQ: true, bK: true, bQ: true },
    ep: null,
    captured: { w: [], b: [] },
    history: [],
    status: "playing", // playing | check | checkmate | stalemate
  };
}

function findKing(board, side) {
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (board[r][c] === side + "K") return { r, c };
  return null;
}

// raw attack pattern: is (r,c) attacked by `bySide`? (ignores turn / pins — used for check + castling checks)
export function isAttacked(board, r, c, bySide) {
  const dir = bySide === "w" ? 1 : -1; // an attacking pawn sits one rank "below" (from its own advance direction)
  for (const dc of [-1, 1]) {
    const rr = r + dir, cc = c + dc;
    if (inBounds(rr, cc) && board[rr][cc] === bySide + "P") return true;
  }
  for (const [dr, dc] of KNIGHT_OFFS) {
    const rr = r + dr, cc = c + dc;
    if (inBounds(rr, cc) && board[rr][cc] === bySide + "N") return true;
  }
  for (const [dr, dc] of KING_OFFS) {
    const rr = r + dr, cc = c + dc;
    if (inBounds(rr, cc) && board[rr][cc] === bySide + "K") return true;
  }
  for (const [dr, dc] of B_DIRS) {
    let rr = r + dr, cc = c + dc;
    while (inBounds(rr, cc)) {
      const p = board[rr][cc];
      if (p) { if (pieceColor(p) === bySide && (pieceType(p) === "B" || pieceType(p) === "Q")) return true; break; }
      rr += dr; cc += dc;
    }
  }
  for (const [dr, dc] of R_DIRS) {
    let rr = r + dr, cc = c + dc;
    while (inBounds(rr, cc)) {
      const p = board[rr][cc];
      if (p) { if (pieceColor(p) === bySide && (pieceType(p) === "R" || pieceType(p) === "Q")) return true; break; }
      rr += dr; cc += dc;
    }
  }
  return false;
}

export function inCheck(state, side) {
  const k = findKing(state.board, side);
  if (!k) return false;
  return isAttacked(state.board, k.r, k.c, enemy(side));
}

// pseudo-legal moves for the piece at (r,c) — ignores whether it leaves own king in check.
function pseudoMoves(state, r, c) {
  const { board } = state;
  const p = board[r][c];
  if (!p) return [];
  const side = pieceColor(p), type = pieceType(p);
  const moves = [];
  const addSlide = (dirs) => {
    for (const [dr, dc] of dirs) {
      let rr = r + dr, cc = c + dc;
      while (inBounds(rr, cc)) {
        const target = board[rr][cc];
        if (!target) moves.push({ to: { r: rr, c: cc }, capture: false });
        else { if (pieceColor(target) !== side) moves.push({ to: { r: rr, c: cc }, capture: true }); break; }
        rr += dr; cc += dc;
      }
    }
  };
  if (type === "P") {
    const dir = side === "w" ? -1 : 1;
    const startRank = side === "w" ? 6 : 1;
    const promoRank = side === "w" ? 0 : 7;
    if (inBounds(r + dir, c) && !board[r + dir][c]) {
      moves.push({ to: { r: r + dir, c }, capture: false, promotion: r + dir === promoRank });
      if (r === startRank && !board[r + 2 * dir][c]) moves.push({ to: { r: r + 2 * dir, c }, capture: false, doubleStep: true });
    }
    for (const dc of [-1, 1]) {
      const rr = r + dir, cc = c + dc;
      if (!inBounds(rr, cc)) continue;
      const target = board[rr][cc];
      if (target && pieceColor(target) !== side) moves.push({ to: { r: rr, c: cc }, capture: true, promotion: rr === promoRank });
      else if (!target && state.ep && state.ep.r === rr && state.ep.c === cc) moves.push({ to: { r: rr, c: cc }, capture: true, enPassant: true });
    }
  } else if (type === "N") {
    for (const [dr, dc] of KNIGHT_OFFS) {
      const rr = r + dr, cc = c + dc;
      if (!inBounds(rr, cc)) continue;
      const target = board[rr][cc];
      if (!target || pieceColor(target) !== side) moves.push({ to: { r: rr, c: cc }, capture: !!target });
    }
  } else if (type === "B") addSlide(B_DIRS);
  else if (type === "R") addSlide(R_DIRS);
  else if (type === "Q") addSlide(Q_DIRS);
  else if (type === "K") {
    for (const [dr, dc] of KING_OFFS) {
      const rr = r + dr, cc = c + dc;
      if (!inBounds(rr, cc)) continue;
      const target = board[rr][cc];
      if (!target || pieceColor(target) !== side) moves.push({ to: { r: rr, c: cc }, capture: !!target });
    }
    const rank = side === "w" ? 7 : 0;
    if (r === rank && c === 4 && !inCheck(state, side)) {
      const foe = enemy(side);
      if (state.castle[side + "K"] && !board[rank][5] && !board[rank][6] && board[rank][7] === side + "R"
        && !isAttacked(board, rank, 5, foe) && !isAttacked(board, rank, 6, foe)) {
        moves.push({ to: { r: rank, c: 6 }, capture: false, castle: "K" });
      }
      if (state.castle[side + "Q"] && !board[rank][3] && !board[rank][2] && !board[rank][1] && board[rank][0] === side + "R"
        && !isAttacked(board, rank, 3, foe) && !isAttacked(board, rank, 2, foe)) {
        moves.push({ to: { r: rank, c: 2 }, capture: false, castle: "Q" });
      }
    }
  }
  return moves;
}

function applyMoveToBoard(board, from, to, mv) {
  const b = cloneBoard(board);
  const piece = b[from.r][from.c];
  const side = pieceColor(piece);
  if (mv && mv.enPassant) b[from.r][to.c] = null;
  b[to.r][to.c] = piece;
  b[from.r][from.c] = null;
  if (mv && mv.promotion) b[to.r][to.c] = side + "Q";
  if (mv && mv.castle) {
    const rank = from.r;
    if (mv.castle === "K") { b[rank][5] = b[rank][7]; b[rank][7] = null; }
    else { b[rank][3] = b[rank][0]; b[rank][0] = null; }
  }
  return b;
}

// legal moves for the piece at (r,c): pseudo-legal, filtered to ones that don't leave own king in check.
export function legalMoves(state, r, c) {
  const p = state.board[r][c];
  if (!p) return [];
  const side = pieceColor(p);
  return pseudoMoves(state, r, c).filter((m) => {
    const nb = applyMoveToBoard(state.board, { r, c }, m.to, m);
    const k = findKing(nb, side);
    if (!k) return false;
    return !isAttacked(nb, k.r, k.c, enemy(side));
  });
}

export function allLegalMoves(state, side) {
  const out = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = state.board[r][c];
    if (p && pieceColor(p) === side) legalMoves(state, r, c).forEach((m) => out.push({ from: { r, c }, ...m }));
  }
  return out;
}

function sanFor(piece, from, to, mv, capturedPiece, promoteTo) {
  if (mv.castle === "K") return "O-O";
  if (mv.castle === "Q") return "O-O-O";
  const type = pieceType(piece);
  const capture = mv.capture ? "x" : "";
  let s;
  if (type === "P") s = (mv.capture ? FILES[from.c] + "x" : "") + squareName(to.r, to.c);
  else s = type + capture + squareName(to.r, to.c);
  if (mv.promotion) s += "=" + (promoteTo || "Q");
  return s;
}

// applies a move (must already be legal — from legalMoves(state, from.r, from.c)).
// promoteTo: "Q"|"R"|"B"|"N", defaults to "Q". Returns a NEW state; returns the same
// state unchanged if the move isn't legal.
export function makeMove(state, from, to, promoteTo) {
  const piece = state.board[from.r][from.c];
  if (!piece) return state;
  const side = pieceColor(piece), type = pieceType(piece);
  const mv = legalMoves(state, from.r, from.c).find((m) => m.to.r === to.r && m.to.c === to.c);
  if (!mv) return state;

  const nb = cloneBoard(state.board);
  let capturedPiece = nb[to.r][to.c];
  if (mv.enPassant) { capturedPiece = nb[from.r][to.c]; nb[from.r][to.c] = null; }
  nb[to.r][to.c] = piece;
  nb[from.r][from.c] = null;
  if (mv.promotion) nb[to.r][to.c] = side + (promoteTo || "Q");
  if (mv.castle) {
    const rank = from.r;
    if (mv.castle === "K") { nb[rank][5] = nb[rank][7]; nb[rank][7] = null; }
    else { nb[rank][3] = nb[rank][0]; nb[rank][0] = null; }
  }

  const castle = { ...state.castle };
  if (type === "K") { castle[side + "K"] = false; castle[side + "Q"] = false; }
  if (type === "R") {
    const homeRank = side === "w" ? 7 : 0;
    if (from.r === homeRank && from.c === 0) castle[side + "Q"] = false;
    if (from.r === homeRank && from.c === 7) castle[side + "K"] = false;
  }
  if (capturedPiece && pieceType(capturedPiece) === "R") {
    const foe = enemy(side);
    const foeHome = foe === "w" ? 7 : 0;
    if (to.r === foeHome && to.c === 0) castle[foe + "Q"] = false;
    if (to.r === foeHome && to.c === 7) castle[foe + "K"] = false;
  }

  const ep = type === "P" && mv.doubleStep ? { r: (from.r + to.r) / 2, c: from.c } : null;
  const captured = { w: state.captured.w.slice(), b: state.captured.b.slice() };
  if (capturedPiece) captured[side].push(capturedPiece);

  const nextTurn = enemy(side);
  const next = {
    board: nb,
    turn: nextTurn,
    castle,
    ep,
    captured,
    history: [...state.history, {
      from, to, piece, captured: capturedPiece || null,
      promotion: mv.promotion ? (promoteTo || "Q") : null,
      castle: mv.castle || null,
      san: sanFor(piece, from, to, mv, capturedPiece, promoteTo),
    }],
    status: "playing",
  };
  const oppCheck = inCheck(next, nextTurn);
  const oppHasMoves = allLegalMoves(next, nextTurn).length > 0;
  next.status = oppHasMoves ? (oppCheck ? "check" : "playing") : (oppCheck ? "checkmate" : "stalemate");
  return next;
}

export const PIECE_GLYPH = {
  wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
  bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟",
};
