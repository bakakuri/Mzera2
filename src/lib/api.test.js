import { describe, it, expect, vi, beforeEach } from "vitest";

const { getUser, refreshSession, from } = vi.hoisted(() => ({
  getUser: vi.fn(),
  refreshSession: vi.fn(),
  from: vi.fn(),
}));

vi.mock("./supabase", () => ({
  supabase: { auth: { getUser, refreshSession }, from },
  hasSupabase: true,
  supabaseUrl: "https://x.supabase.co",
  supabaseAnonKey: "a".repeat(30),
}));

import { chat as chatApi, films as filmsApi } from "./api";

function insertChain(result) {
  return { insert: () => ({ select: () => ({ single: () => Promise.resolve(result) }) }) };
}

function queryBuilder(result) {
  const calls = [];
  const record = (name) => (...args) => { calls.push([name, args]); return builder; };
  const builder = {
    select: record("select"), order: record("order"), limit: record("limit"),
    eq: record("eq"), ilike: record("ilike"), lt: record("lt"),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  builder.__calls = calls;
  return builder;
}

beforeEach(() => {
  vi.clearAllMocks();
  getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
});

describe("chat.send", () => {
  it("sends normally when there's no error", async () => {
    from.mockReturnValueOnce(insertChain({ data: { id: "m1" }, error: null }));
    const msg = await chatApi.send("c1", { type: "text", text: "hi" });
    expect(msg).toEqual({ id: "m1" });
  });

  it("retries once after a 42501 by refreshing the session first", async () => {
    from
      .mockReturnValueOnce(insertChain({ data: null, error: { code: "42501", message: "rls" } }))
      .mockReturnValueOnce(insertChain({ data: { id: "m2" }, error: null }));
    refreshSession.mockResolvedValue({ error: null });
    const msg = await chatApi.send("c1", { type: "text", text: "hi" });
    expect(refreshSession).toHaveBeenCalled();
    expect(msg).toEqual({ id: "m2" });
  });

  it("throws immediately for a non-42501 error, without retrying", async () => {
    from.mockReturnValueOnce(insertChain({ data: null, error: { code: "23505", message: "duplicate" } }));
    await expect(chatApi.send("c1", { type: "text", text: "hi" })).rejects.toMatchObject({ code: "23505" });
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it("throws the original 42501 error if the session refresh itself fails", async () => {
    from.mockReturnValueOnce(insertChain({ data: null, error: { code: "42501", message: "rls" } }));
    refreshSession.mockResolvedValue({ error: { message: "refresh failed" } });
    await expect(chatApi.send("c1", { type: "text", text: "hi" })).rejects.toMatchObject({ code: "42501" });
  });

  it("throws the retry's own error if the retry insert fails too", async () => {
    from
      .mockReturnValueOnce(insertChain({ data: null, error: { code: "42501", message: "rls" } }))
      .mockReturnValueOnce(insertChain({ data: null, error: { code: "42501", message: "still failing" } }));
    refreshSession.mockResolvedValue({ error: null });
    await expect(chatApi.send("c1", { type: "text", text: "hi" })).rejects.toMatchObject({ message: "still failing" });
  });
});

describe("films.page (filter/cursor building — representative of the app's pagination pattern)", () => {
  it("applies no filters when none are given", async () => {
    const builder = queryBuilder({ data: [{ id: "f1" }], error: null });
    from.mockReturnValueOnce(builder);
    const rows = await filmsApi.page(null, {}, 12);
    expect(rows).toEqual([{ id: "f1" }]);
    expect(builder.__calls.map((c) => c[0])).toEqual(["select", "order", "limit"]);
  });

  it("treats a genre of 'ყველა' as no filter", async () => {
    const builder = queryBuilder({ data: [], error: null });
    from.mockReturnValueOnce(builder);
    await filmsApi.page(null, { genre: "ყველა" }, 12);
    expect(builder.__calls.some((c) => c[0] === "eq")).toBe(false);
  });

  it("applies a genre filter when given", async () => {
    const builder = queryBuilder({ data: [], error: null });
    from.mockReturnValueOnce(builder);
    await filmsApi.page(null, { genre: "დრამა" }, 12);
    expect(builder.__calls).toContainEqual(["eq", ["genre", "დრამა"]]);
  });

  it("applies a trimmed, wildcard-escaped search filter", async () => {
    const builder = queryBuilder({ data: [], error: null });
    from.mockReturnValueOnce(builder);
    await filmsApi.page(null, { search: "  100% good  " }, 12);
    expect(builder.__calls).toContainEqual(["ilike", ["title", "%100 good%"]]);
  });

  it("applies the cursor as a created_at < before filter, only when a cursor is given", async () => {
    const builder = queryBuilder({ data: [], error: null });
    from.mockReturnValueOnce(builder);
    await filmsApi.page("2026-01-01T00:00:00Z", {}, 12);
    expect(builder.__calls).toContainEqual(["lt", ["created_at", "2026-01-01T00:00:00Z"]]);
  });

  it("propagates a query error", async () => {
    const builder = queryBuilder({ data: null, error: { message: "boom" } });
    from.mockReturnValueOnce(builder);
    await expect(filmsApi.page(null, {}, 12)).rejects.toMatchObject({ message: "boom" });
  });
});
