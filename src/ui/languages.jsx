import { useState, useEffect } from "react";
import {
  ArrowLeft, BookOpen, GraduationCap, Shuffle, Volume2, Headphones, CheckCircle2, XCircle, Trophy, Languages as LanguagesIcon, ChevronRight,
  C, SH, GBRAND, DISPLAY, MONO, Mono, Title, Empty, Avatar, Name, ME, t,
} from "./core";
import { WDB, wordLevels } from "../data/langWords";
import { GRAMMAR } from "../data/langGrammar";
import { speakWord } from "../hooks/useLanguages";

const FLAG = { english: "🇬🇧", german: "🇩🇪", spanish: "🇪🇸", french: "🇫🇷" };
const LEARN_LANGS = ["english", "german", "spanish", "french"];

function LangCard({ lang, onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 p-4 rounded-2xl w-full text-left active:scale-[.98] transition" style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SH.card }}>
      <span style={{ fontSize: 34 }}>{FLAG[lang]}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: DISPLAY }}>{t("langname." + lang)}</div>
        <div className="text-[12.5px]" style={{ color: C.muted }}>{wordLevels(lang).join(" · ") || "—"}</div>
      </div>
      <ChevronRight size={20} style={{ color: C.faint }} />
    </button>
  );
}

function ActionTile({ icon: I, label, onClick }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl active:scale-[.97] transition" style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SH.card }}>
      <div className="rounded-2xl flex items-center justify-center" style={{ width: 46, height: 46, background: C.accentSoft }}><I size={22} style={{ color: C.accent }} /></div>
      <span className="text-[13.5px] font-bold" style={{ color: C.ink }}>{label}</span>
    </button>
  );
}

function SubHeader({ title, onBack }) {
  return (
    <div className="flex items-center gap-3 px-4 pt-5 pb-3">
      <button onClick={onBack} aria-label={t("a11y.back")} className="active:scale-90"><ArrowLeft size={22} style={{ color: C.ink }} /></button>
      <span className="text-[18px] font-bold" style={{ color: C.ink, fontFamily: DISPLAY }}>{title}</span>
    </div>
  );
}

function Flashcards({ lang, level, nextFlashcard, onKnow, onDontKnow }) {
  const [word, setWord] = useState(() => nextFlashcard(lang, level));
  const [flipped, setFlipped] = useState(false);
  useEffect(() => { setWord(nextFlashcard(lang, level)); setFlipped(false); }, [lang, level]);

  const advance = (fn) => { fn(lang, word.id); setFlipped(false); setWord(nextFlashcard(lang, level)); };

  if (!word) return <Empty icon={BookOpen} t={t("lang.allCardsMastered")} />;
  return (
    <div className="px-4 pb-10">
      <div onClick={() => setFlipped((f) => !f)} className="rounded-3xl p-8 text-center cursor-pointer active:scale-[.99] transition" style={{ background: `linear-gradient(135deg, ${C.surface}, ${C.surfaceMuted})`, border: `1px solid ${C.line}`, minHeight: 180 }}>
        {!flipped ? (
          <>
            <div className="text-[28px] font-extrabold" style={{ color: C.ink, fontFamily: DISPLAY }}>{word.w}</div>
            <div className="text-[13px] mt-1.5" style={{ color: C.muted }}>{word.ph}</div>
            <div className="text-[13px] mt-3 italic" style={{ color: C.ink2 }}>"{word.ex}"</div>
            <div className="text-[12px] mt-4" style={{ color: C.faint }}>{t("lang.flipCard")}</div>
          </>
        ) : (
          <>
            <div className="text-[24px] font-extrabold" style={{ color: C.accent, fontFamily: DISPLAY }}>{word.t}</div>
            <div className="text-[13px] mt-3 italic" style={{ color: C.ink2 }}>"{word.ext}"</div>
          </>
        )}
      </div>
      <button onClick={() => speakWord(word.w, lang)} className="mx-auto mt-3 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-bold active:scale-95" style={{ background: C.accentSoft, color: C.accentText }}><Volume2 size={15} /> {t("lang.playAudio")}</button>
      <div className="flex gap-3 mt-6">
        <button onClick={() => advance(onDontKnow)} className="flex-1 py-3.5 rounded-2xl font-bold text-[14px] active:scale-[.98]" style={{ background: C.surfaceMuted, color: C.ink2 }}>{t("lang.dontKnowIt")}</button>
        <button onClick={() => advance(onKnow)} className="flex-1 py-3.5 rounded-2xl font-bold text-[14px] text-white active:scale-[.98]" style={{ backgroundImage: GBRAND, boxShadow: SH.glow }}>{t("lang.knowIt")}</button>
      </div>
    </div>
  );
}

const EX_KINDS = [
  ["multi", "lang.exerciseMulti", CheckCircle2],
  ["fill", "lang.exerciseFill", XCircle],
  ["scramble", "lang.exerciseScramble", Shuffle],
  ["listen", "lang.exerciseListen", Volume2],
  ["listenSentence", "lang.exerciseListenSentence", Headphones],
];

function ExercisePicker({ onPick }) {
  return (
    <div className="grid grid-cols-2 gap-3 px-4 pb-10">
      {EX_KINDS.map(([k, labelKey, I]) => <ActionTile key={k} icon={I} label={t(labelKey)} onClick={() => onPick(k)} />)}
    </div>
  );
}

function ExerciseRunner({ kind, lang, level, genExercise, onAnswer, onExit }) {
  const [q, setQ] = useState(() => genExercise(kind, lang, level));
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null); // null | true | false
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);

  const next = () => { setQ(genExercise(kind, lang, level)); setInput(""); setResult(null); };

  const submitText = () => {
    if (!q || result !== null) return;
    const ok = input.trim().toLowerCase() === q.word.w.toLowerCase();
    setResult(ok); setTotal((n) => n + 1); if (ok) setScore((s) => s + 1);
    onAnswer(lang, q.word, ok, kind);
  };
  const correctOption = q && (kind === "listenSentence" ? q.word.ext : q.word.t);
  const pickOption = (opt) => {
    if (!q || result !== null) return;
    const ok = opt === correctOption;
    setResult(ok); setTotal((n) => n + 1); if (ok) setScore((s) => s + 1);
    onAnswer(lang, q.word, ok, kind);
  };

  if (!q) return <Empty icon={CheckCircle2} t={t("lang.allCardsMastered")} />;
  return (
    <div className="px-4 pb-10">
      <div className="flex items-center justify-between mb-3">
        <button onClick={onExit} className="text-[13px] font-bold" style={{ color: C.muted }}>{t("lang.exit")}</button>
        <Mono style={{ fontSize: 13, color: C.ink2 }}>{t("lang.score")}: {score}/{total}</Mono>
      </div>
      <div className="rounded-3xl p-6 text-center mb-4" style={{ background: `linear-gradient(135deg, ${C.surface}, ${C.surfaceMuted})`, border: `1px solid ${C.line}` }}>
        {kind === "multi" && (<><div className="text-[12px] mb-1" style={{ color: C.muted }}>{q.word.ph}</div><div className="text-[24px] font-extrabold" style={{ color: C.ink, fontFamily: DISPLAY }}>{q.word.w}</div><div className="text-[12.5px] mt-2 italic" style={{ color: C.ink2 }}>"{q.word.ex}"</div></>)}
        {kind === "fill" && (<><div className="text-[14px]" style={{ color: C.muted }}>{q.word.t}</div><div className="text-[26px] font-extrabold mt-1.5" style={{ color: C.ink, fontFamily: MONO, letterSpacing: 2 }}>{q.masked}</div></>)}
        {kind === "scramble" && (<><div className="text-[14px]" style={{ color: C.muted }}>{q.word.t}</div><div className="text-[26px] font-extrabold mt-1.5" style={{ color: C.ink, fontFamily: MONO, letterSpacing: 3 }}>{q.scrambled}</div></>)}
        {kind === "listen" && (<><button onClick={() => speakWord(q.word.w, lang)} className="mx-auto flex items-center gap-2 px-5 py-3 rounded-full font-bold text-white active:scale-95" style={{ backgroundImage: GBRAND, boxShadow: SH.glow }}><Volume2 size={18} /> {t("lang.playAudio")}</button></>)}
        {kind === "listenSentence" && (<><button onClick={() => speakWord(q.word.ex, lang)} className="mx-auto flex items-center gap-2 px-5 py-3 rounded-full font-bold text-white active:scale-95" style={{ backgroundImage: GBRAND, boxShadow: SH.glow }}><Headphones size={18} /> {t("lang.playAudio")}</button></>)}
      </div>
      {(kind === "multi" || kind === "listenSentence") ? (
        <div className="space-y-2">
          {kind === "listenSentence" && <div className="mb-1 text-[13px] text-center" style={{ color: C.muted }}>{t("lang.listenSentencePrompt")}</div>}
          {q.options.map((opt, i) => {
            const isCorrect = opt === correctOption;
            const isPicked = result !== null && input === opt;
            return <button key={i} onClick={() => { setInput(opt); pickOption(opt); }} disabled={result !== null}
              className="w-full text-left px-4 py-3.5 rounded-2xl text-[15px] font-semibold transition"
              style={result !== null && isCorrect ? { background: C.online + "22", border: `1px solid ${C.online}66`, color: C.online } : (isPicked ? { background: C.like + "22", border: `1px solid ${C.like}66`, color: C.like } : { background: C.surfaceMuted, border: `1px solid ${C.line}`, color: C.ink })}>{opt}</button>;
          })}
        </div>
      ) : (
        <>
          <div className="mb-2 text-[13px] text-center" style={{ color: C.muted }}>{kind === "listen" ? t("lang.listenPrompt") : kind === "scramble" ? t("lang.unscramblePrompt") : t("lang.typeTranslation")}</div>
          <input autoFocus value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitText()} disabled={result !== null}
            className="w-full px-4 py-3.5 rounded-2xl text-[16px] text-center outline-none"
            style={{ background: result === true ? C.online + "1a" : result === false ? C.like + "1a" : C.surfaceMuted, border: `1px solid ${result === true ? C.online : result === false ? C.like : C.line}`, color: C.ink }} />
          {result === null && <button onClick={submitText} className="w-full mt-3 py-3.5 rounded-2xl font-bold text-white active:scale-[.98]" style={{ backgroundImage: GBRAND, boxShadow: SH.glow }}>{t("lang.checkAnswer")}</button>}
        </>
      )}
      {result !== null && (
        <div className="mt-4 text-center">
          {kind === "listenSentence" && <div className="text-[13.5px] italic mb-2" style={{ color: C.ink2 }}>"{q.word.ex}"</div>}
          <div className="text-[15px] font-bold" style={{ color: result ? C.online : C.like }}>{result ? t("lang.correctAnswer") : t("lang.incorrectAnswer") + " — " + (kind === "listenSentence" ? q.word.ext : q.word.w)}</div>
          <button onClick={next} className="mt-3 px-6 py-2.5 rounded-full font-bold text-white active:scale-95" style={{ backgroundImage: GBRAND }}>{t("lang.nextQuestion")}</button>
        </div>
      )}
    </div>
  );
}

function renderBody(body) {
  return body.split("\n").map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
    return <div key={i} style={{ minHeight: line ? undefined : 8 }}>{parts.map((p, j) => p.startsWith("**") && p.endsWith("**") ? <b key={j} style={{ color: C.ink }}>{p.slice(2, -2)}</b> : <span key={j}>{p}</span>)}</div>;
  });
}

function GrammarView({ lang }) {
  const [openTopic, setOpenTopic] = useState(null);
  const cats = GRAMMAR[lang] || [];
  if (!cats.length) return <Empty icon={GraduationCap} t={t("lang.noGrammarYet")} />;
  if (openTopic) {
    return (
      <div className="px-4 pb-10">
        <button onClick={() => setOpenTopic(null)} className="flex items-center gap-1.5 text-[13px] font-bold mb-3 active:scale-95" style={{ color: C.accent }}><ArrowLeft size={16} /> {t("lang.back")}</button>
        <div className="text-[18px] font-bold mb-2" style={{ color: C.ink, fontFamily: DISPLAY }}>{openTopic.title}</div>
        <div className="text-[14px] leading-relaxed whitespace-pre-line" style={{ color: C.ink2 }}>{renderBody(openTopic.body)}</div>
        {openTopic.ex && openTopic.ex.length > 0 && (
          <div className="mt-4 p-3.5 rounded-2xl" style={{ background: C.surfaceMuted }}>
            <div className="text-[12px] font-bold mb-1.5" style={{ color: C.muted }}>{t("lang.examples")}</div>
            {openTopic.ex.map((e, i) => <div key={i} className="text-[13.5px] mb-1" style={{ color: C.ink }}>• {e}</div>)}
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="px-4 pb-10 space-y-4">
      {cats.map((c, ci) => (
        <div key={ci}>
          <div className="flex items-center gap-2 mb-2"><span style={{ fontSize: 18 }}>{c.icon}</span><span className="text-[14px] font-bold" style={{ color: C.ink }}>{c.cat}</span></div>
          <div className="space-y-1.5">
            {c.topics.map((tp, ti) => (
              <button key={ti} onClick={() => setOpenTopic(tp)} className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left active:scale-[.99]" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
                <span className="text-[13.5px] font-semibold" style={{ color: C.ink }}>{tp.title}</span>
                <ChevronRight size={16} style={{ color: C.faint }} />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function LeaderboardView({ lang, board, loading, onOpenProfile }) {
  if (loading) return <div className="px-4 py-10 text-center text-[13px]" style={{ color: C.muted }}>{t("word.loading")}</div>;
  if (!board.length) return <Empty icon={Trophy} t={t("lang.leaderboardTitle")} s="—" />;
  return (
    <div className="px-4 pb-10 space-y-2">
      {board.map((row, i) => (
        <button key={row.user_id} onClick={() => onOpenProfile && onOpenProfile(row.user_id)} className="w-full flex items-center gap-3 p-3 rounded-2xl active:scale-[.99]" style={{ background: row.user_id === ME ? C.accentSoft : C.surface, border: `1px solid ${C.line}` }}>
          <span className="text-[14px] font-extrabold w-6 text-center" style={{ color: i < 3 ? C.star : C.muted, fontFamily: MONO }}>{i + 1}</span>
          <Avatar id={row.user_id} size={38} />
          <div className="flex-1 min-w-0 text-left"><Name id={row.user_id} className="text-[14px]" /></div>
          <div className="text-right shrink-0"><div className="text-[14px] font-bold" style={{ color: C.ink }}>{row.mastered}</div><div className="text-[10.5px]" style={{ color: C.faint }}>{t("lang.masteredWords")}</div></div>
        </button>
      ))}
    </div>
  );
}

export function LanguagesPage({
  learnLang, setLearnLang, level, setLevel, enabled, wordsReady,
  wordsForLevel, availableLevels, masteredCount, totalCount, dueCount,
  nextFlashcard, onFlashcardKnow, onFlashcardDontKnow,
  genExercise, onExerciseAnswer,
  board, boardLoading, loadBoard, onOpenProfile,
}) {
  const [view, setView] = useState("home");
  const [exerciseKind, setExerciseKind] = useState(null);

  useEffect(() => { if (view === "leaderboard" && learnLang) loadBoard(learnLang); }, [view, learnLang]);

  if (!enabled) return <div className="pt-5"><Title>{t("nav.languages")}</Title><Empty icon={LanguagesIcon} t={t("lang.disabled")} /></div>;
  if (learnLang && !wordsReady) return <div className="pt-5"><Title>{t("nav.languages")}</Title><div className="px-4 py-10 text-center text-[13px]" style={{ color: C.muted }}>{t("word.loading")}</div></div>;

  if (!learnLang || view === "home") {
    return (
      <div className="pb-28 md:pb-10">
        <div className="px-4 pt-5 pb-3"><Title>{t("nav.languages")}</Title></div>
        {!learnLang ? (
          <div className="px-4 space-y-2.5">
            <div className="text-[13.5px] mb-1" style={{ color: C.muted }}>{t("lang.pickLanguage")}</div>
            {LEARN_LANGS.map((l) => <LangCard key={l} lang={l} onClick={() => { setLearnLang(l); setView("dashboard"); }} />)}
          </div>
        ) : (
          <div className="px-4">
            <div className="flex items-center gap-3 p-4 rounded-2xl mb-4" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
              <span style={{ fontSize: 34 }}>{FLAG[learnLang]}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: DISPLAY }}>{t("langname." + learnLang)}</div>
                <div className="text-[12.5px]" style={{ color: C.muted }}>{masteredCount(learnLang)}/{totalCount(learnLang)} {t("lang.wordsMasteredOf")}</div>
              </div>
              <button onClick={() => setLearnLang(null)} className="text-[12.5px] font-bold shrink-0" style={{ color: C.accent }}>{t("lang.switchLanguage")}</button>
            </div>
            {dueCount() > 0 && <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-4" style={{ background: C.accentSoft }}><span style={{ fontSize: 16 }}>⏰</span><span className="text-[13px] font-bold" style={{ color: C.accentText }}>{dueCount()} {t("lang.dueForReview")}</span></div>}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-4">
              <button onClick={() => setLevel("all")} className="px-3.5 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap" style={level === "all" ? { backgroundImage: GBRAND, color: "#fff" } : { background: C.surfaceMuted, color: C.muted }}>{t("lang.allLevels")}</button>
              {availableLevels(learnLang).map((lvl) => <button key={lvl} onClick={() => setLevel(lvl)} className="px-3.5 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap" style={level === lvl ? { backgroundImage: GBRAND, color: "#fff" } : { background: C.surfaceMuted, color: C.muted }}>{lvl}</button>)}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ActionTile icon={BookOpen} label={t("lang.flashcards")} onClick={() => setView("flashcards")} />
              <ActionTile icon={CheckCircle2} label={t("lang.exercises")} onClick={() => { setExerciseKind(null); setView("exercises"); }} />
              <ActionTile icon={GraduationCap} label={t("lang.grammar")} onClick={() => setView("grammar")} />
              <ActionTile icon={Trophy} label={t("lang.leaderboardTitle")} onClick={() => setView("leaderboard")} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pb-28 md:pb-10">
      <SubHeader
        title={view === "flashcards" ? t("lang.flashcards") : view === "exercises" ? t("lang.exercises") : view === "grammar" ? t("lang.grammar") : t("lang.leaderboardTitle")}
        onBack={() => setView("home")}
      />
      {view === "flashcards" && <Flashcards lang={learnLang} level={level} nextFlashcard={nextFlashcard} onKnow={onFlashcardKnow} onDontKnow={onFlashcardDontKnow} />}
      {view === "exercises" && (exerciseKind
        ? <ExerciseRunner kind={exerciseKind} lang={learnLang} level={level} genExercise={genExercise} onAnswer={onExerciseAnswer} onExit={() => setExerciseKind(null)} />
        : <ExercisePicker onPick={setExerciseKind} />)}
      {view === "grammar" && <GrammarView lang={learnLang} />}
      {view === "leaderboard" && <LeaderboardView lang={learnLang} board={board} loading={boardLoading} onOpenProfile={onOpenProfile} />}
    </div>
  );
}
