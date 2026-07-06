import { describe, it, expect } from "vitest";
import { haversineKm } from "./geo";

describe("haversineKm", () => {
  it("is zero for identical coordinates", () => {
    expect(haversineKm([41.71, 44.78], [41.71, 44.78])).toBe(0);
  });

  it("computes the known distance between Tbilisi and Batumi (~260km)", () => {
    const tbilisi = [41.7151, 44.8271];
    const batumi = [41.6168, 41.6367];
    expect(haversineKm(tbilisi, batumi)).toBeGreaterThan(255);
    expect(haversineKm(tbilisi, batumi)).toBeLessThan(270);
  });

  it("is symmetric", () => {
    const a = [41.0, 44.0];
    const b = [42.5, 45.5];
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 10);
  });
});
