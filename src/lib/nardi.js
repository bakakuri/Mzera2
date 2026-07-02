// ============================================================================
//  🎲 ნარდი (Backgammon) — game engine (pure, serializable). No React, no network here.
//  Standard Western backgammon rules: 24 points, 15 checkers each, opening
//  roll decides who starts (and uses those numbers for the first move),
//  hitting blots to the bar, forced re-entry, bearing off with the standard
//  "overage" rule, and the official must-use-max-dice rule enforced via
//  full move-sequence search. No doubling cube (kept out for a clean v1).
// ============================================================================

// board: 24 points, index 0..23 == point 1..24. Positive count = player 0's
// checkers, negative = player 1's. Player 0 moves toward index 0 (point 24
// → point 1 → bears off); player 1 moves toward index 23 (point 1 → point
// 24 → bears off). Mirror-image starting position.

const dir = (player) => (player === 0 ? -1 : 1);
const homeRange = (player) => (player === 0 ? [0, 5] : [18, 23]);
const distToOff = (player, idx) => (player === 0 ? idx + 1 : 24 - idx);
const entryIdx = (player, die) => (player === 0 ? 24 - die : die - 1);
const owner = (points, idx) => (points[idx] > 0 ? 0 : points[idx] < 0 ? 1 : null);

export function newGame(opts = {}) {
  const points = new Array(24).fill(0);
  points[23] = 2; points[12] = 5; points[7] = 3; points[5] = 5;   // player 0
  points[0] = -2; points[11] = -5; points[16] = -3; points[18] = -5; // player 1
  return {
    points,
    bar: [0, 0],
    off: [0, 0],
    turn: null,
    dice: [],
    diceLeft: [],
    phase: "opening",   // opening | roll | move | over
    winner: null,
    last: null,
  };
}

function clone(s) {
  return { ...s, points: s.points.slice(), bar: s.bar.slice(), off: s.off.slice(), diceLeft: s.diceLeft.slice(), dice: s.dice.slice() };
}

function canLand(points, player, idx) {
  const v = points[idx];
  if (v === 0) return true;
  const o = v > 0 ? 0 : 1;
  return o === player || Math.abs(v) === 1;
}

function canBearOffNow(state, player) {
  if (state.bar[player] > 0) return false;
  const [lo, hi] = homeRange(player);
  for (let i = 0; i < 24; i++) {
    if (owner(state.points, i) === player && (i < lo || i > hi)) return false;
  }
  return true;
}

function legalSingleMoves(state, player, die) {
  const { points, bar } = state;
  if (bar[player] > 0) {
    const idx = entryIdx(player, die);
    return canLand(points, player, idx) ? [{ from: "bar", die }] : [];
  }
  const moves = [];
  const d = dir(player);
  const canOff = canBearOffNow(state, player);
  for (let i = 0; i < 24; i++) {
    if (owner(points, i) !== player) continue;
    const dest = i + d * die;
    if (dest < 0 || dest > 23) {
      if (!canOff) continue;
      const dist = distToOff(player, i);
      if (die === dist) { moves.push({ from: i, die, bearOff: true }); continue; }
      if (die > dist) {
        const [lo, hi] = homeRange(player);
        let hasFarther = false;
        for (let j = lo; j <= hi; j++) {
          if (owner(points, j) === player && distToOff(player, j) > dist) { hasFarther = true; break; }
        }
        if (!hasFarther) moves.push({ from: i, die, bearOff: true });
      }
      continue;
    }
    if (canLand(points, player, dest)) moves.push({ from: i, die });
  }
  return moves;
}

function landOn(s, player, idx) {
  const v = s.points[idx];
  const o = v > 0 ? 0 : v < 0 ? 1 : null;
  let hit = false;
  if (o !== null && o !== player) { s.bar[o] += 1; s.points[idx] = 0; hit = true; }
  s.points[idx] += player === 0 ? 1 : -1;
  return hit;
}

function applySingle(state, player, mv) {
  const s = clone(state);
  let to = null, hit = false;
  if (mv.from === "bar") {
    s.bar[player] -= 1;
    to = entryIdx(player, mv.die);
    hit = landOn(s, player, to);
  } else if (mv.bearOff) {
    s.points[mv.from] += player === 0 ? -1 : 1;
    s.off[player] += 1;
    to = "off";
  } else {
    s.points[mv.from] += player === 0 ? -1 : 1;
    to = mv.from + dir(player) * mv.die;
    hit = landOn(s, player, to);
  }
  s.last = { from: mv.from, to, die: mv.die, bearOff: !!mv.bearOff, hit, by: player };
  return s;
}

// all maximal-length legal move sequences for the remaining dice (official
// backgammon rule: you must play as many dice as legally possible)
function enumerateSequences(state, player, diceLeft) {
  if (!diceLeft.length) return [[]];
  const tried = new Set();
  const results = [];
  for (let k = 0; k < diceLeft.length; k++) {
    const die = diceLeft[k];
    if (tried.has(die)) continue;
    tried.add(die);
    for (const mv of legalSingleMoves(state, player, die)) {
      const ns = applySingle(state, player, mv);
      const rest = diceLeft.slice(); rest.splice(k, 1);
      for (const sub of enumerateSequences(ns, player, rest)) results.push([mv, ...sub]);
    }
  }
  return results.length ? results : [[]];
}

function maxLenOf(seqs) { return seqs.reduce((m, q) => Math.max(m, q.length), 0); }

export function pipCount(state, player) {
  let sum = state.bar[player] * 25;
  for (let i = 0; i < 24; i++) if (owner(state.points, i) === player) sum += Math.abs(state.points[i]) * distToOff(player, i);
  return sum;
}

// (from, die) pairs the current player may legally play right now, restricted
// to those that keep a max-dice-usage completion reachable
export function legalFirstMoves(state) {
  if (state.phase !== "move") return [];
  const seqs = enumerateSequences(state, state.turn, state.diceLeft);
  const maxLen = maxLenOf(seqs);
  if (maxLen === 0) return [];
  const seen = new Set(), out = [];
  for (const q of seqs) {
    if (q.length !== maxLen) continue;
    const key = q[0].from + ":" + q[0].die;
    if (seen.has(key)) continue;
    seen.add(key); out.push(q[0]);
  }
  return out;
}

function finalizeIfDone(s, player) {
  if (s.off[player] === 15) { s.winner = player; s.phase = "over"; return s; }
  const nextMax = maxLenOf(enumerateSequences(s, player, s.diceLeft));
  if (s.diceLeft.length === 0 || nextMax === 0) { s.diceLeft = []; s.turn = 1 - player; s.phase = "roll"; }
  return s;
}

export function openingRoll(state, rnd) {
  if (state.phase !== "opening") return state;
  const r = rnd || Math.random;
  let d0, d1;
  do { d0 = 1 + Math.floor(r() * 6); d1 = 1 + Math.floor(r() * 6); } while (d0 === d1);
  const s = clone(state);
  s.turn = d0 > d1 ? 0 : 1;
  s.dice = [d0, d1];
  s.diceLeft = [d0, d1];
  s.phase = "move";
  s.last = { type: "opening", dice: [d0, d1], by: s.turn };
  return finalizeIfDone(s, s.turn);
}

export function rollDice(state, rnd) {
  if (state.phase !== "roll") return state;
  const s = clone(state);
  const r = rnd || Math.random;
  const d1 = 1 + Math.floor(r() * 6), d2 = 1 + Math.floor(r() * 6);
  s.dice = [d1, d2];
  s.diceLeft = d1 === d2 ? [d1, d1, d1, d1] : [d1, d2];
  s.phase = "move";
  s.last = { type: "roll", dice: [d1, d2], by: s.turn };
  return finalizeIfDone(s, s.turn);
}

export function move(state, from, die) {
  if (state.phase !== "move") return state;
  const player = state.turn;
  const allowed = legalFirstMoves(state);
  const chosen = allowed.find((m) => m.from === from && m.die === die);
  if (!chosen) return state;
  let s = applySingle(state, player, chosen);
  const idx = s.diceLeft.indexOf(die);
  s.diceLeft = s.diceLeft.slice(); s.diceLeft.splice(idx, 1);
  return finalizeIfDone(s, player);
}

// ============================================================================
//  🤖 BOT.  diff: "easy" | "normal" | "hard"
// ============================================================================

function evalState(state, player) {
  const opp = 1 - player;
  let score = pipCount(state, opp) - pipCount(state, player);
  score += state.off[player] * 8 - state.off[opp] * 4;
  score += state.bar[opp] * 12 - state.bar[player] * 15;
  for (let i = 0; i < 24; i++) {
    const v = state.points[i];
    if (v === 0) continue;
    const o = v > 0 ? 0 : 1;
    if (o !== player) continue;
    score += Math.abs(v) >= 2 ? 3 : -5;
  }
  return score;
}

function bestSequence(state, player, diff, rnd) {
  const seqs = enumerateSequences(state, player, state.diceLeft);
  const maxLen = maxLenOf(seqs);
  if (maxLen === 0) return [];
  const candidates = seqs.filter((q) => q.length === maxLen);
  const noise = diff === "easy" ? 20 : diff === "hard" ? 0 : 6;
  const r = rnd || Math.random;
  let best = candidates[0], bestScore = -Infinity;
  for (const seq of candidates) {
    let s = state;
    for (const mv of seq) s = applySingle(s, player, mv);
    const sc = evalState(s, player) + (r() - 0.5) * noise;
    if (sc > bestScore) { bestScore = sc; best = seq; }
  }
  return best;
}

// applies the bot's whole turn in one shot
export function botPlayTurn(state, diff = "normal", rnd) {
  if (state.phase === "opening") return openingRoll(state, rnd);
  if (state.phase === "roll") return rollDice(state, rnd);
  if (state.phase !== "move") return state;
  const player = state.turn;
  const best = bestSequence(state, player, diff, rnd);
  if (!best.length) { const s = clone(state); s.diceLeft = []; s.turn = 1 - player; s.phase = "roll"; return s; }
  let s = state;
  for (const mv of best) s = applySingle(s, player, mv);
  return finalizeIfDone(s, player);
}

// single-step variant for animated UIs: just the next move the bot would
// make in its chosen best sequence, to be applied via move() one at a time
export function botChooseMove(state, diff = "normal", rnd) {
  if (state.phase !== "move") return null;
  const best = bestSequence(state, state.turn, diff, rnd);
  return best.length ? { from: best[0].from, die: best[0].die } : null;
}
