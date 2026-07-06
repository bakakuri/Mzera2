// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("../lib/api", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    follows: { ...actual.follows, followers: vi.fn(), following: vi.fn() },
    profiles: { ...actual.profiles, search: vi.fn().mockResolvedValue([]) },
  };
});

import { FollowList, PeoplePicker, setME, mergeProfile } from "./core";
import { follows as followsApi, profiles as profilesApi } from "../lib/api";

afterEach(cleanup);

describe("FollowList", () => {
  it("shows a loading state, then the resolved list of followers", async () => {
    setME("me-1");
    mergeProfile({ id: "viewed-user", name: "Viewed", username: "viewed" });
    followsApi.followers.mockResolvedValue([{ id: "f1", name: "Follower One", username: "follower1" }]);
    render(<FollowList view={{ type: "followers", userId: "viewed-user" }} following={[]} onToggleFollow={() => {}} onOpenProfile={() => {}} onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText("Follower One")).toBeInTheDocument());
  });

  it("shows an empty state when there are none", async () => {
    setME("me-1");
    mergeProfile({ id: "viewed-user-2", name: "Viewed", username: "viewed2" });
    followsApi.followers.mockResolvedValue([]);
    render(<FollowList view={{ type: "followers", userId: "viewed-user-2" }} following={[]} onToggleFollow={() => {}} onOpenProfile={() => {}} onClose={() => {}} />);
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());
  });

  it("switches to the following tab and re-fetches", async () => {
    setME("me-1");
    mergeProfile({ id: "viewed-user-3", name: "Viewed", username: "viewed3" });
    followsApi.followers.mockResolvedValue([]);
    followsApi.following.mockResolvedValue([{ id: "g1", name: "Followed One", username: "followed1" }]);
    render(<FollowList view={{ type: "followers", userId: "viewed-user-3" }} following={[]} onToggleFollow={() => {}} onOpenProfile={() => {}} onClose={() => {}} />);
    await waitFor(() => expect(followsApi.followers).toHaveBeenCalled());
    fireEvent.click(screen.getByText(/followingTab|Following|მიჰყვება/i));
    await waitFor(() => expect(followsApi.following).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText("Followed One")).toBeInTheDocument());
  });

  it("opens the clicked profile and closes the list", async () => {
    setME("me-1");
    mergeProfile({ id: "viewed-user-4", name: "Viewed", username: "viewed4" });
    followsApi.followers.mockResolvedValue([{ id: "f2", name: "Follower Two", username: "follower2" }]);
    const onOpenProfile = vi.fn();
    const onClose = vi.fn();
    render(<FollowList view={{ type: "followers", userId: "viewed-user-4" }} following={[]} onToggleFollow={() => {}} onOpenProfile={onOpenProfile} onClose={onClose} />);
    await waitFor(() => expect(screen.getByText("Follower Two")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Follower Two"));
    expect(onOpenProfile).toHaveBeenCalledWith("f2");
    expect(onClose).toHaveBeenCalled();
  });
});

describe("PeoplePicker", () => {
  it("lists locally-known users (excluding me and the exclude list) and lets you select one", () => {
    setME("me-1");
    mergeProfile({ id: "u1", name: "Nini", username: "nini" });
    mergeProfile({ id: "u2", name: "Gio", username: "gio" });
    const onConfirm = vi.fn();
    render(<PeoplePicker title="აირჩიე" cta="დამატება" onClose={() => {}} onConfirm={onConfirm} />);
    expect(screen.getByText("Nini")).toBeInTheDocument();
    expect(screen.getByText("Gio")).toBeInTheDocument();
    const confirmBtn = screen.getByText("დამატება");
    expect(confirmBtn).toBeDisabled();
    fireEvent.click(screen.getByText("Nini"));
    expect(confirmBtn).not.toBeDisabled();
    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledWith(["u1"]);
  });

  it("excludes ids passed in the exclude list", () => {
    setME("me-1");
    mergeProfile({ id: "u3", name: "Excluded", username: "excluded" });
    render(<PeoplePicker title="x" cta="x" exclude={["u3"]} onClose={() => {}} onConfirm={() => {}} />);
    expect(screen.queryByText("Excluded")).not.toBeInTheDocument();
  });

  it("searches remotely for a user not already known locally", async () => {
    setME("me-1");
    profilesApi.search.mockResolvedValue([{ id: "remote-1", name: "Remote Person", username: "remoteperson" }]);
    render(<PeoplePicker title="x" cta="x" onClose={() => {}} onConfirm={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/searchPeoplePh|Search people|მოძებნე/i), { target: { value: "remote" } });
    await waitFor(() => expect(profilesApi.search).toHaveBeenCalledWith("remote"), { timeout: 1000 });
    await waitFor(() => expect(screen.getByText("Remote Person")).toBeInTheDocument(), { timeout: 1000 });
  });
});
