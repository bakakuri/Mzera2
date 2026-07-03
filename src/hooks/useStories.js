import { useState } from "react";
import { storiesApi, mapDbStories, hydrateAuthors, hasSupabase, t } from "../ui/core";

export function useStories({ flash, dbErr, setDbError, gainXp }) {
  const [stories, setStories] = useState([]);
  const [storyId, setStoryId] = useState(null);
  const [storyEditorOpen, setStoryEditorOpen] = useState(false);

  const loadStories = async () => { if (!hasSupabase) return; try { let rows; try { rows = await storiesApi.list(); } catch (em) { rows = await hydrateAuthors(await storiesApi.listPlain(), "author_id", "author"); } setStories(mapDbStories(rows)); } catch (e) { console.error("stories:", e); setDbError("stories: " + (e.message || JSON.stringify(e)) + (e.hint ? " · hint: " + e.hint : "") + (e.code ? " · code: " + e.code : "")); } };
  const openStory = (id) => setStoryId(id);
  const markSeen = (id) => setStories(s => s.map(x => x.id === id ? { ...x, seen: true } : x));
  const onAddStory = (item) => { if (!item.image && !(item.text && item.text.trim()) && !(item.stickers && item.stickers.length)) { flash(t("toast.storyNeedsContent")); return; } setStoryEditorOpen(false); gainXp(8); flash(item.close_friends ? t("toast.storyAddedCloseFriends") : t("toast.storyAdded")); storiesApi.create({ image_url: item.image || null, filter: item.filter, text: item.text, stickers: item.stickers, close_friends: item.close_friends }).then(loadStories).catch(dbErr("story")); };

  const story = stories.find(s => s.id === storyId);

  return { stories, story, storyId, setStoryId, storyEditorOpen, setStoryEditorOpen, loadStories, openStory, markSeen, onAddStory };
}
