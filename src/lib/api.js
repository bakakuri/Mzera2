import { supabase } from "./supabase";

/*
 * mzera — Supabase API ფენა.
 * ეს ფუნქციები ემთხვევა supabase/schema.sql-ს. App.jsx ამჟამად მუშაობს
 * demo (in-memory) მონაცემებზე; როცა Supabase-ს დააკავშირებ (.env + schema.sql),
 * შეგიძლია App-ის useState/handler-ები თანდათან ამ ფუნქციებით ჩაანაცვლო.
 */

const need = () => {
  if (!supabase) throw new Error("Supabase არ არის დაკონფიგურირებული (.env). იხ. README.");
  return supabase;
};

/* ───────────── AUTH ───────────── */
export const auth = {
  signUp: async (email, password, username, name) => {
    const sb = need();
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { username, name } },
    });
    if (error) throw error;
    return data;
  },
  signIn: async (email, password) => {
    const sb = need();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },
  signOut: async () => {
    await need().auth.signOut();
  },
  getSession: async () => {
    const { data } = await need().auth.getSession();
    return data.session;
  },
  onChange: (cb) => need().auth.onAuthStateChange((_e, session) => cb(session)),
};

/* ───────────── PROFILES ───────────── */
export const profiles = {
  get: async (id) => {
    const { data, error } = await need().from("profiles").select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  },
  stats: async (id) => {
    const { data, error } = await need().from("profile_stats").select("*").eq("id", id).single();
    if (error) throw error;
    return data; // { follower_count, following_count, post_count, ... }
  },
  update: async (id, patch) => {
    const { data, error } = await need().from("profiles").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  search: async (q) => {
    const { data, error } = await need()
      .from("profiles")
      .select("*")
      .or(`username.ilike.%${q}%,name.ilike.%${q}%`)
      .limit(20);
    if (error) throw error;
    return data;
  },
  byIds: async (ids) => {
    const { data, error } = await need().from("profiles").select("*").in("id", ids);
    if (error) throw error;
    return data;
  },
};

/* ───────────── POSTS / FEED ───────────── */
export const posts = {
  feed: async () => {
    const { data, error } = await need()
      .from("posts")
      .select("*, author:profiles!posts_author_id_fkey(*)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data;
  },
  feedPlain: async () => {
    const { data, error } = await need()
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data;
  },
  byUser: async (userId) => {
    const { data, error } = await need()
      .from("posts")
      .select("*")
      .eq("author_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  create: async ({ text, imageUrl, poll }) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data, error } = await sb
      .from("posts")
      .insert({ author_id: uid, text, image_url: imageUrl, has_poll: !!poll })
      .select()
      .single();
    if (error) throw error;
    if (poll && data) {
      const rows = poll.options.map((o, idx) => ({ post_id: data.id, idx, text: o.text }));
      await sb.from("poll_options").insert(rows);
    }
    return data;
  },
  remove: async (id) => {
    const { error } = await need().from("posts").delete().eq("id", id);
    if (error) throw error;
  },
};

/* ───────────── REACTIONS (like / emoji) ───────────── */
export const reactions = {
  toggle: async (postId, emoji = "❤️") => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data: existing } = await sb
      .from("reactions")
      .select("emoji")
      .eq("post_id", postId)
      .eq("user_id", uid)
      .maybeSingle();
    if (existing && existing.emoji === emoji) {
      await sb.from("reactions").delete().eq("post_id", postId).eq("user_id", uid);
      return null;
    }
    await sb.from("reactions").upsert({ post_id: postId, user_id: uid, emoji });
    return emoji;
  },
  mine: async () => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data, error } = await sb.from("reactions").select("post_id, emoji").eq("user_id", uid);
    if (error) throw error;
    return data;
  },
  forPosts: async (ids) => {
    const { data, error } = await need().from("reactions").select("post_id, user_id, emoji").in("post_id", ids);
    if (error) throw error;
    return data;
  },
};

/* ───────────── POLLS ───────────── */
export const polls = {
  vote: async (postId, optionIdx) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { error } = await sb.from("poll_votes").insert({ post_id: postId, user_id: uid, option_idx: optionIdx });
    if (error) throw error;
  },
};

/* ───────────── COMMENTS ───────────── */
export const comments = {
  list: async (postId) => {
    const { data, error } = await need()
      .from("comments")
      .select("*, author:profiles!comments_author_id_fkey(*)")
      .eq("post_id", postId)
      .order("created_at");
    if (error) throw error;
    return data;
  },
  add: async (postId, text) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data, error } = await sb.from("comments").insert({ post_id: postId, author_id: uid, text }).select().single();
    if (error) throw error;
    return data;
  },
  forPosts: async (ids) => {
    const { data, error } = await need().from("comments").select("*, author:profiles!comments_author_id_fkey(*)").in("post_id", ids).order("created_at");
    if (error) throw error;
    return data;
  },
};

/* ───────────── FOLLOWS ───────────── */
export const follows = {
  toggle: async (targetId) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data: existing } = await sb
      .from("follows")
      .select("follower_id")
      .eq("follower_id", uid)
      .eq("following_id", targetId)
      .maybeSingle();
    if (existing) {
      await sb.from("follows").delete().eq("follower_id", uid).eq("following_id", targetId);
      return false;
    }
    await sb.from("follows").insert({ follower_id: uid, following_id: targetId });
    return true;
  },
  followers: async (userId) => {
    const { data, error } = await need()
      .from("follows")
      .select("follower:profiles!follows_follower_id_fkey(*)")
      .eq("following_id", userId);
    if (error) throw error;
    return data.map((r) => r.follower);
  },
  following: async (userId) => {
    const { data, error } = await need()
      .from("follows")
      .select("following:profiles!follows_following_id_fkey(*)")
      .eq("follower_id", userId);
    if (error) throw error;
    return data.map((r) => r.following);
  },
};

/* ───────────── MESSAGES / CHAT ───────────── */
export const chat = {
  conversations: async () => {
    const { data, error } = await need()
      .from("conversations")
      .select("*, members:conversation_members(profiles!conversation_members_user_id_fkey(*)), messages(*)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  messages: async (conversationId) => {
    const { data, error } = await need()
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at");
    if (error) throw error;
    return data;
  },
  send: async (conversationId, payload) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data, error } = await sb
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: uid, ...payload })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  createConversation: async (memberIds, name = null) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const isGroup = memberIds.length > 1;
    const { data: conv, error } = await sb
      .from("conversations")
      .insert({ is_group: isGroup, name, created_by: uid })
      .select()
      .single();
    if (error) throw error;
    const members = [...new Set([uid, ...memberIds])].map((id) => ({ conversation_id: conv.id, user_id: id }));
    await sb.from("conversation_members").insert(members);
    return conv;
  },
  // Realtime: ახალ მესიჯებზე გამოწერა
  subscribe: (conversationId, onMsg) =>
    need()
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (p) => onMsg(p.new)
      )
      .subscribe(),
};

/* ───────────── NOTIFICATIONS ───────────── */
export const notifications = {
  list: async () => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data, error } = await sb
      .from("notifications")
      .select("*, from:profiles!notifications_from_id_fkey(*)")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data;
  },
  markAllRead: async () => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    await sb.from("notifications").update({ read: true }).eq("user_id", uid);
  },
  subscribe: (userId, onNew) =>
    need()
      .channel(`notifs:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (p) => onNew(p.new)
      )
      .subscribe(),
};

/* ───────────── LEADERBOARD ───────────── */
export const leaderboard = {
  top: async (limit = 50) => {
    const { data, error } = await need()
      .from("profiles")
      .select("id, username, name, xp, verified")
      .order("xp", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  },
};

/* ───────────── MARKETPLACE ───────────── */
export const market = {
  listings: async () => {
    const { data, error } = await need()
      .from("listings")
      .select("*, seller:profiles!listings_seller_id_fkey(*)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  listingsPlain: async () => {
    const { data, error } = await need().from("listings").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  create: async (listing) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data, error } = await sb.from("listings").insert({ ...listing, seller_id: uid }).select().single();
    if (error) throw error;
    return data;
  },
  reviews: async (sellerId) => {
    const { data, error } = await need()
      .from("reviews")
      .select("*, author:profiles!reviews_author_id_fkey(*)")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  addReview: async (sellerId, rating, text) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data, error } = await sb.from("reviews").insert({ seller_id: sellerId, author_id: uid, rating, text }).select().single();
    if (error) throw error;
    return data;
  },
  order: async (listingId, { delivery, payment, address, total }) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data, error } = await sb
      .from("orders")
      .insert({ listing_id: listingId, buyer_id: uid, delivery, payment, address, total, status: "placed" })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

/* ───────────── STORIES ───────────── */
export const stories = {
  list: async () => {
    const { data, error } = await need()
      .from("stories")
      .select("*, author:profiles!stories_author_id_fkey(*)")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  },
  listPlain: async () => {
    const { data, error } = await need()
      .from("stories")
      .select("*")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  },
  create: async ({ image_url, filter, text, stickers }) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data, error } = await sb.from("stories").insert({ author_id: uid, image_url, filter, text, stickers }).select().single();
    if (error) throw error;
    return data;
  },
};

/* ───────────── REELS ───────────── */
export const reels = {
  list: async () => {
    const { data, error } = await need()
      .from("reels")
      .select("*, author:profiles!reels_author_id_fkey(*)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  listPlain: async () => {
    const { data, error } = await need().from("reels").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  mine: async () => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data, error } = await sb.from("reel_likes").select("reel_id").eq("user_id", uid);
    if (error) throw error;
    return data;
  },
  toggleLike: async (reelId) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data: ex } = await sb.from("reel_likes").select("reel_id").eq("reel_id", reelId).eq("user_id", uid).maybeSingle();
    if (ex) { await sb.from("reel_likes").delete().eq("reel_id", reelId).eq("user_id", uid); return false; }
    await sb.from("reel_likes").insert({ reel_id: reelId, user_id: uid });
    return true;
  },
  create: async ({ video_url, thumb_url, caption, audio }) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data, error } = await sb.from("reels").insert({ author_id: uid, video_url, thumb_url, caption, audio }).select().single();
    if (error) throw error;
    return data;
  },
};

/* ───────────── GROUPS ───────────── */
export const groups = {
  list: async () => {
    const { data, error } = await need()
      .from("groups")
      .select("*, group_members(user_id), group_posts(*, author:profiles!group_posts_author_id_fkey(*))")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  toggleJoin: async (groupId) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data: ex } = await sb.from("group_members").select("user_id").eq("group_id", groupId).eq("user_id", uid).maybeSingle();
    if (ex) { await sb.from("group_members").delete().eq("group_id", groupId).eq("user_id", uid); return false; }
    await sb.from("group_members").insert({ group_id: groupId, user_id: uid });
    return true;
  },
  post: async (groupId, { text, imageUrl }) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data, error } = await sb.from("group_posts").insert({ group_id: groupId, author_id: uid, text, image_url: imageUrl }).select("*, author:profiles!group_posts_author_id_fkey(*)").single();
    if (error) throw error;
    return data;
  },
};

/* ───────────── EVENTS ───────────── */
export const events = {
  list: async () => {
    const { data, error } = await need()
      .from("events")
      .select("*, host:profiles!events_host_id_fkey(*), event_rsvps(user_id, status)")
      .order("starts_at", { ascending: true });
    if (error) throw error;
    return data;
  },
  rsvp: async (eventId, status) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { error } = await sb.from("event_rsvps").upsert({ event_id: eventId, user_id: uid, status });
    if (error) throw error;
  },
};

/* ───────────── FORUM ───────────── */
export const forum = {
  list: async () => {
    const { data, error } = await need()
      .from("threads")
      .select("*, author:profiles!threads_author_id_fkey(*), thread_replies(*, author:profiles!thread_replies_author_id_fkey(*)), thread_votes(user_id)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  create: async ({ title, body, category }) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data, error } = await sb.from("threads").insert({ author_id: uid, title, body, category }).select().single();
    if (error) throw error;
    await sb.from("thread_votes").insert({ thread_id: data.id, user_id: uid });
    return data;
  },
  reply: async (threadId, text) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data, error } = await sb.from("thread_replies").insert({ thread_id: threadId, author_id: uid, text }).select("*, author:profiles!thread_replies_author_id_fkey(*)").single();
    if (error) throw error;
    return data;
  },
  toggleVote: async (threadId) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data: ex } = await sb.from("thread_votes").select("user_id").eq("thread_id", threadId).eq("user_id", uid).maybeSingle();
    if (ex) { await sb.from("thread_votes").delete().eq("thread_id", threadId).eq("user_id", uid); return false; }
    await sb.from("thread_votes").insert({ thread_id: threadId, user_id: uid });
    return true;
  },
};

/* ───────────── STORAGE (media) ───────────── */
export const storage = {
  upload: async (file, folder = "uploads") => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const path = `${uid}/${folder}/${Date.now()}-${file.name}`;
    const { error } = await sb.storage.from("media").upload(path, file, { upsert: false });
    if (error) throw error;
    return sb.storage.from("media").getPublicUrl(path).data.publicUrl;
  },
};
