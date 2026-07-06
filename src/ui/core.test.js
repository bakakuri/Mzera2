import { describe, it, expect, beforeEach } from "vitest";
import { mapDbMsg, toDbMsg, setME } from "./core";

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
