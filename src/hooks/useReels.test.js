// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const state = vi.hoisted(() => ({ hasSupabase: true }));

vi.mock("../ui/core", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    get hasSupabase() { return state.hasSupabase; },
    reelsApi: {
      ...actual.reelsApi,
      listPage: vi.fn(),
      mine: vi.fn().mockResolvedValue([]),
      mySaves: vi.fn().mockResolvedValue([]),
      toggleLike: vi.fn().mockResolvedValue(undefined),
      toggleSave: vi.fn().mockResolvedValue(undefined),
      addView: vi.fn().mockResolvedValue(undefined),
      create: vi.fn().mockResolvedValue({}),
    },
  };
});

import { useReels } from "./useReels";
import { reelsApi } from "../ui/core";

function reel(id, createdAt) {
  return { id, author_id: "u1", thumb_url: null, video_url: "https://x/v.mp4", created_at: createdAt };
}

function baseArgs(overrides = {}) {
  return { tab: "reels", flash: vi.fn(), dbErr: vi.fn(() => vi.fn()), setDbError: vi.fn(), gainXp: vi.fn(), ...overrides };
}

beforeEach(() => {
  vi.clearAllMocks();
  state.hasSupabase = true;
  reelsApi.mine.mockResolvedValue([]);
  reelsApi.mySaves.mockResolvedValue([]);
});

describe("loadReels", () => {
  it("marks reels the user already liked/saved based on their id sets", async () => {
    reelsApi.listPage.mockResolvedValue([reel("r1", "2026-01-01T00:00:00Z"), reel("r2", "2026-01-01T00:01:00Z")]);
    reelsApi.mine.mockResolvedValue([{ reel_id: "r1" }]);
    reelsApi.mySaves.mockResolvedValue([{ reel_id: "r2" }]);
    const { result } = renderHook(() => useReels(baseArgs()));
    await act(async () => { await result.current.loadReels(); });
    const r1 = result.current.reels.find((r) => r.id === "r1");
    const r2 = result.current.reels.find((r) => r.id === "r2");
    expect(r1.likedByMe).toBe(true);
    expect(r1.savedByMe).toBe(false);
    expect(r2.likedByMe).toBe(false);
    expect(r2.savedByMe).toBe(true);
  });
});

describe("onReelView", () => {
  it("counts a view once, then ignores repeat views of the same reel in this session", async () => {
    reelsApi.listPage.mockResolvedValue([reel("r1", "2026-01-01T00:00:00Z")]);
    const { result } = renderHook(() => useReels(baseArgs()));
    await act(async () => { await result.current.loadReels(); });
    act(() => result.current.onReelView("r1"));
    expect(result.current.reels[0].views).toBe(1);
    expect(reelsApi.addView).toHaveBeenCalledTimes(1);
    act(() => result.current.onReelView("r1"));
    expect(result.current.reels[0].views).toBe(1); // unchanged
    expect(reelsApi.addView).toHaveBeenCalledTimes(1); // not called again
  });
});

describe("onReelLike / onReelSave", () => {
  it("optimistically toggles likedByMe and calls the API", async () => {
    reelsApi.listPage.mockResolvedValue([reel("r1", "2026-01-01T00:00:00Z")]);
    const { result } = renderHook(() => useReels(baseArgs()));
    await act(async () => { await result.current.loadReels(); });
    act(() => result.current.onReelLike("r1"));
    expect(result.current.reels[0].likedByMe).toBe(true);
    expect(reelsApi.toggleLike).toHaveBeenCalledWith("r1");
    act(() => result.current.onReelLike("r1"));
    expect(result.current.reels[0].likedByMe).toBe(false);
  });
});

describe("onPublishReel", () => {
  it("closes the composer, grants xp, flashes a toast, and creates the reel", () => {
    const flash = vi.fn();
    const gainXp = vi.fn();
    const { result } = renderHook(() => useReels(baseArgs({ flash, gainXp })));
    act(() => result.current.setReelCreateOpen(true));
    act(() => result.current.onPublishReel({ video: "https://x/v.mp4", thumb: null, caption: "hi" }));
    expect(result.current.reelCreateOpen).toBe(false);
    expect(gainXp).toHaveBeenCalledWith(12);
    expect(flash).toHaveBeenCalled();
    expect(reelsApi.create).toHaveBeenCalledWith(expect.objectContaining({ video_url: "https://x/v.mp4", caption: "hi" }));
  });
});
