import { describe, it, expect, vi, beforeEach } from "vitest";
import { runBackendChecks } from "./selfCheckBackend";

const state = vi.hoisted(() => ({
  hasSupabase: true,
  session: { data: { session: { user: { id: "u1" } } }, error: null },
  tableErrors: {},
}));

vi.mock("./supabase", () => ({
  get hasSupabase() { return state.hasSupabase; },
  supabase: {
    from: (table) => ({
      select: () => {
        const err = state.tableErrors[table] || null;
        const result = { error: err ? { message: err } : null };
        return { then: (res, rej) => Promise.resolve(result).then(res, rej), limit: () => Promise.resolve(result) };
      },
    }),
    auth: { getSession: () => Promise.resolve(state.session) },
  },
}));

beforeEach(() => {
  state.hasSupabase = true;
  state.session = { data: { session: { user: { id: "u1" } } }, error: null };
  state.tableErrors = {};
});

describe("runBackendChecks", () => {
  it("reports a single failing check when Supabase isn't configured", async () => {
    state.hasSupabase = false;
    const results = await runBackendChecks();
    expect(results).toHaveLength(1);
    expect(results[0].pass).toBe(false);
  });

  it("passes every check when the session is active and every table is reachable", async () => {
    const results = await runBackendChecks();
    expect(results.every((r) => r.pass)).toBe(true);
    expect(results.length).toBeGreaterThan(10);
  });

  it("fails the session check when there's no active session", async () => {
    state.session = { data: { session: null }, error: null };
    const results = await runBackendChecks();
    const sessionCheck = results.find((r) => r.name.includes("სესია"));
    expect(sessionCheck.pass).toBe(false);
  });

  it("fails only the affected table when a query errors (e.g. a migration that was never applied)", async () => {
    state.tableErrors["user_locations"] = 'relation "user_locations" does not exist';
    const results = await runBackendChecks();
    const failed = results.filter((r) => !r.pass);
    expect(failed).toHaveLength(1);
    expect(failed[0].name).toContain("user_locations");
    expect(failed[0].error).toContain("does not exist");
  });
});
