// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const state = vi.hoisted(() => ({ hasSupabase: true }));

vi.mock("../ui/core", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    get ME() { return actual.ME; },
    get hasSupabase() { return state.hasSupabase; },
    adminApi: {
      ...actual.adminApi,
      stats: vi.fn().mockResolvedValue(null),
      dailyTrends: vi.fn().mockResolvedValue([]),
      pendingPublic: vi.fn().mockResolvedValue([]),
      setBanned: vi.fn().mockResolvedValue(undefined),
      grantXp: vi.fn().mockResolvedValue(undefined),
      setXp: vi.fn().mockResolvedValue(undefined),
      deleteUser: vi.fn().mockResolvedValue(undefined),
      broadcast: vi.fn().mockResolvedValue(0),
      reviewPublic: vi.fn().mockResolvedValue(undefined),
    },
    reportsApi: {
      ...actual.reportsApi,
      list: vi.fn().mockResolvedValue([]),
      resolve: vi.fn().mockResolvedValue(undefined),
      create: vi.fn().mockResolvedValue(undefined),
    },
    profilesApi: {
      ...actual.profilesApi,
      update: vi.fn().mockResolvedValue(undefined),
      byIds: vi.fn().mockResolvedValue([]),
      all: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
    postsApi: { ...actual.postsApi, count: vi.fn().mockResolvedValue(0) },
    languagesApi: {
      ...actual.languagesApi,
      getSetting: vi.fn().mockResolvedValue(true),
      adminProgress: vi.fn().mockResolvedValue([]),
      setSetting: vi.fn().mockResolvedValue(undefined),
    },
  };
});

import { useAdmin } from "./useAdmin";
import { adminApi, reportsApi, setME, mergeProfile } from "../ui/core";

function setup(overrides = {}) {
  const flash = vi.fn();
  const dbErr = vi.fn(() => vi.fn());
  const setXp = vi.fn();
  const setPosts = vi.fn();
  const { result } = renderHook(() => useAdmin({ tab: "feed", session: null, flash, dbErr, setXp, setPosts, ...overrides }));
  return { result, flash, dbErr, setXp, setPosts };
}

beforeEach(() => {
  vi.clearAllMocks();
  state.hasSupabase = true;
  setME("me-1");
  mergeProfile({ id: "me-1", name: "Admin", username: "admin", is_admin: true });
});

describe("useAdmin", () => {
  it("onResolve optimistically marks the report resolved locally, then calls the API", async () => {
    reportsApi.list.mockResolvedValue([{ id: "r1", type: "post", target_id: "p1", reporter_id: "u1", created_at: new Date().toISOString(), status: "open" }]);
    const { result } = setup({ tab: "admin" });
    await waitFor(() => expect(result.current.reports).toHaveLength(1));
    act(() => result.current.onResolve("r1"));
    expect(result.current.reports[0].status).toBe("resolved");
    expect(reportsApi.resolve).toHaveBeenCalledWith("r1");
  });

  it("onSetXp clamps a negative amount to zero", () => {
    const { result, setXp } = setup();
    act(() => result.current.onSetXp("me-1", -50));
    expect(setXp).toHaveBeenCalledWith(0);
    expect(adminApi.setXp).toHaveBeenCalledWith("me-1", 0);
  });

  it("onGrantXp updates the caller's own xp state when granting to self", () => {
    const { result, setXp } = setup();
    act(() => result.current.onGrantXp("me-1", 25));
    expect(setXp).toHaveBeenCalled();
    const updater = setXp.mock.calls[0][0];
    expect(updater(100)).toBe(125);
  });

  it("onGrantXp does not touch local xp state when granting to someone else", () => {
    const { result, setXp } = setup();
    act(() => result.current.onGrantXp("someone-else", 25));
    expect(setXp).not.toHaveBeenCalled();
    expect(adminApi.grantXp).toHaveBeenCalledWith("someone-else", 25);
  });

  it("onReviewPublic removes the item from pending, and marks the post approved if approved", async () => {
    adminApi.pendingPublic.mockResolvedValue([{ id: "pp1", author_id: "u1", created_at: new Date().toISOString(), text: "x" }]);
    const { result, setPosts } = setup({ tab: "admin" });
    await waitFor(() => expect(result.current.pendingPublic).toHaveLength(1));
    act(() => result.current.onReviewPublic("pp1", true));
    expect(result.current.pendingPublic).toHaveLength(0);
    expect(setPosts).toHaveBeenCalled();
    expect(adminApi.reviewPublic).toHaveBeenCalledWith("pp1", true);
  });

  it("onBroadcast is a no-op for an empty or whitespace-only message", () => {
    const { result } = setup();
    act(() => result.current.onBroadcast("   "));
    expect(adminApi.broadcast).not.toHaveBeenCalled();
    act(() => result.current.onBroadcast("real message"));
    expect(adminApi.broadcast).toHaveBeenCalledWith("real message");
  });
});
