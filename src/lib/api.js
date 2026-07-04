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
  signUp: async (email, password, username, name, refCode) => {
    const sb = need();
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { username, name, ...(refCode ? { ref_code: refCode } : {}) } },
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
  suggested: async (lim = 14) => { const { data, error } = await need().rpc("suggested_users", { lim }); if (error) throw error; return data || []; },
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
    const { data, error } = await need().from("profiles").update(patch).eq("id", id).select().maybeSingle();
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
  all: async (limit = 50) => {
    const { data, error } = await need().from("profiles").select("*").order("xp", { ascending: false }).limit(limit);
    if (error) throw error;
    return data || [];
  },
  search: async (q, limit = 20) => {
    const term = "%" + String(q).replace(/[%,()]/g, "") + "%";
    const { data, error } = await need().from("profiles").select("*").or(`name.ilike.${term},username.ilike.${term}`).limit(limit);
    if (error) throw error;
    return data || [];
  },
  count: async () => {
    const { count } = await need().from("profiles").select("id", { count: "exact", head: true });
    return count || 0;
  },
  block: async (id) => {
    const sb = need(); const uid = (await sb.auth.getUser()).data.user.id;
    await sb.from("user_blocks").upsert({ blocker_id: uid, blocked_id: id }, { onConflict: "blocker_id,blocked_id" });
    await sb.from("follows").delete().or(`and(follower_id.eq.${uid},following_id.eq.${id}),and(follower_id.eq.${id},following_id.eq.${uid})`);
  },
  unblock: async (id) => {
    const sb = need(); const uid = (await sb.auth.getUser()).data.user.id;
    await sb.from("user_blocks").delete().eq("blocker_id", uid).eq("blocked_id", id);
  },
  myReferralStats: async () => {
    const { data, error } = await need().rpc("my_referral_stats");
    if (error) throw error;
    return (data && data[0]) || null;
  },
  myReferredUsers: async () => {
    const { data, error } = await need().rpc("my_referred_users");
    if (error) throw error;
    return data || [];
  },
  blockedList: async () => {
    const sb = need(); const uid = (await sb.auth.getUser()).data.user.id;
    const { data } = await sb.from("user_blocks").select("blocked_id").eq("blocker_id", uid);
    return (data || []).map(r => r.blocked_id);
  },
  mute: async (id) => {
    const sb = need(); const uid = (await sb.auth.getUser()).data.user.id;
    await sb.from("user_mutes").upsert({ muter_id: uid, muted_id: id }, { onConflict: "muter_id,muted_id" });
  },
  unmute: async (id) => {
    const sb = need(); const uid = (await sb.auth.getUser()).data.user.id;
    await sb.from("user_mutes").delete().eq("muter_id", uid).eq("muted_id", id);
  },
  mutedList: async () => {
    const sb = need(); const uid = (await sb.auth.getUser()).data.user.id;
    const { data } = await sb.from("user_mutes").select("muted_id").eq("muter_id", uid);
    return (data || []).map(r => r.muted_id);
  },
  addCloseFriend: async (id) => {
    const sb = need(); const uid = (await sb.auth.getUser()).data.user.id;
    await sb.from("close_friends").upsert({ user_id: uid, friend_id: id }, { onConflict: "user_id,friend_id" });
  },
  removeCloseFriend: async (id) => {
    const sb = need(); const uid = (await sb.auth.getUser()).data.user.id;
    await sb.from("close_friends").delete().eq("user_id", uid).eq("friend_id", id);
  },
  closeFriendsList: async () => {
    const sb = need(); const uid = (await sb.auth.getUser()).data.user.id;
    const { data } = await sb.from("close_friends").select("friend_id").eq("user_id", uid);
    return (data || []).map(r => r.friend_id);
  },
  recordView: async (profileId) => {
    const sb = need(); const uid = (await sb.auth.getUser()).data.user.id;
    if (uid === profileId) return;
    await sb.from("profile_views").upsert({ viewer_id: uid, profile_id: profileId, viewed_at: new Date().toISOString() }, { onConflict: "viewer_id,profile_id" });
  },
  viewers: async (limit = 50) => {
    const sb = need(); const uid = (await sb.auth.getUser()).data.user.id;
    const { data, error } = await sb.from("profile_views").select("viewed_at, viewer:profiles!profile_views_viewer_id_fkey(*)").eq("profile_id", uid).order("viewed_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return (data || []).map(r => ({ ...r.viewer, viewedAt: r.viewed_at }));
  },
  viewersCount: async () => {
    const sb = need(); const uid = (await sb.auth.getUser()).data.user.id;
    const { count } = await sb.from("profile_views").select("viewer_id", { count: "exact", head: true }).eq("profile_id", uid);
    return count || 0;
  },
  notifyBirthdayFollowers: async () => { const { error } = await need().rpc("notify_birthday_followers"); if (error) throw error; },
  deleteAccount: async () => { const sb = need(); const { error } = await sb.rpc("delete_my_account"); if (error) throw error; await sb.auth.signOut().catch(() => {}); },
  exportData: async () => {
    const sb = need(); const uid = (await sb.auth.getUser()).data.user.id;
    const [prof, posts, comments, reels, listings, followers, following] = await Promise.all([
      sb.from("profiles").select("*").eq("id", uid).maybeSingle(),
      sb.from("posts").select("text,image_url,images,created_at,scheduled_for").eq("author_id", uid),
      sb.from("comments").select("text,created_at,post_id").eq("author_id", uid),
      sb.from("reels").select("caption,video_url,views,created_at").eq("author_id", uid),
      sb.from("listings").select("title,price,description,created_at").eq("seller_id", uid),
      sb.from("follows").select("follower_id").eq("following_id", uid),
      sb.from("follows").select("following_id").eq("follower_id", uid),
    ]);
    return { exported_at: new Date().toISOString(), profile: prof.data, posts: posts.data || [], comments: comments.data || [], reels: reels.data || [], listings: listings.data || [], followers: (followers.data || []).length, following: (following.data || []).length };
  },
  createCollection: async (name) => { const sb = need(); const uid = (await sb.auth.getUser()).data.user.id; const { data, error } = await sb.from("collections").insert({ user_id: uid, name }).select().single(); if (error) throw error; return data; },
  listCollections: async () => { const sb = need(); const uid = (await sb.auth.getUser()).data.user.id; const { data } = await sb.from("collections").select("*").eq("user_id", uid).order("created_at", { ascending: true }); return data || []; },
  deleteCollection: async (id) => { const sb = need(); await sb.from("collections").delete().eq("id", id); },
  setSaveCollection: async (postId, collectionId) => { const sb = need(); const uid = (await sb.auth.getUser()).data.user.id; await sb.from("post_saves").update({ collection_id: collectionId }).eq("post_id", postId).eq("user_id", uid); },
};

/* ───────────── POSTS / FEED ───────────── */
export const posts = {
  count: async () => {
    const { count } = await need().from("posts").select("id", { count: "exact", head: true });
    return count || 0;
  },
  feed: async () => {
    const { data, error } = await need()
      .from("posts")
      .select("*, author:profiles!posts_author_id_fkey(*), poll_options(idx,text), poll_votes(option_idx,user_id)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data;
  },
  feedPage: async (before, limit = 12) => {
    let q = need()
      .from("posts")
      .select("*, author:profiles!posts_author_id_fkey(*), poll_options(idx,text), poll_votes(option_idx,user_id), shared:posts!posts_shared_post_id_fkey(*, author:profiles!posts_author_id_fkey(*))")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (before) q = q.lt("created_at", before);
    const { data, error } = await q;
    if (error) throw error;
    // scheduled (future) posts are excluded client-side — PostgREST's or() raw-string
    // grammar is too fragile with timestamp values to rely on server-side (see git log)
    return (data || []).filter((p) => !(p.scheduled_for && new Date(p.scheduled_for) > new Date()));
  },
  scheduledMine: async () => {
    const sb = need(); const uid = (await sb.auth.getUser()).data.user.id;
    const { data, error } = await sb.from("posts").select("*, author:profiles!posts_author_id_fkey(*), poll_options(idx,text), poll_votes(option_idx,user_id)").eq("author_id", uid).gt("scheduled_for", new Date().toISOString()).order("scheduled_for", { ascending: true });
    if (error) throw error;
    return data;
  },
  cancelScheduled: async (id) => { const sb = need(); const uid = (await sb.auth.getUser()).data.user.id; await sb.from("posts").delete().eq("id", id).eq("author_id", uid); },
  memories: async () => { const { data, error } = await need().rpc("my_memories"); if (error) throw error; return data || []; },
  forGroup: async (gid) => {
    const { data, error } = await need()
      .from("posts")
      .select("*, author:profiles!posts_author_id_fkey(*), poll_options(idx,text), poll_votes(option_idx,user_id), shared:posts!posts_shared_post_id_fkey(*, author:profiles!posts_author_id_fkey(*))")
      .eq("group_id", gid)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data || [];
  },
  feedSubscribe: (onInsert) =>
    need()
      .channel("feed-new")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, (p) => onInsert(p.new))
      .subscribe(),
  byHashtag: async (tag) => {
    const { data, error } = await need()
      .from("posts")
      .select("*, author:profiles!posts_author_id_fkey(*), poll_options(idx,text), poll_votes(option_idx,user_id), shared:posts!posts_shared_post_id_fkey(*, author:profiles!posts_author_id_fkey(*))")
      .is("group_id", null).is("scheduled_for", null)
      .ilike("text", "%#" + tag + "%")
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) throw error;
    return data || [];
  },
  byId: async (id) => {
    const { data, error } = await need()
      .from("posts")
      .select("*, author:profiles!posts_author_id_fkey(*), poll_options(idx,text), poll_votes(option_idx,user_id), shared:posts!posts_shared_post_id_fkey(*, author:profiles!posts_author_id_fkey(*))")
      .eq("id", id).maybeSingle();
    if (error) throw error;
    return data || null;
  },
  // plain (non-embedded) batch lookup — used as a fallback to hydrate reposts whose
  // shared:posts!... embed came back null (self-referencing FK embeds are flaky on
  // some Postgres/PostgREST versions), so the repost preview doesn't say "deleted"
  // for a post that's still very much there
  byIds: async (ids) => {
    if (!ids || !ids.length) return [];
    const { data, error } = await need().from("posts").select("*, author:profiles!posts_author_id_fkey(*)").in("id", ids);
    if (error) throw error;
    return data || [];
  },
  search: async (term, limit = 20) => {
    const t = "%" + String(term).replace(/[%]/g, "") + "%";
    const { data, error } = await need()
      .from("posts")
      .select("*, author:profiles!posts_author_id_fkey(*)")
      .ilike("text", t)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },
  byHashtag: async (tag, limit = 40) => {
    const t = "%#" + String(tag).replace(/[%#\s]/g, "") + "%";
    const { data, error } = await need()
      .from("posts")
      .select("*, author:profiles!posts_author_id_fkey(*), poll_options(idx,text), poll_votes(option_idx,user_id)")
      .ilike("text", t)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
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
  toggleSave: async (postId) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data: ex } = await sb.from("post_saves").select("post_id").eq("post_id", postId).eq("user_id", uid).maybeSingle();
    if (ex) { await sb.from("post_saves").delete().eq("post_id", postId).eq("user_id", uid); return false; }
    await sb.from("post_saves").insert({ post_id: postId, user_id: uid });
    return true;
  },
  mySaveIds: async () => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data, error } = await sb.from("post_saves").select("post_id").eq("user_id", uid);
    if (error) throw error;
    return (data || []).map(r => r.post_id);
  },
  mySaves: async () => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data, error } = await sb.from("post_saves").select("created_at, collection_id, post:posts!post_saves_post_id_fkey(*, author:profiles!posts_author_id_fkey(*))").eq("user_id", uid).order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(r => r.post ? { ...r.post, _collection_id: r.collection_id } : null).filter(Boolean);
  },
  byUser: async (userId) => {
    const { data, error } = await need()
      .from("posts")
      .select("*, shared:posts!posts_shared_post_id_fkey(*, author:profiles!posts_author_id_fkey(*))")
      .eq("author_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  create: async ({ text, imageUrl, images, poll, scheduled_for, public_status, shared_post_id, bg, feeling, location, tagged, video_url, group_id }) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const arr = (images && images.length) ? images : (imageUrl ? [imageUrl] : null);
    const { data, error } = await sb
      .from("posts")
      .insert({ author_id: uid, text, image_url: arr ? arr[0] : null, images: arr, has_poll: !!poll, scheduled_for: scheduled_for || null, public_status: public_status || "none", shared_post_id: shared_post_id || null, bg: bg || null, feeling: feeling || null, location: location || null, tagged: (tagged && tagged.length) ? tagged : null, video_url: video_url || null, group_id: group_id || null })
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
  update: async (id, patch) => {
    const { error } = await need().from("posts").update(patch).eq("id", id);
    if (error) throw error;
  },
  // real repost counts per original post id, computed client-side from shared_post_id
  // rows (no shares column to keep in sync — the repost rows themselves are the source of truth)
  shareCounts: async () => {
    const { data, error } = await need().from("posts").select("shared_post_id").not("shared_post_id", "is", null);
    if (error) throw error;
    const counts = {};
    (data || []).forEach(r => { counts[r.shared_post_id] = (counts[r.shared_post_id] || 0) + 1; });
    return counts;
  },
};

/* ───────────── REACTIONS (like / emoji) ───────────── */
export const reactions = {
  listForPost: async (postId) => { const { data, error } = await need().from("reactions").select("emoji, user_id, created_at, user:profiles!reactions_user_id_fkey(*)").eq("post_id", postId).order("created_at", { ascending: false }); if (error) throw error; return data || []; },
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
      .select("*, author:profiles!comments_author_id_fkey(*), comment_likes(user_id)")
      .eq("post_id", postId)
      .order("created_at");
    if (error) throw error;
    return data;
  },
  add: async (postId, text, parentId) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data, error } = await sb.from("comments").insert({ post_id: postId, author_id: uid, text, parent_id: parentId || null }).select().single();
    if (error) throw error;
    return data;
  },
  toggleLike: async (commentId) => {
    const sb = need(); const uid = (await sb.auth.getUser()).data.user.id;
    const { data: ex } = await sb.from("comment_likes").select("comment_id").eq("comment_id", commentId).eq("user_id", uid).maybeSingle();
    if (ex) { const { error } = await sb.from("comment_likes").delete().eq("comment_id", commentId).eq("user_id", uid); if (error) throw error; return false; }
    const { error } = await sb.from("comment_likes").insert({ comment_id: commentId, user_id: uid }); if (error) throw error; return true;
  },
  update: async (id, text) => {
    const { error } = await need().from("comments").update({ text }).eq("id", id);
    if (error) throw error;
  },
  remove: async (id) => {
    const { error } = await need().from("comments").delete().eq("id", id);
    if (error) throw error;
  },
  forPosts: async (ids) => {
    const { data, error } = await need().from("comments").select("*, author:profiles!comments_author_id_fkey(*), comment_likes(user_id)").in("post_id", ids).order("created_at");
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
  editMessage: async (messageId, text) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { error } = await sb.from("messages").update({ text, edited: true }).eq("id", messageId).eq("sender_id", uid);
    if (error) throw error;
  },
  deleteMessage: async (messageId) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { error } = await sb.from("messages").delete().eq("id", messageId).eq("sender_id", uid);
    if (error) throw error;
  },
  deleteConversation: async (conversationId) => {
    const { error } = await need().from("conversations").delete().eq("id", conversationId);
    if (error) throw error;
  },
  createConversation: async (memberIds, name = null) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const others = [...new Set(memberIds)].filter((id) => id && id !== uid);
    const isGroup = others.length > 1;
    const { data: conv, error } = await sb
      .from("conversations")
      .insert({ is_group: isGroup, name, created_by: uid })
      .select()
      .single();
    if (error) throw error;
    // creator's own membership first (so is_conversation_member passes for the rest)
    const { error: e1 } = await sb.from("conversation_members").insert({ conversation_id: conv.id, user_id: uid });
    if (e1) throw e1;
    if (others.length) {
      const { error: e2 } = await sb.from("conversation_members").insert(others.map((id) => ({ conversation_id: conv.id, user_id: id })));
      if (e2) throw e2;
    }
    return conv;
  },
  // Realtime: ახალ მესიჯებზე გამოწერა
  subscribe: (conversationId, onChange) =>
    need()
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (p) => onChange(p.eventType, p.new, p.old)
      )
      .subscribe(),
  typingChannel: (conversationId) => need().channel(`typing:${conversationId}`, { config: { broadcast: { self: false } } }),
  markRead: async (conversationId) => {
    const sb = need(); const uid = (await sb.auth.getUser()).data.user.id;
    const { error } = await sb.from("conversation_members").update({ last_read_at: new Date().toISOString() }).eq("conversation_id", conversationId).eq("user_id", uid);
    if (error) throw error;
  },
  peerRead: async (conversationId) => {
    const sb = need(); const uid = (await sb.auth.getUser()).data.user.id;
    const { data, error } = await sb.from("conversation_members").select("last_read_at").eq("conversation_id", conversationId).neq("user_id", uid);
    if (error) throw error;
    let max = null;
    (data || []).forEach(r => { if (r.last_read_at && (!max || r.last_read_at > max)) max = r.last_read_at; });
    return max;
  },
  react: async (messageId, emoji) => {
    const sb = need(); const uid = (await sb.auth.getUser()).data.user.id;
    const { data: ex } = await sb.from("message_reactions").select("emoji").eq("message_id", messageId).eq("user_id", uid).maybeSingle();
    if (ex && ex.emoji === emoji) { await sb.from("message_reactions").delete().eq("message_id", messageId).eq("user_id", uid); return { removed: true }; }
    await sb.from("message_reactions").upsert({ message_id: messageId, user_id: uid, emoji }, { onConflict: "message_id,user_id" });
    return { removed: false };
  },
  reactionsFor: async (messageIds) => {
    if (!messageIds || !messageIds.length) return [];
    const { data, error } = await need().from("message_reactions").select("message_id,user_id,emoji").in("message_id", messageIds);
    if (error) throw error;
    return data || [];
  },
};

/* ───────────── NOTIFICATIONS ───────────── */
export const notifications = {
  list: async () => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data, error } = await sb
      .from("notifications")
      .select("*, from:profiles!notifications_from_id_fkey(*), post:posts!notifications_post_id_fkey(id, image_url, text)")
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

export const presence = {
  join: (userId, onChange) => {
    const ch = need().channel("online-users", { config: { presence: { key: userId } } });
    ch.on("presence", { event: "sync" }, () => { try { onChange(Object.keys(ch.presenceState())); } catch (e) {} });
    ch.subscribe((status) => { if (status === "SUBSCRIBED") ch.track({ at: Date.now() }); });
    return ch;
  },
};

export const locations = {
  share: async (lat, lng) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { error } = await sb.from("user_locations").upsert({ user_id: uid, lat, lng, shared: true, updated_at: new Date().toISOString() });
    if (error) throw error;
  },
  stop: async () => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { error } = await sb.from("user_locations").update({ shared: false }).eq("user_id", uid);
    if (error) throw error;
  },
  mine: async () => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data } = await sb.from("user_locations").select("*").eq("user_id", uid).maybeSingle();
    return data;
  },
  shared: async () => {
    const { data, error } = await need().from("user_locations").select("*, profile:profiles!user_locations_user_id_fkey(*)").eq("shared", true);
    if (error) throw error;
    return data || [];
  },
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
  update: async (id, patch) => { const { error } = await need().from("listings").update(patch).eq("id", id); if (error) throw error; },
  remove: async (id) => { const { error } = await need().from("listings").delete().eq("id", id); if (error) throw error; },
  listings: async () => {
    const { data, error } = await need()
      .from("listings")
      .select("*, seller:profiles!listings_seller_id_fkey(*)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  listingsPage: async (before, limit = 10) => {
    let q = need()
      .from("listings")
      .select("*, seller:profiles!listings_seller_id_fkey(*)")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (before) q = q.lt("created_at", before);
    const { data, error } = await q;
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
  search: async (q, limit = 20) => {
    const t = "%" + String(q).replace(/[%,()]/g, "") + "%";
    const { data, error } = await need().from("listings").select("*, seller:profiles!listings_seller_id_fkey(*)").or(`title.ilike.${t},category.ilike.${t}`).order("created_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return data || [];
  },
};

/* ───────────── FILMS (user-submitted movie catalog) ───────────── */
export const films = {
  update: async (id, patch) => { const { error } = await need().from("films").update(patch).eq("id", id); if (error) throw error; },
  remove: async (id) => { const { error } = await need().from("films").delete().eq("id", id); if (error) throw error; },
  byId: async (id) => {
    const { data, error } = await need().from("films").select("*, author:profiles!films_author_id_fkey(*)").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
  },
  // filters are applied as plain eq/ilike — no or() here (fragile with PostgREST, see git history)
  page: async (before, { genre, year, search } = {}, limit = 12) => {
    let q = need().from("films").select("*, author:profiles!films_author_id_fkey(*)").order("created_at", { ascending: false }).limit(limit);
    if (genre && genre !== "ყველა") q = q.eq("genre", genre);
    if (year) q = q.eq("year", year);
    if (search && search.trim()) q = q.ilike("title", "%" + search.trim().replace(/[%]/g, "") + "%");
    if (before) q = q.lt("created_at", before);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  },
  create: async (film) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data, error } = await sb.from("films").insert({ ...film, author_id: uid }).select().single();
    if (error) throw error;
    return data;
  },
  reviews: async (filmId) => {
    const { data, error } = await need()
      .from("film_reviews")
      .select("*, author:profiles!film_reviews_author_id_fkey(*)")
      .eq("film_id", filmId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  addReview: async (filmId, rating, text) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data, error } = await sb.from("film_reviews").insert({ film_id: filmId, author_id: uid, rating, text }).select().single();
    if (error) throw error;
    return data;
  },
  myWatch: async () => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data, error } = await sb.from("film_watch").select("film_id, status").eq("user_id", uid);
    if (error) throw error;
    return data || [];
  },
  setWatch: async (filmId, status) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { error } = await sb.from("film_watch").upsert({ film_id: filmId, user_id: uid, status }, { onConflict: "film_id,user_id" });
    if (error) throw error;
  },
  clearWatch: async (filmId) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { error } = await sb.from("film_watch").delete().eq("film_id", filmId).eq("user_id", uid);
    if (error) throw error;
  },
};

/* ───────────── MUSIC (user-submitted songs, online streaming) ───────────── */
export const music = {
  update: async (id, patch) => { const { error } = await need().from("songs").update(patch).eq("id", id); if (error) throw error; },
  remove: async (id) => { const { error } = await need().from("songs").delete().eq("id", id); if (error) throw error; },
  byId: async (id) => {
    const { data, error } = await need().from("songs").select("*, author:profiles!songs_author_id_fkey(*)").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
  },
  // sort: "new" (created_at desc, default) | "popular" (plays desc). genre/artist/title
  // filtering happens client-side on the loaded page (same pattern as films/market)
  page: async (before, sort, limit = 20) => {
    let q = need().from("songs").select("*, author:profiles!songs_author_id_fkey(*)").limit(limit);
    q = sort === "popular" ? q.order("plays", { ascending: false }).order("created_at", { ascending: false }) : q.order("created_at", { ascending: false });
    if (before) q = sort === "popular" ? q.lt("plays", before) : q.lt("created_at", before);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  },
  create: async (song) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data, error } = await sb.from("songs").insert({ ...song, author_id: uid }).select().single();
    if (error) throw error;
    return data;
  },
  incrementPlays: async (id) => { const { error } = await need().rpc("increment_song_plays", { p_song_id: id }); if (error) throw error; },
  search: async (q, limit = 20) => {
    const t = "%" + String(q).replace(/[%,()]/g, "") + "%";
    const { data, error } = await need().from("songs").select("*, author:profiles!songs_author_id_fkey(*)").or(`title.ilike.${t},artist.ilike.${t}`).order("created_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return data || [];
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
  create: async ({ image_url, filter, text, stickers, close_friends }) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data, error } = await sb.from("stories").insert({ author_id: uid, image_url, filter, text, stickers, close_friends: !!close_friends }).select().single();
    if (error) throw error;
    return data;
  },
  myLikes: async () => {
    const sb = need(); const uid = (await sb.auth.getUser()).data.user.id;
    const { data, error } = await sb.from("story_likes").select("story_id").eq("user_id", uid);
    if (error) throw error;
    return new Set((data || []).map(r => r.story_id));
  },
  toggleLike: async (storyId, on) => {
    const sb = need(); const uid = (await sb.auth.getUser()).data.user.id;
    if (on) { const { error } = await sb.from("story_likes").upsert({ story_id: storyId, user_id: uid }, { onConflict: "story_id,user_id" }); if (error) throw error; }
    else { const { error } = await sb.from("story_likes").delete().eq("story_id", storyId).eq("user_id", uid); if (error) throw error; }
  },
  comments: async (storyId) => {
    const { data, error } = await need().from("story_comments").select("*, author:profiles!story_comments_author_id_fkey(id,username,name,avatar_url)").eq("story_id", storyId).order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  },
  addComment: async (storyId, text) => {
    const sb = need(); const uid = (await sb.auth.getUser()).data.user.id;
    const { data, error } = await sb.from("story_comments").insert({ story_id: storyId, author_id: uid, text }).select("*, author:profiles!story_comments_author_id_fkey(id,username,name,avatar_url)").single();
    if (error) throw error;
    return data;
  },
};

/* ───────────── REELS ───────────── */
export const reels = {
  list: async () => {
    const { data, error } = await need()
      .from("reels")
      .select("*, author:profiles!reels_author_id_fkey(*), reel_likes(count), reel_comments(count)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  listPage: async (before, limit = 6) => {
    let q = need()
      .from("reels")
      .select("*, author:profiles!reels_author_id_fkey(*), reel_likes(count), reel_comments(count)")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (before) q = q.lt("created_at", before);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  },
  addView: async (reelId) => { const sb = need(); await sb.rpc("add_reel_view", { rid: reelId }); },
  byAuthor: async (authorId) => {
    const { data, error } = await need()
      .from("reels")
      .select("*, author:profiles!reels_author_id_fkey(*), reel_likes(count), reel_comments(count)")
      .eq("author_id", authorId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },
  toggleSave: async (reelId) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data: ex } = await sb.from("reel_saves").select("reel_id").eq("reel_id", reelId).eq("user_id", uid).maybeSingle();
    if (ex) { await sb.from("reel_saves").delete().eq("reel_id", reelId).eq("user_id", uid); return false; }
    await sb.from("reel_saves").insert({ reel_id: reelId, user_id: uid });
    return true;
  },
  mySaves: async () => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data, error } = await sb.from("reel_saves").select("reel_id").eq("user_id", uid);
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
  update: async (id, patch) => {
    const { error } = await need().from("reels").update(patch).eq("id", id);
    if (error) throw error;
  },
  remove: async (id) => {
    const { error } = await need().from("reels").delete().eq("id", id);
    if (error) throw error;
  },
  comments: async (reelId) => {
    const { data, error } = await need()
      .from("reel_comments")
      .select("*, author:profiles!reel_comments_author_id_fkey(*)")
      .eq("reel_id", reelId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  },
  addComment: async (reelId, text) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data, error } = await sb.from("reel_comments").insert({ reel_id: reelId, author_id: uid, text }).select("*, author:profiles!reel_comments_author_id_fkey(*)").single();
    if (error) throw error;
    return data;
  },
};

/* ───────────── GROUPS ───────────── */
export const groups = {
  update: async (id, patch) => { const { error } = await need().from("groups").update(patch).eq("id", id); if (error) throw error; },
  remove: async (id) => { const { error } = await need().from("groups").delete().eq("id", id); if (error) throw error; },
  updatePost: async (id, patch) => { const { error } = await need().from("group_posts").update(patch).eq("id", id); if (error) throw error; },
  removePost: async (id) => { const { error } = await need().from("group_posts").delete().eq("id", id); if (error) throw error; },
  list: async () => {
    const { data, error } = await need()
      .from("groups")
      .select("*, group_members(user_id, status, role)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  members: async (groupId) => {
    const { data, error } = await need().from("group_members").select("user_id, status, role, profile:profiles!group_members_user_id_fkey(*)").eq("group_id", groupId).order("status", { ascending: true });
    if (error) throw error;
    return data || [];
  },
  requestJoin: async (groupId, isPrivate) => {
    const sb = need(); const uid = (await sb.auth.getUser()).data.user.id;
    const status = isPrivate ? "pending" : "approved";
    const { error } = await sb.from("group_members").insert({ group_id: groupId, user_id: uid, status });
    if (error) throw error;
    return status;
  },
  leave: async (groupId) => { const sb = need(); const uid = (await sb.auth.getUser()).data.user.id; const { error } = await sb.from("group_members").delete().eq("group_id", groupId).eq("user_id", uid); if (error) throw error; },
  approve: async (groupId, userId) => { const sb = need(); const { error } = await sb.from("group_members").update({ status: "approved" }).eq("group_id", groupId).eq("user_id", userId); if (error) throw error; try { await sb.rpc("notify_group_event", { target: userId, gid: groupId, kind: "group_approved" }); } catch (e) {} },
  kick: async (groupId, userId) => { const { error } = await need().from("group_members").delete().eq("group_id", groupId).eq("user_id", userId); if (error) throw error; },
  setPrivate: async (groupId, val) => { const { error } = await need().from("groups").update({ is_private: val }).eq("id", groupId); if (error) throw error; },
  toggleJoin: async (groupId) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data: ex } = await sb.from("group_members").select("user_id").eq("group_id", groupId).eq("user_id", uid).maybeSingle();
    if (ex) { await sb.from("group_members").delete().eq("group_id", groupId).eq("user_id", uid); return false; }
    await sb.from("group_members").insert({ group_id: groupId, user_id: uid, status: "approved" });
    return true;
  },
  post: async (groupId, { text, imageUrl }) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data, error } = await sb.from("group_posts").insert({ group_id: groupId, author_id: uid, text, image_url: imageUrl }).select("*, author:profiles!group_posts_author_id_fkey(*)").single();
    if (error) throw error;
    return data;
  },
  create: async ({ name, about, category, coverUrl }) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data, error } = await sb.from("groups").insert({ name, about, category, cover_url: coverUrl, created_by: uid }).select("*, group_members(user_id), group_posts(*, author:profiles!group_posts_author_id_fkey(*))").single();
    if (error) throw error;
    await sb.from("group_members").insert({ group_id: data.id, user_id: uid });
    return data;
  },
};

/* ───────────── EVENTS ───────────── */
export const events = {
  update: async (id, patch) => { const { error } = await need().from("events").update(patch).eq("id", id); if (error) throw error; },
  remove: async (id) => { const { error } = await need().from("events").delete().eq("id", id); if (error) throw error; },
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
  create: async ({ title, about, location, startsAt, coverUrl }) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data, error } = await sb.from("events").insert({ title, about, location, starts_at: startsAt, cover_url: coverUrl, host_id: uid }).select("*, host:profiles!events_host_id_fkey(*), event_rsvps(user_id, status)").single();
    if (error) throw error;
    return data;
  },
};

/* ───────────── FORUM ───────────── */
export const forum = {
  update: async (id, patch) => { const { error } = await need().from("threads").update(patch).eq("id", id); if (error) throw error; },
  remove: async (id) => { const { error } = await need().from("threads").delete().eq("id", id); if (error) throw error; },
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
export const highlights = {
  forUser: async (ownerId) => {
    const { data, error } = await need().from("highlights").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  create: async ({ title, cover_url }) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { data, error } = await sb.from("highlights").insert({ owner_id: uid, title, cover_url }).select().single();
    if (error) throw error;
    return data;
  },
  remove: async (id) => {
    const { error } = await need().from("highlights").delete().eq("id", id);
    if (error) throw error;
  },
};

// Supabase Storage rejects object keys containing spaces/brackets/unicode etc,
// so strip the original filename down to a safe [a-zA-Z0-9._-] slug and keep the extension.
function safeStorageName(name) {
  const dot = name.lastIndexOf(".");
  const ext = dot > -1 ? name.slice(dot + 1).replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) : "";
  const base = (dot > -1 ? name.slice(0, dot) : name).replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  return (base || "file") + (ext ? "." + ext : "");
}

export const storage = {
  upload: async (file, folder = "uploads") => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const path = `${uid}/${folder}/${Date.now()}-${safeStorageName(file.name)}`;
    const { error } = await sb.storage.from("media").upload(path, file, { upsert: false });
    if (error) throw error;
    return sb.storage.from("media").getPublicUrl(path).data.publicUrl;
  },
};

/* ───────────── CALLS (WebRTC signaling via broadcast) ───────────── */
export const calls = {
  channel: (id) => need().channel("rtc:" + id, { config: { broadcast: { self: false } } }),
};

/* ───────────── XP + DAILY QUESTS ───────────── */
export const xp = {
  add: async (amount) => { const sb = need(); const uid = (await sb.auth.getUser()).data.user.id; await sb.rpc("add_xp", { uid, amount }); },
  notifyLevelUp: async (level) => { const { error } = await need().rpc("notify_level_up", { p_level: level }); if (error) throw error; },
};
export const quests = {
  today: async () => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const iso = start.toISOString(); const day = iso.slice(0, 10);
    const [posts, follows, likes, claims] = await Promise.all([
      sb.from("posts").select("id", { count: "exact", head: true }).eq("author_id", uid).gte("created_at", iso),
      sb.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", uid).gte("created_at", iso),
      sb.from("reactions").select("post_id, posts!inner(author_id)", { count: "exact", head: true }).eq("posts.author_id", uid).gte("created_at", iso),
      sb.from("quest_claims").select("quest").eq("user_id", uid).eq("day", day),
    ]);
    return {
      postsToday: posts.count || 0,
      followersToday: follows.count || 0,
      likesToday: likes.count || 0,
      claimed: (claims.data || []).map(c => c.quest),
    };
  },
  claim: async (quest, amount) => {
    const sb = need();
    const uid = (await sb.auth.getUser()).data.user.id;
    const { error } = await sb.from("quest_claims").insert({ user_id: uid, quest, xp: amount });
    if (error) { if (error.code === "23505") return false; throw error; }
    await sb.rpc("add_xp", { uid, amount });
    return true;
  },
};

/* ───────────── ADMIN ───────────── */
export const admin = {
  setBanned: async (id, v) => { const { error } = await need().from("profiles").update({ banned: v }).eq("id", id); if (error) throw error; },
  grantXp: async (id, amount) => { const { error } = await need().rpc("add_xp", { uid: id, amount }); if (error) throw error; },
  setXp: async (id, amount) => { const { error } = await need().rpc("admin_set_xp", { target: id, amount }); if (error) throw error; },
  deleteUser: async (id) => { const { error } = await need().rpc("admin_delete_user", { target: id }); if (error) throw error; },
  broadcast: async (msg) => { const { data, error } = await need().rpc("admin_broadcast", { msg }); if (error) throw error; return data; },
  stats: async () => { const { data, error } = await need().rpc("admin_stats"); if (error) throw error; return data; },
  // 14-day daily buckets (new users/posts/comments) for the analytics dashboard's trend chart
  dailyTrends: async () => { const { data, error } = await need().rpc("admin_daily_trends"); if (error) throw error; return data || []; },
  deleteListing: async (id) => { const { error } = await need().from("listings").delete().eq("id", id); if (error) throw error; },
  deleteThread: async (id) => { const { error } = await need().from("threads").delete().eq("id", id); if (error) throw error; },
  deleteReel: async (id) => { const { error } = await need().from("reels").delete().eq("id", id); if (error) throw error; },
  deletePost: async (id) => { const { error } = await need().from("posts").delete().eq("id", id); if (error) throw error; },
  deleteComment: async (id) => { const { error } = await need().from("comments").delete().eq("id", id); if (error) throw error; },
  deleteStory: async (id) => { const { error } = await need().from("stories").delete().eq("id", id); if (error) throw error; },
  pendingPublic: async () => { const { data, error } = await need().from("posts").select("*, author:profiles!posts_author_id_fkey(*)").eq("public_status", "pending").order("created_at", { ascending: false }); if (error) throw error; return data || []; },
  reviewPublic: async (id, approve) => { const { error } = await need().rpc("admin_review_public", { post_id: id, approve }); if (error) throw error; },
};

/* ───────────── PUSH SUBSCRIPTIONS ───────────── */
export const push = {
  subscribe: async (sub) => {
    const s = need(); const uid = (await s.auth.getUser()).data.user.id;
    const j = sub.toJSON ? sub.toJSON() : sub;
    const { error } = await s.from("push_subscriptions").upsert(
      { endpoint: j.endpoint, user_id: uid, p256dh: j.keys.p256dh, auth: j.keys.auth },
      { onConflict: "endpoint" }
    );
    if (error) throw error;
  },
  unsubscribe: async (endpoint) => { const { error } = await need().from("push_subscriptions").delete().eq("endpoint", endpoint); if (error) throw error; },
};

/* ───────────── LANGUAGE LEARNING ───────────── */
export const languages = {
  progress: async (lang) => {
    const sb = need(); const uid = (await sb.auth.getUser()).data.user.id;
    const { data, error } = await sb.from("lang_word_progress").select("word_id,mastery,updated_at").eq("user_id", uid).eq("lang", lang);
    if (error) throw error;
    return Object.fromEntries((data || []).map(r => [r.word_id, { mastery: r.mastery, ts: new Date(r.updated_at).getTime() }]));
  },
  saveProgress: async (lang, wordId, mastery) => {
    const sb = need(); const uid = (await sb.auth.getUser()).data.user.id;
    const { error } = await sb.from("lang_word_progress").upsert(
      { user_id: uid, lang, word_id: wordId, mastery, updated_at: new Date().toISOString() },
      { onConflict: "user_id,lang,word_id" }
    );
    if (error) throw error;
  },
  leaderboard: async (lang, limit = 20) => {
    const { data, error } = await need().rpc("lang_leaderboard", { p_lang: lang, p_limit: limit });
    if (error) throw error;
    return data || [];
  },
  getSetting: async (key) => {
    const { data, error } = await need().from("app_settings").select("value").eq("key", key).maybeSingle();
    if (error) throw error;
    return data ? data.value : null;
  },
  setSetting: async (key, value) => {
    const { error } = await need().from("app_settings").upsert({ key, value });
    if (error) throw error;
  },
  adminProgress: async () => {
    const { data, error } = await need().rpc("admin_lang_progress");
    if (error) throw error;
    return data || [];
  },
};
