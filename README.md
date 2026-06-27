# mzera 🇬🇪

ქართული სოციალური ქსელი — **React 18 + Vite + Tailwind + Supabase**.

Feed, Stories (რედაქტორი ფილტრებით), Reels, DM-ები (მედია/ვოის/ლოკაცია/ჯგუფები),
ფორუმი, მარკეტი (checkout + reviews), რუკა, ჯგუფები/ივენთები, follow სისტემა,
რეაქციები + გამოკითხვები, ძებნა, შეტყობინებები, ლიდერბორდი + analytics, XP/streak,
Settings + privacy, მოდერაცია — ღია/მუქი თემით.

---

## 🚀 გაშვება (ლოკალურად)

```bash
npm install
npm run dev
```

გაიხსნება `http://localhost:5173`. **ბექენდის გარეშეც მუშაობს** — აპი ეშვება demo
რეჟიმში (in-memory მონაცემები). ანუ უბრალოდ install + dev და მზადაა.

build პროდაქშენისთვის:

```bash
npm run build      # → dist/
npm run preview
```

---

## 🗄️ Supabase backend-ის დაკავშირება

1. შექმენი პროექტი [supabase.com](https://supabase.com)-ზე.
2. Dashboard → **SQL Editor** → New query → ჩასვი `supabase/schema.sql`-ის შიგთავსი → **Run**.
   ეს შექმნის ყველა ცხრილს, RLS პოლისებს, триггерებს (ავტო-შეტყობინებები),
   `profile_stats` view-ს, realtime-ს ჩატისთვის/შეტყობინებებისთვის და `media` storage bucket-ს.
3. Dashboard → **Project Settings → API** — დააკოპირე `Project URL` და `anon public` key.
4. პროექტის root-ში შექმენი `.env` ფაილი (`.env.example`-დან):

   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
   ```

5. გადატვირთე dev სერვერი. `src/lib/supabase.js` ავტომატურად ააქტიურებს Supabase-ს
   (თუ env გაწერილია), წინააღმდეგ შემთხვევაში რჩება demo რეჟიმში.

### Auth (Email/Password)
Dashboard → **Authentication → Providers → Email** ჩართე. რეგისტრაციისას
`supabase/schema.sql`-ის `handle_new_user` триггер ავტომატურად შექმნის `profiles` ჩანაწერს.
(განვითარებისთვის შეგიძლია "Confirm email" გამორთო.)

---

## 🔌 როგორ გადავიდე demo → live მონაცემებზე

`src/lib/api.js` უკვე შეიცავს ყველა საჭირო ფუნქციას (`auth`, `profiles`, `posts`,
`reactions`, `polls`, `comments`, `follows`, `chat`, `notifications`, `leaderboard`,
`market`, `storage`) — სქემის შესაბამისად.

`src/App.jsx` ამჟამად იყენებს `useState`-ს seed მონაცემებით. live-ზე გადასასვლელად
თანდათან ჩაანაცვლე handler-ები `api.js`-ის გამოძახებებით, მაგ.:

```js
import { posts, reactions, chat, notifications } from "./lib/api";

// feed-ის ჩატვირთვა
const feed = await posts.feed();

// მოწონება/რეაქცია
await reactions.toggle(postId, "❤️");

// realtime ჩატი
chat.subscribe(conversationId, (msg) => { /* დაამატე msg state-ში */ });

// realtime შეტყობინებები
notifications.subscribe(myUserId, (n) => { /* badge++ */ });
```

ასე შეგიძლია ეკრან-ეკრან გადაიყვანო (ჯერ Auth + Feed, მერე ჩატი, follow-ები და ა.შ.)
ისე, რომ აპი არასდროს გატყდეს.

---

### ✅ რა არის უკვე live (ბაზასთან დაკავშირებული)
- **Auth** — შესვლა / რეგისტრაცია, სესია, პროფილი
- **Feed** — პოსტი, მოწონება/რეაქცია, კომენტარი (per-user like state + კომენტარები იტვირთება)
- **Follow** — გამოწერა/გაუქმება + ავტომატური notification
- **ჩატი** — ცოცხალი მესიჯები realtime-ით, ჯგუფების შექმნა, ხალხის ძებნა
- **შეტყობინებები** — realtime (ახალი like/comment/follow მაშინვე ჩნდება)
- **Stories** — იტვირთება ბაზიდან, ახლის დამატება (ფილტრი/ტექსტი/სტიკერი)
- **Reels** — იტვირთება ბაზიდან, მოწონება ინახება
- **Marketplace** — განცხადებები, ახლის დადება, შეფასებები (reviews), ყიდვა (order)
- **Groups / Events** — გაწევრება, ჯგუფში პოსტი, ივენთზე RSVP
- **მედიის ატვირთვა** — Supabase Storage (პოსტი, Story, განცხადება, ჯგუფის პოსტი)

- **Forum** — თემები, პასუხები, ხმის მიცემა (votes) — ბაზაზე
- **Reels-ის შექმნა** — ვიდეოს ატვირთვა + caption (Storage), reels ვიდეოდ უკრავს

ანუ **ყველა ფუნქცია ბაზაზეა — 100% live**. 🎉

> ⚠️ **მნიშვნელოვანი:** ამ ვერსიაში `schema.sql`-ს **ახალი ცხრილები** დაემატა (Forum: `threads`, `thread_replies`, `thread_votes`). თუ Supabase უკვე გამართული გაქვს, **ხელახლა გაუშვი** `supabase/schema.sql` SQL Editor-ში (იდემპოტენტურია — უსაფრთხოდ შეიძლება).

---

## 📁 სტრუქტურა

```
mzera/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example
├── src/
│   ├── main.jsx          # React entry
│   ├── index.css         # Tailwind
│   ├── App.jsx           # მთლიანი UI (ერთ ფაილში — იხ. შენიშვნა ქვემოთ)
│   └── lib/
│       ├── supabase.js   # Supabase client
│       └── api.js        # ყველა query/mutation ფუნქცია
└── supabase/
    └── schema.sql        # სრული backend (tables + RLS + triggers + storage)
```

> **შენიშვნა UI-ზე:** UI შეგნებულად ერთ `App.jsx`-შია — ეს Android → GitHub Mobile →
> Vercel workflow-სთვის ყველაზე საიმედოა (ცალკეული ფაილები/დირექტორიები ხშირად
> ჩუმად ვარდება build-ისას). თუ გინდა კომპონენტებად დაშლა (`src/components/...`),
> შემიძლია გავაკეთო — უბრალოდ მითხარი.

---

## ▲ Vercel-ზე დეპლოი

1. ატვირთე repo GitHub-ზე.
2. Vercel → New Project → აირჩიე repo (Framework: **Vite**).
3. Environment Variables-ში ჩაამატე `VITE_SUPABASE_URL` და `VITE_SUPABASE_ANON_KEY`.
4. Deploy. (Build: `npm run build`, Output: `dist`)

---

დამზადებულია gigorgi-სთვის · mzera v1.0
