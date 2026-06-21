-- ============================================================================
--  mzera — Supabase backend schema
--  გაუშვი Supabase Dashboard → SQL Editor → New query → ჩასვი და Run.
--  (იდემპოტენტურია: უსაფრთხოდ შეიძლება ხელახლა გაშვება)
-- ============================================================================

create extension if not exists "pgcrypto";

-- ============================================================================
--  PROFILES
-- ============================================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null,
  name        text not null default '',
  bio         text default '',
  avatar_url  text,
  location    text,
  website     text,
  verified    boolean not null default false,
  is_admin    boolean not null default false,
  xp          integer not null default 100,
  created_at  timestamptz not null default now()
);

-- ახალი მომხმარებლის რეგისტრაციისას ავტომატურად შეიქმნას profile
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'name', '')
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- XP-ის მომატება
create or replace function public.add_xp(uid uuid, amount int)
returns void language sql security definer set search_path = public as $$
  update public.profiles set xp = xp + amount where id = uid;
$$;

-- ============================================================================
--  POSTS + POLLS
-- ============================================================================
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles(id) on delete cascade,
  text        text,
  image_url   text,
  has_poll    boolean not null default false,
  hidden      boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists posts_author_idx on public.posts(author_id);
create index if not exists posts_created_idx on public.posts(created_at desc);

create table if not exists public.poll_options (
  id       uuid primary key default gen_random_uuid(),
  post_id  uuid not null references public.posts(id) on delete cascade,
  idx      int not null,
  text     text not null
);

create table if not exists public.poll_votes (
  post_id     uuid not null references public.posts(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  option_idx  int not null,
  created_at  timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- ============================================================================
--  COMMENTS / REACTIONS
-- ============================================================================
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  text       text not null,
  created_at timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments(post_id);

create table if not exists public.reactions (
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  emoji      text not null default '❤️',
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- ============================================================================
--  FOLLOWS
-- ============================================================================
create table if not exists public.follows (
  follower_id  uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

-- ============================================================================
--  MESSAGES / CHAT (1:1 + ჯგუფური)
-- ============================================================================
create table if not exists public.conversations (
  id         uuid primary key default gen_random_uuid(),
  is_group   boolean not null default false,
  name       text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  type            text not null default 'text',  -- text | image | voice | doc | location
  text            text,
  media_url       text,
  doc_name        text,
  doc_size        text,
  voice_dur       int,
  place           text,
  created_at      timestamptz not null default now()
);
create index if not exists messages_conv_idx on public.messages(conversation_id, created_at);

-- membership helper (RLS-ის რეკურსიის თავიდან ასაცილებლად)
create or replace function public.is_conversation_member(conv uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = conv and user_id = auth.uid()
  );
$$;

-- ============================================================================
--  STORIES / REELS
-- ============================================================================
create table if not exists public.stories (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references public.profiles(id) on delete cascade,
  image_url  text not null,
  filter     text default 'none',
  text       text,
  stickers   jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create table if not exists public.reels (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references public.profiles(id) on delete cascade,
  video_url  text,
  thumb_url  text,
  caption    text,
  audio      text,
  created_at timestamptz not null default now()
);

create table if not exists public.reel_likes (
  reel_id uuid not null references public.reels(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (reel_id, user_id)
);

-- ============================================================================
--  GROUPS / EVENTS
-- ============================================================================
create table if not exists public.groups (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  cover_url  text,
  category   text,
  about      text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id  uuid not null references public.profiles(id) on delete cascade,
  primary key (group_id, user_id)
);

create table if not exists public.group_posts (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  text       text,
  image_url  text,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  cover_url  text,
  starts_at  timestamptz,
  location   text,
  about      text,
  host_id    uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.event_rsvps (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id  uuid not null references public.profiles(id) on delete cascade,
  status   text not null default 'going', -- going | maybe | no
  primary key (event_id, user_id)
);

-- ============================================================================
--  MARKETPLACE
-- ============================================================================
create table if not exists public.listings (
  id          uuid primary key default gen_random_uuid(),
  seller_id   uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  price       numeric not null default 0,
  description text,
  category    text,
  image_url   text,
  location    text,
  sold        boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  seller_id  uuid not null references public.profiles(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  rating     int not null check (rating between 1 and 5),
  text       text,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id   uuid not null references public.profiles(id) on delete cascade,
  delivery   text,
  payment    text,
  address    text,
  total      numeric not null default 0,
  status     text not null default 'placed',
  created_at timestamptz not null default now()
);

-- ============================================================================
--  NOTIFICATIONS  (ავტომატური триггерებით)
-- ============================================================================
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,  -- ვის ეგზავნება
  type       text not null,  -- like | comment | follow | mention
  from_id    uuid references public.profiles(id) on delete cascade,           -- ვინ გამოიწვია
  post_id    uuid references public.posts(id) on delete cascade,
  text       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notif_user_idx on public.notifications(user_id, created_at desc);

-- like → notification
create or replace function public.notify_on_reaction()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  select author_id into owner from public.posts where id = new.post_id;
  if owner is not null and owner <> new.user_id then
    insert into public.notifications (user_id, type, from_id, post_id)
    values (owner, 'like', new.user_id, new.post_id);
  end if;
  return new;
end; $$;
drop trigger if exists trg_notify_reaction on public.reactions;
create trigger trg_notify_reaction after insert on public.reactions
  for each row execute function public.notify_on_reaction();

-- comment → notification
create or replace function public.notify_on_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  select author_id into owner from public.posts where id = new.post_id;
  if owner is not null and owner <> new.author_id then
    insert into public.notifications (user_id, type, from_id, post_id, text)
    values (owner, 'comment', new.author_id, new.post_id, new.text);
  end if;
  return new;
end; $$;
drop trigger if exists trg_notify_comment on public.comments;
create trigger trg_notify_comment after insert on public.comments
  for each row execute function public.notify_on_comment();

-- follow → notification
create or replace function public.notify_on_follow()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, type, from_id)
  values (new.following_id, 'follow', new.follower_id);
  return new;
end; $$;
drop trigger if exists trg_notify_follow on public.follows;
create trigger trg_notify_follow after insert on public.follows
  for each row execute function public.notify_on_follow();

-- ============================================================================
--  MODERATION
-- ============================================================================
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  type        text not null,  -- post | user
  target_id   uuid not null,
  reason      text,
  reporter_id uuid references public.profiles(id) on delete set null,
  status      text not null default 'open',
  created_at  timestamptz not null default now()
);

-- ============================================================================
--  FORUM (threads / replies / votes)
-- ============================================================================
create table if not exists public.threads (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references public.profiles(id) on delete cascade,
  category   text,
  title      text not null,
  body       text,
  created_at timestamptz not null default now()
);
create index if not exists threads_created_idx on public.threads(created_at desc);

create table if not exists public.thread_replies (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references public.threads(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  text       text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.thread_votes (
  thread_id uuid not null references public.threads(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  primary key (thread_id, user_id)
);

alter table public.threads        enable row level security;
alter table public.thread_replies enable row level security;
alter table public.thread_votes   enable row level security;

drop policy if exists threads_read on public.threads;
create policy threads_read on public.threads for select using (true);
create policy threads_insert on public.threads for insert with check (auth.uid() = author_id);
create policy threads_delete on public.threads for delete using (auth.uid() = author_id);
create policy treplies_read on public.thread_replies for select using (true);
create policy treplies_insert on public.thread_replies for insert with check (auth.uid() = author_id);
create policy tvotes_read on public.thread_votes for select using (true);
create policy tvotes_insert on public.thread_votes for insert with check (auth.uid() = user_id);
create policy tvotes_delete on public.thread_votes for delete using (auth.uid() = user_id);

-- ============================================================================
--  VIEW: profile_stats (followers / following / posts)
-- ============================================================================
create or replace view public.profile_stats as
select
  p.id,
  p.username,
  p.name,
  p.xp,
  (select count(*) from public.follows f where f.following_id = p.id) as follower_count,
  (select count(*) from public.follows f where f.follower_id  = p.id) as following_count,
  (select count(*) from public.posts   o where o.author_id    = p.id and not o.hidden) as post_count
from public.profiles p;

-- ============================================================================
--  ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles            enable row level security;
alter table public.posts               enable row level security;
alter table public.poll_options        enable row level security;
alter table public.poll_votes          enable row level security;
alter table public.comments            enable row level security;
alter table public.reactions           enable row level security;
alter table public.follows             enable row level security;
alter table public.conversations       enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages            enable row level security;
alter table public.stories             enable row level security;
alter table public.reels               enable row level security;
alter table public.reel_likes          enable row level security;
alter table public.groups              enable row level security;
alter table public.group_members       enable row level security;
alter table public.group_posts         enable row level security;
alter table public.events              enable row level security;
alter table public.event_rsvps         enable row level security;
alter table public.listings            enable row level security;
alter table public.reviews             enable row level security;
alter table public.orders              enable row level security;
alter table public.notifications       enable row level security;
alter table public.reports             enable row level security;

-- helper: ფლობს თუ არა მომხმარებელი row-ს ველის მიხედვით
-- (პოლისები ცალ-ცალკე იწერება ქვემოთ)

-- PROFILES: ყველა კითხულობს, საკუთარს არედაქტირებ
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select using (true);
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update using (auth.uid() = id);

-- POSTS: ყველა კითხულობს (არა დამალულს); საკუთარს ქმნი/შლი
drop policy if exists posts_read on public.posts;
create policy posts_read on public.posts for select using (not hidden or author_id = auth.uid());
drop policy if exists posts_insert on public.posts;
create policy posts_insert on public.posts for insert with check (auth.uid() = author_id);
drop policy if exists posts_update on public.posts;
create policy posts_update on public.posts for update using (auth.uid() = author_id);
drop policy if exists posts_delete on public.posts;
create policy posts_delete on public.posts for delete using (auth.uid() = author_id);

-- POLL OPTIONS / VOTES
drop policy if exists poll_opts_read on public.poll_options;
create policy poll_opts_read on public.poll_options for select using (true);
drop policy if exists poll_opts_insert on public.poll_options;
create policy poll_opts_insert on public.poll_options for insert with check (
  exists (select 1 from public.posts where id = post_id and author_id = auth.uid())
);
drop policy if exists poll_votes_rw on public.poll_votes;
create policy poll_votes_read on public.poll_votes for select using (true);
create policy poll_votes_insert on public.poll_votes for insert with check (auth.uid() = user_id);

-- COMMENTS
drop policy if exists comments_read on public.comments;
create policy comments_read on public.comments for select using (true);
create policy comments_insert on public.comments for insert with check (auth.uid() = author_id);
create policy comments_delete on public.comments for delete using (auth.uid() = author_id);

-- REACTIONS
drop policy if exists reactions_read on public.reactions;
create policy reactions_read on public.reactions for select using (true);
create policy reactions_insert on public.reactions for insert with check (auth.uid() = user_id);
create policy reactions_update on public.reactions for update using (auth.uid() = user_id);
create policy reactions_delete on public.reactions for delete using (auth.uid() = user_id);

-- FOLLOWS
drop policy if exists follows_read on public.follows;
create policy follows_read on public.follows for select using (true);
create policy follows_insert on public.follows for insert with check (auth.uid() = follower_id);
create policy follows_delete on public.follows for delete using (auth.uid() = follower_id);

-- CONVERSATIONS: მხოლოდ წევრები
drop policy if exists conv_read on public.conversations;
create policy conv_read on public.conversations for select using (public.is_conversation_member(id));
create policy conv_insert on public.conversations for insert with check (auth.uid() = created_by);

-- CONVERSATION MEMBERS
drop policy if exists conv_mem_read on public.conversation_members;
create policy conv_mem_read on public.conversation_members for select using (public.is_conversation_member(conversation_id));
create policy conv_mem_insert on public.conversation_members for insert with check (
  user_id = auth.uid() or public.is_conversation_member(conversation_id)
);

-- MESSAGES: მხოლოდ წევრები კითხულობენ/წერენ
drop policy if exists msg_read on public.messages;
create policy msg_read on public.messages for select using (public.is_conversation_member(conversation_id));
create policy msg_insert on public.messages for insert with check (
  auth.uid() = sender_id and public.is_conversation_member(conversation_id)
);

-- STORIES / REELS (public read, own write)
drop policy if exists stories_read on public.stories;
create policy stories_read on public.stories for select using (true);
create policy stories_insert on public.stories for insert with check (auth.uid() = author_id);
create policy stories_delete on public.stories for delete using (auth.uid() = author_id);

drop policy if exists reels_read on public.reels;
create policy reels_read on public.reels for select using (true);
create policy reels_insert on public.reels for insert with check (auth.uid() = author_id);
create policy reel_likes_read on public.reel_likes for select using (true);
create policy reel_likes_rw on public.reel_likes for insert with check (auth.uid() = user_id);
create policy reel_likes_del on public.reel_likes for delete using (auth.uid() = user_id);

-- GROUPS / EVENTS (public read, own/member write)
drop policy if exists groups_read on public.groups;
create policy groups_read on public.groups for select using (true);
create policy groups_insert on public.groups for insert with check (auth.uid() = created_by);
create policy gmem_read on public.group_members for select using (true);
create policy gmem_rw on public.group_members for insert with check (auth.uid() = user_id);
create policy gmem_del on public.group_members for delete using (auth.uid() = user_id);
create policy gposts_read on public.group_posts for select using (true);
create policy gposts_insert on public.group_posts for insert with check (auth.uid() = author_id);

create policy events_read on public.events for select using (true);
create policy events_insert on public.events for insert with check (auth.uid() = host_id);
create policy rsvp_read on public.event_rsvps for select using (true);
create policy rsvp_rw on public.event_rsvps for insert with check (auth.uid() = user_id);
create policy rsvp_up on public.event_rsvps for update using (auth.uid() = user_id);

-- MARKETPLACE
drop policy if exists listings_read on public.listings;
create policy listings_read on public.listings for select using (true);
create policy listings_insert on public.listings for insert with check (auth.uid() = seller_id);
create policy listings_update on public.listings for update using (auth.uid() = seller_id);
create policy reviews_read on public.reviews for select using (true);
create policy reviews_insert on public.reviews for insert with check (auth.uid() = author_id);
create policy orders_read on public.orders for select using (auth.uid() = buyer_id);
create policy orders_insert on public.orders for insert with check (auth.uid() = buyer_id);

-- NOTIFICATIONS: მხოლოდ შენი
drop policy if exists notif_read on public.notifications;
create policy notif_read on public.notifications for select using (auth.uid() = user_id);
create policy notif_update on public.notifications for update using (auth.uid() = user_id);

-- REPORTS: ქმნი; ხედავ ადმინი ან საკუთარს
drop policy if exists reports_insert on public.reports;
create policy reports_insert on public.reports for insert with check (auth.uid() = reporter_id);
create policy reports_read on public.reports for select using (
  auth.uid() = reporter_id or exists (select 1 from public.profiles where id = auth.uid() and is_admin)
);
create policy reports_update on public.reports for update using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin)
);

-- ============================================================================
--  REALTIME (live chat / notifications / presence)
-- ============================================================================
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.posts;
exception when duplicate_object then null; end $$;

-- ============================================================================
--  STORAGE (media bucket: avatars, post images, story media, voice notes)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists "media auth upload" on storage.objects;
create policy "media auth upload" on storage.objects
  for insert with check (
    bucket_id = 'media' and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "media owner delete" on storage.objects;
create policy "media owner delete" on storage.objects
  for delete using (
    bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
--  მზადაა! შემდეგი ნაბიჯები იხ. README.md
-- ============================================================================
