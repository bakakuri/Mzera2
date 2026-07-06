// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const state = vi.hoisted(() => ({ hasSupabase: true }));

vi.mock("../ui/core", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    get hasSupabase() { return state.hasSupabase; },
    filmsApi: { ...actual.filmsApi, page: vi.fn() },
  };
});

import { useMovies } from "./useMovies";
import { filmsApi } from "../ui/core";

function film(id, createdAt) {
  return { id, author_id: "u1", title: "x", created_at: createdAt };
}

function baseArgs(overrides = {}) {
  return { tab: "movies", session: null, flash: vi.fn(), dbErr: vi.fn(() => vi.fn()), ...overrides };
}

beforeEach(() => {
  vi.clearAllMocks();
  state.hasSupabase = true;
});

describe("loadFilms", () => {
  it("sets the cursor to the last row's createdAt and flags more when a full page comes back", async () => {
    filmsApi.page.mockResolvedValue([film("f1", "2026-01-01T00:00:00Z"), film("f2", "2026-01-02T00:00:00Z")]);
    const { result } = renderHook(() => useMovies(baseArgs()));
    await act(async () => { await result.current.loadFilms(); });
    expect(result.current.films.map((f) => f.id)).toEqual(["f1", "f2"]);
    expect(result.current.filmCursor).toBe("2026-01-02T00:00:00Z");
  });

  it("does nothing when Supabase isn't configured", async () => {
    state.hasSupabase = false;
    const { result } = renderHook(() => useMovies(baseArgs()));
    await act(async () => { await result.current.loadFilms(); });
    expect(filmsApi.page).not.toHaveBeenCalled();
    expect(result.current.films).toEqual([]);
  });
});

describe("loadMoreFilms", () => {
  it("appends new rows, dedupes by id, and advances the cursor", async () => {
    filmsApi.page
      .mockResolvedValueOnce(Array.from({ length: 12 }, (_, i) => film(`f${i}`, `2026-01-01T00:0${i}:00Z`)))
      .mockResolvedValueOnce([film("f11", "2026-01-01T00:11:00Z"), film("f12", "2026-01-02T00:00:00Z")]); // f11 overlaps
    const { result } = renderHook(() => useMovies(baseArgs()));
    await act(async () => { await result.current.loadFilms(); });
    await act(async () => { await result.current.loadMoreFilms(); });
    expect(result.current.films.map((f) => f.id)).toEqual([...Array.from({ length: 12 }, (_, i) => `f${i}`), "f12"]);
    expect(result.current.filmCursor).toBe("2026-01-02T00:00:00Z");
  });

  it("sets filmMore to false once a short page comes back", async () => {
    filmsApi.page
      .mockResolvedValueOnce(Array.from({ length: 12 }, (_, i) => film(`f${i}`, `2026-01-01T00:0${i}:00Z`)))
      .mockResolvedValueOnce([film("f-last", "2026-01-02T00:00:00Z")]); // short page
    const { result } = renderHook(() => useMovies(baseArgs()));
    await act(async () => { await result.current.loadFilms(); });
    await act(async () => { await result.current.loadMoreFilms(); });
    expect(result.current.filmMore).toBe(false);
  });

  it("sets filmMore to false when an empty page comes back", async () => {
    filmsApi.page
      .mockResolvedValueOnce(Array.from({ length: 12 }, (_, i) => film(`f${i}`, `2026-01-01T00:0${i}:00Z`)))
      .mockResolvedValueOnce([]);
    const { result } = renderHook(() => useMovies(baseArgs()));
    await act(async () => { await result.current.loadFilms(); });
    await act(async () => { await result.current.loadMoreFilms(); });
    expect(result.current.filmMore).toBe(false);
  });

  it("is a no-op while a load is already in flight, when there's nothing more, or with no cursor yet", async () => {
    const { result } = renderHook(() => useMovies(baseArgs()));
    await act(async () => { await result.current.loadMoreFilms(); }); // no cursor yet
    expect(filmsApi.page).not.toHaveBeenCalled();
  });

  it("flashes a toast and clears the loading flag if the page request fails", async () => {
    filmsApi.page
      .mockResolvedValueOnce(Array.from({ length: 12 }, (_, i) => film(`f${i}`, `2026-01-01T00:0${i}:00Z`)))
      .mockRejectedValueOnce(new Error("down"));
    const flash = vi.fn();
    const { result } = renderHook(() => useMovies(baseArgs({ flash })));
    await act(async () => { await result.current.loadFilms(); });
    await act(async () => { await result.current.loadMoreFilms(); });
    expect(flash).toHaveBeenCalled();
    expect(result.current.filmLoadingMore).toBe(false);
  });
});
