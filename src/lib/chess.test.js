import { describe, it, expect } from "vitest";
import { newGame, squareName, allLegalMoves, legalMoves, makeMove, inCheck } from "./chess";

function emptyBoard() {
  return Array.from({ length: 8 }, () => Array(8).fill(null));
}

function customState(board, overrides = {}) {
  return { board, turn: "w", castle: { wK: false, wQ: false, bK: false, bQ: false }, ep: null, captured: { w: [], b: [] }, history: [], status: "playing", ...overrides };
}

describe("squareName", () => {
  it("maps board coordinates to algebraic notation", () => {
    expect(squareName(0, 0)).toBe("a8");
    expect(squareName(7, 0)).toBe("a1");
    expect(squareName(6, 4)).toBe("e2");
    expect(squareName(4, 7)).toBe("h4");
  });
});

describe("newGame", () => {
  it("sets up the standard starting position", () => {
    const g = newGame();
    expect(g.turn).toBe("w");
    expect(g.status).toBe("playing");
    expect(g.castle).toEqual({ wK: true, wQ: true, bK: true, bQ: true });
    expect(g.board[6][4]).toBe("wP"); // e2
    expect(g.board[1][4]).toBe("bP"); // e7
    expect(g.board[7][4]).toBe("wK"); // e1
    expect(g.board[0][4]).toBe("bK"); // e8
    expect(g.board[7][0]).toBe("wR");
    expect(g.board[0][3]).toBe("bQ");
  });

  it("has exactly 20 legal moves for white in the opening position", () => {
    const g = newGame();
    // 8 pawns × 2 (single/double step) + 2 knights × 2 destinations = 20
    expect(allLegalMoves(g, "w")).toHaveLength(20);
  });
});

describe("legalMoves", () => {
  it("lets the e2 pawn advance one or two squares", () => {
    const g = newGame();
    const moves = legalMoves(g, 6, 4).map((m) => squareName(m.to.r, m.to.c));
    expect(moves.sort()).toEqual(["e3", "e4"]);
  });

  it("returns nothing for an empty square", () => {
    const g = newGame();
    expect(legalMoves(g, 4, 4)).toEqual([]);
  });
});

describe("makeMove", () => {
  it("moves the piece, flips the turn, and sets the en-passant square on a double step", () => {
    const g = newGame();
    const next = makeMove(g, { r: 6, c: 4 }, { r: 4, c: 4 }); // e2-e4
    expect(next.board[6][4]).toBeNull();
    expect(next.board[4][4]).toBe("wP");
    expect(next.turn).toBe("b");
    expect(next.ep).toEqual({ r: 5, c: 4 }); // e3
    expect(next.status).toBe("playing");
  });

  it("does not mutate the original state (returns a new one)", () => {
    const g = newGame();
    makeMove(g, { r: 6, c: 4 }, { r: 4, c: 4 });
    expect(g.turn).toBe("w");
    expect(g.board[6][4]).toBe("wP");
  });

  it("is a no-op for an illegal move", () => {
    const g = newGame();
    const next = makeMove(g, { r: 6, c: 4 }, { r: 3, c: 4 }); // e2-e5, three squares — illegal
    expect(next).toBe(g);
  });

  it("detects fool's mate (fastest possible checkmate)", () => {
    let g = newGame();
    g = makeMove(g, { r: 6, c: 5 }, { r: 5, c: 5 }); // 1. f3
    g = makeMove(g, { r: 1, c: 4 }, { r: 3, c: 4 }); // 1...e5
    g = makeMove(g, { r: 6, c: 6 }, { r: 4, c: 6 }); // 2. g4
    g = makeMove(g, { r: 0, c: 3 }, { r: 4, c: 7 }); // 2...Qh4#
    expect(inCheck(g, "w")).toBe(true);
    expect(g.status).toBe("checkmate");
    expect(allLegalMoves(g, "w")).toHaveLength(0);
  });
});

describe("castling", () => {
  it("castles kingside when the path is clear and safe", () => {
    const board = emptyBoard();
    board[7][4] = "wK"; board[7][7] = "wR"; board[0][4] = "bK";
    const state = customState(board, { castle: { wK: true, wQ: true, bK: true, bQ: true } });
    const next = makeMove(state, { r: 7, c: 4 }, { r: 7, c: 6 });
    expect(next.board[7][6]).toBe("wK");
    expect(next.board[7][5]).toBe("wR");
    expect(next.board[7][7]).toBeNull();
    expect(next.castle.wK).toBe(false);
    expect(next.castle.wQ).toBe(false);
  });

  it("castles queenside when the path is clear and safe", () => {
    const board = emptyBoard();
    board[7][4] = "wK"; board[7][0] = "wR"; board[0][4] = "bK";
    const state = customState(board, { castle: { wK: true, wQ: true, bK: true, bQ: true } });
    const next = makeMove(state, { r: 7, c: 4 }, { r: 7, c: 2 });
    expect(next.board[7][2]).toBe("wK");
    expect(next.board[7][3]).toBe("wR");
    expect(next.board[7][0]).toBeNull();
  });

  it("disallows castling through a square the opponent attacks", () => {
    const board = emptyBoard();
    board[7][4] = "wK"; board[7][7] = "wR"; board[0][4] = "bK"; board[0][6] = "bR"; // rook eyes the g-file, through g1
    const state = customState(board, { castle: { wK: true, wQ: true, bK: true, bQ: true } });
    const moves = legalMoves(state, 7, 4);
    expect(moves.some((m) => m.castle)).toBe(false);
  });

  it("disallows castling while currently in check", () => {
    const board = emptyBoard();
    board[7][4] = "wK"; board[7][7] = "wR"; board[1][4] = "bR"; board[0][0] = "bK"; // rook checks along the e-file
    const state = customState(board, { castle: { wK: true, wQ: true, bK: true, bQ: true } });
    expect(inCheck(state, "w")).toBe(true);
    const moves = legalMoves(state, 7, 4);
    expect(moves.some((m) => m.castle)).toBe(false);
  });
});

describe("pawn promotion", () => {
  it("promotes to a queen by default", () => {
    const board = emptyBoard();
    board[7][4] = "wK"; board[0][0] = "bK"; board[1][4] = "wP"; // pawn one step from queening
    const state = customState(board);
    const next = makeMove(state, { r: 1, c: 4 }, { r: 0, c: 4 });
    expect(next.board[0][4]).toBe("wQ");
  });

  it("promotes to the requested piece when given", () => {
    const board = emptyBoard();
    board[7][4] = "wK"; board[0][0] = "bK"; board[1][4] = "wP";
    const state = customState(board);
    const next = makeMove(state, { r: 1, c: 4 }, { r: 0, c: 4 }, "N");
    expect(next.board[0][4]).toBe("wN");
  });
});

describe("en passant", () => {
  it("actually captures the passed pawn, not just sets up the square", () => {
    const board = emptyBoard();
    board[7][4] = "wK"; board[0][4] = "bK";
    board[4][3] = "wP"; // d4
    board[4][4] = "bP"; // e4, sitting beside it
    const state = customState(board, { turn: "b", ep: { r: 5, c: 3 } }); // white just played d2-d4
    const next = makeMove(state, { r: 4, c: 4 }, { r: 5, c: 3 }); // black captures en passant, exd3
    expect(next.board[5][3]).toBe("bP");
    expect(next.board[4][3]).toBeNull(); // the captured white pawn is gone
    expect(next.board[4][4]).toBeNull();
  });
});

describe("stalemate", () => {
  it("recognizes a stalemate position (no legal moves, not in check)", () => {
    const board = emptyBoard();
    board[2][4] = "wK"; // e6
    board[1][4] = "wP"; // e7
    board[0][4] = "bK"; // e8 — boxed in by the pawn's diagonal control and the king, but not in check
    const state = customState(board, { turn: "b" });
    expect(inCheck(state, "b")).toBe(false);
    expect(allLegalMoves(state, "b")).toHaveLength(0);
  });

  it("makeMove sets status to 'stalemate' when a move produces that position", () => {
    const board = emptyBoard();
    board[2][3] = "wK"; // d6
    board[1][4] = "wP"; // e7
    board[0][4] = "bK"; // e8
    const state = customState(board);
    const next = makeMove(state, { r: 2, c: 3 }, { r: 2, c: 4 }); // Kd6-e6
    expect(next.status).toBe("stalemate");
  });
});

describe("absolute pins", () => {
  it("filters out moves that would expose the mover's own king to check", () => {
    const board = emptyBoard();
    board[7][4] = "wK"; // e1
    board[6][4] = "wR"; // e2, pinned to the king along the e-file
    board[0][4] = "bR"; // e8, the pinning rook
    board[0][0] = "bK"; // a8
    const state = customState(board);
    const moves = legalMoves(state, 6, 4);
    expect(moves.length).toBeGreaterThan(0); // can still move along the file
    expect(moves.every((m) => m.to.c === 4)).toBe(true); // but never off it
  });
});
