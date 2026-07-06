// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useToast } from "./useToast";

describe("useToast", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("flash sets the toast message, then clears it after ~1.8s", () => {
    const { result } = renderHook(() => useToast());
    act(() => result.current.flash("გამარჯობა"));
    expect(result.current.toast).toBe("გამარჯობა");
    act(() => vi.advanceTimersByTime(1800));
    expect(result.current.toast).toBeNull();
  });

  it("dbErr flashes a friendly message for rate-limit errors instead of the raw banner", () => {
    const { result } = renderHook(() => useToast());
    act(() => result.current.dbErr("რაღაც")({ message: "rate_limit exceeded, slow down" }));
    expect(result.current.toast).toBeTruthy();
    expect(result.current.dbError).toBeNull();
  });

  it("dbErr sets a formatted error banner for non-rate-limit errors, including hint/code", () => {
    const { result } = renderHook(() => useToast());
    act(() => result.current.dbErr("შეტყობინება")({ message: "boom", hint: "check RLS", code: "42501" }));
    expect(result.current.dbError).toContain("შეტყობინება: boom");
    expect(result.current.dbError).toContain("hint: check RLS");
    expect(result.current.dbError).toContain("code: 42501");
  });

  it("dbErr falls back to JSON.stringify when the error has no message", () => {
    const { result } = renderHook(() => useToast());
    act(() => result.current.dbErr("X")({ code: "500" }));
    expect(result.current.dbError).toContain("X: ");
    expect(result.current.dbError).toContain("code: 500");
  });
});
