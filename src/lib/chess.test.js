import { describe, it, expect } from "vitest";
import { newGame, squareName, allLegalMoves, legalMoves, makeMove, inCheck } from "./chess";

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
