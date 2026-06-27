# 🔔 Push შეტყობინებების დაყენება — mzera

დახურულ აპში შეტყობინებები (Web Push). ყველაფერი **Supabase Dashboard-იდან** კეთდება — ტერმინალი/CLI არ სჭირდება.

VAPID გასაღებები უკვე დაგენერირდა:

```
VAPID_PUBLIC  = BMDSMbM00QyO6iFuTSxGACG9wpj7Lui5_mVfxnpi5cOmkypXUpg8cOB0DdUJNMN6qBEfchI9g7SG44S4GAtk8Lc
VAPID_PRIVATE = 3JyeOgFCU2sRm6A0Ze0yQg-uyWpo4KLCmMcapgiXEJk
```

> ⚠️ **PRIVATE გასაღები საიდუმლოა** — მხოლოდ Edge Function-ში (secret-ად). არასდროს ჩასვა client კოდში.
> PUBLIC გასაღები უკვე ჩაშენებულია `src/lib/push.js`-ში.

---

## ნაბიჯი 1 — ცხრილი (SQL Editor)

Supabase → **SQL Editor** → გაუშვი:

```sql
create table if not exists public.push_subscriptions (
  endpoint   text primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
create index if not exists push_sub_user_idx on public.push_subscriptions(user_id);
alter table public.push_subscriptions enable row level security;
drop policy if exists "push_sub_select_own" on public.push_subscriptions;
create policy "push_sub_select_own" on public.push_subscriptions for select using (auth.uid() = user_id);
drop policy if exists "push_sub_insert_own" on public.push_subscriptions;
create policy "push_sub_insert_own" on public.push_subscriptions for insert with check (auth.uid() = user_id);
drop policy if exists "push_sub_update_own" on public.push_subscriptions;
create policy "push_sub_update_own" on public.push_subscriptions for update using (auth.uid() = user_id);
drop policy if exists "push_sub_delete_own" on public.push_subscriptions;
create policy "push_sub_delete_own" on public.push_subscriptions for delete using (auth.uid() = user_id);
```

---

## ნაბიჯი 2 — Edge Function

Supabase → **Edge Functions** → **Deploy a new function** (Dashboard-ის Editor-ით).
- სახელი: **`push`**
- ჩასვი მთლიანი კოდი ფაილიდან `supabase/functions/push/index.ts` (zip-შია)
- Deploy

---

## ნაბიჯი 3 — Secrets

Supabase → **Edge Functions → Secrets** → დაამატე:

| სახელი | მნიშვნელობა |
|---|---|
| `VAPID_PUBLIC` | `BMDSMbM00QyO6iFuTSxGACG9wpj7Lui5_mVfxnpi5cOmkypXUpg8cOB0DdUJNMN6qBEfchI9g7SG44S4GAtk8Lc` |
| `VAPID_PRIVATE` | `3JyeOgFCU2sRm6A0Ze0yQg-uyWpo4KLCmMcapgiXEJk` |
| `VAPID_SUBJECT` | `mailto:შენი@email.com` |

> `SUPABASE_URL` და `SUPABASE_SERVICE_ROLE_KEY` ავტომატურად არსებობს — ხელით არ ამატებ.

---

## ნაბიჯი 4 — Database Webhooks (გამშვები)

Supabase → **Database → Webhooks → Create a new hook**. გააკეთე **ორი**:

**Hook 1 — notifications:**
- Table: `notifications` · Events: ✅ **Insert**
- Type: **HTTP Request** → **POST**
- URL: `https://<PROJECT-REF>.supabase.co/functions/v1/push`
- Headers: `Content-Type: application/json` და `Authorization: Bearer <SERVICE_ROLE_KEY>`

**Hook 2 — messages:** (იგივე URL + Headers)
- Table: `messages` · Events: ✅ **Insert**

> `<PROJECT-REF>` = პროექტის ID (URL-ში). `<SERVICE_ROLE_KEY>` = Project Settings → API → `service_role`.

---

## ნაბიჯი 5 — აპის დეპლოი

```bash
git add . && git commit -m "push notifications" && git push
```

---

## ნაბიჯი 6 — ჩართვა და ტესტი

1. გახსენი აპი ტელეფონში (HTTPS / Vercel)
2. **პარამეტრები → შეტყობინებები → Push შეტყობინებები → ჩართვა** → დართე ნებართვა
3. სხვა ანგარიშიდან მოგწერე/მოგიწონე
4. **დახურე აპი** → notification მოვა 🎉

### iOS
iPhone-ზე Web Push მუშაობს **მხოლოდ** "Add to Home Screen"-ით დაინსტალირებულზე (iOS 16.4+).

## პრობლემები?
- არ მოდის → Edge Function **Logs** ნახე (secret/webhook URL/key შეამოწმე)
- "denied" → ბრაუზერმა დაბლოკა; ჩართე საიტის ნებართვებში
- Android Chrome საუკეთესოდ მუშაობს (HTTPS აუცილებელია)
