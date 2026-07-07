import { useState, useRef } from "react";
import { followsApi, profilesApi, mergeProfile, USERS, ME, hasSupabase, t } from "../ui/core";

// Follow graph, block/mute lists, close friends, saved-post collections, and
// account-level actions (export data, set birthday, delete account).
// reloadFeed/setMeProfile/setSavedPosts are owned by other hooks (feed, auth
// session) but need updating here after a block/unblock or birthday change.
export function useSocialGraph({ flash, dbErr, gainXp, reloadFeed, setMeProfile, setSavedPosts }) {
  const [following, setFollowing] = useState([]);
  const followingRef = useRef(following); followingRef.current = following;
  const [blockedIds, setBlockedIds] = useState([]);
  const [mutedIds, setMutedIds] = useState([]);
  const [closeFriends, setCloseFriends] = useState([]);
  const [collections, setCollections] = useState([]);
  const [followerCounts, setFollowerCounts] = useState({});

  const isFollowing = (id) => following.includes(id);
  const toggleFollow = (id) => {
    const now = following.includes(id);
    setFollowing(f => now ? f.filter(x => x !== id) : [...f, id]);
    setFollowerCounts(fc => ({ ...fc, [id]: (fc[id] != null ? fc[id] : USERS[id].followers) + (now ? -1 : 1) }));
    if (!now) gainXp(2);
    followsApi.toggle(id).catch(dbErr("გამოწერა"));
  };
  const onBlock = (id) => { setBlockedIds(b => b.includes(id) ? b : [...b, id]); setFollowing(f => f.filter(x => x !== id)); setMutedIds(m => m.filter(x => x !== id)); flash(t("toast.blocked")); if (hasSupabase) profilesApi.block(id).then(reloadFeed).catch(dbErr("დაბლოკვა")); };
  const onUnblock = (id) => { setBlockedIds(b => b.filter(x => x !== id)); flash(t("toast.unblocked")); if (hasSupabase) profilesApi.unblock(id).then(reloadFeed).catch(dbErr("განბლოკვა")); };
  const onMute = (id) => { setMutedIds(m => m.includes(id) ? m : [...m, id]); flash(t("toast.muted")); if (hasSupabase) profilesApi.mute(id).catch(dbErr("გაჩუმება")); };
  const onUnmute = (id) => { setMutedIds(m => m.filter(x => x !== id)); flash(t("toast.unmuted")); if (hasSupabase) profilesApi.unmute(id).catch(dbErr("ხმის აღდგენა")); };
  const onToggleCloseFriend = (id) => { const now = closeFriends.includes(id); setCloseFriends(c => now ? c.filter(x => x !== id) : [...c, id]); flash(now ? t("toast.closeFriendRemoved") : t("toast.closeFriendAdded")); if (hasSupabase) (now ? profilesApi.removeCloseFriend(id) : profilesApi.addCloseFriend(id)).catch(dbErr("ახლო მეგობრები")); };
  const onExportData = async () => { try { flash(t("toast.dataPreparing")); const d = await profilesApi.exportData(); const blob = new Blob([JSON.stringify(d, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "mzera-data.json"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 3000); flash(t("toast.dataDownloaded")); } catch (e) { dbErr("ექსპორტი")(e); } };
  const onSetBirthday = (date) => { mergeProfile({ id: ME, birthday: date || null }); setMeProfile(p => ({ ...p, birthday: date || null })); profilesApi.update(ME, { birthday: date || null }).then(() => flash(t("toast.birthdaySaved"))).catch(dbErr("დაბადების დღე")); };
  const onToggleShowProfileVisits = (on) => { mergeProfile({ id: ME, show_profile_visits: on }); setMeProfile(p => ({ ...p, showProfileVisits: on })); profilesApi.update(ME, { show_profile_visits: on }).catch(dbErr("კონფიდენციალურობა")); };
  // the "დახურული ანგარიში" toggle used to only flip a local mz_settings
  // flag — nothing ever read it, so nobody's content was actually gated.
  // Now it writes profiles.is_private, which the posts/reels/album RLS
  // policies (and the profile page's own gate) both check for real.
  const onToggleIsPrivate = (on) => { mergeProfile({ id: ME, is_private: on }); profilesApi.update(ME, { is_private: on }).then(() => flash(on ? t("toast.accountNowPrivate") : t("toast.accountNowPublic"))).catch(dbErr("კონფიდენციალურობა")); };
  const onDeleteAccount = async () => { try { await profilesApi.deleteAccount(); if (typeof location !== "undefined") location.reload(); } catch (e) { dbErr("ანგარიშის წაშლა")(e); } };
  const onCreateCollection = async (name) => { if (!name || !name.trim()) return null; try { const c = await profilesApi.createCollection(name.trim()); setCollections(cs => [...cs, c]); flash(t("toast.folderCreated")); return c; } catch (e) { dbErr("ფოლდერი")(e); return null; } };
  const onAssignCollection = (postId, collectionId) => { setSavedPosts(sp => sp.map(p => p.id === postId ? { ...p, collectionId } : p)); if (hasSupabase) profilesApi.setSaveCollection(postId, collectionId).catch(dbErr("ფოლდერი")); flash(collectionId ? t("toast.movedToFolder") : t("toast.removedFromFolder")); };

  return {
    following, setFollowing, followingRef,
    blockedIds, setBlockedIds, mutedIds, setMutedIds,
    closeFriends, setCloseFriends, collections, setCollections,
    followerCounts, setFollowerCounts,
    isFollowing, toggleFollow, onBlock, onUnblock, onMute, onUnmute,
    onToggleCloseFriend, onExportData, onSetBirthday, onToggleShowProfileVisits, onToggleIsPrivate, onDeleteAccount,
    onCreateCollection, onAssignCollection,
  };
}
