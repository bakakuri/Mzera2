// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

const state = vi.hoisted(() => ({ hasSupabase: true }));

vi.mock("../ui/core", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    get ME() { return actual.ME; },
    get hasSupabase() { return state.hasSupabase; },
    profilesApi: { ...actual.profilesApi, search: vi.fn() },
    postsApi: { ...actual.postsApi, search: vi.fn() },
    filmsApi: { ...actual.filmsApi, page: vi.fn() },
    musicApi: { ...actual.musicApi, search: vi.fn() },
    marketApi: { ...actual.marketApi, search: vi.fn() },
  };
});

import { useFeed } from "./useFeed";
import { profilesApi, postsApi, filmsApi, musicApi, marketApi, setME } from "../ui/core";

function baseArgs(overrides = {}) {
  return { tab: "feed", session: null, flash: vi.fn(), dbErr: vi.fn(() => vi.fn()), setDbError: vi.fn(), gainXp: vi.fn(), ...overrides };
}

beforeEach(() => {
  vi.clearAllMocks();
  state.hasSupabase = true;
  setME("me-1");
});

describe("runSearch", () => {
  it("returns an empty result immediately for a blank query, without calling any API", async () => {
    const { result } = renderHook(() => useFeed(baseArgs()));
    const r = await result.current.runSearch("   ");
    expect(r).toEqual({ people: [], posts: [], films: [], songs: [], listings: [], failedCount: 0 });
    expect(postsApi.search).not.toHaveBeenCalled();
  });

  it("returns an empty result when Supabase isn't configured", async () => {
    state.hasSupabase = false;
    const { result } = renderHook(() => useFeed(baseArgs()));
    const r = await result.current.runSearch("hello");
    expect(r.failedCount).toBe(0);
    expect(postsApi.search).not.toHaveBeenCalled();
  });

  it("aggregates results from all five sources when they all succeed", async () => {
    profilesApi.search.mockResolvedValue([{ id: "u2", name: "Nini", username: "nini" }]);
    postsApi.search.mockResolvedValue([{ id: "p1", author_id: "u2", created_at: new Date().toISOString() }]);
    filmsApi.page.mockResolvedValue([{ id: "f1", author_id: "u2", title: "x" }]);
    musicApi.search.mockResolvedValue([{ id: "s1", author_id: "u2", title: "x" }]);
    marketApi.search.mockResolvedValue([{ id: "l1", seller_id: "u2", title: "x", price: 10 }]);
    const { result } = renderHook(() => useFeed(baseArgs()));
    const r = await result.current.runSearch("hello");
    expect(r.people).toHaveLength(1);
    expect(r.posts).toHaveLength(1);
    expect(r.films).toHaveLength(1);
    expect(r.songs).toHaveLength(1);
    expect(r.listings).toHaveLength(1);
    expect(r.failedCount).toBe(0);
  });

  it("excludes the current user from the people results", async () => {
    profilesApi.search.mockResolvedValue([{ id: "me-1", name: "Me", username: "me" }, { id: "u2", name: "Nini", username: "nini" }]);
    postsApi.search.mockResolvedValue([]);
    filmsApi.page.mockResolvedValue([]);
    musicApi.search.mockResolvedValue([]);
    marketApi.search.mockResolvedValue([]);
    const { result } = renderHook(() => useFeed(baseArgs()));
    const r = await result.current.runSearch("hello");
    expect(r.people.map((p) => p.id)).toEqual(["u2"]);
  });

  it("keeps whichever sources succeed and counts the ones that fail, instead of failing the whole search", async () => {
    profilesApi.search.mockResolvedValue([]);
    postsApi.search.mockRejectedValue(new Error("down"));
    filmsApi.page.mockResolvedValue([{ id: "f1", author_id: "u2", title: "x" }]);
    musicApi.search.mockRejectedValue(new Error("down"));
    marketApi.search.mockResolvedValue([]);
    const { result } = renderHook(() => useFeed(baseArgs()));
    const r = await result.current.runSearch("hello");
    expect(r.films).toHaveLength(1);
    expect(r.posts).toEqual([]);
    expect(r.songs).toEqual([]);
    expect(r.failedCount).toBe(2);
  });
});
