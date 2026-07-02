// ============================================================================
//  🎴 იაპონური ჯოკერი — game engine (pure, serializable). No React, no network here.
//  36 cards · deal 5 · non-dealer declares trump before the first lead ·
//  throw 1–5 same suit · cover with higher same-suit or trump, or take ·
//  refill to 5 after each trick · deal ends when the attacker runs out of
//  cards · score = (your captured cards − opponent's captured cards) for the
//  deal, added to a running match score · equal split = ნიჩია (redeal, no
//  score change) · first to 21 wins the match.
// ============================================================================

import { RANKS, SUITS, SUIT_SYM, SUIT_RED, cardId, beats, isValidCover, canCover, rank, canThrow } from "./bura";

export { RANKS, SUITS, SUIT_SYM, SUIT_RED, cardId, beats, isValidCover, canCover, rank, canThrow };

const TARGET = 21;

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
const without = (hand, cards) => {
  const ids = new Set(cards.map(cardId));
  return hand.filter((c) => !ids.has(cardId(c)));
};
const has = (hand, cards) => {
  const set = new Set(hand.map(cardId));
  return cards.every((c) => set.has(cardId(c)));
};

// New deal. `dealer` deals; the OTHER player declares trump before the first lead.
export function newGame(opts = {}) {
  const dealer = opts.dealer != null ? opts.dealer : 0;
  const chooser = 1 - dealer;
  const rnd = opts.rnd;
  const deck = shuffle(fullDeck(), rnd);
  const hands = [deck.slice(0, 5), deck.slice(5, 10)];
  const talon = deck.slice(10);
  return {
    players: 2,
    dealer,
    hands,
    talon,
    trumpSuit: null,
    matchScore: opts.matchScore ? opts.matchScore.slice() : [0, 0],
    capturedCount: [0, 0],
    capturedCards: [[], []],
    attacker: chooser,        // the trump-chooser leads first
    attackCards: [],
    coverCards: [],
    pileWinner: null,
    nextLeader: null,
    phase: "choose-trump",    // choose-trump | lead | defend | reveal | dealover | over
    turn: chooser,
    winner: null,              // 0 | 1 match winner
    dealResult: null,          // { winner: 0|1|"tie", score } for the deal that just ended
    last: null,
  };
}

function clone(s) {
  return {
    ...s,
    hands: [s.hands[0].slice(), s.hands[1].slice()],
    talon: s.talon.slice(),
    matchScore: s.matchScore.slice(),
    capturedCount: s.capturedCount.slice(),
    capturedCards: [s.capturedCards[0].slice(), s.capturedCards[1].slice()],
    attackCards: s.attackCards.slice(),
    coverCards: (s.coverCards || []).slice(),
  };
}

export function chooseTrump(state, suit) {
  if (state.phase !== "choose-trump") return state;
  if (!SUITS.includes(suit)) return state;
  const s = clone(state);
  s.trumpSuit = suit;
  s.phase = "lead";
  s.turn = s.attacker;
  s.last = { type: "trump", by: state.turn, suit };
  return s;
}

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
  s.coverCards = cards.slice();
  s.pileWinner = def;
  s.nextLeader = def;
  s.phase = "reveal";
  s.last = { type: "cover", by: def };
  return s;
}

// `chosen`: cards the defender picked to surrender. Honored only if it's
// exactly n cards from their own hand; otherwise falls back to giving up
// the n weakest-ranked cards (bot / no selection made). Card identity has no
// scoring effect here (only count matters), so this is purely a UI courtesy.
export function take(state, chosen) {
  if (state.phase !== "defend") return state;
  const s = clone(state);
  const atk = s.attacker;
  const def = 1 - atk;
  const n = s.attackCards.length;
  const give = (chosen && chosen.length === n && has(s.hands[def], chosen))
    ? chosen.slice()
    : s.hands[def].slice()
        .sort((a, b) => rank(a, s.trumpSuit) - rank(b, s.trumpSuit))
        .slice(0, Math.min(n, s.hands[def].length));
  s.hands[def] = without(s.hands[def], give);
  s.coverCards = give;
  s.pileWinner = atk;
  s.nextLeader = atk;
  s.phase = "reveal";
  s.last = { type: "take", by: def };
  return s;
}

export function resolve(state) {
  if (state.phase !== "reveal") return state;
  const s = clone(state);
  const pile = s.attackCards.concat(s.coverCards);
  s.capturedCount[s.pileWinner] += pile.length;
  s.capturedCards[s.pileWinner] = s.capturedCards[s.pileWinner].concat(pile);
  const leader = s.nextLeader;
  s.attackCards = [];
  s.coverCards = [];
  s.attacker = leader;
  finishTrick(s, leader);
  return s;
}

function finishTrick(s, winner) {
  const order = [winner, 1 - winner];
  for (const p of order) {
    while (s.hands[p].length < 5 && s.talon.length > 0) s.hands[p].push(s.talon.shift());
  }
  if (s.hands[s.attacker].length === 0) {
    endDeal(s);
    return;
  }
  s.phase = "lead";
  s.turn = s.attacker;
}

function endDeal(s) {
  const diff = s.capturedCount[0] - s.capturedCount[1];
  if (diff === 0) {
    s.dealResult = { winner: "tie", score: 0 };
    s.phase = "dealover";
    return;
  }
  const winner = diff > 0 ? 0 : 1;
  const score = Math.abs(diff);
  s.matchScore[winner] += score;
  s.dealResult = { winner, score };
  if (s.matchScore[winner] >= TARGET) {
    s.winner = winner;
    s.phase = "over";
  } else {
    s.phase = "dealover";
  }
}

// start the next deal after a "dealover" screen — dealer alternates every deal
export function nextDeal(state) {
  if (state.phase !== "dealover") return state;
  return newGame({ dealer: 1 - state.dealer, matchScore: state.matchScore, rnd: state._rnd });
}

// ============================================================================
//  🤖 BOT  (player index `me`).  diff: "easy" | "normal" | "hard"
// ============================================================================

export function botChooseTrump(state, me) {
  const hand = state.hands[me];
  const bySuit = {};
  hand.forEach((c) => { bySuit[c.s] = (bySuit[c.s] || 0) + 1; });
  let best = SUITS[0], bestN = -1;
  for (const s of SUITS) { if ((bySuit[s] || 0) > bestN) { best = s; bestN = bySuit[s] || 0; } }
  return best;
}

export function botLead(state, me, diff = "normal") {
  const hand = state.hands[me];
  if (!hand.length) return [];
  const trump = state.trumpSuit;
  if (diff === "easy") {
    const sorted = hand.slice().sort((a, b) => rank(a, trump) - rank(b, trump));
    return [sorted[0]];
  }
  const nonTrump = hand.filter((c) => c.s !== trump);
  const pool = nonTrump.length ? nonTrump : hand;
  const low = pool.slice().sort((a, b) => rank(a, trump) - rank(b, trump))[0];
  return [low];
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

// every captured card counts equally here (no point values), so the bot
// simply covers whenever it validly can and only takes when it must
export function botDefend(state, me, diff = "normal") {
  const hand = state.hands[me];
  const attack = state.attackCards;
  const trump = state.trumpSuit;
  if (!canCover(hand, attack, trump)) return { take: true };
  const cov = cheapestCover(hand, attack, trump);
  return cov ? { take: false, cards: cov } : { take: true };
}

export function botMove(state, me, diff = "normal") {
  if (state.phase === "choose-trump" && state.turn === me) {
    return { kind: "trump", suit: botChooseTrump(state, me) };
  }
  if (state.phase === "lead" && state.turn === me) {
    return { kind: "throw", cards: botLead(state, me, diff) };
  }
  if (state.phase === "defend" && state.turn === me) {
    const d = botDefend(state, me, diff);
    return d.take ? { kind: "take" } : { kind: "cover", cards: d.cards };
  }
  return null;
}
