import { useState, useEffect, useCallback } from "react";
import { languagesApi, hasSupabase, profilesApi, mergeProfile, followsApi, ME } from "../ui/core";

export const LEARN_LANGS = ["english", "german", "spanish", "french"];
export const LANG_CODE = { english: "en-US", german: "de-DE", spanish: "es-ES", french: "fr-FR" };
const XP_REWARD = { flashcard: 10, multi: 15, fill: 20, scramble: 20, listen: 25, listenSentence: 30, order: 25, speak: 20 };
const DEFAULT_DAILY_GOAL = 20;

const lsGet = (k) => { try { return typeof localStorage !== "undefined" ? localStorage.getItem(k) : null; } catch (e) { return null; } };
const lsSet = (k, v) => { try { if (typeof localStorage !== "undefined") localStorage.setItem(k, v); } catch (e) {} };

export const speakWord = (text, lang) => {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = LANG_CODE[lang] || "en-US";
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
};

const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => arr.slice().sort(() => Math.random() - 0.5);
const scrambleLetters = (w) => {
  const letters = w.split("");
  let s = shuffle(letters).join("");
  if (s.toLowerCase() === w.toLowerCase() && letters.length > 1) s = letters.reverse().join("");
  return s;
};

export function useLanguages({ session, gainXp }) {
  const [learnLang, setLearnLangState] = useState(() => lsGet("mz_learn_lang"));
  const [progress, setProgress] = useState({});
  const [level, setLevel] = useState("all");
  const [enabled, setEnabled] = useState(true);
  const [board, setBoard] = useState([]);
  const [boardLoading, setBoardLoading] = useState(false);
  const [friendBoard, setFriendBoard] = useState([]);
  const [friendBoardLoading, setFriendBoardLoading] = useState(false);
  const [streak, setStreak] = useState(() => {
    const raw = lsGet("mz_lang_streak");
    if (!raw) return { current: 0, longest: 0, lastActive: null };
    try { return JSON.parse(raw); } catch (e) { return { current: 0, longest: 0, lastActive: null }; }
  });
  const [dailyGoal, setDailyGoalState] = useState(() => Number(lsGet("mz_lang_goal")) || DEFAULT_DAILY_GOAL);
  const [todayXp, setTodayXp] = useState(() => {
    const raw = lsGet("mz_lang_goal_progress");
    if (!raw) return 0;
    try { const p = JSON.parse(raw); return p.date === new Date().toISOString().slice(0, 10) ? p.xp : 0; } catch (e) { return 0; }
  });
  const [wordLists, setWordLists] = useState([]);
  const [listItems, setListItems] = useState({}); // listId -> [wordId, ...]
  // the CEFR word tables are ~450kB of pure data used only by the languages tab —
  // loaded on demand so it doesn't bloat the bundle every other tab pays for.
  const [wordsMod, setWordsMod] = useState(null);
  const WDB = wordsMod ? wordsMod.WDB : {};
  const allWords = wordsMod ? wordsMod.allWords : () => [];

  useEffect(() => {
    if (!hasSupabase) return;
    languagesApi.getSetting("languages_enabled").then((v) => { if (v === false) setEnabled(false); }).catch(() => {});
  }, []);

  useEffect(() => { import("../data/langWords").then(setWordsMod); }, []);

  useEffect(() => {
    if (hasSupabase && session) languagesApi.getStreak().then(setStreak).catch(() => {});
  }, [session]);

  const setLearnLang = (l) => { setLearnLangState(l); lsSet("mz_learn_lang", l || ""); setLevel("all"); };

  const loadProgress = useCallback(async (lang) => {
    if (!hasSupabase || !lang || !session) return;
    try { setProgress(await languagesApi.progress(lang)); } catch (e) {}
  }, [session]);

  useEffect(() => { if (learnLang) loadProgress(learnLang); }, [learnLang, loadProgress]);

  const loadWordLists = useCallback(async (lang) => {
    if (!hasSupabase || !lang || !session) { setWordLists([]); return; }
    try {
      const lists = await languagesApi.lists.list(lang);
      setWordLists(lists);
      const entries = await Promise.all(lists.map((l) => languagesApi.lists.items(l.id).then((ids) => [l.id, ids])));
      setListItems(Object.fromEntries(entries));
    } catch (e) {}
  }, [session]);

  useEffect(() => { if (learnLang) loadWordLists(learnLang); }, [learnLang, loadWordLists]);

  const onCreateList = (name) => languagesApi.lists.create(learnLang, name).then((l) => { setWordLists((ls) => [...ls, l]); setListItems((li) => ({ ...li, [l.id]: [] })); return l; });
  const onRenameList = (id, name) => { setWordLists((ls) => ls.map((l) => l.id === id ? { ...l, name } : l)); languagesApi.lists.rename(id, name).catch(() => {}); };
  const onDeleteList = (id) => {
    setWordLists((ls) => ls.filter((l) => l.id !== id));
    setListItems((li) => { const n = { ...li }; delete n[id]; return n; });
    languagesApi.lists.remove(id).catch(() => {});
  };
  const onAddToList = (listId, wordId) => {
    setListItems((li) => li[listId] && li[listId].includes(wordId) ? li : { ...li, [listId]: [...(li[listId] || []), wordId] });
    languagesApi.lists.addItem(listId, wordId).catch(() => {});
  };
  const onRemoveFromList = (listId, wordId) => {
    setListItems((li) => ({ ...li, [listId]: (li[listId] || []).filter((w) => w !== wordId) }));
    languagesApi.lists.removeItem(listId, wordId).catch(() => {});
  };

  // a custom word-list is addressed by the synthetic level id "list:<id>" so it
  // slots into the existing flashcards/exercises/spaced-repetition machinery
  // (which only ever deals in "lang + level id") for free, no separate code path.
  const wordsForLevel = (lang, lvl) => {
    if (lvl && lvl.startsWith("list:")) {
      const ids = new Set(listItems[lvl.slice(5)] || []);
      return allWords(lang).filter((w) => ids.has(w.id));
    }
    return (!lvl || lvl === "all") ? allWords(lang) : (WDB[lang] && WDB[lang][lvl] ? WDB[lang][lvl] : []);
  };
  const availableLevels = (lang) => Object.entries(WDB[lang] || {}).filter(([, arr]) => arr.length > 0).map(([lvl]) => lvl);

  const masteredCount = (lang) => Object.values(progress).filter((p) => p.mastery >= 100).length;
  const totalCount = (lang) => allWords(lang).length;
  // words already seen at least once whose scheduled review has come due —
  // separate from "unseen", which is always available as new material
  const dueCount = () => Object.values(progress).filter((p) => !p.nextReview || new Date(p.nextReview).getTime() <= Date.now()).length;

  // spaced repetition: the review interval grows with mastery (a mastered
  // word still comes back eventually, just less often) instead of a word
  // that hit 100% never being shown again.
  const reviewIntervalDays = (mastery) => mastery >= 100 ? 21 : mastery >= 80 ? 10 : mastery >= 60 ? 5 : mastery >= 40 ? 2 : mastery >= 20 ? 1 : 0;
  const isDue = (w) => { const p = progress[w.id]; if (!p) return true; if (!p.nextReview) return true; return new Date(p.nextReview).getTime() <= Date.now(); };

  // any practice attempt (right or wrong) keeps today's streak alive; only a
  // correct/rewarded one also counts toward the daily XP goal.
  const touchStreak = () => {
    const today = new Date().toISOString().slice(0, 10);
    setStreak((s) => {
      if (s.lastActive === today) return s;
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const current = s.lastActive === yesterday ? s.current + 1 : 1;
      const longest = Math.max(s.longest || 0, current);
      const next = { current, longest, lastActive: today };
      if (hasSupabase && session) languagesApi.saveStreak(current, longest, today).catch(() => {});
      else lsSet("mz_lang_streak", JSON.stringify(next));
      return next;
    });
  };
  const bumpDailyGoal = (amount) => {
    setTodayXp((cur) => {
      const next = cur + amount;
      lsSet("mz_lang_goal_progress", JSON.stringify({ date: new Date().toISOString().slice(0, 10), xp: next }));
      return next;
    });
  };
  const setDailyGoal = (n) => { setDailyGoalState(n); lsSet("mz_lang_goal", String(n)); };
  const recordPractice = (xp) => { touchStreak(); if (xp) { bumpDailyGoal(xp); gainXp(xp); } };

  const bumpMastery = (lang, wordId, delta, xp) => {
    setProgress((p) => {
      const cur = (p[wordId] && p[wordId].mastery) || 0;
      const next = Math.max(0, Math.min(100, cur + delta));
      const nextReview = new Date(Date.now() + reviewIntervalDays(next) * 86400000).toISOString();
      if (hasSupabase && session) languagesApi.saveProgress(lang, wordId, next, nextReview).catch(() => {});
      return { ...p, [wordId]: { mastery: next, ts: Date.now(), nextReview } };
    });
    recordPractice(xp);
  };

  const nextFlashcard = (lang, lvl) => {
    const ws = wordsForLevel(lang, lvl);
    if (!ws.length) return null;
    const unseen = ws.filter((w) => !progress[w.id]);
    if (unseen.length) return rnd(unseen.slice(0, Math.max(5, unseen.length)));
    const due = ws.filter(isDue);
    if (due.length) return due.slice().sort((a, b) => ((progress[a.id] && progress[a.id].mastery) || 0) - ((progress[b.id] && progress[b.id].mastery) || 0))[0];
    // nothing due yet — fall back to whichever word was reviewed longest ago
    // rather than dead-ending the exercise flow with "nothing to practice".
    return ws.slice().sort((a, b) => ((progress[a.id] && progress[a.id].ts) || 0) - ((progress[b.id] && progress[b.id].ts) || 0))[0];
  };

  const onFlashcardKnow = (lang, wordId) => bumpMastery(lang, wordId, 25, XP_REWARD.flashcard);
  const onFlashcardDontKnow = (lang, wordId) => bumpMastery(lang, wordId, -20, 0);

  const genExercise = (kind, lang, lvl) => {
    const ws = wordsForLevel(lang, lvl);
    if (ws.length < 4 && (kind === "multi" || kind === "listenSentence")) return null;
    const word = nextFlashcard(lang, lvl) || rnd(ws);
    if (!word) return null;
    if (kind === "multi") {
      const wrong = ws.filter((w) => w.id !== word.id).sort(() => Math.random() - 0.5).slice(0, 3).map((w) => w.t);
      return { kind, word, options: shuffle([word.t, ...wrong]) };
    }
    if (kind === "fill") {
      const chars = word.w.split("");
      const maskIdx = new Set();
      const maskCount = Math.max(1, Math.floor(chars.length * 0.4));
      while (maskIdx.size < maskCount && maskIdx.size < chars.length - 1) maskIdx.add(Math.floor(Math.random() * chars.length));
      const masked = chars.map((c, i) => (maskIdx.has(i) && c !== " " ? "_" : c)).join("");
      return { kind, word, masked };
    }
    if (kind === "scramble") return { kind, word, scrambled: scrambleLetters(word.w) };
    if (kind === "listen") return { kind, word };
    if (kind === "listenSentence") {
      // tests comprehension of the full example sentence via TTS, not just the
      // isolated word — the correct choice is the sentence's Georgian translation.
      const wrong = ws.filter((w) => w.id !== word.id).sort(() => Math.random() - 0.5).slice(0, 3).map((w) => w.ext);
      return { kind, word, options: shuffle([word.ext, ...wrong]) };
    }
    if (kind === "order") {
      const eligible = ws.filter((w) => w.ex && w.ex.trim().split(" ").length >= 3);
      if (!eligible.length) return null;
      const w = eligible.find((x) => x.id === word.id) || rnd(eligible);
      const correctOrder = w.ex.replace(/[.!?]+$/, "").split(" ");
      return { kind, word: w, tokens: shuffle(correctOrder), correctOrder };
    }
    if (kind === "speak") return { kind, word };
    return null;
  };

  const onExerciseAnswer = (lang, word, correct, kind) => bumpMastery(lang, word.id, correct ? 20 : -10, correct ? XP_REWARD[kind] : 0);

  const loadBoard = async (lang) => {
    if (!hasSupabase) { setBoard([]); return; }
    setBoardLoading(true);
    try {
      const rows = await languagesApi.leaderboard(lang, 20);
      const ids = rows.map((r) => r.user_id);
      if (ids.length) { const profs = await profilesApi.byIds(ids); profs.forEach(mergeProfile); }
      setBoard(rows);
    } catch (e) { setBoard([]); } finally { setBoardLoading(false); }
  };

  const loadFriendBoard = async (lang) => {
    if (!hasSupabase || !session) { setFriendBoard([]); return; }
    setFriendBoardLoading(true);
    try {
      const friends = await followsApi.following(ME);
      const rows = await languagesApi.leaderboardFriends(lang, friends.map((f) => f.id));
      const ids = rows.map((r) => r.user_id);
      if (ids.length) { const profs = await profilesApi.byIds(ids); profs.forEach(mergeProfile); }
      setFriendBoard(rows);
    } catch (e) { setFriendBoard([]); } finally { setFriendBoardLoading(false); }
  };

  return {
    learnLang, setLearnLang, progress, level, setLevel, enabled, wordsReady: !!wordsMod,
    wordsForLevel, availableLevels, masteredCount, totalCount, dueCount,
    nextFlashcard, onFlashcardKnow, onFlashcardDontKnow,
    genExercise, onExerciseAnswer, recordPractice,
    board, boardLoading, loadBoard,
    friendBoard, friendBoardLoading, loadFriendBoard,
    streak, dailyGoal, setDailyGoal, todayXp,
    wordLists, listItems, onCreateList, onRenameList, onDeleteList, onAddToList, onRemoveFromList,
  };
}
