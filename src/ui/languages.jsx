import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft, BookOpen, GraduationCap, Shuffle, Volume2, Headphones, CheckCircle2, XCircle, Trophy, Languages as LanguagesIcon, ChevronRight,
  Mic, Calendar, ListOrdered, MessagesSquare, List, BookmarkPlus, Plus, X, Trash2,
  C, SH, GBRAND, DISPLAY, MONO, Mono, Title, Empty, Avatar, Name, ME, t,
} from "./core";
import { WDB, wordLevels } from "../data/langWords";
import { GRAMMAR } from "../data/langGrammar";
import { DIALOGUES } from "../data/langDialogues";
import { speakWord, LANG_CODE } from "../hooks/useLanguages";

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

function AddToListButton({ word, wordLists, listItems, onAddToList, onRemoveFromList }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-bold active:scale-95" style={{ background: C.surfaceMuted, color: C.ink2 }}><BookmarkPlus size={15} /> {t("lang.addToList")}</button>
      {open && (
        <div className="absolute z-10 mt-2 left-1/2 -translate-x-1/2 w-56 p-2 rounded-2xl text-left" style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SH.card }}>
          {wordLists.length ? wordLists.map((l) => {
            const inList = (listItems[l.id] || []).includes(word.id);
            return (
              <button key={l.id} onClick={() => inList ? onRemoveFromList(l.id, word.id) : onAddToList(l.id, word.id)} className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-[13px]" style={{ color: C.ink }}>
                <span>{l.name}</span>{inList && <CheckCircle2 size={14} style={{ color: C.online }} />}
              </button>
            );
          }) : <div className="px-2.5 py-2 text-[12.5px]" style={{ color: C.muted }}>{t("lang.noListsYet")}</div>}
        </div>
      )}
    </div>
  );
}

function Flashcards({ lang, level, nextFlashcard, onKnow, onDontKnow, wordLists, listItems, onAddToList, onRemoveFromList }) {
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
      <div className="flex items-center justify-center gap-2 mt-3">
        <button onClick={() => speakWord(word.w, lang)} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-bold active:scale-95" style={{ background: C.accentSoft, color: C.accentText }}><Volume2 size={15} /> {t("lang.playAudio")}</button>
        {wordLists && <AddToListButton word={word} wordLists={wordLists} listItems={listItems} onAddToList={onAddToList} onRemoveFromList={onRemoveFromList} />}
      </div>
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
  ["order", "lang.exerciseOrder", ListOrdered],
  ["speak", "lang.exerciseSpeak", Mic],
];

function hasSpeechRecognition() {
  return typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function SpeakChallenge({ word, lang, disabled, onResult }) {
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const recRef = useRef(null);

  const start = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || disabled) return;
    const rec = new SR();
    rec.lang = LANG_CODE[lang] || "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript.trim();
      setHeard(transcript);
      const target = word.w.toLowerCase().trim();
      const said = transcript.toLowerCase().trim();
      onResult(said === target || said.includes(target) || target.includes(said));
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setHeard(""); setListening(true);
    rec.start();
  };

  if (!hasSpeechRecognition()) return <div className="text-center text-[13px] py-2" style={{ color: C.muted }}>{t("lang.speechNotSupported")}</div>;
  return (
    <div className="text-center">
      <button onClick={start} disabled={disabled || listening} className="mx-auto flex items-center gap-2 px-5 py-3 rounded-full font-bold text-white active:scale-95" style={{ backgroundImage: GBRAND, boxShadow: SH.glow, opacity: (disabled || listening) ? 0.7 : 1 }}>
        <Mic size={18} /> {listening ? t("lang.listening") : t("lang.tapToSpeak")}
      </button>
      {heard && <div className="mt-3 text-[13.5px]" style={{ color: C.ink2 }}>{t("lang.youSaid")}: "{heard}"</div>}
    </div>
  );
}

function OrderBuilder({ tokens, disabled, onSubmit }) {
  const [pool, setPool] = useState(tokens);
  const [chosen, setChosen] = useState([]);
  useEffect(() => { setPool(tokens); setChosen([]); }, [tokens]);

  const pick = (i) => { if (disabled) return; setChosen((c) => [...c, pool[i]]); setPool((p) => p.filter((_, idx) => idx !== i)); };
  const unpick = (i) => { if (disabled) return; setPool((p) => [...p, chosen[i]]); setChosen((c) => c.filter((_, idx) => idx !== i)); };

  return (
    <div>
      <div className="flex flex-wrap gap-2 min-h-[46px] mb-3 p-2.5 rounded-xl" style={{ background: C.surfaceMuted, border: `1px dashed ${C.line}` }}>
        {chosen.map((w, i) => <button key={i} onClick={() => unpick(i)} disabled={disabled} className="px-3 py-1.5 rounded-lg text-[14px] font-semibold active:scale-95" style={{ background: C.accentSoft, color: C.accentText }}>{w}</button>)}
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {pool.map((w, i) => <button key={i} onClick={() => pick(i)} disabled={disabled} className="px-3 py-1.5 rounded-lg text-[14px] font-semibold active:scale-95" style={{ background: C.surface, border: `1px solid ${C.line}`, color: C.ink }}>{w}</button>)}
      </div>
      {!disabled && <button onClick={() => onSubmit(chosen)} disabled={pool.length > 0} className="w-full py-3 rounded-2xl font-bold text-white active:scale-[.98]" style={{ backgroundImage: GBRAND, opacity: pool.length > 0 ? 0.5 : 1 }}>{t("lang.checkAnswer")}</button>}
    </div>
  );
}

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
  const settleResult = (ok) => { setResult(ok); setTotal((n) => n + 1); if (ok) setScore((s) => s + 1); onAnswer(lang, q.word, ok, kind); };
  const checkOrder = (chosen) => { if (!q || result !== null) return; settleResult(chosen.join(" ") === q.correctOrder.join(" ")); };

  if (!q) return <Empty icon={CheckCircle2} t={t("lang.allCardsMastered")} />;
  const revealText = kind === "listenSentence" ? q.word.ext : kind === "order" ? q.correctOrder.join(" ") : q.word.w;
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
        {kind === "order" && (<><div className="text-[13px] mb-1" style={{ color: C.muted }}>{t("lang.orderPrompt")}</div><div className="text-[18px] font-bold" style={{ color: C.ink, fontFamily: DISPLAY }}>{q.word.ext}</div></>)}
        {kind === "speak" && (<><div className="text-[14px]" style={{ color: C.muted }}>{q.word.t}</div><div className="text-[24px] font-extrabold mt-1.5" style={{ color: C.ink, fontFamily: DISPLAY }}>{q.word.w}</div></>)}
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
      ) : kind === "order" ? (
        <OrderBuilder key={q.tokens.join("|")} tokens={q.tokens} disabled={result !== null} onSubmit={checkOrder} />
      ) : kind === "speak" ? (
        <SpeakChallenge word={q.word} lang={lang} disabled={result !== null} onResult={settleResult} />
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
          {(kind === "listenSentence" || kind === "order") && <div className="text-[13.5px] italic mb-2" style={{ color: C.ink2 }}>"{q.word.ex}"</div>}
          <div className="text-[15px] font-bold" style={{ color: result ? C.online : C.like }}>{result ? t("lang.correctAnswer") : t("lang.incorrectAnswer") + " — " + revealText}</div>
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

// "which topic does this example sentence demonstrate?" — reuses the
// curated example sentences that already ship with every grammar topic
// instead of needing hand-authored quiz content of its own.
function flattenGrammarTopics(lang) {
  return (GRAMMAR[lang] || []).flatMap((c) => c.topics.filter((tp) => tp.ex && tp.ex.length));
}

function GrammarQuiz({ lang, onExit, recordPractice }) {
  const topics = flattenGrammarTopics(lang);
  const pick = () => {
    if (topics.length < 4) return null;
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const correct = topic.ex[Math.floor(Math.random() * topic.ex.length)];
    const wrongPool = topics.filter((tp) => tp.title !== topic.title).flatMap((tp) => tp.ex);
    const wrong = wrongPool.slice().sort(() => Math.random() - 0.5).slice(0, 3);
    return { topic, correct, options: [correct, ...wrong].sort(() => Math.random() - 0.5) };
  };
  const [q, setQ] = useState(pick);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);

  const choose = (opt) => {
    if (picked !== null) return;
    setPicked(opt);
    const ok = opt === q.correct;
    setTotal((n) => n + 1); if (ok) setScore((s) => s + 1);
    recordPractice(ok ? 15 : 0);
  };
  const next = () => { setPicked(null); setQ(pick()); };

  if (!q) return <Empty icon={GraduationCap} t={t("lang.notEnoughGrammar")} />;
  return (
    <div className="px-4 pb-10">
      <div className="flex items-center justify-between mb-3">
        <button onClick={onExit} className="text-[13px] font-bold" style={{ color: C.muted }}>{t("lang.exit")}</button>
        <Mono style={{ fontSize: 13, color: C.ink2 }}>{t("lang.score")}: {score}/{total}</Mono>
      </div>
      <div className="rounded-3xl p-5 text-center mb-4" style={{ background: `linear-gradient(135deg, ${C.surface}, ${C.surfaceMuted})`, border: `1px solid ${C.line}` }}>
        <div className="text-[12px] mb-1" style={{ color: C.muted }}>{t("lang.grammarQuizPrompt")}</div>
        <div className="text-[18px] font-bold" style={{ color: C.ink, fontFamily: DISPLAY }}>{q.topic.title}</div>
      </div>
      <div className="space-y-2">
        {q.options.map((opt, i) => {
          const isCorrect = opt === q.correct;
          const isPicked = picked === opt;
          return <button key={i} onClick={() => choose(opt)} disabled={picked !== null}
            className="w-full text-left px-4 py-3.5 rounded-2xl text-[14.5px] font-semibold transition"
            style={picked !== null && isCorrect ? { background: C.online + "22", border: `1px solid ${C.online}66`, color: C.online } : (isPicked ? { background: C.like + "22", border: `1px solid ${C.like}66`, color: C.like } : { background: C.surfaceMuted, border: `1px solid ${C.line}`, color: C.ink })}>{opt}</button>;
        })}
      </div>
      {picked !== null && (
        <div className="mt-4 text-center">
          <div className="text-[15px] font-bold" style={{ color: picked === q.correct ? C.online : C.like }}>{picked === q.correct ? t("lang.correctAnswer") : t("lang.incorrectAnswer")}</div>
          <button onClick={next} className="mt-3 px-6 py-2.5 rounded-full font-bold text-white active:scale-95" style={{ backgroundImage: GBRAND }}>{t("lang.nextQuestion")}</button>
        </div>
      )}
    </div>
  );
}

function GrammarView({ lang, recordPractice }) {
  const [openTopic, setOpenTopic] = useState(null);
  const [quiz, setQuiz] = useState(false);
  const cats = GRAMMAR[lang] || [];
  if (!cats.length) return <Empty icon={GraduationCap} t={t("lang.noGrammarYet")} />;
  if (quiz) return <GrammarQuiz lang={lang} onExit={() => setQuiz(false)} recordPractice={recordPractice} />;
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
      <button onClick={() => setQuiz(true)} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-white active:scale-[.98]" style={{ backgroundImage: GBRAND, boxShadow: SH.glow }}><CheckCircle2 size={18} /> {t("lang.grammarPractice")}</button>
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

function LeaderboardView({ lang, board, loading, friendBoard, friendBoardLoading, loadFriendBoard, onOpenProfile }) {
  const [mode, setMode] = useState("all");
  useEffect(() => { if (mode === "friends" && lang) loadFriendBoard(lang); }, [mode, lang]);

  const rows = mode === "friends" ? friendBoard : board;
  const isLoading = mode === "friends" ? friendBoardLoading : loading;
  return (
    <div className="px-4 pb-10">
      <div className="flex gap-1.5 mb-3">
        <button onClick={() => setMode("all")} className="px-3.5 py-1.5 rounded-full text-[13px] font-semibold" style={mode === "all" ? { backgroundImage: GBRAND, color: "#fff" } : { background: C.surfaceMuted, color: C.muted }}>{t("lang.boardAll")}</button>
        <button onClick={() => setMode("friends")} className="px-3.5 py-1.5 rounded-full text-[13px] font-semibold" style={mode === "friends" ? { backgroundImage: GBRAND, color: "#fff" } : { background: C.surfaceMuted, color: C.muted }}>{t("lang.boardFriends")}</button>
      </div>
      {isLoading ? (
        <div className="px-4 py-10 text-center text-[13px]" style={{ color: C.muted }}>{t("word.loading")}</div>
      ) : !rows.length ? (
        <Empty icon={Trophy} t={t("lang.leaderboardTitle")} s="—" />
      ) : (
        <div className="space-y-2">
          {rows.map((row, i) => (
            <button key={row.user_id} onClick={() => onOpenProfile && onOpenProfile(row.user_id)} className="w-full flex items-center gap-3 p-3 rounded-2xl active:scale-[.99]" style={{ background: row.user_id === ME ? C.accentSoft : C.surface, border: `1px solid ${C.line}` }}>
              <span className="text-[14px] font-extrabold w-6 text-center" style={{ color: i < 3 ? C.star : C.muted, fontFamily: MONO }}>{i + 1}</span>
              <Avatar id={row.user_id} size={38} />
              <div className="flex-1 min-w-0 text-left"><Name id={row.user_id} className="text-[14px]" /></div>
              <div className="text-right shrink-0"><div className="text-[14px] font-bold" style={{ color: C.ink }}>{row.mastered}</div><div className="text-[10.5px]" style={{ color: C.faint }}>{t("lang.masteredWords")}</div></div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DialoguesView({ lang, recordPractice }) {
  const [active, setActive] = useState(null);
  const dialogues = DIALOGUES[lang] || [];
  if (active) return <DialoguePlayer dialogue={active} lang={lang} onExit={() => setActive(null)} recordPractice={recordPractice} />;
  if (!dialogues.length) return <Empty icon={MessagesSquare} t={t("lang.noDialoguesYet")} />;
  return (
    <div className="px-4 pb-10 space-y-2.5">
      {dialogues.map((d) => (
        <button key={d.id} onClick={() => setActive(d)} className="w-full flex items-center gap-3 p-4 rounded-2xl active:scale-[.98]" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
          <span style={{ fontSize: 26 }}>{d.icon}</span>
          <div className="flex-1 text-left"><div className="text-[15px] font-bold" style={{ color: C.ink }}>{d.title}</div><div className="text-[12px]" style={{ color: C.muted }}>{d.lines.length} {t("lang.dialogueLines")}</div></div>
          <ChevronRight size={18} style={{ color: C.faint }} />
        </button>
      ))}
    </div>
  );
}

function DialoguePlayer({ dialogue, lang, onExit, recordPractice }) {
  const buildOptions = (idx) => {
    const correct = dialogue.lines[idx].t;
    const wrongPool = dialogue.lines.filter((_, j) => j !== idx).map((l) => l.t);
    const wrong = wrongPool.slice().sort(() => Math.random() - 0.5).slice(0, 2);
    return [correct, ...wrong].sort(() => Math.random() - 0.5);
  };
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [options, setOptions] = useState(() => buildOptions(0));
  const line = dialogue.lines[i];

  const choose = (opt) => {
    if (picked !== null) return;
    setPicked(opt);
    recordPractice(opt === line.t ? 10 : 0);
  };
  const next = () => {
    if (i + 1 >= dialogue.lines.length) { onExit(); return; }
    const ni = i + 1;
    setI(ni); setPicked(null); setOptions(buildOptions(ni));
  };

  return (
    <div className="px-4 pb-10">
      <div className="flex items-center justify-between mb-3">
        <button onClick={onExit} className="text-[13px] font-bold" style={{ color: C.muted }}>{t("lang.exit")}</button>
        <Mono style={{ fontSize: 13, color: C.ink2 }}>{i + 1}/{dialogue.lines.length}</Mono>
      </div>
      <div className="rounded-3xl p-6 text-center mb-4" style={{ background: `linear-gradient(135deg, ${C.surface}, ${C.surfaceMuted})`, border: `1px solid ${C.line}` }}>
        <div className="text-[12px] mb-2" style={{ color: C.muted }}>{t("lang.speaker")} {line.s}</div>
        <button onClick={() => speakWord(line.x, lang)} className="mx-auto flex items-center gap-2 px-5 py-3 rounded-full font-bold text-white active:scale-95" style={{ backgroundImage: GBRAND, boxShadow: SH.glow }}><Volume2 size={18} /> {t("lang.playAudio")}</button>
        {picked !== null && <div className="text-[15px] mt-3 italic" style={{ color: C.ink }}>"{line.x}"</div>}
      </div>
      <div className="space-y-2">
        {options.map((opt, oi) => {
          const isCorrect = opt === line.t;
          const isPicked = picked === opt;
          return <button key={oi} onClick={() => choose(opt)} disabled={picked !== null}
            className="w-full text-left px-4 py-3.5 rounded-2xl text-[14.5px] font-semibold transition"
            style={picked !== null && isCorrect ? { background: C.online + "22", border: `1px solid ${C.online}66`, color: C.online } : (isPicked ? { background: C.like + "22", border: `1px solid ${C.like}66`, color: C.like } : { background: C.surfaceMuted, border: `1px solid ${C.line}`, color: C.ink })}>{opt}</button>;
        })}
      </div>
      {picked !== null && <button onClick={next} className="w-full mt-4 py-3.5 rounded-2xl font-bold text-white active:scale-[.98]" style={{ backgroundImage: GBRAND }}>{i + 1 >= dialogue.lines.length ? t("lang.finish") : t("lang.nextQuestion")}</button>}
    </div>
  );
}

function CollectionsView({ lang, wordLists, listItems, onCreateList, onDeleteList, onRemoveFromList, wordsForLevel, onPractice }) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [openList, setOpenList] = useState(null);
  const words = wordsForLevel(lang, "all");
  const wordById = (id) => words.find((w) => w.id === id);

  if (openList) {
    const ids = listItems[openList.id] || [];
    return (
      <div className="px-4 pb-10">
        <button onClick={() => setOpenList(null)} className="flex items-center gap-1.5 text-[13px] font-bold mb-3 active:scale-95" style={{ color: C.accent }}><ArrowLeft size={16} /> {t("lang.back")}</button>
        <div className="text-[18px] font-bold mb-1" style={{ color: C.ink, fontFamily: DISPLAY }}>{openList.name}</div>
        <div className="text-[12.5px] mb-4" style={{ color: C.muted }}>{ids.length} {t("lang.listWords")}</div>
        {ids.length > 0 && <button onClick={() => onPractice(openList.id)} className="w-full mb-4 py-3 rounded-2xl font-bold text-white active:scale-[.98]" style={{ backgroundImage: GBRAND, boxShadow: SH.glow }}>{t("lang.practiceList")}</button>}
        <div className="space-y-2">
          {ids.map((id) => {
            const w = wordById(id);
            if (!w) return null;
            return (
              <div key={id} className="flex items-center justify-between p-3 rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
                <div><div className="text-[14.5px] font-bold" style={{ color: C.ink }}>{w.w}</div><div className="text-[12.5px]" style={{ color: C.muted }}>{w.t}</div></div>
                <button onClick={() => onRemoveFromList(openList.id, id)} aria-label={t("a11y.remove")} className="active:scale-90"><X size={16} style={{ color: C.faint }} /></button>
              </div>
            );
          })}
          {!ids.length && <Empty icon={List} t={t("lang.emptyList")} />}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-10">
      {!creating ? (
        <button onClick={() => setCreating(true)} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold mb-4 active:scale-[.98]" style={{ background: C.accentSoft, color: C.accentText }}><Plus size={18} /> {t("lang.newList")}</button>
      ) : (
        <div className="flex gap-2 mb-4">
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={t("lang.listNamePh")} className="flex-1 px-3.5 py-2.5 rounded-xl text-[14px] outline-none" style={{ background: C.surfaceMuted, color: C.ink }} />
          <button onClick={() => { if (name.trim()) { onCreateList(name.trim()); setName(""); setCreating(false); } }} className="px-4 py-2.5 rounded-xl font-bold text-white text-[13.5px]" style={{ backgroundImage: GBRAND }}>{t("action.done")}</button>
        </div>
      )}
      <div className="space-y-2">
        {wordLists.map((l) => (
          <div key={l.id} className="flex items-center gap-3 p-3.5 rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
            <button onClick={() => setOpenList(l)} className="flex-1 text-left"><div className="text-[14.5px] font-bold" style={{ color: C.ink }}>{l.name}</div><div className="text-[12px]" style={{ color: C.muted }}>{(listItems[l.id] || []).length} {t("lang.listWords")}</div></button>
            <button onClick={() => onDeleteList(l.id)} aria-label={t("a11y.delete")} className="active:scale-90"><Trash2 size={16} style={{ color: C.faint }} /></button>
          </div>
        ))}
        {!wordLists.length && <Empty icon={List} t={t("lang.noListsYet")} />}
      </div>
    </div>
  );
}

function HistoryView({ progress }) {
  const now = new Date();
  const days = Array.from({ length: 14 }, (_, k) => { const d = new Date(now); d.setDate(d.getDate() - (13 - k)); return d.toISOString().slice(0, 10); });
  const counts = Object.fromEntries(days.map((d) => [d, 0]));
  Object.values(progress).forEach((p) => { const day = new Date(p.ts).toISOString().slice(0, 10); if (counts[day] !== undefined) counts[day]++; });
  const max = Math.max(1, ...Object.values(counts));
  if (!Object.values(counts).some((c) => c > 0)) return <Empty icon={Calendar} t={t("lang.noHistoryYet")} />;
  return (
    <div className="px-4 pb-10">
      <div className="flex items-end gap-1.5 h-40 mb-2">
        {days.map((d) => {
          const c = counts[d];
          const h = Math.max(4, (c / max) * 140);
          return <div key={d} title={`${d}: ${c}`} className="flex-1 rounded-t-md" style={{ height: h, background: c ? GBRAND : C.surfaceMuted }} />;
        })}
      </div>
      <div className="flex justify-between text-[10px]" style={{ color: C.faint }}>
        <span>{days[0].slice(5)}</span><span>{days[days.length - 1].slice(5)}</span>
      </div>
    </div>
  );
}

export function LanguagesPage({
  learnLang, setLearnLang, level, setLevel, enabled, wordsReady, progress,
  wordsForLevel, availableLevels, masteredCount, totalCount, dueCount,
  nextFlashcard, onFlashcardKnow, onFlashcardDontKnow,
  genExercise, onExerciseAnswer, recordPractice,
  board, boardLoading, loadBoard, friendBoard, friendBoardLoading, loadFriendBoard, onOpenProfile,
  streak, dailyGoal, setDailyGoal, todayXp,
  wordLists, listItems, onCreateList, onDeleteList, onAddToList, onRemoveFromList,
}) {
  const [view, setView] = useState("home");
  const [exerciseKind, setExerciseKind] = useState(null);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(dailyGoal));

  useEffect(() => { if (view === "leaderboard" && learnLang) loadBoard(learnLang); }, [view, learnLang]);

  const practiceList = (listId) => { setLevel("list:" + listId); setView("flashcards"); };

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
            {dueCount() > 0 && <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-3" style={{ background: C.accentSoft }}><span style={{ fontSize: 16 }}>⏰</span><span className="text-[13px] font-bold" style={{ color: C.accentText }}>{dueCount()} {t("lang.dueForReview")}</span></div>}
            {streak.current > 0 && <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-3" style={{ background: C.accentSoft }}><span style={{ fontSize: 16 }}>🔥</span><span className="text-[13px] font-bold" style={{ color: C.accentText }}>{streak.current} {t("lang.streakLabel")}</span></div>}
            <div className="p-4 rounded-2xl mb-4" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-bold" style={{ color: C.ink }}>🎯 {t("lang.dailyGoal")}</span>
                {!editingGoal ? (
                  <button onClick={() => { setGoalInput(String(dailyGoal)); setEditingGoal(true); }} className="text-[12px] font-bold" style={{ color: C.accent }}>{t("action.edit")}</button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <input value={goalInput} onChange={(e) => setGoalInput(e.target.value.replace(/\D/g, ""))} className="w-14 px-2 py-1 rounded-lg text-[13px] text-center outline-none" style={{ background: C.surfaceMuted, color: C.ink }} />
                    <button onClick={() => { const n = Math.max(5, Number(goalInput) || 20); setDailyGoal(n); setEditingGoal(false); }} className="text-[12px] font-bold" style={{ color: C.accent }}>{t("action.done")}</button>
                  </div>
                )}
              </div>
              <div className="text-[12px] mb-1.5" style={{ color: C.muted }}>{todayXp}/{dailyGoal} XP</div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: C.surfaceMuted }}>
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, (todayXp / dailyGoal) * 100)}%`, backgroundImage: GBRAND }} />
              </div>
            </div>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-4">
              <button onClick={() => setLevel("all")} className="px-3.5 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap" style={level === "all" ? { backgroundImage: GBRAND, color: "#fff" } : { background: C.surfaceMuted, color: C.muted }}>{t("lang.allLevels")}</button>
              {availableLevels(learnLang).map((lvl) => <button key={lvl} onClick={() => setLevel(lvl)} className="px-3.5 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap" style={level === lvl ? { backgroundImage: GBRAND, color: "#fff" } : { background: C.surfaceMuted, color: C.muted }}>{lvl}</button>)}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ActionTile icon={BookOpen} label={t("lang.flashcards")} onClick={() => setView("flashcards")} />
              <ActionTile icon={CheckCircle2} label={t("lang.exercises")} onClick={() => { setExerciseKind(null); setView("exercises"); }} />
              <ActionTile icon={GraduationCap} label={t("lang.grammar")} onClick={() => setView("grammar")} />
              <ActionTile icon={Trophy} label={t("lang.leaderboardTitle")} onClick={() => setView("leaderboard")} />
              <ActionTile icon={MessagesSquare} label={t("lang.dialogues")} onClick={() => setView("dialogues")} />
              <ActionTile icon={List} label={t("lang.collections")} onClick={() => setView("collections")} />
              <ActionTile icon={Calendar} label={t("lang.history")} onClick={() => setView("history")} />
            </div>
          </div>
        )}
      </div>
    );
  }

  const VIEW_TITLE = { flashcards: t("lang.flashcards"), exercises: t("lang.exercises"), grammar: t("lang.grammar"), leaderboard: t("lang.leaderboardTitle"), dialogues: t("lang.dialogues"), collections: t("lang.collections"), history: t("lang.history") };
  return (
    <div className="pb-28 md:pb-10">
      <SubHeader title={VIEW_TITLE[view]} onBack={() => setView("home")} />
      {view === "flashcards" && <Flashcards lang={learnLang} level={level} nextFlashcard={nextFlashcard} onKnow={onFlashcardKnow} onDontKnow={onFlashcardDontKnow} wordLists={wordLists} listItems={listItems} onAddToList={onAddToList} onRemoveFromList={onRemoveFromList} />}
      {view === "exercises" && (exerciseKind
        ? <ExerciseRunner kind={exerciseKind} lang={learnLang} level={level} genExercise={genExercise} onAnswer={onExerciseAnswer} onExit={() => setExerciseKind(null)} />
        : <ExercisePicker onPick={setExerciseKind} />)}
      {view === "grammar" && <GrammarView lang={learnLang} recordPractice={recordPractice} />}
      {view === "leaderboard" && <LeaderboardView lang={learnLang} board={board} loading={boardLoading} friendBoard={friendBoard} friendBoardLoading={friendBoardLoading} loadFriendBoard={loadFriendBoard} onOpenProfile={onOpenProfile} />}
      {view === "dialogues" && <DialoguesView lang={learnLang} recordPractice={recordPractice} />}
      {view === "collections" && <CollectionsView lang={learnLang} wordLists={wordLists} listItems={listItems} onCreateList={onCreateList} onDeleteList={onDeleteList} onRemoveFromList={onRemoveFromList} wordsForLevel={wordsForLevel} onPractice={practiceList} />}
      {view === "history" && <HistoryView progress={progress} />}
    </div>
  );
}
