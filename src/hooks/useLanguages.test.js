// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useLanguages } from "./useLanguages";

describe("useLanguages", () => {
  it("loads the word-data chunk lazily: wordsReady flips true once it resolves, and word queries stay empty/zeroed until then", async () => {
    const { result } = renderHook(() => useLanguages({ session: null, gainXp: vi.fn() }));
    expect(result.current.wordsReady).toBe(false);
    expect(result.current.totalCount("english")).toBe(0);
    expect(result.current.availableLevels("english")).toEqual([]);

    await waitFor(() => expect(result.current.wordsReady).toBe(true));

    expect(result.current.totalCount("english")).toBeGreaterThan(0);
    expect(result.current.availableLevels("english").length).toBeGreaterThan(0);
    expect(result.current.wordsForLevel("english", "all").length).toBe(result.current.totalCount("english"));
  });
});
