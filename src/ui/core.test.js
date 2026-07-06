import { describe, it, expect, beforeEach } from "vitest";
import {
  mapDbMsg, toDbMsg, setME,
  fmtN, kfmt, timeAgo, catColor, hashIdx, levelInfo, waveOf, msgPreview,
  convMembers, convIsGroup, computeTrends, C,
} from "./core";

describe("mapDbMsg / toDbMsg", () => {
  beforeEach(() => setME("me-1"));

  it("marks a message from the current user as fromMe and omits `from`", () => {
    const row = { id: "1", sender_id: "me-1", created_at: "2026-01-01T10:00:00Z", type: "text", text: "გამარჯობა", reply_to: null, edited: false };
    const m = mapDbMsg(row);
    expect(m.fromMe).toBe(true);
    expect(m.from).toBeUndefined();
    expect(m.text).toBe("გამარჯობა");
  });

  it("marks a message from someone else as not fromMe and keeps `from`", () => {
    const row = { id: "2", sender_id: "them-2", created_at: "2026-01-01T10:00:00Z", type: "text", text: "hi" };
    const m = mapDbMsg(row);
    expect(m.fromMe).toBe(false);
    expect(m.from).toBe("them-2");
  });

  it("maps an image message and carries an optional caption", () => {
    const row = { id: "3", sender_id: "me-1", created_at: "2026-01-01T10:00:00Z", type: "image", media_url: "https://x/img.jpg", text: "საღამო მშვენიერია" };
    const m = mapDbMsg(row);
    expect(m.image).toBe("https://x/img.jpg");
    expect(m.caption).toBe("საღამო მშვენიერია");
  });

  it("omits caption when the image message has no text", () => {
    const row = { id: "4", sender_id: "me-1", created_at: "2026-01-01T10:00:00Z", type: "image", media_url: "https://x/img.jpg", text: "" };
    const m = mapDbMsg(row);
    expect(m.caption).toBeUndefined();
  });

  it("round-trips an image+caption message through toDbMsg", () => {
    const payload = toDbMsg({ type: "image", image: "https://x/img.jpg", caption: "წარწერა" });
    expect(payload).toEqual({ type: "image", media_url: "https://x/img.jpg", text: "წარწერა" });
  });

  it("round-trips a plain text message through toDbMsg, carrying reply_to", () => {
    const payload = toDbMsg({ type: "text", text: "პასუხი", reply_to: "1" });
    expect(payload).toEqual({ type: "text", text: "პასუხი", reply_to: "1" });
  });

  it("maps a voice message's duration and audio url", () => {
    const row = { id: "5", sender_id: "them-2", created_at: "2026-01-01T10:00:00Z", type: "voice", voice_dur: 12, media_url: "https://x/a.ogg" };
    const m = mapDbMsg(row);
    expect(m.dur).toBe(12);
    expect(m.audioUrl).toBe("https://x/a.ogg");
  });
});

describe("fmtN", () => {
  it("leaves small numbers as-is", () => {
    expect(fmtN(0)).toBe("0");
    expect(fmtN(500)).toBe("500");
    expect(fmtN(undefined)).toBe("0");
  });

  it("abbreviates thousands with the Georgian ათ suffix", () => {
    expect(fmtN(1000)).toBe("1ათ");
    expect(fmtN(1200)).toBe("1.2ათ");
  });
});

describe("kfmt", () => {
  it("leaves small numbers as-is", () => {
    expect(kfmt(500)).toBe("500");
  });

  it("abbreviates thousands with a k suffix", () => {
    expect(kfmt(1000)).toBe("1.0k");
    expect(kfmt(1500)).toBe("1.5k");
  });
});

describe("timeAgo", () => {
  it("says 'now' for timestamps under a minute old", () => {
    expect(timeAgo(new Date(Date.now() - 5000).toISOString())).toBe("ახლა");
  });

  it("formats minutes, hours, and days", () => {
    expect(timeAgo(new Date(Date.now() - 5 * 60000).toISOString())).toBe("5წთ");
    expect(timeAgo(new Date(Date.now() - 2 * 3600000).toISOString())).toBe("2სთ");
    expect(timeAgo(new Date(Date.now() - 3 * 86400000).toISOString())).toBe("3დღ");
  });
});

describe("catColor", () => {
  it("maps known forum categories to their theme colors", () => {
    expect(catColor("ტექ")).toBe(C.accent);
    expect(catColor("დიზაინი")).toBe(C.cyan);
    expect(catColor("კითხვა")).toBe(C.star);
    expect(catColor("ბაზარი")).toBe(C.online);
    expect(catColor("ცხოვრება")).toBe(C.like);
  });

  it("falls back to the accent color for an unknown category", () => {
    expect(catColor("რაღაც უცნობი")).toBe(C.accent);
  });
});

describe("hashIdx", () => {
  it("is deterministic for the same input", () => {
    expect(hashIdx("user-123", 10)).toBe(hashIdx("user-123", 10));
  });

  it("always stays within [0, n)", () => {
    for (const id of ["a", "user-123", "", "some-longer-id-string"]) {
      const idx = hashIdx(id, 7);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(7);
    }
  });
});

describe("levelInfo", () => {
  it("computes level, progress-into-level, and percent from xp", () => {
    expect(levelInfo(0)).toEqual({ lvl: 1, into: 0, pct: 0 });
    expect(levelInfo(150)).toEqual({ lvl: 2, into: 50, pct: 50 });
    expect(levelInfo(250)).toEqual({ lvl: 3, into: 50, pct: 50 });
  });
});

describe("waveOf", () => {
  it("returns 24 deterministic bars within [5, 25]", () => {
    const w1 = waveOf("song-1");
    const w2 = waveOf("song-1");
    expect(w1).toHaveLength(24);
    expect(w1).toEqual(w2);
    w1.forEach((v) => { expect(v).toBeGreaterThanOrEqual(5); expect(v).toBeLessThanOrEqual(25); });
  });
});

describe("msgPreview", () => {
  it("returns an em dash for a missing message", () => {
    expect(msgPreview(null)).toBe("—");
  });

  it("returns the raw text for a text message", () => {
    expect(msgPreview({ type: "text", text: "გამარჯობა" })).toBe("გამარჯობა");
  });

  it("returns a localized label for media message types", () => {
    expect(msgPreview({ type: "image" })).toBe("📷 ფოტო");
    expect(msgPreview({ type: "voice" })).toBe("🎤 ხმოვანი");
    expect(msgPreview({ type: "location" })).toBe("📍 ლოკაცია");
  });

  it("shows the doc name when present, and falls back otherwise", () => {
    expect(msgPreview({ type: "doc", doc: { name: "invoice.pdf" } })).toBe("📄 invoice.pdf");
    expect(msgPreview({ type: "doc" })).toBe("📄 ფაილი");
  });
});

describe("convMembers / convIsGroup", () => {
  it("returns an empty array for a conversation with no members", () => {
    expect(convMembers(null)).toEqual([]);
    expect(convMembers({})).toEqual([]);
  });

  it("returns the members array when present", () => {
    expect(convMembers({ members: ["a", "b"] })).toEqual(["a", "b"]);
  });

  it("treats an explicit isGroup flag or 2+ members as a group", () => {
    expect(convIsGroup({ isGroup: true })).toBe(true);
    expect(convIsGroup({ members: ["a", "b"] })).toBe(true);
    expect(convIsGroup({ members: ["a"] })).toBe(false);
    expect(convIsGroup(null)).toBe(false);
  });
});

describe("computeTrends", () => {
  it("counts hashtags across posts and sorts by frequency", () => {
    const posts = [
      { text: "საუბარი #ჩათი-ზე და #ჩათი" },
      { text: "#მუსიკა მომწონს" },
      { text: "არაფერი აქ" },
    ];
    expect(computeTrends(posts)).toEqual([
      { tag: "ჩათი", posts: 2 },
      { tag: "მუსიკა", posts: 1 },
    ]);
  });

  it("respects the limit parameter", () => {
    const posts = ["a", "b", "c", "d"].map((h) => ({ text: "#" + h }));
    expect(computeTrends(posts, 2)).toHaveLength(2);
  });

  it("returns an empty list when there are no hashtags", () => {
    expect(computeTrends([{ text: "no tags here" }])).toEqual([]);
  });
});
