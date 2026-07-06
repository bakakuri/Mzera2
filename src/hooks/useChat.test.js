// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const state = vi.hoisted(() => ({ hasSupabase: true, subscribeCallbacks: {} }));

vi.mock("../ui/core", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    get ME() { return actual.ME; },
    get hasSupabase() { return state.hasSupabase; },
    pushNotif: vi.fn(),
    chatApi: {
      conversations: vi.fn().mockResolvedValue([]),
      subscribe: vi.fn((cid, cb) => { state.subscribeCallbacks[cid] = cb; return { unsubscribe: vi.fn() }; }),
      send: vi.fn().mockResolvedValue({}),
      editMessage: vi.fn().mockResolvedValue(undefined),
      deleteMessage: vi.fn().mockResolvedValue(undefined),
      deleteConversation: vi.fn().mockResolvedValue(undefined),
      pinMessage: vi.fn().mockResolvedValue(undefined),
      unpinMessage: vi.fn().mockResolvedValue(undefined),
      peerRead: vi.fn().mockResolvedValue([]),
      reactionsFor: vi.fn().mockResolvedValue([]),
      markRead: vi.fn().mockResolvedValue(undefined),
      react: vi.fn().mockResolvedValue(undefined),
      createConversation: vi.fn().mockResolvedValue({ id: "new-c" }),
    },
  };
});

import { useChat } from "./useChat";
import { chatApi, setME } from "../ui/core";

function baseArgs(overrides = {}) {
  return { live: true, session: { user: { id: "me-1" } }, flash: vi.fn(), dbErr: vi.fn(() => vi.fn()), setDbError: vi.fn(), setTab: vi.fn(), onIncoming: vi.fn(), ...overrides };
}

function convoRow(id, otherId, otherName, messages = [], pinnedId = null) {
  return {
    id, is_group: false, pinned_message_id: pinnedId,
    members: [{ profiles: { id: "me-1" } }, { profiles: { id: otherId, name: otherName, username: otherId } }],
    messages,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  state.hasSupabase = true;
  state.subscribeCallbacks = {};
  localStorage.clear();
  setME("me-1");
});

describe("loadConvos", () => {
  it("maps rows into conversations (excluding ME from members), sorted by most-recent message first", async () => {
    chatApi.conversations.mockResolvedValue([
      convoRow("c1", "u2", "U2", [{ id: "m1", sender_id: "u2", created_at: "2026-01-01T00:00:00Z", type: "text", text: "old" }]),
      convoRow("c2", "u3", "U3", [{ id: "m2", sender_id: "u3", created_at: "2026-01-02T00:00:00Z", type: "text", text: "new" }]),
    ]);
    const { result } = renderHook(() => useChat(baseArgs()));
    await act(async () => { await result.current.loadConvos(); });
    expect(result.current.convos.map((c) => c.id)).toEqual(["c2", "c1"]);
    expect(result.current.convos[0].members).toEqual(["u3"]);
  });
});

describe("toggleMuteConvo", () => {
  it("adds/removes a conversation id and persists it to localStorage", () => {
    const { result } = renderHook(() => useChat(baseArgs()));
    act(() => result.current.toggleMuteConvo("c1"));
    expect(result.current.mutedConvoIds).toEqual(["c1"]);
    expect(JSON.parse(localStorage.getItem("mz_muted_convos"))).toEqual(["c1"]);
    act(() => result.current.toggleMuteConvo("c1"));
    expect(result.current.mutedConvoIds).toEqual([]);
  });
});

describe("realtime message handling", () => {
  it("notifies for an incoming message when the conversation isn't open and isn't muted", async () => {
    chatApi.conversations.mockResolvedValue([convoRow("c1", "u2", "U2")]);
    const onIncoming = vi.fn();
    const { result } = renderHook(() => useChat(baseArgs({ onIncoming })));
    await act(async () => { await result.current.loadConvos(); });
    await waitFor(() => expect(state.subscribeCallbacks.c1).toBeTruthy());
    act(() => state.subscribeCallbacks.c1("INSERT", { id: "m9", sender_id: "u2", created_at: new Date().toISOString(), type: "text", text: "hi there" }));
    expect(onIncoming).toHaveBeenCalledWith("U2: hi there");
    expect(result.current.convos[0].messages).toHaveLength(1);
    expect(result.current.convos[0].unread).toBe(1);
  });

  it("does not notify or count unread when the conversation is currently open", async () => {
    chatApi.conversations.mockResolvedValue([convoRow("c1", "u2", "U2")]);
    const onIncoming = vi.fn();
    const { result } = renderHook(() => useChat(baseArgs({ onIncoming })));
    await act(async () => { await result.current.loadConvos(); });
    act(() => result.current.setOpenConvoId("c1"));
    await waitFor(() => expect(state.subscribeCallbacks.c1).toBeTruthy());
    act(() => state.subscribeCallbacks.c1("INSERT", { id: "m9", sender_id: "u2", created_at: new Date().toISOString(), type: "text", text: "hi" }));
    expect(onIncoming).not.toHaveBeenCalled();
    expect(result.current.convos[0].unread).toBe(0);
  });

  it("does not notify when the conversation is muted", async () => {
    chatApi.conversations.mockResolvedValue([convoRow("c1", "u2", "U2")]);
    const onIncoming = vi.fn();
    const { result } = renderHook(() => useChat(baseArgs({ onIncoming })));
    await act(async () => { await result.current.loadConvos(); });
    act(() => result.current.toggleMuteConvo("c1"));
    await waitFor(() => expect(state.subscribeCallbacks.c1).toBeTruthy());
    act(() => state.subscribeCallbacks.c1("INSERT", { id: "m9", sender_id: "u2", created_at: new Date().toISOString(), type: "text", text: "hi" }));
    expect(onIncoming).not.toHaveBeenCalled();
  });

  it("ignores an INSERT for a message id it already has (no duplicates)", async () => {
    chatApi.conversations.mockResolvedValue([convoRow("c1", "u2", "U2", [{ id: "m1", sender_id: "u2", created_at: new Date().toISOString(), type: "text", text: "first" }])]);
    const { result } = renderHook(() => useChat(baseArgs()));
    await act(async () => { await result.current.loadConvos(); });
    await waitFor(() => expect(state.subscribeCallbacks.c1).toBeTruthy());
    act(() => state.subscribeCallbacks.c1("INSERT", { id: "m1", sender_id: "u2", created_at: new Date().toISOString(), type: "text", text: "first" }));
    expect(result.current.convos[0].messages).toHaveLength(1);
  });

  it("a CONV_UPDATE event updates the pinned message id", async () => {
    chatApi.conversations.mockResolvedValue([convoRow("c1", "u2", "U2")]);
    const { result } = renderHook(() => useChat(baseArgs()));
    await act(async () => { await result.current.loadConvos(); });
    await waitFor(() => expect(state.subscribeCallbacks.c1).toBeTruthy());
    act(() => state.subscribeCallbacks.c1("CONV_UPDATE", { pinned_message_id: "m5" }));
    expect(result.current.convos[0].pinnedMessageId).toBe("m5");
  });

  it("unreadMsgs sums the unread counts across all conversations", async () => {
    chatApi.conversations.mockResolvedValue([convoRow("c1", "u2", "U2", [{ id: "m1", sender_id: "u2", created_at: new Date().toISOString(), type: "text", text: "a" }])]);
    const { result } = renderHook(() => useChat(baseArgs()));
    await act(async () => { await result.current.loadConvos(); });
    await waitFor(() => expect(state.subscribeCallbacks.c1).toBeTruthy());
    act(() => state.subscribeCallbacks.c1("INSERT", { id: "m2", sender_id: "u2", created_at: new Date().toISOString(), type: "text", text: "b" }));
    act(() => state.subscribeCallbacks.c1("INSERT", { id: "m3", sender_id: "u2", created_at: new Date().toISOString(), type: "text", text: "c" }));
    expect(result.current.unreadMsgs).toBe(2);
  });
});

describe("onPinMessage / onUnpinMessage", () => {
  it("optimistically sets and clears the pinned message, and calls the API", async () => {
    chatApi.conversations.mockResolvedValue([convoRow("c1", "u2", "U2")]);
    const { result } = renderHook(() => useChat(baseArgs()));
    await act(async () => { await result.current.loadConvos(); });
    act(() => result.current.onPinMessage("c1", "m1"));
    expect(result.current.convos[0].pinnedMessageId).toBe("m1");
    expect(chatApi.pinMessage).toHaveBeenCalledWith("c1", "m1");
    act(() => result.current.onUnpinMessage("c1"));
    expect(result.current.convos[0].pinnedMessageId).toBeNull();
    expect(chatApi.unpinMessage).toHaveBeenCalledWith("c1");
  });
});

describe("onSendMsg", () => {
  it("flashes a friendly toast on failure instead of throwing", async () => {
    chatApi.send.mockRejectedValue(new Error("boom"));
    const flash = vi.fn();
    const { result } = renderHook(() => useChat(baseArgs({ flash })));
    act(() => result.current.onSendMsg("c1", { type: "text", text: "hi" }));
    await waitFor(() => expect(flash).toHaveBeenCalled());
  });
});
