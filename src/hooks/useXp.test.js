// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const state = vi.hoisted(() => ({ hasSupabase: true }));

vi.mock("../ui/core", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    get hasSupabase() { return state.hasSupabase; },
    xpApi: { ...actual.xpApi, notifyLevelUp: vi.fn().mockResolvedValue(undefined), add: vi.fn().mockResolvedValue(undefined) },
    questsApi: { ...actual.questsApi, today: vi.fn().mockResolvedValue(null), claim: vi.fn() },
  };
});

import { useXp } from "./useXp";
import { xpApi, questsApi } from "../ui/core";

const noopDbErr = () => () => {};

beforeEach(() => {
  state.hasSupabase = true;
  vi.clearAllMocks();
});

describe("useXp", () => {
  it("starts at 120 xp", () => {
    const { result } = renderHook(() => useXp({ tab: "feed", flash: () => {}, dbErr: noopDbErr }));
    expect(result.current.xp).toBe(120);
  });

  it("gainXp increases xp and persists it remotely when Supabase is configured", () => {
    const { result } = renderHook(() => useXp({ tab: "feed", flash: () => {}, dbErr: noopDbErr }));
    act(() => result.current.gainXp(10));
    expect(result.current.xp).toBe(130);
    expect(xpApi.add).toHaveBeenCalledWith(10);
  });

  it("gainXp still updates local xp, but skips the API call, when Supabase isn't configured", () => {
    state.hasSupabase = false;
    const { result } = renderHook(() => useXp({ tab: "feed", flash: () => {}, dbErr: noopDbErr }));
    act(() => result.current.gainXp(10));
    expect(result.current.xp).toBe(130);
    expect(xpApi.add).not.toHaveBeenCalled();
  });

  it("gainXp notifies a level-up only when xp actually crosses a level boundary", () => {
    const { result } = renderHook(() => useXp({ tab: "feed", flash: () => {}, dbErr: noopDbErr }));
    act(() => result.current.gainXp(5)); // 120 -> 125, still level 2
    expect(xpApi.notifyLevelUp).not.toHaveBeenCalled();
    act(() => result.current.gainXp(100)); // 125 -> 225, level 2 -> 3
    expect(xpApi.notifyLevelUp).toHaveBeenCalledWith(3);
  });

  it("loads today's quests when the progress tab is opened, but not for other tabs", () => {
    renderHook(() => useXp({ tab: "progress", flash: () => {}, dbErr: noopDbErr }));
    expect(questsApi.today).toHaveBeenCalledTimes(1);
    vi.clearAllMocks();
    renderHook(() => useXp({ tab: "feed", flash: () => {}, dbErr: noopDbErr }));
    expect(questsApi.today).not.toHaveBeenCalled();
  });

  it("onClaimQuest grants xp and flashes a message when the server approves the claim", async () => {
    questsApi.claim.mockResolvedValue(true);
    const flash = vi.fn();
    const { result } = renderHook(() => useXp({ tab: "progress", flash, dbErr: noopDbErr }));
    await act(async () => {
      result.current.onClaimQuest("post_1", 20);
      await Promise.resolve();
    });
    expect(result.current.xp).toBe(140);
    expect(flash).toHaveBeenCalledWith("+20 XP 🎉");
  });

  it("onClaimQuest does not grant xp when the server rejects the claim", async () => {
    questsApi.claim.mockResolvedValue(false);
    const { result } = renderHook(() => useXp({ tab: "progress", flash: () => {}, dbErr: noopDbErr }));
    await act(async () => {
      result.current.onClaimQuest("post_1", 20);
      await Promise.resolve();
    });
    expect(result.current.xp).toBe(120);
  });
});
