// Stage 1 of app-wide i18n: core chrome only (nav, auth screen, settings
// headers) — the surfaces a user sees regardless of which tab they're on.
// Deeper per-feature copy (toasts, empty states, feed/market/music page text)
// stays Georgian for now and should be folded into this dictionary
// incrementally, the same way this stage was scoped.
//
// LANG is a plain module-level variable (not React state/context) — this
// mirrors how src/ui/core.jsx already handles the light/dark palette (`C`,
// changed via setTheme()): App.jsx holds the real React state and calls
// setLang(...) directly in its render body, which forces every consumer of
// t() to re-read the fresh value on the next render without any provider.

export const LANGS = [
  ["ka", "ქართული"],
  ["en", "English"],
  ["ru", "Русский"],
];

const readStoredLang = () => {
  try { const v = typeof localStorage !== "undefined" && localStorage.getItem("mz_lang"); return LANGS.some(([k]) => k === v) ? v : "ka"; }
  catch (e) { return "ka"; }
};

// initialized from localStorage directly (not just from App.jsx's settings
// state) so even the pre-login AuthScreen respects a previously chosen
// language, before any session/settings object exists.
export let LANG = readStoredLang();
export function setLang(l) {
  LANG = LANGS.some(([k]) => k === l) ? l : "ka";
  try { if (typeof localStorage !== "undefined") localStorage.setItem("mz_lang", LANG); } catch (e) {}
}

const DICT = {
  "nav.home": { ka: "მთავარი", en: "Home", ru: "Главная" },
  "nav.explore": { ka: "აღმოჩენა", en: "Explore", ru: "Обзор" },
  "nav.reels": { ka: "Reels", en: "Reels", ru: "Reels" },
  "nav.forum": { ka: "ფორუმი", en: "Forum", ru: "Форум" },
  "nav.market": { ka: "მარკეტი", en: "Market", ru: "Маркет" },
  "nav.games": { ka: "თამაშები", en: "Games", ru: "Игры" },
  "nav.movies": { ka: "ფილმები", en: "Movies", ru: "Фильмы" },
  "nav.music": { ka: "მუსიკა", en: "Music", ru: "Музыка" },
  "nav.groups": { ka: "ჯგუფები", en: "Groups", ru: "Группы" },
  "nav.map": { ka: "რუკა", en: "Map", ru: "Карта" },
  "nav.create": { ka: "შექმნა", en: "Create", ru: "Создать" },
  "nav.messages": { ka: "შეტყობინებები", en: "Messages", ru: "Сообщения" },
  "nav.notifications": { ka: "აქტივობა", en: "Activity", ru: "Активность" },
  "nav.progress": { ka: "პროგრესი", en: "Progress", ru: "Прогресс" },
  "nav.leaderboard": { ka: "რეიტინგი", en: "Leaderboard", ru: "Рейтинг" },
  "nav.profile": { ka: "პროფილი", en: "Profile", ru: "Профиль" },
  "nav.admin": { ka: "მოდერაცია", en: "Moderation", ru: "Модерация" },
  "nav.newPost": { ka: "ახალი პოსტი", en: "New post", ru: "Новый пост" },

  "auth.tagline": { ka: "ქართული სოციალური ქსელი", en: "A social network, done right", ru: "Социальная сеть" },
  "auth.signin": { ka: "შესვლა", en: "Log in", ru: "Вход" },
  "auth.signup": { ka: "რეგისტრაცია", en: "Sign up", ru: "Регистрация" },
  "auth.fullname": { ka: "სახელი და გვარი", en: "Full name", ru: "Имя и фамилия" },
  "auth.email": { ka: "ელ-ფოსტა", en: "Email", ru: "Эл. почта" },
  "auth.password": { ka: "პაროლი", en: "Password", ru: "Пароль" },
  "auth.createAccount": { ka: "ანგარიშის შექმნა", en: "Create account", ru: "Создать аккаунт" },
  "auth.footer": { ka: "Supabase-ით დაცული · შენი მონაცემები შენია", en: "Secured by Supabase · your data stays yours", ru: "Защищено Supabase · ваши данные принадлежат вам" },
  "auth.invitedBy": { ka: "მოწვეულია კოდით", en: "Invited with code", ru: "Приглашён по коду" },

  "settings.title": { ka: "პარამეტრები", en: "Settings", ru: "Настройки" },
  "settings.appearance": { ka: "ვიზუალი", en: "Appearance", ru: "Внешний вид" },
  "settings.language": { ka: "ენა", en: "Language", ru: "Язык" },
};

export function t(key) {
  const row = DICT[key];
  if (!row) return key;
  return row[LANG] || row.ka || key;
}
