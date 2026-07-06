import { describe, it, expect, afterEach } from "vitest";
import { t, setLang, LANGS } from "./i18n";

describe("LANGS", () => {
  it("lists the three supported languages", () => {
    expect(LANGS.map(([k]) => k)).toEqual(["ka", "en", "ru"]);
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
