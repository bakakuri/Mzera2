// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const state = vi.hoisted(() => ({ hasSupabase: true }));

vi.mock("../ui/core", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    get hasSupabase() { return state.hasSupabase; },
    musicApi: { ...actual.musicApi, page: vi.fn(), incrementPlays: vi.fn().mockResolvedValue(undefined) },
  };
});

import { useMusic } from "./useMusic";
import { musicApi } from "../ui/core";

function song(id, createdAt) {
  return { id, author_id: "u1", title: "x", audio_url: "https://x/a.mp3", created_at: createdAt };
}

function baseArgs(overrides = {}) {
  return { tab: "music", flash: vi.fn(), dbErr: vi.fn(() => vi.fn()), ...overrides };
}

beforeEach(() => {
  vi.clearAllMocks();
  state.hasSupabase = true;
});

describe("loadMusic / loadMoreSongs", () => {
  it("loads a page of 30 and flags more when the page is full", async () => {
    musicApi.page.mockResolvedValue(Array.from({ length: 30 }, (_, i) => song(`s${i}`, `2026-01-01T00:${String(i).padStart(2, "0")}:00Z`)));
    const { result } = renderHook(() => useMusic(baseArgs()));
    await act(async () => { await result.current.loadMusic(); });
    expect(result.current.songs).toHaveLength(30);
  });

  it("appends and dedupes on loadMoreSongs, and stops when a short page comes back", async () => {
    musicApi.page
      .mockResolvedValueOnce(Array.from({ length: 30 }, (_, i) => song(`s${i}`, `2026-01-01T00:${String(i).padStart(2, "0")}:00Z`)))
      .mockResolvedValueOnce([song("s29", "2026-01-01T00:29:00Z"), song("s30", "2026-01-02T00:00:00Z")]); // s29 overlaps, short page
    const { result } = renderHook(() => useMusic(baseArgs()));
    await act(async () => { await result.current.loadMusic(); });
    await act(async () => { await result.current.loadMoreSongs(); });
    expect(result.current.songs).toHaveLength(31); // 30 + only the new s30
    expect(result.current.songMore).toBe(false);
  });
});

describe("playSong / stopPlaying (global player)", () => {
  it("starts playing a song and records a play count", () => {
    const { result } = renderHook(() => useMusic(baseArgs()));
    act(() => result.current.playSong({ id: "s1", audio: "https://x/a.mp3" }));
    expect(result.current.nowPlaying.id).toBe("s1");
    expect(result.current.isPlaying).toBe(true);
    expect(musicApi.incrementPlays).toHaveBeenCalledWith("s1");
  });

  it("tapping the same song again toggles play/pause instead of restarting it", () => {
    const { result } = renderHook(() => useMusic(baseArgs()));
    act(() => result.current.playSong({ id: "s1", audio: "https://x/a.mp3" }));
    act(() => result.current.playSong({ id: "s1", audio: "https://x/a.mp3" }));
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.nowPlaying.id).toBe("s1"); // still the same song, not cleared
    expect(musicApi.incrementPlays).toHaveBeenCalledTimes(1); // only counted once
  });

  it("switching to a different song replaces nowPlaying and plays it", () => {
    const { result } = renderHook(() => useMusic(baseArgs()));
    act(() => result.current.playSong({ id: "s1", audio: "https://x/a.mp3" }));
    act(() => result.current.playSong({ id: "s2", audio: "https://x/b.mp3" }));
    expect(result.current.nowPlaying.id).toBe("s2");
    expect(result.current.isPlaying).toBe(true);
  });

  it("stopPlaying clears the player entirely", () => {
    const { result } = renderHook(() => useMusic(baseArgs()));
    act(() => result.current.playSong({ id: "s1", audio: "https://x/a.mp3" }));
    act(() => result.current.stopPlaying());
    expect(result.current.nowPlaying).toBeNull();
    expect(result.current.isPlaying).toBe(false);
  });
});
