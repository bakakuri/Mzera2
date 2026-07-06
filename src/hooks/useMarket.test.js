// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const state = vi.hoisted(() => ({ hasSupabase: true }));

vi.mock("../ui/core", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    get hasSupabase() { return state.hasSupabase; },
    marketApi: {
      ...actual.marketApi,
      listingsPage: vi.fn(),
      listingsPlain: vi.fn(),
    },
  };
});

import { useMarket } from "./useMarket";
import { marketApi } from "../ui/core";

function listing(id, createdAt) {
  return { id, seller_id: "u1", title: "x", price: 10, created_at: createdAt };
}

function baseArgs(overrides = {}) {
  return { tab: "market", flash: vi.fn(), dbErr: vi.fn(() => vi.fn()), setDbError: vi.fn(), ...overrides };
}

beforeEach(() => {
  vi.clearAllMocks();
  state.hasSupabase = true;
});

describe("loadListings", () => {
  it("uses the paged endpoint and sets more when a full page comes back", async () => {
    marketApi.listingsPage.mockResolvedValue(Array.from({ length: 10 }, (_, i) => listing(`l${i}`, `2026-01-01T00:0${i}:00Z`)));
    const { result } = renderHook(() => useMarket(baseArgs()));
    await act(async () => { await result.current.loadListings(); });
    expect(result.current.listings).toHaveLength(10);
    expect(result.current.listMore).toBe(true);
    expect(marketApi.listingsPlain).not.toHaveBeenCalled();
  });

  it("falls back to the plain (unpaged) endpoint and disables 'more' when the paged one errors", async () => {
    marketApi.listingsPage.mockRejectedValue(new Error("no such rpc"));
    marketApi.listingsPlain.mockResolvedValue([{ id: "l1", seller_id: "u1", title: "x", price: 10, created_at: "2026-01-01T00:00:00Z" }]);
    const { result } = renderHook(() => useMarket(baseArgs()));
    await act(async () => { await result.current.loadListings(); });
    expect(result.current.listings.map((l) => l.id)).toEqual(["l1"]);
    expect(result.current.listMore).toBe(false); // paged=false means no further pagination is attempted
  });
});

describe("loadMoreListings", () => {
  it("appends rows, dedupes by id, and advances the cursor", async () => {
    marketApi.listingsPage
      .mockResolvedValueOnce(Array.from({ length: 10 }, (_, i) => listing(`l${i}`, `2026-01-01T00:0${i}:00Z`)))
      .mockResolvedValueOnce([listing("l9", "2026-01-01T00:09:00Z"), listing("l10", "2026-01-02T00:00:00Z")]); // l9 overlaps
    const { result } = renderHook(() => useMarket(baseArgs()));
    await act(async () => { await result.current.loadListings(); });
    await act(async () => { await result.current.loadMoreListings(); });
    expect(result.current.listings.map((l) => l.id)).toEqual([...Array.from({ length: 10 }, (_, i) => `l${i}`), "l10"]);
    expect(result.current.listCursor).toBe("2026-01-02T00:00:00Z");
  });

  it("flashes a toast if the follow-up page request fails (no plain-endpoint fallback here)", async () => {
    marketApi.listingsPage
      .mockResolvedValueOnce(Array.from({ length: 10 }, (_, i) => listing(`l${i}`, `2026-01-01T00:0${i}:00Z`)))
      .mockRejectedValueOnce(new Error("down"));
    const flash = vi.fn();
    const { result } = renderHook(() => useMarket(baseArgs({ flash })));
    await act(async () => { await result.current.loadListings(); });
    await act(async () => { await result.current.loadMoreListings(); });
    expect(flash).toHaveBeenCalled();
    expect(result.current.listLoadingMore).toBe(false);
  });
});
