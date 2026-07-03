import { useState, useEffect } from "react";
import { presenceApi, profilesApi, mergeProfile, USERS, ME } from "../ui/core";

export function usePresence({ session }) {
  const [onlineIds, setOnlineIds] = useState([]);

  useEffect(() => {
    if (!session) return;
    const ch = presenceApi.join(session.user.id, async (ids) => {
      setOnlineIds(ids);
      const missing = ids.filter(id => USERS[id].id !== id);
      if (missing.length) { try { (await profilesApi.byIds(missing)).forEach(mergeProfile); setOnlineIds([...ids]); } catch (e) {} }
    });
    return () => { try { ch.unsubscribe(); } catch (e) {} };
  }, [session]);

  const onlineCount = onlineIds.filter(id => id !== ME && USERS[id].id === id).length;

  return { onlineIds, onlineCount };
}
