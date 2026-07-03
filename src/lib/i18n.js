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

  "theme.light": { ka: "ღია", en: "Light", ru: "Светлая" },
  "theme.dark": { ka: "მუქი", en: "Dark", ru: "Тёмная" },

  "thread.edit": { ka: "თემის რედაქტირება", en: "Edit thread", ru: "Редактировать тему" },
  "thread.new": { ka: "ახალი თემა", en: "New thread", ru: "Новая тема" },
  "action.save": { ka: "შენახვა", en: "Save", ru: "Сохранить" },
  "action.publish": { ka: "გამოქვეყნება", en: "Publish", ru: "Опубликовать" },
  "action.create": { ka: "შექმნა", en: "Create", ru: "Создать" },
  "thread.titlePh": { ka: "სათაური…", en: "Title…", ru: "Заголовок…" },
  "thread.bodyPh": { ka: "დაწერე დეტალურად…", en: "Write the details…", ru: "Напиши подробнее…" },

  "checkout.orderReceived": { ka: "შეკვეთა მიღებულია! 🎉", en: "Order received! 🎉", ru: "Заказ получен! 🎉" },
  "checkout.orderConfirmedPre": { ka: "შეკვეთა ", en: "Order ", ru: "Заказ " },
  "checkout.orderConfirmedPost": { ka: " გაფორმდა. გამყიდველი მალე დაგიკავშირდება.", en: " is placed. The seller will contact you soon.", ru: " оформлен. Продавец скоро с вами свяжется." },
  "checkout.done": { ka: "მზადაა", en: "Done", ru: "Готово" },
  "checkout.pay": { ka: "გადახდა", en: "Checkout", ru: "Оплата" },
  "checkout.delivery": { ka: "მიწოდება", en: "Delivery", ru: "Доставка" },
  "checkout.pickup": { ka: "თვითგატანა", en: "Pickup", ru: "Самовывоз" },
  "checkout.free": { ka: "უფასო", en: "Free", ru: "Бесплатно" },
  "checkout.addressPh": { ka: "მისამართი (ქუჩა, ნომერი)", en: "Address (street, number)", ru: "Адрес (улица, номер)" },
  "checkout.card": { ka: "ბარათი", en: "Card", ru: "Карта" },
  "checkout.cash": { ka: "ნაღდი", en: "Cash", ru: "Наличные" },
  "checkout.cardSample": { ka: "ბარათი •••• 4242", en: "Card •••• 4242", ru: "Карта •••• 4242" },
  "checkout.cashSample": { ka: "ნაღდი მიწოდებისას", en: "Cash on delivery", ru: "Наличными при получении" },
  "checkout.paymentMethod": { ka: "გადახდის მეთოდი", en: "Payment method", ru: "Способ оплаты" },
  "checkout.item": { ka: "ნივთი", en: "Item", ru: "Товар" },
  "checkout.total": { ka: "ჯამი", en: "Total", ru: "Итого" },
  "checkout.confirm": { ka: "შეკვეთის დადასტურება", en: "Confirm order", ru: "Подтвердить заказ" },

  "listing.edit": { ka: "ნივთის რედაქტირება", en: "Edit item", ru: "Редактировать товар" },
  "listing.sell": { ka: "გაყიდე ნივთი", en: "Sell an item", ru: "Продать вещь" },
  "listing.addMedia": { ka: "ფოტო/ვიდეო", en: "Photo/video", ru: "Фото/видео" },
  "listing.addMediaHint": { ka: "დაამატე ფოტო ან ვიდეო 📷", en: "Add a photo or video 📷", ru: "Добавь фото или видео 📷" },
  "listing.whatSelling": { ka: "რას ყიდი?", en: "What are you selling?", ru: "Что продаёшь?" },
  "listing.price": { ka: "ფასი", en: "Price", ru: "Цена" },
  "listing.descPh": { ka: "აღწერა (მდგომარეობა, დეტალები…)", en: "Description (condition, details…)", ru: "Описание (состояние, детали…)" },

  "picker.searchPeoplePh": { ka: "მოძებნე ხალხი…", en: "Search people…", ru: "Поиск людей…" },
  "picker.notFound": { ka: "ვერ მოიძებნა", en: "Not found", ru: "Не найдено" },

  "follow.following": { ka: "მიჰყვები", en: "Following", ru: "Подписан" },
  "follow.follow": { ka: "მიყევი", en: "Follow", ru: "Подписаться" },
  "follow.followers": { ka: "მიმდევრები", en: "Followers", ru: "Подписчики" },
  "follow.followingTab": { ka: "მიჰყვება", en: "Following", ru: "Подписки" },

  "empty.title": { ka: "ცარიელია", en: "Nothing here", ru: "Пусто" },
  "empty.nobodyYet": { ka: "ჯერ არავინ.", en: "No one yet.", ru: "Пока никого." },

  "time.now": { ka: "ახლა", en: "now", ru: "сейчас" },
  "time.min": { ka: "წთ", en: "m", ru: "мин" },
  "time.hour": { ka: "სთ", en: "h", ru: "ч" },
  "time.day": { ka: "დღ", en: "d", ru: "дн" },

  "notif.liked": { ka: "მოიწონა შენი პოსტი ❤️", en: "liked your post ❤️", ru: "оценил(а) твой пост ❤️" },
  "notif.commented": { ka: "დააკომენტარა შენი პოსტი 💬", en: "commented on your post 💬", ru: "прокомментировал(а) твой пост 💬" },
  "notif.followed": { ka: "გამოგყვა 👤", en: "followed you 👤", ru: "подписался(-ась) на тебя 👤" },
  "notif.tagged": { ka: "მოგიხსენია პოსტში", en: "mentioned you in a post", ru: "упомянул(а) тебя в посте" },
  "notif.publicApproved": { ka: "შენი საჯარო პოსტი დამტკიცდა ✅", en: "your public post was approved ✅", ru: "твой публичный пост одобрен ✅" },
  "notif.publicRejected": { ka: "შენი საჯარო პოსტი უარყოფილია ❌", en: "your public post was rejected ❌", ru: "твой публичный пост отклонён ❌" },
  "notif.announcement": { ka: "📢 განცხადება", en: "📢 Announcement", ru: "📢 Объявление" },
  "notif.fallback": { ka: "ახალი აქტივობა", en: "New activity", ru: "Новая активность" },
  "notif.likedShort": { ka: "მოიწონა შენი პოსტი", en: "liked your post", ru: "оценил(а) твой пост" },
  "notif.commentedShort": { ka: "დააკომენტარა", en: "commented", ru: "прокомментировал(а)" },
  "notif.followedShort": { ka: "გამოგყვა", en: "followed you", ru: "подписался(-ась) на тебя" },
  "notif.pageTitle": { ka: "აქტივობა", en: "Activity", ru: "Активность" },
  "notif.emptyTitle": { ka: "აქტივობა ჯერ არ არის", en: "No activity yet", ru: "Пока нет активности" },
  "notif.emptyDesc": { ka: "როცა ვინმე მოგიწონებს პოსტს, დააკომენტარებს ან გამოგყვება — აქ გამოჩნდება 🔔", en: "When someone likes your post, comments, or follows you — it'll show up here 🔔", ru: "Когда кто-то оценит твой пост, прокомментирует или подпишется — это появится здесь 🔔" },

  "highlight.uploadFailed": { ka: "ფოტო ვერ აიტვირთა", en: "Couldn't upload the photo", ru: "Не удалось загрузить фото" },
  "highlight.createFailedPre": { ka: "ვერ შეიქმნა: ", en: "Couldn't create: ", ru: "Не удалось создать: " },
  "highlight.titlePh": { ka: "მაგ. მოგზაურობა", en: "e.g. Travel", ru: "напр. Путешествие" },

  "reelcomments.addPh": { ka: "დაამატე კომენტარი…", en: "Add a comment…", ru: "Добавить комментарий…" },

  "reel.shareText": { ka: "ნახე ეს reel mzera-ზე", en: "Check out this reel on mzera", ru: "Смотри этот reel в mzera" },
  "link.copied": { ka: "ლინკი დაკოპირდა 🔗", en: "Link copied 🔗", ru: "Ссылка скопирована 🔗" },
  "link.prefix": { ka: "ლინკი: ", en: "Link: ", ru: "Ссылка: " },

  "video.tooLongPre": { ka: "ვიდეო გრძელია — მაქს. 3 წუთი (შენი: ", en: "Video is too long — max 3 min (yours: ", ru: "Видео слишком длинное — макс. 3 мин (у тебя: " },
  "video.tooLongPost": { ka: "წმ)", en: "s)", ru: "с)" },
  "video.uploadFailedPre": { ka: "ატვირთვა ვერ მოხერხდა: ", en: "Upload failed: ", ru: "Не удалось загрузить: " },
  "video.tryAgain": { ka: "სცადე თავიდან", en: "Try again", ru: "Попробуй снова" },

  "filter.normal": { ka: "ნორმ", en: "Normal", ru: "Обычный" },
  "filter.mono": { ka: "მონო", en: "Mono", ru: "Моно" },
  "filter.warm": { ka: "თბილი", en: "Warm", ru: "Тёплый" },
  "filter.cool": { ka: "ცივი", en: "Cool", ru: "Холодный" },
  "filter.vivid": { ka: "ვივიდი", en: "Vivid", ru: "Яркий" },
  "filter.fade": { ka: "ფეიდი", en: "Fade", ru: "Блёклый" },

  "msg.photo": { ka: "📷 ფოტო", en: "📷 Photo", ru: "📷 Фото" },
  "msg.voice": { ka: "🎤 ხმოვანი", en: "🎤 Voice", ru: "🎤 Голосовое" },
  "msg.file": { ka: "📄 ", en: "📄 ", ru: "📄 " },
  "msg.fileFallback": { ka: "ფაილი", en: "File", ru: "Файл" },
  "msg.location": { ka: "📍 ლოკაცია", en: "📍 Location", ru: "📍 Локация" },

  "highlight.new": { ka: "ახალი Highlight", en: "New Highlight", ru: "Новый Highlight" },
  "field.title": { ka: "სათაური", en: "Title", ru: "Название" },

  "rsvp.going": { ka: "მივდივარ", en: "Going", ru: "Иду" },
  "rsvp.maybe": { ka: "ფიქრობ", en: "Maybe", ru: "Может быть" },
  "rsvp.no": { ka: "ვერ", en: "Can't go", ru: "Не иду" },

  "mon.1": { ka: "იან", en: "Jan", ru: "янв" }, "mon.2": { ka: "თებ", en: "Feb", ru: "фев" }, "mon.3": { ka: "მარ", en: "Mar", ru: "мар" },
  "mon.4": { ka: "აპრ", en: "Apr", ru: "апр" }, "mon.5": { ka: "მაი", en: "May", ru: "май" }, "mon.6": { ka: "ივნ", en: "Jun", ru: "июн" },
  "mon.7": { ka: "ივლ", en: "Jul", ru: "июл" }, "mon.8": { ka: "აგვ", en: "Aug", ru: "авг" }, "mon.9": { ka: "სექ", en: "Sep", ru: "сен" },
  "mon.10": { ka: "ოქტ", en: "Oct", ru: "окт" }, "mon.11": { ka: "ნოე", en: "Nov", ru: "ноя" }, "mon.12": { ka: "დეკ", en: "Dec", ru: "дек" },
};

export function t(key) {
  const row = DICT[key];
  if (!row) return key;
  return row[LANG] || row.ka || key;
}
