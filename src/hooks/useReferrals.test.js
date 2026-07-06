// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const state = vi.hoisted(() => ({ hasSupabase: true }));

vi.mock("../ui/core", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    get hasSupabase() { return state.hasSupabase; },
    profilesApi: {
      ...actual.profilesApi,
      myReferralStats: vi.fn(),
      myReferredUsers: vi.fn(),
    },
  };
});

import { useReferrals } from "./useReferrals";
import { profilesApi } from "../ui/core";

beforeEach(() => {
  vi.clearAllMocks();
  state.hasSupabase = true;
  profilesApi.myReferralStats.mockResolvedValue({ referral_code: "ABC123", invited_count: "3" });
  profilesApi.myReferredUsers.mockResolvedValue([]);
});

describe("loadReferrals", () => {
  it("does nothing without a session, even if Supabase is configured", () => {
    const { result } = renderHook(() => useReferrals({ session: null, flash: vi.fn() }));
    expect(profilesApi.myReferralStats).not.toHaveBeenCalled();
    expect(result.current.referralCode).toBeNull();
  });

  it("loads the referral code and invited count (coercing the count to a number)", async () => {
    const { result } = renderHook(() => useReferrals({ session: { user: { id: "u1" } }, flash: vi.fn() }));
    await waitFor(() => expect(result.current.referralCode).toBe("ABC123"));
    expect(result.current.invitedCount).toBe(3);
  });

  it("defaults code/count to null/0 when the stats call returns nothing", async () => {
    profilesApi.myReferralStats.mockResolvedValue(null);
    const { result } = renderHook(() => useReferrals({ session: { user: { id: "u1" } }, flash: vi.fn() }));
    await waitFor(() => expect(profilesApi.myReferralStats).toHaveBeenCalled());
    expect(result.current.referralCode).toBeNull();
    expect(result.current.invitedCount).toBe(0);
  });

  it("still loads invited users even if the stats call fails", async () => {
    profilesApi.myReferralStats.mockRejectedValue(new Error("down"));
    profilesApi.myReferredUsers.mockResolvedValue([{ id: "u2", name: "Nini", username: "nini" }]);
    const { result } = renderHook(() => useReferrals({ session: { user: { id: "u1" } }, flash: vi.fn() }));
    await waitFor(() => expect(result.current.invitedUsers).toEqual(["u2"]));
    expect(result.current.referralCode).toBeNull(); // the failed call just leaves this at its default
  });

  it("still loads referral stats even if the invited-users call fails", async () => {
    profilesApi.myReferredUsers.mockRejectedValue(new Error("down"));
    const { result } = renderHook(() => useReferrals({ session: { user: { id: "u1" } }, flash: vi.fn() }));
    await waitFor(() => expect(result.current.referralCode).toBe("ABC123"));
    expect(result.current.invitedUsers).toEqual([]);
  });
});

describe("inviteLink", () => {
  it("is empty until a referral code is loaded", () => {
    const { result } = renderHook(() => useReferrals({ session: null, flash: vi.fn() }));
    expect(result.current.inviteLink).toBe("");
  });

  it("embeds the referral code as a ?ref= query param once loaded", async () => {
    const { result } = renderHook(() => useReferrals({ session: { user: { id: "u1" } }, flash: vi.fn() }));
    await waitFor(() => expect(result.current.inviteLink).toContain("?ref=ABC123"));
  });
});

describe("copyInviteLink", () => {
  it("copies the link and flashes success", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const flash = vi.fn();
    const { result } = renderHook(() => useReferrals({ session: { user: { id: "u1" } }, flash }));
    await waitFor(() => expect(result.current.inviteLink).toContain("ABC123"));
    act(() => result.current.copyInviteLink());
    expect(writeText).toHaveBeenCalledWith(result.current.inviteLink);
    expect(flash).toHaveBeenCalled();
  });

  it("is a no-op when there's no invite link yet", () => {
    const writeText = vi.fn();
    Object.assign(navigator, { clipboard: { writeText } });
    const { result } = renderHook(() => useReferrals({ session: null, flash: vi.fn() }));
    act(() => result.current.copyInviteLink());
    expect(writeText).not.toHaveBeenCalled();
  });

  it("flashes a failure message if the clipboard write throws", async () => {
    Object.assign(navigator, { clipboard: { writeText: () => { throw new Error("denied"); } } });
    const flash = vi.fn();
    const { result } = renderHook(() => useReferrals({ session: { user: { id: "u1" } }, flash }));
    await waitFor(() => expect(result.current.inviteLink).toContain("ABC123"));
    act(() => result.current.copyInviteLink());
    expect(flash).toHaveBeenCalled();
  });
});
