import { describe, it, expect, afterEach } from "vitest";
import { t, setLang, LANGS, DICT } from "./i18n";

describe("LANGS", () => {
  it("lists the three supported languages", () => {
    expect(LANGS.map(([k]) => k)).toEqual(["ka", "en", "ru"]);
  });
});

describe("DICT", () => {
  it("defines ka/en/ru for every key (no missing translations)", () => {
    const langs = LANGS.map(([k]) => k);
    const missing = [];
    for (const [key, row] of Object.entries(DICT)) {
      for (const l of langs) {
        if (!(l in row)) missing.push(`${key}.${l}`);
      }
    }
    expect(missing).toEqual([]);
  });

});

describe("t", () => {
  afterEach(() => setLang("ka"));

  it("returns the Georgian translation by default", () => {
    expect(t("nav.home")).toBe("მთავარი");
  });

  it("returns the translation for the active language after setLang", () => {
    setLang("en");
    expect(t("nav.home")).toBe("Home");
    setLang("ru");
    expect(t("nav.home")).toBe("Главная");
  });

  it("falls back to the key itself for a nonexistent key", () => {
    expect(t("no.such.key")).toBe("no.such.key");
  });

  it("falls back to the Georgian string when the active language's entry is empty", () => {
    setLang("en");
    expect(t("comment.replyToPost")).toBe("-ს");
  });

  it("ignores an unsupported language and resets to Georgian", () => {
    setLang("fr");
    expect(t("nav.home")).toBe("მთავარი");
  });
});
