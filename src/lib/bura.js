// ============================================================================
//  🃏 ბურა — game engine (pure, serializable). No React, no network here.
//  36 cards · deal 5 · throw 1–5 (same suit or all trump) · cover all or take ·
//  refill to 5 after each trick · first to 61 captured points wins the deal.
// ============================================================================

export const RANKS = ["6", "7", "8", "9", "10", "J", "Q", "K", "A"];
export const SUITS = ["S", "H", "D", "C"];
export const SUIT_SYM = { S: "♠", H: "♥", D: "♦", C: "♣" };
export const SUIT_RED = { H: true, D: true, S: false, C: false };
export const RANK_KA = { J: "ვ", Q: "ქ", K: "კ", A: "ა" }; // short georgian faces (optional)

const PTS = { "6": 0, "7": 0, "8": 0, "9": 0, "10": 10, "J": 2, "Q": 3, "K": 4, "A": 11 };
// strength for beating within a suit:  A > 10 > K > Q > J > 9 > 8 > 7 > 6
const STR = { "6": 0, "7": 1, "8": 2, "9": 3, "J": 4, "Q": 5, "K": 6, "10": 7, "A": 8 };

export const cardId = (c) => c.r + c.s;
export const cardPts = (c) => PTS[c.r];
export const handPts = (cards) => cards.reduce((s, c) => s + PTS[c.r], 0);

// does `d` beat `a` given trump suit
export function beats(d, a, trump) {
  if (a.s === trump) return d.s === trump && STR[d.r] > STR[a.r];
  if (d.s === trump) return true;
  return d.s === a.s && STR[d.r] > STR[a.r];
}

function fullDeck() {
  const deck = [];
  for (const s of SUITS) for (const r of RANKS) deck.push({ r, s });
  return deck;
}

function shuffle(arr, rnd) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor((rnd ? rnd() : Math.random()) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// New 1v1 deal. `starter` = which player leads first (default 0).
export function newGame(opts = {}) {
  const rnd = opts.rnd;
  const deck = shuffle(fullDeck(), rnd);
  const hands = [deck.slice(0, 5), deck.slice(5, 10)];
  const rest = deck.slice(10);          // 26 cards
  const trumpCard = rest[0];            // shown, drawn last
  const talon = rest.slice(1).concat([trumpCard]); // 25 + trump at bottom
  return {
    players: 2,
    hands,
    talon,
    trumpSuit: trumpCard.s,
    trumpCard,
    captured: [0, 0],
    capturedCards: [[], []],
    attacker: opts.starter || 0,
    attackCards: [],
    coverCards: [],
    pileWinner: null,
    nextLeader: null,
    phase: "lead",            // lead | defend | reveal | over
    turn: opts.starter || 0,
    winner: null,             // 0 | 1 | "draw"
    last: null,               // {type, by, cards} for animation/log
  };
}

// ── helpers ───────────────────────────────────────────────────────────────
const without = (hand, cards) => {
  const ids = new Set(cards.map(cardId));
  return hand.filter((c) => !ids.has(cardId(c)));
};
const has = (hand, cards) => {
  const set = new Set(hand.map(cardId));
  return cards.every((c) => set.has(cardId(c)));
};

// Is `cover` a valid full cover of `attack` (bijection: each attack card beaten
// by a distinct cover card). Returns true/false. Sizes ≤ 5 → backtracking is cheap.
export function isValidCover(attack, cover, trump) {
  if (cover.length !== attack.length) return false;
  const used = new Array(cover.length).fill(false);
  const solve = (i) => {
    if (i === attack.length) return true;
    for (let j = 0; j < cover.length; j++) {
      if (!used[j] && beats(cover[j], attack[i], trump)) {
        used[j] = true;
        if (solve(i + 1)) return true;
        used[j] = false;
      }
    }
    return false;
  };
  return solve(0);
}

// Can the defender cover this attack at all (with some subset of their hand)?
export function canCover(hand, attack, trump) {
  // greedy: hardest attack first, weakest sufficient beater
  const atk = attack.slice().sort((a, b) => rank(b, trump) - rank(a, trump));
  const pool = hand.slice();
  for (const a of atk) {
    let bestIdx = -1;
    for (let i = 0; i < pool.length; i++) {
      if (beats(pool[i], a, trump)) {
        if (bestIdx === -1 || rank(pool[i], trump) < rank(pool[bestIdx], trump)) bestIdx = i;
      }
    }
    if (bestIdx === -1) return false;
    pool.splice(bestIdx, 1);
  }
  return true;
}

// absolute rank for sorting (trumps rank above everything)
export function rank(c, trump) {
  return (c.s === trump ? 100 : 0) + STR[c.r];
}

// validate a lead throw: 1..5 cards, all in hand; if >1 must share one suit
export function canThrow(hand, cards) {
  if (!cards.length || cards.length > 5) return false;
  if (!has(hand, cards)) return false;
  if (cards.length > 1) {
    const s = cards[0].s;
    if (!cards.every((c) => c.s === s)) return false;
  }
  return true;
}

// 5-card (burkozel) combos: bura = 4 trumps · moskva = 4 aces · instant round win
export function winCombo(hand, trump) {
  if (hand.filter((c) => c.s === trump).length >= 4) return "ბურა";
  if (hand.filter((c) => c.r === "A").length >= 4) return "მოსკვა";
  return null;
}
export function declareCombo(state, player) {
  const combo = winCombo(state.hands[player], state.trumpSuit);
  if (!combo) return state;
  const s = clone(state);
  s.winner = player;
  s.combo = combo;
  s.phase = "over";
  return s;
}

// ── state transitions (return NEW state) ────────────────────────────────────
export function throwCards(state, cards) {
  if (state.phase !== "lead") return state;
  if (!canThrow(state.hands[state.attacker], cards)) return state;
  const s = clone(state);
  s.hands[s.attacker] = without(s.hands[s.attacker], cards);
  s.attackCards = cards.slice();
  s.phase = "defend";
  s.turn = 1 - s.attacker;
  s.last = { type: "throw", by: s.attacker, cards: cards.slice() };
  return s;
}

export function cover(state, cards) {
  if (state.phase !== "defend") return state;
  const def = 1 - state.attacker;
  if (!has(state.hands[def], cards)) return state;
  if (!isValidCover(state.attackCards, cards, state.trumpSuit)) return state;
  const s = clone(state);
  s.hands[def] = without(s.hands[def], cards);
  s.coverCards = cards.slice();       // shown on the table during reveal
  s.pileWinner = def;
  s.nextLeader = def;                 // winner leads next
  s.phase = "reveal";
  s.last = { type: "cover", by: def };
  return s;
}

export function take(state) {
  if (state.phase !== "defend") return state;
  const s = clone(state);
  const atk = s.attacker;
  const def = 1 - atk;
  const n = s.attackCards.length;
  // defender still plays n cards — gives up the lowest-value ones to the attacker
  const give = s.hands[def].slice()
    .sort((a, b) => (cardPts(a) - cardPts(b)) || (rank(a, s.trumpSuit) - rank(b, s.trumpSuit)))
    .slice(0, Math.min(n, s.hands[def].length));
  s.hands[def] = without(s.hands[def], give);
  s.coverCards = give;                // shown on the table, then go to attacker
  s.pileWinner = atk;                 // attacker banks all the cards
  s.nextLeader = atk;                 // attacker keeps the lead
  s.phase = "reveal";
  s.last = { type: "take", by: def };
  return s;
}

// commit a revealed trick → move pile to winner, refill, next lead / end
export function resolve(state) {
  if (state.phase !== "reveal") return state;
  const s = clone(state);
  const pile = s.attackCards.concat(s.coverCards);
  s.captured[s.pileWinner] += handPts(pile);
  s.capturedCards[s.pileWinner] = s.capturedCards[s.pileWinner].concat(pile);
  const leader = s.nextLeader;
  s.attackCards = [];
  s.coverCards = [];
  s.attacker = leader;
  finishTrick(s, leader);
  return s;
}

// draw back to 5 (winner first), then set up next lead / detect end
function finishTrick(s, winner) {
  const order = [winner, 1 - winner];
  for (const p of order) {
    while (s.hands[p].length < 5 && s.talon.length > 0) s.hands[p].push(s.talon.shift());
  }
  // win by points?
  if (s.captured[0] >= 61 || s.captured[1] >= 61) {
    s.winner = s.captured[0] >= 61 ? 0 : 1;
    if (s.captured[0] >= 61 && s.captured[1] >= 61) s.winner = s.captured[0] >= s.captured[1] ? 0 : 1;
    s.phase = "over"; return;
  }
  // deal exhausted — the next leader has no cards to lead with
  if (s.hands[s.attacker].length === 0) {
    s.winner = s.captured[0] === s.captured[1] ? "draw" : (s.captured[0] > s.captured[1] ? 0 : 1);
    s.phase = "over"; return;
  }
  s.phase = "lead";
  s.turn = s.attacker;
}

function clone(s) {
  return {
    ...s,
    hands: [s.hands[0].slice(), s.hands[1].slice()],
    talon: s.talon.slice(),
    captured: s.captured.slice(),
    capturedCards: [s.capturedCards[0].slice(), s.capturedCards[1].slice()],
    attackCards: s.attackCards.slice(),
    coverCards: (s.coverCards || []).slice(),
  };
}

// ============================================================================
//  🤖 BOT  (player index `me`).  diff: "easy" | "normal" | "hard"
// ============================================================================

// choose lead throw
export function botLead(state, me, diff = "normal") {
  const hand = state.hands[me];
  if (!hand.length) return [];
  const trump = state.trumpSuit;
  const oppNear = state.captured[1 - me] >= 45; // opponent close to winning
  const meNear = state.captured[me] >= 45;

  if (diff === "easy") {
    // throw a random single low card
    const sorted = hand.slice().sort((a, b) => rank(a, trump) - rank(b, trump));
    return [sorted[0]];
  }

  // group same-suit non-trump point cards to push when we're ahead / need points
  const bySuit = {};
  hand.forEach((c) => { (bySuit[c.s] = bySuit[c.s] || []).push(c); });

  // If we (or opponent) are near the finish and we hold strong trumps, dump points via trumps
  if ((meNear || oppNear) && bySuit[trump] && bySuit[trump].length >= 2) {
    const grp = bySuit[trump].slice().sort((a, b) => rank(b, trump) - rank(a, trump)).slice(0, Math.min(5, bySuit[trump].length));
    if (handPts(grp) > 0) return grp;
  }

  // Prefer to lead the lowest-value non-trump card (bait, conserve trumps/aces)
  const nonTrump = hand.filter((c) => c.s !== trump);
  const pool = nonTrump.length ? nonTrump : hand;
  const low = pool.slice().sort((a, b) => (cardPts(a) - cardPts(b)) || (rank(a, trump) - rank(b, trump)))[0];

  // hard: if we have an unbeatable ace of a suit the opp likely lacks, cash it (approx: just lead lowest)
  return [low];
}

// decide cover vs take, and which cards to cover with
export function botDefend(state, me, diff = "normal") {
  const hand = state.hands[me];
  const attack = state.attackCards;
  const trump = state.trumpSuit;
  const trickPts = handPts(attack);

  if (!canCover(hand, attack, trump)) return { take: true };

  // cheapest valid cover (greedy)
  const cover = cheapestCover(hand, attack, trump);
  const coverCost = cover ? cover.reduce((s, c) => s + rank(c, trump), 0) : 999;
  const usesTrump = cover ? cover.some((c) => c.s === trump) : false;
  const usesHigh = cover ? cover.some((c) => cardPts(c) >= 10) : false;

  if (diff === "easy") {
    return cover ? { take: false, cards: cover } : { take: true };
  }

  const meNear = state.captured[me] >= 45;
  const oppNear = state.captured[1 - me] >= 45;

  // If the trick is worthless (0 pts) and covering wastes a trump or a 10/A → concede
  if (trickPts === 0 && (usesTrump || usesHigh) && !oppNear) return { take: true };
  // If covering needs a trump for only a few points and we're not pressured → concede
  if (trickPts > 0 && trickPts <= 4 && usesTrump && !oppNear && !meNear && diff === "hard") return { take: true };

  return cover ? { take: false, cards: cover } : { take: true };
}

function cheapestCover(hand, attack, trump) {
  const atk = attack.slice().sort((a, b) => rank(b, trump) - rank(a, trump));
  const pool = hand.slice();
  const chosen = [];
  for (const a of atk) {
    let bestIdx = -1;
    for (let i = 0; i < pool.length; i++) {
      if (beats(pool[i], a, trump)) {
        if (bestIdx === -1 || rank(pool[i], trump) < rank(pool[bestIdx], trump)) bestIdx = i;
      }
    }
    if (bestIdx === -1) return null;
    chosen.push(pool[bestIdx]);
    pool.splice(bestIdx, 1);
  }
  return chosen;
}

// one convenience entry the UI can call for the bot's full move
export function botMove(state, me, diff = "normal") {
  if (state.phase === "lead" && state.turn === me) {
    return { kind: "throw", cards: botLead(state, me, diff) };
  }
  if (state.phase === "defend" && state.turn === me) {
    const d = botDefend(state, me, diff);
    return d.take ? { kind: "take" } : { kind: "cover", cards: d.cards };
  }
  return null;
}
