import { describe, it, expect, beforeEach } from "vitest";
import {
  mapDbMsg, toDbMsg, setME,
  fmtN, kfmt, timeAgo, catColor, hashIdx, levelInfo, waveOf, msgPreview,
  convMembers, convIsGroup, computeTrends, C,
  mapDbPost, mapDbStories, resolveImg, tx,
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

  it("maps a doc message's name/size/url", () => {
    const row = { id: "6", sender_id: "them-2", created_at: "2026-01-01T10:00:00Z", type: "doc", doc_name: "report.pdf", doc_size: 4096, media_url: "https://x/report.pdf" };
    const m = mapDbMsg(row);
    expect(m.doc).toEqual({ name: "report.pdf", size: 4096, url: "https://x/report.pdf" });
  });

  it("maps a location message's place and map url", () => {
    const row = { id: "7", sender_id: "them-2", created_at: "2026-01-01T10:00:00Z", type: "location", place: "თბილისი", media_url: "https://maps/x" };
    const m = mapDbMsg(row);
    expect(m.place).toBe("თბილისი");
    expect(m.mapUrl).toBe("https://maps/x");
  });

  it("round-trips a doc message through toDbMsg", () => {
    const payload = toDbMsg({ type: "doc", doc: { name: "report.pdf", size: 4096, url: "https://x/report.pdf" } });
    expect(payload).toEqual({ type: "doc", doc_name: "report.pdf", doc_size: 4096, media_url: "https://x/report.pdf" });
  });

  it("round-trips a location message through toDbMsg", () => {
    const payload = toDbMsg({ type: "location", place: "თბილისი", mapUrl: "https://maps/x" });
    expect(payload).toEqual({ type: "location", place: "თბილისი", media_url: "https://maps/x" });
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

describe("mapDbPost poll handling", () => {
  beforeEach(() => setME("me-1"));

  it("returns no poll when has_poll is false", () => {
    const row = { id: "1", author_id: "u1", created_at: "2026-01-01T10:00:00Z", has_poll: false };
    expect(mapDbPost(row).poll).toBeNull();
  });

  it("sorts options by idx and counts votes per option", () => {
    const row = {
      id: "2", author_id: "u1", created_at: "2026-01-01T10:00:00Z", has_poll: true,
      poll_options: [{ idx: 1, text: "B" }, { idx: 0, text: "A" }],
      poll_votes: [
        { option_idx: 0, user_id: "me-1" },
        { option_idx: 0, user_id: "u2" },
        { option_idx: 1, user_id: "u3" },
      ],
    };
    const poll = mapDbPost(row).poll;
    expect(poll.options).toEqual([{ text: "A", votes: 2 }, { text: "B", votes: 1 }]);
  });

  it("marks which option the current user voted for, or null if none", () => {
    const base = { id: "3", author_id: "u1", created_at: "2026-01-01T10:00:00Z", has_poll: true, poll_options: [{ idx: 0, text: "A" }, { idx: 1, text: "B" }] };
    const voted = mapDbPost({ ...base, poll_votes: [{ option_idx: 1, user_id: "me-1" }] }).poll;
    expect(voted.voted).toBe(1);
    const notVoted = mapDbPost({ ...base, poll_votes: [{ option_idx: 1, user_id: "u2" }] }).poll;
    expect(notVoted.voted).toBeNull();
  });
});

describe("mapDbPost image fallback", () => {
  it("falls back to the images array when image_url is absent", () => {
    const row = { id: "4", author_id: "u1", created_at: "2026-01-01T10:00:00Z", images: ["https://x/a.jpg", "https://x/b.jpg"] };
    const post = mapDbPost(row);
    expect(post.image).toBe("https://x/a.jpg");
    expect(post.images).toEqual(["https://x/a.jpg", "https://x/b.jpg"]);
  });

  it("wraps a single image_url into the images array when no images array is given", () => {
    const row = { id: "5", author_id: "u1", created_at: "2026-01-01T10:00:00Z", image_url: "https://x/a.jpg" };
    const post = mapDbPost(row);
    expect(post.images).toEqual(["https://x/a.jpg"]);
  });
});

describe("mapDbStories", () => {
  it("groups stories by author", () => {
    const rows = [
      { id: "s1", author_id: "u1", image_url: "https://x/1.jpg" },
      { id: "s2", author_id: "u1", image_url: "https://x/2.jpg" },
      { id: "s3", author_id: "u2", image_url: "https://x/3.jpg" },
    ];
    const grouped = mapDbStories(rows);
    expect(grouped).toHaveLength(2);
    const u1 = grouped.find((g) => g.authorId === "u1");
    expect(u1.items).toHaveLength(2);
    expect(u1.id).toBe("su1");
  });

  it("marks a group as closeFriends if any of its stories is", () => {
    const rows = [
      { id: "s1", author_id: "u1", image_url: "https://x/1.jpg", close_friends: false },
      { id: "s2", author_id: "u1", image_url: "https://x/2.jpg", close_friends: true },
    ];
    expect(mapDbStories(rows)[0].closeFriends).toBe(true);
  });
});

describe("resolveImg", () => {
  it("returns null for falsy input", () => {
    expect(resolveImg(null)).toBeNull();
    expect(resolveImg("")).toBeNull();
  });

  it("passes through a real URL unchanged", () => {
    expect(resolveImg("https://example.com/a.jpg")).toBe("https://example.com/a.jpg");
  });

  it("generates a deterministic placeholder image for a non-URL seed", () => {
    expect(resolveImg("user-42")).toBe("https://picsum.photos/seed/user-42/640/640");
  });
});

describe("tx", () => {
  it("leaves non-Supabase-storage URLs unchanged", () => {
    expect(tx("https://picsum.photos/seed/x/640/640", 100)).toBe("https://picsum.photos/seed/x/640/640");
  });

  it("leaves falsy input unchanged", () => {
    expect(tx(null, 100)).toBeNull();
  });

  it("rewrites a Supabase storage URL to the image-render endpoint with size/quality params", () => {
    const url = "https://proj.supabase.co/storage/v1/object/public/avatars/abc.jpg";
    expect(tx(url, 100)).toBe("https://proj.supabase.co/storage/v1/render/image/public/avatars/abc.jpg?width=100&quality=62&resize=cover");
  });

  it("appends params with & when the URL already has a query string", () => {
    const url = "https://proj.supabase.co/storage/v1/object/public/avatars/abc.jpg?token=xyz";
    expect(tx(url, 200, 80)).toBe("https://proj.supabase.co/storage/v1/render/image/public/avatars/abc.jpg?token=xyz&width=200&quality=80&resize=cover");
  });
});
