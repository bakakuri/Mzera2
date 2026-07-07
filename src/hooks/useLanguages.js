import { useState, useEffect, useCallback } from "react";
import { languagesApi, hasSupabase, profilesApi, mergeProfile } from "../ui/core";

export const LEARN_LANGS = ["english", "german", "spanish", "french"];
const LANG_CODE = { english: "en-US", german: "de-DE", spanish: "es-ES", french: "fr-FR" };
const XP_REWARD = { flashcard: 10, multi: 15, fill: 20, scramble: 20, listen: 25 };

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

  const setLearnLang = (l) => { setLearnLangState(l); lsSet("mz_learn_lang", l || ""); setLevel("all"); };

  const loadProgress = useCallback(async (lang) => {
    if (!hasSupabase || !lang || !session) return;
    try { setProgress(await languagesApi.progress(lang)); } catch (e) {}
  }, [session]);

  useEffect(() => { if (learnLang) loadProgress(learnLang); }, [learnLang, loadProgress]);

  const wordsForLevel = (lang, lvl) => (!lvl || lvl === "all") ? allWords(lang) : (WDB[lang] && WDB[lang][lvl] ? WDB[lang][lvl] : []);
  const availableLevels = (lang) => Object.entries(WDB[lang] || {}).filter(([, arr]) => arr.length > 0).map(([lvl]) => lvl);

  const masteredCount = (lang) => Object.values(progress).filter((p) => p.mastery >= 100).length;
  const totalCount = (lang) => allWords(lang).length;

  const bumpMastery = (lang, wordId, delta, xp) => {
    setProgress((p) => {
      const cur = (p[wordId] && p[wordId].mastery) || 0;
      const next = Math.max(0, Math.min(100, cur + delta));
      if (hasSupabase && session) languagesApi.saveProgress(lang, wordId, next).catch(() => {});
      return { ...p, [wordId]: { mastery: next, ts: Date.now() } };
    });
    if (xp) gainXp(xp);
  };

  const nextFlashcard = (lang, lvl) => {
    const ws = wordsForLevel(lang, lvl);
    if (!ws.length) return null;
    const unseen = ws.filter((w) => !progress[w.id]);
    if (unseen.length) return rnd(unseen.slice(0, Math.max(5, unseen.length)));
    const rest = ws.filter((w) => ((progress[w.id] && progress[w.id].mastery) || 0) < 100);
    if (!rest.length) return null;
    return rest.slice().sort((a, b) => ((progress[a.id] && progress[a.id].mastery) || 0) - ((progress[b.id] && progress[b.id].mastery) || 0))[0];
  };

  const onFlashcardKnow = (lang, wordId) => bumpMastery(lang, wordId, 25, XP_REWARD.flashcard);
  const onFlashcardDontKnow = (lang, wordId) => bumpMastery(lang, wordId, -20, 0);

  const genExercise = (kind, lang, lvl) => {
    const ws = wordsForLevel(lang, lvl);
    if (ws.length < 4 && kind === "multi") return null;
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

  return {
    learnLang, setLearnLang, progress, level, setLevel, enabled, wordsReady: !!wordsMod,
    wordsForLevel, availableLevels, masteredCount, totalCount,
    nextFlashcard, onFlashcardKnow, onFlashcardDontKnow,
    genExercise, onExerciseAnswer,
    board, boardLoading, loadBoard,
  };
}
