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
-- reply-to-a-comment threading: src/lib/api.js's comments.add()/forPosts() have
-- sent and read parent_id for a while (see PostCard's replyTo state in
-- feed.jsx), but it was never checked into this file — same class of gap as
-- banned/referral_code below.
alter table public.comments add column if not exists parent_id uuid references public.comments(id) on delete cascade;
create index if not exists comments_parent_idx on public.comments(parent_id);

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
--  FILMS  (user-submitted movie catalog: reviews + watchlist, Letterboxd-style)
-- ============================================================================
create table if not exists public.films (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  year        int,
  genre       text,
  poster_url  text,
  video_url   text,
  description text,
  created_at  timestamptz not null default now()
);
-- covers installs where films already existed before video_url was added
alter table public.films add column if not exists video_url text;

create table if not exists public.film_reviews (
  id         uuid primary key default gen_random_uuid(),
  film_id    uuid not null references public.films(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  rating     int not null check (rating between 1 and 5),
  text       text,
  created_at timestamptz not null default now()
);

-- one row per (film, user): status flips between watchlist/watched
create table if not exists public.film_watch (
  film_id    uuid not null references public.films(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  status     text not null check (status in ('watchlist', 'watched')),
  created_at timestamptz not null default now(),
  primary key (film_id, user_id)
);

-- ============================================================================
--  MUSIC  (user-submitted songs: genre/performer browse, online streaming)
-- ============================================================================
create table if not exists public.songs (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references public.profiles(id) on delete cascade,
  title      text not null,
  artist     text,
  genre      text,
  cover_url  text,
  audio_url  text not null,
  plays      int not null default 0,
  created_at timestamptz not null default now()
);

-- security definer so any listener can bump play count without a general
-- update policy that would let strangers edit title/artist/etc.
create or replace function public.increment_song_plays(p_song_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.songs set plays = plays + 1 where id = p_song_id;
end; $$;

-- ============================================================================
--  NOTIFICATIONS  (ავტომატური триггерებით)
-- ============================================================================
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,  -- ვის ეგზავნება
  type       text not null,  -- like | comment | reply | follow | mention | thread_reply | thread_activity | profile_view
  from_id    uuid references public.profiles(id) on delete cascade,           -- ვინ გამოიწვია
  post_id    uuid references public.posts(id) on delete cascade,
  text       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notif_user_idx on public.notifications(user_id, created_at desc);
-- thread_id (added further below, once public.threads exists — see FORUM
-- section) lets forum activity (thread_reply/thread_activity/mention-in-a-
-- thread) carry a reference with no post_id to hang off of.

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

-- shared by every insert trigger below that can carry free text (posts,
-- comments, thread titles/bodies, thread replies): finds every @handle in
-- the text and notifies the matching profile, skipping self-mentions.
create or replace function public.notify_mentions(p_text text, p_from_id uuid, p_post_id uuid, p_thread_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare h text; target uuid;
begin
  if p_text is null then return; end if;
  for h in select distinct lower(m[1]) from regexp_matches(p_text, '@([A-Za-z0-9_]+)', 'g') as m loop
    select id into target from public.profiles where lower(username) = h limit 1;
    if target is not null and target <> p_from_id then
      insert into public.notifications (user_id, type, from_id, post_id, thread_id, text)
      values (target, 'mention', p_from_id, p_post_id, p_thread_id, p_text);
    end if;
  end loop;
end;
$$;

-- new post → scan for @mentions (also covers group posts, which are just
-- posts with a group_id)
create or replace function public.notify_on_post()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_mentions(new.text, new.author_id, new.id, null);
  return new;
end; $$;
drop trigger if exists trg_notify_post on public.posts;
create trigger trg_notify_post after insert on public.posts
  for each row execute function public.notify_on_post();

-- comment → notification. Three things can happen on one new comment:
--  1) the post owner gets pinged (unchanged, existing behavior)
--  2) if it's a reply (parent_id set), the parent comment's author gets a
--     more specific 'reply' ping instead of a second redundant 'comment' one
--  3) everyone else who has already commented on this post ("also in the
--     discussion", Facebook-style) gets a single 'thread_activity' ping —
--     capped at one unread notification per (user, post) so a fast back-
--     and-forth doesn't spam everyone on every single reply
create or replace function public.notify_on_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid; parent_author uuid; participant uuid;
begin
  select author_id into owner from public.posts where id = new.post_id;

  if new.parent_id is not null then
    select author_id into parent_author from public.comments where id = new.parent_id;
  end if;

  if owner is not null and owner <> new.author_id then
    insert into public.notifications (user_id, type, from_id, post_id, text)
    values (owner, 'comment', new.author_id, new.post_id, new.text);
  end if;

  if parent_author is not null and parent_author <> new.author_id and parent_author is distinct from owner then
    insert into public.notifications (user_id, type, from_id, post_id, text)
    values (parent_author, 'reply', new.author_id, new.post_id, new.text);
  end if;

  for participant in
    select distinct author_id from public.comments
    where post_id = new.post_id
      and author_id <> new.author_id
      and author_id is distinct from owner
      and author_id is distinct from parent_author
  loop
    if not exists (
      select 1 from public.notifications
      where user_id = participant and type = 'thread_activity' and post_id = new.post_id and read = false
    ) then
      insert into public.notifications (user_id, type, from_id, post_id, text)
      values (participant, 'thread_activity', new.author_id, new.post_id, new.text);
    end if;
  end loop;

  perform public.notify_mentions(new.text, new.author_id, new.post_id, null);

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
-- forum activity (thread_reply/thread_activity/mention-in-a-thread) has no
-- post_id to hang off of; there's no per-thread deep view in the app yet, so
-- the client just routes any notification carrying a thread_id to the forum
-- tab rather than a specific thread.
alter table public.notifications add column if not exists thread_id uuid references public.threads(id) on delete cascade;

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

-- new forum thread → scan title+body for @mentions
create or replace function public.notify_on_thread()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_mentions(coalesce(new.title, '') || ' ' || coalesce(new.body, ''), new.author_id, null, new.id);
  return new;
end; $$;
drop trigger if exists trg_notify_thread on public.threads;
create trigger trg_notify_thread after insert on public.threads
  for each row execute function public.notify_on_thread();

-- forum reply → notifies the thread author, fans out a capped
-- 'thread_activity' ping to everyone else who already replied (same
-- "also in the discussion" idea as notify_on_comment), and scans for
-- @mentions. thread_replies has no parent_id (flat, no nested replies), so
-- there's no per-reply 'reply' notification here, only thread-level.
create or replace function public.notify_on_thread_reply()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid; participant uuid;
begin
  select author_id into owner from public.threads where id = new.thread_id;

  if owner is not null and owner <> new.author_id then
    insert into public.notifications (user_id, type, from_id, thread_id, text)
    values (owner, 'thread_reply', new.author_id, new.thread_id, new.text);
  end if;

  for participant in
    select distinct author_id from public.thread_replies
    where thread_id = new.thread_id
      and author_id <> new.author_id
      and author_id is distinct from owner
  loop
    if not exists (
      select 1 from public.notifications
      where user_id = participant and type = 'thread_activity' and thread_id = new.thread_id and read = false
    ) then
      insert into public.notifications (user_id, type, from_id, thread_id, text)
      values (participant, 'thread_activity', new.author_id, new.thread_id, new.text);
    end if;
  end loop;

  perform public.notify_mentions(new.text, new.author_id, null, new.thread_id);

  return new;
end; $$;
drop trigger if exists trg_notify_thread_reply on public.thread_replies;
create trigger trg_notify_thread_reply after insert on public.thread_replies
  for each row execute function public.notify_on_thread_reply();

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
alter table public.films               enable row level security;
alter table public.film_reviews        enable row level security;
alter table public.film_watch           enable row level security;
alter table public.songs               enable row level security;

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

-- FILMS: public read, own write/edit/delete
drop policy if exists films_read on public.films;
create policy films_read on public.films for select using (true);
drop policy if exists films_insert on public.films;
create policy films_insert on public.films for insert with check (auth.uid() = author_id);
drop policy if exists films_update on public.films;
create policy films_update on public.films for update using (auth.uid() = author_id);
drop policy if exists films_delete on public.films;
create policy films_delete on public.films for delete using (auth.uid() = author_id);

drop policy if exists film_reviews_read on public.film_reviews;
create policy film_reviews_read on public.film_reviews for select using (true);
drop policy if exists film_reviews_insert on public.film_reviews;
create policy film_reviews_insert on public.film_reviews for insert with check (auth.uid() = author_id);

-- FILM WATCH STATUS: read own + status is visible to everyone (like/rating parity),
-- but only the owner can set/change/clear their own status
drop policy if exists film_watch_read on public.film_watch;
create policy film_watch_read on public.film_watch for select using (true);
drop policy if exists film_watch_insert on public.film_watch;
create policy film_watch_insert on public.film_watch for insert with check (auth.uid() = user_id);
drop policy if exists film_watch_update on public.film_watch;
create policy film_watch_update on public.film_watch for update using (auth.uid() = user_id);
drop policy if exists film_watch_delete on public.film_watch;
create policy film_watch_delete on public.film_watch for delete using (auth.uid() = user_id);

-- SONGS: public read (streaming), own write/edit/delete. plays is bumped
-- only via the increment_song_plays() security-definer function above.
drop policy if exists songs_read on public.songs;
create policy songs_read on public.songs for select using (true);
drop policy if exists songs_insert on public.songs;
create policy songs_insert on public.songs for insert with check (auth.uid() = author_id);
drop policy if exists songs_update on public.songs;
create policy songs_update on public.songs for update using (auth.uid() = author_id);
drop policy if exists songs_delete on public.songs;
create policy songs_delete on public.songs for delete using (auth.uid() = author_id);

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
--  ADMIN FULL CONTROL + missing update/delete policies
--  (several tables only ever had insert/select policies, so their own owners'
--  edit/delete features were silently no-ops; this both fixes that and lets an
--  admin manage/edit/delete anything site-wide from the moderation panel)
-- ============================================================================
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and is_admin);
$$;

-- PROFILES: admins can now actually verify/promote/ban other users
-- (onSetVerified/onSetAdmin/setBanned go through a plain table update)
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update using (auth.uid() = id or public.is_admin());

-- POSTS
drop policy if exists posts_update on public.posts;
create policy posts_update on public.posts for update using (auth.uid() = author_id or public.is_admin());
drop policy if exists posts_delete on public.posts;
create policy posts_delete on public.posts for delete using (auth.uid() = author_id or public.is_admin());

-- COMMENTS (update policy never existed — comment editing was always a no-op)
drop policy if exists comments_update on public.comments;
create policy comments_update on public.comments for update using (auth.uid() = author_id or public.is_admin());
drop policy if exists comments_delete on public.comments;
create policy comments_delete on public.comments for delete using (auth.uid() = author_id or public.is_admin());

-- STORIES
drop policy if exists stories_delete on public.stories;
create policy stories_delete on public.stories for delete using (auth.uid() = author_id or public.is_admin());

-- THREADS / FORUM (update policy never existed — thread editing was always a no-op)
drop policy if exists threads_update on public.threads;
create policy threads_update on public.threads for update using (auth.uid() = author_id or public.is_admin());
drop policy if exists threads_delete on public.threads;
create policy threads_delete on public.threads for delete using (auth.uid() = author_id or public.is_admin());

-- REELS (update/delete never existed — reel editing/deleting was always a no-op,
-- even for the reel's own author)
drop policy if exists reels_update on public.reels;
create policy reels_update on public.reels for update using (auth.uid() = author_id or public.is_admin());
drop policy if exists reels_delete on public.reels;
create policy reels_delete on public.reels for delete using (auth.uid() = author_id or public.is_admin());

-- GROUPS (update/delete never existed — editing/deleting your own group was always a no-op)
drop policy if exists groups_update on public.groups;
create policy groups_update on public.groups for update using (auth.uid() = created_by or public.is_admin());
drop policy if exists groups_delete on public.groups;
create policy groups_delete on public.groups for delete using (auth.uid() = created_by or public.is_admin());

-- GROUP MEMBERS: owners approving join requests (update) or kicking someone else
-- (delete) never had a matching policy — those buttons were always no-ops
drop policy if exists gmem_update on public.group_members;
create policy gmem_update on public.group_members for update using (
  exists (select 1 from public.groups g where g.id = group_id and g.created_by = auth.uid()) or public.is_admin()
);
drop policy if exists gmem_del on public.group_members;
create policy gmem_del on public.group_members for delete using (
  auth.uid() = user_id
  or exists (select 1 from public.groups g where g.id = group_id and g.created_by = auth.uid())
  or public.is_admin()
);

-- GROUP POSTS (update/delete never existed)
drop policy if exists gposts_update on public.group_posts;
create policy gposts_update on public.group_posts for update using (auth.uid() = author_id or public.is_admin());
drop policy if exists gposts_delete on public.group_posts;
create policy gposts_delete on public.group_posts for delete using (
  auth.uid() = author_id
  or exists (select 1 from public.groups g where g.id = group_id and g.created_by = auth.uid())
  or public.is_admin()
);

-- EVENTS (update/delete never existed)
drop policy if exists events_update on public.events;
create policy events_update on public.events for update using (auth.uid() = host_id or public.is_admin());
drop policy if exists events_delete on public.events;
create policy events_delete on public.events for delete using (auth.uid() = host_id or public.is_admin());

-- MARKET LISTINGS (delete never existed — deleting your own listing was always a no-op)
drop policy if exists listings_update on public.listings;
create policy listings_update on public.listings for update using (auth.uid() = seller_id or public.is_admin());
drop policy if exists listings_delete on public.listings;
create policy listings_delete on public.listings for delete using (auth.uid() = seller_id or public.is_admin());

-- MARKET REVIEWS (never had update/delete — allow the author or admin to remove)
drop policy if exists reviews_delete on public.reviews;
create policy reviews_delete on public.reviews for delete using (auth.uid() = author_id or public.is_admin());

-- FILMS
drop policy if exists films_update on public.films;
create policy films_update on public.films for update using (auth.uid() = author_id or public.is_admin());
drop policy if exists films_delete on public.films;
create policy films_delete on public.films for delete using (auth.uid() = author_id or public.is_admin());

-- FILM REVIEWS (never had update/delete)
drop policy if exists film_reviews_delete on public.film_reviews;
create policy film_reviews_delete on public.film_reviews for delete using (auth.uid() = author_id or public.is_admin());

-- SONGS
drop policy if exists songs_update on public.songs;
create policy songs_update on public.songs for update using (auth.uid() = author_id or public.is_admin());
drop policy if exists songs_delete on public.songs;
create policy songs_delete on public.songs for delete using (auth.uid() = author_id or public.is_admin());

-- ============================================================================
--  MESSAGING: missing update/delete policies
--  (edit message, delete message, delete conversation, and mark-as-read were
--  all silent no-ops — same root cause as the earlier group/reel/thread gaps)
-- ============================================================================
drop policy if exists msg_update on public.messages;
create policy msg_update on public.messages for update using (auth.uid() = sender_id or public.is_admin());
drop policy if exists msg_delete on public.messages;
create policy msg_delete on public.messages for delete using (auth.uid() = sender_id or public.is_admin());

drop policy if exists conv_delete on public.conversations;
create policy conv_delete on public.conversations for delete using (public.is_conversation_member(id) or public.is_admin());

-- last_read_at (unread-badge tracking) was never persisted — no update policy existed
drop policy if exists conv_mem_update on public.conversation_members;
create policy conv_mem_update on public.conversation_members for update using (auth.uid() = user_id);
drop policy if exists conv_mem_del on public.conversation_members;
create policy conv_mem_del on public.conversation_members for delete using (auth.uid() = user_id or public.is_admin());

-- ============================================================================
--  UNDOCUMENTED TABLES — these already exist on the live database (added
--  directly via the Supabase dashboard at some point, judging by the app code
--  that reads/writes them) but were never captured in this schema file, so
--  there was no record of what RLS they actually have. Reconstructed from
--  how src/lib/api.js queries each one; "if not exists" is a no-op against
--  the real table, but the policies below are applied either way so the
--  actual behavior is finally pinned down and reproducible from this file.
-- ============================================================================

create table if not exists public.user_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);
alter table public.user_blocks enable row level security;
drop policy if exists user_blocks_read on public.user_blocks;
create policy user_blocks_read on public.user_blocks for select using (auth.uid() = blocker_id);
drop policy if exists user_blocks_insert on public.user_blocks;
create policy user_blocks_insert on public.user_blocks for insert with check (auth.uid() = blocker_id);
drop policy if exists user_blocks_update on public.user_blocks;
create policy user_blocks_update on public.user_blocks for update using (auth.uid() = blocker_id);
drop policy if exists user_blocks_delete on public.user_blocks;
create policy user_blocks_delete on public.user_blocks for delete using (auth.uid() = blocker_id);

create table if not exists public.user_mutes (
  muter_id   uuid not null references public.profiles(id) on delete cascade,
  muted_id   uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (muter_id, muted_id)
);
alter table public.user_mutes enable row level security;
drop policy if exists user_mutes_read on public.user_mutes;
create policy user_mutes_read on public.user_mutes for select using (auth.uid() = muter_id);
drop policy if exists user_mutes_insert on public.user_mutes;
create policy user_mutes_insert on public.user_mutes for insert with check (auth.uid() = muter_id);
drop policy if exists user_mutes_update on public.user_mutes;
create policy user_mutes_update on public.user_mutes for update using (auth.uid() = muter_id);
drop policy if exists user_mutes_delete on public.user_mutes;
create policy user_mutes_delete on public.user_mutes for delete using (auth.uid() = muter_id);

create table if not exists public.close_friends (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  friend_id  uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id)
);
alter table public.close_friends enable row level security;
drop policy if exists close_friends_read on public.close_friends;
create policy close_friends_read on public.close_friends for select using (auth.uid() = user_id);
drop policy if exists close_friends_insert on public.close_friends;
create policy close_friends_insert on public.close_friends for insert with check (auth.uid() = user_id);
drop policy if exists close_friends_update on public.close_friends;
create policy close_friends_update on public.close_friends for update using (auth.uid() = user_id);
drop policy if exists close_friends_delete on public.close_friends;
create policy close_friends_delete on public.close_friends for delete using (auth.uid() = user_id);

create table if not exists public.collections (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);
alter table public.collections enable row level security;
drop policy if exists collections_read on public.collections;
create policy collections_read on public.collections for select using (auth.uid() = user_id);
drop policy if exists collections_insert on public.collections;
create policy collections_insert on public.collections for insert with check (auth.uid() = user_id);
drop policy if exists collections_delete on public.collections;
create policy collections_delete on public.collections for delete using (auth.uid() = user_id);

create table if not exists public.post_saves (
  post_id       uuid not null references public.posts(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  collection_id uuid references public.collections(id) on delete set null,
  created_at    timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.post_saves enable row level security;
drop policy if exists post_saves_read on public.post_saves;
create policy post_saves_read on public.post_saves for select using (auth.uid() = user_id);
drop policy if exists post_saves_insert on public.post_saves;
create policy post_saves_insert on public.post_saves for insert with check (auth.uid() = user_id);
drop policy if exists post_saves_update on public.post_saves;
create policy post_saves_update on public.post_saves for update using (auth.uid() = user_id);
drop policy if exists post_saves_delete on public.post_saves;
create policy post_saves_delete on public.post_saves for delete using (auth.uid() = user_id);

create table if not exists public.comment_likes (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);
alter table public.comment_likes enable row level security;
drop policy if exists comment_likes_read on public.comment_likes;
create policy comment_likes_read on public.comment_likes for select using (true);
drop policy if exists comment_likes_insert on public.comment_likes;
create policy comment_likes_insert on public.comment_likes for insert with check (auth.uid() = user_id);
drop policy if exists comment_likes_delete on public.comment_likes;
create policy comment_likes_delete on public.comment_likes for delete using (auth.uid() = user_id);

create table if not exists public.message_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  emoji      text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);
alter table public.message_reactions enable row level security;
drop policy if exists message_reactions_read on public.message_reactions;
create policy message_reactions_read on public.message_reactions for select using (
  exists (select 1 from public.messages m where m.id = message_id and public.is_conversation_member(m.conversation_id))
);
drop policy if exists message_reactions_insert on public.message_reactions;
create policy message_reactions_insert on public.message_reactions for insert with check (auth.uid() = user_id);
drop policy if exists message_reactions_update on public.message_reactions;
create policy message_reactions_update on public.message_reactions for update using (auth.uid() = user_id);
drop policy if exists message_reactions_delete on public.message_reactions;
create policy message_reactions_delete on public.message_reactions for delete using (auth.uid() = user_id);

create table if not exists public.user_locations (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  lat        double precision not null,
  lng        double precision not null,
  shared     boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.user_locations enable row level security;
drop policy if exists user_locations_read on public.user_locations;
create policy user_locations_read on public.user_locations for select using (auth.uid() = user_id or shared = true);
drop policy if exists user_locations_insert on public.user_locations;
create policy user_locations_insert on public.user_locations for insert with check (auth.uid() = user_id);
drop policy if exists user_locations_update on public.user_locations;
create policy user_locations_update on public.user_locations for update using (auth.uid() = user_id);
drop policy if exists user_locations_delete on public.user_locations;
create policy user_locations_delete on public.user_locations for delete using (auth.uid() = user_id);

create table if not exists public.story_likes (
  story_id   uuid not null references public.stories(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (story_id, user_id)
);
alter table public.story_likes enable row level security;
drop policy if exists story_likes_read on public.story_likes;
create policy story_likes_read on public.story_likes for select using (true);
drop policy if exists story_likes_insert on public.story_likes;
create policy story_likes_insert on public.story_likes for insert with check (auth.uid() = user_id);
-- toggleLike() does an upsert (insert ... on conflict do update), which requires an
-- update policy too, not just insert — found by scripts/check-rls.mjs
drop policy if exists story_likes_update on public.story_likes;
create policy story_likes_update on public.story_likes for update using (auth.uid() = user_id);
drop policy if exists story_likes_delete on public.story_likes;
create policy story_likes_delete on public.story_likes for delete using (auth.uid() = user_id);

create table if not exists public.story_comments (
  id         uuid primary key default gen_random_uuid(),
  story_id   uuid not null references public.stories(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  text       text not null,
  created_at timestamptz not null default now()
);
alter table public.story_comments enable row level security;
drop policy if exists story_comments_read on public.story_comments;
create policy story_comments_read on public.story_comments for select using (true);
drop policy if exists story_comments_insert on public.story_comments;
create policy story_comments_insert on public.story_comments for insert with check (auth.uid() = author_id);
drop policy if exists story_comments_delete on public.story_comments;
create policy story_comments_delete on public.story_comments for delete using (auth.uid() = author_id or public.is_admin());

create table if not exists public.reel_comments (
  id         uuid primary key default gen_random_uuid(),
  reel_id    uuid not null references public.reels(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  text       text not null,
  created_at timestamptz not null default now()
);
alter table public.reel_comments enable row level security;
drop policy if exists reel_comments_read on public.reel_comments;
create policy reel_comments_read on public.reel_comments for select using (true);
drop policy if exists reel_comments_insert on public.reel_comments;
create policy reel_comments_insert on public.reel_comments for insert with check (auth.uid() = author_id);
drop policy if exists reel_comments_delete on public.reel_comments;
create policy reel_comments_delete on public.reel_comments for delete using (auth.uid() = author_id or public.is_admin());

create table if not exists public.quest_claims (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  quest      text not null,
  xp         int not null default 0,
  day        date not null default current_date,
  primary key (user_id, quest, day)
);
alter table public.quest_claims enable row level security;
drop policy if exists quest_claims_read on public.quest_claims;
create policy quest_claims_read on public.quest_claims for select using (auth.uid() = user_id);
drop policy if exists quest_claims_insert on public.quest_claims;
create policy quest_claims_insert on public.quest_claims for insert with check (auth.uid() = user_id);

create table if not exists public.reel_saves (
  reel_id    uuid not null references public.reels(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (reel_id, user_id)
);
alter table public.reel_saves enable row level security;
drop policy if exists reel_saves_read on public.reel_saves;
create policy reel_saves_read on public.reel_saves for select using (auth.uid() = user_id);
drop policy if exists reel_saves_insert on public.reel_saves;
create policy reel_saves_insert on public.reel_saves for insert with check (auth.uid() = user_id);
drop policy if exists reel_saves_delete on public.reel_saves;
create policy reel_saves_delete on public.reel_saves for delete using (auth.uid() = user_id);

create table if not exists public.highlights (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles(id) on delete cascade,
  title      text not null,
  cover_url  text,
  created_at timestamptz not null default now()
);
alter table public.highlights enable row level security;
drop policy if exists highlights_read on public.highlights;
create policy highlights_read on public.highlights for select using (true);
drop policy if exists highlights_insert on public.highlights;
create policy highlights_insert on public.highlights for insert with check (auth.uid() = owner_id);
drop policy if exists highlights_delete on public.highlights;
create policy highlights_delete on public.highlights for delete using (auth.uid() = owner_id);

create table if not exists public.push_subscriptions (
  endpoint   text primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
drop policy if exists push_subscriptions_read on public.push_subscriptions;
create policy push_subscriptions_read on public.push_subscriptions for select using (auth.uid() = user_id);
drop policy if exists push_subscriptions_insert on public.push_subscriptions;
create policy push_subscriptions_insert on public.push_subscriptions for insert with check (auth.uid() = user_id);
drop policy if exists push_subscriptions_update on public.push_subscriptions;
create policy push_subscriptions_update on public.push_subscriptions for update using (auth.uid() = user_id);
drop policy if exists push_subscriptions_delete on public.push_subscriptions;
create policy push_subscriptions_delete on public.push_subscriptions for delete using (auth.uid() = user_id);

-- ============================================================================
--  ADMIN ANALYTICS — daily trends for the admin dashboard's "trends by day"
--  chart (new users/posts/comments, last 14 days). admin_stats() (the summary
--  cards' RPC) already exists on the live project but was never checked into
--  this file — this is purely additive and doesn't touch it.
-- ============================================================================
create or replace function public.admin_daily_trends()
returns table(day date, new_users bigint, new_posts bigint, new_comments bigint)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  return query
  select gs.day,
    (select count(*) from public.profiles p where p.created_at::date = gs.day)::bigint as new_users,
    (select count(*) from public.posts po where po.created_at::date = gs.day)::bigint as new_posts,
    (select count(*) from public.comments c where c.created_at::date = gs.day)::bigint as new_comments
  from generate_series((current_date - interval '13 days')::date, current_date, interval '1 day') as gs(day);
end;
$$;
grant execute on function public.admin_daily_trends() to authenticated;

-- ============================================================================
--  REFERRAL / INVITE SYSTEM — every profile gets a stable referral_code;
--  passing it at signup (as user_metadata.ref_code, see AuthScreen/?ref= in
--  the app) attributes the new account to the referrer and grants a
--  one-time XP bonus to both sides. Also documents `banned` (used by
--  admin.setBanned in src/lib/api.js — live on the project but, like
--  admin_stats()/admin_set_xp() etc., never checked into this file before).
-- ============================================================================
alter table public.profiles add column if not exists banned boolean not null default false;
alter table public.profiles add column if not exists referral_code text;
alter table public.profiles add column if not exists referred_by uuid references public.profiles(id);

update public.profiles set referral_code = substr(replace(gen_random_uuid()::text, '-', ''), 1, 8) where referral_code is null;

do $$ begin
  alter table public.profiles add constraint profiles_referral_code_key unique (referral_code);
exception when duplicate_object then null; end $$;

create index if not exists profiles_referred_by_idx on public.profiles(referred_by);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  ref_id uuid;
begin
  if new.raw_user_meta_data->>'ref_code' is not null then
    select id into ref_id from public.profiles where referral_code = new.raw_user_meta_data->>'ref_code' and id <> new.id limit 1;
  end if;
  insert into public.profiles (id, username, name, referral_code, referred_by)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'name', ''),
    substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
    ref_id
  )
  on conflict (id) do nothing;
  if ref_id is not null then
    -- needed since protect_profile_columns (below) now locks xp down to
    -- admin-only for ordinary UPDATE calls; this signup bonus is a trusted
    -- internal write, not a user editing their own row
    perform set_config('app.trusted_profile_write', 'on', true);
    update public.profiles set xp = xp + 100 where id = ref_id;
    update public.profiles set xp = xp + 50 where id = new.id;
  end if;
  return new;
end; $$;

-- your own referral code + how many people you've brought in, for the invite UI
create or replace function public.my_referral_stats()
returns table(referral_code text, invited_count bigint)
language sql stable security definer set search_path = public as $$
  select p.referral_code, (select count(*) from public.profiles r where r.referred_by = p.id)
  from public.profiles p where p.id = auth.uid();
$$;
grant execute on function public.my_referral_stats() to authenticated;

-- the actual list of people you referred, for an "invited friends" list
create or replace function public.my_referred_users()
returns setof public.profiles
language sql stable security definer set search_path = public as $$
  select * from public.profiles where referred_by = auth.uid() order by created_at desc;
$$;
grant execute on function public.my_referred_users() to authenticated;

-- ============================================================================
--  PROFILE COLUMN PROTECTION — closes a real gap: profiles_update's RLS
--  policy only ever checked *which row* (auth.uid() = id or is_admin()),
--  never *which columns*. Any authenticated user could PATCH their own row
--  directly (bypassing the app entirely, e.g. via a raw fetch to the
--  PostgREST API) and set is_admin/verified/xp/banned/referral_code/
--  referred_by to whatever they liked. This trigger locks those columns to
--  admin-only for ordinary UPDATE calls; is_admin() is evaluated for the
--  ACTING user (auth.uid()), not the row being edited, so the existing
--  admin-panel flows (onSetVerified/onSetAdmin/setBanned, which go through
--  a plain profiles.update() as an actual admin) keep working unchanged.
--  The couple of trusted internal writes that touch xp for a user who
--  *isn't* the acting admin (the signup referral bonus, self-serve add_xp)
--  opt in explicitly via a transaction-local flag.
-- ============================================================================
create or replace function public.protect_profile_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('app.trusted_profile_write', true), '') = 'on' then
    return new;
  end if;
  if not public.is_admin() then
    new.is_admin := old.is_admin;
    new.verified := old.verified;
    new.xp := old.xp;
    new.banned := old.banned;
    new.referral_code := old.referral_code;
    new.referred_by := old.referred_by;
  end if;
  return new;
end; $$;

drop trigger if exists protect_profile_columns on public.profiles;
create trigger protect_profile_columns before update on public.profiles
for each row execute function public.protect_profile_columns();

-- add_xp: previously callable by *any* authenticated user with an arbitrary
-- uid — meaning anyone could grant XP to someone else's account (or their
-- own, repeatedly) with zero authorization check. Now only self-serve
-- (uid = the caller, used by every "+N XP" quest/action reward in the app)
-- or an actual admin (granting XP to someone else from the moderation
-- panel) may call it.
create or replace function public.add_xp(uid uuid, amount int)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is distinct from uid and not public.is_admin() then
    raise exception 'not authorized';
  end if;
  perform set_config('app.trusted_profile_write', 'on', true);
  update public.profiles set xp = xp + amount where id = uid;
end; $$;

-- ============================================================================
--  LANGUAGE LEARNING — vocabulary/grammar content ships as static data in
--  the client bundle (src/data/langWords.js, langGrammar.js), same idea as
--  MARKET_CATS/FILM_GENRES: curated content doesn't need a DB round trip.
--  Only per-user word mastery + a site-wide on/off toggle live here.
-- ============================================================================
create table if not exists public.lang_word_progress (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  lang       text not null,
  word_id    text not null,
  mastery    int not null default 0 check (mastery between 0 and 100),
  updated_at timestamptz not null default now(),
  primary key (user_id, lang, word_id)
);
create index if not exists lang_word_progress_user_idx on public.lang_word_progress(user_id, lang);

alter table public.lang_word_progress enable row level security;
-- read is public (like film_watch) so a cross-user leaderboard/admin view can
-- read directly instead of needing a security-definer RPC for every query;
-- write stays owner-only.
drop policy if exists lang_word_progress_read on public.lang_word_progress;
create policy lang_word_progress_read on public.lang_word_progress for select using (true);
drop policy if exists lang_word_progress_insert on public.lang_word_progress;
create policy lang_word_progress_insert on public.lang_word_progress for insert with check (auth.uid() = user_id);
drop policy if exists lang_word_progress_update on public.lang_word_progress;
create policy lang_word_progress_update on public.lang_word_progress for update using (auth.uid() = user_id);
drop policy if exists lang_word_progress_delete on public.lang_word_progress;
create policy lang_word_progress_delete on public.lang_word_progress for delete using (auth.uid() = user_id);

-- site-wide feature toggles (currently just the language-learning tab); one
-- small table so the admin panel can flip a feature on/off without a new
-- migration each time.
create table if not exists public.app_settings (
  key   text primary key,
  value jsonb not null default 'true'::jsonb
);
alter table public.app_settings enable row level security;
drop policy if exists app_settings_read on public.app_settings;
create policy app_settings_read on public.app_settings for select using (true);
drop policy if exists app_settings_write on public.app_settings;
create policy app_settings_write on public.app_settings for all using (public.is_admin()) with check (public.is_admin());
insert into public.app_settings (key, value) values ('languages_enabled', 'true'::jsonb) on conflict (key) do nothing;

-- per-language leaderboard (mastered word count + average mastery), for the
-- in-app "leaderboard by language" view.
create or replace function public.lang_leaderboard(p_lang text, p_limit int default 20)
returns table(user_id uuid, mastered bigint, avg_mastery numeric)
language sql stable security definer set search_path = public as $$
  select lwp.user_id,
    count(*) filter (where lwp.mastery >= 100),
    coalesce(avg(lwp.mastery), 0)
  from public.lang_word_progress lwp
  where lwp.lang = p_lang
  group by lwp.user_id
  order by count(*) filter (where lwp.mastery >= 100) desc
  limit p_limit;
$$;
grant execute on function public.lang_leaderboard(text, int) to authenticated;

-- admin-only rollup of every user's progress across all languages
create or replace function public.admin_lang_progress()
returns table(user_id uuid, lang text, mastered bigint, in_progress bigint, avg_mastery numeric)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  return query
  select lwp.user_id, lwp.lang,
    count(*) filter (where lwp.mastery >= 100),
    count(*) filter (where lwp.mastery > 0 and lwp.mastery < 100),
    coalesce(avg(lwp.mastery), 0)
  from public.lang_word_progress lwp
  group by lwp.user_id, lwp.lang
  order by count(*) filter (where lwp.mastery >= 100) desc;
end;
$$;
grant execute on function public.admin_lang_progress() to authenticated;

-- ============================================================================
--  PROFILE VIEWS — "who viewed your profile". Opening someone else's profile
--  upserts one row per (viewer, profile) pair (a repeat visit just bumps
--  viewed_at, it doesn't grow a log). Select is restricted to the profile
--  owner reading their own visitor list. show_profile_visits belongs to the
--  *viewer*, not the profile owner — it lets a user opt out of being
--  recorded as a visitor when THEY browse other people's profiles; enforced
--  client-side before the insert (src/App.jsx), same trust model this app
--  already uses for other non-critical privacy prefs.
-- ============================================================================
alter table public.profiles add column if not exists show_profile_visits boolean not null default true;

create table if not exists public.profile_views (
  viewer_id  uuid not null references public.profiles(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  viewed_at  timestamptz not null default now(),
  primary key (viewer_id, profile_id),
  check (viewer_id <> profile_id)
);
create index if not exists profile_views_profile_idx on public.profile_views(profile_id, viewed_at desc);

alter table public.profile_views enable row level security;
drop policy if exists profile_views_read on public.profile_views;
create policy profile_views_read on public.profile_views for select using (auth.uid() = profile_id);
drop policy if exists profile_views_insert on public.profile_views;
create policy profile_views_insert on public.profile_views for insert with check (auth.uid() = viewer_id);
drop policy if exists profile_views_update on public.profile_views;
create policy profile_views_update on public.profile_views for update using (auth.uid() = viewer_id);

-- profile view → notify the profile owner, but only on a genuine first-time
-- view: recordView() upserts, so a repeat visit hits the ON CONFLICT UPDATE
-- path and this AFTER INSERT trigger simply never fires for it again.
create or replace function public.notify_on_profile_view()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, type, from_id)
  values (new.profile_id, 'profile_view', new.viewer_id);
  return new;
end; $$;
drop trigger if exists trg_notify_profile_view on public.profile_views;
create trigger trg_notify_profile_view after insert on public.profile_views
  for each row execute function public.notify_on_profile_view();

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
