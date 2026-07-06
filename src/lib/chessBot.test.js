import { describe, it, expect, vi } from "vitest";
import { newGame, allLegalMoves, makeMove } from "./chess";
import { evaluate, botAcceptsDraw, botMove } from "./chessBot";

function emptyBoard() {
  return Array.from({ length: 8 }, () => Array(8).fill(null));
}

function freeRookCaptureState() {
  const board = emptyBoard();
  board[7][0] = "wK"; // a1
  board[0][7] = "bK"; // h8
  board[4][3] = "wQ"; // d4, can capture the undefended rook on d8
  board[0][3] = "bR"; // d8
  return { board, turn: "w", castle: { wK: false, wQ: false, bK: false, bQ: false }, ep: null, captured: { w: [], b: [] }, history: [], status: "playing" };
}

describe("evaluate", () => {
  it("is exactly balanced in the starting position", () => {
    expect(evaluate(newGame())).toBe(0);
  });

  it("favors white after white wins material", () => {
    let g = newGame();
    // 1. e4 d5 2. exd5 — white wins a pawn
    g = makeMove(g, { r: 6, c: 4 }, { r: 4, c: 4 });
    g = makeMove(g, { r: 1, c: 3 }, { r: 3, c: 3 });
    g = makeMove(g, { r: 4, c: 4 }, { r: 3, c: 3 });
    expect(evaluate(g)).toBeGreaterThan(0);
  });
});

describe("botAcceptsDraw", () => {
  it("refuses a draw from the balanced starting position", () => {
    const g = newGame();
    expect(botAcceptsDraw(g, "w")).toBe(false);
    expect(botAcceptsDraw(g, "b")).toBe(false);
  });

  it("accepts a draw once it's down significant material", () => {
    const board = Array.from({ length: 8 }, () => Array(8).fill(null));
    board[7][4] = "wK";
    board[0][4] = "bK";
    board[0][3] = "bQ"; // black has an extra queen vs bare kings
    const state = { board };
    expect(evaluate(state)).toBeLessThan(-280); // bad for white
    expect(botAcceptsDraw(state, "w")).toBe(true); // white, down a queen, accepts
    expect(botAcceptsDraw(state, "b")).toBe(false); // black, up a queen, refuses
  });
});

describe("botMove", () => {
  it("returns a legal move from the starting position", () => {
    const g = newGame();
    const mv = botMove(g, "w", "hard");
    expect(mv).toBeTruthy();
    const legal = allLegalMoves(g, "w");
    expect(legal.some((m) => m.from.r === mv.from.r && m.from.c === mv.from.c && m.to.r === mv.to.r && m.to.c === mv.to.c)).toBe(true);
  });

  it("returns null when the side to move has no legal moves (checkmate)", () => {
    let g = newGame();
    g = makeMove(g, { r: 6, c: 5 }, { r: 5, c: 5 }); // 1. f3
    g = makeMove(g, { r: 1, c: 4 }, { r: 3, c: 4 }); // 1...e5
    g = makeMove(g, { r: 6, c: 6 }, { r: 4, c: 6 }); // 2. g4
    g = makeMove(g, { r: 0, c: 3 }, { r: 4, c: 7 }); // 2...Qh4# — white is checkmated
    expect(botMove(g, "w", "hard")).toBeNull();
  });

  it("defaults to 'normal' difficulty when none is given", () => {
    const g = newGame();
    const mv = botMove(g, "w");
    expect(mv).toBeTruthy();
    expect(allLegalMoves(g, "w").some((m) => m.from.r === mv.from.r && m.from.c === mv.from.c && m.to.r === mv.to.r && m.to.c === mv.to.c)).toBe(true);
  });

  it("finds a free capture at 'normal' and 'hard' difficulty", () => {
    const state = freeRookCaptureState();
    for (const difficulty of ["normal", "hard"]) {
      const mv = botMove(state, "w", difficulty);
      expect(mv.from).toEqual({ r: 4, c: 3 });
      expect(mv.to).toEqual({ r: 0, c: 3 });
    }
  });

  it("at 'easy' difficulty, sometimes plays a uniformly random legal move", () => {
    const spy = vi.spyOn(Math, "random").mockReturnValue(0.1); // < 0.45 triggers the random branch
    try {
      const g = newGame();
      const mv = botMove(g, "w", "easy");
      expect(allLegalMoves(g, "w").some((m) => m.from.r === mv.from.r && m.from.c === mv.from.c && m.to.r === mv.to.r && m.to.c === mv.to.c)).toBe(true);
    } finally {
      spy.mockRestore();
    }
  });

  it("at 'easy' difficulty, still finds a free capture when the random roll misses", () => {
    const spy = vi.spyOn(Math, "random").mockReturnValue(0.9); // >= 0.45, skips the random branch
    try {
      const mv = botMove(freeRookCaptureState(), "w", "easy");
      expect(mv.from).toEqual({ r: 4, c: 3 });
      expect(mv.to).toEqual({ r: 0, c: 3 });
    } finally {
      spy.mockRestore();
    }
  });
});
