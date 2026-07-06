// Framework-free runtime smoke tests for the admin panel's "system check"
// page — deliberately separate from the Vitest suite (src/**/*.test.js*),
// which never ships to production. These re-verify the same handful of
// pure-logic invariants directly against the live bundle so an admin can
// confirm core behavior without a terminal. ME/LANG are module-level
// mutable state shared with the real running session, so every check that
// touches them restores the original value in a finally block.
import { newGame, allLegalMoves, makeMove, inCheck } from "./chess";
import { evaluate, botAcceptsDraw, botMove } from "./chessBot";
import { t, setLang, LANG, DICT, LANGS } from "./i18n";
import { haversineKm } from "./geo";
import { mapDbMsg, toDbMsg, mapDbPost, mapDbGroup, mapDbEvent, convIsGroup, convMembers, fmtN, kfmt, setME, ME } from "../ui/core";

function check(name, fn) {
  try {
    return { name, pass: !!fn() };
  } catch (e) {
    return { name, pass: false, error: e && e.message ? e.message : String(e) };
  }
}

export function runSelfChecks() {
  const results = [];

  results.push(check("ჭადრაკი: საწყისი პოზიცია მასალით დაბალანსებულია", () => evaluate(newGame()) === 0));
  results.push(check("ჭადრაკი: თეთრს აქვს ზუსტად 20 სვლა გახსნაში", () => allLegalMoves(newGame(), "w").length === 20));
  results.push(check("ჭადრაკი: e2-e4 სვლა სწორად აყენებს en-passant კვადრატს", () => {
    const g = makeMove(newGame(), { r: 6, c: 4 }, { r: 4, c: 4 });
    return !!g.ep && g.ep.r === 5 && g.ep.c === 4;
  }));
  results.push(check("ჭადრაკი: არალეგალური სვლა უცვლელად ტოვებს მდგომარეობას", () => {
    const g = newGame();
    return makeMove(g, { r: 6, c: 4 }, { r: 3, c: 4 }) === g;
  }));
  results.push(check("ჭადრაკი: Fool's mate სწორად აღმოჩნდება მატად", () => {
    let g = newGame();
    g = makeMove(g, { r: 6, c: 5 }, { r: 5, c: 5 });
    g = makeMove(g, { r: 1, c: 4 }, { r: 3, c: 4 });
    g = makeMove(g, { r: 6, c: 6 }, { r: 4, c: 6 });
    g = makeMove(g, { r: 0, c: 3 }, { r: 4, c: 7 });
    return inCheck(g, "w") && g.status === "checkmate" && allLegalMoves(g, "w").length === 0;
  }));

  results.push(check("ჭადრაკის ბოტი: უარყოფს ფრედს დაბალანსებულ პოზიციაზე", () => botAcceptsDraw(newGame(), "w") === false));
  results.push(check("ჭადრაკის ბოტი: ეთანხმება ფრედს დედოფლის დაკარგვისას", () => {
    const board = Array.from({ length: 8 }, () => Array(8).fill(null));
    board[7][4] = "wK"; board[0][4] = "bK"; board[0][3] = "bQ";
    return botAcceptsDraw({ board }, "w") === true && botAcceptsDraw({ board }, "b") === false;
  }));
  results.push(check("ჭადრაკის ბოტი: ყოველთვის აბრუნებს ლეგალურ სვლას", () => {
    const g = newGame();
    const mv = botMove(g, "w", "hard");
    const legal = allLegalMoves(g, "w");
    return !!mv && legal.some((m) => m.from.r === mv.from.r && m.from.c === mv.from.c && m.to.r === mv.to.r && m.to.c === mv.to.c);
  }));

  results.push(check("i18n: ლექსიკონის ყველა key-ს აქვს ka/en/ru თარგმანი", () => {
    const langs = LANGS.map(([k]) => k);
    return Object.values(DICT).every((row) => langs.every((l) => l in row));
  }));
  results.push(check("i18n: t() სწორად ცვლის და აბრუნებს ენას", () => {
    const before = LANG;
    try {
      setLang("en");
      const enOk = t("nav.home") === "Home";
      setLang("ru");
      const ruOk = t("nav.home") === "Главная";
      return enOk && ruOk;
    } finally {
      setLang(before);
    }
  }));

  results.push(check("გეო: haversineKm გონივრულ მანძილს იძლევა თბილისი-ბათუმს შორის", () => {
    const d = haversineKm([41.7151, 44.8271], [41.6168, 41.6367]);
    return d > 200 && d < 300;
  }));

  results.push(check("ჩათი: mapDbMsg სწორად ავრცობს ჩემს/სხვის შეტყობინებას", () => {
    const before = ME;
    try {
      setME("__selfcheck_me__");
      const mine = mapDbMsg({ id: "1", sender_id: "__selfcheck_me__", created_at: new Date().toISOString(), type: "text", text: "hi" });
      const theirs = mapDbMsg({ id: "2", sender_id: "__selfcheck_other__", created_at: new Date().toISOString(), type: "text", text: "hi" });
      return mine.fromMe === true && theirs.fromMe === false && theirs.from === "__selfcheck_other__";
    } finally {
      setME(before);
    }
  }));
  results.push(check("ჩათი: toDbMsg სურათის caption-ს ინახავს", () => {
    const payload = toDbMsg({ type: "image", image: "https://x/img.jpg", caption: "caption" });
    return payload.media_url === "https://x/img.jpg" && payload.text === "caption";
  }));
  results.push(check("პოსტები: mapDbPost სწორად ითვლის poll-ხმებს", () => {
    const before = ME;
    try {
      setME("__selfcheck_me__");
      const row = { id: "p1", author_id: "a", created_at: new Date().toISOString(), has_poll: true, poll_options: [{ idx: 0, text: "A" }, { idx: 1, text: "B" }], poll_votes: [{ option_idx: 0, user_id: "__selfcheck_me__" }, { option_idx: 1, user_id: "u2" }] };
      const poll = mapDbPost(row).poll;
      return poll.options[0].votes === 1 && poll.options[1].votes === 1 && poll.voted === 0;
    } finally {
      setME(before);
    }
  }));
  results.push(check("ჯგუფები: mapDbGroup სწორად ადგენს წევრობის სტატუსს", () => {
    const g = mapDbGroup({ id: "g1", name: "x", created_by: "owner", group_members: [{ user_id: "me", status: "approved" }, { user_id: "p", status: "pending" }] }, "me");
    return g.joined === true && g.members === 1 && g.pendingCount === 1;
  }));
  results.push(check("ივენთები: mapDbEvent სწორად პოულობს ჩემს RSVP-ს", () => {
    const ev = mapDbEvent({ id: "e1", title: "x", event_rsvps: [{ user_id: "me", status: "going" }] }, "me");
    return ev.rsvp === "going" && ev.going === 1;
  }));
  results.push(check("ჩათი: convIsGroup/convMembers სწორად მუშაობს", () => convIsGroup({ members: ["a", "b"] }) === true && convMembers({ members: ["a"] }).length === 1));
  results.push(check("ფორმატირება: fmtN/kfmt სწორად ამოკლებენ რიცხვებს", () => fmtN(1200) === "1.2ათ" && kfmt(1500) === "1.5k"));

  return results;
}
