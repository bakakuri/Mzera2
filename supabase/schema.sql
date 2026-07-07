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
-- tagged (people tagged in a photo/post via the compose "tag" picker) — same
-- gap as comments.parent_id below: src/lib/api.js's posts.create() has sent
-- this for a while, never checked into this file.
alter table public.posts add column if not exists tagged uuid[];
-- public_status: none | pending | approved | rejected — the "submit for the
-- public feed" moderation queue (src/lib/api.js's posts.create()/
-- admin.pendingPublic()/reviewPublic()) has relied on this column for a
-- while too, same undocumented-gap story.
alter table public.posts add column if not exists public_status text not null default 'none';
-- shared_post_id: onRepost() in useFeed.js creates a new post pointing back
-- at the original via this column — same undocumented-gap story.
alter table public.posts add column if not exists shared_post_id uuid references public.posts(id) on delete set null;
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
-- posts.group_id — group posts are just posts with this set (see
-- useGroups.js's onGroupPost/postsApi.create); same undocumented-gap class
-- as posts.tagged above. Has to wait until here since it references
-- public.groups, which didn't exist yet back at the posts table.
alter table public.posts add column if not exists group_id uuid references public.groups(id) on delete cascade;
create index if not exists posts_group_idx on public.posts(group_id);

create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id  uuid not null references public.profiles(id) on delete cascade,
  primary key (group_id, user_id)
);
-- status/role: src/lib/api.js's groups.list()/members()/requestJoin()/approve()
-- have read and written these for a while (private-group join requests need
-- a pending state), never checked into this file — same class of gap as
-- comments.parent_id/posts.tagged elsewhere in this file.
-- status: pending | approved | banned (banned keeps the row instead of
-- deleting it, so requestJoin can refuse re-entry — see groups.ban/unban).
-- role: member | owner (exactly one owner row per group, set at creation
-- time and on groups.transferOwnership).
alter table public.group_members add column if not exists status text not null default 'approved';
alter table public.group_members add column if not exists role text not null default 'member';

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
  type       text not null,  -- like | comment | reply | follow | mention | thread_reply | thread_activity | profile_view | reel_like | reel_comment | story_like | story_comment | post_tag | group_post | group_approved | group_join_request | event_rsvp | birthday | level_up | comment_like | market_review | repost | poll_vote
  from_id    uuid references public.profiles(id) on delete cascade,           -- ვინ გამოიწვია
  post_id    uuid references public.posts(id) on delete cascade,
  text       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notif_user_idx on public.notifications(user_id, created_at desc);
-- exact-target columns for deep-linking a notification to the specific
-- comment/reply that triggered it, or to a reel/story (posts/comments/reels/
-- stories all predate this table, so these are safe to add now — thread_id/
-- reply_id have to wait for public.threads/public.thread_replies further
-- below, see FORUM section).
alter table public.notifications add column if not exists comment_id uuid references public.comments(id) on delete cascade;
alter table public.notifications add column if not exists reel_id uuid references public.reels(id) on delete cascade;
alter table public.notifications add column if not exists story_id uuid references public.stories(id) on delete cascade;
alter table public.notifications add column if not exists group_id uuid references public.groups(id) on delete cascade;
alter table public.notifications add column if not exists event_id uuid references public.events(id) on delete cascade;

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
-- p_comment_id/p_reply_id are optional exact-target anchors so a mention
-- inside a comment/reply can deep-link straight to it.
drop function if exists public.notify_mentions(text, uuid, uuid, uuid);
create or replace function public.notify_mentions(p_text text, p_from_id uuid, p_post_id uuid, p_thread_id uuid, p_comment_id uuid default null, p_reply_id uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare h text; target uuid;
begin
  if p_text is null then return; end if;
  for h in select distinct lower(m[1]) from regexp_matches(p_text, '@([A-Za-z0-9_]+)', 'g') as m loop
    select id into target from public.profiles where lower(username) = h limit 1;
    if target is not null and target <> p_from_id then
      insert into public.notifications (user_id, type, from_id, post_id, thread_id, comment_id, reply_id, text)
      values (target, 'mention', p_from_id, p_post_id, p_thread_id, p_comment_id, p_reply_id, p_text);
    end if;
  end loop;
end;
$$;

-- new post → scan for @mentions, notify anyone explicitly tagged via the
-- compose "tag people" picker (post.tagged, separate from @handle mentions),
-- notify the original author on a repost (shared_post_id set), and — if
-- this is a group post (posts with a group_id set) — fan out a 'group_post'
-- ping to every approved group member except the author.
create or replace function public.notify_on_post()
returns trigger language plpgsql security definer set search_path = public as $$
declare tagged_id uuid; member_id uuid; orig_author uuid;
begin
  perform public.notify_mentions(new.text, new.author_id, new.id, null);
  if new.tagged is not null then
    foreach tagged_id in array new.tagged loop
      if tagged_id <> new.author_id then
        insert into public.notifications (user_id, type, from_id, post_id)
        values (tagged_id, 'post_tag', new.author_id, new.id);
      end if;
    end loop;
  end if;
  if new.group_id is not null then
    for member_id in
      select user_id from public.group_members
      where group_id = new.group_id and status = 'approved' and user_id <> new.author_id
    loop
      insert into public.notifications (user_id, type, from_id, post_id, group_id)
      values (member_id, 'group_post', new.author_id, new.id, new.group_id);
    end loop;
  end if;
  if new.shared_post_id is not null then
    select author_id into orig_author from public.posts where id = new.shared_post_id;
    if orig_author is not null and orig_author <> new.author_id then
      insert into public.notifications (user_id, type, from_id, post_id)
      values (orig_author, 'repost', new.author_id, new.shared_post_id);
    end if;
  end if;
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
-- Every insert here carries comment_id = new.id so the client can scroll
-- straight to the comment that triggered it.
create or replace function public.notify_on_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid; parent_author uuid; participant uuid;
begin
  select author_id into owner from public.posts where id = new.post_id;

  if new.parent_id is not null then
    select author_id into parent_author from public.comments where id = new.parent_id;
  end if;

  if owner is not null and owner <> new.author_id then
    insert into public.notifications (user_id, type, from_id, post_id, comment_id, text)
    values (owner, 'comment', new.author_id, new.post_id, new.id, new.text);
  end if;

  if parent_author is not null and parent_author <> new.author_id and parent_author is distinct from owner then
    insert into public.notifications (user_id, type, from_id, post_id, comment_id, text)
    values (parent_author, 'reply', new.author_id, new.post_id, new.id, new.text);
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
      insert into public.notifications (user_id, type, from_id, post_id, comment_id, text)
      values (participant, 'thread_activity', new.author_id, new.post_id, new.id, new.text);
    end if;
  end loop;

  perform public.notify_mentions(new.text, new.author_id, new.post_id, null, new.id, null);

  return new;
end; $$;
drop trigger if exists trg_notify_comment on public.comments;
create trigger trg_notify_comment after insert on public.comments
  for each row execute function public.notify_on_comment();

-- reel like → notification (reels/reel_likes both predate this section)
create or replace function public.notify_on_reel_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  select author_id into owner from public.reels where id = new.reel_id;
  if owner is not null and owner <> new.user_id then
    insert into public.notifications (user_id, type, from_id, reel_id)
    values (owner, 'reel_like', new.user_id, new.reel_id);
  end if;
  return new;
end; $$;
drop trigger if exists trg_notify_reel_like on public.reel_likes;
create trigger trg_notify_reel_like after insert on public.reel_likes
  for each row execute function public.notify_on_reel_like();

-- poll vote → notification for the post owner
create or replace function public.notify_on_poll_vote()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  select author_id into owner from public.posts where id = new.post_id;
  if owner is not null and owner <> new.user_id then
    insert into public.notifications (user_id, type, from_id, post_id)
    values (owner, 'poll_vote', new.user_id, new.post_id);
  end if;
  return new;
end; $$;
drop trigger if exists trg_notify_poll_vote on public.poll_votes;
create trigger trg_notify_poll_vote after insert on public.poll_votes
  for each row execute function public.notify_on_poll_vote();

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

-- private-group join request → notify the group owner (public-group joins
-- insert status='approved' directly, so those don't need action and don't
-- notify here — only a genuine pending request does).
create or replace function public.notify_on_group_join_request()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  if new.status = 'pending' then
    select created_by into owner from public.groups where id = new.group_id;
    if owner is not null and owner <> new.user_id then
      insert into public.notifications (user_id, type, from_id, group_id)
      values (owner, 'group_join_request', new.user_id, new.group_id);
    end if;
  end if;
  return new;
end; $$;
drop trigger if exists trg_notify_group_join on public.group_members;
create trigger trg_notify_group_join after insert on public.group_members
  for each row execute function public.notify_on_group_join_request();

-- marketplace review → notification for the seller
create or replace function public.notify_on_review()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.seller_id <> new.author_id then
    insert into public.notifications (user_id, type, from_id, text)
    values (new.seller_id, 'market_review', new.author_id, new.text);
  end if;
  return new;
end; $$;
drop trigger if exists trg_notify_review on public.reviews;
create trigger trg_notify_review after insert on public.reviews
  for each row execute function public.notify_on_review();

-- event rsvp → notification for the host. rsvp() upserts, so re-rsvp'ing
-- (going -> maybe -> no) only notifies once, on the first-ever response.
create or replace function public.notify_on_event_rsvp()
returns trigger language plpgsql security definer set search_path = public as $$
declare host uuid;
begin
  select host_id into host from public.events where id = new.event_id;
  if host is not null and host <> new.user_id then
    insert into public.notifications (user_id, type, from_id, event_id)
    values (host, 'event_rsvp', new.user_id, new.event_id);
  end if;
  return new;
end; $$;
drop trigger if exists trg_notify_event_rsvp on public.event_rsvps;
create trigger trg_notify_event_rsvp after insert on public.event_rsvps
  for each row execute function public.notify_on_event_rsvp();

-- notify_group_event: called directly by the client (groups.approve() in
-- src/lib/api.js) when a group owner approves someone's join request — this
-- RPC already existed as a client call with nothing behind it (silently
-- swallowed by the try/catch, so "group_approved" pings never actually
-- fired). Unlike every other notification path above, this one is directly
-- callable by any authenticated client, so — unlike a plain insert trigger
-- that only ever runs off the server's own row data — it needs its own
-- authorization check: only the group's owner may notify on its behalf.
create or replace function public.notify_group_event(target uuid, gid uuid, kind text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.groups where id = gid and created_by = auth.uid()) then
    raise exception 'not authorized';
  end if;
  insert into public.notifications (user_id, type, from_id, group_id)
  values (target, kind, auth.uid(), gid);
end;
$$;
grant execute on function public.notify_group_event(uuid, uuid, text) to authenticated;

-- notify_birthday_followers: called by the client once per day (on app
-- load) when it's the caller's own birthday; idempotent per calendar day so
-- reloading the app repeatedly doesn't spam followers.
create or replace function public.notify_birthday_followers()
returns void language plpgsql security definer set search_path = public as $$
declare bday date; follower_id uuid;
begin
  select birthday into bday from public.profiles where id = auth.uid();
  if bday is null then return; end if;
  if extract(month from bday) <> extract(month from current_date) or extract(day from bday) <> extract(day from current_date) then
    return;
  end if;
  for follower_id in select follower_id from public.follows where following_id = auth.uid() loop
    if not exists (
      select 1 from public.notifications
      where user_id = follower_id and from_id = auth.uid() and type = 'birthday' and created_at::date = current_date
    ) then
      insert into public.notifications (user_id, type, from_id) values (follower_id, 'birthday', auth.uid());
    end if;
  end loop;
end;
$$;
grant execute on function public.notify_birthday_followers() to authenticated;

-- notify_level_up: called by the client right after a gainXp() crosses a
-- level boundary (see src/hooks/useXp.js); text carries the new level number
-- and doubles as the dedup key so re-triggering the same level is a no-op.
create or replace function public.notify_level_up(p_level int)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.notifications where user_id = auth.uid() and type = 'level_up' and text = p_level::text) then
    insert into public.notifications (user_id, type, from_id, text)
    values (auth.uid(), 'level_up', auth.uid(), p_level::text);
  end if;
end;
$$;
grant execute on function public.notify_level_up(int) to authenticated;

-- ============================================================================
--  MODERATION
-- ============================================================================
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  type        text not null,  -- post | user | story | reel | comment
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
-- exact reply to deep-link/scroll to, for thread_reply/thread_activity/
-- mention-in-a-reply notifications.
alter table public.notifications add column if not exists reply_id uuid references public.thread_replies(id) on delete cascade;

create table if not exists public.thread_votes (
  thread_id uuid not null references public.threads(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  primary key (thread_id, user_id)
);
-- value: +1 (upvote) | -1 (downvote) — added after thread_votes already
-- shipped as an upvote-only table, so existing rows default to +1 to keep
-- their original meaning.
alter table public.thread_votes add column if not exists value smallint not null default 1;

-- reply voting was entirely decorative client-side (a static heart+count
-- with no handler) until this table existed to back it — upvote-only,
-- unlike thread_votes, since replies don't need full up/down.
create table if not exists public.thread_reply_votes (
  reply_id uuid not null references public.thread_replies(id) on delete cascade,
  user_id  uuid not null references public.profiles(id) on delete cascade,
  primary key (reply_id, user_id)
);
alter table public.thread_reply_votes enable row level security;
drop policy if exists treply_votes_read on public.thread_reply_votes;
create policy treply_votes_read on public.thread_reply_votes for select using (true);
drop policy if exists treply_votes_insert on public.thread_reply_votes;
create policy treply_votes_insert on public.thread_reply_votes for insert with check (auth.uid() = user_id);
drop policy if exists treply_votes_delete on public.thread_reply_votes;
create policy treply_votes_delete on public.thread_reply_votes for delete using (auth.uid() = user_id);

-- pin/lock are moderation actions — RLS reuses the existing author-or-admin
-- threads_update policy (same pattern as the rest of this app's admin
-- content tools), but the client only ever exposes these buttons to admins.
alter table public.threads add column if not exists pinned boolean not null default false;
alter table public.threads add column if not exists locked boolean not null default false;

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
-- Every insert here carries reply_id = new.id for deep-linking.
create or replace function public.notify_on_thread_reply()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid; participant uuid;
begin
  select author_id into owner from public.threads where id = new.thread_id;

  if owner is not null and owner <> new.author_id then
    insert into public.notifications (user_id, type, from_id, thread_id, reply_id, text)
    values (owner, 'thread_reply', new.author_id, new.thread_id, new.id, new.text);
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
      insert into public.notifications (user_id, type, from_id, thread_id, reply_id, text)
      values (participant, 'thread_activity', new.author_id, new.thread_id, new.id, new.text);
    end if;
  end loop;

  perform public.notify_mentions(new.text, new.author_id, null, new.thread_id, null, new.id);

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
-- (public_status-aware version of this policy lives further below, once
-- public.is_admin() exists — see the POSTS PUBLIC-STATUS PRIVACY section)
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
alter table public.conversations add column if not exists pinned_message_id uuid references public.messages(id) on delete set null;
drop policy if exists conv_read on public.conversations;
create policy conv_read on public.conversations for select using (public.is_conversation_member(id));
create policy conv_insert on public.conversations for insert with check (auth.uid() = created_by);
drop policy if exists conv_update on public.conversations;
create policy conv_update on public.conversations for update using (public.is_conversation_member(id)) with check (public.is_conversation_member(id));

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

-- ============================================================================
--  ADMIN AUDIT LOG — append-only trail of admin-exclusive actions
--  (verify/ban/grant xp/delete user/broadcast/resolve report/review public
--  post/delete story); no update or delete policy on purpose, so the log
--  itself can't be tampered with from the client.
-- ============================================================================
create table if not exists public.admin_actions (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid references public.profiles(id) on delete set null,
  action      text not null,
  target_type text,
  target_id   uuid,
  meta        jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists admin_actions_created_idx on public.admin_actions(created_at desc);
alter table public.admin_actions enable row level security;
drop policy if exists admin_actions_read on public.admin_actions;
create policy admin_actions_read on public.admin_actions for select using (public.is_admin());
drop policy if exists admin_actions_insert on public.admin_actions;
create policy admin_actions_insert on public.admin_actions for insert with check (public.is_admin() and admin_id = auth.uid());

-- PROFILES: admins can now actually verify/promote/ban other users
-- (onSetVerified/onSetAdmin/setBanned go through a plain table update)
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update using (auth.uid() = id or public.is_admin());

-- POSTS
drop policy if exists posts_update on public.posts;
create policy posts_update on public.posts for update using (auth.uid() = author_id or public.is_admin());
drop policy if exists posts_delete on public.posts;
create policy posts_delete on public.posts for delete using (auth.uid() = author_id or public.is_admin());

-- ============================================================================
--  POSTS PUBLIC-STATUS PRIVACY — a post submitted to the public-feed
--  moderation queue (public_status pending/rejected) was readable by
--  literally anyone via a direct API call: the original posts_read policy
--  above never checked public_status at all, so "not yet approved for the
--  public feed" was never actually private at the database level, only
--  hidden by client-side filtering in App.jsx's homeVisible (trivially
--  bypassable). Restricted to the author, admins, and — matching
--  homeVisible's own logic, which already always shows a followed author's
--  posts regardless of public_status — the author's followers, until the
--  post is approved (or rejected, at which point it's back to being an
--  ordinary followers-only post). Placed here, after is_admin() exists.
-- ============================================================================
drop policy if exists posts_read on public.posts;
create policy posts_read on public.posts for select using (
  (not hidden or author_id = auth.uid())
  and (
    public_status not in ('pending', 'rejected')
    or author_id = auth.uid()
    or public.is_admin()
    or exists (select 1 from public.follows f where f.follower_id = auth.uid() and f.following_id = author_id)
  )
);

-- admin_review_public: the client (admin.reviewPublic() in src/lib/api.js,
-- driving the "საჯარო" moderation queue) has been calling this RPC for a
-- while, but it never existed server-side — approving/rejecting a public
-- post only ever updated the admin's own optimistic client state, never the
-- database, so public_status stayed 'pending' forever and the author never
-- found out either way.
create or replace function public.admin_review_public(post_id uuid, approve boolean)
returns void language plpgsql security definer set search_path = public as $$
declare pauthor uuid;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  select author_id into pauthor from public.posts where id = post_id;
  if pauthor is null then return; end if;
  update public.posts set public_status = case when approve then 'approved' else 'rejected' end where id = post_id;
  insert into public.notifications (user_id, type, from_id, post_id)
  values (pauthor, case when approve then 'public_approved' else 'public_rejected' end, pauthor, post_id);
end;
$$;
grant execute on function public.admin_review_public(uuid, boolean) to authenticated;

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

-- comment like → notification for the comment's author (distinct from a
-- post like, so it carries the comment_id for deep-linking straight to it)
create or replace function public.notify_on_comment_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid; pid uuid;
begin
  select author_id, post_id into owner, pid from public.comments where id = new.comment_id;
  if owner is not null and owner <> new.user_id then
    insert into public.notifications (user_id, type, from_id, post_id, comment_id)
    values (owner, 'comment_like', new.user_id, pid, new.comment_id);
  end if;
  return new;
end; $$;
drop trigger if exists trg_notify_comment_like on public.comment_likes;
create trigger trg_notify_comment_like after insert on public.comment_likes
  for each row execute function public.notify_on_comment_like();

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
-- shared locations are only visible to *mutual* followers (you follow them
-- and they follow you back) — not to every authenticated user.
create policy user_locations_read on public.user_locations for select using (
  auth.uid() = user_id
  or (
    shared = true
    and exists (select 1 from public.follows where follower_id = auth.uid() and following_id = user_locations.user_id)
    and exists (select 1 from public.follows where follower_id = user_locations.user_id and following_id = auth.uid())
  )
);
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

-- story like → notification
create or replace function public.notify_on_story_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  select author_id into owner from public.stories where id = new.story_id;
  if owner is not null and owner <> new.user_id then
    insert into public.notifications (user_id, type, from_id, story_id)
    values (owner, 'story_like', new.user_id, new.story_id);
  end if;
  return new;
end; $$;
drop trigger if exists trg_notify_story_like on public.story_likes;
create trigger trg_notify_story_like after insert on public.story_likes
  for each row execute function public.notify_on_story_like();

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

-- story comment → notification
create or replace function public.notify_on_story_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  select author_id into owner from public.stories where id = new.story_id;
  if owner is not null and owner <> new.author_id then
    insert into public.notifications (user_id, type, from_id, story_id, text)
    values (owner, 'story_comment', new.author_id, new.story_id, new.text);
  end if;
  return new;
end; $$;
drop trigger if exists trg_notify_story_comment on public.story_comments;
create trigger trg_notify_story_comment after insert on public.story_comments
  for each row execute function public.notify_on_story_comment();

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

-- reel comment → notification
create or replace function public.notify_on_reel_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  select author_id into owner from public.reels where id = new.reel_id;
  if owner is not null and owner <> new.author_id then
    insert into public.notifications (user_id, type, from_id, reel_id, text)
    values (owner, 'reel_comment', new.author_id, new.reel_id, new.text);
  end if;
  return new;
end; $$;
drop trigger if exists trg_notify_reel_comment on public.reel_comments;
create trigger trg_notify_reel_comment after insert on public.reel_comments
  for each row execute function public.notify_on_reel_comment();

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
  -- generate_series has no plain `date` overload — passing date bounds with
  -- an interval step makes Postgres fall back to its timestamp overload, so
  -- gs.day comes back as timestamp, not date. That mismatched the declared
  -- `returns table(day date, ...)` above (SQLSTATE 42804: "structure of
  -- query does not match function result type") and broke this function
  -- outright — caught live via the admin panel's dbErr banner, not by any
  -- static check, since nothing in this repo runs schema.sql against a real
  -- Postgres instance.
  select gs.day::date,
    (select count(*) from public.profiles p where p.created_at::date = gs.day::date)::bigint as new_users,
    (select count(*) from public.posts po where po.created_at::date = gs.day::date)::bigint as new_posts,
    (select count(*) from public.comments c where c.created_at::date = gs.day::date)::bigint as new_comments
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
--  PHOTO ALBUMS — standalone uploaded photos (not posts), organized into
--  optional folders. album_id = null means the photo sits in the owner's
--  default "unsorted" bucket. Deleting an album sets its photos' album_id
--  back to null (set null, not cascade) so photos are never lost, only
--  unfiled — matches how most photo apps handle folder deletion.
-- ============================================================================
create table if not exists public.photo_albums (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  cover text,
  created_at timestamptz not null default now()
);
create index if not exists photo_albums_owner_idx on public.photo_albums(owner_id, created_at desc);

alter table public.photo_albums enable row level security;
drop policy if exists photo_albums_read on public.photo_albums;
create policy photo_albums_read on public.photo_albums for select using (true);
drop policy if exists photo_albums_insert on public.photo_albums;
create policy photo_albums_insert on public.photo_albums for insert with check (auth.uid() = owner_id);
drop policy if exists photo_albums_update on public.photo_albums;
create policy photo_albums_update on public.photo_albums for update using (auth.uid() = owner_id);
drop policy if exists photo_albums_delete on public.photo_albums;
create policy photo_albums_delete on public.photo_albums for delete using (auth.uid() = owner_id);

create table if not exists public.album_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid references public.photo_albums(id) on delete set null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  image text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists album_photos_owner_idx on public.album_photos(owner_id, album_id, position);

alter table public.album_photos enable row level security;
drop policy if exists album_photos_read on public.album_photos;
create policy album_photos_read on public.album_photos for select using (true);
drop policy if exists album_photos_insert on public.album_photos;
create policy album_photos_insert on public.album_photos for insert with check (auth.uid() = owner_id);
drop policy if exists album_photos_update on public.album_photos;
create policy album_photos_update on public.album_photos for update using (auth.uid() = owner_id);
drop policy if exists album_photos_delete on public.album_photos;
create policy album_photos_delete on public.album_photos for delete using (auth.uid() = owner_id);

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
do $$ begin
  alter publication supabase_realtime add table public.user_locations;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.conversations;
exception when duplicate_object then null; end $$;

-- ============================================================================
--  PERFORMANCE INDEXES — covers foreign-key / lookup columns that aren't
--  already the leading column of a composite primary key (e.g. reactions'
--  PK is (post_id, user_id), so post_id lookups are already indexed but
--  user_id-only lookups — "all my reactions" — are not, until now).
-- ============================================================================
create index if not exists reactions_user_idx on public.reactions(user_id);
create index if not exists follows_following_idx on public.follows(following_id);
create index if not exists reel_likes_user_idx on public.reel_likes(user_id);
create index if not exists group_members_user_idx on public.group_members(user_id);
create index if not exists group_posts_group_idx on public.group_posts(group_id);
create index if not exists event_rsvps_user_idx on public.event_rsvps(user_id);
create index if not exists listings_seller_idx on public.listings(seller_id);
create index if not exists reviews_seller_idx on public.reviews(seller_id);
create index if not exists orders_listing_idx on public.orders(listing_id);
create index if not exists orders_buyer_idx on public.orders(buyer_id);
create index if not exists films_author_idx on public.films(author_id);
create index if not exists film_reviews_film_idx on public.film_reviews(film_id);
create index if not exists film_watch_user_idx on public.film_watch(user_id);
create index if not exists songs_author_idx on public.songs(author_id);
create index if not exists thread_replies_thread_idx on public.thread_replies(thread_id);
create index if not exists thread_votes_user_idx on public.thread_votes(user_id);
create index if not exists user_blocks_blocked_idx on public.user_blocks(blocked_id);
create index if not exists user_mutes_muted_idx on public.user_mutes(muted_id);
create index if not exists close_friends_friend_idx on public.close_friends(friend_id);
create index if not exists post_saves_user_idx on public.post_saves(user_id);
create index if not exists comment_likes_user_idx on public.comment_likes(user_id);
create index if not exists story_likes_user_idx on public.story_likes(user_id);
create index if not exists story_comments_story_idx on public.story_comments(story_id);
create index if not exists reel_comments_reel_idx on public.reel_comments(reel_id);
create index if not exists reel_saves_user_idx on public.reel_saves(user_id);
create index if not exists highlights_owner_idx on public.highlights(owner_id);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);

-- ============================================================================
--  RATE LIMITING — blocks bursts of posts/comments/messages from a single
--  user. The client already recognises an error message containing
--  "rate_limit" and shows a friendly "slow down" toast instead of the raw
--  DB-error banner (see src/hooks/useToast.js), so no client changes are
--  needed — this trigger is the only piece that was missing.
-- ============================================================================
create or replace function public.rl_enforce()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  col         text := TG_ARGV[0];
  max_count   int  := TG_ARGV[1]::int;
  window_secs int  := TG_ARGV[2]::int;
  uid         uuid;
  cnt         int;
begin
  uid := (to_jsonb(NEW) ->> col)::uuid;
  execute format(
    'select count(*) from %I.%I where %I = $1 and created_at > now() - make_interval(secs => $2)',
    TG_TABLE_SCHEMA, TG_TABLE_NAME, col
  ) into cnt using uid, window_secs;
  if cnt >= max_count then
    raise exception 'rate_limit: too many recent inserts on %', TG_TABLE_NAME;
  end if;
  return NEW;
end;
$$;

drop trigger if exists posts_rate_limit on public.posts;
create trigger posts_rate_limit before insert on public.posts
  for each row execute function public.rl_enforce('author_id', 8, 30);

drop trigger if exists comments_rate_limit on public.comments;
create trigger comments_rate_limit before insert on public.comments
  for each row execute function public.rl_enforce('author_id', 15, 30);

drop trigger if exists messages_rate_limit on public.messages;
create trigger messages_rate_limit before insert on public.messages
  for each row execute function public.rl_enforce('sender_id', 20, 15);

drop trigger if exists reactions_rate_limit on public.reactions;
create trigger reactions_rate_limit before insert on public.reactions
  for each row execute function public.rl_enforce('user_id', 40, 30);

drop trigger if exists follows_rate_limit on public.follows;
create trigger follows_rate_limit before insert on public.follows
  for each row execute function public.rl_enforce('follower_id', 20, 30);

drop trigger if exists listings_rate_limit on public.listings;
create trigger listings_rate_limit before insert on public.listings
  for each row execute function public.rl_enforce('seller_id', 5, 60);

drop trigger if exists threads_rate_limit on public.threads;
create trigger threads_rate_limit before insert on public.threads
  for each row execute function public.rl_enforce('author_id', 5, 60);

-- these five had the same abuse surface as the tables above (unbounded
-- inserts from one user) but never got a trigger — closed as part of the
-- full security audit below.
drop trigger if exists reports_rate_limit on public.reports;
create trigger reports_rate_limit before insert on public.reports
  for each row execute function public.rl_enforce('reporter_id', 10, 60);

drop trigger if exists thread_replies_rate_limit on public.thread_replies;
create trigger thread_replies_rate_limit before insert on public.thread_replies
  for each row execute function public.rl_enforce('author_id', 20, 30);

drop trigger if exists group_posts_rate_limit on public.group_posts;
create trigger group_posts_rate_limit before insert on public.group_posts
  for each row execute function public.rl_enforce('author_id', 10, 30);

drop trigger if exists story_comments_rate_limit on public.story_comments;
create trigger story_comments_rate_limit before insert on public.story_comments
  for each row execute function public.rl_enforce('author_id', 20, 30);

drop trigger if exists reel_comments_rate_limit on public.reel_comments;
create trigger reel_comments_rate_limit before insert on public.reel_comments
  for each row execute function public.rl_enforce('author_id', 20, 30);

-- ============================================================================
--  SECURITY HARDENING — RLS gaps found in a full-schema audit. Each one below
--  replaces an earlier, looser policy defined further up this file; kept as a
--  separate dated section (rather than editing in place) so the audit trail
--  of what was wrong and why is preserved.
-- ============================================================================

-- 1) STORIES: close_friends was read/written by the client for a while but
-- never defined here (same undocumented-column class as groups.is_private
-- below), and stories_read ignored it entirely — a "close friends only"
-- story was actually readable by anyone. is_close_friend_of() has to be
-- security definer: close_friends' own RLS only lets a user read ROWS THEY
-- OWN (user_id = auth.uid()), so a plain subquery run as the viewing user
-- would find nothing even for a genuine close friend.
alter table public.stories add column if not exists close_friends boolean not null default false;

create or replace function public.is_close_friend_of(target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.close_friends where user_id = target and friend_id = auth.uid());
$$;

-- 2026-07 revision: stories were never meant to be public at all — default
-- visibility is followers-only, close_friends narrows that further, and
-- is_broadcast is a separate admin-only escape hatch (a story visible to
-- literally everyone, for a future ads/announcement placement) rather than
-- something any user can set on their own story. follows_read is `using
-- (true)` (follow relationships are already public elsewhere in the app),
-- so this subquery doesn't need to be security definer the way
-- is_close_friend_of does.
alter table public.stories add column if not exists is_broadcast boolean not null default false;

drop policy if exists stories_read on public.stories;
create policy stories_read on public.stories for select using (
  auth.uid() = author_id
  or is_broadcast
  or public.is_admin()
  or (
    exists (select 1 from public.follows f where f.follower_id = auth.uid() and f.following_id = author_id)
    and (not close_friends or public.is_close_friend_of(author_id))
  )
);

-- only an admin may set is_broadcast — everyone else's stories_insert check
-- forces it back to false regardless of what the client sends.
drop policy if exists stories_insert on public.stories;
create policy stories_insert on public.stories for insert with check (
  auth.uid() = author_id and (not is_broadcast or public.is_admin())
);

-- 2) GROUPS: is_private was read/written by the client (groups.setPrivate(),
-- discover.jsx's lock icon, requestJoin's pending-vs-approved branch) but,
-- like group_members.status/role above, was never defined here — and every
-- read/insert policy on groups/group_members/group_posts used `using (true)`
-- or an owner-only check with no privacy or membership check at all. Net
-- effect: a private group's roster, posts, and metadata were all readable by
-- anyone, and posting into ANY group (private or not, joined or not) was
-- unrestricted. is_group_member() is security definer for the same reason as
-- is_close_friend_of() above — group_members_read (below) is itself
-- membership-gated, so a plain subquery would be circular.
alter table public.groups add column if not exists is_private boolean not null default false;

create or replace function public.is_group_member(gid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.group_members gm where gm.group_id = gid and gm.user_id = auth.uid() and gm.status = 'approved'
  ) or exists (
    select 1 from public.groups g where g.id = gid and g.created_by = auth.uid()
  );
$$;

drop policy if exists groups_read on public.groups;
create policy groups_read on public.groups for select using (
  not is_private or public.is_group_member(id) or public.is_admin()
);

drop policy if exists gmem_read on public.group_members;
create policy gmem_read on public.group_members for select using (
  exists (select 1 from public.groups g where g.id = group_id and not g.is_private)
  or public.is_group_member(group_id) or public.is_admin()
);

-- self-join used to be a bare `user_id = auth.uid()` with no check on
-- status/role/privacy at all — a user could insert themselves as
-- status='approved' into a private group (skipping the pending-approval
-- flow that requestJoin() enforces client-side) or role='owner' into
-- anyone's group (cosmetic only — ownership checks elsewhere read
-- groups.created_by, never this column — but tightened anyway).
drop policy if exists gmem_rw on public.group_members;
create policy gmem_insert on public.group_members for insert with check (
  auth.uid() = user_id
  and (
    (status = 'approved' and not exists (select 1 from public.groups g where g.id = group_id and g.is_private))
    or (status = 'pending' and exists (select 1 from public.groups g where g.id = group_id and g.is_private))
  )
  and (role = 'member' or exists (select 1 from public.groups g where g.id = group_id and g.created_by = auth.uid()))
);

drop policy if exists gposts_read on public.group_posts;
create policy gposts_read on public.group_posts for select using (
  exists (select 1 from public.groups g where g.id = group_id and not g.is_private)
  or public.is_group_member(group_id) or public.is_admin()
);

-- used to only check auth.uid() = author_id — anyone could post into any
-- group, private or not, joined or not.
drop policy if exists gposts_insert on public.group_posts;
create policy gposts_insert on public.group_posts for insert with check (
  auth.uid() = author_id and public.is_group_member(group_id)
);

-- the group_posts table above is a separate, older path — the group-posting
-- flow the client actually uses (useGroups.js's onGroupPost) inserts into
-- public.posts with group_id set (see the posts.group_id comment near where
-- that column is added). posts_insert had exactly the same gap: only
-- auth.uid() = author_id, no group-membership check, so the table that's
-- actually in use was equally postable-into by a non-member.
drop policy if exists posts_insert on public.posts;
create policy posts_insert on public.posts for insert with check (
  auth.uid() = author_id and (group_id is null or public.is_group_member(group_id))
);

-- 3) CONVERSATIONS: the `user_id = auth.uid()` clause exists so a brand-new
-- conversation's creator can insert the first membership row (before any
-- row exists, is_conversation_member() is necessarily false, so it can't be
-- the only path in) — but it had no restriction on WHICH conversation_id,
-- so any authenticated user could self-insert into any EXISTING
-- conversation and start reading its messages. Now the bootstrap path only
-- works for a conversation the caller actually created.
drop policy if exists conv_mem_insert on public.conversation_members;
create policy conv_mem_insert on public.conversation_members for insert with check (
  public.is_conversation_member(conversation_id)
  or (user_id = auth.uid() and exists (select 1 from public.conversations c where c.id = conversation_id and c.created_by = auth.uid()))
);

-- 4) ORDERS: a seller had no way to read orders placed against their own
-- listings (only the buyer could) — an app-breaking gap, not an exposure,
-- but a seller-facing "my orders" view is impossible without this.
drop policy if exists orders_read on public.orders;
create policy orders_read on public.orders for select using (
  auth.uid() = buyer_id or exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid())
);

-- ============================================================================
--  STORAGE (media bucket: avatars, post images, story media, voice notes)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- chat attachments (images/voice/docs, uploaded to {uid}/chat/...) are private
-- DM content, unlike every other folder in this bucket (avatars/posts/stories/
-- reels/albums/market covers), which are meant to be public. The path doesn't
-- carry a conversation_id, so this can't be scoped to actual conversation
-- membership without reworking the upload path — as a partial mitigation,
-- require at least authentication for the chat folder specifically, closing
-- off anonymous/unauthenticated scraping even though any logged-in user who
-- has or guesses a chat attachment's URL can still read it.
drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects
  for select using (
    bucket_id = 'media'
    and ((storage.foldername(name))[2] is distinct from 'chat' or auth.role() = 'authenticated')
  );

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
--  PRIVATE ACCOUNTS — the "დახურული ანგარიში" settings toggle only ever
--  wrote to localStorage (mz_settings), never the database, so it was
--  decorative: nobody's content was actually gated by it. Wired up for real:
--  a private profile's posts/reels/albums are only visible to the owner,
--  admins, and accounts that MUTUALLY follow each other (both directions) —
--  not just a one-way "approved follower", per how this app's private
--  accounts are meant to work.
-- ============================================================================
alter table public.profiles add column if not exists is_private boolean not null default false;

create or replace function public.is_mutual_follow(target uuid)
returns boolean language sql stable as $$
  select exists (select 1 from public.follows where follower_id = auth.uid() and following_id = target)
     and exists (select 1 from public.follows where follower_id = target and following_id = auth.uid());
$$;

create or replace function public.can_view_private_content(target uuid)
returns boolean language sql stable as $$
  select target = auth.uid()
    or public.is_admin()
    or not exists (select 1 from public.profiles p where p.id = target and p.is_private)
    or public.is_mutual_follow(target);
$$;

drop policy if exists posts_read on public.posts;
create policy posts_read on public.posts for select using (
  (not hidden or author_id = auth.uid())
  and (
    public_status not in ('pending', 'rejected')
    or author_id = auth.uid()
    or public.is_admin()
    or exists (select 1 from public.follows f where f.follower_id = auth.uid() and f.following_id = author_id)
  )
  and public.can_view_private_content(author_id)
);

drop policy if exists reels_read on public.reels;
create policy reels_read on public.reels for select using (public.can_view_private_content(author_id));

drop policy if exists photo_albums_read on public.photo_albums;
create policy photo_albums_read on public.photo_albums for select using (public.can_view_private_content(owner_id));

drop policy if exists album_photos_read on public.album_photos;
create policy album_photos_read on public.album_photos for select using (public.can_view_private_content(owner_id));

-- ============================================================================
--  მზადაა! შემდეგი ნაბიჯები იხ. README.md
-- ============================================================================
