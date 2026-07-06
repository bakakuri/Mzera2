import { describe, it, expect } from "vitest";
import { runSelfChecks } from "./selfCheck";
import { ME } from "../ui/core";
import { LANG } from "./i18n";

describe("runSelfChecks", () => {
  it("every check passes against the real bundle", () => {
    const failed = runSelfChecks().filter((r) => !r.pass);
    expect(failed).toEqual([]);
  });

  it("restores ME and LANG to their original values afterward", () => {
    const meBefore = ME;
    const langBefore = LANG;
    runSelfChecks();
    expect(ME).toBe(meBefore);
    expect(LANG).toBe(langBefore);
  });

  it("returns a name and a boolean pass flag for every check", () => {
    const results = runSelfChecks();
    expect(results.length).toBeGreaterThan(10);
    results.forEach((r) => {
      expect(typeof r.name).toBe("string");
      expect(typeof r.pass).toBe("boolean");
    });
  });
});
